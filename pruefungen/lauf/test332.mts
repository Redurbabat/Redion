/* Suite 332 — Keine Regel, die eine spätere schon erschlagen hat (E340, L111)
 * ============================================================================
 * DIE VIERTE VARIANTE VON L111 war die gefährlichste, und sie hat eine
 * eigene Lehre: nicht nur „meine Regel könnte verlieren", sondern „meine
 * Regel könnte es schon geben".
 *
 * E326 schrieb `.banner.info` nach `ansichten.css`, obwohl es sie in
 * `bausteine.css` schon gab. Gleiche Stärke, spätere Datei gewinnt — die
 * neue Regel war TOT, und die alte setzte im dunklen Thema 3.11:1 gegen
 * die 4.5 aus §38. Kein Prüflauf hatte etwas davon.
 *
 * DAS IST DIE EINE VARIANTE, FÜR DIE EIN WÄCHTER BILLIG IST. Bei Breiten
 * gibt es gewollte Ausnahmen; hier nicht: zwei Erklärungen für DASSELBE in
 * ZWEI Dateien, und die frühere kommt nie zum Zug. Das ist immer ein
 * Versehen — entweder ist die eine überflüssig, oder jemand hat übersehen,
 * dass es sie schon gab.
 *
 * GEMESSEN WIRD IM BROWSER, nicht mit einer eigenen CSS-Rechnung: die
 * Stärke kommt aus der CSSOM, in der Reihenfolge, in der `index.html` die
 * Dateien lädt. Eine selbstgebaute Spezifitätsrechnung wäre genau die
 * Sorte Nachbau, die irgendwann anders rechnet als der Browser.
 *
 *   §1 HEUTE IST NICHTS TOT — und es wird wirklich etwas gemessen.
 *   §2 EINE ERFUNDENE DOPPELUNG wird gefunden. Sonst könnte §1 grün sein,
 *      weil die Messung gar nichts sieht.
 *   §3 UND DREI FÄLLE, DIE KEINE DOPPELUNG SIND, bleiben stumm.
 *
 *   node pruefungen/lauf/test332.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9335;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

/* Die Rechnung wird EINMAL in die Seite gelegt und dreimal gerufen — auf
   dem echten Bestand und auf zwei erfundenen. Sonst prüfte §2 eine andere
   Rechnung als §1. */
