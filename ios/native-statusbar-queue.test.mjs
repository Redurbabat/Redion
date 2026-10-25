/*
 * Native iOS SystemBars queue races: no WebKit / iPhone needed.
 * These tests intentionally control when UIKit's Promise settles.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { startIosNativeFeel } from './native-feel.mjs';

function harness({ hidden = false, blocked = false } = {}) {
  const observers = [];
  class Observer {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
    fire() { if (!this.disconnected) this.fn([{ attributeName: 'data-theme' }]); }
  }
  const docListeners = new Map();
  const winListeners = new Map();
  const win = {
    addEventListener(name, fn) { winListeners.set(name, fn); },
    removeEventListener(name, fn) { if (winListeners.get(name) === fn) winListeners.delete(name); },
    matchMedia() { return { matches: false }; }
  };
  const doc = {
    hidden,
    documentElement: { dataset: { theme: 'dark' } },
    body: {},
    defaultView: win,
    addEventListener(name, fn) { docListeners.set(name, fn); },
    removeEventListener(name, fn) { if (docListeners.get(name) === fn) docListeners.delete(name); }
  };
  const calls = [];
  const active = [];
  const bars = {
    setStyle({ style, bar }) {
      assert.equal(bar, 'StatusBar');
      calls.push(style);
      if (!blocked) return Promise.resolve();
      return new Promise((resolve, reject) => { active.push({ resolve, reject }); });
    }
  };
  const stop = startIosNativeFeel({
    document: doc,
    haptics: { async impact() {} },
    bars,
    styles: { Dark: 'DARK', Light: 'LIGHT' },
    statusBar: 'StatusBar',
    Observer
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  return {
    doc, calls, active, stop, settle,
    theme(name) { doc.documentElement.dataset.theme = name; observers[0].fire(); },
    resume(name = 'visibilitychange') {
      const fn = docListeners.get(name) || winListeners.get(name);
      assert.equal(typeof fn, 'function');
      fn();
    }
  };
}

test('queued theme changes only apply the final iPhone status-bar style', async () => {
  const h = harness();
  h.theme('light');
  h.theme('dark');
  h.theme('light');
  await h.settle();
  assert.deepEqual(h.calls, ['LIGHT']);
  h.stop();
});

test('pending native style requests are not sent while WKWebView is hidden', async () => {
  const h = harness();
  h.doc.hidden = true;
  await h.settle();
  assert.deepEqual(h.calls, [], 'Already queued UIKit call must not run in the background.');
  h.theme('light');
  await h.settle();
  assert.deepEqual(h.calls, []);
  h.doc.hidden = false;
  h.resume();
  await h.settle();
  assert.deepEqual(h.calls, ['LIGHT']);
  h.stop();
});

test('in-flight UIKit update completes before latest theme without stale intermediate calls', async () => {
  const h = harness({ blocked: true });
  await h.settle(); // DARK bridge call is now in flight.
  assert.deepEqual(h.calls, ['DARK']);
  h.theme('light');
  h.theme('dark');
  h.theme('light');
  await h.settle();
  assert.deepEqual(h.calls, ['DARK'], 'Do not overlap UIKit calls.');
  h.active.shift().resolve();
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'LIGHT']);
  h.active.shift().resolve();
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'LIGHT']);
  h.stop();
});

test('multiple resume notifications coalesce, but the next foreground resume still updates', async () => {
  const h = harness();
  await h.settle();
  h.resume('visibilitychange');
  h.resume('pageshow');
  h.resume('focus');
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'DARK']);
  h.doc.hidden = true;
  h.resume();
  h.doc.hidden = false;
  h.resume();
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'DARK', 'DARK']);
  h.stop();
});

test('stopping the adapter cancels queued status-bar tasks without cancelling in-flight UIKit', async () => {
  const h = harness({ blocked: true });
  await h.settle();
  h.theme('light');
  h.stop();
  h.active.shift().resolve();
  await h.settle();
  assert.deepEqual(h.calls, ['DARK'], 'No new native work may run after cleanup.');
});

test('an old bridge rejection cannot suppress the most recent theme', async () => {
  const h = harness({ blocked: true });
  await h.settle();
  h.theme('light');
  h.active.shift().reject(new Error('UIKit not ready'));
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'LIGHT']);
  h.active.shift().resolve();
  await h.settle();
  h.theme('light');
  await h.settle();
  assert.deepEqual(h.calls, ['DARK', 'LIGHT'], 'Ignore duplicate themes after recovery.');
  h.stop();
});
