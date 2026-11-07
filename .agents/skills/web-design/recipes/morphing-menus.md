# Morphing Menus and Palettes

Use when a control expands into settings/actions that belong directly to that control.

## Sequence
1. Control activates immediately.
2. Secondary invocation or explicit affordance expands its container.
3. Preserve anchor position/identity.
4. Reveal additional controls after or during geometry expansion.
5. Dismiss toward the source when practical.

Good cases: active pen -> pen settings, compact search -> search panel, player control -> expanded controls.

Do not morph unrelated content. Avoid large text distortion; crossfade detailed labels while the container morphs. Maintain focus logically when expanding/collapsing.

Rapid reopen/reclose must continue from the current animated state rather than restart from endpoints.