# RED Ion · Issues und Entwicklungsplan 2026

Stand: 18. November 2026. 168 Anforderungen. Diese Liste dokumentiert Arbeit und Abnahmen; sie ist noch nicht als Seite in deinem Redion-Datenbestand angelegt. Die bisherigen 46 MCP-Werkzeuge bleiben erhalten.

## Verbindlicher erster Ausbau

Zuerst Visual MCP und sichere Mehrschritt-Automatisierung vollständig; zusätzlich universeller Link, gespeicherte Freigaben und Cloud-Zugriff ohne laufenden Laptop. Übrige Phasen als Roadmap.

Abgehakt wird erst nach tatsächlicher Abnahme. Vorhandene Grundlagen werden geprüft und erweitert. Gespeicherte lokale Adapterfreigaben und automatische Profilauswahl sind in Umsetzung; isolierte Gegenproben und Sicherheitsprüfungen bestehen bereits. Die echte neue Windows-Version ist noch nicht abgenommen.

## Cloud, Zugriff und sichtbare Issues

- [ ] CLOUD-001 · P0 · Eine HTTPS-MCP-Adresse für kompatible KI-Clients kopieren
- [ ] CLOUD-002 · P0 · Anmeldung und Freigabe einmalig speichern; Rechte in Einstellungen ändern oder widerrufen
- [ ] CLOUD-003 · P0 · Cloud-MCP bei ausgeschaltetem oder offlineem Laptop bereitstellen
- [ ] CLOUD-004 · P0 · Freigegebene Daten und Änderungen über vorhandenen Sync sicher abgleichen; Konflikte prüfen
- [ ] CLOUD-005 · P0 · Offline-Gerätestatus und Alter gespeicherter Bilder ausdrücklich anzeigen
- [ ] CLOUD-006 · P0 · Issues mit Status und Abnahmen in Redion sichtbar verwalten

## Visual MCP, Verbindung und Datenschutz

- [ ] SEC-001 · P0 · Bildzugriff separat freigeben
- [ ] SEC-002 · P0 · Nur das RED-Ion-Fenster erfassen
- [ ] SEC-003 · P0 · Keine anderen Windows-Programme fotografieren
- [ ] SEC-004 · P0 · Passwörter und Tokenfelder automatisch ausblenden
- [ ] SEC-005 · P0 · Screenshot vor Übermittlung anzeigen
- [ ] SEC-006 · P0 · Sitzungsbezogene Freigaben
- [ ] SEC-007 · P0 · Leserechte und Schreibrechte trennen
- [ ] SEC-008 · P0 · Kritische Aktionen weiterhin bestätigen
- [ ] SEC-009 · P0 · Maximale Bildgrösse begrenzen
- [ ] SEC-010 · P0 · Bilddaten nur so lange wie nötig speichern
- [ ] SEC-011 · P1 · Übertragene Daten im Aktivitätsprotokoll anzeigen
- [ ] SEC-012 · P1 · Alle Freigaben sofort widerrufen können
- [ ] SEC-013 · P1 · Zugriff pro Dokument oder Arbeitsbereich einschränken
- [ ] SEC-014 · P1 · Automatische Bildaufnahmen begrenzen
- [ ] SEC-015 · P1 · Vertrauliche Bereiche vor der Aufnahme maskieren
- [ ] SETUP-001 · P0 · Automatisch aktives Windows-Profil erkennen
- [ ] SETUP-002 · P0 · MCP-Server automatisch starten
- [ ] SETUP-003 · P0 · Verbindungsstatus in Echtzeit anzeigen
- [ ] SETUP-004 · P0 · Tunnel-Fehler verständlich erklären
- [ ] SETUP-005 · P0 · Verbindung mit einem Klick testen
- [ ] SETUP-006 · P0 · Fehlende lokale Komponenten erkennen
- [ ] SETUP-007 · P1 · Verbindung nach App-Neustart wiederherstellen
- [ ] SETUP-008 · P1 · Tunnel kontrolliert neu starten
- [ ] SETUP-009 · P1 · Version von App und MCP-Server vergleichen
- [ ] SETUP-010 · P1 · MCP-Diagnose als Bericht exportieren
- [ ] SETUP-011 · P1 · Verbindungsprobleme gezielt reparieren
- [ ] SETUP-012 · P2 · Mehrere freigegebene MCP-Clients verwalten
- [ ] VIS-001 · P0 · Screenshot des aktuellen RED-Ion-Fensters
- [ ] VIS-002 · P0 · Nur den geöffneten Editor erfassen
- [ ] VIS-003 · P0 · Schaltplan als Bild an ChatGPT übertragen
- [ ] VIS-004 · P0 · PDF-Seiten als Bilder übertragen
- [ ] VIS-005 · P0 · Bilder innerhalb einer Notiz lesen
- [ ] VIS-006 · P0 · Screenshot direkt nach einer Änderung
- [ ] VIS-007 · P1 · Einzelne Bereiche vergrössert erfassen
- [ ] VIS-008 · P1 · Vorher-Nachher-Bilder vergleichen
- [ ] VIS-009 · P1 · Mehrere PDF-Seiten gleichzeitig analysieren
- [ ] VIS-010 · P1 · Vergrösserung automatisch anpassen
- [ ] VIS-011 · P1 · Bildqualität automatisch optimieren
- [ ] VIS-012 · P1 · Screenshots mit Dokument-ID verknüpfen
- [ ] VIS-013 · P1 · Bildausschnitte für die KI auswählen
- [ ] VIS-014 · P2 · Visuelle Fehler automatisch erkennen
- [ ] VIS-015 · P2 · Wiederkehrende visuelle Prüfungen

