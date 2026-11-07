# Design Review Gate

Review the actual implementation, not only intent.

## Hierarchy
Can a new user identify page purpose, primary content and next action quickly? Are competing actions appropriately weighted?

## Semantics
Are buttons, links, cards, tabs, menus, dialogs, tables and inputs used for the right jobs?

## System
Check token reuse, spacing rhythm, typography hierarchy, radii, icon consistency, borders, shadows and color roles.

## Interaction
Verify hover, focus, press, selected, disabled, loading, error and empty states as relevant. Confirm controls actually work.

## Accessibility
Keyboard path, focus order, labels/names, semantic structure, contrast, touch targets, reduced motion and overlay focus behavior.

## Responsive
Inspect representative narrow, medium and wide layouts. Look for clipped toolbars, broken tables, awkward wrapping, fixed-element collisions and hidden actions.

## Motion
Each animation must have a reason. Remove gratuitous motion. Verify performance and reduced-motion behavior.

## Content
Avoid fake metrics, meaningless badges, placeholder production actions, generic filler and duplicated copy.

## Completion
Run available typecheck/build/tests/lint. Never claim a check passed if it was not run.
