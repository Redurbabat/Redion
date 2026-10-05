/**
 * Spring physics for the Touch kit.
 *
 * A spring is a damped harmonic oscillator:  m·x″ + c·x′ + k·x = 0,
 * where x is the distance to the target. We solve it analytically (no
 * frame-by-frame integration), so a spring can be sampled at any time, is
 * frame-rate independent and can be turned into a CSS `linear()` easing.
 *
 * Units: time in seconds, velocity in units per second.
 *
 * Idea sources (see HERKUNFT.md): the closed-form solutions follow the
 * approach of Motion's spring generator (MIT); the "duration + bounce"
 * parametrisation follows Apple's publicly documented spring model.
 */

export interface SpringParams {
  /** k — pull towards the target. Higher = faster. */
  stiffness: number
  /** c — friction. Higher = less oscillation. */
  damping: number
  /** m — inertia. Higher = slower and floatier. */
  mass: number
}

/** Designer-friendly spring description. */
export interface PerceptualSpring {
  /** Perceived duration in seconds (period of the undamped oscillation). */
  duration: number
  /** 0 = no overshoot, 0…1 = bouncier, below 0 = sluggish (overdamped). */
  bounce: number
}

export interface SpringSample {
  value: number
  velocity: number
}

export interface SettleOptions {
  /** Distance to the target that counts as "arrived". Default 0.001. */
  restDelta?: number | undefined
  /** Speed that counts as "stopped". Default 0.01 units/s. */
  restSpeed?: number | undefined
  /** Hard upper bound in seconds. Default 10. */
  maxDuration?: number | undefined
}

const MAX_BOUNCE = 0.95

/** Converts `duration` + `bounce` into physical spring parameters (mass 1). */
export function springFromPerceptual({ duration, bounce }: PerceptualSpring): SpringParams {
  if (!(duration > 0)) throw new RangeError(`Spring duration must be > 0, got ${duration}`)
  const b = Math.min(MAX_BOUNCE, Math.max(-MAX_BOUNCE, bounce))
  const ratio = b >= 0 ? 1 - b : 1 / (1 + b)
  const omega = (2 * Math.PI) / duration
  return { stiffness: omega * omega, damping: 2 * ratio * omega, mass: 1 }
}

/** ζ — below 1 the spring overshoots, 1 is critical, above 1 it creeps in. */
export function dampingRatio({ stiffness, damping, mass }: SpringParams): number {
  return damping / (2 * Math.sqrt(stiffness * mass))
}

function assertPhysical({ stiffness, damping, mass }: SpringParams) {
  if (!(stiffness > 0) || !(mass > 0) || !(damping >= 0)) {
    throw new RangeError(`Invalid spring: stiffness=${stiffness} damping=${damping} mass=${mass}`)
  }
}

/**
 * Returns a function t ↦ {value, velocity} for a spring released at `from`
 * with `initialVelocity`, pulled towards `to`.
 */
export function solveSpring(
  params: SpringParams,
  from: number,
  to: number,
  initialVelocity = 0,
): (t: number) => SpringSample {
  assertPhysical(params)
  const x0 = from - to
  const v0 = initialVelocity
  if (x0 === 0 && v0 === 0) return () => ({ value: to, velocity: 0 })

  const omega0 = Math.sqrt(params.stiffness / params.mass)
  const zeta = dampingRatio(params)

  if (Math.abs(zeta - 1) < 1e-6) {
    // Critically damped: x(t) = e^{-ω₀t}(x₀ + (v₀ + ω₀x₀)t)
    const b = v0 + omega0 * x0
    return (t) => {
      const e = Math.exp(-omega0 * t)
      return { value: to + e * (x0 + b * t), velocity: e * (v0 - omega0 * b * t) }
    }
  }

  if (zeta < 1) {
    // Underdamped: decaying oscillation with ω_d = ω₀√(1-ζ²)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta)
    const decay = zeta * omega0
    const b = (v0 + decay * x0) / omegaD
    return (t) => {
      const e = Math.exp(-decay * t)
      const cos = Math.cos(omegaD * t)
      const sin = Math.sin(omegaD * t)
      return {
        value: to + e * (x0 * cos + b * sin),
        velocity: e * ((omegaD * b - decay * x0) * cos - (decay * b + omegaD * x0) * sin),
      }
    }
  }

  // Overdamped: sum of two decaying exponentials with roots r₁, r₂ < 0.
  // Vieta form (r₁·r₂ = ω₀²) avoids cancellation in the slow root for large ζ.
  const s = zeta + Math.sqrt(zeta * zeta - 1)
  const r1 = -omega0 / s
  const r2 = -omega0 * s
  const c2 = (v0 - r1 * x0) / (r2 - r1)
  const c1 = x0 - c2
  return (t) => {
    const e1 = c1 * Math.exp(r1 * t)
    const e2 = c2 * Math.exp(r2 * t)
    return { value: to + e1 + e2, velocity: r1 * e1 + r2 * e2 }
  }
}

/**
 * Time in seconds until the spring is (and stays) at rest.
 *
 * Because a damped spring never gains energy, once both distance and speed
 * are below the thresholds they stay (approximately) below them.
 */
export function settleDuration(
  params: SpringParams,
  from: number,
  to: number,
  initialVelocity = 0,
  { restDelta = 0.001, restSpeed = 0.01, maxDuration = 10 }: SettleOptions = {},
): number {
  const at = solveSpring(params, from, to, initialVelocity)
  const step = 1 / 1000
  for (let t = 0; t < maxDuration; t += step) {
    const s = at(t)
    if (Math.abs(s.value - to) <= restDelta && Math.abs(s.velocity) <= restSpeed) {
      return Math.round(t * 1000) / 1000
    }
  }
  return maxDuration
}

/**
 * Samples a 0 → 1 spring into a CSS `linear()` easing string plus the
 * duration (seconds) it has to be paired with. This lets plain CSS
 * transitions move with real spring curves, including overshoot.
 */
export function springToLinearEasing(
  params: SpringParams,
  { maxPoints = 48, precision = 4 }: { maxPoints?: number | undefined; precision?: number | undefined } = {},
): { easing: string; duration: number } {
  if (!(maxPoints >= 2)) throw new RangeError(`maxPoints must be >= 2, got ${maxPoints}`)
  const maxDuration = 10
  const duration = settleDuration(params, 0, 1, 0, { restDelta: 0.0005, restSpeed: 0.01, maxDuration })
  const at = solveSpring(params, 0, 1, 0)
  const end = at(duration)
  if (Math.abs(end.value - 1) > 0.005) {
    // Forcing the last point to 1 would make a visible jump at the end.
    throw new RangeError(`Spring does not settle within ${maxDuration}s; use a stiffer or more damped spring`)
  }
  // ~one point per 16 ms is visually lossless (at least 12); the budget always wins.
  const count = Math.min(maxPoints, Math.max(12, Math.ceil(duration * 60) + 1))
  const factor = 10 ** precision
  const points: string[] = []
  for (let i = 0; i < count; i += 1) {
    const t = (i / (count - 1)) * duration
    const v = i === 0 ? 0 : i === count - 1 ? 1 : Math.round(at(t).value * factor) / factor
    points.push(String(v))
  }
  return { easing: `linear(${points.join(', ')})`, duration }
}
