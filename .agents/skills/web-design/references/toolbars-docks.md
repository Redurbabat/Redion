# Toolbars and Docks

Toolbars expose actions for the current context. Docks provide persistent or high-frequency tools.

## Placement
Keep actions near the work they affect. Desktop may use top/side/bottom toolbars. Tablet drawing/editing can use floating palettes or bottom/side docks. Phone often needs compact top controls plus bottom sheets/toolbars.

## Density
Show frequent actions directly; overflow secondary actions. Group by task, not arbitrary separators.

## Contextual behavior
Selecting a tool activates it immediately. Re-selecting an active tool or invoking a secondary action may open its settings. Switching tools replaces irrelevant settings.

## Floating dock
A floating dock may use translucent material when it overlays content. It must remain readable over varied backgrounds and have an opaque fallback.

## Proximity magnification
Appropriate for specialized pointer-driven docks. Keep magnification bounded, smooth and reversible; neighbors may scale less than the focused item. Touch should use stable target sizes rather than proximity magnification.

## Overflow
Support horizontal scroll/trackpad/drag where appropriate and a discoverable More mechanism. Do not clip essential tools silently.

## Accessibility
Keyboard navigation, focus indication, accessible names, selected state and tooltips for unfamiliar icons are required.