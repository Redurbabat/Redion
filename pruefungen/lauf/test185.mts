/* Suite 151 — Was WIRKLICH im Archiv steht (E111)
 * ============================================================================
 * `test177` §5 prüft, welche Datei-Sätze die Sicherung mitnehmen WÜRDE — es
 * liest dieselbe gefilterte Liste, die `sicherungSpeichern` liest. Das ist
 * richtig und hat einen blinden Fleck: es prüft eine Absicht, kein Archiv.
 *
 * Dieser Lauf drückt den Knopf, fängt die heruntergeladene `.redion` ab und
 * liest sie in Node als ZIP — Eintrag für Eintrag, Byte für Byte. Damit
 * fällt auf, was zwischen Absicht und Datei passiert.
 *
 * UND GENAU DA LAG ETWAS. Das Manifest in `daten.json` schrieb
 *
 *     „Vollständig: die 4 Datei(en) liegen im Ordner „dateien" …"
 *     fehlt: []
 *
 * während zwei davon im Archiv fehlten: die gerasterten Seitenbilder, die
 * E103 bewusst weglässt. `exportVorbereiten` zählte `all('dateien')` und
 * wusste vom Filter nichts. CLAUDE.md §52.10 nennt genau das die
 * gefährlichste Sorte Sicherung — eine, die behauptet, vollständig zu sein.
 *
 * Kein Prüflauf konnte das sehen, weil keiner ins Archiv sah.
 *
 *   node pruefungen/lauf/test185.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8930;

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

/* --------------------------------------------------------------------------
 * Ein ZIP von Hand lesen.
 * --------------------------------------------------------------------------
 * ABSICHTLICH NICHT mit Redions eigenem `Austausch.zipLesen`. Ein Archiv mit
 * dem Werkzeug zu prüfen, das es geschrieben hat, prüft die beiden gegen
 * sich selbst: ein Fehler, den beide teilen, bleibt unsichtbar. Diese
 * fünfzig Zeilen lesen das zentrale Verzeichnis nach der ZIP-Festlegung.
 * ------------------------------------------------------------------------*/
type Eintrag = { name: string; roh: number; pack: number; methode: number; offset: number };

const zipEintraege = (buf: Buffer): Eintrag[] => {
  const aus: Eintrag[] = [];
  let ende = buf.length - 22;
  while (ende >= 0 && buf.readUInt32LE(ende) !== 0x06054b50) ende--;
  if (ende < 0) throw new Error('Kein ZIP-Ende gefunden.');
  let z = buf.readUInt32LE(ende + 16);
  const wieViele = buf.readUInt16LE(ende + 10);
  for (let i = 0; i < wieViele; i++) {
    if (buf.readUInt32LE(z) !== 0x02014b50) throw new Error('Kaputtes Verzeichnis.');
    const methode = buf.readUInt16LE(z + 10);
    const pack = buf.readUInt32LE(z + 20), roh = buf.readUInt32LE(z + 24);
    const nl = buf.readUInt16LE(z + 28), el = buf.readUInt16LE(z + 30),
          kl = buf.readUInt16LE(z + 32);
    aus.push({ name: buf.subarray(z + 46, z + 46 + nl).toString('utf8'),
               roh, pack, methode, offset: buf.readUInt32LE(z + 42) });
    z += 46 + nl + el + kl;
  }
  return aus;
};

const zipLies = (buf: Buffer, e: Eintrag): Buffer => {
  const nl = buf.readUInt16LE(e.offset + 26), el = buf.readUInt16LE(e.offset + 28);
  const von = e.offset + 30 + nl + el;
  const roh = buf.subarray(von, von + e.pack);
  return e.methode === 0 ? roh : zlib.inflateRawSync(roh);
};

