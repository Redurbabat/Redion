import test from 'node:test';
import assert from 'node:assert/strict';
import { validIncomingShare, shareBlockIds, createIosShareInbox } from './incoming-share.mjs';

const id = '2dca9299-12ab-4b89-9e23-34a45f671234';
const incoming = (kind = 'text', value = 'Von Safari geteilt') => ({ id, kind, value });

function harness({ persisted = new Map(), failFlush = false, volatile = false,
                   hidden = false, blockFlush = false } = {}) {
  // Model the real Store's one pending batch and committed IndexedDB state,
  // including the fact that a failed flush leaves blocks in memory.
  const blocks = new Map([...persisted].map(([key, block]) => [key, structuredClone(block)]));
  const pending = new Set();
  const disk = new Map([...persisted].map(([key, block]) => [key, structuredClone(block)]));
  const counters = { pages: 0, children: 0, flushes: 0, redraws: 0 };
  let failure = failFlush;
  let release = null;
  const store = {
    cache: { blocks },
    speichertNicht: () => volatile,
    getBlock: key => blocks.get(key) ?? null,
    addPage(_parent, patch) {
      counters.pages++;
      const page = { type: 'page', content: [], alive: true, ...patch };
      blocks.set(page.id, page);
      pending.add(page.id);
      return page;
    },
    addBlock(parent, type, patch) {
      counters.children++;
      const child = { type, parentId: parent, ...patch };
      blocks.set(child.id, child);
      const page = blocks.get(parent);
      if (page && !page.content.includes(child.id)) {
        page.content.push(child.id);
        pending.add(page.id);
      }
      pending.add(child.id);
      return child;
    },
    async flush() {
      counters.flushes++;
      if (blockFlush) await new Promise(resolve => { release = resolve; });
      if (failure) throw new Error('IndexedDB quota exceeded');
      for (const key of pending) disk.set(key, structuredClone(blocks.get(key)));
      pending.clear();
    }
  };
  const doc = { hidden };
  const inbox = createIosShareInbox({
    store, document: doc,
    app: { zeichneBaum: () => { counters.redraws++; }, oeffne() {} }
  });
  return { inbox, store, doc, disk, pending, blocks, counters,
           resolve: () => release?.(), fail: state => { failure = state; } };
}

test('safe text creates normal Redion page and child in a single flush', async () => {
  const h = harness();
  const content = '<img src=x onerror=alert(1)>';
  assert.equal(await h.inbox.receive(incoming('text', content)), true);
  assert.deepEqual([h.counters.pages, h.counters.children, h.counters.flushes], [1, 1, 1]);
  const ids = shareBlockIds(id);
  const page = h.disk.get(ids.page), child = h.disk.get(ids.content);
  assert.equal(page.type, 'page');
  assert.equal(page.iosShareId, id);
  assert.deepEqual(page.content, [ids.content]);
  assert.equal(child.type, 'text');
  assert.equal(child.text, content);
  assert.equal(child.parentId, ids.page);
  assert.equal(h.counters.redraws, 1);
});

test('shared HTTP(S) URLs stay inert text without a preview or fetch', async () => {
  const h = harness();
  assert.equal(await h.inbox.receive(incoming('url', 'https://example.org/wissen?a=1')), true);
  const child = h.disk.get(shareBlockIds(id).content);
  assert.equal(child.type, 'text');
  assert.equal(child.text, 'https://example.org/wissen?a=1');
});

test('same ID is idempotent both immediately and after a simulated app restart', async () => {
  const h = harness();
  const item = incoming();
  assert.equal(await h.inbox.receive(item), true);
  assert.equal(await h.inbox.receive(item), true);
  assert.equal(h.counters.pages, 1);
  assert.equal(h.counters.children, 1);
  const restarted = harness({ persisted: h.disk });
  assert.equal(await restarted.inbox.receive(item), true);
  assert.equal(restarted.counters.pages, 0);
  assert.equal(restarted.counters.children, 0);
  assert.equal(restarted.disk.size, 2);
});

