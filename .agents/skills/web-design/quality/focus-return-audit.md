# Focus Return Audit

Temporary UI must return keyboard focus intentionally.

For menus, popovers, drawers, command palettes and modal tools:
- capture the logical invoker
- move focus only when the opened surface requires it
- trap focus only for truly modal UI
- Escape closes when conventional and safe
- closing returns focus to the invoker or the nearest valid successor
- deleting the invoker requires an explicit fallback
- route/navigation changes place focus according to the new context, not stale DOM

Test open/close cycles repeatedly with keyboard only. Visual disappearance is not completion if focus is lost to document body.