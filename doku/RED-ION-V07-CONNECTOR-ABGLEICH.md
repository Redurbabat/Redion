# RED ION V07 – MCP-Connector-Abgleich (23. November 2026)

## Befund aus Live-Abfrage

Am 23.11.2026 lieferte der verbundene Redion-V07-Connector lesbare
Arbeitsbereiche, 131 eingebettete Schaltzeichen, 56 Blockarten,
Dokumente, Aufgaben und Datenbanken. Bei grossen Seiten scheiterte
`redion_read_block` bisher an über 40 direkten Kindern. Eine
`redion_read_database`-Abfrage mit `limit:50` wurde mit
`invalid_arguments` abgewiesen, obwohl die Connector-Schnittstelle
500 erlaubt. Diese beiden Backend-Probleme korrigiert PR #227.

Die im ChatGPT-Connector öffentlich registrierten Werkzeuge sind **nicht
automatisch** mit dem neuesten `server/mcp/cloud-tools.ts` synchron:
Es gibt 25 registrierte Toolnamen, der kanonische Cloud-MCP-Server
exportiert 24. 19 Namen stimmen überein.

### Diese 5 kanonischen Lesewerkzeuge fehlen in RED ION V07

- `redion_get_page_path`
- `redion_read_pages`
- `redion_list_page_blocks`
- `redion_list_root_pages`
- `redion_list_child_pages`

### Diese 6 registrierten Werkzeuge sind im aktuellen Server NICHT implementiert

- `redion_trash_page`
- `redion_create_database`
- `redion_add_rows`
- `redion_update_row`
- `redion_add_task`
- `redion_add_event`

**Zusätzliche Einschränkung des alten V07-Connectors:** Seine
`redion_read_database`-, `redion_read_block`- und
`redion_read_page`-Definitionen geben jeweils **keinen Offset-Parameter**
frei. Darum kann dieser alte Connector auch nach der Backend-Korrektur
zunächst nur die erste paginierte Antwort lesen. Die Rückgabefelder
`nextOffset`, `nextChildOffset` und `nextBlockOffset` werden erst
nach der **App-seitigen Schema-Aktualisierung** mit den passenden
Eingabeparametern voll nutzbar. Das Backend erfindet keine weiteren
Zeilen und gibt auch nicht heimlich mehr als 10 Datenbankzeilen aus.

**Wichtig:** Kein künstliches Mapping auf andere Funktionen, keine
Behauptung, dass diese veralteten Aufrufe produktiv funktionieren.
Aus dem öffentlichen Connector entfernen, bis eine geprüfte
Backend-Implementierung samt Test und Scope-Definition vorhanden ist.

### Diese Signaturen stimmen nicht überein

