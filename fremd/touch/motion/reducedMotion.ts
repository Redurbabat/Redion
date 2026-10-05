const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * An app's own "less motion" switch: `data-ui-motion="reduce"` on <html>
 * calms the kit exactly like the OS setting (JS springs here, CSS motion in
 * base.css). Lets an app with its own motion setting keep one source of truth.
 */
export const MOTION_ATTRIBUTE = 'data-ui-motion'

function appAsksForLessMotion(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute(MOTION_ATTRIBUTE) === 'reduce'
}

function osAsksForLessMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false
}

/** True when the user asked for less motion — in the OS, or through the app's own switch. Safe during SSR/tests. */
export function prefersReducedMotion(): boolean {
  return osAsksForLessMotion() || appAsksForLessMotion()
}

/** Calls `onChange` whenever either source may have changed; returns the unsubscribe function. */
export function subscribeReducedMotion(onChange: () => void): () => void {
  const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
  media?.addEventListener('change', onChange)
  const observer =
    typeof MutationObserver === 'function' && typeof document !== 'undefined' ? new MutationObserver(onChange) : null
  observer?.observe(document.documentElement, { attributes: true, attributeFilter: [MOTION_ATTRIBUTE] })
  return () => {
    media?.removeEventListener('change', onChange)
    observer?.disconnect()
  }
}
