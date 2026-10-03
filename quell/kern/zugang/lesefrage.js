"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/zugang/lesefrage.ts (npm run bauen:ts). */
const Lesefrage = (() => {
    const aktiv = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const erlaubt = (aktion, pageId) => {
        if (!aktiv())
            return true;
        if (pageId === undefined)
            return Konten.darf(aktion);
        return !!pageId && Konten.darf(aktion, pageId);
    };
    return { aktiv, erlaubt };
})();
window.Lesefrage = Lesefrage;
