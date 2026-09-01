/* Suite 336 — Eine fremde Zeitzone (L106 Punkt 5, E344)
 * ============================================================================
 * Eine ICS-Zeile sieht so aus:
 *
 *     DTSTART;TZID=America/New_York:20260907T080000
 *
 * Bis E344 las Redion daraus `2026-09-07T08:00` und zeigte 8 Uhr an. Für
 * jemanden in Berlin ist dieser Termin um 14 Uhr. SECHS STUNDEN FALSCH, ohne
 * ein Wort — die Sorte stiller Fehler, die §46 an erste Stelle setzt.
 *
 * L106 nannte es „bewusst so", weil „eine halbe Zeitzonenrechnung schlimmer
 * ist als keine". Der Satz stimmt. Die GANZE Rechnung ist nur seit Jahren im
 * Browser eingebaut, samt vollständiger IANA-Datenbank.
 *
 *   §1 DIE RECHNUNG SELBST — Versatz, Sommerzeit, beide Richtungen.
 *   §2 DIE UMSTELLUNGSNACHT. Ohne den zweiten Durchgang ist sie eine Stunde
 *      daneben; das ist genau die halbe Rechnung, vor der L106 warnt.
 *   §3 DER TERMIN KOMMT RICHTIG AN — dieselbe Seite, zwei Zonen.
 *   §4 DER NORMALFALL BLEIBT UNBERÜHRT. Ohne TZID ändert sich nichts, mit
 *      `Z` auch nicht. Die Gegenprobe zu §3.
 *   §5 EINE UNBEKANNTE ZONE ändert nichts und WIRD GESAGT (§35).
 *   §6 UND DER SATZ FEHLT, WENN ES NICHTS ZU SAGEN GIBT.
 *
 *   node pruefungen/lauf/test336.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9340;

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

/* ZWEI SEITEN IN ZWEI ZONEN. Der ganze Bogen dreht sich darum, dass
   dasselbe ICS auf verschiedenen Geräten verschiedene Ortszeiten ergibt —
   und trotzdem denselben Augenblick meint. Eine Seite allein könnte das
   nicht zeigen. */
const berlin = await browser.newPage({ viewport: { width: 1280, height: 900 },
                                       timezoneId: 'Europe/Berlin' });
const newyork = await browser.newPage({ viewport: { width: 1280, height: 900 },
                                        timezoneId: 'America/New_York' });
for (const s of [berlin, newyork]) {
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(2600);
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
  });
}

/* ========================================================================
 * 1 · Die Rechnung selbst
 * ======================================================================*/
console.log('\n1 · Versatz und Umkehrung');

const r1 = await berlin.evaluate(() => {
  const Z = (globalThis as any).Zeitzone;
  const winter = Date.UTC(2026, 0, 15, 12, 0);   /* 15. Januar */
  const sommer = Date.UTC(2026, 6, 15, 12, 0);   /* 15. Juli */
  return {
    kenntBerlin: Z.kennt('Europe/Berlin'),
    kenntNY: Z.kennt('America/New_York'),
    kenntWindows: Z.kennt('W. Europe Standard Time'),
    kenntUnfug: Z.kennt('Unfug/Quatsch'),
    kenntLeer: Z.kennt(''),
    berlinWinter: Z.versatz('Europe/Berlin', winter),
    berlinSommer: Z.versatz('Europe/Berlin', sommer),
    nyWinter: Z.versatz('America/New_York', winter),
    nySommer: Z.versatz('America/New_York', sommer),
    utc: Z.versatz('UTC', sommer),
    /* Und die Umkehrung: 8:00 New York am 7. September ist 12:00 UTC. */
    ny8: Z.alsAugenblick(2026, 9, 7, 8, 0, 'America/New_York'),
    soll: Date.UTC(2026, 8, 7, 12, 0),
    unbekannt: Z.alsAugenblick(2026, 9, 7, 8, 0, 'W. Europe Standard Time'),
    unbekanntOrt: Z.alsOrtszeit(2026, 9, 7, 8, 0, 'Unfug/Quatsch')
  };
});
p('Europe/Berlin ist bekannt', r1.kenntBerlin);
p('America/New_York auch', r1.kenntNY);
p('Outlooks Windows-Name nicht', !r1.kenntWindows);
p('Erfundenes nicht', !r1.kenntUnfug);
p('Und nichts ist keine Zone', !r1.kenntLeer);
gleich('Berlin im Winter: +60', r1.berlinWinter, 60);
gleich('Berlin im Sommer: +120', r1.berlinSommer, 120);
gleich('New York im Winter: −300', r1.nyWinter, -300);
gleich('New York im Sommer: −240', r1.nySommer, -240);
gleich('UTC ist 0', r1.utc, 0);
gleich('8:00 New York ist 12:00 Weltzeit', r1.ny8, r1.soll);
gleich('Eine unbekannte Zone gibt null zurück', r1.unbekannt, null);
gleich('… und keine Ortszeit', r1.unbekanntOrt, null);

