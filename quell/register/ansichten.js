"use strict";
/* ============================================================================
 * register/ansichten.js — die Ansichtsarten einer Datenbank
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/ansichten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/ansichten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Dieselben Daten, andere Brille. Eine neue Ansicht entsteht hier als ein
 * Eintrag; gezeichnet wird sie im Bereich Datenbanken.
 *
 * Ein Eintrag ist ein Dreier: [id, Zeichen, Name]. Diese Form stand schon so
 * im Code und bleibt so — eine Umstellung auf Objekte hätte hier nichts
 * gebracht ausser Arbeit an vierzig Aufrufstellen.
 * ==========================================================================*/
window.Register = window.Register || {};
Register.ansichten = (() => {
    const EINGEBAUT = [
        ['table', '▦', 'Tabelle'],
        /* Dieselben Daten mit der Bedienung eines Tabellenprogramms: Pfeiltasten,
           Bereichsauswahl, Einfügen von dreissig Zeilen aus Excel auf einmal.
           Notions grösste Lücke bei der Eingabe — siehe bereiche/datenbanken/raster.ts */
        ['raster', '🧮', 'Raster'],
        ['board', '▤', 'Board'],
        ['timeline', '▬', 'Zeitleiste'],
        ['calendar', '📅', 'Kalender'],
        ['list', '☰', 'Liste'],
        ['gallery', '▩', 'Galerie'],
        ['chart', '📊', 'Diagramm'],
        ['feed', '📰', 'Feed'],
        ['map', '🗺', 'Karte'],
        ['dashboard', '🧮', 'Dashboard'],
        /* Notions grösste Lücke, hier als eigene Ansicht: Zeilen × Spalten × Werte */
        ['pivot', '⊞', 'Pivot'],
        ['form', '📝', 'Formular']
    ];
    /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
    const LISTE = EINGEBAUT.slice();
    const melde = (id, icon, name) => {
        if (!id || LISTE.some(x => x[0] === id))
            return false;
        LISTE.push([id, icon || '▦', name || id]);
        return true;
    };
    const alle = () => LISTE;
    const eines = (id) => alle().find(x => x[0] === id) || null;
    const name = (id) => (eines(id) || [])[2] || id;
    const icon = (id) => (eines(id) || [])[1] || '▦';
    const kennt = (id) => !!eines(id);
    return { alle, eines, name, icon, kennt, melde, anzahl: () => LISTE.length };
})();
