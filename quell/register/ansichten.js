"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/ansichten.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.ansichten = (() => {
    const EINGEBAUT = [
        ['table', '▦', 'Tabelle'],
        ['raster', '🧮', 'Raster'],
        ['board', '▤', 'Board'],
        ['timeline', '▬', 'Zeitstrahl'],
        ['calendar', '📅', 'Kalender'],
        ['list', '☰', 'Liste'],
        ['gallery', '▩', 'Galerie'],
        ['chart', '📊', 'Diagramm'],
        ['feed', '📰', 'Feed'],
        ['map', '🗺', 'Karte'],
        ['dashboard', '🧮', 'Dashboard'],
        ['pivot', '⊞', 'Pivot'],
        ['form', '📝', 'Formular']
    ];
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
