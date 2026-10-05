"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/jobs/modell.ts (npm run bauen:ts). */
const JobModell = (() => {
    const PACHT_MS = 30000;
    const MAX_VERSUCHE = 3;
    const anlegen = (id, art, eingabe, jetzt, zeitText, opt = {}) => ({
        id, art, zustand: 'wartet', eingabe,
        schritt: 0, schritte: opt.schritte || 0, stand: null,
        versuche: 0, maxVersuche: opt.maxVersuche || MAX_VERSUCHE,
        geraet: '', bisWann: 0, nachher: jetzt,
        angelegt: zeitText, begonnen: '', beendet: '',
        fehler: '', text: opt.text || '',
        bedingung: opt.bedingung ?? null
    });
    const nehmbar = (a, jetzt, geraet) => {
        if (!a)
            return false;
        if (a.zustand === 'wartet')
            return a.nachher <= jetzt;
        if (a.zustand !== 'laeuft')
            return false;
        return a.bisWann <= jetzt || a.geraet === geraet;
    };
    const nehmen = (a, jetzt, geraet, zeitText, pachtMs = PACHT_MS) => ({
        ...a,
        zustand: 'laeuft',
        versuche: a.versuche + 1,
        geraet,
        bisWann: jetzt + pachtMs,
        begonnen: a.begonnen || zeitText
    });
    const halten = (a, jetzt, pachtMs = PACHT_MS) => ({ ...a, bisWann: jetzt + pachtMs });
    const schrittFertig = (a, stand, jetzt, text, pachtMs = PACHT_MS) => ({
        ...a,
        schritt: a.schritt + 1,
        stand,
        bisWann: jetzt + pachtMs,
        text: text === undefined ? a.text : text
    });
    const fertig = (a, zeitText, text) => ({
        ...a,
        zustand: 'fertig', geraet: '', bisWann: 0,
        beendet: zeitText, fehler: '',
        text: text === undefined ? a.text : text
    });
    const abbrechen = (a, zeitText) => ({
        ...a,
        zustand: 'abgebrochen', geraet: '', bisWann: 0, beendet: zeitText
    });
    const wartezeit = (versuche) => Math.min(300000, 1000 * Math.pow(2, Math.max(0, versuche - 1)));
    const gescheitert = (a, meldung, jetzt, zeitText) => {
        const aus = a.versuche >= a.maxVersuche;
        return {
            ...a,
            zustand: aus ? 'fehler' : 'wartet',
            geraet: '', bisWann: 0,
            nachher: aus ? a.nachher : jetzt + wartezeit(a.versuche),
            beendet: aus ? zeitText : '',
            fehler: String(meldung || 'Unbekannter Fehler')
        };
    };
    const zurueckstellen = (a, jetzt, zeitText) => {
        if (a.zustand !== 'laeuft')
            return a;
        if (a.versuche >= a.maxVersuche) {
            return { ...a, zustand: 'fehler', geraet: '', bisWann: 0,
                beendet: zeitText,
                fehler: a.fehler || 'Nach einem Neustart nicht fortgesetzt — ' +
                    'die Versuche waren aufgebraucht.' };
        }
        return { ...a, zustand: 'wartet', geraet: '', bisWann: 0,
            nachher: jetzt + wartezeit(a.versuche) };
    };
    const beendet = (a) => a.zustand === 'fertig' || a.zustand === 'fehler' || a.zustand === 'abgebrochen';
    const fortschritt = (a) => {
        if (a.zustand === 'fertig')
            return 1;
        if (!a.schritte || a.schritte <= 0)
            return -1;
        return Math.min(1, Math.max(0, a.schritt / a.schritte));
    };
    const naechster = (alle, jetzt, geraet) => {
        let best = null;
        for (const a of alle) {
            if (!nehmbar(a, jetzt, geraet))
                continue;
            if (!best || a.angelegt < best.angelegt ||
                (a.angelegt === best.angelegt && a.id < best.id))
                best = a;
        }
        return best;
    };
    const aufraeumbar = (a, jetzt, haltenMs) => {
        if (a.zustand !== 'fertig' && a.zustand !== 'abgebrochen')
            return false;
        if (!a.beendet)
            return false;
        const t = Date.parse(a.beendet);
        if (!Number.isFinite(t))
            return false;
        return jetzt - t > haltenMs;
    };
    return {
        anlegen, nehmbar, nehmen, halten, schrittFertig, fertig, abbrechen,
        gescheitert, zurueckstellen, beendet, fortschritt, naechster,
        aufraeumbar, wartezeit,
        PACHT_MS, MAX_VERSUCHE
    };
})();
window.JobModell = JobModell;