## Sichere Mehrschritt-Automatisierung

- [ ] AUTO-016 · P0 · Mehrere Aktionen in einem Auftrag ausführen
- [ ] AUTO-017 · P0 · Kompletten Schaltplan in einer Aktion erstellen
- [ ] AUTO-018 · P0 · Dokument mit mehreren Inhaltsblöcken erweitern
- [ ] AUTO-019 · P0 · Mehrere Bauteile gleichzeitig hinzufügen
- [ ] AUTO-020 · P0 · Mehrere Leitungen gleichzeitig verbinden
- [ ] AUTO-021 · P0 · Änderungen vor dem Speichern prüfen
- [ ] AUTO-022 · P0 · Bei Fehlern die gesamte Aktion zurücksetzen
- [ ] AUTO-023 · P1 · Automatische Korrektur von Leitungsüberschneidungen
- [ ] AUTO-024 · P1 · Bauteile automatisch ordentlich anordnen
- [ ] AUTO-025 · P1 · Änderungen als Vorschau anzeigen
- [ ] AUTO-026 · P1 · Aktionen vor dem Ausführen zusammenfassen
- [ ] AUTO-027 · P1 · Arbeitsabläufe als Vorlagen speichern
- [ ] AUTO-028 · P2 · Mehrere Dokumente kontrolliert bearbeiten
- [ ] AUTO-029 · P2 · Aufgaben mit Abhängigkeiten automatisch ausführen

## Schaltplan und Simulation · anschliessende Roadmap

