/* Suite 345 — Die Auswahl: Lasso, Griffe, Kopieren, Umfärben (E353, E269)
 * ============================================================================
 * L115 Punkt 2 und E269 (offen seit E265): die Auswahl konnte bewegen und
 * löschen, sonst nichts. GoodNotes: ein Lasso um die Striche, Griffe zum
 * Skalieren, Kopieren und Einsetzen, und eine Farbe mit Auswahl färbt um.
 *
 *   1 · DAS LASSO wählt, was in der Schlinge liegt — nicht, was in ihrem
 *       Kasten liegt (ein L-förmiges Lasso beweist den Unterschied).
 *   2 · DIE GRIFFE skalieren: Punkte, Druck bleibt, Breite folgt; ein Zug
 *       ist ein Schritt.
 *   3 · KOPIEREN UND EINSETZEN — Tastatur und Knöpfe, frische Kennungen,
 *       versetzt, das zweite Einsetzen wandert weiter.
 *   4 · FARBE UND STRICH MIT AUSWAHL gelten der Auswahl, nicht dem Rest.
 *   5 · UMSCHALT-LASSO ergänzt, ESCAPE hebt auf, ein gerader Zug ist ein Kasten.
 *   6 · AM TELEFON fasst der Finger den Griff.
 *   7 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test345.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Marken: any;
declare const InkGeometry: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9349;

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
    const s = Store.addPage(null, { text: 'Auswahlprobe', icon: '⌖' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return b.id as string;
  });
  return { ktx, pg, blattId };
};

type Zeigerart = 'pen' | 'mouse' | 'touch';
type Zug = { art?: Zeigerart; shift?: boolean; ziel?: string };

/** Einen Zug mit synthetischen Zeigerereignissen fahren — Punkte im
    BLATTRAUM. `ziel` ist ein Selektor innerhalb der Schicht, auf dem das
    Aufsetzen landen soll (ein Griff); sonst ist es die Fläche selbst. */
const zug = (pg: Seite, punkte: Array<[number, number]>, opt: Zug = {}) =>
  pg.evaluate(async ([punkte, opt]: [Array<[number, number]>, Zug]) => {
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken');
    if (!svg) throw new Error('keine Zeichenschicht');
    const ctm = svg.getScreenCTM();
    if (!ctm) throw new Error('kein CTM');
    const zu = (x: number, y: number) => {
      const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const c = pt.matrixTransform(ctm);
      return { clientX: c.x, clientY: c.y };
    };
    const art = opt.art ?? 'mouse';
    const ev = (typ: string, x: number, y: number) =>
      new PointerEvent(typ, { ...zu(x, y), pointerType: art, pressure: typ === 'pointerup' ? 0 : 0.5,
        isPrimary: true, button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1,
        shiftKey: !!opt.shift, pointerId: art === 'touch' ? 11 : 7, bubbles: true, cancelable: true });
    const start = opt.ziel ? (svg.querySelector(opt.ziel) as Element | null) : svg;
    if (!start) throw new Error('Ziel fehlt: ' + opt.ziel);
    const [x0, y0] = punkte[0]!;
    start.dispatchEvent(ev('pointerdown', x0, y0));
    for (let i = 1; i < punkte.length; i++) {
      const [x, y] = punkte[i]!;
      svg.dispatchEvent(ev('pointermove', x, y));
    }
    const [xe, ye] = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', xe, ye));
    await new Promise(f => setTimeout(f, 120));
  }, [punkte, opt] as [Array<[number, number]>, Zug]);

/** Ein gerader Stiftstrich, n Punkte. */
const strich = async (pg: Seite, von: [number, number], bis: [number, number], n = 21) => {
  const punkte: Array<[number, number]> = [];
  for (let i = 0; i < n; i++)
    punkte.push([von[0] + (bis[0] - von[0]) * i / (n - 1), von[1] + (bis[1] - von[1]) * i / (n - 1)]);
  await zug(pg, punkte, { art: 'pen' });
};

