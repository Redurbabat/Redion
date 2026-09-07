/* Suite 344 — Der Radierer: streichen, Teil, Marker, Stift-Rückknopf (E352)
 * ============================================================================
 * Redur: „dass du die Schrift, Linie und so alles fertig machst — es sollte
 * wie GoodNotes sein." L115 Punkt 1: der Radierer nahm eine ganze Marke je
 * Tipp, und nur, wenn der Tipp den Knoten selbst traf.
 *
 *   1 · STREICHEN — ein Zug über zwei Striche nimmt beide, der dritte bleibt;
 *       ein Zug ist EIN Schritt im Verlauf; der Ring ist da, solange man zieht.
 *   2 · TEIL — ein Strich wird zu zwei; die Kennung bleibt am ersten Stück,
 *       der Druck wandert mit, die Lücke ist so breit wie der Radierer.
 *   3 · NUR MARKER — der Marker geht, der Stift darunter bleibt.
 *   4 · FORMEN gehen auch im Teil-Modus ganz.
 *   5 · DER RÜCKKNOPF DES STIFTS radiert, das Werkzeug bleibt; die rechte
 *       Maustaste tut das nicht.
 *   6 · DER MODUS-KNOPF wechselt, schaltet auf den Radierer und wird gemerkt.
 *   7 · EIN TIPP OHNE BEWEGUNG nimmt, was darunter liegt — und sonst nichts.
 *   8 · AM TELEFON ist der Knopf ein Fingerknopf, und der Finger radiert.
 *   9 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test344.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Marken: any;
declare const InkGeometry: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9348;

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
    const s = Store.addPage(null, { text: 'Radierprobe', icon: '⌫' });
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
type Zug = { art?: Zeigerart; button?: number; buttons?: number; nurDown?: boolean };

/** Einen Zug mit synthetischen Zeigerereignissen fahren — Punkte im
    BLATTRAUM. Knopf und Zeigerart sind wählbar, damit der Rückknopf eines
    Stifts (button 5 / buttons 32) und die rechte Maustaste geprüft werden
    können. `nurDown` lässt den Zeiger unten (für den Blick auf den Ring). */
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
    const art = opt.art ?? 'pen';
    const button = opt.button ?? 0;
    const buttons = opt.buttons ?? 1;
    const ev = (typ: string, x: number, y: number) =>
      new PointerEvent(typ, { ...zu(x, y), pointerType: art, pressure: typ === 'pointerup' ? 0 : 0.5,
        isPrimary: true, button: typ === 'pointermove' ? -1 : button,
        buttons: typ === 'pointerup' ? 0 : buttons,
        pointerId: art === 'touch' ? 11 : 7, bubbles: true, cancelable: true });
    const [x0, y0] = punkte[0]!;
    svg.dispatchEvent(ev('pointerdown', x0, y0));
    for (let i = 1; i < punkte.length; i++) {
      const [x, y] = punkte[i]!;
      svg.dispatchEvent(ev('pointermove', x, y));
    }
    if (opt.nurDown) return;
    const [xe, ye] = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', xe, ye));
    await new Promise(f => setTimeout(f, 120));
  }, [punkte, opt] as [Array<[number, number]>, Zug]);

const loslassen = (pg: Seite) => pg.evaluate(async () => {
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  svg.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'pen', isPrimary: true, button: 0,
    buttons: 0, pointerId: 7, bubbles: true, cancelable: true }));
  await new Promise(f => setTimeout(f, 120));
});

/** Ein gerader Stiftstrich mit gleichmässigem Druck, n Punkte. */
const strich = (pg: Seite, von: [number, number], bis: [number, number], n = 21) => {
  const punkte: Array<[number, number]> = [];
  for (let i = 0; i < n; i++)
    punkte.push([von[0] + (bis[0] - von[0]) * i / (n - 1), von[1] + (bis[1] - von[1]) * i / (n - 1)]);
  return zug(pg, punkte, { art: 'pen' });
};

const marken = (pg: Seite, blattId: string) => pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  return ((b.marken || []) as any[]).map(m => ({
    id: String(m.id), art: String(m.art), n: Array.isArray(m.pts) ? m.pts.length : 0,
    druck: Array.isArray(m.pressure) ? m.pressure.length : 0,
    xs: Array.isArray(m.pts) ? m.pts.map((q: number[]) => q[0]) : [],
    knoten: !!document.querySelector(`.blatt-marken [data-sid="${m.id}"]`)
  }));
}, blattId);

