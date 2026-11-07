# Icon Size vs Hit Target

Visual icon size and interactive target size are independent design variables.

A compact icon can live inside a larger touch target; increasing font-size or SVG dimensions must not be the mechanism that creates accessibility target size.

## Rules
Define semantic control size and icon size separately. Preserve target geometry across hover/active animation. Optical icon sizing may vary by glyph while alignment remains stable.

For dense touch-capable toolbars, a target around platform-recommended touch dimensions can contain a substantially smaller visual icon. Test actual recognition: icons that are technically present but visually too small still fail usability.

Avoid text glyphs as pseudo-icons when a coherent icon system exists, unless the character itself is semantically meaningful.