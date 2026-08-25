/* Suite 124 — Automationen drehen keine Kreisel (Schleifenschutz)
 * ============================================================================
 * Gemessen am 9. August: eine Automation „wenn X sich ändert → setze X auf
 * einen festen Wert" lief ENDLOS — 720 Schreibvorgänge in drei Sekunden,
 * für immer. Der Auslöser-Hook feuert verzögert, der imLauf-Riegel ist
 * dann längst offen, und setProp kennt keinen Gleichwert-Begriff.
 *
 * Zwei Schutzstufen:
 *   1  GLEICHWERT: „ändert sich" heisst jetzt wirklich ändern. Wird ein
 *      Wert auf sich selbst gesetzt, feuern prop-geaendert und
 *      zeile-geaendert nicht. Das bricht den Kreisel mit festem Wert.
 *   2  KETTEN-DECKEL: Ping-Pong mit WECHSELNDEN Werten (a→b→a→…) fängt
 *      Stufe 1 nicht. Schreibvorgänge aus Automationen tragen eine
 *      Kettentiefe; ab Tiefe 5 stoppt der Lauf, und der Verlauf sagt es
 *      mit ⚠ — still verhungern lassen wäre gelogen.
 *
 * Eine ehrliche Kette (A stösst B an, einmal) muss weiter laufen.
 *
 *   node pruefungen/lauf/test160.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8875;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

console.log('\n1 · Der Kreisel mit festem Wert steht sofort still');

const kreisel = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  const s = Store.addBlock(null, 'page', { text: 'Schleifen' });
  const db = Store.addDatabase(s.id, 'Kreisel', {
    title: { name: 'Titel', type: 'title' },
    x: { name: 'X', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  let zaehler = 0;
  const echt = Store.setProp.bind(Store);
  (Store as any).setProp = (...a: unknown[]) => { zaehler++; return (echt as any)(...a); };
  c.automationen = [{
    id: 'kreis01', name: 'Kreisel', an: true,
    wenn: { art: 'prop-geaendert', key: 'x' },
    bedingungen: [],
    dann: [{ art: 'setze-prop', key: 'x', wert: 'fest' }]
  }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  const row = Store.addRow(c.id, { title: 'Zeile' });
  Store.setProp(row.id, 'x', 'anfang');
  await new Promise(r => setTimeout(r, 2500));
  (Store as any).setProp = echt;
  return { aufrufe: zaehler,
           laeufe: ((c.automationen[0] as any).verlauf || []).length,
           wert: ((Store.getBlock(row.id) || {}).props || {})['x'] };
});
p('Höchstens eine Handvoll Schreibvorgänge — nicht Hunderte (waren: 720 in 3 s)',
  (kreisel as any).aufrufe <= 6, 'Aufrufe: ' + (kreisel as any).aufrufe);
p('Der Verlauf zeigt einen Lauf, keinen Deckel von 100',
  (kreisel as any).laeufe <= 3, 'Läufe: ' + (kreisel as any).laeufe);
gleich('Der Wert steht am Ende auf „fest"', (kreisel as any).wert, 'fest');

console.log('\n2 · Ping-Pong mit wechselnden Werten läuft gegen den Deckel — und sagt es');

const pingpong = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'PingPong' });
  const db = Store.addDatabase(s.id, 'Wippe', {
    title: { name: 'Titel', type: 'title' },
    x: { name: 'X', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  let zaehler = 0;
  const echt = Store.setProp.bind(Store);
  (Store as any).setProp = (...a: unknown[]) => { zaehler++; return (echt as any)(...a); };
  c.automationen = [
    { id: 'wippeA', name: 'Nach b', an: true,
      wenn: { art: 'prop-wert', key: 'x', wert: 'a' },
      bedingungen: [], dann: [{ art: 'setze-prop', key: 'x', wert: 'b' }] },
    { id: 'wippeB', name: 'Nach a', an: true,
      wenn: { art: 'prop-wert', key: 'x', wert: 'b' },
      bedingungen: [], dann: [{ art: 'setze-prop', key: 'x', wert: 'a' }] }
  ];
  Store.updateCollection(c.id, { automationen: c.automationen });
  const row = Store.addRow(c.id, { title: 'Zeile' });
  Store.setProp(row.id, 'x', 'a');
  await new Promise(r => setTimeout(r, 2500));
  (Store as any).setProp = echt;
  const verlaeufe = c.automationen.flatMap((a: any) => a.verlauf || []);
  return { aufrufe: zaehler,
           deckelNotiz: verlaeufe.some((l: any) => /Ketten|Tiefe|Schleife/i.test(l.fehler || '')) };
});
p('Das Ping-Pong endet nach wenigen Zügen (Deckel), nicht nach Hunderten',
  (pingpong as any).aufrufe <= 14, 'Aufrufe: ' + (pingpong as any).aufrufe);
gleich('Und der Verlauf SAGT, dass der Deckel griff — still wäre gelogen',
  (pingpong as any).deckelNotiz, true);

console.log('\n3 · Eine ehrliche Kette läuft weiter: A stösst B an, einmal');

const kette = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Kette' });
  const db = Store.addDatabase(s.id, 'Kettenprobe', {
    title: { name: 'Titel', type: 'title' },
    a: { name: 'A', type: 'text' },
    b: { name: 'B', type: 'text' },
    c: { name: 'C', type: 'text' }
  }, 'table');
  const coll = Store.getCollection(db.collectionId);
  coll.automationen = [
    { id: 'ketteA', name: 'A→B', an: true,
      wenn: { art: 'prop-geaendert', key: 'a' },
      bedingungen: [], dann: [{ art: 'setze-prop', key: 'b', wert: 'von A' }] },
    { id: 'ketteB', name: 'B→C', an: true,
      wenn: { art: 'prop-geaendert', key: 'b' },
      bedingungen: [], dann: [{ art: 'setze-prop', key: 'c', wert: 'von B' }] }
  ];
  Store.updateCollection(coll.id, { automationen: coll.automationen });
  const row = Store.addRow(coll.id, { title: 'Zeile' });
  Store.setProp(row.id, 'a', 'los');
  await new Promise(r => setTimeout(r, 800));
  const props = (Store.getBlock(row.id) || {}).props || {};
  return { b: props['b'], c: props['c'] };
});
gleich('B wurde gesetzt', (kette as any).b, 'von A');
gleich('… und die Folge-Automation lief auch: C steht', (kette as any).c, 'von B');

console.log('\n4 · Gleicher Wert heisst: nichts hat sich geändert');

const gleichwert = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Gleichwert' });
  const db = Store.addDatabase(s.id, 'Ruhe', {
    title: { name: 'Titel', type: 'title' },
    x: { name: 'X', type: 'text' },
    zahl: { name: 'Zahl', type: 'number' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  c.automationen = [{
    id: 'ruhe01', name: 'Zähler', an: true,
    wenn: { art: 'prop-geaendert', key: 'x' },
    bedingungen: [], dann: [{ art: 'zaehler', key: 'zahl' }] }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  const row = Store.addRow(c.id, { title: 'Zeile' });
  Store.setProp(row.id, 'x', 'wert');
  await new Promise(r => setTimeout(r, 400));
  const nachErstem = ((Store.getBlock(row.id) || {}).props || {})['zahl'];
  Store.setProp(row.id, 'x', 'wert');          /* derselbe Wert nochmal */
  await new Promise(r => setTimeout(r, 400));
  const nachZweitem = ((Store.getBlock(row.id) || {}).props || {})['zahl'];
  return { nachErstem, nachZweitem };
});
gleich('Der erste, echte Wechsel zählt', (gleichwert as any).nachErstem, 1);
gleich('Der zweite, wertgleiche nicht', (gleichwert as any).nachZweitem, 1);

