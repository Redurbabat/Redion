/* ============================================================================
 * deklarationen.mts — Typen für Variablen ohne erkennbaren Anfangswert
 * ----------------------------------------------------------------------------
 * `let laeuft = null;` und `const kanten = [];` sagen TypeScript nichts. Es
 * meldet TS7034 („der Typ lässt sich an dieser Stelle nicht bestimmen") und
 * an jeder Benutzung noch einmal TS7005.
 *
 * Dieses Werkzeug schreibt `: any` beziehungsweise `: any[]` dahinter — je
 * nachdem, ob rechts `[]` steht. Mehr Ehrgeiz wäre hier falsch: was die
 * Variable später wirklich hält, steht erst in der Zuweisung fünfzig Zeilen
 * weiter, und die zu raten ginge daneben.
 *
 * Wie bei den Parametern gilt: `any` ist eine Zwischenstation. Es macht den
 * Umzug abschliessbar, ohne irgendwo einen Typ zu behaupten, der nicht stimmt.
 *
 * Aufruf:  node deklarationen.mts [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';
import { meldungen, konfigAus } from './tsmeldungen.mts';

type Fund = { datei: string; zeile: number; spalte: number; name: string; feld: boolean };

const roh = meldungen(konfigAus(process.argv));

const funde: Fund[] = [];
for (const z of roh.split('\n')) {
  const m = z.match(/^(.+?)\((\d+),(\d+)\): error TS7034: Variable '(.+?)' implicitly has type '(.+?)'/);
  if (m && m[1] && m[2] && m[3] && m[4] && m[5])
    funde.push({ datei: m[1], zeile: +m[2], spalte: +m[3], name: m[4], feld: m[5].endsWith('[]') });
}

if (!funde.length) { console.log('Nichts offen — kein TS7034.'); process.exit(0); }

const schreiben = process.argv.includes('--schreiben');
const proDatei = new Map<string, Fund[]>();
for (const f of funde) {
  const liste = proDatei.get(f.datei) ?? [];
  liste.push(f);
  proDatei.set(f.datei, liste);
}

let gesetzt = 0;
for (const [datei, liste] of proDatei) {
  const zeilen = readFileSync(datei, 'utf8').split('\n');
  liste.sort((a, b) => b.zeile - a.zeile || b.spalte - a.spalte);

  for (const f of liste) {
    const z = zeilen[f.zeile - 1];
    if (z === undefined) continue;
    const start = f.spalte - 1;
    if (z.slice(start, start + f.name.length) !== f.name) {
      console.log(`  ${datei}:${f.zeile}  ${f.name} — Stelle passt nicht, übersprungen`);
      continue;
    }
    const ende = start + f.name.length;
    const typ = f.feld ? 'any[]' : 'any';
    zeilen[f.zeile - 1] = z.slice(0, ende) + ': ' + typ + z.slice(ende);
    gesetzt++;
    if (!schreiben) console.log(`  ${datei}:${f.zeile}  ${f.name}: ${typ}`);
  }
  if (schreiben) writeFileSync(datei, zeilen.join('\n'));
}

console.log(`${gesetzt} Deklarationen ${schreiben ? 'gesetzt' : 'gefunden'}` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
