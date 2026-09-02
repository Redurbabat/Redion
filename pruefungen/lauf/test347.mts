/* Suite 347 — Formerkennung: ziehen, halten, und der Kreis wird ein Kreis (E355)
 * ============================================================================
 * L115 Punkt 5: ein gezogener Kreis blieb ein gezogener Kreis. GoodNotes
 * rastet nach kurzem Halten am Strichende auf Kreis, Rechteck, Linie.
 *
 *   1 · DER KERN (`InkShapes.recognize`) erkennt Kreis, Ellipse, Rechteck
 *       und Linie — und lässt Gekritzel, Haken und Bögen in Ruhe.
 *   2 · GEHALTEN wird der Stiftstrich zur Form; ohne Halten bleibt er Strich.
 *   3 · RECHTECK UND LINIE gehalten; ein Gekritzel gehalten bleibt Strich.
 *   4 · DER SCHALTER „Formen" — aus heisst aus, gemerkt über das Neuladen.
 *   5 · DER MARKER wird nie zur Form.
 *   6 · EIN ZURÜCK nimmt die Form als einen Schritt; die Form trägt Farbe
 *       und Breite, aber keinen Druck und keinen Stil.
 *   7 · AM TELEFON ist der Schalter ein Fingerknopf.
 *   8 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test347.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const InkShapes: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9351;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const kontext = async (handy = false) => {
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  const blattId = await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Formprobe', icon: '◯' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return b.id as string;
  });
  return { ktx, pg, blattId };
};

type Pt = [number, number];
/** Punktfolgen, wie eine Hand sie zieht: mit etwas Zittern. */
const zitter = (i: number): number => Math.sin(i * 7.3) * 1.5;
const kreis = (cx: number, cy: number, r: number, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_v, i) => { const t = i / n * Math.PI * 2;
    return [cx + Math.cos(t) * r + zitter(i), cy + Math.sin(t) * r + zitter(i + 3)] as Pt; });
const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_v, i) => { const t = i / n * Math.PI * 2;
    return [cx + Math.cos(t) * rx + zitter(i), cy + Math.sin(t) * ry + zitter(i + 3)] as Pt; });
const rechteck = (x0: number, y0: number, x1: number, y1: number, je = 10): Pt[] => {
  const s: Pt[] = [];
  const kante = (a: Pt, b: Pt) => { for (let i = 0; i < je; i++) s.push([a[0] + (b[0] - a[0]) * i / je + zitter(s.length), a[1] + (b[1] - a[1]) * i / je + zitter(s.length + 5)]); };
  kante([x0, y0], [x1, y0]); kante([x1, y0], [x1, y1]); kante([x1, y1], [x0, y1]); kante([x0, y1], [x0, y0]);
  s.push([x0 + 1, y0 + 1]);
  return s;
};
const linie = (a: Pt, b: Pt, n = 20): Pt[] =>
  Array.from({ length: n }, (_v, i) => [a[0] + (b[0] - a[0]) * i / (n - 1) + zitter(i) * 0.5, a[1] + (b[1] - a[1]) * i / (n - 1) + zitter(i + 2)] as Pt);
const gekritzel = (n = 30): Pt[] =>
  Array.from({ length: n }, (_v, i) => [100 + i * 6, 200 + (i % 2 ? 30 : -30) + zitter(i)] as Pt);
const bogen = (cx: number, cy: number, r: number, n = 20): Pt[] =>
  Array.from({ length: n }, (_v, i) => { const t = i / (n - 1) * Math.PI; return [cx + Math.cos(t) * r, cy + Math.sin(t) * r] as Pt; });

/** Einen Stiftzug fahren; `halten` wartet vor dem Loslassen. */
const zug = (pg: Seite, punkte: Pt[], halten = 0, art: 'pen' | 'touch' = 'pen') =>
  pg.evaluate(async ([punkte, halten, art]: [Pt[], number, string]) => {
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = svg.getScreenCTM()!;
    const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
    const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: art,
      pressure: typ === 'pointerup' ? 0 : 0.5, isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
    svg.dispatchEvent(ev('pointerdown', punkte[0]![0], punkte[0]![1]));
    for (let i = 1; i < punkte.length; i++) svg.dispatchEvent(ev('pointermove', punkte[i]![0], punkte[i]![1]));
    if (halten > 0) await new Promise(f => setTimeout(f, halten));
    const e = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', e[0], e[1]));
    await new Promise(f => setTimeout(f, 120));
  }, [punkte, halten, art] as [Pt[], number, string]);

