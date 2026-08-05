/* Suite 68 — Die Grenzen des ZIP-Packers, in Node, ohne Browser
 * ----------------------------------------------------------------------------
 * Eine `.redion`-Sicherung ist ein gewöhnliches ZIP. Ein ZIP dieser Bauart —
 * ohne ZIP64 — hat drei Grenzen, und alle drei sind in Bytes des Formats
 * festgeschrieben, nicht in der Laune des Packers:
 *
 *   eine einzelne Datei     4 GB   (32 Bit)
 *   das ganze Archiv        4 GB   (32 Bit)
 *   die Anzahl der Einträge 65 535 (**16 Bit**)
 *
 * Für die ersten zwei gab es eine Prüfung mit einer verständlichen
 * Fehlermeldung. Für die dritte nicht — und das ist genau der Unterschied,
 * auf den es hier ankommt: die ersten zwei scheitern laut, die dritte
 * scheiterte **still**. `schreibe16(ende, 8, 70000)` schreibt kein 70000, es
 * schreibt 4464. Das Archiv sieht danach gesund aus, lässt sich öffnen — und
 * jedes Packprogramm zeigt 4464 von 70000 Dateien.
 *
 * Wer 70 000 Anhänge sichert, bekommt eine Datei, die aussieht wie eine
 * vollständige Sicherung. Er merkt es an dem Tag, an dem er sie braucht.
 *
 * Das ist wieder derselbe Befund wie an acht Stellen zuvor: nicht etwas
 * vergessen, sondern etwas an einer Stelle getan und an der Nachbarstelle
 * nicht. Zwei Grenzen geprüft, die dritte danebengelegen.
 *
 * WIE: `ausgeben.js` ist ein gewöhnliches Skript, kein Modul. Es wird gelesen
 * und ausgewertet — mit einer Attrappe für `window` und `document`, denn
 * gebraucht wird davon nur `laden()`, und das läuft hier nicht. `Blob`,
 * `TextEncoder` und `crypto` bringt Node 20 selbst mit.
 *
 *   node pruefungen/lauf/test103.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const quelle = _lies(_dazu(WURZEL, 'quell/bereiche/dateien/ausgeben.js'), 'utf8');
const Austausch = new Function('window', 'document',
  quelle + '\nreturn Austausch;')({}, {});

/* ---------------------------------------------------------------------------
 * Ein Archiv aufmachen, ohne es zu glauben
 * ---------------------------------------------------------------------------
 * Nicht „hat zipSchreiben etwas zurückgegeben" ist die Frage, sondern „was
 * steht im Schlusssatz des Archivs". Der ist die einzige Stelle, an der ein
 * Leser erfährt, wie viele Einträge er zu erwarten hat — und genau die wurde
 * still falsch beschrieben.
 * -------------------------------------------------------------------------*/
const eocdEintraege = async (blob: any) => {
  const b = new Uint8Array(await blob.arrayBuffer());
  /* Ohne Archivkommentar steht der Schlusssatz in den letzten 22 Bytes. */
  const e = b.length - 22;
  if (!(b[e] === 0x50 && (b[e+1] ?? 0) === 0x4b && (b[e+2] ?? 0) === 0x05 && (b[e+3] ?? 0) === 0x06))
    return null;
  return {
    aufDatentraeger: (b[e+8] ?? 0)  | ((b[e+9] ?? 0)  << 8),
    gesamt:          (b[e+10] ?? 0) | ((b[e+11] ?? 0) << 8)
  };
};

const vieleEintraege = (n: any) => {
  const l = [];
  for (let i = 0; i < n; i++) l.push({ name: 'd/' + i + '.txt', inhalt: 'x' });
  return l;
};

console.log('\n1 · Was hineingeht, muss auch draufstehen');

{
  const blob = await Austausch.zipSchreiben(vieleEintraege(3));
  const z = await eocdEintraege(blob);
  p('Drei Einträge, drei im Schlusssatz',
    z && z.gesamt === 3 && z.aufDatentraeger === 3,
    JSON.stringify(z));
}

console.log('\n2 · Mehr als 65 535 Einträge — laut scheitern, nicht still');

{
  /* 65 535 ist die Grenze selbst und muss noch durchgehen. Eine Prüfung, die
     einen Schritt zu früh zuschlägt, ist genauso falsch wie eine, die fehlt —
     nur ärgert sie in die andere Richtung. */
  let fehlerAnDerGrenze = null;
  try { await Austausch.zipSchreiben(vieleEintraege(65535)); }
  catch (e: unknown) { fehlerAnDerGrenze = (e instanceof Error ? e.message : String(e)); }
  p('65 535 Einträge gehen noch durch', fehlerAnDerGrenze === null,
    String(fehlerAnDerGrenze));
}

{
  let fehler = null, blob = null;
  try { blob = await Austausch.zipSchreiben(vieleEintraege(65536)); }
  catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }

  p('65 536 Einträge werden abgelehnt', fehler !== null,
    'kein Fehler geworfen — das Archiv wäre still unvollständig');

  p('Die Meldung nennt die Zahl, um die es geht',
    typeof fehler === 'string' && /65\s?535/.test(fehler),
    String(fehler));

  p('Die Meldung sagt, was zu tun ist',
    typeof fehler === 'string' && fehler.length > 60,
    String(fehler));

  /* Die Gegenprobe zur Gegenprobe: Falls doch ein Archiv entstünde, dürfte
     es auf keinen Fall eine falsche Zahl nennen. */
  if (blob) {
    const z = await eocdEintraege(blob);
    p('Falls doch ein Archiv entsteht, stimmt wenigstens die Zahl',
      z && z.gesamt === 65536, 'Schlusssatz sagt ' + JSON.stringify(z));
  }
}

