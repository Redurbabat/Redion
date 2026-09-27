/**
 * Swipe from the left edge to go back (iOS navigation).
 * The top page follows the finger; the page below starts at -20 % and moves
 * at 1/5 of the speed, with a dim that fades out (Framework7 values).
 */
export const SWIPE_BACK_EDGE = 30
const PARALLAX = 0.2

export function swipeBackFrame(distance: number, width: number) {
  const top = Math.min(Math.max(distance, 0), width)
  const progress = width > 0 ? top / width : 0
  return {
    progress,
    top,
    below: -width * PARALLAX * (1 - progress),
    /** Opacity of the dim on the page below and of the edge shadow. */
    dim: 1 - progress,
  }
}

/**
 * Commit or cancel on release. Unlike a total-time rule, this looks at the
 * release velocity: a flick towards the edge commits, a flick back cancels,
 * otherwise more than half the width commits.
 */
export function resolveSwipeBack({ distance, velocity, width }: { distance: number; velocity: number; width: number }): boolean {
  if (distance < 10) return false
  if (Math.abs(velocity) >= 300) return velocity > 0
  return distance > width / 2
}