const marken = (pg: Seite, blattId: string) => pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  return ((b.marken || []) as any[]).map(m => ({
    id: String(m.id), art: String(m.art), farbe: String(m.farbe), breite: Number(m.breite),
    n: Array.isArray(m.pts) ? m.pts.length : 0, druck: Array.isArray(m.pressure) ? m.pressure.length : 0,
    xs: Array.isArray(m.pts) ? m.pts.map((q: number[]) => q[0]) : [],
    ys: Array.isArray(m.pts) ? m.pts.map((q: number[]) => q[1]) : []
  }));
}, blattId);
const auswahl = (pg: Seite) => pg.evaluate(() => ({
  rahmen: document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length,
  griffe: document.querySelectorAll('.blatt-marken [data-griff]').length,
  kasten: (() => { const k = document.querySelector('.blatt-marken .blatt-auswahlkasten');
    return k ? { x: Number(k.getAttribute('x')), y: Number(k.getAttribute('y')),
      w: Number(k.getAttribute('width')), h: Number(k.getAttribute('height')) } : null; })(),
  rahmenX: [...document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen')].map(r => Number(r.getAttribute('x')))
}));
const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);
const taste = (pg: Seite, key: string, strg = false) => pg.evaluate(([key, strg]: [string, boolean]) => {
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  svg.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: strg, bubbles: true, cancelable: true }));
}, [key, strg] as [string, boolean]);
const leer = (pg: Seite, blattId: string) => pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.();
  await new Promise(f => setTimeout(f, 500));
}, blattId);

/* ======================================================================== */
console.log('\n1 · Das Lasso wählt, was in der Schlinge liegt — nicht, was in ihrem Kasten liegt');
const { ktx, pg, blattId } = await kontext(false);
await werkzeug(pg, 'stift');
await strich(pg, [100, 100], [200, 100]);   /* A — liegt im Lasso */
await strich(pg, [300, 100], [400, 100]);   /* B — im Kasten des Lassos, nicht in der Schlinge */
await strich(pg, [100, 250], [200, 250]);   /* C — weit weg */
const drei = await marken(pg, blattId);
gleich('Drei Striche', drei.length, 3);
await werkzeug(pg, 'select');
/* Ein L-förmiges Lasso: der Arm oben reicht bis x=420, ist aber nur 10 hoch;
   B (y=100) liegt darunter, im KASTEN der Schlinge, nicht in ihr. */
await zug(pg, [[80, 80], [420, 80], [420, 90], [220, 90], [220, 120], [80, 120], [80, 80]]);
let a = await auswahl(pg);
gleich('Genau ein Strich ist gewählt', a.rahmen, 1);
p('… nämlich A, der in der Schlinge liegt', a.rahmenX[0] !== undefined && a.rahmenX[0] < 100, JSON.stringify(a.rahmenX));
gleich('Vier Griffe stehen an den Ecken', a.griffe, 4);
p('Der Kasten umschliesst A (x um 97, Breite um 106)', !!a.kasten && Math.abs(a.kasten.x - 97) < 3 && Math.abs(a.kasten.w - 106) < 6, JSON.stringify(a.kasten));
p('InkGeometry.insidePolygon kennt den Unterschied', await pg.evaluate(() => {
  const l = [[80, 80], [420, 80], [420, 90], [220, 90], [220, 120], [80, 120]];
  return InkGeometry.insidePolygon([150, 100], l) === true && InkGeometry.insidePolygon([350, 100], l) === false;
}));

/* ======================================================================== */
console.log('\n2 · Die Griffe skalieren — Punkte, Druck bleibt, Breite folgt, ein Schritt');
const vorher = (await marken(pg, blattId))[0]!;
const k = a.kasten!;
/* Der Griff unten rechts: von der Ecke aus um 100 nach rechts und 50 nach unten. */
await zug(pg, [[k.x + k.w, k.y + k.h], [k.x + k.w + 50, k.y + k.h + 25], [k.x + k.w + 100, k.y + k.h + 50]],
  { ziel: '[data-griff="se"]' });
const nachher = (await marken(pg, blattId))[0]!;
const maxX = Math.max(...nachher.xs);
p('A ist nach rechts gewachsen (max x von 200 auf über 280)', maxX > 280 && maxX < 320, String(maxX));
/* Der Anker ist die Ecke des RAHMENS, und der hat drei Einheiten Rand plus
   die halbe Strichbreite — die linke Kante des Strichs rueckt darum um
   diesen Rand mal Faktor, nicht mehr. */
