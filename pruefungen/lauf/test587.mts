/* Suite 587 — PDF-Seiteneditor und Seitenfläche (Master-Prompt 29.09., 6–8)
 *
 * Gegenprobe: Auf dem Stand 4d9a9a3fb liegen 300 Miniaturen schon beim
 * Öffnen im DOM, die Datenbank ragt aus ihrem Flächenkasten, und zwei
 * Zeichenleisten sind gleichzeitig sichtbar. Alle drei Zusagen werden rot.
 *
 *   node pruefungen/lauf/test587.mts
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const App: any;
declare const Store: any;

const root = path.resolve(import.meta.dirname, '../..');
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json'
};
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent((request.url || '/').split('?')[0] || '/');
  const file = path.join(root, relative === '/' ? 'index.html' : relative.slice(1));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  response.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let passed = 0, failed = 0;
const check = (name: string, condition: unknown, detail = ''): void => {
  if (condition) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
};

try {
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined');
  const canvasId = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(element => element.remove());
    const item = Store.addPage(null, { text: 'Flächenprobe', seitenAnsicht: 'flaeche' });
    const database = Store.addDatabase(item.id, 'Tabelle auf der Fläche');
    Store.addRow(database.collectionId, { title: 'Lesbarer Datensatz' });
    Store.addBlock(item.id, 'whiteboard', { text: '', hoehe: 260 });
    await Store.flush();
    App.oeffne(item.id);
    return item.id;
  });
  await page.waitForSelector('.pg-flaeche .db');
  console.log('  Diagnose Fläche: ' + JSON.stringify(await page.evaluate(() => ({
    boards: document.querySelectorAll('.pg-flaeche .wb').length,
    toolbars: document.querySelectorAll('.pg-flaeche .gfx-tb-sockel').length,
    blocks: [...document.querySelectorAll<HTMLElement>('.pg-flaeche .blk')]
      .map(element => element.getAttribute('data-bid'))
  }))));
  await page.waitForSelector('.pg-flaeche .wb-tools');

  console.log('\n6 · Datenbank bleibt im Flächenkasten lesbar');
  const surface = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>('.pg-fl-notiz .pg-fl-koerper')!;
    const database = body.querySelector<HTMLElement>('.db')!;
    const a = body.getBoundingClientRect(), b = database.getBoundingClientRect();
    return { bodyLeft: a.left, bodyRight: a.right, dbLeft: b.left, dbRight: b.right,
      bodyBg: getComputedStyle(body.parentElement!).backgroundColor,
      dbColor: getComputedStyle(database).color };
  });
  check('Datenbank ragt links nicht aus dem Kasten', surface.dbLeft >= surface.bodyLeft - 2,
    JSON.stringify(surface));
  check('Datenbank ragt rechts nicht aus dem Kasten', surface.dbRight <= surface.bodyRight + 2,
    JSON.stringify(surface));

  console.log('\n7 · Genau eine kontextbezogene Zeichenleiste');
  const visibleToolbars = () => page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.pg-flaeche .gfx-tb-sockel')]
      .filter(element => element.getBoundingClientRect().height > 0 &&
        getComputedStyle(element).visibility !== 'hidden')
      .map(element => element.classList.contains('wb-tools') ? 'board' : 'page'));
  check('Anfangs nur die untere Seitenleiste', JSON.stringify(await visibleToolbars()) === '["page"]',
    JSON.stringify(await visibleToolbars()));
  await page.locator('.pg-flaeche .wb-flaeche').first().click({ position: { x: 30, y: 30 } });
  check('Im Zeichenblock nur dessen untere Leiste', JSON.stringify(await visibleToolbars()) === '["board"]',
    JSON.stringify(await visibleToolbars()));
  await page.locator('.pg-flaeche .wb-tools [data-wz="hand"]').click();
  check('Die umgehängte Leiste steuert weiter ihren Block',
    await page.locator('.pg-flaeche .wb.wb-schiebt').count() === 1);
  await page.locator('.pg-flaeche').click({ position: { x: 35, y: 75 } });
  check('Außerhalb des Blocks kehrt die Seitenleiste zurück',
    JSON.stringify(await visibleToolbars()) === '["page"]', JSON.stringify(await visibleToolbars()));

  console.log('\n8 · Große Dokumente öffnen ohne synchrone Miniaturenwelle');
  const load = await page.evaluate(async () => {
    const item = Store.addPage(null, { text: 'Großes Skript', dokumentModus: true });
    for (let number = 1; number <= 300; number++)
      Store.addBlock(item.id, 'pdfseite', { text: '', nr: number, vonSeiten: 300,
        bw: 595, bh: 842, raumVersion: 1 });
    await Store.flush();
    const start = performance.now();
    App.oeffne(item.id);
    const elapsed = performance.now() - start;
    return { id: item.id, elapsed,
      thumbnails: document.querySelectorAll('.document-thumbnail').length,
      stages: document.querySelectorAll('.document-stage').length };
  });
  console.log('  Öffnen: ' + Math.round(load.elapsed) + ' ms, '
    + load.thumbnails + ' Miniaturen, ' + load.stages + ' Bühnen');
  check('Beim Öffnen entstehen nicht alle 300 Miniaturen synchron', load.thumbnails < 60,
    JSON.stringify(load));
  check('Die aktuelle Seite ist trotzdem direkt sichtbar',
    await page.locator('.document-stage[data-aktiv] .blatt-papier').count() === 1);
  await page.locator('[data-document-action="thumbnails"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.document-thumbnail').length === 300,
    null, { timeout: 20000 });
  check('Beim Öffnen der Übersicht werden alle 300 Seiten erreichbar',
    await page.locator('.document-thumbnail').count() === 300);
  check('Keine unbehandelten Browserfehler', errors.length === 0, errors.join(' | '));
  // Die Testseiten wohnen nur im isolierten Browserkontext dieses Laufs.
  void canvasId;
} finally {
  await page.close();
  await browser.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
console.log(`\nSuite 587: ${passed} grün, ${failed} rot`);
if (failed) process.exitCode = 1;
