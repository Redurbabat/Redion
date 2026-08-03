/* ============================================================================
 * schale/ueberlagerung/ui.js — der eine Name, den alle kennen
 * ----------------------------------------------------------------------------
 * `UI.toast`, `UI.menu`, `UI.frage` stehen an ein paar hundert Stellen. Diese
 * Aufrufe alle umzuschreiben wäre viel Arbeit für null Gewinn und ein hohes
 * Risiko — jede übersehene Stelle ist ein Fehler, den erst ein Mensch findet.
 *
 * Deshalb bleibt `UI` der Name, den man ruft, und ist nur noch eine
 * Weiterreichung an die drei Teile, die jetzt getrennt sind. Wer etwas Neues
 * baut, ruft `Menue`, `Hinweis` oder `Dialog` direkt.
 * ==========================================================================*/

const UI = {
  menu:         (...a) => Menue.menu(...a),
  menuMitSuche: (...a) => Menue.menuMitSuche(...a),
  amTelefon:    (...a) => Menue.amTelefon(...a),
  toast:        (...a) => Hinweis.toast(...a),
  banner:       (...a) => Hinweis.banner(...a),
  frage:        (...a) => Dialog.frage(...a),
  emojiWaehlen: (anker, beiWahl) => Erwaehnung.emojiWaehler(anker, beiWahl)
};

window.UI = UI;
