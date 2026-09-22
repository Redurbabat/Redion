/* Suite 561 — Der Füller läuft spitz aus (E673)
 * ============================================================================
 * Redur, 21. September 2026 (wörtlich): „ich will das du die stift und
 * heichenb verbessern, und gleich wie goodnotes machen".
 *
 * ─── WAS MAN BEIM ERSTEN „e" SIEHT ──────────────────────────────────────────
 * GoodNotes' Füller setzt mit der Spitze auf und läuft beim Abheben aus.
 * Redions Füller (E351) hatte an beiden Enden einen HALBKREIS IN VOLLER
 * BREITE: `outline` und `Feder.d()` ziehen die Kappe mit dem Radius der
 * ersten und der letzten halben Breite, und `druckFaktor` liess den Füller
 * nie unter 55 % seiner Grundbreite. Jeder Buchstabe endete mit einem
 * runden Klecks. Das war der Unterschied, den man sieht, ohne zu messen.
 *
 * Seit E673 gibt es EINE Kurve dafür — `InkGeometry.spitzeFaktor` — und
 * EINE Stelle, die die halben Breiten eines Flächenstrichs rechnet
 * (`halbeBreiten` in marken.ts, für Bildschirm UND PDF; vorher standen sie
 * zweimal da, derselbe Fund wie bei `deckungVon`, E623). Die Spitze ist
 * ein AUSSEHEN, kein Druckwert: `pressure` bleibt, was der Sensor sagte.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Ein gerader Füllerstrich mit gleichem Druck: die Mitte ist so
 *      breit wie vorher, Anfang und Ende sind unter 35 % davon, und die
 *      Breite steigt vom Anfang her monoton an. Bildschirm-Bogen und
 *      PDF-Kontur sagen dieselbe Spitze.
 *   2  Der Pinsel läuft feiner aus als der Füller; der Bleistift läuft
 *      GAR NICHT aus — Graphit hat keine Feder.
 *   3  Ein kurzer Strich (ein Punkt, ein Haken) behält seine Mitte: die
 *      Spitze schrumpft mit dem Strich, statt ihn zu verschlucken.
 *   4  Alter Bestand und die Linie bleiben, wie sie waren (§9).
 *   5  Die Spitze steht im Register `STIFTE`, nicht als Sonderfall im
 *      Zeichner (§8) — Füller und Pinsel tragen sie, die anderen nicht.
 *   6  NASS: während der Stift noch aufliegt, ist der Anfang schon spitz
 *      und das Ende noch voll (es weiss noch nicht, dass es das Ende ist);
 *      nach dem Abheben sind beide spitz, und der gespeicherte Druck ist
 *      unverändert.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test561.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const r2 = (v: number): number => Math.round(v * 100) / 100;

const browser = await chromium.launch();
const fehler: string[] = [];
const s: Page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('dialog', d => d.dismiss().catch(() => {}));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof InkGeometry !== 'undefined'");
await s.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
})()`);

/* ── DIE MESSUNG: Breiten aus der PDF-Kontur, Bögen aus dem Bildschirm ──────
   `alsAnnotation` liefert die Kontur als Vieleck: erst die linke Kante
   (n Punkte), dann sieben Kappenpunkte, dann die rechte Kante RÜCKWÄRTS,
   dann sieben Kappenpunkte. Die Breite an Punkt i ist der Abstand von
   links[i] zu rechts[i] = Vieleck[2n+6-i]. Der Bildschirmpfad hat zwei
   `A r r`-Bögen: der erste ist die Endkappe, der zweite die Anfangskappe —
   ihr Radius ist die halbe Breite dort. */
const MESSEN = `(mark) => {
  const n = mark.pts.length;
  const k = Marken.alsAnnotation(mark).kontur[0] || [];
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const breiten = Array.from({ length: n }, (_q, i) => k[i] && k[2 * n + 6 - i] ? d(k[i], k[2 * n + 6 - i]) : NaN);
  const node = Marken.zeichneMarke(mark);
  const pfad = node.getAttribute('d') || '';
  const boegen = [...pfad.matchAll(/A([\\d.]+) [\\d.]+ 0 0 1/g)].map(m => Number(m[1]));
  return { n, konturPunkte: k.length, breiten, boegen, fill: node.getAttribute('fill'), tag: node.tagName,
           ende: boegen[0], anfang: boegen[1] };
}`;