console.log('\n3 · Die beiden 4-GB-Grenzen melden sich weiterhin');

{
  /* Kein echtes 4-GB-Objekt — nur eines, das behauptet, so gross zu sein.
     Der Packer fragt `.length`, bevor er irgendetwas anfasst. */
  const riesig = { name: 'video.mp4', inhalt: { length: 0xFFFFFFFF + 1 } };
  let fehler = null;
  try { await Austausch.zipSchreiben([riesig]); } catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('Eine Datei über 4 GB wird abgelehnt', fehler !== null);
  p('Die Meldung nennt die Datei beim Namen',
    typeof fehler === 'string' && (fehler ?? '').includes('video.mp4'), String(fehler));
}

/* ===========================================================================
 * 4 · Die Nachbarstelle: das Lesen
 * ---------------------------------------------------------------------------
 * Der Packer weigert sich jetzt, ein abgeschnittenes Archiv zu schreiben. Das
 * ist die halbe Arbeit. Redion liest auch fremde Archive — Notion-Exporte,
 * .docx, .xlsx, ein `.redion` von einem anderen Gerät —, und ein Werkzeug mit
 * ZIP64 schreibt genau die Archive, die Redion selbst ablehnt.
 *
 * Ein ZIP64-Archiv trägt im alten Schlusssatz Platzhalter: 0xFFFF Einträge,
 * 0xFFFFFFFF für Grösse und Versatz des Verzeichnisses. Die echten Zahlen
 * stehen in einem eigenen Satz davor, den diese Leser nicht kennen.
 *
 * Ohne Prüfung war das Ergebnis: `blob.slice(0xFFFFFFFF, …)` gibt einen
 * leeren Ausschnitt, die Schleife läuft nullmal, und `zipLesenAusBlob` meldet
 * **null Dateien und keinen Fehler**. Wer eine Sicherung mit 70 000 Anhängen
 * einspielt, sieht „0 Anhänge" und hält es für richtig.
 *
 * Erkannt wird ZIP64 am Wegweiser (0x07064b50) direkt vor dem Schlusssatz —
 * nicht an den Platzhaltern selbst. Ein Archiv mit genau 65 535 Einträgen
 * schreibt nämlich auch 0xFFFF, ohne ZIP64 zu sein, und darf nicht
 * fälschlich abgelehnt werden.
 * =========================================================================*/
console.log('\n4 · Ein ZIP64-Archiv wird erkannt, nicht stillschweigend geleert');

const einlesenQuelle = _lies(_dazu(WURZEL, 'quell/bereiche/dateien/einlesen.js'), 'utf8');
const Einlesen = new Function('window', 'document', 'self',
  einlesenQuelle + '\nreturn Einlesen;')({}, {}, {});

/** Ein Schlusssatz mit ZIP64-Platzhaltern, davor der Wegweiser. */
const zip64Ende = () => {
  const b = new Uint8Array(20 + 22);
  const w32 = (i: number, v: any) => { b[i]=v&255; b[i+1]=(v>>>8)&255; b[i+2]=(v>>>16)&255; b[i+3]=(v>>>24)&255; };
  const w16 = (i: number, v: any) => { b[i]=v&255; b[i+1]=(v>>>8)&255; };
  w32(0, 0x07064b50);                    /* der Wegweiser auf den ZIP64-Satz */
  w32(20, 0x06054b50);
  w16(28, 0xFFFF); w16(30, 0xFFFF);      /* Platzhalter statt der Anzahl     */
  w32(32, 0xFFFFFFFF); w32(36, 0xFFFFFFFF);
  return b;
};

{
  let fehler = null;
  try { await Einlesen.zipLesen(zip64Ende().buffer); } catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('zipLesen lehnt ZIP64 ab', fehler !== null);
  p('zipLesen nennt ZIP64 beim Namen',
    typeof fehler === 'string' && /ZIP64/.test(fehler), String(fehler));
}

{
  let fehler = null, zip = null;
  try { zip = await Einlesen.zipLesenAusBlob(new Blob([zip64Ende()])); }
  catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('zipLesenAusBlob lehnt ZIP64 ab', fehler !== null,
    zip ? 'still durchgelassen mit ' + zip.namen.length + ' Dateien' : '');
  p('zipLesenAusBlob nennt ZIP64 beim Namen',
    typeof fehler === 'string' && /ZIP64/.test(fehler), String(fehler));
}

{
  /* Die Gegenrichtung. Ein gewöhnliches Archiv aus Redions eigenem Packer
     muss weiterhin gelesen werden — sonst hätte die Prüfung den Import
     kaputtgemacht statt ihn zu retten. */
  const blob = await Austausch.zipSchreiben([
    { name: 'daten.json', inhalt: '{"a":1}' },
    { name: 'dateien/x.txt', inhalt: 'hallo' }
  ]);
  let fehler = null, zip = null;
  try { zip = await Einlesen.zipLesenAusBlob(blob); } catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('Ein gewöhnliches Archiv wird weiterhin gelesen', fehler === null, String(fehler));
  p('… und beide Dateien sind da',
    !!zip && zip.namen.length === 2 && (zip.namen ?? '').includes('daten.json'),
    JSON.stringify(zip && zip.namen));
  if (zip) p('… und der Inhalt stimmt', (await zip.text('daten.json')) === '{"a":1}');
}

console.log(`\n  Suite 68 — ZIP-Grenzen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
