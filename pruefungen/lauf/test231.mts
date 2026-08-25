/* Suite 197 — Öffentlich, ohne dass Privates mitgeht (L31, E177)
 * ============================================================================
 * L31 nennt fünf Dinge: Demo-Modus · robots.txt · sitemap.xml · ai.txt ·
 * Export als statische Seite — und darüber die eigentliche Bedingung: keine
 * privaten Daten für Crawler.
 *
 * Der Export als statische Seite gibt es seit Langem (`Werkzeuge.htmlExport`).
 * Die vier Dateien und der Vorführmodus sind neu, und die Bedingung wird
 * hier GEMESSEN statt behauptet: was ein Crawler abruft, ist die App — und
 * die App enthält keine Notiz, weil die Notizen im Browser liegen.
 *
 * DER TEURE FALL IST DER VORFÜHRMODUS. Eine zweite Ablage neben der echten
 * ist genau dann eine gute Idee, wenn sie WIRKLICH getrennt ist. §3 legt
 * deshalb in beiden etwas ab und sieht in beiden nach.
 *
 *   node pruefungen/lauf/test231.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8988;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.txt': 'text/plain', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
/* Der Server legt `oeffentlich/` über die Wurzel — genau wie Cloudflare
   Pages es tut. Sonst prüfte diese Suite Pfade, die es im Netz nicht gibt. */
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const rel = rein === '/' ? 'index.html' : rein.slice(1);
  let pfad = path.join(WURZEL, 'oeffentlich', rel);
  if (!fs.existsSync(pfad) || fs.statSync(pfad).isDirectory())
    pfad = path.join(WURZEL, rel);
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const hole = async (weg2: string): Promise<{ status: number; text: string }> =>
  new Promise(fertig => {
    http.get(`http://localhost:${PORT}${weg2}`, res => {
      let s = '';
      res.on('data', c => { s += c; });
      res.on('end', () => fertig({ status: res.statusCode || 0, text: s }));
    }).on('error', () => fertig({ status: 0, text: '' }));
  });

/* ==========================================================================
 * §1 · Die vier Dateien gibt es, und ein Crawler bekommt sie
 * ========================================================================*/
console.log('\n1 · Die vier Dateien');

