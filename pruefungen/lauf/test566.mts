/* Suite 566 — Der Streifen zur neuen Fassung steht unten (E678)
 * ============================================================================
 * REDUR, 22. September 2026:
 *
 *   „Kannst du die neu laden buton unten bringen , wenn eine neu version
 *    kommt dort sollte es unter sein"
 *
 * Der Streifen „Es liegt eine neue Fassung bereit — Jetzt laden" lag seit
 * jeher OBEN (`.banner{top:0}`), über der Kopfleiste mit Suche und Menü —
 * und der Knopf darin war ein unterstrichenes Wort, 15 px hoch (§37).
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  pwa.ts bestellt den Streifen als `info unten` mit einem echten Knopf
 *      (`banner-tat`), nicht mehr mit einem unterstrichenen Wort im Stil-Attribut.
 *   2  Am Rechner liegt der Streifen am unteren Rand — die Kopfleiste bleibt frei.
 *   3  Der Knopf „Jetzt laden" misst 44 px (§37, Hauptweg).
 *   4  Andere Streifen (`warn`) bleiben, wo sie waren: oben. Nur die neue
 *      Fassung wandert.
 *   5  Am Telefon liegt er ÜBER der unteren Leiste, nicht darauf, und nicht
 *      darunter — die fünf Reiter bleiben zu treffen.
 *   6  Kein Querrollen durch den Streifen.
 *
 *   node pruefungen/lauf/test566.mts
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

console.log('\n' + '─'.repeat(60));
console.log('Suite 566 — Der Streifen zur neuen Fassung steht unten (E678)');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Was pwa.ts bestellt');
const pwa = fs.readFileSync(path.join(WURZEL, 'src/bereiche/einstellungen/pwa.ts'), 'utf8');
const bestellung = /UI\.banner\(\s*'Es liegt eine neue Fassung bereit\.[^]*?'info unten'\s*\)/.exec(pwa);
p('Der Streifen wird als „info unten" bestellt', !!bestellung);
p('Der Knopf darin ist ein echter Knopf (banner-tat), kein unterstrichenes Wort',
  !!bestellung && /class="banner-tat"/.test(bestellung[0]) && !/text-decoration/.test(bestellung[0]));

/* Derselbe Streifen, wie pwa.ts ihn bestellt — ohne Service Worker, denn
   der meldet sich nur über https und nur mit einer echten zweiten Fassung. */
const STREIFEN = 'UI.banner(\'Es liegt eine neue Fassung bereit. <button id="pwa-neu" class="banner-tat">Jetzt laden</button>\', \'info unten\')';
const MESSEN = `(() => {
  const b = document.getElementById('banner');
  const k = b && b.querySelector('#pwa-neu');
  const leiste = document.getElementById('handy-oben');
  const r = b ? b.getBoundingClientRect() : null;
  const kr = k ? k.getBoundingClientRect() : null;
  const lr = leiste ? leiste.getBoundingClientRect() : null;
  const leisteSichtbar = !!leiste && getComputedStyle(leiste).display !== 'none' && lr.height > 0;
  return { da: !!b, top: r ? Math.round(r.top) : null, bottom: r ? Math.round(r.bottom) : null,
           links: r ? Math.round(r.left) : null, rechts: r ? Math.round(r.right) : null,
           knopfH: kr ? Math.round(kr.height) : null, knopfW: kr ? Math.round(kr.width) : null,
           hoehe: window.innerHeight, breite: window.innerWidth, rollbreite: document.documentElement.scrollWidth,
           leiste: leisteSichtbar ? { top: Math.round(lr.top), bottom: Math.round(lr.bottom) } : null };
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];

/* ---------------------------------------------------------------------- */
console.log('\n2 · Am Rechner');
const rechner = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await rechner.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof App !== "undefined" && typeof UI !== "undefined"', null, { timeout: 30000 });
await seite.waitForTimeout(500);
await seite.evaluate('document.getElementById("rg-willkommen")?.remove()');
const r = await seite.evaluate(STREIFEN + ';' + MESSEN) as any;
console.log('    ' + JSON.stringify(r));
p('Der Streifen ist da', r.da);
p('Er liegt am unteren Rand, nicht oben', r.bottom !== null && Math.abs(r.bottom - r.hoehe) <= 1 && r.top > 200, `top ${r.top} · bottom ${r.bottom} von ${r.hoehe}`);
p('„Jetzt laden" ist ein Knopf von mindestens 44 px', r.knopfH !== null && r.knopfH >= 44 && r.knopfW >= 80, `${r.knopfW} × ${r.knopfH}`);
const warn = await seite.evaluate('UI.banner("Nur eine Warnung", "warn"); ' + MESSEN) as any;
p('Ein gewöhnlicher Warnstreifen bleibt oben', warn.da && warn.top === 0, `top ${warn.top}`);
await rechner.close();

/* ---------------------------------------------------------------------- */
console.log('\n3 · Am Telefon');
const handy = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const tel = await handy.newPage();
tel.on('pageerror', e => fehler.push('handy: ' + String(e.message)));
await tel.goto(`http://localhost:${PORT}/index.html`);
await tel.waitForFunction('typeof App !== "undefined" && typeof UI !== "undefined"', null, { timeout: 30000 });
await tel.waitForTimeout(500);
await tel.evaluate('document.getElementById("rg-willkommen")?.remove(); document.querySelector(".produkt-onboarding-lage")?.remove()');
const t = await tel.evaluate(STREIFEN + ';' + MESSEN) as any;
console.log('    ' + JSON.stringify(t));
p('Die untere Leiste ist am Telefon sichtbar', !!t.leiste, JSON.stringify(t.leiste));
p('Der Streifen liegt ÜBER der Leiste — nicht darauf, nicht darunter',
  !!t.leiste && t.bottom !== null && t.bottom <= t.leiste.top + 1 && t.bottom >= t.leiste.top - 24 && t.top > 100,
  `Streifen ${t.top}–${t.bottom} · Leiste ab ${t.leiste?.top}`);
p('Auch hier: 44 px für den Knopf', t.knopfH !== null && t.knopfH >= 44, String(t.knopfH));
p('Kein Querrollen', t.rollbreite <= t.breite && t.links >= 0 && t.rechts <= t.breite, `${t.links}–${t.rechts}, rollbreite ${t.rollbreite}`);
await handy.close();

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
