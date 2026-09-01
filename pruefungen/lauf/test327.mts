/* Suite 327 — Fünf Stunden, eine Kennung (L106 Punkt 8, E335)
 * ============================================================================
 * L106 Punkt 8 sagte: „Kein Schreiben von BYDAY — der Rundlauf ist
 * einseitig." Beim Nachmessen kam etwas Schlimmeres heraus, und es steht
 * auf der ANDEREN Seite des Rundlaufs.
 *
 * In ICS gilt `UID` für die GANZE Reihe. Alle fünf Mathematikstunden eines
 * `RRULE:FREQ=WEEKLY;COUNT=5` tragen dieselbe Kennung — und `uebernehmen`
 * suchte die vorhandene Zeile allein darüber. Also fanden alle fünf Folgen
 * DIESELBE Zeile und schrieben nacheinander hinein.
 *
 * GEMESSEN, im einzigen Fall, für den ein Abgleich überhaupt da ist:
 *
 *     Die Schule verlegt Mathematik von 8:00 auf 9:00.
 *     Danach standen VIER Stunden auf 8:00 und EINE auf 9:00.
 *     Gemeldet wurde „5 aufgefrischt".
 *
 *   §1 DER SCHLÜSSEL ist eine reine Rechnung und lässt sich einzeln prüfen.
 *   §2 DER ERSTE ABGLEICH legt fünf Zeilen an, mit fünf Schlüsseln.
 *   §3 DER ZWEITE ändert nichts — und legt nichts doppelt an.
 *   §4 UND WENN DIE QUELLE VERSCHIEBT, ziehen ALLE fünf mit. Das ist der
 *      Abschnitt, der ohne die Änderung rot ist.
 *   §5 ALTE ZEILEN ZIEHEN UM statt sich zu verdoppeln.
 *   §6 GEGENPROBE: zwei Reihen kollidieren nicht, ein einzelner Termin
 *      behält seine nackte Kennung.
 *
 *   node pruefungen/lauf/test327.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
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
console.log('\n1 · Der Schlüssel ist eine reine Rechnung');

const sch = await pc.evaluate(() => {
  const K = (globalThis as any).Kalender;
  return {
    einzeln:   K.terminSchluessel({ uid: 'a@b', start: '2026-09-07T08:00' }),
    ersteFolge: K.terminSchluessel({ uid: 'a@b', start: '2026-09-07T08:00', folgeNr: 0 }),
    dritte:    K.terminSchluessel({ uid: 'a@b', start: '2026-09-21T08:00', folgeNr: 2 }),
    /* Ohne Kennung baut ICS-Import sich seit jeher eine aus Titel+Beginn. */
    ohneUid:   K.terminSchluessel({ titel: 'Zahnarzt', start: '2026-09-07T08:00' }),
    /* Unsinn darf nicht in einen Schlüssel geraten. */
    kaputt:    K.terminSchluessel({ uid: 'a@b', folgeNr: 'zwei' }),
    negativ:   K.terminSchluessel({ uid: 'a@b', folgeNr: -1 })
  };
});

/* EIN EINZELNER TERMIN BEHÄLT SEINE NACKTE KENNUNG. Das ist keine
   Feinheit: jede Zeile, die vor E335 angelegt wurde, trägt genau diesen
   Wert, und ohne diese Zeile bekäme jeder seine Einzeltermine doppelt. */
gleich('Ein einzelner Termin behält seine Kennung', sch.einzeln, 'a@b');
gleich('Die erste Folge bekommt die Null', sch.ersteFolge, 'a@b#0');
gleich('Die dritte Folge die Zwei', sch.dritte, 'a@b#2');
gleich('Ohne Kennung: Titel und Beginn', sch.ohneUid, 'Zahnarzt|2026-09-07T08:00');
gleich('Eine unlesbare Nummer wird nicht angehängt', sch.kaputt, 'a@b');
gleich('Eine negative auch nicht', sch.negativ, 'a@b');

/* ------------------------------------------------------------------------ */
console.log('\n2 · Der erste Abgleich legt fünf Zeilen an');

const ICS = (stunde: string) => ['BEGIN:VCALENDAR', 'VERSION:2.0',
  'X-WR-CALNAME:Schule',
  'BEGIN:VEVENT', 'UID:mathe-woche@schule', 'SUMMARY:Mathematik',
  'DTSTART:20260907T' + stunde + '0000Z', 'DTEND:20260907T' + stunde + '3000Z',
  'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=5', 'LOCATION:Raum 3',
  'END:VEVENT', 'END:VCALENDAR'].join('\r\n');

