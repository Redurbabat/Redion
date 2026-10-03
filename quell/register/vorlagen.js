"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/vorlagen.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.vorlagen = (() => {
    const LISTE = [];
    const melde = (eintrag) => {
        if (!eintrag || !eintrag.id)
            return false;
        if (LISTE.some(x => x.id === eintrag.id))
            return false;
        LISTE.push(eintrag);
        return true;
    };
    const ausDerGalerie = () => {
        try {
            return (typeof Galerie !== 'undefined' && Galerie.VORLAGEN) ? Galerie.VORLAGEN : [];
        }
        catch {
            return [];
        }
    };
    const alle = () => {
        const eigene = new Set(LISTE.map(x => x.id));
        return [...ausDerGalerie().filter(v => !eigene.has(v.id)), ...LISTE];
    };
    const eines = (id) => alle().find(x => x.id === id) || null;
    const fassung = (id) => {
        try {
            return (typeof Fassung !== 'undefined') ? Fassung.jetzige(id) : 1;
        }
        catch {
            return 1;
        }
    };
    const bauen = (id) => {
        const v = eines(id);
        if (!v) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Register/vorlagen', 'Unbekannt: ' + id);
            return null;
        }
        try {
            const ausGalerie = (typeof Galerie !== 'undefined') ? Galerie.bauen(id) : null;
            if (ausGalerie)
                return ausGalerie;
            const s = v.bauen ? v.bauen() : null;
            return (s && typeof Fassung !== 'undefined' && Fassung.markiere) ? Fassung.markiere(s, id) : s;
        }
        catch (e) {
            const grund = e instanceof Error ? e.message : String(e);
            if (typeof Reporter !== 'undefined')
                Reporter.error('Register/vorlagen', id + ': ' + grund, e);
            return null;
        }
    };
    const suche = (text) => {
        const t = String(text || '').toLowerCase();
        if (!t)
            return alle();
        return alle().filter(v => (v.name || '').toLowerCase().includes(t) ||
            (v.text || '').toLowerCase().includes(t));
    };
    return { alle, eines, fassung, bauen, suche, melde, anzahl: () => alle().length };
})();
