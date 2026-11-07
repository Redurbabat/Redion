# Input Modality Matrix

Do not design a complex workspace for a generic “pointer.”

Audit each important operation across:
- mouse
- precision trackpad
- keyboard
- touch
- stylus
- hybrid devices where multiple modalities coexist

Hover capability is not equivalent to primary input. Use media features and actual events carefully; hybrid devices can have both touch and mouse.

For each operation record activation, context menu, drag, selection, zoom/pan, hover preview and cancellation paths. A feature may adapt per modality, but essential outcomes should remain reachable.

Never infer stylus pressure/latency quality from mouse emulation.