/* Suite 146 — Die Seitenbilder kommen aus dem Original zurück (E106)
 * ============================================================================
 * E103 lässt die gerasterten Seitenbilder bewusst aus der Sicherung heraus:
 * 200 KB je Seite, bei einem Skript mit 500 Seiten hundert Megabyte in JEDER
 * `.redion` — für etwas, das sich neu rechnen lässt.
 *
 * „LÄSST SICH" WAR ABER KEIN WEG. Nichts stellte sie wieder her. Wer eine
 * Sicherung einspielte, bekam sein Skript zurück — die Marken darauf, die
 * Notizblätter daneben, das Original als Anhang — und lauter leere Seiten mit
 * dem Satz „Für diese Seite gibt es noch kein Bild." Ein Hinweis ohne Ausweg,
 * und damit stand in E103 und in der README ein Versprechen, das der Code
 * nicht hielt.
 *
 * DIESE SUITE FÄHRT DEN GANZEN RING AB, weil nur er die Frage beantwortet:
 *
 *     PDF einlesen  →  darauf malen  →  sichern  →  ALLES LÖSCHEN
 *                   →  einspielen    →  zurückholen  →  wieder da?
 *
 * Ein Prüflauf, der nur `neuBerechnen` aufruft, prüfte die Rechnung. Was hier
 * zählt, ist, dass nach einer echten Sicherung genug übrig ist, um sie
 * überhaupt anstellen zu können — das Original, die Nummer, die Masse und die
 * Marken. Fehlt eines davon, ist die Sicherung eine halbe (E93).
 *
 *   node pruefungen/lauf/test180.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8925;

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

/* Ein PDF von Hand — zwei Seiten, damit „alle auf einmal" etwas heisst. */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const machPdf = (titel: string[]): Buffer => {
  const o: Buffer[] = [];
  const neu = (c: Buffer | string): number => {
    o.push(Buffer.isBuffer(c) ? c : Buffer.from(c, 'latin1')); return o.length; };
  const sn = neu('');
  const sch = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const t of titel) {
    const roh = Buffer.from(
      `BT /F1 34 Tf 60 740 Td (${alsText(t)}) Tj ET\n2 w 30 30 535 782 re S`, 'latin1');
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
  const st: number[] = [];
  o.forEach((x, i) => { st.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), x,
                         Buffer.from('\nendobj\n', 'latin1')]); });
  const xr = aus.length;
  let tab = `xref\n0 ${o.length + 1}\n0000000000 65535 f \n`;
  st.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${o.length + 1} /Root ${w} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};
const PDF = machPdf(['Kapitel Eins', 'Kapitel Zwei']);
const PDF_SUMME = crypto.createHash('sha256').update(PDF).digest('hex');

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
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Ein Skript mit Marken darauf
 * ========================================================================*/
console.log('\n1 · Ein Skript mit Marken darauf');

const sid = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Skript' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'skript.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));
await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForFunction(() => Object.values(Store.cache.blocks || {})
  .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 2,
  null, { timeout: 60000 });

/* Auf beide Seiten je einen Strich — sie sind der Beweis, dass die alten
   Masse gelten müssen: eine neu gemessene Seite verschöbe jeden Strich. */
