"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/context.ts (npm run bauen:ts). */
window.Register = window.Register || {};
const RegisterKontext = (() => {
    const LISTE = [];
    const LIEFERANTEN = [];
    const stapelQuellen = [];
    const melde = (knopf) => {
        if (!knopf || !knopf.bereich || !knopf.id || !knopf.name || !knopf.zeichen)
            return false;
        if (typeof knopf.tun !== 'function' && typeof knopf.liefern !== 'function')
            return false;
        if (LISTE.some(x => x.bereich === knopf.bereich && x.id === knopf.id))
            return false;
        LISTE.push(knopf);
        return true;
    };
    const meldeLieferant = (bereich, fn) => {
        if (!bereich || typeof fn !== 'function')
            return false;
        if (LIEFERANTEN.some(l => l.bereich === bereich && l.fn === fn))
            return false;
        LIEFERANTEN.push({ bereich, fn });
        return true;
    };
    const nimmZurueck = (bereich, id) => {
        const i = LISTE.findIndex(x => x.bereich === bereich && x.id === id);
        if (i < 0)
            return false;
        LISTE.splice(i, 1);
        return true;
    };
    const fuer = (bereich) => {
        if (!bereich)
            return [];
        const roh = LISTE.filter(k => k.bereich === bereich);
        for (const l of LIEFERANTEN) {
            if (l.bereich !== bereich)
                continue;
            try {
                const teil = l.fn();
                if (Array.isArray(teil))
                    for (const k of teil) {
                        if (!k || !k.id || !k.name || !k.zeichen)
                            continue;
                        if (typeof k.tun !== 'function' && typeof k.liefern !== 'function')
                            continue;
                        if (roh.some(x => x.id === k.id))
                            continue;
                        roh.push({ ...k, bereich });
                    }
            }
            catch { }
        }
        return roh
            .filter(k => {
            if (typeof k.zeigen !== 'function')
                return true;
            try {
                return !!k.zeigen();
            }
            catch {
                return false;
            }
        })
            .slice()
            .sort((a, b) => (a.rang ?? 500) - (b.rang ?? 500));
    };
    const zeilen = (knopf) => {
        if (!knopf || typeof knopf.liefern !== 'function')
            return [];
        try {
            const raus = knopf.liefern();
            return Array.isArray(raus) ? raus.filter(z => z && z.id && z.name) : [];
        }
        catch {
            return [{ id: 'fehler', name: 'Lässt sich gerade nicht laden.',
                    tun: () => { } }];
        }
    };
    const meldeStapel = (fn) => {
        if (typeof fn !== 'function' || stapelQuellen.includes(fn))
            return false;
        stapelQuellen.push(fn);
        return true;
    };
    const stapel = () => {
        const raus = [];
        for (const q of stapelQuellen) {
            try {
                const teil = q();
                if (Array.isArray(teil))
                    raus.push(...teil.filter(z => z && z.id && z.name));
            }
            catch { }
        }
        return raus;
    };
    const bereiche = () => {
        const raus = [];
        for (const k of LISTE)
            if (!raus.includes(k.bereich))
                raus.push(k.bereich);
        for (const l of LIEFERANTEN)
            if (!raus.includes(l.bereich))
                raus.push(l.bereich);
        return raus;
    };
    return { melde, meldeLieferant, nimmZurueck, fuer, zeilen,
        meldeStapel, stapel, bereiche,
        alle: () => LISTE.slice(), anzahl: () => LISTE.length };
})();
window.Register.kontext = RegisterKontext;