/* SEIT E375 STEHEN DIE VIER FORMEN HINTER EINEM KNOPF (L115 Punkt 9): erst
   „Form", dann im Zubehör die Art. Genau der Weg, den auch ein Mensch geht —
   `[data-wz="rectangle"]` gibt es nicht mehr, und dieser Lauf lief 30
   Sekunden lang in einen Knopf, den niemand mehr baut. Derselbe Helfer
   steht in test351. */
const FORM_ARTEN = ['line', 'arrow', 'rectangle', 'ellipse'];
const werkzeug = async (pg: Seite, wz: string): Promise<void> => {
  if (!FORM_ARTEN.includes(wz)) { await pg.click(`.blatt-werk [data-wz="${wz}"]`); return; }
  await pg.click('.blatt-werk [data-wz="formen"]');
  await pg.click(`.blatt-werk [data-act="formart"][data-form="${wz}"]`);
};
/* Seit E359 zeigt auch der Rechner nur das Zubehoer des Werkzeugs: der
   Modus-Knopf steht erst beim Radierer — also erst den waehlen (wie §8). */
const modusKnopf = async (pg: Seite) => {
  await pg.click('.blatt-werk [data-wz="radierer"]');
  await pg.click('.blatt-werk [data-act="radiermodus"]');
};
const modus = (pg: Seite) => pg.evaluate(() => ({
  knopf: document.querySelector<HTMLElement>('.blatt-werk [data-act="radiermodus"]')?.dataset.modus ?? null,
  meta: Store.getMeta('zeichnen:radierer') ?? null,
  werkzeug: document.querySelector<HTMLElement>('.blatt-marken')?.getAttribute('data-tool') ?? null,
  an: document.querySelector<HTMLElement>('.blatt-werk [data-wz].on')?.dataset.wz ?? null
}));
/** Bis der Modus-Knopf den gewünschten Modus zeigt (höchstens drei Tipps). */
/* WIE OFT MUSS MAN WEITERTIPPEN? So oft, wie es Arten gibt — und die
   Zahl wird ERFRAGT, nicht gewusst. Hier stand eine feste 3, weil es drei
   Modi gab; mit den fünf aus E482 reichte sie nicht mehr, und der Lauf
   fiel an einer Stelle um, die mit dem Radierermodus gar nichts zu tun
   hatte. Eine Prüfung, die eine Anzahl auswendig kennt, wird beim
   nächsten Eintrag rot, ohne dass etwas kaputt ist. */
const modusSetzen = async (pg: Seite, ziel: string) => {
  const runde = Number(await pg.evaluate(`Marken.RADIERER.length`)) || 3;
  for (let i = 0; i <= runde; i++) {
    if ((await modus(pg)).knopf === ziel) return;
    await modusKnopf(pg);
    await pg.waitForTimeout(80);
  }
};
const zurueck = (pg: Seite) => pg.click('.blatt-werk [data-act="undo"]');

/* ======================================================================== */
console.log('\n1 · Streichen — ein Zug über zwei Striche nimmt beide, der dritte bleibt');
const { ktx, pg, blattId } = await kontext(false);
await werkzeug(pg, 'stift');
await strich(pg, [100, 100], [300, 100]);
await strich(pg, [100, 200], [300, 200]);
await strich(pg, [100, 300], [300, 300]);
gleich('Drei Striche liegen auf dem Blatt', (await marken(pg, blattId)).map(m => m.art), ['stift', 'stift', 'stift']);

await werkzeug(pg, 'radierer');
await modusSetzen(pg, 'ganz');
/* Der Ring: erst hinsehen, solange der Zeiger unten ist. */
await zug(pg, [[200, 60], [200, 70]], { art: 'pen', nurDown: true });
const ring = await pg.evaluate(() => {
  const k = document.querySelector<SVGCircleElement>('.blatt-marken .blatt-radierkreis');
  return k ? { r: Number(k.getAttribute('r')), cy: Number(k.getAttribute('cy')) } : null;
});
p('Solange man zieht, zeigt ein Ring die Grösse des Radierers', !!ring && ring.r >= 5, JSON.stringify(ring));
p('… und er wandert mit dem Zeiger', !!ring && Math.abs(ring.cy - 70) < 1, JSON.stringify(ring));
await loslassen(pg);
p('Nach dem Loslassen ist der Ring weg', !(await pg.$('.blatt-marken .blatt-radierkreis')));
gleich('Ein Zug in der Luft nimmt nichts', (await marken(pg, blattId)).length, 3);

