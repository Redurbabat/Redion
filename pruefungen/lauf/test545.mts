/* Suite 545 — Das KI-Blatt lässt sich am Telefon schliessen
 * ============================================================================
 * DER FUND vom 20. September, und er ist von der Sorte, die man nicht im
 * Code sieht, sondern erst am Gerät: am Telefon ist das KI-Feld ein Blatt,
 * das von unten hochkommt — und es gibt keinen Weg zurück.
 *
 *   · `#btn-ai` steht auf `display:none`, zweimal
 *     (bausteine.css:300 und :2119). Der Knopf, der es am Rechner
 *     auf- UND zuklappt, ist am Telefon gar nicht da.
 *   · `.ai-head` trägt zwei Knöpfe: Unterhaltungen und Neuer Chat.
 *     Kein Kreuz.
 *   · Strg+J gibt es an einem Telefon nicht.
 *   · Der Escape-Griff in `schale.ts:3229` räumt `.menu` und `.overlay`
 *     weg — `#ai` ist ein `<aside>` und heisst weder so noch so.
 *   · Und das Blatt ist 88vh hoch bei `z-index:920`; die untere Leiste
 *     liegt auf 401. Selbst die Reiter darunter sind nicht mehr zu treffen.
 *
 * DAZU EIN ZWEITER, LEISERER: das Blatt ZEIGT einen Griff. `#ai::before`
 * zeichnet den Strich oben, und der Kommentar daneben sagt wörtlich, was
 * er verspricht — „er sagt ohne Wort, dass man das Blatt wegwischen kann".
 * Gewischt werden kann nichts: `wischen.ts` kennt `#handy-oben` und sonst
 * nichts, und auf `#ai` hört niemand zu. Ein gezeichnetes Versprechen ist
 * dasselbe Versprechen (§47).
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Am Telefon schliesst MINDESTENS EIN sichtbarer Knopf im Kopf des
 *      Blattes es wieder. Gemessen wird nicht, ob einer dasteht, sondern
 *      ob einer WIRKT: jeder sichtbare Knopf in `.ai-head` wird gedrückt
 *      und danach nachgesehen, ob `.open` weg ist.
 *   2  Dieser Knopf misst 44 px (§37 hart: Hauptweg) und hat einen Namen
 *      (§38).
 *   3  Der Griff hält, was er zeigt: ein Zug nach unten über den Kopf
 *      schliesst das Blatt.
 *   4  Ein kurzer Zug schliesst es NICHT — sonst wäre jedes Verrutschen
 *      beim Tippen ein Schliessen.
 *   5  Nach beidem bleibt kein `transform` am Element kleben, das das
 *      Blatt beim nächsten Öffnen verschoben stehen liesse.
 *   6  Am Rechner gilt derselbe Knopf — EIN Weg, nicht zwei (§8) — und
 *      der Zug am Kopf schliesst dort NICHTS: eine Spalte ist kein Blatt.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser.
 *
 *   node pruefungen/lauf/test545.mts
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

console.log('\n' + '─'.repeat(60));
console.log('Suite 545 — Das KI-Blatt lässt sich am Telefon schliessen');
console.log('─'.repeat(60));

/* ==========================================================================
 * TELEFON
 * ========================================================================*/
const handy = await browser.newContext({ viewport: { width: 390, height: 844 } });
const t = await handy.newPage();
t.on('pageerror', e => fehler.push('handy: ' + e.message));
await t.goto(`http://localhost:${PORT}/index.html`);
await t.waitForFunction('typeof App !== "undefined" && typeof KI !== "undefined"',
  null, { timeout: 30000 });
await t.waitForTimeout(600);
/* Der Rundgang legt sich sonst über alles (E611 hat mich das gelehrt). */
await t.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

console.log('\n1 · Der Stand: was am Telefon überhaupt dasteht');

const stand = await t.evaluate(
  '(async () => {\n'
+ '  App.kiPanel(true);\n'
+ '  await new Promise(f => setTimeout(f, 450));\n'
+ '  const sicht = el => {\n'
+ '    if (!el) return false;\n'
+ '    const r = el.getBoundingClientRect();\n'
+ '    const s = getComputedStyle(el);\n'
+ '    return r.width > 0 && r.height > 0 && s.display !== "none"\n'
+ '        && s.visibility !== "hidden" && r.bottom > 0 && r.top < innerHeight;\n'
+ '  };\n'
+ '  const blatt = document.getElementById("ai");\n'
+ '  const r = blatt ? blatt.getBoundingClientRect() : null;\n'
+ '  return {\n'
+ '    offen: !!blatt && blatt.classList.contains("open"),\n'
+ '    oben: r ? Math.round(r.top) : -1,\n'
+ '    hoch: r ? Math.round(r.height) : -1,\n'
+ '    kopfKnopf: sicht(document.getElementById("btn-ai")),\n'
+ '    imKopf: Array.from(document.querySelectorAll("#ai .ai-head button"))\n'
+ '              .filter(sicht).map(b => b.id || b.className || "?")\n'
+ '  };\n'
+ '})()') as any;