- [ ] CHECK-001 · P0 · Fehlende elektrische Verbindungen
- [ ] CHECK-002 · P0 · Nicht angeschlossene Klemmen
- [ ] CHECK-003 · P0 · Falsche Anschlussnummern
- [ ] CHECK-004 · P0 · Unbeabsichtigte Kurzschlüsse
- [ ] CHECK-005 · P0 · Falsche Versorgungsspannungen
- [ ] CHECK-006 · P0 · Nicht zugeordnete Relaiskontakte
- [ ] CHECK-007 · P0 · Unvollständige Stromkreise
- [ ] CHECK-008 · P0 · Fehlende Schutzleiterverbindungen
- [ ] CHECK-009 · P0 · Unzulässige oder widersprüchliche Betriebsmittelkennzeichen
- [ ] ELEKTRO-030 · P0 · Automatische Leitungsführung
- [ ] ELEKTRO-031 · P0 · Klemmen automatisch erkennen
- [ ] ELEKTRO-032 · P0 · Bauteile intelligent ausrichten
- [ ] ELEKTRO-033 · P0 · Automatische Betriebsmittelkennzeichen
- [ ] ELEKTRO-034 · P0 · Kollisionen vor dem Verbinden anzeigen
- [ ] ELEKTRO-035 · P1 · Bauteile gruppieren
- [ ] ELEKTRO-036 · P1 · Ganze Schaltungsteile verschieben
- [ ] ELEKTRO-037 · P1 · Leitungen automatisch nachführen
- [ ] ELEKTRO-038 · P1 · Gleiche Schaltungen duplizieren
- [ ] ELEKTRO-039 · P2 · Automatische Verteilungs- und Stromlaufpläne
- [ ] ELEKTRO-040 · P2 · Vollständige Gebäudeschaltungen darstellen
- [ ] ELEKTRO-041 · P2 · Verdrahtungslisten erzeugen
- [ ] ELEKTRO-042 · P2 · Klemmenpläne automatisch erzeugen
- [ ] ELEKTRO-043 · P2 · Stücklisten aus Schaltplänen erstellen
- [ ] ELEKTRO-044 · P0 · Simulation über MCP starten
- [ ] ELEKTRO-045 · P0 · Simulation über MCP beenden
- [ ] ELEKTRO-046 · P0 · Schalter über ChatGPT betätigen
- [ ] ELEKTRO-047 · P0 · Taster kurzzeitig drücken und loslassen
- [ ] ELEKTRO-048 · P0 · Simulationszustand direkt auslesen
- [ ] ELEKTRO-049 · P0 · Spannungen und Ströme pro Bauteil abrufen
- [ ] ELEKTRO-050 · P0 · Relaiskontakte automatisch zuordnen
- [ ] ELEKTRO-051 · P0 · Transformatorwerte über MCP einstellen
- [ ] ELEKTRO-052 · P0 · Zeitrelais konfigurieren
- [ ] ELEKTRO-053 · P1 · Simulationszeit kontrollieren
- [ ] ELEKTRO-054 · P1 · Simulationsgeschwindigkeit ändern
- [ ] ELEKTRO-055 · P1 · Fehlerzustände gezielt auslösen
- [ ] ELEKTRO-056 · P1 · Spannung und Strom grafisch darstellen
- [ ] ELEKTRO-057 · P1 · Virtuelle Messgeräte verwenden
- [ ] ELEKTRO-058 · P1 · Unterschiedliche Betriebszustände vergleichen
- [ ] ELEKTRO-059 · P2 · Simulationsabläufe speichern
- [ ] ELEKTRO-060 · P2 · Automatische Simulationstests
- [ ] ELEKTRO-061 · P2 · Simulationsergebnisse als Prüfprotokoll exportieren

## PDF-zu-Schaltplan · anschliessende Roadmap

- [ ] PDF-062 · P0 · PDF-Seiten direkt über MCP lesen
- [ ] PDF-063 · P0 · Bilder in Dokumenten analysieren
- [ ] PDF-064 · P0 · PDF-Text und Bild gemeinsam auswerten
- [ ] PDF-065 · P1 · Aufgaben automatisch erkennen
- [ ] PDF-066 · P1 · Schaltzeichen in PDFs erkennen
- [ ] PDF-067 · P1 · Leitungsverbindungen aus Bildern erkennen
- [ ] PDF-068 · P1 · PDF-Schaltplan in bearbeitbaren Schaltplan umwandeln
- [ ] PDF-069 · P1 · Erkannte Bauteile vor dem Import bestätigen
- [ ] PDF-070 · P1 · Original und nachgebauten Plan vergleichen
- [ ] PDF-071 · P1 · Lösungen auf getrennten Ebenen speichern
- [ ] PDF-072 · P1 · Fehler direkt auf der PDF-Seite markieren
- [ ] PDF-073 · P1 · Aus einer PDF Lernkarten erstellen
- [ ] PDF-074 · P2 · Mehrere Aufgaben als Projekt importieren
- [ ] PDF-075 · P2 · PDF-Aufgaben automatisch mit Lösungen vergleichen
- [ ] PDF-076 · P2 · Bearbeiteten Schaltplan wieder als PDF exportieren

## KI und RED-Morph-Oberfläche · anschliessende Roadmap

