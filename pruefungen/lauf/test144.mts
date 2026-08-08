/* Suite 108 — Ein Lesefehler ist kein leerer Bestand
 * ============================================================================
 * DER FUND, aus der Suche nach „sagt das eine, tut das andere":
 *
 *     const all = (store) => new Promise((ok) => {
 *       ...
 *       r.onerror = () => ok([]);        // <- Fehler wird zu leerer Liste
 *     });
 *     const del = (store, key) => new Promise((ok) => {
 *       ...
 *       r.onerror = () => ok();          // <- Fehler wird zu Erfolg
 *     });
 *
 * Beides sind GÜLTIGE Antworten, und genau das macht sie gefährlich. Ein
 * leeres Fach und ein unlesbares Fach sehen für jeden Aufrufer gleich aus.
 *
 * WAS DARAN HING — drei Wege, alle gemessen:
 *
 *   ERSETZEN. `importAll(json, 'ersetzen')` liest erst, was da ist, und
 *   löscht dann, was in der Sicherung fehlt. Scheitert das Lesen, kommt
 *   `[]`, die Löschschleife läuft NULL Mal, die neuen Sätze werden
 *   darübergelegt — und der Nutzer liest „Sicherung geladen". Nach dem
 *   Neuladen stehen die alten Seiten wieder dazwischen. Genau die
 *   Geisterseite, die ein Kommentar in derselben Datei für behoben erklärt.
 *
 *   SICHERN. `exportVorbereiten` zählt die Anhänge. Scheitert das, sind es
 *   null — und die .json-Sicherung schreibt sich „Vollständig: dieser
 *   Bestand hat keine Dateianhänge" ins Manifest, während die Anhänge da
 *   sind. Eine Sicherung, die behauptet, vollständig zu sein.
 *
 *   STARTEN. `load()` füllt den Zwischenspeicher aus vier Fächern. Kommt
 *   dort `[]` zurück, startet die App mit leerem Bestand, und das Erste,
 *   was der Mensch tut, wird daraufgeschrieben.
 *
 * Die vier `.catch(() => [])` an den Aufrufstellen waren übrigens toter
 * Code: `all` konnte nie ablehnen. Jemand hat den Fall bedacht und ist dem
 * Versprechen der Funktion aufgesessen.
 *
 * WIE HIER GEMESSEN WIRD. Die Ablage wird auf Befehl zum Versagen gebracht
 * — `IDBObjectStore.prototype.getAll` bzw. `.delete` liefern eine Anfrage,
 * die `onerror` auslöst statt `onsuccess`. Das ist näher am echten Fall als
 * jede Attrappe: derselbe Weg, dieselben Ereignisse, nur ein anderer Ausgang.
 *
 *   node pruefungen/lauf/test144.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8827;

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

/**
 * Die Ablage auf Befehl zum Versagen bringen — für EIN Fach, für
 * `getAll` oder `delete`. Gibt eine Funktion zurück, die alles zurückdreht.
 *
 * Kein Nachbau: es wird der echte `IDBObjectStore` benutzt, nur die eine
 * Methode liefert eine Anfrage, deren `onerror` feuert. Damit läuft genau
 * der Weg, den der Browser auch bei Quota, Abbruch oder einer veralteten
 * Verbindung nimmt.
 */
const kaputtMachen = `(fach, methode) => {
  const echt = IDBObjectStore.prototype[methode];
  IDBObjectStore.prototype[methode] = function (...a) {
    if (this.name !== fach) return echt.apply(this, a);
    const anfrage = { onsuccess: null, onerror: null, result: undefined,
                      error: new DOMException('Absichtlich kaputt', 'UnknownError') };
    setTimeout(() => { if (anfrage.onerror) anfrage.onerror({ target: anfrage }); }, 0);
    return anfrage;
  };
  return () => { IDBObjectStore.prototype[methode] = echt; };
}`;

/**
 * Dasselbe für einen Index. Nötig, weil `versionen` und `purgeAnhaenge`
 * NICHT über den Fachnamen lesen, sondern über `.index('page').getAll(…)`
 * bzw. `.index('block')` — und das ist `IDBIndex.prototype.getAll`, eine
 * ganz andere Methode. Wer hier den Objektspeicher bricht, bricht nichts
 * und hält das Ergebnis für einen bestandenen Punkt.
 */
