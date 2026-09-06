/* Suite 346 — Handballen und zwei Finger: Stift geht vor, Finger rollen, Kneifen zoomt (E354)
 * ============================================================================
 * L115 Punkte 3 und 4: die Schicht unterschied `pointerType` nur für den
 * Druck, nicht für die Frage, ob ein Zeiger zeichnen darf — wer mit dem
 * Stift schrieb und die Hand ablegte, zeichnete mit der Hand. Und das
 * Dokument kannte nur den Regler, kein Strg+Rad und kein Kneifen.
 *
 *   1 · DER HANDBALLEN WÄHREND DES STIFTS zeichnet nichts und bewegt nichts.
 *   2 · NACH DEM STIFT sind Finger vier Sekunden gesperrt (`data-stift`);
 *       danach zeichnen sie wieder.
 *   3 · LIEGT DIE HAND ZUERST AUF, nimmt der Stift ihr den Strich weg.
 *   4 · EIN ZWEITER FINGER verwirft den Fingerzug — kein Strich, kein Schritt.
 *   5 · STRG+RAD zoomt das Dokument, das Rad allein rollt.
 *   6 · ZWEI FINGER kneifen — Regler, Zahl und Mass wandern gemeinsam.
 *   7 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test346.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9350;

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
  await pg.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
  });
  return { ktx, pg };
};

/** Ein Blatt auf einer frischen Seite; gibt die Blockkennung zurück. */
const blattAnlegen = (pg: Seite) => pg.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Handprobe', icon: '✋' });
  const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
  Store.addBlock(b.id, 'text', { text: '' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  return b.id as string;
});

/** Ein PDF-Dokument mit zwei Seiten (wie test341), geöffnet im Dokumentmodus. */
const pdfAnlegen = (pg: Seite) => pg.evaluate(async () => {
  const blatt = async (nr: number): Promise<Blob> => {
    const c = document.createElement('canvas'); c.width = 595; c.height = 842;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, 595, 842);
    g.fillStyle = '#1c1c1c'; g.font = '600 30px sans-serif';
    g.fillText('Skript Seite ' + nr, 56, 96);
    return await new Promise<Blob>(f => c.toBlob(b => f(b as Blob), 'image/png'));
  };
  const seite = Store.addPage(null, { text: 'Zoomprobe', icon: '📕' });
  for (let nr = 1; nr <= 2; nr++) {
    const block = Store.addBlock(seite.id, 'pdfseite', {
      text: '', suchtext: 'Skript', nr, vonSeiten: 2, bw: 595, bh: 842, quelleId: 'q-346'
    });
    const satz = await Dateien.ablegen(
      new File([await blatt(nr)], 'skript-' + nr + '.png', { type: 'image/png' }),
      { blockId: block.id, abgeleitet: true });
    Store.updateBlock(block.id, { bildDateiId: satz.id });
  }
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 1200));
  return seite.id as string;
});

type Schritt = { typ: 'down' | 'move' | 'up'; art: 'pen' | 'touch' | 'mouse'; id: number;
  x: number; y: number; primaer?: boolean };
/** Zeigerereignisse Schritt für Schritt auf die Zeichenschicht — mehrere
    Zeiger durcheinander, Koordinaten im Blattraum. */
const schritte = (pg: Seite, folge: Schritt[]) => pg.evaluate(async (folge: Schritt[]) => {
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken');
  if (!svg) throw new Error('keine Zeichenschicht');
  const ctm = svg.getScreenCTM();
  if (!ctm) throw new Error('kein CTM');
  const zu = (x: number, y: number) => {
    const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    const c = pt.matrixTransform(ctm);
    return { clientX: c.x, clientY: c.y };
  };
  for (const s of folge) {
    const typ = s.typ === 'down' ? 'pointerdown' : s.typ === 'move' ? 'pointermove' : 'pointerup';
    svg.dispatchEvent(new PointerEvent(typ, { ...zu(s.x, s.y), pointerType: s.art, pointerId: s.id,
      isPrimary: s.primaer ?? true, pressure: s.typ === 'up' ? 0 : 0.5,
      button: s.typ === 'move' ? -1 : 0, buttons: s.typ === 'up' ? 0 : 1,
      bubbles: true, cancelable: true }));
    await new Promise(f => setTimeout(f, 8));
  }
  await new Promise(f => setTimeout(f, 120));
}, folge);

