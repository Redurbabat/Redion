"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/ruhig.ts (npm run bauen:ts). */
const Ruhig = (() => {
    const an = () => Store.getMeta('ruhig', true) !== false;
    let offen = false;
    const anwenden = () => {
        const b = document.body;
        if (!b)
            return;
        b.dataset['ruhig'] = an() ? (offen ? 'offen' : 'an') : 'aus';
        const knopf = document.getElementById('btn-mehr');
        if (knopf) {
            knopf.setAttribute('aria-expanded', String(an() && offen));
            const text = knopf.querySelector('.sl-mehr-text');
            if (text)
                text.textContent = (an() && offen) ? 'Weniger' : 'Mehr';
        }
    };
    const schalten = () => {
        if (!an())
            return;
        offen = !offen;
        anwenden();
    };
    const setzen = (wert) => {
        const neu = wert === undefined ? !an() : wert;
        Store.setMeta('ruhig', neu);
        if (!neu)
            offen = false;
        anwenden();
        if (typeof Kontextkante !== 'undefined')
            Kontextkante.zeichne();
        return neu;
    };
    const binde = () => {
        const knopf = document.getElementById('btn-mehr');
        if (knopf && !knopf.dataset['gebunden']) {
            knopf.dataset['gebunden'] = 'ja';
            knopf.addEventListener('click', schalten);
        }
        anwenden();
    };
    return { an, offen: () => offen, anwenden, schalten, setzen, binde };
})();
window.Ruhig = Ruhig;
