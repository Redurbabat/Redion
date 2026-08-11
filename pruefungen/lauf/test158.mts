/* Suite 122 — Mehrfachauswahl am Telefon: hinein per Menü, erweitern per Tipp (L10)
 * ============================================================================
 * In die Mehrfachauswahl kam man nur mit Esc aus dem Text oder mit
 * Umschalt-/Strg-Klick — am Telefon gibt es weder das eine noch das andere.
 * Die Auswahl-Leiste mit ihren Aktionen existierte dort als reines Gerücht.
 *
 * Jetzt: „Auswählen" im Blockmenü steigt ein (Leiste ab dem ERSTEN Block,
 * am Rechner weiter ab zwei), ein Tipp auf andere Blöcke schaltet sie dazu
 * und wieder weg, ein Tipp ins Leere beendet. Und die Tastatur bleibt zu:
 * mousedown wird bei aktiver Auswahl abgefangen, sonst spränge bei jedem
 * Dazuschalten das Schreibfeld auf.
 *
 *   node pruefungen/lauf/test158.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8871;

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
const seite = await browser.newPage({ viewport: { width: 390, height: 844 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

const ids = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Auswahl' });
  const a = Store.addBlock(s.id, 'text', { text: 'Erster' });
  const b = Store.addBlock(s.id, 'text', { text: 'Zweiter' });
  const c = Store.addBlock(s.id, 'text', { text: 'Dritter' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  return { seite: s.id, a: a.id, b: b.id, c: c.id };
});

const cdp = await seite.context().newCDPSession(seite);
const druck = (x: number, y: number) =>
  cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
const los = () =>
  cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const tipp = async (x: number, y: number) => { await druck(x, y); await seite.waitForTimeout(90); await los(); };
const mitte = async (bid: string) => await seite.evaluate((id: string) => {
  const el = document.querySelector(`.blk[data-bid="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(80, r.width / 2), y: r.top + r.height / 2 };
}, bid) as { x: number; y: number };

console.log('\n1 · „Auswählen" steht im Blockmenü und steigt ein');

const erster = await mitte(ids.a);
await druck(erster.x, erster.y);
await seite.waitForTimeout(650);
await los();
await seite.waitForTimeout(400);
const eintrag = await seite.evaluate(() => {
  const k = document.querySelector('.menu button[data-a="auswahl"]');
  return { da: !!k, text: k?.textContent?.trim() ?? '' };
});
gleich('Der Eintrag ist da', eintrag.da, true);
p('… und heisst „Auswählen"', eintrag.text.includes('Auswählen'), eintrag.text);

await seite.evaluate(() => {
  (document.querySelector('.menu button[data-a="auswahl"]') as HTMLElement)?.click();
});
await seite.waitForTimeout(300);
const drin = await seite.evaluate((s: { a: string }) => ({
  gewaehlt: !!document.querySelector(`.blk[data-bid="${s.a}"].gewaehlt`),
  leiste: !!document.getElementById('auswahl-leiste'),
  zahl: document.querySelector('#auswahl-leiste b')?.textContent ?? '',
  menueZu: !document.querySelector('.menu, .menu-grund')
}), ids);
gleich('Der Block ist gewählt', drin.gewaehlt, true);
gleich('Die Auswahl-Leiste steht — schon ab EINEM Block', drin.leiste, true);
gleich('… und zählt richtig', drin.zahl, '1 Block');
gleich('Das Menü samt Grund ist zu', drin.menueZu, true);

console.log('\n2 · Ein Tipp schaltet weitere Blöcke dazu und wieder weg');

const zweiter = await mitte(ids.b);
await tipp(zweiter.x, zweiter.y);
await seite.waitForTimeout(300);
const zwei = await seite.evaluate((s: { a: string; b: string }) => ({
  a: !!document.querySelector(`.blk[data-bid="${s.a}"].gewaehlt`),
  b: !!document.querySelector(`.blk[data-bid="${s.b}"].gewaehlt`),
  zahl: document.querySelector('#auswahl-leiste b')?.textContent ?? ''
}), ids);
gleich('Der erste bleibt gewählt', zwei.a, true);
gleich('Der zweite kommt dazu', zwei.b, true);
gleich('Die Leiste zählt „2 Blöcke"', zwei.zahl, '2 Blöcke');

/* Das E84-Bild zeigte ~30-px-Knöpfe — dieselbe §37-Falle wie bei der
   Formatleiste (E81). Gemessen, nicht geglaubt. */
const knopfmasse = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('#auswahl-leiste button')].map(k => {
    const r = k.getBoundingClientRect();
    return { t: (k.textContent || '').trim().slice(0, 10), kurz: Math.min(r.width, r.height) };
  }));
p('Alle ' + knopfmasse.length + ' Leisten-Knöpfe messen mindestens 44 px (§37)',
  knopfmasse.length >= 5 && knopfmasse.every(k => k.kurz >= 44),
  knopfmasse.filter(k => k.kurz < 44).map(k => `${k.t} ${Math.round(k.kurz)}px`).join(', '));

