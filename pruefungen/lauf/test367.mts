/* Suite 367 — Erst der Kasten, dann der Weg (E377)
 * ============================================================================
 * BEFUND, GEMESSEN NACH E376:
 *
 *   Der Radierer fragt jeden Strich der Seite, ob der Radierkreis ihn
 *   berührt — und `touchesCircle` ging bei einem Stiftstrich SOFORT in
 *   `distanceToPolyline`: jeder Punkt, jede Wurzel, dazu eine frisch
 *   gebaute Punktliste. Auch für einen Strich am anderen Ende der Seite.
 *
 *   Gemessen bei 400 Strichen und einem schnellen Radierzug (120 px
 *   zwischen zwei Zeigerereignissen, also 30 Teilschritte):
 *
 *       8,27 ms je Ereignis  —  ein GANZES Bild bei 120 Hz.
 *
 * Ein Kreis kann eine Linie nur berühren, wenn er ihren KASTEN berührt.
 * Der Kasten wird jetzt in EINEM Durchlauf gerechnet, ohne eine Liste zu
 * bauen, und um `radius + halfWidth` geweitet.
 *
 * DER GEFÄHRLICHE TEIL IST NICHT DIE GESCHWINDIGKEIT, SONDERN DIE ANTWORT.
 * Ein Vorfilter, der einen Treffer verschluckt, macht einen Strich
 * unradierbar — und man merkt es erst, wenn man ihn wegwischen will und er
 * bleibt. Deshalb steht hier eine ZWEITE, absichtlich dumme Rechnung des
 * gleichen Ergebnisses, und beide werden über zehntausend zufällige Fälle
 * verglichen.
 *
 * §1 GLEICHE ANTWORT wie die naive Rechnung, zehntausendmal.
 * §2 DIE GRENZFÄLLE, an denen ein Kasten üblicherweise schummelt.
 * §3 UND SIE IST WIRKLICH SCHNELLER — gemessen, nicht behauptet.
 *
 *   node pruefungen/lauf/test367.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;

/* ---------------------------------------------------------------------------
 * DIE ZWEITE RECHNUNG. Absichtlich dumm: kein Kasten, kein Vorfilter, nur
 * der Abstand zu jedem Stück des Weges. Sie ist die Wahrheit, gegen die
 * gemessen wird — nicht der alte Code, den es nicht mehr gibt, sondern die
 * Bedeutung, die er hatte.
 * ------------------------------------------------------------------------ */
const LINIEN_ARTEN = new Set(['stift', 'marker', 'line', 'arrow']);
const zahl = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const naiv = (mark: any, mitte: number[], radius: number, halb = 0): boolean => {
  const reichweite = radius + Math.max(0, zahl(halb));
  if (LINIEN_ARTEN.has(String(mark?.art || '')) && Array.isArray(mark?.pts) && mark.pts.length) {
    const pts = (mark.pts as unknown[])
      .filter((q: any) => Array.isArray(q) && q.length >= 2)
      .map((q: any) => [zahl(q[0]), zahl(q[1])]);
    if (!pts.length) return false;
    if (pts.length === 1)
      return Math.hypot(mitte[0]! - pts[0]![0]!, mitte[1]! - pts[0]![1]!) <= reichweite;
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!, b = pts[i]!;
      const dx = b[0]! - a[0]!, dy = b[1]! - a[1]!;
      let t = (dx || dy) ? ((mitte[0]! - a[0]!) * dx + (mitte[1]! - a[1]!) * dy) / (dx * dx + dy * dy) : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(mitte[0]! - (a[0]! + dx * t), mitte[1]! - (a[1]! + dy * t)));
    }
    return best <= reichweite;
  }
  const box = G.bounds(mark);
  if (!box.x && !box.y && !box.width && !box.height) return false;
  const dx = Math.max(box.x - mitte[0]!, 0, mitte[0]! - (box.x + box.width));
  const dy = Math.max(box.y - mitte[1]!, 0, mitte[1]! - (box.y + box.height));
  return dx * dx + dy * dy <= radius * radius;
};

console.log('\n1 · Gleiche Antwort wie die naive Rechnung, zehntausendmal');

let saat = 20260903;
const z = (): number => { saat = (saat * 1103515245 + 12345) & 0x7fffffff; return saat / 0x7fffffff; };
const ARTEN = ['stift', 'marker', 'line', 'arrow', 'rectangle', 'ellipse', 'zettel'];

let anders = 0, jaNeu = 0, jaNaiv = 0, erstes = '';
for (let lauf = 0; lauf < 10000; lauf++) {
  const art = ARTEN[Math.floor(z() * ARTEN.length)]!;
  const n = 1 + Math.floor(z() * 14);
  const pts: number[][] = [];
  let x = z() * 300, y = z() * 300;
  for (let i = 0; i < n; i++) { x += (z() - 0.5) * 40; y += (z() - 0.5) * 40; pts.push([x, y]); }
  const mark = { id: 'm', art, breite: 0.5 + z() * 5, pts, pressure: pts.map(() => 0.5) };
  /* Die Mitte liegt absichtlich OFT knapp daneben — dort entscheidet sich,
     ob ein Kasten schummelt. */
  const nah = z() < 0.7;
  const mitte = nah
    ? [(pts[Math.floor(z() * pts.length)]![0] ?? 0) + (z() - 0.5) * 30,
       (pts[Math.floor(z() * pts.length)]![1] ?? 0) + (z() - 0.5) * 30]
    : [z() * 400 - 50, z() * 400 - 50];
  const radius = 0.5 + z() * 20;
  const halb = z() < 0.5 ? 0 : z() * 4;
  const a = G.touchesCircle(mark, mitte, radius, halb);
  const b = naiv(mark, mitte, radius, halb);
  if (a) jaNeu++;
  if (b) jaNaiv++;
  if (a !== b) {
    anders++;
    if (!erstes) erstes = `${art}, n=${n}, r=${radius.toFixed(2)}, halb=${halb.toFixed(2)}: neu=${a} naiv=${b}`;
  }
}
p('10 000 zufällige Fälle: dieselbe Antwort', anders === 0, erstes);
/* EINE PRÜFUNG, DIE IMMER „JA" ODER IMMER „NEIN" MISST, PRÜFT NICHTS (§55.2).
   Beide Antworten müssen wirklich vorkommen. */
