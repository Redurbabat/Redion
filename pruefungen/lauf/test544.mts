/* Suite 544 — Das KI-Fenster tut, was seine Knöpfe versprechen
 * ============================================================================
 * ZWEI FUNDE aus der Bestandsaufnahme vom 20. September, beide in
 * `src/bereiche/ki/dienst.ts`, beide von der stillen Sorte (§47).
 *
 * 1 · KEIN STOPP-KNOPF. Die ganze Abbruchkette ist gebaut —
 *     `frage(…, {signal})`, ein abbrechbares `schlafen` fuer den Backoff,
 *     `signal` bis in `fetch` hinein. Nur `senden` ruft `frage` OHNE das
 *     dritte Argument, und im Markup gibt es keinen Knopf dafuer. Wer eine
 *     lange Antwort losgeschickt hat, kann sie nur durch Schliessen des
 *     Tabs beenden. Das Teure war gebaut, das Billige fehlte.
 *
 * 2 · EIN TOTER MENUEPUNKT. „Meine Quellen" ruft
 *     `quellenKarte(e.currentTarget)` — ein HTML-Element an eine Funktion,
 *     die eine LISTE erwartet. `!element.length` ist wahr, also kommt
 *     lautlos `null` zurueck, und selbst das wird nirgends eingehaengt. Der
 *     Punkt zeigt eine Zahl und ein „▸", verspricht also ein Untermenue,
 *     und tut nichts.
 *
 * WAS DIESER LAUF HAELT
 *
 *   1  `senden` reicht ein Abbruchsignal bis in `fetch` durch.
 *   2  Waehrend eine Antwort laeuft, ist der Senden-Knopf ein Stopp-Knopf —
 *      derselbe Knopf, dieselbe Groesse (§37: kein Hit-Target wandert).
 *   3  Ein Abbruch behaelt die Teilantwort und sagt „Abgebrochen", nicht
 *      „AbortError". Was schon dasteht, gehoert dem Nutzer (§51).
 *   4  „Meine Quellen" oeffnet wirklich etwas, und ein Klick darin schaltet
 *      dieselbe Quelle wie die Schalterleiste — EIN Katalog, nicht zwei (§8).
 *   5  GEGENPROBE: der Lauf kann rot werden, und war es.
 *
 * KEIN NETZ. `fetch` wird abgehaengt und antwortet nie — es sei denn, das
 * Signal kommt an. Genau das ist die Messung: bleibt der Lauf haengen, ist
 * kein Signal durchgereicht worden.
 *
 * ─── ACHTUNG BEIM SCHREIBEN ─────────────────────────────────────────────────
 * Was in `page.evaluate('…')` steht, ist reines JavaScript im Browser. Ein
 * `as HTMLElement` darin ist ein Syntaxfehler, und ein Akzentzeichen in einem
 * Kommentar INNERHALB einer Schablone beendet sie mitten im Satz.
 *
 *   node pruefungen/lauf/test544.mts
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
  'typeof App !== "undefined" && typeof KI !== "undefined" && typeof Kontext !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(500);

console.log('\n' + '─'.repeat(60));
console.log('Suite 544 — Das KI-Fenster tut, was seine Knöpfe versprechen');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Eine laufende Antwort lässt sich abbrechen');

const stopp = await seite.evaluate(
  '(async () => {\n'
+ '  App.kiPanel(true);\n'
+ '  await new Promise(f => setTimeout(f, 250));\n'
+ '  KI.zustand.bereit = true;\n'
+ '  KI.zustand.modell = "probe:1";\n'
+ '  KI.zustand.quelle = "ollama";\n'
+ '\n'
+ '  /* fetch antwortet NIE — ausser das Abbruchsignal kommt an. */\n'
+ '  let signalKam = false;\n'
+ '  const altFetch = window.fetch;\n'
+ '  window.fetch = function (url, init) {\n'
+ '    const sig = init && init.signal;\n'
+ '    if (sig) {\n'
+ '      signalKam = true;\n'
+ '      return new Promise(function (ok2, nein) {\n'
+ '        if (sig.aborted) { const e = new Error("Abbruch"); e.name = "AbortError"; nein(e); return; }\n'
+ '        sig.addEventListener("abort", function () {\n'
+ '          const e = new Error("Abbruch"); e.name = "AbortError"; nein(e);\n'
+ '        }, { once: true });\n'
+ '      });\n'
+ '    }\n'
+ '    return new Promise(function () {});\n'
+ '  };\n'
+ '\n'
+ '  const lauf = KI.senden("Eine lange Frage");\n'
+ '  await new Promise(f => setTimeout(f, 400));\n'
+ '\n'
+ '  const knopf = document.getElementById("ai-senden");\n'
+ '  const vorher = knopf ? knopf.getBoundingClientRect() : null;\n'
+ '  const imLauf = {\n'
+ '    marke: knopf ? knopf.getAttribute("data-lauf") : null,\n'
+ '    name: knopf ? (knopf.getAttribute("aria-label") || "") : ""\n'
+ '  };\n'
+ '\n'
+ '  if (knopf) knopf.click();\n'
+ '  const fertig = await Promise.race([\n'
+ '    lauf.then(function () { return "fertig"; }, function () { return "geworfen"; }),\n'
+ '    new Promise(f => setTimeout(() => f("HAENGT"), 3000))\n'
+ '  ]);\n'
+ '  await new Promise(f => setTimeout(f, 150));\n'
+ '\n'
+ '  const nachher = knopf ? knopf.getBoundingClientRect() : null;\n'
+ '  const letzte = [...document.querySelectorAll("#chat .msg.a")].pop();\n'
+ '  window.fetch = altFetch;\n'
+ '  return {\n'
+ '    signalKam: signalKam, fertig: fertig,\n'
+ '    markeImLauf: imLauf.marke, nameImLauf: imLauf.name,\n'
+ '    markeDanach: knopf ? knopf.getAttribute("data-lauf") : null,\n'
+ '    breiteGleich: !!(vorher && nachher) && Math.abs(vorher.width - nachher.width) < 1\n'
+ '                  && Math.abs(vorher.height - nachher.height) < 1,\n'
+ '    text: letzte ? String(letzte.textContent || "").slice(0, 120) : ""\n'
+ '  };\n'
+ '})()') as any;

