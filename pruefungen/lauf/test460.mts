/* Suite 460 — Das ganze Dokument als PDF, mit Marken (E488)
 * ============================================================================
 * L133, unter „Import und Export": „**Ganzes Dokument als PDF mit Marken** —
 * braucht einen PDF-Schreiber; Drucken über den Browser kann es heute."
 *
 * Jetzt gibt es den Schreiber: `PdfWriter` legt fertige Seitenbilder als
 * JPEG in ein PDF (`DCTDecode`), ohne die Bildbytes je zu lesen.
 *
 *   §1 DER SCHREIBER ALLEIN: ein PDF mit zwei Seiten verschiedener Grösse,
 *      und der eigene PDF-LESER macht es wieder auf. Das ist der Rückweg,
 *      den §13 verlangt — nicht „sieht gut aus", sondern echte Bytes.
 *   §2 DIE FORM STIMMT: Kopf, Binärkommentar, `xref` mit Zeilen von genau
 *      zwanzig Bytes, `startxref` zeigt auf die Tabelle, `%%EOF` am Ende.
 *   §3 UNSINN WIRD ABGEWIESEN, nicht als kaputte Seite geschrieben.
 *   §4 DAS GANZE DOKUMENT durch `DocumentMode.alsPdf`: drei Seiten hinein,
 *      drei Seiten heraus, in derselben Reihenfolge und mit den Marken
 *      darauf — geprüft an einem Pixel, den nur die Marke rot macht.
 *   §5 DER KNOPF im Inspector, 44 px, und er sagt, was er auslässt.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → im Schreiber `stellen[1] = bisher` weglassen: die xref zeigt auf
 *        Byte 0, und der Leser wirft. Gelaufen, rot.
 *   §2 → in der xref-Zeile das Leerzeichen vor dem Zeilenende streichen
 *        (19 statt 20 Bytes). Gelaufen, rot.
 *   §4 → in `alsPdf` das Bild als PNG statt JPEG malen: `DCTDecode` bekommt
 *        kein JPEG, und die Seite bleibt leer. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test460.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfWriter: any; declare const PdfLeser: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9580;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof PdfWriter !== 'undefined' && typeof PdfLeser !== 'undefined'");
await s.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ═══ §1 Der Schreiber, und der eigene Leser macht es wieder auf ═══════════ */
console.log('\n§1 Geschrieben und mit Redions eigenem Leser zurückgelesen');
const rueckweg = JSON.parse(await s.evaluate(`(async () => {
  /* Zwei Bilder verschiedener Grösse und Farbe, echt gemalt. */
  const malen = (breit, hoch, farbe) => new Promise(fertig => {
    const c = document.createElement('canvas');
    c.width = breit; c.height = hoch;
    const g = c.getContext('2d');
    g.fillStyle = farbe; g.fillRect(0, 0, breit, hoch);
    c.toBlob(b => fertig(b), 'image/jpeg', 0.9);
  });
  const schreiber = PdfWriter.neu();
  const a = await malen(200, 300, '#cc2200');
  const b = await malen(400, 200, '#0033cc');
  const eins = schreiber.seite({ bild: a, pixelBreite: 200, pixelHoehe: 300, breite: 595, hoehe: 842 });
  const zwei = schreiber.seite({ bild: b, pixelBreite: 400, pixelHoehe: 200, breite: 842, hoehe: 595 });
  const blob = schreiber.schliessen();
  const daten = new Uint8Array(await blob.arrayBuffer());
  const doc = await PdfLeser.oeffne(daten);
  const g1 = await doc.geometrie(1), g2 = await doc.geometrie(2);
  doc.schliessen();
  return JSON.stringify({ eins, zwei, typ: blob.type, gross: blob.size > 1000,
    seiten: doc.seiten, g1, g2 });
})()`) as string);
gleich('Beide Seiten wurden angenommen', [rueckweg.eins, rueckweg.zwei], [true, true]);
gleich('Es ist ein PDF', rueckweg.typ, 'application/pdf');
p('… und hat Inhalt', rueckweg.gross, JSON.stringify(rueckweg));
gleich('Redions Leser findet zwei Seiten', rueckweg.seiten, 2);
gleich('Seite 1 misst 595 × 842 Punkte', [rueckweg.g1.bw, rueckweg.g1.bh], [595, 842]);
gleich('Seite 2 misst 842 × 595 — quer, wie übergeben', [rueckweg.g2.bw, rueckweg.g2.bh], [842, 595]);

