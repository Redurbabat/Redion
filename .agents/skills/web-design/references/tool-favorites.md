# Tool Favorites and Presets

Tool favorites are explicit reusable configurations, not merely recent tools.

## Model
Persist a stable tool identifier plus the parameters that define the preset: e.g. pen type, width, opacity, color and optional behavior. Display names are presentation, not identity.

## Interaction
Keep a small high-value favorite set close to the work surface. Activating a favorite applies the full configuration atomically. Editing a favorite must not silently mutate unrelated presets.

Recents and favorites remain distinct. A frequently used tool may be suggested, but should not become a favorite without user intent.

Desktop can expose favorites in a dock/toolbar; tablet may use a floating palette; phone may use a compact sheet. Preserve equivalent access across input modes.