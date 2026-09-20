/* Suite 551 — Die Tabellenwerkzeuge sind am Telefon zu treffen
 * ============================================================================
 * §37 ist **[hart im Kern]**: „44 px Mindestgrösse auf den Hauptwegen … ohne
 * Ausnahme", und „Nebenwege dürfen 32 px sein — aber mit einem geschriebenen
 * Grund an Ort und Stelle, nicht stillschweigend."
 *
 * ─── WAS ICH ZUERST FALSCH VERMUTET HABE ────────────────────────────────────
 * Die Griffe der einfachen Tabelle messen 7 px (`einstellungen.css:352`) und
 * stehen erst nach einem `mouseover` da, den ein Daumen nicht erzeugt. Das
 * sah nach „am Telefon geht gar nichts" aus, und ich war dabei, eine zweite
 * Werkzeugzeile zu bauen.
 *
 * ES GIBT SIE SCHON. `.stab-tools` trägt „Spalte +", „Spalte −", „Zeile +",
 * „Zeile −", „Kopfzeile", „Kopfspalte", „Als CSV" — und **L108 hat sie am
 * Telefon schon sichtbar gemacht** (`@media(hover:none){ .stab-tools{opacity:1} }`,
 * gefunden von `test303` als neunter Fall). Eine zweite Zeile daneben wäre ein
 * zweiter Katalog gewesen (§8). §45 Schritt 1 heisst „bestehenden Code lesen",
 * und er ist der Schritt, der am häufigsten fehlt.
 *
 * ─── WAS WIRKLICH FEHLT ─────────────────────────────────────────────────────
 * Die Knöpfe messen **26 px hoch**. Nicht 44, nicht 32, und ohne den
 * geschriebenen Grund, den §37 für einen Nebenweg verlangt. Sie sind am
 * Telefon der EINZIGE Weg, eine Spalte anzulegen — also ein Hauptweg.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Am Telefon ist die Werkzeugzeile sichtbar (L108 — bleibt so).
 *   2  Ihre Knöpfe messen dort 44 px (§37).
 *   3  Sie tun weiterhin, was sie sagen: „Spalte +" in JEDER Zeile,
 *      „Zeile +" eine Zeile, und nichts geht dabei verloren.
 *   4  Am Rechner bleiben sie schlank — eine Maus trifft 26 px, und eine
 *      44-px-Leiste unter jeder Tabelle wäre dort nur laut.
 *   5  Jeder Knopf hat Text (§38).
 *
 * `listen(0)` STATT EINER FESTEN ZAHL (L205) — dieser Lauf hält keinen Port
 * und kann deshalb auch neben einem vollen Lauf gefahren werden.
 *
 *   node pruefungen/lauf/test551.mts
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
  if (wahr) { ok++; console.log('  \u2713 ' + n); }
  else { weg++; console.log('  \u2717 ' + n + (extra ? ' — ' + extra : '')); }
};

/* Eine Tabelle mit Inhalt, damit „geht nichts verloren" etwas zu verlieren hat. */
const AUFBAU =
  '(async () => {\n'
+ '  try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
+ '  document.getElementById("rg-willkommen")?.remove();\n'
+ '  const s = Store.addPage(null, { text: "Kabeltabelle" });\n'
+ '  const b = Store.addBlock(s.id, "table", { rows: [\n'
+ '    ["Querschnitt", "Strom", "Absicherung"],\n'
+ '    ["1,5 mm²", "16 A", "B16"],\n'
+ '    ["2,5 mm²", "20 A", "B20"]], kopfZeile: true });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 500));\n'
+ '  return { seite: s.id, block: b.id };\n'
+ '})()';

/* Was von der Leiste zu messen ist — an beiden Bildschirmen dasselbe. */
const LEISTE =
  '(() => {\n'
+ '  const l = document.querySelector("#page .stab-tools");\n'
+ '  if (!l) return { da: false };\n'
+ '  const lr = l.getBoundingClientRect(), ls = getComputedStyle(l);\n'
+ '  const kn = Array.from(l.querySelectorAll("button")).map(k => {\n'
+ '    const q = k.getBoundingClientRect();\n'
+ '    return { text: (k.textContent || "").trim(),\n'
+ '             b: Math.round(q.width), h: Math.round(q.height) };\n'
+ '  });\n'
+ '  return { da: true, sichtbar: Number(ls.opacity) > 0 && lr.height > 0,\n'
+ '           hoverNone: matchMedia("(hover:none)").matches,\n'
+ '           schmal: matchMedia("(max-width:760px)").matches,\n'
+ '           knoepfe: kn };\n'
+ '})()';

const browser = await chromium.launch();
const fehler: string[] = [];

console.log('\n' + '─'.repeat(60));
console.log('Suite 551 — Die Tabellenwerkzeuge sind am Telefon zu treffen');
console.log('─'.repeat(60));

/* ==========================================================================
 * TELEFON — mit echtem Touch, sonst greift `@media(hover:none)` nicht
 * ========================================================================*/
const handy = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const t = await handy.newPage();
t.on('pageerror', e => fehler.push('handy: ' + e.message));
await t.goto(`http://localhost:${PORT}/index.html`);
await t.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await t.waitForTimeout(700);
const ids = await t.evaluate(AUFBAU) as any;

