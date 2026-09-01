/* Suite 284 — Wiederholungsregeln, die wirklich gelesen werden (E290, L102)
 * ============================================================================
 * Der Anlass ist ein FALSCHES Datum, nicht ein fehlendes.
 *
 * `verbinden/kalender.ts:145` liest aus einer Regel vier Teile: FREQ,
 * INTERVAL, UNTIL, COUNT. Alles andere fällt still weg. Für
 *
 *     RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
 *
 * heisst das: aus drei Terminen je Woche wird EINER. §1 misst das an der
 * EINGEBAUTEN alten Funktion — der Fehler wird vorgeführt, nicht behauptet.
 *
 *   §1 DER ECHTE WEG — der Import selbst, nicht nur der neue Kern.
 *   §2 BYDAY wöchentlich — der Stundenplan.
 *   §3 BYDAY mit Ordnungszahl — „zweiter Dienstag", „letzter Freitag".
 *   §4 BYMONTHDAY, auch von hinten gezählt.
 *   §5 BYSETPOS — „letzter Werktag im Monat".
 *   §6 COUNT zählt ERZEUGTE Termine, UNTIL schliesst ein.
 *   §7 EXDATE streicht, RDATE legt dazu.
 *   §8 INTERVAL und WKST.
 *   §9 WAS NICHT VERSTANDEN WIRD, WIRD GENANNT.
 *  §10 Der 31. in einem Monat ohne 31. fällt AUS, statt zu wandern.
 *
 *   node pruefungen/lauf/test284.mts
 * ==========================================================================*/
declare const Store: any; declare const Wiederholung: any; declare const Kalender: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9065;

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

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof (globalThis as any).Wiederholung !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(900);

/* Ein fester Bezugspunkt: Montag, 3. August 2026. */
const MONTAG = '2026-08-03T09:00';


const roll = (start: string, regel: string, opt: any = {}) =>
  seite.evaluate(({ s, r, o }: any) =>
    Wiederholung.ausrollen(s, r, { jetzt: Date.parse('2026-08-01T00:00:00'),
                                   bisTage: 400, ...o }),
    { s: start, r: regel, o: opt }) as Promise<any>;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der echte Weg — nicht nur der neue Kern');

