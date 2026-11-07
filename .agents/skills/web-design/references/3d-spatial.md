# 3D and Spatial Interaction

3D is a communication tool, not a default polish layer.

## Good uses
- product/object inspection
- spatial editors
- data where depth encodes meaning
- immersive showcases
- subtle depth/parallax that reinforces layering
- direct manipulation with clear spatial correspondence

## Avoid
- random card tilt
- rotating every icon
- perspective that makes text harder to read
- scroll scenes that block navigation
- decorative WebGL when CSS/2D communicates the same thing

## Depth budget
Use three levels:
1. structural depth: normal elevation/layering
2. interactive depth: small pointer/scroll response
3. immersive depth: real 3D scene

Most productivity UI should stay at level 1. Marketing may use 1–2. Immersive/showcase can use 3.

## Pointer parallax
Keep angles and travel restrained. Return smoothly to neutral. Disable or simplify for touch and reduced motion.

## Performance
Prefer transform/compositor-friendly work. Lazy-load heavy 3D. Cap DPR/render resolution when appropriate. Pause offscreen scenes. Measure frame time.

## Accessibility
Never encode essential information only through depth/motion. Provide non-spatial navigation and reduced-motion alternatives.