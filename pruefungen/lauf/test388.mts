/* Suite 388 — Der Start wartet nicht mehr auf 185 Skripte (E389)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER 2026, bevor etwas geändert wurde. Redur hatte
 * einen PageSpeed-Bericht für `redion.redurbabat7.workers.dev` geschickt.
 * Nachgemessen im Container, mobil gedrosselt wie Lighthouse (4× langsamere
 * CPU, „Slow 4G", gzip wie ein echter Server):
 *
 *                        vorher    mit defer   + PDF erst bei Bedarf
 *   FCP ungedrosselt      1148 ms      156 ms        156 ms
 *   DOMContentLoaded      5051 ms      584 ms        556 ms
 *   FCP gedrosselt        2064 ms     1712 ms       1704 ms
 *   DCL gedrosselt       14811 ms    15017 ms      12390 ms
 *   Übertragen            2607 KB     2607 KB       2081 KB
 *
 * ZWEI VERSCHIEDENE WÄNDE, und das ist der ganze Witz dieser Suite:
 * ungedrosselt war es das BLOCKIEREN (185 Skripte ohne `defer`, jedes
 * wartet auf das vorige), gedrosselt sind es die BYTES. `defer` half nur
 * gegen das erste, das Nachladen von pdf.js nur gegen das zweite.
 *
 *   §1 Jedes Skript in `index.html` trägt `defer`.
 *   §2 pdf.js wird beim Start NICHT geholt.
 *   §3 … aber sehr wohl, sobald jemand es braucht.
 *   §4 Die Einzeldatei trägt die Bytes trotzdem in sich (§29).
 *   §5 Eine Decke über das, was der Start überhaupt holt.
 *
 *   node pruefungen/lauf/test388.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9409;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};

/* MIT GZIP AUSLIEFERN. Ohne das misst die Decke in §5 Bytes, die nie über
   eine Leitung gehen — Cloudflare komprimiert, und die Zahl wäre doppelt so
   gross und damit ohne Bezug zu dem, was ein Mensch wartet. */
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  const roh = fs.readFileSync(pfad);
  const art = TYP[path.extname(pfad)] ?? 'application/octet-stream';
  if (/text|javascript|json|manifest/.test(art) &&
      String(a.headers['accept-encoding'] ?? '').includes('gzip')) {
    const weg = zlib.gzipSync(roh, { level: 6 });
    b.writeHead(200, { 'Content-Type': art, 'Content-Encoding': 'gzip',
                       'Content-Length': String(weg.length) });
    b.end(weg);
  } else {
    b.writeHead(200, { 'Content-Type': art, 'Content-Length': String(roh.length) });
    b.end(roh);
  }
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const lies = (rel: string): string => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

/* ==========================================================================
 * §1 · Jedes Skript trägt `defer`
 * --------------------------------------------------------------------------
 * WARUM HINTER `src` UND NICHT DAVOR. `test87 §8` und `test143 §2` lesen die
 * geladenen Dateien mit `/<script src="([^"]+)"/` aus. Ein `<script defer
 * src="…">` würde von beiden nicht mehr gefunden — sie wären grün und
 * messten nichts. Diese Zeile hält die Reihenfolge fest.
 * ======================================================================== */
console.log('\n1 · Jedes Skript in index.html trägt `defer`');
const html = lies('index.html');
const alleSkripte = [...html.matchAll(/<script src="(quell\/[^"]+)"([^>]*)>/g)]
  .map(m => ({ datei: m[1] ?? '', rest: m[2] ?? '' }));
p('index.html lädt viele Skripte', alleSkripte.length > 150, String(alleSkripte.length));
const ohneDefer = alleSkripte.filter(s => !/\bdefer\b/.test(s.rest));
gleich('Keines davon ohne `defer`', ohneDefer.map(s => s.datei), []);
const davor = [...html.matchAll(/<script\s+defer\s+src="/g)];
gleich('Und keines schreibt `defer` VOR `src` (sonst messen test87/test143 nichts)',
  davor.length, 0);

/* ==========================================================================
 * §2 · pdf.js kommt beim Start nicht mit
 * ======================================================================== */
console.log('\n2 · Beim Start wird pdf.js nicht geholt');
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      isMobile: true, hasTouch: true });
const geholt: Array<{ url: string; bytes: number }> = [];
seite.on('response', r => {
  const len = Number(r.headers()['content-length'] ?? 0);
  geholt.push({ url: r.url().replace(`http://localhost:${PORT}/`, ''), bytes: len });
});
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(e.message.slice(0, 140)));

await seite.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await seite.waitForTimeout(3500);
await seite.evaluate(`document.getElementById('rg-willkommen')?.remove()`);

