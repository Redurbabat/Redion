import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import { Badge, BadgeAnchor, formatBadgeCount } from '../components/Badge'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { selectSnapPoint } from '../gesture/momentum'
import { materialStretch } from '../gesture/navigation'
import { rubberbandClamp } from '../gesture/rubberband'
import { createVelocityTracker, type VelocityTracker } from '../gesture/velocity'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { useMergedRef } from '../internal/useMergedRef'
import { usePress } from '../internal/usePress'
import { useReducedMotion } from '../internal/useReducedMotion'
import { animateSpring, type SpringAnimation } from '../motion/animateSpring'
import { springPreset } from '../motion/presets'
import './TabBar.css'

export interface TabBarItem<V extends string = string> {
  value: V
  /** Visible text under the icon; also the button's accessible name. */
  label: string
  /**
   * A kit glyph name (drawn at 24 px), or the app's own symbol as an element, rendered as given: size it
   * 24 × 24 and draw in currentColor so it takes the tab's tint. The slot hides it from assistive technology.
   */
  icon: GlyphName | ReactElement
  /** Small red pill on the icon: a count (0 hides it) or a short word such as "Neu". */
  badge?: number | string | undefined
  /** Text for assistive technology instead of the badge, e.g. "3 ungelesene". Default "<n> neue" / the word. */
  badgeLabel?: string | undefined
  disabled?: boolean | undefined
}

export type TabBarVariant = 'bar' | 'floating'

export interface TabBarProps<V extends string = string>
  extends Omit<ComponentPropsWithRef<'nav'>, 'onChange' | 'defaultValue' | 'children' | 'aria-label'> {
  items: ReadonlyArray<TabBarItem<V>>
  /** Controlled selection. Leave undefined for an uncontrolled bar. */
  value?: V | undefined
  /** Initial selection when uncontrolled (default: the first enabled item). */
  defaultValue?: V | undefined
  /** Called with the newly chosen value (tap, keyboard or drag) — not when the active tab is tapped again. */
  onChange?: ((value: V) => void) | undefined
  /** Accessible name of the navigation landmark, e.g. "Hauptbereiche". */
  label: string
  /** bar = full-width strip on the bottom edge; floating = glass capsule hovering above the content. */
  variant?: TabBarVariant | undefined
  /** Text announced after a drag picked a tab. Default "<label> ausgewählt". */
  formatAnnouncement?: ((item: TabBarItem<V>) => string) | undefined
}

/** A flick carries the material about one tab, not across the whole bar (0.998 would be a scroll view). */
const DECELERATION = 0.98
/** Past the end tabs the material can be pulled at most this fraction of a tab width (rubber band asymptote). */
const RUBBER_FRACTION = 0.5
/**
 * The click a browser sends right after a drag is swallowed. A click later than this is a new one: after a
 * touch drag no click follows at all, and assistive technology can activate a tab without any pointerdown.
 */
const CLICK_SUPPRESS_MS = 500
/** The held material counts as resting when the finger has not moved for this long; its stretch then relaxes. */
const REST_MS = 50
/** Half-life of that relaxation. */
const RELAX_HALF_LIFE_MS = 40

interface DragState {
  pointerId: number
  startX: number
  startY: number
  /** Viewport x of the track's padding box, cached on pointerdown. */
  origin: number
  /** Viewport px per layout px (an ancestor may be scaled), cached on pointerdown. */
  scale: number
  /** performance.now() of the latest move: tells a resting finger from a moving one. */
  lastMove: number
  state: 'pending' | 'dragging'
  /** Pressed on the material itself: it is grabbed where it is and follows 1:1. Otherwise it is pulled to the finger. */
  onMaterial: boolean
  /** Finger minus material centre, kept constant while grabbed. */
  offset: number
  /** Latest material centre asked for by the finger (after the rubber band). */
  target: number
  preview: number
  tracker: VelocityTracker
}

const round = (value: number, precision = 100) => Math.round(value * precision) / precision

