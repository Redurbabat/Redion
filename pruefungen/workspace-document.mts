/* Workspace 2.0: echter Browser-Prüflauf für den Dokumentkompass.
 * Testdaten sind künstlich, nie Nutzerdateien. Web und iOS laden denselben
 * Dokument-Code. Optional `--capture`: Bilder ausschliesslich unter
 * bilder/workspace-2/document/ (nicht in Git).
 *
 * node pruefungen/workspace-document.mts
 * node pruefungen/workspace-document.mts --webkit --capture
 * REDION_WORKSPACE_ROOT=<base-checkout> node pruefungen/workspace-document.mts --baseline --capture
 */
import { chromium, webkit, type Page } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any;
declare const App: any;

const repo = path.resolve(import.meta.dirname, '..');
const root = path.resolve(process.env.REDION_WORKSPACE_ROOT || repo);
const webkitMode = process.argv.includes('--webkit');
const capture = process.argv.includes('--capture');
const baseline = process.argv.includes('--baseline');
if (baseline && !capture) throw new Error('Vorher-Lauf benötigt --capture.');
const engine = webkitMode ? 'webkit' : 'chromium';
const screens = [
  { width: 390, height: 844, dark: false },
  { width: 430, height: 932, dark: true },
  { width: 1440, height: 900, dark: false }
];
const browser = await (webkitMode ? webkit : chromium).launch();
const results: string[] = [];
let count = 0;

function pass(label: string, condition: boolean, message?: string): void {
  assert.ok(condition, message || label);
  count++;
  results.push(label);
  console.log('✓ ' + label);
}

async function openDocument(page: Page, dark: boolean): Promise<{ id: string; original: string }> {
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof DocumentMode !== 'undefined'");
  const id = await page.evaluate(async (dark: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map((item: any) => item.nr)));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove());
    App.theme(dark ? 'dark' : 'light');
    const doc = Store.addPage(null, { text: 'Elektrotechnik – Prüfungsunterlagen 2026.pdf' });
    for (let i = 1; i <= 6; i++) {
      Store.addBlock(doc.id, 'pdfseite', {
        nr: i, vonSeiten: 6, bw: 595, bh: 842, raumVersion: 1,
        suchtext: 'Nur synthetische Workspace-Testseite ' + i
      });
    }
    Store.updateBlock(doc.id, { dokumentModus: true });
    await Store.flush();
    return doc.id as string;
  }, dark);
  // App.oeffne getrennt von Store.flush – schützt vor Context-Verlust.
  await page.evaluate((pageId: string) => { App.oeffne(pageId); }, id);
  await page.waitForSelector('.document-workspace .document-title');
  await page.waitForTimeout(250);
  const original = await page.evaluate((pageId: string) => {
    const p = Store.getBlock(pageId);
    return JSON.stringify(DocumentMode.documentsIn(p).map((item: any) => ({ id: item.id, nr: item.nr })));
  }, id);
  return { id, original };
}

async function progress(page: Page) {
  return page.locator('.document-title-progress').evaluate((el: HTMLProgressElement) => ({
    value: el.value, max: el.max, hidden: el.hidden,
    label: el.getAttribute('aria-valuetext')
  }));
}

