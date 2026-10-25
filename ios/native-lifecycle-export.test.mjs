/*
 * Focused native iPhone regression cases.
 * Runs in Node without an iPhone, macOS, WebKit or any real user data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { startIosNativeFeel } from './native-feel.mjs';
import { createNativeFileExporter, safeFileName } from './native-file-export.mjs';

function nativeHarness() {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
    fire(records) { if (!this.disconnected) this.callback(records); }
  }
  const win = {
    matchMedia: () => ({ matches: false }),
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (windowListeners.get(type) === listener) windowListeners.delete(type);
    }
  };
  const doc = {
    documentElement: { dataset: { theme: 'dark' } },
    body: { dataset: {} },
    hidden: false,
    defaultView: win,
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (documentListeners.get(type) === listener) documentListeners.delete(type);
    }
  };
  const calls = [];
  const stop = startIosNativeFeel({
    document: doc,
    haptics: { async impact() {} },
    bars: { async setStyle(args) { calls.push(args); } },
    styles: { Dark: 'DARK', Light: 'LIGHT' },
    statusBar: 'StatusBar',
    Observer
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  return { doc, calls, observers, documentListeners, windowListeners, stop, settle };
}

test('returning from the app switcher restores status bar even without a theme change', async () => {
  const h = nativeHarness();
  await h.settle();
  assert.deepEqual(h.calls, [{ bar: 'StatusBar', style: 'DARK' }]);
  h.doc.hidden = true;
  h.documentListeners.get('visibilitychange')();
  await h.settle();
  assert.equal(h.calls.length, 1, 'Backgrounded app must not request UIKit updates.');
  h.doc.hidden = false;
  h.documentListeners.get('visibilitychange')();
  await h.settle();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1], { bar: 'StatusBar', style: 'DARK' });
  h.stop();
});

test('theme changes while suspended are picked up upon resuming', async () => {
  const h = nativeHarness();
  await h.settle();
  h.doc.hidden = true;
  h.doc.documentElement.dataset.theme = 'light';
  h.observers[0].fire([{ attributeName: 'data-theme' }]);
  await h.settle();
  assert.equal(h.calls.length, 1);
  h.doc.hidden = false;
  h.documentListeners.get('visibilitychange')();
  await h.settle();
  assert.equal(h.calls.at(-1).style, 'LIGHT');
  h.stop();
});

test('pageshow and focus resync the system appearance without navigating', async () => {
  const h = nativeHarness();
  await h.settle();
  h.windowListeners.get('pageshow')();
  h.windowListeners.get('focus')();
  await h.settle();
  assert.deepEqual(h.calls.map(call => call.style), ['DARK', 'DARK'],
    'Adjacent resume events coalesce into one native update.');
  h.stop();
  assert.equal(h.documentListeners.has('visibilitychange'), false);
  assert.equal(h.windowListeners.has('pageshow'), false);
  assert.equal(h.windowListeners.has('focus'), false);
  const total = h.calls.length;
  h.doc.hidden = false;
  h.observers[0].fire([{ attributeName: 'data-theme' }]);
  await h.settle();
  assert.equal(h.calls.length, total, 'Unsubscribed adapter must stay inactive.');
});

test('iPhone file name component preserves extensions within an APFS-safe UTF-8 budget', () => {
  const names = [
    '📝'.repeat(150) + '.pdf',
    '資料'.repeat(160) + '.docx',
    'Übung'.repeat(100) + '.xlsx',
    '𝄞'.repeat(120) + '.redion'
  ];
  for (const original of names) {
    const safe = safeFileName(original);
    assert.ok(Buffer.byteLength(safe, 'utf8') <= 180, safe);
    assert.ok(safe.endsWith(original.slice(original.lastIndexOf('.'))), safe);
    assert.equal(safe.includes('�'), false, 'Do not split surrogate pairs.');
  }
  assert.equal(safeFileName('../../Bericht.pdf'), 'Bericht.pdf');
});

test('native file export handles Unicode title and preserves exact file bytes', async () => {
  const files = new Map();
  let shared = null;
  const filesystem = {
    async mkdir() {},
    async writeFile({ path }) { files.set(path, Buffer.alloc(0)); },
    async appendFile({ path, data }) {
      files.set(path, Buffer.concat([files.get(path), Buffer.from(data, 'base64')]));
    },
    async stat({ path }) { return { size: files.get(path).length }; },
    async rename({ from, to }) { files.set(to, files.get(from)); files.delete(from); },
    async deleteFile({ path }) { files.delete(path); },
    async getUri({ path }) { return { uri: 'file:///Redion/' + path }; }
  };
  const exporter = createNativeFileExporter({
    filesystem,
    share: { async share(options) { shared = options; } },
    directory: 'DOCUMENTS',
    createId: () => '12345678-1234-1234-1234-123456789abc',
    now: () => new Date('2026-10-25T08:00:00.000Z')
  });
  const bytes = Buffer.from([0, 1, 2, 128, 255]);
  const result = await exporter(new Blob([bytes]), '📝'.repeat(200) + '.xlsx');
  assert.ok(Buffer.byteLength(result.path.split('/').at(-1), 'utf8') < 255);
  assert.ok(result.path.endsWith('.xlsx'));
  assert.deepEqual(files.get(result.path), bytes);
  assert.deepEqual(shared.files, ['file:///Redion/' + result.path]);
  assert.equal(files.size, 1, 'Partial file must not remain.');
});

test('a native failure during initial write removes only our temporary export', async () => {
  const removed = [];
  const exporter = createNativeFileExporter({
    filesystem: {
      async mkdir() {},
      async writeFile() { throw new Error('out of space'); },
      async deleteFile({ path }) { removed.push(path); }
    },
    share: { async share() { throw new Error('share should never run'); } },
    directory: 'DOCUMENTS',
    createId: () => '12345678-1234-1234-1234-123456789abc',
    now: () => new Date('2026-10-25T08:00:00.000Z')
  });
  await assert.rejects(exporter(new Blob(['test']), 'Bericht.pdf'), /out of space/);
  assert.equal(removed.length, 1);
  assert.match(removed[0], /^Exporte\/\..*\.teil$/);
});
