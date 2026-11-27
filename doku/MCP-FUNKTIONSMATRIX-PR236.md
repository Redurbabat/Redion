# Redion-Funktionsmatrix für PR #236

Ausgangspunkt ist `7876bb44` auf `feat/mcp-native-visual-tools`.
Der rekursive Dateibestand umfasst am Ausgangspunkt 1.908 versionierte
Dateien. Der [Graphify-Bericht](../graphify-out/GRAPH_REPORT.md) ist älter
als der PR. Für die Zuordnung gelten die aktuellen Register und Quelldateien.
Diese erste Matrix erfasst die Modulgruppen. Der Abgleich jeder einzelnen
Registeraktion mit ihrer Implementierung und einem Bediennachweis bleibt offen.

`npm run mcp:connector:export` exportiert alle 31 lokal registrierten
Cloud-Werkzeuge mit Schema und OAuth-Scope aus derselben Liste wie `tools/list`.
Die Liste enthält 16 Lese- und 15 Schreibwerkzeuge. Der Lauf ist unabhängig
von einer produktiven Verbindung. Die Windows-MCP-Oberfläche hat einen
eigenen Adapter unter `plugins/red-ion/` und `windows/`.

| Funktion und native Quelle | Benutzeraktion | Vorhandener Cloud-MCP-Weg | Offene Abdeckung | Plattform und Rechte | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Workspace, Seitenbaum und Suche · `src/schale/`, `src/bereiche/seiten/`, `src/register/navigation.ts` | Seiten öffnen, suchen, anlegen, verschieben | Workspaces, Suchresultate, Pfad, Haupt-/Unterseiten, Anlegen, Titel, Verschieben | Ordnerverhalten separat abgleichen, Duplikat, Archiv, Papierkorb, Wiederherstellung | Web/iOS/Windows-Oberfläche, freigegebener Workspace, Seitenrechte | Cloud-Route mit synthetischem Bestand |
| Blockeditor und Formate · `src/register/bloecke.ts`, `textstile.ts`, `aktionen.ts`, `src/bereiche/editor/` | Blockkatalog, Text ändern, formatieren, verschieben, verschachteln | Blockkatalog, Listen/Lesen, Anfügen, Teilmenge der Blockänderungen, Textersetzung | Verschachtelung, Umordnen, Duplizieren, Typ- und Stilfelder, Cover, Inhaltsverzeichnis, Vorlagen und Undo | Web/iOS/Windows-Oberfläche, Lese- bzw. Schreibscope und Seitenrechte | Cloud-Route und Katalogabgleich |
| Mindmap, Whiteboard und A4 · `server/mcp/visual-blocks.ts`, `src/bereiche/bloecke/arten/zeichenflaeche.ts`, `src/core/gfx/` | Native Formen, Knoten, Stift und Papier bearbeiten | Fünf Werkzeuge für Erstellen/Lesen/Bearbeiten. Versionsprüfung, native IDs, gezielte Änderungen von Knoten und Querverbindungen sowie seitenweises Lesen, Whiteboard-Gruppen, Ausrichtung, Verschieben und Ebenenreihenfolge | Umfassende Formatierung, Layout, geprüfte Koordinaten, frei platzierte A4-Inhalte | Gemeinsames Web-Rendering für Web/iOS/Windows, eingebetteter Klartextblock, Seitenrechte | Route mit nativen Datensätzen. Plattformbedienung gesondert offen |
| Schaltplan und Fachzeichen · `src/register/fachzeichen.ts`, `src/bereiche/bloecke/arten/{schaltplan,planflaeche,schaltplan-pruefung}.ts`, `server/mcp/schematic-edit.ts` | Zeichnen, Symbole und Leitungen einsetzen, Prüfung öffnen | Fachzeichenliste, nativen Plan anlegen/lesen, Bauteile und Texte einsetzen/verschieben, Klemmen mit orthogonalen Umwegen verbinden, bis zu 20 Schritte atomar bearbeiten | Verzweigungen und verbundene Bauteile bearbeiten, kontrolliert entfernen, Layout und Netzprüfung | Web/iOS/Windows-Oberfläche, Planrechte, Versionsbindung | HTTP-Tests für Einzelaktion, atomaren Batch und Konflikt. Deterministischer Umweg und unpassierbare Sperre geprüft |
| Simulation · `src/bereiche/elektro/simulation.ts`, `src/bereiche/bloecke/arten/{planflaeche,relais-kern,relais-werkstatt,relais-vorlagen}.ts` | Start, Schalter, Labor, Messwerte, Relaismodelle | Versionsgebundener Soll-/Ist-Test und statische Messwerte in redion_read_schematic | Mehr Sollwertfälle prüfen, Zeitabläufe und dynamische Steuerungen fernsteuern | Web/iOS/Windows-Oberfläche, Cloud-Prüfung mit Leserecht auf der eingebetteten Seite | Schema 6 mit acht Soll-/Ist-Fällen, fehlendem Rückleiter und unbekanntem Modell geprüft. Prüfzentrum in Chromium bei drei Breiten bedient |
| Datenbanken und Tabellen · `src/bereiche/datenbanken/`, `src/register/{ansichten,eigenschaften,formeln}.ts` | Schema, Zeilen, Filter, Board, Kalender, Berechnungen | Datenbanken auflisten und lesen | Versionierte atomare Schreiboperationen, Ansichten, CSV/Excel, kontrollierte Löschung | Web/iOS/Windows-Oberfläche, Seiten-, Zeilen- und Feldrechte | Leserechtetests |
| Lernen · `src/bereiche/wissen/trainer.ts`, `server/mcp/learning-card.ts` | Trainer, Karten, Quiz, Fortschritt | Einzelne Lernkarten und atomare Sets, kleine Rasterbilder | Abfrage, Nachbearbeitung, Statistik, Import/Export und weitere Übungsformen | Web/iOS/Windows-Oberfläche, Schreibrechte auf Zielseite | Synthetischer Cloud-Route- und Formatnachweis |
| Dateien, PDF, Import/Export · `src/bereiche/dateien/`, `src/bereiche/pdf/`, `src/kern/ablage/` | Datei öffnen, PDF markieren, sichern, importieren | Blockbezogene Metadaten über lesbare Seiten | Medienbytes mit Eigentümerkette, PDF-Paginierung, Tinte, OCR, Formate und Wiederherstellung | Browser und native Dateiadapter, Dateirechte und Größenlimits | Plattform- und Inhaltstests offen |
| Kalender, Aufgaben, KI und Vorlagen · `src/bereiche/{planen,ki,vorlagen}/`, `src/register/{ki,vorlagen}.ts` | Aufgaben, Termine, KI-Aktionen und Vorlagen | Aufgaben lesen und geprüfte Aufgabenfelder ändern | Termine, Vorlagen und freigegebene Fachaktionen gezielt exponieren | Gemeinsame Oberfläche, jeweilige Objekt-/Providerrechte | Cloud-Aufgabentests |
| Synchronisierung und Berechtigungen · `worker.ts`, `server/mcp/`, `src/kern/abgleich/` | Anmelden, Rechte setzen, Geräte abgleichen | OAuth, freigegebene Workspaces, versionierte Cloud-Schreibwege | Sofortige sichtbare Aktualisierung, Wiederverbindung, Konflikte und Produktivabnahme | Worker/D1 und native Clients, OAuth, ACL, Verschlüsselung | Synthetische Route und Vertrag, produktiver Nachweis offen |
| iOS, Windows und lokale Diagnose · `ios/`, `windows/`, `plugins/red-ion/` | Native Navigation, Geräte- und Dateidialoge, Plattformdiagnose | Eigener Windows-MCP-Adapter, Cloud-Werkzeuge vermitteln Dokumente | Tatsächliche iPhone-/Windows-Bedienung, Diagnoseinventar. Lokale Systemrechte brauchen menschliche Freigabe | Plattformabhängig | Native Abnahme offen |

