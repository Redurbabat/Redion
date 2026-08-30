/* Suite 266 — Das Abdeckband: zudecken, antippen, wissen (E266)
 * ============================================================================
 * Der eine wirklich fehlende Active-Recall-Baustein aus Redurs GoodNotes-
 * Dossier: eine deckende Fläche über Formeln und Lösungen, die sich beim
 * Lernen per Tipp öffnet und schliesst — ohne je in die Ablage zu
 * schreiben. Gespeichert ist IMMER „zugedeckt".
 *
 * §1 DAS WERKZEUG steht mit WORT in der Blatt-Leiste (§38).
 * §2 ZIEHEN legt eine abdeck-Marke an — als DECKENDE Fläche (Füllung!).
 * §3 TIPP im Schreiben-Modus deckt auf, zweiter Tipp zu — und die
 *    Ablage bleibt dabei UNBERÜHRT (kein Schreiben beim Lernen).
 * §4 NEU GELADEN ist wieder alles zu — die ehrliche Vorgabe.
 * §5 RADIERER entfernt das Band wie jede Marke.
 * §6 DER EINE ZEICHNER (Druck, Folien, Miniaturen) zeigt zugedeckt.
 * §7 BAU-HYGIENE: erzeugte Dateien, Menüband, sw-Fassung, Einzeldatei.
 *
 *   node pruefungen/lauf/test266.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Marken: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9045;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
const startbereit = async (): Promise<void> => {
  await seite.waitForFunction(() => typeof Store !== 'undefined' &&
    typeof App !== 'undefined' && typeof (window as any).Marken !== 'undefined',
    null, { timeout: 30000 });
  await seite.waitForTimeout(1100);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
  });
};
await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();

/* Ein Blatt auf einer NORMALEN Seite — dieselbe Marken-Schicht wie im
   Dokumentmodus und auf der PDF-Seite (E103), nur ohne Drumherum. */
