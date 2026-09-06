/* Suite 426 — Die UI-Reserve ist ein Archiv, keine Tür (E440)
 * ============================================================================
 * Die Reserve liegt unter `quell/entwicklung/ui-reserve/` und zeigt
 * Uiverse-Originale — mit ihren globalen Klassen `.button`, `.loader`,
 * `.container`. Sie darf deshalb NIE in der App landen. Und sie darf nichts
 * behaupten: ein Eintrag ohne verifiziertes Original zeigt keins.
 *
 *   §1 NICHT IN DER APP: weder index.html noch GRUNDSTOCK noch ein Register
 *      kennen sie.
 *   §2 DER KATALOG STIMMT MIT DEN ORDNERN: jeder Eintrag hat einen Ordner
 *      mit notizen.md; jedes `original` zeigt auf eine vorhandene Datei;
 *      kein nicht-verifizierter Eintrag hat eine original.html.
 *   §3 DIE ORIGINALE SIND UNVERÄNDERT: keine Redion-Präfixe darin, kein
 *      Skript (sie brauchen keins und dürfen keins mitbringen).
 *   §4 DIE GALERIE LÄUFT: Karten für alle Einträge, Rahmen nur für
 *      Verifizierte, der Satz „noch nicht verifiziert" für die anderen,
 *      der Filter filtert, keine Fehler.
 *   §5 QUELLE UND AUSGABE: reserve.js ist aus reserve.ts erzeugt (§54).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → eine Zeile `quell/entwicklung/...` in den GRUNDSTOCK.
 *   §2 → einem nicht-verifizierten Ordner eine original.html geben.
 *   §4 → BEIDE Sperren fallen lassen: im Katalog einem nicht-verifizierten
 *        Eintrag einen echten Pfad geben UND in reserve.js die ZEIGBAR-Pruefung
 *        streichen. Nur ZEIGBAR zu weiten reicht NICHT — die Unverifizierten
 *        haben `original: null`, und der Pfad sperrt vor der Stufe. Der erste
 *        Wurf dieser Gegenprobe blieb deshalb gruen und bewies nichts.
 * Alle gelaufen, Ergebnisse im Bericht zu E440: A und B je ein Punkt rot,
 * C' drei Punkte rot („21 Rahmen, 20 verifiziert").
 *
 *   node pruefungen/lauf/test426.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9547;
const RES = path.join(WURZEL, 'quell/entwicklung/ui-reserve');

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  let pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (fs.existsSync(pfad) && fs.statSync(pfad).isDirectory()) pfad = path.join(pfad, 'index.html');
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

console.log('\n§1 Die Reserve ist nicht in der App');
p('index.html kennt sie nicht', !/entwicklung\/ui-reserve/.test(lies('index.html')));
p('Der GRUNDSTOCK kennt sie nicht', !/entwicklung\//.test(lies('src/dienst/sw.ts')));
p('Kein Register kennt sie',
  !/ui-reserve|entwicklung\//.test(lies('src/register/module.ts') + lies('src/register/navigation.ts')));
p('Die Einzeldatei kennt sie nicht', !/res-raster|ui-reserve/.test(lies('redion-einzeldatei.html')));

console.log('\n§2 Katalog und Ordner stimmen überein');
const katalog = JSON.parse(lies('quell/entwicklung/ui-reserve/katalog.json')) as Array<Record<string, unknown>>;
p('Der Katalog hat 50 Einträge', katalog.length === 50, String(katalog.length));
const ordner = fs.readdirSync(path.join(RES, 'komponenten')).sort();
p('… und 50 Ordner', ordner.length === 50, String(ordner.length));
const ohneOrdner = katalog.filter(e => !ordner.includes(String(e['id'])));
p('Jeder Eintrag hat seinen Ordner', ohneOrdner.length === 0, JSON.stringify(ohneOrdner.map(e => e['id'])));
const ohneNotiz = ordner.filter(o => !fs.existsSync(path.join(RES, 'komponenten', o, 'notizen.md')));
p('Jeder Ordner hat notizen.md', ohneNotiz.length === 0, JSON.stringify(ohneNotiz));
const totesOriginal = katalog.filter(e => e['original'] && !fs.existsSync(path.join(RES, String(e['original']))));
p('Jedes eingetragene Original gibt es als Datei', totesOriginal.length === 0,
  JSON.stringify(totesOriginal.map(e => e['id'])));
/* DER PUNKT, DER DAS ARCHIV EHRLICH HÄLT. Ein Ordner, dessen Katalogeintrag
   „nicht-verifiziert" oder „nur-identifiziert" sagt, darf KEINE original.html
   tragen — sonst behauptet die Datei, was der Katalog verneint. */
const UNSICHER = new Set(['nicht-verifiziert', 'nur-identifiziert']);
const erfunden = katalog.filter(e => UNSICHER.has(String(e['quelleStatus'])) &&
  (e['original'] || fs.existsSync(path.join(RES, 'komponenten', String(e['id']), 'original.html'))));
p('Kein unverifizierter Eintrag trägt ein Original', erfunden.length === 0,
  JSON.stringify(erfunden.map(e => e['id'])));
const verifiziert = katalog.filter(e => !UNSICHER.has(String(e['quelleStatus'])));
p('Jeder verifizierte Eintrag HAT ein Original',
  verifiziert.every(e => !!e['original']), JSON.stringify(verifiziert.filter(e => !e['original']).map(e => e['id'])));
const STATUS = new Set(['produktiv', 'produktiv-adaptiert', 'bedingt-produktiv', 'reserve', 'ersetzt']);
p('Jeder Status ist einer der fünf erlaubten', katalog.every(e => STATUS.has(String(e['status']))));

