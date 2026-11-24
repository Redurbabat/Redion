# AFFiNE-Funktionen in Redion

Referenz ist der [AFFiNE-Quellstand 81da59d](https://github.com/toeverything/AFFiNE/tree/81da59d63d535d72ba677a097d9a0cc9a5871ade). Redion behält seine Seiten, Berechtigungen und das `.redion`-Format. Der Ausbau nutzt Redions vorhandene Werkzeuge. AFFiNE-Module mit gesonderter Lizenz bleiben von dieser Umsetzung getrennt.

| Arbeitsablauf | Redion heute | Weiterer Ausbau |
| --- | --- | --- |
| Seite und freie Fläche | Dieselbe Seite lässt sich als Textseite oder auf der freien Fläche öffnen. Blöcke lassen sich auf der Fläche platzieren. | Rahmen und Präsentationsfolgen, frei gruppierbare Elemente, Ebenen, Sperren und grössenveränderbare Formen. |
| Formen und Haftnotizen | Auf der Seitenfläche lassen sich Formen und Stiftstriche auswählen, gemeinsam verschieben, beschriften, verbinden und rückgängig machen. | Auswahllasso, skalierbare Gruppen, Drehung, verbundene Blöcke und Übersicht aller Seitenflächen. |
| Dokumente und Verweise | Blockeditor, Markdown, Dateianhänge, Seitenlinks, Vorschau, Rückverweise und geteilte Ansicht sind vorhanden. | Vorschauen eingebetteter Dokumente, Kommentar-Fäden in Blöcken, gemeinsame Vorlagen und AFFiNE-Import mit Anhängen. |
| Bibliothek und Planung | Arbeitsbereiche, Ordner, Suche, Favoriten, Tags, Aufgaben und Kalender sind vorhanden. | Journal, dynamische Sammlungen, Arbeitsbereichseigenschaften und Vorlagen für wiederkehrende Dokumente vergleichen und ausbauen. |
| Datenbanken | Tabellen, Ansichten, Relationen, Filter und Formeln sind vorhanden. | AFFiNE-Ansichten und deren Interaktionen am konkreten Datenmodell abgleichen. Dazu gehören Kanban, Kalender, Diagramme und Aktivitätsansichten. |
| Offline und Zusammenarbeit | Lokale Ablage, Sicherungen und optionaler Geräteabgleich sind vorhanden. | Gleichzeitiges Bearbeiten, Präsenz, Konflikte, Freigaben und die vollständige Wiederherstellung mit Anhängen Ende zu Ende prüfen. |
| KI, Integrationen und Clients | Redion hat eigene KI-, MCP-, Lern-, PDF- und Elektro-Werkzeuge sowie Windows- und iPhone-Clients. | AFFiNE-Arbeitsabläufe für Dokumente und Fläche, Web Clipper, Android und weitere native Funktionen einzeln integrieren und prüfen. |

## Flächenwerkzeuge ausprobieren

1. Öffne in einer Redion-Seite die Ansicht **Fläche**.
2. Wähle **Auswählen** und ziehe eine gezeichnete Form. Mit **Umschalt-Klick** kommen weitere Formen dazu. **Alle Formen** funktioniert auch über die Werkzeugleiste. Im Fokus der Fläche bewegen die Pfeiltasten die Auswahl.
3. Mit **Haftnotiz** setzt du einen beschrifteten Zettel. Eine ausgewählte Haftnotiz oder ein Rechteck lässt sich über **Beschriften** bearbeiten.
4. Wähle **Verbinden** und tippe nacheinander auf zwei Formen. Der Pfeil folgt den Formen beim Verschieben. Löschen und Rückgängig verwenden den vorhandenen Verlauf.

## Abnahme dieses Stands

- Die Browserläufe `test575` und `test209` bestanden mit 59 bzw. 56 Zusagen. Geprüft wurden unter anderem Maus, Tastatur, Touch bei 390 px, Abbruch, gemeinsamer Verlauf, verbundene Pfeile und Neuladen.
- TypeScript, Einzeldatei und Dienststand wurden geprüft.
- Das Windows-x64-Testpaket wurde offline in einem getrennten Profil gestartet. Mehrfachauswahl, Verschieben, verbundene Pfeile und Rückgängig funktionierten dort.
- Die Touch-Abnahme auf einem echten iPhone steht aus.
