# RED ION – Entwicklungsphase 3

Ausgangspunkt: Main `67876aa2` nach PR #262. Keine Änderung der IndexedDB-Schemata, keine neue externe API, kein automatischer Serverbetrieb.

## Erste Bausteine

### RED Video Preview

```sh
node tools/red-video-preview.mts tools/red-video-example.json vorschau.html
```

HTML im Browser öffnen. Szenen sind validierte Texte mit Dauer, maximal 20 Minuten, ohne Nutzer-JavaScript, Netzwerk oder fremde Ressourcen. Abspielen, Pause, Vor/Zurück und Fortschritt. Das Ergebnis ist eine animierte HTML-Vorschau, **kein MP4**, keine Audiospur, keine 3D-Engine und kein integrierter MCP-Block. Keine bestehende Präsentationsfunktion ersetzen; eine spätere Integration muss den vorhandenen Seiten-/Folienbestand nutzen.

### RED Developer Check

```sh
node tools/red-developer-check.mts
```

Nur lesender, lokaler Dateibestands- und Node-Versionscheck; keine Secrets, keine GitHub-Abfragen, keine Terminalausführung, keine Behauptung einer Geräte- oder Build-Abnahme.

### RED Files – lokaler Disk-Sink

`createDiskDownloadSink(ziel)` implementiert den bestehenden `RedFileSink`-Vertrag für `createRedFiles(...).downloadTo(id, sink)`. Das SDK authentifiziert die Chunks; der Adapter prüft Offset und Vollständigkeit, synchronisiert die Datei und veröffentlicht per Hardlink ohne Überschreiben. Er benötigt ein vertrauenswürdiges lokales Verzeichnis auf einem Dateisystem mit Hardlink-Unterstützung. Kein Fallback auf nicht-atomare Kopien. Der Zielpfad wird ausdrücklich vom Aufrufer gewählt, nicht aus dem Manifest übernommen.

**Klartextexport:** nicht automatisch in Vault, SSD oder Server eingebunden. Abgebrochene Exporte werden aufgeräumt; nach Prozessabsturz kann eine temporäre Datei verbleiben. Dateirechte und Windows-ACLs müssen auf dem realen Ziel geprüft werden. Keine Zusicherung einer sicheren Löschung, Stromausfallsicherheit oder Verschlüsselung des Datenträgers. Grössenlimits des SDK bleiben bestehen.

### Tests

```sh
node --test pruefungen/red-phase3-tools.test.mts
npm run typecheck
```

Vorhandene Release-Gates bleiben unverändert. Der neue Werkzeug-Workflow prüft die Pilotbausteine auf Linux und Windows. Physische Geräte, Browser-Wiedergabe und native App-Integration sind noch NICHT GETESTET.

## Ausbauplan (offen)

| Priorität | Bereich | Fertig wenn |
|---|---|---|
| P0 | Core | Start-/RAM-Messung reproduzierbar; keine Datenregression; bestehende Budgets eingehalten |
| P0 | Storage / Sync / Vault | Authentifizierte verschlüsselte grosse Dateien, atomare lokale Adapter, Quoten, Recovery, Zwei-Geräte-Konfliktabnahme |
| P0 | MCP | Vorhandenes Aktionsregister und OAuth-Verträge um nachgewiesene fehlende Aktionen ergänzen, keine generische Shell, Tests je Schreibrecht |
| P1 | Studio | Zwei echte Editoransichten mit gemeinsamem Store, Konflikt-/Undo- und Fensterregressionen |
| P1 | Elektro | Messwert-/Fehlermodell fachlich validiert; Lernsimulation klar von realer Sicherheitsprüfung getrennt |
| P1 | Video | Bestehenden Präsentationskern einbinden, deterministische Frames, Audio und MP4-Export mit Lizenzprüfung |
| P1 | AI | Lokale Modelle und externe Provider mit expliziter Freigabe; validierte strukturierte Ausgabe und Abbruch |
| P2 | Developer | Read-only CI-/Build-Inventar, getrennte Testprofile; schreibende Aktionen nur autorisiert |

Kein Produktionsmerge ohne grüne CI auf der gemeinsamen Revision. Graphify muss im vollständigen Checkout nachgezogen werden.
