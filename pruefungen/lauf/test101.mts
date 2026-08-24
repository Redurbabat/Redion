/* Suite 66 — Wie gross darf eine Anfrage sein?
 * ----------------------------------------------------------------------------
 * `LUECKEN.md` führte D1 als Ordnungsaufgabe:
 *
 *   „Nachgemessen ist die Prüfung überall da, sie steht nur je Route statt an
 *    einem Ort. Was offen bleibt, ist Ordnung."
 *
 * Diese Messung war unvollständig. Sie hat die Felder angesehen, die eine
 * Prüfung **haben** — und nicht die, die keine haben.
 *
 * ─── ES GAB KEINE OBERGRENZE FÜR DEN ANFRAGEKÖRPER ──────────────────────────
 *
 * `request.json()` in `server/cloudflare.ts` liest, was kommt. Kein
 * `Content-Length`, keine Grenze, kein Abbruch. Wer 200 MB schickt, bekommt
 * sie geparst — im Arbeitsspeicher eines Workers, der 128 MB hat.
 *
 * ─── UND DAS GRÖSSTE FELD WAR UNGEBUNDEN ────────────────────────────────────
 *
 * Beim Veröffentlichen einer Seite: `titel` ist auf 200 Zeichen begrenzt,
 * `inhalt` auf gar nichts. Es geht durch `sauber()` — mehrere reguläre
 * Ausdrücke über die ganze Zeichenkette — und danach in die Datenbank.
 *
 * Beides zusammen ist kein Loch, durch das Daten abfliessen, sondern eines,
 * durch das welche hineinlaufen: fremder Speicherplatz, fremde Rechenzeit,
 * und eine Rechnung, die jemand anders bezahlt.
 *
 * ─── WAS DIE REPARATUR NICHT KAPUTTMACHEN DARF ──────────────────────────────
 *
 * Eine Grenze, die zu eng sitzt, ist schlimmer als keine: der Abgleich
 * schickt bis zu 300 Sätze auf einmal (`KONSTANTEN.ABGLEICH_RUNDE`), und
 * wenn der bei der ersten grossen Seite abbricht, verliert jemand seine
 * Änderungen — genau das, was Priorität 1 verbietet. Deshalb hat jede
 * Routenfamilie ihre eigene Grenze, und der Abgleich die grosszügigste.
 *
 *   node pruefungen/lauf/test101.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

let E = null, ladefehler = null;
try { E = await import('../../server/sicherheit/eingaben.ts'); }
catch (e: unknown) { ladefehler = (e instanceof Error ? e.message : String(e)); }

p('Es gibt eine Stelle für die Eingabegrenzen', !!E,
  ladefehler ? ladefehler.split('\n')[0] ?? '' : '');

/* ========================================================================= *
 * 1 · DIE TABELLE — WAS GILT WOFÜR
 * ---------------------------------------------------------------------------
 * Der Sinn von D1 ist nicht, dass die Prüfung irgendwo steht, sondern dass
 * sie AUFFINDBAR ist. Zwei Felder namens `name` mit 80 und 60 Zeichen sind
 * kein Fehler — dass man das nur merkt, wenn man beide Zeilen zufällig
 * nebeneinander liest, schon.
 * ========================================================================= */
