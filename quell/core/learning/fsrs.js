"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/learning/fsrs.ts (npm run bauen:ts). */
const Fsrs = (() => {
    const W = [
        0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.0310,
        1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.5870, 0.2272, 2.8755
    ];
    const DECAY = -0.5;
    const FACTOR = 19 / 81;
    const grenze = (x, min, max) => Math.min(max, Math.max(min, x));
    const abrufbarkeit = (tage, stabilitaet) => {
        const s = Math.max(0.01, stabilitaet);
        return Math.pow(1 + FACTOR * Math.max(0, tage) / s, DECAY);
    };
    const abstand = (stabilitaet, ziel = 0.9) => {
        const z = grenze(ziel, 0.7, 0.99);
        return (stabilitaet / FACTOR) * (Math.pow(z, 1 / DECAY) - 1);
    };
    const ersterStand = (note) => ({
        stabilitaet: Math.max(0.1, W[note - 1] ?? 1),
        schwierigkeit: grenze((W[4] ?? 5) - (note - 3) * (W[5] ?? 1), 1, 10)
    });
    const neueSchwierigkeit = (alt, note) => {
        const linear = alt - (W[6] ?? 1) * (note - 3);
        const gedaempft = alt + (linear - alt) * (10 - alt) / 9;
        const zurueck = ersterStand(4).schwierigkeit;
        return grenze((W[7] ?? 0) * zurueck + (1 - (W[7] ?? 0)) * gedaempft, 1, 10);
    };
    const stabilitaetNachKoennen = (s, d, r, note) => {
        const schwerBremse = note === 2 ? (W[15] ?? 1) : 1;
        const leichtBonus = note === 4 ? (W[16] ?? 1) : 1;
        const zuwachs = Math.exp(W[8] ?? 0) * (11 - d) * Math.pow(s, -(W[9] ?? 0)) *
            (Math.exp((W[10] ?? 0) * (1 - r)) - 1) * schwerBremse * leichtBonus;
        return Math.max(0.1, s * (1 + zuwachs));
    };
    const stabilitaetNachFehler = (s, d, r) => {
        const neu = (W[11] ?? 0) * Math.pow(d, -(W[12] ?? 0)) *
            (Math.pow(s + 1, W[13] ?? 0) - 1) * Math.exp((W[14] ?? 0) * (1 - r));
        return grenze(neu, 0.1, s);
    };
    const antworten = (stand, note, tage, ziel = 0.9) => {
        if (!stand) {
            const s = ersterStand(note);
            return { stand: s, abstandTage: Math.max(0, abstand(s.stabilitaet, ziel)),
                abrufbarkeitVorher: 1, fehler: note === 1 };
        }
        const r = abrufbarkeit(tage, stand.stabilitaet);
        const d = neueSchwierigkeit(stand.schwierigkeit, note);
        const s = note === 1
            ? stabilitaetNachFehler(stand.stabilitaet, stand.schwierigkeit, r)
            : stabilitaetNachKoennen(stand.stabilitaet, stand.schwierigkeit, r, note);
        return { stand: { stabilitaet: s, schwierigkeit: d },
            abstandTage: Math.max(0, abstand(s, ziel)),
            abrufbarkeitVorher: r, fehler: note === 1 };
    };
    const ausSm2 = (intervall, ease) => ({
        stabilitaet: Math.max(0.1, Number(intervall) || 1),
        schwierigkeit: grenze(10 - ((Number(ease) || 2.5) - 1.3) * (5 / 1.2), 1, 10)
    });
    return { W, DECAY, FACTOR, abrufbarkeit, abstand, ersterStand,
        neueSchwierigkeit, antworten, ausSm2 };
})();
globalThis.Fsrs = Fsrs;
