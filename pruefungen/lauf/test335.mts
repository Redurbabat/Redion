/* Suite 335 — Der einzelne gestrichene Termin (L112 Rest, E343)
 * ============================================================================
 * E336 hat die REIHEN abgeräumt: verkürzt die Schule eine Reihe, wandern die
 * überzähligen Stunden in den Papierkorb. Für einen Termin, der zu keiner
 * Reihe gehört, stand in L112 der Satz, warum es nicht ging:
 *
 *     „über einen Einzeltermin lässt sich nichts sagen. Er kann von Hand
 *      angelegt worden sein, er kann aus einer Datei stammen, er kann zu
 *      einem Abo gehören, das gerade nur ein kürzeres Zeitfenster liefert."
 *
 * Und darunter, was fehlte: „einen Vermerk am Abo, WELCHE Kennungen es beim
 * letzten Mal geliefert hat. Dann — und nur dann — liesse sich sagen: diese
 * Kennung kam von diesem Abo und kommt nicht mehr."
 *
 * Genau das ist E343. Der Gewinn ist, dass die Liste die heikelsten Fälle von
 * SELBST sicher macht: was von Hand angelegt wurde, stand nie darin.
 *
 *   §1 DER ERSTE LAUF SCHREIBT NUR. Er räumt nichts ab — sonst räumte
 *      ausgerechnet die Umstellung auf diese Fassung alles weg.
 *   §2 DER ZWEITE RÄUMT DEN GESTRICHENEN AB — in den Papierkorb.
 *   §3 UND DER VON HAND ANGELEGTE ÜBERLEBT. Ohne diesen Abschnitt misst §2
 *      nichts: er wäre auch dann grün, wenn einfach alles wegflöge.
 *   §4 EIN LEERER LAUF räumt nicht ab und vergisst nichts.
 *   §5 ZWEI ABOS räumen einander nicht ab.
 *   §6 EIN DATEI-IMPORT hat kein Gedächtnis und räumt deshalb nichts ab.
 *   §7 DER GANZE WEG ÜBER DAS NETZ: das Gedächtnis landet am Abo, überlebt
 *      einen Neustart und reist mit der Sicherung.
 *
 *   node pruefungen/lauf/test335.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9338;
/* DER KALENDER LIEGT AUF EINEM ANDEREN TOR, und das ist keine Zierde.
   Redions Dienst-Skript merkt sich JEDE eigene GET-Anfrage
   (`src/dienst/sw.ts`) und lässt Fremdes ausdrücklich in Ruhe:

       if (u.origin !== ich.location.origin) return;

   Auf demselben Tor bekam `aboHolen` deshalb beim zweiten Mal den ALTEN
   Kalender aus dem Zwischenspeicher — der Prüfserver lieferte nachweislich
   den kurzen, und oben kamen trotzdem drei Termine an. `Cache-Control:
   no-store` half nichts, weil das Dienst-Skript vor dem Netz sitzt.

   Ein echtes Kalender-Abo liegt ohnehin bei einem fremden Rechner. Der
   Prüfstand bildet das jetzt nach, statt einen Fall zu messen, den es
   draussen nicht gibt. Zwei Stunden Raten wären das nicht wert gewesen —
   gemessen war es in fünf Minuten. */
const ICS_PORT = 9339;

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

/* Was der Kalender-Server GERADE ausliefert. §7 dreht daran. */
let ausgeliefert = '';

/** Der fremde Rechner mit dem Kalender. Siehe `ICS_PORT` oben. */
const icsServer = http.createServer((_a: IncomingMessage, b: ServerResponse) => {
  b.writeHead(200, { 'Content-Type': 'text/calendar',
                     'Cache-Control': 'no-store, no-cache, must-revalidate',
                     'Access-Control-Allow-Origin': '*' });
  b.end(ausgeliefert);
});
await new Promise<void>(f => { icsServer.listen(ICS_PORT, () => f()); });

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

const kalender = (...ereignisse: string[][]): string =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:Schule',
   ...ereignisse.flat(), 'END:VCALENDAR'].join('\r\n');

const termin = (uid: string, titel: string, tag: string): string[] =>
  ['BEGIN:VEVENT', 'UID:' + uid, 'SUMMARY:' + titel,
   'DTSTART:' + tag + 'T080000Z', 'DTEND:' + tag + 'T093000Z', 'END:VEVENT'];

