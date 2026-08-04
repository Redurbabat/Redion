/* Suite 76 — Das Datenbankraster im Browser
 * ----------------------------------------------------------------------------
 * Die Rasteransicht ist dieselbe Datenbank mit der Bedienung eines
 * Tabellenprogramms. Vier Dinge müssen dabei stimmen, und drei davon kann
 * keine Prüfung ohne Browser sehen:
 *
 *   · **Getipptes landet wirklich in der Ablage.** Eine Ansicht, die Werte
 *     nur im DOM ändert, sieht beim Tippen richtig aus und ist beim nächsten
 *     Öffnen leer. Hier wird nach dem Tippen aus dem Speicher zurückgelesen.
 *
 *   · **Einfügen legt fehlende Zeilen an.** Wer dreissig Zeilen aus Excel
 *     einfügt und nur zehn Zeilen hat, verlöre sonst zwanzig — lautlos. Das
 *     ist der eigentliche Grund für diese Ansicht.
 *
 *   · **Gerechnete Spalten lassen sich nicht schreiben.** Formel, Rollup,
 *     „erstellt am": ein Wert von Hand hätte dort keine Wirkung, sähe aber
 *     aus, als hätte er eine.
 *
 *   · **Ein Zeitstempel wird gelesen, nicht gezeigt.** `created` kommt als
 *     `2026-08-04T17:57:39.184Z` zurück. Das ist ein gültiger Text, geht
 *     durch jede Typprüfung — und niemand liest es.
 *
 *   node pruefungen/lauf/test112.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as alsPfad } from 'node:url';
import { dirname as ordnerVon, resolve as loese, join as dazu } from 'node:path';
import { readFileSync as lies, existsSync as da } from 'node:fs';
import { createServer } from 'node:http';

const WURZEL: string = loese(ordnerVon(alsPfad(import.meta.url)), '../..');
const PORT = 8815;

let ok = 0, weg = 0;
const p = (n: string, b: boolean, extra: string = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = createServer((a, b) => {
  const rein = decodeURIComponent(String(a.url).split('?')[0] || '/');
  const pfad = dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(lies(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const browser = await chromium.launch();
const kontext = await browser.newContext();
const fehler: string[] = [];

const oeffne = async (): Promise<any> => {
  const s = await kontext.newPage();
  s.on('pageerror', (e: Error) => fehler.push(e.message));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  return s;
};

const seite = await oeffne();

/* ========================================================================= *
 * 0 · ANGESCHLOSSEN
 * ========================================================================= */
console.log('\n0 · Angeschlossen');

const da0 = await seite.evaluate(() => ({
  modul: typeof (window as any).DbRaster !== 'undefined',
  register: !!(window as any).Register?.ansichten?.kennt?.('raster'),
  name: (window as any).Register?.ansichten?.name?.('raster')
}));
p('DbRaster ist geladen', da0.modul);
p('„raster" steht im Ansichtsregister', da0.register);
gleich('… und heisst Raster', da0.name, 'Raster');

if (!da0.modul) {
  console.log(`\n  Suite 76 — Datenbankraster: ${ok} ok, ${weg + 1} offen`);
  await browser.close(); server.close(); process.exit(1);
}