p('… die linke Kante blieb beim Anker (höchstens den Rahmenrand weit)', Math.abs(Math.min(...nachher.xs) - 100) < 7, String(Math.min(...nachher.xs)));
gleich('Die Punktzahl blieb, der Druck auch', [nachher.n, nachher.druck], [vorher.n, vorher.druck]);
p('Die Strichbreite wuchs mit (geometrisches Mittel)', nachher.breite > vorher.breite * 1.2, `${vorher.breite} → ${nachher.breite}`);
gleich('B und C sind unberührt', (await marken(pg, blattId)).slice(1).map(m => Math.max(...m.xs)), [400, 200]);
a = await auswahl(pg);
p('Der Kasten ist mitgewachsen', !!a.kasten && a.kasten.w > 180, JSON.stringify(a.kasten));
await pg.click('.blatt-werk [data-act="undo"]');
gleich('EIN Zurück nimmt das ganze Skalieren', Math.max(...(await marken(pg, blattId))[0]!.xs), 200);
p('InkGeometry.scale skaliert Breite und Schrift mit', await pg.evaluate(() => {
  const m = InkGeometry.scale({ art: 'stift', pts: [[10, 10], [20, 10]], breite: 2, pressure: [0.5, 0.5] }, [10, 10], 2, 2);
  const t = InkGeometry.scale({ art: 'text', point: [10, 10], fontSize: 18 }, [0, 0], 2, 2);
  return m.pts[1][0] === 30 && m.breite === 4 && m.pressure.length === 2 && t.point[0] === 20 && t.fontSize === 36;
}));

/* ======================================================================== */
console.log('\n3 · Kopieren und Einsetzen — Tastatur und Knöpfe, frische Kennungen, versetzt');
gleich('Kopieren ist mit Auswahl möglich, Einsetzen noch nicht', await pg.evaluate(() => [
  document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="copy"]')?.disabled,
  document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="paste"]')?.disabled]), [false, true]);
await taste(pg, 'c', true);
p('Strg+C füllt die Zwischenablage der Schicht', await pg.evaluate(() => Marken.zwischenablage().length === 1));
gleich('… und Einsetzen ist jetzt möglich', await pg.evaluate(() =>
  document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="paste"]')?.disabled), false);
await taste(pg, 'v', true);
let m = await marken(pg, blattId);
gleich('Strg+V setzt eine vierte Marke ein', m.length, 4);
p('… mit frischer Kennung', new Set(m.map(x => x.id)).size === 4 && m[3]!.id !== m[0]!.id, JSON.stringify(m.map(x => x.id)));
gleich('… um sechzehn versetzt', [Math.min(...m[3]!.xs) - Math.min(...m[0]!.xs), Math.min(...m[3]!.ys) - Math.min(...m[0]!.ys)], [16, 16]);
a = await auswahl(pg);
gleich('Das Eingesetzte ist die Auswahl', a.rahmenX.length === 1 && Math.abs(a.rahmenX[0]! - 113) < 3, true);
await pg.click('.blatt-werk [data-act="paste"]');
m = await marken(pg, blattId);
gleich('Der Knopf setzt ein fünftes ein', m.length, 5);
gleich('… und es wandert weiter (zweimal sechzehn)', Math.min(...m[4]!.xs) - Math.min(...m[0]!.xs), 32);
await pg.click('.blatt-werk [data-act="undo"]');
gleich('Ein Zurück nimmt genau das letzte Einsetzen', (await marken(pg, blattId)).length, 4);
/* Von der Zwischenablage aufs nächste Blatt: dieselbe Ablage, andere Schicht. */
const zweitesBlatt = await pg.evaluate(async (id: string) => {
  const seite = Store.getBlock(id).parentId;
  const b = Store.addBlock(seite, 'blatt', { text: '', papier: 'blanko' });
  Store.addBlock(b.id, 'text', { text: '' });
  await Store.flush(); App.zeichneSeite?.();
  await new Promise(f => setTimeout(f, 600));
  const svgs = document.querySelectorAll<SVGSVGElement>('.blatt-marken');
  const zwei = svgs[svgs.length - 1]!;
  zwei.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerId: 3, button: 0, buttons: 1 }));
  zwei.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, isPrimary: true, pointerId: 3, button: 0, buttons: 0 }));
  zwei.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true, cancelable: true }));
  await new Promise(f => setTimeout(f, 200));
  return { anzahl: svgs.length, marken: ((Store.getBlock(b.id) || {}).marken || []).length,
    werkzeug: zwei.getAttribute('data-tool') };
}, blattId);
gleich('Zwei Blätter auf der Seite', zweitesBlatt.anzahl, 2);
gleich('Strg+V auf dem zweiten Blatt setzt dort ein', zweitesBlatt.marken, 1);
gleich('… und schaltet das Blatt auf Auswahl', zweitesBlatt.werkzeug, 'select');

