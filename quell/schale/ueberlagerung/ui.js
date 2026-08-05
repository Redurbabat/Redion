"use strict";
/* ============================================================================
 * schale/ui.ts — der eine Name, den alle kennen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ui.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/ui.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * `UI.toast`, `UI.menu`, `UI.frage` stehen an ein paar hundert Stellen. Diese
 * Aufrufe alle umzuschreiben wäre viel Arbeit für null Gewinn und ein hohes
 * Risiko — jede übersehene Stelle ist ein Fehler, den erst ein Mensch findet.
 *
 * Deshalb bleibt `UI` der Name, den man ruft, und ist nur noch eine
 * Weiterreichung an die drei Teile, die jetzt getrennt sind. Wer etwas Neues
 * baut, ruft `Menue`, `Hinweis` oder `Dialog` direkt.
 * ==========================================================================*/
/* Die Argumente werden durchgereicht, nicht gelesen — aber wie ehrlich das
   aufgeschrieben werden kann, hängt davon ab, was das Ziel schon ist.

   Seit `erwaehnungen/ansicht/menue` umgezogen ist, stehen **alle sieben**
   Weiterreichungen auf `Parameters<typeof …>` statt auf `any[]`: die echte
   Signatur, ohne sie abzuschreiben. Wer `UI.toast(1, 2, 3)` tippt, bekommt
   es gesagt; wer `UI.emojiWaehlen()` ohne Anker ruft, auch.

   Diese Datei war die Anzeige des Umzugsfortschritts an einer Stelle, an der
   man ihn sieht. Sie ist jetzt fertig. */
const UI = {
    menu: (...a) => Menue.menu(...a),
    menuMitSuche: (...a) => Menue.menuMitSuche(...a),
    amTelefon: () => Menue.amTelefon(),
    toast: (...a) => Hinweis.toast(...a),
    banner: (...a) => Hinweis.banner(...a),
    frage: (...a) => Dialog.frage(...a),
    emojiWaehlen: (...a) => Erwaehnung.emojiWaehler(...a)
};
window.UI = UI;