/* Eine echte Datenbank anlegen — mit einer gerechneten Spalte dabei. */
const aufbau = await seite.evaluate(() => {
  const w = window as any;
  const seiteId = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  Store.addDatabase(seiteId.id, 'Prüfkunden', {
    title:  { name: 'Kunde',  type: 'title'  },
    umsatz: { name: 'Umsatz', type: 'number' },
    ort:    { name: 'Ort',    type: 'text'   },
    seit:   { name: 'Seit',   type: 'created' }
  }, 'raster');
  const coll = Object.values(Store.cache.collections).slice(-1)[0] as any;
  const view = Object.values(Store.cache.views).find((v: any) => v.collectionId === coll.id) as any;
  [['Meier AG', 100], ['Huber & Co', 200]].forEach(([n, u]: any) => {
    const r = Store.addRow(coll.id, {});
    Store.updateBlock(r.id, { text: n });
    Store.setProp(r.id, 'umsatz', u);
  });
  w.__coll = coll.id; w.__view = view.id;

  const kasten = document.createElement('div');
  kasten.id = 'pruef-raster';
  document.body.appendChild(kasten);
  kasten.appendChild(w.DbRaster.zeichne(coll, view, Store.rowsOf(coll.id)));
  const t = kasten.querySelector('.tbl') as HTMLElement;
  return {
    da: !!t,
    spalten: t.querySelectorAll('.tbl-sp').length,
    zeilen: t.querySelectorAll('.tbl-zeile').length,
    gesperrt: t.querySelectorAll('.tbl-sp.gerechnet').length,
    zelle00: (t.querySelector('[data-z="0"][data-s="0"]') as HTMLElement)?.textContent,
    zeitstempel: (t.querySelector('[data-z="0"][data-s="3"]') as HTMLElement)?.textContent,
    fuss: (t.querySelector('.tbl-fuss') as HTMLElement)?.textContent
  };
}) as any;

/* ========================================================================= *
 * 1 · DAS RASTER
 * ========================================================================= */
console.log('\n1 · Das Raster');
p('Es ist gezeichnet', aufbau.da);
gleich('Vier Spalten', aufbau.spalten, 4);
gleich('Zwei Zeilen', aufbau.zeilen, 2);
gleich('Eine davon ist als gerechnet gekennzeichnet', aufbau.gesperrt, 1);
gleich('Der Titel steht in der ersten Zelle', aufbau.zelle00, 'Meier AG');
p('Die Fusszeile zählt', aufbau.fuss.includes('2 Zeilen'), aufbau.fuss);

/* DER ZEITSTEMPEL. Er kommt als `2026-08-04T17:57:39.184Z` zurück — ein
   gültiger Text, der durch jede Typprüfung geht und den niemand liest. */
p('Ein Zeitstempel wird als Datum gezeigt, nicht als ISO-Kette',
  !/T\d\d:\d\d:\d\d/.test(aufbau.zeitstempel) && /\d{4}/.test(aufbau.zeitstempel),
  aufbau.zeitstempel);

/* ========================================================================= *
 * 2 · TIPPEN LANDET IN DER ABLAGE
 * ========================================================================= */
console.log('\n2 · Tippen');

const tippen = await seite.evaluate(async () => {
  const w = window as any;
  const t = document.querySelector('#pruef-raster .tbl') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  const zeile = t.querySelector('.tbl-eingabe') as HTMLInputElement;

  const waehle = (z: number, s: number) =>
    (t.querySelector(`[data-z="${z}"][data-s="${s}"]`) as HTMLElement)
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

  /* Über die Bearbeitungszeile: Umsatz von Zeile 1 auf 1,5 setzen. */
  waehle(0, 1);
  zeile.value = '1250,5';
  zeile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise(f => setTimeout(f, 30));

  const rows = Store.rowsOf(w.__coll);
  const ausAblage = (rows[0].props || {}).umsatz;

  /* Eine gerechnete Spalte darf sich nicht schreiben lassen. */
  waehle(0, 3);
  const gesperrtDeaktiviert = zeile.disabled;
  const vorher = rows[0].created;
  zeile.disabled = false;
  zeile.value = 'egal';
  zeile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise(f => setTimeout(f, 30));

  /* Tastatur */
  waehle(0, 0);
  const taste = async (key: string, opt: any = {}) => {
    feld.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opt }));
    await new Promise(f => setTimeout(f, 15));
  };
  await taste('ArrowRight'); await taste('ArrowDown');
  const wo = (t.querySelector('.tbl-z.gewaehlt') as HTMLElement);

  return {
    ausAblage,
    gesperrtDeaktiviert,
    createdUnveraendert: Store.rowsOf(w.__coll)[0].created === vorher,
    nachPfeilen: [wo?.dataset.z, wo?.dataset.s]
  };
}) as any;

/* Das deutsche Komma zählt mit: wer `1250,5` tippt, meint tausendzweihundert-
   fünfzig komma fünf. Landet dort Text, ist die Spaltensumme zu klein. */
