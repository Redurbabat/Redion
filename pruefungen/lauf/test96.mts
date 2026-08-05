/* Suite 61 — Die Sicherung hält, was sie verspricht
 * ----------------------------------------------------------------------------
 * `doku/NOTION-10000X-BESSER.md` Teil 4 sagt über die Sicherung:
 *
 *   „Der JSON-Export enthält Blöcke, Datenbanken, Ansichten, Relationen,
 *    Formeln, **Versionen**. Wieder eingespielt kommt derselbe Stand heraus."
 *
 * Geprüft war bisher, dass der Export **läuft**. Nicht, dass der Bestand
 * danach **derselbe** ist. Das ist die Zusicherung, die man am ehesten glaubt
 * und am wenigsten prüft — und drei Teile davon stimmten nicht.
 *
 * ─── 1. DER VERSIONSVERLAUF WAR NIE DABEI ───────────────────────────────────
 *
 * `exportAll` nahm vier der neun Fächer mit: blocks, collections, views, meta.
 * Nicht dabei: `versions`, `dateien`, `stuecke`, `basis`. Wer seine Sicherung
 * auf einem neuen Rechner einspielte, bekam seine Seiten zurück — und keinen
 * einzigen Verlauf. Nachgestellt: eine Fassung vor dem Export, **null** danach.
 *
 * Dass es niemandem auffiel, liegt in der Natur der Sache: man merkt das
 * Fehlen eines Verlaufs erst, wenn man ihn braucht, und dann ist die alte
 * Ablage längst weg.
 *
 * ─── 2. DER IMPORT RÄUMTE NUR DEN ZWISCHENSPEICHER ──────────────────────────
 *
 * Er schrieb die Sicherung über den Cache und liess die Ablage stehen. Wer
 * eine Sicherung in einen nicht leeren Bestand einspielte, sah genau das
 * Richtige — **bis zum Neuladen**. Dann kamen alle alten Seiten zurück und
 * lagen zwischen den eingespielten. Nachgestellt: die „GEISTERSEITE" war nach
 * dem Neuladen wieder da.
 *
 * Das ist die schlimmste Sorte Fehler, die diese App haben kann: sie sieht
 * aus wie ein geglückter Vorgang.
 *
 * ─── 3. DATEIEN SIND WEITERHIN NICHT DABEI — ABER JETZT STEHT ES DA ─────────
 *
 * `dateien` und `stuecke` halten Blobs. `JSON.stringify` macht daraus `{}` —
 * sie wären scheinbar dabei und in Wahrheit leer, und das ist schlimmer als
 * zu fehlen. Sie brauchen einen eigenen Weg. Bis dahin **sagt die Sicherung,
 * was sie nicht enthält**. Ein bekannter Mangel, der benannt ist, ist kein
 * stiller Verlust — und genau diese Zeile prüft dieser Lauf mit.
 *
 *   node pruefungen/lauf/test96.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8805;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };
const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const kontext = await browser.newContext();
const seite = await kontext.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined',
                            null, { timeout: 20000 });

/* ========================================================================= *
 * 1 · WAS IN DIE SICHERUNG GEHÖRT
 * ========================================================================= */
console.log('\n1 · Was in der Sicherung steht');

/* JEDER NEUE NAME WIRD GEPRÜFT, NICHT VORAUSGESETZT. Beim Schreiben von
   test92 stürzte die Gegenprobe am festen `import` ab, bevor eine einzige
   Prüfung lief — rot war sie, aber sie sagte nicht, was fehlt. Hier ist es
   dasselbe: dreht man die Reparatur zurück, gibt es `exportVorbereiten`
   nicht mehr. Ein Lauf, der dann mit „is not a function" stirbt, ist kein
   Beleg, sondern ein Ärgernis. */
const hatNeueNamen = await seite.evaluate(() =>
  typeof Store.exportVorbereiten === 'function');
p('Store bietet exportVorbereiten an', hatNeueNamen);

