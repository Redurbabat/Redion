/* Suite 328 — Was die Quelle gestrichen hat (L112, E336)
 * ============================================================================
 * L112 entstand beim Bau von E335 und war gemessen, nicht vermutet:
 *
 *     Die Schule streicht die letzten zwei Stunden vor den Ferien.
 *     `COUNT=5` wird zu `COUNT=3`.
 *     Danach standen weiter FÜNF Zeilen im Stundenplan.
 *
 * Zwei Stunden, die es nicht mehr gibt, und nichts sagte es.
 *
 * DIE ANTWORT IST NICHT „LÖSCHEN, WAS NICHT KAM". Das wäre die
 * gefährlichere Hälfte: ein Abo, das bei einer Netzstörung leer antwortet,
 * hätte damit den ganzen Kalender geleert. Aufgeräumt wird nur INNERHALB
 * einer Reihe, die dieser Lauf wirklich geliefert hat — und in den
 * Papierkorb, nicht ins Nichts (§9, §13).
 *
 *   §1 EINE VERKÜRZTE REIHE räumt ihre überzähligen Folgen weg.
 *   §2 UND SIE SIND NICHT WEG, sondern im Papierkorb — mit allem dran.
 *   §3 SPERRE 1: eine Reihe, die GAR NICHT kam, wird nicht angefasst.
 *   §4 SPERRE 2: ein Einzeltermin nie.
 *   §5 SPERRE 3: eine Zeile einer anderen Quelle nie.
 *   §6 UND DER SATZ DAZU steht nur, wenn wirklich etwas entfallen ist.
 *
 *   node pruefungen/lauf/test328.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9331;

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
console.log('\n1 · Eine verkürzte Reihe räumt ihre Überzähligen weg');

const ICS = (n: number, uid = 'm@s', titel = 'Mathematik') =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
   'BEGIN:VEVENT', 'UID:' + uid, 'SUMMARY:' + titel,
   'DTSTART:20260907T080000Z', 'RRULE:FREQ=WEEKLY;COUNT=' + n,
   'END:VEVENT', 'END:VCALENDAR'].join('\r\n');

const kurz = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const roll = (t: string) => {
    const g = K.icsLesen(t); const r: any[] = [];
    g.termine.forEach((x: any) => K.wiederholungen(x).forEach((y: any) => r.push(y)));
    return r;
  };
  const s = Store.addPage(null, { text: 'Verkürzt' });
  const coll = K.zielDatenbank(s.id, 'Termine kurz');
  K.uebernehmen(coll, roll(arg.fuenf), 'Schule');
  const vorher = Store.rowsOf(coll.id).length;
  const erg = K.uebernehmen(coll, roll(arg.drei), 'Schule');
  const zeilen = Store.rowsOf(coll.id);
  /* Und der Papierkorb: `alive:false` unter derselben Sammlung. */
  const korb = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.parentTable === 'collection' && b.parentId === coll.id &&
                 b.alive === false);
  return { collId: coll.id, vorher, erg,
           nachher: zeilen.length,
           daten: zeilen.map((r: any) => (r.props || {}).start).sort(),
           korbZahl: korb.length,
           korbDaten: korb.map((b: any) => (b.props || {}).start).sort(),
           korbTitel: [...new Set(korb.map((b: any) => b.text))],
           korbStempel: korb.every((b: any) => !!b.trashedAt) };
}, { fuenf: ICS(5), drei: ICS(3) });

gleich('Vorher standen fünf Stunden da', kurz.vorher, 5);
gleich('Danach drei', kurz.nachher, 3);
gleich('Zwei sind entfallen', kurz.erg.entfallen, 2);
gleich('Und drei aufgefrischt', kurz.erg.frisch, 3);
gleich('Nichts neu angelegt', kurz.erg.neu, 0);
gleich('Die drei richtigen Montage stehen da', kurz.daten,
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00']);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Sie sind im Papierkorb, nicht weg');

/* DAS IST DER UNTERSCHIED ZU „LÖSCHEN". Eine Zeile kann eigene Notizen
   tragen; §9 und §13 verbieten, sie beim Einlesen wegzuwerfen. Der
   Papierkorb nimmt sie aus der Ansicht und lässt alles stehen. */
gleich('Zwei liegen im Papierkorb', kurz.korbZahl, 2);
gleich('Und zwar genau die beiden letzten', kurz.korbDaten,
  ['2026-09-28T10:00', '2026-10-05T10:00']);
gleich('Mit Titel und allem', kurz.korbTitel, ['Mathematik']);
p('Und mit Zeitstempel, damit der Papierkorb sie einordnen kann',
  kurz.korbStempel);

/* ------------------------------------------------------------------------ */
console.log('\n3 · SPERRE 1: eine Reihe, die gar nicht kam, bleibt stehen');

