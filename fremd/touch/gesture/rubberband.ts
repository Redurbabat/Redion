/**
 * Rubber band: past an edge the element keeps following, but ever more
 * slowly, and never further than `dimension`. Near the edge it follows with
 * slope `constant` (0.55 is the value used by iOS scroll views).
 * Formula from the apple-design skill (see HERKUNFT.md).
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (overshoot === 0 || dimension <= 0) return 0
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/** Clamps `value` to [min, max] with rubber-banded overflow on both sides. */
export function rubberbandClamp(value: number, min: number, max: number, dimension: number, constant = 0.55): number {
  if (value < min) return min - rubberband(min - value, dimension, constant)
  if (value > max) return max + rubberband(value - max, dimension, constant)
  return value
}
