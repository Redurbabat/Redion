/* Suite 127 — Tabellenblock am Telefon: Zeilen als Karten (L10/E89)
 * ============================================================================
 * Die Datenbank zeigt am Telefon längst Karten; der Tabellenblock blieb
 * dasselbe Rechner-Raster, mit leeren Zeilen auf halbem Bildschirm. Jetzt,
 * als Vorschlag zum Ansehen: Zeilen als Karten — die Kopfzeile liefert die
 * Feldnamen, Formeln stehen AUSGERECHNET da, ⊞/☰ schalten je Block
 * zwischen Karten und Raster um, und am Rechner ändert sich nichts.
 *
 *   node pruefungen/lauf/test163.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8881;

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
const handy = await browser.newPage({ viewport: { width: 390, height: 844 } });
const fehler: string[] = [];
handy.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2400);

/* Der kürzeste Weg zu einem gefüllten Tabellenblock: die Markdown-Tabelle
   aus E88 — samt Formel, damit die Karte das AUSGERECHNETE zeigen muss. */
const ids = await handy.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Kartenprobe' });
  Blocks.mdEinsetzen(Blocks.mdLesen([
    '| Ware | Preis | Doppelt |',
    '| --- | --- | --- |',
    '| Brot | 3.5 | =B2*2 |',
    '| Milch | 1.2 | =B3*2 |'
  ].join('\n')), s.id, 0);
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  const tab = (Store.getBlock(s.id)?.content || []).map((i: string) => Store.getBlock(i))
    .find((b: any) => b?.type === 'spreadsheet');
  return { seite: s.id, tabId: tab?.id ?? null };
});
p('Der Tabellenblock steht', !!(ids as any).tabId);

console.log('\n1 · Am Telefon: Karten als Standard, die Kopfzeile liefert die Namen');

const karten = await handy.evaluate(() => {
  const k = [...document.querySelectorAll<HTMLElement>('.tblk-karte')];
  return {
    anzahl: k.length,
    rasterDa: !!document.querySelector('.tbl'),
    titel1: k[0]?.querySelector('.tblk-titel')?.textContent ?? '',
    namen: [...(k[0]?.querySelectorAll('.tblk-name') ?? [])].map(x => x.textContent),
    werte: [...(k[0]?.querySelectorAll('.tblk-wert') ?? [])].map(x => x.textContent),
    umschalter: !!document.querySelector('.tblk-kopf button')
  };
});
gleich('Zwei Zeilen, zwei Karten', (karten as any).anzahl, 2);
gleich('Kein Raster daneben', (karten as any).rasterDa, false);
gleich('Der Titel der ersten Karte ist „Brot"', (karten as any).titel1, 'Brot');
p('Die Feldnamen kommen aus der Kopfzeile',
  JSON.stringify((karten as any).namen) === JSON.stringify(['Preis', 'Doppelt']),
  JSON.stringify((karten as any).namen));
p('Die Formel steht AUSGERECHNET da (3.5·2 = 7)',
  ((karten as any).werte || []).includes('7'), JSON.stringify((karten as any).werte));
gleich('Der ⊞-Umschalter ist da', (karten as any).umschalter, true);

console.log('\n1b · Karte und Raster schreiben dieselbe Zahl gleich');

/* WARUM DIESE ZEILE. Die Karte las das Zellformat aus `zelle.format`,
 * gespeichert wird es aber unter `zelle.stil.format`. Sie hat also NIE ein
 * Format angewendet — dieselbe Zelle stand im Raster als „1’450.00 CHF" und
 * in der Karte als „1’450" (E227). Am Telefon ist die Karte das Erste, was
 * man sieht, und der Betrag verlor dort seine Währung.
 *
 * GEFRAGT WIRD NICHT „steht CHF da". Das wäre wieder eine Eigenschaft. Die
 * Frage ist die Wirkung: schreiben Karte und Raster DIESELBE Zahl gleich?
 * Damit fällt jede Richtung auf — ein Format, das die Karte verliert, und
 * eines, das nur die Karte erfindet. */
