/* Der Studio-Trenner verändert die SICHTBARE Navigationsbreite, nicht nur
 * seine aria-Zahl. Gegen 4d9a9a3fb wird dieser Lauf rot: die Breitenvariable
 * wird am body gesetzt, ihr abhängiger Wert aber schon an :root berechnet. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json'
};
const server = http.createServer((request, response) => {
  const name = decodeURIComponent((request.url || '/').split('?')[0] || '/');
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end(); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  response.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let failed = 0;
const check = (name: string, actual: unknown, expected: unknown): void => {
  const yes = actual === expected;
  console.log((yes ? '  ✓ ' : '  ✗ ') + name + (yes ? '' : `: ${String(actual)} statt ${String(expected)}`));
  if (!yes) failed++;
};

try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => typeof Store !== 'undefined' && !!document.body.dataset.studioNav);
  await page.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove());
    Bibliothek.oeffne(null);
  });
  const theme = page.locator('#studio-theme');
  check('Farbschema-Knopf zeigt im Dunkeln ein Sonnenzeichen',
    await theme.locator('.studio-theme-sun:visible').count(), 1);
  check('Sonnenzeichen nennt die nächste Aktion', await theme.getAttribute('aria-label'),
    'Zum hellen Farbschema wechseln');
  check('Farbschema-Knopf hat ein 44-px-Touchziel',
    await theme.evaluate(el => Math.round(el.getBoundingClientRect().width) >= 44), true);
  await theme.click();
  check('Farbschema-Knopf zeigt im Hellen ein Mondzeichen',
    await theme.locator('.studio-theme-moon:visible').count(), 1);
  check('Mondzeichen nennt die nächste Aktion', await theme.getAttribute('aria-label'),
    'Zum dunklen Farbschema wechseln');
  await theme.click();
  await page.evaluate(() => Lernwelt.oeffnen('heute'));
  const groups = page.locator('.lernwelt .lw-nav > button');
  check('Oben stehen nur Heute und Übersicht',
    (await groups.allTextContents()).map(text => text.trim().replace(/\s+/g, ' ')).join('|'), 'Heute|Übersicht');
  const today = page.locator('.lernwelt .lw-nav [data-lw-group="heute"]');
  check('Heute ist zunächst aufgeklappt', await today.getAttribute('aria-expanded'), 'true');
  await today.click();
  check('Heute lässt sich zuklappen', await today.getAttribute('aria-expanded'), 'false');
  await today.focus();
  await page.keyboard.press('Enter');
  check('Heute lässt sich mit Tastatur aufklappen', await today.getAttribute('aria-expanded'), 'true');
  check('Prüfungen bleiben unter Heute erreichbar',
    await page.locator('.lernwelt .lw-subnav:not([hidden]) [data-lw-nav="pruefungen"]').count(), 1);
  await page.locator('.lernwelt .lw-nav [data-lw-group="lernen"]').click();
  check('Übersicht ist aufgeklappt',
    await page.locator('.lernwelt .lw-nav [data-lw-group="lernen"]').getAttribute('aria-expanded'), 'true');
  check('Trainer und Lernpfad bleiben unter Übersicht erreichbar',
    await page.locator('.lernwelt .lw-subnav:not([hidden]) [data-lw-nav="trainer"], .lernwelt .lw-subnav:not([hidden]) [data-lw-nav="lernweg"]').count(), 2);
  const study = page.locator('.lernwelt .lw-study-actions article:not(.lw-trainer-kachel) > button');
  check('Vier Lernaktionen sind vorhanden', await study.count(), 4);
  check('Alle vier Lernaktionen haben denselben Buchstaben-Effekt',
    await study.evaluateAll(buttons => buttons.filter(button => button.getAttribute('data-rmo')?.split(' ').includes('letters')).length), 4);
  check('Alle vier Lernaktionen haben ein 44-px-Touchziel',
    await study.evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44)), true);
  await page.evaluate(() => Bibliothek.oeffne(null));
  const divider = page.locator('#studio-divider');
  const visibleWidth = (): Promise<number> => page.locator('#kante').evaluate(el => Math.round(el.getBoundingClientRect().width));
  check('Trenner ist am Rechner sichtbar', await divider.isVisible(), true);
  await divider.focus();
  await page.keyboard.press('Home');
  check('Home setzt den Zustand auf 148', await divider.getAttribute('aria-valuenow'), '148');
  check('Home macht die Navigation wirklich 148 px breit', await visibleWidth(), 148);
  await page.keyboard.press('End');
  check('End setzt den Zustand auf 260', await divider.getAttribute('aria-valuenow'), '260');
  check('End macht die Navigation wirklich 260 px breit', await visibleWidth(), 260);
  await page.keyboard.press('Home');
  const bounds = await divider.boundingBox();
  if (!bounds) throw new Error('Trenner ohne Rechteck');
  const x = bounds.x + bounds.width / 2, y = bounds.y + Math.min(80, bounds.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 46, y, { steps: 5 });
  await page.mouse.up();
  check('Pointer-Zug setzt die Zahl auf 194', await divider.getAttribute('aria-valuenow'), '194');
  check('Pointer-Zug vergrößert die wirkliche Navigation', await visibleWidth(), 194);
  await page.evaluate(() => Store.flush());
  await page.reload();
  await page.waitForFunction(() => typeof Store !== 'undefined' && !!document.body.dataset.studioNav);
  check('Die Breite überlebt Neuladen', await visibleWidth(), 194);
  await page.close();
} finally {
  await browser.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
if (failed) process.exitCode = 1;
