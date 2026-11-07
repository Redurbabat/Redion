# Drag and Drop

Use drag/drop when spatial manipulation is natural: reorder, move between containers, place on canvas, upload files.

## Required states
draggable affordance when needed, picked-up state, valid target, invalid target, insertion indicator, drop confirmation, cancellation.

Do not require drag for essential operations. Provide keyboard/menu alternatives. Auto-scroll near edges when long containers need it, but keep speed controllable.

For touch, distinguish scrolling from dragging using handles or appropriate press/gesture thresholds. Preserve direct tracking and animate only the settling/snap phase.