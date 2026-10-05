"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/learning/belege.ts (npm run bauen:ts). */
const Belege = (() => {
    'use strict';
    const RICHTIG = 4;
    const FALSCH = 1;
    const THEMA_MAX = 120;
    const themaAus = (roh) => {
        const t = String(roh ?? '').trim().slice(0, THEMA_MAX);
        return t || 'Ohne Thema';
    };
    const ausSimulationen = (liste) => {
        const raus = [];
        for (const s of (Array.isArray(liste) ? liste : [])) {
            if (!s || typeof s !== 'object')
                continue;
            const wann = String(s.beendet || '');
            if (!wann || !Number.isFinite(Date.parse(wann)))
                continue;
            const simId = String(s.id || wann);
            for (const t of (Array.isArray(s.themen) ? s.themen : [])) {
                const gesamt = Math.max(0, Math.floor(Number(t?.gesamt) || 0));
                if (!gesamt)
                    continue;
                const fehler = Math.min(gesamt, Math.max(0, Math.floor(Number(t?.fehler) || 0)));
                const thema = themaAus(t?.thema);
                const verlauf = [];
                for (let i = 0; i < gesamt; i++)
                    verlauf.push({ id: simId + ':' + thema + ':' + i, at: wann,
                        rating: i < gesamt - fehler ? RICHTIG : FALSCH });
                raus.push({
                    id: 'sim:' + simId + ':' + thema,
                    thema, titel: String(s.titel || 'Prüfungssimulation'),
                    quelle: 'pruefung',
                    reviewVerlauf: verlauf
                });
            }
        }
        return raus;
    };
    return { ausSimulationen, themaAus, RICHTIG, FALSCH, THEMA_MAX };
})();
window.Belege = Belege;
