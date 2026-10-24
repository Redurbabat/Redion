import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startIosNativeFeel } from './native-feel.mjs';

function harness() {
  const observers = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.stopped = false;
      observers.push(this);
    }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.stopped = true; }
    fire(records) { if (!this.stopped) this.callback(records); }
  }
  const listeners = new Map();
  const doc = {
    documentElement: { dataset: { theme: 'dark' } },
    body: { dataset: {} },
    hidden: false,
    defaultView: { matchMedia: () => ({ matches: false }) },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) {
      if (listeners.get(name) === callback) listeners.delete(name);
    }
  };
  const impacts = [];
  const styles = [];
  const native = {
    haptics: { async impact(args) { impacts.push(args); } },
    bars: { async setStyle(args) {
      assert.equal(args.bar, 'StatusBar', 'Home-Indikator nicht umgestalten.');
      styles.push(args.style);
    } },
    styles: { Dark: 'DARK', Light: 'LIGHT' }
  };
  let time = 1000;
  const stop = startIosNativeFeel({
    document: doc, ...native, statusBar: 'StatusBar', Observer, clock: () => time,
    quiet: () => doc.body.dataset.bewegung === 'ruhig'
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const click = (button, detail = 1) =>
    listeners.get('click')?.({ detail, target: { closest: () => button } });
  const button = {
    disabled: false,
    getAttribute() { return null; }
  };
  const hover = (target) => observers[1].fire([{ target, attributeName: 'data-anvisiert' }]);
  const theme = (newTheme) => {
    doc.documentElement.dataset.theme = newTheme;
    observers[0].fire([{ target: doc.documentElement, attributeName: 'data-theme' }]);
  };
  return { doc, native, observers, listeners, impacts, styles, stop, settle,
    click, button, hover, theme, tick(ms) { time += ms; } };
}

test('iPhone-Statusleiste folgt Redions Hell- und Dunkelmodus', async () => {
  const h = harness();
  await h.settle();
  assert.deepEqual(h.styles, ['DARK'], 'Dunkles Redion braucht helle iOS-Symbole.');
  h.theme('light');
  await h.settle();
  assert.deepEqual(h.styles, ['DARK', 'LIGHT']);
  h.theme('light');
  await h.settle();
  assert.equal(h.styles.length, 2, 'Identisches Thema darf nicht erneut nach Swift.');
  h.theme('dark');
  await h.settle();
  assert.equal(h.styles.at(-1), 'DARK');
  h.stop();
});

test('Geraetehaptik nur auf echten, aktivierten Navigationszielen', async () => {
  const h = harness();
  h.click(h.button, 0);
  await h.settle();
  assert.equal(h.impacts.length, 0, 'Tastaturklick hat keine Haptik.');
  h.click(h.button, 1);
  await h.settle();
  assert.deepEqual(h.impacts, [{ style: 'LIGHT' }]);
  h.click(h.button, 1);
  await h.settle();
  assert.equal(h.impacts.length, 1, 'Schnelle wiederholte Kontakte werden gedrosselt.');
  h.tick(141);
  h.button.disabled = true;
  h.click(h.button);
  await h.settle();
  assert.equal(h.impacts.length, 1, 'Deaktivierter Knopf hat keine Haptik.');
  h.stop();
});

test('Aufwaerts-Ziehen liefert Feedback fuer bestehendes, anvisiertes Ziel', async () => {
  const h = harness();
  const target = {
    parentElement: { id: 'ho-ziele' },
    hasAttribute(name) { return name === 'data-anvisiert'; }
  };
  h.hover(target);
  await h.settle();
  assert.equal(h.impacts.length, 1);
  h.tick(180);
  h.hover({ ...target, parentElement: { id: 'andere-navigation' } });
  await h.settle();
  assert.equal(h.impacts.length, 1, 'Nicht zu TabShelf gehoerende Auswahl ignorieren.');
  h.tick(180);
  h.hover(target);
  await h.settle();
  assert.equal(h.impacts.length, 2);
  h.stop();
});

test('Ruhemodus, versteckte App und reduzierte Bewegung bleiben still', async () => {
  const h = harness();
  h.doc.body.dataset.bewegung = 'ruhig';
  h.click(h.button);
  await h.settle();
  assert.equal(h.impacts.length, 0);
  delete h.doc.body.dataset.bewegung;
  h.doc.hidden = true;
  h.click(h.button);
  await h.settle();
  assert.equal(h.impacts.length, 0);
  h.doc.hidden = false;
  h.doc.defaultView.matchMedia = () => ({ matches: true });
  h.click(h.button);
  await h.settle();
  assert.equal(h.impacts.length, 0);
  h.stop();
});

test('Native Fehler duerfen Navigation und Theme-Umschaltung nie blockieren', async () => {
  const h = harness();
  await h.settle(); // first dark-theme update completes before fault injection
  h.native.haptics.impact = () => Promise.reject(new Error('Taptic Engine nicht da'));
  h.native.bars.setStyle = () => Promise.reject(new Error('Native Controller nicht bereit'));
  h.click(h.button);
  h.theme('light');
  await h.settle();
  assert.equal(h.styles.length, 1, 'Urspruengliche Statusbar wurde angewendet.');
  assert.equal(h.observers[0].stopped, false);
  h.stop();
  assert.ok(h.observers.every(o => o.stopped));
  assert.equal(h.listeners.has('click'), false);
});

test('Nur natives IPA bekommt die Erweiterung, Webseite bleibt identisch', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  const workflow = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
  const nativeSource = fs.readFileSync(path.join(root, 'ios/native-sicherung.ts'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.equal(config.ios.path, 'build/ios-capacitor');
  assert.deepEqual(config.includePlugins, [
    '@capacitor/filesystem', '@capacitor/share', '@capacitor/haptics',
    '@capacitor/browser'
  ], 'Capacitor muss temporäre iOS-Plugins auch ohne package.json erkennen.');
  assert.match(workflow, /@capacitor\/haptics@8/);
  assert.match(workflow, /UIViewControllerBasedStatusBarAppearance/);
  assert.match(workflow, /UIStatusBarHidden/);
  assert.match(nativeSource, /Capacitor\.getPlatform\(\) === 'ios'/);
  assert.match(nativeSource, /startIosNativeFeel/);
  assert.doesNotMatch(html, /redion-native-sicherung\.js|native-feel\.mjs/);
  assert.doesNotMatch(workflow, /(?:--force|--legacy-peer-deps)/);
});

test('Unbeteiligte Klicks, deaktivierte Ziele und Gesten ohne Auswahl bleiben ohne Haptik', async () => {
  const h = harness();
  const disabled = { disabled: false, getAttribute: () => 'true' };
  h.click(null, 1);
  h.click(disabled, 1);
  await h.settle();
  assert.equal(h.impacts.length, 0, 'Keine Haptik auf unbeteiligten oder gesperrten Zielen.');
  const noAim = { parentElement: { id: 'ho-ziele' },
    hasAttribute() { return false; } };
  h.hover(noAim);
  await h.settle();
  assert.equal(h.impacts.length, 0);
  h.stop();
});

test('Schneller Hell-Dunkel-Wechsel wird in korrekter Reihenfolge an iOS uebergeben', async () => {
  const h = harness();
  h.theme('light');
  h.theme('dark');
  h.theme('light');
  // The mock records native calls; the queued updates must finish in order
  // regardless of the intervening MutationObserver notifications.
  await h.settle();
  assert.deepEqual(h.styles, ['DARK', 'LIGHT', 'DARK', 'LIGHT']);
  h.stop();
});
