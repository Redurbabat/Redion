# Visual Regression and Measurement

A design review must inspect rendered output, not only source code.

## Measure
- clipping/overflow
- alignment and spacing
- target sizes
- text truncation
- contrast in actual composition
- fixed elements versus viewport/safe area
- overlays at edges
- responsive state changes
- dark/light themes
- reduced motion/transparency
- print/export when supported

Use representative viewport classes plus edge cases. Screenshot comparisons are evidence, but pair them with semantic/behavior tests. A visually unchanged screenshot cannot prove keyboard, focus or async behavior.

When a regression is discovered, create the smallest durable guard that detects the actual failure rather than an incidental implementation detail.