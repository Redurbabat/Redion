# Continuous Material Selection

A premium selection transition should often behave as one persistent material object moving between related neighboring choices, rather than independent buttons switching backgrounds.

Use for semantically related siblings: tabs, segmented controls, bottom navigation, tool modes, view switchers, compact filters, docks and contextual tool groups.

## Core model
Maintain one shared selection surface with stable visual identity. Selection state changes immediately in the product model; the surface then follows the newest selected target.

Measure source and destination bounds. Interpolate position, width, height and radius. Preserve continuity of material, border, shadow and blur where those materials are appropriate.

## Motion
Prefer a restrained, responsive spring. The effect should feel attached to the user's action, not like a queued animation.

Requirements:
- preserve velocity when retargeted;
- interrupt and retarget immediately on rapid repeated input;
- avoid large overshoot in productivity UI;
- never animate layout in a way that moves neighboring hit targets;
- keep logical hit regions stable throughout the transition.

A useful starting behavior is 180–300 ms perceived settling with low overshoot, then tune by product density and distance. Do not hardcode one spring across every product.

## Icon and label choreography
The moving material is primary. Icon/label emphasis is secondary.
- destination icon may gain emphasis as the material arrives;
- source emphasis may crossfade out;
- labels should not slide long distances independently;
- text width changes must not cause the control group to jump;
- active state remains understandable without animation.

## Adjacent merge
When source and destination directly touch or nearly touch, the selection surface may visually stretch/bridge during travel so the transition reads as continuous material. Keep the bridge subtle and bounded. Never create a liquid blob that obscures which option is selected.

## Drag/scrub selection
For suitable segmented controls or tool strips, direct touch/pointer scrubbing may drive the material continuously between choices. Commit according to the component's interaction contract. Do not add scrub behavior to ordinary navigation when accidental destination changes would be costly.

## Glass/material
Glass is optional. If used, animate the shared material surface rather than independently animating backdrop blur on every sibling. Keep contrast stable. Provide opaque fallback for reduced transparency/performance constraints.

## Responsive and input
Mouse/trackpad can use hover preview distinct from committed selection. Touch has no hover. Stylus follows direct targeting unless the product has a deliberate hover-capable pen interaction.

On wrapped or multi-row groups, do not fly the indicator diagonally across unrelated geometry. Fade/re-anchor or use a local transition.

## Reduced motion
Selection changes immediately. Remove travel/stretch and use an instant material relocation or very short opacity change. Semantic state, focus and contrast remain identical.

## Decision rule
Before a hard state cut between neighboring related controls, ask whether spatial continuity would better explain that the same selection is moving. Use continuity when it clarifies relationship; do not apply it to unrelated actions merely because they are adjacent.

## Validation
Test rapid A-B-A switching, keyboard repetition, resize during motion, theme changes, reduced motion, reduced transparency, 60/120 Hz devices, touch, mouse and hybrid input. Verify there is only one committed selected state at all times.