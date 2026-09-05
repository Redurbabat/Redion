/* Suite 399 — Die Denkkugel (E403)
 * ============================================================================
 * Neun Zustände statt eines Dreh-Rädchens. Der Kern unter `core/orb/` ist
 * reine Rechnung: (Zustand, Grösse, Zeit) hinein, Punkte und Linien heraus.
 * Genau deshalb ist er mit Zahlen prüfbar und nicht nur mit Augen.
 *
 *   §1 Alle neun Zustände liefern ein Bild, und jeder hat ein deutsches Wort.
 *   §2 Dieselbe Zeit ergibt dasselbe Bild — kein Zufall im Kern.
 *   §3 Jeder Zustand BEWEGT sich. Ein Wartezeichen, das steht, ist kaputt.
 *   §4 Die neun sind VONEINANDER UNTERSCHEIDBAR.
 *   §5 Kein Punkt liegt ausserhalb seines Canvas.
 *   §6 Die Punkte kommen nach Tiefe sortiert — hinten zuerst.
 *   §7 Die Kugel hängt sich ein, trägt ihren Zustand als Text und lässt sich
 *      wieder anhalten, ohne ein rechnendes Canvas zurückzulassen.
 *   §8 Bei `prefers-reduced-motion` steht sie still — aber sie ist DA.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §4 WAR rot, beim allerersten Lauf: searching/solving standen bei 2,1 px,
 * searching/weaving bei 2,2, solving/weaving bei 2,3 — drei Punktkugeln, die
 * dasselbe zeigten. Genau das hatte das Bild vorher schon gesagt; die
 * Messung hat es bestätigt und beziffert. Repariert wurde daraufhin der
 * CODE (breitere Bandspalten, zweilappige Stränge, dünnere Suchkugel), nicht
 * die Schwelle.
 *
 * GEGENPROBE, wirklich gelaufen:
 *   §4 → in `shaping` ein `return breathing(size, t);` voranstellen.
 *        Ergebnis: „breathing/shaping = 0", 21 von 22.
 *   §3 → in `breathing` ALLE VIER Zeit-Abhängigkeiten wegnehmen (`atem`,
 *        das Oval, das Rauschen UND die `depth`-Zeile). Ergebnis:
 *        „Kein Zustand ist bei zwei Zeiten identisch — ist [breathing]".
 *
 * Und eine Gegenprobe, die NICHT rot wurde und deshalb hier steht: nur das
 * Oval in `breathing` auf 0 zu setzen, genügt §4 nicht. Die beiden bleiben
 * über ihre Punktgrösse und ihren Durchmesser unterscheidbar. Wer §4 traut,
 * soll wissen, was es misst — Lage UND Grösse, nicht Gestalt.
 *
 *   node pruefungen/lauf/test399.mts
 * ==========================================================================*/
declare const OrbModes: any; declare const Orb: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9431;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);

/* ==========================================================================
 * §1 · NEUN ZUSTÄNDE, JEDER MIT EINEM BILD UND EINEM WORT
 * ========================================================================*/
console.log('\n§1 Neun Zustände');

const zustaende = await seite.evaluate(`OrbModes.ORB_STATES.slice()`) as string[];
gleich('Es sind genau neun', zustaende.length, 9);
gleich('Und zwar diese', zustaende, ['working', 'searching', 'solving', 'listening',
  'connecting', 'weaving', 'composing', 'breathing', 'shaping']);

const woerter = await seite.evaluate(
  `OrbModes.ORB_STATES.map(s => OrbModes.ORB_TEXTE[s])`) as string[];
p('Jeder trägt ein deutsches Wort', woerter.every(w => !!w && /^[a-zäöü]/.test(w)),
  woerter.join(' · '));
p('Die Wörter sind verschieden', new Set(woerter).size === 9, woerter.join(' · '));

const punkte = await seite.evaluate(
  `OrbModes.ORB_STATES.map(s => { const f = OrbModes.orbFrame(s, 64, 1.7);
     return f.dots.length + f.lines.length; })`) as number[];
/* Zehn, nicht zwanzig: `connecting` ist ein Netz aus elf Knoten, und seine
   Kanten kommen erst nach und nach dazu. Die Frage lautet „zeichnet er
   überhaupt etwas", nicht „zeichnet er viel". */
p('Jeder Zustand zeichnet wenigstens zehn Marken', punkte.every(n => n >= 10),
  JSON.stringify(punkte));

p('Ein unbekannter Zustand fällt auf „working" zurück, statt zu werfen',
  await seite.evaluate(`(() => {
    const a = JSON.stringify(OrbModes.orbFrame('gibtesnicht', 64, 1.7));
    const b = JSON.stringify(OrbModes.orbFrame('working', 64, 1.7));
    return a === b;
  })()`));

