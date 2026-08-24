/* Suite 167 — Ink V2 auf Blatt und PDF (E125)
 * ============================================================================
 * Marker, Formen, Text, Mehrfachauswahl und Aktionsverlauf muessen denselben
 * Dokumentraum und denselben SVG-Zeichner wie der alte Stift benutzen.
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PORT = 8946;
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
  const input = decodeURIComponent((request.url || '/').split('?')[0] || '/');
  const file = path.join(ROOT, input === '/' ? 'index.html' : input.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  response.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(PORT, resolve));

let passed = 0, failed = 0;
const check = (name: string, value: unknown, extra = ''): void => {
  if (value) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const equal = (name: string, actual: unknown, expected: unknown): void =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected),
    `ist ${JSON.stringify(actual)}, soll ${JSON.stringify(expected)}`);

const browser = await chromium.launch();
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(2200);

console.log('\n1 · Neutrale Geometrie und ein Zeichner fuer alle Ausgaben');
const geometry = await page.evaluate(() => {
  const wave = Array.from({ length: 80 }, (_value, index) =>
    [index * 3, 100 + Math.sin(index / 5) * 8]);
  const reduced = InkGeometry.simplify(wave, 1);
  const old = Marken.zeichneMarke({ id: 'old', art: 'stift', farbe: '#111111',
    breite: 2.4, pts: [[80, 300], [500, 340]] });
  const samples = [
    { id: 'm', art: 'marker', farbe: '#e0a419', breite: 5, pts: [[10, 10], [100, 30]] },
    { id: 'l', art: 'line', pts: [[10, 10], [100, 30]] },
    { id: 'a', art: 'arrow', pts: [[10, 10], [100, 30]] },
    { id: 'r', art: 'rectangle', pts: [[10, 10], [100, 30]] },
    { id: 'e', art: 'ellipse', pts: [[10, 10], [100, 30]] },
    { id: 't', art: 'text', point: [10, 30], text: '<b>sicher</b>', fontSize: 18 }
  ].map(mark => Marken.zeichneMarke(mark));
  const lowPressure = Marken.zeichneMarke({ id: 'p1', art: 'stift', breite: 4,
    pressure: [0.1, 0.1], pts: [[0, 0], [20, 20]] });
  const highPressure = Marken.zeichneMarke({ id: 'p2', art: 'stift', breite: 4,
    pressure: [0.9, 0.9], pts: [[0, 0], [20, 20]] });
  return {
    reduced: reduced.length, first: reduced[0], last: reduced[reduced.length - 1],
    oldPath: old?.getAttribute('d'), tags: samples.map(node => node?.tagName),
    markerOpacity: samples[0]?.getAttribute('opacity'),
    text: samples[5]?.textContent, textChildren: samples[5]?.children.length,
    smooth: InkGeometry.path([[0, 0], [10, 20], [30, 10]]),
    lowWidth: Number(lowPressure?.getAttribute('stroke-width')),
    highWidth: Number(highPressure?.getAttribute('stroke-width'))
  };
});
check('Punktreduktion verkleinert eine lange Eingabe', geometry.reduced < 80, String(geometry.reduced));
equal('Der erste Punkt bleibt', geometry.first, [0, 100]);
equal('Der letzte Punkt bleibt', geometry.last, [237, 99.26474519817855]);
equal('Alte Zweipunkt-Striche bleiben Zeichen fuer Zeichen kompatibel', geometry.oldPath, 'M80 300 L500 340');
equal('Marker, Linie, Pfeil, Rechteck, Ellipse und Text haben passende SVG-Knoten',
  geometry.tags, ['path', 'line', 'path', 'rect', 'ellipse', 'text']);
equal('Der Marker ist transparent', geometry.markerOpacity, '0.32');
equal('Text wird als Text statt als HTML gezeichnet', [geometry.text, geometry.textChildren], ['<b>sicher</b>', 0]);
check('Druck veraendert die sichtbare Strichbreite', geometry.highWidth > geometry.lowWidth,
  `${geometry.lowWidth} / ${geometry.highWidth}`);
check('Freihand mit mehreren Punkten wird geglaettet', geometry.smooth.includes(' Q'), geometry.smooth);

const built = await page.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const pageBlock = Store.addPage(null, { text: 'Ink V2' });
  const sheet = Store.addBlock(pageBlock.id, 'blatt', { text: '',
    marken: [{ id: 'legacy', art: 'stift', farbe: '#2f7ed8', breite: 2.4,
      pts: [[70, 90], [180, 120], [250, 100]] }] });
  Store.addBlock(sheet.id, 'text', { text: 'Notizen' });
  App.oeffne(pageBlock.id);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { page: pageBlock.id, sheet: sheet.id };
});

const selectTool = async (tool: string): Promise<void> => {
  await page.evaluate((value: string) => {
    ([...document.querySelectorAll<HTMLElement>('.blatt-werk button')]
      .find(button => button.dataset.wz === value))?.click();
  }, tool);
};
const draw = async (from: [number, number], to: [number, number], steps = 8): Promise<void> => {
  const box = await page.locator('.blatt-papier').boundingBox();
  if (!box) throw new Error('Kein Blatt');
  const at = (point: [number, number]) => ({ x: box.x + box.width * point[0], y: box.y + box.height * point[1] });
  const start = at(from), end = at(to);
  await page.mouse.move(start.x, start.y); await page.mouse.down();
  for (let index = 1; index <= steps; index++)
    await page.mouse.move(start.x + (end.x - start.x) * index / steps,
                          start.y + (end.y - start.y) * index / steps);
  await page.mouse.up(); await page.waitForTimeout(150);
};

console.log('\n2 · Marker und Formen gehen durch den echten Blattweg');
await page.evaluate(() => {
  const original = Store.updateBlock;
  (window as any).__inkOriginalUpdate = original;
  (window as any).__inkWrites = 0;
  Store.updateBlock = (...args: any[]) => {
    (window as any).__inkWrites++;
    return Reflect.apply(original, Store, args);
  };
});
await selectTool('marker');
await draw([0.20, 0.22], [0.62, 0.28], 18);
await selectTool('rectangle');
await draw([0.30, 0.36], [0.62, 0.52], 5);
const created = await page.evaluate((id: string) => {
  const marks = (Store.getBlock(id) || {}).marken || [];
  const marker = marks.find((mark: any) => mark.art === 'marker');
  const rectangle = marks.find((mark: any) => mark.art === 'rectangle');
  return { arts: marks.map((mark: any) => mark.art), pressure: marker?.pressure || [],
    markerPoints: marker?.pts?.length || 0, rectangle: rectangle?.pts,
    markerNodes: document.querySelectorAll('[data-ink-art="marker"]').length,
    rectangleNodes: document.querySelectorAll('[data-ink-art="rectangle"]').length,
    writes: (window as any).__inkWrites };
}, built.sheet);
await page.evaluate(() => { Store.updateBlock = (window as any).__inkOriginalUpdate; });
check('Bestandsstift, Marker und Rechteck sind gespeichert',
  ['stift', 'marker', 'rectangle'].every(art => created.arts.includes(art)), JSON.stringify(created.arts));
check('Druckwerte werden mitgefuehrt', created.pressure.length === created.markerPoints && created.pressure.length >= 2);
check('Coalesced-Eingabe wird reduziert, nicht ungegrenzt gespeichert', created.markerPoints < 19, String(created.markerPoints));
equal('Marker und Rechteck haben je genau einen SVG-Knoten',
  [created.markerNodes, created.rectangleNodes], [1, 1]);
equal('Pointer-Moves schreiben nicht in den Store — nur die zwei Abschluesse', created.writes, 2);

console.log('\n3 · Auswahl, Verschieben, Mehrfachloeschen, Undo und Redo');
await selectTool('select');
const rectangleNode = page.locator('[data-ink-art="rectangle"]');
const rectangleBox = await rectangleNode.boundingBox();
if (!rectangleBox) throw new Error('Kein Rechteck');
const beforeMove = created.rectangle;
await page.mouse.move(rectangleBox.x + rectangleBox.width / 2, rectangleBox.y + rectangleBox.height / 2);
await page.mouse.down();
await page.mouse.move(rectangleBox.x + rectangleBox.width / 2 + 48,
                      rectangleBox.y + rectangleBox.height / 2 + 24, { steps: 5 });
await page.mouse.up(); await page.waitForTimeout(150);
const moved = await page.evaluate((id: string) =>
  ((Store.getBlock(id) || {}).marken || []).find((mark: any) => mark.art === 'rectangle')?.pts, built.sheet);
check('Das ausgewaehlte Rechteck wurde im Dokumentraum verschoben',
  JSON.stringify(moved) !== JSON.stringify(beforeMove), JSON.stringify(moved));
await page.locator('[data-act="undo"]').click();
const undone = await page.evaluate((id: string) =>
  ((Store.getBlock(id) || {}).marken || []).find((mark: any) => mark.art === 'rectangle')?.pts, built.sheet);
equal('Undo nimmt die ganze Bewegung als eine Aktion zurueck', undone, beforeMove);
await page.locator('[data-act="redo"]').click();
const redone = await page.evaluate((id: string) =>
  ((Store.getBlock(id) || {}).marken || []).find((mark: any) => mark.art === 'rectangle')?.pts, built.sheet);
equal('Redo stellt die Bewegung wieder her', redone, moved);

const markerNode = page.locator('[data-ink-art="marker"]');
const markerBox = await markerNode.boundingBox();
if (!markerBox) throw new Error('Kein Marker');
await page.keyboard.down('Shift');
await page.mouse.click(markerBox.x + markerBox.width / 2, markerBox.y + markerBox.height / 2);
await page.keyboard.up('Shift');
const selected = await page.locator('.blatt-auswahlrahmen').count();
equal('Umschalt-Klick waehlt zwei Marken gemeinsam', selected, 2);
await page.locator('[data-act="delete"]').click();
const afterDelete = await page.evaluate((id: string) => ((Store.getBlock(id) || {}).marken || []).length, built.sheet);
equal('Mehrfachloeschen entfernt beide Marken in einer Aktion', afterDelete, 1);
await page.locator('[data-act="undo"]').click();
const afterDeleteUndo = await page.evaluate((id: string) => ((Store.getBlock(id) || {}).marken || []).length, built.sheet);
equal('Undo bringt beide gemeinsam zurueck', afterDeleteUndo, 3);

console.log('\n4 · Textanmerkung ist sicher und editierbar');
await selectTool('text');
const paperBox = await page.locator('.blatt-papier').boundingBox();
if (!paperBox) throw new Error('Kein Blatt');
await page.mouse.click(paperBox.x + paperBox.width * 0.55, paperBox.y + paperBox.height * 0.18);
await page.locator('#fq').fill('<img src=x onerror=1> Loesung');
await page.locator('[data-a="ok"]').click();
await page.waitForTimeout(150);
const textMark = await page.evaluate((id: string) => {
  const mark = ((Store.getBlock(id) || {}).marken || []).find((item: any) => item.art === 'text');
  const node = document.querySelector('[data-ink-art="text"]');
  return { text: mark?.text, shown: node?.textContent, children: node?.children.length };
}, built.sheet);
equal('Text steht in den Daten und wortgleich im SVG', [textMark.text, textMark.shown],
  ['<img src=x onerror=1> Loesung', '<img src=x onerror=1> Loesung']);
equal('Nutzertext erzeugt kein fremdes Element', textMark.children, 0);
const textNode = page.locator('[data-ink-art="text"]');
await textNode.evaluate((node: Element) => {
  const box = node.getBoundingClientRect();
  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true,
    pointerId: 31, button: 0, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
});
await page.locator('#fq').fill('Bearbeitete Loesung');
await page.locator('[data-a="ok"]').click();
await page.waitForTimeout(100);
const editedText = async (): Promise<string> => page.evaluate((id: string) =>
  ((Store.getBlock(id) || {}).marken || []).find((item: any) => item.art === 'text')?.text || '', built.sheet);
equal('Eine bestehende Textanmerkung laesst sich bearbeiten', await editedText(), 'Bearbeitete Loesung');
await page.locator('[data-act="undo"]').click();
equal('Undo nimmt die Textbearbeitung als eine Aktion zurueck', await editedText(), '<img src=x onerror=1> Loesung');
await page.locator('[data-act="redo"]').click();
equal('Redo stellt die Textbearbeitung wieder her', await editedText(), 'Bearbeitete Loesung');

console.log('\n5 · Drei Zielgroessen, Druck, Sicherung und Abgleich');
const viewports: Array<[number, number]> = [[390, 844], [1366, 768], [1440, 900]];
const measurements: any[] = [];
for (const [width, height] of viewports) {
  await page.setViewportSize({ width, height });
  await page.evaluate((id: string) => App.oeffne(id), built.page);
  await page.waitForTimeout(250);
  measurements.push(await page.evaluate(() => {
    const toolbar = document.querySelector<HTMLElement>('.blatt-werk');
    const paper = document.querySelector<HTMLElement>('.blatt-papier');
    return { toolbar: Math.round(toolbar?.getBoundingClientRect().height || 0),
      paper: Math.round(paper?.getBoundingClientRect().width || 0),
      marks: document.querySelectorAll('[data-sid]').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  }));
}
check('390×844 bleibt eine einzeilige, rollbare Werkzeugleiste', measurements[0].toolbar < 60,
  JSON.stringify(measurements[0]));
check('1366×768 und 1440×900 zeichnen alle Marken', measurements.slice(1).every(item => item.marks === 4),
  JSON.stringify(measurements));
check('Keine Zielgroesse erzeugt seitlichen Seitenueberstand', measurements.every(item => !item.overflow),
  JSON.stringify(measurements));

const roundtrip = await page.evaluate(async (id: string) => {
  const before = JSON.stringify((Store.getBlock(id) || {}).marken || []);
  const exported = Store.exportAll();
  await Store.importAll(exported, 'ersetzen');
  const after = JSON.stringify((Store.getBlock(id) || {}).marken || []);
  const base = { id, text: '', marken: [{ id: 'a', art: 'stift', pts: [[1, 1], [2, 2]] }] };
  const local = { ...base, marken: [...base.marken,
    { id: 'b', art: 'marker', pts: [[2, 2], [3, 3]], pressure: [0.2, 0.8] }] };
  const merged = Zusammen.dreiWege(base, local, base);
  return { same: before === after, syncMarks: merged.satz.marken?.length,
    conflicts: merged.konflikte.length };
}, built.sheet);
check('JSON-Sicherung und Wiederherstellung behalten alle Ink-Daten bytegleich', roundtrip.same);
equal('Einseitige Sync-Aenderung nimmt Marker samt Druckwerten mit',
  [roundtrip.syncMarks, roundtrip.conflicts], [2, 0]);

await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate((id: string) => App.oeffne(id), built.page);
await page.waitForTimeout(250);
const printHtml = await page.evaluate(async (id: string) => {
  const ready = new Promise<string>(resolve => {
    const observer = new MutationObserver(() => {
      const frames = [...document.querySelectorAll('iframe')];
      const doc = (frames[frames.length - 1] as HTMLIFrameElement | undefined)?.contentDocument;
      if (doc?.body?.innerHTML) { observer.disconnect(); resolve(doc.documentElement.outerHTML); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  Werkzeuge.drucken(Store.getBlock(id));
  return Promise.race([ready, new Promise<string>(resolve => setTimeout(() => resolve(''), 8000))]);
}, built.page);
check('Der Druckweg enthaelt Marker, Rechteck und Text als SVG',
  /data-ink-art="marker"/.test(printHtml) && /data-ink-art="rectangle"/.test(printHtml) &&
  /data-ink-art="text"/.test(printHtml), printHtml.slice(0, 160));
check('Keine unbehandelten Seitenfehler', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\nSuite 167 — Ink V2: ${passed} ok, ${failed} offen`);
process.exit(failed ? 1 : 0);
