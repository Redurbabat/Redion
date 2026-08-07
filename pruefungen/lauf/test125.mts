/* Suite 89 — Die installierte App startet, auch wenn der Weg umgeleitet wird
 * ============================================================================
 * VOM IPHONE GEMELDET (7. August 2026). Redion als App auf den
 * Home-Bildschirm gelegt, angetippt — und statt der App:
 *
 *     Safari kann die Seite nicht öffnen.
 *     Fehler: „Response served by service worker has redirections"
 *
 * Kein Inhalt, keine App, und eine Meldung, die nicht sagt, woher sie kommt.
 *
 * ─── WAS DAHINTERSTECKT ─────────────────────────────────────────────────────
 *
 * Beantwortet ein Dienst-Skript eine SEITENNAVIGATION mit einer Antwort, die
 * durch eine Umleitung entstanden ist (`response.redirected`), lehnen die
 * Browser sie ab. Safari sagt den Satz oben, Chromium sagt
 * „a redirected response was used for a request whose redirect mode is not
 * follow" — die Wirkung ist dieselbe: die Seite lädt nicht.
 *
 * Im Manifest stand `start_url: "/index.html"`, und Cloudflare beantwortet
 * diesen Weg mit einer Umleitung auf `/`. Im gewöhnlichen Browser fällt das
 * nie auf, weil er der Umleitung einfach folgt und das Dienst-Skript dabei
 * gar nicht im Weg steht. Die INSTALLIERTE App startet aber genau auf
 * `start_url` — und dort läuft die Anfrage durch das Dienst-Skript.
 *
 * ─── WARUM BEIDE HÄLFTEN GEBAUT WURDEN ──────────────────────────────────────
 *
 * Das Manifest zeigt jetzt auf `/`. Das allein wäre eine Reparatur, die vom
 * Wohlverhalten eines Anbieters abhängt: jede andere Umleitung — ein Wechsel
 * auf HTTPS, ein Schrägstrich zu viel, eine Anmeldeschleife — träfe wieder
 * die ganze App. Deshalb baut das Dienst-Skript die Antwort neu auf, bevor
 * es sie herausgibt.
 *
 * DIESER LAUF PRÜFT DIE ZWEITE HÄLFTE, und zwar am echten Fehler: der Server
 * hier leitet absichtlich um. Ohne `ohneUmleitung` bleibt die Seite leer.
 *
 *   node pruefungen/lauf/test125.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8814;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

/* --------------------------------------------------------------------------
 * Ein Server, der sich verhält wie Cloudflare: `/index.html` wird auf `/`
 * umgeleitet. Genau daran ist die installierte App gescheitert.
 * ------------------------------------------------------------------------*/
let umleitungen = 0;
const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const weg0 = (a.url || '/').split('?')[0] || '/';

  if (weg0 === '/index.html') {
    umleitungen++;
    b.writeHead(302, { Location: '/' });
    b.end();
    return;
  }

  const datei = weg0 === '/' ? 'index.html' : weg0.replace(/^\//, '');
  const pfad = join(WURZEL, datei);
  if (!existsSync(pfad)) { b.writeHead(404); b.end('nichts da'); return; }

  const endung = datei.slice(datei.lastIndexOf('.'));
  b.writeHead(200, {
    'Content-Type': TYP[endung] || 'application/octet-stream',
    /* Ohne diese Zeile registriert der Browser `sw.js` nicht im Wurzelbereich. */
    ...(datei === 'sw.js' ? { 'Service-Worker-Allowed': '/' } : {})
  });
  b.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, f));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true
});
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(String(e.message)));

console.log('\n1 · Das Dienst-Skript wird überhaupt aktiv');

await seite.goto(`http://localhost:${PORT}/`);
/* Auf die Übernahme warten — vorher geht die Anfrage am Skript vorbei und
   dieser Lauf misst nichts. */
const aktiv = await seite.evaluate(async () => {
  if (!navigator.serviceWorker) return 'kein serviceWorker';
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready.then(() => 'bereit'),
      new Promise(f => setTimeout(() => f('zu langsam'), 15000))
    ]);
    return String(reg);
  } catch (e: unknown) { return 'Fehler: ' + (e instanceof Error ? e.message : String(e)); }
});
p('Das Dienst-Skript ist bereit', aktiv === 'bereit', aktiv);

/* Ein zweiter Aufruf, damit das Skript die Anfragen wirklich beantwortet —
   beim allerersten Laden kontrolliert es die Seite noch nicht. */
await seite.goto(`http://localhost:${PORT}/`);
const kontrolliert = await seite.evaluate(() => !!navigator.serviceWorker.controller);
p('… und kontrolliert die Seite', kontrolliert,
  'ohne Kontrolle läuft die Navigation am Skript vorbei');

console.log('\n2 · Der umgeleitete Start — der Fall vom iPhone');

/* JETZT DER EIGENTLICHE PUNKT. `/index.html` ist der Weg, der im Manifest
   stand; dieser Server leitet ihn um, wie Cloudflare es tut. Die Navigation
   läuft durch das Dienst-Skript. Ohne `ohneUmleitung` bricht sie ab. */
const vorher = umleitungen;
let ladeFehler = '';
try {
  await seite.goto(`http://localhost:${PORT}/index.html`, { timeout: 20000 });
} catch (e: unknown) {
  ladeFehler = e instanceof Error ? e.message : String(e);
}

p('Der Server hat wirklich umgeleitet', umleitungen > vorher,
  'ohne Umleitung prüft dieser Abschnitt nichts — er könnte gar nicht rot werden');
p('Die Seite lädt trotzdem', ladeFehler === '', ladeFehler.slice(0, 120));

const angekommen = await seite.evaluate(() => ({
  titel: document.title,
  hatApp: !!document.getElementById('app') || !!document.getElementById('main'),
  text: (document.body?.textContent || '').trim().length
})).catch(() => ({ titel: '(nichts)', hatApp: false, text: 0 }));

p('Und es steht Redion da, nicht eine leere Seite',
  angekommen.hatApp && angekommen.text > 0,
  JSON.stringify(angekommen));

console.log('\n3 · Das Manifest zeigt auf einen Weg ohne Umleitung');

/* Die andere Hälfte der Reparatur. Sie steht hier, weil die erste Hälfte
   sie nicht überflüssig macht und umgekehrt: das Skript fängt jede
   Umleitung ab, das Manifest sorgt dafür, dass gar keine entsteht. */
const manifest = JSON.parse(
  readFileSync(join(WURZEL, 'oeffentlich/manifest.webmanifest'), 'utf8'));
p('`start_url` ist „/", nicht „/index.html"', manifest.start_url === '/',
  String(manifest.start_url));
p('Auch die Kurzwege zeigen dorthin',
  (manifest.shortcuts || []).every((k: any) => !/index\.html/.test(k.url || '')),
  JSON.stringify((manifest.shortcuts || []).map((k: any) => k.url)));
p('Und das Ziel fürs Teilen ebenso',
  !/index\.html/.test((manifest.share_target || {}).action || ''),
  String((manifest.share_target || {}).action));

p('Keine Skriptfehler nebenbei', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();
console.log(`\n  Suite 89 — Start der installierten App: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