test('failed flush refuses ACK; retry persists same blocks, not duplicate pages', async () => {
  const h = harness({ failFlush: true });
  assert.equal(await h.inbox.receive(incoming()), false);
  assert.equal(h.disk.size, 0);
  assert.deepEqual([h.counters.pages, h.counters.children], [1, 1]);
  h.fail(false);
  assert.equal(await h.inbox.receive(incoming()), true);
  assert.equal(h.disk.size, 2);
  assert.deepEqual([h.counters.pages, h.counters.children], [1, 1]);
  assert.equal(h.counters.flushes, 2);
});

test('partial cached share is repaired before committing', async () => {
  const ids = shareBlockIds(id);
  const stored = new Map([[ids.page, {
    id: ids.page, type: 'page', iosShareId: id,
    text: 'Von iPhone geteilt', content: [], alive: true
  }]]);
  const h = harness({ persisted: stored });
  assert.equal(await h.inbox.receive(incoming()), true);
  assert.equal(h.counters.pages, 0);
  assert.equal(h.counters.children, 1);
  assert.ok(h.disk.has(ids.content));
});

test('colliding page or content ID is rejected without overwriting data', async () => {
  const ids = shareBlockIds(id);
  for (const bad of [
    [ids.page, { id: ids.page, type: 'page', iosShareId: 'different' }],
    [ids.content, { id: ids.content, type: 'text', iosShareId: 'other', parentId: ids.page }]
  ]) {
    const h = harness({ persisted: new Map([bad]) });
    assert.equal(await h.inbox.receive(incoming()), false);
    assert.equal(h.counters.pages, 0);
    assert.equal(h.counters.children, 0);
    assert.equal(h.counters.flushes, 0);
    assert.deepEqual(h.disk.get(bad[0]), bad[1]);
  }
});

test('invalid inputs, IDs and dangerous URLs never create user content', async () => {
  const h = harness();
  const samples = [
    null, {}, { id: '__proto__', kind: 'text', value: 'X' },
    incoming('file', 'private.pdf'), incoming('url', 'javascript:alert(1)'),
    incoming('url', 'file:///private/data'),
    incoming('url', 'https://user:pass@example.org'),
    incoming('text', ''), incoming('text', 'x'.repeat(60001)),
    incoming('url', 'https://example.org/' + 'a'.repeat(4100))
  ];
  for (const sample of samples) {
    assert.equal(validIncomingShare(sample), null);
    assert.equal(await h.inbox.receive(sample), false);
  }
  assert.equal(shareBlockIds('wrong'), null);
  assert.equal(h.counters.pages, 0);
});

test('background or volatile storage retains App Group item without ACK', async () => {
  for (const props of [{ hidden: true }, { volatile: true }]) {
    const h = harness(props);
    assert.equal(await h.inbox.receive(incoming()), false);
    assert.equal(h.counters.pages, 0);
  }
});

test('two deliveries in flight share a single write transaction', async () => {
  const h = harness({ blockFlush: true });
  const item = incoming();
  const first = h.inbox.receive(item), second = h.inbox.receive(item);
  assert.equal(h.counters.pages, 1);
  assert.equal(h.counters.children, 1);
  h.resolve();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.equal(h.counters.flushes, 1);
});

test('receipt requires getBlock and permanent Store.flush support', () => {
  assert.throws(() => createIosShareInbox({
    store: { addPage() {}, addBlock() {}, flush() {} }, document: {}
  }), /Speicher ist nicht bereit/);
});

test('store becoming memory-only during flush cannot cause a native ACK', async () => {
  const h = harness({ blockFlush: true });
  const op = h.inbox.receive(incoming());
  h.doc.hidden = true;
  // Hidden midflight is not itself loss; becoming nonpersistent is.
  h.store.speichertNicht = () => true;
  h.resolve();
  assert.equal(await op, false);
});
