import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(
  path.join(root, 'quell/schale/aufbau/wischen.js'), 'utf8'
);

function harness() {
  const handlers = new Map();
  let selected = 0;
  const stage = { style: { transition: '', transform: '' } };
  const tab = (active) => ({
    classList: { contains: name => name === 'an' && active },
    click: () => { selected += 1; }
  });
  const tabs = [tab(true), tab(false)];
  const nav = {
    getBoundingClientRect: () => ({ width: 340, height: 65 }),
    querySelectorAll: () => tabs
  };
  class Element {}
  class HTMLElement extends Element {}
  const doc = {
    body: { classList: { contains: () => false }, dataset: {} },
    getElementById: id => ({
      'handy-oben': nav, scroll: stage
    })[id] ?? null,
    querySelector: () => null
  };
  const world = {
    document: doc,
    window: {},
    Element,
    HTMLElement,
    innerWidth: 390,
    getComputedStyle: () => ({ overflowX: 'visible' }),
    addEventListener(name, handler) { handlers.set(name, handler); },
    setTimeout() { return 1; }
  };
  vm.runInNewContext(source, world, { filename: 'quell/schale/aufbau/wischen.js' });
  world.window.Wischen.starten();
  const send = (name, pointerId, x, y, time = 0) => {
    const event = {
      target: null, pointerType: 'touch', pointerId,
      clientX: x, clientY: y, timeStamp: time
    };
    handlers.get(name)(event);
  };
  return { send, stage, selected: () => selected };
}

test('second finger cancels a dragged mobile page and restores its position', () => {
  const h = harness();
  h.send('pointerdown', 11, 250, 300, 0);
  h.send('pointermove', 11, 170, 300, 40);
  assert.match(h.stage.style.transform, /translateX/);
  h.send('pointerdown', 12, 180, 320, 50);
  assert.equal(h.stage.style.transform, '', 'Multi-touch must clear the dragged translation.');
  h.send('pointerup', 11, 100, 300, 80);
  h.send('pointerup', 12, 160, 320, 100);
  assert.equal(h.selected(), 0, 'Abandoned gesture must never navigate.');
});

test('a different cancelled pointer cannot interrupt an active swipe', () => {
  const h = harness();
  h.send('pointerdown', 7, 260, 320, 0);
  h.send('pointermove', 7, 190, 320, 25);
  const dragged = h.stage.style.transform;
  h.send('pointercancel', 99, 190, 320, 30);
  assert.equal(h.stage.style.transform, dragged);
  h.send('pointermove', 7, 130, 320, 45);
  h.send('pointerup', 7, 130, 320, 80);
  assert.equal(h.selected(), 1, 'Only the active finger should navigate.');
  assert.equal(h.stage.style.transform, '', 'The completed gesture must settle.');
});

test('cancelling the active finger never changes tabs', () => {
  const h = harness();
  h.send('pointerdown', 1, 280, 320, 0);
  h.send('pointermove', 1, 185, 320, 30);
  assert.match(h.stage.style.transform, /translateX/);
  h.send('pointercancel', 1, 185, 320, 35);
  h.send('pointerup', 1, 100, 320, 50);
  assert.equal(h.stage.style.transform, '');
  assert.equal(h.selected(), 0);
});

test('simple taps never select a new tab by a swipe handler', () => {
  const h = harness();
  h.send('pointerdown', 5, 200, 300, 0);
  h.send('pointerup', 5, 202, 302, 35);
  assert.equal(h.selected(), 0);
  assert.equal(h.stage.style.transform, '');
});

test('mobile swipe keeps the extra TabShelf navigation independent', () => {
  assert.doesNotMatch(source, /#ho-ziele|TabShelf\.oeffnen/);
  assert.match(source, /addEventListener\('pointercancel', \(e\) =>/);
});
