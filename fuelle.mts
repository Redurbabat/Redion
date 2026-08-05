/* ============================================================================
 * fuelle.mts — `X.querySelector('#a').innerHTML = …` in einen Helfer fassen
 * ----------------------------------------------------------------------------
 * Die Oberfläche wird aus Zeichenketten gebaut und dann in Kästen gehängt.
 * Dabei steht überall dieselbe Zeile:
 *
 *     o.querySelector('#liste').innerHTML = '<div>…</div>' + …;
 *
 * `querySelector` kann `null` liefern. Ein `!` davorzusetzen wäre eine
 * Behauptung, keine Prüfung — und genau die Sorte Zeile, die später wirft.
 * Stattdessen kommt der Vorgang in einen Helfer:
 *
 *     fuelle(o, '#liste', '<div>…</div>' + …);
 *
 * `fuelle` prüft einmal und tut nichts, wenn der Kasten fehlt. Das ist auch
 * inhaltlich richtig: ist der Kasten nicht da, gibt es nichts zu füllen.
 *
 * Der Ausdruck rechts geht über mehrere Zeilen. Deshalb wird ab der
 * Fundstelle gelesen, bis die Klammern wieder ausgeglichen sind und ein
 * Strichpunkt am Zeilenende steht.
 *
 * Aufruf:  node fuelle.mts <datei> [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';

const datei = process.argv[2];
const schreiben = process.argv.includes('--schreiben');
if (!datei) { console.log('Aufruf: node fuelle.mts <datei> [--schreiben]'); process.exit(1); }

const zeilen = readFileSync(datei, 'utf8').split('\n');
const anfang = /^(\s*)([\w.]+)\.querySelector(?:<[^>]+>)?\('([^']+)'\)!?\.innerHTML = (.*)$/;

let n = 0;
for (let i = 0; i < zeilen.length; i++) {
  const z = zeilen[i];
  if (z === undefined) continue;
  const m = z.match(anfang);
  if (!m) continue;
  const [, raum, wo, sel, rest] = m;
  if (raum === undefined || wo === undefined || sel === undefined || rest === undefined) continue;

  /* Das Ende des Ausdrucks suchen: Klammern ausgeglichen und `;` am Schluss. */
  let tiefe = 0;
  const zaehle = (t: string): void => {
    for (const c of t) {
      if (c === '(' || c === '[' || c === '{') tiefe++;
      if (c === ')' || c === ']' || c === '}') tiefe--;
    }
  };
  zaehle(rest);
  let ende = i;
  while (ende < zeilen.length) {
    const t = zeilen[ende] ?? '';
    if (tiefe <= 0 && t.trimEnd().endsWith(';')) break;
    ende++;
    if (ende < zeilen.length) zaehle(zeilen[ende] ?? '');
  }
  if (ende >= zeilen.length) continue;

  /* Umschreiben: erste Zeile bekommt den Aufruf, letzte die schliessende
     Klammer. Der Strichpunkt wandert mit. */
  zeilen[i] = `${raum}fuelle(${wo}, '${sel}', ${rest}`;
  const letzte = zeilen[ende] ?? '';
  zeilen[ende] = letzte.replace(/;(\s*)$/, ');$1');
  n++;
  i = ende;
}

if (schreiben) writeFileSync(datei, zeilen.join('\n'));
console.log(`${n} Stellen ${schreiben ? 'umgeschrieben' : 'gefunden'}` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
