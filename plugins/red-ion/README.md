# RED Ion · lokale Live-Steuerung

Dieses Paket enthält den echten MCP-Server für Redion Windows. Node.js 22+
ist Voraussetzung. Es führt keine OpenAI-Modellaufrufe aus und benötigt
keinen Modell-API-Schlüssel. Ein Secure MCP Tunnel benötigt zusätzlich
seinen eigenen OpenAI-Laufzeitschlüssel und passende Kontoberechtigungen.

1. Die neue Redion-Windows-App starten. In den vorhandenen Einstellungen
   **MCP → ChatGPT & Automatisierung** öffnen. Verbindung, gewünschte
   Funktionen und bei Bedarf Schreibzugriff aktivieren; **Übernehmen**.
2. Dieses vollständige Paket in PowerShell mit `./Install.ps1` installieren.
   Es kopiert nur Plugin-Dateien nach `%LOCALAPPDATA%\Redion-MCP`.
   Blockiert Windows unsignierte Skripte, für diesen Aufruf
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install.ps1`
   verwenden. Das ändert keine dauerhafte Ausführungsrichtlinie. Dieselbe
   Aufrufweise ist für `Start-Tunnel.ps1` und `Diagnose.ps1` möglich.
3. Für den gewünschten ChatGPT-Dialog einen Secure MCP Tunnel unter
   https://platform.openai.com/settings/organization/tunnels erstellen oder
   einen passenden vorhandenen wählen. Die Zuordnung zum gewünschten
   ChatGPT-Workspace prüfen. Keine erfundene Tunnel-ID verwenden.
4. Enthält dieses Paket `tools/tunnel-client.exe`, wird der geprüfte
   offizielle Client automatisch verwendet. Andernfalls den Windows-Client über die Downloadverknüpfung dort oder
   https://github.com/openai/tunnel-client/releases/latest beziehen und
   `tunnel-client help quickstart` prüfen. In diesem Ordner ausführen:
   `./Start-Tunnel.ps1 -TunnelId <echte-ID> -Initialize`.
   Der Schlüssel wird bei Bedarf verdeckt lokal abgefragt. Nicht in Chat,
   Skript, Argument oder Git speichern. Folgestarts brauchen kein `-Initialize`.
5. In ChatGPT **Plugins → + → Benutzerdefinierten MCP-Server hinzufügen**:
   Name **RED Ion**, Verbindung **Tunnel**, dieselbe echte Tunnel-ID.
   Beim direkten stdio-Tunnel benötigt dieser MCP-Server keinen zusätzlichen
   OAuth-Login: Tunnelzugriff wird von OpenAI authentifiziert, die App-Sitzung
   zusätzlich im lokalen Redion-Fenster freigegeben. Eine im Dialog verlangte
   zusätzliche Serveranmeldung nicht erfinden; sie muss zur gewählten
   Tunnel-/Workspace-Konfiguration passen.
6. Werkzeuge scannen, Sicherheitswarnung prüfen, als privates Plugin erstellen.
   Die erste App-Verbindung und kritische Aktionen in Redion bestätigen.
   Mit `@RED Ion` zunächst Status abfragen, dann eine synthetische Seite erstellen.

**Die lokale Adresse `http://127.0.0.1:8793/mcp` ist keine öffentliche
ChatGPT-URL.** Sie ist ein optionaler, mit Bearer-Token geschützter HTTP-Modus
für lokale MCP-Clients. Er startet nur mit `REDION_MCP_HTTP_TOKEN` (mindestens
32 Zeichen). `./Start-MCP.ps1 -Transport http` verwenden. Standard ist stdio;
für den Tunnel wird kein lokaler HTTP-Port benötigt.

Das portable `mcp.json` ist für unterstützte lokale Plugin-Hosts vorbereitet.
Es ersetzt die Registrierung im gewünschten ChatGPT-Dialog nicht. Lokale
Directory-Plugins und private benutzerdefinierte MCP-Verbindungen haben
unterschiedliche Freigabewege. Keine Installation in ChatGPT wird behauptet.

## Bedienung und Grenzen

Der tatsächliche Werkzeugkatalog enthält nur implementierte Aktionen.
Schreibzugriffe werden pro Funktionsgruppe und Sitzung geprüft. Lesen ist
begrenzt; es findet kein automatischer Upload aller Dokumente statt.
Kritische Werkzeuge benötigen zuerst `redion_request_confirmation` mit
dem exakten Werkzeugnamen und seinen Argumenten. Die Bestätigung ist
60 Sekunden gültig, an Sitzung und Argumente gebunden und einmal verwendbar.

Die Bridge ist standardmässig aus. Ausschalten oder „Sitzung trennen“
widerruft die Verbindung. Nach App-Neustart wird die neue Bridge automatisch
gefunden; die neue Sitzung muss erneut im App-Fenster freigegeben werden.
Bei `RESULT_UNKNOWN` zuerst in Redion nachsehen, nicht blind erneut schreiben.
Bei `EDITOR_BUSY` die laufende eigene Texteingabe abschliessen.

`Diagnose.ps1` zeigt Status ohne Geheimnisse. Falls der Tunnel in ChatGPT
nicht erscheint, Tunnel-/Workspace-Zuordnung und Rollen Read/Use prüfen.
Tunnel-Erstellung benötigt zusätzlich Manage. Die ChatGPT-Berechtigung für
benutzerdefinierte MCP-Server ist davon getrennt.

Eine allgemeine Shell, freie Dateipfade, endgültiges Löschen, Cloud-Sync,
App-Codeänderungen und beliebiges Renderer-JavaScript sind nicht verfügbar.
PDF-Annotationen/-Export, weitere Datenbankansichten und weitere App-Funktionen
bleiben getrennte Erweiterungen. Die normale Offline-App bleibt unabhängig.

Die konkreten Testnachweise stehen im Projekt unter
`doku/RED-ION-CHATGPT-INTEGRATION.md`. Ein lokaler Test ist kein Nachweis für
eine tatsächlich verbundene ChatGPT-Sitzung.
