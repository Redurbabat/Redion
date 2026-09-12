/* Suite 493 — Ziffernrollen, Ordnerklappe und zustandsgebundenes Druckticket.
 * Rotprobe vor der Umsetzung: ungültiges transformo-style, keine Ziffernrollen
 * oder Ticketdekoration; Papierglanz lief auch bei Fertig/Fehler weiter.
 * Reine lokale Browser-Kontexte. Der Druckgriff wird als UI-Prüfzustand
 * gestellt; diese Suite druckt nichts und öffnet keinen Druckdialog.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
declare const Store: any;
declare const Bibliothek: any;
declare const Produktwelten: any;
declare const Drucker: any;
declare const RedionMotion: any;

const root = path.resolve(import.meta.dirname, '../..');
const browser = await chromium.launch();
let passed = 0, failed = 0;
const check = (name: string, valid: unknown, detail?: unknown) => {
  if (valid) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name, detail ?? ''); }
};
fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
try {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 760 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction('typeof Drucker !== "undefined" && !!document.querySelector("#page")?.firstElementChild');
    const invalid = await page.evaluate(css => {
      /* @property enthält Deskriptoren, keine Element-Eigenschaften. */
      const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@property\s+[^{}]+\{[^{}]*\}/g, '');
      return Array.from(clean.matchAll(/(?:[;{])\s*([-\w]+)\s*:\s*([^;{}]+)(?=[;}])/g))
        .filter(([, property, value]) => !property!.startsWith('--') && !CSS.supports(property!, value!.trim().replace(/\s*!important$/, '')))
        .map(([, property, value]) => property + ': ' + value);
    }, fs.readFileSync(path.join(root, 'quell/schale/stil/motion.css'), 'utf8'));
    check(`${width}: Browser versteht alle neuen CSS-Eigenschaften`, invalid.length === 0, invalid);
    await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      const folder = Store.addPage(null, { text: 'Elektrotechnik' });
      Store.updateBlock(folder.id, { heftArt: 'fach' });
      const notes = Store.addPage(folder.id, { text: 'Messprotokoll' });
      /* Karten liegen im Dokument: direkt im Fach klassifizieren sie den
         Deckel absichtlich als Karteikartensatz, nicht als Ordner. */
      for (const text of ['Spannung :: U', 'Strom :: I', 'Widerstand :: R']) Store.addBlock(notes.id, 'flashcard', { text });
      await Store.flush(); Store.setMeta('bibOrdner', ''); Bibliothek.oeffne();
    });
    const folder = page.locator('.bib-deckel[data-art="ordner"]').first();
    await folder.waitFor();
    await folder.focus();
    await page.waitForTimeout(600);
    const folderStyle = await folder.evaluate(el => {
      const surface = el.querySelector('.bib-deckel-blatt')!;
      return { depth: getComputedStyle(surface).transformStyle,
        flap: getComputedStyle(surface, '::before').transform,
        papers: el.querySelectorAll('.rmo-folder-sheet').length };
    });
    check(`${width}: Ordner besitzt 3D-Tiefe und fünf Blätter`, folderStyle.depth === 'preserve-3d' && folderStyle.papers === 5, folderStyle);
    check(`${width}: Tastaturfokus öffnet die Ordnerklappe`, folderStyle.flap !== 'none', folderStyle);
    await page.screenshot({ path: path.join(root, `bilder/motion-folder-v2-${width}.png`) });
    await page.evaluate(() => Produktwelten.lernen('lernen'));
    await page.locator('.lw-metrik strong').first().waitFor();
    /* Die Identität darf nicht vom Wert abhängen, den diese Probe ändert. */
    const metric = page.locator('.lw-metrik strong').first();
    check(`${width}: Echte Kennzahl trägt den Zifferneffekt`, await metric.locator('.rmo-reels').count() === 1);
    check(`${width}: Textwert bleibt unverändert im DOM`, await metric.evaluate(el =>
      /^\d+$/.test(el.textContent || '') && el.querySelector('.rmo-reels')?.getAttribute('aria-hidden') === 'true'));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(root, `bilder/motion-learning-${width}.png`) });
    /* Format-Grenzen am wirklichen Zahlenelement, nicht an einem Attrappen-Widget. */
    for (const value of ['1’234', '12,5 %', '3 / 7', '–']) {
      await metric.evaluate((el, text) => { el.textContent = text; }, value);
      await page.waitForTimeout(40);
      check(`${width}: Wertänderung ${value} bleibt exakt`, await metric.textContent() === value);
      check(`${width}: Passende Darstellung für ${value}`, await metric.locator('.rmo-reels').count() === (value === '–' ? 0 : 1));
    }
    await page.evaluate(() => {
      const job = Drucker.zeigen(); (window as any).__motionPrintTest = job;
      job.setzen('rendern'); RedionMotion.start(); RedionMotion.start();
    });
    await page.waitForTimeout(200);
    const ticket = page.locator('.ru-drucker-schwebt');
    check(`${width}: Druckstatus wird genau einmal zum Ticket`, await ticket.locator('.rmo-ticket-heading').count() === 1);
    check(`${width}: Druckstatus und Originalbreite bleiben`, await ticket.getAttribute('role') === 'status' &&
      await ticket.locator('.ru-drucker-text').textContent() === 'Seiten setzen …' &&
      await ticket.evaluate(el => Math.round(el.getBoundingClientRect().width)) === 190);
    check(`${width}: Glanz nur bei laufendem Auftrag`, await ticket.locator('.ru-drucker-blatt').evaluate(el => getComputedStyle(el).animationName !== 'none'));
    await page.screenshot({ path: path.join(root, `bilder/motion-ticket-${width}.png`) });
    await ticket.screenshot({ path: path.join(root, `bilder/motion-ticket-detail-${width}.png`) });
    for (const state of ['speichern', 'fertig', 'fehler']) {
      await page.evaluate(value => (window as any).__motionPrintTest.setzen(value), state);
      check(`${width}: Papierglanz stoppt bei ${state}`, await ticket.locator('.ru-drucker-blatt').evaluate(el => getComputedStyle(el).animationName === 'none'));
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => (window as any).__motionPrintTest.setzen('rendern'));
    check(`${width}: Druckticket bleibt bei reduzierter Bewegung still`, await ticket.locator('.ru-drucker-blatt').evaluate(el => getComputedStyle(el).animationName === 'none'));
    await page.evaluate(() => (window as any).__motionPrintTest.entfernen());
    check(`${width}: Entfernen hinterlässt keine Ticketdekoration`, await page.locator('.rmo-ticket-heading').count() === 0);
    check(`${width}: Keine Laufzeitfehler`, errors.length === 0, errors);
    await context.close();
  }
} catch (error) { failed++; console.error(error); }
finally { await browser.close(); }
console.log(`\nSuite 493: ${passed} grün, ${failed} rot`);
if (failed) process.exitCode = 1;
