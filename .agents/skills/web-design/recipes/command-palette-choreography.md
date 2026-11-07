# Command Palette Choreography

A command palette is a fast transient work surface. Its motion should reinforce invocation and result changes without slowing keyboard use.

Open with a short local reveal/scale/fade from its stable anchor. Autofocus the query immediately. Do not wait for entrance animation before accepting typing.

As results change, preserve the active row when still valid. Avoid animating every ranking change with large movement; use restrained insertion/removal only when it improves tracking.

Command execution closes or transforms the palette according to outcome. Nested command flows should preserve context and Back/Escape behavior.

Reduced motion opens/closes immediately or with a minimal fade.