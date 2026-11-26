/* Echte Bedienung und Datenrundreise der gemeinsamen AFFiNE-Flächenbefehle.
 * Ausschliesslich synthetische Daten; Bilder bleiben ausserhalb von Git. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const repo = path.resolve(import.meta.dirname, '..');
const root = process.env.REDION_DOCK_ROOT || repo;
const pictures = path.join(repo, 'bilder', 'affine-workbench'); fs.mkdirSync(pictures, { recursive: true });
const browser = await chromium.launch(); let checks = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); checks++; console.log('✓ ' + name); };
try {
  for (const width of [1366, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 950 : 844 }, hasTouch: width < 600,
      reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const ids = await page.evaluate(async (width: number) => {
      Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
      App.theme(width < 600 ? 'dark' : 'light');
      const shapes = [
        { id: 'a', art: 'rechteck', x: 30, y: 40, w: 100, h: 80, farbe: '#529cca', text: 'Entwurf', gefuellt: true },
        { id: 'b', art: 'ellipse', x: 170, y: 150, w: 110, h: 90, farbe: '#4dab9a', text: 'Umsetzung', gefuellt: true },
        { id: 'c', art: 'notiz', x: 320, y: 70, w: 130, h: 100, farbe: '#ffdc49', text: 'Prüfung' },
        { id: 'ab', art: 'verbindung', von: 'a', nach: 'b', farbe: '#529cca' }
      ];
      const canvas = Store.addPage(null, { text: 'Projektatelier', seitenAnsicht: 'flaeche', shapes,
        flaecheNotiz: { x: -900, y: -500, w: 280, raumVersion: 1 } });
      const wb = Store.addPage(null, { text: 'Whiteboard' }); const board = Store.addBlock(wb.id, 'whiteboard', { shapes, hoehe: 440 });
      const pdf = Store.addPage(null, { text: 'Übungsblatt.pdf', dokumentModus: true });
      const image = document.createElement('canvas'); image.width = 595; image.height = 842;
      const ctx = image.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 595, 842); ctx.fillStyle = '#25252a'; ctx.font = '26px sans-serif'; ctx.fillText('Übungsblatt', 50, 65);
      const blob = await new Promise<Blob>(resolve => image.toBlob(b => resolve(b!)));
      const file = await Dateien.ablegen(new File([blob], 'probe.png', { type: 'image/png' }));
      const sheet = Store.addBlock(pdf.id, 'pdfseite', { nr: 1, vonSeiten: 1, bw: 595, bh: 842, raumVersion: 1, bildDateiId: file.id,
        marken: [{ id: 'p1', art: 'rectangle', pts: [[50, 120], [150, 190]], farbe: '#529cca', breite: 2 },
          { id: 'p2', art: 'ellipse', pts: [[220, 210], [330, 290]], farbe: '#4dab9a', breite: 2 }] });
      Store.addPage(null, { text: 'Projekt Architektur', tags: ['atelier'], favorite: true });
      const embedded = Store.addPage(null, { text: 'Spezifikation' });
      const embeddedText = Store.addBlock(embedded.id, 'text', { text: 'Gemeinsame Spezifikation' });
      Store.setMeta('flaeche:' + canvas.id, { x: 12, y: 36, z: .65 }); await Store.flush(); App.zeichneBaum();
      return { canvas: canvas.id, wb: wb.id, board: board.id, pdf: pdf.id, sheet: sheet.id, file: file.id, embedded: embedded.id, embeddedText: embeddedText.id };
    }, width);
    const picture = async (name: string) => { if (process.argv.includes('--capture')) await page.screenshot({ path: path.join(pictures, `${name}-${width}.png`) }); };
    const shapes = () => page.evaluate(id => Store.getBlock(id).shapes, ids.canvas) as Promise<any[]>;
    const geometry = await page.evaluate(() => {
      const objects = [
        { id: 'a', art: 'rechteck', x: 0, y: 0, w: 20, h: 20 },
        { id: 'b', art: 'rechteck', x: 60, y: 40, w: 20, h: 20 },
        { id: 'c', art: 'rechteck', x: 200, y: 80, w: 20, h: 20 }
      ];
      const ids = new Set(['a', 'b', 'c']);
      const distributed = GfxObjects.align(objects, ids, 'horizontal');
      const snapped = GfxObjects.snap(objects, new Set(['a']), 57, 0, 5);
      const lasso = GfxObjects.lasso(objects, [[-5,-5],[25,-5],[25,25],[-5,25]]);
      const locked = [{ ...objects[0], locked: true }, ...objects.slice(1)];
      const rotated = GfxObjects.rotate(objects, new Set(['a']), 45);
      const b = GfxShapes.rahmenVon(rotated[0]);
      return { distributed: distributed[1].x, snapped: snapped.dx, guides: snapped.guides.length,
        lasso, locked: JSON.stringify(GfxObjects.align(locked, ids, 'left')) === JSON.stringify(locked), rotated: Math.abs(b.w - Math.sqrt(800)) < .01 };
    });
    check(`${width}: Verteilen erhält gleiche Lücken`, geometry.distributed === 100);
    check(`${width}: Einrasten liefert passende Hilfslinie`, geometry.snapped === 60 && geometry.guides > 0);
    check(`${width}: Lasso grenzt die Auswahl ein`, geometry.lasso.join() === 'a');
    check(`${width}: Ausrichten schützt Sperren`, geometry.locked);
    check(`${width}: gedrehte Grenzen stimmen`, geometry.rotated);
    await page.evaluate(id => App.oeffne(id), ids.canvas); await page.locator('.pg-flaeche').waitFor();
    await page.locator('.pg-fl-tools [data-a="modus"]').press('Enter');
    await page.locator('.pg-fl-tools [data-wz="freihandwahl"]').click();
    const polygon = await page.evaluate(() => {
      const matrix = document.querySelector<SVGSVGElement>('.pg-fl-tinte')!.getScreenCTM()!;
      return [[15,25],[140,25],[140,135],[15,135],[15,25]].map(([x,y]) => { const p = new DOMPoint(x,y).matrixTransform(matrix); return [p.x,p.y]; });
    });
    await page.mouse.move(polygon[0]![0]!, polygon[0]![1]!); await page.mouse.down();
    for (const p of polygon.slice(1)) await page.mouse.move(p[0]!, p[1]!, { steps: 8 }); await page.mouse.up();
    check(`${width}: Freihandlasso funktioniert mit echten Zeigerereignissen`, await page.locator('.pg-fl-formauswahl > rect').count() === 1);
    if (width < 600) {
      const extra = await page.locator('.pg-fl-tools .gfx-tb-edgeless-zusatz').boundingBox(), history = await page.locator('.pg-fl-tools .gfx-tb-neben').boundingBox();
      check(`${width}: Objektknopf verdeckt keinen Verlauf`, !!extra && !!history && extra.x + extra.width <= history.x);
    }
    await picture('lasso');
    const open = async () => {
      await page.locator('.pg-fl-tools [data-a="objekte"]').click();
      await page.locator('.gfx-inspector').waitFor();
    };
    await open(); let panel = page.locator('.gfx-inspector');
    check(`${width}: Übersicht passt ins Fenster`, await panel.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }));
    check(`${width}: alle Schaltflächen haben 44px`, await panel.locator('button:visible').evaluateAll(es => es.every(e => e.getBoundingClientRect().height >= 44)));
    await picture('ebenen');
    await panel.getByRole('button', { name: 'Alle auswählen', exact: true }).click();
    await panel.getByRole('button', { name: 'Ausrichten', exact: true }).click();
    await panel.getByRole('button', { name: 'Links', exact: true }).click();
    check(`${width}: echte Ausrichten-Aktion`, (await shapes()).filter(o => o.art !== 'verbindung').every(o => Math.abs(o.x - 30) < .01));
    await panel.getByRole('button', { name: '90° im Uhrzeigersinn', exact: true }).click();
    check(`${width}: Drehung wird gespeichert und gezeichnet`, (await shapes()).filter(o => o.art !== 'verbindung').every(o => o.rotation === 90) && await page.locator('.pg-fl-tinte [transform^="rotate"]').count() === 3);
    await picture('ausrichten');
    await panel.getByRole('button', { name: 'Ebenen', exact: true }).click();
    await panel.getByRole('button', { name: 'Gruppieren', exact: true }).click();
    const group = (await shapes()).find(o => o.id === 'a').groupId;
    await panel.getByRole('button', { name: 'Gruppieren', exact: true }).click();
    check(`${width}: verschachtelte Gruppen erhalten Untergruppe`, (await shapes()).filter(o => o.art !== 'verbindung').every(o => o.groupPath.length === 2 && o.groupPath[0] === group));
    await panel.getByRole('button', { name: 'Gruppe auflösen', exact: true }).click();
    check(`${width}: Auflösen erhält innere Gruppe`, (await shapes()).filter(o => o.art !== 'verbindung').every(o => o.groupId === group));
    await panel.locator('.gfx-layer-row').filter({ hasText: 'Entwurf' }).getByRole('button', { name: 'Einzeln', exact: true }).click();
    await panel.getByRole('button', { name: 'Kommentare', exact: true }).click();
    const comment = 'Entwurf prüfen <img src=x onerror=alert(1)>';
    await panel.getByRole('textbox', { name: 'Neuer Objektkommentar' }).fill(comment);
    await panel.getByRole('button', { name: 'Kommentar hinzufügen' }).click();
    check(`${width}: Kommentar ist sicherer Text`, (await shapes()).find(o => o.id === 'a').objectComments[0].text === comment && await panel.locator('.gfx-object-comment img').count() === 0);
    await panel.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    await panel.getByRole('textbox', { name: 'Kommentar bearbeiten', exact: true }).fill('Den Entwurf gemeinsam abstimmen.');
    await panel.getByRole('button', { name: 'Änderung speichern', exact: true }).click();
    await picture('kommentare');
    await panel.getByRole('button', { name: 'Erledigen', exact: true }).click();
    await panel.getByRole('button', { name: 'Rahmen', exact: true }).click();
    await panel.getByRole('button', { name: 'Rahmen um Auswahl' }).click();
    await panel.getByRole('textbox', { name: 'Rahmentitel 1', exact: true }).fill('Planung');
    await panel.getByRole('textbox', { name: 'Rahmentitel 1', exact: true }).press('Tab');
    await panel.getByRole('button', { name: 'Rahmen um Auswahl' }).click();
    await picture('rahmen');
    await panel.getByRole('button', { name: 'Präsentation starten' }).click();
    await page.locator('.gfx-presentation').waitFor(); await picture('praesentation');
    await page.keyboard.press('ArrowRight'); check(`${width}: Präsentation wechselt Rahmen`, (await page.locator('.gfx-presentation [role="status"]').innerText()).startsWith('2 / 2'));
    await page.keyboard.press('Escape'); check(`${width}: Escape beendet Vortrag`, await page.locator('.gfx-presentation').count() === 0);
    await open(); panel = page.locator('.gfx-inspector');
    await panel.getByRole('button', { name: 'Verbindung', exact: true }).click();
    await panel.getByRole('button', { name: 'Ausrichten', exact: true }).click();
    await panel.getByLabel('Verlauf', { exact: true }).selectOption('orthogonal');
    check(`${width}: rechtwinkliger Verbinder`, (await shapes()).find(o => o.id === 'ab').route === 'orthogonal' && (await page.locator('.pg-fl-tinte path[data-sid="ab"]').getAttribute('d'))?.includes(' H'));
    await panel.getByLabel('Verlauf', { exact: true }).selectOption('curve');
    await panel.getByLabel('Anfang', { exact: true }).selectOption('right');
    check(`${width}: Kurve und Anschlusspunkt gespeichert`, (await shapes()).find(o => o.id === 'ab').sourceAnchor === 'right' && (await page.locator('.pg-fl-tinte path[data-sid="ab"]').getAttribute('d'))?.includes(' C'));
    await picture('verbinder');
    await panel.getByRole('button', { name: 'Austausch', exact: true }).click();
    const download = page.waitForEvent('download'); await panel.getByRole('button', { name: 'Bearbeitbare Fläche exportieren' }).click();
    const file = await download, filePath = await file.path(); const saved = JSON.parse(fs.readFileSync(filePath!, 'utf8'));
    check(`${width}: editierbarer Export enthält alle Metadaten`, saved.shapes.some((o: any) => o.objectComments?.length) && saved.shapes.filter((o: any) => o.art === 'frame').length === 2 && saved.shapes.some((o: any) => o.groupPath));
    const svgDownload = page.waitForEvent('download'); await panel.getByRole('button', { name: 'SVG exportieren' }).click();
    const svg = fs.readFileSync((await (await svgDownload).path())!, 'utf8'); check(`${width}: SVG enthält Rahmen und Kurven`, svg.includes('Planung') && svg.includes('rotate(90') && svg.includes(' C'));
    const affine = { blocks: [{ id: 'surface', flavour: 'affine:surface', props: { elements: {
      s1: { type: 'shape', xywh: '[40,400,160,90]', shapeType: 'rect', text: 'AFFiNE-Import', rotate: 15, filled: true, strokeColor: '#529cca' },
      s2: { type: 'shape', xywh: '[260,400,160,90]', shapeType: 'ellipse', text: 'Ziel' },
      g: { type: 'group', children: { s1: true, s2: true } },
      l: { type: 'connector', source: { id: 's1' }, target: { id: 's2' }, mode: 1 }
    } } }] };
    await panel.locator('input[type="file"]').setInputFiles({ name: 'affine-snapshot.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(affine)) });
    await panel.getByRole('button', { name: 'AFFiNE-Import', exact: true }).waitFor();
    const imported = (await shapes()).find(o => o.text === 'AFFiNE-Import');
    check(`${width}: AFFiNE-Snapshot importiert Gruppen und Winkel`, imported.rotation === 15 && imported.groupId && imported.id !== 's1');
    await picture('affine-import');
    if (width === 1366) {
      const archive = await page.evaluate(async (imageId: string) => {
        const snapshot = { blocks: [
          { id: 'image', flavour: 'affine:image', props: { sourceId: 'picture', xywh: '[500,40,100,140]' } },
          { id: 'file', flavour: 'affine:attachment', props: { sourceId: 'note', name: 'Entwurf.txt', type: 'text/plain', xywh: '[500,250,220,72]' } }
        ] };
        const zip = await Austausch.zipSchreiben([{ name: 'snapshot.json', inhalt: JSON.stringify(snapshot) },
          { name: 'assets/picture', inhalt: await Dateien.alsBlob(imageId) }, { name: 'assets/note', inhalt: new Blob(['Anhang bytegenau ✓']) }]);
        return [...new Uint8Array(await zip.arrayBuffer())];
      }, ids.file);
      await panel.getByRole('button', { name: 'Austausch', exact: true }).click();
      await panel.locator('input[type="file"]').setInputFiles({ name: 'affine-attachments.zip', mimeType: 'application/zip', buffer: Buffer.from(archive) });
      await panel.getByRole('button', { name: 'Entwurf.txt', exact: true }).waitFor();
      const asset = (await shapes()).find(o => o.art === 'attachment');
      check('AFFiNE-Anhang bleibt bytegenau', await page.evaluate(async id => (await Dateien.alsBlob(id))?.text(), asset.dateiId) === 'Anhang bytegenau ✓');
      await picture('anhaenge');
      await panel.getByRole('button', { name: 'Austausch', exact: true }).click();
      const downloadZip = page.waitForEvent('download'); await panel.getByRole('button', { name: 'Bearbeitbare Fläche exportieren' }).click();
      const zipPath = await (await downloadZip).path(), bytes = [...fs.readFileSync(zipPath!)];
      const result = await page.evaluate(async bytes => {
        const imported = await GfxExchange.readFile(new File([new Uint8Array(bytes)], 'canvas.zip'), () => Store.uid(), {
          zip: Einlesen.zipLesenAusBlob, save: async (blob, name) => (await Dateien.ablegen(new File([blob], name, { type: blob.type }))).id, remove: Dateien.weg
        });
        const attachment = imported.find(o => o.art === 'attachment');
        return { count: imported.length, text: await (await Dateien.alsBlob(attachment.dateiId))?.text(), id: attachment.dateiId,
          comments: imported.some(o => o.objectComments?.length), image: imported.some(o => o.art === 'bild' && o.dateiId) };
      }, bytes);
      check('Flächenarchiv enthält Bild, Anhang und Kommentare', result.count === (await shapes()).length && result.image && result.comments && result.text === 'Anhang bytegenau ✓' && result.id !== asset.dateiId);
      const failure = await page.evaluate(async () => {
        const snapshot = { blocks: [{ id: 'f', flavour: 'affine:attachment', props: { sourceId: 'missing', name: 'Fehlt.txt' } }] };
        const zip = await Austausch.zipSchreiben([{ name: 'snapshot.json', inhalt: JSON.stringify(snapshot) }]);
        let writes = 0;
        try { await GfxExchange.readFile(new File([zip], 'missing.zip'), () => Store.uid(), {
          zip: Einlesen.zipLesenAusBlob, save: async () => { writes++; return 'bad'; }, remove: async () => {} }); }
        catch (error) { return { writes, message: String(error) }; }
        return { writes, message: '' };
      });
      check('Fehlender Anhang bricht vor dem ersten Schreibzugriff ab', failure.writes === 0 && failure.message.includes('fehlt'));
    }
    const roundtrip = JSON.stringify(await shapes());
    await page.evaluate(async () => { await Store.flush(); }); await page.reload();
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    await page.evaluate(id => App.oeffne(id), ids.canvas); await page.locator('.pg-flaeche').waitFor();
    check(`${width}: Neuladen bewahrt kompletten Objektbestand`, JSON.stringify(await shapes()) === roundtrip);
    const linkMenu = page.locator('.pg-fl-tools [data-a="seitenlink"]');
    await (await linkMenu.isVisible() ? linkMenu : page.locator('.pg-fl-tools [data-a="schnellmehr"]')).click();
    await page.getByText('Dokument einbetten', { exact: true }).click();
    await page.locator(`[data-embed-page="${ids.embedded}"]`).click();
    await page.locator('.pg-fl-koerper .synced').getByText('Gemeinsame Spezifikation', { exact: true }).waitFor();
    check(`${width}: Dokument nutzt den vorhandenen Spiegelblock`, await page.evaluate(id => Store.childrenOf(id).some((b: any) => b.type === 'synced'), ids.canvas));
    await picture('dokument-eingebettet');
    await page.evaluate(id => { Store.updateBlock(id, { text: 'Aktualisierte Spezifikation' }); App.zeichneSeite(); }, ids.embeddedText);
    await page.locator('.pg-fl-koerper .synced').getByText('Aktualisierte Spezifikation', { exact: true }).waitFor();
    check(`${width}: eingebetteter Inhalt bleibt verbunden`, true);
    const oldAccount = await page.evaluate(({ source, target }) => {
      const previous = Konten.aktiv().id, guest = Konten.anlegen({ name: 'Prüfgast', rolleId: 'edit' });
      Konten.setzeFreigabe(source, guest.id, 'kein'); Konten.setzeFreigabe(target, guest.id, 'edit');
      Konten.anmelden(guest.id); App.oeffne(target); return previous;
    }, { source: ids.embedded, target: ids.canvas });
    await page.getByText('Die eingebettete Quelle ist nicht verfügbar.', { exact: true }).waitFor();
    check(`${width}: echte Quellenrechte gelten im eingebetteten Dokument`, await page.locator('.synced').getByText('Aktualisierte Spezifikation', { exact: true }).count() === 0);
    await page.evaluate(({ account, pageId }) => { Konten.anmelden(account); App.oeffne(pageId); }, { account: oldAccount, pageId: ids.canvas });
    // Dieselbe Übersicht im Whiteboard; bestehender Datenweg und Verlauf.
    await page.evaluate(id => App.oeffne(id), ids.wb); await page.locator('.wb-tools').waitFor();
    await page.locator('.wb-tools [data-a="mehr"]').click(); await page.locator('.wb-tools [data-a="objekte"]').click();
    panel = page.locator('.gfx-inspector'); await panel.getByRole('button', { name: 'Alle auswählen' }).click(); await panel.getByRole('button', { name: 'Gruppieren', exact: true }).click();
    check(`${width}: Whiteboard gruppiert persistent`, await page.evaluate(id => Store.getBlock(id).shapes.filter((o: any) => o.art !== 'verbindung').every((o: any) => !!o.groupId), ids.board));
    await panel.getByRole('button', { name: 'Sperren', exact: true }).click(); await picture('whiteboard');
    check(`${width}: Whiteboard sperrt auch interne Verbindung`, await page.evaluate(id => Store.getBlock(id).shapes.every((o: any) => o.locked), ids.board));
    await page.keyboard.press('Escape'); await page.locator('.wb').focus(); await page.keyboard.press('Control+z');
    check(`${width}: Whiteboard verwendet seinen Verlauf`, await page.evaluate(id => Store.getBlock(id).shapes.every((o: any) => !o.locked), ids.board));
    // PDF-Objektübersicht benutzt vorhandene Tintenkoordinaten.
    await page.evaluate(id => App.oeffne(id), ids.pdf); await page.locator('.document-pdf-dock').waitFor();
    await page.locator('.document-pdf-dock [data-a="pdf-objekte"]').click();
    panel = page.locator('.gfx-inspector'); await panel.waitFor(); await panel.getByRole('button', { name: 'Alle auswählen' }).click(); await panel.getByRole('button', { name: 'Gruppieren', exact: true }).click();
    await picture('pdf');
    check(`${width}: PDF-Gruppierung bleibt im Markenformat`, await page.evaluate(id => Store.getBlock(id).marken.every((m: any) => !!m.groupId && Array.isArray(m.pts)), ids.sheet));
    await page.keyboard.press('Escape'); await page.evaluate(() => Bibliothek.oeffne());
    await page.locator('[data-orte]').first().click(); await page.getByText('Sammlung erstellen', { exact: true }).click();
    await page.getByLabel('Name der Sammlung', { exact: true }).fill('Projektfavoriten');
    await page.getByLabel('Titel enthält', { exact: true }).fill('Projekt');
    await page.getByLabel('Nur Favoriten', { exact: true }).check();
    await picture('sammlungsregeln'); await page.getByRole('button', { name: 'Sammlung speichern', exact: true }).click();
    check(`${width}: dynamische Sammlung filtert echte Dokumente`, (await page.locator('[data-orte]').first().innerText()).includes('Projektfavoriten') &&
      await page.evaluate(() => Bibliothek.suchBereich()?.passt(Object.values<any>(Store.cache.blocks).find(p => p.text === 'Projekt Architektur'))) &&
      !await page.evaluate(id => Bibliothek.suchBereich()?.passt(Store.getBlock(id)), ids.canvas));
    const collectionRoundtrip = await page.evaluate(async () => {
      const data = JSON.parse(await Store.exportAll()); return JSON.stringify(data).includes('Projektfavoriten');
    }); check(`${width}: Sammlungsregeln sind in der Sicherung`, collectionRoundtrip);
    await picture('sammlung');
    const backup = await page.evaluate(async (pageId: string) => {
      const before = JSON.stringify(Store.getBlock(pageId).shapes), rules = JSON.stringify(Store.getMeta('bibliothek:dynamic-collections'));
      const packet = await App.sicherungPaketBauen(), zip = await Einlesen.zipLesenAusBlob(packet.blob);
      const data = await zip.text('daten.json');
      await Store.importAll(data, 'ersetzen');
      return { archive: packet.art, objects: JSON.stringify(Store.getBlock(pageId).shapes) === before,
        rules: JSON.stringify(Store.getMeta('bibliothek:dynamic-collections')) === rules };
    }, ids.canvas);
    check(`${width}: vollständiges .redion bewahrt neue Felder und Regeln`, backup.archive === 'redion' && backup.objects && backup.rules);
    check(`${width}: keine Browserfehler`, !errors.length); await context.close();
  }
  console.log(`${checks} Zusagen erfüllt`);
} finally { await browser.close(); }
