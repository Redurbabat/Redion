/**
 * Where would a flicked object come to rest if it decelerated like a
 * scroll view? `decelerationRate` is the per-millisecond velocity factor
 * (0.998 normal, 0.99 snappier). Returns the extra distance.
 * Formula from the apple-design skill / WWDC "Designing Fluid Interfaces".
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  if (velocity === 0) return 0
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

export interface SnapOptions {
  /** Current position (same axis and units as points). */
  position: number
  /** Release velocity, units per second, positive = towards larger values. */
  velocity: number
  points: number[]
  decelerationRate?: number | undefined
  /** Speed above which the flick direction must be respected. Default 300 units/s. */
  flickVelocity?: number | undefined
}

/**
 * Picks the snap point for a release: the point nearest to the projected
 * resting position — but a clear flick never lands on a point behind the
 * finger. Returns the index into `points`.
 */
export function selectSnapPoint({ position, velocity, points, decelerationRate = 0.998, flickVelocity = 300 }: SnapOptions): number {
  const first = points[0]
  if (first === undefined) throw new RangeError('selectSnapPoint needs at least one point')
  const projected = position + project(velocity, decelerationRate)
  let best = 0
  let bestPoint = first
  points.forEach((point, i) => {
    if (Math.abs(point - projected) < Math.abs(bestPoint - projected)) {
      best = i
      bestPoint = point
    }
  })

  if (Math.abs(velocity) >= flickVelocity) {
    const direction = Math.sign(velocity)
    const behind = (bestPoint - position) * direction < 0
    if (behind) {
      // Nearest point that lies ahead in the flick direction, if there is one.
      let ahead = -1
      let aheadDistance = 0
      points.forEach((point, i) => {
        const d = (point - position) * direction
        if (d > 0 && (ahead === -1 || d < aheadDistance)) {
          ahead = i
          aheadDistance = d
        }
      })
      if (ahead !== -1) best = ahead
    }
  }
  return best
}
