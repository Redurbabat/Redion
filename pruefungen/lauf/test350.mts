/* Suite 350 — Zurück fasst nur an, was sich änderte (E358, L115 Punkt 7)
 * ============================================================================
 * Jedes Zurück zeichnete die ganze Schicht neu — jeder Knoten weg, jeder
 * neu. Bei tausend Marken 59 ms, bei dreitausend 155 (gemessen, 2. 9. 2026).
 * Jetzt merkt sich die Schicht je Marke die gezeichnete Fassung und fasst
 * nur an, was anders ist: gleiche Fassung, gleicher Knoten.
 *
 *   1 · DIE PROBE: 303 Marken, jeder Knoten bekommt ein Kennzeichen; ein
 *       Strich dazu, Zurück — 303 Knoten, und ALLE tragen das Kennzeichen noch.
 *   2 · VOR bringt den Strich als neuen Knoten zurück; die 303 bleiben.
 *   3 · VERSCHIEBEN und Zurück: der bewegte Strich behält seinen Knoten
 *       (geflickt, nicht ersetzt), und sein Pfad ist wieder der alte.
 *   4 · LÖSCHEN in der Mitte und Zurück: die Marke kommt an ihren Platz —
 *       die Folge der Knoten ist die Folge der Marken (die Stapelung).
 *   5 · GEMESSEN bei 1000 Marken — Zurück in Millisekunden (weiche Grenze).
 *   6 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test350.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9354;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
type Seite = import('playwright').Page;
const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const pg = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
pg.on('dialog', d => d.dismiss().catch(() => {}));
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForTimeout(2800);

/** Ein Blatt mit n Strichen und drei Zetteln; gibt die Blattkennung. */
const blatt = (pg: Seite, n: number) => pg.evaluate(async (n: number) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Zurück-Probe ' + n, icon: '↶' });
  const marken: any[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = 20 + (i % 40) * 14, y0 = 20 + Math.floor(i / 40) * 10;
    const pts: number[][] = []; const pressure: number[] = [];
    for (let k = 0; k < 20; k++) { pts.push([x0 + k * 0.6, y0 + Math.sin(k) * 2]); pressure.push(0.5); }
    marken.push({ id: 'm' + i, art: 'stift', farbe: '#111111', breite: 2.4, pts, pressure, stil: i % 2 ? 'fueller' : undefined });
  }
  for (let z = 0; z < 3; z++)
    marken.push({ id: 'z' + z, art: 'zettel', farbe: '#e0a419', breite: 2.4, text: 'Zettel ' + z, pts: [[400 + z * 50, 500], [440 + z * 50, 540]] });
  const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko', marken });
  Store.addBlock(b.id, 'text', { text: '' });
  await Store.flush(); App.oeffne(s.id); await new Promise(f => setTimeout(f, 1200));
  return b.id as string;
}, n);
/* Das Kennzeichen ist eine JS-EIGENSCHAFT am Knoten, kein Attribut: ein
   Flicken (`updateNode`) streift alle Attribute ab und setzt sie neu —
   der Knoten bleibt derselbe, und genau das soll gezaehlt werden. */
const zaehle = (pg: Seite) => pg.evaluate(() => ({
  knoten: document.querySelectorAll('.blatt-marken [data-sid]').length,
  gekennzeichnet: [...document.querySelectorAll('.blatt-marken [data-sid]')].filter(n => (n as any).__probe === true).length
}));
const kennzeichne = (pg: Seite) => pg.evaluate(() =>
  document.querySelectorAll('.blatt-marken [data-sid]').forEach(n => { (n as any).__probe = true; }));
const zug = (pg: Seite, punkte: Array<[number, number]>, ziel = '') =>
  pg.evaluate(async ([punkte, ziel]: [Array<[number, number]>, string]) => {
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = svg.getScreenCTM()!;
    const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
    const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
    const start = ziel ? svg.querySelector(ziel)! : svg;
    start.dispatchEvent(ev('pointerdown', punkte[0]![0], punkte[0]![1]));
    for (let i = 1; i < punkte.length; i++) svg.dispatchEvent(ev('pointermove', punkte[i]![0], punkte[i]![1]));
    const e = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', e[0], e[1]));
    await new Promise(f => setTimeout(f, 120));
  }, [punkte, ziel] as [Array<[number, number]>, string]);
