# Async Result Contracts and UI Truth

UI messages depend on distinguishable domain outcomes.

Do not collapse materially different outcomes into null/false and then guess a message in the view layer.

## Prefer explicit outcomes
Examples: completed, no_changes, already_running, offline, unauthenticated, no_workspace, forbidden, cancelled, failed.

The UI maps each outcome to truthful feedback and recovery. “Nothing to do” is not equivalent to “already running.” “Saved locally” is not equivalent to “synced.”

Async controls prevent duplicate execution when required, but should expose existing in-progress state rather than pretending the click had no effect.

Result types are especially important for sync, upload, export, AI generation and destructive/background operations.