/* Suite 439 — Auswahl wie GoodNotes: Drehen, Ausschneiden, Reihenfolge, Sperren, Kritzel-Löschen, Kreis-Lasso (E466)
 * ============================================================================
 * Zweiter Bogen aus Redurs Auftrag vom 7. September (E465): das, was
 * GoodNotes' Lasso und Objekt-Menü können und Redions Auswahl (E353) noch
 * nicht konnte.
 *
 *   §1 DREHEN: ein Griff über dem Kasten; Linien drehen ihre Punkte, ein
 *      Kasten merkt sich `dreh` und steht schief — und Zurück holt es zurück.
 *   §2 AUSSCHNEIDEN: Strg X nimmt die Auswahl in die Zwischenablage und
 *      vom Blatt; Einsetzen bringt sie zurück.
 *   §3 NACH VORN, NACH HINTEN: die Reihenfolge der Marken ist die
 *      Stapelung — auch die Knoten folgen ihr.
 *   §4 SPERREN: gesperrt heisst nicht schieben, nicht löschen, nicht
 *      radieren; das Schloss steht am Rahmen; entsperrt geht alles wieder.
 *   §5 KRITZEL-LÖSCHEN: ein dichtes Hin-und-her über einem Strich nimmt
 *      ihn weg; eine Welle bleibt eine Welle; abgeschaltet bleibt auch das
 *      Gekritzel ein Strich.
 *   §6 KREIS-LASSO: einen Bereich umkreisen und halten wählt, was darin
 *      liegt; eine leere Schlinge wird weiter ein Kreis (E355 bleibt).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `marken.ts` im Drehen-Zweig `InkGeometry.rotate` durch die
 *        Kopie ersetzen: nichts dreht sich. Gelaufen am 7. September, rot.
 *   §5 → `istKritzel` immer false: das Gekritzel wird ein Strich. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test439.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9559;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
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
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein Blatt mit den gegebenen Marken, ausserhalb des Schreibstudios. */
const mitBlatt = async (marken: unknown[]): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Zeichenziel !== 'undefined'");
  await s.evaluate(async (marken: unknown[]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:stift', 'kugel');
    Store.setMeta('zeichnen:kritzel', true);
    Store.setMeta('zeichnen:formen', true);
    const seite = Store.addPage(null, { text: 'Probeblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken });
    await Store.flush();
    App.oeffne(seite.id);
  }, marken);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};
type Zug = { art?: string; ziel?: string; halten?: number; shift?: boolean };
/** Einen Zug fahren — Punkte im Blattraum. `ziel`: worauf das Aufsetzen landet
 *  (ein Griff, eine Marke); `halten`: ms vor dem Abheben (E355/E466). */
const zug = (s: Page, punkte: number[][], opt: Zug = {}) =>
  s.evaluate(async ({ punkte, opt }: { punkte: number[][]; opt: Zug }) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken');
    if (!f) throw new Error('keine Zeichenschicht');
    const ctm = f.getScreenCTM();
    if (!ctm) throw new Error('kein CTM');
    const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!; const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const art = opt.art || 'mouse';
    const ev = (typ: string, q: number[]) => { const c = px(q); return new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
      pointerId: 7, pointerType: art, isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6, shiftKey: !!opt.shift }); };
    const start = opt.ziel ? f.querySelector(opt.ziel) : f;
    if (!start) throw new Error('Ziel fehlt: ' + opt.ziel);
    start.dispatchEvent(ev('pointerdown', punkte[0]!));
    for (let i = 1; i < punkte.length; i++) f.dispatchEvent(ev('pointermove', punkte[i]!));
    if (opt.halten) await new Promise(r => setTimeout(r, opt.halten));
    f.dispatchEvent(ev('pointerup', punkte[punkte.length - 1]!));
    await new Promise(r => setTimeout(r, 400));
  }, { punkte, opt });
const strecke = (von: number[], bis: number[], n = 12): number[][] =>
  Array.from({ length: n + 1 }, (_v, i) => [von[0]! + (bis[0]! - von[0]!) * i / n, von[1]! + (bis[1]! - von[1]!) * i / n]);
const MARKEN = `(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`;
const marken = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(MARKEN) as string);
const knotenReihe = (s: Page): Promise<string[]> =>
  s.evaluate(`[...document.querySelectorAll('.blatt-marken [data-sid]')].map(n => n.getAttribute('data-sid'))`) as Promise<string[]>;

