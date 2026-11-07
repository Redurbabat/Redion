# Gestures and Direct Manipulation

Direct manipulation should feel attached to the user's input.

## Rules
- Track pointer/touch/stylus directly during drag.
- Preserve object under the contact point when practical.
- Show valid drop zones/insertion positions.
- Use thresholds before committing swipe actions.
- On release, snap or continue using velocity-aware motion where appropriate.
- Allow cancellation and reversal.
- Provide keyboard/menu alternatives for essential drag/gesture actions.

## Input modality
Pointer: hover previews and precision affordances allowed.
Touch: larger targets, no hover dependency, edge/safe-area awareness.
Stylus: drawing/precision tools may expose pressure/tilt when supported; finger remains a usable fallback.
Keyboard: focus, shortcuts and reorder alternatives for repeated productivity work.

## Haptics
Use platform haptics sparingly for meaningful confirmation, snap, selection or boundary events. Never rely on haptics as the only feedback.