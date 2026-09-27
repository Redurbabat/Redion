/**
 * Decides whether a gesture is horizontal or vertical once it moved more
 * than `threshold` px (≈10 px for touch, 2 px for a mouse — Vaul / apple-design).
 * Returns null while undecided.
 */
export function lockAxis(dx: number, dy: number, threshold: number): 'x' | 'y' | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (Math.max(ax, ay) < threshold) return null
  return ax >= ay ? 'x' : 'y'
}

/** Slop per pointer type. */
export function slopFor(pointerType: string): number {
  return pointerType === 'mouse' ? 2 : 10
}
