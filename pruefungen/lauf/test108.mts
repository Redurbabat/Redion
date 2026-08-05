/* Suite 72 — Die Typen beschreiben die Wirklichkeit
 * ----------------------------------------------------------------------------
 * `src/core/types/` wird von `tsc` geprüft — aber nur gegen sich selbst.
 * TypeScript weiss nicht, was `laufzeit.js` zur Laufzeit wirklich
 * zurückgibt; es glaubt, was in der `.ts` steht. Ein Typ, der etwas
 * Schöneres behauptet als die Wirklichkeit, ist deshalb **grün** — und genau
 * so sind die vier erfundenen Feldnamen in `CLAUDE.md` §52.8 entstanden
 * (`createdAt`, `updatedAt`, `properties`, `deleted`, von denen es keinen
 * gab).
 *
 * Dieser Lauf schliesst die Lücke für die drei neuen Typdateien. Er liest
 * die `.ts` und hält sie gegen die laufende Maschine.
 *
 * ─── WARUM DIE ANGABEN AUS DER .TS GELESEN WERDEN ───────────────────────────
 *
 * Man könnte die erwarteten Werte hier hineinschreiben. Dann stünde
 * dieselbe Liste an zwei Stellen, und die zweite wäre die, die veraltet —
 * der wiederkehrende Befund dieses Projekts. Also wird die Typdatei
 * gelesen: sie ist die Quelle, dieser Lauf ist nur die Gegenprobe.
 *
 *   node pruefungen/lauf/test108.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* Dieselbe Ladeweise wie test106: gewöhnliche Skripte in den echten globalen
   Raum, weil `register/formeln.js` `Register` ohne Vorsatz anspricht. */
