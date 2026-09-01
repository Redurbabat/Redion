/* Suite 309 — Fett bleibt fett bis nach Word und zurück (L72 Teil 2, E315)
 * ============================================================================
 * Der Word-Export schrieb den ROHEN Blocktext:
 *
 *     `<w:r><w:t>${esc(text)}</w:t></w:r>`      ausgeben.ts:321
 *
 * In Word stand danach `**fett**` wörtlich da, mit Sternchen. Wer eine
 * Arbeit abgibt, gibt sie so ab. Der Einleser hatte dieselbe Lücke in der
 * Gegenrichtung: er sammelte `w:t` und warf `w:rPr` weg — eine eingelesene
 * Word-Datei wurde zur grauen Wand.
 *
 *   §1 DER KERN zerlegt und setzt wieder zusammen — beides prüfbar.
 *   §2 DER RUNDLAUF durch den Kern ändert nichts.
 *   §3 IM EXPORT stehen echte `w:rPr`, keine Sternchen.
 *   §4 DER EINLESER liest sie zurück.
 *   §5 GANZ HERUM: Redion → Word → Redion, Wort für Wort.
 *   §6 GEGENPROBE: gewöhnlicher Text bekommt KEIN `w:rPr`.
 *
 * ─── WARUM §6 NICHT WEGGELASSEN WERDEN DARF ─────────────────────────────────
 *
 * Ein Export, der jedem Lauf ein leeres `<w:rPr/>` mitgibt, bestünde §3
 * mühelos und wäre trotzdem falsch: Word öffnet die Datei, aber die
 * Vorlagen greifen nicht mehr, weil jeder Lauf seine eigene Meinung hat.
 *
 *   node pruefungen/lauf/test309.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9320;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/text/inline.js'), 'utf-8'));
const I = (globalThis as any).Inline;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Kern zerlegt und setzt wieder zusammen');

p('Der Kern ist geladen', !!I && typeof I.lesen === 'function');
gleich('Klartext ist genau ein Lauf',
  I.lesen('Nur Text').map((l: any) => [l.text, !!l.fett]), [['Nur Text', false]]);
gleich('Fett wird erkannt',
  I.lesen('Das ist **wichtig** hier').map((l: any) => [l.text, !!l.fett]),
  [['Das ist ', false], ['wichtig', true], [' hier', false]]);
/* DIE REIHENFOLGE IST BEDEUTUNG: stünde `*` vor `**`, machte der einfache
   Stern aus `**fett**` ein kursives `*fett*`. */
gleich('Und nicht als zweimal kursiv',
  I.lesen('**fett**').map((l: any) => [!!l.fett, !!l.kursiv]), [[true, false]]);
gleich('Kursiv auch', I.lesen('ein *Wort*').map((l: any) => !!l.kursiv), [false, true]);
gleich('Code auch', I.lesen('siehe `U = R · I`').map((l: any) => !!l.code), [false, true]);
gleich('Durchgestrichen auch',
  I.lesen('~~falsch~~').map((l: any) => !!l.durch), [true]);
gleich('Ein Seitenverweis trägt sein Ziel',
  I.lesen('siehe [[Ohmsches Gesetz]]').map((l: any) => l.ziel || ''),
  ['', 'Ohmsches Gesetz']);
gleich('Und ein Verweis mit eigenem Text auch',
  I.lesen('[hier](https://example.org)').map((l: any) => [l.text, l.ziel]),
  [['hier', 'https://example.org']]);
/* In fester Breite gilt keine weitere Auszeichnung. */
gleich('In Code bleiben Sternchen Sternchen',
  I.lesen('`a**b**c`').map((l: any) => l.text), ['a**b**c']);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Der Rundlauf durch den Kern ändert nichts');

const BEISPIELE = [
  'Nur Text',
  'Das ist **wichtig** hier',
  'ein *Wort* und noch **eins**',
  'siehe `U = R · I` im Formelbuch',
  '~~falsch~~ und richtig',
  'siehe [[Ohmsches Gesetz]]',
  '[hier](https://example.org) steht mehr',
  'Umlaute äöüß und kΩ bleiben',
  ''
];
const kaputt = BEISPIELE.filter(b => I.schreiben(I.lesen(b)) !== b);
gleich('Alle Beispiele überstehen lesen → schreiben', kaputt, []);
/* Und die andere Richtung: aus Läufen wird derselbe Satz Läufe. */
const zweiRunden = BEISPIELE.filter(b =>
  JSON.stringify(I.lesen(I.schreiben(I.lesen(b)))) !== JSON.stringify(I.lesen(b)));
gleich('Auch zweimal herum', zweiRunden, []);

/* ------------------------------------------------------------------------ */
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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 860 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

console.log('\n3 · Im Export stehen echte w:rPr');

const SATZ = 'Der **Widerstand** ist *konstant*, siehe `R = U / I`.';

const ausWord = await pc.evaluate(async (satz: string) => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const seite = Store.addPage(null, { text: 'Wordprobe' });
  Store.addBlock(seite.id, 'text', { text: satz });
  Store.addBlock(seite.id, 'h2', { text: 'Zweite Überschrift' });
  await Store.flush();
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const puffer = await blob.arrayBuffer();
  /* Aus dem ZIP nur document.xml holen — über Redions eigenen Leser, damit
     der Lauf nicht seinen eigenen ZIP-Leser mitbringt. */
  const zip = await w.Einlesen.zipLesen(puffer);
  const xml = await zip.text('word/document.xml');
  return { xml: String(xml || ''), seite: seite.id, groesse: puffer.byteLength };
}, SATZ);