await seite.evaluate(() => {
  (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .forEach((b, i) => Store.updateBlock(b.id, {
      marken: [{ id: 'm' + i, art: 'stift', farbe: '#d64545', breite: 2.4,
                 pts: [[100, 200 + i * 10], [400, 260 + i * 10]] }],
      raumVersion: SheetSpace.RAUM_VERSION }));
});

const vorher = await seite.evaluate(async () => {
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .sort((a, b) => a.nr - b.nr);
  const saetze = await Store.dateiAlle();
  return {
    wieViele: seiten.length,
    nummern: seiten.map(b => b.nr),
    masse: seiten.map(b => b.bw + '×' + b.bh),
    marken: seiten.map(b => JSON.stringify(b.marken)),
    quelleId: seiten[0]?.quelleId,
    bilder: saetze.filter((x: any) => x.abgeleitet).length,
    dateien: saetze.length
  };
});

gleich('Zwei Seiten', vorher.wieViele, 2);
gleich('Mit Bildern in der Ablage', vorher.bilder, 2);
gleich('Drei Dateien insgesamt — Original und zwei Bilder', vorher.dateien, 3);
p('Und auf jeder Seite ein Strich',
  vorher.marken.every((m: string) => m && m !== 'null' && m !== '[]'));

/* ==========================================================================
 * §2 · Sichern, alles löschen, einspielen
 * --------------------------------------------------------------------------
 * Über `Store.exportAll` und `importAll` — denselben Weg, den die `.redion`
 * für `daten.json` geht. Die Anhänge werden von Hand nachgezogen, weil das
 * Herunterladen und Wiederauswählen einer Datei im Prüfstand nicht geht.
 * WICHTIG ist dabei: die abgeleiteten Bilder werden NICHT mitgenommen —
 * genau das tut die echte Sicherung auch (E103), und genau darum geht es.
 * ========================================================================*/
console.log('\n2 · Sichern, alles löschen, einspielen');

const gesichert = await seite.evaluate(async () => {
  const daten = Store.exportAll(true);
  /* Wie `schale.sicherungSpeichern`: Abgeleitetes bleibt draussen. */
  const saetze = (await Store.dateiAlle()).filter((s: any) => !(s && s.abgeleitet));
  const anhaenge: Array<{ satz: any; b64: string }> = [];
  for (const s of saetze) {
    const blob = await Dateien.alsBlob(s.id);
    if (!blob) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
    anhaenge.push({ satz: s, b64: btoa(bin) });
  }
  return { daten, anhaenge: JSON.stringify(anhaenge),
           anhangZahl: anhaenge.length };
});

gleich('In der Sicherung liegt genau EIN Anhang — das Original',
  gesichert.anhangZahl, 1);

const eingespielt = await seite.evaluate(async (g: any) => {
  /* Alles weg: Dateisätze und Stücke — wie beim Ersetzen in
     `anhaengeEinspielen`. */
  for (const s of await Store.dateiAlle()) {
    for (const st of await Store.stueckeVon(s.id)) await Store.stueckWeg(st.id);
    await Store.dateiWeg(s.id);
    /* Und die blob-Adresse aus dem Zwischenspeicher — genau das tut die
       Schale beim Ersetzen seit E106 auch. Ohne diese Zeile zeigte der Block
       WEITER sein altes Bild: der Speicher war leer, der Zwischenspeicher
       nicht. Der erste Entwurf dieser Prüfung liess sie weg und behauptete
       dann, es gebe kein Bild — dabei war eines zu sehen. */
    Dateien.adresseWeg(s.id);
  }
  await Store.importAll(g.daten, 'ersetzen');

  /* Die Anhänge zurück — MIT IHREN ALTEN KENNUNGEN, Stück für Stück, genau
     denselben Weg wie `anhaengeEinspielen` in der Schale (§11: bekämen sie
     neue Kennungen, wären die Dateien da und kein Block fände sie). */
  const STUECK = Dateien.STUECK;
  for (const e of JSON.parse(g.anhaenge)) {
    const roh = atob(e.b64);
    const bytes = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
    const blob = new Blob([bytes], { type: e.satz.typ });
    const teile = Math.max(1, Math.ceil(blob.size / STUECK));
    for (let nr = 0; nr < teile; nr++) {
      const von = nr * STUECK;
      await Store.stueckPut({ id: e.satz.id + ':' + nr, dateiId: e.satz.id, nr,
        blob: blob.slice(von, Math.min(von + STUECK, blob.size)) });
    }
    await Store.dateiPut(Object.assign({}, e.satz, {
      teile, angekommen: teile, zustand: 'fertig', groesse: blob.size }));
  }
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive).sort((a, b) => a.nr - b.nr);
  const saetze = await Store.dateiAlle();
  return {
    wieViele: seiten.length,
    nummern: seiten.map(b => b.nr),
    masse: seiten.map(b => b.bw + '×' + b.bh),
    marken: seiten.map(b => JSON.stringify(b.marken)),
    /* MIT LEBENDEM BILD, nicht „mit Kennung". Die Kennung steht nach dem
       Einspielen noch am Block; die Datei dahinter ist weg. */
    mitBild: (await Promise.all(seiten.map(async (b: any) => b.bildDateiId &&
      !!(await Store.dateiHolen(b.bildDateiId))))).filter(Boolean).length,
    mitKennung: seiten.filter(b => b.bildDateiId).length,
    quelleId: seiten[0]?.quelleId,
    dateien: saetze.length,
    originalDa: !!saetze.find((x: any) => x.name === 'skript.pdf')
  };
}, gesichert);

gleich('Die zwei Seiten sind zurück', eingespielt.wieViele, 2);
gleich('Mit ihren Nummern', JSON.stringify(eingespielt.nummern),
  JSON.stringify(vorher.nummern));
gleich('Und ihren Massen', JSON.stringify(eingespielt.masse),
  JSON.stringify(vorher.masse));
gleich('Die Marken sind Zeichen für Zeichen dieselben',
  JSON.stringify(eingespielt.marken), JSON.stringify(vorher.marken));
