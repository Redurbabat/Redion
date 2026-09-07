/* Suite 194 — Eine PDF-Seite feiner rechnen (L37, E173)
 * ============================================================================
 * Seiten entstehen bei 1654 px Breite — bei A4 genau 200 dpi, Scan-Qualität.
 * Wer stark hineinzoomt, sieht trotzdem Unschärfe, und L37 hielt das als
 * offene Arbeit fest: eine Seite auf Wunsch feiner rechnen.
 *
 * Alles dafür war schon da und wurde nie gerufen: `alsBild` nimmt seit jeher
 * eine Breite entgegen, das Original liegt in der Ablage (E103), und die
 * Marken liegen in SEITENPUNKTEN statt in Bildpunkten (E100). Der letzte
 * Punkt ist der, an dem es hängt — deshalb misst §3 ihn ausdrücklich: ein
 * Strich, der beim feineren Rechnen wandert, wäre schlimmer als Unschärfe.
 *
 *   node pruefungen/lauf/test228.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Dateien: any;
declare const PdfEinlesen: any; declare const Auftraege: any; declare const JobModell: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8985;

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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* --- Ein echtes PDF, von Hand gebaut (wie test177) ----------------------- */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const machPdf = (seiten: Array<[string, string[]]>): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const [titel, zeilen] of seiten) {
    const strom: string[] = [`BT /F1 36 Tf 60 740 Td (${alsText(titel)}) Tj ET`];
    let y = 690;
    for (const z of zeilen) { strom.push(`BT /F1 18 Tf 60 ${y} Td (${alsText(z)}) Tj ET`); y -= 30; }
    strom.push('2 w 30 30 535 782 re S');
    const roh = Buffer.from(strom.join('\n'), 'latin1');
    const inhalt = neu(Buffer.concat([
      Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
      `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`, 'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);
  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o,
                         Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R >>\n` +
         `startxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};

const PDF = machPdf([['Kapitel 1', ['Erste Zeile', 'Zweite Zeile']]]);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Ein PDF liegt als Seite da — auf dem Weg, den ein Mensch geht
 * ========================================================================*/
console.log('\n1 · Ein PDF liegt als Seite da');

const seitenId = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Skript' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'), null, { timeout: 15000 });

await seite.evaluate(async (hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const datei = new File([bytes], 'skript.pdf', { type: 'application/pdf' });
  const dt = new DataTransfer();
  dt.items.add(datei);
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));

await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForFunction(
  () => Object.values(Store.cache.blocks || {})
    .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 1,
  null, { timeout: 60000 });

const vorher = await seite.evaluate(async (sid: string) => {
  const b = (Store.getBlock(sid).content || []).map((k: string) => Store.getBlock(k))
    .find((x: any) => x && x.type === 'pdfseite');
  const satz = await Store.dateiHolen(b.bildDateiId);
  const blob = await Dateien.alsBlob(b.bildDateiId);
  if (!blob) throw new Error('Das Seitenbild fehlt');
  const bild = await createImageBitmap(blob);
  return { id: b.id, bildDateiId: b.bildDateiId, bildBreite: b.bildBreite ?? null,
           bytes: satz.groesse, px: bild.width, hoch: bild.height,
           bw: b.bw, bh: b.bh, quelle: !!b.quelleId };
}, seitenId);

p('Die Seite hat ein Bild', !!vorher.bildDateiId);
gleich('Und es ist 1654 px breit — 200 dpi bei A4', vorher.px, 1654);
p('Das Original liegt in der Ablage', vorher.quelle);
p('Noch ist keine Breite am Block vermerkt', vorher.bildBreite === null,
  String(vorher.bildBreite));

/* ==========================================================================
 * §2 · Der Knopf ist da, und er rechnet wirklich feiner
 * --------------------------------------------------------------------------
 * Geklickt wird der Knopf im Bild, nicht `PdfEinlesen.schaerfer` aufgerufen.
 * Ein aufgerufener Umwandler prüft den Umwandler und lässt die Verdrahtung
 * offen — genau der Fehler aus E93.
 * ========================================================================*/
console.log('\n2 · Der Knopf ist da, und er rechnet wirklich feiner');

/* `[data-bid=...]` OHNE `.blk` DAVOR (E296). Im Dokumentmodus traegt die
   Buehne selbst die Blockkennung, aber nicht die Klasse `.blk` — sie ist
   die Huelle EINES Blocks und kein Block in einer Liste. Und seit E296
   steht eine frisch eingelesene PDF genau dort.

   `data-bid` war ohnehin der richtige Anker; `document-mode.ts` sagt das
   im Kommentar selbst: „Deep-Links, Rollen und Hervorheben suchen
   absichtlich nach `data-bid`". Die Klasse davor war Beiwerk. */
const knopfDa = await seite.evaluate((bid: string) =>
  !!document.querySelector(`[data-bid="${bid}"] [data-a="feiner"]`), vorher.id);
p('An der Seite steht ein Knopf zum feiner Rechnen', knopfDa);
/* SEIT E464 liegt die feste Leiste der Seite im Schreibstudio hinter „···". */
await seite.evaluate(() => (document.querySelector('[data-document-action="ink-options"]') as HTMLElement | null)?.click());
await seite.waitForTimeout(250);

await seite.click(`[data-bid="${vorher.id}"] [data-a="feiner"]`);
await seite.waitForFunction(
  (bid: string) => (Store.getBlock(bid) || {}).bildBreite === 3308,
  vorher.id, { timeout: 90000 });

const nachher = await seite.evaluate(async (bid: string) => {
  const b = Store.getBlock(bid);
  const satz = await Store.dateiHolen(b.bildDateiId);
  const blob = await Dateien.alsBlob(b.bildDateiId);
  if (!blob) throw new Error('Das Seitenbild fehlt');
  const bild = await createImageBitmap(blob);
  return { bildDateiId: b.bildDateiId, bildBreite: b.bildBreite,
           bytes: satz.groesse, px: bild.width, hoch: bild.height,
           bw: b.bw, bh: b.bh };
}, vorher.id);

gleich('Das Bild ist jetzt 3308 px breit — 400 dpi', nachher.px, 3308);
p('Und es hat wirklich mehr Bytes', nachher.bytes > vorher.bytes * 1.3,
  `${vorher.bytes} → ${nachher.bytes}`);
p('Es ist eine andere Datei als vorher', nachher.bildDateiId !== vorher.bildDateiId);
gleich('Die Seitenmasse in Punkten bleiben, wie sie waren',
  [nachher.bw, nachher.bh], [vorher.bw, vorher.bh]);
p('Das Seitenverhältnis stimmt noch',
  Math.abs(nachher.px / nachher.hoch - vorher.px / vorher.hoch) < 0.01,
  `${(vorher.px / vorher.hoch).toFixed(4)} → ${(nachher.px / nachher.hoch).toFixed(4)}`);

/* ==========================================================================
 * §3 · Und die alte Datei bleibt nicht liegen
 * --------------------------------------------------------------------------
 * Jedes feinere Rechnen legt eine neue Datei ab. Bliebe die alte stehen,
 * wüchse der Bestand mit jedem Klick, und niemand fände sie wieder: ihr
 * `blockId` zeigt auf einen LEBENDEN Block, die Pflegeseite sucht nach
 * Sätzen ohne Block (E116).
 * ========================================================================*/
console.log('\n3 · Und die alte Datei bleibt nicht liegen');

const aufgeraeumt = await seite.evaluate(async (auftrag: { alt: string; bid: string }) => ({
  alteWeg: !(await Dateien.alsBlob(auftrag.alt)),
  alteStuecke: (await Store.stueckeVon(auftrag.alt)).length,
  /* UND DIE ZAHL, die es wirklich misst. `Dateien.verwaist()` findet so eine
     Leiche grundsätzlich nicht: ihr `blockId` zeigt auf einen LEBENDEN Block,
     und gesucht wird nach Sätzen ohne Block (E116). Gezählt wird deshalb,
     wie viele Bilder DIESE SEITE hat — es darf genau eines sein. */
  bilderDieserSeite: (await Store.dateiAlle())
    .filter((d: any) => d.blockId === auftrag.bid && d.abgeleitet).length
}), { alt: vorher.bildDateiId, bid: vorher.id });

gleich('Die alte Bilddatei ist fort', aufgeraeumt.alteWeg, true);
gleich('Und ihre Stücke auch', aufgeraeumt.alteStuecke, 0);
gleich('Und die Seite hat genau ein Bild, nicht zwei',
  aufgeraeumt.bilderDieserSeite, 1);

/* ==========================================================================
 * §4 · Die Marken bleiben liegen, wo sie liegen
 * --------------------------------------------------------------------------
 * DER PUNKT, AN DEM DAS GANZE HÄNGT. Marken stehen in Seitenpunkten und
 * nicht in Bildpunkten (E100) — deshalb darf sich unter ihnen das Bild
 * ändern. Wäre es anders, wanderte jeder Strich beim feineren Rechnen, und
 * das wäre schlimmer als Unschärfe.
 * ========================================================================*/
console.log('\n4 · Die Marken bleiben liegen, wo sie liegen');

const markenProbe = await seite.evaluate(async (bid: string) => {
  const b = Store.getBlock(bid);
  Store.updateBlock(bid, { marken: [{ id: 'm1', art: 'stift', farbe: '#e5484d',
    breite: 3, punkte: [[100, 200], [300, 400]] }] });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 500));
  const svgVor = document.querySelector(`[data-bid="${bid}"] .blatt-marken`);
  const boxVor = svgVor ? svgVor.getAttribute('viewBox') : '';
  const punkteVor = JSON.stringify(Store.getBlock(bid).marken[0].punkte);

  /* Und noch einmal feiner — diesmal muss es abgelehnt werden, die Grenze
     ist erreicht. Der Zustand darf sich dabei nicht ändern. */
  const erg = await PdfEinlesen.schaerfer(Store.getBlock(bid));
  await new Promise(r => setTimeout(r, 400));
  const svgNach = document.querySelector(`[data-bid="${bid}"] .blatt-marken`);
  return {
    boxVor, boxNach: svgNach ? svgNach.getAttribute('viewBox') : '',
    punkteVor, punkteNach: JSON.stringify(Store.getBlock(bid).marken[0].punkte),
    abgelehnt: erg && erg.ok === false, grund: erg ? erg.grund : '',
    breiteNoch: Store.getBlock(bid).bildBreite,
    bw: b.bw
  };
}, vorher.id);

