/* Gemeinsame AFFiNE-Docks und native iOS-Brücke, nur künstliche Dokumente.
 * --capture liefert echte Browserbilder, --baseline überspringt neue Zusagen.
 * REDION_DOCK_ROOT erlaubt Gegenproben gegen einen anderen Quellstand.
 * Ein Browserlauf ist kein Test des UIKit-Materials auf einem iPhone. */
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(import.meta.dirname, '..');
const root = process.env.REDION_DOCK_ROOT || repo;
const baseline = process.argv.includes('--baseline');
const capture = process.argv.includes('--capture');
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await engine.launch();
const folder = path.join(process.env.REDION_DOCK_PICTURES || path.join(repo, 'bilder', 'context-docks'), engine.name());
if (capture) fs.mkdirSync(folder, { recursive: true });
const swift = fs.readFileSync(path.join(root, 'ios/native-glass-dock.swift'), 'utf8');
const bridge = swift.match(/private static let bridgeJavaScript = #"""\n([\s\S]*?)\n    """#/)?.[1];
assert.ok(bridge);
let checked = 0;
const check = (name: string, value: unknown) => {
  assert.ok(value, name); checked++; console.log('✓ ' + name);
};
try {
  for (const [width, height, dark] of [[1366, 950, false], [390, 844, true], [320, 780, false]] as const) {
    if (process.env.REDION_DOCK_WIDTH && width !== Number(process.env.REDION_DOCK_WIDTH)) continue;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 761,
      reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined');
    const ids = await page.evaluate(async ({ dark }) => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove());
      App.theme(dark ? 'dark' : 'light');
      const wb = Store.addPage(null, { text: 'Ideen und Skizzen' });
      Store.addBlock(wb.id, 'whiteboard', { text: 'Projektübersicht', hoehe: 420, shapes: [
        { id: 'a', art: 'notiz', x: 50, y: 70, w: 180, h: 100, farbe: '#ffdc49', text: 'Idee sammeln' },
        { id: 'b', art: 'rechteck', x: 300, y: 90, w: 170, h: 90, farbe: '#529cca', text: 'Planen' },
        { id: 'c', art: 'verbindung', von: 'a', nach: 'b', farbe: '#529cca' }
      ] });
      const pdf = Store.addPage(null, { text: 'Arbeitsblatt.pdf', dokumentModus: true });
      const sheet = document.createElement('canvas'); sheet.width = 595; sheet.height = 842;
      const ink = sheet.getContext('2d')!;
      ink.fillStyle = '#ffffff'; ink.fillRect(0, 0, 595, 842);
      ink.fillStyle = '#28313f'; ink.font = 'bold 28px sans-serif'; ink.fillText('Stromkreise verstehen', 44, 70);
      ink.font = '16px sans-serif'; ink.fillText('Übungsblatt · nur künstliche Testdaten', 44, 102);
      ink.fillText('1. Beschrifte die Bauteile.', 44, 166);
      ink.fillText('2. Zeichne den Stromweg ein.', 44, 196);
      ink.strokeStyle = '#48576a'; ink.lineWidth = 2;
      ink.strokeRect(100, 270, 350, 180); ink.clearRect(200, 263, 150, 14); ink.strokeRect(200, 258, 150, 25);
      ink.beginPath(); ink.arc(275, 450, 30, 0, Math.PI * 2); ink.fillStyle = '#fff'; ink.fill(); ink.stroke();
      ink.beginPath(); ink.moveTo(255, 430); ink.lineTo(295, 470); ink.moveTo(295, 430); ink.lineTo(255, 470); ink.stroke();
      ink.fillStyle = '#28313f'; ink.fillText('Widerstand', 230, 245); ink.fillText('Lampe', 250, 510);
      ink.strokeStyle = '#d8dee6';
      for (let y = 590; y < 780; y += 35) { ink.beginPath(); ink.moveTo(44, y); ink.lineTo(551, y); ink.stroke(); }
      const image = await new Promise<Blob>(done => sheet.toBlob(blob => done(blob!), 'image/png'));
      const file = await Dateien.ablegen(new File([image], 'arbeitsblatt.png', { type: 'image/png' }));
      Store.addBlock(pdf.id, 'pdfseite', { nr: 1, vonSeiten: 1, bw: 595, bh: 842, raumVersion: 1,
        bildDateiId: file.id, suchtext: 'Synthetisches Arbeitsblatt' });
      const plan = Store.addPage(null, { text: 'Lichtschaltung' });
      Store.addBlock(plan.id, 'schaltplan', { text: 'Übungsschaltung', plan: {
        art: 'stromlauf-aufgeloest', breite: 600, hoehe: 420,
        teile: [{ id: 'E1', zeichen: 'lampe', x: 220, y: 140, bmk: 'E1', rotation: 0, ebene: 'plan', werte: {} }],
        leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', sichtbar: true, farbe: '#529cca' }]
      } });
      await Store.flush(); App.zeichneBaum();
      return { wb: wb.id, pdf: pdf.id, plan: plan.id };
    }, { dark });
    if (capture) {
      await page.evaluate(() => Bibliothek.oeffne());
      await page.getByRole('heading', { name: 'Dokumente', exact: true }).waitFor();
      await page.screenshot({ path: path.join(folder, `bibliothek-${width}-${dark ? 'dunkel' : 'hell'}-${baseline ? 'vorher' : 'nachher'}.png`) });
    }
    for (const kind of ['wb', 'pdf', 'plan'] as const) {
      await page.evaluate(id => App.oeffne(id), ids[kind]);
      const selector = kind === 'wb' ? '.wb-tools' : kind === 'pdf' ? '.document-pdf-dock' : '.sp-werkzeuge';
      const dock = page.locator(selector).first();
      await dock.waitFor();
      await dock.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(350);
      if (capture) await page.screenshot({ path: path.join(folder, `${kind}-${width}-${dark ? 'dunkel' : 'hell'}-${baseline ? 'vorher' : 'nachher'}.png`) });
      if (baseline) continue;
      check(`${kind} ${width}: gemeinsame Galerie`, await dock.evaluate(el => el.classList.contains('gfx-tb-edgeless')));
      check(`${kind} ${width}: Leiste bleibt im Fenster`, await dock.evaluate(el => {
        const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1;
      }));
      check(`${kind} ${width}: Vorschauen haben sichtbare Bilder oder Registersymbole`, await dock.locator('.gfx-tb-karte:not([hidden]) button').evaluateAll(buttons => buttons.every(b => {
        const icon = b.querySelector('.zeichen');
        if (!icon) return false;
        const svg = icon.querySelector('svg');
        return getComputedStyle(icon).backgroundImage !== 'none' || !!icon.querySelector('[data-vorschau]') ||
          !!(svg && getComputedStyle(svg).visibility === 'visible');
      })));
      if (width <= 760) check(`${kind} ${width}: alle sichtbaren Hauptwerkzeuge mindestens 44 px`,
        await dock.locator('.gfx-tb-haupt button').evaluateAll(buttons => buttons.filter(b => b.getClientRects().length).every(b => {
          const r = b.getBoundingClientRect(); return r.width >= 43.9 && r.height >= 43.9;
        })));
      check(`${kind} ${width}: Zusatzaktionen werden nicht abgeschnitten`, await dock.locator('.gfx-tb-edgeless-zusatz button').evaluateAll(buttons => buttons.every(b => {
        const r = b.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return !!hit && b.contains(hit);
      })));
      if (kind === 'pdf' && capture) {
        const pen = dock.locator('[data-wz="stift"]');
        for (let i = 0; i < 6 && !await pen.isVisible(); i++) await dock.locator('[data-richtung="rechts"]').click();
        await pen.click();
        await page.screenshot({ path: path.join(folder, `pdf-stift-${width}-nachher.png`) });
      }
      if (kind === 'wb') {
        await dock.locator('[data-a="wb-modus"]').click();
        await dock.locator('.gfx-tb-menue [data-wz="hand"]').click();
        check(`${width}: Whiteboard-Hand bleibt funktionsfähig`, await page.locator('.wb').evaluate(el => el.classList.contains('wb-schiebt')));
        if (capture) {
          await dock.locator('[data-a="wb-modus"]').click();
          await page.screenshot({ path: path.join(folder, `wb-menue-${width}-nachher.png`) });
          await page.keyboard.press('Escape');
        }
      }
      if (kind === 'plan') {
        await dock.locator('[data-wz="stift"]').click();
        check(`${width}: Plan-Stift wählt das vorhandene Werkzeug`, await dock.locator('[data-wz="stift"]').getAttribute('aria-pressed') === 'true');
        await dock.locator('[data-a="palette-toggle"]').click();
        check(`${width}: Bauteilpalette öffnet sich`, await page.locator('.sp-palette').isVisible());
        if (capture) await page.screenshot({ path: path.join(folder, `plan-stift-${width}-nachher.png`) });
      }
    }
    if (!baseline && width === 390) {
      await page.evaluate(id => App.oeffne(id), ids.wb);
      await page.evaluate(() => {
        (window as any).__dockMessages = [];
        (window as any).webkit = { messageHandlers: { redionDock: { postMessage: (data: unknown) => (window as any).__dockMessages.push(data) } } };
      });
      await page.evaluate(bridge);
      await page.waitForTimeout(60);
      check('iOS-Brücke verbirgt das Webdock erst nach nativer Bestätigung', await page.evaluate(() => !document.documentElement.classList.contains('redion-ios-native-dock') && document.getElementById('handy-oben')?.getAttribute('aria-hidden') !== 'true'));
      await page.evaluate(() => (window as any).__redionNativeDockReady());
      check('Nach nativer Bestätigung bleibt genau eine zugängliche Navigation', await page.evaluate(() => document.getElementById('handy-oben')?.getAttribute('aria-hidden') === 'true' && document.documentElement.classList.contains('redion-ios-native-dock')));
      check('iOS-Brücke meldet Navigation ausserhalb des Zeichenstudios', await page.evaluate(() => (window as any).__dockMessages.at(-1).visible));
      check('iOS-Brücke hat eine separate Suchaktion', await page.evaluate(() => typeof (window as any).__redionNativeDockSearch === 'function'));
      await page.evaluate(() => (window as any).__redionNativeDockSearch());
      check('Suchkapsel öffnet die vorhandene Redion-Suche', await page.locator('.finder').isVisible());
      await page.keyboard.press('Escape');
      await page.evaluate(id => App.oeffne(id), ids.pdf);
      await page.waitForTimeout(120);
      check('iOS-Hauptdock räumt dem PDF-Zeichendock Platz ein', await page.evaluate(() => !(window as any).__dockMessages.at(-1).visible));
    }
    check(`${width}: keine Browserfehler`, !errors.length);
    await context.close();
  }
  console.log(`${checked} Zusagen erfüllt`);
} finally { await browser.close(); }
