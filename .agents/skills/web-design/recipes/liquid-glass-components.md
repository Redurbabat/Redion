# Liquid-Glass Component Recipes

These recipes create high-quality translucent functional chrome without copying a platform literally.

## Floating toolbar
Use a translucent material only when content beneath should remain spatially present. Combine moderate blur/saturation, restrained tint, fine edge highlight, compact shadow and strong foreground contrast. Keep geometry stable while interacting.

## Glass button
Use for a high-value floating action or control group. Hover may slightly increase edge/specular definition; press should compress subtly and immediately. Selected state must remain visible without depending on refraction.

## Glass popover
Increase opacity relative to tiny floating controls because reading/settings require stability. Anchor clearly to the invoking control. Animate from anchor with short scale/translation plus opacity.

## Glass dock
Use one coherent material container. Items should not each become separate glass bubbles unless grouping requires it.

## Adaptive fallback
When blur/transparency is unavailable, expensive, reduced, or harms contrast, switch to an opaque/elevated semantic surface. The component must remain equally usable.

Do not use glass for long-form reading, dense tables, every card, or behind critical low-contrast text.