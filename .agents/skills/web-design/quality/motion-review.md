# Motion Review Gate

For every meaningful animation verify:
1. Purpose: feedback, continuity, hierarchy, orientation or expression?
2. Trigger: user action, state change, scroll, system event?
3. Interruptibility: can rapid/reversed input leave it in a bad state?
4. Timing: proportional to distance/importance?
5. Physics: does spring/velocity make sense or is it decorative?
6. Performance: transform/opacity where possible; no avoidable layout thrash.
7. Accessibility: reduced-motion/reduced-transparency path.
8. Modality: pointer, touch, stylus and keyboard remain usable.
9. Exit: dismissal feels causally related to entry.
10. Restraint: remove motion that adds no information or character.

For expressive/3D motion additionally verify battery/GPU cost, frame stability, text legibility and non-spatial fallback.