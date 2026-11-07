# Interactive Back Transition

When platform/product conventions support it, Back may be a reversible spatial gesture whose progress previews the destination.

The outgoing surface follows the gesture while the previous context becomes progressively visible. Do not navigate until commit; cancellation restores the current surface without rebuilding it.

Preserve prior scroll, selection and relevant focus/context. Deep links and explicit Back controls must work without the gesture.

Use edge gestures only where they do not conflict with OS/browser gestures. Never hijack reserved system navigation zones.

On release, use progress plus velocity to commit/cancel. Reduced motion uses a simpler reversible reveal or normal navigation.