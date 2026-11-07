# Gesture-Driven Transitions

Interactive transitions can be driven directly by a continuous gesture instead of starting only after release.

Use for reversible spatial actions: sheet expansion, page back/forward, panel reveal, carousel paging, split-view resizing and low-cost mode changes.

## Model
Map gesture progress to visual progress continuously. Keep semantic commit separate from preview progress.

Track:
- normalized progress;
- direction;
- velocity;
- cancellation/commit threshold;
- available travel distance;
- current interruption state.

Do not use a fixed distance when viewport/container geometry determines the real travel.

## Release
On release, combine position and velocity to choose a valid destination. Then settle with a restrained spring from the current visual state and current velocity.

Never snap back to the gesture origin before starting the release animation.

## Safety
Irreversible/destructive commands do not commit merely because a drag crossed a visual threshold. Navigation gestures must preserve an accessible non-gesture path.

Reduced motion can keep direct manipulation while removing inertial/elastic settling.