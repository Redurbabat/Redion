/** Upward swipe (px) or speed (px/s) that dismisses a toast. */
export const TOAST_SWIPE_DISTANCE = 32
export const TOAST_SWIPE_VELOCITY = 300

/** Decides on release whether an upward swipe dismisses the toast. */
export function shouldDismissToast(offset: number, velocity: number): boolean {
  return offset <= -TOAST_SWIPE_DISTANCE || velocity <= -TOAST_SWIPE_VELOCITY
}
