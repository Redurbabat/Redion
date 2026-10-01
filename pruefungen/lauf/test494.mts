/* Suite 494 — alle 15 Vorlagenfamilien an echten Produktwegen.
 * --gegenprobe entfernt ausschließlich im isolierten Browser die Transportbindung.
 * Derselbe Abdeckungstest muss dann rot werden. Kein Nutzerbestand, kein Netz. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
declare const Store: any, App: any, Bibliothek: any, Produktwelten: any, Elektrostart: any;
declare const RedionMotion: any, Zeitmesser: any, Drucker: any, Pflege: any, Datenbank: any;
const root = path.resolve(import.meta.dirname, '../..');
const browser = await chromium.launch();
const counterprobe = process.argv.includes('--gegenprobe');
const seen = new Set<string>();
let checks = 0;
function check(name: string, value: unknown) {
  assert.ok(value, name); checks++; console.log('  ✓ ' + name);
}
fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
try {
  for (const width of [1280, 360, 390, 428]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const ids = await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      const folder = Store.addPage(null, { text: 'Motion · Elektrotechnik' });
      Store.updateBlock(folder.id, { heftArt: 'fach' });
      const note = Store.addPage(folder.id, { text: 'Messprotokoll' });
      Store.addBlock(note.id, 'flashcard', { text: 'Spannung :: U' });
      const second = Store.addPage(null, { text: 'Übungsplan' });
      const third = Store.addPage(null, { text: 'Zusammenfassung' });
      [note, second, third].forEach((p, index) => Store.updateBlock(p.id, { zuletztGeoeffnet: Date.now() - index * 60000 }));
      await Store.flush(); Store.setMeta('bibOrdner', ''); Bibliothek.oeffne();
      return { folder: folder.id, note: note.id };
    });
    const capture = async (name: string) => {
      await page.waitForTimeout(180);
      for (const id of await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-rmo]'))
        .filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
        .flatMap(el => (el.dataset.rmo || '').split(' ')))) seen.add(id);
      check(width + ' ' + name + ': kein Seitenüberlauf', await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth + 1));
    };
    const catalog = await page.evaluate(() => RedionMotion.catalog());
    /* Ring und Herz gehören zur Statistik-Vorlage, nicht zu neuen Familien. */
    check('Katalog hat exakt 15 eindeutige Einträge', catalog.length === 15 && new Set(catalog.map((e: any) => e.id)).size === 15);
    check('Jeder Eintrag benennt einen Produktort', catalog.every((e: any) => e.place && e.selector));
    await page.locator('.rmo-recent-card').first().waitFor();
    check('Drei echte zuletzt geöffnete Dokumente', await page.locator('[data-rmo-open]').count() === 3);
    const folder = page.locator('.bib-deckel[data-id="' + ids.folder + '"]');
    await folder.scrollIntoViewIfNeeded(); await folder.focus();
    check('Ordner zählt und zeigt die echte Unterseite', await folder.locator('.rmo-folder-preview').textContent() === '1 UnterseiteMessprotokoll');
    await capture('Bibliothek');
    await page.screenshot({ path: path.join(root, 'bilder/motion-all-library-' + width + '.png') });
    if (width < 600) await folder.tap(); else await folder.press('Enter');
    check('Touch/Tastatur öffnet den echten Ordner', await page.evaluate(() => Store.getMeta('bibOrdner')) === ids.folder);
    await page.locator('[data-ordner=""]').click();
    await page.locator('[data-rmo-open="' + ids.note + '"]').click();
    check('Dokumentkarte öffnet das zugehörige Dokument', await page.evaluate(() => App.aktuelleSeite()) === ids.note);
    await page.evaluate(() => App.kiPanel(true));
    await page.locator('#ai-mehr').click();
    await capture('KI');
    await page.waitForTimeout(1600);
    check('KI-Werkzeuge ohne Endlosschleifen im Leerlauf', await page.evaluate(() =>
      document.getAnimations().filter(a => a.playState === 'running' &&
        a.effect?.getTiming().iterations === Infinity &&
        (a.effect as KeyframeEffect)?.target instanceof Element &&
        ((a.effect as KeyframeEffect).target as Element).closest('#ai [data-rmo]')).length <= 2));
    await page.screenshot({ path: path.join(root, 'bilder/motion-all-ai-' + width + '.png') });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await capture('KI ' + theme);
    }
    await page.keyboard.press('Escape');
    await page.evaluate(() => { App.kiPanel(false); Produktwelten.lernen('lernen'); });
    await page.locator('.lw-metrik strong').first().waitFor();
    await capture('Lernen');
    check('Kennzahlen bleiben echte Texte', await page.locator('.lw-metrik strong.rmo-number').first().evaluate(el =>
      el.textContent === el.querySelector('.rmo-number-source')?.textContent));
    await page.evaluate(() => Pflege.gesundheit());
    await page.locator('.rmo-health').waitFor();
    check('Bestandskurve zeigt sieben echte Tageswerte', await page.locator('.rmo-history progress').count() === 7);
    await capture('Bestandsgesundheit');
    await page.screenshot({ path: path.join(root, 'bilder/motion-all-health-' + width + '.png') });
    await page.locator('.overlay .fh [data-a="zu"]').click();
    await page.evaluate(() => Elektrostart.oeffne());
    await capture('Elektro');
    await page.evaluate(() => {
      const p = Store.addPage(null, { text: 'Schaltplan · Motion' });
      Store.addBlock(p.id, 'schaltplan', { text: 'Stromkreis' }); App.oeffne(p.id);
    });
    const power = page.locator('.sp-start').first();
    await power.waitFor(); await power.scrollIntoViewIfNeeded();
    check('Filament beginnt ausgeschaltet', await power.getAttribute('data-rmo-state') === 'aus');
    await power.click(); await page.waitForTimeout(80);
    check('Filament folgt dem tatsächlichen Stromschalter', await power.getAttribute('data-rmo-state') === 'an' &&
      await power.evaluate(el => el.classList.contains('an')));
    await capture('Schaltplan');
    await power.click();
    await page.evaluate(() => {
      const p = Store.addPage(null, { text: 'Automationen · Motion' });
      const db = Store.addDatabase(p.id, 'Aufträge', { title: { name: 'Titel', type: 'title' } }, 'table');
      const c = Store.getCollection(db.collectionId);
      Store.updateCollection(c.id, { automationen: [{ id: 'motion-auto', name: 'Lokaler Hinweis', an: true,
        wenn: { art: 'zeile-neu' }, dann: [{ art: 'melden', text: 'Neue Zeile' }] }] });
      App.oeffne(p.id);
    });
    await page.locator('[data-a="auto"]').first().click();
    await page.locator('.auto-zeile .schalter').waitFor();
    await capture('Automationen');
    await page.locator('.auto-zeile .schalter').click(); await page.waitForTimeout(80);
    check('Automation bleibt nativ schaltbar', await page.locator('.auto-zeile .schalter').getAttribute('aria-checked') === 'false');
    check('Status nennt den echten Pausenzustand', await page.locator('.auto-zeile .rmo-product-status').innerText() === 'Pausiert');
    await page.locator('.overlay .fh [data-a="zu"]').click();
    await page.keyboard.press('Control+,');
    await capture('Einstellungen');
    await page.evaluate(() => {
      document.querySelectorAll('.overlay').forEach(el => el.remove());
      Zeitmesser.panel();
    });
    const transport = page.locator('.rmo-transport');
    await transport.waitFor();
    check('Mechanischer Block hat genau drei native Tasten', await transport.locator('button').count() === 3);
    await transport.locator('[data-zm="stoppuhr"]').click();
    await transport.locator('[data-zm="pause"]').focus();
    const focus = await transport.locator('[data-zm="pause"]').elementHandle();
    await page.waitForTimeout(1100);
    check('Ticks erhalten den Tastenknoten und Fokus', await focus!.evaluate(el => el === document.activeElement && el.isConnected));
    await transport.locator('[data-zm="pause"]').press('Enter');
    check('Pause ist ein echter Zeitmesserzustand', await page.evaluate(() => Zeitmesser.stand().pausiert));
    if (counterprobe) await transport.evaluate(el => el.removeAttribute('data-rmo'));
    check('Transportbindung vorhanden (Rotprobe)', (await transport.getAttribute('data-rmo'))?.includes('transport'));
    await capture('Zeitmesser');
    await page.screenshot({ path: path.join(root, 'bilder/motion-all-timer-' + width + '.png') });
    await transport.locator('[data-zm="stopp"]').click();
    await page.locator('[data-zm="zu"]').click();
    await page.evaluate(() => { (window as any).__motionJob = Drucker.zeigen(); (window as any).__motionJob.setzen('rendern'); });
    await capture('PDF-Ausgabe');
    const ticket = page.locator('.ru-drucker-schwebt');
    check('PDF-Ticket zeigt tatsächlichen Auftragszustand', await ticket.getAttribute('data-rmo-state') === 'rendern');
    for (const state of ['fertig', 'fehler', 'speichern']) {
      await page.evaluate(value => (window as any).__motionJob.setzen(value), state);
      await page.waitForTimeout(60);
      check('Kein Loader nach ' + state, await ticket.locator('.rmo-liquid').evaluate(el => getComputedStyle(el).display === 'none'));
    }
    await page.evaluate(() => (window as any).__motionJob.setzen('rendern'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check('Systemvorgabe stoppt den Doppelring', await ticket.locator('.rmo-liquid').evaluate(el =>
      getComputedStyle(el, '::before').animationName === 'none'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => document.body.dataset.bewegung = 'ruhig');
    check('Ruhige Einstellung stoppt den Doppelring', await ticket.locator('.rmo-liquid').evaluate(el =>
      getComputedStyle(el, '::before').animationName === 'none'));
    await page.evaluate(() => { delete document.body.dataset.bewegung; RedionMotion.decorate(document); RedionMotion.decorate(document); });
    check('Wiederholte Dekoration bleibt einmalig', await ticket.locator('.rmo-ticket-heading').count() === 1 &&
      await ticket.locator(':scope > .rmo-liquid').count() === 1);
    await ticket.evaluate(el => { (el as HTMLElement).style.top = '-2000px'; (el as HTMLElement).style.bottom = 'auto'; });
    await page.waitForTimeout(150);
    check('Offscreen-Effekte pausieren', await ticket.locator('.rmo-liquid').evaluate(el =>
      getComputedStyle(el, '::before').animationPlayState === 'paused'));
    await page.evaluate(() => (window as any).__motionJob.entfernen());
    check('Keine Browserfehler', errors.length === 0);
    await context.close();
  }
  const expected = ['folder','sliders','light','gradient','letters','liquid','toggle','carousel','glass','metric','status','ticket','orb','filament','transport'];
  check('Alle 15 Familien an Produktorten gesehen: ' + [...seen].sort().join(', '), expected.every(id => seen.has(id)));
  console.log('Suite 494: ' + checks + ' grün.');
} catch (error) {
  console.error('✗ Suite 494:', error); process.exitCode = 1;
} finally { await browser.close(); }
