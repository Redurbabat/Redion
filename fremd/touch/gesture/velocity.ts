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

export function createVelocityTracker({ windowMs = 100 }: { windowMs?: number } = {}): VelocityTracker {
  let samples: Array<{ value: number; time: number }> = []

  return {
    add(value, time) {
      samples.push({ value, time })
      // Keep a little more than the window so the reference sample survives.
      const cutoff = time - windowMs * 4
      while (samples.length > 2 && samples[0].time < cutoff) samples.shift()
    },
    velocity(now) {
      if (samples.length < 2) return 0
      const last = samples[samples.length - 1]
      if (now - last.time > windowMs) return 0

      // Oldest sample that still lies inside the window before the last one.
      let i = samples.length - 1
      while (i > 0 && last.time - samples[i - 1].time <= windowMs) i -= 1
      let reference = samples[i]
      if (reference === last) {
        // Sparse events: fall back to the previous sample unless it is a stale touch-down.
        const previous = samples[samples.length - 2]
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
