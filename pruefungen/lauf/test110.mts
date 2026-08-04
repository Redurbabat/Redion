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
laden('quell/core/spreadsheet/csv.js');

const CellRefs = (globalThis as any).CellRefs;
const Spreadsheet = (globalThis as any).Spreadsheet;
const Csv = (globalThis as any).Csv;

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


/* ==========================================================================
 * 8 · EINE ZELLE LEEREN WIRFT DIE GESTALTUNG NICHT WEG
 * ------------------------------------------------------------------------
 * `setze(…, '')` hat den ganzen Eintrag gelöscht — mit Fett, Ausrichtung
 * und Währung. Wer eine Spalte formatiert, die Zahlen probeweise löscht und
 * neu tippt, stand wieder am Anfang und wusste nicht, warum.
 * ========================================================================*/
console.log('\n8 · Leeren behält die Gestaltung');

{
  const b = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(b, 'A1', '12');
  b.zellen['A1'].stil = { fett: true, format: { art: 'waehrung', stellen: 2 } };
  Spreadsheet.setze(b, 'A1', '');
  p('Die Zelle ist noch da', !!b.zellen['A1']);
  p('… ohne Inhalt', b.zellen['A1'] && b.zellen['A1'].wert === '');
  p('… aber mit Fett', !!(b.zellen['A1'] && b.zellen['A1'].stil && b.zellen['A1'].stil.fett));

  /* Eine Zelle OHNE Gestaltung verschwindet weiterhin ganz — sonst füllt
     sich das Blatt mit leeren Einträgen und die Sicherung wächst ohne
     einen einzigen Inhalt. */
  Spreadsheet.setze(b, 'B1', '5');
  Spreadsheet.setze(b, 'B1', '');
  p('Eine Zelle ohne Gestaltung verschwindet ganz', !b.zellen['B1']);

  /* Wahrheitswerte und erzwungener Text. */
  Spreadsheet.setze(b, 'C1', 'WAHR');
  p('WAHR ist ein Wahrheitswert', b.zellen['C1'].wert === true);
  Spreadsheet.setze(b, 'C2', 'falsch');
  p('falsch auch, ohne Rücksicht auf Gross und Klein', b.zellen['C2'].wert === false);
  Spreadsheet.setze(b, 'C3', "'0815");
  p('Ein führendes Hochkomma erzwingt Text', b.zellen['C3'].wert === '0815');
  Spreadsheet.setze(b, 'C4', '0815');
  p('… ohne Hochkomma wäre es die Zahl 815', b.zellen['C4'].wert === 815);
}

/* ==========================================================================
 * 9 · BEZÜGE WANDERN MIT
 * ------------------------------------------------------------------------
 * DIE STELLE, AN DER EINE TABELLE STILL FALSCH RECHNET. Wird über Zeile 5
 * etwas eingefügt und `=SUMME(A1:A9)` bleibt stehen, fehlt ab sofort eine
 * Zeile in jeder Summe. Nichts stürzt ab, nichts leuchtet rot — die Zahl
 * ist einfach falsch, und niemand merkt es, weil sie plausibel aussieht.
 * ========================================================================*/
console.log('\n9 · Bezüge nach Einfügen, Löschen und Ausfüllen');

/* ZUERST: dass der Zerleger das Dollarzeichen überhaupt sieht. Er sah es
   nicht — `\b` passt nicht vor ein `$`, also blieb es draussen stehen und
   `=$A$1` wurde zu `$prop("A1")`. Feste Bezüge gab es damit nie, und beim
   Ausfüllen wanderte `$A$1` mit, statt stehen zu bleiben. */
gleich('Ein fester Bezug wird ganz gelesen',
  Spreadsheet.uebersetze('=$A$1').quelle, 'prop("A1")');
gleich('… auch halb fest', Spreadsheet.uebersetze('=$A1+A$2').quelle, 'prop("A1")+prop("A2")');
gleich('… und als Bereich', Spreadsheet.uebersetze('=SUMME($A$1:$A$2)').quelle,
  'SUMME(prop("A1"), prop("A2"))');
gleich('Die wissenschaftliche Schreibweise bleibt eine Zahl',
  Spreadsheet.uebersetze('=2e6+A1').quelle, '2e6+prop("A1")');

