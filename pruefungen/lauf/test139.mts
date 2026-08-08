/* Suite 103 — Ein Typ, der lügt, ist schlimmer als keiner
 * ============================================================================
 * Die Typen unter `src/core/types/` beschreiben, was in der Ablage und in
 * einer Sicherungsdatei steht. Sie erzeugen nichts (`noEmit`) — niemand
 * merkt also zur Laufzeit, wenn sie danebenliegen. Genau deshalb müssen
 * sie geprüft werden, und zwar gegen die WIRKLICHKEIT: gegen eine echte
 * Sicherung und gegen die Register.
 *
 * ZWEI FUNDE VOM 8. AUGUST, beide aus derselben Suche wie E65:
 *
 *   `RedionPackageData` sagte `blocks: RedionBlock[]` — eine Liste.
 *   Geschrieben wird `cache.blocks`, und das ist ein `Record<string, any>`.
 *   Der Einleser holt es mit `d.blocks || {}` genauso zurück. So steht es
 *   in JEDER bereits geschriebenen Sicherungsdatei.
 *
 *   `ViewLayout` zählte zwölf Ansichtsarten auf. `Register.ansichten` hat
 *   dreizehn — `raster` fehlte, obwohl es die Ansicht seit langem gibt.
 *
 * Beide Male ist der TYP falsch und nicht die App. Ein Typ lässt sich
 * ändern; ein Sicherungsformat nicht, ohne jede vorhandene Datei unlesbar
 * zu machen (CLAUDE.md §52.8).
 *
 * WIE HIER GEPRÜFT WIRD. Der Quelltext der Typdatei wird GELESEN und mit
 * dem verglichen, was die laufende App tut. Das ist umständlicher als eine
 * Typprüfung — aber `tsc` kann nur prüfen, ob der Code zum Typ passt, nicht
 * ob der Typ zur Datei auf der Festplatte passt.
 *
 *   node pruefungen/lauf/test139.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8817;

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

const lies = (rel: string) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

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

console.log('\n1 · Die Sicherung: Verzeichnisse, keine Listen');

/* Eine ECHTE Sicherung, mit echtem Inhalt. */
const sicherung = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Typprobe' });
  Store.addBlock(s.id, 'text', { text: 'Ein Absatz' });
  const db = Store.addDatabase(s.id, 'Kunden', { title: { name: 'Kunde', type: 'title' } }, 'table');
  Store.addRow(Store.getCollection(db.collectionId).id, { title: 'Meier' });
  await new Promise(r => setTimeout(r, 300));
  const roh = await Store.exportAll();
  const d = JSON.parse(roh);
  const art = (v: unknown) => Array.isArray(v) ? 'Liste'
            : (v && typeof v === 'object') ? 'Verzeichnis' : typeof v;
  return {
    felder: Object.keys(d),
    blocks: art(d.blocks), collections: art(d.collections),
    views: art(d.views), meta: art(d.meta), versions: art(d.versions),
    /* Und dass wirklich etwas drin ist — ein leeres Objekt sähe auch aus
       wie ein Verzeichnis. */
    wieViele: Object.keys(d.blocks ?? {}).length
  };
});

p('Die Sicherung enthält Blöcke', ((sicherung as any).wieViele ?? 0) >= 3,
  String((sicherung as any).wieViele));
for (const feld of ['blocks', 'collections', 'views', 'meta'] as const)
  gleich(`\`${feld}\` ist ein Verzeichnis`, (sicherung as any)[feld], 'Verzeichnis');
gleich('`versions` ist dagegen wirklich eine Liste', (sicherung as any).versions, 'Liste');

/* Und der Typ muss dasselbe sagen. Gelesen wird der Quelltext, weil `tsc`
   nur prüft, ob der Code zum Typ passt — nicht, ob der Typ zur Datei passt. */
const backupTs = lies('src/core/types/backup.ts');
/* Bis zur schliessenden Klammer AM ZEILENANFANG. `[^}]*}` wäre der
   naheliegende Ausdruck und ist falsch: der erklärende Kommentar im Typ
   nennt `d.blocks || {}`, und daran hörte die Fassung auf — alle vier
   Felder galten als „fehlt". Ein Prüflauf, der am Kommentar scheitert,
   meldet einen Fehler im Code, den es nicht gibt. */
