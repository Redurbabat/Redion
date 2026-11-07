# Design Token Drift Audit

A token system fails when raw values keep multiplying outside it.

## Audit
Count recurring raw values for spacing, typography, target size, radius, color, duration and elevation. Identify values that represent the same semantic role but differ accidentally.

Do not replace every literal mechanically. Promote a value to a token when it is repeated, semantically meaningful, expected to change together, or platform/theme dependent.

Particularly useful tokens include touch-min, compact-control-height, content-measure, panel-gap, motion-fast, motion-normal and material recipes.

Set regression budgets where useful: new raw values should require justification rather than silently increasing forever.