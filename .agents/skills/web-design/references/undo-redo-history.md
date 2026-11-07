# Undo, Redo, and History

Undo/redo is a user-facing interaction model, not two decorative arrows.

## Transaction model
Record meaningful user operations at the right granularity. Continuous typing, drawing, dragging or resizing should normally coalesce into understandable undo steps rather than one entry per low-level event.

Undo reverses the latest eligible local operation; redo reapplies an undone operation until a new branch invalidates it. Communicate when an operation cannot be reversed.

## Scope
Declare whether history belongs to a field, editor, document, workspace or application. Contextual history must not unexpectedly undo actions in another surface.

## UI
Buttons reflect actual availability. Shortcuts follow platform conventions. Optional history views use human-readable operation names and timestamps only when useful.

Autosave and sync do not replace undo. Version history and undo are distinct: undo is immediate operation reversal; versions restore broader snapshots.

For collaborative products, define how remote edits interact with local undo instead of pretending history is a simple global stack.