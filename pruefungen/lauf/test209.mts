/* Suite 175 — Das Whiteboard ist eine Fläche, kein Fenster (E138, Auftrag §22)
 * ============================================================================
 * Bis E138 war das Whiteboard genau so gross wie sein Kasten. Was rechts
 * hinausging, war nicht „weiter draussen" — es war weg. Man konnte es nicht
 * schieben, nicht kleiner machen, nicht wiederfinden. §22 des Auftrags
 * verlangt „freie Fläche" mit „Zoom/Pan", „Verbindungen" und einen eigenen
 * Top-Level-Arbeitsbereich.
 *
 * Diese Suite prüft die drei Dinge, die dabei schiefgehen KÖNNEN:
 *
 *   1. Der Ausschnitt wird gezeichnet, aber die Maus rechnet noch in
 *      Bildschirmpixeln. Dann sieht alles richtig aus, bis man einmal
 *      geschoben hat — und danach landet jeder Strich woanders.
 *   2. Der Ausschnitt wird nicht gespeichert. Dann ist nach dem Neuladen
 *      wieder alles bei 0/0, und die Zeichnung „ist weg".
 *   3. Eine Verbindung merkt sich Koordinaten statt Formen. Dann bleibt der
 *      Pfeil liegen, sobald man die Form verschiebt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Jede Behebung einzeln zurückgenommen und nachgemessen — die Zahlen stehen
 * beim jeweiligen Abschnitt.
 *
 *   node pruefungen/lauf/test209.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8968;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
const aufraeumen = async (): Promise<void> => {
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  });
};
await aufraeumen();

/** Der Ausschnitt, wie er im SVG steht: x, y, Breite, Höhe. */
const feld = (): Promise<number[]> => seite.evaluate(() =>
  ((document.querySelector('.wb-flaeche') as SVGSVGElement | null)
    ?.getAttribute('viewBox') || '').split(/\s+/).map(Number));

/** Die Mitte der Fläche in Bildschirmkoordinaten. */
const mitte = async (): Promise<{ x: number; y: number }> => {
  const kasten = await seite.locator('.wb-flaeche').boundingBox();
  if (!kasten) throw new Error('Die Zeichenfläche steht nicht im Bild.');
  return { x: kasten.x + kasten.width / 2, y: kasten.y + kasten.height / 2 };
};

const werkzeug = (name: string): Promise<void> =>
  seite.locator(`.wb-tools [data-wz="${name}"]`).click();

const formen = (id: string): Promise<any[]> => seite.evaluate(
  (blockId: string) => (Store.getBlock(blockId)?.shapes || []) as any[], id);

/* ==========================================================================
 * §1 · Die Fläche hat einen Ausschnitt und sagt ihren Massstab
 * --------------------------------------------------------------------------
 * Gegenprobe: ohne das `viewBox` in `male()` kommt hier ein leeres Feld
 * zurück — gemessen `[NaN]` statt `[0, 0, …]`, und alle folgenden
 * Abschnitte fallen mit.
 * ========================================================================*/
console.log('\n1 · Die Fläche hat einen Ausschnitt und sagt ihren Massstab');

const gebaut = await seite.evaluate(async () => {
  const page = Store.addPage(null, { text: 'Skizzenfläche', icon: '🖍' });
  const block = Store.addBlock(page.id, 'whiteboard', { text: 'Projektskizze' });
  await Store.flush();
  App.oeffne(page.id);
  await new Promise(r => setTimeout(r, 700));
  return { seite: page.id, block: block.id };
});
await seite.waitForTimeout(400);

const start = await feld();
gleich('Der Ausschnitt beginnt bei 0/0', [start[0], start[1]], [0, 0]);
p('Und ist so breit wie der Kasten', Number(start[2]) > 300, `${start[2]} Einheiten`);
gleich('Der Massstab steht auf 100 %',
  (await seite.locator('.wb-massstab').textContent())?.trim(), '100 %');

