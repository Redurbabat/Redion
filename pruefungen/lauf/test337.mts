/* Suite 337 — Aufgaben aus dem Kalender landen in Aufgaben (L106 Punkt 6, E345)
 * ============================================================================
 * E326 hat `VTODO` lesbar gemacht. Seitdem stand in L106:
 *
 *     „die Aufgaben landen in keinem Aufgabenmodell. Sie werden gelesen und
 *      genannt, aber nicht einsortiert — bewusst, denn eine Aufgabe mit
 *      Fälligkeit als Termin in die Kalendertabelle zu schreiben wäre die
 *      stille Falschaussage, die E290 gerade abgeräumt hat."
 *
 * Der Einwand galt der falschen TABELLE, nicht der Sache. Redion hat ein
 * Aufgabenmodell; dorthin gehen sie jetzt.
 *
 *   §1 SIE LANDEN IN EINER EIGENEN TABELLE — nicht in der Kalendertabelle.
 *   §2 UND DIE TABELLE IST WIRKLICH EINE AUFGABENQUELLE. Ohne den Eintrag
 *      in `aufgabenQuellen` fragt „Meine Aufgaben" sie nie ab: eine Tabelle,
 *      die aussieht wie Aufgaben und nirgends auftaucht (§47).
 *   §3 DIE SPALTEN HEISSEN, WIE DAS MODELL SIE ERWARTET.
 *   §4 EIN ZWEITER LAUF DOPPELT NICHT.
 *   §5 DAS ZUSTÄNDIG-FELD ÜBERLEBT den Abgleich (§9).
 *   §6 OHNE VTODO ENTSTEHT KEINE TABELLE. Die Gegenprobe zu §1: eine leere
 *      Aufgabentabelle bei jedem Termin-Abo wäre die Anzeige, die immer
 *      etwas anzeigt und deshalb nicht gelesen wird.
 *   §7 UND DER TERMINKALENDER BLEIBT SAUBER — keine Aufgabe darin.
 *
 *   node pruefungen/lauf/test337.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9341;

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

const MIT_AUFGABEN = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
  'BEGIN:VEVENT', 'UID:t1@s', 'SUMMARY:Mathematik',
  'DTSTART:20260907T080000Z', 'DTEND:20260907T093000Z', 'END:VEVENT',
  'BEGIN:VTODO', 'UID:a1@s', 'SUMMARY:Aufgabenblatt 3 abgeben',
  'DUE:20260910T230000Z', 'DESCRIPTION:Seiten 4 bis 7', 'END:VTODO',
  'BEGIN:VTODO', 'UID:a2@s', 'SUMMARY:Referat vorbereiten',
  'DUE:20260915T230000Z', 'END:VTODO',
  'BEGIN:VTODO', 'UID:a3@s', 'SUMMARY:Buch zurückgeben',
  'DUE:20260901T230000Z', 'STATUS:COMPLETED', 'END:VTODO',
  'END:VCALENDAR'].join('\r\n');

const NUR_TERMINE = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Sport',
  'BEGIN:VEVENT', 'UID:s1@v', 'SUMMARY:Training',
  'DTSTART:20261101T170000Z', 'DTEND:20261101T190000Z', 'END:VEVENT',
  'END:VCALENDAR'].join('\r\n');

/* ========================================================================
 * 1 · Sie landen in einer eigenen Tabelle
 * ======================================================================*/
console.log('\n1 · Aufgaben kommen in eine Aufgabentabelle');

