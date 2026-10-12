/* Alle Prüfläufe — Orchestrator
 * ----------------------------------------------------------------------------
 * Startet jeden Lauf unter pruefungen/lauf/ als eigenen Kindprozess, wartet
 * auf sein Ende und sammelt das Ergebnis. Zwischen zwei Läufen drei Sekunden
 * Pause — ohne sie werden die Läufe flockig, weil Playwright Ports und
 * IndexedDB einen Moment braucht, bevor sie frei sind.
 *
 * Aufruf:
 *   node pruefungen/alle.mts              alles (gemessen 158 min, E743 —
 *                                         gefahren wird das in Stücken:
 *                                         pruefungen/volllauf.mts, §30)
 *   node pruefungen/alle.mts --schnell    der schnelle Lauf: jeder Lauf ohne
 *                                         Browser, dazu test96 und test100
 *                                         aus §31 (gemessen 4 min 14 s, E745)
 *   node pruefungen/alle.mts 87 88 89     nur diese drei
 *   node pruefungen/alle.mts server       nur die Serverläufe
 *   node pruefungen/alle.mts --alt        auch alt/ — tut nichts, wenn kein alt/
 *   … --liste                             die Auswahl nur DRUCKEN, nichts
 *                                         starten (mit jedem Schalter oben)
 *
 * Über npm mit zwei Strichen:
 *   npm run pruefen -- --schnell
 *   npm run pruefen -- --schnell --liste
 *   npm run pruefen -- 87 88 89
 *
 * WAS --schnell HEISST, UND WARUM ES ERST SEIT E745 STIMMT. Bis zum
 * 11. Oktober 2026 liess `--schnell` genau einen Lauf weg — test73, die
 * Startmessung —, also 549 von 550. Der Kopf versprach „~11 min" aus der
 * Zeit, als es 67 Läufe gab. Seit E745 ist es die Auswahl, die die CI fährt
 * (Redur, 11. Oktober: „2 . Scnell lauf", Weg (c) aus L254): jeder Lauf, der
 * keinen Browser startet, und dazu die wenigen aus SCHNELL_MIT_BROWSER —
 * jeder mit Grund, jeder in CLAUDE.md §31 beim Namen. test610 hält beides.
 * ========================================================================== */
import { spawn } from 'node:child_process';
import { join as dazu, dirname as ordner } from 'node:path';
import { fileURLToPath as alsPfad } from 'node:url';
import { readdirSync as liesOrdner, existsSync as da, readFileSync as lies } from 'node:fs';

const PRUEF = ordner(alsPfad(import.meta.url));
const LAUF  = dazu(PRUEF, 'lauf');
const ALT   = dazu(PRUEF, 'alt');

/* --------------------------------------------------------------------------
 * Argumente auswerten
 * ------------------------------------------------------------------------*/
const args   = process.argv.slice(2);
const schnell = args.includes('--schnell');
const mitAlt  = args.includes('--alt');
const nurServer = args.includes('server');
/* Nur sagen, was laufen WÜRDE — für den Menschen und für test610, der die
   Auswahl der CI nachprüft, ohne sie zu fahren. */
const nurListe = args.includes('--liste');

/* Zahlen: explizite Testnummern */
const nummern = args.filter(a => /^\d+$/.test(a)).map(Number);

/* --------------------------------------------------------------------------
 * Alle verfügbaren Läufe ermitteln
 * ------------------------------------------------------------------------*/
type Lauf = {
  datei: string; nr: number | null; name: string;
  server: boolean; messung: boolean;
  /** Startet einen Browser — gelesen aus der Datei, nicht aus einer Liste. */
  browser: boolean;
};

/* --------------------------------------------------------------------------
 * Der schnelle Lauf (E745)
 * --------------------------------------------------------------------------
 * Ein Lauf ohne Browser ist von Natur aus schnell: gemessen am 11. Oktober
 * 2026 auf 97d156b brauchten die 42 Läufe ohne Browser, die es da gab,
 * zusammen 95 Sekunden, der längste davon test105 (58 s, er baut mit tsc
 * nach /tmp). Die 509 Läufe mit Browser brauchen den grössten Teil der
 * 158 Minuten des vollen Laufs (messungen.md §102).
 *
 * Wer einen Browser startet, steht hier mit Grund — und nur, wenn er in
 * CLAUDE.md §31 beim Namen steht und gemessen schnell ist. Keine zweite
 * Liste der schnellen Läufe: die übrigen findet die Datei selbst.
 * ------------------------------------------------------------------------*/
const SCHNELL_MIT_BROWSER: Readonly<Record<number, string>> = {
  96: 'die .json-Sicherung verliert und leert keine Anhänge (§31, gemessen 8 s)',
  100: '.redion mit echten Bytes: sichern, löschen, zurückholen, vergleichen (§31, gemessen 4 s)',
};

/** Lädt die Datei Playwright? Dann startet sie einen Browser. test610 liest
 *  dieselbe Frage auf einem zweiten Weg (der Aufruf `chromium.launch(`) und
 *  wird rot, wenn beide nicht übereinstimmen. */