/* ==========================================================================
 * §2 · Schieben bewegt den Ausschnitt — und überlebt das Neuladen
 * --------------------------------------------------------------------------
 * Gegenprobe: ohne `sichtSichern()` beim Loslassen steht nach dem Neuladen
 * wieder 0/0 da. Gemessen: vorher x=-240, nach dem Neuladen x=0.
 * ========================================================================*/
console.log('\n2 · Schieben bewegt den Ausschnitt — und überlebt das Neuladen');

await werkzeug('hand');
const m = await mitte();
await seite.mouse.move(m.x, m.y);
await seite.mouse.down();
await seite.mouse.move(m.x - 220, m.y - 90, { steps: 8 });
await seite.mouse.up();
await seite.waitForTimeout(250);

const geschoben = await feld();
p('Der Ausschnitt ist nach rechts gewandert', Number(geschoben[0]) > 150,
  `x = ${geschoben[0]}`);
p('Und nach unten', Number(geschoben[1]) > 50, `y = ${geschoben[1]}`);

await seite.reload();
await seite.waitForTimeout(2400);
await aufraeumen();
await seite.evaluate(async (ids: any) => {
  App.oeffne(ids.seite);
  await new Promise(r => setTimeout(r, 700));
}, gebaut);
await seite.waitForTimeout(400);

const nachNeustart = await feld();
p('Nach dem Neuladen steht der Ausschnitt wieder da, wo er war',
  Math.abs(Number(nachNeustart[0]) - Number(geschoben[0])) <= 2 &&
  Math.abs(Number(nachNeustart[1]) - Number(geschoben[1])) <= 2,
  `${JSON.stringify(nachNeustart.slice(0, 2))} statt ${JSON.stringify(geschoben.slice(0, 2))}`);

/* ==========================================================================
 * §3 · Gezeichnet wird da, wo der Zeiger ist — auch nach dem Schieben
 * --------------------------------------------------------------------------
 * DAS IST DER EIGENTLICHE FEHLER, den ein Ausschnitt einbauen kann. Ohne die
 * Umrechnung in `punkt()` stimmt das Bild bei 0/0 noch, und ab dem ersten
 * Schieben landet jeder Strich um genau den Schiebeweg daneben.
 *
 * Gegenprobe (Umrechnung entfernt): das Rechteck lag bei x=112 statt x=332 —
 * um 220 daneben, den Schiebeweg aus §2.
 * ========================================================================*/
console.log('\n3 · Gezeichnet wird da, wo der Zeiger ist — auch nach dem Schieben');

await werkzeug('rechteck');
const m2 = await mitte();
await seite.mouse.move(m2.x - 60, m2.y - 40);
await seite.mouse.down();
await seite.mouse.move(m2.x + 60, m2.y + 40, { steps: 6 });
await seite.mouse.up();
await seite.waitForTimeout(300);

const nachRechteck = await formen(gebaut.block);
const rechteck = nachRechteck.find(s => s.art === 'rechteck');
p('Das Rechteck ist gespeichert', !!rechteck);

const kasten = await seite.locator('.wb-flaeche').boundingBox();
const erwartetX = Math.round(Number(nachNeustart[0]) + (m2.x - 60 - (kasten?.x ?? 0)));
const erwartetY = Math.round(Number(nachNeustart[1]) + (m2.y - 40 - (kasten?.y ?? 0)));
p('Es liegt in Flächenkoordinaten, nicht in Bildschirmkoordinaten',
  Math.abs(Number(rechteck?.x) - erwartetX) <= 2 &&
  Math.abs(Number(rechteck?.y) - erwartetY) <= 2,
  `gespeichert ${rechteck?.x}/${rechteck?.y}, erwartet ${erwartetX}/${erwartetY}`);

/* ==========================================================================
 * §4 · Vergrössern und „alles ins Bild"
 * --------------------------------------------------------------------------
 * Gegenprobe ohne `massstab()`: der Prozentwert blieb bei 100 %, und die
 * Breite des Ausschnitts änderte sich nicht.
 * ========================================================================*/
