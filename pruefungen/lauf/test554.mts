/* Suite 554 — Was abgehakt wird, zählt in der Wochenrückschau
 * ============================================================================
 * DIE WOCHENRÜCKSCHAU rechnet so (`planen/dienst.ts:235`):
 *
 *     const erledigt = alle.filter(a => a.fertig && a.erledigtAm && inWoche(a.erledigtAm));
 *
 * Sie braucht also `erledigtAm`. Für einen Aufgabenblock auf einer Seite
 * steht dort `erledigtAm: b.erledigtAm || null` (Zeile 192) — und **nichts
 * im ganzen Programm schreibt dieses Feld für Blöcke**. Gezählt, nicht
 * vermutet: der einzige Schreiber ist der ICS-Import (`kalender.ts:211`).
 *
 * Das Kästchen im Editor tut genau eins:
 *
 *     Store.updateBlock(block.id, { checked: cb.checked });
 *
 * FOLGE: Wer eine Woche lang Aufgaben abhakt, sieht am Sonntag eine leere
 * Rückschau und ein Tagesdiagramm aus lauter Nullen. Kein Fehler, keine
 * Meldung — die heimtückischere Hälfte von §47: etwas zeigt eine Zahl, und
 * die Zahl ist immer null.
 *
 * UND ES IST INKONSEQUENT. Datenbankzeilen daneben rechnen längst mit
 * `r.erledigtAm || r.edited` (Zeile 218) — für sie gibt es den Rückfall,
 * für Blöcke nicht. Zwei Wege für dieselbe Frage, und der eine antwortet
 * immer null (§8).
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Abhaken setzt `erledigtAm`.
 *   2  Die Wochenrückschau zählt die Aufgabe dann auch.
 *   3  Das Tagesdiagramm setzt sie auf den richtigen Tag.
 *   4  Der Haken weg → `erledigtAm` weg, und die Rückschau zählt sie nicht
 *      mehr. Eine wieder geöffnete Aufgabe ist nicht erledigt.
 *   5  ALTBESTAND zählt mit: eine Aufgabe, die abgehakt ist und kein
 *      `erledigtAm` hat, wird über `edited` gerechnet — dieselbe Regel wie
 *      bei den Datenbankzeilen (§8).
 *   6  Was nicht abgehakt ist, zählt nie — auch mit `erledigtAm` nicht.
 *
 * `listen(0)` statt fester Zahl (L205).
 *
 *   node pruefungen/lauf/test554.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

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
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Plan !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);
await seite.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

console.log('\n' + '─'.repeat(60));
console.log('Suite 554 — Was abgehakt wird, zählt in der Wochenrückschau');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Abhaken im Editor');

const haken = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Wochenplan" });\n'
+ '  const b = Store.addBlock(s.id, "todo", { text: "Sicherung einspielen", checked: false });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 350));\n'
+ '  const kasten = document.querySelector(\'#page .blk[data-bid="\' + b.id + \'"] input[type=checkbox]\');\n'
+ '  if (!kasten) return { fehler: "kein Kästchen gefunden" };\n'
+ '  kasten.click();\n'
+ '  await new Promise(f => setTimeout(f, 300));\n'
+ '  const nach = Store.getBlock(b.id);\n'
+ '  const d = Plan.wochenDaten(0);\n'
+ '  const drin = d.erledigt.some(a => a.id === b.id);\n'
+ '  const heute = new Date().toDateString();\n'
+ '  const tag = d.proTag.find(t => new Date(t.tag).toDateString() === heute);\n'
+ '  return { seite: s.id, block: b.id,\n'
+ '           checked: nach.checked, erledigtAm: nach.erledigtAm || null,\n'
+ '           inRueckschau: drin, erledigtGesamt: d.erledigt.length,\n'
+ '           heuteImDiagramm: tag ? tag.anzahl : -1 };\n'
+ '})()') as any;

console.log('    checked: ' + haken.checked + ' · erledigtAm: ' + haken.erledigtAm);
console.log('    in der Rückschau: ' + haken.inRueckschau +
            ' (insgesamt ' + haken.erledigtGesamt + ')');
console.log('    heute im Tagesdiagramm: ' + haken.heuteImDiagramm);

p('Der Haken sitzt', haken.checked === true, haken.fehler || String(haken.checked));
p('Abhaken setzt `erledigtAm`', !!haken.erledigtAm,
  'das Feld bleibt leer — die Rückschau kann nichts zählen');
p('Die Wochenrückschau zählt die Aufgabe', haken.inRueckschau === true,
  haken.erledigtGesamt + ' erledigte insgesamt');
p('Das Tagesdiagramm setzt sie auf HEUTE', Number(haken.heuteImDiagramm) >= 1,
  String(haken.heuteImDiagramm));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Haken weg heisst: nicht mehr erledigt');

const weghaken = await seite.evaluate(
  '(async () => {\n'
+ '  const id = "' + haken.block + '";\n'
+ '  const kasten = document.querySelector(\'#page .blk[data-bid="\' + id + \'"] input[type=checkbox]\');\n'
+ '  if (!kasten) return { fehler: "kein Kästchen" };\n'
+ '  kasten.click();\n'
+ '  await new Promise(f => setTimeout(f, 300));\n'
+ '  const nach = Store.getBlock(id);\n'
+ '  const d = Plan.wochenDaten(0);\n'
+ '  return { checked: nach.checked, erledigtAm: nach.erledigtAm || null,\n'
+ '           inRueckschau: d.erledigt.some(a => a.id === id) };\n'
+ '})()') as any;

console.log('    checked: ' + weghaken.checked + ' · erledigtAm: ' + weghaken.erledigtAm);
p('Der Haken ist weg', weghaken.checked === false, weghaken.fehler);
p('`erledigtAm` ist auch weg', !weghaken.erledigtAm, String(weghaken.erledigtAm));
p('Und die Rückschau zählt sie nicht mehr', weghaken.inRueckschau === false);

/* ---------------------------------------------------------------------- */
console.log('\n3 · Altbestand: abgehakt, aber ohne Datum');

