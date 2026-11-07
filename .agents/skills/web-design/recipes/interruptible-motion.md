# Interruptible Motion

Interactive motion must remain correct when the user acts again before an animation finishes.

## Core rule
The newest valid user intent wins. Do not queue stale UI transitions.

On retarget:
- sample the current visual state;
- preserve useful velocity where it improves continuity;
- retarget toward the new destination;
- update semantic state immediately;
- cancel obsolete callbacks/effects.

Reversal should feel continuous rather than restarting from the original endpoint.

Test rapid A-B-A-B input, repeated keyboard arrows, pointer scrubbing, resize/theme changes during motion and close-before-open-finishes.

Animation completion must never be required for data correctness, focus safety or command execution.