# Spatial Continuity Audit

Review high-frequency state changes and navigation for unnecessary visual discontinuity.

Inspect:
- adjacent selection changes;
- trigger -> popover/palette;
- compact -> expanded control;
- card/list item -> same-entity detail;
- dock/tab selection;
- selection -> contextual toolbar.

For each, ask whether source and destination represent the same object/state relationship. If yes, consider shared geometry/material continuity. If no, keep a clean cut/fade.

Reject transitions that move hit targets, misrepresent semantic state, queue under rapid input, depend on hover, obscure focus, or fail reduced motion.

Spatial continuity is a comprehension tool, not a requirement to animate every neighboring element.