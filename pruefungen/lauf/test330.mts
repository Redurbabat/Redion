/* Suite 330 — Der Rundlauf schliesst sich (L106 Punkt 8, E338)
 * ============================================================================
 * „`icsSchreiben` erzeugt keine Wiederholungsregeln. Was Redion einliest,
 * kann es nicht wieder ausgeben — der Rundlauf ist einseitig."
 *
 * Aus einem wöchentlichen Stundenplan wurden beim Ausgeben vierzig
 * Einzeltermine, und die Reihe war fort. Wer die Datei in seinen Kalender
 * zog, bekam vierzig Einträge, die niemand mehr gemeinsam verschieben
 * oder absagen kann.
 *
 * FÜNF ZEILEN MIT DEMSELBEN `RRULE` AUSZUGEBEN WÄRE SCHLIMMER als gar
 * keins — der Empfänger sähe fünf unendliche Reihen. Also so, wie ICS es
 * vorsieht:
 *
 *     die erste Folge      VEVENT mit `RRULE`
 *     eine verschobene     VEVENT mit `RECURRENCE-ID` (die URSPRÜNGLICHE Zeit)
 *     eine gestrichene     `EXDATE` am Kopf
 *     alle übrigen         gar nicht — sie stehen in der Regel
 *
 *   §1 DIE REGEL WIRD GESPEICHERT, und nur an der ersten Folge.
 *   §2 EINE SAUBERE REIHE geht als EIN Termin hinaus.
 *   §3 EINE GESTRICHENE FOLGE wird zu `EXDATE`.
 *   §4 EINE VERSCHOBENE zu einem Ersatz mit `RECURRENCE-ID`.
 *   §5 UND ZURÜCK: derselbe Stundenplan, nicht mehr und nicht weniger.
 *   §6 GEGENPROBE: ohne Regel bleibt alles wie vorher.
 *   §7 DIE SPALTE kommt auch an einer alten Tabelle nach.
 *
 *   node pruefungen/lauf/test330.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9333;

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

const STUNDENPLAN = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
  'BEGIN:VEVENT', 'UID:m@s', 'SUMMARY:Mathematik',
  'DTSTART:20260907T080000Z', 'DTEND:20260907T093000Z',
  'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=5', 'LOCATION:Raum 3', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:zahn@p', 'SUMMARY:Zahnarzt',
  'DTSTART:20261020T140000Z', 'DTEND:20261020T150000Z', 'END:VEVENT',
  'END:VCALENDAR'].join('\r\n');

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Regel wird gespeichert — an der ersten Folge');

const gespeichert = await pc.evaluate(async (ics: string) => {
  const K = (globalThis as any).Kalender;
  const s = Store.addPage(null, { text: 'Stundenplan' });
  const coll = K.zielDatenbank(s.id, 'Termine plan');
  K.uebernehmen(coll, K.ausrollenAlle(K.icsLesen(ics).termine), 'Schule');
  return { collId: coll.id, spalten: Object.keys(coll.schema),
           spaltenname: coll.schema.regel && coll.schema.regel.name,
           zeilen: Store.rowsOf(coll.id).map((r: any) => ({
             uid: (r.props || {}).uid, regel: (r.props || {}).regel || '' })) };
}, STUNDENPLAN);

p('Die Tabelle führt eine Spalte für die Regel',
  gespeichert.spalten.includes('regel'), JSON.stringify(gespeichert.spalten));
gleich('Und sie heisst auf Deutsch „Wiederholung"',
  gespeichert.spaltenname, 'Wiederholung');
/* NUR AN DER ERSTEN. Die Regel gilt für die ganze Reihe; an jeder Folge
   stünde fünfmal dieselbe Wahrheit, und beim Ausgeben wären es fünf
   Reihen statt einer. */
gleich('Nur die erste Folge trägt sie',
  gespeichert.zeilen.filter((z: any) => z.regel).map((z: any) => z.uid),
  ['m@s#0']);
gleich('Und zwar wörtlich',
  gespeichert.zeilen.find((z: any) => z.uid === 'm@s#0').regel,
  'FREQ=WEEKLY;BYDAY=MO;COUNT=5');

/* ------------------------------------------------------------------------ */
console.log('\n2 · Eine saubere Reihe geht als EIN Termin hinaus');

const glatt = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.getCollection(arg.collId);
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  return { text: raus,
           vevents: (raus.match(/BEGIN:VEVENT/g) || []).length,
           rrule: (raus.match(/^RRULE:/gm) || []).length,
           uids: (raus.match(/^UID:.*$/gm) || []).map((z: string) => z.slice(4)),
           exdate: (raus.match(/^EXDATE/gm) || []).length,
           recur: (raus.match(/^RECURRENCE-ID/gm) || []).length,
           /* Die rohe Regel darf NICHT auch noch in der Beschreibung stehen. */
           inBeschreibung: /DESCRIPTION:[^\r\n]*Wiederholung/.test(raus) };
}, { collId: gespeichert.collId });

