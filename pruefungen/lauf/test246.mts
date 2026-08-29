/* ============================================================================
 * test246 — Der Lösungsweg (E209)
 * ----------------------------------------------------------------------------
 * OHNE BROWSER. Hier wird gerechnet, nicht gezeichnet — und eine Rechnung
 * braucht kein Fenster. Der Lauf dauert Sekundenbruchteile statt einer halben
 * Minute, und genau deshalb kann er alle Grenzfälle durchgehen, statt sich auf
 * drei zu beschränken.
 *
 * Geprüft wird, was der Weg BEHAUPTET:
 *
 *   §1  Die Zahlen stimmen — gegen von Hand nachgerechnete Werte.
 *   §2  Die eingesetzte Zeile trägt das Ergebnis, das danebensteht.
 *   §3  Ein Name ohne Wert wird gemeldet und bleibt nicht stehen.
 *   §4  Zu kurz gerundete Zahlen werden gemeldet.
 *   §5  „cosφ" wird nicht von „φ" zerlegt.
 *   §6  Das Urteil sagt, ob es hält — und sagt es im Satz.
 *   §7  Der Text, den man übernimmt, enthält den ganzen Weg.
 *   §8  Kein eval, kein Function.
 * ==========================================================================*/

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let ok = 0, weg = 0;
const fehler: string[] = [];
const p = (name: string, wahr: boolean, zusatz = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + name); }
  else { weg++; fehler.push(name); console.log('  ✗ ' + name + (zusatz ? ' — ' + zusatz : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown): void =>
  p(name, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
/** Zahlen vergleichen, ohne auf der letzten Stelle zu streiten. */
const nah = (name: string, ist: number, soll: number, toleranz = 0.0005): void =>
  p(name, Math.abs(ist - soll) <= Math.abs(soll) * toleranz,
    `ist ${ist}, soll ${soll} (± ${toleranz * 100} %)`);

/* Das erzeugte Modul laden — dasselbe, das der Browser lädt. `window` gibt es
   hier nicht, also wird es gestellt: die letzte Zeile der Datei hängt sich
   daran, und ohne sie käme nichts heraus. */
const quelle = readFileSync(join(WURZEL, 'quell/core/electrical/rechenweg.js'), 'utf8');
const fenster: any = {};
new Function('window', quelle)(fenster);
const Rechenweg = fenster.Rechenweg;

console.log('\n══ test246 — Der Lösungsweg (E209) ══');
p('Das Modul hängt sich an', !!Rechenweg && typeof Rechenweg.spannungsfall === 'function');

/* ==========================================================================
 * §1 · Die Zahlen stimmen
 * --------------------------------------------------------------------------
 * Die Aufgabe steht im abgenommenen Entwurf: 38 m Zuleitung, 2,5 mm² Kupfer,
 * zwölf Leuchten zu je 58 W bei 230 V, cos φ = 0,95.
 *
 * Die Sollwerte sind VON HAND nachgerechnet und nicht aus dem Modul kopiert.
 * Eine Prüfung, die ihr Soll aus dem Prüfling holt, bestätigt jeden Fehler.
 * ========================================================================*/
console.log('\n1 · Die Zahlen stimmen');
const weg1 = Rechenweg.spannungsfall({
  leistungW: 12 * 58, spannungV: 230, cosPhi: 0.95,
  laengeM: 38, querschnittMm2: 2.5, werkstoff: 'kupfer'
});
gleich('Vier Schritte', weg1.schritte.length, 4);
nah('I  = 696 / (230 · 0,95)          = 3,1854 A', weg1.schritte[0].wert, 3.18535);
nah('R  = 0,0178 · 2 · 38 / 2,5       = 0,54112 Ω', weg1.schritte[1].wert, 0.541120);
nah('ΔU = 3,1854 · 0,54112 · 0,95     = 1,6375 V', weg1.schritte[2].wert, 1.637551);
nah('ΔU% = 1,6375 / 230 · 100         = 0,7120 %', weg1.schritte[3].wert, 0.711979);
nah('Gegenprobe PV = I² · R           = 5,4905 W', weg1.gegenprobe.wert, 5.490527);
gleich('Das Ergebnis ist der Spannungsfall in Prozent',
  weg1.ergebnis.einheit, '%');

/* Der Faktor 2 ist der Hin- UND Rückweg. Ohne ihn käme die Hälfte heraus, und
   das ist der Fehler, den Lehrlinge am häufigsten machen — er muss dastehen. */
p('Der Hin- und Rückweg steht als Hinweis am Schritt',
  weg1.schritte[1].hinweis === 'Hin- und Rückweg', String(weg1.schritte[1].hinweis));

/* Aluminium leitet schlechter — dieselbe Leitung fällt stärker ab. */
const weg2 = Rechenweg.spannungsfall({
  leistungW: 12 * 58, spannungV: 230, cosPhi: 0.95,
  laengeM: 38, querschnittMm2: 2.5, werkstoff: 'aluminium'
});
p('Aluminium ergibt einen grösseren Spannungsfall als Kupfer',
  weg2.ergebnis.wert > weg1.ergebnis.wert,
  `Al ${weg2.ergebnis.wert}, Cu ${weg1.ergebnis.wert}`);
nah('… und zwar im Verhältnis der spezifischen Widerstände',
  weg2.ergebnis.wert / weg1.ergebnis.wert, 0.0278 / 0.0178, 0.001);

/* ==========================================================================
 * §2 · Die eingesetzte Zeile trägt ihr Ergebnis
 * --------------------------------------------------------------------------
 * DER PUNKT, UM DEN ES GEHT. Wer die gezeigte Zeile mit dem Taschenrechner
 * nachrechnet, muss auf die Zahl daneben kommen. Beim ersten Entwurf stand
 * ϱ = 0,0178 als „0,018" da — 0,018 · 2 · 38 / 2,5 ergibt 0,547 statt 0,541.
 *
 * Nachgerechnet wird hier OHNE eval: die Zeilen dieser Aufgabe haben eine
 * bekannte Gestalt, und sie von Hand zu zerlegen ist ehrlicher als einen
 * Auswerter zu bauen, den niemand sonst benutzt (§20).
 * ========================================================================*/
console.log('\n2 · Die eingesetzte Zeile trägt ihr Ergebnis');
const alsZahl = (t: string): number => Number(t.replace(/[’']/g, '').replace(',', '.'));

/* „696 / (230 · 0.95)" */
const t1 = weg1.schritte[0].eingesetzt.match(/^([\d.,'’]+) \/ \(([\d.,'’]+) · ([\d.,'’]+)\)$/);
p('Schritt 1 steht in der erwarteten Gestalt', !!t1, weg1.schritte[0].eingesetzt);
if (t1) nah('… und ergibt nachgerechnet dasselbe',
  alsZahl(t1[1]!) / (alsZahl(t1[2]!) * alsZahl(t1[3]!)), weg1.schritte[0].wert, 0.005);

/* „0.0178 · 2 · 38 / 2.5" */
const t2 = weg1.schritte[1].eingesetzt.match(/^([\d.,'’]+) · 2 · ([\d.,'’]+) \/ ([\d.,'’]+)$/);
p('Schritt 2 steht in der erwarteten Gestalt', !!t2, weg1.schritte[1].eingesetzt);
if (t2) nah('… und ergibt nachgerechnet dasselbe',
  alsZahl(t2[1]!) * 2 * alsZahl(t2[2]!) / alsZahl(t2[3]!), weg1.schritte[1].wert, 0.005);

/* Und die Zeile, an der die erste Fassung gescheitert ist: ϱ muss mit VIER
   Nachkommastellen dastehen, nicht mit dreien. */
p('ϱ steht als 0.0178 da und nicht als 0.018',
  /0[.,]0178/.test(weg1.schritte[1].eingesetzt), weg1.schritte[1].eingesetzt);

/* ==========================================================================
 * §3 · Ein Name ohne Wert wird gemeldet
 * ========================================================================*/
console.log('\n3 · Ein Name ohne Wert wird gemeldet');
let gemeldet = '';
try {
  Rechenweg.schritt('Kaputt', 'X = a · b', { a: 2 }, (v: any) => v.a, '');
} catch (e: unknown) { gemeldet = e instanceof Error ? e.message : String(e); }
p('Es wird überhaupt gemeldet', !!gemeldet, '(kein Fehler geworfen)');
p('… und die Meldung nennt den fehlenden Namen', /\bb\b/.test(gemeldet), gemeldet);

/* Die Gegenrichtung: ein vollständiger Schritt darf NICHT werfen. Ohne diesen
   Punkt wäre der obige auch dann grün, wenn `schritt` immer wirft. */
let warfOhneGrund = false;
try {
  Rechenweg.schritt('Heil', 'X = a · b', { a: 2, b: 3 }, (v: any) => v.a * v.b, '');
} catch { warfOhneGrund = true; }
p('Ein vollständiger Schritt wirft nicht', !warfOhneGrund);

/* ==========================================================================
 * §4 · Zu kurz gerundete Zahlen werden gemeldet
 * --------------------------------------------------------------------------
 * Der zweite Wächter. Geprüft mit einer Differenz zweier fast gleicher
 * Zahlen: gezeigt werden sie als „1“ und „1“, und 1 − 1 ist null.
 * ========================================================================*/
console.log('\n4 · Zu kurz gerundete Zahlen werden gemeldet');
let rundung = '';
try {
  Rechenweg.schritt('Kippt', 'd = a - b', { a: 1.00004, b: 1.00001 },
    (v: any) => v.a - v.b, '');
} catch (e: unknown) { rundung = e instanceof Error ? e.message : String(e); }
p('Der Rundungswächter schlägt an', !!rundung, '(nicht gemeldet)');
p('… und sagt, dass zu kurz gerundet wurde', /gerundet/.test(rundung), rundung);

/* ==========================================================================
 * §5 · „cosφ" wird nicht von „φ" zerlegt
 * --------------------------------------------------------------------------
 * Ersetzt wird von LANG nach KURZ. Andersherum machte „φ" aus „cosφ" eine
 * Zahl und liesse „cos" stehen — und beide Namen kommen in derselben
 * Formelsammlung vor.
 * ========================================================================*/
console.log('\n5 · Lange Namen werden zuerst ersetzt');
gleich('cosφ und φ nebeneinander',
  Rechenweg.einsetzen('x = cosφ · φ', { 'cosφ': 0.95, 'φ': 30 }), '0.95 · 30');
p('Und im Weg steht cosφ als Zahl, nicht als „cos0,95"',
  !/cos/.test(weg1.schritte[0].eingesetzt), weg1.schritte[0].eingesetzt);

/* ==========================================================================
 * §6 · Das Urteil steht im Satz, nicht nur in einem Wahrheitswert (§38)
 * ========================================================================*/
console.log('\n6 · Das Urteil steht im Satz');
const u1 = Rechenweg.urteil(weg1, 3);
p('0,71 % hält bei 3 % Grenze', u1.haelt === true, JSON.stringify(u1));
p('… und der Satz sagt es', /hält/.test(u1.satz), u1.satz);
const u2 = Rechenweg.urteil(weg1, 0.5);
p('0,71 % hält NICHT bei 0,5 % Grenze', u2.haelt === false, JSON.stringify(u2));
p('… und der Satz nennt den Ausweg', /Querschnitt/.test(u2.satz), u2.satz);

/* ==========================================================================
 * §7 · Der übernommene Text enthält den ganzen Weg
 * --------------------------------------------------------------------------
 * „als Text übernehmen" schreibt das in eine Seite. Fehlte darin ein Schritt,
 * wäre der Weg auf dem Bildschirm vollständig und auf dem Blatt nicht.
 * ========================================================================*/
console.log('\n7 · Der übernommene Text enthält den ganzen Weg');
const text = Rechenweg.alsText(weg1);
for (const s of weg1.schritte)
  p('Der Text enthält „' + s.titel + '"', text.includes(s.titel));
p('… und die Gegenprobe', text.includes(weg1.gegenprobe.titel));
p('… und die Annahmen', /Angenommen:/.test(text));
p('… und die Näherung wird nicht verschwiegen', /Näherung/.test(text));
p('Jeder Schritt trägt seine eingesetzte Zeile',
  weg1.schritte.every((s: any) => text.includes(s.eingesetzt)));

/* ==========================================================================
 * §8 · Kein eval, kein Function (§20)
 * ========================================================================*/
console.log('\n8 · Kein eval, kein Function');
const roh = readFileSync(join(WURZEL, 'src/core/electrical/rechenweg.ts'), 'utf8');
/* Kommentare weg — dort steht das Wort ausdrücklich, und zwar als Zusage. */
const ohneKommentar = roh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
p('Kein eval(', !/\beval\s*\(/.test(ohneKommentar));
p('Kein new Function(', !/new\s+Function\s*\(/.test(ohneKommentar));

/* ========================================================================*/
console.log(`\n${ok} bestanden, ${weg} gescheitert`);
if (weg) console.log('Gescheitert:\n  ' + fehler.join('\n  '));
process.exit(weg ? 1 : 0);
