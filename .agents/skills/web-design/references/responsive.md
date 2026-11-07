# Responsive Design

## Principle
Responsive means recomposition, not proportional shrinking.

## Breakpoint strategy
Use content-driven breakpoints and existing project tokens. Do not invent device-specific breakpoints without layout need.

## At each width verify
Navigation model, column count/order, text wrapping, toolbar overflow, tables, media, sticky/fixed elements, overlay placement, touch targets, virtual keyboard effects, safe areas.

## Dense interfaces
Allow sidebars to collapse, toolbars to scroll/overflow into More, tables to prioritize columns or switch presentation. Do not remove core capabilities without an alternate path.

## Touch
No hover dependency. Ensure comfortable targets and spacing. Gestures need visible or discoverable alternatives when not obvious.

## Content
Preserve hierarchy across sizes. A desktop secondary panel may become a drawer/sheet on smaller screens.

## Avoid
Desktop squeezed into mobile, horizontal page overflow, arbitrary hiding, tiny controls, fixed bars covering content.
