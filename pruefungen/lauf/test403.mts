/* Suite 403 — Der Schimmer über einer Antwort, die noch geschrieben wird (E408)
 * ============================================================================
 * Redur schickte eine React-Komponente („AnimatedShinyText", Magic UI, MIT).
 * Übernommen wurde die WIRKUNG, nicht der Code: keine React-Komponente,
 * keine Tailwind-Klassen, sondern sechs Zeilen CSS und zwei Zeilen im
 * KI-Dienst (§6, §2). Er sagt „hier kommt noch Text nach" und hört auf,
 * sobald der Strom endet — eine Auskunft, keine Zierde (§39).
 *
 * Die Gefahr dabei ist eine Datengefahr, keine Geschmacksfrage:
 * `background-clip:text` braucht DURCHSICHTIGE Schrift. Wo der Verlauf
 * nicht gemalt wird, stünde unsichtbarer Text — und im Fehlerzweig wäre es
 * die Fehlermeldung selbst, die der Nutzer nicht mehr lesen kann.
 *
 *   §1 Die durchsichtige Schrift steht NUR in einem `@supports`.
 *   §2 Der Schimmer bewegt sich wirklich — und verschluckt dabei in KEINEM
 *      Augenblick Text.
 *   §3 Bei `prefers-reduced-motion` steht er still, aber der Text ist DA.
 *   §4 Die Klasse verschwindet auch im FEHLERFALL — `finally`, nicht `try`.
 *   §5 Er benutzt nur Tokens, die es gibt (E406), und erfindet keine.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier Gegenproben sind wirklich gelaufen:
 *   §1 → die Zeile `-webkit-text-fill-color:transparent` aus dem `@supports`
 *        heraus vor den Block schreiben. → „Keine durchsichtige Schrift
 *        ausserhalb eines @supports", 18 von 20.
 *   §2 → `animation:` in `.ki-schreibt` streichen. → „Die Animation heisst
 *        ki-schimmer — none" und „0% 0% → 0% 0%", 17 von 20.
 *   §3 → den `@media(prefers-reduced-motion:reduce)`-Block streichen. → „Die
 *        Schrift ist NICHT durchsichtig — rgba(0, 0, 0, 0)", 17 von 20. Das
 *        ist die wichtigste der vier: ohne den Block ist der Text bei
 *        abgeschalteter Bewegung durchsichtig statt still.
 *   §4 → in `dienst.ts` ein `finally` durch eine Zeile hinter dem `catch`
 *        ersetzen. → „Beide stehen in einem finally — [false,true]", 18/20.
 *
 *   §2b → `background-repeat:no-repeat` wieder einsetzen. → „schlechtester
 *         Augenblick 87 Spalten, ohne Schimmer 295 — alle acht: 215 292 295
 *         91 87 295 291 245", 21 von 22.
 *
 * UND ZWEI PRÜFUNGEN, DIE BEIM ERSTEN MAL NICHT ROT WURDEN. Beide sind hier
 * aufgeschrieben, weil sie zusammen genau der Fehler aus §55.2 sind:
 *
 *   · §1 blieb unter seiner eigenen Gegenprobe grün. Der Auszug suchte das
 *     Wort „@supports" und fand es zuerst IM KOMMENTAR über der Regel,
 *     brace-matchte von dort bis zur `}` des echten Blocks und verschluckte
 *     dabei genau die Zeile, die er hätte finden sollen. Repariert wurde der
 *     Auszug (Kommentare zuerst weg), nicht die Behauptung.
 *
 *   · §2b mass zuerst EINEN Augenblick und blieb mit wieder eingesetztem
 *     `no-repeat` grün — der Verlauf stand gerade zufällig über der Zeile.
 *     Die Lücke wandert mit der Animation; also wird jetzt über einen ganzen
 *     Umlauf gemessen und der schlechteste Augenblick genommen.
 *
 * Und §2b selbst gibt es nur, weil ein BILD gemacht wurde (§55.3). Auf dem
 * ersten stand „Schimmer läuft — die A" und dann nichts mehr. Die vier
 * anderen Prüfungen waren dabei alle grün: die Animation lief, die Position
 * wanderte, das Token war echt — nur die halbe Antwort fehlte.
 *
 *   node pruefungen/lauf/test403.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9526;

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

const CSS = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf8');
const TS  = fs.readFileSync(path.join(WURZEL, 'src/bereiche/ki/dienst.ts'), 'utf8');

/* ==========================================================================
 * §1 · DURCHSICHTIGE SCHRIFT NUR DORT, WO SIE AUCH GEMALT WIRD
 * --------------------------------------------------------------------------
 * Gelesen wird die Datei, nicht der Browser: der Browser hier KANN
 * `background-clip:text`, und genau deshalb würde er den Fehler nicht
 * zeigen. Geprüft wird der Fall, den dieser Browser nie erlebt.
 * ========================================================================*/
