/* Suite 333 — Zwei Tabs, eine Merkliste (L75, E341)
 * ============================================================================
 * L75 sagte seit dem 29. August: „Lesen-Ändern-Schreiben derselben Liste in
 * zwei Tabs KANN Einträge des jeweils anderen überschreiben."
 *
 * KANN. Gemessen wurde es nie — und beim Nachmessen war es kein „kann":
 *
 *     Zwei Tabs auf derselben Ablage, beide hängen einen Grabstein an.
 *     Danach steht EINER da. Der andere ist fort.
 *     Still, ohne Fehler, ohne Meldung.
 *
 * Was das kostet, steht in E249 und E254: ein Grabstein, der nie zum Server
 * geht, heisst ein Block, der lokal gelöscht ist und auf dem anderen Gerät
 * weiterlebt. Genau dagegen gibt es die Merklisten.
 *
 *   §1 DER GRIFF SELBST — anhängen, austragen, ablehnen.
 *   §2 ZWEI TABS GLEICHZEITIG: beide Einträge überleben.
 *   §3 UND DER ALTE WEG verliert einen — sonst misst §2 nichts.
 *   §4 DIE DREI MERKLISTEN gehen wirklich über den neuen Griff.
 *   §5 GEGENPROBE: nacheinander war schon vorher richtig, und bleibt es.
 *
 *   node pruefungen/lauf/test333.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9336;

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
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
/* EIN Kontext = EIN Browserprofil = DIESELBE IndexedDB. Zwei Seiten darin
   sind das, was ein Mensch „zwei Tabs" nennt — und genau darum geht es. */
const ktx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
const tabA = await ktx.newPage();
const tabB = await ktx.newPage();
for (const s of [tabA, tabB]) {
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(
    () => (document.getElementById('tree')?.children.length || 0) > 0,
    null, { timeout: 30000 });
  await s.waitForTimeout(1800);
}

const bereit = async (s: any): Promise<void> => {
  await s.waitForFunction(
    () => (document.getElementById('tree')?.children.length || 0) > 0,
    null, { timeout: 30000 });
  await s.waitForTimeout(1400);
};
const neu = async (s: any): Promise<void> => { await s.reload(); await bereit(s); };

const SCHL = 'test333Liste';
const leeren = async (): Promise<void> => {
  await tabA.evaluate(async (k: string) => {
    Store.setMeta(k, []);
    if (Store.flush) await Store.flush();
  }, SCHL);
  await neu(tabA); await neu(tabB);
};
const lesen = (s: any): Promise<string[]> => s.evaluate((k: string) =>
  (Store.getMeta(k, []) || []).map((x: any) => x && x.id), SCHL);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Griff selbst');

await leeren();
const griff = await tabA.evaluate(async (k: string) => {
  await Store.metaListeAnhaengen(k, { id: 'x1' });
  await Store.metaListeAnhaengen(k, { id: 'x2' });
  const nachAnhaengen = (Store.getMeta(k, []) || []).map((x: any) => x.id);
  /* `null` heisst „nichts zu tun" — dann wird gar nicht geschrieben. */
  const abgelehnt = await Store.metaListeAendern(k, () => null);
  const nachAblehnen = (Store.getMeta(k, []) || []).map((x: any) => x.id);
  await Store.metaListeAendern(k,
    (alt: any[]) => alt.filter((e: any) => e && e.id !== 'x1'));
  const nachAustragen = (Store.getMeta(k, []) || []).map((x: any) => x.id);
  return { nachAnhaengen, abgelehnt: abgelehnt.map((x: any) => x.id), nachAblehnen,
           nachAustragen };
}, SCHL);

gleich('Zweimal anhängen ergibt zwei', griff.nachAnhaengen, ['x1', 'x2']);
gleich('Ein `null` schreibt nicht', griff.nachAblehnen, ['x1', 'x2']);
gleich('Und gibt trotzdem die Liste zurück', griff.abgelehnt, ['x1', 'x2']);
gleich('Austragen nimmt genau einen weg', griff.nachAustragen, ['x2']);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Zwei Tabs gleichzeitig — beide Einträge überleben');

/* DER FALL, DEN L75 BESCHRIEB. Beide Tabs lesen denselben Stand und
   schreiben zurück, ohne voneinander zu wissen. */
