# Morphing and Shared-Element Transitions

Use morphing when an element remains conceptually the same while changing size, location, detail or mode.

## Good cases
- card -> detail view
- compact player -> expanded player
- toolbar button -> contextual palette
- thumbnail -> media viewer
- collapsed search -> active search surface

## Rules
- Preserve identity and direction.
- Animate geometry and material coherently.
- Avoid crossfading two unrelated layouts when continuity can be shown.
- Keep text readable; do not distort long text during geometry interpolation.
- Transitions must be interruptible where users can navigate back or gesture.
- Use a simple fade/scale fallback when shared geometry is technically fragile.

Never morph destructive confirmations or unrelated actions merely for spectacle.