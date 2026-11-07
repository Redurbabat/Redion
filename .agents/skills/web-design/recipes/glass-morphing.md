# Glass Morphing

Glass/material transitions should preserve one surface identity while its bounds, radius, opacity and elevation adapt.

Use for related floating controls, palettes, sheets and compact-to-expanded surfaces. Blur is supporting material, not the animation itself.

## Rules
- Animate geometry primarily with compositor-friendly transforms/layout projection.
- Keep text/icon contrast stable throughout.
- Avoid independently animating many backdrop-filter layers.
- Morph radius with geometry so corners do not visibly snap.
- Do not make opaque product surfaces glass merely to enable this effect.
- Reduced transparency uses an opaque/elevated equivalent.
- Reduced motion relocates/resizes immediately or uses a short fade.

Never let visual glass interpolation alter hit targets or semantic state.