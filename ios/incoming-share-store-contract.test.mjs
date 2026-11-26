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
  assert.match(native, /eventName: 'ablage\.geladen'/);
  const eventNames = source('src/kern/ereignisse/arten.ts');
  assert.match(eventNames, /ablageGeladen:\s*'ablage\.geladen'/);
  const indexed = source('src/kern/ablage/indexdb.ts');
  assert.match(indexed, /Ereignisse\.melde\(ARTEN\.ablageGeladen/);
});

function pageState() {
  const doc = {
    hidden: false,
    readyState: 'loading',
    elements: new Map([
      ['ru-vorhang', {
        hidden: false,
        classList: { contains: name => doc.splashDone && name === 'ru-vorhang-weg' }
      }]
    ]),
    splashDone: false,
    getElementById(id) { return this.elements.get(id) ?? null; }
  };
  return doc;
}

test('native bootstrap before deferred scripts retries lookup instead of getting stuck', () => {
  let available = null, calls = 0;
  const bus = eventBus({ fired: true });
  const gate = createIosShareReadiness({
    events: () => { calls++; return available; }
  });
  assert.equal(gate.ready(), false);
  available = bus;
  assert.equal(gate.ready(), true, 'late bus attaches and receives replay');
  assert.equal(gate.ready(), true);
  assert.equal(calls, 2, 'subscribe only once after successful attach');
});

test('TDZ or temporary lookup errors are retryable, not permanently fatal', () => {
  let broken = true;
  const gate = createIosShareReadiness({
    events: () => {
      if (broken) throw new ReferenceError('Cannot access deferred const before initialization');
      return eventBus({ fired: true });
    }
  });
  assert.equal(gate.ready(), false);
  broken = false;
  assert.equal(gate.ready(), true);
});

test('password lock and native splash prevent external Share Sheet writes', () => {
  const doc = pageState(), gate = createIosShareReadiness({
    events: eventBus({ fired: true }), document: doc
  });
  assert.equal(gate.ready(), false, 'DOMContentLoaded has not finished');
  doc.readyState = 'complete';
  assert.equal(gate.ready(), false, 'initial splash still covers Redion');
  doc.elements.set('sperrschirm', { id: 'sperrschirm' });
  doc.splashDone = true;
  assert.equal(gate.ready(), false, 'do not import before password unlock');
  doc.elements.delete('sperrschirm');
  assert.equal(gate.ready(), true, 'unlock plus startup finally accepts share');
  doc.hidden = true;
  assert.equal(gate.ready(), false, 'hidden app cannot import external data');
});

test('failed Redion startup keeps incoming App Group entries for retry', () => {
  const doc = pageState();
  doc.readyState = 'complete';
  const gate = createIosShareReadiness({
    events: eventBus({ fired: true }), document: doc
  });
  assert.equal(gate.ready(), false);
  doc.elements.get('ru-vorhang').hidden = true;
  assert.equal(gate.ready(), true);
});

test('iOS bootstrap and deferred web scripts remain separate', () => {
  const native = source('ios/native-sicherung.ts');
  const web = source('index.html');
  const nativeInstaller = source('ios/vorbereiten.mjs');
  assert.match(native, /events: \(\) => typeof Ereignisse !== 'undefined'/);
  assert.match(native, /eventName: 'ablage\.geladen'/);
  assert.match(native, /document\s*\}\);/);
  assert.match(web, /<script src="quell\/start\.js" defer><\/script>/);
  assert.match(nativeInstaller, /html\.replace\('<\/body>', script/);
  assert.doesNotMatch(nativeInstaller, /\bdefer\b/);
});

test('Share Sheet block IDs are accepted by the REAL Redion Store and share one commit', () => {
  const indexed = source('src/kern/ablage/indexdb.ts');
  const share = source('ios/incoming-share.mjs');
  assert.match(indexed, /const addPage = [^]*?const p = addBlock\(parentId, 'page', Object\.assign\(\{/);
  assert.match(indexed, /const addBlock = [^]*?const b = Object\.assign\(\{/);
  assert.match(indexed, /\}, patch\);/);
  assert.match(indexed, /const getBlock = \(id\??:/);
  assert.match(indexed, /const flush = \(\): Promise<unknown> => \{/);
  // Seit E800 schreibt flush über ganzOderGarNicht, ein Commit je Arbeitsschritt:
  // EINE Transaktion über alle Fächer der Menge, Erfolg erst bei oncomplete.
  assert.match(indexed, /t = tx\(\[\.\.\.new Set\(menge\.map\(x => x\.store\)\)\], 'readwrite'\);/);
  assert.match(indexed, /t\.oncomplete = \(\) => ok\(raus\);/);
  assert.match(share, /id: ids\.page/);
  assert.match(share, /id: ids\.content/);
  assert.match(share, /await store\.flush\(\)/);
  assert.doesNotMatch(share, /store\.(?:setMeta|getMeta|metaListeAendern)\(/);
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