const knopf = (pg: Seite, act: string) => pg.evaluate((act: string) => {
  const t0 = performance.now();
  document.querySelector<HTMLButtonElement>(`.blatt-werk [data-act="${act}"]`)!.click();
  return Math.round((performance.now() - t0) * 10) / 10;
}, act);
const folge = (pg: Seite, blattId: string) => pg.evaluate((id: string) => ({
  knoten: [...document.querySelectorAll('.blatt-marken [data-sid]')].map(n => n.getAttribute('data-sid')),
  marken: ((Store.getBlock(id).marken || []) as any[]).map(m => String(m.id))
}), blattId);

/* ======================================================================== */
console.log('\n1 · Die Probe: ein Strich dazu, Zurück — alle Knoten sind noch dieselben');
const blattId = await blatt(pg, 300);
gleich('303 Knoten am Anfang', (await zaehle(pg)).knoten, 303);
await kennzeichne(pg);
await pg.click('.blatt-werk [data-wz="stift"]');
await zug(pg, [[300, 700], [330, 705], [360, 712], [390, 720]]);
gleich('Der Strich ist der 304. Knoten', (await zaehle(pg)).knoten, 304);
await knopf(pg, 'undo');
gleich('Zurück: 303 Knoten, alle 303 mit Kennzeichen — keiner wurde neu gemacht', await zaehle(pg), { knoten: 303, gekennzeichnet: 303 });

/* ======================================================================== */
console.log('\n2 · Vor bringt den Strich als neuen Knoten, die anderen bleiben');
await knopf(pg, 'redo');
gleich('Vor: 304 Knoten, 303 davon die alten', await zaehle(pg), { knoten: 304, gekennzeichnet: 303 });
p('Der Strich steht zuoberst (am Ende der Folge), wie in den Daten', await pg.evaluate((id: string) => {
  const letzter = [...document.querySelectorAll('.blatt-marken [data-sid]')].pop()?.getAttribute('data-sid');
  const marken = Store.getBlock(id).marken as any[];
  return letzter === String(marken[marken.length - 1].id);
}, blattId));

/* ======================================================================== */
console.log('\n3 · Verschieben und Zurück: der bewegte Strich behält seinen Knoten');
await pg.click('.blatt-werk [data-wz="select"]');
const dVorher = await pg.evaluate(() => document.querySelector('.blatt-marken [data-sid="m10"]')?.getAttribute('d'));
await kennzeichne(pg);
await zug(pg, [[164, 21], [200, 60], [240, 100]], '[data-sid="m10"]');
const dBewegt = await pg.evaluate(() => document.querySelector('.blatt-marken [data-sid="m10"]')?.getAttribute('d'));
p('Der Strich ist verschoben (anderer Pfad)', !!dBewegt && dBewegt !== dVorher);
await knopf(pg, 'undo');
const nach3 = await pg.evaluate(() => { const n = document.querySelector('.blatt-marken [data-sid="m10"]'); return { d: n?.getAttribute('d'), probe: (n as any)?.__probe === true }; });
gleich('Zurück: derselbe Knoten (Kennzeichen da), der alte Pfad', nach3, { d: dVorher, probe: true });
gleich('… und sonst wurde nichts neu gemacht', await zaehle(pg), { knoten: 304, gekennzeichnet: 304 });

/* ======================================================================== */
console.log('\n4 · Löschen in der Mitte und Zurück: die Marke kommt an ihren Platz');
await zug(pg, [[240, 61]], '[data-sid="m150"]');
await pg.evaluate(() => document.querySelector<SVGSVGElement>('.blatt-marken')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })));
gleich('Gelöscht: 303 Knoten, m150 fehlt', await pg.evaluate(() => [document.querySelectorAll('.blatt-marken [data-sid]').length, !!document.querySelector('.blatt-marken [data-sid="m150"]')]), [303, false]);
await knopf(pg, 'undo');
const f4 = await folge(pg, blattId);
gleich('Zurück: die Knotenfolge ist die Markenfolge — m150 steht wieder zwischen m149 und m151', f4.knoten, f4.marken);
gleich('… und die 303 anderen sind die alten', (await zaehle(pg)).gekennzeichnet, 303);

/* ======================================================================== */
console.log('\n5 · Gemessen: Zurück bei 1000 Marken');
await blatt(pg, 1000);
await pg.click('.blatt-werk [data-wz="stift"]');
await zug(pg, [[300, 700], [330, 705], [360, 712], [390, 720]]);
const ms = await knopf(pg, 'undo');
console.log(`  · Zurück bei 1003 Marken: ${ms} ms`);
p('Zurück bei 1000 Marken unter 60 ms (vorher 59 gemessen, mit Last)', ms < 60, `${ms} ms`);
gleich('… und wieder 1003 Knoten', (await zaehle(pg)).knoten, 1003);

/* ======================================================================== */
console.log('\n6 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
