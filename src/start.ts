/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/start.ts (npm run bauen:ts). */
/* ============================================================================
 * start.js — der einzige Einstiegspunkt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/start.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/start.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Vorher startete sich die Schale selbst, ganz unten in einer 2800 Zeilen
 * langen Datei. Das ist bequem und genau einmal falsch: sobald es zwei
 * Dateien gibt, die sich selbst starten, hängt die Reihenfolge vom Zufall ab.
 *
 * Deshalb steht hier alles, was von selbst losläuft — und sonst nirgends.
 * Wer wissen will, was beim Öffnen geschieht, liest diese Datei und keine
 * andere.
 *
 * Die Reihenfolge ist keine Geschmacksfrage:
 *
 *   1. kern      — Speicher und Ereignisse. Ohne sie geht nichts.
 *   2. register  — die Kataloge. Sie beschreiben nur, sie tun nichts.
 *   3. Schale    — Layout, Seitenleiste, Routing.
 *   4. apps      — melden sich beim Register an und warten auf ihren Auftritt.
 * ==========================================================================*/

window.addEventListener('DOMContentLoaded', () => {
  /* Der Bote (die Brücke für fremde Fenster) will nur die Datenschicht. */
  if ((window as any).__nurBote) return;

  if (typeof Ereignisse !== 'undefined') Ereignisse.melde(ARTEN.appStartet);

  void Promise.resolve(App.start()).then(() => RedionAutomation.start());
  RedionMotion.start();
  /* die Druckfeder (E702): ein Zuhörer für jeden Knopf */
  RedionPress.start();
  /* der Löschen-Knopf, der zerfliesst (E709): ein Zuhörer für jeden */
  RedionDelete.start();

  if (typeof Ereignisse !== 'undefined') Ereignisse.melde(ARTEN.appSteht);
});
