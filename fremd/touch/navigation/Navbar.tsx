import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { collapseProgress, largeTitleScale, snapCollapse } from '../gesture/navigation'
import { Glyph } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { useReducedMotion } from '../internal/useReducedMotion'
import './Navbar.css'

export interface NavbarProps {
  /** Screen title: the large heading under the bar, and the small centred title once collapsed. */
  title: string
  /**
   * Heading level of the title. Default 1 (the screen is the page). Use 2–4
   * when the screen is embedded in a larger page, so the page keeps one h1.
   */
  headingLevel?: 1 | 2 | 3 | 4
  /** Show the iOS large title that shrinks into the bar on scroll. Default true. */
  largeTitle?: boolean
  /** Left slot (e.g. "Bearbeiten"); shown after the back button if both are given. */
  leading?: ReactNode
  /** Right slot (actions). */
  trailing?: ReactNode
  /** Text of the back button (also its accessible name). Default "Zurück". */
  backLabel?: string
  /** Renders a back button (chevron + label) when given. */
  onBack?: () => void
  /**
   * The scroll container the navbar lives in (render the navbar as its first
   * child), or `document.documentElement` when the page itself scrolls. Its
   * scroll position drives the collapse. Give the container
   * `scroll-padding-top` of the bar height so elements focused by keyboard
   * are not scrolled underneath the sticky bar.
   *
   * With pull to refresh the PullToRefresh is the scroll container: pass the
   * navbar as its `header` and one ref to both
   * (`<PullToRefresh ref={scrollRef} header={<Navbar scrollRef={scrollRef} …/>}>`),
   * so the bar stays at the top and the spinner appears under the navbar.
   */
  scrollRef: RefObject<HTMLElement | null>
  /**
   * Finish a half-way collapse when scrolling stops. Default true. A scroll
   * that keyboard focus caused is left where it is.
   */
  snap?: boolean
  /** Extra row under the large title that scrolls with the page, e.g. a SearchBar. */
  children?: ReactNode
  className?: string
}

/** Large-title block height before layout exists (34 px / 41 px type + padding). */
const LARGE_TITLE_FALLBACK = 52
/** Scroll distance over which an inline bar gains its material. */
const INLINE_RANGE = 16
/** Quiet time after the last scroll event before snapping where `scrollend` is missing (Safari). */
const SNAP_DELAY = 120

/**
 * Navigation bar with the iOS large title.
 *
 * - The large title (the page's only h1) sits in the scroll flow and simply
 *   scrolls under the sticky bar; its fade, the small title and the bar
 *   material are all driven from CSS by one custom property,
 *   `--ui-touch-navbar-collapse` (0…1), written once per animation frame.
 * - Pulled past the top (iOS rubber band) the large title grows slightly
 *   from its left edge: `--ui-touch-navbar-stretch`.
 * - When scrolling stops half-way, the page scrolls to fully open / fully
 *   collapsed (`scrollend`, or 120 ms of quiet without it).
 * - Reduced motion: no stretch, the small title and material switch at
 *   half-way instead of fading along, snaps jump.
 *
 * The header uses `display: contents` so the bar can stick for the whole
 * scroll container while the large title stays in the flow.
 */
