/* Suite 45 — Probelauf: erst zeigen, was passieren würde */
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
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Probelauf !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(700);

/* --- Ein Aufbau, an dem wirklich etwas hängt --------------------------- */
const bau = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Probelauf-Test' });
  const db = Store.addDatabase(s.id, 'Rechnungen', {
    title:  { name: 'Titel',  type: 'title' },
    betrag: { name: 'Betrag', type: 'number' },
    datum:  { name: 'Datum',  type: 'date' },
    mwst:   { name: 'MwSt',   type: 'formula', formula: 'prop("Betrag") * 0.081' },
    frei:   { name: 'Frei',   type: 'text' }
  });
  const c = Store.getCollection(db.collectionId);
  for (let i = 0; i < 12; i++)
    Store.addRow(c.id, { title: 'R' + i, betrag: 100 + i, datum: '2026-08-0' + (i % 9 + 1) });

  /* Eine Ansicht, die auf Betrag filtert, danach sortiert und gruppiert */
  const v = Store.getView(c.viewIds[0]);
  Store.updateView(v.id, {
    filters: { operator: 'and', rules: [{ key: 'betrag', op: '>', wert: 100 }] },
    sorts: [{ key: 'betrag', richtung: 'auf' }],
    groupBy: 'betrag'
  });

  /* Eine Automation, die den Betrag anfasst */
  Store.updateCollection(c.id, { automationen: [{
    name: 'Alles auf null', ausloeser: 'manuell',
    bedingungen: [], aktionen: [{ art: 'setzen', key: 'betrag', wert: '0' }] }] });

  return { seite: s.id, coll: c.id, view: v.id };
});

console.log('\n— Wer benutzt die Spalte? —');
let r = await seite.evaluate((x: any) => {
  const coll = Store.getCollection(x.coll);
  const n = Probelauf.nutzerDerSpalte(coll, 'betrag');
  return { formeln: n.formeln.length, filter: n.filter.length,
           sortierung: n.sortierung.length, gruppen: n.gruppen.length,
           automationen: n.automationen.length };
}, bau);
p('Die Formel wird gefunden',      r.formeln === 1, JSON.stringify(r));
p('Der Filter wird gefunden',      r.filter === 1, JSON.stringify(r));
p('Die Sortierung wird gefunden',  r.sortierung === 1, JSON.stringify(r));
p('Die Gruppierung wird gefunden', r.gruppen === 1, JSON.stringify(r));
p('Die Automation wird gefunden',  r.automationen === 1, JSON.stringify(r));

r = await seite.evaluate((x: any) => {
  const coll = Store.getCollection(x.coll);
  const n = Probelauf.nutzerDerSpalte(coll, 'frei');
  return Object.values(n).reduce((a, b) => a + b.length, 0);
}, bau);
p('Eine unbenutzte Spalte findet niemanden', r === 0, String(r));

console.log('\n— Spalte löschen —');
r = await seite.evaluate((x: any) => {
  const plan = Probelauf.fuer({ art: 'spalteWeg', coll: x.coll, key: 'betrag' });
  return { titel: plan.titel, arten: plan.befunde.map(b => b.schwere),
           texte: plan.befunde.map(b => b.text), lohnt: Probelauf.lohntSich(plan) };
}, bau);
p('Der Titel nennt die Spalte',   /Betrag/.test(r.titel), r.titel);
p('Der Datenverlust wird gezählt',
  r.texte.some((t: any) => /12 von 12 Zeilen/.test(t)), JSON.stringify(r.texte));
p('Die Formel wird als Bruch gemeldet',
  r.texte.some((t: any) => /Formel/.test(t)), JSON.stringify(r.texte));
p('Es lohnt sich zu fragen', r.lohnt === true);

r = await seite.evaluate((x: any) => {
  const plan = Probelauf.fuer({ art: 'spalteWeg', coll: x.coll, key: 'frei' });
  return { lohnt: Probelauf.lohntSich(plan), n: plan.befunde.length };
}, bau);
p('Eine leere, unbenutzte Spalte fragt nicht nach', r.lohnt === false, JSON.stringify(r));

r = await seite.evaluate((x: any) => {
  const plan = Probelauf.fuer({ art: 'spalteWeg', coll: x.coll, key: 'title' });
  return plan.befunde.some(b => /Titelspalte/.test(b.text));
}, bau);
p('Die Titelspalte wird geschützt', r === true);

console.log('\n— Typ ändern —');
r = await seite.evaluate((x: any) => {
  const c = Store.getCollection(x.coll);
  Store.rowsOf(c.id).slice(0, 3).forEach(z => Store.setProp(z.id, 'frei', 'kein Datum'));
  Store.rowsOf(c.id).slice(3, 6).forEach(z => Store.setProp(z.id, 'frei', '2026-01-01'));
  const plan = Probelauf.fuer({ art: 'spalteTyp', coll: x.coll, key: 'frei', neuerTyp: 'date' });
  return plan.befunde.map(b => b.text);
}, bau);
p('Unpassende Werte werden gezählt',
  r.some((t: any) => /3 von 12 Werten passen nicht/.test(t)), JSON.stringify(r));

r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'spalteTyp', coll: x.coll, key: 'betrag', neuerTyp: 'text' })
    .befunde.map(b => b.text), bau);
p('Nach Text passt alles', r.some((t: any) => /Alle Werte passen/.test(t)), JSON.stringify(r));

r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'spalteTyp', coll: x.coll, key: 'mwst', neuerTyp: 'number' })
    .befunde.map(b => b.text), bau);
p('Beim Formeltyp wird der Verlust der Formel genannt',
  r.some((t: any) => /Formel selbst geht verloren/.test(t)), JSON.stringify(r));

