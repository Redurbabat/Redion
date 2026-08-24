/* Suite 157 — Drei Wege, die ins Leere führten (E118)
 * ============================================================================
 * Drei Bausteine wurden gebaut und funktionierten — auf dem Weg, auf dem sie
 * gebaut wurden. Der Weg, den ein Mensch geht, war ein anderer:
 *
 *   `/blatt`      Das A4-Blatt (E100) ist im Register eingetragen und über
 *                 das Slash-Menü erreichbar. `umwandeln` legt ihm aber keine
 *                 Kinder an, und `Blatt.zeichne` zeichnete nur vorhandene.
 *                 Ergebnis: Papier ohne ein einziges beschreibbares Element.
 *                 Man konnte darauf malen und sonst nichts.
 *
 *   Suchvorschau  Sie las nur die DIREKTEN Kinder der Seite. Seit E104 ist
 *                 „nebeneinander" die Vorgabe, und dann ist das einzige
 *                 direkte Kind ein `columns`-Block ohne `text`. Die Vorschau
 *                 sagte „Diese Seite ist noch leer." über eine ganze
 *                 Schulaufgabe — genau der Satz, den E107 abschaffen wollte.
 *
 *   Folie         `folieBlock` kannte nur die NEUE Spaltenform
 *                 (`columns → spalte → …`). Der Bestand von vor E102 hat die
 *                 `spalte`-Hülle nicht; der Editor zeichnet ihn weiter, die
 *                 Folie liess ihn ersatzlos weg.
 *
 * Alle drei sind dieselbe Form: eine Stelle wurde erweitert, die
 * Nachbarstelle nicht. Diese Suite geht deshalb die MENSCHENWEGE ab, nicht
 * die Funktionen.
 *
 *   node pruefungen/lauf/test191.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8945;

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

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1300, height: 880 });
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
 * §1 · `/blatt` — der Weg, den ein Mensch geht
 * --------------------------------------------------------------------------
 * Nicht `Blocks.umwandeln(id, 'blatt')`. Getippt wird `/blatt`, und im Menü
 * wird geklickt — die Verdrahtung ist der Teil, der schiefgeht (E93).
 * ========================================================================*/
console.log('\n1 · `/blatt` — der Weg, den ein Mensch geht');

const seitenId = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Blattprobe' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForTimeout(500);

/* In die erste Zeile klicken und wirklich tippen. */
await seite.click('#scroll .blk [contenteditable]');
await seite.keyboard.type('/blatt');
await seite.waitForTimeout(400);
const menueDa = await seite.evaluate(() =>
  !!document.querySelector('.menu button[data-t="blatt"]'));
p('Das Slash-Menü bietet das Blatt an', menueDa);
if (menueDa) await seite.click('.menu button[data-t="blatt"]');
await seite.waitForTimeout(600);

const blatt = await seite.evaluate((id: string) => {
  const b = Store.childrenOf(id).find((x: any) => x.type === 'blatt');
  if (!b) return { fehlt: true };
  const kasten = document.querySelector(`.blk[data-bid="${b.id}"]`) as HTMLElement | null;
  return {
    fehlt: false,
    kinder: Store.childrenOf(b.id).length,
    schreibbar: kasten ? kasten.querySelectorAll('[contenteditable]').length : -1,
    imPapier: kasten ? kasten.querySelectorAll('.blatt-inhalt [contenteditable]').length : -1,
    malflaeche: kasten ? kasten.querySelectorAll('svg.blatt-marken').length : -1,
    id: b.id,
  };
}, seitenId);

p('Es ist ein Blatt entstanden', !blatt.fehlt);
gleich('Es hat eine Zeile bekommen', blatt.kinder, 1);
gleich('Und genau ein beschreibbares Feld auf dem Papier', blatt.imPapier, 1);
gleich('Die Malfläche ist auch da', blatt.malflaeche, 1);