export function Navbar({
  title,
  largeTitle = true,
  headingLevel = 1,
  leading,
  trailing,
  backLabel,
  onBack,
  scrollRef,
  snap = true,
  children,
  className,
}: NavbarProps) {
  const reduced = useReducedMotion()
  const headerRef = useRef<HTMLElement>(null)
  const largeRef = useRef<HTMLDivElement>(null)
  const settings = useRef({ reduced, snap, largeTitle })
  const repaint = useRef<(() => void) | null>(null)
  useLayoutEffect(() => {
    settings.current = { reduced, snap, largeTitle }
  })

  // A passive effect: the parent's ref (the scroll container) is attached only after our layout effects.
  useEffect(() => {
    const scroller = scrollRef.current
    const header = headerRef.current
    if (!scroller || !header) return
    // When the page itself scrolls (scrollRef = <html>), scroll and scrollend are fired at the Document.
    const events: EventTarget = scroller === scroller.ownerDocument.scrollingElement ? scroller.ownerDocument : scroller

    let frame: number | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let touching = false
    let collapsed: boolean | null = null
    // Focus moved into the page since the last scroll input: the browser's scroll-into-view is not snapped
    // back, or the element it revealed (scroll-padding) would hide under the bar or a docked player again.
    let focusScrolled = false

    /** The distance that means "fully collapsed", capped by what the page can scroll. */
    const range = () => {
      const title = settings.current.largeTitle ? largeRef.current?.offsetHeight || LARGE_TITLE_FALLBACK : INLINE_RANGE
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      return { title, maxScroll, effective: Math.max(1, Math.min(title, maxScroll)) }
    }

    const paint = () => {
      frame = null
      const top = scroller.scrollTop
      const { title, maxScroll } = range()
      const progress = collapseProgress(top, title, maxScroll)
      const stretch = settings.current.reduced || !settings.current.largeTitle ? 1 : largeTitleScale(top)
      header.style.setProperty('--ui-touch-navbar-collapse', String(Math.round(progress * 1000) / 1000))
      header.style.setProperty('--ui-touch-navbar-stretch', String(Math.round(stretch * 1000) / 1000))
      const next = progress >= 0.5
      if (next !== collapsed) {
        collapsed = next
        header.toggleAttribute('data-collapsed', next)
      }
    }

    const snapNow = () => {
      timer = null
      if (focusScrolled) {
        focusScrolled = false
        return
      }
      if (!settings.current.snap || !settings.current.largeTitle) return
      const target = snapCollapse(scroller.scrollTop, range().effective)
      if (target === null) return
      scroller.scrollTo({ top: target, behavior: settings.current.reduced ? 'auto' : 'smooth' })
    }

    // Decided per mount so a browser without `scrollend` (Safari) gets the timer fallback.
    const hasScrollEnd = 'onscrollend' in window
    const armFallback = () => {
      if (timer !== null) clearTimeout(timer)
      timer = touching ? null : setTimeout(snapNow, SNAP_DELAY)
    }

    const schedulePaint = () => {
      if (frame === null) frame = requestAnimationFrame(paint)
    }
    const onScroll = () => {
      schedulePaint()
      if (!hasScrollEnd) armFallback()
    }
    const onTouchStart = () => {
      touching = true
      if (timer !== null) clearTimeout(timer)
      timer = null
    }
    const onFocusIn = () => {
      focusScrolled = true
    }
    // Keys (Tab arrives before its focusin), wheel and pointer start scrolls of the user's own: those snap.
    const onScrollInput = () => {
      focusScrolled = false
    }
    const onTouchEnd = () => {
      touching = false
      if (!hasScrollEnd) armFallback()
    }

    paint()
    repaint.current = schedulePaint
    events.addEventListener('scroll', onScroll, { passive: true })
    events.addEventListener('scrollend', snapNow)
    events.addEventListener('touchstart', onTouchStart, { passive: true })
    events.addEventListener('touchend', onTouchEnd, { passive: true })
    events.addEventListener('touchcancel', onTouchEnd, { passive: true })
    events.addEventListener('focusin', onFocusIn)
    for (const type of ['keydown', 'wheel', 'pointerdown']) events.addEventListener(type, onScrollInput, { passive: true })
    // A resized scroll area (rotation, split view) changes how far the page can scroll.
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedulePaint) : null
    resize?.observe(scroller)

    return () => {
      events.removeEventListener('scroll', onScroll)
      events.removeEventListener('scrollend', snapNow)
      events.removeEventListener('touchstart', onTouchStart)
      events.removeEventListener('touchend', onTouchEnd)
      events.removeEventListener('touchcancel', onTouchEnd)
      events.removeEventListener('focusin', onFocusIn)
      for (const type of ['keydown', 'wheel', 'pointerdown']) events.removeEventListener(type, onScrollInput)
      resize?.disconnect()
      repaint.current = null
      if (frame !== null) cancelAnimationFrame(frame)
      if (timer !== null) clearTimeout(timer)
    }
  }, [scrollRef, largeTitle])

  // Reduced motion can change while mounted: repaint the stretch.
  useEffect(() => {
    repaint.current?.()
  }, [reduced])

  const Heading = `h${headingLevel}` as const
  const TitleTag = largeTitle ? 'div' : Heading

  return (
    <header
      ref={headerRef}
      className={cx('ui-touch-navbar', className)}
      data-large={largeTitle || undefined}
    >
      <div className="ui-touch-navbar-bar">
        <div className="ui-touch-navbar-material" aria-hidden="true" />
        <div className="ui-touch-navbar-leading">
          {onBack && <BackButton label={backLabel ?? 'Zurück'} onBack={onBack} />}
          {leading}
        </div>
        <TitleTag className="ui-touch-navbar-title" aria-hidden={largeTitle || undefined}>
          {title}
        </TitleTag>
        <div className="ui-touch-navbar-trailing">{trailing}</div>
      </div>
      {largeTitle && (
        <div ref={largeRef} className="ui-touch-navbar-large">
          <Heading className="ui-touch-navbar-large-title">{title}</Heading>
        </div>
      )}
      {children && <div className="ui-touch-navbar-accessory">{children}</div>}
    </header>
  )
}

function BackButton({ label, onBack }: { label: string; onBack: () => void }) {
  const { pressProps } = usePress<HTMLButtonElement>()
  return (
    <button {...pressProps} type="button" className="ui-touch-navbar-back" aria-label={label} onClick={onBack}>
      <Glyph name="chevron-left" size={24} strokeWidth={2.4} className="ui-touch-navbar-back-glyph" />
      <span className="ui-touch-navbar-back-label">{label}</span>
    </button>
  )
}
