/* Suite 100 — Die weiche Kante, wo es seitlich weitergeht (L10)
 * ============================================================================
 * DER FUND, und er kam von einem Bild, nicht aus dem Quelltext. Am Telefon,
 * 390 px breit, stand im Tabellenblock:
 *
 *     Spalte B          Spalte C
 *     1'450.00 CHF      1'45
 *     2'199.70 CHF      2'18
 *
 * Rechts ist nichts kaputt — die Tabelle geht dort weiter, und C2 enthält
 * sehr wohl `1'450.00 CHF`. Abgeschnitten hat sie der BILDRAND.
 *
 * Gefährlich ist die SCHARFE Kante. Sie liest sich als Ende der Zahl:
 * `1'45` ist eine gültige Zahl, nur eine andere. Für eine zu enge Zelle gibt
 * es seit jeher `###` — die Zelle weiss dann, dass ihr Inhalt nicht passt.
 * Am Bildrand weiss das niemand: die Zelle ist breit genug, nur der
 * Bildschirm ist es nicht.
 *
 * Derselbe Fund wie in CLAUDE.md §55.2, eine Ebene höher — und wieder einer,
 * den keine Prüfung hatte, weil beide Zahlen gültig sind.
 *
 * WAS DIESER LAUF PRÜFT
 *
 *   §1 misst die Lage: geht es rechts weiter, ist die Kante da; passt alles
 *   ins Bild, ist sie weg. Der zweite Teil ist der wichtigere — eine Kante
 *   an einer Tabelle, die ganz hineinpasst, wäre eine Behauptung, die nicht
 *   stimmt.
 *
 *   §2 rollt und sieht nach, ob die Kante mitwandert. Ein Pseudo-Element im
 *   Rollfeld täte das nicht: es rollte MIT dem Inhalt und wäre nach dem
 *   ersten Wisch weg. Deshalb eine Maske.
 *
 *   §3 ist die Gegenprobe zur Maske selbst: sie darf die stehenden Köpfe
 *   nicht kaputt machen. `position: sticky` in einem maskierten Rollfeld ist
 *   genau die Sorte Wechselwirkung, die man erst auf dem Bild sieht.
 *
 *   node pruefungen/lauf/test136.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8809;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
/* 390 px — die enge Probe aus `redion-mobile-ux`, und die Breite, bei der
   der Fund entstanden ist. */
const seite = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      hasTouch: true, isMobile: true });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/** Ein Tabellenblock mit `spalten` Spalten, gezeichnet in einen eigenen Kasten. */
const baue = (spalten: number) => seite.evaluate(async (n) => {
  const w = window as any;
  document.getElementById('pruef-rand')?.remove();
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  /* Seit E89 zeigt das Telefon standardmässig Karten; die weiche Kante
     gehört zum RASTER — also mit offenem Raster anlegen (⊞-Weg). */
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Randprobe', telefonRaster: true });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-rand';
  /* MIT BREITENGRENZE, wie die Inhaltsspalte der echten Seite.
     Ohne sie wächst der Block bis zur Breite seines Inhalts, das Rollfeld
     rollt gar nicht mehr — und die Kante wäre zu Recht weg. Der erste
     Ablauf mass genau diese Lage und meldete sieben rote Punkte für einen
     Zustand, den es in der App nicht gibt. Nachgemessen: dort ist der
     Block 334 px breit, das Feld rollt, und die Kante steht. */
  kasten.style.cssText = 'width:' + Math.min(innerWidth - 40, 900) + 'px; margin:0 20px';
  document.body.appendChild(kasten);
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));

  const b2 = Store.getBlock(blk.id);
  const blatt = b2.mappe.blaetter[0];
  blatt.spalten = n;
  for (let i = 0; i < n; i++)
    blatt.zellen[String.fromCharCode(65 + i) + '1'] = { wert: 1450 + i };
  Store.updateBlock(b2.id, { mappe: b2.mappe });
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 400));
  return blk.id as string;
}, spalten);

/** Wie das Rollfeld gerade aussieht. */
const lage = () => seite.evaluate(() => {
  const f = document.querySelector<HTMLElement>('#pruef-rand .tbl-feld');
  if (!f) return null;
  const st = getComputedStyle(f);
  return {
    rand: f.dataset['rand'] ?? '',
    maske: (st.maskImage && st.maskImage !== 'none') ? st.maskImage
         : (st.webkitMaskImage ?? 'none'),
    rollt: f.scrollWidth > f.clientWidth,
    scrollLinks: Math.round(f.scrollLeft),
    breite: Math.round(f.clientWidth),
    inhalt: Math.round(f.scrollWidth)
  };
});

console.log('\n1 · Die Kante steht da, wo es weitergeht — und nur dort');

await baue(9);
const eng = await lage();
p('Bei neun Spalten auf 390 px rollt das Feld', (eng as any)?.rollt === true,
  `${(eng as any)?.inhalt} in ${(eng as any)?.breite}`);
gleich('… und die Kante steht rechts', (eng as any)?.rand, 'rechts');
p('… als echte Maske, nicht nur als Attribut',
  String((eng as any)?.maske ?? '').includes('gradient'),
  String((eng as any)?.maske).slice(0, 90));

