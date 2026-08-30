/* Suite 267 — Haftnotiz und Lineal auf der Zeichenschicht (E267)
 * ============================================================================
 * Zwei Stücke aus dem GoodNotes-Dossier, beide in der EINEN Schicht für
 * Blatt und PDF-Seite:
 *
 * §1 DIE WERKZEUGE stehen mit WORT in der Leiste (§38).
 * §2 HAFTNOTIZ AUFZIEHEN fragt sofort nach Text — Redions mehrzeiliges
 *    Blatt, NICHT prompt() (die Whiteboard-Schwäche aus LUECKEN.md).
 * §3 ABBRUCH einer frischen Notiz räumt sie weg — kein leerer Zettel.
 * §4 ANTIPPEN mit dem Werkzeug bearbeitet; langer Text bricht um.
 * §5 DUNKLER ZETTEL, HELLE TINTE — die Schrift wählt nach Helligkeit.
 * §6 DAS LINEAL rastet Linie auf 15°-Schritte; aus bleibt der Winkel frei.
 * §7 AUSWAHL verschiebt, RADIERER entfernt — wie jede Marke.
 * §8 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test267.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9046;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1100);
const seiteId = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addPage(null, { text: 'Zettelblatt' });
  const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
  Store.addBlock(blatt.id, 'text', { text: '' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForTimeout(900);
const blattId = await seite.evaluate((id: string) =>
  Store.childrenOf(id).find((k: any) => k.type === 'blatt')?.id, seiteId);
const marken = () => seite.evaluate((id: string) =>
  Store.getBlock(id)?.marken || [], blattId);

console.log('\n1 · Die Werkzeuge stehen mit Wort in der Leiste (§38)');
p('„Haftnotiz" als Werkzeug, „Lineal" als Schalter mit aria-pressed',
  await seite.evaluate(() => {
    const zettel = document.querySelector('.blatt-werk [data-wz="zettel"]');
    const lineal = document.querySelector('.blatt-werk [data-act="lineal"]');
    return !!zettel && (zettel.textContent || '').includes('Haftnotiz') &&
      !!lineal && (lineal.textContent || '').includes('Lineal') &&
      lineal.getAttribute('aria-pressed') === 'false';
  }));

console.log('\n2 · Haftnotiz aufziehen — Redions Blatt fragt nach dem Text');
await seite.locator('.blatt-werk [data-wz="zettel"]').click();
const flaecheBox = await seite.locator('.blatt-marken').boundingBox();
if (!flaecheBox) throw new Error('Keine Zeichenfläche.');
const zx = flaecheBox.x + flaecheBox.width * 0.15;
const zy = flaecheBox.y + flaecheBox.height * 0.08;
await seite.mouse.move(zx, zy);
await seite.mouse.down();
await seite.mouse.move(zx + 220, zy + 90, { steps: 3 });
await seite.mouse.up();
await seite.waitForTimeout(400);
p('Es öffnet sich ein MEHRZEILIGES Feld (textarea), kein prompt()',
  await seite.evaluate(() =>
    document.querySelector('.overlay textarea#fq') !== null));
await seite.locator('.overlay #fq').fill(
  'Hier nachfragen: Warum gilt die Formel nur für ohmsche Verbraucher und was passiert bei Spulen?');
await seite.locator('.overlay [data-a="ok"]').click();
await seite.waitForTimeout(400);
const zettel1 = await marken();
p('Die Notiz liegt in der Ablage; ihr Knoten trägt Zettelfläche und Text',
  (zettel1 as any[]).some(m => m.art === 'zettel' && /nachfragen/.test(m.text)) &&
  await seite.evaluate(() => {
    const g = document.querySelector('[data-ink-art="zettel"]');
    return !!g?.querySelector('rect') && !!g?.querySelector('text');
  }));
p('Langer Text bricht in mehrere Zeilen um (tspans)',
  await seite.evaluate(() =>
    (document.querySelector('[data-ink-art="zettel"] text')?.querySelectorAll('tspan').length || 0) >= 2));

console.log('\n3 · Abbruch räumt die frische Notiz weg');
await seite.mouse.move(zx, zy + 160);
await seite.mouse.down();
await seite.mouse.move(zx + 150, zy + 220, { steps: 3 });
await seite.mouse.up();
await seite.waitForTimeout(400);
await seite.locator('.overlay [data-a="zu"]').click();
await seite.waitForTimeout(400);
p('Kein leerer Zettel bleibt zurück',
  ((await marken()) as any[]).filter(m => m.art === 'zettel').length === 1);

console.log('\n4 · Antippen mit dem Werkzeug bearbeitet');
const zettelBox = await seite.locator('[data-ink-art="zettel"]').boundingBox();
if (!zettelBox) throw new Error('Kein Zettel.');
await seite.mouse.click(zettelBox.x + zettelBox.width / 2, zettelBox.y + zettelBox.height / 2);
await seite.waitForTimeout(400);
p('Das Feld öffnet mit dem BESTEHENDEN Text als Vorgabe',
  await seite.evaluate(() =>
    /nachfragen/.test((document.querySelector('.overlay #fq') as HTMLTextAreaElement)?.value || '')));
await seite.locator('.overlay #fq').fill('Kurz: nur ohmsch!');
await seite.locator('.overlay [data-a="ok"]').click();
await seite.waitForTimeout(400);
p('Der neue Text steht in Ablage und Bild',
  ((await marken()) as any[]).some(m => m.art === 'zettel' && m.text === 'Kurz: nur ohmsch!') &&
  await seite.evaluate(() =>
    (document.querySelector('[data-ink-art="zettel"] text')?.textContent || '')
      .includes('nur ohmsch')));

console.log('\n5 · Dunkler Zettel, helle Tinte');
p('Auf Blau (dunkel) schreibt der Zettel hell — die Schrift wählt nach Helligkeit',
  await seite.evaluate(() => {
    const knoten = (window as any).Marken.zeichneMarke(
      { id: 'probe', art: 'zettel', farbe: '#2f7ed8', pts: [[10, 10], [160, 60]], text: 'Nachtblau' });
    const hell = knoten?.querySelector('text')?.getAttribute('fill') === '#f5f5f2';
    const gelb = (window as any).Marken.zeichneMarke(
      { id: 'probe2', art: 'zettel', farbe: '#e0a419', pts: [[10, 10], [160, 60]], text: 'Tag' });
    const dunkel = gelb?.querySelector('text')?.getAttribute('fill') === '#1c1c1c';
    return hell && dunkel;
  }));

console.log('\n6 · Das Lineal rastet Linie auf 15°-Schritte');
const winkelVon = async (): Promise<number> => {
  const letzte = ((await marken()) as any[]).filter(m => m.art === 'line').pop();
  const [a, b] = letzte.pts;
  return Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI);
};
await seite.locator('.blatt-werk [data-wz="line"]').click();
const lx = flaecheBox.x + flaecheBox.width * 0.55;
const ly = flaecheBox.y + flaecheBox.height * 0.4;
/* ~50,2°: nahe genug an keinem 15°-Schritt (45 wäre 5° weg). */
await seite.mouse.move(lx, ly);
await seite.mouse.down();
await seite.mouse.move(lx + 100, ly + 120, { steps: 5 });
await seite.mouse.up();
await seite.waitForTimeout(300);
const frei = await winkelVon();
await seite.locator('.blatt-werk [data-act="lineal"]').click();
await seite.mouse.move(lx, ly + 40);
await seite.mouse.down();
await seite.mouse.move(lx + 100, ly + 160, { steps: 5 });
await seite.mouse.up();
await seite.waitForTimeout(300);
const gerastet = await winkelVon();
p('Ohne Lineal bleibt der Winkel frei, mit Lineal rastet er auf 15°',
  Math.abs(frei % 15) > 1.5 && Math.abs(frei % 15) < 13.5 &&
  (Math.abs(gerastet % 15) < 0.7 || Math.abs(gerastet % 15) > 14.3),
  `frei ${frei.toFixed(1)}°, gerastet ${gerastet.toFixed(1)}°`);
