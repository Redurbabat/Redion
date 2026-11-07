# Pointer and Cursor Physics

Custom pointer response is optional expressive enhancement, never baseline navigation.

## Allowed
proximity highlighting, precision crosshair on canvas, resize cursors, drag feedback, bounded magnetic response, spatial hover on showcase objects.

## Rules
Keep the system cursor for conventional text, links, inputs and ordinary controls unless a specialized workspace clearly benefits. Never hide the pointer without immediate replacement and escape path.

Pointer-following visuals should use one animation loop, compositor-friendly transforms and smoothing only when it improves legibility. Stop work when offscreen/inactive.

Touch and stylus must not inherit hover-only behavior. Reduced motion removes trailing, inertia and large proximity effects.