console.log('\n4 · Vergrössern und „alles ins Bild"');

const vorZoom = await feld();
await seite.locator('.wb-tools [data-a="groesser"]').click();
await seite.waitForTimeout(200);
const nachZoom = await feld();
p('Der Ausschnitt wird schmaler, wenn man vergrössert',
  Number(nachZoom[2]) < Number(vorZoom[2]) - 20,
  `${vorZoom[2]} → ${nachZoom[2]}`);
gleich('Und der Massstab sagt es',
  (await seite.locator('.wb-massstab').textContent())?.trim(), '125 %');

/* Eine Form weit draussen — und der Knopf holt sie zurück. */
await seite.evaluate(async (ids: any) => {
  const block = Store.getBlock(ids.block);
  const shapes = [...(block.shapes || []), {
    id: 'weitweg1', art: 'notiz', x: 2600, y: 1800, w: 170, h: 110,
    farbe: '#ffa344', text: 'Ganz weit draussen'
  }];
  Store.updateBlock(ids.block, { shapes });
  await Store.flush();
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 600));
}, gebaut);
await seite.waitForTimeout(300);

await seite.locator('.wb-tools [data-a="passend"]').click();
await seite.waitForTimeout(250);
const passend = await feld();
p('„Alles ins Bild" umfasst die entfernte Haftnotiz',
  Number(passend[0]) + Number(passend[2]) >= 2770 &&
  Number(passend[1]) + Number(passend[3]) >= 1910,
  `Ausschnitt ${JSON.stringify(passend)}`);
p('… und dafür wird verkleinert', Number(passend[2]) > 2600,
  `Breite ${passend[2]}`);

/* ==========================================================================
 * §5 · Ein Bild liegt in der Dateiablage, nicht in den Formen
 * --------------------------------------------------------------------------
 * Der kurze Weg wäre eine Data-URL in `shapes` gewesen. Dann steckte das
 * ganze Bild in jedem Block, in jeder Sicherung und in jedem Versionsstand —
 * genau das, was §14 der Projektregeln verbietet.
 *
 * Diese Prüfung kann rot werden: sie sieht in die gespeicherte Form hinein
 * und verlangt eine Kennung statt Bilddaten.
 * ========================================================================*/
console.log('\n5 · Ein Bild liegt in der Dateiablage, nicht in den Formen');

const rotesBild = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHElEQVQoz2P8z8Dwn4GKgIm' +
  'BymDUwFEDRw0cNRAAaEwCAV9r8VMAAAAASUVORK5CYII=', 'base64');

await seite.evaluate(async (ids: any) => {
  App.oeffne(ids.seite);
  await new Promise(r => setTimeout(r, 700));
}, gebaut);
await seite.waitForTimeout(300);

const bildDatei = seite.waitForEvent('filechooser');
await werkzeug('bild');
const mBild = await mitte();
await seite.mouse.click(mBild.x - 200, mBild.y - 100);
const waehler = await bildDatei;
await waehler.setFiles({ name: 'skizze.png', mimeType: 'image/png', buffer: rotesBild });
await seite.waitForTimeout(1200);

const mitBild = await formen(gebaut.block);
const bildForm = mitBild.find(s => s.art === 'bild');
p('Die Bildform ist gespeichert', !!bildForm);
p('Sie trägt eine Dateikennung', !!bildForm?.dateiId, JSON.stringify(bildForm?.dateiId));
gleich('Und keine Bilddaten',
  JSON.stringify(bildForm || {}).includes('data:image'), false);

const ablage = await seite.evaluate(async (dateiId: string) => {
  const satz = await Store.dateiHolen(dateiId);
  const blob = await (globalThis as any).Dateien.alsBlob(dateiId);
  return { name: satz?.name || '', groesse: blob ? blob.size : 0, typ: satz?.typ || '' };
}, String(bildForm?.dateiId || ''));
gleich('Die Datei liegt unter ihrem echten Namen in der Ablage', ablage.name, 'skizze.png');
gleich('Mit ihrem Typ', ablage.typ, 'image/png');
gleich('Und byteweise vollständig', ablage.groesse, rotesBild.length);

