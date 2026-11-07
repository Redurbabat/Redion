# Interaction Scope Model

Every action should declare the scope it operates on.

Common scopes: application, destination, workspace/document, page/artboard, selection, object, active tool and transient mode.

Scope determines placement, shortcut precedence, confirmation language, disabled state and persistence. A page action should not look like a global command; a selection action should disappear or disable when selection is gone.

Before adding controls, map actions to scope. This prevents duplicate chrome and makes contextual UI predictable.

When scope changes, preserve user context and avoid stale controls that still appear actionable.