console.log('    Blatt offen: ' + stand.offen + ' · oben bei ' + stand.oben
  + ' px, ' + stand.hoch + ' px hoch');
console.log('    #btn-ai sichtbar: ' + stand.kopfKnopf);
console.log('    Knöpfe im Kopf: ' + JSON.stringify(stand.imKopf));

p('Das Blatt ist am Telefon wirklich offen und auf dem Bildschirm',
  stand.offen && Number(stand.hoch) > 300 && Number(stand.oben) < 844,
  JSON.stringify(stand));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Schliesst irgendein sichtbarer Knopf es wieder?');

/* KEINE NAMENSPRÜFUNG. Gefragt ist nicht, ob ein Kreuz dasteht, sondern ob
   einer WIRKT — also wird jeder gedrückt und danach nachgesehen. */
const schliesser = await t.evaluate(
  '(async () => {\n'
+ '  const auf = async () => { App.kiPanel(true); await new Promise(f => setTimeout(f, 300)); };\n'
+ '  const sicht = el => {\n'
+ '    if (!el) return false;\n'
+ '    const r = el.getBoundingClientRect();\n'
+ '    const s = getComputedStyle(el);\n'
+ '    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";\n'
+ '  };\n'
+ '  const treffer = [];\n'
+ '  await auf();\n'
+ '  const knoepfe = Array.from(document.querySelectorAll("#ai .ai-head button")).filter(sicht);\n'
+ '  for (const k of knoepfe) {\n'
+ '    await auf();\n'
+ '    document.querySelectorAll(".menu,.overlay").forEach(m => m.remove());\n'
+ '    /* DAS MASS WIRD VOR DEM KLICK GENOMMEN. Geschlossen steht `#ai` auf\n'
+ '       `display:none`, und dann misst jeder Knopf darin 0x0 — der erste\n'
+ '       Anlauf meldete genau das und haette den Fund verdeckt. */\n'
+ '    const r = k.getBoundingClientRect();\n'
+ '    k.click();\n'
+ '    await new Promise(f => setTimeout(f, 320));\n'
+ '    const blatt = document.getElementById("ai");\n'
+ '    if (blatt && !blatt.classList.contains("open")) {\n'
+ '      treffer.push({ id: k.id || k.className, breit: Math.round(r.width),\n'
+ '                     hoch: Math.round(r.height),\n'
+ '                     name: k.getAttribute("aria-label") || (k.textContent || "").trim() });\n'
+ '    }\n'
+ '    document.querySelectorAll(".menu,.overlay").forEach(m => m.remove());\n'
+ '  }\n'
+ '  await auf();\n'
+ '  return { geprueft: knoepfe.length, treffer: treffer };\n'
+ '})()') as any;

console.log('    ' + schliesser.geprueft + ' sichtbare Knöpfe im Kopf geprüft, '
  + schliesser.treffer.length + ' davon schliessen');
for (const tr of schliesser.treffer) {
  console.log('    → ' + tr.id + ' · ' + tr.breit + '×' + tr.hoch + ' px · "' + tr.name + '"');
}

p('Mindestens ein sichtbarer Knopf schliesst das Blatt wirklich',
  schliesser.treffer.length > 0,
  schliesser.geprueft + ' geprüft, 0 schliessen — das Blatt ist eine Falle');

const zu = schliesser.treffer[0];
p('Er misst 44 px (§37, Hauptweg)',
  !!zu && zu.breit >= 44 && zu.hoch >= 44,
  zu ? zu.breit + '×' + zu.hoch : 'kein Knopf gefunden');
p('Er hat einen Namen (§38)', !!zu && String(zu.name).length > 0,
  zu ? '"' + zu.name + '"' : 'kein Knopf gefunden');

/* ---------------------------------------------------------------------- */
console.log('\n2b · Das ⋯ im Kopf (E724) öffnet ein Menü und lässt das Blatt stehen');

