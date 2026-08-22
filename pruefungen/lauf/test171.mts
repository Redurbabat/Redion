/* Suite 137 — Zellformat beim EINLESEN: die Gegenrichtung zu E94/E95 (L18/E97)
 * ============================================================================
 * Hinaus gingen die Stile seit E94/E95 — herein kamen sie nicht: beide Leser
 * warfen styles.xml bzw. automatic-styles weg, und ein Blatt, das fett,
 * kursiv, Prozent und Währung trug, kam nackt an. Wer eine formatierte
 * Datei mit Redion weiterpflegen wollte, verlor die Formatierung beim
 * ersten Öffnen — still.
 *
 * Seit E97 geben `xlsxLesen` und `odsLesen` je Blatt eine Stil-Matrix
 * zurück (fett · kursiv · Ausrichtung · Prozent-/Währungsformat), und der
 * Tabellenblock trägt sie beim Einlesen an die Zellen — auf BEIDEN Wegen:
 * Mehrblatt (je Blatt ein eigenes) und Einzelblatt (Dialog, Schreibzeiger).
 *
 * Geprüft mit echten Download-Bytes und durch den echten Dateiwähler.
 *
 *   node pruefungen/lauf/test171.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8897;

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
const kontext = await browser.newContext({ acceptDownloads: true });
const seite = await kontext.newPage();
await seite.setViewportSize({ width: 1280, height: 800 });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Die immer gleiche Stilprobe: A2 kursiv · B2 Prozent · C2 fett+CHF+rechts. */
const STILE = [
  [null, null, null],
  [{ kursiv: true }, { format: { art: 'prozent' } },
   { fett: true, format: { art: 'waehrung', waehrung: 'CHF' }, ausrichtung: 'rechts' }]
];
const ZEILEN = [['Posten', 'Anteil', 'Betrag'], ['Miete', 0.15, 1450.5]];

const runterladen = async (ausloesen: () => Promise<void>): Promise<string> => {
  const [d] = await Promise.all([
    seite.waitForEvent('download', { timeout: 15000 }), ausloesen()
  ]);
  return (await d.path())!;
};

console.log('\n1 · Der Excel-Leser bringt die Stile mit');

const xlsxPfad = await runterladen(async () => {
  await seite.evaluate((arg: any) => {
    (Austausch as any).alsExcel([{ name: 'S', zeilen: arg.zeilen, stile: arg.stile }], 'Stilprobe');
  }, { zeilen: ZEILEN, stile: STILE });
});
const xlsxStile = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.xlsxLesen(puffer.buffer);
  const st = blaetter[0]?.stile || [];
  return { a2: st[1]?.[0] || null, b2: st[1]?.[1] || null, c2: st[1]?.[2] || null,
           a1: st[0]?.[0] || null };
}, fs.readFileSync(xlsxPfad).toString('base64'));
p('A2 kommt kursiv zurück', !!(xlsxStile as any).a2?.kursiv, JSON.stringify((xlsxStile as any).a2));
gleich('B2 kommt als Prozent zurück', (xlsxStile as any).b2?.format?.art, 'prozent');
p('C2 kommt fett, rechts und als CHF zurück',
  !!(xlsxStile as any).c2?.fett &&
  (xlsxStile as any).c2?.ausrichtung === 'rechts' &&
  (xlsxStile as any).c2?.format?.art === 'waehrung' &&
  (xlsxStile as any).c2?.format?.waehrung === 'CHF',
  JSON.stringify((xlsxStile as any).c2));

console.log('\n2 · Der ODS-Leser bringt die Stile mit');

const odsPfad = await runterladen(async () => {
  await seite.evaluate((arg: any) => {
    (Austausch as any).alsOds([{ name: 'S', zeilen: arg.zeilen, stile: arg.stile }], 'Stilprobe');
  }, { zeilen: ZEILEN, stile: STILE });
});
const odsStile = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.odsLesen(puffer.buffer);
  const st = blaetter[0]?.stile || [];
  return { a2: st[1]?.[0] || null, b2: st[1]?.[1] || null, c2: st[1]?.[2] || null };
}, fs.readFileSync(odsPfad).toString('base64'));
p('A2 kommt kursiv zurück', !!(odsStile as any).a2?.kursiv, JSON.stringify((odsStile as any).a2));
gleich('B2 kommt als Prozent zurück', (odsStile as any).b2?.format?.art, 'prozent');
p('C2 kommt fett, rechts und als CHF zurück',
  !!(odsStile as any).c2?.fett &&
  (odsStile as any).c2?.ausrichtung === 'rechts' &&
  (odsStile as any).c2?.format?.art === 'waehrung' &&
  (odsStile as any).c2?.format?.waehrung === 'CHF',
  JSON.stringify((odsStile as any).c2));

console.log('\n3 · Mehrblatt durch den ECHTEN Wähler: die Zellen tragen den Stil');

const mehrPfad = await runterladen(async () => {
  await seite.evaluate((arg: any) => {
    (Austausch as any).alsOds([
      { name: 'Nord', zeilen: arg.zeilen, stile: arg.stile },
      { name: 'Süd',  zeilen: [['Ort'], ['Chur']], stile: [[null], [{ fett: true }]] }
    ], 'Mehr');
  }, { zeilen: ZEILEN, stile: STILE });
});
const mehrOds = path.join(os.tmpdir(), 'redion-test171-Mehr.ods');
fs.copyFileSync(mehrPfad, mehrOds);

