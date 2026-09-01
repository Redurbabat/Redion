/* Suite 329 — Jede Stunde dauert 90 Minuten (E337)
 * ============================================================================
 * Gefunden beim Nachmessen des Rundlaufs für L106 Punkt 8, und es war
 * grösser als die Lücke, die gesucht wurde:
 *
 *     `RRULE:FREQ=WEEKLY;COUNT=5`, DTSTART 8:00, DTEND 9:30.
 *     `icsLesen` liest das Ende richtig.
 *     `wiederholungen` warf es weg — für ALLE fünf Folgen,
 *     auch für die erste, bei der es gestimmt hätte.
 *
 * Im Stundenplan stand jede Stunde ohne Dauer. Wer ihn exportierte, gab
 * Termine ohne `DTEND` ab, und jeder empfangende Kalender rät sich dann
 * etwas zurecht.
 *
 * DER ALTE GRUND WAR EIN GUTER: `DTEND` in einer Reihe ist ein absoluter
 * Zeitpunkt und gilt nur für die erste Folge. Ihn auf alle fünf zu
 * schreiben hiesse, dass die Stunde am 5. Oktober am 7. SEPTEMBER endet —
 * schlimmer als gar kein Ende. Nur ist „gar kein Ende" auch falsch. In ICS
 * wiederholt sich nicht das Ende, sondern die DAUER.
 *
 *   §1 DIE DAUER-RECHNUNG einzeln, mit allem was schiefgehen kann.
 *   §2 FÜNF STUNDEN, fünfmal 90 Minuten.
 *   §3 `DURATION` STATT `DTEND` — der Zwilling, den manche Kalender
 *      schreiben.
 *   §4 GANZTÄGIG über mehrere Tage.
 *   §5 GEGENPROBE: ohne jede Angabe bleibt das Ende leer, statt eines
 *      erfundenen.
 *   §6 UND DER EXPORT gibt die Dauer wieder heraus.
 *
 *   node pruefungen/lauf/test329.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9332;

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
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 },
                                   timezoneId: 'Europe/Berlin' });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);
await pc.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Dauer-Rechnung, einzeln');

const rechnung = await pc.evaluate(() => {
  const K = (globalThis as any).Kalender;
  const M = 60000, H = 3600000, T = 86400000;
  return {
    /* DURATION in allen Formen, die ICS kennt. */
    eineinhalbStunden: K.dauerInMs('PT1H30M'),
    dreiviertel:       K.dauerInMs('PT45M'),
    einTag:            K.dauerInMs('P1D'),
    eineWoche:         K.dauerInMs('P1W'),
    tagUndZweiStunden: K.dauerInMs('P1DT2H'),
    kleinGeschrieben:  K.dauerInMs('pt1h30m'),
    mitLuft:           K.dauerInMs('  PT1H30M  '),
    /* UND WAS KEINE DAUER IST. Jede einzeln, weil ein Sammelmuster auch
       dann grün wäre, wenn nur eine davon fällt. */
    leer:      K.dauerInMs(''),
    unsinn:    K.dauerInMs('bald'),
    nullZeit:  K.dauerInMs('PT0S'),
    negativ:   K.dauerInMs('-PT15M'),
    nichts:    K.dauerInMs(null),
    /* Und die Länge aus Anfang und Ende. */
    ausEnde: K.terminLaenge({ start: '2026-09-07T10:00', ende: '2026-09-07T11:30' }),
    ausDauer: K.terminLaenge({ start: '2026-09-07T10:00', dauer: 'PT1H30M' }),
    /* ENDE VOR ANFANG IST KEINE LÄNGE, sondern eine kaputte Datei. */
    verdreht: K.terminLaenge({ start: '2026-09-07T11:30', ende: '2026-09-07T10:00' }),
    ohneAlles: K.terminLaenge({ start: '2026-09-07T10:00' }),
    einheiten: { M, H, T }
  };
});

