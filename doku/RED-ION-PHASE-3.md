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

## Nacharbeit zur Master-Abnahme

Playwright 1.56.1 benötigt einen unterstützten Linux-Runner; Ubuntu 24.04 ersetzt für diesen Test Ubuntu latest (26.04). Keine Browserprüfung entfernt. Der Disk-Sink wird zusätzlich über den echten verschlüsselten SDK-Chunkpfad mit Mehrteildatei, leerer Datei und manipulierter Chiffre geprüft. Nach erfolgreicher Veröffentlichung wird die Zieldatei bei einem Bereinigungsfehler nicht gelöscht; der Fehler benennt den bereits erfolgten Export ausdrücklich. Das bleibt ein lokaler Klartextexport, keine verschlüsselte SSD-Integration.

### Lokaler SQLite-Sync-Adapter (Pilot)

`tools/red-sync-sqlite.mts` implementiert `RedSyncAdapter<string>` auf einer ausdrücklich separat angelegten SQLite-Datenbank pro Konto/App/Kind. Ein 32-Byte-Schlüssel, getrennt vom Netz-Sync-Schlüssel, wird vom Aufrufer verwaltet. AES-256-GCM schützt den ganzen begrenzten lokalen Zustand einschliesslich Cursor und Konflikten; die Generation ist authentifizierter Kontext. Import und Cursor werden in einer SQLite-Transaktion mit Generation-CAS gespeichert. Lokale Änderungen bleiben dirty, Konflikte werden dedupliziert und bei vollem Journal wird der Batch abgelehnt. Keine automatische Löschung, Konfliktauflösung oder Upload-Funktion. Pilotgrenzen: 4096 Einträge, 4096 Konflikte, 128 KiB je Text, 16 MiB pro Zustand; vollständige Neuverschlüsselung pro Änderung. Kein Ersatz für IndexedDB, keine native Integration, kein Schutz vor einem Replay der gesamten älteren Datenbank, keine Schlüsselverwaltung oder Hardwareabnahme. Der Aufrufer verwaltet DB-Lebensdauer, Dateisystemrechte und separate Schlüssel. Test: `node --test pruefungen/red-sync-sqlite.test.mts` unter Node 24.

### RED Sync – persistente Upload-Warteschlange

`pushLocal(id, remoteKey, transport)` bereitet einen expliziten Text-Upload vor und speichert Chiffre und Operation-ID vor der Übertragung verschlüsselt in SQLite. Bei verlorener Antwort oder Neustart wird exakt derselbe Auftrag wiederholt. Bestätigung verlangt passende Revision und Chiffre aus dem anschliessenden Readback. Eine zwischenzeitliche Bearbeitung bleibt dirty und bekommt die bestätigte Revision als Basis. Pending-Uploads blockieren Pull/Commit bis zur Klärung; kein automatischer Lösch-Upload. Ein bestehender Konflikt verhindert neue Uploads für die betroffene ID. Grenzen: 64 ausstehende Aufträge, 44 KB Nutzlast pro Upload, bisherige Gesamtgrenzen bleiben. Bei Remote-Konflikt bleibt der Auftrag erhalten; eine explizite Konfliktauflösung/UI fehlt noch. Kein automatisches Netzwerk, keine produktive App-Anbindung oder Schlüsselablage.

### Sichere Auflösung eines blockierten Text-Uploads

`previewPendingConflict` zeigt den authentifizierten Servertext, die jüngste lokale Fassung und die vorbereitete Upload-Fassung. `resolvePendingKeepBoth` benötigt den Vorschau-Token und liest den Server erneut. Veraltete Vorschauen oder geänderte lokale Generationen werden abgewiesen. Der authentifizierte Servertext verbleibt unter der ursprünglichen ID; abweichende lokale Fassungen werden unter neuen IDs als dirty erhalten. Nur der betroffene blockierte Auftrag wird entfernt, ohne Cursor-Fortschritt oder Netzwerk-Schreiboperation. Kein automatischer Upload der Kopien. Fehlende Serverdaten, Tombstones, falscher Schlüssel oder ein bereits exakt vorhandener Upload sind kein Auflösungsfall. Letzterer bleibt im Wiederholungsweg. Kein UI, keine Konfliktlösung für gewöhnliche Pull-Konflikte, keine automatische Zusammenführung oder physische Geräteabnahme.