if (E) {
  console.log('\n1 · Die Tabelle');

  p('Es gibt eine Feldtabelle', E.FELDER && typeof E.FELDER === 'object');
  p('… und sie kennt die Felder, die es wirklich gibt',
    ['bereichName', 'markeName', 'titel', 'inhalt', 'geraet'].every(f => E.FELDER[f]),
    Object.keys(E.FELDER || {}).join(', '));

  gleich('Ein Bereichsname darf 80 Zeichen', E.FELDER['bereichName']?.max, 80);
  gleich('Ein Markenname 60 — das ist kein Widerspruch, sondern ein anderes Ding',
    E.FELDER['markeName']?.max, 60);

  /* Die Rechnung dahinter muss stimmen, nicht nur die Zahl. */
  gleich('Zu langer Text wird geschnitten',
    E.text('x'.repeat(300), 'titel').length, 200);
  gleich('Kurzer Text bleibt, wie er ist', E.text('Hallo', 'titel'), 'Hallo');
  gleich('Nichts wird zur Vorgabe', E.text('', 'titel'), 'Ohne Titel');
  gleich('Leerraum aussen fällt weg', E.text('  Hallo  ', 'titel'), 'Hallo');
  gleich('Auch eine Zahl kommt als Text heraus', E.text(42, 'titel'), '42');
  gleich('Und ein unbekanntes Feld bekommt trotzdem eine Grenze',
    E.text('y'.repeat(9999), 'gibtesnicht').length <= 1000, true);

  /* Die Gegenrichtung: eine Grenze, die zu eng sitzt, ist auch ein Fehler. */
  gleich('Ein normaler Bereichsname geht unverändert durch',
    E.text('Familie Müller — Haushalt', 'bereichName'), 'Familie Müller — Haushalt');

  /* ======================================================================= *
   * 2 · DIE OBERGRENZE FÜR DEN KÖRPER
   * ======================================================================= */
  console.log('\n2 · Wie gross ein Anfragekörper sein darf');

  p('Es gibt eine Grenze je Routenfamilie', typeof E.koerperGrenze === 'function');
  const klein = E.koerperGrenze('/bereich/liste');
  /* Der echte Weg des Abgleichs — nicht '/abgleich', den es nie gab. Der
     falsche Name liess den Abgleich auf die 1-MB-Vorgabe fallen, und diese
     Prüfung war grün dabei, weil sie denselben falschen Namen fragte. */
  const gross = E.koerperGrenze('/sync/hoch');
  p('Eine gewöhnliche Route darf wenig', klein > 0 && klein <= 2 * 1024 * 1024,
    String(klein));
  p('Der Abgleich darf mehr — sonst bricht er bei der ersten grossen Seite ab',
    gross > klein, `${gross} gegen ${klein}`);
  p('… aber nicht unbegrenzt', gross <= 32 * 1024 * 1024, String(gross));

  p('Die Prüfung selbst sagt ja oder nein', typeof E.koerperZuGross === 'function');
  gleich('Ein kleiner Körper geht durch',
    E.koerperZuGross('/bereich/liste', 1000), false);
  gleich('Ein zu grosser nicht',
    E.koerperZuGross('/bereich/liste', 50 * 1024 * 1024), true);
  gleich('Ohne Längenangabe wird nicht geraten — es geht durch',
    E.koerperZuGross('/bereich/liste', null), false);
}

/* ========================================================================= *
 * 3 · UND JETZT AM ECHTEN SERVER
 * ---------------------------------------------------------------------------
 * Abschnitt 1 und 2 fragen die Funktion. Dieser fragt den Server. Der
 * Unterschied ist der ganze Punkt: die Funktion kann richtig rechnen und
 * trotzdem nie gerufen werden.
 * ========================================================================= */
console.log('\n3 · Am echten Server');

const { starte } = await import('../../server/pruefserver.ts');
const srv = await starte(8816, { umwelt: { ADRESSE: 'https://redion.example' } });

const schicke = async (pfad: any, koerper: any, kopf = {}) => {
  const a = await fetch(srv.adresse + pfad, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, kopf),
    body: typeof koerper === 'string' ? koerper : JSON.stringify(koerper)
  });
  const text = await a.text();
  let j = null; try { j = JSON.parse(text); } catch {}
  return { status: a.status, text, j };
};

/* Vier Megabyte an eine gewöhnliche Route. Ohne Grenze wird das geparst. */
const riesig = JSON.stringify({ name: 'x'.repeat(4 * 1024 * 1024) });
const abgewiesen = await schicke('/bereich/liste', riesig);
p('Ein Riesenkörper wird abgewiesen', abgewiesen.status === 413,
  `Status ${abgewiesen.status}`);