p('Der Schalter zeigt seinen Zustand (aria-pressed, .on)',
  await seite.evaluate(() => {
    const knopf = document.querySelector('.blatt-werk [data-act="lineal"]');
    return knopf?.getAttribute('aria-pressed') === 'true' &&
      knopf?.classList.contains('on');
  }));
await seite.locator('.blatt-werk [data-act="lineal"]').click();

console.log('\n7 · Auswahl verschiebt, Radierer entfernt');
await seite.locator('.blatt-werk [data-wz="select"]').click();
const zettelBox2 = await seite.locator('[data-ink-art="zettel"]').boundingBox();
if (!zettelBox2) throw new Error('Kein Zettel für die Auswahl.');
const altePts = ((await marken()) as any[]).find(m => m.art === 'zettel').pts;
await seite.mouse.move(zettelBox2.x + zettelBox2.width / 2, zettelBox2.y + zettelBox2.height / 2);
await seite.mouse.down();
await seite.mouse.move(zettelBox2.x + zettelBox2.width / 2 + 60,
  zettelBox2.y + zettelBox2.height / 2 + 30, { steps: 4 });
await seite.mouse.up();
await seite.waitForTimeout(400);
const neuePts = ((await marken()) as any[]).find(m => m.art === 'zettel').pts;
p('Die Auswahl verschiebt den Zettel (seine Punkte wandern)',
  Math.abs(neuePts[0][0] - altePts[0][0]) > 5);
await seite.locator('.blatt-werk [data-wz="radierer"]').click();
const zettelBox3 = await seite.locator('[data-ink-art="zettel"]').boundingBox();
if (zettelBox3)
  await seite.mouse.click(zettelBox3.x + zettelBox3.width / 2, zettelBox3.y + zettelBox3.height / 2);
await seite.waitForTimeout(300);
p('Der Radierer entfernt ihn aus Bild und Ablage',
  ((await marken()) as any[]).every(m => m.art !== 'zettel') &&
  await seite.evaluate(() => !document.querySelector('[data-ink-art="zettel"]')));

console.log('\n8 · Bau-Hygiene');
const markenJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/marken.js'), 'utf8');
const dialogJs = fs.readFileSync(path.join(WURZEL, 'quell/schale/ueberlagerung/dialog.js'), 'utf8');
const swJs = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
const fassung = /VERSION = '([^']+)'/.exec(
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8'))?.[1] || '';
p('marken.js kennt zettel und rasten, dialog.js das mehrzeilige Blatt',
  markenJs.includes("'zettel'") && markenJs.includes('rasten') &&
  dialogJs.includes('mehrzeilig'));
p('sw.js trägt die Fassung seiner Quelle',
  !!fassung && swJs.includes(`'${fassung}'`));
p('Die Einzeldatei kennt Haftnotiz und Lineal',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes("'zettel'"));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
