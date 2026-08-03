/* Suite 44 — Spaltenrechte in der Oberfläche (der Zaun vor der Sperre) */
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
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Feldrechte !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(700);

console.log('\n— Ohne Konto gilt nichts —');
let r = await seite.evaluate(() => ({
  kraft: Feldrechte.inKraft(),
  stufe: Feldrechte.stufe('slg1', 'gehalt'),
  schreiben: Feldrechte.darfSchreiben('slg1', 'gehalt')
}));
p('Ohne Server keine Sperre', r.kraft === false && r.stufe === 'voll' && r.schreiben === true,
  JSON.stringify(r));

console.log('\n— Mit einer Karte —');
r = await seite.evaluate(() => {
  Store.setMeta('feldrechteMeins', { slg1: { gehalt: 'lesen', geheim: 'kein' } });
  const raus = {
    kraft: Feldrechte.inKraft(),
    gehalt: Feldrechte.stufe('slg1', 'gehalt'),
    geheim: Feldrechte.stufe('slg1', 'geheim'),
    offen:  Feldrechte.stufe('slg1', 'name'),
    sehenGehalt: Feldrechte.darfSehen('slg1', 'gehalt'),
    sehenGeheim: Feldrechte.darfSehen('slg1', 'geheim'),
    schreibGehalt: Feldrechte.darfSchreiben('slg1', 'gehalt'),
    zeichenGehalt: Feldrechte.zeichen('slg1', 'gehalt'),
    zeichenOffen: Feldrechte.zeichen('slg1', 'name')
  };
  Store.setMeta('feldrechteMeins', {});
  return raus;
});
p('Eine Karte vom Server tritt in Kraft', r.kraft === true, JSON.stringify(r));
p('Nur-lesen erkannt',        r.gehalt === 'lesen' && r.sehenGehalt && !r.schreibGehalt, JSON.stringify(r));
p('Gar-nicht erkannt',        r.geheim === 'kein' && r.sehenGeheim === false, JSON.stringify(r));
p('Nicht Eingetragenes ist offen', r.offen === 'voll' && r.zeichenOffen === '', JSON.stringify(r));
p('Gesperrtes bekommt ein Schloss', r.zeichenGehalt === '🔒', r.zeichenGehalt);

console.log('\n— Der Zaun in setProp —');
r = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Rechte-Test' });
  const db = Store.addDatabase(s.id, 'Leute', {
    title: { name: 'Name', type: 'title' },
    gehalt: { name: 'Gehalt', type: 'number' },
    ort: { name: 'Ort', type: 'text' } });
  const c = Store.getCollection(db.collectionId);
  const z = Store.addRow(c.id, { title: 'Anna', gehalt: 9000, ort: 'Zürich' });

  Store.setMeta('feldrechteMeins', { [c.id]: { gehalt: 'lesen' } });

  Store.setProp(z.id, 'gehalt', 1);
  Store.setProp(z.id, 'ort', 'Bern');
  const nach = { ...Store.getBlock(z.id).props };

  Store.setMeta('feldrechteMeins', {});
  return { nach, coll: c.id, seite: s.id, zeile: z.id };
});
p('Die gesperrte Spalte bleibt stehen', r.nach.gehalt === 9000, JSON.stringify(r.nach));
p('Die offene lässt sich ändern',       r.nach.ort === 'Bern', JSON.stringify(r.nach));

console.log('\n— Das Fenster —');
await seite.evaluate((id) => Feldrechte.fenster(id), r.coll);
await seite.waitForTimeout(300);
p('Fenster erklärt, dass es einen Server braucht',
  await seite.locator('.overlay').filter({ hasText: 'brauchen einen Server' }).count() > 0);
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

console.log('\n— Der Weg über das Spaltenmenü —');
const menue = await seite.evaluate((x) => {
  const coll = Store.getCollection(x.coll);
  const view = Store.getView(coll.viewIds[0]);
  const anker = document.createElement('button');
  document.body.appendChild(anker);
  Datenbank.spaltenMenue(anker, coll, view, 'gehalt', null);
  const m = document.querySelector('.menu, .ctx, [class*="menu"]');
  const hat = !!document.querySelector('[data-a="feldrechte"]');
  document.querySelectorAll('.menu, .ctx').forEach(e => e.remove());
  anker.remove();
  return hat;
}, r);
p('Im Spaltenmenü steht „Rechte für diese Spalte"', menue === true);

console.log('\n— Der Helfer für die Befehlspalette —');
const slg = await seite.evaluate((x) => Datenbank.sammlungAufSeite(x.seite), r);
p('Die Sammlung einer Seite wird gefunden', slg === r.coll, String(slg));

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 44 — Spaltenrechte: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
