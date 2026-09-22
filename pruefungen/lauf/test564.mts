/* Suite 564 — Der Glätter hält die Ecke (E676)
 * ============================================================================
 * Redur, 21. September 2026 (wörtlich): „ich will das du die stift und
 * heichenb verbessern, und gleich wie goodnotes machen".
 *
 * ─── DIE SPITZE DES „M" ─────────────────────────────────────────────────────
 * `InkStroke.glaetter` ist ein Filter erster Ordnung mit tempoabhängigem
 * Anteil (E376, E504): bei langsamer Hand mittelt er stark, damit das
 * Zittern verschwindet. Ein Filter, der mittelt, kennt keine Ecke — an der
 * Spitze eines „M", eines „v", eines Häkchens läuft er WEITER in die alte
 * Richtung, während die Hand schon zurückkommt, und rundet ab, was spitz
 * gemeint war. Die Vorhersage (`KEHRE`) erkennt die Kehre seit E376; der
 * Glätter nicht.
 *
 * Seit E676 merkt sich der Glätter die Richtung der Hand — gemessen über
 * eine feste STRECKE, nicht über Punkte (E504: sonst hinge die Ecke an der
 * Abtastrate). Kippt die Richtung (cos < KEHRE), springt er auf den rohen
 * Punkt, der am weitesten in der alten Richtung lag: die Ecke. Danach
 * mittelt er weiter wie zuvor.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Ein langsam gezogenes Zickzack (0,125 px/ms, drei Spitzen): der
 *      geglättete Weg kommt jeder Spitze näher als 1,5 px. Vorher waren
 *      es 2,62 (60 Hz) und 2,23 (240 Hz) — gemessen, nicht geschätzt.
 *   2  Was nicht kaputtgehen darf: das Zittern der stehenden Hand wird
 *      weiter dreimal kleiner, ein schneller Zug bleibt am Stift, ein
 *      sanfter Bogen wird NICHT für eine Ecke gehalten, und der Aufsetz-
 *      punkt geht roh durch (dieselben Zusagen wie test366 §3).
 *   3  Ratenunabhängig: dasselbe Zickzack mit 60 und 240 Hz abgetastet
 *      trifft die Spitzen gleich gut (E504).
 *   4  VOM GLÄTTER BIS AUFS PAPIER. Das Bild (§55.1) zeigte ein „M" mit
 *      spitzen Gipfeln und einem runden Tal, obwohl der Glätter alle drei
 *      Ecken traf: `finish` ersetzte bei weniger als acht RDP-Stützpunkten
 *      die Stützpunkte durch acht GLEICHMÄSSIGE (E115) — und warf damit
 *      die Ecken weg, die RDP behalten hatte; das Tal lag 23,7 px neben
 *      dem nächsten gespeicherten Punkt. Und der Umriss zieht durch jeden
 *      Stützpunkt eine Q-Kurve über die Mittelpunkte — auch durch eine
 *      Ecke, die dadurch rund wird. Ein langsam gezogenes „M" mit echten
 *      Zeigerereignissen: die gespeicherte Mittellinie trifft jede Ecke
 *      (< 1,5 px), und der gezeichnete Umriss kommt jeder Ecke so nah,
 *      wie es die halbe Breite erlaubt.
 *
 * §1–§3 laufen ohne Browser und ohne Port (der Kern kennt weder DOM noch
 * Uhr); §4 braucht das Blatt — `listen(0)` (L205).
 *
 *   node pruefungen/lauf/test564.mts
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
const S: any = (globalThis as any).InkStroke;

/** Ein Zickzack mit drei Spitzen, abgetastet mit `schritt` px je Meldung. */
const zickzack = (schritt: number): { pts: number[][]; spitzen: number[][] } => {
  const ecken = [[0, 0], [30, 40], [60, 0], [90, 40], [120, 0]];
  const pts: number[][] = [];
  for (let e = 0; e < ecken.length - 1; e++) {
    const [ax, ay] = ecken[e]!, [bx, by] = ecken[e + 1]!;
    const laenge = Math.hypot(bx! - ax!, by! - ay!);
    const n = Math.round(laenge / schritt);
    for (let i = 0; i < n; i++) pts.push([ax! + (bx! - ax!) * i / n, ay! + (by! - ay!) * i / n]);
  }
  pts.push(ecken[ecken.length - 1]!);
  return { pts, spitzen: ecken.slice(1, -1) };
};
/** Wie nah kommt ein Weg jeder Spitze? Der grösste Abstand von allen. */
const eckenAbstand = (weg: number[][], spitzen: number[][]): number => {
  let schlechtest = 0;
  for (const s of spitzen) {
    let nah = Infinity;
    for (let i = 1; i < weg.length; i++) {
      /* Abstand Punkt–Strecke, damit ein Weg, der die Spitze zwischen zwei
         Punkten schneidet, nicht bestraft wird. */
      const [ax, ay] = weg[i - 1]!, [bx, by] = weg[i]!;
      const dx = bx! - ax!, dy = by! - ay!;
      const l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((s[0]! - ax!) * dx + (s[1]! - ay!) * dy) / l2));
      nah = Math.min(nah, Math.hypot(s[0]! - (ax! + dx * t), s[1]! - (ay! + dy * t)));
    }
    schlechtest = Math.max(schlechtest, nah);
  }
  return schlechtest;
};
const glaetten = (pts: number[][], dt: number): number[][] => {
  const gl = S.glaetter(pts[0]);
  return pts.map(q => gl(q, dt));
};