/* DER WICHTIGERE TEIL. Eine Kante an einer Tabelle, die ganz ins Bild
   passt, wäre eine Behauptung, die nicht stimmt. */
await baue(2);
const schmal = await lage();
p('Zwei Spalten passen ins Bild', (schmal as any)?.rollt === false,
  `${(schmal as any)?.inhalt} in ${(schmal as any)?.breite}`);
gleich('… und dann gibt es keine Kante', (schmal as any)?.rand, '');
p('… und auch keine Maske', String((schmal as any)?.maske ?? 'none') === 'none',
  String((schmal as any)?.maske));

console.log('\n2 · Beim Rollen wandert sie mit');
await baue(9);
const gerollt = await seite.evaluate(async () => {
  const f = document.querySelector<HTMLElement>('#pruef-rand .tbl-feld');
  if (!f) return null;
  const schritte: any[] = [];
  f.scrollLeft = 120;
  f.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  schritte.push({ wo: 'mitte', rand: f.dataset['rand'] ?? '' });
  f.scrollLeft = f.scrollWidth;
  f.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  schritte.push({ wo: 'ganz rechts', rand: f.dataset['rand'] ?? '' });
  f.scrollLeft = 0;
  f.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  schritte.push({ wo: 'zurück', rand: f.dataset['rand'] ?? '' });
  return schritte;
});
const schritt = (wo: string) => (gerollt as any[])?.find(x => x.wo === wo)?.rand;
gleich('In der Mitte auf beiden Seiten', schritt('mitte'), 'links rechts');
gleich('Ganz rechts nur noch links', schritt('ganz rechts'), 'links');
gleich('Und wieder ganz links nur rechts', schritt('zurück'), 'rechts');

console.log('\n3 · Die Maske lässt die stehenden Köpfe stehen');
/* Ein maskiertes Rollfeld erzeugt einen eigenen Stapelzusammenhang. Ob
   `position: sticky` darin weiter greift, ist genau die Wechselwirkung, die
   man im Quelltext nicht sieht — deshalb wird sie hier gemessen: beim
   Rollen nach rechts muss die Kopfspalte an ihrem Platz bleiben. */
await baue(9);
/* ZWEI FEHLER SASSEN IN DIESEM ABSCHNITT SELBST (P2). Erstens: fehlte die
   Klasse, wurde `-1` mit `-1` verglichen und „steht still" gemeldet — für
   ein Element, das es gar nicht gab. Zweitens wurde waagerecht gerollt,
   aber für die Kopfzeile `.top` gemessen — eine Zahl, die sich beim
   waagerechten Rollen auch OHNE sticky nicht bewegt. Jetzt wird erst
   festgehalten, dass beide Teile existieren, und beim waagerechten Rollen
   das gemessen, was dabei stehen bleiben muss: die linke Kante von Ecke
   und Zeilenkopf. */
const stehen = await seite.evaluate(async () => {
  const f = document.querySelector<HTMLElement>('#pruef-rand .tbl-feld');
  if (!f) return null;
  const ecke = f.querySelector<HTMLElement>('.tbl-ecke');
  const zn   = f.querySelector<HTMLElement>('.tbl-zn');
  const da = !!ecke && !!zn;
  const vorher  = ecke?.getBoundingClientRect().left ?? -1;
  const znLinks = zn?.getBoundingClientRect().left ?? -1;
  f.scrollLeft = 200;
  f.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 80));
  /* NACH dem Rollen neu suchen: das fensterweise Zeichnen baut die Zeilen
     beim Rollen neu, der alte `.tbl-zn`-Knoten hängt dann nirgends mehr und
     misst `left: 0`. Der erste Anlauf hielt genau das für einen kaputten
     sticky — in der echten App stand die Spalte auf den Pixel still. */
  const znNeu = f.querySelector<HTMLElement>('.tbl-zn');
  return { da, vorher, nachher: ecke?.getBoundingClientRect().left ?? -99,
           znLinks, znDanach: znNeu?.getBoundingClientRect().left ?? -99,
           gerollt: Math.round(f.scrollLeft) };
});
p('Ecke und Zeilenkopf sind da — sonst prüfte -1 gegen -1',
  (stehen as any)?.da === true);
p('Es wurde wirklich gerollt', ((stehen as any)?.gerollt ?? 0) > 100,
  String((stehen as any)?.gerollt));
p('Die Ecke links bleibt, wo sie war',
  (stehen as any)?.da === true &&
  Math.abs(((stehen as any)?.vorher ?? 0) - ((stehen as any)?.nachher ?? -99)) < 2,
  `${(stehen as any)?.vorher} → ${(stehen as any)?.nachher}`);
p('Und der Zeilenkopf ebenfalls',
  (stehen as any)?.da === true &&
  Math.abs(((stehen as any)?.znLinks ?? 0) - ((stehen as any)?.znDanach ?? -99)) < 2,
  `${(stehen as any)?.znLinks} → ${(stehen as any)?.znDanach}`);

