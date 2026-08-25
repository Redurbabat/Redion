/* Suite 196 — Was wäre, wenn (L28, E176)
 * ============================================================================
 * L28 stand als drei Halbsätze in den Lücken: „Zielwert eingeben und
 * rückwärts rechnen · Best/Normal/Worst Case · einfache Optimierung."
 *
 * Alle drei laufen über dieselbe kleine Maschine: eine Stellschraube (eine
 * schreibbare Zahlenspalte) und ein Ziel (eine gerechnete Spalte) in
 * derselben Zeile.
 *
 * WORAUF DIESE SUITE VOR ALLEM SIEHT, ist nicht die Rechnung, sondern das,
 * was daneben passiert: **beim Suchen darf nichts geschrieben werden.** Der
 * naheliegende Weg wäre, jeden Probewert in die Zelle zu schreiben; dann
 * stünden bei dreissig Schritten neunundzwanzig falsche Werte in den Daten,
 * jeder in einer Fassung und im Abgleich, und bricht es ab, bleibt der
 * letzte stehen. §5 misst das ausdrücklich.
 *
 *   node pruefungen/lauf/test230.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8987;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
const nahe = (n: string, ist: number, soll: number, spiel = 1e-4): void =>
  p(n, Number.isFinite(ist) && Math.abs(ist - soll) <= spiel,
    `ist ${ist}, soll ${soll} ± ${spiel}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* --- Eine Tabelle, die rechnet ------------------------------------------
 * Preis (Zahl) · Menge (Zahl) · Kosten (Zahl) · Gewinn (Formel)
 *   Gewinn = Preis × Menge − Kosten
 * Und ein zweiter, krummer Fall für die Optimierung:
 *   Absatz = Menge − 2 × Preis      (je teurer, desto weniger)
 *   Erloes = Preis × Absatz          (ein Gipfel, kein Hang)
 * ----------------------------------------------------------------------*/
const bau = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Kalkulation' });
  const { collectionId } = Store.addDatabase(s.id, 'Rechnung', null, 'table');
  const coll = Store.getCollection(collectionId);
  coll.schema = {
    title:  { name: 'Name',   type: 'title' },
    preis:  { name: 'Preis',  type: 'number' },
    menge:  { name: 'Menge',  type: 'number' },
    kosten: { name: 'Kosten', type: 'number' },
    gewinn: { name: 'Gewinn', type: 'formula',
              formula: 'prop("Preis") * prop("Menge") - prop("Kosten")' },
    absatz: { name: 'Absatz', type: 'formula',
              formula: 'prop("Menge") - 2 * prop("Preis")' },
    erloes: { name: 'Erlös',  type: 'formula',
              formula: 'prop("Preis") * (prop("Menge") - 2 * prop("Preis"))' }
  };
  Store.rohSetzen('collections', coll);
  const zeile = Store.addRow(collectionId, { title: 'Produkt A' });
  Object.assign(zeile, { props: { title: 'Produkt A', preis: 10, menge: 100, kosten: 400 } });
  Store.rohSetzen('blocks', zeile);
  await Store.flush();
  return { coll: collectionId, zeile: zeile.id,
           gewinnJetzt: Datenbank.wert(Store.getBlock(zeile.id), 'gewinn',
                                       Store.getCollection(collectionId)) };
});

/* ==========================================================================
 * §1 · Die Tabelle rechnet überhaupt
 * ========================================================================*/
console.log('\n1 · Die Tabelle rechnet');

gleich('Gewinn = 10 × 100 − 400', bau.gewinnJetzt, 600);

/* ==========================================================================
 * §2 · Zielwertsuche — rückwärts rechnen
 * ========================================================================*/
console.log('\n2 · Zielwertsuche');

const ziel = await seite.evaluate((b: any) => {
  const coll = Store.getCollection(b.coll);
  const row = Store.getBlock(b.zeile);
  return {
    hoch:   WhatIf.zielwert(coll, row, 'preis', 'gewinn', 10000),
    runter: WhatIf.zielwert(coll, row, 'preis', 'gewinn', 0),
    negativ: WhatIf.zielwert(coll, row, 'preis', 'gewinn', -400),
    ueberMenge: WhatIf.zielwert(coll, row, 'menge', 'gewinn', 1000)
  };
}, bau);