function badgeText(badge: number | string | undefined): string | null {
  if (typeof badge === 'number') return formatBadgeCount(badge)
  if (typeof badge === 'string' && badge.trim() !== '') return badge
  return null
}

function firstEnabled<V extends string>(items: ReadonlyArray<TabBarItem<V>>) {
  return items.findIndex((item) => !item.disabled)
}

const defaultAnnouncement = (item: TabBarItem<string>) => `${item.label} ausgewählt`

/**
 * Bottom tab bar with a moving "material": one pill behind the active tab.
 *
 * - Semantics: `<nav aria-label>` with buttons; the active one carries
 *   `aria-current="page"`. One tab stop; arrow keys, Home and End move focus,
 *   Enter / Space activate (native buttons).
 * - Motion: on every change the material travels on the `snappy` spring and
 *   stretches with its speed (`materialStretch`). A new target while it is
 *   flying keeps its velocity. Transforms are written per frame, never via
 *   React state.
 * - Drag: hold the material (or a tab) and slide sideways. Held, it follows
 *   1:1; from another tab it is pulled over to the finger. Past the ends it
 *   rubber-bands. On release it snaps with momentum to the nearest tab, which
 *   becomes active; the click at the end of a drag is swallowed.
 * - Reduced motion: the material jumps (no travel, no stretch); only colours
 *   change.
 */
