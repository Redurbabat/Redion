"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/befehle.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.befehle = (() => {
    const lieferanten = [];
    const feste = [];
    const meldeLieferant = (fn) => {
        if (typeof fn !== 'function' || lieferanten.includes(fn))
            return false;
        lieferanten.push(fn);
        return true;
    };
    const melde = (befehl) => {
        const b = befehl;
        if (!b || !b.titel || typeof b.tun !== 'function')
            return false;
        feste.push(b);
        return true;
    };
    const nimmZurueck = (titel) => {
        const i = feste.findIndex(x => x.titel === titel);
        if (i < 0)
            return false;
        feste.splice(i, 1);
        return true;
    };
    const alle = () => {
        const raus = [...feste];
        lieferanten.forEach(fn => {
            try {
                const teil = fn();
                if (Array.isArray(teil))
                    raus.push(...teil);
            }
            catch (e) {
                const grund = e instanceof Error ? e.message : String(e);
                if (typeof Reporter !== 'undefined')
                    Reporter.warn('Register/befehle', 'Ein Lieferant hat versagt: ' + grund, e);
            }
        });
        return raus.filter(b => !b.zeigen || (() => {
            try {
                return !!b.zeigen();
            }
            catch {
                return false;
            }
        })());
    };
    const gruppen = () => [...new Set(alle().map(b => b.gruppe || 'Weiteres'))];
    const suche = (text) => {
        const t = String(text || '').toLowerCase().trim();
        const liste = alle();
        if (!t)
            return liste;
        const vorn = liste.filter(b => (b.titel || '').toLowerCase().startsWith(t));
        const drin = liste.filter(b => !vorn.includes(b) &&
            ((b.titel || '').toLowerCase().includes(t) ||
                (b.gruppe || '').toLowerCase().includes(t)));
        return [...vorn, ...drin];
    };
    return { alle, gruppen, suche, melde, meldeLieferant, nimmZurueck,
        anzahl: () => alle().length,
        lieferanten: () => lieferanten.length };
})();
