/* Suite 555 — „Erinnerung" im Slash-Menü führt zu einer Erinnerung
 * ============================================================================
 * DIE HILFESEITE SAGT ES ZU (`hilfe/wissensseiten.ts`, Tabelle 2.7):
 *
 *     | `@remind` + Datum | Erinnerung | ✅ |
 *
 * Und `register/bloecke.ts:133` führt den Eintrag „Erinnerung ⏰" im
 * Slash-Menü, Gruppe Aktionen.
 *
 * WAS ER TAT. `editor.ts:2857` bildet ihn auf eine Zeichenkette ab:
 *
 *     const AUSLOESER = { mention: '@', date: '@', remind: '@remind ', emoji: ':' };
 *
 * Für `mention` und `date` ist das richtig: „@" öffnet ein Menü, das ohnehin
 * am Tippen hängt. Für `remind` gibt es dieses Menü nicht — **nirgends im
 * Programm wird `@remind` gelesen**. Der Eintrag schrieb also `@remind ` in
 * den Text und war fertig. §47, und zwar die stille Hälfte.
 *
 * DABEI IST ALLES DA. `Werkzeuge.erinnerungSetzen(seite)` öffnet einen
 * Dialog mit Zeitpunkt und Text, schreibt nach `Store.setMeta('erinnerungen')`,
 * fragt nach der Benachrichtigungserlaubnis und legt bei vorhandenem Server
 * einen Weckruf. Es fehlte nur der Draht.
 *
 * ─── WARUM DER DRAHT IM REGISTER LIEGT UND NICHT IM EDITOR ──────────────────
 * `bereiche/editor` fasst `Werkzeuge` (aus `bereiche/wissen`) heute EINMAL an
 * — `pruefungen/bereiche-bestand.json` führt genau diesen einen Treffer, und
 * das Verzeichnis darf nur schrumpfen (§5 Regel 1). Ein zweiter Aufruf im
 * Editor wäre ein neuer Querverweis.
 *
 * §5 nennt für genau diesen Fall den dritten Weg: „Über `register/` bekannt
 * machen." Das Muster gibt es schon — `register/menueband.ts:701` trägt
 * `tun: () => Werkzeuge.journal()` mit einem `kann()`-Wächter davor. Der
 * Eintrag im Blockregister bekommt dasselbe.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Der Registereintrag trägt eine Handlung, nicht nur einen Namen.
 *   2  Sie öffnet DENSELBEN Dialog wie „Erinnerung setzen" am Seitenmenü
 *      — ein Katalog, nicht zwei (§8).
 *   3  Der Text des Blocks bekommt KEIN `@remind ` mehr.
 *   4  Wer den Dialog ausfüllt, hat danach eine Erinnerung in der Liste.
 *   5  Fehlt der Bereich „wissen", passiert nichts Schlimmes — kein
 *      Absturz, und der Eintrag zeigt sich gar nicht erst.
 *
 * `listen(0)` statt fester Zahl (L205).
 *
 *   node pruefungen/lauf/test555.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

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
  'typeof App !== "undefined" && typeof Register !== "undefined" && typeof Werkzeuge !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);
await seite.evaluate('(() => { try { localStorage.setItem("rundgangGesehen","1"); } catch (e) {}\n'
  + '  document.getElementById("rg-willkommen")?.remove(); })()');

console.log('\n' + '─'.repeat(60));
console.log('Suite 555 — „Erinnerung" führt zu einer Erinnerung');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Der Registereintrag');

const eintrag = await seite.evaluate(
  '(() => {\n'
+ '  const liste = (Register.bloecke && Register.bloecke.alle) ? Register.bloecke.alle()\n'
+ '              : (Register.bloecke || []);\n'
+ '  const e = (Array.isArray(liste) ? liste : []).find(x => x && x.id === "a-remind");\n'
+ '  if (!e) return { da: false };\n'
+ '  return { da: true, name: e.name, aktion: e.aktion,\n'
+ '           hatTun: typeof e.tun === "function",\n'
+ '           hatZeigen: typeof e.zeigen === "function",\n'
+ '           zeigtSich: typeof e.zeigen === "function" ? !!e.zeigen() : null };\n'
+ '})()') as any;

console.log('    ' + JSON.stringify(eintrag));
p('Den Eintrag „Erinnerung" gibt es', eintrag.da === true);
p('Er trägt eine Handlung, nicht nur einen Namen', eintrag.hatTun === true,
  'ohne `tun` bleibt es beim Schreiben von „@remind " (§47)');
p('Und er sagt, ob er sich überhaupt zeigen darf',
  eintrag.hatZeigen === true && eintrag.zeigtSich === true,
  JSON.stringify(eintrag));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Was beim Auslösen geschieht');

const ausloesen = await seite.evaluate(
  '(async () => {\n'
+ '  document.querySelectorAll(".overlay").forEach(o => o.remove());\n'
+ '  const s = Store.addPage(null, { text: "Prüfung schreiben" });\n'
+ '  const b = Store.addBlock(s.id, "text", { text: "" });\n'
+ '  App.oeffne(s.id);\n'
+ '  await new Promise(f => setTimeout(f, 350));\n'
+ '  /* Denselben Weg wie das Slash-Menü: die Aktion des Registereintrags. */\n'
+ '  const liste = (Register.bloecke && Register.bloecke.alle) ? Register.bloecke.alle() : [];\n'
+ '  const e = liste.find(x => x && x.id === "a-remind");\n'
+ '  if (!e || typeof e.tun !== "function") return { fehler: "keine Handlung" };\n'
+ '  e.tun(s);\n'
+ '  await new Promise(f => setTimeout(f, 300));\n'
+ '  const dialog = document.querySelector(".overlay .finder .fh");\n'
+ '  const felder = { zeit: !!document.getElementById("ez"), text: !!document.getElementById("et") };\n'
+ '  return { titel: dialog ? (dialog.textContent || "").trim() : "KEIN DIALOG",\n'
+ '           felder: felder, blockText: Store.getBlock(b.id).text,\n'
+ '           seite: s.id };\n'
+ '})()') as any;

