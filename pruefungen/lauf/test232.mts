/* Suite 198 — Spalten aufräumen, mit Vorschau (L27, E178)
 * ============================================================================
 * L27 nennt sechs Handgriffe eines Import-Assistenten. Vier gab es schon, als
 * die Lücke geschrieben wurde — Typen erkennen und Vorschau beim CSV-Einlesen,
 * Duplikate über `Pflege.dublettenDialog`, Dateien kombinieren durch ein
 * zweites CSV in dieselbe Datenbank. Zwei fehlten, und beide braucht man nach
 * jedem Import als Erstes: **Spalten bereinigen** und **Werte ersetzen**.
 *
 * DIESE SUITE MISST VOR ALLEM DIE VORSCHAU. Ein Aufräumen, das dreihundert
 * Zeilen anfasst und erst danach zeigt, was es getan hat, ist kein Werkzeug,
 * sondern ein Risiko (§46). `plan()` darf deshalb nichts ändern, und §2 misst
 * das an Zeitstempeln, nicht an Werten.
 *
 *   node pruefungen/lauf/test232.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8989;

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

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Ein Bestand, wie er nach einem Import aus einer fremden Tabelle aussieht:
   Leerzeichen am Rand, doppelte innen, ein geschütztes Leerzeichen, und
   dreimal dieselbe Schreibweise, die man ersetzen will. */
const bau = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Eingelesen' });
  const { collectionId } = Store.addDatabase(s.id, 'Firmen', null, 'table');
  const coll = Store.getCollection(collectionId);
  coll.schema = {
    title: { name: 'Name', type: 'title' },
    ort:   { name: 'Ort',  type: 'text' },
    zahl:  { name: 'Umsatz', type: 'number' }
  };
  Store.rohSetzen('collections', coll);
  const werte = [
    { title: 'Erste',  ort: '  Berlin  ',      zahl: 100 },
    { title: 'Zweite', ort: 'Berlin',          zahl: 200 },
    { title: 'Dritte', ort: 'Hamburg  Nord',   zahl: 300 },
    /* ALS ESCAPE, nicht als Zeichen: ein geschütztes Leerzeichen im
       Quelltext übersteht kein Kopieren, und ob es noch eines ist, sieht
       ihm niemand an. */
    { title: 'Vierte', ort: 'K\u00f6ln\u00a0 ',  zahl: 400 },
    { title: 'Fünfte', ort: 'münchen',         zahl: 500 },
    /* Ein Punkt in der Zelle — das Zeichen, an dem sich wörtlich und
       regulär unterscheiden. Als Regex trifft „." JEDES Zeichen. */
    { title: 'Sechste', ort: 'St. Gallen',     zahl: 600 }
  ];
  const ids: string[] = [];
  for (const w of werte) {
    const r = Store.addRow(collectionId, { title: w.title });
    Object.assign(r, { props: w });
    Store.rohSetzen('blocks', r);
    ids.push(r.id);
  }
  await Store.flush();
  return { coll: collectionId, ids, seite: s.id };
});

/* ==========================================================================
 * §1 · Der Plan sagt, was passieren würde
 * ========================================================================*/
console.log('\n1 · Der Plan sagt, was passieren würde');

const plan = await seite.evaluate((b: any) => {
  const coll = Store.getCollection(b.coll);
  return {
    spalten: Aufraeumen.spalten(coll),
    rand: Aufraeumen.plan(coll, 'ort', { griffe: ['rand'] }),
    innen: Aufraeumen.plan(coll, 'ort', { griffe: ['innen'] }),
    unsichtbar: Aufraeumen.plan(coll, 'ort', { griffe: ['unsichtbar', 'rand'] }),
    nurUnsichtbar: Aufraeumen.plan(coll, 'ort', { griffe: ['unsichtbar'] }),
    gross: Aufraeumen.plan(coll, 'ort', { griffe: ['gross'] }),
    ersetzen: Aufraeumen.plan(coll, 'ort', { ersetze: 'Berlin', durch: 'BERLIN' }),
    punkt: Aufraeumen.plan(coll, 'ort', { ersetze: '.', durch: '' }),
    nurGanz: Aufraeumen.plan(coll, 'ort', { ersetze: 'Berlin', durch: 'BERLIN', nurGanz: true }),
    zahlSpalte: Aufraeumen.plan(coll, 'zahl', { griffe: ['rand'] })
  };
}, bau);

gleich('Aufräumbar sind die Textspalten, nicht die Zahl',
  plan.spalten, ['title', 'ort']);
gleich('„Leerzeichen am Rand" trifft zwei Zeilen', plan.rand.betroffen, 2);
gleich('Und macht aus „  Berlin  " ein „Berlin"',
  (plan.rand.zeilen[0] || {}).nachher, 'Berlin');
/* ZWEI, nicht eine: „  Berlin  " hat vorn und hinten je zwei Leerzeichen,
   und die sind auch „zwei oder mehr". Der erste Anlauf erwartete eine —
   eine falsche Erwartung, kein falscher Griff. */
