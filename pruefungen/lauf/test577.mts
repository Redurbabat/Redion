/* Suite 577 — Farben direkt wählen, weiterschreiben, Zubehör im Kontext (E697).
 * UMNUMMERIERT BEIM ZUSAMMENFÜHREN (27. September 2026): dieser Lauf kam am
 * 23. September als `test568` mit der Entscheidung E681 über `main`
 * (Codex-Zweig „dokument-stift-freitext", PR #114). Auf dem Arbeitszweig waren
 * `test568` (Strg+Z gehört der Fläche) und E681 (Plattform-Audit) inzwischen
 * ebenfalls vergeben. Beide Stände bleiben; dieser bekam die nächsten freien
 * Nummern — test577 und E697. Inhalt und Zusagen sind unverändert.
 * Der alte Stand scheitert bereits am fehlenden direkten Farbfeld.
 * Echte Klicks, echte Texteingabe und gespeicherte Marken, kein UI-Ersatz. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
declare const Store: any;
declare const App: any;
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
const errors: string[] = [];
let passed = 0;
const check = (label: string, value: unknown): void => { assert.ok(value, label); passed++; console.log('  ✓ ' + label); };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.waitForTimeout(400);
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(node => node.remove());
    const notebook = Store.addPage(null, { text: 'Meine Notizen · Zeichnen & Markieren', icon: '📓' });
    const sheet = Store.addBlock(notebook.id, 'blatt', { text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.updateBlock(notebook.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(notebook.id);
    return { page: notebook.id, sheet: sheet.id };
  });
  await page.waitForSelector('.document-drawingbar');
  const plus = page.locator('.blatt-werk .blatt-farbe-neu').first();
  await plus.click();
  check('Ein Klick öffnet die direkte Farbpalette statt eines Zwischendialogs', await page.locator('.blatt-color-panel').count() === 1);
  check('Benannte Farben sind direkt auswählbar', await page.locator('[data-ink-color]').count() >= 5);
  await page.locator('.blatt-popover > header button').click();

  await page.locator('[data-document-tool="text"]').click();
  const paper = await page.locator('.blatt-marken').first().boundingBox();
  assert.ok(paper);
  await page.mouse.click(paper.x + paper.width * .18, paper.y + paper.height * .12);
  await page.keyboard.insertText('Meine Notiz');
  await page.locator('.blatt-schreiber').evaluate(field => field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true })));
  check('Escape während einer Eingabekomposition beendet die Notiz nicht', await page.locator('.blatt-schreiber').count() === 1);
  const layoutReads = await page.locator('.blatt-schreiber').evaluate(async field => {
    await new Promise<void>(done => requestAnimationFrame(() => done()));
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const original = svg.getBoundingClientRect;
    let reads = 0;
    svg.getBoundingClientRect = function () { reads++; return original.call(this); };
    try {
      for (let index = 0; index < 20; index++) field.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await new Promise<void>(done => requestAnimationFrame(() => done()));
      return reads;
    } finally { svg.getBoundingClientRect = original; }
  });
  check('20 Eingaben im selben Bild lesen die Blattgeometrie höchstens einmal', layoutReads === 1);
  await page.keyboard.press('Home');
  await plus.click();
  const hex = page.getByRole('textbox', { name: 'Hex-Farbe' });
  await hex.fill('keine Farbe');
  check('Ungültiges Hex sperrt Übernehmen', await page.getByRole('button', { name: 'Farbe übernehmen', exact: true }).isDisabled());
  check('Ungültiges Hex wird ausdrücklich gemeldet', await hex.getAttribute('aria-invalid') === 'true');
  await hex.fill('#7856FF');
  check('Gültiges Hex bleibt fokussiert, der Texteditor stiehlt den Fokus nicht', await hex.evaluate(node => document.activeElement === node));
  check('Freitext bleibt beim Farbwählen offen', await page.locator('.blatt-schreiber').count() === 1);
  await page.getByRole('button', { name: 'Farbe übernehmen', exact: true }).click();
  check('Die Farbe wirkt sofort auf den offenen Text', await page.locator('.blatt-schreiber').evaluate(node => getComputedStyle(node).color === 'rgb(120, 86, 255)'));
  check('Übernehmen gibt den Fokus an den Text zurück', await page.locator('.blatt-schreiber').evaluate(node => document.activeElement === node));
  await page.keyboard.insertText('Wichtig: ');
  await page.keyboard.press('Control+Enter');
  let marks = await page.evaluate(id => Store.getBlock(id).marken, ids.sheet);
  check('Der Cursor bleibt an seiner Stelle, nicht am Ende', marks.length === 1 && marks[0].text === 'Wichtig: Meine Notiz');
  check('Text und Farbe werden gemeinsam gespeichert', marks[0].farbe === '#7856ff');

  /* Rückkehr nach Abbruch, auch ohne native Popover-Unterstützung. */
  await page.mouse.click(paper.x + paper.width * .18, paper.y + paper.height * .12);
  await page.keyboard.press('End');
  await plus.click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  check('Escape schliesst nur die Palette und führt zum Freitext zurück', await page.locator('.blatt-color-panel').count() === 0 && await page.locator('.blatt-schreiber').evaluate(node => document.activeElement === node));
  await page.evaluate(() => { (window as any).__nativePopover = HTMLElement.prototype.showPopover; (HTMLElement.prototype as any).showPopover = undefined; });
  await plus.click();
  check('Die Farbpalette funktioniert auch ohne natives Popover', await page.locator('.blatt-popover-ersatz .blatt-color-panel').count() === 1);
  await page.getByRole('textbox', { name: 'Hex-Farbe' }).fill('#224466');
  await page.keyboard.press('Escape');
  check('Abbrechen ändert weder Text noch Farbe', await page.locator('.blatt-schreiber').evaluate(node => node.textContent === 'Wichtig: Meine Notiz' && getComputedStyle(node).color === 'rgb(120, 86, 255)'));
  await page.evaluate(() => { HTMLElement.prototype.showPopover = (window as any).__nativePopover; delete (window as any).__nativePopover; });
  await page.keyboard.press('Control+Enter');

  await page.locator('[data-document-tool="marker"]').click();
  await plus.click();
  check('Der Marker hat eine eigene benannte Palette', await page.locator('.blatt-color-panel').getAttribute('data-color-tool') === 'marker');
  /* Seit E704 zieht ein neuer Marker mit der Keilspitze (0,40, die
     Vorgabe); die Vorschau trägt dieselbe Zahl wie der Strich — das ist die
     Zusage. Der runde Marker (0,32) hält test535. */
  check('Die Vorschau verwendet die echte Marker-Deckung', await page.locator('.blatt-color-preview i').evaluate(node => getComputedStyle(node).opacity === '0.4'));
  await page.locator('[data-ink-color="#ffcf33"]').click();
  check('Auch die Strichprobe trägt die neue Markerfarbe', await page.locator('.blatt-strich i').first().evaluate(node => getComputedStyle(node).backgroundColor === 'rgb(255, 207, 51)'));
  const svg = page.locator('.blatt-marken').first();
  await svg.evaluate(node => {
    const svg = node as SVGSVGElement;
    const matrix = svg.getScreenCTM()!;
    for (let index = 0; index <= 20; index++) {
      const point = new DOMPoint(105 + index * 9, 175).matrixTransform(matrix);
      svg.dispatchEvent(new PointerEvent(index === 0 ? 'pointerdown' : index === 20 ? 'pointerup' : 'pointermove', {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 77, pointerType: 'pen', pressure: index === 20 ? 0 : .5,
        button: 0, buttons: index === 20 ? 0 : 1, clientX: point.x, clientY: point.y
      }));
    }
  });
  await page.waitForTimeout(200);
  marks = await page.evaluate(id => Store.getBlock(id).marken, ids.sheet);
  check('Der echte Markerstrich speichert die gewählte Farbe', marks.some((mark: any) => mark.art === 'marker' && mark.farbe === '#ffcf33'));
  await page.locator('[data-document-action="ink-options"]').click();
  check('Mehr Zubehör zeigt keine fremden Text- oder Radieroptionen', await page.locator('.blatt-werk [data-act="fett"]').isHidden() && await page.locator('.blatt-werk [data-act="radiermodus"]').isHidden());
  check('Leiste einrichten bleibt erreichbar', await page.locator('.blatt-werk [data-act="einrichten"]').isVisible());
  await page.locator('[data-document-action="ink-options"]').click();
  await plus.click();
  mkdirSync(resolve(root, 'bilder'), { recursive: true });
  await page.screenshot({ path: resolve(root, 'bilder/stift-farben-rechner.png') });
  await page.locator('.blatt-popover > header button').click();
  await page.evaluate(async () => { await Store.flush(); });
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.evaluate(id => App.oeffne(id), ids.page);
  await page.waitForSelector('.document-drawingbar');
  check('Freitext und Marker überleben das Neuladen', (await page.evaluate(id => Store.getBlock(id).marken.length, ids.sheet)) === 2);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-document-tool="marker"]').click();
    await plus.click();
    check(`Die Markerfarbe bleibt nach Neuladen und bei ${width} px erhalten`, await page.getByRole('textbox', { name: 'Hex-Farbe' }).inputValue() === '#ffcf33');
    const bounds = await page.locator('.blatt-popover').boundingBox();
    check(`Die Palette bleibt bei ${width} px vollständig im Fenster`, bounds && bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 844);
    const targets = await page.locator('[data-ink-color], .blatt-color-panel input, .blatt-color-panel button').evaluateAll(nodes => nodes.every(node => { const r = node.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
    check(`Die Farbwahl hat bei ${width} px mindestens 44-px-Treffflächen`, targets);
    if (width === 390) await page.screenshot({ path: resolve(root, 'bilder/stift-farben-handy.png') });
    await page.locator('.blatt-popover > header button').click();
  }
  check('Keine JavaScript-Fehler', errors.length === 0);
  console.log(`\n${passed} bestanden · 0 fehlgeschlagen`);
} finally { await browser.close(); server.close(); }
