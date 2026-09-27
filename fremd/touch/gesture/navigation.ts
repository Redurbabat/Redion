import { rubberband } from './rubberband'

/**
 * Large title → small title: 0 while the large title is fully visible,
 * 1 once it has scrolled under the bar. The range is capped by what the
 * page can actually scroll, so short pages still collapse completely
 * (Framework7 navbar pitfall, see HERKUNFT.md).
 */
export function collapseProgress(scrollTop: number, range: number, maxScroll = Infinity): number {
  const effective = Math.max(1, Math.min(range, maxScroll))
  return Math.min(1, Math.max(0, scrollTop / effective))
}

/** Pulling past the top grows the large title slightly (anchored left), up to +12 %. */
export function largeTitleScale(scrollTop: number): number {
  if (scrollTop >= 0) return 1
  return 1 + (rubberband(-scrollTop, 200, 0.55) / 200) * 0.12
}

/**
 * When scrolling stops half-way through the collapse, finish it:
 * returns the scroll position to go to, or null if nothing to do.
 */
export function snapCollapse(scrollTop: number, range: number): number | null {
  if (scrollTop <= 0 || scrollTop >= range) return null
  return scrollTop < range / 2 ? 0 : range
}

/**
 * Horizontal stretch of a moving material (tab-bar lens) from its speed in
 * px/s: fast travel reads as liquid being pulled along. 1 at rest, max 1.4.
 */
export function materialStretch(velocity: number): number {
  return 1 + Math.min(0.4, Math.abs(velocity) / 5000)
}
