/* Static regression checks for the iPhone dock material and gesture contract.
 * Run: node --test pruefungen/ios-glass-dock-contract.test.mjs
 * Complements (does not replace) the browser gesture suite test614.mts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/* REDION_WURZEL erlaubt, die Prüfung gegen eine KOPIE der Dateien laufen zu
   lassen (Gegenprobe). Ohne die Variable gilt der Wurzelordner des Repos. */
const wurzel = process.env.REDION_WURZEL
  ? pathToFileURL(resolve(process.env.REDION_WURZEL) + sep)
  : new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, wurzel), 'utf8');
const studio = read('quell/schale/stil/studio.css');
const wheel = read('quell/schale/stil/glasswheel.css');
const base = read('quell/schale/stil/bausteine.css');
const html = read('index.html');

test('dock has no swipe-up handle mark and one optical edge (Redur, 24 Nov, E813/E815)', () => {
  /* (a) Kein Griffstrich über dem Dock: jede Regel, die `::before` oder
     `::after` der Kapsel malt, muss sie abschalten (display:none oder
     content:none). Eine Regel ohne diese Zeile ist ein sichtbarer Strich. */
  for (const css of [base, studio, wheel]) {
    const ohne = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, sel, body] of ohne.matchAll(/([^{}]*#handy-oben::(?:before|after)[^{}]*)\{([^}]*)\}/g)) {
      assert.match(body, /(?:display|content)\s*:\s*none/,
        'Regel malt einen Strich über dem Dock: ' + sel.trim());
    }
  }
  /* (b) Der zweite Lichtring ist aus (E813): `::after` steht auf display:none. */
  assert.match(studio, /#handy-oben::after\s*\{\s*display\s*:\s*none/);
  /* (c) Hinaufziehen funktioniert weiter (E749): die Zielleiste wird gebaut,
     und der Zug an der Reihe übergibt an sie, sobald der Finger über die
     Oberkante steigt. Geprüft wird die Kette, nicht der Strich. */
  const tabShelf = read('src/schale/aufbau/tab-shelf.ts');
  const flow = read('src/schale/bedienung/selection-flow.ts');
  const seiten = read('src/schale/aufbau/seitenleiste.ts');
  const schale = read('src/schale/aufbau/schale.ts');
  assert.match(tabShelf, /s\.id = 'ho-ziele';/, 'die Zielleiste wird nicht gebaut');
  assert.match(tabShelf, /const nimm = \(k: HTMLElement[\s\S]*?open\(k, 'finger', x, y\)/,
    'TabShelf.nimm öffnet die Zielleiste nicht für den Finger');
  assert.match(tabShelf, /return \{ attach, nimm/);
  assert.match(flow, /a\.hinauf\.nimm\(k, zog \? 'aus-zug' : 'hoch', e\.clientX, e\.clientY\)/,
    'ziehbar übergibt nicht über die Oberkante');
  assert.match(seiten, /hinauf: \{ nimm: .*TabShelf\.nimm\(k, wie, x, y\)/,
    'die Seitenleiste verdrahtet TabShelf.nimm nicht');
  assert.match(schale, /TabShelf\.attach\(\{ bar: document\.getElementById\('handy-oben'\)/,
    'die Schale hängt die Zielleiste nicht an das Dock');
  assert.match(read('quell/schale/aufbau/tab-shelf.js'), /ho-ziele/, 'das gebaute Bündel kennt die Zielleiste nicht');
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
