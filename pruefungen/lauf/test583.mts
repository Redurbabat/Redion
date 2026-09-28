/* Suite 583 — Bessere Stifteffekte beim Zeichnen (E704)
 * ============================================================================
 * Redur, 27. September 2026, ca. 16:45 UTC (wörtlich): „… dann bessere stift
 * efeckte beim zeichnen bessere farben". Und ca. 21:45 UTC im Fragebogen,
 * alle vier gewählt: „Echter Textmarker", „Füller wie GoodNotes",
 * „Bleistift mit Graphitkorn", „Neue Tintenfarben".
 *
 * WAS DIESER LAUF HÄLT — jede Zusage an der echten Rechnung gemessen, nicht
 * im Quelltext gesucht:
 *
 *   1  GELENKE (L209 Punkt 3). Ein „M" mit dem Füller: jeder Punkt der
 *      Mittellinie liegt in der Tinte, und die Beine sind im Mittel so breit,
 *      wie die halbe Breite sagt. Vorher kollabierten sie zu Haarstrichen
 *      (1,75 statt 2,52 pt im Dossier) und die Täler hatten Kerben.
 *   2  KAPPEN ZEIGEN NACH AUSSEN. Ein gerader Flächenstrich endet rund —
 *      vorher bog sich die Kappe nach innen, eine Kerbe am Ende jedes
 *      Bleistiftstrichs.
 *   3  DER KEIL — ein echter Textmarker: waagrecht volle Höhe, senkrecht
 *      dünn, gerade Enden, alle Vielecke im selben Drehsinn (EINE Fläche,
 *      keine dunklen Kleckse, wo er sich selbst kreuzt).
 *   4  DER DECKEL auch für die Punkte des Browsers (stift-4): keine Kehre,
 *      keine Vermutung weiter als erlaubt, und keine, wenn der Stift abhebt.
 *   5  DAS TEMPO (stift-7): bis 35 % dünner beim Füller, nichts unter
 *      Schreibtempo; und das Teil-Radieren trägt Neigung und Tempo mit.
 *   6  IM BROWSER, am echten Blatt: der neue Marker ist Sonnengelb mit
 *      Keil bei 0,40 und EIN Pfad; der runde bleibt wählbar und zeichnet wie
 *      vorher; ein ALTER Marker ohne `stil` zeichnet Zeichen für Zeichen wie
 *      vorher. Der Bleistift trägt Graphitkorn mit Farbe als Rückfall statt
 *      der Perlenkante. Kugelschreiber und Marker atmen nicht (stift-5).
 *      Ein schneller Füllerstrich ist dünner als ein langsamer mit
 *      demselben Druck.
 *   7  DIE TINTEN (farben-4): acht mit Redurs Namen, jede auf dem Papier
 *      mindestens 4,5 : 1, und auch für ein rot-grün- oder blau-gelb-
 *      schwaches Auge auseinanderzuhalten (ΔE_OK ≥ 5 in der Nachbildung
 *      nach Machado 2009). Die fünf alten Farben bleiben wählbar.
 *   8  DAS FARBFELD: Tinten zuerst, „Weitere Farben" darunter, alles mit
 *      44 px; die Probe ist ein echter Strich aus `zeichneMarke`; auf
 *      dunklem Papier liegt sie auf diesem Papier, warnt in Worten und
 *      bietet Weiss zuerst an (farben-12); Keil | Rund für den Marker.
 *   9  DAS PDF: ein Strich mit Ecken und ein Keilmarker gehen als MEHRERE
 *      Vielecke mit EINER Füllung hinaus; ein runder Strich schreibt
 *      Byte für Byte, was er vorher schrieb (`h f`).
 *  10  DIE TAFEL (stift-1): ein Stiftstrich ist durch die Mittelpunkte
 *      gebogen (Q), und während des Ziehens wird die Tafel NICHT neu gebaut
 *      — die anderen Formen behalten ihre Knoten.
 *
 * §1–§5 laufen ohne Browser; §6–§10 brauchen die App — `listen(0)` (L205).
 *
 *   node pruefungen/lauf/test583.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const r2 = (v: number): number => Math.round(v * 100) / 100;

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/stroke.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;
const S: any = (globalThis as any).InkStroke;

type P = [number, number];
/** Punkt in einem Vieleck (gerade/ungerade). */
const drin = (q: P, poly: number[][]): boolean => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as [number, number], [xj, yj] = poly[j] as [number, number];
    if ((yi > q[1]) !== (yj > q[1]) && q[0] < (xj - xi) * (q[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** Abstand Punkt–Rand eines Vielecks. */
const randAbstand = (q: P, poly: number[][]): number => {
  let m = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j] as [number, number], [bx, by] = poly[i] as [number, number];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((q[0] - ax) * dx + (q[1] - ay) * dy) / l2));
    m = Math.min(m, Math.hypot(q[0] - (ax + dx * t), q[1] - (ay + dy * t)));
  }
  return m;
};
/** Die Vielecke des Umrisses — seit E704 eines je Lauf; vorher eines. */
const vielecke = (pts: number[][], halb: number[]): number[][][] =>
  typeof G.outlineTeile === 'function' ? G.outlineTeile(pts, halb) : [G.outlinePunkte(pts, halb)];