let current: Page | null = null;
try {
  for (const { width, height, dark } of screens) {
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: width <= 760,
      isMobile: width <= 760, colorScheme: dark ? 'dark' : 'light'
    });
    const page = await context.newPage();
    current = page;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const { id, original } = await openDocument(page, dark);
    const label = width + 'px ' + (dark ? 'dunkel' : 'hell');
    const folder = path.join(repo, 'bilder', 'workspace-2', 'document', engine);
    if (capture) fs.mkdirSync(folder, { recursive: true });
    if (baseline) {
      // Dieselben synthetischen Daten, der echte Webstand vor dem PR.
      await page.screenshot({ path: path.join(folder, width + '-' +
        (dark ? 'dunkel' : 'hell') + '-vorher.png') });
      await page.locator('.document-topbar [data-document-action="inspector"]').click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(folder, width + '-' +
        (dark ? 'dunkel' : 'hell') + '-inspector-vorher.png') });
      await context.close();
      current = null;
      continue;
    }

    pass(label + ': echter Titel sichtbar',
      (await page.locator('.document-title-name').textContent()) === 'Elektrotechnik – Prüfungsunterlagen 2026.pdf');
    pass(label + ': Typ und Umfang statt doppelter Positionsanzeige',
      (await page.locator('.document-title-meta').textContent()) === 'PDF · 6 Seiten');

    let state = await progress(page);
    pass(label + ': Startfortschritt ist 1 von 6',
      state.value === 1 && state.max === 6 && !state.hidden);

    const title = await page.locator('.document-title').boundingBox();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 1);
    pass(label + ': Titel und komplette Seite passen ins Display',
      !!title && title.width >= (width < 760 ? 60 : 120) && !overflow,
      'Titelbreite: ' + String(title?.width) + ', Seitenüberlauf: ' + overflow);

    if (capture) {
      await page.screenshot({ path: path.join(folder, width + '-' +
        (dark ? 'dunkel' : 'hell') + '-nachher.png') });
    }

    const dock = page.locator('.document-pdf-dock');
    const blitz = dock.getByRole('button', { name: 'Elektro', exact: true });
    const dockKasten = await dock.boundingBox();
    pass(label + ': die PDF-Kopfzeile bleibt die Redion-Dokumentansicht',
      await page.locator('.document-topbar [data-document-action="exit"]').count() === 1 &&
      await page.locator('.document-topbar [data-document-action="print"]').count() === 1);
    const zeiger = dock.getByRole('button', { name: 'Auswahl und Hand', exact: true });
    await zeiger.click();
    const ersterModus = await page.locator('.document-studio').getAttribute('data-ink-tool');
    await zeiger.click();
    const zweiterModus = await page.locator('.document-studio').getAttribute('data-ink-tool');
    pass(label + ': der Zeiger wechselt direkt zwischen Auswahl und Hand',
      [ersterModus, zweiterModus].sort().join(',') === 'schreiben,select');
    const formMenue = dock.getByRole('button', {
      name: width > 550 ? 'Linien und Pfeile' : 'Weitere Schnellwerkzeuge', exact: true
    });
    await formMenue.click();
    await dock.locator('.gfx-tb-menue').getByRole('button', { name: 'Pfeil', exact: true }).click();
    pass(label + ': der Schnellbefehl aktiviert die echte PDF-Pfeilform',
      await page.locator('.document-stage[data-aktiv] .blatt-marken[data-tool="arrow"]').count() === 1 &&
      await page.locator('.document-stage[data-aktiv] [data-act="formart"][data-form="arrow"]').getAttribute('aria-pressed') === 'true');
    await page.keyboard.press('Escape');
    pass(label + ': PDF nutzt eine Werkzeuggalerie am unteren Rand',
      !!dockKasten && dockKasten.y > height * .72 &&
      await page.locator('.document-drawingbar:visible').count() === 1);
    const weiter = dock.getByRole('button', { name: 'Weitere Werkzeuge', exact: true });
    const vorBlitz = await blitz.boundingBox();
    const reihenfolge = ['notiz', 'stifte', 'formen', 'diagramme', 'vorlagen'];
    const sichtbareKarten = () => dock.locator('[data-karte]:visible').evaluateAll(karten =>
      karten.map(karte => (karte as HTMLElement).dataset.karte).join(','));
    const ersteKarten = await sichtbareKarten();
    const kartenProSeite = ersteKarten.split(',').length;
    const letzterStart = reihenfolge.length - kartenProSeite;
    pass(label + ': Die erste Gruppe beginnt mit der ersten Werkzeugkarte',
      letzterStart > 0 && ersteKarten === reihenfolge.slice(0, kartenProSeite).join(','), ersteKarten);
    let start = 0;
    while (start < letzterStart) {
      await weiter.click();
      start = Math.min(start + kartenProSeite, letzterStart);
      const gruppe = await sichtbareKarten();
      pass(label + ': Edgeless blättert in ganzen Karten und klemmt die letzte Gruppe',
        gruppe === reihenfolge.slice(start, start + kartenProSeite).join(','), gruppe);
    }
    pass(label + ': Die letzte Gruppe hält an der letzten Werkzeugkarte',
      await weiter.getAttribute('aria-disabled') === 'true');
    const zurueck = dock.getByRole('button', { name: 'Vorherige Werkzeuge', exact: true });
    while (start > 0) {
      await zurueck.click();
      start = Math.max(0, start - kartenProSeite);
      const gruppe = await sichtbareKarten();
      pass(label + ': Rückwärts bleiben die Werkzeugkarten in Reihenfolge',
        gruppe === reihenfolge.slice(start, start + kartenProSeite).join(','), gruppe);
    }
    pass(label + ': die Rückrichtung zeigt wieder die Startgruppe', await sichtbareKarten() === ersteKarten);
    const nachBlitz = await blitz.boundingBox();
    pass(label + ': Werkzeugkarten blättern, Blitz bleibt am gleichen Ort',
      !!vorBlitz && !!nachBlitz && vorBlitz.x === nachBlitz.x && nachBlitz.width >= 44);
    await blitz.click();
    const menue = dock.locator('.gfx-tb-menue');
    const fachzeichen = menue.getByRole('button', { name: 'Fachzeichen', exact: true });
    pass(label + ': Fachzeichen und Schaltplan gemeinsam unter Elektro',
      await fachzeichen.isVisible() &&
      await menue.getByRole('button', { name: 'Schaltplan und Simulation', exact: true }).isVisible());
    if (capture) await page.screenshot({ path: path.join(folder, width + '-elektro.png') });
    await fachzeichen.click();
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.document-studio')?.dataset.inkTool === 'zeichen');
    pass(label + ': Fachzeichen bleibt das echte Dokumentwerkzeug',
      await page.locator('.document-stage[data-aktiv] .blatt-marken[data-tool="zeichen"]').count() === 1);
    const pdfWerkzeuge = dock.getByRole('button', { name: 'PDF-Werkzeuge', exact: true });
    const optionen = dock.locator('[data-document-action="ink-options"]');
    await pdfWerkzeuge.click();
    await optionen.click();
    pass(label + ': PDF-Werkzeuge öffnen die vorhandenen Zeichenoptionen',
      await page.locator('.document-studio').getAttribute('data-ink-options') === 'open');
    pass(label + ': geöffnete Optionen enthalten keine zweite Werkzeugreihe',
      await page.locator('.document-stage .blatt-werk > [data-wz]:visible').count() === 0);
    await page.keyboard.press('Escape');

    await page.locator('[data-document-action="view"]').first().click();
    const jump = page.locator('.document-position');
    await jump.waitFor({ state: 'visible' });
    // Während des Öffnens verändert die Bewegung nur den sichtbaren Massstab.
    await page.waitForFunction(() =>
      (document.querySelector('.document-position')?.getBoundingClientRect().height ?? 0) >= 44,
      null, { timeout: 2500 });
    const sprungknopf = await jump.evaluate((el: HTMLButtonElement) => ({
      art: el.tagName, hoehe: el.getBoundingClientRect().height, name: el.getAttribute('aria-label')
    }));
    pass(label + ': direkter Sprung ist ein echter, zugänglicher Knopf',
      sprungknopf.art === 'BUTTON' && sprungknopf.hoehe >= 44 &&
      sprungknopf.name?.includes('springen') === true, JSON.stringify(sprungknopf));

    await jump.click();
    await page.locator('#fq').fill('4');
    await page.locator('[data-a="ok"]').click();
    await page.locator('#fq').waitFor({ state: 'detached' });
    await page.waitForFunction(() =>
      (document.querySelector('.document-position')?.textContent || '').includes('4/6'));
    state = await progress(page);
    pass(label + ': direkter Sprung aktualisiert den echten Lesefortschritt',
      state.value === 4 && state.label === 'Seite 4 von 6');
    pass(label + ': kein zweites Seitennavigationsmodell',
      await page.locator('.document-stage').count() === 6);

    await jump.click();
    await page.locator('#fq').fill('999');
    await page.locator('[data-a="ok"]').click();
    await page.locator('#fq').waitFor({ state: 'detached' });
    state = await progress(page);
    pass(label + ': ungültige Seitenzahl ändert den Lesestand nicht',
      state.value === 4 && (await jump.textContent()) === 'Seite 4/6');

    await jump.click();
    await page.locator('#fq').fill('3');
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await page.locator('#fq').waitFor({ state: 'detached' });
    state = await progress(page);
    pass(label + ': Abbrechen verwirft die Eingabe',
      state.value === 4);

    const unchanged = await page.evaluate((pageId: string) => {
      const p = Store.getBlock(pageId);
      return JSON.stringify(DocumentMode.documentsIn(p).map((item: any) => ({ id: item.id, nr: item.nr })));
    }, id);
    pass(label + ': PDF-Quellblöcke bleiben unverändert', unchanged === original);
    pass(label + ': keine Browserfehler', errors.length === 0, errors.join(' | '));

    if (capture) {
      await page.screenshot({ path: path.join(folder, width + '-' +
        (dark ? 'dunkel' : 'hell') + '-seitenwechsel.png') });
      await page.locator('.document-topbar [data-document-action="inspector"]').click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(folder, width + '-' +
        (dark ? 'dunkel' : 'hell') + '-inspector-nachher.png') });
    }
    if (width === 1440) {
      /* Ein einzelnes Blatt benötigt weder einen Scheinfortschritt noch
         einen Knopf, der nirgendwohin springen kann. */
      const oneId = await page.evaluate(async () => {
        const single = Store.addPage(null, { text: 'Einzelnes A4-Blatt' });
        Store.addBlock(single.id, 'blatt', {
          text: '', blattBreite: 595, blattHoehe: 842, raumVersion: 1
        });
        Store.updateBlock(single.id, { dokumentModus: true });
        await Store.flush();
        return single.id as string;
      });
      await page.evaluate((pageId: string) => App.oeffne(pageId), oneId);
      await page.waitForFunction(() =>
        document.querySelector('.document-title-meta')?.textContent === 'Notizheft · 1 Seite');
      const single = await progress(page);
      pass(label + ': bei einer Seite gibt es keinen künstlichen Fortschrittsbalken',
        single.hidden && single.max === 1);
      pass(label + ': bei einer Seite ist der Sprungknopf deaktiviert',
        await page.locator('.document-position').isDisabled());
    }
    await context.close();
    current = null;
  }
  console.log('\n' + count + ' Dokumentkompass-Prüfungen bestanden.');
} finally {
  if (current && !current.isClosed()) await current.close().catch(() => {});
  await browser.close();
}
