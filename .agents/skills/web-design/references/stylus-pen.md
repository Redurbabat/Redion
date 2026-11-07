# Stylus and Pen Interaction

Use stylus capabilities for precision/drawing tasks, not as a requirement for basic app operation.

## Input
Capture pressure and tilt only when they have a meaningful tool mapping. Provide sane mouse/finger fallback. Coalesced/predicted events may improve ink where supported.

## Drawing
Ink follows the tip with minimal latency. Separate rendering feedback from durable document commits when architecture permits. Stabilization must not feel detached from the hand.

## Tools
Pen, marker, eraser, lasso and shape tools should expose settings contextually. Re-selecting an active tool may reveal its settings when this convention is documented/consistent.

## Palm and gestures
Use platform capabilities for palm rejection where available. Distinguish drawing from pan/zoom based on active tool and input modality. Never assume every touch near a stylus is accidental.

## Accessibility
All document actions need non-stylus paths where feasible.