/* Suite 311 — Ein fehlender Anhang wird genannt (L101 Punkt 2, E317)
 * ============================================================================
 * Die Alles-oder-nichts-Zusage von `importAll` gilt für fünf Fächer. Die
 * ANHÄNGE folgen danach, jeder in einer eigenen Transaktion — ein grosses
 * Video in einer einzigen würde die Ablage minutenlang blockieren (§10).
 * Daran ändert dieser Bogen nichts, und er soll es auch nicht.
 *
 * Was er ändert, ist das SCHWEIGEN. Hier stand zweimal `continue`:
 *
 *     const name = nachName[satz.id];
 *     if (!name) continue;
 *     const roh2 = await zip.alsBlob(name);
 *     if (!roh2) continue;                        schale.ts:1952-1955
 *
 * Fehlte ein Eintrag im Archiv, wurde er übersprungen. Am Ende meldete
 * Redion, wie viele es GESCHAFFT haben — nie, wie viele nicht. Ein Block
 * zeigte danach auf eine Datei, die es nicht gibt, und niemand hatte etwas
 * gesagt.
 *
 *   §1 DER GUTE FALL: alle Anhänge kommen an, und es fehlt nichts.
 *   §2 EIN ARCHIV MIT LOCH: der fehlende wird gezählt und BENANNT.
 *   §3 UND DIE ÜBRIGEN kommen trotzdem an — ein Loch bricht nicht den Rest.
 *   §4 GEGENPROBE IM TEXT: im guten Fall steht kein Wort von Fehlen.
 *
 *   node pruefungen/lauf/test311.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9322;

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

/**
 * Ein Archiv bauen, in dem ein Anhang FEHLT.
 *
 * Nicht nachgestellt, sondern echt: derselbe ZIP-Schreiber, dieselbe
 * `dateien.json` — nur ein Eintrag ohne seine Bytes. Genau so sieht eine
 * Sicherung aus, die halb geschrieben wurde.
 */
const messen = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  const bytes = (n: number, f: number): Blob =>
    new Blob([new Uint8Array(Array.from({ length: n }, (_, i) => (i * f) % 251))],
             { type: 'application/octet-stream' });

  /* Drei Anhänge im Bestand. */
  const seite = Store.addPage(null, { text: 'Mit Anhängen' });
  const dateien: any[] = [];
  for (const [name, gr] of [['eins.bin', 300], ['zwei.bin', 400], ['drei.bin', 500]] as const) {
    const d = await w.Dateien.ablegen(bytes(gr, 7), { name, blockId: seite.id });
    dateien.push(d);
  }
  await Store.flush();

  /* Die Zuordnung wie im echten Export: Name im Archiv → Kennung. */
  const saetze = await Store.dateiAlle();
  const zuordnung: Record<string, string> = {};
  saetze.forEach((s: any, i: number) => { zuordnung['dateien/' + i + '_' + s.name] = s.id; });

  const machArchiv = async (auslassen: string) => {
    const eintraege: any[] = [
      { name: 'daten.json', inhalt: new Blob([JSON.stringify({
          version: 4, blocks: Store.cache.blocks, collections: {}, views: {},
          meta: {}, versions: [], dateien: [], stuecke: [] })]) },
      { name: 'dateien.json', inhalt: new Blob([JSON.stringify({ saetze, zuordnung })]) }
    ];
    for (const [name, id] of Object.entries(zuordnung)) {
      if (name.includes(auslassen)) continue;      /* DAS LOCH */
      const stuecke = await Store.stueckeVon(id);
      const teile = stuecke.sort((a: any, b: any) => a.nr - b.nr).map((s: any) => s.blob);
      eintraege.push({ name, inhalt: new Blob(teile) });
    }
    return w.Austausch.zipSchreiben(eintraege);
  };

  const einspielen = async (blob: Blob) => {
    const zip = await w.Einlesen.zipLesenAusBlob(blob);
    const daten = await zip.text('daten.json');
    await Store.importAll(daten, 'zusammenfuehren');
    /* `App` ist ein gewöhnliches `const` auf oberster Ebene und steht
       absichtlich NICHT auf `window` (src/global.d.ts). Blosser Name, wie
       test287 es auch tut — `w.App` wäre `undefined`. */
    return typeof App.anhaengeEinspielen === 'function'
      ? App.anhaengeEinspielen(zip, 'zusammenfuehren')
      : null;
  };

  const heil = await einspielen(await machArchiv('__nichts__'));
  const kaputt = await einspielen(await machArchiv('zwei.bin'));
  return { heil, kaputt, wieViele: saetze.length,
           namen: saetze.map((s: any) => s.name) };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der gute Fall: alles kommt an');

p('Es wurden drei Anhänge gebaut', messen.wieViele === 3, JSON.stringify(messen.namen));
p('Der Griff ist von aussen erreichbar', !!messen.heil,
  'App.anhaengeEinspielen fehlt im Rückgabeobjekt');
gleich('Drei erwartet, drei da, keiner fehlt',
  messen.heil && [messen.heil.erwartet, messen.heil.da, messen.heil.fehlend.length],
  [3, 3, 0]);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein Archiv mit Loch');

gleich('Drei erwartet, zwei da, einer fehlt',
  messen.kaputt && [messen.kaputt.erwartet, messen.kaputt.da, messen.kaputt.fehlend.length],
  [3, 2, 1]);
p('Und der fehlende wird beim Namen genannt',
  (messen.kaputt?.fehlend[0] || '').includes('zwei.bin'),
  JSON.stringify(messen.kaputt?.fehlend));
p('Mit dem Grund dazu',
  /steht nicht im Archiv|liess sich nicht lesen/.test(messen.kaputt?.fehlend[0] || ''),
  JSON.stringify(messen.kaputt?.fehlend));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Ein Loch bricht nicht den Rest ab');

/* VORHER WAR DAS NICHT SO SELBSTVERSTÄNDLICH: eine Ausnahme mitten in der
   Schleife nahm alle folgenden Anhänge mit. Wer neunzig von hundert retten
   kann, soll neunzig retten. */
gleich('Zwei von drei sind trotzdem angekommen', messen.kaputt?.da, 2);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: im guten Fall steht kein Wort von Fehlen');

const quelle = fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf-8');
p('Die Meldung nennt Fehlendes nur, wenn es welches gibt',
  /anhaenge\.fehlend\.length\s*\n?\s*\?/.test(quelle) ||
  /\(anhaenge\.fehlend\.length[\s\S]{0,40}\?/.test(quelle));
/* Und das alte stille `continue` ist wirklich weg. */
const codeOhneKommentar = quelle.replace(/\/\*[\s\S]*?\*\//g, ' ');
p('Kein stilles Überspringen mehr',
  !/if \(!name\) continue;/.test(codeOhneKommentar) &&
  !/if \(!roh2\) continue;/.test(codeOhneKommentar));
p('Sondern jeder Fall wird benannt',
  (codeOhneKommentar.match(/nichtGeschafft\(/g) || []).length >= 3,
  String((codeOhneKommentar.match(/nichtGeschafft\(/g) || []).length));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
