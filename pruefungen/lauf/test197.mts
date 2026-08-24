/* Suite 163 — Markdown-Zitate und ehrliche Tastenkürzel (P5)
 *
 * Echte Produktwege: Einfügen wird als ClipboardEvent an das sichtbare
 * Textfeld geschickt; Strg+K als echter Tastendruck; URL-Paste ebenso.
 * Ausserdem schützt die frei belegbare Tastatur Browser und Bearbeitung.
 *
 *   node pruefungen/lauf/test197.mts
 */
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8953;
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
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (name: string, gut: unknown, extra = '') => {
  if (gut) { ok++; console.log('  ✓ ' + name); }
  else { weg++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown) =>
  p(name, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 850 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(e.message));
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

console.log('\n1 · Verschachtelte Zitate durch den echten Paste-Griff');
const zitate = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Zitatprobe' });
  const leer = Store.addBlock(s.id, 'text', { text: '' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 350));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${leer.id}"] .ct`);
  if (!ct) throw new Error('Paste-Ziel fehlt');
  ct.focus();
  const dt = new DataTransfer();
  dt.setData('text/plain', '> Aussen\n> > Innen eins\n> > Innen zwei\n> Wieder aussen');
  ct.dispatchEvent(new ClipboardEvent('paste',
    { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 350));
  const page = Store.getBlock(s.id);
  const oben = (page.content || []).map((id: string) => Store.getBlock(id));
  const aussen = oben.find((b: any) => b?.text === 'Aussen');
  const innen = (aussen?.content || []).map((id: string) => Store.getBlock(id));
  return {
    oben: oben.map((b: any) => [b.type, b.text]),
    innen: innen.map((b: any) => [b.type, b.text]),
    marker: [...oben, ...innen].some((b: any) => /^>/.test(b?.text || ''))
  };
});
gleich('Zwei äussere Zitate bleiben Geschwister', zitate.oben,
  [['quote', 'Aussen'], ['quote', 'Wieder aussen']]);
gleich('Zwei innere Zitate sind echte Kinder des ersten', zitate.innen,
  [['quote', 'Innen eins'], ['quote', 'Innen zwei']]);
p('Keine zweite >-Marke bleibt im Text', !zitate.marker);

console.log('\n2 · Strg+K setzt im Editor einen Link statt die Suche zu öffnen');
const strgK = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Linkprobe' });
  const b = Store.addBlock(s.id, 'text', { text: 'Alpha Beta' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`)!;
  const knoten = ct.firstChild!;
  const range = document.createRange(); range.setStart(knoten, 6); range.setEnd(knoten, 10);
  const sel = getSelection()!; sel.removeAllRanges(); sel.addRange(range);
  const altPrompt = window.prompt;
  window.prompt = () => 'https://example.test/beta';
  ct.dispatchEvent(new KeyboardEvent('keydown',
    { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true, cancelable: true }));
  window.prompt = altPrompt;
  await new Promise(r => setTimeout(r, 250));
  return {
    text: Store.getBlock(b.id).text,
    suche: !!document.querySelector('.finder input[placeholder*="Such"]')
  };
});
gleich('Der markierte Text trägt die Adresse', strgK.text,
  'Alpha [Beta](https://example.test/beta)');
p('Die globale Suche blieb zu', !strgK.suche);

console.log('\n3 · URL-Paste legt die Adresse über die Auswahl');
const urlPaste = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Paste-Link' });
  const b = Store.addBlock(s.id, 'text', { text: 'Gamma Delta' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`)!;
  const knoten = ct.firstChild!;
  const range = document.createRange(); range.setStart(knoten, 0); range.setEnd(knoten, 5);
  const sel = getSelection()!; sel.removeAllRanges(); sel.addRange(range);
  const dt = new DataTransfer(); dt.setData('text/plain', 'https://example.test/gamma');
  ct.dispatchEvent(new ClipboardEvent('paste',
    { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 250));
  return Store.getBlock(b.id).text;
});
gleich('Der lesbare Text bleibt, die URL liegt darüber', urlPaste,
  '[Gamma](https://example.test/gamma) Delta');

console.log('\n4 · Umbelegen kann keine Browser- oder Bearbeitungstaste stehlen');
const tasten = await seite.evaluate(async () => {
  const reserviert = ['Ctrl+C','Ctrl+V','Ctrl+X','Ctrl+A','Ctrl+R','Ctrl+S','Ctrl+T','Ctrl+W']
    .every(x => Aussehen.reserviert(x));
  const ids = Aussehen.umbelegbar();
  Store.setMeta('kuerzel', { suche: 'Ctrl+C' });
  document.querySelectorAll('.overlay,.menu-grund').forEach(x => x.remove());
  const alt = new KeyboardEvent('keydown',
    { key: 'c', code: 'KeyC', ctrlKey: true, bubbles: true, cancelable: true });
  document.body.dispatchEvent(alt);
  await new Promise(r => setTimeout(r, 120));
  const sucheAlt = !!document.querySelector('.finder');

  Store.setMeta('kuerzel', { suche: 'Ctrl+Alt+Q' });
  const neu = new KeyboardEvent('keydown',
    { key: 'q', code: 'KeyQ', ctrlKey: true, altKey: true, bubbles: true, cancelable: true });
  document.body.dispatchEvent(neu);
  await new Promise(r => setTimeout(r, 150));
  const sucheNeu = !!document.querySelector('.finder');
  document.querySelectorAll('.overlay,.menu-grund').forEach(x => x.remove());
  Store.setMeta('kuerzel', {});
  return { reserviert, ids, altGenommen: alt.defaultPrevented, sucheAlt,
           neuGenommen: neu.defaultPrevented, sucheNeu };
});
p('Die acht kritischen Kombinationen sind reserviert', tasten.reserviert);
p('Nur global ausführbare Befehle sind umbelegbar',
  tasten.ids.includes('suche') && tasten.ids.includes('reiterNeu') &&
  !tasten.ids.includes('fett') && !tasten.ids.includes('link') &&
  !tasten.ids.includes('duplizieren'), JSON.stringify(tasten.ids));
p('Eine alte Strg+C-Belegung wird weder genommen noch ausgeführt',
  !tasten.altGenommen && !tasten.sucheAlt, JSON.stringify(tasten));
p('Eine sichere neue Kombination wird genommen und ausgeführt',
  tasten.neuGenommen && tasten.sucheNeu, JSON.stringify(tasten));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
