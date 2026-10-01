/* Die Studiosuche bleibt links bei der Navigation und bewegt nur ihr Zeichen.
 * Die drei Zustände werden am wirklichen Knopf gemessen, nicht am CSS-Text. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const file = resolve(root, '.' + (url === '/' ? '/index.html' : url));
  if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let passed = 0;
let failed = 0;
const check = (name: string, good: unknown, detail = '') => {
  if (good) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
};

try {
  for (const reduce of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: reduce ? 1024 : 1280, height: 900 },
      reducedMotion: reduce ? 'reduce' : 'no-preference', serviceWorkers: 'block'
    });
    try {
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/index.html`);
      await page.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && Store.cache.blocks");
      await page.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove()));
      const pos = await page.evaluate(() => {
        const nav = document.querySelector('#studio-nav')!.getBoundingClientRect();
        const search = document.querySelector('#studio-search')!.getBoundingClientRect();
        const theme = document.querySelector('#studio-theme')!.getBoundingClientRect();
        return { gap: search.left - nav.right, beforeTheme: search.right < theme.left,
          hitHeight: search.height, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      check(`${reduce ? 'ruhig' : 'normal'}: Suche steht links bei der Navigation`, pos.gap >= 0 && pos.gap <= 36, `Abstand ${pos.gap}px`);
      check(`${reduce ? 'ruhig' : 'normal'}: keine Überlagerung/Überbreite`, pos.beforeTheme && !pos.overflow);
      check(`${reduce ? 'ruhig' : 'normal'}: Suchgriff mindestens 44 px`, pos.hitHeight >= 44);

      await page.locator('#studio-search').hover();
      const hover = await page.evaluate(() => {
        const button = document.querySelector('#studio-search')!;
        const icon = button.querySelector('svg')!;
        const b = getComputedStyle(button), i = getComputedStyle(icon);
        return { animation: i.animationName, duration: parseFloat(i.animationDuration) || 0,
          blur: b.backdropFilter || b.getPropertyValue('-webkit-backdrop-filter') };
      });
      check(`${reduce ? 'ruhig' : 'normal'}: Glas bleibt dezent am Suchgriff`, /blur\(/.test(hover.blur), hover.blur);
      check(`${reduce ? 'ruhig' : 'normal'}: Suchsymbol ${reduce ? 'steht still' : 'dreht einmal'}`,
        reduce ? hover.animation === 'none' || hover.duration === 0
          : hover.animation !== 'none' && hover.duration > 0,
        `${hover.animation}/${hover.duration}`);

      await page.mouse.move(2, 2);
      await page.locator('#studio-nav').focus();
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => ({
        target: (document.activeElement as HTMLElement)?.id,
        visible: document.activeElement?.matches(':focus-visible'),
        animation: getComputedStyle(document.querySelector('#studio-search svg')!).animationName
      }));
      check(`${reduce ? 'ruhig' : 'normal'}: Tastatur erreicht die Suche sichtbar`,
        focus.target === 'studio-search' && focus.visible);
      check(`${reduce ? 'ruhig' : 'normal'}: Tastaturbewegung beachtet Einstellung`,
        reduce ? focus.animation === 'none' : focus.animation !== 'none', focus.animation);
      if (!reduce) {
        await page.setViewportSize({ width: 820, height: 900 });
        const compact = await page.evaluate(() => {
          const bar = document.querySelector('#studio-bar')!;
          const search = document.querySelector('#studio-search')!.getBoundingClientRect();
          const theme = document.querySelector('#studio-theme')!.getBoundingClientRect();
          return { width: bar.clientWidth, scroll: bar.scrollWidth,
            gap: theme.left - search.right, searchWidth: search.width };
        });
        check('820 px: Suche und Kopfaktionen bleiben ohne Überlauf erreichbar',
          compact.scroll <= compact.width + 1 && compact.gap >= 0 && compact.searchWidth >= 100,
          JSON.stringify(compact));
      }
      if (!reduce) {
        await page.evaluate(() => { document.body.dataset.bewegung = 'ruhig'; });
        const quiet = await page.evaluate(() =>
          getComputedStyle(document.querySelector('#studio-search svg')!).animationName);
        check('App-Einstellung „Ruhig“ hält das Suchsymbol ebenfalls an', quiet === 'none', quiet);
      }
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await new Promise<void>(done => server.close(() => done()));
}
console.log(`\n${passed} bestanden, ${failed} durchgefallen`);
if (failed) process.exitCode = 1;