/* ═══ §2 Die Form ══════════════════════════════════════════════════════════ */
console.log('\n§2 Kopf, xref und Ende stimmen Byte für Byte');
const form = JSON.parse(await s.evaluate(`(async () => {
  const malen = () => new Promise(fertig => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 40;
    const g = c.getContext('2d'); g.fillStyle = '#123456'; g.fillRect(0, 0, 40, 40);
    c.toBlob(b => fertig(b), 'image/jpeg', 0.9);
  });
  const w = PdfWriter.neu();
  w.seite({ bild: await malen(), pixelBreite: 40, pixelHoehe: 40, breite: 100, hoehe: 100 });
  w.seite({ bild: await malen(), pixelBreite: 40, pixelHoehe: 40, breite: 100, hoehe: 100 });
  const bytes = new Uint8Array(await w.schliessen().arrayBuffer());
  /* Latin-1 lesen: jedes Byte ein Zeichen, damit die STELLEN in Zeichen
     dieselben sind wie in Bytes. Mit UTF-8 wären sie es nicht. */
  let text = '';
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
  const xrefStelle = text.lastIndexOf('xref\\n0 ');
  const startAngabe = Number((text.match(/startxref\\n(\\d+)/) || [])[1]);
  const zeilen = text.slice(xrefStelle).split('\\n');
  /* Die erste Eintragszeile steht hinter „xref" und „0 N". */
  /* zeilen[0]=„xref", [1]=„0 N", [2] die FREIE Zeile (65535 f), erst
     [3] ist der erste echte Eintrag. */
  const ersteZeile = zeilen[3] || '';
  return JSON.stringify({
    kopf: text.slice(0, 8),
      /* Der Kopf ist %PDF-1.4 plus Zeilenende — neun Bytes. Dann das
       Prozentzeichen und die vier Bytes über 127; also ab 10, nicht ab 9. */
    binaerZeichen: [bytes[10], bytes[11], bytes[12], bytes[13]],
    xrefStelle, startAngabe,
    zeileLaenge: (ersteZeile + '\\n').length,
    zeileForm: /^\\d{10} \\d{5} n $/.test(ersteZeile),
    /* Zwei Seiten sind sechs Objekte, dazu Katalog und Seitenbaum: acht,
       also „0 9" in der Tabelle (die Null zählt mit). */
    objektZeile: zeilen[1],
    endet: text.slice(-6)
  });
})()`) as string);
gleich('Der Kopf sagt %PDF-1.4', form.kopf, '%PDF-1.4');
p('… dahinter vier Bytes über 127 (der Binärhinweis)',
  form.binaerZeichen.every((b: number) => b > 127), JSON.stringify(form.binaerZeichen));
gleich('`startxref` nennt genau die Stelle der Tabelle', form.startAngabe, form.xrefStelle);
gleich('Eine Eintragszeile ist genau 20 Bytes lang', form.zeileLaenge, 20);
p('… und hat die vorgeschriebene Form', form.zeileForm, JSON.stringify(form));
gleich('Zwei Seiten heissen acht Objekte plus die Null', form.objektZeile, '0 9');
gleich('Am Ende steht %%EOF', form.endet, '%%EOF\n');