(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;
const laden = (pfad: any) => new Function(_lies(_dazu(WURZEL, pfad), 'utf8'))();
laden('quell/register/formeln.js');
laden('quell/bereiche/datenbanken/formeln/laufzeit.js');
const Formula = (globalThis as any).Formula;
const Register = (globalThis as any).Register;

const typQuelle = (datei: any) => _lies(_dazu(WURZEL, 'src/core/types/' + datei), 'utf8');
const FORMULA_TS = typQuelle('formula.ts');
const EXCEL_TS   = typQuelle('excel.ts');
const SHEET_TS   = typQuelle('spreadsheet.ts');

/* ========================================================================= *
 * 1 · FormulaScalar — die Werte, die wirklich herauskommen
 * ========================================================================= */
console.log('\n1 · FormulaScalar deckt ab, was herauskommt');

/* Aus der .ts gelesen: `export type FormulaScalar = number | string | …;` */
const scalarZeile = (FORMULA_TS.match(/export type FormulaScalar =([^;]+);/) || [])[1] || '';
const erlaubt = scalarZeile.split('|').map(s => s.trim()).filter(Boolean);
p('FormulaScalar liess sich aus der .ts lesen', erlaubt.length >= 4, scalarZeile.trim());

const artVon = (w: any) => {
  if (w === null) return 'null';
  if (w === undefined) return 'undefined';
  if (w instanceof Date) return 'Date';
  if (Array.isArray(w)) return 'Array';
  return typeof w;                       /* number | string | boolean */
};

/* Eine breite Auswahl echter Formeln — Alltag und Randfälle nebeneinander. */
const FORMELN = [
  '', '   ', '1 + 2', '"hallo"', '1 > 0', '[1, 2, 3]', '["a", 1]',
  'prop("gibtsnicht")', '""', 'SUMME(1; 2; 3)', 'WENN(1>0, "j", "n")',
  '1 / 0', 'WURZEL(-1)', 'WERT("abc")', '"a" * 2', 'sqrt("abc")',
  'HEUTE()', 'JETZT()', 'LÄNGE("abc")', 'GROSS("abc")', 'RUNDEN(1.567, 2)',
  'gibtsnicht(1)', 'sum(1, 2', '2e6', 'MIN(3, 1, 2)', 'ANZAHL(1, "x", 3)',
  'INDEX([1,2,3], 99)', 'SVERWEIS("x", [["a",1]], 2, false)', 'UND(1>0, 2>1)',
  'TEXTKETTE("a", "b")', 'TEIL("abcdef", 2, 3)', 'REST(-7, 3)'
];

const arten = new Set<string>();
const formen = [];
for (const f of FORMELN) {
  const r = Formula.run(f, () => undefined);
  arten.add(artVon(r.wert));
  formen.push({ f, r });
}
const unbekannt = [...arten].filter(a => a !== 'Array' && !(erlaubt ?? '').includes(a));
p('Kein Wert fällt aus FormulaScalar heraus', unbekannt.length === 0,
  'gemessen: ' + [...arten].sort().join(', ') + ' — nicht im Typ: ' + unbekannt.join(', '));
p('Und es wurden wirklich Formeln gerechnet', formen.length >= 30, String(formen.length));

/* ========================================================================= *
 * 2 · FormulaResult — die Form des Ergebnisses
 * ========================================================================= */
console.log('\n2 · Das Ergebnis hat immer eine der beiden Formen');

const falscheForm = [];
for (const { f, r } of formen) {
  if (typeof r.ok !== 'boolean') { falscheForm.push(f + ': ok=' + r.ok); continue; }
  if (r.ok) {
    if (r.fehler !== undefined) falscheForm.push(f + ': ok, aber fehler=' + r.fehler);
  } else {
    /* Die .ts behauptet `wert: ''` im Fehlerfall. Das ist die schärfste
       Angabe der Datei und deshalb die, die am ehesten falsch wäre. */
    if (r.wert !== '') falscheForm.push(f + ': fehlgeschlagen, aber wert=' + JSON.stringify(r.wert));
    if (typeof r.fehler !== 'string' || !r.fehler) falscheForm.push(f + ': ohne Fehlersatz');
  }
}
p('Bei ok=false ist wert immer die leere Zeichenkette', falscheForm.length === 0,
  falscheForm.slice(0, 3).join(' | '));
p('Die .ts behauptet genau das', /wert: ''/.test(FORMULA_TS));

const gescheitert = formen.filter(x => !x.r.ok);
p('Es sind wirklich welche gescheitert', gescheitert.length >= 2,
  String(gescheitert.length));

/* check() hat dieselbe Form ohne Wert. */
const c1 = Formula.check('sum(1, 2)'), c2 = Formula.check(')(');
p('check gibt dieselbe Form ohne Wert',
  c1.ok === true && c1.fehler === undefined &&
  c2.ok === false && typeof c2.fehler === 'string',
  JSON.stringify({ c1, c2 }));

/* ========================================================================= *
 * 3 · Die Entscheidung: keine Excel-Fehlerwerte in Datenbankformeln
 * ---------------------------------------------------------------------------
 * `FormulaValue` enthält KEINEN `FormulaErrorCode`, `CellValue` schon. Das
 * ist der ganze Unterschied zwischen den beiden Welten — und er ist nur so
 * lange wahr, wie die Laufzeit wirklich keine Fehlerwerte liefert.
 * ========================================================================= */
console.log('\n3 · Datenbankformeln rechnen abwehrend, ohne Fehlerwerte');

const codes = [...FORMULA_TS.matchAll(/\|\s*'(#[^']+)'/g)].map(m => m[1] ?? '');
p('Die Fehlerwerte stehen in der .ts', codes.length === 7, codes.join(' '));

const ausgaben = JSON.stringify(formen.map(x => x.r.wert));
const durchgerutscht = codes.filter(z => (ausgaben ?? '').includes(z));
p('Keiner davon kommt heute aus einer Formel', durchgerutscht.length === 0,
  durchgerutscht.join(' '));

p('FormulaValue kennt keinen Fehlerwert',
  /export type FormulaValue = FormulaScalar \| FormulaValue\[\];/.test(FORMULA_TS));
p('CellValue kennt ihn dagegen schon',
  /export type CellValue = FormulaValue \| FormulaErrorCode;/.test(SHEET_TS));

/* Die abwehrenden Werte selbst — sie stehen im Kommentar der .ts und müssen
   stimmen, sonst beschreibt der Kommentar eine andere Maschine. */
const abwehr = [['1 / 0', 0], ['WURZEL(-1)', 0], ['WERT("abc")', 0], ['"a" * 2', 0]];
const anders = abwehr.filter(([f, soll]) => Formula.run(f, () => undefined).wert !== soll);
p('1/0, WURZEL(-1), WERT("abc") und "a"*2 ergeben 0', anders.length === 0,
  JSON.stringify(anders));

/* ========================================================================= *
 * 4 · ExcelSyntax — beide Trennzeichen
 * ========================================================================= */
console.log('\n4 · Beide Trennzeichen gelten wirklich');

const trenner = (EXCEL_TS.match(/argumentSeparator: \[([^\]]+)\]/) || [])[1] || '';
const zeichen = [...trenner.matchAll(/'([^']+)'/g)].map(m => m[1]);
p('EXCEL_SYNTAX_ACCEPTED nennt die Trennzeichen', zeichen.length === 2, zeichen.join(' '));