Für Nutzeraktionen bleiben die Register `bloecke`, `aktionen`, `befehle`,
`werkzeuge`, `tasten`, `textstile`, `ansichten`, `eigenschaften`,
`vorlagen`, `ki`, `navigation` und `module` die Referenz. Eine
registrierte Aktion zählt erst nach Zuordnung und überprüftem Aufruf als
MCP-Funktionsparität. Für den produktiven Connector ist sein tatsächlich
angebotener Vertrag einzeln nachzuweisen.

## Prüfstand des ersten Umsetzungsschritts

- 70 Cloud-MCP-Tests und 3 Connector-Vertragstests bestanden. Der synthetische
  Cloudflare-Worker-/D1-Lauf und der Connector-Export bestanden für `67f73e1c`.
- Fünf lokale Sync-Vertragstests bestanden. Die Aktualisierung auf verbundenen
  Geräten und der produktive Cloud-Endpunkt sind noch offen.
- `npm run typecheck`, `npm run typecheck:mcp`, Web-Einzeldatei und
  Offline-Dienststand wurden mit den Projektwerkzeugen geprüft.
- `Stromfluss.pruefeSchalter` prüft 1 bis 32 Zustandskombinationen aus der
  Ruhelage gegen explizite Sollwerte. Der letzte gewählte Handschalter wechselt
  am schnellsten. Unbekannte Modelle und instabile oder fehlende Messwerte
  dürfen keinen Erfolg auslösen. Zeitabhängige Sequenzen brauchen weitere Tests.
