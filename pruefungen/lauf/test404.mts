/* Suite 404 — Die Ansichten bekommen die Breite, die da ist (E409)
 * ============================================================================
 * Gemessen, bevor gebaut wurde (§36): bei 1280 px Fenster stand die
 * Datenbank in 708 px und ihre Tabelle brauchte 1637 — 57 % lagen hinter
 * einem waagerechten Roller, den niemand sieht. Bei 1920 px änderte sich
 * NICHTS: `#page` blieb 900 px, links und rechts standen je 483 px leer.
 *
 * Fliesstext soll schmal bleiben. Eine Datenbank ist kein Fliesstext.
 *
 *   §1 Die Datenbank ist breiter als der Textrahmen, und zwar merklich.
 *   §2 Sie wächst mit dem Fenster.
 *   §3 Sie bleibt im Roller — kein Pixel ragt aus dem Fenster.
 *   §4 Am Telefon ändert sich nichts.
 *   §5 Der Fortschritt ist ABLESBAR: verschiedene Werte, verschiedene
 *      Balken, und die Zahl steht bei jedem davon.
 *   §6 Die Fortschrittszelle läuft nicht über.
 *   §7 Der Karteikarten-Streifen kommt nicht ungefragt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Die Gegenproben stehen im Bericht zu E409; jede ist gelaufen. Zwei davon
 * sind Fehler, die WIRKLICH dastanden und die diese Suite jetzt hält:
 *   §1 → `flex: 0 0 auto` aus `.db` nehmen. Dann ist `.blk` weiter
 *        `display:flex`, das Kind nimmt seine Breite aus dem Inhalt, und die
 *        Tabelle wächst nur um die Hälfte. Genau so war der erste Versuch.
 *   §5 → in `dienst.ts` die Bahn wieder weglassen (`<i>` unmittelbar in
 *        `.proz`). Dann bezieht sich `width:n%` auf die ganze Zelle, der
 *        Balken schiebt die Zahl hinaus, und 55 % sieht aus wie 100 %.
 *
 *   node pruefungen/lauf/test404.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9527;

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

/* Der Aufbau kommt aus `bilder.mts` — eine Quelle, nicht zwei. Wer die
   Beispieldaten dort ändert, ändert sie hier mit. */
const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));
if (!vorlage.includes('addDatabase')) {
  console.log('  ✗ Der Aufbau liess sich nicht aus bilder.mts lesen');
  server.close(); process.exit(1);
}

const browser = await chromium.launch();
const fehler: string[] = [];

const bauen = async (breite: number, layout: string, telefon = false) => {
  const s = await browser.newPage({
    viewport: { width: breite, height: 900 },
    ...(telefon ? { isMobile: true, hasTouch: true } : {})
  });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  /* Der blosse Name, nicht `globalThis.App`: Redions Module sind
     Script-Scope-Konstanten und stehen NICHT am `window` (index.html lädt
     bewusst ohne `type=module`). `globalThis.App` ist dort immer undefined,
     und die Wartezeit liefe ohne diesen Hinweis in einen Zeitfehler, der
     wie ein kaputter Start aussieht. */
  await s.waitForFunction(
    "typeof App !== 'undefined' && typeof Store !== 'undefined'",
    null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(vorlage.replace('${layout}', layout)) as any);
  await s.waitForTimeout(900);
  return s;
};

const MASSE = `(() => {
  const db = document.querySelector('.db');
  const seite = document.getElementById('page');
  const roller = document.getElementById('scroll');
  if (!db || !seite || !roller) return JSON.stringify({ fehlt: true });
  const r = db.getBoundingClientRect();
  return JSON.stringify({
    db: Math.round(r.width), links: Math.round(r.left), rechts: Math.round(r.right),
    seite: seite.clientWidth, roller: roller.clientWidth,
    rollerLinks: Math.round(roller.getBoundingClientRect().left),
    fenster: window.innerWidth
  });
})()`;

/* ==========================================================================
 * §1 · BREITER ALS DER TEXTRAHMEN
 * ========================================================================*/
console.log('\n§1 Breiter als der Text');

const s1 = await bauen(1280, 'table');
const m1 = JSON.parse(await s1.evaluate(MASSE));
p('Die Seite bleibt schmal — Text soll schmal bleiben', m1.seite <= 920, String(m1.seite));
p('Die Datenbank ist breiter als der Textrahmen', m1.db > m1.seite,
  `${m1.db} gegen ${m1.seite}`);
/* Die Zahl ist nicht willkürlich: vor E409 waren es 708 px bei 900 px Seite.
   Alles unter 1000 hiesse, dass die Regel wieder nur halb greift. */
p('Und zwar merklich — über 1000 px bei 1280 px Fenster', m1.db > 1000, String(m1.db));

/* ==========================================================================
 * §2 · SIE WÄCHST MIT DEM FENSTER
 * --------------------------------------------------------------------------
 * Der eigentliche Fund: vorher änderte ein doppelt so breites Fenster gar
 * nichts. Diese Prüfung hält genau das fest.
 * ========================================================================*/
console.log('\n§2 Sie wächst mit');

const s2 = await bauen(1920, 'table');
const m2 = JSON.parse(await s2.evaluate(MASSE));
p('Bei 1920 px ist sie breiter als bei 1280 px', m2.db > m1.db + 200,
  `${m1.db} → ${m2.db}`);
p('Die Seite dagegen bleibt gleich schmal', Math.abs(m2.seite - m1.seite) < 40,
  `${m1.seite} → ${m2.seite}`);

