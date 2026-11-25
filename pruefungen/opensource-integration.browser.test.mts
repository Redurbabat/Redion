
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { chromium, webkit } from 'playwright';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

declare const App: any;
declare const Store: any;
declare const Spreadsheet: any;
declare const PdfEinlesen: any;
declare const PdfFremd: any;
declare const Dateien: any;

test('Gedankenkarte tauscht Markdown aus und Tabellenfehler öffnen die richtige Zelle', { timeout: 45_000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 880 }, acceptDownloads: true });
    const laufzeitfehler: string[] = [];
    page.on('pageerror', error => laufzeitfehler.push(error.message));
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    const id = await page.evaluate(async () => {
      Store.setMeta('rundgangGesehen', true);
      Store.setMeta('neuerungenGesehen', 99);
      Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
      const seite = Store.addPage(null, { text: 'Austauschprüfung' });
      const mappe = Spreadsheet.neueMappe('Prüfung');
      const zweitesBlatt = Spreadsheet.neuesBlatt('Messwerte');
      Spreadsheet.setze(zweitesBlatt, 'C12', '=1/0');
      mappe.blaetter.push(zweitesBlatt);
      Store.addBlock(seite.id, 'spreadsheet', { text: 'Prüfung', mappe });
      const gk = Store.addBlock(seite.id, 'mindmap', { text: '' });
      const plan = Store.addBlock(seite.id, 'schaltplan', { text: 'Importprobe' });
      await Store.flush();
      App.zeichneBaum();
      App.oeffne(seite.id);
      return { mindmap: gk.id as string, plan: plan.id as string };
    });
    await page.waitForSelector('.gk [data-a="markdown"]');
    await page.locator('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .evaluateAll(elements => elements.forEach(element => element.remove()));

    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const dateiauswahl = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Markdown-Datei öffnen' }).click();
    await (await dateiauswahl).setFiles({
      name: 'Lernstoff.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Lernstoff\n- Vorbereitung\n  - Messwerte\n', 'utf8'),
    });
    await page.locator('.gk .gk-kn').filter({ hasText: 'Vorbereitung' }).waitFor();
    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Gliederung als Markdown speichern' }).click();
    const markdown = await download;
    assert.equal(markdown.suggestedFilename(), 'Redion-Gedankenkarte.md');
    assert.equal(await fs.readFile(await markdown.path() ?? '', 'utf8'), '# Lernstoff\n\n- Vorbereitung\n  - Messwerte\n');
    await page.locator('.gk [data-a="zurueck"]').click();
    assert.equal(await page.evaluate(blockId => Store.getBlock(blockId).karte.knoten.length, id.mindmap), 1);

    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const auswahl = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Beschriftungen aus Excalidraw öffnen' }).click();
    await (await auswahl).setFiles({ name: 'Tafel.excalidraw', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ type: 'excalidraw', elements: [
        { id: 't1', type: 'text', text: 'Schaltidee' }, { id: 't2', type: 'text', text: 'Testaufbau' }
      ] })) });
    await page.locator('.gk .gk-kn').filter({ hasText: 'Schaltidee' }).waitFor();
    await page.getByRole('button', { name: 'Markdown-Gliederung', exact: true }).click();
    const mermaid = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Als Mermaid-Diagramm speichern' }).click();
    const mermaidDatei = await mermaid;
    assert.equal(mermaidDatei.suggestedFilename(), 'Redion-Gedankenkarte.mmd');
    assert.match(await fs.readFile(await mermaidDatei.path() ?? '', 'utf8'), /flowchart TD[\s\S]*Schaltidee/);

    await page.locator('.tbl [data-a="mehr"]').click();
    await page.getByRole('button', { name: 'Formelfehler finden' }).click();
    await page.getByRole('button', { name: /Messwerte · C12 · #DIV\/0!/ }).click();
    await page.locator('.tbl .tbl-z[data-a="C12"].gewaehlt').waitFor();
    assert.equal(await page.locator('.tbl .tbl-z[data-a="C12"].gewaehlt').textContent(), '#DIV/0!');
    await page.locator('.sp-wrap [data-a="mehr"]').click();
    const schaltplanDatei = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Schematico-Schaltplan öffnen' }).click();
    await (await schaltplanDatei).setFiles({ name: 'Stromlauf.ems', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ type: 'ems', page: {
        title: 'Schalter und Meldeleuchte', pageType: 'schematic', connectionMode: 'explicit',
        components: [
          { id: 's', symbolId: 'contact_no', bmk: '-S1', x: 50, y: 50, rotation: 0 },
          { id: 'p', symbolId: 'pilot_lamp', bmk: '-P1', x: 200, y: 200, rotation: 0 }
        ],
        wires: [{ id: 'w1', from: { componentId: 's', pinId: '14' }, to: { componentId: 'p', pinId: 'X1' } }]
      } })) });
    await page.getByRole('button', { name: 'Blatt übernehmen', exact: true }).click();
    await page.waitForFunction(planId => Store.getBlock(planId).plan?.leitungen?.[0]?.vonNr === '4', id.plan);
    assert.equal(await page.evaluate(planId => Store.getBlock(planId).plan.teile.length, id.plan), 2);
    assert.deepEqual(laufzeitfehler, []);
  } finally {
    await browser.close();
  }
});

