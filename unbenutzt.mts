/* ============================================================================
 * unbenutzt.mts — was `noUnusedParameters` meldet, mit `_` kennzeichnen
 * ----------------------------------------------------------------------------
 * `tsconfig.json` verbietet unbenutzte Parameter. Beim Umzug fällt so etwas
 * auf: eine Funktion nimmt `(anker, coll, view, block)` entgegen und benutzt
 * `view` nie. Das ist kein Fehler — die Aufrufer reichen alle vier durch, und
 * die Reihenfolge steht fest —, aber es ist eine Nachricht: hier wird etwas
 * mitgeschleppt.
 *
 * TypeScript kennt dafür eine Schreibweise: ein `_` vor dem Namen heisst
 * „absichtlich unbenutzt". Genau das setzt dieses Werkzeug — es löscht nichts
 * und ändert keine Reihenfolge.
 *
 * Für Namen aus einer Zerlegung (`const { a, b } = X`) taugt das nicht: dort
 * müsste `b: _b` stehen, und ein weggelassener Name ist die bessere Antwort.
 * Solche Fälle werden gemeldet, nicht angefasst.
 *
 * Aufruf:  node unbenutzt.mts [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';
import { meldungen, konfigAus } from './tsmeldungen.mts';

type Fund = { datei: string; zeile: number; spalte: number; name: string };

const roh = meldungen(konfigAus(process.argv));

const funde: Fund[] = [];
for (const z of roh.split('\n')) {
  const m = z.match(/^(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read/);
  if (m && m[1] && m[2] && m[3] && m[4])
    funde.push({ datei: m[1], zeile: +m[2], spalte: +m[3], name: m[4] });
}

if (!funde.length) { console.log('Nichts offen — kein TS6133.'); process.exit(0); }

const schreiben = process.argv.includes('--schreiben');
const proDatei = new Map<string, Fund[]>();
for (const f of funde) {
  const liste = proDatei.get(f.datei) ?? [];
  liste.push(f);
  proDatei.set(f.datei, liste);
}

let gesetzt = 0, gemeldet = 0;
for (const [datei, liste] of proDatei) {
  const zeilen = readFileSync(datei, 'utf8').split('\n');
  liste.sort((a, b) => b.zeile - a.zeile || b.spalte - a.spalte);

  for (const f of liste) {
    const z = zeilen[f.zeile - 1];
    if (z === undefined) continue;
    const start = f.spalte - 1;
    if (z.slice(start, start + f.name.length) !== f.name) continue;

    /* Eine Zeile, die nur aus dem Namen und einem Komma besteht, gehört zu
       einer Zerlegung — die bleibt unberührt. */
    if (/^\s*[\w$]+,?\s*$/.test(z)) {
      console.log(`  ${datei}:${f.zeile}  ${f.name} — aus einer Zerlegung, von Hand entfernen`);
      gemeldet++;
      continue;
    }
    zeilen[f.zeile - 1] = z.slice(0, start) + '_' + z.slice(start);
    gesetzt++;
  }
  if (schreiben) writeFileSync(datei, zeilen.join('\n'));
}

console.log(`${gesetzt} Parameter mit \`_\` gekennzeichnet, ${gemeldet} zur Hand` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
