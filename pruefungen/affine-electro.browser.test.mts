/* Tatsächliche Kontextwechsel im Zeichner, Simulator und Zusatzfächern.
 * Nur synthetische Pläne. REDION_DOCK_ROOT erlaubt eine Gegenprobe. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
const repo = path.resolve(import.meta.dirname, '..'), root = process.env.REDION_DOCK_ROOT || repo;
const pictures = path.join(repo, 'bilder', 'affine-elektro'); fs.mkdirSync(pictures, { recursive: true });
const browser = await chromium.launch(); let checked = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); checked++; console.log('✓ ' + name); };
async function card(page: Page, id: string) {
  const dock = page.locator('.sp-wrap .sp-werkzeuge');
  const button = dock.locator(`[data-a="${id}"]`);
  const back = dock.locator('[data-richtung="links"]');
  for (let i = 0; i < 12 && await back.getAttribute('aria-disabled') !== 'true'; i++) await back.click();
  for (let i = 0; i < 12 && !await button.isVisible(); i++) await dock.locator('[data-richtung="rechts"]').click();
  await button.click();
}
try {
  for (const width of [1366, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 950 : 844 }, hasTouch: width < 600, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const ids = await page.evaluate(async (width: number) => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove()); App.theme(width < 600 ? 'dark' : 'light');
      const p = Store.addPage(null, { text: 'Elektroatelier' });
      const plan = Schaltplan.lesen({ plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 700, teile: [], leitungen: [], texte: [], ebenen: [{ id:'plan',name:'Plan',sichtbar:true,farbe:'#529cca' }] } });
      Schaltplan.beispielBauen(plan, 'ausschaltung'); const block = Store.addBlock(p.id, 'schaltplan', { plan });
      await Store.flush(); App.zeichneBaum(); App.oeffne(p.id); return { page: p.id, block: block.id };
    }, width);
    await page.locator('.sp-werkzeuge').waitFor();
    await page.locator('.sp-wrap [data-a="vollbild"]').click();
    const shot = async (name: string) => { await page.locator('.sp-werkzeuge').scrollIntoViewIfNeeded(); if (process.argv.includes('--capture')) await page.screenshot({ path: path.join(pictures, `${name}-${width}.png`) }); };
    check(`${width}: genau ein Zeichen-Dock`, await page.locator('.sp-wrap .gfx-tb-edgeless').count() === 1);
    await card(page, 'dock-bauteile'); check(`${width}: Fachzeichen öffnet vorhandene Bauteilpalette`, await page.locator('.sp-wrap').evaluate(e => e.classList.contains('sp-palette-offen'))); await shot('fachzeichnen');
    await page.locator('.sp-werkzeuge [data-a="palette-toggle"]').click();
    const before = await page.evaluate(id => JSON.stringify(Store.getBlock(id).plan), ids.block);
    await card(page, 'simulation'); await page.locator('[data-dock-context="simulation"]').waitFor();
    check(`${width}: Simulator tauscht das Dock`, await page.locator('.sp-wrap .gfx-tb-edgeless').count() === 1 && await page.locator('.sp-werkzeuge [data-wz="leitung"]').count() === 0);
    await page.locator('.sp-werkzeuge [data-a="zoom-alles"]').click();
    const target = await page.evaluate(id => {
      const key = Store.getBlock(id).plan.teile.find((t: any) => t.zeichen === 'ch-schema0').id;
      const g = document.querySelector(`.sp-teil[data-id="${key}"]`)!;
      for (const node of g.querySelectorAll('line,path,rect,circle')) { const r = node.getBoundingClientRect();
        for (const f of [.25,.5,.75]) { const x = r.x + r.width * f, y = r.y + r.height * f;
          if (document.elementFromPoint(x,y)?.closest('.sp-teil') === g) return [x,y]; }
      } return null;
    }, ids.block);
    check(`${width}: Schalter bleibt auf der Zeichenfläche erreichbar`, !!target);
    await page.mouse.click(target![0]!, target![1]!);
    check(`${width}: echtes Schalten lässt Strom zur Lampe fliessen`, await page.locator('.sp-fluss').count() > 0);
    await shot('simulation');
    check(`${width}: Simulator zeigt sein tatsächliches Registersymbol`, await page.locator('.sp-werkzeuge [data-a="simulation"] svg').evaluate(e => getComputedStyle(e).display !== 'none'));
    await card(page, 'sim-pause'); check(`${width}: Pause verwendet die echte Laboruhr`, await page.locator('.sp-wrap').evaluate(e => e.classList.contains('sp-labor-pause')));
    await card(page, 'sim-pause'); check(`${width}: Weiter setzt die Uhr fort`, !await page.locator('.sp-wrap').evaluate(e => e.classList.contains('sp-labor-pause')));
    await card(page, 'sim-tempo'); await page.locator('.sp-werkzeuge .gfx-tb-menue').getByText('2×', { exact: true }).click();
    check(`${width}: Tempo ändert den vorhandenen Regler`, await page.locator('[data-labor-tempo]').inputValue() === '2');
    await card(page, 'sim-reset'); await shot('labor');
    await card(page, 'sim-messen'); check(`${width}: Messwerte sind erreichbar`, await page.locator('.sp-live-labor').isVisible());
    await page.locator('.sp-werkzeuge [data-a="simulation"]').click(); await page.locator('[data-dock-context="zeichnen"]').waitFor();
    check(`${width}: Simulation verändert keinen Planinhalt`, before === await page.evaluate(id => JSON.stringify(Store.getBlock(id).plan), ids.block));
    await page.locator('.sp-wrap [data-a="bereiche"]').click(); await page.locator('.menu').getByText(/Relais/).first().click();
    await page.locator('.sp-relais-fach select[data-rel="wahl"]').waitFor(); await page.locator('[data-dock-context="relais"]').waitFor();
    check(`${width}: Relais hat genau ein passendes Dock`, await page.locator('.sp-wrap .gfx-tb-edgeless').count() === 1);
    await shot('relais'); await page.locator('.sp-werkzeuge [data-a="context-zeichnen"]').click();
    await page.locator('[data-dock-context="zeichnen"]').waitFor();
    await page.locator('.sp-wrap [data-a="bereiche"]').click(); await page.locator('.menu').getByText(/Batterie/).first().click();
    await page.locator('[data-dock-context="batterie"]').waitFor(); await shot('batterie');
    check(`${width}: Batteriefach hat passende Aktionen`, await page.locator('.sp-werkzeuge [data-a="battery-einsetzen"]').count() === 1);
    check(`${width}: Beide Batterie-Rechner sind aus dem Laufzeitpaket geladen`, await page.evaluate(() => typeof (window as any).BatterieKern?.pruefen === 'function' && typeof (window as any).BatterieAufgaben?.erstelle === 'function'));
    check(`${width}: Dock bleibt im Fenster`, await page.locator('.sp-werkzeuge').evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    check(`${width}: keine Browserfehler`, !errors.length); await context.close();
  }
  console.log(`${checked} Zusagen erfüllt`);
} finally { await browser.close(); }