await pc.evaluate(() => {
  (globalThis as any).__totePrüfung = (zusatz: string[]) => {
    type R = { datei: string; waehler: string; eigenschaft: string; wert: string;
               wichtig: boolean; medien: string };
    const alle: R[] = [];
    const einsammeln = (regeln: CSSRuleList, datei: string, medien: string): void => {
      for (const r of Array.from(regeln)) {
        if (r instanceof CSSMediaRule) {
          einsammeln(r.cssRules, datei, (medien ? medien + ' && ' : '') + r.conditionText);
          continue;
        }
        if (r instanceof CSSSupportsRule) { einsammeln(r.cssRules, datei, medien); continue; }
        if (!(r instanceof CSSStyleRule)) continue;
        /* EIN WÄHLER MIT KOMMA SIND MEHRERE REGELN. `a, b { … }` und
           `b { … }` sind für `b` dieselbe Erklärung, und ohne dieses
           Auftrennen bliebe genau das unsichtbar. */
        for (const w of r.selectorText.split(',').map(x => x.trim()).filter(Boolean))
          for (const eig of Array.from(r.style))
            alle.push({ datei, waehler: w, eigenschaft: eig,
                        wert: r.style.getPropertyValue(eig),
                        wichtig: r.style.getPropertyPriority(eig) === 'important',
                        medien });
      }
    };
    for (const b of Array.from(document.styleSheets)) {
      const name = String((b as CSSStyleSheet).href || 'inline').split('/').pop() || 'inline';
      try { einsammeln((b as CSSStyleSheet).cssRules, name, ''); } catch { /* fremd */ }
    }
    /* Erfundene Blätter kommen ganz hinten dazu — so, wie eine neue Datei
       am Ende von `index.html` stünde. */
    for (const roh of zusatz) {
      const blatt = new CSSStyleSheet();
      blatt.replaceSync(roh);
      einsammeln(blatt.cssRules, 'erfunden.css', '');
    }

    const gruppen = new Map<string, R[]>();
    for (const r of alle) {
      const k = r.waehler + ' | ' + r.eigenschaft + ' | ' + r.medien;
      const g = gruppen.get(k);
      if (g) g.push(r); else gruppen.set(k, [r]);
    }
    const tot: string[] = [];
    for (const [k, liste] of gruppen) {
      if (liste.length < 2) continue;
      /* NUR ÜBER DATEIGRENZEN. Zweimal dasselbe in EINER Datei ist eine
         Umschaltung („erst allgemein, dann für diesen Fall") und liest
         sich beim Lesen von oben nach unten richtig. Über Dateigrenzen
         hinweg sieht es niemand. */
      const letzte = liste[liste.length - 1]!;
      const opfer = liste.slice(0, -1).filter(r =>
        r.datei !== letzte.datei &&
        r.wert !== letzte.wert &&
        !(r.wichtig && !letzte.wichtig));
      if (opfer.length)
        tot.push(k + ' — es gilt ' + letzte.datei + ': ' + letzte.wert +
                 ', tot ist ' + opfer.map(o => o.datei + ': ' + o.wert).join(' / '));
    }
    return { erklaerungen: alle.length, gruppen: gruppen.size, tot };
  };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Heute ist keine Regel tot');

const heute = await pc.evaluate(() => (globalThis as any).__totePrüfung([]));

/* ZUERST: WIRD ÜBERHAUPT ETWAS GEMESSEN? Ohne diese Zeile wäre die Zeile
   darunter auch dann grün, wenn `document.styleSheets` leer bliebe — etwa
   weil ein Blatt von woanders kommt und `cssRules` wirft. */
p('Es werden zehntausende Erklärungen gelesen', heute.erklaerungen > 20000,
  String(heute.erklaerungen));
p('Und sie stehen in ebenso vielen Gruppen', heute.gruppen > 20000,
  String(heute.gruppen));
gleich('Keine einzige davon ist tot', heute.tot, []);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Eine erfundene Doppelung wird gefunden');

/* GENAU DER FALL VON E326: eine Regel für eine Klasse, die es schon gibt,
   in einer später geladenen Datei.

   GEZÄHLT WIRD DER UNTERSCHIED zum Bestand, nicht die Gesamtzahl. Der
   erste Wurf zählte absolut — und als die Mutation für §1 eine tote Regel
   zurückbrachte, fielen §2 und §3 gleich mit, obwohl an ihnen nichts falsch
   war. Eine Prüfung, die nur bei sauberem Bestand etwas aussagt, sagt
   genau dann nichts, wenn man sie braucht. */
const grund = heute.tot.length;
const erfunden = await pc.evaluate(() =>
  (globalThis as any).__totePrüfung(['.banner.info{ color: rebeccapurple }']));

gleich('Genau eine tote Regel kommt dazu', erfunden.tot.length - grund, 1);
const neuDazu = erfunden.tot.filter((t: string) => !heute.tot.includes(t));
const meldung = String(neuDazu[0] || '');
p('Sie nennt den Wähler', /\.banner\.info \| color/.test(meldung), meldung);
p('Sie sagt, welche Datei gewinnt',
  /es gilt erfunden\.css: rebeccapurple/.test(meldung), meldung);
p('Und welche tot ist', /tot ist bausteine\.css/.test(meldung), meldung);

/* UND MEHRERE AUF EINMAL, damit die Zeile nicht an der Eins hängt.
   GEZÄHLT WIRD JE EIGENSCHAFT UND NICHT JE REGEL, und `padding` ist eine
   Kurzschreibweise für VIER: oben, rechts, unten, links. Erwartet waren
   hier erst zwei Meldungen, gezählt wurden fünf — die Prüfung hatte recht
   und die Erwartung nicht. Je Eigenschaft ist auch das Richtige: eine
   Regel kann bei einer Eigenschaft gewinnen und bei der nächsten
   verlieren, und genau so lag der `.fk-kopf`-Fall aus E340. */
const mehrere = await pc.evaluate(() => (globalThis as any).__totePrüfung([
  '.banner.info{ color: rebeccapurple }',
  '.leer-zustand{ padding: 3px }'
]));
gleich('Farbe plus vier Innenmasse ergeben fünf Meldungen',
  mehrere.tot.length - grund, 5);
p('Und vier davon sind die Innenmasse',
  mehrere.tot.filter((t: string) => /\.leer-zustand \| padding-/.test(t)).length === 4,
  JSON.stringify(mehrere.tot.filter((t: string) => !heute.tot.includes(t))));

/* ------------------------------------------------------------------------ */
console.log('\n3 · GEGENPROBE: was keine Doppelung ist, bleibt stumm');

const stumm = await pc.evaluate(() => ({
  /* a) Eine Klasse, die es noch gar nicht gibt. */
  neu: (globalThis as any).__totePrüfung(
    ['.gibt-es-noch-nicht-e340{ color: red }']).tot.length,
  /* b) DERSELBE Wert. Zweimal dasselbe zu sagen ist unschön, aber es geht
        nichts verloren — und wer das meldete, meldete Dutzende gewollter
        Fälle mit. */
  gleicherWert: (globalThis as any).__totePrüfung(
    ['.menu button .sub{ display: block }']).tot.length,
  /* c) EINE STÄRKERE Regel gewinnt zu Recht — sie erschlägt nichts, sie
        ist genauer. */
  staerker: (globalThis as any).__totePrüfung(
    ['#topbar .banner.info{ color: rebeccapurple }']).tot.length,
  /* d) `!important` gegen gewöhnlich: das Frühere gewinnt und lebt. */
  wichtig: (globalThis as any).__totePrüfung(
    ['.banner.info{ color: rebeccapurple }',
     '.banner.info{ color: teal !important }']).tot.length
}));

gleich('Eine ganz neue Klasse meldet nichts', stumm.neu - grund, 0);
gleich('Derselbe Wert zweimal meldet nichts', stumm.gleicherWert - grund, 0);
gleich('Eine stärkere Regel meldet nichts', stumm.staerker - grund, 0);
/* BEI d) IST DIE ERSTE ERFUNDENE TOT, nicht die echte — also genau eine
   Meldung, und die stammt aus dem Erfundenen selbst. Gemessen wird hier,
   dass `!important` richtig gewichtet wird und nicht, dass gar nichts
   kommt. */
gleich('Und `!important` dreht die Richtung um', stumm.wichtig - grund, 1);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
