/* Suite 72 — Suchen und Verweisen: die Funktionen, wegen derer man bei Excel bleibt
 * ----------------------------------------------------------------------------
 * `doku/EXCEL-IN-REDION-RECHERCHE.md` hat gemessen, dass Suche/Verweis mit
 * **3 von 13** die schwächste Gruppe war — und zugleich die, die in Excel die
 * eigentliche Arbeit trägt. `SVERWEIS` und `SUMMEWENN` sind das, wofür
 * Menschen Excel überhaupt öffnen.
 *
 * ─── DIE ENTWURFSFRAGE ──────────────────────────────────────────────────────
 *
 * Excel schreibt Bedingungen als **Text**: `ZÄHLENWENN(A1:A9; ">100")`. Das
 * ist eine eigene kleine Sprache — `>`, `>=`, `<`, `<=`, `<>`, `=`, dazu die
 * Platzhalter `*` und `?`.
 *
 * Redion hätte auch einen eigenen Weg: `filter(liste, current > 100)` gibt es
 * längst und ist mächtiger. Trotzdem versteht Redion hier die Excel-Sprache,
 * und zwar aus einem Grund: Wer diese Funktionen sucht, kommt aus Excel und
 * tippt, was er kennt. Eine Funktion, die `ZÄHLENWENN` heisst und etwas
 * anderes verlangt, ist eine Falle mit vertrautem Namen.
 *
 * Wer den Redion-Weg will, hat ihn weiterhin: `filter`, `find`, `countWhere`.
 *
 * ─── WAS DIESER LAUF PRÜFT ──────────────────────────────────────────────────
 *
 * Die Bedingungssprache Zeichen für Zeichen, die zehn Funktionen an echten
 * Listen, und die Grenzfälle, an denen solche Funktionen still falsch werden:
 * nichts gefunden · leere Liste · Spaltennummer daneben · ungleich lange
 * Listen.
 *
 *   node pruefungen/lauf/test107.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;
const laden = (pfad: any) => new Function(_lies(_dazu(WURZEL, pfad), 'utf8'))();
laden('quell/register/formeln.js');
laden('quell/bereiche/datenbanken/formeln/laufzeit.js');
const Formula = (globalThis as any).Formula;
const Register = (globalThis as any).Register;

const rechne = (quelltext: any) => {
  try {
    const e = Formula.run(quelltext, () => null, () => null, {});
    return e && e.ok ? { ok: true, wert: e.wert } : { ok: false, fehler: e && e.fehler };
  } catch (err: unknown) { return { ok: false, fehler: (err instanceof Error ? err.message : String(err)) }; }
};
const gleich = (n: any, quelle: any, soll: any) => {
  const e = rechne(quelle);
  p(n, e.ok && JSON.stringify(e.wert) === JSON.stringify(soll), JSON.stringify(e));
};

/* Ein kleiner Bestand, an dem sich alles zeigen lässt. */
const BETRAEGE = '[100, 250, 50, 250, 900]';
const ORTE     = '["Bern", "Zürich", "Bern", "Genf", "Zürich"]';
/* Eine Matrix wie ein Tabellenblatt: Kennung, Name, Preis. */
const MATRIX   = '[["A1", "Hammer", 20], ["A2", "Säge", 35], ["A3", "Zange", 12]]';

console.log('\n1 · Die Bedingungssprache');

/* [100, 250, 50, 250, 900] — über 200 sind es drei. */
gleich('">200" zählt drei',        `ZÄHLENWENN(${BETRAEGE}, ">200")`, 3);
gleich('">=250" zählt drei',       `ZÄHLENWENN(${BETRAEGE}, ">=250")`, 3);
gleich('"<100" zählt eines',       `ZÄHLENWENN(${BETRAEGE}, "<100")`, 1);
gleich('"<=100" zählt zwei',       `ZÄHLENWENN(${BETRAEGE}, "<=100")`, 2);
gleich('"250" zählt zwei',         `ZÄHLENWENN(${BETRAEGE}, "250")`, 2);
gleich('Eine blosse Zahl zählt auch', `ZÄHLENWENN(${BETRAEGE}, 250)`, 2);
gleich('"<>250" zählt drei',       `ZÄHLENWENN(${BETRAEGE}, "<>250")`, 3);
gleich('"=250" zählt zwei',        `ZÄHLENWENN(${BETRAEGE}, "=250")`, 2);
gleich('Text vergleicht sich',     `ZÄHLENWENN(${ORTE}, "Bern")`, 2);
gleich('Text ist blind für Gross/Klein', `ZÄHLENWENN(${ORTE}, "bern")`, 2);
gleich('Der Stern passt auf den Anfang',  `ZÄHLENWENN(${ORTE}, "Z*")`, 2);
gleich('Der Stern passt auf die Mitte',   `ZÄHLENWENN(${ORTE}, "*ür*")`, 2);
gleich('Das Fragezeichen ist genau eines', `ZÄHLENWENN(${ORTE}, "Ber?")`, 2);
gleich('Nichts passt: null',       `ZÄHLENWENN(${ORTE}, "Basel")`, 0);
gleich('Leere Liste: null',        'ZÄHLENWENN([], ">0")', 0);

console.log('\n2 · Zählen, summieren, mitteln');

gleich('ZÄHLENWENNS mit zwei Bedingungen',
  `ZÄHLENWENNS(${ORTE}, "Zürich", ${BETRAEGE}, ">200")`, 2);
gleich('SUMMEWENN über dieselbe Liste',
  `SUMMEWENN(${BETRAEGE}, ">200")`, 1400);
gleich('SUMMEWENN mit eigener Summenliste',
  `SUMMEWENN(${ORTE}, "Bern", ${BETRAEGE})`, 150);
