import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safariTargetForClick, enableIosSafariLinks } from './native-safari-links.mjs';

function harness({ baseURI = 'capacitor://localhost/index.html', fail = false } = {}) {
  const listeners = new Map();
  const requests = [];
  const shared = [];
  const doc = {
    baseURI,
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); }
  };
  let now = 1000;
  const browser = { open({ url }) {
    requests.push(url);
    return fail ? Promise.reject(new Error('Safari nicht verfuegbar')) : Promise.resolve();
  } };
  const stop = enableIosSafariLinks({
    document: doc, browser, onFail: async (url) => { shared.push(url); },
    clock: () => now
  });
  const click = (href, {
    targetBlank = true, download = false, editing = false,
    button = 0, ctrlKey = false, metaKey = false,
    shiftKey = false, altKey = false, prevented = false
  } = {}) => {
    const anchor = {
      hasAttribute(name) { return name === 'download' && download; },
      getAttribute(name) { return name === 'href' ? href : null; },
      closest(selector) { return editing && selector.includes('contenteditable') ? {} : null; }
    };
    const event = {
      button, ctrlKey, metaKey, shiftKey, altKey, defaultPrevented: prevented,
      target: { closest(selector) {
        if (!targetBlank) return null;
        return selector.includes('target="_blank"') ? anchor : null;
      } },
      prevented: false,
      preventDefault() { this.prevented = true; }
    };
    listeners.get('click')?.(event);
    return event;
  };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  return { doc, browser, listeners, requests, shared, click, settle, stop,
    timeAdvance(ms) { now += ms; } };
}

test('HTTPS-Link oeffnet Apple Safari ohne die Redion-Seite zu verlassen', async () => {
  const h = harness();
  const clicked = h.click('https://developer.apple.com/documentation?lang=de#header');
  assert.equal(clicked.prevented, true);
  await h.settle();
  assert.deepEqual(h.requests, ['https://developer.apple.com/documentation?lang=de#header']);
  assert.deepEqual(h.shared, []);
  h.stop();
});

test('Interne Dateipfade, Mail, Telefon, Blob, relative und unsichere Links bleiben unberuehrt', () => {
  const h = harness();
  for (const href of [
    '#page', '/wissen', './index.html', 'mailto:help@example.org',
    'tel:+410000000', 'blob:https://example.org/42',
    'javascript:alert(1)', 'file:///tmp/document.pdf',
    'http://example.org/unsafe', 'data:text/plain,test',
    'https://user:pass@example.org', '   '
  ]) {
    assert.equal(h.click(href).prevented, false, href);
  }
  assert.deepEqual(h.requests, []);
  h.stop();
});

test('Nur explizite externe Links; kein Download, keine Bearbeitung oder geschuetzter Klick', () => {
  const h = harness({ baseURI: 'https://redion.example/app/index.html' });
  for (const variant of [
    { targetBlank: false }, { download: true }, { editing: true },
    { ctrlKey: true }, { metaKey: true }, { shiftKey: true },
    { altKey: true }, { button: 1 }, { prevented: true }
  ]) {
    assert.equal(h.click('https://example.org/quelle', variant).prevented, false,
      JSON.stringify(variant));
  }
  assert.equal(h.click('https://redion.example/andere-seite', {}).prevented, false);
  assert.deepEqual(h.requests, []);
  h.stop();
});

test('Nur der originale Link und keine zweite Navigation wird gestartet', async () => {
  const h = harness();
  assert.equal(h.click('https://example.com/notes').prevented, true);
  assert.equal(h.click('https://example.com/notes').prevented, true);
  await h.settle();
  assert.deepEqual(h.requests, ['https://example.com/notes'],
    'Doppeltipp darf nur ein Safari-Fenster erstellen.');
  h.timeAdvance(650);
  h.click('https://example.com/notes');
  await h.settle();
  assert.equal(h.requests.length, 2, 'Spaeter darf dieselbe Quelle wieder geoeffnet werden.');
  h.stop();
});

test('Falls Safari nicht startet: native Teilen-Funktion statt Verlust des Editors', async () => {
  const h = harness({ fail: true });
  const clicked = h.click('https://example.net/externer-link');
  assert.equal(clicked.prevented, true);
  await h.settle();
  assert.deepEqual(h.requests, ['https://example.net/externer-link']);
  assert.deepEqual(h.shared, ['https://example.net/externer-link']);
  h.stop();
});

test('Plugin-Ausnahme wird abgefangen und Teilsystem laesst sich stoppen', async () => {
  const h = harness();
  h.browser.open = () => { throw new Error('native API gestoppt'); };
  assert.doesNotThrow(() => h.click('https://example.org/a'));
  await h.settle();
  assert.deepEqual(h.shared, ['https://example.org/a']);
  h.stop();
  assert.equal(h.listeners.has('click'), false);
  assert.equal(h.click('https://example.org/b').prevented, false);
});

test('Keine native Browser-Bridge: kein stilles Starten', () => {
  assert.throws(() => enableIosSafariLinks({ document: { addEventListener() {} } }),
    /missing/);
  assert.equal(safariTargetForClick(null, { baseURI: 'https://example.org/' }), null);
});

test('Das Web/PWA-Paket bleibt ohne Browser-Plugin und ohne nativen Link-Listener', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  const yaml = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
  const native = fs.readFileSync(path.join(root, 'ios/native-sicherung.ts'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.ok(config.includePlugins.includes('@capacitor/browser'));
  assert.match(yaml, /@capacitor\/browser@8/);
  assert.match(yaml, /node --test ios\/native-safari-links\.test\.mjs/);
  assert.match(native, /Capacitor\.getPlatform\(\) === 'ios'/);
  assert.match(native, /enableIosSafariLinks/);
  assert.doesNotMatch(html, /native-safari-links|redion-native-sicherung\.js/);
});
