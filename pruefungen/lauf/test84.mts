/* Suite 49 — Vorberechnete Werte, mit sichtbarem Stand */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: any[] = [];
seite.on('pageerror', (e: any) => fehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Vorrat !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(800);

const bau = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Vorrat-Test' });
  const db = Store.addDatabase(s.id, 'Posten', {
    title:  { name: 'Titel',  type: 'title' },
    betrag: { name: 'Betrag', type: 'number' },
    dat:    { name: 'Datum',  type: 'date' },
    mwst:   { name: 'MwSt',   type: 'formula', formula: 'prop("Betrag") * 0.081' },
    tag:    { name: 'Tag',    type: 'formula', formula: 'prop("Datum")' }
  });
  const c = Store.getCollection(db.collectionId);
  for (let i = 0; i < 150; i++)
    Store.addRow(c.id, { title: 'P' + i, betrag: 100 + i, dat: '2026-08-01' });
  Store.flush();
  await new Promise(r => setTimeout(r, 500));
  return { seite: s.id, coll: c.id, view: c.viewIds[0] };
});

console.log('\n— Lohnt sich das? —');
let r = await seite.evaluate((x: any) => {
  const klein = Store.addDatabase(Store.addPage(null, { text: 'Klein' }).id, 'Wenig', {
    title: { name: 'T', type: 'title' }, f: { name: 'F', type: 'formula', formula: '1' } });
  const ohne = Store.addDatabase(Store.addPage(null, { text: 'Ohne' }).id, 'Ohne Formel', {
    title: { name: 'T', type: 'title' }, n: { name: 'N', type: 'number' } });
  return { gross: Vorrat.lohntSich(x.coll),
           klein: Vorrat.lohntSich(klein.collectionId),
           ohne:  Vorrat.lohntSich(ohne.collectionId) };
}, bau);
p('Bei 150 Zeilen mit zwei Formeln: ja',
  r.gross.ja === true && /300 Rechnungen/.test(r.gross.warum), JSON.stringify(r.gross));
p('Bei wenigen Zeilen: nein, mit Begründung',
  r.klein.ja === false && /zu wenig/.test(r.klein.warum), JSON.stringify(r.klein));
p('Ohne Formeln: nein, mit Begründung',
  r.ohne.ja === false && /nichts zu rechnen/.test(r.ohne.warum), JSON.stringify(r.ohne));

console.log('\n— Einschalten und rechnen —');
r = await seite.evaluate(async (x: any) => {
  const s = await Vorrat.anschalten(x.coll, '15');
  return { anzahl: s.anzahl, dauer: typeof s.dauer, aktiv: Vorrat.aktiv(x.coll),
           stand: Vorrat.stand(x.coll) };
}, bau);
p('300 Werte gerechnet',       r.anzahl === 300, JSON.stringify(r));
p('Die Dauer wird gemessen',   r.dauer === 'number', r.dauer);
p('Und der Vorrat ist an',     r.aktiv === true && r.stand.seither === 0, JSON.stringify(r.stand));

console.log('\n— Der Wert kommt aus dem Vorrat —');
r = await seite.evaluate((x: any) => {
  const c = Store.getCollection(x.coll);
  const z = Store.rowsOf(x.coll)[0];
  const vorher = Datenbank.wert(z, 'mwst', c);
  /* Die Formel ändern — ohne neu zu rechnen muss der alte Wert stehen bleiben */
  c.schema.mwst.formula = 'prop("Betrag") * 999';
  Store.updateCollection(c.id, { schema: c.schema });
  Tempo.veraendert();
  const nachher = Datenbank.wert(z, 'mwst', c);
  return { vorher, nachher, seither: Vorrat.stand(x.coll).seither };
}, bau);
p('Der eingefrorene Wert bleibt stehen',
  Math.abs(r.vorher - r.nachher) < 0.0001, JSON.stringify(r));
p('Aber die Änderung wird gezählt', r.seither > 0, String(r.seither));

console.log('\n— Neu rechnen holt die Änderung ein —');
r = await seite.evaluate(async (x: any) => {
  await Vorrat.berechnen(x.coll);
  const c = Store.getCollection(x.coll);
  const z = Store.rowsOf(x.coll)[0];
  return { wert: Datenbank.wert(z, 'mwst', c), betrag: z.props.betrag,
           seither: Vorrat.stand(x.coll).seither };
}, bau);
p('Jetzt gilt die neue Formel', Math.round(r.wert) === r.betrag * 999, JSON.stringify(r));
p('Und der Zähler steht wieder auf null', r.seither === 0, String(r.seither));

console.log('\n— Ein Datum überlebt das Einpacken —');
r = await seite.evaluate((x: any) => {
  const c = Store.getCollection(x.coll);
  const z = Store.rowsOf(x.coll)[0];
  const w = Datenbank.wert(z, 'tag', c);
  const rein = Vorrat.einpacken(w);
  const raus = Vorrat.auspacken(rein);
  return { typ: w instanceof Date ? 'Date' : typeof w,
           zurueck: raus instanceof Date ? 'Date' : typeof raus,
           gleich: (w instanceof Date && raus instanceof Date)
             ? w.getTime() === raus.getTime() : String(w) === String(raus) };
}, bau);
p('Aus einem Datum wird wieder ein Datum', r.typ === r.zurueck && r.gleich, JSON.stringify(r));

