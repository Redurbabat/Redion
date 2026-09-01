/* Suite 338 — Bilder kommen in der .docx an (L72 Rest, E346)
 * ============================================================================
 * L72 nannte den letzten Verlust und gleich den Weg:
 *
 *     „Bilder bleiben Platzhaltertext. Dafür bräuchte es Medienteile und
 *      Beziehungen im Archiv (`word/media/`, `document.xml.rels`), also
 *      denselben Umbau wie bei .pptx — machbar mit dem vorhandenen
 *      ZIP-Schreiber, aber ein eigener Bogen."
 *
 * Ein Export, der Bilder verschweigt, ist §13. Der Platzhalter war ehrlich —
 * aber eine Seite mit einem Schaltplan kam als leeres Blatt beim Lehrer an.
 *
 *   §1 DAS BILD IST WIRKLICH IM ARCHIV — Byte für Byte dasselbe.
 *   §2 UND DAS DOKUMENT ZEIGT DARAUF. Ein Medienteil ohne Beziehung ist
 *      totes Gewicht; eine Beziehung ins Leere macht Word wütend.
 *   §3 DIE ENDUNG STEHT IN DEN CONTENT-TYPES — je Endung EINMAL.
 *   §4 ZWEI BILDER BEKOMMEN ZWEI BEZIEHUNGEN, in der Reihenfolge der Blöcke.
 *   §5 WAS NICHT MITKANN, SAGT WARUM (§35) — und legt keinen Medienteil an.
 *   §6 OHNE BILD KEIN MEDIENORDNER. Die Gegenprobe: ein Archiv, das immer
 *      einen leeren `word/media/` trägt, hat nichts bewiesen.
 *   §7 DAS MASS IST GERECHNET, NICHT GERATEN — und passt auf die Seite.
 *
 *   node pruefungen/lauf/test338.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9342;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);
await pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

/* Ein echtes PNG, im Browser gezeichnet — kein von Hand gebasteltes
   Byte-Feld. Was hier hinausgeht, muss auch wieder hereinkommen. */
const bauePng = (breite: number, hoehe: number, farbe: string) => pc.evaluate(
  async (d: any) => {
    const c = document.createElement('canvas');
    c.width = d.b; c.height = d.h;
    const g = c.getContext('2d')!;
    g.fillStyle = d.f; g.fillRect(0, 0, d.b, d.h);
    g.fillStyle = '#000'; g.fillRect(2, 2, 6, 6);
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (const x of bytes) bin += String.fromCharCode(x);
    return { url: 'data:image/png;base64,' + btoa(bin), laenge: bytes.length };
  }, { b: breite, h: hoehe, f: farbe });

/** Eine Seite bauen, als Word ausgeben, das Archiv aufmachen. */
const wordAus = (bloecke: any[]) => pc.evaluate(async (bl: any[]) => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Bilderseite' });
  for (const b of bl) {
    const neu = Store.addBlock(seite.id, b.type, { text: b.text || '' });
    const zusatz: Record<string, unknown> = {};
    if (b.src) zusatz.src = b.src;
    if (b.caption) zusatz.caption = b.caption;
    if (b.name) zusatz.name = b.name;
    if (Object.keys(zusatz).length) Store.updateBlock(neu.id, zusatz);
  }
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const zip = await w.Einlesen.zipLesen(await blob.arrayBuffer());
  const medien: Record<string, number[]> = {};
  for (const n of zip.namen) {
    if (!/^word\/media\//.test(n)) continue;
    const b = await zip.holen(n);
    medien[n] = [...(b || new Uint8Array(0))];
  }
  return {
    namen: zip.namen.slice().sort(),
    doc: await zip.text('word/document.xml'),
    rels: await zip.text('word/_rels/document.xml.rels'),
    typen: await zip.text('[Content_Types].xml'),
    medien
  };
}, bloecke);

/* ========================================================================
 * 1 · Das Bild ist wirklich im Archiv
 * ======================================================================*/
console.log('\n1 · Byte für Byte dasselbe Bild');

const png = await bauePng(400, 300, '#3366cc');
const r1 = await wordAus([
  { type: 'text', text: 'Vor dem Bild' },
  { type: 'image', src: png.url, caption: 'Schaltplan' },
  { type: 'text', text: 'Nach dem Bild' }
]);
const medienNamen = Object.keys(r1.medien);
gleich('Genau ein Medienteil', medienNamen.length, 1);
gleich('Und er heisst nach der Endung', medienNamen[0], 'word/media/bild1.png');

const raus = r1.medien['word/media/bild1.png'] || [];
const rein = await pc.evaluate((u: string) => {
  const roh = atob(u.split(',')[1] || '');
  return [...roh].map(c => c.charCodeAt(0));
}, png.url);
gleich('Gleich viele Bytes', raus.length, rein.length);
p('Und dieselben Bytes', JSON.stringify(raus) === JSON.stringify(rein),
  'erste Abweichung bei ' + raus.findIndex((x, i) => x !== rein[i]));