gleich('Das Original liegt wieder da', eingespielt.originalDa, true);
gleich('Nur EINE Datei — die Bilder fehlen, wie beabsichtigt',
  eingespielt.dateien, 1);
gleich('Und keine Seite hat ein lebendes Bild', eingespielt.mitBild, 0);
gleich('Die Kennungen stehen aber noch da — sie zeigen ins Leere',
  eingespielt.mitKennung, 2);

/* ==========================================================================
 * §3 · Der Hinweis ist ein Weg, kein Satz
 * ========================================================================*/
console.log('\n3 · Der Hinweis ist ein Weg, kein Satz');

await seite.evaluate((s: string) => App.oeffne(s), sid);
await seite.waitForSelector('.pdfs .pdfs-wartet', { timeout: 15000 });

const hinweis = await seite.evaluate(() => {
  const h = document.querySelector('.pdfs .pdfs-wartet')!;
  const k = h.querySelector('button.pdfs-neu') as HTMLElement | null;
  return {
    text: (h.textContent || '').replace(k?.textContent || '', '').trim(),
    knopfDa: !!k, knopfText: k?.textContent || '',
    /* Kein kaputtes Bildzeichen mehr (E105) */
    bildImDom: !!document.querySelector('.pdfs .pdfs-bild')
  };
});

/* Zwei Lagen, zwei Sätze: „kein Bild" heisst, es gab nie eines; „das
   Seitenbild fehlt" heisst, die Kennung steht da und die Datei nicht mehr —
   genau der Fall nach dem Einspielen. Beide sind richtig. */
p('Der Hinweis sagt, was los ist',
  /kein Bild|Seitenbild fehlt/i.test(hinweis.text), hinweis.text);
p('Und daneben steht ein Knopf', hinweis.knopfDa);
p('Der sagt, was er tut',
  /Original/i.test(hinweis.knopfText), hinweis.knopfText);
p('Ein leeres Bild hängt nicht mehr im Bild', !hinweis.bildImDom);

/* ==========================================================================
 * §4 · Ein Klick holt das GANZE Dokument zurück
 * ========================================================================*/
console.log('\n4 · Ein Klick holt das GANZE Dokument zurück');

/* Die alten, toten Kennungen merken — sie sind das Mass für „fertig". */
const alteKennungen = await seite.evaluate(() =>
  (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .sort((a, b) => a.nr - b.nr).map(b => String(b.bildDateiId || '')));

await seite.click('.pdfs .pdfs-neu');

/* GEWARTET WIRD AUF EINE ÄNDERUNG DER KENNUNG, und zwar SYNCHRON.
   Zwei Fallen liegen hier, und die Prüfung ist in beide getreten:
   · „hat eine Kennung" ist sofort wahr — die toten stehen ja noch da;
   · eine `async`-Bedingung gibt ein Versprechen zurück, und ein Versprechen
     ist immer wahr. `waitForFunction` war damit sofort zufrieden und mass
     den Zustand VOR dem Zurückholen.
   Eine neue Kennung je Seite ist beides nicht: sie ist der letzte Handgriff
   und synchron ablesbar. */
await seite.waitForFunction((alt: string[]) => {
  const jetzt = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .sort((a, b) => a.nr - b.nr).map(b => String(b.bildDateiId || ''));
  return jetzt.length === alt.length &&
         jetzt.every((k, i) => k && k !== alt[i]);
}, alteKennungen, { timeout: 90000 });

const zurueck = await seite.evaluate(async () => {
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive).sort((a, b) => a.nr - b.nr);
  const saetze = await Store.dateiAlle();
  const blob = await Dateien.alsBlob(seiten[0].bildDateiId);
  return {
    mitBild: (await Promise.all(seiten.map(async (b: any) => b.bildDateiId &&
      !!(await Store.dateiHolen(b.bildDateiId))))).filter(Boolean).length,
    masse: seiten.map(b => b.bw + '×' + b.bh),
    marken: seiten.map(b => JSON.stringify(b.marken)),
    bilder: saetze.filter((x: any) => x.abgeleitet).length,
    dateien: saetze.length,
    bildTyp: blob?.type, bildGross: (blob?.size || 0) > 800,
    /* Sind die Bilder wieder als abgeleitet gestempelt? Sonst wanderten sie
       in die NÄCHSTE Sicherung — und die ganze Rechnung wäre umsonst. */
    alleAbgeleitet: saetze.filter((x: any) => /\.webp$/.test(x.name))
      .every((x: any) => x.abgeleitet === true)
  };
});

