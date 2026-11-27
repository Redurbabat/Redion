-- Nur MCP-Anmeldungen, Freigaben und kurzlebige Vorgänge.
-- Aktuelle Dokumente bleiben in saetze/dateien. Ausschliesslich auf explizite
-- Anforderung speichert schematic_undo einen auf 16 KiB begrenzten Plan-Prüfpunkt
-- mit 15 Minuten Gültigkeit; Verbrauch löscht ihn, prune entfernt abgelaufene Einträge.
CREATE TABLE IF NOT EXISTS mcp_state (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  expires INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS mcp_state_expiry ON mcp_state(expires);
CREATE INDEX IF NOT EXISTS mcp_state_kind ON mcp_state(kind);
