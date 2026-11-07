# Save and Sync Conflict Resolution

A conflict is not a generic error. It means two valid histories can no longer be applied automatically without a policy or user decision.

## States
Distinguish local unsynced work, remote changes, automatically merged state, unresolved conflict, retryable transport failure and permission/read-only failure.

## UX
Preserve both versions until resolution is durable. Explain what differs and what the choice affects. Prefer field/block/object-level comparison when the data model supports it; avoid forcing users to compare entire documents for one changed property.

Offer safe choices such as keep local, keep remote, merge, duplicate/copy, or inspect differences only when those operations are real.

Never label a transport failure as a content conflict.

After resolution, make the resulting state and remaining sync work explicit.