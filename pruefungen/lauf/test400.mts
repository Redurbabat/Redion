/* Suite 400 — Kein Prüflauf teilt seinen Port (E405)
 * ============================================================================
 * Jede Suite startet einen eigenen kleinen Webserver auf einem FESTEN Port.
 * Ports gehören dem Rechner, nicht der Suite: zwei Läufe mit derselben Zahl
 * können nie nebeneinander laufen.
 *
 * DASS DAS TEUER IST, IST NACHGEWIESEN. Am 4. September lief ein voller Lauf
 * in einem eigenen Arbeitsbaum, während im Hauptbaum `test206` geprüft wurde.
 * `test206` und `test247` hatten beide 8967. Ergebnis: Stück 22 des vollen
 * Laufs war ROT — und nichts daran war ein Fehler im Produkt. Einzeln
 * nachgefahren lief `test247` mit 106 von 106 durch.
 *
 * Ein Ergebnis, das aus dem falschen Grund rot ist, ist schlimmer als eines,
 * das grün lügt: es schickt einen auf die Jagd nach etwas, das es nicht gibt.
 *
 * Gefunden wurden damals 23 doppelte Zahlen über 48 Läufe — eine davon
 * viermal vergeben. Diese Suite sorgt dafür, dass keine 24. dazukommt.
 *
 * AM 20. SEPTEMBER HAT SIE SELBST EINE DAZUKOMMEN LASSEN, sieben sogar: sie
 * las nur `PORT = …` und war blind für `listen(9624, …)`. Siehe E643 und den
 * Kommentar unten an der Stelle. Seit dem prüft sie AUCH, dass sie keinen
 * Lauf übersieht.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, und sie WAR es: gegen den Bestand von vor dem Aufräumen meldet sie 23
 * Gruppen. Gegenprobe heute: in irgendeiner Suite `PORT` auf den Wert einer
 * anderen setzen.
 *
 * Diese Suite braucht keinen Browser und keinen Server — sie liest Dateien.
 * Sie läuft in unter einer Sekunde und hat deshalb selbst keinen Port.
 *
 *   node pruefungen/lauf/test400.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { nurCode } from '../hilfe/quelltext.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const LAUF = path.join(WURZEL, 'pruefungen/lauf');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const dateien = fs.readdirSync(LAUF)
  .filter(f => /^test\d+\.mts$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));

p('Es gibt Prüfläufe zu lesen', dateien.length > 100, String(dateien.length));

/* ══ JEDE SCHREIBWEISE, NICHT NUR EINE (E643) ═══════════════════════════════
   Hier stand `roh.match(/PORT = (\d+)/)` — und genau EINE Schreibweise zu
   kennen ist der Fehler, der diesem Projekt an einem Tag viermal passiert
   ist (E629, E631, E642 und hier). Acht Läufe schreiben ihre Zahl direkt in
   den Aufruf:

       await new Promise<void>(f => server.listen(9624, '127.0.0.1', f));

   Für den alten Ausdruck waren sie unsichtbar, und damit auch SIEBEN
   doppelt vergebene Ports:

       8799: test31 + test130      9629: test429 + test519
       8963: test205 + test243     9630: test430 + test520
       9624: test424 + test514     9631: test437 + test521
       9628: test428 + test518

   Gemessen am 20. September, nachdem `test424` in einem Stapel von sechzehn
   an genau der Zeile rot wurde, die ihren eigenen Lastverlauf im Kommentar
   führt. Der Lauf, der die vollen Läufe vor Fehlalarm schützen soll, war
   selbst die Quelle eines.

   `listen(0)` ist KEINE fehlende Zahl, sondern die bessere Antwort: der
   Rechner sucht sich einen freien Port, und zwei solche Läufe können sich
   nie in die Quere kommen. Sechs Läufe machen das schon so (test492,
   test524, test527, test528, test529, test538). Wer einen neuen Lauf
   schreibt, nimmt am besten diesen Weg.

   Einige ältere Dateien haben Zeichen, die keine gültige UTF-8-Folge sind
   (Bildschirmfotos als Base64 im Quelltext). `utf8` ersetzt sie still —
   das ist hier richtig, weil alle gesuchten Muster reines ASCII sind. */