const gezeichnet = await seite.evaluate(() => {
  const bild = document.querySelector('.wb-flaeche image');
  return { da: !!bild, quelle: (bild?.getAttribute('href') || '').slice(0, 5) };
});
p('Auf der Fläche steht ein Bild', gezeichnet.da);
gleich('Und es kommt aus der Ablage, nicht aus der Form', gezeichnet.quelle, 'blob:');

/* ==========================================================================
 * §6 · Verbindungen halten an den Formen, nicht an Koordinaten
 * --------------------------------------------------------------------------
 * Gegenprobe: eine Verbindung mit festen x/y statt `von`/`nach` bleibt beim
 * Verschieben liegen. Gemessen: der Pfad blieb Zeichen für Zeichen derselbe,
 * obwohl die Haftnotiz 300 Einheiten weiter stand.
 * ========================================================================*/
console.log('\n6 · Verbindungen halten an den Formen, nicht an Koordinaten');

await seite.evaluate(async (ids: any) => {
  Store.updateBlock(ids.block, {
    sicht: { x: 0, y: 0, z: 1 },
    shapes: [
      { id: 'formA', art: 'notiz', x: 80, y: 80, w: 150, h: 100, farbe: '#529cca', text: 'A' },
      { id: 'formB', art: 'notiz', x: 460, y: 260, w: 150, h: 100, farbe: '#4dab9a', text: 'B' }
    ]
  });
  await Store.flush();
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 600));
}, gebaut);
await seite.waitForTimeout(300);

await werkzeug('verbindung');
const kasten2 = await seite.locator('.wb-flaeche').boundingBox();
const auf = async (x: number, y: number): Promise<void> => {
  await seite.mouse.move((kasten2?.x ?? 0) + x, (kasten2?.y ?? 0) + y);
  await seite.mouse.down();
  await seite.mouse.up();
  await seite.waitForTimeout(160);
};
await auf(155, 130);
await auf(535, 310);
await seite.waitForTimeout(250);

const mitVerbindung = await formen(gebaut.block);
const verbindung = mitVerbindung.find(s => s.art === 'verbindung');
p('Die Verbindung ist gespeichert', !!verbindung);
gleich('Sie merkt sich die zwei Formen, nicht zwei Punkte',
  [verbindung?.von, verbindung?.nach], ['formA', 'formB']);

const pfadVorher = await seite.evaluate(() =>
  document.querySelector('.wb-flaeche path[stroke-dasharray]')?.getAttribute('d') || '');
p('Und sie wird gezeichnet', /^M[\d.]+ [\d.]+ L/.test(pfadVorher), pfadVorher);

/* Form B verschieben — der Pfad muss mitgehen. */
await werkzeug('zeiger');
await seite.mouse.move((kasten2?.x ?? 0) + 535, (kasten2?.y ?? 0) + 310);
await seite.mouse.down();
await seite.mouse.move((kasten2?.x ?? 0) + 735, (kasten2?.y ?? 0) + 410, { steps: 8 });
await seite.mouse.up();
await seite.waitForTimeout(300);

const pfadNachher = await seite.evaluate(() =>
  document.querySelector('.wb-flaeche path[stroke-dasharray]')?.getAttribute('d') || '');
p('Nach dem Verschieben zeigt die Verbindung woandershin',
  !!pfadNachher && pfadNachher !== pfadVorher, `${pfadVorher} → ${pfadNachher}`);

/* Radieren nimmt die Verbindung mit. */
await werkzeug('radierer');
await seite.mouse.click((kasten2?.x ?? 0) + 155, (kasten2?.y ?? 0) + 130);
await seite.waitForTimeout(300);
const nachRadierer = await formen(gebaut.block);
gleich('Wird eine Form radiert, geht ihre Verbindung mit',
  nachRadierer.filter(s => s.art === 'verbindung').length, 0);
