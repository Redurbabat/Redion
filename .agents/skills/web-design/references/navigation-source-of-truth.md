# Navigation and Shortcut Source of Truth

Visible navigation, command palettes and shortcut labels should derive from authoritative registries when the product already has them.

Do not manually duplicate shortcut strings or destination metadata across markup and command definitions. Drift creates controls that display shortcuts which do not execute.

A navigation/command entry should have a stable identifier plus semantic metadata such as label, destination/action, icon, shortcut and primary-placement eligibility. Platform-specific presentation may select from that registry without copying the meaning.

Phone and desktop can present different subsets, but selection should be deliberate and data-driven rather than unrelated hardcoded lists.