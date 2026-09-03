/* ============================================================================
 * register/navigation.js — was in der Seitenleiste steht, und in welcher Folge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/navigation.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/navigation.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Seitenleiste ist die einzige Stelle, die jeder Bereich anfassen will.
 * Genau deshalb darf sie keiner anfassen: sonst hängt ihre Reihenfolge davon
 * ab, welche Datei zuletzt geladen wurde.
 *
 * WAS HIER STEHT, UND WAS NICHT. Hier stand bis zum 25. August der Satz
 * „Hier steht die Ordnung. Die Seitenleiste liest sie und zeichnet, was sie
 * findet — mehr nicht." Er war falsch. Nachgezählt: die Seitenleiste
 * zeichnet 45 Zeilen, dieses Register kannte 12, und gelesen wurde davon
 * genau ein Teil — `anPlatz('unten')`, gefiltert auf `vonAussen`.
 *
 * Ein Katalog, den niemand liest, wird still falsch. Der Eintrag `suche`
 * rief `Werkzeuge.palette()` auf, also das, was „Befehle" tut; `ki` stand
 * drin, obwohl die Seitenleiste ihn nirgends zeigt. Beides fiel niemandem
 * auf, weil beides nie ausgeführt wurde (E160).
 *
 * Heute gilt:
 *
 *     platz 'oben'    die neun Zeilen der obersten Gruppe. Das Aussehen
 *                     steht in index.html, die HANDLUNG hier — `schale.ts`
 *                     hängt sie über `knopfId` an. test222 §5 vergleicht
 *                     beide Listen Zeile für Zeile.
 *     platz 'fuss'    die festen Zeilen ganz unten. Wie 'oben': Markup in
 *                     index.html, Handlung hier, verbunden über `knopfId`.
 *     platz 'apps'    „Meine Apps". Die Seitenleiste zeichnet sie von hier;
 *                     der Eintrag trägt Zeichen, Namen, Hinweistext und
 *                     Handlung. test222 §6 vergleicht Liste und Bildschirm.
 *     platz 'baum'    die Überschriften des Baums.
 *     platz 'unten'   der Anhängepunkt für fremde Bereiche (`vonAussen`).
 *                     Die eingebauten unteren Zeilen zeichnet die
 *                     Seitenleiste weiter selbst; das steht in L51.
 *
 *     id        eindeutig
 *     name      was dasteht
 *     icon      ein Zeichen
 *     platz     'oben' | 'baum' | 'unten'
 *     rang      kleinere Zahl steht weiter oben
 *     zeigen()  false = Eintrag bleibt weg (z. B. ohne Konto)
 *     tun()     was beim Klick geschieht
 *
 * `zeigen` ist wichtiger, als es aussieht: ein Eintrag, der etwas verspricht,
 * das ohne Konto nicht geht, ist schlimmer als kein Eintrag.
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

Register.navigation = (() => {

  /* Gibt es dieses Modul? Zwei Wege, und der zweite ist der unschöne.
     Die neueren Module hängen sich an `window`; die älteren sind
     `const X = (() => …)()` auf oberster Ebene und stehen dort nicht. Für
     die bleibt nur `typeof` mit einem Namen, der erst zur Laufzeit
     feststeht. Verschwindet, sobald der letzte alte Bestand umgezogen ist. */
  const da = (name: string): boolean =>
    typeof (window as any)[name] !== 'undefined' ||
    (() => { try { return eval('typeof ' + name) !== 'undefined'; }
             catch { return false; } })();

  const EINGEBAUT = [
    /* Die oberste Gruppe, in der Folge, in der sie in index.html steht.
       `knopfId` ist der Knopf im Markup — `schale.ts` hängt `tun` daran.
       Wer hier eine Zeile ändert, ändert damit wirklich die Seitenleiste;
       wer sie in index.html ändert, ohne hier nachzuziehen, macht test222
       §5 rot. Das ist der ganze Zweck der Übung. */
    { id: 'suche',      name: 'Suchen',            icon: '🔍', zeichen: 'search', platz: 'oben',  rang: 10,
      knopfId: 'btn-search',    kuerzel: 'Strg P',
      /* Hier stand `Werkzeuge.palette()` — das ist „Befehle", eine Zeile
         tiefer. Die Suche hat ihr eigenes Fenster (E160). */
      tun: () => App.suche() },
    { id: 'befehle',    name: 'Befehle',           icon: '⌘', zeichen: 'command',  platz: 'oben',  rang: 20,
      knopfId: 'btn-cmd',       kuerzel: 'Strg ⇧ P',
      tun: () => Werkzeuge.palette() },
    { id: 'heute',      name: 'Heute',             icon: '☀️', zeichen: 'today', platz: 'oben',  rang: 30,
      knopfId: 'btn-home',      tun: () => Produktwelten.lernen('heute') },
    { id: 'lernzentrum',name: 'Lernzentrum',       icon: '🎓', zeichen: 'learn', platz: 'oben',  rang: 40,
      knopfId: 'btn-learning',  tun: () => Produktwelten.lernen('lernen') },
    /* ELEKTRO HATTE KEINE EIGENE ZEILE. Es ist eines der 14 Module, und
       zwar das grösste — Fachzeichen, Schaltplan, Simulation, Rechner,
       Formelheft, Prüfung. Wer hin wollte, musste über den Workspace oder
       das Lernzentrum. Beim Nachzählen für E218 fiel das auf: die
       Seitenleiste führte 37 Wege, und der meistbenutzte war keiner davon. */
    /* UND SEIT L65 FÜHRT ER AN EINEN ORT. Hier stand `Electrical.open()` —
       eine Überlagerung mit dem Rechner. Vier der fünf Wege dieser Gruppe
       ändern die Krume, der fünfte tat es als einziger nicht. Der Rechner
       ist jetzt einer der Knöpfe dieser Seite statt ihre Vordertür. */
    { id: 'elektro',    name: 'Elektrotechnik',    icon: '⚡', zeichen: 'bolt', platz: 'oben',  rang: 45,
      knopfId: 'btn-elektro',
      tun: () => { if (typeof Elektrostart !== 'undefined') Elektrostart.oeffne();
                   else if (typeof Electrical !== 'undefined') Electrical.open(); } },
    { id: 'workspace',  name: 'Arbeitsbereich',    icon: '🧱', zeichen: 'workspace', platz: 'oben',  rang: 50,
      knopfId: 'btn-workspace', tun: () => Produktwelten.workspace('start') },
    { id: 'bibliothekOben', name: 'Bibliothek',    icon: '📚', zeichen: 'library', platz: 'oben',  rang: 60,
      /* Zweimal „Bibliothek": hier die Zeile der obersten Gruppe, weiter
         unten der Anhängepunkt mit demselben Namen. Verschiedene Kennungen,
         weil `melde` über die Kennung dublettenfrei hält. */
      knopfId: 'btn-library',   tun: () => Produktwelten.bibliothek() },
    { id: 'aufgaben',   name: 'Aufgaben',          icon: '☑', zeichen: 'tasks',  platz: 'oben',  rang: 70,
      knopfId: 'btn-tasks',     tun: () => Produktwelten.aufgaben() },
    { id: 'posteingang',name: 'Posteingang',       icon: '📥', zeichen: 'inbox', platz: 'oben',  rang: 80,
      /* Und hier stand `Werkzeuge.meldungen()`. Der Knopf ruft seit jeher
         `Ansichten.posteingang()`; das eine ist die Meldungsliste, das
         andere der Posteingang. Auch das fiel nie auf (E160). */
      knopfId: 'btn-inbox',     tun: () => Ansichten.posteingang() },
    { id: 'neu',        name: 'Neue Seite',        icon: '✚', zeichen: 'plus',  platz: 'oben',  rang: 90,
      knopfId: 'btn-new',       kuerzel: 'Strg N',
      tun: () => App.neueSeite() },

    /* MEINE APPS — die zwanzig aus der Seitenleiste (E166).
       Sie standen als Datentabelle in `seitenleiste.ts`, direkt neben einer
       Kette aus zwanzig `if (a === '…')`. Zwei Listen für dieselben zwanzig
       Dinge, und wer eine Zeile hinzufügte, musste an beide denken — genau
       die Lage, die E160 eine Gruppe weiter oben aufgelöst hat.

       `hinweis` ist der Text, der beim Darüberfahren erscheint. Er gehört
       zum Eintrag und nicht zum Zeichner: wer die App beschreibt, beschreibt
       sie hier. */
    /* DER RANG LÄUFT DURCH, ER FÄNGT NICHT JE GRUPPE NEU AN (E206).
       Der erste Entwurf gab jeder Gruppe 10, 20, 30 … — und `anPlatz('apps')`
       sortiert nach `rang`, ohne die Gruppe zu kennen. Heraus kam eine Liste,
       in der erst alle Ersten jeder Gruppe standen, dann alle Zweiten: eine
       Reihenfolge, die auf dem Bildschirm nirgends vorkommt. test222 §6
       vergleicht Register und Bild und ging deshalb rot — zu Recht.

       Durchlaufend heisst: Registerreihenfolge IST Bildschirmreihenfolge,
       und die Gruppen sind nur die Schnitte darin. */
    { id: 'app-kalender', marke: 'kalender',  name: 'Kalender',        icon: '📅', zeichen: 'calendar', platz: 'apps', gruppe: 'planen', rang: 10,
      hinweis: 'Termine aus allen Quellen',                tun: () => Kalender.dialog() },
    { id: 'app-tagesplan', marke: 'tagesplan', name: 'Tagesplan',      icon: '☀', zeichen: 'clipboard',  platz: 'apps', gruppe: 'planen', rang: 20,
      hinweis: 'Was heute ansteht',                        tun: () => Plan.tagesplan() },
    { id: 'app-woche', marke: 'woche',     name: 'Wochenrückblick', icon: '📅', zeichen: 'chart', platz: 'apps', gruppe: 'planen', rang: 30,
      hinweis: 'Was lief, was blieb liegen',               tun: () => Plan.wochenrueckblick() },
    { id: 'app-spaeter', marke: 'spaeter',   name: 'Zurückgestellt',  icon: '⏰', zeichen: 'flag', platz: 'apps', gruppe: 'planen', rang: 40,
      hinweis: 'Was später wieder hochkommt',              tun: () => Plan.uebersicht() },
    /* NICHT dasselbe wie die Zeile „Aufgaben" in der obersten Gruppe.
       Die ruft `Produktwelten.aufgaben()`, also `workspace('aufgaben')`;
       diese hier ruft `Bibliothek.aufgaben()`. Zwei Ansichten auf zwei
       verschiedene Fragen — beim Aufräumen (E206) sah es nach einer
       Doppelung aus und war keine. */
    { id: 'app-aufgaben', marke: 'aufgaben',  name: 'Meine Aufgaben',  icon: '☑', zeichen: 'boxChecked',  platz: 'apps', gruppe: 'planen', rang: 50,
      hinweis: 'Was dir zugewiesen ist',                   tun: () => Bibliothek.aufgaben() },

    /* ZURÜCKGEHOLT — ES WAR KEINE DOPPELUNG (E207).
       E206 hat diesen Eintrag entfernt, weil in der obersten Gruppe eine
       Zeile „Bibliothek" steht. Beim Nachlesen der Aufrufe stimmte das auch
       — nur habe ich EINE Ebene zu früh aufgehört:

           app-bib      → `Bibliothek.oeffne()`
                          die Seitenübersicht mit Reitern und Spalten
           btn-library  → `Produktwelten.bibliothek()` → `workspace('bibliothek')`
                          die Bibliothek der Arbeitswelt

       Zwei Namen, zwei Ansichten. `test33` fand es: es klickte auf den
       ersetzten Weg und landete im Workspace — Krume „🧱 Workspace",
       null Reiter, null Zeilen.

       Der Fehler ist eine Lehre und keine Panne: ich habe nach dem NAMEN der
       aufgerufenen Funktion verglichen und nicht danach, wohin sie führt.
       Bei `suche`/`inbox` reichte das, weil dort wörtlich derselbe Aufruf
       steht; hier heissen beide Wege „Bibliothek" und meinen Verschiedenes.
       Redurs Bedingung war „nichts löschen", und das hier war ein Löschen. */
    /* Rang 52: nach „Meine Aufgaben" (50), vor „Alle Seiten" (55) — die
       Reihe läuft durch (E206), Zehner sind keine Pflicht. */
    { id: 'app-notizhefte', marke: 'notizhefte', name: 'Notizhefte', icon: '📓', zeichen: 'book', platz: 'apps', gruppe: 'daten', rang: 52,
      hinweis: 'Deine Schreibhefte, sofort schreibbereit',
      tun: () => (typeof Notebook !== 'undefined') && Notebook.oeffnen() },
    { id: 'app-bib', marke: 'bib',       name: 'Alle Seiten',     icon: '📚', zeichen: 'page', platz: 'apps', gruppe: 'daten', rang: 55,
      hinweis: 'Jede Seite, mit Reitern und Spalten',      tun: () => Bibliothek.oeffne() },
    { id: 'app-modell', marke: 'modell',    name: 'Datenmodell',     icon: '🗺', zeichen: 'database', platz: 'apps', gruppe: 'daten', rang: 60,
      hinweis: 'Alle Datenbanken und ihre Verknüpfungen',  tun: () => Schema.ansicht() },
    { id: 'app-kennzahl', marke: 'kennzahl',  name: 'Kennzahlen',      icon: '📊', zeichen: 'chart', platz: 'apps', gruppe: 'daten', rang: 70,
      hinweis: 'Zahlen aus mehreren Datenbanken',          tun: () => Schema.tafel() },
    { id: 'app-eingang', marke: 'eingang',   name: 'Was hereinkommt', icon: '📨', zeichen: 'inbox', platz: 'apps', gruppe: 'daten', rang: 80,
      hinweis: 'Daten von aussen abholen und einwerfen',   tun: () => Eingang.dialog() },
    { id: 'app-markt', marke: 'markt',     name: 'Marktplatz',      icon: '🛍', zeichen: 'puzzle', platz: 'apps', gruppe: 'daten', rang: 90,
      hinweis: 'Fertige Vorlagen',                         tun: () => Werkzeuge.vorlagen() },

    { id: 'app-aussehen', marke: 'aussehen',  name: 'Aussehen',        icon: '🎨', zeichen: 'sun', platz: 'apps', gruppe: 'einrichten', rang: 100,
      hinweis: 'Farben, Schrift und Tastenkürzel',         tun: () => Aussehen.dialog() },
    { id: 'app-tempo', marke: 'tempo',     name: 'Tempo',           icon: '⏱', zeichen: 'rocket', platz: 'apps', gruppe: 'einrichten', rang: 110,
      hinweis: 'Wie schnell gezeichnet und gerechnet wird', tun: () => Tempo.dialog() },
    { id: 'app-krypto', marke: 'krypto',    name: 'Passwort',        icon: '🔐', zeichen: 'lock', platz: 'apps', gruppe: 'einrichten', rang: 120,
      hinweis: 'Verschlüsselte Sicherung und Sperre',      tun: () => Krypto.dialog() },
    { id: 'app-erweitern', marke: 'erweitern', name: 'Erweiterungen',   icon: '🧩', zeichen: 'puzzle', platz: 'apps', gruppe: 'einrichten', rang: 130,
      hinweis: 'Eigene Befehle, Knöpfe und Formeln',       tun: () => Erweiterung.dialog() },
    { id: 'app-pwa', marke: 'pwa',       name: 'App installieren', icon: '📱', zeichen: 'download', platz: 'apps', gruppe: 'einrichten', rang: 140,
      hinweis: 'Auf dem Telefon oder Rechner ablegen',     tun: () => PWA.installieren() },

    /* NICHT die Seite „Notion-Wissen" im Baum. Das hier ist das Modul mit
       den acht Teilen; die Seite ist eine Seite. Auch das sah beim
       Aufräumen nach einer Doppelung aus (E206). */
    { id: 'app-wissen', marke: 'wissen',    name: 'Notion-Wissen',   icon: '📖', zeichen: 'book', platz: 'apps', gruppe: 'hilfe', rang: 150,
      hinweis: 'Alles über Notion und Redion, in acht Teilen', tun: () => Wissen.oeffnen() },
    { id: 'app-kann', marke: 'kann',      name: 'Was Redion kann', icon: '⭐', zeichen: 'compass', platz: 'apps', gruppe: 'hilfe', rang: 160,
      hinweis: 'Alles auf einen Blick, mit Führung',       tun: () => Rundgang.uebersicht() },
    { id: 'app-pflege', marke: 'pflege',    name: 'Erste Hilfe',     icon: '🧰', zeichen: 'shield', platz: 'apps', gruppe: 'hilfe', rang: 170,
      hinweis: 'Prüfen, reparieren, sichern',              tun: () => Pflege.ersteHilfe() },

    /* DREI EINTRÄGE STANDEN HIER UND STEHEN WOANDERS SCHON (E206).
       Redur: „Links habe ich so viel Bereiche, reduziere es — aber wichtig
       nichts löschen." Gelöscht ist auch nichts: alle drei Ziele bleiben,
       nur eben je einmal statt zweimal.

           app-bib     „Bibliothek"    →  `Bibliothek.oeffne()`
                                          = btn-library, oberste Gruppe
           app-papier  „Papierkorb"    →  `App.papierkorb()`
                                          = btn-trash, im Fuss
           app-hilfe   „Hilfe"         →  `Werkzeuge.tastenkuerzel()`
                                          = btn-hilfe, im Fuss

       Wer eine davon über `Register.navigation.eines('app-bib')` gesucht
       hat, findet sie nicht mehr — das ist der einzige Bruch, und er trifft
       nur Code, den es hier nicht gibt. */

    { id: 'favoriten',  name: 'Favoriten',         icon: '★', zeichen: 'star',  platz: 'baum',  rang: 10 },
    { id: 'seiten',     name: 'Seiten',            icon: '📄', zeichen: 'page', platz: 'baum',  rang: 20 },
    { id: 'geteilt',    name: 'Geteilt',           icon: '👥', zeichen: 'share', platz: 'baum',  rang: 30,
      zeigen: () => da('Wolke') && Wolke.angemeldet() },

    /* DER FUSS DER SEITENLEISTE (E167). Drei Zeilen stehen dort fest in
       index.html; zwei davon passen ohne Umstände hierher — Aussehen im
       Markup, Handlung im Register, verbunden über `knopfId`, genau wie
       oben.

       `btn-import` fehlt bewusst und nicht aus Vergesslichkeit: sein Menü
       braucht das Klickereignis, um sich an der richtigen Stelle zu öffnen,
       und die fünfundzwanzig Zeilen Menüaufbau gehören in die Schale, nicht
       in einen Katalog der Seitenleiste.

       Eigener Platz, nicht `oben`: die drei stehen im Fuss und nicht in
       `.side-nav`. Ein gemeinsamer Platz für beides machte den Vergleich in
       test222 §5 falsch, ohne dass sich am Bildschirm etwas ändert — und
       eine Prüfung, die aus dem falschen Grund rot wird, ist so wenig wert
       wie eine, die aus dem falschen Grund grün ist. */
    { id: 'papierkorbFuss', name: 'Papierkorb',     icon: '🗑', zeichen: 'trash', platz: 'fuss', rang: 20,
      knopfId: 'btn-trash',  tun: () => App.papierkorb() },
    { id: 'tastenkuerzel',  name: 'Tastenkürzel',   icon: '?', zeichen: 'command',  platz: 'fuss', rang: 30,
      knopfId: 'btn-hilfe',  kuerzel: 'Strg /',
      tun: () => Werkzeuge.tastenkuerzel() },

    { id: 'vorlagen',   name: 'Vorlagen',          icon: '🧩', zeichen: 'puzzle', platz: 'unten', rang: 10,
      tun: () => Galerie.oeffne() },
    { id: 'bibliothek', name: 'Bibliothek',        icon: '📚', zeichen: 'library', platz: 'unten', rang: 20,
      tun: () => Bibliothek.oeffne() },
    { id: 'papierkorb', name: 'Papierkorb',        icon: '🗑', zeichen: 'trash', platz: 'unten', rang: 30,
      tun: () => App.papierkorb() },
    { id: 'einstellungen', name: 'Einstellungen',  icon: '⚙', zeichen: 'settings',  platz: 'unten', rang: 40,
      tun: () => Einstellungen.oeffne() },
    { id: 'hilfe',      name: 'Was Redion kann',   icon: '?', zeichen: 'help',  platz: 'unten', rang: 50,
      tun: () => Rundgang.uebersicht() }
  ];

  /**
   * Ein Eintrag der Seitenleiste.
   *
   * `tun` fehlt bei den Abschnitten (`favoriten`, `seiten`, `geteilt`) —
   * die sind Überschriften und nicht Knöpfe. Genau deshalb steht das
   * Fragezeichen da und nicht bei den anderen Feldern.
   */
  type Eintrag = {
    id: string; name: string; icon: string;
    platz: string; rang: number;
    tun?: () => void;
    zeigen?: () => boolean;
    vonAussen?: boolean;
    /** Der Knopf im Markup, an den `schale.ts` `tun` hängt. Nur oben. */
    knopfId?: string;
    /** Was in der grauen Spalte rechts steht, z. B. „Strg P". */
    kuerzel?: string;
    /** Der Text beim Darüberfahren. Nur bei „Meine Apps" gebraucht. */
    hinweis?: string;
    /**
     * Die Untergruppe innerhalb von „Meine Apps" (E206).
     *
     * Zwanzig gleichrangige Zeilen untereinander sind keine Liste, sondern
     * eine Wand: man liest sie nicht, man sucht darin. Vier Gruppen mit
     * drei bis fünf Zeilen liest man. Die Namen stehen in `APP_GRUPPEN`
     * in `seitenleiste.ts`; ein Eintrag ohne `gruppe` landet unten unter
     * „Sonstiges" und geht damit nicht verloren.
     */
    gruppe?: string;
    /**
     * Der Wert von `data-app` am gezeichneten Knopf.
     *
     * WARUM NICHT EINFACH DIE KENNUNG. Weil die Kennungen im Register
     * eindeutig sein müssen und `bibliothek`, `aufgaben` und `papierkorb`
     * dort schon vergeben sind. E166 hat die Apps deshalb `app-bib`,
     * `app-aufgaben` … genannt — und damit ohne Not den Wert im Markup
     * mitgeändert. Der volle Prüflauf fand es: drei Zeilen in test33 und
     * test61 fassen die Knöpfe über `[data-app="bib"]` an.
     *
     * Der Wert ist eine Adresse nach aussen. Eigene Erweiterungen und
     * eigenes CSS dürfen darauf zeigen, und dann bricht ein Umbenennen
     * etwas, das mit dem Umbau nichts zu tun hat. Also bleibt er, wie er
     * war, und die Registerkennung darf daneben heissen, wie sie mag.
     */
    marke?: string;
  };

  const LISTE: Eintrag[] = EINGEBAUT.slice();

  /**
   * Einen Eintrag anmelden.
   * `vonAussen` merkt sich, dass er nicht eingebaut ist — die Seitenleiste
   * zeichnet ihre eingebauten Abschnitte selbst und hängt nur das an, was
   * von aussen dazukam. Ohne diese Unterscheidung stünde jeder Eintrag
   * zweimal da.
   */
  const melde = (eintrag: unknown): boolean => {
    const e = eintrag as Eintrag | null;
    if (!e || !e.id) return false;
    if (LISTE.some(x => x.id === e.id)) return false;
    LISTE.push(Object.assign({ vonAussen: true }, e));
    return true;
  };

  const nimmZurueck = (id: unknown): boolean => {
    const i = LISTE.findIndex(x => x.id === id);
    if (i < 0) return false;
    LISTE.splice(i, 1);
    return true;
  };

  const alle = (): Eintrag[] => LISTE;

  /** Was gehört an diesen Platz, in der richtigen Folge? */
  const anPlatz = (platz: string): Eintrag[] => LISTE
    .filter(x => x.platz === platz)
    .filter(x => !x.zeigen || (() => { try { return !!x.zeigen!(); } catch { return false; } })())
    .sort((a, b) => (a.rang || 100) - (b.rang || 100));

  const eines = (id: unknown): Eintrag | null => LISTE.find(x => x.id === id) || null;

  return { alle, anPlatz, eines, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