const r1 = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const s = Store.addPage(null, { text: 'Schule' });
  const g = K.icsLesen(ics);
  const tc = K.zielDatenbank(s.id, 'Termine s1');
  K.uebernehmen(tc, K.ausrollenAlle(g.termine), 'Schule');
  const ac = K.aufgabenDatenbank(s.id, 'Aufgaben s1');
  const e = K.aufgabenUebernehmen(ac, g.aufgaben, 'Schule');
  return {
    gelesen: (g.aufgaben || []).length,
    neu: e.neu, frisch: e.frisch,
    aufgId: ac.id, terminId: tc.id,
    spalten: Object.keys(ac.schema),
    istAufgaben: !!ac.istAufgaben,
    zeilen: Store.rowsOf(ac.id).map((r: any) => ({
      text: r.text, uid: (r.props || {}).uid,
      fertig: !!(r.props || {}).aufgFertig,
      frist: (r.props || {}).aufgFrist || '',
      quelle: (r.props || {}).quelle || '' }))
      .sort((a: any, b: any) => String(a.uid).localeCompare(String(b.uid)))
  };
}, MIT_AUFGABEN);
gleich('Drei VTODO gelesen', r1.gelesen, 3);
gleich('Drei Aufgaben angelegt', r1.neu, 3);
gleich('Nichts aufgefrischt beim ersten Mal', r1.frisch, 0);
gleich('Sie tragen ihre Titel', r1.zeilen.map((z: any) => z.text),
       ['Aufgabenblatt 3 abgeben', 'Referat vorbereiten', 'Buch zurückgeben']);
gleich('Und ihre Kennungen', r1.zeilen.map((z: any) => z.uid), ['a1@s', 'a2@s', 'a3@s']);
gleich('Die erledigte steht als erledigt da',
       r1.zeilen.map((z: any) => z.fertig), [false, false, true]);
p('Jede hat eine Frist', r1.zeilen.every((z: any) => /^\d{4}-\d{2}-\d{2}/.test(z.frist)),
  JSON.stringify(r1.zeilen.map((z: any) => z.frist)));
gleich('Und den Kalender als Quelle',
       r1.zeilen.map((z: any) => z.quelle), ['Schule', 'Schule', 'Schule']);

/* ========================================================================
 * 2 · Und sie ist wirklich eine Aufgabenquelle
 *
 * OHNE DEN EINTRAG IN `aufgabenQuellen` fragt „Meine Aufgaben" sie nie ab.
 * Die Sammlung allein genügt nicht — das ist genau die Verdrahtung, die
 * `steuerung.ts` beim Umschalten von Hand vornimmt. Eine Tabelle, die
 * aussieht wie Aufgaben und nirgends auftaucht, ist §47.
 * ======================================================================*/
console.log('\n2 · Sie ist als Aufgabenquelle angemeldet');

p('Die Sammlung ist als Aufgabenquelle markiert', r1.istAufgaben);
const r2 = await pc.evaluate((id: string) =>
  (Store.getMeta('aufgabenQuellen', null) || []).includes(id), r1.aufgId);
p('Und sie steht in `aufgabenQuellen`', r2);

/* ========================================================================
 * 3 · Die Spalten heissen, wie das Modell sie erwartet
 * ======================================================================*/
console.log('\n3 · Die Spaltennamen passen zum Aufgabenmodell');

for (const sp of ['aufgFertig', 'aufgFrist', 'aufgWer'])
  p('Die Spalte `' + sp + '` gibt es', r1.spalten.includes(sp),
    JSON.stringify(r1.spalten));
gleich('Und eine Kennungsspalte', r1.spalten.includes('uid'), true);

/* ========================================================================
 * 4 · Ein zweiter Lauf doppelt nicht
 * ======================================================================*/
console.log('\n4 · Zweimal abholen gibt nicht sechs Aufgaben');

const r4 = await pc.evaluate((d: any) => {
  const K = (globalThis as any).Kalender;
  const g = K.icsLesen(d.ics);
  const ac = Store.cache.collections[d.aufgId];
  const e = K.aufgabenUebernehmen(ac, g.aufgaben, 'Schule');
  return { neu: e.neu, frisch: e.frisch, zeilen: Store.rowsOf(ac.id).length };
}, { ics: MIT_AUFGABEN, aufgId: r1.aufgId });
gleich('Nichts neu', r4.neu, 0);
gleich('Drei aufgefrischt', r4.frisch, 3);
gleich('Und es sind immer noch drei Zeilen', r4.zeilen, 3);