/* ========================================================================
 * 2 · Und das Dokument zeigt darauf
 *
 * EIN MEDIENTEIL OHNE BEZIEHUNG ist totes Gewicht im Archiv; eine Beziehung
 * ins Leere lässt Word das Dokument als beschädigt melden. Beide Richtungen
 * gehören gemessen, nicht nur eine.
 * ======================================================================*/
console.log('\n2 · Beziehung und Verweis passen zusammen');

const relId = (/Id="(rIdBild\d+)"[^>]*Target="media\/bild1\.png"/.exec(r1.rels || '') || [])[1];
p('Es gibt eine Beziehung auf `media/bild1.png`', !!relId, String(r1.rels).slice(0, 300));
p('Und das Dokument bettet genau diese ein',
  !!relId && new RegExp('r:embed="' + relId + '"').test(r1.doc || ''),
  (/<a:blip[^>]*>/.exec(r1.doc || '') || [''])[0]);
p('Der Platzhaltertext steht nicht mehr da', !/\[Bild/.test(r1.doc || ''),
  (/\[Bild[^\]]*\]/.exec(r1.doc || '') || [''])[0]);
p('Der Text davor und danach steht noch da',
  /Vor dem Bild/.test(r1.doc || '') && /Nach dem Bild/.test(r1.doc || ''));
p('Und die Beschriftung steht als Zeile darunter',
  /Schaltplan/.test(r1.doc || ''));

/* ========================================================================
 * 3 · Die Endung steht in den Content-Types
 * ======================================================================*/
console.log('\n3 · Content-Types kennt die Endung — einmal');

const pngEintraege = (String(r1.typen).match(/<Default Extension="png"/g) || []).length;
gleich('Genau ein `Default` für png', pngEintraege, 1);
p('Mit dem richtigen Typ', /<Default Extension="png" ContentType="image\/png"\/>/.test(r1.typen || ''),
  String(r1.typen).slice(0, 400));

/* ========================================================================
 * 4 · Zwei Bilder, zwei Beziehungen, richtige Reihenfolge
 * ======================================================================*/
console.log('\n4 · Zwei Bilder in der Reihenfolge der Blöcke');

const rot = await bauePng(200, 100, '#cc3333');
const gruen = await bauePng(120, 240, '#33aa55');
const r4 = await wordAus([
  { type: 'image', src: rot.url, caption: 'Erstes' },
  { type: 'text', text: 'dazwischen' },
  { type: 'image', src: gruen.url, caption: 'Zweites' }
]);
const namen4 = Object.keys(r4.medien).sort();
gleich('Zwei Medienteile', namen4, ['word/media/bild1.png', 'word/media/bild2.png']);
gleich('Bild 1 ist das rote', (r4.medien['word/media/bild1.png'] || []).length, rot.laenge);
gleich('Bild 2 ist das grüne', (r4.medien['word/media/bild2.png'] || []).length, gruen.laenge);
const embeds = [...String(r4.doc).matchAll(/r:embed="(rIdBild\d+)"/g)].map(m => m[1]);
gleich('Zwei Einbettungen in der Reihenfolge der Blöcke', embeds, ['rIdBild1', 'rIdBild2']);
p('Und beide Beziehungen gibt es',
  /Id="rIdBild1"[^>]*Target="media\/bild1\.png"/.test(r4.rels || '') &&
  /Id="rIdBild2"[^>]*Target="media\/bild2\.png"/.test(r4.rels || ''),
  String(r4.rels).slice(0, 400));

/* ========================================================================
 * 5 · Was nicht mitkann, sagt warum
 * ======================================================================*/
console.log('\n5 · SVG bleibt Platzhalter — und nennt den Grund');

const SVG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40"/></svg>');

/* UND EIN WEBP, und das ist der Fall, der die Liste erlaubter Typen
   ÜBERHAUPT ERST NÖTIG MACHT — nachgemessen, nicht ausgedacht.

   Beim Nachmessen der ersten Fassung fiel auf: nimmt man SVG in die Liste
   auf, bleibt §5 trotzdem grün. Denn `createImageBitmap` bekommt das SVG
   gar nicht erst vermessen, und ohne Mass gibt es keinen Medienteil. Die
   Liste war also für diesen Fall gar nicht das, was schützt.

   WebP ist der Gegenfall: Chromium liest und misst es mühelos — Word nimmt
   es nicht an. Hier, und nur hier, ist die Liste das Einzige, was zwischen
   einem lesbaren Bild und einem Word-Dokument steht, das sich nicht öffnen
   lässt. */
