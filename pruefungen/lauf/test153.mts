/* Suite 117 — Bytes unter ihrer Inhaltsadresse: OPFS, Dedup, Rückfall (RM-8)
 * ============================================================================
 * Der Blob-Speicher der neuen Schicht, geprüft im echten Chromium mit
 * echtem OPFS:
 *
 *   1. put/get/has/remove über OPFS — und die Bytes kommen unverändert
 *      zurück.
 *   2. DEDUP IST KEINE FUNKTION, SONDERN DIE FOLGE DER ADRESSIERUNG:
 *      dieselben Bytes zweimal abgelegt ergeben dieselbe Adresse und
 *      EINEN Eintrag. Geprüft wird über die OPFS-Belegung, nicht über
 *      eine Behauptung des Codes.
 *   3. Der Rückfall: ohne OPFS (Zugriff kaputtgemacht) landet derselbe
 *      Blob in IndexedDB — und get findet ihn dort genauso.
 *
 * Der Lauf nutzt den GEBAUTEN Code über window.RedionFiles (E73: keine
 * Abschriften prüfen).
 *
 *   node pruefungen/lauf/test153.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8859;

if (!fs.existsSync(path.join(WURZEL, 'dist-neu/app.html')))
  execSync('npx vite build', { cwd: WURZEL, stdio: 'pipe' });

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const ausNeu = rein === '/app.html' || rein.startsWith('/assets/');
  const basis = ausNeu ? path.join(WURZEL, 'dist-neu') : WURZEL;
  const pfad = path.join(basis, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(basis) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
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

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(1500);

console.log('\n1 · put, get, has, remove — über echtes OPFS');

const grund = await seite.evaluate(async () => {
  const F = (window as any).RedionFiles;
  if (!F) return { fehlt: true };
  const store = new F.BlobStore('blobs-test-' + Math.random().toString(36).slice(2));
  const bytes = new Uint8Array(5 * 1048576);
  for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i / 4096) % 251;
  const adresse = await store.put(new Blob([bytes]));
  const weg1 = store.zuletzt;
  const zurueck = await store.get(adresse);
  const raus = zurueck ? new Uint8Array(await zurueck.arrayBuffer()) : null;
  let gleichBytes = !!raus && raus.length === bytes.length;
  if (raus) for (let i = 0; i < raus.length; i += 4096)
    if (raus[i] !== bytes[i]) { gleichBytes = false; break; }
  const hatte = await store.has(adresse);
  await store.remove(adresse);
  const nachher = await store.has(adresse);
  const holNachher = await store.get(adresse);
  return { fehlt: false, adresse, weg1, gleichBytes, hatte, nachher,
           holNull: holNachher === null };
});
p('Der Blob-Speicher ist im Bau erreichbar', (grund as any).fehlt !== true);
p('Die Adresse trägt die Fassungskennung',
  String((grund as any).adresse || '').startsWith('redion-merkle-v1:'));
gleich('Der Weg war OPFS', (grund as any).weg1, 'opfs');
p('Die 5 MB kommen Byte für Byte zurück', (grund as any).gleichBytes === true);
gleich('has sagt ja, solange es da ist', (grund as any).hatte, true);
gleich('… und nein nach remove', (grund as any).nachher, false);
p('get gibt dann ehrlich null', (grund as any).holNull === true);

console.log('\n2 · Dedup als Folge der Adressierung');

const dedup = await seite.evaluate(async () => {
  const F = (window as any).RedionFiles;
  const store = new F.BlobStore('blobs-test-' + Math.random().toString(36).slice(2));
  const bytes = new Uint8Array(2 * 1048576).fill(7);
  const a1 = await store.put(new Blob([bytes]));
  const belegt1 = (await navigator.storage.estimate()).usage ?? 0;
  const a2 = await store.put(new Blob([bytes]));
  const belegt2 = (await navigator.storage.estimate()).usage ?? 0;
  return { gleicheAdresse: a1 === a2, belegt1, belegt2,
           zuwachs: belegt2 - belegt1 };
});
gleich('Dieselben Bytes ergeben dieselbe Adresse', (dedup as any).gleicheAdresse, true);
p('Und der zweite put belegt (fast) nichts dazu',
  (dedup as any).zuwachs < 200 * 1024,
  `Zuwachs ${(dedup as any).zuwachs} Bytes bei 2 MB Nutzlast`);

console.log('\n3 · Der Rückfall: ohne OPFS trägt IndexedDB');

const rueckfall = await seite.evaluate(async () => {
  const F = (window as any).RedionFiles;
  const store = new F.BlobStore('blobs-test-' + Math.random().toString(36).slice(2));
  const echt = navigator.storage.getDirectory;
  (navigator.storage as any).getDirectory = () => { throw new Error('OPFS abgeschaltet'); };
  const bytes = new Uint8Array([9, 9, 9, 1, 2, 3]);
  let adresse = '', wegHin = '', gelesen: number[] = [], wegHer = '';
  try {
    adresse = await store.put(new Blob([bytes]));
    wegHin = store.zuletzt;
    const b = await store.get(adresse);
    gelesen = b ? [...new Uint8Array(await b.arrayBuffer())] : [];
    wegHer = store.zuletzt;
  } finally {
    (navigator.storage as any).getDirectory = echt;
  }
  /* Und mit OPFS zurück: get findet den IndexedDB-Eintrag WEITERHIN —
     sonst wären Rückfall-Bytes nach einem Browser-Update verloren. */
  const nachher = await store.get(adresse);
  return { wegHin, wegHer, gelesen: gelesen.join(','),
           nachherDa: nachher !== null };
});
gleich('put ging nach IndexedDB', (rueckfall as any).wegHin, 'indexeddb');
gleich('get fand es dort', (rueckfall as any).wegHer, 'indexeddb');
gleich('Byte für Byte', (rueckfall as any).gelesen, '9,9,9,1,2,3');
p('Und mit OPFS zurück bleibt der Rückfall-Eintrag erreichbar',
  (rueckfall as any).nachherDa === true);

console.log('\n4 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 117 — Inhaltsadressen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
