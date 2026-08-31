/* Suite 275 — Eins ist eine andere Zahl als zwei (L67 / E281)
 * ============================================================================
 * `Plural.count()` ist der gemeinsame Helfer, den E277 beschlossen hat. Er
 * ist klein genug, dass man ihn für offensichtlich hält — und genau bei
 * solchen Sachen stehen die Fehler jahrelang. „1 Einträge" stand in der
 * Bibliothek unter jeder Seite mit einem Kind, und die richtige Lösung stand
 * 146 Zeilen tiefer in DERSELBEN Datei (E231).
 *
 * Dieser Lauf braucht keinen Browser: der Helfer rechnet nur.
 *
 * ─── WAS GEPRÜFT WIRD ───────────────────────────────────────────────────────
 *   1. Die drei gewöhnlichen Fälle: null, eins, viele.
 *   2. Die Ränder, die ein `n === 1` falsch macht: minus eins, 1.5, 1.0.
 *   3. Kaputte Zahlen kommen nicht als „NaN Einträge" auf den Bildschirm.
 *   4. Die Null-Sonderform („Keine Einträge") — und dass sie ohne Angabe
 *      NICHT einspringt, damit sich nichts still ändert.
 *   5. Dass der Bereichs-Helfer in `arbeitswelt.ts` wirklich hierher zeigt
 *      und nicht seine eigene Rechnung behalten hat.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * Ja: Punkt 2 wäre mit der naiven Fassung `n === 1 ? one : many` bei -1
 * schon rot („-1 Grade"), und Punkt 3 gäbe „NaN Einträge". Beide Zeilen sind
 * unten mit der naiven Rechnung nachgestellt, damit man sieht, dass der
 * Unterschied echt ist.
 *
 *   node pruefungen/lauf/test275.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* Das erzeugte Modul laden — es hängt sich an `window`, das es hier nicht
   gibt. Also eines hinstellen und den Quelltext auswerten. Damit wird das
   GEBAUTE `quell/…js` geprüft und nicht die `.ts`-Quelle: genau das, was
   der Browser lädt. */
const fenster: any = {};
(globalThis as any).window = fenster;
const quelle = fs.readFileSync(
  path.join(WURZEL, 'quell/core/helpers/plural.js'), 'utf8');
// eslint-disable-next-line no-eval
(0, eval)(quelle);
const Plural = fenster.Plural;

console.log('\nSuite 275 — Eins ist eine andere Zahl als zwei (L67/E281)');

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die drei gewöhnlichen Fälle');
p('Der Helfer ist überhaupt da', !!Plural && typeof Plural.count === 'function');
gleich('null ist Mehrzahl',  Plural.count(0, 'Eintrag', 'Einträge'), '0 Einträge');
gleich('eins ist Einzahl',   Plural.count(1, 'Eintrag', 'Einträge'), '1 Eintrag');
gleich('sieben ist Mehrzahl', Plural.count(7, 'Eintrag', 'Einträge'), '7 Einträge');

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die Ränder, an denen `n === 1` falsch liegt');
/* Die naive Rechnung zum Vergleich — sie steht hier, damit der Unterschied
   nicht behauptet, sondern gezeigt wird. */
const naiv = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

gleich('minus eins ist Einzahl', Plural.count(-1, 'Grad', 'Grade'), '-1 Grad');
p('… und die naive Rechnung läge hier falsch',
  naiv(-1, 'Grad', 'Grade') === '-1 Grade',
  'wenn das nicht mehr stimmt, misst dieser Punkt nichts');

gleich('anderthalb ist Mehrzahl', Plural.count(1.5, 'Stunde', 'Stunden'), '1.5 Stunden');
gleich('1.0 ist ganz und damit eins', Plural.count(1.0, 'Stunde', 'Stunden'), '1 Stunde');

/* ------------------------------------------------------------------------ */
console.log('\n3 · Kaputte Zahlen kommen nicht auf den Bildschirm');
gleich('NaN wird zu einem Strich', Plural.count(NaN, 'Eintrag', 'Einträge'), '– Einträge');
gleich('Unendlich auch', Plural.count(Infinity, 'Eintrag', 'Einträge'), '– Einträge');
p('… und die naive Rechnung schriebe „NaN Einträge" hin',
  naiv(NaN, 'Eintrag', 'Einträge') === 'NaN Einträge');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die Null-Sonderform, und dass sie nicht von selbst einspringt');
gleich('Mit Angabe steht der ganze Satz da',
  Plural.count(0, 'Eintrag', 'Einträge', 'Keine Einträge'), 'Keine Einträge');
gleich('Ohne Angabe bleibt es bei der alten Form',
  Plural.count(0, 'Eintrag', 'Einträge'), '0 Einträge');
gleich('Die Sonderform gilt NUR bei null',
  Plural.count(2, 'Eintrag', 'Einträge', 'Keine Einträge'), '2 Einträge');

console.log('\n5 · Nur das Wort, ohne Zahl davor');
gleich('eins',  Plural.word(1, 'Seite', 'Seiten'), 'Seite');
gleich('drei',  Plural.word(3, 'Seite', 'Seiten'), 'Seiten');
gleich('null',  Plural.word(0, 'Seite', 'Seiten'), 'Seiten');

/* ------------------------------------------------------------------------ */
console.log('\n6 · Der Bereichs-Helfer zeigt wirklich hierher');
/* Sonst stünde die Rechnung zweimal da, und die zweite driftet. Genau das
   war der Ausgangspunkt von L67. */
const aw = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/arbeitswelt.ts'), 'utf8');
p('`zahlWort` in arbeitswelt.ts ruft Plural.count',
  /const zahlWort[\s\S]{0,200}?Plural\.count\(/.test(aw));
p('… und rechnet nicht mehr selbst',
  !/const zahlWort[\s\S]{0,200}?n === 1 \?/.test(aw),
  'die alte Verzweigung steht noch da');

/* Und das Gegenstück: der Helfer wird auch wirklich geladen. Ein Modul, das
   niemand einbindet, ist an window.Plural nicht da — und `zahlWort` würfe
   dann bei jedem Aufruf. */
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
p('index.html lädt quell/core/helpers/plural.js',
  html.includes('quell/core/helpers/plural.js'));
const sw = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
p('Und der Dienst-Arbeiter legt ihn mit in den Zwischenspeicher',
  sw.includes('quell/core/helpers/plural.js'),
  'sonst fehlt er beim Offline-Start');

/* ========================================================================= */
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
