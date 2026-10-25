import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIosShareReadiness } from './incoming-share-readiness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');

function eventBus({ fired = false } = {}) {
  const handlers = new Map();
  const name = 'ablage.geladen';
  return {
    horche(event, cb, opts) {
      assert.equal(event, name);
      assert.deepEqual(opts, { nachreichen: true });
      handlers.set(event, cb);
      if (fired) cb({ blocks: 5 });
    },
    emit() { handlers.get(name)?.({ blocks: 5 }); }
  };
}

test('global Store may exist, but Share Sheet waits for asynchronous load event', () => {
  const bus = eventBus();
  const gate = createIosShareReadiness({ events: bus });
  assert.equal(gate.ready(), false);
  bus.emit();
  assert.equal(gate.ready(), true);
});

test('already-loaded local database replays readiness immediately on late native setup', () => {
  const gate = createIosShareReadiness({ events: eventBus({ fired: true }) });
  assert.equal(gate.ready(), true);
});

test('missing or broken event bus fails closed; no premature native receipt', () => {
  assert.equal(createIosShareReadiness({}).ready(), false);
  assert.equal(createIosShareReadiness({ events: {} }).ready(), false);
  const broken = { horche() { throw new Error('event bus unavailable'); } };
  assert.equal(createIosShareReadiness({ events: broken }).ready(), false);
});

test('native iPhone bridge is gated by real Store load, persistent storage and getBlock', () => {
  const native = source('ios/native-sicherung.ts');
  assert.match(native, /createIosShareReadiness/);
  assert.match(native, /readiness\.ready\(\)/);
  assert.match(native, /typeof store\.getBlock !== 'function'/);
  assert.match(native, /typeof store\.speichertNicht !== 'function'/);
  assert.match(native, /ARTEN\.ablageGeladen/);
  const indexed = source('src/kern/ablage/indexdb.ts');
  assert.match(indexed, /Ereignisse\.melde\(ARTEN\.ablageGeladen/);
});

test('Share Sheet block IDs are accepted by the REAL Redion Store and share one commit', () => {
  const indexed = source('src/kern/ablage/indexdb.ts');
  const share = source('ios/incoming-share.mjs');
  assert.match(indexed, /const addPage = [^]*?const p = addBlock\(parentId, 'page', Object\.assign\(\{/);
  assert.match(indexed, /const addBlock = [^]*?const b = Object\.assign\(\{/);
  assert.match(indexed, /\}, patch\);/);
  assert.match(indexed, /const getBlock = \(id\??:/);
  assert.match(indexed, /const flush = \(\): Promise<unknown> => \{/);
  assert.match(indexed, /const t = tx\(faecher, 'readwrite'\)/);
  assert.match(indexed, /t\.oncomplete = \(\) => \{/);
  assert.match(share, /id: ids\.page/);
  assert.match(share, /id: ids\.content/);
  assert.match(share, /await store\.flush\(\)/);
  assert.doesNotMatch(share, /setMeta\(|getMeta\(|metaListeAendern/);
});

test('the system remains one shared Web UI, without a second native data store', () => {
  const native = source('ios/native-sicherung.ts');
  const incoming = source('ios/incoming-share.mjs');
  const web = source('index.html');
  assert.doesNotMatch(web, /incoming-share|RedionNativeShare|RedionWidgets/);
  assert.doesNotMatch(incoming, /indexedDB\.open|fetch\(|XMLHttpRequest|localStorage/);
  assert.match(native, /Capacitor\.getPlatform\(\) === 'ios'/);
  const config = JSON.parse(source('capacitor.config.json'));
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.equal(config.ios.path, 'build/ios-capacitor');
});