gleich('`PT1H30M` sind 90 Minuten', rechnung.eineinhalbStunden, 90 * 60000);
gleich('`PT45M` sind 45', rechnung.dreiviertel, 45 * 60000);
gleich('`P1D` ist ein Tag', rechnung.einTag, 86400000);
gleich('`P1W` sind sieben', rechnung.eineWoche, 7 * 86400000);
gleich('`P1DT2H` sind 26 Stunden', rechnung.tagUndZweiStunden, 26 * 3600000);
gleich('Kleingeschrieben zählt auch', rechnung.kleinGeschrieben, 90 * 60000);
gleich('Und Leerzeichen stören nicht', rechnung.mitLuft, 90 * 60000);
gleich('Leer ist keine Dauer', rechnung.leer, null);
gleich('Unsinn auch nicht', rechnung.unsinn, null);
/* NULL IST WIE KEINE ANGABE und nicht wie „dauert null". */
gleich('`PT0S` ist keine Dauer', rechnung.nullZeit, null);
/* NEGATIVE DAUERN GIBT ES IN ICS, aber nur für Erinnerungen. */
gleich('Und eine negative erst recht nicht', rechnung.negativ, null);
gleich('`null` gibt `null`', rechnung.nichts, null);
gleich('Aus Anfang und Ende: 90 Minuten', rechnung.ausEnde, 90 * 60000);
gleich('Aus `DURATION`: dieselben 90', rechnung.ausDauer, 90 * 60000);
gleich('Ende vor Anfang ist keine Länge', rechnung.verdreht, null);
gleich('Und ohne beides auch nicht', rechnung.ohneAlles, null);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Fünf Stunden, fünfmal 90 Minuten');

const stunden = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  return r.map((x: any) => ({ s: x.start, e: x.ende }));
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:m@s', 'SUMMARY:Mathematik',
    'DTSTART:20260907T080000Z', 'DTEND:20260907T093000Z',
    'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=5', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));

gleich('Fünf Folgen', stunden.length, 5);
gleich('Die erste behält ihr gelesenes Ende wörtlich',
  stunden[0], { s: '2026-09-07T10:00', e: '2026-09-07T11:30' });
/* DAS IST DER FEHLER, DEN E337 ABRÄUMT. Vorher stand hier fünfmal `''`. */
gleich('Und die fünfte endet an IHREM Tag, nicht am ersten',
  stunden[4], { s: '2026-10-05T10:00', e: '2026-10-05T11:30' });
p('Jede einzelne dauert 90 Minuten',
  stunden.every((x: any) => x.e &&
    new Date(x.e).getTime() - new Date(x.s).getTime() === 90 * 60000),
  JSON.stringify(stunden));

/* ------------------------------------------------------------------------ */
console.log('\n3 · `DURATION` statt `DTEND`');

/* ICS ERLAUBT GENAU EINES VON BEIDEN, und manche Kalender schreiben lieber
   die Dauer. Ohne diesen Weg wären ihre Termine weiterhin ohne Ende. */
const mitDauer = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  return r.map((x: any) => ({ s: x.start, e: x.ende }));
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:d@s', 'SUMMARY:Deutsch',
    'DTSTART:20260908T060000Z', 'DURATION:PT45M',
    'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));

gleich('Drei Folgen', mitDauer.length, 3);
gleich('Die erste dauert 45 Minuten',
  mitDauer[0], { s: '2026-09-08T08:00', e: '2026-09-08T08:45' });
gleich('Und die dritte auch',
  mitDauer[2], { s: '2026-09-22T08:00', e: '2026-09-22T08:45' });

/* ------------------------------------------------------------------------ */
console.log('\n4 · Ganztägig über mehrere Tage');

/* EIN DATUM OHNE UHRZEIT IST WELTZEIT, in beide Richtungen. Rechnete man
   hier mit Ortszeit-Gettern, läge das Ergebnis je nach Zeitzone einen Tag
   daneben — in Berlin nach vorn, in New York nach hinten. */
const ganz = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  return { gelesen: { s: g.termine[0].start, e: g.termine[0].ende,
                      ganzerTag: g.termine[0].ganzerTag },
           folgen: r.map((x: any) => ({ s: x.start, e: x.ende })) };
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:f@s', 'SUMMARY:Projektwoche',
    'DTSTART;VALUE=DATE:20260907', 'DTEND;VALUE=DATE:20260910',
    'RRULE:FREQ=MONTHLY;COUNT=3', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));

p('Sie wird als ganztägig gelesen', ganz.gelesen.ganzerTag === true,
  JSON.stringify(ganz.gelesen));
/* `DTEND` ZEIGT BEI GANZTÄGIGEN AUF DEN TAG DANACH — `icsLesen` zieht das
   seit jeher einen Tag zurück, sonst verwirrt es jeden, der es sieht. */