/* ==========================================================================
 * §2 · DERSELBE ZEITPUNKT ERGIBT DASSELBE BILD
 * --------------------------------------------------------------------------
 * Ohne diesen Punkt wäre alles Folgende wertlos: was sich bei jedem Aufruf
 * ändert, kann man nicht mit Zahlen prüfen. Deshalb steht im Kern kein
 * `Math.random()`, sondern ein fester Hash.
 * ========================================================================*/
console.log('\n§2 Kein Zufall im Kern');

p('Zweimal dieselbe Zeit, zweimal dasselbe Bild', await seite.evaluate(`(() =>
  OrbModes.ORB_STATES.every(s =>
    JSON.stringify(OrbModes.orbFrame(s, 64, 3.25)) ===
    JSON.stringify(OrbModes.orbFrame(s, 64, 3.25))))()`));

/* ==========================================================================
 * §3 · JEDER ZUSTAND BEWEGT SICH
 * ========================================================================*/
console.log('\n§3 Nichts steht still');

const bewegt = await seite.evaluate(`(() =>
  OrbModes.ORB_STATES.filter(s =>
    JSON.stringify(OrbModes.orbFrame(s, 64, 0.4)) ===
    JSON.stringify(OrbModes.orbFrame(s, 64, 2.9))))()`) as string[];
gleich('Kein Zustand ist bei zwei Zeiten identisch', bewegt, []);

/* ==========================================================================
 * §4 · DIE NEUN SIND VONEINANDER ZU UNTERSCHEIDEN
 * --------------------------------------------------------------------------
 * DER PUNKT, FÜR DEN ES DIESE SUITE GIBT. Auf dem ersten Bild waren
 * `breathing` und `shaping` beide ein gepunkteter Kreis — beide „richtig",
 * beide bewegt, beide fest — und trotzdem war einer von ihnen umsonst.
 *
 * Gemessen wird der mittlere Abstand der Umrisse: für jeden Punkt des einen
 * Bildes der nächste Punkt des anderen. Ein Wert nahe 0 heisst „dasselbe
 * Bild". Die Schwelle ist 2,5 px auf 64 px — beim Paar breathing/shaping
 * war sie vor der Reparatur 0,9.
 * ========================================================================*/
console.log('\n§4 Neun verschiedene Bilder');

const naehe = await seite.evaluate(`(() => {
  const abstand = (A, B) => {
    let summe = 0;
    for (const a of A.dots) {
      let best = Infinity;
      for (const b of B.dots) {
        /* Die GRÖSSE zählt mit. Ohne sie mass diese Prüfung weniger als das
           Auge: zwei Punktwolken in derselben Scheibe haben immer kleine
           Nachbarabstände, auch wenn die eine grob und die andere fein ist —
           und genau daran waren searching und solving nicht zu
           unterscheiden. Der Faktor 4 gewichtet einen Pixel Grössenunterschied
           wie vier Pixel Lageunterschied. */
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.r - b.r) * 4) ** 2;
        if (d < best) best = d;
      }
      summe += Math.sqrt(best);
    }
    return summe / Math.max(1, A.dots.length);
  };
  const paare = [];
  const S = OrbModes.ORB_STATES;
  for (let i = 0; i < S.length; i++) {
    for (let j = i + 1; j < S.length; j++) {
      /* Über mehrere Zeiten mitteln: zwei Arten dürfen sich in EINEM
         Augenblick zufällig gleichen, aber nicht in vieren. */
      let m = 0;
      for (const t of [0.6, 1.9, 3.4, 5.1]) {
        const A = OrbModes.orbFrame(S[i], 64, t), B = OrbModes.orbFrame(S[j], 64, t);
        m += (abstand(A, B) + abstand(B, A)) / 2;
      }
      paare.push({ paar: S[i] + '/' + S[j], d: Math.round(m / 4 * 10) / 10 });
    }
  }
  paare.sort((a, b) => a.d - b.d);
  return paare;
})()`) as Array<{ paar: string; d: number }>;

const zuNah = naehe.filter(x => x.d < 2.5);
gleich('Kein Paar liegt unter 2,5 px Abstand', zuNah.map(x => x.paar + ' = ' + x.d), []);
console.log('    engstes Paar: ' + (naehe[0] ? naehe[0].paar + ' = ' + naehe[0].d + ' px' : '—'));

/* ==========================================================================
 * §5 · NICHTS RAGT AUS DEM CANVAS
 * ========================================================================*/
console.log('\n§5 Alles bleibt im Bild');

