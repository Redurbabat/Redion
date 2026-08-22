/* Suite 142 — Spalten halten ihren Inhalt (E102)
 * ============================================================================
 * Gemessen am 15. August, beim Bauen der Schulaufgaben-Seite: Kinder eines
 * `columns`-Blocks SIND die Spalten — je Kind eine Gitterzelle. Wer rechts
 * eine zweite Aufgabe anfängt und Enter drückt, legt ein Geschwister an, und
 * daraus wird eine DRITTE SPALTE. Aus zwei mach drei, aus drei mach vier;
 * die Seite zerfällt beim normalen Schreiben.
 *
 * Seit E102 liegt zwischen `columns` und dem Inhalt eine `spalte`: der
 * Elternteil des Inhalts ist die Spalte, ein Geschwister bleibt also IN der
 * Spalte. Bestandsblöcke ohne Hüllen zeichnen unverändert weiter — sonst
 * wäre jede bereits gebaute Seite kaputt.
 *
 *   node pruefungen/lauf/test176.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8931;

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
await seite.setViewportSize({ width: 1200, height: 850 });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

console.log('\n1 · Ein neuer Spaltenblock bringt echte Spalten mit');

const neu = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Spaltenprobe' });
  const roh = Store.addBlock(s.id, 'text', { text: '' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));
  /* Über den echten Weg: den Block in „Zwei Spalten" verwandeln. */
  (Blocks as any).umwandeln(roh.id, 'columns');
  await new Promise(r => setTimeout(r, 500));
  const kinder = Store.childrenOf(roh.id);
  return {
    seite: s.id, sp: roh.id,
    kinder: kinder.length,
    arten: kinder.map((k: any) => k.type),
    imDom: document.querySelectorAll('.spalten-block > *').length
  };
});
gleich('Zwei Kinder', (neu as any).kinder, 2);
p('… und beide sind Spalten',
  JSON.stringify((neu as any).arten) === JSON.stringify(['spalte', 'spalte']),
  JSON.stringify((neu as any).arten));
gleich('Zwei Zellen im Bild', (neu as any).imDom, 2);

console.log('\n2 · Enter im Inhalt bleibt IN der Spalte — der eigentliche Fehler');

const nachEnter = await seite.evaluate(async (arg: any) => {
  const links = Store.childrenOf(arg.sp)[0];
  const vorZeilen = Store.childrenOf(links.id).length;
  const inhalt = Store.addBlock(links.id, 'todo', { text: 'Aufgabe 1' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 400));
  const el = document.querySelector<HTMLElement>(`[data-bid="${inhalt.id}"] [contenteditable]`)
          || document.querySelector<HTMLElement>(`[data-bid="${inhalt.id}"]`);
  el?.focus();
  const sel = window.getSelection();
  if (el && sel) {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    sel.removeAllRanges(); sel.addRange(r);
  }
  el?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise(r => setTimeout(r, 500));
  return {
    spaltenZahl: Store.childrenOf(arg.sp).length,
    /* Eine Spalte bringt selbst eine leere Zeile mit — deshalb zählt der
       ZUWACHS, nicht die absolute Zahl. */
    zuwachs: Store.childrenOf(Store.childrenOf(arg.sp)[0].id).length - vorZeilen,
    imDom: document.querySelectorAll('.spalten-block > *').length
  };
}, neu);
gleich('Es bleiben ZWEI Spalten (vorher wurden es drei)', (nachEnter as any).spaltenZahl, 2);
gleich('Die neue Zeile kam IN die linke Spalte', (nachEnter as any).zuwachs, 2);
gleich('Auch im Bild sind es zwei Zellen', (nachEnter as any).imDom, 2);

console.log('\n3 · Drei Spalten ebenso');

const drei = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Dreierprobe' });
  const roh = Store.addBlock(s.id, 'text', { text: '' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  (Blocks as any).umwandeln(roh.id, 'columns3');
  await new Promise(r => setTimeout(r, 500));
  return {
    kinder: Store.childrenOf(roh.id).length,
    alleSpalten: Store.childrenOf(roh.id).every((k: any) => k.type === 'spalte'),
    imDom: document.querySelectorAll('.spalten-block > *').length
  };
});
gleich('Drei Spalten', (drei as any).kinder, 3);
p('… alle drei als Spalte angelegt', (drei as any).alleSpalten);
gleich('Drei Zellen im Bild', (drei as any).imDom, 3);

console.log('\n4 · Der Bestand bleibt heil: alte Blöcke ohne Hüllen zeichnen weiter');

const alt = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Altbestand' });
  /* So sah ein Spaltenblock vor E102 aus: Inhalt direkt als Kind. */
  const sp = Store.addBlock(s.id, 'columns', { text: '' });
  Store.addBlock(sp.id, 'text', { text: 'links, alt' });
  Store.addBlock(sp.id, 'text', { text: 'rechts, alt' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  const zellen = [...document.querySelectorAll('.spalten-block > *')];
  return {
    imDom: zellen.length,
    /* NICHT kürzen: die Griffe (+ und ⋮⋮) stehen mit im textContent, und
       zwölf Zeichen davon liessen vom Text nur „links, al" übrig. Der
       erste Wurf verglich danach und meldete einen Fehler, den es nicht
       gab. */
    texte: zellen.map(z => (z.textContent || '').trim())
  };
});
gleich('Der alte Block zeigt weiterhin zwei Zellen', (alt as any).imDom, 2);
p('… mit ihrem Inhalt',
  ((alt as any).texte || []).join('|').includes('links, alt') &&
  ((alt as any).texte || []).join('|').includes('rechts, alt'),
  JSON.stringify((alt as any).texte));

console.log('\n5 · Nach dem Neuladen steht alles noch so da');

await seite.reload();
await seite.waitForTimeout(2600);
const nachher = await seite.evaluate(async (arg: any) => {
  App.oeffne(arg.seite);
  await new Promise(r => setTimeout(r, 600));
  return {
    spalten: Store.childrenOf(arg.sp).length,
    arten: Store.childrenOf(arg.sp).map((k: any) => k.type),
    imDom: document.querySelectorAll('.spalten-block > *').length
  };
}, neu);
gleich('Zwei Spalten überleben den Neustart', (nachher as any).spalten, 2);
gleich('… und werden auch wieder gezeichnet', (nachher as any).imDom, 2);

console.log('\n6 · Der Quelltext kennt die Zwischenschicht');
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/editor/ansicht/editor.ts'), 'utf8');
p('Neue Spaltenblöcke bekommen `spalte`-Hüllen',
  quelle.includes("Store.addBlock(id, 'spalte'"));
p('Und der Zeichner kennt beide Formen',
  quelle.includes("k.type === 'spalte'") || quelle.includes("'spalte'"));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
