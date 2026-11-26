# AFFiNE-Funktionen in Redion

Referenz ist der [AFFiNE-Quellstand 81da59d](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade). Redion behält seine Seiten, Berechtigungen und das `.redion`-Format. Der Ausbau nutzt Redions vorhandene Werkzeuge. AFFiNE-Module mit gesonderter Lizenz bleiben von dieser Umsetzung getrennt.

| Arbeitsablauf | Redion heute | Weiterer Ausbau |
| --- | --- | --- |
| Seite und freie Fläche | Dieselbe Seite lässt sich als Textseite oder auf der freien Fläche öffnen. Blöcke lassen sich auf der Fläche platzieren. | Rahmen und Präsentationsfolgen, verschachtelte Gruppen sowie derselbe Gruppenumfang in allen Zeichenkontexten. Auf der freien Seitenfläche sind gespeicherte Gruppen, Zeichenreihenfolge und Sperren jetzt ergänzt. |
| Formen und Haftnotizen | Gefüllte Formen, Raute und Textmarker sind im Dock verfügbar. Formen und Stiftstriche lassen sich einzeln oder im Rahmen auswählen, gemeinsam verschieben und skalieren sowie beschriften, verbinden und rückgängig machen. Rechtecke, Ellipsen, Dreiecke und Haftnotizen lassen sich aus dem Dock auf die Fläche ziehen. | Freihandlasso, Drehung, verbundene Blöcke und Übersicht aller Seitenflächen. |
| Dokumente und Verweise | Blockeditor, Markdown, Dateianhänge, Seitenlinks, Vorschau, Rückverweise und geteilte Ansicht sind vorhanden. | Vorschauen eingebetteter Dokumente, Kommentar-Fäden in Blöcken, gemeinsame Vorlagen und AFFiNE-Import mit Anhängen. |
| Bibliothek und Planung | Arbeitsbereiche, Ordner, Suche, Favoriten, Tags, Aufgaben und Kalender sind vorhanden. | Journal, dynamische Sammlungen, Arbeitsbereichseigenschaften und Vorlagen für wiederkehrende Dokumente vergleichen und ausbauen. |
| Datenbanken | Tabellen, Ansichten, Relationen, Filter und Formeln sind vorhanden. | AFFiNE-Ansichten und deren Interaktionen am konkreten Datenmodell abgleichen. Dazu gehören Kanban, Kalender, Diagramme und Aktivitätsansichten. |
| Offline und Zusammenarbeit | Lokale Ablage, Sicherungen und optionaler Geräteabgleich sind vorhanden. | Gleichzeitiges Bearbeiten, Präsenz, Konflikte, Freigaben und die vollständige Wiederherstellung mit Anhängen Ende zu Ende prüfen. |
| KI, Integrationen und Clients | Redion hat eigene KI-, MCP-, Lern-, PDF- und Elektro-Werkzeuge sowie Windows- und iPhone-Clients. | AFFiNE-Arbeitsabläufe für Dokumente und Fläche, Web Clipper, Android und weitere native Funktionen einzeln integrieren und prüfen. |

Der [Gesamtabgleich der AFFiNE-Modulgruppen](AFFINE-GESAMTABGLEICH.md)
trennt vorhandene Redion-Funktionen, ergänzte Flächenfunktionen und noch offene
Arbeiten. Eine ähnliche Oberfläche bedeutet keine vollständige Funktionsparität.

## Flächenwerkzeuge ausprobieren

1. Öffne in einer Redion-Seite die Ansicht **Fläche**.
2. Wähle **Auswählen** und ziehe eine gezeichnete Form. Mit **Umschalt-Klick** kommen weitere Formen dazu. **Alle Formen** funktioniert auch über die Werkzeugleiste. Im Fokus der Fläche bewegen die Pfeiltasten die Auswahl.
3. Mit **Haftnotiz** setzt du einen beschrifteten Zettel. Eine ausgewählte Haftnotiz oder ein Rechteck lässt sich über **Beschriften** bearbeiten.
4. Wähle **Verbinden** und tippe nacheinander auf zwei Formen. Der Pfeil folgt den Formen beim Verschieben. Löschen und Rückgängig verwenden den vorhandenen Verlauf.
5. Ziehe im Dock eine der drei gelben Formen oder die Haftnotiz auf die Fläche. Bei der Haftnotiz kannst du direkt die Beschriftung eingeben. Escape bricht das Ziehen ab.
6. Wähle im Zeigermenü **Rahmenauswahl** und ziehe einen Rahmen um die Formen. Mit Umschalt-Ziehen auf freier Fläche kannst du weitere Formen zu deiner Auswahl hinzufügen.
7. Ziehe an einem Eckgriff der Auswahl, um die Formen zu skalieren. Mit Umschalt bleibt das Seitenverhältnis erhalten. Über **Grösse ändern** kannst du Breite und Höhe auch eingeben.
8. Öffne **Stift** für Freihandstift, Textmarker, Breite und Farbe. Die Palette bleibt beim Zeichnen offen. **Formen** bietet die Kontur, Füllung und Raute in derselben Leiste.
9. Blättere im Dock nach rechts. Unter **Gedankenkarte einfügen** stehen zwei bearbeitbare Startkarten. **Blockvorlagen** enthält Ablaufdiagramm und Entscheidungsbaum. Ziehe eine Vorschau an die gewünschte Stelle oder füge sie mit einem Klick ein.
10. Die Themen und Äste einer Gedankenkarte liegen direkt auf der Fläche. Doppelklick auf ein Thema öffnet seinen Text. Wähle ein Thema, um die Werkzeuge der Karte einzublenden.
11. Über ausgewählten Formen kannst du direkt Farbe und Füllung ändern, Text bearbeiten oder die Auswahl duplizieren. Pfeile zwischen kopierten Formen werden gemeinsam mit ihnen übernommen.

