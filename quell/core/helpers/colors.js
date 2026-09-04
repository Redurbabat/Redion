"use strict";
/* ============================================================================
 * core/helpers/colors.ts — Farben haben Namen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/colors.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/colors.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT. Redion hat vier Reihen von Farbfeldern — für
 * Auswahloptionen, für Regelfarben, für die Akzentfarbe, für Heftdeckel. Eine
 * davon (`nh-farben`) macht es richtig: jedes Feld trägt seinen Namen als
 * `title` und `aria-label`, und das gewählte trägt ein Häkchen. Die anderen
 * drei trugen entweder gar nichts oder die rohe Kennung („purple"), und das
 * Gewählte war nur an seiner Umrandung zu erkennen.
 *
 * §38 sagt: keine Information nur über Farbe. Bei einem Farbwähler ist das
 * kein Wortspiel, sondern der Kern der Sache — wer Rot und Grün nicht
 * unterscheidet, sieht dort acht graue Kreise.
 *
 * Die Kennungen sind die der CSS-Tokens `--c-*` und `--b-*`. Sie sind
 * ENGLISCH, weil sie so gespeichert und so im Stil benannt sind (§53.3
 * Grenze 1); die Namen sind deutsch, weil ein Mensch sie liest.
 * ==========================================================================*/
const Farben = (() => {
    const NAMEN = {
        default: 'Standard',
        gray: 'Grau',
        brown: 'Braun',
        orange: 'Orange',
        yellow: 'Gelb',
        green: 'Grün',
        blue: 'Blau',
        purple: 'Violett',
        pink: 'Rosa',
        red: 'Rot',
    };
    /**
     * Der deutsche Name zu einer Farbkennung.
     *
     * Eine unbekannte Kennung gibt sich selbst zurück, statt zu verschwinden:
     * ein Feld mit der Marke „tuerkis" ist unschön, ein Feld ohne Marke ist
     * ein Fehler.
     */
    const name = (id) => NAMEN[String(id || '')] || String(id || '');
    /** Alle Kennungen in der Reihenfolge, in der sie in Wählern stehen sollen. */
    const alle = () => Object.keys(NAMEN);
    /**
     * Ein Wort für eine Farbe, die nur als Hexwert vorliegt.
     *
     * Der Akzentwähler kennt keine Kennungen, sondern acht feste Hexwerte. Die
     * hier zu benennen heisst nicht, Farben zu erkennen — es heisst, die acht
     * bekannten beim Namen zu nennen und für alles andere ehrlich „eigene
     * Farbe" zu sagen.
     */
    const HEX = {
        '#2eaadc': 'Blau', '#6c8cff': 'Indigo', '#5cbf8a': 'Grün',
        '#e0a33a': 'Gelb', '#e06a94': 'Rosa', '#9a6dd7': 'Violett',
        '#ff7369': 'Rot', '#8a8a8a': 'Grau',
        '#529cca': 'Blau', '#4dab9a': 'Türkis', '#ffa344': 'Orange',
        '#e255a1': 'Magenta', '#ffdc49': 'Gelb', '#9b9a97': 'Grau',
    };
    const nachHex = (wert) => HEX[String(wert || '').toLowerCase()] || 'Eigene Farbe';
    return { name, alle, nachHex };
})();
window.Farben = Farben;
