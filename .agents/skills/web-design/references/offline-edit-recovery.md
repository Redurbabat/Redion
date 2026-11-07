# Offline Edit Recovery

Offline-capable products should let users understand what is safe locally and what still depends on connectivity.

Local edits may continue when the data model supports it. Mark sync status without blocking the work surface. Queue remote work explicitly and retry safely.

On reconnect:
- preserve local edits;
- reconcile against remote state;
- surface genuine conflicts;
- avoid duplicate operations from retries;
- communicate only meaningful status changes.

Do not use “Saved” to imply remote durability when only local persistence succeeded.

Recovery after refresh/crash should restore the latest durable local state and explain any remaining unsynced work.