const seiteId = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Lernblatt' });
  const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'liniert' });
  Store.addBlock(blatt.id, 'text', { text: 'U = R · I  — die Antwort steht hier' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForTimeout(900);

console.log('\n1 · Das Werkzeug steht mit Wort in der Leiste (§38)');
p('„Abdecken" steht als Knopf zwischen den Zeichenwerkzeugen',
  await seite.evaluate(() => {
    const knopf = document.querySelector('.blatt-werk [data-wz="abdeck"]');
    return !!knopf && (knopf.textContent || '').includes('Abdecken');
  }));

console.log('\n2 · Ziehen legt eine DECKENDE Fläche an');
await seite.locator('.blatt-werk [data-wz="abdeck"]').click();
const flaecheBox = await seite.locator('.blatt-marken').boundingBox();
if (!flaecheBox) throw new Error('Keine Zeichenfläche gefunden.');
const x1 = flaecheBox.x + flaecheBox.width * 0.2;
const y1 = flaecheBox.y + flaecheBox.height * 0.1;
await seite.mouse.move(x1, y1);
await seite.mouse.down();
await seite.mouse.move(x1 + 180, y1 + 46, { steps: 4 });
await seite.mouse.up();
await seite.waitForTimeout(400);
const band = await seite.evaluate((id: string) => {
  const blatt = Store.childrenOf(id).find((k: any) => k.type === 'blatt');
  const marke = (blatt?.marken || []).find((m: any) => m.art === 'abdeck');
  const knoten = document.querySelector<SVGElement>('[data-ink-art="abdeck"]');
  return {
    gespeichert: !!marke, punkte: marke?.pts?.length,
    gefuellt: !!knoten && knoten.getAttribute('fill') !== 'none' &&
      !!knoten.getAttribute('fill'),
    zu: !!knoten && !knoten.hasAttribute('data-auf')
  };
}, seiteId);
p('Die Marke liegt in der Ablage und ihr Knoten ist GEFÜLLT — keine leere Kontur',
  (band as any).gespeichert && (band as any).punkte === 2 &&
  (band as any).gefuellt && (band as any).zu, JSON.stringify(band));

console.log('\n3 · Tipp im Schreiben-Modus: auf, zu — und die Ablage schweigt');
await seite.locator('.blatt-werk [data-wz="schreiben"]').click();
await seite.waitForTimeout(200);
const vorher = await seite.evaluate((id: string) => {
  const blatt = Store.childrenOf(id).find((k: any) => k.type === 'blatt');
  return { marken: JSON.stringify(blatt?.marken || []), edited: blatt?.edited };
}, seiteId);
const bandBox = await seite.locator('[data-ink-art="abdeck"]').boundingBox();
if (!bandBox) throw new Error('Kein Band auf der Fläche.');
await seite.mouse.click(bandBox.x + bandBox.width / 2, bandBox.y + bandBox.height / 2);
await seite.waitForTimeout(250);
p('Erster Tipp deckt auf (data-auf steht, die Antwort ist lesbar)',
  await seite.evaluate(() =>
    document.querySelector('[data-ink-art="abdeck"]')?.getAttribute('data-auf') === '1'));
await seite.mouse.click(bandBox.x + bandBox.width / 2, bandBox.y + bandBox.height / 2);
await seite.waitForTimeout(250);
p('Zweiter Tipp deckt wieder zu',
  await seite.evaluate(() =>
    !document.querySelector('[data-ink-art="abdeck"]')?.hasAttribute('data-auf')));
p('Beides hat die Ablage NICHT angefasst — Marken und edited unverändert',
  await seite.evaluate((a: any) => {
    const blatt = Store.childrenOf(a.id).find((k: any) => k.type === 'blatt');
    return JSON.stringify(blatt?.marken || []) === a.marken && blatt?.edited === a.edited;
  }, { id: seiteId, marken: (vorher as any).marken, edited: (vorher as any).edited }));

console.log('\n4 · Neu geladen ist wieder alles zu');
await seite.evaluate(() => {
  const knoten = document.querySelector('[data-ink-art="abdeck"]');
  knoten?.setAttribute('data-auf', '1');   /* absichtlich offen lassen … */
});
await seite.reload();
await startbereit();
await seite.evaluate((id: string) => App.oeffne(id), seiteId);
await seite.waitForTimeout(900);
p('… und nach dem Neuladen ist das Band trotzdem zu (gespeichert ist „zugedeckt")',
  await seite.evaluate(() => {
    const knoten = document.querySelector('[data-ink-art="abdeck"]');
    return !!knoten && !knoten.hasAttribute('data-auf');
  }));

console.log('\n5 · Der Radierer nimmt das Band wie jede Marke');
await seite.locator('.blatt-werk [data-wz="radierer"]').click();
const bandBox2 = await seite.locator('[data-ink-art="abdeck"]').boundingBox();
if (!bandBox2) throw new Error('Kein Band nach dem Neuladen.');
await seite.mouse.click(bandBox2.x + bandBox2.width / 2, bandBox2.y + bandBox2.height / 2);
await seite.waitForTimeout(400);
p('Weg aus Bild und Ablage',
  await seite.evaluate((id: string) => {
    const blatt = Store.childrenOf(id).find((k: any) => k.type === 'blatt');
    return !document.querySelector('[data-ink-art="abdeck"]') &&
      !(blatt?.marken || []).some((m: any) => m.art === 'abdeck');
  }, seiteId));

console.log('\n6 · Der EINE Zeichner zeigt zugedeckt (Druck, Folien, Miniaturen)');
p('Marken.zeichneMarke liefert das Band gefüllt und OHNE Aufdeck-Marke',
  await seite.evaluate(() => {
    const knoten = (window as any).Marken.zeichneMarke(
      { id: 'probe', art: 'abdeck', farbe: '#123456', pts: [[10, 10], [90, 42]] });
    return !!knoten && knoten.tagName.toLowerCase() === 'rect' &&
      knoten.getAttribute('fill') === '#123456' &&
      !knoten.hasAttribute('data-auf') &&
      Number(knoten.getAttribute('rx')) > 0;
  }));

console.log('\n7 · Bau-Hygiene');
const markenJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/marken.js'), 'utf8');
const bandJs = fs.readFileSync(path.join(WURZEL, 'quell/register/menueband.js'), 'utf8');
const swJs = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
const swQuelle = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const fassung = /VERSION = '([^']+)'/.exec(swQuelle)?.[1] || '';
/* Ob die .js wirklich Erzeugnisse ihrer .ts sind, wacht test105 für das
   ganze Verzeichnis — hier zählt nur: das neue Werkzeug ist angekommen.
   `data-wz="abdeck"` entsteht erst zur Laufzeit aus `${tool}` und stünde
   in keiner Datei; gesucht wird das Literal der Werkzeug-Kennung. */
p('marken.js und menueband.js kennen das Abdecken',
  markenJs.includes("'abdeck'") && bandJs.includes("'abdeck'"));
p('sw.js trägt die Fassung seiner Quelle',
  !!fassung && swJs.includes(`'${fassung}'`));
p('Die Einzeldatei kennt das Abdeckband',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes("'abdeck'"));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
