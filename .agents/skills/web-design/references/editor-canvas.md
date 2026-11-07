# Editor and Canvas

The work surface dominates; chrome recedes.

## Architecture
stable global navigation -> tool selection -> canvas/document -> contextual controls -> optional inspector/history/layers.

Frequent tools remain reachable. Tool-specific options appear contextually. Selection should drive contextual actions.

## Input
Pointer: precision, hover, right-click where appropriate.
Touch: larger targets, pan/zoom gestures.
Stylus: pressure/tilt when supported, palm-safe interaction where platform APIs permit.
Keyboard: shortcuts, undo/redo, escape/cancel, modifier tools.

## Motion
Direct manipulation tracks input. Zoom/pan should feel spatially continuous. Tool palettes and inspectors use restrained motion. Never animate the actual work content gratuitously.

Autosave/sync/history states must be truthful and recoverable.