const marken = (pg: Seite, blattId: string) => pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  return ((b.marken || []) as any[]).map(m => ({
    art: String(m.art), n: Array.isArray(m.pts) ? m.pts.length : 0,
    ys: Array.isArray(m.pts) ? m.pts.map((q: number[]) => Math.round(q[1] ?? 0)) : [],
    xs: Array.isArray(m.pts) ? m.pts.map((q: number[]) => Math.round(q[0] ?? 0)) : [],
    zeigerArt: m.zeigerArt ?? null
  }));
}, blattId);
const stiftMarke = (pg: Seite) => pg.evaluate(() =>
  document.querySelector('.blatt-marken')?.getAttribute('data-stift') ?? null);
const knoten = (pg: Seite) => pg.evaluate(() => document.querySelectorAll('.blatt-marken [data-sid]').length);
const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);

/** Ein Strich als Schrittfolge: down, n moves, up — ein Zeiger. */
const strichFolge = (art: 'pen' | 'touch', id: number, y: number, x0 = 100, x1 = 300, n = 10,
                     primaer = true): Schritt[] => {
  const f: Schritt[] = [{ typ: 'down', art, id, x: x0, y, primaer }];
  for (let i = 1; i < n; i++) f.push({ typ: 'move', art, id, x: x0 + (x1 - x0) * i / (n - 1), y, primaer });
  f.push({ typ: 'up', art, id, x: x1, y, primaer });
  return f;
};

/* ======================================================================== */
console.log('\n1 · Der Handballen während des Stifts zeichnet nichts und bewegt nichts');
const { ktx, pg } = await kontext(false);
const blattId = await blattAnlegen(pg);
await werkzeug(pg, 'stift');
/* Stift unten und unterwegs bei y=100; mittendrin legt sich die Hand bei
   y=300 auf (Finger 11, für Fingerzeiger der erste = primär), bewegt sich,
   hebt ab; der Stift schreibt weiter und hebt zuletzt ab. */
await schritte(pg, [
  { typ: 'down', art: 'pen', id: 7, x: 100, y: 100 },
  { typ: 'move', art: 'pen', id: 7, x: 140, y: 100 },
  { typ: 'move', art: 'pen', id: 7, x: 180, y: 100 },
  { typ: 'down', art: 'touch', id: 11, x: 100, y: 300 },
  { typ: 'move', art: 'touch', id: 11, x: 200, y: 300 },
  { typ: 'move', art: 'pen', id: 7, x: 220, y: 100 },
  { typ: 'move', art: 'touch', id: 11, x: 300, y: 300 },
  { typ: 'up', art: 'touch', id: 11, x: 300, y: 300 },
  { typ: 'move', art: 'pen', id: 7, x: 260, y: 100 },
  { typ: 'move', art: 'pen', id: 7, x: 300, y: 100 },
  { typ: 'up', art: 'pen', id: 7, x: 300, y: 100 }
]);
let m = await marken(pg, blattId);
gleich('Genau ein Strich — der des Stifts', m.length, 1);
p('… und er liegt ganz bei y=100, kein Punkt der Hand darin', !!m[0] && m[0].ys.every((y: number) => y === 100), JSON.stringify(m[0]?.ys));
/* Ein gerader Strich wird beim Vereinfachen zu zwei Punkten (E115) —
   gemessen wird darum der WEG: von 100 bis 300, also auch nach dem Abheben
   der Hand. */
p('… mit dem ganzen Weg des Stifts, auch nach dem Abheben der Hand', !!m[0] && Math.min(...m[0].xs) === 100 && Math.max(...m[0].xs) === 300, JSON.stringify(m[0]?.xs));
gleich('Kein Zeigerfeld landet in den Daten', m[0]?.zeigerArt, null);
gleich('Die Fläche merkt den Stift (data-stift)', await stiftMarke(pg), 'an');

/* ======================================================================== */
console.log('\n2 · Nach dem Stift sind Finger vier Sekunden gesperrt, danach zeichnen sie wieder');
await schritte(pg, strichFolge('touch', 12, 300));
gleich('Ein Finger kurz nach dem Stift zeichnet nichts', (await marken(pg, blattId)).length, 1);
p('Die Sperre steht als data-stift an der Fläche', (await stiftMarke(pg)) === 'an');
await pg.waitForTimeout(4300);
gleich('Nach vier Sekunden ist die Marke weg', await stiftMarke(pg), null);
await schritte(pg, strichFolge('touch', 13, 300));
m = await marken(pg, blattId);
gleich('… und der Finger zeichnet wieder', m.length, 2);
p('… bei y=300', !!m[1] && m[1].ys.every((y: number) => y === 300), JSON.stringify(m[1]?.ys));

