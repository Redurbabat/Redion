# Desktop-MCP-Architektur

`ChatGPT → privater Secure MCP Tunnel → offizieller tunnel-client → stdio-MCP →
Windows-Named-Pipe → Electron Main → begrenzte IPC → Register.automatisierung →
vorhandener Bereich/Store → sichtbarer Renderer`.

Optional: Streamable HTTP auf 127.0.0.1 → derselbe MCP-Server. Er benötigt
Bearer-Authentifizierung und wird nicht öffentlich freigegeben.

| Pfad | Zuständigkeit |
| --- | --- |
| `windows/automation-contract.cts` | Verträge, Rechte, Mengen-/Typgrenzen, feste Fehlertexte |
| `windows/automation-bridge.cts` | Kanal, ACL, native Sitzung/Freigabe, Widerruf, einmalige Bestätigung, Protokoll |
| `windows/main.cjs`, `preload.cts` | echter Hauptframe, feste IPC-Kanäle, endliche Anfragen/Antworten, native Dialoge |
| `src/register/automatisierung.ts` | Registrierung semantischer Aktionen durch deren Bereiche |
| `src/schale/bedienung/desktop-automatisierung.ts` | Lebenszyklus, Rechte, Fassungen/Flush, UI-Aktualisierung |
| `src/bereiche/*/automatisierung.ts` | tatsächliche vorhandene Dienste des jeweiligen Bereichs |
| `src/bereiche/ki/desktop.ts` | vorhandener Einstellungsbereich; keine Tokens |
| `plugins/red-ion/server/` | offizielles MCP-SDK, stdio/HTTP, erneute Erkennung nach App-Neustart |
| `plugins/red-ion/build.mts` | eigenständiges Serverpaket, Manifeste, Startskripte und Lizenzhinweise |

Bestehender browserseitiger MCP-Client und Agentenkatalog bleiben erhalten.
Sie werden nicht pauschal als unbeschränkte externe Werkzeuge freigegeben.
Ohne Windows-Bridge werden die neuen Aktionen nicht aktiviert; das SDK läuft
weder in Website noch iPhone. Das Windows-Paket enthält den gebauten Adapter
unter `resources/redion-mcp`; die normale App benötigt ihn nicht für Offline-Arbeit.

Native Freigaben liegen gerätespezifisch im Unterordner `automation` des
bestehenden Profils, ausserhalb von Notizen, Sicherung und Sync. Produktion
und Entwicklung bleiben getrennt. Der Client wählt ein Profil ausdrücklich.
Tests setzen vor Laden von main.cjs einen frischen isolierten appData-Pfad.

Neustart: neuer Kanal/neues Token, erneute native Sitzungsfreigabe. Der Client
liest beim nächsten Aufruf die aktuelle Discoverydatei. Unbekannte Ergebnisse
werden nicht durch blindes Wiederholen von Schreibaktionen behandelt.
Interne Hash-/Ansichtswechsel sind keine vollständige Renderer-Navigation.
Echte Navigation widerruft laufende Anfragen; die neue App muss ihre Bereitschaft
nach vollständigem Start wieder anmelden.

Bestehende Inhalte werden vor Änderungen versioniert, IDs bleiben erhalten.
Undo/Redo prüft auch das tatsächliche Zieldokument des nächsten Verlaufsschritts.
Schaltpläne benutzen vorhandene Klemmenauflösung, Fang, Leitungsführung,
Nachziehen und denselben realen Bauteilrahmen wie die Vorlagenplatzierung.
Keine neue Datenbank, kein Datenformat-Umzug und kein Cloud-Zwang.