const alt = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Alte Liste" });\n'
+ '  const b = Store.addBlock(s.id, "todo", { text: "Vor dem Umbau abgehakt", checked: true });\n'
+ '  /* Genau der Altbestand: Haken ja, Datum nein. */\n'
+ '  const roh = Store.getBlock(b.id);\n'
+ '  delete roh.erledigtAm;\n'
+ '  const d = Plan.wochenDaten(0);\n'
+ '  const eintrag = d.erledigt.find(a => a.id === b.id);\n'
+ '  return { hatFeld: "erledigtAm" in roh, edited: roh.edited,\n'
+ '           gezaehlt: !!eintrag };\n'
+ '})()') as any;

console.log('    Feld vorhanden: ' + alt.hatFeld + ' · gezählt: ' + alt.gezaehlt);
p('Alter Bestand zählt über `edited` mit — wie die Datenbankzeilen (§8)',
  alt.gezaehlt === true,
  'ohne Rückfall ist jede vor heute abgehakte Aufgabe für immer unsichtbar');

/* ---------------------------------------------------------------------- */
console.log('\n4 · Ohne Haken zählt nichts');

const ohne = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Nicht fertig" });\n'
+ '  const b = Store.addBlock(s.id, "todo",\n'
+ '    { text: "Steht noch aus", checked: false, erledigtAm: new Date().toISOString() });\n'
+ '  const d = Plan.wochenDaten(0);\n'
+ '  return { gezaehlt: d.erledigt.some(a => a.id === b.id),\n'
+ '           offen: d.offen.some(a => a.id === b.id) };\n'
+ '})()') as any;

console.log('    als erledigt gezählt: ' + ohne.gezaehlt + ' · als offen: ' + ohne.offen);
p('Ein Datum ohne Haken macht nichts fertig', ohne.gezaehlt === false);
p('Und sie steht bei den offenen', ohne.offen === true);

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