gleich('Ausfüllen nach unten verschiebt mit', Spreadsheet.verschiebe('=A1+B1', 1, 0), '=A2+B2');
gleich('… nach rechts ebenso', Spreadsheet.verschiebe('=A1+A2', 0, 1), '=B1+B2');
gleich('$ hält die Spalte fest', Spreadsheet.verschiebe('=$A1', 0, 2), '=$A1');
gleich('$ hält die Zeile fest', Spreadsheet.verschiebe('=A$1', 3, 0), '=A$1');
gleich('Beides fest heisst gar nicht bewegen', Spreadsheet.verschiebe('=$A$1', 5, 5), '=$A$1');
gleich('Ein Bereich wandert ganz', Spreadsheet.verschiebe('=SUMME(A1:A3)', 1, 0), '=SUMME(A2:A4)');
gleich('Über den Rand hinaus wird die Formel #BEZUG!',
  Spreadsheet.verschiebe('=A1', -1, 0), '=#BEZUG!');
gleich('Eine Zeichenkette bleibt unangetastet',
  Spreadsheet.verschiebe('="A1 ist leer"', 1, 0), '="A1 ist leer"');
gleich('Ein Funktionsname ist kein Bezug',
  Spreadsheet.verschiebe('=SUMME(A1)', 1, 0), '=SUMME(A2)');
gleich('Ein Wert ohne = wird nicht angefasst', Spreadsheet.verschiebe('A1', 1, 0), 'A1');

gleich('Zeile eingefügt: der Bereich wächst',
  Spreadsheet.bezuegeNachEingriff('=SUMME(A1:A9)', 'zeile', 4, 1), '=SUMME(A1:A10)');
gleich('… und ein fester Bezug wandert MIT',
  Spreadsheet.bezuegeNachEingriff('=$A$9', 'zeile', 4, 1), '=$A$10');
gleich('Zeile gelöscht: der Bereich schrumpft',
  Spreadsheet.bezuegeNachEingriff('=SUMME(A1:A9)', 'zeile', 4, -1), '=SUMME(A1:A8)');
gleich('Zeigt eine Formel auf die gelöschte Zeile, wird sie #BEZUG!',
  Spreadsheet.bezuegeNachEingriff('=A5*2', 'zeile', 4, -1), '=#BEZUG!');
gleich('Spalte eingefügt: die Buchstaben rücken',
  Spreadsheet.bezuegeNachEingriff('=B1+C1', 'spalte', 1, 1), '=C1+D1');

{
  /* Und jetzt am ganzen Blatt, nicht nur am Text. */
  const b = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(b, 'A1', '1');
  Spreadsheet.setze(b, 'A2', '2');
  Spreadsheet.setze(b, 'A3', '3');
  Spreadsheet.setze(b, 'B1', '=SUMME(A1:A3)');
  Spreadsheet.rechne(b);
  gleich('Vorher: die Summe stimmt', Spreadsheet.wert(b, 'B1'), 6);

  Spreadsheet.zeileEinfuegen(b, 1);        /* eine Zeile über der zweiten */
  Spreadsheet.setze(b, 'A2', '10');
  Spreadsheet.rechne(b);
  gleich('Die Zahlen sind mitgezogen', Spreadsheet.wert(b, 'A3'), 2);
  gleich('Der Bereich hat sich geweitet', Spreadsheet.eingabe(b, 'B1'), '=SUMME(A1:A4)');
  gleich('Und die neue Zahl zählt mit', Spreadsheet.wert(b, 'B1'), 16);

  Spreadsheet.zeileLoeschen(b, 1);
  Spreadsheet.rechne(b);
  gleich('Nach dem Löschen wieder wie vorher', Spreadsheet.wert(b, 'B1'), 6);
  gleich('… und der Bereich auch', Spreadsheet.eingabe(b, 'B1'), '=SUMME(A1:A3)');
}

{
  /* Die Falle beim Einfügen: von vorn nach hinten kopiert überschreibt
     Zeile 5 die Zeile 6, bevor die selbst umgezogen ist. */
  const b = Spreadsheet.neuesBlatt();
  for (let z = 0; z < 5; z++) Spreadsheet.setze(b, 'A' + (z + 1), String(z + 1));
  Spreadsheet.zeileEinfuegen(b, 0);
  gleich('Beim Einfügen geht keine Zeile verloren',
    [1, 2, 3, 4, 5].map(z => Spreadsheet.wert(b, 'A' + (z + 1))), [1, 2, 3, 4, 5]);
  p('… und die erste Zeile ist leer', Spreadsheet.wert(b, 'A1') === '');
}

