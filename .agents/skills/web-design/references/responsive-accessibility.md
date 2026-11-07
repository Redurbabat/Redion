# Responsive and Accessibility

## Responsive
Design from priority. Recompose layouts instead of shrinking them.

Check:
- navigation model
- column order/collapse
- toolbar overflow
- tables
- fixed/sticky elements
- safe areas
- text wrapping
- virtual keyboard
- modal/popover placement
- touch targets
- orientation changes

Use content-driven breakpoints when possible rather than device-name assumptions.

## Accessibility
Semantic HTML first. Maintain logical headings, landmarks, names/labels, visible focus, keyboard paths, sufficient contrast and non-color state cues. Interactive elements require usable target sizes.

## Input parity
Pointer hover may enhance. Keyboard and touch must retain functionality. Drag interactions need reasonable alternatives where the task requires accessibility.

## Motion
Respect reduced motion. Avoid flashing and disorienting movement.

## Testing
Test keyboard-only navigation, zoom/text enlargement, narrow viewport, touch-equivalent flows, error messages, focus after overlays, and screen-reader naming for key controls.
