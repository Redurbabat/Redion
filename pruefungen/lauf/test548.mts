/* Suite 548 — Die KI bearbeitet Text, und das Alte bleibt holbar
 * ============================================================================
 * Redurs „usw." nach den drei Werkzeugen aus E655: Text auf einer Seite
 * ändern — umschreiben, kürzen, übersetzen. Bisher ging das nur über das
 * Chatfenster; als Agentenwerkzeug fehlte es.
 *
 * DAS IST DAS ERSTE WERKZEUG, DAS BESTEHENDEN TEXT ANFASST. Anlegen kostet
 * nichts: was neu ist, war vorher nicht da. Ändern kostet den alten Stand —
 * und §51 sagt, was davon wichtiger ist.
 *
 * DIE ZWEI GEFAHREN, jede mit einem eigenen Abschnitt hier:
 *
 * 1 · DER ALTE TEXT IST WEG. `Store.updateBlock` sichert keine Fassung.
 *     Die automatische Sicherung (`versionAutomatisch`) hat eine
 *     Vier-Minuten-Sperre UND einen Schalter (`autoVersionen`, E417) — wer
 *     ihn ausmacht, hätte nach einer KI-Änderung gar nichts mehr. Deshalb
 *     sichert das Werkzeug SELBST, vor dem Schreiben, mit dem Anlass
 *     „vor KI-Änderung" — wie „vor Wiederherstellung" und „vor
 *     Quelltext-Änderung" es schon tun. Ein Schalter darf keinen Schutz
 *     abschalten, um den gebeten wurde (der Satz steht wörtlich in
 *     `werkzeuge.ts:924`).
 *
 * 2 · DIE FALSCHE STELLE. Genau das war E650, vor zwei Bögen: `String.replace`
 *     trifft das ERSTE Vorkommen, nicht das gemeinte. Ein Modell, das „ändere
 *     ‚das Kabel' in ‚die Leitung'" sagt, weiss nicht, dass „das Kabel"
 *     dreimal dasteht. Deshalb: kommt die Stelle nicht GENAU EINMAL vor, wird
 *     gar nichts geändert und die Zahl genannt. Eine Absage ist billig, eine
 *     falsch ersetzte Stelle merkt niemand.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Das Werkzeug gibt es, als Schreibwerkzeug (also unter dem Tor aus E295).
 *   2  Eine eindeutige Stelle wird ersetzt — und nur sie.
 *   3  VOR der Änderung steht eine Fassung, und darin steht der ALTE Text.
 *   4  Auch dann, wenn `autoVersionen` ausgeschaltet ist.
 *   5  Zweimal im selben Block  → nichts geändert, Zahl genannt.
 *   6  In zwei Blöcken          → nichts geändert, Zahl genannt.
 *   7  Gar nicht gefunden       → nichts geändert.
 *   8  Der geänderte Block trägt danach `herkunft: "ki"` (E307).
 *   9  Ein Nein am Tor lässt den Text stehen.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser.
 *
 *   node pruefungen/lauf/test548.mts
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
  'typeof App !== "undefined" && typeof Agent !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);
await seite.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

console.log('\n' + '─'.repeat(60));
console.log('Suite 548 — Die KI bearbeitet Text, und das Alte bleibt holbar');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Gibt es das Werkzeug?');

const katalog = await seite.evaluate(
  '(() => { const w = (Agent.WERKZEUGE || {}).textBearbeiten;\n'
+ '  return { da: !!w, recht: w ? w.recht : null,\n'
+ '           anzahl: Object.keys(Agent.WERKZEUGE || {}).length }; })()') as any;

console.log('    Werkzeuge: ' + katalog.anzahl + ' · textBearbeiten: ' + JSON.stringify(katalog));
p('textBearbeiten gibt es, und es ist ein Schreibwerkzeug',
  katalog.da && katalog.recht === 'bearbeiten', JSON.stringify(katalog));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Eine eindeutige Stelle — ersetzt, und die Fassung steht');

const gut = await seite.evaluate(
  '(async () => {\n'
+ '  const w = (Agent.WERKZEUGE || {}).textBearbeiten;\n'
+ '  if (!w) return { fehler: "Werkzeug fehlt" };\n'
+ '  /* Der Schalter ist AUS — die Fassung muss trotzdem kommen. */\n'
+ '  Store.setMeta("autoVersionen", false);\n'
+ '  const s = Store.addPage(null, { text: "Installationshinweise" });\n'
+ '  const b = Store.addBlock(s.id, "text",\n'
+ '    { text: "Der Leiter wird an die Klemme gefuehrt und dort gesichert." });\n'
+ '  Store.addBlock(s.id, "text", { text: "Danach wird gemessen." });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 200));\n'
+ '  const vorherFassungen = (await Store.versionen(s.id)).length;\n'
+ '  const antwort = String(await w.lauf({ titel: "Installationshinweise",\n'
+ '    alt: "an die Klemme gefuehrt", neu: "auf die Reihenklemme aufgelegt" },\n'
+ '    { ids: [] }));\n'
+ '  const nachherFassungen = await Store.versionen(s.id);\n'
+ '  const neueste = nachherFassungen.sort((x, y) =>\n'
+ '    String(y.zeit).localeCompare(String(x.zeit)))[0];\n'
+ '  const inhalt = neueste ? JSON.stringify(neueste.daten) : "";\n'
+ '  const jetzt = Store.getBlock(b.id);\n'
+ '  return { antwort: antwort.slice(0, 160),\n'
+ '           text: jetzt.text, herkunft: jetzt.herkunft,\n'
+ '           fassungenVor: vorherFassungen, fassungenNach: nachherFassungen.length,\n'
+ '           anlass: neueste ? neueste.anlass : "KEINE FASSUNG",\n'
+ '           altDrin: inhalt.indexOf("an die Klemme gefuehrt") >= 0,\n'
+ '           nachbar: Store.childrenOf(s.id).filter(x => x.alive)[1].text };\n'
+ '})()') as any;

