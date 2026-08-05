/* Alle Prüfläufe — Orchestrator
 * ----------------------------------------------------------------------------
 * Startet jeden Lauf unter pruefungen/lauf/ als eigenen Kindprozess, wartet
 * auf sein Ende und sammelt das Ergebnis. Zwischen zwei Läufen drei Sekunden
 * Pause — ohne sie werden die Läufe flockig, weil Playwright Ports und
 * IndexedDB einen Moment braucht, bevor sie frei sind.
 *
 * Aufruf:
 *   node pruefungen/alle.mts              alles
 *   node pruefungen/alle.mts --schnell    ohne die Messläufe (~11 min)
 *   node pruefungen/alle.mts 87 88 89     nur diese drei
 *   node pruefungen/alle.mts server       nur die Serverläufe
 *   node pruefungen/alle.mts --alt        auch alt/ — tut nichts, wenn kein alt/
 *
 * Über npm mit zwei Strichen:
 *   npm run pruefen -- --schnell
 *   npm run pruefen -- 87 88 89
 * ========================================================================== */
import { spawn } from 'node:child_process';
import { join as dazu, dirname as ordner } from 'node:path';
import { fileURLToPath as alsPfad } from 'node:url';
import { readdirSync as liesOrdner, existsSync as da } from 'node:fs';

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

/* Zahlen: explizite Testnummern */
const nummern = args.filter(a => /^\d+$/.test(a)).map(Number);

/* --------------------------------------------------------------------------
 * Alle verfügbaren Läufe ermitteln
 * ------------------------------------------------------------------------*/
type Lauf = { datei: string; nr: number | null; name: string; server: boolean; messung: boolean };

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
  auswahl = alle.filter(l => !l.messung);
} else {
  auswahl = alle;
}

if (auswahl.length === 0) {
  console.error('Keine Läufe gefunden. Argumente: ' + JSON.stringify(args));
  process.exit(1);
}

/* --------------------------------------------------------------------------
 * Lauf starten und auf Ergebnis warten
 * ------------------------------------------------------------------------*/
const starte = (datei: string): Promise<{ code: number }> =>
  new Promise(resolve => {
    const kind = spawn(process.execPath, [datei], { stdio: 'inherit' });
    kind.on('close', code => resolve({ code: code ?? 1 }));
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
  const { code } = await starte(lauf.datei);
  if (code !== 0) gescheitert.push(lauf.name);
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
