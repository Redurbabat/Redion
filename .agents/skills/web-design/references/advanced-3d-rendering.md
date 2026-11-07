# Advanced 3D Rendering

Use WebGL/WebGPU/native 3D only when the product benefit exceeds complexity and performance cost.

## Architecture
Separate scene state from UI state. Lazy-load heavy assets. Dispose GPU resources. Pause or reduce rendering when hidden/offscreen. Use adaptive quality for device capability.

## Visual rules
Lighting, material and camera should serve object comprehension. Avoid gratuitous bloom, chromatic aberration and depth-of-field on utility text.

## Interaction
Ray/pointer hit testing needs stable targets. Camera controls require bounds and reset/home behavior. Touch gestures must not conflict with page scrolling unless the scene is clearly active.

Always provide loading/error/fallback behavior. Measure frame time and memory; do not infer performance from a desktop development machine.