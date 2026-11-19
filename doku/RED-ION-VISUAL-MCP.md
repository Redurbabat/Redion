# RED Ion · Visual MCP im Windows-Quellstand

Stand: 18. November 2026. Arbeit auf `codex/redion-visual-cloud-mcp`, Grundlage
PR #207 / `c76959ce7`. Dies ist ein geprüfter erster Teil von E792, keine
Abnahme der gesamten ersten beiden Phasen und kein neues veröffentlichtes Paket.

## Implementiert

Die bisherigen 46 Werkzeuge bleiben erhalten. `redion_capture_view` ergänzt ein
echtes MCP-Bildergebnis für das eigene Redion-Fenster, den sichtbaren Editor
oder die sichtbare Schaltplanfläche. Optionale Dokument-/Blockkennung bindet
den Ausschnitt an den gelesenen Bestand. Ein Rechteck in CSS-Pixeln schneidet
den gewählten Bereich zu; `maxEdge` begrenzt die Ausgabe auf 320–4096 Pixel.
Windows-Bildschirmskalierung darf das Seitenverhältnis nicht verändern.
Eine geänderte sichtbare Dokumentkennung oder Geometrie verwirft die Aufnahme.
`open_schematic` bringt jetzt den verlangten Plan tatsächlich in die sichtbare
Fläche, statt nur dessen übergeordnete Seite zu öffnen.

Unter Einstellungen → MCP wird **Bilder aus Redion übertragen** separat
freigegeben. Formularfelder, eingebettete fremde Flächen und mit
`data-sensitive`, `data-private` oder `data-mcp-private` markierte Bereiche
werden vor der Aufnahme verborgen und im nativen Bitmap zusätzlich übermalt.
Die maskierte Vorschau erscheint in einem eigenen Fenster ohne Node-Rechte,
Navigation oder fremde Inhalte. Standardmässig folgt eine native Bestätigung.
Wer die zusätzliche Bildbestätigung ausdrücklich abschaltet, erhält die
Vorschau ohne erneute Freigabeaufforderung. Neue Vorschauen ersetzen die alte;
sie werden nach sieben Sekunden geschlossen. Widerruf schliesst sie sofort.

Bilddaten liegen höchstens 60 Sekunden im Arbeitsspeicher, maximal acht Bilder
oder 16 MiB insgesamt. Einzelbild maximal 4 MiB, höchstens zwölf Aufnahmen je
Minute und Sitzung. Kein Bildschirmfoto auf Platte und kein Zugriff auf andere
Windows-Programme. Nur die ausdrücklich synthetischen Tests speichern Belege
im ignorierten Ordner `bilder/`.

Die Named Pipe transportiert eine kleine JSON-Kopfzeile und getrennte rohe
Bildbytes mit Länge und SHA-256. UTF-8-Decodierung erfolgt ausschliesslich für
Kopfzeilen. Bildbesitz wird an die authentifizierte Sitzung gebunden; Widerruf,
Verbindungsende und Ablauf entfernen die Bytes. Erst das offizielle MCP-
Bildergebnis verwendet das vom Protokoll verlangte Base64. Metadaten bleiben
klein und enthalten keine eingebetteten Bilder. Das Aktivitätsprotokoll führt
Bildziel, Pixelmasse und übertragenes Volumen, keine Bildinhalte.

Lokale Adapter können nach erster Freigabe bis zum Widerruf bestätigt bleiben.
Neue Rechte, die Abschaltung zusätzlicher Bestätigungen und Widerruf werden
nativ geprüft. Alte Konfigurationen erweitern ihre Freigabe nicht automatisch.
Die automatische Profilauswahl akzeptiert genau ein laufendes bekanntes Profil;
bei zwei laufenden Profilen ist eine ausdrückliche Auswahl erforderlich.

## Gezielter Nachweis

- Vertrags-/Berechtigungs-/Binärprüfungen: zehn Fälle, einschliesslich kaputter
  Bildrahmen, UTF-8-Grenzen, Eigentümer, Ablauf, Widerruf, Aufnahmelimit und
  alten Freigaben. Gegenproben fanden P147–P149.
- Echter SDK-Client gegen isolierte Electron-App: 47 Werkzeuge, echtes
  `ImageContent`, sichtbarer künstlicher Inhalt und weiss maskierter privater
  Kontrollbereich. Ausschnitt und Seitenverhältnis unter der lokalen
  Windows-Skalierung geprüft; Dokumentwechsel und verweigerte Bildfreigabe
  werden abgewiesen. Schaltplanbild tatsächlich übertragen und angesehen.
- Bestehende Schreib-/Leseaktionen, stdio, authentifiziertes lokales HTTP,
  Neustart mit erhaltenen Daten und gemerktem Adapter, Widerruf, Offline-Nutzung
  und beide sauberen Prozessenden weiterhin geprüft.
- Zehn Windows-/Dateivertragsprüfungen bestanden. Typen, Stand und Bau werden
  separat bei der jeweiligen Lieferung protokolliert.

