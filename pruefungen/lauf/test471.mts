/* Suite 471 — Das eigene Formelheft liegt über dem Dokument (E503)
 * ============================================================================
 * Redur, 8. September, auf die Frage, was mit seinem eigenen Heft gehen soll:
 *
 *   „Also so die Original bleibt, und wo — wenn beim Elektro, wo die
 *    Elektrosymbol ist — beim Dokument arbeiten, die im PDF dort sehen kann,
 *    so dass ich es schieben, kleiner grösser machen kann direkt auf dem PDF
 *    und ein oder aus halten können."
 *
 * Vier Dinge stehen darin, und drei davon konnte Redion nicht:
 *
 *   §1 EIN KNOPF IM STUDIO, NEBEN DEM FACHZEICHEN. Das Formelheft stand nur
 *      in der Befehlspalette (Strg K) und auf der Planfläche. Wer im Dokument
 *      arbeitet, findet es dort nicht — und genau dort wird nachgeschlagen.
 *   §2 EIN UND AUS, UND DER KNOPF SAGT ES. Auch wenn das Fenster auf einem
 *      anderen Weg zugeht (Escape, das ✕), muss der Knopf es merken.
 *   §3 ÜBER DEM DOKUMENT, SCHIEBBAR UND ZIEHBAR. Es liegt über der Seite,
 *      nicht darunter, und Ort und Grösse überleben das Schliessen.
 *   §4 DAS EIGENE HEFT KOMMT ZURÜCK, nicht das Kapitelverzeichnis. Bis hier
 *      war „Mein Heft" eine Sitzungssache: bei jedem Öffnen stand wieder die
 *      Formelliste da, und man musste sich durchklicken.
 *   §5 DAS ORIGINAL BLEIBT ORIGINAL. Nichts wird in die geladene PDF
 *      geschrieben — nach Blättern, Schieben, Ziehen und Schliessen stehen
 *      dieselben Bytes in der Ablage (§9, §51).
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es: §1 bis §4 waren rot, weil es den Knopf nicht gab
 * und `pdfModus` eine reine Sitzungsvariable war. §5 war von Anfang an grün —
 * das ist Absicht: er hält einen Zustand, der stimmt und stimmen bleiben soll.
 * Die Gegenproben nach dem Bauen stehen in ENTSCHEIDUNGEN.md unter E503.
 *
 *   node pruefungen/lauf/test471.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Dateien: any;
declare const Formelheft: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9591;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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

/* Ein Formelheft mit drei Seiten — dieselbe Bauform wie in test437/test470. */
const pdf = (): Buffer => {
  const objs = ['<< /Type /Pages /Count 3 /Kids [4 0 R 6 0 R 8 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (let n = 1; n <= 3; n++) {
    const stream = `0.1 0.1 0.1 rg BT /F1 26 Tf 60 760 Td (Formelsammlung Seite ${n}) Tj ET\n`
      + `BT /F1 14 Tf 60 700 Td (U = R mal I) Tj ET\n`;
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};

const browser = await chromium.launch();
const fehler: string[] = [];

/**
 * Ein offenes Dokument im Studio, mit einem Blatt darin.
 *
 * `dokumentModus: true` an der Seite ist das, was das Studio einschaltet —
 * nachgesehen in `document-mode.ts`, nicht geraten (E21). Mit `heft` kommt
 * eine echte PDF als eigenes Formelheft in die Ablage, auf demselben Weg,
 * den `pdfLaden` geht: `Dateien.ablegen` und die Kennung in `meta`.
 */
const imStudio = async (heft = false): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Formelheft !== 'undefined'");
  await s.evaluate(async (bytes: number[] | null) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('elektro:heftOrt', null);
    Store.setMeta('elektro:heftAnsicht', 'kapitel');
    Store.setMeta('elektro:heftPdf', '');
    Store.setMeta('elektro:heftPdfSeite', 1);
    if (bytes) {
      const datei = new File([new Uint8Array(bytes)], 'Formelsammlung.pdf',
        { type: 'application/pdf' });
      const angelegt = await Dateien.ablegen(datei, null);
      Store.setMeta('elektro:heftPdf', angelegt.id);
    }
    const seite = Store.addPage(null, { text: 'Elektro-Skript', dokumentModus: true });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  }, heft ? [...pdf()] : null);
  await s.waitForSelector('.document-drawingbar [data-document-tool="zeichen"]', { timeout: 20000 });
  await s.waitForTimeout(500);
  return s;
};

