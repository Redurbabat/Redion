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
| Mindmap, Whiteboard und A4 · `server/mcp/visual-blocks.ts`, `src/bereiche/bloecke/arten/zeichenflaeche.ts`, `src/core/gfx/` | Native Formen, Knoten, Stift und Papier bearbeiten | Fünf Werkzeuge für Erstellen/Lesen/Bearbeiten. Versionsprüfung und Elemente mit nativen IDs | Anordnung, Gruppierung, umfassende Formatierung, Layout, geprüfte Koordinaten, paginierte Knoten, frei platzierte A4-Inhalte | Gemeinsames Web-Rendering für Web/iOS/Windows, eingebetteter Klartextblock, Seitenrechte | Route mit nativen Datensätzen. Plattformbedienung gesondert offen |
| Schaltplan und Fachzeichen · `src/register/fachzeichen.ts`, `src/bereiche/bloecke/arten/{schaltplan,planflaeche,schaltplan-pruefung}.ts`, `server/mcp/schematic-edit.ts` | Zeichnen, Symbole und Leitungen einsetzen, Prüfung öffnen | Fachzeichenliste, nativen Plan anlegen/lesen, Bauteile und Texte einsetzen/verschieben, Klemmen verbinden, bis zu 20 Schritte atomar bearbeiten | Verbundene Bauteile verschieben, kontrolliert entfernen, Layout und Netzprüfung | Web/iOS/Windows-Oberfläche, Planrechte, Versionsbindung | HTTP-Tests für Einzelaktion, atomaren Batch, Konflikt und zurückgerollte Eingabe |
| Simulation · `src/bereiche/elektro/simulation.ts`, `src/bereiche/bloecke/arten/{planflaeche,relais-kern,relais-werkstatt,relais-vorlagen}.ts` | Start, Schalter, Labor, Messwerte, Relaismodelle | Eigenständige Simulationsaktion fehlt | Bestehenden graphbasierten Kern gemeinsam nutzbar machen, Abdeckung der Bauteilmodelle und Erwartungstests belegen, Zeit und Messung fernsteuern | Web/iOS/Windows-Oberfläche, Simulatorzugriff künftig an Planrechte binden | Kern und Eintrittspunkte identifiziert. Geforderte Abnahme offen |
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
