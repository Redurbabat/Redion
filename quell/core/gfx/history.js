"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/history.ts (npm run bauen:ts). */
const GfxHistory = (() => {
    const erstelle = (tiefe = 40) => {
        const roh = Number(tiefe);
        const schritte = Math.max(1, Math.floor(Number.isFinite(roh) ? roh : 40));
        const zurueckStapel = [];
        const vorStapel = [];
        const merken = (abbild) => {
            zurueckStapel.push(abbild);
            if (zurueckStapel.length > schritte)
                zurueckStapel.shift();
            vorStapel.length = 0;
        };
        const zurueck = (jetzt) => {
            const vorher = zurueckStapel.pop();
            if (vorher === undefined)
                return null;
            vorStapel.push(jetzt);
            return vorher;
        };
        const vor = (jetzt) => {
            const naechster = vorStapel.pop();
            if (naechster === undefined)
                return null;
            zurueckStapel.push(jetzt);
            return naechster;
        };
        const letztenVerwerfen = () => { zurueckStapel.pop(); };
        const leeren = () => { zurueckStapel.length = 0; vorStapel.length = 0; };
        const kannZurueck = () => zurueckStapel.length > 0;
        const kannVor = () => vorStapel.length > 0;
        const stand = () => ({ zurueck: zurueckStapel.length, vor: vorStapel.length, tiefe: schritte });
        return { merken, zurueck, vor, letztenVerwerfen, leeren, kannZurueck, kannVor, stand };
    };
    return { erstelle };
})();
window.GfxHistory = GfxHistory;