gleich('Die Markenschicht rechnet in Seitenpunkten, nicht in Bildpunkten',
  markenProbe.boxVor, `0 0 ${vorher.bw} ${vorher.bh}`);
gleich('Die Marke steht nach dem feineren Rechnen unverändert da',
  markenProbe.punkteNach, markenProbe.punkteVor);
gleich('Und die Schicht spannt weiter denselben Raum auf',
  markenProbe.boxNach, markenProbe.boxVor);

console.log('\n4a · Und über der Grenze sagt es das');
p('Ein zweiter Anlauf wird abgelehnt', markenProbe.abgelehnt);
p('Und zwar mit einem Satz, den ein Mensch versteht',
  /so fein gerechnet/.test(markenProbe.grund || ''), markenProbe.grund);
gleich('Die Breite bleibt, wo sie war', markenProbe.breiteNoch, 3308);

const knopfWeg = await seite.evaluate((bid: string) =>
  !document.querySelector(`[data-bid="${bid}"] [data-a="feiner"]`), vorher.id);
p('Und der Knopf ist fort — er hätte nichts mehr zu tun', knopfWeg);

/* ==========================================================================
 * §5 · Die feinere Breite überlebt Sicherung und Neurechnung
 * --------------------------------------------------------------------------
 * `.redion` lässt die Seitenbilder bewusst draussen (E103). Wer sie
 * zurückholt, bekäme ohne diesen Punkt wieder die grobe Fassung — die Arbeit
 * wäre still verloren.
 * ========================================================================*/