gleich('„Doppelte innen" trifft beide Zeilen mit Leerzeichenfolgen',
  plan.innen.betroffen, 2);
gleich('Und macht aus „Hamburg  Nord" ein „Hamburg Nord"',
  (plan.innen.zeilen.find((z: any) => /Hamburg/.test(z.vorher)) || {}).nachher,
  'Hamburg Nord');
/* ZWEI: „  Berlin  " (Ränder) und die Kölner Zelle (unsichtbar plus Rand).
   „Hamburg  Nord" hat weder unsichtbare Zeichen noch Ränder. */
gleich('Unsichtbar plus Rand trifft zwei Zeilen', plan.unsichtbar.betroffen, 2);
/* Und der Griff ALLEIN — sonst bewiese der Punkt oben nur, dass `rand` wirkt. */
gleich('Der Griff allein trifft genau die eine Zelle',
  plan.nurUnsichtbar.betroffen, 1);
gleich('Und „Köln\\u00a0" wird zu „Köln"',
  (plan.unsichtbar.zeilen.find((z: any) => /Köln/.test(z.vorher)) || {}).nachher, 'Köln');
gleich('„Erster Buchstabe gross" trifft „münchen"', plan.gross.betroffen, 1);
gleich('Und macht „München" daraus', (plan.gross.zeilen[0] || {}).nachher, 'München');

console.log('\n1a · Und das Ersetzen ist wörtlich, nicht regulär');
gleich('„Berlin" → „BERLIN" trifft beide Zeilen', plan.ersetzen.betroffen, 2);
gleich('Auch die mit Leerzeichen drumherum',
  plan.ersetzen.zeilen.some((z: any) => z.nachher === '  BERLIN  '), true);
gleich('„nur ganze Zelle" trifft nur die saubere', plan.nurGanz.betroffen, 1);
/* DER PUNKT, DER DEN UNTERSCHIED MACHT. Wörtlich trifft „." genau eine
   Zelle und nimmt dort ein Zeichen weg. Als regulärer Ausdruck trifft es
   jede Zelle und macht sie leer — und bei dreihundert Zeilen sieht das
   niemand kommen. */
gleich('„." trifft genau eine Zelle, nicht jede', plan.punkt.betroffen, 1);
gleich('Und macht aus „St. Gallen" ein „St Gallen"',
  (plan.punkt.zeilen[0] || {}).nachher, 'St Gallen');
gleich('Eine Zahlenspalte lässt sich nicht aufräumen', plan.zahlSpalte.betroffen, 0);

/* ==========================================================================
 * §2 · Und der Plan ändert nichts
 * --------------------------------------------------------------------------
 * Gemessen am Zeitstempel, nicht am Wert: „der Wert ist noch derselbe" wäre
 * auch wahr, wenn er zwischendurch ein anderer war.
 * ========================================================================*/
console.log('\n2 · Und der Plan ändert nichts');

const unberuehrt = await seite.evaluate(async (b: any) => {
  const vorher = b.ids.map((id: string) => {
    const r = Store.getBlock(id);
    return { id, ort: r.props.ort, edited: r.edited };
  });
  const coll = Store.getCollection(b.coll);
  for (let i = 0; i < 5; i++)
    Aufraeumen.plan(coll, 'ort', { griffe: ['rand', 'innen', 'unsichtbar', 'gross'],
                                   ersetze: 'e', durch: 'X' });
  await new Promise(r => setTimeout(r, 200));
  const nachher = b.ids.map((id: string) => {
    const r = Store.getBlock(id);
    return { id, ort: r.props.ort, edited: r.edited };
  });
  return { gleich: JSON.stringify(vorher) === JSON.stringify(nachher), vorher, nachher };
}, bau);

p('Fünf Durchläufe später steht alles unverändert da', unberuehrt.gleich,
  JSON.stringify(unberuehrt.nachher).slice(0, 200));

/* ==========================================================================
 * §3 · Erst „Übernehmen" schreibt
 * ========================================================================*/
console.log('\n3 · Erst „Übernehmen" schreibt');

const gewendet = await seite.evaluate(async (b: any) => {
  const coll = Store.getCollection(b.coll);
  const v = Aufraeumen.plan(coll, 'ort', { griffe: ['rand', 'innen', 'unsichtbar'] });
  const erg = Aufraeumen.wende(v);
  await Store.flush();
  return { erg, orte: b.ids.map((id: string) => Store.getBlock(id).props.ort) };
}, bau);

/* DREI: die beiden mit Rändern und „Hamburg  Nord". Die saubere „Berlin"
   und „münchen" bleiben, wie sie sind. */
gleich('Drei Zeilen ändern sich', gewendet.erg.geaendert, 3);
gleich('Und nichts wird ausgelassen', gewendet.erg.ausgelassen, 0);
gleich('Die Orte stehen jetzt sauber da', gewendet.orte,
  ['Berlin', 'Berlin', 'Hamburg Nord', 'Köln', 'münchen', 'St. Gallen']);

