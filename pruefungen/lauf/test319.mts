/* Suite 319 — VTODO wird gelesen (L106 Punkt 6, E326)
 * ============================================================================
 * Der ICS-Leser kannte nur VEVENT. Alles zwischen `BEGIN:VTODO` und
 * `END:VTODO` fiel durch — die Zeilen darin sahen aus wie Zeilen ausserhalb
 * eines Blocks und wurden übersprungen. Wer einen Kalender abonnierte, in dem
 * Termine UND Aufgaben stehen, bekam die Aufgaben nie zu sehen und erfuhr
 * auch nicht, dass es sie gibt.
 *
 *   §1 EINE VTODO wird gelesen, mit Frist, Zustand und Anteil.
 *   §2 SIE LANDET NICHT UNTER DEN TERMINEN — eine Aufgabe ist kein Termin.
 *   §3 EINE AUFGABE OHNE FRIST ist trotzdem eine Aufgabe.
 *   §4 DIE FELDER TRENNEN SICH: `DUE` gilt nur für Aufgaben.
 *   §5 GEGENPROBE: ein Kalender ohne VTODO liefert eine leere Liste.
 *   §6 UND DAS BANNER IST SICHTBAR — `.banner.info` hatte keinen Hintergrund.
 *
 * DER PRÜFSTEIN IST §2 UND §6. Eine Aufgabe unter die Termine zu schreiben
 * hiesse, sie als Verabredung auszugeben — dieselbe stille Falschaussage,
 * die E290 beim Kalender abgeräumt hat. Und eine Meldung ohne Hintergrund
 * ist eine Meldung, die es gibt und die niemand sieht.
 *
 *   node pruefungen/lauf/test319.mts
 * ==========================================================================*/
declare const Kalender: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9330;

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

const browser = await chromium.launch();
const fehler: string[] = [];
/* ZEITZONE FESTNAGELN. `icsZeit` rechnet ein `Z` aus der Weltzeit in
   ORTSZEIT um — richtig so, sonst stünde in der Anzeige die falsche
   Stunde. Nur: dann hängt jede Frist-Erwartung hier an der Uhr des
   Rechners, auf dem geprüft wird. Der Prüf-Container läuft in UTC, Redurs
   Rechner in Berlin, und derselbe Prüflauf wäre einmal grün und einmal rot.
   Also bekommt die Seite ihre Zone gesagt: Berlin, im September UTC+2. */
const pc = await browser.newPage({
  viewport: { width: 1280, height: 900 }, timezoneId: 'Europe/Berlin' });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2200);

/* Ein echter Kalender, wie ihn Nextcloud oder Thunderbird ausliefert:
   ein Termin und drei Aufgaben in verschiedenen Zuständen. */
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
  'BEGIN:VEVENT',
  'UID:t1@x', 'SUMMARY:Elektro-Praktikum',
  'DTSTART:20260910T140000Z', 'DTEND:20260910T160000Z',
  'END:VEVENT',
  'BEGIN:VTODO',
  'UID:a1@x', 'SUMMARY:Protokoll abgeben',
  'DUE:20260912T235900Z', 'STATUS:NEEDS-ACTION',
  'PERCENT-COMPLETE:40', 'PRIORITY:1',
  'DESCRIPTION:Mit Messwerten aus Versuch 3',
  'END:VTODO',
  'BEGIN:VTODO',
  'UID:a2@x', 'SUMMARY:Steuererklärung',
  'STATUS:NEEDS-ACTION',
  'END:VTODO',
  'BEGIN:VTODO',
  'UID:a3@x', 'SUMMARY:Bücher zurückgeben',
  'DUE:20260901T120000Z', 'STATUS:COMPLETED',
  'COMPLETED:20260831T090000Z', 'PERCENT-COMPLETE:100',
  'END:VTODO',
  'END:VCALENDAR'
].join('\r\n');

