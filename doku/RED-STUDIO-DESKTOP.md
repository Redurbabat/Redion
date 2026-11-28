# RED Studio Desktop

Refs #260. Separate branch from main at 72e4e885. Home Server #258 stays independent.

## Phase 1
- The shared GfxToolbar still dispatches the existing tool IDs and callbacks. Desktop (>=1024px, fine pointer/hover) reveals a newly activated hidden gallery card without executing a duplicate command. Existing manual gallery navigation, selection, undo and document storage remain intact.
- Desktop-only captions use the existing accessible command name. No touch target reduction; phone layout stays unchanged.
- Desktop electrical workspace receives clearer panel boundaries, a wider parts library/properties panel, numeric status bar and simulation lab separation. Electrical drawing tooltips include existing numeric shortcuts. No change to simulation algorithms.
- PDF desk, thumbnails and inspector separation; selected page has a distinct outline, wider desktop tool gallery. No original PDF content is changed.

## Still open
Actual Windows/Electron and mobile visual regression, full-width layout and resizable simultaneous library/properties, simulator reliability and measurements, PDF editing/OCR, Whiteboard layers, split view, multi-monitor and MCP action coverage. Keep all work on the feature branch; no release or merge before review.
