/* Suite 456 — Die Kurve mit ihrem Griff (E483)
 * ============================================================================
 * L133 führte: „**Kurve** und **Verbinder** des Shape-Tools — beides
 * braucht Griffe an einer fertigen Marke (die Mitte der Kurve nachziehen;
 * ein Verbinder, der an zwei Formen hängt). Kommt nach dem Drehgriff aus
 * G2."
 *
 * Die Kurve steht jetzt. Sie ist die erste Form mit DREI Punkten: Anfang,
 * Ende und der Griff dazwischen, der sie biegt — und sie kommt ohne ein
 * neues Feld aus, weil `pts` eine Liste ist und `move`, `scale` und
 * `rotate` ohnehin ALLE Punkte anfassen (§53.3).
 *
 *   §1 GEZOGEN WIE EINE LINIE, und fertig hat sie drei Punkte — der
 *      dritte in der Mitte, also zunächst eine Gerade.
 *   §2 DER GRIFF BIEGT SIE: er steht auf dem Steuerpunkt, und ziehen
 *      verschiebt ihn.
 *   §3 AN EINER GEDREHTEN KURVE wird in IHREN Achsen gebogen.
 *   §4 SIE WANDERT, WÄCHST UND DREHT wie jede andere Marke — alle drei
 *      Punkte gehen mit.
 *   §5 GESPERRT lässt sie sich nicht biegen (E466).
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1, §2 → den dritten Punkt beim Absetzen nicht anhängen: kein Griff,
 *        nichts zu biegen. Gelaufen, rot.
 *   §3 → im Kurvenzug die Rückdrehung weglassen: eine gedrehte Kurve
 *        biegt sich in die falsche Richtung. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test456.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9576;
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

/* Die Geometrie läuft ohne Browser — §4 ist reine Rechnung. */
(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;

const browser = await chromium.launch();
const fehler: string[] = [];
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
    Store.setMeta('zeichnen:form', 'curve');
    const seite = Store.addPage(null, { text: 'Kurvenblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken });
    await Store.flush();
    App.oeffne(seite.id);
  }, marken);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};