const ports = new Map<string, number>();
const eigenerHafen: string[] = [];   // listen(0) — der Rechner wählt
const mitServer: string[] = [];
const stumm: string[] = [];          // startet einen Server, nennt aber keine Zahl

for (const f of dateien) {
  /* NUR DER CODE, NICHT DIE PROSA — sonst klagt dieser Lauf seinen eigenen
     Kommentar an. Genau das ist beim ersten Bauen passiert: die Tabelle
     oben nennt „9624: test424 + test514", und der Lauf meldete prompt
     „9624: test400 + test424". Zum DRITTEN Mal an zwei Tagen hat das
     Aufschreiben den nächsten Fehlalarm erzeugt (E631, E633). Der Entferner
     steht in `pruefungen/hilfe/quelltext.mts` und wird benutzt, nicht
     nachgebaut (§8). */
  const code = nurCode(fs.readFileSync(path.join(LAUF, f), 'utf8'));
  const hatServer = code.includes('createServer') || /\.listen\(/.test(code);
  if (hatServer) mitServer.push(f);

  const zahlen = new Set<number>();
  for (const m of code.matchAll(/\bPORT\s*(?::\s*number)?\s*=\s*(\d{4,5})/g)) zahlen.add(Number(m[1]));
  for (const m of code.matchAll(/listen\(\s*(\d{4,5})/g)) zahlen.add(Number(m[1]));

  if (zahlen.size) { for (const z of zahlen) ports.set(f + (zahlen.size > 1 ? ':' + z : ''), z); continue; }
  /* ERST DIE FRAGE, OB ES ÜBERHAUPT EINEN SERVER GIBT — und dann die nach
     der Zahl. Ohne diese Zeile zählte dieser Lauf SICH SELBST als „listen(0)":
     die Worte stehen in seiner eigenen Ausgabezeile, und die steht in einer
     Schablone. Schablonen lässt `nurCode` mit Absicht stehen (dort steht
     echter Code), also hilft der Entferner hier nicht — die Frage muss
     richtig gestellt werden. Vierte Fassung derselben Lehre an zwei Tagen. */
  if (!hatServer) continue;
  if (/listen\(\s*0\s*[,)]/.test(code)) { eigenerHafen.push(f); continue; }
  stumm.push(f);
}
console.log(`    ${ports.size} feste Ports · ${eigenerHafen.length} × listen(0) · `
  + `${mitServer.length} von ${dateien.length} Läufen starten überhaupt einen Server`);

/* DER WÄCHTER MUSS WISSEN, WAS ER NICHT SIEHT. Ohne diese Zeile konnte die
   Zahl oben „374 von 481" lauten, ohne dass jemand fragte, was mit den
   übrigen ist — und die Antwort war sieben Jahre Kollisionen. Ein Lauf mit
   eigenem Server nennt entweder eine Zahl oder `listen(0)`; eine dritte
   Schreibweise macht diese Zeile rot, statt lautlos ein Loch zu lassen. */
p('Jeder Lauf mit eigenem Server zeigt seinen Port', stumm.length === 0,
  stumm.map(f => f.replace('.mts', '')).join(', '));

const gruppen = new Map<number, string[]>();
for (const [f, port] of ports) {
  const liste = gruppen.get(port) ?? [];
  liste.push(f.replace('.mts', ''));
  gruppen.set(port, liste);
}
const doppelt = [...gruppen.entries()]
  .filter(([, fs2]) => fs2.length > 1)
  .map(([port, fs2]) => `${port}: ${fs2.join(' + ')}`)
  .sort();

p('Kein Port ist zweimal vergeben', doppelt.length === 0,
  doppelt.slice(0, 8).join('  ·  ') + (doppelt.length > 8 ? ` … (${doppelt.length} Gruppen)` : ''));

/* Und eine Grenze nach oben: über 65535 gibt es keinen Port, und unter 1024
   braucht man Rechte, die ein Prüflauf nicht haben soll. */
const schraeg = [...ports.entries()]
  .filter(([, port]) => port < 1024 || port > 65535)
  .map(([f, port]) => `${f}=${port}`);
p('Alle Ports liegen im erlaubten Bereich', schraeg.length === 0, schraeg.join(', '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
