/* Suite 547 — Lernkarten, PDF und Tabellen: die drei, die Redur genannt hat
 * ============================================================================
 * REDUR, 20. September 2026:
 *
 *   „die ai teil darf mehr machen z.B lernkarten erstellen pdf elssen,
 *    tabelas usw alles machen kann ausser ohne meine bestetigung etwas
 *    löschen"
 *
 * Die zweite Hälfte steht seit E654 (`test546`). Das hier ist die erste:
 * drei Werkzeuge, die alle nur ANLEGEN und LESEN — sie fallen also gar
 * nicht unter das Tor, und genau deshalb dürfen sie kommen.
 *
 * WAS VORHER FEHLTE, nachgesehen und nicht vermutet:
 *
 *   Lernkarten   Es gab einen Schnellbefehl „Mache aus dieser Seite
 *                Karteikarten" — der schreibt TEXT ins Chatfenster.
 *                `flashcard`-Blöcke, die die Lernwelt auch findet, entstanden
 *                daraus nie.
 *   PDF          Der Wortlaut einer PDF-Seite steht in `suchtext` und ist
 *                über `suchen` zufällig erreichbar. Gezielt („Seite 4 bis 6
 *                des Skripts") ging nicht.
 *   Tabellen     `datenbankAnlegen` gibt es. Eine einfache Tabelle im Text —
 *                `type:'table'` mit `rows` — konnte die KI nicht anlegen.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Die drei Werkzeuge stehen im Katalog, mit dem richtigen Recht.
 *   2  `karteikartenAnlegen` legt echte `flashcard`-Blöcke an — und die
 *      LERNWELT findet sie. Das ist die Messung, auf die es ankommt: ein
 *      Block mit dem richtigen Typ, den `Learning.cards()` nicht zählt,
 *      wäre eine Karte, die niemand je lernt.
 *   3  Frage und Antwort stehen wirklich getrennt (`Learning.splitCard`).
 *   4  `pdfLesen` gibt den Wortlaut EINER bestimmten Seitenspanne zurück,
 *      nicht das ganze Dokument und nicht die falschen Seiten.
 *   5  Ein Dokument, das es nicht gibt, bekommt eine Absage — keine
 *      erfundene Antwort.
 *   6  `tabelleAnlegen` legt einen `table`-Block an, den der EDITOR als
 *      Tabelle zeichnet: Zeilen und Zellen gezählt, nicht behauptet.
 *   7  Keines der drei trägt das Recht `loeschen`, und keines fasst
 *      vorhandene Blöcke an.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser.
 *
 *   node pruefungen/lauf/test547.mts
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
  'typeof App !== "undefined" && typeof Agent !== "undefined" && typeof Learning !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);
await seite.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

console.log('\n' + '─'.repeat(60));
console.log('Suite 547 — Lernkarten, PDF und Tabellen');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Stehen die drei im Katalog?');

const katalog = await seite.evaluate(
  '(() => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  const eins = n => w[n] ? { da: true, recht: w[n].recht,\n'
+ '                             beschreibung: String(w[n].beschreibung || "").slice(0, 60) }\n'
+ '                        : { da: false };\n'
+ '  return { anzahl: Object.keys(w).length,\n'
+ '           karten: eins("karteikartenAnlegen"),\n'
+ '           pdf: eins("pdfLesen"),\n'
+ '           tabelle: eins("tabelleAnlegen") };\n'
+ '})()') as any;

console.log('    Werkzeuge: ' + katalog.anzahl);
console.log('    karteikartenAnlegen: ' + JSON.stringify(katalog.karten));
console.log('    pdfLesen:            ' + JSON.stringify(katalog.pdf));
console.log('    tabelleAnlegen:      ' + JSON.stringify(katalog.tabelle));

p('karteikartenAnlegen gibt es, und es ist ein Schreibwerkzeug',
  katalog.karten.da && katalog.karten.recht === 'bearbeiten', JSON.stringify(katalog.karten));
p('pdfLesen gibt es, und es ist ein Lesewerkzeug',
  katalog.pdf.da && katalog.pdf.recht === 'lesen', JSON.stringify(katalog.pdf));
p('tabelleAnlegen gibt es, und es ist ein Schreibwerkzeug',
  katalog.tabelle.da && katalog.tabelle.recht === 'bearbeiten', JSON.stringify(katalog.tabelle));
p('Keines der drei darf löschen',
  katalog.karten.recht !== 'loeschen' && katalog.pdf.recht !== 'loeschen' &&
  katalog.tabelle.recht !== 'loeschen');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Lernkarten, die die Lernwelt auch findet');

const karten = await seite.evaluate(
  '(async () => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  if (!w.karteikartenAnlegen) return { fehler: "Werkzeug fehlt" };\n'
+ '  const s = Store.addPage(null, { text: "Elektrotechnik Kapitel 4" });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 200));\n'
+ '  const vorher = Learning.cards().length;\n'
+ '  const prot = { ids: [] };\n'
+ '  const antwort = await w.karteikartenAnlegen.lauf({\n'
+ '    titel: "Kapitel 4 — Karten",\n'
+ '    karten: [\n'
+ '      { frage: "Wie lautet das ohmsche Gesetz?", antwort: "U = R mal I" },\n'
+ '      { frage: "Einheit des Widerstands?", antwort: "Ohm" },\n'
+ '      { frage: "Wofuer steht P?", antwort: "Leistung in Watt" }]\n'
+ '  }, prot);\n'
+ '  const nachher = Learning.cards();\n'
+ '  const neu = nachher.filter(c => String(c.text || "").indexOf("ohmsche") >= 0 ||\n'
+ '                                  String(c.text || "").indexOf("Widerstands") >= 0 ||\n'
+ '                                  String(c.text || "").indexOf("Wofuer") >= 0);\n'
+ '  const eine = neu[0] ? Learning.splitCard(neu[0]) : null;\n'
+ '  return { antwort: String(antwort).slice(0, 160), vorher: vorher,\n'
+ '           nachher: nachher.length, neu: neu.length,\n'
+ '           typen: Array.from(new Set(neu.map(c => c.type))),\n'
+ '           geteilt: eine, protokoll: prot.ids.length, trainer: neu.every(c=>c.quiz?.format=== "flashcard" && c.quiz?.kapitel === "Kapitel 4 — Karten") };\n'
+ '})()') as any;

console.log('    Antwort: ' + karten.antwort);
console.log('    Learning.cards(): ' + karten.vorher + ' → ' + karten.nachher
  + ' · neu erkannt: ' + karten.neu);
console.log('    Frage/Antwort getrennt: ' + JSON.stringify(karten.geteilt));

p('Die Lernwelt zählt drei neue Karten', Number(karten.neu) === 3,
  karten.fehler || (karten.neu + ' statt 3'));
p('KI-Karten sind auch im Trainer als Kartenset verfügbar', karten.trainer === true);
p('Es sind echte flashcard-Blöcke',
  JSON.stringify(karten.typen) === '["flashcard"]', JSON.stringify(karten.typen));
p('Frage und Antwort stehen getrennt',
  Array.isArray(karten.geteilt) && String(karten.geteilt[1] || '').length > 0 &&
  String(karten.geteilt[1]).indexOf('noch keine Antwort') < 0,
  JSON.stringify(karten.geteilt));
p('Der Lauf kann zurückgenommen werden (Protokoll gefüllt)',
  Number(karten.protokoll) > 0, karten.protokoll + ' Kennungen im Protokoll');

/* ---------------------------------------------------------------------- */
console.log('\n3 · Eine PDF gezielt lesen');