const raus = await seite.evaluate(`(() => {
  const schlecht = [];
  for (const s of OrbModes.ORB_STATES) {
    for (const g of [20, 64]) {
      for (const t of [0.3, 1.4, 2.8, 4.6, 7.2]) {
        const f = OrbModes.orbFrame(s, g, t);
        for (const d of f.dots) {
          if (d.x - d.r < -0.5 || d.y - d.r < -0.5 ||
              d.x + d.r > g + 0.5 || d.y + d.r > g + 0.5) {
            schlecht.push(s + '@' + g); break;
          }
        }
      }
    }
  }
  return [...new Set(schlecht)];
})()`) as string[];
gleich('Kein Punkt ragt über den Rand', raus, []);

/* ==========================================================================
 * §6 · NACH TIEFE SORTIERT
 * --------------------------------------------------------------------------
 * Das gehört in den Kern und nicht in den Maler: sonst muss jeder Maler es
 * wiederholen, und der erste, der es vergisst, zeichnet die Rückseite über
 * die Vorderseite.
 * ========================================================================*/
console.log('\n§6 Hinten zuerst');

p('Die Punkte kommen von hinten nach vorn', await seite.evaluate(`(() =>
  OrbModes.ORB_STATES.every(s => {
    const d = OrbModes.orbFrame(s, 64, 2.2).dots;
    return d.every((x, i) => i === 0 || d[i - 1].depth <= x.depth);
  }))()`));

/* ==========================================================================
 * §7 · EINHÄNGEN, BESCHRIFTEN, ANHALTEN
 * ========================================================================*/
console.log('\n§7 Die Kugel in der Oberfläche');

const griff = await seite.evaluate(`(() => {
  const w = document.createElement('div');
  w.id = 'orb-probe';
  document.body.appendChild(w);
  window.__orb = Orb.setzen(w, 'searching', 64);
  const c = w.querySelector('canvas.orb');
  return {
    da: !!c,
    rolle: c && c.getAttribute('role'),
    marke: c && c.getAttribute('aria-label'),
    titel: c && c.title,
  };
})()`) as any;
p('Sie hängt sich als Canvas ein', griff.da === true);
gleich('Sie ist ein Bild für den Screenreader', griff.rolle, 'img');
p('Sie sagt in Worten, was sie zeigt (§38)', /sucht/.test(String(griff.marke)), String(griff.marke));
gleich('Der Titel sagt dasselbe', griff.titel, griff.marke);

await seite.waitForTimeout(300);
p('Sie hat wirklich gemalt', await seite.evaluate(`(() => {
  const c = document.querySelector('#orb-probe canvas.orb');
  if (!c) return false;
  const g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let sichtbar = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) sichtbar++;
  return sichtbar > 200;
})()`));

await seite.evaluate(`window.__orb.zustand('composing')`);
p('Der Zustand lässt sich wechseln, ohne neu zu bauen',
  /schreibt/.test(String(await seite.evaluate(
    `document.querySelector('#orb-probe canvas.orb').getAttribute('aria-label')`))));

await seite.evaluate(`window.__orb.stopp()`);
await seite.waitForTimeout(200);
p('Nach dem Anhalten ist kein Canvas mehr da',
  await seite.evaluate(`!document.querySelector('#orb-probe canvas.orb')`));
p('Zweimal anhalten wirft nicht',
  await seite.evaluate(`(() => { try { window.__orb.stopp(); return true; } catch (e) { return false; } })()`));

/* ==========================================================================
 * §8 · BEWEGUNG AUS HEISST STILL, NICHT LEER
 * --------------------------------------------------------------------------
 * Der naheliegende Fehler bei `prefers-reduced-motion` ist, gar nichts zu
 * zeichnen. Dann steht bei jedem, der Bewegung abgeschaltet hat, ein leeres
 * Loch, wo Redion sagen wollte, dass es arbeitet.
 * ========================================================================*/
console.log('\n§8 Bewegung aus');

const ruhig = await browser.newPage({ viewport: { width: 900, height: 600 },
  reducedMotion: 'reduce' });
ruhig.on('pageerror', e => fehler.push('PAGEERROR(ruhe): ' + e.message.slice(0, 160)));
await ruhig.goto(`http://localhost:${PORT}/index.html`);
await ruhig.waitForTimeout(2500);
const stand = await ruhig.evaluate(`(() => {
  const w = document.createElement('div');
  w.id = 'orb-ruhe';
  document.body.appendChild(w);
  Orb.setzen(w, 'working', 64);
  return true;
})()`);
p('Sie hängt sich auch bei Bewegung-aus ein', stand === true);
await ruhig.waitForTimeout(400);
p('Und sie hat ein Bild gemalt, statt leer zu bleiben', await ruhig.evaluate(`(() => {
  const c = document.querySelector('#orb-ruhe canvas.orb');
  if (!c) return false;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let sichtbar = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) sichtbar++;
  return sichtbar > 100;
})()`));
await ruhig.close();

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