const require = createRequire(import.meta.url);
type TestPdfSeite = { node: { Contents(): { lookup(index: number): unknown } }; getRotation(): { angle: number } };
const pdfLib: {
  PDFDocument: {
    create(): Promise<{
      addPage(): { setSize(w: number, h: number): void; drawText(text: string): void };
      save(): Promise<Uint8Array>;
    }>;
    load(bytes: Uint8Array): Promise<{ getPages(): TestPdfSeite[] }>;
  };
  decodePDFRawStream(stream: unknown): { decode(): Uint8Array };
} = require('../quell/fremd/pdf-lib/library.js');

async function testePdfInhalt(bytes: number[]) {
  const doc = await pdfLib.PDFDocument.load(new Uint8Array(bytes));
  return doc.getPages().map(seite => {
    // Die synthetische PDF benutzt einfache ASCII-Textoperatoren.
    const strom = pdfLib.decodePDFRawStream(seite.node.Contents().lookup(0));
    const inhalt = new TextDecoder().decode(strom.decode());
    const text = [...inhalt.matchAll(/<([a-f0-9]+)> Tj/gi)]
      .map(treffer => Buffer.from(treffer[1] ?? '', 'hex').toString('ascii')).join('');
    return { text, rotation: seite.getRotation().angle };
  });
}

