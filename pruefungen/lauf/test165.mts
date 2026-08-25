/* Suite 129 — Excel-Mehrblatt: die ganze Mappe raus, jedes Blatt herein (L18/E91)
 * ============================================================================
 * Der Excel-SCHREIBER konnte Mehrblatt von Anfang an — aber der Aufrufer
 * gab ihm nur das aktive Blatt: eine Mappe mit drei Blättern kam als eines
 * heraus, und niemand sagte es (§13: Export darf nicht Daten verschweigen).
 * Der Import nahm nur Blatt 1, mit einem Satz begründet, der Mehrblatt je
 * Block verneinte — während die Blattreiter darunter es längst konnten.
 *
 * Geprüft wird mit ECHTEN BYTES: der Export läuft bis zum echten
 * Browser-Download (Playwright fängt die Datei), gelesen wird mit dem
 * echten Leser — die Rundreise Mappe → .xlsx → Mappe trägt alle Blätter.
 *
 *   node pruefungen/lauf/test165.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8872;

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

/* Bytes aus einem Download in die Seite zurücktragen: als Base64. */
const alsBase64 = (pfad: string): string => fs.readFileSync(pfad).toString('base64');

console.log('\n1 · Der Export trägt ALLE Blätter — bis zum echten Download');

await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Mehrblatt' });
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Bericht' });
  const K = (window as any).Spreadsheet;
  const mappe = K.neueMappe('Bericht');
  const b1 = mappe.blaetter[0];
  b1.name = 'Januar';
  K.setze(b1, 'A1', 'Posten'); K.setze(b1, 'B1', 'Betrag');
  K.setze(b1, 'A2', 'Miete');  K.setze(b1, 'B2', '1450');
  const b2 = K.neuesBlatt('Februar');
  K.setze(b2, 'A1', 'Posten'); K.setze(b2, 'B1', 'Betrag');
  K.setze(b2, 'A2', 'Strom');  K.setze(b2, 'B2', '89.5');
  mappe.blaetter.push(b2);
  K.rechneMappe(mappe);
  Store.updateBlock(blk.id, { mappe });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-mehrblatt';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));
  return blk.id;
});

const [runter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(async () => {
    /* Nur der Menü-Weg: „Als Excel SPEICHERN". Ein blosses /excel/i
       fände zuerst „Excel oder CSV ÖFFNEN" — und öffnete den
       Dateidialog statt des Downloads. */
    const kasten = document.getElementById('pruef-mehrblatt')!;
    ([...kasten.querySelectorAll<HTMLElement>('button')]
      .find(k => (k.textContent || '').includes('⋯')))?.click();
    await new Promise(r => setTimeout(r, 300));
    ([...document.querySelectorAll<HTMLElement>('.menu button')]
      .find(k => /excel/i.test(k.textContent || '') &&
                 /speichern/i.test(k.textContent || '')))?.click();
  })
]);
const pfadRunter = await runter.path();
p('Die Datei kam als echter Download', !!pfadRunter, runter.suggestedFilename());

const gelesen1 = await seite.evaluate(async (b64: string) => {
  const roh = atob(b64);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.xlsxLesen(puffer.buffer);
  return {
    zahl: blaetter.length,
    namen: blaetter.map((g: any) => g.name),
    janB2: String(blaetter[0]?.zeilen?.[1]?.[1] ?? ''),
    febA2: String(blaetter[1]?.zeilen?.[1]?.[0] ?? '')
  };
}, alsBase64(pfadRunter!));
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });
gleich('Die Datei trägt BEIDE Blätter', (gelesen1 as any).zahl, 2);
p('… mit ihren Namen',
  JSON.stringify((gelesen1 as any).namen) === JSON.stringify(['Januar', 'Februar']),
  JSON.stringify((gelesen1 as any).namen));
p('Januar B2 steht drin', (gelesen1 as any).janB2.replace(/['’]/g, '') === '1450',
  (gelesen1 as any).janB2);
gleich('Februar A2 steht drin', (gelesen1 as any).febA2, 'Strom');

console.log('\n2 · Der Import legt je Blatt ein eigenes an');

/* Eine mehrblättrige Datei aus dem eigenen Schreiber — wieder als
   echter Download gefangen. */
const [probe] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(() => {
    (Austausch as any).alsExcel([
      { name: 'Nord', zeilen: [['Ort', 'Wert'], ['Kiel', '7']] },
      { name: 'Süd',  zeilen: [['Ort', 'Wert'], ['Chur', '9']] }
    ], 'Probe');
  })
]);
const pfadProbe = await probe.path();
p('Auch die Probedatei kam als Download', !!pfadProbe, probe.suggestedFilename());

const herein = await seite.evaluate(async (b64: string) => {
  const roh = atob(b64);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const gelesen = await (window as any).Einlesen.xlsxLesen(puffer.buffer);

  const s2 = Store.addBlock(null, 'page', { text: 'Herein' });
  const blk2 = Store.addBlock(s2.id, 'spreadsheet', { text: 'Ziel' });
  const K = (window as any).Spreadsheet;
  const R = (window as any).CellRefs;
  const b = Store.getBlock(blk2.id);
  if (!b.mappe) b.mappe = K.neueMappe('Ziel');
  gelesen.forEach((g: any) => {
    const neu = K.neuesBlatt(String(g.name || 'Blatt'));
    (g.zeilen || []).forEach((zeileWerte: string[], z: number) =>
      zeileWerte.forEach((wert: string, sp: number) => {
        if (wert !== '') K.setze(neu, R.schreibe(z, sp), wert);
      }));
    b.mappe.blaetter.push(neu);
  });
  K.rechneMappe(b.mappe);
  Store.updateBlock(b.id, { mappe: b.mappe });
  const m = Store.getBlock(blk2.id).mappe;
  return {
    blaetter: m.blaetter.map((x: any) => x.name),
    nordB2: (m.blaetter.find((x: any) => x.name === 'Nord')?.zellen['B2'] || {}).wert,
    suedA2: (m.blaetter.find((x: any) => x.name === 'Süd')?.zellen['A2'] || {}).wert
  };
}, alsBase64(pfadProbe!));
p('Die Mappe trägt Nord und Süd',
  ((herein as any).blaetter || []).includes('Nord') && ((herein as any).blaetter || []).includes('Süd'),
  JSON.stringify((herein as any).blaetter));
gleich('Nord B2 ist die Zahl 7', (herein as any).nordB2, 7);
gleich('Süd A2 ist „Chur"', (herein as any).suedA2, 'Chur');

/* Und der Quelltext geht den Mehrblatt-Weg wirklich. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/spreadsheet/ansicht.ts'), 'utf8');
/* Der Zeuge muss EINDEUTIG zum Import-Zweig gehören — `K.neuesBlatt(
   freierName(` steht auch am „Neues Blatt"-Reiter und bezeugte nichts. */
p('Der Import-Zweig für mehrere Blätter steht im Quelltext',
  quelle.includes('blaetter.length > 1') &&
  quelle.includes('Blätter aus „'));
p('Der Export übergibt die ganze Mappe, nicht das aktive Blatt',
  quelle.includes('block.mappe.blaetter.map((b: any, i: number)'));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
