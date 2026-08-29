/* Suite 254 — Der Diagramm-Block bekommt seinen Quellen-Wähler (E247)
 * ============================================================================
 * Der Bild-Abgleich fand: `chartDaten` konnte längst aus einer Datenbank
 * gruppieren und summieren (quelleDb/gruppeNach/messen) — aber KEINE
 * Oberfläche schrieb diese Felder. Der „✎ Daten"-Dialog bot nur
 * Textzeilen an. Jetzt bietet er die Quelle an, und diese Suite drückt
 * die Knöpfe wirklich:
 *
 * §1 DATENBANK ALS QUELLE: wählen, gruppieren, messen — das Diagramm
 *    summiert je Gruppe (Elektrotechnik 5.5+4.5 = 10).
 * §2 ZÄHLEN STATT SUMMIEREN: ohne Messspalte zählt jede Zeile 1.
 * §3 LEBENDIG: eine neue Zeile in der Datenbank erscheint nach dem
 *    Neuzeichnen im Diagramm — keine Kopie, eine Quelle.
 * §4 ZURÜCK ZU HANDDATEN heisst loslassen: `quelleDb` wird geleert,
 *    sonst übertrumpft die Datenbank still die getippten Zeilen.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9015;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};
const server = createServer((q, a) => {
  let pfad = join(WURZEL, decodeURIComponent((q.url || '/').split('?')[0]!));
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad) || !pfad.startsWith(WURZEL)) { a.statusCode = 404; a.end('weg'); return; }
  a.setHeader('Content-Type', TYP[extname(pfad)] || 'application/octet-stream');
  a.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

let ok = 0, weg = 0;
const pr = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await p.goto(`http://localhost:${PORT}/index.html`);
await p.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

const legende = () => p.evaluate(() =>
  [...document.querySelectorAll('.chart-legende span')].map(s => (s.textContent || '').trim()));

console.log('\n1 · Datenbank als Quelle: wählen, gruppieren, messen');
await p.evaluate(() => {
  const daten = Store.addPage(null, { text: 'Notenquelle' });
  const db = Store.addDatabase(daten.id, 'Noten je Fach', {
    title: { name: 'Leistung', type: 'title' },
    fach: { name: 'Fach', type: 'text' },
    note: { name: 'Note', type: 'number' }
  });
  (globalThis as any).__quelleC = db.collectionId;
  const rein = (t: string, fach: string, note: number) => {
    const z = Store.addRow(db.collectionId, { title: t });
    Store.setProp(z.id, 'fach', fach);
    Store.setProp(z.id, 'note', note);
  };
  rein('Ohm', 'Elektrotechnik', 5.5);
  rein('VDE', 'Elektrotechnik', 4.5);
  rein('Algebra', 'Mathematik', 4);
  const s = Store.addPage(null, { text: 'Auswertung' });
  const blk = Store.addBlock(s.id, 'chart', { text: 'Noten je Fach' });
  (globalThis as any).__chartB = blk.id;
  App.oeffne(s.id);
});
await p.waitForSelector('.chart-daten', { timeout: 15000 });
await p.click('.chart-daten');
await p.waitForSelector('.overlay #cq', { timeout: 10000 });
const angebot = await p.evaluate(() =>
  [...document.querySelectorAll<HTMLOptionElement>('#cq option')].map(o => o.textContent || ''));
pr('Der Dialog bietet die Datenbank als Quelle an',
  angebot.some(t => t.includes('Datenbank: Noten je Fach')) && angebot[0]!.includes('Handdaten'),
  JSON.stringify(angebot.slice(0, 4)));

await p.selectOption('#cq', await p.evaluate(() => (globalThis as any).__quelleC));
await p.waitForTimeout(200);
const felder = await p.evaluate(() => ({
  sichtbar: !(document.getElementById('cq-felder') as HTMLElement).hidden,
  handWeg: (document.getElementById('cq-hand') as HTMLElement).hidden,
  gruppe: [...document.querySelectorAll<HTMLOptionElement>('#cg option')].map(o => o.textContent),
  mess: [...document.querySelectorAll<HTMLOptionElement>('#cm option')].map(o => o.textContent)
}));
pr('Mit gewählter Datenbank erscheinen Gruppier- und Messspalte, die Handzeilen verschwinden',
  felder.sichtbar && felder.handWeg &&
  felder.gruppe.includes('Fach') && felder.mess.includes('Note') &&
  felder.mess[0] === 'Zeilen zählen',
  JSON.stringify(felder));

await p.selectOption('#cg', { label: 'Fach' });
await p.selectOption('#cm', { label: 'Note' });
await p.click('.overlay [data-a="ok"]');
await p.waitForTimeout(800);
const block1 = await p.evaluate(() => {
  const blk = Store.getBlock((globalThis as any).__chartB);
  return { quelleDb: blk.quelleDb, gruppeNach: blk.gruppeNach, messen: blk.messen };
});
pr('Der Block trägt Quelle, Gruppierung und Messwert',
  block1.quelleDb === await p.evaluate(() => (globalThis as any).__quelleC) &&
  block1.gruppeNach === 'fach' && block1.messen === 'note',
  JSON.stringify(block1));
let werte = await legende();
pr('Das Diagramm summiert je Fach: Elektrotechnik 10, Mathematik 4',
  werte.some(t => /Elektrotechnik\s*10/.test(t)) && werte.some(t => /Mathematik\s*4/.test(t)),
  JSON.stringify(werte));

console.log('\n2 · Ohne Messspalte zählt jede Zeile eins');
await p.click('.chart-daten');
await p.waitForSelector('.overlay #cm', { timeout: 10000 });
await p.selectOption('#cm', { label: 'Zeilen zählen' });
await p.click('.overlay [data-a="ok"]');
await p.waitForTimeout(800);
werte = await legende();
pr('Elektrotechnik zählt 2, Mathematik 1',
  werte.some(t => /Elektrotechnik\s*2/.test(t)) && werte.some(t => /Mathematik\s*1/.test(t)),
  JSON.stringify(werte));

console.log('\n3 · Eine Quelle, keine Kopie');
await p.evaluate(() => {
  const z = Store.addRow((globalThis as any).__quelleC, { title: 'Geometrie' });
  Store.setProp(z.id, 'fach', 'Mathematik');
  Store.setProp(z.id, 'note', 5);
  App.zeichneSeite();
});
await p.waitForTimeout(800);
werte = await legende();
pr('Die neue Mathematik-Zeile steht nach dem Neuzeichnen im Diagramm (2)',
  werte.some(t => /Mathematik\s*2/.test(t)), JSON.stringify(werte));

console.log('\n4 · Zurück zu Handdaten heisst loslassen');
await p.click('.chart-daten');
await p.waitForSelector('.overlay #cq', { timeout: 10000 });
await p.selectOption('#cq', '');
await p.waitForTimeout(200);
pr('Die Handzeilen sind wieder da, die Spaltenwahl verschwindet',
  await p.evaluate(() => !(document.getElementById('cq-hand') as HTMLElement).hidden &&
    (document.getElementById('cq-felder') as HTMLElement).hidden));
await p.evaluate(() => {
  const ta = document.querySelector<HTMLTextAreaElement>('#cd')!;
  ta.value = 'Montag: 3\nDienstag: 7';
});
await p.click('.overlay [data-a="ok"]');
await p.waitForTimeout(800);
const block2 = await p.evaluate(() => {
  const blk = Store.getBlock((globalThis as any).__chartB);
  return { quelleDb: String(blk.quelleDb || ''), daten: String(blk.daten || '') };
});
pr('quelleDb ist geleert — die Datenbank übertrumpft die Zeilen nicht mehr still',
  block2.quelleDb === '' && /Dienstag: 7/.test(block2.daten), JSON.stringify(block2));
werte = await legende();
pr('Das Diagramm zeigt die getippten Zeilen: Montag 3, Dienstag 7',
  werte.some(t => /Montag\s*3/.test(t)) && werte.some(t => /Dienstag\s*7/.test(t)),
  JSON.stringify(werte));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