/* Seit E724 trägt der Kopf einen vierten Knopf, `#ai-mehr`: Agent,
   Besprechung und Protokoll wohnen dort. Er darf weder das Schliessen
   verdrängen noch selbst schliessen — und sein Menü muss über dem Blatt
   liegen (vorher lag JEDES Menü des Blattes darunter, 600 gegen 920). */
const mehr = await t.evaluate(
  '(async () => {\n'
+ '  App.kiPanel(true); await new Promise(f => setTimeout(f, 400));\n'
+ '  document.querySelectorAll(".menu,.overlay").forEach(m => m.remove());\n'
+ '  const k = document.getElementById("ai-mehr");\n'
+ '  if (!k) return { fehler: "KEIN KNOPF ai-mehr" };\n'
+ '  k.click(); await new Promise(f => setTimeout(f, 450));\n'
+ '  const m = document.querySelector(".menu");\n'
+ '  const ai = document.getElementById("ai");\n'
+ '  const z = e => parseInt(getComputedStyle(e).zIndex, 10) || 0;\n'
+ '  const r = { menue: !!m, offen: ai.classList.contains("open"),\n'
+ '             ueber: !!m && z(m) > z(ai) };\n'
+ '  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));\n'
+ '  await new Promise(f => setTimeout(f, 350));\n'
+ '  r.nachEscOffen = ai.classList.contains("open");\n'
+ '  document.querySelectorAll(".menu,.menu-grund").forEach(x => x.remove());\n'
+ '  document.getElementById("ai-zu").click(); await new Promise(f => setTimeout(f, 350));\n'
+ '  r.zuWirkt = !ai.classList.contains("open");\n'
+ '  return r;\n'
+ '})()') as any;
p('Das ⋯ öffnet ein Menü über dem Blatt, und das Blatt bleibt offen',
  !mehr.fehler && mehr.menue && mehr.offen && mehr.ueber, JSON.stringify(mehr));
p('Escape schliesst nur das Menü, das Blatt steht noch', !mehr.fehler && mehr.nachEscOffen, JSON.stringify(mehr));
p('Und das Kreuz schliesst das Blatt weiterhin', !mehr.fehler && mehr.zuWirkt, JSON.stringify(mehr));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Der Griff hält, was er zeigt');

/* DER KOPF WIRD ERST GEMESSEN, WENN DAS BLATT OBEN IST. Es gleitet in
   320 ms herauf; wer sofort misst, bekommt die Stelle, an der es noch gar
   nicht steht — und zieht dann ins Leere. Der erste Anlauf tat genau das
   und meldete „die Geste gibt es nicht", obwohl sie gebaut war. */
const ziehen = async (weit: number): Promise<{ offen: boolean; rest: string; unter: string }> => {
  await t.evaluate('(() => { document.getElementById("rg-willkommen")?.remove();\n'
    + '  App.kiPanel(true); })()');
  await t.waitForTimeout(600);
  /* UND NACHSEHEN, WER DORT WIRKLICH LIEGT. Der erste Anlauf zog gegen das
     Willkommensblatt `#rg-willkommen`, das über allem lag — der Zug kam nie
     am Blatt an, und der Lauf meldete „die Geste gibt es nicht". Ein Griff,
     der ins Leere fasst, ist keine Messung (§55.2). */
  const kopfBox = await t.evaluate(
    '(() => { const k = document.querySelector("#ai .ai-head");\n'
  + '  if (!k) return null;\n'
  + '  const r = k.getBoundingClientRect();\n'
  + '  const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + 8);\n'
  + '  const d = document.elementFromPoint(x, y);\n'
  + '  return { x: x, y: y, unter: d ? (d.tagName + "#" + d.id + "." + d.className) : "nichts",\n'
  + '           imBlatt: !!(d && d.closest && d.closest("#ai")) }; })()') as any;
  if (!kopfBox) return { offen: false, rest: 'KEIN KOPF', unter: 'nichts' };
  if (!kopfBox.imBlatt)
    return { offen: true, rest: '', unter: kopfBox.unter };
  await t.mouse.move(kopfBox.x, kopfBox.y);
  await t.mouse.down();
  await t.mouse.move(kopfBox.x, kopfBox.y + weit, { steps: 12 });
  await t.mouse.up();
  await t.waitForTimeout(500);
  const raus = await t.evaluate(
    '(() => { const b = document.getElementById("ai");\n'
  + '  return { offen: !!b && b.classList.contains("open"),\n'
  + '           rest: b ? (b.style.transform || "") : "?" }; })()') as any;
  return { offen: raus.offen, rest: raus.rest, unter: kopfBox.unter };
};

