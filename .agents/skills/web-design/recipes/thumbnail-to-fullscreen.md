# Thumbnail to Fullscreen Transition

Opening the same image/page/media object from a thumbnail can preserve its visual identity into preview/fullscreen.

Start from the thumbnail's rendered bounds and aspect ratio. Transition toward the destination while preserving content fit intentionally; do not visibly stretch the asset to a wrong aspect ratio.

Chrome may fade/recede around the expanding content. On close, return toward the source only if that source still exists and is visible; otherwise close locally.

For paged documents, preserve page identity and current page index. Virtualized/offscreen thumbnails require a fallback transition.

Reduced motion performs immediate open/close or a short fade.