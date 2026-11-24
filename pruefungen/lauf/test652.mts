/* test652 — ein flush, der nichts mehr vorfindet, wartet auf den laufenden (E809)
 *
 * Ein früherer Durchgang hat die Sätze schon genommen und schreibt noch.
 * Ein zweiter `flush` fand nichts vor und meldete „gespeichert", bevor die
 * Transaktion auf der Platte war. Ein Neuladen dazwischen verlor die Seite:
 * gemessen auf dem Stand vor E809 in 9 von 10 Fällen.
 *
 * Der Lauf zählt, was NACH dem Neuladen in der Datenbank steht — mit einer
 * eigenen Verbindung, nicht über die Ablage, damit er den Weg nicht
 * mitbenutzt, den er prüft.
 *
 * Gegenprobe: die gebaute Datei von vor E809 (`git show HEAD:…indexdb.js`)
 * macht den Lauf rot.
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
const RUNDEN = 10;
let gespeichert = 0;
const fehler: string[] = [];
for (let i = 0; i < RUNDEN; i++) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(2200);
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
  });
  const id = await p.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Zwei Flush ' + Date.now() });
    Store.addBlock(seite.id, 'pdfseite', { text: 'Seite 1' });
    App.oeffne(seite.id);
    Store.flush();          /* der erste Durchgang läuft noch … */
    await Store.flush();    /* … der zweite findet nichts mehr vor und darf nicht früher sein */
    return seite.id;
  });
  await p.evaluate(() => { location.hash = ''; });
  await p.reload();
  await p.waitForTimeout(2600);
  const drin = await p.evaluate(async (id: string) => {
    const namen = (await indexedDB.databases()).map(d => d.name).filter((n): n is string => !!n);
    const name = namen.find(n => /notiz/i.test(n));
    if (!name) return false;
    const db = await new Promise<IDBDatabase>((ok, no) => {
      const r = indexedDB.open(name); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    });
    const satz = await new Promise<any>(ok => {
      const q = db.transaction(['blocks'], 'readonly').objectStore('blocks').get(id);
      q.onsuccess = () => ok(q.result); q.onerror = () => ok(null);
    });
    db.close();
    return !!satz;
  }, id);
  if (drin) gespeichert++;
  await ctx.close();
}
pruef(`nach dem Neuladen steht die Seite in ${RUNDEN} von ${RUNDEN} Fällen auf der Platte`, gespeichert, RUNDEN);
pruef('Keine Skriptfehler', fehler, []);
await b.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
