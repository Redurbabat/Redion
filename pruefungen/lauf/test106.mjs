/* Suite 71 — Die deutschen Excel-Namen, in Node, ohne Browser
 * ----------------------------------------------------------------------------
 * `doku/EXCEL-IN-REDION-RECHERCHE.md` hat nachgemessen, und das Ergebnis war
 * nicht das erwartete:
 *
 *   158  Funktionen im Register, davon 0 ohne Implementierung
 *    37  von 63 des Excel-Startpakets sind bereits da und laufen
 *     0  davon sind unter ihrem deutschen Namen erreichbar
 *
 * Wer aus Excel kommt und `SUMME(…)` tippt, bekam einen Fehler. `sum` hätte
 * funktioniert. Es fehlten also nicht 63 Funktionen, sondern 26 Funktionen
 * und **37 Namen** — und die Namen kosten fast nichts: der Zerteiler kennt
 * Umlaute schon (`/[A-Za-zÄÖÜäöüß_]/`), und Namen werden vor dem Nachschlagen
 * kleingeschrieben.
 *
 * ─── WAS DIESER LAUF PRÜFT ──────────────────────────────────────────────────
 *
 * 1. Jeder deutsche Name lässt sich aufrufen.
 * 2. Er rechnet **dasselbe** wie sein englisches Gegenstück — nicht nur
 *    „gibt etwas zurück". Ein Alias, der leicht anders rechnet, ist schlimmer
 *    als keiner: er sieht richtig aus.
 * 3. Gross- und Kleinschreibung ist egal (`SUMME`, `Summe`, `summe`).
 * 4. Die englischen Namen funktionieren weiterhin — die Gegenrichtung.
 * 5. Jeder deutsche Name steht im Register, sonst findet ihn die Suche im
 *    Formeleditor nicht, und eine Funktion, die niemand findet, ist fast wie
 *    nicht vorhanden.
 *
 * WIE: `laufzeit.js` und `register/formeln.js` sind gewöhnliche Skripte. Sie
 * werden gelesen und ausgewertet — kein `document`, kein Browser.
 *
 *   node pruefungen/lauf/test106.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* Beide Dateien in den echten globalen Raum laden.
   WARUM NICHT IN EIN EIGENES OBJEKT. `register/formeln.js` schreibt
   `window.Register = window.Register || {}` und spricht danach `Register`
   ohne Vorsatz an. Im Browser geht das, weil eine Eigenschaft von `window`
   ein globaler Name ist. Ein untergeschobenes Objekt hat diese Eigenschaft
   nicht — dort bliebe `Register` undefiniert. Also `globalThis`. */
globalThis.window = globalThis;
globalThis.self = globalThis;
const laden = (pfad) => new Function(_lies(_dazu(WURZEL, pfad), 'utf8'))();
laden('quell/register/formeln.js');
laden('quell/bereiche/datenbanken/formeln/laufzeit.js');

const Formula = globalThis.Formula;
const Register = globalThis.Register;

/* ---------------------------------------------------------------------------
 * Die Paare: deutscher Name → englischer Name
 * -------------------------------------------------------------------------*/
const PAARE = [
  /* Mathematik */
  ['SUMME', 'sum'], ['MITTELWERT', 'mean'], ['MIN', 'min'], ['MAX', 'max'],
  ['ABS', 'abs'], ['WURZEL', 'sqrt'], ['REST', 'mod'], ['RUNDEN', 'round'],
  ['ABRUNDEN', 'floor'], ['AUFRUNDEN', 'ceil'],
  /* Logik */
  ['WENN', 'if'], ['WENNS', 'ifs'], ['UND', 'and'], ['ODER', 'or'],
  ['NICHT', 'not'],
  /* Datum */
  ['HEUTE', 'today'], ['JETZT', 'now'], ['DATUM', 'date'], ['JAHR', 'year'],
  ['MONAT', 'month'], ['TAG', 'day'], ['KALENDERWOCHE', 'week'],
  /* Text */
  ['LÄNGE', 'length'], ['TEIL', 'slice'], ['GLÄTTEN', 'trim'],
  ['GROSS', 'upper'], ['KLEIN', 'lower'], ['WECHSELN', 'replaceall'],
  ['ERSETZEN', 'replace'], ['TEXT', 'format'], ['WERT', 'tonumber'],
  ['TEXTKETTE', 'concat'], ['TEXTVERKETTEN', 'join'],
  /* Info */
  ['ISTLEER', 'empty'],
  /* Suche */
  ['VERGLEICH', 'match'], ['SORTIEREN', 'sort'], ['EINDEUTIG', 'unique']
];

