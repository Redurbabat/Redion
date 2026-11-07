# Selection to Inspector Continuity

When selecting an object causes contextual controls or an inspector to appear, preserve the relationship between selection and controls without making the inspector look detached.

Use a restrained reveal anchored to the selected context: selection handles establish state first, then contextual controls appear from the nearest appropriate edge/anchor. A persistent side inspector may update content in place rather than repeatedly opening/closing.

For multi-selection, transition from object-specific controls to shared/aggregate controls. Mixed values must remain explicit.

Do not fly an inspector across the canvas from the selected object. Spatial continuity should explain ownership, not create spectacle.

Reduced motion uses immediate contextual state changes.