# Interaction Performance Budget

High-craft UI must remain responsive.

## Priorities
1. input latency
2. stable frame pacing
3. visual fidelity
4. decorative complexity

Avoid repeated layout reads/writes inside pointer loops. Batch work with requestAnimationFrame where needed. Prefer compositor-friendly properties. Limit large backdrop-filter regions, layered shadows, masks and continuously animated filters.

Heavy 3D/video/canvas work should be lazy, pausable and quality-adaptive. Test representative low/mid devices, not only flagship hardware.

When performance conflicts with decoration, remove decoration first.