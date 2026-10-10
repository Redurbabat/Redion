/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/ui.ts (npm run bauen:ts). */
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
  menu:         (...a: Parameters<typeof Menue.menu>) => Menue.menu(...a),
  menuMitSuche: (...a: Parameters<typeof Menue.menuMitSuche>) => Menue.menuMitSuche(...a),
  amTelefon:    () => Menue.amTelefon(),
  /* Die eine Auswahlliste und das Menü eines Dings (E721). */
  wahl:         (...a: Parameters<typeof Menue.wahl>) => Menue.wahl(...a),
  aktionen:     (...a: Parameters<typeof Menue.aktionen>) => Menue.aktionen(...a),
  toast:        (...a: Parameters<typeof Hinweis.toast>) => Hinweis.toast(...a),
  banner:       (...a: Parameters<typeof Hinweis.banner>) => Hinweis.banner(...a),
  leer:         (...a: Parameters<typeof Hinweis.leer>) => Hinweis.leer(...a),
  frage:        (...a: Parameters<typeof Dialog.frage>) => Dialog.frage(...a),
  emojiWaehlen: (...a: Parameters<typeof Erwaehnung.emojiWaehler>) =>
                  Erwaehnung.emojiWaehler(...a)
};

(window as any).UI = UI;