console.log('    Dialog: „' + ausloesen.titel + '" · Felder: ' + JSON.stringify(ausloesen.felder));
console.log('    Text des Blocks danach: „' + ausloesen.blockText + '"');

p('Es öffnet sich der Erinnerungsdialog',
  ausloesen.titel === 'Erinnerung', ausloesen.fehler || ausloesen.titel);
p('Mit Zeitpunkt UND Text — derselbe wie am Seitenmenü (§8)',
  ausloesen.felder && ausloesen.felder.zeit === true && ausloesen.felder.text === true,
  JSON.stringify(ausloesen.felder));
/* ZUERST: LIEF DER SCHRITT ÜBERHAUPT? Ohne diese Bedingung ist die Zusage
   grün, wenn gar nichts passiert ist — `undefined` enthält kein „@remind".
   Genau so war sie im ersten Anlauf grün, während der Rest rot war. */
p('Und „@remind " steht NICHT im Text',
  typeof ausloesen.blockText === 'string' && !ausloesen.blockText.includes('@remind'),
  ausloesen.fehler || ('„' + ausloesen.blockText + '"'));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Ausgefüllt heisst: es steht in der Liste');

const gesetzt = await seite.evaluate(
  '(async () => {\n'
+ '  const vorher = (Werkzeuge.erinnerungen() || []).length;\n'
+ '  const zeit = document.getElementById("ez");\n'
+ '  const text = document.getElementById("et");\n'
+ '  if (!zeit || !text) return { fehler: "kein offener Dialog" };\n'
+ '  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);\n'
+ '  const zwei = n => String(n).padStart(2, "0");\n'
+ '  zeit.value = d.getFullYear() + "-" + zwei(d.getMonth() + 1) + "-" + zwei(d.getDate())\n'
+ '             + "T" + zwei(d.getHours()) + ":" + zwei(d.getMinutes());\n'
+ '  text.value = "Formelsammlung mitnehmen";\n'
+ '  const knopf = document.querySelector(\'.overlay [data-a="ok"]\');\n'
+ '  if (knopf) knopf.click();\n'
+ '  await new Promise(f => setTimeout(f, 400));\n'
+ '  const liste = Werkzeuge.erinnerungen() || [];\n'
+ '  const neu = liste[liste.length - 1];\n'
+ '  return { vorher: vorher, nachher: liste.length,\n'
+ '           text: neu ? neu.text : null, pageId: neu ? neu.pageId : null,\n'
+ '           erledigt: neu ? neu.erledigt : null,\n'
+ '           offenerDialog: !!document.querySelector(".overlay .finder .fh") };\n'
+ '})()') as any;

