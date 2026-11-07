# Gesture Arbitration

Complex touch/stylus interfaces need explicit ownership when gestures overlap.

Potential owners include page scroll, canvas pan, object drag, selection, sheet drag, navigation swipe, zoom and drawing.

## Rules
- Decide ownership from start region, active tool, pointer type, direction and movement threshold.
- Delay commitment only as long as needed to distinguish plausible gestures.
- Once a gesture owns the stream, use pointer capture or equivalent when appropriate.
- Define cancellation and transfer deliberately; do not let two components react to the same drag.
- Stylus drawing should not accidentally trigger page navigation or sheet dragging.
- Multi-touch zoom/pan must coexist with single-pointer tools according to product mode.

Document conflicts as an interaction matrix and test hybrid devices.