/* Suite 556 — Strg+F findet vierzig Stellen und zeigt eine
 * ============================================================================
 * §47 führt „im README versprechen, was nicht läuft" als eigene Zeile. Ein
 * Zähler, der „12 Treffer" sagt, ist dasselbe Versprechen im Kleinen: er
 * behauptet zwölf Fundstellen und liefert genau eine — die erste. Zu den
 * anderen elf gibt es keinen Weg.
 *
 * ─── DER STAND, AUS DEM DIESER LAUF ENTSTAND ────────────────────────────────
 * `seitenSuche()` in `src/schale/aufbau/schale.ts` markiert jede Fundstelle
 * mit `<mark>`, rollt zur ERSTEN (`if (!anzahl) mark.scrollIntoView(…)`) und
 * schreibt die Zahl. Die Leiste hat ein Feld, die Zahl, ein Kreuz — keine
 * Pfeile. Am Feld hängt ein `keydown`, das NUR `Escape` kennt; Enter fällt
 * durch.
 *
 * Und daneben steht seit E468 die Suchleiste des Schreibstudios, die genau
 * das kann: Feld, Zahl, ‹ und ›, Enter vor, Umschalt+Enter zurück. Dieselbe
 * Geste, zwei Häuser — in einem geht sie, im anderen nicht.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Strg+F öffnet die Leiste, und eine Suche nach einem Wort, das
 *      viermal dasteht, findet vier Stellen.
 *   2  Der Zähler sagt, die WIEVIELTE gerade dran ist — „1 von 4".
 *      Nicht „4 Treffer" (§38: keine Information nur über Farbe, und
 *      „die erste von vier" ist eine Information).
 *   3  Enter geht zur nächsten, Umschalt+Enter zur vorigen, und beide
 *      laufen um: von der vierten zur ersten und zurück.
 *   4  Es gibt ‹ und › als Knöpfe, sie tragen ein `aria-label` (§38),
 *      und sie messen 44 px (§37 — die Suche ist ein Hauptweg).
 *   5  Die aktive Stelle ist im Bild. Ein Sprung, den man nicht sieht,
 *      ist kein Sprung.
 *   6  Escape schliesst, und danach steht keine Markierung mehr im Text.
 *
 * `listen(0)` STATT EINER FESTEN ZAHL (L205) — dieser Lauf hält keinen Port
 * und darf deshalb neben einem vollen Lauf gefahren werden.
 *
 *   node pruefungen/lauf/test556.mts
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

/* Vier Absätze, in jedem einmal „Schutzleiter" — und weit genug auseinander,
   dass die vierte Stelle nicht zufällig neben der ersten im Bild steht. */
const AUFBAU =
  '(async () => {\n'
+ '  try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
+ '  document.getElementById("rg-willkommen")?.remove();\n'
+ '  const s = Store.addPage(null, { text: "Kabelkunde" });\n'
+ '  const fueller = "Fuelltext ".repeat(60);\n'
+ '  for (let i = 1; i <= 4; i++) {\n'
+ '    Store.addBlock(s.id, "text", { text: "Stelle " + i + ": der Schutzleiter ist gruen-gelb." });\n'
+ '    Store.addBlock(s.id, "text", { text: fueller });\n'
+ '  }\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 600));\n'
+ '  return { seite: s.id };\n'
+ '})()';

/* Was von der Leiste abzulesen ist. `aktivText` ist der Text der Stelle, die
   gerade dran ist — daran erkennt der Lauf, ob wirklich gesprungen wurde. */
const STAND =
  '(() => {\n'
