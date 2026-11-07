# Transition Z-Order and Occlusion

Shared transitions need a temporary depth model.

Define which moving elements pass above or below persistent chrome, sheets, toolbars, masks and destination surfaces. A transition clone placed above everything can look physically wrong and may expose content that should be clipped.

Use clipping/masks when an object conceptually enters a container. Fade elements when a plausible depth path cannot be maintained.

Visual transition layers must not become interactive or accessible duplicates. Remove them deterministically after completion/cancel.