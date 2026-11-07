# Shared Transition Architecture

Shared-element motion needs explicit identity and lifecycle.

## Architecture
Give source/destination a stable semantic transition identity. Capture geometry at transition boundaries, not continuously without need. Separate real UI state from temporary visual transition layers.

Choose an implementation strategy appropriate to the stack: native/runtime transition APIs where reliable, layout projection, FLIP-style transforms, or a controlled overlay clone.

Handle source disappearance, destination not yet measured, scroll/resize, virtualization and navigation interruption.

Never make deep links, Back navigation or accessibility depend on the transition layer. The destination must be valid with animation disabled.