const DREI = kalender(termin('a@s', 'Zahnarzt', '20261020'),
                      termin('b@s', 'Elternabend', '20261021'),
                      termin('c@s', 'Wandertag', '20261022'));
/* Derselbe Kalender, aber der Elternabend ist gestrichen. */
const ZWEI = kalender(termin('a@s', 'Zahnarzt', '20261020'),
                      termin('c@s', 'Wandertag', '20261022'));
const LEER = kalender();

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

/* Ein Lauf gegen `uebernehmen` selbst — ohne Netz, damit sich jede Sperre
   einzeln stellen lässt. §7 nimmt danach den ganzen Weg. */
const lauf = (name: string) => pc.evaluate(async (n: string) => {
  const K = (globalThis as any).Kalender;
  const s = Store.addPage(null, { text: 'Kalender ' + n });
  const coll = K.zielDatenbank(s.id, 'Termine ' + n);
  return coll.id;
}, name);

const uebernimm = (collId: string, ics: string, quelle: string,
                   vorher?: string[]) => pc.evaluate((d: any) => {
  const K = (globalThis as any).Kalender;
  const coll = Store.cache.collections[d.collId];
  const alle = K.ausrollenAlle(K.icsLesen(d.ics).termine);
  const e = K.uebernehmen(coll, alle, d.quelle, d.vorher);
  return { neu: e.neu, frisch: e.frisch, entfallen: e.entfallen,
           geliefert: (e.geliefert || []).slice().sort(),
           zeilen: Store.rowsOf(coll.id)
             .map((r: any) => String((r.props || {}).uid || '')).sort() };
}, { collId, ics, quelle, vorher });

/* ========================================================================
 * 1 · Der erste Lauf schreibt nur
 * ======================================================================*/
console.log('\n1 · Der erste Lauf legt an und räumt nichts ab');

const c1 = await lauf('eins');
const e1 = await uebernimm(c1, DREI, 'Schule');
gleich('Drei Termine sind da', e1.zeilen, ['a@s', 'b@s', 'c@s']);
gleich('Drei sind neu', e1.neu, 3);
gleich('Und nichts ist entfallen', e1.entfallen, 0);
gleich('Das Gedächtnis nennt alle drei', e1.geliefert, ['a@s', 'b@s', 'c@s']);

/* OHNE ALTE LISTE PASSIERT NICHTS, auch wenn die Quelle weniger liefert.
   Das ist die Sperre, die den ersten Lauf nach der Umstellung rettet: jedes
   Abo, das es heute gibt, hat noch kein Gedächtnis.

   NACHGEMESSEN, WORAN DIESER ABSCHNITT HÄNGT — und es ist nicht eine Zeile,
   sondern zwei: die Bedingung vor der Schleife (`vorherGeliefert.length`)
   UND der Herkunftsnachweis darin (`!frueher.has(u)`). Jede allein genügt,
   also bleibt er grün, wenn man nur eine entfernt. Erst wenn BEIDE fallen,
   wird er rot — gemessen, nicht behauptet. Doppelt gesichert ist hier
   richtig, aber es soll niemand glauben, eine der beiden Zeilen sei durch
   diesen Abschnitt gedeckt. */
const e1b = await uebernimm(c1, ZWEI, 'Schule');
gleich('Ohne Gedächtnis bleibt der gestrichene stehen', e1b.zeilen,
       ['a@s', 'b@s', 'c@s']);
gleich('… und nichts wird gemeldet', e1b.entfallen, 0);

/* ========================================================================
 * 2 · Der zweite Lauf räumt ab
 * ======================================================================*/
console.log('\n2 · Mit Gedächtnis wandert der gestrichene in den Papierkorb');

const c2 = await lauf('zwei');
const v2 = await uebernimm(c2, DREI, 'Schule');
const e2 = await uebernimm(c2, ZWEI, 'Schule', v2.geliefert);
gleich('Der Elternabend ist aus der Ansicht', e2.zeilen, ['a@s', 'c@s']);
gleich('Genau einer ist entfallen', e2.entfallen, 1);
gleich('Und das Gedächtnis ist nachgezogen', e2.geliefert, ['a@s', 'c@s']);

