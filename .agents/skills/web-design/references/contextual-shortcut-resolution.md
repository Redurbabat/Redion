# Contextual Shortcut Resolution

Keyboard shortcuts form a scope hierarchy, not a flat global list.

## Resolution
Resolve input from most specific active context outward: text editing/selection -> active tool or canvas -> document/workspace -> global shell. A handler that consumes a shortcut prevents broader handlers from also acting.

## Rules
- Never steal native text-editing shortcuts without a strong product reason.
- Display the shortcut that actually resolves in the current context.
- Reuse one semantic command registry where possible.
- Handle Cmd/Ctrl platform conventions deliberately.
- Modal, menu and composition states can temporarily change resolution.
- Essential actions need discoverable non-keyboard access.

Test collisions with real editor selections, dialogs, command palettes and browser/OS conventions.