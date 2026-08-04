/* Suite 74 — Der Tabellenkern, ohne Browser
 * ----------------------------------------------------------------------------
 * `AUFGABEN.md` A4 nennt den Grund, warum dieser Lauf so aussieht: reine
 * Logik ohne DOM lässt sich prüfen, ohne Chromium zu starten. Sekunden statt
 * Minuten — und ein Fehler fällt auf, bevor irgendeine Oberfläche existiert.
 *
 * Geprüft wird `src/core/spreadsheet/` über sein erzeugtes JavaScript. Nicht
 * die `.ts` direkt: geladen wird im Browser das `.js`, und wenn der
 * Übersetzer etwas anderes daraus macht, als in der Quelle steht, will man
 * das hier merken und nicht dort.
 *
 * ─── WAS EIN TABELLENPROGRAMM WIRKLICH KAPUTTMACHT ──────────────────────────
 *
 * Nicht die Summe. Die drei Stellen, an denen es weh tut:
 *
 *   · Der Zirkelbezug. `A1 → B1 → A1` friert ohne Erkennung den ganzen Tab
 *     ein — kein Fehler, kein Absturz, nur ein Fenster, das nicht mehr
 *     antwortet.
 *   · Die leere Zelle. Ist sie `undefined` statt 0, ergibt `=SUMME(A1:A9)`
 *     über einer halb gefüllten Spalte nichts statt der Summe.
 *   · Die Spalte nach Z. Nach `Z` kommt `AA`. Wer das als Basis 26 mit Null
 *     rechnet, liegt ab Spalte 27 daneben — und vorher nie.
 *
 *   node pruefungen/lauf/test110.mts
 * ==========================================================================*/
import { fileURLToPath as alsPfad } from 'node:url';
import { dirname as ordnerVon, resolve as loese, join as dazu } from 'node:path';
import { readFileSync as lies } from 'node:fs';

