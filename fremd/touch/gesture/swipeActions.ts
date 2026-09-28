import { rubberband } from './rubberband'

/**
 * Swipe actions on a list row. All distances are measured in the OPENING
 * direction (positive = more of the actions visible), so the same maths
 * serves leading and trailing actions.
 */
export interface SwipeGeometry {
  /** Total width of the revealed action buttons. */
  actionsWidth: number
  rowWidth: number
  /** Allow a long swipe to run the first action directly (e.g. delete). */
  fullSwipe?: boolean | undefined
}

/** Maps the raw finger distance to the row offset. */
export function swipeDistance(raw: number, { actionsWidth, rowWidth, fullSwipe = false }: SwipeGeometry): number {
  if (raw <= 0) return 0
  if (raw <= actionsWidth) return raw
  if (fullSwipe) return Math.min(raw, rowWidth)
  return actionsWidth + rubberband(raw - actionsWidth, rowWidth)
}

/**
 * How far action `index` is revealed (0…1). `widths` are ordered from the
 * outer edge inwards: the outermost action is uncovered first, so the
 * buttons pop in one after another (Framework7 iOS swipeout idea).
 */
export function revealProgress(distance: number, widths: number[], index: number): number {
  const width = widths[index]
  if (width === undefined || !(width > 0)) return 0
  const start = widths.slice(0, index).reduce((sum, w) => sum + w, 0)
  return Math.min(1, Math.max(0, (distance - start) / width))
}

/** Fraction of the row width after which a full swipe commits. */
export const FULL_SWIPE_RATIO = 0.6
/** Speed (px/s) above which the flick direction decides. */
export const SWIPE_FLICK_VELOCITY = 300

export function resolveSwipeRelease({
  distance,
  velocity,
  actionsWidth,
  rowWidth,
  fullSwipe = false,
}: SwipeGeometry & { distance: number; velocity: number }): 'open' | 'closed' | 'full' {
  if (fullSwipe && distance >= rowWidth * FULL_SWIPE_RATIO) return 'full'
  if (Math.abs(velocity) >= SWIPE_FLICK_VELOCITY) return velocity > 0 ? 'open' : 'closed'
  return distance > actionsWidth / 2 ? 'open' : 'closed'
}
