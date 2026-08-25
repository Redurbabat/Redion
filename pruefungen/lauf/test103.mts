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

let ok = 0, weg = 0, uebersprungen = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const skip = (n: string, grund: string) => {
  uebersprungen++;
  console.log('  ↷ ' + n + ' — übersprungen: ' + grund);
};

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

/* ---------------------------------------------------------------------------
 * Die Sätze am Ende eines Archivs auslesen
 * -------------------------------------------------------------------------*/
const schlussSaetze = async (blob: any) => {
  const b = new Uint8Array(await blob.arrayBuffer());
  const u16 = (i: number) => (b[i] ?? 0) | ((b[i+1] ?? 0) << 8);
  const u32 = (i: number) => ((b[i] ?? 0) | ((b[i+1] ?? 0) << 8) |
                              ((b[i+2] ?? 0) << 16) | ((b[i+3] ?? 0) << 24)) >>> 0;
  const u64 = (i: number) => u32(i) + u32(i + 4) * 4294967296;
  const e = b.length - 22;
  if (u32(e) !== 0x06054b50) return null;
  const hatWegweiser = e >= 20 && u32(e - 20) === 0x07064b50;
  const raus: any = {
    eocdEintraege: u16(e + 10), eocdVzGroesse: u32(e + 12), eocdVzStart: u32(e + 16),
    hatWegweiser, zip64: null as any
  };
  if (hatWegweiser) {
    const z = u64(e - 20 + 8);
    if (u32(z) === 0x06064b50)
      raus.zip64 = { eintraege: u64(z + 32), vzGroesse: u64(z + 40), vzStart: u64(z + 48),
                     fassung: u16(z + 14) };
  }
  return raus;
};

console.log('\n2 · Mehr als 65 535 Einträge — jetzt geschrieben, nicht abgelehnt');

/* WAS SICH HIER GEDREHT HAT (6. August 2026, E39). Bis heute brach der
   Packer bei 65 536 Einträgen ab. Die Meldung war ehrlich und riet, „die
   Anhänge in zwei Schritten" zu sichern — nur gibt es diesen zweiten
   Schritt in Redion nicht: jeder Weg mündet in dasselbe eine Archiv. Wer
   zu viele Anhänge hatte, konnte gar nicht sichern. Jetzt schreibt Redion
   ZIP64, und dieser Abschnitt prüft die Gegenrichtung. */
{
  /* 65 535 ist die Grenze der alten Bauart. Sie muss weiterhin OHNE ZIP64
     durchgehen — sonst wären ältere Fassungen von Redion und alte
     Werkzeuge ohne Not ausgesperrt. */
  const blob = await Austausch.zipSchreiben(vieleEintraege(65535));
  const s = await schlussSaetze(blob);
  p('65 535 Einträge gehen ohne ZIP64 durch', s && s.hatWegweiser === false,
    JSON.stringify(s));
  p('… und die Zahl steht im alten Schlusssatz', s && s.eocdEintraege === 65535,
    JSON.stringify(s));
}

{
  const blob = await Austausch.zipSchreiben(vieleEintraege(65536));
  const s = await schlussSaetze(blob);
  p('65 536 Einträge werden geschrieben', !!blob && !!s, 'kein Archiv entstanden');
  p('Das Archiv bekommt einen ZIP64-Wegweiser', s && s.hatWegweiser === true,
    JSON.stringify(s));
  p('Der ZIP64-Satz nennt die echte Zahl', s && s.zip64 && s.zip64.eintraege === 65536,
    JSON.stringify(s && s.zip64));
  /* Und der alte Satz trägt den Platzhalter — DAS ist der Unterschied zu
     vorher. Früher stand dort 0, weil `schreibe16(…, 65536)` überlief. */
  p('Der alte Schlusssatz trägt den Platzhalter, nicht eine falsche Zahl',
    s && s.eocdEintraege === 0xFFFF, String(s && s.eocdEintraege));
  p('Die benötigte Fassung ist 45', s && s.zip64 && s.zip64.fassung === 45,
    String(s && s.zip64 && s.zip64.fassung));
}

console.log('\n3 · Die 4-GB-Grenzen — geprüft ohne 4 GB zu schreiben');

