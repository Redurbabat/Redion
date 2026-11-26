/* test645 — zwei Fenster überschreiben einander nicht (E801)
 *
 * Zwei echte Tabs derselben Herkunft, eine gemeinsame IndexedDB. Jede Zusage
 * liest das Ergebnis DIREKT von der Platte, nicht aus `Store.cache`.
 *
 * Die Wettläufe sind echt, nicht nachgestellt: Tab B ändert einen Satz, kurz
 * nachdem Tab A ihn geschrieben hat — bevor B die Nachricht von A verarbeitet
 * (die sammelt 120 ms). Vor E801 schrieb B dann seinen alten Stand samt
 * eigener Änderung über den von A, und A's Änderung war weg, ohne Meldung.
 *
 * Gegenprobe: der Stand vor E801 (`indexdb.js` aus E800) ist in §1, §3 und §4
 * rot.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, bad = 0;
const pruef = (n: string, ist: unknown, soll: unknown) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'
};
const server = http.createServer((a, b) => {
  let datei: string;
  try { datei = path.resolve(WURZEL, '.' + decodeURIComponent((a.url || '/').split('?')[0]!)); }
  catch { b.writeHead(400).end(); return; }
  if (!datei.startsWith(WURZEL + path.sep) || !fs.existsSync(datei) || !fs.statSync(datei).isFile()) {
    b.writeHead(404).end(); return;
  }
  b.writeHead(200, { 'Content-Type': mime[path.extname(datei)] || 'application/octet-stream' });
  fs.createReadStream(datei).pipe(b);
});
await new Promise<void>(f => server.listen(0, '127.0.0.1', () => f()));
const adresse = server.address();
if (!adresse || typeof adresse === 'string') throw new Error('Prüfserver fehlt');
const BASIS = `http://127.0.0.1:${adresse.port}/index.html`;

const browser = await chromium.launch();
/* Ohne Dienst-Arbeiter: er soll nicht alte Dateien aus seinem Speicher geben. */
const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1200, height: 800 } });
const fehler: string[] = [];

const oeffne = async (): Promise<Page> => {
  const p = await ctx.newPage();
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto(BASIS);
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    (window as any).__platte = (fach: string, id: string) => new Promise<any>((ok) => {
      const req = indexedDB.open(KONSTANTEN.ABLAGE_NAME || 'notizen');
      req.onsuccess = () => {
        const db = req.result;
        const r = db.transaction([fach], 'readonly').objectStore(fach).get(id);
        r.onsuccess = () => { ok(r.result ?? null); db.close(); };
        r.onerror = () => { ok('FEHLER'); db.close(); };
      };
      req.onerror = () => ok('KEINE_DB');
    });
  });
  return p;
};

const A = await oeffne();
/* Die Proben legt A an; B wird erst danach geöffnet und liest sie vom Start. */
const ids = await A.evaluate(async () => {
  const seite = Store.addPage(null, { text: 'Zwei Fenster E801' });
  const x = Store.addBlock(seite.id, 'text', { text: 'Ein Satz', color: '' });
  const y = Store.addBlock(seite.id, 'text', { text: 'Anfang' });
  const z = Store.addBlock(seite.id, 'text', { text: 'Wartend', color: '' });
  await Store.flush();
  Store.setMeta('konflikte', []);
  await Store.flush();
  return { seite: seite.id, x: x.id, y: y.id, z: z.id };
});
const B = await oeffne();
const platte = (p: Page, id: string) => p.evaluate((i: string) => (window as any).__platte('blocks', i), id);

/* --- 1 · Verschiedene Felder im Wettlauf: beide bleiben ----------------- */
await A.evaluate(async (id: string) => { Store.updateBlock(id, { text: 'A hat geschrieben' }); await Store.flush(); }, ids.x);
await B.evaluate(async (id: string) => { Store.updateBlock(id, { color: 'red' }); await Store.flush(); }, ids.x);
const x1 = await platte(A, ids.x);
pruef('§1 der Text von A ist nach Bs Schreiben noch auf der Platte', x1?.text, 'A hat geschrieben');
pruef('§1 die Farbe von B ist auch da', x1?.color, 'red');
await B.waitForTimeout(400);
pruef('§1 B zeigt danach beides', await B.evaluate((id: string) => {
  const b = Store.getBlock(id); return [b?.text, b?.color]; }, ids.x), ['A hat geschrieben', 'red']);