await leeren();
await Promise.all([
  tabA.evaluate((k: string) => Store.metaListeAnhaengen(k, { id: 'a' }), SCHL),
  tabB.evaluate((k: string) => Store.metaListeAnhaengen(k, { id: 'b' }), SCHL)
]);
await Promise.all([
  tabA.evaluate(async () => { if (Store.flush) await Store.flush(); }),
  tabB.evaluate(async () => { if (Store.flush) await Store.flush(); })
]);
await neu(tabA);
const beide = (await lesen(tabA)).sort();

gleich('Beide stehen da', beide, ['a', 'b']);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der alte Weg verliert einen');

/* OHNE DIESEN ABSCHNITT MISST §2 NICHTS. Er stellt das Muster nach, das
   vor E341 überall stand — `getMeta` aus dem Zwischenspeicher DIESES Tabs,
   dann `setMeta` mit dem ganzen Ergebnis. */
await leeren();
const altModus = async (s: any, wert: string): Promise<void> =>
  s.evaluate(([k, w]: string[]) => {
    const alt = Store.getMeta(k, []) || [];
    Store.setMeta(k, alt.concat([{ id: w }]));
  }, [SCHL, wert]);
await Promise.all([altModus(tabA, 'a'), altModus(tabB, 'b')]);
await Promise.all([
  tabA.evaluate(async () => { if (Store.flush) await Store.flush(); }),
  tabB.evaluate(async () => { if (Store.flush) await Store.flush(); })
]);
await neu(tabA);
const alterWeg = (await lesen(tabA)).sort();

gleich('Auf dem alten Weg überlebt genau einer', alterWeg.length, 1);
p('Und es ist einer der beiden', ['a', 'b'].includes(String(alterWeg[0])),
  JSON.stringify(alterWeg));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die drei Merklisten gehen über den neuen Griff');

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf-8');
const ohneKommentar = quelle.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* JEDE EINZELN. Ein Sammelmuster wäre auch dann grün, wenn drei von vier
   noch den alten Weg gingen. */
for (const [name, muster] of [
  ['Dateigrabstein anlegen',   /metaListeAendern\('wolkeDateienWeg',\s*\n?\s*alt => alt\.includes\(kennung\)/],
  ['Dateigrabstein austragen', /metaListeAendern\('wolkeDateienWeg',\s*\n?\s*alt => alt\.includes\(k\)/],
  ['Hochgeladen-Liste',        /metaListeAendern\('wolkeDateienOben'/],
  ['Blockgrabstein anlegen',   /metaListeAendern\('wolkeBloeckeWeg',\s*\n?\s*alt => alt\.filter/],
  ['Blockgrabstein austragen', /metaListeAendern\('wolkeBloeckeWeg',\s*\n?\s*alt => alt\.some/]
] as Array<[string, RegExp]>)
  p(name + ' geht über den atomaren Griff', muster.test(ohneKommentar));

/* UND KEINE DAVON MEHR ÜBER `setMeta`. */
p('Keine Merkliste wird mehr mit `setMeta` überschrieben',
  !/setMeta\('wolkeBloeckeWeg', liste/.test(ohneKommentar) &&
  !/setMeta\('wolkeDateienWeg', \[\.\.\.weg2\]/.test(ohneKommentar),
  '');

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: nacheinander war schon vorher richtig');

/* WÄRE §2 AUCH MIT EINEM GRIFF GRÜN, DER EINFACH IMMER ALLES BEHÄLT? Nein
   — dann bliebe hier ein ausgetragener Eintrag stehen. */
await leeren();
await tabA.evaluate(async (k: string) => {
  await Store.metaListeAnhaengen(k, { id: 'eins' });
  if (Store.flush) await Store.flush();
}, SCHL);
await neu(tabB);
await tabB.evaluate(async (k: string) => {
  await Store.metaListeAnhaengen(k, { id: 'zwei' });
  if (Store.flush) await Store.flush();
}, SCHL);
await neu(tabA);
const nacheinander = (await lesen(tabA)).sort();
gleich('Nacheinander stehen beide da', nacheinander, ['eins', 'zwei']);

await tabA.evaluate(async (k: string) => {
  await Store.metaListeAendern(k,
    (alt: any[]) => alt.filter((e: any) => e && e.id !== 'eins'));
  if (Store.flush) await Store.flush();
}, SCHL);
await neu(tabB);
gleich('Und ein ausgetragener bleibt fort', await lesen(tabB), ['zwei']);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
