/* Suite 310 — Die Vorschau sagt, was sich ändert (L101 Punkt 1, E316)
 * ============================================================================
 * Vor dem Einspielen stand:
 *
 *     'Die Datei enthält ' + wieViele + ' Blöcke. ' +
 *     'In diesem Bestand liegen gerade ' + jetzt + ' Blöcke.'
 *                                                    schale.ts:2047
 *
 * „1247 Blöcke, hier liegen 1180." Das sagt, wie GROSS die Sicherung ist,
 * nicht was sie tut. Wer wissen will, ob die eigene Seite von gestern
 * überlebt, erfuhr es erst danach — und dann war sie weg.
 *
 * Es ist die letzte Stelle vor einem Vorgang, der löscht.
 *
 *   §1 DER KERN zählt die vier Gruppen richtig.
 *   §2 BUCHHALTUNG ist keine Änderung: `wolkeVersion` zählt nicht mit.
 *   §3 DAZULEGEN lässt nichts verschwinden — nie.
 *   §4 DER SATZ nennt Namen, nicht nur Zahlen.
 *   §5 GEGENPROBE: was NICHT geschieht, steht auch nicht da.
 *   §6 IM DIALOG steht er wirklich, an beiden Knöpfen.
 *
 * ─── WARUM §5 DER WICHTIGSTE ABSCHNITT IST ──────────────────────────────────
 *
 * „0 Sätze verschwinden" ist keine Beruhigung, sondern eine Zeile, über die
 * man hinwegliest — und beim nächsten Mal auch über die, in der eine 7
 * steht. Die Warnung steht deshalb nur da, wenn wirklich etwas verschwindet.
 *
 *   node pruefungen/lauf/test310.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9321;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/import/vergleich.js'), 'utf-8'));
const V = (globalThis as any).ImportVergleich;

const satz = (id: string, text: string, extra: any = {}) =>
  ({ id, text, type: 'page', alive: true, edited: '2026-08-01T10:00:00.000Z', ...extra });

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Kern zählt die vier Gruppen');

const HIER = { blocks: {
  a: satz('a', 'Bleibt gleich'),
  b: satz('b', 'Wird überschrieben'),
  c: satz('c', 'Elektro-Protokoll', { edited: '2026-08-30T10:00:00.000Z' }),
  d: satz('d', 'Alte Notiz')
} };
const DATEI = { blocks: {
  a: satz('a', 'Bleibt gleich'),
  b: satz('b', 'Anders jetzt'),
  e: satz('e', 'Ganz neu')
} };

const ers = V.rechnen(HIER, DATEI, 'ersetzen');
gleich('Neu, ersetzt, gleich, verschwindet',
  [ers.neu.anzahl, ers.ersetzt.anzahl, ers.gleich.anzahl, ers.verschwindet.anzahl],
  [1, 1, 1, 2]);
gleich('Und danach sind es drei Sätze', ers.danach, 3);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Buchhaltung ist keine Änderung');

/* WÄRE `wolkeVersion` TEIL DES VERGLEICHS, wäre nach jedem Abgleich JEDER
   Satz „geändert" — und die Anzeige sagte wieder nichts. */
const mitBuch = { blocks: { a: satz('a', 'Bleibt gleich', { wolkeVersion: 9, folge: 42 }) } };
const ohneBuch = { blocks: { a: satz('a', 'Bleibt gleich', { wolkeVersion: 1, folge: 7 }) } };
gleich('Nur andere Versionsnummern heissen: gleich',
  V.rechnen(mitBuch, ohneBuch, 'ersetzen').ersetzt.anzahl, 0);
gleich('Ein anderer Text heisst: ersetzt',
  V.rechnen(mitBuch, { blocks: { a: satz('a', 'Anderer Text') } }, 'ersetzen').ersetzt.anzahl, 1);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Dazulegen lässt nichts verschwinden');

const dazu = V.rechnen(HIER, DATEI, 'zusammenfuehren');
gleich('Beim Dazulegen verschwindet nie etwas', dazu.verschwindet.anzahl, 0);
gleich('Und der Bestand wächst um die neuen', dazu.danach, 5);
p('Der Kern sagt auch, welcher Weg gemeint war', dazu.art === 'zusammenfuehren');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Der Satz nennt Namen');

const t = V.satz(ers);
p('Er nennt, was dazukommt und was überschrieben wird',
  /1 Satz kommt dazu/.test(t) && /1 Satz wird überschrieben/.test(t), t);