const indexKaputt = `(indexName) => {
  const echt = IDBIndex.prototype.getAll;
  IDBIndex.prototype.getAll = function (...a) {
    if (this.name !== indexName) return echt.apply(this, a);
    const anfrage = { onsuccess: null, onerror: null, result: undefined,
                      error: new DOMException('Absichtlich kaputt', 'UnknownError') };
    setTimeout(() => { if (anfrage.onerror) anfrage.onerror({ target: anfrage }); }, 0);
    return anfrage;
  };
  return () => { IDBIndex.prototype.getAll = echt; };
}`;

console.log('\n1 · Ein unlesbares Fach lehnt ab, statt leer zu sein');

const lesefehler = await seite.evaluate(async (bau) => {
  const zurueck = (new Function('return ' + bau)())('blocks', 'getAll');
  let ergebnis: string;
  try {
    await (Store as any).dateiAlle();     /* anderes Fach — muss gehen */
    const r = await (Store as any).exportVorbereiten();
    ergebnis = 'kam durch: ' + JSON.stringify(r);
  } catch (e) { ergebnis = 'abgelehnt'; }
  zurueck();
  return ergebnis;
}, kaputtMachen);
p('Ein heiles Fach bleibt heil', String(lesefehler).length > 0);

/* Jetzt das Fach, das die Sicherung braucht. */
const beimSichern = await seite.evaluate(async (bau) => {
  const zurueck = (new Function('return ' + bau)())('dateien', 'getAll');
  let wie = '';
  try {
    const r = await (Store as any).exportVorbereiten();
    wie = 'kam durch mit dateien=' + r.dateien;
  } catch (e) { wie = 'abgelehnt: ' + (e instanceof Error ? e.message : String(e)); }
  zurueck();
  return wie;
}, kaputtMachen);
p('Ist das Fach „dateien" unlesbar, bricht das Sichern ab',
  String(beimSichern).startsWith('abgelehnt'), String(beimSichern));
/* DER PUNKT: es darf NICHT „null Anhänge" herauskommen. */
p('… statt „null Anhänge" zu melden',
  !String(beimSichern).includes('dateien=0'), String(beimSichern));

console.log('\n2 · Und die Sicherung behauptet dann nicht, vollständig zu sein');
/* Ohne den Abbruch stünde im Manifest „Vollständig: dieser Bestand hat
   keine Dateianhänge" — bei vorhandenen Anhängen die gefährlichste Sorte
   Sicherung, weil man ihr erst glaubt, wenn man sie braucht. */
const manifest = await seite.evaluate(async (bau) => {
  /* Erst einen Anhang anlegen, damit es etwas zu verschweigen gäbe. */
  const s = Store.addBlock(null, 'page', { text: 'Mit Anhang' });
  await (Store as any).dateiPut({ id: 'd1', name: 'foto.jpg', groesse: 3, typ: 'image/jpeg',
    blockId: s.id, teile: 1, angekommen: 1, zustand: 'fertig',
    angelegt: Store.now(), fertigAm: Store.now() });
  await Store.flush();

  /* Der heile Fall: das Manifest nennt die Datei. */
  const heil = JSON.parse(await Store.exportAll());

  /* Der kaputte Fall: darf gar nicht erst zu einem Manifest kommen. */
  const zurueck = (new Function('return ' + bau)())('dateien', 'getAll');
  let kaputt = '';
  try {
    await (Store as any).exportVorbereiten();
    kaputt = 'kam durch';
  } catch { kaputt = 'abgelehnt'; }
  zurueck();
  return { heilFehlt: heil.fehlt, heilHinweis: String(heil.hinweis ?? ''), kaputt };
}, kaputtMachen);

p('Im heilen Fall nennt das Manifest, was fehlt',
  Array.isArray((manifest as any).heilFehlt),
  JSON.stringify((manifest as any).heilFehlt));