/* Ein Aufruf je Paar, mit Argumenten, die für beide Seiten passen. Wo eine
   Funktion die Zeit liest, wird nur die Form verglichen — `JETZT()` zweimal
   aufgerufen ergibt zwei verschiedene Werte, und das ist richtig so. */
const AUFRUF = {
  sum: '(1, 2, 3)', mean: '(2, 4, 6)', min: '(3, 1, 2)', max: '(3, 1, 2)',
  abs: '(0 - 7)', sqrt: '(16)', mod: '(7, 3)', round: '(2.6)',
  floor: '(2.6)', ceil: '(2.1)',
  if: '(true, "ja", "nein")', ifs: '(false, "a", true, "b")',
  and: '(true, true)', or: '(false, true)', not: '(false)',
  date: '("2026-08-04")', year: '("2026-08-04")', month: '("2026-08-04")',
  day: '("2026-08-04")', week: '("2026-08-04")',
  length: '("Hallo")', slice: '("Redion", 0, 3)', trim: '("  x  ")',
  upper: '("abc")', lower: '("ABC")', replaceall: '("aaa", "a", "b")',
  replace: '("aaa", "a", "b")', format: '(42)', tonumber: '("42")',
  concat: '("a", "b")', join: '(["a", "b"], "-")',
  empty: '("")',
  match: '(["a","b","c"], "b")', sort: '([3, 1, 2])', unique: '([1, 1, 2])'
};
/* Diese lesen die Uhr — nur die Form vergleichen, nicht den Wert. */
const ZEITABHAENGIG = new Set(['today', 'now']);

const rechne = (quelltext) => {
  try {
    const e = Formula.run(quelltext, () => null, () => null, {});
    return e && e.ok ? { ok: true, wert: e.wert } : { ok: false, fehler: e && e.fehler };
  } catch (err) { return { ok: false, fehler: err.message }; }
};

console.log('\n1 · Jeder deutsche Name rechnet dasselbe wie sein englischer');

for (const [de, en] of PAARE) {
  const args = AUFRUF[en];
  if (ZEITABHAENGIG.has(en)) {
    const a = rechne(de + '()'), b = rechne(en + '()');
    p(de + ' läuft wie ' + en, a.ok && b.ok && typeof a.wert === typeof b.wert,
      JSON.stringify(a) + ' / ' + JSON.stringify(b));
    continue;
  }
  if (!args) { p(de + ' hat einen Prüfaufruf', false, 'kein Eintrag in AUFRUF'); continue; }
  const a = rechne(de + args), b = rechne(en + args);
  p(de + args + ' == ' + en + args,
    a.ok && b.ok && JSON.stringify(a.wert) === JSON.stringify(b.wert),
    'de=' + JSON.stringify(a) + ' en=' + JSON.stringify(b));
}

console.log('\n2 · Gross- und Kleinschreibung ist egal');

for (const schreibweise of ['SUMME(1, 2, 3)', 'Summe(1, 2, 3)', 'summe(1, 2, 3)']) {
  const e = rechne(schreibweise);
  p(schreibweise + ' ergibt 6', e.ok && Number(e.wert) === 6, JSON.stringify(e));
}

console.log('\n3 · Die englischen Namen gehen weiterhin');

/* Die Gegenrichtung. Ein Alias, der das Original verdrängt, hätte jede
   bestehende Formel in jedem Bestand gebrochen. */
for (const [, en] of PAARE) {
  if (ZEITABHAENGIG.has(en)) continue;
  const e = rechne(en + AUFRUF[en]);
  p(en + ' rechnet weiterhin', e.ok, JSON.stringify(e));
}

console.log('\n4 · Jeder deutsche Name steht im Register');

const imRegister = new Set(Register.formeln.alle().map(f => f.name.toLowerCase()));
const fehlen = PAARE.map(([de]) => de).filter(de => !imRegister.has(de.toLowerCase()));
p('Alle ' + PAARE.length + ' deutschen Namen sind im Register eingetragen',
  fehlen.length === 0, fehlen.join(', '));

const ohneBeschreibung = Register.formeln.alle()
  .filter(f => PAARE.some(([de]) => de.toLowerCase() === f.name.toLowerCase()))
  .filter(f => !f.was);
p('Jeder deutsche Name hat eine Beschreibung', ohneBeschreibung.length === 0,
  ohneBeschreibung.map(f => f.name).join(', '));

console.log('\n5 · Das Register verspricht nichts, was die Maschine nicht kann');

const a = Register.formeln.abgleich();
p('Keine Beschreibung ohne Funktion', a.ohneFunktion.length === 0,
  a.ohneFunktion.slice(0, 6).join(', '));

console.log(`\n  Suite 71 — Deutsche Excel-Namen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
