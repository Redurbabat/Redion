# Trigger to Popover Morph

When a control opens settings or choices that directly belong to that control, the opening transition can preserve the trigger's spatial identity.

Examples: pen -> pen settings, filter -> filter panel, format button -> format palette.

## Transition
Anchor the destination to the trigger. The source surface may expand/morph into the popover while destination content reveals locally. Preserve a clear origin and reverse the motion on close when geometry still permits.

Do not morph if the destination is unrelated, remote, modal, or substantially changes task context.

## Interaction truth
Open state becomes true immediately. Focus moves according to popover semantics. Outside-click/Escape behavior is not delayed by animation. Hit testing belongs to the real destination, never a decorative transition clone.

Retarget/reopen without queued animations. Reduced motion uses immediate placement plus optional short fade.