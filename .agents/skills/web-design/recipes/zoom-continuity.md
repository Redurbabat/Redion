# Zoom Continuity

Zoom transitions should preserve the user's spatial anchor.

For document/canvas/image zoom, scale around the focal point, cursor, gesture centroid or explicitly chosen anchor rather than always around the viewport center.

Pinch zoom follows the gesture continuously. Button/keyboard zoom can use a short transition when it does not harm precision.

Keep overlays, selections and annotations in the same coordinate model so they do not drift relative to content.

Avoid decorative zoom when opening unrelated pages. Reduced motion may remove animated settling while retaining direct pinch behavior.