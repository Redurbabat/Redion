/* Suite 139 — XLSX/ODS: Beziehungen, Formeln und ehrlicher Verlustbericht (P6)
 *
 * Die Fremdmappe ordnet Namen absichtlich NICHT nach sheet1, sheet2 zu.
 * Kommentare, Regel, Bild, Diagramm, Makro, Füllung und verbundene Zelle
 * müssen vor der Mutation einzeln im Bericht stehen. Abbrechen bleibt leer.
 *
 *   node pruefungen/lauf/test-p6-tabellenformate.mts
 */
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
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
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (name: string, gut: unknown, extra = '') => {
  if (gut) { ok++; console.log('  ✓ ' + name); }
  else { weg++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown) =>
  p(name, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const kontext = await browser.newContext({ acceptDownloads: true });
const seite = await kontext.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

const fremdB64 = await seite.evaluate(async () => {
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  const dateien = [
    { name: 'xl/workbook.xml', inhalt:
      `<?xml version="1.0"?><workbook ${ns} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
      '<sheet name="Erstes" sheetId="1" r:id="rIdB"/>' +
      '<sheet name="Zweites" sheetId="2" r:id="rIdA"/>' +
      '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', inhalt:
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdA" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet9.xml"/>' +
      '<Relationship Id="rIdB" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/daten.xml"/>' +
      '</Relationships>' },
    { name: 'xl/styles.xml', inhalt:
      `<?xml version="1.0"?><styleSheet ${ns}>` +
      '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/></patternFill></fill></fills>' +
      '<borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>' +
      '<cellXfs count="2"><xf xfId="0"/><xf xfId="0" fillId="1" applyFill="1"/></cellXfs></styleSheet>' },
    { name: 'xl/worksheets/daten.xml', inhalt:
      `<?xml version="1.0"?><worksheet ${ns}><sheetData>` +
      '<row r="1"><c r="A1" t="inlineStr"><is><t>RICHTIG-ERSTES</t></is></c>' +
      '<c r="B1"><f>A2+1</f><v>8</v></c><c r="C1" s="1"><v>4</v></c></row>' +
      '<row r="2"><c r="A2"><v>7</v></c></row></sheetData>' +
      '<mergeCells count="1"><mergeCell ref="D1:E1"/></mergeCells>' +
      '<conditionalFormatting sqref="A1"><cfRule type="cellIs" operator="greaterThan"><formula>0</formula></cfRule></conditionalFormatting>' +
      '</worksheet>' },
    { name: 'xl/worksheets/sheet9.xml', inhalt:
      `<?xml version="1.0"?><worksheet ${ns}><sheetData><row r="1">` +
      '<c r="A1" t="inlineStr"><is><t>RICHTIG-ZWEITES</t></is></c>' +
      '</row></sheetData></worksheet>' },
    { name: 'xl/comments1.xml', inhalt:
      `<?xml version="1.0"?><comments ${ns}><authors><author>A</author></authors><commentList>` +
      '<comment ref="A1" authorId="0"><text><t>Hinweis</t></text></comment>' +
      '</commentList></comments>' },
    { name: 'xl/charts/chart1.xml', inhalt: '<chart/>' },
    { name: 'xl/media/image1.png', inhalt: 'bild' },
    { name: 'xl/vbaProject.bin', inhalt: 'makro' }
  ];
  const blob = await (Austausch as any).zipSchreiben(dateien);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
});
const fremdPfad = path.join(os.tmpdir(), 'redion-p6-tabellenformate-fremd.xlsx');
fs.writeFileSync(fremdPfad, Buffer.from(fremdB64, 'base64'));

console.log('\n1 · Beziehungen statt Dateinamen-Reihenfolge');
const fremd = await seite.evaluate(async (b64: string) => {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const bl = await (Einlesen as any).xlsxLesen(bytes.buffer);
  return {
    namen: bl.map((x: any) => x.name),
    a1: bl.map((x: any) => x.zeilen?.[0]?.[0]),
    formel: bl[0]?.formeln?.[0]?.[1],
    wert: bl[0]?.zeilen?.[0]?.[1],
    bericht: bl.bericht,
    text: (Einlesen as any).tabellenBerichtText(bl.bericht)
  };
}, fremdB64);
gleich('Workbook-Reihenfolge und Namen bleiben gekoppelt', fremd.namen, ['Erstes', 'Zweites']);
gleich('Die Inhalte gehören zu den richtigen Namen', fremd.a1,
  ['RICHTIG-ERSTES', 'RICHTIG-ZWEITES']);
gleich('Die Formel wird mit führendem = gelesen', fremd.formel, '=A2+1');
gleich('Der gespeicherte Ergebniswert bleibt daneben erhalten', fremd.wert, '8');
p('Der Bericht zählt Formel und jede nicht unterstützte Kategorie',
  fremd.bericht.formeln === 1 && fremd.bericht.ausgelassen.kommentare === 1 &&
  fremd.bericht.ausgelassen.bedingteFormatierungen === 1 &&
  fremd.bericht.ausgelassen.bilder === 1 && fremd.bericht.ausgelassen.diagramme === 1 &&
  fremd.bericht.ausgelassen.makros === 1 && fremd.bericht.ausgelassen.zellformate === 1 &&
  fremd.bericht.ausgelassen.verbundeneZellen === 1, JSON.stringify(fremd.bericht));
p('Der Nutzertext nennt Übernahme und Verluste',
  /1 Formeln/.test(fremd.text) && /Zellkommentare/.test(fremd.text) &&
  /bedingte Formatierungen/.test(fremd.text) && /Bilder/.test(fremd.text) &&
  /Diagramme/.test(fremd.text) && /Makros/.test(fremd.text), fremd.text);

console.log('\n2 · Eigene XLSX- und ODS-Formeln machen den Rundweg');
const [xlsxDownload] = await Promise.all([
  seite.waitForEvent('download'),
  seite.evaluate(() => (Austausch as any).alsExcel([{
    name: 'Formeln', zeilen: [[2], [3], [5]],
    formeln: [[null], [null], ['=SUMME(A1:A2)']], stile: [[], [], []]
  }], 'Formel-XLSX'))
]);
const [odsDownload] = await Promise.all([
  seite.waitForEvent('download'),
  seite.evaluate(() => (Austausch as any).alsOds([{
    name: 'Formeln', zeilen: [[2], [3], [5]],
    formeln: [[null], [null], ['=SUMME(A1:A2)']], stile: [[], [], []]
  }], 'Formel-ODS'))
]);
const xlsxB64 = fs.readFileSync((await xlsxDownload.path())!).toString('base64');
const odsB64 = fs.readFileSync((await odsDownload.path())!).toString('base64');
const rund = await seite.evaluate(async ({ x, o }) => {
  const puffer = (b: string) => {
    const bin = atob(b); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  };
  const xb = await (Einlesen as any).xlsxLesen(puffer(x));
  const ob = await (Einlesen as any).odsLesen(puffer(o));
  return {
    xf: xb[0]?.formeln?.[2]?.[0], xw: xb[0]?.zeilen?.[2]?.[0],
    of: ob[0]?.formeln?.[2]?.[0], ow: ob[0]?.zeilen?.[2]?.[0]
  };
}, { x: xlsxB64, o: odsB64 });
gleich('XLSX bringt die Formel semantisch zurück', rund.xf, '=SUM(A1:A2)');
gleich('XLSX behält den Ergebniswert', rund.xw, '5');
gleich('ODS bringt die Formel semantisch zurück', rund.of, '=SUM(A1:A2)');
gleich('ODS behält den Ergebniswert als Zahl', rund.ow, 5);

console.log('\n3 · Echter Dateiwähler: Bericht vor Mutation, Abbrechen bleibt unverändert');
const ziel = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Importbericht' });
  const b = Store.addBlock(s.id, 'spreadsheet', { text: 'Ziel' });
  const kasten = document.createElement('div'); kasten.id = 'test-p6-tabellenformate-ziel';
  document.body.appendChild(kasten);
  kasten.appendChild((window as any).SpreadsheetView.zeichne(Store.getBlock(b.id)));
  await new Promise(r => setTimeout(r, 250));
  const oeffnen = () => {
    ([...kasten.querySelectorAll<HTMLElement>('button')]
      .find(k => (k.textContent || '').includes('⋯')))?.click();
    ([...document.querySelectorAll<HTMLElement>('.menu button')]
      .find(k => /öffnen/i.test(k.textContent || '')))?.click();
  };
  oeffnen();
  return b.id;
});
let input = seite.locator('input[type="file"][accept*="xlsx"]');
await input.waitFor({ state: 'attached' });
await input.setInputFiles(fremdPfad);
const berichtText = await seite.locator('.overlay .finder').innerText();
p('Der echte Dialog nennt die Verluste vor der Übernahme',
  /Zellkommentare/.test(berichtText) && /bedingte Formatierungen/.test(berichtText) &&
  /Bilder/.test(berichtText) && /Diagramme/.test(berichtText), berichtText);
await seite.locator('.overlay .wahl-knoepfe button[data-w=""]').click();
const nachAbbruch = await seite.evaluate((id: string) => Store.getBlock(id).mappe.blaetter.length, ziel);
gleich('Abbrechen lässt die Mappe unverändert', nachAbbruch, 1);

await seite.evaluate(() => {
  const kasten = document.getElementById('test-p6-tabellenformate-ziel')!;
  ([...kasten.querySelectorAll<HTMLElement>('button')]
    .find(k => (k.textContent || '').includes('⋯')))?.click();
  ([...document.querySelectorAll<HTMLElement>('.menu button')]
    .find(k => /öffnen/i.test(k.textContent || '')))?.click();
});
input = seite.locator('input[type="file"][accept*="xlsx"]');
await input.waitFor({ state: 'attached' });
await input.setInputFiles(fremdPfad);
await seite.locator('.overlay .wahl-knoepfe button[data-w="rein"]').click();
await seite.waitForTimeout(600);
const drin = await seite.evaluate((id: string) => {
  const m = Store.getBlock(id).mappe;
  const e = m.blaetter.find((b: any) => b.name === 'Erstes');
  const z = m.blaetter.find((b: any) => b.name === 'Zweites');
  return {
    namen: m.blaetter.map((b: any) => b.name),
    erstes: e?.zellen?.A1?.wert,
    zweites: z?.zellen?.A1?.wert,
    formel: e?.zellen?.B1?.formel
  };
}, ziel);
p('Bestätigen legt beide Blätter an', drin.namen.includes('Erstes') && drin.namen.includes('Zweites'),
  JSON.stringify(drin.namen));
gleich('Relationship-Inhalt bleibt am ersten Blatt', drin.erstes, 'RICHTIG-ERSTES');
gleich('Relationship-Inhalt bleibt am zweiten Blatt', drin.zweites, 'RICHTIG-ZWEITES');
gleich('Die Formel landet im echten Zellmodell', drin.formel, '=A2+1');

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
