/* Suite 543 — Der Verbindungsschalter einer Datenbank gilt wirklich
 * ============================================================================
 * DER FUND (Bestandsaufnahme, 20. September). Das Datenbankmenü hat einen
 * Punkt „Verbindungen dieser Datenbank" mit einem Fusstext, der etwas
 * Sicherheitsrelevantes zusagt:
 *
 *     „Verknüpfte Dienste dürfen Zeilen dieser Datenbank lesen und
 *      schreiben — etwa der GitHub-Spiegel."
 *
 * Gemessen: `coll.verbindungen` wird an genau zwei Stellen ANGEFASST — vom
 * Menü, das es schreibt, und von der Zeile darüber, die die Anzahl anzeigt.
 * GELESEN als Erlaubnis wird es nirgends. Der Spiegel hängt an `gespiegelt`
 * und `spiegelQuelle` und fragt den Schalter nie.
 *
 * Zwei Fehler auf einmal, und der zweite ist der schlimmere:
 *
 *   1  Die Zusage im Fusstext stimmt nicht. Ein Schalter auf „aus" sperrt
 *      nichts.
 *   2  Die ANZEIGE stimmt nicht. `drin.includes(id)` ist bei einer nie
 *      angefassten Datenbank für jeden Dienst falsch — das Menü zeigt
 *      „GitHub · aus", WÄHREND der GitHub-Spiegel läuft. Wer das liest,
 *      glaubt, er sei geschützt.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Bestandsschutz: eine Datenbank ohne das Feld bleibt erlaubt.
 *      Ein Schalter, der bei der Einführung alle laufenden Spiegel abwürgt,
 *      wäre schlimmer als der Fehler (§46, §51).
 *   2  Eine ausdrücklich leere Liste sperrt — und zwar wirklich: es geht
 *      kein Netzruf hinaus.
 *   3  Steht der Dienst in der Liste, geht es durch.
 *   4  Die Anzeige folgt derselben Frage wie die Sperre. Kein zweiter Weg,
 *      der auseinanderlaufen kann (§8).
 *   5  GEGENPROBE: der Lauf kann rot werden, und war es.
 *
 * KEIN NETZ. Der Lauf hängt `fetch` und `Verbindungen.githubRuf` ab und
 * zählt nur, ob jemand hinauswollte.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser. Ein
 * `as HTMLElement` darin ist ein Syntaxfehler, und ein Akzentzeichen in einem
 * Kommentar INNERHALB einer Schablone beendet sie mitten im Satz.
 *
 *   node pruefungen/lauf/test543.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Store !== "undefined" && typeof Spiegel !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(400);

console.log('\n' + '─'.repeat(60));
console.log('Suite 543 — Der Verbindungsschalter gilt wirklich');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Bestandsschutz: ohne Feld bleibt erlaubt');

const bestand = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543" });\n'
+ '  const d = Store.addDatabase(s.id, "Alter Spiegel", {}, "table");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { gespiegelt: true, spiegelQuelle: "github:a/b" });\n'
+ '  const frisch = Store.getCollection(c.id);\n'
+ '  return {\n'
+ '    feld: typeof frisch.verbindungen,\n'
+ '    darf: Spiegel.darf ? Spiegel.darf(frisch, "github") : "KEINE FUNKTION"\n'
+ '  };\n'
+ '})()') as any;

p('`Spiegel.darf` gibt es überhaupt', bestand.darf !== 'KEINE FUNKTION', String(bestand.darf));
p('Eine Datenbank ohne das Feld gilt als erlaubt', bestand.darf === true,
  'Feld ist ' + bestand.feld + ', darf = ' + bestand.darf);

/* ---------------------------------------------------------------------- */
console.log('\n2 · Eine ausdrückliche Liste ohne den Dienst sperrt');

const gesperrt = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543 b" });\n'
+ '  const d = Store.addDatabase(s.id, "Gesperrt", {}, "table");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { gespiegelt: true, spiegelQuelle: "github:a/b", verbindungen: [] });\n'
+ '  const frisch = Store.getCollection(c.id);\n'
+ '  const darf = Spiegel.darf ? Spiegel.darf(frisch, "github") : "KEINE FUNKTION";\n'
+ '\n'
+ '  /* Kein Netz. Wir zaehlen nur, ob jemand hinauswollte. */\n'
+ '  let rufe = 0;\n'
+ '  const altFetch = window.fetch;\n'
+ '  const altRuf = Verbindungen.githubRuf;\n'
+ '  window.fetch = function () { rufe++; return Promise.reject(new Error("kein Netz im Lauf")); };\n'
+ '  Verbindungen.githubRuf = function () { rufe++; return Promise.reject(new Error("kein Netz im Lauf")); };\n'
+ '\n'
+ '  const zeile = Store.addBlock(c.id, "text", { text: "Ein Eintrag" });\n'
+ '  Store.updateBlock(zeile.id, { props: { repo: "a/b", nr: 7, status: "Offen" } });\n'
+ '  let geworfen = "";\n'
+ '  try { await Spiegel.githubZurueck(Store.getBlock(zeile.id), frisch); }\n'
+ '  catch (e) { geworfen = String(e && e.message || e); }\n'
+ '\n'
+ '  window.fetch = altFetch;\n'
+ '  Verbindungen.githubRuf = altRuf;\n'
+ '  return { darf: darf, rufe: rufe, geworfen: geworfen };\n'
+ '})()') as any;