/* --- 2 · Dasselbe Feld im Wettlauf: nichts geht still verloren ---------- */
await A.evaluate(async (id: string) => { Store.updateBlock(id, { text: 'Anfang von A' }); await Store.flush(); }, ids.y);
await B.evaluate(async (id: string) => { Store.updateBlock(id, { text: 'Anfang von B' }); await Store.flush(); }, ids.y);
const y1 = await platte(A, ids.y);
const konflikte = await B.evaluate(() => (Store.getMeta('konflikte', []) || []).map((k: any) => ({ id: k.id, dort: k.dort })));
/* Nach „von A" fragen, nicht nach „A": „Anfang" enthält selbst ein A, und
   genau damit war diese Zusage gegen den alten Stand grün (§55.2). */
const vonA = String(y1?.text || '').includes('von A') ||
  konflikte.some((k: any) => k.id === ids.y && JSON.stringify(k.dort).includes('Anfang von A'));
pruef('§2 die Fassung von A steht im Satz oder in der Konfliktliste', vonA, true);
pruef('§2 die Fassung von B ist auf der Platte', String(y1?.text || '').includes('von B'), true);

/* --- 3 · Eine wartende Änderung wird nicht durch Fremdes ersetzt --------- */
await B.evaluate((id: string) => { Store.updateBlock(id, { color: 'blue' }); }, ids.z);   /* wartet 400 ms */
await A.evaluate(async (id: string) => { Store.updateBlock(id, { text: 'Von A, während B wartet' }); await Store.flush(); }, ids.z);
await B.waitForTimeout(250);                                                              /* B liest die Nachricht */
await B.evaluate(async () => { await Store.flush(); });
const z1 = await platte(A, ids.z);
pruef('§3 der Text von A überlebt die wartende Änderung von B', z1?.text, 'Von A, während B wartet');
pruef('§3 und die wartende Farbe von B landet auch', z1?.color, 'blue');

/* --- 4 · Beide hängen ein Kind an dieselbe Seite ------------------------- */
const kinder = { a: '', b: '' };
kinder.a = await A.evaluate(async (s: string) => { const k = Store.addBlock(s, 'text', { text: 'Kind A' }); await Store.flush(); return k.id; }, ids.seite);
kinder.b = await B.evaluate(async (s: string) => { const k = Store.addBlock(s, 'text', { text: 'Kind B' }); await Store.flush(); return k.id; }, ids.seite);
const s1 = await platte(A, ids.seite);
pruef('§4 die Seite führt das Kind von A', !!s1?.content?.includes(kinder.a), true);
pruef('§4 und das Kind von B', !!s1?.content?.includes(kinder.b), true);

/* --- 5 · Die Zahl lebt auf der Platte, nicht im Satz --------------------- */
const r5 = await A.evaluate(async (id: string) => {
  const p = await (window as any).__platte('blocks', id);
  const imSpeicher = Store.getBlock(id);
  const sicherung = JSON.stringify(Store.exportAll(false));
  return { platte: typeof p?.rev, speicher: imSpeicher ? ('rev' in imSpeicher) : 'fehlt',
           sicherungMitRev: /"rev"\s*:/.test(sicherung) };
}, ids.x);
pruef('§5 auf der Platte steht eine Zahl', r5.platte, 'number');
pruef('§5 im Satz im Speicher steht keine', r5.speicher, false);
pruef('§5 und die Sicherung trägt keine', r5.sicherungMitRev, false);

/* --- 6 · Ein Fenster allein meldet keine Konflikte ----------------------- */
const r6 = await A.evaluate(async (id: string) => {
  Store.setMeta('konflikte', []);
  await Store.flush();
  const vor = (await (window as any).__platte('blocks', id)).rev;
  for (let i = 0; i < 5; i++) { Store.updateBlock(id, { text: 'Allein ' + i }); await Store.flush(); }
  const nach = (await (window as any).__platte('blocks', id)).rev;
  return { neu: (Store.getMeta('konflikte', []) || []).length, schritte: nach - vor };
}, ids.x);
pruef('§6 fünfmal allein geschrieben, kein Konflikt', r6.neu, 0);
pruef('§6 und die Zahl stieg um fünf', r6.schritte, 5);

/* --- 7 · Neuladen ------------------------------------------------------- */
await B.reload();
await B.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
await B.waitForTimeout(1500);
const r7 = await B.evaluate((i: any) => {
  const s = Store.getBlock(i.seite);
  return { kinder: [i.a, i.b].every((k: string) => s?.content?.includes(k)),
           waisen: (s?.content || []).filter((k: string) => !Store.getBlock(k)).length,
           rev: Store.getBlock(i.x) ? ('rev' in Store.getBlock(i.x)) : 'fehlt' };
}, { ...ids, ...kinder });
pruef('§7 nach dem Neuladen sind beide Kinder da', r7.kinder, true);
pruef('§7 kein content zeigt ins Leere', r7.waisen, 0);
pruef('§7 und der geladene Satz trägt keine Zahl', r7.rev, false);

pruef('Keine Skriptfehler', fehler, []);
await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
