# Idle Motion Audit

Productivity interfaces should not consume attention or resources with unrelated perpetual animation.

Inspect the interface after all transitions settle. Identify animations that continue without user input, active processing, media playback or meaningful live status.

Continuous motion is justified only when it communicates a live condition or is central to the experience. Decorative shimmer, rotating gradients, particles and pulsing chrome should normally stop at rest.

Reduced-motion must remove nonessential continuous motion. Also measure CPU/GPU cost and battery implications for long-lived screens.

A good default for work surfaces: after state settles, no animation remains running unless something is actually happening.