/* ========================================================================
 * 2 · Die Umstellungsnacht
 *
 * DER ABSCHNITT, DER DEN ZWEITEN DURCHGANG MISST. `alsAugenblick` rechnet
 * zweimal: einmal mit dem Versatz an der rohen Wandzeit, dann noch einmal
 * mit dem Versatz an dem Punkt, auf den der erste Abzug geführt hat. Fällt
 * der zweite Durchgang weg, ist jede Umstellungsnacht eine Stunde daneben —
 * genau die halbe Rechnung, vor der L106 warnt.
 * ======================================================================*/
console.log('\n2 · Rund um die Zeitumstellung');

const r2 = await berlin.evaluate(() => {
  const Z = (globalThis as any).Zeitzone;
  /* 2026: Europa stellt am 29. März vor und am 25. Oktober zurück. */
  return {
    /* Kurz VOR der Umstellung im März: noch Winterzeit, +60. */
    vorMaerz: Z.alsAugenblick(2026, 3, 29, 1, 30, 'Europe/Berlin'),
    vorMaerzSoll: Date.UTC(2026, 2, 29, 0, 30),
    /* Kurz DANACH: Sommerzeit, +120. */
    nachMaerz: Z.alsAugenblick(2026, 3, 29, 4, 30, 'Europe/Berlin'),
    nachMaerzSoll: Date.UTC(2026, 2, 29, 2, 30),
    /* Und im Oktober zurück: 3:30 ist wieder Winterzeit, +60. */
    nachOkt: Z.alsAugenblick(2026, 10, 25, 4, 30, 'Europe/Berlin'),
    nachOktSoll: Date.UTC(2026, 9, 25, 3, 30),
    /* Die Stunde, die es NICHT GIBT (2:30 am 29. März). Es soll eine
       Antwort kommen, keine Ausnahme — ein Termin, der wegen einer
       mehrdeutigen Stunde verschwindet, wäre schlimmer (§46). */
    luecke: Z.alsAugenblick(2026, 3, 29, 2, 30, 'Europe/Berlin')
  };
});
gleich('1:30 vor der Umstellung ist 0:30 Weltzeit', r2.vorMaerz, r2.vorMaerzSoll);
gleich('4:30 danach ist 2:30 Weltzeit', r2.nachMaerz, r2.nachMaerzSoll);
gleich('Und im Oktober ist 4:30 wieder 3:30 Weltzeit', r2.nachOkt, r2.nachOktSoll);
p('Die Stunde, die es nicht gibt, liefert trotzdem eine Zahl',
  typeof r2.luecke === 'number' && Number.isFinite(r2.luecke),
  JSON.stringify(r2.luecke));

/* ========================================================================
 * 3 · Der Termin kommt richtig an
 * ======================================================================*/
console.log('\n3 · Derselbe Kalender, zwei Geräte, ein Augenblick');

const MIT_ZONE = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Konferenz',
  'BEGIN:VEVENT', 'UID:ny@k', 'SUMMARY:Videokonferenz',
  'DTSTART;TZID=America/New_York:20260907T080000',
  'DTEND;TZID=America/New_York:20260907T090000', 'END:VEVENT',
  'END:VCALENDAR'].join('\r\n');

const lies = (seite: any, ics: string) => seite.evaluate((t: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(t);
  return { start: g.termine[0] && g.termine[0].start,
           ende: g.termine[0] && g.termine[0].ende,
           zonen: g.zonenUnklar || [] };
}, ics);

