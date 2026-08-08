/* Suite 116 — Ein kaputter Import überschreibt nichts halb (E79)
 * ============================================================================
 * Der Satz aus dem Architektur-Text, wörtlich: „Ein kaputter Import darf
 * NIEMALS die aktuelle Redion-Datenbank halb überschreiben."
 *
 * E71 hat den Abbruch vor dem ersten Anfassen abgesichert. Aber zwischen
 * Löschen und Schreiben lag weiter ein Fenster: hunderte einzelne
 * Transaktionen, und wer mittendrin Strom, Tab oder Quota verlor, behielt
 * einen halben Bestand. Seit E79 läuft das ganze Einspielen in EINER
 * IndexedDB-Transaktion — ganz oder gar nicht, der Browser rollt zurück.
 *
 * GEPRÜFT WIRD MIT GEWALT: mitten im Einspielen wird das Schreiben in ein
 * Fach kaputtgemacht (dieselbe Werkzeugkiste wie test144). Danach muss
 * ALLES noch so sein wie vorher — auf der Platte UND im Zwischenspeicher.
 *
 *   node pruefungen/lauf/test152.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8857;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Ein put, das für EIN Fach immer scheitert — mitten in der Transaktion. */
const kaputtMachen = `(fach) => {
  const echt = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...a) {
    if (this.name !== fach) return echt.apply(this, a);
    /* Ein echtes Scheitern IN der Transaktion: der Wert ist nicht
       klonbar. Das wirft synchron, wie ein voller Speicher es asynchron
       täte — beides muss die Transaktion zum Rollback bringen. */
    throw new DOMException('Absichtlich kaputt', 'DataCloneError');
  };
  return () => { IDBObjectStore.prototype.put = echt; };
}`;

console.log('\n1 · Ein Bestand, eine Sicherung, ein Unfall mittendrin');

const erg = await seite.evaluate(async (bau) => {
  const s = Store.addBlock(null, 'page', { text: 'Der alte Bestand' });
  Store.addBlock(s.id, 'text', { text: 'Wertvoller Absatz' });
  Store.setMeta('wichtig146', 'alter Wert');
  await Store.flush();

  /* Der Plattenstand vorher — roh gelesen, sortiert. */
  const platte = async () => {
    const raus: Record<string, string> = {};
    for (const fach of ['blocks', 'collections', 'views', 'meta', 'versions']) {
      const saetze: any[] = await new Promise((ok2, nein) => {
        const t = (indexedDB as any).open('notizen');
        t.onsuccess = () => {
          const db = t.result;
          const r = db.transaction([fach], 'readonly').objectStore(fach).getAll();
          r.onsuccess = () => { db.close(); ok2(r.result || []); };
          r.onerror = () => { db.close(); nein(r.error); };
        };
      });
      /* `fehlerliste` fliegt aus dem Vergleich: der ABGEBROCHENE Import
         trägt sich dort ein — das ist gewollt (der Mensch soll den
         Vorfall nachlesen können) und unten ein eigener Prüfpunkt. */
      raus[fach] = JSON.stringify(saetze
        .filter(x => !(fach === 'meta' && x && x.k === 'fehlerliste'))
        .map(x => JSON.stringify(x)).sort());
    }
    return JSON.stringify(raus);
  };
  const vorher = await platte();
  const cacheVorher = JSON.stringify(Object.keys(Store.cache.blocks).sort()) +
                      '|' + Store.getMeta('wichtig146', '');

  const sicherung = JSON.stringify({
    exportiert: '2026-08-08T00:00:00.000Z',
    blocks: { fremd1: { id: 'fremd1', type: 'page', text: 'Aus der Sicherung',
      content: [], parentId: null, parentTable: 'block',
      created: '2026-01-01T00:00:00.000Z', edited: '2026-01-01T00:00:00.000Z',
      alive: true } },
    collections: {}, views: {},
    meta: { wichtig146: 'NEUER Wert' }
  });

  /* Das Fach `blocks` scheitert — mitten im Schreiben. Der erste Wurf
     sabotierte `views`, aber die Sicherung ENTHÄLT keine views: null
     puts, null Scheitern, alles grün — die Gegenprobe der Gegenprobe.
     Sabotiert wird, was wirklich geschrieben wird. */
  const zurueck = (new Function('return ' + bau)())('blocks');
  let geworfen = '';
  try { await Store.importAll(sicherung, 'ersetzen'); }
  catch (e) { geworfen = e instanceof Error ? e.message : String(e); }
  zurueck();

  const nachher = await platte();
  const cacheNachher = JSON.stringify(Object.keys(Store.cache.blocks).sort()) +
                       '|' + Store.getMeta('wichtig146', '');
  /* Wenn ungleich: WO? Nicht raten — hinsehen. */
  let unterschied = '';
  if (vorher !== nachher) {
    const v = JSON.parse(vorher), n2 = JSON.parse(nachher);
    for (const fach of Object.keys(v)) {
      if (v[fach] === n2[fach]) continue;
      const va: string[] = JSON.parse(v[fach]), na: string[] = JSON.parse(n2[fach]);
      const vs = new Set(va);
      const neuDazu = na.filter(x => !vs.has(x)).slice(0, 2);
      const nس = new Set(na);
      const wegDavon = va.filter(x => !nس.has(x)).slice(0, 2);
      unterschied += fach + ': +' + JSON.stringify(neuDazu).slice(0, 300) +
                     ' / -' + JSON.stringify(wegDavon).slice(0, 300) + ' · ';
    }
  }
  return { geworfen, gleichPlatte: vorher === nachher,
           gleichCache: cacheVorher === cacheNachher,
           hatFremd: !!Store.getBlock('fremd1'),
           laenge: vorher.length, unterschied,
           imProtokoll: (Store.getMeta('fehlerliste', []) || [])
             .some((f: any) => /Einspielen abgebrochen/.test(String(f.text))) };
}, kaputtMachen);

