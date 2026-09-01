/* Suite 312 — Ein verkürzter Anhang wird genannt (L101 Punkt 4, E318)
 * ============================================================================
 * Der VERSCHLÜSSELTE Weg vergleicht seit jeher die angekündigte Bytezahl mit
 * der gelieferten:
 *
 *     if (!blob || blob.size !== e.bytes)
 *       throw new Error(`Der verschlüsselte Eintrag „…" fehlt oder ist
 *                        abgeschnitten.`);            krypto.ts
 *
 * Der OFFENE Weg hatte dieselbe Zahl vorliegen — jeder Dateisatz führt seine
 * `groesse` mit — und sah nicht hin. Er schrieb die TATSÄCHLICHE Länge in den
 * Satz und stempelte `zustand: 'fertig'`. Ein halbes Video hiess danach
 * vollständig.
 *
 *   §1 DER GUTE FALL: nichts ist verkürzt, und es steht auch nichts da.
 *   §2 EIN VERKÜRZTER ANHANG wird gezählt, benannt und mit Fehlmenge genannt.
 *   §3 ER WIRD TROTZDEM ÜBERNOMMEN — neunzig Prozent sind neunzig Prozent.
 *   §4 DIE DREI AUSNAHMEN schweigen: keine Grösse, unfertiger Satz, MEHR da.
 *   §5 `dateien.json` GEHT DURCH DIE ENTGIFTUNG, nicht durch `JSON.parse`.
 *
 * DIE GEGENPROBE ZUERST (§55.2): §1 und §4 sind der eigentliche Prüfstein.
 * Eine Warnung, die bei einer gewöhnlichen Sicherung anspringt, wird nach
 * dem zweiten Mal weggeklickt — und dann auch beim dritten Mal, wenn sie
 * recht hat.
 *
 *   node pruefungen/lauf/test312.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9323;

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

const messen = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  const bytes = (n: number): Blob =>
    new Blob([new Uint8Array(Array.from({ length: n }, (_, i) => (i * 7) % 251))],
             { type: 'application/octet-stream' });

  /* Ein Anhang im Bestand, damit `dateien.json` echt ist. */
  const seite = Store.addPage(null, { text: 'Mit Anhang' });
  await w.Dateien.ablegen(bytes(4000), { name: 'gross.bin', blockId: seite.id });
  await Store.flush();

  const echt = (await Store.dateiAlle())[0];

  /**
   * Ein Archiv bauen, in dem `dateien.json` etwas ANDERES behauptet als die
   * Bytes daneben hergeben. `aendern` bekommt den echten Satz und gibt den
   * zurück, der ins Archiv geschrieben wird; `bytesDa` sagt, wie viele Bytes
   * wirklich beiliegen.
   */
  const machArchiv = async (aendern: (s: any) => any, bytesDa: number) => {
    const satz = aendern(JSON.parse(JSON.stringify(echt)));
    const name = 'dateien/0_' + echt.name;
    return w.Austausch.zipSchreiben([
      { name: 'daten.json', inhalt: new Blob([JSON.stringify({
          version: 4, blocks: Store.cache.blocks, collections: {}, views: {},
          meta: {}, versions: [], dateien: [], stuecke: [] })]) },
      { name: 'dateien.json', inhalt: new Blob([JSON.stringify({
          saetze: [satz], zuordnung: { [name]: echt.id } })]) },
      { name, inhalt: bytes(bytesDa) }
    ]);
  };

  const einspielen = async (blob: Blob) => {
    const zip = await w.Einlesen.zipLesenAusBlob(blob);
    await Store.importAll(await zip.text('daten.json'), 'zusammenfuehren');
    /* Blosser Name: `App` steht absichtlich nicht auf `window`. */
    return App.anhaengeEinspielen(zip, 'zusammenfuehren');
  };

  const gleichBleibt = (s: any) => s;

  /* §1 der gute Fall — 4000 angekündigt, 4000 da. */
  const heil = await einspielen(await machArchiv(gleichBleibt, 4000));

  /* §2/§3 verkürzt — 4000 angekündigt, 1500 da. */
  const kurz = await einspielen(await machArchiv(gleichBleibt, 1500));
  const nachKurz = (await Store.dateiAlle()).find((d: any) => d.id === echt.id);
  const bytesNachKurz = (await Store.stueckeVon(echt.id))
    .reduce((n: number, s: any) => n + s.blob.size, 0);

  /* §4 die drei Ausnahmen — jedes Mal 1500 statt 4000, und trotzdem still. */
  const ohneGroesse = await einspielen(await machArchiv(
    (s: any) => { delete s.groesse; return s; }, 1500));
  const nochOffen = await einspielen(await machArchiv(
    (s: any) => { s.zustand = 'laeuft'; return s; }, 1500));
  const halbDa = await einspielen(await machArchiv(
    (s: any) => { s.angekommen = 1; s.teile = 4; return s; }, 1500));
  const mehrDa = await einspielen(await machArchiv(
    (s: any) => { s.groesse = 900; return s; }, 1500));

  return {
    heil, kurz, ohneGroesse, nochOffen, halbDa, mehrDa,
    nameEcht: echt.name, groesseEcht: echt.groesse,
    zustandNachKurz: nachKurz?.zustand, groesseNachKurz: nachKurz?.groesse,
    bytesNachKurz
  };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der gute Fall: nichts verkürzt, nichts gesagt');