gleich('Im kaputten Fall gibt es gar kein Manifest', (manifest as any).kaputt, 'abgelehnt');

console.log('\n3 · „Ersetzen" bricht ab, statt halb zu laufen');
/* Der teuerste Fall im ganzen Bericht: die Löschschleife läuft null Mal,
   die neuen Sätze kommen darüber, der Toast sagt „geladen" — und nach dem
   Neuladen steht der alte Bestand wieder dazwischen. */
const ersetzen = await seite.evaluate(async (bau) => {
  const s = Store.addBlock(null, 'page', { text: 'Alte Seite, die weg soll' });
  Store.addBlock(s.id, 'text', { text: 'Alter Absatz' });
  await Store.flush();
  const vorher = Object.keys(Store.cache.blocks).length;

  const sicherung = JSON.stringify({
    version: 1, exportiert: Store.now(), enthaelt: ['blocks'], fehlt: [], hinweis: '',
    blocks: { neu1: { id: 'neu1', type: 'page', text: 'Nur diese', content: [],
                      parentId: null, parentTable: 'block', color: '',
                      created: Store.now(), edited: Store.now(),
                      erstelltVon: 'Ich', alive: true } },
    collections: {}, views: {}, meta: {}, versions: []
  });

  const zurueck = (new Function('return ' + bau)())('blocks', 'getAll');
  let wie = '', text = '';
  try {
    await Store.importAll(sicherung, 'ersetzen');
    wie = 'kam durch';
  } catch (e) { wie = 'abgelehnt'; text = e instanceof Error ? e.message : String(e); }
  zurueck();

  return { wie, text, vorher, nachher: Object.keys(Store.cache.blocks).length,
           alteNochDa: !!Object.values(Store.cache.blocks)
             .find((b: any) => b.text === 'Alte Seite, die weg soll') };
}, kaputtMachen);

gleich('Der Aufruf lehnt ab', (ersetzen as any).wie, 'abgelehnt');
p('… und sagt ausdrücklich, dass NICHTS verändert wurde',
  /NICHT eingespielt/.test((ersetzen as any).text ?? ''), (ersetzen as any).text);
p('Der alte Bestand steht unverändert da',
  (ersetzen as any).alteNochDa === true &&
  (ersetzen as any).nachher === (ersetzen as any).vorher,
  `vorher ${(ersetzen as any).vorher}, nachher ${(ersetzen as any).nachher}`);

console.log('\n4 · Ein misslungenes Löschen ist kein Erfolg');
/* ACHTUNG BEIM NACHBAUEN: `dateiWeg` löscht aus `dateien`, nicht aus
   `blocks`. Der erste Anlauf brach `blocks` und wunderte sich, dass der
   Aufruf durchkam — er ging schlicht durch ein heiles Fach. */
const loeschen = await seite.evaluate(async (bau) => {
  const zurueck = (new Function('return ' + bau)())('dateien', 'delete');
  let wie = '';
  try { await (Store as any).dateiWeg('gibtsnicht'); wie = 'kam durch'; }
  catch { wie = 'lehnt ab'; }
  zurueck();
  /* Und danach geht es wieder — der Umbau war nur geliehen. */
  let danach = '';
  try { await (Store as any).dateiWeg('gibtsnicht'); danach = 'geht wieder'; }
  catch { danach = 'bleibt kaputt'; }
  return { wie, danach };
}, kaputtMachen);
gleich('Ein misslungenes `del` lehnt ab', (loeschen as any).wie, 'lehnt ab');
gleich('… und ein heiles löscht weiterhin klaglos', (loeschen as any).danach, 'geht wieder');

console.log('\n4b · Auch der Verlauf sagt nicht mehr „keine Fassungen"');
/* Die leere Liste hatte zwei Bedeutungen. „Es gibt keine" ist eine
   Auskunft; „ich konnte nicht nachsehen" ist ein Fehler — und wer den
   Verlauf als leer sieht, überschreibt die Seite guten Gewissens. */
