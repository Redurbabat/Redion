/* Suite 552 — Ein abgekündigtes Modell sagt, dass es das Modell ist
 * ============================================================================
 * REDUR, 20. September 2026, mit der Meldung aus seinem Fenster:
 *
 *   „⚠ Groq antwortet mit 404. Die Adresse gibt es nicht (object_not_found).
 *    {"error":{"message":"The model `llama-3.3-70b-versatile` does not exist
 *    or you do not have access to it.","type":"invalid_request_error",
 *    "code":"model_not_found"}}"
 *
 * ZWEI FEHLER IN EINER ZEILE, und der erste ist der teure:
 *
 * 1 · „DIE ADRESSE GIBT ES NICHT" IST FALSCH. Die Adresse gibt es sehr wohl;
 *     Groq hat sie beantwortet. Es ist das MODELL, das es nicht mehr gibt —
 *     der Anbieter sagt es wörtlich, mit `code: model_not_found`. Redion
 *     hatte diesen Satz in der Hand und stellte trotzdem seine eigene,
 *     falsche Erklärung davor. Wer sie liest, sucht am falschen Ort.
 *
 *     `FEHLERTEXT` (dienst.ts:173) ist eine Tabelle von Statuszahl zu Satz.
 *     Eine Zahl kann aber mehrere Ursachen haben, und der Anbieter weiss
 *     die richtige. Wer sie mitschickt, hat immer recht; die Tabelle ist
 *     nur die Antwort für den, der nichts sagt.
 *
 * 2 · DIE MODELLLISTE IST EINGEBAUT UND VERALTET STILL. `ANBIETER` führt
 *     `modelle:['llama-3.3-70b-versatile', …]` als Text im Programm. Groq
 *     mustert Modelle aus; die Liste merkt es nie. Für Ollama fragt Redion
 *     längst nach, was da ist (`sucheOllamaJetzt`) — für die Wolke nicht.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Sagt der Anbieter, WAS schiefging, steht SEIN Satz in der Meldung.
 *   2  Bei `model_not_found` steht nichts von einer Adresse — und es steht
 *      da, was zu tun ist.
 *   3  Ein 404 OHNE erklärenden Körper behält den alten Satz: die Tabelle
 *      bleibt die Antwort für den, der schweigt.
 *   4  Die Modelle lassen sich beim Anbieter erfragen (`/models`), und was
 *      er nennt, steht danach im Menü.
 *   5  Geht das schief, bleibt die eingebaute Liste — kein leeres Menü.
 *   6  Kein Schlüssel wird dabei irgendwo hingeschickt ausser zum Anbieter
 *      selbst (§21, §42).
 *
 * KEIN ECHTES NETZ. `fetch` wird abgehängt und antwortet genau das, was
 * Groq geantwortet hat. `listen(0)` statt fester Zahl (L205).
 *
 *   node pruefungen/lauf/test552.mts
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
await seite.waitForFunction('typeof KI !== "undefined" && typeof Store !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);

console.log('\n' + '─'.repeat(60));
console.log('Suite 552 — Ein abgekündigtes Modell sagt, dass es das Modell ist');
console.log('─'.repeat(60));

/* Genau der Körper, den Groq geschickt hat. */
const GROQ_404 = '{"error":{"message":"The model `llama-3.3-70b-versatile` does not ' +
  'exist or you do not have access to it.","type":"invalid_request_error",' +
  '"code":"model_not_found"}}';

/* ---------------------------------------------------------------------- */
console.log('\n1 · Was die Meldung sagt, wenn der Anbieter es sagt');

const meldung = await seite.evaluate(
  '(async () => {\n'
+ '  Store.setMeta("api:groq", "gpk_probe");\n'
+ '  const alt = window.fetch;\n'
+ '  window.fetch = () => Promise.resolve(new Response(' + JSON.stringify(GROQ_404) + ', {\n'
+ '    status: 404, headers: { "Content-Type": "application/json" } }));\n'
+ '  let satz = "";\n'
+ '  try {\n'
+ '    const g = KI.wolkeFragen([{ role: "user", content: "hallo" }], "llama-3.3-70b-versatile");\n'
+ '    for await (const st of g) { void st; }\n'
+ '  } catch (e) { satz = String(e && e.message || e); }\n'
+ '  window.fetch = alt;\n'
+ '  return satz;\n'
+ '})()') as string;

console.log('    ' + (meldung || '(keine Ausnahme)').slice(0, 220));

p('Es kommt überhaupt eine Meldung', !!meldung);
p('Sie nennt das MODELL beim Namen',
  /llama-3\.3-70b-versatile/.test(meldung), meldung.slice(0, 160));
p('Sie behauptet NICHT, die Adresse gebe es nicht',
  !/Adresse gibt es nicht/i.test(meldung),
  'der Satz schickt den Leser an den falschen Ort: die Adresse war in Ordnung');
p('Sie sagt, dass es am Modell liegt',
  /modell/i.test(meldung), meldung.slice(0, 160));