/* ======================================================================== */
console.log('\n4 · Farbe und Strich mit Auswahl gelten der Auswahl, nicht dem Rest');
await leer(pg, blattId);
await werkzeug(pg, 'stift');
await strich(pg, [100, 100], [200, 100]);
await strich(pg, [100, 200], [200, 200]);
await werkzeug(pg, 'select');
await zug(pg, [[80, 80], [220, 80], [220, 120], [80, 120], [80, 80]]);
gleich('Der obere Strich ist gewählt', (await auswahl(pg)).rahmen, 1);
const rot = await pg.evaluate(() => document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')[1]!.dataset.c);
await pg.click(`.blatt-werk .blatt-farbe[data-c="${rot}"]`);
m = await marken(pg, blattId);
gleich('Der gewählte Strich hat die neue Farbe', m[0]!.farbe, rot);
p('… der andere nicht', m[1]!.farbe !== rot, m[1]!.farbe);
p('… und der Knoten zeigt sie', await pg.evaluate((id: string) =>
  document.querySelector(`.blatt-marken [data-sid="${id}"]`)?.getAttribute('stroke'), m[0]!.id) === rot);
await pg.click('.blatt-werk .blatt-strich[data-b="5"]');
m = await marken(pg, blattId);
gleich('Der dicke Strich gilt der Auswahl', [m[0]!.breite, m[1]!.breite], [5, 2.4]);
await pg.click('.blatt-werk [data-act="undo"]');
await pg.click('.blatt-werk [data-act="undo"]');
m = await marken(pg, blattId);
gleich('Zwei Zurück: Farbe und Breite wie vorher', [m[0]!.farbe, m[0]!.breite], [drei[0]!.farbe, 2.4]);
await werkzeug(pg, 'stift');
await strich(pg, [100, 300], [200, 300]);
gleich('Der nächste Strich nimmt die zuletzt gewählte Farbe', (await marken(pg, blattId))[2]!.farbe, rot);

/* ======================================================================== */
console.log('\n5 · Umschalt-Lasso ergänzt, Escape hebt auf, ein gerader Zug ist ein Kasten');
await werkzeug(pg, 'select');
await zug(pg, [[80, 80], [220, 80], [220, 120], [80, 120], [80, 80]]);
await zug(pg, [[80, 180], [220, 180], [220, 220], [80, 220], [80, 180]], { shift: true });
gleich('Mit Umschalt kommt der zweite dazu', (await auswahl(pg)).rahmen, 2);
await taste(pg, 'Escape');
gleich('Escape hebt die Auswahl auf', (await auswahl(pg)).rahmen, 0);
await zug(pg, [[80, 80], [150, 152], [220, 230]]);
gleich('Ein fast gerader Zug (mit Zittern) wählt wie ein Kasten — zwei Striche', (await auswahl(pg)).rahmen, 2);
await taste(pg, 'Escape');
await zug(pg, [[80, 80], [85, 82]]);
gleich('Ein winziger Zug wählt nichts', (await auswahl(pg)).rahmen, 0);

/* ======================================================================== */
console.log('\n6 · Am Telefon fasst der Finger den Griff');
const { ktx: ktxH, pg: pgH, blattId: blattH } = await kontext(true);
await werkzeug(pgH, 'stift');
/* MIT DEM FINGER gezogen: seit E354 ist ein Finger nach einem Stift vier
   Sekunden lang eine Hand und zieht kein Lasso. Hier kommt kein Stift vor. */
await zug(pgH, Array.from({ length: 21 }, (_v, i) => [100 + i * 5, 100] as [number, number]), { art: 'touch' });
await werkzeug(pgH, 'select');
await zug(pgH, [[80, 80], [220, 80], [220, 120], [80, 120], [80, 80]], { art: 'touch' });
const aH = await auswahl(pgH);
gleich('Der Finger zieht das Lasso', aH.rahmen, 1);
const feld = await pgH.evaluate(() => {
  const g = document.querySelector<SVGCircleElement>('.blatt-marken [data-griff="se"]');
  const r = g?.getBoundingClientRect();
  return r ? Math.round(r.width) : 0;
});
p('Das Trefffeld eines Griffs ist am Telefon mindestens 20 px breit', feld >= 20, String(feld));
const kH = aH.kasten!;
await zug(pgH, [[kH.x + kH.w, kH.y + kH.h], [kH.x + kH.w + 60, kH.y + kH.h + 30]], { art: 'touch', ziel: '[data-griff="se"]' });
p('Der Finger skaliert über den Griff', Math.max(...(await marken(pgH, blattH))[0]!.xs) > 240, String(Math.max(...(await marken(pgH, blattH))[0]!.xs)));
gleich('Kopieren und Einsetzen stehen als Knöpfe in der Leiste', await pgH.evaluate(() =>
  ['copy', 'paste'].map(a => !!document.querySelector(`.blatt-werk [data-act="${a}"]`))), [true, true]);
await ktxH.close();

/* ======================================================================== */
console.log('\n7 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
