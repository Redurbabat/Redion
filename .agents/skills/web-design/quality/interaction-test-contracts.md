# Interaction Test Contracts

Tests should protect user-observable behavior rather than freeze incidental markup.

Prefer contracts such as:
- the target action remains reachable
- the current destination is conveyed
- a 390px layout does not overflow
- focus returns after closing a popover
- reduced motion removes the intended movement
- annotations appear in exported/printed output
- a drag reaches the same semantic destination across supported inputs

Avoid tests whose only purpose is preserving an old class name, exact internal DOM nesting or obsolete navigation path.

When a redesign changes the route to an outcome, update the test while preserving the behavioral guarantee. Add measurement when visual geometry is the actual requirement.