/** Ein gerader Strich von x0 bis x1 auf y=100, Schrittweite 1 pt, fester Druck. */
const gerade = (stil: string | null, x0: number, x1: number, schritt = 1, druck = 0.5, breite = 2.4) => {
  const n = Math.max(2, Math.round((x1 - x0) / schritt) + 1);
  const mark: Record<string, unknown> = { id: 'g-' + (stil || 'linie'), art: 'stift', farbe: '#1a1a1a', breite,
    pts: Array.from({ length: n }, (_v, i) => [r2(x0 + i * schritt), 100]),
    pressure: Array.from({ length: n }, () => druck) };
  if (stil) mark['stil'] = stil;
  return mark;
};
const messen = (mark: unknown) => s.evaluate(`(${MESSEN})(${JSON.stringify(mark)})`) as Promise<any>;

/* ======================================================================== */
console.log('\n1 · Ein gerader Füllerstrich: die Mitte bleibt, die Enden laufen aus');
const f = await messen(gerade('fueller', 100, 300));
const mitteI = Math.floor(f.n / 2);
const mitte = f.breiten[mitteI];
const erwartetMitte = await s.evaluate("2.4 * Marken.druckFaktor('fueller', 0.5)") as number;
console.log(`    Breite: Anfang ${r2(f.breiten[0])} · nach 3 pt ${r2(f.breiten[3])} · Mitte ${r2(mitte)} · Ende ${r2(f.breiten[f.n - 1])} · Bögen ${JSON.stringify(f.boegen)}`);
p('Die Kontur ist da und geschlossen (Fläche, nicht Linie)',
  f.tag === 'path' && f.fill === '#1a1a1a' && f.konturPunkte === 2 * f.n + 14, JSON.stringify({ tag: f.tag, fill: f.fill, k: f.konturPunkte, n: f.n }));
p('Die Mitte ist so breit wie vorher — die Spitze nimmt der Mitte nichts',
  Math.abs(mitte - erwartetMitte) < 0.05, `ist ${r2(mitte)}, soll ${r2(erwartetMitte)}`);
p('Der Anfang ist unter 35 % der Mitte — die Feder setzt mit der Spitze auf',
  f.breiten[0] < mitte * 0.35, `Anfang ${r2(f.breiten[0])} gegen Mitte ${r2(mitte)}`);
p('Das Ende ist unter 35 % der Mitte — die Tinte läuft aus',
  f.breiten[f.n - 1] < mitte * 0.35, `Ende ${r2(f.breiten[f.n - 1])} gegen Mitte ${r2(mitte)}`);
const steigt = f.breiten.slice(0, 9).every((w: number, i: number, a: number[]) => i === 0 || w >= a[i - 1]! - 1e-6);
p('Vom Anfang her wird der Strich monoton breiter, und nach 3 pt ist er schon über der Hälfte',
  steigt && f.breiten[3] > mitte * 0.5 && f.breiten[3] < mitte, f.breiten.slice(0, 9).map(r2).join(' '));
p('Der Bildschirm-Bogen am Anfang ist die halbe Konturbreite dort (Bildschirm = PDF)',
  Math.abs(f.anfang * 2 - f.breiten[0]) < 0.06, `Bogen ${f.anfang} × 2 gegen ${r2(f.breiten[0])}`);
p('… und am Ende ebenso',
  Math.abs(f.ende * 2 - f.breiten[f.n - 1]) < 0.06, `Bogen ${f.ende} × 2 gegen ${r2(f.breiten[f.n - 1])}`);

/* ======================================================================== */
console.log('\n2 · Pinsel feiner als Füller; der Bleistift läuft nicht aus');
const pi = await messen(gerade('pinsel', 100, 300));
const bl = await messen(gerade('bleistift', 100, 300));
const anteil = (m: any) => m.breiten[0] / m.breiten[Math.floor(m.n / 2)];
console.log(`    Anfang/Mitte: Füller ${r2(anteil(f))} · Pinsel ${r2(anteil(pi))} · Bleistift ${r2(anteil(bl))}`);
p('Der Pinsel läuft feiner aus als der Füller', anteil(pi) < anteil(f) && anteil(pi) < 0.2,
  `Pinsel ${r2(anteil(pi))}, Füller ${r2(anteil(f))}`);
p('Der Bleistift hat keine Feder: Anfang so breit wie die Mitte',
  Math.abs(anteil(bl) - 1) < 0.02, `Anteil ${r2(anteil(bl))}`);

