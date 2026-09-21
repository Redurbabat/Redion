/* Suite 563 — Ein Stift, der kurz 0 meldet, bleibt ein Stift (E675)
 * ============================================================================
 * Redur, 21. September 2026 (wörtlich): „ich will das du die stift und
 * heichenb verbessern, und gleich wie goodnotes machen".
 *
 * ─── DER BUCKEL, DEN NIEMAND GEDRÜCKT HAT ───────────────────────────────────
 * `druckAus` entschied JE MELDUNG: `pointerType === 'pen' && pressure > 0`
 * heisst Sensor, alles andere heisst Tempo-Ersatz (E351, für Maus und
 * Finger). Ein Stift, der mitten im Strich eine Meldung mit 0 schickt —
 * am Rand des Sensors, beim Umgreifen, ein Aussetzer im Treiber —, fiel
 * für diese Meldung in den Tempo-Zweig: 0,6 beim ersten Mal (der Zweig
 * hat noch keinen Vorgänger), danach aus der Geschwindigkeit. Wer mit
 * leichter Hand (0,2) schrieb, bekam an der Stelle einen Punkt mit 0,6 —
 * dreimal so breit, ohne dass jemand gedrückt hätte. Und `druckArt` sagte
 * trotzdem „stift".
 *
 * Seit E675 gilt: ein Stift, der schon einmal Druck gemeldet hat, behält
 * bei einer 0 seinen letzten Sensorwert. Nur ein Stift, der NIE Druck
 * meldet (kein Sensor), bekommt den Tempo-Ersatz — und sagt dann ehrlich
 * „tempo".
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Ein Stiftstrich mit leichter Hand (0,2) und Aussetzern (0, 0) in
 *      der Mitte: kein gespeicherter Druck weicht von 0,2 ab, `druckArt`
 *      ist „stift", und die Fläche hat keinen Buckel.
 *   2  Ein Stift, der immer 0 meldet, bekommt den Tempo-Ersatz — und
 *      sagt „tempo", nicht „stift".
 *   3  Maus und Finger bleiben, wie sie waren: Tempo-Ersatz, „tempo".
 *   4  Der Aussetzer als ERSTE Meldung (beim Aufsetzen) ist kein Sensor:
 *      der Strich beginnt mit der Vorgabe und nimmt danach den Sensor.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test563.mts
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const r2 = (v: number): number => Math.round(v * 100) / 100;

const browser = await chromium.launch();
const fehler: string[] = [];
const s: Page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('dialog', d => d.dismiss().catch(() => {}));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Store !== 'undefined'");
const blattId = await s.evaluate(`(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  Store.setMeta('zeichnen:stift', 'fueller');
  const seite = Store.addPage(null, { text: 'Aussetzer', icon: '🖋' });
  const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 500,
    raumVersion: 1, marken: [] });
  await Store.flush();
  App.oeffne(seite.id);
  return b.id;
})()`) as string;
await s.waitForSelector('.blatt-marken', { timeout: 20000 });
await s.waitForTimeout(500);
await s.click('.blatt-werk [data-wz="stift"]');
await s.waitForTimeout(200);

/** Ein Strich aus Meldungen [x, y, druck] mit einer Zeigerart; gibt die
 *  gespeicherte Marke samt Konturbreiten zurück. */
const strich = (punkte: Array<[number, number, number]>, art: string) => s.evaluate(`(async () => {
  const punkte = ${JSON.stringify(punkte)};
  const svg = document.querySelector('.blatt-marken');
  const ctm = svg.getScreenCTM();
  const zu = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
  const ev = (typ, x, y, d) => new PointerEvent(typ, { ...zu(x, y), pointerType: '${art}', pressure: d,
    isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
  svg.dispatchEvent(ev('pointerdown', punkte[0][0], punkte[0][1], punkte[0][2]));
  for (let i = 1; i < punkte.length; i++) {
    await new Promise(f => setTimeout(f, 4));
    svg.dispatchEvent(ev('pointermove', punkte[i][0], punkte[i][1], punkte[i][2]));
  }
  const e = punkte[punkte.length - 1];
  svg.dispatchEvent(ev('pointerup', e[0], e[1], 0));
  await new Promise(f => setTimeout(f, 200));
  const b = Store.getBlock('${blattId}');
  const m = (b.marken || [])[b.marken.length - 1] || null;
  if (!m) return null;
  const n = m.pts.length;
  const k = (Marken.alsAnnotation(m) || { kontur: [null] }).kontur[0] || [];
  const dist = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]);
  const breiten = k.length ? Array.from({ length: n }, (_q, i) => k[i] && k[2 * n + 6 - i] ? dist(k[i], k[2 * n + 6 - i]) : NaN) : [];
  return { art: m.art, stil: m.stil ?? null, druckArt: m.druckArt ?? null, n, druck: (m.pressure || []).map(Number), breiten };
})()`) as Promise<{ art: string; stil: string | null; druckArt: string | null; n: number; druck: number[]; breiten: number[] } | null>;