const alt = await seite.evaluate(() => {
  if (typeof Kalender === 'undefined' || !Kalender.wiederholungen)
    return { da: false };
  const termin = { start: '2026-08-03T09:00', ende: '', ganzerTag: false,
                   titel: 'Unterricht', regel: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' };
  const raus = Kalender.wiederholungen(termin, 28);
  const tage = raus.map((t: any) => new Date(t.start).getDay());
  /* Wie viele je Wochentag. Die Zahl selbst hängt vom heutigen Datum ab
     (`bisTage` zählt ab jetzt, so war es auch vorher) — die VERTEILUNG
     nicht, und die ist der Beweis. */
  const jeTag: Record<string, number> = {};
  for (const t of tage) jeTag[String(t)] = (jeTag[String(t)] || 0) + 1;
  const zahlen = Object.values(jeTag);
  return { da: true, zahl: raus.length,
           wochentage: [...new Set(tage)].sort(),
           jeTag,
           gleichmaessig: Math.max(...zahlen) - Math.min(...zahlen) <= 1 };
}) as any;

/* Dieser Abschnitt misst `Kalender.wiederholungen` — die Funktion, die der
   ICS-Import WIRKLICH aufruft (kalender.ts:364 und :596). Der reine Kern
   allein zu prüfen sagte nichts darüber, ob die Reparatur beim Nutzer
   ankommt; genau diese Verdrahtung war der Fehler.

   BIS E290 STAND HIER: Wochentage = [1]. Aus `BYDAY=MO,WE,FR` wurde ein
   einziger Wochentag, der des Starts. Der Abschnitt KONNTE also rot werden
   — er WAR es, und der Beweis dafür ist, dass er beim Umbau von rot auf
   grün gekippt ist (§55.2). */
if (!alt.da) {
  p('Der echte Weg ist von aussen erreichbar', false,
    'Kalender.wiederholungen fehlt — dann prüft §1 nichts');
} else {
  p('Der echte Weg erzeugt Termine', alt.zahl > 0, String(alt.zahl));
  p('… und zwar an DREI Wochentagen — bis E290 war es einer',
    JSON.stringify(alt.wochentage) === '[1,3,5]',
    'Wochentage: ' + JSON.stringify(alt.wochentage));
  p('… und ungefähr gleich oft je Wochentag — nicht dreimal derselbe',
    alt.gleichmaessig === true, JSON.stringify(alt.jeTag));
  p('… also rund dreimal so viele Termine wie vorher',
    alt.zahl >= 3 * Math.max(...Object.values(alt.jeTag as Record<string, number>)) - 2,
    alt.zahl + ' Termine, ' + JSON.stringify(alt.jeTag));
}

/* ------------------------------------------------------------------------ */
console.log('\n2 · BYDAY wöchentlich — der Stundenplan');

const stunden = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=9');
const wochentage = await seite.evaluate((liste: string[]) =>
  [...new Set(liste.map(s => new Date(s).getDay()))].sort(), stunden.termine) as number[];

p('Neun Termine, wie COUNT sagt', stunden.termine.length === 9,
  String(stunden.termine.length));
p('… an drei Wochentagen: Mo, Mi, Fr',
  JSON.stringify(wochentage) === '[1,3,5]', JSON.stringify(wochentage));
p('Der erste ist der Starttag', stunden.termine[0] === '2026-08-03T09:00',
  stunden.termine[0]);
p('Der dritte ist der Freitag derselben Woche',
  stunden.termine[2] === '2026-08-07T09:00', stunden.termine[2]);
p('Der vierte springt in die nächste Woche',
  stunden.termine[3] === '2026-08-10T09:00', stunden.termine[3]);
p('Die Uhrzeit bleibt', stunden.termine.every((t: string) => t.endsWith('T09:00')),
  stunden.termine.slice(0, 3).join(' '));
p('Und nichts wird gemeldet, was nicht verstanden wurde',
  stunden.nichtVerstanden.length === 0 && stunden.satz === '',
  JSON.stringify(stunden.nichtVerstanden) + ' / ' + stunden.satz);

/* ------------------------------------------------------------------------ */
console.log('\n3 · BYDAY mit Ordnungszahl');

const zweiterDi = await roll('2026-08-11T18:00', 'FREQ=MONTHLY;BYDAY=2TU;COUNT=4');
const letzterFr = await roll('2026-08-28T18:00', 'FREQ=MONTHLY;BYDAY=-1FR;COUNT=4');

p('Der zweite Dienstag im August 2026 ist der 11.',
  zweiterDi.termine[0] === '2026-08-11T18:00', zweiterDi.termine[0]);
p('… im September der 8.', zweiterDi.termine[1] === '2026-09-08T18:00',
  zweiterDi.termine[1]);
p('… im Oktober der 13.', zweiterDi.termine[2] === '2026-10-13T18:00',
  zweiterDi.termine[2]);
p('Der letzte Freitag im August 2026 ist der 28.',
  letzterFr.termine[0] === '2026-08-28T18:00', letzterFr.termine[0]);
p('… im September der 25.', letzterFr.termine[1] === '2026-09-25T18:00',
  letzterFr.termine[1]);
p('… im Oktober der 30.', letzterFr.termine[2] === '2026-10-30T18:00',
  letzterFr.termine[2]);

/* ------------------------------------------------------------------------ */
console.log('\n4 · BYMONTHDAY, auch von hinten');

const fuenfzehnter = await roll('2026-08-15T08:00', 'FREQ=MONTHLY;BYMONTHDAY=15;COUNT=3');
const letzterTag = await roll('2026-08-31T23:00', 'FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=4');

p('Jeden 15.', letzterTag.termine.length > 0 &&
  fuenfzehnter.termine.join(',') === '2026-08-15T08:00,2026-09-15T08:00,2026-10-15T08:00',
  fuenfzehnter.termine.join(','));
p('Der LETZTE Tag im August ist der 31.',
  letzterTag.termine[0] === '2026-08-31T23:00', letzterTag.termine[0]);
p('… im September der 30. — nicht wieder der 31.',
  letzterTag.termine[1] === '2026-09-30T23:00', letzterTag.termine[1]);
p('… und im Februar 2027 der 28.',
  letzterTag.termine.some((t: string) => t.startsWith('2027-02-28')) ||
  letzterTag.termine.length < 7, letzterTag.termine.join(','));

/* ------------------------------------------------------------------------ */
console.log('\n5 · BYSETPOS — der letzte Werktag im Monat');

const werktag = await roll('2026-08-31T17:00',
  'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=4');

p('August 2026 endet an einem Montag, dem 31.',
  werktag.termine[0] === '2026-08-31T17:00', werktag.termine[0]);
p('September endet am Mittwoch, dem 30.',
  werktag.termine[1] === '2026-09-30T17:00', werktag.termine[1]);
p('Oktober endet am Samstag — also zählt der Freitag, der 30.',
  werktag.termine[2] === '2026-10-30T17:00', werktag.termine[2]);

/* ------------------------------------------------------------------------ */
console.log('\n6 · COUNT zählt Termine, UNTIL schliesst ein');

const gezaehlt = await roll(MONTAG, 'FREQ=DAILY;COUNT=5');
const bis = await roll(MONTAG, 'FREQ=DAILY;UNTIL=20260807T235959Z');
const bisGenau = await roll(MONTAG, 'FREQ=DAILY;UNTIL=20260806T090000Z');

p('COUNT=5 gibt genau fünf', gezaehlt.termine.length === 5,
  String(gezaehlt.termine.length));
p('… und zwar den Start plus vier',
  gezaehlt.termine[0] === '2026-08-03T09:00' &&
  gezaehlt.termine[4] === '2026-08-07T09:00', gezaehlt.termine.join(','));
p('UNTIL am 7. gibt fünf Termine (3. bis 7.)', bis.termine.length === 5,
  String(bis.termine.length) + ': ' + bis.termine.join(','));
p('UNTIL SCHLIESST den Endtag ein',
  bisGenau.termine[bisGenau.termine.length - 1] === '2026-08-06T09:00',
  bisGenau.termine.join(','));

/* ------------------------------------------------------------------------ */
console.log('\n7 · EXDATE streicht, RDATE legt dazu');

const ohne = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=MO;COUNT=4',
  { exdate: ['20260810T090000'] });
