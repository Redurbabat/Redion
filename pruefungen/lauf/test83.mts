/* Suite 48 — Vorlagen mit Fassung und Migration */
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
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Fassung !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(800);

console.log('\n— Eine frische Vorlage trägt ihre Fassung —');
let r = await seite.evaluate(() => {
  const s = Galerie.bauen('projekte');
  /* `bauen` gibt null zurück, wenn es die Vorlage nicht gibt. Dann prüft der
     ganze Lauf danach nichts mehr — also Abbruch mit Text. */
  if (!s) throw new Error('Galerie.bauen("projekte") gab keine Seite zurück');
  return { id: s.id, vorlage: s.vorlage, fassung: s.vorlageFassung,
           jetzige: Fassung.jetzige('projekte') };
});
p('Die Herkunft steht auf der Seite', r.vorlage === 'projekte', JSON.stringify(r));
p('Mit der aktuellen Fassung',        r.fassung === r.jetzige && r.fassung === 2, JSON.stringify(r));
const neu = r.id;

r = await seite.evaluate((_id: string) => Fassung.veraltet().length, neu);
p('Sie hinkt nicht hinterher', r === 0, String(r));

console.log('\n— Eine alte Seite bekommt ein Update —');
r = await seite.evaluate((id: string) => {
  Store.updateBlock(id, { vorlageFassung: 1 });
  /* Die Spalte aus Fassung 2 wieder entfernen, als wäre sie nie da gewesen */
  const c = Fassung.sammlungIn(id, 'Aufgaben');
  delete c.schema.ueber;
  Store.updateCollection(c.id, { schema: c.schema });
  (c.viewIds || []).map((v: any) => Store.getView(v))
    .filter((v: any) => v && v.name === 'Überfällig').forEach((v: any) => Store.removeView(v.id));
  const pl = Fassung.plan(id);
  return { von: pl.von, nach: pl.nach, neu: pl.neu, schon: pl.schon, fehlt: pl.fehlt,
           texte: pl.schritte.map((s: any) => s.text) };
}, neu);
p('Der Plan sieht den Unterschied', r.von === 1 && r.nach === 2, JSON.stringify(r));
p('Zwei neue Schritte',             r.neu === 2 && r.fehlt === 0, JSON.stringify(r));
p('Die Spalte steht im Plan',
  r.texte.some((t: any) => /Überfällig/.test(t)), JSON.stringify(r.texte));

r = await seite.evaluate((id: string) => {
  const c = Fassung.sammlungIn(id, 'Aufgaben');
  const vorher = { spalte: !!c.schema.ueber,
    ansichten: (c.viewIds || []).length,
    zeilen: Store.rowsOf(c.id).length,
    werte: Store.rowsOf(c.id).map(z => z.props.st) };
  const bericht = Fassung.anwenden(id);
  const c2 = Store.getCollection(c.id);
  return { vorher,
    nachher: { spalte: !!c2.schema.ueber,
      formel: c2.schema.ueber && c2.schema.ueber.formula,
      ansichten: (c2.viewIds || []).length,
      zeilen: Store.rowsOf(c2.id).length,
      werte: Store.rowsOf(c2.id).map(z => z.props.st) },
    fassung: Store.getBlock(id).vorlageFassung,
    getan: bericht.bericht.filter((x: any) => x.stand === 'getan').length };
}, neu);
p('Die Spalte ist danach da',   r.nachher.spalte === true, JSON.stringify(r.nachher));
p('Mit der richtigen Formel',   /dateBetween/.test(r.nachher.formel || ''), r.nachher.formel);
p('Eine Ansicht mehr',          r.nachher.ansichten === r.vorher.ansichten + 1, JSON.stringify(r));
p('Die Fassung steht jetzt auf 2', r.fassung === 2, String(r.fassung));
p('Beide Schritte wurden getan', r.getan === 2, String(r.getan));

console.log('\n— Keine Zeile wurde angefasst —');
p('Gleich viele Zeilen', r.vorher.zeilen === r.nachher.zeilen, JSON.stringify(r));
p('Und dieselben Werte',
  JSON.stringify(r.vorher.werte) === JSON.stringify(r.nachher.werte), JSON.stringify(r));

console.log('\n— Zweimal anwenden schadet nicht —');
r = await seite.evaluate((id: string) => {
  Store.updateBlock(id, { vorlageFassung: 1 });
  const b = Fassung.anwenden(id);
  const c = Fassung.sammlungIn(id, 'Aufgaben');
  return { schon: b.bericht.filter((x: any) => x.stand === 'schon').length,
           ansichten: (c.viewIds || []).filter((v: any) => {
             const vv = Store.getView(v); return vv && vv.name === 'Überfällig'; }).length,
           spalten: Object.keys(c.schema).filter(k => k === 'ueber').length };
}, neu);
p('Alles war schon da',            r.schon === 2, JSON.stringify(r));
p('Die Ansicht gibt es nur einmal', r.ansichten === 1, JSON.stringify(r));
p('Die Spalte auch',                r.spalten === 1, JSON.stringify(r));

