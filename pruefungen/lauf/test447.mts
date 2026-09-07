/* Suite 447 — Das Gedrehte ist wirklich gedreht (E474)
 * ============================================================================
 * DER FUND. Seit E466 kann eine Marke schief stehen: `dreh` merkt sich den
 * Winkel, ihre zwei Eckpunkte bleiben aufrecht, und der Knoten bekommt ein
 * `rotate(...)`. Das war für das ZEICHNEN richtig — für alles, was danach
 * kommt, war es unvollständig. Drei Stellen rechneten weiter mit dem
 * aufrechten Kasten, als stünde die Marke gerade:
 *
 *   1. `InkGeometry.scale` legte die Faktoren des Blattes auf die
 *      Punkte der Marke. Bei einer um 45° gedrehten Marke heisst das:
 *      der Mensch zieht nach rechts, die Marke wächst schräg — und die
 *      Ecke, die er hält, läuft unter dem Finger weg.
 *   2. `touchesCircle` mass den AUFRECHTEN Kasten um die gedrehte Marke.
 *      Bei 45° ist der fast doppelt so gross wie sie: der Radierer nahm
 *      sie neben ihrer Kante mit, wo nichts steht.
 *   3. Der Auswahlrahmen war derselbe zu grosse Kasten — ein Rahmen, der
 *      weit um eine Marke liegt, sagt etwas Falsches darüber, was gewählt
 *      ist.
 *
 *   §1 DIE RECHNUNG: gegen eine zweite, absichtlich dumme, über tausend
 *      zufällige Fälle — und ohne Drehung Zahl für Zahl wie vorher.
 *   §2 DER RADIERER trifft, wo die Marke ist, nicht wo ihr Kasten ist.
 *   §3 IM BROWSER: der Rahmen steht schief, und der Griff, den man hält,
 *      bleibt auf dem Punkt stehen, an dem er war.
 *   §4 DER KASTENZUG fängt nicht ein, was in der leeren Ecke seines
 *      Kastens gar nicht steht.
 *   §5 EINGEBUNDEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `scale` den Zweig `if (grad || ax)` auslassen: die alte
 *        Rechnung, und §1.2/§1.3 fallen. Gelaufen, rot.
 *   §2 → in `touchesCircle` `drehung(mark)` durch `0` ersetzen: der
 *        aufrechte Kasten ist zurück, §2 fällt. Gelaufen, rot.
 *   §3 → in `auswahlAchse` immer `0` zurückgeben: der Rahmen steht wieder
 *        gerade und der Griff läuft weg. Gelaufen, rot.
 *   §4 → im Kastenzug den `overlapConvex`-Zweig auslassen: der Zug in der
 *        leeren Ecke fängt die Marke wieder ein. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test447.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9567;
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

/* Die Geometrie läuft ohne Browser — sie kennt weder DOM noch Store. */
(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;

/* Ein billiger, wiederholbarer Zufall — `Math.random()` gäbe bei jedem
   Lauf andere Fälle, und ein Prüflauf, der mal rot und mal grün ist,
   sagt nichts. */
let saat = 20260907;
const wuerfel = (): number => {
  saat = (saat * 1103515245 + 12345) % 2147483648;
  return saat / 2147483648;
};
const zw = (a: number, b: number): number => a + wuerfel() * (b - a);

/* DIE ECKEN DER PUNKTE, ohne den Tintenrand.
 *
 * `InkGeometry.boundsLokal` legt um die Punkte einen Rand von
 * `max(2, breite/2)` — so weit steht die Tinte über den Weg hinaus. Der
 * Rand ist eine feste Zugabe und waechst NICHT mit der Streckung mit
 * (`breite` waechst mit dem Mittel, und unter 4 wird der Rand ohnehin auf
 * 2 gehalten). Wer also den Rahmen misst, misst Punkte + Rand und findet
 * bei starker Streckung ein paar Einheiten Abweichung — die gab es vor
 * E474 genauso, und sie ist der Grund, warum hier die PUNKTE gemessen
 * werden und nicht der Rahmen. Was E474 geradezieht, ist die Richtung, in
 * die eine gedrehte Marke waechst, nicht der Tintenrand. */
const punktEcken = (mark: any): number[][] => {
  const pts = mark.pts as number[][];
  const xs = pts.map(q => q[0]!), ys = pts.map(q => q[1]!);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
  const roh = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const grad = Number(mark.dreh) || 0;
  return grad ? G.drehePunkte(roh, [(x0 + x1) / 2, (y0 + y1) / 2], grad) : roh;
};
const punktMasse = (mark: any): number[] => {
  const pts = mark.pts as number[][];
  const xs = pts.map(q => q[0]!), ys = pts.map(q => q[1]!);
  return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
};

/* ═══ §1 Die Rechnung ══════════════════════════════════════════════════════ */
console.log('\n§1 Die Rechnung');
{
  /* 1.1 OHNE DREHUNG ÄNDERT SICH NICHTS. Die alte Formel Zahl für Zahl —
     wäre sie auch nur um ein Hundertstel anders, hätte E474 jede
     vorhandene Marke beim nächsten Ziehen verschoben. */
  const alt = (mark: any, anker: number[], sx: number, sy: number): any => {
    const r2 = (v: number): number => Math.round(v * 100) / 100;
    const f = (q: number[]): number[] =>
      [r2(anker[0]! + (q[0]! - anker[0]!) * sx), r2(anker[1]! + (q[1]! - anker[1]!) * sy)];
    const kopie = JSON.parse(JSON.stringify(mark));
    kopie.pts = (kopie.pts as number[][]).map(f);
    const mittel = Math.sqrt(Math.abs(sx * sy)) || 1;
    kopie.breite = Math.max(0.3, r2(Number(kopie.breite) * mittel));
    return kopie;
  };
  let gleichAlt = 0, faelle = 0;
  for (let i = 0; i < 400; i++) {
    const mark = { art: 'rectangle', farbe: '#123456', breite: zw(0.5, 8),
      pts: [[zw(-200, 400), zw(-200, 400)], [zw(-200, 400), zw(-200, 400)]] };
    const anker = [zw(-100, 500), zw(-100, 500)];
    const sx = zw(0.2, 4), sy = zw(0.2, 4);
    const neu = G.scale(JSON.parse(JSON.stringify(mark)), anker, sx, sy);
    const soll = alt(mark, anker, sx, sy);
    faelle++;
    if (JSON.stringify(neu.pts) === JSON.stringify(soll.pts) && neu.breite === soll.breite) gleichAlt++;
  }
  gleich('Ohne Drehung rechnet `scale` Zahl für Zahl wie vorher', gleichAlt, faelle);

  /* 1.2 MIT DER EIGENEN ACHSE IST ES EXAKT. Der gehaltene Griff bleibt
     stehen, die Marke wächst genau um die Faktoren, und ihr Winkel
     bleibt ihr Winkel. Das ist der Fall „eine gedrehte Marke gewählt". */
  let steht = 0, waechst = 0, winkel = 0;
  const ANZ = 600;
  for (let i = 0; i < ANZ; i++) {
    const dreh = Math.round(zw(-180, 180) * 100) / 100;
    const x0 = zw(-100, 300), y0 = zw(-100, 300);
    const mark: any = { art: 'rectangle', farbe: '#123456', breite: 2.4, dreh,
      pts: [[x0, y0], [x0 + zw(20, 300), y0 + zw(20, 300)]] };
    /* Der Anker ist eine ECKE DER GEDREHTEN MARKE — dort, wo der Griff
       sitzt, seit `auswahlKasten` die Achsen der Marke kennt. */
    const ecken = punktEcken(mark);
    const anker = ecken[0]!;             // nw
    const gehalten = ecken[2]!;          // se — der Griff, an dem gezogen wird
    const sx = zw(0.3, 3), sy = zw(0.3, 3);
    const vorher = punktMasse(mark);
    const nachher = G.scale(JSON.parse(JSON.stringify(mark)), anker, sx, sy, dreh);
    const ecken2 = punktEcken(nachher);
    const bl = punktMasse(nachher);
    if (Math.hypot(ecken2[0]![0]! - anker[0]!, ecken2[0]![1]! - anker[1]!) < 0.06) steht++;
    if (Math.abs(bl[0]! - vorher[0]! * sx) < 0.06 && Math.abs(bl[1]! - vorher[1]! * sy) < 0.06) waechst++;
    if (nachher.dreh === dreh) winkel++;
    /* Und der gehaltene Griff geht genau dorthin, wo die Streckung ihn
       hinlegt: vom Anker aus in den Achsen der Marke gestreckt. */
    if (i === 0) {
      const inAchse = G.drehePunkte([gehalten], anker, -dreh)[0]!;
      const soll = G.drehePunkte([[anker[0]! + (inAchse[0]! - anker[0]!) * sx,
        anker[1]! + (inAchse[1]! - anker[1]!) * sy]], anker, dreh)[0]!;
      p('Der gehaltene Griff landet genau unter dem Zeiger',
        Math.hypot(ecken2[2]![0]! - soll[0]!, ecken2[2]![1]! - soll[1]!) < 0.06,
        JSON.stringify({ ist: ecken2[2], soll }));
    }
  }
  gleich('Die gehaltene Ecke bleibt bei allen Winkeln auf dem Punkt stehen', steht, ANZ);
  gleich('… die Marke wächst genau um die Faktoren', waechst, ANZ);
  gleich('… und ihr Winkel bleibt ihr Winkel', winkel, ANZ);

  /* 1.3 IN DER GRUPPE, RECHTWINKLIG: eine um 90° gedrehte Marke in einer
     aufrechten Auswahl. Breiter ziehen muss sie SICHTBAR breiter machen —
     also ihre lokale HÖHE strecken, weil sie auf der Seite liegt. */
  {
    const mark: any = { art: 'rectangle', farbe: '#123456', breite: 2.4, dreh: 90,
      pts: [[0, 0], [100, 40]] };
    const neu = G.scale(JSON.parse(JSON.stringify(mark)), [0, 0], 2, 1);
    /* Sichtbar: das Rechteck liegt auf der Seite, seine Breite auf dem
       Blatt ist seine lokale HÖHE. Vorher 40 breit und 100 hoch. */
    const sicht = (m: any): number[] => {
      const e = punktEcken(m);
      const xs = e.map(q => q[0]!), ys = e.map(q => q[1]!);
      return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    };
    const vorher = sicht(mark), nachher = sicht(neu);
    p('Um 90° gedreht und breiter gezogen: sie wird sichtbar doppelt so breit',
      Math.abs(nachher[0]! - vorher[0]! * 2) < 0.1 && Math.abs(nachher[1]! - vorher[1]!) < 0.1,
      JSON.stringify({ vorher, nachher }));
    gleich('… und zwar über ihre lokale Höhe, nicht ihre Breite',
      punktMasse(neu).map(v => Math.round(v)), [100, 80]);
  }

  /* 1.4 EINE GLEICHMÄSSIGE STRECKUNG IST IN JEDER LAGE GENAU — auch
     mitten in einer Gruppe, wo die Achse nicht die der Marke ist. */
  let genau = 0;
  for (let i = 0; i < 200; i++) {
    const dreh = Math.round(zw(-180, 180) * 100) / 100;
    const mark: any = { art: 'ellipse', farbe: '#123456', breite: 2.4, dreh,
      pts: [[zw(0, 200), zw(0, 200)], [zw(220, 400), zw(220, 400)]] };
    const s = zw(0.4, 2.5);
    const vorher = punktMasse(mark);
    const neu = G.scale(JSON.parse(JSON.stringify(mark)), [17, 23], s, s);
    const nachher = punktMasse(neu);
    if (Math.abs(nachher[0]! - vorher[0]! * s) < 0.08 && Math.abs(nachher[1]! - vorher[1]! * s) < 0.08) genau++;
  }
  gleich('Eine gleichmässige Streckung bleibt in jeder Lage genau', genau, 200);

  /* 1.5 EIN LINIENZUG HAT KEINE DREHUNG (E466) — er dreht seine Punkte.
     `achse` darf ihn deshalb nicht anders behandeln als vorher. */
  {
    const strich = { art: 'stift', farbe: '#111', breite: 2, pts: [[10, 10], [50, 30], [90, 10]] };
    const a = G.scale(JSON.parse(JSON.stringify(strich)), [0, 0], 2, 2);
    const b = G.scale(JSON.parse(JSON.stringify(strich)), [0, 0], 2, 2, 37);
    gleich('Ein Stiftstrich streckt sich gleichmässig, ob mit Achse oder ohne',
      JSON.stringify(a.pts), JSON.stringify(b.pts));
  }
}

/* ═══ §2 Der Radierer ══════════════════════════════════════════════════════ */
console.log('\n§2 Der Radierer trifft, wo die Marke ist');
{
  /* Die zweite, dumme Rechnung: der Abstand des Kreismittelpunkts zum
     Vieleck der vier gedrehten Ecken. Sie ist die Wahrheit, gegen die
     gemessen wird — nicht der alte Code, sondern die Bedeutung. */
  const aufStrecke = (q: number[], a: number[], b: number[]): number => {
    const dx = b[0]! - a[0]!, dy = b[1]! - a[1]!;
    if (!dx && !dy) return Math.hypot(q[0]! - a[0]!, q[1]! - a[1]!);
    const t = Math.max(0, Math.min(1, ((q[0]! - a[0]!) * dx + (q[1]! - a[1]!) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(q[0]! - (a[0]! + t * dx), q[1]! - (a[1]! + t * dy));
  };
  const naiv = (mark: any, mitte: number[], r: number): boolean => {
    const e = G.ecken(mark) as number[][];
    if (G.insidePolygon(mitte, e)) return true;
    for (let i = 0; i < e.length; i++)
      if (aufStrecke(mitte, e[i]!, e[(i + 1) % e.length]!) <= r) return true;
    return false;
  };
  let gleichNaiv = 0, faelle = 0, trafen = 0;
  for (let i = 0; i < 3000; i++) {
    const dreh = Math.round(zw(-180, 180) * 100) / 100;
    const mark: any = { art: 'rectangle', farbe: '#123456', breite: 2.4, dreh,
      pts: [[100, 200], [100 + zw(30, 260), 200 + zw(10, 60)]] };
    /* Im aufrechten Kasten der gedrehten Marke würfeln, ein wenig darüber
       hinaus: genau der Bereich, in dem die alte Rechnung ja sagte und
       die Marke doch nicht da war. */
    const k = G.bounds(mark);
    const mitte = [zw(k.x - 10, k.x + k.width + 10), zw(k.y - 10, k.y + k.height + 10)];
    const r = zw(2, 24);
    const ist = G.touchesCircle(mark, mitte, r);
    const soll = naiv(mark, mitte, r);
    faelle++;
    if (ist === soll) gleichNaiv++;
    if (soll) trafen++;
  }
  p('Es gab überhaupt Treffer zu prüfen — und genug Nicht-Treffer',
    trafen > 500 && trafen < 2500, `${trafen} von ${faelle}`);
  gleich('Der Radierer antwortet an 3000 zufälligen Stellen wie die genaue Rechnung', gleichNaiv, faelle);

  /* Und der Fall, um den es geht, benannt: ein langes Rechteck auf 45°.
     Die Ecke seines AUFRECHTEN Kastens liegt weit neben der Marke. */
  {
    const mark: any = { art: 'rectangle', farbe: '#123456', breite: 2.4, dreh: 45,
      pts: [[100, 290], [400, 310]] };
    const kasten = G.bounds(mark);
    /* Die Ecke OBEN RECHTS: das Rechteck läuft von links oben nach rechts
       unten, dort steht also nichts. (Oben LINKS läge die kurze Kante der
       Marke — der Kasten ist dort schmal, nicht leer.) */
    const leer = [kasten.x + kasten.width - 6, kasten.y + 6];
    p('Die Ecke des aufrechten Kastens liegt 150 Punkte neben der Marke',
      !G.touchesCircle(mark, leer, 5), JSON.stringify({ kasten, leer }));
    p('… ihre Mitte trifft sie', G.touchesCircle(mark, [250, 300], 5));
    const e = G.ecken(mark) as number[][];
    p('… und ihre eigene Ecke auch', G.touchesCircle(mark, e[1]!, 4), JSON.stringify(e[1]));
  }
}

/* ═══ §3 Im Browser ════════════════════════════════════════════════════════ */
console.log('\n§3 Der Rahmen steht schief, der Griff bleibt stehen');
const browser = await chromium.launch();
const fehler: string[] = [];
type Zug = { art?: string; ziel?: string; halten?: number; shift?: boolean };
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
const marken = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`) as string);
const mitBlatt = async (liste: unknown[]): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Zeichenziel !== 'undefined'");
  await s.evaluate(async (liste: unknown[]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Probeblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: liste });
    await Store.flush();
    App.oeffne(seite.id);
  }, liste);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

{
  const s = await mitBlatt([
    { id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, dreh: 30, pts: [[160, 250], [420, 360]] }
  ]);
  await s.click('.blatt-werk [data-wz="select"]');
  await zug(s, [[290, 305], [290, 305]], { ziel: '[data-sid="r1"]' });
  const rahmen = JSON.parse(await s.evaluate(`(() => {
    const g = document.querySelector('.blatt-marken g[data-ink-ui="selection"]');
    const r = document.querySelector('.blatt-marken .blatt-auswahlrahmen');
    const griffe = document.querySelector('.blatt-marken [data-ink-ui="griffe"]');
    return JSON.stringify({
      dreht: g ? String(g.getAttribute('transform')) : null,
      breite: r ? Number(r.getAttribute('width')) : null,
      griffeDrehen: griffe ? String(griffe.getAttribute('transform') || '') : null });
  })()`) as string);
  p('Der Rahmen steht in einer gedrehten Gruppe', /^rotate\(30 /.test(String(rahmen.dreht)), JSON.stringify(rahmen));
  /* 260 Punkte breit, 2 Tintenrand je Seite, 3 Rahmenluft je Seite. */
  p('… er ist so breit wie die Marke selbst (270), nicht wie ihr aufrechter Kasten (~340)',
    Math.abs(Number(rahmen.breite) - 270) < 1, JSON.stringify(rahmen));
  p('… und die Griffe drehen mit', /^rotate\(30 /.test(String(rahmen.griffeDrehen)), JSON.stringify(rahmen));

  /* Die vier Ecken der Marke im Blattraum — und der Griff se darauf. */
  const EK = `(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const m = b.marken[0];
    const xs = m.pts.map(q => q[0]), ys = m.pts.map(q => q[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    const roh = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    return JSON.stringify(m.dreh ? InkGeometry.drehePunkte(roh, [(x0 + x1) / 2, (y0 + y1) / 2], m.dreh) : roh);
  })()`;
  const ecken0 = JSON.parse(await s.evaluate(EK) as string) as number[][];
  const se = ecken0[2]!;
  /* DER PUNKT, AUF DEM DER FINGER AUFSETZT, ist die gegenüberliegende Ecke
     des RAHMENS — nicht die der Marke: zwischen beiden liegt der
     Tintenrand und die Rahmenluft (5 Einheiten), die sich nicht mitstrecken.
     Genau dieser Punkt muss stehenbleiben, und genau er wird hier
     gemessen. Die Ecke der Marke selbst wandert um bis zu 5·|s−1| — das
     tat sie vor E474 an einer geraden Marke ebenso. */
  const rahmen0 = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.blatt-marken .blatt-auswahlkasten');
    return JSON.stringify({ x: Number(k.getAttribute('x')), y: Number(k.getAttribute('y')),
      w: Number(k.getAttribute('width')), h: Number(k.getAttribute('height')) });
  })()`) as string);
  const kMitte: number[] = [rahmen0.x + rahmen0.w / 2, rahmen0.y + rahmen0.h / 2];
  const anker = G.drehePunkte([[rahmen0.x, rahmen0.y]], kMitte, 30)[0]! as number[];
  const vorherPts = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify(b.marken[0].pts);
  })()`) as string) as number[][];
  /* Am se-Griff ziehen — schräg über das Blatt, quer zur Achse der Marke. */
  await zug(s, strecke(se, [se[0]! + 90, se[1]! + 40]), { ziel: '.blatt-griff-feld[data-griff="se"]' });
  const danach = await marken(s);
  const m = danach[0];
  p('Die Marke behält ihren Winkel', m?.dreh === 30, JSON.stringify({ dreh: m?.dreh }));
  const ecken1 = JSON.parse(await s.evaluate(EK) as string) as number[][];
  /* Die Abbildung, die das Ziehen auf dem Blatt bewirkt hat: die Marke
     dreht sich nicht, ihre Mitte geht von c nach c', und in ihren eigenen
     Achsen wächst sie um (sx, sy). Trifft diese Abbildung den Anker auf
     sich selbst, ist der gehaltene Griff stehengeblieben. */
  const kastenVon = (pts: number[][]): number[] => {
    const xs = pts.map(q => q[0]!), ys = pts.map(q => q[1]!);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };
  const nachherPts = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify(b.marken[0].pts);
  })()`) as string) as number[][];
  const kv = kastenVon(vorherPts), kn = kastenVon(nachherPts);
  const c: number[] = [kv[0]! + kv[2]! / 2, kv[1]! + kv[3]! / 2];
  const cN: number[] = [kn[0]! + kn[2]! / 2, kn[1]! + kn[3]! / 2];
  const sX = kn[2]! / kv[2]!, sY = kn[3]! / kv[3]!;
  const lokal = G.drehePunkte([anker], c, -30)[0]! as number[];
  const bild = G.drehePunkte([[c[0]! + (lokal[0]! - c[0]!) * sX, c[1]! + (lokal[1]! - c[1]!) * sY]], c, 30)[0]! as number[];
  const ziel: number[] = [bild[0]! + (cN[0]! - c[0]!), bild[1]! + (cN[1]! - c[1]!)];
  p('Der gehaltene Punkt — die gegenüberliegende Ecke des Rahmens — bleibt stehen',
    Math.hypot(ziel[0]! - anker[0]!, ziel[1]! - anker[1]!) < 0.5,
    JSON.stringify({ anker, ziel, sX: Math.round(sX * 1000) / 1000, sY: Math.round(sY * 1000) / 1000 }));
  p('… und die Marke ist wirklich gewachsen, nicht nur verschoben',
    sX > 1.05 || sY > 1.05, JSON.stringify({ sX, sY }));
  p('… ihre eigene Ecke wandert nur um den Tintenrand (unter 5)',
    Math.hypot(ecken1[0]![0]! - ecken0[0]![0]!, ecken1[0]![1]! - ecken0[0]![1]!) < 5,
    JSON.stringify({ vorher: ecken0[0], nachher: ecken1[0] }));
  p('… und die gezogene Ecke ist dorthin gegangen, wo gezogen wurde',
    Math.hypot(ecken1[2]![0]! - (se[0]! + 90), ecken1[2]![1]! - (se[1]! + 40)) < 1.6,
    JSON.stringify({ ziel: [se[0]! + 90, se[1]! + 40], nachher: ecken1[2] }));
  await s.close();
}

