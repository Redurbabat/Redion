# Laufendes Ziel: AFFiNE-Funktionen und Elektro-Docks

26. November 2026 · Fortsetzung ab `1411e16b`, Arbeitszweig
`feature/pr232-affine-electro-expansion`. Redur beauftragt den fortlaufenden
Ausbau aller AFFiNE-Funktionen und passende Docks auch im Fachzeichnen und
Elektrosimulator. Der [Gesamtabgleich](AFFINE-GESAMTABGLEICH.md) bleibt der
Katalog für Editor, Verwaltung, Daten, Zusammenarbeit und Plattformen.

## Abnahmevertrag

Vorhandene Register, Zeichner, Dateiablage, Verlauf und Abgleich werden weiter
verwendet. Keine Umdeutung alter Koordinaten, kein zweiter Simulator, keine
stillen Importverluste. Eine Funktion gilt erst mit tatsächlicher Bedienung,
Sicherungsrundreise und Plattformnachweis als geprüft. Das aktive Gesamtziel
wird nicht wegen eines fertigen Teilbogens als abgeschlossen bezeichnet.

| Arbeitspaket | Ausgangspunkt | Fertig wenn |
| --- | --- | --- |
| Fachzeichnen | Plan hat Galerie, Fachzeichen und Stromstart liegen ausserhalb | Fachzeichen und Zeichnen direkt im gemeinsamen Dock; bestehende Leitungen/Schienen/Verlauf bleiben bedienbar |
| Simulation | Zeichendock bleibt sichtbar, obwohl die Fläche eine Schalttafel ist | Ein aktives Dock für Schalten, Messen, Pause, Reset, Tempo und Skizzieren; kein Planinhalt wird durch Simulation gespeichert |
| Relais/Batterien | Zusatzfächer mit eigenen Formularen und Aktionen | Passendes Dock führt dieselben bestehenden Aktionen aus; Import, Freigabe, Originalbytes und Messungen bleiben erhalten |
| Drehgriffe | Auf Seite/Whiteboard nur Winkel in der Objektübersicht | Griff mit Maus/Stift/Touch, proportionaler Vorschau, Sperrschutz und genau einem Verlaufsschritt |
| Rahmen | Titel/Reihenfolge/Ausschnittsvortrag | Inhalt gemeinsam bewegen, Vollbild mit Rückweg und PDF-Folienexport |
| Kommentare | Lokale Objektfäden | Antworten, Autoren, Erwähnungen und bestehender Dokumentabgleich; keine behauptete Serverzustellung ohne Nachweis |
| AFFiNE-Import | Teilmenge von BlockSuite-JSON-GFX | Weitere Formarten, Mindmaps, Rich Text und Dokumentstruktur samt Anhängen; genaue Formatgrenzen und Sicherungsrundreise |
| Übriger Katalog | Einzelne Gegenstücke vorhanden, Parität teils offen | Jede Zeile mit Referenz, Implementierung und aktuellem Nachweis; offene Dienst-/Geräteabhängigkeiten sichtbar |
| iOS | UIKit-Dock und Web-Brücke vorhanden | Bauprüfung, anschliessend echte Geräte-/IPA-Abnahme; Browserbreite ersetzt diesen Nachweis nicht |

## Bild- und Prüfstand

Eigene 29 Chromium-Aufnahmen liegen unter `bilder/affine-elektro/`; Galerie
und ZIP `redion-affine-elektro-29-bilder` liegen ausserhalb von Git. Getestete
Breiten: 1366, 390 und 320 Pixel. Dies sind keine UIKit-/Geräteaufnahmen.

Aktuelle Ergebnisse dieses Bogens:

- `affine-electro.browser.test.mts`: 48/48. Genau ein aktives Kontextdock,
  echte Ausschaltung mit leuchtender Lampe, Schalten, Pause, Reset, Tempo,
  Messwerte sowie Relais- und Batterieaktionen. Keine Planänderung durch den
  Simulationslauf. Die vorhandenen Batterie-Rechner werden jetzt unverändert
  unter `quell/` mitgepackt; zuvor fehlten ihre Wurzeldateien im nativen Paket.
- `affine-direct.browser.test.mts`: 26/26. Echte Griffgesten auf Seitenfläche
  und Whiteboard, Vorschau ohne Store-Schreibzugriff, ein Verlaufsschritt,
  gemeinsam bewegte Rahmenformen, Vollbild und PDF-Download mit geprüfter
  Seitenzahl und Abmessungen. Dokumentblöcke innerhalb eines Rahmens werden
  noch nicht gemeinsam mit den Formen bewegt.
