
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { chromium } from 'playwright';

declare const App: any;
declare const Store: any;
declare const Spreadsheet: any;

test('Gedankenkarte tauscht Markdown aus und Tabellenfehler öffnen die richtige Zelle', { timeout: 45_000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 880 }, acceptDownloads: true });
    const laufzeitfehler: string[] = [];
    page.on('pageerror', error => laufzeitfehler.push(error.message));
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const id = await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      Store.setMeta('neuerungenGesehen', 99);
      Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
      const seite = Store.addPage(null, { text: 'Austauschprüfung' });
      const mappe = Spreadsheet.neueMappe('Prüfung');
      const zweitesBlatt = Spreadsheet.neuesBlatt('Messwerte');
      Spreadsheet.setze(zweitesBlatt, 'C12', '=1/0');
      mappe.blaetter.push(zweitesBlatt);
      Store.addBlock(seite.id, 'spreadsheet', { text: 'Prüfung', mappe });
      const gk = Store.addBlock(seite.id, 'mindmap', { text: '' });
      await Store.flush();
      App.zeichneBaum();
      App.oeffne(seite.id);
      return gk.id as string;
    });
    await page.waitForSelector('.gk [data-a="markdown"]');
    await page.locator('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .evaluateAll(elements => elements.forEach(element => element.remove()));

    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const dateiauswahl = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Markdown-Datei öffnen' }).click();
    await (await dateiauswahl).setFiles({
      name: 'Lernstoff.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Lernstoff\n- Vorbereitung\n  - Messwerte\n', 'utf8'),
    });
    await page.locator('.gk .gk-kn').filter({ hasText: 'Vorbereitung' }).waitFor();
    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Gliederung als Markdown speichern' }).click();
    const markdown = await download;
    assert.equal(markdown.suggestedFilename(), 'Redion-Gedankenkarte.md');
    assert.equal(await fs.readFile(await markdown.path() ?? '', 'utf8'), '# Lernstoff\n\n- Vorbereitung\n  - Messwerte\n');
    await page.locator('.gk [data-a="zurueck"]').click();
    assert.equal(await page.evaluate(blockId => Store.getBlock(blockId).karte.knoten.length, id), 1);

    await page.locator('.tbl [data-a="mehr"]').click();
    await page.getByRole('button', { name: 'Formelfehler finden' }).click();
    await page.getByRole('button', { name: /Messwerte · C12 · #DIV\/0!/ }).click();
    await page.locator('.tbl .tbl-z[data-a="C12"].gewaehlt').waitFor();
    assert.equal(await page.locator('.tbl .tbl-z[data-a="C12"].gewaehlt').textContent(), '#DIV/0!');
    assert.deepEqual(laufzeitfehler, []);
  } finally {
    await browser.close();
  }
});