/* ═══ §1 Drehen ════════════════════════════════════════════════════════════ */
console.log('\n§1 Drehen');
{
  const s = await mitBlatt([
    { id: 'l1', art: 'line', farbe: '#111111', breite: 2.4, pts: [[100, 100], [300, 100]] },
    { id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[100, 200], [200, 260]] }
  ]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, strecke([80, 80], [320, 280]));
  gleich('Ein Kastenzug wählt beide', await s.evaluate(`document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length`), 2);
  const griff = JSON.parse(await s.evaluate(`(() => {
    const g = document.querySelector('.blatt-marken [data-griff="dreh"]');
    const k = document.querySelector('.blatt-marken .blatt-auswahlkasten');
    return JSON.stringify(g ? { cx: Number(g.getAttribute('cx')), cy: Number(g.getAttribute('cy')),
      mx: Number(k.getAttribute('x')) + Number(k.getAttribute('width')) / 2, my: Number(k.getAttribute('y')) + Number(k.getAttribute('height')) / 2 } : null);
  })()`) as string);
  p('Über dem Kasten steht ein Drehgriff', !!griff && griff.cy < griff.my, JSON.stringify(griff));
  /* Den Griff um 90° im Uhrzeigersinn um die Mitte führen. */
  const vx = griff.cx - griff.mx, vy = griff.cy - griff.my;
  const ziel = [griff.mx - vy, griff.my + vx];
  const pfad: number[][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (Math.PI / 2) * i / 12;
    pfad.push([griff.mx + vx * Math.cos(a) - vy * Math.sin(a), griff.my + vx * Math.sin(a) + vy * Math.cos(a)]);
  }
  pfad.push(ziel);
  await zug(s, pfad, { ziel: '[data-griff="dreh"]' });
  const nachher = await marken(s);
  const linie = nachher.find(m => m.id === 'l1'), kasten = nachher.find(m => m.id === 'r1');
  p('Die Linie hat ihre Punkte gedreht — sie steht jetzt senkrecht',
    !!linie && Math.abs(linie.pts[0][0] - linie.pts[1][0]) < 3 && Math.abs(linie.pts[0][1] - linie.pts[1][1]) > 190, JSON.stringify(linie?.pts));
  p('Das Rechteck merkt sich den Winkel (≈ 90°) statt seine Ecken zu verzerren',
    !!kasten && Math.abs(Math.abs(kasten.dreh) - 90) <= 3 && kasten.pts[1][0] - kasten.pts[0][0] === 100, JSON.stringify({ dreh: kasten?.dreh, pts: kasten?.pts }));
  p('… und sein Knoten steht schief (transform)',
    /rotate\(/.test(String(await s.evaluate(`document.querySelector('.blatt-marken [data-sid="r1"]').getAttribute('transform')`))));
  await s.click('.blatt-werk [data-act="undo"]');
  const zurueck = await marken(s);
  p('Zurück holt beides zurück', zurueck.find(m => m.id === 'r1')?.dreh === undefined && zurueck.find(m => m.id === 'l1')?.pts[1][1] === 100);
  await s.close();
}

/* ═══ §2 Ausschneiden ══════════════════════════════════════════════════════ */
console.log('\n§2 Ausschneiden');
{
  const s = await mitBlatt([
    { id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[100, 200], [200, 260]] },
    { id: 'l1', art: 'line', farbe: '#111111', breite: 2.4, pts: [[100, 100], [300, 100]] }
  ]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[150, 230], [150, 230]], { ziel: '[data-sid="r1"]' });
  gleich('Ein Tipp wählt das Rechteck', await s.evaluate(`document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length`), 1);
  await s.keyboard.press('Control+x');
  await s.waitForTimeout(200);
  gleich('Strg X nimmt es vom Blatt', (await marken(s)).map(m => m.id), ['l1']);
  gleich('… und in die Zwischenablage', await s.evaluate(`Marken.zwischenablage().length`), 1);
  await s.click('.blatt-werk [data-act="paste"]');
  gleich('Einsetzen bringt es zurück (mit neuer Kennung, versetzt)', (await marken(s)).length, 2);
  await s.close();
}

/* ═══ §3 Nach vorn, nach hinten ════════════════════════════════════════════ */
console.log('\n§3 Nach vorn, nach hinten');
{
  const s = await mitBlatt([
    { id: 'a', art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[100, 100], [220, 180]] },
    { id: 'b', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[140, 130], [260, 210]] },
    { id: 'c', art: 'rectangle', farbe: '#3aa757', breite: 2.4, pts: [[180, 160], [300, 240]] }
  ]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[110, 110], [110, 110]], { ziel: '[data-sid="a"]' });
  await s.click('.blatt-werk [data-act="vor"]');
  gleich('„Nach vorn" stellt a ans Ende der Liste', (await marken(s)).map(m => m.id), ['b', 'c', 'a']);
  gleich('… und die Knoten folgen', await knotenReihe(s), ['b', 'c', 'a']);
  await s.click('.blatt-werk [data-act="hinten"]');
  gleich('„Nach hinten" stellt a an den Anfang', (await marken(s)).map(m => m.id), ['a', 'b', 'c']);
  await s.click('.blatt-werk [data-act="undo"]');
  gleich('Zurück kennt den Schritt', (await marken(s)).map(m => m.id), ['b', 'c', 'a']);
  await s.close();
}

