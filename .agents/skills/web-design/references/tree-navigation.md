# Tree Navigation

Use a tree for real hierarchy, not a flat menu with indentation.

## Semantics
Use appropriate tree/treeitem/group semantics where applicable. Exactly one logical keyboard focus entry is preferred for dense desktop trees.

## Keyboard
Support Arrow Up/Down between visible items; Right to expand or enter children; Left to collapse or return to parent; Home/End when useful. Enter/Space behavior must be consistent with selection/activation semantics.

## State
Persist expansion when useful. Selection, focus, hover and expanded state are distinct. Do not encode them only by color.

## Responsive
A desktop tree may become drill-down navigation or a sheet on narrow touch layouts. Do not squeeze a full hierarchy into an unusably narrow sidebar.