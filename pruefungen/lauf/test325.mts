/* Suite 325 — Ein Fach, das niemand erklärt hat (L102 Punkt 5, E332)
 * ============================================================================
 * L102 Punkt 5: „`exportAll`/`importAll` tragen drei hartkodierte
 * Fachlisten, während `wipe()` seit dem Anhang-Vorfall die Ablage selbst
 * fragt (`[...db.objectStoreNames]`). Ein neues Fach würde also gelöscht,
 * aber nie gesichert. Kein Prüflauf deckt das ab."
 *
 * NACHGEZÄHLT: elf Fächer, sieben gesichert, vier mit Grund nicht — heute
 * stimmt es. Die Gefahr ist das ZWÖLFTE, das jemand nächsten Monat anlegt.
 *
 * DIE ANTWORT IST KEINE DYNAMISCHE SICHERUNG. Die ginge nicht: `stuecke`
 * hält Blobs, `meta` braucht Filter, jedes Fach hat seine Form. Sondern
 * eine ERKLÄRUNG, gegen die sich die Ablage abgleicht — und was in keiner
 * Liste steht, wird GENANNT statt verschwiegen (§52.10, E111).
 *
 *   §1 DIE ELF FÄCHER sind vollständig erklärt — heute meldet nichts.
 *   §2 EIN ZWÖLFTES wird erkannt und beim Namen genannt.
 *   §3 UND DER SATZ DAZU ist einer, den ein Mensch versteht.
 *   §4 GEGENPROBE: ohne unbekanntes Fach steht davon KEIN Wort da.
 *   §5 UND DIE LISTEN SIND DIE EINE WAHRHEIT: `enthaelt` kommt aus ihnen.
 *
 *   node pruefungen/lauf/test325.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9523;

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
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Fächer von heute sind vollständig erklärt');

const heute = await pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const roh = JSON.parse(Store.exportAll(false, false));
  return {
    unbekannt: Store.faecherUnbekannt(),
    immer: Store.FAECHER_IMMER,
    mitAnhang: Store.FAECHER_MIT_ANHANG,
    nie: Object.keys(Store.FAECHER_NIE).sort(),
    gruende: Object.values(Store.FAECHER_NIE),
    enthaelt: roh.enthaelt,
    fehlt: roh.fehlt,
    hinweis: roh.hinweis
  };
});

gleich('Kein Fach ist unerklärt', heute.unbekannt, []);
/* DIE DREI LISTEN MÜSSEN ZUSAMMEN ALLE FÄCHER ABDECKEN, sonst wäre §1
   auch dann grün, wenn die Ablage gar keine Fächer meldet. */
p('Es sind wirklich elf Fächer erklärt',
  heute.immer.length + heute.mitAnhang.length + heute.nie.length === 11,
  heute.immer.length + ' + ' + heute.mitAnhang.length + ' + ' + heute.nie.length);
p('Und jedes ausgelassene hat einen Grund im Klartext',
  heute.gruende.length === heute.nie.length &&
  heute.gruende.every((g: any) => typeof g === 'string' && g.length > 15),
  JSON.stringify(heute.gruende));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein zwölftes Fach wird erkannt');

/* KEIN ECHTES FACH — und das ist kein Ausweichen, sondern die Lage.
   Ein neues Fach entsteht beim BAUEN: `Umzuege.JETZIGE` steigt, und
   `onupgradeneeded` legt es an. Ein Prüflauf könnte das zur Laufzeit nur
   nachstellen, indem er die Ablage mit höherer Fassung neu öffnet — und
   dann greift `db.onversionchange` (indexdb.ts:164), schliesst die
   Verbindung der laufenden App und setzt `db = null`. Mit Absicht: zwei
   Fassungen auf derselben Ablage sind schlimmer als ein Neuladen.

   Deshalb rechnet `faecherUnbekannt` über eine LISTE, die man ihr geben
   kann. Genau die Bauform, die dieselbe Datei bei der Fassungsregel schon
   begründet: „Reine Rechnung, ohne Ablage und ohne Oberfläche — damit ein
   Prüflauf sie mit einer erfundenen Liste füttern kann." */
