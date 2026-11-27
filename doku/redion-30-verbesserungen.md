# RED ION – 30 Verbesserungen: Umsetzung und Abnahme

Ausgangsstand: main nach PR #242 (6eb5ac7), 27.11.2026. Die Tabelle ist eine Arbeitsliste, keine Behauptung, dass alle Funktionen bereits fehlen oder fertig sind. Vor jedem Arbeitspaket vorhandenen Code, Tests und offene PRs prüfen. Vorhandene native Funktionen wiederverwenden. Änderungen in kleinen, unabhängigen PRs; main nur nach vollständig grüner CI am aktuellen Head. Keine abgeschwächten Prüfungen, keine produktiven Kundendaten in Tests, keine Zugangsdaten im Repository. Geräteabnahme und produktive Veröffentlichung separat protokollieren.

Status: O = offen / Bestand prüfen; T = Teilimplementierung vorhanden; A = in diesem PR begonnen. Erst nach nachgewiesener Abnahme auf erledigt setzen.

| ID | Ziel | Status | Technische Richtung und Abnahme |
|---|---|---|---|
| 01 | Connector automatisch aktualisieren | A | Kanonischer tools/list-Export und Driftvergleich. CI prüft Schema und Rechte; produktiven Worker deployen und Connector nach freigegebener Veröffentlichung neu laden. Abnahme: vollständiger Live-Vertragsabgleich ohne Abweichung. |
| 02 | Vollständige MCP-Steuerung | T | Inventar aller UI-Befehle gegen MCP-Aktionen, gemeinsamen Dienst für zulässige Befehle. Abnahme: pro unterstützter Aktion UI/MCP-Parität; lokale oder besonders geschützte Funktionen ausdrücklich markieren. |
| 03 | Sofortiger iPhone-/Windows-Abgleich | T | Vorhandenen Sync-Kern und Versionskonflikte prüfen, Benachrichtigung und Wiederholung. Abnahme: synthetischer Remote-Schreibtest plus reale Geräte; Konflikt und Offline-Wiederkehr ohne Datenverlust. |
| 04 | Undo/Redo über MCP | O | Begrenztes versioniertes Änderungsjournal mit erwarteter Version und ACL; keine Wiederherstellung fremder Daten. Abnahme: Rückgängig/Wiederholen, Konflikt und Rechte. |
| 05 | Mehrere Aktionen | T | Schaltplan-Batches vorhanden, Grafik-/Dokument-Batches mit atomarem Commit ergänzen. Abnahme: später Schritt fehlerhaft, keine Teiländerung; Parallelzugriff. |
| 06 | KI-Inhalte überprüfen | O | Validierung pro Blockart, strukturierte Fehler, lesende Vorschau. Abnahme: fehlerhafte Inhalte vor Commit abweisen; keine automatischen destruktiven Korrekturen. |
| 07 | Vollständiger Simulator | T | Native Simulation und MCP-Messung erweitern, Modellgrenzen explizit. Abnahme: definierte AC/DC-, Schalter- und Relaisfälle mit Sollwerten. |
| 08 | Verdrahtungsprüfung | T | Native Kontakte/Netzliste, explizite Klemmen und geometrische Kontakte vergleichen. Abnahme: Schema 3/6 und absichtliche Verdrahtungsfehler. |
| 09 | Kurzschlüsse und falsche Anschlüsse | T | Native Diagnostik mit betroffenen IDs, keine elektrische Sicherheitsfreigabe. Abnahme: bekannte Kurzschlüsse, offene Pfade und fremde Kontakte. |
| 10 | Fehlerkorrektur | O | Nur begründete Änderungsvorschläge, Vorschau und erneute Simulation; keine stillen Netzänderungen. Abnahme: falsches Schema 6 reparieren und vollständige Sollfolge prüfen. |
| 11 | Virtuelles Multimeter | T | Vorhandene Messung erweitern um UI-Messspitzen, geeignete Messarten und Einheiten. Abnahme: bekannte U/I/R-Sollwerte und ungültige Messung. |
| 12 | Stromfluss visualisieren | O | Native Solver-Ergebnisse auf Leitungsdarstellung abbilden, Zustand unbekannt separat. Abnahme: Schalterwechsel, offene Leitung und Kurzschluss. |
| 13 | Relais/Schütze/Zeitrelais | T | Statische und dynamische Zustandsmodelle unterscheiden. Abnahme: Selbsthaltung, Abfall, Zeitverlauf und definierte Reset-Semantik. |
| 14 | Schweizer Fachzeichen | T | Vorhandene 131 Symbole, Klemmen und Modelle inventarisieren; Quellen und Normbezug prüfen. Abnahme: Katalogparität und fachliche Prüfung, keine pauschale Normzertifizierung. |
| 15 | Einheitliches Zeichnen-Dock | O | Gemeinsame Werkzeugleiste mit Adapter pro Grafikblock; iOS UIKit-Dock unverändert schützen. Abnahme: Touch, Tastatur, Maus, VoiceOver. |
| 16 | Unendliche Zeichenfläche | T | Kamera und virtuelle Darstellung, keine unbeschränkte Datenmenge. Abnahme: Navigation, grosse Szenen und Speichergrenzen. |
| 17 | Mindmap Auto-Layout | T | Vorhandene Layout-/Zoom-Funktionen aus #237 nutzen; komplexe Bäume und Querverbindungen. Abnahme: 61+ Knoten mobil und Desktop, keine verdeckten Bedienelemente. |
| 18 | Vollbildmodus | O | Geteilte Editor-Hülle mit Fokus, Rückkehr und Safe Areas. Abnahme: jeder Grafikeditor, Zustands- und Scrollposition erhalten. |
| 19 | Minimap | O | Kamera-Ausschnitt und Bounding Box, Navigation per Touch. Abnahme: kleine und grosse Szenen, Zoom/Drag. |
| 20 | Apple Pencil | O | Native iOS-Eingabepfade mit Druck, Neigung und Handballenprüfung. Abnahme: reales iPad und Pencil erforderlich; Browser allein reicht nicht. |
| 21 | KI-Prüfungstrainer | T | Native Quiz-Modelle und Generator, Fachprüfung vor Freigabe. Abnahme: verschiedene Fragetypen, nachvollziehbare Lösungen. |
| 22 | Automatische Lernkarten | T | Vorhandene Lernkarten-/Set-MCP-Werkzeuge ausbauen. Abnahme: atomare Sets, Duplikate und Quellenbezug. |
| 23 | Interaktive Elektroübungen | T | Vorhandene Übungspläne und Schaltprüfung verbinden. Abnahme: Aufgabenstellung, Versuch, Sollvergleich, Feedback. |
| 24 | Lernstatistiken | O | Lokale Ereignisse und aggregierte Fortschrittsdaten, opt-in Sync. Abnahme: reproduzierbare Kennzahlen, Offline und Löschung. |
| 25 | Fehleranalyse nach Prüfung | O | Fehler nach Lernziel gruppieren, Hinweise aus geprüften Lösungen. Abnahme: richtige Zuordnung und verständliche Rückmeldung. |
| 26 | Schnellere Tests | O | Baseline messen, Test-Sharding, Caching und unabhängige Schritte optimieren; keine entfernten Assertions. Abnahme: gleiche Testabdeckung und dokumentierter Laufzeitvergleich. |
| 27 | RAM reduzieren | O | Profiling an repräsentativen grossen Dokumenten; Virtualisierung, Ressourcenfreigabe. Abnahme: vergleichbare Messungen vor/nach Änderung ohne Funktionsverlust. |
| 28 | Offline-Sync | T | Outbox, Konflikte, Wiederanlauf, Versionsprüfung. Abnahme: Netzwerkverlust, parallele Änderungen, Neustart, keine verlorenen Änderungen. |
| 29 | Verschlüsselte Backups | T | Vorhandenes Backup-Format und Schlüsselverwaltung prüfen; wiederherstellbare automatische Sicherung mit Einwilligung. Abnahme: Verschlüsselung, falscher Schlüssel, Restore-Test und Aufbewahrung. |
| 30 | Automatische Builds/Releases | T | Vorhandene GitHub-/Cloudflare-/Codemagic-Pipelines prüfen; versionierte Artefakte und geschützter Produktionsschritt. Abnahme: reproduzierbarer Build, CI-Gate, Rollback, signierte Geräteartefakte sofern Zugang vorhanden. |

