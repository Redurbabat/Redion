import { springFromPerceptual, type PerceptualSpring, type SpringParams } from './spring'

/**
 * Named springs of the Touch kit. Each preset is also exported to CSS as
 * `--ui-spring-<name>` (a linear() easing) + `--ui-spring-<name>-duration`
 * in motion-tokens.css, so CSS transitions and JS gestures share one feel.
 */
export const springPresets = {
  /** Finger lifts off a pressed control: quick with a small rebound. */
  press: { duration: 0.32, bounce: 0.3 },
  /** Toggles, segmented thumb, steppers — decisive, barely any overshoot. */
  snappy: { duration: 0.36, bounce: 0.14 },
  /** Sheets, pages, large surfaces — no overshoot. */
  smooth: { duration: 0.5, bounce: 0 },
  /** Playful one-shots: heart / star pop, badges. */
  bouncy: { duration: 0.5, bounce: 0.36 },
  /** Shared-element journeys (mini player → full screen). */
  gentle: { duration: 0.62, bounce: 0.1 },
} as const satisfies Record<string, PerceptualSpring>

export type SpringPresetName = keyof typeof springPresets

export function springPreset(name: SpringPresetName): SpringParams {
  return springFromPerceptual(springPresets[name])
}
