/* Suite 413 — Der Zeitstrahl füllt seine Fläche und sagt, wo man ist (E419)
 * ============================================================================
 * L130 Punkt 5 und 6, beide auf demselben Bild zu sehen (`db-timeline`):
 *
 *   5. DIE FLÄCHE BLEIBT LEER. `px` — Pixel je Tag — steht in `ZS_STUFEN`
 *      je Zoomstufe FEST: 42 am Tag, 15 in der Woche, 5 im Monat. Bei 65
 *      Tagen auf der Monatsstufe sind das 325 px gezeichnete Fläche in
 *      einem Behälter von rund 1500. Zwei Drittel bleiben weiss, und die
 *      Balken sind unnötig winzig — drei Tage fallen unter die
 *      Mindestbreite von 22 px und sind von EINEM Tag nicht zu
 *      unterscheiden.
 *
 *   6. DIE ACHSE HAT KEINE MARKE AM ANFANG. Auf dem Bild standen „Sept. 26"
 *      und „Okt. 26"; die Balken beginnen im August, und dieser Bereich
 *      trug keine Beschriftung. Der Grund ist nicht, dass die Marke fehlte,
 *      sondern dass sie an einer NEGATIVEN Stelle gezeichnet wurde:
 *      `lauf.setDate(1)` springt auf den Monatsersten, und der liegt vor
 *      `minD`. Die Marke war da, sie stand nur links ausserhalb.
 *
 *   §1 Die gezeichnete Fläche nutzt die Breite, die da ist.
 *   §2 Die Balken werden dadurch unterscheidbar.
 *   §3 Die erste Marke steht im Bild, nicht links daneben.
 *   §4 Über die Breite hinaus wird NICHT gestreckt — ein langer Zeitraum
 *      rollt weiter.
 *   §5 Jede Zoomstufe bleibt bedienbar.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → `pxPassend` zurück auf den festen Wert aus `ZS_STUFEN`.
 *   §3    → die Klemme der ersten Marke auf 0 wieder herausnehmen.
 *   §4    → die Bedingung `nur wenn kleiner` weglassen und immer strecken.
 * Alle gelaufen, Ergebnisse im Bericht zu E419.
 *
 *   node pruefungen/lauf/test413.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9535;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1440, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);
await s.evaluate(new Function(vorlage.replace('${layout}', 'timeline')) as any);
await s.waitForTimeout(1200);

/** Masse des Zeitstrahls: Behälter, gezeichnete Fläche, Balken, Marken. */
const messen = () => s.evaluate(`(() => {
  const scroll = document.querySelector('.zs-scroll');
  const fl = document.querySelector('.zs-flaeche');
  if (!scroll || !fl) return { fehlt: true };
  const balkenEl = [...document.querySelectorAll('.zs-balken')];
  const balken = balkenEl.map(b => Math.round(b.getBoundingClientRect().width));
  /* Wie viele Tage ein Balken WIRKLICH umfasst, steht in seinem title:
     "Name — 01.09.2026 bis 12.09.2026". Damit laesst sich pruefen, ob
     zwei verschieden lange Spannen auch verschieden breit gemalt werden. */
  const spannen = balkenEl.map(b => {
    const t = b.getAttribute('title') || '';
    /* Doppelte Schraegstriche: dieser Text steht in einer Vorlage, und dort
       frisst JavaScript ein einfaches Backslash-d zu einem blossen d.
       Und ein- bis zweistellig, weil de-DE 1.9.2026 schreibt, nicht 01.09. */
    const d = t.match(/\\d{1,2}\\.\\d{1,2}\\.\\d{4}/g) || [];
    const alsZahl = (x) => { const [tg, mo, ja] = x.split('.'); return Date.UTC(+ja, +mo - 1, +tg); };
    const tage = d.length >= 2
      ? Math.round((alsZahl(d[1]) - alsZahl(d[0])) / 86400000) + 1 : 1;
    return { tage, breite: Math.round(b.getBoundingClientRect().width) };
  });
  /* DIE GEZEICHNETE WEITE, NICHT DIE DES BEHAELTERS. Die Flaeche traegt
     min-width:100% — das Element fuellt die Breite IMMER, auch wenn darin
     nur 325 px gemalt sind. Eine Pruefung darauf konnte deshalb nie rot
     werden und war gruen, waehrend zwei Drittel weiss blieben (§55.2).
     Gemessen wird die rechte Kante dessen, was wirklich dasteht.
     (Und: KEINE Backticks in einem Kommentar innerhalb einer Vorlage —
     sie beenden die Zeichenkette. Dritter Anlauf an derselben Stelle.) */
  const flRect = fl.getBoundingClientRect();
  const rechts = Math.max(0, ...balkenEl.map(b =>
    b.getBoundingClientRect().right - flRect.left));
  const marken = [...document.querySelectorAll('.zs-kopf span')]
    .map(m => ({ text: m.textContent.trim(), x: Math.round(parseFloat(m.style.left) || 0) }));
  return {
    behaelter: Math.round(scroll.clientWidth),
    flaeche: Math.round(fl.getBoundingClientRect().width),
    /* Die Breite, die der Code SETZT — nicht die, die das Element hat.
       min-width:100% blaeht das Element auf die volle Breite auf, ganz
       gleich wie schmal darin gezeichnet wird. */
    gesetzt: Math.round(parseFloat(fl.style.width) || 0),
    gemalt: Math.round(rechts),
    rollt: scroll.scrollWidth > scroll.clientWidth + 2,
    balken, marken, spannen,
    tage: Number((document.querySelector('.zs-info')?.textContent || '')
      .match(/(\\d+) Tage/)?.[1] || 0)
  };
})()`) as Promise<any>;

