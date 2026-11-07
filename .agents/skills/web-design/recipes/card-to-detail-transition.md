# Card to Detail Shared Transition

When a card/list item opens the same entity in a detail surface, preserve entity identity across navigation.

Shared candidates: thumbnail, title, key icon/avatar and container geometry. Do not force every card field into a shared animation.

The detail destination owns the final layout immediately; transition layers only provide continuity. Preserve scroll/origin so Back can return to the same item and viewport.

Use for gallery, document library, product/project browsers and media collections. Avoid when navigation changes to a different conceptual object or when virtualization makes source geometry unreliable.

Deep links must work without the transition. Reduced motion performs normal navigation without spatial travel.