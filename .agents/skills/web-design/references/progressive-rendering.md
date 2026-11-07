# Progressive Rendering

Large or expensive workspaces should prioritize useful content before secondary detail.

Render the shell and primary actionable content first. Defer expensive previews, thumbnails, charts, offscreen pages or metadata when doing so does not change task correctness.

Use stable placeholders only when geometry is known enough to prevent layout shift. Lazy content must not reorder controls or steal focus when it arrives.

Search/filter results should expose whether results are partial when loading continues.

Progressive rendering and virtualization solve different problems: progressive rendering stages work; virtualization limits simultaneously rendered collection content.