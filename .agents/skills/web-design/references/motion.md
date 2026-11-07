# Motion

## Purpose
Every animation should explain state, origin, hierarchy, continuity, feedback, or direct manipulation.

## Levels
0 Essential only.
1 Functional: hover/press/open/close/drag.
2 Expressive: subtle springs, depth, staged reveal.
3 Experimental: spatial, 3D, magnetic, physics, scroll choreography.

Choose level from product/brand, not personal taste.

## Timing
Micro 80–160ms; menu/popover 120–200ms; panel 180–280ms; view transition 200–350ms. Direct manipulation follows input. Springs suit spatial relationships.

## Scroll
Sticky/reveal behavior is fine when it improves orientation. Avoid scroll hijacking, forced cinematic delays, excessive parallax, tunnel/zoom effects on utility pages.

## Pointer
Proximity/magnetic/dock effects belong to specialized expressive controls, not every component. Avoid global mouse-follow lighting.

## Reduced motion
Provide equivalent state changes without large movement. Never remove essential feedback.

## Performance
Prefer transform/opacity for frequent motion; avoid layout thrash and continuous expensive blur/filter work.

## Avoid
Infinite bounce, gratuitous glow, random rotation, simultaneous animation everywhere, long easing before common actions complete.
