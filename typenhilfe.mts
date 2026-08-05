/* ============================================================================
 * typenhilfe.mts — die Rückrufe annotieren, die TypeScript selbst nicht kennt
 * ----------------------------------------------------------------------------
 *     node typenhilfe.mts                 was es täte, ohne es zu tun
 *     node typenhilfe.mts --schreiben     und jetzt wirklich
 *
 * ─── WORUM ES GEHT, UND WORUM NICHT ─────────────────────────────────────────
 *
 * `TS7006: Parameter 'x' implicitly has an 'any' type` bedeutet etwas sehr
 * Genaues: **TypeScript hatte an dieser Stelle keinen Typ anzubieten.** Wo ein
 * Rückruf einen Zusammenhang hat — `[1,2,3].map(n => …)` —, wird `n` von
 * selbst zur Zahl und die Meldung kommt gar nicht erst.
 *
 * Sie kommt genau dort, wo der Empfänger `any` ist. Und der ist es, weil er
 * aus `quell/` stammt: `Store.cache.blocks`, `Werkzeuge.erinnerungen()`,
 * `Kommentare.alle(id)`. Über deren Inhalt ist wirklich nichts bekannt.
 *
 * An solchen Stellen `: any` hinzuschreiben verliert **nichts**. Es schreibt
 * hin, was ohnehin gilt — und genau das verlangt `noImplicitAny`.
 *
 * ─── DIE GRENZE, DIE DIESES WERKZEUG NICHT ÜBERSCHREITET ────────────────────
 *
 * Es fasst **nur Rückrufe** an: was in `.map(`, `.forEach(`, `.filter(`,
 * `.sort(`, `addEventListener(` und Verwandten steht.
 *
 * Ein benannter Parameter — `const oeffne = (id) => …` — bleibt liegen. Dort
 * IST etwas bekannt, nämlich was der Aufrufer schickt, und `any` wäre der
 * Verzicht auf genau das, wofür der Umzug stattfindet (CLAUDE.md §52,
 * doku/MIGRATION-REZEPT.md Schritt 5). Diese Stellen bleiben Handarbeit.
 *
 * Das Werkzeug meldet am Ende, wie viele es liegengelassen hat. Diese Zahl
 * ist die Arbeit, die noch zu tun ist — sie zu verschweigen wäre dasselbe wie
 * sie mit `any` zuzukleistern.
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';
import { meldungen, konfigAus } from './tsmeldungen.mts';

/** Zeilenteile, an denen ein Rückruf erkennbar ist. */
const RUECKRUF = [
  '.map(', '.forEach(', '.filter(', '.some(', '.every(', '.find(',
  '.findIndex(', '.findLast(', '.sort(', '.flatMap(', '.reduce(',
  'addEventListener(', '.then(', '.catch(', '.finally('
];

type Fund = { datei: string; zeile: number; spalte: number; name: string };


const ZEILE = /^(.+?)\((\d+),(\d+)\): error TS7006: Parameter '([^']+)'/;

const funde: Fund[] = [];
for (const z of meldungen(konfigAus(process.argv)).split('\n')) {
  const m = ZEILE.exec(z.trim());
  if (m && m[1] && m[2] && m[3] && m[4])
    funde.push({ datei: m[1], zeile: Number(m[2]), spalte: Number(m[3]), name: m[4] });
}

const schreiben = process.argv.includes('--schreiben');

/* Nach Datei sortieren, und darin von hinten nach vorn: wer von vorn
   einfügt, verschiebt alle Spalten dahinter und trifft die nächste nicht. */
const nachDatei = new Map<string, Fund[]>();
for (const f of funde) {
  const liste = nachDatei.get(f.datei) ?? [];
  liste.push(f);
  nachDatei.set(f.datei, liste);
}

let gesetzt = 0, gelassen = 0;
const offen: string[] = [];

for (const [datei, liste] of nachDatei) {
  const zeilen = readFileSync(datei, 'utf8').split('\n');
  liste.sort((a, b) => b.zeile - a.zeile || b.spalte - a.spalte);

  for (const f of liste) {
    const z = zeilen[f.zeile - 1];
    if (z === undefined) continue;

    if (!RUECKRUF.some(r => z.includes(r))) {
      gelassen++;
      offen.push(`${datei}:${f.zeile}  ${f.name}  — benannter Parameter, von Hand`);
      continue;
    }

    /* Die Meldung zeigt auf das erste Zeichen des Namens. */
    const start = f.spalte - 1;
    if (z.slice(start, start + f.name.length) !== f.name) {
      gelassen++;
      offen.push(`${datei}:${f.zeile}  ${f.name}  — Stelle passt nicht, von Hand`);
      continue;
    }
    const ende = start + f.name.length;
    const dahinter = z.slice(ende).trimStart();
    /* Schon annotiert? Dann nichts tun. */
    if (dahinter.startsWith(':')) continue;

    /* ----------------------------------------------------------------------
     * DER EINE FALL, DER MICH BEIM ERSTEN LAUF SIEBENUNDZWANZIGMAL ERWISCHT
     * HAT: `filter(r => …)`. Ein einzelner Parameter ohne Klammern nimmt
     * keine Angabe an — `filter(r: any => …)` ist kein TypeScript, sondern
     * ein Syntaxfehler, und zwar einer, der die ganze Datei unlesbar macht.
     *
     * Erkennbar ist der Fall daran, dass gleich hinter dem Namen `=>` kommt.
     * Steht dort `,` oder `)`, gibt es schon eine Klammerliste.
     * -------------------------------------------------------------------- */
    if (dahinter.startsWith('=>'))
      zeilen[f.zeile - 1] = z.slice(0, start) + '(' + f.name + ': any)' + z.slice(ende);
    else
      zeilen[f.zeile - 1] = z.slice(0, ende) + ': any' + z.slice(ende);
    gesetzt++;
  }

  if (schreiben) writeFileSync(datei, zeilen.join('\n'), 'utf8');
}

console.log(`Rückrufe annotiert: ${gesetzt}`);
console.log(`Von Hand zu tun:    ${gelassen}`);
if (offen.length) {
  console.log('');
  for (const z of offen.slice(0, 60)) console.log('  ' + z);
  if (offen.length > 60) console.log(`  … und ${offen.length - 60} weitere`);
}
if (!schreiben) console.log('\n(Nichts geschrieben. Mit --schreiben wirklich ändern.)');
