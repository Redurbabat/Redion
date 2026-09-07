/* Suite 451 — Ein Dreieck darf liegen, wie es gezogen wurde (E478)
 * ============================================================================
 * E471 erkannte nur AUFRECHTE Dreiecke, und der Grund stand ehrlich in
 * L133: die Marke `triangle` ist gleichschenklig mit der Spitze oben in
 * der Mitte ihres Kastens — sie konnte gar keine andere Lage beschreiben.
 *
 * Seit E466 kann sie es doch: `dreh` steht an jeder Marke. Und seit E474
 * RECHNET die Geometrie damit, statt die Drehung nur anzuzeigen — Griff,
 * Radierer, Rahmen und Kastenzug treffen eine schiefe Marke dort, wo sie
 * steht. Erst damit ist ein gedrehtes Dreieck keine hübsche Lüge mehr,
 * sondern eine Marke wie jede andere.
 *
 *   §1 DER WINKEL stimmt, bei zwölf Lagen rundum — und die drei Ecken der
 *      fertigen Marke liegen dort, wo die gezogenen lagen.
 *   §2 AUFRECHT BLEIBT AUFRECHT: kein `dreh`, Zahl für Zahl wie E471.
 *   §3 UNGLEICHSCHENKLIG WIRD KEIN DREIECK — und die anderen Formen
 *      bleiben unberührt, denn der Zweig fällt durch statt abzubrechen.
 *   §4 AUF DEM BLATT: gezogen und gehalten, die Marke trägt ihren Winkel,
 *      ihr Knoten steht schief, und der Auswahlrahmen liegt auf ihr (E474).
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1, §4 → `gedrehtesDreieck` immer null: aus dem gedrehten Dreieck wird
 *        wieder ein Strich. Gelaufen, rot.
 *   §1 → die Reihenfolge der zwei Zweige tauschen (erst aufrecht, dann
 *        gedreht): bei 15°, 120° und −120° greift die alte
 *        Aufrecht-Probe und der Winkel fällt weg. Gelaufen, rot — so
 *        gefunden.
 *   §2 → die Fast-aufrecht-Grenze (4°) entfernen: das aufrechte Dreieck
 *        bekommt ein `dreh`-Feld, das es nicht braucht. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test451.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9571;
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

/* Formerkennung und Geometrie laufen ohne Browser. */
(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/shapes.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;
const S: any = (globalThis as any).InkShapes;

/** Eine von Hand gezogene Kante: viele Punkte, ein wenig zittrig. */
const kante = (a: number[], b: number[], n: number): number[][] => {
  const aus: number[][] = [];
  for (let i = 0; i < n; i++)
    aus.push([a[0]! + (b[0]! - a[0]!) * i / n + (i % 2 ? 0.6 : -0.6),
              a[1]! + (b[1]! - a[1]!) * i / n + (i % 3 ? 0.5 : -0.5)]);
  return aus;
};
/** Ein gleichschenkliges Dreieck um (cx,cy), Grundseite `breit`, Höhe `hoch`,
 *  um `grad` im Uhrzeigersinn gedreht — genau so, wie die Marke es zeichnet. */
const dreieck = (cx: number, cy: number, breit: number, hoch: number, grad: number): number[][] => {
  const roh: number[][] = [[cx, cy - hoch / 2], [cx + breit / 2, cy + hoch / 2], [cx - breit / 2, cy + hoch / 2]];
  const [A, B, C] = G.drehePunkte(roh as any, [cx, cy], grad) as number[][];
  return [...kante(A!, B!, 16), ...kante(B!, C!, 16), ...kante(C!, A!, 16), [A![0]!, A![1]!]];
};
/** Die drei sichtbaren Ecken einer fertigen Dreieck-Marke. */
const markenEcken = (form: any): number[][] => {
  const [a, b] = form.pts as number[][];
  const x0 = Math.min(a![0]!, b![0]!), x1 = Math.max(a![0]!, b![0]!);
  const y0 = Math.min(a![1]!, b![1]!), y1 = Math.max(a![1]!, b![1]!);
  const roh = [[(x0 + x1) / 2, y0], [x1, y1], [x0, y1]];
  return form.dreh ? G.drehePunkte(roh as any, [(x0 + x1) / 2, (y0 + y1) / 2], form.dreh) : roh;
};
/** Kleinster Abstand zweier Dreiecksecken-Mengen, Ecke für Ecke zugeordnet. */
const eckenAbstand = (ist: number[][], soll: number[][]): number => {
  let schlimmster = 0;
  for (const q of soll) {
    let nah = Infinity;
    for (const r of ist) nah = Math.min(nah, Math.hypot(q[0]! - r[0]!, q[1]! - r[1]!));
    schlimmster = Math.max(schlimmster, nah);
  }
  return schlimmster;
};

/* ═══ §1 Der Winkel ════════════════════════════════════════════════════════ */
console.log('\n§1 Der Winkel stimmt, rundum');
{
  /* EIN DEUTLICH SPITZES DREIECK (200 breit, 320 hoch). Bei einem fast
     GLEICHSEITIGEN wäre die Frage nach „dem" Winkel falsch gestellt —
     siehe §1b —, hier ist die Spitze eindeutig. */
  const lagen = [-150, -120, -90, -60, -30, 30, 60, 90, 120, 150, 180, 15];
  const schlecht: string[] = [];
  const eckenSchlecht: string[] = [];
  for (const grad of lagen) {
    const form = S.recognize(dreieck(300, 380, 200, 320, grad));
    if (!form || form.art !== 'triangle') { schlecht.push(grad + ': ' + JSON.stringify(form)); continue; }
    /* 180 und −180 sind dieselbe Lage. */
    const d = Number(form.dreh) || 0;
    const ab = Math.min(Math.abs(d - grad), Math.abs(Math.abs(d - grad) - 360));
    if (ab > 5) schlecht.push(grad + ' → ' + d);
    const soll = G.drehePunkte(
      [[300, 380 - 160], [300 + 100, 380 + 160], [300 - 100, 380 + 160]] as any, [300, 380], grad);
    const ab2 = eckenAbstand(markenEcken(form), soll as number[][]);
    if (ab2 > 9) eckenSchlecht.push(grad + ': ' + Math.round(ab2));
  }
  gleich('Bei zwölf Lagen rundum stimmt der Winkel auf fünf Grad', schlecht, []);
  gleich('… und die drei Ecken der Marke liegen, wo die gezogenen lagen (unter 9 Punkten)',
    eckenSchlecht, []);
  /* Und die Grundseite bleibt die Grundseite: Breite und Höhe der Marke. */
  const f90 = S.recognize(dreieck(300, 380, 200, 320, 90));
  const b90 = f90?.pts ? { w: Math.round(Math.abs(f90.pts[1][0] - f90.pts[0][0])),
                           h: Math.round(Math.abs(f90.pts[1][1] - f90.pts[0][1])) } : null;
  p('Die Marke behält Grundseite und Höhe (200 × 320), nicht den aufrechten Kasten',
    !!b90 && Math.abs(b90.w - 200) < 12 && Math.abs(b90.h - 320) < 12, JSON.stringify(f90));
}

/* ═══ §1b Das fast gleichseitige Dreieck ═══════════════════════════════════ */
console.log('\n§1b Ein fast gleichseitiges Dreieck bekommt die kleinste Drehung');
{
  /* DAS FAND DAS BILD, KEIN PRÜFLAUF (§55.1). Bei einem gleichseitigen
     Dreieck sind alle drei Ecken gleich gute Spitzen — die Wahl zwischen
     ihnen entscheidet ein Hundertstel Längenunterschied, und die drei
     Antworten liegen 120° auseinander. Ein AUFRECHT gezogenes Dreieck kam
     im ersten Anlauf mit `dreh: −120` heraus. Es sieht gleich aus, aber
     es ist eine Behauptung über etwas, das der Mensch nicht getan hat —
     und beim nächsten Drehen um 10° stünde die Zahl schief in der Welt.

     Gewählt wird deshalb unter den gleich guten Spitzen die mit der
     KLEINSTEN DREHUNG: dieselbe Figur, ein Feld weniger. */
  const gleichseitig = (grad: number): any => S.recognize(dreieck(300, 300, 200, 173, grad));
  const auf = gleichseitig(0);
  p('Aufrecht gezogen bleibt aufrecht — ohne dreh-Feld',
    auf?.art === 'triangle' && auf.dreh === undefined, JSON.stringify(auf));
  const schlecht: string[] = [];
  for (const grad of [30, 90, 145, 180, -60, -100]) {
    const form = gleichseitig(grad);
    if (!form || form.art !== 'triangle') { schlecht.push(grad + ': keine Form'); continue; }
    const d = Number(form.dreh) || 0;
    /* Erlaubt ist der Winkel selbst oder eine seiner zwei Drittelungen —
       ein gleichseitiges Dreieck ist um 120° gedreht dasselbe Bild. */
    const passt = [0, 120, -120, 240, -240].some(k =>
      Math.abs(((grad - k - d + 540) % 360) - 180) < 6);
    if (!passt) schlecht.push(grad + ' → ' + d);
    /* Und der Betrag ist der kleinste der drei Möglichkeiten. */
    if (Math.abs(d) > 61) schlecht.push(grad + ' → ' + d + ' (nicht die kleinste)');
    /* Egal welche: die drei Ecken müssen liegen, wo sie lagen. */
    const soll = G.drehePunkte(
      [[300, 300 - 86.5], [300 + 100, 300 + 86.5], [300 - 100, 300 + 86.5]] as any, [300, 300], grad);
    if (eckenAbstand(markenEcken(form), soll as number[][]) > 10) schlecht.push(grad + ': Ecken daneben');
  }
  gleich('Sechs Lagen: dieselbe Figur, und immer die kleinste der drei Drehungen', schlecht, []);
}

/* ═══ §2 Aufrecht bleibt aufrecht ══════════════════════════════════════════ */
console.log('\n§2 Aufrecht bleibt aufrecht');
{
  const auf = S.recognize(dreieck(300, 300, 200, 170, 0));
  p('Ein aufrechtes Dreieck bekommt KEIN dreh-Feld', auf?.art === 'triangle' && auf.dreh === undefined,
    JSON.stringify(auf));
  p('… und seine zwei Punkte sind der Kasten des Zugs, wie in E471',
    Math.abs(auf.pts[0][0] - 200) < 6 && Math.abs(auf.pts[1][1] - 385) < 6, JSON.stringify(auf.pts));
  const fast = S.recognize(dreieck(300, 300, 200, 170, 2.5));
  p('Zweieinhalb Grad schief zählt als aufrecht — sonst stünde in jeder Sicherung ein Feld für nichts',
    fast?.art === 'triangle' && fast.dreh === undefined, JSON.stringify(fast));
  const knapp = S.recognize(dreieck(300, 300, 200, 170, 12));
  p('Zwölf Grad nicht mehr', knapp?.art === 'triangle' && Math.abs(Number(knapp.dreh) - 12) < 5,
    JSON.stringify(knapp));
}

/* ═══ §3 Ungleichschenklig und die anderen Formen ══════════════════════════ */
console.log('\n§3 Was kein Dreieck ist, wird keines');
{
  /* ZWEI GERADE KANTEN UND EIN BAUCH. Das aussiebende Mass ist NICHT die
     Gleichschenkligkeit (fast jedes von Hand gezogene Dreieck ist um eine
     seiner Ecken herum gleichschenklig genug — das hat dieser Prüflauf im
     ersten Anlauf gezeigt), sondern die Frage, ob die Punkte überhaupt an
     drei Kanten liegen. Hier tut ein Drittel von ihnen das nicht. */
  const bauch: number[][] = [];
  {
    const C = [260, 220], A = [100, 400];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const mx = C[0]! + (A[0]! - C[0]!) * t, my = C[1]! + (A[1]! - C[1]!) * t;
      /* quer zur Sehne ausbeulen */
      const dx = A[0]! - C[0]!, dy = A[1]! - C[1]!;
      const l = Math.hypot(dx, dy);
      const s2 = Math.sin(t * Math.PI) * 80;
      bauch.push([mx - dy / l * s2, my + dx / l * s2]);
    }
  }
  const krumm = [...kante([100, 400], [420, 400], 18), ...kante([420, 400], [260, 220], 18),
                 ...bauch, [100, 400]];
  const f = S.recognize(krumm);
  p('Zwei gerade Kanten und ein Bauch werden kein Dreieck', !f || f.art !== 'triangle', JSON.stringify(f));

  /* Und der Zweig fällt DURCH: Kreis und Rechteck kommen weiter dahinter an. */
  const kreis: number[][] = [];
  for (let i = 0; i <= 40; i++) kreis.push([300 + Math.cos(i / 40 * 2 * Math.PI) * 90, 300 + Math.sin(i / 40 * 2 * Math.PI) * 90]);
  gleich('Ein Kreis bleibt eine Ellipse', S.recognize(kreis)?.art, 'ellipse');
  const rechteck = [...kante([60, 60], [260, 60], 12), ...kante([260, 60], [260, 240], 12),
                    ...kante([260, 240], [60, 240], 12), ...kante([60, 240], [60, 60], 12), [60, 60]];
  gleich('Ein Rechteck bleibt ein Rechteck', S.recognize(rechteck)?.art, 'rectangle');
  const linie = kante([60, 60], [400, 200], 30);
  gleich('Eine Linie bleibt eine Linie', S.recognize(linie)?.art, 'line');
}

