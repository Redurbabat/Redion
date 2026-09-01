/* Suite 308 — Eine dazugelegte Sicherung erreicht den Server (L100, E314)
 * ============================================================================
 * `Wolke.zuSchicken()` überspringt jeden Satz mit `edited <= marke`. Für
 * alles, was auf diesem Gerät entstanden ist, ist das richtig: was älter ist
 * als der letzte Versand, wurde schon geschickt.
 *
 * Für eine EINGESPIELTE Sicherung stimmt es nicht. Wer eine Sicherung von vor
 * drei Monaten DAZULEGT, bringt Sätze mit einem `edited` von vor drei Monaten
 * mit; die Marke steht auf heute. Der nächste Abgleich sieht sie also nie —
 * auf den anderen Geräten fehlen sie, und nirgends wird etwas rot.
 *
 * Das ist die stille Sorte: es sieht aus wie ein geglückter Vorgang.
 *
 *   §1 DER FEHLER, wie er war: alt eingespielt, Marke auf heute, weg.
 *   §2 DIE REPARATUR: die dazugelegten Kennungen sind vorgemerkt.
 *   §3 GEGENPROBE: bei ERSETZEN wird nichts vorgemerkt — dort leert L76
 *      ohnehin die Marken, und eine zweite Liste wäre nur Ballast.
 *   §4 UND DIE LISTE WÄCHST NICHT EWIG: was geschickt ist, ist gestrichen.
 *   §5 EINE SEHR GROSSE Sicherung bekommt eine Marke statt einer Liste.
 *
 *   node pruefungen/lauf/test308.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9319;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
/* Ein winziger Abgleich-Server. §4 braucht einen ECHTEN Durchlauf: die
   Merkliste wird erst aufgeräumt, wenn der Versand durch ist — und genau
   das ist richtig so. Räumte sie auch nach einem Fehlschlag ab, wären die
   Sätze für immer weg, ohne dass jemand es sähe. */
let empfangen: string[] = [];
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  if (rein === '/sync/hoch') {
    let roh = '';
    a.on('data', (s: any) => { roh += s; });
    a.on('end', () => {
      let n = 0;
      try {
        const k = JSON.parse(roh || '{}');
        for (const satz of k.saetze || []) { n++; empfangen.push(String(satz.id)); }
      } catch { /* leer zählt als null */ }
      b.writeHead(200, { 'Content-Type': 'application/json',
                         'Access-Control-Allow-Origin': '*' });
      b.end(JSON.stringify({ angenommen: n, abgelehnt: [], angepasst: [] }));
    });
    return;
  }
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 860 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

/**
 * Eine Sicherung bauen, deren Sätze DREI MONATE alt sind — die Marke steht
 * danach auf heute. Genau der Fall aus L100.
 */
const vorbereiten = async () => pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Store.setMeta('wolkeNachtrag', []);
  Store.setMeta('wolkeNachtragAlles', false);

  const alt = new Date(Date.now() - 90 * 86400000).toISOString();
  const sicherung = {
    version: 4,
    blocks: {
      'alt-seite-1': { id: 'alt-seite-1', type: 'page', text: 'Alte Seite',
                       content: [], parentId: null, parentTable: 'block',
                       alive: true, created: alt, edited: alt },
      'alt-text-1':  { id: 'alt-text-1', type: 'text', text: 'Vor drei Monaten geschrieben.',
                       content: [], parentId: 'alt-seite-1', parentTable: 'block',
                       alive: true, created: alt, edited: alt }
    },
    collections: {}, views: {}, meta: {}, versions: [], dateien: [], stuecke: []
  };
  /* Die Marke steht auf JETZT — als hätte man eben abgeglichen. */
  Store.setMeta('wolkeMarkeHoch', new Date().toISOString());
  await Store.importAll(JSON.stringify(sicherung), 'zusammenfuehren');
  await Store.flush();
  return { alt, marke: Store.getMeta('wolkeMarkeHoch', '') };
});

const stand = await vorbereiten();

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Fehler, wie er war');

const ohneNachtrag = await pc.evaluate(() => {
  /* Die Merkliste einmal beiseite legen und messen, was der alte Filter
     allein gesehen hätte. Das ist die Rekonstruktion des Fehlers — ohne sie
     bewiese §2 nur, dass etwas geschickt wird, nicht dass es vorher
     LIEGENGEBLIEBEN wäre. */
  const marke = Store.getMeta('wolkeMarkeHoch', '');
  const alteSicht = Object.values<any>(Store.cache.blocks)
    .filter(b => String(b.edited || b.created || '') > marke)
    .map(b => b.id);
  return { alteSicht: alteSicht.filter(id => String(id).startsWith('alt-')) };
});
gleich('Mit dem alten Filter allein wäre die alte Seite nie gefahren',
  ohneNachtrag.alteSicht, []);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die Reparatur: sie sind vorgemerkt');

const jetzt = await pc.evaluate(() => {
  const w = globalThis as any;
  const liste = w.Wolke.zuSchicken().map((e: any) => String(e.id));
  return {
    liste: liste.filter((id: string) => id.startsWith('alt-')).sort(),
    merk: (Store.getMeta('wolkeNachtrag', []) || []).filter((x: any) =>
      String(x).startsWith('alt-')).sort(),
    alles: Store.getMeta('wolkeNachtragAlles', false)
  };
});
gleich('Beide Sätze stehen auf der Merkliste',
  jetzt.merk, ['alt-seite-1', 'alt-text-1']);
gleich('Und `zuSchicken` nimmt sie mit',
  jetzt.liste, ['alt-seite-1', 'alt-text-1']);
p('Ohne die grobe Marke „alles" zu setzen', jetzt.alles !== true, String(jetzt.alles));

