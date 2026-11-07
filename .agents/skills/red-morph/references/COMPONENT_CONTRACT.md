# RED Morph — component specification template

For each component document:
1. Name, purpose, supported runtime/OS, current production or experimental status.
2. API: props/bindings, actions, state owner, cancellation, disabled/loading/error/empty states.
3. Motion: trigger → source → target → duration/spring → interruption → final state.
4. Visual: semantic tokens, light/dark, high contrast, reduced transparency, typography.
5. Inputs: touch, pointer, keyboard, VoiceOver, focus return, gesture conflicts.
6. Data: real model binding, no simulated success, offline behavior, recovery.
7. QA: 360/390/430/1280 px or device equivalents, keyboard open, reduced motion, dynamic type, performance.
8. Reuse: stable export/import, migration, sample usage and at least one integration test.

Recommended initial reusable primitives:
- REDMorphGlassSurface: constrained floating chrome, opaque fallback.
- REDMorphTransitionCard: card-to-detail continuity and reduced-motion fade.
- REDMorphFluidSheet: gesture-driven sheet with visible dismiss affordance.
- REDMorphAdaptiveDock: phone dock, tablet/desktop adaptive navigation.
- REDMorphActionControl: tactile press, loading/error/disabled and focus.
- REDMorphContextPalette: transforms from selection, preserves keyboard navigation.
- REDMorphProgressState: real asynchronous progress and cancellation.
- REDMorphMediaArtwork: artwork-aware color without text contrast loss.

Do not mark a component production-ready until its native/web implementation and tests are verified in the target runtime.