const gebaut = await seite.evaluate(async ([neu]) => {
  const p1 = Store.addPage(null, { text: 'Seite mit Verlauf' });
  Store.addBlock(p1.id, 'text', { text: 'Erster Stand' });
  await Store.versionSpeichern(p1.id, 'vor der Änderung');
  Store.addBlock(p1.id, 'todo', { text: 'Erledigt', checked: true });
  await Store.versionSpeichern(p1.id, 'nach der Änderung');
  await Store.flush();

  const stand = neu ? await Store.exportVorbereiten() : { versionen: 0, dateien: 0 };
  const json = Store.exportAll();
  return { json, stand, seiteId: p1.id,
           versionenEcht: (await Store.versionen(p1.id)).length };
}, [hatNeueNamen]);

const d = JSON.parse(gebaut.json);
gleich('Der Verlauf steht in der Sicherung', Array.isArray(d.versions), true);
gleich('… und zwar vollständig', (d.versions || []).length, gebaut.versionenEcht);
p('Die Sicherung sagt, was sie enthält', Array.isArray(d.enthaelt) &&
  (d.enthaelt ?? '').includes('versions'), JSON.stringify(d.enthaelt));
p('… und was nicht', 'fehlt' in d && 'hinweis' in d);
/* Ab hier braucht es die neue Fassung. Ohne sie melden die Abschnitte
   darunter reihenweise dasselbe — einmal sagen genügt. */
if (!hatNeueNamen) {
  console.log('\n  (Die übrigen Abschnitte brauchen die neue Fassung von indexdb.js.)');
  console.log(`\n  Suite 61 — Die Sicherung: ${ok} ok, ${weg} offen`);
  await browser.close(); server.close(); process.exit(1);
}
gleich('Ohne Anhänge fehlt nichts', d.fehlt, []);

/* ========================================================================= *
 * 2 · DER RUNDLAUF — FELD FÜR FELD
 * ---------------------------------------------------------------------------
 * „Wieder eingespielt kommt derselbe Stand heraus." Das ist die Zusicherung.
 * Sie wird hier nicht geglaubt, sondern verglichen.
 * ========================================================================= */
console.log('\n2 · Export → alles weg → Import');

const rund = await seite.evaluate(async ([json, id]) => {
  const vorher = JSON.parse(JSON.stringify({
    blocks: Store.cache.blocks, collections: Store.cache.collections,
    views: Store.cache.views, meta: Store.cache.meta
  }));
  const versionenVorher = await Store.versionen(id);

  await Store.wipe();
  const erg = await Store.importAll(json, 'ersetzen');

  const nachher = JSON.parse(JSON.stringify({
    blocks: Store.cache.blocks, collections: Store.cache.collections,
    views: Store.cache.views, meta: Store.cache.meta
  }));
  const versionenNachher = await Store.versionen(id);

  /* Feld für Feld statt „sieht gleich aus". */
  const unterschiede = [];
  for (const fach of ['blocks', 'collections', 'views']) {
    const a = vorher[fach], b = nachher[fach];
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in b)) { unterschiede.push(fach + '/' + k + ': fehlt danach'); continue; }
      if (!(k in a)) { unterschiede.push(fach + '/' + k + ': neu dazugekommen'); continue; }
      for (const f of new Set([...Object.keys(a[k]), ...Object.keys(b[k])]))
        if (JSON.stringify(a[k][f]) !== JSON.stringify(b[k][f]))
          unterschiede.push(fach + '/' + k + '.' + f);
    }
  }
  return { unterschiede, erg,
           versionenVorher: versionenVorher.length,
           versionenNachher: versionenNachher.length,
           anlaesse: versionenNachher.map(v => v.anlass).sort() };
}, [gebaut.json, gebaut.seiteId]);

gleich('Kein einziges Feld hat sich verändert', rund.unterschiede, []);
gleich('Der Verlauf ist danach vollständig da',
  rund.versionenNachher, rund.versionenVorher);
gleich('Und es sind dieselben Fassungen', rund.anlaesse,
  ['nach der Änderung', 'vor der Änderung']);

/* ========================================================================= *
 * 3 · DIE GEISTERSEITE
 * ---------------------------------------------------------------------------
 * Der Fehler, der aussah wie ein geglückter Vorgang.
 * ========================================================================= */
console.log('\n3 · Was beim Ersetzen wirklich verschwindet');

const geist = await seite.evaluate(async ([json]) => {
  const e = Store.addPage(null, { text: 'GEISTERSEITE' });
  await Store.flush();
  await Store.importAll(json, 'ersetzen');
  return { sofortWeg: !Store.getBlock(e.id), id: e.id };
}, [gebaut.json]);

