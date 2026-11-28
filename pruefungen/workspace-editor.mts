/* Workspace 2.0: echte sichtbare Seite mit synthetischem Inhalt.
 * Vergleicht Desktop und iPhone, Hell/Dunkel, Tastatur und reale Kommandos.
 * --capture: Browserbilder. --baseline: exakt gleiche Testdaten vor dem PR.
 */
import { chromium, webkit, type Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

declare const Store: any;
declare const App: any;

const repo = path.resolve(import.meta.dirname, '..');
const root = path.resolve(process.env.REDION_WORKSPACE_ROOT || repo);
const useWebkit = process.argv.includes('--webkit');
const capture = process.argv.includes('--capture');
const baseline = process.argv.includes('--baseline');
if (baseline && !capture) throw new Error('Vorher-Bilder nur mit --capture');
const engine = useWebkit ? 'webkit' : 'chromium';
const browser = await (useWebkit ? webkit : chromium).launch();
const screens = [
  { w: 390, h: 844, dark: false },
  { w: 430, h: 932, dark: true },
  { w: 1440, h: 900, dark: false },
  { w: 1366, h: 768, dark: true }
];
let passed = 0;
const check = (name: string, condition: unknown) => {
  assert.ok(condition, name);
  passed++; console.log('✓ ' + name);
};

async function seed(page: Page, dark: boolean): Promise<string> {
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'");
  const id = await page.evaluate(async (isDark: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    App.theme(isDark ? 'dark' : 'light');
    const page = Store.addPage(null, { text: 'Elektrotechnik – Lernnotizen' });
    Store.addBlock(page.id, 'heading', { text: 'Stromkreise verstehen' });
    Store.addBlock(page.id, 'text', {
      text: 'Ein Widerstand begrenzt den Stromfluss. Sicherungen schützen Leitungen.'
    });
    await Store.flush();
    return page.id as string;
  }, dark);
  await page.evaluate((id: string) => App.oeffne(id), id);
  await page.waitForSelector('#page > .pg-tools button[data-a="cover"]');
  await page.waitForTimeout(260);
  return id;
}

let active: Page | null = null;
try {
  for (const { w, h, dark } of screens) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      isMobile: w < 761, hasTouch: w < 761,
      colorScheme: dark ? 'dark' : 'light'
    });
    const page = await context.newPage();
    active = page;
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const id = await seed(page, dark);
    const label = engine + '/' + w + '/' + (dark ? 'dunkel' : 'hell');
    const folder = path.join(repo, 'bilder', 'workspace-2', 'editor', engine);
    if (capture) {
      fs.mkdirSync(folder, { recursive: true });
      await page.screenshot({ path: path.join(folder,
        w + '-' + (dark ? 'dunkel' : 'hell') + '-' + (baseline ? 'vorher' : 'nachher') + '.png') });
    }
    if (baseline) {
      await context.close();
      active = null;
      continue;
    }

    // Chromium reported 43.999969482421875 for an actual CSS 44px target.
    // Allow only 0.0001 CSS px of floating-point error, not a whole pixel.
    const state = await page.locator('#page > .pg-tools').evaluate(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const caption = el.querySelector('.pg-tools-caption');
      return {
        role: el.getAttribute('role'), label: el.getAttribute('aria-label'),
        visible: +style.opacity >= .99 && style.visibility === 'visible' && style.display !== 'none' && rect.height >= 44 - 0.0001,
        opacity: style.opacity, height: rect.height, minHeight: style.minHeight,
        display: style.display, visibility: style.visibility, transition: style.transition,
        buttonHeights: Array.from(el.querySelectorAll('button[data-a]'), b => b.getBoundingClientRect().height),
        pageHeight: el.parentElement?.getBoundingClientRect().height,
        pageTransform: el.parentElement ? getComputedStyle(el.parentElement).transform : null,
        column: style.flexWrap,
        caption: caption?.textContent,
        captionVisible: !!caption && getComputedStyle(caption).display !== 'none',
        labelCount: el.querySelectorAll('button[data-a]').length
      };
    });
    check(label + ': dauerhaft sichtbare, echte Werkzeugleiste; ' + JSON.stringify(state), state.visible);
    check(label + ': vorhandene Befehle + Gruppenname', state.labelCount >= 5 &&
      state.role === 'group' && state.label === 'Seitenwerkzeuge');
    check(label + ': visuelle Rubrik auf Desktop / Platzgewinn auf Handy',
      state.caption === 'Seitenwerkzeuge' && state.captionVisible === (w > 760));
    check(label + ': responsive Darstellung',
      state.column === (w < 761 ? 'nowrap' : 'wrap'));

    const minHeight = await page.locator('#page > .pg-tools button[data-a]').first()
      .evaluate(el => el.getBoundingClientRect().height);
    check(label + ': Touch-/Klickziel mindestens 44 px', minHeight >= 44 - 0.0001);
    check(label + ': alle Seitenwerkzeuge mindestens 44 px', state.buttonHeights.every(height => height >= 44 - 0.0001));

    await page.mouse.move(0, 0);
    const opacity = await page.locator('#page > .pg-tools').evaluate(el => +getComputedStyle(el).opacity);
    check(label + ': auch ohne Hover sichtbar', opacity >= .99);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    check(label + ': kein horizontaler Seitenüberlauf', !overflow);
    const heading = await page.locator('#title').textContent();
    check(label + ': echte Editor-Seite und Inhalt erhalten',
      heading === 'Elektrotechnik – Lernnotizen');

    // Eine wirkliche vorhandene Aktion: der Breitenwechsel wird nicht
    // in einer neuen Daten-/Toolbar-Logik gespiegelt.
    const toggle = page.locator('#page > .pg-tools button[data-a="wide"]');
    const before = (await toggle.textContent())?.trim() || '';
    await toggle.click();
    await page.waitForFunction((previous: string) =>
      (document.querySelector('#page > .pg-tools button[data-a="wide"]')?.textContent || '').trim() !== previous,
      before);
    const after = (await page.locator('#page > .pg-tools button[data-a="wide"]').textContent())?.trim() || '';
    check(label + ': vorhandener Seitenbreitenbefehl arbeitet weiterhin', before !== after);
    await page.locator('#page > .pg-tools button[data-a="wide"]').click();

    const data = await page.evaluate((pageId: string) => {
      const b = Store.getBlock(pageId);
      const children = Store.childrenOf(pageId);
      return {
        title: b.text,
        heading: children.some((block: any) =>
          block.type === 'heading' && block.text === 'Stromkreise verstehen'),
        text: children.some((block: any) =>
          block.type === 'text' && String(block.text || '').includes('Sicherungen schützen'))
      };
    }, id);
    check(label + ': Notiztexte und Blöcke bleiben bestehen',
      data.title === 'Elektrotechnik – Lernnotizen' && data.heading && data.text);
    check(label + ': keine Browserfehler', errors.length === 0);
    await context.close(); active = null;
  }
  console.log(passed + ' Prüfungen erfolgreich.');
} finally {
  if (active && !active.isClosed()) await active.close().catch(() => {});
  await browser.close();
}
