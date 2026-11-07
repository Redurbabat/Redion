# Content Aggregation and Collection Hygiene

Collections should expose meaningful entities, not internal storage fragments.

Before listing records, define the user-facing unit: document, file, page, note, block, attachment, project, etc. Storage-level children should not automatically become peer items.

## Rules
- aggregate internal fragments under their parent when that matches the mental model
- deduplicate equivalent entities
- provide type/metadata only when it helps distinguish items
- cap or virtualize large result sets
- preserve a route to detailed/internal content without flooding the primary collection
- test imported/synced content whose internal representation differs from native content

A collection named “Files & PDFs” should not silently become a list of every text block merely because blocks share the same backing store.