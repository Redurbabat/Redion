/* Suite 47 — Prüfsätze: „wenn … dann" als ausführbarer Satz */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler = [];
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Pruefsatz !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(700);

const bau = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Prüfsatz-Test' });
  const db = Store.addDatabase(s.id, 'Rechnungen', {
    title:  { name: 'Titel',  type: 'title' },
    betrag: { name: 'Betrag', type: 'number' },
    land:   { name: 'Land',   type: 'text' },
    mwst:   { name: 'MwSt',   type: 'formula',
              formula: 'if(prop("Land") == "CH", prop("Betrag") * 0.081, 0)' },
    stufe:  { name: 'Stufe',  type: 'formula',
              formula: 'if(prop("Betrag") > 1000, "gross", "klein")' }
  });
  const c = Store.getCollection(db.collectionId);
  const z = Store.addRow(c.id, { title: 'R1', betrag: 100, land: 'CH' });
  Store.updateCollection(c.id, { automationen: [{
    name: 'Grosse melden', ausloeser: 'aenderung',
    bedingungen: [{ art: 'wert-groesser', key: 'betrag', wert: 1000 }],
    aktionen: [{ art: 'setzen', key: 'land', wert: 'X' }] }] });
  return { seite: s.id, coll: c.id, zeile: z.id };
});

console.log('\n— Ein Prüfsatz von Hand —');
let r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  const s = Pruefsatz.anlegen(c, { name: 'Schweizer MwSt', spalte: 'mwst',
    gegeben: { betrag: 100, land: 'CH' }, vergleich: 'gleich', erwartet: '8.1' });
  return { erg: Pruefsatz.laufe(Store.getCollection(x.coll), s), id: s.id };
}, bau);
p('Er stimmt', r.erg.ok === true, JSON.stringify(r.erg));
p('Der Satz liest sich als Satz',
  /^Wenn Betrag = 100 und Land = CH, dann MwSt ist gleich 8\.1$/.test(r.erg.text), r.erg.text);

r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  const s = Pruefsatz.anlegen(c, { name: 'Falsch', spalte: 'mwst',
    gegeben: { betrag: 100, land: 'CH' }, vergleich: 'gleich', erwartet: '99' });
  const e = Pruefsatz.laufe(Store.getCollection(x.coll), s);
  Pruefsatz.loeschen(Store.getCollection(x.coll), s.id);
  return e;
}, bau);
p('Ein falscher Prüfsatz fällt durch', r.ok === false, JSON.stringify(r));
p('Und sagt, was herauskam',           r.ist === '8.1', r.ist);

console.log('\n— Die Vergleiche —');
r = await seite.evaluate(() => {
  const t = Pruefsatz.trifftZu;
  return {
    gleich:   t('gleich', 8.1, '8.1'),
    ungleich: t('ungleich', 8.1, '9'),
    enthaelt: t('enthaelt', 'grosser Betrag', 'BETRAG'),
    groesser: t('groesser', 10, '5'),
    kleiner:  t('kleiner', 5, '10'),
    leer:     t('leer', '', ''),
    nichtLeer: t('leer', 'x', ''),
    fehler:   t('fehler', '⚠ kaputt', '')
  };
});
p('gleich, ungleich, enthält',
  r.gleich && r.ungleich && r.enthaelt, JSON.stringify(r));
p('grösser, kleiner',  r.groesser && r.kleiner, JSON.stringify(r));
p('leer und Fehler',   r.leer && !r.nichtLeer && r.fehler, JSON.stringify(r));

console.log('\n— Aus einer echten Zeile festhalten —');
r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  const s = Pruefsatz.ausZeile(c, x.zeile, 'mwst');
  return { satz: s, erg: Pruefsatz.laufe(Store.getCollection(x.coll), s),
           zutaten: Pruefsatz.zutaten(c, 'mwst') };
}, bau);
p('Nur die Zutaten der Formel werden abgeschrieben',
  r.zutaten.sort().join(',') === 'betrag,land', JSON.stringify(r.zutaten));
p('Das Erwartete kommt aus der Zeile', r.satz.erwartet === '8.1', r.satz.erwartet);
p('Und stimmt sofort',                 r.erg.ok === true, JSON.stringify(r.erg));

console.log('\n— Eine kaputte Formel fällt auf —');
r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  c.schema.mwst.formula = 'prop("Betrag") * 0.20';       /* jemand ändert den Satz */
  Store.updateCollection(c.id, { schema: c.schema });
  const alles = Pruefsatz.alleLaufen(Store.getCollection(x.coll));
  return { gesamt: alles.gesamt, schlecht: alles.schlecht,
           erster: alles.ergebnisse[0] };
}, bau);
p('Die Änderung wird sofort bemerkt', r.schlecht >= 1, JSON.stringify(r));
p('Mit dem neuen, falschen Ergebnis', r.erster.ist === '20', r.erster.ist);