/* ==========================================================================
 * 10 · DER ANFASSER HÄLT, WAS ER VERSPRICHT
 * ------------------------------------------------------------------------
 * `DESIGN-TABELLE.md` nennt das Quadrat unten rechts „das Zeichen, an dem
 * ein Mensch die Tabelle als Tabelle erkennt". Ein Zeichen, das nichts tut,
 * ist eine Lüge in der Oberfläche.
 * ========================================================================*/
console.log('\n10 · Ausfüllen');

{
  const b = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(b, 'A1', '2');
  Spreadsheet.setze(b, 'A2', '4');
  Spreadsheet.fuelle(b, { vonZ: 0, bisZ: 1, vonS: 0, bisS: 0 }, 5, 0);
  gleich('Zwei Zahlen setzen die Reihe fort',
    [2, 3, 4, 5].map(z => Spreadsheet.wert(b, 'A' + (z + 1))), [6, 8, 10, 12]);

  const c = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(c, 'A1', 'Montag');
  Spreadsheet.fuelle(c, { vonZ: 0, bisZ: 0, vonS: 0, bisS: 0 }, 2, 0);
  gleich('Ein einzelner Text wird wiederholt',
    [1, 2].map(z => Spreadsheet.wert(c, 'A' + (z + 1))), ['Montag', 'Montag']);

  const d = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(d, 'A1', '3');
  Spreadsheet.setze(d, 'A2', '4');
  Spreadsheet.setze(d, 'B1', '=A1*2');
  Spreadsheet.fuelle(d, { vonZ: 0, bisZ: 0, vonS: 1, bisS: 1 }, 1, 1);
  gleich('Eine Formel wird mitverschoben', Spreadsheet.eingabe(d, 'B2'), '=A2*2');
  Spreadsheet.rechne(d);
  gleich('… und rechnet dann auch richtig', Spreadsheet.wert(d, 'B2'), 8);

  /* Ausfüllen darf das Blatt wachsen lassen — sonst fällt der Rest weg. */
  const e = Spreadsheet.neuesBlatt('T', 3, 3);
  Spreadsheet.setze(e, 'A1', '1');
  Spreadsheet.fuelle(e, { vonZ: 0, bisZ: 0, vonS: 0, bisS: 0 }, 9, 0);
  p('Das Blatt wächst beim Ausfüllen mit', e.zeilen >= 10, String(e.zeilen));
}

/* ==========================================================================
 * 11 · SORTIEREN
 * ========================================================================*/
console.log('\n11 · Sortieren');

{
  const b = Spreadsheet.neuesBlatt();
  [['Birne', '3'], ['Apfel', '10'], ['Citrone', '']].forEach(([n, z], i) => {
    Spreadsheet.setze(b, 'A' + (i + 1), n);
    Spreadsheet.setze(b, 'B' + (i + 1), z);
  });
  Spreadsheet.sortiere(b, 0, 0, 2, true);
  gleich('Nach Text aufsteigend',
    [1, 2, 3].map(z => Spreadsheet.wert(b, 'A' + z)), ['Apfel', 'Birne', 'Citrone']);
  gleich('Die ganze Zeile geht mit',
    [1, 2].map(z => Spreadsheet.wert(b, 'B' + z)), [10, 3]);

  Spreadsheet.sortiere(b, 1, 0, 2, true);
  gleich('Nach Zahl aufsteigend — und Leeres steht unten',
    [1, 2, 3].map(z => Spreadsheet.wert(b, 'B' + z)), [3, 10, '']);
}