/* ═══ §1 Der Knopf steht neben dem Fachzeichen ═════════════════════════════ */
console.log('\n§1 Ein Knopf im Studio, neben dem Fachzeichen');
{
  const s = await imStudio();
  const r = JSON.parse(await s.evaluate(`(() => {
    const leiste = document.querySelector('.document-drawingbar');
    const knopf = leiste.querySelector('[data-document-action="formelheft"]');
    const zeichen = leiste.querySelector('[data-document-tool="zeichen"]');
    if (!knopf) return JSON.stringify({ da: false });
    const kr = knopf.getBoundingClientRect(), zr = zeichen.getBoundingClientRect();
    return JSON.stringify({
      da: true,
      nachbar: zeichen.nextElementSibling === knopf,
      name: knopf.getAttribute('aria-label') || '',
      titel: knopf.title || '',
      gedrueckt: knopf.getAttribute('aria-pressed'),
      breite: Math.round(kr.width * 10) / 10, hoehe: Math.round(kr.height * 10) / 10,
      wieNachbar: Math.round(kr.height) === Math.round(zr.height),
      zeichen: !!knopf.querySelector('[data-sym], svg')
    });
  })()`) as string);
  p('Es gibt einen Formelheft-Knopf in der Zeichenleiste des Studios', r.da);
  p('… und er steht direkt neben dem Fachzeichen', r.nachbar);
  p('… er hat einen lesbaren Namen (§38)', /Formelheft/i.test(r.name || ''), r.name);
  p('… der Titel sagt, dass es das eigene Heft ist', /eigen/i.test(r.titel || ''), r.titel);
  p('… er sagt seinen Zustand nicht nur mit Farbe (§38)', r.gedrueckt === 'false', String(r.gedrueckt));
  p('… er ist so gross wie seine Nachbarn', r.wieNachbar, `${r.hoehe} px`);
  p('… und trägt ein Zeichen, keinen nackten Text', r.zeichen);
  await s.close();
}

