# Loading and Progress Recipes

Choose feedback from expected duration and certainty.

- near-instant operations: avoid spinner flicker
- short indeterminate wait: compact progress indicator
- content-shaped fetch: skeleton only when it meaningfully predicts layout
- determinate task: progress bar/ring with real progress
- long/background task: persistent status plus ability to leave when possible

Never fake percentage progress as factual. Avoid decorative loaders that consume attention in productivity workflows.

Preserve layout to prevent jumps. Keep existing content visible during refresh when safe, using stale/loading state rather than blanking the screen.

Success animation should be proportional: subtle check/state transition for routine actions; stronger celebration only for genuinely meaningful milestones.

Reduced motion: static/progress-state alternatives remain clear.