## MCP-Release-Gate

1. `npm run test:mcp-connector`, `npm run test:mcp-cloud`, Runtime- und reguläre CI vollständig grün.
2. `npm run mcp:connector:export` erzeugt den kanonischen Vertrag in `build/mcp/redion-v07-werkzeuge.json`.
3. Nach freigegebenem Deployment eine vollständige authentifizierte tools/list-Antwort oder den Connector-Vertrag als lokale JSON-Datei sichern. Keine Tokens mitspeichern oder einchecken.
4. `node skripte/mcp-connector-vertrag.mts --compare <werkzeugliste.json>` meldet fehlende/unerwartete Werkzeuge und geänderte Felder, Exit-Code 1 bei Drift. Für einen reinen Lesegrant `--read-only` anhängen. Vergleich ist absichtlich streng; ein Anbieterformat muss zuerst verlustfrei auf MCP tools/list normalisiert werden.
5. Connector im Anbieter-Editor neu laden bzw. aktualisieren, Live-Test in einem ausdrücklich dafür vorgesehenen Testdokument ausführen. Erst dann produktive Parität behaupten.

Diese Schritte automatisieren die Erkennung von Drift, nicht die externe Veröffentlichung. Cloudflare-Konto, Connector-Administration und Signierzugänge müssen separat verfügbar sein. Elektrische Simulation bleibt ein Lernwerkzeug, keine Installations- oder Sicherheitsabnahme.
