"use strict";
/* ============================================================================
 * register/vorlagen.js — die Vorlagengalerie
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/vorlagen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/vorlagen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Eine Vorlage ist kein Bild, sondern ein Programm: sie legt Seiten,
 * Datenbanken, Ansichten und Beispielzeilen an. Deshalb steht hier nicht der
 * Inhalt, sondern der Verweis auf die Funktion, die ihn baut — und die
 * Fassungsnummer, ohne die es später kein Update geben kann.
 *
 * Eine neue Vorlage: ein Eintrag hier und eine Funktion im Bereich Vorlagen.
 * Danach steht sie in der Galerie, in der Befehlspalette und im Rundgang.
 * ==========================================================================*/
window.Register = window.Register || {};
Register.vorlagen = (() => {
    const LISTE = [];
    const melde = (eintrag) => {
        if (!eintrag || !eintrag.id)
            return false;
        if (LISTE.some(x => x.id === eintrag.id))
            return false;
        LISTE.push(eintrag);
        return true;
    };
    /** Was der Bereich Vorlagen selbst mitbringt. */
    const ausDerGalerie = () => {
        try {
            return (typeof Galerie !== 'undefined' && Galerie.VORLAGEN) ? Galerie.VORLAGEN : [];
        }
        catch {
            return [];
        }
    };
    const alle = () => {
        const eigene = new Set(LISTE.map(x => x.id));
        return [...ausDerGalerie().filter(v => !eigene.has(v.id)), ...LISTE];
    };
    const eines = (id) => alle().find(x => x.id === id) || null;
    /** Die Fassung einer Vorlage — für Updates auf eingesetzten Seiten. */
    const fassung = (id) => {
        try {
            return (typeof Fassung !== 'undefined') ? Fassung.jetzige(id) : 1;
        }
        catch {
            return 1;
        }
    };
    /**
     * Eine Vorlage einsetzen. Geht über den Bereich, damit der Vermerk
     * „stammt aus Vorlage X, Fassung Y" auf der Seite landet.
     */
    const bauen = (id) => {
        const v = eines(id);
        if (!v) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Register/vorlagen', 'Unbekannt: ' + id);
            return null;
        }
        try {
            return (typeof Galerie !== 'undefined') ? Galerie.bauen(id) : (v.bauen && v.bauen());
        }
        catch (e) {
            const grund = e instanceof Error ? e.message : String(e);
            if (typeof Reporter !== 'undefined')
                Reporter.error('Register/vorlagen', id + ': ' + grund, e);
            return null;
        }
    };
    const suche = (text) => {
        const t = String(text || '').toLowerCase();
        if (!t)
            return alle();
        return alle().filter(v => (v.name || '').toLowerCase().includes(t) ||
            (v.text || '').toLowerCase().includes(t));
    };
    return { alle, eines, fassung, bauen, suche, melde, anzahl: () => alle().length };
})();
