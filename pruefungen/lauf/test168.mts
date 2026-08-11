/* Suite 134 — Excel-Export mit Zellformat: Zahlen bleiben Zahlen (L18/E94)
 * ============================================================================
 * Bis E94 exportierte der Tabellenblock jede Zelle als ANZEIGETEXT. Drei
 * stille Folgen in Excel/LibreOffice:
 *
 *   0.15 als „15 %"        → Text, keine Zahl — Summen ergeben 0
 *   1450.5 als „1'450.5"   → das Tausender-Zeichen macht JEDE grosse
 *                             Zahl zu Text, auch ohne Format
 *   fett/kursiv/Ausrichtung → verschwanden ersatzlos
 *
 * Seit E94 gehen Rohwerte hinaus (0.15 als <v>0.15</v>) samt Zahlenformat
 * (0%, CHF) und Schrift (fett/kursiv) in einer dynamischen styles.xml.
 * Geprüft an den ECHTEN BYTES des Downloads: das Archiv wird entpackt und
 * die XML gelesen — und die Rundreise über den eigenen Leser bringt die
 * ZAHL zurück, nicht den Text.
 *
 *   node pruefungen/lauf/test168.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8893;

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

console.log('\n1 · Der Export: Rohwerte und Formate, bis zum echten Download');

await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Formatprobe' });
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
  kasten.id = 'pruef-format';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));
});

const [runter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(async () => {
    const kasten = document.getElementById('pruef-format')!;
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
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });

const b64 = fs.readFileSync(pfadRunter!).toString('base64');
const drin = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const zip = await (window as any).Einlesen.zipLesen(puffer.buffer);
  return {
    blatt: await zip.text('xl/worksheets/sheet1.xml'),
    stile: await zip.text('xl/styles.xml')
  };
}, b64);
const blattX = (drin as any).blatt as string;
const stileX = (drin as any).stile as string;

/* Die zwei Zahlen stehen als ZAHLEN drin — mit Stilverweis, ohne inlineStr. */
const b2 = /<c r="B2"[^>]*>(.*?)<\/c>/.exec(blattX)?.[0] || '';
const c2 = /<c r="C2"[^>]*>(.*?)<\/c>/.exec(blattX)?.[0] || '';
p('B2 ist die Zahl 0.15, kein Text', /<v>0\.15<\/v>/.test(b2) && !/inlineStr/.test(b2), b2);
p('C2 ist die Zahl 1450.5, kein Text', /<v>1450\.5<\/v>/.test(c2) && !/inlineStr/.test(c2), c2);
p('B2 und C2 tragen einen Stilverweis', / s="\d+"/.test(b2) && / s="\d+"/.test(c2));

/* Und die styles.xml erklärt die Verweise. */
p('Ein Prozent-Zahlenformat steht drin', /%/.test(stileX), stileX.slice(0, 200));
p('Das Währungsformat nennt CHF', /CHF/.test(stileX));
p('Eine kursive Schrift steht drin', /<i\/>/.test(stileX));
p('Die Ausrichtung rechts steht drin', /horizontal="right"/.test(stileX));

console.log('\n2 · Die Rundreise bringt die ZAHL zurück, nicht den Anzeigetext');

const gelesen = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const blaetter = await (window as any).Einlesen.xlsxLesen(puffer.buffer);
  return {
    b2: blaetter[0]?.zeilen?.[1]?.[1],
    c2: blaetter[0]?.zeilen?.[1]?.[2],
    a2: blaetter[0]?.zeilen?.[1]?.[0]
  };
}, b64);
/* Der Leser gibt Zahlzellen als Ziffernfolge — vorher stand hier der
   ANZEIGETEXT „15 %" bzw. „1'450.5" aus einer inlineStr-Zelle. */
gleich('B2 kommt als 0.15 zurück (vorher: der Text „15 %")',
  String((gelesen as any).b2), '0.15');
gleich('C2 kommt als 1450.5 zurück (vorher: Text mit Tausender-Zeichen)',
  String((gelesen as any).c2), '1450.5');
gleich('A2 bleibt Text', (gelesen as any).a2, 'Miete');

console.log('\n3 · Blockzeile 1 ist Nutzerdaten — die Datenbank-Ausgänge behalten ihren Kopf');
/* Der Block erzwingt keinen fetten Textkopf mehr: seine erste Zeile sind
   gewöhnliche Zellen (vorher wurde sogar eine Zahl in Zeile 1 zu Text). */
p('Die erste Blockzeile wird nicht mehr zum Kopf gezwungen',
  /<c r="A1" t="inlineStr">/.test(blattX), (/<c r="A1"[^>]*>/.exec(blattX) || [''])[0]);
p('Die Kopfzeile bleibt beschriftet', /Posten/.test(blattX));

/* Ein Ausgang OHNE Stile (die Datenbanken) bleibt beim alten Verhalten:
   Zeile 1 fett als Text, zwei Schriften, keine Zahlenformate. */
const [alt] = await Promise.all([
  seite.waitForEvent('download', { timeout: 15000 }),
  seite.evaluate(() => {
    (Austausch as any).alsExcel([{ name: 'Alt', zeilen: [['Kopf', 'Zahl'], ['a', '2']] }], 'Alt');
  })
]);
const altB64 = fs.readFileSync((await alt.path())!).toString('base64');
const altDrin = await seite.evaluate(async (b: string) => {
  const roh = atob(b);
  const puffer = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) puffer[i] = roh.charCodeAt(i);
  const zip = await (window as any).Einlesen.zipLesen(puffer.buffer);
  return { blatt: await zip.text('xl/worksheets/sheet1.xml'),
           stile: await zip.text('xl/styles.xml') };
}, altB64);
p('Ihr Kopf bleibt fetter Text (s="1")',
  /<c r="A1" t="inlineStr" s="1">/.test((altDrin as any).blatt),
  (/<c r="A1"[^>]*>/.exec((altDrin as any).blatt) || [''])[0]);
p('Ihre styles.xml bleibt die alte: zwei Schriften, keine Formate',
  /<fonts count="2">/.test((altDrin as any).stile) && !/numFmt/.test((altDrin as any).stile));
p('Ihre Zahl bleibt Zahl', /<c r="B2"><v>2<\/v><\/c>/.test((altDrin as any).blatt));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