const mitTrenner = zeichen.map(z => {
  const r = Formula.run('SUMME(1' + z + ' 2' + z + ' 3)', () => undefined);
  return { z, ok: r.ok, wert: r.wert };
});
p('Jedes genannte Trennzeichen rechnet',
  mitTrenner.every(x => x.ok && x.wert === 6), JSON.stringify(mitTrenner));

/* ========================================================================= *
 * 5 · FormulaCatalogEntry — die Form eines Registereintrags
 * ========================================================================= */
console.log('\n5 · Jeder Registereintrag hat die Felder, die der Typ nennt');

/* Welche Felder der Typ als Pflicht führt — aus der .ts gelesen, nicht hier
   noch einmal aufgeschrieben. Pflicht ist, was kein `?` trägt. */
const eintragBlock = (FORMULA_TS.match(
  /export interface FormulaCatalogEntry \{([\s\S]*?)\n\}/) || [])[1] || '';
const pflicht = [...eintragBlock.matchAll(/^\s{2}([a-zA-Z]+)(\??):/gm)]
  .filter(m => m[2] !== '?').map(m => m[1] ?? '');
const freiwillig = [...eintragBlock.matchAll(/^\s{2}([a-zA-Z]+)\?:/gm)].map(m => m[1]);
p('Die Pflichtfelder liessen sich aus der .ts lesen', pflicht.length >= 3,
  'Pflicht: ' + pflicht.join(', ') + ' · freiwillig: ' + freiwillig.join(', '));

const alle = Register.formeln.alle();
const luecken = [];
for (const e of alle) {
  for (const feld of pflicht)
    if (typeof e[feld] !== 'string' || !e[feld])
      luecken.push((e.name || '?') + ' ohne ' + feld);
}
p('Es gibt Einträge', alle.length >= 200, String(alle.length));
p('Alle Pflichtfelder sind gefüllt', luecken.length === 0, luecken.slice(0, 5).join(', '));

/* Und die Gegenprobe zu `was?`: der Typ nennt es freiwillig, weil es das
   wirklich ist. Stünde hier eine Null, wäre das `?` eine Beschönigung statt
   einer Angabe — und die Zahl gehört genannt, weil sie ein offener Punkt ist
   (LUECKEN.md L9) und kein Zustand, mit dem man sich abfindet. */
const ohneSatz = alle.filter((e: any) => !e.was);
p('`was` ist zu Recht freiwillig — es fehlt wirklich',
  (freiwillig ?? '').includes('was') && ohneSatz.length > 0,
  ohneSatz.length + ' von ' + alle.length + ' ohne Satz');
p('Und die Zahl liegt in der Grössenordnung aus LUECKEN.md L9',
  ohneSatz.length >= 100 && ohneSatz.length <= 200, String(ohneSatz.length));

const mitBeispiel = alle.filter((e: any) => e.beispiel);
p('`beispiel` ist optional und kommt vor',
  mitBeispiel.length > 0 && mitBeispiel.length < alle.length,
  mitBeispiel.length + ' von ' + alle.length);

/* ========================================================================= *
 * 6 · Der Kopf sagt, woran man ist
 * ---------------------------------------------------------------------------
 * `spreadsheet.ts` beschreibt als einzige Datei im Ordner etwas, das es noch
 * nicht gibt. Wer das nicht weiss, misst sie an einer Maschine, die es nicht
 * gibt — oder schlimmer: hält sie für gemessen.
 * ========================================================================= */
console.log('\n6 · Die Typdateien sagen, woher ihre Angaben stammen');

p('formula.ts nennt die Messung als Quelle',
  /GEMESSEN, NICHT ERWARTET/.test(FORMULA_TS));
p('spreadsheet.ts sagt, dass es den Block noch nicht gibt',
  /noch[\s*]+nicht[\s*]+gibt/.test(SHEET_TS));
p('excel.ts führt keine zweite Funktionsliste',
  /keine Liste aller Funktionen/.test(EXCEL_TS));

console.log(`\n  Suite 72 — Typen gegen Wirklichkeit: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
