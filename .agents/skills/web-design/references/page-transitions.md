# Page and View Transitions

Transitions should explain where the user went and preserve continuity.

## Selection
- sibling destination -> restrained crossfade/slide when useful
- hierarchy push -> directional transition appropriate to platform
- object detail -> shared-element transition when identity matters
- modal task -> layered presentation
- workspace mode change -> preserve stable chrome and transform only changed regions

Do not replay elaborate entrance animation on every navigation. Navigation must remain responsive under rapid input.

Reduced motion: replace large translation, zoom, parallax and 3D with short opacity/state changes.