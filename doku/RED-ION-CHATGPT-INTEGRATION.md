# RED Ion · ChatGPT-Live-Steuerung (E791)

Stand: 18. November 2026. Branch `codex/redion-live-mcp`, Ausgangspunkt
`30d0a1ece` einschliesslich Windows-Ink. Integrationsziel bleibt PR #207,
`ux/windows-schaltplan-dock-20261108`. Der Nutzer beauftragt ausdrücklich
einen sicheren Fast-Forward auf diesen bestehenden Zielbranch. Kein neuer PR,
Force-Push, main-Merge oder Deployment.

## Tatsächlich implementiert

- Offizielles MCP-TypeScript-SDK, stdio und optionales Streamable HTTP auf
  127.0.0.1 mit Bearer-Authentifizierung, Host-/Origin-Prüfung.
- Geschützte Windows-Named-Pipe, pro Start neues Token, native Freigabe,
  eigene Sitzung, Rechte je Funktionsgruppe und getrennte Schreibfreigabe.
  Standard: ausgeschaltet. Kein allgemeines Renderer-JavaScript oder Shellwerkzeug.
- Semantische Aktionen im vorhandenen Register und je zuständigem Bereich.
  Derselbe Store, dieselben IDs, Fassungen, Verlauf und Flush; kein zweiter
  Datenspeicher. Änderungen werden sichtbar gezeichnet und erst nach Flush bestätigt.
- Bestehende Einstellungen **MCP → ChatGPT & Automatisierung**: Status,
  Freigaben, Schreibrechte, Sitzung, Protokoll, Trennen, Testen und MCP-Paket öffnen.
- Native Bridge und vorbereitetes MCP-Paket werden in Windows mitgebaut.
  Ohne Windows-Bridge werden die Desktop-Aktionen nicht aktiviert. Kein SDK
  im Web-/iPhone-Start. Offline-Nutzung bleibt unabhängig von ChatGPT.

## Werkzeugumfang

Verbindlicher Katalog: `windows/automation-contract.cts`, **46 Werkzeuge**,
jeweils mit geschlossenem Eingabeschema, strukturiertem Ergebnis und Rechten.

| Gruppe | Angebundene Aktionen |
| --- | --- |
| Verbindung | Status, Fähigkeiten, Fenster aktivieren, freigegebenen App-Pfad starten, Bestätigung anfragen, Operationsstatus, Fehler-/Aktivitätsliste |
| Navigation | aktuelle Ansicht/Dokument, Arbeitswelten listen/öffnen, Startansicht, Dokument suchen/listen/öffnen |
| Notizen | Seite erstellen/lesen/umbenennen/verschieben/duplizieren; Text-/Überschrifts-/Listen-/Checklisten-/Codeblock einfügen; Text ersetzen, Block bearbeiten, einzelnen Textblock in Papierkorb legen; begrenzter Textexport, Undo/Redo |
| Datenbanken | Standardsammlung erstellen, Schema/Zeilen lesen, Zeile anlegen/ändern mit Typ- und Spaltenrechten |
| Lernen | bis 25 echte Lernkarten pro Aktion; Aufgabe erstellen/abhaken |
| PDF | Seite eines vorhandenen importierten PDF-Dokumentblocks öffnen |
| Schaltplan | Blatt erstellen/öffnen/lesen, bekannte Bauteile/Klemmen listen, Bauteil setzen/verschieben, Klemmen verbinden, SVG ausgeben |
| Darstellung | ausschliesslich theme, bewegung, kontrast, dichte lesen/ändern |

**Noch nicht angebunden:** freie Dateiverwaltung, PDF-Annotation/-Export,
weitere Spaltentypen/-definitionen, Ansichten/Filter/Formelkonfiguration,
Kalender-/Projekt-/Lernplansteuerung, Tabs, Schaltplanvorlagen und weitere
Freihandwerkzeuge. Entwicklerzugriff auf Repository/Git/Shell ist kein App-Modus.
Der Katalog verspricht keine vollständige Abdeckung dieser langfristigen Ziele.

## Reproduzierbare Prüfung

