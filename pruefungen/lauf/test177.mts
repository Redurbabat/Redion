/* Suite 143 — Ein PDF wird zu Seiten, auf die man schreiben kann (E103)
 * ============================================================================
 * Redur wollte sein Schul-PDF ablegen, jede Seite durchblättern und direkt
 * darauf schreiben. Dafür kommt mit pdf.js die ERSTE fremde Bibliothek ins
 * Verzeichnis eines Projekts, das bis heute null Laufzeitabhängigkeiten hat.
 *
 * DESHALB PRÜFT DIESE SUITE ZWEI GANZ VERSCHIEDENE DINGE:
 *
 *   Ist der Fremdcode der, der er zu sein behauptet?  §0 rechnet die
 *   Prüfsummen aus `pruefungen/fremd-bestand.json` nach. Eine eingepackte
 *   Bibliothek, die niemand nachrechnet, ist eine halbe Million Bytes, denen
 *   man auf Zuruf glaubt.
 *
 *   Tut der Weg, was er verspricht?  §1 bis §6 fahren ihn ab: lesen,
 *   rastern, ablegen, beschreiben, sichern.
 *
 * DIE ZWEI PUNKTE, AN DENEN ES WIRKLICH HÄNGT:
 *
 *   §3  Das Original bleibt Byte für Byte. Wer sein Zeugnis in Redion legt,
 *       muss es unverändert wiederbekommen — auch wenn die Rasterung, die
 *       Bibliothek oder Redion selbst später verschwindet.
 *
 *   §5  Die Seitenbilder bleiben aus der Sicherung draussen, das Original
 *       nicht. Bei 200 KB je Seite wäre ein Skript mit 500 Seiten sonst
 *       hundert Megabyte in JEDER Sicherung — für etwas, das sich in
 *       Sekunden neu rechnen lässt. Und der Gegenprobe-Arm zeigt, dass das
 *       Auslassen ZIELT: ein gewöhnlicher Anhang liegt weiterhin drin.
 *
 *   node pruefungen/lauf/test177.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import os from 'node:os';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8922;

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
 * Ein echtes PDF, von Hand gebaut
 * --------------------------------------------------------------------------
 * KEINE Beispieldatei im Verzeichnis, und kein Paket dafür. Ein PDF ist eine
 * Handvoll nummerierter Objekte und eine Tabelle mit ihren Byte-Positionen —
 * das lässt sich hier hinschreiben, und dann prüft die Suite gegen etwas,
 * das sie selbst versteht, statt gegen eine Datei, die irgendwann irgendwer
 * hineingelegt hat.
 * ------------------------------------------------------------------------*/
/* In einem PDF steht Text in runden Klammern. Ein `)` MITTEN im Text
   beendet die Zeichenkette also vorzeitig — und dann ist nicht nur diese
   Zeile hin, sondern der ganze Inhaltsstrom danach. Gesehen beim Bildermachen
   (§55): auf der Seite stand die Überschrift, und die vier Aufgaben darunter
   fehlten spurlos. Kein Fehler, keine Meldung — nur eine halbe Seite. */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/* `escapen = false` baut dasselbe PDF ohne Escape — nur für den
   Gegenprobe-Arm in §1. */
