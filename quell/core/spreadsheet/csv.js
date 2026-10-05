"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/spreadsheet/csv.ts (npm run bauen:ts). */
const Csv = (() => {
    const KANDIDATEN = [';', '\t', ','];
    const erkenneTrenner = (text) => {
        const probe = String(text ?? '').replace(/^﻿/, '').split('\n').slice(0, 20).join('\n');
        const zahl = { ';': 0, '\t': 0, ',': 0 };
        let inAnf = false;
        for (let i = 0; i < probe.length; i++) {
            const c = probe[i];
            if (c === '"') {
                if (inAnf && probe[i + 1] === '"') {
                    i++;
                    continue;
                }
                inAnf = !inAnf;
                continue;
            }
            if (!inAnf && c in zahl)
                zahl[c] = (zahl[c] || 0) + 1;
        }
        let beste = KANDIDATEN[0];
        for (const k of KANDIDATEN)
            if ((zahl[k] || 0) > (zahl[beste] || 0))
                beste = k;
        return (zahl[beste] || 0) > 0 ? beste : ';';
    };
    const zerlege = (text, trenner) => {
        const roh = String(text ?? '').replace(/^﻿/, '');
        if (!roh)
            return [];
        const t = trenner || erkenneTrenner(roh);
        const zeilen = [];
        let zeile = [];
        let feld = '';
        let inAnf = false;
        for (let i = 0; i < roh.length; i++) {
            const c = roh[i];
            if (inAnf) {
                if (c === '"' && roh[i + 1] === '"') {
                    feld += '"';
                    i++;
                }
                else if (c === '"')
                    inAnf = false;
                else
                    feld += c;
                continue;
            }
            if (c === '"') {
                inAnf = true;
                continue;
            }
            if (c === t) {
                zeile.push(feld);
                feld = '';
                continue;
            }
            if (c === '\n') {
                zeile.push(feld);
                zeilen.push(zeile);
                zeile = [];
                feld = '';
                continue;
            }
            if (c === '\r')
                continue;
            feld += c;
        }
        if (feld !== '' || zeile.length) {
            zeile.push(feld);
            zeilen.push(zeile);
        }
        while (zeilen.length && zeilen[zeilen.length - 1].every(f => f === ''))
            zeilen.pop();
        return zeilen;
    };
    const schreibe = (zeilen, trenner = ';') => (zeilen || []).map(zeile => (zeile || []).map(wert => {
        const s = wert === null || wert === undefined ? '' : String(wert);
        return (s.includes(trenner) || s.includes('"') || /[\r\n]/.test(s))
            ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(trenner)).join('\r\n');
    const mitBom = (text) => '﻿' + String(text ?? '');
    return { erkenneTrenner, zerlege, schreibe, mitBom };
})();
window.Csv = Csv;