gleich('Ein getippter Wert landet als Zahl in der Ablage', tippen.ausAblage, 1250.5);
p('Bei einer gerechneten Spalte ist die Eingabe gesperrt', tippen.gesperrtDeaktiviert);
p('… und sie lässt sich auch nicht heimlich überschreiben', tippen.createdUnveraendert);
gleich('Pfeiltasten bewegen die Auswahl', tippen.nachPfeilen, ['1', '1']);

/* ========================================================================= *
 * 3 · EINFÜGEN LEGT ZEILEN AN — der eigentliche Grund für diese Ansicht
 * ------------------------------------------------------------------------
 * Notion kann das nicht. Wer dreissig Zeilen aus Excel einfügt und zehn
 * Zeilen hat, verlöre zwanzig — und zwar lautlos.
 * ========================================================================= */
console.log('\n3 · Einfügen aus Excel');

const einfuegen = await seite.evaluate(async () => {
  const w = window as any;
  const t = document.querySelector('#pruef-raster .tbl') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  (t.querySelector('[data-z="0"][data-s="0"]') as HTMLElement)
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

  const vorher = Store.rowsOf(w.__coll).length;

  /* Vier Zeilen bei zwei vorhandenen — zwei müssen dazukommen. */
  const text = 'Alpha\t10\tBern\nBeta\t20\tChur\nGamma\t30\tSitten\nDelta\t40\tSion';
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  feld.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(f => setTimeout(f, 400));

  /* Die Frage bestätigen, falls sie erschienen ist. */
  const knopf = document.querySelector('.overlay [data-w="ja"]') as HTMLElement | null;
  if (knopf) knopf.click();
  await new Promise(f => setTimeout(f, 300));

  const rows = Store.rowsOf(w.__coll);
  return {
    vorher,
    nachher: rows.length,
    namen: rows.map((r: any) => r.text),
    zahlen: rows.map((r: any) => (r.props || {}).umsatz),
    orte: rows.map((r: any) => (r.props || {}).ort)
  };
}) as any;

gleich('Vorher zwei Zeilen', einfuegen.vorher, 2);
gleich('Nachher vier — zwei sind dazugekommen', einfuegen.nachher, 4);
gleich('Die Namen stehen alle da', einfuegen.namen, ['Alpha', 'Beta', 'Gamma', 'Delta']);
gleich('Die Zahlen sind Zahlen und nicht Text', einfuegen.zahlen, [10, 20, 30, 40]);
gleich('Und die dritte Spalte auch', einfuegen.orte, ['Bern', 'Chur', 'Sitten', 'Sion']);

/* ========================================================================= *
 * 4 · KOPIEREN GEHT NACH EXCEL ZURÜCK
 * ========================================================================= */
console.log('\n4 · Kopieren');

const kopiert = await seite.evaluate(async () => {
  const t = document.querySelector('#pruef-raster .tbl') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  (t.querySelector('[data-z="0"][data-s="0"]') as HTMLElement)
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  (t.querySelector('[data-z="1"][data-s="1"]') as HTMLElement)
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, shiftKey: true }));
  await new Promise(f => setTimeout(f, 40));

  const dt = new DataTransfer();
  feld.dispatchEvent(new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true }));
  return dt.getData('text/plain');
}) as string;

p('Zwei Zeilen × zwei Spalten kommen als Tabulatortext',
  kopiert.split('\n').length === 2 && kopiert.split('\n')[0]!.split('\t').length === 2,
  JSON.stringify(kopiert));
p('… mit den richtigen Werten darin',
  kopiert.includes('Alpha') && kopiert.includes('10'), JSON.stringify(kopiert));

/* ========================================================================= *
 * 5 · NACH DEM NEUSTART
 * ========================================================================= */
console.log('\n5 · Nach dem Neustart');

