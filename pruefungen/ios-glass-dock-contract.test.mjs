/* Static regression checks for the iPhone dock material and gesture contract.
 * Run: node --test pruefungen/ios-glass-dock-contract.test.mjs
 * Complements (does not replace) the browser gesture suite test614.mts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const studio = read('quell/schale/stil/studio.css');
const wheel = read('quell/schale/stil/glasswheel.css');
const base = read('quell/schale/stil/bausteine.css');
const html = read('index.html');

test('dock keeps the swipe-up handle and separate optical highlight', () => {
  assert.match(base, /#handy-oben::before\s*\{/);
  assert.match(studio, /#handy-oben::after\s*\{/);
  assert.doesNotMatch(studio.slice(studio.indexOf('/* iPhone UI polish (2026-11)')), /#handy-oben::before\s*\{/);
});

test('iPhone polish does not replace navigation touch-action', () => {
  const polish = studio.slice(studio.indexOf('/* iPhone UI polish (2026-11)'));
  assert.ok(polish.length > 200);
  const cssWithoutComments = polish.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(cssWithoutComments, /touch-action\s*:/);
  assert.match(base, /#handy-oben/);
});

test('glass-wheel shell keeps bottom safe-area outside the dock', () => {
  const block = wheel.slice(wheel.indexOf('/* iPhone: reconcile the Glass Wheel shell'));
  assert.ok(block.length > 200);
  assert.match(block, /bottom:calc\(9px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(block, /padding-bottom:5px/);
});

test('existing five navigation destinations remain in the HTML', () => {
  for (const id of ['hl-dok', 'hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /id="ho-pille"/);
});
