"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/spreadsheet/address.ts (npm run bauen:ts). */
const CellRefs = (() => {
    const MAX_SPALTE = 16384;
    const MAX_ZEILE = 1048576;
    const A = 'A'.charCodeAt(0);
    const spalteZuText = (spalte) => {
        if (!Number.isFinite(spalte) || spalte < 0)
            return '';
        let n = Math.floor(spalte) + 1;
        let s = '';
        while (n > 0) {
            const rest = (n - 1) % 26;
            s = String.fromCharCode(A + rest) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    };
    const textZuSpalte = (text) => {
        const s = String(text ?? '').toUpperCase();
        if (!/^[A-Z]+$/.test(s))
            return -1;
        let n = 0;
        for (let i = 0; i < s.length; i++)
            n = n * 26 + (s.charCodeAt(i) - A + 1);
        return n - 1;
    };
    const lies = (adresse) => {
        const s = String(adresse ?? '').trim().toUpperCase().replace(/\$/g, '');
        const m = s.match(/^([A-Z]+)([0-9]+)$/);
        if (!m)
            return null;
        const spalte = textZuSpalte(m[1]);
        const zeile = Number(m[2]) - 1;
        if (spalte < 0 || spalte >= MAX_SPALTE)
            return null;
        if (!Number.isFinite(zeile) || zeile < 0 || zeile >= MAX_ZEILE)
            return null;
        return { zeile, spalte };
    };
    const schreibe = (zeile, spalte) => {
        const buchstaben = spalteZuText(spalte);
        if (!buchstaben || !Number.isFinite(zeile) || zeile < 0)
            return '';
        return buchstaben + (Math.floor(zeile) + 1);
    };
    const gueltig = (adresse) => lies(adresse) !== null;
    const liesBereich = (bereich) => {
        const teile = String(bereich ?? '').split(':');
        if (teile.length !== 2)
            return null;
        const a = lies(teile[0]), b = lies(teile[1]);
        if (!a || !b)
            return null;
        return {
            vonZeile: Math.min(a.zeile, b.zeile),
            vonSpalte: Math.min(a.spalte, b.spalte),
            bisZeile: Math.max(a.zeile, b.zeile),
            bisSpalte: Math.max(a.spalte, b.spalte)
        };
    };
    const MAX_ZELLEN = 200000;
    const zellenIn = (bereich) => {
        const b = liesBereich(bereich);
        if (!b)
            return { adressen: [], zuGross: false };
        const anzahl = (b.bisZeile - b.vonZeile + 1) * (b.bisSpalte - b.vonSpalte + 1);
        if (anzahl > MAX_ZELLEN)
            return { adressen: [], zuGross: true };
        const raus = [];
        for (let z = b.vonZeile; z <= b.bisZeile; z++)
            for (let s = b.vonSpalte; s <= b.bisSpalte; s++)
                raus.push(schreibe(z, s));
        return { adressen: raus, zuGross: false };
    };
    const imBereich = (adresse, bereich) => {
        const a = lies(adresse), b = liesBereich(bereich);
        if (!a || !b)
            return false;
        return a.zeile >= b.vonZeile && a.zeile <= b.bisZeile &&
            a.spalte >= b.vonSpalte && a.spalte <= b.bisSpalte;
    };
    const versetzt = (adresse, zeilen, spalten) => {
        const a = lies(adresse);
        if (!a)
            return '';
        const z = a.zeile + (Math.floor(zeilen) || 0);
        const s = a.spalte + (Math.floor(spalten) || 0);
        if (z < 0 || s < 0)
            return '';
        return schreibe(z, s);
    };
    return { spalteZuText, textZuSpalte, lies, schreibe, gueltig,
        liesBereich, zellenIn, imBereich, versetzt,
        MAX_SPALTE, MAX_ZEILE, MAX_ZELLEN };
})();
window.CellRefs = CellRefs;