p('Direkt nach dem Ersetzen ist die fremde Seite weg', geist.sofortWeg);

/* UND JETZT DIE FRAGE, AN DER ES HING: bleibt sie auch weg? */
await seite.reload();
await seite.waitForFunction(() => typeof Store !== 'undefined', null, { timeout: 20000 });
await seite.waitForTimeout(900);

const nachNeuladen = await seite.evaluate((id) => ({
  wiederDa: !!Store.getBlock(id),
  seitenDa: Object.values(Store.cache.blocks).filter((b: any) => b.type === 'page' && b.alive).length
}), geist.id);

p('Nach dem Neuladen kommt sie NICHT zurück', !nachNeuladen.wiederDa,
  nachNeuladen.wiederDa ? 'die Geisterseite ist wieder da' : '');

/* ========================================================================= *
 * 4 · DAZULEGEN IST DAS ANDERE, UND ES MUSS ES AUCH SEIN
 * ========================================================================= */
console.log('\n4 · Dazulegen wirft nichts weg');

const dazu = await seite.evaluate(async ([json]) => {
  const eigen = Store.addPage(null, { text: 'Meine eigene Seite' });
  await Store.flush();
  await Store.importAll(json, 'zusammenfuehren');
  return { eigeneDa: !!Store.getBlock(eigen.id), id: eigen.id };
}, [gebaut.json]);

p('Die eigene Seite überlebt das Dazulegen', dazu.eigeneDa);

await seite.reload();
await seite.waitForFunction(() => typeof Store !== 'undefined', null, { timeout: 20000 });
await seite.waitForTimeout(900);
p('… auch nach dem Neuladen',
  await seite.evaluate((id) => !!Store.getBlock(id), dazu.id));

/* ========================================================================= *
 * 5 · OHNE ANGABE GESCHIEHT NICHTS
 * ---------------------------------------------------------------------------
 * `CLAUDE.md`: nichts löschen ohne Rückfrage. Wer `importAll(json)` ohne
 * Angabe ruft, darf nicht die stille Entscheidung von jemand anderem
 * bekommen — er bekommt einen Fehler mit der Frage.
 * ========================================================================= */
console.log('\n5 · Ohne Angabe geschieht nichts');

/* Als Paar geschrieben, damit `json` hier eine Zeichenkette ist und nicht
   „Zeichenkette oder nichts" — `evaluate` bekommt genau ein Feld. */
const ohneArt = await seite.evaluate(async ([json]: [string]) => {
  const vorher = Object.keys(Store.cache.blocks).length;
  let meldung = '';
  /* `importAll` verlangt zwei Angaben. Genau der Aufruf mit nur einer ist
     hier der Prüfgegenstand — aus dem noch nicht umgezogenen JavaScript der
     App heraus ist er jederzeit möglich, TypeScript allein hielte ihn für
     ausgeschlossen. Die zweite Sicht auf dieselbe Funktion sagt das laut. */
  const ohneAngabe = Store.importAll as (json: string) => Promise<unknown>;
  try { await ohneAngabe(json); } catch (e: unknown) { meldung = (e instanceof Error ? e.message : String(e)); }
  return { meldung, unveraendert: Object.keys(Store.cache.blocks).length === vorher };
}, [gebaut.json] as [string]);

p('Ohne Angabe wird abgelehnt', /ersetzen|zusammenfuehren/.test(ohneArt.meldung ?? ''),
  ohneArt.meldung.slice(0, 90));
p('… und der Bestand bleibt unangetastet', ohneArt.unveraendert);
p('Die Meldung erklärt beide Wege',
  /wirft weg/.test(ohneArt.meldung ?? '') && /legt sie dazu/.test(ohneArt.meldung ?? ''));

/* Eine erfundene Angabe darf ebenfalls nichts tun — sonst wäre ein Tippfehler
   im Aufruf ein Datenverlust. */
const falscheArt = await seite.evaluate(async ([json]) => {
  const vorher = Object.keys(Store.cache.blocks).length;
  try { await Store.importAll(json, 'ueberschreiben'); } catch { /* erwartet */ }
  return Object.keys(Store.cache.blocks).length === vorher;
}, [gebaut.json]);
p('Auch eine erfundene Angabe tut nichts', falscheArt);

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 61 — Die Sicherung: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
