# Table Scale Strategy

Choose table behavior from realistic row/column volume and user tasks.

Small datasets can render normally. Larger datasets may need pagination, incremental loading or virtualization. The choice affects selection, keyboard navigation, bulk actions, sorting, filtering and export.

Sorting/filtering must declare whether they apply to the loaded page, loaded subset or full dataset. “Select all” must state its scope.

Keep headers and key identifiers available when useful, but avoid excessive sticky layers that consume the viewport.

Loading more data must preserve current selection and scroll context. Export may operate on a larger dataset than the rendered viewport; communicate that explicitly.