/* Ein gerader Zug, 30 Meldungen, 10 pt je Schritt. */
const zug = (y: number, druck: (i: number) => number): Array<[number, number, number]> =>
  Array.from({ length: 30 }, (_v, i) => [80 + i * 10, y, druck(i)]);

/* ======================================================================== */
console.log('\n1 · Leichte Hand mit Aussetzern: kein Buckel');
const leicht = await strich(zug(100, i => (i === 12 || i === 13 || i === 22) ? 0 : 0.2), 'pen');
console.log(`    Druck: ${JSON.stringify(leicht?.druck)}`);
p('Ein Füllerstrich ist da', !!leicht && leicht.art === 'stift' && leicht.stil === 'fueller' && leicht.druck.length === leicht.n, JSON.stringify(leicht && { art: leicht.art, stil: leicht.stil, n: leicht.n, d: leicht.druck.length }));
p('Kein gespeicherter Druck weicht von 0,2 ab — der Aussetzer ist kein Druck',
  !!leicht && leicht.druck.length > 5 && leicht.druck.every(d => Math.abs(d - 0.2) < 0.02),
  JSON.stringify(leicht?.druck.filter(d => Math.abs(d - 0.2) >= 0.02)));
gleich('Der Druck sagt: gemessen („stift")', leicht?.druckArt, 'stift');
const innen = (leicht?.breiten ?? []).slice(2, -2).filter(Number.isFinite);
const spanne = innen.length ? Math.max(...innen) / Math.min(...innen) : 0;
console.log(`    Konturbreite innen: ${r2(Math.min(...innen))} … ${r2(Math.max(...innen))} (×${r2(spanne)})`);
p('Die Fläche hat keinen Buckel: innen schwankt die Breite um weniger als 5 %', innen.length > 3 && spanne < 1.05, `×${r2(spanne)}`);

/* ======================================================================== */
console.log('\n2 · Ein Stift ohne Sensor bekommt den Tempo-Ersatz — und sagt es');
const ohne = await strich(zug(160, () => 0), 'pen');
console.log(`    Druck: ${JSON.stringify(ohne?.druck.slice(0, 8))}…`);
p('Ein Strich ist da', !!ohne && ohne.druck.length > 5);
gleich('Der Druck sagt ehrlich: aus dem Tempo gerechnet („tempo")', ohne?.druckArt, 'tempo');
p('Und die Werte kommen aus dem Tempo, nicht aus einer Vorgabe (nicht alle gleich)',
  !!ohne && new Set(ohne.druck.map(d => r2(d))).size > 1, JSON.stringify(ohne?.druck.slice(0, 6)));

/* ======================================================================== */
console.log('\n3 · Maus und Finger bleiben, wie sie waren');
const maus = await strich(zug(220, () => 0.5), 'mouse');
gleich('Ein Mausstrich sagt „tempo"', maus?.druckArt, 'tempo');
p('… und seine Werte kommen aus dem Tempo', !!maus && maus.druck.length > 5 && maus.druck.every(d => d >= 0.28 && d <= 0.85), JSON.stringify(maus?.druck.slice(0, 6)));
const finger = await strich(zug(280, () => 0), 'touch');
gleich('Ein Fingerstrich sagt „tempo"', finger?.druckArt, 'tempo');

/* ======================================================================== */
console.log('\n4 · Der Aussetzer als erste Meldung');
const erst = await strich(zug(340, i => i === 0 ? 0 : 0.3), 'pen');
console.log(`    Druck: ${JSON.stringify(erst?.druck.slice(0, 6))}…`);
p('Der Strich beginnt mit der Vorgabe 0,5 und nimmt danach den Sensor (0,3) — kein Tempowert dazwischen',
  !!erst && erst.druck.length > 5 && erst.druck.slice(1).every(d => Math.abs(d - 0.3) < 0.02 || Math.abs(d - 0.5) < 0.02)
    && erst.druck.slice(3).every(d => Math.abs(d - 0.3) < 0.02),
  JSON.stringify(erst?.druck.slice(0, 8)));
gleich('… und sagt „stift"', erst?.druckArt, 'stift');
p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