/** Liegt ein Punkt in der Tinte (Vereinigung aller Vielecke)? */
const inTinte = (q: P, polys: number[][][]): boolean => polys.some(poly => drin(q, poly));
/** Die lokale halbe Breite an einem Punkt der Mittellinie: der grösste
 *  Randabstand über alle Vielecke, die ihn enthalten. */
const lokal = (q: P, polys: number[][][]): number =>
  Math.max(0, ...polys.filter(poly => drin(q, poly)).map(poly => randAbstand(q, poly)));
/** Eine Polylinie in gleichen Schritten. */
const abtasten = (ecken: number[][], schritt: number): number[][] => {
  const aus: number[][] = [];
  for (let e = 0; e < ecken.length - 1; e++) {
    const [ax, ay] = ecken[e] as [number, number], [bx, by] = ecken[e + 1] as [number, number];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / schritt));
    for (let i = 0; i < n; i++) aus.push([r2(ax + (bx - ax) * i / n), r2(ay + (by - ay) * i / n)]);
  }
  aus.push(ecken[ecken.length - 1]!);
  return aus;
};

/* ======================================================================== */
console.log('\n1 · Gelenke: ein „M" behält volle Beine und geschlossene Täler');
{
  /* Wie es gespeichert wird: RDP lässt an einem „M" fast nur die Ecken
     stehen (zwei, drei Punkte je Bein) — genau dort kippte die Kante. Mit
     dieser Form mass der Stand vor E704 23 Punkte der Mittellinie
     ausserhalb der Tinte und Beine von 0,8 statt 1,26 pt halber Breite. */
  const M = [[0, 60], [0, 0], [20, 40], [40, 0], [40, 60]];
  const pts = abtasten(M, 30);
  const halb = pts.map(() => 1.26);
  const polys = vielecke(pts, halb);
  const probe: P[] = [];
  const weg0 = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0]! - pts[i]![0]!, q[1]! - pts[i]![1]!), 0);
  /* Die Mittellinie in 0,5-pt-Schritten, ohne die ersten und letzten 0,5 pt. */
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!, l = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
    for (let t = 0; t < l; t += 0.5) { s += 0.5; if (s > 0.5 && s < weg0 - 0.5) probe.push([a[0]! + (b[0]! - a[0]!) * t / l, a[1]! + (b[1]! - a[1]!) * t / l]); }
  }
  const draussen = probe.filter(q => !inTinte(q, polys)).length;
  const breiten = probe.map(q => lokal(q, polys)).sort((a, b) => a - b);
  const median = breiten[Math.floor(breiten.length / 2)] ?? 0;
  console.log(`    ${probe.length} Punkte der Mittellinie · draussen ${draussen} · halbe Breite im Median ${r2(median)} (soll 1,26)`);
  p('Jeder Punkt der Mittellinie liegt in der Tinte', draussen === 0, `${draussen} draussen`);
  p('Die Beine sind im Median mindestens 90 % so breit wie verlangt', median >= 0.9 * 1.26, `${r2(median)} pt`);
  p('Ein „M" zerfällt in vier Läufe (drei Gelenke)', typeof G.gelenke === 'function' && G.gelenke(pts).length === 3,
    typeof G.gelenke === 'function' ? String(G.gelenke(pts).length) : 'keine Gelenke');
  /* Ein runder Bogen hat KEIN Gelenk — er bleibt ein Lauf, ein Umriss. */
  const bogen: number[][] = [];
  for (let t = 0; t <= Math.PI; t += 0.1) bogen.push([r2(40 * Math.cos(t)), r2(40 * Math.sin(t))]);
  p('Ein Bogen bleibt EIN Lauf', vielecke(bogen, bogen.map(() => 1)).length === 1);
  /* Feder und trockener Umriss bleiben zeichengleich (test366 §1), auch mit Gelenken. */
  const feder = new S.Feder();
  pts.forEach((q, i) => feder.punkt(q, halb[i]));
  p('Die Feder zeichnet Zeichen für Zeichen, was der trockene Umriss zeichnet',
    feder.d() === G.outline(pts, halb), feder.d().slice(0, 60));
}

/* ======================================================================== */
console.log('\n2 · Die Kappen zeigen nach aussen');
{
  const pts = abtasten([[0, 0], [60, 0]], 5);
  const halb = pts.map(() => 3);
  const poly = G.outlinePunkte(pts, halb) as number[][];
  p('1,5 pt vor dem Ende liegt der Strich noch in der Tinte', drin([58.5, 0], poly));
  p('… und die Kappe reicht über das Ende hinaus (1,5 pt dahinter ist Tinte)', drin([61.5, 0], poly));
  p('… und ebenso am Anfang', drin([-1.5, 0], poly) && drin([1.5, 0], poly));
}