const marken = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`) as string);
type ZugOpt = { ziel?: string; halten?: number };
const zug = (s: Page, punkte: number[][], opt: ZugOpt = {}) =>
  s.evaluate(async ({ punkte, opt }: { punkte: number[][]; opt: ZugOpt }) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = f.getScreenCTM()!;
    const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!; const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ: string, q: number[]) => { const c = px(q); return new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: c.x, clientY: c.y, pointerId: 7, pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pressure: 0.6 }); };
    const start = opt.ziel ? f.querySelector(opt.ziel) : f;
    if (!start) throw new Error('Ziel fehlt: ' + opt.ziel);
    start.dispatchEvent(ev('pointerdown', punkte[0]!));
    for (let i = 1; i < punkte.length; i++) f.dispatchEvent(ev('pointermove', punkte[i]!));
    if (opt.halten) await new Promise(r => setTimeout(r, opt.halten));
    f.dispatchEvent(ev('pointerup', punkte[punkte.length - 1]!));
    await new Promise(r => setTimeout(r, 350));
  }, { punkte, opt });
const strecke = (von: number[], bis: number[], n = 10): number[][] =>
  Array.from({ length: n + 1 }, (_v, i) => [von[0]! + (bis[0]! - von[0]!) * i / n, von[1]! + (bis[1]! - von[1]!) * i / n]);

/* ═══ §1 Gezogen wie eine Linie ════════════════════════════════════════════ */
console.log('\n§1 Gezogen wie eine Linie, fertig mit drei Punkten');
{
  const s = await mitBlatt([]);
  gleich('Die Kurve steht im Formwerkzeug',
    await s.evaluate(`Marken.FORMEN.map(f => f.id).join(',')`),
    'line,arrow,rectangle,ellipse,triangle,roundrect,curve');
  await s.click('.blatt-werk [data-wz="formen"]');
  await s.waitForTimeout(300);
  await zug(s, strecke([100, 300], [400, 300]));
  const m = (await marken(s))[0];
  gleich('Aus dem Zug wird eine Kurve', m?.art, 'curve');
  gleich('… mit drei Punkten', (m?.pts || []).length, 3);
  p('… und der dritte liegt in der Mitte — also zunächst eine Gerade',
    Math.abs(m.pts[2][0] - 250) < 3 && Math.abs(m.pts[2][1] - 300) < 3, JSON.stringify(m.pts));
  const d = String(await s.evaluate(`document.querySelector('.blatt-marken [data-sid]')?.getAttribute('d') || ''`));
  p('Der Knoten ist ein Q-Pfad', /^M[\d.\- ]+Q/.test(d), d);
  await s.close();
}

/* ═══ §2 Der Griff biegt sie ═══════════════════════════════════════════════ */
console.log('\n§2 Der Griff auf dem Steuerpunkt biegt sie');
{
  const s = await mitBlatt([{ id: 'k1', art: 'curve', farbe: '#2f7ed8', breite: 3,
    pts: [[100, 300], [400, 300], [250, 300]] }]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[250, 300], [250, 300]], { ziel: '[data-sid="k1"]' });
  const griffe = JSON.parse(await s.evaluate(`JSON.stringify(
    [...document.querySelectorAll('.blatt-marken [data-griff]')].map(g => g.getAttribute('data-griff')))`) as string);
  p('Am Rahmen steht ein Griff „kurve"', griffe.includes('kurve'), JSON.stringify(griffe));
  gleich('… genau einer', griffe.filter((g: string) => g === 'kurve').length, 1);
  await zug(s, strecke([250, 300], [250, 160]), { ziel: '.blatt-griff-feld[data-griff="kurve"]' });
  const m = (await marken(s))[0];
  p('Ziehen verschiebt den Steuerpunkt nach oben',
    Math.abs(m.pts[2][0] - 250) < 4 && Math.abs(m.pts[2][1] - 160) < 4, JSON.stringify(m.pts));
  gleich('… Anfang und Ende bleiben, wo sie waren', [m.pts[0], m.pts[1]], [[100, 300], [400, 300]]);
  const d = String(await s.evaluate(`document.querySelector('.blatt-marken [data-sid="k1"]')?.getAttribute('d') || ''`));
  p('… und der Pfad folgt', /Q250 160/.test(d.replace(/\s+/g, ' ')) || /Q250\s+160/.test(d), d);
  await s.click('.blatt-werk [data-act="undo"]');
  await s.waitForTimeout(250);
  gleich('Zurück holt die Gerade zurück', (await marken(s))[0]?.pts[2], [250, 300]);
  await s.close();
}

/* ═══ §3 An einer gedrehten Kurve ══════════════════════════════════════════ */
console.log('\n§3 Eine gedrehte Kurve biegt sich in IHREN Achsen');
{
  /* Um 90° gedreht: wer den Griff auf dem Blatt nach RECHTS zieht, biegt
     sie in ihren Achsen nach OBEN — der gespeicherte Punkt wandert also
     in y, nicht in x. */
  const s = await mitBlatt([{ id: 'k1', art: 'curve', farbe: '#2f7ed8', breite: 3, dreh: 90,
    pts: [[200, 300], [400, 300], [300, 300]] }]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[300, 300], [300, 300]], { ziel: '[data-sid="k1"]' });
  const vorher = (await marken(s))[0].pts[2];
  /* Der Griff steht auf dem Blatt dort, wo die Drehung ihn hinlegt. */
  const wo = JSON.parse(await s.evaluate(`(() => {
    const g = document.querySelector('.blatt-marken .blatt-griff-feld[data-griff="kurve"]');
    return JSON.stringify(g ? { cx: Number(g.getAttribute('cx')), cy: Number(g.getAttribute('cy')) } : null);
  })()`) as string);
  p('Der Griff steht auf dem Steuerpunkt (in der gedrehten Gruppe)',
    !!wo && Math.abs(wo.cx - 300) < 2 && Math.abs(wo.cy - 300) < 2, JSON.stringify(wo));
  /* Auf dem BLATT 80 Punkte nach oben ziehen. Bei 90° Drehung heisst das
     in den Achsen der Marke: 80 nach links. */
  await zug(s, strecke([300, 300], [300, 220]), { ziel: '.blatt-griff-feld[data-griff="kurve"]' });
  const m = (await marken(s))[0];
  p('Der gespeicherte Steuerpunkt wandert in x, nicht in y — die Marke steht quer',
    Math.abs(m.pts[2][1] - 300) < 5 && Math.abs(m.pts[2][0] - 220) < 6,
    JSON.stringify({ vorher, nachher: m.pts[2] }));
  p('… ihr Winkel bleibt', m.dreh === 90, JSON.stringify({ dreh: m.dreh }));
  await s.close();
}

/* ═══ §4 Sie wandert, wächst und dreht ═════════════════════════════════════ */
console.log('\n§4 Alle drei Punkte gehen mit');
{
  const kurve = () => ({ art: 'curve', farbe: '#111', breite: 3, pts: [[100, 300], [400, 300], [250, 200]] });
  const g1 = G.move(kurve(), 50, -20);
  gleich('Schieben nimmt alle drei mit', g1.pts, [[150, 280], [450, 280], [300, 180]]);
  const g2 = G.scale(kurve(), [100, 300], 2, 2);
  gleich('Strecken auch', g2.pts, [[100, 300], [700, 300], [400, 100]]);
  const g3 = G.rotate(kurve(), [250, 250], 90);
  p('Drehen merkt sich den Winkel und lässt die Punkte, wo sie sind (E466)',
    g3.dreh === 90 && JSON.stringify(g3.pts) === JSON.stringify(kurve().pts),
    JSON.stringify({ dreh: g3.dreh, pts: g3.pts }));
  const b = G.boundsLokal(kurve());
  p('Ihr Kasten umschliesst auch den Steuerpunkt — sicher, wenn auch etwas weit',
    Math.round(b.y) <= 198 && Math.round(b.y + b.height) >= 302, JSON.stringify(b));
}

/* ═══ §5 Gesperrt ══════════════════════════════════════════════════════════ */
console.log('\n§5 Gesperrt lässt sie sich nicht biegen');
{
  const s = await mitBlatt([{ id: 'k1', art: 'curve', farbe: '#2f7ed8', breite: 3, gesperrt: true,
    pts: [[100, 300], [400, 300], [250, 300]] }]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[250, 300], [250, 300]], { ziel: '[data-sid="k1"]' });
  await zug(s, strecke([250, 300], [250, 160]), { ziel: '.blatt-griff-feld[data-griff="kurve"]' });
  gleich('Der Steuerpunkt bleibt liegen', (await marken(s))[0]?.pts[2], [250, 300]);
  await s.close();
}

console.log('\n§6 Quellen');
p('Die Kurve steht in den Formen und wird als Q-Pfad gezeichnet',
  /id: 'curve', name: 'Kurve'/.test(lies('src/bereiche/pdf/marken.ts'))
  && /art === 'curve' && points\.length >= 2/.test(lies('src/bereiche/pdf/marken.ts')));
p('Der Griff und sein Zug stehen da',
  /'data-griff': 'kurve'/.test(lies('src/bereiche/pdf/marken.ts'))
  && /selectDrag\.mode === 'kurve'/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das Stilblatt kennt den Kurvengriff', /\.blatt-griff-kurve\{/.test(lies('quell/schale/stil/bausteine.css')));
p('Das erzeugte JS trägt es', /'kurve'/.test(lies('quell/bereiche/pdf/marken.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
