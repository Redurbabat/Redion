# CSS Motion Implementation

Prefer CSS for simple state transitions and compositor-friendly effects.

Use transform and opacity for frequent animation where possible. Use transitions for deterministic state changes and keyframes for self-contained sequences. Avoid animating layout-heavy properties in continuous interactions when a transform solution exists.

Use CSS custom properties for semantic motion tokens and material parameters. Respect prefers-reduced-motion. Use @supports/progressive enhancement for advanced backdrop/filter features.

Do not scatter magic durations/easings across components; map to semantic motion roles.