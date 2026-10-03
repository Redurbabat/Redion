"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ereignisse/bus.ts (npm run bauen:ts). */
const Ereignisse = (() => {
    const zuhoerer = new Map();
    const gemeldet = new Map();
    const istVersprechen = (wert) => !!wert && (typeof wert === 'object' || typeof wert === 'function') &&
        typeof wert.then === 'function';
    const fehlerMelden = (art, name, e) => {
        console.error(art + ' „' + name + '": ' + (e instanceof Error ? e.message : String(e)), e);
        if (typeof Pflege !== 'undefined' && Pflege.fehlerMerken)
            try {
                Pflege.fehlerMerken(e, art + ' ' + name);
            }
            catch { }
    };
    const MAX_SPUR = 200;
    const spur = [];
    let mitschnitt = false;
    const horche = (name, fn, opt) => {
        if (typeof fn !== 'function')
            return () => { };
        const f = fn;
        let s = zuhoerer.get(name);
        if (!s) {
            s = new Set();
            zuhoerer.set(name, s);
        }
        s.add(f);
        if (opt && opt.nachreichen && gemeldet.has(name)) {
            try {
                const r = f(gemeldet.get(name));
                if (istVersprechen(r))
                    r.then(undefined, e => fehlerMelden('Ereignis', name, e));
            }
            catch (e) {
                fehlerMelden('Ereignis', name, e);
            }
        }
        return () => { zuhoerer.get(name)?.delete(f); };
    };
    const einmal = (name, fn) => {
        const ab = horche(name, (daten) => { ab(); return fn(daten); });
        return ab;
    };
    const notieren = (name, daten) => {
        if (!mitschnitt)
            return;
        spur.push({ name, daten, wann: Date.now() });
        if (spur.length > MAX_SPUR)
            spur.shift();
    };
    const melde = (name, daten) => {
        notieren(name, daten);
        gemeldet.set(name, daten);
        const s = zuhoerer.get(name);
        if (!s || !s.size)
            return 0;
        let n = 0;
        [...s].forEach(fn => {
            try {
                const r = fn(daten);
                n++;
                if (istVersprechen(r))
                    r.then(undefined, e => fehlerMelden('Ereignis', name, e));
            }
            catch (e) {
                fehlerMelden('Ereignis', name, e);
            }
        });
        return n;
    };
    const meldeAsync = async (name, daten) => {
        notieren(name, daten);
        gemeldet.set(name, daten);
        const s = zuhoerer.get(name);
        if (!s || !s.size)
            return 0;
        const laufend = [...s].map(fn => {
            try {
                return Promise.resolve(fn(daten));
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
        const ergebnisse = await Promise.allSettled(laufend);
        let n = 0;
        ergebnisse.forEach(erg => {
            if (erg.status === 'fulfilled')
                n++;
            else
                fehlerMelden('Ereignis', name, erg.reason);
        });
        return n;
    };
    const frage = (name, daten) => {
        notieren(name, daten);
        const s = zuhoerer.get(name);
        if (!s || !s.size)
            return [];
        const raus = [];
        [...s].forEach(fn => {
            try {
                const a = fn(daten);
                if (istVersprechen(a)) {
                    a.then(undefined, () => { });
                    fehlerMelden('Frage', name, new Error('ein Zuhörer antwortet asynchron — dafür gibt es frageAsync'));
                    return;
                }
                if (a !== undefined && a !== null)
                    raus.push(a);
            }
            catch (e) {
                fehlerMelden('Frage', name, e);
            }
        });
        return raus;
    };
    const frageAsync = async (name, daten) => {
        notieren(name, daten);
        const s = zuhoerer.get(name);
        if (!s || !s.size)
            return [];
        const laufend = [...s].map(fn => {
            try {
                return Promise.resolve(fn(daten));
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
        const ergebnisse = await Promise.allSettled(laufend);
        const raus = [];
        ergebnisse.forEach(erg => {
            if (erg.status === 'rejected') {
                fehlerMelden('Frage', name, erg.reason);
                return;
            }
            if (erg.value !== undefined && erg.value !== null)
                raus.push(erg.value);
        });
        return raus;
    };
    const darf = (name, daten) => !frage(name, daten).includes(false);
    const darfAsync = async (name, daten) => !(await frageAsync(name, daten)).includes(false);
    const schonGemeldet = (name) => ({ da: gemeldet.has(name), daten: gemeldet.get(name) });
    const uebersicht = () => [...zuhoerer.entries()]
        .map(([name, s]) => ({ name, zuhoerer: s.size }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const mitschneiden = (an) => { mitschnitt = !!an; if (!an)
        spur.length = 0; };
    const letzte = (n = 50) => spur.slice(-n);
    const leeren = () => { zuhoerer.clear(); spur.length = 0; gemeldet.clear(); };
    return { horche, einmal, melde, frage, meldeAsync, frageAsync, darf, darfAsync, schonGemeldet,
        uebersicht, mitschneiden, letzte, leeren, anzahl: () => zuhoerer.size };
})();
window.Ereignisse = Ereignisse;
