# Version History

Version history represents durable snapshots or revisions and should not be conflated with command-level undo.

A history view should help users answer: what changed, when, by whom where applicable, and what restoring will affect.

Preview before restore when the consequence is broad. Restoring should preserve or clearly branch from the current state so recovery remains possible.

For documents with pages/canvas/attachments, state whether a version covers the entire document or only a scoped entity.

Use relative time for scanning and exact timestamps on demand when precision matters.