- `affine-comments-sync.browser.test.mts`: 13/13. Autoren, Antworten,
  Erwähnungen, Sicherungsrundreise und Dreiwege-Abgleich. Unabhängige Antworten
  bleiben erhalten; Bearbeiten gegen Löschen und konkurrierende Geometrie
  melden Konflikte. Die Entscheidung erreicht Array-Objekte anhand ihrer ID.
  Gegenprobe vor der Korrektur fehlgeschlagen; danach bestanden.
- `affine-documents.browser.test.mts`: 13/13. Zwei Dokumente im tatsächlichen
  BlockSuite-Snapshot-Schema, Rich Text, Hierarchie, Anhänge, neue Ziel-IDs,
  Mindmap-Verbindungen und Sicherungsrundreise. Originalarchiv bleibt erhalten.
  Fehlende Anhänge brechen vor dem ersten Schreibzugriff ab. Nicht unterstützte
  Blöcke erscheinen sichtbar als erhaltene Quelldaten mit Warnung.
- Vorhandener `affine-workbench.browser.test.mts`: 101/101.
- Bestehende Läufe 96, 100, 209, 575, 625 und 639: bestanden. Lauf 631 fand
  zunächst ein vom Werkstattfach verdecktes Relais; nach Ausblenden während
  der Simulation erneut 23/23 bestanden.
- Abgleichläufe 77, 113, 201 und 204 sowie Architektur 537: bestanden. 77 und
  113 nach der abschliessenden ID-Pfad-Korrektur erneut bestanden.
- Native Dock-/Paketverträge und bestehende Batterie-Node-Tests: 53/53.
- Erzeugtes JavaScript und gesamte TypeScript-Prüfung (`test105`): 371/371.
  Web-Einzeldatei gebaut, Dienststand 1707, Hash `9287167e9c05c19d`.
- Schneller Gesamtlauf: zunächst 42/50. Drei Befunde dieses Bogens korrigiert:
  Entscheidungszähler aktualisiert, unveränderte generierte Batterie-Kopien
  nur bei Bytegleichheit als erzeugt anerkannt, Inselbau-Reihenfolge mit dem
  zusätzlichen Paketierungsschritt geprüft. 109/550/578 danach bestanden.
  Der Sicherungslauf 96 hatte im Gesamtlauf keine Fassungen angelegt; der
  Einzelwiederlauf bestand 18/18. Vier bekannte Ausgangsbefunde bleiben:
  87 (Steuerzeichen im unveränderten pdf-lib), 290 (CSS-Präfix tg), 401
  (Tokeninventar/Fremdstile) und 402 (ältere kleine Steuerelemente). Sie sind
  bereits im [Dock-Bericht](KONTEXT-DOCKS-PR232.md) als Ausgangsbefunde belegt.
  Der Gesamtlauf wird deshalb nicht als vollständig grün ausgegeben.

Die importierten Zusatzfelder sind im [Datenformat](REDION-FORMAT.md)
beschrieben. Es wurde in diesem Bogen kein weiterer AFFiNE-Quellcode kopiert.
Eigene Importadapter lesen die dokumentierten Formate des festgehaltenen
Referenzstands.

## Verbleibende Abnahme

Der Gesamtkatalog bleibt offen. Dazu gehören insbesondere freie Verbinderenden,
vollständige Schrift-/Formstile, gemeinsam bewegte Dokumentblöcke in Rahmen,
Bildzuschnitt und AFFiNE-Datenbank-/Tabellenformate jenseits einfacher Zeilen.
Binäre Yjs-Dokumente werden nicht als unterstützter JSON-Import ausgegeben.
Serverzustellung von Erwähnungen, Präsenz, Freigaben und KI-/Providerabläufe
benötigen reale Dienstnachweise. Vorhandene Redion-Gegenstücke sind keine
pauschale Abnahme identischen AFFiNE-Verhaltens.

iPhone-Gerät, signierte IPA, Windows-/macOS-Geräteabnahme und Deployment:
**NICHT GETESTET beziehungsweise NICHT AUSGEFÜHRT**. Der bestehende manuelle
Mac-Workflow kann nach Push des genauen Standes eine unsignierte IPA bauen;
sein Ergebnis wird getrennt dokumentiert. Graphify ist hier nicht installiert;
der Graph wurde deshalb nicht als aktuell ausgegeben.
