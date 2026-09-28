/* Suite 133 — ODS am Tabellenblock: ganze Mappe hinaus, jedes Blatt herein (L18/E93)
 * ============================================================================
 * Schreiber (`alsOds`) und Leser (`odsLesen`) konnten Mehrblatt längst —
 * nur der Tabellenblock kannte beide nicht: kein Menüeintrag zum Speichern,
 * und die Öffnen-Weiche liess .ods gar nicht erst zu. Wer ohne Excel-Lizenz
 * arbeitet (LibreOffice, Schulen, Verwaltungen), hatte am Block nur CSV.
 *
 * Geprüft mit ECHTEN BYTES und dem ECHTEN WEG: der Export läuft bis zum
 * Browser-Download, der Import über den wirklichen Dateiwähler des Blocks
 * (setInputFiles auf das echte <input>), nicht über nachgebaute Logik.
 *
 *   node pruefungen/lauf/test167.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8887;

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

const alsBase64 = (pfad: string): string => fs.readFileSync(pfad).toString('base64');

console.log('\n1 · Der ODS-Export trägt ALLE Blätter — bis zum echten Download');

await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'ODS-Probe' });
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Bericht' });
  const K = (window as any).Spreadsheet;
  const mappe = K.neueMappe('Bericht');
  const b1 = mappe.blaetter[0];
  b1.name = 'Januar';
  K.setze(b1, 'A1', 'Posten'); K.setze(b1, 'B1', 'Betrag');
  K.setze(b1, 'A2', 'Miete');  K.setze(b1, 'B2', '250');
  const b2 = K.neuesBlatt('Februar');
  K.setze(b2, 'A1', 'Posten'); K.setze(b2, 'B1', 'Betrag');
  K.setze(b2, 'A2', 'Strom');  K.setze(b2, 'B2', '90');
  mappe.blaetter.push(b2);
  K.rechneMappe(mappe);
  Store.updateBlock(blk.id, { mappe });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-ods';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));
});

const [runter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(async () => {
    const kasten = document.getElementById('pruef-ods')!;
    ([...kasten.querySelectorAll<HTMLElement>('button')]
      .find(k => (k.textContent || '').includes('⋯')))?.click();
    await new Promise(r => setTimeout(r, 300));
    ([...document.querySelectorAll<HTMLElement>('.menu button')]
      .find(k => /opendocument/i.test(k.textContent || '') &&
                 /speichern/i.test(k.textContent || '')))?.click();
  })
]);
const pfadRunter = await runter.path();
p('Die Datei kam als echter Download', !!pfadRunter, runter.suggestedFilename());
p('… mit der Endung .ods', /\.ods$/.test(runter.suggestedFilename()),
  runter.suggestedFilename());

const gelesen = await seite.evaluate(async (b64: string) => {
  const roh = atob(b64);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.odsLesen(puffer.buffer);
  return {
    zahl: blaetter.length,
    namen: blaetter.map((g: any) => g.name),
    janB2: blaetter[0]?.zeilen?.[1]?.[1],
    febA2: blaetter[1]?.zeilen?.[1]?.[0]
  };
}, alsBase64(pfadRunter!));
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });
gleich('Die Datei trägt BEIDE Blätter', (gelesen as any).zahl, 2);
p('… mit ihren Namen',
  JSON.stringify((gelesen as any).namen) === JSON.stringify(['Januar', 'Februar']),
  JSON.stringify((gelesen as any).namen));
gleich('Januar B2 ist die ZAHL 250 (office:value, nicht Text)', (gelesen as any).janB2, 250);
gleich('Februar A2 steht drin', (gelesen as any).febA2, 'Strom');

console.log('\n2 · Der Import geht durch den ECHTEN Dateiwähler des Blocks');

/* Eine mehrblättrige Probedatei aus dem eigenen Schreiber. */
const [probe] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(() => {
    (Austausch as any).alsOds([
      { name: 'Nord', zeilen: [['Ort', 'Wert'], ['Kiel', 7]] },
      { name: 'Süd',  zeilen: [['Ort', 'Wert'], ['Chur', 9]] }
    ], 'Probe');
  })
]);
/* Der Temppfad des Downloads hat KEINE Endung — die Öffnen-Weiche prüft
   aber den Dateinamen. Also unter echtem Namen bereitlegen. */
const probeOds = path.join(os.tmpdir(), 'redion-test167-Probe.ods');
fs.copyFileSync((await probe.path())!, probeOds);

const blk2 = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Herein' });
  const b = Store.addBlock(s.id, 'spreadsheet', { text: 'Ziel' });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-herein';
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

const eingang = seite.locator('input[type="file"][accept*="ods"]');
await eingang.waitFor({ state: 'attached', timeout: 5000 });
await eingang.setInputFiles(probeOds);
const mehrKnopf = seite.locator('.overlay button[data-w="rein"]');
await mehrKnopf.waitFor({ state: 'visible', timeout: 8000 });
await mehrKnopf.click();
await seite.waitForTimeout(900);

const herein = await seite.evaluate((id: string) => {
  const m = (Store.getBlock(id) || {}).mappe || { blaetter: [] };
  const nord = m.blaetter.find((x: any) => x.name === 'Nord');
  const sued = m.blaetter.find((x: any) => x.name === 'Süd');
  return {
    namen: m.blaetter.map((x: any) => x.name),
    nordB2: (nord?.zellen?.['B2'] || {}).wert,
    suedA2: (sued?.zellen?.['A2'] || {}).wert,
    toast: (document.getElementById('toast') || {}).textContent || ''
  };
}, blk2);
p('Die Mappe trägt Nord und Süd',
  ((herein as any).namen || []).includes('Nord') && ((herein as any).namen || []).includes('Süd'),
  JSON.stringify((herein as any).namen));
gleich('Nord B2 ist die Zahl 7', (herein as any).nordB2, 7);
gleich('Süd A2 ist „Chur"', (herein as any).suedA2, 'Chur');
p('Der Hinweis nennt die Blattzahl', /2 Blätter aus/.test((herein as any).toast),
  (herein as any).toast);

console.log('\n3 · Der Quelltext geht den ODS-Weg wirklich');
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/spreadsheet/ansicht.ts'), 'utf8');
p('Der Speichern-Eintrag steht im Block-Menü', quelle.includes('data-a="ods"'));
p('Der Export übergibt die ganze Mappe',
  quelle.includes('Austausch.alsOds(block.mappe.blaetter.map'));
p('Die Öffnen-Weiche kennt .ods',
  quelle.includes('.xlsm,.ods') && quelle.includes('odsLesen'));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

fs.rmSync(probeOds, { force: true });
await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
