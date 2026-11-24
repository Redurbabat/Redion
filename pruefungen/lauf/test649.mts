/* test649 — Redion bittet von selbst um dauerhaften Speicher (E805)
 *
 * Ohne `navigator.storage.persist()` darf ein Browser die Ablage bei
 * Platznot räumen, ohne zu fragen. Den Helfer gab es
 * (`AppEinstellung.speicherSichern`), gerufen wurde er nie — nur ein Knopf
 * in den Einstellungen fragte. Gezählt wird mit einem Init-Skript, das
 * `persist` und `persisted` umwickelt; `persisted()` meldet „nein", damit
 * `speicherSichern` wirklich bis `persist()` durchgeht.
 */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: string, ist: unknown, soll: unknown) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.addInitScript(() => {
  (window as any).__persist = 0;
  if (navigator.storage) {
    navigator.storage.persist = async () => { (window as any).__persist++; return false; };
    navigator.storage.persisted = async () => false;
  }
});
const p = await ctx.newPage();
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('JS: ' + e.message));
const laden = async () => {
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
};
await p.goto('file://' + WURZEL + '/index.html');
await laden();
/* Was der Start selbst schreibt, zählt schon als erstes Schreiben. */
await p.evaluate(async () => { try { localStorage.removeItem('redion:speicher-dauerhaft:gefragt'); } catch {} });

/* --- 1 · Neue Sitzung ohne Merker: genau eine Bitte ------------------- */
await p.reload();
await laden();
const r1 = await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Dauerhaft E805' });
  await Store.flush();
  await new Promise(r => setTimeout(r, 200));
  const nachErstem = (window as any).__persist;
  for (let i = 0; i < 3; i++) { Store.updateBlock(s.id, { text: 'Dauerhaft ' + i }); await Store.flush(); }
  await new Promise(r => setTimeout(r, 200));
  return { nachErstem, nachVier: (window as any).__persist };
});
pruef('§1 nach dem ersten Schreiben bittet Redion um dauerhaften Speicher', r1.nachErstem, 1);
pruef('§1 weitere Schreibvorgänge bitten nicht noch einmal', r1.nachVier, 1);

/* --- 2 · Nächste Sitzung innerhalb von 30 Tagen: keine Bitte ---------- */
await p.reload();
await laden();
const r2 = await p.evaluate(async () => {
  Store.addPage(null, { text: 'Zweite Sitzung' });
  await Store.flush();
  await new Promise(r => setTimeout(r, 200));
  return (window as any).__persist;
});
pruef('§2 in der nächsten Sitzung keine neue Bitte (30 Tage Abstand)', r2, 0);

/* --- 3 · Nach 30 Tagen wieder ------------------------------------------ */
await p.evaluate(() => { localStorage.setItem('redion:speicher-dauerhaft:gefragt', String(Date.now() - 31 * 24 * 3600 * 1000)); });
await p.reload();
await laden();
const r3 = await p.evaluate(async () => {
  Store.addPage(null, { text: 'Einen Monat später' });
  await Store.flush();
  await new Promise(r => setTimeout(r, 200));
  return (window as any).__persist;
});
pruef('§3 nach mehr als 30 Tagen bittet Redion wieder', r3 >= 1, true);

/* --- 4 · Der Merker reist nicht in die Sicherung ----------------------- */
const r4 = await p.evaluate(() => JSON.stringify(Store.exportAll(false)).includes('speicher-dauerhaft'));
pruef('§4 der Merker steht nicht in der Sicherung', r4, false);

pruef('Keine Skriptfehler', fehler, []);
await b.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