/* IM PAPIERKORB, NICHT IM NICHTS (§9, §13). */
const papier = await pc.evaluate((d: any) => {
  const alle = Object.values(Store.cache.blocks) as any[];
  const w = alle.find((b: any) => b && b.parentId === d.collId &&
                                  String((b.props || {}).uid || '') === 'b@s');
  return { gefunden: !!w, lebt: w ? w.alive : null, text: w ? w.text : '' };
}, { collId: c2 });
p('Der Block ist noch da', papier.gefunden);
gleich('… aber nicht mehr lebendig', papier.lebt, false);
gleich('… und trägt noch seinen Titel', papier.text, 'Elternabend');

/* ========================================================================
 * 3 · Und der von Hand angelegte überlebt
 *
 * DIE GEGENPROBE, DIE DEN GANZEN BOGEN TRÄGT. Ohne sie misst §2 nichts: er
 * wäre auch dann grün, wenn jede Zeile wegflöge, die diesmal nicht kam.
 * Genau das war L112s Einwand, und genau den beantwortet die Liste — was von
 * Hand kommt, stand nie darin.
 * ======================================================================*/
console.log('\n3 · Von Hand Angelegtes rührt niemand an');

const c3 = await lauf('drei');
const v3 = await uebernimm(c3, DREI, 'Schule');
await pc.evaluate((d: any) => {
  /* Drei Nachbarn, die alle NICHT aus diesem Abo stammen. */
  Store.addRow(d.collId, { uid: 'von-hand', start: '2026-10-25T10:00',
                           text: 'Von Hand eingetragen' });
  Store.addRow(d.collId, { uid: 'aus-datei@x', start: '2026-10-26T10:00',
                           quelle: 'ferien.ics' });
  /* Und einer ganz ohne Kennung — den findet `uebernehmen` nie. */
  Store.addRow(d.collId, { start: '2026-10-27T10:00' });
}, { collId: c3 });
const e3 = await uebernimm(c3, ZWEI, 'Schule', v3.geliefert);
gleich('Nur der gestrichene fiel', e3.entfallen, 1);
gleich('Die drei Fremden stehen alle noch', e3.zeilen,
       ['', 'a@s', 'aus-datei@x', 'c@s', 'von-hand']);

/* ========================================================================
 * 4 · Ein leerer Lauf
 * ======================================================================*/
console.log('\n4 · Eine leere Antwort räumt nicht ab und vergisst nichts');

const c4 = await lauf('vier');
const v4 = await uebernimm(c4, DREI, 'Schule');
const e4 = await uebernimm(c4, LEER, 'Schule', v4.geliefert);
gleich('Alle drei stehen noch', e4.zeilen, ['a@s', 'b@s', 'c@s']);
gleich('Nichts entfallen', e4.entfallen, 0);
/* Und der Lauf danach räumt WIEDER richtig auf — das Gedächtnis von §4
   wurde nicht überschrieben, weil `alleAbosHolen` es nur nach einem Lauf
   mit Terminen setzt. Hier gilt dasselbe von Hand. */
const e4b = await uebernimm(c4, ZWEI, 'Schule', v4.geliefert);
gleich('Danach räumt der nächste Lauf wieder', e4b.entfallen, 1);

/* ========================================================================
 * 5 · Zwei Abos in einer Tabelle
 * ======================================================================*/
console.log('\n5 · Zwei Abos räumen einander nicht ab');

const c5 = await lauf('fuenf');
const SPORT = kalender(termin('s1@v', 'Training', '20261101'),
                       termin('s2@v', 'Turnier', '20261102'));
const vSchule = await uebernimm(c5, DREI, 'Schule');
const vSport  = await uebernimm(c5, SPORT, 'Sportverein');
/* Der Sportverein streicht sein Turnier. Die Schultermine gehen ihn nichts an. */
const e5 = await uebernimm(c5, kalender(termin('s1@v', 'Training', '20261101')),
                           'Sportverein', vSport.geliefert);
gleich('Nur das Turnier fiel', e5.entfallen, 1);
gleich('Die Schultermine stehen alle noch', e5.zeilen,
       ['a@s', 'b@s', 'c@s', 's1@v']);
gleich('Und das Gedächtnis der Schule ist unberührt', vSchule.geliefert,
       ['a@s', 'b@s', 'c@s']);

/* ========================================================================
 * 6 · Ein Datei-Import
 * ======================================================================*/
console.log('\n6 · Eine eingelesene Datei hat kein Gedächtnis');

