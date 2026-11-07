# Spring Profiles

Use named motion behaviors rather than one universal spring.

## Profiles
- **snappy-control** — buttons, toggles, compact selection. Fast settling, almost no overshoot.
- **spatial-panel** — sheets, drawers, inspectors. Controlled mass, soft arrival, little/no bounce.
- **direct-snap** — dragged/reordered objects. Preserve release velocity, then settle decisively.
- **dock-proximity** — reversible pointer proximity response. Immediate tracking, smooth neighbor falloff.
- **expressive-object** — showcase/creative objects only. Moderate overshoot is allowed when brand-appropriate.

## Rules
Springs are behavioral specifications, not fixed cross-framework constants. Map them to the target runtime's spring model. Preserve velocity when an interaction hands off from gesture to animation. Never make common actions wait for decorative oscillation.

If the platform/runtime cannot produce stable springs, use a short easing fallback with the same perceived intent.

Reduced motion: remove overshoot and large travel; preserve state feedback.