/* ═══ §4 Sperren ═══════════════════════════════════════════════════════════ */
console.log('\n§4 Sperren');
{
  const s = await mitBlatt([{ id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[100, 200], [200, 260]] }]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[150, 230], [150, 230]], { ziel: '[data-sid="r1"]' });
  await s.click('.blatt-werk [data-act="sperren"]');
  const gesperrt = await marken(s);
  p('Der Knopf sperrt die Marke', gesperrt[0]?.gesperrt === true);
  gleich('… und meldet es', await s.evaluate(`document.querySelector('.blatt-werk [data-act="sperren"]').getAttribute('aria-pressed')`), 'true');
  p('Das Schloss steht am Rahmen', await s.evaluate(`!!document.querySelector('.blatt-marken .blatt-auswahlrahmen-gesperrt') && !!document.querySelector('.blatt-marken .blatt-schloss')`));
  await zug(s, strecke([150, 230], [250, 330]), { ziel: '[data-sid="r1"]' });
  gleich('Schieben bewegt es nicht', (await marken(s))[0]?.pts, [[100, 200], [200, 260]]);
  await s.keyboard.press('Delete');
  await s.waitForTimeout(150);
  gleich('Entfernen löscht es nicht', (await marken(s)).length, 1);
  await s.click('.blatt-werk [data-wz="radierer"]');
  await zug(s, strecke([90, 200], [210, 200]));
  gleich('Der Radierer nimmt es nicht', (await marken(s)).length, 1);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[150, 230], [150, 230]], { ziel: '[data-sid="r1"]' });
  await s.click('.blatt-werk [data-act="sperren"]');
  p('Entsperrt', (await marken(s))[0]?.gesperrt === undefined);
  await zug(s, strecke([150, 230], [250, 330]), { ziel: '[data-sid="r1"]' });
  const bewegt = (await marken(s))[0]?.pts;
  p('… und jetzt bewegt es sich', !!bewegt && bewegt[0][0] > 150, JSON.stringify(bewegt));
  await s.close();
}

/* ═══ §5 Kritzel-Löschen ═══════════════════════════════════════════════════ */
console.log('\n§5 Kritzel-Löschen');
{
  const gekritzel = (y0: number): number[][] => {
    const pts: number[][] = [];
    for (let z = 0; z < 6; z++) {
      const von = z % 2 ? 300 : 100, bis = z % 2 ? 100 : 300;
      for (let i = 0; i < 10; i++) pts.push([von + (bis - von) * i / 10, y0 + z * 4]);
    }
    return pts;
  };
  const welle = (y0: number): number[][] => Array.from({ length: 40 }, (_v, i) => [100 + i * 5, y0 + Math.sin(i / 3) * 12]);
  const s = await mitBlatt([{ id: 'l1', art: 'line', farbe: '#111111', breite: 2.4, pts: [[100, 500], [300, 500]] }]);
  await s.click('.blatt-werk [data-wz="stift"]');
  await zug(s, welle(600));
  gleich('Eine Welle ist ein Strich — die Linie bleibt', (await marken(s)).map(m => m.art), ['line', 'stift']);
  await zug(s, gekritzel(490));
  gleich('Ein Gekritzel über der Linie nimmt sie weg — und wird selbst keiner', (await marken(s)).map(m => m.art), ['stift']);
  await s.click('.blatt-werk [data-act="undo"]');
  gleich('Zurück holt die Linie zurück', (await marken(s)).map(m => m.art), ['line', 'stift']);
  await s.click('.blatt-werk [data-act="kritzel"]');
  gleich('Der Schalter merkt sich „aus"', await s.evaluate(`Store.getMeta('zeichnen:kritzel')`), false);
  await zug(s, gekritzel(490));
  gleich('Abgeschaltet bleibt das Gekritzel ein Strich, die Linie auch', (await marken(s)).map(m => m.art), ['line', 'stift', 'stift']);
  await s.close();
}

/* ═══ §6 Kreis-Lasso ═══════════════════════════════════════════════════════ */
console.log('\n§6 Kreis-Lasso');
{
  const kreis = (cx: number, cy: number, r: number): number[][] =>
    Array.from({ length: 25 }, (_v, i) => [cx + r * Math.cos(i / 24 * Math.PI * 2), cy + r * Math.sin(i / 24 * Math.PI * 2)]);
  const s = await mitBlatt([{ id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, pts: [[200, 300], [260, 350]] }]);
  await s.click('.blatt-werk [data-wz="stift"]');
  await zug(s, kreis(230, 325, 70), { halten: 650 });
  gleich('Umkreisen und halten wählt das Rechteck', await s.evaluate(`document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length`), 1);
  gleich('… die Auswahl führt', await s.evaluate(`Zeichenziel.jetzt()`), 'select');
  gleich('… und der Kreis wurde kein Strich', (await marken(s)).map(m => m.art), ['rectangle']);
  await s.click('.blatt-werk [data-wz="stift"]');
  await zug(s, kreis(430, 325, 50), { halten: 650 });
  gleich('Eine leere Schlinge mit Halten wird weiter ein Kreis (E355)', (await marken(s)).map(m => m.art), ['rectangle', 'ellipse']);
  await s.close();
}

console.log('\n§7 Eingebunden');
p('InkGeometry kennt `rotate`', /const rotate = \(mark: any, pivot: InkPoint, degrees: number\)/.test(lies('src/core/ink/geometry.ts')));
p('Das erzeugte JS auch', /rotate/.test(lies('quell/core/ink/geometry.js')) && /istKritzel/.test(lies('quell/bereiche/pdf/marken.js')));
p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