console.log('\n§3 Die Originale sind unverändert');
/* Nur die mit DATEI — ein verifizierter Eintrag ohne Datei ist oben schon rot
   gemeldet worden und darf hier nicht den ganzen Lauf abschiessen. Der erste
   Wurf las `String(null)` und öffnete `…/null`: ein Wächter, der bei seinem
   ersten Fund abstürzt statt rot zu werden, hat den Fund nur halb gemacht. */
const originale = verifiziert.filter(e => !!e['original']).map(e => path.join(RES, String(e['original'])));
p('Es gibt Originale zu prüfen', originale.length >= 15, String(originale.length));
const mitSkript = originale.filter(f => /<script/i.test(fs.readFileSync(f, 'utf8')));
p('Keines bringt ein Skript mit', mitSkript.length === 0, mitSkript.map(f => path.basename(path.dirname(f))).join(', '));
/* Ein Redion-Präfix in einer original.html hiesse: jemand hat das Archiv
   „angepasst". Genau das ist verboten (Auftrag §9). */
const angepasst = originale.filter(f => /\.(ru|ki|aw|lw|bib|res)-[a-z]/.test(fs.readFileSync(f, 'utf8')));
p('Keines trägt ein Redion-Präfix', angepasst.length === 0, angepasst.map(f => path.basename(path.dirname(f))).join(', '));

console.log('\n§4 Die Galerie läuft');
const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('console', m => { if (m.type() === 'error') fehler.push('konsole: ' + m.text().slice(0, 120)); });
await s.goto(`http://localhost:${PORT}/quell/entwicklung/ui-reserve/`);
await s.waitForFunction("document.querySelectorAll('.res-karte').length > 0", null, { timeout: 15000 });
await s.waitForTimeout(600);
const galerie = JSON.parse(await s.evaluate(`JSON.stringify({
  karten: document.querySelectorAll('.res-karte').length,
  rahmen: document.querySelectorAll('.res-karte iframe').length,
  fehlt: [...document.querySelectorAll('.res-fehlt')].filter(e => /noch nicht verifiziert/.test(e.textContent)).length,
  sandbox: [...document.querySelectorAll('iframe')].every(f => f.hasAttribute('sandbox')),
  status: document.getElementById('res-status').textContent,
  ueberlauf: document.documentElement.scrollWidth > document.documentElement.clientWidth
})`) as string);
p('Alle 50 Karten stehen', galerie.karten === 50, String(galerie.karten));
p('Genau die Verifizierten haben einen Rahmen', galerie.rahmen === verifiziert.length,
  `${galerie.rahmen} Rahmen, ${verifiziert.length} verifiziert`);
p('Die anderen sagen es ehrlich', galerie.fehlt === 50 - verifiziert.length, String(galerie.fehlt));
p('Jeder Rahmen ist eingesperrt (sandbox)', galerie.sandbox === true);
p('Die Statuszeile zählt', /50 von 50/.test(galerie.status), galerie.status);
p('Kein waagerechter Überlauf', galerie.ueberlauf === false);
await s.click('[data-filter="loader"]');
await s.waitForTimeout(200);
const gefiltert = JSON.parse(await s.evaluate(`JSON.stringify({
  karten: document.querySelectorAll('.res-karte').length,
  gedrueckt: document.querySelector('[data-filter="loader"]').getAttribute('aria-pressed')
})`) as string);
const laderImKatalog = katalog.filter(e => e['kategorie'] === 'loader').length;
p('Der Filter „Lader" zeigt genau die Lader', gefiltert.karten === laderImKatalog,
  `${gefiltert.karten} gezeigt, ${laderImKatalog} im Katalog`);
p('… und der Knopf sagt, dass er gedrückt ist', gefiltert.gedrueckt === 'true');
/* Ein Original im Rahmen muss auch wirklich zeichnen — sonst ist das Archiv
   ein Verzeichnis leerer Kästen. Der Spinner (Nr. 19) hat zehn Kinder. */
await s.click('[data-filter="alle"]');
const rahmenInhalt = await s.evaluate(`(async () => {
  const f = [...document.querySelectorAll('.res-karte')]
    .find(k => /19 · /.test(k.querySelector('h2').textContent))?.querySelector('iframe');
  if (!f) return 'kein Rahmen';
  f.scrollIntoView();
  await new Promise(r => setTimeout(r, 1200));
  try { return String(f.contentDocument?.querySelectorAll('.spinner div').length ?? 'kein Zugriff'); }
  catch (e) { return 'gesperrt: ' + e.message; }
})()`) as string;
/* Mit `sandbox=""` ist der Rahmen eine fremde Herkunft — der Zugriff ist
   gesperrt, und das ist richtig so. Also nur prüfen, dass das Original
   LÄDT: ein 404 wäre ein Konsolenfehler, und der steht in `fehler`. */
p('Der Rahmen des Spinners ist da (gesperrt oder gezählt)',
  /^\d+$|gesperrt|kein Zugriff/.test(rahmenInhalt), rahmenInhalt);
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close();

console.log('\n§5 Quelle und Ausgabe');
p('reserve.ts liegt unter src/', fs.existsSync(path.join(WURZEL, 'src/entwicklung/ui-reserve/reserve.ts')));
p('reserve.js ist erzeugt, nicht geschrieben',
  /ERZEUGT/.test(lies('quell/entwicklung/ui-reserve/reserve.js')));
p('tsconfig.bauen.json baut den Ordner', /src\/entwicklung\/\*\*\/\*\.ts/.test(lies('tsconfig.bauen.json')));

server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