/* ═══ §2 Ein und aus ═══════════════════════════════════════════════════════ */
console.log('\n§2 Ein und aus — und der Knopf sagt es');
{
  const s = await imStudio();
  const knopf = '.document-drawingbar [data-document-action="formelheft"]';
  await s.click(knopf);
  await s.waitForTimeout(300);
  const auf = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('${knopf}');
    /* getComputedStyle gibt ein LEBENDES Objekt — die Werte werden hier
       sofort abgeschrieben, sonst zeigen sie später den nächsten Zustand. */
    const st = getComputedStyle(k);
    return JSON.stringify({
      offen: !!document.querySelector('.fh-fenster'),
      gedrueckt: k.getAttribute('aria-pressed'),
      grund: String(st.backgroundColor)
    });
  })()`) as string);
  p('Ein Tipp öffnet das Heft', auf.offen);
  p('… und der Knopf steht auf gedrückt (§38: nicht nur Farbe)', auf.gedrueckt === 'true');
  p('… und man SIEHT es auch — der Grund ist nicht mehr durchsichtig',
    !!auf.grund && !/rgba\(0, 0, 0, 0\)|transparent/.test(auf.grund), auf.grund);

  await s.click(knopf);
  await s.waitForTimeout(250);
  const zu = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    offen: !!document.querySelector('.fh-fenster'),
    gedrueckt: document.querySelector('${knopf}').getAttribute('aria-pressed')
  }))()`) as string);
  p('Ein zweiter Tipp schliesst es', !zu.offen);
  p('… und der Knopf ist wieder losgelassen', zu.gedrueckt === 'false');

  /* Und der Weg, der bis hierher nicht zu sehen war: das Fenster geht
     über sein eigenes ✕ zu, und der Knopf in der Leiste muss es merken. */
  await s.click(knopf);
  await s.waitForTimeout(300);
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="zu"]').click()`);
  await s.waitForTimeout(250);
  const fremd = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    offen: !!document.querySelector('.fh-fenster'),
    gedrueckt: document.querySelector('${knopf}').getAttribute('aria-pressed')
  }))()`) as string);
  p('Das ✕ im Heft schliesst es auch', !fremd.offen);
  p('… und der Knopf merkt es (§8: ein Zustand, nicht zwei)', fremd.gedrueckt === 'false');
  await s.close();
}

/* ═══ §3 Über dem Dokument, schiebbar und ziehbar ══════════════════════════ */
console.log('\n§3 Es liegt über dem Dokument — schieben und ziehen');
{
  const s = await imStudio();
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(350);
  const r = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.fh-fenster');
    const r0 = f.getBoundingClientRect();
    /* Liegt es WIRKLICH oben? Der Punkt in seiner Kopfzeile muss das
       Fenster treffen und nicht die Seite darunter. */
    const treffer = document.elementFromPoint(Math.round(r0.left + r0.width / 2),
                                              Math.round(r0.top + 14));
    const ev = (ziel, typ, x, y, buttons) => ziel.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons }));
    const kopf = f.querySelector('[data-griff]');
    ev(kopf, 'pointerdown', r0.left + 70, r0.top + 12, 1);
    ev(f, 'pointermove', r0.left + 70 - 240, r0.top + 12 + 70, 1);
    ev(f, 'pointerup', r0.left + 70 - 240, r0.top + 12 + 70, 0);
    const r1 = f.getBoundingClientRect();
    const griff = f.querySelector('.fh-groesse');
    const g = griff.getBoundingClientRect();
    ev(griff, 'pointerdown', g.left + 4, g.top + 4, 1);
    ev(f, 'pointermove', g.left + 4 + 130, g.top + 4 + 100, 1);
    ev(f, 'pointerup', g.left + 4 + 130, g.top + 4 + 100, 0);
    const r2 = f.getBoundingClientRect();
    return JSON.stringify({
      imHeft: !!(treffer && treffer.closest('.fh-fenster')),
      x0: Math.round(r0.left), x1: Math.round(r1.left),
      w1: Math.round(r1.width), w2: Math.round(r2.width),
      h1: Math.round(r1.height), h2: Math.round(r2.height),
      gemerkt: Store.getMeta('elektro:heftOrt', null)
    });
  })()`) as string);
  p('Das Heft liegt über der Dokumentseite, nicht darunter', r.imHeft);
  p('Schieben bewegt es wirklich', r.x1 < r.x0 - 150, `${r.x0} → ${r.x1}`);
  p('Ziehen macht es breiter', r.w2 > r.w1 + 80, `${r.w1} → ${r.w2}`);
  p('… und höher', r.h2 > r.h1 + 60, `${r.h1} → ${r.h2}`);
  p('Ort und Grösse werden gemerkt', !!r.gemerkt && r.gemerkt.w === r.w2,
    JSON.stringify(r.gemerkt));

  /* Zu und wieder auf: es steht, wo es stand. */
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(200);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(350);
  const wieder = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.fh-fenster').getBoundingClientRect();
    return JSON.stringify({ x: Math.round(f.left), w: Math.round(f.width), h: Math.round(f.height) });
  })()`) as string);
  gleich('Nach dem Wiederöffnen steht es am selben Ort', wieder.x, r.x1);
  gleich('… und in derselben Grösse', [wieder.w, wieder.h], [r.w2, r.h2]);
  await s.close();
}

/* ═══ §4 Das eigene Heft kommt zurück ══════════════════════════════════════ */
console.log('\n§4 Das eigene Heft kommt zurück, nicht das Kapitelverzeichnis');
{
  const s = await imStudio(true);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(400);
  /* Auf „Mein Heft" umschalten und eine Seite weiterblättern. */
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="pdf"]').click()`);
  await s.waitForSelector('.fh-pdf img', { timeout: 20000 });
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="vor"]').click()`);
  await s.waitForTimeout(900);
  const drin = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    seite: Number(Store.getMeta('elektro:heftPdfSeite', 1)),
    ansicht: String(Store.getMeta('elektro:heftAnsicht', 'kapitel')),
    bild: !!document.querySelector('.fh-pdf img')
  }))()`) as string);
  p('Im eigenen Heft steht eine gezeichnete Seite', drin.bild);
  gleich('Blättern merkt sich die Seite', drin.seite, 2);
  gleich('… und die Ansicht merkt sich, dass das eigene Heft offen war',
    drin.ansicht, 'pdf');

  /* Zu und wieder auf — und es steht wieder das eigene Heft da. */
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(250);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForSelector('.fh-pdf img', { timeout: 20000 });
  const zurueck = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.fh-fenster');
    return JSON.stringify({
      pdfAn: f.querySelector('[data-a="pdf"]').classList.contains('an'),
      bild: !!f.querySelector('.fh-pdf img'),
      nr: Number(f.querySelector('.fh-nr')?.value || 0),
      kapitelband: !!f.querySelector('.fh-kapitel')
    });
  })()`) as string);
  p('Nach dem Wiederöffnen steht das eigene Heft da', zurueck.bild && zurueck.pdfAn);
  gleich('… auf der Seite, auf der man war', zurueck.nr, 2);
  p('… und nicht das Kapitelverzeichnis', !zurueck.kapitelband);

  /* UND DIE GEGENRICHTUNG: wer sein Heft über ⤒ löst, soll beim nächsten
     Öffnen bei den FORMELN landen — nicht auf einer Einladung, die er
     kennt. Gemerkt wird die Ansicht, gezeigt nur, solange es ein Heft gibt. */
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="loesen"]').click()`);
  await s.waitForTimeout(400);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(250);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(400);
  const ohne = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.fh-fenster');
    return JSON.stringify({
      kapitelband: !!f.querySelector('.fh-kapitel'),
      einladung: !!f.querySelector('[data-a="laden"]'),
      gemerkt: String(Store.getMeta('elektro:heftAnsicht', 'kapitel'))
    });
  })()`) as string);
  p('Ohne eigenes Heft steht wieder die Formelliste da', ohne.kapitelband);
  p('… und nicht die Einladung zum Laden', !ohne.einladung);
  await s.close();
}

/* ═══ §5 Das Original bleibt Original ══════════════════════════════════════ */
console.log('\n§5 Das Original bleibt Original');
{
  const s = await imStudio(true);
  const vorher = await s.evaluate(async () => {
    const id = String(Store.getMeta('elektro:heftPdf', ''));
    const blob = await Dateien.alsBlob(id);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let summe = 0;
    for (const b of bytes) summe = (summe * 31 + b) >>> 0;
    return { id, laenge: bytes.length, summe, typ: blob.type };
  });
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(350);
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="pdf"]').click()`);
  await s.waitForSelector('.fh-pdf img', { timeout: 20000 });
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="vor"]').click()`);
  await s.waitForTimeout(800);
  await s.evaluate(`document.querySelector('.fh-fenster [data-a="seitefav"]').click()`);
  await s.waitForTimeout(500);
  await s.click('.document-drawingbar [data-document-action="formelheft"]');
  await s.waitForTimeout(300);
  const nachher = await s.evaluate(async () => {
    const id = String(Store.getMeta('elektro:heftPdf', ''));
    const blob = await Dateien.alsBlob(id);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let summe = 0;
    for (const b of bytes) summe = (summe * 31 + b) >>> 0;
    return { id, laenge: bytes.length, summe, typ: blob.type };
  });
  gleich('Die Datei hat dieselbe Kennung', nachher.id, vorher.id);
  gleich('… dieselbe Länge', nachher.laenge, vorher.laenge);
  gleich('… dieselbe Prüfsumme (Byte für Byte unverändert)', nachher.summe, vorher.summe);
  gleich('… und denselben Typ', nachher.typ, vorher.typ);
  p('Es ist wirklich eine PDF mit Inhalt', vorher.laenge > 500 && vorher.typ === 'application/pdf',
    `${vorher.laenge} Bytes, ${vorher.typ}`);
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const dm = lies('src/bereiche/pdf/document-mode.ts');
  const fh = lies('src/bereiche/elektro/formelheft.ts');
  const dmJs = lies('quell/bereiche/pdf/document-mode.js');
  const fhJs = lies('quell/bereiche/elektro/formelheft.js');
  p('Der Knopf steht im Studio, nicht in einem zweiten Katalog (§8)',
    dm.includes("'formelheft'") && !/const\s+formelheftKatalog/.test(dm));
  p('Das Heft sagt Bescheid, statt dass die Leiste pollt',
    /horche/.test(fh) && /Formelheft\.horche/.test(dm));
  p('Die Ansicht „eigenes Heft" wird gemerkt, nicht nur gedacht',
    /M_ANSICHT[\s\S]{0,600}'pdf'/.test(fh) || /'pdf'[\s\S]{0,400}M_ANSICHT/.test(fh));
  p('Das erzeugte JS trägt beides', dmJs.includes('formelheft') && fhJs.includes('horche'));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
