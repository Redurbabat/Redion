
import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, devices, webkit, type Page } from 'playwright';

declare const App: any;
declare const Store: any;
declare const Bibliothek: any;
declare const Produktwelten: any;
declare const Aussehen: any;

const index = new URL('../index.html', import.meta.url).href;

async function ablageOeffnen(page: Page) {
  await page.goto(index);
  await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    const seite = Store.addPage(null, { text: 'Werkstatt UI Probe' });
    Store.addBlock(seite.id, 'text', { text: 'Eine bearbeitbare Notiz' });
    Store.addBlock(seite.id, 'flashcard', { text: 'Frage | Antwort' });
    await Store.flush();
    App.zeichneBaum();
    if (document.documentElement.dataset.theme !== 'light') Aussehen.grundWechseln();
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    Bibliothek.oeffne();
  });
  await page.getByRole('heading', { name: 'Dokumente', exact: true }).waitFor();
}

test('Windows-Ansicht verbindet die neue Leiste mit Bibliothek und Editor', { timeout: 45_000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
    await ablageOeffnen(page);
    assert.equal(await page.locator('#kante').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(45, 24, 32)');
    assert.equal(await page.locator('.bib-dkopf').evaluate(el => getComputedStyle(el).borderTopWidth), '4px');
    const karten = page.locator('.bib-deckel').filter({ hasText: 'Werkstatt UI Probe' });
    await karten.click();
    await page.locator('#title').filter({ hasText: 'Werkstatt UI Probe' }).waitFor();
    assert.equal(await page.getByText('Eine bearbeitbare Notiz', { exact: true }).count(), 1);
    await page.locator('#studio-home').click();
    await page.getByRole('heading', { name: 'Dokumente', exact: true }).waitFor();
    await page.locator('#studio-theme').click();
    await page.waitForFunction(() => {
      const kopf = document.querySelector('.bib-dkopf');
      return document.documentElement.dataset.theme === 'dark' &&
        kopf && getComputedStyle(kopf).backgroundColor === 'rgb(42, 34, 38)';
    });
  } finally {
    await browser.close();
  }
});

test('iPhone-WebKit erreicht Dokumente und Lernrunde in schmaler Breite', { timeout: 45_000 }, async () => {
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage({ ...devices['iPhone 13 Pro Max'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await ablageOeffnen(page);
    const kopf = page.locator('.bib-dkopf');
    assert.ok(await kopf.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    const knoepfe = await page.locator('.bib-workspace-actions button').evaluateAll(items =>
      items.map(el => ({ height: el.getBoundingClientRect().height, within: el.getBoundingClientRect().right <= innerWidth })));
    assert.equal(knoepfe.length, 3);
    assert.ok(knoepfe.every(item => item.height >= 44 && item.within));
    await page.evaluate(() => Produktwelten.lernen('heute'));
    const start = page.locator('.lw-next-step button.is-primary');
    await start.waitFor();
    const lage = await start.evaluate(el => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      screen: window.innerHeight,
    }));
    assert.ok(lage.top >= 0 && lage.bottom < lage.screen - 60);
    assert.equal(await page.locator('.lw-desk h2').textContent(), 'Dokumente');
    await start.click();
    await page.waitForFunction(() => !document.querySelector('.lw-next-step button.is-primary')?.getBoundingClientRect().width
      || !!document.querySelector('[role="dialog"], .lw-train-wrap, .lw-session, .overlay'));
  } finally {
    await browser.close();
  }
});
