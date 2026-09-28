import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type TransitionEvent as ReactTransitionEvent,
} from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { PULL_HOLD, PULL_THRESHOLD, pullOffset } from '../gesture/pull'
import { prefersReducedMotion } from '../motion/reducedMotion'
import { ActivityIndicator } from './ActivityIndicator'
import { cx } from '../internal/cx'
import { useMergedRef } from '../internal/useMergedRef'
import './PullToRefresh.css'

export interface PullToRefreshProps {
  /** Runs when a pull is released past the threshold; the spinner stays until it settles. */
  onRefresh: () => Promise<unknown> | void
  /**
   * A refresh the app started itself, e.g. from its „Aktualisieren“ button.
   * While true the view looks and sounds like a pull refresh (spinner, content
   * resting on it, `aria-busy`, `refreshingText` once) and pulls are ignored;
   * when it turns false the content springs back and `doneText` is announced.
   * Overlapping a pull's `onRefresh` is fine: it settles once both are done.
   * Started while the list is scrolled down, the rows stay where they are (the
   * spinner at the top is out of sight, as with iOS `beginRefreshing`): only
   * `aria-busy` and the announcements tell.
   */
  refreshing?: boolean | undefined
  children: ReactNode
  /**
   * Top of the screen that stays put while pulling, e.g. a `Navbar` with its
   * SearchBar (its `scrollRef` = this component's `ref`). It is the first
   * thing in the scroll area and scrolls like any content, but a pull slides
   * only `children` down: the spinner appears between the header and the
   * list, and a sticky bar never leaves the top.
   */
  header?: ReactNode | undefined
  /** The scroll element, e.g. for a Navbar's `scrollRef` (React 19: a plain prop). */
  ref?: Ref<HTMLDivElement> | undefined
  /** Accessible name of the scroll area. */
  label?: string | undefined
  refreshingText?: string | undefined
  doneText?: string | undefined
  className?: string | undefined
}

type Phase = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'settling'

/**
 * Longest a settle waits for the content's transitionend: the smooth spring
 * takes about 800 ms; under reduced motion the slide is 1 ms (or none).
 * Without a transitionend (no transition, nothing moved) the settle ends here.
 */
const SETTLE_TIMEOUT_MS = 1000
const REDUCED_SETTLE_TIMEOUT_MS = 100

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
 *
 * Every pull needs a way without the gesture, e.g. an „Aktualisieren“ button.
 * Pass the app's own busy state as `refreshing`, so the button path looks and
 * sounds the same as a pull (one `refresh` can serve both). The guard keeps a
 * second press from starting a second load, which the first one's end would
 * announce as done while it still runs:
 *
 * ```tsx
 * const [refreshing, setRefreshing] = useState(false)
 * const refresh = async () => {
 *   if (refreshing) return
 *   setRefreshing(true)
 *   try { await load() } finally { setRefreshing(false) }
 * }
 * <IconButton icon="repeat" label="Aktualisieren" onClick={() => void refresh()} />
 * <PullToRefresh refreshing={refreshing} onRefresh={refresh}>…</PullToRefresh>
 * ```
 */
export function PullToRefresh({
  onRefresh,
  refreshing = false,
  children,
  label = 'Inhalt',
  refreshingText = 'Wird aktualisiert',
  doneText = 'Aktualisiert',
  className,
  header,
  ref,
}: PullToRefreshProps) {
  // Mounted while refreshing: already resting on the spinner, with no slide down on the first paint.
  const [phase, setPhase] = useState<Phase>(refreshing ? 'refreshing' : 'idle')
  const [offset, setOffset] = useState(refreshing ? PULL_HOLD : 0)
  const [announcement, setAnnouncement] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null } | null>(null)
  const phaseRef = useRef<Phase>(phase)
  phaseRef.current = phase
  const offsetRef = useRef(offset)
  const moveTo = (next: number) => {
    offsetRef.current = next
    setOffset(next)
  }
  // Also written to the ref at once: a release can arrive before React re-renders.
  const go = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }
  /**
   * Who keeps the spinner up: a pull whose `onRefresh` still runs, the
   * `refreshing` prop, or both. `shown` is what the view shows, so a refresh
   * starts (and is announced) once and settles once, when both are done.
   */
  const busy = useRef({ gesture: false, prop: false, shown: false })
  const alive = useRef(true)
  const texts = useRef({ refreshingText, doneText })
  useLayoutEffect(() => {
    texts.current = { refreshingText, doneText }
  })

  /** Back to the top; a settle that has nothing to move ends at once (no transition will end it). */
  const settle = () => {
    go(offsetRef.current > 0 ? 'settling' : 'idle')
    moveTo(0)
  }

  /** Shows or ends the refresh after one of its sources changed. */
  const sync = () => {
    const b = busy.current
    const next = b.gesture || b.prop
    if (next === b.shown) return
    b.shown = next
    if (next) {
      gesture.current = null // a pull in progress gives way: the content goes to the hold position
      go('refreshing')
      // Scrolled down (the app's button in a sticky bar): the spinner sits out of sight at the top,
      // so the rows stay put instead of jumping by the hold height. A pull always starts at the top.
      moveTo((scrollRef.current?.scrollTop ?? 0) > 0 ? 0 : PULL_HOLD)
      setAnnouncement(texts.current.refreshingText)
    } else {
      settle()
      setAnnouncement(texts.current.doneText)
    }
  }

  // The scroll element goes to our ref and to the caller's; a cleanup returned by a callback ref is kept (React 19).
  const setScroller = useMergedRef(scrollRef, ref)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || busy.current.shown) return
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
    go(next >= PULL_THRESHOLD ? 'armed' : 'pulling')
  }

  const onPointerEnd = async (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    gesture.current = null
    if (g.axis !== 'y') return
    if (phaseRef.current !== 'armed') {
      settle() // released early, or cancelled before the content moved
      return
    }
    busy.current.gesture = true
    sync()
    try {
      await onRefresh()
    } finally {
      busy.current.gesture = false
      if (alive.current) sync()
    }
  }

  // The app's own refresh (its „Aktualisieren“ button). A layout effect: the hold position is set before paint.
  useLayoutEffect(() => {
    busy.current.prop = refreshing
    sync()
    // Runs when the prop changes; `sync` reads everything else from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // The safety net of a settle: transitionend is not guaranteed (transition none, nothing moved, interrupted).
  useEffect(() => {
    if (phase !== 'settling') return
    const timer = window.setTimeout(
      () => {
        if (phaseRef.current !== 'settling') return
        phaseRef.current = 'idle'
        setPhase('idle')
      },
      prefersReducedMotion() ? REDUCED_SETTLE_TIMEOUT_MS : SETTLE_TIMEOUT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  const onContentTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    // Only the content's own slide: transitions of rows inside bubble up to here as well.
    if (event.target !== event.currentTarget) return
    if (phaseRef.current === 'settling') go('idle')
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
        onTransitionEnd={onContentTransitionEnd}
      >
        {children}
      </div>
      <span className="ui-touch-visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}
