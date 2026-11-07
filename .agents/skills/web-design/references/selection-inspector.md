# Selection and Inspector

An inspector should reflect the current semantic selection, not merely the last clicked DOM element.

## Selection states
none -> document/workspace properties
single -> properties/actions for one object
multi -> shared editable properties plus aggregate information
mixed values -> explicit mixed/indeterminate state

Do not show controls that appear applicable when the selected objects cannot support them. Bulk edits must state scope.

Keep selection visible on the work surface while the inspector is open. Inspector changes should update the selection directly and participate in undo where appropriate.

On small screens, an inspector may become a sheet or contextual palette while preserving the same selection model.