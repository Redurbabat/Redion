/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/module.ts (npm run bauen:ts). */
/* ============================================================================
 * register/module.js — welche Bereiche es gibt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/module.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/module.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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

/* EIN ZWEITES FELD FÜR DAS ZEICHEN — `zeichen` neben `icon` (E272).
 *
 * `icon` trägt ein EMOJI. Das war richtig, solange nur die Seitenleiste und
 * das Mehr-Blatt es lasen: dort steht es in einer Zeile und darf bunt sein.
 *
 * Im Menüband geht es nicht. E202 hat die Emoji aus der Lernwelt entfernt
 * und den Grund aufgeschrieben: sie sehen auf jedem System anders aus,
 * tragen nicht die Farbe ihrer Zeile, und in einer Reihe gleich grosser
 * Strichzeichen fallen sie als Fremdkörper auf. Genau so sah der Reiter
 * „Gehen" im ersten Bild aus — dreizehn Emoji nebeneinander.
 *
 * `zeichen` nennt deshalb ein Strichzeichen aus `Register.symbole`. Wer
 * `icon` liest, bekommt weiter das Emoji; wer `zeichen` liest, das
 * gezeichnete. Kein Umbau, kein zweiter Katalog — dasselbe Register, ein
 * Feld mehr.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.module = (() => {

  const EINGEBAUT = [
    { id: 'editor',        name: 'Schreiben',      icon: '✎', zeichen: 'pencil',
      was: 'Seiten und Blöcke — der Teil, in dem man tippt.',
      /* `App.oeffneZuletzt` gibt es nicht — die zuletzt geöffnete Seite steht
         in `App.aktuelleSeite()`. Weil `App.oeffneZuletzt &&` davorstand, tat
         der Punkt „Schreiben" in der Modulübersicht nichts. */
      oeffnen: () => App.oeffne(App.aktuelleSeite()) },

    { id: 'datenbanken',   name: 'Datenbanken',    icon: '▦', zeichen: 'database',
      was: 'Tabellen, Ansichten, Formeln, Filter, Automationen.',
      oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.palette('datenbank') },

    { id: 'wissen',        name: 'Wissen',         icon: '🧠', zeichen: 'cards',
      was: 'Verweise, Graph, Schlagwörter, Karteikarten, Journal.',
      oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.lernen && Werkzeuge.lernen() },

    { id: 'ki',            name: 'KI',             icon: '✨', zeichen: 'sparkle',
      was: 'Modelle, Kontext, Agenten, Werkzeuge über MCP.',
      /* `KI.panel` gibt es nicht — das Fenster öffnet `App.kiPanel`. Weil hier
         `KI.panel &&` davorstand, tat der Punkt „KI" in der Modulübersicht
         schlicht nichts. */
      oeffnen: () => App.kiPanel() },

    { id: 'verbinden',     name: 'Verbinden',      icon: '🔗', zeichen: 'link',
      was: 'Konten, Kalender, Mail, Besprechungen, Wolke, Schnittstelle.',
      oeffnen: () => (typeof Verbindungen !== 'undefined') && Verbindungen.dialog() },

    { id: 'dateien',       name: 'Dateien',        icon: '📎', zeichen: 'clipboard',
      was: 'Ablage in Stücken, Einlesen, Ausgeben, fremde Formate.',
      oeffnen: () => (typeof Dateien !== 'undefined') && Dateien.dialog() },

    { id: 'einstellungen', name: 'Einstellungen',  icon: '⚙', zeichen: 'settings',
      was: 'Aussehen, Bereiche, Pflege, Erweiterungen.',
      oeffnen: () => (typeof Einstellungen !== 'undefined') && Einstellungen.oeffne() },

    { id: 'hilfe',         name: 'Hilfe',          icon: '?', zeichen: 'help',
      was: 'Rundgang, Tastenkürzel, Wissensseiten, Umsetzungsstand.',
      oeffnen: () => (typeof Rundgang !== 'undefined') && Rundgang.uebersicht() },

    /* --- Was hier bis zum 25. August fehlte (L51) -------------------------
       Sechs Module hingen ausschliesslich an `globalThis` und standen in
       keinem Register. Im Betrieb war das kein Fehler — es lief. Der Preis
       stand nur woanders: ein Modul ohne Eintrag ist für jede Übersicht
       unsichtbar, auch für die nächste Prüfung, die „alle Bereiche"
       durchgehen will. CLAUDE.md §5 Regel 2 meint genau das.

       `oeffnen` ist bei allen sechs ein GESCHÜTZTER Aufruf: fehlt das Modul,
       passiert nichts, und `Register.oeffne` schreibt es in den Reporter.
       Ein stiller Fehlschlag sähe aus wie ein toter Knopf (E118). */

    { id: 'lernwelt',      name: 'Lernen & Alltag', icon: '🎓', zeichen: 'today',
      was: 'Heute, Lernzentrale, Lernpfad, Fehler, Prüfungen, Schule, Uni, Arbeit.',
      oeffnen: () => (typeof Produktwelten !== 'undefined') && Produktwelten.lernen('heute') },

    { id: 'notizhefte',    name: 'Notizhefte',      icon: '📓', zeichen: 'book',
      was: 'Regal deiner Schreibhefte — öffnen und losschreiben (E264).',
      oeffnen: () => (typeof Notebook !== 'undefined') && Notebook.oeffnen() },

    { id: 'arbeitswelt',   name: 'Seiten & Wissen', icon: '📄', zeichen: 'pages',
      was: 'Bestand, Favoriten, zuletzt geöffnete Seiten und geteilte Ansicht in der Bibliothek.',
      oeffnen: () => (typeof Produktwelten !== 'undefined') && Produktwelten.workspace('uebersicht') },

    { id: 'lebensbereiche', name: 'Lebensbereiche', icon: '◎', zeichen: 'compass',
      was: 'Schule, Arbeit, Privat — dieselbe Seite darf in mehreren stehen, ohne Kopie.',
      /* KEIN EIGENER BILDSCHIRM, und der Eintrag darf das nicht behaupten.
         Ein Lebensbereich ist ein kleines Metafeld am vorhandenen Objekt
         (bereiche/wissen/lebensbereiche.ts), keine zweite Ablage. Der eine
         Ort, an dem man ihn wirklich anfasst, ist die Zuordnung zur offenen
         Seite — dieselbe, die im Seitenmenü unter „Lebensbereiche zuordnen“
         hängt. Hier stand vorher `workspace('uebersicht')`: derselbe Aufruf
         wie eine Zeile darüber. Auf dem Bildschirm änderte sich dann nichts,
         und ein Eintrag, der nichts ändert, ist der tote Knopf aus E118 mit
         einem anderen Namen. */
      oeffnen: () => {
        const id = (typeof App !== 'undefined' && App.aktuelleSeite) ? App.aktuelleSeite() : null;
        const seite = id ? Store.getBlock(id) : null;
        if (!seite || typeof Produktwelten === 'undefined') {
          if (typeof UI !== 'undefined')
            UI.toast('Lebensbereiche gehören zu einer Seite. Öffne zuerst eine Seite.');
          return;
        }
        Produktwelten.bereicheDialog(seite);
      } },

    { id: 'elektro',       name: 'Elektrotechnik', icon: '⚡', zeichen: 'bolt',
      was: 'Rechnungen mit Quellenangabe und ein geprüftes Grundlagen-Lernpaket.',
      /* Seit L65 die Elektro-Seite, nicht mehr der Rechner allein — beide
         Register müssen dasselbe Ziel nennen, sonst führen zwei Wege mit
         demselben Namen an zwei verschiedene Orte. */
      oeffnen: () => (typeof Elektrostart !== 'undefined')
        ? Elektrostart.oeffne()
        : (typeof Electrical !== 'undefined') && Electrical.open() },

    { id: 'erkennung',     name: 'Erfassen & Erkennen', icon: '📷', zeichen: 'camera',
      was: 'Kamera und Dateien in den Eingang; Text aus Bild, PDF und Handschrift ' +
           'über den mitgelieferten lokalen Dienst.',
      oeffnen: () => (typeof Recognition !== 'undefined') && Recognition.scan() },

    { id: 'zeitmesser',    name: 'Zeitmesser', icon: '⏱', zeichen: 'clock',
      was: 'Stoppuhr und Timer mit Dokumentbezug — Lernzeit messen statt schätzen (E268).',
      oeffnen: () => (typeof Zeitmesser !== 'undefined') && Zeitmesser.panel() },

    { id: 'dokumentmodus', name: 'Dokumentmodus',  icon: '📖', zeichen: 'library',
      was: 'Eine PDF- oder Blattseite gross, mit den Objekten daneben.',
      /* SAGT, WARUM ES NICHT GEHT, statt stumm nichts zu tun. `toggle`
         steigt ohne geeignete Seite wortlos aus — aus einer Modulübersicht
         aufgerufen wäre das genau der tote Knopf aus E118. */
      oeffnen: () => {
        const seite = (typeof App !== 'undefined' && App.aktuelleSeite)
          ? Store.getBlock(App.aktuelleSeite()) : null;
        if (typeof DocumentMode === 'undefined' || !seite || !DocumentMode.available(seite)) {
          if (typeof UI !== 'undefined')
            UI.toast('Der Dokumentmodus braucht eine Seite mit PDF-Seiten oder A4-Blättern.');
          return;
        }
        DocumentMode.toggle(seite, true);
      } }
  ];

  /** Ein Bereich: was er ist, und wie man ihn aufmacht. */
  type Bereich = {
    id: string; name: string; icon: string; was: string;
    oeffnen: () => unknown;
  };

  /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
  const LISTE: Bereich[] = EINGEBAUT.slice();

  const melde = (eintrag: unknown): boolean => {
    const e = eintrag as Bereich | null;
    if (!e || !e.id) return false;
    if (LISTE.some(x => x.id === e.id)) return false;
    LISTE.push(e);
    return true;
  };

  /**
   * Einen nachgemeldeten Bereich wieder abmelden.
   *
   * `melde` gibt es seit Langem, `nimmZurueck` nicht — und das fiel erst
   * auf, als eine Gegenprobe in `test272` §12 ein Fantasiemodul anlegte und
   * es nicht mehr loswurde. Es stand danach bis zum Ende des Laufs im
   * Reiter „Gehen" und tauchte in §15 als „Weg, der nichts tut" auf:
   * richtig gemessen, falscher Gegenstand.
   *
   * `Register.menueband` und `Register.kontext` können das beide. Ein
   * Register, aus dem man nichts zurücknehmen kann, zwingt jede Gegenprobe
   * dazu, ihren Dreck liegen zu lassen (E273).
   */
  const nimmZurueck = (id: unknown): boolean => {
    const i = LISTE.findIndex(x => x.id === id);
    if (i < 0) return false;
    LISTE.splice(i, 1);
    return true;
  };

  const alle = (): Bereich[] => LISTE;
  const eines = (id: unknown): Bereich | null => LISTE.find(x => x.id === id) || null;

  /**
   * Einen Bereich aufmachen.
   * Gibt es ihn nicht, passiert nichts — und es steht im Reporter, warum.
   * Ein stiller Fehlschlag hier sähe aus wie ein toter Knopf.
   */
  const oeffne = (id: unknown): boolean => {
    const m = eines(id);
    if (!m) {
      if (typeof Reporter !== 'undefined') Reporter.warn('Register', 'Bereich unbekannt: ' + id);
      return false;
    }
    try { m.oeffnen(); return true; }
    catch (e) {
      const grund = e instanceof Error ? e.message : String(e);
      if (typeof Reporter !== 'undefined') Reporter.error('Register', 'Bereich ' + id + ': ' + grund, e);
      return false;
    }
  };

  return { alle, eines, oeffne, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