+ '  const bar = document.getElementById("findbar");\n'
+ '  if (!bar) return { da: false };\n'
+ '  const marks = Array.from(document.querySelectorAll("#page mark"));\n'
+ '  const aktiv = document.querySelector("#page mark.aktiv");\n'
+ '  const sicht = (el) => {\n'
+ '    if (!el) return false;\n'
+ '    const r = el.getBoundingClientRect();\n'
+ '    return r.height > 0 && r.top >= -2 && r.bottom <= innerHeight + 2;\n'
+ '  };\n'
+ '  const knoepfe = Array.from(bar.querySelectorAll("button")).map(k => {\n'
+ '    const q = k.getBoundingClientRect();\n'
+ '    return { a: k.getAttribute("data-a") || "",\n'
+ '             label: k.getAttribute("aria-label") || "",\n'
+ '             text: (k.textContent || "").trim(),\n'
+ '             b: Math.round(q.width), h: Math.round(q.height) };\n'
+ '  });\n'
+ '  return { da: true,\n'
+ '           zahl: (bar.querySelector(".n")?.textContent || "").trim(),\n'
+ '           marken: marks.length,\n'
+ '           aktivIndex: aktiv ? marks.indexOf(aktiv) : -1,\n'
+ '           aktivSichtbar: sicht(aktiv),\n'
+ '           umgebung: aktiv ? (aktiv.closest("[data-id]")?.textContent || "").slice(0, 24) : "",\n'
+ '           knoepfe };\n'
+ '})()';

const browser = await chromium.launch();
const fehler: string[] = [];

console.log('\n' + '─'.repeat(60));
console.log('Suite 556 — Strg+F findet vierzig Stellen und zeigt eine');
console.log('─'.repeat(60));

const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
page.on('pageerror', e => fehler.push(e.message));
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(AUFBAU);

/* ---------------------------------------------------------------------- */
console.log('\n1 · Strg+F öffnet und findet');

await page.keyboard.press('Control+f');
await page.waitForTimeout(250);
const offen = await page.evaluate('!!document.getElementById("findbar")');
p('Strg+F öffnet die Suchleiste', offen === true);

await page.fill('#findbar input', 'Schutzleiter');
await page.waitForTimeout(500);
const s1 = await page.evaluate(STAND) as any;

console.log('    Markierungen im Text: ' + s1.marken);
console.log('    Zähler sagt:          „' + s1.zahl + '"');
console.log('    aktive Stelle:        ' + (s1.aktivIndex < 0 ? 'keine' : s1.aktivIndex + 1)
  + (s1.umgebung ? '  („' + s1.umgebung + '…")' : ''));
console.log('    Knöpfe: ' + (s1.knoepfe || []).map((k: any) =>
  (k.text || '?') + ' ' + k.b + '×' + k.h).join(' · '));

p('Vier Stellen sind markiert', s1.marken === 4, s1.marken + ' statt 4');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Der Zähler sagt, die wievielte dran ist');

p('Der Zähler nennt Stelle UND Anzahl („1 von 4")',
  /1\s*von\s*4/i.test(String(s1.zahl)),
  'er sagt „' + s1.zahl + '" — welche der vier gerade gilt, steht nirgends');
p('Die aktive Stelle ist als solche erkennbar (nicht nur eine Farbe, §38)',
  s1.aktivIndex === 0,
  s1.aktivIndex < 0 ? 'keine Markierung trägt `.aktiv`' : 'aktiv ist Nr. ' + (s1.aktivIndex + 1));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Enter geht weiter, Umschalt+Enter zurück');

await page.focus('#findbar input');
await page.keyboard.press('Enter');
await page.waitForTimeout(450);
const s2 = await page.evaluate(STAND) as any;
console.log('    nach Enter:           ' + (s2.aktivIndex < 0 ? 'keine' : s2.aktivIndex + 1)
  + ' · Zähler „' + s2.zahl + '" · im Bild: ' + s2.aktivSichtbar);
p('Enter springt zur zweiten Stelle', s2.aktivIndex === 1,
  'aktiv bleibt ' + (s2.aktivIndex + 1) + ' — Enter tut nichts');
p('Die zweite Stelle steht im Bild', s2.aktivSichtbar === true,
  'ein Sprung, den man nicht sieht, ist kein Sprung');

