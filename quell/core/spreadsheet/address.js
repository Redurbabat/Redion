"use strict";
/* ============================================================================
 * core/spreadsheet/address.ts — A1 und was dahintersteckt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/spreadsheet/address.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/core/spreadsheet/address.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die langweiligste Datei des Tabellenkerns und die, an der alles hängt. Eine
 * Zelladresse ist Text (`A1`), eine Rechnung braucht Zahlen (`0/0`), und
 * zwischen beidem wird ständig übersetzt.
 *
 * DREI FALLEN, ALLE DREI HIER EINMAL RICHTIG GELÖST:
 *
 *   1. **Die Spalte ist kein Alphabet mit Ziffern.** Nach `Z` kommt `AA`,
 *      nicht `BA`. Das ist ein Zahlensystem zur Basis 26 **ohne Null** —
 *      `A` ist 1, nicht 0. Wer es wie Basis 26 mit Null rechnet, liegt ab
 *      Spalte 27 daneben, und vorher nie. Genau deshalb fällt es erst auf,
 *      wenn jemand eine breite Tabelle einliest.
 *
 *   2. **Innen null, aussen eins.** `A1` ist `{ zeile: 0, spalte: 0 }`. Das
 *      ist Absicht: Reihen und Felder zählen ab null, Menschen ab eins. Wer
 *      beides mischt, baut den Standardfehler dieser Sorte Programm — und
 *      merkt ihn als „alles um eine Zeile verschoben".
 *
 *   3. **Ein Bereich kann verkehrt herum stehen.** `C3:A1` meint dasselbe
 *      wie `A1:C3`; ein Mensch zieht die Maus auch von rechts unten nach
 *      links oben. Wer das nicht dreht, bekommt einen leeren Bereich und
 *      keine Meldung.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27.
 * Diese Datei ist neu und damit von Anfang an TypeScript (E28).
 * ==========================================================================*/
const CellRefs = (() => {
    /* Excel hört bei XFD (16384) auf. Redion braucht die Grenze nicht als
       Verbot, sondern als Notbremse: eine Adresse mit dreissig Buchstaben ist
       keine Adresse, sondern ein Tippfehler oder ein Angriff auf den
       Speicher. */
    const MAX_SPALTE = 16384;
    const MAX_ZEILE = 1048576;
    const A = 'A'.charCodeAt(0);
    /**
     * Aus einer Spaltenzahl (0-basiert) die Buchstaben machen: 0 → A, 25 → Z,
     * 26 → AA.
     *
     * Das ist die Stelle mit der fehlenden Null. Bei jedem Schritt wird eins
     * abgezogen, bevor geteilt wird — sonst käme nach `Z` ein `@`.
     */
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
    /** Und zurück: A → 0, Z → 25, AA → 26. Unbekanntes ergibt -1. */
    const textZuSpalte = (text) => {
        const s = String(text ?? '').toUpperCase();
        if (!/^[A-Z]+$/.test(s))
            return -1;
        let n = 0;
        for (let i = 0; i < s.length; i++)
            n = n * 26 + (s.charCodeAt(i) - A + 1);
        return n - 1;
    };
    /** `A1` → `{ zeile: 0, spalte: 0 }`. Unbekanntes ergibt null. */
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
    /** `{ zeile: 0, spalte: 0 }` → `A1`. */
    const schreibe = (zeile, spalte) => {
        const buchstaben = spalteZuText(spalte);
        if (!buchstaben || !Number.isFinite(zeile) || zeile < 0)
            return '';
        return buchstaben + (Math.floor(zeile) + 1);
    };
    /** Sieht das überhaupt nach einer Adresse aus? */
    const gueltig = (adresse) => lies(adresse) !== null;
    /**
     * Einen Bereich lesen: `A1:C3` → die vier Ecken, immer richtig herum.
     *
     * `C3:A1` ergibt dasselbe wie `A1:C3` — siehe Falle 3 im Kopf.
     */
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
    /**
     * Alle Adressen eines Bereichs, zeilenweise: `A1:B2` → A1, B1, A2, B2.
     *
     * MIT EINER GRENZE, und die ist kein Schönheitsfehler. `A1:XFD1048576` sind
     * siebzehn Milliarden Adressen; eine Liste davon bringt den Tab um, bevor
     * irgendjemand einen Fehler zu sehen bekommt. Über der Grenze kommt eine
     * leere Liste und `zuGross` — der Aufrufer entscheidet, was er meldet.
     */
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
    /** Liegt die Adresse im Bereich? */
    const imBereich = (adresse, bereich) => {
        const a = lies(adresse), b = liesBereich(bereich);
        if (!a || !b)
            return false;
        return a.zeile >= b.vonZeile && a.zeile <= b.bisZeile &&
            a.spalte >= b.vonSpalte && a.spalte <= b.bisSpalte;
    };
    /** Die Nachbarzelle — für Tab, Enter und die Pfeiltasten. */
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
