# Design Tokens

Use semantic tokens before component-specific raw values.

## Token layers
1. Primitive: raw color, spacing, radius, type, shadow, blur.
2. Semantic: background, surface, text, border, accent, success, warning, danger.
3. Component: button-primary-bg, toolbar-material, dialog-radius only when a semantic token is insufficient.
4. Project override: brand and product-specific values.

## Rules
- Prefer a 4px spacing rhythm.
- Define type roles, not arbitrary sizes: display, title, heading, body, label, metadata, code.
- Radius communicates role: tighter for dense controls, larger for floating/transient surfaces.
- Elevation must communicate layering. Never add shadow only to make UI look "premium".
- Color state must survive light/dark/high-contrast modes.
- Do not hardcode dozens of near-identical values.

## Material tokens
When translucent materials are justified, define blur, saturation, tint, border highlight, shadow, and fallback as a single material recipe. Glass is a layer behavior, not a color.

## Motion tokens
Define durations, easing and springs by semantic role:
- instant-feedback
- micro
- reveal
- overlay
- navigation
- spatial
- expressive

Project overrides may replace aesthetics but should preserve semantic roles.