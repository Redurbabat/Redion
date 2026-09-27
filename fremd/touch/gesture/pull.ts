import { rubberband } from './rubberband'

/** Content offset at which a release starts the refresh. */
export const PULL_THRESHOLD = 64
/** Offset the content rests at while refreshing (room for the spinner). */
export const PULL_HOLD = 52

/** Finger distance → content offset: soft from the start, never more than 400 px. */
export function pullOffset(distance: number): number {
  return distance <= 0 ? 0 : rubberband(distance, 400, 0.8)
}
