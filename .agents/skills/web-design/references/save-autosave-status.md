# Save and Autosave Status

Saving UI should describe durable state truthfully without becoming persistent noise.

Useful states can include: editing/dirty, saving, saved, offline-local, sync pending, conflict, failed, read-only.

## Rules
- Do not flash “Saved” after every keystroke.
- Show progress only when latency is perceptible or consequential.
- A local write is not the same as remote sync.
- Never report success before the relevant durability boundary is reached.
- Failed save/sync needs recovery and preservation of user work.
- Closing/navigation guards depend on actual risk of data loss, not a generic dirty flag.

Autosave should preserve flow. Manual Save can remain when users need explicit checkpoints, exports, commits or regulated confirmation.