const lauf = await pc.evaluate(async (icsQuelle: string) => {
  const K = (globalThis as any).Kalender;
  const ausrollen = (text: string) => {
    const g = K.icsLesen(text);
    const raus: any[] = [];
    g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => raus.push(x)));
    return raus;
  };
  const s = Store.addPage(null, { text: 'Kalenderprobe' });
  const coll = K.zielDatenbank(s.id, 'Termine');
  const daten = () => Store.rowsOf(coll.id)
    .map((r: any) => (r.props || {}).start).sort();
  const schluessel = () => Store.rowsOf(coll.id)
    .map((r: any) => (r.props || {}).uid).sort();

  const acht = ausrollen(icsQuelle);
  const eins = K.uebernehmen(coll, acht, 'Schule');
  const nachEins = { zahl: Store.rowsOf(coll.id).length,
                     daten: daten(), schluessel: schluessel() };
  const zwei = K.uebernehmen(coll, acht, 'Schule');
  const nachZwei = { zahl: Store.rowsOf(coll.id).length, daten: daten() };
  return { collId: coll.id, seiteId: s.id, eins, nachEins, zwei, nachZwei };
}, ICS('08'));

gleich('Fünf Zeilen', lauf.nachEins.zahl, 5);
gleich('Und fünf sind es NEU', lauf.eins.neu, 5);
/* ZEHN UHR UND NICHT ACHT, und das ist kein Tippfehler. Die ICS-Quelle
   sagt `080000Z`, also UTC; die Seite ist oben fest auf Europe/Berlin
   gestellt, und im September gilt dort Sommerzeit. `icsZeit` rechnet um —
   das ist genau seine Aufgabe (E326/test319 hat es festgehalten). Die
   Uhrzeit fest hinzuschreiben ist Absicht: würde sie aus `icsZeit` selbst
   geholt, prüfte diese Zeile sich gegen sich selbst. */
gleich('Die fünf Montage stehen da', lauf.nachEins.daten,
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00',
   '2026-09-28T10:00', '2026-10-05T10:00']);
/* DAS IST DIE EIGENTLICHE ÄNDERUNG, in einer Zeile sichtbar: fünf
   VERSCHIEDENE Schlüssel, wo vorher fünfmal derselbe stand. */
gleich('Und jede trägt ihren eigenen Schlüssel', lauf.nachEins.schluessel,
  ['mathe-woche@schule#0', 'mathe-woche@schule#1', 'mathe-woche@schule#2',
   'mathe-woche@schule#3', 'mathe-woche@schule#4']);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der zweite Abgleich ändert nichts');

gleich('Immer noch fünf Zeilen', lauf.nachZwei.zahl, 5);
gleich('Nichts neu angelegt', lauf.zwei.neu, 0);
gleich('Fünf aufgefrischt', lauf.zwei.frisch, 5);
gleich('Und die Daten stehen unverändert', lauf.nachZwei.daten, lauf.nachEins.daten);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Verschiebt die Quelle, ziehen ALLE mit');

/* DER ABSCHNITT, DER OHNE DIE ÄNDERUNG ROT IST. Vorher fanden alle fünf
   Folgen dieselbe Zeile; nur die letzte blieb stehen, und vier Stunden
   behielten 8:00. Wer dem Kalender glaubt, steht viermal zu früh da. */
const verschoben = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.getCollection(arg.collId);
  const g = K.icsLesen(arg.ics);
  const raus: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => raus.push(x)));
  const erg = K.uebernehmen(coll, raus, 'Schule');
  return { erg, zahl: Store.rowsOf(coll.id).length,
           daten: Store.rowsOf(coll.id).map((r: any) => (r.props || {}).start).sort(),
           /* Und der Titel muss dieselbe Zeile treffen wie das Datum. */
           titel: [...new Set(Store.rowsOf(coll.id).map((r: any) => r.text))] };
}, { collId: lauf.collId, ics: ICS('09') });

gleich('Es bleiben fünf Zeilen', verschoben.zahl, 5);
gleich('Nichts wurde neu angelegt', verschoben.erg.neu, 0);
gleich('Alle fünf stehen jetzt eine Stunde später', verschoben.daten,
  ['2026-09-07T11:00', '2026-09-14T11:00', '2026-09-21T11:00',
   '2026-09-28T11:00', '2026-10-05T11:00']);
gleich('Und alle heissen weiterhin Mathematik', verschoben.titel, ['Mathematik']);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Alte Zeilen ziehen um statt sich zu verdoppeln');

/* OHNE DIESEN WEG WÄRE DIE ÄNDERUNG SELBST DER SCHADEN GEWESEN. Jede Zeile
   von vor E335 trägt die nackte Reihenkennung; über den neuen Schlüssel
   findet sie niemand. Beim ersten Abgleich nach dem Wechsel stünde alles
   zweimal da — und ein Nutzer, der zwanzig Wochen Stundenplan abonniert
   hat, hätte vierzig Zeilen. */