/* ==========================================================================
 * 12 · CSV — DER ZERLEGER, DESSEN FEHLER IN DEN RANDFÄLLEN SITZEN
 * ------------------------------------------------------------------------
 * `Datenbank.csvZerlegen` gibt es seit langem und ist für Datenbanken
 * richtig. Für eine Tabelle hat er zwei Eigenschaften, die DATEN ZERSTÖREN,
 * und beide stehen hier als Gegenprobe.
 *
 * **Er trennt bei Komma UND Semikolon gleichzeitig.** Eine deutsche Datei
 * benutzt das Semikolon zum Trennen und das Komma als Dezimalzeichen:
 *
 *     Miete;1450,50;Januar
 *
 * Daraus werden dort fünf Felder statt drei, und aus `1450,50` werden `1450`
 * und `50`. Der Betrag ist weg, und es sieht nicht nach einem Fehler aus —
 * es sieht nach zwei Spalten mehr aus.
 *
 * **Er wirft leere Zeilen weg.** In einer Datenbank ist eine leere Zeile
 * nichts. In einer Tabelle rutscht alles darunter um eins hoch, und jede
 * Formel, die auf `A12` zeigte, meint danach etwas anderes.
 * ========================================================================*/
console.log('\n12 · CSV lesen und schreiben');

gleich('Semikolon wird als Trenner erkannt',
  Csv.erkenneTrenner('Miete;1450,50;Januar'), ';');
gleich('Komma auch, wenn es die Datei so meint',
  Csv.erkenneTrenner('a,b,c\n1,2,3'), ',');
gleich('Tabulator auch', Csv.erkenneTrenner('a\tb\tc'), '\t');

/* DER FALL, AN DEM DER ALTE ZERLEGER SCHEITERT. */
gleich('Deutsche Zahlen bleiben ganz',
  Csv.zerlege('Miete;1450,50;Januar'), [['Miete', '1450,50', 'Januar']]);

/* Ein Komma IM Anführungszeichen darf beim Zählen nicht mitreden — sonst
   entscheidet sich eine Datei voller Namen regelmässig falsch. */
gleich('Ein Komma im Namen zählt nicht als Trenner',
  Csv.erkenneTrenner('"Meier, Hans";"Müller, Eva";3'), ';');
gleich('… und wird auch nicht getrennt',
  Csv.zerlege('"Meier, Hans";42'), [['Meier, Hans', '42']]);

gleich('Anführungszeichen im Anführungszeichen',
  Csv.zerlege('"Er sagte ""hallo""";2'), [['Er sagte "hallo"', '2']]);
gleich('Zeilenumbruch im Feld bleibt drin',
  Csv.zerlege('"Zeile 1\nZeile 2";x'), [['Zeile 1\nZeile 2', 'x']]);
gleich('Windows-Umbrüche', Csv.zerlege('a;b\r\nc;d'), [['a', 'b'], ['c', 'd']]);
gleich('Das BOM aus Excel verschwindet', Csv.zerlege('﻿Name;Wert'), [['Name', 'Wert']]);

/* DIE ZWEITE STELLE, an der der alte Zerleger Daten verschiebt. */
gleich('Eine leere Zeile MITTENDRIN bleibt eine Zeile',
  Csv.zerlege('a;b\n;\nc;d'), [['a', 'b'], ['', ''], ['c', 'd']]);
gleich('Leere Zeilen am ENDE fallen weg',
  Csv.zerlege('a;b\nc;d\n\n\n'), [['a', 'b'], ['c', 'd']]);
gleich('Die letzte Zeile ohne Umbruch geht nicht verloren',
  Csv.zerlege('a;b\nSumme;42'), [['a', 'b'], ['Summe', '42']]);
gleich('Leerer Text ergibt nichts', Csv.zerlege(''), []);

/* Schreiben — und der Rundlauf, der beides zugleich prüft. */
gleich('Ein Feld mit Trenner bekommt Anführungszeichen',
  Csv.schreibe([['Meier; Hans', '42']]), '"Meier; Hans";42');
gleich('Ein Anführungszeichen wird verdoppelt',
  Csv.schreibe([['sagte "ja"']]), '"sagte ""ja"""');
p('Vor der Datei steht das BOM — sonst liest Excel Müller als MÃ¼ller',
  Csv.mitBom('a;b').charCodeAt(0) === 0xFEFF);

