/* Suite 553 — Der Sweep nennt den Schuldigen, nicht sein ganzes Stück
 * ============================================================================
 * `pruefungen/volllauf.mts` fährt den vollen Lauf in Stücken (E657, §30) und
 * merkt sich, welche Läufe rot waren. Am 20. September, keine Stunde nach
 * seinem ersten Einsatz, meldete er:
 *
 *     → ROT: 266 267 268 270 272 273 274 275 276 277
 *
 * Zehn rote Läufe. Im Protokoll darüber stand:
 *
 *     ✗ 1 von 10 Läufen gescheitert:
 *         test270
 *
 * EINER. Die Zerlegung suchte je ZEILE nach einem ✗ UND einer Testnummer;
 * `alle.mts` schreibt seine Bilanz aber auf zwei Zeilen — die erste hat das
 * Zeichen und keine Nummer, die zweite die Nummer und kein Zeichen. Also fand
 * sie nichts und fiel auf „das ganze Stück ist rot" zurück.
 *
 * DER RÜCKFALL WAR RICHTIG. Er erfindet keinen Schuldigen (§56) — lieber
 * neun zu viel als einer zu wenig. Falsch war nur, ihn so leicht auszulösen:
 * neun grüne Läufe in der roten Liste verstecken den einen, auf den es
 * ankommt, und §46 („rot zuerst") schickt einen dann auf neun falsche
 * Fährten.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Aus der echten Bilanz von `alle.mts` kommt GENAU der eine Lauf.
 *   2  Mehrere Rote kommen alle heraus.
 *   3  Ein Lauf, der sich selbst mit ✗ und Namen meldet, wird auch gefunden.
 *   4  Sagt die Ausgabe gar nichts, gilt weiterhin das ganze Stück — der
 *      Rückfall bleibt, er wird nur schwerer getroffen.
 *   5  Was NICHT in diesem Stück war, taucht auch nicht auf: ein Name aus
 *      einem fremden Protokoll macht keinen fremden Lauf rot.
 *
 * KEIN BROWSER, KEIN PORT — dieser Lauf prüft eine Funktion.
 *
 *   node pruefungen/lauf/test553.mts
 * ==========================================================================*/
import { roteAus } from '../volllauf.mts';

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 553 — Der Sweep nennt den Schuldigen, nicht sein ganzes Stück');
console.log('─'.repeat(60));

const STUECK = [266, 267, 268, 270, 272, 273, 274, 275, 276, 277];

/* ---------------------------------------------------------------------- */
console.log('\n1 · Die echte Bilanz vom 20. September');

/* Wörtlich aus dem Protokoll des ersten vollen Laufs. */
const ECHT = [
  '  Suite 270 — Daten auf allen Geräten: 76 ok, 1 offen',
  '',
  '43/43 bestanden',
  '',
  '════════════════════════════════════════════════',
  '✗ 1 von 10 Läufen gescheitert:',
  '    test270',
  ''
].join('\n');

const einer = roteAus(ECHT, STUECK);
console.log('    heraus kommt: ' + JSON.stringify(einer));
p('Genau ein Lauf ist rot', einer.length === 1 && einer[0] === 270,
  JSON.stringify(einer) + ' statt [270]');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Mehrere Rote kommen alle heraus');

const MEHRERE = [
  '✗ 3 von 10 Läufen gescheitert:',
  '    test266',
  '    test270',
  '    test277',
  ''
].join('\n');
const drei = roteAus(MEHRERE, STUECK);
console.log('    heraus kommt: ' + JSON.stringify(drei.sort((a, b) => a - b)));
p('Alle drei, und nur die drei',
  JSON.stringify(drei.sort((a, b) => a - b)) === JSON.stringify([266, 270, 277]),
  JSON.stringify(drei));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Ein Lauf, der sich selbst meldet');

const SELBST = ['  ✗ test273 — irgendetwas ist schiefgegangen', ''].join('\n');
const selbst = roteAus(SELBST, STUECK);
console.log('    heraus kommt: ' + JSON.stringify(selbst));
p('Auch die Zeile mit ✗ und Namen wird gefunden',
  selbst.length === 1 && selbst[0] === 273, JSON.stringify(selbst));

/* ---------------------------------------------------------------------- */
console.log('\n4 · Sagt die Ausgabe nichts, gilt das ganze Stück');

const STUMM = 'Der Prozess ist gestorben, bevor er etwas sagen konnte.';
const alles = roteAus(STUMM, STUECK);
console.log('    heraus kommt: ' + alles.length + ' Läufe');
p('Der Rückfall bleibt: lieber neun zu viel als einer zu wenig',
  alles.length === STUECK.length, JSON.stringify(alles));

/* ---------------------------------------------------------------------- */
console.log('\n5 · Kein fremder Lauf wird rot');

/* Ein Name aus einem anderen Stück — etwa weil ein Prüflauf im Text einen
   anderen erwähnt („wie test100"). Er gehört nicht in dieses Stück. */
const FREMD = [
  '✗ 1 von 10 Läufen gescheitert:',
  '    test100',
  ''
].join('\n');
const fremd = roteAus(FREMD, STUECK);
console.log('    heraus kommt: ' + JSON.stringify(fremd));
p('Ein Name von ausserhalb macht keinen fremden Lauf rot',
  !fremd.includes(100), JSON.stringify(fremd));
p('… und weil dann nichts Eigenes übrig ist, gilt wieder das ganze Stück',
  fremd.length === STUECK.length, fremd.length + ' statt ' + STUECK.length);

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