console.log('\n4 · Am Rechner gilt dasselbe, nur schmaler');
const rechner = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const breit = await rechner.evaluate(async () => {
  const w = window as any;
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Breit', telefonRaster: true });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-rand';
  kasten.style.cssText = 'width:600px';
  document.body.appendChild(kasten);
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));
  const b2 = Store.getBlock(blk.id);
  b2.mappe.blaetter[0].spalten = 12;
  Store.updateBlock(b2.id, { mappe: b2.mappe });
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 400));
  const f = document.querySelector<HTMLElement>('#pruef-rand .tbl-feld');
  return { rand: f?.dataset['rand'] ?? '',
           streifen: f ? getComputedStyle(f).getPropertyValue('--rollrand').trim() : '' };
});
gleich('Auch dort steht die Kante rechts', (breit as any).rand, 'rechts');
gleich('… aber schmaler als am Telefon', (breit as any).streifen, '18px');
await rechner.close();

console.log('\n5 · Das Datenbankraster hat denselben Rand');
/* Dasselbe Raster, derselbe Fund: dort stand `14500` als `1450` da. */
const imRaster = await seite.evaluate(async () => {
  const w = window as any;
  document.getElementById('pruef-rand')?.remove();
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  const db = Store.addDatabase(s.id, 'Kunden', {
    title: { name: 'Kunde', type: 'title' },
    a: { name: 'Umsatz', type: 'number' }, b: { name: 'Ort', type: 'text' },
    c: { name: 'Land', type: 'text' },     d: { name: 'Notiz', type: 'text' },
    e: { name: 'Mehr', type: 'text' }
  }, 'raster');
  const coll = Store.getCollection(db.collectionId);
  Store.addRow(coll.id, { title: 'Meier AG', a: 14500, b: 'Zürich' });
  const view = Object.values(Store.cache.views)
    .find((v: any) => v.collectionId === coll.id) as any;
  const kasten = document.createElement('div');
  kasten.id = 'pruef-rand';
  kasten.style.cssText = 'width:' + Math.min(innerWidth - 40, 900) + 'px; margin:0 20px';
  document.body.appendChild(kasten);
  kasten.appendChild(w.DbRaster.zeichne(coll, view, Store.rowsOf(coll.id)));
  await new Promise(r => setTimeout(r, 400));
  const f = document.querySelector<HTMLElement>('#pruef-rand .tbl-feld');
  return { rand: f?.dataset['rand'] ?? '', rollt: f ? f.scrollWidth > f.clientWidth : false };
});
p('Sechs Spalten rollen auf 390 px', (imRaster as any).rollt === true);
gleich('… und die Kante steht auch dort', (imRaster as any).rand, 'rechts');

console.log('\n5b · Und die gewöhnliche Datenbanktabelle auch');
/* Am Telefon zeigt die Datenbank Karten — dort rollt nichts. Wer im
   Ansichtsmenü auf „Tabelle" umstellt, hat aber genau die Lage von oben.
   Gemessen vor der Behebung: 703 px Inhalt in 334 px Kasten, scharfe
   Kante, `14500` und `8750.5` genau darauf. */
const alsTabelle = await seite.evaluate(async () => {
  document.getElementById('pruef-rand')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Tabelle am Telefon' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  const db = Store.addDatabase(s.id, 'Kunden', {
    title:  { name: 'Kunde',  type: 'title' },
    umsatz: { name: 'Umsatz', type: 'number' },
    ort:    { name: 'Ort',    type: 'text' },
    land:   { name: 'Land',   type: 'text' },
    notiz:  { name: 'Notiz',  type: 'text' }
  }, 'table');
  const coll = Store.getCollection(db.collectionId);
  Store.addRow(coll.id, { title: 'Meier AG', umsatz: 14500, ort: 'Zürich', land: 'CH' });
  const view = Store.getView(coll.viewIds[0]);

  /* Erst der Regelfall: Karten, und dort darf es keine Kante geben. */
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 500));
  const mitKarten = !!document.querySelector('.db-rollbox');

  /* Dann der Schalter aus dem Ansichtsmenü. */
  Store.updateView(view.id, { handyTabelle: true });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 600));
  const box = document.querySelector<HTMLElement>('.db-rollbox');
  return {
    mitKarten,
    da: !!box,
    rollt: box ? box.scrollWidth > box.clientWidth + 2 : false,
    masse: box ? `${box.scrollWidth} in ${box.clientWidth}` : '',
    rand: box?.dataset['rand'] ?? '',
    maske: box ? getComputedStyle(box).maskImage : 'none'
  };
});
p('Als Karten gibt es gar keinen Rollkasten', (alsTabelle as any).mitKarten === false);
p('Nach dem Umschalten auf Tabelle ist er da', (alsTabelle as any).da === true);
p('… und rollt seitlich', (alsTabelle as any).rollt === true, (alsTabelle as any).masse);
gleich('… mit der Kante rechts', (alsTabelle as any).rand, 'rechts');
p('… als echte Maske', String((alsTabelle as any).maske ?? '').includes('gradient'),
  String((alsTabelle as any).maske).slice(0, 70));

console.log('\n6 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 100 — Die weiche Kante: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
