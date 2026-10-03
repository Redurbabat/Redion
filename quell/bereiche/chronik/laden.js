"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/chronik/laden.ts (npm run bauen:ts). */
const ChronikLaden = (() => {
    let versprechen = null;
    const da = () => window.ChronikDaten !== undefined;
    const laden = () => {
        if (da())
            return Promise.resolve();
        if (versprechen)
            return versprechen;
        versprechen = new Promise((ja, nein) => {
            if (typeof document === 'undefined') {
                nein(new Error('Die Chronik lässt sich hier nicht nachladen.'));
                return;
            }
            const s = document.createElement('script');
            s.src = 'quell/bereiche/chronik/daten.js';
            s.addEventListener('load', () => {
                if (!da())
                    nein(new Error('quell/bereiche/chronik/daten.js wurde geladen, ist aber leer.'));
                else
                    ja();
            });
            s.addEventListener('error', () => nein(new Error('Die Chronik fehlt — quell/bereiche/chronik/daten.js liess sich nicht laden.')));
            document.head.appendChild(s);
        });
        versprechen.catch(() => { versprechen = null; });
        return versprechen;
    };
    return { laden, da };
})();
window.ChronikLaden = ChronikLaden;