/* ======================================================================== */
console.log('\n3 · Der Keil: ein echter Textmarker');
{
  const hat = typeof G.keil === 'function';
  p('InkGeometry kennt den Keil', hat);
  if (hat) {
    const h = 12, t = h * 0.22;
    const waag = G.keil([[0, 0], [60, 0]], h, t, 78) as number[][][];
    const senk = G.keil([[0, 0], [0, 60]], h, t, 78) as number[][][];
    const hoehe = (polys: number[][][], achse: 0 | 1): number => {
      const w = polys.flat().map(q => q[achse] as number);
      return Math.max(...w) - Math.min(...w);
    };
    p('Waagrecht: volle Höhe der Kante (≥ 90 %)', hoehe(waag, 1) >= 0.9 * h * Math.sin(78 * Math.PI / 180), `${r2(hoehe(waag, 1))} pt`);
    p('Senkrecht: dünn (unter 40 % der Höhe)', hoehe(senk, 0) < 0.4 * h, `${r2(hoehe(senk, 0))} pt`);
    /* GERADE ENDEN: nichts ragt waagrecht mehr als die halbe Kante über das Ende hinaus. */
    const xs = waag.flat().map(q => q[0] as number);
    const ueber = Math.max(...xs) - 60;
    p('Gerade Enden: kein runder Klecks über das Ende hinaus', ueber <= h / 2 * Math.cos(78 * Math.PI / 180) + t / 2 + 0.3, `${r2(ueber)} pt`);
    /* EINE FLÄCHE: ein Strich, der hin und zurück läuft, gibt Vielecke im
       selben Drehsinn — `nonzero` füllt ihre Vereinigung einmal. */
    const schlaufe: number[][] = [];
    for (let u = 0; u <= 2.3 * Math.PI; u += 0.1) schlaufe.push([r2(30 * Math.cos(u) * 1.4), r2(30 * Math.sin(u) * 0.8)]);
    const polys = G.keil(schlaufe, h, t, 78) as number[][][];
    const sinne = polys.map(v => Math.sign(G.flaecheMitSinn(v)));
    p('Alle Vielecke einer Schlaufe laufen im selben Drehsinn', polys.length > 1 && sinne.every(x => x === sinne[0]), JSON.stringify(sinne));
    p('Ein Tipp ist ein Abdruck der Kante, kein leerer Strich', (G.keil([[5, 5]], h, t, 78) as number[][][]).length === 1);
  }
}

/* ======================================================================== */
console.log('\n4 · Der Deckel auch für die Punkte des Browsers');
{
  const hat = typeof S.deckeln === 'function' && typeof S.bremse === 'function';
  p('InkStroke kennt `deckeln` und `bremse`', hat);
  if (hat) {
    const roh: P[] = [[0, 0], [4, 0], [8, 0]];
    /* Der Browser rät 60 pt weit — erlaubt sind höchstens VORHER_PX und das Tempo mal VORHER_MS. */
    const lang = S.deckeln(roh, [[20, 0], [40, 0], [68, 0]], 8, 1) as P[];
    const reicht = lang.length ? lang[lang.length - 1]![0] - 8 : 0;
    const grenze = Math.min(S.VORHER_PX, 4 / 8 * S.VORHER_MS);
    p('Eine zu weite Vermutung wird auf die erlaubte Länge gekürzt', lang.length > 0 && reicht <= grenze + 0.01, `${r2(reicht)} pt, erlaubt ${r2(grenze)}`);
    p('Eine Vermutung, die kehrt, wird nicht gezeichnet', (S.deckeln(roh, [[4, 1], [0, 2]], 8, 1) as P[]).length === 0);
    p('Fällt der Druck dreimal und liegt unter 60 % — der Stift hebt ab: Bremse 0',
      S.bremse(roh, [8, 8], [0.8, 0.8, 0.7, 0.5, 0.3]) === 0);
    p('Gleichmässig geschrieben: Bremse 1', S.bremse(roh, [8, 8], [0.5, 0.5, 0.5, 0.5]) === 1);
    p('Die Hand bremst auf die Hälfte: die Vermutung auch', r2(S.bremse([[0, 0], [8, 0], [12, 0]], [8, 8], [])) === 0.5);
    p('Mit Bremse 0 rät auch die eigene Vorhersage nichts', (S.vorhersage(roh, S.VORHER_MS, 8, 0) as P[]).length === 0);
    p('… und ohne Bremse wie bisher', (S.vorhersage(roh, S.VORHER_MS, 8) as P[]).length > 0);
  }
}

