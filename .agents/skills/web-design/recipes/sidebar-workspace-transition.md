# Sidebar to Workspace Transition

Navigation selection and workspace change should coordinate without making the entire application move.

Keep persistent shell/navigation stable. Move the selection indicator within navigation while the workspace changes with a restrained local transition.

If the destination represents the same object selected in a sidebar/tree, shared title/icon identity can bridge into the workspace header. Do not animate unrelated page content from the sidebar.

Preserve sidebar scroll, expansion and selection state. Keyboard focus follows navigation semantics.

On narrow layouts where the sidebar becomes a sheet, close/reveal choreography should preserve destination context without delaying navigation truth.