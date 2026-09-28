/* ============================================================================
 * bereiche/pdf/marken.ts — eine Ink-Schicht fuer A4-Blatt und PDF-Seite
 * ----------------------------------------------------------------------------
 * Ein Dokumentraum, ein SVG-Knoten je Marke, keine Ablageschreibvorgaenge
 * waehrend pointermove. Alte `stift`-Marken mit `pts: [[x,y], ...]` bleiben
 * lesbar; neue Druckwerte liegen getrennt unter `pressure` (E125).
 * ==========================================================================*/

const Marken = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'] as const;
  const BREITEN = [1.2, 2.4, 5] as const;

  /* ══ PUNKTE, NICHT PIXEL — UND DESHALB MILLIMETER (E616) ══════════════════
     NACHGEMESSEN AM LAUFENDEN PROGRAMM, nicht angenommen: das `viewBox` der
     Zeichenfläche ist `0 0 595.28 841.89` — A4 in PDF-PUNKTEN
     (`SheetSpace.A4_BREITE`). Die Zahlen oben sind also Punkte.

     BIS HIERHER STAND AN DEN STUFENKNÖPFEN „1,2 px" und „2,4 px". Das war
     falsch: 1,2 pt sind 0,4 mm, 1,2 px wären 0,3 mm — und auf dem Bildschirm
     stand überhaupt nur „1,2", eine Zahl ohne Einheit. Sie sagt niemandem
     etwas, und wer sie für Millimeter hielt, lag daneben.

     Ein Punkt ist 1/72 Zoll, ein Zoll 25,4 mm. Die Umrechnung ist damit
     exakt und braucht keine Messung — gemessen wurde nur, DASS es Punkte
     sind. */
  const MM_JE_PT = 25.4 / 72;
  const alsMm = (pt: number): string =>
    (Math.round(pt * MM_JE_PT * 10) / 10).toFixed(1).replace('.', ',') + ' mm';

  /* Redurs Wörter von den iPad-Bildern (W4): „Fein · Mittel · Markant".
     Die Zahlen daneben sind NICHT seine — GoodNotes nennt 0,3/0,7/1,2 mm,
     Redion zieht 0,4/0,8/1,8. Eine abgeschriebene Zahl wäre eine falsche
     Angabe auf dem Bildschirm (§33). */
  const BREITEN_NAMEN = ['Fein', 'Mittel', 'Markant'] as const;
  /* Die Vorgabe der HAFTNOTIZ — und bis E704 auch die des Markers. Sie
     bleibt, was sie ist: jede Haftnotiz ohne eigene Farbe trägt sie, und
     `test267`/`test350` kennen sie so. */
  const MARKER_FARBE = '#e0a419';
  /* DER TEXTMARKER (E704): ein neuer Markerstrich beginnt in Sonnengelb;
     ein vorhandener behält seine Farbe (E697). */
  const TEXTMARKER_FARBE = '#ffcf33';
  /* DIE ZWEI SPITZEN DES MARKERS (E704): Keil (Vorgabe, 0,40) oder Rund
     (wie bis E704; jeder alte Markerstrich ist ein runder). */
  const MARKER_SPITZEN = [
    { id: 'keil', name: 'Keil', titel: 'Keilspitze — wie ein echter Textmarker: gerade Enden, dünn im Senkrechten' },
    { id: 'rund', name: 'Rund', titel: 'Runde Spitze — der Marker, wie er bis E704 war' }
  ] as const;
  const MARKER_SPITZE_VORGABE = 'keil';
  const M_MARKER_SPITZE = 'zeichnen:markerspitze';
  const markerSpitzeLesen = (): string => {
    const wert = typeof Store !== 'undefined' ? String(Store.getMeta(M_MARKER_SPITZE) || '') : '';
    return MARKER_SPITZEN.some(sp => sp.id === wert) ? wert : MARKER_SPITZE_VORGABE;
  };
  /** Die Dicke der Keilkante im Verhältnis zu ihrer Höhe (E704). */
  const KEIL_DICKE = 0.22;
  /** Der Winkel der Keilkante gegen die Waagrechte, in Grad (E704). */
  const KEIL_WINKEL = 78;
  const HISTORY_LIMIT = 100;
  /* DIE ZWISCHENABLAGE DER ZEICHENSCHICHT (E353): ein Ort fuer alle
     Flaechen, damit Kopiertes von einem Blatt auf dem naechsten landet.
     Nur im Speicher — nichts davon wird gesichert. */
  let zwischenablage: any[] = [];
  /* DER RADIERER (E352): drei Arten, wie in GoodNotes — die ganze Marke,
     nur den beruehrten Teil eines Strichs, nur Marker. Die Wahl liegt in
     `zeichnen:radierer` und ueberlebt den Neustart. */
  /* DIE ARTEN DES RADIERERS.
     `ganz` und `teil` sagen, WIE VIEL weggeht; die drei danach sagen,
     WOVON — GoodNotes' „Erase highlighter only", auf Redions Werkzeuge
     übersetzt (E482, L133). Was `nur` nennt, wird allein radiert.

     WARUM NICHT AUCH „NUR BLEISTIFT": der Bleistift ist in Redion kein
     eigenes Werkzeug, sondern ein STIL des Stifts (E375) — er stünde in
     einer Reihe mit Werkzeugen und meinte etwas anderes als sie. Das
     steht in L133. */
  const RADIERER = [
    { id: 'ganz', name: 'Ganz', zeichen: '●', sym: 'eraseAll', titel: 'Radierer: ganze Marken', nur: '' },
    { id: 'teil', name: 'Teil', zeichen: '½', sym: 'eraseHalf', titel: 'Radierer: nur den berührten Teil eines Strichs', nur: '' },
    { id: 'stift', name: 'Stift', zeichen: '✎', sym: 'penFountain', titel: 'Radierer: nur Stiftstriche — Marker, Band und Formen bleiben', nur: 'stift' },
    { id: 'marker', name: 'Marker', zeichen: '▰', sym: 'eraseMarker', titel: 'Radierer: nur Marker', nur: 'marker' },
    /* `nur` NENNT DIE MARKENART, NICHT DEN MODUS (E489).
       Hier stand `nur: 'band'` — und das Abdeckband heisst als Marke
       `abdeck` (so setzt es `art: tool` beim Zeichnen, so liest es
       `zeichneMarke`). Der Modus „Band" radierte deshalb NICHTS: er
       verglich gegen eine Art, die es im Bestand nicht gibt.
       Die Kennung des MODUS bleibt `band` — sie steht so in `meta` bei
       jedem, der ihn einmal gewählt hat, und sie umzubenennen wäre eine
       Datenwanderung ohne Gewinn (§53.3). */
    { id: 'band', name: 'Band', zeichen: '▭', titel: 'Radierer: nur Abdeckband', nur: 'abdeck' }
  ] as const;
  /** Die Markenart, auf die ein Radiermodus sich beschränkt — '' heisst: alle. */
  const RADIER_NUR = (id: string): string =>
    RADIERER.find(r => r.id === id)?.nur || '';
  const RADIER_VORGABE = 'ganz';

  /* DIE FORMEN (E375). Vier Werkzeuge, die dasselbe tun — zwei Punkte
     aufziehen — und sich nur im Ergebnis unterscheiden. Sie stehen deshalb
     als EIN Werkzeug in der Leiste und als vier im Zubehör. Die Kennungen
     sind die alten (`line`, `arrow`, `rectangle`, `ellipse`): sie stehen so
     in jeder gespeicherten Marke, und daran wird nichts geändert (§53.3). */
  const FORMEN = [
    { id: 'line', name: 'Linie', zeichen: '╱', sym: 'formLine', titel: 'Gerade Linie' },
    { id: 'arrow', name: 'Pfeil', zeichen: '→', sym: 'formArrow', titel: 'Pfeil' },
    { id: 'rectangle', name: 'Rechteck', zeichen: '□', sym: 'formRect', titel: 'Rechteck' },
    { id: 'ellipse', name: 'Ellipse', zeichen: '○', sym: 'formEllipse', titel: 'Ellipse' },
    /* ZWEI MEHR, WIE GOODNOTES (E465): das Dreieck und das Rechteck mit
       runden Ecken. Beide sind Zweipunkt-Formen wie die vier davor —
       der Zeichner unterscheidet sie nur im Ergebnis. Neue Kennungen,
       englisch wie die alten, weil sie so in der Marke stehen (§53.3). */
    { id: 'triangle', name: 'Dreieck', zeichen: '△', sym: 'formTriangle', titel: 'Dreieck' },
    { id: 'roundrect', name: 'Rund', zeichen: '▢', sym: 'formRoundrect', titel: 'Rechteck mit runden Ecken' },
    /* DIE KURVE (E483, L133). Sie ist die erste Form mit DREI Punkten:
       Anfang, Ende und der Griff dazwischen, der sie biegt. Gezogen wird
       sie wie eine Linie; danach steht am Rahmen ein zusaetzlicher Griff
       auf dem Mittelpunkt, und wer ihn zieht, biegt die Kurve.

       Warum drei Punkte und kein neues Feld: `pts` ist eine Liste, und
       eine Liste vertraegt einen dritten Eintrag, ohne dass eine einzige
       vorhandene Marke sich aendert (§53.3). `move`, `scale` und `rotate`
       fassen ohnehin ALLE Punkte an — die Kurve wandert, waechst und
       dreht sich damit von selbst richtig. */
    { id: 'curve', name: 'Kurve', zeichen: '⌒', sym: 'formCurve', titel: 'Kurve — nach dem Ziehen biegt der Griff in der Mitte sie' }
  ] as const;
  const FORM_VORGABE = 'line';
  const formArtLesen = (): string => {
    const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:form') || '') : '';
    return FORMEN.some(f => f.id === wert) ? wert : FORM_VORGABE;
  };
  const istForm = (was: string): boolean => FORMEN.some(f => f.id === was);
  const radierModusLesen = (): string => {
    const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:radierer') || '') : '';
    return RADIERER.some(r => r.id === wert) ? wert : RADIER_VORGABE;
  };
  /* ══ DIE GRÖSSE DES RADIERERS WIRD GEMERKT (E576) ═══════════════════════
     Sie stand als `controls.setEraserSize(5)` fest im Aufbau des Studios.
     Gemessen: „groß" wählen, Seite wechseln, zurückkommen — wieder „klein".
     Der Modus daneben (`zeichnen:radierer`) wird seit jeher gemerkt; die
     Grösse war der einzige Schalter dieser Reihe ohne Gedächtnis, und das
     fällt erst auf, wenn man dreimal am Tag dieselbe Wahl wiederholt.
     DREI FESTE WERTE, kein Regler: sie sind die Kreise aus GoodNotes, und
     sie sind auch die Prüfsteine — `setEraserSize` nimmt nur diese drei an,
     damit ein alter oder verbogener Wert nicht als Radiergummi von einem
     Meter Durchmesser ankommt. */
  const RADIER_GROESSEN = [5, 14, 28];
  /* ══ DER HAKEN „AUTOMATISCH AN STRICH ANPASSEN" (E624) ══════════════════
     Ein EIGENER Schlüssel und nicht ein Sonderwert in
     `zeichnen:radierergroesse`: dort stehen auf jedem Gerät, das Redion
     schon benutzt hat, Zahlen. Ein „auto" hineinzuschreiben hiesse, einen
     vorhandenen Wert neu zu deuten — das ist eine Datenänderung, und für
     einen Schalter ist sie nicht nötig (§9). So bleibt die gemerkte Grösse
     stehen, während der Haken an ist, und kommt beim Abwählen zurück. */
  const M_RADIER_AUTO = 'zeichnen:radiererauto';
  const radierAutoLesen = (): boolean =>
    typeof Store !== 'undefined' && String(Store.getMeta(M_RADIER_AUTO, '')) === 'ja';
  const radierGroesseLesen = (): number => {
    const wert = typeof Store !== 'undefined' ? Number(Store.getMeta('zeichnen:radierergroesse')) : NaN;
    return RADIER_GROESSEN.includes(wert) ? wert : RADIER_GROESSEN[0]!;
  };
  /* DIE STIFTE (E351). `kugel` ist der Strich, den es seit E100 gibt — eine
     Breite je Strich. `fueller` und `pinsel` zeichnen eine Flaeche, deren
     Breite dem Druck folgt: der Fueller massvoll, der Pinsel kraeftig.
     Alte Marken ohne `stil` bleiben, wie sie waren (§53.3). */
  const STIFTE = [
    /* `spitze` (E673): auf wie viel seiner Breite der Strich an Anfang und
       Ende ausläuft — der Füller auf ein Viertel, der Pinsel auf ein
       Achtel. Wer keine `spitze` hat, setzt mit voller Breite auf: der
       Bleistift (Graphit hat keine Feder), der Schutzleiter (eine Leitung
       hat eine Stärke, E490), und die Linien ohnehin. Die Zahl steht HIER,
       im Register, nicht als Sonderfall im Zeichner (§8). */
    /* `eile` (E704): um wie viel ein schneller Strich höchstens dünner wird —
       Redurs „bis ~35 %" beim Füller, der Pinsel etwas mehr. */
    { id: 'fueller', name: 'Füller', zeichen: '🖋', sym: 'penFountain', spitze: 0.25, eile: 0.35 },
    { id: 'kugel',   name: 'Kugelschreiber', zeichen: '🖊', sym: 'penBall' },
    { id: 'pinsel',  name: 'Pinsel', zeichen: '🖌', sym: 'penBrush', spitze: 0.12, eile: 0.5 },
    /* DER BLEISTIFT (E465), wie GoodNotes' Pencil: duenn, leicht
       durchscheinend, mit koerniger Kante — die Flaeche des Fuellers,
       nur schmaler und mit 72 % Deckung. Er steht am Ende der Reihe,
       damit der Wechsel Fueller → Kugel → Pinsel bleibt, wie test343 ihn
       kennt. */
    { id: 'bleistift', name: 'Bleistift', zeichen: '✏', sym: 'penPencil' },

    /* DER SCHUTZLEITER (E490, Redurs Wunsch vom 7. September). Kein
       gewöhnlicher Stift, sondern die Leitung, die im Schaltplan grün-gelb
       und strichpunktiert gezeichnet wird — Redion ist eine App für einen
       Elektriker, und das ist der eine Strich, den er täglich braucht.

       ER STEHT AM ENDE DER REIHE, wie der Bleistift aus demselben Grund:
       der Wechsel Füller → Kugel → Pinsel bleibt, wie `test343` ihn kennt. */
    { id: 'schutzleiter', name: 'Schutzleiter', zeichen: '⏚', sym: 'penEarth' },
    /* DER LEITERSTIFT (E509, Redurs Wunsch vom 8. September). Er zeichnet
       nicht anders als der Kugelschreiber — er bringt eine andere
       FARBREIHE mit: die zehn Adern eines Schaltplans, jede mit ihrem
       Namen. „Speziell für Fachzeichen gedacht", und deshalb steht er in
       der Stiftreihe und nicht als sechstes Werkzeug: es ist ein Stift,
       den man führt, kein Ding, das man setzt.

       ER STEHT AM ENDE. Die Reihenfolge Füller → Kugel → Pinsel →
       Bleistift → Schutzleiter ist die, die `test343` kennt und die eine
       Hand sich gemerkt hat; ein neuer Stift in der Mitte hätte jeden
       zweiten Klick woandershin geführt. */
    { id: 'leiter', name: 'Leiter', zeichen: '⌁', sym: 'penWire' }
  ] as const;

  /* ══ DIE FARBEN DES SCHUTZLEITERS ═══════════════════════════════════════
     Grün-gelb ist keine Mischfarbe, sondern ZWEI Farben — deshalb wird der
     Strich zweimal gezeichnet: einmal ganz in Grün, darüber Gelb als
     Strich-Punkt. Was man sieht, ist grün mit gelben Strichen und Punkten,
     genau wie die Ader.

     Die Werte sind die üblichen der Schutzleiter-Kennzeichnung: ein sattes
     Grün und ein Signalgelb, beide dunkel genug für weisses Papier.
     WER DIESEN STIFT WÄHLT, WÄHLT AUCH DIE FARBE — die Farbe der Leiste
     gilt für ihn nicht. Ein Schutzleiter in Blau wäre keiner. */
  const PE_GRUEN = '#158a3a';
  const PE_GELB = '#f2d200';
  /* Strich, Lücke, Punkt, Lücke — als Vielfaches der Strichbreite, damit
     das Muster bei jeder Stärke gleich aussieht.

     DIE ZAHLEN SIND KLEINER, ALS SIE AUSSEHEN (E490, Fund des Bildes).
     `stroke-linecap:round` setzt an JEDES Strichende eine Halbkugel — ein
     gestrichelter Weg wird dadurch je Strich um eine ganze Strichbreite
     länger und jede Lücke um dieselbe kürzer. Der erste Entwurf stand auf
     4 / 2,2 / 0,35 / 2,2; gezeichnet waren daraus 5 / 1,2 / 1,35 / 1,2 —
     das Gelb deckte drei Viertel, und auf dem Bild war die Ader GELB statt
     grün-gelb.

     Jetzt: 3,5 / 4 / 0,1 / 4 → gezeichnet 4,5 / 3 / 1,1 / 3. Das Grün liegt
     mit gut der Hälfte obenauf, und der Strich ist VIERMAL so lang wie der
     Punkt — bei 3 zu 1 sah man auf dem Bild nur eine gestrichelte Linie,
     kein Strich-Punkt. */
  const PE_MUSTER = [3.5, 4, 0.1, 4];
  /* DER NEUTRALLEITER (E509): NUR Striche, kein Punkt. Redur hat es zweimal
     gesagt — „Strich Strich Strich, so nur Strich". Der Unterschied zum
     Schutzleiter ist genau das: vier Zahlen dort (Strich, Lücke, Punkt,
     Lücke), zwei hier. Dieselbe Rechnung in Strichbreiten, damit das
     Muster bei 1 px wie bei 12 px dasselbe Verhältnis hat, und dieselbe
     Vorsicht wegen `stroke-linecap:round` (E490). */
  const N_MUSTER = [2.6, 3.2];

  /* ══ DIE ADERN EINES SCHALTPLANS (E509) ══════════════════════════════════
   * Redur, 8. September: „ein spezieller Stift … das ist speziell für
   * Fachzeichen gedacht. Die Schutzleiter, die Neutralleiter sollte blau
   * sein … dann für L1 braun, L2 schwarz und L3 grau … und für S
   * (Lampendraht) solltest du eine passende Farbe finden … und
   * Korrespondierende 1 und 2 und 3 bis 4 sollten verschiedene Farben
   * haben."
   *
   * DAS IST EIN KATALOG UND KEINE FARBLISTE (§8). Jede Ader bringt vier
   * Dinge mit, die zusammengehören: ihr Kürzel (das im Plan danebensteht),
   * ihren Namen (den ein Mensch liest und ein Vorleser vorliest), ihre
   * Farbe und ihre Strichart. Eine Farbe ohne Namen wäre genau das, was
   * §38 verbietet — eine Auskunft, die nur in der Farbe steckt.
   *
   * WOHER DIE FARBEN KOMMEN, und wo ich gewählt habe:
   *
   *   PE, N, L1, L2, L3   stehen so in der Norm und in Redurs Auftrag:
   *                       grün-gelb, blau, braun, schwarz, grau.
   *   S (Lampendraht)     hat keine genormte Zeichenfarbe. Gewählt ist ein
   *                       kräftiges Orange: es ist warm wie das Licht, an
   *                       dessen Ende es hängt, und es ist der einzige
   *                       Farbton, der zwischen dem Braun von L1 und dem
   *                       Gelb des PE noch Platz hat, ohne mit einem von
   *                       beiden verwechselt zu werden.
   *   1 bis 4             die Korrespondierenden. Vier Töne, die weit
   *                       auseinanderliegen — Magenta, Violett, Türkis,
   *                       Karmin. Nicht vier Nuancen einer Farbe: wer eine
   *                       Kreuzschaltung zeichnet, hat alle vier
   *                       gleichzeitig auf dem Blatt.
   *
   * DER SCHUTZLEITER STEHT NICHT ZWEIMAL DA. Seine Farbe ist `PE_GRUEN`,
   * dieselbe Konstante, die auch der Stift aus E490 zeichnet, und seine
   * Strichart ist genau jener Stift. Der Katalog ist der EINE Ort, an dem
   * eine Ader beschrieben wird; die Stiftliste ist ein Weg dorthin.
   * ---------------------------------------------------------------------- */
  const LEITER = [
    { id: 'pe', kurz: 'PE', name: 'Schutzleiter',        farbe: PE_GRUEN,  stil: 'schutzleiter' },
    { id: 'n',  kurz: 'N',  name: 'Neutralleiter',       farbe: '#1f6fd0', stil: 'neutralleiter' },
    { id: 'l1', kurz: 'L1', name: 'Aussenleiter L1',     farbe: '#7a4a21', stil: 'kugel' },
    { id: 'l2', kurz: 'L2', name: 'Aussenleiter L2',     farbe: '#111111', stil: 'kugel' },
    { id: 'l3', kurz: 'L3', name: 'Aussenleiter L3',     farbe: '#9a9a9a', stil: 'kugel' },
    { id: 's',  kurz: 'S',  name: 'Lampendraht',         farbe: '#e2761b', stil: 'kugel' },
    { id: 'k1', kurz: '1',  name: 'Korrespondierende 1', farbe: '#c2185b', stil: 'kugel' },
    { id: 'k2', kurz: '2',  name: 'Korrespondierende 2', farbe: '#7c3aed', stil: 'kugel' },
    { id: 'k3', kurz: '3',  name: 'Korrespondierende 3', farbe: '#0d9488', stil: 'kugel' },
    { id: 'k4', kurz: '4',  name: 'Korrespondierende 4', farbe: '#4d7c0f', stil: 'kugel' }
  ] as const;

  /* WELCHE ADER GERADE GEFÜHRT WIRD. In `meta`, wie die Stiftwahl selbst:
     wer gestern den Schutzleiter gezogen hat, zieht ihn heute weiter. */
  const M_LEITER = 'zeichnen:leiter';
  const leiterJetzt = (): string =>
    (typeof Store !== 'undefined' ? String(Store.getMeta(M_LEITER, 'pe')) : 'pe');
  const leiterMerken = (id: string): void => {
    if (typeof Store !== 'undefined') Store.setMeta(M_LEITER, id);
  };

  /** Die Ader zu einer Farbe — für den Namen am Tupfer und am Strich. */
  const leiterVon = (id: unknown): typeof LEITER[number] | undefined =>
    LEITER.find(l => l.id === String(id || ''));

  /* DIE FÜNF GEWÖHNLICHEN FARBEN HEISSEN AUCH BEIM NAMEN (E509). Sie
     trugen alle den Titel „Farbe" — beim Überfahren stand also fünfmal
     dasselbe da, und ein Vorleser las fünfmal „Farbe". Redur hat es für
     die Adern verlangt; für die fünf hier gilt derselbe Satz. */
  /* DIE TINTEN (E704): Redurs acht Namen, die Werte gerechnet — auf dem
     Papier mindestens 5,6 : */
  const TINTEN = [
    ['#2346b5', 'Königsblau'], ['#1b2552', 'Nachtblau'], ['#b12f4f', 'Karmin'],
    ['#1d6024', 'Tannengrün'], ['#0c6d7f', 'Petrol'], ['#5f3295', 'Aubergine'],
    ['#662f05', 'Sepia'], ['#3c3c3c', 'Graphit']
  ] as const;
  /* DIE LEUCHTFARBEN DES MARKERS (E704), Sonnengelb zuerst; die Pastelle
     aus E697 bleiben unter „Weitere Farben". */
  const LEUCHTFARBEN = [
    ['#ffcf33', 'Sonnengelb'], ['#3ee06a', 'Leuchtgrün'], ['#2ec5ff', 'Leuchtblau'],
    ['#ff5cb8', 'Pink'], ['#ff9a2e', 'Orange'], ['#a879ff', 'Lila']
  ] as const;
  const MARKER_PASTELLE = [
    ['#ffcf33', 'Sonnengelb'], ['#79cf8b', 'Mintgrün'], ['#65c9ed', 'Himmelblau'],
    ['#ed91be', 'Rosé'], ['#b39aef', 'Lavendel'], ['#f3aa66', 'Apricot']
  ] as const;
  /* „Weiss" für dunkles Papier (E704, farben-12): auf einer eingelesenen
     dunklen Folie ist Schwarz 1,2 : 1 — unsichtbar. */
  const PAPIERWEISS = '#f5f5f0';
  const FARBNAMEN: Record<string, string> = {
    '#111111': 'Schwarz', '#d64545': 'Rot', '#2f7ed8': 'Blau',
    '#3aa757': 'Grün', '#e0a419': 'Gelb',
    /* Seit E704 heissen auch die Tinten, die Leuchtfarben und die
       Pastelle beim Namen — an jedem Tupfer, den sie einmal werden. */
    ...Object.fromEntries([...TINTEN, ...LEUCHTFARBEN, ...MARKER_PASTELLE]),
    [PAPIERWEISS]: 'Weiss'
  };
  /* ══ DIE WERKZEUGE — EINE BESTELLUNG, KEINE LISTE (E490, E694) ══════════
     Bis E490 standen Kennung, Zeichen, Wort und Beschreibung jedes
     Werkzeugs als Aufruf in der Zeile, die die Leiste baut — nirgends
     sonst. E490 zog sie hierher zusammen, und das war richtig, solange
     diese Datei die einzige Leserin war.

     SEIT E689 IST SIE ES NICHT MEHR. `Register.werkzeuge` hält denselben
     Satz für alle Flächen, und damit standen dieselben vierzehn Werkzeuge
     an zwei Stellen — genau der Fall, vor dem §8 warnt, und wörtlich der
     Fehler, den `test266` einmal gefunden hat, als „Abdecken" hier still
     zu „Abdeckband" wurde und im Menüband nicht.

     HIER STEHT DESHALB NUR NOCH DIE REIHENFOLGE. Sie gehört dem Studio:
     `ordnungAbgleichen` (unten) lässt den Nutzer sie umstellen und braucht
     eine Ausgangsfolge. Ein Name, ein Zeichen oder ein Titel gehört NICHT
     mehr hierher; wer eines ändern will, ändert `src/register/werkzeuge.ts`.
     `test572 §3` hält das — er lässt in dieser Datei keine Liste mit
     `name:` mehr zu.

     DIE KENNUNG IST DIE MARKENART. `art: tool` beim Zeichnen macht aus dem
     Werkzeug `abdeck` die Marke `abdeck`. Was E489 gekostet hat, ist genau
     der Unterschied zwischen dieser Kennung und der eines Radiermodus —
     und es ist der Grund, warum die Kennungen hier deutsch aussehen und es
     bleiben (§53.3: ein Feldname ist ein Datenwort).

     `formen` ist kein Werkzeug, sondern ein Knopf für sieben (E375). Er
     steht in der Bestellung mit, damit die Leiste an EINER Folge hängt,
     und wird beim Bauen eigens behandelt; die Formen selbst stehen in
     `FORMEN` — mit eigenen, ENGLISCHEN Kennungen, weil sie so in jeder
     gespeicherten Marke stehen. */
  /* DER TYP IST ANGESCHRIEBEN, weil `Register` ein `any` ist (global.d.ts).
     Ohne diese Zeile wuerde `WERKZEUGE` zu `any[]`, und das faellt nicht
     hier auf, sondern zwei Dateien weiter: `document-mode.ts:2036` liest
     `Marken.WERKZEUGE` und bekaeme lauter implizite `any` (E572). Ein
     verlorener Typ wandert (§52.7). */
  const WERKZEUGE: GfxWerkzeug[] = Register.werkzeuge.auswahl([
    'schreiben', 'select', 'stift', 'marker', 'formen', 'abdeck', 'zettel',
    'text', 'textfix', 'zeichen', 'elemente', 'bild', 'radierer', 'laser'
  ]);

  /* ZWEI ARTEN, WIE IN GOODNOTES: ein Punkt, der mitgeht, oder eine Linie,
     die hinter ihm herläuft und verblasst. */
  const LASER = [
    { id: 'punkt', zeichen: '•', name: 'Punkt', titel: 'Ein Punkt, der dem Zeiger folgt' },
    { id: 'linie', zeichen: '⌇', name: 'Linie', titel: 'Eine Spur, die hinter dem Zeiger herläuft und verblasst' }
  ] as const;
  /* ══ WO DIE LEISTE STEHT (E512) ═════════════════════════════════════════
     Redur, 8. September: „und die Stift[leiste] sollte ich als komplett
     bewegen können, also nach links, rechts, Mitte und ganz oben."

     Vier Plätze, EIN Katalog (§8) — Kennung, Zeichen, Name. Die Reihenfolge
     ist die des Rundlaufs: oben (wie bisher) → links → rechts → unten in
     der Mitte, wie die schwebende Leiste in GoodNotes. Gemerkt wird der
     Platz in `meta`, also überlebt er das Schliessen.

     FÜNFTER EINTRAG SEIT E620: `frei`. Er steht NICHT im Rundlauf — dorthin
     führt nur das Ziehen am Griff, und ein Tipp muss weiter berechenbar
     bleiben. Trotzdem gehört er in DIESEN Katalog und nicht in eine zweite
     Liste daneben (§8): Name, Zeichen und Symbol braucht er genauso, und
     zwei Kataloge für dieselbe Sache laufen auseinander. */
  const LAGEN = [
    { id: 'oben',   zeichen: '⤒', sym: 'dockTop', name: 'oben', nurZiehen: false },
    { id: 'links',  zeichen: '⇤', sym: 'dockLeft', name: 'links', nurZiehen: false },
    { id: 'rechts', zeichen: '⇥', sym: 'dockRight', name: 'rechts', nurZiehen: false },
    { id: 'unten',  zeichen: '⤓', sym: 'dockBottom', name: 'unten in der Mitte', nurZiehen: false },
    { id: 'frei',   zeichen: '✥', sym: 'dockFree', name: 'frei stehend', nurZiehen: true }
  ] as const;
  /** Der nächste Platz IM RUNDLAUF — `frei` wird dabei übersprungen. */
  const naechsteLage = (von: number): typeof LAGEN[number] => {
    for (let s = 1; s <= LAGEN.length; s++) {
      const l = LAGEN[(von + s + LAGEN.length) % LAGEN.length]!;
      if (!l.nurZiehen) return l;
    }
    return LAGEN[0]!;
  };
  /* ══ DIE GRUPPEN, EINMAL AUFGESCHRIEBEN (E570) ═══════════════════════════
     Welche Gruppe zu welchem Werkzeug erscheint, steht seit E356 im
     Stilblatt — das bleibt dort, denn es ist eine Sichtbarkeitsregel. Was
     hier dazukommt, ist etwas anderes: der NAME einer Gruppe, damit ein
     Mensch sie in einer Liste wiedererkennt, und die Reihenfolge, in der
     sie stehen.

     `form` und `formen` heissen fast gleich und sind zweierlei — die eine
     ist die Formenwahl, die andere sind zwei Schalter. In der Leiste fällt
     das nicht auf, weil man Zeichen sieht; in einer Liste mit Wörtern
     wäre es die erste Verwechslung. Deshalb tragen sie hier Namen, die
     sich unterscheiden lassen.

     DIE REIHENFOLGE HIER IST DIE VORGABE, und sie ist NICHT frei gewählt:
     sie ist die, die bis E570 als `+1` bis `+5` im Stilblatt stand und die
     `test348` seit E356 hält — erst die Spielart (Stifte, Formen, Laser),
     dann Farbe und Breite, dann die Schalter. Redurs Satz aus E512 hängt
     daran: „die Stiftreihe … sollte neben es, also links unten, wo die
     Farben dort sind." Steht etwas anderes zwischen dem Stift und den
     Farben, ist dieser Satz gebrochen — am Telefon um 100 px, gemessen.

     DER VERLAUF STEHT AM ENDE, weil „Zurück" und „Vor" zu jedem Werkzeug
     gehören und zu keinem (E568). Bis E570 war das eine Zeile `order:1` im
     Stilblatt; jetzt ist es der letzte Katalogeintrag, und Redur kann ihn
     verschieben, ohne dass jemand eine CSS-Datei aufmacht. */
  const GRUPPEN = [
    /* ERST DIE SPIELART DES WERKZEUGS … */
    { id: 'stil',     name: 'Stifte' },
    { id: 'form',     name: 'Formenwahl: Linie, Pfeil, Rechteck …' },
    { id: 'laser',    name: 'Laser: Punkt oder Spur' },
    { id: 'radierer', name: 'Radierer: Ganz, Teil, Stift …' },
    { id: 'schrift',  name: 'Schrift' },
    { id: 'auswahl',  name: 'Auswahl: Kopieren, Löschen, Sperren …' },
    { id: 'elemente', name: 'Elemente' },
    /* … dann, WOMIT es zeichnet … */
    { id: 'farbe',    name: 'Farben' },
    { id: 'breite',   name: 'Strichbreite' },
    /* … dann die Schalter, die nebenher mitlaufen … */
    { id: 'formen',   name: 'Schalter: Formen erkennen, Kritzeln löscht' },
    { id: 'lineal',   name: 'Lineal' },
    /* … und ganz zuletzt, was zu jedem Werkzeug gehört (E568). */
    { id: 'verlauf',  name: 'Zurück, Vor, Platz, Einrichten' }
  ] as const;

  /* ══ DIE EIGENE ORDNUNG (E570) ═══════════════════════════════════════════
     Redur, 14. September: „Könntest du so machen, dass ich alles, was dort
     ist im Redion, direkt selber ordnen kann?"

     ZWEI LISTEN IN `meta`, wie jede andere Zeichenvorliebe auch — Stift,
     Farbe, Form und der Platz der Leiste liegen seit jeher dort. Damit
     reist die Ordnung in der Sicherung mit (`meta` ist eines der elf
     Fächer, §9) und überlebt den Neustart.

     GESPEICHERT WIRD EINE REIHENFOLGE, KEIN KATALOG (§8). Was es gibt,
     steht weiter in `WERKZEUGE` und `GRUPPEN`; hier steht nur, in welcher
     Folge. Deshalb ist das Lesen keine Übernahme, sondern ein Abgleich:

       · was in der gemerkten Liste steht und den Katalog NICHT kennt,
         fällt weg — eine Kennung aus einer älteren Fassung darf keine
         leere Stelle in der Leiste machen;
       · was der Katalog kennt und die Liste NICHT, wird HINTEN angehängt —
         ein neues Werkzeug erscheint damit von selbst, statt unsichtbar
         zu bleiben, bis jemand zurücksetzt.

     Das ist der ganze Grund, warum hier eine Funktion steht und nicht ein
     `Store.getMeta`. */
  const M_ORDNUNG = 'zeichnen:ordnung';
  type Ordnung = { werkzeuge: string[]; gruppen: string[] };
  const ordnungAbgleichen = (gemerkt: unknown, katalog: readonly string[]): string[] => {
    const liste = Array.isArray(gemerkt) ? gemerkt.map(String) : [];
    const rein = liste.filter((id, i) => katalog.includes(id) && liste.indexOf(id) === i);
    for (const id of katalog) if (!rein.includes(id)) rein.push(id);
    return rein;
  };
  const ordnungLesen = (): Ordnung => {
    const roh = typeof Store !== 'undefined' ? Store.getMeta(M_ORDNUNG) : null;
    const o = roh && typeof roh === 'object' ? roh as Record<string, unknown> : {};
    return {
      werkzeuge: ordnungAbgleichen(o['werkzeuge'], WERKZEUGE.map(w => w.id)),
      gruppen: ordnungAbgleichen(o['gruppen'], GRUPPEN.map(g => g.id))
    };
  };
  const ordnungMerken = (o: Ordnung): void => {
    if (typeof Store === 'undefined') return;
    try { Store.setMeta(M_ORDNUNG, { werkzeuge: o.werkzeuge, gruppen: o.gruppen }); }
    catch { /* dann eben nur diese Sitzung */ }
  };
  const ordnungVergessen = (): void => {
    if (typeof Store === 'undefined') return;
    try { Store.setMeta(M_ORDNUNG, null); } catch { /* dann eben nur diese Sitzung */ }
  };

  /**
   * Die gemerkte Ordnung auf eine gebaute Leiste legen.
   *
   * ES WERDEN KNOTEN VERSCHOBEN, NICHT NEU GEBAUT. `insertBefore` und
   * `appendChild` auf ein Element, das schon im Baum steht, HÄNGEN es um —
   * mit allem, was daran hängt: Zustand, Klassen, Zuhörer. Ein Neubau
   * würde den geführten Stift, die gewählte Farbe und den offenen
   * Stärkeregler wegwerfen.
   *
   * UND DIE DOM-FOLGE IST DIE SICHTBARE FOLGE. Das ist kein Beiwerk: ein
   * Vorleseprogramm und die Tabulatortaste gehen in Dokumentreihenfolge,
   * und wenn die von der sichtbaren abweicht, führt die Tastatur woandershin
   * als das Auge (§38). Am Telefon weicht sie ab — dort schiebt `order` die
   * Gruppen hinter das gewählte Werkzeug (E356) —, und das ist dort mit
   * geschriebenem Grund entschieden. Hier nicht.
   */
  /**
   * Die Fläche, auf der die Knoten wirklich liegen (E614, W2).
   *
   * Seit der Tafel sind die Kinder von `.blatt-werk` nicht mehr die Knöpfe,
   * sondern ein einziges Element. Jeder `:scope > …`-Griff in dieser Datei
   * fragt deshalb die Fläche und nicht die Leiste.
   *
   * DER RÜCKFALL IST ABSICHT: gibt es keine Tafel — eine ältere Leiste, ein
   * Prüflauf, der ein nacktes `.blatt-werk` baut —, ist die Leiste selbst
   * die Fläche. Sonst stiege `ordnungAnwenden` stumm aus und die ganze
   * Nutzerordnung aus E570/E571 wäre wirkungslos, ohne dass etwas meldet.
   */
  const flaeche = (tools: HTMLElement): HTMLElement =>
    tools.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? tools;

  const ordnungAnwenden = (tools: HTMLElement): void => {
    const o = ordnungLesen();
    /* ZWEI FLÄCHEN SEIT E618: die Werkzeuge liegen in der Leiste, das
       Zubehör in der Tafel. Der Zeilenbruch gehört zu den Werkzeugen — er
       trennt sie vom Zubehör und muss ihr Geschwister bleiben. */
    const f = flaeche(tools);
    const bruch = tools.querySelector<HTMLElement>(':scope > .blatt-zeilenbruch');
    if (!bruch) return;
    for (const id of o.werkzeuge) {
      const knopf = tools.querySelector<HTMLElement>(`:scope > [data-wz="${id}"]`);
      if (knopf) tools.insertBefore(knopf, bruch);
    }
    for (const id of o.gruppen) {
      f.querySelectorAll<HTMLElement>(`:scope > [data-gruppe="${id}"]`)
        .forEach(knoten => f.appendChild(knoten));
    }
    ordnungZahlen(tools, o);
    platzSetzen(tools);
  };

  /* DIE ZAHLEN FÜR DAS TELEFON. Dort steht die Leiste in EINER rollenden
     Zeile, und die Gruppen sollen unmittelbar hinter dem gewählten Werkzeug
     liegen (E356) — das geht nur über `order`, weil die DOM-Folge Werkzeuge
     und Zubehör trennt. Bis E570 standen diese Zahlen als dreissig Zeilen
     im Stilblatt, eine je Werkzeug. Jetzt kommen sie aus der Ordnung, und
     das Stilblatt liest nur noch zwei Variablen. */
  const ordnungZahlen = (tools: HTMLElement, o: Ordnung): void => {
    /* HUNDERTERSCHRITTE, NICHT ZEHNER — und das ist gemessen, nicht
       geschätzt. Das alte Stilblatt zählte die Werkzeuge in Zehnern und
       setzte die fünf Gruppen dazwischen (`+1` bis `+5`); zwölf Gruppen
       passen da nicht mehr hinein. Bei Zehnern bekam die Farbgruppe des
       Stifts (Platz 30, zehnte Gruppe) die Zahl 40 — dieselbe wie das
       NÄCHSTE Werkzeug —, und Farben und Breiten standen am Telefon
       hinter dem Marker statt hinter dem Stift. `test356` hat es gemeldet.
       Hundert lässt Platz für neunundneunzig Gruppen. */
    const f = flaeche(tools);
    o.werkzeuge.forEach((id, i) => {
      tools.querySelector<HTMLElement>(`:scope > [data-wz="${id}"]`)
        ?.style.setProperty('--ordnung', String((i + 1) * 100));
    });
    o.gruppen.forEach((id, i) => {
      f.querySelectorAll<HTMLElement>(`:scope > [data-gruppe="${id}"]`)
        .forEach(k => k.style.setProperty('--g-ordnung', String(i + 1)));
    });
  };

  /**
   * Wo das gewählte Werkzeug in der Reihe steht — die Zahl, hinter der die
   * Gruppen einsortiert werden.
   *
   * EINE FORM IST KEIN EIGENES WERKZEUG. `data-tool` trägt beim Formknopf
   * `line`, `curve` und so fort; in der Werkzeugreihe steht aber `formen`.
   * Ohne diese Umrechnung landete das Zubehör der Formen am Anfang der
   * Leiste statt hinter ihrem Knopf.
   */
  const platzSetzen = (tools: HTMLElement): void => {
    const o = ordnungLesen();
    const jetzt = String(tools.dataset.tool || '');
    const id = o.werkzeuge.includes(jetzt) ? jetzt : (istForm(jetzt) ? 'formen' : '');
    const i = o.werkzeuge.indexOf(id);
    tools.style.setProperty('--platz', String(i >= 0 ? (i + 1) * 100 : 0));
  };

  const M_LAGE = 'zeichnen:leistenlage';

  /* ══ EINE SPALTE ENDET IM FENSTER (E696) ═══════════════════════════════
     Links und rechts steht die Leiste als Spalte an der Blatthülle, und sie
     war `78vh` hoch — egal wo sie beginnt. Bei 409 px Abstand von oben
     endete sie 197 px UNTER dem Fensterrand: die letzten Knöpfe, darunter
     der Griff „Platz", gab es nur, wenn man die ganze Seite rollte. Schon
     vor E690 ragte sie 123 px hinaus; seit der Umschalter der Ansichten
     darübersteht, fiel auch der Griff hinunter (test534, gebisected auf
     4d7436d).

     CSS weiss nicht, wo die Spalte beginnt — also sagt es ihr diese Stelle:
     `--reihe-platz` ist der Raum von der Oberkante der Hülle bis 12 px vor
     dem Fensterrand, und `max-height` nimmt den kleineren von ihm und den
     alten `78vh`. Mindestens 220 px, damit eine Spalte eine Spalte bleibt;
     was darin nicht Platz hat, rollt IN der Spalte, wie bisher.

     Der Hörer ist EINE benannte Funktion auf Modulebene: `addEventListener`
     mit derselben Funktion zweimal ist ein Hörer, nicht zwei — egal wie oft
     eine Leiste gebaut wird. */
  const spaltePlatz = (r: HTMLElement): void => {
    if (r.dataset['lage'] !== 'links' && r.dataset['lage'] !== 'rechts') {
      r.style.removeProperty('--reihe-platz');
      return;
    }
    const h = r.parentElement;
    if (!h) return;
    const oben = Math.max(0, h.getBoundingClientRect().top);
    r.style.setProperty('--reihe-platz', Math.max(220, Math.round(window.innerHeight - oben - 12)) + 'px');
  };
  let spalteBild = 0;
  const spaltenNachFenster = (): void => {
    if (spalteBild) return;
    spalteBild = requestAnimationFrame(() => {
      spalteBild = 0;
      document.querySelectorAll<HTMLElement>('.blatt-reihe').forEach(spaltePlatz);
    });
  };

  /* ZWEI ZAHLEN ALS TEXT, durch ein Leerzeichen getrennt: „43.10% 62.80%".
     Prozent, weil ein kleineres Fenster die Leiste sonst hinter den Rand
     schöbe; Text, weil `meta` Text sicher übersteht (§9). */
  const M_FREI = 'zeichnen:leistenfrei';
  const lageJetzt = (): string => {
    const id = typeof Store !== 'undefined' ? String(Store.getMeta(M_LAGE, 'oben')) : 'oben';
    return LAGEN.some(l => l.id === id) ? id : 'oben';
  };
  /** Der gemerkte freie Punkt, oder die Mitte, wenn nichts dasteht. */
  const freiJetzt = (): { x: string; y: string } => {
    const roh = typeof Store !== 'undefined' ? String(Store.getMeta(M_FREI, '')) : '';
    const teile = roh.trim().split(/\s+/);
    const gut = (w: string | undefined): boolean => !!w && /^-?\d+(\.\d+)?%$/.test(w);
    return gut(teile[0]) && gut(teile[1])
      ? { x: teile[0]!, y: teile[1]! }
      : { x: '50%', y: '50%' };
  };
  const M_LASER = 'zeichnen:laser';
  const laserArt = (): string =>
    (typeof Store !== 'undefined' ? String(Store.getMeta(M_LASER, 'punkt')) : 'punkt');
  /* WIE LANGE DER STRAHL NACHLEUCHTET. Kurz genug, dass er nicht im Weg
     steht; lang genug, dass ein Auge ihm folgen kann. */
  const LASER_MS = 700;

  /**
   * Wie eine Marke heisst, für einen Menschen.
   *
   * Erst die Formen (sie sind genauer: „Pfeil" statt „Form"), dann die
   * Werkzeuge. Was beide nicht kennen, behält seine Kennung — eine Marke
   * aus einer neueren Fassung soll sich nennen können, statt „unbekannt"
   * zu heissen (§18: unbekannte Blocktypen nicht löschen, hier sinngemäss).
   */
  const artWort = (art: unknown): string => {
    const id = String(art ?? '');
    return FORMEN.find(f => f.id === id)?.name
      ?? WERKZEUGE.find(w => w.id === id)?.name
      ?? (id || 'Marke');
  };
  /** Das Zeichen zur Art — dieselbe Reihenfolge, dieselbe Quelle. */
  const artZeichen = (art: unknown): string => {
    const id = String(art ?? '');
    return FORMEN.find(f => f.id === id)?.zeichen
      ?? WERKZEUGE.find(w => w.id === id)?.zeichen
      ?? '•';
  };

  const STIL_VORGABE = 'fueller';
  const HOECHSTENS_EIGENE_FARBEN = 4;
  /* WIE VIELE FARBSAETZE (E486).

     Acht war zuerst geraten („passt schon in einen Dialog"), und das Bild
     hat es widerlegt: mit acht Saetzen wurde die Wahl 1019 px hoch in einem
     900 px hohen Fenster, und der letzte Knopf war nicht anklickbar. Das
     war ein Fehler im Dialog, nicht in der Zahl — er ist behoben (die Wahl
     rollt jetzt, siehe `dialog.ts`), und danach nachgemessen: acht Saetze
     plus die drei festen Eintraege sind elf Knoepfe, das Fenster bleibt bei
     750 px im Bild, und der letzte ist auf beiden Groessen erreichbar.

     Wer den NEUNTEN sichern will, bekommt es gesagt — nicht stillschweigend
     den aeltesten weggeworfen (§35). */
  const HOECHSTENS_FARBSAETZE = 8;
  /* WIE VIELE ELEMENTE (E494).

     Die Bibliothek liegt in `meta` — im selben Fach wie die Farbsaetze, und
     damit in jeder Sicherung (§9). Das ist ihr Vorteil (sie reist mit) und
     ihre Grenze: `meta` haelt Einstellungen, keine Anhaenge. Ein Element ist
     eine Handvoll Marken, kein Bild von zwei Megabyte.

     Zwei Zahlen halten das fest, und beide SAGEN es, statt still etwas
     wegzuwerfen (§35): hoechstens sechzig Elemente, und keines ueber
     `HOECHSTENS_ELEMENT_BYTES`. Gemessen ist ein voller handschriftlicher
     Absatz (rund vierzig Striche) etwa 30 KB — sechzig davon waeren 1,8 MB
     in `meta`, und das ist die Obergrenze, die hier bewusst steht. */
  const HOECHSTENS_ELEMENTE = 60;
  const HOECHSTENS_ELEMENT_BYTES = 200 * 1024;
  /* DIE SCHRIFT AUF DEM BLATT (E360, L115 Punkt 6): dieselben fuenf Familien
     wie am Block (E101, Register.textstile), hier als Stapel fuer SVG —
     Attribute kennen keine CSS-Variablen, und der Druck liest sie roh.
     Die Stufen sind die Leiter, auf der A− und A+ gehen. */
  /* DIE LISTE STEHT SEIT E562 IN `geometry.ts` — dort, wo die Breiten
     gemessen werden. Hier bleibt nur der Verweis: ein zweiter Katalog läuft
     mit dem ersten auseinander (§8). */
  const SCHRIFTEN = InkGeometry.SCHRIFTEN as ReadonlyArray<
    { id: string; name: string; stapel: string }>;
  const SCHRIFT_STUFEN: readonly number[] = [11, 13, 16, 20, 26, 34];
  type Schrift = { familie: string; groesse: number; fett: boolean; rahmen: boolean;
                   ausricht: string };
  const SCHRIFT_VORGABE: Schrift = { familie: 'standard', groesse: 16, fett: false,
                                     rahmen: false, ausricht: 'links' };
  /* Die drei Namen sind die des Hauses (`bild-rahmen aus-links`), nicht neue. */
  /* DAS `zeichen` BLEIBT ALS RÜCKFALL (wie bei den Werkzeugen, E515): eine
     Meldung oder ein Eintrag im Inspector braucht ein TEXTzeichen, und dort
     ist ein SVG keine Antwort. In der Leiste steht `sym` (E568). */
  const AUSRICHTUNGEN = [
    { id: 'links',  zeichen: '⭰', sym: 'alignLeft',   name: 'Links' },
    { id: 'mitte',  zeichen: '⭤', sym: 'alignCenter', name: 'Mitte' },
    { id: 'rechts', zeichen: '⭲', sym: 'alignRight',  name: 'Rechts' }] as const;
  const schriftStapel = (id: unknown): string => InkGeometry.schriftStapel(id);
  const schriftLesen = (): Schrift => {
    const roh = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:schrift') : null;
    const s = roh && typeof roh === 'object' ? roh as Record<string, unknown> : {};
    return {
      familie: SCHRIFTEN.some(x => x.id === s.familie) ? String(s.familie) : SCHRIFT_VORGABE.familie,
      groesse: SCHRIFT_STUFEN.includes(Number(s.groesse)) ? Number(s.groesse) : SCHRIFT_VORGABE.groesse,
      fett: !!s.fett, rahmen: !!s.rahmen,
      ausricht: AUSRICHTUNGEN.some(x => x.id === s.ausricht) ? String(s.ausricht) : 'links' };
  };
  const naechsteStufe = (jetzt: number, richtung: number): number => {
    if (richtung > 0) return SCHRIFT_STUFEN.find(v => v > jetzt) ?? SCHRIFT_STUFEN[SCHRIFT_STUFEN.length - 1]!;
    return [...SCHRIFT_STUFEN].reverse().find(v => v < jetzt) ?? SCHRIFT_STUFEN[0]!;
  };
  /** Der Breitenfaktor eines Punkts nach Druck und Stift. */
  /**
   * DIE NEIGUNG SCHATTIERT (E507).
   *
   * Aus dem Stift-Dossier, Seite 8: als Beispiel für reiche Stiftdaten
   * nennt es „ein Pencil-Shading-Modell anhand des Tilt-Winkels" — den
   * Bleistift, den man flach hält, um zu schattieren. Genau die Geste, die
   * jeder von Papier kennt.
   *
   * `neig` ist 0 bei senkrechtem Stift und 1 bei ganz flachem. Sie wirkt
   * NUR auf den Bleistift: ein Füller wird durch Schräghalten nicht
   * breiter (die Feder liegt auf), und ein Kugelschreiber schon gar nicht.
   * Wer keine Neigung meldet — Maus, Finger, ein Stift ohne Sensor —,
   * bekommt 0 und damit genau das Verhalten von vorher.
   */
  const druckFaktor = (stil: string, p: number, neig = 0): number => {
    const d = Math.max(0.05, Math.min(1, Number.isFinite(p) ? p : 0.5));
    const n = Math.max(0, Math.min(1, Number.isFinite(neig) ? neig : 0));
    if (stil === 'pinsel') return 0.3 + d * 1.7;
    /* Der Bleistift schwillt kaum — ein Graphitstift wird mit Druck
       dunkler, nicht breiter; das Bisschen Breite hier ist der Winkel.
       UND SEIT E507 IST DER WINKEL WIRKLICH DER WINKEL: flach gehalten
       liegt mehr Graphit auf dem Papier, bis zum Doppelten. */
    if (stil === 'bleistift') return (0.35 + d * 0.6) * (1 + n * 1.3);
    /* Eine Leitung hat eine Stärke, keine Handschrift (E490). */
    if (stil === 'schutzleiter') return 1;
    return 0.5 + d * 1.0;
  };
  /* ══ DIE DECKUNG EINES STRICHS — EINE STELLE (E623) ══════════════════════
     Sie stand VIERMAL: am Bildschirm beim Pinsel, beim Bleistift und beim
     Marker, und noch einmal im PDF-Export. Der Kommentar über
     `alsAnnotation` behauptet seit E506, Farbe, Breite, Druckkurve und
     Deckkraft stünden „hier und nirgends sonst (§8)" — nachgemessen waren
     es zwei Rechnungen mit denselben Zahlen. Das geht genau so lange gut,
     bis jemand eine davon ändert, und dann sieht das PDF anders aus als
     der Bildschirm, ohne dass ein Lauf etwas merkt.

     Jetzt eine Stelle. Und weil es eine Stelle ist, kann die Strichprobe
     in der Leiste dieselbe Zahl zeigen (E623, die Probe). */
  const deckungVon = (art: string, stil: string, neigung?: number[] | number): number => {
    /* DER KEIL DECKT 0,40 (E704) — Redurs „etwas kräftiger". Der runde
       Marker und jeder alte (ohne `stil`) bleiben bei 0,32. */
    if (art === 'marker') return stil === 'keil' ? 0.4 : 0.32;
    if (stil === 'pinsel') return 0.92;
    if (stil === 'bleistift') {
      /* FLACH IST WEICHER (E507): ein flach gehaltener Bleistift trägt
         breiter auf, aber nicht dunkler. Ohne Neigung bleibt es bei den
         0,72 aus E465 — das hält `test475` §4 fest. */
      const n = Array.isArray(neigung)
        ? (neigung.length ? neigung.reduce((a, b) => a + (Number(b) || 0), 0) / neigung.length : 0)
        : (Number(neigung) || 0);
      return Math.round((0.72 - n * 0.22) * 100) / 100;
    }
    return 1;
  };

  /** Die drei Stifte, die als FLAECHE gezeichnet werden (der Kugelschreiber ist die Linie). */
  const FLAECHEN_STIFTE = new Set(['fueller', 'pinsel', 'bleistift']);

  /* ══ DIE SPITZE EINES STIFTS (E673) ══════════════════════════════════════
     `spitzeVon` liest das Register: 1 heisst „keine Spitze", und genau das
     bekommt jeder Stift, der keine eingetragen hat. `spitzeLaenge` ist der
     Weg, über den die Feder auf volle Breite kommt — gut das Doppelte der
     Grundbreite, mindestens 3 pt, höchstens 12: bei 2,4 pt sind das gut
     fünf Punkte, ein knapper Millimeter Feder. */
  const spitzeVon = (stil: string): number => {
    const s = (STIFTE as readonly { id: string; spitze?: number }[]).find(x => x.id === stil);
    const v = Number(s?.spitze);
    return Number.isFinite(v) && v > 0 && v < 1 ? v : 1;
  };
  const spitzeLaenge = (base: number): number => Math.max(3, Math.min(12, base * 2.2));
  /** Wie stark das Tempo diesen Stift verdünnt (E704) — aus dem Register. */
  const eileVon = (stil: string): number => {
    const s = (STIFTE as readonly { id: string; eile?: number }[]).find(x => x.id === stil);
    const v = Number(s?.eile);
    return Number.isFinite(v) && v > 0 && v < 1 ? v : 0;
  };

  /* ══ DIE HALBEN BREITEN EINES FLÄCHENSTRICHS — EINE STELLE (E673) ═══════
     Sie standen ZWEIMAL, zeichengleich: in `zeichneMarke` für den
     Bildschirm und in `alsAnnotation` für das PDF — derselbe Fund wie bei
     `deckungVon` (E623). Mit der Spitze wären es zwei Rechnungen geworden,
     die auseinanderlaufen können, ohne dass ein Lauf es merkt. Jetzt eine:
     Grundbreite, Druckkurve, Neigung, Spitze. Eine Marke ohne `neigung`
     ist alter Bestand oder mit der Maus gezogen — dann ist die Neigung
     überall 0 (§9: rückwärts denken). */
  const halbeBreiten = (mark: any, points: number[][]): number[] => {
    const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
    const stil = String(mark?.stil || '');
    const druck: number[] = Array.isArray(mark?.pressure) ? mark.pressure.map(Number) : [];
    const neig: number[] = Array.isArray(mark?.neigung) ? mark.neigung.map(Number) : [];
    /* DAS TEMPO (E704): nur eine Marke, die es trägt — also ein neuer Strich
       mit Sensor —, wird im Schnellen dünner. */
    const tempo: number[] = Array.isArray(mark?.tempo) ? mark.tempo.map(Number) : [];
    const eile = tempo.length ? eileVon(stil) : 0;
    const halb = points.map((_p, i) => base / 2 * druckFaktor(stil,
      druck[i] ?? druck[druck.length - 1] ?? 0.5, neig[i] ?? neig[neig.length - 1] ?? 0)
      * (eile ? InkStroke.tempoFaktor(tempo[i] ?? tempo[tempo.length - 1] ?? 0, eile) : 1));
    return InkGeometry.verjuengen(points, halb, spitzeVon(stil), spitzeLaenge(base));
  };

  const svg = (name: string, attributes: Record<string, unknown> = {}): SVGElement => {
    const element = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const idOf = (mark: any): string => String(mark?.id || '');
  const strokeWidth = (mark: any): number => {
    /* EINE BREITE, DIE NICHT ATMET (E704): ein neuer Strich trägt
       `breiteFest`; ein alter hat es nicht und bleibt, wie er war. */
    const fest = Number(mark?.breiteFest);
    if (Number.isFinite(fest) && fest > 0) return fest;
    const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
    const values = Array.isArray(mark?.pressure)
      ? mark.pressure.map(Number).filter((value: number) => Number.isFinite(value)) : [];
    const average = values.length ? values.reduce((sum: number, value: number) => sum + value, 0) / values.length : 0.5;
    const pressureFactor = Math.max(0.55, Math.min(1.55, 0.65 + average * 0.7));
    return base * pressureFactor * (mark?.art === 'marker' ? 4 : 1);
  };

  /** Die Vielecke eines Keilmarkers (E704) — Bildschirm UND PDF. */
  const keilVielecke = (mark: any, punkte: number[][]): InkPoint[][] => {
    const h = strokeWidth(mark);
    return InkGeometry.keil(punkte, h, h * KEIL_DICKE, KEIL_WINKEL);
  };

  /* ══ DAS GRAPHITKORN (E704, ergänzt E465) ════════════════════════════════
     Ein Muster je Farbe und Druckstufe in EINEM verborgenen Halter, feste
     Saat, kein Filter (E465). */
  const GRAPHIT_KACHEL = 3.2;
  const graphitStufe = (mark: any): number => {
    const d: number[] = Array.isArray(mark?.pressure) ? mark.pressure.map(Number).filter(Number.isFinite) : [];
    const mittel = d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0.5;
    return mittel < 0.35 ? 1 : mittel < 0.65 ? 2 : 3;
  };
  const graphitFuellung = (farbe: string, stufe: number): string => {
    const hex = /^#[0-9a-f]{6}$/i.test(farbe) ? farbe.toLowerCase() : '#111111';
    const id = 'redion-graphit-' + hex.slice(1) + '-' + stufe;
    if (typeof document === 'undefined' || !document.body) return hex;
    if (!document.getElementById(id)) {
      let halter = document.getElementById('redion-graphit') as SVGSVGElement | null;
      if (!halter) {
        halter = svg('svg', { id: 'redion-graphit', width: 0, height: 0, 'aria-hidden': 'true',
          focusable: 'false' }) as SVGSVGElement;
        /* Nicht `display:none` — Muster darin fallen in manchen Browsern
           aus. Null mal null und aus dem Fluss genügt. */
        halter.style.position = 'absolute';
        halter.appendChild(svg('defs'));
        document.body.appendChild(halter);
      }
      const k = GRAPHIT_KACHEL;
      const muster = svg('pattern', { id, width: k, height: k, patternUnits: 'userSpaceOnUse' });
      let saat = 7 + stufe * 101;
      const zufall = (): number => { saat = (saat * 16807) % 2147483647; return saat / 2147483647; };
      const r2 = (v: number): number => Math.round(v * 100) / 100;
      /* Der Grund: Graphit liegt nie ganz deckend. */
      muster.appendChild(svg('rect', { width: k, height: k, fill: hex, opacity: [0, 0.42, 0.55, 0.68][stufe] }));
      /* Die Körner — mehr und dichter, je fester gedrückt wurde. */
      const koerner = [0, 20, 26, 32][stufe] ?? 26;
      for (let i = 0; i < koerner; i++) {
        muster.appendChild(svg('rect', { x: r2(zufall() * k), y: r2(zufall() * k),
          width: r2(0.25 + zufall() * 0.45), height: r2(0.2 + zufall() * 0.35),
          fill: hex, opacity: r2(0.35 + zufall() * 0.65) }));
      }
      /* Und das Papier, das zwischen den Körnern durchscheint. */
      for (let i = 0; i < 8; i++) {
        muster.appendChild(svg('rect', { x: r2(zufall() * k), y: r2(zufall() * k),
          width: r2(0.3 + zufall() * 0.3), height: 0.25, fill: '#fff', opacity: r2(0.25 + zufall() * 0.35) }));
      }
      halter.querySelector('defs')?.appendChild(muster);
    }
    return `url(#${id}) ${hex}`;
  };

  /** Die Spitze des Markers merken (E704) — für den nächsten Strich. */
  const markerSpitzeMerken = (id: string): void => {
    if (typeof Store === 'undefined' || !MARKER_SPITZEN.some(sp => sp.id === id)) return;
    try { Store.setMeta(M_MARKER_SPITZE, id); } catch { /* dann eben nur diese Sitzung */ }
  };

  /* WCAG: relative Helligkeit und Kontrast (E704, farben-12). */
  const alsRgb = (farbe: string): [number, number, number] => {
    const t = String(farbe || '').trim().toLowerCase();
    const kurz = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(t);
    const lang = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(t);
    if (lang) return [parseInt(lang[1]!, 16), parseInt(lang[2]!, 16), parseInt(lang[3]!, 16)];
    if (kurz) return [parseInt(kurz[1]! + kurz[1]!, 16), parseInt(kurz[2]! + kurz[2]!, 16), parseInt(kurz[3]! + kurz[3]!, 16)];
    const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t);
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    return [255, 255, 255];
  };
  const relativeHelligkeit = (farbe: string): number => {
    const [r, g, b] = alsRgb(farbe).map(v => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const kontrastZu = (a: string, b: string): number => {
    const x = relativeHelligkeit(a), y = relativeHelligkeit(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  /** Das Papier unter einer Zeichenfläche: `--paper` dort, wo sie liegt (das
     Blatt setzt es aus seiner Grundfarbe, E558; eine eingelesene Folie aus
     ihrem Hintergrund). (E704) */
  const papierfarbeVon = (el: Element | null | undefined): string => {
    if (!el || typeof getComputedStyle !== 'function') return '#ffffff';
    const roh = getComputedStyle(el).getPropertyValue('--paper').trim();
    if (!roh) return '#ffffff';
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(roh)) return roh.toLowerCase();
    const probe = document.createElement('span');
    probe.style.color = roh;
    document.body.appendChild(probe);
    const wert = getComputedStyle(probe).color;
    probe.remove();
    return wert || '#ffffff';
  };

  /* DIE STRICHPROBE IST EIN STRICH (E704): ein Schwung mit Druckbogen,
     gezeichnet von `zeichneMarke` — derselbe Zeichner wie das Blatt. */
  const strichprobeMarke = (art: 'stift' | 'marker', stil: string, farbe: string, breite: number): any => {
    const n = 24;
    const pts: number[][] = [];
    const pressure: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = art === 'marker' ? 5 + t * 120 : 6 + t * 188;
      const y = art === 'marker' ? 7 - Math.sin(t * Math.PI) * 0.8 : 13 + Math.sin(t * Math.PI * 2.1) * 5 * (1 - 0.35 * t);
      pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
      pressure.push(Math.round((t < 0.5 ? 0.3 + t * 1 : 0.8 - (t - 0.5) * 0.9) * 100) / 100);
    }
    const mark: any = { id: 'strichprobe', art, farbe, breite: Math.max(0.5, Math.min(art === 'marker' ? 3.2 : 4, breite)), pts, pressure };
    if (stil) mark.stil = stil;
    return mark;
  };
  const strichprobeBild = (mark: any): SVGSVGElement => {
    /* Das Feld ist so breit wie die Probe (sonst schrumpft `meet` sie auf die
       Höhe): (E704) */
    const bild = svg('svg', { viewBox: mark?.art === 'marker' ? '0 0 130 14' : '0 0 200 26', preserveAspectRatio: 'xMidYMid meet',
      'aria-hidden': 'true', focusable: 'false' }) as SVGSVGElement;
    const node = zeichneMarke(mark);
    if (node) {
      /* Die Deckung trägt das `<i>` darum herum — eine zweite am Pfad
         verdoppelte sie. Das Mischen mit dem Papier ebenso. */
      node.removeAttribute('opacity');
      (node as SVGElement).style.removeProperty('mix-blend-mode');
      node.removeAttribute('data-sid');
      bild.appendChild(node);
    }
    return bild;
  };

  /* ══ EINE MARKE ALS PDF-ANNOTATION (E506) ════════════════════════════════
   * Der PDF-Export schreibt Handschrift seit E506 nicht mehr ins Bild,
   * sondern als echte `/Ink`-Annotation. WAS dabei herauskommt, entscheidet
   * dieselbe Stelle, die auch auf den Bildschirm zeichnet — Farbe, Breite,
   * Druckkurve und Deckkraft stehen hier und nirgends sonst (§8). Eine
   * zweite Rechnung im Export liefe von dieser weg, und dann sähe das PDF
   * anders aus als der Bildschirm.
   *
   * NUR STIFT UND MARKER. Das sind die Marken, die Handschrift SIND: eine
   * Punktfolge mit Druck. Alles andere bleibt im Seitenbild, und zwar aus
   * je eigenem Grund:
   *
   *   `abdeck`   MUSS im Bild bleiben. Ein Abdeckband, das eine
   *              Annotation wäre, liesse sich beim Empfänger
   *              wegschieben — und darunter käme zum Vorschein, was
   *              abgedeckt werden sollte. Im Bild sind die Pixel darunter
   *              wirklich weg.
   *   Formen     Rechteck, Ellipse, Dreieck, Pfeil und Kurve liegen als
   *              zwei bis drei Stützpunkte in der Ablage, nicht als
   *              Punktzug. PDF hätte dafür `/Square`, `/Circle` und
   *              `/Line`; das ist ein eigener Bogen und steht in
   *              `LUECKEN.md`.
   *   Text,      brauchten `/FreeText` mit eingebetteter Schrift — auch
   *   Zettel     ein eigener Bogen (Dossier S.10).
   *   Bild,      wären `/Stamp` mit eigenem Bild-XObject.
   *   Fachzeichen
   * ---------------------------------------------------------------------- */
  const annotierbar = (mark: any): boolean =>
    !!mark && (mark.art === 'stift' || mark.art === 'marker')
    && InkGeometry.points(mark.pts).length >= 2;

  /** `#rrggbb` zu drei Werten von 0 bis 1. Unlesbares wird schwarz. */
  const farbeRgb = (wert: unknown): [number, number, number] => {
    const t = String(wert || '').trim();
    const kurz = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(t);
    const lang = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(t);
    const teile = lang ? [lang[1]!, lang[2]!, lang[3]!]
      : kurz ? [kurz[1]! + kurz[1]!, kurz[2]! + kurz[2]!, kurz[3]! + kurz[3]!] : null;
    if (!teile) return [0, 0, 0];
    return teile.map(h => Math.round(parseInt(h, 16) / 255 * 1000) / 1000) as [number, number, number];
  };

  /**
   * Was der PDF-Schreiber von dieser Marke wissen muss.
   *
   * `kontur` ist das gefüllte Vieleck mit VERÄNDERLICHER Breite — dort,
   * wo der Bildschirm eine Fläche zeichnet (Füller, Pinsel, Bleistift).
   * Wo er eine Linie zieht (Kugelschreiber, Marker, Schutzleiter), bleibt
   * `null`, und der Schreiber streicht die Mittellinie mit fester Breite.
   * Dieselbe Unterscheidung wie in `zeichneMarke`, aus derselben Menge.
   */
  const alsAnnotation = (mark: any): {
    striche: number[][][]; kontur: Array<number[][] | number[][][] | null>;
    farbe: [number, number, number]; breite: number; deckkraft: number; name: string;
  } | null => {
    if (!annotierbar(mark)) return null;
    const punkte = InkGeometry.points(mark.pts);
    const base = Math.max(0.5, Number(mark.breite) || BREITEN[1]);
    const flaeche = mark.art === 'stift' && FLAECHEN_STIFTE.has(String(mark.stil));
    /* DIE NEIGUNG GEHT MIT INS PDF (E507). Ohne sie käme ein schattierter
       Bleistiftstrich dünner heraus, als er auf dem Bildschirm aussah —
       und der Export soll zeigen, was dasteht. */
    const neig: number[] = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
    /* Die halben Breiten kommen seit E673 aus `halbeBreiten` — derselben
       Rechnung wie am Bildschirm, mit der Spitze. */
    /* E704: ein Vieleck je Lauf (Gelenke); ohne Ecke EINES wie vorher. */
    const teile: number[][][] = flaeche && punkte.length >= 3
      ? InkGeometry.outlineTeile(punkte, halbeBreiten(mark, punkte))
      : [];
    /* DER KEIL (E704) ist eine Fläche, keine Linie: seine Vielecke gehen
       mit EINEM `f` ins PDF — so deckt die Überlappung nicht doppelt. */
    const keil = mark.art === 'marker' && mark.stil === 'keil'
      ? keilVielecke(mark, punkte) : [];
    const kontur = keil.length ? keil : teile;
    return {
      striche: [punkte.map(q => [q[0], q[1]])],
      kontur: [kontur.length === 1 ? kontur[0]!.map(q => [q[0]!, q[1]!])
        : kontur.length > 1 ? kontur.map(t => t.map(q => [q[0]!, q[1]!])) : null],
      farbe: farbeRgb(mark.farbe),
      /* Der Marker ist auf dem Bildschirm viermal so breit wie seine Zahl
         (siehe `strokeWidth`) — im PDF muss er dieselbe Breite haben. (E704) */
      breite: Number(mark.breiteFest) > 0 ? Number(mark.breiteFest)
        : mark.art === 'marker' ? base * 4 : base,
      /* Der Bleistift ist durchscheinend, und flach gehalten noch mehr —
         dieselbe Zahl wie am Bildschirm, und seit E623 buchstäblich
         dieselbe: eine Funktion, zwei Aufrufer. */
      deckkraft: deckungVon(String(mark.art), String(mark.stil), neig),
      name: mark.art === 'marker' ? 'Marker' : 'Handschrift'
    };
  };

  const arrowPath = (start: InkPoint, end: InkPoint): string => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const angle = Math.atan2(dy, dx);
    const head = Math.max(10, Math.min(24, Math.hypot(dx, dy) * 0.22));
    const left = [end[0] - head * Math.cos(angle - Math.PI / 6),
                  end[1] - head * Math.sin(angle - Math.PI / 6)];
    const right = [end[0] - head * Math.cos(angle + Math.PI / 6),
                   end[1] - head * Math.sin(angle + Math.PI / 6)];
    return `M${start[0]} ${start[1]} L${end[0]} ${end[1]} ` +
      `M${left[0]} ${left[1]} L${end[0]} ${end[1]} L${right[0]} ${right[1]}`;
  };

  /* EIN BILD AUF DEM BLATT (E357, L115 Punkt 6). Die Datei liegt in der
     Ablage — in Stuecken, nie als Data-URL in der Marke —, die Marke traegt
     nur ihre Kennung und zwei Ecken. Die Adresse (eine Objekt-URL) kennt
     `Dateien`; ist sie schon bekannt, zeichnet `zeichneMarke` das Bild
     sofort, und genau darauf verlassen sich Druck und Folien, die synchron
     lesen. Ist sie noch nicht da, steht ein Platzhalter, und die Adresse
     kommt nach — oder sie kommt nicht, und der Platzhalter sagt es. */
  const BILD_FEHLT = 'Bild fehlt';
  const bildPlatzhalter = (box: InkBounds, wort = ''): SVGElement[] => {
    const rahmen = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height,
      rx: 2, class: 'blatt-bild-fehlt' });
    if (!wort) return [rahmen];
    const groesse = Math.max(7, Math.min(14, box.height / 6, box.width / 8));
    const text = svg('text', { x: box.x + box.width / 2, y: box.y + box.height / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': groesse,
      'font-family': 'system-ui, sans-serif', class: 'blatt-bild-fehlt-wort' });
    text.textContent = wort;
    return [rahmen, text];
  };
  const bildNachladen = (dateiId: string, gruppe: SVGElement): void => {
    if (typeof Dateien === 'undefined' || typeof Dateien.adresse !== 'function') return;
    Promise.resolve(Dateien.adresse(dateiId)).then((url: string | null) => {
      /* Der Kasten wird JETZT vom Platzhalter gelesen, nicht von damals:
         beim Ziehen flickt `updateNode` seine Lage, und die Antwort soll
         dort landen, wo das Bild inzwischen steht. Ohne Platzhalter ist
         die Gruppe ersetzt worden — dann zeichnet der Ersatz selbst. */
      const rahmen = gruppe.querySelector('.blatt-bild-fehlt');
      if (!rahmen) return;
      const box: InkBounds = { x: Number(rahmen.getAttribute('x')), y: Number(rahmen.getAttribute('y')),
        width: Number(rahmen.getAttribute('width')), height: Number(rahmen.getAttribute('height')) };
      gruppe.querySelectorAll('.blatt-bild-fehlt, .blatt-bild-fehlt-wort').forEach(node => node.remove());
      if (url) {
        gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
          href: url, preserveAspectRatio: 'none' }));
      } else {
        bildPlatzhalter(box, BILD_FEHLT).forEach(node => gruppe.appendChild(node));
      }
    }).catch(() => { /* der Platzhalter bleibt stehen */ });
  };

  /** Zwei Nachkommastellen — fuer `transform`-Werte, die sonst als
   *  0.30000000000000004 im Baum stehen. */
  const rund2 = (wert: number): number => Math.round(wert * 100) / 100;

  /* ---- DER VERLAUF AM ABDECKBAND (E545) ---------------------------------
   * PowerPoint füllt den Deckel über einer Antwort nicht einfarbig: in
   * Redurs Datei ist es weiss → `#FFCC00` in der Mitte → weiss, senkrecht.
   * Redion las davon bisher eine Farbe (E542) und malte eine Fläche.
   *
   * EIN <defs> FÜR DAS GANZE BLATT, nicht eines je Marke. Der Grund ist
   * nicht Sparsamkeit, sondern Haltbarkeit: `redraw` sammelt `[data-sid]`
   * und schiebt die Knoten mit `insertBefore` in die Reihenfolge der
   * Marken, `updateNode` ersetzt einen Knoten durch einen frischen, und der
   * Radierer nimmt `nodeFor(id)?.remove()`. Läge die Vorlage in einer
   * eigenen Gruppe um das Rechteck, risse der erste dieser drei Griffe sie
   * ab — der Deckel zeigte dann ins Leere, und das sieht niemand, weil
   * nichts abstürzt. Gemessen wurde das nicht, es wurde nachgelesen; die
   * drei Stellen stehen oben im Quelltext.
   * -------------------------------------------------------------------- */
  /**
   * Die Kennung der Verlauf-Vorlage — GESÄUBERT, nicht durchgereicht.
   *
   * Gefunden auf dem Bild, nicht im Code (§55.1): ein Deckel wurde SCHWARZ.
   * Eine Markenkennung ist Text aus den Daten und darf alles enthalten; mit
   * einem Leerzeichen oder Umlaut darin ist `url(#…)` kein gültiger Verweis
   * mehr, und dann greift nicht etwa der Rückfall daneben, sondern der
   * ANFANGSWERT von `fill` — Schwarz. Gedeckt bleibt die Antwort dabei, das
   * ist das Gute daran; richtig aussehen tut es nicht.
   *
   * Redions eigene Kennungen sind harmlos (`m` + Zufall, oder eine UUID).
   * Eine eingelesene oder eingespielte Marke bringt ihre eigene mit.
   */
  const verlaufId = (mark: any): string =>
    'rv-' + String(idOf(mark) || '').replace(/[^A-Za-z0-9_-]/g, '_');

  const verlaufVon = (mark: any): { stopps: Array<{ pos: number; farbe: string }>;
                                    winkel: number } | null => {
    const v = mark?.verlauf;
    if (!v || !Array.isArray(v.stopps) || v.stopps.length < 2) return null;
    const stopps = v.stopps
      .filter((s: any) => s && typeof s.farbe === 'string' && Number.isFinite(Number(s.pos)))
      .map((s: any) => ({ pos: Math.min(1, Math.max(0, Number(s.pos))), farbe: String(s.farbe) }));
    return stopps.length >= 2 ? { stopps, winkel: Number(v.winkel) || 0 } : null;
  };

  /**
   * Die Verlauf-Vorlagen einer Markenliste als EIN `<defs>` — oder `null`.
   *
   * Wer Marken in ein eigenes `<svg>` schreibt (Vortrag, Druck, Seitenbild,
   * Ausschnitt für die Erkennung), hängt das hier VOR die Marken. Wer es
   * vergisst, bekommt keinen Fehler: der Deckel fällt auf seine feste Farbe
   * zurück (siehe `zeichneMarkeRoh`, Zweig `abdeck`).
   */
  const verlaufDefs = (liste: any[]): SVGElement | null => {
    const mit = (Array.isArray(liste) ? liste : [])
      .filter(m => m && m.art === 'abdeck' && verlaufVon(m));
    if (!mit.length) return null;
    const defs = svg('defs', { 'data-ink-defs': '1' });
    for (const mark of mit) {
      const v = verlaufVon(mark)!;
      /* OOXML zählt in 60000steln Grad, 0 = nach rechts, im Uhrzeigersinn.
         5400000 sind 90°, also von oben nach unten — der Normalfall bei
         einem Abdeckband. Die Achse geht durch die Mitte des Kastens,
         deshalb 0.5 ± Hälfte der Richtung. */
      const bogen = ((Number(v.winkel) || 0) / 60000) * Math.PI / 180;
      const dx = Math.cos(bogen) / 2, dy = Math.sin(bogen) / 2;
      const g = svg('linearGradient', {
        id: verlaufId(mark), gradientUnits: 'objectBoundingBox',
        x1: (0.5 - dx).toFixed(4), y1: (0.5 - dy).toFixed(4),
        x2: (0.5 + dx).toFixed(4), y2: (0.5 + dy).toFixed(4) });
      for (const stopp of v.stopps)
        g.appendChild(svg('stop', { offset: stopp.pos.toFixed(4), 'stop-color': stopp.farbe }));
      defs.appendChild(g);
    }
    return defs;
  };

  /** Bildschirm, Druck und Praesentation rufen denselben Zeichner auf. */
  /* DIE DREHUNG (E466) liegt als `transform` am fertigen Knoten — ein
     Zweig fuer alle Bauarten, weil jede Bauart ihren eigenen Rueckweg
     hat. Linienzuege tragen ihre Drehung in den Punkten, sie brauchen
     keine. Die Mitte ist die Mitte des Kastens; `bounds` gibt bei
     gedrehten Marken den Kasten der gedrehten Ecken, dessen Mitte
     dieselbe ist. */
  const zeichneMarke = (mark: any): SVGElement | null => {
    const node = zeichneMarkeRoh(mark);
    const grad = Number(mark?.dreh);
    if (node && Number.isFinite(grad) && grad !== 0 && !InkGeometry.LINIEN.has(String(mark?.art || ''))) {
      const b = InkGeometry.bounds(mark);
      node.setAttribute('transform', `rotate(${grad} ${Math.round((b.x + b.width / 2) * 100) / 100} ${Math.round((b.y + b.height / 2) * 100) / 100})`);
    }
    /* EIN VERWEIS AN DER MARKE (E468): `href` nach draussen oder
       `zielSeite` in Redion. Kein eigener Markentyp — jede Marke kann
       einer sein. Der Knoten wird greifbar (auch ein Strich, der es sonst
       nicht ist) und sagt im Hinweis, wohin er fuehrt. */
    if (node && mark && (mark.href || mark.zielSeite)) {
      node.setAttribute('data-verweis', mark.href ? 'aussen' : 'seite');
      node.setAttribute('pointer-events', 'all');
      const hinweis = svg('title');
      hinweis.textContent = mark.href ? String(mark.href)
        : 'Zur Seite „' + String(Store.getBlock(String(mark.zielSeite))?.text || 'Ohne Titel') + '"';
      node.appendChild(hinweis);
      /* EIN STRICH IST ZU DÜNN ZUM TREFFEN (E484, L133, §37).
         „Ein Strich trägt seinen Verweis, ist aber dünn; ein Kasten um ihn
         ist der bessere Träger." — der Kasten wäre aber falsch: ein Bogen
         um eine halbe Seite hätte einen Kasten über die halbe Seite, und
         der finge alles ein, was daneben steht (dieselbe Lehre wie E476).

         Also derselbe WEG, nur breiter: eine Kopie des Pfades ohne
         Füllung, mit durchsichtiger Strichfarbe und 24 Punkten Breite,
         hinter dem sichtbaren. Sie malt nichts und trifft alles, was
         näher als zwölf Punkte liegt. `cloneNode(false)` nimmt genau die
         Geometrie mit und sonst nichts.

         Nur für Linienzüge: Rechteck, Ellipse und die anderen Formen sind
         seit E353 ohnehin in ihrer Fläche greifbar. */
      const art = String(mark.art || '');
      if (InkGeometry.LINIEN.has(art) && node.tagName.toLowerCase() === 'path') {
        const gruppe = svg('g');
        const feld = node.cloneNode(false) as SVGElement;
        feld.removeAttribute('data-sid');
        feld.removeAttribute('data-ink-art');
        feld.removeAttribute('data-verweis');
        feld.setAttribute('fill', 'none');
        feld.setAttribute('stroke', 'transparent');
        feld.setAttribute('stroke-width', String(Math.max(24, strokeWidth(mark))));
        feld.setAttribute('stroke-linecap', 'round');
        feld.setAttribute('stroke-linejoin', 'round');
        feld.setAttribute('opacity', '1');
        feld.removeAttribute('style');
        feld.setAttribute('class', 'blatt-verweisfeld');
        /* Die Kennung wandert an die Gruppe: wer `[data-sid]` sucht, soll
           das Ganze finden und nicht die Hälfte. */
        gruppe.setAttribute('data-sid', String(node.getAttribute('data-sid') || ''));
        gruppe.setAttribute('data-ink-art', art);
        gruppe.setAttribute('data-verweis', String(node.getAttribute('data-verweis') || ''));
        gruppe.setAttribute('pointer-events', 'all');
        node.removeAttribute('data-sid');
        gruppe.append(feld, node);
        return gruppe;
      }
    }
    return node;
  };

  const zeichneMarkeRoh = (mark: any): SVGElement | null => {
    if (!mark || typeof mark !== 'object') return null;
    const art = String(mark.art || 'stift');
    const color = String(mark.farbe || FARBEN[0]);
    const width = strokeWidth(mark);
    const points = InkGeometry.points(mark.pts);
    let element: SVGElement | null = null;

    /* --- Ein Fachzeichen auf der Seite (Punkt 42) -------------------------
     * Das Symbol wird NICHT hier gezeichnet, sondern aus `register/fachzeichen`
     * geholt — derselben Quelle, aus der die Palette im Schaltplan schöpft.
     * Eine zweite Symbolliste für das PDF wäre L34: sie liefe auseinander,
     * und niemand merkte es, bis ein Zeichen auf dem Plan anders aussieht als
     * dasselbe Zeichen auf der PDF-Seite daneben.
     * -------------------------------------------------------------------- */
    if (art === 'zeichen') {
      const point = InkGeometry.points([mark.point])[0];
      const fz = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen : null;
      if (!point || !fz) return null;
      const roh = fz.alsSvg(String(mark.zeichenId || ''), {
        farbe: color, drehung: Number(mark.drehung) || 0,
        gespiegelt: !!mark.gespiegelt });
      if (!roh) return null;
      const mass = fz.masse(String(mark.zeichenId || ''), Number(mark.drehung) || 0);
      const wunsch = Math.max(12, Number(mark.groesse) || 64);
      const faktor = wunsch / Math.max(mass.w || 1, mass.h || 1);
      const gruppe = svg('g', {
        /* Der gesetzte Punkt ist die MITTE des Zeichens und nicht seine linke
           obere Ecke: man tippt dorthin, wo das Symbol sitzen soll. */
        transform: `translate(${point[0] - (mass.w * faktor) / 2} ` +
          `${point[1] - (mass.h * faktor) / 2}) scale(${faktor.toFixed(4)})`,
        fill: 'none', stroke: color,
        'stroke-width': (2 / faktor).toFixed(3),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      /* `alsSvg` liefert ein vollständiges <svg>; hier wird nur sein Inhalt
         gebraucht, damit das Zeichen im Blattraum sitzt und mitskaliert. */
      gruppe.innerHTML = roh.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      /* Eine unsichtbare Fläche, damit das Zeichen auch in seinen Lücken
         greifbar ist — ein Kontakt besteht fast nur aus Linien. */
      const griff = svg('rect', { x: 0, y: 0, width: mass.w, height: mass.h,
        fill: 'transparent', stroke: 'none' });
      gruppe.insertBefore(griff, gruppe.firstChild);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    }

    if (art === 'text') {
      const layout = InkGeometry.textLayout(mark);
      if (layout) {
        /* DER TEXTKASTEN (E360): `point` ist die linke obere Ecke, die
           Zeilen kommen aus `InkGeometry.textLayout` — dieselben Zeilen,
           die auch der Auswahlkasten kennt. Ein Rahmen, wenn die Marke
           einen will; sonst eine unsichtbare Flaeche, damit der Kasten
           auch zwischen den Woertern greifbar ist. */
        const gruppe = svg('g', { 'pointer-events': 'all' });
        gruppe.appendChild(mark.rahmen
          ? svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height, rx: 3,
              fill: 'none', stroke: color, 'stroke-width': Math.max(0.6, layout.fontSize / 16).toFixed(2),
              class: 'blatt-textrahmen' })
          : svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height,
              fill: 'transparent', stroke: 'none' }));
        /* DIE AUSRICHTUNG (E560): SVG kann sie selbst, wenn man ihm den
           richtigen Anker gibt — `middle` misst von der Mitte, `end` vom
           Ende. Jede Zeile bekommt dasselbe `x`, sonst laufen die Zeilen
           eines umbrechenden Absatzes auseinander. */
        const anker = layout.ausricht === 'mitte' ? 'middle'
                    : layout.ausricht === 'rechts' ? 'end' : 'start';
        const zeilenX = layout.ausricht === 'mitte' ? layout.x + layout.width / 2
                      : layout.ausricht === 'rechts' ? layout.x + layout.width - layout.pad
                      : layout.x + layout.pad;
        const textKnoten = svg('text', {
          x: zeilenX, y: layout.y + layout.pad + layout.fontSize * 0.85, fill: color,
          'font-size': layout.fontSize, 'font-family': schriftStapel(layout.family),
          'font-weight': layout.bold ? 700 : 400,
          ...(anker === 'start' ? {} : { 'text-anchor': anker }) });
        if (layout.zeilen) {
          /* ══ MEHRERE FORMATE IN EINEM ABSATZ (E561) ═══════════════════════
             NUR DAS ERSTE STÜCK EINER ZEILE BEKOMMT EIN `x`. Die übrigen
             fliessen dahinter — SVG setzt sie selbst, mit den ECHTEN
             Schriftmassen des Browsers.

             DIE ERSTE FASSUNG GAB JEDEM STÜCK EIN ABSOLUTES `x`, gerechnet
             aus `textWidth`. Das Bild hat sie widerlegt, und keine einzige
             Zusage hatte es gesehen: `textWidth` ist eine SCHÄTZUNG aus
             Buchstabenbreiten (`geometry.ts:240`) — gut genug, um zu
             entscheiden, WO umgebrochen wird, und zu ungenau, um zu sagen,
             wo ein Stück ANFÄNGT. Bei „einem hervorgehobenen Wort" in fett
             lief das nächste Stück mitten hinein.

             Gerechnet wird die Schätzung weiterhin — für den Umbruch. Sie
             steht nur nicht mehr im Bild.

             `xml:space="preserve"`: ohne das verschluckt XML den Zwischen-
             raum am Ende eines Laufs, und aus „klein GROSS" wird
             „kleinGROSS". Auch das stand auf dem Bild und in keiner Zusage. */
          textKnoten.setAttribute('xml:space', 'preserve');
          let oben = layout.y + layout.pad;
          for (const zeile of layout.zeilen) {
            zeile.stuecke.forEach((st, i) => {
              const teil = svg('tspan', {
                /* Ein `x` beginnt in SVG einen neuen Textabschnitt, und
                   `text-anchor` gilt je Abschnitt — die Zeile richtet sich
                   also an ihrem eigenen Anfang aus, mit echten Massen. */
                ...(i === 0 ? { x: zeilenX, y: oben + zeile.basis } : {}),
                'font-size': st.fontSize, 'font-weight': st.bold ? 700 : 400,
                ...(st.farbe ? { fill: st.farbe } : {}) });
              teil.textContent = st.text || ' ';
              textKnoten.appendChild(teil);
            });
            oben += zeile.hoehe;
          }
        } else layout.lines.forEach((zeile, index) => {
          const stueck = svg('tspan', { x: zeilenX, dy: index === 0 ? 0 : layout.zeile });
          stueck.textContent = zeile || ' ';
          textKnoten.appendChild(stueck);
        });
        gruppe.appendChild(textKnoten);
        gruppe.setAttribute('data-sid', idOf(mark));
        gruppe.setAttribute('data-ink-art', art);
        gruppe.setAttribute('data-kasten', '1');
        return gruppe;
      }
      /* Die einzeilige Textmarke von frueher (E100) bleibt, wie sie war —
         nur Schrift und Fett hoert sie jetzt auch. */
      const point = InkGeometry.points([mark.point])[0];
      if (!point) return null;
      element = svg('text', {
        x: point[0], y: point[1], fill: color,
        'font-size': Math.max(8, Number(mark.fontSize) || 18),
        'font-family': schriftStapel(mark.schrift), 'font-weight': mark.fett ? 700 : 400,
        'dominant-baseline': 'alphabetic'
      });
      element.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
    } else if (art === 'textfix') {
      /* ══ DIE GEÄNDERTE STELLE (E670) ═══════════════════════════════════
         Zwei Dinge in einer Marke, und sie gehören zusammen: der Deckel
         über dem alten Wort und das neue darüber. Getrennt wären es zwei
         Marken, die man einzeln verschieben, einzeln löschen und damit
         auseinanderbringen könnte — und ein Deckel ohne Text ist ein Loch
         im Dokument.

         DIE FLÄCHE IST DIE PAPIERFARBE, nicht Weiss: ein Scan ist selten
         weiss, und ein weisser Fleck auf grauem Papier sieht aus wie ein
         Fehler. `grund` kommt vom Werkzeug, das beim Setzen an der Stelle
         nachsieht; fehlt es, bleibt Weiss der ehrliche Rückfall.

         DER TEXT SITZT AUF DER GRUNDLINIE des alten Stücks. `y + h` ist
         genau dort, wo pdf.js die Grundlinie gemeldet hat (`textMitLage`
         legt den Kasten von der Grundlinie aus nach oben). */
      const box = InkGeometry.rectangle(
        [Number(mark.kasten?.x) || 0, Number(mark.kasten?.y) || 0],
        [(Number(mark.kasten?.x) || 0) + (Number(mark.kasten?.w) || 0),
         (Number(mark.kasten?.y) || 0) + (Number(mark.kasten?.h) || 0)]);
      const gruppe = svg('g', {});
      /* Ein Hauch grösser als das alte Wort: Buchstaben mit Unterlänge
         ragen über den gemeldeten Kasten, und ein stehengebliebenes „g"
         verrät die ganze Änderung. */
      const luft = Math.max(0.6, box.height * 0.12);
      gruppe.appendChild(svg('rect', {
        x: box.x - luft, y: box.y - luft,
        width: box.width + luft * 2, height: box.height + luft * 2,
        fill: String(mark.grund || '#ffffff'), stroke: 'none' }));
      const hoehe = Math.max(4, box.height);
      const wort = svg('text', {
        x: box.x, y: box.y + hoehe, fill: color,
        'font-size': hoehe,
        'font-family': schriftStapel(mark.schrift), 'font-weight': mark.fett ? 700 : 400,
        'dominant-baseline': 'alphabetic' });
      wort.setAttribute('xml:space', 'preserve');
      wort.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
      gruppe.appendChild(wort);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      gruppe.setAttribute('data-kasten', '1');
      return gruppe;
    } else if (art === 'line' && points.length >= 2) {
      element = svg('line', { x1: points[0]![0], y1: points[0]![1],
        x2: points[1]![0], y2: points[1]![1] });
    } else if (art === 'arrow' && points.length >= 2) {
      element = svg('path', { d: arrowPath(points[0]!, points[1]!) });
    } else if (art === 'rectangle' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height });
    } else if (art === 'abdeck' && points.length >= 2) {
      /* DAS ABDECKBAND (E266): eine DECKENDE Fläche über dem, was man
         gleich abfragen will — Formel zudecken, selbst antworten,
         antippen, nachsehen. Gezeichnet wird es wie ein Rechteck; die
         Füllung ist der Sinn der Sache und steht deshalb HIER, vor dem
         Strich-Block unten, der jede Form auf fill:none stellt.
         GESPEICHERT IST IMMER „ZUGEDECKT": das Aufdecken lebt nur im
         Sichtbaren (data-auf, siehe schicht) und schreibt nie in die
         Ablage — Lernen darf den Speicher nicht anfassen. Druck und
         Folien rufen denselben Zeichner und zeigen darum zu. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      /* DER VERLAUF, WENN ES EINEN GIBT (E545) — und IMMER mit der festen
         Farbe dahinter. `fill="url(#…) #ffcc00"` ist SVGs eigener Rückfall:
         fehlt die Vorlage, malt der Browser die Farbe. Gemessen, nicht
         angenommen (`bilder/paint-rueckfall.png`): ein `url()` OHNE Rückfall
         malt gar nichts — und ein unsichtbarer Deckel ist eine offene
         Antwort. Genau deshalb steht die Farbe hier und nicht nur dort.
         Der Knoten bleibt ein <rect> und bleibt DIREKTES Kind der Fläche:
         `redraw`, `updateNode` und der Radierer greifen `[data-sid]` und
         verschieben es — in einer eigenen Gruppe mit eigenem <defs> würde
         genau das die Vorlage abreissen. Die Vorlagen liegen deshalb in
         EINEM <defs> am Blatt, siehe `verlaufDefs`. */
      element = svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, rx: 4,
        fill: verlaufVon(mark) ? `url(#${verlaufId(mark)}) ${color}` : color,
        'pointer-events': 'all' });
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      /* DIE SCHRITTNUMMER REIST MIT AN DEN KNOTEN (E544). Sie steht seit
         E542 an der Marke — aus PowerPoints `p:timing` — und sagt, bei
         welchem Klick dieser Deckel weichen soll. Der Vortrag liest sie
         hier am Knoten ab, statt die Marken ein zweites Mal zu durchsuchen.
         Ein Deckel OHNE Nummer bekommt auch kein Attribut: der wird von
         Hand angetippt, und der Schrittzähler fasst ihn nie an (E266). */
      if (Number(mark.schritt) > 0)
        element.setAttribute('data-schritt', String(Number(mark.schritt)));
      return element;
    } else if (art === 'zettel' && points.length >= 2) {
      /* DIE HAFTNOTIZ (E267): ein farbiger Zettel mit Text, direkt auf
         Blatt oder PDF-Seite — für „hier nachfragen!" neben der Aufgabe.
         Der Text bricht selbst um (SVG-Text kann das nicht); die Schrift
         wählt ihre Tinte nach der Helligkeit des Zettels, sonst stünde
         Schwarz auf Schwarz. Wie beim Abdeckband gilt: eigener Zweig mit
         Rückgabe, der Strich-Block unten würde die Füllung löschen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const gruppe = svg('g', { 'pointer-events': 'all' });
      const wert = /^#([0-9a-f]{6})$/i.exec(color)?.[1] || 'e0a419';
      const hell = (parseInt(wert.slice(0, 2), 16) * 299 +
                    parseInt(wert.slice(2, 4), 16) * 587 +
                    parseInt(wert.slice(4, 6), 16) * 114) / 255000;
      const tinte = hell < 0.55 ? '#f5f5f2' : '#1c1c1c';
      gruppe.appendChild(svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, rx: 3, fill: color, 'fill-opacity': 0.92,
        stroke: 'rgba(0,0,0,.2)', 'stroke-width': 0.6 }));
      const groesse = Math.max(9, Number(mark.fontSize) || 13);
      const pad = Math.max(4, groesse * 0.5);
      const textKnoten = svg('text', {
        x: box.x + pad, y: box.y + pad + groesse * 0.8, fill: tinte,
        'font-size': groesse, 'font-family': 'system-ui, sans-serif' });
      const proZeile = Math.max(4, Math.floor((box.width - pad * 2) / (groesse * 0.52)));
      const zeilen: string[] = [];
      for (const roh of String(mark.text || '').split(/\r?\n/)) {
        let rest = roh;
        if (!rest) { zeilen.push(''); continue; }
        while (rest.length > proZeile) {
          let schnitt = rest.lastIndexOf(' ', proZeile);
          if (schnitt < proZeile * 0.5) schnitt = proZeile;
          zeilen.push(rest.slice(0, schnitt));
          rest = rest.slice(schnitt).replace(/^ /, '');
        }
        zeilen.push(rest);
      }
      const maxZeilen = Math.max(1, Math.floor((box.height - pad) / (groesse * 1.25)));
      zeilen.slice(0, maxZeilen).forEach((zeile, index) => {
        const stueck = svg('tspan', { x: box.x + pad,
          dy: index === 0 ? 0 : groesse * 1.25 });
        stueck.textContent = zeile || ' ';
        textKnoten.appendChild(stueck);
      });
      gruppe.appendChild(textKnoten);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    } else if (art === 'bild' && points.length >= 2) {
      /* DAS BILD (E357): ein <image> zwischen den zwei Ecken, aus der
         Ablage. `preserveAspectRatio: none` — die Ecken sind die Wahrheit;
         das Seitenverhaeltnis haelt die Auswahl beim Ziehen (siehe dort),
         nicht der Zeichner. Ohne bekannte Adresse ein Platzhalter, siehe
         `bildNachladen`. Eigener Zweig mit Rueckgabe, wie Zettel und Band:
         der Strich-Block unten wuerde die Gruppe mit Strichfarbe versehen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const gruppe = svg('g', { 'pointer-events': 'all' });
      const dateiId = String(mark.dateiId || '');
      const url = dateiId && typeof Dateien !== 'undefined' && typeof Dateien.adresseBekannt === 'function'
        ? Dateien.adresseBekannt(dateiId) : null;
      if (url) {
        gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
          href: url, preserveAspectRatio: 'none' }));
      } else {
        bildPlatzhalter(box, dateiId ? '' : BILD_FEHLT).forEach(node => gruppe.appendChild(node));
        if (dateiId) bildNachladen(dateiId, gruppe);
      }
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    } else if (art === 'ellipse' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('ellipse', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
        rx: box.width / 2, ry: box.height / 2 });
    } else if (art === 'triangle' && points.length >= 2) {
      /* DAS DREIECK (E465): Spitze oben in der Mitte, Grundseite unten —
         im Kasten der zwei Punkte, wie Rechteck und Ellipse. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('polygon', { points:
        `${box.x + box.width / 2},${box.y} ${box.x},${box.y + box.height} ${box.x + box.width},${box.y + box.height}` });
    } else if (art === 'curve' && points.length >= 2) {
      /* EINE QUADRATISCHE BEZIER (E483): Anfang, Griff, Ende. Ohne dritten
         Punkt liegt der Griff in der Mitte — dann ist es eine Gerade, und
         genau so beginnt jede Kurve. */
      const a = points[0]!, z = points[1]!;
      const g = points[2] || [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2];
      element = svg('path', { d: `M${a[0]} ${a[1]} Q${g[0]} ${g[1]} ${z[0]} ${z[1]}`, fill: 'none' });
    } else if (art === 'roundrect' && points.length >= 2) {
      /* DAS RUNDE RECHTECK (E465): die Rundung ein Sechstel der kuerzeren
         Seite — so bleibt ein schmales Kaestchen ein Kaestchen und kein
         Kissen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const rund = Math.max(2, Math.min(box.width, box.height) / 6);
      element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height, rx: rund, ry: rund });
    } else if (art === 'stift' && FLAECHEN_STIFTE.has(String(mark.stil)) && points.length >= 3) {
      /* DER STRICH ALS FLAECHE (E351): links und rechts der Mittellinie eine
         Kontur, deren Abstand dem Druck folgt. Ohne Druckwerte je Punkt
         (alter Bestand) bleibt es beim gleichmaessigen Strich unten. */
      /* Die halben Breiten — Druck, Neigung, Spitze — kommen seit E673
         aus `halbeBreiten`, derselben Rechnung wie im PDF-Export. `neig`
         bleibt hier nur für die Deckung des Bleistifts. */
      const neig: number[] = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
      const halb = halbeBreiten(mark, points);
      element = svg('path', { d: InkGeometry.outline(points, halb), fill: color, stroke: color,
        'stroke-width': 0.25, 'stroke-linejoin': 'round' });
      if (mark.stil === 'pinsel') element.setAttribute('opacity', String(deckungVon(art, 'pinsel')));
      /* DIE KOERNUNG DES BLEISTIFTS (E465): ein gestrichelter Haarstrich
         um die Flaeche — die Kante wird rau, wie Graphit auf Papier, und
         die Flaeche bleibt durchscheinend. Kein Filter: ein `feTurbulence`
         je Strich kostet auf einer vollen Seite ein Bild je Bild. */
      if (mark.stil === 'bleistift') {
        /* FLACH IST WEICHER (E507) — die Rechnung steht seit E623 in
           `deckungVon`, zusammen mit der des PDF. */
        element.setAttribute('opacity', String(deckungVon(art, 'bleistift', neig)));
        /* DAS KORN STATT DER PERLENKANTE (E704) — siehe `graphitFuellung`.
           Die Kante bekommt dasselbe Korn, hauchdünn: so ist sie weich,
           nicht gezackt. */
        const korn = graphitFuellung(color, graphitStufe(mark));
        element.setAttribute('fill', korn);
        element.setAttribute('stroke', korn);
        element.setAttribute('stroke-width', '0.25');
        element.setAttribute('data-ink-korn', String(graphitStufe(mark)));
      }
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      element.setAttribute('data-ink-stil', String(mark.stil));
      return element;
    } else if (art === 'marker' && mark.stil === 'keil' && points.length >= 1) {
      /* DER KEIL (E704): EINE Fläche aus den Vielecken, die die Kante
         überstreicht — kein Strich. */
      element = svg('path', { d: InkGeometry.vieleckPfad(keilVielecke(mark, points)),
        fill: color, 'fill-rule': 'nonzero', stroke: 'none',
        opacity: deckungVon('marker', 'keil'), style: 'mix-blend-mode:multiply' });
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      element.setAttribute('data-ink-stil', 'keil');
      return element;
    } else if (points.length >= 2) {
      element = svg('path', { d: InkGeometry.path(points) });
    }
    if (!element) return null;

    if (art !== 'text') {
      /* ══ EINE FÜLLUNG, WENN DIE MARKE EINE MITBRINGT (E565) ═════════════
         Geschlossene Formen waren bis hierher IMMER leer — „die Fläche
         bleibt optisch leer" steht ein paar Zeilen tiefer, und für einen
         von Hand gezogenen Rahmen ist das richtig.

         Eine eingelesene Tabellenzelle ist es nicht: PowerPoint gibt
         Kopfzeilen gern eine dunkle Füllung und schreibt weiss hinein.
         Ohne die Füllung stünde weisser Text auf weissem Grund — derselbe
         Fall wie bei E558, nur eine Ebene tiefer.

         NUR WENN DAS FELD DA IST. Jede Marke ohne `fuellung` bleibt
         wörtlich, was sie war; geprüft wird der Wert wie in `blatt.ts`,
         denn er kommt aus einer Datei und geht in einen Stil (§19). */
      const fuellung = String((mark as any).fuellung || '');
      element.setAttribute('fill',
        /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(fuellung) ? fuellung : 'none');
      /* UND EINE FORM DARF AUCH GAR KEINEN RAND HABEN (E566).
         Ein farbiger Kasten hinter einem Titel hat im Original keinen — ein
         Strich in der Vorgabefarbe machte ihn um zweieinhalb Punkt grösser
         und legte einen grauen Saum darum, den niemand gezeichnet hat. */
      element.setAttribute('stroke', color);
      element.setAttribute('stroke-width', String(width));
      element.setAttribute('stroke-linecap', 'round');
      element.setAttribute('stroke-linejoin', 'round');
      if ((mark as any).randlos) {
        element.setAttribute('stroke', 'none');
        element.setAttribute('stroke-width', '0');
      }
      if (art === 'marker') {
        element.setAttribute('opacity', String(deckungVon('marker', '')));
        element.setAttribute('style', 'mix-blend-mode:multiply');
      }
      /* Geschlossene Formen lassen sich auch in ihrer Flaeche greifen. Die
         Flaeche bleibt optisch leer; `pointer-events` aendert nur den Treffer. */
      if (art === 'rectangle' || art === 'ellipse' || art === 'triangle' || art === 'roundrect')
        element.setAttribute('pointer-events', 'all');
    }
    /* ══ DER SCHUTZLEITER: ZWEI STRICHE, EINER DARÜBER (E490) ═════════════
       Grün-gelb lässt sich mit EINER Farbe nicht sagen. Also wird derselbe
       Weg zweimal gezeichnet: unten das Grün, oben das Gelb als
       Strich-Punkt-Muster — dazwischen scheint das Grün durch, und was man
       sieht, ist die grün-gelbe Ader.

       WARUM EINE GRUPPE UND NICHT ZWEI MARKEN: es ist EIN Strich. Zwei
       Marken liessen sich einzeln verschieben, einzeln radieren, einzeln
       auswählen — und die eine Hälfte des Schutzleiters bliebe liegen. Die
       Geometrie (`pts`) steht weiterhin genau einmal da; nur das Bild ist
       doppelt.

       Das Muster rechnet in Strichbreiten, damit es bei 1 px wie bei 12 px
       dasselbe Verhältnis hat. `stroke-linecap:round` macht aus dem sehr
       kurzen Strich den Punkt. */
    /* ══ DER NEUTRALLEITER: NUR STRICHE (E509) ════════════════════════════
       Eine Farbe, ein Muster, keine zweite Ebene — der Schutzleiter
       braucht seine Gruppe, weil grün-gelb zwei Farben sind; der
       Neutralleiter ist blau und sonst nichts. Deshalb steht er hier und
       nicht dort unten: weniger Aufwand für weniger Anspruch. */
    if (String(mark.stil) === 'neutralleiter' && art !== 'text' && art !== 'zettel'
        && art !== 'abdeck' && art !== 'bild' && art !== 'zeichen') {
      element.setAttribute('stroke-dasharray',
        N_MUSTER.map(v => Math.max(0.2, v * width)).join(' '));
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      element.setAttribute('data-ink-stil', 'neutralleiter');
      return element;
    }
    if (String(mark.stil) === 'schutzleiter' && art !== 'text' && art !== 'zettel'
        && art !== 'abdeck' && art !== 'bild' && art !== 'zeichen') {
      const gruppe = svg('g');
      element.setAttribute('stroke', PE_GRUEN);
      const oben = element.cloneNode(false) as SVGElement;
      oben.setAttribute('stroke', PE_GELB);
      oben.setAttribute('stroke-dasharray', PE_MUSTER.map(v => Math.max(0.2, v * width)).join(' '));
      oben.setAttribute('pointer-events', 'none');
      gruppe.append(element, oben);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      gruppe.setAttribute('data-ink-stil', 'schutzleiter');
      return gruppe;
    }
    element.setAttribute('data-sid', idOf(mark));
    element.setAttribute('data-ink-art', art);
    return element;
  };

  const updateNode = (node: SVGElement | null, mark: any): SVGElement | null => {
    const fresh = zeichneMarke(mark);
    if (!fresh) return null;
    /* Ein Knoten MIT Kindern wird ersetzt und nicht geflickt: unten werden
       nur Attribute und `textContent` übertragen, und ein <g> voller Pfade
       behielte damit seine alten Kinder. Beim Fachzeichen hiesse das: die
       Kennung ändert sich, das Bild nicht. */
    /* EIN BILD WIRD GEFLICKT, NICHT ERSETZT (E357): beim Ziehen kaeme sonst
       je Bewegung ein neues <image> mit derselben Adresse — und ein noch
       ladendes Bild bekaeme seine Antwort nie, weil die Gruppe, auf die
       sie wartet, laengst ausgetauscht waere. Gleiche Kinder, gleiche
       Reihenfolge: dann wandern nur Lage und Mass. */
    if (node && node.getAttribute('data-ink-art') === 'bild' && fresh.getAttribute('data-ink-art') === 'bild' &&
        node.childElementCount === fresh.childElementCount &&
        [...node.children].every((kind, n) => kind.tagName === fresh.children[n]?.tagName)) {
      [...fresh.children].forEach((neu, n) => {
        const alt = node.children[n];
        if (!alt) return;
        for (const name of ['x', 'y', 'width', 'height', 'font-size']) {
          const wert = neu.getAttribute(name);
          if (wert !== null) alt.setAttribute(name, wert);
        }
      });
      node.setAttribute('data-sid', fresh.getAttribute('data-sid') || '');
      const drehung = fresh.getAttribute('transform');
      if (drehung) node.setAttribute('transform', drehung); else node.removeAttribute('transform');
      return node;
    }
    if (fresh.firstElementChild || node?.firstElementChild) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    if (!node || node.tagName !== fresh.tagName) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
    [...fresh.attributes].forEach(attribute => node.setAttribute(attribute.name, attribute.value));
    node.textContent = fresh.textContent;
    return node;
  };

  /* Eine globale Lebenswache statt eines pagehide-Zuhoerers je Neuzeichnung
     (E115). Sie schliesst einen laufenden Strich, bevor seine SVG verschwindet. */
  type LiveLayer = { flaeche: SVGSVGElement; abschliessen: () => boolean };
  const lebende = new Set<LiveLayer>();
  let observer: MutationObserver | null = null;
  let inspectionQueued = false;
  const inspectLayers = (): void => {
    inspectionQueued = false;
    let saved = false;
    for (const layer of [...lebende]) {
      if (layer.flaeche.isConnected) continue;
      if (layer.abschliessen()) saved = true;
      lebende.delete(layer);
    }
    if (!lebende.size && observer) { observer.disconnect(); observer = null; }
    if (saved && typeof App !== 'undefined' && App.zeichneSeite) App.zeichneSeite();
  };
  const registerLayer = (layer: LiveLayer): void => {
    lebende.add(layer);
    if (typeof MutationObserver === 'undefined') return;
    if (!observer) observer = new MutationObserver(() => {
      if (inspectionQueued) return;
      inspectionQueued = true;
      queueMicrotask(inspectLayers);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (typeof addEventListener === 'function') {
    addEventListener('pagehide', () => { for (const layer of lebende) layer.abschliessen(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden')
        for (const layer of lebende) layer.abschliessen();
    });
  }

  /**
   * Die Zeichenfläche zu einem Block.
   *
   * DER RAND WÄCHST NACH RECHTS, UND KEINE MARKE ZIEHT MIT (E301, L107).
   * L107 hat angenommen, dass ein breiterer Raum jede gespeicherte Marke
   * verschiebt. Das stimmt nur, wenn die Seite auf dem Bildschirm ihre
   * Breite BEHÄLT und die Box wächst — dann wird jede Einheit kleiner.
   * Wächst die Box dagegen nur nach rechts, während die Seite ihren Anteil
   * an der Fläche behält, ändert sich keine einzige gespeicherte Zahl: eine
   * Marke bei x=300 ist weiterhin 300 Einheiten vom linken Seitenrand
   * entfernt.
   *
   * Deshalb braucht es hier KEIN zweites Feld und KEINEN zweiten Raum. Ein
   * Strich darf sogar von der Seite in den Rand durchlaufen — und genau das
   * ist der Griff, den Redur an OneNote meint.
   *
   * @param rand Zusatzbreite RECHTS, in denselben Einheiten wie `breite`.
   */
  const schicht = (block: any, breite: number, hoehe: number, umbruch = 0,
                   rand = 0) => {
    const R = SheetSpace;
    const marks: any[] = Array.isArray(block.marken) ? clone(block.marken) : [];
    let tool = 'schreiben';
    let color: string = FARBEN[0];
    let width: number = BREITEN[1];
    /* ══ JEDES WERKZEUG MERKT SICH FARBE UND STÄRKE (E674) ══════════════════
       Wie in GoodNotes: der Marker bleibt gelb und breit, der Stift schwarz
       und fein, egal, wie oft man tauscht. Bis E674 waren `color` und
       `width` EINE Variable für alles — wer den Marker gelb gemacht hatte
       und zum Stift zurückging, schrieb gelb weiter. Und auf einer
       gewöhnlichen Seite wurde die Farbe GAR NICHT gemerkt.

       Das Gedächtnis liegt in EINEM Meta-Schlüssel, je Werkzeug Farbe und
       Stärke; die Formen teilen sich einen Eintrag (`istForm`, E375), weil
       sie sich auch einen Knopf teilen. Gelesen wird beim Wechsel FRISCH
       aus dem Meta, nicht aus einer Abschrift je Schicht — eine Seite kann
       drei Blätter tragen, und alle sollen dasselbe wissen. Und was aus
       dem Meta kommt, wird geprüft, bevor es gilt (§19): eine Farbe ist
       `#rrggbb`, eine Stärke liegt im Bereich des Reglers. */
    const WERKZEUGWERTE = 'zeichnen:werkzeugwerte';
    type Werkzeugwert = { farbe?: string; breite?: number };
    /* WERKZEUGE OHNE EIGENE TINTE: die Hand, die Auswahl, der Radierer, der
       Laser, das Bild. Sie haben keinen Eintrag — eine Farbe, die man mit
       der Auswahl wählt, gilt der Auswahl UND dem Stift danach (E353), also
       wird sie dem LETZTEN Zeichenwerkzeug gutgeschrieben. `test345 §4` hat
       das gegen den ersten Stand von E674 gefunden: die Farbe stand bei
       der Auswahl, und der Stift holte sich sein altes Schwarz zurück. */
    const OHNE_TINTE = new Set(['schreiben', 'select', 'radierer', 'laser', 'bild']);
    const werkzeugGruppe = (wz: string): string =>
      istForm(wz) ? 'formen' : OHNE_TINTE.has(String(wz)) ? '' : String(wz || '');
    /** Das Zeichenwerkzeug, das zuletzt geführt hat — dem schreibt die Auswahl gut. */
    let letzteGruppe = '';
    const werkzeugwerteLesen = (): Record<string, Werkzeugwert> => {
      const aus: Record<string, Werkzeugwert> = {};
      if (typeof Store === 'undefined') return aus;
      const roh = Store.getMeta(WERKZEUGWERTE);
      if (!roh || typeof roh !== 'object') return aus;
      for (const [k, v] of Object.entries(roh as Record<string, unknown>)) {
        if (!/^[a-z]+$/.test(k) || !v || typeof v !== 'object') continue;
        const e: Werkzeugwert = {};
        const f = String((v as { farbe?: unknown }).farbe || '').toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(f)) e.farbe = f;
        const b = Number((v as { breite?: unknown }).breite);
        if (Number.isFinite(b) && b >= 0.5 && b <= 12) e.breite = b;
        if (e.farbe !== undefined || e.breite !== undefined) aus[k] = e;
      }
      return aus;
    };
    /** Was am Werkzeug gerade an ist, ihm gutschreiben. Die Hand merkt sich nichts. */
    const werkzeugwertMerken = (): void => {
      const g = werkzeugGruppe(tool) || letzteGruppe;
      if (!g || typeof Store === 'undefined') return;
      const alle = werkzeugwerteLesen();
      alle[g] = { farbe: color, breite: width };
      try { Store.setMeta(WERKZEUGWERTE, alle); } catch { /* nur diese Sitzung */ }
    };
    let radierModus: string = radierModusLesen();
    /* HANDBALLEN-SCHUTZ (E354): sobald ein Stift die Flaeche beruehrt hat,
       zeichnen Finger vier Sekunden lang nicht — sie rollen. So darf die
       Hand beim Schreiben auf dem Glas liegen wie auf Papier. Die Sperre
       steht als `data-stift` an der Flaeche, damit auch das CSS weiss, dass
       ein Finger jetzt rollen darf (touch-action). Und ein Zug gehoert dem
       Zeiger, der ihn begonnen hat: Bewegungen und Loslassen anderer Zeiger
       gehen ihn nichts an. */
    const STIFT_SPERRE_MS = 4000;
    /* FORMERKENNUNG (E355): wer einen Kreis zieht und am Ende kurz haelt,
       bekommt einen Kreis — wie in GoodNotes. Das Halten ist die Absicht;
       ohne Halten bleibt jeder Strich, was er ist. Abschaltbar, gemerkt in
       `zeichnen:formen`. */
    const HALTEN_MS = 450;
    /* ══ WAS „GEHALTEN" HEISST (E490) ═════════════════════════════════════
       Bis hierher galt jeder aufgezeichnete Punkt als Bewegung, und die
       Uhr fing von vorn an. Eine Hand, die einen Stift ruhig hält, zittert
       aber — sie liefert weiter Punkte, nur ganz kleine. Ergebnis: „am Ende
       kurz halten" funktionierte mit der Maus (die steht wirklich still)
       und mit dem Finger und dem Stift so gut wie nie. Redur hat es
       gemeldet: „wenn ich eine Linie zeichne und mehr als drei Sekunden
       halte, sollte sie gerade werden."

       Also zwei verschiedene Fragen, die vorher eine waren:
         · Kommt ein neuer PUNKT in den Strich?  → ab 0,6 Einheiten
         · Hat die HAND sich bewegt?             → ab RUHE_RADIUS

       Drei Einheiten sind rund zweieinhalb Bildschirmpixel bei 100 %: mehr
       als ein Zittern, weniger als eine Absicht. `test461` fährt beides —
       ein Zittern von ±2 muss als Halten gelten, ein Rücken um 10 nicht. */
    const RUHE_RADIUS = 3;
    let formen: boolean = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:formen') !== false : true;
    /* KRITZEL-LOESCHEN (E466), wie GoodNotes' Scribble to Erase: ein
       Hin-und-her ueber einem Strich nimmt den Strich weg. Abschaltbar,
       gemerkt in `zeichnen:kritzel`. */
    let kritzel: boolean = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:kritzel') !== false : true;
    let stiftZuletzt = 0;
    let stiftTimer: ReturnType<typeof setTimeout> | null = null;
    let aktiverZeiger: number | null = null;
    /* ══ WANN DER FÜHRENDE ZEIGER ZULETZT ETWAS GESAGT HAT (E512) ══════════
       Redur, 8. September: „nach 5, 6 Minuten funktioniert der Stift nicht
       mehr, auch die Maus — ich musste neu laden."

       DER FUND war nicht die Zeit, sondern EIN verlorenes Ereignis.
       `aktiverZeiger` hält seit E354 fest, wer den Zug führt, damit ein
       zweiter Finger ihn nicht kapert. Kommt für diesen Zeiger nie ein
       `pointerup` oder `pointercancel` an — der Stift verlässt die
       Reichweite, der Griff geht verloren, das Ende landet auf einem
       anderen Element —, dann steht die Kennung für IMMER da, und jeder
       andere Zeiger wird abgewiesen. Die Fläche ist tot; nur Neuladen half.

       Gemessen: ein Stiftzug ohne Abheben, danach vier weitere Züge mit
       Maus und Stift — die Zahl der Marken blieb bei eins.

       DIE ANTWORT IST KEINE UHR IM HINTERGRUND. Ein Wecker, der einen Zug
       nach n Sekunden schliesst, schneidet auch den Strich eines Menschen
       durch, der beim Nachdenken die Hand aufliegen lässt. Stattdessen
       zwei Wege, die beide nur im Fehlerfall greifen:

         · das Ende wird AUCH AM FENSTER gehört (`beiEndeGlobal`), damit
           ein Abheben ausserhalb der Fläche zählt;
         · und wer aufsetzt, während der Führende seit `VERWAIST_MS`
           nichts mehr gesagt hat, ÜBERNIMMT — der alte Zug wird dabei
           abgeschlossen, nicht weggeworfen (§51: lieber ein Strich zu
           viel als eine Zeile Handschrift, die niemand wiederbekommt). */
    let zeigerZuletzt = 0;
    /* Der Laserpointer (E512): ein Knoten, der lebt, solange gezeigt wird,
       und danach von selbst verblasst. Er steht bewusst NEBEN `running` —
       ein Zug, der nichts speichert, ist kein laufender Strich. */
    let laserZug: { pts: number[][]; knoten: SVGElement } | null = null;
    /* WIE LANGE EIN FÜHRENDER SCHWEIGEN DARF, bevor er ein Rest ist.

       Die Zahl muss zwei Dinge trennen, und beide sind gemessen:

         · Ein EINDRINGLING — der zweite Finger, den E354 abwehrt — setzt
           auf, WÄHREND die Hand fährt. In `test479 §2` liegen zwischen der
           letzten Bewegung des Führenden und dem fremden Aufsetzen acht
           Millisekunden.
         · Ein MENSCH, der merkt, dass nichts passiert, hebt ab, schaut hin
           und tippt neu. Das dauert nicht unter einer halben Sekunde.

       500 ms liegen weit über dem einen und unter dem anderen. Höher wäre
       unnötig zäh: jede Millisekunde darüber ist Wartezeit für jemanden,
       dessen Fläche gerade nicht reagiert. */
    const VERWAIST_MS = 500;
    let fingerPan: { id: number; x: number; y: number; left: number; top: number; center: HTMLElement } | null = null;
    let radierStrich: { before: any[]; geaendert: boolean; letzter: number[]; kreis: SVGElement | null } | null = null;
    /* Der Stift, mit dem der naechste Strich entsteht — gemerkt ueber
       Neuladen hinweg, wie das Papier eines Hefts (E351). */
    let stil: string = (typeof Store !== 'undefined' && STIFTE.some(st => st.id === Store.getMeta('zeichnen:stift')))
      ? String(Store.getMeta('zeichnen:stift')) : STIL_VORGABE;
    /* Die Schrift fuer den naechsten Text (E360) — gemerkt in `zeichnen:schrift`. */
    let schrift: Schrift = schriftLesen();
    let running: any = null;
    let runningNode: SVGElement | null = null;
    let beforeRunning: any[] | null = null;
    /* ---- DER NASSE STRICH (E376) -----------------------------------------
     * Gemessen war der Grund fuer die Zaehigkeit eindeutig: bis hierher wurde
     * bei JEDEM Zeigerereignis der ganze Umriss neu gerechnet — 484,7 ms
     * Geometrie fuer einen Strich mit 600 Punkten, am Ende 0,774 ms je
     * Ereignis. Die `Feder` waechst stattdessen — 9,2× schneller ueber den
     * Strich, 10,1× am Ende, nachgemessen in test366 §2 — und liefert dabei
     * ZEICHENGLEICH denselben Pfad
     * wie `InkGeometry.outline` — geprueft in test366, sonst saehe der nasse
     * Strich anders aus als der trockene.
     * -------------------------------------------------------------------- */
    let feder: any = null;
    let glatt: ((p: [number, number], dt: number) => [number, number]) | null = null;
    let druckGlatt: ((p: number) => number) | null = null;
    let letzteZeit = 0;
    /* Der gemessene Abstand der letzten zwei Meldungen. Der nasse Schwanz
       rechnet in Millisekunden und braucht ihn (E511). */
    let dtLetzt = 16;
    /* Wo der Zeiger ZULETZT WIRKLICH WAR — ungeglaettet. Beim Absetzen wird
       der letzte gespeicherte Punkt dorthin gezogen (siehe `finish`). */
    let rohLetzter: number[] | null = null;
    /* DIE LETZTEN DREI ROHEN PUNKTE (E511). Der nasse Schwanz rechnet an
       ihnen, nicht an den geglätteten: er soll die Spitze EINHOLEN, nicht
       einen Strich verlängern, der selbst schon hinterherläuft. Drei, weil
       `InkStroke.vorhersage` an dreien erkennt, ob die Richtung kippt. */
    let rohDrei: number[][] = [];
    /* Der letzte Druck, den der SENSOR gemeldet hat (E675) — `null`, solange
       der laufende Strich noch keinen gesehen hat. */
    let sensorZuletzt: number | null = null;
    /* Ob der laufende Strich gerade als FLAECHE gezeichnet wird (Fueller,
       Pinsel ab drei Punkten) oder als Linie. Wechselt er die Bauart, wird
       der Knoten einmal ganz neu gebaut statt sein `d` gesetzt. */
    let nassFlaeche = false;
    let bildWunsch = 0;
    /* Der Weg, den der laufende Strich seit dem Aufsetzen zurückgelegt hat
       (E673) — daran hängt die Spitze des nassen Strichs. */
    let wegNass = 0;
    /* E704: Zeitabstände der rohen Meldungen und Sensorverlauf (für die
       Bremse), der Tempomesser (nur Füller und Pinsel). */
    let rohZeiten: number[] = [];
    let sensorVerlauf: number[] = [];
    let tempoMessen: ((p: [number, number], dt: number) => number) | null = null;
    let tempoJetzt = 0;
    let selection = new Set<string>();
    let selectDrag: any = null;
    const historyUndo: any[][] = [];
    const historyRedo: any[][] = [];
    const stateListeners = new Set<(state: any) => void>();

    const randBreit = Math.max(0, Number(rand) || 0);
    const flaeche = svg('svg', { class: 'blatt-marken',
      viewBox: `0 0 ${breite + randBreit} ${hoehe}`,
      preserveAspectRatio: 'none', 'data-tool': tool }) as SVGSVGElement;
    /* Die Kante zwischen Seite und Rand — gestrichelt, damit sie nicht wie
       ein gezeichneter Strich aussieht. Nur wenn es einen Rand gibt. */
    if (randBreit > 0)
      flaeche.appendChild(svg('line', { x1: breite, x2: breite, y1: 0, y2: hoehe,
        stroke: 'currentColor', 'stroke-width': 0.7, 'stroke-dasharray': '4 5',
        opacity: 0.3, class: 'blatt-randkante' }));
    for (let page = 1; umbruch > 0 && page * umbruch < hoehe; page++) {
      flaeche.appendChild(svg('line', { x1: 0, x2: breite, y1: page * umbruch, y2: page * umbruch,
        stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-dasharray': '6 6',
        opacity: 0.35, class: 'blatt-umbruch' }));
    }
    /* DIE GEZEICHNETE FASSUNG JE MARKE (E358, L115 Punkt 7): ein JSON-Text
       je Kennung, wie die Marke zuletzt in einen Knoten kam. `redraw`
       vergleicht dagegen und fasst nur an, was anders ist. Wo der Text
       fehlt (ein Strich oder ein Einsetzen haengt seinen Knoten direkt an),
       wird einmal geflickt und dann gemerkt. */
    /* ---- WAS DER KNOTEN ZEIGT (E358, seit E379 als OBJEKT) ---------------
     * Die Karte sagt, AUS WELCHER MARKE der Knoten gezeichnet wurde. Bis
     * E378 stand darin die Marke als Zeichenkette, und `redraw()` schrieb
     * dafuer bei jedem Durchgang die ganze Seite aus — 5,95 ms bei 800
     * Strichen, jedes Mal, wenn ein Zurueck, eine Haftnotiz, ein Text oder
     * ein Radierzug neu zeichnen liess.
     *
     * Seit E378 gilt: eine Marke in `marks` wird ERSETZT, nie von innen
     * geaendert. Damit beantwortet die Identitaet des Objekts genau
     * dieselbe Frage — und zwar in einem Takt statt in einer Zeichenkette
     * (17 µs statt 5,95 ms).
     *
     * Und sie beantwortet sie SCHAERFER: zwei verschiedene Objekte mit
     * gleichem Inhalt galten frueher als „unveraendert". Jetzt wird in dem
     * Fall neu gezeichnet — mehr Arbeit als noetig, aber nie zu wenig. In
     * die falsche Richtung zu irren ist hier die richtige Richtung.
     * -------------------------------------------------------------------- */
    const gezeichnet = new Map<string, any>();
    const fassung = (mark: any): string => JSON.stringify(mark);
    /* `merke` steht hinter JEDEM Weg, der einen Knoten direkt aendert oder
       anhaengt — Ziehen, Griff, Umfaerben, Radieren, Strichende, Einsetzen,
       Bild. Die Merkliste muss sagen, was der KNOTEN zeigt, nicht was die
       Marke ist: nach einem Zurueck ist die Marke wieder die alte, der
       Knoten aber noch der verschobene, und nur ein ehrlicher Eintrag
       laesst `redraw` das sehen (gefunden von test350 §3). */
    const merke = (mark: any): void => { gezeichnet.set(idOf(mark), mark); };
    /* Die Verlauf-Vorlagen der Abdeckbänder (E545). Sie liegen als EIN
       `<defs>` ganz vorn in der Fläche und tragen kein `data-sid` — damit
       fasst `redraw` sie nicht an, das sammelt nur Markenknoten. Aufgefrischt
       wird beim Zeichnen, weil eine Marke dazukommen oder weggehen kann. */
    const defsAuffrischen = (): void => {
      flaeche.querySelector('[data-ink-defs]')?.remove();
      const defs = verlaufDefs(marks);
      if (defs) flaeche.insertBefore(defs, flaeche.firstChild);
    };

    marks.forEach(mark => {
      const node = zeichneMarke(mark);
      if (node) { flaeche.appendChild(node); merke(mark); }
    });
    defsAuffrischen();

    /* Welche Abdeckbänder GERADE aufgedeckt sind — nur Laufzeit, nie
       Ablage: nach Neuladen oder Neuzeichnen von aussen ist wieder alles
       zu, und genau das ist die ehrliche Vorgabe beim Lernen (E266). */
    const aufgedeckt = new Set<string>();
    const abdeckAnwenden = (): void => {
      flaeche.querySelectorAll<SVGElement>('[data-ink-art="abdeck"]').forEach(node => {
        const id = node.getAttribute('data-sid') || '';
        if (aufgedeckt.has(id)) node.setAttribute('data-auf', '1');
        else node.removeAttribute('data-auf');
      });
    };

    /* Das Lineal (E267): ein Schalter, kein Werkzeug. Solange es anliegt,
       rasten Linie und Pfeil auf 15°-Schritte — waagrecht, senkrecht und
       die üblichen Winkel dazwischen, ohne zitternde Hand. Nur Laufzeit,
       Vorgabe aus. */
    let lineal = false;
    const ruler = InkRuler.create(flaeche, breite, hoehe);
    /* Unabhängig von der Stiftbreite: Radieren darf den nächsten Strich
       nicht dicker machen. Alte Flächen behalten bis zur Wahl ihre Größe. */
    let eraserSize: number | null = null;
    const rasten = (anfang: number[], ende: number[]): number[] => {
      const dx = ende[0]! - anfang[0]!;
      const dy = ende[1]! - anfang[1]!;
      const radius = Math.hypot(dx, dy);
      if (radius < 0.001) return ende;
      const schritt = Math.PI / 12;
      const winkel = Math.round(Math.atan2(dy, dx) / schritt) * schritt;
      return [anfang[0]! + radius * Math.cos(winkel),
              anfang[1]! + radius * Math.sin(winkel)];
    };

    /* ---- DER MERKZETTEL FUERS ZURUECK (E378) -----------------------------
     * Bis hierher klonte `snapshot()` die GANZE Seite — und zwar bei jedem
     * Aufsetzen des Stifts. Gemessen auf einer vollen Seite Handschrift:
     *
     *     400 Striche   4,28 ms klonen + 3,74 ms vergleichen =  8,0 ms
     *     800 Striche  11,96 ms klonen + 11,46 ms vergleichen = 23,4 ms
     *
     * 23 ms sind fast drei Bilder bei 120 Hz — jedes Mal, wenn der Stift das
     * Papier beruehrt, und noch einmal, wenn er abhebt. Genau das fuehlt
     * sich zaeh an, und zwar umso mehr, je voller die Seite ist.
     *
     * Der Merkzettel braucht die Marken gar nicht zu klonen. Er braucht nur
     * die LISTE, wie sie war — solange keine Marke, die schon in `marks`
     * steht, jemals von innen geaendert wird. Das ist die Regel dieses
     * Bogens, und sie steht nicht nur als Satz da:
     *
     *   `snapshot()` FRIERT ein, was es weggibt. Wer danach eine Marke von
     *   innen aendert, bekommt in `"use strict"` einen Fehler statt eines
     *   stillen Datenverlusts. Und ein stiller Datenverlust waere es: der
     *   Merkzettel zeigte dann schon die Aenderung, und „Zurueck" holte
     *   nichts zurueck.
     *
     * Statt zu aendern wird ERSETZT — `marks[i] = { ...alt, farbe: neu }`.
     * Genau so machen es `move` und `scale` seit E353 schon.
     * -------------------------------------------------------------------- */
    const snapshot = (): any[] => {
      const liste = marks.slice();
      for (const mark of liste) {
        /* Auch die Punktlisten — sonst faenge `Object.freeze` nur ein
           `mark.farbe = …` ab und nicht ein `mark.pts.push(…)`, und genau
           das waere die stillere Haelfte des Datenverlusts. */
        if (Array.isArray(mark?.pts)) Object.freeze(mark.pts);
        if (Array.isArray(mark?.pressure)) Object.freeze(mark.pressure);
        Object.freeze(mark);
      }
      return liste;
    };
    /** Der Platz einer Marke in `marks` — fuer das Ersetzen an Ort und Stelle. */
    const platzVon = (id: string): number => marks.findIndex(mark => idOf(mark) === id);
    /** Eine Marke ersetzen, statt sie zu aendern (siehe `snapshot`). */
    const ersetze = (index: number, neu: any): any => {
      if (index < 0 || index >= marks.length) return null;
      marks[index] = neu;
      return neu;
    };
    const state = () => ({ undo: historyUndo.length > 0, redo: historyRedo.length > 0,
      selected: selection.size, clipboard: zwischenablage.length > 0, gesperrt: gesperrtGewaehlt(),
      /* E494: welches Element der nächste Tipp setzt — die Leiste schreibt
         es an ihren Knopf, damit die gemerkte Wahl sichtbar ist. */
      element: letztesElement });
    const notifyState = (): void => stateListeners.forEach(listener => listener(state()));
    const save = (): void => Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION });
    /* ZWEI LISTEN VERGLEICHEN, OHNE SIE ZU SCHREIBEN (E378). Bis hierher
       hiess das zweimal `JSON.stringify` ueber die ganze Seite — 11,5 ms bei
       800 Strichen, nur um die Frage „hat sich etwas geaendert?" zu
       beantworten. Seit `snapshot()` flach ist, sind unveraenderte Marken
       DASSELBE Objekt, und der Vergleich bricht beim ersten Unterschied ab.
       Die Zeichenkette bleibt als Rueckfall fuer den Fall, dass eine Marke
       ersetzt wurde, ohne sich zu unterscheiden. */
    const listenGleich = (a: any[], b: any[]): boolean => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) continue;
        if (fassung(a[i]) !== fassung(b[i])) return false;
      }
      return true;
    };
    const commit = (before: any[]): void => {
      if (listenGleich(before, marks)) return;
      historyUndo.push(before);
      if (historyUndo.length > HISTORY_LIMIT) historyUndo.shift();
      historyRedo.length = 0;
      save(); notifyState();
    };
    const nodeFor = (id: string): SVGElement | null =>
      id ? flaeche.querySelector<SVGElement>(`[data-sid="${CSS.escape(id)}"]`) : null;
    /* NEUZEICHNEN FASST NUR AN, WAS SICH GEAENDERT HAT (E358, L115 Punkt 7).
       Bisher nahm `redraw` jeden Knoten weg und zeichnete alle neu — bei
       tausend Marken 59 ms je Zurueck, bei dreitausend 155, gemessen.
       Jetzt: gleiche Fassung, gleicher Knoten; andere Fassung, geflickt
       (`updateNode`); Marke ohne Knoten, neu; Knoten ohne Marke, weg. Die
       Reihenfolge der Marken bleibt die Reihenfolge der Knoten — sie ist
       die Stapelung auf dem Papier; wo sie nicht stimmt, wird eingeordnet. */
    const redraw = (): void => {
      flaeche.querySelectorAll('[data-ink-ui]').forEach(node => node.remove());
      const knoten = new Map<string, SVGElement>();
      flaeche.querySelectorAll<SVGElement>('[data-sid]').forEach(node => {
        const id = node.getAttribute('data-sid') || '';
        if (knoten.has(id)) node.remove(); else knoten.set(id, node);
      });
      const bleibt = new Set<string>();
      let vorheriger: SVGElement | null = null;
      for (const mark of marks) {
        const id = idOf(mark);
        if (!id || bleibt.has(id)) continue;
        let node = knoten.get(id) || null;
        if (!node) node = zeichneMarke(mark);
        else if (gezeichnet.get(id) !== mark) node = updateNode(node, mark);
        if (!node) { gezeichnet.delete(id); continue; }
        bleibt.add(id);
        gezeichnet.set(id, mark);
        const platz: ChildNode | null = vorheriger ? vorheriger.nextSibling : flaeche.querySelector('[data-sid]');
        if (node.parentNode !== flaeche || node !== platz) flaeche.insertBefore(node, platz);
        vorheriger = node;
      }
      knoten.forEach((node, id) => { if (!bleibt.has(id)) { node.remove(); gezeichnet.delete(id); } });
      defsAuffrischen();
      abdeckAnwenden();
      renderSelection();
      /* DAS LINEAL ÜBERLEBT DAS NEUZEICHNEN (E573). Die Zeile ganz oben in
         dieser Funktion räumt JEDES `[data-ink-ui]` aus der Fläche — das
         Lineal trägt dieses Kennzeichen, und niemand hängte es zurück.
         Gemessen war nach einem einzigen „Zurück" kein Lineal mehr da,
         während der Schalter weiter „an" meldete. */
      ruler.remount();
    };
    const restore = (next: any[]): void => {
      /* Flach, aus demselben Grund wie `snapshot` (E378): die Marken werden
         nicht geaendert, sondern ersetzt — also darf die Liste sie teilen. */
      marks.splice(0, marks.length, ...next);
      selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
      save(); redraw(); notifyState();
    };
    const undo = (): void => {
      const previous = historyUndo.pop();
      if (!previous) return;
      historyRedo.push(snapshot()); restore(previous);
    };
    const redo = (): void => {
      const next = historyRedo.pop();
      if (!next) return;
      historyUndo.push(snapshot()); restore(next);
    };
    /**
     * DIE ACHSEN DES AUSWAHLKASTENS (E474). Steht die Auswahl auf GENAU
     * EINER gedrehten Marke, sind es ihre eigenen Achsen — der Kasten
     * steht dann schief wie sie, die Griffe sitzen auf ihren Ecken, und
     * Ziehen macht sie breiter, nicht schief. Bei mehreren Marken (oder
     * einer geraden) bleibt der Kasten aufrecht: ein gemeinsamer Rahmen
     * fuer zwei verschieden gedrehte Marken hat keine Achsen.
     */
    const auswahlAchse = (): number => {
      if (selection.size !== 1) return 0;
      const mark = marks.find(item => idOf(item) === [...selection][0]);
      return mark ? InkGeometry.drehung(mark) : 0;
    };
    /** Der gemeinsame Kasten der Auswahl, mit demselben Rand wie die Rahmen —
     *  bei einer gedrehten Marke in IHREN Achsen (E474), sonst aufrecht. */
    const auswahlKasten = (): { x: number; y: number; width: number; height: number } => {
      if (auswahlAchse()) {
        const mark = marks.find(item => idOf(item) === [...selection][0]);
        const b = InkGeometry.boundsLokal(mark);
        return { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 };
      }
      const boxes = [...selection]
        .map(id => marks.find(item => idOf(item) === id))
        .filter(Boolean)
        .map(mark => InkGeometry.bounds(mark));
      const box = InkGeometry.union(boxes);
      return { x: box.x - 3, y: box.y - 3, width: box.width + 6, height: box.height + 6 };
    };
    function renderSelection(): void {
      flaeche.querySelectorAll('[data-ink-ui="selection"],[data-ink-ui="griffe"]').forEach(node => node.remove());
      for (const id of selection) {
        const mark = marks.find(item => idOf(item) === id);
        if (!mark) continue;
        /* DER RAHMEN STEHT SCHIEF, WENN DIE MARKE SCHIEF STEHT (E474). Bis
           hierher war es der aufrechte Kasten UM die gedrehte Marke — bei
           45° fast doppelt so gross wie sie selbst, und ein Rahmen, der
           weit um eine Marke liegt, sagt etwas Falsches darueber, was
           gewaehlt ist. Gedreht wird derselbe Weg wie bei der Marke: der
           aufrechte Rahmen in einer Gruppe, die sich um die Mitte dreht. */
        const grad = InkGeometry.drehung(mark);
        const box = grad ? InkGeometry.boundsLokal(mark) : InkGeometry.bounds(mark);
        const ziel = grad
          ? flaeche.appendChild(svg('g', { 'data-ink-ui': 'selection',
              transform: `rotate(${grad} ${rund2(box.x + box.width / 2)} ${rund2(box.y + box.height / 2)})` }))
          : flaeche;
        ziel.appendChild(svg('rect', { x: box.x - 3, y: box.y - 3,
          width: box.width + 6, height: box.height + 6,
          class: 'blatt-auswahlrahmen' + (mark.gesperrt ? ' blatt-auswahlrahmen-gesperrt' : ''),
          'data-ink-ui': 'selection' }));
        /* Das Schloss sagt, warum sich die Marke nicht bewegt (E466). Es
           bleibt AUFRECHT und am aufrechten Kasten: ein Schloss, das auf
           dem Kopf steht, liest niemand. */
        if (mark.gesperrt) {
          const aussen = InkGeometry.bounds(mark);
          const schloss = svg('text', { x: aussen.x - 3, y: aussen.y - 6, class: 'blatt-schloss', 'data-ink-ui': 'selection' });
          schloss.textContent = '🔒';
          flaeche.appendChild(schloss);
        }
      }
      /* DIE GRIFFE (E353): ein Kasten um alles Gewaehlte, an jeder Ecke ein
         Griff. Das Trefffeld ist groesser als der sichtbare Punkt — am
         Telefon waere ein Griff von fuenf Einheiten sonst nicht zu fassen. */
      if (selection.size) {
        const k = auswahlKasten();
        const achse = auswahlAchse();
        const g = svg('g', achse
          ? { 'data-ink-ui': 'griffe',
              transform: `rotate(${achse} ${rund2(k.x + k.width / 2)} ${rund2(k.y + k.height / 2)})` }
          : { 'data-ink-ui': 'griffe' });
        g.appendChild(svg('rect', { x: k.x, y: k.y, width: k.width, height: k.height,
          class: 'blatt-auswahlkasten' }));
        const ecken: Array<[string, number, number]> = [
          ['nw', k.x, k.y], ['ne', k.x + k.width, k.y],
          ['sw', k.x, k.y + k.height], ['se', k.x + k.width, k.y + k.height]];
        for (const [name, x, y] of ecken) {
          g.appendChild(svg('circle', { cx: x, cy: y, r: 22, class: 'blatt-griff-feld', 'data-griff': name }));
          g.appendChild(svg('circle', { cx: x, cy: y, r: 5, class: 'blatt-griff' }));
        }
        /* DER GRIFF DER KURVE (E483): auf ihrem Steuerpunkt, und nur bei
           EINER gewaehlten Kurve — bei zweien waere nicht zu sehen, welche
           er biegt. Er steht in derselben gedrehten Gruppe wie die Ecken,
           also stimmt seine Lage auch an einer schiefen Kurve. */
        if (selection.size === 1) {
          const nur = marks.find(item => idOf(item) === [...selection][0]);
          const cp = nur && nur.art === 'curve' ? InkGeometry.points(nur.pts)[2] : null;
          if (cp) {
            g.appendChild(svg('circle', { cx: cp[0], cy: cp[1], r: 22, class: 'blatt-griff-feld', 'data-griff': 'kurve' }));
            g.appendChild(svg('circle', { cx: cp[0], cy: cp[1], r: 5, class: 'blatt-griff blatt-griff-kurve' }));
          }
        }
        /* DER DREHGRIFF (E466), wie in GoodNotes: an einer kurzen Leine
           ueber dem Kasten — oder darunter, wenn oben kein Platz ist. */
        const ox = k.x + k.width / 2;
        const oy = k.y < 40 ? k.y + k.height + 28 : k.y - 28;
        g.appendChild(svg('line', { x1: ox, y1: k.y < 40 ? k.y + k.height : k.y, x2: ox, y2: oy, class: 'blatt-auswahlkasten' }));
        g.appendChild(svg('circle', { cx: ox, cy: oy, r: 22, class: 'blatt-griff-feld blatt-griff-dreh', 'data-griff': 'dreh' }));
        g.appendChild(svg('circle', { cx: ox, cy: oy, r: 5, class: 'blatt-griff blatt-griff-dreh-punkt' }));
        flaeche.appendChild(g);
      }
      notifyState();
    }
    /** Liegt die Marke im Lasso? Linienzuege mit der Haelfte ihrer Punkte,
        alles andere mit der Mitte seines Kastens. */
    const imLasso = (mark: any, schlinge: number[][]): boolean => {
      const art = String(mark?.art || '');
      const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
      if (linie && Array.isArray(mark.pts) && mark.pts.length) {
        const drin = (mark.pts as number[][]).filter(p => InkGeometry.insidePolygon([p[0] ?? 0, p[1] ?? 0], schlinge)).length;
        return drin * 2 >= mark.pts.length;
      }
      const box = InkGeometry.bounds(mark);
      return InkGeometry.insidePolygon([box.x + box.width / 2, box.y + box.height / 2], schlinge);
    };
    const deleteSelection = (): void => {
      if (!selection.size) return;
      const before = snapshot();
      /* GESPERRTES BLEIBT (E466): eine gesperrte Marke geht nicht mit dem
         Entfernen-Knopf — erst entsperren, dann loeschen, wie in GoodNotes. */
      for (let index = marks.length - 1; index >= 0; index--)
        if (selection.has(idOf(marks[index])) && !marks[index].gesperrt) marks.splice(index, 1);
      selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
      redraw(); commit(before);
    };
    /* AUSSCHNEIDEN (E466): Kopieren und Loeschen in einem — Strg X und ein Knopf. */
    const cutSelection = (): number => {
      const n = copySelection();
      if (n) deleteSelection();
      return n;
    };
    /* NACH VORN UND NACH HINTEN (E466): die Reihenfolge in `marks` ist die
       Stapelung auf dem Papier (E358) — nach vorn heisst ans Ende der
       Liste, nach hinten an den Anfang. Kein Ebenenfenster, wie in
       GoodNotes: Bring to Front, Send to Back. */
    const nachVorn = (): void => {
      if (!selection.size) return;
      const before = snapshot();
      /* Gesperrtes behaelt seinen Platz im Stapel (E473). */
      const drin = marks.filter(mark => selection.has(idOf(mark)) && !mark.gesperrt);
      const rest = marks.filter(mark => !selection.has(idOf(mark)) || mark.gesperrt);
      marks.splice(0, marks.length, ...rest, ...drin);
      redraw(); commit(before);
    };
    const nachHinten = (): void => {
      if (!selection.size) return;
      const before = snapshot();
      const drin = marks.filter(mark => selection.has(idOf(mark)) && !mark.gesperrt);
      const rest = marks.filter(mark => !selection.has(idOf(mark)) || mark.gesperrt);
      marks.splice(0, marks.length, ...drin, ...rest);
      redraw(); commit(before);
    };
    /* SPERREN (E466): eine gesperrte Marke laesst sich nicht schieben,
       ziehen, drehen, loeschen oder radieren — fuer Bilder, Textkaesten
       und Zettel, die als Vorlage dienen und ueber die man schreibt.
       Umfaerben geht weiter: die Sperre gilt dem Ort, nicht der Farbe. */
    /* ══ EIGENE VERWEISE (E468) ══════════════════════════════════════════════
       Ein Verweis ist ein FELD an einer Marke — `href` nach draussen (nur
       http, https, mailto; §19) oder `zielSeite` (die Kennung einer Seite,
       aufgeloest aus [[Name]] ueber `Links`) — und kein eigener Markentyp:
       ein Rechteck um eine Aufgabe, ein Text, ein Bild, alles kann einer
       sein. Leer eingegeben heisst: Verweis weg. Ein Schritt im Verlauf. */
    const verweisSetzen = async (): Promise<void> => {
      if (!selection.size) return;
      const erste = marks.find(m => selection.has(idOf(m)));
      const vorgabe = erste?.href ? String(erste.href)
        : erste?.zielSeite ? '[[' + String(Store.getBlock(String(erste.zielSeite))?.text || '') + ']]' : '';
      const antwort = await Dialog.frage('Verweis: eine Adresse (https://…) oder eine Seite ([[Name]])', vorgabe);
      if (antwort === null) return;
      const wert = antwort.trim();
      const setze = (patch: Record<string, unknown>, weg: string[]): void => {
        for (let i = 0; i < marks.length; i++) {
          if (!selection.has(idOf(marks[i])) || marks[i].gesperrt) continue;
          const neu: any = { ...marks[i], ...patch };
          for (const f of weg) delete neu[f];
          marks[i] = neu;
        }
      };
      const before = snapshot();
      if (!wert) {
        setze({}, ['href', 'zielSeite']);
        redraw(); commit(before); UI.toast('Verweis entfernt');
        return;
      }
      const seitenName = wert.match(/^\[\[(.+?)\]\]$/)?.[1];
      if (seitenName || !/^[a-z][a-z0-9+.-]*:/i.test(wert)) {
        const name = String(seitenName || wert).trim();
        const ziel = (typeof Links !== 'undefined' && typeof Links.loeseSeitenverweis === 'function')
          ? Links.loeseSeitenverweis(name).page : null;
        if (!ziel) { UI.toast('Keine Seite „' + name + '" gefunden.'); return; }
        setze({ zielSeite: ziel.id }, ['href']);
      } else {
        const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(wert) : '';
        if (!sicher || !/^(https?:|mailto:)/i.test(sicher)) {
          UI.toast('Diese Adresse nimmt Redion nicht: nur http, https oder mailto (§19).');
          return;
        }
        setze({ href: sicher }, ['zielSeite']);
      }
      redraw(); commit(before);
      UI.toast('🔗 Verweis gesetzt — im Lesemodus antippen');
    };
    const verweisFolgen = (mark: any): void => {
      if (mark.href) {
        const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(mark.href) : '';
        if (sicher && /^(https?:|mailto:)/i.test(sicher)) window.open(sicher, '_blank', 'noopener');
        return;
      }
      if (mark.zielSeite) {
        const ziel = Store.getBlock(String(mark.zielSeite));
        if (ziel && ziel.alive !== false) App.oeffne(ziel.id);
        else UI.toast('Die Zielseite gibt es nicht mehr.');
      }
    };
    const gesperrtGewaehlt = (): boolean =>
      selection.size > 0 && [...selection].every(id => !!marks.find(mark => idOf(mark) === id)?.gesperrt);
    const sperren = (an?: boolean): void => {
      if (!selection.size) return;
      const before = snapshot();
      const ziel = typeof an === 'boolean' ? an : !gesperrtGewaehlt();
      for (let i = 0; i < marks.length; i++) {
        if (!selection.has(idOf(marks[i]))) continue;
        const neu = { ...marks[i] };
        if (ziel) neu.gesperrt = true; else delete neu.gesperrt;
        marks[i] = neu;
        merke(neu);
      }
      renderSelection(); commit(before);
    };
    /* KOPIEREN UND EINSETZEN (E353). Eingesetzt wird um sechzehn Einheiten
       versetzt, mit frischen Kennungen, und die Ablage wandert mit — ein
       zweites Einsetzen legt sich nicht auf das erste. Eingesetztes ist
       danach die Auswahl, im Auswahl-Werkzeug. */
    const copySelection = (): number => {
      const kopie = marks.filter(mark => selection.has(idOf(mark))).map(mark => clone(mark));
      if (kopie.length) { zwischenablage = kopie; notifyState(); }
      return kopie.length;
    };
    const paste = (): number => {
      if (!zwischenablage.length) return 0;
      if (tool !== 'select') {
        setzeWerkzeug('select');
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(steuerung, 'select'); } catch { /* egal */ }
        }
      }
      const before = snapshot();
      const neue = zwischenablage.map(mark => InkGeometry.move({ ...clone(mark), id: frischeId() }, 16, 16));
      marks.push(...neue);
      neue.forEach(mark => { const node = zeichneMarke(mark); if (node) { flaeche.appendChild(node); merke(mark); } });
      selection = new Set(neue.map(mark => idOf(mark)));
      zwischenablage = neue.map(mark => clone(mark));
      renderSelection();
      commit(before);
      return neue.length;
    };

    /* Der Radierer ist ein Kreis; seine Groesse haengt an der gewaehlten
       Strichstaerke — duenn, mittel, dick, wie beim Stift. */
    const radierRadius = (): number => eraserSize ?? Math.max(5, width * 3);
    const frischeId = (): string =>
      typeof Ids !== 'undefined' ? Ids.short(8) : 'm' + Math.random().toString(36).slice(2, 10);
    /* EIN RADIERSCHRITT (E352): alles, was der Kreis um `center` beruehrt.
       „ganz" nimmt die Marke, „marker" nur Marker, „teil" schneidet Stift
       und Marker am Kreis auf und laesst den Rest stehen — Formen, Text und
       Zeichen gehen auch dort ganz, wie in GoodNotes. Die Knoten werden
       einzeln getauscht, nicht die ganze Schicht neu gezeichnet. */
    /* EINE Marke radieren — nach der gewaehlten Art. Gibt zurueck, ob sich
       etwas geaendert hat. */
    const radiereEine = (index: number, center: [number, number], r: number): boolean => {
      const mark = marks[index];
      if (!mark) return false;
      /* Beschränkt sich der Radierer auf eine Werkzeugart, geht alles
         andere unangetastet durch (E482). */
      const nur = RADIER_NUR(radierModus);
      if (nur && mark.art !== nur) return false;
      /* Ein Bild radiert man nicht weg — wie in GoodNotes: der Radierer
         gilt der Tinte, ein Bild geht ueber die Auswahl (E357). */
      if (mark.art === 'bild') return false;
      /* Gesperrtes auch nicht (E466). */
      if (mark.gesperrt) return false;
      const id = idOf(mark);
      const teilbar = radierModus === 'teil' && (mark.art === 'stift' || mark.art === 'marker');
      const stuecke: Array<{ pts: number[][]; pressure: number[]; kanaele?: Record<string, number[]> }> = teilbar
        ? InkGeometry.splitByCircle(mark.pts, mark.pressure, center, r,
            { neigung: mark.neigung, tempo: mark.tempo }) : [];
      /* Nur am Rand gestreift, nichts abgeschnitten: dann bleibt die Marke.
         Verglichen werden die PUNKTE, nicht ihre Zahl — ein Endpunkt im
         Kreis wird durch den Eintrittspunkt ersetzt, die Zahl bleibt gleich,
         die Marke nicht (gefunden von test344 §2: die Luecke war 2,7 statt 7,2). */
      if (teilbar && stuecke.length === 1 && JSON.stringify(stuecke[0]!.pts) === JSON.stringify(mark.pts)) return false;
      nodeFor(id)?.remove();
      gezeichnet.delete(id);
      selection.delete(id);
      /* Neigung und Tempo gehen mit (E704): ein Stück trägt je Punkt genau
         einen Wert, statt der alten Liste in der alten Länge. */
      const ersatz = stuecke.map((stueck, n) => {
        const neu = { ...clone(mark), id: n === 0 ? id : frischeId(), pts: stueck.pts, pressure: stueck.pressure };
        for (const kanal of ['neigung', 'tempo'] as const) {
          if (stueck.kanaele?.[kanal]) neu[kanal] = stueck.kanaele[kanal]; else delete neu[kanal];
        }
        return neu;
      });
      marks.splice(index, 1, ...ersatz);
      ersatz.forEach(neu => { const node = zeichneMarke(neu); if (node) { flaeche.appendChild(node); merke(neu); } });
      return true;
    };
    const radiereBei = (roh: number[]): boolean => {
      const center: [number, number] = [roh[0] ?? 0, roh[1] ?? 0];
      const r = radierRadius();
      let getroffen = false;
      for (let index = marks.length - 1; index >= 0; index--) {
        const mark = marks[index];
        if (radierModus === 'marker' && mark.art !== 'marker') continue;
        if (!InkGeometry.touchesCircle(mark, center, r, strokeWidth(mark) / 2)) continue;
        if (radiereEine(index, center, r)) getroffen = true;
      }
      return getroffen;
    };
    /* EIN TIPP AUF EINE MARKE MEINT DIESE MARKE (E352, gefunden von test174 §5):
       drei Striche uebereinander, ein Tipp auf den obersten — der Kreis
       haette alle drei genommen. Erst die Marke unter dem Zeiger; erst wenn
       dort nichts ist oder nichts geschieht, sucht der Kreis. */
    const radiereMarke = (id: string, roh: number[]): boolean => {
      const index = marks.findIndex(mark => idOf(mark) === id);
      if (index < 0) return false;
      return radiereEine(index, [roh[0] ?? 0, roh[1] ?? 0], radierRadius());
    };

    /**
     * WIE FLACH LIEGT DER STIFT (E507)?
     *
     * Pointer Events Level 3 gibt `tiltX` und `tiltY` — die Neigung gegen
     * die Senkrechte, je Achse, in Grad von −90 bis 90 (Dossier S.5).
     * Zusammen ergeben sie den Winkel gegen das Papier; hier wird daraus
     * eine Zahl von 0 (senkrecht) bis 1 (ganz flach).
     *
     * `-1` heisst NICHT GEMELDET, und das ist etwas anderes als „null
     * Grad": eine Maus, ein Finger und ein Stift ohne Neigungssensor
     * bekommen kein Feld, statt eines mit erfundenen Nullen. Sonst
     * trüge jede alte Mausnotiz plötzlich Stiftdaten (§9).
     */
    const neigungAus = (event: PointerEvent): number => {
      if (event.pointerType !== 'pen') return -1;
      const tx = Number((event as any).tiltX) || 0;
      const ty = Number((event as any).tiltY) || 0;
      if (!tx && !ty) return -1;
      /* Der Winkel gegen die Senkrechte aus beiden Achsen. `tan` addiert
         sich in der Ebene, nicht die Winkel selbst — deshalb über den
         Tangens und nicht über `hypot(tx, ty)`. */
      const r = Math.PI / 180;
      const w = Math.atan(Math.hypot(Math.tan(tx * r), Math.tan(ty * r))) / r;
      return Math.round(Math.max(0, Math.min(1, w / 90)) * 100) / 100;
    };

    const pressureOf = (event: PointerEvent): number => {
      const pressure = Number(event.pressure);
      return pressure > 0 ? Math.max(0.05, Math.min(1, pressure)) : 0.5;
    };
    /* DRUCK OHNE DRUCKSENSOR (E351). Maus und Finger melden 0,5 oder gar
       nichts; ein Fueller, der darauf hoert, waere ein Kugelschreiber. Wer
       keinen Stift fuehrt, bekommt das TEMPO als Ersatz: langsam ist dick,
       schnell ist duenn — so schreibt auch die Hand. Geglaettet, damit
       kein Ruckeln der Maus als Zittern im Strich landet. Der Wert landet
       im selben Feld `pressure`: kein zweites Format, keine Migration. */
    const druckAus = (event: PointerEvent, point: number[]): number => {
      const stift = event.pointerType === 'pen';
      if (stift && Number(event.pressure) > 0) {
        sensorZuletzt = pressureOf(event);
        return sensorZuletzt;
      }
      /* EIN STIFT, DER KURZ 0 MELDET, BLEIBT EIN STIFT (E675). Bis hierher
         entschied jede Meldung für sich: 0 hiess „kein Sensor", und der
         Tempo-Ersatz sprang ein — mitten im Strich, mit 0,6 beim ersten
         Mal. Wer mit leichter Hand (0,2) schrieb, bekam an der Stelle einen
         Punkt, dreimal so breit, den niemand gedrückt hatte. Ein Stift, der
         schon Druck gemeldet hat, behält jetzt seinen letzten Sensorwert;
         nur ein Stift, der NIE Druck meldet, bekommt den Ersatz — und sagt
         dann in `druckArt` ehrlich „tempo". */
      if (stift && sensorZuletzt !== null) return sensorZuletzt;
      if (!running) return pressureOf(event);
      const jetzt = Number(event.timeStamp) || 0;
      const z = running.zuletzt as { t: number; p: number[]; d: number } | undefined;
      let druck = 0.6;
      if (z && z.p) {
        const dt = Math.max(1, jetzt - z.t);
        const v = Math.hypot((point[0] ?? 0) - (z.p[0] ?? 0), (point[1] ?? 0) - (z.p[1] ?? 0)) / dt;
        druck = Math.max(0.28, Math.min(0.85, 0.85 - v * 0.4));
        druck = z.d * 0.6 + druck * 0.4;
      }
      running.zuletzt = { t: jetzt, p: point, d: druck };
      return Math.round(druck * 100) / 100;
    };
    const stiftGesehen = (): void => {
      stiftZuletzt = Date.now();
      flaeche.setAttribute('data-stift', 'an');
      const dokument = flaeche.closest<HTMLElement>('.document-workspace');
      if (dokument) dokument.dataset.documentPen = 'seen';
      if (stiftTimer) clearTimeout(stiftTimer);
      stiftTimer = setTimeout(() => {
        if (!flaeche.closest('.document-workspace')) flaeche.removeAttribute('data-stift');
        stiftTimer = null;
      }, STIFT_SPERRE_MS);
    };
    const fingerGesperrt = (event: PointerEvent): boolean =>
      event.pointerType === 'touch' &&
      (flaeche.closest<HTMLElement>('.document-workspace')?.dataset.documentPen === 'seen' ||
       Date.now() - stiftZuletzt < STIFT_SPERRE_MS || (running !== null && running.zeigerArt === 'pen'));
    /* Einen angefangenen Strich VERWERFEN: kein Knoten, kein Schritt im
       Verlauf — als haette es ihn nie gegeben.

       AUFGERAEUMT WIRD DASSELBE WIE IN `finish` (E504). Bis hierher blieben
       `feder`, `glatt`, `druckGlatt` und ein bestelltes Bild stehen; das
       fiel nicht auf, weil der naechste Aufsetzpunkt sie ohnehin neu setzt.
       Mit dem Abbruch durch den Browser gibt es jetzt einen Weg hierher,
       der NICHT von einem Aufsetzen gefolgt sein muss — und ein bestelltes
       Bild fuer einen Strich, den es nicht mehr gibt, ist genau die Sorte
       Rest, die spaeter niemand mehr erklaeren kann. */
    const verwerfen = (): void => {
      bildAbsagen();
      laserAus(true);
      if (running) { runningNode?.remove(); running = null; runningNode = null; beforeRunning = null; }
      feder = null; glatt = null; druckGlatt = null;
      letzteZeit = 0; nassFlaeche = false; rohLetzter = null; rohDrei = [];
      rohZeiten = []; sensorVerlauf = []; tempoMessen = null; tempoJetzt = 0;
      aktiverZeiger = null;
    };
    /* ══ DER LASERSTRAHL (E512) ════════════════════════════════════════════
       Drei kurze Wege, und keiner davon fasst `marks` an. Der Knoten hängt
       in der Zeichenschicht, damit er dieselbe Geometrie hat wie alles
       andere — und trägt `data-ink-ui`, damit ihn jeder Weg, der Marken
       sucht, übersieht (dieselbe Marke wie der Radierkreis und der
       Auswahlrahmen). */
    const laserAn = (punkt: number[]): void => {
      laserAus(true);
      const art = laserArt();
      const knoten = svg('g', { 'data-ink-ui': 'laser', class: 'blatt-laser' });
      const spur = svg('path', { class: 'blatt-laser-spur', d: '' });
      const kopf = svg('circle', { class: 'blatt-laser-kopf', r: '4.5',
        cx: String(punkt[0]), cy: String(punkt[1]) });
      if (art === 'linie') knoten.appendChild(spur);
      knoten.appendChild(kopf);
      flaeche.appendChild(knoten);
      laserZug = { pts: [[punkt[0] ?? 0, punkt[1] ?? 0]], knoten };
    };
    const laserZeigen = (punkt: number[]): void => {
      if (!laserZug) return;
      const pts = laserZug.pts;
      const letzt = pts[pts.length - 1]!;
      if (Math.hypot((punkt[0] ?? 0) - letzt[0]!, (punkt[1] ?? 0) - letzt[1]!) < 0.8) return;
      pts.push([punkt[0] ?? 0, punkt[1] ?? 0]);
      /* NUR DAS LETZTE STÜCK BLEIBT SICHTBAR. Eine Spur, die den ganzen
         Weg behält, ist eine Zeichnung — und genau das soll sie nicht
         sein. Vierzig Punkte sind bei 60 Hz gut zwei Drittel Sekunde. */
      if (pts.length > 40) pts.splice(0, pts.length - 40);
      const kopf = laserZug.knoten.querySelector('.blatt-laser-kopf');
      kopf?.setAttribute('cx', String(punkt[0]));
      kopf?.setAttribute('cy', String(punkt[1]));
      const spur = laserZug.knoten.querySelector('.blatt-laser-spur');
      if (spur) spur.setAttribute('d', InkGeometry.path(pts));
    };
    /** Weg damit. `sofort` beim Neuanfang, sonst verblasst er. */
    const laserAus = (sofort = false): void => {
      const zug = laserZug;
      laserZug = null;
      if (!zug) return;
      if (sofort) { zug.knoten.remove(); return; }
      zug.knoten.classList.add('blatt-laser-weg');
      setTimeout(() => zug.knoten.remove(), LASER_MS + 120);
    };

    /** Ein Punkt in den Strich. `um` ist der Umrechner DIESES Ereignisses
     *  (E511) — er holt die Bildschirmmatrix einmal statt je Punkt. */
    const addSample = (event: PointerEvent, um?: (e: PointerEvent) => [number, number] | null): void => {
      if (!running) return;
      const sample = um ? um(event) : R.zuBlatt(flaeche, event);
      const roh = sample ? ruler.project(sample) : null;
      if (!roh) return;
      /* DER DRUCK KOMMT AUS DEM ROHEN PUNKT (E376): der Ersatzdruck fuer
         Maus und Finger rechnet aus der Geschwindigkeit, und geglaettete
         Punkte bewegen sich langsamer als die Hand. */
      const drucken = druckAus(event, roh);
      const jetzt = Number(event.timeStamp) || letzteZeit;
      const dt = letzteZeit ? Math.max(1, jetzt - letzteZeit) : 16;
      letzteZeit = jetzt;
      dtLetzt = dt;
      /* GEGLAETTET WIRD IMMER, GESPEICHERT NICHT (E376). Der Filter laeuft
         auch dann weiter, wenn der Punkt unter der Schwelle bleibt — sonst
         bliebe er bei langsamer Hand fuer immer hinter ihr zurueck. */
      const point = glatt ? glatt(roh as [number, number], dt) : roh;
      rohLetzter = roh;
      rohDrei.push(roh);
      if (rohDrei.length > 3) rohDrei.shift();
      rohZeiten.push(dt);
      if (rohZeiten.length > 3) rohZeiten.shift();
      if (sensorZuletzt !== null && event.pointerType === 'pen') {
        sensorVerlauf.push(sensorZuletzt);
        if (sensorVerlauf.length > 8) sensorVerlauf.shift();
      }
      /* DAS TEMPO DER HAND (E704) — an den ROHEN Punkten, wie der Druck. */
      if (tempoMessen) tempoJetzt = tempoMessen(roh as [number, number], dt);
      const druck = druckGlatt ? druckGlatt(drucken) : drucken;
      const last = running.pts[running.pts.length - 1];
      if (last && Math.abs(last[0] - point[0]) < 0.6 && Math.abs(last[1] - point[1]) < 0.6) return;
      if (last) wegNass += Math.hypot(point[0] - last[0], point[1] - last[1]);
      running.pts.push(point);
      running.pressure.push(druck);
      /* Die Neigung wandert Punkt für Punkt mit — aber nur, wenn der Stift
         sie meldet. Eine `-1` heisst „nicht gemeldet"; sie wird beim
         Absetzen zu nichts, statt zu einer Null zu werden (E507). */
      if (running.neigung) running.neigung.push(neigungAus(event));
      if (running.tempo) running.tempo.push(tempoJetzt);
      breiteFestlegen(jetzt);
      /* Die Uhr läuft erst weiter, wenn die Hand ihren Ruhepunkt VERLÄSST
         (E490) — ein Zittern an derselben Stelle ist keine Bewegung. */
      const ruhe = running.ruhePunkt;
      if (!ruhe || Math.hypot(point[0] - ruhe[0], point[1] - ruhe[1]) > RUHE_RADIUS) {
        running.ruhePunkt = [point[0], point[1]];
        running.bewegtUm = Date.now();
      }
      feder?.punkt(point, halbeBreite(running, druck) * nassSpitze());
    };

    /* Die halbe Strichbreite an einer Stelle — dieselbe Rechnung, die
       `zeichneMarke` fuer den trockenen Fuellerstrich anstellt. Waere sie
       hier anders, spraenge der Strich beim Absetzen des Stifts. */
    const halbeBreite = (mark: any, druck: number): number => {
      const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
      /* AUCH DER NASSE STRICH KENNT DIE NEIGUNG (E507). Ohne diese Zeile
         wüchse der Bleistift erst beim Absetzen — man hielte den Stift
         flach, sähe einen schmalen Strich, liesse los, und er würde
         plötzlich breit. Genommen wird die letzte gemeldete Neigung: der
         Winkel ändert sich langsam, der Strich läuft schnell. */
      const neig: number[] = Array.isArray(mark?.neigung) ? mark.neigung : [];
      const n = Number(neig[neig.length - 1]);
      /* DAS TEMPO AUCH NASS (E704), mit derselben Kurve wie trocken
         (`halbeBreiten`) — aber nur, solange ein Sensor meldet: */
      const eile = Array.isArray(mark?.tempo) && sensorZuletzt !== null ? eileVon(String(mark?.stil || '')) : 0;
      return base / 2 * druckFaktor(String(mark?.stil || ''), druck,
        Number.isFinite(n) && n > 0 ? n : 0) * (eile ? InkStroke.tempoFaktor(tempoJetzt, eile) : 1);
    };
    /* DIE BREITE WIRD EINMAL FESTGELEGT (E704): Linienstifte mit Sensor nach
       50 ms (Zeit, nicht Punkte — E504) aus dem Median bis dahin; Maus und
       Finger die gewählte Breite. */
    let breiteAb = 0;
    const breiteFestlegen = (jetzt = 0): void => {
      if (!running || Number(running.breiteFest) > 0) return;
      const linie = running.art === 'marker'
        || (running.art === 'stift' && !FLAECHEN_STIFTE.has(String(running.stil || '')));
      if (!linie) return;
      const base = Math.max(0.5, Number(running.breite) || BREITEN[1]);
      const mal = running.art === 'marker' ? 4 : 1;
      if (running.zeigerArt !== 'pen') { running.breiteFest = Math.round(base * mal * 100) / 100; return; }
      if (!breiteAb) breiteAb = jetzt;
      if (running.pressure.length < 3 || jetzt - breiteAb < 50) return;
      const werte = running.pressure.map(Number).filter(Number.isFinite).sort((a: number, b: number) => a - b);
      const mitte = sensorZuletzt !== null ? (werte[Math.floor(werte.length / 2)] ?? 0.5) : 0.5;
      const faktor = Math.max(0.55, Math.min(1.55, 0.65 + mitte * 0.7));
      running.breiteFest = Math.round(base * faktor * mal * 100) / 100;
    };
    /* DIE SPITZE DES NASSEN STRICHS (E673): dieselbe Kurve wie beim
       trockenen (`InkGeometry.spitzeFaktor`), aber nur vom Anfang her —
       das Ende kennt der Strich erst, wenn die Hand abhebt; dann baut
       `finish` den Knoten aus der Marke neu, und `halbeBreiten` legt die
       zweite Spitze an. Was hier steht, wird gezeichnet, nie gespeichert. */
    const nassSpitze = (): number => {
      if (!running) return 1;
      const base = Math.max(0.5, Number(running.breite) || BREITEN[1]);
      return InkGeometry.spitzeFaktor(wegNass, spitzeLaenge(base), spitzeVon(String(running.stil || '')));
    };

    /* ---- EIN BILD JE BILD, NICHT JE EREIGNIS (E376) ----------------------
     * Ein Stift meldet sich bis zu 240-mal je Sekunde, ein Bildschirm zeigt
     * 60- bis 120-mal. Bis hierher wurde jede Meldung sofort gezeichnet —
     * bis zu drei Viertel dieser Arbeit sah nie jemand. Jetzt sammelt der
     * Strich und zeichnet einmal je Bild.
     * -------------------------------------------------------------------- */
    const nassZeichnen = (): void => {
      if (!running || !feder || !runningNode) return;
      const alsFlaeche = running.art === 'stift' &&
        FLAECHEN_STIFTE.has(String(running.stil)) && feder.laenge() >= 3;
      if (alsFlaeche !== nassFlaeche) {
        /* Der Strich wechselt die Bauart — der Knoten wird einmal ganz neu
           gebaut, danach genuegt wieder sein `d`. */
        nassFlaeche = alsFlaeche;
        runningNode = updateNode(runningNode, nasseMarke());
        return;
      }
      /* DER KEIL (E704) rechnet seine Fläche aus dem ganzen Weg — O(n), bei
         300 Punkten unter einer Drittel Millisekunde (messungen §76). */
      if (running.art === 'marker' && running.stil === 'keil') {
        runningNode.setAttribute('d', InkGeometry.vieleckPfad(keilVielecke(running, feder.punkteMitNass())));
        return;
      }
      const d = alsFlaeche ? feder.d() : feder.linie();
      if (d) runningNode.setAttribute('d', d);
      /* Seit E704 steht hier meist die FESTE Breite (`breiteFestlegen`):
         dieselbe Zahl in jedem Bild. Nur in den ersten drei Meldungen
         eines Stifts mit Sensor gilt noch der Mittelwert. */
      if (!alsFlaeche) runningNode.setAttribute('stroke-width', String(strokeWidth(running)));
    };
    /* Die Marke, wie sie GERADE aussieht — mit mindestens zwei Punkten,
       damit `zeichneMarke` auch beim Aufsetzen etwas zu zeichnen hat. */
    const nasseMarke = (): any => ({ ...running,
      pts: running.pts.length > 1 ? running.pts : [running.pts[0], running.pts[0]] });
    /* ---- DER NASSE SCHWANZ (E376) ---------------------------------------
     * Zwischen der Bewegung der Hand und dem Bild auf dem Glas liegen immer
     * ein paar Millisekunden — das ist die Luecke, die GoodNotes fuellt.
     * Der Browser hilft mit `getPredictedEvents()`, wo er kann; sonst rechnet
     * `InkStroke.vorhersage` selbst weiter.
     *
     * DIESE PUNKTE GEHEN NIE IN `running.pts`. Ein vorhergesagter Punkt ist
     * eine Vermutung ueber die naechsten 14 ms; gespeichert waere er fuer
     * immer da, und jeder Strich endete mit einem Ueberschuss, den niemand
     * gezogen hat. `Feder.nass()` zeichnet ihn, `Feder.punkte()` kennt ihn
     * nicht — test366 haelt genau das fest.
     * -------------------------------------------------------------------- */
    const nassenSchwanz = (event: PointerEvent, um?: (e: PointerEvent) => [number, number] | null): void => {
      if (!feder || !running || ruler.constrained()) return;
      const druck = running.pressure[running.pressure.length - 1] ?? 0.5;
      const halb = halbeBreite(running, druck) * nassSpitze();
      let pts: number[][] = [];
      /* DIE BREMSE (E704): hebt der Stift ab oder bremst die Hand, reicht
         die Vermutung weniger weit — für die Punkte des Browsers wie für
         die eigene Vorhersage. */
      const halt = InkStroke.bremse(rohDrei as any, rohZeiten, sensorVerlauf);
      const vom = typeof (event as any).getPredictedEvents === 'function'
        ? (event as any).getPredictedEvents() as PointerEvent[] : [];
      if (vom.length) {
        const roh: number[][] = [];
        for (const p of vom.slice(0, 3)) {
          const q = um ? um(p) : R.zuBlatt(flaeche, p);
          if (q) roh.push(q);
        }
        /* E704: die Punkte des Browsers unter denselben Deckel wie
           `vorhersage` — keine Kehre, Länge nach Zeit, Bremse. */
        pts = InkStroke.deckeln(rohDrei as any, roh as any, dtLetzt, halt) as any;
      }
      if (!vom.length) {
        /* AN DEN ROHEN PUNKTEN GERECHNET (E511), nicht an `running.pts`:
           die sind geglättet und laufen selbst hinterher. */
        pts = InkStroke.vorhersage(rohDrei as any, InkStroke.VORHER_MS, dtLetzt, halt) as any;
      }
      /* ══ DIE TINTE HOLT DIE SPITZE EIN (E511) ═══════════════════════════
         Vor der Vermutung steht eine MESSUNG: der letzte rohe Punkt ist
         die Stelle, an der der Stift wirklich war — kein Raten, kein
         Filter. Er kommt als erster Punkt des Schwanzes dazu, und erst
         dahinter das Vorausgezeichnete.

         Das ist der ganze Unterschied zwischen „die Tinte klebt am Stift"
         und „die Tinte kommt hinterher": der geglättete Strich darf
         ruhig 6 px zurückliegen, solange der SICHTBARE Kopf dort ist, wo
         die Hand ist. Gespeichert wird davon nichts (E376). */
      const spitze = rohLetzter;
      if (spitze) {
        const letzterFest = running.pts[running.pts.length - 1];
        const weg = letzterFest
          ? Math.hypot(spitze[0]! - letzterFest[0]!, spitze[1]! - letzterFest[1]!) : 0;
        if (weg > 0.2) pts = [[spitze[0]!, spitze[1]!], ...pts];
      }
      feder.nass(pts as any, pts.map(() => halb));
    };

    const bildAnfordern = (): void => {
      if (bildWunsch) return;                     /* ein Bild ist schon bestellt */
      if (typeof requestAnimationFrame !== 'function') { nassZeichnen(); return; }
      bildWunsch = requestAnimationFrame(() => { bildWunsch = 0; nassZeichnen(); });
    };
    const bildAbsagen = (): void => {
      if (bildWunsch && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(bildWunsch);
      bildWunsch = 0;
    };
    /* EIN BILD AUFS BLATT (E357, L115 Punkt 6). Der Weg: Dateiwaehler,
       Datei in die Ablage (in Stuecken, mit dem Blatt als Block — so wandert
       sie mit Sicherung, Abgleich und Papierkorb), Groesse aus dem Bild,
       mittig gesetzt, halb so breit wie die Seite, dann gewaehlt und im
       Auswahl-Werkzeug: man will es gleich schieben und ziehen. `mitte`
       kommt vom Tipp mit dem Werkzeug; der Knopf in der Leiste hat keinen
       Punkt und nimmt die Mitte der ersten Seite. */
    const bildMass = (datei: Blob): Promise<{ w: number; h: number } | null> => new Promise(fertig => {
      const url = URL.createObjectURL(datei);
      const bild = new Image();
      bild.onload = () => { fertig({ w: bild.naturalWidth, h: bild.naturalHeight }); URL.revokeObjectURL(url); };
      bild.onerror = () => { fertig(null); URL.revokeObjectURL(url); };
      bild.src = url;
    });
    const bildAblegen = async (datei: File, mitte?: number[]): Promise<boolean> => {
      if (!datei || typeof Dateien === 'undefined' || typeof Dateien.ablegen !== 'function') return false;
      const mass = await bildMass(datei);
      const satz = await Dateien.ablegen(datei, { blockId: block.id, name: datei.name });
      const dateiId = String(satz?.id || '');
      if (!dateiId) return false;
      const seite = umbruch > 0 ? Math.min(umbruch, hoehe) : hoehe;
      const verhaeltnis = mass && mass.w > 0 && mass.h > 0 ? mass.h / mass.w : 3 / 4;
      let w = breite / 2;
      let h = w * verhaeltnis;
      if (h > seite * 0.9) { h = seite * 0.9; w = h / verhaeltnis; }
      const klemme = (wert: number, von: number, bis: number): number => Math.max(von, Math.min(bis, wert));
      const cx = mitte ? klemme(mitte[0] ?? 0, w / 2, breite - w / 2) : breite / 2;
      const cy = mitte ? klemme(mitte[1] ?? 0, h / 2, hoehe - h / 2) : seite / 2;
      const r2 = (wert: number): number => Math.round(wert * 100) / 100;
      const mark = { id: frischeId(), art: 'bild', dateiId,
        pts: [[r2(cx - w / 2), r2(cy - h / 2)], [r2(cx + w / 2), r2(cy + h / 2)]] };
      /* Die Adresse VOR dem Zeichnen holen: dann steht das Bild sofort da,
         nicht erst ein Platzhalter, der gleich wieder weg ist. */
      try { await Dateien.adresse(dateiId); } catch { /* dann eben der Platzhalter */ }
      const before = snapshot();
      marks.push(mark);
      const node = zeichneMarke(mark);
      if (node) { flaeche.appendChild(node); merke(mark); }
      if (tool !== 'select') {
        setzeWerkzeug('select');
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(steuerung, 'select'); } catch { /* egal */ }
        }
      }
      selection = new Set([idOf(mark)]);
      renderSelection();
      commit(before);
      return true;
    };
    /**
     * EINE PDF-SEITE ALS BILD AUF DAS BLATT (E502).
     *
     * Redurs Bitte: „das ich … mein Formelbuch hier einfügen kann und so
     * kleiner grösser machen kann, verschieben kann." Bis hierher konnte
     * Redion eine PDF nur als SEITEN einfügen (E469) — ganze Seiten im
     * Dokument, nicht verschiebbar, nicht skalierbar.
     *
     * Als BILDMARKE ist sie beides: verschieben, ziehen, drehen und sperren
     * kann sie danach dieselbe Auswahl wie jede andere Marke (E353, E466,
     * E474). Es braucht dafür kein neues Werkzeug und keine neue Marke —
     * nur einen zweiten Weg IN `bildAblegen` hinein.
     *
     * GERASTERT, NICHT EINGEBETTET. Die Seite wird einmal gezeichnet und
     * liegt danach als Bild im Dateispeicher; die PDF selbst reist nicht
     * mit. Das ist dieselbe Entscheidung wie in E488 und aus demselben
     * Grund: der Text darin ist danach nicht mehr durchsuchbar, dafür
     * braucht das Blatt beim Öffnen keine fremde Bibliothek.
     */
    const pdfAlsBildmarke = async (datei: File, mitte?: number[]): Promise<boolean> => {
      if (typeof PdfLeser === 'undefined') {
        UI.toast('Der PDF-Leser ist gerade nicht da.');
        return false;
      }
      let leser: any = null;
      try {
        /* `oeffne` will die BYTES, nicht die Datei — nachgeschlagen in
           `leser.ts`, nicht geraten (E21). */
        leser = await PdfLeser.oeffne(new Uint8Array(await datei.arrayBuffer()));
        let nr = 1;
        if (leser.seiten > 1) {
          if (typeof Dialog === 'undefined') return false;
          const antwort = await Dialog.frage(
            'Welche Seite aus „' + datei.name + '"? (1 bis ' + leser.seiten + ')', '1');
          if (antwort === null) return false;
          const gewaehlt = Math.round(Number(String(antwort).replace(',', '.')));
          if (!Number.isFinite(gewaehlt) || gewaehlt < 1 || gewaehlt > leser.seiten) {
            UI.toast('Diese PDF hat die Seiten 1 bis ' + leser.seiten + '.');
            return false;
          }
          nr = gewaehlt;
        }
        const blob = await leser.alsBild(nr);
        const name = datei.name.replace(/\.pdf$/i, '') + ' — Seite ' + nr + '.webp';
        return await bildAblegen(new File([blob], name, { type: blob.type || 'image/webp' }), mitte);
      } catch (e: unknown) {
        UI.toast('Diese PDF liess sich nicht einfügen: ' + (e instanceof Error ? e.message : String(e)));
        return false;
      } finally {
        try { leser?.schliessen?.(); } catch { /* egal */ }
      }
    };

    const bildEinfuegen = (mitte?: number[]): Promise<boolean> => new Promise(fertig => {
      const input = document.createElement('input');
      input.type = 'file';
      /* GIF STEHT IN `image/*` SCHON DRIN — und wird als GIF abgelegt, nicht
         umgerechnet; darum läuft es auf dem Blatt weiter (E502). `.pdf`
         kommt dazu: eine Seite daraus wird zur Bildmarke. Der Doppelweg
         steht ausdrücklich da, weil `accept` sonst je nach System die PDF
         ausgraut. */
      input.accept = 'image/*,image/gif,application/pdf,.pdf';
      /* Im Dokument, wie beim PDF-Waehler (einlesen.ts) — und danach weg. */
      input.style.display = 'none';
      document.body.appendChild(input);
      let entschieden = false;
      const auf = (): void => {
        if (entschieden) return;
        entschieden = true;
        const datei = input.files?.[0];
        input.remove();
        if (!datei) { fertig(false); return; }
        /* Eine PDF geht den anderen Weg — gerastert, dann dieselbe Ablage. */
        const istPdf = datei.type === 'application/pdf' || /\.pdf$/i.test(datei.name);
        const weg = istPdf ? pdfAlsBildmarke(datei, mitte) : bildAblegen(datei, mitte);
        weg.then(fertig, () => {
          if (typeof UI !== 'undefined' && UI.toast) UI.toast('Das Bild liess sich nicht ablegen.');
          fertig(false);
        });
      };
      input.addEventListener('change', auf);
      /* `cancel` kommt in neueren Browsern beim Abbrechen; sonst bleibt das
         Feld unsichtbar stehen, bis das naechste kommt — kein Schaden. */
      input.addEventListener('cancel', auf);
      input.click();
    });

    /** Ist der Zug ein Gekritzel? Mindestens vier Richtungswechsel entlang
     *  der langen Seite seines Kastens, und ein Weg, der mehr als das
     *  Doppelte der Diagonale misst — ein Hin-und-her, kein Bogen. */
    const istKritzel = (roh: number[][]): boolean => {
      const pts = InkGeometry.points(roh);
      if (pts.length < 10) return false;
      const b = InkGeometry.bounds({ pts, breite: 0 });
      const breit = b.width >= b.height;
      let wechsel = 0, letzt = 0, laenge = 0;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i]!, q = pts[i - 1]!;
        const d = breit ? p[0] - q[0] : p[1] - q[1];
        laenge += Math.hypot(p[0] - q[0], p[1] - q[1]);
        const s = d > 0.4 ? 1 : d < -0.4 ? -1 : 0;
        if (s && letzt && s !== letzt) wechsel++;
        if (s) letzt = s;
      }
      return wechsel >= 4 && laenge >= 2.2 * Math.hypot(b.width, b.height);
    };
    /**
     * WELCHE MARKEN DAS GEKRITZEL WEGNIMMT.
     *
     * DER FUND (E476, L133). Bis hierher war die Frage: liegt die Marke im
     * KASTEN des Gekritzels? Ein Kasten ist aber keine Wischspur. Wer von
     * links oben nach rechts unten kritzelt — ein langer, schräger Zug,
     * wie man ihn über eine Zeile macht, die quer steht —, spannt einen
     * Kasten über die halbe Seite auf, und ALLES, dessen Mitte darin
     * liegt, war weg. Auch was zwanzig Zentimeter neben dem Zug stand.
     * Das ist Datenverlust ohne Absicht des Menschen (§9, §51), und es
     * fiel nicht auf, weil ein kurzes Gekritzel einen kleinen Kasten hat.
     *
     * Gefragt wird jetzt, was das Gekritzel WIRKLICH ÜBERQUERT:
     *
     *   · ein Linienzug: mindestens die Hälfte seiner Punkte liegt nah
     *     am Weg des Gekritzels (dieselbe Hälfte-Regel wie zuvor, nur am
     *     Weg statt am Kasten gemessen);
     *   · alles mit Kasten: der Zug geht durch ihn hindurch, oder er
     *     streift seine Mitte — das Zweite fuer kleine Marken, zwischen
     *     deren Groesse zwei Abtastpunkte des Zuges passen.
     *
     * Der Kasten bleibt als billiger VORFILTER: was ihn nicht schneidet,
     * kann der Zug nicht ueberqueren. Bilder und Gesperrtes nie (E466).
     */
    const KRITZEL_NAH = 6;
    const kritzelTrifft = (roh: number[][]): Set<string> => {
      const zug = InkGeometry.points(roh);
      const k = InkGeometry.bounds({ pts: roh, breite: KRITZEL_NAH });
      const weg = new Set<string>();
      if (!zug.length) return weg;
      for (const m of marks) {
        if (m.art === 'bild' || m.gesperrt) continue;
        if (!InkGeometry.intersects(k, InkGeometry.bounds(m))) continue;
        if (InkGeometry.LINIEN.has(String(m.art)) && Array.isArray(m.pts) && m.pts.length) {
          /* DICHTER ABGETASTET, NICHT AN DEN ECKEN GEZÄHLT (E510).
             Hier stand `InkGeometry.points(m.pts)` — die gespeicherten
             Punkte. Ein Stift-Strich hat davon hunderte, eine gerade
             `line` genau zwei: ihre Enden. Dieselbe Hälfte-Regel fragte
             also beim Strich nach seiner LÄNGE und bei der Linie nur nach
             ihren ENDEN, und ein Gekritzel quer über die Mitte einer
             Linie nahm sie deshalb nicht weg. Jetzt wird beides an der
             Länge gemessen: `densify` legt Messpunkte im Abstand
             `KRITZEL_NAH` auf den Weg, dichte Striche bleiben davon
             unberührt. */
          const punkte = InkGeometry.densify(m.pts, KRITZEL_NAH);
          const n = punkte.filter(q => InkGeometry.distanceToPolyline(zug, q) <= KRITZEL_NAH).length;
          if (n * 2 >= punkte.length) weg.add(idOf(m));
        } else {
          const b = InkGeometry.bounds(m);
          const mitte: [number, number] = [b.x + b.width / 2, b.y + b.height / 2];
          const ecken = InkGeometry.ecken(m);
          if (InkGeometry.distanceToPolyline(zug, mitte) <= KRITZEL_NAH
            || zug.some(q => InkGeometry.insidePolygon(q, ecken))) weg.add(idOf(m));
        }
      }
      return weg;
    };
    /** Ist der Zug eine geschlossene Schlinge? Dieselbe Frage wie in
     *  `InkShapes.recognize`: Anfang und Ende nah, der Weg laenger als ein
     *  Halbbogen. */
    const istSchlinge = (roh: number[][]): boolean => {
      const pts = InkGeometry.points(roh);
      if (pts.length < 8) return false;
      const b = InkGeometry.bounds({ pts, breite: 0 });
      const diag = Math.hypot(b.width, b.height);
      if (diag < 12) return false;
      const a = pts[0]!, z = pts[pts.length - 1]!;
      let laenge = 0;
      for (let i = 1; i < pts.length; i++) laenge += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
      return Math.hypot(z[0] - a[0], z[1] - a[1]) <= 0.2 * diag && laenge >= 1.5 * diag;
    };

    const finish = (): boolean => {
      aktiverZeiger = null;
      if (radierStrich) {
        const strich = radierStrich;
        radierStrich = null;
        strich.kreis?.remove();
        if (!strich.geaendert) return false;
        renderSelection();
        commit(strich.before);
        return true;
      }
      if (selectDrag) {
        const drag = selectDrag;
        selectDrag = null;
        flaeche.querySelectorAll('[data-ink-ui="box"]').forEach(node => node.remove());
        if ((drag.mode === 'move' || drag.mode === 'scale' || drag.mode === 'rotate' || drag.mode === 'kurve') && drag.moved) { commit(drag.before); return true; }
        if (drag.mode === 'lasso') {
          const pts = drag.pts as number[][];
          if (!drag.add) selection.clear();
          /* Eine Schlinge ist es erst, wenn sie Flaeche hat: mindestens ein
             Siebtel ihres Kastens. Ein fast gerader Zug — mit dem Zittern
             der Hand nie ganz gerade — ist der Kasten von frueher (E352),
             nicht ein Splitter, in dem nichts liegt. */
          const huelle = InkGeometry.union(pts.map(q => ({ x: q[0] ?? 0, y: q[1] ?? 0, width: 0, height: 0 })));
          const flaeche = InkGeometry.polygonArea(pts);
          if (pts.length >= 3 && flaeche > 4 && flaeche >= 0.15 * huelle.width * huelle.height) {
            marks.forEach(mark => { if (imLasso(mark, pts)) selection.add(idOf(mark)); });
          } else if (pts.length >= 2) {
            const a = pts[0]!, z = pts[pts.length - 1]!;
            const box = InkGeometry.rectangle([a[0] ?? 0, a[1] ?? 0], [z[0] ?? 0, z[1] ?? 0]);
            marks.forEach(mark => {
              /* Der aufrechte Kasten ist der billige Vorfilter … */
              if (!InkGeometry.intersects(box, InkGeometry.bounds(mark))) return;
              /* … und bei einer GEDREHTEN Marke nur der Vorfilter (E474):
                 gewaehlt wird, was der Zug wirklich schneidet. Sonst faengt
                 ein Zug in der leeren Ecke des Kastens eine Marke ein, die
                 hundertfuenfzig Punkte daneben steht. */
              if (InkGeometry.drehung(mark) && !InkGeometry.overlapConvex(
                InkGeometry.kastenEcken(box), InkGeometry.ecken(mark))) return;
              selection.add(idOf(mark));
            });
          }
          renderSelection();
          /* ══ EIN TIPP AUF LEERES PAPIER SCHREIBT (E605) ══════════════════
             REDUR, 16. September 2026: „dort sollte, wenn ich klicke, wie
             Word direkt erstellen können."

             In Word klickt man in die Seite und tippt — kein Werkzeug
             dazwischen. Genau das fehlte noch: E597 brauchte das
             Textwerkzeug, E599 zwei Tipps. Jetzt genügt EINER.

             DREI BEDINGUNGEN, und jede hat ihren Grund:

               · `istTipp` — der Zeiger hat sich nicht bewegt. Ein Zug ist
                 ein Lasso und bleibt eines; nur ein Tipp schreibt.
               · `drag.warLeer` — vor dem Tipp war nichts gewählt. Der erste
                 Tipp nach einer Auswahl HEBT SIE AUF, und das muss er
                 weiter tun: wer drei Striche gewählt hat und danebentippt,
                 will sie loswerden, nicht einen Kasten anfangen.
               · `!selection.size` — der Tipp hat auch nichts eingefangen.

             Das gilt nur mit der Auswahl: ein Lasso entsteht nur dort. Mit
             dem Stift ist ein Tipp ein Punkt, mit dem Radierer ein
             Radierversuch — beides soll er bleiben. */
          const istTipp = pts.length < 2 || pts.every(q =>
            Math.abs((q[0] ?? 0) - (pts[0]![0] ?? 0)) <= 4
            && Math.abs((q[1] ?? 0) - (pts[0]![1] ?? 0)) <= 4);
          if (istTipp && drag.warLeer && !drag.add && !selection.size) {
            schreiberOeffnen(pts[0] ?? [0, 0], '');
            return false;
          }
        }
        return false;
      }
      if (!running) return false;
      const mark = running;
      const node = runningNode;
      const before = beforeRunning || snapshot();
      /* Ein bestelltes Bild waere jetzt ein Bild ohne Strich (E376). */
      bildAbsagen();
      const letzterRoh = rohLetzter;
      feder = null; glatt = null; druckGlatt = null; letzteZeit = 0; nassFlaeche = false;
      rohLetzter = null; rohDrei = [];
      running = null; runningNode = null; beforeRunning = null;
      /* WOHER DER DRUCK KAM, BLEIBT AM STRICH (E507).
         Bis hierher wurde `zeigerArt` beim Absetzen weggeworfen, und danach
         lagen im Feld `pressure` gemessene Sensorwerte und die
         Tempo-Erfindung für Maus und Finger nebeneinander, ununterscheidbar.
         Das Dossier (S.5, S.17) verlangt genau diese Trennung: Druck und
         Winkel normalisieren, aber die Herkunft nicht vergessen. Ein Wort
         am Strich kostet nichts und beantwortet die Frage für immer. */
      if (mark.art === 'stift' || mark.art === 'marker')
        /* „stift" nur, wenn der Sensor wirklich etwas gemeldet hat (E675);
           ein Stift ohne Sensor hat seine Werte aus dem Tempo, wie ein
           Finger — und so soll es dastehen. */
        mark.druckArt = mark.zeigerArt === 'pen' && sensorZuletzt !== null ? 'stift' : 'tempo';
      /* DAS TEMPO BLEIBT NUR MIT SENSOR (E704). Mit Maus und Finger steckt es
         schon im Ersatzdruck (E351) — zweimal gezählt wäre es doppelt so
         stark, und genau das hätte niemand bestellt. */
      if (mark.druckArt !== 'stift' || !Array.isArray(mark.tempo)) delete mark.tempo;
      tempoMessen = null; rohZeiten = []; sensorVerlauf = [];
      delete mark.zeigerArt;
      /* DIE NEIGUNG NUR, WENN SIE GEMELDET WURDE. `-1` heisst „kein
         Sensor"; ein Feld voller Nullen wäre eine Behauptung über den
         Winkel, den niemand gemessen hat. */
      if (Array.isArray(mark.neigung)) {
        const echt = mark.neigung.map((v: unknown) => Number(v));
        if (echt.some((v: number) => v >= 0)) mark.neigung = echt.map((v: number) => v < 0 ? 0 : v);
        else delete mark.neigung;
      }
      const gehalten = Date.now() - (Number(mark.bewegtUm) || 0) >= HALTEN_MS;
      delete mark.bewegtUm;
      delete mark.ruhePunkt;
      /* EINE FERTIGE KURVE HAT DREI PUNKTE (E483). Beim Ziehen sind es
         zwei; der dritte kommt beim Absetzen dazu und liegt in der Mitte
         — dann ist die Kurve eine Gerade, und der Griff steht bereit. */
      if (mark.art === 'curve' && Array.isArray(mark.pts) && mark.pts.length === 2) {
        const a = InkGeometry.points(mark.pts)[0]!, z = InkGeometry.points(mark.pts)[1]!;
        mark.pts = [mark.pts[0], mark.pts[1],
          [Math.round((a[0] + z[0]) / 2 * 100) / 100, Math.round((a[1] + z[1]) / 2 * 100) / 100]];
      }
      /* KRITZEL-LOESCHEN (E466), wie GoodNotes' Scribble to Erase: ein
         dichtes Hin-und-her ueber einem Strich nimmt den Strich weg, statt
         ein neuer zu werden. Nur mit dem Stift, nie mit dem Marker, und
         nur, wenn unter dem Gekritzel wirklich etwas liegt — sonst ist es
         ein Strich wie jeder andere. Ein Schritt im Verlauf. */
      if (mark.art === 'stift' && kritzel && istKritzel(mark.pts)) {
        const weg = kritzelTrifft(mark.pts);
        if (weg.size) {
          node?.remove();
          for (let i = marks.length - 1; i >= 0; i--) if (weg.has(idOf(marks[i]))) marks.splice(i, 1);
          selection = new Set([...selection].filter(id => !weg.has(id)));
          redraw(); commit(before);
          return true;
        }
      }
      /* DAS KREIS-LASSO (E466), GoodNotes' Circle to Lasso: einen Bereich
         mit dem Stift umkreisen und HALTEN — liegt etwas darin, ist es
         gewaehlt, und der Strich wird keiner. Liegt nichts darin, gilt
         weiter E355: der gehaltene Kreis wird ein Kreis. So bleibt beides. */
      if (mark.art === 'stift' && gehalten && istSchlinge(mark.pts)) {
        const drin = marks.filter(m => imLasso(m, mark.pts)).map(m => idOf(m));
        if (drin.length) {
          node?.remove();
          setzeWerkzeug('select');
          if (typeof Zeichenziel !== 'undefined') {
            try { Zeichenziel.uebernehme(steuerung, 'select'); } catch { /* egal */ }
          }
          selection = new Set(drin);
          renderSelection();
          return false;
        }
      }
      /* GEHALTEN UND EINE FORM (E355): der Stift wird zur Linie, zum Kreis
         oder zum Rechteck — als dieselbe Marke, mit Farbe und Breite; Druck
         und Stil hat eine Form nicht. Der Marker bleibt Marker: wer
         hervorhebt, will keine Geometrie. */
      if (mark.art === 'stift' && formen && gehalten && typeof InkShapes !== 'undefined') {
        const form = InkShapes.recognize(mark.pts);
        if (form) {
          mark.art = form.art;
          mark.pts = form.pts;
          /* Ein gedrehtes Dreieck bringt seinen Winkel mit (E478); alles
             andere hat keinen, und dann darf auch keiner stehenbleiben. */
          if (form.dreh) mark.dreh = form.dreh; else delete mark.dreh;
          delete mark.pressure;
          /* Eine Form hat keine Handschrift — auch kein Tempo und keine aus
             dem Druck gerechnete Breite (E704). */
          delete mark.tempo;
          delete mark.breiteFest;
          /* DER SCHUTZLEITER ÜBERLEBT DAS GERADEZIEHEN (E490). Sonst wäre
             die eine Sache, für die man ihn braucht — eine gerade
             Erdungsleitung im Schaltplan —, genau die, bei der er vergeht:
             man zieht den Strich, hält, und heraus kommt eine schwarze
             Linie. Jeder andere Stil fällt weg wie bisher; eine Form hat
             keine Handschrift. */
          if (mark.stil !== 'schutzleiter') delete mark.stil;
          delete mark.zuletzt;
        }
      }
      if (mark.art === 'stift' || mark.art === 'marker') {
        // A stationary tap is an intentional dot (i, punctuation, circuit node).
        // Two coincident points use the existing round-cap renderer and data format.
        if (mark.pts.length === 1) {
          mark.pts.push([...mark.pts[0]]);
          mark.pressure.push(mark.pressure[0] ?? 0.5);
        }
        delete mark.zuletzt;
        /* DER STRICH ENDET, WO DIE HAND ABHOB (E376) — wie in GoodNotes.
           Der Glaetter hinkt naturgemaess hinterher; beim Absetzen waeren
           das je nach Tempo zwei bis drei Pixel, und ein Haken, den man
           bewusst bis an eine Linie zieht, bliebe kurz davor stehen.
           `test345` und `test346` haben genau das gefunden: ein Strich bis
           x=300 endete bei 297. Der Anfang ist ohnehin roh (siehe
           pointerdown); hier kommt das Ende dazu. */
        if (letzterRoh) mark.pts[mark.pts.length - 1] = letzterRoh;
        const original: number[][] = mark.pts;
        const druckRoh: number[] = Array.isArray(mark.pressure) ? mark.pressure.map(Number) : [];
        const mittel = druckRoh.length
          ? druckRoh.reduce((sum, value) => sum + value, 0) / druckRoh.length : 0.5;
        /* EIN MARKER AM LINEAL ZIEHT GERADE (E351) — wie in GoodNotes: der
           erste und der letzte Punkt, dazwischen nichts. */
        if (mark.art === 'marker' && lineal) {
          mark.pts = [original[0], original[original.length - 1]];
          mark.pressure = [mittel, mittel].map(v => Math.round(v * 100) / 100);
        } else {
          /* DER DRUCK WANDERT MIT (E351). Bis hierher wurde nach dem
             Vereinfachen jeder Druckwert zum Durchschnitt — ein Fueller
             haette nie anschwellen koennen. Jetzt bleiben die Werte der
             Punkte, die bleiben. */
          let indizes = InkGeometry.simplifyIndices(original, Math.max(0.55, Number(mark.breite) * 0.28));
          /* Ein langer, beim Neuzeichnen geschlossener Strich darf nicht wie
             eine bloss konstruierte Zweipunktlinie aussehen (E115). Acht
             Stuetzpunkte halten Verlauf und Druck, auch wenn er fast gerade war. */
          if (original.length >= 8 && indizes.length < 8) {
            /* DIE ECKEN BLEIBEN (E676). Bis E676 standen hier acht
               GLEICHMÄSSIGE Stützpunkte ANSTELLE der Stützpunkte von RDP —
               für einen fast geraden Strich einerlei, für ein „M" fatal:
               RDP hatte die fünf Ecken behalten, und diese Zeile warf sie
               weg. Das Bild zeigte ein rundes Tal, 23,7 px neben dem
               nächsten gespeicherten Punkt (test564 §4). Jetzt kommen die
               acht zu den Ecken DAZU. */
            const gleichmaessig = Array.from({ length: 8 }, (_value, index) =>
              Math.round(index * (original.length - 1) / 7));
            indizes = Array.from(new Set([...indizes, ...gleichmaessig])).sort((a, b) => a - b);
          }
          /* DIE NEIGUNG WIRD MIT NEU INDIZIERT (E507). Das Vereinfachen wirft
             Stützpunkte weg; wer nur `pts` und `pressure` mitnimmt, lässt
             `neigung` in der alten Länge stehen — und ab da gehört
             `neigung[i]` zu einem anderen Punkt als `pts[i]`. Der Prüflauf
             hat es gesehen: fünfzehn Neigungen zu acht Punkten. */
          const neigRoh: number[] = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
          /* DAS TEMPO GENAUSO (E704) — dieselbe Lehre, ein Kanal mehr. */
          const tempoRoh: number[] = Array.isArray(mark.tempo) ? mark.tempo.map(Number) : [];
          mark.pts = indizes.map(i => original[i]);
          mark.pressure = indizes.map(i => {
            const v = druckRoh[i];
            return Math.round((Number.isFinite(v) ? (v as number) : mittel) * 100) / 100;
          });
          if (neigRoh.length) mark.neigung = indizes.map(i => {
            const v = neigRoh[i];
            return Number.isFinite(v) ? (v as number) : 0;
          });
          if (tempoRoh.length) mark.tempo = indizes.map(i => {
            const v = tempoRoh[i] ?? tempoRoh[tempoRoh.length - 1];
            return Math.round((Number.isFinite(v) ? (v as number) : 0) * 100) / 100;
          });
        }
      } else if (mark.pts.length < 2 ||
                 Math.hypot(mark.pts[1][0] - mark.pts[0][0], mark.pts[1][1] - mark.pts[0][1]) < 1) {
        node?.remove(); return false;
      }
      marks.push(mark);
      runningNode = updateNode(node, mark);
      merke(mark);
      commit(before);
      runningNode = null;
      /* Die frisch aufgezogene Haftnotiz fragt sofort nach ihrem Text —
         eine leere Fläche wäre ein Versprechen ohne Inhalt. */
      if (mark.art === 'zettel' && !String(mark.text || '').trim())
        void zettelText(idOf(mark), true);
      return true;
    };

    /** Text einer Haftnotiz erfragen — mehrzeilig, mit Redions eigenem
     *  Blatt statt prompt() (dessen Schwäche im Whiteboard LUECKEN.md
     *  längst führt). Bricht jemand die FRISCHE Notiz ab oder lässt sie
     *  leer, verschwindet sie wieder: ein leerer Zettel sagt nichts. */
    const zettelText = async (targetId: string, frisch = false): Promise<void> => {
      const zettel = marks.find(mark => idOf(mark) === targetId && mark.art === 'zettel');
      if (!zettel) return;
      if (zettel.gesperrt) { UI.toast('Diese Haftnotiz ist gesperrt — erst entsperren.'); return; }
      const antwort = await Dialog.mehrzeilig('Haftnotiz', String(zettel.text || ''));
      const before = snapshot();
      if (antwort === null || !antwort.trim()) {
        if (frisch || (antwort !== null && !antwort.trim())) {
          const index = marks.findIndex(mark => idOf(mark) === targetId);
          if (index >= 0) { marks.splice(index, 1); redraw(); commit(before); }
        }
        return;
      }
      ersetze(platzVon(targetId), { ...zettel, text: antwort });
      redraw(); commit(before);
    };

    /* DER TEXT (E360, L115 Punkt 6): ein Tipp fragt mehrzeilig — Enter ist
       eine neue Zeile, wie in GoodNotes' Textfeld —, und der Text wird ein
       KASTEN an der getippten Stelle: 40 % der Blattbreite, mindestens 120,
       nie ueber den rechten Rand. Schrift, Groesse, Fett und Rahmen kommen
       aus der Leiste. Ein Tipp auf einen vorhandenen Text bearbeitet ihn;
       leer gemacht heisst weg. Alte einzeilige Marken bleiben einzeilig. */
    /* ══ DIREKT AUF DEM BLATT SCHREIBEN (E597) ═══════════════════════════════
       REDURS SATZ, 15. September 2026: „wenn ich irgendwo klicke, sollte ich
       direkt Text schreiben können" — wie in OneNote.

       GEMESSEN, WAS VORHER WAR: ein Tipp mit dem Textwerkzeug öffnete einen
       MODALEN DIALOG. Das Getippte stand in dessen Feld, die Seite blieb
       leer, und erst „Übernehmen" brachte es aufs Blatt. Für einen Satz, den
       man beim Lesen einer PDF nebenher notiert, sind das drei Schritte zu
       viel.

       WAS JETZT PASSIERT: der Tipp legt ein Schreibfeld GENAU DORTHIN, wo
       der Text stehen wird — mit seiner Schrift, seiner Grösse, seiner Farbe
       und seiner Ausrichtung. Man tippt hinein, und was man sieht, ist, was
       danach dasteht.

       WARUM EIN <textarea> UND KEIN contenteditable: ein Textkasten hält
       reinen Text (`mark.text`), keinen HTML-Baum. Ein `<textarea>` kann gar
       nichts anderes liefern — es gibt keinen Weg, über das Einfügen aus der
       Zwischenablage Auszeichnung oder Markup hereinzutragen (§19). Dazu
       kommt, dass Cursor, Auswahl und die Bildschirmtastatur darin ohne
       eigenen Code funktionieren.

       WARUM IM ELTERNKNOTEN UND NICHT ALS <foreignObject>: die Fläche trägt
       `preserveAspectRatio="none"` und wird über ihren Kasten GEZOGEN. Ein
       Feld darin würde mitgezogen — waagrecht gestauchte Buchstaben, die mit
       dem fertigen Text nichts zu tun haben. Der Elternknoten
       (`.blatt-papier` oder `.blatt-flur`) steht auf `position:relative` und
       deckt genau denselben Kasten; dort gerechnet stimmt die Stelle, und
       die Schrift bleibt Schrift. */
    type Schreiber = { feld: HTMLElement; ziel: string; before: any[];
                       entwurf: any; beobachter: ResizeObserver | null };

    /* ══ EIN KASTEN MIT MEHREREN FORMATEN (E606, L172) ══════════════════════
       So kommt Text aus einer `.pptx`: ein Kasten trägt `laeufe`, je Stück
       ein eigenes Format (E561). Bis hierher fiel das beim Ändern zusammen —
       das Schreibfeld war ein `<textarea>` und hält nur reinen Text.

       JETZT IST DAS FELD EIN `contenteditable`, und jeder Lauf ist ein
       `<span>` darin. Was der Browser beim Tippen mit den Spans macht, ist
       genau das, was ein Mensch erwartet: hineingetippt verlängert das
       Stück, über eine Grenze hinweg gelöscht führt sie zusammen.

       DIE SICHERHEITSFRAGE, UND SIE IST BEANTWORTET (§19): gelesen werden
       beim Übernehmen NUR die `data-*`-Marken, die dieser Code selbst
       gesetzt hat — nie ein `style`, nie ein `class`, nie ein Element.
       Eingefügt wird ausserdem nur REINER Text (`paste` unten). Damit kann
       durch dieses Feld kein Markup in eine Marke gelangen, auch nicht über
       die Zwischenablage. Die Farbe wird zusätzlich geprüft, bevor sie
       gespeichert wird: was kein `#rrggbb` und kein `rgb(...)` ist, fällt
       weg. */
    const farbeGueltig = (wert: unknown): string => {
      const w = String(wert || '').trim();
      return /^#[0-9a-fA-F]{3,8}$/.test(w) || /^rgba?\([\d\s.,%]+\)$/.test(w) ? w : '';
    };
    const laeufeVon = (mark: any): any[] | null =>
      Array.isArray(mark?.laeufe) && mark.laeufe.length ? mark.laeufe : null;

    /** Das Feld aus einer Marke füllen — je Lauf ein `<span>` mit Format. */
    const feldFuellen = (feld: HTMLElement, mark: any): void => {
      feld.textContent = '';
      const laeufe = laeufeVon(mark);
      if (!laeufe) { feld.append(document.createTextNode(textVon(mark))); return; }
      for (const l of laeufe) {
        const stueck = document.createElement('span');
        stueck.dataset.lauf = '1';
        const sz = Number(l?.sz) || 0;
        if (sz > 0) stueck.dataset.sz = String(sz);
        if (l?.fett) { stueck.dataset.fett = '1'; stueck.style.fontWeight = '700'; }
        const farbe = farbeGueltig(l?.farbe);
        if (farbe) { stueck.dataset.farbe = farbe; stueck.style.color = farbe; }
        if (l?.schrift) stueck.dataset.schrift = String(l.schrift);
        stueck.textContent = String(l?.text ?? '');
        feld.appendChild(stueck);
      }
    };

    /** Was im Feld steht — als Text und als Läufe. */
    const feldLesen = (feld: HTMLElement): { text: string; laeufe: any[] } => {
      const laeufe: any[] = [];
      let text = '';
      const anhaengen = (stueck: string, form: any): void => {
        if (!stueck) return;
        text += stueck;
        const letzter = laeufe[laeufe.length - 1];
        /* Gleiches Format nebeneinander wird EIN Lauf — dieselbe Regel, die
           `laufSatz` beim Zeichnen anwendet (geometry.ts). */
        if (letzter && letzter.sz === form.sz && letzter.fett === form.fett
            && letzter.farbe === form.farbe && letzter.schrift === form.schrift) {
          letzter.text += stueck; return;
        }
        laeufe.push({ text: stueck, ...form });
      };
      const gehe = (knoten: Node, form: any): void => {
        for (const kind of Array.from(knoten.childNodes)) {
          if (kind.nodeType === 3) { anhaengen(kind.nodeValue || '', form); continue; }
          const el = kind as HTMLElement;
          if (!el.tagName) continue;
          if (el.tagName === 'BR') { anhaengen('\n', form); continue; }
          /* Enter macht im `contenteditable` einen Block. Für uns ist das
             eine Zeile — ausser beim allerersten, der die erste Zeile IST. */
          if ((el.tagName === 'DIV' || el.tagName === 'P') && text && !text.endsWith('\n'))
            anhaengen('\n', form);
          gehe(el, {
            sz: Number(el.dataset?.sz) || form.sz,
            fett: el.dataset?.fett === '1' ? true : form.fett,
            farbe: farbeGueltig(el.dataset?.farbe) || form.farbe,
            schrift: el.dataset?.schrift || form.schrift });
        }
      };
      gehe(feld, { sz: 0, fett: false, farbe: '', schrift: '' });
      return { text, laeufe };
    };
    let schreiber: Schreiber | null = null;
    let writerRange: Range | null = null;
    let writerFrame = 0;
    /* E697: Ein Formatwechsel darf weder den Entwurf noch die Einfügestelle
       verlieren. Nur ausdrücklich zurückkehren — nie nach einem Aussenklick. */
    const resumeWriting = (): void => {
      if (!schreiber?.feld.isConnected) return;
      schreiber.feld.focus({ preventScroll: true });
      if (writerRange && schreiber.feld.contains(writerRange.commonAncestorContainer)) {
        const selection = getSelection();
        selection?.removeAllRanges(); selection?.addRange(writerRange);
      }
    };
    const scheduleWriterLayout = (): void => {
      if (writerFrame) return;
      writerFrame = requestAnimationFrame(() => { writerFrame = 0; schreiberLegen(); });
    };

    /**
     * Der Text, den eine Textmarke WIRKLICH zeigt.
     *
     * Bei einer Marke mit `laeufe` (E561) ist das nicht `mark.text`:
     * `textLayout` setzt dann aus den Läufen, und `mark.text` kann ein
     * alter Stand sein. Wer das verwechselt, zeigt im Schreibfeld etwas
     * anderes an, als auf dem Blatt steht.
     */
    const textVon = (mark: any): string => {
      const laeufe = Array.isArray(mark?.laeufe) ? mark.laeufe : null;
      if (laeufe && laeufe.length) return laeufe.map((l: any) => String(l?.text ?? '')).join('');
      return String(mark?.text || '');
    };

    /** Die Marke, die das Feld gerade zeigt — echt oder erst gedacht. */
    const schreiberMarke = (): any => {
      if (!schreiber) return null;
      const platz = schreiber.ziel ? platzVon(schreiber.ziel) : -1;
      return platz >= 0 ? marks[platz] : schreiber.entwurf;
    };

    /* Das Feld auf die Stelle legen, an der der Text stehen wird. Eigene
       Funktion, weil dasselbe beim Öffnen, beim Tippen (der Kasten wächst)
       und bei jeder Grössenänderung der Fläche nötig ist — dieselbe Lehre
       wie beim Lineal (E591): eine Stelle, die nur beim Öffnen stimmt,
       stimmt nach dem ersten Drehen des Telefons nicht mehr. */
    const schreiberLegen = (): void => {
      if (!schreiber) return;
      const marke = schreiberMarke();
      const layout = marke ? InkGeometry.textLayout(marke) : null;
      const kasten = flaeche.getBoundingClientRect();
      if (!layout || !kasten.width || !kasten.height) return;
      /* ZWEI SKALEN, WEIL DIE FLÄCHE ZWEI HAT. Waagrecht steht die Stelle,
         senkrecht die Schrift — bei einem Papier mit `aspect-ratio` sind
         beide gleich, und am Telefon mit Rand (E301) sind sie es nicht. */
      const sx = kasten.width / (breite + randBreit);
      const sy = kasten.height / hoehe;
      /* ══ DIE 16-PIXEL-GRENZE, GEFUNDEN AUF EINEM BILD (§55.1) ═════════════
         Am Telefon stand im Feld „Ein Klick, und / ich schreibe / schon." —
         DREI Zeilen —, und auf dem Blatt danach zwei. Gemessen war der Grund
         eindeutig: gesetzt waren 9,23 px, gerechnet hat der Browser mit 16.

           Telefon 390 × 844   im Feld fontPx 16   gesetzt fontPx 16 (Blattmass)
                               Zeilen 3            Zeilen 2
           Rechner 1280 × 900  im Feld fontPx 26,3 Zeilen 2 · gesetzt 2

         `bausteine.css:312` schreibt unter 760 px `input, textarea, select{
         font-size:16px !important }` — damit iOS beim Tippen nicht in die
         Seite hineinzoomt. Die Regel ist richtig und bleibt; sie hat dieses
         Projekt schon einmal Zeit gekostet (siehe `lernwelt.css:1113`).

         DIE ANTWORT IST NICHT, SIE AUSZUNEHMEN. Ein Feld mit 9 px Schrift
         lässt iOS beim Hineintippen in die Seite zoomen, und dann steht der
         Nutzer vor einem verrutschten Blatt. Stattdessen wird das Feld in
         SEINER Grösse gesetzt — nie unter 16 px — und als Ganzes verkleinert.
         Der Umbruch fällt damit an derselben Stelle wie im Blattmass, und
         der Browser sieht eine Schrift, bei der er nicht zoomt.

         Das gilt nicht nur am Telefon: jede verkleinerte Fläche — ein
         Zoomfenster, ein schmaler Bildschirm — hatte denselben Fehler. Er
         fiel nur am Telefon auf, weil er dort gross genug war, um ihn zu
         sehen. */
      const feld = schreiber.feld;
      const sollPx = layout.fontSize * sy;
      const basisPx = Math.max(16, sollPx);
      const zoom = sollPx / basisPx;
      feld.style.left = (layout.x * sx).toFixed(2) + 'px';
      feld.style.top = (layout.y * sy).toFixed(2) + 'px';
      feld.style.width = ((layout.width * sx) / zoom).toFixed(2) + 'px';
      feld.style.padding = ((layout.pad * sy) / zoom).toFixed(2) + 'px '
        + ((layout.pad * sx) / zoom).toFixed(2) + 'px';
      /* Inline und `important`, weil die Regel oben `important` ist — nur so
         gewinnt die Stelle, die das Blattmass wirklich kennt. */
      feld.style.setProperty('font-size', basisPx.toFixed(2) + 'px', 'important');
      feld.style.lineHeight = ((layout.zeile * sy) / zoom).toFixed(2) + 'px';
      feld.style.transformOrigin = 'top left';
      feld.style.transform = zoom === 1 ? 'none' : 'scale(' + zoom.toFixed(4) + ')';
      feld.style.fontFamily = schriftStapel(layout.family);
      feld.style.fontWeight = layout.bold ? '700' : '400';
      feld.style.textAlign = layout.ausricht === 'mitte' ? 'center'
        : layout.ausricht === 'rechts' ? 'right' : 'left';
      feld.style.color = String(marke.farbe || color);
      /* Mitwachsen wie der Kasten, den er später zeichnet. */
      /* Ein `div` wächst von selbst; gesetzt wird nur die Mindesthöhe, damit
         ein leerer Kasten so gross ist wie der, den er später zeichnet. */
      feld.style.minHeight = ((layout.height * sy) / zoom).toFixed(2) + 'px';
      /* Und jeder Lauf bekommt seine eigene Grösse — im selben Massstab wie
         das Feld, sonst stünde ein 30-pt-Stück in 16 pt da. */
      feld.querySelectorAll<HTMLElement>('[data-sz]').forEach(stueck => {
        const sz = Number(stueck.dataset.sz) || 0;
        if (sz > 0) stueck.style.fontSize = ((sz * sy) / zoom).toFixed(2) + 'px';
      });
    };

    /**
     * Das Feld schliessen und übernehmen, was darin steht.
     *
     * IMMER ÜBERNEHMEN, NIE VERWERFEN. Wer irgendwohin tippt, während er
     * schreibt, will weiterschreiben — nicht den Satz verlieren (§51).
     * Verworfen wird nur, was leer ist, und dann gibt es nichts zu verlieren.
     */
    const schreiberSchliessen = (): void => {
      const offen = schreiber;
      if (!offen) return;
      /* ZUERST ABMELDEN: `feld.remove()` löst `blur` aus, und das käme sonst
         genau hier wieder herein. */
      schreiber = null;
      cancelAnimationFrame(writerFrame); writerFrame = 0; writerRange = null;
      offen.beobachter?.disconnect();
      const gelesen = feldLesen(offen.feld);
      const text = gelesen.text;
      /* Läufe nur behalten, wenn wenigstens EINER ein eigenes Format hat.
         Ein gewöhnlicher Kasten bleibt sonst ein gewöhnlicher Kasten — und
         jede schon geschriebene Marke sieht unverändert aus (§9). */
      const neueLaeufe = gelesen.laeufe.some((l: any) => l.sz || l.fett || l.farbe || l.schrift)
        ? gelesen.laeufe : null;
      const node = offen.ziel ? nodeFor(offen.ziel) : null;
      node?.removeAttribute('data-schreibt');
      offen.feld.remove();
      const platz = offen.ziel ? platzVon(offen.ziel) : -1;
      if (platz >= 0) {
        const alt = marks[platz];
        if (!text.trim()) marks.splice(platz, 1);
        else if (String(alt.text || '') !== text
                 || JSON.stringify(alt.laeufe ?? null) !== JSON.stringify(neueLaeufe)) {
          /* MEHRERE FORMATE IN EINEM ABSATZ (E561) BLEIBEN JETZT STEHEN
             (E606, L172 geschlossen). Bis zum 16. September fielen sie hier
             auf das Format des ersten Stücks zusammen, weil ein `<textarea>`
             nur reinen Text halten kann. Das Feld ist seither ein
             `contenteditable` mit einem `<span>` je Lauf, und `feldLesen`
             holt sie unverändert zurück. */
          const neu: any = { ...alt, text };
          if (neueLaeufe) neu.laeufe = neueLaeufe; else delete neu.laeufe;
          ersetze(platz, neu);
        } else { redraw(); return; }
      } else {
        if (!text.trim()) { redraw(); return; }
        marks.push({ ...offen.entwurf, text, ...(neueLaeufe ? { laeufe: neueLaeufe } : {}) });
      }
      redraw();
      commit(offen.before);
    };

    /**
     * Den Kasten umformen, IN DEN GERADE GESCHRIEBEN WIRD (E599).
     *
     * Ohne das tippt man einen Satz, drückt „A+ Grösser" oder Rot — und
     * nichts passiert: die neue Grösse gilt erst dem NÄCHSTEN Kasten. Das
     * ist genau die Stelle, an der „was ich sehe, ist was dasteht" bricht,
     * und sie bricht mitten im Schreiben.
     *
     * Bei einem NEUEN Kasten wird der Entwurf umgeformt; bei einem
     * vorhandenen die Marke selbst. Beides landet im selben Schritt des
     * Verlaufs wie der Text — `before` steht seit dem Öffnen (§50: eine
     * Änderung, ein Schritt zurück).
     */
    const schreiberUmformen = (felder: Record<string, unknown>): boolean => {
      if (!schreiber) return false;
      const platz = schreiber.ziel ? platzVon(schreiber.ziel) : -1;
      if (platz >= 0) {
        const alt = marks[platz];
        /* Gesperrt heisst gesperrt — auch für die Leiste (E473). */
        if (alt?.gesperrt) return false;
        ersetze(platz, { ...alt, ...felder });
      } else schreiber.entwurf = { ...schreiber.entwurf, ...felder };
      schreiberLegen();
      return true;
    };

    /**
     * Ein Schreibfeld an dieser Stelle öffnen — oder den Text, der schon
     * dort steht, an seiner Stelle weiterschreiben.
     */
    const schreiberOeffnen = (point: number[], targetId = ''): void => {
      schreiberSchliessen();
      const raum = flaeche.parentElement as HTMLElement | null;
      /* Ohne Elternknoten gibt es keine Stelle, an die das Feld gehört —
         dann bleibt der Dialog von früher der Weg. Er wird dafür behalten,
         nicht aus Höflichkeit: ein Weg weniger wäre hier ein Weg gar keiner. */
      if (!raum) { void editText(point, targetId); return; }
      const platz = targetId ? platzVon(targetId) : -1;
      const vorhanden = platz >= 0 && marks[platz]?.art === 'text' ? marks[platz] : null;
      /* Eine gesperrte Marke bleibt, wie sie ist — auch ihr Text (E473). */
      if (vorhanden?.gesperrt) { UI.toast('Diese Marke ist gesperrt — erst entsperren.'); return; }
      const before = snapshot();
      let entwurf: any = vorhanden;
      if (!vorhanden) {
        const x = Math.round(Math.max(0, Math.min(point[0] ?? 0, breite - 120)) * 100) / 100;
        const y = Math.round(Math.max(0, Math.min(point[1] ?? 0, hoehe - 40)) * 100) / 100;
        const breiteBox = Math.max(120, Math.min(Math.round(breite * 0.4), Math.round(breite - x - 8)));
        entwurf = { id: frischeId(), art: 'text', point: [x, y], text: '', farbe: color,
          fontSize: schrift.groesse, breiteBox, schrift: schrift.familie, fett: schrift.fett,
          rahmen: schrift.rahmen,
          ...(schrift.ausricht !== 'links' ? { ausricht: schrift.ausricht } : {}) };
      }
      const feld = document.createElement('div');
      feld.className = 'blatt-schreiber';
      feld.contentEditable = 'true';
      /* Ein `contenteditable` ist für ein Vorleseprogramm nichts, solange es
         nicht sagt, was es ist (§38). */
      feld.setAttribute('role', 'textbox');
      feld.setAttribute('aria-multiline', 'true');
      feld.setAttribute('aria-label', vorhanden ? 'Text bearbeiten' : 'Text schreiben');
      feld.spellcheck = false;
      if (vorhanden) feldFuellen(feld, vorhanden);
      raum.appendChild(feld);
      /* Die gezeichnete Marke tritt zurück, solange das Feld sie zeigt —
         sonst stünde derselbe Satz zweimal übereinander. */
      if (vorhanden) nodeFor(idOf(vorhanden))?.setAttribute('data-schreibt', '1');
      let beobachter: ResizeObserver | null = null;
      try {
        beobachter = new ResizeObserver(() => schreiberLegen());
        beobachter.observe(flaeche);
      } catch { beobachter = null; }
      schreiber = { feld, ziel: vorhanden ? idOf(vorhanden) : '', before, entwurf, beobachter };
      schreiberLegen();
      /* Das Feld wächst selbst; die Blattgeometrie höchstens einmal pro Bild
         lesen, auch wenn mehrere Eingabeereignisse zusammen ankommen. */
      feld.addEventListener('input', scheduleWriterLayout);
      /* ══ EINGEFÜGT WIRD NUR REINER TEXT (§19, E606) ══════════════════════
         Ein `contenteditable` nimmt sonst alles, was in der Zwischenablage
         liegt — samt Elementen, Stilen und allem, was daran hängt. Der
         eingefügte Text erbt das Format der Stelle, an der er landet; genau
         das tut Word auch bei „Nur den Text übernehmen". */
      feld.addEventListener('paste', event => {
        event.preventDefault();
        const roh = (event as ClipboardEvent).clipboardData?.getData('text/plain') || '';
        if (roh) document.execCommand('insertText', false, roh);
      });
      /* Ziehen und Ablegen ebenso: was hineinfällt, wäre HTML. */
      feld.addEventListener('drop', event => event.preventDefault());
      /* ══ EIN GRIFF AN DIE WERKZEUGLEISTE IST KEIN VERLASSEN (E599) ═══════
         GEMESSEN: „A+ Grösser" antippen, während man schreibt, schloss den
         Kasten — der Knopf nimmt den Fokus, `blur` kommt, und das Feld war
         weg, bevor der Knopf überhaupt etwas tat. Damit war die ganze
         Schriftleiste während des Schreibens unbenutzbar, und das fiel
         niemandem auf, weil vorher ein Dialog dastand, der den Fokus selbst
         hielt.

         `relatedTarget` sagt, WOHIN der Fokus geht. Geht er in eine Leiste,
         die zu dieser Fläche gehört, wird nicht geschlossen, sondern der
         Cursor zurückgeholt — nach dem Klick, damit der Knopf erst wirkt. */
      const LEISTEN = '.blatt-werk, .document-drawingbar, .document-dock, .document-stage,'
        + ' [data-act], [data-wz], [data-document-action], [data-document-tool]';
      feld.addEventListener('blur', event => {
        const ziel = (event as FocusEvent).relatedTarget as Element | null;
        const selection = getSelection();
        writerRange = selection?.rangeCount && feld.contains(selection.getRangeAt(0).commonAncestorContainer)
          ? selection.getRangeAt(0).cloneRange() : null;
        if (ziel?.closest('.blatt-color-panel, .blatt-popover:has(.blatt-color-panel)')) return;
        if (ziel && typeof ziel.closest === 'function' && ziel.closest(LEISTEN)) {
          setTimeout(() => {
            if (schreiber && schreiber.feld === feld && feld.isConnected
              && !document.querySelector('.blatt-color-panel')) resumeWriting();
          }, 0);
          return;
        }
        schreiberSchliessen();
      });
      feld.addEventListener('keydown', event => {
        /* E697: Escape/Enter gehören während einer Texteingabekomposition
           dem Eingabesystem, nicht dem Abschliessen der ganzen Notiz. */
        if (event.isComposing) { event.stopPropagation(); return; }
        /* ESCAPE BEENDET UND BEHÄLT. In OneNote verlässt Escape den Kasten;
           es wirft ihn nicht weg. Und es darf nicht weiter nach oben laufen,
           sonst schliesst derselbe Tastendruck das ganze Studio (E302). */
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); schreiberSchliessen(); return; }
        /* Strg/Cmd + Enter beendet auch — derselbe Griff wie im Dialog von
           früher, damit niemand ihn neu lernen muss. */
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault(); schreiberSchliessen(); return;
        }
        /* Alles andere gehört dem Feld: ein `z` ist ein `z` und kein
           „Zurück", ein `e` kein Radierer. */
        event.stopPropagation();
      });
      feld.focus({ preventScroll: true });
      /* Der Cursor ans Ende, damit Weiterschreiben wirklich weiter heisst.
         In einem `contenteditable` geht das über einen Bereich, nicht über
         `setSelectionRange` — das gibt es nur an Formularfeldern. */
      try {
        const bereich = document.createRange();
        bereich.selectNodeContents(feld);
        bereich.collapse(false);
        const wahl = getSelection();
        wahl?.removeAllRanges();
        wahl?.addRange(bereich);
      } catch { /* optional */ }
    };

    const editText = async (point: number[], targetId = ''): Promise<void> => {
      const current = targetId ? marks.find(mark => idOf(mark) === targetId && mark.art === 'text') : null;
      /* Eine gesperrte Marke bleibt, wie sie ist — auch ihr Text (E473).
         Ohne diese Zeile hiess „leer machen" auch bei ihr „weg". */
      if (current?.gesperrt) { UI.toast('Diese Marke ist gesperrt — erst entsperren.'); return; }
      const answer = await Dialog.mehrzeilig(current ? 'Text bearbeiten' : 'Text',
        current ? String(current.text || '') : '');
      if (answer === null || (!current && !answer.trim())) return;
      const before = snapshot();
      if (current) {
        if (!answer.trim()) marks.splice(marks.indexOf(current), 1);
        else ersetze(marks.indexOf(current), { ...current, text: answer });
      } else {
        const x = Math.round(Math.max(0, Math.min(point[0] ?? 0, breite - 120)) * 100) / 100;
        const y = Math.round(Math.max(0, Math.min(point[1] ?? 0, hoehe - 40)) * 100) / 100;
        const breiteBox = Math.max(120, Math.min(Math.round(breite * 0.4), Math.round(breite - x - 8)));
        marks.push({ id: frischeId(), art: 'text', point: [x, y], text: answer, farbe: color,
          fontSize: schrift.groesse, breiteBox, schrift: schrift.familie, fett: schrift.fett,
          rahmen: schrift.rahmen,
          ...(schrift.ausricht !== 'links' ? { ausricht: schrift.ausricht } : {}) });
      }
      redraw(); commit(before);
    };

    /* ══ TEXT DER PDF ÄNDERN (E670) ═══════════════════════════════════════
     * Redurs Frage vom 21. September war: „wenn ich eine pdf hochlade das
     * ich die pdf selbst direk bearbeiten kann also die text direk".
     *
     * WAS HIER WIRKLICH PASSIERT, und es steht so auch am Werkzeug: die
     * PDF wird NICHT umgeschrieben. Sie bleibt Byte für Byte, wie
     * `leser.ts` es verspricht. Geändert wird das, was man SIEHT — mit
     * einer Marke, die die alte Stelle zudeckt und die neue darüber
     * schreibt, an derselben Stelle, in derselben Höhe.
     *
     * Der Unterschied ist keine Wortklauberei. Er bedeutet:
     *   · rückgängig, versioniert, löschbar wie jede Marke
     *   · in der Sicherung und im ausgegebenen PDF
     *   · und das Original ist jederzeit noch das Original
     *
     * WAS ES NICHT KANN, und das gehört an dieselbe Stelle: der Text
     * FLIESST NICHT. Ein längeres Wort wird länger und schiebt den Rest
     * der Zeile nicht weiter; ein kürzeres lässt eine Lücke. Dafür müsste
     * man den Inhaltsstrom der PDF neu setzen, mit ihren eingebetteten
     * Schriften — das ist ein eigenes Projekt und nicht dieses.
     */
    const grundFarbeBei = (x: number, y: number): string => {
      try {
        const raum = flaeche.parentElement as HTMLElement | null;
        const bild = raum?.querySelector('img.pdfs-bild') as HTMLImageElement | null;
        if (!bild || !bild.naturalWidth || !bild.naturalHeight) return '#ffffff';
        /* Blattpunkte → Bildpunkte. Gelesen wird ein Stück ÜBER der Zeile:
           mitten im Wort träfe man die Schrift und bekäme Schwarz — und
           ein schwarzer Deckel ist schlimmer als ein falsch weisser. */
        const px = Math.round((x / breite) * bild.naturalWidth);
        const py = Math.round((Math.max(0, y - 2) / hoehe) * bild.naturalHeight);
        const leinwand = document.createElement('canvas');
        leinwand.width = 1; leinwand.height = 1;
        const stift = leinwand.getContext('2d', { willReadFrequently: true });
        if (!stift) return '#ffffff';
        stift.drawImage(bild, px, py, 1, 1, 0, 0, 1, 1);
        const d = stift.getImageData(0, 0, 1, 1).data;
        const hex = (n: number) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
        return '#' + hex(d[0] ?? 255) + hex(d[1] ?? 255) + hex(d[2] ?? 255);
      } catch {
        /* Ein getaintes oder halb geladenes Bild ist kein Grund zu scheitern. */
        return '#ffffff';
      }
    };

    const textAendern = async (point: number[], targetId = ''): Promise<void> => {
      const platz = targetId
        ? marks.findIndex(mark => idOf(mark) === targetId && mark.art === 'textfix') : -1;
      const vorhanden = platz >= 0 ? marks[platz] : null;
      if (vorhanden?.gesperrt) {
        UI.toast('Diese Änderung ist gesperrt — erst entsperren.'); return;
      }

      /* Eine schon geänderte Stelle noch einmal ändern: dann ist der
         Kasten längst bekannt, und die Quelle wird gar nicht gebraucht. */
      if (vorhanden) {
        const neu = await Dialog.mehrzeilig(
          'Geänderte Stelle — im Original stand „' + String(vorhanden.alt || '') + '"',
          String(vorhanden.text || ''));
        if (neu === null) return;
        const before = snapshot();
        /* Leer heisst „nur zudecken" und nicht „weg": wer eine Stelle
           schwärzen will, soll das können, ohne dass der Deckel mitgeht. */
        ersetze(platz, { ...vorhanden, text: neu });
        redraw(); commit(before);
        return;
      }

      if (block?.type !== 'pdfseite' || !block?.quelleId) {
        UI.toast('Das geht nur auf einer PDF-Seite — ein leeres Blatt hat keinen Text zum Ändern.');
        return;
      }
      if (typeof PdfLeser === 'undefined' || typeof PdfLeser.stueckBei !== 'function') {
        UI.toast('Der PDF-Leser fehlt — ohne ihn gibt es keine Textebene.');
        return;
      }
      const st = await PdfLeser.stueckBei(block, point[0] ?? 0, point[1] ?? 0, 3);
      if (!st) {
        /* DIESER SATZ IST WICHTIGER, ALS ER AUSSIEHT. Ein eingescanntes
           Blatt hat KEINE Textebene — dort ist jedes Wort ein Bild, und
           kein Werkzeug der Welt findet darin ein Wort. Wer das nicht
           erfährt, hält das Werkzeug für kaputt. */
        UI.toast('An dieser Stelle findet sich kein PDF-Text. '
          + 'Bei einem Scan ohne Texterkennung gibt es keinen.');
        return;
      }

      const neu = await Dialog.mehrzeilig('Diese Stelle ändern', String(st.s || ''));
      if (neu === null) return;
      if (neu === String(st.s || '')) return;   /* nichts geändert, nichts zu merken */

      const before = snapshot();
      marks.push({
        id: frischeId(), art: 'textfix',
        kasten: { x: st.x, y: st.y, w: st.w, h: st.h },
        alt: String(st.s || ''), text: neu,
        farbe: '#000000',
        grund: grundFarbeBei(st.x, st.y),
        schrift: schrift.familie, fett: schrift.fett
      });
      redraw(); commit(before);
    };

    /**
     * Ein Fachzeichen setzen (Punkt 42).
     *
     * Die Palette kommt aus `Planflaeche.paletteHtml` — genau die, die auch
     * im Schaltplan-Editor steht. Sie mitzubenutzen ist nicht Sparsamkeit,
     * sondern die einzige Art, zwei Auswahllisten zu vermeiden, die
     * auseinanderlaufen.
     *
     * Die zuletzt gewählte Kennung und die Grösse bleiben gemerkt: wer zehn
     * Schalter auf einen Grundriss setzt, will die Palette nicht zehnmal
     * durchsuchen.
     */
    const setzeZeichen = async (point: number[], targetId = ''): Promise<void> => {
      /* Ein vorhandenes Zeichen antippen dreht es weiter — dieselbe Bewegung
         wie im Planeditor, wo R dreht. Ohne das müsste man löschen und neu
         setzen, nur um einen Schalter aufrecht zu stellen. */
      const vorhanden = targetId
        ? marks.find(mark => idOf(mark) === targetId && mark.art === 'zeichen') : null;
      if (vorhanden?.gesperrt) { UI.toast('Dieses Zeichen ist gesperrt — erst entsperren.'); return; }
      if (vorhanden) {
        const before = snapshot();
        /* Ersetzen statt aendern (E378) — der Merkzettel oben teilt sich die
           Marke mit `marks`, und ein gedrehtes Zeichen im Merkzettel waere
           ein „Zurueck", das nichts zurueckholt. Genau das hat der eingefrorene
           Merkzettel hier gefunden: test242 sah `Cannot assign to read only
           property 'drehung'`. */
        ersetze(marks.indexOf(vorhanden),
          { ...vorhanden, drehung: ((Number(vorhanden.drehung) || 0) + 90) % 360 });
        redraw(); commit(before);
        return;
      }
      const gewaehlt = await zeichenWaehlen();
      if (!gewaehlt) return;
      const before = snapshot();
      marks.push({
        id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
        art: 'zeichen', zeichenId: gewaehlt, point,
        groesse: letzteGroesse, drehung: 0, gespiegelt: false, farbe: color
      });
      redraw(); commit(before);
    };

    /**
     * Ein Element setzen (E494) — der Stempel der Elemente-Bibliothek.
     *
     * Beim ERSTEN Tipp öffnet sich die Bibliothek, danach setzt jeder
     * weitere Tipp dasselbe Element. Das ist der Weg von GoodNotes und der
     * Grund, warum die Wahl gemerkt wird: wer zwanzig Häkchen setzt, will
     * die Bibliothek nicht zwanzigmal durchsuchen. Die Leiste zeigt dabei,
     * WELCHES Element der nächste Tipp setzt — sonst wäre der gemerkte
     * Zustand unsichtbar (§38).
     */
    const setzeElement = async (point: number[]): Promise<void> => {
      if (!letztesElement || !elementHolen(letztesElement)) {
        const gewaehlt = await elementWaehlen();
        if (!gewaehlt) return;
        letztesElement = gewaehlt;
        notifyState();
      }
      const neue = elementMarken(letztesElement, point[0] ?? 0, point[1] ?? 0);
      if (!neue.length) {
        letztesElement = '';
        notifyState();
        UI.toast('Dieses Element gibt es nicht mehr.');
        return;
      }
      const before = snapshot();
      marks.push(...neue);
      neue.forEach(mark => {
        const node = zeichneMarke(mark);
        if (node) { flaeche.appendChild(node); merke(mark); }
      });
      commit(before);
    };

    /** Die Auswahl als Element ablegen. Der Name kommt von der Leiste. */
    const elementAusAuswahl = (name: unknown) =>
      elementSichern(name, marks.filter(mark => selection.has(idOf(mark))));

    let letztesZeichen = '';
    let letzteGroesse = 64;

    const zeichenWaehlen = (): Promise<string> => new Promise(fertig => {
      if (typeof Planflaeche === 'undefined' || typeof Register === 'undefined'
        || !Register.fachzeichen) { fertig(''); return; }
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Fachzeichen setzen' +
        '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
        '<div class="mz-suche"><input type="search" placeholder="Symbol suchen …" ' +
        'aria-label="Symbol suchen"></div>' +
        '<div class="mz-groesse"><label>Grösse' +
        `<input type="range" min="24" max="180" step="4" value="${letzteGroesse}" ` +
        'aria-label="Grösse des Zeichens"></label>' +
        `<b>${letzteGroesse} px</b></div>` +
        /* Das zuletzt gesetzte Zeichen steht oben und ist einen Klick weit
           weg. Wer zehn Schalter auf einen Grundriss setzt, sucht sonst
           zehnmal dasselbe. */
        (letztesZeichen
          ? '<div class="mz-zuletzt"><span>Zuletzt</span>' +
            `<button data-sym="${letztesZeichen}">` +
            Register.fachzeichen.alsSvg(letztesZeichen, { farbe: 'currentColor' }) +
            `<i>${(Register.fachzeichen.holen(letztesZeichen) || { name: '' }).name}</i>` +
            '</button></div>'
          : '') +
        '<div class="mz-liste">' + Planflaeche.paletteHtml('installationsplan', '') + '</div>' +
        '</div>';
      document.body.appendChild(o);
      const zu = (wert: string) => { o.remove(); fertig(wert); };
      o.addEventListener('input', e => {
        const f = e.target as HTMLInputElement;
        if (f.type === 'search') {
          const liste = o.querySelector('.mz-liste');
          if (liste) liste.innerHTML = Planflaeche.paletteHtml('installationsplan', f.value);
          return;
        }
        if (f.type === 'range') {
          letzteGroesse = Number(f.value) || 64;
          const marke = o.querySelector('.mz-groesse b');
          if (marke) marke.textContent = letzteGroesse + ' px';
        }
      });
      o.addEventListener('click', e => {
        const sym = (e.target as Element).closest<HTMLElement>('[data-sym]');
        if (sym && sym.dataset.sym) { letztesZeichen = sym.dataset.sym; zu(sym.dataset.sym); return; }
        const b = (e.target as Element).closest<HTMLElement>('[data-a]');
        if (e.target === o || (b && b.dataset.a === 'zu')) zu('');
      });
      const feld = o.querySelector('input[type=search]') as HTMLInputElement | null;
      feld?.focus();
    });

    /* ══ EIN DOPPELTIPP ÖFFNET EINEN TEXT (E597) ════════════════════════════
       Der zweite Weg, den OneNote hat: etwas auswählen, zweimal hineintippen,
       weiterschreiben. Ohne ihn müsste man für jeden Tippfehler erst das
       Werkzeug wechseln. Gilt für jedes Werkzeug ausser Schreiben und
       Radierer — beim Radierer wäre ein Doppeltipp zwei Radierversuche, und
       ein Feld mitten darin wäre das Gegenteil dessen, was gemeint war. */
    flaeche.addEventListener('dblclick', (event: MouseEvent) => {
      if (tool === 'schreiben' || tool === 'radierer') return;
      const ziel = (event.target as Element)?.closest?.('[data-sid]') as SVGElement | null;
      let id = ziel?.getAttribute('data-sid') || '';
      /* MIT DER AUSWAHL LIEGT DER RAHMEN OBEN. Gemessen: der erste Tipp
         wählt die Marke und legt `[data-ink-ui="selection"]` darüber — der
         zweite Tipp trifft dann den Rahmen und nicht mehr die Marke, und
         `closest('[data-sid]')` kommt leer zurück. Wer genau eine Sache
         gewählt hat und zweimal hineintippt, meint diese eine. */
      if (!id && selection.size === 1) id = [...selection][0] || '';
      /* ══ ZWEIMAL AUF DIE LEERE FLÄCHE HEISST: HIER SCHREIBEN (E599) ══════
         Der letzte Schritt zu Redurs Satz. Mit der Auswahl in der Hand — und
         das ist die Hand, in der man nach dem Zeichnen ist — musste man
         bisher erst das Textwerkzeug holen, nur um einen Satz danebenzu-
         schreiben. In OneNote genügt ein Tipp; hier sind es zwei, weil EIN
         Tipp mit der Auswahl schon etwas bedeutet (er hebt die Auswahl auf
         und zieht einen Rahmen). Zwei Tipps bedeuteten bisher nichts. */
      if (!id) {
        if (tool !== 'select') return;
        const punkt = R.zuBlatt(flaeche, event);
        if (!punkt) return;
        event.preventDefault();
        schreiberOeffnen(punkt, '');
        return;
      }
      const platz = platzVon(id);
      if (platz < 0 || marks[platz]?.art !== 'text') return;
      event.preventDefault();
      schreiberOeffnen([0, 0], id);
    });

    flaeche.addEventListener('pointerdown', (event: PointerEvent) => {
      const e = event;
      /* EIN OFFENES SCHREIBFELD WIRD ZUERST ÜBERNOMMEN (E597).
         Es hängt an `blur`, und `blur` kommt in Chromium NACH `pointerdown` —
         ohne diese Zeile stünden für einen Wimpernschlag zwei Felder da, und
         das zweite wäre schon offen, wenn das erste sich schliesst. */
      if (schreiber) schreiberSchliessen();
      /* Wer hier zeichnet, meint DIESE Fläche — und zwar auch dann, wenn er
         gleich wieder abbricht. Das steht vor dem `return` unten, weil auch
         ein Griff im Modus „Schreiben" eine Berührung ist. */
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(steuerung); } catch { /* egal */ }
      }
      if (e.pointerType === 'pen') stiftGesehen();
      if (tool === 'schreiben') return;
      /* EIN ZWEITER FINGER macht aus dem Fingerzug eine Geste (Rollen,
         Kneifen): der angefangene Strich verschwindet, kein Schritt im
         Verlauf (E354). */
      if (e.pointerType === 'touch' && !e.isPrimary) {
        if (running && running.zeigerArt === 'touch') verwerfen();
        return;
      }
      if (!e.isPrimary) return;
      /* Der gesperrte Finger bekommt kein preventDefault — er darf rollen. */
      if (fingerGesperrt(e)) {
        const center = flaeche.closest<HTMLElement>('.document-center');
        if (center && !running && aktiverZeiger === null) {
          fingerPan = {id:e.pointerId,x:e.clientX,y:e.clientY,left:center.scrollLeft,top:center.scrollTop,center};
          event.preventDefault();
          try { flaeche.setPointerCapture(e.pointerId); } catch { /* optional */ }
        }
        return;
      }
      /* DER STIFT GEHT VOR: liegt der Handballen schon auf und zeichnet,
         nimmt der Stift ihm den Strich weg (E354). */
      if (e.pointerType === 'pen' && running && running.zeigerArt === 'touch') verwerfen();
      if (e.pointerType === 'pen') fingerPan = null;
      /* ── EIN VERWAISTER ZEIGER WIRD ÜBERNOMMEN (E512) ─────────────────
         Der Schutz aus E354 bleibt: solange der Führende LEBT — also
         gerade noch etwas gemeldet hat —, weist die Fläche jeden anderen
         ab. Erst wenn er seit `VERWAIST_MS` schweigt, ist er kein
         Führender mehr, sondern ein Rest. */
      if (aktiverZeiger !== null && aktiverZeiger !== e.pointerId) {
        if (Date.now() - zeigerZuletzt < VERWAIST_MS) return;
        /* Abschliessen, nicht verwerfen: was gezogen wurde, bleibt. */
        finish();
        renderSelection();
      }
      /* DER RUECKKNOPF DES STIFTS RADIERT (E352): das Radierende (button 5,
         buttons 32) und der Seitenknopf (button 2) eines Stifts halten den
         Radierer, solange sie gedrueckt sind — das gewaehlte Werkzeug
         bleibt, wie in GoodNotes und OneNote. Eine Maus mit rechter Taste
         radiert nicht: `pointerType` muss `pen` sein. */
      const stiftRadiert = e.pointerType === 'pen' &&
        (e.button === 5 || e.button === 2 || (e.buttons & 32) !== 0);
      if (e.button !== 0 && !stiftRadiert) return;
      const rawPoint = R.zuBlatt(flaeche, e);
      if (!rawPoint) return;
      const point = ruler.begin(rawPoint, !stiftRadiert && ['stift', 'marker', 'line', 'arrow'].includes(tool));
      event.preventDefault();
      aktiverZeiger = e.pointerId;
      zeigerZuletzt = Date.now();
      flaeche.focus({ preventScroll: true });
      const target = (event.target as Element)?.closest?.('[data-sid]') as SVGElement | null;
      const targetId = target?.getAttribute('data-sid') || '';

      /* DER LASER ZEIGT NUR (E512) — vor allem anderen, weil er mit nichts
         davon etwas zu tun hat: keine Marke, kein Verlauf, keine Auswahl. */
      if (tool === 'laser' && !stiftRadiert) { laserAn(point); return; }

      if (tool === 'radierer' || stiftRadiert) {
        /* STREICHEN STATT TIPPEN (E352): der Radierer ist ein Kreis, der
           mit dem Zeiger wandert; ein Tipp ohne Bewegung ist der Sonderfall
           mit einem einzigen Schritt. Ein Zug ist EIN Schritt im Verlauf. */
        radierStrich = { before: snapshot(), geaendert: false, letzter: point, kreis: null };
        const kreis = svg('circle', { cx: point[0], cy: point[1], r: radierRadius(),
          class: 'blatt-radierkreis', 'data-ink-ui': 'radierer' });
        flaeche.appendChild(kreis);
        radierStrich.kreis = kreis;
        const getroffen = (targetId && radiereMarke(targetId, point)) || radiereBei(point);
        /* Sofort sichern, nicht erst beim Loslassen: ein Tipp ist fertig,
           wenn er da ist (der Verlauf bekommt seinen Schritt in `finish`). */
        if (getroffen) { radierStrich.geaendert = true; save(); }
        try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
        return;
      }
      /* DIREKT SCHREIBEN STATT EINEN DIALOG ÖFFNEN (E597). */
      if (tool === 'text') { schreiberOeffnen(point, targetId); return; }
      /* Ein Tipp auf einen VORHANDENEN Zettel bearbeitet ihn; sonst wird
         gleich unten eine neue Fläche aufgezogen (der Zwei-Punkt-Weg). */
      if (tool === 'zettel' && targetId &&
          marks.some(mark => idOf(mark) === targetId && mark.art === 'zettel')) {
        void zettelText(targetId);
        return;
      }
      /* Text der PDF ändern (E670): ein Tipp auf ein Wort. */
      if (tool === 'textfix') { void textAendern(point, targetId); return; }
      if (tool === 'zeichen') { void setzeZeichen(point, targetId); return; }
      /* Die Elemente-Bibliothek (E494): ein Tipp stempelt, wie beim Fachzeichen. */
      if (tool === 'elemente') { void setzeElement(point); return; }
      /* Mit dem Bild-Werkzeug (ueber `Zeichenziel.setze`) oeffnet der Tipp
         den Waehler, und das Bild kommt dorthin, wo getippt wurde (E357). */
      if (tool === 'bild') { void bildEinfuegen(point); return; }
      if (tool === 'select') {
        /* EIN GRIFF AM RAHMEN SKALIERT DIE AUSWAHL (E353): die gegenueber-
           liegende Ecke bleibt stehen, die Marken wachsen zum Zeiger hin. */
        const griff = (event.target as Element)?.closest?.('[data-griff]') as SVGElement | null;
        if (griff && selection.size && griff.getAttribute('data-griff') === 'dreh') {
          /* DREHEN (E466): um die Mitte des Kastens, der Winkel ist der
             Winkel des Zeigers zu ihr — mit Umschalt oder Lineal in
             15°-Schritten, wie Linie und Pfeil (E267). */
          const kasten = auswahlKasten();
          const mitte: [number, number] = [kasten.x + kasten.width / 2, kasten.y + kasten.height / 2];
          selectDrag = { mode: 'rotate', start: point, mitte, before: snapshot(), moved: false,
            winkel0: Math.atan2(point[1] - mitte[1], point[0] - mitte[0]),
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
          try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
          return;
        }
        /* DIE KURVE BIEGEN (E483): ein eigener Zug, weil er einen PUNKT
           bewegt und nicht den Kasten. */
        if (griff && selection.size === 1 && griff.getAttribute('data-griff') === 'kurve') {
          selectDrag = { mode: 'kurve', start: point, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
          try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
          return;
        }
        if (griff && selection.size) {
          const kasten = auswahlKasten();
          const achse = auswahlAchse();
          const ecke = String(griff.getAttribute('data-griff') || 'se');
          /* Der Anker ist die GEGENUEBERLIEGENDE Ecke — im Kasten gerechnet,
             und bei einem schiefen Kasten von dort ins Blatt gedreht
             (E474). `InkGeometry.scale` bekommt ihn im Blattraum und den
             Winkel dazu; genau dieser Punkt bleibt dann stehen. */
          const eckeIm: [number, number] = [
            ecke.includes('e') ? kasten.x : kasten.x + kasten.width,
            ecke.includes('s') ? kasten.y : kasten.y + kasten.height];
          const mitteIm: [number, number] = [kasten.x + kasten.width / 2, kasten.y + kasten.height / 2];
          const anker = achse ? InkGeometry.drehePunkte([eckeIm], mitteIm, achse)[0]! : eckeIm;
          selectDrag = { mode: 'scale', start: point, anker, achse, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
          try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
          return;
        }
        if (targetId) {
          if (event.shiftKey) selection.has(targetId) ? selection.delete(targetId) : selection.add(targetId);
          else if (!selection.has(targetId)) selection = new Set([targetId]);
          renderSelection();
          if (!selection.has(targetId)) return;
          selectDrag = { mode: 'move', start: point, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
        } else {
          /* War vor diesem Tipp etwas gewählt? Die Antwort entscheidet
             unten, ob ein Tipp ohne Zug schreibt oder nur abwählt (E605). */
          const warLeer = !selection.size;
          if (!event.shiftKey) { selection.clear(); renderSelection(); }
          /* DAS LASSO (E353): ein freier Zug um die Marken, wie in GoodNotes.
             Ein gerader Zug ohne Flaeche bleibt der Kasten von frueher. */
          selectDrag = { mode: 'lasso', pts: [point], add: event.shiftKey, warLeer };
          const schlinge = svg('path', { d: `M${point[0]} ${point[1]}`,
            class: 'blatt-auswahlfeld', 'data-ink-ui': 'box' });
          flaeche.appendChild(schlinge);
        }
        try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
        return;
      }

      beforeRunning = snapshot();
      const id = typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1);
      if (tool === 'stift' || tool === 'marker') {
        /* Ein Marker in der Vorgabetinte (Schwarz) nimmt seit E704 das
           Sonnengelb — nur für diesen NEUEN Strich (E697). */
        running = { id, art: tool, farbe: tool === 'marker' && color === FARBEN[0] ? TEXTMARKER_FARBE : color,
          breite: width, pts: [point], pressure: [], zeigerArt: e.pointerType };
        if (tool === 'stift' && stil !== 'kugel') running.stil = stil;
        /* DIE SPITZE DES MARKERS (E704): der Keil trägt `stil: 'keil'`, der
           runde Marker trägt — wie jeder alte — keinen. */
        if (tool === 'marker' && markerSpitzeLesen() === 'keil') running.stil = 'keil';
        /* DAS TEMPO wird bei Füller und Pinsel mitgeschrieben (E704). Ob es
           bleibt, entscheidet `finish`: nur mit einem Sensor. */
        rohZeiten = []; sensorVerlauf = []; tempoJetzt = 0;
        tempoMessen = tool === 'stift' && eileVon(String(running.stil || '')) > 0 ? InkStroke.tempoMesser() : null;
        if (tempoMessen) { tempoMessen(point as [number, number], 16); running.tempo = [0]; }
        /* ── DER LEITERSTIFT SETZT ZWEI DINGE (E509) ────────────────────
           `stil` ist die ZEICHENANWEISUNG — sie ist dieselbe, die ein
           Schutzleiter aus E490 trägt, damit alte und neue Striche durch
           denselben Weg gehen. `leiter` ist die BEDEUTUNG: welche Ader das
           ist. Beides steht da, weil beides gebraucht wird — der Zeichner
           fragt das eine, ein Mensch (und später ein Export) das andere. */
        if (tool === 'stift' && stil === 'leiter') {
          const ader = leiterVon(leiterJetzt()) || LEITER[0];
          running.stil = ader.stil;
          running.leiter = ader.id;
        }
        /* DIE NEIGUNG WIRD MITGESCHRIEBEN (E507) — vorerst in ein Feld, das
           es beim Absetzen nur behält, wenn wirklich etwas darin steht. */
        running.neigung = [neigungAus(e)];
        /* Der Sensor dieses Strichs hat noch nichts gemeldet (E675) — VOR
           dem ersten `druckAus`, sonst erbt er den letzten Strich. */
        sensorZuletzt = null;
        running.pressure.push(druckAus(event, point));
        if (sensorZuletzt !== null) sensorVerlauf.push(sensorZuletzt);
        breiteAb = 0;
        breiteFestlegen(Number(e.timeStamp) || 0);
        const p0 = running.pressure[0];
        /* DER AUFSETZPUNKT GEHT UNGEGLAETTET DURCH (E376): ein Strich, der
           nicht dort beginnt, wo der Stift das Papier beruehrt hat, ist
           falsch — und kein Filter kann das spaeter zurueckholen. */
        glatt = InkStroke.glaetter(point as [number, number]);
        rohLetzter = null;
        rohDrei = [point];
        druckGlatt = InkStroke.druckGlaetter(p0);
        letzteZeit = Number(event.timeStamp) || 0;
        feder = new InkStroke.Feder();
        wegNass = 0;
        feder.punkt(point, halbeBreite(running, p0) * nassSpitze());
        nassFlaeche = false;
        runningNode = zeichneMarke({ ...running, pts: [point, point], pressure: [p0, p0],
          ...(running.tempo ? { tempo: [0, 0] } : {}) });
      } else {
        /* Ein schwarzer Zettel mit schwarzer Vorgabetinte wäre keiner —
           die Haftnotiz nimmt als Vorgabe das Marker-Gelb (derselbe
           Handgriff wie beim Marker vier Zeilen höher). */
        const flaechenFarbe = tool === 'zettel' && color === FARBEN[0]
          ? MARKER_FARBE : color;
        running = { id, art: tool, farbe: flaechenFarbe, breite: width, pts: [point, point], zeigerArt: e.pointerType };
        runningNode = zeichneMarke(running);
      }
      if (runningNode) flaeche.appendChild(runningNode);
      try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
    });

    flaeche.addEventListener('pointermove', (event: PointerEvent) => {
      if (fingerPan && fingerPan.id === event.pointerId) {
        event.preventDefault();
        fingerPan.center.scrollLeft = fingerPan.left + fingerPan.x - event.clientX;
        fingerPan.center.scrollTop = fingerPan.top + fingerPan.y - event.clientY;
        return;
      }
      if (!event.isPrimary) return;
      if (event.pointerType === 'pen') stiftGesehen();
      /* Nur der Zeiger, der den Zug begonnen hat, fuehrt ihn (E354). */
      if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger) return;
      /* Er lebt (E512) — solange das hier zählt, übernimmt ihn niemand. */
      zeigerZuletzt = Date.now();
      if (laserZug) {
        const q = R.zuBlatt(flaeche, event);
        if (q) laserZeigen(q);
        return;
      }
      /* ══ DER SCHREIBWEG ZUERST, UND NUR EINE MATRIX (E511) ═══════════════
         Hier stand die Umrechnung des einen Zeigerpunktes ganz oben — vor
         allen Zweigen, also auch vor dem Zeichnen, das sie gar nicht
         braucht: `addSample` rechnet sich seine Punkte selbst aus den
         gesammelten Meldungen. Ein Schreibzug bezahlte damit ZWEI
         `getScreenCTM` je Punkt, und einer davon wurde weggeworfen.

         Gemessen (§36): 400 Punkte, 200 Marken auf dem Blatt, je vier
         Punkte ein Bild — 52,9 ms im Zeichenweg, davon 23,9 ms allein in
         `getScreenCTM`. Das sind 45,2 %, für eine Zahl, die zur Hälfte
         niemand las.

         Jetzt geht der Schreibzug VOR der Umrechnung heraus und holt sich
         EINEN Umrechner für alle Punkte dieses Ereignisses — die
         gesammelten und die vorhergesagten. Erreichbar war dieser Zweig
         ohnehin nur, wenn weder radiert noch gezogen wird: beide Zweige
         darunter enden mit `return`. Die Bedingung schreibt das hin,
         statt es aus der Reihenfolge zu schliessen. */
      if (!radierStrich && !selectDrag && running
          && (running.art === 'stift' || running.art === 'marker')) {
        const um = R.umrechner(flaeche);
        const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
        (coalesced.length ? coalesced : [event]).forEach(e => addSample(e, um));
        nassenSchwanz(event, um);
        bildAnfordern();
        return;
      }
      const point = R.zuBlatt(flaeche, event);
      if (!point) return;
      if (radierStrich) {
        /* Zwischen zwei Ereignissen kann der Zeiger weit springen; damit
           kein Strich in der Luecke ueberlebt, wird der Weg in Schritten
           von einem halben Radius abgefahren. */
        const vx = radierStrich.letzter[0] ?? 0, vy = radierStrich.letzter[1] ?? 0;
        const px = point[0] ?? 0, py = point[1] ?? 0;
        const abstand = Math.hypot(px - vx, py - vy);
        const n = Math.max(1, Math.ceil(abstand / Math.max(1, radierRadius() / 2)));
        for (let i = 1; i <= n; i++) {
          const zw = [vx + (px - vx) * i / n, vy + (py - vy) * i / n];
          if (radiereBei(zw)) radierStrich.geaendert = true;
        }
        radierStrich.letzter = point;
        radierStrich.kreis?.setAttribute('cx', String(point[0]));
        radierStrich.kreis?.setAttribute('cy', String(point[1]));
        return;
      }
      if (selectDrag) {
        selectDrag.end = point;
        if (selectDrag.mode === 'move') {
          const dx = point[0] - selectDrag.start[0];
          const dy = point[1] - selectDrag.start[1];
          selectDrag.moved = selectDrag.moved || Math.hypot(dx, dy) > 0.5;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original || original.gesperrt) continue;
            marks[index] = InkGeometry.move(clone(original), dx, dy);
            updateNode(nodeFor(id), marks[index]);
            merke(marks[index]);
          }
          renderSelection();
        } else if (selectDrag.mode === 'scale') {
          const [ax, ay] = selectDrag.anker as [number, number];
          /* In den Achsen des Kastens messen (E474): bei einem schiefen
             Kasten sind „breiter" und „hoeher" nicht die Richtungen des
             Blattes, sondern die der Marke. */
          const achse = Number(selectDrag.achse) || 0;
          const imKasten = (q: number[]): [number, number] => achse
            ? InkGeometry.drehePunkte([[q[0] ?? 0, q[1] ?? 0]], [ax, ay], -achse)[0]!
            : [q[0] ?? 0, q[1] ?? 0];
          const von = imKasten(selectDrag.start), nach = imKasten(point);
          const dx0 = von[0] - ax, dy0 = von[1] - ay;
          let sx = Math.abs(dx0) < 1 ? 1 : (nach[0] - ax) / dx0;
          let sy = Math.abs(dy0) < 1 ? 1 : (nach[1] - ay) / dy0;
          /* Mit Umschalt bleibt das Seitenverhaeltnis — bei einem BILD in
             der Auswahl ist es umgekehrt (E357): ein Foto bleibt von sich
             aus im Verhaeltnis, wie in GoodNotes, und Umschalt gibt es frei.
             Ein verzerrtes Gesicht ist selten das, was man wollte. */
          const bildDabei = [...selection].some(id => marks.find(mark => idOf(mark) === id)?.art === 'bild');
          if (event.shiftKey !== bildDabei) { const s = (Math.abs(sx) + Math.abs(sy)) / 2; sx = s; sy = s; }
          sx = Math.max(0.05, Math.min(50, sx));
          sy = Math.max(0.05, Math.min(50, sy));
          selectDrag.moved = selectDrag.moved || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original || original.gesperrt) continue;
            marks[index] = InkGeometry.scale(clone(original), [ax, ay], sx, sy, achse);
            updateNode(nodeFor(id), marks[index]);
            merke(marks[index]);
          }
          renderSelection();
        } else if (selectDrag.mode === 'kurve') {
          const id = String([...selection][0] ?? '');
          const index = marks.findIndex(mark => idOf(mark) === id);
          const original = selectDrag.originals.get(id);
          if (index >= 0 && original && !original.gesperrt) {
            /* Der Steuerpunkt steht in den Achsen der MARKE (E474): eine
               gedrehte Kurve wird sonst in die falsche Richtung gebogen. */
            const grad = InkGeometry.drehung(original);
            const b = InkGeometry.boundsLokal(original);
            const mitte: [number, number] = [b.x + b.width / 2, b.y + b.height / 2];
            const lokal = grad ? InkGeometry.drehePunkte([[point[0], point[1]]], mitte, -grad)[0]! : point;
            const neu = clone(original);
            const pts = InkGeometry.points(neu.pts);
            neu.pts = [pts[0], pts[1], [Math.round(lokal[0]! * 100) / 100, Math.round(lokal[1]! * 100) / 100]];
            marks[index] = neu;
            selectDrag.moved = true;
            updateNode(nodeFor(id), neu);
            merke(neu);
            renderSelection();
          }
        } else if (selectDrag.mode === 'rotate') {
          const [mx, my] = selectDrag.mitte as [number, number];
          let grad = (Math.atan2(point[1] - my, point[0] - mx) - selectDrag.winkel0) * 180 / Math.PI;
          if (lineal || event.shiftKey) grad = Math.round(grad / 15) * 15;
          selectDrag.moved = selectDrag.moved || Math.abs(grad) > 0.5;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original || original.gesperrt) continue;
            marks[index] = InkGeometry.rotate(clone(original), [mx, my], grad);
            updateNode(nodeFor(id), marks[index]);
            merke(marks[index]);
          }
          renderSelection();
        } else {
          const pts = selectDrag.pts as number[][];
          const last = pts[pts.length - 1]!;
          if (Math.hypot(point[0] - (last[0] ?? 0), point[1] - (last[1] ?? 0)) >= 1) pts.push(point);
          const node = flaeche.querySelector<SVGPathElement>('[data-ink-ui="box"]');
          if (node) node.setAttribute('d', pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ') + ' Z');
        }
        return;
      }
      if (!running) return;
      /* Stift und Marker sind oben schon heraus (E511). */
      running.pts[1] = ruler.constrained() ? ruler.project(point) : lineal && (running.art === 'line' || running.art === 'arrow')
        ? rasten(running.pts[0], point) : point;
      runningNode = updateNode(runningNode, running);
    });
    const beiEnde = (event: PointerEvent): void => {
      if (fingerPan?.id === event.pointerId) { fingerPan = null; return; }
      if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger) return;
      /* Der Laser verblasst und ist weg — kein `finish`, weil es nichts
         abzuschliessen gibt (E512). */
      if (laserZug) { laserAus(); aktiverZeiger = null; return; }
      // pointerup may carry a final position that no pointermove delivered.
      // Keep the previous pressure: pen devices report zero pressure on lift.
      if (event.type === 'pointerup' && running && (running.art === 'stift' || running.art === 'marker')) {
        const rawEnd = R.zuBlatt(flaeche, event);
        const end = rawEnd ? ruler.project(rawEnd) : null;
        if (end) {
          const last = running.pts[running.pts.length - 1];
          if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.01) {
            running.pts.push(end);
            running.pressure.push(running.pressure[running.pressure.length - 1] ?? 0.5);
          }
          rohLetzter = end;
        }
      }
      finish();
    };
    /* ══ DER ABBRUCH IST NICHT DAS ENDE (E504) ═════════════════════════════
       Aus dem Stift-Dossier, Seite 17: „Android verlangt bei ACTION_CANCEL /
       Palm-Rejection ausdruecklich das Entfernen des betreffenden Motion
       Sets und Re-Rendering. Eine App, die Cancel ignoriert, produziert
       Artefakte."

       Redion ignorierte es nicht — es SPEICHERTE. `pointercancel` hing am
       selben Griff wie `pointerup`, und damit landete jeder vom Browser
       abgebrochene Zug als Strich im Papier. Der Fall, in dem das weh tut,
       ist der Alltag: der Handballen beruehrt das Glas VOR dem Stift (so
       setzt jede Hand auf), der Browser erkennt ihn selbst als Palm und
       nimmt den Zeiger weg — und Redion schrieb einen Fremdstrich.

       ES WIRD NACH DER ZEIGERART ENTSCHIEDEN, und das ist die ganze
       Vorsicht dieser Stelle. Ein Handballen ist ein `touch`; ein
       abgebrochener STIFT-Zug ist Handschrift, die ein Mensch gezogen hat,
       und §51 steht ueber jedem Dossier: lieber ein Strich zu viel als eine
       Zeile Handschrift, die niemand wiederbekommt. Deshalb verwirft der
       Abbruch nur den Finger.

       `pagehide` (weiter oben) bleibt davon unberuehrt und schliesst
       weiterhin ab — dort ist Abbrechen nicht die Absicht des Browsers,
       sondern das Ende der Seite. */
    const beiAbbruch = (event: PointerEvent): void => {
      if (fingerPan?.id === event.pointerId) { fingerPan = null; return; }
      if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger) return;
      if (running && running.zeigerArt !== 'pen') { verwerfen(); return; }
      beiEnde(event);
    };
    flaeche.addEventListener('pointerup', beiEnde);
    flaeche.addEventListener('pointercancel', beiAbbruch);
    /* ══ DAS ENDE ZÄHLT AUCH, WENN ES WOANDERS LANDET (E512) ═══════════════
       Die drei Griffe darüber hängen an der Zeichenschicht. Ein Abheben,
       das der Browser einem anderen Element zustellt — weil der Griff
       (`setPointerCapture`) verlorenging, weil ein Fenster dazwischenkam,
       weil der Zeiger die Fläche verlassen hat —, erreichte sie nie, und
       der Zug blieb für immer offen.

       AM FENSTER, IN DER ABFANGPHASE, und nur für den Zeiger, der HIER
       führt. Ein fremdes Abheben irgendwo auf der Seite geht die Fläche
       nichts an; deshalb steht die Bedingung davor und nicht dahinter.

       Die Griffe werden mitgeführt, solange die Fläche lebt — die
       Lebenswache (E115) räumt sie mit ihr ab. */
    const beiEndeGlobal = (event: PointerEvent): void => {
      if (aktiverZeiger === null || event.pointerId !== aktiverZeiger) return;
      if (event.target instanceof Node && flaeche.contains(event.target)) return;
      if (event.type === 'pointercancel') beiAbbruch(event); else beiEnde(event);
    };
    if (typeof addEventListener === 'function') {
      addEventListener('pointerup', beiEndeGlobal, true);
      addEventListener('pointercancel', beiEndeGlobal, true);
    }
    flaeche.addEventListener('pointerleave', (event: PointerEvent) => {
      if (!flaeche.hasPointerCapture(event.pointerId)) beiEnde(event);
    });
    /* Der Seitenknopf eines Stifts ist fuer den Browser eine rechte Taste —
       ohne diese Zeile spraenge beim Radieren das Kontextmenue auf. */
    flaeche.addEventListener('contextmenu', event => { if (tool !== 'schreiben') event.preventDefault(); });
    /* Aufdecken per Tipp — NUR im Schreiben-Modus. Die Fläche selbst ist
       dort durchlässig (pointer-events:none), das Band bleibt greifbar,
       weil sein Knoten `pointer-events:all` trägt. In jedem Werkzeug-
       Modus gilt der Tipp dem Werkzeug (zeichnen, radieren, wählen). */
    flaeche.addEventListener('click', (event: MouseEvent) => {
      if (tool !== 'schreiben') return;
      /* Ein Verweis (E468) geht vor: er ist der Grund, warum man tippt. */
      const verweis = (event.target as Element)?.closest?.('[data-verweis]') as SVGElement | null;
      if (verweis) {
        event.preventDefault(); event.stopPropagation();
        const mark = marks.find(m => idOf(m) === verweis.getAttribute('data-sid'));
        if (mark) verweisFolgen(mark);
        return;
      }
      const ziel = (event.target as Element)?.closest?.('[data-ink-art="abdeck"]') as SVGElement | null;
      if (!ziel) return;
      event.preventDefault();
      event.stopPropagation();
      const id = ziel.getAttribute('data-sid') || '';
      if (aufgedeckt.has(id)) aufgedeckt.delete(id);
      else aufgedeckt.add(id);
      abdeckAnwenden();
    });
    flaeche.addEventListener('keydown', (event: KeyboardEvent) => {
      const strg = event.ctrlKey || event.metaKey;
      const taste = event.key.toLowerCase();
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection.size) {
        event.preventDefault(); deleteSelection();
      } else if (strg && taste === 'z') {
        event.preventDefault(); event.shiftKey ? redo() : undo();
      } else if (strg && taste === 'x' && selection.size) {
        event.preventDefault(); cutSelection();
      } else if (strg && taste === 'c' && selection.size) {
        event.preventDefault(); copySelection();
      } else if (strg && taste === 'v' && zwischenablage.length) {
        event.preventDefault(); paste();
      } else if (event.key === 'Escape' && selection.size) {
        /* Escape hebt die Auswahl auf — und laeuft weiter zu den Fenstern (E302). */
        selection.clear(); renderSelection();
      }
    });
    /* DIE LEBENSWACHE (E115) SCHLIESST AUCH DAS SCHREIBFELD (E597).
       Ohne diese Zeile verlöre ein Satz, der noch im Feld steht, beim
       Blättern auf die nächste Seite: die Fläche verschwindet, das Feld mit
       ihr, und niemand hätte etwas gemerkt. Dasselbe gilt für `pagehide`
       und für einen Wechsel des Browserreiters — beide hängen schon an
       dieser Wache. Ein geschlossenes Feld ist unbequem; ein verlorener
       Satz ist Datenverlust (§51). */
    registerLayer({ flaeche, abschliessen: () => {
      const offen = !!schreiber;
      if (offen) schreiberSchliessen();
      /* `finish` zuerst NICHT: es schliesst einen laufenden Strich, und ein
         Strich und ein Schreibfeld können nicht gleichzeitig offen sein.
         Beide zu rufen ist trotzdem richtig — die Wache soll alles
         abschliessen, was offen ist, nicht das Erste, was sie findet. */
      return finish() || offen;
    } });

    flaeche.style.pointerEvents = 'none';
    flaeche.setAttribute('tabindex', '-1');
    const setzeWerkzeug = (next: string): void => {
      /* Wer das Werkzeug wechselt, hat den Satz zu Ende geschrieben (E597). */
      if (schreiber) schreiberSchliessen();
      finish();
      /* JEDES WERKZEUG BEHÄLT SEINS (E674): dem alten wird gutgeschrieben,
         was an war; das neue holt sich, was es hatte. Ein Werkzeug, das noch
         nichts gemerkt hat, übernimmt, was gerade an ist — wie bisher, keine
         Überraschung. Und die Leiste erfährt es über den Kern, damit oben
         der Tupfer leuchtet, der wirklich gilt. */
      const vorher = werkzeugGruppe(tool);
      werkzeugwertMerken();
      tool = next;
      const nachher = werkzeugGruppe(next);
      if (nachher && nachher !== vorher) {
        letzteGruppe = nachher;
        const w = werkzeugwerteLesen()[nachher];
        if (w) {
          if (w.farbe !== undefined) color = w.farbe;
          if (w.breite !== undefined) width = w.breite;
          if (typeof Zeichenziel !== 'undefined') {
            try {
              Zeichenziel.uebernehme(steuerung, next);
              Zeichenziel.uebernehmeFarbe(steuerung, color);
              Zeichenziel.uebernehmeStrich(steuerung, width);
            } catch { /* ohne Kern geht es wie bisher */ }
          }
        }
      }
      if (tool !== 'select') { selection.clear(); renderSelection(); }
      flaeche.style.pointerEvents = tool === 'schreiben' ? 'none' : 'auto';
      flaeche.setAttribute('data-tool', tool);
      flaeche.setAttribute('tabindex', tool === 'schreiben' ? '-1' : '0');
    };
    /* FARBE UND STRICH MIT AUSWAHL GELTEN DER AUSWAHL (E353), wie in
       GoodNotes: wer drei Striche waehlt und Rot antippt, faerbt die drei
       um — und zeichnet danach rot weiter. Ein Schritt im Verlauf. */
    const setzeFarbe = (next: string): void => {
      color = next;
      werkzeugwertMerken();
      /* Wer gerade schreibt, meint den Kasten unter seinem Zeiger (E599). */
      if (schreiber && schreiberUmformen({ farbe: next })) return;
      if (!selection.size) return;
      const before = snapshot();
      /* ERSETZEN STATT AENDERN (E378) — sonst zeigte der Merkzettel schon
         die neue Farbe, und „Zurueck" holte nichts zurueck. */
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        if (!selection.has(idOf(alt)) || alt.art === 'bild') continue;
        const neu = { ...alt, farbe: next };
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        merke(neu);
      }
      commit(before);
    };
    const setzeStrich = (next: number): void => {
      width = next;
      werkzeugwertMerken();
      if (!selection.size) return;
      const before = snapshot();
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        /* GESPERRT HEISST AUCH: NICHT DICKER (E473). Die Sperre schuetzt
           Form, Ort, Groesse, Drehung, Reihenfolge, Text und Bestand; die
           FARBE bleibt erlaubt, das steht so in E466. */
        if (!selection.has(idOf(alt)) || alt.breite === undefined || alt.gesperrt) continue;
        const neu = { ...alt, breite: next };
        /* Die feste Breite (E704) geht der Breite vor — sie wächst deshalb
           im selben Verhältnis mit, sonst änderte der Knopf nichts. */
        if (Number(alt.breiteFest) > 0 && Number(alt.breite) > 0)
          neu.breiteFest = Math.round(Number(alt.breiteFest) * next / Number(alt.breite) * 100) / 100;
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        merke(neu);
      }
      renderSelection();
      commit(before);
    };
    const setzeStil = (next: string): void => {
      if (!STIFTE.some(st => st.id === next)) return;
      stil = next;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:stift', next);
    };
    const stilVon = (): string => stil;
    /* SCHRIFT MIT AUSWAHL GILT DER AUSWAHL (E360), wie Farbe und Strich
       (E353): wer einen Text waehlt und A+ tippt, macht DIESEN groesser —
       jede gewaehlte Marke eine Stufe von ihrer eigenen Groesse aus — und
       schreibt danach groesser weiter. Ein Schritt im Verlauf. */
    const setzeSchrift = (aenderung: Partial<Schrift> & { schritt?: number }): void => {
      const schritt = Number(aenderung.schritt) || 0;
      schrift = {
        familie: aenderung.familie !== undefined && SCHRIFTEN.some(x => x.id === aenderung.familie)
          ? String(aenderung.familie) : schrift.familie,
        groesse: schritt ? naechsteStufe(schrift.groesse, schritt)
          : (aenderung.groesse !== undefined ? Math.max(8, Number(aenderung.groesse) || schrift.groesse) : schrift.groesse),
        fett: aenderung.fett !== undefined ? !!aenderung.fett : schrift.fett,
        rahmen: aenderung.rahmen !== undefined ? !!aenderung.rahmen : schrift.rahmen,
        ausricht: aenderung.ausricht !== undefined
          && AUSRICHTUNGEN.some(x => x.id === aenderung.ausricht)
          ? String(aenderung.ausricht) : schrift.ausricht };
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:schrift', schrift);
      /* ══ DAS OFFENE SCHREIBFELD ÄNDERT SICH MIT (E599) ══════════════════ */
      if (schreiber) {
        const marke = schreiberMarke();
        const felder: Record<string, unknown> = {};
        if (schritt) felder.fontSize = naechsteStufe(Math.max(8, Number(marke?.fontSize) || 18), schritt);
        else if (aenderung.groesse !== undefined) felder.fontSize = schrift.groesse;
        if (aenderung.familie !== undefined) felder.schrift = schrift.familie;
        if (aenderung.fett !== undefined) felder.fett = schrift.fett;
        if (aenderung.rahmen !== undefined) felder.rahmen = schrift.rahmen;
        if (aenderung.ausricht !== undefined) felder.ausricht = schrift.ausricht;
        if (Object.keys(felder).length && schreiberUmformen(felder)) return;
      }
      if (!selection.size) return;
      const before = snapshot();
      let geaendert = false;
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        if (!selection.has(idOf(alt)) || alt.art !== 'text' || alt.gesperrt) continue;
        const neu: any = { ...alt };
        if (schritt) neu.fontSize = naechsteStufe(Math.max(8, Number(alt.fontSize) || 18), schritt);
        else if (aenderung.groesse !== undefined) neu.fontSize = schrift.groesse;
        if (aenderung.familie !== undefined) neu.schrift = schrift.familie;
        if (aenderung.fett !== undefined) neu.fett = schrift.fett;
        if (aenderung.rahmen !== undefined) neu.rahmen = schrift.rahmen;
        if (aenderung.ausricht !== undefined) neu.ausricht = schrift.ausricht;
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        geaendert = true;
      }
      if (geaendert) { renderSelection(); commit(before); }
    };
    const schriftVon = (): Schrift => ({ ...schrift });
    const setzeRadierModus = (next: string): void => {
      if (!RADIERER.some(r => r.id === next)) return;
      radierModus = next;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:radierer', next);
    };
    const radierModusVon = (): string => radierModus;
    const beiAenderung = (listener: (next: any) => void): (() => void) => {
      stateListeners.add(listener); listener(state()); return () => stateListeners.delete(listener);
    };

    /* DAS RÜCKGABEOBJEKT BEKOMMT EINEN NAMEN.
       Es stand als Literal im `return` am Ende — und der Lauscher weiter
       oben braucht genau dieses Objekt, um sich beim Kern zu melden. Zwei
       verschiedene Objekte für dieselbe Fläche wären der sichere Weg zu
       einem Knopf, der auf nichts wirkt. */
    const setzeLineal = (an: boolean): void => { lineal = !!an; ruler.setActive(lineal); };
    const linealAn = (): boolean => lineal;
    const setzeFormen = (an: boolean): void => {
      formen = !!an;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:formen', formen);
    };
    const formenAn = (): boolean => formen;

    const steuerung = { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, setzeStil, stilVon, setzeRadierModus, radierModusVon, copySelection, paste, marken: marks,
      undo, redo, deleteSelection, beiAenderung, state, setzeLineal, linealAn, setzeFormen, formenAn, bildEinfuegen,
      setzeSchrift, schriftVon, resumeWriting, finishWriting: schreiberSchliessen,
      /* E466: Auswahl wie GoodNotes. */
      cutSelection, nachVorn, nachHinten, sperren, gesperrtGewaehlt,
      /* E468: ein Verweis an der Auswahl. */
      verweisSetzen,
      /* E494: die Elemente-Bibliothek — sichern aus der Auswahl, setzen per Tipp. */
      elementAusAuswahl,
      elementGewaehlt: (): string => letztesElement,
      selectElement: (id: string): void => { if (elementHolen(id)) { letztesElement = id; notifyState(); } },
      /* NULL HEISST „AUTOMATISCH AN STRICH ANPASSEN" (E624). Der Zustand
         gab es seit je — `radierRadius()` ist `eraserSize ?? max(5, width*3)`
         —, nur führte kein Weg dorthin zurück: das Studio setzte beim
         Aufbau sofort die gemerkte Grösse. Jetzt ist er ein Schalter. */
      setEraserSize: (radius: number): void => {
        if (radius === 0) { eraserSize = null; return; }
        if (RADIER_GROESSEN.includes(radius)) eraserSize = radius;
      },
      eraserSize: (): number => radierRadius(),
      elementWaehlen: async (): Promise<string> => {
        const gewaehlt = await elementWaehlen();
        if (gewaehlt) { letztesElement = gewaehlt; notifyState(); }
        return gewaehlt;
      },
      setzeKritzel: (an: boolean): void => {
        kritzel = !!an;
        if (typeof Store !== 'undefined') { try { Store.setMeta('zeichnen:kritzel', kritzel); } catch { /* nur diese Sitzung */ } }
      },
      kritzelAn: (): boolean => kritzel };
    return steuerung;
  };

  /* ────────────────────────────────────────────────────────────────────── *
   * EINE STELLE, DIE DIE TUPFER PRÜFT (E486)
   *
   * Bis hierher schrieb nur `eigeneFarbeMerken` diese Liste — eine Tür,
   * eine Prüfung. Mit den Farbsätzen kommen drei weitere dazu (sichern,
   * laden, zurücksetzen), und jede hätte ihre eigene Prüfung mitgebracht.
   * Drei Prüfungen für dasselbe laufen auseinander, und niemand sieht,
   * welche gilt (§8). Also steht sie EINMAL hier.
   *
   * KLEINSCHREIBUNG IST KEIN SCHÖNHEITSSCHRITT. `data-c` wird zeichenweise
   * mit der Farbe der Fläche verglichen (`node.dataset.c === farbe`), und
   * die kommt vom Farbwähler immer klein. Ein Tupfer `#AABBCC` in einer
   * eingespielten Sicherung leuchtete deshalb nie, obwohl er die Farbe war.
   * ────────────────────────────────────────────────────────────────────── */
  const farbenRein = (roh: unknown): string[] => {
    if (!Array.isArray(roh)) return [];
    const rein: string[] = [];
    for (const eintrag of roh) {
      const wert = String(eintrag ?? '').toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(wert)) continue;
      /* Eine der fünf festen Farben wäre der zweite Knopf für dieselbe
         Farbe — beide leuchteten, und einer wäre überflüssig. */
      if ((FARBEN as readonly string[]).includes(wert)) continue;
      if (rein.includes(wert)) continue;
      rein.push(wert);
      if (rein.length >= HOECHSTENS_EIGENE_FARBEN) break;
    }
    return rein;
  };
  const farbenSetzen = (roh: unknown): string[] => {
    const rein = farbenRein(roh);
    if (typeof Store !== 'undefined') {
      try { Store.setMeta('zeichnen:farben', rein); } catch { /* nur diese Sitzung */ }
    }
    return rein;
  };
  /** Die zuletzt gewaehlten eigenen Farben — hoechstens vier, gemerkt als Meta. */
  const eigeneFarben = (): string[] => farbenRein(
    typeof Store === 'undefined' ? [] : Store.getMeta('zeichnen:farben'));
  const eigeneFarbeMerken = (wert: string): string[] => farbenSetzen([wert, ...eigeneFarben()]);

  /* ────────────────────────────────────────────────────────────────────── *
   * FARBSÄTZE (E486, L133)
   *
   * GoodNotes hält mehrere Paletten und lässt zwischen ihnen wechseln.
   * Redion hatte seit E351 die vier zuletzt gewählten Tupfer — eine
   * Palette, die sich beim Zeichnen selbst umschreibt. Wer für Korrekturen
   * andere Farben braucht als für Notizen, verlor die einen an die anderen.
   *
   * Ein Farbsatz ist deshalb GENAU DAS, was schon da ist: eine benannte
   * Abschrift der vier Tupfer. Kein neues Farbmodell, kein zweiter Katalog
   * (§8) — die fünf festen Farben bleiben die festen, und ein Satz sagt nur,
   * welche vier eigenen daneben stehen.
   *
   * WO ER LIEGT: in `meta`, wie die Tupfer selbst. `meta` ist eines der
   * Fächer der Sicherung (§9) — ein Farbsatz reist damit in `.json` und in
   * `.redion` mit, ohne dass hier etwas dafür zu tun wäre.
   * ────────────────────────────────────────────────────────────────────── */
  /* EIN SATZ IST SEIT E501 EINE VOREINSTELLUNG (Redurs Dossier, Abschnitt
     „Stift, Bleistift, Marker und Radierer"): „Farben und Stärken lassen
     sich anpassen und als Presets bereithalten."

     Also KEIN zweiter Katalog neben den Farbsätzen (§8), sondern zwei
     Felder mehr am vorhandenen: welcher Stift und welche Strichstärke beim
     Sichern geführt haben. Beide sind optional — ein Satz aus der Zeit vor
     E501 hat sie nicht und lädt weiter genau seine Farben (§9: rückwärts
     denken). */
  type Farbsatz = { name: string; farben: string[]; stil?: string; breite?: number };

  /** Ein Name, mit dem sich arbeiten lässt: ohne Rand, ohne Zeilenumbrüche, kurz. */
  const satzName = (roh: unknown): string =>
    String(roh ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

  const farbsaetze = (): Farbsatz[] => {
    if (typeof Store === 'undefined') return [];
    const roh = Store.getMeta('zeichnen:farbsaetze');
    if (!Array.isArray(roh)) return [];
    const raus: Farbsatz[] = [];
    for (const eintrag of roh) {
      const name = satzName((eintrag as any)?.name);
      if (!name) continue;
      if (raus.some(s => s.name.toLowerCase() === name.toLowerCase())) continue;
      const satz: Farbsatz = { name, farben: farbenRein((eintrag as any)?.farben) };
      /* Nur, was es wirklich gibt: ein Stift, den dieser Stand nicht kennt,
         wäre eine Voreinstellung, die beim Laden ins Leere greift. */
      const stil = String((eintrag as any)?.stil || '');
      if (STIFTE.some(st => st.id === stil)) satz.stil = stil;
      const breite = Number((eintrag as any)?.breite);
      if (Number.isFinite(breite) && breite > 0) satz.breite = breite;
      raus.push(satz);
      if (raus.length >= HOECHSTENS_FARBSAETZE) break;
    }
    return raus;
  };

  const farbsaetzeSchreiben = (liste: Farbsatz[]): Farbsatz[] => {
    const rein = liste.slice(0, HOECHSTENS_FARBSAETZE);
    if (typeof Store !== 'undefined') {
      try { Store.setMeta('zeichnen:farbsaetze', rein); } catch { /* nur diese Sitzung */ }
    }
    return rein;
  };

  /**
   * Einen Satz ablegen. Gleicher Name ersetzt — DIE FRAGE DANACH STELLT DER
   * AUFRUFER, nicht diese Funktion: eine Speicherfunktion, die manchmal
   * fragt und manchmal nicht, ist an keiner Stelle vorhersehbar.
   * Gibt `null` zurück, wenn die Liste voll ist und der Name neu wäre —
   * damit der Aufrufer es SAGEN kann, statt dass hier still nichts geschieht.
   */
  const farbsatzSichern = (roh: unknown, farben: readonly string[] = eigeneFarben(),
                          stift?: { stil?: unknown; breite?: unknown }): Farbsatz[] | null => {
    const name = satzName(roh);
    if (!name) return null;
    const liste = farbsaetze();
    const stelle = liste.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    const satz: Farbsatz = { name, farben: farbenRein(farben.slice()) };
    /* E501: Stift und Strichstärke reisen mit, wenn der Aufrufer sie nennt.
       Er tut es aus der Leiste heraus; wer `farbsatzSichern` ohne sie ruft
       (der Prüflauf, ein Skript), bekommt weiter einen reinen Farbsatz. */
    const stil = String(stift?.stil || '');
    if (STIFTE.some(st => st.id === stil)) satz.stil = stil;
    const breite = Number(stift?.breite);
    if (Number.isFinite(breite) && breite > 0) satz.breite = breite;
    if (stelle >= 0) { liste[stelle] = satz; return farbsaetzeSchreiben(liste); }
    if (liste.length >= HOECHSTENS_FARBSAETZE) return null;
    return farbsaetzeSchreiben([...liste, satz]);
  };

  const farbsatzLoeschen = (roh: unknown): Farbsatz[] => {
    const name = satzName(roh).toLowerCase();
    return farbsaetzeSchreiben(farbsaetze().filter(s => s.name.toLowerCase() !== name));
  };

  /**
   * Einen Satz laden: die Tupfer setzen und den GANZEN Satz zurückgeben.
   *
   * SEIT E501 GIBT ER DEN SATZ ZURÜCK, nicht nur die Farben — sonst
   * bräuchte der Aufrufer einen zweiten Griff für Stift und Stärke, und
   * zwei Griffe für eine Voreinstellung sind einer zu viel (§8). Die
   * Farben stehen weiter darin, nur eine Ebene tiefer.
   *
   * Unbekannter Name: `null`, und nichts tut sich.
   */
  const farbsatzLaden = (roh: unknown): Farbsatz | null => {
    const name = satzName(roh).toLowerCase();
    const satz = farbsaetze().find(s => s.name.toLowerCase() === name);
    if (!satz) return null;
    return { ...satz, farben: farbenSetzen(satz.farben) };
  };

  /** Zurück auf den Auslieferungsstand: keine eigenen Tupfer. Die Sätze bleiben. */
  const farbenZuruecksetzen = (): string[] => farbenSetzen([]);

  /* ────────────────────────────────────────────────────────────────────── *
   * DIE ELEMENTE-BIBLIOTHEK (E494)
   *
   * GoodNotes nennt sie „Elements": eine Sammlung fertiger Zeichnungen, die
   * man auf jede Seite stempelt — ein Pfeil, ein Häkchen, ein Schaltplan-
   * Ausschnitt, eine Unterschrift. In Redion ist ein Element GENAU DAS, was
   * ohnehin schon da ist: eine Auswahl von Marken, benannt und abgelegt.
   * Kein neues Zeichenmodell, kein zweiter Katalog (§8) — dieselben Marken,
   * die auch die Zwischenablage kopiert, nur überleben sie das Dokument.
   *
   * WO SIE LIEGEN: in `meta`, wie die Farbsätze. Damit reisen sie in `.json`
   * und in `.redion` mit, ohne dass hier etwas dafür zu tun wäre (§9, §11).
   *
   * WAS DAS NICHT KANN, und es steht in `LUECKEN.md`: ein Element mit einer
   * BILDMARKE trägt nur die Kennung der Datei, nicht die Datei. Wer es aus
   * einer `.json`-Sicherung zurückholt (die keine Anhänge kennt, §11), hat
   * das Element und nicht sein Bild. Die Marke bleibt trotzdem stehen und
   * zeigt ihren Platzhalter — sie wird nicht stillschweigend gelöscht (§18).
   * ────────────────────────────────────────────────────────────────────── */
  /* DER NAME IST ENGLISCH UND ER IST NICHT „Element" (§53.1 und ein Fund des
     Typprüfers): `Element` ist im Browser die DOM-Klasse, und ein Typ dieses
     Namens verdeckt sie in der ganzen Datei. `npm run typecheck` meldete
     danach an achtzehn Stellen „Property 'closest' does not exist on type
     'Element'" — Fehler in Zeilen, die niemand angefasst hatte. */
  type LibraryElement = { id: string; name: string; marken: any[]; breite: number; hoehe: number };

  const kurzeId = (): string =>
    typeof Ids !== 'undefined' ? Ids.short(8) : 'e' + Math.random().toString(36).slice(2, 10);

  /** Der Name eines Elements — dieselbe Regel wie beim Farbsatz. */
  const elementName = (roh: unknown): string => satzName(roh);

  const elemente = (): LibraryElement[] => {
    if (typeof Store === 'undefined') return [];
    const roh = Store.getMeta('zeichnen:elemente');
    if (!Array.isArray(roh)) return [];
    const raus: LibraryElement[] = [];
    for (const eintrag of roh) {
      const name = elementName((eintrag as any)?.name);
      const marken = (eintrag as any)?.marken;
      if (!name || !Array.isArray(marken) || !marken.length) continue;
      raus.push({
        id: String((eintrag as any)?.id || kurzeId()),
        name,
        marken: marken.map(m => clone(m)),
        breite: Math.max(1, Number((eintrag as any)?.breite) || 1),
        hoehe: Math.max(1, Number((eintrag as any)?.hoehe) || 1)
      });
      if (raus.length >= HOECHSTENS_ELEMENTE) break;
    }
    return raus;
  };

  const elementeSchreiben = (liste: LibraryElement[]): LibraryElement[] => {
    const rein = liste.slice(0, HOECHSTENS_ELEMENTE);
    if (typeof Store !== 'undefined') {
      try { Store.setMeta('zeichnen:elemente', rein); } catch { /* nur diese Sitzung */ }
    }
    return rein;
  };

  /**
   * Marken zu einem Element machen: auf den Nullpunkt gerückt, ohne Auswahl-
   * zustand, ohne Sperre.
   *
   * DIE SPERRE FÄLLT WEG, und das ist Absicht: sie gehört zu einer Marke auf
   * EINER Seite („diese hier nicht mehr anfassen"), nicht zur Vorlage. Ein
   * Element, das gesperrt ankommt, liesse sich nach dem Setzen nicht mehr
   * verschieben — und E492 hat gezeigt, wie teuer eine Sperre ist, die man
   * nicht mehr löst.
   */
  const elementNormieren = (roh: readonly any[]): { marken: any[]; breite: number; hoehe: number } | null => {
    const marken = (roh || []).filter(m => m && typeof m === 'object').map(m => clone(m));
    if (!marken.length) return null;
    const kasten = InkGeometry.union(marken.map(m => InkGeometry.bounds(m)));
    const verschoben = marken.map(m => {
      const kopie = InkGeometry.move(m, -kasten.x, -kasten.y);
      delete kopie.gesperrt;
      delete kopie.id;
      return kopie;
    });
    return { marken: verschoben, breite: Math.max(1, kasten.width), hoehe: Math.max(1, kasten.height) };
  };

  /**
   * Ein Element ablegen.
   *
   * Gibt einen Grund zurück statt `null`, weil es drei verschiedene Gründe
   * gibt, und „es ging nicht" ist bei jedem von ihnen die falsche Auskunft:
   * nichts gewählt, die Bibliothek voll, das Element zu gross. Wer es
   * anzeigt, kann dann sagen, WAS zu tun ist.
   */
  const elementSichern = (roh: unknown, marken: readonly any[]):
    { ok: true; liste: LibraryElement[]; element: LibraryElement } | { ok: false; grund: string } => {
    const name = elementName(roh);
    if (!name) return { ok: false, grund: 'Ein Element braucht einen Namen.' };
    const teil = elementNormieren(marken);
    if (!teil) return { ok: false, grund: 'Es ist nichts ausgewählt, das ein Element werden könnte.' };
    let gross = 0;
    try { gross = JSON.stringify(teil.marken).length; } catch { gross = HOECHSTENS_ELEMENT_BYTES + 1; }
    if (gross > HOECHSTENS_ELEMENT_BYTES) {
      return { ok: false, grund: 'Dieses Element ist zu gross (' + Math.round(gross / 1024) + ' KB von höchstens '
        + Math.round(HOECHSTENS_ELEMENT_BYTES / 1024) + '). Elemente liegen bei den Einstellungen und reisen mit jeder Sicherung — wähle weniger Striche.' };
    }
    const liste = elemente();
    const element: LibraryElement = { id: kurzeId(), name, ...teil };
    const stelle = liste.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
    if (stelle >= 0) {
      element.id = liste[stelle]!.id;
      liste[stelle] = element;
      return { ok: true, liste: elementeSchreiben(liste), element };
    }
    if (liste.length >= HOECHSTENS_ELEMENTE) {
      return { ok: false, grund: 'Es passen höchstens ' + HOECHSTENS_ELEMENTE + ' Elemente — lösche zuerst eines.' };
    }
    return { ok: true, liste: elementeSchreiben([...liste, element]), element };
  };

  const elementLoeschen = (id: unknown): LibraryElement[] =>
    elementeSchreiben(elemente().filter(e => e.id !== String(id ?? '')));

  const elementHolen = (id: unknown): LibraryElement | null =>
    elemente().find(e => e.id === String(id ?? '')) || null;

  /**
   * Die Marken eines Elements, gesetzt an eine Stelle — MITTIG unter dem
   * Zeiger, nicht mit der Ecke daran.
   *
   * Ein Stempel liegt dort, wo man hintippt; bei einem Element von 200 px
   * Breite läge er sonst um hundert Pixel daneben, und man müsste jedes
   * gesetzte Element hinterher verschieben.
   */
  const elementMarken = (id: unknown, x: number, y: number): any[] => {
    const element = elementHolen(id);
    if (!element) return [];
    return element.marken.map(m =>
      InkGeometry.move({ ...clone(m), id: kurzeId() }, x - element.breite / 2, y - element.hoehe / 2));
  };

  /** Welches Element der nächste Tipp setzt. Nur diese Sitzung — die
      Bibliothek überlebt, die Wahl darin nicht. */
  let letztesElement = '';

  /**
   * Ein kleines Bild eines Elements — GEZEICHNET MIT `zeichneMarke`, nicht
   * mit einem zweiten Zeichner.
   *
   * Das ist derselbe Grund wie bei der Palette der Fachzeichen: zwei
   * Zeichner für dieselben Marken laufen auseinander, und die Vorschau
   * zeigte dann etwas anderes als die Seite (§8).
   */
  const elementBild = (element: LibraryElement, kante = 74): SVGSVGElement => {
    const box = document.createElementNS(NS, 'svg') as SVGSVGElement;
    /* Ein Rand von vier Einheiten, damit ein dicker Strich am Kastenrand
       nicht halb abgeschnitten dasteht. */
    const rand = 4;
    box.setAttribute('viewBox', `${-rand} ${-rand} ${element.breite + rand * 2} ${element.hoehe + rand * 2}`);
    box.setAttribute('width', String(kante));
    box.setAttribute('height', String(kante));
    box.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    box.setAttribute('aria-hidden', 'true');
    for (const mark of element.marken) {
      const node = zeichneMarke({ ...mark, id: kurzeId() });
      if (node) box.appendChild(node);
    }
    return box;
  };

  /**
   * Die Bibliothek zeigen. Gibt die Kennung des gewählten Elements zurück,
   * `''` bei Abbruch. Löschen geschieht im Dialog und schliesst ihn nicht —
   * wer aufräumt, räumt meistens mehr als eines weg.
   */
  const elementWaehlen = (): Promise<string> => new Promise(fertig => {
    const o = document.createElement('div');
    o.className = 'overlay';
    const finder = document.createElement('div');
    finder.className = 'finder';
    finder.style.width = 'min(680px,94vw)';
    const kopf = document.createElement('div');
    kopf.className = 'fh';
    kopf.textContent = 'Elemente';
    const zu = document.createElement('button');
    zu.className = 'icon-btn';
    zu.dataset.a = 'zu';
    zu.setAttribute('aria-label', 'Schliessen');
    zu.textContent = '✕';
    kopf.appendChild(zu);
    finder.appendChild(kopf);
    const liste = document.createElement('div');
    liste.className = 'mz-liste elemente-liste';
    finder.appendChild(liste);
    o.appendChild(finder);

    const schliessen = (wert: string): void => {
      o.remove();
      document.removeEventListener('keydown', beiTaste);
      fertig(wert);
    };
    const beiTaste = (e: KeyboardEvent): void => { if (e.key === 'Escape') schliessen(''); };

    const malen = (): void => {
      liste.textContent = '';
      const alle = elemente();
      if (!alle.length) {
        const leer = document.createElement('p');
        leer.className = 'elemente-leer';
        /* KEIN LEERER KASTEN OHNE WEG HINAUS. Wer die Bibliothek zum ersten
           Mal öffnet, sieht hier, WIE etwas hineinkommt — sonst sieht er
           nichts und schliesst wieder. */
        leer.textContent = 'Noch kein Element. Wähle auf dem Blatt etwas aus '
          + '(Werkzeug «Auswahl») und tippe dort auf «Als Element».';
        liste.appendChild(leer);
        return;
      }
      for (const element of alle) {
        const fach = document.createElement('div');
        fach.className = 'elemente-fach';
        const kachel = document.createElement('button');
        kachel.className = 'elemente-kachel';
        kachel.dataset.el = element.id;
        kachel.title = element.name + ' setzen';
        kachel.appendChild(elementBild(element));
        const wort = document.createElement('i');
        wort.textContent = element.name;
        kachel.appendChild(wort);
        const weg = document.createElement('button');
        weg.className = 'elemente-weg';
        weg.dataset.weg = element.id;
        weg.setAttribute('aria-label', 'Element „' + element.name + '" löschen');
        weg.title = 'Element „' + element.name + '" löschen';
        weg.textContent = '🗑';
        fach.append(kachel, weg);
        liste.appendChild(fach);
      }
    };
    malen();

    o.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel || ziel === o || ziel.closest('[data-a="zu"]')) { schliessen(''); return; }
      const weg = ziel.closest<HTMLElement>('[data-weg]');
      if (weg) {
        elementLoeschen(weg.dataset.weg);
        if (letztesElement === weg.dataset.weg) letztesElement = '';
        malen();
        return;
      }
      const kachel = ziel.closest<HTMLElement>('[data-el]');
      if (kachel) schliessen(String(kachel.dataset.el || ''));
    });
    document.addEventListener('keydown', beiTaste);
    document.body.appendChild(o);
    zu.focus();
  });

  /**
   * ══ DIE LEISTE EINRICHTEN (E570) ═══════════════════════════════════════
   *
   * Zwei Listen — die Werkzeuge und ihr Zubehör —, jede Zeile zu greifen
   * und zu verschieben. Ein Feld und keine Leiste-im-Zeichnen-Modus, aus
   * drei Gründen, und der dritte ist der, der entschieden hat:
   *
   *   1 · Die Leiste ROLLT am Telefon. Etwas in einem waagerecht rollenden
   *       Band zu ziehen heisst, dass jeder Zug auch eine Rollbewegung
   *       sein könnte; das ist auf einem Berührungsbildschirm nicht
   *       auseinanderzuhalten.
   *   2 · Eine Gruppe ist mehrere Knöpfe. „Die Farben verschieben" heisst
   *       sieben Knöpfe auf einmal — in der Leiste sähe man sieben Dinge
   *       und meinte eines.
   *   3 · §38. Ein Ziehen allein ist keine Bedienung: wer mit der Tastatur
   *       arbeitet, kann nichts ziehen. Hier hat jede Zeile zwei Knöpfe,
   *       „hoch" und „runter", und die sind nicht der Notausgang, sondern
   *       der Hauptweg — das Ziehen kommt dazu.
   *
   * WAS MAN ÄNDERT, SIEHT MAN SOFORT. Jede Bewegung legt die neue Ordnung
   * augenblicklich auf jede Leiste der Seite. Ein Feld, das erst beim
   * Schliessen wirkt, lässt einen raten, was man gerade getan hat.
   */
  const leisteEinrichten = (): Promise<void> => new Promise(fertig => {
    const o = document.createElement('div');
    o.className = 'overlay';
    const finder = document.createElement('div');
    finder.className = 'finder blatt-ordnen-feld';
    finder.style.width = 'min(560px,94vw)';

    const kopf = document.createElement('div');
    kopf.className = 'fh';
    kopf.textContent = 'Leiste einrichten';
    const zu = document.createElement('button');
    zu.className = 'icon-btn';
    zu.dataset.a = 'zu';
    zu.setAttribute('aria-label', 'Schliessen');
    zu.textContent = '✕';
    kopf.appendChild(zu);
    finder.appendChild(kopf);

    const koerper = document.createElement('div');
    koerper.className = 'blatt-ordnen-koerper';
    finder.appendChild(koerper);

    const sagen = document.createElement('p');
    sagen.className = 'blatt-ordnen-sagt';
    sagen.setAttribute('aria-live', 'polite');
    finder.appendChild(sagen);

    const fuss = document.createElement('div');
    fuss.className = 'blatt-ordnen-fuss';
    const zurueck = document.createElement('button');
    zurueck.className = 'blatt-ordnen-zurueck';
    zurueck.type = 'button';
    zurueck.textContent = 'Zurücksetzen';
    zurueck.title = 'Die ursprüngliche Reihenfolge wiederherstellen';
    const okay = document.createElement('button');
    okay.className = 'blatt-ordnen-fertig';
    okay.type = 'button';
    okay.textContent = 'Fertig';
    fuss.append(zurueck, okay);
    finder.appendChild(fuss);
    o.appendChild(finder);

    let jetzt: Ordnung = ordnungLesen();

    /** Die neue Ordnung merken und auf JEDE Leiste der Seite legen. */
    const anwenden = (): void => {
      ordnungMerken(jetzt);
      document.querySelectorAll<HTMLElement>('.blatt-werk').forEach(ordnungAnwenden);
    };

    const namen = (art: 'werkzeuge' | 'gruppen', id: string): string =>
      art === 'werkzeuge'
        ? (WERKZEUGE.find(w => w.id === id)?.name || id)
        : (GRUPPEN.find(g => g.id === id)?.name || id);

    /** Eine Zeile um `schritt` Stellen verschieben. */
    const ruecken = (art: 'werkzeuge' | 'gruppen', id: string, schritt: number): void => {
      const liste = jetzt[art];
      const i = liste.indexOf(id);
      const ziel = i + schritt;
      if (i < 0 || ziel < 0 || ziel >= liste.length) return;
      liste.splice(i, 1);
      liste.splice(ziel, 0, id);
      anwenden();
      malen();
      sagen.textContent = namen(art, id) + ' steht jetzt an Stelle ' + (ziel + 1)
        + ' von ' + liste.length + '.';
      /* DER FOKUS WANDERT MIT. Ohne das springt er beim Neuzeichnen an den
         Anfang, und wer zweimal „runter" drücken will, muss sich neu
         hinklicken — die Taste wäre unbrauchbar (§38). */
      koerper.querySelector<HTMLElement>(
        `[data-art="${art}"][data-id="${id}"] [data-ruecken="${schritt > 0 ? 'runter' : 'hoch'}"]`
      )?.focus();
    };

    /* ── Ziehen (E570). Kein HTML5-Drag: das gibt es auf einem
       Berührungsbildschirm nicht. Zeigerereignisse gibt es überall. */
    let zieht: { art: 'werkzeuge' | 'gruppen'; id: string } | null = null;
    const beiZug = (e: PointerEvent): void => {
      if (!zieht) return;
      const unter = document.elementFromPoint(e.clientX, e.clientY);
      const zeile = unter instanceof Element ? unter.closest<HTMLElement>('.blatt-ordnen-zeile') : null;
      if (!zeile || zeile.dataset.art !== zieht.art) return;
      const ueber = String(zeile.dataset.id || '');
      if (!ueber || ueber === zieht.id) return;
      const liste = jetzt[zieht.art];
      const von = liste.indexOf(zieht.id);
      const nach = liste.indexOf(ueber);
      if (von < 0 || nach < 0) return;
      liste.splice(von, 1);
      liste.splice(nach, 0, zieht.id);
      anwenden();
      malen();
    };
    const zugEnde = (): void => {
      if (!zieht) return;
      sagen.textContent = namen(zieht.art, zieht.id) + ' abgelegt.';
      zieht = null;
      koerper.querySelectorAll('.blatt-ordnen-zeile.zieht').forEach(z => z.classList.remove('zieht'));
      window.removeEventListener('pointermove', beiZug);
      window.removeEventListener('pointerup', zugEnde);
      window.removeEventListener('pointercancel', zugEnde);
    };

    const malen = (): void => {
      koerper.textContent = '';
      const bloecke: Array<['werkzeuge' | 'gruppen', string, string]> = [
        ['werkzeuge', 'Werkzeuge', 'Die Reihe oben in der Leiste.'],
        ['gruppen', 'Zubehör', 'Was unter dem gewählten Werkzeug steht — je Gruppe, nicht je Knopf.']
      ];
      for (const [art, titel, hinweis] of bloecke) {
        const block = document.createElement('section');
        block.className = 'blatt-ordnen-block';
        const h = document.createElement('h3');
        h.textContent = titel;
        const p = document.createElement('p');
        p.textContent = hinweis;
        block.append(h, p);
        const liste = document.createElement('ul');
        liste.className = 'blatt-ordnen-liste';
        jetzt[art].forEach((id, i, alle) => {
          const zeile = document.createElement('li');
          zeile.className = 'blatt-ordnen-zeile';
          zeile.dataset.art = art;
          zeile.dataset.id = id;
          const nr = document.createElement('i');
          nr.className = 'blatt-ordnen-nr';
          nr.textContent = String(i + 1);
          const wort = document.createElement('b');
          wort.textContent = namen(art, id);
          const hoch = document.createElement('button');
          hoch.type = 'button';
          hoch.className = 'blatt-ordnen-pfeil';
          hoch.dataset.ruecken = 'hoch';
          hoch.textContent = '↑';
          hoch.disabled = i === 0;
          hoch.setAttribute('aria-label', namen(art, id) + ' nach vorn');
          const runter = document.createElement('button');
          runter.type = 'button';
          runter.className = 'blatt-ordnen-pfeil';
          runter.dataset.ruecken = 'runter';
          runter.textContent = '↓';
          runter.disabled = i === alle.length - 1;
          runter.setAttribute('aria-label', namen(art, id) + ' nach hinten');
          zeile.append(nr, wort, hoch, runter);
          liste.appendChild(zeile);
        });
        block.appendChild(liste);
        koerper.appendChild(block);
      }
    };
    malen();

    koerper.addEventListener('pointerdown', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel || ziel.closest('.blatt-ordnen-pfeil')) return;
      const zeile = ziel.closest<HTMLElement>('.blatt-ordnen-zeile');
      if (!zeile) return;
      zieht = { art: (zeile.dataset.art as 'werkzeuge' | 'gruppen'), id: String(zeile.dataset.id || '') };
      zeile.classList.add('zieht');
      window.addEventListener('pointermove', beiZug);
      window.addEventListener('pointerup', zugEnde);
      window.addEventListener('pointercancel', zugEnde);
    });

    koerper.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      const pfeil = ziel?.closest<HTMLElement>('.blatt-ordnen-pfeil');
      if (!pfeil) return;
      const zeile = pfeil.closest<HTMLElement>('.blatt-ordnen-zeile');
      if (!zeile) return;
      ruecken(zeile.dataset.art as 'werkzeuge' | 'gruppen', String(zeile.dataset.id || ''),
        pfeil.dataset.ruecken === 'runter' ? 1 : -1);
    });

    zurueck.addEventListener('click', () => {
      ordnungVergessen();
      jetzt = ordnungLesen();
      document.querySelectorAll<HTMLElement>('.blatt-werk').forEach(ordnungAnwenden);
      malen();
      sagen.textContent = 'Die ursprüngliche Reihenfolge steht wieder.';
    });

    const schliessen = (): void => {
      zugEnde();
      o.remove();
      document.removeEventListener('keydown', beiTaste);
      fertig();
    };
    const beiTaste = (e: KeyboardEvent): void => { if (e.key === 'Escape') schliessen(); };
    okay.addEventListener('click', schliessen);
    o.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel || ziel === o || ziel.closest('[data-a="zu"]')) schliessen();
    });
    document.addEventListener('keydown', beiTaste);
    document.body.appendChild(o);
    okay.focus();
  });

  const leiste = (controls: any, extra = ''): HTMLElement => {
    /* WELCHE FORM DER FORMEN-KNOPF FÜHRT (E375). Das ist Zustand der
       LEISTE, nicht der Fläche: die Fläche kennt nur `line` oder
       `rectangle` und weiss nichts davon, dass beide unter einem Knopf
       stehen. Gemerkt wird er in `meta`, damit er den Neustart überlebt —
       wer immer Pfeile zeichnet, will nicht jedes Mal die Linie wegklicken. */
    let formArt: string = formArtLesen();
    /* DIE FLÄCHE MELDET SICH IM KERN AN (E212).

       Bis hierher wusste nur diese Leiste, welche Fläche sie steuert. Der
       Reiter „Zeichnen" im Menüband konnte deshalb nichts — er hätte nicht
       gewusst, worauf er wirkt (L64).

       `Zeichenziel` im Kern hält jetzt den Zeiger. Diese Datei gibt ihn
       ab und behält alles andere: kein Strich, keine Farbe, keine Marke
       wandert dorthin. Wo die Zeichenlogik an zwei Stellen stünde, liefe
       die zweite irgendwann von der ersten weg. */
    if (typeof Zeichenziel !== 'undefined') {
      try {
        Zeichenziel.melde(controls, 'Zeichenfläche');
        /* WELCHE FARBE UND WELCHE STÄRKE STEHEN GERADE AN.
           Die Leiste malt sie sich gleich selbst mit `.on` an (siehe
           `index === 0` bzw. `index === 1` unten). Sagt sie es dem Kern
           nicht, zeigt das Menüband fünf Farbknöpfe und markiert keinen —
           obwohl hier einer markiert ist. Zwei Anzeigen, ein Zustand. */
        Zeichenziel.uebernehmeFarbe(controls, FARBEN[0]);
        Zeichenziel.uebernehmeStrich(controls, BREITEN[1]);
      } catch { /* ohne Kern geht es wie bisher */ }
    }

    const row = document.createElement('div');
    row.className = 'blatt-reihe';
    /* Der gemerkte Platz gilt sofort, nicht erst nach dem ersten Klick —
       derselbe Fund wie bei der Adernreihe in E509 (§55). */
    row.dataset.lage = lageJetzt();
    /* Und wenn sie frei steht, auch WO (E620). Ohne diese zwei Zeilen
       stünde sie nach dem Neuladen wieder in der Mitte — der gemerkte
       Platz wäre dann nur ein halber. */
    if (row.dataset.lage === 'frei') {
      const punkt = freiJetzt();
      row.style.setProperty('--leiste-x', punkt.x);
      row.style.setProperty('--leiste-y', punkt.y);
    }
    /* Der Platz im Baum gilt erst, wenn die Hülle steht — `seite.ts` hängt
       die Leiste nach diesem Aufruf ein. Ein Mikroauftrag läuft nach dem
       ganzen Aufbau und sieht die fertige Hülle. */
    queueMicrotask(() => { try { leisteEinordnen(row); } catch { /* ohne Hülle bleibt es, wie es ist */ } });
    const tools = document.createElement('div');
    tools.className = 'blatt-werk';
    tools.dataset.tool = 'schreiben';
    /* AM TELEFON ROLLT DIE LEISTE ZUM WERKZEUG (E356): die Gruppen stehen
       gleich dahinter, also ist mit einem Tipp alles im Bild, was zu ihm
       gehoert. Am Rechner rollt nichts — dort passt alles. */
    const zumWerkzeugRollen = (wz: string): void => {
      if (!window.matchMedia || !window.matchMedia('(max-width:760px)').matches) return;
      const knopf = tools.querySelector<HTMLElement>(`[data-wz="${wz}"]`);
      if (knopf) tools.scrollLeft = Math.max(0, knopf.offsetLeft - 6);
    };
    /* JEDER KNOPF SAGT SEINEN NAMEN UND SEINEN ZUSTAND (Audit F04).
       Zwei Fehler steckten hier, und beide sah man nicht:

       1. Das Zeichen stand als sichtbarer Text IM Knopf. Am Telefon und in
          der Spalte blendet das CSS `.wort` aus — dann blieb als
          zugänglicher Name genau das Zeichen übrig, und der Knopf hiess
          „✎" oder „⌖". `title` half nicht: es zählt nur, wenn sonst gar
          kein Name da ist. Jetzt trägt das Zeichen `aria-hidden` und das
          Wort bleibt lesbar, auch wenn es unsichtbar ist (`.wort` ist
          nicht mehr `display:none`, sondern weggeklemmt).

       2. Welches Werkzeug GILT, stand nur in einer CSS-Klasse. Eine Klasse
          ist für ein Vorleseprogramm nicht da. `aria-pressed` sagt es. */
    /* ══ GEZEICHNETE ZEICHEN STATT EMOJI (E515) ═══════════════════════════
       Redur, 9. September, mit einem Ausschnitt der GoodNotes-Leiste:
       „nehme die Symbole für die Redion bitte 1:1."

       Die Leiste trug ✎ ⌖ 🖍 ▰ □ ▬ 🗒 T ⚡ ⭐ 🖼 ⌫ ⦿ — dreizehn Zeichen aus
       fünf verschiedenen Welten. `register/symbole.ts` beschreibt seit
       jeher, warum das nicht geht: Emoji sind Bilder, keine Zeichen. Sie
       tragen eigene Farbe und eigene Strichstärke, sie sehen auf jedem
       System anders aus, und sie sitzen nicht auf einer Linie.

       Jetzt kommt jedes aus demselben Register wie der Rest der Schale:
       24 × 24, Striche in der Farbe der Zeile, überall dieselbe Stärke.

       DAS EMOJI BLEIBT ALS RÜCKFALL. `artZeichen` braucht ein TEXTzeichen —
       in der Sperrliste, im Inspector, in einer Meldung —, und dort ist ein
       SVG keine Antwort. Deshalb trägt jedes Werkzeug beides (§8: EINE
       Liste, zwei Ansichten davon). */
    const button = (tool: string) => {
      const w = WERKZEUGE.find(x => x.id === tool)!;
      const sym = (w as any).sym as string | undefined;
      const bild = sym
        ? `<span class="zeichen" data-sym="${sym}" aria-hidden="true"></span>`
        : `<span class="zeichen" aria-hidden="true">${w.zeichen}</span>`;
      return `<button data-wz="${w.id}"${w.id === 'schreiben' ? ' class="on"' : ''} ` +
        `aria-pressed="${w.id === 'schreiben' ? 'true' : 'false'}" title="${w.titel}">` +
        bild + `<span class="wort">${w.name}</span></button>`;
    };
    /* ══ DIE TAFEL ALS BEHÄLTER (E614, W2) ════════════════════════════════
       Zwischen `.blatt-werk` und ihre Kinder schiebt sich EINE Ebene:
       `.blatt-tafel`. Sie nimmt ALLE Kinder auf — Werkzeuge, Trenner,
       Zeilenbruch und Zubehör —, nicht nur die `[data-gruppe]`-Knoten.

       WARUM ALLE UND NICHT NUR DIE GRUPPEN. Drei Mechanismen der Leiste
       wirken ausschliesslich zwischen unmittelbaren Geschwistern, und jeder
       einzelne risse, wenn die Grenze mitten hindurchginge:

         · `.blatt-zeilenbruch + span.blatt-trenn` (bausteine.css) — der
           doppelte Trennstrich am Zeilenanfang, der Fund aus E568;
         · `button:hover + button` (pdf-studio.css) — Redurs Dock-Welle;
         · `insertBefore(knopf, bruch)` in `ordnungAnwenden` — zwei
           Elternteile, und der Aufruf würfe.

       WARUM SIE `display:contents` TRÄGT. Die drei Layoutmechanismen sind
       Flex-KIND-Eigenschaften: `flex:1 0 100%` am Zeilenbruch (E359),
       `order` für das Telefon (E356/E570), `position:sticky` an Zurück/Vor.
       Alle drei wirken nur zwischen direkten Flex-Geschwistern. Mit
       `display:contents` entsteht kein Kasten, die Kinder bleiben Flex-
       Elemente von `.blatt-werk`, und am Bildschirm ändert sich nichts —
       genau die Zusage dieses Bogens. Einen eigenen Kasten bekommt die
       Tafel erst mit W4, wenn sie wirklich eine Tafel wird.

       WAS SIE NICHT TRÄGT: kein `data-gruppe` und kein `data-wz`. Drei
       `closest('[data-wz],[data-gruppe]')` in dieser Datei träfen sonst die
       Tafel statt den Knopf, den der Finger meint. */
    const tafel = document.createElement('div');
    tafel.className = 'blatt-tafel';
    tools.appendChild(tafel);
    tafel.innerHTML =
      button('schreiben') +
      button('select') +
      button('stift') +
      button('marker') +
      /* VIER WERKZEUGE WURDEN EINES (E375, L115 Punkt 9, Rest).
         Linie, Pfeil, Rechteck und Ellipse standen als vier Knöpfe
         nebeneinander — vierzehn Werkzeuge in einer Leiste, die am Telefon
         rollen muss. GoodNotes hat dafür EINEN Knopf; welche Form es wird,
         steht im Zubehör darunter, wo auch Farbe und Strichstärke stehen.
         Der Knopf trägt das Zeichen der zuletzt gewählten Form, damit man
         ihn wiedererkennt, ohne ihn zu öffnen. */
      (() => {
        const jetzt = FORMEN.find(f => f.id === formArt) || FORMEN[0]!;
        /* HIER BLEIBT DAS FORMZEICHEN (E515): der Knopf zeigt nicht „Formen",
           sondern WELCHE Form gerade gewählt ist — ein Dreieck, ein Pfeil,
           eine Kurve. Ein gemeinsames Werkzeugzeichen nähme genau die
           Auskunft weg, für die dieser Knopf da ist. */
        return `<button data-wz="formen" data-form="${jetzt.id}" ` +
          `title="${jetzt.titel} — die Form wählst du darunter">` +
          `<span class="zeichen" data-sym="${(jetzt as any).sym || 'inkShapes'}" aria-hidden="true"></span>` +
          '<span class="wort">Form</span></button>';
      })() +
      button('abdeck') +
      button('zettel') +
      button('text') +
      /* „TEXT ÄNDERN" STEHT NEBEN „TEXT" (E670/E671), und dass es hier von
         Hand stehen MUSS, ist der Fund des vollen Laufs vom 21. September:
         diese Leiste wird aufgezählt, nicht aus `WERKZEUGE` gebaut. Das
         Studio-Band daneben baut sie aus dem Katalog — also hatte das neue
         Werkzeug dort einen Knopf und hier keinen, zwei Tage lang
         unbemerkt. `test523` hat es gehalten: „13 statt 14, textfix fehlt".

         Warum die Aufzählung trotzdem bleibt: der Formen-Knopf ist kein
         `button(…)`, sondern trägt das Zeichen der zuletzt gewählten Form
         (E515). Eine Schleife über den Katalog müsste ihn als Sonderfall
         kennen — und dann wäre die Schleife die Aufzählung mit Umweg. */
      button('textfix') +
      button('zeichen') +
      /* DIE ELEMENTE (E494): steht neben dem Fachzeichen, weil es dieselbe
         Bewegung ist — ein Tipp setzt etwas Fertiges. Nachgemessen passt der
         zwoelfte Knopf: bei 1360 px Fenster belegen die Werkzeuge 437 px von
         596, mit Woertern bei 1600 px 919 von 1184 — eine Zeile bleibt eine. */
      button('elemente') +
      /* DAS BILD (E357): kein Werkzeug, das man haelt, sondern ein Weg —
         ein Tipp oeffnet den Waehler, danach fuehrt die Auswahl. */
      button('bild') +
      button('radierer') +
      /* DER LASERPOINTER (E512): er steht am ENDE der Werkzeuge, weil er
         als einziger nichts hinterlässt — wer die Leiste von links liest,
         geht von „schreibt viel" zu „schreibt nichts". */
      button('laser') +
      /* DER ZEILENBRUCH (E359): am Rechner stehen die Werkzeuge in einer
         Zeile und ihr Zubehoer darunter; dieses leere Element mit voller
         Breite ist der Umbruch. Am Telefon und in der Spalte blendet das
         CSS es aus — dort rollt die Leiste in einer Zeile. */
      '<span class="blatt-zeilenbruch" aria-hidden="true"></span>' +
      /* DER RADIERER (E352): ein Knopf, der durch Ganz, Teil und Marker
         wechselt und sagt, was der Radierer gerade tut. */
      (() => {
        const jetzt = RADIERER.find(r => r.id === (controls.radierModusVon ? controls.radierModusVon() : RADIER_VORGABE)) || RADIERER[0];
        return `<button data-act="radiermodus" data-gruppe="radierer" data-modus="${jetzt.id}" title="${jetzt.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}">` +
          `<span class="zeichen" data-sym="${(jetzt as any).sym}" aria-hidden="true"></span>` +
          `<span class="wort">${jetzt.name}</span></button>`;
      })() +
      /* ══ DIE DREI GRÖSSEN, AUF BEIDEN OBERFLÄCHEN (E624) ══════════════════
         Sie standen seit E576 im Studio und NUR dort: gebaut im Hörer auf
         `ink-studio-ready`, den allein `document-mode.ts` auslöst. Gezählt
         am 19. September: drei im Studio, null auf der gewöhnlichen Seite.
         Wer auf einer Seite zeichnet, hatte einen Radierer ohne Grösse.

         Jetzt stehen sie hier, wo die Leiste ohnehin gebaut wird — ein
         Katalog, eine Stelle (§8). Das Studio nimmt dieselben Knöpfe; sein
         Hörer legt nur noch das Modusfeld daneben.

         Die drei Kreisgrössen 14/22/30 sind nachgemessen (E576): bei 44 px
         Knopf blieb für 40 kein Platz, und der Browser schrumpfte ihn auf
         dieselben 28 wie den mittleren — zwei gleich grosse Kreise sind
         keine zwei Grössen. */
      (() => {
        const gemerkt = radierGroesseLesen();
        const auto = radierAutoLesen();
        const namen = ['klein', 'mittel', 'groß'];
        const kreise = [14, 22, 30];
        return RADIER_GROESSEN.map((radius, i) =>
          `<button type="button" class="blatt-eraser-size" data-gruppe="radierer" ` +
          `data-eraser-size="${radius}" style="--eraser-preview:${kreise[i]}px" ` +
          `aria-pressed="${!auto && radius === gemerkt ? 'true' : 'false'}" ` +
          `title="Radierer ${namen[i]}" aria-label="Radierer ${namen[i]}">` +
          `<i aria-hidden="true"></i></button>`).join('') +
          /* DER HAKEN (E624). Kein `<input type="checkbox">`: in
             `src/bereiche/pdf/` gibt es null davon, und ein fremdes
             Bedienteil mitten in einer Reihe aus Knöpfen sieht aus wie ein
             Fehler. Ein Knopf mit `aria-pressed` sagt dasselbe (§38). */
          `<button type="button" data-act="radierauto" data-gruppe="radierer" ` +
          `aria-pressed="${auto ? 'true' : 'false'}"${auto ? ' class="on"' : ''} ` +
          `title="Automatisch an den Strich anpassen — der Radierer nimmt die Breite des Strichs, den er trifft" ` +
          `aria-label="Radierergrösse automatisch an den Strich anpassen">` +
          `<span class="zeichen" data-sym="eraserAuto" aria-hidden="true"></span>` +
          `<span class="wort">Automatisch</span></button>`;
      })() +
      /* JEDER KNOPF KENNT SEINE GRUPPE (E356): am Telefon zeigt die Leiste
         nur die Gruppen des gewaehlten Werkzeugs — Farben und Breiten beim
         Stift, den Modus beim Radierer, Kopieren und Loeschen bei der
         Auswahl. Das CSS liest `data-gruppe` gegen `data-tool` der Leiste. */
      '<span class="blatt-trenn" data-gruppe="verlauf"></span>' +
      '<button data-act="undo" data-gruppe="verlauf" title="Rückgängig" disabled><span class="zeichen" data-sym="undo" aria-hidden="true"></span><span class="wort">Zurück</span></button>' +
      '<button data-act="redo" data-gruppe="verlauf" title="Wiederholen" disabled><span class="zeichen" data-sym="redo" aria-hidden="true"></span><span class="wort">Vor</span></button>' +
      /* DER PLATZ DER LEISTE (E512) — bei „Zurück" und „Vor", weil beide
         zu JEDEM Werkzeug gehören und darum immer stehen. */
      (() => {
        const jetzt = LAGEN.find(l => l.id === lageJetzt()) || LAGEN[0];
        const naechst = LAGEN[(LAGEN.findIndex(l => l.id === jetzt.id) + 1) % LAGEN.length]!;
        return `<button data-act="lage" data-gruppe="verlauf" data-lage="${jetzt.id}" ` +
          `title="Leiste verschieben — jetzt ${jetzt.name}, als Nächstes ${naechst.name}" ` +
          `aria-label="Leiste verschieben, jetzt ${jetzt.name}">` +
          `<span class="zeichen" data-sym="${jetzt.sym}" aria-hidden="true"></span>` +
          `<span class="wort">Platz</span></button>`;
      })() +
      /* EIN STRICH VOR JEDER GRUPPE (E568): am Rechner steht das Zubehör
         untereinander, und ohne Trenner ist es eine Mauer aus gleichen
         Knöpfen. Der Strich trägt `data-gruppe` wie die Knöpfe dahinter —
         er kommt und geht also mit ihnen. Am Telefon bleibt er aus. */
      '<span class="blatt-trenn" data-gruppe="auswahl"></span>' +
      /* ══ DIE LEISTE EINRICHTEN (E570) ═══════════════════════════════════
         Redur, 14. September: „Könntest du so machen, dass ich alles, was
         dort ist im Redion, direkt selber ordnen kann?"

         DER KNOPF STEHT BEI „PLATZ", weil beide dasselbe betreffen: nicht
         das Zeichnen, sondern die Leiste selbst. Wer den einen sucht,
         findet den anderen. */
      '<button data-act="einrichten" data-gruppe="verlauf" ' +
      'title="Leiste einrichten — die Reihenfolge der Werkzeuge und ihres Zubehörs selbst bestimmen">' +
      '<span class="zeichen" data-sym="ordnen" aria-hidden="true"></span>' +
      '<span class="wort">Einrichten</span></button>' +
      '<button data-act="delete" data-gruppe="auswahl" title="Auswahl löschen" disabled><span class="zeichen" data-sym="trash" aria-hidden="true"></span><span class="wort">Löschen</span></button>' +
      /* KOPIEREN UND EINSETZEN (E353) — auch ohne Tastatur, am Telefon. */
      '<button data-act="copy" data-gruppe="auswahl" title="Auswahl kopieren (Strg+C)" disabled><span class="zeichen" data-sym="copy" aria-hidden="true"></span><span class="wort">Kopieren</span></button>' +
      '<button data-act="paste" data-gruppe="auswahl" title="Kopiertes einsetzen (Strg+V)" disabled><span class="zeichen" data-sym="clipboard" aria-hidden="true"></span><span class="wort">Einsetzen</span></button>' +
      /* AUSWAHL WIE GOODNOTES (E466): Ausschneiden, nach vorn, nach hinten,
         Sperren — alles an der Auswahl, alles ein Schritt im Verlauf. */
      '<button data-act="cut" data-gruppe="auswahl" title="Auswahl ausschneiden (Strg+X)" disabled><span class="zeichen" data-sym="scissors" aria-hidden="true"></span><span class="wort">Ausschneiden</span></button>' +
      '<button data-act="vor" data-gruppe="auswahl" title="Auswahl nach vorn — über alles andere" disabled><span class="zeichen" data-sym="layerUp" aria-hidden="true"></span><span class="wort">Nach vorn</span></button>' +
      '<button data-act="hinten" data-gruppe="auswahl" title="Auswahl nach hinten — unter alles andere" disabled><span class="zeichen" data-sym="layerDown" aria-hidden="true"></span><span class="wort">Nach hinten</span></button>' +
      '<button data-act="sperren" data-gruppe="auswahl" aria-pressed="false" title="Auswahl sperren: nicht mehr schieben, ziehen, drehen, löschen oder radieren" disabled><span class="zeichen" data-sym="lock" aria-hidden="true"></span><span class="wort">Sperren</span></button>' +
      /* EIN VERWEIS (E468): der Auswahl eine Adresse oder eine Seite geben. */
      '<button data-act="verweis" data-gruppe="auswahl" title="Der Auswahl einen Verweis geben: eine Adresse (https://…) oder eine Seite ([[Name]]) — im Lesemodus antippen" disabled><span class="zeichen" data-sym="link" aria-hidden="true"></span><span class="wort">Verweis</span></button>' +
      /* ALS ELEMENT SICHERN (E494): der einzige Weg IN die Bibliothek. Er
         steht bei der Auswahl, weil ein Element eine Auswahl ist. */
      '<button data-act="element-sichern" data-gruppe="auswahl" title="Die Auswahl als Element sichern — danach mit dem Werkzeug «Elemente» auf jede Seite setzen" disabled><span class="zeichen" data-sym="star" aria-hidden="true"></span><span class="wort">Als Element</span></button>' +
      /* DAS ZUBEHÖR DER ELEMENTE: ein Knopf, der die Bibliothek öffnet und
         sagt, welches Element der nächste Tipp setzt. */
      '<button data-act="elemente" data-gruppe="elemente" title="Elemente-Bibliothek öffnen und wählen, was der nächste Tipp setzt"><span class="zeichen" data-sym="star" aria-hidden="true"></span><span class="wort">Elemente</span></button>' +
      /* Das Lineal ist ein SCHALTER neben den Werkzeugen: solange es
         anliegt, rasten Linie und Pfeil auf 15°-Schritte (E267). */
      '<span class="blatt-trenn" data-gruppe="lineal"></span>' +
      '<button data-act="lineal" data-gruppe="lineal" aria-pressed="false" ' +
      'title="Lineal: Linie und Pfeil rasten auf 15°-Schritte">' +
      '<span class="zeichen" data-sym="inkRuler" aria-hidden="true"></span><span class="wort">Lineal</span></button>' +
      /* FORMEN (E355): ein Schalter wie das Lineal — an, und ein gehaltener
         Strich wird zur Linie, zum Kreis, zum Rechteck. */
      '<span class="blatt-trenn" data-gruppe="formen"></span>' +
      `<button data-act="formen" data-gruppe="formen" aria-pressed="${controls.formenAn ? (controls.formenAn() ? 'true' : 'false') : 'true'}"` +
      `${controls.formenAn && controls.formenAn() ? ' class="on"' : ''} ` +
      'title="Formen erkennen: einen Kreis, ein Rechteck oder eine Linie ziehen und am Ende kurz halten">' +
      '<span class="zeichen" data-sym="shapeSnap" aria-hidden="true"></span><span class="wort">Formen</span></button>' +
      /* KRITZELN LOESCHT (E466): ein Schalter wie „Formen" — an, und ein
         dichtes Hin-und-her ueber einem Strich nimmt ihn weg. */
      `<button data-act="kritzel" data-gruppe="formen" aria-pressed="${controls.kritzelAn ? (controls.kritzelAn() ? 'true' : 'false') : 'true'}"` +
      `${controls.kritzelAn && controls.kritzelAn() ? ' class="on"' : ''} ` +
      'title="Kritzeln löscht: dicht über einen Strich hin und her fahren, und er ist weg">' +
      '<span class="zeichen" data-sym="scribble" aria-hidden="true"></span><span class="wort">Kritzeln</span></button>' +
      /* DIE SCHRIFT (E360): Familie, Groesse, Fett, Rahmen — beim Text und
         bei der Auswahl; wirkt auf Gewaehltes und auf den naechsten Text. */
      '<span class="blatt-trenn" data-gruppe="schrift"></span>' +
      (() => {
        const s = (controls.schriftVon ? controls.schriftVon() : SCHRIFT_VORGABE) as Schrift;
        const fam = SCHRIFTEN.find(x => x.id === s.familie) || SCHRIFTEN[0]!;
        return `<button data-act="schriftart" data-gruppe="schrift" data-schrift="${fam.id}" ` +
          `title="Schriftart: ${fam.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}">` +
          `<span class="zeichen" aria-hidden="true" style="font-family:${fam.stapel}">Aa</span><span class="wort">${fam.name}</span></button>` +
          '<button data-act="kleiner" data-gruppe="schrift" title="Schrift kleiner">' +
          '<span class="zeichen" aria-hidden="true">A−</span><span class="wort">Kleiner</span></button>' +
          `<button data-act="groesser" data-gruppe="schrift" title="Schrift grösser (jetzt ${s.groesse} px)">` +
          '<span class="zeichen" aria-hidden="true">A+</span><span class="wort">Grösser</span></button>' +
          `<button data-act="fett" data-gruppe="schrift" aria-pressed="${s.fett ? 'true' : 'false'}"${s.fett ? ' class="on"' : ''} title="Fett">` +
          '<span class="zeichen" aria-hidden="true">F</span><span class="wort">Fett</span></button>' +
          `<button data-act="rahmen" data-gruppe="schrift" aria-pressed="${s.rahmen ? 'true' : 'false'}"${s.rahmen ? ' class="on"' : ''} title="Rahmen um den Text">` +
          '<span class="zeichen" aria-hidden="true">▭</span><span class="wort">Rahmen</span></button>' +
          /* DIE AUSRICHTUNG (E560): EIN Knopf, der weiterschaltet — wie die
             Schriftart daneben. Drei Knöpfe nebeneinander wären am Telefon
             die drei, die die Leiste aus dem Bild schieben (§37). */
          (() => { const a2 = AUSRICHTUNGEN.find(x => x.id === s.ausricht) || AUSRICHTUNGEN[0];
            return `<button data-act="ausricht" data-gruppe="schrift" data-ausricht="${a2.id}" ` +
              `title="Ausrichtung: ${a2.name} — antippen wechselt: ${AUSRICHTUNGEN.map(x => x.name).join(' → ')}">` +
              `<span class="zeichen" data-sym="${a2.sym}" aria-hidden="true"></span>` +
              `<span class="wort">${a2.name}</span></button>`; })();
      })() +
      /* ══ DIE STIFTREIHE (E512) ═══════════════════════════════════════════
         Redur, 8. September, mit vier Bildern aus GoodNotes: „die
         Fachzeichen-Stift kommt, wenn ich die Stift klicke — sollte neben
         es, also links unten, wo die Farben dort sind, mir zeigen, welche
         Stift ich will."

         BIS HIERHER WAR ES EIN WECHSELKNOPF (E351): ein Tipp, der nächste
         Stift. Sechs Stifte heissen bis zu fünf Tipps für den letzten, und
         welche es überhaupt gibt, stand nur im Titel — man musste es
         wissen. Jetzt steht die Reihe da, wie in GoodNotes, unmittelbar
         links vor den Farben.

         DER WECHSEL IST NICHT WEG. Wer `P` drückt, während der Stift schon
         führt, geht weiter zum nächsten — dieselbe Bewegung wie vorher,
         nur ohne eigenen Knopf. Das steht bei den Tasten (`TASTEN`) und
         in `register/tasten.ts`. */
      '<span class="blatt-trenn" data-gruppe="stil"></span>' +
      (() => {
        /* WELCHER STIFT SCHON BEIM BAUEN FÜHRT. Ohne das stünde die Reihe
           beim Öffnen ohne Markierung da, bis jemand etwas anfasst — der
           gleiche Fund wie bei der Adernreihe in E509, nur eine Ebene
           früher. `test343 §4` hält es fest. */
        const jetzt = (controls.stilVon ? controls.stilVon() : STIL_VORGABE) as string;
        return STIFTE.map(st => `<button data-act="stilwahl" data-gruppe="stil" data-stil="${st.id}"` +
          (st.id === jetzt ? ' class="on"' : '') +
          ` aria-pressed="${st.id === jetzt ? 'true' : 'false'}"` +
          ` title="${st.name}" aria-label="Stift ${st.name}">` +
          `<span class="zeichen" data-sym="${(st as any).sym}" aria-hidden="true"></span>` +
          `<span class="wort">${st.name}</span></button>`).join('');
      })() +
      /* DAS ZUBEHÖR ZUM FORMEN-WERKZEUG (E375). Es steht in derselben
         Zeile wie Farbe und Breite und erscheint nach der Gruppenregel aus
         E356 nur, wenn eine Form gewählt ist. */
      '<span class="blatt-trenn" data-gruppe="form"></span>' +
      FORMEN.map(f => `<button data-act="formart" data-gruppe="form" data-form="${f.id}"` +
        (f.id === formArt ? ' class="on"' : '') + ` aria-pressed="${f.id === formArt ? 'true' : 'false'}"` +
        ` title="${f.titel}"><span class="zeichen" data-sym="${(f as any).sym || 'inkShapes'}" aria-hidden="true"></span>` +
        `<span class="wort">${f.name}</span></button>`).join('') +
      /* ══ DIE ZWEI ARTEN DES LASERS (E512) ═══════════════════════════════
         Wie in GoodNotes: ein Punkt oder eine Spur. Sie stehen in der
         Gruppe `laser` und erscheinen nach der Regel aus E356 nur, wenn
         der Laserpointer geführt wird. */
      '<span class="blatt-trenn" data-gruppe="laser"></span>' +
      LASER.map(l => `<button data-act="laserart" data-gruppe="laser" data-laser="${l.id}"` +
        (l.id === laserArt() ? ' class="on"' : '') +
        ` aria-pressed="${l.id === laserArt() ? 'true' : 'false'}" title="${l.titel}">` +
        `<span class="zeichen" aria-hidden="true">${l.zeichen}</span>` +
        `<span class="wort">${l.name}</span></button>`).join('') +
      '<span class="blatt-trenn" data-gruppe="farbe"></span>' +
      /* JEDE FARBE BEIM NAMEN (E509). Hier stand fünfmal `title="Farbe"` —
         beim Überfahren also fünfmal dasselbe Wort, und ein Vorleser las
         fünfmal „Farbe". Redur hat den Namen für die Adern verlangt; für
         diese fünf gilt derselbe Satz (§38). */
      FARBEN.map((value, index) => `<button class="blatt-farbe${index === 0 ? ' on' : ''}" data-gruppe="farbe" ` +
        `data-c="${value}" style="background:${value}" ` +
        `title="${FARBNAMEN[value] || value}" aria-label="Farbe ${FARBNAMEN[value] || value}"></button>`).join('') +
      /* EIGENE FARBEN (E351): die zuletzt gewaehlten stehen als Tupfer da,
         dahinter der Weg zum Farbwaehler des Browsers. */
      eigeneFarben().map(value => `<button class="blatt-farbe blatt-farbe-eigen" data-gruppe="farbe" ` +
        `data-c="${value}" style="background:${value}" title="Eigene Farbe ${value}"></button>`).join('') +
      /* DAS „+" IST DIE TÜR ZU ALLEM, WAS FARBE IST (E486).

         Zuerst stand hier ein ZWEITER Knopf für die Farbsätze. Nachgemessen
         bei 1360 px Fenster (die Leiste ist dann 596 px breit): die
         Zubehörzeile fasst genau vierzehn Knöpfe und war mit vierzehn voll —
         der fünfzehnte kippte sie in eine dritte Zeile, gegen E359 und
         `test351`. Auch schmaler ging es nicht: vierzehn Knöpfe und ihre
         Abstände füllen die 580 px vollständig aus.

         Der Weg heraus ist der, den GoodNotes ohnehin geht: dort führt EIN
         Farbknopf in ein Feld, in dem sowohl der Farbwähler als auch die
         Paletten stehen. Seit E697 öffnet „+“ direkt die Palette samt
         Hex-Feld; die Verwaltung der Farbsätze liegt darin. Die festen
         und eigenen Tupfer bleiben ohne zusätzlichen Tipp erreichbar. */
      '<button class="blatt-farbe-neu" data-act="farbe" data-gruppe="farbe" ' +
      'title="Farben — eine eigene wählen oder Farbsätze sichern, laden, zurücksetzen" ' +
      'aria-label="Farben: eigene Farbe wählen oder Farbsätze">+</button>' +
      '<span class="blatt-trenn" data-gruppe="breite"></span>' +
      /* Doppelter Massstab wie im Menüband: mit der wahren Stärke sahen
         „dünn" (1,2 pt) und „mittel" (2,4 pt) gleich aus, weil der Boden
         von 2 px den ersten hochzog. Das Verhältnis 1 : 2 : 4 bleibt.
         (Hier stand „px". Es sind PUNKTE — siehe `alsMm` oben, E616.) */
      BREITEN.map((value, index) => `<button class="blatt-strich${index === 1 ? ' on' : ''}" data-gruppe="breite" ` +
        `data-b="${value}" title="${BREITEN_NAMEN[index] ?? 'Strich'} · ${alsMm(value)} — die gewählte nochmal antippen: Stärke frei wählen" ` +
        `aria-label="Strichstärke ${BREITEN_NAMEN[index] ?? 'Strich'}, ${alsMm(value)}">` +
        `<i style="height:${Math.max(2, value * 2)}px"></i>` +
        /* DIE MILLIMETER ALS WORT (E618). Leer gebaut und von
           `staerkenBeschriften` gefüllt — der Wert hängt am Werkzeug (der
           Marker zieht das Vierfache, E616), und eine Zahl, die beim Bauen
           festgeschrieben wird, steht beim Marker falsch da.
           Sichtbar ist sie nur im Kasten; sonst geklemmt wie jedes andere
           Wort der Leiste, also weiterhin im Vorlesebaum (§38). */
        '<span class="wort"></span></button>').join('') +
      /* DIE FREIE STAERKE (E465), wie GoodNotes' Schieber: drei Stufen zum
         Antippen bleiben, der Regler dazwischen nimmt jeden Wert von 0,5
         bis 12. Sein Wert IST die Staerke — kein Zwischenzustand.
         ALS KLAPPE, NICHT IN DER ZEILE (E465 Nachtrag): GoodNotes zeigt den
         Regler erst, wenn man die gewaehlte Stufe ein zweites Mal antippt.
         So auch hier — in der Zeile brach er bei 596 px in eine dritte
         Reihe (test351, 132 px Leiste). Die Klasse `auf` oeffnet ihn. */
      '<label class="blatt-staerke" data-gruppe="breite" title="Strichstärke frei wählen">' +
      '<input type="range" min="0.5" max="12" step="0.1" value="' + BREITEN[1] + '" aria-label="Strichstärke">' +
      '<output aria-hidden="true">' + alsMm(BREITEN[1]) + '</output></label>';

    /* ══ WERKZEUGE IN DIE LEISTE, ZUBEHÖR IN DIE TAFEL (E618) ═════════════
       E614 hat ALLE Kinder in die Tafel gelegt — richtig für W2, wo sie nur
       eine Ebene ohne Kasten war. W4 braucht sie als KASTEN, und ein Kasten
       um die Werkzeuge herum wäre kein Zubehörfeld, sondern die ganze
       Leiste.

       GEBAUT WIRD WEITER IN EINER ZEICHENKETTE — sie ist die Reihenfolge
       des Katalogs (§8). Danach werden die zwei Sorten getrennt:
       Werkzeuge und Zeilenbruch wandern in die Leiste, das Zubehör bleibt.
       Umhängen statt zweimal bauen; dasselbe Prinzip wie `ordnungAnwenden`
       eine Zeile tiefer.

       DIE 51 KINDWÄHLER DER GRUPPEN BLEIBEN DAMIT UNBERÜHRT
       (`.blatt-tafel > [data-gruppe]`) — sie zeigen weiterhin auf die
       Tafel, weil das Zubehör darin bleibt. Nur die acht Regeln, die
       `[data-wz]` oder den Zeilenbruch nennen, ziehen mit. */
    tafel.querySelectorAll<HTMLElement>(':scope > [data-wz]')
      .forEach(knopf => tools.insertBefore(knopf, tafel));
    const bruchRaus = tafel.querySelector<HTMLElement>(':scope > .blatt-zeilenbruch');
    if (bruchRaus) tools.insertBefore(bruchRaus, tafel);

    /* ══ DIE EIGENE ORDNUNG LEGT SICH DARÜBER (E570) ═══════════════════════
       Die Zeilen oben bauen die Leiste in der Reihenfolge des Katalogs —
       das bleibt so, denn der Katalog ist die Wahrheit darüber, WAS es
       gibt. Wie es steht, ist eine zweite Frage, und sie wird hier
       beantwortet: die Knoten werden umgehängt, keiner neu gebaut.

       DAS MUSS VOR DEM ERSTEN BILD GESCHEHEN, nicht nach dem ersten Klick.
       Sonst steht die Leiste beim Öffnen in der Vorgabe und springt, sobald
       man etwas anfasst — derselbe Fund wie bei der Adernreihe (E509). */
    ordnungAnwenden(tools);
    /* WELCHES WERKZEUG GEFÜHRT WIRD, ÄNDERT SICH AN SIEBEN STELLEN in
       dieser Datei (`tools.dataset.tool = …`). Am Telefon hängt daran, wo
       die Gruppen einsortiert werden — `--platz`. Statt sieben Stellen zu
       erweitern und bei der achten daneben zu liegen, wird HIER zugehört:
       ein Beobachter auf genau diesem Attribut. Eine Stelle, die nicht
       vergessen werden kann. */
    try {
      new MutationObserver(() => {
        platzSetzen(tools);
        /* DIE MILLIMETER HÄNGEN AM WERKZEUG (E616): derselbe Stufenknopf
           heisst beim Stift „0,8 mm" und beim Marker „3,4 mm", weil der
           Marker viermal seine Zahl zieht. Hier zuzuhören ist dieselbe
           Entscheidung wie bei `platzSetzen` eine Zeile höher — eine
           Stelle statt sieben, die man vergessen kann. */
        try { staerkenBeschriften(); } catch { /* vor dem Aufbau */ }
      }).observe(tools, { attributes: true, attributeFilter: ['data-tool'] });
    } catch { /* ohne Beobachter bleibt die Vorgabe stehen */ }

    /* ══ IM BAND SELBST SCHIEBEN (E571) ═══════════════════════════════════
       Redur, 14. September: „kannst du so machen, dass ich direkt im
       Website ordnen kann — die Position mit der Maus schieben."

       E570 hat dafür eine Liste gebaut, und die Liste bleibt: sie ist der
       Weg für die Tastatur, und sie zeigt auch das Zubehör, das gerade
       nicht zu sehen ist (jedes Werkzeug zeigt nur seine eigenen Gruppen).
       Was hier dazukommt, ist das, was Redur gemeint hat: den Knopf
       anfassen und dorthin ziehen, wo er stehen soll — an Ort und Stelle,
       mit dem Ergebnis unter dem Finger.

       WAS SICH IM MODUS ÄNDERT
         · Ein Klick zeichnet nicht mehr, er greift. Der Klickabfänger
           weiter unten läuft im EINFANG (`capture`), also VOR dem
           gewöhnlichen — sonst hätte ein Zug auf den Radierer beim
           Loslassen das Werkzeug gewechselt.
         · Ein Zug auf ein Werkzeug schiebt das Werkzeug; ein Zug auf
           irgendeinen Zubehörknopf schiebt seine GANZE Gruppe. Sechs
           Stifte einzeln zu schieben wäre keine Bedienung, sondern eine
           Geduldsprobe — und die Reihenfolge innerhalb einer Gruppe ist
           keine Frage, die jemand hat.
         · Die Pfeiltasten tun dasselbe wie der Zug, für jeden, der nicht
           ziehen kann (§38). Escape beendet.

       VERSCHOBEN WIRD AUF EINE STELLE, NICHT GETAUSCHT. Ein Tausch lässt
       den Nachbarn springen und die Reihe unter dem Finger flackern; „an
       diese Stelle setzen" ist die Bewegung, die man meint. */
    let ordnenAn = false;
    let zug: { art: 'werkzeuge' | 'gruppen'; id: string } | null = null;

    /** Was unter dem Zeiger liegt — als Werkzeug oder als Gruppe. */
    const teilUnter = (x: number, y: number): { art: 'werkzeuge' | 'gruppen'; id: string } | null => {
      const knoten = document.elementFromPoint(x, y);
      const el = knoten instanceof Element
        ? knoten.closest<HTMLElement>('[data-wz],[data-gruppe]') : null;
      if (!el || !tools.contains(el)) return null;
      if (el.dataset.wz) return { art: 'werkzeuge', id: el.dataset.wz };
      if (el.dataset.gruppe) return { art: 'gruppen', id: el.dataset.gruppe };
      return null;
    };

    /** `id` an die Stelle von `zielId` setzen und überall anwenden. */
    const setzeAn = (art: 'werkzeuge' | 'gruppen', id: string, zielId: string): boolean => {
      const o = ordnungLesen();
      const liste = o[art];
      const von = liste.indexOf(id), nach = liste.indexOf(zielId);
      if (von < 0 || nach < 0 || von === nach) return false;
      liste.splice(von, 1);
      liste.splice(nach, 0, id);
      ordnungMerken(o);
      document.querySelectorAll<HTMLElement>('.blatt-werk').forEach(ordnungAnwenden);
      return true;
    };

    /** Um eine Stelle rücken — der Weg der Pfeiltasten. */
    const rueckeUm = (el: HTMLElement, schritt: number): void => {
      const art: 'werkzeuge' | 'gruppen' = el.dataset.wz ? 'werkzeuge' : 'gruppen';
      const id = String(el.dataset.wz || el.dataset.gruppe || '');
      const liste = ordnungLesen()[art];
      const i = liste.indexOf(id);
      const ziel = liste[i + schritt];
      if (!ziel || !setzeAn(art, id, ziel)) return;
      /* Der Fokus bleibt am geschobenen Knopf — sonst wäre die zweite
         Pfeiltaste ins Leere gedrückt. */
      (art === 'werkzeuge' ? tools : flaeche(tools)).querySelector<HTMLElement>(
        art === 'werkzeuge' ? `:scope > [data-wz="${id}"]` : `:scope > [data-gruppe="${id}"]`
      )?.focus();
    };

    const bandZeigen = (an: boolean): void => {
      const reihe = tools.closest<HTMLElement>('.blatt-reihe');
      if (!reihe) return;
      reihe.querySelector('.blatt-ordnen-band')?.remove();
      if (!an) return;
      const band = document.createElement('div');
      band.className = 'blatt-ordnen-band';
      const wort = document.createElement('span');
      wort.textContent = 'Ziehen zum Ordnen';
      const liste = document.createElement('button');
      liste.type = 'button'; liste.dataset.ob = 'liste'; liste.textContent = 'Als Liste';
      liste.title = 'Alles ordnen — auch das Zubehör, das gerade nicht zu sehen ist';
      const zurueck = document.createElement('button');
      zurueck.type = 'button'; zurueck.dataset.ob = 'zurueck'; zurueck.textContent = 'Zurücksetzen';
      const fertig = document.createElement('button');
      fertig.type = 'button'; fertig.dataset.ob = 'fertig'; fertig.textContent = 'Fertig';
      fertig.className = 'ist-fertig';
      band.append(wort, liste, zurueck, fertig);
      reihe.appendChild(band);
      fertig.focus();
    };

    const ordnenSetzen = (an: boolean): void => {
      ordnenAn = an;
      if (an) tools.dataset.ordnen = 'an'; else delete tools.dataset.ordnen;
      bandZeigen(an);
      if (!an && zug) { zug = null; tools.querySelectorAll('.zieht').forEach(z => z.classList.remove('zieht')); }
    };

    /* Der Klickabfänger im Einfang: im Modus greift ein Klick, er zeichnet
       nicht. Die Knöpfe des Bandes sind davon ausgenommen — sie liegen
       ausserhalb von `tools`. */
    tools.addEventListener('click', event => {
      if (!ordnenAn) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);

    tools.addEventListener('pointerdown', event => {
      if (!ordnenAn) return;
      const el = (event.target as Element)?.closest<HTMLElement>('[data-wz],[data-gruppe]');
      if (!el || !tools.contains(el)) return;
      event.preventDefault();
      zug = el.dataset.wz
        ? { art: 'werkzeuge', id: String(el.dataset.wz) }
        : { art: 'gruppen', id: String(el.dataset.gruppe) };
      el.classList.add('zieht');
      const beiZug = (e: PointerEvent): void => {
        if (!zug) return;
        const ziel = teilUnter(e.clientX, e.clientY);
        if (!ziel || ziel.art !== zug.art || ziel.id === zug.id) return;
        setzeAn(zug.art, zug.id, ziel.id);
      };
      const ende = (): void => {
        zug = null;
        tools.querySelectorAll('.zieht').forEach(z => z.classList.remove('zieht'));
        window.removeEventListener('pointermove', beiZug);
        window.removeEventListener('pointerup', ende);
        window.removeEventListener('pointercancel', ende);
      };
      window.addEventListener('pointermove', beiZug);
      window.addEventListener('pointerup', ende);
      window.addEventListener('pointercancel', ende);
    }, true);

    tools.addEventListener('keydown', event => {
      if (!ordnenAn) return;
      if (event.key === 'Escape') { ordnenSetzen(false); return; }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const el = (event.target as Element)?.closest<HTMLElement>('[data-wz],[data-gruppe]');
      if (!el || !tools.contains(el)) return;
      event.preventDefault();
      rueckeUm(el, event.key === 'ArrowRight' ? 1 : -1);
    }, true);

    /* Die Knöpfe des Bandes. Sie liegen an der Reihe, nicht an `tools` —
       deshalb ein eigener Zuhörer, und deshalb fängt der Abfänger sie nicht. */
    const reiheFuerBand = row;
    reiheFuerBand.addEventListener('click', event => {
      const knopf = (event.target as Element)?.closest<HTMLElement>('[data-ob]');
      if (!knopf) return;
      event.preventDefault();
      event.stopPropagation();
      const was = String(knopf.dataset.ob || '');
      if (was === 'fertig') { ordnenSetzen(false); return; }
      if (was === 'liste') { void leisteEinrichten(); return; }
      if (was === 'zurueck') {
        ordnungVergessen();
        document.querySelectorAll<HTMLElement>('.blatt-werk').forEach(ordnungAnwenden);
      }
    });
    controls.ordnenUmschalten = (): void => ordnenSetzen(!ordnenAn);

    /* ══ DIE LEISTE SAGT, DASS SIE EINE LEISTE IST (E621) ═══════════════════
       `role="toolbar"` kam in `src/` bis zum 19. September 2026 NULL mal vor
       — bei elf anderen Rollen und 24 `aria-label`. Wer die Seite vorlesen
       lässt, hört heute dreissig einzelne Knöpfe hintereinander, ohne dass
       gesagt wird, dass sie zusammengehören.

       Eine Rolle allein wäre aber eine Behauptung (§55.2): `toolbar`
       verspricht dem Vorleser, dass EIN Tabsprung hineinführt und die
       Pfeiltasten darin weitergehen. Also steht beides hier, oder keines. */
    tools.setAttribute('role', 'toolbar');
    tools.setAttribute('aria-label', 'Zeichenwerkzeuge');
    const sichtbareKnoepfe = (): HTMLElement[] => {
      const alle = [...tools.querySelectorAll<HTMLElement>('button')];
      const sichtbar = alle.filter(k => k.getClientRects().length > 0 && !k.hasAttribute('disabled'));
      /* VOR DEM EINHÄNGEN hat noch nichts einen Kasten. Dann gilt die ganze
         Liste — sonst bliebe der erste Durchlauf wirkungslos und der frisch
         geladene Bildschirm hätte dreissig Tabstationen. */
      return sichtbar.length ? sichtbar : alle;
    };
    /** Genau ein Knopf im Tabbaum — der zuletzt berührte, sonst der erste. */
    const fokusFuehrung = (bevorzugt?: HTMLElement): void => {
      const liste = sichtbareKnoepfe();
      if (!liste.length) return;
      const jetzt = liste.find(k => k.tabIndex === 0);
      const eins = (bevorzugt && liste.includes(bevorzugt)) ? bevorzugt : (jetzt ?? liste[0]!);
      tools.querySelectorAll<HTMLElement>('button').forEach(k => { k.tabIndex = -1; });
      eins.tabIndex = 0;
    };
    /* Einmal beim Bauen, und danach bei jedem Klick — ein Werkzeugwechsel
       blendet halbe Gruppen um, und der eine Tabstopp darf nicht in einem
       Knopf landen, den gerade niemand sieht. */
    fokusFuehrung();
    tools.addEventListener('click', event => {
      const k = (event.target as Element)?.closest<HTMLElement>('button');
      fokusFuehrung(k && tools.contains(k) ? k : undefined);
    });
    tools.addEventListener('focusin', event => {
      const k = (event.target as Element)?.closest<HTMLElement>('button');
      if (k && tools.contains(k)) fokusFuehrung(k);
    });
    tools.addEventListener('keydown', event => {
      /* Im Einrichten-Modus gehören die Pfeiltasten dem Umsortieren (E571). */
      if (ordnenAn) return;
      const schritt = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (!schritt && event.key !== 'Home' && event.key !== 'End') return;
      const liste = sichtbareKnoepfe();
      if (liste.length < 2) return;
      const hier = (event.target as Element)?.closest<HTMLElement>('button');
      const i = hier ? liste.indexOf(hier) : -1;
      const ziel = event.key === 'Home' ? liste[0]!
        : event.key === 'End' ? liste[liste.length - 1]!
        : liste[((i < 0 ? 0 : i) + schritt + liste.length) % liste.length]!;
      event.preventDefault();
      fokusFuehrung(ziel);
      ziel.focus();
    });

    /* ══ DEN PLATZ ÜBERALL SETZEN — EIN WEG (E620) ══════════════════════════
       Der Rundlauf tat das bisher inmitten seines Klickzweigs. Seit es einen
       zweiten Weg zum selben Ziel gibt (das Ziehen), wäre das zweimal
       dasselbe an zwei Stellen — und zwei Wege laufen auseinander (§8). */
    /* ══ «UNTEN» MUSS HINTER DAS PAPIER (E622, L187) ═══════════════════════
       `position:sticky` mit `bottom` zieht ein Element NACH OBEN, wenn es
       sonst unter den Fensterrand rutschte — es schiebt keines nach unten.
       Gemessen: die Leiste blieb bei y = 335 stehen, also oben, weil
       `seite.ts:111` sie als ERSTES Kind der Hülle einhängt.

       Damit sie am unteren Fensterrand klebt, muss sie im Fluss HINTER dem
       Papier stehen. Das ist ein Zug im Baum, kein zweiter Wähler: die
       Hülle bleibt ein gewöhnlicher Block (sie zu einer Flexspalte zu
       machen, nur um `order` zu bekommen, hätte Papier, Drehhülle und
       Abbild zu Flexelementen gemacht — vier Dinge geändert, um eines zu
       verschieben).

       Und es stimmt auch für den Vorleser: bei «unten» steht die Leiste
       unter dem Blatt, und dann soll sie dort auch gelesen werden (§38). */
    const leisteEinordnen = (r: HTMLElement): void => {
      const h = r.parentElement;
      if (!h || !h.classList.contains('blatt-huelle')) return;
      if (r.dataset.lage === 'unten') { if (h.lastElementChild !== r) h.appendChild(r); }
      else if (h.firstElementChild !== r) h.insertBefore(r, h.firstElementChild);
      /* Die Höhe erst NACH dem Einhängen: vorher hat die Hülle keinen Ort (E696). */
      spaltePlatz(r);
      window.addEventListener('resize', spaltenNachFenster, { passive: true });
    };

    const lageAnwenden = (id: string, merken = true): void => {
      const eintrag = LAGEN.find(l => l.id === id) ?? LAGEN[0]!;
      if (merken && typeof Store !== 'undefined') {
        try { Store.setMeta(M_LAGE, eintrag.id); } catch { /* nur diese Sitzung */ }
      }
      const i = LAGEN.findIndex(l => l.id === eintrag.id);
      const naechst = naechsteLage(i);
      document.querySelectorAll<HTMLElement>('.blatt-reihe').forEach(r => {
        r.dataset.lage = eintrag.id;
        leisteEinordnen(r);
      });
      document.querySelectorAll<HTMLElement>('[data-act="lage"]').forEach(k => {
        k.dataset.lage = eintrag.id;
        k.title = 'Leiste verschieben — jetzt ' + eintrag.name + ', als Nächstes ' + naechst.name
          + ' (ziehen geht auch)';
        k.setAttribute('aria-label', 'Leiste verschieben, jetzt ' + eintrag.name);
        const z = k.querySelector<HTMLElement>('.zeichen');
        if (z) { z.dataset.sym = eintrag.sym; z.textContent = ''; }
        try { Register.symbole.fuelle(k); } catch { /* dann bleibt es leer */ }
      });
    };

    /* ══ AM GRIFF ZIEHEN (E620) ═════════════════════════════════════════════
       Das Papier vom 19. September wollte eine Palette, die man greift und
       hinschiebt. Gebaut war nur der Rundlauf: tippen, und sie springt zum
       nächsten Platz. Beides zusammen geht, wenn der Griff zwei Wege kennt —
       und der Griff ist der Knopf, der ohnehin schon „Platz" heisst.

       GEZOGEN WIRD ERST NACH SECHS PIXELN. Darunter ist es ein Tipp, und der
       Tipp bleibt der Rundlauf (E512); am Telefon gibt es gar nichts anderes,
       denn eine Leiste, die beim Zeichnen mitwandert, ist dort ein Schaden.

       GEFANGEN WIRD AM RAND, und das Fangband ist 64 px breit — dieselbe
       Zahl, die die Spalte links und rechts misst (`bausteine.css`). Eine
       geratene Zahl wäre hier besonders teuer: ein zu schmales Band trifft
       man nie, ein zu breites lässt nichts frei stehen. */
    const ZUG_AB = 6;
    const FANG = 64;
    tools.addEventListener('pointerdown', event => {
      if (ordnenAn) return;
      const griff = (event.target as Element)?.closest<HTMLElement>('[data-act="lage"]');
      if (!griff || !tools.contains(griff)) return;
      if (window.matchMedia && window.matchMedia('(max-width:760px)').matches) return;
      const huelle = row.parentElement;
      if (!huelle) return;
      const startX = event.clientX, startY = event.clientY;
      let zieht = false;
      const bewegen = (e: PointerEvent): void => {
        if (!zieht && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) < ZUG_AB) return;
        if (!zieht) {
          zieht = true;
          row.dataset.zug = 'an';
          griff.setPointerCapture?.(e.pointerId);
        }
        const k = huelle.getBoundingClientRect();
        if (!k.width || !k.height) return;
        /* GANZ IM BILD BLEIBEN. Der gemerkte Punkt ist die MITTE der Leiste
           (`translate(-50%,-50%)`), also darf er nicht näher an den Rand als
           ihre halbe Breite — sonst hängt eine Hälfte draussen, und beim
           Bild vom 19. September tat sie das auch: rechts abgeschnitten. */
        const halbX = ((row.offsetWidth / 2) / k.width) * 100;
        const halbY = ((row.offsetHeight / 2) / k.height) * 100;
        const klemm = (wert: number, halb: number): number =>
          halb * 2 >= 100 ? 50 : Math.min(100 - halb, Math.max(halb, wert));
        const x = klemm(((e.clientX - k.x) / k.width) * 100, halbX);
        const y = klemm(((e.clientY - k.y) / k.height) * 100, halbY);
        row.dataset.lage = 'frei';
        row.style.setProperty('--leiste-x', x.toFixed(2) + '%');
        row.style.setProperty('--leiste-y', y.toFixed(2) + '%');
      };
      const beenden = (e: PointerEvent): void => {
        window.removeEventListener('pointermove', bewegen);
        window.removeEventListener('pointerup', beenden);
        window.removeEventListener('pointercancel', beenden);
        if (!zieht) return;
        delete row.dataset.zug;
        /* DER KLICK NACH DEM ZIEHEN GEHÖRT NICHT DEM RUNDLAUF. Ohne das
           spränge die Leiste im selben Atemzug noch einen Platz weiter. */
        const schlucken = (c: Event): void => { c.preventDefault(); c.stopPropagation(); };
        window.addEventListener('click', schlucken, true);
        setTimeout(() => window.removeEventListener('click', schlucken, true), 0);
        const k = huelle.getBoundingClientRect();
        const nah = {
          links: e.clientX - k.x, rechts: k.right - e.clientX,
          oben: e.clientY - k.y, unten: k.bottom - e.clientY
        };
        const rand = (Object.keys(nah) as Array<keyof typeof nah>)
          .sort((a, b) => nah[a] - nah[b])[0]!;
        if (nah[rand] <= FANG) {
          row.style.removeProperty('--leiste-x');
          row.style.removeProperty('--leiste-y');
          lageAnwenden(rand);
          return;
        }
        /* Frei stehen geblieben: die zwei Zahlen als Prozent merken, nicht
           als Pixel — ein kleineres Fenster schöbe sie sonst hinter den
           Rand. Als Text, weil `meta` Text sicher übersteht (§9). */
        lageAnwenden('frei');
        if (typeof Store !== 'undefined') {
          try {
            Store.setMeta(M_FREI, row.style.getPropertyValue('--leiste-x').trim()
              + ' ' + row.style.getPropertyValue('--leiste-y').trim());
          } catch { /* nur diese Sitzung */ }
        }
      };
      window.addEventListener('pointermove', bewegen);
      window.addEventListener('pointerup', beenden);
      window.addEventListener('pointercancel', beenden);
    });

    /* SICHTBAR MACHEN, DASS DIE LEISTE ROLLT (E140, §55.1).
       Bei 390 px ist die Leiste 310 px breit und ihr Inhalt 1059 — von 21
       Knöpfen stehen 15 draussen, alle rechts. Gerollt werden kann sie
       längst; nur zeigt das nichts an, und eine abgeschnittene Leiste sieht
       aus wie eine vollständige. Genau dieser Befund steht in §55.1 über die
       Tabellenleiste, und er gilt hier noch einmal.

       `.blatt-fest` hat seinen Schatten für die Seite LINKS. Nach rechts gab
       es nichts — dabei ist beim Öffnen alles Verdeckte rechts.

       Kein Dauerverlauf: der würde am Ende der Leiste eine Andeutung zeigen,
       wo nichts mehr kommt. Die zwei Kennzeichen stehen nur, solange es
       wirklich etwas zu holen gibt.
       Die Rechnung selbst steht in `kern/helfer/rollrand.ts` (E159). Hier
       ist nur zu merken, dass GEROLLT wird `tools`, gezeichnet aber an
       `row` — deshalb `an: row`. */
    Rollrand.binde(tools, { art: 'mehr', an: row });

    /* DIE EIGENEN TUPFER NEU SETZEN — EINE STELLE (E486).

       Es gibt jetzt zwei Wege hierher: der Farbwähler (E351) und das Laden
       oder Zurücksetzen eines Farbsatzes. Der zweite kam mit E486 dazu, und
       er hätte die zwölf Zeilen aus dem Farbwähler abgeschrieben. Zwei
       Abschriften desselben Aufbaus laufen beim ersten neuen Attribut
       auseinander — also steht er hier einmal.

       UND DABEI FIEL EIN ALTER FEHLER AUF (E351, gefunden von `test458`).
       Der Farbwähler hängte die Tupfer RÜCKWÄRTS ein — `reverse()`, und
       dann jeden vor das „+". Das ist einmal zu viel gedreht: `before()`
       setzt jeden neuen direkt vor das „+", also hinter den vorigen; die
       Liste kommt vorwärts heraus, wenn man sie vorwärts durchgeht.
       Rückwärts kam sie rückwärts heraus — die soeben gewählte Farbe stand
       ganz rechts, und nach dem nächsten Start (die erste Zeichnung der
       Leiste dreht nicht) plötzlich ganz links. Zwei Anzeigen desselben
       Zustands, und beide anders (E212). Also vorwärts. */
    const tupferZeigen = (liste: readonly string[], aktiv?: string): void => {
      tools.querySelectorAll('.blatt-farbe-eigen').forEach(node => node.remove());
      const neuKnopf = tools.querySelector('.blatt-farbe-neu');
      liste.forEach(farbe => {
        const k = document.createElement('button');
        k.className = 'blatt-farbe blatt-farbe-eigen';
        k.dataset.gruppe = 'farbe';
        k.dataset.c = farbe; k.style.background = farbe; k.title = 'Eigene Farbe ' + farbe;
        neuKnopf?.before(k);
      });
      if (aktiv) tools.querySelectorAll('.blatt-farbe').forEach(node =>
        node.classList.toggle('on', (node as HTMLElement).dataset.c === aktiv));
    };

    /* DIE FARBSATZ-VERWALTUNG (E486, seit E697 hinter der direkten Palette).

       Sein erster Eintrag ist der Farbwähler — der Weg, den E351 gebaut hat
       und der als alternativer Zugang erhalten bleibt. Der häufige Weg
       führt jetzt direkt über die Palette, ohne diesen Verwaltungsdialog.

       DREI SACHEN AN IHM SIND ABSICHT:

       1. Er zeigt die Farben eines Satzes als HEXWERTE, nicht als Punkte.
          `Dialog.wahl` escapt seinen Text — und das bleibt so, denn genau
          dort sass die Lücke aus E112. Ein Satz „Rot, Blau" wäre gelogen
          (welches Rot?), die Werte sind es nicht. Nebenbei ist es die Form,
          die §38 verlangt: nicht nur über Farbe.
       2. Laden ändert die TUPFER, nicht die Farbe, mit der gerade gezeichnet
          wird. Wer mitten im Satz die Palette wechselt, will nicht, dass ihm
          der nächste Strich die Farbe wechselt.
       3. Zurücksetzen sagt hinterher, wenn die Farbe der Hand nicht mehr in
          der Leiste steht. Sonst stünde plötzlich kein Tupfer hervorgehoben
          da, und die Leiste sähe kaputt aus, obwohl alles stimmt (E212). */
    /** Der Farbwähler des Browsers — kein eigener Regler. Der Wert kommt als
     *  #rrggbb, genau das Format der Katalogfarben. */
    const farbwaehlerOeffnen = (): void => {
      const feld = document.createElement('input');
      feld.type = 'color';
      feld.value = (Zeichenziel.farbeVon?.(controls) as string) || FARBEN[0];
      feld.style.position = 'fixed'; feld.style.opacity = '0'; feld.style.pointerEvents = 'none';
      document.body.appendChild(feld);
      const uebernehmen = (): void => {
        const wert = String(feld.value || '').toLowerCase();
        feld.remove();
        if (!/^#[0-9a-f]{6}$/.test(wert)) return;
        const liste = eigeneFarbeMerken(wert);
        controls.setzeFarbe(wert);
        try { Zeichenziel.uebernehmeFarbe(controls, wert); } catch { /* egal */ }
        tupferZeigen(liste, wert);
      };
      feld.addEventListener('change', uebernehmen, { once: true });
      feld.addEventListener('cancel', () => feld.remove(), { once: true });
      feld.click();
    };

    /* E697: Farbe ist ein direkter Griff; niemals rückwirkend. Seit E704: */
    const openColorPanel = (anchor: HTMLElement): void => {
      const tool = String(Zeichenziel.werkzeugVon(controls) || 'stift');
      const marker = tool === 'marker';
      const papier = papierfarbeVon(controls.flaeche);
      const dunkel = relativeHelligkeit(papier) < 0.2;
      const zuerst: ReadonlyArray<readonly [string, string]> = marker ? LEUCHTFARBEN
        : dunkel ? [[PAPIERWEISS, 'Weiss'], ...TINTEN] : TINTEN;
      const weitere = (marker ? MARKER_PASTELLE : FARBEN.map(value => [value, FARBNAMEN[value] || value] as const))
        .filter(([value]) => !zuerst.some(([c]) => c === value));
      const palette: string[][] = [...zuerst, ...weitere].map(([value, name]) => [value, name]);
      InkMenu.open(anchor, marker ? 'Markerfarben' : 'Stift- & Textfarben', (body, close) => {
        body.classList.add('blatt-color-panel'); body.dataset.colorTool = tool;
        let selected = String(Zeichenziel.farbeVon(controls) || FARBEN[0]).toLowerCase();
        if (marker && selected === FARBEN[0]) selected = TEXTMARKER_FARBE;
        const preview = document.createElement('div'); preview.className = 'blatt-color-preview';
        /* Das Papier dieses Blatts, als Wert der Probe — kein Stilblock (§39). */
        preview.style.setProperty('--probe-papier', papier);
        preview.dataset.papier = dunkel ? 'dunkel' : 'hell';
        const sample = document.createElement('span'); sample.textContent = marker ? 'Text bleibt lesbar' : 'Meine Notiz';
        const ink = document.createElement('i'); ink.setAttribute('aria-hidden', 'true');
        preview.append(sample, ink);
        const caption = document.createElement('p'); caption.className = 'blatt-color-caption';
        const hinweis = document.createElement('p'); hinweis.className = 'blatt-color-warnung';
        hinweis.setAttribute('role', 'status');
        /* DIE PROBE NEU SCHREIBEN — mit Farbe, Stift, Spitze und Breite, die
           JETZT gelten. Die Deckung sitzt am `<i>` (E623: dieselbe Zahl wie
           der Strich), nicht noch einmal am Pfad. */
        const probeZeichnen = (): void => {
          const spitze = markerSpitzeLesen();
          const stil = marker ? (spitze === 'keil' ? 'keil' : '') : (stiftJetzt() || 'fueller');
          const probe = strichprobeMarke(marker ? 'marker' : 'stift', stil, selected,
            Number(Zeichenziel.dickeVon?.(controls)) || BREITEN[1]);
          ink.style.opacity = String(deckungVon(tool, stil));
          ink.dataset.stil = stil || (marker ? 'rund' : 'kugel');
          ink.replaceChildren(strichprobeBild(probe));
          caption.textContent = marker
            ? `Markieren · ${spitze === 'keil' ? 'Keilspitze' : 'runde Spitze'} · transparente Tinte auf Papier`
            : 'Schreiben & Zeichnen';
          const k = kontrastZu(selected, papier);
          hinweis.textContent = !marker && k < 3
            ? `Kaum sichtbar auf diesem Papier (${String(Math.round(k * 10) / 10).replace('.', ',')} : 1)` : '';
        };
        body.append(preview, caption, hinweis);
        /* DIE SPITZE DES MARKERS (E704): Keil oder Rund — zwei Knöpfe mit
           Wort, 44 px, `aria-pressed`. */
        if (marker) {
          const spitzen = document.createElement('div'); spitzen.className = 'blatt-color-spitzen';
          spitzen.setAttribute('role', 'group'); spitzen.setAttribute('aria-label', 'Spitze des Markers');
          for (const sp of MARKER_SPITZEN) {
            const knopf = document.createElement('button'); knopf.type = 'button';
            knopf.dataset.markerSpitze = sp.id; knopf.title = sp.titel; knopf.textContent = sp.name;
            knopf.setAttribute('aria-pressed', String(markerSpitzeLesen() === sp.id));
            knopf.onclick = () => {
              markerSpitzeMerken(sp.id);
              staerkenBeschriften();
              spitzen.querySelectorAll<HTMLElement>('[data-marker-spitze]').forEach(k =>
                k.setAttribute('aria-pressed', String(k.dataset.markerSpitze === sp.id)));
              probeZeichnen();
            };
            spitzen.append(knopf);
          }
          body.append(spitzen);
        }
        const apply = (value: string): void => {
          if (!/^#[0-9a-f]{6}$/.test(value)) return;
          const recent = eigeneFarbeMerken(value);
          tupferZeigen(recent, value);
          /* Derselbe Weg wie die Leiste: trägt auch die Strichprobe und
             die Dokumentvorliebe nach. Ein zweiter Setzer vergässe beides. */
          tools.querySelector<HTMLButtonElement>(`.blatt-farbe[data-c="${value}"]`)?.click();
          markiere(); close();
        };
        const addSwatches = (colors: string[][], label: string, klein = false): void => {
          const grid = document.createElement('div'); grid.className = 'blatt-color-grid' + (klein ? ' blatt-color-grid-klein' : '');
          grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', label);
          for (const [value, name] of colors) {
            if (!value) continue;
            const button = document.createElement('button'); button.type = 'button';
            button.dataset.inkColor = value; button.setAttribute('aria-label', `${name} ${value}`);
            button.title = name || value;
            button.setAttribute('aria-pressed', String(value === selected));
            const swatch = document.createElement('i'); swatch.style.background = value; swatch.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span'); text.textContent = name || value;
            button.append(swatch, text); button.onclick = () => apply(value); grid.append(button);
          }
          body.append(grid);
        };
        const ueberschrift = (wort: string): void => {
          const label = document.createElement('p'); label.className = 'blatt-color-caption'; label.textContent = wort; body.append(label);
        };
        ueberschrift(marker ? 'Leuchtfarben' : dunkel ? 'Tinten · für dunkles Papier zuerst Weiss' : 'Tinten');
        addSwatches(zuerst.map(([v, n]) => [v, n]), marker ? 'Markerpalette' : 'Tinten');
        if (weitere.length) {
          ueberschrift('Weitere Farben');
          addSwatches(weitere.map(([v, n]) => [v, n]), marker ? 'Weitere Markerfarben' : 'Weitere Farben', true);
        }
        const recent = eigeneFarben().filter(value => !palette.some(([color]) => color === value));
        if (recent.length) {
          ueberschrift('Zuletzt verwendet');
          addSwatches(recent.map(value => [value, value]), 'Zuletzt verwendete Farben', true);
        }
        const form = document.createElement('form'); form.className = 'blatt-color-custom';
        const label = document.createElement('label'); label.textContent = 'Hex-Farbe';
        const hex = document.createElement('input'); hex.type = 'text'; hex.value = selected;
        hex.setAttribute('aria-label', 'Hex-Farbe'); hex.autocomplete = 'off'; hex.spellcheck = false; hex.maxLength = 7;
        label.append(hex);
        const picker = document.createElement('input'); picker.type = 'color'; picker.value = selected;
        picker.setAttribute('aria-label', 'Systemfarbwähler');
        const error = document.createElement('span'); error.className = 'blatt-color-error'; error.setAttribute('role', 'status');
        const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Farbe übernehmen';
        const update = (): void => {
          const value = hex.value.trim().toLowerCase();
          const valid = /^#[0-9a-f]{6}$/.test(value);
          hex.setAttribute('aria-invalid', String(!valid)); submit.disabled = !valid;
          error.textContent = valid ? '' : 'Bitte # und sechs Hex-Zeichen eingeben.';
          if (valid) { selected = value; picker.value = value; probeZeichnen(); }
        };
        hex.addEventListener('input', update);
        picker.addEventListener('input', () => { hex.value = picker.value; update(); });
        form.addEventListener('submit', event => { event.preventDefault(); if (!submit.disabled) apply(selected); });
        form.append(label, picker, error, submit); body.append(form); update();
        const manage = document.createElement('button'); manage.type = 'button'; manage.dataset.colorSets = 'true';
        manage.textContent = 'Farbsätze & Stifteinstellungen …';
        manage.onclick = () => { close(); controls.finishWriting?.(); void farbenDialog(); };
        body.append(manage);
      }, reason => {
        if (reason === 'knopf' || reason === 'escape') controls.resumeWriting?.();
        else if (reason === 'aussen') controls.finishWriting?.();
      });
    };

    /**
     * Die Auswahl als Element ablegen (E494).
     *
     * Der Weg ist derselbe wie beim Farbsatz: nach dem Namen fragen, bei
     * gleichem Namen NACHFRAGEN, und eine Absage aussprechen statt sie zu
     * verschlucken (§35). Die drei Absagegründe kommen aus `elementSichern`
     * im Klartext — „es ging nicht" wäre bei jedem von ihnen die falsche
     * Auskunft.
     */
    const elementSichernDialog = async (): Promise<void> => {
      if (typeof Dialog === 'undefined') return;
      const name = await Dialog.frage('Als Element sichern — unter welchem Namen?', '');
      if (name === null) return;
      if (!satzName(name)) { UI.toast('Ein Element braucht einen Namen.'); return; }
      const schon = elemente().some(e => e.name.toLowerCase() === satzName(name).toLowerCase());
      if (schon) {
        const ersetzen = await Dialog.wahl({
          titel: 'Das Element ersetzen?',
          text: 'Es gibt schon ein Element „' + satzName(name) + '".',
          knoepfe: [
            { id: 'ja', text: 'Ersetzen', hinweis: 'Die bisherige Zeichnung dieses Elements geht weg' },
            { id: 'nein', text: 'Abbrechen', hinweis: 'Nichts ändert sich' }
          ]
        });
        if (ersetzen !== 'ja') return;
      }
      const ergebnis = controls.elementAusAuswahl(name);
      if (!ergebnis.ok) { UI.toast(ergebnis.grund); return; }
      UI.toast('Element „' + ergebnis.element.name + '" gesichert — Werkzeug «Elemente» setzt es');
    };

    const farbenDialog = async (): Promise<void> => {
      /* OHNE DIALOG BLEIBT DER ALTE WEG. `Dialog` liegt in der Schale; ein
         Prüflauf, der nur den Kern hochfährt, hätte sonst gar keinen
         Farbwähler mehr — und E351 wäre stillschweigend weg. */
      if (typeof Dialog === 'undefined') { farbwaehlerOeffnen(); return; }
      const jetzt = eigeneFarben();
      const saetze = farbsaetze();
      const farbeJetzt = (): string => {
        try { return String(Zeichenziel.farbeVon?.(controls) || FARBEN[0]); } catch { return FARBEN[0]; }
      };
      const zeigen = (liste: readonly string[]): string =>
        liste.length ? liste.join(', ') : 'ohne eigene Farben';
      const wahl = await Dialog.wahl({
        titel: 'Farben',
        text: 'Die fünf festen Farben stehen immer in der Leiste. Daneben stehen bis zu vier '
          + 'eigene — und ein Farbsatz ist eine benannte Abschrift genau dieser vier.\n\n'
          + 'Eigene Farben gerade: ' + zeigen(jetzt),
        knoepfe: [
          { id: 'waehlen', text: 'Andere Farbe wählen',
            hinweis: 'Der Farbwähler des Systems — die gewählte Farbe kommt danach als Tupfer dazu' },
          /* E501: der Hinweis nennt, was der Satz WIRKLICH zurückholt.
             Ein Satz mit Stift und Stärke ist eine Voreinstellung; ein
             älterer ohne beides bleibt ein Farbsatz, und das steht dann
             auch so da — statt etwas zu versprechen, was er nicht kann. */
          ...saetze.map(satz => ({ id: 'laden:' + satz.name, text: satz.name,
            hinweis: zeigen(satz.farben)
              + (satz.stil ? ' · ' + (STIFTE.find(st => st.id === satz.stil)?.name || satz.stil) : '')
              + (satz.breite ? ' · ' + String(Math.round(satz.breite * 10) / 10).replace('.', ',') + ' px' : '') })),
          { id: 'sichern', text: 'Diese Einstellung sichern',
            hinweis: 'Farben, Stift und Strichstärke — zusammen unter einem Namen'
              + (jetzt.length ? ' (' + jetzt.length + ' eigene Farben)' : '') },
          ...(saetze.length ? [{ id: 'entfernen', text: 'Einen Satz löschen',
            hinweis: 'Die Farben selbst bleiben, nur der Name geht weg' }] : []),
          { id: 'zuruecksetzen', text: 'Eigene Farben zurücksetzen',
            hinweis: 'Leert die Tupfer. Die fünf festen Farben und alle gesicherten Sätze bleiben.' }
        ]
      });
      if (!wahl) return;

      if (wahl === 'waehlen') { farbwaehlerOeffnen(); return; }

      if (wahl.startsWith('laden:')) {
        const satz = farbsatzLaden(wahl.slice(6));
        if (!satz) return;
        tupferZeigen(satz.farben, farbeJetzt());
        /* E501: Stift und Stärke kommen mit, wenn der Satz sie kennt — und
           die Leiste zeigt es sofort, statt es erst beim nächsten Strich zu
           verraten. `markiere()` liest den Zustand aus der Fläche zurück;
           den Stiftknopf beschriftet `stiftZeigen`, weil sein Name und sein
           Zeichen nirgends sonst herkommen. */
        if (satz.stil && controls.setzeStil) { controls.setzeStil(satz.stil); stiftZeigen(satz.stil); }
        if (satz.breite) strichSetzen(satz.breite);
        markiere();
        UI.toast('„' + satz.name + '" geladen'
          + (satz.stil || satz.breite ? ' — mit Stift und Strichstärke' : ''));
        return;
      }

      if (wahl === 'sichern') {
        const name = await Dialog.frage('Farbsatz sichern — unter welchem Namen?', '');
        if (name === null) return;
        if (!satzName(name)) { UI.toast('Ein Farbsatz braucht einen Namen.'); return; }
        const schon = farbsaetze().some(s => s.name.toLowerCase() === satzName(name).toLowerCase());
        if (schon) {
          const ersetzen = await Dialog.wahl({
            titel: 'Den Satz ersetzen?',
            text: 'Es gibt schon einen Farbsatz „' + satzName(name) + '".',
            knoepfe: [
              { id: 'ja', text: 'Ersetzen', hinweis: 'Die bisherigen Farben dieses Satzes gehen weg' },
              { id: 'nein', text: 'Abbrechen', hinweis: 'Nichts ändert sich' }
            ]
          });
          if (ersetzen !== 'ja') return;
        }
        /* `null` heisst: voll. Das wird GESAGT — ein still verschluckter
           Speicherbefehl ist schlimmer als eine Absage (§35). */
        /* E501: Stift und Stärke reisen mit. Beide kommen aus derselben
           Quelle, aus der die Leiste sie anzeigt — nicht aus einem zweiten
           Merker, der auseinanderlaufen könnte. */
        const stift = { stil: controls.stilVon ? controls.stilVon() : '',
                        breite: Zeichenziel.dickeVon(controls) };
        if (!farbsatzSichern(name, eigeneFarben(), stift)) {
          UI.toast('Es passen höchstens ' + HOECHSTENS_FARBSAETZE + ' Voreinstellungen — lösche zuerst eine.');
          return;
        }
        UI.toast('„' + satzName(name) + '" gesichert — Farben, Stift und Strichstärke');
        return;
      }

      if (wahl === 'entfernen') {
        const welcher = await Dialog.wahl({
          titel: 'Welchen Satz löschen?',
          text: 'Die Farben bleiben in der Leiste stehen — nur der gesicherte Name geht weg.',
          knoepfe: saetze.map(satz => ({ id: 'weg:' + satz.name, text: satz.name, hinweis: zeigen(satz.farben) }))
        });
        if (!welcher.startsWith('weg:')) return;
        farbsatzLoeschen(welcher.slice(4));
        UI.toast('Farbsatz „' + satzName(welcher.slice(4)) + '" gelöscht');
        return;
      }

      if (wahl === 'zuruecksetzen') {
        const vorher = farbeJetzt();
        tupferZeigen(farbenZuruecksetzen(), vorher);
        if (!(FARBEN as readonly string[]).includes(vorher.toLowerCase())) {
          UI.toast('Eigene Farben zurückgesetzt — gezeichnet wird weiter in ' + vorher);
        }
      }
    };

    const updateState = (next: any): void => {
      const undo = tools.querySelector<HTMLButtonElement>('[data-act="undo"]');
      const redo = tools.querySelector<HTMLButtonElement>('[data-act="redo"]');
      const remove = tools.querySelector<HTMLButtonElement>('[data-act="delete"]');
      if (undo) undo.disabled = !next.undo;
      if (redo) redo.disabled = !next.redo;
      if (remove) remove.disabled = !next.selected;
      const copy = tools.querySelector<HTMLButtonElement>('[data-act="copy"]');
      const paste = tools.querySelector<HTMLButtonElement>('[data-act="paste"]');
      if (copy) copy.disabled = !next.selected;
      if (paste) paste.disabled = !next.clipboard;
      for (const act of ['cut', 'vor', 'hinten', 'sperren', 'verweis', 'element-sichern']) {
        const k = tools.querySelector<HTMLButtonElement>(`[data-act="${act}"]`);
        if (k) k.disabled = !next.selected;
      }
      const schloss = tools.querySelector<HTMLButtonElement>('[data-act="sperren"]');
      if (schloss) {
        schloss.setAttribute('aria-pressed', next.gesperrt ? 'true' : 'false');
        schloss.classList.toggle('on', !!next.gesperrt);
      }
      elementKnopfMalen(next.element);
    };

    /* WELCHES ELEMENT DER NÄCHSTE TIPP SETZT (E494). `textContent`, nicht
       `innerHTML` — der Name kommt vom Nutzer (§19). */
    const elementKnopfMalen = (id: unknown): void => {
      const knopf = tools.querySelector<HTMLButtonElement>('[data-act="elemente"]');
      if (!knopf) return;
      const gewaehlt = id ? elementHolen(id) : null;
      const wort = knopf.querySelector<HTMLElement>('.wort');
      if (wort) wort.textContent = gewaehlt ? gewaehlt.name : 'Elemente';
      knopf.title = gewaehlt
        ? 'Der nächste Tipp setzt „' + gewaehlt.name + '" — antippen wählt ein anderes'
        : 'Elemente-Bibliothek öffnen und wählen, was der nächste Tipp setzt';
      knopf.classList.toggle('on', !!gewaehlt);
    };
    controls.beiAenderung?.(updateState);

    /* ZWEI ANSICHTEN DESSELBEN ZUSTANDS (E212, §55.1).

       Diese Leiste markiert ihr Werkzeug selbst, wenn man sie drückt. Wird
       das Werkzeug oben im Menüband gewählt, passiert hier nichts — auf dem
       Bildschirmfoto stand die Fläche längst auf `data-tool="stift"`, das
       Band zeigte „Stift" markiert, und diese Leiste zeigte „Schreiben".
       Gemessen: `[data-wz].on` = schreiben, `.mb-knopf.ist-an` = Stift.

       Wer zwei Anzeigen für einen Zustand baut, muss beide an denselben
       Zustand hängen. Sonst läuft die eine der anderen hinterher, und der
       Nutzer glaubt der falschen.

       `werkzeugVon(controls)` und nicht `jetzt()`: gemeint ist DIESE
       Fläche. Bei zwei Blättern auf einer Seite zeigte `jetzt()` beiden
       Leisten das Werkzeug des zuletzt berührten. */
    /**
     * DEN STIFTKNOPF BESCHRIFTEN (E501, eine Tür).
     *
     * Sein Zeichen, sein Wort und sein `data-stil` kommen aus `STIFTE` und
     * standen bis hierher nur im Klickgriff. Mit dem Laden einer
     * Voreinstellung gibt es einen zweiten Aufrufer — und zwei Abschriften
     * derselben drei Zeilen laufen auseinander (§8).
     */
    /** Welcher Stift führt — an der Reihe abzulesen (E512). Vorher stand
     *  es an EINEM Knopf, der sich umbeschriftete; jetzt ist es die
     *  `on`-Klasse in einer Reihe von sechs. */
    const stiftZeigen = (id: string): void => {
      const stift = STIFTE.find(st => st.id === id);
      if (!stift) return;
      tools.querySelectorAll<HTMLElement>('[data-act="stilwahl"]').forEach(node => {
        const an = node.dataset.stil === stift.id;
        node.classList.toggle('on', an);
        node.setAttribute('aria-pressed', an ? 'true' : 'false');
      });
      leiterReihe(stift.id === 'leiter');
      /* Der Stift entscheidet über die Deckung der Probe (E623) — Bleistift
         0,72, Pinsel 0,92, sonst voll. Also muss sie ihn sehen. */
      try { staerkenBeschriften(); } catch { /* vor dem Aufbau */ }
    };

    /**
     * DIE FARBREIHE WIRD ZUR ADERNREIHE (E509).
     *
     * Beim Leiterstift stehen dort nicht fünf Farben und ein „+", sondern
     * die zehn Adern — jede mit ihrem Kürzel darauf und ihrem Namen im
     * Titel. Beim Wechsel zurück ist alles wieder, wie es war.
     *
     * WEGGENOMMEN, NICHT ÜBERSCHRIEBEN. Die fünf festen Tupfer und die
     * eigenen Farben bleiben im Baum und werden nur ausgeblendet: sie
     * tragen die gewählte Farbe in ihrer `on`-Klasse, und wer sie
     * wegwürfe, müsste sie beim Zurückschalten neu erfinden.
     *
     * DAS KÜRZEL STEHT AUF DEM TUPFER, nicht nur im Titel. Zehn Punkte,
     * die sich allein durch die Farbe unterscheiden, sind genau das, was
     * §38 verbietet — und im Schaltplan steht das Kürzel ohnehin neben der
     * Ader, man liest es also sowieso.
     */
    const leiterReihe = (an: boolean): void => {
      tools.querySelectorAll('.blatt-farbe-leiter').forEach(node => node.remove());
      /* DIE HAFTNOTIZFARBEN GEHEN DIE ADERN NICHTS AN (E574). Sie tragen
         `.blatt-farbe` und wären sonst mit weggenommen worden — im
         Notizkontext stünde dann gar keine Farbe mehr, nur weil irgendwann
         vorher der Leiterstift gewählt war. Ihre Sichtbarkeit entscheidet
         allein die Gruppenregel. */
      tools.querySelectorAll<HTMLElement>('.blatt-farbe:not(.blatt-note-color), .blatt-farbe-neu')
        .forEach(node => node.classList.toggle('blatt-farbe-weg', an));
      if (!an) return;
      const neuKnopf = tools.querySelector('.blatt-farbe-neu');
      const jetzt = leiterJetzt();
      LEITER.forEach(ader => {
        const k = document.createElement('button');
        k.className = 'blatt-farbe blatt-farbe-leiter' + (ader.id === jetzt ? ' on' : '');
        /* DIE NUMMER FÜR DIE WELLE (E511). Die Verzögerung rechnet das CSS
           aus EINER Zahl (`--ru-tupfer-welle`); hier steht nur, der
           wievielte Tupfer das ist. */
        k.style.setProperty('--tupfer-n', String(LEITER.indexOf(ader as any)));
        k.dataset.gruppe = 'farbe';
        k.dataset.c = ader.farbe;
        k.dataset.leiter = ader.id;
        k.style.background = ader.farbe;
        k.title = ader.kurz + ' — ' + ader.name;
        k.setAttribute('aria-label', 'Ader ' + ader.kurz + ': ' + ader.name);
        const wort = document.createElement('span');
        wort.className = 'blatt-farbe-kurz';
        wort.setAttribute('aria-hidden', 'true');
        wort.textContent = ader.kurz;
        k.append(wort);
        neuKnopf?.before(k);
      });
    };

    const markiere = (): void => {
      if (!tools.isConnected) { Zeichenziel.vergiss(markiere); return; }
      const wz = Zeichenziel.werkzeugVon(controls);
      if (wz) {
        /* EINE FORM LÄSST DEN FORMEN-KNOPF LEUCHTEN (E375) — sonst wäre
           beim Zeichnen eines Rechtecks kein Knopf hervorgehoben, und die
           Leiste sähe aus, als sei nichts gewählt. */
        const fuehrend = istForm(wz) ? 'formen' : wz;
        tools.querySelectorAll<HTMLElement>('[data-wz]').forEach(node => {
          node.classList.toggle('on', node.dataset.wz === fuehrend);
          /* Der Zustand gehoert in den Baum, nicht nur in die Klasse (F04). */
          node.setAttribute('aria-pressed', node.dataset.wz === fuehrend ? 'true' : 'false');
        });
        /* Die Leiste weiss, welches Werkzeug fuehrt — das CSS am Telefon
           liest es (E356). */
        if (tools.dataset.tool !== wz) { tools.dataset.tool = wz; zumWerkzeugRollen(wz); }
      }
      const farbe = Zeichenziel.farbeVon(controls);
      /* EINE ADER WIRD AN IHRER KENNUNG ERKANNT, nicht an ihrer Farbe
         (E509). L2 ist `#111111` — dasselbe Schwarz wie der erste
         Farbtupfer. Wer hier die Farbe vergleicht, hebt beim Öffnen den
         falschen Tupfer hervor: L2 statt der Ader, die man zuletzt geführt
         hat. Die Farbe ist eine Eigenschaft der Ader, nicht ihr Name. */
      const ader = leiterJetzt();
      if (farbe) tools.querySelectorAll<HTMLElement>('.blatt-farbe').forEach(node => {
        node.classList.toggle('on', node.dataset.leiter
          ? node.dataset.leiter === ader
          : node.dataset.c === farbe);
      });
      const dicke = Zeichenziel.dickeVon(controls);
      if (dicke) tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach(node => {
        node.classList.toggle('on', Number(node.dataset.b) === dicke);
      });
      if (dicke) staerkeZeigen(dicke);
    };
    /** Ist die Klappe mit dem Regler offen? */
    const staerkeOffen = (): boolean => !!tools.querySelector('.blatt-staerke.auf');
    /** Klappe auf oder zu. Offen steht sie unter der gewaehlten Stufe (`--staerke-x`);
        am Telefon, in der Spalte und im Schreibstudio steht sie in der rollenden Zeile. */
    const staerkeAuf = (auf: boolean): void => {
      const label = tools.querySelector<HTMLElement>('.blatt-staerke');
      if (!label) return;
      if (auf) {
        const stufe = tools.querySelector<HTMLElement>('.blatt-strich.on') || tools.querySelector<HTMLElement>('.blatt-strich');
        if (stufe) label.style.setProperty('--staerke-x', `${stufe.offsetLeft}px`);
        label.classList.add('auf');
        const feld = label.querySelector<HTMLInputElement>('input');
        try { feld?.focus({ preventScroll: true }); } catch { /* egal */ }
        /* In der rollenden Zeile (Telefon, Spalte, Studio) steht die Klappe
           rechts der Stufen — und die koennen am Rand stehen. Nachrollen,
           sonst geht etwas auf, das niemand sieht. */
        try { label.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* egal */ }
      } else {
        label.classList.remove('auf');
      }
    };
    /* ══ WIE BREIT DER STRICH WIRKLICH WIRD (E616) ═════════════════════════
       DER MARKER ZIEHT VIERMAL SEINE ZAHL. Das steht so in `strokeWidth`
       und noch einmal in `alsAnnotation` („der Marker ist auf dem
       Bildschirm viermal so breit wie seine Zahl") — und eine
       Beschriftung, die das verschweigt, wäre die ZWEITE falsche Angabe an
       derselben Stelle: „0,8 mm" an einem Strich, der 3,4 mm breit ist.

       Die Stufen selbst bleiben dieselben Knöpfe mit denselben Werten
       (§8) — nur ihr Wort ändert sich mit dem Werkzeug. */
    const staerkeFaktor = (): number => tools.dataset['tool'] === 'marker' ? 4 : 1;

    /** Die drei Stufen und den Regler neu beschriften — nach Werkzeug. */
    /** Die Tinte, die gerade gewählt ist — dieselbe, die der Strich bekäme. */
    const farbeJetzt = (): string =>
      tools.querySelector<HTMLElement>('.blatt-farbe.on')?.dataset['c']
      || tools.querySelector<HTMLElement>('.blatt-farbe')?.dataset['c']
      || 'currentColor';
    /** Der gewählte Stift — er entscheidet über die Deckung, nicht die Stärke. */
    const stiftJetzt = (): string =>
      tools.querySelector<HTMLElement>('[data-act="stilwahl"].on')?.dataset['stil'] || '';

    const staerkenBeschriften = (): void => {
      const f = staerkeFaktor();
      tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach((knopf, i) => {
        const pt = Number(knopf.dataset['b']) || BREITEN[1];
        const wort = `${BREITEN_NAMEN[i] ?? 'Strich'} · ${alsMm(pt * f)}`;
        knopf.title = `${wort} — die gewählte nochmal antippen: Stärke frei wählen`;
        knopf.setAttribute('aria-label', `Strichstärke ${wort}`);
        /* ══ NAME UND MILLIMETER AUF EINER KACHEL (E623) ══════════════════
           Hier stand: „Auf der Kachel steht NUR die Zahl. Der Name (‚Fein')
           steht im Titel und im `aria-label`; beides auf 32 px Breite wäre
           abgeschnitten." Das galt für die Kachel von E616 — 30 px breit.

           Seit E618 ist die Kachel im Kastenzustand `width:auto` mit
           `min-width:52px` und darf wachsen; und E617 hat für die Stifte
           dasselbe schon getan (‚Kugelschreiber' macht 77 px). Also steht
           jetzt beides da, wo Platz ist.

           WARUM DAS TROTZDEM SICHER IST: unterhalb des Kastens ist das
           Wort geklemmt, nicht `display:none` (E617, §38) — dort ändert
           sich am Bild nichts, und ein Vorleser bekommt weiterhin den
           vollen Namen aus dem `aria-label`. Dass keine Zahl über ihre
           Kachel hinausläuft, misst `test533 §5d`; diese Zusage bleibt und
           ist der Wächter für diese Änderung. */
        const zettel = knopf.querySelector<HTMLElement>('.wort');
        if (zettel) {
          /* ZWEI ZEILEN, NICHT EINE. Der erste Wurf schrieb „Markant ·
             1,8 mm" in eine Zeile — gemessen wuchs die Leiste damit von
             128 auf 143 px, also über die Decke von `test533 §5b` hinaus:
             drei Kacheln je rund 95 statt 52 px sind 129 px mehr, und die
             Tafel bricht um. Untereinander kostet es Höhe statt Breite,
             genau wie beim Wort unter dem Zeichen (W3, E614) — und es ist
             ausserdem die Form auf Redurs Bild.
             Keine Zeichenkette in `innerHTML` (§19), auch wenn hier nichts
             vom Nutzer kommt: zwei Kinder, zweimal `textContent`. */
          let oben = zettel.querySelector<HTMLElement>('.strich-name');
          let unten = zettel.querySelector<HTMLElement>('.strich-mm');
          if (!oben || !unten) {
            zettel.textContent = '';
            oben = document.createElement('span'); oben.className = 'strich-name';
            unten = document.createElement('span'); unten.className = 'strich-mm';
            zettel.append(oben, unten);
          }
          oben.textContent = BREITEN_NAMEN[i] ?? 'Strich';
          unten.textContent = alsMm(pt * f);
        }
        /* ══ DIE STRICHPROBE ZEIGT DEN STRICH (E623) ═══════════════════════
           Der Balken hiess „Strichprobe" und war keine: `bausteine.css`
           gab ihm `background:currentColor` — die TEXTfarbe des Knopfes,
           nicht die gewählte Tinte — und gar keine Deckung. Er sagte also
           „dick" und sonst nichts, obwohl Farbe, Stift und Deckung den
           Unterschied zwischen einem Bleistiftstrich und einem Markerstrich
           derselben Zahl ausmachen.

           Jetzt trägt er beides, und die Deckung kommt aus `deckungVon` —
           derselben Funktion, die den echten Strich und das PDF färbt. */
        const balken = knopf.querySelector<HTMLElement>('i');
        if (balken) {
          balken.style.background = farbeJetzt();
          /* Beim Marker entscheidet seit E704 die SPITZE über die Deckung
             (Keil 0,40, Rund 0,32) — die Kachel sagt, was das Blatt bekommt. */
          const werkzeug = String(tools.dataset.tool || '');
          const deck = deckungVon(werkzeug, werkzeug === 'marker'
            ? (markerSpitzeLesen() === 'keil' ? 'keil' : '') : stiftJetzt());
          balken.style.opacity = String(deck);
        }
      });
      const feld = tools.querySelector<HTMLInputElement>('.blatt-staerke input');
      const zahl = tools.querySelector<HTMLElement>('.blatt-staerke output');
      const wert = Number(feld?.value) || BREITEN[1];
      if (feld) feld.setAttribute('aria-label', `Strichstärke frei wählen, ${alsMm(wert * f)}`);
      if (zahl) zahl.textContent = alsMm(wert * f);
    };

    /* EINMAL BEIM AUFBAU. Die Zeichenkette oben beschriftet für den Stift;
       steht beim Öffnen schon der Marker, gälte sie nicht. */
    staerkenBeschriften();

    /** Der Regler zeigt die Staerke, die gilt — auch nach einem Tipp auf eine Stufe. */
    const staerkeZeigen = (wert: number): void => {
      const feld = tools.querySelector<HTMLInputElement>('.blatt-staerke input');
      const zahl = tools.querySelector<HTMLElement>('.blatt-staerke output');
      if (feld && Number(feld.value) !== wert) feld.value = String(wert);
      if (zahl) zahl.textContent = alsMm(wert * staerkeFaktor());
      if (feld) feld.setAttribute('aria-label',
        `Strichstärke frei wählen, ${alsMm(wert * staerkeFaktor())}`);
    };
    /**
     * EINE STRICHSTÄRKE SETZEN — an allen vier Orten, an denen sie steht
     * (E501, eine Tür).
     *
     * Die Fläche führt sie, `Zeichenziel` merkt sie für die anderen
     * Anzeigen, die Stufenknöpfe zeigen sie, und der Regler nennt ihre
     * Zahl. Wer nur den ersten setzt, hat sie gesetzt und nirgends gezeigt
     * — genau das ist beim Laden einer Voreinstellung passiert, und der
     * Prüflauf sah 1,2 statt 5.
     */
    const strichSetzen = (wert: number): void => {
      controls.setzeStrich(wert);
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.uebernehmeStrich(controls, wert); } catch { /* egal */ }
      }
      tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach(node =>
        node.classList.toggle('on', Number(node.dataset.b) === wert));
      staerkeZeigen(wert);
    };
    /* Der Regler meldet jeden Wert sofort — ohne Klick, ohne Loslassen. */
    tools.addEventListener('input', event => {
      const feld = event.target as HTMLInputElement | null;
      if (!feld || !feld.matches('.blatt-staerke input')) return;
      strichSetzen(Math.max(0.5, Math.min(12, Number(feld.value) || BREITEN[1])));
    });
    /* Die Klappe geht zu, wenn der Blick woandershin geht: Escape, ein
       Tipp ins Blatt (der Regler verliert den Fokus) oder ein anderes
       Werkzeug. Escape wird hier verbraucht, damit nicht zugleich das
       naechste Fenster zugeht (E302: ein Griff, eine Ebene). */
    tools.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !staerkeOffen()) return;
      staerkeAuf(false); event.stopPropagation();
    });
    tools.addEventListener('focusout', event => {
      const label = tools.querySelector<HTMLElement>('.blatt-staerke.auf');
      if (!label) return;
      const zu = event.relatedTarget as HTMLElement | null;
      if (zu && (label.contains(zu) || zu.matches?.('.blatt-strich'))) return;
      staerkeAuf(false);
    });
    /* DIE ADERNREIHE MUSS AUCH BEIM ÖFFNEN STIMMEN (E509).
       Hier stand nichts, und `leiterReihe` lief nur beim Stiftwechsel. Wer
       Redion mit dem Leiterstift schloss und wieder aufmachte, sah die
       fünf gewöhnlichen Farben und einen Stift, der etwas anderes zeichnet
       — der Zustand stand am Knopf und nicht in der Reihe.

       GEFUNDEN HAT ES DAS BILD, nicht der Prüflauf: der klickte sich zum
       Leiterstift durch und löste den Wechsel damit selbst aus. §55 in
       einem Satz. */
    leiterReihe((controls.stilVon ? controls.stilVon() : STIL_VORGABE) === 'leiter');
    if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
      try { Zeichenziel.horche(markiere); } catch { /* dann eben nur die Leiste */ }
    }

    /* Ein Klick auf die Leiste heisst: DIESE Fläche ist gemeint. Bei einer
       einzigen ist das gleichgültig, bei drei Blättern auf einer Seite ist
       es die ganze Frage. */
    tools.addEventListener('pointerdown', () => {
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(controls); } catch { /* egal */ }
      }
    }, true);

    tools.addEventListener('click', event => {
      const target = (event.target as HTMLElement)?.closest?.('button') as HTMLButtonElement | null;
      if (!target || target.disabled) return;
      /* DER BILD-KNOPF SCHALTET NICHT UM (E357): er oeffnet den
         Dateiwaehler; das gewaehlte Werkzeug bleibt, bis das Bild da ist —
         wer abbricht, hat nichts verloren. Danach fuehrt die Auswahl. */
      if (target.dataset.wz && !target.matches('.blatt-strich')) staerkeAuf(false);
      if (target.dataset.wz === 'bild') {
        if (controls.bildEinfuegen) void controls.bildEinfuegen();
        return;
      }
      /* DER FORMEN-KNOPF FÜHRT DIE ZULETZT GEWÄHLTE FORM (E375). Nach
         aussen heisst das Werkzeug weiter `line`/`arrow`/`rectangle`/
         `ellipse` — daran hängen der Zeichner, das Menüband und jede
         gespeicherte Marke. Nur die LEISTE fasst sie zu einem Knopf. */
      if (target.dataset.wz === 'formen') {
        const wahl = formArt;
        controls.setzeWerkzeug(wahl);
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(controls, wahl); } catch { /* egal */ }
        }
        tools.querySelectorAll('[data-wz]').forEach(node => {
          node.classList.remove('on'); node.setAttribute('aria-pressed', 'false'); });
        target.classList.add('on'); target.setAttribute('aria-pressed', 'true');
        tools.dataset.tool = wahl;
        zumWerkzeugRollen('formen');
        return;
      }
      if (target.dataset.wz) {
        controls.setzeWerkzeug(target.dataset.wz);
        /* Auch der Kern muss es wissen — sonst zeigt das Menüband weiter
           das alte Werkzeug an. Derselbe Fehler wie oben, nur andersherum. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(controls, target.dataset.wz); }
          catch { /* egal */ }
        }
        tools.querySelectorAll('[data-wz]').forEach(node => {
          node.classList.remove('on'); node.setAttribute('aria-pressed', 'false'); });
        target.classList.add('on'); target.setAttribute('aria-pressed', 'true');
        tools.dataset.tool = target.dataset.wz;
        zumWerkzeugRollen(target.dataset.wz);
        return;
      }
      /* ══ DIE RADIERERGRÖSSE (E624) ════════════════════════════════════════
         VOR dem `data-act`-Block, nicht darin: die Grössenknöpfe tragen
         kein `data-act`, sondern nur `data-eraser-size`. Innen lag der
         Zweig tot — `test524` sagte „Die Markierung wandert mit (5 → 5)",
         und genau dafür steht der Lauf da. */
      if (target.dataset.eraserSize) {
        const radius = Number(target.dataset.eraserSize);
        if (!RADIER_GROESSEN.includes(radius)) return;
        controls.setEraserSize(radius);
        if (typeof Store !== 'undefined') {
          try {
            Store.setMeta('zeichnen:radierergroesse', radius);
            /* Eine Grösse zu wählen heisst: nicht mehr automatisch. */
            Store.setMeta(M_RADIER_AUTO, 'nein');
          } catch { /* nur diese Sitzung */ }
        }
        /* ALLE LEISTEN ZIEHEN MIT, nicht nur diese. Jedes Blatt baut seine
           eigene Leiste; die des Nachbarblatts entstand, bevor hier gewählt
           wurde. GEMESSEN mit `tools` statt `document`: Seite umblättern,
           und die alte Grösse stand wieder markiert da — genau das hält
           `test524` seit E576 fest („die Wahl gilt für den Menschen, nicht
           für das Blatt"). */
        document.querySelectorAll<HTMLElement>('[data-eraser-size]').forEach(node =>
          node.setAttribute('aria-pressed',
            String(Number(node.dataset.eraserSize) === radius)));
        document.querySelectorAll<HTMLElement>('[data-act="radierauto"]').forEach(haken => {
          haken.setAttribute('aria-pressed', 'false'); haken.classList.remove('on');
        });
        return;
      }
      if (target.dataset.act) {
        if (target.dataset.act === 'undo') controls.undo();
        if (target.dataset.act === 'redo') controls.redo();
        if (target.dataset.act === 'delete') controls.deleteSelection();
        if (target.dataset.act === 'copy' && controls.copySelection) controls.copySelection();
        if (target.dataset.act === 'paste' && controls.paste) controls.paste();
        if (target.dataset.act === 'cut' && controls.cutSelection) controls.cutSelection();
        if (target.dataset.act === 'vor' && controls.nachVorn) controls.nachVorn();
        if (target.dataset.act === 'hinten' && controls.nachHinten) controls.nachHinten();
        if (target.dataset.act === 'sperren' && controls.sperren) { controls.sperren(); return; }
        if (target.dataset.act === 'verweis' && controls.verweisSetzen) { void controls.verweisSetzen(); return; }
        /* E494: die Bibliothek öffnen, und die Auswahl hineinlegen. */
        if (target.dataset.act === 'elemente' && controls.elementWaehlen) {
          void controls.elementWaehlen().then(() => elementKnopfMalen(controls.elementGewaehlt?.()));
          return;
        }
        if (target.dataset.act === 'element-sichern' && controls.elementAusAuswahl) {
          void elementSichernDialog();
          return;
        }
        if (target.dataset.act === 'kritzel' && controls.setzeKritzel) {
          const an = !controls.kritzelAn?.();
          controls.setzeKritzel(an);
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
          return;
        }
        if (target.dataset.act === 'einrichten') {
          /* DER KNOPF SCHALTET DEN MODUS EIN, er öffnet nicht mehr die
             Liste (E571). Redur wollte an Ort und Stelle schieben; die
             Liste steht im Band darunter als „Als Liste" und ist damit
             einen Tipp entfernt — für die Tastatur und für das Zubehör,
             das gerade nicht zu sehen ist. */
          if (controls.ordnenUmschalten) controls.ordnenUmschalten();
          return;
        }
        if (target.dataset.act === 'radierauto') {
          const an = target.getAttribute('aria-pressed') !== 'true';
          controls.setEraserSize(an ? 0 : radierGroesseLesen());
          if (typeof Store !== 'undefined') {
            try { Store.setMeta(M_RADIER_AUTO, an ? 'ja' : 'nein'); } catch { /* nur diese Sitzung */ }
          }
          document.querySelectorAll<HTMLElement>('[data-act="radierauto"]').forEach(haken => {
            haken.setAttribute('aria-pressed', an ? 'true' : 'false');
            haken.classList.toggle('on', an);
          });
          /* Die drei Kreise zeigen wieder, was gilt: bei „automatisch"
             keiner, sonst der gemerkte — und das auf JEDEM Blatt: jedes
             baut seine eigene Leiste, und die des Nachbarn entstand,
             bevor hier gewählt wurde. */
          const gemerkt = radierGroesseLesen();
          document.querySelectorAll<HTMLElement>('[data-eraser-size]').forEach(node =>
            node.setAttribute('aria-pressed',
              String(!an && Number(node.dataset.eraserSize) === gemerkt)));
          return;
        }
        if (target.dataset.act === 'lage') {
          /* WEITER ZUM NÄCHSTEN PLATZ. Ein Rundlauf statt eines Menüs:
             die Leiste zeigt ihr Ergebnis unmittelbar, indem sie
             hinspringt — eine Wahl, die man SIEHT, braucht keine Liste.
             Seit E620 macht das Setzen `lageAnwenden`, denn das Ziehen
             braucht dasselbe und zwei Wege liefen auseinander (§8). */
          lageAnwenden(naechsteLage(LAGEN.findIndex(l => l.id === lageJetzt())).id);
          return;
        }
        if (target.dataset.act === 'laserart') {
          const id = String(target.dataset.laser || 'punkt');
          if (typeof Store !== 'undefined') { try { Store.setMeta(M_LASER, id); } catch { /* nur diese Sitzung */ } }
          tools.querySelectorAll<HTMLElement>('[data-act="laserart"]').forEach(node => {
            const an = node.dataset.laser === id;
            node.classList.toggle('on', an);
            node.setAttribute('aria-pressed', an ? 'true' : 'false');
          });
          return;
        }
        if (target.dataset.act === 'stilwahl' && controls.setzeStil) {
          /* EIN TIPP, EIN STIFT (E512) — kein Weiterschalten mehr. */
          const gewaehlt = STIFTE.find(st => st.id === target.dataset.stil) || STIFTE[0];
          controls.setzeStil(gewaehlt.id);
          stiftZeigen(gewaehlt.id);
          /* Ein Stift zeichnet — wer ihn wechselt, will ihn auch fuehren. */
          if (Zeichenziel.werkzeugVon?.(controls) !== 'stift') {
            controls.setzeWerkzeug('stift');
            try { Zeichenziel.uebernehme(controls, 'stift'); } catch { /* egal */ }
            tools.querySelectorAll('[data-wz]').forEach(node => {
              const an = (node as HTMLElement).dataset.wz === 'stift';
              node.classList.toggle('on', an);
              node.setAttribute('aria-pressed', an ? 'true' : 'false'); });
            tools.dataset.tool = 'stift';
          }
          return;
        }
        /* DIE FORM WÄHLEN (E375) — und sie sofort führen. Wer im Zubehör
           auf „Rechteck" tippt, will ein Rechteck zeichnen, nicht erst
           noch den Knopf darüber suchen. */
        if (target.dataset.act === 'formart' && target.dataset.form) {
          const wahl = String(target.dataset.form);
          if (!istForm(wahl)) return;
          formArt = wahl;
          if (typeof Store !== 'undefined') { try { Store.setMeta('zeichnen:form', wahl); } catch { /* dann eben nur diese Sitzung */ } }
          tools.querySelectorAll<HTMLElement>('[data-act="formart"]').forEach(node => {
            const an = node.dataset.form === wahl;
            node.classList.toggle('on', an);
            node.setAttribute('aria-pressed', an ? 'true' : 'false');
          });
          /* Der Knopf in der oberen Zeile trägt das Zeichen der Form. */
          const kopf = tools.querySelector<HTMLElement>('[data-wz="formen"]');
          const f = FORMEN.find(x => x.id === wahl);
          if (kopf && f) {
            kopf.dataset.form = wahl;
            kopf.title = f.titel + ' — die Form wählst du darunter';
            /* Auch beim Wechsel gezeichnet, nicht als Textzeichen (E515) —
               sonst stünde nach dem ersten Klick wieder ein „□" in einer
               Reihe von gezeichneten Werkzeugen. */
            kopf.innerHTML = `<span class="zeichen" data-sym="${(f as any).sym || 'inkShapes'}" aria-hidden="true"></span>` +
              '<span class="wort">Form</span>';
            try { Register.symbole.fuelle(kopf); } catch { /* dann bleibt es leer */ }
            tools.querySelectorAll('[data-wz]').forEach(node => node.classList.remove('on'));
            kopf.classList.add('on');
          }
          controls.setzeWerkzeug(wahl);
          if (typeof Zeichenziel !== 'undefined') {
            try { Zeichenziel.uebernehme(controls, wahl); } catch { /* egal */ }
          }
          tools.dataset.tool = wahl;
          return;
        }
        if (target.dataset.act === 'radiermodus' && controls.setzeRadierModus) {
          const jetzt = RADIERER.findIndex(r => r.id === target.dataset.modus);
          const naechster = RADIERER[(jetzt + 1) % RADIERER.length]!;
          controls.setzeRadierModus(naechster.id);
          target.dataset.modus = naechster.id;
          target.title = `${naechster.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}`;
          target.innerHTML = `<span class="zeichen" data-sym="${(naechster as any).sym}" aria-hidden="true"></span>` +
            `<span class="wort">${naechster.name}</span>`;
          try { Register.symbole.fuelle(target); } catch { /* dann bleibt es leer */ }
          /* Wer den Radierer einstellt, will radieren. */
          if (Zeichenziel.werkzeugVon?.(controls) !== 'radierer') {
            controls.setzeWerkzeug('radierer');
            try { Zeichenziel.uebernehme(controls, 'radierer'); } catch { /* egal */ }
            tools.querySelectorAll('[data-wz]').forEach(node => node.classList.toggle('on', (node as HTMLElement).dataset.wz === 'radierer'));
            tools.dataset.tool = 'radierer';
          }
          return;
        }
        if (target.dataset.act === 'farbe') { openColorPanel(target); return; }
        /* DIE SCHRIFT (E360): Familie im Kreis, Groesse eine Stufe, Fett
           und Rahmen als Schalter — alles ueber `setzeSchrift`, das auch
           die Auswahl anfasst. */
        if (target.dataset.act === 'schriftart' && controls.setzeSchrift) {
          const jetzt = SCHRIFTEN.findIndex(x => x.id === target.dataset.schrift);
          const naechste = SCHRIFTEN[(jetzt + 1) % SCHRIFTEN.length]!;
          controls.setzeSchrift({ familie: naechste.id });
          target.dataset.schrift = naechste.id;
          target.title = `Schriftart: ${naechste.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}`;
          target.innerHTML = `<span class="zeichen" aria-hidden="true" style="font-family:${naechste.stapel}">Aa</span><span class="wort">${naechste.name}</span>`;
          return;
        }
        if ((target.dataset.act === 'groesser' || target.dataset.act === 'kleiner') && controls.setzeSchrift) {
          controls.setzeSchrift({ schritt: target.dataset.act === 'groesser' ? 1 : -1 });
          const groesser = tools.querySelector<HTMLButtonElement>('[data-act="groesser"]');
          if (groesser && controls.schriftVon) groesser.title = `Schrift grösser (jetzt ${controls.schriftVon().groesse} px)`;
          return;
        }
        if (target.dataset.act === 'ausricht' && controls.setzeSchrift) {
          const jetzt = AUSRICHTUNGEN.findIndex(x => x.id === target.dataset.ausricht);
          const naechste = AUSRICHTUNGEN[(jetzt + 1) % AUSRICHTUNGEN.length]!;
          controls.setzeSchrift({ ausricht: naechste.id });
          target.dataset.ausricht = naechste.id;
          target.title = `Ausrichtung: ${naechste.name} — antippen wechselt: ` +
            AUSRICHTUNGEN.map(x => x.name).join(' → ');
          target.innerHTML = `<span class="zeichen" aria-hidden="true">${naechste.zeichen}</span>` +
            `<span class="wort">${naechste.name}</span>`;
          return;
        }
        if ((target.dataset.act === 'fett' || target.dataset.act === 'rahmen') && controls.setzeSchrift) {
          const an = target.getAttribute('aria-pressed') !== 'true';
          controls.setzeSchrift(target.dataset.act === 'fett' ? { fett: an } : { rahmen: an });
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
          return;
        }
        if (target.dataset.act === 'lineal' && controls.setzeLineal) {
          const an = !controls.linealAn?.();
          controls.setzeLineal(an);
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
        }
        if (target.dataset.act === 'formen' && controls.setzeFormen) {
          const an = !controls.formenAn?.();
          controls.setzeFormen(an);
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
        }
        return;
      }
      if (target.dataset.c) {
        /* Ein Aderntupfer merkt sich, WELCHE Ader er ist — die Farbe allein
           genügt nicht: zwei Adern könnten eines Tages dieselbe haben, und
           der Name soll trotzdem stimmen (E509). */
        if (target.dataset.leiter) leiterMerken(target.dataset.leiter);
        /* DER KLECKS GEHÖRT DEM ANTIPPEN (E511) — nicht der `on`-Klasse:
           die trägt der gewählte Tupfer schon, wenn die Reihe entsteht,
           und dann gewönne der Klecks gegen die Welle. Die Klasse räumt
           sich selbst weg, damit sie beim nächsten Tippen wieder greift. */
        target.classList.add('blatt-farbe-tipp');
        target.addEventListener('animationend',
          () => target.classList.remove('blatt-farbe-tipp'), { once: true });
        controls.setzeFarbe(target.dataset.c);
        /* Dieselbe Gegenrichtung wie beim Werkzeug: sonst stünde oben eine
           Farbe markiert, die niemand mehr benutzt. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehmeFarbe(controls, target.dataset.c); } catch { /* egal */ }
        }
        tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
        /* Die Probe trägt die Tinte, also muss sie eine neue Tinte sehen
           (E623). Dieselbe Stelle, die auch den Marker-Faktor nachträgt. */
        try { staerkenBeschriften(); } catch { /* vor dem Aufbau */ }
        return;
      }
      if (target.dataset.b) {
        /* Die gewaehlte Stufe ein zweites Mal: Klappe mit dem Regler auf
           (oder wieder zu) — der Weg von GoodNotes (E465 Nachtrag). */
        if (target.classList.contains('on')) { staerkeAuf(!staerkeOffen()); return; }
        /* Dieselbe Tür wie der Regler und das Laden einer Voreinstellung
           (E501) — sonst setzt jeder Weg drei von vier Orten. */
        strichSetzen(Number(target.dataset.b));
      }
    });
    /* DIE ZEICHEN MALEN (E515). `data-sym` ist eine Bestellung, kein Bild —
       das Register füllt sie. Ohne das Register bleibt das Feld leer und
       die Wörter tragen die Leiste; deshalb der Griff drumherum. */
    try { Register.symbole.fuelle(tools); } catch { /* dann ohne Zeichen */ }
    row.appendChild(tools);

    /* ══ DER WECHSEL FLIEGT, DER ZUSTAND SITZT (E640) ═══════════════════
     * Die Vorgabe des Design-Systems: nicht zwei Flächen unabhängig aus-
     * und einblenden, sondern EINE, die sich vom alten zum neuen Zustand
     * bewegt. Das Beispiel dort heisst wörtlich „Pen → Marker → Eraser".
     *
     * ERSTER ENTWURF, UND WARUM ER WEG IST. Zuerst lag eine dauerhafte
     * Fläche neben den Knöpfen und wanderte zum gewählten. Sie sah richtig
     * aus — und `test478` hat sie widerlegt: nach einem Farbklick stand sie
     * 55 px neben ihrem Werkzeug, Überdeckung NULL. Der Grund war nicht EIN
     * fehlender Auslöser, sondern die Bauform: eine Stelle, die einmal
     * gerechnet und dann gespeichert wird, veraltet bei jedem Umbruch, bei
     * jedem Rollen, bei jeder Breitenabfrage. Drei Formeln und fünf
     * Auslöser später stand immer noch derselbe Wert da.
     *
     * JETZT TRÄGT DEN GRUND WIEDER DER KNOPF — er kann gar nicht verrutschen,
     * weil er kein eigener Ort ist. Nur der WECHSEL bekommt eine Fläche:
     * eine kurzlebige, die vom alten Knopf zum neuen fliegt und danach
     * verschwindet. Währenddessen hält der neue seinen Grund zurück, damit
     * nie zwei zugleich zu sehen sind.
     *
     * `position:fixed` und Bildschirmmasse: so gibt es keine Frage nach der
     * Hülle, keinen Versatz, keine Rollung — genau die Fragen, an denen der
     * erste Entwurf gescheitert ist.
     * ══════════════════════════════════════════════════════════════════════*/
    let wahlVorher: HTMLElement | null =
      tools.querySelector<HTMLElement>('button[data-wz].on');
    /* DIE LAUFENDE FLÄCHE, falls gerade eine unterwegs ist. Sie steht hier
       und nicht in `wahlFliegen`, weil der NÄCHSTE Wechsel sie braucht. */
    let flugJetzt: HTMLElement | null = null;
    const wahlFliegen = (): void => {
      const neu = tools.querySelector<HTMLElement>('button[data-wz].on');
      const alt = wahlVorher;
      if (neu === alt) return;
      wahlVorher = neu;
      if (!alt || !neu) return;
      /* Ohne Bewegung KEIN Flug — der Zustand ist trotzdem sofort richtig,
         weil er am Knopf hängt und nicht am Flug (§38). */
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      /* ══ UNTERBRECHEN, NICHT ANSTELLEN ═══════════════════════════════
       * Wer schnell A → B → C tippt, soll EINE Fläche sehen, die ihre
       * Richtung ändert — nicht zwei, die nebeneinander herfliegen. Die
       * laufende wird deshalb dort abgeholt, wo sie GERADE ist
       * (`getBoundingClientRect` gibt den gemalten Zwischenstand, nicht das
       * Ziel), und die neue startet von dort. So geht die Stelle nicht
       * verloren, und es springt nichts zurück.
       * Ohne das lag hier eine Warteschlange, und das Design-System
       * verbietet sie ausdrücklich. Gesehen beim Gegenlesen des eigenen
       * Bogens, nicht im Bild — zwei Flächen sieht man erst, wenn man
       * schnell genug tippt. */
      const laeuft = flugJetzt?.getBoundingClientRect();
      if (flugJetzt) { flugJetzt.remove(); flugJetzt = null; }
      const von = laeuft && laeuft.width ? laeuft : alt.getBoundingClientRect();
      const nach = neu.getBoundingClientRect();
      if (!von.width || !nach.width) return;
      /* Kein Flug über null Weg — und keiner quer über eine umgebrochene
         Leiste: was mehr als eine Zeile überspringt, wäre kein Weg mehr,
         sondern ein Strich quer durchs Bild. */
      if (Math.abs(von.left - nach.left) < 1 && Math.abs(von.top - nach.top) < 1) return;
      if (Math.abs(von.top - nach.top) > von.height * 1.5) return;

      const flug = document.createElement('i');
      flug.className = 'bw-flug';
      flug.setAttribute('aria-hidden', 'true');
      document.body.append(flug);
      flugJetzt = flug;
      /* Wer vorher wartete, wartet nicht mehr: sonst bliebe ein
         überholtes Ziel blass stehen. */
      tools.querySelectorAll('.bw-wartet').forEach(k => k.classList.remove('bw-wartet'));
      neu.classList.add('bw-wartet');

      const fertig = (): void => {
        flug.remove();
        if (flugJetzt === flug) flugJetzt = null;
        neu.classList.remove('bw-wartet');
      };

      /* ══ DIE BAHN KOMMT AUS `SelectionFlow` (E647) ══════════════════════
       * Hier stand ein Übergang auf `left`, `top`, `width` und `height` —
       * VIER Layout-Eigenschaften. Genau daran ist die untere Leiste
       * gescheitert (E646): eine Bewegung, die Layout animiert, bleibt auf
       * dem Hauptfaden und kommt nicht voran, während dort gearbeitet wird.
       * Und hier wird gearbeitet: man wechselt das Werkzeug MITTEN IM
       * Zeichnen auf einem PDF.
       *
       * `fliege` rechnet dieselbe Feder auf `transform` um (FLIP: das
       * Element bekommt die Masse des Ziels und wird dorthin
       * zurückgeschoben, wo es herkommt). Damit darf die Bewegung auf den
       * Compositor.
       *
       * Die zwei Bilder Wartezeit, die hier standen, braucht es nicht mehr:
       * eine Keyframe-Bahn hat ihren Startwert IN sich und nicht im zuvor
       * gemalten Zustand — die Falle aus E639 gibt es bei ihr nicht. */
      const bahn = typeof SelectionFlow === 'undefined'
        ? null : SelectionFlow.fliege(flug, von, nach);

      if (!bahn) {
        /* Ohne das Modul fliegt nichts — der Zustand stimmt trotzdem, weil
           er am Knopf hängt und nicht am Flug (§38). */
        fertig();
        return;
      }
      bahn.finished.then(fertig).catch(() => { /* abgebrochen */ });
      /* EIN NETZ. Eine Bewegung, die nie beginnt (Fenster im Hintergrund),
         meldet auch kein Ende — dann bliebe der neue Knopf für immer ohne
         Grund. Die Zahl hängt an der Federdauer statt an einer geratenen
         700: eine Uhr neben einer Animation soll wenigstens wissen, wie
         lang diese ist. */
      setTimeout(fertig, SelectionFlow.DAUER + 250);
    };
    try {
      new MutationObserver(wahlFliegen).observe(tools, {
        attributes: true, attributeFilter: ['class'], subtree: true
      });
    } catch { /* ohne Beobachter wechselt der Grund ohne Flug — der Zustand
                 stimmt trotzdem, weil er am Knopf hängt */ }

    if (extra) {
      const fixed = document.createElement('div');
      fixed.className = 'blatt-fest'; fixed.innerHTML = extra; row.appendChild(fixed);
    }
    /* E572: Das Dokumentstudio nutzt dieselben echten Knöpfe. Die normale
       Blockleiste und ihre frei gespeicherte Ordnung bleiben unverändert. */
    const noteColors = [
      ['#ffb2bd', 'Rosa'], ['#ffd09e', 'Apricot'], ['#ffe780', 'Gelb'],
      ['#b9efa0', 'Grün'], ['#a9e9e4', 'Türkis'], ['#c5dfff', 'Blau'],
      ['#e7d4fb', 'Flieder'], ['#f6c8e8', 'Pink'], ['#e6e3dd', 'Grau']
    ];
    tools.addEventListener('ink-studio-ready', () => {
      if (tools.dataset.referenceUi) return;
      tools.dataset.referenceUi = 'ready';
      const cycle = tools.querySelector<HTMLButtonElement>('[data-act="radiermodus"]')!;
      const choose = document.createElement('button');
      choose.dataset.gruppe = 'radierer'; choose.dataset.act = 'eraser-menu';
      choose.className = 'blatt-eraser-menu'; choose.type = 'button';
      choose.setAttribute('aria-haspopup', 'dialog');
      const syncEraser = () => {
        choose.textContent = (RADIERER.find(mode => mode.id === cycle.dataset.modus)?.name || 'Ganz') + ' ⌄';
        choose.setAttribute('aria-label', 'Radiermodus wählen: ' + choose.textContent);
      };
      syncEraser(); cycle.after(choose);
      new MutationObserver(syncEraser).observe(cycle, { attributes: true, attributeFilter: ['data-modus'] });
      choose.addEventListener('click', () => InkMenu.open(choose, 'Radierer', (body, close) => {
        for (const mode of RADIERER) {
          const option = document.createElement('button'); option.type = 'button';
          option.textContent = mode.name; option.title = mode.titel;
          option.setAttribute('aria-pressed', String(mode.id === cycle.dataset.modus));
          option.addEventListener('click', () => {
            for (let i = 0; i < RADIERER.length && cycle.dataset.modus !== mode.id; i++) cycle.click();
            close();
          }); body.append(option);
        }
      }));
      /* ══ DIE GRÖSSEN STEHEN JETZT IN DER LEISTE (E624) ════════════════
         Hier wurden sie bis zum 19. September 2026 erzeugt — und damit
         gab es sie nur im Studio, weil `ink-studio-ready` nur dort
         ausgelöst wird. Gebaut werden sie seither in der gewöhnlichen
         Leiste; das Studio bekommt sie damit von selbst, und niemand baut
         dieselben drei Knöpfe zweimal (§8). Das Modusfeld darüber bleibt
         hier: es ist wirklich nur im Studio.

         Die Knöpfe sollen trotzdem VOR dem Modusfeld stehen, wie bisher —
         sie sind im HTML schon da, also werden sie nur umgehängt. */
      tools.querySelectorAll<HTMLElement>('[data-eraser-size]')
        .forEach(node => choose.before(node));
      /* Und die gemerkte Wahl gilt — es sei denn, der Haken steht auf
         „automatisch" (E624). Genau diese Zeile war der Grund, warum es
         keinen Weg zurück gab: sie setzte immer eine Zahl. */
      controls.setEraserSize(radierAutoLesen() ? 0 : radierGroesseLesen());
      for (const [color, name] of noteColors) {
        const swatch = document.createElement('button'); swatch.type = 'button';
        swatch.className = 'blatt-farbe blatt-note-color'; swatch.dataset.c = color;
        /* ══ EINE EIGENE GRUPPE, NICHT DIE DER TINTE (E574) ═══════════════════
           Hier stand `'farbe'`. Gemessen war die Folge: die neun Pastelle
           standen in JEDEM Werkzeug — beim Stift, beim Marker, bei der
           Schrift —, also vierzehn Tupfer, von denen neun zu einem Werkzeug
           gehören, das gerade nicht gewählt ist. Und weil `leiterReihe()`
           die Adern ebenfalls vor das „+" hängt, `ink-studio-ready` die
           Pastelle aber DANACH erzeugt, kamen sie nach einem Neustart mit
           dem Leiterstift mitten in die Adernreihe: `blatt-farbe-weg` war
           schon verteilt, als es sie noch nicht gab.
           `notizfarbe` steht in der Gruppenliste (E356) nur beim Werkzeug
           `zettel`. Damit gilt die Regel an jeder Stelle gleich, ohne dass
           irgendwer nachträglich eine Klasse verteilen muss. */
        swatch.dataset.gruppe = 'notizfarbe'; swatch.style.backgroundColor = color!;
        swatch.setAttribute('aria-label', 'Haftnotiz ' + name); swatch.title = name!;
        tools.querySelector('.blatt-farbe-neu')?.before(swatch);
      }
      ordnungAnwenden(tools);
    });
    tools.addEventListener('ink-panel', event => {
      const { kind, anchor } = (event as CustomEvent<{ kind: string; anchor: HTMLElement }>).detail;
      if (kind === 'laser') InkMenu.open(anchor, 'Laserpointer', (body, close) => {
        body.classList.add('blatt-laser-options');
        for (const mode of LASER) {
          const option = document.createElement('button'); option.type = 'button';
          option.dataset.laserOption = mode.id; option.setAttribute('aria-pressed', String(mode.id === laserArt()));
          option.innerHTML = '<i aria-hidden="true"></i><span>' + mode.name + '</span>';
          option.onclick = () => { tools.querySelector<HTMLButtonElement>(`[data-laser="${mode.id}"]`)?.click(); close(); };
          body.append(option);
        }
      });
      if (kind === 'elemente') InkMenu.open(anchor, 'Elemente & Haftnotizen', (body, close) => {
        const tabs = document.createElement('div'); tabs.className = 'blatt-gallery-tabs';
        const grid = document.createElement('div'); grid.className = 'blatt-gallery-grid';
        for (const kind of ['Elemente', 'Haftnotizen']) {
          const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = kind;
          const show = () => {
            tabs.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === tab)));
            grid.replaceChildren();
            if (kind === 'Haftnotizen') {
              for (const [color, name] of noteColors) {
                const card = document.createElement('button'); card.type = 'button'; card.className = 'blatt-note-preview';
                card.style.setProperty('--note-color', color!); card.textContent = name!;
                card.onclick = () => {
                  tools.querySelector<HTMLButtonElement>('[data-wz="zettel"]')?.click();
                  tools.querySelector<HTMLButtonElement>(`.blatt-note-color[data-c="${color}"]`)?.click(); close();
                }; grid.append(card);
              }
            } else {
              const all = elemente();
              if (!all.length) { const empty = document.createElement('p'); empty.className = 'blatt-gallery-empty'; empty.textContent = 'Deine eigenen Sticker: mit dem Lasso etwas auswählen und „Als Element“ sichern. Oder eine Haftnotiz wählen und auf dem Papier aufziehen.'; grid.append(empty); }
              for (const item of all) {
                const card = document.createElement('button'); card.type = 'button'; card.className = 'blatt-element-preview';
                const name = document.createElement('span'); name.textContent = item.name;
                card.append(elementBild(item), name);
                card.onclick = () => { controls.selectElement(item.id); close(); }; grid.append(card);
              }
            }
          };
          tab.onclick = show; tabs.append(tab); if (kind === 'Elemente') show();
        }
        body.append(tabs, grid);
        const manage = document.createElement('button'); manage.type = 'button'; manage.textContent = 'Bibliothek verwalten …';
        manage.onclick = () => { close(); tools.querySelector<HTMLButtonElement>('[data-act="elemente"]')?.click(); };
        body.append(manage);
      });
    });
    return row;
  };

  /* ---- TASTEN WIE GOODNOTES (E465) --------------------------------------
   * P Stift · 2 Bleistift · H Marker · E Radierer · S Form · V Auswahl ·
   * T Text · A Abdecken · N Haftnotiz · M Fachzeichen · R Lineal · I Bild.
   * Ein Buchstabe ohne Strg — deshalb nur, wenn gerade NIEMAND tippt (kein
   * Eingabefeld, nichts Editierbares im Fokus) und eine Zeichenflaeche
   * ueberhaupt da ist. Die Liste steht auch in `register/tasten.ts`, damit
   * die Uebersicht sie zeigt; test438 haelt beide zusammen.
   * ---------------------------------------------------------------------- */
  const TASTEN: Record<string, string> = {
    p: 'stift', '2': 'bleistift', h: 'marker', e: 'radierer', s: 'formen', v: 'select',
    t: 'text', a: 'abdeck', n: 'zettel', m: 'zeichen', r: 'lineal', i: 'bild'
  };
  const tippt = (): boolean => {
    const a = document.activeElement as HTMLElement | null;
    if (!a) return false;
    const tag = a.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable;
  };
  /** Die Leiste der aktiven Flaeche — ueber sie laufen die Kuerzel, damit
   *  Knopf und Zustand denselben Weg gehen wie beim Tippen mit der Hand. */
  const aktiveLeiste = (): HTMLElement | null => {
    const s = typeof Zeichenziel !== 'undefined' ? Zeichenziel.aktive() : null;
    const flaeche = s && (s as any).flaeche as Element | undefined;
    const huelle = flaeche?.closest('.blatt-huelle, .document-stage, .blatt, .pdfs, .page') || document;
    return huelle.querySelector<HTMLElement>('.blatt-werk') || document.querySelector<HTMLElement>('.blatt-werk');
  };
  /* ══ EINE TASTE ÖFFNET KEINE TÜR, DIE ZU IST (E578) ═══════════════════════
     GEMESSEN am 15. September 2026 im Dokumentstudio, Fenster 1440 × 960:

       frisch geöffnet   tool=stift      pointer-events=auto
       im Lesemodus      tool=schreiben  pointer-events=none    richtig
       nach der Taste P  tool=stift      pointer-events=auto    FALSCH
       ein Zug danach    marken 0 → 1                           GEZEICHNET

     Der Lesemodus klappt die ganze Werkzeugleiste ein
     (`[data-document-tools="closed"]` → `.blatt-reihe{display:none}`). Dieser
     Griff sucht sich `.blatt-werk` aber mit `querySelector` und klickte darin
     einen Knopf, den NIEMAND sehen kann — und der holte die Zeichenschicht
     zurück. Ein Dokument, das man ausdrücklich zum Lesen geöffnet hat, nahm
     damit Striche an (§46 Punkt 1, §51).

     DIE REGEL IST ALLGEMEINER ALS DER LESEMODUS und deshalb die richtige:
     eine Abkürzung darf nur drücken, was auch eine Hand drücken könnte. Ohne
     weiteres Zutun gilt sie damit auch für die gesperrte Seite
     (`page.gesperrt`) und für fehlende Rechte (`Konten.darf('bearbeiten',…)`)
     — beide klappen dieselbe Leiste ein. Und `marken.ts` muss dafür nichts
     über den Dokumentmodus wissen (§5).

     `getClientRects()` und nicht `offsetParent`: ein Knopf in einer fest
     positionierten Leiste hat kein `offsetParent` und wäre fälschlich „weg". */
  const greifbar = (knopf: HTMLElement | null | undefined): boolean =>
    !!knopf && !(knopf as HTMLButtonElement).disabled && knopf.getClientRects().length > 0;
  /** Drückt einen Knopf, wenn er wirklich da ist. Sagt, ob es geklappt hat. */
  const druecke = (knopf: HTMLButtonElement | null | undefined): boolean => {
    if (!greifbar(knopf)) return false;
    knopf!.click(); return true;
  };
  const kuerzel = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (tippt()) return;
    if (typeof Zeichenziel === 'undefined' || !Zeichenziel.da()) return;
    const ziel = TASTEN[event.key.toLowerCase()];
    if (!ziel) return;
    const leiste = aktiveLeiste();
    if (!leiste) return;
    /* ══ DIE ZWEITE TÜR: DIE OBERE REIHE (E578) ═══════════════════════════
       Im Dokumentstudio stehen die WERKZEUGE oben im Band und nicht im
       unteren Dock — dort sind die `[data-wz]` mit Absicht `display:none`
       (E573). Ein Griff, der nur den unteren Knopf kennt, tut im Studio also
       gar nichts. Er nimmt deshalb den oberen, wenn der untere nicht
       greifbar ist; beide Wege enden ohnehin an derselben Zeichenmaschine.
       Und im Lesemodus ist auch der obere `disabled` — damit greift die
       Regel „nur drücken, was eine Hand drücken könnte" von selbst. */
    const oben = document.querySelector<HTMLElement>('.document-drawingbar');
    const werkzeug = (id: string): boolean =>
      druecke(leiste.querySelector<HTMLButtonElement>(`[data-wz="${id}"]`))
      || druecke(oben?.querySelector<HTMLButtonElement>(`[data-document-tool="${id}"]`));
    /* `preventDefault()` erst, wenn wirklich etwas gedrückt wurde: wer im
       Lesemodus „p" tippt, soll das „p" behalten. */
    if (ziel === 'bleistift') {
      /* Der Bleistift ist ein Stift mit Stil — seit E512 ein Knopf in der
         Reihe, kein Weiterschalten mehr. */
      if (druecke(leiste.querySelector<HTMLButtonElement>('[data-act="stilwahl"][data-stil="bleistift"]'))) event.preventDefault();
      if (Zeichenziel.jetzt() !== 'stift' && werkzeug('stift')) event.preventDefault();
      return;
    }
    /* ══ P WECHSELT WEITER, WENN DER STIFT SCHON FÜHRT (E512) ═════════════
       Der Wechselknopf aus E351 ist der Reihe gewichen. Damit die alte
       Bewegung — ein Tipp, der nächste Stift — nicht verlorengeht, tut sie
       jetzt die Taste: `P` holt den Stift, und `P` noch einmal geht weiter.
       Dieselbe Gewohnheit wie in GoodNotes, wo die Werkzeugtaste zweimal
       gedrückt die Sorte wechselt. */
    if (ziel === 'stift' && Zeichenziel.jetzt() === 'stift') {
      const jetzt = leiste.querySelector<HTMLElement>('[data-act="stilwahl"].on');
      const i = STIFTE.findIndex(st => st.id === jetzt?.dataset.stil);
      const naechster = STIFTE[(i + 1) % STIFTE.length]!;
      if (druecke(leiste.querySelector<HTMLButtonElement>(`[data-act="stilwahl"][data-stil="${naechster.id}"]`))) event.preventDefault();
      return;
    }
    if (ziel === 'lineal') {
      if (druecke(leiste.querySelector<HTMLButtonElement>('[data-act="lineal"]'))
        || druecke(oben?.querySelector<HTMLButtonElement>('[data-document-action="ink-ruler"]'))) event.preventDefault();
      return;
    }
    if (werkzeug(ziel)) event.preventDefault();
  };
  if (typeof document !== 'undefined') document.addEventListener('keydown', kuerzel);

  return { schicht, leiste, zeichneMarke, verlaufDefs, annotierbar, alsAnnotation,
           FARBEN, BREITEN, STIFTE, LEITER, LASER, FORMEN, WERKZEUGE, artWort, artZeichen,
    druckFaktor, RADIERER, TASTEN,
    /* E704 nach aussen — damit `test583` an diesen Werten misst. */
    TINTEN, LEUCHTFARBEN, MARKER_PASTELLE, TEXTMARKER_FARBE, PAPIERWEISS, MARKER_SPITZEN,
    deckungVon, strokeWidth, halbeBreiten, kontrastZu, relativeHelligkeit, papierfarbeVon,
    strichprobeMarke, markerSpitzeLesen,
    /* DIE FARBSÄTZE NACH AUSSEN (E486). Nicht, damit jemand anders eine
       zweite Leiste baut — sondern damit der Prüflauf an derselben Rechnung
       misst, die die Leiste benutzt. Eine Prüfung, die die Meta-Liste selbst
       zusammensetzt, prüft ihre eigene Abschrift. */
    HOECHSTENS_EIGENE_FARBEN, HOECHSTENS_FARBSAETZE,
    eigeneFarben, farbenSetzen, farbenZuruecksetzen,
    farbsaetze, farbsatzSichern, farbsatzLaden, farbsatzLoeschen,
    /* DIE ELEMENTE-BIBLIOTHEK NACH AUSSEN (E494) — aus demselben Grund:
       der Prüflauf soll an DIESER Rechnung messen, nicht an einer eigenen
       Abschrift der Meta-Liste. */
    HOECHSTENS_ELEMENTE, HOECHSTENS_ELEMENT_BYTES,
    elemente, elementSichern, elementLoeschen, elementHolen, elementMarken,
    zwischenablage: (): any[] => zwischenablage.map(mark => clone(mark)) };
})();

(window as any).Marken = Marken;