/* ======================================================================== */
console.log('\n1 · Ein langsames Zickzack: der Glätter kommt an die Spitzen');
const z60 = zickzack(2);                       /* 2 px je 16 ms = 0,125 px/ms */
const roh60 = eckenAbstand(z60.pts, z60.spitzen);
const glatt60 = eckenAbstand(glaetten(z60.pts, 16), z60.spitzen);
console.log(`    Abstand zur Spitze: roh ${r2(roh60)} px · geglättet ${r2(glatt60)} px`);
p('Der rohe Weg trifft die Spitzen (Aufbau des Laufs stimmt)', roh60 < 0.01, `${r2(roh60)} px`);
p('Der geglättete Weg kommt jeder Spitze näher als 1,5 px', glatt60 < 1.5, `${r2(glatt60)} px`);

/* ======================================================================== */
console.log('\n2 · Was nicht kaputtgehen darf');
let s2 = 7;
const rausch = (): number => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff - 0.5; };
const wackel = (a: number[][]): number => {
  let summe = 0;
  for (let i = 2; i < a.length; i++) {
    summe += Math.hypot(a[i]![0]! - 2 * a[i - 1]![0]! + a[i - 2]![0]!, a[i]![1]! - 2 * a[i - 1]![1]! + a[i - 2]![1]!);
  }
  return summe / Math.max(1, a.length - 2);
};
const roh: number[][] = [], sanft: number[][] = [];
const gl = S.glaetter([0, 0]);
for (let i = 0; i < 300; i++) {
  const q: [number, number] = [i * 0.05 + rausch() * 0.8, rausch() * 0.8];
  roh.push(q); sanft.push(gl(q, 16));
}
const vorher = wackel(roh), nachher = wackel(sanft);
console.log(`    Zittern ${vorher.toFixed(3)} → ${nachher.toFixed(3)} px je Schritt`);
p('Das Zittern der stehenden Hand wird weiter mindestens dreimal kleiner (test366 §3)', nachher * 3 < vorher, `${vorher.toFixed(3)} → ${nachher.toFixed(3)}`);

const gl2 = S.glaetter([0, 0]);
let rueck = 0;
for (let i = 1; i <= 40; i++) {
  const q: [number, number] = [i * 12, 0];
  const w = gl2(q, 16);
  if (i > 10) rueck = Math.max(rueck, Math.hypot(q[0] - w[0]!, q[1] - w[1]!));
}
p('Im schnellen Zug bleibt der Strich am Stift (unter 5 px Rückstand)', rueck < 5, `${r2(rueck)} px`);

/* Ein sanfter Bogen — ein „U" mit 40 px Radius, langsam — hat keine Ecke.
   Der Glätter darf darin keine sehen: der geglättete Weg bleibt glatt
   (kein Knick, gemessen als zweite Differenz). */
const bogen: number[][] = [];
for (let i = 0; i <= 120; i++) {
  const a = Math.PI - Math.PI * i / 120;
  bogen.push([40 + Math.cos(a) * 40, Math.sin(a) * 40]);
}
const bogenGlatt = glaetten(bogen, 16);
const knick = wackel(bogenGlatt);
const knickRoh = wackel(bogen);
console.log(`    Bogen: zweite Differenz roh ${knickRoh.toFixed(3)} · geglättet ${knick.toFixed(3)} px`);
p('Ein sanfter Bogen wird nicht für eine Ecke gehalten (geglättet nicht kantiger als roh)', knick <= knickRoh * 1.2, `${knick.toFixed(3)} gegen ${knickRoh.toFixed(3)}`);

const gl3 = S.glaetter([100, 200]);
const erster = gl3([100, 200], 16);
p('Der Aufsetzpunkt geht unverändert durch', Math.abs(erster[0]! - 100) < 1e-9 && Math.abs(erster[1]! - 200) < 1e-9);

/* ======================================================================== */
console.log('\n3 · Ratenunabhängig (E504)');
const z240 = zickzack(0.5);                    /* 0,5 px je 4 ms = dasselbe Tempo */
const glatt240 = eckenAbstand(glaetten(z240.pts, 4), z240.spitzen);
console.log(`    Abstand zur Spitze: 60 Hz ${r2(glatt60)} px · 240 Hz ${r2(glatt240)} px`);
p('Mit 240 Hz kommt der Glätter den Spitzen genauso nah wie mit 60 Hz (±0,6 px)', Math.abs(glatt240 - glatt60) < 0.6, `${r2(glatt60)} gegen ${r2(glatt240)}`);
p('… und auch dort näher als 1,5 px', glatt240 < 1.5, `${r2(glatt240)} px`);