p('Ein Zielwert wird gefunden', (ziel.hoch as any).ok, JSON.stringify(ziel.hoch));
nahe('Für 10 000 Gewinn muss der Preis 104 sein', (ziel.hoch as any).wert, 104);
nahe('Und die Formel sagt dann wirklich 10 000', (ziel.hoch as any).erreicht, 10000, 1e-3);

nahe('Gewinn 0 heisst Preis 4', (ziel.runter as any).wert, 4);
nahe('Und ein NEGATIVES Ziel geht auch', (ziel.negativ as any).wert, 0);
nahe('Dieselbe Suche über die Menge statt den Preis',
  (ziel.ueberMenge as any).wert, 140);

/* An `ok` GEBUNDEN. Die erste Fassung fragte nur nach der Schrittzahl —
   und die war auch dann klein, als die Suche gar nichts fand. Ein Punkt,
   der beim Scheitern grün bleibt, ist keiner (§55.2). */
p('Und sie braucht dafür keine hundert Schritte',
  (ziel.hoch as any).ok && (ziel.hoch as any).schritte < 100,
  String((ziel.hoch as any).schritte));

/* ==========================================================================
 * §3 · Und wo nichts zu finden ist, sagt sie es
 * --------------------------------------------------------------------------
 * Eine Suche, die auch scheitern kann, muss beim Scheitern etwas SAGEN.
 * „Nichts passiert" sieht aus wie „hat funktioniert".
 * ========================================================================*/
console.log('\n3 · Und wo nichts zu finden ist, sagt sie es');

const schief = await seite.evaluate((b: any) => {
  const coll = Store.getCollection(b.coll);
  const row = Store.getBlock(b.zeile);
  return {
    festeSpalte: WhatIf.zielwert(coll, row, 'preis', 'kosten', 5),
    stellIstFormel: WhatIf.zielwert(coll, row, 'gewinn', 'erloes', 5),
    keineZahl: WhatIf.zielwert(coll, row, 'preis', 'gewinn', 'viel'),
    /* Absatz hängt gar nicht vom Preis ab? Doch — also einer, der wirklich
       nicht geht: der Erlös hat einen Gipfel bei 12 500, darüber gibt es
       keinen Preis mehr. */
    unerreichbar: WhatIf.zielwert(coll, row, 'preis', 'erloes', 99999)
  };
}, bau);

p('Ein festes Ziel wird abgelehnt', !(schief.festeSpalte as any).ok);
p('Und zwar mit einem Satz, der erklärt warum',
  /gerechnete Spalte/.test((schief.festeSpalte as any).grund || ''),
  (schief.festeSpalte as any).grund);
p('Eine gerechnete Stellschraube wird abgelehnt', !(schief.stellIstFormel as any).ok);
p('Und ein Zielwert, der keine Zahl ist', !(schief.keineZahl as any).ok);
p('Ein unerreichbares Ziel wird benannt statt geraten',
  !(schief.unerreichbar as any).ok &&
  /Kein Wert/.test((schief.unerreichbar as any).grund || ''),
  JSON.stringify(schief.unerreichbar).slice(0, 160));

/* ==========================================================================
 * §4 · Einfache Optimierung — wo ist der Gipfel
 * --------------------------------------------------------------------------
 * Erlös = Preis × (Menge − 2 × Preis) = 100p − 2p².
 * Der Hochpunkt liegt bei p = 25, der Erlös dort bei 1250. Von Hand
 * nachgerechnet, damit die Prüfung nicht die Maschine gegen sich selbst
 * misst.
 * ========================================================================*/
console.log('\n4 · Einfache Optimierung');

const opt = await seite.evaluate((b: any) => {
  const coll = Store.getCollection(b.coll);
  const row = Store.getBlock(b.zeile);
  return {
    max: WhatIf.optimum(coll, row, 'preis', 'erloes', 'max', 0, 50),
    min: WhatIf.optimum(coll, row, 'preis', 'erloes', 'min', 0, 50),
    verdreht: WhatIf.optimum(coll, row, 'preis', 'erloes', 'max', 50, 0)
  };
}, bau);

nahe('Der grösste Erlös liegt bei Preis 25', (opt.max as any).wert, 25, 1e-3);
nahe('Und beträgt 1250', (opt.max as any).erreicht, 1250, 1e-2);
p('Der kleinste liegt an einem Rand, nicht in der Mitte',
  Math.abs((opt.min as any).wert - 25) > 20, String((opt.min as any).wert));