/* ======================================================================== */
console.log('\n5 · Das Tempo macht den Füller dünner — und das Radieren trägt es mit');
{
  const hat = typeof S.tempoFaktor === 'function';
  p('InkStroke kennt `tempoFaktor`', hat);
  if (hat) {
    p('Unter Schreibtempo wird nichts dünner', S.tempoFaktor(0.2, 0.35) === 1);
    p('Schnell: höchstens 35 % dünner beim Füller', r2(S.tempoFaktor(3, 0.35)) === 0.65, String(S.tempoFaktor(3, 0.35)));
    p('Ohne Stärke (Kugelschreiber) bleibt der Faktor 1', S.tempoFaktor(3, 0) === 1);
  }
  const teile = G.splitByCircle([[0, 0], [10, 0], [20, 0], [30, 0], [40, 0]], [0.5, 0.5, 0.5, 0.5, 0.5], [20, 0], 4,
    { neigung: [0.1, 0.2, 0.3, 0.4, 0.5], tempo: [1, 1, 1, 1, 1] }) as Array<{ pts: unknown[]; kanaele?: Record<string, unknown[]> }>;
  p('Teil-Radieren: jedes Stück trägt Neigung und Tempo in seiner eigenen Länge',
    teile.length === 2 && teile.every(t => t.kanaele?.['neigung']?.length === t.pts.length && t.kanaele?.['tempo']?.length === t.pts.length),
    JSON.stringify(teile.map(t => [t.pts.length, t.kanaele?.['neigung']?.length, t.kanaele?.['tempo']?.length])));
}