const marken = (pg: Seite, blattId: string) => pg.evaluate((id: string) =>
  (((Store.getBlock(id) || {}).marken || []) as any[]).map(m => ({
    art: String(m.art), n: Array.isArray(m.pts) ? m.pts.length : 0, farbe: String(m.farbe), breite: Number(m.breite),
    druck: Array.isArray(m.pressure), stil: m.stil ?? null, bewegtUm: m.bewegtUm ?? null, zeigerArt: m.zeigerArt ?? null,
    pts: Array.isArray(m.pts) ? m.pts.map((q: number[]) => q.map(Math.round)) : [],
    knoten: document.querySelector(`.blatt-marken [data-sid="${m.id}"]`)?.tagName ?? null
  })), blattId);
const leer = (pg: Seite, blattId: string) => pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); await new Promise(f => setTimeout(f, 500));
}, blattId);
const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);
const formenKnopf = (pg: Seite) => pg.evaluate(() => {
  const k = document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="formen"]');
  return k ? { an: k.getAttribute('aria-pressed'), on: k.classList.contains('on') } : null;
});

/* ======================================================================== */
console.log('\n1 · Der Kern erkennt Kreis, Ellipse, Rechteck und Linie — und lässt Gekritzel in Ruhe');
const { ktx, pg, blattId } = await kontext(false);
const kern = await pg.evaluate(([k, e, r, l, g, b]: Pt[][]) => ({
  kreis: InkShapes.recognize(k), ellipse: InkShapes.recognize(e), rechteck: InkShapes.recognize(r),
  linie: InkShapes.recognize(l), gekritzel: InkShapes.recognize(g), bogen: InkShapes.recognize(b),
  kurz: InkShapes.recognize([[0, 0], [1, 1], [2, 2]])
}), [kreis(200, 200, 60), ellipse(200, 200, 90, 40), rechteck(100, 100, 260, 200), linie([100, 100], [300, 180]), gekritzel(), bogen(200, 200, 60)]);
gleich('Ein Kreis wird ein Kreis — eine Ellipse mit quadratischem Kasten', [kern.kreis?.art, kern.kreis?.pts?.length], ['ellipse', 2]);
p('… und der Kasten ist quadratisch um die Mitte', !!kern.kreis && Math.abs((kern.kreis.pts[1][0] - kern.kreis.pts[0][0]) - (kern.kreis.pts[1][1] - kern.kreis.pts[0][1])) < 0.01
  && Math.abs((kern.kreis.pts[0][0] + kern.kreis.pts[1][0]) / 2 - 200) < 3, JSON.stringify(kern.kreis));
const eb = kern.ellipse ? [kern.ellipse.pts[1][0] - kern.ellipse.pts[0][0], kern.ellipse.pts[1][1] - kern.ellipse.pts[0][1]] : [0, 0];
p('Eine Ellipse bleibt eine Ellipse (Kasten um 180 × 80, mit dem Zittern der Hand)',
  kern.ellipse?.art === 'ellipse' && Math.abs(eb[0]! - 180) <= 4 && Math.abs(eb[1]! - 80) <= 4, JSON.stringify([kern.ellipse?.art, eb]));
gleich('Ein Rechteck wird ein Rechteck', [kern.rechteck?.art, kern.rechteck?.pts?.length], ['rectangle', 2]);
p('… mit den Ecken des Zugs', !!kern.rechteck && Math.abs(kern.rechteck.pts[0][0] - 100) < 4 && Math.abs(kern.rechteck.pts[1][1] - 200) < 4, JSON.stringify(kern.rechteck));
gleich('Eine zittrige Linie wird eine Linie, Anfang zu Ende', [kern.linie?.art, kern.linie?.pts?.length], ['line', 2]);
gleich('Gekritzel bleibt nichts', kern.gekritzel, null);
gleich('Ein offener Bogen bleibt nichts', kern.bogen, null);
gleich('Drei Punkte bleiben nichts', kern.kurz, null);

/* ======================================================================== */
console.log('\n2 · Gehalten wird der Stiftstrich zur Form; ohne Halten bleibt er Strich');
await werkzeug(pg, 'stift');
gleich('Der Schalter „Formen" steht an', await formenKnopf(pg), { an: 'true', on: true });
await zug(pg, kreis(200, 200, 60), 600);
let m = await marken(pg, blattId);
gleich('Ein gehaltener Kreis ist eine Ellipse mit zwei Punkten', [m[0]?.art, m[0]?.n], ['ellipse', 2]);
gleich('… als Ellipse-Knoten in der Schicht', m[0]?.knoten, 'ellipse');
gleich('Keine Arbeitsfelder in den Daten', [m[0]?.bewegtUm, m[0]?.zeigerArt], [null, null]);
await zug(pg, kreis(400, 200, 60), 0);
m = await marken(pg, blattId);
gleich('Derselbe Kreis ohne Halten bleibt ein Stiftstrich', m[1]?.art, 'stift');
p('… mit vielen Punkten und Druck', !!m[1] && m[1].n >= 8 && m[1].druck, JSON.stringify([m[1]?.n, m[1]?.druck]));