p('Und er nennt die Verschwundenen beim Namen', /Elektro-Protokoll/.test(t), t);
/* Die zuletzt geänderten zuerst — an die erinnert man sich. */
gleich('Das zuletzt Geänderte steht vorn', ers.verschwindet.titel[0], 'Elektro-Protokoll');
p('`warnt` sagt ja', V.warnt(ers) === true);

/* Bei vielen Verschwundenen kommen nicht alle Namen — aber die Zahl stimmt. */
const viele = { blocks: Object.fromEntries(
  Array.from({ length: 40 }, (_, i) => ['v' + i, satz('v' + i, 'Seite ' + i)])) };
const vieleErs = V.rechnen(viele, { blocks: {} }, 'ersetzen');
gleich('Vierzig verschwinden, fünf werden genannt',
  [vieleErs.verschwindet.anzahl, vieleErs.verschwindet.titel.length], [40, V.TITEL]);
p('Und der Satz sagt, dass es mehr sind', /…/.test(V.satz(vieleErs)), V.satz(vieleErs));

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: was nicht geschieht, steht nicht da');

const harmlos = V.rechnen(HIER, { blocks: { ...HIER.blocks, e: satz('e', 'Neu') } },
                          'zusammenfuehren');
const ht = V.satz(harmlos);
p('Kein Wort von Verschwinden, wenn nichts verschwindet',
  !/verschwind/i.test(ht), ht);
p('Und keine Null', !/\b0 /.test(ht), ht);
p('`warnt` sagt nein', V.warnt(harmlos) === false);
/* Und der stillste Fall von allen. */
gleich('Dieselbe Sicherung noch einmal: „ändert nichts"',
  V.satz(V.rechnen(HIER, HIER, 'ersetzen')),
  'Diese Sicherung ändert nichts — sie ist derselbe Stand.');

/* ------------------------------------------------------------------------ */
console.log('\n6 · Im Dialog steht er wirklich');

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 860 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const imDialog = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const eigen = Store.addPage(null, { text: 'Meine Prüfungsvorbereitung' });
  await Store.flush();

  /* Eine Sicherung, die diese Seite NICHT enthält — beim Ersetzen wäre sie
     weg, und genau das muss dastehen, bevor jemand tippt. */
  const fremd = { version: 4, blocks: {
    'fremd-1': { id: 'fremd-1', type: 'page', text: 'Fremde Seite',
                 content: [], parentId: null, parentTable: 'block',
                 alive: true, created: '2026-07-01T09:00:00.000Z',
                 edited: '2026-07-01T09:00:00.000Z' }
  }, collections: {}, views: {}, meta: {}, versions: [], dateien: [], stuecke: [] };

  /* Den Dialog nicht öffnen, sondern seine Rechnung fahren — der Weg
     dorthin führt über einen Dateiwähler, und der lässt sich nicht
     antippen. Gemessen wird, was in den Knopf geschrieben WIRD. */
  const faecherJetzt = { blocks: Store.cache.blocks || {},
                         collections: Store.cache.collections || {},
                         views: Store.cache.views || {} };
  const faecherDatei = { blocks: fremd.blocks, collections: {}, views: {} };
  const e = w.ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'ersetzen');
  const d = w.ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'zusammenfuehren');
  return { ersetzen: w.ImportVergleich.satz(e), dazu: w.ImportVergleich.satz(d),
           warntErs: w.ImportVergleich.warnt(e), warntDazu: w.ImportVergleich.warnt(d),
           meine: eigen.id };
});

p('Beim Ersetzen steht die eigene Seite namentlich da',
  imDialog.ersetzen.includes('Meine Prüfungsvorbereitung'), imDialog.ersetzen);
p('Und es wird gewarnt', imDialog.warntErs === true);
p('Beim Dazulegen nicht — dort verschwindet nichts',
  !/verschwind/i.test(imDialog.dazu) && imDialog.warntDazu === false, imDialog.dazu);

/* Und der Quelltext: der alte Satz mit den zwei Zahlen ist wirklich weg. */
const quelle = fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
p('Der alte Satz „In diesem Bestand liegen gerade" steht nicht mehr im Code',
  !quelle.includes('In diesem Bestand liegen gerade'));
p('Und der Dialog fragt den Kern', /ImportVergleich\.satz\(/.test(quelle));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