/* ═══ §3 Unsinn wird abgewiesen ════════════════════════════════════════════ */
console.log('\n§3 Was keine Seite werden kann, wird keine halbe');
const abwehr = JSON.parse(await s.evaluate(`(async () => {
  const w = PdfWriter.neu();
  const leer = new Blob([], { type: 'image/jpeg' });
  const gut = await new Promise(fertig => {
    const c = document.createElement('canvas'); c.width = 10; c.height = 10;
    c.getContext('2d').fillRect(0, 0, 10, 10);
    c.toBlob(b => fertig(b), 'image/jpeg', 0.9);
  });
  return JSON.stringify({
    leeresBild: w.seite({ bild: leer, pixelBreite: 10, pixelHoehe: 10, breite: 100, hoehe: 100 }),
    keinBlob: w.seite({ bild: 'nein', pixelBreite: 10, pixelHoehe: 10, breite: 100, hoehe: 100 }),
    nullBreit: w.seite({ bild: gut, pixelBreite: 0, pixelHoehe: 10, breite: 100, hoehe: 100 }),
    nullSeite: w.seite({ bild: gut, pixelBreite: 10, pixelHoehe: 10, breite: 0, hoehe: 100 }),
    gut: w.seite({ bild: gut, pixelBreite: 10, pixelHoehe: 10, breite: 100, hoehe: 100 }),
    seiten: w.seiten()
  });
})()`) as string);
gleich('Ein leeres Bild wird abgewiesen', abwehr.leeresBild, false);
gleich('Etwas, das kein Blob ist, auch', abwehr.keinBlob, false);
gleich('Null Pixel breit: abgewiesen', abwehr.nullBreit, false);
gleich('Null Punkte breit: abgewiesen', abwehr.nullSeite, false);
gleich('Die richtige Seite kommt durch', abwehr.gut, true);
gleich('… und nur sie steht im Dokument', abwehr.seiten, 1);

/* ═══ §4 Das ganze Dokument, mit Marken ════════════════════════════════════ */
console.log('\n§4 Drei Seiten aus dem Studio — und die Marke ist darauf');
const ganz = JSON.parse(await s.evaluate(`(async () => {
  const seite = Store.addPage(null, { text: 'Skript', icon: '📕' });
  /* Drei Blätter. DIE ERSTE UND DIE ZWEITE tragen je einen dicken roten
     Strich, die dritte ist leer.
     Warum die ERSTE mit dabei sein muss: die Gegenprobe „Objektnummern 1
     und 2 nicht reserviert" trifft genau das Bild der ERSTEN Seite (es
     bekäme dann die Nummer 1 und würde vom Katalog überschrieben). Eine
     Probe, die nur die zweite Seite ansieht, bliebe grün — und der Fehler,
     den dieser Bogen wirklich gefunden hat, wäre ungedeckt. */
  const ids = [];
  for (let i = 1; i <= 3; i++) {
    const b = Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: i <= 2
        ? [{ id: 'm' + i, art: 'stift', farbe: '#ff0000', breite: 40,
             pts: [[40, 200], [555, 200]], pressure: [1, 1] }]
        : [] });
    ids.push(b.id);
  }
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  const bloecke = DocumentMode.documentsIn(Store.getBlock(seite.id));
  const stand = [];
  const blob = await DocumentMode.alsPdf(bloecke, (fertig, gesamt) => { stand.push(fertig + '/' + gesamt); });
  if (!blob) return JSON.stringify({ blob: false });
  const doc = await PdfLeser.oeffne(new Uint8Array(await blob.arrayBuffer()));
  const seiten = doc.seiten;
  const g = await doc.geometrie(2);
  /* DIE MARKE MUSS DRAUF SEIN. Die Seite als Bild zurückholen und an der
     Stelle des Strichs nachsehen — dort MUSS es rot sein, und am unteren
     Rand darf es das nicht. Das ist der Unterschied zwischen „ein PDF ist
     entstanden" und „das Dokument steht darin". */
  /* alsBild gibt einen Blob (WebP), keine Adresse — nachgesehen in
     leser.ts, nicht geraten (E21). Keine Rückwärts-Anführungszeichen in
     diesem Block: er steht in einem Template-Literal. */
  const messen = async (nr) => {
    const bildBlob = await doc.alsBild(nr, 300);
    const bildUrl = URL.createObjectURL(bildBlob);
    const img = await new Promise((fertig, schief) => {
      const i = new Image(); i.onload = () => fertig(i); i.onerror = () => schief(new Error('bild')); i.src = bildUrl;
    });
    URL.revokeObjectURL(bildUrl);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const punkt = (fx, fy) => {
      const d = ctx.getImageData(Math.round(img.width * fx), Math.round(img.height * fy), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const raus = { strich: punkt(0.5, 200 / 841.89), unten: punkt(0.5, 0.9) };
    c.width = 0; c.height = 0;
    return raus;
  };
  const s1 = await messen(1);
  const s2 = await messen(2);
  doc.schliessen();
  return JSON.stringify({ blob: true, gross: blob.size > 2000, typ: blob.type,
    seiten, breit: g.bw, hoch: g.bh, stand, s1, s2 });
})()`) as string);
p('Es ist ein PDF entstanden', ganz.blob && ganz.gross, JSON.stringify(ganz));
gleich('Drei Seiten hinein, drei heraus', ganz.seiten, 3);
gleich('… in A4', [ganz.breit, ganz.hoch], [595, 842]);
gleich('Der Fortschritt wurde viermal gemeldet (0,1,2 und fertig)',
  ganz.stand, ['0/3', '1/3', '2/3', '3/3']);
