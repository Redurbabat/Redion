/* ============================================================================
 * status.js — Der Umsetzungsstand
 * ----------------------------------------------------------------------------
 * Alle 16 Teile der Notion-Dokumentation, Anforderung für Anforderung,
 * mit ehrlichem Vermerk: erledigt, teilweise oder offen.
 *
 * Der Befehl „Umsetzungsstand" legt daraus eine Seite in dieser App an.
 * Erledigtes steht als abgehakte Aufgabe (durchgestrichen), Offenes als
 * leere Aufgabe. Jeder Teil bekommt einen eigenen Abschnitt — alles auf
 * einer einzigen Seite.
 *
 *   f = fertig      t = teilweise      o = offen
 * ==========================================================================*/

const Status = (() => {

  const TEILE = [

  ['Teil 1', 'Notion-Grundlagen', [
    ['f', 'Hierarchie Arbeitsbereich → Seite → Block → Datenbank → Eintrag → Eigenschaft'],
    ['f', 'Alles ist ein Block: verschiebbar, duplizierbar, in anderen Typ umwandelbar'],
    ['f', 'Jeder Datenbankeintrag als eigene Seite mit freiem Textbereich'],
    ['f', 'Slash-Menü mit / öffnen, tippend filtern, Enter einfügen, Esc schliessen'],
    ['f', 'Markdown beim Tippen: #, -, 1., [], >, ", ---, **fett**'],
    ['f', 'Elf Ansichtstypen je Datenbank — alle gebaut, Karte mit OpenStreetMap'],
    ['f', 'Mehrere Ansichten auf denselben Daten, nur Filter, Sortierung und Layout unterscheiden'],
    ['f', 'Eigenschaftstypen inklusive Formel, Verknüpfung, Rollup, Status, Erstellt am, ID'],
    ['f', 'Genau eine Titelspalte je Datenbank, nicht löschbar'],
    ['f', 'Formeleditor mit Gültig- und Fehleranzeige und Funktionsliste'],
    ['f', 'Textverkettung mit +, concat() nur für Listen'],
    ['f', 'Werkzeugleiste: Filter, Sortieren, Suchen, Eigenschaften, Neu mit Vorlage'],
    ['f', 'Papierkorb mit Wiederherstellen und einstellbarer Frist (7, 30, 90 Tage oder nie)'],
    ['f', 'Volltextsuche mit Trefferliste, Pfadanzeige und Vorschau rechts']
  ]],

  ['Teil 2', 'Vier Beispiel-Apps', [
    ['t', 'Vier fertige Unterseiten: Gym, Kalorien, Musik, persönliche Analyse', 'Gym und Ernährung stecken im Fitness-OS; Musik und Analyse fehlen'],
    ['f', 'Gym-App aus drei Datenbanken: Übungskatalog, Tagebuch, Satzprotokoll — in der Galerie'],
    ['f', 'Übungskatalog mit Muskelgruppe, Gerät, Schwierigkeit, Ersatzübung'],
    ['f', 'Satzprotokoll: eine Zeile je Satz mit Gewicht, Wiederholungen, RPE, Volumen, 1RM'],
    ['f', 'Formel Volumen: Gewicht × Wiederholungen'],
    ['f', 'Formel Kalorien je Portion: kcal/100 g × Portion / 100'],
    ['f', 'Bewertungsformel mit ifs() und Schwellenwerten'],
    ['f', 'Intensitätsformel aus RPE mit Farbstufen'],
    ['f', 'Tages-Score als Summe von Kontrollkästchen über toNumber()'],
    ['f', 'Ampel-Auswahl mit farbigen Optionen'],
    ['f', 'Board mit Ziehen und Ablegen, das den Auswahlwert sofort ändert'],
    ['f', 'Verknüpfung anlegen mit Ziel, Limit und wechselseitiger Gegenspalte'],
    ['f', 'Rollup aus Verknüpfung, Eigenschaft und Berechnung'],
    ['f', 'Spaltensumme über die Zeile „Berechnen" unter der Tabelle']
  ]],

  ['Teil 3', 'Interner Aufbau und Code', [
    ['f', 'Vier Speicher: Blöcke, Sammlungen, Ansichten, Einstellungen'],
    ['f', 'Datenbank aus Block, Sammlungs-ID und Ansichts-IDs zusammengesetzt'],
    ['f', 'Datenbankzeile als Block vom Typ Seite mit Elterntabelle „collection"'],
    ['f', 'Spalten über kurze Zufallsschlüssel, Titelspalte heisst title'],
    ['f', 'Umbenennen bricht keine Formel — Formeln laufen über den Anzeigenamen'],
    ['t', 'Werte in Notions verschachtelter Form [["80"]]', 'hier bewusst flach gespeichert, gleiche Bedeutung'],
    ['t', 'Formelcode als Baum mit Version v2', 'eigener Parser, eigener Baum'],
    ['f', 'Sechs Diagrammtypen mit Achsen und Aggregation, inklusive Kennzahl'],
    ['f', 'Datumsgruppierung im Diagramm nach Tag, Woche, Monat, Quartal und Jahr'],
    ['f', 'Relative Datumsfilter: letzte 7 und 30 Tage, letzte und nächste Woche, Vergangenheit, Zukunft'],
    ['f', 'Wechselseitige Verknüpfungen — die Gegenseite trägt sich selbst ein'],
    ['o', 'Interne API-Endpunkte loadPageChunk, queryCollection, saveTransactionsFanout', 'ohne Server sinnlos'],
    ['f', 'Seiten-IDs im Muster 8-4-4-4-12'],
    ['o', 'Transaktionsbefehle set, update, listAfter, listBefore, listRemove', 'direkt im Speicher statt über Transaktionen']
  ]],

  ['Teil 4', 'KI und Planvergleich', [
    ['f', 'Arbeitsbereiche strikt trennen — die KI sieht nur diesen einen'],
    ['t', 'KI baut Seiten, Datenbanken, Verknüpfungen, Rollups und Formeln', 'Seiten und Datenbanken mit Spalten, Optionen und Beispielzeilen; Verknüpfungen legst du selbst an'],
    ['f', 'Jeden KI-Schritt protokollieren — mit Rückgängig je Schritt'],
    ['t', 'Ergebniskarte mit Kopieren, Einfügen, Rückgängig', 'Einfügen und Rückgängig vorhanden, keine Daumen'],
    ['f', 'Rückgängig nimmt eine ganze Mehrschritt-Aktion zurück'],
    ['f', 'Protokollfenster sammelt alles, was die KI angelegt hat'],
    ['f', 'Prompt-Regeln in der Anleitung erklärt'],
    ['t', 'Sechs Automatisierungs-Auslöser', 'fünf umgesetzt, inklusive Zeitauslöser vor und nach einem Datum'],
    ['t', 'Automatisierungs-Aktionen', 'sechs umgesetzt; Slack und Webhook brauchen einen Server'],
    ['f', 'Automationen lösen keine Automationen aus'],
    ['t', '21 Berechnungsarten', '15 umgesetzt, darunter Prozent aktiviert und Zeitspanne'],
    ['f', 'Keine Planlimits — alles unbegrenzt und kostenlos'],
    ['f', 'Modellauswahl: Ollama, WebLLM und sechs Anbieter mit eigenem Schlüssel'],
    ['t', 'Quellen einzeln ein- und ausschalten', 'Seitenkontext an oder aus, Wikipedia auf Zuruf']
  ]],

  ['Teil 5', 'Jeder Button', [
    ['t', 'Seitenleiste mit 32 Elementen', '20 umgesetzt; Mitglieder, Teamspace-Verwaltung entfallen ohne Server'],
    ['f', 'Abschnitte Privat, Favoriten und Bereiche getrennt darstellen'],
    ['t', 'Bereichs-Zeile mit Pfeil, Plus und Drei-Punkte-Menü', 'Pfeil und Plus da, Bereichsmenü über Einstellungen'],
    ['t', 'Kopfzeile mit 16 Elementen inklusive Teilen, Stern, Schloss', '11 umgesetzt'],
    ['f', 'Drei-Punkte-Seitenmenü mit über 20 Einträgen'],
    ['f', 'Seitenstil umschalten: Standard, Serif, Mono, kleiner Text, volle Breite'],
    ['f', 'Block-Griff ⋮⋮ links mit vollem Menü; Ziehen verschiebt den Block'],
    ['f', 'Hilfslinie beim Ziehen zeigt oberhalb oder unterhalb, je nach Mauszeiger'],
    ['f', 'Slash-Menü mit 58 Einträgen in sieben Kategorien', '64 Bausteine in sieben Gruppen'],
    ['f', 'Synchronisierter Block, Knopf, Spalten und Toggle-Überschriften'],
    ['f', 'Datenbank-Kopfzeile mit Filter und Sortierung je Ansicht'],
    ['f', 'Acht Ansichtstypen: Tabelle, Board, Kalender, Liste, Galerie, Zeitstrahl, Diagramm, Formular'],
    ['f', 'Spaltenmenü mit Fixieren, Umbruch, Verschieben, Duplizieren, Beschreibung'],
    ['f', 'Zeilen-Kontextmenü mit Sammelbearbeitung, Sammellöschen, Einfügen darüber und darunter']
  ]],

  ['Teil 6', 'Tastenkürzel und Einstellungen', [
    ['t', '160 Tastenkürzel', 'über 60 umgesetzt, alle wichtigen dabei'],
    ['f', 'Strg+Alt+0 bis 9 wandeln Blöcke um'],
    ['f', 'Strg+P und Strg+K öffnen die Suche'],
    ['f', 'Strg+[ zurück, Strg+] vorwärts, Strg+\\ Seitenleiste, Strg+Shift+L Hell/Dunkel'],
    ['f', 'Speichern ist unnötig — alles sichert automatisch'],
    ['f', 'Strg+A wählt stufenweise: erst den Block, dann die ganze Seite'],
    ['f', 'Shift+Enter erzeugt Zeilenumbruch, Enter einen neuen Block'],
    ['f', 'Strg+D dupliziert, Strg+Shift+↑↓ verschiebt'],
    ['f', 'Alt beim Ziehen dupliziert statt zu verschieben'],
    ['f', 'Strg+Alt+T öffnet oder schliesst alle Toggles'],
    ['f', 'Datenbank-Navigation per Tab, Pfeiltasten, Enter zum Bearbeiten und Entf zum Leeren'],
    ['f', 'Markdown beim Tippen wandelt sofort um'],
    ['f', 'Auslöser @, [[, # und : für Erwähnungen, Links, Schlagwörter und Emojis'],
    ['t', 'Einstellungen in 15 Bereichen', 'zwölf Bereiche mit über 70 Optionen; SSO, Mitglieder, Audit-Log entfallen']
  ]],

  ['Teil 7', 'Formelsprache und Filter', [
    ['f', 'Alle in der Doku genannten Formelfunktionen laufen — 84 plus Methodenschreibweise'],
    ['f', 'Text mit + verketten, concat() nur für Listen'],
    ['f', 'Operatoren inklusive and, or, not, empty(), current und Fragezeichen-Doppelpunkt'],
    ['f', 'if, ifs, empty, equal, unequal, let und lets'],
    ['f', 'Mathefunktionen bis cbrt, log2, sign, median'],
    ['f', 'Textfunktionen mit regulären Ausdrücken: test, match, replace, replaceAll'],
    ['f', 'Listenfunktionen map, filter, find, some, every, unique, flat'],
    ['f', 'Datumsfunktionen; now() mit Uhrzeit, today() ohne'],
    ['f', 'Verknüpfungen per map(current.prop(...)) auslesen'],
    ['t', '29 Eigenschaftstypen mit genau einer Titelspalte', '21 Typen umgesetzt'],
    ['f', 'Verknüpfung einseitig oder wechselseitig, mit Limit eine oder mehrere'],
    ['f', 'Zahl, Formel und Rollup als Zahl, Balken oder Ring anzeigen'],
    ['f', 'Filteroperatoren je Typ'],
    ['f', 'Filtergruppen mit UND/ODER, mehrere Ebenen tief']
  ]],

  ['Teil 8', 'Automationen, Formulare, Diagramme', [
    ['f', 'Automation aus Auslöser und Aktion zusammensetzen'],
    ['t', '15 Auslöser, 24 Bedingungen, 19 Aktionen', 'fünf Auslöser mit Zeitauslösern, sechs Aktionen, Bedingungen frei kombinierbar'],
    ['f', 'Automationen lösen keine weiteren Automationen aus'],
    ['f', 'Geltungsbereich ganze Datenbank oder eine bestimmte Ansicht'],
    ['f', 'Aktion „Webhook senden" — Adresse in den Einstellungen oder je Automation'],
    ['f', 'Knopf-Block mit mehreren Aktionen in Reihenfolge'],
    ['f', 'Knopf fragt vor dem Ausführen nach, wenn gewünscht'],
    ['t', 'Formularansicht mit 13 Fragetypen', 'alle passenden Typen ausser Formel, Rollup, Erstellt am'],
    ['f', 'Bedingte Logik blendet Fragen je nach Antwort ein'],
    ['f', 'Sechs Diagrammtypen: Säule, Balken, Linie, Fläche, Ring, Kennzahl'],
    ['t', '21 Aggregationen für Diagramme', 'elf umgesetzt: Anzahl, Summe, Durchschnitt, Median, Min, Max, Spanne und mehr'],
    ['f', 'Wiederkehrende Vorlagen täglich bis jährlich'],
    ['o', 'Berechtigungsmatrix mit fünf Rollen', 'ohne Konten gibt es keine Rollen'],
    ['f', 'Keine harten Limits bei Eigenschaften oder Anfragen']
  ]],

  ['Teil 9', 'Offizielle API', [
    ['t', 'REST-Schnittstelle unter /v1/ mit Token', 'die App ruft fremde APIs mit deinem Schlüssel auf; einen eigenen Server hat sie nicht'],
    ['o', 'Versions-Header und Fehlercode missing_version'],
    ['t', 'Seiten erstellen, lesen, ändern', 'im Programm über Store statt über HTTP'],
    ['t', 'Einzelnen Eigenschaftswert abrufen', 'Datenbank.wert(zeile, schlüssel, sammlung)'],
    ['f', 'Archivieren und Papierkorb als Zustand am Block'],
    ['f', 'Kindblöcke lesen, anhängen und an bestimmter Stelle einfügen'],
    ['f', 'Trennung von Container-Block und Schema mit Zeilen'],
    ['f', 'Jeder Block hat ein Typfeld und dazu passende Felder'],
    ['t', 'Mindestens 27 Blocktypen erzeugbar', '43 Bausteine, teils andere als Notions'],
    ['f', 'Schreibbare Werte liegen unter den Eigenschaften der Zeile'],
    ['f', 'Formel, Rollup, Erstellt am und laufende Nummer sind nur lesbar'],
    ['f', 'Leeren je Typ sauber behandelt'],
    ['t', 'Dateiupload in mehreren Schritten', 'Datei wird direkt als Data-URL abgelegt'],
    ['o', 'Fehlercodes mit Wiederholung und Backoff']
  ]],

  ['Teil 10', 'Kalender, Mail, Agenten', [
    ['o', 'Google- und iCloud-Kalender verbinden', 'bräuchte Konten und einen Server'],
    ['o', 'Standardkalender festlegen und Kalender sortieren'],
    ['f', 'Datenbanken mit Datumsfeld als Kalender anzeigen'],
    ['f', 'Mehrtägige Einträge und Zeiträume in Zeitstrahl und Kalender'],
    ['o', 'Kürzel D/W/M für Tag, Woche, Monat'],
    ['o', 'Mail-Ansichten mit Eigenschaften und Filtern'],
    ['o', 'Automatische Beschriftungen, Bausteine, Schnellantworten'],
    ['o', 'Gmail-Kürzel im Mail-Programm'],
    ['t', 'Vier Agententypen', 'eine lokale KI, kein Agentensystem'],
    ['o', 'Eigene Agenten mit eigenen Berechtigungen'],
    ['o', 'Agentenkonfiguration mit Wissen, Auslösern und Guthaben'],
    ['f', 'Schreibaktionen erfordern eine Bestätigung durch dich'],
    ['o', 'Workers als eigener Code, aufrufbar als Werkzeug'],
    ['o', 'MCP in beide Richtungen']
  ]],

  ['Teil 11', 'Suche, Import, Offline, Wiki', [
    ['f', 'Suche über Strg+P, Seitensuche getrennt über Strg+F'],
    ['f', 'Suche zeigt nur, was auf diesem Gerät liegt'],
    ['f', 'Suchfilter für Bereich, Typ, Zeitraum und Ort'],
    ['t', 'Unternehmenssuche über verbundene Apps und Web', 'Wikipedia nachschlagen ist eingebaut, kostenlos und ohne Schlüssel'],
    ['o', 'Verwaltungssuche mit Seiten-ID und Besitzerwechsel'],
    ['o', 'Web Clipper speichert Webseiten in eine Datenbank', 'bräuchte eine Browsererweiterung'],
    ['f', 'Importwege: Einstellungen, Seitenmenü, Datenbank-CSV und Ziehen auf die Seite'],
    ['f', 'Importformate MD, CSV, TSV, XLSX, DOCX, HTML, EPUB'],
    ['f', 'Nach dem Import Eigenschaftstypen prüfen und Verknüpfungen nachbauen'],
    ['f', 'Offline geht immer — die App braucht nie ein Netz'],
    ['f', 'Offline lesen, schreiben, Blöcke anlegen, Haken setzen'],
    ['f', 'Auch Suche und KI laufen offline'],
    ['t', 'Mobil ohne Spalten und Mehrfachauswahl', 'Oberfläche passt sich an, Spalten bleiben'],
    ['f', 'Wiki mit Besitzer und Prüfvermerk']
  ]],

  ['Teil 12', 'Habit-Bauplan', [
    ['f', 'Datum als Datumsfeld, Gym, Lesen, Fitness als Kontrollkästchen'],
    ['f', 'Wasser, Schlaf, Kalorien, Gewicht, Selbstkontrolle als Zahlen'],
    ['f', 'Titel als Datumstitel im Format 2026-01-01'],
    ['f', 'Habit-Score als 100-Punkte-Formel'],
    ['f', 'Gewichtung: Gym 20, Schlaf 20, Fitness 15, Lesen 15, Wasser 15, Selbstkontrolle 15'],
    ['f', 'Wasser volle Punkte ab 2 Litern, darunter anteilig über min()'],
    ['f', 'Schlafstaffelung mit 20, 12 und 0 Punkten'],
    ['f', 'Kalorien und Gewicht fliessen nicht in den Score'],
    ['f', 'Tag vollständig? über or() prüfen'],
    ['f', 'Habit erfüllt? ab Score 70'],
    ['f', 'Streak über Verknüpfung auf den Vortag und Rollup'],
    ['f', 'Hilfsformeln Woche, Monat, Wochentag über formatDate'],
    ['f', 'Sechs Ansichten: Heute, echte Tage, Kalender, Wochenreview, schwache Tage, Körper'],
    ['f', 'Der fertige Habit-Tracker als Vorlage — ein Klick in der Galerie']
  ]],

  ['Teil 13', 'Integrationen und Sicherheit', [
    ['t', '13 Verbindungskategorien modellieren', 'Einstellungen → Schlüssel und APIs führt sechs KI-Anbieter, Notion und Webhook'],
    ['f', 'Verzeichnis der Verbindungen mit Fähigkeiten und Hinweis, was kostenlos ist'],
    ['o', 'Gespiegelte Datenbanken aus Jira oder GitHub'],
    ['o', 'MCP-Werkzeuge einzeln aktivierbar'],
    ['f', 'Vor jeder Schreibaktion eine Bestätigung verlangen'],
    ['o', 'Verwaltungsfreigabe für zugelassene Server'],
    ['f', 'Vorlagengalerie mit sechs fertigen Aufbauten plus eigenen Vorlagen'],
    ['f', 'Daten verschlüsselt ablegen — AES-256 je Seite'],
    ['f', 'Datenort: dein Gerät, nichts verlässt es'],
    ['t', 'Protokoll der Ereignisse', 'Versionsverlauf statt Prüfprotokoll'],
    ['o', 'SAML SSO und Nutzerbereitstellung', 'es gibt keine Konten'],
    ['t', 'Freigabekontrollen für Gäste und Web', 'Teilen heisst hier: Datei erzeugen'],
    ['f', 'Seiten sind immer offline verfügbar'],
    ['f', 'Strg+P für die Schnellsuche, Link kopieren im Seitenmenü']
  ]],

  ['Teil 14', 'Blocktypen, Ansichten, Löschen', [
    ['f', 'Slash-Menü mit allen Grundbausteinen'],
    ['f', 'Toggle-Überschriften 1 bis 3'],
    ['f', 'Synchronisierter Block: gleicher Inhalt an mehreren Stellen'],
    ['f', 'Codeblock mit 47 Sprachen und eigener Syntax-Einfärbung'],
    ['f', 'HTML-Block und Mathematik-Block mit LaTeX'],
    ['f', 'Elf Ansichtstypen: Tabelle, Board, Zeitstrahl, Kalender, Liste, Galerie, Diagramm, Formular, Feed, Karte, verknüpft'],
    ['f', 'Je Ansicht Filter mit UND/ODER und Gruppen, Sortierung, Gruppierung'],
    ['f', 'Ansichten sperrbar, Link zur Ansicht kopierbar'],
    ['f', 'Board: Gruppieren, Untergruppieren, Kartengrösse, Kartenvorschau'],
    ['f', 'Diagramm mit sechs Typen und fünf Datumsstufen'],
    ['f', 'Berechnungen je Eigenschaftstyp begrenzen'],
    ['f', 'Zehn Farben plus Hintergrundvarianten'],
    ['f', 'Löschen zweistufig: Papierkorb, dann endgültig — mit einstellbarer Frist'],
    ['f', 'Beim Löschen einer Spalte warnen, dass Formeln brechen können']
  ]],

  ['Teil 15', 'Knopf- und Automationsrezepte', [
    ['f', 'Knopf legt einen Eintrag in einer Datenbank an'],
    ['f', 'Ein Knopf führt mehrere Aktionen nacheinander aus'],
    ['f', 'Knopf-Eigenschaft in einer Datenbankzeile bearbeitet diese Zeile'],
    ['f', 'Datumsausdrücke Heute, Morgen, Jetzt und Heute + 7 Tage'],
    ['f', 'Knopf bearbeitet gefilterte Seiten einer anderen Datenbank'],
    ['f', 'Zähler-Aktion: erhöht ein Zahlenfeld bei jedem Durchlauf um eins'],
    ['f', 'Timer am Knopf: erster Klick startet, zweiter hält die Dauer fest'],
    ['f', 'Duplizieren übernimmt die Feldwerte'],
    ['f', 'Auslöser „wenn eine Eigenschaft bearbeitet wird"'],
    ['f', 'Zeitauslöser relativ zum Datum — Tage davor oder danach'],
    ['f', 'Mehrere UND-Bedingungen vor der Aktion prüfen'],
    ['f', 'Kontrollkästchen gegen doppelte Erinnerungen — mit Bedingung und Aktion gebaut'],
    ['f', 'Beim Abschliessen die nächste Instanz erzeugen'],
    ['f', 'KI-Autofüllen mit hinterlegtem Auftrag in ein Zielfeld']
  ]],

  ['Teil 16', 'Fitness-OS Bauplan', [
    ['f', 'Zehn verknüpfte Datenbanken — fertig in der Vorlagengalerie'],
    ['f', 'Tagesbilanz als Drehscheibe mit dem Datum als Schlüssel'],
    ['f', 'Selbstverknüpfung im Übungskatalog für Ersatzübungen — in der Vorlage angelegt'],
    ['f', 'n:m-Verknüpfung zwischen Plänen und Übungen, wechselseitig möglich'],
    ['f', 'Volumen je Satz: Gewicht × Wiederholungen'],
    ['f', 'Geschätztes 1RM nach Epley'],
    ['f', 'Dauer aus Endzeit minus Startzeit über dateBetween'],
    ['f', 'Kalorien der Mahlzeit aus Menge und Kalorien je 100 g'],
    ['f', 'Makro-Kalorien: Eiweiss und Kohlenhydrate ×4, Fett ×9'],
    ['f', 'Habit-Quote in Prozent'],
    ['f', 'Tages-Score als Mittelwert mehrerer Kennzahlen'],
    ['f', 'Ampelformel mit Schwellen 80 und 50'],
    ['f', 'Fortschrittsbalken aus repeat("█") und repeat("░")'],
    ['t', 'Zwölf fertige Ansichten mit gesetzten Filtern', 'die Vorlage bringt die Datenbanken mit, Ansichten legst du dazu']
  ]]

  ];

  /* ========================================================================
   * ZAHLEN
   * ======================================================================*/
  const zaehle = () => {
    let f = 0, t = 0, o = 0;
    TEILE.forEach(([, , punkte]) => punkte.forEach(([st]) => {
      if (st === 'f') f++; else if (st === 't') t++; else o++;
    }));
    return { fertig: f, teils: t, offen: o, gesamt: f + t + o };
  };

  /* ========================================================================
   * DIE SEITE BAUEN
   * ======================================================================*/
  const seiteAnlegen = () => {
    const z = zaehle();
    const prozent = Math.round((z.fertig + z.teils * 0.5) / z.gesamt * 100);

    /* Eine vorhandene Standseite ersetzen, damit keine Dubletten entstehen */
    const alt = Object.values(Store.cache.blocks)
      .find(b => b.type === 'page' && b.alive && b.umsetzungsstand);
    if (alt) { Store.kinderLeeren(alt.id); Store.trashBlock(alt.id); Store.purgeBlock(alt.id); }

    const p = Store.addPage(null, { text: 'Umsetzungsstand — alle 16 Teile', icon: '✅', umsetzungsstand: true });
    const b = (typ, text, extra) => Store.addBlock(p.id, typ, Object.assign({ text }, extra || {}));

    b('callout',
      `**${z.fertig} erledigt · ${z.teils} teilweise · ${z.offen} offen** von ${z.gesamt} Anforderungen — ` +
      `das sind rund ${prozent} Prozent. Abgehakt und durchgestrichen heisst: fertig gebaut. ` +
      `Offen heisst: noch nicht gebaut — bei manchen Punkten, weil sie ohne Server oder Konto ` +
      `keinen Sinn ergeben. Der Grund steht dann kursiv dahinter.`,
      { icon: '📊', color: 'bg-blue' });

    TEILE.forEach(([nr, titel, punkte]) => {
      const f = punkte.filter(x => x[0] === 'f').length;
      const t = punkte.filter(x => x[0] === 't').length;
      const o = punkte.filter(x => x[0] === 'o').length;

      b('h2', `${nr} — ${titel}`);
      b('text', `*${f} erledigt · ${t} teilweise · ${o} offen*`, { color: 'gray' });

      punkte.forEach(([st, text, notiz]) => {
        const zusatz = notiz ? '  *— ' + notiz + '*' : '';
        if (st === 'f') b('todo', text + zusatz, { checked: true });
        else if (st === 't') b('todo', '**teilweise** — ' + text + zusatz, { checked: false, color: 'yellow' });
        else b('todo', text + zusatz, { checked: false });
      });
    });

    b('h2', 'Was als Nächstes sinnvoll wäre');
    ['Verknüpfungen wechselseitig machen, mit Limit je Zelle',
     'Verschachtelte Filtergruppen mit mehreren Ebenen',
     'Vorlagen je Datenbankzeile („Neu mit Vorlage")',
     'Knöpfe mit mehreren Aktionen nacheinander',
     'Fertige Vorlagen: Habit-Tracker aus Teil 12 und Fitness-OS aus Teil 16',
     'Papierkorb, der nach 30 Tagen selbst aufräumt']
      .forEach(x => b('bullet', x));

    App.zeichneBaum();
    App.oeffne(p.id);
    UI.toast(`${z.fertig} von ${z.gesamt} Anforderungen erledigt`);
    return p;
  };

  return { TEILE, zaehle, seiteAnlegen };
})();

window.Status = Status;