p('Verdrehte Grenzen werden abgelehnt', !(opt.verdreht as any).ok,
  JSON.stringify(opt.verdreht).slice(0, 120));

/* ==========================================================================
 * §5 · UND NICHTS DAVON HAT ETWAS GESCHRIEBEN
 * --------------------------------------------------------------------------
 * Der Punkt, um den es in dieser Datei am meisten geht. Gemessen wird nicht
 * „der Wert ist noch derselbe" — das wäre auch wahr, wenn zwischendurch
 * dreissig andere darin standen —, sondern der ZEITSTEMPEL der Zeile und die
 * Zahl der Fassungen. Beides bewegt sich bei jedem Schreiben.
 * ========================================================================*/
console.log('\n5 · Und nichts davon hat etwas geschrieben');

const unberuehrt = await seite.evaluate(async (b: any) => {
  const vorher = Store.getBlock(b.zeile);
  const stand = { preis: vorher.props.preis, edited: vorher.edited,
                  fassungen: (await Store.versionen(b.zeile)).length };
  const coll = Store.getCollection(b.coll);
  for (let i = 0; i < 5; i++) {
    WhatIf.zielwert(coll, Store.getBlock(b.zeile), 'preis', 'gewinn', 3000 + i);
    WhatIf.optimum(coll, Store.getBlock(b.zeile), 'preis', 'erloes', 'max', 0, 50);
  }
  const nachher = Store.getBlock(b.zeile);
  return { stand, jetzt: { preis: nachher.props.preis, edited: nachher.edited,
                           fassungen: (await Store.versionen(b.zeile)).length } };
}, bau);

gleich('Der Wert in der Zelle steht unverändert da',
  unberuehrt.jetzt.preis, unberuehrt.stand.preis);
gleich('Der Zeitstempel der Zeile hat sich nicht bewegt',
  unberuehrt.jetzt.edited, unberuehrt.stand.edited);
gleich('Und es ist keine einzige Fassung entstanden',
  unberuehrt.jetzt.fassungen, unberuehrt.stand.fassungen);

/* ==========================================================================
 * §6 · Szenarien
 * ========================================================================*/
console.log('\n6 · Szenarien');

const szen = await seite.evaluate(async (b: any) => {
  const coll = () => Store.getCollection(b.coll);
  const row = () => Store.getBlock(b.zeile);
  WhatIf.merke(coll(), 'schlecht', { preis: 6,  menge: 60 });
  WhatIf.merke(coll(), 'normal',   { preis: 10, menge: 100 });
  WhatIf.merke(coll(), 'gut',      { preis: 14, menge: 150 });
  /* Und einer, der eine gerechnete Spalte setzen will — das darf nicht
     mitgehen, sonst überschriebe ein Szenario eine Formel. */
  WhatIf.merke(coll(), 'unsinn', { gewinn: 999, preis: 7 });
  const namen = WhatIf.szenarien(coll()).map((s: any) => s.name);
  const unsinn = WhatIf.szenarien(coll()).find((s: any) => s.name === 'unsinn');

  const vorschau = WhatIf.zeige(coll(), row(), 'gut');
  const preisVorher = row().props.preis;
  const editedVorher = row().edited;

  WhatIf.uebernimm(coll(), row(), 'gut');
  await Store.flush();
  const nach = { preis: row().props.preis, menge: row().props.menge,
                 gewinn: Datenbank.wert(row(), 'gewinn', coll()) };

  WhatIf.vergiss(coll(), 'unsinn');
  return { namen, unsinnWerte: unsinn ? Object.keys(unsinn.werte) : [],
           vorschau, preisVorher, editedVorher, nach,
           uebrig: WhatIf.szenarien(coll()).map((s: any) => s.name),
           editedNachher: row().edited };
}, bau);

gleich('Drei Szenarien und ein Unsinn sind gemerkt', szen.namen,
  ['schlecht', 'normal', 'gut', 'unsinn']);
gleich('Ein Szenario kann keine gerechnete Spalte setzen', szen.unsinnWerte, ['preis']);
gleich('Die Vorschau rechnet „gut" durch: 14 × 150 − 400',
  (szen.vorschau as any).gewinn, 1700);