gleich('Und die andere Form bleibt stehen',
  nachRadierer.filter(s => s.art === 'notiz').length, 1);

/* ==========================================================================
 * §7 · Whiteboards sind ein eigener Bereich im Workspace
 * --------------------------------------------------------------------------
 * Gegenprobe ohne den Reiter: „Whiteboards" kam im Workspace gar nicht vor
 * (0 Treffer), und die Fläche war nur über die Seite zu finden, auf der sie
 * zufällig liegt.
 * ========================================================================*/
console.log('\n7 · Whiteboards sind ein eigener Bereich im Workspace');

const bereich = await seite.evaluate(async () => {
  (globalThis as any).Produktwelten.whiteboards();
  await new Promise(r => setTimeout(r, 900));
  const wurzel = document.querySelector('.arbeitswelt');
  return {
    /* NUR DIE NAVIGATION, nicht jeder Knopf mit `data-aw-section`. Die
       Zählerkarte auf der Übersicht trägt dieselbe Kennung und dasselbe
       Wort — bei der Gegenprobe ohne Reiter blieb die Zeile deshalb grün,
       obwohl der Bereich fehlte. Eine Prüfung, die den Fehler nicht sieht,
       den sie prüfen soll, ist keine (§55.2). */
    reiter: [...document.querySelectorAll<HTMLElement>('.arbeitswelt .aw-navigation [data-aw-section]')]
      .map(k => (k.textContent || '').replace(/\s+/g, ' ').trim()),
    karten: document.querySelectorAll('.arbeitswelt .aw-board').length,
    bilder: document.querySelectorAll('.arbeitswelt .aw-board-bild').length,
    text: (wurzel?.textContent || '').replace(/\s+/g, ' ').trim(),
    hash: location.hash
  };
});
p('Der Workspace hat einen Reiter „Whiteboards"',
  bereich.reiter.some(t => /Whiteboards/.test(t)), bereich.reiter.join(' | '));
p('Die angelegte Fläche steht darin', bereich.karten >= 1, `${bereich.karten} Karten`);
p('Mit einer Miniatur ihrer Formen', bereich.bilder >= 1, `${bereich.bilder} Bilder`);
p('Und ihr Name steht dabei', /Projektskizze/.test(bereich.text));
gleich('Die Adresse merkt sich den Bereich', bereich.hash, '#welt-workspace-whiteboards');

/* Der Weg zurück über die Adresse — ohne Klick. */
const ueberRoute = await seite.evaluate(async () => {
  (globalThis as any).Produktwelten.lernen('heute');
  await new Promise(r => setTimeout(r, 600));
  const treffer = (globalThis as any).Produktwelten.routeAusHash('#welt-workspace-whiteboards');
  (globalThis as any).Produktwelten.routeOeffnen(treffer);
  await new Promise(r => setTimeout(r, 900));
  return document.querySelectorAll('.arbeitswelt .aw-board').length;
});
p('Und die Adresse führt wieder dorthin', ueberRoute >= 1, `${ueberRoute} Karten`);

/* ==========================================================================
 * §8 · „Neues Whiteboard" legt wirklich eines an
 * ========================================================================*/
console.log('\n8 · „Neues Whiteboard" legt wirklich eines an');

const vorher = await seite.evaluate(() => Object.values<any>(Store.cache.blocks)
  .filter(b => b.type === 'whiteboard' && b.alive !== false).length);
await seite.locator('.arbeitswelt [data-aw-action="new-whiteboard"]').first().click();
await seite.waitForTimeout(900);
const danach = await seite.evaluate(() => ({
  flaechen: Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'whiteboard' && b.alive !== false).length,
  offen: !!document.querySelector('.wb-flaeche')
}));
gleich('Es ist genau eine Fläche dazugekommen', danach.flaechen, vorher + 1);
p('Und sie ist gleich offen', danach.offen);

/* ==========================================================================
 * §9 · Am Telefon läuft nichts über
 * ========================================================================*/