console.log('    Erinnerungen: ' + gesetzt.vorher + ' → ' + gesetzt.nachher);
console.log('    zuletzt: „' + gesetzt.text + '" für Seite ' + gesetzt.pageId);

p('Die Erinnerung steht in der Liste',
  Number(gesetzt.nachher) === Number(gesetzt.vorher) + 1,
  gesetzt.fehler || (gesetzt.vorher + ' → ' + gesetzt.nachher));
p('Mit dem eingegebenen Text', gesetzt.text === 'Formelsammlung mitnehmen',
  String(gesetzt.text));
p('Und sie hängt an der richtigen Seite',
  !!gesetzt.pageId && gesetzt.pageId === ausloesen.seite,
  String(gesetzt.pageId) + ' gegen ' + String(ausloesen.seite));
p('Der Dialog ist danach zu', gesetzt.offenerDialog === false);

/* ---------------------------------------------------------------------- */
console.log('\n4 · `zeigen()` wirft nicht');
/* WAS HIER NICHT GEMESSEN WERDEN KANN, und das gehört dazugesagt: `Werkzeuge`
   ist eine Konstante im Skript-Bereich und hängt NICHT am Fenster (E207).
   Von aussen lässt sich das Modul deshalb gar nicht verstecken — der Versuch
   unten setzt `window.Werkzeuge`, und der Name im Register sieht davon
   nichts. Gemessen wird also nur, dass `zeigen()` überhaupt nicht wirft;
   dass es bei fehlendem Modul „nein" sagt, hält der try/catch im Register
   und ist hier NICHT bewiesen. */

const ohne = await seite.evaluate(
  '(() => {\n'
+ '  const liste = (Register.bloecke && Register.bloecke.alle) ? Register.bloecke.alle() : [];\n'
+ '  const e = liste.find(x => x && x.id === "a-remind");\n'
+ '  if (!e || typeof e.zeigen !== "function") return { fehler: "kein zeigen" };\n'
+ '  const alt = window.Werkzeuge;\n'
+ '  let zeigtOhne = null, geworfen = false;\n'
+ '  try {\n'
+ '    /* So, wie es aussähe, wenn das Skript nicht geladen wäre. */\n'
+ '    Object.defineProperty(window, "Werkzeuge", { value: undefined, configurable: true });\n'
+ '    zeigtOhne = !!e.zeigen();\n'
+ '  } catch (err) { geworfen = true; }\n'
+ '  Object.defineProperty(window, "Werkzeuge", { value: alt, configurable: true });\n'
+ '  return { zeigtOhne: zeigtOhne, geworfen: geworfen };\n'
+ '})()') as any;

console.log('    zeigt sich ohne „wissen": ' + ohne.zeigtOhne + ' · geworfen: ' + ohne.geworfen);
p('`zeigen()` wirft nicht — eine Ausnahme machte das ganze Slash-Menü unbrauchbar',
  ohne.geworfen === false, ohne.fehler || '');
console.log('    (dass es bei FEHLENDEM Modul „nein" sagt, ist von aussen nicht');
console.log('     messbar — `Werkzeuge` hängt nicht am Fenster, E207.)');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