console.log('\n§1 Durchsichtige Schrift nur im @supports');

/* Alle @supports-Blöcke heraustrennen, dann im REST suchen. Ein einfaches
   „steht hinter dem @supports" wäre keine Prüfung — es steht immer irgendwo
   dahinter.
 *
 * ZUERST DIE KOMMENTARE WEG, und das ist kein Schönheitsschritt. Ohne diesen
 * Strich fand der Auszug das Wort „@supports" IN DEM KOMMENTAR, der die Regel
 * erklärt, suchte von dort die nächste `{` — die des echten Blocks — und
 * verschluckte alles dazwischen. Die Gegenprobe zu §1 blieb dadurch grün,
 * obwohl die durchsichtige Schrift draussen stand. Gefunden nur, weil die
 * Gegenprobe wirklich gelaufen ist (§55.2). */
const ohneKommentar = CSS.replace(/\/\*[^]*?\*\//g, ' ');

const ohneSupports = (() => {
  let aus = '', i = 0;
  while (i < ohneKommentar.length) {
    const start = ohneKommentar.indexOf('@supports', i);
    if (start < 0) { aus += ohneKommentar.slice(i); break; }
    aus += ohneKommentar.slice(i, start);
    let tiefe = 0, j = ohneKommentar.indexOf('{', start);
    if (j < 0) { aus += ohneKommentar.slice(start); break; }
    for (; j < ohneKommentar.length; j++) {
      if (ohneKommentar[j] === '{') tiefe++;
      else if (ohneKommentar[j] === '}') { tiefe--; if (!tiefe) { j++; break; } }
    }
    i = j;
  }
  return aus;
})();

p('Der Auszug hat wirklich etwas entfernt',
  ohneSupports.length < ohneKommentar.length,
  `${ohneKommentar.length} → ${ohneSupports.length}`);
p('Und er hat nicht die halbe Datei mitgenommen',
  ohneSupports.length > ohneKommentar.length * 0.9,
  `${ohneKommentar.length} → ${ohneSupports.length}`);

const durchsichtigDraussen = ohneSupports
  .split('\n')
  .filter(z => /-webkit-text-fill-color\s*:\s*transparent/.test(z));
p('Keine durchsichtige Schrift ausserhalb eines @supports',
  durchsichtigDraussen.length === 0, durchsichtigDraussen.join(' | '));

const clipDraussen = ohneSupports
  .split('\n')
  .filter(z => /background-clip\s*:\s*text/.test(z));
p('Und auch kein background-clip:text ausserhalb', clipDraussen.length === 0,
  clipDraussen.join(' | '));

p('Innen steht beides', /-webkit-text-fill-color\s*:\s*transparent/.test(CSS) &&
  /background-clip\s*:\s*text/.test(CSS));

/* ==========================================================================
 * §2 · ER BEWEGT SICH WIRKLICH
 * ========================================================================*/
console.log('\n§2 Der Schimmer läuft');

const browser = await chromium.launch();
const fehler: string[] = [];
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2500);

const bau = `(() => {
  const d = document.createElement('div');
  d.id = 'schimmer-probe';
  d.className = 'ki-schreibt';
  d.textContent = 'Redion denkt gerade über deine Frage nach';
  d.style.cssText = 'position:fixed;left:20px;top:20px;font-size:15px;z-index:9';
  document.body.appendChild(d);
  return true;
})()`;
await seite.evaluate(bau);
await seite.waitForTimeout(120);

const lies = `(() => {
  const d = document.getElementById('schimmer-probe');
  const s = getComputedStyle(d);
  return { name: s.animationName, pos: s.backgroundPosition,
           fuell: s.webkitTextFillColor || s.getPropertyValue('-webkit-text-fill-color'),
           bild: s.backgroundImage.slice(0, 40) };
})()`;

const a = await seite.evaluate(lies) as any;
p('Die Animation heisst ki-schimmer', a.name === 'ki-schimmer', String(a.name));
p('Ein Verlauf ist da', /gradient/.test(String(a.bild)), String(a.bild));

await seite.waitForTimeout(420);
const b = await seite.evaluate(lies) as any;
/* Der gemessene Wert ist die LAUFENDE Position, nicht die geschriebene.
   Bleibt sie stehen, läuft die Animation nicht — das ist der ganze Punkt. */
p('Die Position hat sich nach 420 ms verschoben', a.pos !== b.pos,
  `${a.pos} → ${b.pos}`);

