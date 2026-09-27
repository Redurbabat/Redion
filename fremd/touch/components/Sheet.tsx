import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { selectSnapPoint } from '../gesture/momentum'
import { rubberband } from '../gesture/rubberband'
import { backgroundTransform, resolveDetents, sheetProgress, type Detent } from '../gesture/sheet'
import { createVelocityTracker } from '../gesture/velocity'
import { cx } from '../internal/cx'
import { useReducedMotion } from '../internal/useReducedMotion'
import { animateSpring, type SpringAnimation } from '../motion/animateSpring'
import { springPreset } from '../motion/presets'
import { Portal } from '../overlay/Portal'
import { useModal } from '../overlay/useModal'
import './Sheet.css'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name; also shown as the sheet heading unless `hideTitle`. */
  title: string
  hideTitle?: boolean
  description?: ReactNode
  /** Rest heights, e.g. ['medium', 'large'], 0.3 (fraction), 240 or '240px'. Default ['medium', 'large']. */
  detents?: Detent[]
  /** Controlled detent index (into the ascending list of resolved heights). */
  detent?: number
  defaultDetent?: number
  onDetentChange?: (index: number) => void
  /** Swipe down, scrim tap and Escape close the sheet. Default true. */
  dismissible?: boolean
  /** Push the page behind back like a card at the largest detent. Default true. */
  pushBackground?: boolean
  /** Element to push back; default the first `[data-ui-sheet-background]` in the container/document. */
  backgroundSelector?: string
  /** Portal target for contained layouts (e.g. a phone frame). Default document.body. */
  container?: HTMLElement | null
  /** Buttons in the header, e.g. a "Fertig" button. */
  headerActions?: ReactNode
  /** Label of the grabber button (keyboard: Enter cycles, arrows resize). */
  grabberLabel?: string
  detentNames?: string[]
  children?: ReactNode
  className?: string
}

const TOP_GAP = 10 // px of the pushed-back page that stays visible above a large sheet
const HIDDEN_EXTRA = 24 // move a little further than the height so the shadow is gone too

type Phase = 'closed' | 'opening' | 'open' | 'closing'

