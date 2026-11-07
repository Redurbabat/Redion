# Responsive Fixed-Value Audit

Raw pixel values require context, not automatic replacement.

## Inspect
For every suspicious fixed width/height/min-size:
- Is the rule active at this viewport?
- Is it a touch target, content measure, icon size, column allocation or arbitrary legacy value?
- What percentage of available space does it consume?
- Does text truncate ambiguously?
- Does a mobile/tablet override already replace it?

Touch-target constants should route through semantic tokens such as touch-min where practical. Layout constants may remain fixed when measured behavior is stable.

Test actual compositions at compact, medium and wide widths. Split-view/tablet windows matter as much as named devices.