console.log('\n9 · Am Telefon läuft nichts über');

const handy = await browser.newPage({
  viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3
});
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2600);
await handy.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});
/* DIE TELEFONSEITE IST EIN EIGENER BROWSERKONTEXT — und damit eine eigene
   IndexedDB. `browser.newPage()` erzeugt in Playwright jedes Mal einen neuen
   Kontext; die Flächen von oben sind hier schlicht nicht da.
   Gemessen, bevor das hier stand: `Store.cache.blocks` enthielt null
   Whiteboards, und die Prüfung meldete einen Produktfehler, den es nicht
   gab. Der Abschnitt legt seine Fläche deshalb selbst an. */
await handy.evaluate(async () => {
  const page = Store.addPage(null, { text: 'Telefonskizze', icon: '🖍' });
  Store.addBlock(page.id, 'whiteboard', {
    text: 'Skizze am Telefon',
    shapes: [{ id: 'h1', art: 'notiz', x: 60, y: 60, w: 150, h: 100,
               farbe: '#529cca', text: 'Am Telefon' }]
  });
  await Store.flush();
});
const amHandy = await handy.evaluate(async () => {
  (globalThis as any).Produktwelten.whiteboards();
  await new Promise(r => setTimeout(r, 1000));
  const karten = document.querySelectorAll('.arbeitswelt .aw-board').length;
  const raus = [...document.querySelectorAll<HTMLElement>('.arbeitswelt .aw-board')]
    .filter(k => k.getBoundingClientRect().right > innerWidth + 1).length;
  return { karten, raus, ueberlauf: document.documentElement.scrollWidth - innerWidth };
});
p('Auch am Telefon stehen die Flächen da', amHandy.karten >= 1, `${amHandy.karten}`);
gleich('Keine Karte ragt hinaus', amHandy.raus, 0);
p('Und die Seite läuft nicht seitlich über', amHandy.ueberlauf <= 1,
  `${amHandy.ueberlauf} px`);

const leiste = await handy.evaluate(async () => {
  const seiten = Object.values<any>(Store.cache.blocks)
    .find((b: any) => b.type === 'whiteboard' && b.alive !== false);
  if (!seiten) return { knoepfe: 0, raus: 1 };
  App.oeffne(seiten.parentId);
  await new Promise(r => setTimeout(r, 800));
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.wb-tools button')];
  return {
    knoepfe: knoepfe.length,
    raus: knoepfe.filter(k => k.getBoundingClientRect().right > innerWidth + 1).length
  };
});
p('Die Werkzeugleiste ist vollständig da', leiste.knoepfe >= 18, `${leiste.knoepfe} Knöpfe`);
gleich('Und kein Werkzeug steht ausserhalb des Bildes', leiste.raus, 0);

/* ==========================================================================
 * §10 · Zurück, Vorwärts, Schreiben und Grösse ändern (E144, L54)
 * --------------------------------------------------------------------------
 * Drei Dinge, die L54 als fehlend festgehalten hat:
 *
 *   · `↶` war `daten.pop()` — es nahm die zuletzt ANGEHÄNGTE Form weg, egal
 *     was zuletzt geschehen war. Ein Verschieben liess sich nicht
 *     zurücknehmen, ein Radieren auch nicht.
 *   · Der Text einer Haftnotiz kam aus `prompt()`: ein Fenster in der Mitte
 *     des Bildschirms, das nicht sagt, wohin der Text kommt.
 *   · Eine zu klein gezogene Form musste man löschen und neu ziehen.
 *
 * Gegenproben: ohne den Stapel bleibt `↶` gesperrt und der verschobene
 * Kasten liegt weiter am neuen Ort; ohne `groessenFaehig` gibt es keinen
 * Griff und das Ziehen an der Ecke verschiebt statt zu vergrössern.
 * ========================================================================*/
console.log('\n10 · Zurück, Vorwärts, Schreiben und Grösse ändern');

