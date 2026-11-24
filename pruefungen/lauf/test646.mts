/* test646 — Speicher voll: nichts geht still verloren (E802)
 *
 * Der volle Speicher ist echt, keine Attrappe: Chromium bekommt über CDP
 * (`Storage.overrideQuotaForOrigin`) ein Kontingent knapp über dem, was schon
 * belegt ist. Dann schreibt die App einen grossen Block.
 *
 * Vorher (E801): eine allgemeine Fehlermeldung, kein Hinweis, wie viel
 * wartet, kein neuer Versuch ohne neue Eingabe, und das Fenster liess sich
 * ohne Rückfrage schliessen — mit allem, was noch im Arbeitsspeicher lag.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

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
const HERKUNFT = `http://127.0.0.1:${adresse.port}`;

const browser = await chromium.launch();

/* Das Kontingent wirkt nur, wenn es VOR dem ersten Besuch der Herkunft
   gesetzt ist; ein späteres Absenken nimmt Chromium nicht an (gemessen mit
   einer Sonde: 3 MB kamen danach trotzdem durch). Also zuerst in einem
   Wegwerf-Kontext messen, wie viel der Startbestand braucht, und dann einen
   frischen Kontext knapp darüber begrenzen. */
const messKtx = await browser.newContext({ serviceWorkers: 'block' });
const messSeite = await messKtx.newPage();
await messSeite.goto(HERKUNFT + '/index.html');
await messSeite.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
await messSeite.waitForTimeout(1500);
const startBelegt = await messSeite.evaluate(async () => {
  Store.addPage(null, { text: 'Voll E802' });
  await Store.flush();
  return (await navigator.storage.estimate()).usage || 0;
});
await messKtx.close();

const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1200, height: 800 } });
const p = await ctx.newPage();
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('JS: ' + e.message));
const cdp = await ctx.newCDPSession(p);
await cdp.send('Storage.overrideQuotaForOrigin', { origin: HERKUNFT, quotaSize: Math.round(startBelegt * 1.3) + 512 * 1024 });
await p.goto(HERKUNFT + '/index.html');
await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
await p.waitForTimeout(1500);
await p.evaluate(() => {
  (window as any).__platte = (id: string) => new Promise<any>((ok) => {
    const req = indexedDB.open(KONSTANTEN.ABLAGE_NAME || 'notizen');
    req.onsuccess = () => {
      const db = req.result;
      const r = db.transaction(['blocks'], 'readonly').objectStore('blocks').get(id);
      r.onsuccess = () => { ok(r.result ?? null); db.close(); };
      r.onerror = () => { ok('FEHLER'); db.close(); };
    };
    req.onerror = () => ok('KEINE_DB');
  });
});

const seiteId = await p.evaluate(async () => { const s = Store.addPage(null, { text: 'Voll E802' }); await Store.flush(); return s.id; });

/* --- 1 · Ein grosser Block passt nicht hinein --------------------------- */
const kindId = await p.evaluate(async (s: string) => {
  /* ZUFÄLLIGE Zeichen: Chromiums Ablage komprimiert, und vier Megabyte
     „x" schrumpften auf fast nichts — der erste Anlauf passte so ins
     kleine Kontingent und mass gar keinen vollen Speicher. */
  const roh = new Uint8Array(3 * 1024 * 1024);
  for (let i = 0; i < roh.length; i += 65536) crypto.getRandomValues(roh.subarray(i, i + 65536));
  let text = '';
  for (let i = 0; i < roh.length; i += 8192) text += btoa(String.fromCharCode(...roh.subarray(i, i + 8192)));
  (window as any).__laenge = text.length;
  const k = Store.addBlock(s, 'text', { text });
  let abgelehnt = '';
  try { await Store.flush(); } catch (e) { abgelehnt = String((e as Error)?.message || e); }
  (window as any).__abgelehnt = abgelehnt;
  return k.id;
}, seiteId);
await p.waitForTimeout(300);
const r1 = await p.evaluate(async (id: string) => {
  const banner = document.getElementById('banner');
  return {
    abgelehnt: !!(window as any).__abgelehnt,
    platte: (await (window as any).__platte(id)) === null ? null : 'DA',
    banner: banner ? banner.textContent || '' : '',
    imSpeicher: !!Store.getBlock(id)
  };
}, kindId);
pruef('§1 das Schreiben wurde abgelehnt (der Speicher ist wirklich voll)', r1.abgelehnt, true);
pruef('§1 der Block steht noch nicht auf der Platte', r1.platte, null);
pruef('§1 die Änderung ist im Speicher noch da', r1.imSpeicher, true);
pruef('§1 die Meldung sagt, dass der Speicher voll ist', /Speicher dieses Geräts ist voll/.test(r1.banner), true);
pruef('§1 und wie viel noch wartet', /\d+ Änderung/.test(r1.banner), true);
pruef('§1 und dass das Fenster offen bleiben soll', /schliesse dieses Fenster nicht/.test(r1.banner), true);

/* --- 2 · Schliessen fragt nach ------------------------------------------ */
let dialoge = 0;
p.once('dialog', async d => { dialoge++; pruef('§2 es ist die Rückfrage beim Verlassen', d.type(), 'beforeunload'); await d.dismiss(); });
await p.close({ runBeforeUnload: true });
await new Promise(r => setTimeout(r, 800));
pruef('§2 beim Schliessen kam eine Rückfrage', dialoge, 1);
pruef('§2 und das Fenster ist nach „Bleiben" noch offen', p.isClosed(), false);

if (p.isClosed()) {
  /* Ohne Rückfrage ist das Fenster jetzt zu — und mit ihm alles, was noch
     im Arbeitsspeicher wartete. Genau das ist der Fund; weiter zu messen
     gibt es nichts. */
  pruef('§3 das Fenster ist noch offen, um es weiter zu versuchen', false, true);
} else {
  /* --- 3 · Platz frei: der nächste Versuch kommt von selbst --------------- */
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: HERKUNFT });   /* ohne Grösse = zurück zum Normalen */
  await p.waitForTimeout(17000);
  const r3 = await p.evaluate(async (i: { kind: string; seite: string }) => {
    const k = await (window as any).__platte(i.kind);
    const s = await (window as any).__platte(i.seite);
    const banner = document.getElementById('banner');
    return { kind: !!k && k.text.length === (window as any).__laenge, seiteMitKind: !!s && s.content.includes(i.kind),
             banner: banner ? banner.textContent || '' : '' };
  }, { kind: kindId, seite: seiteId });
  pruef('§3 ohne neue Eingabe ist der Block jetzt auf der Platte', r3.kind, true);
  pruef('§3 und die Seite führt ihn', r3.seiteMitKind, true);
  pruef('§3 die Meldung sagt, dass alles gesichert ist', /wieder Platz/.test(r3.banner), true);

  /* --- 4 · Danach schliesst das Fenster ohne Rückfrage --------------------- */
  /* Gemessen wird, ob das Entladen noch abgelehnt wird — nicht, ob Playwright
     das Fenster schliesst: nach einer vorher abgelehnten Rückfrage blieb die
     Seite in Chromium offen, obwohl nichts mehr ablehnte (gemessen:
     `defaultPrevented` false, kein Dialog). Das wäre eine Zusage über das
     Werkzeug, nicht über Redion. */
  const r4 = await p.evaluate(() => {
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  pruef('§4 ohne Ungesichertes lehnt nichts mehr das Schliessen ab', r4, false);
}

pruef('Keine Skriptfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