await zug(pg, [[200, 80], [200, 120], [200, 160], [200, 220]], { art: 'pen' });
const nachZug = await marken(pg, blattId);
gleich('Der Zug über zwei Striche lässt genau einen stehen', nachZug.length, 1);
p('… den unteren, den der Zug nicht berührt hat', nachZug[0]?.xs[0] === 100 && (await pg.evaluate((id: string) => Store.getBlock(id).marken[0].pts[0][1], blattId)) === 300);
p('… und die Knoten der beiden anderen sind aus der Schicht', await pg.evaluate(() => document.querySelectorAll('.blatt-marken [data-sid]').length) === 1);
await zurueck(pg);
gleich('EIN Schritt zurück bringt BEIDE Striche wieder — ein Zug ist ein Schritt', (await marken(pg, blattId)).length, 3);

/* ======================================================================== */
console.log('\n2 · Teil — ein Strich wird zu zwei, die Kennung bleibt am ersten Stück');
await pg.evaluate((id: string) => { Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); }, blattId);
await pg.waitForTimeout(500);
await werkzeug(pg, 'stift');
await strich(pg, [100, 150], [400, 150], 31);
const vorher = await marken(pg, blattId);
gleich('Ein langer Strich', vorher.length, 1);
const alteId = vorher[0]!.id;
await modusSetzen(pg, 'teil');
gleich('Der Modus-Knopf schaltet auf den Radierer um', (await modus(pg)).werkzeug, 'radierer');
await zug(pg, [[250, 130], [250, 150], [250, 170]], { art: 'pen' });
const teile = await marken(pg, blattId);
gleich('Aus einem Strich werden zwei', teile.length, 2);
gleich('Beide sind Stiftstriche', teile.map(m => m.art), ['stift', 'stift']);
gleich('Das erste Stück behält die Kennung', teile[0]?.id, alteId);
p('Das zweite bekommt eine neue', !!teile[1] && teile[1].id !== alteId && teile[1].id.length >= 6, JSON.stringify(teile[1]?.id));
p('Jedes Stück hat je Punkt einen Druckwert', teile.every(m => m.n === m.druck && m.n >= 2), JSON.stringify(teile.map(m => [m.n, m.druck])));
const links = Math.max(...(teile[0]?.xs ?? [0]));
const rechts = Math.min(...(teile[1]?.xs ?? [0]));
p('Die Lücke liegt um den Radierer herum: links endet vor 245, rechts beginnt nach 255',
  links < 245 && links > 200 && rechts > 255 && rechts < 300, `links ${links}, rechts ${rechts}`);
p('Beide Stücke stehen als Knoten in der Schicht', teile.every(m => m.knoten));
await zurueck(pg);
const wieder = await marken(pg, blattId);
p('Zurück macht daraus wieder EINEN Strich mit allen Punkten', wieder.length === 1 && wieder[0]!.n === vorher[0]!.n, JSON.stringify(wieder.map(m => m.n)));

/* ======================================================================== */
console.log('\n3 · Nur Marker — der Marker geht, der Stift darunter bleibt');
await pg.evaluate((id: string) => { Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); }, blattId);
await pg.waitForTimeout(500);
await werkzeug(pg, 'stift');
await strich(pg, [100, 150], [300, 150]);
await werkzeug(pg, 'marker');
await strich(pg, [100, 150], [300, 150]);
const uebereinander = await marken(pg, blattId);
gleich('Stift und Marker liegen übereinander', uebereinander.map(m => m.art), ['stift', 'marker']);
await modusSetzen(pg, 'marker');
await zug(pg, [[200, 120], [200, 150], [200, 180]], { art: 'pen' });
gleich('Der Zug nimmt nur den Marker', (await marken(pg, blattId)).map(m => m.art), ['stift']);
gleich('… und der Stift ist unversehrt (gleiche Punkte wie vor dem Zug)', (await marken(pg, blattId))[0]?.n, uebereinander[0]?.n);

/* ======================================================================== */
console.log('\n4 · Formen gehen auch im Teil-Modus ganz');
await pg.evaluate((id: string) => { Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); }, blattId);
await pg.waitForTimeout(500);
await werkzeug(pg, 'rectangle');
await zug(pg, [[100, 100], [150, 150], [200, 200]], { art: 'pen' });
gleich('Ein Rechteck', (await marken(pg, blattId)).map(m => m.art), ['rectangle']);
await modusSetzen(pg, 'teil');
await zug(pg, [[150, 90], [150, 100], [150, 110]], { art: 'pen' });
gleich('Der Teil-Radierer nimmt das Rechteck ganz — es gibt kein halbes Rechteck', (await marken(pg, blattId)).length, 0);

