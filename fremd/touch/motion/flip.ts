/**
 * FLIP (First, Last, Invert, Play) for shared-element transitions such as
 * a mini player growing into a full-screen player.
 *
 * Measure the element where it was (first) and where it ends (last),
 * start it transformed back onto `first`, then animate the transform to
 * the identity. Only transform moves; the layout jumps once, invisibly.
 * Idea source: Motion's layout projection (MIT), see HERKUNFT.md.
 */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface FlipDelta {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

const IDENTITY: FlipDelta = { x: 0, y: 0, scaleX: 1, scaleY: 1 }

/** Transform (with a centre transform-origin) that makes `last` look like `first`. */
export function flipDelta(first: Box, last: Box): FlipDelta {
  const safe = (v: number) => (v > 0 ? v : 1)
  const delta = {
    x: first.left + first.width / 2 - (last.left + last.width / 2),
    y: first.top + first.height / 2 - (last.top + last.height / 2),
    scaleX: first.width / safe(last.width),
    scaleY: first.height / safe(last.height),
  }
  return delta.x === 0 && delta.y === 0 && delta.scaleX === 1 && delta.scaleY === 1 ? { ...IDENTITY } : delta
}

/**
 * Scale on the way from `scale` (rest = 1) to 1 (rest = 0): geometric, so
 * the size changes evenly. A zero start (an empty first box) has no ratio
 * to follow — it grows linearly and never drops below 0 in overshoot.
 */
function mixScale(scale: number, rest: number): number {
  return scale > 0 ? scale ** rest : Math.max(0, 1 - (1 - scale) * rest)
}

/**
 * Transform at `progress` (0 = first, 1 = last). Scale interpolates
 * geometrically, which reads as an even change in size. Progress beyond
 * 1 (spring overshoot) is kept.
 */
export function flipFrame(delta: FlipDelta, progress: number): FlipDelta {
  if (progress === 0) return { ...delta }
  if (progress === 1) return { ...IDENTITY }
  const rest = 1 - progress
  return {
    x: delta.x * rest,
    y: delta.y * rest,
    scaleX: mixScale(delta.scaleX, rest),
    scaleY: mixScale(delta.scaleY, rest),
  }
}

export function flipTransform({ x, y, scaleX, scaleY }: FlipDelta): string {
  return `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`
}

/** Border radius that stays visually `radius` px while the element is scaled. */
export function correctedRadius(radius: number, scaleX: number, scaleY: number): string {
  const r = (s: number) => `${Math.round((radius / (s || 1)) * 100) / 100}px`
  return `${r(scaleX)} / ${r(scaleY)}`
}

export function boxOf(element: Element): Box {
  const r = element.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}