p('Und sie sagt, was zu tun ist',
  /wähl|wechs|ander|Modell wählen|Liste/i.test(meldung), meldung.slice(0, 200));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Ein 404 ohne Erklärung behält den alten Satz');

const stumm = await seite.evaluate(
  '(async () => {\n'
+ '  const alt = window.fetch;\n'
+ '  window.fetch = () => Promise.resolve(new Response("", { status: 404 }));\n'
+ '  let satz = "";\n'
+ '  try {\n'
+ '    const g = KI.wolkeFragen([{ role: "user", content: "hallo" }], "irgendwas");\n'
+ '    for await (const st of g) { void st; }\n'
+ '  } catch (e) { satz = String(e && e.message || e); }\n'
+ '  window.fetch = alt;\n'
+ '  return satz;\n'
+ '})()') as string;

console.log('    ' + (stumm || '(keine Ausnahme)').slice(0, 160));
p('Ohne Körper bleibt die Tabelle die Antwort',
  /404/.test(stumm) && stumm.length > 10, stumm.slice(0, 160));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Die Modelle beim Anbieter erfragen');

const MODELLE = JSON.stringify(JSON.stringify({ object: 'list', data: [
  { id: 'llama-neu-70b', object: 'model' },
  { id: 'llama-neu-8b', object: 'model' },
  { id: 'whisper-gross-v3', object: 'model' }
] }));

const geholt = await seite.evaluate(
  '(async () => {\n'
+ '  if (typeof KI.modelleHolen !== "function") return { fehler: "gibt es nicht" };\n'
+ '  let gerufen = "", kopf = null;\n'
+ '  const alt = window.fetch;\n'
+ '  window.fetch = (u, init) => {\n'
+ '    gerufen = String(u); kopf = init && init.headers ? Object.assign({}, init.headers) : null;\n'
+ '    return Promise.resolve(new Response(' + MODELLE + ', {\n'
+ '      status: 200, headers: { "Content-Type": "application/json" } }));\n'
+ '  };\n'
+ '  const liste = await KI.modelleHolen("groq");\n'
+ '  window.fetch = alt;\n'
+ '  return { liste: liste, gerufen: gerufen, kopf: kopf,\n'
+ '           gemerkt: Store.getMeta("ki:modelle:groq", null) };\n'
+ '})()') as any;

console.log('    gerufen: ' + (geholt.gerufen || '—'));
console.log('    Liste:   ' + JSON.stringify(geholt.liste));

p('Es gibt einen Weg, die Modelle zu holen', !geholt.fehler, geholt.fehler);
p('Er fragt den Anbieter unter /models',
  /\/models$/.test(String(geholt.gerufen || '')), String(geholt.gerufen));
p('Er fragt DENSELBEN Anbieter, nicht irgendwen (§21, §42)',
  /^https:\/\/api\.groq\.com\//.test(String(geholt.gerufen || '')), String(geholt.gerufen));
p('Der Schlüssel reist nur dorthin mit',
  !!geholt.kopf && /gpk_probe/.test(JSON.stringify(geholt.kopf)),
  JSON.stringify(geholt.kopf));
p('Was der Anbieter nennt, kommt zurück',
  Array.isArray(geholt.liste) && geholt.liste.includes('llama-neu-70b'),
  JSON.stringify(geholt.liste));
p('Und es wird gemerkt, damit das Menü es kennt',
  Array.isArray(geholt.gemerkt) && geholt.gemerkt.includes('llama-neu-70b'),
  JSON.stringify(geholt.gemerkt));

/* ---------------------------------------------------------------------- */
console.log('\n4 · Geht es schief, bleibt die eingebaute Liste');

const schief = await seite.evaluate(
  '(async () => {\n'
+ '  Store.setMeta("ki:modelle:groq", null);\n'
+ '  const alt = window.fetch;\n'
+ '  window.fetch = () => Promise.reject(new Error("kein Netz"));\n'
+ '  let liste = null, geworfen = false;\n'
+ '  try { liste = await KI.modelleHolen("groq"); } catch (e) { geworfen = true; }\n'
+ '  window.fetch = alt;\n'
+ '  const eingebaut = KI.anbieter("groq").modelle;\n'
+ '  return { liste: liste, geworfen: geworfen, eingebaut: eingebaut,\n'
+ '           benutzt: KI.modelleVon ? KI.modelleVon("groq") : null };\n'
+ '})()') as any;

console.log('    geworfen: ' + schief.geworfen + ' · zurück: ' + JSON.stringify(schief.liste));
console.log('    was das Menü nimmt: ' + JSON.stringify(schief.benutzt));

p('Ein Netzfehler wirft den Nutzer nicht aus der Bahn', schief.geworfen === false,
  'die Ausnahme müsste gefangen sein');
p('Das Menü hat trotzdem Modelle (die eingebauten)',
  Array.isArray(schief.benutzt) && schief.benutzt.length > 0,
  JSON.stringify(schief.benutzt));

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
