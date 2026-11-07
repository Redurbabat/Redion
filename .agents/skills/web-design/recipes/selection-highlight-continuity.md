# Selection Highlight Continuity

For adjacent selectable items, a moving selection indicator can make state changes spatially legible.

Applicable to tabs, segmented controls, dock selections, mode strips and compact navigation.

Use one shared indicator with stable identity. It may translate and resize between selected items while labels/icons independently update emphasis.

## Geometry
Interpolate x/y/width/height and corner radius. Avoid width jumps caused by text reflow. For wrapped/multi-row layouts, prefer a fade or local transition rather than flying diagonally across unrelated rows.

## Physics
Use restrained spring behavior with low overshoot for productivity UI. Preserve velocity during rapid changes and target the newest selection instead of completing stale animations.

Hover preview must remain distinct from committed selection.

Reduced motion: indicator moves instantly; selection remains equally clear without motion.