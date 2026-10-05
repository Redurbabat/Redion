"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/ui.ts (npm run bauen:ts). */
const UI = {
    menu: (...a) => Menue.menu(...a),
    menuMitSuche: (...a) => Menue.menuMitSuche(...a),
    amTelefon: () => Menue.amTelefon(),
    toast: (...a) => Hinweis.toast(...a),
    banner: (...a) => Hinweis.banner(...a),
    leer: (...a) => Hinweis.leer(...a),
    frage: (...a) => Dialog.frage(...a),
    emojiWaehlen: (...a) => Erwaehnung.emojiWaehler(...a)
};
window.UI = UI;
