import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNativeDocumentInbox, validateDocument } from './native-documents.mts';
import { injectOpenDocuments, documentPlistCommands } from './install-open-documents.mts';
const { injectQuickActions } = await import(new URL('./install-home-shortcuts.mjs', import.meta.url).href);
const { injectIncomingShareWidget } = await import(new URL('./install-incoming-share-widget.mjs', import.meta.url).href);
const id = '11111111-2222-4333-8444-555555555555';
const item = { id, name: 'Studium.pdf', size: 3, path: 'NativeInbox/' + id + '/payload.pdf' };

test('incoming native file is bounded to UUID inbox, no paths or remote URLs', () => {
  assert.deepEqual(validateDocument(item), item);
  for (const value of [null, {}, { ...item, path: '../Backups/private.pdf' },
    { ...item, name: '../file.pdf' }, { ...item, size: -1 }, { ...item, size: 4 * 1024 ** 3 },
    { ...item, id: 'bad' }, { ...item, name: 'javascript.html' }, { ...item, path: 'https://example.org/a.pdf' }]) assert.equal(validateDocument(value), null);
});

test('native chunks use same importer once, wait for readiness, ACK only after completion', async () => {
  let ready = false, imports = 0, errors = 0;
  let finish!: () => void;
  const complete = new Promise<void>(resolve => { finish = resolve; });
  const inbox = createNativeDocumentInbox({ directory: 'DOCUMENTS', ready: () => ready,
    filesystem: {
      stat: async () => ({ size: 3 }),
      readFileInChunks: async (options, callback) => {
        assert.equal(options.chunkSize, 1024 * 1024);
        callback({ data: 'AQI=' }); callback({ data: 'Aw==' }); callback({ data: '' }); return 'callback';
      }
    },
    importFile: async file => { imports++; assert.equal(file.name, item.name); assert.deepEqual(new Uint8Array(await file.arrayBuffer()), Uint8Array.of(1, 2, 3)); await complete; },
    onError: () => { errors++; }
  });
  assert.equal(await inbox.receive(item), 'wait');
  ready = true;
  const first = inbox.receive(item), duplicate = inbox.receive(item);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(imports, 1);
  finish();
  assert.equal(await first, 'done'); assert.equal(await duplicate, 'done');
  assert.equal(await inbox.receive(item), 'done'); assert.equal(imports, 1); assert.equal(errors, 0);
});

test('truncated file or failed importer never ACKs a successful transfer', async () => {
  let imports = 0, errors = 0;
  const inbox = createNativeDocumentInbox({ directory: 'DOCUMENTS', ready: () => true,
    filesystem: { stat: async () => ({ size: 3 }), readFileInChunks: async (_options, callback) => {
      callback({ data: 'AQI=' }); callback({ data: '' }); return 'callback';
    } }, importFile: async () => { imports++; }, onError: () => { errors++; }
  });
  assert.equal(await inbox.receive(item), 'error'); assert.equal(imports, 0); assert.equal(errors, 1);
  const failedImport = createNativeDocumentInbox({ directory: 'DOCUMENTS', ready: () => true,
    filesystem: { stat: async () => ({ size: 3 }), readFileInChunks: async (_options, callback) => {
      callback({ data: 'AQID' }); callback({ data: '' }); return 'callback';
    } }, importFile: async () => { throw new Error('IndexedDB-Schreibfehler'); }, onError: () => { errors++; }
  });
  assert.equal(await failedImport.receive(item), 'error'); assert.equal(errors, 2);
});

test('Swift injection preserves quick actions/share and covers cold, warm and foreground entries', () => {
  const base = fs.readFileSync(new URL('./fixtures/capacitor8-spm-scenedelegate.swift', import.meta.url), 'utf8');
  const helper = fs.readFileSync(new URL('./native-documents.swift', import.meta.url), 'utf8');
  for (const source of [injectQuickActions(base), injectIncomingShareWidget(injectQuickActions(base))]) {
    const patched = injectOpenDocuments(source, helper);
    assert.equal(patched.match(/RedionDocumentInbox.shared.accept/g)?.length, 2);
    assert.equal(patched.match(/func sceneDidBecomeActive/g)?.length, 1);
    assert.match(patched, /RedionDocumentInbox.shared.foreground/);
    assert.match(patched, /NSFileCoordinator/); assert.match(patched, /stopAccessingSecurityScopedResource/);
    assert.match(patched, /status == "done"/); assert.match(patched, /copyItem/);
    assert.match(patched, /REDION_NATIVE_HOME_SHORTCUTS/);
    assert.throws(() => injectOpenDocuments(patched, helper));
  }
  assert.throws(() => injectOpenDocuments('changed template', helper));
  assert.match(documentPlistCommands().join('\n'), /LSHandlerRank string Alternate/);
  assert.match(documentPlistCommands().join('\n'), /public.filename-extension:0 string redion/);
});
