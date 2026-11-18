-- Nur MCP-Anmeldungen, Freigaben und kurzlebige Vorgänge.
-- Dokumente bleiben ausschliesslich in den vorhandenen saetze/dateien-Tabellen.
CREATE TABLE IF NOT EXISTS mcp_state (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  expires INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS mcp_state_expiry ON mcp_state(expires);
CREATE INDEX IF NOT EXISTS mcp_state_kind ON mcp_state(kind);