const paket = /export interface RedionPackageData[\s\S]*?\n}/.exec(backupTs)?.[0] ?? '';
p('Der Typ RedionPackageData steht in der Datei', paket.length > 40);
for (const feld of ['blocks', 'collections', 'views', 'meta'] as const) {
  const zeile = new RegExp(`^\\s*${feld}:\\s*(.+);`, 'm').exec(paket)?.[1] ?? '(fehlt)';
  p(`… und sagt für \`${feld}\` ein Verzeichnis`, /^Record</.test(zeile.trim()),
    zeile.trim());
}
p('… und für `versions` eine Liste',
  /versions:\s*RedionVersion\[\]/.test(paket));

console.log('\n2 · Die Ansichtsarten: Typ gegen Register');
const ansichten = await seite.evaluate(() =>
  (Register as any).ansichten.alle().map((x: any) => Array.isArray(x) ? x[0] : x.id));
const dbTs = lies('src/core/types/database.ts');
const layoutBlock = /export type ViewLayout =([\s\S]*?);/.exec(dbTs)?.[1] ?? '';
const imTyp = [...layoutBlock.matchAll(/'([a-z]+)'/g)].map(m => m[1]);

p('Das Register kennt Ansichtsarten', (ansichten as string[]).length >= 12,
  String((ansichten as string[]).length));
p('Der Typ ViewLayout steht in der Datei', imTyp.length >= 12, String(imTyp.length));

const fehltImTyp = (ansichten as string[]).filter(a => !imTyp.includes(a));
const fehltImRegister = imTyp.filter(t => !(ansichten as string[]).includes(t as string));
p('Jede Ansicht des Registers steht auch im Typ', fehltImTyp.length === 0,
  'fehlt im Typ: ' + JSON.stringify(fehltImTyp));
p('Und der Typ erfindet keine, die es nicht gibt', fehltImRegister.length === 0,
  'nur im Typ: ' + JSON.stringify(fehltImRegister));

console.log('\n3 · Die Überschriften stehen an EINER Stelle');
/* Vorher zweimal: als TOC_STUFEN im Editor und als Literalliste in
   `inhaltsflaeche.ts`. Die zwei Listen waren verschieden — der Unterschied
   lag allerdings in toten Schlüsseln, denn eine Toggle-Überschrift wird als
   `type:'h1'` mit `toggleKopf` gespeichert, nicht als `'toggle-h1'`.
   Also keine falsche Anzeige, aber sehr wohl zwei Kataloge für eine Sache. */
const ueber = await seite.evaluate(() => {
  const r = (Register as any).bloecke.ueberschriften();
  return { stufen: r, anzahl: Object.keys(r).length };
});
p('Das Register beantwortet, was eine Überschrift ist',
  ((ueber as any).anzahl ?? 0) >= 6, JSON.stringify((ueber as any).stufen));
gleich('h1 ist Stufe 1', (ueber as any).stufen?.h1, 1);
gleich('h3 ist Stufe 3', (ueber as any).stufen?.h3, 3);

const schaleTs = lies('src/schale/aufbau/inhaltsflaeche.ts');
const editorTs = lies('src/bereiche/editor/ansicht/editor.ts');
p('Der Gliederungsstreifen liest das Register',
  /Register\.bloecke\?\.ueberschriften/.test(schaleTs));
p('Das Inhaltsverzeichnis ebenfalls',
  /Register\.bloecke\?\.ueberschriften/.test(editorTs));

/* Und die Wirkung: eine Toggle-Überschrift zählt in BEIDEN mit. */
const beide = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Gliederung' });
  ['Eins', 'Zwei', 'Drei'].forEach(t => {
    const b = Store.addBlock(s.id, 'h1', { text: t });
    Store.updateBlock(b.id, { toggleKopf: true, open: true });
  });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  const stufen = (Register as any).bloecke.ueberschriften();
  const kinder = Store.childrenOf(s.id).filter((b: any) => b.alive);
  return { typen: kinder.map((b: any) => b.type),
           zaehlenAls: kinder.filter((b: any) => stufen[b.type]).length };
});
p('Eine Toggle-Überschrift wird als h1 gespeichert',
  ((beide as any).typen ?? []).every((t: string) => t === 'h1'),
  JSON.stringify((beide as any).typen));
gleich('… und zählt als Überschrift', (beide as any).zaehlenAls, 3);

console.log('\n4 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 103 — Typen gegen Wirklichkeit: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