const c6 = await lauf('sechs');
await uebernimm(c6, DREI, 'ferien.ics');
/* Genau so ruft der Datei-Weg `uebernehmen` — ohne vierten Wert. */
const e6 = await uebernimm(c6, ZWEI, 'ferien.ics');
gleich('Alle drei stehen noch', e6.zeilen, ['a@s', 'b@s', 'c@s']);
gleich('Nichts entfallen', e6.entfallen, 0);

/* ========================================================================
 * 7 · Der ganze Weg über das Netz
 *
 * Bis hierher wurde `uebernehmen` von Hand gefüttert. Jetzt die Frage, auf
 * die es ankommt: SCHREIBT das Abo sein Gedächtnis wirklich, und übersteht
 * es einen Neustart?
 * ======================================================================*/
console.log('\n7 · Das Abo merkt es sich wirklich — über Netz und Neustart');

ausgeliefert = DREI;
const netz1 = await pc.evaluate(async (url: string) => {
  const K = (globalThis as any).Kalender;
  /* WELCHE TABELLE ES IST, WIRD GEMERKT, NICHT GESUCHT. Der erste Wurf
     nahm die erste Sammlung, deren Name auf „Termine" passt — und §1 bis
     §5 haben fünf davon angelegt. Gemeldet wurden drei Fehler, die es
     nicht gab; gemessen wurde eine fremde Tabelle. */
  const vorher = new Set(Object.keys(Store.cache.collections));
  const s = Store.addPage(null, { text: 'Abo-Kalender' });
  Store.setMeta('ics:abos', [{ name: 'Schule', url, an: true }]);
  await K.alleAbosHolen(s.id);
  const abo = (Store.getMeta('ics:abos', []) || [])[0];
  const coll = (Object.values(Store.cache.collections) as any[])
    .find((c: any) => !vorher.has(c.id));
  if (Store.flush) await Store.flush();
  (globalThis as any).__t335 = coll && coll.id;
  Store.setMeta('test335Tabelle', coll && coll.id);
  return { collId: coll && coll.id, name: coll && coll.name,
           geliefert: (abo && abo.geliefert || []).slice().sort(),
           zeilen: coll ? Store.rowsOf(coll.id).length : -1 };
}, `http://localhost:${ICS_PORT}/kalender.ics`);
gleich('Drei Zeilen aus dem Netz', netz1.zeilen, 3);
gleich('Das Abo hat sich alle drei gemerkt', netz1.geliefert,
       ['a@s', 'b@s', 'c@s']);

/* NEUSTART — das Gedächtnis liegt in `ics:abos`, also in der Ablage. */
await pc.reload();
await pc.waitForTimeout(2600);
const nachNeustart = await pc.evaluate(() =>
  ((Store.getMeta('ics:abos', []) || [])[0]?.geliefert || []).slice().sort());
gleich('Nach dem Neustart steht es noch da', nachNeustart, ['a@s', 'b@s', 'c@s']);

ausgeliefert = ZWEI;
const netz2 = await pc.evaluate(async (collId: string) => {
  const K = (globalThis as any).Kalender;
  await K.alleAbosHolen();
  const abo = (Store.getMeta('ics:abos', []) || [])[0];
  return { geliefert: (abo && abo.geliefert || []).slice().sort(),
           zeilen: Store.rowsOf(collId)
             .map((r: any) => String((r.props || {}).uid || '')).sort() };
}, netz1.collId);
gleich('Der gestrichene ist aus der Ansicht', netz2.zeilen, ['a@s', 'c@s']);
gleich('Und das Gedächtnis ist nachgezogen', netz2.geliefert, ['a@s', 'c@s']);

/* UND DIE SICHERUNG NIMMT ES MIT. Ohne das wäre der erste Lauf nach einem
   Einspielen wieder einer ohne Gedächtnis. */
const inSicherung = await pc.evaluate(async () => {
  const roh = await Store.exportAll();
  const daten = typeof roh === 'string' ? JSON.parse(roh) : roh;
  /* `meta` ist im Export ein OBJEKT, kein Feld von Sätzen. Nachgemessen,
     nicht geraten. */
  const meta = daten.meta || {};
  const wert = meta['ics:abos'];
  return { drin: 'ics:abos' in meta,
           geliefert: (wert && wert[0] && wert[0].geliefert || []).slice().sort() };
});
p('Die Abos stehen in der Sicherung', inSicherung.drin);
gleich('… samt Gedächtnis', inSicherung.geliefert, ['a@s', 'c@s']);

gleich('Keine JS-Fehler auf der Seite', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));
await new Promise<void>(f => icsServer.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
