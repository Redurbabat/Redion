# Multi-Selection Choreography

Selection feedback should scale from one object to many without producing visual noise.

Single selection may show full handles/inspector affordances. As selection grows, emphasize the collective bounds and shared actions; avoid rendering heavyweight controls on every item.

When adding/removing items, update the aggregate selection boundary continuously where useful. Do not animate every selected object independently.

Bulk operations should communicate their scope before destructive changes. Undo should treat one intentional bulk operation as one coherent transaction.

Keyboard and non-pointer paths must support extending/reducing selection where the product requires it.