/**
 * Release velocity from a short history of pointer samples.
 *
 * Only the last `windowMs` count (a flick at the end of a slow drag must
 * read as fast). A touch-down sample that is much older than the window —
 * the finger rested before moving — is never used, so it cannot dilute the
 * speed. If the finger stopped before lifting, the velocity is 0.
 * Idea source: Motion's PanSession velocity (see HERKUNFT.md).
 */
export interface VelocityTracker {
  add(value: number, timeMs: number): void
  /** Units per second at `nowMs` (usually the pointerup timestamp). */
  velocity(nowMs: number): number
  reset(): void
}

export function createVelocityTracker({ windowMs = 100 }: { windowMs?: number | undefined } = {}): VelocityTracker {
  let samples: Array<{ value: number; time: number }> = []

  return {
    add(value, time) {
      samples.push({ value, time })
      // Keep a little more than the window so the reference sample survives (and always the last two).
      const cutoff = time - windowMs * 4
      while (samples.length > 2) {
        const oldest = samples[0]
        // `!(a < b)` rather than `a >= b`: a NaN time stops the trimming, as it always did.
        if (!oldest || !(oldest.time < cutoff)) break
        samples.shift()
      }
    },
    velocity(now) {
      const last = samples.at(-1)
      const previous = samples.at(-2)
      if (!last || !previous) return 0 // fewer than two samples
      if (now - last.time > windowMs) return 0

      // Oldest sample that still lies inside the window before the last one.
      let reference = last
      for (let i = samples.length - 2; i >= 0; i -= 1) {
        const sample = samples[i]
        // `!(a <= b)` rather than `a > b`: a NaN time ends the search, as it always did.
        if (!sample || !(last.time - sample.time <= windowMs)) break
        reference = sample
      }
      if (reference === last) {
        // Sparse events: fall back to the previous sample unless it is a stale touch-down.
        if (last.time - previous.time > windowMs * 2) return 0
        reference = previous
      }

      const dt = (last.time - reference.time) / 1000
      if (dt <= 0) return 0
      const v = (last.value - reference.value) / dt
      return Number.isFinite(v) ? v : 0
    },
    reset() {
      samples = []
    },
  }
}
