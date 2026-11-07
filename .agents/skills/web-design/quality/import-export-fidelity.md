# Import and Export Fidelity

A successful parse/write is not proof of faithful document handling.

## Import
Test semantic content, ordering, geometry, hidden/revealed states, images/media, rotations, links, annotations and unsupported constructs. If fidelity is partial, communicate the limitation.

## Export
Verify the generated artifact in independent consumers where feasible. Preserve required annotations, print flags, page geometry, text/image content and metadata according to the product contract.

Never silently flatten or omit meaningful user content unless the export mode explicitly says so.

Round-trip tests are useful but insufficient when both importer and exporter share the same wrong assumption.