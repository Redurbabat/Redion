/* Suite 559 — Den Text einer PDF ändern, ohne die PDF anzufassen
 * ============================================================================
 * Redur, 21. September 2026: „können wir so was machen das wenn ich eine pdf
 * hochlade das ich die pdf selbst direk bearbeiten kann also die text direk"
 *
 * ─── WAS DABEI ZU ENTSCHEIDEN WAR ───────────────────────────────────────────
 * „Die PDF selbst bearbeiten" heisst wörtlich: ihren Inhaltsstrom neu setzen,
 * mit ihren eingebetteten Schriften, und den Absatz neu umbrechen. Das ist
 * ein eigenes Projekt.
 *
 * Was jedes Programm stattdessen tut, wenn jemand ein Wort ändern will —
 * und was zu Redion passt, weil es die Werkzeuge schon hat: die Stelle
 * ZUDECKEN und die neue darüberschreiben. Die Änderung ist damit eine
 * Marke: rückgängig, versioniert, in der Sicherung, im ausgegebenen PDF —
 * und das Original bleibt Byte für Byte, wie `leser.ts` es zusagt.
 *
 * ─── DER PREIS, UND ER WIRD GEMESSEN ────────────────────────────────────────
 * Der Text FLIESST NICHT. Ein längeres Wort wird länger, statt den Rest der
 * Zeile zu schieben. §4 dieses Laufs hält das ausdrücklich fest — nicht,
 * weil es gut ist, sondern damit niemand später glaubt, es sei anders
 * gedacht gewesen.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Es gibt das Werkzeug „Text ändern", und es sagt im Titel, dass das
 *      Original unberührt bleibt (§33: keine falschen Versprechen).
 *   2  Ein Tipp auf ein Wort FINDET dieses Wort — `PdfLeser.stueckBei`
 *      über der echten Textebene einer echt eingelesenen PDF.
 *   3  Daneben findet es nichts. Ein Werkzeug, das überall etwas findet,
 *      findet in Wirklichkeit nichts.
 *   4  Die gezeichnete Marke deckt die alte Stelle VOLLSTÄNDIG zu und
 *      schreibt das neue Wort auf dieselbe Grundlinie, in derselben Höhe.
 *   5  Der Deckel ist deckend — eine durchsichtige Fläche wäre eine
 *      Änderung, unter der das Alte noch steht.
 *   6  §19: ein `<script>` im neuen Text wird Text, nicht Markup.
 *   7  Die PDF selbst bleibt unverändert — Byte für Byte, gemessen.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test559.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ── EIN ECHTES PDF, VON HAND GESCHRIEBEN (wie test177) ──────────────────
   Keine Beispieldatei im Verzeichnis: ein PDF ist eine Handvoll
   nummerierter Objekte und eine Tabelle mit ihren Byte-Positionen. So
   prüft der Lauf gegen etwas, das er selbst versteht. */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const machPdf = (zeilen: Array<[string, number, number, number]>): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const strom = zeilen.map(([t, x, y, gr]) =>
    `BT /F1 ${gr} Tf ${x} ${y} Td (${alsText(t)}) Tj ET`).join('\n');
  const roh = Buffer.from(strom, 'latin1');
  const inhalt = neu(Buffer.concat([
    Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
    Buffer.from('\nendstream', 'latin1')]));
  const seite = neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
    `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`);
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count 1 /Kids [${seite} 0 R] >>`, 'latin1');
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

/* Drei Zeilen, weit auseinander — damit „daneben" auch wirklich daneben ist. */
const PDF = machPdf([
  ['Schaltplan Werkstatt', 60, 740, 24],
  ['Sicherung: B16', 60, 640, 18],
  ['Leiterquerschnitt 2,5 mm2', 60, 540, 18]
]);
const PDF_SUMME = crypto.createHash('sha256').update(PDF).digest('hex');
const PDF_B64 = PDF.toString('base64');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.mjs': 'text/javascript', '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Store !== "undefined" && typeof Marken !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);

console.log('\n' + '─'.repeat(60));
console.log('Suite 559 — Den Text einer PDF ändern, ohne die PDF anzufassen');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Das Werkzeug gibt es, und es verspricht nichts Falsches');

const wz = await seite.evaluate(
  '(() => {\n'
+ '  const liste = (Marken && Marken.WERKZEUGE) || [];\n'
+ '  const w = liste.find(x => x && x.id === "textfix");\n'
+ '  return w ? { name: w.name, titel: String(w.titel || "") } : null;\n'
+ '})()') as any;

console.log('    ' + (wz ? '„' + wz.name + '" — ' + wz.titel.slice(0, 80) + '…' : 'kein Werkzeug'));
p('Es gibt das Werkzeug „Text ändern"', !!wz && wz.name === 'Text ändern',
  wz ? wz.name : 'kein Eintrag mit der Kennung `textfix`');
p('Sein Titel sagt, dass das Original unberührt bleibt (§33)',
  !!wz && /original/i.test(wz.titel),
  wz ? wz.titel : '—');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Ein Tipp auf ein Wort findet dieses Wort');

const eingelesen = await seite.evaluate(
  '(async () => {\n'
+ '  try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
+ '  document.getElementById("rg-willkommen")?.remove();\n'
+ '  const roh = atob("' + PDF_B64 + '");\n'
+ '  const bytes = new Uint8Array(roh.length);\n'
+ '  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);\n'
+ '  const s = Store.addPage(null, { text: "Probe 559" });\n'
+ '  const datei = new File([bytes], "probe-559.pdf", { type: "application/pdf" });\n'
+ '  /* Beide Vorgaben MUESSEN stehen: `alsSeiten` stellt sonst zwei\n'
+ '     Dialoge (Anordnung, und ueber 30 Seiten die Menge), und ein\n'
+ '     Dialog ohne Menschen wartet ewig. `OHNE_FRAGE` ist NICHT der\n'
+ '     Schalter dafuer, sondern die Zahl 30 — nachgeschlagen, nachdem\n'
+ '     der erste Anlauf fuenf Minuten lang nichts tat. */\n'
+ '  await PdfEinlesen.alsSeiten(datei, s.id,\n'
+ '    { anordnung: "untereinander", ueberGrenze: "alle" });\n'
+ '  await new Promise(f => setTimeout(f, 700));\n'
+ '  const blatt = Store.childrenOf(s.id).find(b => b && b.type === "pdfseite");\n'
+ '  if (!blatt) return { ok: false };\n'
+ '  return { ok: true, seite: s.id, block: blatt.id,\n'
+ '           quelle: String(blatt.quelleId || ""),\n'
+ '           bw: blatt.bw, bh: blatt.bh,\n'
+ '           suchtext: String(blatt.suchtext || "").slice(0, 60) };\n'
+ '})()') as any;

console.log('    eingelesen: ' + (eingelesen.ok ? 'ja' : 'nein') +
            (eingelesen.ok ? ' · Blatt ' + eingelesen.bw + '×' + eingelesen.bh : ''));
console.log('    suchtext:   „' + (eingelesen.suchtext || '') + '"');
p('Die PDF ist als Seite eingelesen', eingelesen.ok === true);
p('Die Seite kennt ihre Quelle', !!eingelesen.quelle,
  'ohne Quelle gibt es keine Textebene — und kein Wort zu finden');

const gefunden = await seite.evaluate(
  '(async () => {\n'
+ '  const b = Store.getBlock("' + (eingelesen.block || '') + '");\n'
+ '  if (!b || typeof PdfLeser.stueckBei !== "function") return { da: false };\n'
+ '  const alle = await PdfLeser.lageVonBlock(b);\n'
+ '  const ziel = alle.find(s => String(s.s || "").indexOf("B16") >= 0);\n'
+ '  if (!ziel) return { da: true, stuecke: alle.length, ziel: null };\n'
+ '  const mitte = await PdfLeser.stueckBei(b, ziel.x + ziel.w / 2, ziel.y + ziel.h / 2, 3);\n'
+ '  const leer = await PdfLeser.stueckBei(b, ziel.x + ziel.w / 2, ziel.y + ziel.h + 40, 3);\n'
+ '  return { da: true, stuecke: alle.length, ziel,\n'
+ '           getroffen: mitte ? mitte.s : null,\n'
+ '           daneben: leer ? leer.s : null };\n'
+ '})()') as any;

console.log('    Stücke in der Textebene: ' + (gefunden.stuecke ?? 0));
console.log('    getroffen: ' + JSON.stringify(gefunden.getroffen ?? null) +
            ' · daneben: ' + JSON.stringify(gefunden.daneben ?? null));

p('Die Textebene der Seite ist lesbar', (gefunden.stuecke ?? 0) > 0,
  '0 Stücke — ohne Textebene findet kein Tipp ein Wort');
p('Ein Tipp mitten auf „Sicherung: B16" trifft diese Stelle',
  typeof gefunden.getroffen === 'string' && gefunden.getroffen.includes('B16'),
  JSON.stringify(gefunden.getroffen ?? null));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Und daneben findet es nichts');

p('Vierzig Punkte darunter steht kein Text', gefunden.daneben === null,
  'gefunden: ' + JSON.stringify(gefunden.daneben) +
  ' — ein Werkzeug, das überall etwas findet, findet nichts');

/* ---------------------------------------------------------------------- */
console.log('\n4 · Die Marke deckt zu und schreibt darüber');

const gemalt = await seite.evaluate(
  '(() => {\n'
+ '  const k = ' + JSON.stringify(gefunden.ziel || { x: 10, y: 10, w: 50, h: 12 }) + ';\n'
+ '  const mark = { id: "probe-fix", art: "textfix",\n'
+ '    kasten: { x: k.x, y: k.y, w: k.w, h: k.h },\n'
+ '    alt: k.s || "Sicherung: B16", text: "Sicherung: C16 <script>x</script>",\n'
+ '    farbe: "#000000", grund: "#f2efe6" };\n'
+ '  const knoten = Marken.zeichneMarke(mark);\n'
+ '  if (!knoten) return { da: false };\n'
+ '  const hueter = document.createElementNS("http://www.w3.org/2000/svg", "svg");\n'
+ '  hueter.appendChild(knoten);\n'
+ '  const rect = knoten.querySelector("rect");\n'
+ '  const text = knoten.querySelector("text");\n'
+ '  const lesen = (el, name) => el ? Number(el.getAttribute(name)) : NaN;\n'
+ '  return { da: true,\n'
+ '    rect: rect ? { x: lesen(rect, "x"), y: lesen(rect, "y"),\n'
+ '                   w: lesen(rect, "width"), h: lesen(rect, "height"),\n'
+ '                   fill: rect.getAttribute("fill"),\n'
+ '                   opacity: rect.getAttribute("opacity") } : null,\n'
+ '    text: text ? { x: lesen(text, "x"), y: lesen(text, "y"),\n'
+ '                   groesse: lesen(text, "font-size"),\n'
+ '                   inhalt: text.textContent } : null,\n'
+ '    markup: hueter.innerHTML };\n'
+ '})()') as any;

const zielK = gefunden.ziel || { x: 0, y: 0, w: 0, h: 0 };
console.log('    altes Stück: x=' + zielK.x + ' y=' + zielK.y +
            ' w=' + zielK.w + ' h=' + zielK.h);
if (gemalt.rect) console.log('    Deckel:      x=' + gemalt.rect.x + ' y=' + gemalt.rect.y +
            ' w=' + gemalt.rect.w + ' h=' + gemalt.rect.h + ' fill=' + gemalt.rect.fill);
if (gemalt.text) console.log('    neuer Text:  x=' + gemalt.text.x + ' y=' + gemalt.text.y +
            ' Höhe ' + gemalt.text.groesse);

p('Die Marke lässt sich zeichnen', gemalt.da === true,
  'der Zeichner kennt die Art `textfix` nicht');
p('Der Deckel umschliesst die alte Stelle vollständig',
  !!gemalt.rect && gemalt.rect.x <= zielK.x && gemalt.rect.y <= zielK.y
    && gemalt.rect.x + gemalt.rect.w >= zielK.x + zielK.w
    && gemalt.rect.y + gemalt.rect.h >= zielK.y + zielK.h,
  gemalt.rect ? JSON.stringify(gemalt.rect) : 'kein Deckel');
p('Der Deckel hat die Papierfarbe, nicht Weiss aus Gewohnheit',
  !!gemalt.rect && gemalt.rect.fill === '#f2efe6', gemalt.rect?.fill ?? '—');
p('Das neue Wort steht an derselben Stelle',
  !!gemalt.text && Math.abs(gemalt.text.x - zielK.x) < 0.01,
  gemalt.text ? 'x=' + gemalt.text.x + ' statt ' + zielK.x : '—');
p('Auf derselben Grundlinie',
  !!gemalt.text && Math.abs(gemalt.text.y - (zielK.y + zielK.h)) < 0.01,
  gemalt.text ? 'y=' + gemalt.text.y + ' statt ' + (zielK.y + zielK.h) : '—');
p('Und in derselben Höhe',
  !!gemalt.text && Math.abs(gemalt.text.groesse - zielK.h) < 0.51,
  gemalt.text ? gemalt.text.groesse + ' statt ' + zielK.h : '—');

/* ---------------------------------------------------------------------- */
console.log('\n5 · Der Deckel deckt wirklich');

p('Keine Durchsichtigkeit am Deckel',
  !!gemalt.rect && (gemalt.rect.opacity === null || Number(gemalt.rect.opacity) >= 1),
  'opacity=' + (gemalt.rect?.opacity ?? '—') + ' — darunter stünde das Alte noch');

/* ---------------------------------------------------------------------- */
console.log('\n6 · Und §19 gilt auch hier');

const rohesSkript = String(gemalt.markup || '').includes('<script>');
console.log('    `<script>` roh im Markup: ' + rohesSkript);
p('Ein `<script>` im neuen Text wird Text, nicht Markup (§19)',
  gemalt.da === true && !rohesSkript,
  'der neue Text landet roh im Markup');
p('Er steht aber als Zeichen da',
  !!gemalt.text && String(gemalt.text.inhalt).includes('<script>'),
  gemalt.text ? String(gemalt.text.inhalt) : '—');

/* ---------------------------------------------------------------------- */
console.log('\n7 · Und die PDF selbst ist unverändert');

const summe = await seite.evaluate(
  '(async () => {\n'
+ '  const id = "' + (eingelesen.quelle || '') + '";\n'
+ '  if (!id) return "";\n'
+ '  const blob = await Dateien.alsBlob(id);\n'
+ '  if (!blob) return "";\n'
+ '  const puffer = await blob.arrayBuffer();\n'
+ '  const h = await crypto.subtle.digest("SHA-256", puffer);\n'
+ '  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, "0")).join("");\n'
+ '})()') as string;

console.log('    abgelegt:    ' + String(summe).slice(0, 24) + '…');
console.log('    hereingegeben: ' + PDF_SUMME.slice(0, 24) + '…');
p('Die abgelegte Quelle ist Byte für Byte die hereingegebene',
  summe === PDF_SUMME,
  'die Summen gehen auseinander — irgendetwas hat die PDF angefasst');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
