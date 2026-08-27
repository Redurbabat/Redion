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

  const REITER: BandReiter[] = [
    { id: 'start',     name: 'Start',     zeichen: 'pencil' },
    { id: 'einfuegen', name: 'Einfügen',  zeichen: 'plus' },
    { id: 'zeichnen',  name: 'Zeichnen',  zeichen: 'page' },
    { id: 'werkzeuge', name: 'Werkzeuge', zeichen: 'box' },
    { id: 'elektro',   name: 'Elektro',   zeichen: 'bolt' },
    { id: 'ansicht',   name: 'Ansicht',   zeichen: 'sun' }
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

  const einfuegenEintraege = (): BandEintrag[] => {
    if (!Register?.bloecke?.alle) return [];
    /* `aktion` trennt die echten Blockarten von den Slash-BEFEHLEN
       („Umwandeln in …", „Duplizieren", „Erwähnen"). Die brauchen den
       Schreibzeiger und den Block darunter — `Editor.slashAktion(ct, block,
       was)` — und beides hat ein Knopf im Band nicht. Sie stehen deshalb
       nicht hier, sondern weiterhin im Slash-Menü. Das ist eine bekannte
       Lücke und keine vergessene Zeile; sie steht in LUECKEN.md. */
    const bloecke = (Register.bloecke.alle() as any[]).filter(b => b && b.id && !b.aktion);
    const rang = (g: string) => {
      const i = GRUPPEN_FOLGE.indexOf(g);
      return i < 0 ? GRUPPEN_FOLGE.length : i;
    };
    return bloecke
      .slice()
      .sort((a, b) => rang(a.gruppe) - rang(b.gruppe))
      .map(b => ({
        reiter: 'einfuegen', gruppe: String(b.gruppe || 'Weiteres'),
        id: 'blk-' + b.id, name: String(b.name || b.id),
        zeichen: String(b.icon || '▫'),
        ...(b.kurz ? { kurz: String(b.kurz) } : {}),
        hinweis: String(b.name || b.id) + ' einfügen',
        tun: () => Blocks.einfuegenAmEnde(b.id),
        zeigen: () => kann(() => Blocks.einfuegenAmEnde)
      }));
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

  const zeichnenEintraege = (): BandEintrag[] => [
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

    /* Die Werkzeuge selbst — nur, wenn eine Fläche da ist. */
    ...WERKZEUGE.map(([id, name, zeichen, hinweis]) => ({
      reiter: 'zeichnen', gruppe: 'Werkzeug', id: 'wz-' + id, name, zeichen, hinweis,
      tun: () => { if (!Zeichenziel.setze(id)) UI.toast('Erst eine Zeichenfläche öffnen'); },
      /* WELCHES WERKZEUG IST AN? Ohne diese Zeile stand im Band nichts
         markiert, und der graue Kasten um den zuletzt geklickten Knopf war
         nur der Fokus — er blieb auch dann, wenn man in der Leiste unten
         etwas anderes wählte (§38: nicht nur Farbe, aber auch nicht gar
         nichts). */
      an: () => { try { return Zeichenziel.jetzt() === id; } catch { return false; } },
      zeigen: flaecheDa
    })),

    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-undo', name: 'Zurück',
      zeichen: '↶', hinweis: 'Den letzten Strich zurücknehmen',
      tun: () => { Zeichenziel.ruf('undo'); }, zeigen: flaecheDa },
    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-redo', name: 'Vor',
      zeichen: '↷', hinweis: 'Wiederholen',
      tun: () => { Zeichenziel.ruf('redo'); }, zeigen: flaecheDa },
    { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-weg', name: 'Löschen',
      zeichen: 'trash', hinweis: 'Das Ausgewählte löschen',
      tun: () => { Zeichenziel.ruf('deleteSelection'); }, zeigen: flaecheDa },

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
      zeigen: () => kann(() => Recognition.scan) },

    ...farbEintraege(), ...strichEintraege()
  ];

  /* ======================================================================== *
   * WERKZEUGE — die sieben Zeilen, die bis E210 links standen
   * ======================================================================== */

  /* Diese Liste hiess vorher `wz` und stand in `schale/aufbau/seitenleiste.ts`
     mitten im Zeichnen. Sie steht jetzt hier, weil sie ein KATALOG ist und
     kein Aussehen — und weil das Menüband und die Seitenleiste sonst zwei
     Fassungen davon hätten. Die Handlungen sind wörtlich dieselben. */
  const werkzeugEintraege = (): BandEintrag[] => [
    { reiter: 'werkzeuge', gruppe: 'Schreiben', id: 'w-journal', name: 'Journal',
      zeichen: 'calendar', kurz: 'Strg ⇧ J', gross: true, hinweis: 'Tageseintrag',
      tun: () => Werkzeuge.journal(), zeigen: () => kann(() => Werkzeuge.journal) },
    { reiter: 'werkzeuge', gruppe: 'Schreiben', id: 'w-memos', name: 'Schnellnotizen',
      zeichen: 'bolt', kurz: 'Strg ⇧ M', gross: true, hinweis: 'Kurze Gedanken',
      tun: () => Werkzeuge.schnellnotizen(), zeigen: () => kann(() => Werkzeuge.schnellnotizen) },
    { reiter: 'werkzeuge', gruppe: 'Schreiben', id: 'w-vorlagen', name: 'Vorlagen',
      zeichen: 'puzzle', hinweis: 'Fertige Aufbauten und eigene Vorlagen',
      tun: () => Werkzeuge.vorlagen(), zeigen: () => kann(() => Werkzeuge.vorlagen) },

    { reiter: 'werkzeuge', gruppe: 'Wiederfinden', id: 'w-graph', name: 'Graph',
      zeichen: 'graph', kurz: 'Strg ⇧ G', hinweis: 'Wie alles zusammenhängt',
      tun: () => Links.graph(), zeigen: () => kann(() => Links.graph) },
    { reiter: 'werkzeuge', gruppe: 'Wiederfinden', id: 'w-tags', name: 'Schlagwörter',
      zeichen: 'tag', kurz: 'Strg ⇧ T', hinweis: 'Alle #Schlagwörter',
      tun: () => Links.tagRegister(), zeigen: () => kann(() => Links.tagRegister) },

    { reiter: 'werkzeuge', gruppe: 'Lernen', id: 'w-lernen', name: 'Karteikarten',
      zeichen: 'cards', gross: true, hinweis: 'Wiederholen nach Plan',
      tun: () => Werkzeuge.lernen(), zeigen: () => kann(() => Werkzeuge.lernen) },
    { reiter: 'werkzeuge', gruppe: 'Lernen', id: 'w-stand', name: 'Umsetzungsstand',
      zeichen: 'checkCircle', hinweis: 'Alle 16 Teile der Notion-Doku, Punkt für Punkt',
      tun: () => Status.seiteAnlegen(), zeigen: () => kann(() => Status.seiteAnlegen) },

    /* DREI ABSCHNITTE, DIE LINKS ZU VIEL WAREN (E211).

       Redur: „links habe ich sehr viele Bereiche … Agenten, Besprechungen,
       Kürzlich verwendet können auch oben bei den Menüs sein. Dort oben
       kommt nur, was man nicht so viel braucht."

       Die Regel dahinter ist gut und gilt jetzt für beide Seiten:

           LINKS  die Bereiche — wohin man geht
           OBEN   die Werkzeuge — womit man arbeitet

       Bei zweien davon war es sogar eine echte Doppelung: die Seitenleiste
       hat OBEN schon Reiter für Agenten und Besprechungen (`chat`, `bespr`).
       Der Abschnitt im Baum darunter zeigte dieselben Dinge ein zweites Mal.
       Diese Knöpfe schalten deshalb auf den Reiter, der ohnehin da ist —
       sie bauen keine dritte Ansicht.

       „Kürzlich verwendet" führt in die Bibliothek: dort ist es der erste
       Filter, und man sieht Vorschauen statt einer Namensliste. */
    { reiter: 'werkzeuge', gruppe: 'Weiteres', id: 'w-agenten', name: 'Agenten',
      zeichen: 'robot', hinweis: 'Deine Agenten und der Chatverlauf',
      tun: () => App.reiterWechseln('chat'),
      zeigen: () => kann(() => App.reiterWechseln) },
    { reiter: 'werkzeuge', gruppe: 'Weiteres', id: 'w-bespr', name: 'Besprechungen',
      zeichen: 'mic', hinweis: 'Termine und Besprechungsnotizen',
      tun: () => App.reiterWechseln('bespr'),
      zeigen: () => kann(() => App.reiterWechseln) },
    { reiter: 'werkzeuge', gruppe: 'Weiteres', id: 'w-zuletzt', name: 'Zuletzt verwendet',
      zeichen: 'history', hinweis: 'Die Bibliothek, gefiltert auf zuletzt Verwendetes',
      tun: () => Bibliothek.oeffne(),
      zeigen: () => kann(() => Bibliothek.oeffne) }
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
  const alle = (): BandEintrag[] => {
    const aus: BandEintrag[] = [];
    const quellen: Array<() => BandEintrag[]> = [
      startEintraege, einfuegenEintraege, zeichnenEintraege,
      werkzeugEintraege, elektroEintraege, ansichtEintraege
    ];
    for (const q of [...quellen, ...lieferanten]) {
      try { aus.push(...(q() || [])); } catch { /* dieser Teil fehlt, der Rest steht */ }
    }
    aus.push(...fremde);
    return aus.filter(e => {
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

  /** Die Reiter, die überhaupt etwas zu zeigen haben. */
  const reiter = (): BandReiter[] => {
    const belegt = new Set(alle().map(e => e.reiter));
    return REITER.filter(r => belegt.has(r.id));
  };

  const eines = (id: string): BandEintrag | null => alle().find(e => e.id === id) || null;

  const anzahl = (): number => alle().length;

  return { REITER, reiter, alle, inReiter, eines, anzahl,
           melde, meldeLieferant, nimmZurueck };
})();
