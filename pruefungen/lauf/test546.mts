/* Suite 546 — Die KI darf löschen, aber nie ohne ein ausdrückliches Ja
 * ============================================================================
 * REDUR, 20. September 2026:
 *
 *   „die ai teil darf mehr machen z.B lernkarten erstellen pdf elssen,
 *    tabelas usw alles machen kann ausser ohne meine bestetigung etwas
 *    löschen"
 *
 * Zwei Sätze in einem. Der zweite ist der harte, und er ist auch der, der
 * den ersten erst erlaubt: eine KI, die MEHR darf, braucht genau eine
 * Grenze, die hält.
 *
 * DER STAND VORHER. Die zwölf Werkzeuge der Agenten kannten zwei Rechte —
 * `lesen` und `bearbeiten`. Löschen konnte die KI gar nicht; die Regel war
 * also erfüllt, weil es die Handlung nicht gab. Das ist keine Sicherheit,
 * sondern eine Lücke im Können.
 *
 * Und das vorhandene Tor für `bearbeiten` (E295 ff.) ist für Löschen zu
 * weich — an drei Stellen, jede einzeln gemessen:
 *
 *   `fragenModus()` kennt „nie"          → gar keine Frage
 *   „Für diesen Lauf erlauben"           → ein Ja gilt für alle weiteren
 *   `darfAllein` + unbeaufsichtigt       → Schreiben ohne Zuschauer
 *
 * Für „ohne meine Bestätigung" gilt keines davon. Jeder einzelne Schritt
 * fragt, jedes Mal, oder er geschieht nicht.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Es GIBT ein Löschwerkzeug — sonst ist die Regel nur Abwesenheit.
 *   2  Ein „Nein" lässt die Seite leben.
 *   3  Ein „Ja" legt sie in den Papierkorb, LÖSCHT sie aber nicht:
 *      `alive === false`, der Block ist noch da, `Store.getBlock` findet ihn.
 *   4  `fragenModus('nie')` hebt das Tor NICHT auf.
 *   5  Es gibt keinen Knopf „für diesen Lauf" — zwei Wege, nicht drei.
 *   6  Zweimal löschen heisst zweimal fragen.
 *   7  Unbeaufsichtigt wird ohne Dialog gar nicht gelöscht — auch mit
 *      `darfAllein`.
 *   8  Kein anderes Werkzeug trägt heimlich das Recht `loeschen`.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser.
 *
 *   node pruefungen/lauf/test546.mts
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
  'typeof App !== "undefined" && typeof Agent !== "undefined" && typeof KI !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);

console.log('\n' + '─'.repeat(60));
console.log('Suite 546 — Die KI löscht nichts ohne ein ausdrückliches Ja');
console.log('─'.repeat(60));

/* Der Laufstand: eine Schablone, die einen Agentenlauf steuert.
   `KI.frageKurz` wird abgehängt und gibt die Schritte zurück, die der Lauf
   gehen soll — so hängt die Messung an keinem Modell. */
const LAUFSTAND =
  'window.__wahlen = [];\n'
+ 'window.__antwort = "nein";\n'
+ 'if (!window.__altWahl) window.__altWahl = Dialog.wahl;\n'
+ 'Dialog.wahl = function (o) {\n'
+ '  window.__wahlen.push({ titel: o.titel, text: o.text,\n'
+ '                         knoepfe: (o.knoepfe || []).map(function (k) { return k.id; }) });\n'
+ '  return Promise.resolve(window.__antwort);\n'
+ '};\n'
+ 'if (!window.__altFrage) window.__altFrage = KI.frageKurz;\n'
+ 'window.__plan = [];\n'
+ 'KI.frageKurz = function () {\n'
+ '  var s = window.__plan.shift();\n'
+ '  return Promise.resolve(JSON.stringify(s || { gedanke: "fertig", werkzeug: "fertig",\n'
+ '                                               argument: { antwort: "Fertig." } }));\n'
+ '};\n';

/* ---------------------------------------------------------------------- */
console.log('\n1 · Gibt es das Löschwerkzeug überhaupt?');

const katalog = await seite.evaluate(
  '(() => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  const loeschend = Object.keys(w).filter(n => w[n] && w[n].recht === "loeschen");\n'
+ '  return { alle: Object.keys(w).length, loeschend: loeschend,\n'
+ '           rechte: Array.from(new Set(Object.keys(w).map(n => w[n].recht))) };\n'
+ '})()') as any;

console.log('    Werkzeuge: ' + katalog.alle + ' · Rechte: ' + JSON.stringify(katalog.rechte));
console.log('    mit Recht "loeschen": ' + JSON.stringify(katalog.loeschend));

