/* Suite 41 — Zusammenführen statt Überschreiben (zusammen.js)
 * Prüft die drei Stufen einzeln und dann den echten Weg über zwei Geräte. */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const REPO = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const browser = await chromium.launch();
const seite = await browser.newPage();
seite.on('pageerror', (e: any) => console.log('  ! Seitenfehler: ' + e.message));
await seite.goto('file://' + REPO + '/index.html');
await seite.waitForFunction(() => typeof App !== "undefined" && typeof Zusammen !== "undefined", null, { timeout: 20000 });
await seite.waitForTimeout(600);

console.log('\n— 1 · Wortweise —');

const t = async (b: any, h: any, d: any) => seite.evaluate(([b, h, d]: [any, any, any]) => Zusammen.textDreiWege(b, h, d), [b, h, d]);

let r = await t('Der Hund läuft', 'Der grosse Hund läuft', 'Der Hund läuft schnell');
p('beide an verschiedenen Stellen → beides bleibt',
  r.text === 'Der grosse Hund läuft schnell' && !r.konflikt, JSON.stringify(r));

r = await t('Der Hund läuft', 'Die Katze läuft', 'Der Vogel läuft');
p('beide dasselbe Wort → Konflikt', r.konflikt === true, JSON.stringify(r));

r = await t('a b c', 'a b c', 'a b c d');
p('nur einer geändert → seine Fassung', r.text === 'a b c d' && !r.konflikt, JSON.stringify(r));

r = await t('a b c', 'x a b c', 'a b c');
p('nur hier geändert → hier', r.text === 'x a b c' && !r.konflikt, JSON.stringify(r));

r = await t('a b c', 'a b', 'a b c d');
p('einer löscht c, einer hängt d an → beide Absichten bleiben',
  r.text === 'a b d' && !r.konflikt, JSON.stringify(r));

r = await t('eins zwei drei vier fünf', 'EINS zwei drei vier fünf', 'eins zwei drei vier FÜNF');
p('Anfang und Ende getrennt geändert',
  r.text === 'EINS zwei drei vier FÜNF' && !r.konflikt, JSON.stringify(r));

r = await t('', 'links', 'rechts');
p('beide schreiben in einen leeren Text → Konflikt oder beides',
  r.konflikt || r.text.includes('links'), JSON.stringify(r));

r = await t('Zeile eins\nZeile zwei', 'Zeile eins geändert\nZeile zwei',
            'Zeile eins\nZeile zwei geändert');
p('Zeilenumbrüche bleiben erhalten',
  r.text === 'Zeile eins geändert\nZeile zwei geändert' && !r.konflikt, JSON.stringify(r));

console.log('\n— 2 · Listenweise —');

const l = async (b: any, h: any, d: any) => seite.evaluate(([b, h, d]: [any, any, any]) => Zusammen.listeDreiWege(b, h, d), [b, h, d]);

r = await l(['a', 'b', 'c'], ['a', 'b', 'c', 'd'], ['a', 'c']);
p('einer hängt an, einer löscht → beides',
  JSON.stringify(r.liste) === JSON.stringify(['a', 'c', 'd']) && !r.konflikt, JSON.stringify(r));

r = await l(['a', 'b'], ['a', 'x', 'b'], ['a', 'b', 'y']);
p('an zwei Stellen eingefügt',
  JSON.stringify(r.liste) === JSON.stringify(['a', 'x', 'b', 'y']) && !r.konflikt, JSON.stringify(r));

r = await l(['a', 'b', 'c'], ['c', 'b', 'a'], ['b', 'a', 'c']);
p('beide sortieren verschieden um → Konflikt', r.konflikt === true, JSON.stringify(r));

r = await l(['a', 'b', 'c'], ['c', 'b', 'a'], ['a', 'b', 'c']);
p('nur einer sortiert um → seine Reihenfolge',
  JSON.stringify(r.liste) === JSON.stringify(['c', 'b', 'a']) && !r.konflikt, JSON.stringify(r));

r = await l([], ['a'], ['b']);
p('beide fügen in eine leere Liste ein → beides',
  r.liste.length === 2, JSON.stringify(r));

console.log('\n— 3 · Feldweise —');

