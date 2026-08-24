/* Suite 147 — Der Text im PDF ist auffindbar (E107)
 * ============================================================================
 * Ein gerastertes Seitenbild ist für die Suche STUMM. Wer sein Mathe-Skript
 * hereinzog, konnte darin blättern und darauf schreiben — aber „Pythagoras"
 * zu suchen fand nichts, auch wenn das Wort auf Seite 63 stand. Bei achtzig
 * Seiten ist das der Unterschied zwischen einem Dokument und einem Stapel
 * Papier.
 *
 * pdf.js liest die Textebene ohnehin mit, und beim Einlesen ist es gerade
 * da. Der Text wandert deshalb EINMAL an den Block; danach findet die Suche
 * ihn ohne eine fremde Zeile — dieselbe Aufteilung wie beim Bild (E103).
 *
 * DREI FRAGEN:
 *
 *   §2  Findet die Suche das Wort — und nennt sie die richtige Seite?
 *   §3  Springt der Treffer zum BLOCK, nicht bloss auf die Seite? Möglich
 *       seit E105, und der eigentliche Gewinn: eine Fundstelle auf Seite 63
 *       nützt wenig, wenn man danach 63 Seiten weit rollen muss.
 *   §4  Überlebt der Text die Sicherung? Die BILDER dürfen fehlen (E103),
 *       der Text nicht — sonst wäre ein eingespieltes Skript wieder stumm,
 *       bis jemand alle Seiten neu rechnet.
 *
 *   node pruefungen/lauf/test181.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8926;

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
    const strom: string[] = [];
    let y = 760;
    for (const z of zeilen) {
      strom.push(`BT /F1 22 Tf 60 ${y} Td (${alsText(z)}) Tj ET`); y -= 40; }
    strom.push('2 w 30 30 535 782 re S');
    const roh = Buffer.from(strom.join('\n'), 'latin1');
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

/* Das gesuchte Wort steht auf der DRITTEN Seite — nicht auf der ersten. */
const PDF = machPdf([
  ['Kapitel 1: Zahlen', 'Bruchrechnung und Prozente'],
  ['Kapitel 2: Gleichungen', 'Lineare Gleichungen loesen'],
  ['Kapitel 3: Geometrie', 'Der Satz des Pythagoras', 'a hoch 2 plus b hoch 2'],
  ['Kapitel 4: Statistik', 'Mittelwert und Median']
]);

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
 * §1 · Jede Seite bringt ihren Text mit
 * ========================================================================*/
console.log('\n1 · Jede Seite bringt ihren Text mit');

const sid = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Mathe-Skript' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'mathe.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));
await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForFunction(() => Object.values(Store.cache.blocks || {})
  .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 4,
  null, { timeout: 90000 });