/* ======================================================================== */
console.log('\n3 · Liegt die Hand zuerst auf, nimmt der Stift ihr den Strich weg');
await pg.evaluate(async (id: string) => { Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); await new Promise(f => setTimeout(f, 500)); }, blattId);
await werkzeug(pg, 'stift');
await pg.waitForTimeout(4300); /* die Sperre vom Stift in §1 ist abgelaufen */
await schritte(pg, [
  { typ: 'down', art: 'touch', id: 21, x: 100, y: 300 },
  { typ: 'move', art: 'touch', id: 21, x: 150, y: 300 },
  { typ: 'move', art: 'touch', id: 21, x: 200, y: 300 },
  { typ: 'down', art: 'pen', id: 8, x: 100, y: 100 },
  { typ: 'move', art: 'pen', id: 8, x: 200, y: 100 },
  { typ: 'move', art: 'touch', id: 21, x: 250, y: 300 },
  { typ: 'move', art: 'pen', id: 8, x: 300, y: 100 },
  { typ: 'up', art: 'touch', id: 21, x: 250, y: 300 },
  { typ: 'up', art: 'pen', id: 8, x: 300, y: 100 }
]);
m = await marken(pg, blattId);
gleich('Ein Strich — der des Stifts; der angefangene Handstrich ist verworfen', m.length, 1);
p('… bei y=100', !!m[0] && m[0].ys.every((y: number) => y === 100), JSON.stringify(m[0]?.ys));
gleich('Kein verwaister Knoten in der Schicht', await knoten(pg), 1);
p('Ein Zurück nimmt den Stiftstrich — der Handstrich war nie ein Schritt', await pg.evaluate(async (id: string) => {
  document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="undo"]')?.click();
  await new Promise(f => setTimeout(f, 150));
  const n = ((Store.getBlock(id) || {}).marken || []).length;
  const undo = document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="undo"]');
  return n === 0 && !!undo && undo.disabled;
}, blattId));

