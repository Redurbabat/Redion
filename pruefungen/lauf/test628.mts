/* Suite 628 — Zoom am Zeiger im PDF-Dokument (E766, aus Redurs ZIP vom 1. November)
 * ============================================================================
 * Strg+Rad und Kneifen zoomten seit E354 um die linke obere Ecke der Rolle:
 * wer auf eine Formel unten rechts zoomte, musste sie danach suchen. Redurs
 * ZIP bringt „der Punkt unter dem Zeiger bleibt stehen" — übernommen in den
 * VORHANDENEN Regler, ohne zweites Zoom-Dock und ohne Strg +/−/0 (die
 * bleiben die Schriftgrösse, register/tasten).
 *
 *   1 · STRG+RAD — der Punkt des Blatts unter dem Zeiger bleibt auf ±2 px
 *       stehen, senkrecht und (wenn die Rolle waagrecht rollen kann) waagrecht.
 *   2 · KNEIFEN — der Punkt unter der Mitte der beiden Finger bleibt stehen;
 *       viele Bewegungen in einem Bild ergeben EIN Neuzeichnen (rAF).
 *   3 · DER REGLER zoomt weiter um die Mitte, Regler und Zahl bleiben die
 *       Wahrheit, und es gibt KEIN zweites Zoom-Bedienelement.
 *   4 · Strg + bleibt die Schriftgrösse (kein Zoom, kein stopPropagation).
 *   5 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test628.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
/* Port 0: der Rechner vergibt einen freien (test400 zählt keinen festen dazu). */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
type Seite = import('playwright').Page;
const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const pg: Seite = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
pg.on('dialog', d => d.dismiss().catch(() => {}));
await pg.goto('http://127.0.0.1:' + PORT + '/index.html');
await pg.waitForTimeout(2800);
await pg.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const blatt = async (nr: number): Promise<Blob> => {
    const c = document.createElement('canvas'); c.width = 595; c.height = 842;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, 595, 842);
    g.fillStyle = '#1c1c1c'; g.font = '600 30px sans-serif';
    g.fillText('Zoom Seite ' + nr, 56, 96);
    return await new Promise<Blob>(f => c.toBlob(b => f(b as Blob), 'image/png'));
  };
  const seite = Store.addPage(null, { text: 'Zeigerzoom', icon: '📕' });
  for (let nr = 1; nr <= 3; nr++) {
    const block = Store.addBlock(seite.id, 'pdfseite', {
      text: '', suchtext: 'Zoom', nr, vonSeiten: 3, bw: 595, bh: 842, quelleId: 'q-628'
    });
    const satz = await Dateien.ablegen(
      new File([await blatt(nr)], 'zoom-' + nr + '.png', { type: 'image/png' }),
      { blockId: block.id, abgeleitet: true });
    Store.updateBlock(block.id, { bildDateiId: satz.id });
  }
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 1400));
});

const zoomStand = () => pg.evaluate(() => ({
  regler: document.querySelector<HTMLInputElement>('[data-document-zoom]')?.value ?? null,
  zahl: document.querySelector('.document-zoom-label')?.textContent ?? null
}));
const regler = (wert: number) => pg.evaluate((w: number) => {
  const r = document.querySelector<HTMLInputElement>('[data-document-zoom]')!;
  r.value = String(w); r.dispatchEvent(new Event('input', { bubbles: true }));
}, wert);

/** Wo im Blatt (Anteil 0…1) liegt der Bildschirmpunkt (x, y)? Dazu das Blatt
    und seine Grösse — ein Anteil ist lagefrei, die Abweichung in Pixeln
    rechnet mit der Breite NACH dem Zoom. */