/* ======================================================================== */
console.log('\n4 · Vom Glätter bis aufs Papier: die Ecke überlebt das Absetzen');
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
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  const blatt = await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    Store.setMeta('zeichnen:stift', 'fueller');
    const seite = Store.addPage(null, { text: 'Die Ecke' });
    const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 320, raumVersion: 1, marken: [] });
    await Store.flush(); App.oeffne(seite.id); return b.id;
  })()`) as string;
  await s.waitForSelector('.blatt-marken', { timeout: 20000 });
  await s.waitForTimeout(500);
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(200);
  const r = await s.evaluate(`(async () => {
    const svg = document.querySelector('.blatt-marken'); const ctm = svg.getScreenCTM();
    const zu = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
    const ev = (typ, x, y) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'pen', pressure: typ === 'pointerup' ? 0 : 0.5,
      isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
    /* Ein „M": 2 px je 16 ms, wie eine langsame Hand. */
    const ecken = [[80, 220], [80, 120], [120, 200], [160, 120], [160, 220]]; const pts = [];
    for (let e = 0; e < ecken.length - 1; e++) { const [ax, ay] = ecken[e], [bx, by] = ecken[e + 1]; const n = Math.round(Math.hypot(bx - ax, by - ay) / 2);
      for (let i = 0; i < n; i++) pts.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n]); }
    pts.push(ecken[ecken.length - 1]);
    svg.dispatchEvent(ev('pointerdown', pts[0][0], pts[0][1]));
    for (let i = 1; i < pts.length; i++) { await new Promise(r => setTimeout(r, 16)); svg.dispatchEvent(ev('pointermove', pts[i][0], pts[i][1])); }
    const l = pts[pts.length - 1]; svg.dispatchEvent(ev('pointerup', l[0], l[1])); await new Promise(r => setTimeout(r, 250));
    const b = Store.getBlock('${blatt}'); const m = b.marken[b.marken.length - 1];
    /* Abstand Punkt–Polygonzug. */
    const abst = (weg, sp) => { let nah = Infinity; for (let i = 1; i < weg.length; i++) { const [ax, ay] = weg[i - 1], [bx, by] = weg[i];
      const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((sp[0] - ax) * dx + (sp[1] - ay) * dy) / l2));
      nah = Math.min(nah, Math.hypot(sp[0] - (ax + dx * t), sp[1] - (ay + dy * t))); } return nah; };
    /* Den gezeichneten Umriss abtasten: M/L/Q/A aus dem Pfad, Q-Kurven in 16 Schritten, Bögen als Gerade. */
    const node = document.querySelector('.blatt-marken [data-sid="' + m.id + '"]');
    const d = node ? node.getAttribute('d') || '' : '';
    const kontur = []; let cur = null;
    for (const t of d.matchAll(/([MLQAZ])([^MLQAZ]*)/g)) {
      const z = t[2].trim().split(/[\\s,]+/).filter(Boolean).map(Number);
      if (t[1] === 'M' || t[1] === 'L') { cur = [z[0], z[1]]; kontur.push(cur); }
      else if (t[1] === 'Q' && cur) { const [cx, cy, x, y] = z; const p0 = cur;
        for (let k = 1; k <= 16; k++) { const u = k / 16; kontur.push([(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * cx + u * u * x, (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * cy + u * u * y]); }
        cur = [x, y]; }
      else if (t[1] === 'A' && cur) { cur = [z[5], z[6]]; kontur.push(cur); }
    }
    const spitzen = [[80, 120], [120, 200], [160, 120]];
    return { n: m.pts.length, mitte: spitzen.map(sp => Math.round(abst(m.pts, sp) * 100) / 100),
             umriss: spitzen.map(sp => Math.round(abst(kontur, sp) * 100) / 100), konturPunkte: kontur.length, breite: m.breite };
  })()`) as { n: number; mitte: number[]; umriss: number[]; konturPunkte: number; breite: number };
  console.log(`    gespeichert: ${r.n} Punkte · Mittellinie neben den Ecken ${JSON.stringify(r.mitte)} px · Umriss ${JSON.stringify(r.umriss)} px (halbe Breite ${r.breite / 2})`);
  p('Die gespeicherte Mittellinie trifft jede der drei Ecken (unter 1,5 px)', r.mitte.every(v => v < 1.5), JSON.stringify(r.mitte));
  /* Der Umriss liegt eine halbe Breite neben der Mittellinie — näher als
     das kann er der Ecke nicht kommen; weiter als eine halbe Breite plus
     ein halbes Pixel heisst: die Ecke ist rund gezeichnet. */
  p('Der gezeichnete Umriss kommt jeder Ecke so nah, wie es die halbe Breite erlaubt (+0,5 px)',
    r.konturPunkte > 20 && r.umriss.every(v => v < r.breite / 2 + 0.5), JSON.stringify(r.umriss));
  p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));
  await browser.close(); server.close();
}

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
