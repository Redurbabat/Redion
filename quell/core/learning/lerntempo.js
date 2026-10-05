"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/learning/lerntempo.ts (npm run bauen:ts). */
const Lerntempo = (() => {
    const PAUSE_MS = 5 * 60 * 1000;
    const KURZ_MS = 1200;
    const GENUG = 12;
    const median = (werte) => {
        if (!werte.length)
            return 0;
        const s = [...werte].sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : ((s[m - 1] + s[m]) / 2);
    };
    const jeKarte = (zeiten, vorgabe = 30) => {
        const sortiert = (Array.isArray(zeiten) ? zeiten : [])
            .map(z => Number(z))
            .filter(z => Number.isFinite(z) && z > 0)
            .sort((a, b) => a - b);
        const abstaende = [];
        for (let i = 1; i < sortiert.length; i++) {
            const d = sortiert[i] - sortiert[i - 1];
            if (d >= KURZ_MS && d <= PAUSE_MS)
                abstaende.push(d);
        }
        const genug = abstaende.length >= GENUG;
        const sekunden = genug
            ? Math.round(median(abstaende) / 100) / 10
            : Math.max(1, Math.round(Number(vorgabe) || 30));
        return { sekunden, belege: abstaende.length, gemessen: genug };
    };
    const minutenFuer = (n, messung) => Math.max(1, Math.round((Math.max(0, Math.round(Number(n) || 0)) * messung.sekunden) / 60));
    const satz = (m) => m.gemessen
        ? 'gemessen aus ' + m.belege + ' Antworten'
        : 'geschätzt — erst ' + m.belege + ' von ' + GENUG + ' Messungen';
    return { jeKarte, minutenFuer, satz, PAUSE_MS, KURZ_MS, GENUG };
})();
window.Lerntempo = Lerntempo;
