/* Drehgriffe, Rahmeninhalt, Vollbild und echter PDF-Folienexport. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const repo = path.resolve(import.meta.dirname, '..'), root = process.env.REDION_DOCK_ROOT || repo;
const folder = path.join(repo, 'bilder', 'affine-elektro'); fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch(); let checked = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); checked++; console.log('✓ ' + name); };
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 950 : 844 }, hasTouch: width < 600, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(), errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const ids = await page.evaluate(async (width: number) => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove()); App.theme(width < 600 ? 'dark' : 'light');
      const shapes = [{ id: 'frame', art: 'frame', x: 20, y: 20, w: 340, h: 260, text: 'Konzept', farbe: '#529cca', frameOrder: 0 },
        { id: 'a', art: 'rechteck', x: 65, y: 90, w: 90, h: 70, text: 'Entwurf', farbe: '#529cca', gefuellt: true },
        { id: 'b', art: 'ellipse', x: 210, y: 100, w: 90, h: 70, text: 'Prüfung', farbe: '#4dab9a', gefuellt: true }];
      const canvas = Store.addPage(null, { text: 'Rahmen und Drehgriffe', seitenAnsicht: 'flaeche', shapes, flaecheNotiz: { x: -1000, y: -400, w: 280, raumVersion: 1 } });
      const wb = Store.addPage(null, { text: 'Drehgriffe im Whiteboard' }), board = Store.addBlock(wb.id, 'whiteboard', { shapes, hoehe: 500 });
      Store.setMeta('flaeche:' + canvas.id, { x: 15, y: 50, z: .7 }); await Store.flush(); App.zeichneBaum(); App.oeffne(canvas.id);
      return { canvas: canvas.id, wb: wb.id, board: board.id };
    }, width);
    const screenshot = async (name: string) => { if (process.argv.includes('--capture')) await page.screenshot({ path: path.join(folder, `${name}-${width}.png`) }); };
    for (const mode of ['page', 'wb']) {
      const id = mode === 'page' ? ids.canvas : ids.board;
      if (mode === 'wb') { await page.evaluate(id => App.oeffne(id), ids.wb); await page.locator('.wb').waitFor(); await page.locator('.wb-tools [data-a="mehr"]').click(); await page.locator('.wb-tools [data-a="objekte"]').click(); }
      else { await page.locator('.pg-flaeche').waitFor(); await page.locator('.pg-fl-tools [data-a="objekte"]').click(); }
      await page.locator('.gfx-inspector').getByRole('button', { name: 'Entwurf', exact: true }).click();
      await page.locator('.gfx-inspector').getByRole('button', { name: 'Objektübersicht schliessen', exact: true }).click();
      if (mode === 'wb') await page.locator('.wb-flaeche').scrollIntoViewIfNeeded();
      const grip = page.locator(mode === 'page' ? '.pg-fl-dreh-treffer' : '[data-wb-rotate]'); await grip.waitFor();
      const points = await page.evaluate(({ selector, mode }) => {
        const svg = document.querySelector<SVGSVGElement>(selector)!, matrix = svg.getScreenCTM()!;
        const center = new DOMPoint(110,125).matrixTransform(matrix);
        const handle = document.querySelector<SVGCircleElement>(mode === 'page' ? '.pg-fl-dreh-treffer' : '[data-wb-rotate]')!;
        const start = new DOMPoint(Number(handle.getAttribute('cx')),Number(handle.getAttribute('cy'))).matrixTransform(matrix);
        return { center: [center.x, center.y], start: [start.x, start.y] };
      }, { selector: mode === 'page' ? '.pg-fl-tinte' : '.wb-flaeche', mode });
      await screenshot('drehgriff-vor-' + mode);
      const hit = await page.evaluate(([x,y]) => ({ hit: !!document.elementFromPoint(x!,y!)?.closest('[data-drehgriff],[data-wb-rotate]'),
        target: document.elementFromPoint(x!,y!)?.outerHTML.slice(0,180), x,y }), points.start);
      if (!hit.hit) console.log(hit);
      check(`${mode} ${width}: Drehgriff ist unverdeckt`, hit.hit);
      await page.mouse.move(points.start[0]!, points.start[1]!); await page.mouse.down();
      const radius = points.center[1]! - points.start[1]!;
      await page.mouse.move(points.center[0]! + radius, points.center[1]!, { steps: 15 });
      check(`${mode} ${width}: Vorschau schreibt noch nichts`, await page.evaluate(id => !Store.getBlock(id).shapes.find((o: any) => o.id === 'a').rotation, id));
      await page.mouse.up();
      check(`${mode} ${width}: Drehgriff speichert 90 Grad`, await page.evaluate(id => Math.abs(Store.getBlock(id).shapes.find((o: any) => o.id === 'a').rotation - 90) < .1, id));
      await screenshot('drehgriff-' + mode);
      await page.locator(mode === 'page' ? '.pg-flaeche' : '.wb').focus(); await page.keyboard.press('Control+z');
      check(`${mode} ${width}: genau ein Verlaufsschritt`, await page.evaluate(id => !Store.getBlock(id).shapes.find((o: any) => o.id === 'a').rotation, id));
    }
    await page.evaluate(id => App.oeffne(id), ids.canvas); await page.locator('.pg-flaeche').waitFor();
    const before = await page.evaluate(id => JSON.stringify(Store.getBlock(id).shapes), ids.canvas);
    const point = await page.evaluate(() => { const matrix = document.querySelector<SVGSVGElement>('.pg-fl-tinte')!.getScreenCTM()!; const p = new DOMPoint(20,230).matrixTransform(matrix); return [p.x,p.y]; });
    await page.mouse.move(point[0]!,point[1]!); await page.mouse.down(); await page.mouse.move(point[0]! + 28,point[1]! + 21,{steps:10}); await page.mouse.up();
    const moved = await page.evaluate(id => Store.getBlock(id).shapes, ids.canvas);
    check(`${width}: Rahmen bewegt seinen gesamten Inhalt`, moved.every((o: any) => Math.abs(o.x - JSON.parse(before).find((b: any) => b.id === o.id).x - 40) < .1));
    await screenshot('rahmeninhalt');
    await page.locator('.pg-fl-tools [data-a="objekte"]').click(); const panel = page.locator('.gfx-inspector'); await panel.getByRole('button', { name: 'Rahmen', exact: true }).click();
    const downloaded = page.waitForEvent('download'); await panel.getByRole('button', { name: 'Rahmen als PDF exportieren' }).click();
    const pdfPath = await (await downloaded).path(), bytes = [...fs.readFileSync(pdfPath!)];
    const exported = await page.evaluate(async bytes => { const doc = await (window as any).PDFLib.PDFDocument.load(new Uint8Array(bytes)); return { pages: doc.getPageCount(), w: doc.getPage(0).getWidth(), h: doc.getPage(0).getHeight() }; }, bytes);
    check(`${width}: echter PDF-Folienexport hat Rahmenformat`, exported.pages === 1 && exported.w === 340 && exported.h === 260);
    await panel.getByRole('button', { name: 'Präsentation starten' }).click(); await page.locator('.gfx-presenting-screen').waitFor();
    check(`${width}: Vortrag verwendet die ganze Fläche`, await page.locator('.gfx-presenting-screen').evaluate(e => { const r=e.getBoundingClientRect(); return Math.abs(r.width-innerWidth)<2 && Math.abs(r.height-innerHeight)<2; }));
    await screenshot('vollbild-praesentation'); await page.locator('.gfx-presentation').getByRole('button', { name: 'Beenden', exact: true }).click();
    await page.locator('.gfx-presenting-screen').waitFor({ state:'detached' }); check(`${width}: sichtbarer Rückweg beendet Vollbild`, await page.locator('.gfx-presentation').count() === 0);
    check(`${width}: keine Browserfehler`, !errors.length); await context.close();
  }
  console.log(`${checked} Zusagen erfüllt`);
} finally { await browser.close(); }