| Werkzeug | Registrierter V07-Connector | Backend (PR #227) |
|---|---|---|
| `redion_add_schematic` | Ein vollständiges Array `teile` und `verbindungen` | Erstellt nur einen leeren Schaltplan; benötigt `art` und `expectedVersion`; optional `titel`, `requestId` |
| `redion_update_schematic` | Ersetzt komplette `teile`-/Verbindungs-Arrays | Geprüfte einzelne `operation`: `add_component`, `connect_terminals`, `add_label`, `move_component`, `move_label` |
| `redion_update_block` | Beliebiges `daten`, `ersetzen` und `papierkorb` | Nur `operation`: `set_text`, `set_checked`, `set_note`, `set_due_date` mit geprüften Eingaben |
| `redion_add_block` | Beliebige Blockart und Kindblock-Erstellung | Nur `text,h1,h2,h3,todo,bullet,number,quote,code,divider`; `daten` nur geprüfte Todo-Felder |
| `redion_append_content` | `content` bis 12'000 Zeichen | Maximal 4'000 Zeichen je Aufruf |
| `redion_read_database` | `limit` bis 500 Zeilen | 1–500 als Eingabe; pro Antwort **höchstens 10 sichtbare Zeilen** mit `requestedLimit`, `effectiveLimit`, `limitCapped`, `nextOffset` |
| `redion_read_page` | Nur `workspaceId`/`documentId` | Unterstützt zusätzliche `offset`/`limit`, `expectedVersion`, `responseFormat`, `blockOffset`/`blockLimit` |
| `redion_read_block` | Nur `workspaceId`/`blockId` | Zusätzlich `childOffset`/`childLimit`; Antwort `nextChildOffset` und `childrenTruncated` |

## Aktualisierung des verbundenen ChatGPT-Connectors

Der private Plugin-Creator-Eintrag
`plugin_asdk_app_6b01fbef9ff881918fb2586f7208d923` gehört zu
einem **App-backed Connector**. Sein zugängliches Quellarchiv enthält
nur die Dateien `.app.json` und
`.codex-plugin/plugin.json`, mit App-ID und Präsentationsmetadaten.
Die eigentliche Remote-MCP-Konfiguration und Tooldefinitionen sind
darin **nicht** enthalten. Ein Plugin-Archiv-Update könnte nur diese
Metadaten ändern, aber weder die MCP-Werkzeug-Inputs noch die
Backend-Implementierung synchronisieren.

Erforderlich ist deshalb ein Update der MCP-Toolliste im
ursprünglichen App-Entwickler-/Connector-Editor. Die **kanonische
Quelle** ist `CLOUD_TOOLS` plus `visibleCloudTools()` in
`server/mcp/cloud-tools.ts`. Für Schreibfunktionen muss
`redion:write` ausdrücklich freigegeben sein; alte, nicht
implementierte Werkzeuge werden entfernt. Erst danach den Connector
in ChatGPT aktualisieren/neu verbinden und eine neue Toolliste abfragen.
OAuth-Tokens oder bestehende Freigaben nicht automatisch ändern.

## Abnahmetests

1. 24 kanonische Toolnamen; bei einem nur lesenden Token dürfen die
   9 Schreibwerkzeuge nicht sichtbar sein.
2. Auf einer Seite mit mindestens 52 Kindblöcken liefert
   `redion_read_page` eine sichtbare `blockPreview`, ohne
   Block-IDs versteckter/verschlüsselter Kinder.
3. `redion_read_block` zeigt zunächst bis 40 sichtbare Kinder und
   danach mit `childOffset` die restlichen.
4. `redion_read_database` mit `limit:50` muss **maximal 10**
   sichtbare Zeilen sowie `limitCapped:true` und
   `nextOffset` zurückgeben; verschlüsselte/gesperrte Zeilen
   dürfen die Paginierung nicht verfälschen.
5. Schreibfunktionen ausschliesslich mit synthetischen Testdaten,
   Versionsschutz und OAuth-Scope verifizieren. Insbesondere
   keine automatische Behauptung elektrischer Schaltplanprüfung.

GitHub-Merge aktualisiert den Quellstand; er ist **kein Beleg für
Cloudflare-Deployment** und ändert keine bei ChatGPT gespeicherte
App-backed-Connector-Werkzeugdefinition automatisch.


## Reproduzierbarer Werkzeugvertrag (23. November 2026)

Ein manuell kopierter Werkzeugkatalog kann schnell veralten. Deshalb
exportiert 'skripte/mcp-connector-vertrag.mts' nun die **exakten**
Definitionen aus 'visibleCloudTools()' in eine JSON-Datei:

    npm run test:mcp-connector
    npm run mcp:connector:export

Ergebnis: 'build/mcp/redion-v07-werkzeuge.json' mit 24 Werkzeugen,
davon 15 nur lesend und 9 mit 'redion:write'. Für jede Funktion enthält
die Datei den Namen, die tatsächliche Beschreibung, 'inputSchema',
MCP-Annotations und den erforderlichen OAuth-Scope. Sie enthält **keine**
Zugangs-Tokens, Workspace-Inhalte, Nutzer-IDs oder Datenbankzeilen.

Die GitHub Action **RED ION MCP Connector Contract** erzeugt dieselbe
Datei auf jedem einschlägigen PR- oder 'main'-Push. Im erfolgreichen
Action-Lauf das Artefakt 'redion-v07-mcp-tools' herunterladen.

### In den bestehenden ChatGPT-App-Editor übernehmen

1. Den App-Entwickler-Editor des **bereits vorhandenen** privaten
   'Redion V07'-Connectors öffnen; keinen neuen Connector anlegen.
2. Wo der Editor automatische MCP-Erkennung anbietet, den bereits
   verbundenen '/mcp/cloud'-Endpunkt aktualisieren und 'tools/list'
   neu einlesen. Sonst die 24 Definitionen aus dem Action-Artefakt
   exakt übernehmen (jeweils die 'inputSchema'- und Annotation-Felder).
3. Die sechs im aktuellen Backend nicht vorhandenen Legacy-Werkzeuge
   entfernen und die fünf fehlenden Lesewerkzeuge ergänzen. Weder
   künstliche Alias-Namen noch frei akzeptierte 'daten'/'papierkorb'-
   Parameter für die eingeschränkten Bearbeitungsfunktionen einbauen.
4. Lesen nur mit 'redion:read' prüfen: **15 Werkzeuge** sichtbar.
   Schreiben erst mit ausdrücklichem 'redion:write': **24 Werkzeuge**.
   Anschliessend die neue Toolliste in ChatGPT laden und die grossen
   Seiten mit 'blockOffset' und 'childOffset' paginieren.
5. Schreibtests nur mit synthetischen Testseiten und korrekter Version
   durchführen. Produktionsdaten und bestehende OAuth-Freigaben nicht
   für einen Connector-Refresh zurücksetzen.

**Grenze:** Eine grüne GitHub Action aktualisiert die App-backed
Connector-Bindung nicht automatisch. Der App-Entwickler-Editor muss
den neuen Werkzeugvertrag tatsächlich veröffentlichen; Änderungen an
'.app.json' oder am Präsentationsmanifest allein reichen dafür nicht.
