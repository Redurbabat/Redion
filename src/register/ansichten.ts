/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/ansichten.ts (npm run bauen:ts). */
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

(window as any).Register = (window as any).Register || {};

Register.ansichten = (() => {

  /* Ein Eintrag ist ein Dreier: Kennung, Zeichen, Name. Das steht seit jeher
     so im Code, und der Typ schreibt es nur auf, statt es zu ändern — vierzig
     Aufrufstellen umzubauen brächte hier nichts ausser Risiko. */
  type Eintrag = [string, string, string];

  const EINGEBAUT: Eintrag[] = [
    ['table',    '▦', 'Tabelle'],
    /* Dieselben Daten mit der Bedienung eines Tabellenprogramms: Pfeiltasten,
       Bereichsauswahl, Einfügen von dreissig Zeilen aus Excel auf einmal.
       Notions grösste Lücke bei der Eingabe — siehe bereiche/datenbanken/raster.ts */
    ['raster',   '🧮', 'Raster'],
    ['board',    '▤', 'Board'],
    /* „Zeitstrahl", nicht „Zeitleiste" (E422). Beide Wörter standen im
       Projekt für dieselbe Ansicht: das Register sagte Zeitleiste, der
       Reiter Zeitstrahl, und die Fehlermeldung „Für den Zeitstrahl braucht
       es eine Datums-Eigenschaft" auch. Es gewinnt das Wort, das der Nutzer
       schon liest. */
    ['timeline', '▬', 'Zeitstrahl'],
    ['calendar', '📅', 'Kalender'],
    ['list',     '☰', 'Liste'],
    ['gallery',  '▩', 'Galerie'],
    ['chart',    '📊', 'Diagramm'],
    ['feed',     '📰', 'Feed'],
    ['map',      '🗺', 'Karte'],
    ['dashboard','🧮', 'Dashboard'],
    /* Notions grösste Lücke, hier als eigene Ansicht: Zeilen × Spalten × Werte */
    ['pivot',    '⊞', 'Pivot'],
    ['form',     '📝', 'Formular']
  ];

  /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
  const LISTE: Eintrag[] = EINGEBAUT.slice();

  const melde = (id: string, icon?: string, name?: string): boolean => {
    if (!id || LISTE.some(x => x[0] === id)) return false;
    LISTE.push([id, icon || '▦', name || id]);
    return true;
  };

  const alle = (): Eintrag[] => LISTE;
  const eines = (id: string): Eintrag | null => alle().find(x => x[0] === id) || null;
  const name = (id: string): string => (eines(id) || [])[2] || id;
  const icon = (id: string): string => (eines(id) || [])[1] || '▦';
  const kennt = (id: string): boolean => !!eines(id);

  return { alle, eines, name, icon, kennt, melde, anzahl: () => LISTE.length };
})();