gleich('SUMMEWENNS',
  `SUMMEWENNS(${BETRAEGE}, ${ORTE}, "Zürich", ${BETRAEGE}, ">200")`, 1150);
gleich('MITTELWERTWENN',
  `MITTELWERTWENN(${ORTE}, "Bern", ${BETRAEGE})`, 75);
gleich('MITTELWERTWENNS',
  `MITTELWERTWENNS(${BETRAEGE}, ${ORTE}, "Zürich")`, 575);
gleich('MITTELWERTWENN ohne Treffer gibt 0, nicht NaN',
  `MITTELWERTWENN(${ORTE}, "Basel", ${BETRAEGE})`, 0);

console.log('\n3 · SVERWEIS, WVERWEIS, XVERWEIS');

gleich('SVERWEIS holt die zweite Spalte',  `SVERWEIS("A2", ${MATRIX}, 2)`, 'Säge');
gleich('SVERWEIS holt die dritte Spalte',  `SVERWEIS("A2", ${MATRIX}, 3)`, 35);
gleich('SVERWEIS ohne Treffer gibt leer',  `SVERWEIS("A9", ${MATRIX}, 2)`, '');
gleich('SVERWEIS mit zu grosser Spalte gibt leer', `SVERWEIS("A2", ${MATRIX}, 9)`, '');
gleich('WVERWEIS sucht in der ersten Zeile',
  'WVERWEIS("b", [["a", "b", "c"], [1, 2, 3]], 2)', 2);
gleich('XVERWEIS mit getrennten Listen',
  `XVERWEIS("Genf", ${ORTE}, ${BETRAEGE})`, 250);
gleich('XVERWEIS ohne Treffer gibt den Ersatz',
  `XVERWEIS("Basel", ${ORTE}, ${BETRAEGE}, "unbekannt")`, 'unbekannt');
gleich('XVERWEIS ohne Treffer und ohne Ersatz gibt leer',
  `XVERWEIS("Basel", ${ORTE}, ${BETRAEGE})`, '');

console.log('\n4 · INDEX und VERGLEICH');

gleich('INDEX holt eine Zelle',        `INDEX(${MATRIX}, 2, 2)`, 'Säge');
gleich('INDEX ohne Spalte holt die Zeile', `INDEX(${MATRIX}, 2)`, ['A2', 'Säge', 35]);
gleich('INDEX auf einer flachen Liste', `INDEX(${BETRAEGE}, 2)`, 250);
gleich('INDEX daneben gibt leer',      `INDEX(${MATRIX}, 9, 1)`, '');
gleich('INDEX zählt ab 1, nicht ab 0', `INDEX(${BETRAEGE}, 1)`, 100);
/* Das Paar, mit dem man in Excel arbeitet, wenn SVERWEIS nicht reicht. */
/* VERGLEICH nimmt den Wert zuerst, dann die Liste — Excels Reihenfolge. */
gleich('INDEX und VERGLEICH zusammen',
  `INDEX(${BETRAEGE}, VERGLEICH("Genf", ${ORTE}))`, 250);

console.log('\n5 · FILTER');

gleich('FILTER nimmt eine Bedingung wie filter',
  `FILTER(${BETRAEGE}, current > 200)`, [250, 250, 900]);
/* Die Gegenrichtung: die eingebaute Listenfunktion bleibt, wie sie war. */
gleich('filter selbst bleibt unangetastet',
  'filter([1, 2, 3], current > 1)', [2, 3]);
/* FILTER wird in `evaluate` faul behandelt. Wäre der deutsche Name nur ein
   Zeiger in der Funktionstabelle, liefe er daran vorbei und bekäme statt der
   Bedingung deren ausgewertetes Ergebnis — genau der Fehler, den `WENN`
   schon einmal hatte. */
gleich('FILTER wertet die Bedingung je Element aus, nicht einmal',
  'FILTER([1, 2, 3], current > 1)', [2, 3]);

console.log('\n6 · Ungleich lange Listen brechen nichts');

/* In Excel ist das ein Fehler. Hier wird gekürzt statt geworfen: eine
   Sicherung oder ein Import kann Listen verschiedener Länge liefern, und ein
   Absturz mitten in einer Ansicht ist die schlechtere Antwort. */
gleich('SUMMEWENN mit kürzerer Summenliste',
  'SUMMEWENN([1, 2, 3], ">0", [10, 20])', 30);
gleich('ZÄHLENWENNS mit kürzerer zweiter Liste',
  'ZÄHLENWENNS([1, 2, 3], ">0", [1, 1], "1")', 2);

console.log('\n7 · Alles steht im Register');

const NAMEN = ['ZÄHLENWENN', 'ZÄHLENWENNS', 'SUMMEWENN', 'SUMMEWENNS',
               'MITTELWERTWENN', 'MITTELWERTWENNS', 'SVERWEIS', 'WVERWEIS',
               'XVERWEIS', 'INDEX', 'FILTER'];
const imRegister = new Set(Register.formeln.alle().map((f: any) => f.name.toLowerCase()));
const fehlen = NAMEN.filter(n => !imRegister.has(n.toLowerCase()));
p('Alle ' + NAMEN.length + ' Namen sind im Register', fehlen.length === 0, fehlen.join(', '));

const ohneWas = Register.formeln.alle()
  .filter((f: any) => NAMEN.some(n => n.toLowerCase() === f.name.toLowerCase()))
  .filter((f: any) => !f.was);
p('Jeder hat eine Beschreibung', ohneWas.length === 0, ohneWas.map((f: any) => f.name).join(', '));

const a = Register.formeln.abgleich();
p('Keine Beschreibung ohne Funktion', a.ohneFunktion.length === 0,
  a.ohneFunktion.slice(0, 6).join(', '));

console.log(`\n  Suite 72 — Suchen und Verweisen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