p('… mit einem Satz, der die Grenze nennt',
  /\d/.test(abgewiesen.text ?? '') && /gross|groß|Grenze|MB/i.test(abgewiesen.text ?? ''),
  abgewiesen.text.slice(0, 140));

/* Die Gegenrichtung, und sie ist die wichtigere: eine gewöhnliche Anfrage
   muss weiterhin durchgehen. Eine Grenze, die den Alltag trifft, wird
   ausgebaut — und dann ist gar keine da. */
const normal = await schicke('/api/stand', {});
p('Eine gewöhnliche Anfrage geht weiter durch', normal.status < 500,
  `Status ${normal.status}`);

const mittel = await schicke('/sync/hoch', { saetze: [] });
p('Auch der Abgleich antwortet noch', mittel.status < 500, `Status ${mittel.status}`);

/* Und der Abgleich darf mehr als eine kleine Route — mit derselben Grösse,
   die eben abgewiesen wurde. 401 heisst: die Grösse war nicht das Problem,
   nur das fehlende Token — genau richtig. */
const abgleichGross = await schicke('/sync/hoch', riesig);
p('Derselbe Körper ist beim Abgleich nicht zu gross',
  abgleichGross.status !== 413, `Status ${abgleichGross.status}`);

await srv.stopp();

/* ========================================================================= *
 * 4 · DER QUELLTEXT-BELEG
 * ---------------------------------------------------------------------------
 * Eine Prüfung, die nur an einer Stelle greift, ist keine. Hier steht, dass
 * beide Wege in den Server durch dieselbe Tür gehen — der Prüfserver und
 * Cloudflare.
 * ========================================================================= */
console.log('\n4 · Beide Türen sind zu');

const ohneKommentar = (s: any) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const wolke  = ohneKommentar(_lies(_dazu(WURZEL, 'server/cloudflare.ts'), 'utf8'));
const pruef  = ohneKommentar(_lies(_dazu(WURZEL, 'server/pruefserver.ts'), 'utf8'));
const kern   = ohneKommentar(_lies(_dazu(WURZEL, 'server/kern.ts'), 'utf8'));

p('cloudflare.js prüft die Grösse, bevor es liest', /koerperZuGross/.test(wolke));
p('pruefserver.js auch', /koerperZuGross/.test(pruef));
p('Der Kern nimmt die Feldgrenzen aus der Tabelle', /eingaben\.js|FELDER|feldText/.test(kern));

/* Das eigentliche Feld, um das es ging. */
p('`inhalt` der veröffentlichten Seite ist begrenzt',
  /inhalt:\s*sauber\(feldText|inhalt:\s*feldText|inhalt[^\n]{0,80}'inhalt'/.test(kern),
  'es ging ungeprüft durch sauber() und in die Datenbank');

/* Und die Richtung, die niemand prüft, weil sie „schon immer" stimmte:
   die Länge muss VOR dem Säubern greifen. Andersherum läuft der teure
   reguläre Ausdruck erst über die ganzen 200 MB und schneidet danach. */
p('… und zwar bevor gesäubert wird, nicht danach',
  !/sauber\(String\(k\.inhalt/.test(kern),
  'sauber() läuft sonst über die volle Länge — die Grenze käme zu spät');

console.log(`\n  Suite 66 — Eingabegrenzen: ${ok} ok, ${weg} offen`);
/* KEIN `process.exit()`. Der reisst den Prozess ab, auch wenn noch etwas
   offen ist — unter Windows endete dieser Lauf genau daran mit einer
   libuv-Assertion, nachdem alle fachlichen Punkte grün waren. `exitCode`
   sagt dasselbe und lässt Node zu Ende räumen. Möglich wurde das erst,
   seit `srv.stopp()` wirklich anhält (E125, test205). */
process.exitCode = weg ? 1 : 0;
