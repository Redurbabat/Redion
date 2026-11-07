# Mobile Bottom Navigation

Bottom navigation is for a small set of high-frequency top-level destinations.

## Source of truth
When the product has a navigation registry, derive mobile destinations from semantic metadata instead of maintaining unrelated hardcoded markup. Platform-specific ordering/subsets are allowed, but should be explicit configuration.

## Rules
Keep destination count constrained. Current location is visible beyond color. Labels should remain understandable. Preserve safe-area inset and virtual-keyboard behavior.

Do not mix top-level destinations with contextual document actions in the same bar. Overflow/More can contain secondary destinations.

Changing the desktop primary set does not automatically mean mobile should mirror it; the difference must be intentional and documented.