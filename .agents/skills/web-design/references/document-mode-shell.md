# Document Mode and Focused Workspaces

A focused document/canvas mode may intentionally suppress global chrome so the work surface dominates.

## Enter
Preserve enough origin state to return: destination, scroll, selection and relevant panel/tool state.

## While focused
Keep document-level navigation, find, zoom, view mode and active creation tools reachable without reintroducing the entire application shell. Global actions belong in a compact overflow or command surface when needed.

## Exit
Return to the prior application context predictably. Avoid rebuilding the document merely to change chrome; transient edits and in-progress gestures must survive harmless shell changes.

Phone layouts often consolidate document controls into one view menu/sheet. Desktop can expose more persistent precision controls.