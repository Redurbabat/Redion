# Scrollable Tool Strips

Dense horizontal toolbars on narrow screens should remain one coherent strip instead of forcing the whole app wider.

## Rules
- Keep hit targets stable while allowing the strip itself to scroll.
- Ensure first/last controls can scroll fully into view.
- Do not clip focus rings, active halos, magnification or popovers at the scroll edge.
- Active tools should be programmatically scrolled into view when selection changes.
- Wheel/trackpad, touch swipe and keyboard navigation should coexist.
- Use edge fades or other restrained overflow cues when discoverability needs help.

Magnification or hover scaling must not change the logical hit target or cause horizontal layout jumps.