const webp = await pc.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 60; c.height = 40;
  const g = c.getContext('2d')!;
  g.fillStyle = '#aa7700'; g.fillRect(0, 0, 60, 40);
  const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/webp'));
  if (!/webp/.test(blob.type)) return null;   /* Browser kann kein WebP */
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (const x of bytes) bin += String.fromCharCode(x);
  return 'data:image/webp;base64,' + btoa(bin);
});

const r5 = await wordAus([
  { type: 'image', src: SVG, caption: 'Zeichnung', name: 'plan.svg' },
  { type: 'image', caption: 'Ohne alles' },
  ...(webp ? [{ type: 'image', src: webp, caption: 'Foto' }] : [])
]);
gleich('Kein Medienteil', Object.keys(r5.medien).length, 0);
p('Das SVG steht als Platzhalter da', /\[Bild: Zeichnung — SVG, kommt in Word nicht mit\]/
  .test(String(r5.doc)), (/\[Bild[^\]]*\]/.exec(String(r5.doc)) || [''])[0]);
p('Und das leere sagt seinen eigenen Grund',
  /\[Bild: Ohne alles — kein Bild hinterlegt\]/.test(String(r5.doc)),
  (/\[Bild: Ohne alles[^\]]*\]/.exec(String(r5.doc)) || [''])[0]);
p('Und das WebP ebenso — der Browser liest es, Word nicht',
  !webp || /\[Bild: Foto — liess sich nicht lesen\]/.test(String(r5.doc)),
  webp ? (/\[Bild: Foto[^\]]*\]/.exec(String(r5.doc)) || ['nichts gefunden'])[0]
       : 'dieser Browser kann kein WebP');
gleich('Keine Bild-Beziehung', (String(r5.rels).match(/rIdBild/g) || []).length, 0);
gleich('Und kein `Default` für eine Bildendung',
  (String(r5.typen).match(/<Default Extension="(png|jpg|gif|bmp|tiff)"/g) || []).length, 0);

/* ========================================================================
 * 6 · Ohne Bild kein Medienordner
 *
 * DIE GEGENPROBE ZU §1. Ein Archiv, das immer einen `word/media/` trägt,
 * hätte nichts bewiesen — dieselbe Falle wie bei jeder Anzeige, die immer
 * etwas anzeigt.
 * ======================================================================*/
console.log('\n6 · Eine Seite ohne Bild trägt keinen Medienteil');

const r6 = await wordAus([
  { type: 'h1', text: 'Nur Text' },
  { type: 'text', text: 'Und noch mehr Text' }
]);
gleich('Kein Medienteil', Object.keys(r6.medien).length, 0);
p('Und im Archiv steht nichts unter `word/media/`',
  !r6.namen.some((n: string) => /^word\/media\//.test(n)), JSON.stringify(r6.namen));
gleich('Keine Bild-Beziehung', (String(r6.rels).match(/rIdBild/g) || []).length, 0);
p('Aber die gewöhnlichen Teile sind alle da',
  ['[Content_Types].xml', '_rels/.rels', 'word/document.xml',
   'word/styles.xml', 'word/numbering.xml'].every(n => r6.namen.includes(n)),
  JSON.stringify(r6.namen));

/* ========================================================================
 * 7 · Das Mass ist gerechnet, nicht geraten
 * ======================================================================*/
console.log('\n7 · Breite und Höhe stimmen und passen auf die Seite');

/* Ein kleines Bild: 400 × 300 px bei 96 dpi sind 3810000 × 2857500 EMU. */
const m1 = /<wp:extent cx="(\d+)" cy="(\d+)"\/>/.exec(String(r1.doc));
p('Das Bild trägt ein Mass', !!m1, String(r1.doc).slice(0, 200));
if (m1) {
  const cx = Number(m1[1]), cy = Number(m1[2]);
  gleich('400 px werden zu 3810000 EMU', cx, 400 * 9525);
  gleich('Und 300 px zu 2857500', cy, 300 * 9525);
  p('Das passt in die Textspalte', cx <= 5715000, String(cx));
}

/* Ein grosses Bild wird auf die Spalte gestutzt und behält sein Verhältnis. */
const breit = await bauePng(1600, 800, '#884499');
const r7 = await wordAus([{ type: 'image', src: breit.url }]);
const m2 = /<wp:extent cx="(\d+)" cy="(\d+)"\/>/.exec(String(r7.doc));
p('Auch das grosse trägt ein Mass', !!m2);
if (m2) {
  const cx = Number(m2[1]), cy = Number(m2[2]);
  gleich('Es wird auf die Textbreite gestutzt', cx, 5715000);
  /* 1600 × 800 heisst Verhältnis 2:1 — die Höhe folgt. */
  gleich('Und die Höhe folgt dem Verhältnis', cy, Math.round(5715000 * (800 / 1600)));
}

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