export function TabBar<V extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  label,
  variant = 'bar',
  formatAnnouncement = defaultAnnouncement,
  className,
  style,
  ref,
  ...rest
}: TabBarProps<V>) {
  const reduced = useReducedMotion()
  const controlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState<V | undefined>(
    () => defaultValue ?? items[firstEnabled(items)]?.value,
  )
  const currentValue = controlled ? value : uncontrolledValue
  const activeIndex = items.findIndex((item) => item.value === currentValue)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  /**
   * The tab the last drag chose. A new object per drag also re-renders, so the layout effect can check a
   * controlled value against the material. It is announced only once it really is the current value.
   */
  const [dragPick, setDragPick] = useState<{ value: V } | null>(null)

  const navRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const materialRef = useRef<HTMLSpanElement>(null)

  // Geometry and motion live in refs: per-frame work never re-renders React.
  /** Track-local layout px; origin is the viewport x of the track's padding box, scale viewport px per layout px. */
  const geo = useRef({ centres: [] as number[], width: 0, origin: 0, scale: 1 })
  /**
   * c = material centre (track px); s = its current stretch; index = tab it rests at / travels to
   * (null before the first paint, -1 hidden).
   */
  const motion = useRef({ c: 0, s: 1, index: null as number | null, anim: null as SpringAnimation | null })
  const drag = useRef<DragState | null>(null)
  const relaxFrame = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const suppressTimer = useRef<number | undefined>(undefined)
  const latest = useRef({ reduced })
  useLayoutEffect(() => {
    latest.current = { reduced }
  })

  const setNavRef = useMergedRef(navRef, ref)

  const tabButtons = () =>
    Array.from(trackRef.current?.querySelectorAll<HTMLButtonElement>(':scope > .ui-touch-tabbar-tab') ?? [])

  // ── geometry ─────────────────────────────────────────────────────────
  /**
   * Tab centres relative to the track's padding box, in layout px. getBoundingClientRect reports viewport px,
   * which differ when an ancestor is scaled (e.g. an app pushed back behind a sheet), while the material's
   * transform works in layout px: divide by the scale. Returns false when there is no layout (hidden).
   */
  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return false
    const box = track.getBoundingClientRect()
    const scale = track.offsetWidth > 0 && box.width > 0 ? box.width / track.offsetWidth : 1
    const origin = box.left + track.clientLeft * scale
    const rects = Array.from(track.querySelectorAll<HTMLElement>(':scope > .ui-touch-tabbar-tab'), (tab) =>
      tab.getBoundingClientRect(),
    )
    const width = (rects[0]?.width ?? 0) / scale
    geo.current = { centres: rects.map((r) => (r.left - origin + r.width / 2) / scale), width, origin, scale }
    if (width <= 0) return false
    if (materialRef.current) materialRef.current.style.width = `${width}px`
    return true
  }, [])

  // ── painting one frame ───────────────────────────────────────────────
  const draw = useCallback((centre: number, stretch: number) => {
    const m = motion.current
    m.c = centre
    m.s = stretch
    const el = materialRef.current
    const { width } = geo.current
    if (!el || width <= 0) return
    el.style.transform = `translateX(${round(centre - width / 2)}px) scaleX(${round(stretch, 1000)})`
  }, [])

  /**
   * The spring that currently moves the material, or null. The material is promoted for motion
   * (data-moving → will-change) only while one runs; at rest it is an ordinary painted element.
   */
  const setAnim = useCallback((anim: SpringAnimation | null) => {
    motion.current.anim = anim
    materialRef.current?.toggleAttribute('data-moving', anim !== null)
  }, [])

  /** One frame at `centre`, stretched by the speed (never under reduced motion). */
  const paint = useCallback(
    (centre: number, velocity: number) => draw(centre, latest.current.reduced ? 1 : materialStretch(velocity)),
    [draw],
  )

  /**
   * The finger stopped but still holds the material: no more moves arrive to repaint it, so without this the
   * stretch of the last fast move would freeze. Let it settle back to 1 (exponential, frame-rate independent).
   */
  const relaxWhileHeld = useCallback(() => {
    if (relaxFrame.current !== null) return
    let previous = performance.now()
    const tick = () => {
      relaxFrame.current = null
      const d = drag.current
      const m = motion.current
      // A spring (the pull towards the finger) paints its own stretch; a finished drag hands over to the release spring.
      if (!d || d.state !== 'dragging' || m.anim || m.s === 1) return
      const now = performance.now()
      if (now - d.lastMove >= REST_MS) {
        const s = 1 + (m.s - 1) * 0.5 ** ((now - previous) / RELAX_HALF_LIFE_MS)
        draw(m.c, s - 1 < 0.002 ? 1 : s)
      }
      previous = now
      if (m.s !== 1) relaxFrame.current = requestAnimationFrame(tick)
    }
    relaxFrame.current = requestAnimationFrame(tick)
  }, [draw])

  /** Spring to `target`. Without an explicit velocity, a running animation hands over its own. */
  const springTo = useCallback(
    (target: number, velocity?: number) => {
      const m = motion.current
      const previous = m.anim
      const handoff = previous ? previous.stop().velocity : 0
      const run = { done: false, animation: null as SpringAnimation | null }
      run.animation = animateSpring({
        from: m.c,
        to: target,
        velocity: velocity ?? handoff,
        params: springPreset('snappy'),
        restDelta: 0.5,
        restSpeed: 10,
        reducedMotion: latest.current.reduced,
        onUpdate: (next, speed) => paint(next, speed),
        onComplete: () => {
          run.done = true
          if (m.anim === run.animation) setAnim(null)
        },
      })
      // Under reduced motion the spring lands synchronously: nothing keeps running.
      setAnim(run.done ? null : run.animation)
    },
    [paint, setAnim],
  )

  /** Re-measure and put the material back on its tab (resize, item count, variant). */
  const relayout = useCallback(() => {
    if (!measure() || drag.current?.state === 'dragging') return
    const { index, anim } = motion.current
    const target = index === null || index < 0 ? undefined : geo.current.centres[index]
    if (target === undefined) return
    if (anim) anim.retarget(target)
    else paint(target, 0)
  }, [measure, paint])

  useLayoutEffect(() => {
    relayout()
  }, [items.length, variant, relayout])

  // After every render: bring the material to the active tab (tap, keyboard, controlled value, rejected drag).
  useLayoutEffect(() => {
    const m = motion.current
    if (drag.current?.state === 'dragging') return
    if (activeIndex < 0) {
      m.index = -1
      return
    }
    if (m.index === activeIndex) return
    const first = m.index === null || m.index < 0
    m.index = activeIndex
    if (!geo.current.width) measure()
    const target = geo.current.centres[activeIndex]
    if (target === undefined) return
    if (first) {
      // First paint or reappearing: no journey from a stale place.
      m.anim?.stop()
      setAnim(null)
      paint(target, 0)
    } else springTo(target)
  })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => relayout())
      observer.observe(track)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', relayout)
    return () => window.removeEventListener('resize', relayout)
  }, [relayout])

  useEffect(() => {
    const m = motion.current
    return () => {
      m.anim?.stop()
      if (relaxFrame.current !== null) cancelAnimationFrame(relaxFrame.current)
      relaxFrame.current = null
      window.clearTimeout(suppressTimer.current)
    }
  }, [])

  // ── selection ────────────────────────────────────────────────────────
  const select = (index: number) => {
    const item = items[index]
    if (!item || item.disabled || item.value === currentValue) return
    if (!controlled) setUncontrolledValue(item.value)
    onChange?.(item.value)
  }

  /** A tap or the keyboard chose: whatever a drag chose before is no longer news. */
  const onTabClick = (index: number) => {
    setDragPick(null)
    select(index)
  }

  /** Swallow the click the browser sends right after a drag — only that one (see CLICK_SUPPRESS_MS). */
  const suppressNextClick = useCallback(() => {
    suppressClick.current = true
    window.clearTimeout(suppressTimer.current)
    suppressTimer.current = window.setTimeout(() => {
      suppressClick.current = false
    }, CLICK_SUPPRESS_MS)
  }, [])

  // ── drag ─────────────────────────────────────────────────────────────
  const setPreview = useCallback((d: DragState, index: number) => {
    if (d.preview === index) return
    const buttons = Array.from(trackRef.current?.querySelectorAll(':scope > .ui-touch-tabbar-tab') ?? [])
    buttons[d.preview]?.removeAttribute('data-previewed')
    buttons[index]?.setAttribute('data-previewed', '')
    d.preview = index
  }, [])

  const endDragUi = useCallback(
    (d: DragState) => {
      navRef.current?.removeAttribute('data-dragging')
      setPreview(d, -1)
    },
    [setPreview],
  )

  /** Abort the drag (pointercancel, Escape): the material goes back to the active tab. */
  const cancelDrag = useCallback(() => {
    const d = drag.current
    drag.current = null
    if (!d || d.state !== 'dragging') return
    endDragUi(d)
    suppressNextClick()
    const { index } = motion.current
    const target = index === null || index < 0 ? undefined : geo.current.centres[index]
    if (target !== undefined) springTo(target)
  }, [endDragUi, springTo, suppressNextClick])

  // Escape cancels a drag first (capture phase, before overlays around the bar react to it).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || drag.current?.state !== 'dragging') return
      event.preventDefault()
      event.stopPropagation()
      cancelDrag()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [cancelDrag])

  const enabledIndices = () => items.flatMap((item, i) => (item.disabled ? [] : [i]))

  const nearestEnabled = (centre: number) => {
    let best = -1
    let bestDistance = 0
    for (const i of enabledIndices()) {
      const tabCentre = geo.current.centres[i]
      if (tabCentre === undefined) continue // not measured (yet)
      const d = Math.abs(tabCentre - centre)
      if (best === -1 || d < bestDistance) {
        best = i
        bestDistance = d
      }
    }
    return best
  }

  const clampToTrack = (raw: number) => {
    const { centres, width } = geo.current
    return rubberbandClamp(raw, Math.min(...centres), Math.max(...centres), width * RUBBER_FRACTION)
  }

  /** Viewport x → track-local layout px (an ancestor may be scaled). */
  const toTrack = (d: Pick<DragState, 'origin' | 'scale'>, clientX: number) => (clientX - d.origin) / d.scale

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A second finger never takes over a drag in progress; a press whose release got lost does not block.
    if (event.button !== 0 || drag.current?.state === 'dragging') return
    suppressClick.current = false
    drag.current = null
    const index = motion.current.index
    if (index === null || index < 0 || !measure()) return
    const { origin, scale } = geo.current
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin,
      scale,
      lastMove: performance.now(),
      state: 'pending',
      onMaterial: Math.abs(toTrack({ origin, scale }, event.clientX) - motion.current.c) <= geo.current.width / 2,
      offset: 0,
      target: motion.current.c,
      preview: -1,
      tracker: createVelocityTracker(),
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    if (event.pointerType !== 'touch' && event.buttons === 0) {
      // A mouse or pen moving with no button held was released somewhere we never heard of (outside the
      // window, behind a dialog): the press is over. It must never pick the material up on hover.
      if (d.state === 'dragging') cancelDrag()
      else drag.current = null
      return
    }
    const m = motion.current
    let starting = false
    if (d.state === 'pending') {
      const axis = lockAxis(event.clientX - d.startX, event.clientY - d.startY, slopFor(event.pointerType))
      if (axis === null) return
      if (axis === 'y') {
        drag.current = null // a vertical pan: not ours
        return
      }
      d.state = 'dragging'
      starting = true
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer may already be gone (synthetic events, fast lift).
      }
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
      navRef.current?.setAttribute('data-dragging', '')
      if (d.onMaterial) {
        // Grab it where it is (interruptible), measured from here so the slop does not make it jump.
        m.anim?.stop()
        setAnim(null)
        d.offset = toTrack(d, event.clientX) - m.c
      }
    }
    const target = clampToTrack(toTrack(d, event.clientX) - d.offset)
    d.target = target
    d.lastMove = performance.now()
    d.tracker.add(target, event.timeStamp)
    if (m.anim) m.anim.retarget(target)
    else if (starting && !d.onMaterial) springTo(target)
    else {
      paint(target, d.tracker.velocity(event.timeStamp))
      relaxWhileHeld()
    }
    setPreview(d, nearestEnabled(target))
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    drag.current = null
    if (d.state !== 'dragging') return // a tap: the click selects
    endDragUi(d)
    suppressNextClick()
    // Where the material may land: the enabled tabs, each with its measured centre.
    const stops = enabledIndices().flatMap((index) => {
      const item = items[index]
      const centre = geo.current.centres[index]
      return item && centre !== undefined ? [{ index, value: item.value, centre }] : []
    })
    if (stops.length === 0) return
    const velocity = d.tracker.velocity(event.timeStamp)
    const pick = selectSnapPoint({
      position: d.target,
      velocity,
      points: stops.map((stop) => stop.centre),
      decelerationRate: DECELERATION,
    })
    const stop = stops[pick]
    if (!stop) return // not reached: selectSnapPoint picks an index of `points`
    motion.current.index = stop.index
    // Still being pulled over: keep the spring's own velocity; grabbed: take the finger's.
    springTo(stop.centre, motion.current.anim ? undefined : velocity)
    if (stop.index !== activeIndex) {
      select(stop.index)
      // A new object re-renders, so the layout effect also catches a controlled parent that rejects the choice.
      setDragPick({ value: stop.value })
    }
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current && event.pointerId === drag.current.pointerId) cancelDrag()
  }

  /** Where drags are announced: only a choice that really became the current value. */
  const pickedItem = dragPick !== null && dragPick.value === currentValue ? items[activeIndex] : undefined
  const announcement = pickedItem ? formatAnnouncement(pickedItem) : ''

  // ── keyboard ─────────────────────────────────────────────────────────
  const step = (from: number, direction: 1 | -1) => {
    const count = items.length
    for (let offset = 1; offset <= count; offset += 1) {
      const index = (((from + direction * offset) % count) + count) % count
      const item = items[index]
      if (item && !item.disabled) return index
    }
    return -1
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    suppressClick.current = false
    const buttons = tabButtons()
    const from = buttons.indexOf(event.target as HTMLButtonElement)
    if (from === -1) return
    const forward: 1 | -1 = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = step(from, forward)
        break
      case 'ArrowLeft':
        next = step(from, forward === 1 ? -1 : 1)
        break
      case 'Home':
        next = step(-1, 1)
        break
      case 'End':
        next = step(items.length, -1)
        break
      default:
        return
    }
    event.preventDefault()
    if (next !== -1) buttons[next]?.focus()
  }

  const usable = (i: number | null) => {
    const item = i === null ? undefined : items[i]
    return item !== undefined && !item.disabled
  }
  const tabStop = usable(focusIndex) ? focusIndex : usable(activeIndex) ? activeIndex : firstEnabled(items)

  return (
    <nav
      {...rest}
      ref={setNavRef}
      aria-label={label}
      className={cx('ui-touch-tabbar', `ui-touch-tabbar--${variant}`, className)}
      style={{ '--ui-touch-tabbar-count': Math.max(1, items.length), ...style } as CSSProperties}
    >
      <div
        ref={trackRef}
        className="ui-touch-tabbar-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={(event) => {
          // lostpointercapture bubbles. Touch input captures the pointer to the pressed tab (implicit capture);
          // when the bar takes it over, the tab's loss arrives here too — that is not the bar losing it.
          if (event.target === event.currentTarget) onPointerCancel(event)
        }}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusIndex(null)
        }}
        onClickCapture={(event) => {
          // The click that ends a drag is not a tap on the tab under the finger.
          if (!suppressClick.current) return
          suppressClick.current = false
          window.clearTimeout(suppressTimer.current)
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <span
          ref={materialRef}
          className="ui-touch-tabbar-material"
          aria-hidden="true"
          data-hidden={activeIndex < 0 || undefined}
          style={{ '--ui-touch-tabbar-index': Math.max(0, activeIndex) } as CSSProperties}
        >
          <span className="ui-touch-tabbar-material-fill" />
        </span>
        {items.map((item, index) => (
          <TabBarTab
            key={item.value}
            item={item}
            active={index === activeIndex}
            tabStop={index === tabStop}
            onSelect={() => onTabClick(index)}
            onFocus={() => setFocusIndex(index)}
          />
        ))}
      </div>
      <span className="ui-touch-visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </nav>
  )
}