console.log('    Antwort: ' + gut.antwort);
console.log('    Danach:  "' + gut.text + '"');
console.log('    Fassungen: ' + gut.fassungenVor + ' → ' + gut.fassungenNach
  + ' · Anlass: "' + gut.anlass + '" · alter Text darin: ' + gut.altDrin);

p('Die Stelle ist ersetzt',
  String(gut.text).indexOf('auf die Reihenklemme aufgelegt') >= 0,
  gut.fehler || gut.text);
p('Und der Rest des Satzes steht noch',
  String(gut.text).indexOf('Der Leiter wird') === 0 &&
  String(gut.text).indexOf('dort gesichert') > 0, gut.text);
p('Der Nachbarblock ist unberührt',
  gut.nachbar === 'Danach wird gemessen.', String(gut.nachbar));
p('Vor der Änderung wurde eine Fassung gesichert',
  Number(gut.fassungenNach) > Number(gut.fassungenVor),
  gut.fassungenVor + ' → ' + gut.fassungenNach);
p('Die Fassung heisst „vor KI-Änderung"',
  String(gut.anlass).toLowerCase().indexOf('ki') >= 0, '"' + gut.anlass + '"');
p('Und der ALTE Text steht wirklich darin', gut.altDrin === true,
  'die Fassung ist da, aber ohne den alten Wortlaut — dann ist sie wertlos');
p('Auch mit ausgeschaltetem `autoVersionen` (E417)',
  Number(gut.fassungenNach) > Number(gut.fassungenVor),
  'ein Schalter darf keinen Schutz abschalten, um den gebeten wurde');
p('Der Block trägt danach die Herkunft „ki" (E307)', gut.herkunft === 'ki',
  String(gut.herkunft));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Mehrdeutig heisst: nichts anfassen (die Lehre aus E650)');

const mehrdeutig = await seite.evaluate(
  '(async () => {\n'
+ '  const w = (Agent.WERKZEUGE || {}).textBearbeiten;\n'
+ '  if (!w) return { fehler: "Werkzeug fehlt" };\n'
+ '  const s = Store.addPage(null, { text: "Mehrdeutig" });\n'
+ '  const b1 = Store.addBlock(s.id, "text", { text: "Das Kabel liegt. Das Kabel bleibt." });\n'
+ '  const b2 = Store.addBlock(s.id, "text", { text: "Ein Hinweis ohne Wiederholung." });\n'
+ '  const b3 = Store.addBlock(s.id, "text", { text: "Ein Hinweis ohne Wiederholung." });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 180));\n'
+ '  const zweimalImBlock = String(await w.lauf(\n'
+ '    { titel: "Mehrdeutig", alt: "Das Kabel", neu: "Die Leitung" }, { ids: [] }));\n'
+ '  const inZweiBloecken = String(await w.lauf(\n'
+ '    { titel: "Mehrdeutig", alt: "Ein Hinweis ohne Wiederholung.", neu: "Kurz." },\n'
+ '    { ids: [] }));\n'
+ '  const garnicht = String(await w.lauf(\n'
+ '    { titel: "Mehrdeutig", alt: "steht nirgends", neu: "egal" }, { ids: [] }));\n'
+ '  return { zweimalImBlock: zweimalImBlock.slice(0, 160),\n'
+ '           inZweiBloecken: inZweiBloecken.slice(0, 160),\n'
+ '           garnicht: garnicht.slice(0, 160),\n'
+ '           t1: Store.getBlock(b1.id).text, t2: Store.getBlock(b2.id).text,\n'
+ '           t3: Store.getBlock(b3.id).text };\n'
+ '})()') as any;