const pdf = await seite.evaluate(
  '(async () => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  if (!w.pdfLesen) return { fehler: "Werkzeug fehlt" };\n'
+ '  const s = Store.addPage(null, { text: "Pruefungsskript 2026" });\n'
+ '  for (let n = 1; n <= 6; n++)\n'
+ '    Store.addBlock(s.id, "pdfseite", { text: "", nr: n, vonSeiten: 6,\n'
+ '      suchtext: "Seite " + n + ": Inhalt der Seite " + n + ". Stichwort S" + n + "." });\n'
+ '  const mitte = String(await w.pdfLesen.lauf({ titel: "Pruefungsskript", von: 4, bis: 5 }));\n'
+ '  const ganz = String(await w.pdfLesen.lauf({ titel: "Pruefungsskript" }));\n'
+ '  const weg = String(await w.pdfLesen.lauf({ titel: "Gibt es nicht" }));\n'
+ '  return { mitte: mitte.slice(0, 300), ganzLang: ganz.length, weg: weg.slice(0, 120),\n'
+ '           hatS4: mitte.indexOf("S4") >= 0, hatS5: mitte.indexOf("S5") >= 0,\n'
+ '           hatS1: mitte.indexOf("S1") >= 0, hatS6: mitte.indexOf("S6") >= 0,\n'
+ '           ganzHatS1: ganz.indexOf("S1") >= 0, ganzHatS6: ganz.indexOf("S6") >= 0 };\n'
+ '})()') as any;

console.log('    Seiten 4–5: ' + pdf.mitte);
console.log('    ganzes Dokument: ' + pdf.ganzLang + ' Zeichen');
console.log('    unbekanntes Dokument: ' + pdf.weg);

p('Seiten 4 bis 5 kommen zurück', pdf.hatS4 === true && pdf.hatS5 === true,
  pdf.fehler || pdf.mitte);
p('Und NUR die — nicht Seite 1 oder 6', pdf.hatS1 === false && pdf.hatS6 === false,
  'S1=' + pdf.hatS1 + ' S6=' + pdf.hatS6);
