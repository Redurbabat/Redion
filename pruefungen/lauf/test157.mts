/* Suite 121 — Ziehen am Telefon: langes Drücken hebt, der Finger trägt (L10)
 * ============================================================================
 * Am Rechner zieht man Blöcke am ⋮⋮-Griff. Am Telefon gibt es keine Griffe —
 * und bis heute gar keinen Weg, einen Block mit dem Finger zu verschieben:
 * langes Drücken öffnete sofort das Menü, und das war alles.
 *
 * Jetzt gilt die Notion-Geste: langes Drücken HEBT den Block an (spürbar,
 * sichtbar), der Finger trägt ihn, eine Marke zeigt die Lücke, Loslassen
 * legt ihn dort ab. Loslassen OHNE Bewegung öffnet weiter das Menü — die
 * alte Geste bleibt also, sie wird nur um das Tragen reicher.
 *
 * Geprüft wird mit echten Berührungen über CDP, wie in test114 — ein
 * Direktaufruf der Funktionen wäre immer grün und bewiese nichts über die
 * Geste selbst.
 *
 *   node pruefungen/lauf/test157.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8869;

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
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Ziehen' });
  const a = Store.addBlock(s.id, 'text', { text: 'Alpha' });
  const b = Store.addBlock(s.id, 'text', { text: 'Beta' });
  const c = Store.addBlock(s.id, 'text', { text: 'Gamma' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  return { seite: s.id, a: a.id, b: b.id, c: c.id };
});

const mitte = async (bid: string) => await seite.evaluate((id: string) => {
  const el = document.querySelector(`.blk[data-bid="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(80, r.width / 2), y: r.top + r.height / 2,
           unten: r.bottom - 4 };
}, bid) as { x: number; y: number; unten: number } | null;

const cdp = await seite.context().newCDPSession(seite);
const druck = (x: number, y: number) =>
  cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
const zug = (x: number, y: number) =>
  cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
const los = () =>
  cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

console.log('\n1 · Langes Drücken hebt den Block an — kein Menü, noch nicht');

const alpha = (await mitte(ids.a))!;
p('Alpha steht bereit', !!alpha);
await druck(alpha.x, alpha.y);
await seite.waitForTimeout(650);
const gehoben = await seite.evaluate((id: string) => ({
  gehoben: !!document.querySelector(`.blk[data-bid="${id}"].gehoben`),
  menue: !!document.querySelector('.menu')
}), ids.a);
gleich('Alpha ist angehoben', gehoben.gehoben, true);
gleich('Das Menü ist NICHT offen — der Finger liegt noch auf', gehoben.menue, false);

console.log('\n2 · Der Finger trägt, die Marke zeigt die Lücke');

const gamma = (await mitte(ids.c))!;
/* In Schritten nach unten, wie ein echter Finger */
for (let i = 1; i <= 6; i++) {
  await zug(alpha.x, alpha.y + ((gamma.unten - alpha.y) * i) / 6);
  await seite.waitForTimeout(30);
}
const marke = await seite.evaluate(() => {
  const m = document.querySelector('.fallmarke') as HTMLElement | null;
  return { da: !!m && m.style.display !== 'none', top: m ? Math.round(m.getBoundingClientRect().top) : -1 };
});
gleich('Die Fallmarke ist sichtbar', marke.da, true);
p('… und liegt an Gammas Unterkante', Math.abs(marke.top - gamma.unten) < 14,
  `Marke ${marke.top}, Unterkante ${Math.round(gamma.unten)}`);

console.log('\n3 · Loslassen legt ab — Alpha steht jetzt hinter Gamma');

await los();
await seite.waitForTimeout(500);
const danach = await seite.evaluate((s: { seite: string }) => ({
  folge: (Store.getBlock(s.seite)?.content || []).map((x: string) =>
    (Store.getBlock(x)?.text || '')).join(','),
  gehoben: !!document.querySelector('.gehoben'),
  marke: !!document.querySelector('.fallmarke'),
  menue: !!document.querySelector('.menu')
}), ids);
gleich('Die Reihenfolge ist Beta, Gamma, Alpha', danach.folge, 'Beta,Gamma,Alpha');
gleich('Nichts ist mehr angehoben', danach.gehoben, false);
gleich('Die Marke ist weg', danach.marke, false);
gleich('Und ein Menü hat sich nicht geöffnet', danach.menue, false);

console.log('\n4 · Loslassen OHNE Bewegung öffnet weiter das Menü — und es überlebt');

