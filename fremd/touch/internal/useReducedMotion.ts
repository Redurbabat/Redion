import { useSyncExternalStore } from 'react'
import { prefersReducedMotion, subscribeReducedMotion } from '../motion/reducedMotion'

/**
 * Live "less motion" for JS-driven motion (springs, gestures): the OS
 * setting `prefers-reduced-motion: reduce`, or the app's own switch
 * `data-ui-motion="reduce"` on <html>.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)
}
