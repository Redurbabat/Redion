# Gesture Conflict Audit

Audit every drag/swipe interaction against other gestures available in the same region.

Check:
- vertical scroll vs horizontal paging;
- canvas pan vs object drag;
- stylus drawing vs navigation/sheet gestures;
- selection vs text scrolling;
- pinch zoom vs two-finger pan;
- OS/browser edge navigation vs app gestures;
- nested scroll containers vs draggable sheets.

Test start positions near boundaries, diagonal motion, slow/fast input, cancellation, additional pointers and modality changes.

A gesture is not complete UX if users can enter it accidentally and cannot recover predictably.