gleich('Der Anhang wurde mit 4000 Bytes angelegt', messen.groesseEcht, 4000);
gleich('Er kommt an, und nichts fehlt und nichts ist verkürzt',
  [messen.heil.da, messen.heil.fehlend.length, messen.heil.unvollstaendig.length],
  [1, 0, 0]);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein verkürzter Anhang wird genannt');

gleich('Er kommt an — und wird trotzdem gemeldet',
  [messen.kurz.da, messen.kurz.unvollstaendig.length], [1, 1]);
p('Er wird beim Namen genannt',
  (messen.kurz.unvollstaendig[0] || '').includes(messen.nameEcht),
  JSON.stringify(messen.kurz.unvollstaendig));
p('Und mit der Fehlmenge, nicht nur mit dem Wort „verkürzt"',
  /2\.4 KB fehlen/.test(messen.kurz.unvollstaendig[0] || ''),
  JSON.stringify(messen.kurz.unvollstaendig));
p('Er steht NICHT unter „fehlend" — das ist eine andere Nachricht',
  messen.kurz.fehlend.length === 0, JSON.stringify(messen.kurz.fehlend));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Übernommen wird er trotzdem (§46)');

/* WEGWERFEN WÄRE DAS FALSCHE. Neunzig Prozent eines Fotos sind neunzig
   Prozent; im offenen Archiv ist eine Verkürzung viel eher eine
   unvollständige Sicherung als ein Angriff. */
gleich('Die 1500 Bytes liegen wirklich in der Ablage', messen.bytesNachKurz, 1500);
gleich('Und der Satz nennt die TATSÄCHLICHE Länge, nicht die behauptete',
  messen.groesseNachKurz, 1500);
p('Der Zustand ist „fertig" — die Stücke, die da sind, sind vollständig da',
  messen.zustandNachKurz === 'fertig', String(messen.zustandNachKurz));

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: die drei Ausnahmen schweigen');

/* JEDE EINZELNE IST EIN ECHTER NORMALFALL. Eine Warnung, die hier anspringt,
   springt bei jeder zweiten Sicherung an — und wird dann auch beim dritten
   Mal weggeklickt, wenn sie recht hat. */
gleich('Ohne `groesse` gibt es nichts zu vergleichen',
  messen.ohneGroesse.unvollstaendig, []);
gleich('Ein Satz, der beim Sichern noch lief, ist erwartbar kurz',
  messen.nochOffen.unvollstaendig, []);
gleich('Ein Satz mit `angekommen < teile` ebenso',
  messen.halbDa.unvollstaendig, []);
gleich('Und MEHR als angekündigt ist keine Verkürzung',
  messen.mehrDa.unvollstaendig, []);
p('Alle vier sind trotzdem angekommen',
  [messen.ohneGroesse, messen.nochOffen, messen.halbDa, messen.mehrDa]
    .every((e: any) => e.da === 1),
  JSON.stringify([messen.ohneGroesse.da, messen.nochOffen.da,
                  messen.halbDa.da, messen.mehrDa.da]));

/* ------------------------------------------------------------------------ */
console.log('\n5 · `dateien.json` geht durch die Entgiftung');

const quelle = fs.readFileSync(path.join(WURZEL, 'src/schale/aufbau/schale.ts'), 'utf-8');
const griff = quelle.slice(quelle.indexOf('const anhaengeEinspielen'),
                           quelle.indexOf('const sicherungLaden'));

/* E284 hat `Object.assign` aus geparster JSON für die fünf Fächer
   geschlossen. Hier stand es noch offen, ein Stockwerk tiefer — und der
   Inhalt geht wörtlich durch `Object.assign` in die Ablage. */
p('Kein blankes JSON.parse mehr auf `dateien.json`',
  !/JSON\.parse\(roh\)/.test(griff), 'JSON.parse(roh) steht noch da');
p('Sondern ImportSicherheit.lesen', /ImportSicherheit\.lesen\(roh\)/.test(griff));
p('Und die Namenskarte ist prototyplos',
  /nachName[^=]*=\s*Object\.create\(null\)/.test(griff),
  'Object.create(null) fehlt bei nachName');

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
