/* ============================================================================
 * rueckgabe.mts — Rückgabetypen für sich gegenseitig aufrufende Funktionen
 * ----------------------------------------------------------------------------
 * Ein Parser nach absteigendem Vorrang besteht aus einem Dutzend Funktionen,
 * die einander im Kreis aufrufen: `strichrechnung` ruft `punktrechnung` ruft
 * `potenz` ruft `unaer` ruft `atom` — und `atom` ruft für die Klammer wieder
 * ganz oben an. TypeScript kann den Rückgabetyp dann nicht ausrechnen (TS7023)
 * und will ihn geschrieben sehen.
 *
 * Hier ist das `any`, und zwar zu Recht: die Knoten des Baums sind einfache
 * Objekte verschiedener Form, und sie alle aufzuschreiben, ohne den Parser
 * selbst anzufassen, hiesse dieselbe Struktur zweimal zu pflegen. Der Wert
 * dieser Datei liegt nicht in der Typisierung des Baums.
 *
 * Aufruf:  node rueckgabe.mts [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';
import { meldungen, konfigAus } from './tsmeldungen.mts';

type Fund = { datei: string; zeile: number; spalte: number; name: string };

const roh = meldungen(konfigAus(process.argv));

const funde: Fund[] = [];
for (const z of roh.split('\n')) {
  const m = z.match(/^(.+?)\((\d+),(\d+)\): error TS7023: '(.+?)' implicitly has return type/);
  if (m && m[1] && m[2] && m[3] && m[4])
    funde.push({ datei: m[1], zeile: +m[2], spalte: +m[3], name: m[4] });
}

if (!funde.length) { console.log('Nichts offen — kein TS7023.'); process.exit(0); }

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
  liste.sort((a, b) => b.zeile - a.zeile);

  for (const f of liste) {
    const z = zeilen[f.zeile - 1];
    if (z === undefined) continue;
    /* `const name = (…) => {`  →  `const name = (…): any => {` */
    const neu = z.replace(/^(\s*(?:const|let)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\))\s*=>/,
                          '$1: any =>');
    if (neu === z) {
      console.log(`  ${datei}:${f.zeile}  ${f.name} — Form unbekannt, übersprungen`);
      continue;
    }
    zeilen[f.zeile - 1] = neu;
    gesetzt++;
    if (!schreiben) console.log(`  ${datei}:${f.zeile}  ${f.name}(): any`);
  }
  if (schreiben) writeFileSync(datei, zeilen.join('\n'));
}

console.log(`${gesetzt} Rückgabetypen ${schreiben ? 'gesetzt' : 'gefunden'}` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
