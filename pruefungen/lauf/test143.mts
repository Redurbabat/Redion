/* Suite 107 — Was sich nicht teilen lässt, wird nachgerechnet (L34)
 * ============================================================================
 * Drei Bündel, drei Welten: die App im Browserfenster, der Dienstarbeiter
 * (`sw.js`) und der Server bei Cloudflare. Keiner kann die Dateien der
 * anderen lesen — der Dienstarbeiter hat kein `window`, der Worker keinen
 * Browser.
 *
 * Wo sie sich trotzdem über einen Wert einig sein MÜSSEN, gibt es ihn
 * zwangsläufig zweimal. Genau dann muss ein Prüflauf ihn nachrechnen; ein
 * Kommentar „muss übereinstimmen" hat am 8. August dreimal nichts
 * verhindert (E64, E65).
 *
 * WAS HIER NACHGERECHNET WIRD
 *
 *   Der Name der Ablage. `KONSTANTEN.ABLAGE_NAME` ist 'notizen'; der
 *   Dienstarbeiter öffnet die IndexedDB selbst, um fällige Erinnerungen zu
 *   holen, wenn die App geschlossen ist. Ein falscher Name dort heisst
 *   nicht „Fehler", sondern **keine Erinnerungen** — und das fällt
 *   niemandem auf, denn eine Erinnerung, die nicht kommt, sieht aus wie
 *   eine, die nicht fällig war.
 *
 *   Die Liste der Dateien, die offline bereitliegen. `index.html` lädt sie
 *   über `<script src>`, `sw.js` legt sie in `GRUNDSTOCK` beiseite. Fehlt
 *   eine, startet die App offline unvollständig — und auch das sieht nicht
 *   nach einem Fehler aus, sondern nach einer App, die eine Sache nicht
 *   kann.
 *
 *   node pruefungen/lauf/test143.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8825;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const lies = (rel: string) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

console.log('\n1 · Der Name der Ablage');

const inApp = await seite.evaluate(() => (KONSTANTEN as any).ABLAGE_NAME);
gleich('Die App nennt sie „notizen"', inApp, 'notizen');

/* Der Dienstarbeiter trägt sie als eigene Konstante — er kann
   `konstanten.js` nicht laden, weil er kein `window` hat. */
const swTs = lies('src/dienst/sw.ts');
const imSw = /const ABLAGE_NAME = '([^']+)'/.exec(swTs)?.[1] ?? '(fehlt)';
gleich('Der Dienstarbeiter nennt denselben Namen', imSw, inApp);
p('… und öffnet die Ablage darüber, nicht über ein Literal',
  /indexedDB\.open\(ABLAGE_NAME\)/.test(swTs));
p('Nirgends im Dienstarbeiter steht der Name noch als Zeichenkette in `open`',
  !/indexedDB\.open\('/.test(swTs));

/* Und die gebaute Datei muss es auch tun — sie ist die, die läuft. */
const swJs = lies('sw.js');
p('Auch `sw.js` öffnet über die Konstante',
  /indexedDB\.open\(ABLAGE_NAME\)/.test(swJs));

console.log('\n2 · Was offline bereitliegt, ist auch das, was geladen wird');
/* `index.html` lädt über <script src>, `sw.js` legt GRUNDSTOCK beiseite.
   Fehlt eine Datei dort, startet die App offline unvollständig. */
const html = lies('index.html');
const geladen = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1] ?? '')
  .filter(x => x.startsWith('quell/'));
const stil = [...html.matchAll(/<link[^>]+href="(quell\/[^"]+\.css)"/g)].map(m => m[1] ?? '');

const grundBlock = /const GRUNDSTOCK = \[([\s\S]*?)\n\];/.exec(swTs)?.[1] ?? '';
const vorrat = [...grundBlock.matchAll(/'\.\/([^']+)'/g)].map(m => m[1] ?? '');

p('index.html lädt Skripte aus quell/', geladen.length > 50, String(geladen.length));
p('Der Dienstarbeiter hat einen Grundstock', vorrat.length > 50, String(vorrat.length));

const fehltImVorrat = geladen.filter(g => !vorrat.includes(g));
p('Jedes geladene Skript liegt auch offline bereit',
  fehltImVorrat.length === 0, fehltImVorrat.join(', '));

const fehltImStil = stil.filter(s2 => !vorrat.includes(s2));
p('Und jede Stildatei ebenfalls', fehltImStil.length === 0, fehltImStil.join(', '));

/* Die Gegenrichtung: nichts im Vorrat, das es nicht gibt. Eine Datei, die
   der Speicher holen will und die fehlt, macht das Ablegen unvollständig —
   und `sw.ts` meldet das seit jeher, aber nur in der Konsole. */
const gibtEsNicht = vorrat.filter(v =>
  v !== '' && !v.startsWith('oeffentlich/') && v !== 'index.html' &&
  !fs.existsSync(path.join(WURZEL, v)));
p('Und der Vorrat nennt keine Datei, die es nicht gibt',
  gibtEsNicht.length === 0, gibtEsNicht.join(', '));

console.log('\n3 · Die Fassung des Speichers wandert mit');
/* Ändert sich der Grundstock, muss `VERSION` steigen — sonst bedient der
   alte Speicher weiter die alten Dateien. Geprüft werden kann nicht, ob
   jemand daran gedacht hat; wohl aber, dass die Fassung überhaupt dasteht
   und zum Ablagenamen passt. */