const collId = await seite.evaluate(() => (window as any).__coll);
const zweite = await oeffne();
const nachher = await zweite.evaluate((id: string) => {
  const rows = Store.rowsOf(id);
  return { anzahl: rows.length, namen: rows.map((r: any) => r.text),
           zahlen: rows.map((r: any) => (r.props || {}).umsatz),
           zeitstempel: rows.map((r: any) => r.created),
           folgen: rows.map((r: any) => r.folge) };
}, collId) as any;
/* ─── DER FUND, DEN NUR DER VOLLE LAUF BRACHTE ─────────────────────────────
 *
 * Einzeln lief diese Prüfung durch. Im vollen Lauf kamen die Zeilen als
 * `["Beta","Alpha","Delta","Gamma"]` zurück — paarweise vertauscht.
 *
 * Der Grund: `rowsOf` sortierte nach `created`, und das hat Millisekunden.
 * Vier Zeilen, die beim Einfügen in derselben Millisekunde entstehen, haben
 * denselben Zeitstempel und damit KEINE Reihenfolge. Beim nächsten Start
 * liefert IndexedDB sie anders, und die Tabelle steht vertauscht da.
 *
 * Von Hand passiert das nie. Beim Einfügen aus Excel, beim CSV-Import und
 * bei Vorlagen passiert es jedes Mal — also überall dort, wo viele Zeilen
 * auf einmal entstehen.
 *
 * Die Prüfung darunter zeigt, dass der Stichentscheid wirklich gebraucht
 * wird: die Zeitstempel sind gleich. Wäre das eines Tages nicht mehr so,
 * prüfte sie nichts mehr — und sagte es. */
p('Die Zeilen haben denselben Zeitstempel — der Stichentscheid arbeitet wirklich',
  new Set(nachher.zeitstempel).size < nachher.zeitstempel.length,
  JSON.stringify(nachher.zeitstempel));
p('… und jede hat eine Folge bekommen',
  nachher.folgen.every((f: unknown) => typeof f === 'number'),
  JSON.stringify(nachher.folgen));
gleich('Alle vier Zeilen sind noch da', nachher.anzahl, 4);
gleich('… mit ihren Namen', nachher.namen, ['Alpha', 'Beta', 'Gamma', 'Delta']);
gleich('… und ihren Zahlen', nachher.zahlen, [10, 20, 30, 40]);
await zweite.close();

/* ========================================================================= *
 * 6 · AM TELEFON
 * ========================================================================= */
console.log('\n6 · Am Telefon (390 px)');

const handy = await kontext.newPage();
handy.on('pageerror', (e: Error) => fehler.push(e.message));
await handy.setViewportSize({ width: 390, height: 844 });
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });

const amHandy = await handy.evaluate((id: string) => {
  const w = window as any;
  const coll = Store.getCollection(id);
  const view = Object.values(Store.cache.views).find((v: any) => v.collectionId === id) as any;
  const kasten = document.createElement('div');
  kasten.style.cssText = 'width:390px; position:fixed; left:0; top:0; z-index:99999';
  document.body.appendChild(kasten);
  kasten.appendChild(w.DbRaster.zeichne(coll, view, Store.rowsOf(id)));
  const t = kasten.querySelector('.tbl') as HTMLElement;
  const z = t.querySelector('.tbl-z') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  return {
    breite: t.getBoundingClientRect().width,
    zeilenhoehe: z.getBoundingClientRect().height,
    schrift: parseFloat(getComputedStyle(z).fontSize),
    rollt: feld.scrollWidth > feld.clientWidth
  };
}, collId) as any;

p('Der Block passt in 390 px', amHandy.breite <= 390.5, String(Math.round(amHandy.breite)));
p('Die Zeile ist am Finger hoch genug (≥ 38 px)',
  amHandy.zeilenhoehe >= 38, String(Math.round(amHandy.zeilenhoehe)));
gleich('Die Schrift ist 16 px', amHandy.schrift, 16);
p('Das Raster rollt waagerecht statt zu quetschen', amHandy.rollt);
await handy.close();

/* ========================================================================= *
 * 7 · DIE KONSOLE
 * ========================================================================= */
console.log('\n7 · Die Konsole');
p('Kein Skriptfehler auf keiner Seite', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n  Suite 76 — Datenbankraster: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
