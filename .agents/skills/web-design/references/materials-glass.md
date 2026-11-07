# Materials and Glass

## Principle
Material communicates hierarchy and spatial relationship. Glass is appropriate when a floating/transient surface needs to preserve awareness of content beneath it. Do not turn every card into glass.

## Material ladder
- Flat: primary work surfaces, tables, document areas.
- Raised: panels that need separation.
- Translucent: toolbars, popovers, docks, transient controls over content.
- Spatial/3D: specialized immersive or expressive interfaces only.

## Premium translucent material
A convincing glass surface is a system:
1. background sampling/blur where supported
2. restrained tint
3. subtle saturation/vibrancy
4. hairline edge highlight
5. context-aware shadow
6. optional specular response for high-expression UI
7. opaque fallback

Never stack multiple weak translucent layers where legibility collapses. Larger floating surfaces should visually feel more substantial than tiny chips.

## Liquid-glass-like behavior
Use for controls and chrome that float above content, not as a universal decoration. Preserve content-first hierarchy. Motion may subtly alter highlight/refraction as the surface moves, but never at the cost of text stability.

## Accessibility
Honor reduce-transparency/high-contrast settings where available. Ensure foreground contrast remains sufficient over changing content. Provide an opaque fallback.

## Performance
Backdrop blur and filters can be expensive. Limit the number and area of simultaneously blurred surfaces. Test low-power/mobile devices.

## Anti-patterns
- glass on glass on glass
- transparent reading surfaces over busy imagery
- huge blur radii with no hierarchy
- neon borders masquerading as glass
- glass solely because Apple uses translucent materials