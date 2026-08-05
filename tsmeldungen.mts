/* ============================================================================
 * tsmeldungen.mts — die Meldungen von tsc holen, für alle Umzugswerkzeuge
 * ----------------------------------------------------------------------------
 * `benannte.mts`, `deklarationen.mts`, `rueckgabe.mts`, `typenhilfe.mts` und
 * `unbenutzt.mts` fangen alle gleich an: tsc laufen lassen, die Ausgabe
 * nehmen — auch (und gerade) wenn tsc mit einem Fehlerstand endet, denn genau
 * dann steht ja etwas drin.
 *
 * Bis Bündel 18 stand in jedem der fünf Werkzeuge `tsconfig.bauen.json` fest
 * eingetragen, weil der Umzug nur `src/` betraf. Seit `server/` dazugekommen
 * ist, stimmt das nicht mehr: Server- und Prüfcode werden von `tsconfig.json`
 * geprüft und nie gebaut. Statt die Zeile fünfmal zu ändern, steht sie
 * einmal hier.
 *
 * WELCHE DATEI GILT
 *   ohne Angabe          tsconfig.bauen.json  (der Umzug nach quell/)
 *   --konfig tsconfig.json   oder   --konfig=tsconfig.json
 *
 * Die Meldungen kommen unverändert zurück, Zeile für Zeile, so wie tsc sie
 * schreibt: `pfad(zeile,spalte): error TSxxxx: Text`.
 * ==========================================================================*/

import { execSync } from 'node:child_process';

/* Die Konfiguration aus den Aufrufargumenten lesen. Beide Schreibweisen
   gehen, weil beide vorkommen: `--konfig x` und `--konfig=x`. */
export const konfigAus = (argv: string[]): string => {
  const mitGleich = argv.find(a => a.startsWith('--konfig='));
  if (mitGleich) return mitGleich.slice('--konfig='.length);
  const i = argv.indexOf('--konfig');
  if (i >= 0 && argv[i + 1]) return argv[i + 1] as string;
  return 'tsconfig.bauen.json';
};

/* tsc laufen lassen und die Ausgabe nehmen. Ein Fehlerstand ist hier der
   Normalfall und kein Grund abzubrechen — die Meldungen stehen dann in
   `stdout`, nicht in `stderr`. */
export const meldungen = (konfig: string = 'tsconfig.bauen.json'): string => {
  try {
    return execSync(`npx tsc --noEmit -p ${konfig}`, { encoding: 'utf8' });
  } catch (e: unknown) {
    const f = e as { stdout?: string };
    return f.stdout ?? '';
  }
};