/* FÜNF STUNDEN UND EIN ZAHNARZT werden ZWEI Termine. */
gleich('Zwei Termine statt sechs', glatt.vevents, 2);
gleich('Einer davon trägt die Regel', glatt.rrule, 1);
gleich('Die Reihe behält ihre Kennung aus der Quelle',
  glatt.uids[0], 'm@s');
p('Und der Einzeltermin bekommt eine eigene',
  /@notizen$/.test(String(glatt.uids[1])), String(glatt.uids[1]));
gleich('Nichts ist gestrichen', glatt.exdate, 0);
gleich('Und nichts verschoben', glatt.recur, 0);
/* ZWEIMAL DIESELBE ANGABE IST EINE ZU VIEL — und beim Zurücklesen stünde
   die Regel dann als Text in der Notiz. */
p('Die Regel steht nicht auch noch in der Beschreibung',
  !glatt.inBeschreibung, glatt.text.slice(0, 400));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Eine gestrichene Folge wird zu EXDATE');

/* OHNE `EXDATE` KÄME JEDE VON HAND GELÖSCHTE STUNDE BEIM EMPFÄNGER
   ZURÜCK — genau der Fehler, den E290 beim EINLESEN abgeräumt hat, nur in
   der anderen Richtung. */
const gestrichen = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.getCollection(arg.collId);
  const vierte = Store.rowsOf(coll.id).find((r: any) => (r.props || {}).uid === 'm@s#3');
  Store.trashBlock(vierte.id);
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  return { vevents: (raus.match(/BEGIN:VEVENT/g) || []).length,
           exdate: (raus.match(/^EXDATE:.*$/gm) || []).map((z: string) => z.slice(7)) };
}, { collId: gespeichert.collId });

gleich('Immer noch zwei Termine', gestrichen.vevents, 2);
/* DER 28. SEPTEMBER, in Weltzeit — 8:00 UTC ist 10:00 in Berlin. */
gleich('Und die gestrichene Stunde steht als EXDATE',
  gestrichen.exdate, ['20260928T080000Z']);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Eine verschobene wird zum Ersatz mit RECURRENCE-ID');

const verschoben = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.getCollection(arg.collId);
  const dritte = Store.rowsOf(coll.id).find((r: any) => (r.props || {}).uid === 'm@s#2');
  Store.setProp(dritte.id, 'start', '2026-09-22T14:00');
  Store.setProp(dritte.id, 'ende', '2026-09-22T15:30');
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  const bloecke = raus.split('BEGIN:VEVENT').slice(1);
  const ersatz = bloecke.find((b: string) => /RECURRENCE-ID/.test(b)) || '';
  return { vevents: bloecke.length,
           recur: (ersatz.match(/^RECURRENCE-ID:(.*)$/m) || [])[1] || '',
           uid: (ersatz.match(/^UID:(.*)$/m) || [])[1] || '',
           start: (ersatz.match(/^DTSTART:(.*)$/m) || [])[1] || '',
           ende: (ersatz.match(/^DTEND:(.*)$/m) || [])[1] || '' };
}, { collId: gespeichert.collId });

gleich('Jetzt sind es drei Termine', verschoben.vevents, 3);
/* DIESELBE KENNUNG — daran erkennt der Empfänger, dass es die Reihe ist. */
gleich('Der Ersatz trägt die Kennung der Reihe', verschoben.uid, 'm@s');
/* UND DIE URSPRÜNGLICHE ZEIT, nicht die neue. Ohne sie wäre es ein
   zweiter Termin neben dem alten. */
gleich('Und die URSPRÜNGLICHE Zeit der Folge',
  verschoben.recur, '20260921T080000Z');
gleich('Sein Anfang ist der neue', verschoben.start, '20260922T120000Z');
gleich('Und sein Ende auch', verschoben.ende, '20260922T133000Z');

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und zurück: derselbe Stundenplan');

/* DAS IST DIE EIGENTLICHE ZUSAGE VON L106 PUNKT 8. Alles davor sind
   Einzelteile; hier wird gemessen, ob der Rundlauf wirklich rundläuft. */
const zurueck = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.getCollection(arg.collId);
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  const s2 = Store.addPage(null, { text: 'Zurück' });
  const coll2 = K.zielDatenbank(s2.id, 'Termine zurueck');
  K.uebernehmen(coll2, K.ausrollenAlle(K.icsLesen(raus).termine), 'Schule');
  return Store.rowsOf(coll2.id).map((r: any) => ({
    t: r.text, s: (r.props || {}).start, e: (r.props || {}).ende }))
    .sort((a: any, b: any) => String(a.s).localeCompare(String(b.s)));
}, { collId: gespeichert.collId });

gleich('Vier Stunden und ein Zahnarzt', zurueck.length, 5);
gleich('Die erste steht, wo sie stand',
  zurueck[0], { t: 'Mathematik', s: '2026-09-07T10:00', e: '2026-09-07T11:30' });
