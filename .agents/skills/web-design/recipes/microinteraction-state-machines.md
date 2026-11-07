# Microinteraction State Machines

Model interaction as explicit states and transitions, not scattered hover effects.

## Core states
idle, hover where supported, focus-visible, pressed, selected/toggled, dragging, loading, success, error, disabled.

## Rules
- Every transition has a cause and destination.
- Rapid input can reverse or interrupt transitions.
- Visual state and semantic/ARIA state stay synchronized.
- Loading cannot erase context or create layout jumps.
- Success/error feedback returns to a stable state intentionally.
- Disabled controls do not animate as if actionable.

Use state machines for complex controls such as record buttons, uploaders, tool modes, expandable actions and async commands. Keep simple buttons simple.