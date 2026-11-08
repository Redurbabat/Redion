/* Suite 635 — Schaltplan: Anschlussfang mit einstellbarem Radius
 * -------------------------------------------------------------------------
 * Regression fuer den zoomabhaengigen Leitungsfang. Laeuft ohne Browser:
 * Die echte TS-Schaltplan-Engine wird im Speicher transpiliert und mit
 * einem kleinen Fachzeichenregister ausgefuehrt, keine zweite Fanglogik.
 *
 *   node pruefungen/lauf/test635.mts
 * ------------------------------------------------------------------------- */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '../..');
const enginePath = path.join(ROOT, 'src/bereiche/bloecke/arten/schaltplan.ts');
const editorPath = path.join(ROOT, 'src/bereiche/bloecke/arten/planflaeche.ts');
const source = fs.readFileSync(enginePath, 'utf8');
const editor = fs.readFileSync(editorPath, 'utf8');

/* Nur der Zeichnungs-Kern wird geladen: keine DOM- oder Browser-Testkopie.
 * Alle Terminalpositionen kommen aus dem echten anschluesseVon/anschlussOrt. */
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
const globals: any = {
  window: {},
  Register: {
    fachzeichen: {
      RASTER: 10,
      holen: (name: string) => name === 'test-klemme'
        ? { anschluesse: [{ nr: '1' }, { nr: '2' }] } : null,
      anschlussLage: (_name: string, nr: string) =>
        nr === '1' ? { x: 0, y: 0 } : nr === '2' ? { x: 0, y: 60 } : null
    }
  }
};
vm.runInNewContext(js, globals, { filename: 'schaltplan.transpiliert.js', timeout: 4000 });
const schaltplan = globals.window.Schaltplan;
assert.equal(typeof schaltplan?.fangeAnschluss, 'function', 'Die echte Engine exportiert fangeAnschluss');

const teil = (id: string, x: number, y: number, zeichen = 'test-klemme') => ({
  id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk: id,
  nummern: {}, gruppe: '', ebene: 'plan'
});
const plan = (...teile: any[]) => ({
  art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600, teile,
  leitungen: [], texte: [], ebenen: []
});
const einzel = plan(teil('T1', 100, 100));
const fange = (p: { x: number; y: number }, radius?: number, pl = einzel) =>
  schaltplan.fangeAnschluss(pl, p, radius);

test('Alter Aufruf ohne Radius behaelt den bisherigen Standard 14', () => {
  assert.equal(fange({ x: 113, y: 100 })?.teil, 'T1');
  assert.equal(fange({ x: 115, y: 100 }), null);
});

test('Kleinerer Fangradius vermeidet ungewolltes Verbinden', () => {
  assert.equal(fange({ x: 103, y: 100 }, 3)?.nr, '1');
  assert.equal(fange({ x: 104, y: 100 }, 3), null);
  assert.equal(fange({ x: 100, y: 100 }, 0)?.teil, 'T1');
  assert.equal(fange({ x: 101, y: 100 }, 0), null);
  assert.equal(fange({ x: 101, y: 100 }, -4), null);
});

test('Groesserer Touch-Radius faengt auch weiter entfernte Klemmen', () => {
  assert.equal(fange({ x: 123, y: 100 }, 24)?.nr, '1');
  assert.equal(fange({ x: 125, y: 100 }, 24), null);
});

test('Der geometrisch naechste Anschluss gewinnt, nicht der erste', () => {
  const zwei = plan(teil('T1', 100, 100), teil('T2', 140, 100));
  const hit = fange({ x: 132, y: 100 }, 40, zwei);
  assert.equal(hit?.teil, 'T2');
  assert.equal(hit?.nr, '1');
  assert.equal(hit?.x, 140);
  assert.equal(hit?.y, 100);
});

test('Nicht registrierte Fachzeichen werden sicher ignoriert', () => {
  const leer = plan(teil('X', 100, 100, 'unbekannt'));
  assert.equal(fange({ x: 100, y: 100 }, 24, leer), null);
});

test('Planflaeche benutzt denselben Radius bei Start, Vorschau und Ende', () => {
  const verwendungen = editor.match(/anschlussFangRadius\(svg, e\.pointerType\)/g) || [];
  assert.equal(verwendungen.length, 3);
  assert.match(editor, /fangeAnschluss\(z\.plan, roh, anschlussFangRadius\(svg, e\.pointerType\)\)/);
  assert.match(editor, /getScreenCTM\(\)/);
  assert.match(editor, /if \(!svg\) \{ male\(\); return; \}/);
});
