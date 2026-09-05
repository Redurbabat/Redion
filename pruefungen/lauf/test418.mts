/* Suite 418 — Die Liste beschriftet ihre Werte (E425)
 * ============================================================================
 * Dritter Fundort desselben Fehlers. Auf dem Bild `db-list` stand:
 *
 *     Schaltplan Werkstatt   Läuft Elektro Schule Team
 *                            01.09.2026 12.09.2026 420 CHF …
 *
 * Zwei Daten nebeneinander, ohne Namen. Welches ist der Anfang, welches das
 * Ende? Und eine Zeile darunter: „15.09.2026 15.09.2026" — zweimal dasselbe
 * Datum, und ohne Beschriftung sagt das gar nichts.
 *
 * Dazu zwei weitere Dinge, die auf dem Bild zu sehen waren:
 *
 *   · ALLE dreizehn Spalten standen in jeder Zeile — Etiketten, zwei Daten,
 *     Kosten, Fortschritt, Sterne, Person, Ort, Kästchen und der Anhang.
 *     Eine Liste ist zum Überfliegen da.
 *   · Nichts fluchtete. Weil die Werte rechtsbündig an den Titel
 *     anschliessen, beginnt jede Zeile an einer anderen Stelle — je nachdem,
 *     wie viele Etiketten sie trägt. Eine Spalte, die man nicht senkrecht
 *     lesen kann, ist keine.
 *
 * E411 hat die Maschine gebaut (`kartenWerte`), E424 sie dem Feed gegeben.
 * Hier ist der dritte Ort.
 *
 *   §1 Jeder Wert, der seinen Namen braucht, trägt ihn.
 *   §2 Die Beschriftung klebt nicht am Wert.
 *   §3 Die Liste bleibt überfliegbar.
 *   §4 Kein Stil steht im Quelltext (§39).
 *   §5 Titel und Klick bleiben.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2/§3 → zurück auf die eigene Schleife mit `<span style="font-size…">`.
 *   §4       → ein `style=` an der Zeile wieder einsetzen.
 * Beide gelaufen, Ergebnisse im Bericht zu E425.
 *
 *   node pruefungen/lauf/test418.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9540;

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
const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);
await s.evaluate(new Function(vorlage.replace('${layout}', 'list')) as any);
await s.waitForTimeout(1200);

const zeilen = JSON.parse(await s.evaluate(`JSON.stringify(
  [...document.querySelectorAll('.list-row')].map(z => ({
    titel: (z.querySelector('.lr-titel') || z.firstElementChild || {}).textContent || '',
    namen: [...z.querySelectorAll('.mv-n')].map(x => x.textContent.trim()),
    werte: [...z.querySelectorAll('.mv')].map(x => x.textContent.trim()),
    /* NUR DER AUFBAU DER ZEILE, NICHT DER INHALT EINER ZELLE. §39 verbietet
       Stil im Quelltext — gemeint ist der AUFBAU: Breiten, Abstaende,
       Schriftgroessen. Ein Fortschrittsbalken schreibt style="width:55%",
       und das ist ein GERECHNETER Wert; er kann gar nicht in einer
       Stildatei stehen. Ein Waechter, der ihn mitzaehlt, verlangt etwas
       Unmoegliches und wird abgeschaltet.
       Gezaehlt werden deshalb die drei Traeger des Aufbaus. */
    stil: [...z.querySelectorAll('.lr-titel, .lr-werte, .mv, .mv-n')]
            .filter(e => e.getAttribute('style')).length,
    stilRoh: [...z.querySelectorAll('*')].filter(e => e.getAttribute('style')).length
  })))`) as string);

/* ==========================================================================
 * §1 · JEDER WERT, DER SEINEN NAMEN BRAUCHT, TRÄGT IHN
 * ========================================================================*/
console.log('\n§1 Jeder Wert, der seinen Namen braucht, trägt ihn');
p('Es gibt Listenzeilen', zeilen.length >= 5, String(zeilen.length));
p('Jede trägt einzelne Werte', zeilen.every((z: any) => z.werte.length > 0),
  JSON.stringify(zeilen.map((z: any) => z.werte.length)));
/* Der Fall vom Bild: zwei Daten in einer Zeile. Genau dafür zählt
   `kartenWerte` erst die Typen — zwei Datumsspalten sind auch dann nicht zu
   trennen, wenn eine allein es wäre. */
const mitDaten = zeilen.filter((z: any) =>
  z.namen.includes('Anfang') && z.namen.includes('Ende'));
p('Wo zwei Daten stehen, tragen beide ihren Namen',
  mitDaten.length >= 3, JSON.stringify(zeilen.map((z: any) => z.namen)));
/* Und die nackte Zahl auch. */
p('Die Kosten tragen ihren Namen',
  zeilen.every((z: any) => z.namen.includes('Kosten')),
  JSON.stringify(zeilen.map((z: any) => z.namen)));
/* Aber nicht alles — Etiketten sagen sich selbst (E411). */
p('Etiketten bleiben ohne Beschriftung',
  zeilen.some((z: any) => z.namen.length < z.werte.length),
  JSON.stringify(zeilen.map((z: any) => z.namen.length + '/' + z.werte.length)));

/* ==========================================================================
 * §2 · DIE BESCHRIFTUNG KLEBT NICHT AM WERT
 * ========================================================================*/
console.log('\n§2 Die Beschriftung klebt nicht am Wert');
const spalte = JSON.parse(await s.evaluate(`JSON.stringify(
  [...document.querySelectorAll('.list-row .mv')].map(mv => {
    const n = mv.querySelector('.mv-n');
    if (!n || !n.nextSibling) return null;
    const nr = n.getBoundingClientRect();
    const s2 = n.nextSibling;
    let wr;
    if (s2.nodeType === 3) { const r = document.createRange(); r.selectNodeContents(s2); wr = r.getBoundingClientRect(); }
    else wr = s2.getBoundingClientRect();
    if (!wr || !wr.width) return null;
    return { name: n.textContent.trim(), spalt: Math.round((wr.left - nr.right) * 10) / 10 };
  }).filter(Boolean))`) as string);
p('Es gibt beschriftete Werte zu messen', spalte.length >= 5, String(spalte.length));
p('Keine Beschriftung klebt an ihrem Wert',
  spalte.every((x: any) => x.spalt >= 2),
  JSON.stringify(spalte.filter((x: any) => x.spalt < 2)).slice(0, 160));

/* ==========================================================================
 * §3 · DIE LISTE BLEIBT ÜBERFLIEGBAR
 * ========================================================================*/
console.log('\n§3 Die Liste bleibt überfliegbar');
p('Keine Zeile zeigt mehr als sechs Werte',
  zeilen.every((z: any) => z.werte.length <= 6),
  JSON.stringify(zeilen.map((z: any) => z.werte.length)));
p('… und mindestens drei', zeilen.every((z: any) => z.werte.length >= 3),
  JSON.stringify(zeilen.map((z: any) => z.werte.length)));

/* ==========================================================================
 * §4 · KEIN STIL IM QUELLTEXT
 * --------------------------------------------------------------------------
 * §39: Stil bleibt in Stil-Dateien. Die Zeile trug drei `style=`-Blöcke —
 * die Schriftgrösse der Werte, das `flex:1` des Titels und die Reihe der
 * Werte. Alle drei stehen jetzt in `datenbanken.css`.
 * ========================================================================*/
console.log('\n§4 Kein Stil im Quelltext');
p('Kein Traeger des Aufbaus trägt ein style-Attribut',
  zeilen.every((z: any) => z.stil === 0),
  JSON.stringify(zeilen.map((z: any) => z.stil)));
/* Und der Waechter kann ueberhaupt etwas sehen: vor der Reparatur standen
   siebzehn style-Bloecke je Zeile, jetzt bleibt nur der gerechnete
   Fortschritt uebrig. Diese Zeile haelt fest, dass die Zahl klein IST — ein
   Wiederanstieg auf siebzehn faellt damit auf, auch wenn er die Traeger
   umgeht. */
p('Und im Ganzen bleibt hoechstens ein gerechneter Wert je Zeile',
  zeilen.every((z: any) => z.stilRoh <= 1),
  JSON.stringify(zeilen.map((z: any) => z.stilRoh)));

/* ==========================================================================
 * §5 · TITEL UND KLICK BLEIBEN
 * ========================================================================*/
console.log('\n§5 Titel und Klick bleiben');
p('Jede Zeile hat einen Titel',
  zeilen.every((z: any) => String(z.titel).trim().length > 2),
  JSON.stringify(zeilen.map((z: any) => z.titel)));
const geoeffnet = await s.evaluate(`(async () => {
  const vorher = App.aktuelleSeite();
  document.querySelector('.list-row').click();
  await new Promise(f => setTimeout(f, 700));
  return App.aktuelleSeite() !== vorher;
})()`) as boolean;
p('Und ein Klick öffnet die Seite', geoeffnet === true, String(geoeffnet));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
