"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/buch.ts (npm run bauen:ts). */
const KiBuch = (() => {
    const SCHL_GRENZEN = 'ki:grenzen';
    const SCHL_BUCH = 'ki:buch';
    const BEHALTEN_TAGE = 70;
    const tagVon = (d) => d.toISOString().slice(0, 10);
    const monatVon = (d) => d.toISOString().slice(0, 7);
    const heute = () => tagVon(new Date());
    const monat = () => monatVon(new Date());
    const grenzen = () => {
        const g = Store.getMeta(SCHL_GRENZEN, null);
        if (!g || typeof g !== 'object')
            return { ...KiKosten.VORGABE_GRENZEN };
        const v = KiKosten.VORGABE_GRENZEN;
        const zahl = (w, vorgabe) => (typeof w === 'number' && Number.isFinite(w) && w >= 0) ? w : vorgabe;
        return {
            jeAufruf: zahl(g.jeAufruf, v.jeAufruf),
            jeLauf: zahl(g.jeLauf, v.jeLauf),
            jeTag: zahl(g.jeTag, v.jeTag),
            jeMonat: zahl(g.jeMonat, v.jeMonat)
        };
    };
    const grenzenSetzen = (neu) => {
        const g = grenzen();
        const zahl = (w, alt) => (typeof w === 'number' && Number.isFinite(w) && w >= 0) ? w : alt;
        const gesetzt = {
            jeAufruf: zahl(neu?.jeAufruf, g.jeAufruf),
            jeLauf: zahl(neu?.jeLauf, g.jeLauf),
            jeTag: zahl(neu?.jeTag, g.jeTag),
            jeMonat: zahl(neu?.jeMonat, g.jeMonat)
        };
        Store.setMeta(SCHL_GRENZEN, gesetzt);
        return gesetzt;
    };
    const buchungen = () => {
        const b = Store.getMeta(SCHL_BUCH, []);
        return Array.isArray(b) ? b : [];
    };
    let laufStand = 0;
    const laufBeginnen = () => { laufStand = 0; };
    const laufAusgabe = () => laufStand;
    const stand = () => KiKosten.standAus(buchungen(), heute(), monat(), laufStand);
    const pruefen = (modell, nachrichten, opt = {}) => {
        if (opt.lokal) {
            return { erlaubt: true, grenze: '', satz: '',
                schaetzung: { bekannt: true, frei: true, betrag: 0, hoechstens: 0,
                    modell, tokenEin: 0, tokenAus: 0,
                    waehrung: KiKosten.WAEHRUNG, satz: '' } };
        }
        const ein = KiKosten.tokenAusNachrichten(nachrichten);
        const aus = typeof opt.aus === 'number' ? opt.aus : 2000;
        const s = KiKosten.schaetzen(modell, ein, aus);
        return KiKosten.pruefen(s, grenzen(), stand());
    };
    const buchen = (modell, anbieter, tokenEin, tokenAus, gezaehlt = false) => {
        const s = KiKosten.schaetzen(modell, tokenEin, tokenAus);
        const betrag = s.bekannt ? s.betrag : 0;
        laufStand += betrag;
        const eintrag = {
            id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            tag: heute(), modell, anbieter,
            tokenEin, tokenAus, betrag, gezaehlt
        };
        const alt = new Date(Date.now() - BEHALTEN_TAGE * 86400000);
        const liste = KiKosten.kuerzen(buchungen().concat([eintrag]), tagVon(alt));
        Store.setMeta(SCHL_BUCH, liste);
        return eintrag;
    };
    const berichtigen = (id, tokenEin, tokenAus) => {
        if (typeof id !== 'string' || !id)
            return null;
        if (typeof tokenEin !== 'number' || !Number.isFinite(tokenEin) || tokenEin < 0)
            return null;
        if (typeof tokenAus !== 'number' || !Number.isFinite(tokenAus) || tokenAus < 0)
            return null;
        const liste = buchungen();
        const i = liste.findIndex((b) => b && b.id === id);
        if (i < 0)
            return null;
        const vorher = liste[i];
        const s = KiKosten.schaetzen(vorher.modell, tokenEin, tokenAus);
        const betrag = s.bekannt ? s.betrag : 0;
        laufStand += betrag - (Number(vorher.betrag) || 0);
        const nachher = { ...vorher, tokenEin, tokenAus, betrag, gezaehlt: true,
            geschaetztWar: vorher.betrag };
        liste[i] = nachher;
        Store.setMeta(SCHL_BUCH, liste);
        return nachher;
    };
    const stapelSchaetzen = (modell, texte, jeAus = 0) => {
        let ein = 0;
        for (const t of texte || [])
            ein += KiKosten.tokenSchaetzen(t);
        return KiKosten.schaetzen(modell, ein, jeAus * (texte || []).length);
    };
    const monatJeAnbieter = () => KiKosten.jeAnbieter(buchungen(), monat());
    const leeren = () => { Store.setMeta(SCHL_BUCH, []); laufStand = 0; };
    return {
        grenzen, grenzenSetzen, stand, pruefen, buchen, berichtigen, stapelSchaetzen,
        monatJeAnbieter, buchungen, leeren, laufBeginnen, laufAusgabe,
        SCHL_GRENZEN, SCHL_BUCH, BEHALTEN_TAGE
    };
})();
window.KiBuch = KiBuch;