/* ======================================================================== */
console.log('\n5 · Der Rückknopf des Stifts radiert, das Werkzeug bleibt');
await modusSetzen(pg, 'ganz');
await werkzeug(pg, 'stift');
await strich(pg, [100, 100], [300, 100]);
await strich(pg, [100, 200], [300, 200]);
gleich('Zwei Striche, Werkzeug Stift', (await modus(pg)).werkzeug, 'stift');
await zug(pg, [[200, 80], [200, 120]], { art: 'pen', button: 5, buttons: 32 });
gleich('Das Radierende des Stifts (button 5) nimmt den oberen Strich', (await marken(pg, blattId)).length, 1);
gleich('… und das Werkzeug ist danach noch der Stift', (await modus(pg)).werkzeug, 'stift');
await zug(pg, [[200, 180], [200, 220]], { art: 'pen', button: 2, buttons: 2 });
gleich('Der Seitenknopf des Stifts (button 2) nimmt den unteren', (await marken(pg, blattId)).length, 0);
await strich(pg, [100, 300], [300, 300]);
gleich('Der Stift zeichnet danach ganz normal weiter', (await marken(pg, blattId)).map(m => m.art), ['stift']);
await zug(pg, [[200, 280], [200, 320]], { art: 'mouse', button: 2, buttons: 2 });
gleich('Die rechte MAUStaste radiert nicht — sie ist kein Stift', (await marken(pg, blattId)).length, 1);
const kontextmenue = await pg.evaluate(() => {
  const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  svg.dispatchEvent(ev);
  return ev.defaultPrevented;
});
p('Das Kontextmenü bleibt beim Zeichnen zu (der Seitenknopf ist für den Browser eine rechte Taste)', kontextmenue);

/* ======================================================================== */
console.log('\n6 · Der Modus-Knopf wechselt, schaltet um und wird gemerkt');
await modusSetzen(pg, 'ganz');
const m0 = await modus(pg);
gleich('Ganz steht im Knopf', m0.knopf, 'ganz');
await modusKnopf(pg);
const m1 = await modus(pg);
gleich('Ein Tipp: Teil', m1.knopf, 'teil');
gleich('… und die Marke sagt dasselbe', m1.meta, 'teil');
gleich('… und der Radierer ist das Werkzeug', m1.an, 'radierer');
/* SEIT E482 SIND ES FÜNF ARTEN: ganz, teil, stift, marker, band. Der
   Knopf geht sie der Reihe nach durch, und der Kreis schliesst sich nach
   der letzten. Die Liste wird ERFRAGT und nicht aufgezählt — sonst fällt
   dieser Lauf beim nächsten Eintrag wieder um, ohne dass etwas kaputt
   ist. */
const arten: string[] = await pg.evaluate(() => Marken.RADIERER.map((r: any) => String(r.id)));
p('Es sind mindestens fünf Arten, und sie beginnen mit ganz und teil',
  arten.length >= 5 && arten[0] === 'ganz' && arten[1] === 'teil', JSON.stringify(arten));
for (let i = 2; i < arten.length; i++) {
  await modusKnopf(pg);
  gleich('Noch ein Tipp: ' + arten[i], (await modus(pg)).knopf, arten[i]);
}
await modusKnopf(pg);
gleich('Und wieder Ganz — der Kreis schliesst sich', (await modus(pg)).knopf, 'ganz');
await modusKnopf(pg); /* teil bleibt gespeichert */
await pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { marken: [] });
  await Store.flush();
}, blattId);
/* Neu laden im SELBEN Kontext — ein neuer Kontext hätte eine leere Datenbank
   und wüsste von keiner Wahl. */