```powershell
npm ci --prefix plugins/red-ion --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run typecheck:mcp
npm run bauen:ts
npm run bauen
npm run stand
npm run test:mcp
npm run test:windows-mcp
npm run test:mcp-scripts
npm --prefix windows test
npm --prefix windows run prepare:app
```

Nur künstliche Dokumente und ein vor Laden des unveränderten Main-Einstiegs
gesetztes getrenntes appData-Testprofil. Native Dialoge werden ausschliesslich
im synthetischen Test automatisch beantwortet; im Produkt gibt es keinen Bypass.

- Vertrag/Kanal bestanden: jeder Werkzeugvertrag, unbekannte Felder, falsches
  Token, deaktivierte Verbindung, Schreib-/Funktionssperre, einmalige und
  argumentgebundene Bestätigung, Protokoll ohne Inhalte/Token.
- Echter SDK-Client und Electron bestanden: stdio-Handshake, 46 Werkzeuge,
  echte sichtbare Seite mit fünf Überschriften, Textkorrektur, Undo/Redo,
  20 Lernkarten, Aufgabe, Tabellenzeile, zwei Bauteile mit Leitung/Nachführung.
  Ungültige IDs/überlappende Platzierung abgewiesen; Neustart erhält IDs/Inhalte.
  Bestehende Aufrufzähler und letzte Öffnungszeit dürfen sich dabei verändern.
- Zweiter echter MCP-Client über HTTP: Handshake/Seitenlesen bestanden;
  fehlendes Token 401, fremder Browser-Origin 403. Widerruf und anschliessende
  normale Offline-Nutzung bestanden.
- Windows-Verträge 21/21, Ink-/Paketparität 9/9.
- Offizieller Windows-Tunnel-Client v0.0.21: Archiv/EXE gegen SHA-256 geprüft;
  Versionsausgabe und `help quickstart` tatsächlich ausgeführt.
- PowerShell-Skripte 2/2: tatsächliche Paketinstallation unter Windows
  PowerShell 5.1 mit Leerzeichen/Umlaut im Zielpfad, identisches Serverbundle,
  UTF-8-BOM, Diagnose, abgewiesenes Junction-Update ohne fremde Änderungen;
  echter SDK-Handshake durch das gelieferte Startskript mit 46 Werkzeugen.
- Offizieller Client erzeugt ein ausdrücklich synthetisches lokales Profil
  unter PowerShell 5.1 und 7. Keine echten Zugangsdaten und kein Live-Tunnel.
- Offline-Regression test87 nach Korrektur 197/197; Register-Inventur
  nachgetragen. test86 bleibt wegen der bestehenden Werkzeuggruppen-Zahl
  15 statt 14 rot. Details zu den gefundenen Fehlern: P140–P143.

Aktuelle Bilder und JSON-Nachweis: `bilder/redion-mcp/`; Logs:
`bilder/windows-ink/mcp-*.log` (ignoriert). Weitere Paket-/Regressionsergebnisse
werden erst nach tatsächlichem Lauf ergänzt. Kein vollständig grüner Gesamtlauf
wird behauptet; historische Ergebnisse sind keine aktuellen Nachweise.

## ChatGPT-Verbindung: tatsächlicher Stand

Redur bestätigt am 18. November: **noch keinen Tunnel eingerichtet**.
Die Browsersteuerung konnte die OpenAI-Kontoseite zweimal wegen Zeitlimits
nicht öffnen. Kein Schlüssel wurde ausgelesen; keine Tunnel-ID wurde erfunden.

**ChatGPT tatsächlich verbunden: NICHT GETESTET. Live-Tunnel: NICHT GETESTET.**
Es fehlen der echte Tunnel, korrekte Workspace-Zuordnung, eingeschränkter
Laufzeitschlüssel und die Registrierung im gewünschten ChatGPT-Dialog.
Anleitung: `RED-ION-MCP-INSTALLATION.md`. Eine lokale HTTP-Adresse ist keine
öffentliche HTTPS-URL. Kein öffentlicher Plugin-Release und keine Workspace-Freigabe.

**NICHT GETESTET:** reale Nutzerinstallation/In-place-Update, Signierung,
iPhone-/macOS-Hardware und tatsächliche Kontoberechtigung für ChatGPT/Tunnel.