/* Ein PDF von Hand */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const machPdf = (seiten: string[][]): Buffer => {
  const o: Buffer[] = [];
  const neu = (c: Buffer | string): number => {
    o.push(Buffer.isBuffer(c) ? c : Buffer.from(c, 'latin1')); return o.length; };
  const sn = neu('');
  const sch = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const zeilen of seiten) {
    const st: string[] = []; let y = 760;
    for (const z of zeilen) { st.push(`BT /F1 22 Tf 60 ${y} Td (${alsText(z)}) Tj ET`); y -= 40; }
    st.push('2 w 30 30 535 782 re S');
    const roh = Buffer.from(st.join('\n'), 'latin1');
    const inh = neu(Buffer.concat([
      Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
      `/Resources << /Font << /F1 ${sch} 0 R >> >> /Contents ${inh} 0 R >>`));
  }
  o[sn - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`, 'latin1');
  const w = neu(`<< /Type /Catalog /Pages ${sn} 0 R >>`);
  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stl: number[] = [];
  o.forEach((x, i) => { stl.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), x,
                         Buffer.from('\nendobj\n', 'latin1')]); });
  const xr = aus.length;
  let tab = `xref\n0 ${o.length + 1}\n0000000000 65535 f \n`;
  stl.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${o.length + 1} /Root ${w} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};

const PDF = machPdf([['Klausur', 'Aufgabe A'], ['Zweite Seite', 'Aufgabe B']]);
const PDF_SUMME = crypto.createHash('sha256').update(PDF).digest('hex');
const NOTIZ = Buffer.alloc(3000, 78);
const NOTIZ_SUMME = crypto.createHash('sha256').update(NOTIZ).digest('hex');

const browser = await chromium.launch();
const seite = await browser.newPage({ acceptDownloads: true });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1400, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Ein Skript und ein gewöhnlicher Anhang
 * ========================================================================*/
console.log('\n1 · Ein Skript und ein gewöhnlicher Anhang');

const sid = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Skript' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'klausur.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));
await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForFunction(() => Object.values(Store.cache.blocks || {})
  .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 2,
  null, { timeout: 90000 });

await seite.evaluate(async (s: string) => {
  const b = Store.addBlock(s, 'file', { text: 'notizen.txt' });
  await Dateien.ablegen(new File([new Uint8Array(3000).fill(78)], 'notizen.txt',
    { type: 'text/plain' }), { blockId: b.id });
}, sid);

const vorm = await seite.evaluate(async () => {
  const saetze = await Store.dateiAlle();
  return { gesamt: saetze.length,
           abgeleitet: saetze.filter((x: any) => x.abgeleitet).length };
});
gleich('Vier Dateien liegen in der Ablage', vorm.gesamt, 4);
gleich('Zwei davon sind abgeleitet', vorm.abgeleitet, 2);

/* ==========================================================================
 * §2 · Die echte Sicherung — durch den Knopf, nicht am Knopf vorbei
 * ========================================================================*/
console.log('\n2 · Die echte Sicherung — durch den Knopf, nicht am Knopf vorbei');

const [herunter] = await Promise.all([
  seite.waitForEvent('download', { timeout: 120000 }),
  seite.evaluate(() => { App.sicherungSpeichern(); }),
]);
const ziel = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'redion-zip-')),
                       'sicherung.redion');
await herunter.saveAs(ziel);
const archiv = fs.readFileSync(ziel);

p('Es heisst .redion', /\.redion$/.test(herunter.suggestedFilename()),
  herunter.suggestedFilename());
p('Und es ist ein ZIP', archiv.readUInt32LE(0) === 0x04034b50);

const eintraege = zipEintraege(archiv);
const namen = eintraege.map(e => e.name).sort();

p('`daten.json` liegt darin', namen.includes('daten.json'));
p('`dateien.json` auch', namen.includes('dateien.json'));
p('Das Original-PDF ist da', namen.includes('dateien/klausur.pdf'));
p('Der gewöhnliche Anhang auch', namen.includes('dateien/notizen.txt'));
p('Und KEIN Seitenbild',
  !namen.some(n => /\.webp$/.test(n)), namen.join(', '));
gleich('Genau vier Einträge', eintraege.length, 4);

/* ==========================================================================
 * §3 · Und die Bytes stimmen
 * ========================================================================*/
console.log('\n3 · Und die Bytes stimmen');

const holen = (name: string): Buffer | null => {
  const e = eintraege.find(x => x.name === name);
  return e ? zipLies(archiv, e) : null;
};

const pdfDrin = holen('dateien/klausur.pdf');
gleich('Das Original ist gleich gross', pdfDrin?.length, PDF.length);
gleich('Und Byte für Byte dasselbe',
  pdfDrin ? crypto.createHash('sha256').update(pdfDrin).digest('hex') : '(nichts)',
  PDF_SUMME);
const notizDrin = holen('dateien/notizen.txt');
gleich('Der Anhang ebenso',
  notizDrin ? crypto.createHash('sha256').update(notizDrin).digest('hex') : '(nichts)',
  NOTIZ_SUMME);

/* ==========================================================================
 * §4 · Das Manifest sagt die Wahrheit
 * --------------------------------------------------------------------------
 * DER PUNKT, DER DIESEN LAUF RECHTFERTIGT. Vorher stand hier
 * „Vollständig: die 4 Datei(en) liegen im Ordner dateien" bei zwei Dateien
 * im Archiv, und `fehlt: []`. Eine Sicherung, die nicht sagt, was sie
 * auslässt, ist die gefährlichste Sorte (§52.10) — man merkt es erst, wenn
 * man sie braucht.
 * ========================================================================*/
console.log('\n4 · Das Manifest sagt die Wahrheit');

const daten = JSON.parse(String(holen('daten.json')));
const dateienJson = JSON.parse(String(holen('dateien.json')));

const imArchiv = eintraege.filter(e => e.name.startsWith('dateien/')).length;
gleich('Zwei Dateien liegen wirklich im Archiv', imArchiv, 2);

const zahlImText = Number((String(daten.hinweis).match(/die (\d+) Datei/) || [])[1]);
gleich('Und der Hinweis nennt genau diese Zahl', zahlImText, imArchiv);

p('Er sagt ausserdem, was FEHLT',
  /nicht dabei/i.test(String(daten.hinweis)), String(daten.hinweis));
p('Und wie man es zurückbekommt',
  /zurückholen/i.test(String(daten.hinweis)));
gleich('Als Zahl, nicht nur als Satz', daten.abgeleitetAusgelassen, 2);

gleich('`dateien.json` nennt genauso viele Sätze',
  dateienJson.saetze.length, imArchiv);
p('Und keinen abgeleiteten',
  !dateienJson.saetze.some((s: any) => s.abgeleitet),
  dateienJson.saetze.map((s: any) => s.name).join(', '));

/* Jeder Satz in `dateien.json` muss auch wirklich als Datei dasein — sonst
   sucht ein Block beim Einspielen einen Anhang, den es nicht gibt. */
const fehlendeBytes = dateienJson.saetze.filter((s: any) =>
  !eintraege.some(e => dateienJson.zuordnung[e.name] === s.id));
gleich('Zu jedem Satz gibt es Bytes im Archiv', fehlendeBytes.length, 0,
  );

/* Und umgekehrt: keine Datei ohne Satz. */
const ohneSatz = eintraege.filter(e => e.name.startsWith('dateien/'))
  .filter(e => !dateienJson.zuordnung[e.name]);
gleich('Und zu jeder Datei einen Satz', ohneSatz.length, 0);

/* ==========================================================================
 * §5 · Was gebraucht wird, um die Bilder zurückzuholen, ist da
 * ========================================================================*/
console.log('\n5 · Was gebraucht wird, um die Bilder zurückzuholen, ist da');

const seitenImArchiv = Object.values(daten.blocks || {})
  .filter((b: any) => b.type === 'pdfseite');

gleich('Zwei Seitenblöcke', seitenImArchiv.length, 2);
p('Jede kennt ihr Original',
  seitenImArchiv.every((b: any) => !!b.quelleId));
p('Und das Original liegt im Archiv',
  seitenImArchiv.every((b: any) =>
    dateienJson.saetze.some((s: any) => s.id === b.quelleId)));
p('Jede kennt ihre Nummer und ihre Masse',
  seitenImArchiv.every((b: any) => b.nr && b.bw && b.bh));
p('Und ihren Text — sonst wäre die Sicherung stumm (E107)',
  seitenImArchiv.every((b: any) => String(b.suchtext || '').length > 5));

/* GEGENPROBE: die Prüfung sieht wirklich ins Archiv und nicht in die App. */
p('Gegenprobe: dieselben Blöcke stehen NICHT mit ihrem Bild darin',
  seitenImArchiv.every((b: any) =>
    !eintraege.some(e => dateienJson.zuordnung[e.name] === b.bildDateiId)));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
fs.rmSync(path.dirname(ziel), { recursive: true, force: true });
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