const beimStart = geholt.slice();
const pdfBeimStart = beimStart.filter(g => /pdfjs\/daten\.js/.test(g.url));
gleich('`daten.js` wurde beim Start nicht angefordert', pdfBeimStart.length, 0);
p('Der Lader selbst ist aber da — sonst ginge nie eine PDF auf',
  beimStart.some(g => /pdfjs\/laden\.js/.test(g.url)),
  beimStart.filter(g => /pdfjs/.test(g.url)).map(g => g.url).join(', ') || '(nichts)');
p('Und die App ist trotzdem gestartet',
  await seite.evaluate(`typeof App !== 'undefined' && typeof Store !== 'undefined'`));

/* ==========================================================================
 * §3 · … aber sehr wohl, sobald jemand sie braucht
 * --------------------------------------------------------------------------
 * DER TEIL, DER WIRKLICH ZÄHLT. Eine Datei nicht zu laden ist leicht; sie
 * dann noch zu bekommen, wenn sie gebraucht wird, ist der ganze Punkt.
 * Geprüft wird an `PdfFremd.laden()` selbst — der Griff, den jeder
 * PDF-Weg benutzt —, und zwar auf ein ECHTES Modul, nicht auf „kein
 * Fehler".
 * ======================================================================== */
console.log('\n3 · Beim Gebrauch kommt sie nach');
const ergebnis: any = await seite.evaluate(`(async () => {
  try {
    const modul = await PdfFremd.laden();
    return { ok: true,
             hatDokument: typeof modul.getDocument === 'function',
             hatWorker: !!(modul.GlobalWorkerOptions
                           && modul.GlobalWorkerOptions.workerSrc) };
  } catch (e) { return { ok: false, fehler: String(e && e.message || e) }; }
})()`);
p('`PdfFremd.laden()` liefert ein Modul', ergebnis.ok === true, JSON.stringify(ergebnis));
p('… und zwar pdf.js — `getDocument` ist da', ergebnis.hatDokument === true);
p('… mit gesetztem Worker', ergebnis.hatWorker === true);
p('JETZT wurde `daten.js` geholt',
  geholt.some(g => /pdfjs\/daten\.js/.test(g.url)),
  geholt.filter(g => /pdfjs/.test(g.url)).map(g => g.url).join(', ') || '(nichts)');

/* Zweimal fragen darf nicht zweimal holen. */
const vorher = geholt.filter(g => /pdfjs\/daten\.js/.test(g.url)).length;
await seite.evaluate(`PdfFremd.laden()`);
await seite.waitForTimeout(400);
const nachher = geholt.filter(g => /pdfjs\/daten\.js/.test(g.url)).length;
gleich('Ein zweiter Aufruf holt sie nicht noch einmal', nachher, vorher);

/* ==========================================================================
 * §4 · Die Einzeldatei hat die Bytes trotzdem (§29)
 * ======================================================================== */
console.log('\n4 · Die Einzeldatei trägt die Bibliothek in sich');
const einzel = lies('redion-einzeldatei.html');
/* NICHT AUF DEN NAMEN PRÜFEN, SONDERN AUF DIE BYTES.
   Der erste Entwurf fragte `einzel.includes('PDFJS_EINGEPACKT')` — und blieb
   bei der Gegenprobe GRÜN, als `bauen.mts` die Bytes weggelassen hat: den
   Namen nennt auch `laden.js`, siebenmal. Eine Prüfung, die nicht rot werden
   kann, ist keine (§55.2). Gemessen liegen die zwei Base64-Zeilen bei
   518 136 und 197 602 Zeichen; die Schranke steht bei 100 000, damit sie
   nicht an einer neuen pdf.js-Fassung hängt. */