/* Und der Radierer im Browser, an der Stelle, an der er vorher zu viel nahm. */
{
  const s = await mitBlatt([
    { id: 'r1', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, dreh: 45, pts: [[150, 390], [450, 410]] }
  ]);
  const kasten = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify(InkGeometry.bounds(b.marken[0]));
  })()`) as string);
  await s.click('.blatt-werk [data-wz="radierer"]');
  const ecke = [kasten.x + kasten.width - 10, kasten.y + 10];
  await zug(s, strecke(ecke, [ecke[0]! - 12, ecke[1]! + 12], 4));
  gleich('Ein Radierzug an der Ecke des aufrechten Kastens lässt die Marke stehen',
    (await marken(s)).length, 1);
  await zug(s, strecke([280, 390], [320, 430], 6));
  gleich('… ein Zug über die Marke selbst nimmt sie', (await marken(s)).length, 0);
  await s.close();
}

/* ═══ §4 Der Kastenzug ═════════════════════════════════════════════════════ */
console.log('\n§4 Der Kastenzug fängt nicht ein, was daneben steht');
{
  /* Zwei Marken, beide um 45° gedreht, weit auseinander — aber ihre
     aufrechten Kästen überlappen sich in den leeren Ecken. Ein Zug in
     der leeren Ecke der einen darf die andere nicht mitnehmen. */
  const s = await mitBlatt([
    { id: 'a', art: 'rectangle', farbe: '#2f7ed8', breite: 2.4, dreh: 45, pts: [[120, 190], [420, 210]] },
    { id: 'b', art: 'rectangle', farbe: '#d64545', breite: 2.4, dreh: 0, pts: [[470, 480], [530, 520]] }
  ]);
  await s.click('.blatt-werk [data-wz="select"]');
  const k = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify(InkGeometry.bounds(b.marken[0]));
  })()`) as string);
  /* Ein kleiner Zug in der leeren Ecke oben rechts des aufrechten Kastens. */
  await zug(s, strecke([k.x + k.width - 40, k.y + 6], [k.x + k.width - 6, k.y + 40], 6));
  gleich('Ein Zug in der leeren Ecke des aufrechten Kastens wählt nichts',
    await s.evaluate(`document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length`), 0);
  /* Und quer über die Marke selbst: sie wird gewählt. Der Zug beginnt
     oberhalb ihres Bandes (die Marke läuft auf der Geraden y = x − 70)
     und endet darunter. */
  await zug(s, strecke([300, 180], [360, 250], 6));
  gleich('… ein Zug über die Marke wählt sie', await s.evaluate(`(() => {
    const r = document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen');
    return r.length;
  })()`), 1);
  await s.close();
}

console.log('\n§5 Eingebunden');
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');
p('InkGeometry gibt `ecken`, `drehung`, `drehePunkte`, `boundsLokal` und den Trennachsen-Test heraus',
  /boundsLokal: boundsRoh, ecken, drehung, drehePunkte, overlapConvex, kastenEcken/.test(lies('src/core/ink/geometry.ts')));
p('`scale` nimmt die Achse entgegen',
  /const scale = \(mark: any, anchor: InkPoint, sx: number, sy: number, achse = 0\)/.test(lies('src/core/ink/geometry.ts')));
p('`marken.ts` gibt sie mit', /InkGeometry\.scale\(clone\(original\), \[ax, ay\], sx, sy, achse\)/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das erzeugte JS trägt es', /drehePunkte/.test(lies('quell/core/ink/geometry.js')) && /auswahlAchse/.test(lies('quell/bereiche/pdf/marken.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