const LAEDT_PLAYWRIGHT =
  /\bfrom\s+['"]playwright(?:-core)?['"]|\bimport\(\s*['"]playwright(?:-core)?['"]\s*\)|\brequire\(\s*['"]playwright(?:-core)?['"]\s*\)/;
const startetBrowser = (datei: string): boolean => LAEDT_PLAYWRIGHT.test(lies(datei, 'utf8'));

const ladenAus = (ordnerPfad: string, istAlt = false): Lauf[] => {
  if (!da(ordnerPfad)) return [];
  return liesOrdner(ordnerPfad)
    .filter(f => /\.(mts|mjs)$/.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/\d+/)?.[0] ?? 0);
      const nb = Number(b.match(/\d+/)?.[0] ?? 0);
      if (na !== nb) return na - nb;
      return a.localeCompare(b);
    })
    .map(f => {
      const nr = f === 'servercheck.mts' || f === 'servercheck.mjs'
        ? null
        : Number(f.match(/\d+/)?.[0] ?? 0) || null;
      return {
        datei: dazu(ordnerPfad, f),
        nr,
        name: f.replace(/\.(mts|mjs)$/, ''),
        /* servercheck und test75–79 sowie test101 laufen den Prüfserver */
        server: f.startsWith('servercheck') ||
                (nr !== null && (
                  (nr >= 75 && nr <= 79) ||
                  nr === 92 || nr === 93 || nr === 101
                )),
        /* test73 misst Startzeit und Leistung, kein Pass/Fail */
        messung: nr === 73 || istAlt,
        browser: startetBrowser(dazu(ordnerPfad, f)),
      };
    });
};

let alle: Lauf[] = ladenAus(LAUF);
if (mitAlt) alle = alle.concat(ladenAus(ALT, true));

/* --------------------------------------------------------------------------
 * Filtern
 * ------------------------------------------------------------------------*/
let auswahl: Lauf[];
if (nummern.length > 0) {
  auswahl = alle.filter(l => l.nr !== null && nummern.includes(l.nr));
} else if (nurServer) {
  auswahl = alle.filter(l => l.server);
} else if (schnell) {
  auswahl = alle.filter(l => !l.messung &&
    (!l.browser || (l.nr !== null && SCHNELL_MIT_BROWSER[l.nr] !== undefined)));
} else {
  auswahl = alle;
}

if (auswahl.length === 0) {
  console.error('Keine Läufe gefunden. Argumente: ' + JSON.stringify(args));
  process.exit(1);
}

/* --------------------------------------------------------------------------
 * --liste: die Auswahl drucken und gehen
 * ------------------------------------------------------------------------*/
if (nurListe) {
  const mitBrowser = auswahl.filter(l => l.browser).length;
  const zeilen = [`Prüfläufe: ${auswahl.length} Läufe${schnell ? ' (--schnell)' : ''} — ` +
    `${auswahl.length - mitBrowser} ohne Browser, ${mitBrowser} mit Browser`];
  for (const l of auswahl) {
    const grund = l.nr !== null ? SCHNELL_MIT_BROWSER[l.nr] : undefined;
    zeilen.push(l.name.padEnd(13) +
      (l.browser ? 'Browser' + (grund ? ' — ' + grund : '') : 'ohne Browser'));
  }
  /* ERST WARTEN, DANN GEHEN. Die erste Fassung schrieb Zeile für Zeile mit
     console.log und rief gleich danach process.exit(0). In eine Röhre
     (spawnSync, `| wc -l`) schreibt Node nicht immer sofort; was noch in der
     Schlange stand, ging mit dem Prozess unter. Gemessen am 11. Oktober:
     3 von 40 Listen über alle 552 Läufe kamen abgeschnitten an (240 bis 298
     Zeilen), und eine Gegenprobe von test610 meldete „Kopf 551, Zeilen 463".
     Also EIN Schreiben, und beendet wird erst in seinem Rückruf. */
  await new Promise<void>(fertig => process.stdout.write(zeilen.join('\n') + '\n', () => fertig()));
  process.exit(0);
}

/* --------------------------------------------------------------------------
 * Lauf starten und auf Ergebnis warten
 * ------------------------------------------------------------------------*/
/**
 * Einen Lauf starten — und dabei MITLESEN.
 *
 * DER GRUND, UND ER IST EIN GEFUNDENER FEHLER. Bis hierher zählte allein
 * der Rückgabewert. Ein Lauf, der `process.exit(weg ? 1 : 0)` am Ende hat,
 * meldet damit richtig. Mehrere ältere Läufe haben das aber nicht: sie
 * drucken ihre Zeilen, schliessen den Browser und enden mit 0 — auch mit
 * einem ❌ mittendrin.
 *
 * Gemessen am 8. August: `test31` meldete „33/34 bestanden" mit einem roten
 * Punkt, und der Orchestrator sagte „✓ Alle 101 Läufe bestanden". Ein
 * Prüfstand, der Rotes übersieht, ist schlimmer als keiner — er behauptet,
 * jemand habe hingesehen.
 *
 * Also wird die Ausgabe jetzt gelesen. Ein `❌` oder ein `✗` am Zeilenanfang
 * (nach Leerraum) zählt als gescheitert, ganz gleich, was der Rückgabewert
 * sagt. Die Ausgabe geht dabei weiter durch, Zeile für Zeile — `stdio:
 * 'inherit'` ginge nicht mehr, weil dann niemand mitliest.
 */