/* Und man kann wirklich hineinschreiben — nicht nur ein Element zählen.
   Der Klick wird NICHT blind gesetzt: fehlt das Feld, ist genau das der
   Befund, und ein abstürzender Prüflauf würde die Abschnitte danach gar
   nicht mehr erreichen (in der Gegenprobe gemessen). */
const feldDa = await seite.evaluate(() =>
  !!document.querySelector('.blatt-inhalt [contenteditable]'));
p('Es gibt ein Feld zum Hineinklicken', feldDa);
let getippt = { imBild: '', imSpeicher: '' };
if (feldDa) {
  await seite.click('.blatt-inhalt [contenteditable]');
  await seite.keyboard.type('Meine Antwort: x = 11');
  await seite.waitForTimeout(400);
  getippt = await seite.evaluate((bid: string) => {
    const k = Store.childrenOf(bid)[0];
    return { imSpeicher: k ? (k.text || '') : '',
             imBild: document.querySelector('.blatt-inhalt [contenteditable]')?.textContent || '' };
  }, blatt.id || '');
}
gleich('Das Getippte steht im Bild', getippt.imBild, 'Meine Antwort: x = 11');
gleich('Und im Speicher', getippt.imSpeicher, 'Meine Antwort: x = 11');

/* ==========================================================================
 * §2 · Die Suchvorschau bei der Anordnung, die Vorgabe ist
 * ========================================================================*/
console.log('\n2 · Die Suchvorschau bei der Anordnung, die Vorgabe ist');

await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Skriptseite Pythagoras' });
  const c  = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  const li = Store.addBlock(c.id, 'spalte', { text: '' });
  const re = Store.addBlock(c.id, 'spalte', { text: '' });
  Store.addBlock(li.id, 'pdfseite', { text: '', nr: 3, bw: 595, bh: 842,
    quelleId: 'q', suchtext: 'Pythagoras und Geometrie\nAufgabe 1' });
  const bl = Store.addBlock(re.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.addBlock(bl.id, 'text', { text: 'Meine Rechnung steht hier' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(400);

const vorschau = await seite.evaluate(async () => {
  App.suche();
  await new Promise(r => setTimeout(r, 300));
  const inp = document.querySelector('#q') as HTMLInputElement | null;
  if (!inp) return { keinFeld: true };
  inp.value = 'Skriptseite';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  const v = document.querySelector('#vorschau');
  const text = v?.textContent || '';
  document.querySelector('.overlay')?.remove();
  return { keinFeld: false, text,
           zeilen: v?.querySelectorAll('.vs-t, .vs-h1, .vs-h2, .vs-h3, .vs-db').length ?? -1 };
});

p('Das Suchfeld war da', !vorschau.keinFeld);
p('Die Vorschau sagt NICHT mehr, die Seite sei leer',
  !/noch leer/.test(vorschau.text || ''), vorschau.text);
p('Sie nennt die PDF-Seite mit ihrer Nummer',
  /Seite 3/.test(vorschau.text || ''), vorschau.text);
p('Und den ersten Satz aus dem Skript',
  /Pythagoras und Geometrie/.test(vorschau.text || ''), vorschau.text);
p('Auch die eigene Rechnung vom Notizblatt',
  /Meine Rechnung steht hier/.test(vorschau.text || ''), vorschau.text);

/* Gegenprobe: eine wirklich leere Seite muss weiterhin „leer" sagen —
   sonst hätte man den Satz nur abgeschafft statt richtig gemacht. */
const leereSeite = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Wirklich leer hier' });
  Store.childrenOf(s.id).forEach((b: any) => Store.purgeBlock(b.id));
  App.suche();
  await new Promise(r => setTimeout(r, 300));
  const inp = document.querySelector('#q') as HTMLInputElement | null;
  if (inp) { inp.value = 'Wirklich leer hier';
             inp.dispatchEvent(new Event('input', { bubbles: true })); }
  await new Promise(r => setTimeout(r, 400));
  const text = document.querySelector('#vorschau')?.textContent || '';
  document.querySelector('.overlay')?.remove();
  return text;
});
p('Eine wirklich leere Seite sagt es weiterhin',
  /noch leer/.test(leereSeite), leereSeite);

/* ==========================================================================
 * §3 · Die Folie kennt BEIDE Spaltenformen
 * --------------------------------------------------------------------------
 * E102 hat die `spalte`-Hülle eingeführt und den Bestand ausdrücklich heil
 * gelassen. Der Editor zeichnet beide Formen; die Folie kannte nur eine.
 * ========================================================================*/
console.log('\n3 · Die Folie kennt BEIDE Spaltenformen');

const folie = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Vortrag' });
  /* ALT — so liegt der Bestand von vor E102 da: das Kind IST die Spalte. */
  const alt = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  Store.addBlock(alt.id, 'text', { text: 'ALTLINKS' });
  Store.addBlock(alt.id, 'text', { text: 'ALTRECHTS' });
  /* NEU — mit Hülle. */
  const neu = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  const nl = Store.addBlock(neu.id, 'spalte', { text: '' });
  const nr = Store.addBlock(neu.id, 'spalte', { text: '' });
  Store.addBlock(nl.id, 'text', { text: 'NEULINKS' });
  Store.addBlock(nr.id, 'text', { text: 'NEURECHTS' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));

  /* Zeichnet der EDITOR den alten Block überhaupt noch? Sonst wäre der
     ganze Fund gegenstandslos. */
  const imEditor = document.getElementById('scroll')?.textContent || '';

  await Werkzeuge.praesentation(Store.getBlock(s.id));
  await new Promise(r => setTimeout(r, 600));
  const praesi = document.querySelector('.praesi');
  const text = praesi?.textContent || '';
  /* Nicht die Kästen zählen, sondern die GEFÜLLTEN. Ohne die Reparatur
     entstehen die vier Kästen genauso — nur leer, und ein blosses
     `querySelectorAll('.folie-spalte').length` wäre grün geblieben
     (gemessen, §55.2). */
  const spalten = praesi
    ? [...praesi.querySelectorAll('.folie-spalte')]
        .filter(x => (x.textContent || '').trim().length > 0).length
    : -1;
  document.querySelector('.praesi')?.remove();
  document.querySelector('.overlay')?.remove();
  return { imEditor, text, spalten };
});

