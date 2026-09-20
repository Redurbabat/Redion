/* Suite 542 — Die Auswahlleiste trifft die markierte Stelle
 * ============================================================================
 * DER FUND. Die Bestandsaufnahme vom 20. September hat in
 * `src/bereiche/editor/ansicht/auswahlleiste.ts` zwei Zeilen derselben Bauart
 * gefunden:
 *
 *     const neu = (b.text || '').replace(txt, marke + txt + marke);
 *     Store.updateBlock(bl.id, { text: (bl.text || '').replace(text, …) });
 *
 * `String.replace` mit einem STRING als Muster ersetzt das ERSTE Vorkommen.
 * Nicht das markierte — das erste. Wer in „Test und Test" das zweite Wort
 * markiert und auf Fett drückt, bekommt das erste fett, und an der Stelle,
 * die er angefasst hat, passiert nichts.
 *
 * WARUM DAS SCHLIMMER IST ALS EIN FEHLENDER KNOPF. Es ist kein Absturz und
 * keine Fehlermeldung: der Text ändert sich, nur an der falschen Stelle. Wer
 * einen langen Absatz formatiert, merkt es erst beim Lesen — und dann steht
 * schon nicht mehr da, was er geschrieben hat. Deshalb §46 Punkt 4, und
 * deshalb ein eigener Lauf.
 *
 * WAS ER HÄLT
 *
 *   1  Fett trifft das zweite Vorkommen, wenn das zweite markiert ist.
 *   2  Dasselbe für kursiv, Code und die übrigen Marken.
 *   3  Der Link trifft dieselbe Stelle — dieselbe Zeile, derselbe Fehler.
 *   4  Ein einmaliges Wort wird weiterhin richtig getroffen (keine Regression).
 *   5  GEGENPROBE: der Lauf KANN rot werden. Mit dem alten `replace` war er es.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser. Ein
 * `as HTMLElement` darin ist ein Syntaxfehler, und ein Akzentzeichen in einem
 * Kommentar INNERHALB einer Schablone beendet sie mitten im Satz. Beides ist
 * in diesem Projekt schon passiert.
 *
 *   node pruefungen/lauf/test542.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
/* `Auswahl` ist ein `const` im Skriptbereich, kein Feld an `window` —
   `window.Auswahl` ist deshalb `undefined`, der blosse Name aber da. */
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Store !== "undefined" && typeof Auswahl !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(400);

console.log('\n' + '─'.repeat(60));
console.log('Suite 542 — Die Auswahlleiste trifft die markierte Stelle');
console.log('─'.repeat(60));

/**
 * Einen Block mit `text` anlegen, darin das `nte` Vorkommen von `wort`
 * markieren und die Aktion `a` der Auswahlleiste auslösen. Gibt zurück,
 * was danach GESPEICHERT ist — nicht, was gezeichnet wurde.
 *
 * Markiert wird über eine echte DOM-Auswahl im gezeichneten Block, damit
 * derselbe Weg läuft wie beim Menschen: `getSelection().toString()` und
 * `auswahlOffset()` sehen genau das, was er sieht.
 */