const stand = await seite.evaluate(async (ids: any) => {
  /* ZURÜCK AUF DIE EIGENE SEITE. §8 hat über „Neues Whiteboard" eine ZWEITE
     Fläche angelegt und geöffnet — die sichtbare `.wb-flaeche` gehört seither
     ihr. Ohne diese Zeile schrieb der Abschnitt seine Formen in den einen
     Block und klickte auf den anderen; gemessen blieb `x` bei 60, weil die
     Maus über einer leeren Fläche zog. */
  App.oeffne(ids.seite);
  await new Promise(r => setTimeout(r, 600));
  Store.updateBlock(ids.block, {
    sicht: { x: 0, y: 0, z: 1 },
    shapes: [{ id: 'r1', art: 'rechteck', x: 60, y: 60, w: 180, h: 120, farbe: '#529cca' }]
  });
  await Store.flush();
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
  const zurueck = document.querySelector('.wb-tools [data-a="zurueck"]') as HTMLButtonElement | null;
  const vor = document.querySelector('.wb-tools [data-a="vor"]') as HTMLButtonElement | null;
  return { zurueckGesperrt: !!zurueck?.disabled, vorGesperrt: !!vor?.disabled, beideDa: !!zurueck && !!vor };
}, gebaut);
p('Es gibt einen Weg zurück und einen vorwärts', stand.beideDa);
gleich('Am Anfang sind beide gesperrt',
  [stand.zurueckGesperrt, stand.vorGesperrt], [true, true]);

/* Verschieben, dann zurücknehmen — genau der Fall, den `daten.pop()` nicht konnte. */
await werkzeug('zeiger');
const kasten3 = await seite.locator('.wb-flaeche').boundingBox();
const beiFlaeche = async (x: number, y: number, zx: number, zy: number): Promise<void> => {
  await seite.mouse.move((kasten3?.x ?? 0) + x, (kasten3?.y ?? 0) + y);
  await seite.mouse.down();
  await seite.mouse.move((kasten3?.x ?? 0) + zx, (kasten3?.y ?? 0) + zy, { steps: 8 });
  await seite.mouse.up();
  await seite.waitForTimeout(260);
};
await beiFlaeche(150, 120, 350, 320);

const verschoben = (await formen(gebaut.block))[0];
p('Der Kasten ist verschoben', Number(verschoben?.x) > 200,
  `x = ${verschoben?.x}`);

await seite.locator('.wb-tools [data-a="zurueck"]').click();
await seite.waitForTimeout(300);
const zurueckgenommen = (await formen(gebaut.block))[0];
gleich('Ein Schritt zurück stellt die alte Stelle wieder her',
  [Number(zurueckgenommen?.x), Number(zurueckgenommen?.y)], [60, 60]);
gleich('Und die Form ist noch da', (await formen(gebaut.block)).length, 1);

await seite.locator('.wb-tools [data-a="vor"]').click();
await seite.waitForTimeout(300);
const wieder = (await formen(gebaut.block))[0];
p('Vorwärts holt die Verschiebung zurück', Number(wieder?.x) > 200,
  `x = ${wieder?.x}`);

/* Radieren und zurücknehmen — der zweite Fall, den `pop()` nicht konnte. */
await werkzeug('radierer');
await seite.mouse.click((kasten3?.x ?? 0) + 350, (kasten3?.y ?? 0) + 320);
await seite.waitForTimeout(300);
gleich('Radieren nimmt die Form weg', (await formen(gebaut.block)).length, 0);
await seite.locator('.wb-tools [data-a="zurueck"]').click();
await seite.waitForTimeout(300);
gleich('Und ein Schritt zurück holt sie wieder', (await formen(gebaut.block)).length, 1);