console.log('\n— Umbenennen —');
r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'spalteName', coll: x.coll, key: 'betrag', neuerName: 'Summe' })
    .befunde.map(b => b.text), bau);
p('Betroffene Formeln werden genannt', r.some((t: any) => /Formel/.test(t)), JSON.stringify(r));

r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'spalteName', coll: x.coll, key: 'betrag', neuerName: 'Datum' })
    .befunde.map(b => b.text), bau);
p('Ein doppelter Name wird gemeldet', r.some((t: any) => /bereits eine Spalte/.test(t)), JSON.stringify(r));

r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'spalteName', coll: x.coll, key: 'frei', neuerName: 'Notiz' })
    .befunde.map(b => b.text), bau);
p('Ohne Formeln heisst es gefahrlos', r.some((t: any) => /gefahrlos/.test(t)), JSON.stringify(r));

console.log('\n— Seite löschen —');
r = await seite.evaluate((x: any) => {
  const plan = Probelauf.fuer({ art: 'seiteWeg', id: x.seite });
  return { titel: plan.titel, texte: plan.befunde.map(b => b.text) };
}, bau);
p('Die Unterstruktur wird gezählt',
  r.texte.some((t: any) => /Blöcke darunter/.test(t) && /1 Datenbanken/.test(t) && /12 Zeilen/.test(t)),
  JSON.stringify(r.texte));
p('Der Papierkorb wird erwähnt',
  r.texte.some((t: any) => /Papierkorb/.test(t)), JSON.stringify(r.texte));

console.log('\n— Ansicht löschen —');
r = await seite.evaluate((x: any) =>
  Probelauf.fuer({ art: 'ansichtWeg', view: x.view }).befunde.map(b => b.text), bau);
p('Die letzte Ansicht wird als Bruch gemeldet',
  r.some((t: any) => /letzte Ansicht/.test(t)), JSON.stringify(r));
p('Verlorene Einstellungen werden aufgezählt',
  r.some((t: any) => /Filterregeln/.test(t)), JSON.stringify(r));

console.log('\n— Automation trocken —');
r = await seite.evaluate((x: any) => {
  const plan = Probelauf.fuer({ art: 'automation', coll: x.coll, index: 0 });
  return { trocken: plan.trocken, texte: plan.befunde.map(b => b.text) };
}, bau);
p('Der Probelauf ist als trocken markiert', r.trocken === true);
p('Er sagt, wie viele Zeilen betroffen wären',
  r.texte.some((t: any) => /12 von 12 Zeilen/.test(t)), JSON.stringify(r.texte));
p('Und was überschrieben würde',
  r.texte.some((t: any) => /Setzt „Betrag" auf/.test(t)), JSON.stringify(r.texte));

const unveraendert = await seite.evaluate((x: any) =>
  Store.rowsOf(x.coll).filter(z => (z.props || {}).betrag === 0).length, bau);
p('Der Probelauf hat wirklich nichts geändert', unveraendert === 0, String(unveraendert));

console.log('\n— Das Fenster —');
await seite.evaluate((x: any) => { (window as any).__getan = false;
  Probelauf.fenster({ art: 'spalteWeg', coll: x.coll, key: 'betrag' },
    () => { (window as any).__getan = true; }); }, bau);
await seite.waitForTimeout(250);
p('Das Fenster steht',
  await seite.locator('.overlay').filter({ hasText: 'Probelauf' }).count() > 0);
p('Der Knopf heisst „Trotzdem tun"',
  (await seite.locator('.overlay [data-a="los"]').textContent()) === 'Trotzdem tun');

await seite.locator('.overlay [data-a="zu"]').last().click();
await seite.waitForTimeout(200);
let getan = await seite.evaluate(() => !!(window as any).__getan);
p('Abbrechen tut nichts', getan === false);

await seite.evaluate((x: any) => {
  Probelauf.fenster({ art: 'spalteWeg', coll: x.coll, key: 'betrag' },
    () => { (window as any).__getan = true; }); }, bau);
await seite.waitForTimeout(250);
await seite.locator('.overlay [data-a="los"]').click();
await seite.waitForTimeout(200);
getan = await seite.evaluate(() => !!(window as any).__getan);
p('„Trotzdem tun" führt aus', getan === true);

console.log('\n— Der Weg über das Spaltenmenü —');
const gelöscht = await seite.evaluate(async (x: any) => {
  const coll = Store.getCollection(x.coll);
  const view = Store.getView(x.view);
  const anker = document.createElement('button');
  document.body.appendChild(anker);
  Datenbank.spaltenMenue(anker, coll, view, 'datum', null);
  /* Fehlt der Punkt im Menü, prüfen die zwei Zeilen darunter nichts mehr —
     deshalb Abbruch mit Text statt eines stillen Weiterlaufs. */
  const loeschen = document.querySelector<HTMLElement>('[data-a="del"]');
  if (!loeschen) throw new Error('Im Spaltenmenü fehlt der Punkt [data-a="del"]');
  loeschen.click();
  await new Promise(r => setTimeout(r, 250));
  const fenster = document.querySelectorAll('.overlay').length;
  const nochDa = !!Store.getCollection(x.coll).schema.datum;
  document.querySelectorAll('.overlay, .menu, .ctx').forEach(e => e.remove());
  anker.remove();
  return { fenster, nochDa };
}, bau);
p('Löschen öffnet erst den Probelauf', gelöscht.fenster > 0, JSON.stringify(gelöscht));
p('Und löscht noch nichts',             gelöscht.nochDa === true, JSON.stringify(gelöscht));

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 45 — Probelauf: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