/* ======================================================================== */
{
  const { chromium } = await import('playwright');
  const http = await import('node:http');
  const TYP: Record<string, string> = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
    '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
  };
  const server = http.createServer((a, b) => {
    const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
    const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
    if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      b.writeHead(404); b.end(); return;
    }
    b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
    b.end(fs.readFileSync(datei));
  });
  await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
  const PORT = (server.address() as { port: number }).port;
  const browser = await chromium.launch();
  const fehler: string[] = [];
  try {
    const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
    s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await s.goto(`http://localhost:${PORT}/index.html`);
    await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Store !== 'undefined'");
    const blatt = await s.evaluate(`(async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(o => o.remove());
      const seite = Store.addPage(null, { text: 'Stifteffekte' });
      const alt = { id: 'altmarker', art: 'marker', farbe: '#e0a419', breite: 2.5, pts: [[40, 700], [120, 702], [200, 699]], pressure: [0.5, 0.5, 0.5] };
      const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [alt] });
      await Store.flush(); App.oeffne(seite.id); return b.id;
    })()`) as string;
    await s.waitForSelector('.blatt-marken', { timeout: 20000 });
    await s.waitForTimeout(600);
    /** Einen Strich mit echten Zeigerereignissen ziehen (Blattkoordinaten). */
    const ziehe = (pts: number[][], druck: number[] | number, dt = 8, typ = 'pen'): Promise<any> => s.evaluate(`(async () => {
      const svg = document.querySelector('.blatt-marken'); const ctm = svg.getScreenCTM();
      const zu = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
      const pts = ${JSON.stringify(pts)}; const dr = ${JSON.stringify(druck)};
      const breiten = [];
      const ev = (typ, i) => new PointerEvent(typ, { ...zu(pts[i][0], pts[i][1]), pointerType: '${typ}',
        pressure: typ === 'pointerup' ? 0 : (Array.isArray(dr) ? dr[i] : dr), isPrimary: true, button: 0,
        buttons: typ === 'pointerup' ? 0 : 1, pointerId: 9, bubbles: true, cancelable: true });
      svg.dispatchEvent(ev('pointerdown', 0));
      for (let i = 1; i < pts.length; i++) {
        await new Promise(r => setTimeout(r, ${dt}));
        svg.dispatchEvent(ev('pointermove', i));
        await new Promise(r => requestAnimationFrame(() => r(0)));
        const nass = [...svg.querySelectorAll('[data-sid]')].pop();
        if (nass && nass.getAttribute('stroke-width')) breiten.push(nass.getAttribute('stroke-width'));
      }
      svg.dispatchEvent(ev('pointerup', pts.length - 1));
      await new Promise(r => setTimeout(r, 200));
      const b = Store.getBlock('${blatt}'); const m = b.marken[b.marken.length - 1];
      const node = svg.querySelector('[data-sid="' + m.id + '"]');
      return { mark: m, breiten, node: node ? { tag: node.tagName, d: node.getAttribute('d'), fill: node.getAttribute('fill'),
        stroke: node.getAttribute('stroke'), sw: node.getAttribute('stroke-width'), dash: node.getAttribute('stroke-dasharray'),
        opacity: node.getAttribute('opacity'), style: node.getAttribute('style') || '', stil: node.getAttribute('data-ink-stil') } : null };
    })()`);
    const linie = (x0: number, y0: number, x1: number, y1: number, n: number): number[][] =>
      Array.from({ length: n + 1 }, (_q, i) => [r2(x0 + (x1 - x0) * i / n), r2(y0 + (y1 - y0) * i / n)]);

    console.log('\n6 · Am echten Blatt: Textmarker, Graphit, Breite, Tempo');
    await s.evaluate(`Store.setMeta('zeichnen:markerspitze', null); Zeichenziel.aktive().setzeWerkzeug('marker')`);
    const keil = await ziehe(linie(60, 120, 260, 122, 40), 0.55);
    p('Ein neuer Markerstrich ist Sonnengelb (#ffcf33)', keil.mark.farbe === '#ffcf33', keil.mark.farbe);
    p('… mit der Keilspitze als Vorgabe (stil „keil")', keil.mark.stil === 'keil', String(keil.mark.stil));
    p('… als EINE Fläche mit Deckung 0,4 und multipliziert', keil.node?.tag === 'path' && keil.node?.opacity === '0.4'
      && /multiply/.test(keil.node?.style || '') && keil.node?.stroke === 'none', JSON.stringify(keil.node && { o: keil.node.opacity, s: keil.node.stroke }));
    const gerade = (keil.node?.d || '').match(/[A-Z]/g) || [];
    p('… aus geraden Kanten, ohne runde Kappe (kein A, kein Q)', gerade.length > 3 && !gerade.includes('A') && !gerade.includes('Q'), gerade.join('').slice(0, 30));
    await s.evaluate(`Store.setMeta('zeichnen:markerspitze', 'rund')`);
    const rund = await ziehe(linie(60, 160, 260, 162, 40), 0.55);
    p('Der runde Marker bleibt wählbar: ohne `stil`, Deckung 0,32, runde Kappe', !rund.mark.stil && rund.node?.opacity === '0.32'
      && rund.node?.stroke !== 'none', JSON.stringify({ stil: rund.mark.stil, o: rund.node?.opacity }));
    const alt = await s.evaluate(`(() => {
      const n = document.querySelector('.blatt-marken [data-sid="altmarker"]');
      return { d: n?.getAttribute('d'), soll: InkGeometry.path([[40, 700], [120, 702], [200, 699]]), o: n?.getAttribute('opacity'),
               sw: n?.getAttribute('stroke-width'), soll_sw: String(Marken.strokeWidth ? Marken.strokeWidth({ art: 'marker', breite: 2.5, pressure: [0.5, 0.5, 0.5] }) : '') };
    })()`) as any;
    p('Ein ALTER Marker (ohne stil) zeichnet Zeichen für Zeichen wie vorher', alt.d === alt.soll && alt.o === '0.32' && alt.sw === alt.soll_sw,
      JSON.stringify(alt));
    /* stift-5: der Marker atmet nicht — Druck fällt 0,9 → 0,1, die nasse Breite bleibt eine. */
    const fallend = Array.from({ length: 41 }, (_q, i) => r2(0.9 - 0.8 * i / 40));
    const atem = await ziehe(linie(60, 200, 260, 200, 40), fallend);
    const nassBreiten = new Set(atem.breiten.slice(8));
    p('Der Marker atmet nicht: EINE nasse Breite, solange geschrieben wird', nassBreiten.size === 1, JSON.stringify([...nassBreiten].slice(0, 5)));
    await s.evaluate(`(() => { const st = Zeichenziel.aktive(); st.setzeWerkzeug('stift'); st.setzeStil('kugel'); })()`);
    const kugel = await ziehe(linie(60, 240, 260, 240, 40), fallend);
    const kugelNass = new Set(kugel.breiten.slice(8));
    p('Der Kugelschreiber atmet nicht', kugelNass.size === 1, JSON.stringify([...kugelNass].slice(0, 5)));
    p('… und trocken ist er so breit wie nass', kugel.node?.sw === [...kugelNass][0], `${kugel.node?.sw} gegen ${[...kugelNass][0]}`);
    /* Bleistift: Graphitkorn mit Farbe als Rückfall, keine Perlenkante. */
    await s.evaluate(`Zeichenziel.aktive().setzeStil('bleistift')`);
    const blei = await ziehe(linie(60, 280, 260, 300, 40), 0.5);
    const muster = await s.evaluate(`(() => { const f = ${JSON.stringify(blei.node?.fill || '')}; const m = /url\\(#([^)]+)\\)/.exec(f); return m ? !!document.getElementById(m[1]) && document.getElementById(m[1]).tagName.toLowerCase() === 'pattern' : false; })()`);
    p('Der Bleistift füllt mit Graphitkorn und hat seine Farbe als Rückfall', /^url\(#redion-graphit-[0-9a-f]{6}-\d\) #[0-9a-f]{6}$/.test(blei.node?.fill || ''), blei.node?.fill);
    p('… das Muster steht im Dokument', muster === true);
    p('… und keine Perlenkante mehr (kein stroke-dasharray)', !blei.node?.dash, String(blei.node?.dash));
    /* Tempo: derselbe Druck, einmal langsam, einmal schnell. */
    await s.evaluate(`Zeichenziel.aktive().setzeStil('fueller')`);
    const langsam = await ziehe(linie(60, 360, 200, 360, 120), 0.5, 10);
    const schnell = await ziehe(linie(60, 420, 460, 420, 16), 0.5, 10);
    const mittelBreite = (m: any): Promise<number> => s.evaluate(`(() => { const m = ${JSON.stringify(m)};
      if (typeof Marken.halbeBreiten !== 'function') return 0;
      const h = Marken.halbeBreiten(m, m.pts); const i = h.slice(Math.floor(h.length * 0.3), Math.ceil(h.length * 0.7)).sort((a, b) => a - b);
      return i[Math.floor(i.length / 2)] || 0; })()`) as Promise<number>;
    const bl = await mittelBreite(langsam.mark), bs = await mittelBreite(schnell.mark);
    console.log(`    halbe Breite in der Mitte: langsam ${r2(bl)} · schnell ${r2(bs)} pt`);
    p('Ein schneller Füllerstrich ist höchstens 80 % so breit wie ein langsamer (gleicher Druck)', bs > 0 && bs <= 0.8 * bl, `${r2(bs)} gegen ${r2(bl)}`);
    p('… und trägt sein Tempo je Punkt (so lang wie pts)', Array.isArray(schnell.mark.tempo) && schnell.mark.tempo.length === schnell.mark.pts.length,
      `${schnell.mark.tempo?.length} zu ${schnell.mark.pts.length}`);

    console.log('\n7 · Die Tinten');
    const tinten = await s.evaluate(`(() => ({ tinten: Marken.TINTEN || [], farben: Marken.FARBEN }))()`) as { tinten: string[][]; farben: string[] };
    const namen = tinten.tinten.map(t => t[1]);
    p('Acht Tinten mit Redurs Namen', JSON.stringify(namen) === JSON.stringify(['Königsblau', 'Nachtblau', 'Karmin', 'Tannengrün', 'Petrol', 'Aubergine', 'Sepia', 'Graphit']), namen.join(', '));
    p('Die fünf alten Farben bleiben, wie sie sind', JSON.stringify(tinten.farben) === JSON.stringify(['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419']), tinten.farben.join(' '));
    const lin = (c: number): number => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    const rgb = (h: string): number[] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const lum = (h: string): number => { const [r, g, b] = rgb(h).map(lin) as [number, number, number]; return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const kontrast = (a: string, b: string): number => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const MAT: Record<string, number[][]> = {
      normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
      protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
      tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
    };
    const oklab = ([r, g, b]: number[]): number[] => {
      const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
      const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
      const q = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
      return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * q, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * q,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * q];
    };
    const sim = (h: string, k: string): number[] => { const c = rgb(h).map(lin); const M = MAT[k]!;
      return M.map(z => Math.max(0, Math.min(1, z[0]! * c[0]! + z[1]! * c[1]! + z[2]! * c[2]!))); };
    const dE = (a: string, b: string, k: string): number => { const A = oklab(sim(a, k)), B = oklab(sim(b, k));
      return 100 * Math.hypot(A[0]! - B[0]!, A[1]! - B[1]!, A[2]! - B[2]!); };
    const hexe = tinten.tinten.map(t => t[0]!);
    const schwach = hexe.length ? Math.min(...hexe.map(h => kontrast(h, '#f8f8f5'))) : 0;
    p('Jede Tinte hat auf dem Papier mindestens 4,5 : 1', schwach >= 4.5, `${r2(schwach)} : 1`);
    for (const k of Object.keys(MAT)) {
      let klein = Infinity;
      for (let i = 0; i < hexe.length; i++) for (let j = i + 1; j < hexe.length; j++) klein = Math.min(klein, dE(hexe[i]!, hexe[j]!, k));
      p(`Kleinster Abstand zweier Tinten (${k}) mindestens ΔE_OK 5`, klein >= 5, `${r2(klein)}`);
    }

    console.log('\n8 · Das Farbfeld: Tinten zuerst, Papier echt, Probe ein Strich');
    await s.click('.blatt-werk [data-wz="stift"]');
    await s.waitForTimeout(200);
    await s.locator('.blatt-werk .blatt-farbe-neu').first().click();
    await s.waitForTimeout(300);
    const feld = await s.evaluate(`(() => {
      const panel = document.querySelector('.blatt-color-panel');
      const gruppen = [...(panel?.querySelectorAll('.blatt-color-grid') || [])].map(g => ({ name: g.getAttribute('aria-label'),
        farben: [...g.querySelectorAll('[data-ink-color]')].map(b => b.dataset.inkColor) }));
      const knoepfe = [...(panel?.querySelectorAll('button, input') || [])].every(n => { const r = n.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; });
      const probe = panel?.querySelector('.blatt-color-preview i path');
      return { gruppen, knoepfe, probe: !!probe, fuellung: probe?.getAttribute('fill') || probe?.getAttribute('stroke') || '' };
    })()`) as any;
    p('Oben stehen die acht Tinten', JSON.stringify(feld.gruppen[0]?.farben) === JSON.stringify(hexe), JSON.stringify(feld.gruppen[0]));
    p('„Weitere Farben" enthält die fünf alten', feld.gruppen[1]?.name === 'Weitere Farben'
      && tinten.farben.every((f: string) => feld.gruppen[1]?.farben.includes(f)), JSON.stringify(feld.gruppen[1]));
    p('Jeder Knopf im Feld ist mindestens 44 × 44 px', feld.knoepfe === true);
    p('Die Probe ist ein gezeichneter Strich (ein Pfad aus zeichneMarke)', feld.probe === true);
    await s.keyboard.press('Escape');
    await s.waitForTimeout(200);
    /* Dunkles Papier (eine eingelesene Folie): Probe auf diesem Papier, Warnung in Worten, Weiss zuerst. */
    await s.evaluate(`document.querySelector('.blatt-papier')?.style.setProperty('--paper', '#1f2937')`);
    await s.locator('.blatt-werk .blatt-farbe-neu').first().click();
    await s.waitForTimeout(300);
    const dunkel = await s.evaluate(`(() => {
      const panel = document.querySelector('.blatt-color-panel');
      const vorschau = panel?.querySelector('.blatt-color-preview');
      const erste = panel?.querySelector('[data-ink-color]')?.dataset.inkColor;
      return { grund: vorschau ? getComputedStyle(vorschau).backgroundColor : '', erste,
               warnung: (panel?.querySelector('.blatt-color-warnung')?.textContent || '').trim() };
    })()`) as any;
    p('Auf dunklem Papier liegt die Probe auf diesem Papier', dunkel.grund === 'rgb(31, 41, 55)', dunkel.grund);
    p('… und Weiss steht als erste Tinte da', dunkel.erste === '#f5f5f0', String(dunkel.erste));
    p('… und Schwarz darauf wird in Worten gewarnt', /kaum sichtbar/i.test(dunkel.warnung), dunkel.warnung);
    await s.keyboard.press('Escape');
    await s.evaluate(`document.querySelector('.blatt-papier')?.style.removeProperty('--paper')`);
    await s.click('.blatt-werk [data-wz="marker"]');
    await s.waitForTimeout(200);
    await s.locator('.blatt-werk .blatt-farbe-neu').first().click();
    await s.waitForTimeout(300);
    const spitzen = await s.evaluate(`[...document.querySelectorAll('.blatt-color-panel [data-marker-spitze]')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed'))`) as string[];
    p('Der Marker bietet Keil und Rund an, mit Wort und aria-pressed', spitzen.length === 2 && spitzen.some(x => /Keil/.test(x)) && spitzen.some(x => /Rund:true/.test(x)), JSON.stringify(spitzen));
    /* Ohne Knopf (der Stand davor) kein Warten bis zum Abbruch: rot, weiter. */
    if (spitzen.length) await s.locator('.blatt-color-panel [data-marker-spitze="keil"]').click({ timeout: 3000 });
    const gemerkt = await s.evaluate(`Store.getMeta('zeichnen:markerspitze')`);
    p('… ein Tipp auf „Keil" wird gemerkt', gemerkt === 'keil', String(gemerkt));
    await s.keyboard.press('Escape');

    console.log('\n9 · Das PDF: mehrere Vielecke, eine Füllung');
    const pdf = await s.evaluate(`(() => {
      const M = { id: 'm1', art: 'stift', stil: 'fueller', farbe: '#111111', breite: 2, pts: [[0, 60], [0, 0], [20, 40], [40, 0], [40, 60]], pressure: [0.5, 0.5, 0.5, 0.5, 0.5] };
      const K = { id: 'k1', art: 'marker', stil: 'keil', farbe: '#ffcf33', breite: 2.5, pts: [[0, 0], [60, 0], [0, 10]], pressure: [0.5, 0.5, 0.5] };
      const R = { id: 'r1', art: 'stift', stil: 'fueller', farbe: '#111111', breite: 2, pts: [[0, 0], [20, 5], [40, 8], [60, 8]], pressure: [0.5, 0.5, 0.5, 0.5] };
      const tiefe = k => Array.isArray(k) && Array.isArray(k[0]) && Array.isArray(k[0][0]) ? 3 : Array.isArray(k) ? 2 : 0;
      const a = Marken.alsAnnotation(M), b = Marken.alsAnnotation(K), c = Marken.alsAnnotation(R);
      return { m: tiefe(a.kontur[0]), mn: a.kontur[0].length, k: tiefe(b.kontur[0]), kn: b.kontur[0].length, r: tiefe(c.kontur[0]), kd: b.deckkraft };
    })()`) as any;
    p('Ein „M" geht als ein Vieleck je Lauf ins PDF', pdf.m === 3 && pdf.mn === 4, JSON.stringify(pdf));
    p('Der Keilmarker geht als seine Vielecke, Deckung 0,4', pdf.k === 3 && pdf.kn > 1 && pdf.kd === 0.4, JSON.stringify(pdf));
    p('Ein runder Strich bleibt EIN Vieleck (die Form von vorher)', pdf.r === 2, JSON.stringify(pdf));
    const strom = await s.evaluate(`(async () => {
      if (typeof PdfWriter === 'undefined') return null;
      const w = PdfWriter.neu();
      const zwei = [[[10, 10], [30, 10], [30, 30], [10, 30]], [[20, 20], [40, 20], [40, 40], [20, 40]]];
      const bild = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });
      w.seite({ bild, pixelBreite: 10, pixelHoehe: 10, breite: 100, hoehe: 100,
        marken: [{ striche: [[[10, 10], [40, 40]]], kontur: [zwei], farbe: [1, 0.8, 0.2], breite: 2, deckkraft: 0.4, name: 'Marker' }] });
      const blob = w.schliessen();
      const text = new TextDecoder('latin1').decode(new Uint8Array(await blob.arrayBuffer()));
      const s = text.match(/stream\\n([\\s\\S]*?)endstream/g) || [];
      const mit = s.find(x => / m\\n/.test(x) && / l\\n/.test(x)) || '';
      return { h: (mit.match(/^h$/gm) || []).length, f: (mit.match(/^f$/gm) || []).length, hf: (mit.match(/h f/g) || []).length };
    })()`).catch(e => ({ fehler: String(e).slice(0, 120) })) as any;
    p('Zwei Vielecke: zweimal geschlossen, EINMAL gefüllt (die Deckung gilt einmal)', strom && strom.h === 2 && strom.f === 1 && strom.hf === 0, JSON.stringify(strom));

    console.log('\n10 · Die Tafel schreibt wie das Blatt');
    /* Echte Zeigerereignisse über den Browser (CDP), nicht nachgebaute —
       die Tafel hält den Zeiger fest (`setPointerCapture`), und das geht
       nur mit einem Zeiger, den es gibt. */
    const f = await s.evaluate(`(async () => {
      const seite = Store.addPage(null, { text: 'Tafel' });
      Store.addBlock(seite.id, 'whiteboard', { text: 'Tafel', shapes: [{ id: 'kasten1', art: 'rechteck', x: 400, y: 40, w: 80, h: 60, farbe: '#2f7ed8' }] });
      await Store.flush(); App.oeffne(seite.id); await new Promise(r => setTimeout(r, 900));
      const f = document.querySelector('.wb-flaeche'); if (!f) return null;
      f.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 200));
      const r = f.getBoundingClientRect(); return { x: r.left, y: r.top };
    })()`) as { x: number; y: number } | null;
    let tafel: any = null;
    if (f) {
      await s.mouse.move(f.x + 60, f.y + 100);
      await s.mouse.down();
      let gleich = true;
      for (let i = 1; i <= 60; i++) {
        const u = i / 60 * 4 * Math.PI;
        await s.mouse.move(f.x + 60 + 6 * u - 14 * Math.sin(u), f.y + 100 - 14 * Math.cos(u) + 14);
        if (i % 6 === 0) {
          /* Der erste Zug darf die Tafel einmal aufbauen (der wachsende
             Strich braucht seinen Knoten); danach bleibt jeder andere Knoten. */
          const gleichJetzt = await s.evaluate(`(async () => { await new Promise(r => requestAnimationFrame(() => r(0)));
            const k = document.querySelector('.wb-flaeche [data-sid="kasten1"]');
            if (!window.__kasten || ${i} === 6) { window.__kasten = k; return true; } return k === window.__kasten; })()`);
          if (!gleichJetzt) gleich = false;
        }
      }
      await s.mouse.up();
      await s.waitForTimeout(300);
      const q = await s.evaluate(`[...document.querySelectorAll('.wb-flaeche path')].some(n => (n.getAttribute('d') || '').includes('Q'))`);
      tafel = { gleich, q };
    }
    p('Während des Ziehens bleibt die Tafel stehen (die anderen Formen behalten ihre Knoten)', tafel?.gleich === true, JSON.stringify(tafel));
    p('Der Tafelstrich ist durch die Mittelpunkte gebogen (Q), kein Polygonzug', tafel?.q === true, JSON.stringify(tafel));

    p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));
  } finally {
    await browser.close(); server.close();
  }
}

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