console.log(`     davon Treffer: ${jaNeu} (naiv ${jaNaiv})`);
p('… und beide Antworten kommen wirklich vor',
  jaNeu > 500 && jaNeu < 9500, `${jaNeu} von 10 000`);

console.log('\n2 · Die Grenzfälle, an denen ein Kasten üblicherweise schummelt');

const strich = { id: 's', art: 'stift', breite: 2, pts: [[0, 0], [100, 0]], pressure: [0.5, 0.5] };
p('Genau auf dem Strich', G.touchesCircle(strich, [50, 0], 1, 0));
p('Knapp innerhalb des Radius', G.touchesCircle(strich, [50, 4.9], 5, 0));
p('Knapp ausserhalb des Radius', !G.touchesCircle(strich, [50, 5.1], 5, 0));
/* Der Fall, den ein NICHT geweiteter Kasten verschluckt: der Kreis liegt
   ganz ausserhalb des Kastens und trifft trotzdem, weil halfWidth zählt. */
p('Nur über halfWidth erreicht — der Kasten muss mitwachsen',
  G.touchesCircle(strich, [50, 7], 5, 3));
p('… und ohne halfWidth trifft derselbe Kreis nicht',
  !G.touchesCircle(strich, [50, 7], 5, 0));
/* Diagonal ausserhalb der Ecke: Kastenabstand und echter Abstand gehen hier
   am weitesten auseinander. */
p('Diagonal hinter der Ecke, knapp daneben', !G.touchesCircle(strich, [-4, -4], 5, 0));
p('Diagonal hinter der Ecke, knapp drauf', G.touchesCircle(strich, [-3, -3], 5, 0));
/* Ein senkrechter Strich hat einen Kasten der Breite null. */
const senkrecht = { id: 'v', art: 'stift', breite: 2, pts: [[10, 0], [10, 100]], pressure: [0.5, 0.5] };
p('Ein Kasten ohne Breite bricht nichts', G.touchesCircle(senkrecht, [12, 50], 3, 0));
p('… und lehnt daneben richtig ab', !G.touchesCircle(senkrecht, [20, 50], 3, 0));
/* Ein einzelner Punkt, und gar keiner. */
p('Ein einzelner Punkt trifft', G.touchesCircle({ art: 'stift', pts: [[5, 5]] }, [6, 6], 3, 0));
p('… und daneben nicht', !G.touchesCircle({ art: 'stift', pts: [[5, 5]] }, [50, 50], 3, 0));
p('Gar keine Punkte: kein Treffer', !G.touchesCircle({ art: 'stift', pts: [] }, [0, 0], 10, 0));
p('Nur Unbrauchbares in den Punkten: kein Treffer',
  !G.touchesCircle({ art: 'stift', pts: [[1], 'x', null] }, [0, 0], 10, 0));
/* Ein Rechteck geht weiter über `bounds`, wie vorher — halfWidth zählt dort
   nicht mit, und das soll so bleiben. */
const kasten = { id: 'r', art: 'rectangle', breite: 2, pts: [[0, 0], [50, 50]] };
p('Ein Rechteck trifft weiterhin über seinen Kasten', G.touchesCircle(kasten, [25, 25], 2, 0));
p('… und wird daneben abgelehnt', !G.touchesCircle(kasten, [200, 200], 2, 0));

console.log('\n3 · Und sie ist wirklich schneller');

const marken: any[] = [];
for (let m = 0; m < 400; m++) {
  const pts: number[][] = [];
  const x0 = (m % 20) * 40, y0 = Math.floor(m / 20) * 30;
  for (let i = 0; i < 12; i++) pts.push([x0 + i * 3, y0 + Math.sin(i) * 4]);
  marken.push({ id: 'm' + m, art: 'stift', breite: 2, pts, pressure: pts.map(() => 0.5) });
}
const zug = (fn: (mark: any, c: number[], r: number, h: number) => boolean): number => {
  const t = performance.now();
  for (let s = 1; s <= 30; s++) {
    const c = [100 + 120 * s / 30, 300];
    for (let i = marken.length - 1; i >= 0; i--) fn(marken[i], c, 8, 1);
  }
  return performance.now() - t;
};
zug(G.touchesCircle); zug(naiv);
let neu = 0, alt = 0;
for (let k = 0; k < 12; k++) { neu += zug(G.touchesCircle); alt += zug(naiv); }
neu /= 12; alt /= 12;
console.log(`     schneller Radierzug über 400 Striche: ${alt.toFixed(2)} ms → ${neu.toFixed(2)} ms`);
p('Der Kasten spart mindestens die Hälfte', neu * 2 < alt,
  `naiv ${alt.toFixed(2)} ms, mit Kasten ${neu.toFixed(2)} ms`);
p('… und ein Ereignis bleibt unter einem halben Bild bei 120 Hz',
  neu < 4.15, `${neu.toFixed(2)} ms`);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