{
  /* DER RUNDLAUF. Genau das, was `AUFGABEN.md` Phase 8 verlangt:
     schreiben, einlesen, vergleichen — und zwar mit den Zeichen, die
     wehtun. */
  const drin = [
    ['Posten', 'Betrag', 'Bemerkung'],
    ['Miete', '1450,50', 'Meier; Hans'],
    ['Strom', '98,40', 'sagte "ja"'],
    ['', '', ''],
    ['Zeile\nmit Umbruch', '0', ''],
    ['Summe', '1548,90', '']
  ];
  gleich('Rundlauf: geschrieben und wieder eingelesen ist dasselbe',
    Csv.zerlege(Csv.schreibe(drin)), drin);
  gleich('… auch mit BOM davor',
    Csv.zerlege(Csv.mitBom(Csv.schreibe(drin))), drin);
  gleich('… und mit Tabulator statt Semikolon',
    Csv.zerlege(Csv.schreibe(drin, '\t'), '\t'), drin);
}


/* ==========================================================================
 * 13 · MEHRERE BLÄTTER
 * ------------------------------------------------------------------------
 * `Januar!A1` darf auf `Februar!B2` zeigen. Daraus folgt mehr, als es
 * aussieht:
 *
 * **Gerechnet wird die MAPPE, nicht das Blatt.** Blatt für Blatt hinge das
 * Ergebnis an der Reihenfolge der Blätter — und ein Zirkelbezug über zwei
 * Blätter fiele gar nicht auf, weil jedes Blatt für sich kreisfrei ist.
 *
 * **Jeder Knoten trägt seinen Blattnamen.** Sonst hiessen `Januar!A1` und
 * `Februar!A1` im Graphen beide `A1`, würden zusammengelegt, und ein Blatt
 * rechnete mit dem Wert des anderen. Das ist die Art Fehler, die erst beim
 * zweiten Blatt entsteht und dann überall falsch ist.
 *
 * **Ein fehlendes Blatt ist `#BEZUG!` und nicht 0.** Wer ein Blatt löscht,
 * auf das eine Summe zeigt, soll das sehen. Still als Null zu rechnen wäre
 * die schlimmere Antwort: die Summe stimmte nicht und sähe richtig aus.
 * ========================================================================*/
console.log('\n13 · Mehrere Blätter');

gleich('Ein Bezug mit Blattnamen wird gelesen',
  Spreadsheet.uebersetze('=Januar!A1').quelle, 'prop("Januar!A1")');
gleich('… auch mit Leerzeichen im Namen',
  Spreadsheet.uebersetze("='Mein Blatt'!A1").quelle, 'prop("Mein Blatt!A1")');
gleich('Ein Bereich mit Blattnamen wird ausgeschrieben',
  Spreadsheet.uebersetze('=SUMME(Januar!A1:A2)').quelle,
  'SUMME(prop("Januar!A1"), prop("Januar!A2"))');
gleich('Ohne Blattnamen gilt das eigene Blatt',
  Spreadsheet.uebersetze('=A1', 'Februar').quelle, 'prop("Februar!A1")');
gleich('… und der Blattname steht dann auch beim Gelesenen',
  Spreadsheet.uebersetze('=A1+Januar!B2', 'Februar').liest,
  ['Februar!A1', 'Januar!B2']);

/* DIE STELLE, AN DER SO EIN AUSDRUCK SONST STOLPERT. `A1!=B1` ist ein
   Vergleich und kein Blattname — der Zerleger muss den Versuch zurücknehmen. */
gleich('`A1!=B1` bleibt ein Vergleich und wird kein Blattname',
  Spreadsheet.uebersetze('=A1!=B1').quelle, 'prop("A1")!=prop("B1")');
gleich('Ein Bereich über zwei Blätter wird gemeldet, nicht geraten',
  Spreadsheet.uebersetze('=SUMME(Januar!A1:Februar!A2)').fehler !== null, true);

