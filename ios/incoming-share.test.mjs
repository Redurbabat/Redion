import test from 'node:test';
import assert from 'node:assert/strict';
import { validIncomingShare, createIosShareInbox } from './incoming-share.mjs';

const id = '2dca9299-12ab-4b89-9e23-34a45f671234';
function harness({ failFlush = false, volatile = false, hidden = false } = {}) {
  const pages = [];
  const blocks = [];
  const seen = new Map();
  let flushes = 0;
  const store = {
    cache: { blocks: {} },
    speichertNicht: () => volatile,
    getMeta: (key, fallback) => seen.get(key) ?? fallback,
    setMeta: (key, value) => seen.set(key, value),
    addPage(_parent, props) {
      const page = { id: 'page-' + (pages.length + 1), ...props };
      pages.push(page);
      return page;
    },
    addBlock(pageId, type, props) { blocks.push({ pageId, type, ...props }); },
    async flush() {
      flushes++;
      if (failFlush) throw new Error('disk full');
    }
  };
  const doc = { hidden };
  let redraws = 0;
  const inbox = createIosShareInbox({
    store, document: doc,
    app: { zeichneBaum() { redraws++; }, oeffne() {} }
  });
  return { inbox, pages, blocks, seen, doc, redraws: () => redraws, flushes: () => flushes };
}

test('shared text becomes a normal local Redion page without executing markup', async () => {
  const h = harness();
  assert.equal(await h.inbox.receive({ id, kind: 'text', value: '<img src=x onerror=alert(1)>' }), true);
  assert.equal(h.pages.length, 1);
  assert.equal(h.blocks.length, 1);
  assert.equal(h.blocks[0].type, 'text');
  assert.equal(h.blocks[0].text, '<img src=x onerror=alert(1)>');
  assert.equal(h.flushes(), 1);
  assert.equal(h.redraws(), 1);
});

test('incoming web links stay inert text; no network or HTML preview', async () => {
  const h = harness();
  assert.equal(await h.inbox.receive({
    id, kind: 'url', value: 'https://example.org/wissen?x=1'
  }), true);
  assert.equal(h.blocks[0].type, 'text');
  assert.equal(h.blocks[0].text, 'https://example.org/wissen?x=1');
});

test('duplicate receipts are acknowledged without creating new pages', async () => {
  const h = harness();
  const item = { id, kind: 'text', value: 'Einmal aus Safari' };
  assert.equal(await h.inbox.receive(item), true);
  assert.equal(await h.inbox.receive(item), true);
  assert.equal(h.pages.length, 1);
  assert.equal(h.flushes(), 1);
});

test('invalid shares are rejected and never reach the data store', async () => {
  const h = harness();
  const cases = [
    null, {}, { id: '__proto__', kind: 'text', value: 'X' },
    { id, kind: 'file', value: 'secret.pdf' },
    { id, kind: 'url', value: 'javascript:alert(1)' },
    { id, kind: 'url', value: 'file:///private/data' },
    { id, kind: 'url', value: 'https://u:p@example.org/' },
    { id, kind: 'text', value: '' }, { id, kind: 'text', value: 'a'.repeat(60001) },
    { id, kind: 'url', value: 'https://example.org/' + 'a'.repeat(4100) }
  ];
  for (const item of cases) {
    assert.equal(validIncomingShare(item), null, JSON.stringify(item)?.slice(0, 100));
    assert.equal(await h.inbox.receive(item), false);
  }
  assert.equal(h.pages.length, 0);
});

test('background/volatile storage rejects shares without acknowledgement', async () => {
  for (const options of [{ hidden: true }, { volatile: true }]) {
    const h = harness(options);
    assert.equal(await h.inbox.receive({ id, kind: 'text', value: 'Bleibt erhalten' }), false);
    assert.equal(h.pages.length, 0);
  }
});

test('failed durable flush does not acknowledge the native App Group file', async () => {
  const h = harness({ failFlush: true });
  assert.equal(await h.inbox.receive({ id, kind: 'text', value: 'Prüfen' }), false);
  assert.equal(h.redraws(), 0);
});

test('in-flight repeats share one durable transaction', async () => {
  let finish;
  let runs = 0;
  const seen = new Map();
  const inbox = createIosShareInbox({
    document: { hidden: false },
    store: {
      speichertNicht: () => false,
      getMeta: (key, def) => seen.get(key) ?? def,
      setMeta: (key, value) => seen.set(key, value),
      addPage: () => { runs++; return { id: 'page-one' }; },
      addBlock: () => {},
      flush: () => new Promise(resolve => { finish = resolve; })
    }
  });
  const share = { id, kind: 'text', value: 'Gleichzeitig' };
  const a = inbox.receive(share), b = inbox.receive(share);
  assert.equal(runs, 1);
  finish();
  assert.equal(await a, true);
  assert.equal(await b, true);
});