for (const profil of [
  { name: 'Windows-Breite', engine: chromium, width: 1280, quelle: '../index.html' },
  { name: 'iPhone-Breite und Offline-Einzeldatei', engine: webkit, width: 390, quelle: '../redion-einzeldatei.html' }
]) {
  // Die Einzeldatei wartet in WebKit auf die Initialisierung der lokalen Ablage.
  test('PDF-Originalseiten bedienen und Text erhalten · ' + profil.name, { timeout: profil.width < 500 ? 120_000 : 65_000 }, async () => {
    const quelle = await pdfLib.PDFDocument.create();
    const seite1 = quelle.addPage();
    seite1.setSize(400, 310);
    seite1.drawText('Redion Originaltext');
    const seite2 = quelle.addPage();
    seite2.setSize(500, 330);
    seite2.drawText('Redion Seite zwei');
    const bytes = [...await quelle.save()];
    const browser = await profil.engine.launch();
    const dateiUrl = new URL(profil.quelle, import.meta.url);
    const einzeldatei = profil.width < 500 ? await fs.readFile(dateiUrl) : null;
    const server = einzeldatei ? createServer((anfrage, antwort) => {
      if (anfrage.url !== '/') { antwort.writeHead(404).end(); return; }
      antwort.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(einzeldatei);
    }) : null;
    try {
      if (server) await new Promise<void>(fertig => server.listen(0, '127.0.0.1', fertig));
      const adresse = server ? 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/' : dateiUrl.href;
      const page = await browser.newPage({ viewport: { width: profil.width, height: 850 },
        acceptDownloads: true, reducedMotion: 'reduce', hasTouch: profil.width < 500 });
      const fehler: string[] = [];
      page.on('pageerror', error => fehler.push(error.message));
      await page.route(/^https?:\/\//, route => route.request().url() === adresse ? route.continue() : route.abort());
      await page.goto(adresse);
      await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
      await page.evaluate(async ({ inhalt, fixture }) => {
        Store.setMeta('rundgangGesehen', true);
        Store.setMeta('neuerungenGesehen', 99);
        Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
        const seite = Store.addPage(null, { text: 'Original-PDF', dokumentModus: true });
        const datei = new File([new Uint8Array(inhalt)], 'original.pdf', { type: 'application/pdf' });
        if (fixture) {
          const alsBlob = Dateien.alsBlob;
          Dateien.alsBlob = (id: string) => id === 'pdf-webkit-testquelle' ? Promise.resolve(datei) : alsBlob(id);
          Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 2,
            bw: 400, bh: 310, raumVersion: 1, quelleId: 'pdf-webkit-testquelle', marken: [] });
        } else {
          await PdfEinlesen.alsSeiten(datei, seite.id, { anordnung: 'untereinander' });
        }
        await Store.flush();
        App.zeichneBaum();
        App.oeffne(seite.id);
        document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      }, { inhalt: bytes, fixture: profil.width < 500 });
      await page.locator('.document-topbar [data-document-action="inspector"]').click();
      const aktion = page.getByRole('button', { name: 'Originalseiten als PDF kopieren', exact: true });
      await aktion.waitFor();
      assert.equal(await page.evaluate(() => 'PDFLib' in globalThis), false);
      await aktion.scrollIntoViewIfNeeded();
      const box = await aktion.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= profil.width + 1 && box.height >= 42);
      const capture = new URL('../node_modules/.cache/redion-pr220/', import.meta.url);
      await fs.mkdir(capture, { recursive: true });
      await page.screenshot({ path: fileURLToPath(new URL('pdf-details-' + profil.width + '.png', capture)) });
      await aktion.click();
      const feld = page.locator('[data-dialog-feld="frage"], .overlay input[type="text"]').filter({ visible: true });
      await feld.fill('2, 1');
      await feld.press('Enter');
      const herunterladen = page.waitForEvent('download');
      await page.getByRole('button', { name: '90° nach rechts drehen', exact: true }).click();
      const datei = await herunterladen;
      assert.match(datei.suggestedFilename(), /Originalseiten\.pdf$/);
      const kopie = [...await fs.readFile(await datei.path() ?? '')];
      const texte = profil.width < 500 ? await testePdfInhalt(kopie) : await page.evaluate(async inhalt => {
        const pdfjs = await PdfFremd.laden();
        const laden = pdfjs.getDocument({ data: new Uint8Array(inhalt), isEvalSupported: false });
        const doc = await laden.promise;
        try {
          const seiten = [];
          for (let nr = 1; nr <= doc.numPages; nr++) {
            const seite = await doc.getPage(nr);
            const { items } = await seite.getTextContent();
            seiten.push({ text: items.flatMap((i: { str?: string }) => i.str ?? []).join(''), rotation: seite.rotate });
          }
          return seiten;
        } finally { await laden.destroy(); }
      }, kopie);
      assert.deepEqual(texte, [
        { text: 'Redion Seite zwei', rotation: 90 },
        { text: 'Redion Originaltext', rotation: 90 }
      ]);
      assert.deepEqual(fehler, []);
    } finally {
      await browser.close();
      server?.closeAllConnections();
      if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
}
