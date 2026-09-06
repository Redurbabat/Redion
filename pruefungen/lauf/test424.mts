/* Studio regressions. Fresh browser context, synthetic local content only.
   Run after bauen:ts. Screenshots are opt-in to avoid artifacts on normal CI. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'doku/studio-abnahme');
const screenshots = process.argv.includes('--screenshots');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(9624, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
page.setDefaultTimeout(10000);
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let passed = 0;
const check = (name: string, value: unknown): void => { assert.ok(value, name); passed++; console.log('  ✓ ' + name); };

/* Two real, original test PDF pages, no user file and no remote assets. */
const pdf = (): Buffer => {
  const objs: string[] = ['<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (let n = 1; n <= 2; n++) {
    const stream = `0.25 0.18 0.5 rg BT /F1 28 Tf 55 745 Td (REDION STUDIO) Tj ET\n0.15 0.15 0.18 rg BT /F1 17 Tf 55 690 Td (Elektrotechnik - Kapitel ${n}) Tj ET\nBT /F1 13 Tf 55 635 Td (Spannung, Strom und Widerstand) Tj ET\nBT /F1 13 Tf 55 600 Td (U = R x I) Tj ET\n0.8 0.8 0.85 RG 55 670 m 540 670 l S`;
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let content = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(content)); content += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(content);
  content += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  content += `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(content);
};

try {
  await page.goto('http://127.0.0.1:9624/index.html');
  await page.waitForFunction("typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && Store.cache.blocks");
  await page.waitForTimeout(900);
  await page.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(e=>e.remove());
    Bibliothek.oeffne(null);
  })()`);
  check('Studio navigation contains a real icon', await page.locator('#studio-nav svg').count() === 1);
  await page.locator('#studio-nav').click();
  check('Collapse acts on shell state', await page.locator('body').getAttribute('data-studio-nav') === 'kompakt');
  /* FLUSH VOR DEM NEULADEN (E440). `Store.setMeta` schreibt asynchron nach
     IndexedDB; ein `reload()` direkt nach dem Klick kann den Schreibvorgang
     abschneiden, und dann ist der Zustand nach dem Neuladen der alte — nicht,
     weil das Studio ihn nicht speichert (studio.ts:85 tut es), sondern weil
     die Prüfung schneller war als die Platte. Derselbe Wettlauf wie E436.
     Ohne diese Zeile war der Punkt auf dem unveränderten Studio-Zweig rot. */
  await page.evaluate('Store.flush()');
  await page.reload();
  /* NACH DEM NEULADEN AUF DEN START WARTEN, nicht auf das Element. `#studio-nav`
     steht im statischen HTML und ist sofort da — lange bevor `StudioSchale.start()`
     den gespeicherten Zustand gelesen und an den body gehängt hat. Wer hier
     nur auf das Element wartet, liest den Zustand VOR dem Start. */
  await page.waitForFunction("typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && Store.cache.blocks && document.body.dataset.studioNav");
  await page.locator('#studio-nav').waitFor();
  check('Collapsed state survives reload', await page.locator('body').getAttribute('data-studio-nav') === 'kompakt');
  await page.locator('#studio-nav').click();
  await page.locator('#studio-divider').focus();
  await page.keyboard.press('End');
  check('Keyboard resize reaches bounded maximum', await page.locator('#studio-divider').getAttribute('aria-valuenow') === '260');
  await page.keyboard.press('Home');
  check('Keyboard resize reaches bounded minimum', await page.locator('#studio-divider').getAttribute('aria-valuenow') === '148');
  await page.locator('#studio-theme').click();
  check('Theme button uses existing theme setting', await page.evaluate("Store.getMeta('theme') === document.documentElement.dataset.theme"));
  await page.locator('#studio-create').click();
  check('Quick Create opens existing create sheet', await page.locator('[role="dialog"],.overlay,.menu').count() > 0);
  await page.keyboard.press('Escape');
  await page.evaluate("document.querySelectorAll('.overlay,.menu').forEach(e=>e.remove()); Bibliothek.oeffne(null)");
  const choice = page.waitForEvent('filechooser');
  await page.locator('.bib-studio-import').click();
  await (await choice).setFiles({ name: 'Elektrotechnik Studio.pdf', mimeType: 'application/pdf', buffer: pdf() });
  await page.locator('.document-workspace').waitFor({ timeout: 60000 });
  const id = await page.locator('.document-workspace').getAttribute('data-page-id');
  check('Direct PDF import opens real document', !!id);
  check('Imported PDF has two canonical pages', await page.locator('.document-stage').count() === 2);
  await page.locator('[data-document-action="read"]').click();
  check('Read mode hides drawing controls', !await page.locator('.document-stage[data-aktiv] .blatt-reihe').isVisible());
  check('Read mode prevents accidental edits', await page.locator('.document-stage[data-aktiv] .blatt-papier').evaluate(e => (e as HTMLElement).inert));
  const countBefore = await page.evaluate('Object.keys(Store.cache.blocks).length');
  await page.locator('[data-document-action="annotate"]').click();
  check('Annotation restores original Ink controls', await page.locator('.document-stage[data-aktiv] .blatt-werk').isVisible());
  await page.evaluate("document.querySelector('.document-stage').dataset.probe = 'retained'");
  await page.locator('[data-document-action="thumbnails"]').click();
  check('Side panel does not rebuild the editor', await page.locator('.document-stage').first().getAttribute('data-probe') === 'retained');
  check('Thumbnails panel is visible', await page.locator('.document-thumbnails').isVisible());
  await page.locator('[data-document-action="next"]').click();
  check('Page navigation changes actual active page', await page.locator('.document-stage[data-aktiv]').getAttribute('data-stand-nr') === '1');
  check('Accessible current thumbnail follows page', await page.locator('[data-document-index="1"]').getAttribute('aria-current') === 'page');
  await page.locator('[data-document-action="fit"]').click();
  check('Fit restores real zoom control', await page.locator('[data-document-zoom]').inputValue() === '100');
  await page.keyboard.press('Escape');
  check('Escape closes panel and restores focus', await page.locator('[data-document-action="thumbnails"]').evaluate(e => e === document.activeElement));
  check('UI changes do not duplicate content', await page.evaluate('Object.keys(Store.cache.blocks).length') === countBefore);
  await page.locator('[data-document-action="regal"]').click();
  await page.locator('[data-studio-weg="pdf"]').click();
  check('All PDFs filter finds actual imported file', await page.locator('.bib-deckel[data-art="pdf"]').count() === 1);
  await page.locator('#bib-studio-suche').fill('no such document');
  check('Search filters the real library', await page.locator('.bib-deckel').count() === 0);
  await page.locator('#bib-studio-suche').fill('Elektro');
  check('Search retains focus after rerender', await page.locator('#bib-studio-suche').evaluate(e => e === document.activeElement));
  check('Matching search restores result', await page.locator('.bib-deckel').count() === 1);
  await page.locator('#bib-studio-suche').fill('');

  const sizes = [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,800],[1024,768],[820,1180],[768,1024],[430,932],[390,844]] as const;
  if (screenshots) fs.mkdirSync(out, { recursive: true });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(`Einstellungen.S('theme', '${theme}')`);
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(120);
      check(`Library fits ${width}x${height} ${theme}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (screenshots && [1920,1366,820,390].includes(width)) {
        await page.screenshot({path:path.join(out,`dokumente-${theme}-${width}.png`)});
      }
    }
  }
  await page.setViewportSize({width:1366,height:768});
  await page.evaluate(`App.oeffne(${JSON.stringify(id)})`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('Reduced-motion disables Studio transitions', await page.locator('body').evaluate(e => getComputedStyle(e).getPropertyValue('--motion-normal').trim() === '1ms'));
  await page.locator('[data-document-action="read"]').click();
  await page.reload();
  await page.locator('.document-workspace').waitFor();
  check('Reading preference is persisted per document', await page.locator('.document-workspace').getAttribute('data-document-tools') === 'closed');
  check('PDF page position survives reload', await page.locator('.document-stage[data-aktiv]').getAttribute('data-stand-nr') === '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (screenshots) {
    for (const theme of ['light', 'dark']) {
      await page.evaluate(`Einstellungen.S('theme', '${theme}')`);
      for (const [width,height] of [[1366,768],[820,1180],[390,844]]) {
        await page.setViewportSize({width:width!,height:height!});
        await page.evaluate(`App.oeffne(${JSON.stringify(id)})`);
        await page.locator('.document-workspace').waitFor();
        await page.waitForTimeout(350);
        await page.screenshot({path:path.join(out,`pdf-${theme}-${width}.png`)});
        await page.evaluate("Lernwelt.oeffnen('heute')");
        await page.locator('.lw-desk').waitFor();
        await page.screenshot({path:path.join(out,`heute-${theme}-${width}.png`)});
        await page.evaluate("Lernwelt.wechseln('lernen')");
        await page.screenshot({path:path.join(out,`lernen-${theme}-${width}.png`)});
        await page.evaluate("Einstellungen.oeffne('allgemein')");
        await page.locator('.einst-fenster').waitFor();
        await page.screenshot({path:path.join(out,`einstellungen-${theme}-${width}.png`)});
        await page.keyboard.press('Escape');
      }
    }
  }
  check('No browser exceptions in Studio workflow', errors.length === 0);
  console.log(`\n${passed}/${passed} bestanden`);
} catch (error) {
  console.error('  ✗ Studio regression:', error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