/* ═══ §4 Auf dem Blatt ═════════════════════════════════════════════════════ */
console.log('\n§4 Auf dem Blatt gezogen und gehalten');
const browser = await chromium.launch();
const fehler: string[] = [];
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:formen', true);
    Store.setMeta('zeichnen:kritzel', false);
    const seite = Store.addPage(null, { text: 'Formenblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.click('.blatt-werk [data-wz="stift"]');
  const pfad = dreieck(300, 320, 200, 170, 55);
  await s.evaluate(async (punkte: number[][]) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = f.getScreenCTM()!;
    const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!; const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ: string, q: number[]) => { const c = px(q); return new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: c.x, clientY: c.y, pointerId: 7, pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pressure: 0.6 }); };
    f.dispatchEvent(ev('pointerdown', punkte[0]!));
    for (let i = 1; i < punkte.length; i++) f.dispatchEvent(ev('pointermove', punkte[i]!));
    /* GEHALTEN — sonst bleibt es ein Strich (E355). */
    await new Promise(r => setTimeout(r, 700));
    f.dispatchEvent(ev('pointerup', punkte[punkte.length - 1]!));
    await new Promise(r => setTimeout(r, 500));
  }, pfad);
  const m = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify((b.marken || [])[0] || null);
  })()`) as string);
  p('Aus dem Zug wird ein Dreieck', m?.art === 'triangle', JSON.stringify(m));
  p('… mit dem Winkel, in dem es gezogen wurde (≈ 55°)',
    Math.abs(Number(m?.dreh) - 55) < 8, JSON.stringify({ dreh: m?.dreh }));
  p('… und ohne Druckwerte und Stil (E355)',
    m && m.pressure === undefined && m.stil === undefined, JSON.stringify(Object.keys(m || {})));
  const knoten = String(await s.evaluate(`(() => {
    const n = document.querySelector('.blatt-marken [data-sid]');
    return n ? String(n.getAttribute('transform') || '') : '';
  })()`));
  p('Sein Knoten steht schief', /^rotate\(5[0-9]/.test(knoten), knoten);
  /* Und der Rahmen aus E474 liegt auf ihm, nicht weit darum. */
  await s.click('.blatt-werk [data-wz="select"]');
  await s.evaluate(() => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const el = f.querySelector('[data-sid]')!;
    const r = (el as SVGGraphicsElement).getBoundingClientRect();
    const ev = (t: string) => new PointerEvent(t, { bubbles: true, cancelable: true,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerId: 7,
      pointerType: 'mouse', isPrimary: true, button: 0, buttons: t === 'pointerup' ? 0 : 1 });
    el.dispatchEvent(ev('pointerdown')); f.dispatchEvent(ev('pointerup'));
  });
  await s.waitForTimeout(400);
  p('Der Auswahlrahmen steht in einer gedrehten Gruppe (E474)',
    /^rotate\(5[0-9]/.test(String(await s.evaluate(`(() => {
      const g = document.querySelector('.blatt-marken g[data-ink-ui="selection"]');
      return g ? String(g.getAttribute('transform')) : '';
    })()`))));
  await s.close();
}

console.log('\n§5 Quellen');
p('`shapes.ts` kennt den gedrehten Zweig und gibt einen Winkel heraus',
  /const gedrehtesDreieck = \(\): Shape \| null/.test(lies('src/core/ink/shapes.ts'))
  && /dreh\?: number/.test(lies('src/core/ink/shapes.ts')));
p('`marken.ts` übernimmt ihn — und löscht ihn, wenn keiner kommt',
  /if \(form\.dreh\) mark\.dreh = form\.dreh; else delete mark\.dreh;/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das erzeugte JS trägt es', /gedrehtesDreieck/.test(lies('quell/core/ink/shapes.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
