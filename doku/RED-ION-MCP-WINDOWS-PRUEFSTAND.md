# Windows-MCP-Testversion · 18. November 2026

Quellstand der gebauten App: `543e253a9252575dfbcaabdc9a86e0285ad9a99a`,
eigener Arbeitsbranch `codex/redion-live-mcp`. Sicherer Fast-Forward auf den
bestehenden PR #207 erfolgt. Kein Merge nach main und kein Release-Deployment.

## Direkt selbst testen

Im lokalen Projekt liegt die geprüfte App unter
`build/windows-mcp-dist/win-unpacked/Redion.exe`. Die EXE im vorhandenen
Ordner starten, damit ihre Ressourcen erreichbar bleiben. Das neue Setup
liegt unter `build/windows-mcp-dist/Redion Setup 2026.8.4.exe`.
Vor einem Update einer persönlichen Installation extern als `.redion` sichern.
Die Pakete sind unsignierte lokale Testversionen; Produktversion bleibt 2026.8.4.

Einstellungen → MCP → ChatGPT & Automatisierung: Verbindung, Funktionen und
gegebenenfalls Schreiben freigeben. Das vollständige MCP-Paket enthält die
Windows-App unter `resources/redion-mcp`; zusätzlich `build/red-ion-plugin.zip`.
Node.js 22+ ist Voraussetzung. Die genaue Konto-/Tunnel-Einrichtung steht in
[RED-ION-MCP-INSTALLATION.md](RED-ION-MCP-INSTALLATION.md).

## Tatsächliche Nachweise

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript-/MCP-Typprüfung, Web-/Native-Bau, Dienststand | bestanden; Dienststand v1608 |
| Windows-Verträge | 21/21 bestanden |
| MCP-Vertrag, realer Kanal und Junction-Abwehr | 3/3 bestanden |
| Windows-PowerShell-Installation, echter SDK-Start, Startwiderruf | 3/3 bestanden |
| Gebaute Windows-EXE mit echtem SDK-Client | bestanden; 46 Werkzeuge |
| stdio und geschütztes lokales HTTP | Handshake/Lesen bestanden; fehlendes Token 401, fremder Origin 403 |
| Sichtbare Änderungen und Prozessneustart | IDs/Inhalte erhalten; Notizen, Markdown/Sonderzeichen, Aufgaben, 20 Lernkarten, Datenbankzeile und Schaltplanverbindung |
| Widerruf, anschliessende Offline-Nutzung, sauberes Beenden | bestanden; beide Prozessenden Exitcode 0, cleanExit true |
| Paketparität | 506 Webdateien, 11 native Dateien und 14 MCP-Dateien bytegleich mit dem vorbereiteten Quellstand |

Alle App-/SDK-Prüfungen verwendeten künstliche Dokumente und getrennte
Testprofile. Nur native menschliche Freigabedialoge wurden im Test beantwortet;
unerwartete native Fehlerdialoge führen ausdrücklich zu einem roten Test.
Rote Gegenproben und Korrekturen sind als P140–P146 dokumentiert.

## Gesamtlauf auf Nutzerwunsch gestoppt

Der Nutzer wollte sofort selbst testen und hat den vollständigen Bestandslauf
ausdrücklich abgebrochen. Er wurde während Lauf **261/578 (test296)** beendet.
**Kein vollständig abgeschlossener oder grüner Gesamtlauf wird behauptet.**

Bis dahin wurden unter anderem Bestandsfehler bei Bereichs-/Werkzeugzahlen,
Kontrast und früheren Zeichenwerkzeugen gemeldet. Die gezielten Vergleiche
32, 34, 47, 65, 86, 109, 127, 175, 201 sowie 221, 225, 238 und 240 melden
dieselben betreffenden Fehler am unveränderten Ausgangscommit `30d0a1ece`.
Die neue Register-Inventur und der Offline-Grundstock wurden korrigiert;
test87 besteht danach mit 197/197 Punkten. Diese Vergleiche ersetzen keinen
vollständigen Gesamtlauf.

Lokale synthetische Nachweise: `bilder/redion-mcp/paket/nachweis.json`, vier
Kontrollbilder dort, `build/windows-mcp-dist/paket-paritaet.json` und Logs unter
`bilder/windows-ink/mcp-*.log` / `bilder/redion-mcp/` (alle ignoriert).

## Noch offen

**ChatGPT tatsächlich verbunden: NICHT GETESTET.** Es existiert noch kein
echter Secure MCP Tunnel, keine reale Tunnel-ID und keine öffentliche
RED-Ion-MCP-URL. Die lokale HTTP-Adresse ist kein öffentlicher ChatGPT-Endpunkt.
Der offizielle Tunnel-Client und die sicheren lokalen Einrichtungsskripte sind
vorbereitet; die echte Konto-/Workspace-Zuordnung und Registrierung fehlen.

Reale Nutzerinstallation/In-place-Update, Signierung und iPhone-/macOS-Hardware
sind **NICHT GETESTET**. PDF-Annotation/-Export, freie Dateiverwaltung und
weitere nicht angebotene App-Aktionen bleiben dokumentierte Erweiterungen.
