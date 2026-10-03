"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/jobs/zeitplan.ts (npm run bauen:ts). */
const Zeitplan = (() => {
    const MINUTEN_AM_TAG = 24 * 60;
    const ganzeMinute = (wert) => {
        const n = Number(wert);
        if (!Number.isFinite(n))
            return null;
        const m = Math.floor(n);
        if (m < 0 || m >= MINUTEN_AM_TAG)
            return null;
        return m;
    };
    const uhr = (minute) => {
        const m = ganzeMinute(minute);
        if (m === null)
            return '';
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' +
            String(m % 60).padStart(2, '0');
    };
    const imFenster = (von, bis, minute) => {
        const a = ganzeMinute(von), b = ganzeMinute(bis), m = ganzeMinute(minute);
        if (a === null || b === null || m === null)
            return true;
        if (a === b)
            return true;
        if (a < b)
            return m >= a && m < b;
        return m >= a || m < b;
    };
    const hatBedingung = (b) => {
        if (!b || typeof b !== 'object')
            return false;
        const x = b;
        if (x.amStrom === true || x.nichtTeuer === true)
            return true;
        const a = ganzeMinute(x.vonMinute), z = ganzeMinute(x.bisMinute);
        return a !== null && z !== null && a !== z;
    };
    const darf = (b, lage) => {
        if (!hatBedingung(b))
            return { ok: true, grund: '' };
        const x = b;
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        if (von !== null && bis !== null && von !== bis &&
            !imFenster(von, bis, lage.minute)) {
            return { ok: false,
                grund: 'läuft erst zwischen ' + uhr(von) + ' und ' + uhr(bis) };
        }
        if (x.amStrom === true && lage.laedt === false) {
            return { ok: false, grund: 'läuft erst, wenn das Gerät am Strom hängt' };
        }
        if (x.nichtTeuer === true && lage.teuer === true) {
            return { ok: false, grund: 'läuft erst über eine Verbindung, die nichts kostet' };
        }
        return { ok: true, grund: '' };
    };
    const satz = (b) => {
        if (!hatBedingung(b))
            return '';
        const x = b;
        const teile = [];
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        if (von !== null && bis !== null && von !== bis) {
            teile.push('von ' + uhr(von) + ' bis ' + uhr(bis));
        }
        if (x.amStrom === true)
            teile.push('nur am Strom');
        if (x.nichtTeuer === true)
            teile.push('nicht über eine teure Verbindung');
        if (teile.length < 2)
            return teile[0] || '';
        return teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1];
    };
    const sauber = (roh) => {
        if (!roh || typeof roh !== 'object')
            return null;
        const x = roh;
        const aus = {};
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        if (von !== null && bis !== null && von !== bis) {
            aus.vonMinute = von;
            aus.bisMinute = bis;
        }
        if (x.amStrom === true)
            aus.amStrom = true;
        if (x.nichtTeuer === true)
            aus.nichtTeuer = true;
        return hatBedingung(aus) ? aus : null;
    };
    return { darf, imFenster, hatBedingung, satz, uhr, sauber, MINUTEN_AM_TAG };
})();
window.Zeitplan = Zeitplan;