/* Wie lange ein Lauf schweigen darf, bevor er als hängend gilt.
   Nicht die Gesamtdauer — manche Läufe rechnen lange und melden dabei
   fleissig. Gemessen wird die STILLE: kein Zeichen auf stdout oder stderr.
   Der längste ehrliche Abstand zwischen zwei Zeilen liegt bei den grossen
   Sicherungsläufen unter zwei Minuten. */
const STILLE_MAX = 5 * 60 * 1000;

const starte = (datei: string): Promise<{ code: number; rot: number; haenger: boolean }> =>
  new Promise(resolve => {
    const kind = spawn(process.execPath, [datei], { stdio: ['inherit', 'pipe', 'pipe'] });
    let rot = 0;
    let rest = '';
    let haenger = false;

    /* EIN LAUF, DER WARTET, SIEHT AUS WIE EINER, DER RECHNET.
       Am 25. August hing `test202` 25 Minuten an einem Fenster, das auf einen
       Klick wartete, der in einem Prüflauf nie kommt — und der ganze
       Durchgang stand still, ohne eine einzige Meldung. Erst ein Blick auf
       die Änderungszeit der Protokolldatei zeigte es (E157).

       Jetzt gibt es eine Uhr: keine Ausgabe für fünf Minuten heisst hängen.
       Der Lauf wird beendet, benannt und der Durchgang geht weiter. */
    let uhr: NodeJS.Timeout;
    const nachstellen = (): void => {
      clearTimeout(uhr);
      uhr = setTimeout(() => {
        haenger = true;
        process.stderr.write('\n  ⏳ ' + datei.split('/').pop() +
          ' hat ' + (STILLE_MAX / 60000) + ' Minuten nichts gemeldet — wird beendet.\n');
        kind.kill('SIGKILL');
      }, STILLE_MAX);
    };
    nachstellen();
    const lesen = (stueck: Buffer, nach: NodeJS.WriteStream) => {
      const text = rest + stueck.toString();
      const zeilen = text.split('\n');
      rest = zeilen.pop() ?? '';
      for (const z of zeilen) {
        /* Nur am Anfang der Zeile. Ein ✗ mitten im Text ist eine
           Erklärung („vorher stand hier ✗"), kein Ergebnis. */
        if (/^\s*(❌|✗)\s/.test(z)) rot++;
        nach.write(z + '\n');
      }
    };
    kind.stdout?.on('data', (d: Buffer) => { nachstellen(); lesen(d, process.stdout); });
    kind.stderr?.on('data', (d: Buffer) => {
      nachstellen(); lesen(d, process.stderr as NodeJS.WriteStream); });
    kind.on('close', code => {
      clearTimeout(uhr);
      if (rest) { if (/^\s*(❌|✗)\s/.test(rest)) rot++; process.stdout.write(rest); }
      resolve({ code: haenger ? 1 : (code ?? 1), rot, haenger });
    });
  });

const warte = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/* --------------------------------------------------------------------------
 * Alle Läufe der Reihe nach
 * ------------------------------------------------------------------------*/
console.log(`\nPrüfläufe: ${auswahl.length} Läufe${schnell ? ' (--schnell)' : ''}\n`);

const gescheitert: string[] = [];
let i = 0;
for (const lauf of auswahl) {
  if (i > 0) await warte(3000);
  i++;
  console.log(`\n──── [${i}/${auswahl.length}] ${lauf.name} ────`);
  const { code, rot, haenger } = await starte(lauf.datei);
  if (haenger) gescheitert.push(lauf.name + ' (hängt — nach ' +
    (STILLE_MAX / 60000) + ' Minuten Stille beendet)');
  else if (code !== 0) gescheitert.push(lauf.name);
  else if (rot > 0) {
    /* Ein Lauf, der rote Punkte druckt und trotzdem mit 0 endet. Beides
       gehört gesagt: dass er rot ist UND dass sein Rückgabewert lügt. */
    console.log(`\n  ⚠ ${lauf.name} meldet ${rot} rote Punkte, endet aber mit 0 — ` +
                `dem Lauf fehlt ein "process.exit(weg ? 1 : 0)".`);
    gescheitert.push(lauf.name + ' (' + rot + ' rot, Rückgabewert 0)');
  }
}

/* --------------------------------------------------------------------------
 * Zusammenfassung
 * ------------------------------------------------------------------------*/
console.log('\n════════════════════════════════════════════════');
if (gescheitert.length === 0) {
  console.log(`✓ Alle ${auswahl.length} Läufe bestanden.`);
  process.exit(0);
} else {
  console.log(`✗ ${gescheitert.length} von ${auswahl.length} Läufen gescheitert:`);
  for (const n of gescheitert) console.log('    ' + n);
  process.exit(1);
}
