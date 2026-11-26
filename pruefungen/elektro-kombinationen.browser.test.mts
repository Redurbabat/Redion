import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const bildordner = process.env.REDION_ELEKTRO_BILDER;
const vorher = process.argv.includes('--vorher');
if (bildordner) await mkdir(bildordner, { recursive: true });
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await engine.launch();
try {
  for (const width of [1366, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 400 ? 844 : 950 },
      hasTouch: width < 400, reducedMotion: 'reduce', serviceWorkers: 'block'
    });
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    await page.evaluate((dark: boolean) => {
      Store.setMeta('rundgangGesehen', true);
      Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove());
      App.theme(dark ? 'dark' : 'light');
      const page = Store.addPage(null, { text: 'Schalterkombinationen' });
      const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
      Schaltplan.beispielBauen(plan, 'ausschaltung');
      Store.addBlock(page.id, 'schaltplan', { plan, herkunft: 'ki' });
      Store.addBlock(page.id, 'text', { text: 'Übung zur Ausschaltung', herkunft: 'ki' });
      App.zeichneBaum();
      App.oeffne(page.id);
    }, width < 400);
    const block = page.locator('.blk.b-schaltplan[data-herkunft="ki"]');
    await block.waitFor();
    const streifen = await block.evaluate(element => {
      const style = getComputedStyle(element, '::before');
      return { content: style.content, color: style.backgroundColor, width: style.width };
    });
    if (vorher) {
      assert.equal(streifen.width, '3px');
      assert.notEqual(streifen.color, 'rgba(0, 0, 0, 0)');
    } else {
      assert.equal(streifen.content, 'none');
      assert.equal(await page.locator('.blk.b-text[data-herkunft="ki"]').evaluate(element =>
        getComputedStyle(element, '::before').width), '3px');
      assert.equal(await block.evaluate(element => {
        element.classList.add('gewaehlt');
        const sichtbareAuswahl = getComputedStyle(element, '::before').content !== 'none';
        element.classList.remove('gewaehlt');
        return sichtbareAuswahl;
      }), true);
    }
    if (bildordner) await page.screenshot({ path: join(bildordner, `redion-pr236-linie-${width}-${vorher?'vorher':'nachher'}.png`) });
    if (vorher) { await page.close(); continue; }
    await page.locator('.sp-wrap [data-a="vollbild"]').click();
    await page.locator('.sp-buehne').focus();
    await page.keyboard.press('Alt+Shift+p');
    const form = page.locator('.sp-pruef-kombinationen');
    await form.locator('summary').click();
    await form.locator('[name="schalter"]').check();
    await form.locator('select').selectOption({ label: 'E1' });
    await form.locator('[name="soll"]').fill('01');
    await form.getByRole('button', { name: 'Kombinationen prüfen' }).click();
    const result = form.locator('[data-kombinationen]');
    await result.getByText('2 von 2 bestanden').waitFor();
    assert.equal(await result.locator('li').count(), 2);
    assert.deepEqual(errors, []);
    if (bildordner) {
      await result.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(bildordner, 'redion-pr236-kombinationen-' + width + '.png') });
    }
    await page.close();
    console.log(width + ' px: Soll/Ist-Bericht nach Bedienung im Prüfzentrum');
  }
} finally { await browser.close(); }
