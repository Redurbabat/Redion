# Shared Surface Transition

When one visible UI object becomes another nearby surface, preserve object identity through the transition.

Examples: button -> popover, tool button -> settings palette, card -> detail panel, compact control -> expanded control, thumbnail -> preview.

## Principle
Prefer continuity of position, size, radius, material and content hierarchy over disappearance followed by unrelated appearance.

## Sequence
Capture source geometry and destination geometry. Establish one visual continuity layer or shared-layout identity. Morph bounds/radius/material while secondary content fades/slides in locally. Transfer focus and semantics to the destination at the correct interaction point.

The source must not remain as a confusing duplicate unless it is intentionally the anchor.

## Constraints
Do not morph across large semantic jumps just because elements are spatially adjacent. Avoid fake continuity between unrelated objects.

Support interruption, reverse close, resize during transition and reduced motion. Keep hit testing bound to the real interactive state, not the animated ghost.