/* ======================================================================== */
console.log('\n3 · Rechteck und Linie gehalten; ein Gekritzel gehalten bleibt Strich');
await leer(pg, blattId);
await werkzeug(pg, 'stift'); /* das Neuzeichnen stellt die Schicht auf „Schreiben" */
await zug(pg, rechteck(100, 100, 260, 200), 600);
await zug(pg, linie([100, 300], [300, 380]), 600);
await zug(pg, gekritzel(), 600);
m = await marken(pg, blattId);
gleich('Rechteck, Linie, Strich', m.map(x => x.art), ['rectangle', 'line', 'stift']);
gleich('Das Rechteck hat zwei Punkte, die Linie auch', [m[0]?.n, m[1]?.n], [2, 2]);
p('Die Linie geht von Anfang zu Ende des Zugs', !!m[1] && Math.abs(m[1].pts[0]![0]! - 100) < 3 && Math.abs(m[1].pts[1]![0]! - 300) < 3, JSON.stringify(m[1]?.pts));

/* ======================================================================== */
console.log('\n4 · Der Schalter „Formen" — aus heisst aus, gemerkt über das Neuladen');
await leer(pg, blattId);
await werkzeug(pg, 'stift');
await pg.click('.blatt-werk [data-act="formen"]');
gleich('Ein Tipp: aus', await formenKnopf(pg), { an: 'false', on: false });
gleich('… und gemerkt', await pg.evaluate(() => Store.getMeta('zeichnen:formen')), false);
await zug(pg, kreis(200, 200, 60), 600);
gleich('Ausgeschaltet bleibt der gehaltene Kreis ein Strich', (await marken(pg, blattId))[0]?.art, 'stift');
await pg.evaluate(async () => { await Store.flush(); });
await pg.reload();
await pg.waitForTimeout(2800);
await pg.evaluate(async (id: string) => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  App.oeffne(Store.getBlock(id).parentId);
  await new Promise(f => setTimeout(f, 900));
}, blattId);
gleich('Nach dem Neuladen steht der Schalter noch aus', await formenKnopf(pg), { an: 'false', on: false });
await werkzeug(pg, 'stift');
await pg.click('.blatt-werk [data-act="formen"]');
gleich('Wieder an', await pg.evaluate(() => Store.getMeta('zeichnen:formen')), true);

/* ======================================================================== */
console.log('\n5 · Der Marker wird nie zur Form');
await leer(pg, blattId);
await werkzeug(pg, 'marker');
await zug(pg, kreis(200, 200, 60), 600);
gleich('Ein gehaltener Marker-Kreis bleibt Marker', (await marken(pg, blattId))[0]?.art, 'marker');

/* ======================================================================== */
console.log('\n6 · Ein Zurück nimmt die Form als einen Schritt; Farbe und Breite bleiben, Druck und Stil nicht');
await leer(pg, blattId);
await werkzeug(pg, 'stift');
const rot = await pg.evaluate(() => document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')[1]!.dataset.c!);
await pg.click(`.blatt-werk .blatt-farbe[data-c="${rot}"]`);
await pg.click('.blatt-werk .blatt-strich[data-b="5"]');
await zug(pg, rechteck(100, 100, 260, 200), 600);
m = await marken(pg, blattId);
gleich('Die Form trägt Farbe und Breite des Stifts', [m[0]?.art, m[0]?.farbe, m[0]?.breite], ['rectangle', rot, 5]);
gleich('… aber keinen Druck und keinen Stil', [m[0]?.druck, m[0]?.stil], [false, null]);
await pg.click('.blatt-werk [data-act="undo"]');
gleich('Ein Zurück nimmt die Form ganz', (await marken(pg, blattId)).length, 0);
await pg.click('.blatt-werk [data-act="redo"]');
gleich('Vor bringt sie als Form zurück', (await marken(pg, blattId))[0]?.art, 'rectangle');

/* ======================================================================== */
console.log('\n7 · Am Telefon ist der Schalter ein Fingerknopf');
const { ktx: ktxH, pg: pgH, blattId: blattH } = await kontext(true);
/* Seit E356 steht der Formen-Schalter am Telefon nur beim Stift. */
await werkzeug(pgH, 'stift');
const masse = await pgH.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="formen"]');
  const r = k?.getBoundingClientRect();
  return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
});
p('Der Formen-Schalter ist mindestens 44 × 44', !!masse && masse.w >= 44 && masse.h >= 44, JSON.stringify(masse));
await werkzeug(pgH, 'stift');
await zug(pgH, kreis(200, 200, 60), 600, 'touch');
gleich('Der Finger zieht einen gehaltenen Kreis zur Ellipse', (await marken(pgH, blattH))[0]?.art, 'ellipse');
await ktxH.close();

/* ======================================================================== */
console.log('\n8 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