/* ==========================================================================
 * §3 · SIE BLEIBT IM ROLLER
 * ========================================================================*/
console.log('\n§3 Kein Pixel nach draussen');

for (const [nr, m] of [[1280, m1], [1920, m2]] as [number, any][]) {
  p(`Bei ${nr} px ragt sie links nicht heraus`, m.links >= m.rollerLinks - 1,
    `${m.links} gegen ${m.rollerLinks}`);
  p(`Bei ${nr} px ragt sie rechts nicht heraus`, m.rechts <= m.fenster + 1,
    `${m.rechts} gegen ${m.fenster}`);
}

/* ==========================================================================
 * §4 · AM TELEFON ÄNDERT SICH NICHTS
 * ========================================================================*/
console.log('\n§4 Telefon');

const s4 = await bauen(390, 'table', true);
const m4 = JSON.parse(await s4.evaluate(MASSE));
p('Sie ragt links nicht aus dem Bild', m4.links >= -1, String(m4.links));
p('Und rechts auch nicht', m4.rechts <= m4.fenster + 1,
  `${m4.rechts} gegen ${m4.fenster}`);
await s4.close();

/* ==========================================================================
 * §5 · DER FORTSCHRITT IST ABLESBAR
 * --------------------------------------------------------------------------
 * Der Fehler, den erst ein Bild fand: 55 %, 80 % und 100 % sahen gleich aus,
 * weil der Balken die ganze Zelle nahm und die Zahl hinausschob.
 * ========================================================================*/
console.log('\n§5 Fortschritt ablesbar');

const PROZ = `(() => {
  const zellen = [...document.querySelectorAll('.db tbody .proz')];
  return JSON.stringify(zellen.map(z => {
    const bahn = z.querySelector('.proz-bahn');
    const balken = z.querySelector('i');
    const zahl = z.querySelector('b');
    return {
      text: (zahl ? zahl.textContent : '').trim(),
      zahlSichtbar: zahl ? Math.round(zahl.getBoundingClientRect().width) > 8 : false,
      balken: balken ? Math.round(balken.getBoundingClientRect().width) : -1,
      bahn: bahn ? Math.round(bahn.getBoundingClientRect().width) : -1,
      ueberlauf: z.parentElement ? z.parentElement.scrollWidth - z.parentElement.clientWidth : 0
    };
  }));
})()`;

const proz = JSON.parse(await s1.evaluate(PROZ)) as any[];
p('Es gibt Fortschrittszellen zu messen', proz.length >= 6, String(proz.length));
p('Jede trägt ihre Zahl im Text', proz.every(z => /\d+ %/.test(z.text)),
  proz.map(z => z.text || '(leer)').join(' | '));
p('Und jede Zahl ist wirklich sichtbar', proz.every(z => z.zahlSichtbar),
  proz.filter(z => !z.zahlSichtbar).map(z => z.text).join(' '));

/* Der Kern: verschiedene Werte müssen verschieden AUSSEHEN. Gemessen wird
   die Balkenlänge, nicht der Text — der Text war nie das Problem. */
const nachWert = new Map<string, number>();
for (const z of proz) if (!nachWert.has(z.text)) nachWert.set(z.text, z.balken);
const werte = [...nachWert.entries()].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
p('Mindestens vier verschiedene Werte im Satz', werte.length >= 4,
  werte.map(w => w[0]).join(' '));

let steigt = true, warum = '';
for (let i = 1; i < werte.length; i++) {
  const a = werte[i - 1]!, b = werte[i]!;
  if (b[1] <= a[1]) { steigt = false; warum = `${a[0]}=${a[1]}px, ${b[0]}=${b[1]}px`; break; }
}
p('Ein höherer Wert hat einen längeren Balken', steigt, warum);

const voll = werte[werte.length - 1]!, leer = werte[0]!;
p('Und der Unterschied ist mit Augen zu sehen — über 20 px',
  voll[1] - leer[1] > 20, `${leer[0]}=${leer[1]}px bis ${voll[0]}=${voll[1]}px`);

/* ==========================================================================
 * §6 · DIE ZELLE LÄUFT NICHT ÜBER
 * ========================================================================*/
console.log('\n§6 Kein Überlauf');
const ueber = proz.filter(z => z.ueberlauf > 2);
p('Keine Fortschrittszelle läuft über', ueber.length === 0,
  ueber.map(z => `${z.text}: ${z.ueberlauf}px`).join(' | '));
p('Jede Bahn ist breit genug, um etwas zu zeigen',
  proz.every(z => z.bahn >= 14), proz.map(z => z.bahn).join(' '));

await s1.close(); await s2.close();

/* ==========================================================================
 * §7 · DER KARTEIKARTEN-STREIFEN KOMMT NICHT UNGEFRAGT
 * --------------------------------------------------------------------------
 * Er stand auf jedem Bildschirm und über jedem Bild, ohne dass jemand ihn
 * bestellt hatte. Der Schalter bleibt — die Vorgabe ist aus.
 * ========================================================================*/
console.log('\n§7 Kein ungefragter Streifen');

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/einstellungen/ansicht/seite.ts'), 'utf8');
p('Die Vorgabe von kartenMelden ist aus',
  /V\('kartenMelden',\s*false\)/.test(quelle) && !/V\('kartenMelden',\s*true\)/.test(quelle));
p('Der Schalter gibt es trotzdem noch',
  /schalter\('kartenMelden'/.test(quelle));

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