/* DIE VERSCHOBENE STEHT AN IHRER NEUEN STELLE — einmal, nicht zweimal. */
gleich('Die verschobene steht an ihrer neuen Stelle',
  zurueck[2], { t: 'Mathematik', s: '2026-09-22T14:00', e: '2026-09-22T15:30' });
p('Und keine steht mehr am alten 21. September',
  !zurueck.some((x: any) => String(x.s).startsWith('2026-09-21')),
  JSON.stringify(zurueck));
p('Die gestrichene ist fort',
  !zurueck.some((x: any) => String(x.s).startsWith('2026-09-28')),
  JSON.stringify(zurueck));
gleich('Der Zahnarzt ist auch wieder da',
  zurueck[4], { t: 'Zahnarzt', s: '2026-10-20T16:00', e: '2026-10-20T17:00' });

/* ------------------------------------------------------------------------ */
console.log('\n6 · GEGENPROBE: ohne Regel bleibt alles wie vorher');

/* WÜRDE DER NEUE WEG AUCH OHNE REGEL GREIFEN, verschwänden Termine aus
   der Ausgabe — jede Zeile, die zufällig eine Raute in der Kennung hat,
   wäre plötzlich „eine Folge" und stünde nicht mehr da. */
const ohne = await pc.evaluate(async () => {
  const K = (globalThis as any).Kalender;
  const s = Store.addPage(null, { text: 'Ohne Regel' });
  const coll = K.zielDatenbank(s.id, 'Termine ohne');
  /* Drei Zeilen im Reihen-Format, aber ohne Regel am Kopf — genau das,
     was eine Tabelle von vor E338 enthält. */
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00']
    .forEach((d, i) => {
      const r = Store.addRow(coll.id, { start: d, ende: '', ort: null,
        quelle: 'Alt', text: '', uid: 'alt@s#' + i, link: '', regel: '' });
      Store.updateBlock(r.id, { text: 'Mathematik' });
    });
  const raus = K.icsSchreiben(coll, Store.getView(coll.viewIds[0]));
  return { vevents: (raus.match(/BEGIN:VEVENT/g) || []).length,
           rrule: (raus.match(/^RRULE:/gm) || []).length,
           uids: (raus.match(/^UID:.*$/gm) || []).map((z: string) => z.slice(4)) };
});

gleich('Alle drei gehen einzeln hinaus', ohne.vevents, 3);
gleich('Ohne Regel', ohne.rrule, 0);
p('Und jede mit ihrer eigenen Kennung',
  ohne.uids.length === 3 && new Set(ohne.uids).size === 3 &&
  ohne.uids.every((u: string) => /@notizen$/.test(u)), JSON.stringify(ohne.uids));

/* ------------------------------------------------------------------------ */
console.log('\n7 · Die Spalte kommt auch an einer alten Tabelle nach');

/* EINE SPALTE NACHZUTRAGEN IST DAS EINZIGE, WAS HIER GEFAHRLOS GEHT (§9).
   Sie kommt leer dazu, keine vorhandene Zeile ändert sich. */
const nachtrag = await pc.evaluate(async () => {
  const K = (globalThis as any).Kalender;
  const s = Store.addPage(null, { text: 'Alte Tabelle' });
  const { collectionId } = Store.addDatabase(s.id, 'Termine alt2',
    { title: { name: 'Termin', type: 'title' },
      start: { name: 'Beginn', type: 'date' },
      uid:   { name: 'Kennung', type: 'text' } }, 'calendar');
  const coll = Store.getCollection(collectionId);
  const r = Store.addRow(coll.id, { start: '2026-09-07T10:00', uid: 'alt@x' });
  Store.updateBlock(r.id, { text: 'Alter Termin' });
  const vorher = Object.keys(coll.schema);
  const wieder = K.zielDatenbank(s.id, 'Termine alt2');
  const zeilen = Store.rowsOf(wieder.id);
  return { vorher, nachher: Object.keys(wieder.schema),
           dieselbe: wieder.id === coll.id,
           zeilenZahl: zeilen.length,
           titelSteht: zeilen[0] && zeilen[0].text,
           beginnSteht: zeilen[0] && (zeilen[0].props || {}).start,
           regelLeer: !(zeilen[0] && (zeilen[0].props || {}).regel) };
});

p('Vorher gab es die Spalte nicht', !nachtrag.vorher.includes('regel'),
  JSON.stringify(nachtrag.vorher));
p('Nachher schon', nachtrag.nachher.includes('regel'),
  JSON.stringify(nachtrag.nachher));
p('Und es ist dieselbe Tabelle, keine neue', nachtrag.dieselbe);
/* DER EIGENTLICHE PUNKT: die vorhandene Zeile hat sich nicht verändert. */
gleich('Die alte Zeile steht noch da', nachtrag.zeilenZahl, 1);
gleich('Mit ihrem Titel', nachtrag.titelSteht, 'Alter Termin');
gleich('Und ihrem Beginn', nachtrag.beginnSteht, '2026-09-07T10:00');
p('Die neue Spalte ist bei ihr leer', nachtrag.regelLeer);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