const stufe = async (id: string) => {
  await s.evaluate(`(async () => {
    document.querySelector('[data-zoom="${id}"]')?.click();
    await new Promise(f => setTimeout(f, 700));
  })()`);
  return messen();
};

/* ==========================================================================
 * §1 · DIE FLÄCHE WIRD GENUTZT
 * ========================================================================*/
console.log('\n§1 Die gezeichnete Fläche nutzt die Breite');
const monat = await messen();
p('Es gibt einen Zeitstrahl zu messen', !monat.fehlt && monat.behaelter > 400,
  JSON.stringify({ b: monat.behaelter, f: monat.flaeche }));
/* 65 Tage mal 5 px sind 325. Der Behälter ist rund 1500 breit. */
p('Die gezeichnete Fläche füllt den Behälter',
  monat.gesetzt >= monat.behaelter - 8,
  `gesetzt ${monat.gesetzt} px in ${monat.behaelter} px`);
p('… und läuft auch nicht darüber hinaus',
  monat.gesetzt <= monat.behaelter + 2,
  `gesetzt ${monat.gesetzt} px in ${monat.behaelter} px`);
/* UND DIE BALKEN REICHEN WIRKLICH WEIT NACH RECHTS. Die gesetzte Breite
   allein genügt nicht: sie wäre auch dann voll, wenn alle Balken links
   klebten. Der Rest bis zum Rand ist der Nachlauf von vierzehn Tagen, den
   `maxD` bewusst anhängt — Platz, um einen Balken nach rechts zu ziehen.
   Rund 78 % ist also das Erwartbare, nicht 100 %. */
p('… und die Balken reichen bis in die Nähe des rechten Randes',
  monat.gemalt >= monat.behaelter * 0.7,
  `gemalt bis ${monat.gemalt} px in ${monat.behaelter} px`);
p('Der Zeitraum selbst hat sich nicht geändert',
  monat.tage >= 60 && monat.tage <= 70, String(monat.tage));

/* ==========================================================================
 * §2 · DIE BALKEN WERDEN UNTERSCHEIDBAR
 * --------------------------------------------------------------------------
 * Der eigentliche Schaden. `balkenBreite` hat eine Mindestbreite von 22 px:
 * bei 5 px je Tag fallen ALLE Balken bis vier Tage auf dieselben 22 px, und
 * ein Dreitagesbalken sieht aus wie ein Eintagesbalken.
 * ========================================================================*/
console.log('\n§2 Die Balken sind unterscheidbar');
p('Es gibt Balken', monat.balken.length >= 5, String(monat.balken.length));
p('Nicht alle sind gleich breit', new Set(monat.balken).size > 1, monat.balken.join(' '));
/* Neun Einträge mit verschiedenen Spannen — drei verschiedene Breiten sind
   das Mindeste, das „unterscheidbar" heissen darf. */