gleich('Beide Seiten haben wieder ein Bild', zurueck.mitBild, 2);
gleich('Es sind WebP-Bilder', zurueck.bildTyp, 'image/webp');
p('Und nicht leer', zurueck.bildGross);
gleich('Zwei abgeleitete Dateien', zurueck.bilder, 2);
gleich('Drei Dateien wie am Anfang', zurueck.dateien, vorher.dateien);
p('Die neuen Bilder sind wieder als abgeleitet gestempelt',
  zurueck.alleAbgeleitet);

/* DER PUNKT, AN DEM DAS ZURÜCKHOLEN RICHTIG ODER FALSCH IST. */
gleich('Die Masse sind UNVERÄNDERT — nicht neu gemessen',
  JSON.stringify(zurueck.masse), JSON.stringify(vorher.masse));
gleich('Und die Marken liegen unberührt darauf',
  JSON.stringify(zurueck.marken), JSON.stringify(vorher.marken));

/* Und das Original ist immer noch Byte für Byte da. */
const originalNoch = await seite.evaluate(async () => {
  const saetze = await Store.dateiAlle();
  const s = saetze.find((x: any) => x.name === 'skript.pdf');
  const blob = s ? await Dateien.alsBlob(s.id) : null;
  if (!blob) return null;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const summe = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(summe))
    .map(b => b.toString(16).padStart(2, '0')).join('');
});
gleich('Das Original ist unangetastet', originalNoch, PDF_SUMME);

/* Und ein zweiter Klick? Es gibt nichts mehr zu tun. */
const nochmal = await seite.evaluate(async (q: string) =>
  await PdfEinlesen.neuBerechnen(q), eingespielt.quelleId as string);
gleich('Ein zweiter Lauf rechnet nichts noch einmal', nochmal.seiten, 0);

/* ==========================================================================
 * §5 · Ohne Original gibt es keinen Knopf
 * --------------------------------------------------------------------------
 * Eine `.json`-Sicherung kennt keine Anhänge. Dann fehlt das Original, und
 * ein Knopf, der nichts tun kann, ist schlimmer als keiner.
 * ========================================================================*/
console.log('\n5 · Ohne Original gibt es keinen Knopf');

const ohne = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Verwaist' });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842 });   /* kein quelleId */
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  const h = document.querySelector('.pdfs .pdfs-wartet');
  return { text: h?.textContent || '', knopf: !!h?.querySelector('button.pdfs-neu') };
});

p('Der Hinweis steht da', /kein Bild/i.test(ohne.text), ohne.text);
p('Aber ohne Knopf, weil es nichts zu holen gäbe', !ohne.knopf);

/* Und wenn die Kennung da ist, das Original aber fehlt: eine klare Ansage. */
const verlorenesOriginal = await seite.evaluate(async () => {
  const gesagt: string[] = [];
  const echt = UI.toast;
  (UI as any).toast = (t: unknown, ms?: number) => {
    gesagt.push(String(t ?? '')); return echt(t, ms); };
  const erg = await PdfEinlesen.neuBerechnen('gibt-es-nicht');
  (UI as any).toast = echt;
  return { erg, gesagt };
});
gleich('Ohne Original wird nichts gerechnet',
  verlorenesOriginal.erg.seiten, 0);
p('Und es wird gesagt, was zu tun ist',
  verlorenesOriginal.gesagt.some((m: string) => /noch einmal herein/i.test(m)) ||
  verlorenesOriginal.erg.grund === 'nichts offen',
  verlorenesOriginal.gesagt.join(' | '));

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const quelle = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf8'));

/* AB DER ERSTEN FUNDSTELLE BIS ANS ENDE, nicht `split(...)[1]`.
   `split` teilt an JEDER Fundstelle, und seit E116 gibt es zwei: den kleinen
   Vorbau mit der Sperre und `neuBerechnenWirklich` dahinter. `[1]` war
   danach der Vorbau — drei Zeugen, die plötzlich nichts mehr sahen und rot
   wurden, ohne dass am Geprüften etwas falsch war. */
const abZurueckholen = quelle.slice(quelle.indexOf('const neuBerechnen'));
p('Es gibt das Zurückholen überhaupt', abZurueckholen.length > 200,
  String(abZurueckholen.length));
p('Das Zurückholen nimmt die Masse vom BLOCK, nicht aus einer neuen Messung',
  !/geometrie\(/.test(abZurueckholen));
p('Die neuen Bilder tragen wieder `abgeleitet`',
  /abgeleitet: true/.test(abZurueckholen));
p('Und es wird eine Seite nach der anderen gerechnet',
  /setTimeout\(r, 0\)/.test(abZurueckholen));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