/* DIE GEFÄHRLICHERE HÄLFTE, und ohne diesen Abschnitt wäre §1 auch mit
   einer Fassung grün, die einfach alles wegräumt, was nicht kam. Ein Abo,
   das bei einer Netzstörung leer antwortet, hätte damit den ganzen
   Kalender in den Papierkorb gelegt. */
const stumm = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const roll = (t: string) => {
    const g = K.icsLesen(t); const r: any[] = [];
    g.termine.forEach((x: any) => K.wiederholungen(x).forEach((y: any) => r.push(y)));
    return r;
  };
  const s = Store.addPage(null, { text: 'Stille' });
  const coll = K.zielDatenbank(s.id, 'Termine still');
  K.uebernehmen(coll, roll(arg.mathe), 'Schule');
  K.uebernehmen(coll, roll(arg.deutsch), 'Schule');
  const vorher = Store.rowsOf(coll.id).length;
  /* Die Quelle liefert nur noch Deutsch — Mathematik fehlt ganz. */
  const nurDeutsch = K.uebernehmen(coll, roll(arg.deutsch), 'Schule');
  /* Und der Extremfall: gar nichts. */
  const garnichts = K.uebernehmen(coll, [], 'Schule');
  return { vorher, nurDeutsch, garnichts, nachher: Store.rowsOf(coll.id).length };
}, { mathe: ICS(3, 'm@s', 'Mathematik'), deutsch: ICS(3, 'd@s', 'Deutsch') });

gleich('Vorher sechs Zeilen', stumm.vorher, 6);
gleich('Fehlt Mathematik ganz, entfällt nichts', stumm.nurDeutsch.entfallen, 0);
gleich('Und eine leere Antwort räumt gar nichts weg', stumm.garnichts.entfallen, 0);
gleich('Es stehen weiter sechs Zeilen da', stumm.nachher, 6);

/* ------------------------------------------------------------------------ */
console.log('\n4 · SPERRE 2: ein Einzeltermin wird nie angefasst');

const einzeln = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const roll = (t: string) => {
    const g = K.icsLesen(t); const r: any[] = [];
    g.termine.forEach((x: any) => K.wiederholungen(x).forEach((y: any) => r.push(y)));
    return r;
  };
  const s = Store.addPage(null, { text: 'Einzeln' });
  const coll = K.zielDatenbank(s.id, 'Termine einzeln');
  K.uebernehmen(coll, roll(arg.mitZahnarzt), 'Schule');
  const vorher = Store.rowsOf(coll.id).length;
  /* Der Zahnarzt fällt aus der Quelle, die Reihe wird kürzer. */
  const erg = K.uebernehmen(coll, roll(arg.ohneZahnarzt), 'Schule');
  const zeilen = Store.rowsOf(coll.id);
  return { vorher, erg, nachher: zeilen.length,
           titel: zeilen.map((r: any) => r.text).sort() };
}, {
  /* ZWEI EINZELTERMINE, und der zweite ist der eigentliche Prüfstein.
     `plan@s#raum2` trägt eine Raute — Kennungen in ICS sind undurchsichtige
     Zeichenketten, und ein fremder Kalender darf dort schreiben, was er
     will. Vor der Raute steht ausgerechnet die Kennung der Reihe, die
     dieser Lauf liefert.

     OHNE DIE ZIFFERNPRÜFUNG wäre er als „Folge von `plan@s`" gelesen und
     weggeräumt worden. Der Zahnarzt allein hätte das nicht gezeigt: seine
     Kennung hat gar keine Raute, also fängt ihn schon die erste Sperre.
     Gemessen — die Mutation ohne Ziffernprüfung blieb mit ihm allein
     grün. */
  mitZahnarzt: ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
    'BEGIN:VEVENT', 'UID:plan@s', 'SUMMARY:Mathematik',
    'DTSTART:20260907T080000Z', 'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:zahn@privat', 'SUMMARY:Zahnarzt',
    'DTSTART:20261020T140000Z', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:plan@s#raum2', 'SUMMARY:Raumwechsel',
    'DTSTART:20261021T140000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'),
  ohneZahnarzt: ICS(2, 'plan@s', 'Mathematik')
});

gleich('Vorher drei Stunden und zwei Einzeltermine', einzeln.vorher, 5);
/* NUR DIE DRITTE STUNDE ENTFÄLLT. Ein Einzeltermin trägt keine
   Folgenummer — über ihn lässt sich gar nichts sagen, er kann von Hand
   angelegt sein. */
gleich('Nur die eine überzählige Stunde entfällt', einzeln.erg.entfallen, 1);
gleich('Beide Einzeltermine stehen noch da', einzeln.titel,
  ['Mathematik', 'Mathematik', 'Raumwechsel', 'Zahnarzt']);
gleich('Also vier Zeilen', einzeln.nachher, 4);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Zwei Namen, dieselbe Reihe — und eine Sperre, die falsch war');

