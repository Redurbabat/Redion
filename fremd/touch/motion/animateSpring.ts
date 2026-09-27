import { solveSpring, type SpringParams, type SpringSample } from './spring'

/** Frame source; injectable so gestures and tests can run on a fake clock. */
export interface FrameScheduler {
  /** Milliseconds, same time base as the value passed to request callbacks. */
  now(): number
  request(callback: (time: number) => void): number
  cancel(id: number): void
}

export interface SpringAnimationOptions {
  from: number
  to: number
  /** Initial velocity in units per second, e.g. the finger speed on release. */
  velocity?: number
  params: SpringParams
  onUpdate: (value: number, velocity: number) => void
  onComplete?: () => void
  /** Distance to the target that counts as arrived (caller units). Default 0.01. */
  restDelta?: number
  /** Speed that counts as stopped (caller units per second). Default 0.1. */
  restSpeed?: number
  /** Skip the motion and land on the target immediately. */
  reducedMotion?: boolean
  scheduler?: FrameScheduler
}

export interface SpringAnimation {
  /** Stops the animation where it is and returns that state. */
  stop(): SpringSample
  /** Redirects to a new target, keeping the current value and velocity. */
  retarget(to: number): void
  readonly target: number
}

const browserScheduler: FrameScheduler = {
  now: () => performance.now(),
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
}

/**
 * Runs a spring on requestAnimationFrame. Values are computed from elapsed
 * time with the analytic solution, so dropped frames never change the path.
 */
export function animateSpring(options: SpringAnimationOptions): SpringAnimation {
  const {
    params,
    onUpdate,
    onComplete,
    restDelta = 0.01,
    restSpeed = 0.1,
    reducedMotion = false,
    scheduler = browserScheduler,
  } = options

  let target = options.to
  let startTime = scheduler.now()
  let solve = solveSpring(params, options.from, target, options.velocity ?? 0)
  let frame: number | null = null
  /** Where the value rests when not running (arrived, or stopped mid-flight). */
  let rest: SpringSample | null = null
  /** Bumped by stop/retarget so a tick that is already running knows it is stale. */
  let generation = 0

  // rAF timestamps are frame-start times and can be slightly earlier than the
  // performance.now() taken when the animation started: clamp to t >= 0.
  const sampleAt = (time: number): SpringSample => solve(Math.max(0, time - startTime) / 1000)

  const cancelFrame = () => {
    if (frame !== null) scheduler.cancel(frame)
    frame = null
  }

  const finish = () => {
    frame = null
    rest = { value: target, velocity: 0 }
    const current = generation
    onUpdate(target, 0)
    if (current === generation) onComplete?.()
  }

  const tick = (time: number) => {
    frame = null
    const current = generation
    const s = sampleAt(time)
    if (Math.abs(s.value - target) <= restDelta && Math.abs(s.velocity) <= restSpeed) {
      finish()
      return
    }
    onUpdate(s.value, s.velocity)
    // onUpdate may have stopped or redirected the animation.
    if (current === generation && frame === null) frame = scheduler.request(tick)
  }

  const start = () => {
    rest = null
    if (reducedMotion) finish()
    else frame = scheduler.request(tick)
  }

  start()

  return {
    get target() {
      return target
    },
    stop() {
      if (rest) return rest
      generation += 1
      cancelFrame()
      const s = sampleAt(scheduler.now())
      rest = { value: s.value, velocity: 0 }
      return s
    },
    retarget(to) {
      const current = rest ?? sampleAt(scheduler.now())
      generation += 1
      cancelFrame()
      target = to
      startTime = scheduler.now()
      solve = solveSpring(params, current.value, to, current.velocity)
      start()
    },
  }
}