await pg.reload();
await pg.waitForTimeout(2800);
await pg.evaluate(async (id: string) => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  App.oeffne(Store.getBlock(id).parentId);
  await new Promise(f => setTimeout(f, 900));
}, blattId);
gleich('Nach dem Neuladen zeigt der Knopf den gemerkten Modus', (await modus(pg)).knopf, 'teil');
await werkzeug(pg, 'stift');
await strich(pg, [100, 150], [400, 150], 31);
await werkzeug(pg, 'radierer');
await zug(pg, [[250, 130], [250, 170]], { art: 'pen' });
gleich('… und die Schicht radiert auch so: Teil, zwei Stücke', (await marken(pg, blattId)).length, 2);
p('Marken.RADIERER nennt die Arten — die zwei Mengen (wie viel) zuerst, dann die Werkzeuge (wovon)',
  await pg.evaluate(() => Array.isArray(Marken.RADIERER)
    && Marken.RADIERER.map((r: any) => r.id).join(',').startsWith('ganz,teil,')
    && Marken.RADIERER.filter((r: any) => r.nur).length >= 3
    && Marken.RADIERER.slice(0, 2).every((r: any) => !r.nur)));

/* ======================================================================== */
console.log('\n7 · Ein Tipp ohne Bewegung nimmt, was darunter liegt — und sonst nichts');
await pg.evaluate((id: string) => { Store.updateBlock(id, { marken: [] }); App.zeichneSeite?.(); }, blattId);
await pg.waitForTimeout(500);
await werkzeug(pg, 'stift');
await strich(pg, [100, 100], [300, 100]);
await modusSetzen(pg, 'ganz');
await zug(pg, [[200, 400]], { art: 'pen' });
gleich('Ein Tipp weit weg nimmt nichts', (await marken(pg, blattId)).length, 1);
/* Hätte der leere Tipp einen Schritt geschrieben, nähme EIN Zurück nur
   diesen leeren Schritt — und der Strich stünde noch da. */
await zurueck(pg);
gleich('… und schreibt keinen Schritt in den Verlauf: EIN Zurück nimmt den Strich', (await marken(pg, blattId)).length, 0);
await pg.click('.blatt-werk [data-act="redo"]');
gleich('Vor bringt ihn wieder', (await marken(pg, blattId)).length, 1);
await zug(pg, [[200, 103]], { art: 'pen' });
gleich('Ein Tipp auf den Strich nimmt ihn — der alte Weg bleibt', (await marken(pg, blattId)).length, 0);
p('InkGeometry.touchesCircle misst am Weg, nicht am Kasten', await pg.evaluate(() =>
  InkGeometry.touchesCircle({ art: 'stift', pts: [[0, 0], [100, 100]], breite: 2 }, [50, 50], 3) === true &&
  InkGeometry.touchesCircle({ art: 'stift', pts: [[0, 0], [100, 100]], breite: 2 }, [80, 20], 3) === false));
p('InkGeometry.splitByCircle rechnet den Druck am Schnittpunkt dazwischen', await pg.evaluate(() => {
  const t = InkGeometry.splitByCircle([[0, 0], [100, 0]], [0.2, 0.8], [50, 0], 10);
  return t.length === 2 && t[0].pts[1][0] === 40 && t[1].pts[0][0] === 60 &&
    Math.abs(t[0].pressure[1] - 0.44) < 0.01 && Math.abs(t[1].pressure[0] - 0.56) < 0.01;
}));

/* ======================================================================== */
console.log('\n8 · Am Telefon ist der Knopf ein Fingerknopf, und der Finger radiert');
const { ktx: ktxH, pg: pgH, blattId: blattH } = await kontext(true);
/* Seit E356 steht der Modus-Knopf am Telefon nur beim Radierer. */
await werkzeug(pgH, 'radierer');
const masse = await pgH.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="radiermodus"]');
  const r = k?.getBoundingClientRect();
  return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
});
p('Der Modus-Knopf ist mindestens 44 × 44', !!masse && masse.w >= 44 && masse.h >= 44, JSON.stringify(masse));
await werkzeug(pgH, 'stift');
/* MIT DEM FINGER gezogen, nicht mit dem Stift: seit E354 ist ein Finger
   nach einem Stift vier Sekunden lang eine Hand und radiert nicht. Hier
   gibt es keinen Stift — der Finger zeichnet und radiert. */
await zug(pgH, Array.from({ length: 21 }, (_v, i) => [100 + i * 10, 100] as [number, number]), { art: 'touch' });
gleich('Der Finger hat gezeichnet', (await marken(pgH, blattH)).length, 1);
await werkzeug(pgH, 'radierer');
await modusSetzen(pgH, 'ganz');
await zug(pgH, [[200, 80], [200, 120]], { art: 'touch' });
gleich('Der Finger streicht den Strich weg', (await marken(pgH, blattH)).length, 0);
await ktxH.close();

/* ======================================================================== */
console.log('\n9 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