/**
 * Bottom sheet with detents that follows the finger.
 *
 * - Drag: 1:1 tracking, rubber band past the ends, the release picks the
 *   detent nearest the momentum-projected position and hands the finger's
 *   velocity to a spring (no seam between drag and animation).
 * - Interruptible: grabbing a moving sheet continues from where it is.
 * - Scroll arbitration: inside the content, the sheet only takes the
 *   gesture when the content is not scrollable at its current size, or
 *   when pulling down from the very top.
 * - A11y: role=dialog + aria-modal, focus trap and return, Escape, inert
 *   background, a real grabber button (Enter cycles detents, arrows resize).
 * - Reduced motion: positions change without travel; open/close fade.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  detents = ['medium', 'large'],
  detent,
  defaultDetent = 0,
  onDetentChange,
  dismissible = true,
  pushBackground = true,
  backgroundSelector = '[data-ui-sheet-background]',
  container,
  headerActions,
  grabberLabel = 'Grösse ändern',
  detentNames,
  children,
  className,
}: SheetProps) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(open ? 'opening' : 'closed')
  const [activeIndex, setActiveIndex] = useState(detent ?? defaultDetent)
  const [announcement, setAnnouncement] = useState('')
  const titleId = useId()
  const descriptionId = useId()

  const layerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLElement | null>(null)

  // Geometry and motion state live in refs: per-frame work never re-renders React.
  const geo = useRef({ heights: [] as number[], max: 0, width: 0 })
  const y = useRef(0)
  const anim = useRef<SpringAnimation | null>(null)
  const latest = useRef({ onOpenChange, onDetentChange, dismissible, reduced })
  useLayoutEffect(() => {
    latest.current = { onOpenChange, onDetentChange, dismissible, reduced }
  })

  const index = detent ?? activeIndex
  const mounted = phase !== 'closed'

  if (open && phase === 'closed') {
    setPhase('opening')
    if (detent === undefined && activeIndex !== defaultDetent) setActiveIndex(defaultDetent)
  }
  if (!open && (phase === 'open' || phase === 'opening')) setPhase('closing')

  // ── geometry ─────────────────────────────────────────────────────────
  const measure = useCallback(() => {
    const host = container ?? null
    const viewportHeight = host ? host.clientHeight : window.innerHeight
    const width = host ? host.clientWidth : window.innerWidth
    const heights = resolveDetents(detents, { viewportHeight, topGap: TOP_GAP + (pushBackground ? 14 : 0) })
    geo.current = { heights, max: heights[heights.length - 1] ?? 0, width }
    if (sheetRef.current) sheetRef.current.style.height = `${geo.current.max}px`
    // The detents array is compared by value on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, JSON.stringify(detents), pushBackground])

  const yForIndex = (i: number) => geo.current.max - geo.current.heights[Math.max(0, Math.min(i, geo.current.heights.length - 1))]
  const hiddenY = () => geo.current.max + HIDDEN_EXTRA

  // ── painting one frame ───────────────────────────────────────────────
  const paint = useCallback((nextY: number) => {
    y.current = nextY
    const { heights, max, width } = geo.current
    const visible = Math.max(0, max - nextY)
    const progress = sheetProgress(visible, heights)
    const appear = heights.length ? Math.min(1, visible / heights[0]) : 1
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0, ${nextY}px, 0)`
    if (scrimRef.current) scrimRef.current.style.opacity = String(appear * (0.45 + 0.55 * progress))
    const bg = backgroundRef.current
    if (bg) {
      const t = backgroundTransform(progress * appear, width)
      bg.style.setProperty('--ui-sheet-bg-progress', String(progress * appear))
      bg.style.setProperty('--ui-sheet-bg-scale', String(t.scale))
      const pushed = progress * appear > 0
      if (pushed) bg.setAttribute('data-ui-sheet-pushed', '')
      else bg.removeAttribute('data-ui-sheet-pushed')
      // Only a full-page background reveals the canvas; contained demos have their own frame.
      if (!container) {
        document.documentElement.toggleAttribute('data-ui-sheet-canvas', pushed)
        document.body.toggleAttribute('data-ui-sheet-canvas', pushed)
      }
    }
  }, [container])

  const springTo = useCallback(
    (targetY: number, velocity = 0, onDone?: () => void) => {
      anim.current?.stop()
      const sheet = sheetRef.current
      if (sheet) sheet.style.willChange = 'transform'
      anim.current = animateSpring({
        from: y.current,
        to: targetY,
        velocity,
        params: springPreset(targetY >= hiddenY() - 1 ? 'snappy' : 'smooth'),
        restDelta: 0.5,
        restSpeed: 10,
        reducedMotion: latest.current.reduced,
        onUpdate: (value) => paint(value),
        onComplete: () => {
          anim.current = null
          if (sheet) sheet.style.willChange = ''
          onDone?.()
        },
      })
    },
    [paint],
  )

  // ── open / close lifecycle ───────────────────────────────────────────
  useLayoutEffect(() => {
    if (phase !== 'opening') return
    measure()
    const scope = container ?? document
    backgroundRef.current = pushBackground ? scope.querySelector<HTMLElement>(backgroundSelector) : null
    paint(hiddenY())
    if (latest.current.reduced) {
      paint(yForIndex(index))
      setPhase('open')
      return
    }
    springTo(yForIndex(index), 0, () => setPhase('open'))
    // Runs once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'opening'])

  const finishClose = useCallback(() => {
    const bg = backgroundRef.current
    if (bg) {
      bg.removeAttribute('data-ui-sheet-pushed')
      bg.style.removeProperty('--ui-sheet-bg-progress')
      bg.style.removeProperty('--ui-sheet-bg-scale')
    }
    document.documentElement.removeAttribute('data-ui-sheet-canvas')
    document.body.removeAttribute('data-ui-sheet-canvas')
    setPhase('closed')
  }, [])

  useEffect(() => {
    if (phase !== 'closing') return
    if (latest.current.reduced) {
      // The fade-out is a CSS transition on data-phase="closing".
      const timer = window.setTimeout(finishClose, 200)
      return () => window.clearTimeout(timer)
    }
    // Released downwards: the fly-out animation is already running and finishes the close itself.
    if (anim.current && anim.current.target >= hiddenY() - 1) return
    springTo(hiddenY(), 0, finishClose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Controlled / programmatic detent changes.
  useEffect(() => {
    if (phase !== 'open') return
    springTo(yForIndex(index))
    setAnnouncement(detentNames?.[index] ?? `${index + 1} / ${geo.current.heights.length}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Keep detents correct on resize / rotation.
  useEffect(() => {
    if (!mounted) return
    const onResize = () => {
      measure()
      if (!anim.current) paint(yForIndex(index))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  useEffect(
    () => () => {
      anim.current?.stop()
    },
    [],
  )

  // On phones the on-screen keyboard shrinks only the visual viewport: lift the
  // sheet above it so a focused field stays visible (idea: Vaul / react-modal-sheet).
  useEffect(() => {
    const vv = window.visualViewport
    if (!mounted || !vv || container) return
    const onViewport = () => {
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      // Ignore small changes (suggestion bars, URL bar); 60 px as in Vaul.
      sheetRef.current?.style.setProperty('--ui-touch-sheet-keyboard', `${keyboard > 60 ? keyboard : 0}px`)
    }
    onViewport()
    vv.addEventListener('resize', onViewport)
    vv.addEventListener('scroll', onViewport)
    return () => {
      vv.removeEventListener('resize', onViewport)
      vv.removeEventListener('scroll', onViewport)
    }
  }, [mounted, container])

  const requestClose = useCallback(() => {
    if (latest.current.dismissible) latest.current.onOpenChange(false)
  }, [])

  useModal({
    open: mounted && phase !== 'closing',
    onClose: requestClose,
    containerRef: sheetRef,
    layerRef,
    initialFocusRef: sheetRef,
    closeOnEscape: dismissible,
  })

  const setIndex = (next: number) => {
    const clamped = Math.max(0, Math.min(next, geo.current.heights.length - 1))
    if (detent === undefined) setActiveIndex(clamped)
    latest.current.onDetentChange?.(clamped)
    if (clamped === index) springTo(yForIndex(clamped))
  }

  // ── drag ─────────────────────────────────────────────────────────────
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    originY: number
    state: 'pending' | 'dragging'
    fromContent: boolean
    tracker: ReturnType<typeof createVelocityTracker>
  } | null>(null)

  const atLargest = () => y.current <= yForIndex(geo.current.heights.length - 1) + 1

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || phase === 'closing') return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"], [data-ui-sheet-no-drag]')) return
    const fromContent = Boolean(contentRef.current?.contains(target))
    // Grab a moving sheet where it is (interruptible).
    if (anim.current) anim.current.stop()
    anim.current = null
    const tracker = createVelocityTracker()
    tracker.add(y.current, event.timeStamp)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originY: y.current,
      state: 'pending',
      fromContent,
      tracker,
    }
  }

  const followFinger = (clientY: number) => {
    const d = drag.current
    if (!d) return
    const raw = d.originY + (clientY - d.startY)
    const top = yForIndex(geo.current.heights.length - 1)
    const bottom = latest.current.dismissible ? hiddenY() : yForIndex(0)
    let next = raw
    if (raw < top) next = top - rubberband(top - raw, geo.current.max)
    else if (raw > bottom) next = bottom + rubberband(raw - bottom, geo.current.max)
    paint(next)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    const dx = event.clientX - d.startX
    const dy = event.clientY - d.startY
    if (d.state === 'pending') {
      const axis = lockAxis(dx, dy, slopFor(event.pointerType))
      if (axis === null) return
      const content = contentRef.current
      const scrolls = content ? content.scrollHeight > content.clientHeight + 1 : false
      const blocked =
        axis === 'x' ||
        (d.fromContent && scrolls && atLargest() && (dy < 0 || (content?.scrollTop ?? 0) > 0))
      if (blocked) {
        drag.current = null
        return
      }
      d.state = 'dragging'
      // Start from the finger position now, so the slop does not make the sheet jump.
      d.startY = event.clientY
      event.currentTarget.setPointerCapture(event.pointerId)
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
      sheetRef.current?.setAttribute('data-dragging', '')
    }
    d.tracker.add(y.current, event.timeStamp)
    followFinger(event.clientY)
    d.tracker.add(y.current, event.timeStamp)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.state !== 'dragging') return
    sheetRef.current?.removeAttribute('data-dragging')
    const velocity = d.tracker.velocity(event.timeStamp)
    const count = geo.current.heights.length
    const points = Array.from({ length: count }, (_, i) => yForIndex(i))
    if (latest.current.dismissible) points.push(hiddenY())
    const choice = selectSnapPoint({ position: y.current, velocity, points })
    if (choice === count) {
      springTo(hiddenY(), velocity, finishClose)
      latest.current.onOpenChange(false)
      return
    }
    if (detent === undefined) setActiveIndex(choice)
    latest.current.onDetentChange?.(choice)
    springTo(points[choice], velocity)
    setAnnouncement(detentNames?.[choice] ?? `${choice + 1} / ${count}`)
  }

  // At the largest detent the content scrolls natively; pulling down from its
  // very top must still move the sheet, so stop the browser from taking that pan.
  useEffect(() => {
    const content = contentRef.current
    if (!content || !mounted) return
    let startY = 0
    let decided = false
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0
      decided = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (decided) {
        if (drag.current?.state === 'dragging' && e.cancelable) e.preventDefault()
        return
      }
      const dy = (e.touches[0]?.clientY ?? 0) - startY
      if (Math.abs(dy) < 2) return
      decided = true
      if (dy > 0 && content.scrollTop <= 0 && e.cancelable) e.preventDefault()
    }
    content.addEventListener('touchstart', onTouchStart, { passive: true })
    content.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      content.removeEventListener('touchstart', onTouchStart)
      content.removeEventListener('touchmove', onTouchMove)
    }
  }, [mounted])

  // ── keyboard on the grabber ──────────────────────────────────────────
  const onGrabberKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(index + 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (index === 0 && dismissible) onOpenChange(false)
      else setIndex(index - 1)
    }
  }
  const cycle = () => setIndex(index + 1 >= geo.current.heights.length ? 0 : index + 1)

  if (!mounted) return null

  return (
    <Portal container={container}>
      <div
        ref={layerRef}
        className={cx('ui-touch-sheet-layer', container && 'ui-touch-sheet-layer--contained')}
        data-phase={phase}
        data-reduced={reduced || undefined}
      >
        <div
          ref={scrimRef}
          className="ui-touch-sheet-scrim"
          aria-hidden="true"
          onClick={() => requestClose()}
        />
        <div
          ref={sheetRef}
          className={cx('ui-touch-sheet', className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          data-at-largest={index >= geo.current.heights.length - 1 || undefined}
        >
          <button
            type="button"
            className="ui-touch-sheet-grabber"
            aria-label={grabberLabel}
            onClick={cycle}
            onKeyDown={onGrabberKeyDown}
          >
            <span aria-hidden="true" />
          </button>
          <header className={cx('ui-touch-sheet-header', hideTitle && !headerActions && 'ui-touch-sheet-header--bare')}>
            <h2 id={titleId} className={cx('ui-touch-sheet-title', hideTitle && 'ui-touch-visually-hidden')}>
              {title}
            </h2>
            {headerActions && <div className="ui-touch-sheet-actions">{headerActions}</div>}
          </header>
          {description && (
            <p id={descriptionId} className="ui-touch-sheet-description">
              {description}
            </p>
          )}
          <div ref={contentRef} className="ui-touch-sheet-content">
            {children}
          </div>
          <span className="ui-touch-visually-hidden" aria-live="polite">
            {announcement}
          </span>
        </div>
      </div>
    </Portal>
  )
}
