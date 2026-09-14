/* E572 — Die Zeichenwerkzeuge nach Redurs sieben Referenzbildern.
 * Echte App, eigene Browserablage; kein Zugriff auf Nutzerdokumente.
 * Vor der Umsetzung rot: Laser fehlt oben, Formenwahl ist versteckt.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
declare const Marken: any;
const root = resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const file = resolve(root, '.' + (request.url?.split('?')[0] || '/index.html'));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  response.end(readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let failed = 0, passed = 0;
const check = (name: string, value: unknown) => { value ? passed++ : failed++; console.log((value ? '  ✓ ' : '  ✗ ') + name); };
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.waitForTimeout(500);
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(node => node.remove());
    const notebook = Store.addPage(null, { text: 'Ideen & Skizzen', icon: '📓' });
    const sheet = Store.addBlock(notebook.id, 'blatt', { text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.addBlock(notebook.id, 'blatt', { text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.updateBlock(notebook.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(notebook.id);
    return { page: notebook.id, sheet: sheet.id };
  });
  await page.waitForSelector('.document-drawingbar');
  check('Leeres Testblatt, keine Nutzerdaten', await page.evaluate(id => Store.getBlock(id)?.marken?.length === 0, ids.sheet));
  await page.locator('[data-document-tool="stift"]').click();
  check('Laser direkt in der oberen Werkzeugleiste', await page.locator('[data-document-tool="laser"]').count() === 1);
  await page.locator('[data-document-tool="formen"]').click();
  check('Formenwahl ohne Alle-Optionen-Umweg', await page.locator('.document-stage[data-aktiv] [data-act="formart"][data-form="triangle"]').isVisible());
  check('Lineal oben direkt erreichbar', await page.locator('[data-document-action="ink-ruler"]').count() === 1);
  check('Drei eigene Radierergrößen', await page.locator('.document-stage[data-aktiv] [data-eraser-size]').count() === 3);
  check('Keine Laufzeitfehler', errors.length === 0);
  mkdirSync(resolve(root, 'bilder'), { recursive: true });
  await page.screenshot({ path: resolve(root, 'bilder/drawing-reference-before.png') });
} finally { await browser.close(); server.close(); }
console.log(`\n${passed} grün, ${failed} rot`);
process.exitCode = failed ? 1 : 0;