await page.keyboard.press('Enter');
await page.keyboard.press('Enter');
await page.waitForTimeout(450);
const s4 = await page.evaluate(STAND) as any;
console.log('    nach zwei weiteren:   ' + (s4.aktivIndex + 1) + ' · Zähler „' + s4.zahl + '"');
p('Drei Enter führen zur vierten Stelle', s4.aktivIndex === 3, 'aktiv ist ' + (s4.aktivIndex + 1));

await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const s5 = await page.evaluate(STAND) as any;
console.log('    ein Enter weiter:     ' + (s5.aktivIndex + 1) + ' · Zähler „' + s5.zahl + '"');
p('Hinter der letzten Stelle geht es bei der ersten weiter', s5.aktivIndex === 0,
  'aktiv ist ' + (s5.aktivIndex + 1) + ' — am Ende der Liste steht eine Wand');

await page.keyboard.press('Shift+Enter');
await page.waitForTimeout(400);
const s6 = await page.evaluate(STAND) as any;
console.log('    Umschalt+Enter:       ' + (s6.aktivIndex + 1) + ' · Zähler „' + s6.zahl + '"');
p('Umschalt+Enter läuft rückwärts um', s6.aktivIndex === 3, 'aktiv ist ' + (s6.aktivIndex + 1));

/* ---------------------------------------------------------------------- */
console.log('\n4 · Und es gibt Knöpfe für dieselbe Sache');

const vor = (s1.knoepfe || []).find((k: any) => k.a === 'vor');
const zurueck = (s1.knoepfe || []).find((k: any) => k.a === 'zurueck');
p('Ein Knopf „nächste Stelle" steht da', !!vor, 'nur Feld, Zahl und Kreuz');
p('Ein Knopf „vorige Stelle" steht da', !!zurueck);
p('Beide tragen ein aria-label (§38)',
  !!vor && !!zurueck && vor.label.length > 0 && zurueck.label.length > 0,
  'ein Pfeil ohne Namen ist für einen Screenreader ein Zeichen');

const zuKlein = (s1.knoepfe || []).filter((k: any) => k.h < 44 || k.b < 44);
console.log('    unter 44 px: ' + (zuKlein.length
  ? zuKlein.map((k: any) => (k.text || k.a) + ' (' + k.b + '×' + k.h + ')').join(', ')
  : 'keiner'));
p('Jeder Knopf der Suchleiste misst 44 px (§37, Hauptweg)',
  (s1.knoepfe || []).length > 0 && zuKlein.length === 0,
  zuKlein.length + ' von ' + (s1.knoepfe || []).length + ' zu klein');

const klickStand = await page.evaluate(
  '(async () => {\n'
+ '  const k = document.querySelector("#findbar [data-a=\\"vor\\"]");\n'
+ '  if (!k) return null;\n'
+ '  k.click();\n'
+ '  await new Promise(f => setTimeout(f, 300));\n'
+ '  const marks = Array.from(document.querySelectorAll("#page mark"));\n'
+ '  const a = document.querySelector("#page mark.aktiv");\n'
+ '  return marks.indexOf(a);\n'
+ '})()') as any;
console.log('    nach Klick auf ›:     ' + (klickStand === null ? 'kein Knopf' : klickStand + 1));
p('Der Knopf tut dasselbe wie Enter', klickStand === 0,
  'von der vierten zur ersten erwartet, bekommen: ' +
  (klickStand === null ? 'kein Knopf' : klickStand + 1));

/* ---------------------------------------------------------------------- */
console.log('\n5 · Escape schliesst, und der Text ist wieder sauber');

await page.focus('#findbar input');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
const nachher = await page.evaluate(
  '({ bar: !!document.getElementById("findbar"),\n'
+ '   marken: document.querySelectorAll("#page mark").length })') as any;
console.log('    Leiste: ' + (nachher.bar ? 'steht noch' : 'weg') +
            ' · Markierungen: ' + nachher.marken);