/* ======================================================================== */
console.log('\n4 · Ein zweiter Finger verwirft den Fingerzug — kein Strich, kein Schritt');
await pg.waitForTimeout(4300);
await schritte(pg, [
  { typ: 'down', art: 'touch', id: 31, x: 100, y: 200 },
  { typ: 'move', art: 'touch', id: 31, x: 150, y: 200 },
  { typ: 'move', art: 'touch', id: 31, x: 200, y: 200 },
  { typ: 'down', art: 'touch', id: 32, x: 300, y: 400, primaer: false },
  { typ: 'move', art: 'touch', id: 31, x: 250, y: 200 },
  { typ: 'move', art: 'touch', id: 32, x: 350, y: 400, primaer: false },
  { typ: 'up', art: 'touch', id: 32, x: 350, y: 400, primaer: false },
  { typ: 'up', art: 'touch', id: 31, x: 250, y: 200 }
]);
gleich('Kein Strich aus der Geste', (await marken(pg, blattId)).length, 0);
gleich('Kein Knoten', await knoten(pg), 0);
p('Und kein Schritt im Verlauf', await pg.evaluate(() =>
  document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="undo"]')?.disabled === true));
await schritte(pg, strichFolge('touch', 33, 200));
gleich('Ein Finger allein zeichnet danach wie immer', (await marken(pg, blattId)).length, 1);

/* ======================================================================== */
console.log('\n5 · Strg+Rad zoomt das Dokument, das Rad allein rollt');
await pdfAnlegen(pg);
const zoomStand = (pg: Seite) => pg.evaluate(() => ({
  regler: document.querySelector<HTMLInputElement>('[data-document-zoom]')?.value ?? null,
  zahl: document.querySelector('.document-zoom-label')?.textContent ?? null,
  mass: document.querySelector<HTMLElement>('.document-center')?.style.getPropertyValue('--doc-blatt') ?? null
}));
const z0 = await zoomStand(pg);
gleich('Das Dokument steht auf 100 %', [z0.regler, z0.zahl], ['100', '100 %']);
const rad = (pg: Seite, deltaY: number, strg: boolean) => pg.evaluate(([deltaY, strg]: [number, boolean]) => {
  const c = document.querySelector<HTMLElement>('.document-center')!;
  const ev = new WheelEvent('wheel', { deltaY, ctrlKey: strg, bubbles: true, cancelable: true });
  c.dispatchEvent(ev);
  return ev.defaultPrevented;
}, [deltaY, strg] as [number, boolean]);
const ohneStrg = await rad(pg, -100, false);
const z1 = await zoomStand(pg);
gleich('Das Rad allein ändert den Zoom nicht', [ohneStrg, z1.regler], [false, '100']);
const mitStrg = await rad(pg, -100, true);
const z2 = await zoomStand(pg);
gleich('Strg+Rad nach oben: 110 %, Regler und Zahl folgen', [mitStrg, z2.regler, z2.zahl], [true, '110', '110 %']);
p('… und das Mass der Seite ist gewachsen', parseFloat(z2.mass ?? '0') > parseFloat(z0.mass ?? '0'), `${z0.mass} → ${z2.mass}`);
await rad(pg, 100, true); await rad(pg, 100, true);
gleich('Zweimal nach unten: 90 %', (await zoomStand(pg)).regler, '90');
for (let i = 0; i < 12; i++) await rad(pg, 100, true);
gleich('Nicht unter 60 %', (await zoomStand(pg)).regler, '60');

/* ======================================================================== */
console.log('\n6 · Zwei Finger kneifen — Regler, Zahl und Mass wandern gemeinsam');
await pg.evaluate(() => { const r = document.querySelector<HTMLInputElement>('[data-document-zoom]')!; r.value = '100'; r.dispatchEvent(new Event('input', { bubbles: true })); });
gleich('Zurück auf 100 %', (await zoomStand(pg)).regler, '100');
const kneifen = (pg: Seite, a1: [number, number], b1: [number, number], a2: [number, number], b2: [number, number], art = 'touch') =>
  pg.evaluate(async ([a1, b1, a2, b2, art]: any) => {
    const c = document.querySelector<HTMLElement>('.document-center')!;
    const r = c.getBoundingClientRect();
    const ev = (typ: string, id: number, x: number, y: number, primaer: boolean) =>
      new PointerEvent(typ, { clientX: r.left + x, clientY: r.top + y, pointerType: art, pointerId: id,
        isPrimary: primaer, bubbles: true, cancelable: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1 });
    c.dispatchEvent(ev('pointerdown', 41, a1[0], a1[1], true));
    c.dispatchEvent(ev('pointerdown', 42, b1[0], b1[1], false));
    await new Promise(f => setTimeout(f, 20));
    c.dispatchEvent(ev('pointermove', 41, a2[0], a2[1], true));
    c.dispatchEvent(ev('pointermove', 42, b2[0], b2[1], false));
    await new Promise(f => setTimeout(f, 20));
    c.dispatchEvent(ev('pointerup', 41, a2[0], a2[1], true));
    c.dispatchEvent(ev('pointerup', 42, b2[0], b2[1], false));
    await new Promise(f => setTimeout(f, 120));
  }, [a1, b1, a2, b2, art]);
await kneifen(pg, [300, 300], [400, 300], [250, 300], [450, 300]);
const z3 = await zoomStand(pg);
gleich('Auseinanderziehen auf das Doppelte: 180 % (die Grenze)', [z3.regler, z3.zahl], ['180', '180 %']);
await kneifen(pg, [200, 300], [500, 300], [275, 300], [425, 300]);
gleich('Zusammenziehen auf die Hälfte: 90 %', (await zoomStand(pg)).regler, '90');
await kneifen(pg, [300, 300], [400, 300], [250, 300], [450, 300], 'mouse');
gleich('Zwei Mäuse kneifen nicht', (await zoomStand(pg)).regler, '90');
p('Die Dokumentmitte lässt Finger rollen, aber nicht den Browser zoomen (touch-action)',
  await pg.evaluate(() => getComputedStyle(document.querySelector('.document-center')!).touchAction === 'pan-x pan-y'));
p('Die Zeichenschicht mit Stift lässt Finger rollen und kneifen (touch-action)', await pg.evaluate(() => {
  const s = document.querySelector<HTMLElement>('.blatt-marken');
  if (!s) return false;
  s.setAttribute('data-stift', 'an');
  const mit = getComputedStyle(s).touchAction;
  s.removeAttribute('data-stift');
  const ohne = getComputedStyle(s).touchAction;
  /* Chromium schreibt `pan-x pan-y pinch-zoom` als `manipulation` zurück —
     dasselbe Verhalten, ein anderes Wort.
     IM SCHREIBSTUDIO (E464) steht `none`, und das ist dort richtig: Redurs
     `marken.ts` rollt die Finger SELBST (`fingerPan` auf `.document-center`),
     damit der Stift zeichnet, während ein Finger die Rolle schiebt. Der
     Browser darf dann nicht dazwischenrollen. */
  const studio = !!s.closest('.document-studio');
  return (mit === 'manipulation' || mit === 'pan-x pan-y pinch-zoom' || (studio && mit === 'none')) && ohne === 'none';
}));

/* ======================================================================== */
console.log('\n7 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