const langerZug = await ziehen(180);
console.log('    180 px nach unten → offen: ' + langerZug.offen
  + ' · Rest-transform: "' + langerZug.rest + '"');
p('Der Zug landet wirklich auf dem Kopf des Blattes',
  String(langerZug.unter).includes('ai-head'), 'unter dem Finger liegt: ' + langerZug.unter);
p('Ein Zug nach unten schliesst das Blatt', !langerZug.offen,
  'der Griff zeigt eine Geste, die es nicht gibt (§47)');
p('Danach klebt kein transform am Element', !langerZug.rest,
  'style.transform = "' + langerZug.rest + '"');

const kurzerZug = await ziehen(26);
console.log('    26 px nach unten → offen: ' + kurzerZug.offen);
p('Ein kurzer Zug schliesst es NICHT', kurzerZug.offen,
  'jedes Verrutschen beim Tippen wäre ein Schliessen');
p('Auch danach klebt kein transform', !kurzerZug.rest,
  'style.transform = "' + kurzerZug.rest + '"');

await handy.close();

/* ==========================================================================
 * RECHNER — derselbe Knopf, aber keine Geste
 * ========================================================================*/
console.log('\n4 · Am Rechner: derselbe Weg, keine zweite Logik (§8)');

const tisch = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const d = await tisch.newPage();
d.on('pageerror', e => fehler.push('rechner: ' + e.message));
await d.goto(`http://localhost:${PORT}/index.html`);
await d.waitForFunction('typeof App !== "undefined" && typeof KI !== "undefined"',
  null, { timeout: 30000 });
await d.waitForTimeout(600);
await d.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

const amTisch = await d.evaluate(
  '(async () => {\n'
+ '  App.kiPanel(true);\n'
+ '  await new Promise(f => setTimeout(f, 350));\n'
+ '  const sicht = el => {\n'
+ '    if (!el) return false;\n'
+ '    const r = el.getBoundingClientRect();\n'
+ '    const s = getComputedStyle(el);\n'
+ '    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";\n'
+ '  };\n'
+ '  const knoepfe = Array.from(document.querySelectorAll("#ai .ai-head button")).filter(sicht);\n'
+ '  let schliesst = 0;\n'
+ '  for (const k of knoepfe) {\n'
+ '    App.kiPanel(true);\n'
+ '    await new Promise(f => setTimeout(f, 220));\n'
+ '    document.querySelectorAll(".menu,.overlay").forEach(m => m.remove());\n'
+ '    k.click();\n'
+ '    await new Promise(f => setTimeout(f, 260));\n'
+ '    const b = document.getElementById("ai");\n'
+ '    if (b && !b.classList.contains("open")) schliesst++;\n'
+ '    document.querySelectorAll(".menu,.overlay").forEach(m => m.remove());\n'
+ '  }\n'
+ '  return { schliesst: schliesst, von: knoepfe.length };\n'
+ '})()') as any;

console.log('    ' + amTisch.schliesst + ' von ' + amTisch.von + ' Kopfknöpfen schliessen');
p('Der Schliess-Knopf gilt auch am Rechner', Number(amTisch.schliesst) > 0,
  'am Rechner schliesst keiner — dann sind es zwei Wege, nicht einer');

await d.evaluate('(() => { document.getElementById("rg-willkommen")?.remove();\n'
  + '  App.kiPanel(true); })()');
await d.waitForTimeout(600);
const tischKopf = await d.evaluate(
  '(() => { const k = document.querySelector("#ai .ai-head");\n'
+ '  if (!k) return null;\n'
+ '  const r = k.getBoundingClientRect();\n'
+ '  return { x: Math.round(r.left + 40), y: Math.round(r.top + 8) };\n'
+ '})()') as any;
await d.mouse.move(tischKopf.x, tischKopf.y);
await d.mouse.down();
await d.mouse.move(tischKopf.x, tischKopf.y + 180, { steps: 12 });
await d.mouse.up();
await d.waitForTimeout(450);
const tischOffen = await d.evaluate(
  '(() => { const b = document.getElementById("ai");\n'
+ '  return !!b && b.classList.contains("open"); })()') as boolean;

console.log('    Zug am Rechner → offen: ' + tischOffen);
p('Am Rechner schliesst der Zug NICHTS — eine Spalte ist kein Blatt', tischOffen,
  'die Geste greift auf einem Bildschirm, auf dem es kein Blatt gibt');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await tisch.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