p('Escape schliesst die Leiste (§38)', nachher.bar === false);
p('Danach steht keine Markierung mehr im Text', nachher.marken === 0,
  nachher.marken + ' Markierungen bleiben stehen');

/* ==========================================================================
 * 6 · AM TELEFON — und das ist der Teil, den das BILD gefunden hat (§55.1)
 * ========================================================================
 * Die Leiste steht `position:fixed; right:22px` und war mit Feld, Zahl und
 * Kreuz gut 310 px breit. Mit den zwei neuen Pfeilen sind es 458 — auf einem
 * 390-px-Telefon läuft sie damit links aus dem Bild, und zwar genau mit dem
 * FELD, in das man tippt. Auf dem Bildschirmfoto stand davon ein „r".
 *
 * Kein Prüflauf hat das gesehen; §37 sagt es trotzdem: „Dialoge müssen auf
 * kleine Bildschirme passen." */
console.log('\n6 · Am Telefon passt die Leiste ins Bild (§37)');

const handy = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const h = await handy.newPage();
h.on('pageerror', e => fehler.push('handy: ' + e.message));
await h.goto(`http://localhost:${PORT}/index.html`);
await h.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await h.waitForTimeout(800);
await h.evaluate(AUFBAU);
await h.keyboard.press('Control+f');
await h.waitForTimeout(250);
await h.fill('#findbar input', 'Schutzleiter');
await h.waitForTimeout(400);

const amHandy = await h.evaluate(
  '(() => {\n'
+ '  const bar = document.getElementById("findbar");\n'
+ '  if (!bar) return { da: false };\n'
+ '  const r = bar.getBoundingClientRect();\n'
+ '  const inp = bar.querySelector("input").getBoundingClientRect();\n'
+ '  const raus = Array.from(bar.querySelectorAll("button")).filter(k => {\n'
+ '    const q = k.getBoundingClientRect();\n'
+ '    return q.left < 0 || q.right > innerWidth;\n'
+ '  }).length;\n'
+ '  return { da: true, links: Math.round(r.left), rechts: Math.round(r.right),\n'
+ '           breit: Math.round(r.width), fenster: innerWidth,\n'
+ '           feldLinks: Math.round(inp.left), feldBreit: Math.round(inp.width),\n'
+ '           knoepfeDraussen: raus,\n'
+ '           zahl: (bar.querySelector(".n")?.textContent || "").trim() };\n'
+ '})()') as any;

console.log('    Fenster: ' + amHandy.fenster + ' px · Leiste: ' + amHandy.links
  + ' … ' + amHandy.rechts + ' (' + amHandy.breit + ' px breit)');
console.log('    Suchfeld beginnt bei ' + amHandy.feldLinks + ' px, ist '
  + amHandy.feldBreit + ' px breit · Zähler „' + amHandy.zahl + '"');

p('Die Leiste steht ganz im Bild', amHandy.da
  && amHandy.links >= 0 && amHandy.rechts <= amHandy.fenster,
  'sie reicht von ' + amHandy.links + ' bis ' + amHandy.rechts
  + ' in einem ' + amHandy.fenster + ' px breiten Fenster');
p('Das Suchfeld ist ganz zu sehen', amHandy.da && amHandy.feldLinks >= 0,
  'es beginnt bei ' + amHandy.feldLinks + ' px — das Feld, in das man tippt');
p('Und es ist noch breit genug zum Tippen', amHandy.da && amHandy.feldBreit >= 100,
  amHandy.feldBreit + ' px');
p('Kein Knopf liegt ausserhalb des Bildes', amHandy.da && amHandy.knoepfeDraussen === 0,
  amHandy.knoepfeDraussen + ' Knöpfe draussen');
p('Und gefunden wird dort dasselbe', /1\s*von\s*4/i.test(String(amHandy.zahl)),
  'der Zähler sagt „' + amHandy.zahl + '"');

await handy.close();

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await ctx.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
