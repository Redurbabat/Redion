import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { PULL_HOLD, PULL_THRESHOLD, pullOffset } from '../gesture/pull'
import { ActivityIndicator } from './ActivityIndicator'
import { cx } from '../internal/cx'
import './PullToRefresh.css'

export interface PullToRefreshProps {
  /** Runs when a pull is released past the threshold; the spinner stays until it settles. */
  onRefresh: () => Promise<unknown> | void
  children: ReactNode
  /**
   * Top of the screen that stays put while pulling, e.g. a `Navbar` with its
   * SearchBar (its `scrollRef` = this component's `ref`). It is the first
   * thing in the scroll area and scrolls like any content, but a pull slides
   * only `children` down: the spinner appears between the header and the
   * list, and a sticky bar never leaves the top.
   */
  header?: ReactNode
  /** The scroll element, e.g. for a Navbar's `scrollRef` (React 19: a plain prop). */
  ref?: Ref<HTMLDivElement>
  /** Accessible name of the scroll area. */
  label?: string
  refreshingText?: string
  doneText?: string
  className?: string
}

type Phase = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'settling'

/**
 * Scroll area that refreshes when pulled down from the top.
 * The content follows the finger with a soft rubber band; the spinner's
 * spokes appear one by one, it spins once the pull is past the
 * threshold, the content rests on the spinner while `onRefresh` runs,
 * then springs back. Refresh state is announced to screen readers.
 *
 * It is itself the scroll container: give it a height (e.g. `height: 100%`
 * of the screen) and a background. For an iOS list screen put the Navbar in
 * `header` and share one ref, so the large title collapses on scroll and the
 * bar stays at the top while pulling:
 *
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null)
 * <PullToRefresh ref={scrollRef} onRefresh={load}
 *   header={<Navbar title="Mediathek" scrollRef={scrollRef}><SearchBar /></Navbar>}>
 *   <List>…</List>
 * </PullToRefresh>
 * ```
 *
 * A Navbar among `children` still collapses, but it slides down with the pull.
 */
export function PullToRefresh({
  onRefresh,
  children,
  label = 'Inhalt',
  refreshingText = 'Wird aktualisiert',
  doneText = 'Aktualisiert',
  className,
  header,
  ref,
}: PullToRefreshProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [offset, setOffset] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null } | null>(null)
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase
  const offsetRef = useRef(0)
  const moveTo = (next: number) => {
    offsetRef.current = next
    setOffset(next)
  }

  // The scroll element goes to our ref and to the caller's; a cleanup returned by a callback ref is kept (React 19).
  const setScroller = useCallback(
    (el: HTMLDivElement | null) => {
      scrollRef.current = el
      let outerCleanup: void | (() => void) = undefined
      if (typeof ref === 'function') outerCleanup = ref(el)
      else if (ref) ref.current = el
      return () => {
        scrollRef.current = null
        if (typeof outerCleanup === 'function') outerCleanup()
        else if (typeof ref === 'function') ref(null)
        else if (ref) ref.current = null
      }
    },
    [ref],
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || phase === 'refreshing') return
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return
    // A second finger during a pull is not a new gesture: the pull stays with the finger that started it.
    if (gesture.current?.axis === 'y' && gesture.current.id !== event.pointerId) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    const dy = event.clientY - g.y
    if (g.axis === null) {
      g.axis = lockAxis(event.clientX - g.x, dy, slopFor(event.pointerType))
      if (g.axis === 'x' || (g.axis === 'y' && dy < 0)) {
        gesture.current = null // sideways, or scrolling down the content
        return
      }
      if (g.axis === null) return
      g.y = event.clientY
      event.currentTarget.setPointerCapture?.(event.pointerId)
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
    }
    const next = pullOffset(event.clientY - g.y)
    moveTo(next)
    // Also written to the ref at once: a release can arrive before React re-renders.
    phaseRef.current = next >= PULL_THRESHOLD ? 'armed' : 'pulling'
    setPhase(phaseRef.current)
  }

  const onPointerEnd = async (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    gesture.current = null
    if (g.axis !== 'y') return
    if (phaseRef.current !== 'armed') {
      // Cancelled before the content moved: no transition will end a settle.
      setPhase(offsetRef.current > 0 ? 'settling' : 'idle')
      moveTo(0)
      return
    }
    setPhase('refreshing')
    moveTo(PULL_HOLD)
    setAnnouncement(refreshingText)
    try {
      await onRefresh()
    } finally {
      setPhase('settling')
      moveTo(0)
      setAnnouncement(doneText)
    }
  }

  // While pulling, stop the browser from scrolling / bouncing the page instead.
  // This reads the gesture ref, not React state: the browser sends the touchmove right after the pointermove
  // that locked the pull, before React re-renders, and an unprevented one starts native scrolling (answered
  // by pointercancel). A finger going down inside the slop is held back as well, for browsers whose own
  // scroll slop is smaller than ours.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current
      if (!g || !e.cancelable) return
      const t = e.touches[0]
      const down = g.axis === 'y' || (g.axis === null && t !== undefined && t.clientY - g.y > Math.abs(t.clientX - g.x))
      if (down) e.preventDefault()
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [])

  const progress = Math.min(1, offset / PULL_THRESHOLD)
  const spinning = phase === 'armed' || phase === 'refreshing'

  return (
    <div
      ref={setScroller}
      className={cx('ui-touch-ptr', className)}
      role="region"
      aria-label={label}
      aria-busy={phase === 'refreshing' || undefined}
      data-phase={phase}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {header}
      <div className="ui-touch-ptr-indicator" aria-hidden="true" style={{ opacity: Math.min(1, progress * 1.5) }}>
        <ActivityIndicator
          className="ui-touch-ptr-spinner"
          label=""
          progress={spinning ? undefined : progress}
        />
      </div>
      <div
        className="ui-touch-ptr-content"
        data-tracking={phase === 'pulling' || phase === 'armed' || undefined}
        style={{ transform: `translateY(${offset}px)` }}
        onTransitionEnd={() => {
          if (phaseRef.current === 'settling') setPhase('idle')
        }}
      >
        {children}
      </div>
      <span className="ui-touch-visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}
