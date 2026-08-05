/* ============================================================================
 * benannte.mts — Typen für benannte Parameter setzen
 * ----------------------------------------------------------------------------
 * `typenhilfe.mts` setzt nur Rückruf-Parameter (`.map(x => …)`). Übrig bleiben
 * die benannten: `const machWas = (text, tiefe) => …`. Die sind die
 * interessanteren — sie beschreiben, was ein Modul von aussen annimmt.
 *
 * WAS DIESES WERKZEUG TUT UND WAS NICHT
 *   Es liest die TS7006-Meldungen von `tsc`, sucht den Parameter in der Zeile
 *   und schreibt einen Typ dahinter. Der Typ kommt aus einer kurzen Liste
 *   bekannter Namen — `text` ist eine Zeichenkette, `tiefe` eine Zahl. Alles,
 *   was nicht in der Liste steht, bekommt `any`.
 *
 *   `any` ist hier kein Aufgeben, sondern ein ehrliches „weiss ich noch
 *   nicht". Ein falsch geratener Typ wäre schlimmer: er sähe genau, ist es
 *   aber nicht, und der nächste Leser glaubt ihm. Was wirklich zählt — die
 *   öffentlichen Funktionen eines Moduls — wird danach von Hand nachgezogen.
 *
 * WARUM RÜCKWÄRTS GESCHRIEBEN WIRD
 *   Mehrere Parameter derselben Zeile verschieben einander die Spalten. Wer
 *   von hinten nach vorn schreibt, muss nichts nachrechnen.
 *
 * Aufruf:  node benannte.mts            (nur zeigen)
 *          node benannte.mts --schreiben
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';
import { meldungen, konfigAus } from './tsmeldungen.mts';

/* Namen, bei denen der Typ ohne Raten feststeht. Kurz halten: jeder Eintrag
   mehr ist eine Gelegenheit, danebenzuliegen.

   `k` stand hier einmal als Zahl — es ist ja meist ein Schleifenindex. In
   `befehle.ts` heisst `k` aber der ganze Anfrage-Umschlag, und aus
   `const loadPageChunk = (k) =>` wurde `(k: number)`. Der Fehler war
   harmlos, weil `tsc` ihn sofort meldete, aber er zeigt die Regel: ein Name
   gehört nur in diese Liste, wenn er in JEDER Datei dasselbe bedeutet. */
const BEKANNT: Record<string, string> = {
  /* `s` und `t` stehen hier bewusst NICHT: mal ist es eine Zeichenkette
     (`esc(s)`), mal eine Form auf der Zeichenfläche, mal ein Zeitpunkt.
     In zeichenflaeche.ts wurde aus `const formZeichnen = (s) =>` prompt
     `(s: string)` — und die Form hatte plötzlich kein `art` mehr. */
  text: 'string', name: 'string', titel: 'string',
  html: 'string', schluessel: 'string', frage: 'string', grund: 'string',
  id: 'string', seiteId: 'string', blockId: 'string', collId: 'string',
  table: 'string', tabelle: 'string', art: 'string', typ: 'string',
  /* `pfad` ist raus — der dritte Fall derselben Sorte. In `src/` ist es der
     Weg durch den Blockbaum und damit `string[]`; in `server/` ist es der
     Weg in der Adresse und damit eine Zeichenkette. Beim Umzug von server/
     schrieb dieses Werkzeug `(pfad: string[])` in sechs Stellen, und tsc
     meldete prompt `Property 'toLowerCase' does not exist on type
     'string[]'` — der Beweis, dass die Regel oben stimmt. */
  /* `n` ist raus — der vierte Fall. In `src/` ist es fast immer eine Anzahl
     oder ein Zähler; in den Prüfläufen heisst der erste Wert von
     `const p = (n, b) => …` der NAME der Prüfung, also eine Zeichenkette.
     Das Werkzeug schrieb `(n: number)` in vierzig Dateien, und aus 35
     Meldungen wurden 1248. Genau dafür steht die Regel oben da. */
  i: 'number', j: 'number', ms: 'number',
  sek: 'number', dauer: 'number', tiefe: 'number', laenge: 'number',
  zahl: 'number', breite: 'number', hoehe: 'number', index: 'number'
};

type Fund = { datei: string; zeile: number; spalte: number; name: string };

const roh = meldungen(konfigAus(process.argv));

const funde: Fund[] = [];
for (const z of roh.split('\n')) {
  const m = z.match(/^(.+?)\((\d+),(\d+)\): error TS7006: Parameter '(.+?)' implicitly/);
  if (m && m[1] && m[2] && m[3] && m[4])
    funde.push({ datei: m[1], zeile: +m[2], spalte: +m[3], name: m[4] });
}

if (!funde.length) { console.log('Nichts offen — kein TS7006.'); process.exit(0); }

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
  /* Hinten anfangen: sonst stimmen die Spalten der linken Funde nicht mehr. */
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
    const typ = BEKANNT[f.name] ?? 'any';
    const dahinter = z.slice(ende).trimStart();

    /* Ein einzelner nackter Parameter (`x => …`) kann keine Anmerkung tragen —
       er braucht erst Klammern. Genau daran ist die frühere Fassung dieses
       Werkzeugs in 27 Dateien zerbrochen. */
    if (dahinter.startsWith('=>'))
      zeilen[f.zeile - 1] = z.slice(0, start) + '(' + f.name + ': ' + typ + ')' + z.slice(ende);
    else
      zeilen[f.zeile - 1] = z.slice(0, ende) + ': ' + typ + z.slice(ende);

    gesetzt++;
    if (!schreiben) console.log(`  ${datei}:${f.zeile}  ${f.name}: ${typ}`);
  }
  if (schreiben) writeFileSync(datei, zeilen.join('\n'));
}

console.log(`${gesetzt} benannte Parameter ${schreiben ? 'gesetzt' : 'gefunden'}` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
