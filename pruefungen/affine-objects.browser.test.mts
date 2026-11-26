/* Echte Bedienung von Gruppen, Ebenen und Sperren mit Sicherungsrundreise.
 * Künstliche Testdaten in einem frischen Browserprofil. --capture schreibt
 * nur nach bilder/. REDION_DOCK_ROOT erlaubt eine Gegenprobe. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';

const repo = path.resolve(import.meta.dirname, '..');
const root = process.env.REDION_DOCK_ROOT || repo;
const capture = process.argv.includes('--capture');
const folder = path.join(repo, 'bilder', 'neutral-affine', 'objects');
if (capture) fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch();
let passed = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); passed++; console.log('✓ ' + name); };

async function tool(page: Page, id: string) {
  const dock = page.locator('.pg-fl-tools');
  const button = dock.locator(`[data-wz="${id}"]`);
  if (id === 'zeiger') {
    await dock.locator('[data-a="modus"]').press('Enter');
    await button.click(); return;
  }
  const back = dock.locator('[data-richtung="links"]');
  for (let i = 0; i < 8 && await back.getAttribute('aria-disabled') !== 'true'; i++) await back.click();
  for (let i = 0; i < 8 && !await button.isVisible(); i++) await dock.locator('[data-richtung="rechts"]').click();
  await button.click();
}

try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 950 }, hasTouch: width === 390,
      reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const id = await page.evaluate(async (dark: boolean) => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
      App.theme(dark ? 'dark' : 'light');
      const p = Store.addPage(null, { text: 'Gruppen, Ebenen und Sperren', seitenAnsicht: 'flaeche',
        flaecheNotiz: { x: -1200, y: -500, w: 280, raumVersion: 1 }, shapes: [
          { id: 'a', art: 'rechteck', x: 30, y: 30, w: 100, h: 80, farbe: '#529cca', gefuellt: true, text: 'Entwurf', extra: { behalten: true } },
          { id: 'b', art: 'rechteck', x: 160, y: 30, w: 100, h: 80, farbe: '#4dab9a', gefuellt: true, text: 'Umsetzung' },
          { id: 'c', art: 'rechteck', x: 80, y: 80, w: 120, h: 100, farbe: '#ffdc49', gefuellt: true, text: 'Prüfung' },
          { id: 'ab', art: 'verbindung', von: 'a', nach: 'b', farbe: '#529cca' }
        ] });
      Store.addBlock(p.id, 'text', { text: 'Dieser Text bleibt erhalten.' });
      await Dateien.ablegen(new File(['Nur synthetische Testdaten'], 'probe.txt', { type: 'text/plain' }), { blockId: p.id });
      Store.setMeta('flaeche:' + p.id, { x: 12, y: 36, z: 1 });
      await Store.flush(); App.zeichneBaum(); return p.id as string;
    }, width === 390);
    await page.evaluate(id => App.oeffne(id), id);
    await page.locator('.pg-flaeche').waitFor();
    await page.waitForTimeout(400);
    const accent = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--accent').trim());
    check(`${width}: Bordeaux-Akzent durch Blau ersetzt`, accent === (width === 390 ? '#78b7ff' : '#0969da'));
    const shapes = () => page.evaluate(id => JSON.parse(JSON.stringify(Store.getBlock(id).shapes)), id) as Promise<any[]>;
    const field = () => page.locator('.pg-flaeche');
    const point = async (sid: string, dx = 50, dy = 40): Promise<[number, number]> => page.evaluate(({ id, sid, dx, dy }) => {
      const form = Store.getBlock(id).shapes.find((o: any) => o.id === sid);
      const matrix = document.querySelector<SVGSVGElement>('.pg-fl-tinte')!.getScreenCTM()!;
      const p = new DOMPoint(form.x + dx, form.y + dy).matrixTransform(matrix);
      return [p.x, p.y] as [number, number];
    }, { id, sid, dx, dy });
    const clickShape = async (sid: string, shift = false) => {
      if (shift) await page.keyboard.down('Shift');
      // Freie Stellen der Testformen: weder überdeckte Mitte noch Eckgriff
      // oder die schwebende Werkzeugleiste einer benachbarten Auswahl.
      const offset: [number, number] = sid === 'a' ? [8, 50] : sid === 'b' ? [70, 10] : [60, 60];
      const target = await point(sid, ...offset);
      check(`${width}: ${sid} ist an der Prüfposition frei bedienbar`, await page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return !!el?.closest('.pg-flaeche') && !el.closest('[data-skaliergriff], .pg-fl-auswahlleiste, .gfx-tb-sockel, .pg-fl-notiz');
      }, target));
      await page.mouse.click(...target);
      await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => done())));
      if (shift) await page.keyboard.up('Shift');
    };
    const objectMenu = async () => {
      await page.locator('.pg-fl-auswahlleiste [data-a="auswahlmehr"]').click();
      return page.locator('.menu').last();
    };
    const action = async (name: string) => (await objectMenu()).locator(`[data-object-action="${name}"]`).click();
    const savePicture = async (state: string) => { if (capture) await page.screenshot({ path: path.join(folder, `${state}-${width}.png`) }); };
    await clickShape('a'); await clickShape('b', true);
    await page.keyboard.press('Control+g');
    let current = await shapes();
    const groupId = current.find(o => o.id === 'a').groupId;
    check(`${width}: Gruppe ist an den vorhandenen Formen gespeichert`, groupId && current.find(o => o.id === 'b').groupId === groupId);
    await objectMenu(); await savePicture('gruppenmenue'); await page.keyboard.press('Escape');
    await field().focus(); await page.keyboard.press('Control+z');
    check(`${width}: Gruppieren ist genau ein Rückgängig-Schritt`, !(await shapes()).some(o => o.groupId));
    await page.keyboard.press('Control+Shift+z');
    check(`${width}: Vorwärts stellt dieselbe Gruppe her`, (await shapes()).filter(o => o.groupId === groupId).length === 2);
    await clickShape('c'); await clickShape('a');
    check(`${width}: Antippen eines Mitglieds wählt die ganze Gruppe`, await page.locator('.pg-fl-formauswahl > rect').count() === 2);
    const beforeDrag = await shapes();
    const start = await point('a');
    await page.mouse.move(...start); await page.mouse.down();
    await page.mouse.move(start[0] + 24, start[1] + 20, { steps: 6 }); await page.mouse.up();
    current = await shapes();
    check(`${width}: Mitglieder verschieben sich gemeinsam, Nachbar bleibt`, ['a', 'b'].every(sid => {
      const a = beforeDrag.find(o => o.id === sid), b = current.find(o => o.id === sid);
      return Math.abs(b.x - a.x - 24) < 0.1 && Math.abs(b.y - a.y - 20) < 0.1;
    }) && current.find(o => o.id === 'c').x === 80);
    await clickShape('a', true);
    check(`${width}: Umschalt-Klick wählt die ganze Gruppe ab`, await page.locator('.pg-fl-formauswahl > rect').count() === 0);
    await clickShape('a'); await action('lock');
    current = await shapes();
    check(`${width}: Sperre gilt auch für den internen Verbinder`, current.filter(o => ['a', 'b', 'ab'].includes(o.id)).every(o => o.locked === true));
    const lockedState = JSON.stringify(current);
    await savePicture('gesperrt');
    const held = await point('a', 10, 10);
    await page.mouse.move(...held); await page.mouse.down();
    await page.mouse.move(held[0] + 40, held[1] + 40, { steps: 5 }); await page.mouse.up();
    await field().focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Delete');
    check(`${width}: Gesperrte Gruppe lässt sich weder verschieben noch löschen`, JSON.stringify(await shapes()) === lockedState);
    check(`${width}: Gesperrte Gruppe hat keine Skaliergriffe`, await page.locator('[data-skaliergriff]').count() === 0);
    await tool(page, 'radierer'); await page.mouse.click(...await point('a', 10, 10));
    check(`${width}: Radierer lässt gesperrte Formen stehen`, JSON.stringify(await shapes()) === lockedState);
    await tool(page, 'zeiger'); await clickShape('a'); await action('unlock');
    check(`${width}: Entsperren entfernt auch die Sperre des Verbinders`, !(await shapes()).some(o => o.locked));
    await page.locator('.pg-fl-auswahlleiste [data-a="auswahlkopie"]').click();
    current = await shapes();
    const copies = current.filter(o => !['a', 'b', 'c', 'ab'].includes(o.id) && o.art !== 'verbindung');
    check(`${width}: Duplizierte Gruppe ist eigenständig und vollständig`, copies.length === 2 && copies[0].groupId && copies[0].groupId === copies[1].groupId && copies[0].groupId !== groupId);
    await field().focus(); await page.keyboard.press('Control+z');
    check(`${width}: Kopie und interner Pfeil verschwinden in einem Schritt`, (await shapes()).length === 4);
    await clickShape('a'); await field().focus(); await page.keyboard.press('Control+Shift+g');
    check(`${width}: Gruppe lässt sich ohne Datenverlust auflösen`, !(await shapes()).some(o => o.groupId) && (await shapes()).length === 4);
    await clickShape('c'); await clickShape('a'); await action('front');
    check(`${width}: Ganz nach vorne ändert die Zeichenreihenfolge`, (await shapes()).filter(o => o.art !== 'verbindung').at(-1).id === 'a');
    await action('backward');
    check(`${width}: Eine Ebene zurück überspringt Hintergrundverbinder`, (await shapes()).filter(o => o.art !== 'verbindung').map(o => o.id).join() === 'b,a,c');
    await action('back');
    check(`${width}: Ganz nach hinten bleibt ein einzelner Verlaufsschritt`, (await shapes()).filter(o => o.art !== 'verbindung')[0].id === 'a');
    await field().focus(); await page.keyboard.press('Control+z');
    check(`${width}: Rückgängig stellt die vorige Ebene her`, (await shapes()).filter(o => o.art !== 'verbindung').map(o => o.id).join() === 'b,a,c');
    await clickShape('a'); await clickShape('b', true); await page.keyboard.press('Control+g'); await action('lock');
    const expected = JSON.stringify(await shapes());
    const roundtrip = await page.evaluate(async id => {
      await Store.flush(); await Store.exportVorbereiten();
      const json = Store.exportAll();
      const received: { blob: Blob | null } = { blob: null };
      const create = URL.createObjectURL, click = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = blob => { received.blob = blob as Blob; return 'blob:synthetische-sicherung'; };
      HTMLAnchorElement.prototype.click = function () { if (!this.download) click.call(this); };
      try { await App.sicherungSpeichern(); } finally { URL.createObjectURL = create; HTMLAnchorElement.prototype.click = click; }
      if (!received.blob) throw new Error('Keine .redion-Sicherung');
      const zip = await Einlesen.zipLesenAusBlob(received.blob);
      const archive = await zip.text('daten.json');
      await Store.importAll(json, 'ersetzen'); await Store.flush();
      const jsonShapes = JSON.stringify(Store.getBlock(id).shapes);
      await Store.importAll(archive, 'ersetzen'); await Store.flush();
      return { json: jsonShapes, archive: JSON.stringify(Store.getBlock(id).shapes) };
    }, id);
    check(`${width}: JSON-Sicherung bewahrt IDs, Gruppen, Sperren und unbekannte Felder`, roundtrip.json === expected);
    check(`${width}: .redion-Sicherung bewahrt denselben vollständigen Bestand`, roundtrip.archive === expected);
    await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    await page.evaluate(id => App.oeffne(id), id); await field().waitFor();
    check(`${width}: Neuladen bewahrt Reihenfolge und Metadaten`, JSON.stringify(await shapes()) === expected);
    check(`${width}: ursprünglicher Seitentext ist erhalten`, await page.evaluate(id => Store.childrenOf(id).some((b: any) => b.text === 'Dieser Text bleibt erhalten.'), id));
    check(`${width}: keine Browserfehler`, errors.length === 0);
    await context.close();
  }
  console.log(`${passed} Zusagen erfüllt`);
} finally { await browser.close(); }
