# React Motion Architecture

Animation state should derive from product state, not fight it.

Use the project's existing motion library before adding another. Keep transient pointer/gesture values out of high-frequency React rerender paths when possible. Motion values/refs or platform animation primitives are preferable for frame-by-frame interaction.

Presence animations must handle rapid mount/unmount and route changes. Shared-layout IDs require stable semantic identity. Avoid animating huge component trees because one parent toggled.

Respect reduced motion centrally. Do not couple business logic completion to decorative animation completion.