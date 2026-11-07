# Search Results Pattern

Search must expose query state, progress, results, no-results and error states.

Rank only from legitimate signals; never invent personalization. Show filters/facets when users need to narrow large result sets. Preserve query/filter state when opening and returning from a result.

Highlight matching context carefully without destroying readability. Empty results should offer recovery: spelling, filter reset, broader query or alternate navigation.

For command execution, use the command-palette pattern rather than disguising actions as search results.