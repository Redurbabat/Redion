/* Suite 135 — ODS-Export mit Zellformat: Zahlen bleiben Zahlen (L18/E95)
 * ============================================================================
 * Das Zwillingsstück zu E94: der ODS-Ausgang des Tabellenblocks schrieb den
 * ANZEIGETEXT — „15 %" wurde in LibreOffice Text, jede grosse Zahl kam mit
 * Tausenderzeichen als Text an, und fett/kursiv/Ausrichtung verschwanden.
 *
 * Seit E95 gehen Rohwerte hinaus (office:value="0.15") samt Zellstilen in
 * den automatic-styles von content.xml: Prozent- und Währungs-Zahlenstile
 * (number:percentage-style, number:currency-style), Schrift (fo:font-weight,
 * fo:font-style) und Ausrichtung (fo:text-align). Geprüft an den echten
 * Bytes des Downloads und über die Rundreise mit dem eigenen Leser.
 *
 *   node pruefungen/lauf/test169.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8895;

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

console.log('\n1 · Der ODS-Export: Rohwerte und Stile, bis zum echten Download');

await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'ODS-Formatprobe' });
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Kosten' });
  const K = (window as any).Spreadsheet;
  const mappe = K.neueMappe('Kosten');
  const b1 = mappe.blaetter[0];
  b1.name = 'Blatt';
  K.setze(b1, 'A1', 'Posten');  K.setze(b1, 'B1', 'Anteil'); K.setze(b1, 'C1', 'Betrag');
  K.setze(b1, 'A2', 'Miete');   K.setze(b1, 'B2', '0.15');   K.setze(b1, 'C2', '1450.5');
  b1.zellen['A2'].stil = { kursiv: true };
  b1.zellen['B2'].stil = { format: { art: 'prozent' } };
  b1.zellen['C2'].stil = { fett: true, format: { art: 'waehrung', waehrung: 'CHF' },
                           ausrichtung: 'rechts' };
  K.rechneMappe(mappe);
  Store.updateBlock(blk.id, { mappe });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-odsformat';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));
});

const [runter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(async () => {
    const kasten = document.getElementById('pruef-odsformat')!;
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
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });

const b64 = fs.readFileSync(pfadRunter!).toString('base64');
const inhalt = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const zip = await (window as any).Einlesen.zipLesen(puffer.buffer);
  return await zip.text('content.xml');
}, b64) as string;

p('B2 trägt den ROHWERT 0.15', /office:value="0\.15"/.test(inhalt));
p('C2 trägt den ROHWERT 1450.5', /office:value="1450\.5"/.test(inhalt));
p('Ein Prozent-Zahlenstil steht drin', /number:percentage-style/.test(inhalt));
p('Der Währungsstil nennt CHF',
  /number:currency-symbol[^>]*>CHF</.test(inhalt));
p('Eine kursive Schrift steht drin', /fo:font-style="italic"/.test(inhalt));
p('Eine fette Schrift steht drin', /fo:font-weight="bold"/.test(inhalt));
p('Die Ausrichtung rechts steht drin', /fo:text-align="end"/.test(inhalt));
p('Formatzellen verweisen auf ihren Stil', /table:table-cell table:style-name="/.test(inhalt));

console.log('\n2 · Die Rundreise bringt die ZAHL zurück, nicht den Anzeigetext');

const gelesen = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.odsLesen(puffer.buffer);
  return {
    b2: blaetter[0]?.zeilen?.[1]?.[1],
    c2: blaetter[0]?.zeilen?.[1]?.[2],
    a2: blaetter[0]?.zeilen?.[1]?.[0]
  };
}, b64);
gleich('B2 kommt als Zahl 0.15 zurück (vorher: der Text „15 %")', (gelesen as any).b2, 0.15);
gleich('C2 kommt als Zahl 1450.5 zurück', (gelesen as any).c2, 1450.5);
gleich('A2 bleibt Text', (gelesen as any).a2, 'Miete');

console.log('\n3 · Ein Ausgang OHNE Stile bleibt der alte');

const [alt] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(() => {
    (Austausch as any).alsOds([{ name: 'Alt', zeilen: [['Kopf', 'Zahl'], ['a', 2]] }], 'Alt');
  })
]);
const altInhalt = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const zip = await (window as any).Einlesen.zipLesen(puffer.buffer);
  return await zip.text('content.xml');
}, fs.readFileSync((await alt.path())!).toString('base64')) as string;
p('Keine Stilverweise ohne Stile', !/table:style-name=/.test(altInhalt));
p('Die Zahl bleibt trotzdem Zahl', /office:value="2"/.test(altInhalt));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
