# RED ION V07 – Live-MCP-Rückgaben und Werkzeugliste

**Prüfung am 23. November 2026.** Ziel: korrektes, unverfälschtes
Seitenlesen über ChatGPT sowie unterscheidbare Meldungen für nicht
implementierte und nicht freigegebene MCP-Werkzeuge.

## Beobachteter Zustand vor dem Fix

Beim verbundenen Konto **Redion V07** wurden `redion_list_workspaces`,
`redion_search`, `redion_list_databases` und `redion_read_database`
erfolgreich gelesen. `redion_read_page` lieferte für mehrere nachweislich
vorhandene Seiten im ChatGPT-Connector dagegen ein leeres Objekt (`{}`).
Ein absichtlich unbekannter Seitenbezeichner erzeugte korrekt `not_found`;
ein unzulässiger Arbeitsbereich erzeugte korrekt `forbidden`.
Dieser Unterschied spricht für ein Problem bei der **Erfolgsantwort oder
der Adapter-Auswertung**, nicht für einen generellen Authentifizierungsfehler.

Das App-basierte Connector-Paket listet **25 Werkzeugaktionen**. Der
tatsächliche Cloud-MCP auf `/mcp/cloud` stellt **14 Werkzeugnamen** bereit.
Die Namen `redion_list_tasks` und `redion_list_block_types` sind in
der verbundenen App sichtbar, im Cloud-MCP aber bislang nicht implementiert.
Sie waren zuvor mit `forbidden` statt einer eindeutigen
`unknown_tool`-Antwort abgelehnt worden.

## Änderung

- `redion_read_page` gibt den Seitenabschnitt standardmässig unter
  `markdown` statt unter einem **fachlichen** Feld namens `content` zurück.
  `content` gehört bereits zur äusseren MCP-Transportstruktur; einige
  App-Adapter behandeln die beiden Bedeutungen möglicherweise nicht sauber.
  `responseFormat: 'legacy'` erhält das bisherige fachliche `content`-Feld
  für Verbraucher, die darauf angewiesen sind.
- Erfolgreiche `tools/call`-Antworten enthalten sowohl die bisherige
  `content: [{type:'text',text:'…'}]`-Struktur als auch das standardisierte
  `structuredContent`-Objekt. So können moderne Clients Daten strukturiert
  auslesen, während ältere Clients weiterhin den Text erhalten.
- Nicht implementierte Werkzeugnamen liefern `unknown_tool`; vorhandene,
  aber wegen fehlender OAuth-Rechte gesperrte Werkzeuge weiterhin
  `forbidden`. Es werden **keine** zusätzlichen Schreibrechte freigegeben.
- Tests prüfen das neue Markdown-Feld, das bisherige Legacy-Format,
  Antwortstruktur, Versionskontrolle, Unicode-Abschnitte und unbekannte
  Werkzeugnamen.

## Verbleibende Produktgrenze

Das **ChatGPT-App-Connector-Toolinventar** ist eine App-Bindung, nicht die
GitHub-Datei `server/mcp/cloud-tools.ts`. Ein Worker-Commit allein kann
die 25 in ChatGPT zwischengespeicherten Werkzeugdefinitionen nicht zuverlässig
auf den tatsächlichen Cloud-MCP-Werkzeugbestand synchronisieren.
Die gebundene App muss nach dem Release neu geladen/aktualisiert werden
und sollte nur aktuell angebotene Werkzeuge exponieren.

Bis die übrigen Werkzeugnamen implementiert sind, dürfen sie **nicht** als
funktionsfähige Cloud-Tools beworben werden. Für Aufgaben, Schaltpläne oder
Blockbearbeitung ist ein eigener Implementierungs- und Rechteschritt nötig.

## Abnahme nach Veröffentlichung

1. `redion_search` findet eine vorhandene Seite; `redion_read_page`
   für deren ID liefert `markdown`, `version` und `nextOffset` statt `{}`.
2. `redion_read_database` liest eine freigegebene Tabelle; gesperrte
   Spalten fehlen.
3. `redion_list_tasks` liefert bis zur Implementierung eindeutig
   `unknown_tool` statt `forbidden`.
4. `tools/list` am Cloud-Server listet nur tatsächlich implementierte und
   per OAuth erlaubte Werkzeuge.
5. Die alte `redion_read_page`-Antwort bleibt für Clients mit explizitem
   `responseFormat:'legacy'` verfügbar.

**Sicherheit:** Keine Änderungen an D1-Bindung, Access-Regeln,
OAuth-Tokenfreigaben oder produktiven Seiteninhalten in diesem Fix.