const zeilen = einzel.split('\n');
const wo = zeilen.findIndex(z => /const PDFJS_EINGEPACKT\s*=\s*\{/.test(z));
/* NUR DIE ZEILEN DIREKT DAHINTER ZÄHLEN. Der zweite Entwurf mass die
   LÄNGSTE Zeile der ganzen Datei — und die ist mit 319 275 Zeichen eine
   ganz andere (ein Lernpaket). Auch die wäre grün gewesen, wenn pdf.js
   fehlt. Gemessen liegen die zwei Base64-Zeilen bei 518 136 und 197 602
   Zeichen; die Schranke steht bei 100 000, damit sie nicht an einer neuen
   pdf.js-Fassung hängt. */
const beiPdf = wo < 0 ? 0
  : zeilen.slice(wo, wo + 6).reduce((m, z) => Math.max(m, z.length), 0);
p('Die Einzeldatei trägt die eingepackten Bytes, nicht nur den Namen',
  wo >= 0 && beiPdf > 100000,
  wo < 0 ? 'keine Deklaration gefunden' : `längste Zeile dort ${beiPdf} Zeichen`);
gleich('Und sie verweist auf keine Datei daneben',
  (einzel.match(/<script src="quell\//g) || []).length, 0);
p('Die Marke steht noch in index.html — ohne sie bricht `bauen.mts` ab',
  /<!-- pdfjs-daten:/.test(html));
p('`bauen.mts` bricht wirklich ab, wenn sie fehlt',
  /die Marke .pdfjs-daten. fehlt/.test(lies('bauen.mts')));

/* ==========================================================================
 * §5 · Eine Decke über das, was der Start holt
 * --------------------------------------------------------------------------
 * KEINE ZAHL AUS DER LUFT. Gemessen am 4. September: 2081 KB über 203
 * Dateien, gzip. Die Decke stand auf 2300 KB — genug Luft für gewöhnliche
 * Arbeit, aber nicht genug, um pdf.js unbemerkt zurückzuholen.
 *
 * Sie DARF wachsen, wenn jemand einen Grund aufschreibt — sie soll nur
 * nicht schweigend wachsen.
 *
 * ── SIE IST SCHWEIGEND GEWACHSEN, UND ZWAR ZWÖLF TAGE LANG (E613) ─────────
 *
 * Am 16. September nachgemessen, weil niemand hinsah: die Läufe auf GitHub
 * brechen seit Wochen nach drei Sekunden ab (Konto-Ebene, kein Codefehler),
 * und im Container hatte den Lauf niemand gefahren.
 *
 *     4. September    203 Dateien   2081 KB   ← die Zahl, aus der 2300 kam
 *     5. September    207 Dateien   2169 KB
 *     16. September   232 Dateien   2637 KB   ← die Decke war gerissen
 *
 * WOHER DIE 512 KB KAMEN, gezählt und nicht vermutet (gzip Stufe 6, gegen
 * `57a5199`):
 *
 *     26 NEUE Dateien                           229 KB
 *     206 GEWACHSENE Dateien                    291 KB
 *
 *     davon  chronik/daten.js         neu      54,2 KB
 *            schale/stil/motion.css   neu      47,6 KB
 *            pdf/marken.js            +68,1 KB
 *            pdf/document-mode.js     +64,1 KB
 *
 * `marken.js` und `document-mode.js` sind das Zeichen- und das Schreibstudio.
 * Sie sind gewachsen, WEIL dort gearbeitet wurde (E568–E612) — das ist kein
 * Fehler, das ist das Produkt.
 *
 * `chronik/daten.js` war einer. 182 KB Chronikprosa bei jedem Start, für
 * einen Bildschirm hinter einem Zugangscode. Seit E613 holt
 * `chronik/laden.js` sie nach — dasselbe Muster wie pdf.js hier in §2/§3.
 * Gemessen an diesem Lauf: **2637 → 2585 KB**.
 *
 * ── UND DESHALB STEHT DIE DECKE JETZT AUF 2700 ───────────────────────────
 *
 * Nicht auf 2600 (dann reisst sie beim nächsten Bogen und wird zum Rauschen),
 * nicht auf 3000 (dann passte pdf.js wieder unbemerkt hinein). 2700 lässt
 * rund 115 KB für gewöhnliche Arbeit und bleibt 526 KB unter dem Punkt, an
 * dem eine ganze Bibliothek zurückkäme — das prüft die zweite Zusicherung
 * darunter, und sie ist der Grund, warum die Zahl nicht grosszügig sein darf.
 * ======================================================================== */
console.log('\n5 · Was der Start holt, hat eine Decke');
const kb = Math.round(beimStart.reduce((s, g) => s + g.bytes, 0) / 1024);
const DECKE = 2700;   /* 16. September 2026, gemessen — siehe oben */
p(`Der Start holt ${kb} KB (gzip) über ${beimStart.length} Dateien — Decke ${DECKE} KB`,
  kb <= DECKE, `${kb} KB`);
p('Und die Decke kann überhaupt reissen — pdf.js allein wären 526 KB mehr',
  kb + 526 > DECKE, `${kb} + 526 = ${kb + 526}`);
p('Die Chronik wird beim Start nicht geholt (E613)',
  !beimStart.some(g => /chronik\/daten\.js/.test(g.url)),
  beimStart.filter(g => /chronik/.test(g.url)).map(g => g.url.split('/').pop()).join(', ') || '(nichts)');

console.log('');
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' ‖ '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
