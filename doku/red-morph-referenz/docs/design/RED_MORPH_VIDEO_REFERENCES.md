# RED Morph — video reference study (2026-11-04)

Source: four user-supplied screen recordings, reviewed at sampled frames; these are visual references, not licensed asset packages. Do not extract copyrighted album covers or third-party app branding into the distributable UI Kit.

## Recording: 11:37:46 (25 s)
White music interface. Bright, lightly translucent bottom capsule with four navigation destinations (Home, Explore, Library, Search). Compact playback controls float immediately above it. Large editorial cover cards, album imagery, and small artwork thumbnails are essential to perceived material depth. Selected tab sits on a soft lens-like circular/oval surface; dock is not an opaque rectangle.

## Recording: 12:58:27 (34 s)
Dark music interface. Near-black canvas, album-art grids, compact mini-player and dock at the bottom. Floating navigation has a transparent smoked-glass body, soft perimeter rim, and distinct selected tab. Search is visually separated at the right in several frames. Content should scroll behind the dock to make blur perceptible.

## Recording: 17:54:05 (9.6 s)
Landscape recording of an interface/interaction workspace; sampled frames show navigation and dark chrome. Do not infer music dock behavior from this recording.

## Recording: ssstwitter (17.2 s)
Landscape recording of an interface/interaction workspace; sampled frames show dark sidebar/navigation. Do not infer music dock behavior from this recording.

## Implementation acceptance criteria
1. The glass dock is visibly translucent *over real, high-contrast content*, not a static gray pill over a blank background.
2. Selected tab uses a separate moving material lens; spring gesture and accessibility behavior remain functional.
3. Mini-player and dock remain separate layers with consistent spacing and safe-area handling.
4. Cover images use correctly licensed real artwork or user-provided artwork with distribution rights, not generic gradient placeholders. Keep image loading, alt text, fallbacks and attribution in the component consuming them.
5. In Safari and browsers without advanced backdrop optics, retain a strong frosted-glass fallback; CSS cannot guarantee pixel-identical iOS native Liquid Glass rendering.
6. Test light/dark, scroll-behind, reduced transparency, reduced motion, keyboard navigation and iPhone viewport sizes.

## Current implementation
The shared React Touch Kit floating `TabBar` has an improved optical shell and selected lens in `app/src/touch/navigation/TabBar.css`. This is a styling improvement, **not** a full 1:1 recreation or a native SwiftUI implementation. Additional real-asset integration, screenshot comparison and runtime tests are required.
