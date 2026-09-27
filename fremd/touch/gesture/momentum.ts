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
  decelerationRate?: number
  /** Speed above which the flick direction must be respected. Default 300 units/s. */
  flickVelocity?: number
}

/**
 * Picks the snap point for a release: the point nearest to the projected
 * resting position — but a clear flick never lands on a point behind the
 * finger. Returns the index into `points`.
 */
export function selectSnapPoint({ position, velocity, points, decelerationRate = 0.998, flickVelocity = 300 }: SnapOptions): number {
  if (points.length === 0) throw new RangeError('selectSnapPoint needs at least one point')
  const projected = position + project(velocity, decelerationRate)
  let best = 0
  for (let i = 1; i < points.length; i += 1) {
    if (Math.abs(points[i] - projected) < Math.abs(points[best] - projected)) best = i
  }

  if (Math.abs(velocity) >= flickVelocity) {
    const direction = Math.sign(velocity)
    const behind = (points[best] - position) * direction < 0
    if (behind) {
      // Nearest point that lies ahead in the flick direction, if there is one.
      let ahead = -1
      for (let i = 0; i < points.length; i += 1) {
        const d = (points[i] - position) * direction
        if (d > 0 && (ahead === -1 || d < (points[ahead] - position) * direction)) ahead = i
      }
      if (ahead !== -1) best = ahead
    }
  }
  return best
}
