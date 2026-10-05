"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/zeichenziel.ts (npm run bauen:ts). */
const Zeichenziel = (() => {
    const flaechen = [];
    let zuletzt = -1;
    const horcher = [];
    const melden = () => {
        for (const h of horcher) {
            try {
                h();
            }
            catch { }
        }
    };
    const finde = (steuerung) => flaechen.findIndex(f => f.steuerung === steuerung);
    const lebt = (e) => e.steuerung.flaeche?.isConnected === true;
    let raeumt = false;
    const aufraeumen = () => {
        if (raeumt || !flaechen.length)
            return;
        raeumt = true;
        try {
            const gemeint = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] : null;
            let jemandLebt = false;
            for (const e of flaechen) {
                if (lebt(e)) {
                    e.gesehen = true;
                    jemandLebt = true;
                }
            }
            const letzte = flaechen[flaechen.length - 1];
            let weg = 0;
            for (let i = flaechen.length - 1; i >= 0; i--) {
                const e = flaechen[i];
                if (!e.steuerung.flaeche)
                    continue;
                if (lebt(e))
                    continue;
                if (!e.gesehen && !jemandLebt && e === letzte)
                    continue;
                flaechen.splice(i, 1);
                weg++;
            }
            if (!weg)
                return;
            const wieder = gemeint ? flaechen.indexOf(gemeint) : -1;
            zuletzt = wieder >= 0 ? wieder : (flaechen.length ? flaechen.length - 1 : -1);
            melden();
        }
        finally {
            raeumt = false;
        }
    };
    const melde = (steuerung, name = 'Fläche') => {
        if (!steuerung || typeof steuerung.setzeWerkzeug !== 'function')
            return;
        aufraeumen();
        if (finde(steuerung) >= 0)
            return;
        flaechen.push({ steuerung, name: String(name), werkzeug: 'schreiben',
            farbe: '', dicke: 0,
            gesehen: steuerung.flaeche?.isConnected === true });
        if (zuletzt < 0 || zuletzt >= flaechen.length)
            zuletzt = flaechen.length - 1;
        melden();
    };
    const beruehrt = (steuerung) => {
        const i = finde(steuerung);
        if (i < 0 || i === zuletzt)
            return;
        zuletzt = i;
        melden();
    };
    const abmelden = (steuerung) => {
        const i = finde(steuerung);
        if (i < 0)
            return;
        flaechen.splice(i, 1);
        if (flaechen.length === 0)
            zuletzt = -1;
        else if (zuletzt >= flaechen.length)
            zuletzt = flaechen.length - 1;
        else if (i < zuletzt)
            zuletzt--;
        melden();
    };
    const leeren = () => {
        if (!flaechen.length)
            return;
        flaechen.length = 0;
        zuletzt = -1;
        melden();
    };
    const aktive = () => {
        aufraeumen();
        return zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt].steuerung : null;
    };
    const da = () => aktive() !== null;
    const anzahl = () => { aufraeumen(); return flaechen.length; };
    const namen = () => { aufraeumen(); return flaechen.map(f => f.name); };
    const jetzt = () => {
        aufraeumen();
        return zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt].werkzeug : '';
    };
    const werkzeugVon = (steuerung) => {
        const i = finde(steuerung);
        return i < 0 ? '' : flaechen[i].werkzeug;
    };
    const setze = (werkzeug) => {
        const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] : null;
        if (!e || typeof e.steuerung.setzeWerkzeug !== 'function')
            return false;
        try {
            e.steuerung.setzeWerkzeug(werkzeug);
        }
        catch {
            return false;
        }
        e.werkzeug = String(werkzeug);
        melden();
        return true;
    };
    const uebernehme = (steuerung, werkzeug) => {
        const i = finde(steuerung);
        if (i < 0)
            return;
        flaechen[i].werkzeug = String(werkzeug);
        if (zuletzt !== i)
            zuletzt = i;
        melden();
    };
    const setzeFarbe = (wert) => {
        const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] : null;
        if (!e || typeof e.steuerung.setzeFarbe !== 'function')
            return false;
        try {
            e.steuerung.setzeFarbe(wert);
        }
        catch {
            return false;
        }
        e.farbe = String(wert);
        melden();
        return true;
    };
    const setzeStrich = (wert) => {
        const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] : null;
        if (!e || typeof e.steuerung.setzeStrich !== 'function')
            return false;
        try {
            e.steuerung.setzeStrich(wert);
        }
        catch {
            return false;
        }
        e.dicke = Number(wert);
        melden();
        return true;
    };
    const uebernehmeFarbe = (steuerung, wert) => {
        const i = finde(steuerung);
        if (i < 0)
            return;
        flaechen[i].farbe = String(wert);
        if (zuletzt !== i)
            zuletzt = i;
        melden();
    };
    const uebernehmeStrich = (steuerung, wert) => {
        const i = finde(steuerung);
        if (i < 0)
            return;
        flaechen[i].dicke = Number(wert);
        if (zuletzt !== i)
            zuletzt = i;
        melden();
    };
    const jetztFarbe = () => {
        aufraeumen();
        return zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt].farbe : '';
    };
    const jetztDicke = () => {
        aufraeumen();
        return zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt].dicke : 0;
    };
    const farbeVon = (steuerung) => {
        const i = finde(steuerung);
        return i < 0 ? '' : flaechen[i].farbe;
    };
    const dickeVon = (steuerung) => {
        const i = finde(steuerung);
        return i < 0 ? 0 : flaechen[i].dicke;
    };
    const ruf = (was) => {
        const s = aktive();
        const fn = s && s[was];
        if (typeof fn !== 'function')
            return false;
        try {
            fn.call(s);
            return true;
        }
        catch {
            return false;
        }
    };
    const horche = (fn) => {
        if (typeof fn === 'function' && !horcher.includes(fn))
            horcher.push(fn);
    };
    const vergiss = (fn) => {
        const i = horcher.indexOf(fn);
        if (i >= 0)
            horcher.splice(i, 1);
    };
    return { melde, beruehrt, abmelden, leeren, aktive, da, anzahl, namen,
        jetzt, werkzeugVon, setze, uebernehme,
        setzeFarbe, setzeStrich, uebernehmeFarbe, uebernehmeStrich,
        jetztFarbe, jetztDicke, farbeVon, dickeVon,
        ruf, horche, vergiss };
})();
window.Zeichenziel = Zeichenziel;