const rot = (px: number[]): boolean => px[0]! > 180 && px[1]! < 90 && px[2]! < 90;
const weiss = (px: number[]): boolean => px[0]! > 200 && px[1]! > 200 && px[2]! > 200;
p('Seite 1: auf der Höhe des Strichs ist es ROT', rot(ganz.s1.strich), JSON.stringify(ganz.s1));
p('… und unten auf derselben Seite nicht', weiss(ganz.s1.unten), JSON.stringify(ganz.s1));
p('Seite 2: derselbe Strich, dieselbe Messung', rot(ganz.s2.strich), JSON.stringify(ganz.s2));
p('… und unten weiss', weiss(ganz.s2.unten), JSON.stringify(ganz.s2));

/* ═══ §5 Der Knopf ═════════════════════════════════════════════════════════ */
console.log('\n§5 Der Knopf im Inspector');
{
  await s.evaluate(() => {
    const seite = Object.values<any>(Store.cache.blocks)
      .find((b: any) => b.type === 'page' && b.alive && b.dokumentModus);
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1200);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  const k = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('[data-document-action="export-pdf"]');
    if (!b) return JSON.stringify({ da: false });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ da: true, text: b.textContent, titel: b.getAttribute('title'),
      hoch: Math.round(r.height) });
  })()`) as string);
  p('Der Knopf steht im Inspector', k.da && /Als PDF sichern/.test(String(k.text)), JSON.stringify(k));
  p('… mit 44 px (§37)', k.hoch >= 44, JSON.stringify(k));
  p('… und sagt, was er auslässt (§33: keine falschen Versprechen)',
    /nicht mehr durchsuchbar/.test(String(k.titel)), String(k.titel));
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const w = lies('src/core/export/pdfWriter.ts');
  p('Der Schreiber liest die Bildbytes NIE',
    !/arrayBuffer\(\)/.test(w) && /teil instanceof Blob \? teil\.size/.test(w));
  p('Er schreibt DCTDecode, also das JPEG unverändert', /\/Filter \/DCTDecode/.test(w));
  p('Er steht in `tsconfig.bauen.json`',
    /src\/core\/export/.test(lies('tsconfig.bauen.json')));
  p('… in `index.html`', /quell\/core\/export\/pdfWriter\.js/.test(lies('index.html')));
  p('… und im GRUNDSTOCK des Dienstes (§28)',
    /quell\/core\/export\/pdfWriter\.js/.test(lies('src/dienst/sw.ts')));
  p('Das erzeugte JS gibt es', fs.existsSync(path.join(WURZEL, 'quell/core/export/pdfWriter.js')));
  p('Eine Rechnung für das Seitenbild, zwei Aufrufer (§8)',
    (lies('src/bereiche/pdf/document-mode.ts').match(/const seiteZeichnen = /g) || []).length === 1);
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await s.close();
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