console.log('\n— Über das Neuladen hinweg —');
await seite.evaluate(async () => { Store.flush(); await new Promise(r => setTimeout(r, 600)); });
await seite.reload();
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Vorrat !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(3000);
const geladen = await seite.evaluate((id: string) => Store.rowsOf(id).length, bau.coll);
p('Die Zeilen sind nach dem Neuladen da', geladen >= 150, String(geladen));
r = await seite.evaluate(async (x: any) => {
  const vorLaden = Vorrat.stand(x.coll);
  const e = await Vorrat.laden(x.coll);
  return { vorLaden, anzahl: e && e.anzahl, aktiv: Vorrat.aktiv(x.coll) };
}, bau);
p('Der Vorrat ist noch eingeschaltet', r.aktiv === true, JSON.stringify(r));
p('Und die Werte sind nach dem Laden wieder da', r.anzahl === 300, JSON.stringify(r));

console.log('\n— Die Leiste über der Tabelle —');
r = await seite.evaluate((x: any) => {
  const c = Store.getCollection(x.coll);
  const d = Vorrat.leiste(c);
  return { text: d ? d.textContent : null,
           knoepfe: d ? [...d.querySelectorAll<HTMLElement>('[data-a]')].map(b => b.dataset.a) : [] };
}, bau);
p('Sie sagt, wann gerechnet wurde',
  /Gerechnet/.test(r.text || '') && /300 Werte/.test(r.text || ''), r.text);
p('Und was sich seither geändert hat', /seither/.test(r.text || ''), r.text);
p('Mit Knöpfen zum Neurechnen und Ausschalten',
  (r.knoepfe ?? '').includes('jetzt') && (r.knoepfe ?? '').includes('aus'), JSON.stringify(r.knoepfe));

r = await seite.evaluate((_x: any) => {
  const ohne = Store.addDatabase(Store.addPage(null, { text: 'X' }).id, 'Y',
    { title: { name: 'T', type: 'title' } });
  return Vorrat.leiste(Store.getCollection(ohne.collectionId));
}, bau);
p('Ohne Vorberechnung keine Leiste', r === null, JSON.stringify(r));

console.log('\n— Der Takt rechnet nur bei Änderungen —');
r = await seite.evaluate(async (x: any) => {
  const vorher = Vorrat.stand(x.coll).wann;
  await Vorrat.takten();                        /* nichts geändert */
  const gleich = Vorrat.stand(x.coll).wann === vorher;
  Store.setProp(Store.rowsOf(x.coll)[0].id, 'betrag', 4242);
  /* Die Uhr so stellen, als wäre der Stand alt */
  const e = Vorrat._speicher.get(x.coll);
  e.wann = new Date(Date.now() - 60 * 60000).toISOString();
  await Vorrat.takten();
  return { gleich, neu: Vorrat.stand(x.coll).seither === 0,
           wert: Datenbank.wert(Store.rowsOf(x.coll)[0], 'mwst', Store.getCollection(x.coll)) };
}, bau);
p('Ohne Änderung wird nicht gerechnet', r.gleich === true, JSON.stringify(r));
p('Mit Änderung und abgelaufenem Takt schon',
  r.neu === true && Math.round(r.wert) === 4242 * 999, JSON.stringify(r));

console.log('\n— Ausschalten räumt auf —');
r = await seite.evaluate(async (x: any) => {
  Vorrat.ausschalten(x.coll);
  const c = Store.getCollection(x.coll);
  const z = Store.rowsOf(x.coll)[0];
  Tempo.veraendert();
  await new Promise(r2 => setTimeout(r2, 200));
  const gespeichert = await Store.vorratHolen(x.coll);
  return { aktiv: Vorrat.aktiv(x.coll), stand: Vorrat.stand(x.coll),
           gespeichert: !!gespeichert,
           wert: Math.round(Datenbank.wert(z, 'mwst', c)), betrag: z.props.betrag };
}, bau);
p('Danach ist er aus',              r.aktiv === false && r.stand === null, JSON.stringify(r));
p('Der gespeicherte Stand ist weg', r.gespeichert === false, JSON.stringify(r));
p('Und es wird wieder frisch gerechnet',
  r.wert === Math.round(r.betrag * 999), JSON.stringify(r));

console.log('\n— Das Fenster —');
await seite.evaluate((x: any) => Vorrat.fenster(x.coll), bau);
await seite.waitForTimeout(250);
p('Es erklärt den Handel',
  await seite.locator('.overlay').filter({ hasText: 'eine Weile veraltet' }).count() > 0);
p('Und nennt die Zahlen',
  await seite.locator('.overlay').filter({ hasText: 'Rechnungen bei jedem Öffnen' }).count() > 0);
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 49 — Vorrat: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
