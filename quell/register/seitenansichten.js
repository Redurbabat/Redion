"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/seitenansichten.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.seitenansichten = (() => {
    const ARTEN = [
        {
            id: 'seite', name: 'Seite',
            titel: 'Seite — schlank wie AFFiNEs `page`: Symbol, Titel, Text. Kein Cover, keine Werkzeugzeile.',
            zeichen: 'page', herkunft: 'affine'
        },
        {
            id: 'flaeche', name: 'Fläche',
            titel: 'Fläche — die Leinwand wie AFFiNEs `edgeless`: Punktraster, der Seitentext als Kasten darauf, schieben und zoomen.',
            zeichen: 'grid', herkunft: 'affine'
        },
        {
            id: 'redion', name: 'Redion',
            titel: 'Redion — unsere eigene: Cover, Symbol, Titel und die Werkzeugzeile. Das, was Redion immer gezeigt hat.',
            zeichen: 'image', herkunft: 'redion'
        }
    ];
    const ZEIGEN = ['beides', 'seite', 'flaeche'];
    const ZEIGEN_VORGABE = 'beides';
    const zeigtIn = (block, wo) => {
        if (!block || typeof block !== 'object')
            return false;
        const roh = block['sichtbarIn'];
        const wert = ZEIGEN.includes(String(roh))
            ? String(roh) : ZEIGEN_VORGABE;
        return wert === 'beides' || wert === wo;
    };
    const ortLesbar = (roh) => {
        if (!roh || typeof roh !== 'object')
            return false;
        const o = roh;
        return Number.isFinite(Number(o['x'])) && Number.isFinite(Number(o['y']));
    };
    const VORGABE = 'redion';
    const holen = (id) => ARTEN.find(a => a.id === id) ?? null;
    const ids = () => ARTEN.map(a => a.id);
    return { ARTEN, VORGABE, ZEIGEN, ZEIGEN_VORGABE, zeigtIn, ortLesbar, holen, ids };
})();
