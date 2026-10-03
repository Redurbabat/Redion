"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/start.ts (npm run bauen:ts). */
window.addEventListener('DOMContentLoaded', () => {
    if (window.__nurBote)
        return;
    if (typeof Ereignisse !== 'undefined')
        Ereignisse.melde(ARTEN.appStartet);
    App.start();
    RedionMotion.start();
    RedionPress.start();
    if (typeof Ereignisse !== 'undefined')
        Ereignisse.melde(ARTEN.appSteht);
});