r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  c.schema.mwst.formula = 'if(prop("Land") == "CH", prop("Betrag") * 0.081, 0)';
  Store.updateCollection(c.id, { schema: c.schema });
  return Pruefsatz.alleLaufen(Store.getCollection(x.coll)).schlecht;
}, bau);
p('Zurückgedreht stimmt wieder alles', r === 0, String(r));

console.log('\n— Automationen —');
r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  const a = Pruefsatz.anlegen(c, { name: 'Gross greift', art: 'automation', index: 0,
    gegeben: { betrag: 5000 }, vergleich: 'trifft' });
  const b = Pruefsatz.anlegen(Store.getCollection(x.coll),
    { name: 'Klein greift nicht', art: 'automation', index: 0,
      gegeben: { betrag: 10 }, vergleich: 'trifftNicht' });
  const c2 = Store.getCollection(x.coll);
  return { gross: Pruefsatz.laufe(c2, a), klein: Pruefsatz.laufe(c2, b) };
}, bau);
p('Bei 5000 greift die Automation', r.gross.ok === true && r.gross.ist === 'greift',
  JSON.stringify(r.gross));
p('Bei 10 greift sie nicht',        r.klein.ok === true, JSON.stringify(r.klein));

console.log('\n— Nichts wird angefasst —');
r = await seite.evaluate((x) => {
  const z = Store.getBlock(x.zeile);
  const anzahl = Store.rowsOf(x.coll).length;
  return { land: z.props.land, betrag: z.props.betrag, anzahl };
}, bau);
p('Die echte Zeile ist unverändert',
  r.land === 'CH' && r.betrag === 100 && r.anzahl === 1, JSON.stringify(r));

console.log('\n— Eine gelöschte Spalte —');
r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  const s = Pruefsatz.anlegen(c, { name: 'Weg', spalte: 'gibtsnicht',
    gegeben: {}, vergleich: 'gleich', erwartet: '1' });
  const e = Pruefsatz.laufe(Store.getCollection(x.coll), s);
  Pruefsatz.loeschen(Store.getCollection(x.coll), s.id);
  return e;
}, bau);
p('… wird gemeldet statt zu krachen',
  r.ok === false && /gibt es nicht mehr/.test(r.text), JSON.stringify(r));

console.log('\n— Im Gesundheitsbericht —');
r = await seite.evaluate((x) => {
  const c = Store.getCollection(x.coll);
  c.schema.stufe.formula = '"immer klein"';
  Store.updateCollection(c.id, { schema: c.schema });
  Pruefsatz.anlegen(Store.getCollection(x.coll), { name: 'Gross ist gross', spalte: 'stufe',
    gegeben: { betrag: 5000 }, vergleich: 'gleich', erwartet: 'gross' });
  const befunde = Pflege.befund();
  return befunde.filter(b => /Prüfsätze/.test(b.titel)).map(b => b.titel);
}, bau);
p('Der Bericht meldet die kaputten Prüfsätze',
  r.some(t => /stimmen nicht mehr/.test(t)), JSON.stringify(r));

console.log('\n— Das Fenster —');
await seite.evaluate((x) => Pruefsatz.fenster(x.coll), bau);
await seite.waitForTimeout(300);
p('Es zeigt, wie viele nicht stimmen',
  await seite.locator('.overlay').filter({ hasText: 'stimmen nicht mehr' }).count() > 0);
p('Und listet jeden Satz einzeln',
  await seite.locator('.overlay [data-weg]').count() >= 3);
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

console.log('\n— Der Weg über das Zeilenmenü —');
const menue = await seite.evaluate((x) => {
  const coll = Store.getCollection(x.coll);
  const row = Store.getBlock(x.zeile);
  const anker = document.createElement('button');
  document.body.appendChild(anker);
  Datenbank.zeilenMenue(anker, row, coll, null);
  const hat = !!document.querySelector('[data-a="festhalten"]');
  document.querySelectorAll('.menu, .ctx, .overlay').forEach(e => e.remove());
  anker.remove();
  return hat;
}, bau);
p('„Diesen Fall festhalten" steht im Zeilenmenü', menue === true);

console.log('\n— Nach dem Neuladen —');
await seite.evaluate(() => Store.flush());
await seite.reload();
await seite.waitForFunction(() => typeof App !== 'undefined', null, { timeout: 20000 });
await seite.waitForTimeout(800);
const nach = await seite.evaluate((x) =>
  Pruefsatz.alle(Store.getCollection(x.coll)).length, bau);
p('Die Prüfsätze sind noch da', nach >= 3, String(nach));

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 47 — Prüfsätze: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
