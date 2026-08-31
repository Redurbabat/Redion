"use strict";
/* ============================================================================
 * bereiche/ki/buch.ts — das Kassenbuch der KI
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/buch.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/buch.js`.
 * ----------------------------------------------------------------------------
 * `core/ai/kosten.ts` RECHNET. Diese Datei WEISS — sie liest die Grenzen aus
 * den Einstellungen, führt das Buch in `meta` und sagt Ja oder Nein.
 *
 * ─── WAS SIE ABSICHTLICH NICHT TUT ──────────────────────────────────────────
 *
 * Sie fasst LOKALE Modelle nicht an. Ollama und WebLLM kosten nichts, und
 * eine Kostenprüfung davor wäre Reibung ohne Gegenwert — der häufigste Weg,
 * eine Sicherung unbeliebt zu machen, ist, sie dort einzubauen, wo sie
 * nichts schützt.
 *
 * Sie hält auch nichts auf, was der Mensch gerade ausdrücklich angestossen
 * hat und dessen Kosten er gesehen hat. Die Grenze ist eine Bremse gegen
 * Unfälle — vor allem gegen Agenten in Schleifen —, kein Vormund.
 *
 * ─── DIE GRENZEN GEHÖREN DEM MENSCHEN ───────────────────────────────────────
 *
 * Alle vier sind abschaltbar (0 = keine Grenze), und die Vorgaben sind
 * bewusst niedrig genug, dass ein Unfall auffällt, und hoch genug, dass
 * gewöhnliche Arbeit nicht anschlägt. Wer sie ändern will, findet sie unter
 * Einstellungen → KI.
 * ==========================================================================*/
const KiBuch = (() => {
    /* Die Meta-Schlüssel. Sie stehen hier oben zusammen, damit man sie
       findet — verstreute `getMeta('irgendwas')` sind die Sorte Wissen, die
       nur im Kopf des Autors existiert. */
    const SCHL_GRENZEN = 'ki:grenzen';
    const SCHL_BUCH = 'ki:buch';
    /** Wie lange Buchungen aufgehoben werden. Länger als der Monatsstand. */
    const BEHALTEN_TAGE = 70;
    const tagVon = (d) => d.toISOString().slice(0, 10);
    const monatVon = (d) => d.toISOString().slice(0, 7);
    const heute = () => tagVon(new Date());
    const monat = () => monatVon(new Date());
    /** Die Grenzen, wie sie gerade gelten. */
    const grenzen = () => {
        const g = Store.getMeta(SCHL_GRENZEN, null);
        if (!g || typeof g !== 'object')
            return { ...KiKosten.VORGABE_GRENZEN };
        /* Feld für Feld, nicht `Object.assign`: ein fremder Schlüssel in `meta`
           soll keine neue Grenze erfinden. */
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
    /** Was in diesem Agentenlauf schon ausgegeben wurde — nur im Speicher. */
    let laufStand = 0;
    const laufBeginnen = () => { laufStand = 0; };
    const laufAusgabe = () => laufStand;
    /** Der Stand: heute, diesen Monat, in diesem Lauf. */
    const stand = () => KiKosten.standAus(buchungen(), heute(), monat(), laufStand);
    /**
     * Darf dieser Aufruf laufen?
     *
     * @param modell      wie der Anbieter ihn schreibt
     * @param nachrichten die Nachrichtenliste — daraus wird geschätzt
     * @param opt.aus     erwartete Ausgabe-Token. Ohne Angabe 2000 — das ist
     *                    Redions Deckelung bei Anthropic und eine
     *                    vernünftige Annahme dort, wo es keine gibt.
     * @param opt.lokal   true = Ollama/WebLLM, kostet nichts, wird durchgelassen
     */
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
    /**
     * Eine Ausgabe verbuchen.
     *
     * @param gezaehlt true = die Tokenzahl kam vom Anbieter. Das ist der
     *                 Unterschied zwischen „so viel war es" und „so viel war
     *                 es vermutlich", und er gehört ins Buch, damit man ihn
     *                 später noch weiss.
     */
    const buchen = (modell, anbieter, tokenEin, tokenAus, gezaehlt = false) => {
        const s = KiKosten.schaetzen(modell, tokenEin, tokenAus);
        const betrag = s.bekannt ? s.betrag : 0;
        laufStand += betrag;
        const eintrag = {
            tag: heute(), modell, anbieter,
            tokenEin, tokenAus, betrag, gezaehlt
        };
        const alt = new Date(Date.now() - BEHALTEN_TAGE * 86400000);
        const liste = KiKosten.kuerzen(buchungen().concat([eintrag]), tagVon(alt));
        Store.setMeta(SCHL_BUCH, liste);
        return eintrag;
    };
    /**
     * Was ein Stapel Aufrufe zusammen kosten dürfte.
     *
     * Für `embeddingsBauen` und alles, was in einer Schleife ruft: die
     * einzelne Anfrage ist harmlos, zweitausend davon sind es nicht. Wer
     * einen Stapel anstösst, soll die SUMME sehen und nicht den Einzelpreis.
     */
    const stapelSchaetzen = (modell, texte, jeAus = 0) => {
        let ein = 0;
        for (const t of texte || [])
            ein += KiKosten.tokenSchaetzen(t);
        return KiKosten.schaetzen(modell, ein, jeAus * (texte || []).length);
    };
    /** Für die Anzeige: was je Anbieter diesen Monat zusammenkam. */
    const monatJeAnbieter = () => KiKosten.jeAnbieter(buchungen(), monat());
    /** Alles vergessen — für den Menschen, der das Buch nicht führen will. */
    const leeren = () => { Store.setMeta(SCHL_BUCH, []); laufStand = 0; };
    return {
        grenzen, grenzenSetzen, stand, pruefen, buchen, stapelSchaetzen,
        monatJeAnbieter, buchungen, leeren, laufBeginnen, laufAusgabe,
        SCHL_GRENZEN, SCHL_BUCH, BEHALTEN_TAGE
    };
})();
window.KiBuch = KiBuch;