/* WIE MAN DAS ÜBERHAUPT PRÜFT. Ein Prüflauf kann keine vier Gigabyte
   schreiben; er kann aber dieselbe Verzweigung bei vierzig Byte nehmen.
   `Austausch.grenzen` ist genau dafür da. Das Ergebnis ist kein Ersatz,
   sondern ein vollwertiges ZIP64 — nur mit kleinen Dateien. Abschnitt 5
   lässt es von `unzip` und Python gegenlesen; damit hängt der Beweis nicht
   daran, dass Redion liest, was Redion schrieb. */
{
  const alt = Austausch.grenzen.bytes;
  Austausch.grenzen.bytes = 40;          /* jede Datei „zu gross"        */
  const blob = await Austausch.zipSchreiben([
    { name: 'a.txt', inhalt: 'x'.repeat(60) },
    { name: 'b.txt', inhalt: 'y'.repeat(60) }
  ]);
  Austausch.grenzen.bytes = alt;

  const b = new Uint8Array(await blob.arrayBuffer());
  const u16 = (i: number) => (b[i] ?? 0) | ((b[i+1] ?? 0) << 8);
  const u32 = (i: number) => ((b[i] ?? 0) | ((b[i+1] ?? 0) << 8) |
                              ((b[i+2] ?? 0) << 16) | ((b[i+3] ?? 0) << 24)) >>> 0;
  const u64 = (i: number) => u32(i) + u32(i + 4) * 4294967296;

  p('Der lokale Kopf trägt den Platzhalter', u32(18) === 0xFFFFFFFF && u32(22) === 0xFFFFFFFF,
    `${u32(18)} / ${u32(22)}`);
  p('… und nennt Fassung 45', u16(4) === 45, String(u16(4)));
  const extra = 30 + u16(26);
  p('… und führt das ZIP64-Zusatzfeld', u16(extra) === 0x0001 && u16(extra + 2) === 16,
    `Kennung 0x${u16(extra).toString(16)}, Länge ${u16(extra + 2)}`);
  p('… mit der echten Länge darin', u64(extra + 4) === 60 && u64(extra + 12) === 60,
    `${u64(extra + 4)} / ${u64(extra + 12)}`);

  /* Der zweite Eintrag liegt weit genug hinten, dass auch sein VERSATZ
     überläuft — dann stehen drei Zahlen im Zusatz, nicht zwei. Genau hier
     verschiebt sich alles, wenn man die Reihenfolge falsch rät. */
  const s = await schlussSaetze(blob);
  p('Ein Archiv aus lauter „grossen" Dateien wird ZIP64', s && s.hatWegweiser === true,
    JSON.stringify(s));
}