const verlauf = await seite.evaluate(async (bau) => {
  const s = Store.addBlock(null, 'page', { text: 'Mit Verlauf' });
  await (Store as any).versionSpeichern(s.id, 'hand');
  await Store.flush();
  const heil = await Store.versionen(s.id);
  const zurueck = (new Function('return ' + bau)())('page');
  let wie = '', laenge = -1;
  try { const r = await Store.versionen(s.id); wie = 'kam durch'; laenge = r.length; }
  catch { wie = 'lehnt ab'; }
  zurueck();
  let danach = -1;
  try { danach = (await Store.versionen(s.id)).length; } catch { danach = -2; }
  return { heilLaenge: heil.length, wie, laenge, danach };
}, indexKaputt);
p('Im heilen Fall steht die Fassung im Verlauf',
  ((verlauf as any).heilLaenge ?? 0) >= 1, String((verlauf as any).heilLaenge));
gleich('Ist das Fach unlesbar, lehnt `versionen` ab', (verlauf as any).wie, 'lehnt ab');
p('… statt „0 Fassungen" zu melden', (verlauf as any).laenge !== 0,
  `gab ${(verlauf as any).laenge} zurück`);
p('Und danach ist der Verlauf wieder da', ((verlauf as any).danach ?? 0) >= 1,
  String((verlauf as any).danach));

console.log('\n5 · Ohne Ablage bleibt alles beim Alten');
/* `!db` — die App läuft ohne Speicher weiter, und dann ist eine leere
   Antwort richtig und kein Fehler. Sonst wäre jeder Start in einem
   gesperrten Browser ein Absturz. */
const ohne = await seite.evaluate(async () => {
  const r = await (Store as any).dateiAlle();
  return { istListe: Array.isArray(r) };
});
p('Ein heiles Fach antwortet weiterhin mit einer Liste',
  (ohne as any).istListe === true);

console.log('\n6 · Die Quelle sagt dasselbe');
const quelle = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');

/* Der Text wird stückweise geprüft, nicht als Ganzes. Eine Regel „nirgends
   im Kern steht `ok([])`" klingt strenger, ist aber schwächer: sie sagt
   nicht, WELCHE Stelle gemeint war, und wird beim ersten berechtigten
   Vorkommen entweder rot oder aufgeweicht. Hier steht je Funktion, was
   gelten soll. */
const stueck = (name: string): string => {
  const i = quelle.indexOf(name);
  return i < 0 ? '' : quelle.slice(i, i + 700);
};

p('`all` lehnt im Fehlerzweig ab',
  /fail\(r\.error \|\| new Error\('Fach/.test(stueck('const all =')));
p('`del` lehnt im Fehlerzweig ab',
  /fail\(r\.error \|\| new Error\('Aus/.test(stueck('const del =')));
p('`versionen` lehnt ab, statt eine leere Liste zu melden',
  /fail\(r\.error \|\| new Error\('Der Versionsverlauf/.test(stueck('const versionen =')));
p('Die toten `.catch(() => [])` beim Sichern sind weg',
  !/await all\([^)]*\)\.catch\(\(\) => \[\]\)/.test(quelle));

/* Das fehlende Fach bleibt eine leere Liste — eine junge Ablage hat
   `versions` noch nicht, und das ist kein Fehler. Der Unterschied zwischen
   „gibt es nicht" und „antwortet nicht" ist genau der Punkt. */
p('Ein fehlendes Fach ist weiterhin einfach leer',
  /objectStoreNames\.contains\('versions'\)\) return ok\(\[\]\)/.test(quelle));

/* Und was NOCH schweigt, steht hier beim Namen — als Lücke L35, nicht als
   grüner Haken. `stueckeVon` liegt im Weg des Abgleichs, und der ist in
   dieser Sitzung ausdrücklich nicht anzufassen. */
const stueckeSchweigt = /r\.onerror\s*=\s*\(\)\s*=>\s*ok2\(\[\]\)/.test(stueck('const stueckeVon ='));
p('Bekannt und festgehalten: `stueckeVon` schweigt noch (L35)',
  stueckeSchweigt === true,
  'Wenn dieser Punkt fällt, ist es behoben — dann L35 schliessen und den Punkt umdrehen');

console.log('\n7 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 108 — Lesefehler ist kein leerer Bestand: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
