# Favorites, Recents and Usage History

Favorites and recents are different concepts.

Favorites are explicit user choices. Recents are ordered by actual recent use. Frequency is neither of those.

## Rules
Use stable item identifiers, not display titles, for persistence. Rename must not orphan history. Bound retained history and define reset/expiry behavior.

If usage statistics drive ordering, count the action regardless of invocation path where practical: palette, keyboard shortcut, menu or direct control should represent the same semantic command.

Avoid multiple disconnected favorite stores when the product promises a unified favorites concept. Separate stores are valid when the entities and user expectations are genuinely different.