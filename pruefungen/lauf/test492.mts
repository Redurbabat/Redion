/* Suite 492 — KI-Eingabe, Werkzeuggruppen und ruhige Animationen.
 * Rotprobe: vor dem Bauen fehlen motion.css/motion.js und die zwölf
 * einheitlichen Aktionsknöpfe. Kein Modell wird geladen oder angesprochen.
 * Die Browser-Kontexte haben eigene, flüchtige Datenbanken.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
declare const Store: any;
declare const App: any;
declare const Bibliothek: any;
declare const Elektrostart: any;
declare const RedionMotion: any;

const root = path.resolve(import.meta.dirname, '../..');
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json'
};
const server = http.createServer((request, response) => {
  let file: string;
  try { file = path.resolve(root, '.' + decodeURIComponent((request.url || '/').split('?')[0]!)); }
  catch { response.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end(); return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Prüfserver fehlt');
const base = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
let passed = 0;
let failed = 0;
const check = (name: string, result: unknown, detail?: unknown) => {
  if (result) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name, detail ?? ''); }
};

try {
  check('Bewegungsstil und gebaute Bedienung vorhanden', ['quell/schale/stil/motion.css',
    'quell/schale/bedienung/motion.js'].every(file => fs.existsSync(path.join(root, file))));
  for (const width of [1280, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 },
      hasTouch: width < 760, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html');
    await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
    await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      const note = Store.addPage(null, { text: 'KI-Eingabe prüfen' });
      await Store.flush(); App.oeffne(note.id); App.kiPanel(true);
    });
    await page.waitForSelector('#ai.open');
    await page.waitForTimeout(800);
    const summary = page.locator('#ai-tools summary');
    check(`${width}: Werkzeuge zunächst geschlossen`, !await page.locator('#ai-tools').evaluate((el: HTMLDetailsElement) => el.open));
    check(`${width}: Modellwahl in der Eingabe`, await page.locator('.ai-compose .model-btn').count() === 1);
    const geometry = await page.evaluate(() => {
      const input = document.querySelector('#ai-input')!.getBoundingClientRect();
      const composer = document.querySelector('.ai-compose')!.getBoundingClientRect();
      const buttons = ['#ai-plus', '#ai-modus', '.ai-compose .model-btn', '#ai-diktat', '#ai-senden'].map(selector => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return { selector, x: rect.x, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return { rounded: parseFloat(getComputedStyle(document.querySelector('.ai-compose')!).borderRadius),
        below: buttons.every(b => b.bottom > input.bottom),
        fits: buttons.every(b => b.x >= composer.x && b.right <= composer.right + 1 && b.bottom <= innerHeight),
        touch: buttons.every(b => b.width >= 44 && b.height >= 44), buttons };
    });
    check(`${width}: Große runde Eingabe mit unterer Bedienleiste`, geometry.rounded >= 20 && geometry.below, geometry);
    check(`${width}: Hauptwege mindestens 44 px, ohne Überstand`, geometry.touch && geometry.fits, geometry);
    await summary.click();
    check(`${width}: Vier Gruppen, zwölf unverändert erreichbare Aktionen`,
      await page.locator('.ai-action-group').count() === 4 && await page.locator('.ai-quick button.ru-funkel').count() === 12);
    const protectedButton = await page.locator('#ai-db').evaluate(el => ({
      text: el.textContent!.replace(/\s+/g, ' ').trim(), letters: el.querySelectorAll('.ru-funkel-b').length,
      color: getComputedStyle(el).backgroundColor, icon: !!el.querySelector('svg')
    }));
    check(`${width}: Datenbank-Knopf behält Originaleffekt`, protectedButton.text === 'Datenbank bauen' &&
      protectedButton.letters === 14 && protectedButton.color === 'rgb(16, 16, 16)' && protectedButton.icon, protectedButton);
    const source = page.locator('[data-qs="aktuelleSeite"]');
    const sourceWasOn = await source.getAttribute('aria-pressed');
    await source.click();
    check(`${width}: Quellenzustand bleibt schaltbar und vorlesbar`, await source.getAttribute('aria-pressed') !== sourceWasOn);
    await source.click();
    let privacyWarning = false;
    page.once('dialog', async dialog => {
      privacyWarning = dialog.message().includes('verlässt'); await dialog.dismiss();
    });
    await page.locator('[data-qs="web"]').click();
    check(`${width}: Web bleibt nach abgelehnter Datenschutzfrage aus`, privacyWarning &&
      await page.locator('[data-qs="web"]').getAttribute('aria-pressed') === 'false');
    await page.locator('#ai-db').click();
    check(`${width}: Bau-Knopf öffnet weiterhin seine Rückfrage`, await page.locator('.overlay').count() > 0);
    await page.keyboard.press('Escape');
    await summary.focus(); await page.keyboard.press('Escape');
    check(`${width}: Escape schließt Werkzeuge und behält Tastaturfokus`, await summary.evaluate(el =>
      document.activeElement === el && !(el.parentElement as HTMLDetailsElement).open));
    await page.locator('#ai-input').fill('Erste Zeile');
    await page.locator('#ai-input').press('Shift+Enter');
    check(`${width}: Mehrzeilige Eingabe bleibt erhalten`, (await page.locator('#ai-input').inputValue()).includes('\n'));
    await page.locator('#ai-plus').click();
    check(`${width}: Anhängen-Menü bleibt erreichbar`, await page.locator('.menu').count() === 1);
    await page.keyboard.press('Escape');
    await page.locator('#ai-modus').click();
    check(`${width}: Echte KI-Modi statt erfundener Freigaben`, await page.locator('.menu [data-m="fragen"]').count() === 1);
    await page.keyboard.press('Escape');
    await page.locator('.ai-compose .model-btn').click();
    await page.waitForSelector('.menu');
    check(`${width}: Modellmenü liegt innerhalb des Bildschirms`, await page.locator('.menu').evaluate(el => {
      const rect = el.getBoundingClientRect(); return rect.x >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
    }));
    await page.keyboard.press('Escape');
    check(`${width}: Keine Laufzeitfehler`, errors.length === 0, errors);
    await page.locator('#ai-input').fill('');
    await page.locator('#ai-input').focus();
    fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
    await page.screenshot({ path: path.join(root, `bilder/ai-composer-${width}-dunkel.png`) });
    if (width === 1280) {
      await summary.click();
      await page.screenshot({ path: path.join(root, 'bilder/ai-tools-desktop.png') });
      await page.locator('#ai').screenshot({ path: path.join(root, 'bilder/ai-panel-detail.png') });
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.screenshot({ path: path.join(root, 'bilder/ai-tools-hell.png') });
      check('Neue Animationen respektieren reduzierte Bewegung', await page.locator('.ai-compose').evaluate(el =>
        getComputedStyle(el).animationName === 'none'));
    }
    if (width === 390) {
      await summary.click();
      await page.screenshot({ path: path.join(root, 'bilder/ai-tools-mobile.png') });
      await page.setViewportSize({ width, height: 480 });
      check('Kleine Höhe: Senden und Eingabe bleiben sichtbar', await page.evaluate(() => {
        const input = document.querySelector('#ai-input')!.getBoundingClientRect();
        const send = document.querySelector('#ai-senden')!.getBoundingClientRect();
        return input.top >= 0 && input.height >= 44 && send.bottom <= innerHeight;
      }));
    }
    await context.close();
  }
  const effects = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await effects.goto(base + '/index.html');
  await effects.waitForFunction('typeof Bibliothek !== "undefined" && !!document.querySelector("#page")');
  const folderId = await effects.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const folder = Store.addPage(null, { text: 'Referenzen' });
    Store.updateBlock(folder.id, { heftArt: 'fach' });
    Store.addPage(folder.id, { text: 'Notizen' }); await Store.flush();
    Store.setMeta('bibOrdner', ''); Bibliothek.oeffne();
    RedionMotion.start(); RedionMotion.start();
    return folder.id;
  });
  const cover = effects.locator('.bib-deckel[data-art="ordner"]').first();
  await cover.waitFor();
  check('Ordnerdekoration bleibt nach erneutem Start einmalig', await cover.locator('.rmo-folder-sheet').count() === 5);
  check('Ordnerdekoration ist für Vorleser unsichtbar', await cover.locator('.rmo-folder-stack').getAttribute('aria-hidden') === 'true');
  await cover.hover(); await effects.waitForTimeout(550);
  await effects.screenshot({ path: path.join(root, 'bilder/motion-folder.png') });
  await cover.click();
  check('Animierter Ordner öffnet weiterhin seine echten Inhalte', await effects.evaluate(() => Store.getMeta('bibOrdner', '')) === folderId);
  await effects.evaluate(() => Elektrostart.oeffne());
  await effects.locator('.els-kachel').first().hover();
  await effects.waitForTimeout(400);
  check('Lichtreflex liegt auf erreichbaren Fachkarten', await effects.locator('.els-kachel').count() > 0 &&
    await effects.locator('.els-kachel').first().evaluate(el => getComputedStyle(el, '::after').content === '""'));
  await effects.screenshot({ path: path.join(root, 'bilder/motion-cards.png') });
  await effects.close();
  const local = await browser.newPage();
  await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await local.waitForFunction('typeof RedionMotion !== "undefined"');
  check('Direkter Dateistart lädt Bewegungsmodul', await local.evaluate('typeof RedionMotion.start === "function"'));
  await local.goto(pathToFileURL(path.join(root, 'redion-einzeldatei.html')).href);
  await local.waitForFunction('typeof RedionMotion !== "undefined"');
  check('Einzeldatei enthält Eingabe und Bewegungsstil ohne Nachladen', await local.locator('.ai-compose').count() === 1 &&
    await local.evaluate(() => !document.querySelector('link[rel="stylesheet"]')));
  await local.close();
} catch (error) { failed++; console.error(error); }
finally { await browser.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
console.log(`\nSuite 492: ${passed} grün, ${failed} rot`);
if (failed) process.exitCode = 1;
