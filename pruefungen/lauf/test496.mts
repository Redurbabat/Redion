/* E534: echte Statistik und Druckkarte, keine Nachbildung der Komponenten. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
declare const Store: any, Pflege: any, Drucker: any, RedionMotion: any, UI: any;
const root = path.resolve(import.meta.dirname, '../..');
const browser = await chromium.launch();
let good = 0, bad = 0;
function check(name: string, ok: unknown) {
  if (ok) { good++; console.log('  ✓ ' + name); }
  else { bad++; console.error('  ✗ ' + name); }
}
try {
  for (const width of [360, 390, 428, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof Pflege !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    await page.evaluate(() => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      Pflege.gesundheit();
    });
    const card = page.locator('.rmo-health-metric').first();
    const heart = card.locator('.rmo-heart');
    await card.waitFor(); await page.waitForTimeout(200);
    check(width + ': Herz entsteht an der echten Kennzahl', await heart.count() === 1);
    if (await heart.count()) {
      const value = await card.locator('strong').textContent();
      check('Herz ist dekorativ und klickdurchlässig', await heart.evaluate(el =>
        el.getAttribute('aria-hidden') === 'true' && getComputedStyle(el).pointerEvents === 'none'));
      check('Herz ist im Leerlauf still', await heart.evaluate(el => getComputedStyle(el).animationName === 'none'));
      await card.scrollIntoViewIfNeeded();
      if (width < 600) await card.tap(); else await card.hover();
      // Aktivierung über play gehört ebenfalls zum öffentlichen Motion-Vertrag.
      await card.evaluate(el => RedionMotion.play(el, 'metric'));
      await page.waitForTimeout(60);
      check('Herz schlägt einmal, nicht endlos', await heart.evaluate(el =>
        getComputedStyle(el).animationName === 'rmo-heart-beat' && getComputedStyle(el).animationIterationCount === '1'));
      check('Kennzahl bleibt unverändert', await card.locator('strong').textContent() === value);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      check('Systemvorgabe hält das Herz still', await heart.evaluate(el => getComputedStyle(el).animationName === 'none'));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => document.body.dataset.bewegung = 'ruhig');
      check('Ruhige Einstellung hält das Herz still', await heart.evaluate(el => getComputedStyle(el).animationName === 'none'));
      await page.evaluate(() => { delete document.body.dataset.bewegung; RedionMotion.decorate(document); });
      check('Herz wird nicht doppelt angelegt', await heart.count() === 1);
      check('Ring und Beschriftungen überlappen nicht', await page.locator('.rmo-health-metric').evaluateAll(cards =>
        cards.every(card => {
          const ring = card.querySelector('.rmo-ring')!.getBoundingClientRect();
          const label = card.querySelector(':scope > span:not([aria-hidden])')!.getBoundingClientRect();
          return ring.right <= label.left || ring.left >= label.right || ring.bottom <= label.top || ring.top >= label.bottom;
        })));
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1000);
      fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
      await page.locator('.rmo-health').screenshot({ path: path.join(root, 'bilder/motion-rest-health-' + width + '.png') });
    }
    await page.locator('.overlay .fh [data-a="zu"]').click();
    /* Seit E710 fragt UI.frage im Dialog des Touch Kits (eine Insel, ohne
       `.fbtns`). Die Glasregel für `.fbtns button.prim` gilt weiter für
       jedes übrige Fenster Redions (Einstellungen, Datenbanken, Wissen …)
       — geprüft an einem solchen Fenster, gebaut wie der bisherige Kasten. */
    await page.evaluate(() => {
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = '<div class="finder"><div class="fh">Motion-Prüfung</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
        '<button data-a="zu">Abbrechen</button></div></div>';
      o.addEventListener('click', e => { if ((e.target as Element).closest('[data-a]')) o.remove(); });
      document.body.appendChild(o);
    });
    const apply = page.locator('.fbtns button.prim');
    await apply.waitFor(); await page.waitForTimeout(120);
    check('Glasknopf gewinnt gegen die alte Klassenregel', await apply.evaluate(el =>
      getComputedStyle(el).boxShadow.includes('0px -6px 12px')));
    check('Glaskörper bleibt dekorativ', await apply.locator('.rmo-glass').getAttribute('aria-hidden') === 'true');
    await page.locator('.fbtns [data-a="zu"]').click();
    await page.evaluate(() => { (window as any).__ticket = Drucker.zeigen(); (window as any).__ticket.setzen('rendern'); });
    const ticket = page.locator('.ru-drucker-schwebt');
    const turn = ticket.locator('.rmo-ticket-turn');
    await page.waitForTimeout(150);
    check(width + ': Druckkarte erhält eine echte Vorder- und Rückseite', await turn.count() === 1 &&
      await ticket.locator('.rmo-ticket-back').count() === 1);
    if (await turn.count()) {
      check('Druckstatus bleibt außerhalb der gedrehten Dekoration', await ticket.locator(':scope > .ru-drucker-status').count() === 1);
      check('Während des Druckens bleibt die Vorderseite sichtbar', await turn.evaluate(el =>
        getComputedStyle(el).transform === 'none'));
      for (const theme of ['dark', 'light']) {
        await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        for (const state of ['fertig', 'fehler', 'rendern']) {
          await page.evaluate(s => (window as any).__ticket.setzen(s, s === 'fehler' ? 'Datei konnte nicht gelesen werden.' : undefined), state);
          await page.waitForTimeout(700);
          check(theme + ' ' + state + ': sichtbare Seite folgt dem Auftragszustand',
            await turn.evaluate((el, s) => (getComputedStyle(el).transform !== 'none') === (s !== 'rendern'), state));
          check('Rückseite übernimmt den echten Status', await ticket.locator('.rmo-ticket-result').textContent() ===
            await ticket.locator('.ru-drucker-text').textContent());
          check('Ticket bleibt 190 Pixel breit und im Bildschirm', await ticket.evaluate(el => {
            const r = el.getBoundingClientRect(); return Math.round(r.width) === 190 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
          }));
          fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
          await ticket.screenshot({ path: path.join(root, 'bilder/motion-rest-ticket-' + width + '-' + theme + '-' + state + '.png') });
        }
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => (window as any).__ticket.setzen('fertig'));
      check('Reduzierte Bewegung wählt die Ergebnisansicht ohne Drehung', await turn.evaluate(el =>
        getComputedStyle(el).transform === 'none' && getComputedStyle(el).transitionDuration === '0s'));
      check('Ergebnis bleibt bei ruhiger Bewegung sichtbar', await ticket.locator('.rmo-ticket-back').evaluate(el => getComputedStyle(el).visibility === 'visible'));
      await page.evaluate(() => { RedionMotion.decorate(document); RedionMotion.decorate(document); });
      check('Doppelte Dekoration verändert die Vorderseite nicht', await ticket.locator('.ru-drucker-buehne').count() === 1 && await turn.count() === 1);
    }
    await page.evaluate(() => (window as any).__ticket.entfernen());
    check('Entfernen räumt beide Seiten auf', await page.locator('.rmo-ticket-turn').count() === 0);
    check('Keine Browserfehler', errors.length === 0);
    await page.close();
  }
} catch (error) { bad++; console.error('✗', error); }
finally { await browser.close(); }
console.log(good + ' grün, ' + bad + ' rot');
process.exitCode = bad ? 1 : 0;
