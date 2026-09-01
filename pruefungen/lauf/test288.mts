/* Suite 288 — Der Abdruck bemerkt Anhänge (E294, L82 Punkt 5)
 * ============================================================================
 * Die Ordner-Sicherung fragt alle fünf Minuten, ob sich etwas getan hat.
 * `standAbdruck()` (`kern/helfer/ordnersicherung.ts:133`) lief dafür über
 * drei Fächer:
 *
 *     for (const fach of ['blocks', 'collections', 'views'])
 *
 * Dateien standen nicht dabei — sie liegen gar nicht im Spiegel
 * (`indexdb.ts:255` hält `blocks`, `collections`, `views`, `meta`,
 * `suchindex`). Wer nur einen Anhang austauschte, änderte deshalb nichts,
 * was der Abdruck sehen konnte. Es wurde nicht gesichert, bis irgendwann
 * etwas anderes sich änderte.
 *
 *   §1 EIN BLOCK ändert den Abdruck — das ging schon vorher.
 *   §2 EINE DATEI jetzt auch.
 *   §3 EINE GELÖSCHTE DATEI ebenso.
 *   §4 GEGENPROBE: ohne Änderung bleibt der Abdruck gleich — sonst
 *      sicherte Redion alle fünf Minuten für immer.
 *   §5 UND `meta` ZÄHLT WEITER NICHT MIT — das ist der Grund, warum §4 geht.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §2 und §3 waren vor E294 rot. §4 ist die Gegenprobe, ohne die man das
 * Ganze auch mit `Math.random()` grün bekäme — und §5 ist die Gegenprobe
 * zu §4: sie zeigt, dass die Ruhe nicht daher kommt, dass gar nichts
 * gemessen wird.
 *
 *   node pruefungen/lauf/test288.mts
 * ==========================================================================*/
declare const Store: any; declare const OrdnerSicherung: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9073;

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
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' &&
        typeof (globalThis as any).OrdnerSicherung !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1200);

const abdruck = () => seite.evaluate(() =>
  String(OrdnerSicherung.standAbdruck())) as Promise<string>;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Ein Block ändert den Abdruck');

const a0 = await abdruck();
await seite.evaluate(() => {
  document.getElementById('rg-willkommen')?.remove();
  Store.addBlock(null, 'page', { text: 'Neue Seite für den Abdruck' });
});
const a1 = await abdruck();

p('Der Abdruck ist eine nicht-leere Zeichenkette', a0.length > 3, a0);
p('Ein neuer Block ändert ihn', a1 !== a0, a0 + ' → ' + a1);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Eine Datei jetzt auch');

const dat = await seite.evaluate(async () => {
  await Store.dateiPut({ id: 'e294-probe', name: 'probe.bin', groesse: 12,
                         typ: 'application/octet-stream', blockId: null,
                         teile: 1, angekommen: 1, zustand: 'fertig',
                         angelegt: new Date().toISOString(), fertigAm: null });
  return String(OrdnerSicherung.standAbdruck());
}) as string;

p('Eine neue Datei ändert den Abdruck — DAS ist der Fund', dat !== a1,
  a1 + ' → ' + dat);

const getauscht = await seite.evaluate(async () => {
  /* Dieselbe Kennung, andere Grösse — der Fall „Datei ausgetauscht". */
  await Store.dateiPut({ id: 'e294-probe', name: 'probe.bin', groesse: 99999,
                         typ: 'application/octet-stream', blockId: null,
                         teile: 1, angekommen: 1, zustand: 'fertig',
                         angelegt: new Date().toISOString(), fertigAm: null });
  return String(OrdnerSicherung.standAbdruck());
}) as string;

p('… und eine AUSGETAUSCHTE Datei ebenso, ohne dass ein Block sich rührt',
  getauscht !== dat, dat + ' → ' + getauscht);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Eine gelöschte Datei ebenso');

const weg2 = await seite.evaluate(async () => {
  await Store.dateiWeg('e294-probe');
  return String(OrdnerSicherung.standAbdruck());
}) as string;

p('Löschen ändert den Abdruck', weg2 !== getauscht, getauscht + ' → ' + weg2);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: ohne Änderung bleibt er gleich');

const r1 = await abdruck();
await seite.waitForTimeout(120);
const r2 = await abdruck();
p('Zweimal gefragt, zweimal dasselbe — sonst sicherte Redion für immer',
  r1 === r2, r1 + ' / ' + r2);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und `meta` zählt weiter nicht mit');

const metaEgal = await seite.evaluate(() => {
  const vor = String(OrdnerSicherung.standAbdruck());
  Store.setMeta('sicherung:zuletzt', new Date().toISOString());
  Store.setMeta('irgendwas:fremdes', Math.random());
  const nach = String(OrdnerSicherung.standAbdruck());
  return { vor, nach };
}) as any;

p('Eine Marke in `meta` ändert den Abdruck NICHT — das ist der Grund für §4',
  metaEgal.vor === metaEgal.nach, metaEgal.vor + ' / ' + metaEgal.nach);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
