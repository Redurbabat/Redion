/* Suite 409 — Das Diagramm zeigt etwas (E414)
 * ============================================================================
 * Vier Befunde auf EINEM Bild, und alle vier waren Anzeigen, die etwas
 * Falsches sagten statt gar nichts:
 *
 *   1. Neun schwarze Balken auf dunklem Grund. `PALETTE` ist eine Liste von
 *      PAAREN [Farbe, Name]; sechs Stellen schrieben `fill: PALETTE[i]`,
 *      also das ganze Paar. Als Zeichenkette „#529cca,Blau" — kein gültiger
 *      Farbwert, SVG malt schwarz.
 *   2. Neun Balken der Höhe 1. Die Vorgabe-Gruppierung war `gruppierbar[0]`,
 *      und `gruppierbar` schliesst `title` ein — der Titel steht in jedem
 *      Schema zuerst. Ein Diagramm nach dem Titel gibt jeder Zeile einen
 *      eigenen Balken.
 *   3. Eine Y-Achse „3 2 2 1 0" — die Zwei zweimal, an zwei Höhen.
 *   4. Beschriftungen wie „Bericht Kapi" und „Bericht Kapi" — zweimal
 *      dasselbe, zwei verschiedene Zeilen (Folge von 2).
 *
 *   §1 Die Balken haben echte Farben, keine schwarzen.
 *   §2 Und die Legende auch.
 *   §3 Die Vorgabe gruppiert nach Status, nicht nach dem Titel.
 *   §4 Die Achse trägt keine Zahl zweimal.
 *   §5 Der Titel bleibt WÄHLBAR — die Vorgabe ist keine Sperre.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → `farbeVon(i)` zurück auf `PALETTE[i % PALETTE.length]`.
 *   §3    → `vorgabeGruppe` zurück auf `gruppierbar[0]`.
 *   §4    → die Stufenzahl fest auf 4 setzen.
 * Alle gelaufen, Ergebnisse im Bericht zu E414.
 *
 *   node pruefungen/lauf/test409.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9532;

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
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);
await s.evaluate(new Function(vorlage.replace('${layout}', 'chart')) as any);
await s.waitForTimeout(1100);

/* ==========================================================================
 * §1 · ECHTE FARBEN, KEINE SCHWARZEN
 * ========================================================================*/
console.log('\n§1 Echte Farben');
const fuell = await s.evaluate(
  `[...document.querySelectorAll('.chart-svg rect')].map(r => r.getAttribute('fill'))`) as string[];
p('Es gibt Balken', fuell.length >= 3, String(fuell.length));
p('Jeder trägt einen gültigen Farbwert',
  fuell.every(f => /^#[0-9a-f]{6}$/i.test(String(f))), fuell.join(' | '));
/* Das eigentliche Kennzeichen des Fehlers: ein Komma im Farbwert. So sah
   „#529cca,Blau" aus, und genau daran erkennt man ein Paar statt einer Farbe. */
p('Kein Farbwert enthält ein Komma — das wäre wieder ein ganzes Paar',
  fuell.every(f => !String(f).includes(',')), fuell.join(' | '));
p('Und die Balken sind nicht alle gleich', new Set(fuell).size > 1, fuell.join(' '));

/* ==========================================================================
 * §2 · DIE LEGENDE AUCH
 * ========================================================================*/
console.log('\n§2 Die Legende auch');
const leg = await s.evaluate(
  `[...document.querySelectorAll('.chart-legende i')].map(i => getComputedStyle(i).backgroundColor)`) as string[];
p('Es gibt Legendenpunkte', leg.length >= 3, String(leg.length));
const schwarzOderLeer = (c: string) =>
  !c || c === 'rgba(0, 0, 0, 0)' || c === 'rgb(0, 0, 0)' || c === 'transparent';
p('Keiner ist schwarz oder durchsichtig', leg.every(c => !schwarzOderLeer(c)), leg.join(' | '));

/* ==========================================================================
 * §3 · DIE VORGABE IST NICHT DER TITEL
 * ========================================================================*/
console.log('\n§3 Die Vorgabe gruppiert sinnvoll');
const titel = await s.evaluate(
  `(document.querySelector('.chart-titel') || { textContent: '' }).textContent.trim()`) as string;
p('Die Kopfzeile nennt die Statusspalte', /Status/.test(titel), titel);
p('Und nicht die Titelspalte', !/Projekt · /.test(titel), titel);

/* Der harte Beleg: neun Zeilen dürfen nicht neun Balken ergeben. Nach Status
   sind es vier Gruppen. */
p('Neun Zeilen ergeben vier Balken, nicht neun', fuell.length === 4, String(fuell.length));
const hoehen = await s.evaluate(
  `[...document.querySelectorAll('.chart-svg rect')].map(r => Math.round(+r.getAttribute('height')))`) as number[];
p('Und die Balken sind verschieden hoch — sonst zählt es wieder nur Zeilen',
  new Set(hoehen).size > 1, hoehen.join(' '));

/* ==========================================================================
 * §4 · DIE ACHSE TRÄGT KEINE ZAHL ZWEIMAL
 * ========================================================================*/
console.log('\n§4 Die Achse ist eindeutig');
/* Nur die Achsenbeschriftung: sie steht links, rechtsbündig. Die Zahlen über
   den Balken sind mittig. */
const achse = await s.evaluate(
  `[...document.querySelectorAll('.chart-svg text')]
     .filter(t => t.getAttribute('text-anchor') === 'end')
     .map(t => t.textContent.trim())`) as string[];
p('Es gibt Achsenmarken', achse.length >= 3, achse.join(' '));
p('Keine Zahl steht zweimal', new Set(achse).size === achse.length, achse.join(' '));
p('Und sie laufen von oben nach unten abwärts',
  achse.every((v, i) => i === 0 || Number(achse[i - 1]) > Number(v)), achse.join(' '));

/* ==========================================================================
 * §5 · DER TITEL BLEIBT WÄHLBAR
 * --------------------------------------------------------------------------
 * Die Vorgabe zu ändern darf keine Möglichkeit wegnehmen. Wer nach dem Titel
 * gruppieren WILL, soll das können.
 * ========================================================================*/
console.log('\n§5 Der Titel bleibt wählbar');
const nachTitel = await s.evaluate(`(() => {
  const v = Object.values(Store.cache.views).find(x => x.layout === 'chart');
  if (!v) return 'keine Diagrammansicht';
  const c = Store.getCollection(v.collectionId);
  const tk = Object.keys(c.schema).find(k => c.schema[k].type === 'title');
  Store.updateView(v.id, { chartGruppe: tk });
  App.zeichneSeite();
  return 'ok';
})()`) as string;
p('Die Ansicht liess sich umstellen', nachTitel === 'ok', nachTitel);
await s.waitForTimeout(700);
const nachher = await s.evaluate(
  `[...document.querySelectorAll('.chart-svg rect')].length`) as number;
p('Nach dem Titel gruppiert gibt es wieder neun Balken — die Wahl wirkt',
  nachher === 9, String(nachher));

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await s.close();
await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