{
  /* Und die Gegenrichtung: unter der Schwelle bleibt alles wie bisher.
     Ein Archiv, das ohne Not ZIP64 wird, sperrt alte Werkzeuge aus. */
  const blob = await Austausch.zipSchreiben([{ name: 'klein.txt', inhalt: 'hallo' }]);
  const s = await schlussSaetze(blob);
  const b = new Uint8Array(await blob.arrayBuffer());
  p('Ein kleines Archiv bleibt frei von ZIP64', s && s.hatWegweiser === false,
    JSON.stringify(s));
  p('… und sein lokaler Kopf nennt weiterhin Fassung 20',
    ((b[4] ?? 0) | ((b[5] ?? 0) << 8)) === 20);
  p('… und hat kein Zusatzfeld', ((b[28] ?? 0) | ((b[29] ?? 0) << 8)) === 0);
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

/* EIN KAPUTTES ZIP64 DARF WEITERHIN NICHT STILL LEER SEIN. `zip64Ende()`
   ist genau das: ein Wegweiser ohne den Satz, auf den er zeigt. Der erste
   Entwurf des neuen Lesers nahm hier „ersatzweise" die Zahlen aus dem alten
   Schlusssatz — dort stehen dann 0xFFFFFFFF, `blob.slice` gibt nichts
   zurück, und heraus kamen **null Dateien und kein Fehler**. Also genau der
   Fehler, gegen den dieser Abschnitt einmal geschrieben wurde. Gefunden hat
   ihn dieser Prüflauf selbst; ohne ihn wäre er mit dem ZIP64-Umbau
   zurückgekommen. */
{
  let fehler = null;
  try { await Einlesen.zipLesen(zip64Ende().buffer); } catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('zipLesen meldet ein kaputtes ZIP64', fehler !== null);
  p('… und sagt, dass der ZIP64-Satz fehlt',
    typeof fehler === 'string' && /ZIP64/.test(fehler), String(fehler));
}

{
  let fehler = null, zip = null;
  try { zip = await Einlesen.zipLesenAusBlob(new Blob([zip64Ende()])); }
  catch (e: unknown) { fehler = (e instanceof Error ? e.message : String(e)); }
  p('zipLesenAusBlob meldet ein kaputtes ZIP64', fehler !== null,
    zip ? 'still durchgelassen mit ' + zip.namen.length + ' Dateien' : '');
  p('… und sagt, dass der ZIP64-Satz fehlt',
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

/* ===========================================================================
 * 5 · Der Rundlauf — und ein fremdes Werkzeug als Zeuge
 * ---------------------------------------------------------------------------
 * „Redion liest, was Redion schrieb" ist kein Beweis. Zwei Fehler, die sich
 * gegenseitig aufheben, bestehen diese Prüfung mühelos: schreibt der Packer
 * den Versatz um vier Byte verschoben und liest der Leser ihn genauso
 * verschoben zurück, ist alles grün und das Archiv trotzdem kaputt — es
 * fällt an dem Tag auf, an dem jemand es mit einem anderen Programm öffnet.
 *
 * Deshalb steht hier `unzip` daneben. Es kennt Redion nicht und hat keinen
 * Grund, denselben Fehler zu machen.
 * =========================================================================*/
console.log('\n5 · Der Rundlauf, bezeugt von einem fremden Werkzeug');

import { execFileSync as _fuehreAus, spawnSync as _starte } from 'node:child_process';
import { writeFileSync as _schreib, mkdtempSync as _tmpOrdner } from 'node:fs';
import { tmpdir as _tmp } from 'node:os';

const ordner = _tmpOrdner(_dazu(_tmp(), 'redion-zip-'));

/**
 * Verfügbarkeit ohne Shell prüfen. `command -v` wäre selbst wieder ein
 * Unix-Werkzeug und `where` ein Windows-Sonderweg. `spawnSync` benutzt die
 * normale Programmsuche der jeweiligen Plattform; nur ENOENT bedeutet hier
 * „nicht installiert“. Ein vorhandenes, aber defektes Werkzeug wird dagegen
 * NICHT übersprungen — seine Gegenprobe soll dann ehrlich fehlschlagen.
 */
const werkzeugDa = (name: string): boolean => {
  const probe = _starte(name, ['-h'], { stdio: 'ignore', windowsHide: true });
  return !probe.error || (probe.error as NodeJS.ErrnoException).code !== 'ENOENT';
};

const hatUnzip = werkzeugDa('unzip');
const hatZipinfo = werkzeugDa('zipinfo');

/**
 * Ein Archiv auf die Platte legen und ein fremdes Werkzeug darauf loslassen.
 *
 * `nurSumme` schaltet auf `zipinfo -t` um, das eine einzige Zeile ausgibt
 * statt einer je Eintrag. DAS IST NICHT KOSMETIK: bei 70 000 Einträgen warf
 * `unzip -l` den Prüflauf mit `ENOBUFS` ab — die Ausgabe passte nicht mehr
 * in den Puffer, und das sah aus wie ein kaputtes Archiv, obwohl das Archiv
 * in Ordnung war. Eine Prüfung, die am eigenen Werkzeug scheitert, misst
 * nichts.
 */
const fremdGelesen = (blob: Uint8Array, datei: string, nurSumme = false) => {
  const pfad = _dazu(ordner, datei);
  _schreib(pfad, blob);
  try {
    const text = nurSumme
      ? _fuehreAus('zipinfo', ['-t', pfad], { encoding: 'utf8' })
      : _fuehreAus('unzip', ['-l', pfad], { encoding: 'utf8' });
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, text: String(e.stdout || '') + String(e.stderr || e.message) };
  }
};

{
  /* Ein ZIP64 mit echtem Inhalt: Schwelle abgesenkt, damit dieselbe
     Verzweigung greift wie bei 4 GB. Das Ergebnis ist ein gültiges ZIP64,
     nur klein — und genau das kann `unzip` bestätigen. */
  const alt = Austausch.grenzen.bytes;
  Austausch.grenzen.bytes = 20;
  const blob = await Austausch.zipSchreiben([
    { name: 'daten.json', inhalt: '{"seiten":3,"wer":"Redion"}' },
    { name: 'dateien/bild.txt', inhalt: 'Bytes eines Bildes, so tun als ob.' },
    { name: 'dateien/zweit.txt', inhalt: 'Noch ein Anhang.' }
  ]);
  Austausch.grenzen.bytes = alt;
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (hatUnzip) {
    const fremd = fremdGelesen(bytes, 'zip64.zip');
    p('`unzip` liest Redions ZIP64 ohne Klage', fremd.ok, fremd.text.slice(0, 200));
    p('… und findet alle drei Einträge',
      ['daten.json', 'dateien/bild.txt', 'dateien/zweit.txt'].every(n => fremd.text.includes(n)),
      fremd.text.slice(0, 200));
    p('… mit den richtigen Längen',
      fremd.text.includes('27') && fremd.text.includes('34') && fremd.text.includes('16'),
      fremd.text.slice(0, 200));
  } else {
    const grund = '`unzip` ist auf dieser Plattform nicht installiert';
    skip('`unzip` liest Redions ZIP64 ohne Klage', grund);
    skip('… und findet alle drei Einträge', grund);
    skip('… mit den richtigen Längen', grund);
  }

  /* Und derselbe Weg zurück, durch beide Leser. */
  const ausPuffer = await Einlesen.zipLesen(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  p('zipLesen holt das ZIP64 zurück', ausPuffer.namen.length === 3, JSON.stringify(ausPuffer.namen));
  p('… mit unverändertem Inhalt',
    (await ausPuffer.text('daten.json')) === '{"seiten":3,"wer":"Redion"}',
    String(await ausPuffer.text('daten.json')));

  const ausBlob = await Einlesen.zipLesenAusBlob(blob);
  p('zipLesenAusBlob ebenso', ausBlob.namen.length === 3, JSON.stringify(ausBlob.namen));
  p('… und der zweite Anhang stimmt auch',
    (await ausBlob.text('dateien/zweit.txt')) === 'Noch ein Anhang.',
    String(await ausBlob.text('dateien/zweit.txt')));
}

{
  /* Die Gegenrichtung: ein ZIP64 aus fremder Hand. 70 000 Einträge sind
     mit `unzip` nicht zu bauen, wohl aber mit Redions eigenem Packer —
     und danach liest ein FREMDES Werkzeug nach, dass die Zahl stimmt. */
  const blob = await Austausch.zipSchreiben(vieleEintraege(70000));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (hatZipinfo) {
    const fremd = fremdGelesen(bytes, 'viele.zip', true);
    p('`zipinfo` liest ein Archiv mit 70 000 Einträgen', fremd.ok, fremd.text.slice(-200));
    p('… und zählt alle 70 000', /70000 files/.test(fremd.text), fremd.text.trim());
  } else {
    const grund = '`zipinfo` ist auf dieser Plattform nicht installiert';
    skip('`zipinfo` liest ein Archiv mit 70 000 Einträgen', grund);
    skip('… und zählt alle 70 000', grund);
  }

  const zip = await Einlesen.zipLesenAusBlob(blob);
  p('Und Redion selbst findet sie wieder', zip.namen.length === 70000,
    String(zip.namen.length));
  p('… auch den allerletzten', (await zip.text('d/69999.txt')) === 'x',
    String(await zip.text('d/69999.txt')));
}

{
  /* Und der Beweis, dass die Grenze wirklich gefallen ist: derselbe
     Bestand, der vorher eine Fehlermeldung ergab, ergibt jetzt eine
     Sicherung, die man zurückspielen kann. */
  const eintraege = vieleEintraege(66000);
  eintraege[0] = { name: 'daten.json', inhalt: '{"echt":true}' };
  const blob = await Austausch.zipSchreiben(eintraege);
  const zip = await Einlesen.zipLesenAusBlob(blob);
  p('66 000 Anhänge: Sicherung geschrieben und zurückgelesen',
    zip.namen.length === 66000, String(zip.namen.length));
  p('… und `daten.json` ist noch da und lesbar',
    (await zip.text('daten.json')) === '{"echt":true}');
}

console.log(`\n  Suite 68 — ZIP-Grenzen: ${ok} ok, ${weg} offen, ${uebersprungen} übersprungen`);
process.exit(weg ? 1 : 0);
