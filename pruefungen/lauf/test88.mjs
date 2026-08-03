/* Suite 53 — Die Datenbank-Logik, in Node, ohne Browser
 * ----------------------------------------------------------------------------
 * Das ist das „fertig wenn" von A4, wörtlich: *„dienst.js lässt sich in Node
 * laden und prüfen, ohne dass ein document existiert."*
 *
 * Warum das mehr ist als eine Formsache. Bis hierher ging fast jeder Prüflauf
 * über echtes Chromium: Browser starten, Seite laden, IndexedDB füllen, warten
 * — zwölf Sekunden für eine Frage, die eine Rechnung ist. Filtern, Sortieren,
 * Gruppieren und die Berechnungen unter einer Spalte brauchen kein Fenster.
 * Sie brauchen Zeilen und ein Schema.
 *
 * Dieser Lauf legt beides von Hand hin und rechnet nach. Er ist in
 * Millisekunden fertig, und er sagt bei einem Fehler genauer, was kaputt ist:
 * nicht „die Tabelle sieht falsch aus", sondern „ist leer lässt eine Null
 * durch".
 *
 * WIE DAS GEHT, ohne die Datei zu ändern: `dienst.js` ist ein gewöhnliches
 * Skript, kein Modul. Es wird gelesen und mit Attrappen für Store, Register,
 * Formula und Datum ausgewertet. Ein `document` bekommt es nicht — und ein
 * `window` auch nicht.
 *
 * ZWEI FEHLER STECKTEN BEIM SCHREIBEN IN DIESEM LAUF SELBST, und beide bleiben
 * hier stehen, weil sie sich wiederholen werden:
 *
 *   1. `p(name, bedingung)` prüft auf wahr oder falsch. Wer `p(name, listeA,
 *      listeB)` schreibt, in der Annahme das dritte Argument sei der Sollwert,
 *      übergibt eine nicht-leere Liste als Bedingung — die ist immer wahr.
 *      Elf Prüfungen bestanden so blind und widersprachen sich sogar
 *      gegenseitig, ohne dass etwas rot wurde. Dafür gibt es jetzt `gleich`.
 *
 *   2. Der Vergleichswert einer Filterregel heisst `wert`, nicht `val`, und
 *      die Operatoren sind ausgeschriebene Sätze („größer als", nicht „>").
 *      Wer das rät, bekommt keinen Fehler: `regel.wert` ist dann undefined
 *      und der Filter lässt alles durch. Eine geratene Schnittstelle sieht
 *      genauso aus wie eine erfüllte — nur dass nichts geprüft wird.
 *
 *   node pruefungen/lauf/test88.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const gleich = (n, ist, soll) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

/* ========================================================================= *
 * DIE ATTRAPPEN
 * Nur so viel, wie die Logik wirklich anfasst. Wer hier mehr hinstellt als
 * nötig, prüft am Ende seine Attrappe statt die App.
 * ========================================================================= */
const ZEILEN = [
  { id: 'z1', text: 'Brot',  created: '2026-08-01', props: { menge: 3,  wann: '2026-08-01', tags: ['A', 'B'], fertig: true,  wer: 'Ada' } },
  { id: 'z2', text: 'Milch', created: '2026-08-02', props: { menge: 12, wann: '2026-08-05', tags: ['B'],      fertig: false, wer: 'Bo'  } },
  { id: 'z3', text: 'Salz',  created: '2026-08-03', props: { menge: 0,  wann: '',           tags: [],         fertig: false, wer: ''    } },
  { id: 'z4', text: 'Öl',    created: '2026-08-04', props: { menge: 7,  wann: '2026-07-20', tags: ['A'],      fertig: true,  wer: 'Ada' } }
];

const SCHEMA = {
  title:  { name: 'Titel',  type: 'title' },
  menge:  { name: 'Menge',  type: 'number' },
  wann:   { name: 'Wann',   type: 'date' },
  tags:   { name: 'Marken', type: 'multi_select', options: [{ name: 'A' }, { name: 'B' }] },
  fertig: { name: 'Fertig', type: 'checkbox' },
  wer:    { name: 'Wer',    type: 'select', options: [{ name: 'Ada' }, { name: 'Bo' }] }
};
const COLL = { id: 'c1', name: 'Einkauf', schema: SCHEMA };

/* Bewusst OHNE `window`. Die Datei hängt sich nur dann an eines, wenn es eines
   gibt — steht hier keines, ist bewiesen, dass sie auch ohne auskommt. Eines
   hinzustellen hätte die Prüfung wertlos gemacht. */
