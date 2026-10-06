/* Suite 492 — KI-Eingabe, Werkzeuggruppen und ruhige Animationen.
 * Rotprobe: vor dem Bauen fehlen motion.css/motion.js und die zwölf
 * einheitlichen Aktionsknöpfe. Kein Modell wird geladen oder angesprochen.
 * Die Browser-Kontexte haben eigene, flüchtige Datenbanken.
 * E714: die Frage „kein Stilblatt nachgeladen" an die Einzeldatei steht ein
 * zweites Mal, NACHDEM `Inseln.bereit()` fertig ist — gleich nach dem Laden
 * gefragt, hing ihr Ergebnis am Leerlauf (rot eingecheckt).
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
declare const Inseln: any;

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
    /* SEIT E724 KEINE SCHUBLADE. „Werkzeuge & Kontext" ist aufgelöst: die
       Seitenaktionen stehen im leeren Chat, die Quellen am Prompt, Agent,
       Besprechung und Protokoll im ⋯ des Kopfs. Was hier „zunächst
       geschlossen" hiess, heisst jetzt: ohne einen Klick zu sehen. */
    check(`${width}: Keine Schublade mehr, die Seitenaktionen stehen im leeren Chat`,
      await page.locator('#ai-tools').count() === 0 && await page.locator('#ai .ai-start').isVisible());
    check(`${width}: Modellwahl in der Eingabe`, await page.locator('.ai-compose .model-btn').count() === 1);
    const geometry = await page.evaluate(() => {
      const input = document.querySelector('#ai-input')!.getBoundingClientRect();
      const composer = document.querySelector('.ai-compose')!.getBoundingClientRect();
      /* SECHS Knöpfe seit E724 — `#ai-quellen` ist zurück am Prompt. Auch
         bei 360 px muss jeder 44 px messen und in die Eingabe passen. */
      const buttons = ['#ai-plus', '#ai-quellen', '#ai-modus', '.ai-compose .model-btn', '#ai-diktat', '#ai-senden'].map(selector => {
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
    check(`${width}: Acht Seitenaktionen ohne einen Klick erreichbar, Funkel unverändert`,
      await page.locator('.ai-start button.ru-funkel').count() === 8);
    const protectedButton = await page.locator('#ai-db').evaluate(el => ({
      text: el.textContent!.replace(/\s+/g, ' ').trim(), letters: el.querySelectorAll('.ru-funkel-b').length,
      color: getComputedStyle(el).backgroundColor, icon: !!el.querySelector('svg')
    }));
    check(`${width}: Datenbank-Knopf behält Originaleffekt`, protectedButton.text === 'Datenbank bauen' &&
      protectedButton.letters === 14 && protectedButton.color === 'rgb(16, 16, 16)' && protectedButton.icon, protectedButton);
    /* Die Quellen stehen im Menü am Prompt (E724). */
    await page.locator('#ai-quellen').click();
    const source = page.locator('.menu [data-qs="aktuelleSeite"]');
    const sourceWasOn = await source.getAttribute('aria-pressed');
    await source.click();
    check(`${width}: Quellenzustand bleibt schaltbar und vorlesbar`, await source.getAttribute('aria-pressed') !== sourceWasOn);
    await source.click();
    /* Die Datenschutzfrage ist seit E724 ein Redion-Fenster (Dialog, E710),
       kein `confirm()` — der Satz mit „verlässt" steht jetzt dort. */
    let nativ = 0;
    const zaehle = async (dialog: { dismiss: () => Promise<void> }) => { nativ++; await dialog.dismiss(); };
    page.on('dialog', zaehle);
    await page.locator('.menu [data-qs="web"]').click();
    await page.waitForTimeout(700);
    const privacyWarning = await page.evaluate(() =>
      /verlässt/.test(document.querySelector('.overlay, [data-insel-traeger]')?.textContent || ''));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    page.off('dialog', zaehle);
    check(`${width}: Web bleibt nach abgelehnter Datenschutzfrage aus`, privacyWarning && nativ === 0 &&
      await page.evaluate(() => !Kontext.quellen().web), { privacyWarning, nativ });
    await page.evaluate(() => document.querySelectorAll('.menu,.overlay').forEach(m => m.remove()));
    await page.locator('#ai-db').click();
    check(`${width}: Bau-Knopf öffnet weiterhin seine Rückfrage`, await page.locator('.overlay').count() > 0);
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelectorAll('.overlay').forEach(m => m.remove()));
    await page.locator('#ai-quellen').focus(); await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check(`${width}: Escape schließt das Quellenmenü und behält Tastaturfokus`, await page.evaluate(() =>
      document.activeElement?.id === 'ai-quellen' && !document.querySelector('.menu')));
    await page.locator('#ai-input').fill('Erste Zeile');
    await page.locator('#ai-input').press('Shift+Enter');
    check(`${width}: Mehrzeilige Eingabe bleibt erhalten`, (await page.locator('#ai-input').inputValue()).includes('\n'));
    /* „SICHTBAR ÜBER DEM BLATT" (E724). Am Telefon lag jedes Menü unter dem
       KI-Blatt (600 gegen 920) — gezählt und vermessen war es trotzdem, also
       waren die alten Zusicherungen grün auf einem UNSICHTBAREN Menü. Gemessen
       wird jetzt die Ebene im Wurzelstapel und der Treffer bei abgeschaltetem
       `inert` (sonst sieht die Trefferprüfung durch das Blatt hindurch). */
    const ueberDemBlatt = () => page.evaluate(() => {
      const m = document.querySelector<HTMLElement>('.menu');
      const ai = document.getElementById('ai');
      if (!m || !ai) return false;
      const z = (e: Element) => parseInt(getComputedStyle(e).zIndex, 10) || 0;
      const war = ai.inert; ai.inert = false;
      const r = m.getBoundingClientRect();
      const oben = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(20, r.height / 2));
      ai.inert = war;
      return z(m) > z(ai) && !!oben && m.contains(oben);
    });
    await page.locator('#ai-plus').click();
    check(`${width}: Anhängen-Menü bleibt erreichbar`, await page.locator('.menu').count() === 1);
    if (width < 760) check(`${width}: … und sichtbar über dem Blatt`, await ueberDemBlatt());
    await page.keyboard.press('Escape');
    await page.locator('#ai-modus').click();
    check(`${width}: Echte KI-Modi statt erfundener Freigaben`, await page.locator('.menu [data-m="fragen"]').count() === 1);
    await page.keyboard.press('Escape');
    await page.locator('.ai-compose .model-btn').click();
    await page.waitForSelector('.menu');
    check(`${width}: Modellmenü liegt innerhalb des Bildschirms`, await page.locator('.menu').evaluate(el => {
      const rect = el.getBoundingClientRect(); return rect.x >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
    }));
    if (width < 760) check(`${width}: … und sichtbar über dem Blatt`, await ueberDemBlatt());
    await page.keyboard.press('Escape');
    check(`${width}: Keine Laufzeitfehler`, errors.length === 0, errors);
    await page.locator('#ai-input').fill('');
    await page.locator('#ai-input').focus();
    fs.mkdirSync(path.join(root, 'bilder'), { recursive: true });
    await page.screenshot({ path: path.join(root, `bilder/ai-composer-${width}-dunkel.png`) });
    if (width === 1280) {
      await page.screenshot({ path: path.join(root, 'bilder/ai-tools-desktop.png') });
      await page.locator('#ai').screenshot({ path: path.join(root, 'bilder/ai-panel-detail.png') });
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.screenshot({ path: path.join(root, 'bilder/ai-tools-hell.png') });
      check('Neue Animationen respektieren reduzierte Bewegung', await page.locator('.ai-compose').evaluate(el =>
        getComputedStyle(el).animationName === 'none'));
    }
    if (width === 390) {
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
  /* DIESELBE FRAGE, NACHDEM DIE INSELN DA SIND (E714). Die Zeile darüber
     fragt gleich nach dem Laden — und die Inseln (E699) kommen im Leerlauf
     DANACH. Ob sie ihr Stilblatt schon eingehängt hatten, war Zufall: auf
     demselben Stand einmal rot, einmal grün. Hier wird gewartet, bis
     `Inseln.bereit()` fertig ist, und dann gefragt. */
  const inselnDa = await local.evaluate(() => Inseln.bereit().then(() => 'ja', (e: unknown) => String(e)));
  const nachgeladen = await local.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map(l => (l.getAttribute('href') ?? '').slice(0, 24)));
  check('Einzeldatei: auch mit geholten Inseln kein Stilblatt nachgeladen', inselnDa === 'ja' &&
    nachgeladen.length === 0, { inselnDa, nachgeladen });
  await local.close();
} catch (error) { failed++; console.error(error); }
finally { await browser.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
console.log(`\nSuite 492: ${passed} grün, ${failed} rot`);
if (failed) process.exitCode = 1;
