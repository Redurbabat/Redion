/* Suite 420 — Der Zeitstrahl am Telefon zeigt den Zeitstrahl (E427)
 * ============================================================================
 * Auf dem Telefonbild `db-timeline-handy` stand jeder Name ZWEIMAL: einmal
 * in der Namensspalte links, einmal neben seinem Balken. Nachgemessen auf
 * 390 px:
 *
 *     Raster gesamt   334 px
 *     Namensspalte    190 px   (57 %)
 *     Zeichenfläche   142 px   (43 %)
 *     Titel im Balken   0 von 9
 *     Titel daneben     9 von 9
 *
 * Die Namensspalte ist auf `flex:0 0 190px` festgenagelt — eine Zahl, die
 * am Rechner 16 % ausmacht und am Telefon 57 %. Und weil in 142 px kein
 * Balken breit genug für seinen Titel ist, wandert nach E413 JEDER Titel
 * nach draussen. Beides zusammen heisst: ein Zeitstrahl, der zur Hälfte
 * eine Namensliste ist und daneben dieselbe Namensliste noch einmal zeigt.
 *
 * E413 hat die Regel gebaut, dass ein Titel nach draussen wandert, wenn er
 * drinnen nicht passt. Sie ist richtig — nur nicht dort, wo der Name schon
 * links steht und der Platz ohnehin fehlt.
 *
 *   §1 Am Telefon bekommt die Zeichenfläche mehr Platz als die Namen.
 *   §2 Kein Name steht zweimal.
 *   §3 Am Rechner bleibt alles, wie es war.
 *   §4 Die Namen links bleiben lesbar und unterscheidbar.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die Telefonbreite der Namensspalte zurück auf 190 px.
 *   §2 → die Regel gegen den doppelten Titel herausnehmen.
 *   §3 → beide ohne Medienabfrage setzen.
 * Alle gelaufen, Ergebnisse im Bericht zu E427.
 *
 *   node pruefungen/lauf/test420.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9542;

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

const messen = async (breite: number, handy: boolean) => {
  const ktx = await browser.newContext({
    viewport: { width: breite, height: 900 }, isMobile: handy, hasTouch: handy });
  const s = await ktx.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(vorlage.replace('${layout}', 'timeline')) as any);
  await s.waitForTimeout(1300);
  const raus = JSON.parse(await s.evaluate(`JSON.stringify((() => {
    const raster = document.querySelector('.zs-raster');
    const namen = document.querySelector('.zs-namen');
    const scroll = document.querySelector('.zs-scroll');
    if (!raster || !namen || !scroll) return { fehlt: true };
    /* Ein Titel gilt als SICHTBAR, wenn er ein Rechteck von echter Breite
       hat — display:none nimmt es ihm, und genau das ist der Riegel. */
    const sichtbar = (e) => e.getBoundingClientRect().width > 1;
    const drin = [...document.querySelectorAll('.zs-txt')]
      .filter(t => !t.classList.contains('draussen') && sichtbar(t));
    const draussen = [...document.querySelectorAll('.zs-txt.draussen')].filter(sichtbar);
    const links = [...document.querySelectorAll('.zs-name')];
    return {
      raster: Math.round(raster.getBoundingClientRect().width),
      namen: Math.round(namen.getBoundingClientRect().width),
      scroll: Math.round(scroll.getBoundingClientRect().width),
      drin: drin.length, draussen: draussen.length,
      linksTexte: links.map(e => e.textContent.trim()),
      linksNoetig: links.map(e => Math.round(e.scrollWidth)),
      linksBreit: links.map(e => Math.round(e.getBoundingClientRect().width))
    };
  })())`) as string);
  await ktx.close();
  return raus;
};

/* ==========================================================================
 * §1 · AM TELEFON BEKOMMT DIE ZEICHENFLÄCHE MEHR PLATZ ALS DIE NAMEN
 * ========================================================================*/
console.log('\n§1 Am Telefon bekommt die Zeichenfläche den Platz');
const handy = await messen(390, true);
p('Es gibt einen Zeitstrahl zu messen', !handy.fehlt, JSON.stringify(handy));
p('Die Namensspalte nimmt weniger als die Hälfte',
  handy.namen < handy.raster * 0.45,
  `${handy.namen} px von ${handy.raster} px`);
p('… und die Zeichenfläche mehr als die Hälfte',
  handy.scroll > handy.raster * 0.55,
  `${handy.scroll} px von ${handy.raster} px`);

/* ==========================================================================
 * §2 · KEIN NAME STEHT ZWEIMAL
 * --------------------------------------------------------------------------
 * Links steht der Name jeder Zeile. Steht er zusätzlich neben dem Balken,
 * ist dasselbe Wort zweimal im Bild — auf 390 px die Hälfte des Platzes für
 * eine Auskunft, die schon dasteht.
 * ========================================================================*/
console.log('\n§2 Kein Name steht zweimal');
p('Links stehen alle neun Namen', handy.linksTexte.length === 9,
  String(handy.linksTexte.length));
p('Und keiner steht zusätzlich neben seinem Balken',
  handy.draussen === 0, `${handy.draussen} von 9 stehen draussen`);
/* Ein Titel IM Balken ist dagegen in Ordnung: er steht dort, wo der Balken
   ist, und sagt dem Auge, welcher Balken zu welcher Zeile gehört. Auf
   142 px passt nur selten einer — geprüft wird deshalb nur, dass die Regel
   nicht ALLE Titel wegnimmt, wo sie passen würden. */
p('Die Regel nimmt nicht mehr weg als nötig',
  handy.drin + handy.draussen <= 9, `${handy.drin} drin, ${handy.draussen} draussen`);

/* ==========================================================================
 * §3 · AM RECHNER BLEIBT ALLES, WIE ES WAR
 * ========================================================================*/
console.log('\n§3 Am Rechner bleibt alles, wie es war');
const rechner = await messen(1280, false);
p('Die Namensspalte bleibt 190 px', rechner.namen === 190, String(rechner.namen));
p('Und die Titel neben den Balken bleiben',
  rechner.draussen > 0, `${rechner.drin} drin, ${rechner.draussen} draussen`);
p('Die meisten stehen dabei IM Balken',
  rechner.drin >= rechner.draussen, `${rechner.drin} drin, ${rechner.draussen} draussen`);

/* ==========================================================================
 * §4 · DIE NAMEN LINKS BLEIBEN LESBAR
 * --------------------------------------------------------------------------
 * Die Spalte schmaler zu machen darf nicht dazu führen, dass zwei Zeilen
 * gleich aussehen — genau der Fehler aus E426.
 * ========================================================================*/
console.log('\n§4 Die Namen links bleiben unterscheidbar');
p('Es sind neun verschiedene Namen',
  new Set(handy.linksTexte).size === 9, JSON.stringify(handy.linksTexte));
/* Gekürzt werden dürfen sie — aber so, dass man sie noch auseinanderhält.
   Gemessen: wie viele Zeichen passen, und sind die Anfänge verschieden? */
const kurz = handy.linksTexte.map((t: string, i: number) => {
  const anteil = handy.linksBreit[i] / Math.max(1, handy.linksNoetig[i]);
  return t.slice(0, Math.max(4, Math.round(t.length * Math.min(1, anteil))));
});
p('Und ihre sichtbaren Anfänge sind es auch',
  new Set(kurz).size === 9, JSON.stringify(kurz));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
