# Material Merge and Separate

Neighboring floating controls may visually merge when they become one interaction group and separate when their relationship ends.

Use this sparingly for premium floating toolbars, contextual palettes and compact control clusters.

## Merge
As controls approach/group, coordinate gap, shared background, border/radius and shadow so the result reads as one surface. Do not literally distort text/icons.

## Separate
Restore individual boundaries while preserving spatial origin. Avoid elastic blobs that obscure hit targets or make controls appear liquid without functional reason.

## Interaction safety
Logical hit targets remain stable and non-overlapping. Visual material may interpolate, but accessibility tree and command identity remain discrete.

Material effects are subordinate to hierarchy. Glass/blur is optional; the continuity pattern works with opaque surfaces too.

Reduced transparency uses opaque/elevated surfaces. Reduced motion uses immediate regrouping or a short fade.