"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/geste.ts (npm run bauen:ts). */
const Geste = (() => {
    let hand = null;
    const bauen = () => {
        const h = document.createElement('div');
        h.className = 'ru-geste';
        h.setAttribute('aria-hidden', 'true');
        const el = (klasse) => {
            const i = document.createElement('i');
            i.className = klasse;
            h.append(i);
        };
        el('ru-geste-flaeche');
        el('ru-geste-daumen');
        for (let n = 1; n <= 4; n++)
            el('ru-geste-finger ru-geste-finger-' + n);
        return h;
    };
    const zeigen = (ziel) => {
        const r = ziel.getBoundingClientRect();
        if (!r.width) {
            weg();
            return;
        }
        if (!hand) {
            hand = bauen();
            document.body.append(hand);
        }
        const spitzeX = r.left + r.width * 0.62;
        const spitzeY = r.top + r.height * 0.6;
        const links = Math.max(0, Math.min(innerWidth - 66, spitzeX + 24));
        const oben = Math.max(0, Math.min(innerHeight - 65, spitzeY - 18));
        hand.style.left = links + 'px';
        hand.style.top = oben + 'px';
    };
    const weg = () => { hand?.remove(); hand = null; };
    return { zeigen, weg, sichtbar: () => !!hand?.isConnected };
})();
window.Geste = Geste;