- [ ] AI-001 · P0 · Aktuelle Seite verstehen
- [ ] AI-002 · P0 · Dokumente durchsuchen
- [ ] AI-003 · P0 · Änderungen vorschlagen
- [ ] AI-004 · P0 · Aktuellen Schaltplan analysieren
- [ ] AI-005 · P0 · Sichtbare Änderungen erklären
- [ ] AI-006 · P1 · Ausgewählten Bereich bearbeiten
- [ ] AI-007 · P1 · Mehrere Werkzeuge kombinieren
- [ ] AI-008 · P1 · Eigene Agentenprofile erstellen
- [ ] AI-009 · P1 · Wiederkehrende Arbeitsabläufe speichern
- [ ] AI-010 · P1 · Zwischen lokalen und externen Modellen wechseln
- [ ] AI-011 · P2 · Mehrere spezialisierte Agenten koordinieren
- [ ] AI-012 · P2 · Aufgaben automatisch mit Qualitätsprüfungen abschliessen
- [ ] UX-001 · P1 · Einheitliches RED-Morph-Design
- [ ] UX-002 · P1 · Konsistente Glasmaterialien
- [ ] UX-003 · P1 · Bessere Abstände und Ausrichtung
- [ ] UX-004 · P1 · Ruhige Animationen
- [ ] UX-005 · P1 · Native Windows-Fensterbedienung
- [ ] UX-006 · P1 · Bessere Dark- und Light-Mode-Abstimmung
- [ ] UX-007 · P1 · Einheitliche Kontextmenüs
- [ ] UX-008 · P1 · Adaptive Seitenleisten
- [ ] UX-009 · P1 · Verbesserte Tastaturkürzel
- [ ] UX-010 · P1 · Flüssige Dokumentwechsel
- [ ] UX-011 · P2 · Bessere Bedienung auf Touchscreens
- [ ] UX-012 · P2 · Optimierung für Stiftbedienung

## Windows-Stabilisierung und Freigabe

- [ ] DIAG-001 · P1 · Anwendung startet korrekt
- [ ] DIAG-002 · P1 · Dokumente werden gespeichert
- [ ] DIAG-003 · P1 · Dokumente bleiben nach Neustart erhalten
- [ ] DIAG-004 · P1 · MCP-Verbindung funktioniert
- [ ] DIAG-005 · P1 · Screenshot wird korrekt übertragen
- [ ] DIAG-006 · P1 · PDF-Seite wird korrekt dargestellt
- [ ] DIAG-007 · P1 · Schaltplan wird korrekt gespeichert
- [ ] DIAG-008 · P1 · Simulation läuft
- [ ] DIAG-009 · P1 · Undo/Redo funktioniert
- [ ] DIAG-010 · P1 · Berechtigungen werden eingehalten
- [ ] DIAG-011 · P1 · Fehler werden richtig gemeldet
- [ ] DIAG-012 · P1 · Kritische Aktionen folgen der eingestellten Freigabe
- [ ] WIN-001 · P0 · GPU-Cache-Fehler untersuchen und beheben
- [ ] WIN-002 · P0 · Sauberen Windows-Installer erstellen
- [ ] WIN-003 · P0 · Produktions- und Entwicklungsprofil klar unterscheiden
- [ ] WIN-004 · P0 · MCP-Komponenten automatisch mitinstallieren
- [ ] WIN-005 · P0 · Sichere Updates ohne Datenverlust
- [ ] WIN-006 · P1 · App nach Absturz zuverlässig wiederherstellen
- [ ] WIN-007 · P1 · Fehlerdiagnose direkt in den Einstellungen
- [ ] WIN-008 · P1 · Digitale Signierung des Installers
- [ ] WIN-009 · P1 · Hintergrundprozesse sauber beenden
- [ ] WIN-010 · P1 · RAM-Verbrauch messen und optimieren
- [ ] WIN-011 · P1 · Startzeit verbessern
- [ ] WIN-012 · P1 · Automatische Backups
- [ ] WIN-013 · P1 · Wiederherstellung früherer Dokumentversionen
- [ ] WIN-014 · P1 · Portable und installierte Version eindeutig kennzeichnen

## Verbindliche Abnahmen

- [ ] Bilddaten erreichen das tatsächliche ChatGPT-Plugin und werden dort angezeigt.
- [ ] Die bisherigen 46 Werkzeuge bleiben kompatibel.
- [ ] Mehrschritt-Aufträge sind vorab prüfbar, atomar gespeichert und bei Fehlern vollständig rückgängig.
- [ ] Bildzugriff ist separat freigegeben; sensible Felder werden maskiert und Bilder vor Übermittlung angezeigt.
- [ ] Kopierter HTTPS-Link funktioniert mit mindestens zwei kompatiblen KI-Clients.
- [ ] Erstfreigabe bleibt über Neustarts erhalten; Rechteänderung und Widerruf greifen sofort.
- [ ] Cloud-Zugriff funktioniert bei ausgeschaltetem Laptop; späterer Abgleich erhält alle Änderungen.
- [ ] Windows-Paket, Regressionen, Offline- und Sicherungs-Roundtrip sind abgenommen.

Ein ausgeschalteter Laptop kann keine frischen Fensterbilder liefern. Cloud-Werkzeuge müssen Datenstand, Bildalter und ausstehende Geräteaktionen ausdrücklich anzeigen.
