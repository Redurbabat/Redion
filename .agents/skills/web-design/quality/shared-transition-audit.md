# Shared Transition Audit

Audit transitions between nearby or related UI states for spatial continuity.

Ask:
- Is the same conceptual object destroyed and recreated visually?
- Could one shared highlight/surface preserve identity?
- Does state move between adjacent controls with an unnecessary hard cut?
- Are source and destination genuinely related, or would morphing mislead?
- Does animation survive rapid reversal?
- Are hit targets and semantic state correct during motion?
- Is there a reduced-motion path?

Prioritize shared transitions for high-frequency mode changes, tool settings, tabs/segments and compact-to-expanded surfaces.

Do not require morphing everywhere. Hard cuts are correct when context changes abruptly or continuity would imply a relationship that does not exist.