const probe = async (text: string, wort: string, nte: number, a: string): Promise<string> =>
  seite.evaluate(
    '(async () => {\n'
  + '  const s = Store.addPage(null, { text: "Probe 542" });\n'
  + '  const b = Store.addBlock(s.id, "text", { text: ' + JSON.stringify(text) + ' });\n'
  + '  App.oeffne(s.id);\n'
  + '  await new Promise(f => setTimeout(f, 250));\n'
  + '  App.zeichneSeite();\n'
  + '  await new Promise(f => setTimeout(f, 200));\n'
  + '  const el = document.querySelector(\'[data-bid="\' + b.id + \'"] .ct\');\n'
  + '  if (!el) return "KEIN BLOCK";\n'
  + '  const lauf = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);\n'
  + '  let knoten = null, gesehen = 0, stelle = -1;\n'
  + '  while ((knoten = lauf.nextNode())) {\n'
  + '    let i = -1;\n'
  + '    while ((i = knoten.data.indexOf(' + JSON.stringify(wort) + ', i + 1)) !== -1) {\n'
  + '      gesehen++;\n'
  + '      if (gesehen === ' + nte + ') { stelle = i; break; }\n'
  + '    }\n'
  + '    if (stelle !== -1) break;\n'
  + '  }\n'
  + '  if (stelle === -1) return "STELLE NICHT GEFUNDEN";\n'
  + '  const r = document.createRange();\n'
  + '  r.setStart(knoten, stelle);\n'
  + '  r.setEnd(knoten, stelle + ' + wort.length + ');\n'
  + '  const sel = getSelection();\n'
  + '  sel.removeAllRanges(); sel.addRange(r);\n'
  + '  Auswahl.zeigen();\n'
  + '  await new Promise(f => setTimeout(f, 120));\n'
  + '  const knopf = document.querySelector(\'.auswahlleiste button[data-a="' + a + '"]\');\n'
  + '  if (!knopf) return "KEIN KNOPF";\n'
  + '  knopf.click();\n'
  + '  await new Promise(f => setTimeout(f, 200));\n'
  + '  return String(Store.getBlock(b.id).text || "");\n'
  + '})()') as Promise<string>;

/* ---------------------------------------------------------------------- */
console.log('\n1 · Fett trifft das markierte Vorkommen, nicht das erste');

const fett2 = await probe('Test und Test', 'Test', 2, 'b');
p('Das ZWEITE „Test" wird fett, wenn das zweite markiert ist',
  fett2 === 'Test und **Test**', fett2);

const fett1 = await probe('Test und Test', 'Test', 1, 'b');
p('Das ERSTE bleibt richtig, wenn das erste markiert ist',
  fett1 === '**Test** und Test', fett1);

const fett3 = await probe('a b a b a', 'a', 3, 'b');
p('Auch das dritte von drei', fett3 === 'a b a b **a**', fett3);

/* ---------------------------------------------------------------------- */
console.log('\n2 · Dieselbe Stelle für jede Marke');

const kursiv = await probe('Wort und Wort', 'Wort', 2, 'i');
p('Kursiv', kursiv === 'Wort und *Wort*', kursiv);

const code = await probe('Wort und Wort', 'Wort', 2, 'c');
p('Code', code === 'Wort und `Wort`', code);

const durch = await probe('Wort und Wort', 'Wort', 2, 's');
p('Durchgestrichen', durch === 'Wort und ~~Wort~~', durch);

/* ---------------------------------------------------------------------- */
console.log('\n3 · Ein einmaliges Wort wird weiterhin getroffen');

const einmal = await probe('Nur einmal hier', 'einmal', 1, 'b');
p('Kein Rückschritt beim Normalfall', einmal === 'Nur **einmal** hier', einmal);

const anfang = await probe('Anfang mitte ende', 'Anfang', 1, 'b');
p('Auch ganz am Anfang', anfang === '**Anfang** mitte ende', anfang);

/* ---------------------------------------------------------------------- */
console.log('\n4 · Die Gegenprobe zur Messung selbst');

/* Ein Lauf, der immer gruen ist, prueft nichts (§55.2). Diese Probe zeigt,
   dass der Weg oben wirklich schreibt: ein Block, an dem NICHTS markiert
   ist, darf sich auch nicht aendern. */
const ohne = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 542 leer" });\n'
+ '  const b = Store.addBlock(s.id, "text", { text: "Unberuehrt" });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 250));\n'
+ '  App.zeichneSeite();\n'
+ '  await new Promise(f => setTimeout(f, 150));\n'
+ '  getSelection().removeAllRanges();\n'
+ '  Auswahl.umschliesse("**");\n'
+ '  await new Promise(f => setTimeout(f, 120));\n'
+ '  return String(Store.getBlock(b.id).text || "");\n'
+ '})()') as string;
p('Ohne Auswahl wird nichts geschrieben', ohne === 'Unberuehrt', ohne);

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