/* ==========================================================================
 * §4 · Was sich inzwischen geändert hat, bleibt in Ruhe
 * --------------------------------------------------------------------------
 * Zwischen Vorschau und Zusage kann ein zweites Fenster oder ein Abgleich
 * dazwischenkommen. Dann stünde in der Zelle etwas, das dem Menschen nie
 * gezeigt wurde — und `wende` schreibt es trotzdem hinein, wenn es den Plan
 * nicht gegen den Bestand hält.
 * ========================================================================*/
console.log('\n4 · Was sich inzwischen geändert hat, bleibt in Ruhe');

const dazwischen = await seite.evaluate(async (b: any) => {
  const coll = Store.getCollection(b.coll);
  Store.setProp(b.ids[0], 'ort', '  Bremen  ');
  Store.setProp(b.ids[2], 'ort', '  Kiel  ');
  await Store.flush();
  const v = Aufraeumen.plan(coll, 'ort', { griffe: ['rand'] });
  /* Und jetzt kommt jemand dazwischen — genau in EINER der beiden Zeilen. */
  Store.setProp(b.ids[0], 'ort', 'Von Hand geändert');
  await Store.flush();
  const erg = Aufraeumen.wende(v);
  await Store.flush();
  return { erg, eins: Store.getBlock(b.ids[0]).props.ort,
           drei: Store.getBlock(b.ids[2]).props.ort };
}, bau);

gleich('Die unveränderte Zeile wird aufgeräumt', dazwischen.drei, 'Kiel');
gleich('Die dazwischen geänderte bleibt, wie sie ist',
  dazwischen.eins, 'Von Hand geändert');
gleich('Und der Bericht sagt, dass eine ausgelassen wurde',
  dazwischen.erg.ausgelassen, 1);
gleich('Eine wurde geändert', dazwischen.erg.geaendert, 1);

/* ==========================================================================
 * §5 · Und es gibt einen Weg dorthin
 * ========================================================================*/
console.log('\n5 · Und es gibt einen Weg dorthin');

const weg2 = await seite.evaluate(async (b: any) => {
  const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
  const dbBlock = (Object.values(Store.cache.blocks) as any[])
    .find(x => x.type === 'database' && x.collectionId === b.coll);
  App.oeffne(b.seite);
  await warte(700);
  const menue = document.querySelector(`.blk[data-bid="${dbBlock.id}"] [data-a="menu"]`) as HTMLElement;
  if (!menue) return { fehler: 'kein Menüknopf' };
  menue.click();
  await warte(300);
  const eintrag = document.querySelector('[data-a="putzen"]') as HTMLElement;
  if (!eintrag) return { fehler: 'kein Menüeintrag' };
  eintrag.click();
  await warte(300);
  const dialog = document.querySelector('.overlay .finder');
  if (!dialog) return { fehler: 'kein Dialog' };

  /* Ort wählen, „Berlin" durch „Hauptstadt" ersetzen, nachsehen. */
  const spalte = document.getElementById('au-spalte') as HTMLSelectElement;
  spalte.value = 'ort'; spalte.dispatchEvent(new Event('change', { bubbles: true }));
  const suche = document.getElementById('au-suche') as HTMLInputElement;
  suche.value = 'Berlin'; suche.dispatchEvent(new Event('input', { bubbles: true }));
  const durch = document.getElementById('au-durch') as HTMLInputElement;
  durch.value = 'Hauptstadt'; durch.dispatchEvent(new Event('input', { bubbles: true }));
  await warte(300);
  const vorschauText = (document.getElementById('au-vorschau') || {} as any).textContent || '';
  const knopfAn = !(document.querySelector('[data-a="tu"]') as HTMLButtonElement).disabled;
  const vorher = Store.getBlock(b.ids[1]).props.ort;
  (document.querySelector('[data-a="tu"]') as HTMLElement).click();
  await warte(400);
  return { vorschauText, knopfAn, vorher,
           nachher: Store.getBlock(b.ids[1]).props.ort,
           offen: !!document.querySelector('.overlay') };
}, bau);

p('Der Menüeintrag ist da und öffnet den Dialog', !(weg2 as any).fehler,
  (weg2 as any).fehler || '');
/* EINE von sechs: §3 hat aufgeräumt und §4 hat die erste Zeile von Hand
   geändert — es steht nur noch ein „Berlin" da. */
p('Die Vorschau nennt die Zahl der betroffenen Zeilen',
  /1 von 6 Zeilen ändern sich/.test((weg2 as any).vorschauText || ''),
  ((weg2 as any).vorschauText || '').slice(0, 120));
p('Und zeigt vorher und nachher',
  /Berlin/.test((weg2 as any).vorschauText || '') &&
  /Hauptstadt/.test((weg2 as any).vorschauText || ''),
  ((weg2 as any).vorschauText || '').slice(0, 160));
p('Erst dann lässt sich übernehmen', (weg2 as any).knopfAn);
gleich('Vor dem Übernehmen steht der alte Wert', (weg2 as any).vorher, 'Berlin');
gleich('Danach der neue', (weg2 as any).nachher, 'Hauptstadt');
p('Der Dialog schliesst sich', !(weg2 as any).offen);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