const b3 = await lies(berlin, MIT_ZONE);
const n3 = await lies(newyork, MIT_ZONE);
gleich('In Berlin steht der Termin um 14:00', b3.start, '2026-09-07T14:00');
gleich('… und endet um 15:00', b3.ende, '2026-09-07T15:00');
gleich('In New York um 08:00', n3.start, '2026-09-07T08:00');
gleich('Keine Zone blieb unklar', b3.zonen, []);

/* ========================================================================
 * 4 · Der Normalfall bleibt unberührt
 *
 * DIE GEGENPROBE ZU §3. Der überwiegende Kalender trägt gar kein TZID oder
 * schreibt `Z`. Änderte sich dort etwas, wäre der Bogen ein Schaden statt
 * einer Reparatur.
 * ======================================================================*/
console.log('\n4 · Ohne Zone und mit Z ändert sich nichts');

const OHNE = ['BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'UID:o@k', 'SUMMARY:Ortstermin',
  'DTSTART:20260907T080000', 'DTEND:20260907T093000', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:z@k', 'SUMMARY:Weltzeit',
  'DTSTART:20260907T080000Z', 'DTEND:20260907T093000Z', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:t@k', 'SUMMARY:Ganzer Tag',
  'DTSTART;VALUE=DATE:20260907', 'END:VEVENT',
  'END:VCALENDAR'].join('\r\n');

const b4 = await berlin.evaluate((t: string) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(t);
  return { starts: g.termine.map((x: any) => x.start), zonen: g.zonenUnklar || [] };
}, OHNE);
const n4 = await newyork.evaluate((t: string) => {
  const K = (globalThis as any).Kalender;
  return (K.icsLesen(t).termine || []).map((x: any) => x.start);
}, OHNE);
/* Ohne Zone bleibt die Wandzeit stehen — auf BEIDEN Geräten dieselbe. */
gleich('Ohne Zone: die Zeit aus der Datei', b4.starts[0], '2026-09-07T08:00');
gleich('… auf beiden Geräten gleich', n4[0], '2026-09-07T08:00');
/* Mit Z wird umgerechnet — das konnte Redion schon vorher. */
gleich('Mit Z: in Berlin 10:00', b4.starts[1], '2026-09-07T10:00');
gleich('… und in New York 04:00', n4[1], '2026-09-07T04:00');
gleich('Ein ganzer Tag bleibt ein Datum', b4.starts[2], '2026-09-07');
gleich('Und nichts blieb unklar', b4.zonen, []);

/* ========================================================================
 * 5 · Eine unbekannte Zone
 * ======================================================================*/
console.log('\n5 · Outlooks Windows-Name: nichts geraten, aber gesagt');

const OUTLOOK = ['BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'UID:w@k', 'SUMMARY:Besprechung',
  'DTSTART;TZID=W. Europe Standard Time:20260907T080000',
  'DTEND;TZID=W. Europe Standard Time:20260907T093000', 'END:VEVENT',
  'END:VCALENDAR'].join('\r\n');

const b5 = await lies(berlin, OUTLOOK);
gleich('Die Zeit bleibt, wie sie in der Datei steht', b5.start, '2026-09-07T08:00');
gleich('Und die Zone wird beim Namen genannt', b5.zonen,
       ['W. Europe Standard Time']);

/* NICHT ZWEIMAL DIESELBE. Ein Kalender mit vierzig Terminen aus einer Zone
   soll den Satz einmal sagen. */
const VIELE = ['BEGIN:VCALENDAR', 'VERSION:2.0',
  ...Array.from({ length: 5 }, (_, i) =>
    ['BEGIN:VEVENT', 'UID:v' + i + '@k', 'SUMMARY:Termin ' + i,
     'DTSTART;TZID=W. Europe Standard Time:2026090' + (i + 1) + 'T080000',
     'END:VEVENT']).flat(),
  'END:VCALENDAR'].join('\r\n');
const b5b = await lies(berlin, VIELE);
gleich('Fünf Termine, eine Nennung', b5b.zonen, ['W. Europe Standard Time']);

/* ========================================================================
 * 6 · Und die Sammlung trägt nichts über
 * ======================================================================*/
console.log('\n6 · Der nächste Kalender erbt nichts');

const b6 = await lies(berlin, MIT_ZONE);
gleich('Nach dem Outlook-Kalender ist die Liste wieder leer', b6.zonen, []);
gleich('… und die Zeit stimmt weiterhin', b6.start, '2026-09-07T14:00');

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