const gerechnet = await pc.evaluate((alle: string[]) => ({
  heute: Store.faecherUnbekannt(alle),
  mitZwoelftem: Store.faecherUnbekannt(alle.concat('erfindung')),
  mitZweien: Store.faecherUnbekannt(alle.concat(['erfindung', 'allerlei'])),
  satzLeer: Store.satzZuUnbekannten([]),
  satzEins: Store.satzZuUnbekannten(['erfindung']),
  satzZwei: Store.satzZuUnbekannten(['allerlei', 'erfindung'])
}), heute.immer.concat(heute.mitAnhang).concat(heute.nie));

gleich('Die elf bekannten ergeben nichts', gerechnet.heute, []);
gleich('Ein zwölftes wird genannt', gerechnet.mitZwoelftem, ['erfindung']);
/* UND ZWEI AUCH, sortiert — sonst hinge die Zeile an der Reihenfolge, in
   der die Ablage ihre Fächer aufzählt. */
gleich('Zwei ebenso, in fester Reihenfolge',
  gerechnet.mitZweien, ['allerlei', 'erfindung']);

/* Und die laufende Ablage, ohne Angabe gefragt: auch dort nichts. Das ist
   der Beleg, dass der Weg im Erzeugnis wirklich benutzt wird und §1 nicht
   nur eine Rechnung über eine Liste war. */
gleich('Auch die laufende Ablage meldet nichts', heute.unbekannt, []);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Und der Satz sagt einem Menschen, was los ist');

const hin = String(gerechnet.satzEins);
p('Der Satz nennt das Fach beim Namen', /erfindung/.test(hin), hin);
p('Er sagt, dass es NICHT erfasst wird', /NICHT erfasst/.test(hin), hin);
/* DAS IST DER SATZ, DER ZÄHLT: was beim Einspielen mit „Ersetzen" passiert.
   `wipe()` leert jedes Fach der Ablage — auch dieses. */
p('Und was beim Ersetzen daraus folgt',
  /Ersetzen.{0,20}wären sie weg/.test(hin), hin);
p('Er nennt auch, wo entschieden wird', /indexdb\.ts/.test(hin), hin);
p('Und bei zweien nennt er beide',
  /allerlei/.test(gerechnet.satzZwei) && /erfindung/.test(gerechnet.satzZwei) &&
  /^ ACHTUNG: 2 /.test(gerechnet.satzZwei), gerechnet.satzZwei);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: ohne unbekanntes Fach kein Wort davon');

/* EIN HINWEIS, DER IMMER DASTEHT, WIRD NICHT GELESEN. Der Satz aus §3 darf
   im gewöhnlichen Fall gar nicht erscheinen — und §1 hat denselben Bestand
   schon gemessen. */
gleich('Ohne unbekanntes Fach ist der Satz leer', gerechnet.satzLeer, '');
p('Und im echten Manifest steht kein „ACHTUNG"',
  !/ACHTUNG/.test(String(heute.hinweis || '')),
  String(heute.hinweis || '').slice(0, 200));
p('Und `fehlt` nennt kein Fach, das es nicht gibt',
  !(heute.fehlt || []).includes('erfindung'),
  JSON.stringify(heute.fehlt));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Die Listen sind die eine Wahrheit');

/* `enthaelt` DARF NICHT NOCH EINMAL GETIPPT SEIN. Zwei Listen für dieselbe
   Sache gehen irgendwann auseinander, und dann sagt das Manifest etwas
   anderes, als die Sicherung enthält. */
gleich('`enthaelt` ist genau die Immer-Liste', heute.enthaelt, heute.immer);

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf-8');
p('`enthaelt` wird aus FAECHER_IMMER gebaut, nicht getippt',
  /enthaelt: FAECHER_IMMER/.test(quelle));
p('Und `fehlt` nimmt die Unbekannten mit',
  /\.concat\(unbekannteFaecher\)/.test(quelle));
/* Und `wipe` fragt weiterhin die Ablage — die Asymmetrie, aus der die
   Lücke entstand, bleibt ausdrücklich bestehen. */
p('`wipe` fragt weiterhin die Ablage selbst',
  /\[\.\.\.db\.objectStoreNames\]/.test(quelle));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
