/* ============================================================================
 * fangfehler.mts — `catch (e) { … e.message … }` ehrlich machen
 * ----------------------------------------------------------------------------
 * `useUnknownInCatchVariables` steht in `tsconfig.json` an, und das ist
 * richtig: was geworfen wird, muss kein `Error` sein. `throw 'kaputt'` ist
 * gültiges JavaScript, und dann ist `e.message` undefiniert — die Meldung,
 * die jemand lesen sollte, steht dann nirgends.
 *
 * WAS HIER GESCHIEHT
 *   Aus `catch (e) { … e.message … }` wird
 *   `catch (e: unknown) { … (e instanceof Error ? e.message : String(e)) … }`.
 *
 *   Das ist eine Prüfung und keine Behauptung: `catch (e: any)` wäre die
 *   kürzere Zeile und würde genau die Frage wegdrücken, um die es geht.
 *
 * WARUM NICHT MIT EINEM REGULÄREN AUSDRUCK. Der Rumpf eines `catch` enthält
 * geschweifte Klammern — `return { ok: false, fehler: e.message }` ist der
 * häufigste Fall überhaupt. Ein Ausdruck, der auf ausgeglichene Klammern
 * besteht, findet ihn nicht; einer, der es nicht tut, greift zu weit. Also
 * wird der Rumpf gezählt: Klammer auf, Klammer zu, und dazwischen gesucht.
 * Zeichenketten und Kommentare bleiben dabei aussen vor.
 *
 * Aufruf:  node fangfehler.mts <datei|ordner> [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ziel = process.argv[2];
const schreiben = process.argv.includes('--schreiben');
if (!ziel) { console.log('Aufruf: node fangfehler.mts <datei|ordner> [--schreiben]'); process.exit(1); }

/* Alle Dateien einsammeln, die in Frage kommen. */
const dateien: string[] = [];
const sammle = (pfad: string): void => {
  if (statSync(pfad).isDirectory()) {
    for (const e of readdirSync(pfad)) sammle(join(pfad, e));
  } else if (/\.(ts|mts|cts)$/.test(pfad) && !pfad.endsWith('.d.ts')) {
    dateien.push(pfad);
  }
};
sammle(ziel);

/* Das Ende des `catch`-Rumpfes finden. `von` zeigt auf die öffnende Klammer.
   Zeichenketten und Kommentare zählen nicht mit — in ihnen steht manchmal
   eine Klammer, die nichts öffnet. */
const rumpfEnde = (s: string, von: number): number => {
  let tiefe = 0;
  for (let i = von; i < s.length; i++) {
    const c = s[i], naechst = s[i + 1];
    if (c === '/' && naechst === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && naechst === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i++; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{') tiefe++;
    else if (c === '}') { tiefe--; if (tiefe === 0) return i; }
  }
  return -1;
};

let gesamt = 0, dateienGeaendert = 0;
for (const datei of dateien) {
  let s = readFileSync(datei, 'utf8');
  let n = 0;
  let suchAb = 0;

  for (;;) {
    const m = /catch \((\w+)\) \{/.exec(s.slice(suchAb));
    if (!m || m.index === undefined || !m[1]) break;
    const start = suchAb + m.index;
    const name = m[1];
    const klammerAuf = start + m[0].length - 1;
    const ende = rumpfEnde(s, klammerAuf);
    if (ende < 0) { suchAb = klammerAuf + 1; continue; }

    const rumpf = s.slice(klammerAuf, ende + 1);
    const zugriff = new RegExp(`\\b${name}\\.message\\b`, 'g');
    if (!zugriff.test(rumpf)) { suchAb = klammerAuf + 1; continue; }

    const neuerRumpf = rumpf.replace(
      new RegExp(`\\b${name}\\.message\\b`, 'g'),
      `(${name} instanceof Error ? ${name}.message : String(${name}))`);
    s = s.slice(0, start) + `catch (${name}: unknown) ` + neuerRumpf + s.slice(ende + 1);
    n++;
    suchAb = start + `catch (${name}: unknown) `.length + neuerRumpf.length;
  }

  if (n) {
    gesamt += n; dateienGeaendert++;
    if (schreiben) writeFileSync(datei, s);
    console.log(`  ${datei}: ${n}`);
  }
}

console.log(`${gesamt} Fangstellen in ${dateienGeaendert} Dateien ` +
            (schreiben ? 'umgeschrieben' : 'gefunden — mit --schreiben eintragen'));
