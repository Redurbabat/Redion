# Navigation Choreography

Navigation motion establishes spatial logic across screens.

## Stable shell
Keep persistent navigation/chrome visually stable. Animate the changing region rather than re-entering the whole app.

## Hierarchy
Forward/back navigation may use directional motion when the platform and information hierarchy support it. Sibling destinations should use less directional emphasis.

## Object continuity
When entering detail from an identifiable object, shared geometry can preserve identity. Returning should restore the source context and scroll/selection when feasible.

## Rules
Never block navigation on a long outro. Handle rapid back/forward. Avoid simultaneous unrelated motion in header, sidebar, content and background. Reduced motion uses short fades/state swaps.