p('Eine leere Liste sperrt den Dienst', gesperrt.darf === false, String(gesperrt.darf));
p('Und es geht KEIN Ruf hinaus', gesperrt.rufe === 0, gesperrt.rufe + ' Rufe');
p('Der Nutzer bekommt einen Grund, keine stille Rückkehr',
  /verbindung|gesperrt|erlaub/i.test(String(gesperrt.geworfen)), gesperrt.geworfen || '(nichts geworfen)');

/* ---------------------------------------------------------------------- */
console.log('\n3 · Steht der Dienst in der Liste, geht es durch');

const erlaubt = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543 c" });\n'
+ '  const d = Store.addDatabase(s.id, "Erlaubt", {}, "table");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { gespiegelt: true, spiegelQuelle: "github:a/b", verbindungen: ["github"] });\n'
+ '  const frisch = Store.getCollection(c.id);\n'
+ '  const darf = Spiegel.darf ? Spiegel.darf(frisch, "github") : "KEINE FUNKTION";\n'
+ '  let rufe = 0;\n'
+ '  const altRuf = Verbindungen.githubRuf;\n'
+ '  Verbindungen.githubRuf = function () { rufe++; return Promise.resolve({}); };\n'
+ '  const zeile = Store.addBlock(c.id, "text", { text: "Ein Eintrag" });\n'
+ '  Store.updateBlock(zeile.id, { props: { repo: "a/b", nr: 7, status: "Offen" } });\n'
+ '  try { await Spiegel.githubZurueck(Store.getBlock(zeile.id), frisch); } catch (e) {}\n'
+ '  Verbindungen.githubRuf = altRuf;\n'
+ '  return { darf: darf, rufe: rufe };\n'
+ '})()') as any;

p('Der eingetragene Dienst ist erlaubt', erlaubt.darf === true, String(erlaubt.darf));
p('… und der Ruf geht wirklich hinaus', erlaubt.rufe === 1, erlaubt.rufe + ' Rufe');

/* ---------------------------------------------------------------------- */
console.log('\n4 · Die Anzeige folgt derselben Frage wie die Sperre');

const anzeige = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543 d" });\n'
+ '  const d = Store.addDatabase(s.id, "Anzeige", {}, "table");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { gespiegelt: true, spiegelQuelle: "github:a/b" });\n'
+ '  const frisch = Store.getCollection(c.id);\n'
+ '  /* Dasselbe, was das Menue zeigen muss. */\n'
+ '  return { darf: Spiegel.darf ? Spiegel.darf(frisch, "github") : "KEINE FUNKTION" };\n'
+ '})()') as any;

p('Ein laufender Spiegel wird nicht als „aus" angezeigt', anzeige.darf === true,
  'darf = ' + anzeige.darf);

/* ---------------------------------------------------------------------- */
console.log('\n5 · Die Gegenprobe zur Messung selbst');

const gegen = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543 e" });\n'
+ '  const d = Store.addDatabase(s.id, "Gegenprobe", {}, "table");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { verbindungen: ["jira"] });\n'
+ '  const frisch = Store.getCollection(c.id);\n'
+ '  if (!Spiegel.darf) return { github: "KEINE FUNKTION", jira: "KEINE FUNKTION" };\n'
+ '  return { github: Spiegel.darf(frisch, "github"), jira: Spiegel.darf(frisch, "jira") };\n'
+ '})()') as any;

p('Eine Liste mit „jira" erlaubt jira', gegen.jira === true, String(gegen.jira));
p('… und sperrt github', gegen.github === false, String(gegen.github));

/* ---------------------------------------------------------------------- */
console.log('\n6 · Auch das LESEN ist gesperrt, nicht nur das Schreiben');

/* Der Fusstext sagt „lesen und schreiben". Waere nur das Zurueckschreiben
   gesperrt, bliebe das Versprechen halbwahr — und der Ruf ginge trotzdem
   hinaus, also auch das Token. */
const lesen = await seite.evaluate(
  '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Probe 543 f" });\n'
+ '  const d = Store.addDatabase(s.id, "GitHub · a/b", {}, "board");\n'
+ '  const c = Store.getCollection(d.collectionId);\n'
+ '  Store.updateCollection(c.id, { gespiegelt: true, spiegelQuelle: "github:a/b", verbindungen: [] });\n'
+ '  let rufe = 0;\n'
+ '  const altFetch = window.fetch;\n'
+ '  const altRuf = Verbindungen.githubRuf;\n'
+ '  window.fetch = function () { rufe++; return Promise.reject(new Error("kein Netz im Lauf")); };\n'
+ '  Verbindungen.githubRuf = function () { rufe++; return Promise.reject(new Error("kein Netz im Lauf")); };\n'
+ '  let geworfen = "";\n'
+ '  try { await Spiegel.githubAbgleich("a/b"); } catch (e) { geworfen = String(e && e.message || e); }\n'
+ '  window.fetch = altFetch;\n'
+ '  Verbindungen.githubRuf = altRuf;\n'
+ '  return { rufe: rufe, geworfen: geworfen };\n'
+ '})()') as any;

p('Beim Holen geht kein Ruf hinaus, wenn gesperrt', lesen.rufe === 0, lesen.rufe + ' Rufe');
p('… und der Grund steht in der Meldung',
  /verbindung|ausgeschaltet/i.test(String(lesen.geworfen)), lesen.geworfen || '(nichts geworfen)');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
