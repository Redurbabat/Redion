/* Suite 104 — Jede Grenze hat ein Zuhause (L34)
 * ============================================================================
 * Am 8. August hat dieselbe Fehlerklasse dreimal zugeschlagen: ein Wert
 * steht an zwei Stellen, nichts erzwingt Gleichheit, und die Abweichung
 * fällt erst spät auf (E64 zweimal, E65). Danach wurde gezielt gesucht.
 * Vier Grössengrenzen der Dateiablage standen je zweimal:
 *
 *     STUECK    1 MB     konstanten.ts   und  dateien/ablage.ts
 *     KLEIN     256 KB   konstanten.ts   und  dateien/ablage.ts
 *     DATEI_MAX 500 MB   konstanten.ts   und  dateien/ablage.ts
 *     100 MB             maschine.ts (blank)  und  server/dateien.ts
 *
 * Alle vier stimmten überein. Das ist kein Trost: `ZH_HANDY` und
 * `--tbl-zh` stimmten auch überein, bis sie es nicht mehr taten.
 *
 * DREI DAVON LASSEN SICH TEILEN. `ablage.ts` liest jetzt `KONSTANTEN`.
 *
 * DIE VIERTE NICHT. Das Gerät und der Server sind getrennte Bündel: der
 * Worker läuft bei Cloudflare und kann `konstanten.js` nicht lesen. Zwei
 * Zahlen also, notgedrungen — und genau dann muss ein Prüflauf sie
 * nachrechnen, statt sich auf einen Kommentar zu verlassen.
 *
 * Was dabei schiefginge: läge die Zahl im Gerät höher, schickte es Dateien,
 * die der Server mit 413 abweist — der Nutzer sieht einen Fehler ohne
 * Erklärung. Läge sie tiefer, hielte es Dateien zurück, die durchgingen,
 * und sie fehlten auf dem zweiten Gerät, ohne dass irgendwo etwas rot wird.
 *
 *   node pruefungen/lauf/test140.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8819;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const lies = (rel: string) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const mb = (n: number) => Math.round(n / 1048576) + ' MB';

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

console.log('\n1 · Die Grenzen der Ablage kommen aus EINER Datei');

const werte = await seite.evaluate(() => {
  const K = (KONSTANTEN as any);
  return { STUECK: K.STUECK, KLEIN: K.KLEIN, DATEI_MAX: K.DATEI_MAX,
           SERVER: K.SERVER_DATEI_MAX };
});
gleich('STUECK ist 1 MB', (werte as any).STUECK, 1048576);
gleich('KLEIN ist 256 KB', (werte as any).KLEIN, 262144);
gleich('DATEI_MAX ist 500 MB', (werte as any).DATEI_MAX, 524288000);
gleich('SERVER_DATEI_MAX ist 100 MB', (werte as any).SERVER, 104857600);

/* Und die Dateiablage schreibt sie nicht mehr selbst hin. */
const ablageTs = lies('src/bereiche/dateien/ablage.ts');
p('`dateien/ablage.ts` liest die Konstanten',
  /KONSTANTEN/.test(ablageTs) && /K\('STUECK'/.test(ablageTs));
/* Der Rückfall darf dastehen — ohne `konstanten.js` wäre eine Grenze von
   `undefined` schlimmer als eine falsche. Was NICHT dastehen darf, ist
   eine Zahl, die etwas anderes sagt. */
const rueckfall = /K\('DATEI_MAX',\s*([0-9 *]+)\)/.exec(ablageTs)?.[1] ?? '';
// eslint-disable-next-line no-eval
const rueckfallWert = rueckfall ? Function('return ' + rueckfall)() : -1;
gleich('Auch der Rückfallwert nennt dieselbe Zahl',
  rueckfallWert, (werte as any).DATEI_MAX);

console.log('\n2 · Die Grenze wirkt auch wirklich');
/* Eine Konstante, die niemand anwendet, ist keine Grenze. */
const abgewiesen = await seite.evaluate(async () => {
  try {
    await (Dateien as any).anmelden({ name: 'zu-gross.bin',
      groesse: 600 * 1024 * 1024, typ: 'application/octet-stream' });
    return { geworfen: false, text: '' };
  } catch (e) { return { geworfen: true, text: e instanceof Error ? e.message : String(e) }; }
});
p('Eine Datei über der Grenze wird abgewiesen', (abgewiesen as any).geworfen === true);
p('… und die Meldung nennt die Grenze in MB',
  /500 MB/.test((abgewiesen as any).text ?? ''), (abgewiesen as any).text);

const angenommen = await seite.evaluate(async () => {
  try {
    const r = await (Dateien as any).anmelden({ name: 'klein.txt', groesse: 1000,
      typ: 'text/plain' });
    return { ok: !!r?.id, teile: r?.teile };
  } catch (e) { return { ok: false, teile: -1, fehler: String(e) }; }
});
p('Eine kleine Datei geht durch', (angenommen as any).ok === true,
  JSON.stringify(angenommen));
gleich('… und braucht genau ein Stück', (angenommen as any).teile, 1);

console.log('\n3 · Gerät und Server nennen dieselbe Zahl');
/* DIESE ZWEI LASSEN SICH NICHT TEILEN. Der Worker läuft bei Cloudflare
   und kann `konstanten.js` nicht lesen. Also wird nachgerechnet. */
const serverTs = lies('server/dateien.ts');
const roh = /export const DATEI_GRENZE\s*=\s*([0-9 *A-Za-z]+);/.exec(serverTs)?.[1] ?? '';
const serverGrenze = roh ? Function('const MB = 1024*1024; return ' + roh)() : -1;

p('Der Server nennt eine Dateigrenze', serverGrenze > 0, roh.trim());
gleich('Sie ist dieselbe wie im Gerät', serverGrenze, (werte as any).SERVER);
p('… und in MB gelesen ergibt das dasselbe',
  mb(serverGrenze) === mb((werte as any).SERVER),
  `Server ${mb(serverGrenze)}, Gerät ${mb((werte as any).SERVER)}`);

/* Und der Abgleich trägt keine blanke Zahl mehr. */
const maschineTs = lies('src/kern/abgleich/maschine.ts');
p('Der Abgleich nennt die Grenze beim Namen',
  /SERVER_DATEI_MAX/.test(maschineTs));
p('… und nicht mehr als blanke Zahl in der Schleife',
  !/>\s*100\s*\*\s*1024\s*\*\s*1024/.test(maschineTs));

console.log('\n4 · Und die Stückgrösse passt zu dem, was der Server annimmt');
/* Der Server lässt die doppelte Stückgrösse durch — Luft, damit ein
   verschlüsseltes Stück nicht knapp darüber liegt. Weniger als das Gerät
   schneidet wäre ein Abgleich, der bei jeder grösseren Datei stehenbleibt. */
const stueckRoh = /export const STUECK_GRENZE\s*=\s*([0-9 *A-Za-z]+);/.exec(serverTs)?.[1] ?? '';
const stueckServer = stueckRoh ? Function('const MB = 1024*1024; return ' + stueckRoh)() : -1;
if (stueckServer > 0) {
  p('Der Server nimmt mindestens ein volles Stück an',
    stueckServer >= (werte as any).STUECK,
    `Server ${stueckServer}, Gerät schneidet bei ${(werte as any).STUECK}`);
} else {
  p('Der Server nennt eine Stückgrenze', false, 'nicht gefunden in server/dateien.ts');
}

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 104 — Jede Grenze hat ein Zuhause: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