p('Ohne Spanne kommt das ganze Dokument',
  pdf.ganzHatS1 === true && pdf.ganzHatS6 === true);
p('Ein Dokument, das es nicht gibt, bekommt eine Absage',
  String(pdf.weg).toLowerCase().indexOf('kein') >= 0 ||
  String(pdf.weg).toLowerCase().indexOf('nicht') >= 0, pdf.weg);

/* ---------------------------------------------------------------------- */
console.log('\n4 · Eine Tabelle, die der Editor auch zeichnet');

const tabelle = await seite.evaluate(
  '(async () => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  if (!w.tabelleAnlegen) return { fehler: "Werkzeug fehlt" };\n'
+ '  const s = Store.addPage(null, { text: "Kabelquerschnitte" });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 200));\n'
+ '  const prot = { ids: [] };\n'
+ '  const antwort = await w.tabelleAnlegen.lauf({\n'
+ '    kopfzeile: ["Querschnitt", "Strom", "Absicherung"],\n'
+ '    zeilen: [["1,5 mm²", "16 A", "B16"], ["2,5 mm²", "20 A", "B20"],\n'
+ '             ["4 mm²", "25 A", "B25"]] }, prot);\n'
+ '  App.zeichneSeite();\n'
+ '  await new Promise(f => setTimeout(f, 400));\n'
+ '  const blk = Store.childrenOf(s.id).filter(b => b.alive && b.type === "table")[0];\n'
+ '  const tab = document.querySelector("#page table.stab");\n'
+ '  return { antwort: String(antwort).slice(0, 140),\n'
+ '           typ: blk ? blk.type : "KEIN BLOCK",\n'
+ '           zeilen: blk && blk.rows ? blk.rows.length : -1,\n'
+ '           spalten: blk && blk.rows && blk.rows[0] ? blk.rows[0].length : -1,\n'
+ '           gezeichnet: !!tab,\n'
+ '           th: tab ? tab.querySelectorAll("th").length : -1,\n'
+ '           td: tab ? tab.querySelectorAll("td").length : -1,\n'
+ '           ersteZelle: tab ? (tab.querySelector("th") || {}).textContent : "",\n'
+ '           protokoll: prot.ids.length };\n'
+ '})()') as any;

console.log('    Antwort: ' + tabelle.antwort);
console.log('    Block: ' + tabelle.typ + ' · ' + tabelle.zeilen + ' Zeilen × '
  + tabelle.spalten + ' Spalten');
console.log('    Gezeichnet: ' + tabelle.gezeichnet + ' · ' + tabelle.th + ' th, '
  + tabelle.td + ' td · erste Zelle: "' + tabelle.ersteZelle + '"');

p('Es entsteht ein table-Block mit 4 Zeilen und 3 Spalten',
  tabelle.typ === 'table' && Number(tabelle.zeilen) === 4 && Number(tabelle.spalten) === 3,
  tabelle.fehler || (tabelle.typ + ' ' + tabelle.zeilen + '×' + tabelle.spalten));
p('Der Editor zeichnet ihn als echte Tabelle',
  tabelle.gezeichnet === true && Number(tabelle.th) === 3 && Number(tabelle.td) === 9,
  tabelle.th + ' th, ' + tabelle.td + ' td');
p('Die Kopfzeile steht oben', String(tabelle.ersteZelle).indexOf('Querschnitt') >= 0,
  '"' + tabelle.ersteZelle + '"');
p('Auch hier ist das Protokoll gefüllt', Number(tabelle.protokoll) > 0);

/* ---------------------------------------------------------------------- */
console.log('\n5 · Nichts Vorhandenes wird angefasst');

const heil = await seite.evaluate(
  '(async () => {\n'
+ '  const w = Agent.WERKZEUGE || {};\n'
+ '  const s = Store.addPage(null, { text: "Bestand" });\n'
+ '  const b = Store.addBlock(s.id, "text", { text: "Der bleibt, wie er ist." });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 150));\n'
+ '  const vorher = JSON.stringify([Store.getBlock(b.id).text, Store.getBlock(b.id).alive]);\n'
+ '  if (w.karteikartenAnlegen) await w.karteikartenAnlegen.lauf(\n'
+ '    { titel: "Dazu", karten: [{ frage: "F", antwort: "A" }] }, { ids: [] });\n'
+ '  if (w.tabelleAnlegen) await w.tabelleAnlegen.lauf(\n'
+ '    { kopfzeile: ["A"], zeilen: [["1"]] }, { ids: [] });\n'
+ '  const nachher = JSON.stringify([Store.getBlock(b.id).text, Store.getBlock(b.id).alive]);\n'
+ '  return { vorher: vorher, nachher: nachher };\n'
+ '})()') as any;

p('Ein vorhandener Block bleibt unverändert', heil.vorher === heil.nachher,
  heil.vorher + ' → ' + heil.nachher);

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
