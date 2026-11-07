# CSS Dead-Rule and Override Audit

Treat unused selectors and fully overridden legacy rules as maintenance evidence, not automatic deletion targets.

## Classify
- truly dead selector
- JavaScript/query hook with no visual rule intended
- generated/prefixed selector
- responsive/platform-only selector
- legacy rule fully overridden by newer layer
- future/feature-gated selector

Confirm with source search plus rendered coverage before removal. A class without CSS is not necessarily a defect; it may be a semantic/query hook. A CSS rule never matched in supported flows is a stronger removal candidate.

When a new design layer fully replaces old styling, consolidate deliberately so future edits do not target inert rules. Preserve compatibility only where it has a documented consumer.