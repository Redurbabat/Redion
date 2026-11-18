# RED Ion im benutzerdefinierten MCP-Dialog verbinden

## Windows

1. Vor Update einer echten Nutzerinstallation extern als `.redion` sichern.
   App-ID und Datenpfad bleiben gleich; reales In-place-Update ist NICHT GETESTET.
2. Neue Windows-Version starten. **Einstellungen → MCP → ChatGPT & Automatisierung**:
   Verbindung, gewünschte Funktionen und bei Bedarf Schreiben aktivieren,
   **Übernehmen**, nativen Dialog prüfen.
3. **MCP-Paket öffnen**. Alternativ geliefertes Plugin-ZIP öffnen. Node.js 22+
   ist Voraussetzung. `Install.ps1` kopiert nur dieses Paket nach
   `%LOCALAPPDATA%/Redion-MCP`. Updates ausdrücklich mit `-Update`.
   Es registriert kein Konto und aktiviert keinen Windows-Autostart.
   Wenn Windows unsignierte Skripte blockiert:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install.ps1`.
   Die Ausnahme gilt nur für diesen Prozess. Für die übrigen Skripte gilt
   dieselbe Aufrufweise; keine globale Richtlinie wird geändert.

## Neuer Secure MCP Tunnel

Es gibt derzeit **keine echte Tunnel-ID und keine öffentliche RED-Ion-MCP-URL**.
Der Nutzer hat bestätigt, noch keinen Tunnel eingerichtet zu haben.

1. Im eigenen Konto [Tunnelverwaltung](https://platform.openai.com/settings/organization/tunnels)
   öffnen. Richtige Organisation/ChatGPT-Workspace wählen. Tunnel erstellen
   und zuordnen. Erstellung: Tunnels Read/Manage; Nutzung/Laufzeitschlüssel:
   Read/Use. Die ChatGPT-Berechtigung ist davon getrennt.
2. Einen eingeschränkten Laufzeitschlüssel selbst lokal erstellen. Nicht im
   Chat posten oder in Skripte/Git schreiben. Der Adapter macht keine OpenAI-
   Modellaufrufe; der Tunnel benötigt trotzdem einen eigenen Laufzeitzugang.
3. Mitgeliefertes `tools/tunnel-client.exe` wird geprüft automatisch verwendet.
   Sonst über die Tunnelverwaltung oder [offizielle Releases](https://github.com/openai/tunnel-client/releases/latest)
   beziehen; SHA-256 und `help quickstart` prüfen.
4. PowerShell im installierten MCP-Paket öffnen:

   ```powershell
   ./Start-Tunnel.ps1 -TunnelId <deine-echte-tunnel-ID> -Initialize
   ```

   Platzhalter samt Klammern ersetzen. Der Schlüssel wird verdeckt lokal
   abgefragt, falls `CONTROL_PLANE_API_KEY` nicht bereits im Prozess gesetzt ist.
   Das Skript initialisiert den offiziellen stdio-Tunnel, prüft Doctor und
   startet ihn. Folgestarts ohne `-Initialize`. Readiness/aktives Polling prüfen.
   Keine Windows-Portfreigabe nötig. Client für Discovery und Aufrufe laufen lassen.

## ChatGPT

1. **Plugins → + → Benutzerdefinierten MCP-Server hinzufügen**.
2. Name **RED Ion**, Beschreibung **RED Ion direkt über ChatGPT steuern**.
3. Verbindung **Tunnel**, denselben echten Tunnel wählen/angeben.
4. Authentifizierung muss zur Tunnelkonfiguration passen. Die stdio-Route hat
   keinen zusätzlichen Redion-OAuth-Server: OpenAI prüft Tunnelberechtigungen,
   Redion fragt die App-Sitzung nativ ab. Keine OAuth-Adresse oder GitHub-URL erfinden.
5. Risikowarnung prüfen, als privates Plugin erstellen, 46 Werkzeuge scannen.
6. Neue Unterhaltung: `@RED Ion Frage den App-Status ab.` Danach eine künstliche
   Testseite mit fünf Überschriften erstellen, Anzeige/Neustart prüfen. Erst
   dann ist die tatsächliche ChatGPT-Verbindung nachgewiesen.

Business benötigt laut aktueller Hilfe Admin/Inhaber; Enterprise/Edu kann
passende Entwicklungsrollen vergeben. Ein sichtbarer Menüpunkt allein beweist
keine erfolgreiche Registrierung. Öffentliche lokale Directory-Plugins haben
einen anderen Freigabeweg; dieser Auftrag bevorzugt private Custom-MCP-Tunnel.

## Diagnose

`Diagnose.ps1` zeigt Node/App/Discovery/Client ohne Inhalte oder Geheimnisse.
Eine Datei allein ist kein Handshake. `Start-MCP.ps1` bietet stdio für lokale
MCP-Hosts. Optionaler HTTP-Modus: `Start-MCP.ps1 -Transport http`, starkes
`REDION_MCP_HTTP_TOKEN` als Prozessumgebungsvariable, standardmässig
`http://127.0.0.1:8793/mcp`, **Authorization: Bearer**. Das ist keine öffentliche
ChatGPT-URL. Den Tunnel für den gewünschten Dialog verwenden.

Entwicklung ausdrücklich mit `-Profile development` wählen. Abschalten
verhindert neue Zugriffe; Trennen beendet Sitzungen. Bei RESULT_UNKNOWN zuerst
den App-Stand prüfen. Bei STALE_DOCUMENT neu lesen, bei EDITOR_BUSY eigene
Eingabe abschliessen, bei EXECUTABLE_CHANGED den aktualisierten Pfad erneut freigeben.

Offizielle Quellen (18. November 2026):
[ChatGPT-Hilfe](https://help.openai.com/de-de/articles/12584461-connecting-custom-mcp-servers-in-chatgpt),
[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
[MCP-Server](https://developers.openai.com/plugins/build/mcp-server),
[Desktop-Veröffentlichung](https://developers.openai.com/plugins/deploy/desktop-only).