const mit = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=MO;COUNT=2',
  { rdate: ['20260812T140000'] });
const beides = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=MO;COUNT=4',
  { exdate: ['20260810T090000'], rdate: ['20260810T140000'] });

p('Ohne EXDATE wären es vier Montage; mit einem gestrichenen sind es drei',
  ohne.termine.length === 3, ohne.termine.join(','));
p('… und der 10. August ist wirklich weg',
  !ohne.termine.some((t: string) => t.startsWith('2026-08-10')),
  ohne.termine.join(','));
p('RDATE legt einen Termin dazu, der nicht zur Regel passt',
  mit.termine.length === 3 &&
  mit.termine.some((t: string) => t.startsWith('2026-08-12')),
  mit.termine.join(','));
p('EXDATE gewinnt gegen RDATE am selben Tag — eine Absage ist eine Absage',
  !beides.termine.some((t: string) => t.startsWith('2026-08-10')),
  beides.termine.join(','));

/* ------------------------------------------------------------------------ */
console.log('\n8 · INTERVAL und WKST');

const zweiWoechig = await roll(MONTAG, 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;COUNT=3');
const jederZweiteTag = await roll(MONTAG, 'FREQ=DAILY;INTERVAL=2;COUNT=3');
const zweiMonate = await roll('2026-08-05T10:00', 'FREQ=MONTHLY;INTERVAL=2;COUNT=3');

p('Jede zweite Woche: 3., 17., 31. August',
  zweiWoechig.termine.join(',') ===
  '2026-08-03T09:00,2026-08-17T09:00,2026-08-31T09:00',
  zweiWoechig.termine.join(','));
p('Jeder zweite Tag: 3., 5., 7.',
  jederZweiteTag.termine.join(',') ===
  '2026-08-03T09:00,2026-08-05T09:00,2026-08-07T09:00',
  jederZweiteTag.termine.join(','));
p('Jeder zweite Monat: August, Oktober, Dezember',
  zweiMonate.termine.join(',') ===
  '2026-08-05T10:00,2026-10-05T10:00,2026-12-05T10:00',
  zweiMonate.termine.join(','));

/* ------------------------------------------------------------------------ */
console.log('\n9 · Was nicht verstanden wird, wird GENANNT');

const unbekannt = await roll(MONTAG, 'FREQ=WEEKLY;BYWEEKNO=3;BYDAY=MO;COUNT=2');
const kaputt = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=XX,MO;COUNT=2');
const sauber = await roll(MONTAG, 'FREQ=WEEKLY;BYDAY=MO;COUNT=2');

p('BYWEEKNO wird nicht ausgewertet — und das steht da',
  unbekannt.nichtVerstanden.indexOf('BYWEEKNO') >= 0,
  JSON.stringify(unbekannt.nichtVerstanden));
p('… mit einem Satz im Klartext',
  /kennt Redion nicht/.test(unbekannt.satz), unbekannt.satz);
p('… und die verstandenen Teile wirken trotzdem',
  unbekannt.termine.length === 2, unbekannt.termine.join(','));
p('Ein kaputter Wochentag wird einzeln genannt',
  unbekannt.nichtVerstanden.length > 0 &&
  kaputt.nichtVerstanden.some((x: string) => x.indexOf('XX') >= 0),
  JSON.stringify(kaputt.nichtVerstanden));
p('… und der gute Wochentag bleibt', kaputt.termine.length === 2,
  kaputt.termine.join(','));
p('GEGENPROBE: eine gewöhnliche Regel meldet NICHTS — sonst wird der Hinweis überlesen',
  sauber.nichtVerstanden.length === 0 && sauber.satz === '',
  JSON.stringify(sauber.nichtVerstanden) + ' / „' + sauber.satz + '"');

/* ------------------------------------------------------------------------ */
console.log('\n10 · Der 31. in einem Monat ohne 31. fällt AUS');

const einunddreissigster = await roll('2026-01-31T12:00', 'FREQ=MONTHLY;COUNT=4',
  { jetzt: Date.parse('2026-01-01T00:00:00'), bisTage: 400 });

p('Der 31. Januar ist dabei',
  einunddreissigster.termine[0] === '2026-01-31T12:00',
  einunddreissigster.termine[0]);
p('Der Februar wird ÜBERSPRUNGEN, nicht auf den 3. März verschoben',
  !einunddreissigster.termine.some((t: string) => t.startsWith('2026-02') ||
                                                  t.startsWith('2026-03-0')),
  einunddreissigster.termine.join(','));
p('Der nächste ist der 31. März',
  einunddreissigster.termine[1] === '2026-03-31T12:00',
  einunddreissigster.termine.join(','));

/* ------------------------------------------------------------------------ */
console.log('\n11 · Ganztägig und kaputte Eingaben');

const ganz = await roll('2026-08-03', 'FREQ=WEEKLY;BYDAY=MO;COUNT=2', { ganzerTag: true });
const ohneRegel = await roll(MONTAG, '');
const unsinn = await roll(MONTAG, 'FREQ=BLUBB;COUNT=3');
const keinStart = await roll('quatsch', 'FREQ=DAILY;COUNT=3');

p('Ganztägige Termine haben keine Uhrzeit im Text',
  ganz.termine.every((t: string) => t.length === 10), ganz.termine.join(','));
p('Ohne Regel bleibt es bei einem Termin', ohneRegel.termine.length === 1,
  ohneRegel.termine.join(','));
p('Ein unbekanntes FREQ ergibt auch einen einzelnen — und keine Schleife',
  unsinn.termine.length === 1, unsinn.termine.join(','));
p('Ein unlesbarer Start ergibt gar nichts und sagt es',
  keinStart.termine.length === 0 && keinStart.satz.length > 5, keinStart.satz);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