p('Der Editor zeichnet den alten Spaltenblock noch',
  /ALTLINKS/.test(folie.imEditor) && /ALTRECHTS/.test(folie.imEditor),
  folie.imEditor.slice(0, 120));
p('Die Folie zeigt den NEUEN Spaltenblock',
  /NEULINKS/.test(folie.text) && /NEURECHTS/.test(folie.text), folie.text.slice(0, 160));
p('Und den ALTEN genauso',
  /ALTLINKS/.test(folie.text) && /ALTRECHTS/.test(folie.text), folie.text.slice(0, 160));
gleich('Es sind vier Spalten auf der Folie', folie.spalten, 4);

/* ==========================================================================
 * §4 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n4 · Was der Quelltext verspricht');

const ohneK = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const bl = ohneK(fs.readFileSync(path.join(WURZEL, 'src/bereiche/bloecke/arten/blatt.ts'), 'utf8'));
const wz = ohneK(fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8'));
const sc = ohneK(fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf8'));

p('Das Blatt legt eine Zeile nach, wenn keine da ist',
  /if \(!kinder\.length\)/.test(bl) && /addBlock\(block\.id, 'text'/.test(bl));
p('Die Folie fragt, ob das Kind eine Hülle ist',
  /sp\.type === 'spalte'/.test(wz));
p('Die Vorschau steigt hinab',
  /const HUELLE = new Set/.test(sc) && /sammle\(b\.id, tiefe \+ 1\)/.test(sc));
p('Und sie hört bei vierzehn Zeilen auf',
  /zeilen\.length >= GRENZE/.test(sc));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