const umgebung = {
  Store: {
    cache: { collections: { c1: COLL }, blocks: {} },
    rowsOf: () => ZEILEN,
    getCollection: (id) => (id === 'c1' ? COLL : null),
    getBlock: (id) => ZEILEN.find(z => z.id === id) || null,
    childrenOf: () => [],
    getMeta: (_, vorgabe) => vorgabe
  },
  Register: { eigenschaften: { alle: () => [
    { id: 'title', name: 'Titel', icon: 'T' },
    { id: 'text',  name: 'Text',  icon: 'A' },
    { id: 'number', name: 'Zahl', icon: '#' },
    { id: 'date',  name: 'Datum', icon: 'D' },
    { id: 'select', name: 'Auswahl', icon: 'S' },
    { id: 'multi_select', name: 'Mehrfachauswahl', icon: 'M' },
    { id: 'checkbox', name: 'Kontrollkästchen', icon: 'K' }
  ] } },
  Formula: { run: () => null },
  Datum: { heute: () => '2026-08-03', alsText: (d) => String(d) }
};

const quelle = _lies(_dazu(WURZEL, 'quell/bereiche/datenbanken/dienst.js'), 'utf8');
const namen = Object.keys(umgebung);
let Dienst = null, ladefehler = null;
try {
  Dienst = new Function(...namen, quelle + '\nreturn DatenbankDienst;')(
    ...namen.map(n => umgebung[n]));
} catch (e) { ladefehler = e.message; }

/* ========================================================================= *
 * 1 · LÄDT SIE ÜBERHAUPT?
 * ========================================================================= */
console.log('\n— Ohne Browser geladen —');

p('dienst.js lädt in Node, ohne document', !!Dienst, ladefehler || '');
if (!Dienst) {
  console.log(`\n  Suite 53 — Datenbank-Logik: ${ok} ok, ${weg} offen`);
  process.exit(1);
}