{
  /* Und jetzt an einer echten Mappe. */
  const mappe = Spreadsheet.neueMappe('Jahr');
  const jan = mappe.blaetter[0];
  jan.name = 'Januar';
  const feb = Spreadsheet.neuesBlatt('Februar');
  mappe.blaetter.push(feb);

  Spreadsheet.setze(jan, 'A1', '100');
  Spreadsheet.setze(jan, 'A2', '50');
  Spreadsheet.setze(feb, 'A1', '=SUMME(Januar!A1:A2)');
  Spreadsheet.setze(feb, 'A2', '=A1*2');

  const erg = Spreadsheet.rechneMappe(mappe);
  p('Die Mappe rechnet ohne Fehler', erg.fehler === null, String(erg.fehler));
  gleich('Februar liest aus Januar', Spreadsheet.wert(feb, 'A1'), 150);
  gleich('… und rechnet damit weiter', Spreadsheet.wert(feb, 'A2'), 300);
  gleich('Januar bleibt unangetastet', Spreadsheet.wert(jan, 'A1'), 100);

  /* Ein Zirkelbezug ÜBER ZWEI BLÄTTER — das, was blattweises Rechnen
     niemals findet. */
  Spreadsheet.setze(jan, 'B1', '=Februar!B1+1');
  Spreadsheet.setze(feb, 'B1', '=Januar!B1+1');
  const kreis = Spreadsheet.rechneMappe(mappe);
  gleich('Ein Kreis über zwei Blätter wird gefunden',
    kreis.zirkel.sort(), ['Februar!B1', 'Januar!B1']);
  gleich('… und beide Zellen bekommen #BEZUG!',
    [Spreadsheet.wert(jan, 'B1'), Spreadsheet.wert(feb, 'B1')], ['#BEZUG!', '#BEZUG!']);

  /* Das Blatt löschen, auf das gezeigt wird. */
  Spreadsheet.setze(jan, 'B1', '');
  Spreadsheet.setze(feb, 'B1', '');
  mappe.blaetter = [jan];
  const ohne = Spreadsheet.rechneMappe({ blaetter: [feb] });
  gleich('Zeigt eine Formel auf ein fehlendes Blatt, steht #BEZUG! da',
    Spreadsheet.wert(feb, 'A1'), '#BEZUG!');
  p('… und nicht still eine 0', Spreadsheet.wert(feb, 'A1') !== 0);
  p('Gerechnet wurde trotzdem ohne Absturz', ohne.fehler === null);
}

{
  /* Eine Mappe mit EINEM Blatt muss weiterhin unqualifizierte Namen
     melden — sonst hiessen die Zirkelbezüge in jeder alten Tabelle
     plötzlich anders. */
  const b = Spreadsheet.neuesBlatt();
  Spreadsheet.setze(b, 'A1', '=B1');
  Spreadsheet.setze(b, 'B1', '=A1');
  const erg = Spreadsheet.rechne(b);
  gleich('Bei einem Blatt heissen die Kreise weiterhin A1 und B1',
    erg.zirkel, ['A1', 'B1']);
}

/* UMBENENNEN — und warum es ohne Nachziehen gefährlich wäre: nach dem
   Umbenennen zeigt sonst jede Formel ins Leere, sofort und überall. */
gleich('Beim Umbenennen wandert der Blattname mit',
  Spreadsheet.blattUmbenannt('=SUMME(Januar!A1:A9)', 'Januar', 'Jan'), '=SUMME(Jan!A1:A9)');
gleich('… auch bei einem Namen mit Leerzeichen',
  Spreadsheet.blattUmbenannt("='Mein Blatt'!A1", 'Mein Blatt', 'Deins'), '=Deins!A1');
gleich('… und bekommt Anführungszeichen, wenn der neue Name welche braucht',
  Spreadsheet.blattUmbenannt('=Jan!A1', 'Jan', 'Der Januar'), "='Der Januar'!A1");
gleich('Ein anderes Blatt bleibt unberührt',
  Spreadsheet.blattUmbenannt('=Februar!A1', 'Januar', 'Jan'), '=Februar!A1');
gleich('Ein Bezug ohne Blattnamen bleibt ohne',
  Spreadsheet.blattUmbenannt('=A1+B2', 'Januar', 'Jan'), '=A1+B2');
gleich('Ein Text, der zufällig so heisst, bleibt Text',
  Spreadsheet.blattUmbenannt('="Januar!A1"', 'Januar', 'Jan'), '="Januar!A1"');

gleich('Ein Blattname wird abgetrennt',
  Spreadsheet.trenneBlatt("'Mein Blatt'!A1"), { blatt: 'Mein Blatt', adresse: 'A1' });
gleich('… und wieder angehängt, mit Anführungszeichen wo nötig',
  Spreadsheet.mitBlatt('Mein Blatt', 'A1'), "'Mein Blatt'!A1");
gleich('… ohne, wo keine nötig sind', Spreadsheet.mitBlatt('Januar', 'A1'), 'Januar!A1');

console.log(`\n  Suite 74 — Der Tabellenkern: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