const gleichGeschrieben = await handy.evaluate(async (x: any) => {
  const blk = Store.getBlock(x.tabId);
  const bl = blk.mappe.blaetter[0];
  const zelle = bl.zellen['B2'];
  zelle.stil = Object.assign({}, zelle.stil || {},
    { format: { art: 'waehrung', stellen: 2, waehrung: 'CHF' } });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 500));
  const inKarte = [...document.querySelectorAll<HTMLElement>('.tblk-karte')][0]
    ?.querySelector('.tblk-wert')?.textContent ?? '';
  /* Dasselbe Blatt im Raster — über den ⊞-Umschalter, den es ohnehin gibt. */
  (document.querySelector('.tblk-kopf button') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 500));
  const inRaster = (document.querySelector('.tbl-zelle[data-a="B2"]')
    || document.querySelector('[data-a="B2"]'))?.textContent ?? '';
  (document.querySelector('.tblk-zurueck') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 400));
  return { inKarte, inRaster };
}, ids);
p('Dieselbe Zelle steht in Karte und Raster gleich da',
  (gleichGeschrieben as any).inKarte !== ''
  && (gleichGeschrieben as any).inKarte === (gleichGeschrieben as any).inRaster,
  'Karte „' + (gleichGeschrieben as any).inKarte + '" / Raster „'
  + (gleichGeschrieben as any).inRaster + '"');
p('… und das Format ist wirklich angekommen',
  /CHF/.test((gleichGeschrieben as any).inKarte),
  (gleichGeschrieben as any).inKarte);

console.log('\n2 · ⊞ öffnet das Raster, ☰ führt zurück — je Block gemerkt');

const hinUndZurueck = await handy.evaluate(async (x: any) => {
  (document.querySelector('.tblk-kopf button') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 500));
  const raster = {
    tbl: !!document.querySelector('.tbl'),
    gemerkt: (Store.getBlock(x.tabId) || {}).telefonRaster === true,
    zurueckKnopf: !!document.querySelector('.tblk-zurueck')
  };
  (document.querySelector('.tblk-zurueck') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 500));
  return {
    ...raster,
    wiederKarten: document.querySelectorAll('.tblk-karte').length,
    wiederGemerkt: (Store.getBlock(x.tabId) || {}).telefonRaster === false
  };
}, ids);
gleich('Nach ⊞ steht das Raster', (hinUndZurueck as any).tbl, true);
gleich('… und der Block merkt es sich', (hinUndZurueck as any).gemerkt, true);
gleich('Der ☰-Rückweg ist da', (hinUndZurueck as any).zurueckKnopf, true);
gleich('Nach ☰ stehen wieder die Karten', (hinUndZurueck as any).wiederKarten, 2);
gleich('… auch das gemerkt', (hinUndZurueck as any).wiederGemerkt, true);

console.log('\n3 · Die leere Tabelle sagt, wo es weitergeht');

const leer = await handy.evaluate(async (x: any) => {
  const t = Store.addBlock(x.seite, 'spreadsheet', { text: 'Frisch' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 500));
  const alle = [...document.querySelectorAll<HTMLElement>('.tblk-karten')];
  const meine = alle[alle.length - 1];
  return { hinweis: meine?.querySelector('.tblk-leer')?.textContent ?? '',
           id: t.id };
}, ids);
p('Der Hinweis nennt das Raster als Weg',
  /Raster/.test((leer as any).hinweis), (leer as any).hinweis);

console.log('\n4 · Am Rechner ändert sich nichts');

const rechner = await browser.newPage({ viewport: { width: 1280, height: 800 } });
rechner.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const amRechner = await rechner.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'R' });
  Blocks.mdEinsetzen(Blocks.mdLesen('| A | B |\n| --- | --- |\n| 1 | 2 |'), s.id, 0);
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  return { tbl: !!document.querySelector('.tbl'),
           karten: document.querySelectorAll('.tblk-karte').length };
});
gleich('Das Raster steht', (amRechner as any).tbl, true);
gleich('Keine Karten', (amRechner as any).karten, 0);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
