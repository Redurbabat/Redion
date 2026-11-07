# Drag Physics

During direct manipulation, the object follows input; animation begins primarily at pickup emphasis, constraints, auto-scroll, and release.

## Pickup
Optional slight lift/scale/shadow may indicate capture. Do not create a long pickup animation that lags behind the pointer.

## Move
Track position directly. Show insertion/target state continuously. Apply resistance only when it communicates a real boundary.

## Release
Valid drop -> settle/snap to destination.
Invalid drop -> return toward origin.
Throw/inertial continuation -> only for surfaces where momentum is expected, such as carousels/canvases, not ordinary list reorder.

Preserve release velocity when supported. Auto-scroll near edges should ramp smoothly and stop immediately when leaving the zone.

Provide keyboard/menu alternatives for essential reorder/move operations.