# Transition Fallback Audit

Every advanced shared transition needs a valid fallback.

Test:
- source is offscreen or virtualized;
- destination is not measured yet;
- viewport resizes/rotates mid-transition;
- user navigates again immediately;
- Back occurs before completion;
- reduced motion/transparency is enabled;
- low-performance mode disables effects;
- image/font/content loads late.

Fallback should preserve correct navigation, focus, selection and content. A missing animation is acceptable; broken state is not.