/* ------------------------------------------------------------------------
 * DER SCHIMMER DARF KEINEN TEXT VERSCHLUCKEN.
 *
 * Das hier stand nicht im Plan — es kam vom ersten BILD (§55.3). Da stand
 * „Schimmer läuft — die A" und dann nichts mehr: mit `background-repeat:
 * no-repeat` reicht der Verlauf nicht über die ganze Zeile, und wo nichts
 * gemalt wird, ist durchsichtige Schrift schlicht unsichtbar. Gemessen hat
 * das keine der vier anderen Prüfungen: die Animation lief, die Position
 * wanderte, das Token war echt — nur die halbe Antwort fehlte.
 *
 * Gemessen wird jetzt in Tinte: wie viele Spalten des Bildes überhaupt
 * etwas zeigen, mit Schimmer und ohne. Node hat keinen PNG-Leser und
 * bekommt auch keinen (§6) — also entziffert die Seite ihr eigenes Bild.
 * ----------------------------------------------------------------------*/
const spalten = async (): Promise<number> => {
  const roh = (await seite.locator('#schimmer-probe').screenshot()).toString('base64');
  return await seite.evaluate(`new Promise(fertig => {
    const bild = new Image();
    bild.onload = () => {
      const c = document.createElement('canvas');
      c.width = bild.width; c.height = bild.height;
      const g = c.getContext('2d');
      g.drawImage(bild, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const grund = [d[0], d[1], d[2]];
      let mitTinte = 0;
      for (let x = 0; x < c.width; x++) {
        let tinte = false;
        for (let y = 0; y < c.height && !tinte; y++) {
          const i = (y * c.width + x) * 4;
          if (Math.abs(d[i] - grund[0]) + Math.abs(d[i+1] - grund[1]) +
              Math.abs(d[i+2] - grund[2]) > 60) tinte = true;
        }
        if (tinte) mitTinte++;
      }
      fertig(mitTinte);
    };
    bild.onerror = () => fertig(-1);
    bild.src = 'data:image/png;base64,${roh}';
  })`) as number;
};

/* EIN ZEITPUNKT GENÜGT NICHT, und das war der zweite Fehler an dieser
   Prüfung: mit `no-repeat` wieder eingesetzt blieb sie grün, weil der
   Verlauf im gerade gemessenen Augenblick zufällig über der Zeile stand.
   Die Lücke wandert mit — also wird über einen ganzen Umlauf (1,7 s)
   gemessen und der SCHLECHTESTE Augenblick genommen. */
await seite.evaluate(`document.getElementById('schimmer-probe').className = ''`);
await seite.waitForTimeout(90);
const ohneSchimmer = await spalten();

await seite.evaluate(`document.getElementById('schimmer-probe').className = 'ki-schreibt'`);
const proben: number[] = [];
for (let i = 0; i < 8; i++) { await seite.waitForTimeout(220); proben.push(await spalten()); }
const mitSchimmer = Math.min(...proben);

p('Das Bild liess sich lesen', mitSchimmer > 0 && ohneSchimmer > 0,
  `${mitSchimmer} / ${ohneSchimmer}`);
p('Der Schimmer verschluckt in KEINEM Augenblick Text',
  mitSchimmer >= ohneSchimmer * 0.92,
  `schlechtester Augenblick ${mitSchimmer} Spalten, ohne Schimmer ${ohneSchimmer} — ` +
  `alle acht: ${proben.join(' ')}`);

/* ==========================================================================
 * §3 · OHNE BEWEGUNG STEHT ER STILL — ABER DER TEXT IST DA
 * --------------------------------------------------------------------------
 * Der gefährliche Fall. Wer nur „animation:none" setzt und die durchsichtige
 * Schrift stehen lässt, hat dem Nutzer die Antwort weggenommen.
 * ========================================================================*/
console.log('\n§3 Bewegung aus: still, aber lesbar');

const ruhig = await browser.newPage({ viewport: { width: 1360, height: 900 } });
await ruhig.emulateMedia({ reducedMotion: 'reduce' });
await ruhig.goto(`http://localhost:${PORT}/index.html`);
await ruhig.waitForTimeout(2500);
await ruhig.evaluate(bau);
await ruhig.waitForTimeout(120);

const r = await ruhig.evaluate(lies) as any;
p('Die Animation steht', r.name === 'none', String(r.name));

const durchsichtig = /transparent|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(String(r.fuell));
p('Die Schrift ist NICHT durchsichtig', !durchsichtig, String(r.fuell));

/* Und die Gegenprobe mit Augen statt mit Werten: sind Pixel da? */
const sichtbar = await ruhig.evaluate(`(() => {
  const d = document.getElementById('schimmer-probe');
  const r = d.getBoundingClientRect();
  return r.width > 40 && r.height > 8;
})()`);
p('Der Text nimmt Platz ein', sichtbar === true);

