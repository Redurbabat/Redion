/* Suite 562 — Jedes Werkzeug merkt sich seine Farbe und seine Stärke (E674)
 * ============================================================================
 * Redur, 21. September 2026 (wörtlich): „ich will das du die stift und
 * heichenb verbessern, und gleich wie goodnotes machen".
 *
 * ─── DIE HÄUFIGSTE HANDBEWEGUNG DES TAGES ───────────────────────────────────
 * Wer ein Skript beschreibt, markiert mit gelbem, breitem Marker und
 * schreibt mit schwarzem, feinem Stift — und wechselt zwanzigmal je Seite
 * dazwischen. GoodNotes hält Farbe und Stärke JE WERKZEUG: der Marker
 * bleibt gelb und breit, der Stift schwarz und fein, egal, wie oft man
 * tauscht.
 *
 * In Redion waren `color` und `width` EINE Variable für alles (Stift,
 * Marker, Formen, Zettel, Text). Wer den Marker gelb und breit gemacht
 * hatte und zum Stift zurückging, schrieb gelb und breit weiter. Und auf
 * einer gewöhnlichen Seite wurde die Farbe GAR NICHT gemerkt: nach dem
 * Neuladen stand wieder Schwarz und Mittel da. Im Studio nur je Dokument
 * (`dokTinte:`/`dokStrich:`), was ein Gedächtnis für die Seite ist, keins
 * für den Stift.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Stift Rot/Breit, Marker Grün/Fein, zurück zum Stift: die Leiste
 *      zeigt Rot/Breit, und der nächste Strich IST rot und breit. Zurück
 *      zum Marker: Grün/Fein, und der Marker-Strich ist es auch.
 *   2  Eine Form hat ihre eigene Farbe; der Stift behält seine.
 *   3  Nach dem Neuladen steht alles wieder — Stift und Marker.
 *   4  Was im Gedächtnis liegt, wird geprüft, bevor es gilt (§19):
 *      eine Farbe, die keine ist, und eine Stärke jenseits des Reglers
 *      kommen nicht durch.
 *   5  Ein Werkzeug, das noch nichts gemerkt hat, übernimmt beim ersten
 *      Wechsel, was gerade an ist — wie bisher, keine Überraschung.
 *   6  Die Auswahl hat keine eigene Tinte: eine Farbe, die man mit der
 *      Auswahl wählt, gilt der Auswahl UND dem Stift danach (E353) — sie
 *      wird dem letzten Zeichenwerkzeug gutgeschrieben, nicht der Auswahl.
 *      `test345 §4` hat das gegen den ersten Stand von E674 gefunden.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test562.mts
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

const ROT = '#d64545', GRUEN = '#3aa757', BLAU = '#2f7ed8', SCHWARZ = '#111111';

const browser = await chromium.launch();
const fehler: string[] = [];
const s: Page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('dialog', d => d.dismiss().catch(() => {}));

/** Die App laden und eine Seite mit einem Blatt öffnen; gibt die Blatt-Kennung. */
const laden = async (): Promise<string> => {
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Store !== 'undefined'");
  const id = await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Skript', icon: '🖍' });
    const b = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 400,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
    return b.id;
  })()`) as string;
  await s.waitForSelector('.blatt-marken', { timeout: 20000 });
  await s.waitForTimeout(500);
  return id;
};
const werkzeug = async (wz: string): Promise<void> => { await s.click(`.blatt-werk [data-wz="${wz}"]`); await s.waitForTimeout(150); };
const farbe = async (c: string): Promise<void> => { await s.click(`.blatt-werk .blatt-farbe[data-c="${c}"]`); await s.waitForTimeout(100); };
const staerke = async (b: number): Promise<void> => { await s.click(`.blatt-werk .blatt-strich[data-b="${b}"]`); await s.waitForTimeout(100); };
/** Was die Leiste gerade als gewählt zeigt. */
const leiste = () => s.evaluate(`(() => {
  const f = document.querySelector('.blatt-werk .blatt-farbe.on');
  const b = document.querySelector('.blatt-werk .blatt-strich.on');
  const w = document.querySelector('.blatt-werk [data-wz].on');
  return { farbe: f ? f.dataset.c : null, breite: b ? Number(b.dataset.b) : null, werkzeug: w ? w.dataset.wz : null };
})()`) as Promise<{ farbe: string | null; breite: number | null; werkzeug: string | null }>;
/** Ein kurzer Stiftzug über das Blatt; gibt die letzte Marke. */
const strich = (blattId: string, y: number) => s.evaluate(`(async () => {
  const svg = document.querySelector('.blatt-marken');
  const ctm = svg.getScreenCTM();
  const zu = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
  const ev = (typ, x, y) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'pen', pressure: typ === 'pointerup' ? 0 : 0.5,
    isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
  svg.dispatchEvent(ev('pointerdown', 100, ${y}));
  for (let i = 1; i <= 12; i++) { svg.dispatchEvent(ev('pointermove', 100 + i * 10, ${y})); await new Promise(f => setTimeout(f, 4)); }
  svg.dispatchEvent(ev('pointerup', 220, ${y}));
  await new Promise(f => setTimeout(f, 200));
  const b = Store.getBlock('${blattId}');
  const m = (b.marken || [])[b.marken.length - 1] || null;
  return m ? { art: m.art, farbe: m.farbe, breite: m.breite } : null;
})()`) as Promise<{ art: string; farbe: string; breite: number } | null>;

/* ======================================================================== */
console.log('\n1 · Stift Rot/Breit, Marker Grün/Fein — und jeder behält seins');
let blatt = await laden();
await werkzeug('stift');
await farbe(ROT); await staerke(5);
gleich('Der Stift ist Rot und Breit', await leiste(), { farbe: ROT, breite: 5, werkzeug: 'stift' });
await werkzeug('marker');
await farbe(GRUEN); await staerke(1.2);
gleich('Der Marker ist Grün und Fein', await leiste(), { farbe: GRUEN, breite: 1.2, werkzeug: 'marker' });
await werkzeug('stift');
gleich('Zurück beim Stift zeigt die Leiste wieder Rot und Breit', await leiste(), { farbe: ROT, breite: 5, werkzeug: 'stift' });
let m = await strich(blatt, 120);
p('… und der nächste Stiftstrich IST rot und breit', !!m && m.art === 'stift' && m.farbe === ROT && m.breite === 5, JSON.stringify(m));
await werkzeug('marker');
gleich('Zurück beim Marker: Grün und Fein', await leiste(), { farbe: GRUEN, breite: 1.2, werkzeug: 'marker' });
m = await strich(blatt, 160);
p('… und der Markerstrich ist grün und fein', !!m && m.art === 'marker' && m.farbe === GRUEN && m.breite === 1.2, JSON.stringify(m));

/* ======================================================================== */
console.log('\n2 · Eine Form hat ihre eigene Farbe');
await werkzeug('formen');
await farbe(BLAU);
const form = await leiste();
p('Die Form ist Blau', form.farbe === BLAU, JSON.stringify(form));
await werkzeug('stift');
gleich('Der Stift ist davon unberührt: Rot und Breit', await leiste(), { farbe: ROT, breite: 5, werkzeug: 'stift' });
await werkzeug('formen');
p('Und die Form ist wieder Blau', (await leiste()).farbe === BLAU, JSON.stringify(await leiste()));

/* ======================================================================== */
console.log('\n3 · Nach dem Neuladen steht alles wieder');
const gemerkt = await s.evaluate(`JSON.stringify(Store.getMeta('zeichnen:werkzeugwerte') || null)`) as string;
console.log('    zeichnen:werkzeugwerte = ' + gemerkt.slice(0, 160));
p('Das Gedächtnis liegt in EINEM Meta-Schlüssel, je Werkzeug Farbe und Stärke',
  (() => { try { const w = JSON.parse(gemerkt); return !!w && w.stift?.farbe === ROT && w.stift?.breite === 5 && w.marker?.farbe === GRUEN && w.marker?.breite === 1.2 && w.formen?.farbe === BLAU; } catch { return false; } })(),
  gemerkt);
blatt = await laden();
await werkzeug('stift');
gleich('Nach dem Neuladen: der Stift ist Rot und Breit', await leiste(), { farbe: ROT, breite: 5, werkzeug: 'stift' });
m = await strich(blatt, 120);
p('… und schreibt so', !!m && m.farbe === ROT && m.breite === 5, JSON.stringify(m));
await werkzeug('marker');
gleich('Nach dem Neuladen: der Marker ist Grün und Fein', await leiste(), { farbe: GRUEN, breite: 1.2, werkzeug: 'marker' });

/* ======================================================================== */
console.log('\n4 · Was im Gedächtnis liegt, wird geprüft (§19)');
await s.evaluate(`Store.setMeta('zeichnen:werkzeugwerte', { stift: { farbe: 'javascript:alert(1)', breite: 999 }, marker: { farbe: '#3aa757', breite: 'dick' }, zettel: 'kaputt' })`);
blatt = await laden();
await werkzeug('stift');
gleich('Eine Farbe, die keine ist, und eine Stärke jenseits des Reglers: der Stift steht auf Schwarz/Mittel',
  await leiste(), { farbe: SCHWARZ, breite: 2.4, werkzeug: 'stift' });
await werkzeug('marker');
const mk = await leiste();
p('Der Marker nimmt die gültige Farbe und lässt die ungültige Stärke liegen',
  mk.farbe === GRUEN && mk.breite === 2.4, JSON.stringify(mk));
m = await strich(blatt, 120);
p('Nichts davon landet in einer Marke', !!m && /^#[0-9a-f]{6}$/.test(m.farbe) && m.breite >= 0.5 && m.breite <= 12, JSON.stringify(m));

/* ======================================================================== */
console.log('\n5 · Ein Werkzeug ohne Gedächtnis übernimmt, was gerade an ist');
await s.evaluate(`Store.setMeta('zeichnen:werkzeugwerte', null)`);
blatt = await laden();
await werkzeug('stift');
await farbe(BLAU); await staerke(5);
await werkzeug('zettel');
const zettel = await leiste();
p('Der Zettel hat noch nichts gemerkt und übernimmt Blau/Breit vom Stift', zettel.farbe === BLAU && zettel.breite === 5, JSON.stringify(zettel));
await werkzeug('stift');
gleich('Der Stift ist weiter Blau/Breit', await leiste(), { farbe: BLAU, breite: 5, werkzeug: 'stift' });

/* ======================================================================== */
console.log('\n6 · Die Auswahl hat keine eigene Tinte (E353)');
await werkzeug('select');
await farbe(ROT); await staerke(1.2);
await werkzeug('stift');
gleich('Rot/Fein, mit der Auswahl gewählt, gilt dem Stift danach', await leiste(), { farbe: ROT, breite: 1.2, werkzeug: 'stift' });
m = await strich(blatt, 200);
p('… und der nächste Stiftstrich ist rot und fein', !!m && m.farbe === ROT && m.breite === 1.2, JSON.stringify(m));
await werkzeug('marker');
await werkzeug('select');
await farbe(GRUEN);
await werkzeug('marker');
p('Zuletzt war der Marker dran: Grün mit der Auswahl gewählt gilt dem Marker', (await leiste()).farbe === GRUEN, JSON.stringify(await leiste()));
await werkzeug('stift');
gleich('… und der Stift bleibt Rot/Fein', await leiste(), { farbe: ROT, breite: 1.2, werkzeug: 'stift' });
const meta = JSON.parse(await s.evaluate(`JSON.stringify(Store.getMeta('zeichnen:werkzeugwerte') || {})`) as string);
p('Im Gedächtnis gibt es keinen Eintrag für die Auswahl oder die Hand', !('select' in meta) && !('schreiben' in meta), Object.keys(meta).join(','));
p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