Die Bildprüfung deckte zwei Fehler auf: ein internes Nachrichtenfeld verletzte
das MCP-Ausgabeschema; eine sofortige Aufnahme konnte vor dem aktuellen Paint
liegen. Die Kennung wird jetzt vor der MCP-Antwort entfernt; der Renderer
wartet vor der Aufnahme auf den Bildaufbau, und private Felder werden bereits
vorher verborgen. Der Test prüft sowohl den maskierten als auch einen sichtbaren
farbigen Bereich, damit ein leeres Bild nicht als Erfolg durchgeht.

## Weiter offen

PDF-Originalseiten und Notizbilder als eigene Bildquellen, mehrere PDF-Seiten,
Vorher/Nachher-Vergleich, automatische visuelle Prüfung sowie alle atomaren
Mehrschritt-Werkzeuge sind noch nicht vollständig umgesetzt. Ebenso offen:
sichtbare Issues im persönlichen Redion-Datenbestand, universeller Cloud-Link
und Synchronisierung bei ausgeschaltetem Laptop. Die vollständige Liste steht
in `REDION-2026-ISSUES.json` und `.md`.

**NICHT GETESTET:** tatsächliche Bildanzeige im ChatGPT-Plugin, vollständige
Bearbeitung im persönlichen Profil nach Installation, vollständige Regressionen, physischer
Windows-Stift, iPhone/macOS und signierte Pakete. Die unten dokumentierte neue
EXE basiert auf `1ee8e624a`; ältere Pakete aus `543e253a9` enthalten den
Visual-MCP-Ausbau nicht.
Keine Cloud-URL oder Tunnel-ID wurde erstellt oder erfunden.

## Neue lokale Windows-Testpakete

Runtime-Quellstand: `1ee8e624a652aa3c5392edf89fcbfb866c2a1b1e`.
Ausgabe: `build/windows-visual-mcp-dist/`, jeweils Windows x64, **NotSigned**.
Version 2026.8.4 bleibt eine lokale Entwicklungsvorschau, kein Release.

| Paket | Bytes | SHA-256 |
| --- | ---: | --- |
| Redion Setup 2026.8.4.exe | 133874458 | `cfd1d7c3c7c9d7f904cb60ebed0768d2ba7fa0c0f8249416ec0723fd20dcf829` |
| Redion 2026.8.4.exe (Portable) | 121962944 | `72b466b3c6dfb92cbfeb0c93b00ed92e4b0a1ae0b8db6dc2c83ada0d76e762b5` |

Echter SDK-Client gegen die **gebaute EXE** mit getrenntem Testprofil:
47 Werkzeuge, Bildblock über stdio und HTTP, sichtbarer und maskierter
Kontrollbereich, Schaltplanbild, verweigerte Bildfreigabe, ausdrücklich
delegierte Bildübertragung ohne wiederholten Dialog, weiterhin sichtbare
Vorschau, Neustart mit gemerktem Adapter, erhaltene Inhalte, Widerruf,
Offline-Nutzung und beide Prozessenden mit Exitcode 0 bestanden.

Paketparität: **13 native CJS-Dateien, 506 Webdateien und 14 MCP-Dateien**
bytegleich. Electron-Builder entfernt Bau-/Entwicklungsfelder aus package.json;
Name, Version und Einstieg wurden deshalb gesondert verglichen und stimmen.
Ein erneuter regulärer Web-Bau nach Ende der alten App besteht ebenfalls,
Offline-Stand v1613 bleibt unverändert. Die vorigen Schreibfehler sind damit
kein aktuell reproduzierter Baufehler; ihre genaue Systemursache ist unbewiesen.

Installation und Start wurden anschliessend ausdrücklich freigegeben und
ausgeführt. Vorher wurden beide geschlossenen vorhandenen Profile lokal
ausserhalb des Repositories gesichert. Benutzerinstallation unter
`%LOCALAPPDATA%/Programs/Redion/`; installierte EXE und app.asar stimmen mit
dem geprüften Paket überein. Der gestartete Prozess hat ein Hauptfenster.
Der lokale Adapter meldet Version 0.2.0, Bridge 0.2.0, aktives Entwicklungsprofil
und AVAILABLE, aber noch keine aktive MCP-Sitzung. Testschreiben im persönlichen
Profil ist damit nicht nachgewiesen.

Die tatsächliche verbundene Plugin-Route antwortete auch nach dem Start
**Session terminated**;
das ist kein erfolgreicher ChatGPT-Nachweis. ChatGPTs plugin-spezifische
Einstellung wurde gelesen und steht bereits auf **Alle Aktionen erlauben**.
Globale Einstellungen und Rechte anderer Plugins wurden nicht geändert.

Kostenloser Cloud-Zugriff hat auf Redurs Wunsch Vorrang. Aktueller Tarifnachweis,
lokal geprüfte OAuth-Freigaben und die noch fehlende Konto-/Datenanbindung
stehen in `RED-ION-CLOUD-MCP.md`. Kein Cloud-Deployment erfolgt.
