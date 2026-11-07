# Dock and Tab Material Flow

For a dock/tab family, selection should read as one state moving through a stable set rather than independent buttons flashing on/off.

Use one persistent indicator/material layer. Keep item positions and hit targets stable. The indicator may translate, resize and adapt edge radii as targets differ.

Hover is preview, selection is committed state. When hover magnification exists, indicator geometry must follow the final rendered target without causing feedback loops or layout jitter.

Rapid navigation retargets the current motion and preserves velocity. Never queue a sequence of obsolete destinations.

For mobile bottom navigation, avoid excessive liquid distortion; labels/icons must remain legible throughout. Reduced motion relocates the indicator immediately.