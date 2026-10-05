import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../motion/reducedMotion'
import './viewTransition.css'

export type PageTransition = 'push' | 'pop' | 'fade'

type ViewTransitionDocument = {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

export interface PageTransitionOptions {
  /**
   * Slide only this element instead of the whole page (e.g. the content
   * area of an app shell or a phone frame). The rest of the page stays
   * still and the sliding pages are clipped to the element's box, with the
   * corner radius from `--ui-touch-vt-radius` (set on the element or an
   * ancestor), else the element's own `border-radius`. Keep decorations
   * such as frame shadows outside it — they would slide along.
   */
  scope?: HTMLElement | null | undefined
}

const SCOPE_NAME = 'ui-touch-page'
/**
 * The scope's clip radius, handed to <html>: the transition pseudo-elements
 * inherit from the root, never from the scope, so a radius set on the scope
 * would not reach them. Private to this module (users set --ui-touch-vt-radius).
 */
const CLIP_RADIUS = '--ui-touch-vt-clip-radius'
let generation = 0
let activeScope: HTMLElement | null = null

function clipRadius(scope: HTMLElement) {
  const style = getComputedStyle(scope)
  return style.getPropertyValue('--ui-touch-vt-radius').trim() || style.borderRadius
}

/**
 * Runs a page change (a React state update) as an iOS-style push / pop with
 * the View Transitions API: the new page slides in from the right while the
 * old one drifts 20 % left (push), or the reverse (pop).
 *
 * - No API support → the update just happens (no animation, nothing breaks).
 * - Reduced motion → a short cross-fade instead of sliding.
 * - A newer transition (e.g. "back" pressed by keyboard mid-push) takes over
 *   a running one; only the newest cleans up. Pointer taps do not reach the
 *   page while a transition runs (the browser routes them to <html>), which
 *   is why it stays short (≤ 480 ms).
 * - Other elements with their own view-transition-name can travel in step:
 *   `animation-duration: var(--ui-touch-vt-duration)` and
 *   `animation-timing-function: var(--ui-touch-vt-easing)` on their group.
 * The update is flushed synchronously so the browser captures the new state.
 */
export function transitionPage(
  update: () => void,
  direction: PageTransition = 'push',
  { scope }: PageTransitionOptions = {},
): Promise<void> {
  const doc = document as unknown as ViewTransitionDocument
  if (typeof doc.startViewTransition !== 'function') {
    update()
    return Promise.resolve()
  }
  const root = document.documentElement
  const target = scope ?? null
  const mine = ++generation
  root.dataset.uiVt = prefersReducedMotion() ? 'fade' : direction
  // Two elements with one name would make the browser skip the transition.
  if (activeScope && activeScope !== target) activeScope.style.removeProperty('view-transition-name')
  activeScope = target
  if (target) {
    root.dataset.uiVtScope = ''
    root.style.setProperty(CLIP_RADIUS, clipRadius(target))
    target.style.setProperty('view-transition-name', SCOPE_NAME)
  } else {
    delete root.dataset.uiVtScope
    root.style.removeProperty(CLIP_RADIUS)
  }
  const transition = doc.startViewTransition(() => flushSync(update))
  return transition.finished.finally(() => {
    if (mine !== generation) return
    delete root.dataset.uiVt
    delete root.dataset.uiVtScope
    root.style.removeProperty(CLIP_RADIUS)
    target?.style.removeProperty('view-transition-name')
    activeScope = null
  })
}