interface TabBarTabProps<V extends string> {
  item: TabBarItem<V>
  active: boolean
  tabStop: boolean
  onSelect: () => void
  onFocus: () => void
}

function TabBarTab<V extends string>({ item, active, tabStop, onSelect, onFocus }: TabBarTabProps<V>) {
  const { pressProps } = usePress<HTMLButtonElement>({}, item.disabled)
  const text = badgeText(item.badge)
  const spoken = item.badgeLabel ?? (typeof item.badge === 'number' ? `${text} neue` : text)
  const glyph = typeof item.icon === 'string' ? <Glyph name={item.icon} size={24} /> : item.icon
  return (
    <button
      {...pressProps}
      type="button"
      className="ui-touch-tabbar-tab"
      aria-current={active ? 'page' : undefined}
      tabIndex={tabStop ? 0 : -1}
      disabled={item.disabled}
      onClick={onSelect}
      onFocus={onFocus}
    >
      <span className="ui-touch-tabbar-icon" aria-hidden="true">
        {text === null ? (
          glyph
        ) : (
          <BadgeAnchor
            badge={
              <span className="ui-touch-tabbar-badge" aria-hidden="true">
                {typeof item.badge === 'number' ? <Badge count={item.badge} /> : <Badge>{text}</Badge>}
              </span>
            }
          >
            {glyph}
          </BadgeAnchor>
        )}
      </span>
      <span className="ui-touch-tabbar-label">{item.label}</span>
      {text !== null && <span className="ui-touch-visually-hidden">, {spoken}</span>}
    </button>
  )
}
