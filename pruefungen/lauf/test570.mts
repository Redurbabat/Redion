/* Suite 570 — Das Whiteboard rechnet über die Matrix und trägt seine Raumfassung (E686, Bogen 3)
 * ============================================================================
 * `space.ts` sagt in seiner ersten Zeile, was es sein will: „EINE STELLE, DIE
 * BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite." Und nennt als
 * Gegenbeispiel wörtlich die Zeichenfläche: `e.clientX - r.left`. Der
 * Plattform-Audit (E681, D2) hat gezählt: drei Handformeln neben der einen
 * Matrix. Diese hier ist die erste, die umzieht.
 *
 * WARUM DAS KEINE SCHÖNHEIT IST. Die Handformel kennt weder Rollstand noch
 * Zoom noch eine CSS-Verwandlung über der Fläche. Steht das Whiteboard in
 * einem Elternteil mit `transform: scale(0.8)` — eine Seitenvorschau, ein
 * Druckbild, ein späteres Zoom der Seite —, landet jeder Strich um den
 * Faktor daneben, ohne Fehlermeldung. `getScreenCTM()` kennt all das.
 *
 * UND DIE RAUMFASSUNG. Das Blatt trägt seit E125 `raumVersion`, das
 * Whiteboard nichts: seine Zahlen sind CSS-Pixel bei Massstab 1, und wer die
 * Deutung je ändert, verschiebt jede alte Fläche still. Redur, 25. September:
 * „ja whiteboard eine raumversion". Ein Brett ohne das Feld ist Fassung 1 —
 * genau die Deutung, die es immer hatte (§9: rückwärts denken).
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Wer zeichnet, schreibt `raumVersion: 1` an den Block.
 *   2  Ein altes Brett ohne das Feld lädt mit denselben Zahlen und bekommt
 *      das Feld erst, wenn es wirklich geschrieben wird.
 *   3  Unter `scale(0.8)` am Elternteil landet das Rechteck da, wo der
 *      Zeiger war — gemessen gegen die Matrix des SVG. UND unter
 *      `rotate(180deg)`: da versagt die Handformel wirklich.
 *   4  Nach Vergrössern (Massstab 1,25²) dasselbe: Zeiger und Zahl passen.
 *
 * WAS DIE MESSUNG GELEHRT HAT (§55.2). Der Audit (D2) sagte, die Handformel
 * kenne keine CSS-Verwandlung. Gemessen war `scale(0.8)` mit der alten Formel
 * GRÜN — weil `ausschnitt()` den `viewBox` aus demselben verwandelten Kasten
 * rechnet und sich der Faktor herauskürzt. Für jede achsenparallele
 * Skalierung sind Formel und Matrix gleich. Erst eine Drehung trennt sie:
 * `rotate(180deg)` → die Formel setzt das Rechteck an die gespiegelte Stelle.
 * Der Grund für den Umzug ist also §8 (eine Umrechnung, nicht vier) und die
 * Drehung — nicht der Alltag. Das steht so in E686.
 *
 * GEGEN DEN ALTEN STAND rot in §1 (Feld) und §3b (Drehung).
 * ==========================================================================*/
import { chromium } from 'playwright';
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
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
pg.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);

const ALT = [{ id: 'alt1', art: 'rechteck', x: 120, y: 80, w: 200, h: 100, farbe: '#529cca' }];
const ids = await pg.evaluate(async (alt: any[]) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  const s = Store.addPage(null, { text: 'Raumfassung' });
  /* Ein Brett von gestern: Formen da, kein raumVersion. */
  const b = Store.addBlock(s.id, 'whiteboard', { text: 'Skizze', shapes: alt, hoehe: 360 });
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
  return { seite: s.id, block: b.id };
}, ALT);