p('`senden` reicht ein Abbruchsignal bis in `fetch`', stopp.signalKam === true,
  'kein Signal angekommen');
p('Während des Laufs ist der Senden-Knopf ein Stopp-Knopf',
  stopp.markeImLauf === '1', 'data-lauf = ' + String(stopp.markeImLauf));
p('… und sagt das auch den Vorleseprogrammen (§38)',
  /abbrech|stopp/i.test(String(stopp.nameImLauf)), stopp.nameImLauf || '(leer)');
p('Der Klick beendet den Lauf wirklich', stopp.fertig !== 'HAENGT', String(stopp.fertig));
p('Danach ist er wieder der Senden-Knopf', !stopp.markeDanach, String(stopp.markeDanach));
p('Der Knopf wandert dabei nicht (§37)', stopp.breiteGleich === true);
p('Die Meldung sagt „Abgebrochen", nicht „AbortError"',
  /abgebrochen/i.test(String(stopp.text)) && !/aborterror/i.test(String(stopp.text)),
  stopp.text || '(leer)');

/* ---------------------------------------------------------------------- */
console.log('\n2 · „Meine Quellen" tut etwas — und zwar dasselbe wie die Leiste (seit E724 direkt am Prompt)');

const quellen = await seite.evaluate(
  '(async () => {\n'
+ '  App.kiPanel(true);\n'
+ '  await new Promise(f => setTimeout(f, 200));\n'
+ '  document.querySelectorAll(".menu").forEach(m => m.remove());\n'
+ '  const auf = document.getElementById("ai-quellen");\n'
+ '  if (!auf) return { fehler: "KEIN KNOPF ai-quellen" };\n'
+ '  /* SEIT E724 OHNE ZWISCHENSTUFE: „Quellen & Modus ▸ Meine Quellen ▸"\n'
+ '     ist aufgeloest. Der Knopf am Prompt IST die Quellenwahl und oeffnet\n'
+ '     die Schalter direkt — gemessen wird weiter nur, was ER neu oeffnet. */\n'
+ '  const vorherDa = new Set(document.querySelectorAll("[data-qs]"));\n'
+ '  auf.click();\n'
+ '  await new Promise(f => setTimeout(f, 250));\n'
+ '  if (document.querySelector(\'[data-y="quellen"]\')) return { fehler: "NOCH EINE ZWISCHENSTUFE quellen" };\n'
+ '\n'
+ '  /* NUR was der Menuepunkt NEU geoeffnet hat. Die Schalterleiste steht\n'
+ '     ohnehin im Fuss — wer sie mitzaehlt, misst nicht den Menuepunkt,\n'
+ '     sondern die Leiste, und der Lauf waere gruen ohne jede Reparatur. */\n'
+ '  const sichtbar = [...document.querySelectorAll("[data-qs]")].filter(function (b) {\n'
+ '    if (vorherDa.has(b)) return false;\n'
+ '    const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0;\n'
+ '  });\n'
+ '  /* Dieselben Quellen wie die Leiste im Fuss? */\n'
+ '  const leiste = KI.quellenLeiste();\n'
+ '  const ausLeiste = [...leiste.querySelectorAll("[data-qs]")].map(b => b.dataset.qs).sort();\n'
+ '  const ausMenue = [...new Set(sichtbar.map(b => b.dataset.qs))].sort();\n'
+ '\n'
+ '  /* Und schaltet ein Klick wirklich? */\n'
+ '  const ziel = sichtbar.find(b => b.dataset.qs === "datenbanken");\n'
+ '  const vorher = !!Kontext.quellen().datenbanken;\n'
+ '  if (ziel) ziel.click();\n'
+ '  await new Promise(f => setTimeout(f, 150));\n'
+ '  const nachher = !!Kontext.quellen().datenbanken;\n'
+ '  if (ziel) ziel.click();\n'
+ '  document.querySelectorAll(".menu").forEach(m => m.remove());\n'
+ '  return { offen: sichtbar.length, ausMenue: ausMenue, ausLeiste: ausLeiste,\n'
+ '           vorher: vorher, nachher: nachher };\n'
+ '})()') as any;

p('Der Menüpunkt öffnet überhaupt etwas', !quellen.fehler && Number(quellen.offen) > 0,
  quellen.fehler || (quellen.offen + ' Schalter sichtbar'));
p('Es sind DIESELBEN Quellen wie in der Leiste (§8)',
  JSON.stringify(quellen.ausMenue) === JSON.stringify(quellen.ausLeiste),
  JSON.stringify(quellen.ausMenue) + ' vs ' + JSON.stringify(quellen.ausLeiste));
p('Ein Klick darin schaltet die Quelle wirklich um',
  quellen.vorher !== quellen.nachher, quellen.vorher + ' → ' + quellen.nachher);

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