gleich('Und lässt die Zelle dabei in Ruhe', szen.preisVorher, 10);
gleich('Erst „Übernehmen" schreibt', szen.nach.preis, 14);
gleich('Und dann rechnet die Tabelle wirklich damit', szen.nach.gewinn, 1700);
p('Und der Zeitstempel bewegt sich jetzt sehr wohl',
  szen.editedNachher !== szen.editedVorher,
  szen.editedVorher + ' → ' + szen.editedNachher);
gleich('Ein vergessenes Szenario ist fort', szen.uebrig,
  ['schlecht', 'normal', 'gut']);

/* ==========================================================================
 * §7 · Und es gibt einen Weg dorthin
 * --------------------------------------------------------------------------
 * DER PUNKT, DEN L23 GERADE ERST GEZEIGT HAT: gebaute Rechnung ohne Weg
 * dorthin sieht fertig aus und ist es nicht. Also wird der Weg gegangen —
 * Menü öffnen, Zeile wählen, Zielwert tippen, ausrechnen, übernehmen.
 * ========================================================================*/
console.log('\n7 · Und es gibt einen Weg dorthin');

const wegDorthin = await seite.evaluate(async (b: any) => {
  const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
  const s = Store.getBlock(b.zeile);
  App.oeffne(Store.getBlock(s.parentId) ? s.parentId : b.zeile);
  /* Die Seite mit der Datenbank öffnen — sie ist der Elternteil der Sammlung. */
  const dbBlock = (Object.values(Store.cache.blocks) as any[])
    .find(x => x.type === 'database' && x.collectionId === b.coll);
  App.oeffne(Store.getBlock(dbBlock.parentId).id);
  await warte(600);
  const menueKnopf = document.querySelector(`.blk[data-bid="${dbBlock.id}"] [data-a="menu"]`) as HTMLElement;
  if (!menueKnopf) return { fehler: 'kein Menüknopf' };
  menueKnopf.click();
  await warte(300);
  const eintrag = [...document.querySelectorAll('[data-a="wenn"]')][0] as HTMLElement;
  if (!eintrag) return { fehler: 'kein Menüeintrag „Was wäre, wenn"' };
  eintrag.click();
  await warte(300);
  const dialog = document.querySelector('.overlay .finder');
  if (!dialog) return { fehler: 'kein Dialog' };

  const ziel = document.getElementById('ww-ziel') as HTMLSelectElement;
  const stell = document.getElementById('ww-stell') as HTMLSelectElement;
  const wunsch = document.getElementById('ww-wunsch') as HTMLInputElement;
  ziel.value = 'gewinn'; ziel.dispatchEvent(new Event('change', { bubbles: true }));
  stell.value = 'preis'; stell.dispatchEvent(new Event('change', { bubbles: true }));
  wunsch.value = '2000';
  (document.querySelector('[data-a="rechne"]') as HTMLElement).click();
  await warte(300);
  const text = (document.getElementById('ww-ergebnis') || {} as any).textContent || '';
  const knopfAn = !(document.querySelector('[data-a="uebernimm"]') as HTMLButtonElement).disabled;
  const preisVor = Store.getBlock(b.zeile).props.preis;
  (document.querySelector('[data-a="uebernimm"]') as HTMLElement).click();
  await warte(400);
  const row = Store.getBlock(b.zeile);
  return { text, knopfAn, preisVor, preisNach: row.props.preis,
           gewinnNach: Datenbank.wert(row, 'gewinn', Store.getCollection(b.coll)),
           offen: !!document.querySelector('.overlay') };
}, bau);

p('Der Menüeintrag ist da und öffnet den Dialog', !(wegDorthin as any).fehler,
  (wegDorthin as any).fehler || '');
/* Menge ist nach §6 150, nicht 100: 16 × 150 − 400 = 2000. Von Hand
   nachgerechnet — der erste Anlauf hier stand noch auf der alten Menge
   und erwartete 24. */
p('Das Ergebnis steht in Worten da',
  /Preis = 16 — dann steht Gewinn bei 2000\./.test((wegDorthin as any).text || ''),
  (wegDorthin as any).text);
p('Und erst dann lässt sich übernehmen', (wegDorthin as any).knopfAn);
gleich('Vor dem Übernehmen steht der alte Wert', (wegDorthin as any).preisVor, 14);
nahe('Danach der neue', (wegDorthin as any).preisNach, 16, 1e-9);
nahe('Und die Tabelle rechnet damit', (wegDorthin as any).gewinnNach, 2000, 1e-6);
p('Der Dialog schliesst sich', !(wegDorthin as any).offen);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