p('Die KI kann überhaupt löschen (Redurs erster Satz)',
  katalog.loeschend.length > 0,
  'kein Werkzeug mit Recht "loeschen" — die Regel wäre nur Abwesenheit');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Ein Nein lässt die Seite leben');

const nein = await seite.evaluate(LAUFSTAND
+ '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Weg damit" });\n'
+ '  Store.addBlock(s.id, "text", { text: "Etwas Inhalt" });\n'
+ '  const agent = { id: "pruef-loesch", name: "Prüfer", guthaben: 4,\n'
+ '    werkzeuge: ["seiteLoeschen", "fertig"], anweisung: "", wissen: [], ausloeser: {} };\n'
+ '  Store.setMeta("agent:eigene", [agent]);\n'
+ '  window.__plan = [{ gedanke: "loeschen", werkzeug: "seiteLoeschen",\n'
+ '                     argument: { titel: "Weg damit" } }];\n'
+ '  window.__antwort = "nein";\n'
+ '  const prot = await Agent.laufen("pruef-loesch", "Lösch die Seite");\n'
+ '  const b = Store.getBlock(s.id);\n'
+ '  return { lebt: !!b && b.alive !== false, gefragt: window.__wahlen.length,\n'
+ '           schritte: (prot && prot.schritte || []).map(x => x.ergebnis || "").join(" | ").slice(0, 300),\n'
+ '           id: s.id };\n'
+ '})()') as any;

console.log('    Dialoge: ' + nein.gefragt + ' · Seite lebt: ' + nein.lebt);
console.log('    Ergebnis: ' + nein.schritte);

p('Vor dem Löschen wird überhaupt gefragt', Number(nein.gefragt) > 0,
  'kein Dialog — die KI hätte ungefragt gelöscht');
p('Nach einem Nein lebt die Seite weiter', nein.lebt === true,
  'die Seite ist weg, obwohl abgelehnt wurde');

/* ---------------------------------------------------------------------- */
console.log('\n3 · Ein Ja legt sie in den Papierkorb — und löscht sie nicht');

const ja = await seite.evaluate(LAUFSTAND
+ '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Papierkorb bitte" });\n'
+ '  window.__plan = [{ gedanke: "loeschen", werkzeug: "seiteLoeschen",\n'
+ '                     argument: { titel: "Papierkorb bitte" } }];\n'
+ '  window.__antwort = "ja";\n'
+ '  await Agent.laufen("pruef-loesch", "Lösch die Seite");\n'
+ '  const b = Store.getBlock(s.id);\n'
+ '  return { daNoch: !!b, alive: b ? b.alive : null,\n'
+ '           knoepfe: (window.__wahlen[0] || {}).knoepfe || [],\n'
+ '           titel: (window.__wahlen[0] || {}).titel || "",\n'
+ '           text: ((window.__wahlen[0] || {}).text || "").slice(0, 200) };\n'
+ '})()') as any;

console.log('    Knöpfe im Dialog: ' + JSON.stringify(ja.knoepfe));
console.log('    Block danach: da=' + ja.daNoch + ' alive=' + ja.alive);

p('Nach einem Ja ist die Seite im Papierkorb, nicht weg',
  ja.daNoch === true && ja.alive === false,
  'da=' + ja.daNoch + ' alive=' + ja.alive + ' — §43: nichts endgültig löschen');
p('Der Dialog nennt die Seite beim Namen',
  String(ja.text).includes('Papierkorb bitte'),
  'Text: ' + ja.text);
p('Es gibt KEIN „für diesen Lauf erlauben" beim Löschen',
  Array.isArray(ja.knoepfe) && ja.knoepfe.length === 2 && !ja.knoepfe.includes('lauf'),
  JSON.stringify(ja.knoepfe));

/* ---------------------------------------------------------------------- */
console.log('\n4 · „Nie fragen" hebt das Tor nicht auf');

const nieFragen = await seite.evaluate(LAUFSTAND
+ '(async () => {\n'
+ '  Store.setMeta("agent:fragen", "nie");\n'
+ '  const s = Store.addPage(null, { text: "Trotzdem fragen" });\n'
+ '  window.__plan = [{ gedanke: "loeschen", werkzeug: "seiteLoeschen",\n'
+ '                     argument: { titel: "Trotzdem fragen" } }];\n'
+ '  window.__antwort = "nein";\n'
+ '  await Agent.laufen("pruef-loesch", "Lösch die Seite");\n'
+ '  const b = Store.getBlock(s.id);\n'
+ '  Store.setMeta("agent:fragen", "immer");\n'
+ '  return { gefragt: window.__wahlen.length, lebt: !!b && b.alive !== false,\n'
+ '           modus: Agent.fragenModus() };\n'
+ '})()') as any;