const machPdfAllgemein = (seiten: Array<[string, string[]]>, escapen: boolean): Buffer => {
  const schuetze = escapen ? alsText : (s: string) => s;
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');                    /* 1 — Inhalt kommt zum Schluss */
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const kids: number[] = [];
  for (const [titel, zeilen] of seiten) {
    const strom: string[] = [`BT /F1 36 Tf 60 740 Td (${schuetze(titel)}) Tj ET`];
    let y = 690;
    for (const z of zeilen) { strom.push(`BT /F1 18 Tf 60 ${y} Td (${schuetze(z)}) Tj ET`); y -= 30; }
    strom.push('2 w 30 30 535 782 re S');      /* ein Rahmen — sichtbare Kante */
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
const machPdf = (seiten: Array<[string, string[]]>): Buffer =>
  machPdfAllgemein(seiten, true);
const machPdfRoh = (seiten: Array<[string, string[]]>): Buffer =>
  machPdfAllgemein(seiten, false);

/* Die Klammern in „1)" sind Absicht: ohne `alsText` bricht der Inhaltsstrom
   genau hier ab, und §1 unten misst, ob unter der Überschrift noch etwas
   steht. */
const SEITEN: Array<[string, string[]]> = [
  ['Mathematik', ['1)  Loese:  3x + 12 = 45', '2)  Kuerze:  84 / 126']],
  ['Physik',     ['1)  F = m * a  (m = 12 kg)', '2)  Einheit der Kraft?']],
  ['Chemie',     ['1)  Was ist H2O ?', '2)  Ordnungszahl von C ?']]
];
const PDF = machPdf(SEITEN);
const PDF_SUMME = crypto.createHash('sha256').update(PDF).digest('hex');

/* DIESELBEN SEITEN, ABER OHNE ESCAPE — der Gegenprobe-Arm für §1. Er zeigt,
   dass die Messung dort überhaupt rot werden kann. */
const PDF_KAPUTT = machPdfRoh(SEITEN);

/* ==========================================================================
 * §0 · Der Fremdcode ist der, der er zu sein behauptet
 * ========================================================================*/
console.log('\n0 · Der Fremdcode ist der, der er zu sein behauptet');

const BESTAND = path.join(WURZEL, 'pruefungen/fremd-bestand.json');
p('Es gibt ein Verzeichnis für fremden Code', fs.existsSync(BESTAND));

const bestand = JSON.parse(fs.readFileSync(BESTAND, 'utf8'));
const pdfjsEintrag = (bestand.eintraege || [])
  .find((e: any) => e.paket === 'pdfjs-dist');
p('pdf.js steht darin', !!pdfjsEintrag);
gleich('Mit Lizenz', pdfjsEintrag?.lizenz, 'Apache-2.0');
p('Und mit Begründung, warum es überhaupt hereinkommt',
  String(pdfjsEintrag?.begruendung || '').length > 30);

/* Der Behälter ist FREMD, der Lader daneben ist Redion-Code. Diese Trennung
   ist keine Kosmetik: nur so bleibt §54.4 („es entsteht kein neues
   JavaScript") eine Aussage — die Ausnahme deckt Bytes, nicht Logik. */
gleich('Der Eintrag zeigt auf den Behälter', pdfjsEintrag?.pfad,
  'quell/fremd/pdfjs/daten.js');
gleich('Der Lader daneben ist TypeScript', pdfjsEintrag?.lader,
  'src/fremd/pdfjs/laden.ts');
p('Und er liegt wirklich dort',
  fs.existsSync(path.join(WURZEL, String(pdfjsEintrag?.lader || ''))));
p('Im Behälter steht nichts als der Kopf und zwei Zeichenketten',
  !/function|=>|addEventListener/.test(
    fs.readFileSync(path.join(WURZEL, pdfjsEintrag.pfad), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')));

const lizenzPfad = path.join(WURZEL, String(pdfjsEintrag?.lizenzdatei || ''));
p('Die Lizenzdatei liegt daneben', fs.existsSync(lizenzPfad));
p('Und ist die Apache-Lizenz',
  fs.existsSync(lizenzPfad) &&
  fs.readFileSync(lizenzPfad, 'utf8').includes('Apache License'));

const quelltext = fs.readFileSync(path.join(WURZEL, pdfjsEintrag.pfad), 'utf8');
const auspacken = (schluessel: string): Buffer | null => {
  const m = quelltext.match(new RegExp(schluessel + ': "([A-Za-z0-9+/=]+)"'));
  return m && m[1] ? zlib.gunzipSync(Buffer.from(m[1], 'base64')) : null;
};
const teile: Record<string, string> = { LIB: 'pdf.min.mjs', WORKER: 'pdf.worker.min.mjs' };
for (const [schluessel, datei] of Object.entries(teile)) {
  const soll = (pdfjsEintrag.enthaelt || []).find((e: any) => e.datei === datei);
  const roh = auspacken(schluessel);
  p(datei + ' ist eingepackt', !!roh);
  gleich(datei + ': so viele Bytes wie angegeben', roh?.length, soll?.bytes);
  gleich(datei + ': Prüfsumme stimmt',
    roh ? crypto.createHash('sha256').update(roh).digest('hex') : '(nichts)', soll?.sha256);
}

/* GEGENPROBE — kann diese Prüfung überhaupt rot werden? Ein einziges
   verändertes Byte muss die Summe umwerfen; sonst prüft §0 gar nichts. */
const echt = auspacken('LIB')!;
const verbogen = Buffer.from(echt);
verbogen[1000] = verbogen[1000]! ^ 0x01;
p('Gegenprobe: ein einziges verändertes Byte fällt auf',
  crypto.createHash('sha256').update(verbogen).digest('hex') !==
  crypto.createHash('sha256').update(echt).digest('hex'));

/* ==========================================================================
 * Der Browser
 * ========================================================================*/
const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1400, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · pdf.js liest ein echtes PDF
 * ========================================================================*/
console.log('\n1 · pdf.js liest ein echtes PDF');

const gelesen = await seite.evaluate(async (hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const griff = await PdfLeser.oeffne(bytes);
  const geo = await griff.geometrie(1);
  const bild = await griff.alsBild(1, 800);
  /* Ist im Bild überhaupt etwas? Ein leeres WebP wäre winzig. */
  const bytesImBild = bild.size;
  griff.schliessen();
  return { seiten: griff.seiten, geo, typ: bild.type, bytesImBild };
}, PDF.toString('hex'));

gleich('Drei Seiten', gelesen.seiten, 3);
p('A4 in Punkten: rund 595 breit',
  Math.abs(gelesen.geo.bw - 595) < 2, 'ist ' + gelesen.geo.bw);
p('und rund 842 hoch',
  Math.abs(gelesen.geo.bh - 842) < 2, 'ist ' + gelesen.geo.bh);
gleich('Die Seite wird ein WebP', gelesen.typ, 'image/webp');
p('Und es steht etwas darauf', gelesen.bytesImBild > 800,
  gelesen.bytesImBild + ' Bytes');

/* --------------------------------------------------------------------------
 * STEHT AUCH DAS DA, WAS DARAUF STEHEN SOLL?
 * --------------------------------------------------------------------------
 * Eine Bytezahl beweist nur, dass IRGENDETWAS gezeichnet wurde. Beim
 * Bildermachen (§55) stand auf der Seite genau die Überschrift und sonst
 * nichts: das `)` in „1)" hatte die PDF-Zeichenkette beendet und den
 * Inhaltsstrom danach mitgenommen. Kein Fehler, keine Meldung, halbe Seite.
 *
 * Deshalb wird nachgesehen, ob unter der Überschrift dunkle Punkte liegen —
 * dort, wo die Aufgaben stehen. Und der Arm darunter zeigt, dass diese
 * Messung rot werden KANN: dasselbe PDF ohne Escape hat dort nichts.
 * ------------------------------------------------------------------------*/
const dunkleBaender = async (hex: string) => seite.evaluate(async (h: string) => {
  const bytes = Uint8Array.from((h.match(/../g) || []).map(x => parseInt(x, 16)));
  const griff = await PdfLeser.oeffne(bytes);
  const bild = await griff.alsBild(1, 600);
  griff.schliessen();
  const karte = await createImageBitmap(bild);
  const l = document.createElement('canvas');
  l.width = karte.width; l.height = karte.height;
  const stift = l.getContext('2d')!;
  stift.drawImage(karte, 0, 0);
  const zaehle = (vonAnteil: number, bisAnteil: number): number => {
    const y0 = Math.round(karte.height * vonAnteil);
    const y1 = Math.round(karte.height * bisAnteil);
    const d = stift.getImageData(0, y0, karte.width, y1 - y0).data;
    let n = 0;
    /* Nur die INNERE Fläche: der gezeichnete Rahmen läuft aussen herum und
       zählte sonst als „da steht etwas" mit. */
    const rand = Math.round(karte.width * 0.09);
    for (let y = 0; y < y1 - y0; y++)
      for (let x = rand; x < karte.width - rand; x++) {
        const i = (y * karte.width + x) * 4;
        if (d[i]! < 128 && d[i + 1]! < 128 && d[i + 2]! < 128) n++;
      }
    return n;
  };
  /* ERST zählen, DANN aufräumen. Umgekehrt misst man eine 0×0-Leinwand. */
  const werte = { ueberschrift: zaehle(0.07, 0.13), aufgaben: zaehle(0.16, 0.32) };
  karte.close();
  l.width = 0; l.height = 0;
  return werte;
}, hex);

const heil = await dunkleBaender(PDF.toString('hex'));
p('Die Überschrift ist gezeichnet', heil.ueberschrift > 300,
  heil.ueberschrift + ' dunkle Punkte');
p('Und die Aufgaben darunter auch', heil.aufgaben > 300,
  heil.aufgaben + ' dunkle Punkte');

const kaputt = await dunkleBaender(PDF_KAPUTT.toString('hex'));
p('Gegenprobe: dieselbe Seite ohne Escape hat noch die Überschrift',
  kaputt.ueberschrift > 300, kaputt.ueberschrift + ' dunkle Punkte');
p('Gegenprobe: aber darunter ist sie leer',
  kaputt.aufgaben < heil.aufgaben / 4,
  `${kaputt.aufgaben} gegen ${heil.aufgaben} dunkle Punkte`);

/* ==========================================================================
 * §2 · Der ganze Weg: abgelegtes PDF wird zu Seiten
 * --------------------------------------------------------------------------
 * NICHT `PdfEinlesen.alsSeiten` direkt aufrufen. Das prüfte den Umwandler
 * und liesse die Verdrahtung offen — genau der Fehler aus E93. Hier fällt
 * die Datei auf die Seite, wie bei Redur auch.
 * ========================================================================*/
console.log('\n2 · Ein abgelegtes PDF wird zu Seiten');

const seitenId = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Schulaufgabe' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'),
  null, { timeout: 15000 });

await seite.evaluate(async (hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const datei = new File([bytes], 'schulaufgabe.pdf', { type: 'application/pdf' });
  const dt = new DataTransfer();
  dt.items.add(datei);
  /* Der Zuhörer sitzt an `#scroll`, nicht an `main` — gemessen, nicht geraten. */
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));

/* Seit E104 fragt das Einlesen nach der Anordnung. Diese Suite prüft die
   SEITEN, nicht das Nebeneinander — also „nur die Seiten". Ausdrücklich
   über die Kennung und nicht über „der erste Knopf": welcher vorn steht,
   hängt an der zuletzt getroffenen Wahl (test178 §3). */
await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');

/* Auf die Seiten MIT BILD warten. Das Bild ist der letzte Handgriff je
   Seite; die blosse Anwesenheit des Blocks ist zu früh, und der Lauf las
   dann `nr: null` aus einer Seite, die gerade erst entstand (E104). */
await seite.waitForFunction(
  () => Object.values(Store.cache.blocks || {})
    .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 3,
  null, { timeout: 60000 });

const gebaut = await seite.evaluate(async (sid: string) => {
  const kinder = (Store.getBlock(sid)?.content || [])
    .map((k: string) => Store.getBlock(k)).filter(Boolean);
  const seiten = kinder.filter((b: any) => b.type === 'pdfseite');
  const saetze = await Store.dateiAlle();
  return {
    wieViele: seiten.length,
    nummern: seiten.map((b: any) => b.nr),
    vonSeiten: seiten.map((b: any) => b.vonSeiten),
    hatBild: seiten.every((b: any) => !!b.bildDateiId),
    hatQuelle: seiten.every((b: any) => !!b.quelleId),
    eineQuelle: new Set(seiten.map((b: any) => b.quelleId)).size,
    bw: seiten[0]?.bw, bh: seiten[0]?.bh,
    quelleId: seiten[0]?.quelleId,
    /* Der Datei-Satz des Originals — und der der Seitenbilder */
    original: saetze.find((s: any) => s.id === seiten[0]?.quelleId),
    bilder: saetze.filter((s: any) => s.abgeleitet).length
  };
}, seitenId);

gleich('Drei Seitenblöcke', gebaut.wieViele, 3);
gleich('Sie kennen ihre Nummer', JSON.stringify(gebaut.nummern), '[1,2,3]');
gleich('Und wissen, wie viele es insgesamt sind',
  JSON.stringify(gebaut.vonSeiten), '[3,3,3]');
p('Jede hat ihr Bild', gebaut.hatBild);
p('Jede kennt das Original', gebaut.hatQuelle);
gleich('Und es ist für alle dasselbe', gebaut.eineQuelle, 1);
p('Die Seitenmasse stehen am Block',
  Math.abs(Number(gebaut.bw) - 595) < 2 && Math.abs(Number(gebaut.bh) - 842) < 2,
  gebaut.bw + ' × ' + gebaut.bh);
gleich('Das Original liegt als Anhang', gebaut.original?.name, 'schulaufgabe.pdf');
p('Und ist NICHT als abgeleitet abgestempelt', !gebaut.original?.abgeleitet);
gleich('Die drei Seitenbilder schon', gebaut.bilder, 3);

/* ==========================================================================
 * §3 · Das Original bleibt Byte für Byte
 * ========================================================================*/
console.log('\n3 · Das Original bleibt Byte für Byte');

const zurueck = await seite.evaluate(async (id: string) => {
  const blob = await Dateien.alsBlob(id);
  if (!blob) return null;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const summe = await crypto.subtle.digest('SHA-256', bytes);
  return {
    groesse: bytes.length,
    summe: Array.from(new Uint8Array(summe))
      .map(b => b.toString(16).padStart(2, '0')).join('')
  };
}, gebaut.quelleId as string);

gleich('Gleich viele Bytes', zurueck?.groesse, PDF.length);
gleich('Gleiche Prüfsumme', zurueck?.summe, PDF_SUMME);

/* GEGENPROBE — ein Vergleich, der immer stimmt, prüft nichts. */
const anders = Buffer.from(PDF); anders[500] = anders[500]! ^ 0x01;
p('Gegenprobe: ein verändertes PDF hätte eine andere Summe',
  crypto.createHash('sha256').update(anders).digest('hex') !== PDF_SUMME);

/* ==========================================================================
 * §4 · Ein Strich liegt bei jeder Breite an derselben Stelle
 * --------------------------------------------------------------------------
 * Dieselbe Frage wie beim A4-Blatt (E100/test174), jetzt über einem
 * PDF-Untergrund: die Schicht rechnet in SEITENPUNKTEN, nicht in
 * Bildschirmpunkten. Wer in Bildschirmpunkten rechnet, hat bei halber
 * Fensterbreite jeden Strich doppelt so weit rechts — ohne Fehler, ohne
 * Meldung, nur verrutscht.
 * ========================================================================*/
console.log('\n4 · Ein Strich liegt bei jeder Breite an derselben Stelle');

/* SEIT E464 zeigt die Blattleiste im Schreibstudio ihre Werkzeuge erst hinter
   „···" (die Zeichenleiste darüber führt sie). Erst aufklappen, dann warten. */
await seite.evaluate(() => (document.querySelector('[data-document-action="ink-options"]') as HTMLElement | null)?.click());
await seite.waitForSelector('.pdfs .blatt-werk [data-wz="stift"]', { timeout: 15000 });
await seite.evaluate(() => {
  const knopf = document.querySelector('.pdfs .blatt-werk [data-wz="stift"]') as HTMLElement;
  knopf?.click();
});
/* Erst wenn die Schicht Zeiger annimmt, kommt ein Strich zustande. Vorher
   zu malen hiesse, auf gut Glück zu klicken. */
await seite.waitForFunction(() => {
  const svg = document.querySelector('.pdfs svg.blatt-marken');
  return !!svg && getComputedStyle(svg).pointerEvents !== 'none';
}, null, { timeout: 15000 });

const malen = async (): Promise<void> => {
  const flaeche = seite.locator('.pdfs svg.blatt-marken').first();
  const k = await flaeche.boundingBox();
  if (!k) throw new Error('Die Zeichenschicht ist nicht da.');
  /* Kurze Wege quer über das obere Drittel — eine A4-Seite ist hoch, und
     ein Strich bei 0,8 der Höhe läge ausserhalb des Fensters (test174). */
  await seite.mouse.move(k.x + k.width * 0.25, k.y + k.height * 0.12);
  await seite.mouse.down();
  await seite.mouse.move(k.x + k.width * 0.50, k.y + k.height * 0.18, { steps: 8 });
  await seite.mouse.move(k.x + k.width * 0.75, k.y + k.height * 0.12, { steps: 8 });
  await seite.mouse.up();
};
await malen();
/* Auf den STRICH warten, nicht auf die Uhr. Eine feste Wartezeit ist unter
   Last die halbe Wahrheit: sie besteht auf einem ruhigen Rechner und fällt
   durch, wenn nebenher zehn Browser laufen — und dann sucht man den Fehler
   im Blattraum statt in der Prüfung (E82). */
await seite.waitForFunction(() => {
  const b = Object.values(Store.cache.blocks || {})
    .find((x: any) => x.type === 'pdfseite' && x.nr === 1) as any;
  return (b?.marken || []).length >= 1;
}, null, { timeout: 15000 });

const nachDemMalen = await seite.evaluate(() => {
  const b = Object.values(Store.cache.blocks || {})
    .find((x: any) => x.type === 'pdfseite' && x.nr === 1) as any;
  const m = (b?.marken || [])[0];
  return {
    striche: (b?.marken || []).length,
    punkte: m?.pts?.length || 0,
    ersterX: m?.pts?.[0]?.[0], ersterY: m?.pts?.[0]?.[1],
    raum: b?.raumVersion,
    /* Wo liegt der Strich auf dem BILDSCHIRM — und wie breit ist die Fläche?
       Diese zwei Zahlen sind der Gegenprobe-Arm weiter unten. */
    aufDemSchirm: (() => {
      const svg = document.querySelector('.pdfs svg.blatt-marken') as SVGSVGElement;
      const pfad = svg?.querySelector('path[data-sid]');
      return pfad
        ? Math.round(pfad.getBoundingClientRect().x - svg.getBoundingClientRect().x)
        : -1;
    })(),
    breiteAufDemSchirm: Math.round(document.querySelector('.pdfs svg.blatt-marken')!
      .getBoundingClientRect().width)
  };
});

gleich('Ein Strich ist gespeichert', nachDemMalen.striche, 1);
p('Mit mehreren Punkten', nachDemMalen.punkte >= 3, String(nachDemMalen.punkte));
p('Der erste Punkt liegt bei rund einem Viertel der Seitenbreite',
  Math.abs(Number(nachDemMalen.ersterX) - 595 * 0.25) < 20,
  'ist ' + nachDemMalen.ersterX);
p('Die Raumfassung steht am Block', Number(nachDemMalen.raum) >= 1);

/* ERST AUS DEM DOKUMENTMODUS HERAUS (E296).
   Seit E296 steht eine frisch eingelesene PDF als DOKUMENT offen, und dort
   hängt die Blattbreite an der HÖHE: sie wird so gerechnet, dass die ganze
   Seite ins Bild passt. Zwischen 1400×900 und 390×900 ändert sich die Höhe
   aber kaum — gemessen 432 px gegen 354 px statt 708 gegen 334.

   Für diesen Abschnitt ist das die falsche Umgebung. Er will beweisen, dass
   die Marken in BLATTKOORDINATEN gespeichert sind und nicht in
   Bildschirmpunkten, und dafür braucht die Gegenprobe unten zwei DEUTLICH
   verschiedene Blattbreiten. Die gibt es auf der gewöhnlichen Seite, wo die
   Breite mit dem Fenster geht. Dass es im Dokumentmodus auch stimmt, misst
   der Zusatz ganz am Ende dieses Abschnitts. */
await seite.evaluate(() => {
  const p = Store.getBlock(App.aktuelleSeite());
  if (p) Store.updateBlock(p.id, { dokumentModus: false });
  App.zeichneSeite();
});
await seite.waitForTimeout(500);

/* Jetzt auf Telefonbreite und NEU ZEICHNEN.
   700 px wäre die falsche Wahl gewesen: dort klappt die Seitenleiste zu, und
   die Blattfläche wird dadurch fast so breit wie bei 1400 (644 gegen 708 px
   gemessen). Bei 390 px sind es 334 — gut die Hälfte, und damit ein
   Unterschied, an dem ein Fehler sich zeigen MUSS. */
await seite.setViewportSize({ width: 390, height: 900 });
await seite.evaluate(() => App.zeichneSeite());
await seite.waitForFunction(
  () => !!document.querySelector('.pdfs svg.blatt-marken path[data-sid]'),
  null, { timeout: 15000 });

const schmal = await seite.evaluate(() => {
  const b = Object.values(Store.cache.blocks || {})
    .find((x: any) => x.type === 'pdfseite' && x.nr === 1) as any;
  const pfad = document.querySelector('.pdfs svg.blatt-marken path[data-sid]');
  const svg = document.querySelector('.pdfs svg.blatt-marken') as SVGSVGElement;
  return {
    ersterX: (b?.marken || [])[0]?.pts?.[0]?.[0],
    gezeichnet: !!pfad,
    /* Der Punkt in Bildschirmkoordinaten bei der NEUEN Breite */
    aufDemSchirm: pfad
      ? Math.round(pfad.getBoundingClientRect().x - svg.getBoundingClientRect().x)
      : -1,
    breiteAufDemSchirm: Math.round(svg.getBoundingClientRect().width)
  };
});

gleich('Der gespeicherte Punkt hat sich NICHT geändert',
  schmal.ersterX, nachDemMalen.ersterX);
p('Der Strich ist auch schmal noch gezeichnet', schmal.gezeichnet);

/* GEGENPROBE — DER PUNKT, AN DEM DIESE SUITE ETWAS BEWEIST.
   Der Strich steht auf dem Bildschirm jetzt WOANDERS: die Fläche ist halb so
   breit, also liegt er halb so weit rechts. Wären in `pts` Bildschirmpunkte
   gespeichert, hiesse „gleicher gespeicherter Wert" damit „andere Stelle der
   Seite" — der Strich wäre verrutscht, ohne Fehler und ohne Meldung.
   Die zwei Punkte unten sagen zusammen: der Bildschirmwert HAT sich geändert,
   der gespeicherte NICHT. Nur beides zusammen ist eine Aussage. */
p('Gegenprobe: auf dem Bildschirm liegt er jetzt woanders',
  Math.abs(schmal.aufDemSchirm - nachDemMalen.aufDemSchirm) > 20,
  `${nachDemMalen.aufDemSchirm} px bei ${nachDemMalen.breiteAufDemSchirm} px Blatt, ` +
  `${schmal.aufDemSchirm} px bei ${schmal.breiteAufDemSchirm} px`);
p('Und zwar ungefähr im Verhältnis der zwei Breiten',
  Math.abs(schmal.aufDemSchirm / nachDemMalen.aufDemSchirm -
           schmal.breiteAufDemSchirm / nachDemMalen.breiteAufDemSchirm) < 0.08);

/* UND IM DOKUMENTMODUS GILT DASSELBE (E296).
   Der Abschnitt oben misst auf der gewöhnlichen Seite, weil er dort zwei
   stark verschiedene Breiten bekommt. Die zweite Umgebung darf deshalb
   nicht ungeprüft bleiben — dort liegt seit E296 eine frisch eingelesene
   PDF, also der Normalfall. Dieselbe Marke, dritte Breite, gespeicherter
   Wert unverändert. */
await seite.setViewportSize({ width: 1400, height: 900 });
const imDokument = await seite.evaluate(async () => {
  const p = Store.getBlock(App.aktuelleSeite());
  if (p) Store.updateBlock(p.id, { dokumentModus: true });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const b = Object.values(Store.cache.blocks || {})
    .find((x: any) => x.type === 'pdfseite' && x.nr === 1) as any;
  const pfad = document.querySelector('.document-stage .blatt-marken path[data-sid]');
  const svg = document.querySelector('.document-stage .blatt-marken') as SVGSVGElement | null;
  return {
    imModus: !!document.querySelector('.document-workspace'),
    ersterX: (b?.marken || [])[0]?.pts?.[0]?.[0],
    gezeichnet: !!pfad,
    box: svg?.getAttribute('viewBox') || '',
    breite: Math.round(svg?.getBoundingClientRect().width || 0)
  };
});

p('Im Dokumentmodus steht der Arbeitsraum', imDokument.imModus);
p('Der Strich ist auch dort gezeichnet', imDokument.gezeichnet);
gleich('Und der gespeicherte Punkt ist immer noch derselbe',
  imDokument.ersterX, nachDemMalen.ersterX);
gleich('Die Schicht spannt dort denselben Blattraum auf',
  imDokument.box, '0 0 595 842');
p('Bei einer dritten, wieder anderen Breite',
  imDokument.breite > 0 &&
  Math.abs(imDokument.breite - schmal.breiteAufDemSchirm) > 20,
  `${imDokument.breite} px gegen ${schmal.breiteAufDemSchirm} px`);
p('Gemessen in Seitenpunkten liegt er gleich',
  Number(schmal.ersterX) === Number(nachDemMalen.ersterX));

await seite.setViewportSize({ width: 1400, height: 900 });
await seite.evaluate(() => App.zeichneSeite());
await seite.waitForFunction(
  () => !!document.querySelector('.pdfs svg.blatt-marken path[data-sid]'),
  null, { timeout: 15000 });

/* ==========================================================================
 * §5 · Abgeleitetes bleibt aus der Sicherung draussen — das Original nicht
 * ========================================================================*/
console.log('\n5 · Abgeleitetes bleibt aus der Sicherung draussen');

/* Ein GEWÖHNLICHER Anhang auf derselben Seite. Er ist der Gegenprobe-Arm:
   ohne ihn liesse sich nicht unterscheiden, ob die Sicherung zielt oder ob
   sie einfach keine Anhänge mehr schreibt. */
await seite.evaluate(async (sid: string) => {
  const b = Store.addBlock(sid, 'file', { text: 'notizen.txt' });
  const datei = new File([new Uint8Array(4096).fill(65)], 'notizen.txt',
    { type: 'text/plain' });
  await Dateien.ablegen(datei, { blockId: b.id });
}, seitenId);

const imArchiv = await seite.evaluate(async () => {
  /* Denselben Weg gehen wie die Sicherung: gefilterte Sätze holen und
     schauen, was ins Archiv käme. */
  const saetze = (await Store.dateiAlle()).filter((s: any) => !(s && s.abgeleitet));
  const alle = await Store.dateiAlle();
  return {
    imArchiv: saetze.map((s: any) => s.name).sort(),
    insgesamt: alle.length,
    bytesGesamt: alle.reduce((s: number, d: any) => s + (d.groesse || 0), 0),
    bytesImArchiv: saetze.reduce((s: number, d: any) => s + (d.groesse || 0), 0)
  };
});

p('Das Original-PDF ist in der Sicherung',
  imArchiv.imArchiv.includes('schulaufgabe.pdf'));
p('Gegenprobe: ein gewöhnlicher Anhang ist auch drin',
  imArchiv.imArchiv.includes('notizen.txt'));
p('Die Seitenbilder aber nicht',
  !imArchiv.imArchiv.some((n: string) => /\.webp$/.test(n)),
  imArchiv.imArchiv.join(', '));
gleich('Genau zwei Anhänge also', imArchiv.imArchiv.length, 2);
gleich('Von fünf abgelegten Dateien', imArchiv.insgesamt, 5);
p('Und die Sicherung ist dadurch spürbar kleiner',
  imArchiv.bytesImArchiv < imArchiv.bytesGesamt * 0.5,
  `${imArchiv.bytesImArchiv} von ${imArchiv.bytesGesamt} Bytes`);

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const leser = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/leser.ts'), 'utf8'));
p('pdf.js darf keinen Code auswerten (§19)',
  /isEvalSupported:\s*false/.test(leser));
p('Die Leinwand wird nach dem Zeichnen genullt',
  /leinwand\.width\s*=\s*0/.test(leser));

const sicherung = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf8'));
p('Die Sicherung filtert Abgeleitetes schon beim Holen',
  /dateiAlle\(\)\)?\s*\)?\s*\n?\s*\.filter\([^)]*abgeleitet/.test(sicherung) ||
  /filter\(\(s: any\) => !\(s && s\.abgeleitet\)\)/.test(sicherung));

const abgleich = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/kern/abgleich/maschine.ts'), 'utf8'));
p('Der Abgleich schickt Abgeleitetes nicht zum Server',
  /if\s*\(d\.abgeleitet\)\s*continue/.test(abgleich));

/* ==========================================================================
 * §7 · Und das alles auch per Doppelklick (§29)
 * --------------------------------------------------------------------------
 * DER PUNKT, DEN KEINE DER SECHS OBEN ABDECKT. Über `http://` läuft alles;
 * `file://` ist ein anderer Ort. Der Lader packt die Bibliothek in eine
 * Blob-Adresse und holt sie mit `import()` — und Blob-Adressen, dynamische
 * Importe und Arbeiter sind genau die drei Dinge, die ein Browser ohne
 * Herkunft gern verweigert. Ginge das schief, liefe die Einzeldatei weiter
 * und nur die PDFs nicht: ein stiller Ausfall in der Startart, die Redion
 * ausdrücklich verspricht.
 *
 * Wie test74 wird NUR die Einzeldatei in einen leeren Ordner kopiert. Läge
 * `quell/` daneben, bewiese der Lauf nichts.
 * ========================================================================*/
console.log('\n7 · Und das alles auch per Doppelklick (§29)');

const EINZEL = path.join(WURZEL, 'redion-einzeldatei.html');
p('Die Einzeldatei ist gebaut', fs.existsSync(EINZEL));

if (fs.existsSync(EINZEL)) {
  const allein = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-pdf-'));
  fs.copyFileSync(EINZEL, path.join(allein, 'redion-einzeldatei.html'));

  const doppelklick = await browser.newPage();
  const fehlerDort: string[] = [];
  doppelklick.on('pageerror', e => fehlerDort.push(e.message));
  await doppelklick.setViewportSize({ width: 1400, height: 900 });
  await doppelklick.goto('file://' + path.join(allein, 'redion-einzeldatei.html'));
  await doppelklick.waitForTimeout(2600);

  const alleinGelesen = await doppelklick.evaluate(async (hex: string) => {
    try {
      const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
      const griff = await PdfLeser.oeffne(bytes);
      const bild = await griff.alsBild(1, 600);
      griff.schliessen();
      return { seiten: griff.seiten, bytesImBild: bild.size, fehler: '' };
    } catch (e: unknown) {
      return { seiten: -1, bytesImBild: 0,
               fehler: e instanceof Error ? e.message : String(e) };
    }
  }, PDF.toString('hex'));

  p('Die eingepackte Bibliothek packt sich auch dort aus',
    alleinGelesen.fehler === '', alleinGelesen.fehler);
  gleich('Drei Seiten, auch ohne Herkunft', alleinGelesen.seiten, 3);
  p('Und die Seite wird wirklich gezeichnet',
    alleinGelesen.bytesImBild > 500, alleinGelesen.bytesImBild + ' Bytes');
  p('Ohne Fehler auf der Seite', fehlerDort.length === 0, fehlerDort.join(' | '));

  await doppelklick.close();
  fs.rmSync(allein, { recursive: true, force: true });
}

/* ==========================================================================
 * Schluss
 * ========================================================================*/
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