const WURZEL: string = loese(ordnerVon(alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: string, b: boolean, extra: string = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

/* Gewöhnliche Skripte in den echten globalen Raum — wie test106. Ein
   untergeschobenes Objekt reicht nicht: die Dateien sprechen einander ohne
   Vorsatz an. */
(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;
const laden = (pfad: string): void => { new Function(lies(dazu(WURZEL, pfad), 'utf8'))(); };

laden('quell/core/helpers/ids.js');
laden('quell/core/spreadsheet/address.js');
laden('quell/register/formeln.js');
laden('quell/bereiche/datenbanken/formeln/laufzeit.js');
laden('quell/core/spreadsheet/engine.js');

const CellRefs = (globalThis as any).CellRefs;
const Spreadsheet = (globalThis as any).Spreadsheet;

/* ==========================================================================
 * 1 · ADRESSEN
 * ========================================================================*/
console.log('\n1 · A1 und was dahintersteckt');

p('Beide Module sind geladen', !!CellRefs && !!Spreadsheet);

gleich('Spalte 0 heisst A', CellRefs.spalteZuText(0), 'A');
gleich('Spalte 25 heisst Z', CellRefs.spalteZuText(25), 'Z');
/* Die Falle: nach Z kommt AA, nicht BA. */
gleich('Spalte 26 heisst AA', CellRefs.spalteZuText(26), 'AA');
gleich('Spalte 27 heisst AB', CellRefs.spalteZuText(27), 'AB');
gleich('Spalte 51 heisst AZ', CellRefs.spalteZuText(51), 'AZ');
gleich('Spalte 52 heisst BA', CellRefs.spalteZuText(52), 'BA');
gleich('Spalte 701 heisst ZZ', CellRefs.spalteZuText(701), 'ZZ');
gleich('Spalte 702 heisst AAA', CellRefs.spalteZuText(702), 'AAA');

/* Und zurück — der Rundlauf ist die eigentliche Prüfung: eine Umrechnung,
   die nur in eine Richtung stimmt, fällt beim Lesen nicht auf. */
const rundlauf: number[] = [];
for (let i = 0; i < 3000; i++)
  if (CellRefs.textZuSpalte(CellRefs.spalteZuText(i)) !== i) rundlauf.push(i);
p('Hin und zurück stimmt für 3000 Spalten', rundlauf.length === 0,
  rundlauf.slice(0, 5).join(', '));

gleich('A1 ist Zeile 0, Spalte 0', CellRefs.lies('A1'), { zeile: 0, spalte: 0 });
gleich('B12 ist Zeile 11, Spalte 1', CellRefs.lies('B12'), { zeile: 11, spalte: 1 });
gleich('Kleinschreibung geht auch', CellRefs.lies('b12'), { zeile: 11, spalte: 1 });
gleich('Dollarzeichen stören nicht', CellRefs.lies('$B$12'), { zeile: 11, spalte: 1 });
gleich('A0 gibt es nicht', CellRefs.lies('A0'), null);
gleich('Unsinn ergibt null', CellRefs.lies('1A'), null);
gleich('Leer ergibt null', CellRefs.lies(''), null);
gleich('Zurückgeschrieben', CellRefs.schreibe(11, 1), 'B12');

gleich('Ein Bereich ergibt seine Zellen',
  CellRefs.zellenIn('A1:B2').adressen, ['A1', 'B1', 'A2', 'B2']);
/* Ein Mensch zieht die Maus auch von rechts unten nach links oben. */
gleich('Verkehrt herum ist derselbe Bereich',
  CellRefs.zellenIn('B2:A1').adressen, ['A1', 'B1', 'A2', 'B2']);
p('Ein sehr grosser Bereich wird abgelehnt statt gebaut',
  CellRefs.zellenIn('A1:ZZ100000').zuGross === true);
gleich('Nachbarzelle rechts', CellRefs.versetzt('A1', 0, 1), 'B1');
gleich('Nachbarzelle unten', CellRefs.versetzt('A1', 1, 0), 'A2');
gleich('Über den Rand hinaus gibt es nichts', CellRefs.versetzt('A1', -1, 0), '');

/* ==========================================================================
 * 2 · ÜBERSETZEN
 * ========================================================================*/
console.log('\n2 · Eine Zellformel wird zur Formel der Maschine');

const u1 = Spreadsheet.uebersetze('=A1*2');
gleich('Ein Bezug wird zu prop()', u1.quelle, 'prop("A1")*2');
gleich('… und steht im Graphen', u1.liest, ['A1']);

const u2 = Spreadsheet.uebersetze('=SUMME(A1:A3)');
gleich('Ein Bereich wird ausgeschrieben', u2.quelle,
  'SUMME(prop("A1"), prop("A2"), prop("A3"))');
gleich('… mit allen drei Zellen', u2.liest, ['A1', 'A2', 'A3']);

/* Die Stelle, an der ein naiver Ersetzer wütet. */
const u3 = Spreadsheet.uebersetze('="A1 ist leer"');
gleich('In einer Zeichenkette wird nichts ersetzt', u3.quelle, '"A1 ist leer"');
gleich('… und nichts eingesammelt', u3.liest, []);

const u4 = Spreadsheet.uebersetze('=LOG10(A1)');
p('Ein Funktionsname ist kein Bezug', /LOG10\(/.test(u4.quelle) && !/prop\("LOG10"\)/.test(u4.quelle),
  u4.quelle);
gleich('… und A1 darin schon', u4.liest, ['A1']);

gleich('Ohne Gleichheitszeichen geht es auch',
  Spreadsheet.uebersetze('A1+1').quelle, 'prop("A1")+1');
gleich('Leer bleibt leer', Spreadsheet.uebersetze('').quelle, '');

/* ==========================================================================
 * 3 · RECHNEN
 * ========================================================================*/
console.log('\n3 · Ein Blatt rechnet');

const blatt = Spreadsheet.neuesBlatt();
Spreadsheet.setze(blatt, 'A1', '5');
Spreadsheet.setze(blatt, 'A2', '7');
Spreadsheet.setze(blatt, 'A3', '=A1+A2');
Spreadsheet.setze(blatt, 'B1', '=SUMME(A1:A3)');
Spreadsheet.setze(blatt, 'C1', '=WENN(A1>5, "gross", "klein")');
Spreadsheet.setze(blatt, 'D1', 'Text');
Spreadsheet.setze(blatt, 'E1', '1,5');

const r1 = Spreadsheet.rechne(blatt);
p('Der Lauf meldet keinen Fehler', r1.fehler === null, String(r1.fehler));
gleich('A1 ist eine Zahl, kein Text', Spreadsheet.wert(blatt, 'A1'), 5);
gleich('Das deutsche Komma wird zur Zahl', Spreadsheet.wert(blatt, 'E1'), 1.5);
gleich('Text bleibt Text', Spreadsheet.wert(blatt, 'D1'), 'Text');
gleich('A3 = A1 + A2', Spreadsheet.wert(blatt, 'A3'), 12);
/* B1 liest A3, das selbst gerechnet werden muss — die Reihenfolge zählt. */
gleich('SUMME(A1:A3) rechnet mit dem NEUEN A3', Spreadsheet.wert(blatt, 'B1'), 24);
/* A1 ist 5, und `5 > 5` ist falsch. Die erste Fassung dieser Zeile erwartete
   „gross" — der Lauf hat mich widerlegt, nicht der Code. Jetzt steht hier der
   falsche Zweig, und weiter unten der wahre: dieselbe Formel, zwei Antworten,
   je nachdem was in A1 steht. Eine Bedingung, von der nur ein Zweig geprüft
   ist, ist halb geprüft. */
gleich('WENN nimmt den falschen Zweig', Spreadsheet.wert(blatt, 'C1'), 'klein');
gleich('Die Bearbeitungszeile zeigt die Formel',
  Spreadsheet.eingabe(blatt, 'A3'), '=A1+A2');
gleich('… und bei einer Zahl die Zahl', Spreadsheet.eingabe(blatt, 'A1'), '5');

/* Ändert sich eine Quelle, ändert sich alles darüber. */
Spreadsheet.setze(blatt, 'A1', '10');
Spreadsheet.rechne(blatt);
gleich('A3 rechnet nach', Spreadsheet.wert(blatt, 'A3'), 17);
gleich('Und B1 auch', Spreadsheet.wert(blatt, 'B1'), 34);
gleich('Und WENN nimmt jetzt den wahren Zweig',
  Spreadsheet.wert(blatt, 'C1'), 'gross');

/* Die leere Zelle: 0 und nicht nichts. */
const leer = Spreadsheet.neuesBlatt();
Spreadsheet.setze(leer, 'A1', '3');
Spreadsheet.setze(leer, 'A5', '4');
Spreadsheet.setze(leer, 'B1', '=SUMME(A1:A9)');
Spreadsheet.rechne(leer);
gleich('Leere Zellen zählen als 0, nicht als nichts',
  Spreadsheet.wert(leer, 'B1'), 7);

/* Löschen heisst löschen. */
Spreadsheet.setze(leer, 'A5', '');
Spreadsheet.rechne(leer);
gleich('Eine geleerte Zelle ist weg', Spreadsheet.wert(leer, 'B1'), 3);
p('… und steht nicht mehr im Blatt', leer.zellen['A5'] === undefined);

/* ==========================================================================
 * 4 · ZIRKELBEZÜGE
 * ------------------------------------------------------------------------
 * Der Grenzfall, an dem ein Tabellenprogramm den Tab einfriert.
 * ========================================================================*/
console.log('\n4 · Zirkelbezüge werden erkannt, nicht gerechnet');

const kreis = Spreadsheet.neuesBlatt();
Spreadsheet.setze(kreis, 'A1', '=B1');
Spreadsheet.setze(kreis, 'B1', '=A1');
const rk = Spreadsheet.rechne(kreis);
gleich('A1 und B1 liegen im Kreis', rk.zirkel, ['A1', 'B1']);
gleich('A1 zeigt #BEZUG!', Spreadsheet.wert(kreis, 'A1'), '#BEZUG!');
gleich('B1 auch', Spreadsheet.wert(kreis, 'B1'), '#BEZUG!');

/* Über drei Ecken, und eine Zelle daneben, die davon nichts weiss. */
const kreis3 = Spreadsheet.neuesBlatt();
Spreadsheet.setze(kreis3, 'A1', '=B1');
Spreadsheet.setze(kreis3, 'B1', '=C1');
Spreadsheet.setze(kreis3, 'C1', '=A1');
Spreadsheet.setze(kreis3, 'E1', '9');
Spreadsheet.setze(kreis3, 'E2', '=E1*2');
const rk3 = Spreadsheet.rechne(kreis3);
gleich('Auch über drei Ecken', rk3.zirkel, ['A1', 'B1', 'C1']);
gleich('Die unbeteiligte Zelle rechnet weiter', Spreadsheet.wert(kreis3, 'E2'), 18);

/* Eine Zelle, die sich selbst liest. */
const selbst = Spreadsheet.neuesBlatt();
Spreadsheet.setze(selbst, 'A1', '=A1+1');
gleich('Eine Zelle, die sich selbst liest', Spreadsheet.rechne(selbst).zirkel, ['A1']);

/* ==========================================================================
 * 5 · FEHLERWERTE
 * ========================================================================*/
console.log('\n5 · Fehler stehen in der Zelle, nicht in der Konsole');

const fehl = Spreadsheet.neuesBlatt();
Spreadsheet.setze(fehl, 'A1', '=gibtsnicht(1)');
Spreadsheet.setze(fehl, 'A2', '=SUMME(A1:ZZ100000)');
Spreadsheet.rechne(fehl);
gleich('Unbekannte Funktion ergibt #NAME?', Spreadsheet.wert(fehl, 'A1'), '#NAME?');
gleich('Ein zu grosser Bereich ergibt #BEZUG!', Spreadsheet.wert(fehl, 'A2'), '#BEZUG!');

/* Die ehrliche Lücke: die Laufzeit rechnet abwehrend, also kann dieser Kern
   #DIV/0! nicht liefern. Das steht so im Kopf von engine.ts, und diese
   Prüfung hält es fest — damit niemand glaubt, es sei schon da. */
const abwehr = Spreadsheet.neuesBlatt();
Spreadsheet.setze(abwehr, 'A1', '=1/0');
Spreadsheet.rechne(abwehr);
gleich('1/0 ergibt heute 0 und nicht #DIV/0!', Spreadsheet.wert(abwehr, 'A1'), 0);
p('Und der Kern sagt selbst, dass das eine Lücke ist',
  /#DIV\/0!` und `#ZAHL!` gibt es noch nicht/.test(
    lies(dazu(WURZEL, 'src/core/spreadsheet/engine.ts'), 'utf8')));

/* ==========================================================================
 * 6 · DER GRAPH
 * ========================================================================*/
console.log('\n6 · Der Abhängigkeitsgraph zeigt in beide Richtungen');

const g = Spreadsheet.neuesBlatt();
Spreadsheet.setze(g, 'A1', '1');
Spreadsheet.setze(g, 'A2', '2');
Spreadsheet.setze(g, 'B1', '=A1+A2');
Spreadsheet.setze(g, 'C1', '=B1*2');
const graph = Spreadsheet.graphVon(g.zellen);
gleich('B1 liest A1 und A2', graph.liest['B1'], ['A1', 'A2']);
gleich('C1 liest B1', graph.liest['C1'], ['B1']);
gleich('A1 wird von B1 gelesen', graph.gelesenVon['A1'], ['B1']);
gleich('B1 wird von C1 gelesen', graph.gelesenVon['B1'], ['C1']);

/* ==========================================================================
 * 7 · EINE MAPPE ÜBERLEBT DAS EIN- UND AUSPACKEN
 * ------------------------------------------------------------------------
 * Eine Tabelle ist ein Block, also geht sie durch JSON — in die Ablage, in
 * die Sicherung, durch den Abgleich. Was das nicht übersteht, ist verloren,
 * und zwar unbemerkt.
 * ========================================================================*/
console.log('\n7 · Eine Mappe übersteht JSON');

const mappe = Spreadsheet.neueMappe('Haushalt');
const b0 = mappe.blaetter[0];
Spreadsheet.setze(b0, 'A1', '100');
Spreadsheet.setze(b0, 'A2', '=A1*1,5');
Spreadsheet.rechne(b0);
const vorher = Spreadsheet.wert(b0, 'A2');

const zurueck = JSON.parse(JSON.stringify(mappe));
const r2 = Spreadsheet.rechne(zurueck.blaetter[0]);
p('Nach dem Rundlauf rechnet sie ohne Fehler', r2.fehler === null, String(r2.fehler));
gleich('Und ergibt dasselbe', Spreadsheet.wert(zurueck.blaetter[0], 'A2'), vorher);
gleich('Der Name bleibt', zurueck.name, 'Haushalt');
p('Die Kennungen bleiben', zurueck.blaetter[0].id === b0.id);
/* Nach dem Rundlauf darf sich nichts geändert haben — sonst hätte die
   Mappe beim Speichern etwas verloren, das beim Rechnen wieder entsteht. */
gleich('Es war nichts nachzurechnen', r2.geaendert, []);

console.log(`\n  Suite 74 — Der Tabellenkern: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