p('Mindestens vier verschiedene Breiten',
  new Set(monat.balken).size >= 4, monat.balken.join(' '));
p('Und der breiteste ist deutlich breiter als der schmalste',
  Math.max(...monat.balken) > Math.min(...monat.balken) * 2.5,
  `${Math.min(...monat.balken)} bis ${Math.max(...monat.balken)} px`);
/* DER EIGENTLICHE SCHADEN, UND ER IST GENAUER ALS „nicht alle gleich".
   `balkenBreite` hat eine Mindestbreite von 22 px. Bei 5 px je Tag ist ein
   Balken über EINEN Tag 22 px breit und einer über VIER Tage auch — die
   Mindestbreite frisst jeden Unterschied unter fünf Tagen. Gemessen: zwei
   Einträge mit verschieden langer Spanne dürfen nicht dieselbe Breite
   haben. */
const paare = monat.spannen as Array<{ tage: number; breite: number }>;
const verschieden = paare.filter((a, i) =>
  paare.some((b, j) => j > i && a.tage !== b.tage && a.breite === b.breite));
console.log('   (Spannen: ' + JSON.stringify(paare.map(x => x.tage + 'T=' + x.breite)) + ')');
p('Zwei verschieden lange Spannen sind nicht gleich breit gemalt',
  verschieden.length === 0,
  JSON.stringify(paare.map(x => x.tage + 'T=' + x.breite + 'px')));

/* ==========================================================================
 * §3 · DIE ERSTE MARKE STEHT IM BILD
 * ========================================================================*/
console.log('\n§3 Die erste Marke steht im Bild');
p('Es gibt Marken', monat.marken.length >= 2, JSON.stringify(monat.marken));
p('Keine steht links ausserhalb',
  monat.marken.every((m: any) => m.x >= 0), JSON.stringify(monat.marken));
/* Und die erste steht wirklich AM Anfang, nicht irgendwo in der Mitte —
   sonst bliebe der Anfang wieder unbeschriftet. */
p('Die erste steht am linken Rand',
  (monat.marken[0]?.x ?? 99) <= 2, JSON.stringify(monat.marken[0]));
p('Sie trägt einen Text', (monat.marken[0]?.text || '').length >= 3,
  JSON.stringify(monat.marken[0]));

/* ==========================================================================
 * §4 · ÜBER DIE BREITE HINAUS WIRD NICHT GESTRECKT
 * --------------------------------------------------------------------------
 * Die Tagesstufe zeichnet 42 px je Tag; 65 Tage sind 2730 px und passen
 * NICHT in den Behälter. Dort muss es beim Rollen bleiben — sonst wäre aus
 * dem Zoom eine Anzeige geworden, die immer gleich aussieht.
 * ========================================================================*/
console.log('\n§4 Ein langer Zeitraum rollt weiter');
const tag = await stufe('tag');
p('Auf der Tagesstufe ist die Fläche breiter als der Behälter',
  tag.flaeche > tag.behaelter, `${tag.flaeche} px in ${tag.behaelter} px`);
p('… und sie rollt auch wirklich', tag.rollt === true, JSON.stringify(tag.rollt));
p('Die Zoomstufe wirkt also noch', tag.gemalt > monat.gemalt * 1.5,
  `Monat gemalt ${monat.gemalt} px, Tag gemalt ${tag.gemalt} px`);

/* ==========================================================================
 * §5 · JEDE ZOOMSTUFE BLEIBT BEDIENBAR
 * ========================================================================*/
console.log('\n§5 Jede Zoomstufe bleibt bedienbar');
for (const id of ['woche', 'monat', 'quartal', 'jahr']) {
  const m = await stufe(id);
  p(`${id}: Fläche und Balken stehen`,
    !m.fehlt && m.gemalt > 0 && m.balken.length >= 5 &&
    m.marken.every((x: any) => x.x >= 0),
    JSON.stringify({ gemalt: m.gemalt, b: m.behaelter, n: m.balken.length,
                     erste: m.marken[0] }));
}

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
