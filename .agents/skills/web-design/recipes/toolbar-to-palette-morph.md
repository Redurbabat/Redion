# Toolbar to Palette Morph

A compact tool control may expand into a contextual palette while remaining recognizably the same interaction object.

Useful for drawing tools, color controls, formatting controls and inspectors.

Keep the active tool anchored. Expand controls toward available viewport space; do not cover the user's immediate work point when another direction is viable. Tool identity stays selected while settings become visible.

The palette may inherit material/radius/elevation from the trigger, then resolve into its destination geometry. Secondary controls reveal after or during expansion with restrained staggering.

Closing should collapse toward the originating tool when it still exists. If the trigger moved/offscreen, close locally instead of animating to stale geometry.

Touch/stylus palettes need larger targets and must avoid hand/pen occlusion. Keyboard focus order follows the visible controls. Reduced motion removes geometric travel.