/* ======================================================================== */
console.log('\n3 · Ein kurzer Strich behält seine Mitte');
const punkt = await messen(gerade('fueller', 100, 102, 0.5));       /* 2 pt lang, 5 Punkte */
const haken = await messen(gerade('fueller', 100, 108, 1));         /* 8 pt lang */
const pm = punkt.breiten[Math.floor(punkt.n / 2)], hm = haken.breiten[Math.floor(haken.n / 2)];
console.log(`    Punkt (2 pt): Anfang ${r2(punkt.breiten[0])} · Mitte ${r2(pm)} — Haken (8 pt): Anfang ${r2(haken.breiten[0])} · Mitte ${r2(hm)}`);
p('Ein 2-pt-Punkt ist in der Mitte noch mindestens halb so breit wie ein langer Strich',
  pm >= mitte * 0.5, `Mitte ${r2(pm)} gegen ${r2(mitte * 0.5)}`);
p('… und trotzdem spitzer am Anfang als in der Mitte', punkt.breiten[0] < pm, `${r2(punkt.breiten[0])} gegen ${r2(pm)}`);
p('Ein 8-pt-Haken ist in der Mitte voll breit', Math.abs(hm - erwartetMitte) < 0.1, `Mitte ${r2(hm)}`);
/* DAS BILD HAT ES GEZEIGT (§55.1): mit dem 5-pt-Füller war der 2-pt-Punkt
   ein senkrechter Splitter — die Spitze war zwar KURZ, aber immer noch
   SPITZ (auf ein Viertel). Ein Strich, der kürzer ist als seine Feder,
   ist ein Klecks, keine Feder. */
const breit = await messen(gerade('fueller', 100, 102, 0.5, 0.5, 5));
const bm = breit.breiten[Math.floor(breit.n / 2)];
console.log(`    Punkt (2 pt) mit 5-pt-Füller: Anfang ${r2(breit.breiten[0])} · Mitte ${r2(bm)}`);
p('Ein Punkt des breiten Füllers ist ein Klecks: der Rand hat über 80 % der Mitte',
  breit.breiten[0] > bm * 0.8 && bm > 4, `Anfang ${r2(breit.breiten[0])} gegen Mitte ${r2(bm)}`);
const breitHaken = await messen(gerade('fueller', 100, 112, 1, 0.5, 5));
const bhm = breitHaken.breiten[Math.floor(breitHaken.n / 2)];
console.log(`    Haken (12 pt) mit 5-pt-Füller: Anfang ${r2(breitHaken.breiten[0])} · Mitte ${r2(bhm)}`);
p('… und ein 12-pt-Haken desselben Füllers läuft trotzdem sichtbar aus (Rand unter 70 % der Mitte)',
  breitHaken.breiten[0] < bhm * 0.7 && breitHaken.breiten[0] > bm * 0.25, `Anfang ${r2(breitHaken.breiten[0])} gegen Mitte ${r2(bhm)}`);

/* ======================================================================== */
console.log('\n4 · Alter Bestand und die Linie bleiben, wie sie waren');
const alt = await s.evaluate(`(() => {
  const n1 = Marken.zeichneMarke({ id: 'alt', art: 'stift', farbe: '#2f7ed8', breite: 2.4,
    pts: [[10, 10], [60, 20], [110, 10]], pressure: [0.5, 0.5, 0.5] });
  const n2 = Marken.zeichneMarke({ id: 'zwei', art: 'stift', stil: 'fueller', farbe: '#2f7ed8', breite: 2.4,
    pts: [[10, 10], [60, 20]], pressure: [0.5, 0.5] });
  return { altFill: n1.getAttribute('fill'), altSw: n1.getAttribute('stroke-width'),
           zweiFill: n2.getAttribute('fill'), zweiD: n2.getAttribute('d') };
})()`) as any;
p('Eine Marke ohne Stil ist weiter die Linie mit EINER Breite', alt.altFill === 'none' && Math.abs(Number(alt.altSw) - 2.4) < 0.01, JSON.stringify(alt));
p('Ein Füller mit zwei Punkten ist weiter die Linie (kein Absturz, keine Fläche)', alt.zweiFill === 'none' && /^M10 10 L60 20$/.test(String(alt.zweiD)), JSON.stringify(alt));

/* ======================================================================== */
console.log('\n5 · Die Spitze steht im Register (§8)');
const reg = await s.evaluate(`Marken.STIFTE.map(x => ({ id: x.id, spitze: x.spitze ?? null }))`) as Array<{ id: string; spitze: number | null }>;
console.log('    ' + reg.map(x => `${x.id}:${x.spitze}`).join(' · '));
const mitSpitze = reg.filter(x => typeof x.spitze === 'number' && x.spitze > 0 && x.spitze < 1).map(x => x.id);
p('Füller und Pinsel tragen eine Spitze zwischen 0 und 1', JSON.stringify(mitSpitze) === JSON.stringify(['fueller', 'pinsel']), JSON.stringify(mitSpitze));
p('Kugel, Bleistift, Schutzleiter, Leiter tragen keine', reg.filter(x => x.spitze !== null).length === 2);