p('Die Word-Datei ist entstanden', ausWord.groesse > 1000, String(ausWord.groesse));
p('Es gibt einen fetten Lauf', /<w:rPr><w:b\/><\/w:rPr><w:t[^>]*>Widerstand</.test(ausWord.xml),
  ausWord.xml.slice(ausWord.xml.indexOf('Widerstand') - 80, ausWord.xml.indexOf('Widerstand') + 20));
p('Und einen kursiven', /<w:i\/>/.test(ausWord.xml));
p('Und einen in fester Breite', /Consolas/.test(ausWord.xml));
/* DER PUNKT DER GANZEN SACHE: keine Sternchen mehr im Text. */
p('Im Text der Datei stehen keine Sternchen mehr',
  !/<w:t[^>]*>[^<]*\*\*/.test(ausWord.xml),
  (/<w:t[^>]*>[^<]*\*\*[^<]*/.exec(ausWord.xml) || [''])[0]);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Der Einleser liest sie zurück');

const zurueck = await pc.evaluate(async (satz: string) => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Zweite' });
  Store.addBlock(seite.id, 'text', { text: satz });
  await Store.flush();
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const puffer = await blob.arrayBuffer();
  const bloecke = await w.Einlesen.docxLesen(puffer);
  return bloecke.map((b: any) => ({ typ: b.typ, text: b.text }));
}, SATZ);

const treffer = zurueck.find((b: any) => (b.text || '').includes('Widerstand'));
p('Der Satz kommt zurück', !!treffer, JSON.stringify(zurueck));
gleich('Und zwar Zeichen für Zeichen derselbe', treffer?.text, SATZ);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Ganz herum: Redion → Word → Redion');

/* OHNE VERWEISE, und das ist keine Schwäche des Laufs, sondern eine
   benannte Grenze: ein Redion-Seitenverweis hat in Word keine Entsprechung.
   Er kommt dort als gewöhnlicher Text an — was für einen Leser richtig ist
   und für den Rundlauf ein Verlust. §5b misst ihn ausdrücklich, statt ihn
   auszulassen. */
const OHNE_VERWEIS = BEISPIELE.filter(b => b && !/\[/.test(b));
const rundlauf = await pc.evaluate(async (beispiele: string[]) => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Rundlauf' });
  for (const b of beispiele) if (b) Store.addBlock(seite.id, 'text', { text: b });
  await Store.flush();
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const bloecke = await w.Einlesen.docxLesen(await blob.arrayBuffer());
  return bloecke.map((b: any) => String(b.text || ''));
}, OHNE_VERWEIS);

const fehlend = OHNE_VERWEIS.filter(e => !rundlauf.includes(e));
gleich('Jeder Satz ohne Verweis kommt unverändert zurück', fehlend, []);

/* §5b · Und der Verweis? Er wird zu seinem Text — nachgemessen, nicht
   vermutet. Steht es hier, ist es eine Grenze; stünde es nirgends, wäre es
   ein stiller Verlust (§35). */
const mitVerweis = await pc.evaluate(async () => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Verweise' });
  Store.addBlock(seite.id, 'text', { text: 'siehe [[Ohmsches Gesetz]]' });
  Store.addBlock(seite.id, 'text', { text: '[hier](https://example.org) steht mehr' });
  await Store.flush();
  const blob = await w.Austausch.alsWord(Store.getBlock(seite.id));
  const bloecke = await w.Einlesen.docxLesen(await blob.arrayBuffer());
  return bloecke.map((b: any) => String(b.text || ''));
});
p('Ein Seitenverweis kommt als sein Text zurück',
  mitVerweis.includes('siehe Ohmsches Gesetz'), JSON.stringify(mitVerweis));
p('Und ein Verweis mit Ziel ebenso — das Ziel bleibt in Word',
  mitVerweis.includes('hier steht mehr'), JSON.stringify(mitVerweis));

/* ------------------------------------------------------------------------ */
console.log('\n6 · GEGENPROBE: gewöhnlicher Text bekommt kein w:rPr');

/* Ein Export, der JEDEM Lauf ein leeres `<w:rPr/>` mitgäbe, bestünde §3
   mühelos und wäre trotzdem falsch: Word öffnet die Datei, aber die
   Vorlagen greifen nicht mehr. */
const schlicht = await pc.evaluate(async () => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Schlicht' });
  Store.addBlock(seite.id, 'text', { text: 'Ein ganz gewöhnlicher Satz ohne alles.' });
  await Store.flush();
  const zip = await w.Einlesen.zipLesen(await (await w.Austausch.alsWord(Store.getBlock(seite.id))).arrayBuffer());
  return String(await zip.text('word/document.xml') || '');
});
const stelle = schlicht.indexOf('gewöhnlicher');
p('Der schlichte Satz steht ohne rPr da',
  stelle > 0 && !/<w:rPr>/.test(schlicht.slice(Math.max(0, stelle - 120), stelle)),
  schlicht.slice(Math.max(0, stelle - 120), stelle + 20));
p('Und leere <w:rPr/> gibt es nirgends', !/<w:rPr\s*\/>/.test(schlicht));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