console.log('\n5 · Die feinere Breite überlebt das Zurückholen');

const zurueck = await seite.evaluate(async (bid: string) => {
  const b = Store.getBlock(bid);
  const bisher = b.bildDateiId;
  /* So sieht die Seite nach dem Einspielen einer `.redion` aus: die Kennung
     steht am Block, die Datei ist nicht mitgekommen. */
  await Dateien.weg(bisher);
  Store.updateBlock(bid, { bildDateiId: bisher });
  /* SEIT E327 IST DAS ZURÜCKHOLEN EIN AUFTRAG. `neuBerechnen` kommt
     zurück, sobald er ANGELEGT ist — nicht wenn er fertig ist. Also auf
     das Ende warten, so wie es ein Mensch am Auftragsfenster auch tut. */
  const erg = await PdfEinlesen.neuBerechnen(b.quelleId);
  const auftragsId = erg?.auftrag?.id || '';
  if (auftragsId) {
    const bis = Date.now() + 90000;
    for (;;) {
      const a = await Auftraege.einer(auftragsId);
      if (a && JobModell.beendet(a)) break;
      if (Date.now() > bis) throw new Error('Auftrag wurde nicht fertig');
      await new Promise(r => setTimeout(r, 120));
    }
  }
  await new Promise(r => setTimeout(r, 200));
  const nach = Store.getBlock(bid);
  const blob = await Dateien.alsBlob(nach.bildDateiId);
  const bild = blob ? await createImageBitmap(blob) : null;
  return { seiten: erg?.auftrag?.stand?.seiten ?? erg?.seiten ?? (auftragsId ? 1 : 0),
           px: bild ? bild.width : 0, breite: nach.bildBreite };
}, vorher.id);

gleich('Die Seite ist neu gerechnet worden', zurueck.seiten, 1);
gleich('Und zwar wieder fein, nicht grob', zurueck.px, 3308);
gleich('Die gemerkte Breite steht noch am Block', zurueck.breite, 3308);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
