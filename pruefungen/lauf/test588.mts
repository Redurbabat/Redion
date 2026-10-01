/* Bibliothek: ein Objektmenü, echte Ordnerdaten, eine Suche mit drei Bereichen. */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'
};
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent((request.url || '/index.html').split('?')[0] || '/index.html');
  const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end(); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  response.end(fs.readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true,
  serviceWorkers: 'block' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let passed = 0;
const check = (name: string, condition: unknown): void => {
  assert.ok(condition, name); passed++; console.log('  ✓ ' + name);
};
const datum = (id: string): string => `.bib-deckel[data-id="${id}"]`;
const more = (id: string): string => `${datum(id)} + .bib-deckel-mehr`;
const menuActions = async (): Promise<string[]> =>
  page.locator('.menu button[data-a]').evaluateAll(buttons =>
    buttons.map(button => button.getAttribute('data-a') || ''));
const menuClose = async (): Promise<void> => {
  await page.keyboard.press('Escape');
  await page.locator('.menu').waitFor({ state: 'hidden' });
};
try {
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof Bibliothek !== 'undefined'");
  const ids = await page.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('bibForm', 'deckel');
    Store.setMeta('bibOrdner', '');
    Store.setMeta('bibBaumSichtbar', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(x => x.remove());
    const folder = Store.addPage(null, { text: 'Ordner 588', heftArt: 'fach' });
    const child = Store.addPage(folder.id, { text: 'Suchmarker588 Innen', dokumentModus: true });
    Store.addBlock(child.id, 'text', { text: 'Echter Inhalt im Ordner.' });
    const other = Store.addPage(null, { text: 'Suchmarker588 Außen' });
    const sibling = Store.addPage(null, { text: 'Anderer Ordner 588', heftArt: 'fach' });
    await Store.flush();
    Bibliothek.oeffne(null);
    return { folder: folder.id, child: child.id, other: other.id, sibling: sibling.id };
  })()`) as { folder: string; child: string; other: string; sibling: string };
  await page.locator(datum(ids.folder)).waitFor();

  check('Eine globale Suche statt Bibliotheks-Doppeleingaben',
    await page.locator('#bib-studio-suche,#bib-suche').count() === 0);
  await page.evaluate("App.suche('Suchmarker588')");
  check('Suche startet im Bibliothekskontext',
    await page.locator('#such-bereich').inputValue() === 'bibliothek');
  await page.waitForFunction("document.querySelectorAll('.such #res button[data-i]').length >= 2");
  check('Bibliothekskontext findet beide echten Seiten',
    await page.locator('.such #res button[data-i]').count() >= 2);
  await page.locator('#such-bereich').selectOption('global');
  check('Globaler Suchmodus ist ausdrücklich wählbar',
    await page.locator('#such-bereich').inputValue() === 'global');
  await page.keyboard.press('Escape');
  await page.evaluate(`App.oeffne(${JSON.stringify(ids.child)})`);
  await page.evaluate("App.suche('Suchmarker588')");
  check('Im Dokument startet die Suche im aktuellen Dokument',
    await page.locator('#such-bereich').inputValue() === 'dokument');
  await page.waitForFunction("document.querySelectorAll('.such #res button[data-i]').length === 1");
  check('Dokumentkontext begrenzt Ergebnisse wirklich',
    await page.locator('.such #res button[data-i]').count() === 1);
  await page.locator('#such-bereich').selectOption('bibliothek');
  check('Wechsel zum Bibliotheksmodus erweitert dieselbe Abfrage',
    await page.locator('.such #res button[data-i]').count() >= 2);
  await page.keyboard.press('Escape');
  await page.evaluate('Bibliothek.oeffne(null)');
  await page.locator(datum(ids.folder)).waitFor();

  const deckel = page.locator(datum(ids.folder));
  check('Mehr ist ein eigener bedienbarer Knopf, kein Knopf im Knopf',
    await page.locator(more(ids.folder)).count() === 1 &&
    await deckel.locator('.bib-deckel-mehr').count() === 0 &&
    await page.locator(more(ids.folder)).evaluate(e => e.getBoundingClientRect().width >= 44));
  await deckel.click({ button: 'right' });
  const mouseActions = await menuActions();
  check('Rechtsklick bietet echte Ordneraktionen',
    ['oeffnen','blick','stern','umbenennen','farbe','papierkorb'].every(action => mouseActions.includes(action)) &&
    !mouseActions.includes('verschieben'));
  await menuClose();
  await deckel.focus();
  await page.keyboard.press('Shift+F10');
  check('Shift+F10 nutzt dieselbe Aktionsliste',
    JSON.stringify(await menuActions()) === JSON.stringify(mouseActions));
  await menuClose();
  await page.locator(more(ids.folder)).tap();
  check('Touch-Mehr nutzt dieselbe Aktionsliste',
    JSON.stringify(await menuActions()) === JSON.stringify(mouseActions));
  await menuClose();

  await page.evaluate("Store.setMeta('bibForm','liste'); Bibliothek.oeffne(null)");
  await page.locator(`.bib-zeile[data-id="${ids.folder}"] .bib-zeile-mehr`).click();
  check('Listen-Menü nutzt dieselbe Aktionsliste',
    JSON.stringify(await menuActions()) === JSON.stringify(mouseActions));
  await menuClose();
  await page.evaluate("Store.setMeta('bibForm','deckel'); Bibliothek.oeffne(null)");
  await page.locator(`[data-bib-baum] [data-baum-id="${ids.folder}"] .bib-baum-mehr`).click();
  check('Baum-Menü nutzt dieselbe Aktionsliste',
    JSON.stringify(await menuActions()) === JSON.stringify(mouseActions));
  await menuClose();

  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="umbenennen"]').click();
  await page.locator('.overlay #fq').fill('Anderer Ordner 588');
  await page.locator('.overlay [data-a="ok"]').click();
  check('Gleichnamige Geschwister werden abgewiesen',
    await page.evaluate(`Store.getBlock(${JSON.stringify(ids.folder)}).text`) === 'Ordner 588');
  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="umbenennen"]').click();
  await page.locator('.overlay #fq').fill('Umbenannter Ordner 588');
  await page.locator('.overlay [data-a="ok"]').click();
  check('Umbenennen schreibt den echten Ordnerblock',
    await page.evaluate(`Store.getBlock(${JSON.stringify(ids.folder)}).text`) === 'Umbenannter Ordner 588');
  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="farbe"]').click();
  await page.locator('.nh-farben button[data-farbe="blue"]').click();
  check('Farbwahl schreibt die vorhandene color-Eigenschaft',
    await page.evaluate(`Store.getBlock(${JSON.stringify(ids.folder)}).color`) === 'blue' &&
    await page.locator(datum(ids.folder)).getAttribute('data-farbe') === 'blue');
  await page.evaluate('Store.flush()');
  await page.reload();
  await page.waitForFunction("typeof Bibliothek !== 'undefined' && typeof Store !== 'undefined'");
  check('Name und Farbe überstehen Neuladen',
    await page.evaluate(`(() => { const p=Store.getBlock(${JSON.stringify(ids.folder)}); return p.text === 'Umbenannter Ordner 588' && p.color === 'blue'; })()`));
  await page.evaluate("Store.setMeta('bibForm','deckel'); Bibliothek.oeffne(null)");
  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="papierkorb"]').click();
  check('Nichtleerer Ordner benennt die Zahl seiner direkten Elemente',
    /1 direktes Element/.test(await page.locator('.overlay .wahl').innerText()));
  await page.locator('.overlay [data-w="abbruch"]').click();
  check('Abbruch lässt Ordner und Kinder unberührt',
    await page.evaluate(`Store.getBlock(${JSON.stringify(ids.folder)}).alive !== false && Store.getBlock(${JSON.stringify(ids.child)}).alive !== false`));
  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="papierkorb"]').click();
  await page.locator('.overlay [data-w="papierkorb"]').click();
  check('Papierkorb blendet Ordner und Kind aus, ohne Kind zu löschen',
    await page.evaluate(`(() => Store.getBlock(${JSON.stringify(ids.folder)}).alive === false &&
      Store.getBlock(${JSON.stringify(ids.child)}).alive !== false &&
      !Bibliothek.alleSeiten().some(p => p.id === ${JSON.stringify(ids.child)}))()`) &&
    await page.locator(datum(ids.folder)).count() === 0);
  await page.locator('#bib-undo button').click();
  check('Rückgängig holt Ordner und Kinder an denselben Ort zurück',
    await page.evaluate(`(() => Store.getBlock(${JSON.stringify(ids.folder)}).alive !== false &&
      Store.getBlock(${JSON.stringify(ids.child)}).parentId === ${JSON.stringify(ids.folder)} &&
      Bibliothek.alleSeiten().some(p => p.id === ${JSON.stringify(ids.child)}))()`));
  await page.locator(more(ids.folder)).click();
  await page.locator('.menu [data-a="papierkorb"]').click();
  await page.locator('.overlay [data-w="papierkorb"]').click();
  await page.evaluate('App.papierkorb()');
  await page.locator(`.pk-res button[data-id="${ids.folder}"] [data-a="restore"]`).click();
  check('Wiederherstellung aus dem Papierkorb erhält Unterseite und Parent-Beziehung',
    await page.evaluate(`(() => Store.getBlock(${JSON.stringify(ids.folder)}).alive !== false &&
      Store.getBlock(${JSON.stringify(ids.child)}).alive !== false &&
      Store.getBlock(${JSON.stringify(ids.child)}).parentId === ${JSON.stringify(ids.folder)} &&
      Store.getBlock(${JSON.stringify(ids.folder)}).content.includes(${JSON.stringify(ids.child)}))()`));
  check('Keine Laufzeitfehler', errors.length === 0);
  console.log(`\n${passed}/${passed} bestanden`);
} finally {
  await context.close();
  await browser.close();
  await new Promise<void>(done => server.close(() => done()));
}