const gelesen = await pc.evaluate((ics: string) => {
  const k = Kalender.icsLesen(ics);
  const ohne = Kalender.icsLesen([
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:n1@x', 'SUMMARY:Nur ein Termin',
    'DTSTART:20260910T140000Z', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n'));
  return {
    name: k.name,
    termine: k.termine.map((t: any) => t.titel),
    aufgaben: k.aufgaben.map((a: any) => ({
      titel: a.titel, faellig: a.faellig || '', fertig: !!a.fertig,
      anteil: a.anteil, prio: a.prioritaet, art: a.art,
      text: a.text || '', start: a.start || ''
    })),
    ohneAufgaben: ohne.aufgaben.length,
    ohneTermine: ohne.termine.length
  };
}, ICS);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Eine VTODO wird gelesen');

gleich('Drei Aufgaben gefunden', gelesen.aufgaben.length, 3);
gleich('Mit ihren Titeln',
  gelesen.aufgaben.map((a: any) => a.titel),
  ['Protokoll abgeben', 'Steuererklärung', 'Bücher zurückgeben']);
gleich('Die Frist kommt aus DUE, nicht aus DTSTART',
  gelesen.aufgaben[0].faellig, '2026-09-13T01:59');
gleich('Anteil und Priorität stehen da',
  [gelesen.aufgaben[0].anteil, gelesen.aufgaben[0].prio], [40, 1]);
p('Und die Beschreibung', /Messwerten aus Versuch 3/.test(gelesen.aufgaben[0].text));

/* Nur COMPLETED heisst fertig — CANCELLED heisst abgesagt, IN-PROCESS
   heisst angefangen. */
gleich('Erledigt ist nur, was COMPLETED sagt',
  gelesen.aufgaben.map((a: any) => a.fertig), [false, false, true]);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Sie landet NICHT unter den Terminen');

/* EINE AUFGABE IST KEIN TERMIN. Sie mit `start` in die Kalendertabelle zu
   schreiben hiesse, sie als Verabredung auszugeben — dieselbe stille
   Falschaussage, die E290 beim Kalender abgeräumt hat. */
gleich('Der Kalender hat genau einen Termin', gelesen.termine, ['Elektro-Praktikum']);
p('Und jede Aufgabe trägt ihre Art',
  gelesen.aufgaben.every((a: any) => a.art === 'aufgabe'),
  JSON.stringify(gelesen.aufgaben.map((a: any) => a.art)));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Eine Aufgabe ohne Frist ist trotzdem eine Aufgabe');

/* „Steuererklärung" ohne Frist ist eine gültige Aufgabe; ein Termin ohne
   Anfang ist keiner. Deshalb prüft der Leser bei VTODO auf den Titel und
   nicht auf `start` — sonst wäre sie durchgefallen wie vorher. */
gleich('Sie ist dabei', gelesen.aufgaben[1].titel, 'Steuererklärung');
gleich('Und hat weder Frist noch Anfang',
  [gelesen.aufgaben[1].faellig, gelesen.aufgaben[1].start], ['', '']);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die Felder trennen sich');

/* `DUE` gehört der Aufgabe. Stünde es in einem VEVENT, dürfte es dort
   nichts setzen — sonst wanderte ein Feld über die Artgrenze. */
const getrennt = await pc.evaluate(() => {
  const k = Kalender.icsLesen([
    'BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:e@x', 'SUMMARY:Termin',
    'DTSTART:20260910T140000Z', 'DUE:20260911T100000Z',
    'PERCENT-COMPLETE:50', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n'));
  return { faellig: k.termine[0].faellig, anteil: k.termine[0].anteil };
});
gleich('DUE in einem Termin setzt nichts', getrennt.faellig, undefined);
gleich('PERCENT-COMPLETE auch nicht', getrennt.anteil, undefined);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: ohne VTODO eine leere Liste');

gleich('Kein VTODO, keine Aufgaben', gelesen.ohneAufgaben, 0);
gleich('Der Termin kommt trotzdem an', gelesen.ohneTermine, 1);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Und das Banner ist LESBAR');

/* DER ERSTE WURF DIESES ABSCHNITTS WAR BLIND, und das ist die eigentliche
   Geschichte von E326.
 *
 * Er mass, ob `.banner.info` einen Hintergrund hat, nachdem in
 * `ansichten.css` eine Regel dafür geschrieben worden war. Grün. Nur:
 * `.banner.info` GAB ES SCHON — in `bausteine.css`, die später lädt
 * (index.html Zeile 68 gegen 61) und bei gleicher Stärke gewinnt. Die neue
 * Regel war tot, und die Prüfung wäre auch ohne sie grün gewesen. L111 zum
 * vierten Mal.
 *
 * Gefunden hat es das BILD (§55.1): die Schrift im blauen Streifen war
 * blau, die in den anderen beiden weiss. Nachgemessen war das kein
 * Schönheitsfehler, sondern 3.11:1 im dunklen Thema — unter den 4.5, die
 * §38 für Fliesstext verlangt.
 *
 * Gemessen wird deshalb jetzt der KONTRAST, in beiden Themen. Der Wert
 * KANN rot werden: vor der Änderung war er 3.11. */
const kontraste = await pc.evaluate(() => {
  const zahlen = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const helligkeit = (c: number[]) => {
    const f = c.map(v => { const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * (f[0] || 0) + 0.7152 * (f[1] || 0) + 0.0722 * (f[2] || 0);
  };
  const verhaeltnis = (vorn: string, hinten: string) => {
    const A = helligkeit(zahlen(vorn)), B = helligkeit(zahlen(hinten));
    return Math.round(((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)) * 100) / 100;
  };
  document.getElementById('banner')?.remove();
  const vorher = document.documentElement.dataset.theme;
  const erg: any = {};
  for (const thema of ['dark', 'light']) {
    document.documentElement.dataset.theme = thema;
    const z: any = {};
    for (const art of ['', 'info', 'warn', 'fehler']) {
      const d = document.createElement('div');
      d.className = ('banner ' + art).trim();
      d.textContent = 'Probe';
      document.body.appendChild(d);
      const c = getComputedStyle(d);
      z[art || 'nackt'] = { bg: c.backgroundColor, schrift: c.color,
                            k: verhaeltnis(c.color, c.backgroundColor) };
      d.remove();
    }
    erg[thema] = z;
  }
  if (vorher) document.documentElement.dataset.theme = vorher;
  else delete document.documentElement.dataset.theme;
  return erg;
});

const durchsichtig = (f: string) => /rgba\(0, 0, 0, 0\)|transparent/.test(f);

p('Ein nacktes Banner hat wirklich keinen Hintergrund',
  durchsichtig(kontraste.dark.nackt.bg), kontraste.dark.nackt.bg);
p('`info` hat einen — und einen ANDEREN als `warn`',
  !durchsichtig(kontraste.dark.info.bg) &&
  kontraste.dark.info.bg !== kontraste.dark.warn.bg,
  kontraste.dark.info.bg + ' gegen ' + kontraste.dark.warn.bg);

/* §38: Kontrast im Hell- UND Dunkelmodus. 4.5 ist die Schwelle für
   Fliesstext; das Banner ist 13.5 px und normal fett, also gilt sie. */
for (const thema of ['dark', 'light'] as const)
  for (const art of ['info', 'warn', 'fehler'] as const)
    p(`Kontrast ${art} im ${thema === 'dark' ? 'dunklen' : 'hellen'} Thema reicht`,
      kontraste[thema][art].k >= 4.5,
      `${kontraste[thema][art].k}:1 — ${kontraste[thema][art].schrift} auf ` +
      `${kontraste[thema][art].bg}`);

/* GEGENPROBE ZUR REGEL SELBST: `info` darf nicht blasser sein als die
   beiden anderen. Genau das war der Fund — 3.11 gegen 6.65 und 8.31. */
p('Und `info` ist nicht die blasseste der drei',
  kontraste.dark.info.k >= Math.min(kontraste.dark.warn.k, kontraste.dark.fehler.k) - 0.01,
  `info ${kontraste.dark.info.k}, warn ${kontraste.dark.warn.k}, ` +
  `fehler ${kontraste.dark.fehler.k}`);

/* UND DIE TOTE REGEL DARF NICHT ZURÜCKKEHREN. Eine `.banner.info` in
   `ansichten.css` sähe richtig aus und änderte nichts. */
const ansichten = fs.readFileSync(
  path.join(WURZEL, 'quell/schale/stil/ansichten.css'), 'utf-8');
p('Keine tote `.banner.info`-Regel in der früher ladenden Datei',
  !/^\s*\.banner\.info\s*\{/m.test(ansichten),
  'ansichten.css lädt vor bausteine.css und verlöre bei gleicher Stärke');

/* Und im Quelltext: der Hinweis kommt nur, wenn es Aufgaben gibt. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/verbinden/kalender.ts'), 'utf-8');
p('Der Hinweis steht hinter einer Bedingung, nicht davor',
  /if \(offeneAufgaben\)\s*\n\s*UI\.banner/.test(quelle),
  'kein `if (offeneAufgaben)` vor dem Banner');

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
