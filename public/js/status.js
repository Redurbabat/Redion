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
    ['f', 'Papierkorb mit Wiederherstellen und einstellbarer Frist (7, 30, 90 Tage oder nie)',
          'Suchfeld, drei Filterknöpfe und je Zeile Pfeil und Eimer — wie im Bild'],
    ['f', 'Volltextsuche mit Trefferliste, Pfadanzeige und Vorschau rechts']
  ]],

  ['Teil 2', 'Vier Beispiel-Apps', [
    ['f', 'Vier fertige Unterseiten: Gym, Kalorien, Musik, persönliche Analyse', 'alle vier in der Vorlagengalerie'],
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
    ['f', 'Werte in Notions verschachtelter Form [["80"]]',
          'gespeichert wird flach, gelesen und geschrieben wird beides — samt Datum, ' +
          'Verknüpfung, Person, Datei und den Auszeichnungen fett/kursiv/Link'],
    ['f', 'Formelcode als Baum mit Version v2',
          'unser Baum lässt sich in Notions Baum übersetzen und wieder zurück; ' +
          'geprüft wird der Rundlauf daran, ob beide Fassungen dasselbe rechnen'],
    ['f', 'Sechs Diagrammtypen mit Achsen und Aggregation, inklusive Kennzahl'],
    ['f', 'Datumsgruppierung im Diagramm nach Tag, Woche, Monat, Quartal und Jahr'],
    ['f', 'Relative Datumsfilter: letzte 7 und 30 Tage, letzte und nächste Woche, Vergangenheit, Zukunft'],
    ['f', 'Wechselseitige Verknüpfungen — die Gegenseite trägt sich selbst ein'],
    ['f', 'Interne API-Endpunkte loadPageChunk, queryCollection, saveTransactionsFanout',
          'alle drei da, in Notions Form mit recordMap und Umschlägen; der Servicearbeiter ' +
          'reicht echte POST-Aufrufe an /api/v3/ durch'],
    ['f', 'Seiten-IDs im Muster 8-4-4-4-12'],
    ['f', 'Transaktionsbefehle set, update, listAfter, listBefore, listRemove',
          'alle fünf, mit Notions Pfaden; eine Liste ist genau eine Änderung — sie geht ' +
          'ganz durch oder wird zurückgedreht, und sie ist ein Schritt beim Rückgängigmachen'],
    ['f', 'Eine Transaktion lässt sich aufheben und noch einmal abspielen']
  ]],

  ['Teil 4', 'KI und Planvergleich', [
    ['f', 'Arbeitsbereiche strikt trennen — die KI sieht nur diesen einen'],
    ['f', 'KI baut Seiten, Datenbanken, Verknüpfungen, Rollups und Formeln', 'auch über den Agenten mit Werkzeugen'],
    ['f', 'Jeden KI-Schritt protokollieren — mit Rückgängig je Schritt'],
    ['f', 'Ergebniskarte mit Kopieren, Einfügen, Rückgängig', 'dazu Ersetzen und Noch einmal'],
    ['f', 'Rückgängig nimmt eine ganze Mehrschritt-Aktion zurück'],
    ['f', 'Protokollfenster sammelt alles, was die KI angelegt hat'],
    ['f', 'Prompt-Regeln in der Anleitung erklärt'],
    ['f', 'Sechs Automatisierungs-Auslöser', 'alle sechs plus zwei Zeitauslöser vor und nach einem Datum'],
    ['f', 'Automatisierungs-Aktionen', 'neun umgesetzt, darunter Wiederholen und Fremddatenbank ändern; nur Slack braucht einen Server'],
    ['f', 'Automationen lösen keine Automationen aus'],
    ['f', '21 Berechnungsarten'],
    ['f', 'Keine Planlimits — alles unbegrenzt und kostenlos'],
    ['f', 'Modellauswahl: Ollama, WebLLM und sechs Anbieter mit eigenem Schlüssel'],
    ['f', 'Quellen einzeln ein- und ausschalten', 'fünf Schalter: Seite, Arbeitsbereich, Datenbanken, Verbundenes, Web'],
    ['f', 'Modus Standard und Fragen', 'Fragen antwortet nur; Shift + Tab wechselt'],
    ['f', 'Fähigkeiten', 'Schreibstil, Korrekturlesen, Erklären, Neu formatieren — eigene lassen sich anlegen'],
    ['f', 'KI personalisieren', 'Name, Gesicht und dauerhafte Anweisungen'],
    ['f', 'Anhängen, Erwähnen, Bild erstellen und Diktieren im Eingabefeld'],
    ['f', 'Antwort kopieren und mit Daumen bewerten']
  ]],

  ['Teil 5', 'Jeder Button', [
    ['f', 'Seitenleiste mit 32 Elementen', 'Werkzeuge, Agenten, Besprechungen, Kürzlich verwendet, Favoriten, Bereiche, Privat, Meine Apps, Fuss'],
    ['f', 'Abschnitte Privat, Favoriten und Bereiche getrennt darstellen'],
    ['f', 'Abschnitt „Notion-Apps" ganz unten', 'heisst hier „Meine Apps": Kalender, App installieren, Bibliothek, Meine Aufgaben, Marktplatz, Hilfe, Papierkorb'],
    ['f', 'Reiterleiste oben: Start, Chat, Besprechungen, Posteingang, Suchen'],
    ['f', 'Abschnitte anpassen', 'jeder Abschnitt mit einem Auge ein- und ausblendbar, dazu Tab-Namen ausblenden'],
    ['f', 'Chat-Reiter mit Agenten und Verlauf', 'nach Tagen gruppiert, jeder Chat anheftbar und löschbar'],
    ['f', 'Besprechungs-Reiter', 'Bevorstehend und Heute, mit Weg zum Kalender'],
    ['f', 'Bibliothek als eigene Seite', 'sechs Reiter, vier Spalten, Sortieren durch Klick auf den Spaltenkopf'],
    ['f', 'Meine Aufgaben als eigene Seite', 'sammelt zugewiesene Zeilen aus allen Datenbanken; Quellen einstellbar'],
    ['f', 'Bereichs-Zeile mit Pfeil, Plus und Drei-Punkte-Menü',
          'jeder Abschnitt hat sein eigenes ⋯: zuklappen, alle zuklappen, hoch, runter, ausblenden, anpassen'],
    ['f', 'Kopfzeile mit 16 Elementen inklusive Teilen, Stern, Schloss', '14 in der Kopfzeile, die zwei Peek-Knöpfe in der Seitenvorschau'],
    ['f', 'Drei-Punkte-Seitenmenü mit über 20 Einträgen', 'mit Suchfeld, Schrift-Kacheln und Fusszeile mit Wortzahl'],
    ['f', 'Änderungen vorschlagen, Übersetzen, Updates und Analysen, Benachrichtigungen, Verbindungen',
          'Vorschlagsmodus hält alte und neue Fassung fest, mit Annehmen und Verwerfen'],
    ['f', 'Echte Schalter im Menü für Kleiner Text, Volle Breite und Seite sperren'],
    ['f', 'Seite archivieren', 'raus aus der Seitenleiste, aber nicht gelöscht — steht im Papierkorb-Fenster unter Archiv'],
    ['f', 'Präsentieren mit Strg + Alt + P und Verschieben nach mit Strg + ⇧ + P'],
    ['f', 'Mit KI verwenden: als Fähigkeit, als Anweisung, als Meeting-Anweisung'],
    ['f', 'Benachrichtigungen mit genau zwei Stufen wie bei Notion'],
    ['f', 'Seitenstil umschalten: Standard, Serif, Mono, kleiner Text, volle Breite'],
    ['f', 'Block-Griff ⋮⋮ links mit vollem Menü; Ziehen verschiebt den Block'],
    ['f', 'Hilfslinie beim Ziehen zeigt oberhalb oder unterhalb, je nach Mauszeiger'],
    ['f', 'Slash-Menü mit 58 Einträgen in sieben Kategorien', '64 Bausteine in sieben Gruppen'],
    ['f', 'Synchronisierter Block, Knopf, Spalten und Toggle-Überschriften'],
    ['f', 'Datenbank-Kopfzeile mit Filter und Sortierung je Ansicht'],
    ['f', 'Acht Ansichtstypen: Tabelle, Board, Kalender, Liste, Galerie, Zeitstrahl, Diagramm, Formular', 'elf: dazu Feed, Karte und Dashboard'],
    ['f', 'Spaltenmenü mit Fixieren, Umbruch, Verschieben, Duplizieren, Beschreibung',
          'dazu Kopf mit Symbol, Namensfeld und ⓘ, sowie Gruppe, Berechnen, Links und Rechts einfügen'],
    ['f', 'Unter-Elemente', 'Zeilen als Baum, beliebig tief, mit Schalter und Anzahl'],
    ['f', 'Abhängigkeiten', 'Blockiert und Blockiert von; offene Vorgänger warnen mit der Sanduhr'],
    ['f', 'Archivierte Seiten', 'aus der Ansicht heraus, über das Menü wieder sichtbar'],
    ['f', 'Datenbank sperren', 'Werte bleiben änderbar, der Aufbau nicht'],
    ['f', 'In Aufgaben umwandeln', 'die Datenbank speist dann Meine Aufgaben'],
    ['f', 'Datenquellen verwalten und eigenes Seitenlayout je Datenbank'],
    ['f', 'Mehrere Datenquellen je Ansicht', 'Quelle wechseln oder eine zweite dazunehmen — die Zeilen erscheinen zusammen'],
    ['f', 'Ansichtsmenü mit Kopfkarte', 'Symbol, Name zum Ändern und ⓘ für die Beschreibung'],
    ['f', 'Als ganze Seite öffnen', 'die Datenbank füllt den Hauptbereich allein'],
    ['f', 'Menüs werden auf dem Telefon zu Blättern von unten',
          'mit Griff, Titel, dunklem Grund und Wischen zum Schliessen — wie in Notions App'],
    ['f', 'Einträge im Blatt in Karten gruppiert, Löschen in Rot'],
    ['f', 'Leiste am unteren Rand auf dem Telefon', 'Suchen, „KI fragen", Schreiben'],
    ['f', 'Abschnitte der Seitenleiste zuklappbar'],
    ['f', 'Seiten-Cover mit Kopfzeile, Reitern und Gruppen',
          'Galerie, Hochladen, Link — auf dem Telefon als Blatt'],
    ['f', 'Posteingang mit leerem Zustand und Filter',
          '„Du bist auf dem neuesten Stand!" samt Erklärung'],
    ['f', 'Pfadnavigation anzeigen und Offline-Hinweis im Seitenmenü'],
    ['f', 'Chatverlauf nach Monaten, mit „vor drei Monaten" unter jedem Eintrag'],
    ['f', 'Zeilen-Kontextmenü mit Sammelbearbeitung, Sammellöschen, Einfügen darüber und darunter']
  ]],

  ['Teil 17', 'Über Notion hinaus — was Redion mehr kann', [
    ['f', 'Prüfregeln je Spalte: Pflicht, eindeutig, Muster, Zahlbereich, freie Formelregel',
          'ein falscher Wert wird gar nicht erst geschrieben'],
    ['f', 'Pivot-Ansicht: Zeilen × Spalten × Werte, sieben Rechenarten, Prozent, CSV'],
    ['f', 'Farbstreifen und Heatmap in Zahlenspalten'],
    ['f', 'Eigene Formelfunktionen — Notion hat kein LAMBDA',
          'Bibliothek in den Einstellungen, mit sechs Beispielen'],
    ['f', 'Formel-Werkstatt: einrücken und Zwischenergebnisse Schritt für Schritt'],
    ['f', 'Wiederkehrender Auslöser mit acht Takten, Zeitplan und Wirkungsbereich'],
    ['f', 'Variablen in Aktionsketten, in Automationen und an Knöpfen'],
    ['f', 'Laufverlauf und Testlauf für Automationen — Notion hat beides nicht'],
    ['f', 'Suche mit Abfragesprache: typ:, in:, nach:, vor:, tag:, titel:, "genauer Satz"'],
    ['f', 'Datenmodell-Ansicht: alle Datenbanken, Füllgrad je Spalte, Verknüpfungen'],
    ['f', 'Kennzahlen-Tafel mit Ziel, Balken und Farbe'],
    ['f', 'Gesundheitsbericht: verwaiste Seiten, kaputte Verknüpfungen, teure Formeln'],
    ['f', 'Dubletten finden und zusammenführen'],
    ['f', 'Verschlüsselte Sicherung mit AES-GCM 256 und 310 000 Runden'],
    ['f', 'Sperre beim Öffnen mit Passwort'],
    ['f', 'Bewertung mit Sternen und Fortschritt in Prozent als eigene Typen'],
    ['f', 'Standardwerte je Spalte für neue Zeilen'],
    ['f', 'Barrierefreiheit: Fokus, ruhige Darstellung, leichteres Lesen, Landmarken'],
    ['f', 'Fehlerliste und Erste-Hilfe-Seite statt stiller Fehler'],
    ['f', 'Papierkorb räumt nach Frist selbst auf'],
    ['f', 'Zeitstrahl mit fünf Zoomstufen — Notion hat drei'],
    ['f', 'Abhängigkeitspfeile im Zeitstrahl aus einer Selbstverknüpfung'],
    ['f', 'Balken im Zeitstrahl mit der Maus schieben und verlängern'],
    ['f', 'Feste Namensspalte im Zeitstrahl wie in einem Projektplan'],
    ['f', 'Bahnen im Board: zwei Gruppierungen gleichzeitig, quer und längs'],
    ['f', 'Gruppierte Tabellen mit eigener Berechnungszeile je Gruppe'],
    ['f', 'Datumsgruppen in Zeitabschnitten: Tag, Woche, Monat, Quartal, Jahr'],
    ['f', 'Zahlengruppen in Stufen — je 5, 10, 25, 100 oder 1000'],
    ['f', 'Durchgehende Balken für mehrtägige Termine im Monatskalender'],
    ['f', 'Wochenkalender als echtes Stundenraster mit Jetzt-Linie'],
    ['f', 'Filter vergleicht zwei Spalten derselben Zeile miteinander'],
    ['f', 'Filtervorlagen mit Namen, überall wieder anwendbar'],
    ['f', 'Mehrstufige Sortierung mit Reihenfolge und Richtung je Ebene'],
    ['f', 'Nach einer Formel sortieren, ohne dafür eine Spalte anzulegen'],
    ['f', 'Ansichtsvorlagen: eine fertige Ansicht auf jede Datenbank anwenden'],
    ['f', 'Inhaltsverzeichnis findet Überschriften auch in Toggles und Spalten'],
    ['f', 'Inhaltsverzeichnis nummeriert und hebt hervor, wo man gerade steht'],
    ['f', 'Spiegelblöcke zeigen, an wie vielen Stellen sie stehen'],
    ['f', 'Spiegelblock lösen: der Inhalt bleibt als eigene Kopie'],
    ['f', 'Endlose Spiegelung wird erkannt statt den Browser anzuhalten'],
    ['f', 'Zeilennummern im Codeblock, umschaltbar, mit Kopierknopf'],
    ['f', 'Bildgrösse in Stufen und mit der Maus, dazu Ausrichtung und Vollbild'],
    ['f', 'PDF-Vorschau direkt im Anhang, in zwei Höhen'],
    ['f', 'KI schreibt Formeln — geprüft an einer echten Zeile, mit Vergleich'],
    ['f', 'KI baut Automationen — nur gegen echte Auslöser und Aktionen'],
    ['f', 'KI baut Filter — Probelauf zeigt die Trefferzahl vor dem Übernehmen'],
    ['f', 'KI erklärt eine Formel und nennt einen überraschenden Fall'],
    ['f', 'Jeder KI-Vorschlag zeigt Zeile für Zeile, was sich ändert'],
    ['f', 'Reiter mit Strg+T, Strg+W, Strg+Tab und Strg+1…9 — auch im Browser'],
    ['f', 'Reiter überleben den Neustart und lassen sich umsortieren'],
    ['f', 'Geteilte Ansicht nebeneinander oder übereinander, Trennlinie ziehbar'],
    ['f', 'Shift + Klick auf einen Seitenlink öffnet rechts'],
    ['f', 'Linkvorschau beim Überfahren mit Titel, Pfad und ersten Zeilen'],
    ['f', 'Acht Farbschemata und eine frei wählbare Akzentfarbe'],
    ['f', 'Schriftart, Schriftgrösse, Zeilenabstand und Seitenbreite der ganzen App'],
    ['f', 'Tastenkürzel umbelegen — Notions Kürzel sind fest verdrahtet'],
    ['f', 'Fassungen vergleichen: Wort für Wort, was sich geändert hat'],
    ['f', 'Einzelne Blöcke zurückholen statt der ganzen Seite'],
    ['f', 'Zwei beliebige Fassungen gegeneinander halten, nicht nur gegen jetzt'],
    ['f', 'Word-Datei (.docx) schreiben — ohne fremdes Paket, mit Tabellen'],
    ['f', 'Excel-Mappe (.xlsx) schreiben — ein Blatt je Ansicht, Zahlen bleiben Zahlen'],
    ['f', 'Trello einlesen: Listen werden Status, Checklisten werden Aufgaben'],
    ['f', 'Evernote (.enex) einlesen — jede Notiz eine Seite'],
    ['f', 'Obsidian-Ordner einlesen, [[Wikilinks]] werden echte Verweise'],
    ['f', 'Notions eigenen Export (ZIP) einlesen, lange IDs fallen weg'],
    ['f', 'Formelspeicher: jede Formel je Zeile nur einmal je Datenstand'],
    ['f', 'Lange Tabellen fensterweise zeichnen statt alles auf einmal'],
    ['f', 'Suchregister über alle Blöcke, in Millisekunden gebaut'],
    ['f', 'Tempoanzeige: Zeichendauer, Formelzahl und die teuersten Formeln'],
    ['f', 'Seitenleiste in der Breite ziehbar, Doppelklick setzt zurück'],
    ['f', 'Offline-Anzeige, die ehrlich sagt, was jetzt trotzdem geht'],
    ['f', 'Klick in ein Diagramm zeigt die Zeilen hinter der Zahl'],
    ['f', 'Klick in eine Kreuztabellen-Zelle zeigt die Zeilen dahinter'],
    ['f', 'Werte stehen über den Balken, nicht erst beim Überfahren'],
    ['f', 'Aus jeder Auswahl heraus direkt eine CSV speichern'],
    ['f', 'Bedingung je Aktion in Automationen — das „sonst", das Notion fehlt'],
    ['f', 'Formeleditor nennt den Rückgabetyp mit Länge oder Anzahl'],
    ['f', 'Zurückstellen mit Wiedervorlage und Meldung im Posteingang'],
    ['f', 'Tagesplan mit ehrlicher Rechnung, ob der Tag reicht'],
    ['f', 'Wochenrückblick mit Balken je Tag, auch als Seite'],
    ['f', 'Befehlspalette sucht unscharf, merkt sich Häufiges und findet Seiten'],
    ['f', 'Achtes Wissensdokument: alles, was Redion mehr kann',
          '23 Abschnitte, 700 Zeilen — wächst mit und nennt auch die Grenzen'],
    ['f', 'Statusübergänge: von welchem Wert darf man zu welchem springen'],
    ['f', 'Kürzelübersicht in neun Gruppen, mit Zähler und Weg zum Umbelegen'],
    ['f', 'Kommentarfäden mit Antworten — bisher stand jeder Kommentar allein'],
    ['f', 'Sechs Emoji-Reaktionen je Kommentar, mit Namen im Tooltip'],
    ['f', '@Erwähnungen im Kommentar werden Links auf die Seite'],
    ['f', '„An dich gerichtet" ganz oben im Posteingang'],
    ['f', 'Erweiterungen: eigene Formelfunktionen, Befehle und Knöpfe — Notion hat keine'],
    ['f', 'Erweiterungen laufen abgeschirmt: Store, window, fetch sind für sie leer'],
    ['f', 'Probelauf für eine Erweiterung, bevor sie eingebaut wird'],
    ['f', 'Vier fertige Beispielerweiterungen zum Ausprobieren'],
    ['f', 'Formular mit Danke-Seite, eigenem Text und Antwortzähler'],
    ['f', 'Webhook meldet sich an: Bearer, Basic, eigene Kopfzeile oder Geheimnis im Paket'],
    ['f', 'Eingänge von aussen: abholen im Takt statt zugeschickt bekommen'],
    ['f', 'JSON von Hand einwerfen, mit Feldzuordnung und Typumwandlung'],
    ['f', 'Ein Link mit #neu= legt eine Zeile an — für Kurzbefehle und Verknüpfungen'],
    ['f', 'Doppelte Eingänge über ein Schlüsselfeld fernhalten'],
    ['f', 'Fehler behoben: ein Pflichtfeld hielt jede Formularantwort auf'],
    ['f', 'Papierkorb: an einer anderen Stelle wiederherstellen, mit Suche'],
    ['f', 'Warnt, wenn der alte Ort selbst im Papierkorb liegt'],
    ['f', 'Abschnitte der Seitenleiste umsortieren — Notion lässt sie nur ausblenden'],
    ['f', 'Sechs weitere Automationsaktionen: archivieren, löschen, leeren, duplizieren, kommentieren, zurückstellen'],
    ['f', 'Führung in neun Schritten, die auf die echten Knöpfe zeigt'],
    ['f', 'Sie drängt sich nicht auf: beim ersten Mal nur eine kleine Einladung'],
    ['f', '„Was Redion kann" — zwölf Themen auf einer Seite, mit Weg ins Dokument'],
    ['f', 'Das achte Wissensdokument wächst mit und nennt auch die Grenzen'],
    ['f', 'Formeleditor warnt bei einer Spalte, die es nicht gibt'],
    ['f', 'Härtetest: leere Datenbanken in allen zwölf Ansichten, kaputte Verweise, Kreisformeln'],
    ['f', 'Vorlage „Bauplan": Abhängigkeitspfeile, Bahnen und Kreuztabelle in einem',
          'zwölf Gewerke, sechs Ansichten auf denselben Daten'],
    ['f', 'Vorlage „Redaktionsplan": Formular, Automation und Kommentar greifen ineinander'],
    ['f', 'Zehn Vorlagen in der Galerie — jede zeigt etwas, das Notion so nicht hat'],
    ['f', 'Auslöser „kommt in eine Ansicht" und „fällt heraus" — der Grenzübertritt selbst',
          'nicht „Status geändert", sondern „erfüllt jetzt den Filter"'],
    ['f', 'Auslöser für Kommentar, Erwähnung, angehängte Datei und Rückkehr aus dem Papierkorb'],
    ['f', 'Benannter Bedingungskatalog mit 24 Einträgen — in drei Gruppen im Dialog'],
    ['f', 'Bedingungen über die Veränderung: „war vorher leer", „hat sich wirklich geändert", „ist gewachsen"',
          'daran scheitern in Notion die meisten Automationen — dort feuert auch derselbe Wert nochmal'],
    ['f', 'Bedingung „lief heute höchstens X mal" — eine Bremse gegen Schleifen'],
    ['f', 'Zeitzone je wiederkehrender Automation, Sommerzeit wird mitgerechnet'],
    ['f', 'Die Bedingungen stehen in der Automationsliste, statt sich zu verstecken'],
    ['f', 'Mehrere Blöcke auf einmal: auswählen, umwandeln, einrücken, verschieben, löschen',
          'Esc wählt aus, Shift+Pfeil vergrössert, Strg A nimmt alle — dann gilt jede Taste für alle'],
    ['f', 'Auswahl kopieren, ausschneiden und einfügen — als Markdown und als echte Blöcke'],
    ['f', 'Eine Leiste zeigt, wie viele Blöcke gewählt sind, und was mit ihnen geht'],
    ['f', 'Strg Pos1 und Strg Ende springen an den Anfang und ans Ende der Seite'],
    ['f', 'Strg Shift C kopiert einen Link auf genau einen Block'],
    ['f', 'In der Tabelle: Leertaste öffnet die Vorschau, Strg Enter die ganze Seite'],
    ['f', 'Pos1 und Ende in der Tabelle, mit Strg bis an den Rand der ganzen Tabelle'],
    ['f', 'Die Titelspalte ist jetzt auch mit der Tastatur erreichbar',
          'vorher begann die Reise erst bei der zweiten Spalte'],
    ['f', 'Fünf neue Seitenkürzel: verdoppeln, anheften, Unterseite, Papierkorb, Übersicht'],
    ['f', 'Notions Rohform lesen: verschachtelte Werte und der Formelbaum v2',
          'ein Notion-Export in JSON wird zur echten Datenbank, mit Formeln und Auswahlwerten'],
    ['f', 'Und in beide Richtungen — wer zurück zu Notion will, kommt nicht in eine Sackgasse'],
    ['f', 'Ein Fenster zum Ausprobieren: Formel in den Baum, Wert flachlegen, Rundlauf prüfen'],
    ['f', 'Die Schnittstelle /v1/ ohne Server — beantwortet im Browser, aus den Daten, die dort liegen',
          'der Servicearbeiter fängt fetch("/v1/…") ab und fragt das offene Fenster'],
    ['f', 'Von aussen bleibt sie zu, und sagt das auch so',
          '503 mit Begründung statt einer stillen Startseite'],
    ['f', 'Notions interne Befehle als eigenes Modell: alles oder nichts, ein Schritt zurück',
          'nicht „speichere die Seite", sondern eine Liste kleiner Befehle — wie in Notion'],
    ['f', 'Auch die internen Adressen wollen ein Token',
          'sonst könnte jedes fremde Skript auf der Seite alles lesen und ändern'],
    ['f', 'Ein Protokoll statt drei: Versionsverlauf, KI und Automationen laufen zusammen',
          'die Frage „was ist gestern hier passiert" hatte vorher keine Antwort'],
    ['f', 'Rechteänderungen mit Vorher und Nachher im Protokoll'],
    ['f', 'Grosse Dateien in Stücken statt als Data-URL',
          'eine Data-URL ist um ein Drittel grösser, liegt ganz im Arbeitsspeicher und ' +
          'wandert bei jeder Blockänderung mit durch die Ablage — Stücke tun das nicht'],
    ['f', 'Ein Fortschrittsbalken beim Ablegen, Abbrechen räumt die Stücke wieder weg'],
    ['f', 'Verwaiste Dateien finden und aufräumen',
          'Blöcke gelöscht oder Upload nie zu Ende gebracht — beides sammelt sich sonst still an'],
    ['f', 'Kleine Dateien gehen weiter den kurzen Weg',
          'unter 256 KB wäre der Apparat Unfug']
  ]],

  ['Teil 6b', 'Die Oberfläche am PC und am Telefon', [
    ['f', 'Seitenleiste am PC: Arbeitsbereich, Suche, KI, Start, Posteingang, Einstellungen, Bereiche, unten Vorlagen/Importieren/Papierkorb/Neue Seite'],
    ['f', 'Kopfzeile am PC: Zurück, Vorwärts, Pfad, Teilen, Kommentare, Verlauf, Favorit, ⋯'],
    ['f', 'Seitenkopf: Cover mit Ändern und Neu positionieren, Symbol, Titel, Eigenschaften'],
    ['f', 'Blockgriffe ⋮⋮ und + links neben jedem Block, nur beim Überfahren'],
    ['f', 'Datenbankleiste: Reiter, +, Filter, Sortieren, Suchen, Automationen, ⋯, blauer Knopf Neu mit ▾'],
    ['f', 'Am Telefon beginnt der Inhalt ganz links und füllt die Breite',
          'die Seitenleiste liegt jetzt fest darüber statt im Fluss — das war ein echter Fehler'],
    ['f', 'Kopfzeile am Telefon nur ☰, ‹, Seitentitel und ⋯ — wie in Notion'],
    ['f', 'Teilen, Versionsverlauf, Kommentare und Automationen wandern am Telefon ins ⋯-Menü'],
    ['f', 'Untere Leiste am Telefon mit Pille „KI fragen" in der Mitte'],
    ['f', 'Menüs fahren am Telefon als Blatt von unten hoch, mit Griff und rotem Löschen'],
    ['f', 'Blockgriffe sind am Telefon aus, wie in Notion'],
    ['f', 'Die Schublade fährt mit ☰ auf und schliesst beim Tippen daneben'],
    ['f', 'Untere Tab-Leiste mit Start, Chats, Besprechungen, Posteingang',
          'dieselben vier Bereiche wie am PC, mit Markierung; Suchen und Neu sind dafür in die Kopfzeile gewandert'],
    ['f', 'Die Schublade endet über der Leiste, statt sie zuzudecken',
          'sonst sähe man die anderen Bereiche, könnte sie aber nicht treffen'],
    ['f', 'Punkt am Posteingang, wenn etwas Ungelesenes liegt']
  ]],

  ['Teil 6', 'Tastenkürzel und Einstellungen', [
    ['f', '160 Tastenkürzel',
          '127 in zwölf Gruppen, jedes davon geprüft — die Zahl 160 stammt aus einer Zählung, ' +
          'die Notions Mac- und Windows-Belegung getrennt zählt; hier steht jede Taste einmal'],
    ['f', 'Strg+Umschalt+0 bis 9 wandeln Blöcke um — Notions Windows-Belegung',
          'auch auf deutscher Tastatur, weil zusätzlich event.code gelesen wird'],
    ['f', 'Strg+Alt+0 bis 9 gehen weiter — Notions Mac-Belegung'],
    ['f', 'Strg+Umschalt+E setzt einen Formelblock'],
    ['f', 'Strg+/ wandelt den Block um, Strg+L kopiert den Seitenlink'],
    ['f', 'Strg+Umschalt+U geht eine Ebene in der Seitenhierarchie nach oben'],
    ['f', 'Strg + und Strg − und Strg 0 ändern die Schriftgrösse'],
    ['f', 'Alle 41 Slash-Wörter aus Notions Hilfeseite finden etwas',
          'geprüft: text, plain, page, bullet, num, todo, toggle, div, quote, h1, #, … bis default'],
    ['f', 'Elf Aktionen im Slash-Menü: turn, color, default, duplicate, moveto, delete, mention, date, reminder, emoji, comment'],
    ['f', 'Strg+R und Strg+D füllen mehrere Tabellenzellen nach rechts und unten'],
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
    ['f', 'Einstellungen in 15 Bereichen', '19 Bereiche in vier Abschnitten, über 130 Optionen'],
    ['f', 'Analysen, Verifizierte Seiten und Worker als eigene Bereiche'],
    ['f', 'Hoher Kontrast und „Eingabetaste macht eine neue Zeile"']
  ]],

  ['Teil 7', 'Formelsprache und Filter', [
    ['f', 'Alle 99 Merkmale der offiziellen Notion-Formelreferenz laufen',
          'gemessen: 99/99 — 85 Funktionen in der Tabelle, dazu Sonderformen und Operatoren'],
    ['f', 'formatNumber mit Währung, Prozent, Tausendertrennung und Stellenzahl'],
    ['f', 'Text mit + verketten, concat() nur für Listen'],
    ['f', 'Operatoren inklusive and, or, not, empty(), current und Fragezeichen-Doppelpunkt'],
    ['f', 'if, ifs, empty, equal, unequal, let und lets'],
    ['f', 'Mathefunktionen bis cbrt, log2, sign, median'],
    ['f', 'Textfunktionen mit regulären Ausdrücken: test, match, replace, replaceAll'],
    ['f', 'Listenfunktionen map, filter, find, some, every, unique, flat'],
    ['f', 'Datumsfunktionen; now() mit Uhrzeit, today() ohne'],
    ['f', 'Verknüpfungen per map(current.prop(...)) auslesen'],
    ['f', '29 Eigenschaftstypen mit genau einer Titelspalte',
          '33 Typen in fünf Gruppen, dazu Google Drive, Figma, GitHub-Pull-Request und Zendesk'],
    ['f', 'Verknüpfung einseitig oder wechselseitig, mit Limit eine oder mehrere'],
    ['f', 'Zahl, Formel und Rollup als Zahl, Balken oder Ring anzeigen'],
    ['f', 'Filteroperatoren je Typ — gegen Notions API-Referenz abgeglichen',
          'URL, E-Mail und Telefon mit allen acht Textbedingungen; ID mit allen sechs Zahlenvergleichen'],
    ['f', 'Datumsfilter inklusive letztes, dieses und nächstes Jahr sowie nächster Monat'],
    ['f', 'Alle 21 Berechnungsarten unter der Spalte, passend je Eigenschaftstyp'],
    ['f', 'Gruppen sortieren: manuell, A→Z, Z→A, meiste zuerst, wenigste zuerst',
          'nach Anzahl kann Notion nicht'],
    ['f', 'Filtergruppen mit UND/ODER, mehrere Ebenen tief'],
    ['f', 'Verschachtelte Rollup-Filter any / every / none mit eigener Unterbedingung'],

    /* --- Automationen: gegen Notions Hilfeseiten abgeglichen ------------- */
    ['f', 'Auslöser „Seite hinzugefügt" und „Eigenschaft bearbeitet" wie in Notion',
          'dazu sechs Auslöser, die Notion nicht hat'],
    ['f', 'Aktionen Eigenschaft bearbeiten, Seiten bearbeiten in, Webhook senden'],
    ['f', 'Knopf: Blöcke einfügen mit Position, Seite anlegen in, Seiten bearbeiten in, öffnen, Bestätigung'],
    ['f', 'Wiederkehrender Auslöser „Alle X um HH:MM, ab …, bis …" mit Zeitzone',
          'acht Takte, Uhrzeit, Anfang, Ende, Wirkungsbereich — und jede Automation hat ihre eigene Zone, samt Sommerzeit'],
    ['f', 'Aktion „Variablen festlegen" für alle folgenden Aktionen'],
    ['f', 'Aktion „Seite anlegen in" auch als Automation, nicht nur am Knopf'],
    ['f', 'Aktionen „Benachrichtigung senden" und „E-Mail senden"'],
    ['f', 'Mehrere Auslöser mit „einer reicht" und „alle müssen"'],

    /* --- Was über Notion hinausgeht ------------------------------------- */
    ['f', 'Die Zeile im Verhältnis zu den anderen: rowNumber, previous, next, delta',
          'Notion kann das nicht — dort sieht eine Formel nur ihre eigene Zeile'],
    ['f', 'Laufende Summe, laufendes Maximum und Minimum: runningSum, runningMax, runningMin'],
    ['f', 'Rang, Anteil am Gesamtwert, Gesamtsumme und Durchschnitt der Ansicht',
          'rank, percentOfTotal, total, average, rowCount'],
    ['f', 'Abfragen über eine ANDERE Datenbank ohne Verknüpfung',
          'findRows, countWhere, sumWhere, firstWhere, lastWhere, maxWhere, minWhere'],
    ['f', 'Zufall: random, randomBetween, randomItem, shuffle',
          'Notion schreibt ausdrücklich, dass es kein random() hat'],
    ['f', 'Werktage: businessDaysBetween, addBusinessDays, isWeekend, isWorkday'],
    ['f', 'Zeiträume: startOf/endOf für Tag, Woche, Monat, Quartal und Jahr, quarter, daysInMonth, isLeapYear'],
    ['f', 'Zeitzonen: convertTimezone, timezoneOffset, formatDate mit Zonenangabe'],
    ['f', 'Listen falten und gruppieren: reduce, sortBy, groupBy mit groupKey/groupItems/groupCount'],
    ['f', 'Statistik: stdDev, variance, percentile, clamp, roundTo'],
    ['f', 'Text: padStart, padEnd, startsWith, endsWith, capitalize, titleCase, slug, initials, wordCount, truncate'],
    ['f', 'Schutz vor Formeln, die sich selbst über runningSum oder rank aufrufen',
          'wird sofort gemeldet statt stillschweigend 0 zu zeigen'],
    ['f', 'Keine 15-Ebenen-Grenze wie bei Notion — es wird lokal gerechnet'],
    ['f', 'Eigene Funktionen definieren (def istWerktag(d) = …)'],
    ['f', 'Pivot-Ansicht: Zeilen × Spalten × Werte mit Zwischensummen'],
    ['f', 'Datenvalidierung: required, unique, Regex, Statusübergangsregeln',
          'dazu Zahlbereich und freie Formelregel — mehr, als in der Vorlage stand']
  ]],

  ['Teil 8', 'Automationen, Formulare, Diagramme', [
    ['f', 'Automation aus Auslöser und Aktion zusammensetzen'],
    ['f', '15 Auslöser, 24 Bedingungen, 19 Aktionen',
          'alle drei Listen vollständig; Bedingungen zusätzlich frei kombinierbar und je Aktion'],
    ['f', 'Automationen lösen keine weiteren Automationen aus'],
    ['f', 'Geltungsbereich ganze Datenbank oder eine bestimmte Ansicht'],
    ['f', 'Aktion „Webhook senden" — Adresse in den Einstellungen oder je Automation'],
    ['f', 'Knopf-Block mit mehreren Aktionen in Reihenfolge'],
    ['f', 'Knopf fragt vor dem Ausführen nach, wenn gewünscht'],
    ['f', 'Formularansicht mit 13 Fragetypen'],
    ['f', 'Bedingte Logik blendet Fragen je nach Antwort ein'],
    ['f', 'Sechs Diagrammtypen: Säule, Balken, Linie, Fläche, Ring, Kennzahl'],
    ['f', '21 Aggregationen für Diagramme'],
    ['f', 'Wiederkehrende Vorlagen täglich bis jährlich'],
    ['t', 'Berechtigungsmatrix mit fünf Rollen', 'alle fünf Rollen wirken in Oberfläche und KI-Suche; ohne Server ist es eine Absprache, kein Schloss'],
    ['f', 'Keine harten Limits bei Eigenschaften oder Anfragen']
  ]],

  ['Teil 9', 'Offizielle API', [
    ['f', 'REST-Schnittstelle unter /v1/ mit Token',
          'echte fetch("/v1/…")-Aufrufe funktionieren; der Servicearbeiter fängt sie ab und ' +
          'lässt sie im Fenster beantworten. Von aussen kommt niemand heran — dort liegen keine Daten'],
    ['f', 'Versions-Header und Fehlercode missing_version',
          'ohne Notion-Version kommt 400 mit genau diesem Code, dazu 401 unauthorized ohne Token'],
    ['f', 'Seiten erstellen, lesen, ändern',
          'GET, POST und PATCH auf /v1/pages, mit Eltern, Symbol, Eigenschaften und Kindblöcken'],
    ['f', 'Einzelnen Eigenschaftswert abrufen', 'GET /v1/pages/{id}/properties/{key}'],
    ['f', 'Datenbanken abfragen mit Filter, Sortierung und Blätterung',
          'POST /v1/databases/{id}/query mit and/or, page_size, start_cursor und has_more'],
    ['f', 'Suche, Nutzer und Kommentare über die Schnittstelle',
          'POST /v1/search mit Objektfilter, GET /v1/users/me, GET und POST /v1/comments'],
    ['f', 'Token anlegen, kopieren und zurückziehen — mit einer Konsole zum Ausprobieren'],
    ['f', 'Archivieren und Papierkorb als Zustand am Block'],
    ['f', 'Kindblöcke lesen, anhängen und an bestimmter Stelle einfügen'],
    ['f', 'Trennung von Container-Block und Schema mit Zeilen'],
    ['f', 'Jeder Block hat ein Typfeld und dazu passende Felder'],
    ['f', 'Mindestens 27 Blocktypen erzeugbar',
          '43 Bausteine; die Schnittstelle bildet sie auf Notions Typnamen ab und nennt ' +
          'die eigenen offen beim Namen, statt sie als etwas anderes auszugeben'],
    ['f', 'Schreibbare Werte liegen unter den Eigenschaften der Zeile'],
    ['f', 'Formel, Rollup, Erstellt am und laufende Nummer sind nur lesbar'],
    ['f', 'Leeren je Typ sauber behandelt'],
    ['f', 'Dateiupload in mehreren Schritten',
          'anmelden, Stücke schicken, bestätigen — wie bei Notion, nur ohne Server. ' +
          'Jedes Stück liegt einzeln als Blob in der Ablage; bis 500 MB statt 12'],
    ['f', 'Fehlercodes mit Wiederholung und Backoff']
  ]],

  ['Teil 10', 'Kalender, Mail, Agenten', [
    ['f', 'Google- und iCloud-Kalender verbinden', 'Google über die Schnittstelle, iCloud über den veröffentlichten Kalender'],
    ['f', 'Standardkalender festlegen und Kalender sortieren', 'mehrere Datenbanken je Kalender, ein- und ausschaltbar, verschiebbar'],
    ['f', 'Datenbanken mit Datumsfeld als Kalender anzeigen'],
    ['f', 'Mehrtägige Einträge und Zeiträume in Zeitstrahl und Kalender'],
    ['f', 'Kürzel D/W/M für Tag, Woche, Monat'],
    ['f', 'Mail-Ansichten mit Eigenschaften und Filtern'],
    ['f', 'Automatische Beschriftungen, Bausteine, Schnellantworten'],
    ['f', 'Gmail-Kürzel im Mail-Programm', 'vierzehn Kürzel: j k o u e # r a l I U s /'],
    ['f', 'Vier Agententypen', 'Assistent, Rechercheur, Redakteur, Datenbank-Baumeister'],
    ['f', 'Eigene Agenten mit eigenen Berechtigungen'],
    ['f', 'Agentenkonfiguration mit Wissen, Auslösern und Guthaben'],
    ['f', 'Schreibaktionen erfordern eine Bestätigung durch dich'],
    ['f', 'Workers als eigener Code, aufrufbar als Werkzeug', 'läuft im Web Worker, ohne Zugriff auf Seite und Daten'],
    ['t', 'MCP in beide Richtungen', 'Client läuft; als Server beantwortet die App jede Anfrage, kann aber nichts entgegennehmen — dafür braucht es die Brücke']
  ]],

  ['Teil 11', 'Suche, Import, Offline, Wiki', [
    ['f', 'Suche über Strg+P, Seitensuche getrennt über Strg+F'],
    ['f', 'Suche zeigt nur, was auf diesem Gerät liegt'],
    ['f', 'Suchfilter für Bereich, Typ, Zeitraum und Ort'],
    ['f', 'Unternehmenssuche über verbundene Apps und Web', 'ein Index über Seiten, Datenbanken, Mail, Termine und Spiegel; dazu Wikipedia'],
    ['t', 'Verwaltungssuche mit Seiten-ID und Besitzerwechsel', 'Suche nach Seiten-ID ist da; ohne Konten gibt es keinen Besitzerwechsel'],
    ['f', 'Web Clipper speichert Webseiten in eine Datenbank', 'als Lesezeichen-Schnipsel, ohne Erweiterung'],
    ['f', 'Importwege: Einstellungen, Seitenmenü, Datenbank-CSV und Ziehen auf die Seite'],
    ['f', 'Importformate MD, CSV, TSV, XLSX, DOCX, HTML, EPUB'],
    ['f', 'Nach dem Import Eigenschaftstypen prüfen und Verknüpfungen nachbauen'],
    ['f', 'Offline geht immer — die App braucht nie ein Netz'],
    ['f', 'Offline lesen, schreiben, Blöcke anlegen, Haken setzen'],
    ['f', 'Auch Suche und KI laufen offline'],
    ['f', 'Mobil ohne Spalten und Mehrfachauswahl'],
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
    ['f', '13 Verbindungskategorien modellieren', 'Google, GitHub, Jira, Kalender-Abos, MCP, Webhook, sechs KI-Anbieter, Clipper, Ordner'],
    ['f', 'Verzeichnis der Verbindungen mit Fähigkeiten und Hinweis, was kostenlos ist'],
    ['f', 'Gespiegelte Datenbanken aus Jira oder GitHub'],
    ['f', 'MCP-Werkzeuge einzeln aktivierbar'],
    ['f', 'Vor jeder Schreibaktion eine Bestätigung verlangen'],
    ['f', 'Verwaltungsfreigabe für zugelassene Server'],
    ['f', 'Vorlagengalerie mit sechs fertigen Aufbauten plus eigenen Vorlagen'],
    ['f', 'Daten verschlüsselt ablegen — AES-256 je Seite'],
    ['f', 'Datenort: dein Gerät, nichts verlässt es'],
    ['f', 'Protokoll der Ereignisse',
          'ein gemeinsames Protokoll für alles: Seiten, Datenbanken, Spalten, Automationen, ' +
          'KI, Rechte, Schnittstelle, Transaktionen — filterbar nach Art, Person, Tag und Text, ' +
          'als CSV ausgebbar. Es steht ehrlich dabei, dass es im Browser liegt'],
    ['f', 'Es zählt nicht mit, was jemand nur ansieht',
          'das wäre Überwachung ohne Nutzen — und es lässt sich ganz abschalten'],
    ['t', 'SAML SSO und Nutzerbereitstellung', 'Anmeldung über Google liefert eine geprüfte Identität; SAML selbst braucht einen Identitätsanbieter und einen Server'],
    ['t', 'Freigabekontrollen für Gäste und Web', 'Rollen je Seite und je Konto; Veröffentlichen über Cloudflare Pages'],
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
    ['f', 'Zwölf fertige Ansichten mit gesetzten Filtern']
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