/* ======================================================================== */
console.log('\n6 · Nass: der Anfang ist schon spitz, das Ende erst nach dem Abheben');
const blattId = await s.evaluate(`(async () => {
  Store.setMeta('zeichnen:stift', 'fueller');
  const seite = Store.addPage(null, { text: 'Spitze', icon: '🖋' });
  const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 400,
    raumVersion: 1, marken: [] });
  await Store.flush();
  App.oeffne(seite.id);
  return b.id;
})()`) as string;
await s.waitForSelector('.blatt-marken', { timeout: 20000 });
await s.waitForTimeout(600);
await s.click('.blatt-werk [data-wz="stift"]');
await s.waitForTimeout(200);
const nass = await s.evaluate(`(async () => {
  const svg = document.querySelector('.blatt-marken');
  const ctm = svg.getScreenCTM();
  const zu = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
  const ev = (typ, x, y) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'pen', pressure: typ === 'pointerup' ? 0 : 0.5,
    isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
  svg.dispatchEvent(ev('pointerdown', 120, 200));
  for (let i = 1; i <= 40; i++) {
    svg.dispatchEvent(ev('pointermove', 120 + i * 5, 200));
    await new Promise(f => setTimeout(f, 4));
  }
  await new Promise(f => requestAnimationFrame(() => setTimeout(f, 40)));
  const nassKnoten = [...svg.querySelectorAll('path[data-ink-stil="fueller"]')].pop();
  const nassD = nassKnoten ? nassKnoten.getAttribute('d') || '' : '';
  const boegen = [...nassD.matchAll(/A([\\d.]+) [\\d.]+ 0 0 1/g)].map(m => Number(m[1]));
  svg.dispatchEvent(ev('pointerup', 320, 200));
  await new Promise(f => setTimeout(f, 200));
  const b = Store.getBlock('${blattId}');
  const m = (b.marken || [])[b.marken.length - 1] || null;
  const trocken = m ? document.querySelector('.blatt-marken [data-sid="' + m.id + '"]') : null;
  const trockenD = trocken ? trocken.getAttribute('d') || '' : '';
  const boegenTrocken = [...trockenD.matchAll(/A([\\d.]+) [\\d.]+ 0 0 1/g)].map(m => Number(m[1]));
  return { nass: { ende: boegen[0], anfang: boegen[1], n: boegen.length },
           trocken: { ende: boegenTrocken[0], anfang: boegenTrocken[1], n: boegenTrocken.length },
           druck: m ? m.pressure.map(Number) : [], stil: m?.stil, punkte: m ? m.pts.length : 0 };
})()`) as any;
const halbVoll = erwartetMitte / 2;
console.log(`    nass: Anfang ${nass.nass.anfang} · Ende ${nass.nass.ende} — trocken: Anfang ${nass.trocken.anfang} · Ende ${nass.trocken.ende} — voll wäre ${r2(halbVoll)} · Druck ${JSON.stringify(nass.druck.slice(0, 3))}…`);
p('Der nasse Strich ist eine Fläche mit zwei Bögen', nass.nass.n === 2 && nass.stil === 'fueller', JSON.stringify(nass.nass));
p('Nass ist der Anfang schon spitz (unter 35 % der vollen halben Breite)',
  nass.nass.n === 2 && nass.nass.anfang < halbVoll * 0.35, `Anfang ${nass.nass.anfang} gegen ${r2(halbVoll)}`);
p('Nass ist das Ende noch voll — es weiss noch nicht, dass es das Ende ist',
  nass.nass.n === 2 && nass.nass.ende > halbVoll * 0.9, `Ende ${nass.nass.ende} gegen ${r2(halbVoll)}`);
p('Nach dem Abheben sind beide Enden spitz',
  nass.trocken.n === 2 && nass.trocken.anfang < halbVoll * 0.35 && nass.trocken.ende < halbVoll * 0.35, JSON.stringify(nass.trocken));
p('Der gespeicherte Druck ist unverändert — die Spitze ist ein Aussehen, kein Druckwert (§9)',
  nass.druck.length === nass.punkte && nass.druck.length > 2 && nass.druck.every((d: number) => d > 0.4),
  JSON.stringify(nass.druck));
p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