console.log('\n1 · Der Stand am Telefon');

const amHandy = await t.evaluate(LEISTE) as any;
const griffe = await t.evaluate(
  '(() => { const g = document.querySelector(".stab-griff.x");\n'
+ '  if (!g) return null; const r = g.getBoundingClientRect();\n'
+ '  return { h: Math.round(r.height) }; })()') as any;

console.log('    hover:none = ' + amHandy.hoverNone + ' · max-width:760px = ' + amHandy.schmal);
console.log('    Leiste sichtbar: ' + amHandy.sichtbar);
console.log('    Griff-Höhe (der alte Weg): ' + (griffe ? griffe.h + ' px' : 'kein Griff'));
if (amHandy.da) console.log('    Knöpfe: ' +
  amHandy.knoepfe.map((k: any) => k.text + ' ' + k.b + '×' + k.h).join(' · '));

p('Die Werkzeugzeile gibt es', amHandy.da === true);
p('Sie ist am Telefon sichtbar (L108 — bleibt so)', amHandy.sichtbar === true,
  'opacity 0 — der Fund von test303 wäre zurück');
p('Jeder Knopf hat Text (§38)',
  amHandy.da && amHandy.knoepfe.every((k: any) => k.text.length > 0));

const zuKlein = (amHandy.knoepfe || []).filter((k: any) => k.h < 44);
console.log('    unter 44 px: ' + (zuKlein.length
  ? zuKlein.map((k: any) => k.text + ' (' + k.h + ')').join(', ') : 'keiner'));
p('Jeder Knopf misst am Telefon 44 px (§37, Hauptweg)', zuKlein.length === 0,
  zuKlein.length + ' von ' + (amHandy.knoepfe || []).length +
  ' unter 44 px — und die Griffe daneben messen ' + (griffe ? griffe.h : '?') + ' px');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Und sie tun weiterhin, was sie sagen');

const tun = await t.evaluate(
  '(async () => {\n'
+ '  const id = "' + ids.block + '";\n'
+ '  const vorher = JSON.parse(JSON.stringify(Store.getBlock(id).rows));\n'
+ '  const drueck = (n) => {\n'
+ '    const k = Array.from(document.querySelectorAll("#page .stab-tools button"))\n'
+ '      .find(x => (x.textContent || "").trim() === n);\n'
+ '    if (k) k.click();\n'
+ '    return !!k;\n'
+ '  };\n'
+ '  const a = drueck("Spalte +");\n'
+ '  await new Promise(f => setTimeout(f, 320));\n'
+ '  const nachSpalte = JSON.parse(JSON.stringify(Store.getBlock(id).rows));\n'
+ '  const b = drueck("Zeile +");\n'
+ '  await new Promise(f => setTimeout(f, 320));\n'
+ '  const nachZeile = JSON.parse(JSON.stringify(Store.getBlock(id).rows));\n'
+ '  return { vorher, nachSpalte, nachZeile, a, b };\n'
+ '})()') as any;

console.log('    vorher:      ' + JSON.stringify(tun.vorher.map((r: any) => r.length)));
console.log('    nach Spalte: ' + JSON.stringify(tun.nachSpalte.map((r: any) => r.length)));
console.log('    nach Zeile:  ' + tun.nachZeile.length + ' Zeilen');

p('„Spalte +" fügt in JEDER Zeile eine Zelle an',
  tun.a && tun.nachSpalte.every((r: any, i: number) => r.length === tun.vorher[i].length + 1),
  JSON.stringify(tun.nachSpalte.map((r: any) => r.length)));
p('„Zeile +" fügt eine Zeile an',
  tun.b && tun.nachZeile.length === tun.vorher.length + 1,
  tun.nachZeile.length + ' statt ' + (tun.vorher.length + 1));
p('Was dastand, steht noch da',
  tun.nachZeile[0][0] === 'Querschnitt' && tun.nachZeile[1][0] === '1,5 mm²',
  JSON.stringify(tun.nachZeile[0]) + ' / ' + JSON.stringify(tun.nachZeile[1]));

await handy.close();

/* ==========================================================================
 * RECHNER — dort bleibt es schlank
 * ========================================================================*/
console.log('\n3 · Am Rechner bleibt die Leiste schlank');

const tisch = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const d = await tisch.newPage();
d.on('pageerror', e => fehler.push('rechner: ' + e.message));
await d.goto(`http://localhost:${PORT}/index.html`);
await d.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await d.waitForTimeout(700);
await d.evaluate(AUFBAU);
const amTisch = await d.evaluate(LEISTE) as any;

console.log('    hover:none = ' + amTisch.hoverNone);
console.log('    Knöpfe: ' + (amTisch.da
  ? amTisch.knoepfe.map((k: any) => k.h).join(' ') : 'keine'));

p('Am Rechner bleiben die Knöpfe unter 44 px — eine Maus trifft genauer',
  amTisch.da && amTisch.knoepfe.every((k: any) => k.h < 44),
  'eine 44-px-Leiste unter jeder Tabelle wäre am Rechner nur laut');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await tisch.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