const ohneKommentar = quelle.replace(/\/\*[\s\S]*?\*\//g, ' ');
p('Sie kam ganz ohne Fenster aus', !('window' in umgebung));
p('Und im Quelltext steht kein document', !/\bdocument\s*\./.test(ohneKommentar));
p('Auch kein createElement oder innerHTML',
  !/createElement|innerHTML|querySelector/.test(ohneKommentar));

/* ========================================================================= *
 * 2 · WERTE LESEN
 * ========================================================================= */
console.log('\n— Werte lesen —');

const w = (z, k) => Dienst.wert(ZEILEN.find(x => x.id === z), k, COLL);
p('Eine Zahl kommt als Zahl',           w('z1', 'menge') === 3, String(w('z1', 'menge')));
p('Die Null ist eine Null, nicht leer', w('z3', 'menge') === 0, String(w('z3', 'menge')));
p('Ein Kontrollkästchen ist wahr',      w('z1', 'fertig') === true, String(w('z1', 'fertig')));
p('Und falsch, wenn es nicht steht',    w('z2', 'fertig') === false, String(w('z2', 'fertig')));
p('Der Titel kommt aus dem Text',       w('z1', 'title') === 'Brot', String(w('z1', 'title')));
gleich('Eine Mehrfachauswahl ist eine Liste', w('z1', 'tags'), ['A', 'B']);

p('propTyp findet den Typ',  Dienst.propTyp('number')?.id === 'number');
p('Und weicht sonst aus',    !!Dienst.propTyp('gibtsnicht'));

/* ========================================================================= *
 * 3 · FILTERN — das, was ein Mensch als Erstes merkt, wenn es falsch ist
 * ========================================================================= */
console.log('\n— Filtern —');

const filtere = (regel) => ZEILEN.filter(z => Dienst.trifftZu(z, regel, COLL)).map(z => z.text);

gleich('ist (Auswahl)',       filtere({ key: 'wer', op: 'ist', wert: 'Ada' }), ['Brot', 'Öl']);
gleich('ist nicht',           filtere({ key: 'wer', op: 'ist nicht', wert: 'Ada' }), ['Milch', 'Salz']);
gleich('größer als',          filtere({ key: 'menge', op: 'größer als', wert: 5 }), ['Milch', 'Öl']);
gleich('kleiner oder gleich', filtere({ key: 'menge', op: 'kleiner oder gleich', wert: 3 }), ['Brot', 'Salz']);
gleich('ist gleich',          filtere({ key: 'menge', op: 'ist gleich', wert: 0 }), ['Salz']);
gleich('enthält (Text)',      filtere({ key: 'title', op: 'enthält', wert: 'l' }), ['Milch', 'Salz', 'Öl']);
gleich('enthält (Mehrfach)',  filtere({ key: 'tags', op: 'enthält', wert: 'A' }), ['Brot', 'Öl']);
gleich('ist leer',            filtere({ key: 'wer', op: 'ist leer' }), ['Salz']);
gleich('ist nicht leer',      filtere({ key: 'wer', op: 'ist nicht leer' }), ['Brot', 'Milch', 'Öl']);

/* Die Null ist die klassische Falle: sie ist ein Wert, kein „leer". */
gleich('Eine Null gilt nicht als leer', filtere({ key: 'menge', op: 'ist leer' }), []);
gleich('Ein leeres Datum schon',        filtere({ key: 'wann', op: 'ist leer' }), ['Salz']);

/* ========================================================================= *
 * 4 · BERECHNUNGEN UNTER DER SPALTE
 * ========================================================================= */
console.log('\n— Berechnungen —');

/* Die Rechenarten heissen so, wie sie in der Oberfläche stehen — sie kommen
   aus RECHNUNGEN und sind deutsche Sätze, keine Kürzel. */
const r = (art, key = 'menge') => Dienst.rechne(art, ZEILEN, key, COLL);
p('Anzahl alle', String(r('Anzahl alle')) === '4', String(r('Anzahl alle')));
p('Summe',       String(r('Summe')) === '22', String(r('Summe')));
p('Minimum',     String(r('Minimum')) === '0', String(r('Minimum')));
p('Maximum',     String(r('Maximum')) === '12', String(r('Maximum')));

/* Der Durchschnitt über 3, 12, 0 und 7 ist 5.5 — die Null muss mitzählen.
   Lässt man sie weg, kommt 7.33 heraus, und niemand merkt den Unterschied,
   bis jemand nachrechnet. */
p('Der Durchschnitt zählt die Null mit',
  Math.abs(parseFloat(String(r('Durchschnitt')).replace(',', '.')) - 5.5) < 0.01,
  String(r('Durchschnitt')));

p('Leere zählen',    String(r('Leere zählen', 'wann')) === '1', String(r('Leere zählen', 'wann')));
p('Gefüllte zählen', String(r('Gefüllte zählen', 'wann')) === '3', String(r('Gefüllte zählen', 'wann')));

/* ========================================================================= *
 * 5 · SORTIEREN UND GRUPPIEREN
 * ========================================================================= */
console.log('\n— Sortieren und Gruppieren —');

/* `zeilen` nimmt erst die Sammlung, dann die Ansicht. Die Ansicht trägt
   `filters` (eine Gruppe) und `sorts` (eine Liste); absteigend heisst
   `richtung: 'ab'`. */
const sicht = (zusatz) => Object.assign({ id: 'v1', collectionId: 'c1' }, zusatz);
const namenVon = (liste) => liste.map(z => z.text);

gleich('Aufsteigend nach Zahl',
  namenVon(Dienst.zeilen(COLL, sicht({ sorts: [{ key: 'menge' }] }))),
  ['Salz', 'Brot', 'Öl', 'Milch']);

gleich('Absteigend nach Zahl',
  namenVon(Dienst.zeilen(COLL, sicht({ sorts: [{ key: 'menge', richtung: 'ab' }] }))),
  ['Milch', 'Öl', 'Brot', 'Salz']);

gleich('Gefiltert kommt weniger zurück',
  namenVon(Dienst.zeilen(COLL, sicht({
    filters: { operator: 'and', rules: [{ key: 'wer', op: 'ist', wert: 'Ada' }] } }))),
  ['Brot', 'Öl']);

/* `gruppeTrifftZu` nimmt eine ganze Filtergruppe, nicht ein einzelnes Paar —
   und kann sich selbst enthalten, damit „(A und B) oder C" möglich ist. */
const gruppe = (operator, ...rules) => ({ operator, rules });
const undGruppe = gruppe('and',
  { key: 'wer', op: 'ist', wert: 'Ada' },
  { key: 'menge', op: 'kleiner oder gleich', wert: 5 });

p('Eine UND-Gruppe trifft zu',  Dienst.gruppeTrifftZu(ZEILEN[0], undGruppe, COLL) === true);
p('Und bei der falschen nicht', Dienst.gruppeTrifftZu(ZEILEN[3], undGruppe, COLL) === false);

gleich('Bei ODER reicht eine Hälfte',
  ZEILEN.filter(z => Dienst.gruppeTrifftZu(z, gruppe('or',
    { key: 'wer', op: 'ist', wert: 'Bo' },
    { key: 'menge', op: 'größer als', wert: 5 }), COLL)).map(z => z.text),
  ['Milch', 'Öl']);

gleich('Gruppen dürfen ineinander stehen',
  ZEILEN.filter(z => Dienst.gruppeTrifftZu(z,
    gruppe('or', undGruppe, { key: 'menge', op: 'größer als', wert: 10 }), COLL)).map(z => z.text),
  ['Brot', 'Milch']);

/* Eine leere Gruppe filtert nichts weg — sonst wäre eine frisch angelegte
   Ansicht auf einen Schlag leer. */
p('Eine leere Gruppe lässt alles durch',
  ZEILEN.every(z => Dienst.gruppeTrifftZu(z, gruppe('and'), COLL)));

console.log(`\n  Suite 53 — Datenbank-Logik: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