const d3 = async (b: any, h: any, d: any) => seite.evaluate(([b, h, d]: [any, any, any]) => {
  const r = Zusammen.dreiWege(b, h, d);
  return { satz: r.satz, konflikte: r.konflikte.map((k: any) => k.feld), zus: r.zusammengefuehrt };
}, [b, h, d]);

r = await d3({ id: '1', text: 'Titel', props: { a: 1, b: 2 } },
             { id: '1', text: 'Titel', props: { a: 9, b: 2 } },
             { id: '1', text: 'Titel', props: { a: 1, b: 8 } });
p('A ändert eine Eigenschaft, B eine andere → beides',
  r.satz.props.a === 9 && r.satz.props.b === 8 && !r.konflikte.length, JSON.stringify(r));

r = await d3({ id: '1', props: { a: 1 } }, { id: '1', props: { a: 2 } }, { id: '1', props: { a: 3 } });
p('beide dieselbe Eigenschaft → Konflikt, eigener Wert bleibt',
  r.konflikte.length === 1 && r.satz.props.a === 2, JSON.stringify(r));

r = await d3({ id: '1', edited: '2026-01-01', text: 'x' },
             { id: '1', edited: '2026-02-01', text: 'x hier' },
             { id: '1', edited: '2026-03-01', text: 'x' });
p('Zeitstempel ist nie ein Konflikt',
  r.satz.edited === '2026-03-01' && !r.konflikte.length, JSON.stringify(r));

r = await d3({ id: '1', content: ['a', 'b'] },
             { id: '1', content: ['a', 'b', 'c'] },
             { id: '1', content: ['a', 'b', 'd'] });
p('beide hängen einen Block an → beide Blöcke',
  JSON.stringify(r.satz.content) === JSON.stringify(['a', 'b', 'c', 'd']), JSON.stringify(r));

r = await d3(null, { id: '1', text: 'a', edited: '2' }, { id: '1', text: 'b', edited: '3' });
p('ohne gemeinsamen Stand → ehrlicher Konflikt statt stiller Wahl',
  r.konflikte.length === 1 && r.satz.text === 'b', JSON.stringify(r));

r = await d3({ id: '1', schema: { s1: { name: 'Preis', type: 'number' } } },
             { id: '1', schema: { s1: { name: 'Preis', type: 'text' } } },
             { id: '1', schema: { s1: { name: 'Kosten', type: 'number' } } });
p('Spaltenname hier, Spaltentyp dort → beides',
  r.satz.schema.s1.name === 'Kosten' && r.satz.schema.s1.type === 'text' && !r.konflikte.length,
  JSON.stringify(r));

r = await d3({ id: '1', a: 1 }, { id: '1', a: 1 }, { id: '1', a: 1, neu: 5 });
p('neues Feld nur dort → kommt durch', r.satz.neu === 5 && !r.konflikte.length, JSON.stringify(r));

r = await d3({ id: '1', a: 1, weg: 2 }, { id: '1', a: 1 }, { id: '1', a: 1, weg: 2 });
p('Feld hier gelöscht → bleibt gelöscht', !('weg' in r.satz), JSON.stringify(r));

console.log('\n— 4 · Konfliktliste und Fenster —');

const kl = await seite.evaluate(() => {
  Store.setMeta('konflikte', []);
  const b = Store.addPage(null, { text: 'meine Fassung' });
  Zusammen.merke(b.id, 'blocks', [{ pfad: ['text'], feld: 'Text',
    hier: 'meine Fassung', dort: 'andere Fassung', grund: 'Test' }]);
  /* Zweimal derselbe Konflikt darf die Liste nicht verdoppeln */
  Zusammen.merke(b.id, 'blocks', [{ pfad: ['text'], feld: 'Text',
    hier: 'meine Fassung', dort: 'andere Fassung', grund: 'Test' }]);
  return { n: Zusammen.offene().length, id: b.id };
});
p('derselbe Konflikt zweimal bleibt einer', kl.n === 1, JSON.stringify(kl));

await seite.evaluate(() => Zusammen.dialog());
await seite.waitForTimeout(200);
p('Fenster zeigt beide Fassungen',
  await seite.locator('.overlay').filter({ hasText: 'andere Fassung' }).count() > 0);
