/* Suite 128 — Die Blocktypen-Inventur lügt nicht (L19)
 * ============================================================================
 * doku/BLOCKTYPEN.md ist aus dem Register erzeugt — und dieser Lauf hält
 * beide zusammen: jede Kennung im Register muss in der Doku stehen, jede
 * Kennung in der Doku im Register. Wächst das eine, muss das andere
 * nachziehen; eine Inventur, die vom Bestand abweicht, ist keine
 * (die alte tat genau das: „58", während das Register 76 führte).
 *
 *   node pruefungen/lauf/test164.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8874;

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

const browser = await chromium.launch();
const seite = await browser.newPage();
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
const register: string[] = await seite.evaluate(() =>
  ((window as any).Register?.bloecke?.alle?.() || []).map((b: any) => String(b.id)));
await browser.close();

const doku = fs.readFileSync(path.join(WURZEL, 'doku/BLOCKTYPEN.md'), 'utf8');
/* Nur die Inventur-Tabellen zählen — die Kandidaten-Tabelle nennt Kennungen
   im Fliesstext erneut. Inventur-Zeilen sehen so aus: | `id` | Name | */
const inDoku = [...doku.matchAll(/^\| `([a-z0-9-]+)` \| [^|]*\|$/gm)].map(m => m[1]!);

p('Das Register liefert Einträge', register.length > 0, String(register.length));
p('Die Doku führt gleich viele', inDoku.length === register.length,
  `Doku ${inDoku.length}, Register ${register.length}`);

const dokuMenge = new Set(inDoku);
const fehltInDoku = register.filter(id => !dokuMenge.has(id));
p('Jede Register-Kennung steht in der Doku', fehltInDoku.length === 0,
  'fehlt: ' + fehltInDoku.join(', '));

const registerMenge = new Set(register);
const zuViel = inDoku.filter(id => !registerMenge.has(id));
p('Die Doku erfindet keine Kennungen', zuViel.length === 0,
  'erfunden: ' + zuViel.join(', '));

const doppelt = inDoku.filter((id, i) => inDoku.indexOf(id) !== i);
p('Keine Kennung doppelt', doppelt.length === 0, doppelt.join(', '));

p('Die Doku nennt ihren Stand', doku.includes(`Stand: ${register.length} Einträge`),
  'die Standzeile stimmt nicht mit dem Register überein');

server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
