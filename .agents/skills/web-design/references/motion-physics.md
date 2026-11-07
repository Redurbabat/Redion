# Motion Physics

## Core rule
Motion must preserve continuity: begin from the current visual state, respond immediately, and remain interruptible whenever direct manipulation is involved.

## Motion selection
Use timing curves for simple state changes. Use springs for spatial movement, gesture release, sheets, docks, reorder, snapping, shared elements, and objects that should preserve velocity.

## Spring behavior
Choose springs by perceived behavior rather than copying one stiffness everywhere:
- responsive control: fast settle, minimal overshoot
- sheet/panel: controlled, slightly soft
- dock/proximity: responsive and reversible
- playful object: more visible overshoot only when product tone permits

When a gesture releases, hand off pointer velocity to the animation where technically possible. A user reversing direction should not have to wait for an old animation to finish.

## Timing fallback
- press feedback: 80–140ms
- micro state: 100–180ms
- popover/menu: 140–220ms
- panel/sheet: 180–320ms
- view transition: 220–400ms
Longer sequences require a presentation reason.

## Spatial continuity
Prefer transforms and opacity over unrelated disappear/reappear transitions. Shared-element transitions are useful when the same object changes context. The destination should feel causally connected to the source.

## Reduced motion
Replace large travel, parallax, zoom and 3D rotation with opacity or short state changes. Preserve information and completion feedback.