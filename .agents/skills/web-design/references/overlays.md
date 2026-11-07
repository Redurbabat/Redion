# Menus, Popovers, Tooltips, Drawers and Modals

## Choose the least disruptive container
- Tooltip: short explanation, no essential interactive workflow.
- Menu: compact actions/choices.
- Popover: contextual temporary controls near trigger.
- Drawer: secondary workflow requiring space while preserving page context.
- Modal: focused decision/task requiring interruption.
- Full-screen flow: complex task that deserves its own context.

## Position
Contextual UI should appear near its trigger/selection when possible and avoid covering the object being manipulated.

## Interaction
Escape closes transient overlays when safe. Restore focus to trigger. Support outside-click only where it will not cause data loss. Trap focus in true modal dialogs.

## Motion
Usually opacity + 2–8px translation or subtle scale, 120–200ms. Motion should communicate origin.

## Avoid
Modal for every setting, tooltip containing critical actions, nested modal chains, giant centered dialogs for tiny choices, losing unsaved data on dismissal.
