/* PDF-Auftrag §11: KI-Kontext und Aktionen ohne große Werkzeug-Schublade.
 * Keine Modellanfrage; jede Browserseite hat flüchtige lokale Daten. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

declare const App: any, Store: any;
const root = path.resolve(import.meta.dirname, '../..');
const browser = await chromium.launch();
let checks = 0;
const check = (name: string, ok: unknown) => {
  assert.ok(ok, name); checks++; console.log('  ✓ ' + name);
};

try {
  for (const width of [1280, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 760 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined');
    await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      const page = Store.addPage(null, { text: 'KI-Werkzeuge prüfen' });
      await Store.flush(); App.oeffne(page.id); App.kiPanel(true);
    });
    check(width + ': keine alte Sammelschublade', await page.locator('#ai-tools').count() === 0);
    check(width + ': Kontext neben der Eingabe sichtbar', await page.locator('.ai-context-group [data-qs]:visible').count() === 5);
    check(width + ': fünf Seitenaktionen sichtbar', await page.locator('.ai-quick button[data-p]:visible').count() === 5);
    check(width + ': seltene Aktionen unter Mehr', await page.locator('#ai-mehr').isVisible() &&
      await page.locator('.ai-action-bank button:visible').count() === 0);
    check(width + ': Quellen und Fähigkeiten stehen am Kontext',
      await page.locator('.ai-context-head #ai-quellen').count() === 1 &&
      await page.locator('.ai-context-head #ai-faehig').count() === 1);
    const source = page.locator('.ai-context-group [data-qs="aktuelleSeite"]');
    const was = await source.getAttribute('aria-pressed');
    await source.click();
    check(width + ': Quelle ist ein echter Schalter', await source.getAttribute('aria-pressed') !== was);
    await page.locator('#ai-mehr').click();
    check(width + ': sieben originale Aktionen im Menü', await page.locator('.menu .ai-action-bank-button').count() === 7 &&
      await page.locator('.menu #ai-db').count() === 1 && await page.locator('.menu #ai-schreiben').count() === 1);
    await page.locator('.menu #ai-db').click();
    check(width + ': Datenbankaktion öffnet ihre echte Rückfrage', await page.locator('.overlay').count() > 0);
    await page.keyboard.press('Escape');
    await page.locator('#ai-mehr').click();
    await page.keyboard.press('Escape');
    check(width + ': Menü schließt mit Escape und Aktionen kehren zurück',
      await page.locator('.menu').count() === 0 && await page.locator('.ai-action-bank #ai-db').count() === 1);
    check(width + ': kein horizontaler Seitenüberlauf', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    check(width + ': keine Browserfehler', errors.length === 0);
    await context.close();
  }
  console.log('Suite 590: ' + checks + ' grün.');
} catch (error) {
  console.error('✗ Suite 590:', error); process.exitCode = 1;
} finally { await browser.close(); }