const schuss = await ruhig.locator('#schimmer-probe').screenshot();
/* Ein Bild aus lauter gleichen Pixeln heisst: da steht nichts. */
const bytes = new Set<number>();
for (let i = 0; i < schuss.length; i += 7) bytes.add(schuss[i] as number);
p('Und im Bild steht wirklich etwas', bytes.size > 20, `${bytes.size} Werte`);

await ruhig.close();

/* ==========================================================================
 * §4 · DIE KLASSE GEHT AUCH IM FEHLERFALL WIEDER WEG
 * ========================================================================*/
console.log('\n§4 finally, nicht try');

const setzt = (TS.match(/classList\.add\('ki-schreibt'\)/g) ?? []).length;
const nimmt = (TS.match(/classList\.remove\('ki-schreibt'\)/g) ?? []).length;
p('Der Schimmer wird zweimal gesetzt', setzt === 2, String(setzt));
p('Und genauso oft wieder genommen', nimmt === setzt, `${nimmt} zu ${setzt}`);

/* Jedes `remove` muss in einem `finally` stehen.
 *
 * WIE GEMESSEN WIRD, UND WARUM NICHT MEHR „ZWEI ZEILEN DAVOR" (E664).
 * Die erste Fassung sah zwei Zeilen zurück und suchte das Wort `finally`.
 * Das hielt, solange das `remove` die erste Zeile im Block war. In E652 kamen
 * `zustand.abbruch = null` und `sendenKnopf(false)` davor — dasselbe
 * `finally`, dieselbe Zusage, und der Lauf wurde rot:
 *
 *     ✗ Beide stehen in einem finally — [false,true]
 *
 * Der Code war richtig, das Fensterchen war zu klein. Ein Wächter, der an
 * der REIHENFOLGE innerhalb eines Blocks scheitert, prüft die Reihenfolge
 * und nicht den Block.
 *
 * Jetzt wird der umschliessende Block wirklich gesucht: von der Zeile aus
 * nach oben, Klammern zählend. Wo die Zählung negativ wird, steht der Kopf
 * des Blocks, in dem die Zeile liegt — und der muss `finally` heissen. */
const kopfDesBlocks = (alle: string[], i: number): string => {
  let tiefe = 0;
  for (let k = i; k >= 0; k--) {
    const z = alle[k] ?? '';
    /* Von unten nach oben: eine `}` betritt einen Block, eine `{` verlässt
       ihn. Die Zeile selbst zählt ab ihrem Anfang mit. */
    for (let c = z.length - 1; c >= 0; c--) {
      if (k === i && c >= z.indexOf('classList')) continue;
      const zeichen = z[c];
      if (zeichen === '}') tiefe++;
      else if (zeichen === '{') {
        if (tiefe === 0) return z;      /* das ist unser Blockkopf */
        tiefe--;
      }
    }
  }
  return '';
};

const imFinally = TS.split('\n').map((z, i, alle) => {
  if (!/classList\.remove\('ki-schreibt'\)/.test(z)) return null;
  return /finally/.test(kopfDesBlocks(alle, i));
}).filter(v => v !== null);
p('Beide stehen in einem finally', imFinally.length === 2 && imFinally.every(Boolean),
  JSON.stringify(imFinally));

/* Und der Fehlerzweig schreibt wirklich in dasselbe Feld — sonst wäre der
   ganze Punkt oben eine Behauptung über etwas, das es nicht gibt. */
p('Der Fehlerzweig schreibt in dasselbe Feld',
  /catch[^]{0,120}ziel\.textContent = '⚠/.test(TS));

/* ==========================================================================
 * §5 · NUR TOKENS, DIE ES GIBT (E406)
 * ========================================================================*/
console.log('\n§5 Keine erfundenen Tokens');

const hell = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/hell.css'), 'utf8');
const dunkel = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/dunkel.css'), 'utf8');
const bau2 = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf8');

const regelBlock = (() => {
  const i = bau2.indexOf('.ki-schreibt{');
  const j = bau2.indexOf('}', i);
  return i < 0 ? '' : bau2.slice(i, j);
})();
p('Der Block ist da', regelBlock.length > 40);

const benutzt = [...regelBlock.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map(m => m[1]!);
p('Er benutzt überhaupt Tokens', benutzt.length >= 2, benutzt.join(' '));

const erfunden = benutzt.filter(t =>
  !new RegExp('\\' + t + '\\s*:').test(hell) && !new RegExp('\\' + t + '\\s*:').test(dunkel));
p('Und jedes davon ist in hell.css oder dunkel.css definiert',
  erfunden.length === 0, erfunden.join(' '));

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