const e = erg as any;
p('Der Import wirft — und sagt, dass NICHTS verändert wurde',
  /NICHT eingespielt/.test(e.geworfen) && /zurückgerollt|nichts verändert/i.test(e.geworfen),
  e.geworfen.slice(0, 120));
p('Die Platte ist Satz für Satz wie vorher (alle fünf Fächer)',
  e.gleichPlatte === true, e.unterschied || `verglichen über ${e.laenge} Zeichen`);
p('Der Zwischenspeicher auch — kein Stand, der nicht auf der Platte steht',
  e.gleichCache === true);
p('Nichts aus der Sicherung ist hängengeblieben', e.hatFremd === false);
p('Und der Vorfall steht in der Fehlerliste — der Abbruch ist nachlesbar',
  e.imProtokoll === true);

console.log('\n2 · Und ohne Unfall geht dasselbe Einspielen durch');

const gesund = await seite.evaluate(async () => {
  const sicherung = JSON.stringify({
    exportiert: '2026-08-08T00:00:00.000Z',
    blocks: { fremd1: { id: 'fremd1', type: 'page', text: 'Aus der Sicherung',
      content: [], parentId: null, parentTable: 'block',
      created: '2026-01-01T00:00:00.000Z', edited: '2026-01-01T00:00:00.000Z',
      alive: true } },
    collections: {}, views: {},
    meta: { wichtig146: 'NEUER Wert' }
  });
  await Store.importAll(sicherung, 'ersetzen');
  return { hatFremd: !!Store.getBlock('fremd1'),
           alterWeg: Object.keys(Store.cache.blocks).length,
           meta: Store.getMeta('wichtig146', '') };
});
gleich('Die Sicherungsseite ist da', (gesund as any).hatFremd, true);
gleich('Der alte Bestand ist ersetzt — genau ein Block', (gesund as any).alterWeg, 1);
gleich('Und meta trägt den neuen Wert', (gesund as any).meta, 'NEUER Wert');

console.log('\n3 · Die Quelle: eine Transaktion, Zwischenspeicher erst nach oncomplete');
const quelle = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
p('Das Einspielen läuft über EINE Transaktion über die fünf Fächer',
  /tx\(\['blocks', 'collections', 'views', 'meta', 'versions'\], 'readwrite'\)/.test(quelle));
p('Der Zwischenspeicher wird erst nach dem oncomplete umgestellt',
  /Erst JETZT, nach dem oncomplete, den Zwischenspeicher umstellen/.test(quelle));

console.log('\n4 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 116 — Import: ganz oder gar nicht: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