p('Fenster hat beide Knöpfe',
  await seite.locator('.overlay button[data-w="dort"]').count() === 1 &&
  await seite.locator('.overlay button[data-w="hier"]').count() === 1);

await seite.locator('.overlay button[data-w="dort"]').first().click();
await seite.waitForTimeout(200);
const nach = await seite.evaluate(() => ({
  n: Zusammen.offene().length,
  text: Object.values(Store.cache.blocks).find((b: any) => b.text === 'andere Fassung') ? 'ja' : 'nein'
}));
p('Wahl „die andere" schreibt den Wert wirklich in die Seite',
  nach.n === 0 && nach.text === 'ja', JSON.stringify(nach));
await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

console.log('\n— 5 · Basis-Speicher überlebt den Neustart —');

const bid = await seite.evaluate(async () => {
  const id = 'test-basis-1';
  await Store.basisPut(id, { id, text: 'Stand vom Server' });
  await Store.flush();
  return id;
});
await seite.reload();
await seite.waitForFunction(() => typeof App !== "undefined" && typeof Zusammen !== "undefined", null, { timeout: 20000 });
await seite.waitForTimeout(500);
const gelesen = await seite.evaluate((id: string) => Store.basisHolen(id), bid);
p('gemerkter Stand ist nach dem Neuladen noch da',
  gelesen && gelesen.text === 'Stand vom Server', JSON.stringify(gelesen));

const speicher = await seite.evaluate(() => new Promise(ok => {
  const r = indexedDB.open('notizen');
  r.onsuccess = () => { const d = r.result;
    ok({ v: d.version, hat: [...d.objectStoreNames] }); d.close(); };
  r.onerror = () => ok(null);
}));
p('Die Ablage kennt den gemeinsamen Stand',
  speicher && speicher.v >= 4 && speicher.hat.includes('basis'), JSON.stringify(speicher));

console.log('\n— 6 · rohSetzen schreibt wirklich —');
const rs = await seite.evaluate(async () => {
  const b = Store.addPage(null, { text: 'Roh-Test' });
  const satz = { ...b, text: 'vom Server geholt', edited: '2020-01-01' };
  Store.rohSetzen('blocks', satz);
  await Store.flush();
  return { id: b.id, edited: Store.cache.blocks[b.id].edited };
});
p('rohSetzen fasst den Zeitstempel nicht an', rs.edited === '2020-01-01', rs.edited);
await seite.reload();
await seite.waitForFunction(() => typeof App !== "undefined", null, { timeout: 20000 });
await seite.waitForTimeout(500);
const ueberlebt = await seite.evaluate((id: string) => {
  const b = Store.cache.blocks[id];
  return b ? b.text : null;
}, rs.id);
p('mit rohSetzen geschriebener Satz überlebt das Neuladen',
  ueberlebt === 'vom Server geholt', String(ueberlebt));

console.log('\n— 7 · Grosse Texte —');
const gross = await seite.evaluate(() => {
  /* `x` ist ein Zusatz ans Wortende und wird hier nie mitgegeben — deshalb
     optional statt verlangt. */
  const w = (n: any, x?: any) => Array.from({ length: n }, (_, i) => 'w' + i + (x || '')).join(' ');
  const t0 = performance.now();
  const r = Zusammen.textDreiWege(w(1200), w(1200) + ' ende', 'anfang ' + w(1200));
  return { ms: performance.now() - t0, konflikt: r.konflikt, laenge: r.text.length };
});
p('1200 Wörter zusammenführen unter 1500 ms', gross.ms < 1500, gross.ms.toFixed(0) + ' ms');
p('grosser Text wird wirklich zusammengeführt', !gross.konflikt, JSON.stringify(gross));

const riesig = await seite.evaluate(() => {
  const w = (n: any) => Array.from({ length: n }, (_, i) => 'w' + i).join(' ');
  return Zusammen.textDreiWege(w(5000), w(5000) + ' a', 'b ' + w(5000)).konflikt;
});
p('über der Grenze lieber ehrlich Konflikt als Einfrieren', riesig === true);

await browser.close();
console.log('\n=========================================');
console.log(`  Suite 41 — Zusammenführen: ${ok} ok, ${weg} offen`);
console.log('=========================================');
process.exit(weg ? 1 : 0);