const texte = await seite.evaluate(() =>
  (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .sort((a, b) => a.nr - b.nr)
    .map(b => ({ nr: b.nr, txt: String(b.suchtext || ''), text: String(b.text || '') })));

gleich('Vier Seiten', texte.length, 4);
p('Jede hat Text mitgebracht', texte.every(t => t.txt.length > 10),
  texte.map(t => t.txt.length).join(', '));
p('Seite 1 kennt „Bruchrechnung"', /Bruchrechnung/.test(texte[0]!.txt));
p('Seite 3 kennt „Pythagoras"', /Pythagoras/.test(texte[2]!.txt));
p('Und Seite 1 kennt es NICHT', !/Pythagoras/.test(texte[0]!.txt));
p('Der sichtbare Text des Blocks bleibt leer',
  texte.every(t => t.text === ''), JSON.stringify(texte.map(t => t.text)));
p('Zeilen kleben nicht aneinander',
  !/GeometrieDer/.test(texte[2]!.txt), texte[2]!.txt.slice(0, 60));

/* ==========================================================================
 * §2 · Die Suche findet es
 * ========================================================================*/
console.log('\n2 · Die Suche findet es');

const gefunden = await seite.evaluate(() => {
  const t = Store.search('Pythagoras', {});
  return t.map((x: any) => ({
    seite: x.page.id, art: x.treffer, schnipsel: String(x.snippet || ''),
    blockId: x.blockId || '' }));
});

gleich('Genau ein Treffer', gefunden.length, 1);
gleich('Auf der Skript-Seite', gefunden[0]?.seite, sid);
gleich('Als Inhalts-Treffer', gefunden[0]?.art, 'Inhalt');
p('Mit einem lesbaren Ausschnitt',
  /Pythagoras/.test(gefunden[0]?.schnipsel || ''), gefunden[0]?.schnipsel);
p('Und der Treffer nennt den Block',
  !!gefunden[0]?.blockId, gefunden[0]?.blockId);
gleich('Und zwar die dritte Seite',
  await seite.evaluate((b: string) => Store.getBlock(b)?.nr, gefunden[0]!.blockId), 3);

/* GEGENPROBE — die Suche darf nicht alles finden. */
gleich('Etwas, das nirgends steht, wird nicht gefunden',
  (await seite.evaluate(() => Store.search('Quantenfeldtheorie', {}))).length, 0);

/* ==========================================================================
 * §3 · Ein Treffer springt zum Block
 * ========================================================================*/
console.log('\n3 · Ein Treffer springt zum Block');

/* Erst woanders hin, damit „ist schon offen" nichts beweist. */
const andere = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Irgendwas anderes' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForTimeout(300);

await seite.evaluate((b: string) => { App.zeigeBlock(b); }, gefunden[0]!.blockId);
await seite.waitForFunction((b: string) => {
  const el = document.querySelector(`[data-bid="${b}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top > -20 && r.top < innerHeight;
}, gefunden[0]!.blockId, { timeout: 20000 });

gleich('Die Skript-Seite ist offen',
  await seite.evaluate(() => App.aktuelleSeite()), sid);
p('Gegenprobe: vorher war es eine andere', andere !== sid);
p('Und die dritte Seite steht im Bild',
  await seite.evaluate((b: string) => {
    const r = document.querySelector(`[data-bid="${b}"]`)!.getBoundingClientRect();
    return r.top > -20 && r.top < innerHeight;
  }, gefunden[0]!.blockId));

/* ==========================================================================
 * §4 · Der Text überlebt die Sicherung — die Bilder nicht
 * ========================================================================*/
console.log('\n4 · Der Text überlebt die Sicherung — die Bilder nicht');

const nachSicherung = await seite.evaluate(async () => {
  const daten = Store.exportAll(true);
  /* Alles weg und wieder herein — ohne die abgeleiteten Bilder (E103). */
  for (const s of await Store.dateiAlle()) {
    for (const st of await Store.stueckeVon(s.id)) await Store.stueckWeg(st.id);
    await Store.dateiWeg(s.id);
    Dateien.adresseWeg(s.id);
  }
  await Store.importAll(daten, 'ersetzen');
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive).sort((a, b) => a.nr - b.nr);
  return {
    wieViele: seiten.length,
    mitText: seiten.filter(b => String(b.suchtext || '').length > 10).length,
    dritte: String(seiten[2]?.suchtext || ''),
    gefunden: Store.search('Pythagoras', {}).length
  };
});

gleich('Die vier Seiten sind zurück', nachSicherung.wieViele, 4);
gleich('Alle mit ihrem Text', nachSicherung.mitText, 4);
p('Die dritte kennt „Pythagoras" weiterhin',
  /Pythagoras/.test(nachSicherung.dritte));
gleich('Und die Suche findet es auch ohne Bilder', nachSicherung.gefunden, 1);

/* ==========================================================================
 * §5 · Die Vorschau behauptet nicht mehr, die Seite sei leer
 * --------------------------------------------------------------------------
 * Mit Augen gesehen (§55): rechts im Suchfenster stand „Diese Seite ist noch
 * leer." für eine Seite mit vier PDF-Seiten darauf. Die Vorschau liest
 * `b.text`, und eine PDF-Seite hat keinen — sie ist ein Bild. Kein Prüflauf
 * hatte etwas dagegen, weil keiner hinsah.
 * ========================================================================*/
console.log('\n5 · Die Vorschau behauptet nicht mehr, die Seite sei leer');

await seite.evaluate(() => App.suche());
await seite.waitForSelector('.overlay input');
await seite.fill('.overlay input', 'Pythagoras');
await seite.waitForFunction(
  () => (document.getElementById('vorschau')?.textContent || '').length > 0,
  null, { timeout: 15000 });

const vorschau = await seite.evaluate(() =>
  document.getElementById('vorschau')?.textContent || '');

p('Sie sagt NICHT, die Seite sei leer',
  !/noch leer/i.test(vorschau), vorschau.slice(0, 80));
p('Sondern zählt die Seiten auf',
  /Seite 1/.test(vorschau) && /Seite 4/.test(vorschau), vorschau.slice(0, 120));
p('Mit dem ersten Satz jeder Seite',
  /Kapitel 3: Geometrie/.test(vorschau));
p('Und nur der ersten Zeile, nicht der ganzen Seite',
  !/Pythagoras/.test(vorschau), vorschau.slice(0, 160));

await seite.keyboard.press('Escape');
await seite.waitForTimeout(200);

/* ==========================================================================
 * §5b · Was die Frage vor dem Einlesen verspricht, muss stimmen
 * --------------------------------------------------------------------------
 * Gemessen an einem dicht bedruckten 60-Seiten-Dokument: 265 KB je Seite,
 * zusammen 15,5 MB, 21 Sekunden. Der Dialog kündigte „ungefähr 12 MB" an —
 * 60 × 0,2. Eine Schätzung, die den Preis kleiner macht, als er ist, ist
 * genau die Sorte Versprechen, die §33 verbietet.
 *
 * Gelesen wird die Frage hier nur; danach wird abgebrochen. Vierzig Seiten
 * zu rastern kostete vierzehn Sekunden für eine Zahl im Text.
 * ========================================================================*/
console.log('\n5b · Was die Frage vor dem Einlesen verspricht, muss stimmen');

const VIELE = machPdf(Array.from({ length: 40 },
  (_, i) => ['Kapitel ' + (i + 1), 'Text']));

const sidV = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Dickes Skript' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'dick.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, VIELE.toString('hex'));
await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForSelector('.overlay [data-w="alle"]', { timeout: 30000 });

const frage = await seite.evaluate(() =>
  (document.querySelector('.overlay .finder')?.textContent || '')
    .replace(/\s+/g, ' '));

p('Sie nennt die Seitenzahl', /40 Seiten/.test(frage), frage.slice(0, 90));
p('Und den Platz als OBERGRENZE, nicht als Schätzung',
  /bis zu 12 MB/.test(frage), frage);
p('Dazu die Dauer', /14 Sekunden/.test(frage), frage);
p('Und dass die Bilder nicht in die Sicherung kommen',
  /nicht.*Sicherung|Sicherung.*nicht/i.test(frage));
p('Gegenprobe: „ungefähr" steht dort nicht mehr', !/ungefähr/.test(frage));

/* UND SIE MUSS AUF EIN TELEFON PASSEN (§37). Drei Knöpfe mit je zwei Zeilen
   Erklärung sind viel Text; bei 390 px ist das die Stelle, an der so etwas
   aus dem Bild läuft — bei E89, E100 und E104 ist es das jedes Mal getan. */
await seite.setViewportSize({ width: 390, height: 844 });
await seite.waitForTimeout(300);
const amTelefon = await seite.evaluate(() => {
  const f = document.querySelector('.overlay .finder') as HTMLElement;
  const kn = [...f.querySelectorAll('[data-w]')] as HTMLElement[];
  const r = f.getBoundingClientRect();
  return {
    breite: Math.round(r.width), unten: Math.round(r.bottom),
    fenster: innerHeight, ueberlauf: f.scrollHeight - f.clientHeight,
    kleinsterKnopf: Math.min(...kn.map(k => Math.round(k.getBoundingClientRect().height))),
    letzterUnten: Math.round(kn[kn.length - 1]!.getBoundingClientRect().bottom)
  };
});

p('Die Frage passt in die Fensterbreite', amTelefon.breite <= 390,
  amTelefon.breite + ' px');
p('Und steht ganz im Bild', amTelefon.letzterUnten <= amTelefon.fenster,
  `letzter Knopf bei ${amTelefon.letzterUnten}, Fenster ${amTelefon.fenster}`);
gleich('Nichts muss darin gerollt werden', amTelefon.ueberlauf, 0);
p('Jeder Knopf ist mit dem Finger zu treffen (44 px, §37)',
  amTelefon.kleinsterKnopf >= 44, amTelefon.kleinsterKnopf + ' px');

await seite.setViewportSize({ width: 1400, height: 900 });
await seite.waitForTimeout(200);

await seite.click('.overlay [data-w=""]');
await seite.waitForFunction((s: string) =>
  (Store.getBlock(s)?.content || []).some(
    (k: string) => Store.getBlock(k)?.type === 'file'), sidV, { timeout: 20000 });
gleich('Und Abbrechen hängt sie an, statt zu rastern',
  await seite.evaluate(() => (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive && b.vonSeiten === 40).length), 0);

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const leser = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/leser.ts'), 'utf8'));
p('Der Text wird gekürzt — sonst wächst jede Sicherung mit',
  /slice\(0, TEXT_MAX\)/.test(leser));
p('Eine Seite ohne Textebene ist kein Fehler',
  /catch\s*{[\s\S]{0,120}return '';/.test(leser));

const ablage = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8'));
p('Die Suche sieht in `text` UND `suchtext`',
  /\['text',\s*'suchtext'(?:,\s*'[^']+')*\]/.test(ablage));

/* ES GIBT DREI SUCHWEGE, UND SIE MÜSSEN DASSELBE SAGEN. `Store.search` las
   `suchtext` von Anfang an; das Suchfenster und sein Index taten es nicht.
   Ergebnis: derselbe Begriff, zweimal gesucht, zweimal eine andere Antwort —
   `Store.search` fand das eingelesene Skript, das Fenster sagte „Nichts
   gefunden" (E124). §5 oben prüft das am Bild; hier steht, woran es lag. */
const kontext = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/ki/kontext.ts'), 'utf8'));
p('Der Suchindex nimmt `suchtext` mit auf',
  /if \(k\.suchtext\) text\.push\(k\.suchtext\);/.test(kontext));
p('… und merkt sich ihn auch in der Signatur, sonst fällt eine Änderung nicht auf',
  /teile\.push\(k\.id, k\.type, k\.edited, k\.alive, k\.text, k\.suchtext,/.test(kontext));

const schaleQuelle = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf8'));
p('Und der Weg ohne Index tut dasselbe',
  /child\.text \|\| child\.suchtext/.test(schaleQuelle));

const einlesen = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf8'));
p('Auch das Zurückholen trägt fehlenden Text nach',
  /if \(!b\.suchtext\) nach\.suchtext/.test(einlesen));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
