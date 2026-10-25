/*
 * iOS-only foreground refresh of Redion's EXISTING shared visualViewport
 * calculation. Does not mount a native document UI or modify saved data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startIosNativeFeel } from './native-feel.mjs';

function harness({ hidden = false, viewport = () => {}, withApp = true } = {}) {
  const docListeners = new Map();
  const winListeners = new Map();
  const observers = [];
  const status = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const win = {
    matchMedia() { return { matches: false }; },
    addEventListener(name, fn) { winListeners.set(name, fn); },
    removeEventListener(name, fn) { if (winListeners.get(name) === fn) winListeners.delete(name); }
  };
  if (withApp) win.AppEinstellung = { viewportAktualisieren: viewport };
  const doc = {
    hidden,
    documentElement: { dataset: { theme: 'dark' } },
    body: { dataset: {} },
    defaultView: win,
    addEventListener(name, fn) { docListeners.set(name, fn); },
    removeEventListener(name, fn) { if (docListeners.get(name) === fn) docListeners.delete(name); }
  };
  const stop = startIosNativeFeel({
    document: doc,
    haptics: { async impact() {} },
    bars: { async setStyle({ style, bar }) {
      assert.equal(bar, 'StatusBar');
      status.push(style);
    } },
    styles: { Dark: 'DARK', Light: 'LIGHT' },
    statusBar: 'StatusBar',
    Observer
  });
  return {
    doc, win, status, stop, observers, docListeners, winListeners,
    event(name) {
      const fn = docListeners.get(name) || winListeners.get(name);
      assert.equal(typeof fn, 'function', name);
      fn();
    },
    settle: () => new Promise(resolve => setImmediate(resolve))
  };
}

test('resume remeasures the shared visual viewport while restoring the status bar', async () => {
  let measured = 0;
  const h = harness({ viewport() { measured++; } });
  await h.settle();
  h.event('visibilitychange');
  await h.settle();
  assert.equal(measured, 1);
  assert.deepEqual(h.status, ['DARK', 'DARK']);
  h.stop();
});

test('focus, pageshow and visibilitychange coalesce into one viewport refresh', async () => {
  let measured = 0;
  const h = harness({ viewport() { measured++; } });
  h.event('focus');
  h.event('pageshow');
  h.event('visibilitychange');
  await h.settle();
  assert.equal(measured, 1, 'A burst of return events must not cause repeated layout work.');
  assert.deepEqual(h.status, ['DARK']);
  h.event('pageshow');
  await h.settle();
  assert.equal(measured, 2, 'A later foreground event must still refresh.');
  h.stop();
});

test('background does not measure, and a suspended pending refresh stays cancelled', async () => {
  let measured = 0;
  const h = harness({ viewport() { measured++; } });
  h.event('pageshow');
  h.doc.hidden = true;
  h.event('visibilitychange');
  await h.settle();
  assert.equal(measured, 0);
  h.doc.hidden = false;
  h.event('visibilitychange');
  await h.settle();
  assert.equal(measured, 1);
  h.stop();
});

test('missing or throwing viewport calculator never blocks UIKit or navigation', async () => {
  for (const options of [{ withApp: false }, { viewport() { throw Error('WebKit'); } }]) {
    const h = harness(options);
    h.event('pageshow');
    await h.settle();
    assert.deepEqual(h.status, ['DARK']);
    h.stop();
  }
});

test('cleanup cancels a queued viewport refresh and removes lifecycle listeners', async () => {
  let measured = 0;
  const h = harness({ viewport() { measured++; } });
  h.event('focus');
  h.stop();
  await h.settle();
  assert.equal(measured, 0);
  assert.equal(h.docListeners.has('visibilitychange'), false);
  assert.equal(h.winListeners.has('focus'), false);
  assert.equal(h.winListeners.has('pageshow'), false);
});

test('reuses Redion viewport variables without changing website or app ID', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const ts = fs.readFileSync(path.join(root, 'src/kern/einstellung/app.ts'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'quell/kern/einstellung/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  assert.match(ts, /viewportAktualisieren/);
  assert.match(ts, /--visual-height/);
  assert.match(ts, /--visual-bottom/);
  assert.match(js, /window\.AppEinstellung = AppEinstellung/);
  assert.doesNotMatch(html, /redion-native-sicherung\.js/);
  assert.equal(cfg.appId, 'ch.redurbabat.redion');
  assert.equal(cfg.ios.path, 'build/ios-capacitor');
});
