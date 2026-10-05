"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/spaltentyp.ts (npm run bauen:ts). */
const Spaltentyp = (() => {
    const leer = (v) => v === null || v === undefined || String(v).trim() === '';
    const alsZahl = (roh) => {
        let t = String(roh ?? '').trim();
        if (!t)
            return null;
        const prozent = /%\s*$/.test(t);
        t = t.replace(/^[^\d+\-.,]*/, '').replace(/[^\d]*$/, '');
        t = t.replace(/[ ’'’\s]/g, '');
        if (!t)
            return null;
        const letztesKomma = t.lastIndexOf(',');
        const letzterPunkt = t.lastIndexOf('.');
        if (letztesKomma >= 0 && letzterPunkt >= 0) {
            if (letztesKomma > letzterPunkt)
                t = t.replace(/\./g, '').replace(',', '.');
            else
                t = t.replace(/,/g, '');
        }
        else if (letztesKomma >= 0) {
            const nach = t.length - letztesKomma - 1;
            const mehrfach = (t.match(/,/g) || []).length > 1;
            t = (nach === 3 && mehrfach) ? t.replace(/,/g, '') : t.replace(',', '.');
        }
        else if (letzterPunkt >= 0) {
            const nach = t.length - letzterPunkt - 1;
            const mehrfach = (t.match(/\./g) || []).length > 1;
            if (nach === 3 && mehrfach)
                t = t.replace(/\./g, '');
        }
        if (!/^[+-]?\d*\.?\d+([eE][+-]?\d+)?$/.test(t))
            return null;
        const n = Number(t);
        if (!isFinite(n))
            return null;
        return prozent ? n / 100 : n;
    };
    const alsDatum = (roh) => {
        const t = String(roh ?? '').trim();
        if (!t || t.length < 6)
            return null;
        const de = t.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
        if (de) {
            let tag = Number(de[1]), monat = Number(de[2]);
            if (monat > 12 && tag <= 12) {
                const h = tag;
                tag = monat;
                monat = h;
            }
            if (monat < 1 || monat > 12 || tag < 1 || tag > 31)
                return null;
            const jahr = Number(de[3]);
            const d = new Date(jahr, monat - 1, tag);
            return isNaN(d.getTime()) || d.getFullYear() !== jahr ||
                d.getMonth() !== monat - 1 || d.getDate() !== tag ? null : d;
        }
        if (/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(t)) {
            const d = new Date(t);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    };
    const JA = ['ja', 'wahr', 'true', 'x', '1', '✓', 'yes'];
    const NEIN = ['nein', 'falsch', 'false', '', '0', 'no'];
    const alsJaNein = (roh) => {
        const t = String(roh ?? '').trim().toLowerCase();
        if (JA.includes(t))
            return true;
        if (NEIN.includes(t) && t !== '')
            return false;
        return null;
    };
    const erkenne = (werte) => {
        const gefuellt = (werte || []).filter(v => !leer(v));
        if (!gefuellt.length)
            return { typ: 'text', sicher: 0, gefuellt: 0, optionen: [] };
        const alle = (pruef) => gefuellt.every(v => pruef(v) !== null);
        if (alle(alsJaNein))
            return { typ: 'checkbox', sicher: 1, gefuellt: gefuellt.length, optionen: [] };
        if (alle(alsZahl))
            return { typ: 'number', sicher: 1, gefuellt: gefuellt.length, optionen: [] };
        if (alle(alsDatum))
            return { typ: 'date', sicher: 1, gefuellt: gefuellt.length, optionen: [] };
        const verschiedene = [...new Set(gefuellt.map(v => String(v).trim()))];
        const kurz = verschiedene.every(v => v.length <= 40);
        if (kurz && verschiedene.length > 1 && verschiedene.length <= 12 &&
            gefuellt.length >= verschiedene.length * 3)
            return { typ: 'select', sicher: verschiedene.length / gefuellt.length,
                gefuellt: gefuellt.length, optionen: verschiedene.sort() };
        const zahlen = gefuellt.filter(v => alsZahl(v) !== null).length;
        return { typ: 'text', sicher: 1 - (zahlen / gefuellt.length),
            gefuellt: gefuellt.length, optionen: [] };
    };
    const wandle = (roh, typ) => {
        if (leer(roh))
            return '';
        switch (typ) {
            case 'number': {
                const n = alsZahl(roh);
                return n === null ? String(roh) : n;
            }
            case 'checkbox': {
                const b = alsJaNein(roh);
                return b === null ? false : b;
            }
            case 'date': {
                const d = alsDatum(roh);
                return d === null ? String(roh) :
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-` +
                        String(d.getDate()).padStart(2, '0');
            }
            default: return String(roh).trim();
        }
    };
    const NAMEN = {
        text: 'Text', number: 'Zahl', date: 'Datum', checkbox: 'Ja/Nein', select: 'Auswahl'
    };
    const name = (typ) => NAMEN[typ] || typ;
    return { erkenne, wandle, name, alsZahl, alsDatum, alsJaNein };
})();
window.Spaltentyp = Spaltentyp;
