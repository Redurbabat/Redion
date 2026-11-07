# Web Animations API

Use WAAPI when animations need programmatic playback, reversal, interruption, sequencing or direct control beyond CSS transitions.

Keep references to active animations so new input can cancel, reverse or continue from current visual state. Prefer transform/opacity. Commit final state deliberately and clean up finished/cancelled animations.

For gesture handoff, derive duration/target from current state and velocity where appropriate. Reduced-motion paths should skip or simplify travel rather than merely speed everything up.