const blk1 = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Herein' });
  const b = Store.addBlock(s.id, 'spreadsheet', { text: 'Ziel' });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-mehr';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(b.id)));
  await new Promise(r => setTimeout(r, 300));
  ([...kasten.querySelectorAll<HTMLElement>('button')]
    .find(k => (k.textContent || '').includes('⋯')))?.click();
  await new Promise(r => setTimeout(r, 300));
  ([...document.querySelectorAll<HTMLElement>('.menu button')]
    .find(k => /öffnen/i.test(k.textContent || '')))?.click();
  return b.id;
});
const eingang1 = seite.locator('input[type="file"][accept*="ods"]');
await eingang1.waitFor({ state: 'attached', timeout: 5000 });
await eingang1.setInputFiles(mehrOds);
const mehrKnopf = seite.locator('.overlay .wahl-knoepfe button[data-w="rein"]');
await mehrKnopf.waitFor({ state: 'visible', timeout: 8000 });
await mehrKnopf.click();
await seite.waitForTimeout(900);

const drin1 = await seite.evaluate((id: string) => {
  const m = (Store.getBlock(id) || {}).mappe || { blaetter: [] };
  const nord = m.blaetter.find((x: any) => x.name === 'Nord');
  const sued = m.blaetter.find((x: any) => x.name === 'Süd');
  return {
    b2Art: nord?.zellen?.['B2']?.stil?.format?.art,
    b2Wert: nord?.zellen?.['B2']?.wert,
    c2Fett: !!nord?.zellen?.['C2']?.stil?.fett,
    suedFett: !!sued?.zellen?.['A2']?.stil?.fett
  };
}, blk1);
gleich('Nord B2 trägt das Prozentformat', (drin1 as any).b2Art, 'prozent');
gleich('… und den Rohwert 0.15', (drin1 as any).b2Wert, 0.15);
p('Nord C2 ist fett', (drin1 as any).c2Fett);
p('Süd A2 ist fett — jedes Blatt trägt seine Stile', (drin1 as any).suedFett);

console.log('\n4 · Einzelblatt durch den ECHTEN Dialog: Stil am Schreibzeiger');

const einPfad = await runterladen(async () => {
  await seite.evaluate((arg: any) => {
    (Austausch as any).alsExcel([{ name: 'S', zeilen: arg.zeilen, stile: arg.stile }], 'Ein');
  }, { zeilen: ZEILEN, stile: STILE });
});
const einXlsx = path.join(os.tmpdir(), 'redion-test171-Ein.xlsx');
fs.copyFileSync(einPfad, einXlsx);

const blk2 = await seite.evaluate(async () => {
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
  const s = Store.addBlock(null, 'page', { text: 'Einzeln' });
  const b = Store.addBlock(s.id, 'spreadsheet', { text: 'Ziel2' });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-ein';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(b.id)));
  await new Promise(r => setTimeout(r, 300));
  ([...kasten.querySelectorAll<HTMLElement>('button')]
    .find(k => (k.textContent || '').includes('⋯')))?.click();
  await new Promise(r => setTimeout(r, 300));
  ([...document.querySelectorAll<HTMLElement>('.menu button')]
    .find(k => /öffnen/i.test(k.textContent || '')))?.click();
  return b.id;
});
const eingang2 = seite.locator('input[type="file"][accept*="ods"]');
await eingang2.waitFor({ state: 'attached', timeout: 5000 });
await eingang2.setInputFiles(einXlsx);

const a1Knopf = seite.locator('.overlay .wahl-knoepfe button[data-w="a1"]');
await a1Knopf.waitFor({ state: 'visible', timeout: 8000 });
await a1Knopf.click();
await seite.waitForTimeout(700);

const drin2 = await seite.evaluate((id: string) => {
  const m = (Store.getBlock(id) || {}).mappe || { blaetter: [] };
  const blatt = m.blaetter[0] || { zellen: {} };
  return {
    a2Kursiv: !!blatt.zellen?.['A2']?.stil?.kursiv,
    b2Art: blatt.zellen?.['B2']?.stil?.format?.art,
    c2Waehrung: blatt.zellen?.['C2']?.stil?.format?.waehrung
  };
}, blk2);
p('A2 ist kursiv', (drin2 as any).a2Kursiv);
gleich('B2 trägt das Prozentformat', (drin2 as any).b2Art, 'prozent');
gleich('C2 trägt die Währung CHF', (drin2 as any).c2Waehrung, 'CHF');

console.log('\n5 · Der Quelltext trägt die Stile auf beiden Wegen an');
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/spreadsheet/ansicht.ts'), 'utf8');
/* Zwei AUFRUFE — die Arrow-Definition selbst zählt nicht mit. */
gleich('stilDazu läuft im Mehrblatt-Zweig UND am Schreibzeiger',
  (quelle.match(/stilDazu\(/g) || []).length, 2);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

fs.rmSync(mehrOds, { force: true });
fs.rmSync(einXlsx, { force: true });
await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