console.log('\n5 · Die Schleife über die EIGENEN Zeilen — sie ging immer, jetzt gefahrlos');

/* LUECKEN behauptete: „Über die eigenen Zeilen läuft nichts." Das Ziel-
   Dropdown von fremd-setzen listete die eigene Datenbank aber seit jeher,
   und der Läufer hat keinen Eigen-Riegel. Was fehlte, war der
   Schleifenschutz — OHNE ihn wäre jede Eigen-Massenänderung ein
   Kreisel-Kandidat gewesen. */
const eigene = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Eigene' });
  const db = Store.addDatabase(s.id, 'Sammel', {
    title: { name: 'Titel', type: 'title' },
    sammel: { name: 'Sammel', type: 'checkbox' },
    vermerk: { name: 'Vermerk', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  Store.addRow(c.id, { title: 'Eins' });
  Store.addRow(c.id, { title: 'Zwei' });
  const drei = Store.addRow(c.id, { title: 'Drei' });
  c.automationen = [{
    id: 'eigen01', name: 'Alle abhaken', an: true,
    wenn: { art: 'prop-geaendert', key: 'sammel' },
    bedingungen: [],
    dann: [{ art: 'fremd-setzen', ziel: c.id, zielKey: 'vermerk', wert: 'alle' }]
  }];
  Store.updateCollection(c.id, { automationen: c.automationen });
  Store.setProp(drei.id, 'sammel', true);
  await new Promise(r => setTimeout(r, 800));
  const werte = Store.rowsOf(c.id).map((z: any) => (z.props || {})['vermerk']);
  return { alle: werte.every((w: any) => w === 'alle'), anzahl: werte.length };
});
p('Alle drei eigenen Zeilen wurden geändert', (eigene as any).alle && (eigene as any).anzahl === 3,
  JSON.stringify(eigene));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
