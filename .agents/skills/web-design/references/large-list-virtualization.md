# Large Lists and Virtualization

Virtualize only when realistic content volume warrants it. Virtualization is a performance technique, not a default layout style.

Preserve semantic identity by stable item keys. Scroll position, keyboard navigation, selection and focus must survive recycling.

## Interaction
Offscreen items may not have DOM geometry. Shared transitions, drag targets, find-in-list and accessibility logic need explicit fallbacks.

Do not make screen-reader navigation depend on an arbitrary rendered window without exposing meaningful collection semantics.

Variable-height content requires measured/cached sizing or a strategy that avoids scroll jumps.

Lazy-load expensive media independently from row virtualization where useful. Test with realistic worst-case content, not empty placeholder rows.