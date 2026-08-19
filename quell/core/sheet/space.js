"use strict";
/* ============================================================================
 * core/sheet/space.ts — der Blattraum
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/sheet/space.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/sheet/space.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * EINE STELLE, DIE BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite.
 *
 * Die vorhandene Zeichenfläche rechnet in rohen Bildschirmpunkten:
 *
 *     const r = flaeche.getBoundingClientRect();
 *     return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
 *
 * Das geht gut, solange die Fläche immer gleich breit ist. Ist sie es
 * nicht — anderes Fenster, Seitenleiste zu, Telefon quer, Zoom —, dann
 * liegt jeder gespeicherte Strich woanders als beim Zeichnen. Und zwar
 * ohne Fehlermeldung: die Zeichnung sieht aus wie eine Zeichnung, nur
 * verrutscht. Das ist die Sorte Verlust, die niemand bemerkt.
 *
 * Ein Blatt hat deshalb feste Masse in PUNKTEN, und das SVG trägt eine
 * `viewBox`. Was gespeichert wird, sind Blattpunkte — dieselbe Zahl auf
 * jedem Bildschirm. Die Umrechnung macht der Browser selbst über die
 * Bildschirmmatrix des SVG; sie berücksichtigt Breite, Zoom, Rollstand
 * und jede CSS-Verwandlung darüber, was `getBoundingClientRect` nicht tut.
 *
 * `raumVersion` steht von der ersten Zeile an in den Daten. Ändert sich je
 * die Bedeutung der Zahlen, ist an ihr erkennbar, welche Deutung gilt —
 * die Zeichenfläche hat das nicht, und deshalb wäre dort jede Änderung
 * eine stille Verschiebung.
 * ==========================================================================*/
const SheetSpace = (() => {
    /* A4 in Punkten, 1 pt = 1/72 Zoll: 210 × 297 mm. Krumme Zahlen, aber die
       richtigen — 595/842 wären 0,05 mm daneben, und beim Drucken zählt das. */
    const A4_BREITE = 595.28;
    const A4_HOEHE = 841.89;
    /* 20 mm Rand, wie auf einem Schulblatt. */
    const RAND = 56.69;
    const RAUM_VERSION = 1;
    /** Zwei Nachkommastellen genügen: 0,01 pt sind 3,5 Tausendstel Millimeter. */
    const rund = (n) => Math.round(n * 100) / 100;
    /**
     * Ein Zeigerpunkt vom Bildschirm in Blattpunkte.
     *
     * Gibt `null` zurück, wenn das SVG (noch) keine Bildschirmmatrix hat —
     * das passiert bei einem Element, das nicht im Dokument hängt oder
     * `display: none` ist. Dann wird NICHT geraten.
     */
    const zuBlatt = (svg, e) => {
        if (!svg || !svg.getScreenCTM)
            return null;
        const matrix = svg.getScreenCTM();
        if (!matrix)
            return null;
        const punkt = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
        if (!isFinite(punkt.x) || !isFinite(punkt.y))
            return null;
        return [rund(punkt.x), rund(punkt.y)];
    };
    /** Wie viele Blattseiten hoch ist dieses Blatt? Mindestens eine. */
    const seiten = (hoehe) => Math.max(1, Math.ceil((Number(hoehe) || A4_HOEHE) / A4_HOEHE));
    return { A4_BREITE, A4_HOEHE, RAND, RAUM_VERSION, rund, zuBlatt, seiten };
})();
window.SheetSpace = SheetSpace;
