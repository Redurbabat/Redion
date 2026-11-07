# Adjacent Control Morphing

Use shared-edge morphing when neighboring controls belong to one semantic control family and state moves between them.

This is inspired by platform-quality spatial continuity, not by copying any proprietary visual asset.

## When to use
Good: segmented controls, adjacent tool choices, tab-like modes, compact filter groups, previous/next mode clusters.
Avoid: unrelated actions, destructive + safe actions, controls separated by hierarchy, dense tables where motion distracts.

## Behavior
Treat the active background/highlight as one persistent object that travels between siblings rather than two independent backgrounds fading.

On selection change:
1. measure source and destination geometry;
2. move/resize the shared highlight continuously;
3. preserve corner logic at group edges;
4. crossfade label/icon emphasis subtly;
5. allow reversal/interruption without snapping.

Prefer transform/scale or layout-projection techniques. Do not animate expensive layout each frame.

## Timing
Direct click/tap: roughly 180–280 ms or a restrained spring.
Keyboard rapid navigation: shorten/interrupt rather than queue.
Reduced motion: instant state change or short opacity transition.

The destination must become semantically selected immediately; animation is presentation, never state truth.