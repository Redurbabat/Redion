/* ============================================================================
 * register/module.js — welche Bereiche es gibt
 * ----------------------------------------------------------------------------
 * Ein Bereich ist ein Stück App mit eigener Aufgabe: Editor, Datenbanken,
 * Wissen, KI, Verbinden, Dateien, Einstellungen, Hilfe.
 *
 * Hier steht, welche es gibt und wie man sie aufmacht. Nicht was sie tun —
 * das steht in ihnen. Ein Register beschreibt.
 *
 * Die Regel dazu: **ein neuer Bereich = zwei Einträge.** Einer hier, einer in
 * `navigation.js`. Sonst nichts. Wer für einen neuen Bereich sieben Dateien
 * anfassen muss, baut irgendwann keinen mehr, sondern hängt ihn an einen
 * bestehenden — und so entstehen die 2700-Zeilen-Dateien.
 *
 * `oeffnen` ist bewusst ein Funktionsverweis und kein direkter Aufruf: die
 * Bereiche laden nach diesem Register, und ein Aufruf beim Anlegen wäre
 * eine Reihenfolgenfalle.
 * ==========================================================================*/

window.Register = window.Register || {};

Register.module = (() => {

  const EINGEBAUT = [
    { id: 'editor',        name: 'Schreiben',      icon: '✎',
      was: 'Seiten und Blöcke — der Teil, in dem man tippt.',
      oeffnen: () => (typeof App !== 'undefined') && App.oeffneZuletzt && App.oeffneZuletzt() },

    { id: 'datenbanken',   name: 'Datenbanken',    icon: '▦',
      was: 'Tabellen, Ansichten, Formeln, Filter, Automationen.',
      oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.palette('datenbank') },

    { id: 'wissen',        name: 'Wissen',         icon: '🧠',
      was: 'Verweise, Graph, Schlagwörter, Karteikarten, Journal.',
      oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.lernen && Werkzeuge.lernen() },

    { id: 'ki',            name: 'KI',             icon: '✨',
      was: 'Modelle, Kontext, Agenten, Werkzeuge über MCP.',
      oeffnen: () => (typeof KI !== 'undefined') && KI.panel && KI.panel() },

    { id: 'verbinden',     name: 'Verbinden',      icon: '🔗',
      was: 'Konten, Kalender, Mail, Besprechungen, Wolke, Schnittstelle.',
      oeffnen: () => (typeof Verbindungen !== 'undefined') && Verbindungen.dialog() },

    { id: 'dateien',       name: 'Dateien',        icon: '📎',
      was: 'Ablage in Stücken, Einlesen, Ausgeben, fremde Formate.',
      oeffnen: () => (typeof Dateien !== 'undefined') && Dateien.dialog() },

    { id: 'einstellungen', name: 'Einstellungen',  icon: '⚙',
      was: 'Aussehen, Bereiche, Pflege, Erweiterungen.',
      oeffnen: () => (typeof Einstellungen !== 'undefined') && Einstellungen.oeffne() },

    { id: 'hilfe',         name: 'Hilfe',          icon: '?',
      was: 'Rundgang, Tastenkürzel, Wissensseiten, Umsetzungsstand.',
      oeffnen: () => (typeof Rundgang !== 'undefined') && Rundgang.uebersicht() }
  ];

  /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
  const LISTE = EINGEBAUT.slice();

  const melde = (eintrag) => {
    if (!eintrag || !eintrag.id) return false;
    if (LISTE.some(x => x.id === eintrag.id)) return false;
    LISTE.push(eintrag);
    return true;
  };

  const alle = () => LISTE;
  const eines = (id) => LISTE.find(x => x.id === id) || null;

  /**
   * Einen Bereich aufmachen.
   * Gibt es ihn nicht, passiert nichts — und es steht im Reporter, warum.
   * Ein stiller Fehlschlag hier sähe aus wie ein toter Knopf.
   */
  const oeffne = (id) => {
    const m = eines(id);
    if (!m) {
      if (typeof Reporter !== 'undefined') Reporter.warn('Register', 'Bereich unbekannt: ' + id);
      return false;
    }
    try { m.oeffnen(); return true; }
    catch (e) {
      if (typeof Reporter !== 'undefined') Reporter.error('Register', 'Bereich ' + id + ': ' + e.message, e);
      return false;
    }
  };

  return { alle, eines, oeffne, melde, anzahl: () => LISTE.length };
})();
