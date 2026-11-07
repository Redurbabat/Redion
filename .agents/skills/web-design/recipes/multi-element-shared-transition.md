# Multi-Element Shared Transition

When a source surface becomes a richer destination, animate only the few elements that preserve identity: container, image/thumbnail, title, avatar/icon, or selected object.

## Choreography
Establish one dominant spatial path. Secondary shared elements follow compatible timing; destination-only content reveals locally after enough geometry is established. Avoid making every child fly independently.

Keep z-order explicit so shared elements do not pass implausibly through headers, sheets or neighboring cards. Occluded elements may fade rather than violate depth.

Rapid interruption, Back navigation, resize and missing source/destination geometry must degrade safely to a simpler transition.

Reduced motion uses ordinary navigation with minimal opacity continuity.