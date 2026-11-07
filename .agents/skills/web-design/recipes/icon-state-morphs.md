# Icon State Morphs

When two icon states represent the same control changing state, a restrained morph can preserve identity.

Examples: play/pause, expand/collapse, menu/close, pin/unpin, view-mode variants.

Prefer path-compatible morphing only when shapes remain legible through interpolation. Otherwise use a short crossfade/rotate/scale choreography rather than forcing malformed intermediate paths.

The accessible name/state updates immediately and does not wait for the visual morph.

Avoid decorative icon morphs between unrelated commands. Reduced motion uses instant swap or minimal fade.