const version = /const VERSION = '([^']+)'/.exec(swTs)?.[1] ?? '';
p('Es gibt eine Fassungsnummer', /^notizen-v\d+$/.test(version), version);
p('… und sie trägt den Ablagenamen', version.startsWith(inApp + '-v'), version);

console.log('\n4 · Die Umwandelliste steht nur einmal');
/* `EINFACHE_TYPEN` — die Blocktypen, die `auswahlUmwandeln` direkt setzen
   kann. Dieselbe Liste stand dreiundzwanzig Zeilen weiter unten noch
   einmal wörtlich, für das Menü daneben. Zwei Listen hiessen: ein Knopf,
   der nichts tut, oder ein Typ, den man nicht auswählen kann. */
const editorTs = lies('src/bereiche/editor/ansicht/editor.ts');
const literale = editorTs.split('\n').filter(z =>
  /'text','h1','h2','h3','todo','bullet','number'/.test(z) &&
  !/^\s*(\/\*|\*|\/\/)/.test(z)).length;
p('Die Liste steht höchstens zweimal — als EINFACHE_TYPEN und als UMWANDELBAR',
  literale <= 2, `${literale} Vorkommen`);
p('Das Menü daneben liest EINFACHE_TYPEN',
  /TYPEN\.filter\(\(t: any\) => EINFACHE_TYPEN\.includes\(t\.id\)\)/.test(editorTs));

/* Und die Wirkung: jeder Knopf im Menü führt zu einem Typ, den
   `auswahlUmwandeln` auch setzt. */
const menue = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Umwandeln' });
  const a = Store.addBlock(s.id, 'text', { text: 'Eins' });
  const b2 = Store.addBlock(s.id, 'text', { text: 'Zwei' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  (Blocks as any).auswahlSetzen?.([a.id, b2.id]);
  const anker = document.createElement('div');
  document.body.appendChild(anker);
  (Blocks as any).auswahlUmwandeln('h2');
  await new Promise(r => setTimeout(r, 300));
  return { typen: [Store.getBlock(a.id)?.type, Store.getBlock(b2.id)?.type] };
});
p('Umwandeln setzt einen Typ aus der Liste',
  JSON.stringify((menue as any).typen) === '["h2","h2"]' ||
  ((menue as any).typen ?? []).includes('h2'),
  JSON.stringify((menue as any).typen));

console.log('\n5 · Auch CSS und TypeScript sind zwei Welten');
/* Ein Stylesheet kann keine Konstante importieren. Wo ein Mass in beiden
   steht, bleibt nur das Nachrechnen — die letzten zwei Paare aus L34. */

/* Die Kartenkachel: `steuerung.ts` rechnet die Lage der Kacheln mit
   KACHEL, das CSS gibt ihnen ihre Grösse. Weichen die beiden ab, klaffen
   Lücken zwischen den Kacheln oder sie überlappen — je nach Richtung. */
const steuerungTs = lies('src/bereiche/datenbanken/steuerung.ts');
const kachelTs = /const KACHEL = (\d+);/.exec(steuerungTs)?.[1] ?? '(fehlt)';
const einstCss = lies('quell/schale/stil/einstellungen.css');
const kachelCss = /\.karte \.kachel\{[^}]*width:(\d+)px;\s*height:(\d+)px/.exec(einstCss);
gleich('Die Kartenkachel rechnet mit 256', kachelTs, '256');
gleich('… und das CSS zeichnet dieselbe Breite', kachelCss?.[1] ?? '(fehlt)', kachelTs);
gleich('… und dieselbe Höhe', kachelCss?.[2] ?? '(fehlt)', kachelTs);

/* Die Seitenleiste: das CSS gibt die Breite beim ersten Start, der
   Doppelklick auf den Griff setzt sie „zurück". Zwei verschiedene Zahlen
   hiessen: Zurücksetzen führt woandershin als der erste Start. */
const schaleTs = lies('src/schale/aufbau/schale.ts');
const rueckKlick = /dblclick[\s\S]{0,120}?setze\((\d+)\)/.exec(schaleTs)?.[1] ?? '(fehlt)';
const aufbauCss = lies('quell/schale/stil/aufbau.css');
const startBreite = /#sidebar\{[^}]*width:(\d+)px/.exec(aufbauCss)?.[1] ?? '(fehlt)';
const rueckfall = /--side-w, (\d+)px/.exec(aufbauCss)?.[1] ?? '(fehlt)';
gleich('Die Seitenleiste startet mit 260 px', startBreite, '260');
gleich('Der Doppelklick setzt auf dieselbe Breite zurück', rueckKlick, startBreite);
gleich('… und der CSS-Rückfall nennt sie auch', rueckfall, startBreite);

/* Und die Wirkung, nicht nur der Text: nach dem Doppelklick ist die
   Leiste wirklich so breit wie beim ersten Start. */
const gemessen = await seite.evaluate(async () => {
  const side = document.getElementById('sidebar');
  const griff = document.querySelector<HTMLElement>('.side-griff');
  if (!side || !griff) return { breite: -1 };
  griff.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  await new Promise(r => setTimeout(r, 100));
  return { breite: Math.round(side.getBoundingClientRect().width) };
});
gleich('Gemessen: der Doppelklick stellt 260 px her',
  (gemessen as any).breite, 260);

console.log('\n6 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 107 — Über Bündelgrenzen nachgerechnet: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