/* ========================================================================
 * 5 · Das Zuständig-Feld überlebt
 *
 * Wer zuständig ist, entscheidet der Mensch — die Quelle weiss es nicht.
 * Ein Feld, das bei jedem Abgleich zurückgesetzt wird, ist schlimmer als
 * ein leeres (§9).
 * ======================================================================*/
console.log('\n5 · Was von Hand eingetragen wurde, bleibt');

const r5 = await pc.evaluate((d: any) => {
  const K = (globalThis as any).Kalender;
  const ac = Store.cache.collections[d.aufgId];
  const zeile = Store.rowsOf(ac.id).find((r: any) => (r.props || {}).uid === 'a1@s');
  Store.setProp(zeile.id, 'aufgWer', 'Redur');
  Store.setProp(zeile.id, 'aufgFertig', true);
  const g = K.icsLesen(d.ics);
  K.aufgabenUebernehmen(ac, g.aufgaben, 'Schule');
  const nachher = Store.rowsOf(ac.id).find((r: any) => (r.props || {}).uid === 'a1@s');
  return { wer: (nachher.props || {}).aufgWer,
           fertig: !!(nachher.props || {}).aufgFertig };
}, { ics: MIT_AUFGABEN, aufgId: r1.aufgId });
gleich('Zuständig bleibt stehen', r5.wer, 'Redur');
/* UND DER HAKEN NICHT: den führt die Quelle, und `STATUS:COMPLETED` heisst
   dort ausdrücklich „nicht erledigt". Das ist kein Widerspruch zu §5,
   sondern die Trennlinie: die Quelle führt den Stand, der Mensch die
   Zuständigkeit. */
gleich('Der Haken folgt der Quelle', r5.fertig, false);

/* ========================================================================
 * 6 · Ohne VTODO entsteht keine Tabelle
 *
 * DIE GEGENPROBE ZU §1. Ohne diesen Abschnitt misst §1 nichts: er wäre
 * auch dann grün, wenn bei JEDEM Abo eine leere Aufgabentabelle entstünde
 * — die Anzeige, die immer etwas anzeigt (E284, E286, E288, E289, E290).
 * ======================================================================*/
console.log('\n6 · Ein Kalender ohne Aufgaben legt keine Tabelle an');

const r6 = await pc.evaluate((ics: string) => {
  const K = (globalThis as any).Kalender;
  const vorher = Object.keys(Store.cache.collections).length;
  const quellenVorher = (Store.getMeta('aufgabenQuellen', null) || []).length;
  const s = Store.addPage(null, { text: 'Sport' });
  const g = K.icsLesen(ics);
  const tc = K.zielDatenbank(s.id, 'Termine s6');
  K.uebernehmen(tc, K.ausrollenAlle(g.termine), 'Sport');
  /* Genau die Bedingung, unter der `alleAbosHolen` die Tabelle anlegt. */
  if ((g.aufgaben || []).length) K.aufgabenDatenbank(s.id, 'Aufgaben s6');
  return { gelesen: (g.aufgaben || []).length,
           dazu: Object.keys(Store.cache.collections).length - vorher,
           quellenDazu: (Store.getMeta('aufgabenQuellen', null) || []).length - quellenVorher };
}, NUR_TERMINE);
gleich('Kein VTODO im Kalender', r6.gelesen, 0);
gleich('Genau eine Sammlung kam dazu — die Termine', r6.dazu, 1);
gleich('Und keine neue Aufgabenquelle', r6.quellenDazu, 0);

/* ========================================================================
 * 7 · Und der Terminkalender bleibt sauber
 * ======================================================================*/
console.log('\n7 · Keine Aufgabe im Terminkalender');

const r7 = await pc.evaluate((id: string) =>
  Store.rowsOf(id).map((r: any) => String((r.props || {}).uid || '')).sort(),
  r1.terminId);
gleich('Im Terminkalender steht nur der Termin', r7, ['t1@s']);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