- Die violette Linie war das CSS-Pseudoelement der KI-Herkunft am Schaltplan.
  Drei Chromium-Breiten prüfen den normalen Block, eine aktive Auswahl und
  die Herkunftsmarkierung an Textblöcken. Vorher-/Nachher-Bilder und Bilder
  des Prüfzentrums enthalten synthetische Daten.
- Bestehende Elektroläufe 604–608, 625 und 631 bestanden. Die 60 Zusagen
  zu Dock, PDF und Whiteboard bestehen im Chromium-Browser. Das Prüfzentrum
  besitzt einen eigenen Schliessknopf. Der zusätzliche Knopf der Werkstätten
  liegt daher nicht über seinen Eingaben.
- Vier zuvor rote Bestandsprüfungen (87, 290, 401, 402) gezielt korrigiert
  und einzeln bestätigt. Ein SHA-256-Abgleich begrenzt die Ausnahme für
  Steuerbytes auf das unveränderte npm-Bündel von pdf-lib 1.17.1.
  Eingebundene CSS-Token werden erkannt, drei Treffflächen messen 44 Pixel.
- Schaltpläne brauchen zum Lesen und Bearbeiten eine nachgewiesene
  Elternkette. Ein abgelöster Datensatz bleibt auch bei passendem Seitenfeld
  unzugänglich. Vor dem atomaren Speichern wird die Version aller geprüften
  Eltern im selben SQL-Update erneut geprüft.
- Mac-Baulauf 45908191971 für `581e3b98` erfolgreich. Das Artefakt ist eine
  unsignierte IPA. Abnahme auf einem echten iPhone steht aus.

Der MCP-Kombinationstest nutzt die gleiche erzeugte Simulationsdatei wie das
Prüfzentrum und bleibt Leseoperation. Schema 6 wird aus einer gemeinsamen
synthetischen Vorlage in beiden Ladewegen geprüft. Über die Cloud prüft der
Client seinen gelesenen Versionsstand, erhält den Bericht und verändert den
Plan nicht. Siehe [Cloud-MCP-Anleitung](RED-ION-CLOUD-MCP.md).
Der echte isolierte Workerd-/D1-Test ruft den Bericht über das MCP-SDK mit
einem Lese-Token ab. Er prüft die acht Ergebnisse, eine unveränderte
Planversion und einen Konflikt bei falscher Versionsvorgabe.

Der gleiche Worker-Test prüft am Betriebspunkt der Schema-6-Lampe rund
230 V, 0,435 A und 100 W, danach 0 V und 0 A bei geänderter Stellung.
Eine ausserhalb des Modells liegende Stellung wird abgewiesen.

Für Schreibzugriffe auf Mindmaps, Whiteboards und A4-Blätter prüft das
SQL-Update auch die Versionen der Elternkette. Die Gegenprobe entfernt ein
A4-Blatt nach der Rechteprüfung aus seiner Elternseite. Die vorbereitete
Papieränderung erhält einen Konflikt und bleibt ungespeichert.

Whiteboard-Auswahlen verwenden dieselbe erzeugte Geometrie im Cloud-Worker
und im Editor. Geprüft sind verschachtelte Gruppen, der Schutz gesperrter
Mitglieder, Ausrichtung, Verschieben von Formen und Stiftpunkten und die
Zeichenreihenfolge. Ein MCP-erzeugtes Whiteboard wurde in Chromium bei 1366
und 390 Pixeln geladen. Die Gruppe liess sich im Editor auflösen und per
Rückgängig wiederherstellen.

Native Mindmap-Knoten lassen sich einzeln ergänzen und samt Ast unter einen
anderen Elternknoten hängen. Querverbindungen werden separat gespeichert.
Der Cloud-Test prüft Zyklus- und Duplikatabwehr, Versionsschutz und eine
per MCP erstellte Karte mit 151 Knoten. Der Editor zeigt die verschobene
Verzweigung und den Querverweis mit den bestehenden Zeichenkomponenten.