/* ------------------------------------------------------------------------ */
console.log('\n3 · GEGENPROBE: beim Ersetzen wird nichts vorgemerkt');

const beimErsetzen = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('wolkeNachtrag', []);
  const alt = new Date(Date.now() - 90 * 86400000).toISOString();
  const sicherung = {
    version: 4,
    blocks: { 'ers-1': { id: 'ers-1', type: 'page', text: 'Ersetzt',
                         content: [], parentId: null, parentTable: 'block',
                         alive: true, created: alt, edited: alt } },
    collections: {}, views: {}, meta: {}, versions: [], dateien: [], stuecke: []
  };
  await Store.importAll(JSON.stringify(sicherung), 'ersetzen');
  await Store.flush();
  return { merk: Store.getMeta('wolkeNachtrag', []),
           marke: Store.getMeta('wolkeMarkeHoch', '') };
});
gleich('Die Merkliste bleibt leer', beimErsetzen.merk, []);
/* Und der Grund, warum das richtig ist: L76 hat die Marke geleert, der
   nächste Abgleich holt also ohnehin alles. */
gleich('Weil die Marke selbst geleert wurde (L76/E279)', beimErsetzen.marke, '');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Ein Fehlschlag löscht nichts — ein Erfolg räumt auf');

/* ZUERST DER FEHLSCHLAG, und er ist der wichtigere Punkt: würde die Liste
   auch dann geleert, wären die Sätze für immer weg. Kein Fehler, keine
   Meldung, nichts — genau die Sorte, gegen die L100 geschrieben wurde. */
const nachFehler = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('wolkeAdresse', 'http://127.0.0.1:1');   /* dort horcht niemand */
  Store.setMeta('wolkeNachtrag', ['alt-seite-1', 'alt-text-1']);
  Store.setMeta('wolkeNachtragAlles', true);
  try { await w.Wolke.hoch(); } catch { /* soll scheitern */ }
  return { merk: (Store.getMeta('wolkeNachtrag', []) || []).sort(),
           alles: Store.getMeta('wolkeNachtragAlles', false) };
});
gleich('Nach einem Fehlschlag steht die Liste noch da',
  nachFehler.merk, ['alt-seite-1', 'alt-text-1']);
p('Und die Marke „alles" auch', nachFehler.alles === true, String(nachFehler.alles));

/* Und jetzt mit einem Server, der antwortet.
   Die alten Sätze müssen dafür NEU dazugelegt werden: §3 hat mit „Ersetzen"
   den ganzen Bestand getauscht, sie gibt es also nicht mehr. Das ist kein
   Umweg, sondern derselbe Fall wie in §1 — nur diesmal bis zum Server. */
const nachErfolg = await pc.evaluate(async (port: number) => {
  const w = globalThis as any;
  const alt = new Date(Date.now() - 90 * 86400000).toISOString();
  await Store.importAll(JSON.stringify({
    version: 4,
    blocks: {
      'alt-seite-1': { id: 'alt-seite-1', type: 'page', text: 'Alte Seite',
                       content: [], parentId: null, parentTable: 'block',
                       alive: true, created: alt, edited: alt },
      'alt-text-1':  { id: 'alt-text-1', type: 'text', text: 'Vor drei Monaten.',
                       content: [], parentId: 'alt-seite-1', parentTable: 'block',
                       alive: true, created: alt, edited: alt }
    },
    collections: {}, views: {}, meta: {}, versions: [], dateien: [], stuecke: []
  }), 'zusammenfuehren');
  Store.setMeta('wolkeMarkeHoch', new Date().toISOString());
  await Store.flush();
  Store.setMeta('wolkeAdresse', 'http://localhost:' + port);
  Store.setMeta('wolkeNachtrag', ['alt-seite-1', 'alt-text-1',
                                  'gibt-es-nicht-1', 'gibt-es-nicht-2']);
  Store.setMeta('wolkeNachtragAlles', false);
  await w.Wolke.hoch();
  return { merk: (Store.getMeta('wolkeNachtrag', []) || []).sort(),
           alles: Store.getMeta('wolkeNachtragAlles', false) };
}, PORT);

p('Die alten Sätze sind wirklich beim Server angekommen',
  empfangen.includes('alt-seite-1') && empfangen.includes('alt-text-1'),
  JSON.stringify(empfangen.filter(x => x.startsWith('alt-'))));
gleich('Danach ist die Merkliste leer', nachErfolg.merk, []);
p('Und die Marke „alles" steht nicht mehr', nachErfolg.alles !== true,
  String(nachErfolg.alles));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Eine sehr grosse Sicherung bekommt eine Marke');

const gross = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('wolkeNachtrag', []);
  Store.setMeta('wolkeNachtragAlles', false);
  const alt = new Date(Date.now() - 90 * 86400000).toISOString();
  const blocks: Record<string, any> = {};
  for (let i = 0; i < 20050; i++)
    blocks['gross-' + i] = { id: 'gross-' + i, type: 'text', text: 'x',
                             content: [], parentId: null, parentTable: 'block',
                             alive: true, created: alt, edited: alt };
  await Store.importAll(JSON.stringify({
    version: 4, blocks, collections: {}, views: {}, meta: {},
    versions: [], dateien: [], stuecke: []
  }), 'zusammenfuehren');
  await Store.flush();
  return { alles: Store.getMeta('wolkeNachtragAlles', false),
           laenge: (Store.getMeta('wolkeNachtrag', []) || []).length,
           schickt: w.Wolke.zuSchicken().length };
});
p('Über der Grenze steht die Marke statt der Liste', gross.alles === true,
  JSON.stringify(gross));
p('Und die Liste bleibt kurz', gross.laenge < 20050, String(gross.laenge));
p('Geschickt wird trotzdem alles', gross.schickt >= 20050, String(gross.schickt));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
