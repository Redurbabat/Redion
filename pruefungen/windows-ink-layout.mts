import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
declare const Store: any, App: any, Schaltplan: any, GlassWheel: any, Aussehen: any;
const root = path.resolve(import.meta.dirname, '..');
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const output = path.join(root, 'bilder/windows-ink/layout', engine); fs.mkdirSync(output, { recursive: true });
const browser = await (engine === 'webkit' ? webkit : chromium).launch();
const deadline = setTimeout(() => { console.error('Layoutprüfung nach 120 Sekunden abgebrochen.'); process.exit(1); }, 120_000);
deadline.unref();
// WebKit behandelt CSSOM-Zugriffe zwischen lokalen Dateien als fremde Herkunft.
// Nur öffentliche App-Dateien über einen lokalen, kurzlebigen Prüfserver lesen.
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, name), relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) ||
      !/^(?:index\.html|sw\.js|version\.(?:json|md)|(?:quell|oeffentlich|fremd|lernpakete|lernen)[\\/])/.test(name) ||
      !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  const type = path.extname(file) === '.css' ? 'text/css' : path.extname(file) === '.js' ? 'text/javascript' : path.extname(file) === '.html' ? 'text/html' : 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(response);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address(); if (!address || typeof address === 'string') throw new Error('Kein Prüfport');
let checked = 0;
try {
  for (const [width, height] of [[1366, 768], [1440, 900], [390, 844], [430, 932]] as const) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const id = await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
      Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
      const note = Store.addPage(null, { text: 'Windows · Freihand-Studio' });
      const plan = Schaltplan.neuerPlan(); Schaltplan.beispielBauen(plan, 'wechselschaltung', 'plan');
      plan.ink = [{ id: 'layout-ink', art: 'stift', pts: [[180, 140], [210, 120], [240, 140], [270, 120]],
        farbe: '#529cca', breite: 2.4, ebene: 'plan' }];
      Store.addBlock(note.id, 'schaltplan', { plan }); await Store.flush(); return note.id;
    });
    await page.evaluate(id => { App.zeichneBaum(); App.oeffne(id); }, id);
    await page.waitForSelector('.sp-flaeche');
    await page.waitForTimeout(900);
    await page.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove()));
    await page.locator('.sp-wrap').focus(); await page.keyboard.press('f');
    for (const shell of ['classic', 'glass-wheel'] as const) for (const schema of ['standard', 'hell'] as const) {
      await page.evaluate(({ shell, schema }) => { GlassWheel.setMode(shell); Aussehen.setzen({ schema }); }, { shell, schema });
      await page.locator('[data-wz="stift"]').click();
      await page.waitForTimeout(350);
      const metrics = await page.locator('.sp-wrap').evaluate(el => {
        const ink = el.querySelector<HTMLElement>('.sp-ink-tools')!;
        const dock = el.querySelector<HTMLElement>('.sp-werkzeuge')!;
        const stage = el.querySelector<HTMLElement>('.sp-buehne')!;
        return { minHeight: Math.min(...[...ink.querySelectorAll<HTMLElement>('input,button')].map(e => e.getBoundingClientRect().height)),
          controlsVisible: getComputedStyle(ink).display !== 'none', paperBlur: getComputedStyle(stage).backdropFilter,
          overflow: el.scrollWidth - el.clientWidth, dockScrollable: dock.scrollWidth > dock.clientWidth,
          scrollStyle: getComputedStyle(dock).overflowX };
      });
      assert.ok(metrics.controlsVisible);
      assert.ok(metrics.minHeight >= 43.5, JSON.stringify({ width, height, shell, schema, metrics }));
      assert.equal(metrics.paperBlur || 'none', 'none');
      assert.ok(metrics.overflow <= 1, JSON.stringify({ width, shell, metrics }));
      if (metrics.dockScrollable) assert.match(metrics.scrollStyle, /auto|scroll/);
      await page.screenshot({ path: path.join(output, `${width}-${shell}-${schema}.png`) }); checked++;
    }
    await page.emulateMedia({ reducedMotion: 'reduce', ...(engine === 'chromium' ? { forcedColors: 'active' as const } : {}) });
    await page.evaluate(() => document.body.dataset.kontrast = 'hoch');
    await page.waitForTimeout(250);
    const contrastState = await page.locator('.sp-ink-tools').evaluate(el => ({
      blur: getComputedStyle(el).backdropFilter || 'none', webkitBlur: getComputedStyle(el).getPropertyValue('-webkit-backdrop-filter'),
      body: document.body.getAttribute('data-kontrast'), shell: document.body.getAttribute('data-ui-shell'),
      inline: (el as HTMLElement).style.cssText, transition: getComputedStyle(el).transition,
      animations: el.getAnimations().map(a => ({ state: a.playState, frames: (a.effect as KeyframeEffect | null)?.getKeyframes() })) }));
    if (contrastState.blur !== 'none') console.log(await page.locator('.sp-ink-tools').evaluate(el => {
      const rules: string[] = [];
      const visit = (list: CSSRuleList): void => { for (const rule of list) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes('sp-ink-tools')) rules.push(`${el.matches(rule.selectorText)} ${rule.cssText}`);
        else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
      } };
      for (const sheet of document.styleSheets) { try { visit(sheet.cssRules); } catch { /* nur lesbare lokale Blätter */ } }
      return rules;
    }));
    assert.equal(contrastState.blur, 'none', JSON.stringify(contrastState));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`✓ ${engine}: ${checked} Darstellungen, Hell/Dunkel, Klassisch/Glas, 44-Pixel-Werkzeuge, deckendes Papier, Kontrast und reduzierte Bewegung.`);
} finally { clearTimeout(deadline); await browser.close(); server.close(); }