12. Wähle auf der freien Seitenfläche mehrere Formen und drücke **Strg + G**
    oder **⌘ G**. Die Gruppe bleibt nach Neuladen erhalten; ein Mitglied wählt
    die ganze Gruppe. **Strg/⌘ + Umschalt + G** löst sie auf.
13. Im **⋯ der Formauswahl** stehen **Sperren**, **Entsperren** und die vier
    Befehle für die Zeichenreihenfolge. Gesperrte Formen lassen sich dort
    weder verschieben, skalieren, beschriften, einfärben, löschen noch radieren.
    Gruppen, Sperren und Reihenfolge verwenden denselben Rückgängig-Verlauf.

Diese drei Ergänzungen gelten zunächst für Formen der **freien Seitenfläche**.
Die PDF-Tinte und das eingebettete Whiteboard behalten ihre jeweiligen Modelle.
Eine Sperre ist eine Bearbeitungshilfe, keine Zugriffsberechtigung.

## Abnahme der bisherigen Grundfunktionen

- Die Browserläufe `test575` und `test209` bestanden mit 59 bzw. 56 Zusagen. Geprüft wurden unter anderem Maus, Tastatur, Touch bei 390 px, Abbruch, gemeinsamer Verlauf, verbundene Pfeile und Neuladen.
- TypeScript, Einzeldatei und Dienststand wurden geprüft.
- Das Windows-x64-Testpaket wurde offline in einem getrennten Profil gestartet. Mehrfachauswahl, Verschieben, verbundene Pfeile und Rückgängig funktionierten dort.
- Die Touch-Abnahme auf einem echten iPhone steht aus.

## Abnahme der Dock-Ablage und Rahmenauswahl

- `test575` bestand mit 80 Zusagen, darunter Dreieck und Haftnotiz aus dem Dock, Escape, Rückgängig und eine Rahmenauswahl ohne Schreibzugriff.
- In der Windows-EXE liessen sich Dreieck und Haftnotiz im getrennten Offline-Profil ablegen und per Rahmen gemeinsam auswählen. Der Webstand 1666 wurde aus dem verbundenen Redion-Ordner geladen.

## Abnahme der Grössenänderung

- `test575` bestand mit 91 Prüfungen. Abgedeckt sind Eckgriffe, Umschalt-Skalierung, Massdialog, mehrere Formen, die Verbindungsvorschau, Escape und Rückgängig.
- TypeScript, Einzeldatei und Dienststand 1668 wurden geprüft.
- Die Windows-x64-EXE lud Dienststand 1668 in einem getrennten Offline-Profil. Beim Ziehen folgte der verbundene Pfeil, und Rückgängig stellte beide wieder her.
- Die Grössenänderung auf einem echten iPhone und mit einem Windows-Stift ist noch nicht getestet.

## Abnahme der Werkzeugpaletten und Vorlagen

- `test575` bestand mit 103 Prüfungen. `test209` bestätigte die 56 bisherigen Whiteboard-Prüfungen.
- TypeScript, Einzeldatei und Dienststand 1670 wurden geprüft.
- In der Windows-x64-EXE wurden gefüllte Raute, Vorlagenzug und Rückgängig offline in einem getrennten Profil geprüft. Die Stiftpalette blieb auch bei 390 px erreichbar.
- Gespeicherte Rechtecke ohne Füllangabe behalten ihre Kontur. Raute, Füllung und Markerstil benötigen für die vollständige Darstellung eine aktualisierte App.
- Die Prüfung mit einem echten iPhone und Windows-Stift steht aus.

## Abnahme frei platzierter Gedankenkarten

- In Dienststand 1674 erscheinen die Knoten und Äste frei auf der Fläche. Bestehende Karten behalten ihre Position, Texte und gespeicherten Einstellungen für die Seitenansicht.
- In der Windows-EXE im getrennten Offline-Profil waren bei 36 % Zoom alle acht Knoten zweier Bestandskarten sichtbar. Ein Doppelklick änderte das Thema im bestehenden Block. Die Leiste für Farbe, Text und Kopieren blieb oberhalb der Formauswahl in Bildschirmgrösse.
- Die Fläche hält beim Fokussieren einen festen Ausschnitt. Dadurch bleiben Auswahlrahmen und gezeichnete Formen an denselben Bildschirmkoordinaten.
- Typprüfung, Einzeldatei und Dienststand waren erfolgreich. Der Flächenlauf `test575` bestand mit 111 Prüfungen, der eigenständige Gedankenkarten-Test `test538` mit 53 Prüfungen.

## Weiterer Ausbau

Die Fortsetzung auf `7adad1ae` mit Rahmen, Ausrichten, Ebenenübersicht,
verschachtelten Gruppen, Kommentaren und Austausch ist in
[AFFINE-WEITERER-AUSBAU-PR232.md](AFFINE-WEITERER-AUSBAU-PR232.md) dokumentiert.
