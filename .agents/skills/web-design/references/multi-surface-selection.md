# Multi-Surface Selection

Selection that crosses pages, artboards, slides or canvas regions needs an explicit scope model.

## Rules
Define whether selection can cross surface boundaries and what commands remain valid. Keep selected objects visibly associated with their source surface.

Lasso geometry should operate in a stable coordinate system. Scrolling, zooming or page virtualization must not corrupt selection identity.

Bulk move/copy/delete/export must communicate scope before destructive execution. When cross-surface selection is unsupported, prevent it clearly rather than partially selecting invisible objects.

Keyboard and non-lasso alternatives should exist for essential multi-item operations.