type Lage = { fx: number; fy: number; w: number; h: number; sx: number; sy: number; kannX: boolean } | null;
const lage = (x: number, y: number): Promise<Lage> => pg.evaluate(([x, y]: [number, number]) => {
  const papiere = [...document.querySelectorAll<HTMLElement>('.document-center .blatt-papier')];
  const c = document.querySelector<HTMLElement>('.document-center')!;
  for (const pa of papiere) {
    const r = pa.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return { fx: (x - r.left) / r.width, fy: (y - r.top) / r.height, w: r.width, h: r.height,
        sx: c.scrollLeft, sy: c.scrollTop, kannX: c.scrollWidth > c.clientWidth + 2 };
    }
  }
  return null;
}, [x, y] as [number, number]);
const rad = (x: number, y: number, deltaY: number) => pg.evaluate(([x, y, deltaY]: [number, number, number]) => {
  const c = document.querySelector<HTMLElement>('.document-center')!;
  c.dispatchEvent(new WheelEvent('wheel', { deltaY, ctrlKey: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
}, [x, y, deltaY] as [number, number, number]);
const mitte = await pg.evaluate(() => {
  const r = document.querySelector<HTMLElement>('.document-center')!.getBoundingClientRect();
  return { l: r.left, t: r.top, w: r.width, h: r.height };
});
const abweichung = (a: Lage, b: Lage): { dx: number; dy: number } =>
  !a || !b ? { dx: 999, dy: 999 } : { dx: Math.abs(a.fx - b.fx) * b.w, dy: Math.abs(a.fy - b.fy) * b.h };

/* ======================================================================== */
console.log('\n1 · Strg+Rad: der Punkt unter dem Zeiger bleibt stehen');
gleich('Das Dokument steht auf 100 %', await zoomStand(), { regler: '100', zahl: '100 %' });
/* Ein Punkt unten rechts im sichtbaren Teil — weit weg von der Ecke oben links,
   um die der alte Zoom wuchs. */
const X = Math.round(mitte.l + mitte.w * 0.7), Y = Math.round(mitte.t + mitte.h * 0.75);
const l0 = await lage(X, Y);
p('Unter dem Zeiger liegt ein Blatt', !!l0, JSON.stringify(mitte));
await rad(X, Y, -100);
await pg.waitForTimeout(120);
const l1 = await lage(X, Y);
gleich('Strg+Rad nach oben: 110 %, Regler und Zahl folgen', await zoomStand(), { regler: '110', zahl: '110 %' });
const d1 = abweichung(l0, l1);
p('Senkrecht bleibt der Punkt auf ±2 px', d1.dy <= 2, 'ist ' + d1.dy.toFixed(1) + ' px');
p('… und das Blatt ist dabei gewachsen', !!l0 && !!l1 && l1.h > l0.h + 5, (l0?.h ?? 0) + ' → ' + (l1?.h ?? 0));
p('… und die Rolle hat sich bewegt (sonst wüchse das Blatt um die Ecke)', !!l0 && !!l1 && l1.sy !== l0.sy, (l0?.sy ?? 0) + ' → ' + (l1?.sy ?? 0));
/* Gross genug, dass die Rolle auch waagrecht rollen kann. */
for (let i = 0; i < 4; i++) await rad(X, Y, -100);
await pg.waitForTimeout(120);
const l2 = await lage(X, Y);
gleich('Viermal weiter: 150 %', (await zoomStand()).regler, '150');
await rad(X, Y, -100);
await pg.waitForTimeout(120);
const l3 = await lage(X, Y);
const d3 = abweichung(l2, l3);
p('Die Rolle kann jetzt waagrecht rollen', !!l3?.kannX, JSON.stringify(l3));
p('Waagrecht bleibt der Punkt auf ±2 px', d3.dx <= 2, 'ist ' + d3.dx.toFixed(1) + ' px');
p('Senkrecht auch beim Verkleinern', await (async () => {
  const a = await lage(X, Y); await rad(X, Y, 100); await pg.waitForTimeout(120);
  const b = await lage(X, Y); return abweichung(a, b).dy <= 2;
})());

/* ======================================================================== */
console.log('\n2 · Kneifen: der Punkt unter den Fingern bleibt, ein Bild = ein Neuzeichnen');
await regler(100);
await pg.waitForTimeout(150);
const KX = Math.round(mitte.l + mitte.w * 0.65), KY = Math.round(mitte.t + mitte.h * 0.7);
const k0 = await lage(KX, KY);
const kneif = await pg.evaluate(async ([kx, ky]: [number, number]) => {
  const c = document.querySelector<HTMLElement>('.document-center')!;
  /* Neuzeichnen zählen: jedes `passen()` schreibt --doc-blatt neu. */
  let schreibt = 0;
  const beob = new MutationObserver(l => { schreibt += l.length; });
  beob.observe(c, { attributes: true, attributeFilter: ['style'] });
  const ev = (typ: string, id: number, x: number, y: number, primaer: boolean) =>
    new PointerEvent(typ, { clientX: x, clientY: y, pointerType: 'touch', pointerId: id,
      isPrimary: primaer, bubbles: true, cancelable: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1 });
  c.dispatchEvent(ev('pointerdown', 61, kx - 50, ky, true));
  c.dispatchEvent(ev('pointerdown', 62, kx + 50, ky, false));
  await new Promise(f => requestAnimationFrame(() => f(null)));
  schreibt = 0;
  /* Zehn Bewegungen in EINEM Bild: von 100 auf 140 px Abstand. */
  for (let i = 1; i <= 10; i++) {
    c.dispatchEvent(ev('pointermove', 61, kx - 50 - i * 2, ky, true));
    c.dispatchEvent(ev('pointermove', 62, kx + 50 + i * 2, ky, false));
  }
  /* takeRecords: der Beobachter meldet sonst erst, wenn der Stapel leer ist —
     und dann zählte „im Bild" immer null (im ersten Anlauf so gesehen). */
  schreibt += beob.takeRecords().length;
  const imBild = schreibt;
  await new Promise(f => requestAnimationFrame(() => f(null)));
  await new Promise(f => setTimeout(f, 30));
  schreibt += beob.takeRecords().length;
  const nachBild = schreibt - imBild;
  c.dispatchEvent(ev('pointerup', 61, kx - 70, ky, true));
  c.dispatchEvent(ev('pointerup', 62, kx + 70, ky, false));
  await new Promise(f => setTimeout(f, 120));
  beob.disconnect();
  return { imBild, nachBild };
}, [KX, KY] as [number, number]);
const k1 = await lage(KX, KY);
gleich('Abstand ×1,4: 140 %', (await zoomStand()).regler, '140');
p('Während der Bewegungen im selben Bild wird nicht neu gezeichnet', kneif.imBild === 0, JSON.stringify(kneif));
p('… und im nächsten Bild genau einmal', kneif.nachBild === 1, JSON.stringify(kneif));
const dk = abweichung(k0, k1);
p('Der Punkt unter den Fingern bleibt auf ±2 px (senkrecht)', dk.dy <= 2, 'ist ' + dk.dy.toFixed(1) + ' px');

/* ======================================================================== */
console.log('\n3 · Der Regler bleibt die Wahrheit, und es gibt nur EINEN');
await regler(100);
await pg.waitForTimeout(150);
gleich('Regler auf 100 %: Zahl folgt', await zoomStand(), { regler: '100', zahl: '100 %' });
gleich('Kein zweites Zoom-Dock', await pg.evaluate(() => document.querySelectorAll('.document-zoom-dock, [data-document-action="zoom-in"]').length), 0);
gleich('Genau ein Zoomregler', await pg.evaluate(() => document.querySelectorAll('[data-document-zoom]').length), 1);

/* ======================================================================== */
console.log('\n4 · Strg + bleibt die Schriftgrösse');
const vorher = await pg.evaluate(() => ({ z: (document.querySelector<HTMLInputElement>('[data-document-zoom]'))?.value,
  schrift: getComputedStyle(document.documentElement).fontSize }));
await pg.locator('.document-center').click({ position: { x: 5, y: 5 } }).catch(() => {});
await pg.keyboard.press('Control+Equal');
await pg.waitForTimeout(200);
const nachher = await pg.evaluate(() => ({ z: (document.querySelector<HTMLInputElement>('[data-document-zoom]'))?.value,
  schrift: getComputedStyle(document.documentElement).fontSize }));
gleich('Strg + ändert den PDF-Zoom nicht', nachher.z, vorher.z);
await pg.keyboard.press('Control+0');
await pg.waitForTimeout(150);

/* ======================================================================== */
console.log('\n5 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);
await browser.close();
server.close();
console.log('\n' + ok + '/' + (ok + weg) + ' bestanden');
process.exit(weg ? 1 : 0);