const block = () => pg.evaluate((id: string) => JSON.parse(JSON.stringify(Store.getBlock(id))), ids.block);
const formen = async () => (await block()).shapes as any[];
/** Wo der Zeiger in Flächenpunkten steht — die Wahrheit der Matrix, nicht der Formel. */
const erwartet = (cx: number, cy: number) => pg.evaluate(([cx, cy]: [number, number]) => {
  const svg = document.querySelector<SVGSVGElement>('.wb-flaeche')!;
  const q = new DOMPoint(cx, cy).matrixTransform(svg.getScreenCTM()!.inverse());
  return [Math.round(q.x), Math.round(q.y)];
}, [cx, cy] as [number, number]);
const rechteckZiehen = async (dx = 0, dy = 0) => {
  await pg.click('.wb-tools [data-wz="rechteck"]');
  const k = (await pg.locator('.wb-flaeche').boundingBox())!;
  const x0 = k.x + k.width * 0.6 + dx, y0 = k.y + k.height * 0.55 + dy;
  const soll = await erwartet(x0, y0);
  await pg.mouse.move(x0, y0); await pg.mouse.down();
  await pg.mouse.move(x0 + 90, y0 + 60, { steps: 5 }); await pg.mouse.up();
  await pg.waitForTimeout(250);
  const f = await formen();
  const neu = f[f.length - 1];
  return { soll, ist: [Number(neu?.x), Number(neu?.y)], art: neu?.art };
};
const nah = (a: number[], b: number[], t = 2) => Math.abs(a[0]! - b[0]!) <= t && Math.abs(a[1]! - b[1]!) <= t;

try {
  console.log('\n2 · Ein altes Brett lädt unverändert und ohne das Feld');
  const geladen = await block();
  p('Die alten Zahlen stehen unverändert', JSON.stringify(geladen.shapes) === JSON.stringify(ALT), JSON.stringify(geladen.shapes));
  p('Ohne Schreiben kein raumVersion', !('raumVersion' in geladen), 'raumVersion=' + geladen.raumVersion);

  console.log('\n1 · Wer zeichnet, schreibt raumVersion 1');
  const r1 = await rechteckZiehen();
  p('Das Rechteck ist gespeichert', r1.art === 'rechteck', JSON.stringify(r1));
  p('Es liegt, wo der Zeiger war (ohne Verwandlung)', nah(r1.ist, r1.soll), `ist ${r1.ist} soll ${r1.soll}`);
  const nachher = await block();
  p('Der Block trägt raumVersion 1', nachher.raumVersion === 1, 'raumVersion=' + nachher.raumVersion);
  p('Die alte Form ist unverändert mitgeschrieben', JSON.stringify(nachher.shapes[0]) === JSON.stringify(ALT[0]));

  console.log('\n3 · Unter scale(0.8) am Elternteil landet das Rechteck, wo der Zeiger war');
  await pg.evaluate(() => {
    const wb = document.querySelector<HTMLElement>('.wb')!;
    const eltern = wb.parentElement as HTMLElement;
    eltern.style.transform = 'scale(0.8)'; eltern.style.transformOrigin = '0 0';
  });
  await pg.waitForTimeout(200);
  const r3 = await rechteckZiehen(-40, -20);
  p('Zeiger und Zahl passen unter der Verwandlung', nah(r3.ist, r3.soll), `ist ${r3.ist} soll ${r3.soll} (Handformel: um den Faktor 0,8 daneben)`);
  await pg.evaluate(() => { const e = document.querySelector<HTMLElement>('.wb')!.parentElement as HTMLElement; e.style.transform = ''; e.style.transformOrigin = ''; });

  console.log('\n3b · Unter rotate(180deg) — hier trennt sich die Formel von der Matrix');
  await pg.evaluate(() => {
    const e = document.querySelector<HTMLElement>('.wb')!.parentElement as HTMLElement;
    e.style.transform = 'rotate(180deg)'; e.style.transformOrigin = '50% 50%';
  });
  await pg.waitForTimeout(200);
  const r3b = await rechteckZiehen(-30, -30);
  p('Zeiger und Zahl passen auch gedreht', nah(r3b.ist, r3b.soll), `ist ${r3b.ist} soll ${r3b.soll} (Handformel: gespiegelt)`);
  await pg.evaluate(() => { const e = document.querySelector<HTMLElement>('.wb')!.parentElement as HTMLElement; e.style.transform = ''; e.style.transformOrigin = ''; });
  await pg.waitForTimeout(150);

  console.log('\n4 · Nach Vergrössern dasselbe');
  await pg.click('.wb-tools [data-a="groesser"]'); await pg.click('.wb-tools [data-a="groesser"]');
  await pg.waitForTimeout(200);
  const z = await pg.evaluate((id: string) => Store.getBlock(id).sicht?.z, ids.block);
  p('Der Massstab ist gewachsen', Number(z) > 1.4, 'z=' + z);
  const r4 = await rechteckZiehen(20, 10);
  p('Zeiger und Zahl passen bei Massstab ' + z, nah(r4.ist, r4.soll), `ist ${r4.ist} soll ${r4.soll}`);
  p('raumVersion bleibt 1', (await block()).raumVersion === 1);

  p('Keine Fehler im Browser', fehler.length === 0, fehler.join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
