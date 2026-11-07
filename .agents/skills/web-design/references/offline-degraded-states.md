# Offline and Degraded States

Network-dependent surfaces must distinguish loading from unavailable/offline.

## States
unknown/checking, loading, online-ready, offline-with-cache, offline-without-cache, service-error, permission/auth blocked, stale data.

Do not leave a permanent blank/gray placeholder when the system knows content cannot load. Explain what remains usable and how to recover.

navigator.onLine or equivalent is a hint, not proof that a remote service is reachable. Combine platform signal with actual request outcomes when correctness matters.

Preserve cached/local work where possible. Sync state must not claim “up to date” while work is still running or blocked.