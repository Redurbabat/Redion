/* ============================================================================
 * register/menueband.js — das Menüband: Start, Einfügen, Zeichnen …
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/menueband.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/register/menueband.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WAS DAS MENÜBAND IST
 *
 * Eine Reihe Reiter über der Seite — Start, Einfügen, Zeichnen, Werkzeuge,
 * Elektro, Ansicht — und unter dem gewählten Reiter die Knöpfe, gruppiert.
 * Das Muster kennt jeder aus Textprogrammen; es ist deshalb hier, weil Redur
 * es ausdrücklich so wollte.
 *
 * WARUM ES EIN REGISTER IST UND KEINE ZEICHENDATEI
 *
 * CLAUDE.md §8, Regel 3: neue Dinge sind Register-Objekte. Ein Menüband, das
 * seine Knöpfe selbst kennt, ist der Anfang genau der Datei, vor der §5 warnt
 * — eine, in der jeder Bereich ein bisschen mitschreibt. Hier steht der
 * KATALOG; gezeichnet wird in `schale/aufbau/menueband.ts`.
 *
 * DIE WICHTIGSTE REGEL DIESER DATEI
 *
 * Kein Eintrag darf etwas Neues tun. Jeder ruft eine Funktion, die es schon
 * gibt und die schon geprüft ist. Ein Menüband ist eine ZWEITE ANSICHT auf
 * das, was Redion kann — keine zweite Fassung davon. Wo hier eine eigene
 * Rechnung stünde, liefe sie irgendwann von der ersten weg, und zwar still.
 *
 * Deshalb ist der Reiter „Einfügen" auch nicht aufgezählt, sondern kommt aus
 * `Register.bloecke` — dieselbe Liste, aus der sich das Slash-Menü bedient.
 * Eine neue Blockart erscheint dort von selbst, ohne dass jemand hier etwas
 * nachträgt. Ein zweiter Katalog wäre nach der dritten neuen Blockart falsch.
 *
 * `zeigen()` VERHINDERT DIE HÄUFIGSTE ENTTÄUSCHUNG
 *
 * Wie bei `register/befehle.ts`: ein Eintrag, dessen Modul fehlt, kommt gar
 * nicht erst in die Liste. Ein Knopf, der dasteht und beim Klick sagt, dass
 * er hier nicht geht, ist schlimmer als einer, den es nicht gibt — und in der
 * Einzeldatei oder bei einem nicht geladenen Bereich ist genau das der Fall.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.menueband = (() => {

  /** Ein Eintrag im Band. */
  type BandEintrag = {
    /** Kennung des Reiters, unter dem er steht. */
    reiter: string;
    /** Überschrift der Gruppe innerhalb des Reiters. */
    gruppe: string;
    id: string;
    name: string;
    /** Name im Symbolregister, ODER ein Textzeichen wie „H₁" bzw. „B". */
    zeichen: string;
    /** Tastenkürzel, wenn es eines gibt — steht als Hinweis am Knopf. */
    kurz?: string;
    /** Ein Satz für den Mauszeiger und für Vorleseprogramme (§38). */
    hinweis?: string;
    /** Grosse Kachel statt kleinem Knopf — für das Wichtigste einer Gruppe. */
    gross?: boolean;
    /** true = dieser Knopf ist gerade AN (z. B. das gewählte Werkzeug). */
    an?: () => boolean;
    /**
     * Eine PROBE statt eines Zeichens — ein Farbtupfer oder ein Strich in
     * seiner wirklichen Stärke.
     *
     * Ein Symbolname kann keine Farbe tragen und keine Dicke. „Blau" als
     * Wort neben einem grauen Zeichen wäre die Farbe nur behauptet; §38
     * verlangt umgekehrt, dass sie nicht NUR über Farbe geht — deshalb hat
     * jeder dieser Knöpfe zusätzlich seinen Namen darunter.
     */
    probe?: { farbe?: string; dicke?: number };
    tun: () => void;
    /** false = kommt gar nicht erst in die Liste. */
    zeigen?: () => boolean;
  };

  type BandReiter = { id: string; name: string; zeichen: string };

  /* ======================================================================== *
   * DIE REITER
   * ======================================================================== */

  /* ACHT REITER SEIT E272, und zwei Dinge daran brauchen eine Erklärung.
   *
   * „ELEKTRO" IST NICHT MEHR DABEI — die acht Einträge sehr wohl.
   * Redur hat entschieden: kein eigener Elektro-Reiter, wie im Entwurf.
   * Die Einträge behalten trotzdem `reiter: 'elektro'`, denn
   * `bereiche/elektro/start.ts:64-66` liest daraus seine acht Kacheln.
   * Wer statt dieser Liste das Feld ändert, leert die Elektro-Startseite —
   * und kein anderer Lauf merkt es. test272 §5 hält genau das fest.
   * Sichtbar sind sie über die Elektro-Seite selbst und ab Phase F über die
   * Kontextkante des Bereichs.
   *
   * „WERKZEUGE" GIBT ES NICHT MEHR. Der Reiter war eine Restekiste — vier
   * Gruppen, die nichts miteinander zu tun hatten („Schreiben",
   * „Wiederfinden", „Lernen", „Weiteres"). Seine elf Einträge stehen jetzt
   * dort, wo man sie suchen würde; die Umzugsliste steht in
   * doku/PREMIUM-SHELL-MATRIX.md, R6.
   *
   * „GEHEN" IST HIER SCHON EINGETRAGEN, hat aber vorerst nur die sechs
   * Einträge, die aus „Werkzeuge" kommen. `reiter()` zeigt nur Reiter, die
   * etwas zu zeigen haben — ein leerer Reiter verschwände von selbst. Die
   * volle Fassung aus `Register.module` und `Register.navigation` kommt in
   * Phase E. */
  /* „GEHEN" STEHT HIER NICHT MEHR (E391, Audit F02).
   *
   * Der Reiter zeigte, wohin man geht. Seit E388 stehen die Orte in der
   * linken Leiste, und zwei Wege zum selben Ziel sind genau der Befund des
   * Prüfberichts: „vier Navigationslogiken nebeneinander". Redur hat
   * entschieden: das Menüband trägt nur noch dokumentbezogene Werkzeuge.
   *
   * DIE EINTRÄGE BLEIBEN, nur der Reiter geht. Sie tragen weiterhin
   * `reiter: 'gehen'` — das ist ihre Ablage im Register, nicht ihre
   * Anzeige —, und `orte()` liefert sie unverändert an die Kante. Wer sie
   * hier löschte, nähme der linken Leiste ihre Liste weg.
   *
   * `reiter()` zeigt ohnehin nur, was in REITER steht; ein Eintrag ohne
   * Reiter verschwindet also von selbst aus dem Band und bleibt dem
   * Register erhalten. Genau dafür war die Trennung da. */
  const REITER: BandReiter[] = [
    { id: 'start',       name: 'Start',      zeichen: 'pencil' },
    { id: 'einfuegen',   name: 'Einfügen',   zeichen: 'plus' },
    { id: 'zeichnen',    name: 'Zeichnen',   zeichen: 'page' },
    { id: 'verlauf',     name: 'Verlauf',    zeichen: 'history' },
    { id: 'ueberpruefen', name: 'Überprüfen', zeichen: 'search' },
    { id: 'ansicht',     name: 'Ansicht',    zeichen: 'sun' },
    { id: 'hilfe',       name: 'Hilfe',      zeichen: 'help' }
  ];

  /* ======================================================================== *
   * HILFEN
   * ======================================================================== */

  /**
   * Kann dieses Modul das?
   *
   * Der Aufrufer schreibt den Namen HIN — `kann(() => Werkzeuge.journal)` —
   * statt ihn als Zeichenkette zu übergeben. Das ist Absicht: eine
   * Zeichenkette müsste zur Laufzeit nachgeschlagen werden, und der einzige
   * Weg dahin wäre `eval`. Das ist in Redion verboten (§20), und der erste
   * Entwurf dieser Datei hat es trotzdem getan.
   *
   * Fehlt das Modul ganz, wirft der Zugriff einen ReferenceError: mit
   * `module: none` sind die Module gewöhnliche Konstanten im Skript-Bereich
   * und hängen NICHT am Fenster. (`(globalThis as any).Store` war beim
   * Vorschau-Helfer deshalb immer `undefined`, und die Vorschau blieb still
   * leer — E207.) Der Fehler wird gefangen und heisst dann schlicht „nein".
   */
  const kann = (griff: () => unknown): boolean => {
    try { return typeof griff() === 'function'; } catch { return false; }
  };

  /**
   * Die offene Seite als Block.
   *
   * Sechs Werkzeuge nehmen sie als Parameter — `versionen(p)`, `sperren(p)`,
   * `praesentation(p)`, `drucken(p)`, `quelltext(p)`, `htmlExport(p)`. Der
   * erste Entwurf rief sie ohne Argument; der Typprüfer hat es gefunden,
   * bevor daraus sechs Knöpfe wurden, die still nichts tun.
   *
   * `null` heisst „gerade keine Seite offen" — dann steht der Knopf auch
   * nicht da, siehe `seiteDa`.
   */
  const seiteJetzt = (): any => {
    try {
      const id = App.aktuelleSeite();
      return id ? Store.getBlock(id) : null;
    } catch { return null; }
  };

  /** Ein Knopf, der eine offene Seite braucht, wartet auf eine. */
  const seiteDa = (griff: () => unknown): boolean => kann(griff) && !!seiteJetzt();

  /* ======================================================================== *
   * START — was man mit dem Text macht
   * ======================================================================== */

  /* Die Blockarten, die als „Absatzart" gelten. Die Kennungen sind dieselben
     wie in `Register.bloecke`; `Blocks.einfuegenAmEnde` nimmt sie direkt. */
  const ABSATZARTEN = ['text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number', 'quote', 'callout'];

  const startEintraege = (): BandEintrag[] => {
    const aus: BandEintrag[] = [];

    /* Absatzarten — aus dem Blockregister, damit Name und Zeichen dieselben
       sind wie im Slash-Menü. Ein eigener Text hier liefe davon weg. */
    if (Register?.bloecke?.eines) {
      for (const id of ABSATZARTEN) {
        const b = Register.bloecke?.eines?.(id);
        if (!b) continue;
        aus.push({
          reiter: 'start', gruppe: 'Absatz', id: 'abs-' + id,
          name: b.name, zeichen: b.icon || '¶', ...(b.kurz ? { kurz: b.kurz } : {}),
          hinweis: b.name + ' einfügen',
          tun: () => Blocks.einfuegenAmEnde(id),
          zeigen: () => kann(() => Blocks.einfuegenAmEnde)
        });
      }
    }

    /* Auszeichnung. `Auswahl.umschliesse` setzt die Markdown-Marken um das,
       was markiert ist — dieselbe Funktion, die die Auswahlleiste ruft.
       Ohne Markierung tut sie nichts, und das ist richtig so: sie sagt es
       über die Leiste, nicht über einen zweiten Weg. */
    const marken: Array<[string, string, string, string]> = [
      ['fett',    'Fett',           'B',  '**'],
      ['kursiv',  'Kursiv',         'I',  '*'],
      ['durch',   'Durchgestrichen', 'S', '~~'],
      ['code',    'Code',           '‹›', '`']
    ];
    for (const [id, name, zeichen, marke] of marken) {
      aus.push({
        reiter: 'start', gruppe: 'Schrift', id, name, zeichen,
        hinweis: name + ' — wirkt auf das, was markiert ist',
        tun: () => Auswahl.umschliesse(marke),
        zeigen: () => kann(() => Auswahl.umschliesse)
      });
    }
    aus.push({
      reiter: 'start', gruppe: 'Schrift', id: 'link', name: 'Verweis', zeichen: 'link',
      kurz: 'Strg K', hinweis: 'Markierten Text zu einem Verweis machen',
      tun: () => Auswahl.linkSetzen(),
      zeigen: () => kann(() => Auswahl.linkSetzen)
    });

    /* SUCHEN UND BEFEHLE STEHEN HIER NICHT.

       Sie standen kurz als eigene Gruppe „Finden" im Reiter „Start", mit der
       Begründung, ein Menüband dürfe wiederholen, was anderswo steht. Die
       Messung sagt etwas anderes: mit ihnen ist „Start" 1185 px breit, und
       in einem 1400 px breiten Fenster (Seitenleiste ab) bleiben 1160 —
       das Band brach auf zwei Zeilen um und wurde 221 px hoch statt 137.

       Zwei Knöpfe, die es oben in der Kopfzeile („Suchen in Redion …",
       Strg P) und links in der Seitenleiste („Suchen", „Befehle") schon
       gibt, sind das nicht wert. Sie verdrängten die Zeile für etwas, das
       woanders zweimal steht. */

    return aus;
  };

  /* ======================================================================== *
   * EINFÜGEN — kommt vollständig aus dem Blockregister
   * ======================================================================== */

  /* Die Reihenfolge der Gruppen im Band. Was `Register.bloecke` sonst noch
     kennt, hängt sich hinten an — eine neue Gruppe verschwindet also nicht,
     sie steht nur nicht vorne. */
  const GRUPPEN_FOLGE = ['Grundlegend', 'Medien', 'Datenbank', 'Wissen', 'Erweitert', 'KI'];

  /**
   * DIE DREI SLASH-AKTIONEN, DIE OHNE SCHREIBZEIGER GEHEN (E215/L63).
   *
   * Welche das sind, entscheidet der Editor über `Blocks.AM_ENDE` — hier
   * steht keine zweite Liste. Wer dort eine vierte einträgt, bekommt sie
   * hier ohne Zutun; wer eine streicht, verliert auch den Knopf. Genau das
   * ist der Zweck eines Katalogs.
   *
   * Namen und Zeichen kommen aus `Register.bloecke`, wo die Slash-Einträge
   * ohnehin stehen. „Person oder Seite erwähnen" ist für eine Kachel zu
   * lang; das Register kennt es unter diesem Namen, und für den Knopf wird
   * daraus „Erwähnung" — der ganze Name bleibt im Hinweis.
   */
  const KURZNAME: Record<string, string> = {
    mention: 'Erwähnung', emoji: 'Emoji'
  };
  /* Der Registername „Person oder Seite erwähnen" verschweigt, dass dasselbe
     Menü auch „heute", „morgen" und „Datum wählen …" führt. Wer ein Datum
     sucht, findet den Knopf sonst nicht. */
  const LANGNAME: Record<string, string> = {
    mention: 'Seite, Person oder Datum einfügen'
  };

  const imTextEintraege = (): BandEintrag[] => {
    let welche: string[] = [];
    try { welche = [...(Blocks.AM_ENDE ?? [])]; } catch { welche = []; }
    if (!welche.length || !Register?.bloecke?.alle) return [];
    const nachAktion = new Map<string, any>();
    for (const b of Register.bloecke.alle() as any[])
      if (b && b.aktion) nachAktion.set(String(b.aktion), b);
    return welche
      .map(was => {
        const b = nachAktion.get(was);
        if (!b) return null;
        return {
          reiter: 'einfuegen', gruppe: 'Im Text', id: 'akt-' + was,
          name: KURZNAME[was] ?? String(b.name || was),
          zeichen: String(b.zeichen || b.icon || '▫'),
          hinweis: (LANGNAME[was] ?? String(b.name || was)) + ' — hängt sich ans Ende der Seite',
          tun: () => { Blocks.aktionAmEnde(was); },
          zeigen: () => kann(() => Blocks.aktionAmEnde) && !!seiteJetzt()
        } as BandEintrag;
      })
      .filter((x): x is BandEintrag => x !== null);
  };

  const einfuegenEintraege = (): BandEintrag[] => {
    if (!Register?.bloecke?.alle) return [];
    /* `aktion` trennt die echten Blockarten von den Slash-BEFEHLEN
       („Umwandeln in …", „Duplizieren", „Erwähnen"). Die meisten brauchen
       den Schreibzeiger und den Block darunter — `Blocks.slashAktion(ct,
       block, was)` — und beides hat ein Knopf im Band nicht. Sie stehen
       deshalb nicht hier, sondern weiterhin im Slash-Menü.

       Drei von ihnen gehen inzwischen doch: „Erwähnung", „Datum" und
       „Emoji" fügen etwas EIN, statt an einem bestimmten Block zu drehen.
       Für sie hängt `Blocks.aktionAmEnde` einen leeren Textblock ans Ende
       und schreibt dort das Auslösezeichen (E215/L63). Welche das sind,
       sagt `Blocks.AM_ENDE` — nicht eine Liste hier. */
    const bloecke = (Register.bloecke.alle() as any[]).filter(b => b && b.id && !b.aktion);
    const rang = (g: string) => {
      const i = GRUPPEN_FOLGE.indexOf(g);
      return i < 0 ? GRUPPEN_FOLGE.length : i;
    };
    return bloecke
      .slice()
      .sort((a, b) => rang(a.gruppe) - rang(b.gruppe))
      /* Der Rückgabetyp steht ausdrücklich da: ohne ihn schliesst der
         Typprüfer aus dem Literal einen engeren Typ (`hinweis` als PFLICHT,
         weil es hier immer gesetzt wird) und lehnt danach das `concat` mit
         echten `BandEintrag` ab, bei denen es freiwillig ist. */
      .map((b): BandEintrag => ({
        reiter: 'einfuegen', gruppe: String(b.gruppe || 'Weiteres'),
        id: 'blk-' + b.id, name: String(b.name || b.id),
        /* `zeichen` vor `icon`: im Band stehen gezeichnete Striche, und
           ein Emoji fällt dazwischen heraus — 🖼 fehlte der Schrift sogar
           ganz. Welcher Block welches Symbol bekommt, sagt das Register
           (E273); wer keines nennt, behält sein Schriftzeichen. */
        zeichen: String(b.zeichen || b.icon || '▫'),
        ...(b.kurz ? { kurz: String(b.kurz) } : {}),
        hinweis: String(b.name || b.id) + ' einfügen',
        tun: () => Blocks.einfuegenAmEnde(b.id),
        zeigen: () => kann(() => Blocks.einfuegenAmEnde)
      }))
      .concat(imTextEintraege());
  };

  /* ======================================================================== *
   * ZEICHNEN — Blatt, Whiteboard, Plan, Kamera
   * ======================================================================== */

  /* DIE ECHTEN ZEICHENWERKZEUGE (E212, L64).

     Sie standen nicht hier, und das war kein Versehen: ein Knopf oben muss
     wissen, AUF WELCHE Fläche er wirkt, und auf einer Seite können mehrere
     Blätter liegen. `Zeichenziel` im Kern beantwortet das jetzt — die
     Fläche, die zuletzt berührt wurde.

     `zeigen: flaecheDa` heisst: gibt es keine, steht der Knopf gar nicht
     erst da. Ein Stift, der beim Klick sagt „hier geht das nicht", ist
     schlimmer als einer, den es nicht gibt (die Regel aus `befehle.ts`).

     Die Namen und Zeichen sind dieselben wie in `Marken.leiste` — sie
     stammen aus derselben Vorstellung, und wer eines ändert, sieht das
     andere daneben. */
  const flaecheDa = (): boolean => {
    try { return Zeichenziel.da() === true; } catch { return false; }
  };

  /* ────────────────────────────────────────────────────────────────────── *
   * FARBE UND STRICHSTÄRKE
   *
   * Beim Zeichnen sind sie kein Nebenwerkzeug: welchen Stift man nimmt und
   * in welcher Farbe, gehört zusammen. In der Leiste an der Fläche stehen
   * sie deshalb direkt neben den Werkzeugen, und hier stehen sie es auch.
   *
   * DIE WERTE STEHEN NICHT HIER. `Marken.FARBEN` und `Marken.BREITEN` sind
   * die Quelle — eine zweite Liste wäre ein zweiter Katalog (CLAUDE.md §8),
   * und sie liefe irgendwann von der ersten weg. Genau das ist der Grund,
   * warum die Blockarten oben auch aus `Register.bloecke` kommen.
   * ────────────────────────────────────────────────────────────────────── */

  /** Deutsche Namen zu den fünf Farbwerten. Unbekannte behalten ihren Code. */
  const FARBWORT: Record<string, string> = {
    '#111111': 'Schwarz', '#d64545': 'Rot', '#2f7ed8': 'Blau',
    '#3aa757': 'Grün', '#e0a419': 'Gelb'
  };
  const STRICHWORT = ['Dünn', 'Mittel', 'Dick'];

  const farbEintraege = (): BandEintrag[] => {
    let werte: string[] = [];
    try { werte = [...(Marken.FARBEN ?? [])]; } catch { werte = []; }
    return werte.map((wert, i) => ({
      reiter: 'zeichnen', gruppe: 'Farbe', id: 'zf-' + i,
      name: FARBWORT[wert] ?? wert,
      /* Der Name steht darunter, das Zeichen ist die Farbe selbst. Ohne den
         Namen wäre die Auswahl nur über Farbe zu treffen — §38. */
      zeichen: '', probe: { farbe: wert },
      hinweis: `Mit ${FARBWORT[wert] ?? wert} weiterzeichnen`,
      an: () => { try { return Zeichenziel.jetztFarbe() === wert; } catch { return false; } },
      tun: () => { if (!Zeichenziel.setzeFarbe(wert)) UI.toast('Erst eine Zeichenfläche öffnen'); },
      zeigen: flaecheDa
    }));
  };

  const strichEintraege = (): BandEintrag[] => {
    let werte: number[] = [];
    try { werte = [...(Marken.BREITEN ?? [])]; } catch { werte = []; }
    return werte.map((wert, i) => ({
      reiter: 'zeichnen', gruppe: 'Strich', id: 'zs-' + i,
      name: STRICHWORT[i] ?? String(wert),
      zeichen: '', probe: { dicke: wert },
      hinweis: `Strichstärke ${String(wert).replace('.', ',')}`,
      an: () => { try { return Zeichenziel.jetztDicke() === wert; } catch { return false; } },
      tun: () => { if (!Zeichenziel.setzeStrich(wert)) UI.toast('Erst eine Zeichenfläche öffnen'); },
      zeigen: flaecheDa
    }));
  };

  const WERKZEUGE: Array<[string, string, string, string]> = [
    ['schreiben', 'Schreiben', '✎',  'Die Zeichenschicht ist durchlässig — Text bleibt anfassbar'],
    ['stift',     'Stift',     '🖍', 'Freihand mit geglätteter Linie'],
    ['marker',    'Marker',    '▰',  'Transparenter Marker zum Hervorheben'],
    ['line',      'Linie',     '╱',  'Gerade Linie'],
    ['arrow',     'Pfeil',     '→',  'Pfeil'],
    ['rectangle', 'Rechteck',  '□',  'Rechteck'],
    ['ellipse',   'Ellipse',   '○',  'Ellipse'],
    ['abdeck',    'Abdecken',  '▬',  'Abdeckband — Antippen im Schreiben-Modus deckt auf'],
    ['zettel',    'Haftnotiz', '🗒', 'Einen Zettel aufziehen und beschriften'],
    ['text',      'Text',      'T',  'Textanmerkung auf der Fläche'],
    ['zeichen',   'Fachzeichen', '⚡', 'Ein elektrotechnisches Zeichen setzen'],
    ['select',    'Auswahl',   '⌖',  'Marken auswählen, gemeinsam bewegen oder löschen'],
    ['radierer',  'Radieren',  '⌫',  'Eine Marke entfernen']
  ];

  /* DIE FLÄCHENKNÖPFE SIND NUR GROSS, SOLANGE KEINE FLÄCHE DA IST.

     „Blatt einfügen" ist das Wichtigste, bevor man eines hat — danach sind
     es die Werkzeuge. Gemessen: mit drei grossen Kacheln kam der Reiter auf
     19 Knöpfe und 1292 px und brach auf zwei Zeilen um; ohne sie auf
     1166 px und eine. */
  const flaecheGross = (): boolean => !flaecheDa();

  /* DIE REIHENFOLGE IST SEIT E272 EINE ENTSCHEIDUNG, KEINE GEWOHNHEIT.
   *
   * Hoechstens fuenfzehn Befehle sind sichtbar; was danach kommt, steht im
   * Mehr-Knopf. Damit wird die Reihenfolge hier zur Frage „was braucht man
   * beim Zeichnen zuerst?" — und die Antwort war vorher falsch herum.
   *
   * Vorher: Flaeche, Werkzeug, Zuruecknehmen, Aufnehmen, Farbe, Strich.
   * Beim Zeichnen landeten damit ALLE Farben und Strichstaerken im Mehr —
   * im Prueflauf gesehen: „Der gezogene Strich ist wirklich blau" wurde rot,
   * weil der blaue Knopf gar nicht mehr dastand.
   *
   * Jetzt zuerst, was die Hand die ganze Zeit braucht: Werkzeug, Farbe,
   * Strich. Danach das Zuruecknehmen, und zuletzt, was man einmal am Anfang
   * tut — eine Flaeche anlegen oder etwas einlesen.
   */
  const zeichnenEintraege = (): BandEintrag[] => [
    /* Die Rueckgabe ist ausdruecklich angeschrieben. Solange dieser Block
       NACH einem Objektliteral stand, hat TypeScript den Typ von dort
       genommen; seit er als erster kommt, schliesst es aus `WERKZEUGE`
       zurueck — und mit `noUncheckedIndexedAccess` ist jedes Feld dort
       moeglicherweise `undefined`. Eine Zeile Typ statt einer Stunde
       Suche. */
    /* Die Werkzeuge selbst — nur, wenn eine Flaeche da ist (`zeigen`). */
    ...WERKZEUGE.map(([id, name, zeichen, hinweis]): BandEintrag => ({
      reiter: 'zeichnen', gruppe: 'Werkzeug', id: 'wz-' + String(id),
      name: String(name), zeichen: String(zeichen), hinweis: String(hinweis),
      tun: () => { if (!Zeichenziel.setze(id)) UI.toast('Erst eine Zeichenfläche öffnen'); },
      /* WELCHES WERKZEUG IST AN? Ohne diese Zeile stand im Band nichts
         markiert, und der graue Kasten um den zuletzt geklickten Knopf war
         nur der Fokus — er blieb auch dann, wenn man in der Leiste unten
         etwas anderes wählte (§38: nicht nur Farbe, aber auch nicht gar
         nichts). */
      an: () => { try { return Zeichenziel.jetzt() === id; } catch { return false; } },
      zeigen: flaecheDa
    })),

    ...farbEintraege(), ...strichEintraege(),

    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-undo', name: 'Zurück',
      zeichen: '↶', hinweis: 'Den letzten Strich zurücknehmen',
      tun: () => { Zeichenziel.ruf('undo'); }, zeigen: flaecheDa },
    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-redo', name: 'Vor',
      zeichen: '↷', hinweis: 'Wiederholen',
      tun: () => { Zeichenziel.ruf('redo'); }, zeigen: flaecheDa },
    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-weg', name: 'Löschen',
      zeichen: 'trash', hinweis: 'Das Ausgewählte löschen',
      tun: () => { Zeichenziel.ruf('deleteSelection'); }, zeigen: flaecheDa },

    { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-blatt', name: 'Blatt',
      zeichen: 'page', gross: flaecheGross(),  hinweis: 'Ein A4-Blatt zum Schreiben mit der Hand',
      tun: () => Blocks.einfuegenAmEnde('blatt'),
      zeigen: () => kann(() => Blocks.einfuegenAmEnde) },
    { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-white', name: 'Whiteboard',
      zeichen: 'graph', gross: flaecheGross(),  hinweis: 'Freie Fläche ohne Ränder',
      tun: () => Blocks.einfuegenAmEnde('whiteboard'),
      zeigen: () => kann(() => Blocks.einfuegenAmEnde) },
    { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-plan', name: 'Schaltplan',
      zeichen: 'bolt', gross: flaecheGross(),  hinweis: 'Fläche mit Fachzeichen und Stromsimulation',
      tun: () => Blocks.einfuegenAmEnde('schaltplan'),
      zeigen: () => kann(() => Blocks.einfuegenAmEnde) },

    { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-scan', name: 'Seite abfotografieren',
      zeichen: 'camera', hinweis: 'Ein Blatt mit der Kamera aufnehmen und den Text erkennen',
      tun: () => Recognition.capturePage(),
      zeigen: () => kann(() => Recognition.capturePage) },
    /* „PDF einlesen" stand hier einmal, flog wieder raus und ist jetzt
       wieder da — aber richtig herum. `alsSeiten` braucht eine `File`, und
       einen Dateiwähler in einem KATALOG zu bauen wäre genau das Verhalten,
       das hier verboten ist. Der Wähler steht deshalb im Bereich selbst
       (`PdfEinlesen.waehlen`, L62), und hier steht nur der Eintrag. */
    { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-pdf', name: 'PDF einlesen',
      zeichen: 'upload', hinweis: 'Eine PDF aussuchen und ihre Seiten in die Seite legen',
      tun: () => { void PdfEinlesen.waehlen(); },
      zeigen: () => kann(() => PdfEinlesen.waehlen) },
    { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-erkennen', name: 'Text erkennen',
      zeichen: 'search', hinweis: 'Aus einem Bild den Text herauslesen',
      tun: () => Recognition.scan(),
      zeigen: () => kann(() => Recognition.scan) }
  ];

  /* ======================================================================== *
   * WERKZEUGE — die sieben Zeilen, die bis E210 links standen
   * ======================================================================== */

  /* Diese Liste hiess vorher `wz` und stand in `schale/aufbau/seitenleiste.ts`
     mitten im Zeichnen. Sie steht jetzt hier, weil sie ein KATALOG ist und
     kein Aussehen — und weil das Menüband und die Seitenleiste sonst zwei
     Fassungen davon hätten. Die Handlungen sind wörtlich dieselben. */
  /* ======================================================================== *
   * GEHEN — wohin man geht (E272)
   * ------------------------------------------------------------------------
   * Vorerst nur die sechs Einträge, die aus dem aufgelösten Reiter
   * „Werkzeuge" kommen. Die volle Fassung liest in Phase E aus
   * `Register.module` und `Register.navigation` — dieselbe Wahrheit, aus
   * der auch die Seitenleiste lebt, damit es keinen zweiten Katalog gibt.
   * ======================================================================== */

  /* WOHIN GEHÖRT WAS — die einzige Liste, die dieser Reiter selbst führt.
   *
   * Sie sagt nicht, WAS es gibt (das steht in `Register.module` und
   * `Register.navigation`), sondern nur, unter welcher Überschrift es
   * erscheint. Eine Kennung, die hier fehlt, landet unter „Weiteres" —
   * sie verschwindet nicht. Das ist Absicht: ein neuer Bereich soll
   * auftauchen, auch wenn niemand daran gedacht hat, ihn hier
   * einzutragen. */
  const GEHEN_GRUPPE: Record<string, string> = {
    /* Hauptbereiche — wohin man am häufigsten geht */
    heute: 'Hauptbereiche', lernzentrum: 'Hauptbereiche',
    bibliothekOben: 'Hauptbereiche', 'app-bib': 'Hauptbereiche',
    aufgaben: 'Hauptbereiche',
    'app-notizhefte': 'Hauptbereiche',

    /* Planung & Lernen */
    elektro: 'Planung & Lernen', 'app-kalender': 'Planung & Lernen',
    'app-tagesplan': 'Planung & Lernen', 'app-woche': 'Planung & Lernen',
    'app-spaeter': 'Planung & Lernen', 'app-aufgaben': 'Planung & Lernen',
    wissen: 'Planung & Lernen', 'w-zeit': 'Planung & Lernen',

    /* Erfassen — was man anlegt */
    neu: 'Erfassen', 'w-journal': 'Erfassen', 'w-memos': 'Erfassen',
    'w-vorlagen': 'Erfassen', 'app-markt': 'Erfassen',
    erkennung: 'Erfassen', dateien: 'Erfassen',

    /* Verbinden */
    'w-agenten': 'Verbinden', 'w-bespr': 'Verbinden', ki: 'Verbinden',
    verbinden: 'Verbinden', 'app-eingang': 'Verbinden',
    posteingang: 'Verbinden',

    /* Daten */
    datenbanken: 'Daten', arbeitswelt: 'Daten', 'app-modell': 'Daten', 'app-kennzahl': 'Daten',

    /* System */
    einstellungen: 'System', 'app-aussehen': 'System', 'app-tempo': 'System',
    'app-krypto': 'System', 'app-erweitern': 'System', 'app-pwa': 'System',
    suche: 'System', befehle: 'System'
  };

  /* WAS ZWEIMAL DASSELBE TUT — gemessen an den GRIFFEN, nicht an den Namen
   * (doku/PREMIUM-SHELL-MATRIX.md, Teil 2).
   *
   * Links steht, was wegfällt; rechts, was bleibt. Beide Register führen
   * ihre Einträge weiter — hier wird nur nicht zweimal derselbe Knopf
   * gezeichnet.
   *
   * NICHT dabei sind die beiden Fälle, die gleich HEISSEN und Verschiedenes
   * tun: `bibliothekOben` geht über die Arbeitswelt, `app-bib` öffnet die
   * Liste; `aufgaben` und `app-aufgaben` ebenso. Der Kommentar in
   * `navigation.ts:141` hält das ausdrücklich fest. Sie stehen beide da,
   * unter ihren eigenen Namen. */
  const GEHEN_DOPPELT: Record<string, string> = {
    lernwelt: 'heute',            /* Produktwelten.lernen('heute') */
    'app-bib': 'bibliothekOben', /* Beide öffnen jetzt das Dokumentregal. */
    notizhefte: 'app-notizhefte', /* Notebook.oeffnen()            */
    hilfe: 'app-kann',            /* Rundgang.uebersicht()         */
    vorlagen: 'app-markt',        /* Galerie.oeffne()              */
    bibliothek: 'app-bib',        /* Bibliothek.oeffne()           */
    papierkorb: 'papierkorbFuss', /* App.papierkorb()              */
    /* ZWEIMAL DERSELBE ZEITMESSER (E393). `zeitmesser` aus `Register.module`
       und `w-zeit` aus der Liste unten rufen beide `Zeitmesser.panel()`;
       gemessen öffnen beide dasselbe Feld von 280 × 226 Pixeln. In der
       Lade stand er dadurch zweimal — einmal unter „Planung & Lernen",
       einmal unter „Weiteres". Es bleibt `w-zeit`, weil sein Hinweis
       sagt, worauf sich die Uhr bezieht: „misst die Zeit an der offenen
       Seite". Der Hinweis des Moduls nennt statt dessen die Entscheidung,
       aus der es kam. */
    zeitmesser: 'w-zeit'
  };

  /* Was kein ORT ist und deshalb nicht unter „Gehen" gehört.
     `lebensbereiche` sagt im Register selbst „KEIN EIGENER BILDSCHIRM";
     `dokumentmodus` schaltet einen Modus AUF der offenen Seite (er steht
     unter Ansicht); `editor` führt zur laufenden Seite zurück, das ist
     kein Hingehen. Ohne offene Seite geben alle drei nur einen Toast — und
     ein Knopf, der das tut, ist ein Knopf ins Leere (§47). */
  const GEHEN_NICHT = new Set(['lebensbereiche', 'dokumentmodus', 'editor',
                               'favoriten', 'seiten', 'geteilt']);

  /* Die Reihenfolge der Gruppen im Band. Was hier nicht steht, kommt
     danach — in der Reihenfolge, in der es auftaucht. */
  const GEHEN_FOLGE = ['Hauptbereiche', 'Planung & Lernen', 'Erfassen',
                       'Verbinden', 'Daten', 'System', 'Weiteres'];

  /* ======================================================================== *
   * GEHEN — wohin man geht (E272)
   * ------------------------------------------------------------------------
   * KEIN EIGENER KATALOG. Der Reiter liest, was es gibt, aus den zwei
   * Registern, die es ohnehin führen:
   *
   *     Register.module      die 16 Bereiche
   *     Register.navigation  die Zeilen der Seitenleiste
   *
   * Das ist nicht Bequemlichkeit, sondern die Bedingung dafür, dass „Gehen"
   * die Seitenleiste ABLÖSEN kann (Phase F): zwei Listen, die dasselbe
   * behaupten, laufen auseinander — bei `suche` und `palette` ist das schon
   * einmal passiert (E160).
   *
   * DABEI KOMMEN FÜNF WEGE ZURÜCK, die heute niemand sieht. Die Einträge
   * auf Platz `unten` — Vorlagen, Bibliothek, Papierkorb, Einstellungen,
   * Hilfe — werden von `seitenleiste.ts:733` weggefiltert (`vonAussen`
   * fehlt bei eingebauten Einträgen). Sie stehen seit ihrer Eintragung im
   * Register und waren nie auf dem Bildschirm.
   * ======================================================================== */

  const gehenEintraege = (): BandEintrag[] => {
    const roh: Array<{ id: string; name: string; zeichen: string;
                       hinweis: string; tun: () => void }> = [];

    /* 1. Die Bereiche. `oeffne(id)` statt `m.oeffnen()`: das Register fängt
          dort den Fehler ab und schreibt ihn in den Reporter — ein Bereich,
          der wirft, darf nicht das Band mitreissen. */
    try {
      for (const m of (Register?.module?.alle?.() || [])) {
        const id = String(m?.id ?? '');
        if (!id || GEHEN_NICHT.has(id) || GEHEN_DOPPELT[id]) continue;
        /* `zeichen` VOR `icon`. Beide Register führen seit E272 beides: ein
           Emoji für Listenzeilen und den Namen eines Strichzeichens fürs
           Band. Im Band ist das Emoji falsch — E202 hat den Grund
           aufgeschrieben, und der erste Bildschirm des Reiters „Gehen" hat
           ihn bestätigt: dreizehn Emoji nebeneinander in einer Reihe
           gleich grosser Zeichen. */
        roh.push({ id, name: String(m.name ?? id),
                   zeichen: String(m.zeichen ?? m.icon ?? 'dots'),
                   hinweis: String(m.was ?? m.name ?? ''),
                   tun: () => { Register.module.oeffne(id); } });
      }
    } catch { /* ohne Modulregister bleibt der Rest */ }

    /* 2. Die Wege der Seitenleiste, in ihrer eigenen Reihenfolge. */
    for (const platz of ['oben', 'apps', 'fuss', 'unten']) {
      let liste: any[] = [];
      try { liste = Register?.navigation?.anPlatz?.(platz) || []; } catch { liste = []; }
      for (const e of liste) {
        const id = String(e?.id ?? '');
        if (!id || GEHEN_NICHT.has(id) || GEHEN_DOPPELT[id]) continue;
        if (typeof e.tun !== 'function') continue;   /* Überschriften ohne Handlung */
        if (roh.some(x => x.id === id)) continue;
        roh.push({ id, name: String(e.name ?? id),
                   zeichen: String(e.zeichen ?? e.icon ?? 'dots'),
                   hinweis: String(e.was ?? e.name ?? ''),
                   tun: () => { e.tun(); } });
      }
    }

    /* 3. Die sechs aus dem aufgelösten Reiter „Werkzeuge". Sie stehen in
          keinem der beiden Register — ihre Griffe gehören Modulen, die
          keinen eigenen Bereich haben. */
    const eigene: BandEintrag[] = [
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-journal'] ?? 'Erfassen',
        id: 'w-journal', name: 'Journal', zeichen: 'calendar', kurz: 'Strg ⇧ J',
        gross: true, hinweis: 'Tageseintrag',
        tun: () => Werkzeuge.journal(), zeigen: () => kann(() => Werkzeuge.journal) },
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-memos'] ?? 'Erfassen',
        id: 'w-memos', name: 'Schnellnotizen', zeichen: 'bolt', kurz: 'Strg ⇧ M',
        gross: true, hinweis: 'Kurze Gedanken',
        tun: () => Werkzeuge.schnellnotizen(), zeigen: () => kann(() => Werkzeuge.schnellnotizen) },
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-vorlagen'] ?? 'Erfassen',
        id: 'w-vorlagen', name: 'Vorlagen', zeichen: 'puzzle',
        hinweis: 'Fertige Aufbauten und eigene Vorlagen',
        tun: () => Werkzeuge.vorlagen(), zeigen: () => kann(() => Werkzeuge.vorlagen) },
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-zeit'] ?? 'Planung & Lernen',
        id: 'w-zeit', name: 'Zeitmesser', zeichen: 'clock',
        hinweis: 'Stoppuhr und Timer — misst die Zeit an der offenen Seite',
        tun: () => (window as any).Zeitmesser?.panel?.(),
        /* `.panel`, NICHT das Modul. `kann()` fragt `typeof griff() ===
           'function'`; `Zeitmesser` selbst ist ein Objekt, also war die
           Antwort seit E268 immer „nein" und der Knopf stand nie da. */
        zeigen: () => kann(() => (window as any).Zeitmesser?.panel) },
      /* DER GRIFFWECHSEL, DEN PHASE F ANGEKUENDIGT HAT — und der jetzt
         faellig ist, weil er sonst ein Knopf ins Nichts waere.

         Beide riefen `App.reiterWechseln('chat')` bzw. `('bespr')`. Das
         schaltet den MODUS DER SEITENLEISTE um, und die Seitenleiste ist
         am Rechner seit E272 Phase F `display:none`. Der Klick tat also
         etwas — nur sah es niemand. Das ist die heimtueckischere Haelfte
         von §47: nicht ein Knopf, der bedauert, sondern einer, der
         schweigend nichts bewirkt.

         Die neuen Griffe sind die, die es schon gab und die eine eigene
         Flaeche oeffnen: `Agent.panel()` (agenten.ts:1024, exportiert
         :1488) und `Meeting.panel()` (besprechung.ts:544, exportiert
         :1024). Am Telefon bleibt die Seitenleiste die Schublade — dort
         waere `reiterWechseln` weiter richtig, aber zwei Wege je nach
         Breite waeren zwei Wahrheiten. Eine Flaeche geht auf beiden. */
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-agenten'] ?? 'Verbinden',
        id: 'w-agenten', name: 'Agenten', zeichen: 'robot',
        hinweis: 'Auftraege, Zeitplaene und der Notaus',
        tun: () => (globalThis as any).Agent.panel(),
        zeigen: () => kann(() => (globalThis as any).Agent?.panel) },
      { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-bespr'] ?? 'Verbinden',
        id: 'w-bespr', name: 'Besprechungen', zeichen: 'mic',
        hinweis: 'Aufnehmen, mitschreiben, auswerten',
        tun: () => (globalThis as any).Meeting.panel(),
        zeigen: () => kann(() => (globalThis as any).Meeting?.panel) }
    ];

    const ausRegistern: BandEintrag[] = roh.map(e => ({
      reiter: 'gehen',
      gruppe: GEHEN_GRUPPE[e.id] ?? 'Weiteres',
      id: e.id, name: e.name, zeichen: e.zeichen, hinweis: e.hinweis,
      tun: e.tun
    }));

    /* Nach Gruppen ordnen — `inReiter` behält die Reihenfolge des Feldes,
       also entscheidet sie hier. Innerhalb einer Gruppe bleibt es bei der
       Folge der Register. */
    const rang = (g: string): number => {
      const i = GEHEN_FOLGE.indexOf(g);
      return i < 0 ? GEHEN_FOLGE.length : i;
    };
    return [...eigene, ...ausRegistern]
      .slice()
      .sort((a, b) => rang(a.gruppe) - rang(b.gruppe));
  };

  /* ======================================================================== *
   * VERLAUF — was man zurücknimmt und wiederfindet (E272)
   * ------------------------------------------------------------------------
   * ZWEI VERSCHIEDENE „ZURÜCK", und die Namen müssen es sagen.
   *
   * Im Reiter „Zeichnen" nimmt `wz-undo` einen STRICH zurück
   * (`Zeichenziel.ruf('undo')`). Hier nimmt `v-undo` eine Änderung an der
   * SEITE zurück (`Verlauf.zurueck()`). Zwei Knöpfe, beide „Zurück"
   * genannt, wären eine Falle — deshalb heissen diese „Rückgängig" und
   * „Wiederherstellen".
   *
   * `Verlauf.zurueck()` gibt es seit langem; gerufen wurde es bisher nur
   * von Strg+Z (`schale.ts`) und aus dem Seitenmenü. Ein Knopf dafür
   * fehlte im Band — er ruft dieselbe Funktion, keine zweite.
   * ======================================================================== */

  const verlaufEintraege = (): BandEintrag[] => [
    { reiter: 'verlauf', gruppe: 'Zurücknehmen', id: 'v-undo', name: 'Rückgängig',
      zeichen: 'undo', kurz: 'Strg Z', gross: true,
      hinweis: 'Die letzte Änderung an der Seite zurücknehmen',
      tun: () => (window as any).Verlauf.zurueck(),
      zeigen: () => kann(() => (window as any).Verlauf?.zurueck) },
    { reiter: 'verlauf', gruppe: 'Zurücknehmen', id: 'v-redo', name: 'Wiederherstellen',
      zeichen: 'redo', kurz: 'Strg ⇧ Z',
      hinweis: 'Die zurückgenommene Änderung wieder anwenden',
      tun: () => (window as any).Verlauf.vor(),
      zeigen: () => kann(() => (window as any).Verlauf?.vor) },

    { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-fassungen', name: 'Fassungen',
      zeichen: 'history', hinweis: 'Frühere Stände dieser Seite ansehen',
      tun: () => { void Werkzeuge.versionen(seiteJetzt()); },
      zeigen: () => seiteDa(() => Werkzeuge.versionen) },
    { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-duplizieren', name: 'Duplizieren',
      zeichen: 'copy', hinweis: 'Eine Kopie dieser Seite anlegen',
      tun: () => { const p2 = seiteJetzt(); if (p2) App.dupliziereSeite(p2.id); },
      zeigen: () => seiteDa(() => App.dupliziereSeite) },
    { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-verschieben', name: 'Verschieben',
      zeichen: 'arrowR', hinweis: 'Diese Seite an eine andere Stelle hängen',
      tun: () => Werkzeuge.verschiebenNach(seiteJetzt()),
      zeigen: () => seiteDa(() => Werkzeuge.verschiebenNach) },
    { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-kommentare', name: 'Kommentare',
      zeichen: 'chat', hinweis: 'Die Anmerkungen an dieser Seite',
      tun: () => { const p2 = seiteJetzt(); if (p2) Kommentare.panel(p2.id); },
      zeigen: () => seiteDa(() => Kommentare.panel) },

    { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'v-posteingang', name: 'Posteingang',
      zeichen: 'inbox', hinweis: 'Erinnerungen, Kommentare, Erwähnungen',
      tun: () => Ansichten.posteingang(), zeigen: () => kann(() => Ansichten.posteingang) },
    { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'w-zuletzt', name: 'Zuletzt verwendet',
      zeichen: 'clock', hinweis: 'Die Bibliothek, gefiltert auf zuletzt Verwendetes',
      tun: () => Bibliothek.oeffne(), zeigen: () => kann(() => Bibliothek.oeffne) },
    { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'v-papierkorb', name: 'Papierkorb',
      zeichen: 'trash', hinweis: 'Gelöschtes ansehen und zurückholen',
      tun: () => App.papierkorb(), zeigen: () => kann(() => App.papierkorb) }
  ];

  /* ======================================================================== *
   * ÜBERPRÜFEN — nachsehen, zählen, wiederholen (E272)
   * ------------------------------------------------------------------------
   * ELEKTROS „ÜBEN" UND „PRÜFUNG" STEHEN HIER NOCH NICHT.
   * Der Entwurf sieht sie vor, und die Griffe gibt es
   * (`Elektroarbeitsplatz.uebung`, `.pruefungFlaeche`). Sie hier
   * einzutragen hiesse aber, jedem eine Elektro-Prüfung anzubieten, der
   * gerade einen Einkaufszettel schreibt. Sinn ergeben sie erst, wenn
   * `zeigen()` den Schauplatz kennt — das kommt mit der Kontextkante in
   * Phase F/H. Bis dahin sind sie über die Elektro-Seite erreichbar, die
   * ihre acht Kacheln aus `inReiter('elektro')` liest.
   * ======================================================================== */

  const ueberpruefenEintraege = (): BandEintrag[] => [
    { reiter: 'ueberpruefen', gruppe: 'Lernen', id: 'w-lernen', name: 'Karteikarten',
      zeichen: 'cards', gross: true, hinweis: 'Wiederholen nach Plan',
      tun: () => Werkzeuge.lernen(), zeigen: () => kann(() => Werkzeuge.lernen) },
    { reiter: 'ueberpruefen', gruppe: 'Lernen', id: 'u-faellig', name: 'Fällige Karten',
      zeichen: 'checkCircle', hinweis: 'Was heute dran wäre',
      tun: () => Werkzeuge.faellig(), zeigen: () => kann(() => Werkzeuge.faellig) },

    { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-graph', name: 'Graph',
      zeichen: 'graph', kurz: 'Strg ⇧ G', hinweis: 'Wie alles zusammenhängt',
      tun: () => Links.graph(), zeigen: () => kann(() => Links.graph) },
    { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-tags', name: 'Schlagwörter',
      zeichen: 'tag', kurz: 'Strg ⇧ T', hinweis: 'Alle #Schlagwörter',
      tun: () => Links.tagRegister(), zeigen: () => kann(() => Links.tagRegister) },
    { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-luecken', name: 'Wissenslücken',
      zeichen: 'compass', hinweis: 'Was fehlt, verrät der Bestand selbst',
      tun: () => Wissensluecken.zeigen(),
      zeigen: () => kann(() => Wissensluecken.zeigen) },

    { reiter: 'ueberpruefen', gruppe: 'Nachsehen', id: 'u-statistik', name: 'Statistik',
      zeichen: 'chart', hinweis: 'Wörter, Zeichen, Lesedauer dieser Seite',
      tun: () => Werkzeuge.statistik(seiteJetzt()),
      zeigen: () => seiteDa(() => Werkzeuge.statistik) },
    { reiter: 'ueberpruefen', gruppe: 'Nachsehen', id: 'u-gesundheit', name: 'Bestand prüfen',
      zeichen: 'shield', hinweis: 'Was in den Daten nicht stimmt',
      tun: () => Pflege.gesundheit(), zeigen: () => kann(() => Pflege.gesundheit) }
  ];

  /* ======================================================================== *
   * HILFE (E272)
   * ======================================================================== */

  const hilfeEintraege = (): BandEintrag[] => [
    { reiter: 'hilfe', gruppe: 'Lernen, was geht', id: 'h-rundgang', name: 'Was Redion kann',
      zeichen: 'help', gross: true, hinweis: 'Der Rundgang durch alle Bereiche',
      tun: () => Rundgang.uebersicht(), zeigen: () => kann(() => Rundgang.uebersicht) },
    { reiter: 'hilfe', gruppe: 'Lernen, was geht', id: 'h-kuerzel', name: 'Tastenkürzel',
      zeichen: 'command', kurz: 'Strg /', hinweis: 'Alle Kürzel auf einen Blick',
      tun: () => Werkzeuge.tastenkuerzel(), zeigen: () => kann(() => Werkzeuge.tastenkuerzel) },

    { reiter: 'hilfe', gruppe: 'Wenn etwas klemmt', id: 'h-erstehilfe', name: 'Erste Hilfe',
      zeichen: 'shield', hinweis: 'Wenn etwas nicht stimmt: prüfen und richten',
      tun: () => Pflege.ersteHilfe(), zeigen: () => kann(() => Pflege.ersteHilfe) },
    { reiter: 'hilfe', gruppe: 'Wenn etwas klemmt', id: 'w-stand', name: 'Umsetzungsstand',
      zeichen: 'checkCircle', hinweis: 'Alle 16 Teile der Notion-Doku, Punkt für Punkt',
      tun: () => Status.seiteAnlegen(), zeigen: () => kann(() => Status.seiteAnlegen) },

    { reiter: 'hilfe', gruppe: 'Deine Daten', id: 'h-sichern', name: 'Sicherung speichern',
      zeichen: 'download', hinweis: 'Alles in eine Datei — mit Anhängen als .redion',
      tun: () => { void App.sicherungSpeichern(); },
      zeigen: () => kann(() => App.sicherungSpeichern) },
    { reiter: 'hilfe', gruppe: 'Deine Daten', id: 'h-einlesen', name: 'Sicherung einlesen',
      zeichen: 'upload', hinweis: 'Eine gespeicherte Sicherung zurückholen',
      tun: () => App.sicherungLaden(), zeigen: () => kann(() => App.sicherungLaden) }
  ];

  /* ======================================================================== *
   * ELEKTRO — der Beruf, um den es geht
   * ======================================================================== */

  const elektroEintraege = (): BandEintrag[] => [
    { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-rechner', name: 'Rechner',
      zeichen: 'bolt', gross: true, hinweis: 'Zehn Rechnungen mit gezeigtem Lösungsweg',
      tun: () => Electrical.open(), zeigen: () => kann(() => Electrical.open) },
    { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-formelheft', name: 'Formelheft',
      zeichen: 'book', gross: true, hinweis: 'Alle Formeln zum Nachschlagen',
      tun: () => Formelheft.oeffne(), zeigen: () => kann(() => Formelheft.oeffne) },
    { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-dreieck', name: 'Formeldreieck',
      zeichen: 'compass', hinweis: 'Das Dreieck zu einer Formel zeichnen',
      tun: () => Elektrolernbilder.dreieckFlaeche(),
      zeigen: () => kann(() => Elektrolernbilder.dreieckFlaeche) },
    { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-sinus', name: 'Sinuskurve',
      zeichen: 'chart', hinweis: 'Wechselspannung als Kurve',
      tun: () => Elektrolernbilder.sinusFlaeche(),
      zeigen: () => kann(() => Elektrolernbilder.sinusFlaeche) },

    { reiter: 'elektro', gruppe: 'Üben', id: 'e-ueben', name: 'Üben',
      zeichen: 'learn', gross: true, hinweis: 'Aufgaben mit Lösungsweg',
      tun: () => Elektroarbeitsplatz.uebung(),
      zeigen: () => kann(() => Elektroarbeitsplatz.uebung) },
    { reiter: 'elektro', gruppe: 'Üben', id: 'e-pruefung', name: 'Prüfung',
      zeichen: 'medal', hinweis: 'Prüfung unter Zeit',
      tun: () => Elektroarbeitsplatz.pruefungFlaeche(),
      zeigen: () => kann(() => Elektroarbeitsplatz.pruefungFlaeche) },
    { reiter: 'elektro', gruppe: 'Üben', id: 'e-arbeitsplatz', name: 'Arbeitsplatz',
      zeichen: 'briefcase', hinweis: 'Alles nebeneinander',
      tun: () => Elektroarbeitsplatz.arbeitsplatz(),
      zeigen: () => kann(() => Elektroarbeitsplatz.arbeitsplatz) },

    { reiter: 'elektro', gruppe: 'Zeichnen', id: 'e-plan', name: 'Schaltplan',
      zeichen: 'graph', gross: true, hinweis: 'Plan mit Fachzeichen und Stromsimulation',
      tun: () => Blocks.einfuegenAmEnde('schaltplan'),
      zeigen: () => kann(() => Blocks.einfuegenAmEnde) }
  ];

  /* ======================================================================== *
   * ANSICHT — wie die Seite aussieht und wohin sie geht
   * ======================================================================== */

  const ansichtEintraege = (): BandEintrag[] => [
    { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-fokus', name: 'Fokus',
      zeichen: 'compass', gross: true, hinweis: 'Alles ausblenden bis auf den Text',
      tun: () => Werkzeuge.fokus(), zeigen: () => kann(() => Werkzeuge.fokus) },
    { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-praes', name: 'Präsentation',
      zeichen: 'rocket', gross: true, hinweis: 'Die Seite als Folien zeigen',
      tun: () => Werkzeuge.praesentation(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.praesentation) },
    /* VOLLBILD (E283 / L85 Punkt 1). Er steht neben „Fokus", weil beide
       dasselbe Ziel haben und Gegenteiliges tun: Fokus räumt REDIONS
       Oberfläche weg und lässt den Browser stehen, Vollbild räumt den
       BROWSER weg und lässt Redion stehen. Nebeneinander sieht man das.

       `an` liest den Zustand FRISCH bei jedem Zeichnen — Escape verlässt das
       Vollbild ohne uns, und ein gemerkter Wert stünde danach falsch.
       `zeigen` fragt zusätzlich `vollbildGeht()`: auf dem iPhone gibt es
       kein Element-Vollbild, und ein Knopf, der dort nichts tut, ist §47. */
    { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-vollbild', name: 'Vollbild',
      zeichen: 'maximize', hinweis: 'Den ganzen Bildschirm nutzen — Esc beendet es',
      an: () => kann(() => App.vollbildAn) && App.vollbildAn(),
      tun: () => { App.vollbild(); },
      zeigen: () => kann(() => App.vollbild) && kann(() => App.vollbildGeht) &&
                    App.vollbildGeht() },
    { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-hell', name: 'Hell / Dunkel',
      zeichen: 'sun', hinweis: 'Zwischen hellem und dunklem Aussehen wechseln',
      tun: () => App.theme(), zeigen: () => kann(() => App.theme) },
    { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-aussehen', name: 'Aussehen …',
      zeichen: 'settings', hinweis: 'Farbschema, Schrift und Dichte wählen',
      tun: () => Aussehen.dialog(), zeigen: () => kann(() => Aussehen.dialog) },

    { reiter: 'ansicht', gruppe: 'Seite', id: 'a-versionen', name: 'Fassungen',
      zeichen: 'history', hinweis: 'Frühere Stände dieser Seite',
      tun: () => Werkzeuge.versionen(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.versionen) },
    { reiter: 'ansicht', gruppe: 'Seite', id: 'a-sperren', name: 'Sperren',
      zeichen: 'lock', hinweis: 'Seite gegen Bearbeiten sperren',
      tun: () => Werkzeuge.sperren(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.sperren) },
    { reiter: 'ansicht', gruppe: 'Seite', id: 'a-quelltext', name: 'Quelltext',
      zeichen: 'command', hinweis: 'Die Seite als Markdown ansehen',
      tun: () => Werkzeuge.quelltext(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.quelltext) },

    { reiter: 'ansicht', gruppe: 'Ausgeben', id: 'a-drucken', name: 'Drucken',
      zeichen: 'clipboard', hinweis: 'Die Seite drucken oder als PDF sichern',
      tun: () => Werkzeuge.drucken(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.drucken) },
    { reiter: 'ansicht', gruppe: 'Ausgeben', id: 'a-html', name: 'Als HTML',
      zeichen: 'share', hinweis: 'Die Seite als HTML-Datei sichern',
      tun: () => Werkzeuge.htmlExport(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.htmlExport) }
  ];

  /* ======================================================================== *
   * FREMDE EINTRÄGE
   * ======================================================================== */

  /* Wie bei `register/befehle.ts`: ein Bereich meldet seine eigenen Einträge
     an, ohne dass diese Datei ihn kennen muss. Ohne das stünde hier über
     kurz oder lang jeder Bereich drin, und §5 Regel 1 wäre umgangen. */
  const fremde: BandEintrag[] = [];
  const lieferanten: Array<() => BandEintrag[]> = [];

  const melde = (eintrag: BandEintrag): boolean => {
    if (!eintrag || !eintrag.id || !eintrag.reiter || typeof eintrag.tun !== 'function') return false;
    if (fremde.some(x => x.id === eintrag.id)) return false;
    fremde.push(eintrag);
    return true;
  };

  const meldeLieferant = (fn: () => BandEintrag[]): boolean => {
    if (typeof fn !== 'function' || lieferanten.includes(fn)) return false;
    lieferanten.push(fn);
    return true;
  };

  const nimmZurueck = (id: string): boolean => {
    const i = fremde.findIndex(x => x.id === id);
    if (i < 0) return false;
    fremde.splice(i, 1);
    return true;
  };

  /**
   * Einen Lieferanten wieder abmelden (E277, L87).
   *
   * `melde` hatte seit jeher ein `nimmZurueck`, `meldeLieferant` nicht.
   * Wer einen Lieferanten anmeldete, wurde ihn nicht mehr los — für eine
   * Gegenprobe heisst das: ihr Fantasie-Eintrag steht bis zum Ende des
   * Laufs im Band und taucht dann in einem ganz anderen Punkt als
   * „Weg, der nichts tut" auf. Genau das ist bei `Register.module`
   * passiert (E273), und dort war die Antwort dieselbe.
   */
  const nimmZurueckLieferant = (fn: () => BandEintrag[]): boolean => {
    const i = lieferanten.indexOf(fn);
    if (i < 0) return false;
    lieferanten.splice(i, 1);
    return true;
  };

  /**
   * Ist das ein brauchbarer Bandeintrag? (E277, L87)
   *
   * DIESE PRÜFUNG STAND NUR IN `melde`. Ein Lieferant durfte zurückgeben,
   * was er wollte — ohne Kennung, ohne Reiter, ohne lebendes `tun` —, und
   * `alle()` schob es ungesehen ins Band. Sichtbar wurde das erst als
   * Knopf, der beim Klick wirft, oder als Zeichen ohne Namen.
   *
   * Beides an EINER Stelle zu prüfen ist nicht bloss ordentlicher: die
   * Lieferanten sind die Quelle, die sich zur Laufzeit ändert. `melde`
   * bekommt sein Objekt einmal und behält es; ein Lieferant baut bei jedem
   * Zeichnen ein neues. Er ist also der Weg, auf dem ein kaputter Eintrag
   * WIRKLICH hereinkommt — und war der ungeprüfte.
   *
   * `Register.kontext` macht es seit E272 Phase F genau so (context.ts:145).
   */
  const brauchbar = (e: unknown): e is BandEintrag => {
    if (!e || typeof e !== 'object') return false;
    const x = e as Partial<BandEintrag>;
    return !!x.id && !!x.reiter && !!x.name && typeof x.tun === 'function';
  };

  /* ======================================================================== *
   * DIE ABFRAGE
   * ======================================================================== */

  /**
   * Alle Einträge für diesen Augenblick.
   *
   * Ein Lieferant, der einen Fehler wirft, fällt weg — das Band bleibt
   * stehen. Ein Menüband, das sich wegen eines Bereichs gar nicht zeichnet,
   * wäre der schlimmere Fehler.
   */
  /**
   * Welche Reiter ohne offene Seite nichts können.
   *
   * Sie steht hier und nicht bei jedem der 108 Einträge: die Bedingung
   * gilt für den ganzen Reiter, nicht für einzelne Zeilen darin. Wer
   * einen Eintrag hinzufügt, der trotz fehlender Seite geht, gibt ihm
   * einen eigenen Reiter oder sagt es hier.
   */
  const BRAUCHT_SEITE = new Set(['start', 'einfuegen', 'zeichnen']);

  const alle = (): BandEintrag[] => {
    const aus: BandEintrag[] = [];
    const quellen: Array<() => BandEintrag[]> = [
      gehenEintraege, startEintraege, einfuegenEintraege, zeichnenEintraege,
      verlaufEintraege, ueberpruefenEintraege, ansichtEintraege, hilfeEintraege,
      /* `elektroEintraege` steht weiter in der Liste, obwohl „Elektro" kein
         Reiter mehr ist. Das ist kein Versehen: `alle()` ist die Quelle für
         `inReiter()`, und `bereiche/elektro/start.ts` fragt genau darüber
         nach seinen acht Kacheln. Nähme man die Zeile heraus, wäre die
         Elektro-Startseite leer — und keine Prüfung ausser test272 §5
         merkte es. */
      elektroEintraege
    ];
    /* DIE EIGENEN QUELLEN UNGEPRÜFT, DIE FREMDEN GEPRÜFT.
       Die Liste oben steht in dieser Datei; wer sie kaputt macht, sieht es
       beim Typprüfen. Ein Lieferant kommt von aussen und baut bei jedem
       Zeichnen neu — dort wird gesiebt (L87). */
    for (const q of quellen) {
      try { aus.push(...(q() || [])); } catch { /* dieser Teil fehlt, der Rest steht */ }
    }
    for (const l of lieferanten) {
      try {
        for (const e of (l() || [])) if (brauchbar(e)) aus.push(e);
      } catch { /* ein kaputter Lieferant nimmt die anderen nicht mit */ }
    }
    aus.push(...fremde);
    return aus.filter(e => {
      /* DREI REITER SCHREIBEN IN EINE SEITE (E236).
         „Start" formatiert Absätze, „Einfügen" hängt Blöcke ans Ende,
         „Zeichnen" braucht eine Fläche. Ohne offene Seite tun sie
         entweder nichts oder melden „Erst eine Seite öffnen" — und ein
         Knopf, der das sagt, ist ein Knopf ins Leere (§47).

         Bisher wurde deshalb die GANZE Leiste versteckt, sobald keine
         Seite offen war (E219). Das war richtig, solange die Leiste unter
         der Kopfzeile sass und sonst nichts konnte. Seit sie ganz oben
         steht und immer da sein soll, ist es zu viel: „Werkzeuge",
         „Elektro" und „Ansicht" öffnen ihre eigenen Sachen und
         funktionieren ohne Seite.

         Also fällt jetzt weg, was wirklich eine Seite braucht — und die
         drei anderen Reiter bleiben. `reiter()` zählt danach, welche
         Reiter überhaupt etwas zu zeigen haben, und lässt die leeren
         von selbst verschwinden. */
      if (BRAUCHT_SEITE.has(e.reiter) && !seiteJetzt()) return false;
      if (typeof e.zeigen !== 'function') return true;
      try { return e.zeigen() !== false; } catch { return false; }
    });
  };

  /** Die Einträge eines Reiters, nach Gruppen geordnet. */
  const inReiter = (reiter: string): Array<{ gruppe: string; eintraege: BandEintrag[] }> => {
    const drin = alle().filter(e => e.reiter === reiter);
    const folge: string[] = [];
    const nach = new Map<string, BandEintrag[]>();
    for (const e of drin) {
      if (!nach.has(e.gruppe)) { nach.set(e.gruppe, []); folge.push(e.gruppe); }
      nach.get(e.gruppe)!.push(e);
    }
    return folge.map(g => ({ gruppe: g, eintraege: nach.get(g)! }));
  };

  /**
   * DIE ORTE — wohin man gehen kann (E388).
   *
   * Derselbe Katalog, den der Reiter „Gehen" zeichnet, unter einem Namen,
   * der von einem Ort spricht und nicht von einem Reiterblatt.
   *
   * WARUM DAS EINEN EIGENEN NAMEN BRAUCHT. Die linke Leiste zeigt seit
   * E388 die Orte, und sie holte sie zuerst über `inReiter('gehen')`.
   * `test272 §14` fing das: die Kante darf sich nicht an ein Reiterblatt
   * hängen. Der Wächter hat recht, und zwar nicht formal — sobald „Gehen"
   * das Band verlässt (und genau dahin geht der Weg), wäre die Leiste
   * still leer gewesen.
   *
   * Der EINTRAG bleibt am Feld `reiter: 'gehen'` hängen; das ist seine
   * Ablage im Register, nicht seine Anzeige. Ob das Band einen Reiter
   * dafür zeigt, entscheidet `reiter()` — und wenn es keinen mehr zeigt,
   * liefert `orte()` weiterhin dieselbe Liste.
   */
  const orte = (): Array<{ gruppe: string; eintraege: BandEintrag[] }> =>
    inReiter('gehen');

  /** Die Reiter, die überhaupt etwas zu zeigen haben. */
  const reiter = (): BandReiter[] => {
    const belegt = new Set(alle().map(e => e.reiter));
    return REITER.filter(r => belegt.has(r.id));
  };

  const eines = (id: string): BandEintrag | null => alle().find(e => e.id === id) || null;

  const anzahl = (): number => alle().length;

  return { REITER, reiter, alle, inReiter, orte, eines, anzahl,
           melde, meldeLieferant, nimmZurueck, nimmZurueckLieferant };
})();