console.log('\n— Eigene Arbeit wird nicht überschrieben —');
r = await seite.evaluate((id: string) => {
  const c = Fassung.sammlungIn(id, 'Aufgaben');
  c.schema.ueber.formula = 'prop("Aufgabe")';       /* von Hand geändert */
  c.schema.ueber.name = 'Mein Überfällig';
  Store.updateCollection(c.id, { schema: c.schema });
  Store.updateBlock(id, { vorlageFassung: 1 });
  Fassung.anwenden(id);
  const c2 = Store.getCollection(c.id);
  return { formel: c2.schema.ueber.formula, name: c2.schema.ueber.name,
           anzahlSpalten: Object.keys(c2.schema).length };
}, neu);
p('Die von Hand geänderte Formel bleibt', r.formel === 'prop("Aufgabe")', r.formel);
p('Der eigene Name bleibt',               r.name === 'Mein Überfällig', r.name);

console.log('\n— Eine umbenannte Datenbank wird gemeldet —');
r = await seite.evaluate((id: string) => {
  const c = Fassung.sammlungIn(id, 'Aufgaben');
  Store.updateCollection(c.id, { name: 'Ganz anders' });
  Store.updateBlock(id, { vorlageFassung: 1 });
  const pl = Fassung.plan(id);
  Store.updateCollection(c.id, { name: 'Aufgaben' });
  Store.updateBlock(id, { vorlageFassung: 2 });
  return { fehlt: pl.fehlt, text: pl.schritte[0] && pl.schritte[0].text };
}, neu);
p('Beide Schritte melden „nicht zu finden"', r.fehlt === 2, JSON.stringify(r));
p('Mit einem brauchbaren Satz', /von Hand gemacht/.test(r.text || ''), r.text);

console.log('\n— Habit-Tracker —');
r = await seite.evaluate(() => {
  const s = Galerie.bauen('habit');
  if (!s) throw new Error('Galerie.bauen("habit") gab keine Seite zurück');
  Store.updateBlock(s.id, { vorlageFassung: 1 });
  const c = Fassung.sammlungIn(s.id, 'Tagesdaten');
  delete c.schema.wtag;
  Store.updateCollection(c.id, { schema: c.schema });
  (c.viewIds || []).map((v: any) => Store.getView(v))
    .filter((v: any) => v && v.name === 'Monat × Wochentag').forEach((v: any) => Store.removeView(v.id));
  const b = Fassung.anwenden(s.id);
  const c2 = Store.getCollection(c.id);
  const pivot = (c2.viewIds || []).map((v: any) => Store.getView(v))
    .find((v: any) => v && v.name === 'Monat × Wochentag');
  return { spalte: !!c2.schema.wtag, formel: c2.schema.wtag && c2.schema.wtag.formula,
           pivot: pivot && pivot.layout, pivotZeile: pivot && pivot.pivotZeile,
           getan: b.bericht.filter((x: any) => x.stand === 'getan').length, id: s.id };
});
p('Der Wochentag kommt dazu',  r.spalte === true && /formatDate/.test(r.formel || ''), JSON.stringify(r));
p('Die Pivot-Ansicht auch',    r.pivot === 'pivot' && r.pivotZeile === 'wtag', JSON.stringify(r));

console.log('\n— Übersicht und Gesundheitsbericht —');
r = await seite.evaluate((ids: any) => {
  Store.updateBlock(ids.a, { vorlageFassung: 1 });
  const v = Fassung.veraltet();
  const befunde = Pflege.befund().filter(b => /Vorlagen/.test(b.titel));
  return { veraltet: v.length, befund: befunde.map(b => b.titel),
           hatWirkung: befunde.length ? typeof befunde[0]?.wirkung === 'function' : false };
}, { a: neu });
p('Die veraltete Seite wird gefunden', r.veraltet === 1, JSON.stringify(r));
p('Der Gesundheitsbericht meldet sie',
  r.befund.some((t: any) => /neuere Fassung/.test(t)), JSON.stringify(r.befund));
p('Mit einem Knopf zum Anwenden', r.hatWirkung === true);

await seite.evaluate(() => Fassung.uebersicht());
await seite.waitForTimeout(250);
p('Die Übersicht listet sie auf',
  await seite.locator('.overlay [data-s]').count() === 1);
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

await seite.evaluate((id: string) => Fassung.fenster(id), neu);
await seite.waitForTimeout(250);
p('Das Fenster erklärt, dass nur hinzugefügt wird',
  await seite.locator('.overlay').filter({ hasText: 'nur hinzugefügt' }).count() > 0);
p('Und nennt das Warum',
  await seite.locator('.overlay').filter({ hasText: 'wenn man nachrechnet' }).count() > 0);
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

console.log('\n— Ohne Vorlage kein Update —');
r = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Von Hand' });
  return Fassung.plan(s.id);
});
p('Eine selbst gebaute Seite hat keinen Plan', r === null, JSON.stringify(r));

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 48 — Vorlagenfassung: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