await tipp(zweiter.x, zweiter.y);
await seite.waitForTimeout(300);
const wiederEiner = await seite.evaluate((s: { b: string }) => ({
  b: !!document.querySelector(`.blk[data-bid="${s.b}"].gewaehlt`),
  zahl: document.querySelector('#auswahl-leiste b')?.textContent ?? ''
}), ids);
gleich('Nochmal getippt: der zweite ist wieder draussen', wiederEiner.b, false);
gleich('Die Leiste zählt wieder „1 Block"', wiederEiner.zahl, '1 Block');

console.log('\n3 · Die Tastatur bleibt dabei zu');

const ruhe = await seite.evaluate(() => ({
  aktiv: document.activeElement === document.body || document.activeElement === null ||
         !(document.activeElement instanceof HTMLElement &&
           document.activeElement.closest('.ct')),
  schreibt: document.body.classList.contains('schreibt')
}));
gleich('Kein Schreibfeld hat den Fokus', ruhe.aktiv, true);
gleich('Die Formatleiste ist folgerichtig auch nicht da', ruhe.schreibt, false);

console.log('\n4 · Die Aktionen der Leiste wirken: Löschen');

const dritter = await mitte(ids.c);
await tipp(dritter.x, dritter.y);
await seite.waitForTimeout(300);
await seite.evaluate(() => {
  (document.querySelector('#auswahl-leiste [data-a="weg"]') as HTMLElement)?.click();
});
await seite.waitForTimeout(400);
const geloescht = await seite.evaluate((s: { seite: string; a: string; c: string }) => ({
  inhalt: (Store.getBlock(s.seite)?.content || []).length,
  aWeg: !(Store.getBlock(s.seite)?.content || []).includes(s.a),
  cWeg: !(Store.getBlock(s.seite)?.content || []).includes(s.c),
  leisteWeg: !document.getElementById('auswahl-leiste')
}), ids);
gleich('Beide gewählten Blöcke sind von der Seite', geloescht.aWeg && geloescht.cWeg, true);
gleich('Der ungewählte bleibt', geloescht.inhalt, 1);
gleich('Die Leiste ist zu', geloescht.leisteWeg, true);

console.log('\n5 · Ein Tipp ins Leere beendet die Auswahl');

const nochmal = await mitte(ids.b);
await druck(nochmal.x, nochmal.y);
await seite.waitForTimeout(650);
await los();
await seite.waitForTimeout(400);
await seite.evaluate(() => {
  (document.querySelector('.menu button[data-a="auswahl"]') as HTMLElement)?.click();
});
await seite.waitForTimeout(300);
p('Die Auswahl steht wieder', await seite.evaluate(() =>
  !!document.getElementById('auswahl-leiste')));
await tipp(200, 700);   /* unterhalb des letzten Blocks — Leere */
await seite.waitForTimeout(300);
const leer = await seite.evaluate(() => ({
  leiste: !!document.getElementById('auswahl-leiste'),
  gewaehlt: document.querySelectorAll('.blk.gewaehlt').length
}));
gleich('Die Leiste ist zu', leer.leiste, false);
gleich('Nichts ist mehr gewählt', leer.gewaehlt, 0);

console.log('\n6 · Am Rechner bleibt alles beim Alten');

const rechner = await browser.newPage({ viewport: { width: 1280, height: 800 } });
rechner.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const amRechner = await rechner.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Rechner' });
  const a = Store.addBlock(s.id, 'text', { text: 'Eins' });
  Store.addBlock(s.id, 'text', { text: 'Zwei' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  Blocks.auswahlSetzen([a.id]);
  await new Promise(r => setTimeout(r, 200));
  return {
    gewaehlt: !!document.querySelector(`.blk[data-bid="${a.id}"].gewaehlt`),
    leisteBeiEinem: !!document.getElementById('auswahl-leiste')
  };
});
gleich('Ein einzelner Block wird markiert', amRechner.gewaehlt, true);
gleich('… aber die Leiste kommt am Rechner erst ab zwei', amRechner.leisteBeiEinem, false);

console.log('\n7 · Alt+Umschalt+Klick wählt am Rechner — auch als erster (L20-Rest)');

const altKlick = await rechner.evaluate(async () => {
  Blocks.auswahlLeeren();
  await new Promise(r => setTimeout(r, 150));
  const blk = document.querySelector<HTMLElement>('#page .blk[data-bid]')!;
  const id = blk.dataset['bid']!;
  const schuss = (art: string) => blk.dispatchEvent(new MouseEvent(art,
    { bubbles: true, cancelable: true, altKey: true, shiftKey: true }));
  schuss('mousedown'); schuss('mouseup'); schuss('click');
  await new Promise(r => setTimeout(r, 150));
  const gewaehlt = !!document.querySelector(`.blk[data-bid="${id}"].gewaehlt`);
  schuss('mousedown'); schuss('mouseup'); schuss('click');
  await new Promise(r => setTimeout(r, 150));
  return { gewaehlt, wiederWeg: !document.querySelector(`.blk[data-bid="${id}"].gewaehlt`) };
});
gleich('Der erste Alt+Umschalt+Klick wählt den Block', (altKlick as any).gewaehlt, true);
gleich('Der zweite nimmt ihn wieder heraus', (altKlick as any).wiederWeg, true);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