console.log('    fragenModus war "nie" · Dialoge: ' + nieFragen.gefragt
  + ' · Seite lebt: ' + nieFragen.lebt);

p('Auch bei „nie fragen" wird vor dem Löschen gefragt',
  Number(nieFragen.gefragt) > 0,
  'eine Einstellung hat Redurs Satz ausgehebelt');
p('Und die abgelehnte Seite lebt', nieFragen.lebt === true);

/* ---------------------------------------------------------------------- */
console.log('\n5 · Zweimal löschen heisst zweimal fragen');

const zweimal = await seite.evaluate(LAUFSTAND
+ '(async () => {\n'
+ '  const a1 = Store.addPage(null, { text: "Erste weg" });\n'
+ '  const a2 = Store.addPage(null, { text: "Zweite weg" });\n'
+ '  window.__plan = [\n'
+ '    { gedanke: "eins", werkzeug: "seiteLoeschen", argument: { titel: "Erste weg" } },\n'
+ '    { gedanke: "zwei", werkzeug: "seiteLoeschen", argument: { titel: "Zweite weg" } }];\n'
+ '  window.__antwort = "ja";\n'
+ '  await Agent.laufen("pruef-loesch", "Lösch beide");\n'
+ '  return { gefragt: window.__wahlen.length,\n'
+ '           eins: (Store.getBlock(a1.id) || {}).alive,\n'
+ '           zwei: (Store.getBlock(a2.id) || {}).alive };\n'
+ '})()') as any;

console.log('    Dialoge bei zwei Löschungen: ' + zweimal.gefragt);

p('Jede Löschung fragt einzeln', Number(zweimal.gefragt) === 2,
  zweimal.gefragt + ' Dialoge für 2 Löschungen');

/* ---------------------------------------------------------------------- */
console.log('\n6 · Ohne Zuschauer wird gar nicht gelöscht');

const allein = await seite.evaluate(LAUFSTAND
+ '(async () => {\n'
+ '  const s = Store.addPage(null, { text: "Nachts allein" });\n'
+ '  const agent = { id: "pruef-allein", name: "Nachtschicht", guthaben: 4,\n'
+ '    werkzeuge: ["seiteLoeschen", "fertig"], anweisung: "", wissen: [],\n'
+ '    darfAllein: true, ausloeser: {} };\n'
+ '  Store.setMeta("agent:eigene", [agent]);\n'
+ '  window.__plan = [{ gedanke: "loeschen", werkzeug: "seiteLoeschen",\n'
+ '                     argument: { titel: "Nachts allein" } }];\n'
+ '  window.__antwort = "ja";\n'
+ '  const prot = await Agent.laufen("pruef-allein", "Lösch die Seite",\n'
+ '                                  null, { unbeaufsichtigt: true });\n'
+ '  const b = Store.getBlock(s.id);\n'
+ '  return { lebt: !!b && b.alive !== false, gefragt: window.__wahlen.length,\n'
+ '           ergebnis: (prot && prot.schritte || []).map(x => x.ergebnis || "")\n'
+ '                       .join(" | ").slice(0, 300) };\n'
+ '})()') as any;

console.log('    Dialoge: ' + allein.gefragt + ' · Seite lebt: ' + allein.lebt);
console.log('    Ergebnis: ' + allein.ergebnis);

p('Unbeaufsichtigt wird nichts gelöscht — auch mit darfAllein',
  allein.lebt === true, 'die Seite ist weg, und niemand hat zugesehen');
p('Und es wird dabei niemand gefragt, der nicht da ist',
  Number(allein.gefragt) === 0,
  allein.gefragt + ' Dialoge in einem unbeaufsichtigten Lauf');

/* ---------------------------------------------------------------------- */
console.log('\n7 · Kein anderes Werkzeug löscht heimlich');

const heimlich = await seite.evaluate(
  '(() => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  const verdaechtig = Object.keys(w).filter(n => {\n'
+ '    if (w[n].recht === "loeschen") return false;\n'
+ '    const q = String(w[n].lauf || "");\n'
+ '    return /alive\\s*:\\s*false|deleteBlock|removeBlock|loeschen\\(/.test(q);\n'
+ '  });\n'
+ '  return verdaechtig;\n'
+ '})()') as string[];

console.log('    verdächtig: ' + JSON.stringify(heimlich));
p('Kein Werkzeug ausserhalb der Löschklasse fasst `alive` an',
  heimlich.length === 0, JSON.stringify(heimlich));

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
