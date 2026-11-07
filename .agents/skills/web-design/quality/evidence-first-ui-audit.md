# Evidence-First UI Audit

Never infer a UI gap from a class name, stale task list, screenshot alone, or remembered architecture.

## Audit order
1. Inspect the current implementation and active responsive/platform branch.
2. Verify which component actually renders in the target context.
3. Measure the rendered result at representative sizes/input modes.
4. Distinguish missing behavior from hidden, duplicated, dead or unreachable behavior.
5. Check existing tests and project decisions before proposing a replacement.
6. Only then classify: present, partial, missing, conflicting, dead, or intentionally absent.

A fixed value is not automatically a bug. Determine whether that rule is active at the target viewport and measure its proportion/effect.

When an existing component solves the same semantic job, extend it rather than creating a parallel implementation.