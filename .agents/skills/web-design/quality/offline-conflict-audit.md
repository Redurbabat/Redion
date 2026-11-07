# Offline and Conflict Audit

Test state transitions, not only static offline screens.

Cover:
online -> edit -> offline -> edit -> refresh -> reconnect;
offline launch with cached data;
remote change while local edits are pending;
retry after transport failure;
permission revoked during pending work;
conflict resolution followed by another edit.

Verify no work silently disappears, duplicate writes are not created, local vs remote durability is truthful, and recovery remains possible.

Network simulation alone is not enough when persistence, service workers or native shells change behavior; validate representative real environments too.