# Action Deduplication Across Chrome

The same global action should not appear repeatedly in adjacent persistent chrome without a reason.

## Audit
Map every visible action to scope:
- global
- destination
- document/workspace
- selection/context
- temporary mode

If two adjacent surfaces expose the same action, choose the surface whose scope and persistence match it. Duplication is acceptable when one surface disappears on a platform/mode or when reachability would otherwise be lost.

When a drawer/tool ribbon opens, reassess duplicate Search, AI, Account, Save, Share and similar global controls. Do not solve duplication by hiding the only mobile path.

Prefer one authoritative action definition rendered in different platform containers.