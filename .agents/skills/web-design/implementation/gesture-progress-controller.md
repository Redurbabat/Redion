# Gesture Progress Controller

Represent interactive transitions with a small explicit controller rather than scattered event callbacks.

Useful state:
idle -> tracking -> settling-to-commit / settling-to-cancel -> idle.

The controller owns current progress, velocity, target and interruption. Rendering reads this state; business/navigation state commits at the defined boundary.

New valid input may interrupt settling and continue from the current rendered state. Avoid duplicated timers and animation-completion callbacks that can race.

Clamp semantic progress even if visual overscroll/rubber-band presentation temporarily exceeds the range.

Keep this architecture framework-neutral; map it to the runtime's animation primitives.