const robots = await hole('/robots.txt');
gleich('robots.txt wird ausgeliefert', robots.status, 200);
p('Sie erlaubt die App', /Allow: \/\$/.test(robots.text));
p('Und sperrt den Quelltext aus', /Disallow: \/quell\//.test(robots.text));
p('Und die Prüfläufe', /Disallow: \/pruefungen\//.test(robots.text));
p('Und sie nennt die Sitemap', /Sitemap: \/sitemap\.xml/.test(robots.text));

const ai = await hole('/ai.txt');
gleich('ai.txt wird ausgeliefert', ai.status, 200);
p('Sie sagt etwas über veröffentlichte Seiten', /Disallow: \/p\//.test(ai.text));

const sitemap = await hole('/sitemap.xml');
gleich('sitemap.xml wird ausgeliefert', sitemap.status, 200);
p('Und ist gültiges XML mit einem urlset',
  /^<\?xml/.test(sitemap.text.trim()) && /<urlset[\s>]/.test(sitemap.text));
p('Mit genau einer Adresse — mehr gibt es ohne Server nicht',
  (sitemap.text.match(/<loc>/g) || []).length === 1,
  String((sitemap.text.match(/<loc>/g) || []).length));

/* ==========================================================================
 * §2 · Und was der Crawler ABRUFT, enthält keine Notiz
 * --------------------------------------------------------------------------
 * Das ist die Bedingung, unter der L31 überhaupt steht. Gemessen wird sie
 * am ausgelieferten Text — nicht daran, dass „die Daten ja im Browser
 * liegen". Ein `<script>`, das eine Beispielnotiz einbettet, wäre genau der
 * Fehler, den niemand bemerkt.
 * ========================================================================*/
console.log('\n2 · Und der Abruf enthält keine Notiz');

const seiteRoh = await hole('/');
gleich('Die App wird ausgeliefert', seiteRoh.status, 200);
p('Sie ist eine leere Hülle: kein Blocktext im HTML',
  !/class="blk"/.test(seiteRoh.text), 'ein gezeichneter Block im ausgelieferten HTML');
p('Und kein Notizinhalt aus der Erstbefüllung',
  !/Ollama installieren|Eigene Seite anlegen/.test(seiteRoh.text),
  'Starterinhalt steht im HTML');

const versteckt = await hole('/pruefungen/lauf/test231.mts');
p('Was robots.txt aussperrt, gibt es trotzdem — die Datei ist keine Sperre',
  versteckt.status === 200,
  'robots.txt ist eine Bitte, kein Schloss; das gehört gewusst');

/* ==========================================================================
 * §3 · Der Vorführmodus liegt WIRKLICH woanders
 * --------------------------------------------------------------------------
 * DER TEURE PUNKT. Eine Vorführung, die in die echten Notizen schreibt,
 * wäre schlimmer als gar keine.
 * ========================================================================*/
console.log('\n3 · Der Vorführmodus liegt wirklich woanders');

const browser = await chromium.launch();
/* EIN KONTEXT, ZWEI SEITEN — und das ist hier kein Detail.
   `browser.newPage()` legt jedes Mal einen EIGENEN Kontext an, und ein
   eigener Kontext hat eine eigene IndexedDB. Die erste Fassung dieser Suite
   mass damit Playwrights Trennung und nicht Redions: die Gegenprobe (beide
   Ablagen gleich benannt) liess „Die eigene Seite ist dort NICHT zu sehen"
   grün stehen, weil die Seiten sich ohnehin nicht sahen. Ein Punkt, der
   nicht rot werden kann, ist keiner (§55.2). */
const kontext = await browser.newContext();
const echt = await kontext.newPage();
const fehler: string[] = [];
echt.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await echt.goto(`http://localhost:${PORT}/index.html`);
await echt.waitForTimeout(2400);
const echtName = await echt.evaluate(async () => {
  const s = Store.addPage(null, { text: 'GEHEIME EIGENE SEITE' });
  await Store.flush();
  const namen = (await (indexedDB as any).databases()).map((d: any) => d.name);
  return { seite: s.id, namen, demo: Store.istDemo() };
});
p('Ohne `?demo` ist es die gewöhnliche Ablage', !echtName.demo);
p('Und sie heisst „notizen"', echtName.namen.includes('notizen'),
  JSON.stringify(echtName.namen));

const demo = await kontext.newPage();
demo.on('pageerror', e => fehler.push('PAGEERROR(demo): ' + e.message.slice(0, 120)));
await demo.goto(`http://localhost:${PORT}/index.html?demo`);
await demo.waitForTimeout(2600);
const demoStand = await demo.evaluate(async () => {
  const namen = (await (indexedDB as any).databases()).map((d: any) => d.name);
  const titel = Object.values(Store.cache.blocks as any)
    .filter((b: any) => b.type === 'page' && b.alive).map((b: any) => b.text);
  return { demo: Store.istDemo(), namen, titel,
           balken: !!document.getElementById('demo-balken'),
           balkenText: (document.getElementById('demo-balken') || {} as any).textContent || '' };
});

p('Mit `?demo` sagt die Ablage, dass sie eine Vorführung ist', demoStand.demo);
p('Es gibt eine zweite Datenbank „notizen-demo"',
  demoStand.namen.includes('notizen-demo'), JSON.stringify(demoStand.namen));
p('Die eigene Seite ist dort NICHT zu sehen',
  !demoStand.titel.some((t: string) => /GEHEIME EIGENE SEITE/.test(t)),
  JSON.stringify(demoStand.titel).slice(0, 200));
p('Aber es steht etwas darin — eine leere Vorführung wäre keine',
  demoStand.titel.length > 0, JSON.stringify(demoStand.titel).slice(0, 200));

console.log('\n3a · Und man sieht, dass man vorführt');
p('Ein Balken steht da', demoStand.balken);
p('Er sagt das Wort „Vorführung"', /Vorführung/.test(demoStand.balkenText),
  demoStand.balkenText.slice(0, 120));
p('Und er nennt den Weg zurück', /Zu deinen Notizen/.test(demoStand.balkenText),
  demoStand.balkenText.slice(0, 160));

/* UND MAN KANN IHN LESEN (§38). Der erste Anlauf schrieb Weiss auf das
   Orange — gemessen 2,6:1, also unter den 4,5:1 für gewöhnlichen Text. Auf
   dem Bildschirm sah es genau danach aus; keine Prüfung hätte es gesagt,
   weil „ein Balken steht da" davon nichts weiss. */
const kontrast = await demo.evaluate(() => {
  const b = document.getElementById('demo-balken')!;
  const s = getComputedStyle(b);
  const kanal = (c: string) => {
    const n = Number(c) / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const leucht = (farbe: string) => {
    const m = farbe.match(/\d+/g) || ['0', '0', '0'];
    return 0.2126 * kanal(m[0]!) + 0.7152 * kanal(m[1]!) + 0.0722 * kanal(m[2]!);
  };
  const a2 = leucht(s.color), b2 = leucht(s.backgroundColor);
  return { verhaeltnis: (Math.max(a2, b2) + 0.05) / (Math.min(a2, b2) + 0.05),
           farbe: s.color, grund: s.backgroundColor,
           position: s.position, hoehe: b.getBoundingClientRect().height,
           bodyOben: getComputedStyle(document.body).paddingTop };
});
p('Und man kann ihn lesen — mindestens 4,5:1 (§38)',
  kontrast.verhaeltnis >= 4.5,
  kontrast.farbe + ' auf ' + kontrast.grund + ' = ' +
  kontrast.verhaeltnis.toFixed(2) + ':1');

/* Und er deckt die App nicht zu: `body` bekommt genau seine Höhe als
   Abstand. `position:sticky` machte ihn zur Flex-SPALTE über die volle
   Höhe — der halbe Bildschirm war orange (§55, mit Augen gesehen). */
gleich('Er steht fest oben, nicht als Spalte daneben', kontrast.position, 'fixed');
p('Und die App beginnt genau darunter',
  Math.abs(parseFloat(kontrast.bodyOben) - kontrast.hoehe) < 2,
  kontrast.bodyOben + ' gegen ' + kontrast.hoehe.toFixed(1) + 'px');

console.log('\n3b · Und die Gegenrichtung: die echte Ablage merkt nichts');
const echtNachher = await echt.evaluate(async () => {
  await new Promise(r => setTimeout(r, 200));
  return {
    seiteDa: Object.values(Store.cache.blocks as any)
      .some((b: any) => b.text === 'GEHEIME EIGENE SEITE'),
    balken: !!document.getElementById('demo-balken')
  };
});
p('Die eigene Seite steht noch da', echtNachher.seiteDa);
p('Und im eigenen Fenster ist kein Vorführbalken', !echtNachher.balken);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