/* Schreiben auf der Fläche statt im Browserfenster. */
let promptGerufen = 0;
await seite.exposeFunction('__promptGezaehlt', () => { promptGerufen++; });
await seite.evaluate(() => {
  const alt = window.prompt;
  (window as any).prompt = (...a: any[]) => { (window as any).__promptGezaehlt(); return alt.apply(window, a as any); };
});
await werkzeug('notiz');
await seite.mouse.click((kasten3?.x ?? 0) + 500, (kasten3?.y ?? 0) + 200);
await seite.waitForTimeout(400);
const feldDa = await seite.evaluate(() => {
  const feld = document.querySelector('.wb-eingabe') as HTMLTextAreaElement | null;
  if (!feld) return null;
  const kasten = feld.getBoundingClientRect();
  return { breit: Math.round(kasten.width), fokus: document.activeElement === feld };
});
p('Das Schreibfeld steht auf der Fläche', !!feldDa, 'keine .wb-eingabe');
p('Und hat gleich den Schreibzeiger', feldDa?.fokus === true, JSON.stringify(feldDa));
gleich('prompt() wurde dabei nicht gerufen', promptGerufen, 0);

await seite.keyboard.type('Nachgetragen am Montag');
await seite.keyboard.press('Control+Enter');
await seite.waitForTimeout(400);
const mitNotiz = await formen(gebaut.block);
p('Der getippte Text steht in der Haftnotiz',
  mitNotiz.some(s => s.art === 'notiz' && /Nachgetragen am Montag/.test(String(s.text || ''))),
  JSON.stringify(mitNotiz.map(s => s.text)));

/* Grösse ändern am Griff.
   VORHER ZURÜCK AUF EINEN BEKANNTEN PLATZ. Nach Verschieben, Zurück und
   Vorwärts lag das Rechteck bei 260/260 — seine rechte untere Ecke damit
   bei 440/380, und die Fläche ist genau 380 hoch. Der Zug begann also
   ausserhalb, und gemessen blieb die Grösse bei 180×120. */
await seite.evaluate(async (ids: any) => {
  const block = Store.getBlock(ids.block);
  const formen = (block.shapes || []).map((s: any) =>
    s.art === 'rechteck' ? { ...s, x: 60, y: 60, w: 180, h: 120 } : s);
  Store.updateBlock(ids.block, { shapes: formen });
  await Store.flush();
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 700));
}, gebaut);
await werkzeug('zeiger');
await seite.mouse.click((kasten3?.x ?? 0) + 150, (kasten3?.y ?? 0) + 120);
await seite.waitForTimeout(300);
const griffDa = await seite.evaluate(() =>
  document.querySelectorAll('.wb-flaeche .wb-griffpunkt').length);
gleich('Die angefasste Form bekommt einen Griff', griffDa, 1);

const vorherRahmen = (await formen(gebaut.block)).find(s => s.art === 'rechteck');
const eckeX = Number(vorherRahmen.x) + Number(vorherRahmen.w);
const eckeY = Number(vorherRahmen.y) + Number(vorherRahmen.h);
await beiFlaeche(eckeX, eckeY, eckeX + 120, eckeY + 90);
const nachherRahmen = (await formen(gebaut.block)).find(s => s.art === 'rechteck');
p('Ziehen am Griff macht die Form grösser',
  Number(nachherRahmen.w) > Number(vorherRahmen.w) + 80 &&
  Number(nachherRahmen.h) > Number(vorherRahmen.h) + 60,
  `${vorherRahmen.w}×${vorherRahmen.h} → ${nachherRahmen.w}×${nachherRahmen.h}`);
gleich('Und ihre linke obere Ecke bleibt, wo sie war',
  [Number(nachherRahmen.x), Number(nachherRahmen.y)],
  [Number(vorherRahmen.x), Number(vorherRahmen.y)]);

await seite.locator('.wb-tools [data-a="zurueck"]').click();
await seite.waitForTimeout(300);
const nachZurueck = (await formen(gebaut.block)).find(s => s.art === 'rechteck');
gleich('Auch das Vergrössern lässt sich zurücknehmen',
  [Number(nachZurueck.w), Number(nachZurueck.h)],
  [Number(vorherRahmen.w), Number(vorherRahmen.h)]);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