const beta = (await mitte(ids.b))!;
await druck(beta.x, beta.y);
await seite.waitForTimeout(650);
await los();
await seite.waitForTimeout(400);
const menue = await seite.evaluate(() => {
  const m = document.querySelector('.menu');
  return { da: !!m, blatt: m?.classList.contains('blatt') ?? false,
           gehoben: !!document.querySelector('.gehoben') };
});
gleich('Das Menü ist da', menue.da, true);
gleich('… als Blatt von unten', menue.blatt, true);
gleich('… und der Block ist wieder abgesetzt', menue.gehoben, false);
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });

console.log('\n5 · Ein kurzer Tipp bleibt ein Tipp');

await druck(beta.x, beta.y);
await seite.waitForTimeout(120);
await los();
await seite.waitForTimeout(400);
const tipp = await seite.evaluate(() => ({
  menue: !!document.querySelector('.menu'),
  gehoben: !!document.querySelector('.gehoben')
}));
gleich('Kein Menü', tipp.menue, false);
gleich('Nichts angehoben', tipp.gehoben, false);

console.log('\n6 · Wischen bleibt Wischen: die Aufgabe wird abgehakt');

const todoId = await seite.evaluate(async (s: { seite: string }) => {
  const t = Store.addBlock(s.seite, 'todo', { text: 'Haken' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 400));
  return t.id;
}, ids);
const todo = await seite.evaluate((id: string) => {
  const el = document.querySelector(`.blk[data-bid="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + 3, y: r.top + r.height / 2 };
}, todoId) as { x: number; y: number } | null;
p('Die Aufgabe steht bereit', !!todo);
if (todo) {
  await druck(todo.x, todo.y);
  for (let i = 1; i <= 5; i++) { await zug(todo.x + i * 20, todo.y); await seite.waitForTimeout(25); }
  await los();
  await seite.waitForTimeout(400);
  const geprueft = await seite.evaluate((id: string) => !!Store.getBlock(id)?.checked, todoId);
  gleich('Nach dem Wischen nach rechts ist sie erledigt', geprueft, true);

  console.log('\n7 · Und ein Tipp auf die Checkbox schaltet weiterhin');

  /* Die neue Armier-Regel (Wischen darf auf der Checkbox BEGINNEN) darf
     den Tipp nicht fressen: unter der 70-px-Schwelle wird nichts
     geschluckt, der nachgereichte Klick trifft die Checkbox wie immer. */
  const kasten = await seite.evaluate((id: string) => {
    const cb = document.querySelector(`.blk[data-bid="${id}"] input[type="checkbox"]`);
    if (!cb) return null;
    const r = cb.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, todoId) as { x: number; y: number } | null;
  p('Die Checkbox steht bereit', !!kasten);
  if (kasten) {
    await druck(kasten.x, kasten.y);
    await seite.waitForTimeout(80);
    await los();
    await seite.waitForTimeout(400);
    const danachTipp = await seite.evaluate((id: string) => !!Store.getBlock(id)?.checked, todoId);
    gleich('Der Tipp nimmt das Häkchen wieder weg', danachTipp, false);
  }
}

console.log('\n8 · Ein Block fällt nicht in sein eigenes Inneres');

/* Der Review von E83 fand das Loch — und es klaffte auch am Rechner,
   seit es das Ziehen gibt: wer einen Block neben eines seiner KINDER
   legt, hängt seine Elternkette im Kreis auf. Der Teilbaum verschwindet
   von der Seite, ohne gelöscht zu sein. */
const zyklus = await seite.evaluate(async (s: { seite: string }) => {
  const t = Store.addBlock(s.seite, 'toggle', { text: 'Eltern' });
  const kind = Store.addBlock(t.id, 'text', { text: 'Kind' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 400));
  const vorher = (Store.getBlock(s.seite)?.content || []).length;
  Blocks.lege(t.id, kind.id, true);          /* Eltern NEBEN das eigene Kind */
  await new Promise(r => setTimeout(r, 200));
  const elternJetzt = Store.getBlock(t.id);
  return {
    vorher, nachher: (Store.getBlock(s.seite)?.content || []).length,
    elternWoNoch: elternJetzt ? elternJetzt.parentId === s.seite : false,
    kindNochDrin: (elternJetzt?.content || []).includes(kind.id)
  };
}, ids);
gleich('Die Seite hat danach so viele Blöcke wie davor', zyklus.nachher, zyklus.vorher);
gleich('Der Eltern-Block hängt weiter an der Seite — kein Kreis', zyklus.elternWoNoch, true);
gleich('… und sein Kind ist noch bei ihm', zyklus.kindNochDrin, true);

console.log('\n9 · Ein zweiter Finger beendet das Tragen nicht');

const zwei = await seite.evaluate(() => {
  const bloecke = [...document.querySelectorAll<HTMLElement>('.blk')];
  const a = bloecke[0]!.getBoundingClientRect();
  return { x: a.left + 60, y: a.top + a.height / 2 };
});
await druck(zwei.x, zwei.y);
await seite.waitForTimeout(650);
/* Der Handballen setzt auf … */
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart',
  touchPoints: [{ x: zwei.x, y: zwei.y }, { x: 320, y: 700 }] });
/* … und geht wieder weg — der tragende Finger bleibt. */
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd',
  touchPoints: [{ x: zwei.x, y: zwei.y }] });
await seite.waitForTimeout(200);
const traegtNoch = await seite.evaluate(() => ({
  gehoben: !!document.querySelector('.gehoben'),
  menue: !!document.querySelector('.menu')
}));
gleich('Der Block ist noch gehoben', traegtNoch.gehoben, true);
gleich('Kein Menü ist aufgesprungen', traegtNoch.menue, false);
await los();
await seite.waitForTimeout(300);
p('Nach dem letzten Finger ist er abgesetzt',
  await seite.evaluate(() => !document.querySelector('.gehoben')));
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });

console.log('\n10 · Im fokussierten Schreibfeld hebt langes Drücken nicht');

/* Wer schreibt, wählt mit langem Drücken ein Wort aus — kein Block darf
   ihm dabei davonschweben. Dieselbe Regel wie beim Wischen. */
const feld = await seite.evaluate((s: { b: string }) => {
  const ct = document.querySelector(`.blk[data-bid="${s.b}"] .ct`) as HTMLElement;
  ct.focus();
  const r = ct.getBoundingClientRect();
  return { x: r.left + 40, y: r.top + r.height / 2 };
}, ids);
await druck(feld.x, feld.y);
await seite.waitForTimeout(650);
const imFeld = await seite.evaluate(() => !!document.querySelector('.gehoben'));
await los();
await seite.waitForTimeout(300);
gleich('Nichts wurde angehoben', imFeld, false);
await seite.evaluate(() => {
  (document.activeElement as HTMLElement | null)?.blur();
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
});

console.log('\n11 · Ein Neuzeichnen mitten in der Geste hinterlässt nichts Sichtbares');

/* Zweiter Tab oder Abgleich-Takt können mitten in der Geste neu zeichnen.
   Danach ist das gehobene Element abgehängt — sichtbar tragen darf nichts
   mehr, keine Marke darf stehen bleiben.

   ALS LETZTER ABSCHNITT, mit Bedacht: nach einem Neuzeichnen mitten in
   der Berührung stellt der Prüfstand (CDP) KEINE Berührungen mehr zu —
   nicht einmal das touchstart einer frischen Geste; gemessen am 9. August,
   das Ziel war live und das Ereignis kam nie an. Jeder Gesten-Punkt nach
   diesem Abschnitt wäre deshalb stillschweigend wertlos (ein verkeilter
   Prüfstand macht „nichts gehoben" grün, ohne etwas zu prüfen). Ob ein
   ECHTES Gerät die nächste Geste zustellt — und damit der Leichen-Wächter
   im touchstart greift —, kann nur ein echtes Gerät zeigen (L10). */
const neuzeichnen = await seite.evaluate(async () => {
  const bloecke = [...document.querySelectorAll<HTMLElement>('.blk')];
  return bloecke[0] ? bloecke[0].dataset['bid'] ?? null : null;
});
const wo = neuzeichnen ? await mitte(neuzeichnen) : null;
if (neuzeichnen && wo) {
  await druck(wo.x, wo.y);
  await seite.waitForTimeout(650);
  p('Die Hebung steht', await seite.evaluate(() => !!document.querySelector('.gehoben')));
  /* Erst TRAGEN — sonst gibt es nie eine Fallmarke, und der Punkt unten
     wäre grün, ohne je etwas geprüft zu haben. */
  await zug(wo.x, wo.y + 90);
  await seite.waitForTimeout(150);
  p('Die Fallmarke steht', await seite.evaluate(() => !!document.querySelector('.fallmarke')));
  await seite.evaluate(() => { App.zeichneSeite(); });
  await seite.waitForTimeout(300);
  await los();
  await seite.waitForTimeout(200);
  const danachRender = await seite.evaluate(() => ({
    gehoben: !!document.querySelector('.gehoben'),
    marke: !!document.querySelector('.fallmarke')
  }));
  gleich('Nach dem Neuzeichnen trägt nichts sichtbar weiter', danachRender.gehoben, false);
  gleich('Die Fallmarke ist mit abgeräumt — ohne dass je ein Ereignis kam',
    danachRender.marke, false);
}

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