/* HIER STAND EINE DRITTE SPERRE, und der Prüflauf hat sie erlegt.
   „Nur Zeilen DIESER Quelle aufräumen" klang vernünftig: zwei Kalender
   könnten dieselbe Kennung führen. Gemessen gibt es diesen Fall gar nicht
   — `uebernehmen` findet die Zeile über die Kennung, ganz gleich welcher
   Name danebensteht, also entsteht für dieselbe Kennung nie eine zweite
   Zeile. Erwartet waren zehn, gezählt fünf.

   Und was die Sperre stattdessen bewirkte, war ein Schaden: BENENNT
   jemand sein Abo um — ein Klick —, tragen die aufgefrischten Zeilen den
   neuen Namen und die überzähligen den alten. Die wären damit für immer
   unaufräumbar gewesen. Eine Sperre gegen einen Fall, den es nicht gibt,
   sperrt am Ende den, den es gibt. */
const zweiNamen = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const roll = (t: string) => {
    const g = K.icsLesen(t); const r: any[] = [];
    g.termine.forEach((x: any) => K.wiederholungen(x).forEach((y: any) => r.push(y)));
    return r;
  };
  const s = Store.addPage(null, { text: 'Umbenannt' });
  const coll = K.zielDatenbank(s.id, 'Termine umbenannt');
  K.uebernehmen(coll, roll(arg.fuenf), 'Stundenplan');
  const nachErstem = Store.rowsOf(coll.id).length;
  /* Derselbe Kalender noch einmal, unter demselben Namen: keine zweite
     Fassung. Das ist der Beleg, dass die Kennung allein entscheidet. */
  K.uebernehmen(coll, roll(arg.fuenf), 'Stundenplan');
  const nachZweitem = Store.rowsOf(coll.id).length;
  /* Jetzt benennt der Mensch sein Abo um UND die Reihe wird kürzer. */
  const erg = K.uebernehmen(coll, roll(arg.drei), 'Schule 11b');
  const zeilen = Store.rowsOf(coll.id);
  return { nachErstem, nachZweitem, erg, nachher: zeilen.length,
           namen: [...new Set(zeilen.map((r: any) => String((r.props || {}).quelle || '')))],
           daten: zeilen.map((r: any) => (r.props || {}).start).sort() };
}, { fuenf: ICS(5), drei: ICS(3) });

gleich('Einmal eingelesen: fünf Zeilen', zweiNamen.nachErstem, 5);
/* DIE KENNUNG ENTSCHEIDET, NICHT DER NAME. */
gleich('Noch einmal eingelesen: immer noch fünf', zweiNamen.nachZweitem, 5);
gleich('Nach Umbenennen und Verkürzen entfallen zwei', zweiNamen.erg.entfallen, 2);
gleich('Es bleiben drei', zweiNamen.nachher, 3);
gleich('Und alle tragen den neuen Namen', zweiNamen.namen, ['Schule 11b']);
gleich('Mit den richtigen Daten', zweiNamen.daten,
  ['2026-09-07T10:00', '2026-09-14T10:00', '2026-09-21T10:00']);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Der Satz steht nur, wenn wirklich etwas entfallen ist');

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/verbinden/kalender.ts'), 'utf-8');
p('Der Hinweis hängt an einer Bedingung',
  /if \(entfallen\)\s*\n?\s*UI\.banner\(entfallen/.test(quelle));
p('Und sagt, WO die Termine hin sind',
  /im Papierkorb\. Von dort holst du sie zurück/.test(quelle));
/* EINZAHL UND MEHRZAHL, weil „1 Termine" jedem auffällt und nichts kostet. */
p('Mit Einzahl und Mehrzahl',
  /entfallen === 1\s*\n?\s*\? ' Termin steht/.test(quelle));
p('Der Weg über eine Datei sagt es auch',
  /die Datei führt sie nicht mehr/.test(quelle));

/* GEGENPROBE ZUR MESSUNG SELBST: im gewöhnlichen Lauf ist `entfallen` 0,
   und dann darf gar nichts erscheinen. §1 misst denselben Bestand von der
   anderen Seite. */
const stillerLauf = await pc.evaluate(async (arg: any) => {
  const K = (globalThis as any).Kalender;
  const roll = (t: string) => {
    const g = K.icsLesen(t); const r: any[] = [];
    g.termine.forEach((x: any) => K.wiederholungen(x).forEach((y: any) => r.push(y)));
    return r;
  };
  const s = Store.addPage(null, { text: 'Ruhig' });
  const coll = K.zielDatenbank(s.id, 'Termine ruhig');
  K.uebernehmen(coll, roll(arg.fuenf), 'Schule');
  return K.uebernehmen(coll, roll(arg.fuenf), 'Schule');
}, { fuenf: ICS(5) });

gleich('Beim gewöhnlichen Abgleich entfällt nichts', stillerLauf.entfallen, 0);
gleich('Und nichts wird neu angelegt', stillerLauf.neu, 0);

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