console.log('    zweimal im Block:  ' + mehrdeutig.zweimalImBlock);
console.log('    in zwei Blöcken:   ' + mehrdeutig.inZweiBloecken);
console.log('    gar nicht da:      ' + mehrdeutig.garnicht);

p('Zweimal im selben Block → nichts geändert',
  mehrdeutig.t1 === 'Das Kabel liegt. Das Kabel bleibt.',
  mehrdeutig.fehler || mehrdeutig.t1);
p('… und die Absage nennt die Zahl',
  /2|zwei/i.test(String(mehrdeutig.zweimalImBlock)), mehrdeutig.zweimalImBlock);
p('In zwei Blöcken → nichts geändert',
  mehrdeutig.t2 === 'Ein Hinweis ohne Wiederholung.' &&
  mehrdeutig.t3 === 'Ein Hinweis ohne Wiederholung.',
  mehrdeutig.t2 + ' | ' + mehrdeutig.t3);
p('… und auch das sagt die Absage',
  /2|zwei/i.test(String(mehrdeutig.inZweiBloecken)), mehrdeutig.inZweiBloecken);
p('Gar nicht gefunden → Absage statt Raten',
  String(mehrdeutig.garnicht).toLowerCase().indexOf('nicht') >= 0,
  mehrdeutig.garnicht);

/* ---------------------------------------------------------------------- */
console.log('\n4 · Ein Nein am Tor lässt den Text stehen');

const tor = await seite.evaluate(
  'window.__wahlen = [];\n'
+ 'if (!window.__altWahl) window.__altWahl = Dialog.wahl;\n'
+ 'Dialog.wahl = function (o) { window.__wahlen.push(o.titel); return Promise.resolve("nein"); };\n'
+ 'if (!window.__altFrage) window.__altFrage = KI.frageKurz;\n'
+ 'window.__plan = [];\n'
+ 'KI.frageKurz = function () {\n'
+ '  var s = window.__plan.shift();\n'
+ '  return Promise.resolve(JSON.stringify(s || { gedanke: "fertig", werkzeug: "fertig",\n'
+ '                                               argument: { antwort: "Fertig." } }));\n'
+ '};\n'
+ '(async () => {\n'
+ '  Store.setMeta("agent:fragen", "immer");\n'
+ '  const s = Store.addPage(null, { text: "Nicht anfassen" });\n'
+ '  const b = Store.addBlock(s.id, "text", { text: "Dieser Satz bleibt genau so." });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 180));\n'
+ '  Store.setMeta("agent:eigene", [{ id: "pruef-text", name: "Redakteur", guthaben: 3,\n'
+ '    werkzeuge: ["textBearbeiten", "fertig"], anweisung: "", wissen: [], ausloeser: {} }]);\n'
+ '  window.__plan = [{ gedanke: "umschreiben", werkzeug: "textBearbeiten",\n'
+ '    argument: { titel: "Nicht anfassen", alt: "bleibt genau so", neu: "wird geaendert" } }];\n'
+ '  await Agent.laufen("pruef-text", "Schreib den Satz um");\n'
+ '  return { gefragt: window.__wahlen.length, text: Store.getBlock(b.id).text };\n'
+ '})()') as any;

console.log('    Dialoge: ' + tor.gefragt + ' · Text danach: "' + tor.text + '"');
p('Vor dem Ändern wird gefragt (Tor aus E295)', Number(tor.gefragt) > 0,
  tor.gefragt + ' Dialoge');
p('Nach einem Nein steht der Satz unverändert',
  tor.text === 'Dieser Satz bleibt genau so.', String(tor.text));

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
