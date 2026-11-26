"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/seitenansichten.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.seitenansichten = (() => {
    const ARTEN = [
        {
            id: 'redion', name: 'Redion',
            titel: 'Redion — Dokument, Cover und Seitenwerkzeuge',
            zeichen: 'image', herkunft: 'redion'
        },
        {
            id: 'flaeche', name: 'Fläche',
            titel: 'Fläche — freie Leinwand für Notizen, Formen und Verbindungen',
            zeichen: 'grid', herkunft: 'affine'
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
