# Dock Magnification

Use only for pointer-driven high-frequency tool docks where proximity helps targeting and expression.

## Response
Compute influence from pointer distance to each item center. The focused item receives the strongest scale; adjacent items receive progressively smaller influence. Use a smooth falloff rather than discrete jumps.

A conservative starting envelope:
- focus: about 1.15–1.25
- nearest neighbor: about 1.06–1.12
- second neighbor: about 1.02–1.06
- rest: 1.0

These are starting ranges, not mandatory constants.

## Behavior
Keep hit testing stable. Do not let magnification cause layout reflow; transform visual items. The response must reverse immediately when pointer direction changes. Labels/tooltips should not jitter with scale.

Touch/stylus: use stable target sizes; do not emulate pointer proximity. Keyboard focus may use a simpler highlight or modest scale.

Reduced motion: disable magnification or reduce it to a static focus emphasis.