/* ============================================================================
 * domtypen.mts — `querySelector` typisieren und das Ergebnis prüfen
 * ----------------------------------------------------------------------------
 * Die immer gleiche Zeile in einer Oberfläche, die aus Zeichenketten gebaut
 * wird:
 *
 *     o.querySelector('#feld').value
 *     wrap.querySelector('.kasten').style.display = 'none'
 *
 * `querySelector` gibt `Element | null` zurück. Ein `Element` hat weder
 * `value` noch `style`, und `null` hat gar nichts. Beides meldet TypeScript
 * — zu Recht: fehlt das Element, warf die Zeile schon immer.
 *
 * WAS HIER GESCHIEHT
 *   Aus `X.querySelector('#a').value` wird
 *   `X.querySelector<HTMLInputElement>('#a')?.value` — LESEND. Das ist die
 *   ehrliche Übersetzung: steht das Feld nicht da, kommt `undefined` heraus
 *   statt eines Absturzes.
 *
 *   SCHREIBENDE Stellen (`… .value = x`) fasst dieses Werkzeug NICHT an. Ein
 *   `?.` links vom Gleichheitszeichen ist kein gültiges JavaScript, und die
 *   Frage, was geschehen soll, wenn das Feld fehlt, gehört an die Stelle
 *   selbst — nicht in eine Regel.
 *
 * Die Elementart wird am Selektor und am Feld abgelesen: `.value` und
 * `.checked` heisst Eingabefeld, `.style` und `.textContent` heisst
 * `HTMLElement`. Wo beides nicht passt, bleibt die Zeile stehen.
 *
 * Aufruf:  node domtypen.mts <datei> [--schreiben]
 * ==========================================================================*/

import { readFileSync, writeFileSync } from 'node:fs';

const datei = process.argv[2];
const schreiben = process.argv.includes('--schreiben');
if (!datei) { console.log('Aufruf: node domtypen.mts <datei> [--schreiben]'); process.exit(1); }

let s = readFileSync(datei, 'utf8');
let n = 0;

/* Lesend: `.value`, `.checked`, `.selectedOptions`, `.files` → Eingabefeld. */
s = s.replace(
  /(\w+)\.querySelector\('([^']+)'\)\.(value|checked|selectedOptions|files)\b(?!\s*=[^=])/g,
  (_m, wo, sel, feld) => { n++; return `${wo}.querySelector<HTMLInputElement>('${sel}')?.${feld}`; });

/* Lesend: `.style`, `.textContent`, `.innerHTML`, `.dataset`, `.focus()` → HTMLElement. */
s = s.replace(
  /(\w+)\.querySelector\('([^']+)'\)\.(style|dataset)\.(\w+)\b(?!\s*=[^=])/g,
  (_m, wo, sel, feld, unter) => { n++; return `${wo}.querySelector<HTMLElement>('${sel}')?.${feld}.${unter}`; });

s = s.replace(
  /(\w+)\.querySelector\('([^']+)'\)\.(textContent|innerHTML)\b(?!\s*=[^=])/g,
  (_m, wo, sel, feld) => { n++; return `${wo}.querySelector<HTMLElement>('${sel}')?.${feld}`; });

s = s.replace(
  /(\w+)\.querySelector\('([^']+)'\)\.(focus|blur|click|remove)\(\)/g,
  (_m, wo, sel, feld) => { n++; return `${wo}.querySelector<HTMLElement>('${sel}')?.${feld}()`; });

/* `querySelectorAll(…).forEach(x => x.style…)` — die Liste selbst ist nie
   null, nur ihre Elemente sind untypisiert. */
s = s.replace(/(\w+)\.querySelectorAll\('([^']+)'\)\.forEach\(/g,
  (_m, wo, sel) => { n++; return `${wo}.querySelectorAll<HTMLElement>('${sel}').forEach(`; });

if (schreiben) writeFileSync(datei, s);
console.log(`${n} Stellen ${schreiben ? 'umgeschrieben' : 'gefunden'}` +
            (schreiben ? '' : ' — mit --schreiben eintragen'));