const umzug = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const s2 = Store.addPage(null, { text: 'Altbestand' });
  const { collectionId } = Store.addDatabase(s2.id, 'Termine alt',
    { title: { name: 'Termin', type: 'title' },
      start: { name: 'Beginn', type: 'date' },
      ende:  { name: 'Ende', type: 'date' },
      ort:   { name: 'Ort', type: 'place' },
      quelle:{ name: 'Kalender', type: 'select', options: [] },
      text:  { name: 'Notiz', type: 'text' },
      uid:   { name: 'Kennung', type: 'text' },
      link:  { name: 'Link', type: 'url' } }, 'calendar');
  const coll = Store.getCollection(collectionId);

  /* SO SAH ES VOR E335 AUS: fünf Zeilen, fünfmal dieselbe Kennung. */
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00',
   '2026-09-28T10:00', '2026-10-05T10:00'].forEach(d => {
    const r = Store.addRow(coll.id, { start: d, ende: '', ort: null,
      quelle: 'Schule', text: '', uid: 'mathe-woche@schule', link: '' });
    Store.updateBlock(r.id, { text: 'Mathematik' });
  });
  const vorher = Store.rowsOf(coll.id).length;

  const g = K.icsLesen(arg.ics);
  const raus: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => raus.push(x)));
  const erg = K.uebernehmen(coll, raus, 'Schule');
  return { vorher, erg, nachher: Store.rowsOf(coll.id).length,
           schluessel: Store.rowsOf(coll.id).map((r: any) => (r.props || {}).uid).sort(),
           daten: Store.rowsOf(coll.id).map((r: any) => (r.props || {}).start).sort() };
}, { ics: ICS('08') });

gleich('Vorher standen fünf Zeilen im alten Stil da', umzug.vorher, 5);
gleich('Nachher immer noch fünf — nichts verdoppelt', umzug.nachher, 5);
gleich('Keine einzige neu angelegt', umzug.erg.neu, 0);
gleich('Alle fünf sind umgezogen', umzug.erg.umgezogen, 5);
gleich('Und tragen jetzt den neuen Schlüssel', umzug.schluessel,
  ['mathe-woche@schule#0', 'mathe-woche@schule#1', 'mathe-woche@schule#2',
   'mathe-woche@schule#3', 'mathe-woche@schule#4']);
gleich('Die Daten sind dieselben geblieben', umzug.daten,
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00',
   '2026-09-28T10:00', '2026-10-05T10:00']);

/* ------------------------------------------------------------------------ */
console.log('\n6 · GEGENPROBE: zwei Reihen und ein einzelner Termin');

/* EIN SCHLÜSSEL, DER ALLES TRENNT, IST AUCH FALSCH. Ohne diesen Abschnitt
   wäre §2 bis §5 auch mit einem Schlüssel grün, der einfach immer neu ist
   — dann legte jeder Abgleich alles noch einmal an. */
const gegen = await pc.evaluate(async () => {
  const K = (globalThis as any).Kalender;
  const s3 = Store.addPage(null, { text: 'Zwei Reihen' });
  const coll = K.zielDatenbank(s3.id, 'Termine drei');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
    'BEGIN:VEVENT', 'UID:mathe@schule', 'SUMMARY:Mathematik',
    'DTSTART:20260907T080000Z', 'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:deutsch@schule', 'SUMMARY:Deutsch',
    'DTSTART:20260908T080000Z', 'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:zahnarzt@privat', 'SUMMARY:Zahnarzt',
    'DTSTART:20261020T140000Z', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n');
  const g = K.icsLesen(ics);
  const raus: any[] = [];
  g.termine.forEach((t: any) => K.wiederholungen(t).forEach((x: any) => raus.push(x)));
  const eins = K.uebernehmen(coll, raus, 'Schule');
  const zwei = K.uebernehmen(coll, raus, 'Schule');
  return { eins, zwei, zahl: Store.rowsOf(coll.id).length,
           schluessel: Store.rowsOf(coll.id).map((r: any) => (r.props || {}).uid).sort() };
});

gleich('Drei plus drei plus eins sind sieben Zeilen', gegen.zahl, 7);
gleich('Und beim zweiten Abgleich kommt keine dazu', gegen.zwei.neu, 0);
gleich('Sieben werden aufgefrischt', gegen.zwei.frisch, 7);
/* DER EINZELNE TERMIN TRÄGT KEIN `#` — sonst wäre der Umzugsweg für
   Einzeltermine nötig gewesen, und der ist es ausdrücklich nicht. */
gleich('Die Reihen sind getrennt, der einzelne Termin nackt', gegen.schluessel,
  ['deutsch@schule#0', 'deutsch@schule#1', 'deutsch@schule#2',
   'mathe@schule#0', 'mathe@schule#1', 'mathe@schule#2',
   'zahnarzt@privat']);
gleich('Und beim zweiten Mal zieht nichts mehr um', gegen.zwei.umgezogen, 0);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