gleich('Vom 7. bis zum 9.',
  { s: ganz.gelesen.s, e: ganz.gelesen.e },
  { s: '2026-09-07', e: '2026-09-09' });
gleich('Drei Folgen', ganz.folgen.length, 3);
gleich('Die zweite geht vom 7.10. bis zum 9.10.',
  ganz.folgen[1], { s: '2026-10-07', e: '2026-10-09' });
gleich('Und die dritte vom 7.11. bis zum 9.11.',
  ganz.folgen[2], { s: '2026-11-07', e: '2026-11-09' });

/* UND DASSELBE WESTLICH VON GREENWICH — sonst misst der Abschnitt die
   Behauptung gar nicht. Belegt: rechnet man ganztägig mit Ortszeit-Gettern
   statt in Weltzeit, bleibt Berlin grün (UTC-Mitternacht ist dort 2 Uhr
   morgens desselben Tages) und New York fällt um einen Tag zurück
   (dort ist es 20 Uhr am Vortag). Eine Prüfung, die nur an einem Ort
   misst, misst die halbe Erde nicht. */
const westen = await browser.newPage({ viewport: { width: 1280, height: 900 },
                                       timezoneId: 'America/New_York' });
westen.on('pageerror', e => fehler.push('PAGEERROR-West: ' + e.message.slice(0, 160)));
await westen.goto(`http://localhost:${PORT}/index.html`);
await westen.waitForTimeout(2600);
const ganzWest = await westen.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  return { zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
           folgen: r.map((x: any) => ({ s: x.start, e: x.ende })) };
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:f@s', 'SUMMARY:Projektwoche',
    'DTSTART;VALUE=DATE:20260907', 'DTEND;VALUE=DATE:20260910',
    'RRULE:FREQ=MONTHLY;COUNT=3', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));
await westen.close();

gleich('Die zweite Seite steht wirklich in New York',
  ganzWest.zone, 'America/New_York');
gleich('Auch dort geht die zweite vom 7.10. bis zum 9.10.',
  ganzWest.folgen[1], { s: '2026-10-07', e: '2026-10-09' });
gleich('Und die dritte vom 7.11. bis zum 9.11.',
  ganzWest.folgen[2], { s: '2026-11-07', e: '2026-11-09' });

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: ohne Angabe kein erfundenes Ende');

/* EINE ANGABE, DIE IMMER DASTEHT, IST KEINE. Ein Termin ohne `DTEND` und
   ohne `DURATION` hat kein Ende — dann steht dort auch keins, und nicht
   „dauert eine Stunde", was jeder Kalender anders rät. */
const ohne = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  return r.map((x: any) => ({ s: x.start, e: x.ende }));
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:o@s', 'SUMMARY:Ohne Ende',
    'DTSTART:20260907T080000Z',
    'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));

gleich('Drei Folgen', ohne.length, 3);
p('Und keine davon hat ein Ende', ohne.every((x: any) => x.e === ''),
  JSON.stringify(ohne));

/* ------------------------------------------------------------------------ */
console.log('\n6 · Und der Export gibt die Dauer wieder heraus');

const rund = await pc.evaluate(async (ics: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(ics); const r: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => r.push(x)));
  const s = Store.addPage(null, { text: 'Rundlauf' });
  const coll = K.zielDatenbank(s.id, 'Termine rundlauf');
  K.uebernehmen(coll, r, 'Schule');
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  const zurueck = K.icsLesen(raus);
  return { vevents: (raus.match(/BEGIN:VEVENT/g) || []).length,
           dtends: (raus.match(/^DTEND/gm) || []).length,
           zurueck: zurueck.termine.map((t: any) => ({ s: t.start, e: t.ende })) };
}, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:m@s', 'SUMMARY:Mathematik',
    'DTSTART:20260907T080000Z', 'DTEND:20260907T093000Z',
    'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=5', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'));

gleich('Fünf Termine gehen hinaus', rund.vevents, 5);
/* VORHER WAR DAS NULL. Jede Stunde ging ohne Ende hinaus, und jeder
   empfangende Kalender riet sich etwas zurecht. */
gleich('Und jeder mit seinem Ende', rund.dtends, 5);
p('Nach dem Zurücklesen dauert jede wieder 90 Minuten',
  rund.zurueck.length === 5 && rund.zurueck.every((x: any) => x.e &&
    new Date(x.e).getTime() - new Date(x.s).getTime() === 90 * 60000),
  JSON.stringify(rund.zurueck));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
