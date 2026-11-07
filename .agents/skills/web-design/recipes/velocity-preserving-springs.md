# Velocity-Preserving Springs

For directly manipulated or rapidly retargeted UI, spring transitions should inherit current motion rather than restart from zero velocity.

Use for moving selection material, docks, palettes, drag release and shared surfaces.

Tune by role: productivity controls use restrained overshoot; expressive/creative surfaces may use more character. Distance can influence settling behavior, but avoid dramatically different feel between neighboring targets.

Do not expose raw stiffness/damping numbers as universal design truth. Define perceptual goals first: responsive pickup, controlled overshoot, quick settling, stable text.

Respect reduced motion and performance constraints.