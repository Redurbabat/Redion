/* Suite 125 — Raster: Strg+D und Strg+R füllen aus (L20)
 * ============================================================================
 * Notion und Excel füllen mit Strg+D nach unten und Strg+R nach rechts —
 * bei uns stand beides als ✗ in der Referenz. Jetzt: die oberste Zeile
 * (bzw. linke Spalte) der Auswahl wird in den Rest gefüllt; eine einzelne
 * Zelle nimmt den Wert von darüber (bzw. links). Gilt NUR im fokussierten
 * Raster — global gehört Strg+R dem Browser und Strg+D dem Duplizieren
 * (E62, test134).
 *
 * Geprüft mit echten Maus- und Tastaturschritten am gerenderten Raster,
 * abgelesen wird der SPEICHER — nicht die Anzeige.
 *
 *   node pruefungen/lauf/test161.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8877;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

const ids = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Ausfüllen' });
  const db = Store.addDatabase(s.id, 'Füllprobe', {
    title: { name: 'Titel', type: 'title' },
    a: { name: 'A', type: 'text' },
    b: { name: 'B', type: 'text' },
    c: { name: 'C', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  const r1 = Store.addRow(c.id, { title: 'R1', a: 'Vorlage', b: 'x' });
  const r2 = Store.addRow(c.id, { title: 'R2' });
  const r3 = Store.addRow(c.id, { title: 'R3' });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-raster';
  document.body.appendChild(kasten);
  kasten.appendChild(DbRaster.zeichne(c, Store.getView((db as any).viewId), Store.rowsOf(c.id)));
  await new Promise(r => setTimeout(r, 300));
  /* Welche Sichtspalte ist welche? Die Kopfzeile weiss es. */
  const koepfe = [...document.querySelectorAll<HTMLElement>('#pruef-raster .tbl-sp')]
    .map(el => (el.textContent || '').trim());
  return { coll: c.id, r1: r1.id, r2: r2.id, r3: r3.id, koepfe };
});
const spalte = (name: string) =>
  (ids as any).koepfe.findIndex((k: string) => k.startsWith(name));

const zelle = async (z: number, s: number) => {
  const kasten = await seite.$(`#pruef-raster .tbl-z[data-z="${z}"][data-s="${s}"]`);
  return kasten;
};
const klick = async (z: number, s: number, shift = false) => {
  const el = await zelle(z, s);
  if (!el) throw new Error(`Zelle ${z}/${s} fehlt`);
  await el.click(shift ? { modifiers: ['Shift'] } : {});
};

console.log('\n0 · Ein Klick genügt — danach spricht die Tastatur');

/* Der Altfehler unter allem: Nach einem Zellklick lag der Fokus auf BODY
   (waehle() zeichnete neu, das Ereignisziel hing ab, die Browser-
   Standardaktion warf den Fokus hinterher). Pfeile, Kopieren, Enter —
   alles ging erst nach einem Tab. */
await klick(0, 0);
await seite.keyboard.press('ArrowDown');
await seite.waitForTimeout(150);
const pfeil = await seite.evaluate(() => {
  const g = document.querySelector<HTMLElement>('#pruef-raster .tbl-z.gewaehlt');
  return g ? g.dataset['z'] : null;
});
gleich('Pfeil-runter nach dem Klick wählt die nächste Zeile', pfeil, '1');

console.log('\n1 · Strg+D füllt die oberste Zeile der Auswahl nach unten');

const sA = spalte('A');
p('Die Spalte A ist im Raster', sA >= 0, JSON.stringify((ids as any).koepfe));
await klick(0, sA);
await klick(2, sA, true);
await seite.keyboard.press('Control+d');
await seite.waitForTimeout(300);
const nachD = await seite.evaluate((x: any) => ({
  r2: ((Store.getBlock(x.r2) || {}).props || {})['a'],
  r3: ((Store.getBlock(x.r3) || {}).props || {})['a']
}), ids);
gleich('Zeile 2 trägt die Vorlage', (nachD as any).r2, 'Vorlage');
gleich('Zeile 3 auch', (nachD as any).r3, 'Vorlage');

console.log('\n2 · Eine einzelne Zelle nimmt den Wert von darüber');

const sB = spalte('B');
await klick(1, sB);
await seite.keyboard.press('Control+d');
await seite.waitForTimeout(300);
const einzeln = await seite.evaluate((x: any) =>
  ((Store.getBlock(x.r2) || {}).props || {})['b'], ids);
gleich('R2.B kommt von R1.B', einzeln, 'x');

console.log('\n3 · Strg+R füllt die linke Spalte der Auswahl nach rechts');

const sC = spalte('C');
await klick(0, sA);
await klick(0, sC, true);
await seite.keyboard.press('Control+r');
await seite.waitForTimeout(300);
const nachR = await seite.evaluate((x: any) => ({
  b: ((Store.getBlock(x.r1) || {}).props || {})['b'],
  c: ((Store.getBlock(x.r1) || {}).props || {})['c']
}), ids);
gleich('R1.B wurde von A überschrieben', (nachR as any).b, 'Vorlage');
gleich('R1.C auch', (nachR as any).c, 'Vorlage');

console.log('\n4 · Ganz links gibt es nichts zu holen — und nichts geht kaputt');

await klick(2, 0);
await seite.keyboard.press('Control+r');
await seite.waitForTimeout(300);
const links = await seite.evaluate((x: any) => {
  const t = document.getElementById('toast');
  return {
    titel: (Store.getBlock(x.r3) || {}).text || '',
    hinweis: t && t.classList.contains('show') ? (t.textContent || '') : ''
  };
}, ids);
gleich('Der Titel der Zeile blieb unangetastet', (links as any).titel, 'R3');
p('Ein Hinweis erschien — still wäre verwirrend',
  /auszufüllen|links davon/.test((links as any).hinweis), (links as any).hinweis);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
