import {
  createContext,
  memo,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { resolveSwipeBack, swipeBackFrame, SWIPE_BACK_EDGE } from '../gesture/swipeBack'
import { createVelocityTracker, type VelocityTracker } from '../gesture/velocity'
import { cx } from '../internal/cx'
import { useReducedMotion } from '../internal/useReducedMotion'
import { animateSpring, type SpringAnimation } from '../motion/animateSpring'
import { springPreset } from '../motion/presets'
import './NavigationStack.css'

/** What a screen gets to navigate with (also available via `useStackNavigation()`). */
export interface StackNavigation {
  /** Slide a new screen in on top. */
  push(screen: StackScreen): void
  /** Go back one screen (no-op on the first screen). */
  pop(): void
  /** 1-based position of this screen in the stack (1 = first screen). */
  depth: number
  /** True when there is a screen below this one: show a back button. */
  canGoBack: boolean
}

export interface StackScreen {
  /** Identifies the screen (e.g. for analytics or tests); may repeat in the stack. */
  id: string
  /** Announced to screen readers when the screen becomes the top one. */
  title: string
  /** The screen's content. Called as a component, so it may use hooks. */
  render: (nav: StackNavigation) => ReactNode
}

export interface NavigationStackProps {
  /** The first screen. Read once on mount. */
  initial: StackScreen
  /** Accessible name of the stack region (e.g. the app section's name). */
  label?: string
  /** Swipe from the left edge to go back. Default true. */
  swipeBack?: boolean
  className?: string
}

/** Opt-out marker for controls near the left edge that need horizontal drags themselves. */
const NO_SWIPE =
  'input, textarea, select, [contenteditable="true"], [role="slider"], [data-ui-stack-no-swipe]'
/** Reduced-motion cross-fade length; matches the CSS animation. */
const FADE_MS = 200
/** The click that ends a swipe arrives right after the release; later clicks are real again. */
const CLICK_SUPPRESS_MS = 1000
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

interface Entry {
  key: string
  depth: number
  screen: StackScreen
}

/**
 * How the next motion starts: `push` from 0, `push-continue` / `pop`
 * from where the current spring is, `pop-fresh` from 1, `jump` no motion.
 */
type Motion = 'none' | 'push' | 'push-continue' | 'pop' | 'pop-fresh' | 'jump'

interface StackState {
  entries: Entry[]
  /** A popped screen that is still sliding (or fading) out on top. */
  leaving: Entry | null
  /** Bumped on every push / pop: starts the motion after the commit. */
  seq: number
  motion: Motion
  /** Start velocity of a pop in progress units per second (swipe release). */
  velocity: number
  announcement: string
  nextKey: number
}

type Action =
  | { type: 'push'; screen: StackScreen }
  | { type: 'pop'; velocity?: number; animate?: boolean }
  | { type: 'settle' }

function reducer(state: StackState, action: Action): StackState {
  switch (action.type) {
    case 'push': {
      const entry: Entry = { key: `s${state.nextKey}`, depth: state.entries.length + 1, screen: action.screen }
      return {
        ...state,
        entries: [...state.entries, entry],
        leaving: null,
        seq: state.seq + 1,
        // Pushed while a pop runs: the new page takes over the moving slot and the spring reverses.
        motion: state.leaving ? 'push-continue' : 'push',
        velocity: 0,
        announcement: action.screen.title,
        nextKey: state.nextKey + 1,
      }
    }
    case 'pop': {
      if (state.entries.length < 2) return state
      const top = state.entries[state.entries.length - 1]
      const entries = state.entries.slice(0, -1)
      const animate = action.animate !== false
      return {
        ...state,
        entries,
        leaving: animate ? top : null,
        seq: state.seq + 1,
        motion: !animate ? 'jump' : state.leaving ? 'pop-fresh' : 'pop',
        velocity: action.velocity ?? 0,
        announcement: entries[entries.length - 1].screen.title,
      }
    }
    case 'settle':
      return state.leaving ? { ...state, leaving: null, motion: 'none' } : state
  }
}

const StackContext = createContext<StackNavigation | null>(null)

/** The navigation of the screen this component is rendered in. */
export function useStackNavigation(): StackNavigation {
  const nav = use(StackContext)
  if (!nav) throw new Error('useStackNavigation() must be used inside a NavigationStack screen')
  return nav
}

interface StackApi {
  push(screen: StackScreen): void
  pop(): void
}

const setOpacity = (el: Element | null | undefined, value: string) => {
  if (el instanceof HTMLElement) el.style.opacity = value
}
const partOf = (page: HTMLElement | null, part: 'shadow' | 'dim') => {
  if (!page) return null
  for (const child of Array.from(page.children)) {
    if (child.classList.contains(`ui-touch-stack-${part}`)) return child as HTMLElement
  }
  return null
}

/**
 * iOS-style navigation stack: push / pop with parallax and swipe back.
 *
 * - One spring `progress` (0 = the top page is off-screen right, 1 = it
 *   covers the stack) drives both pages per frame via `swipeBackFrame`:
 *   the top page travels the full width, the page below 1/5 of it
 *   (-20 % → 0) under a fading dim, and the top page casts a 16 px edge
 *   shadow (Framework7 iOS values). Transforms are written to the DOM, not
 *   through React state.
 * - Interruptible: a pop during a push (or a push during a pop) reverses
 *   the running spring with its velocity instead of restarting.
 * - Swipe back from within 30 px of the left edge: 1:1 tracking, then the
 *   release distance and velocity decide (`resolveSwipeBack`) and the
 *   spring continues with the finger's speed.
 * - Only the top two screens are mounted; the lower one is `inert` and
 *   `aria-hidden`. After a push / pop, focus moves to the new screen's
 *   heading and its title is announced politely.
 * - Reduced motion: push / pop cross-fade (200 ms); a swipe still follows
 *   the finger, but the release jumps instead of springing.
 */
export function NavigationStack({ initial, label, swipeBack = true, className }: NavigationStackProps) {
  const reduced = useReducedMotion()
  const [state, dispatch] = useReducer(reducer, initial, (screen): StackState => ({
    entries: [{ key: 's0', depth: 1, screen }],
    leaving: null,
    seq: 0,
    motion: 'none',
    velocity: 0,
    announcement: '',
    nextKey: 1,
  }))
  const [api] = useState<StackApi>(() => ({
    push: (screen) => dispatch({ type: 'push', screen }),
    pop: () => dispatch({ type: 'pop' }),
  }))

  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLElement>(null)
  const belowRef = useRef<HTMLElement>(null)

  // Motion state lives in refs: frames never re-render React.
  const progress = useRef(1)
  const anim = useRef<SpringAnimation | null>(null)
  const moving = useRef(false)
  const dragging = useRef(false)
  const fadeTimer = useRef<number | null>(null)
  const latest = useRef({ reduced })
  useLayoutEffect(() => {
    latest.current = { reduced }
  })
  const drag = useRef<{
    pointerId: number
    pointerType: string
    startX: number
    startY: number
    origin: number
    width: number
    state: 'pending' | 'dragging'
    tracker: VelocityTracker
  } | null>(null)
  /** Until when (performance.now()) the click that ends a swipe is swallowed; 0 = off. */
  const suppressClickUntil = useRef(0)

  const { entries, leaving } = state
  const current = entries[entries.length - 1]
  const topEntry = leaving ?? current
  const belowEntry = leaving ? current : entries.length > 1 ? entries[entries.length - 2] : null

  // ── painting ─────────────────────────────────────────────────────────
  const width = () => rootRef.current?.clientWidth || rootRef.current?.getBoundingClientRect().width || 0

  const setMoving = (value: boolean) => {
    moving.current = value
    rootRef.current?.toggleAttribute('data-moving', value)
  }

  /** One frame of the slide: the top page at (1 - p) × width, the page below at -20 % × p. */
  const paintFrame = (p: number) => {
    const w = width()
    const frame = swipeBackFrame((1 - p) * w, w)
    const ratio = typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1
    const px = (value: number) => Math.round(value * ratio) / ratio // crisp text while moving
    const top = topRef.current
    const below = belowRef.current
    if (top) {
      top.style.transform = `translate3d(${px(frame.top)}px, 0, 0)`
      setOpacity(partOf(top, 'shadow'), String(frame.dim))
      setOpacity(partOf(top, 'dim'), '')
    }
    if (below) {
      below.style.transform = `translate3d(${px(frame.below)}px, 0, 0)`
      setOpacity(partOf(below, 'dim'), String(frame.dim))
      setOpacity(partOf(below, 'shadow'), '')
    }
  }

  /** Reduced motion: both pages in place, the top one fades (CSS) — no travel, no dim. */
  const paintStill = () => {
    for (const page of [topRef.current, belowRef.current]) {
      if (!page) continue
      page.style.transform = 'none'
      setOpacity(partOf(page, 'shadow'), '0')
      setOpacity(partOf(page, 'dim'), '0')
    }
  }

  const paint = (p: number) => {
    if (latest.current.reduced && !dragging.current) paintStill()
    else paintFrame(p)
  }

  /** At rest the CSS positions take over (percentages survive resizes). */
  const rest = () => {
    for (const page of [topRef.current, belowRef.current]) {
      if (!page) continue
      page.style.transform = ''
      setOpacity(partOf(page, 'shadow'), '')
      setOpacity(partOf(page, 'dim'), '')
    }
    setMoving(false)
  }

  const clearFade = () => {
    if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
    fadeTimer.current = null
    for (const page of [topRef.current, belowRef.current]) page?.removeAttribute('data-fade')
  }

  /** Springs `progress` to 0 or 1; `velocity` in progress units per second. */
  const run = (from: number, to: number, velocity: number, onDone: () => void) => {
    anim.current?.stop()
    anim.current = null
    setMoving(true)
    let handle: SpringAnimation | null = null
    let finished = false
    handle = animateSpring({
      from,
      to,
      velocity,
      params: springPreset('smooth'),
      restDelta: 0.001,
      restSpeed: 0.01,
      reducedMotion: latest.current.reduced,
      onUpdate: (value) => {
        progress.current = value
        paint(value)
      },
      onComplete: () => {
        finished = true
        if (anim.current === handle) anim.current = null
        onDone()
      },
    })
    if (!finished) anim.current = handle
  }

  /** Where the spring is right now (value + velocity), stopping it. */
  const takeOver = (fallbackVelocity = 0) => {
    const running = anim.current
    anim.current = null
    if (running) {
      const sample = running.stop()
      progress.current = sample.value
      return sample
    }
    return { value: progress.current, velocity: fallbackVelocity }
  }

  const settlePop = () => {
    progress.current = 1
    // Keep data-moving until the commit that drops the leaving page (rest() then clears it),
    // so the revealed page never flashes hidden for a frame.
    moving.current = false
    dispatch({ type: 'settle' })
  }
  const settlePush = () => {
    progress.current = 1
    rest()
  }

  // ── focus ────────────────────────────────────────────────────────────
  /** Focus the new screen's heading (or the page), unless focus is somewhere else on the page. */
  const focusActive = () => {
    const root = rootRef.current
    if (!root) return
    const focused = document.activeElement
    if (focused && focused !== document.body && !root.contains(focused)) return
    const page = Array.from(root.children).find(
      (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('ui-touch-stack-page') && !el.hasAttribute('inert'),
    )
    if (!page) return
    const content = page.querySelector<HTMLElement>('.ui-touch-stack-content')
    // An explicit target wins; otherwise the first heading of any level.
    const heading =
      page.querySelector<HTMLElement>('[data-ui-stack-focus]') ??
      page.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]')
    const target = heading ?? content ?? page
    // Headings are not focusable by default: make them programmatically focusable only.
    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.setAttribute('data-ui-stack-focused', '')
    target.focus({ preventScroll: true })
  }

  // Every commit: newly mounted pages get the current frame before the browser paints.
  useLayoutEffect(() => {
    if (moving.current) paint(progress.current)
    else rest()
  })

  // ── motion after push / pop ──────────────────────────────────────────
  useLayoutEffect(() => {
    if (state.seq === 0) return
    const isReduced = latest.current.reduced
    // A navigation ends any drag in progress — also a finger that is still undecided at
    // the edge: once it moved it would otherwise grab the page that is leaving.
    drag.current = null
    if (dragging.current) {
      dragging.current = false
      rootRef.current?.removeAttribute('data-dragging')
    }
    clearFade()
    switch (state.motion) {
      case 'push':
      case 'push-continue': {
        if (isReduced) {
          takeOver()
          progress.current = 1
          setMoving(true)
          paintStill()
          topRef.current?.setAttribute('data-fade', 'in')
          fadeTimer.current = window.setTimeout(() => {
            clearFade()
            if (!dragging.current) rest()
          }, FADE_MS)
          break
        }
        if (state.motion === 'push') {
          takeOver()
          progress.current = 0
          setMoving(true)
          paintFrame(0)
          run(0, 1, 0, settlePush)
        } else {
          const from = takeOver()
          setMoving(true)
          paintFrame(from.value)
          run(from.value, 1, from.velocity, settlePush)
        }
        break
      }
      case 'pop':
      case 'pop-fresh': {
        if (isReduced) {
          takeOver()
          progress.current = 1
          setMoving(true)
          paintStill()
          topRef.current?.setAttribute('data-fade', 'out')
          fadeTimer.current = window.setTimeout(() => {
            fadeTimer.current = null
            settlePop()
          }, FADE_MS)
          break
        }
        let from = takeOver(state.velocity)
        if (state.motion === 'pop-fresh') from = { value: 1, velocity: 0 } // the previous pop was dropped
        setMoving(true)
        paintFrame(from.value)
        run(from.value, 0, from.velocity, settlePop)
        break
      }
      case 'jump':
        takeOver()
        settlePush()
        break
      case 'none':
        break
    }
    focusActive()
    // Runs once per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.seq])

  useEffect(
    () => () => {
      anim.current?.stop()
      if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
    },
    [],
  )

  // ── swipe back ───────────────────────────────────────────────────────
  const canSwipe = swipeBack && entries.length > 1 && !leaving

  /** Ends a drag; the page springs back to cover (cancel) or the release decides. */
  const finishDrag = (root: HTMLElement, cancelled: boolean, velocity = 0) => {
    const d = drag.current
    drag.current = null
    if (!d || d.state !== 'dragging') return
    dragging.current = false
    root.removeAttribute('data-dragging')
    if (!cancelled) suppressClickUntil.current = now() + CLICK_SUPPRESS_MS
    const distance = (1 - progress.current) * d.width
    const commit = !cancelled && resolveSwipeBack({ distance, velocity, width: d.width })
    // px/s → progress/s (progress falls as the page moves right).
    const handoff = cancelled ? 0 : -velocity / d.width
    if (commit) {
      dispatch({ type: 'pop', velocity: handoff, animate: !latest.current.reduced })
      return
    }
    run(progress.current, 1, handoff, settlePush)
  }

  /** Any new press ends the suppression, even if a control stops it from bubbling. */
  const onPointerDownCapture = () => {
    suppressClickUntil.current = 0
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const root = event.currentTarget
    const target = event.target as Element
    // React events also bubble out of portals (overlays rendered by a screen): only the stack's own DOM counts.
    if (!root.contains(target)) return
    if (!event.isPrimary || event.button !== 0) return
    const current = drag.current
    if (current?.state === 'dragging') {
      if (current.pointerType !== event.pointerType) return // e.g. a pen while a finger drags
      finishDrag(root, true) // the same device pressed again: the earlier release never arrived
    }
    if (!canSwipe) return
    if (event.clientX - root.getBoundingClientRect().left > SWIPE_BACK_EDGE) return
    if (target.closest(NO_SWIPE)) return
    // A swipeable list row with leading actions owns rightward swipes (as in Framework7).
    const row = target.closest('.ui-touch-swipe')
    if (row && Array.from(row.children).some((c) => c.classList.contains('ui-touch-swipe-actions--leading'))) return
    drag.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      origin: 0,
      width: width(),
      state: 'pending',
      tracker: createVelocityTracker(),
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    const dx = event.clientX - d.startX
    if (d.state === 'pending') {
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        drag.current = null // the button was released outside: no drag without a pressed button
        return
      }
      const axis = lockAxis(dx, event.clientY - d.startY, slopFor(event.pointerType))
      if (axis === null) return
      if (axis === 'y' || dx < 0 || d.width <= 0) {
        drag.current = null // scrolling, or moving towards the edge: not a swipe back
        return
      }
      d.state = 'dragging'
      // Grab a moving page where it is; start from the finger so the slop does not jump.
      d.origin = (1 - takeOver().value) * d.width
      d.startX = event.clientX
      d.tracker.add(d.origin, event.timeStamp)
      clearFade() // a reduced-motion cross-fade ends where the finger takes over
      dragging.current = true
      setMoving(true)
      const root = event.currentTarget
      root.setAttribute('data-dragging', '')
      try {
        root.setPointerCapture(event.pointerId)
      } catch {
        // The pointer may already be gone (synthetic events); tracking still works via bubbling.
      }
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
    }
    const distance = Math.min(Math.max(d.origin + (event.clientX - d.startX), 0), d.width)
    progress.current = 1 - distance / d.width
    paintFrame(progress.current)
    d.tracker.add(distance, event.timeStamp)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return // another finger: not ours
    // px/s, positive = towards pop
    finishDrag(event.currentTarget, cancelled, cancelled ? 0 : d.tracker.velocity(event.timeStamp))
  }

  /**
   * The stack lost its capture mid-drag (released by someone else, the browser took the
   * pointer): spring back. A capture hand-off from a child (touch presses capture their
   * target implicitly) bubbles up from that child and is ignored.
   */
  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || drag.current?.pointerId !== event.pointerId) return
    finishDrag(event.currentTarget, true)
  }

  /** A swipe is not a tap: swallow the pointer click that ends it (keyboard clicks have detail 0). */
  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.target as Node)) return // from a portal
    const until = suppressClickUntil.current
    suppressClickUntil.current = 0
    if (until === 0 || now() > until || event.detail === 0) return
    event.preventDefault()
    event.stopPropagation()
  }

  const slots: Array<{ entry: Entry; slot: 'top' | 'below' }> = []
  if (belowEntry) slots.push({ entry: belowEntry, slot: 'below' })
  slots.push({ entry: topEntry, slot: 'top' })

  return (
    <div
      ref={rootRef}
      className={cx('ui-touch-stack', className)}
      role={label ? 'region' : undefined}
      aria-label={label}
      data-can-swipe={canSwipe || undefined}
      onPointerDownCapture={onPointerDownCapture}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      onLostPointerCapture={onLostPointerCapture}
      onClickCapture={onClickCapture}
    >
      {slots.map(({ entry, slot }) => (
        <StackPage
          key={entry.key}
          ref={slot === 'top' ? topRef : belowRef}
          entry={entry}
          slot={slot}
          active={entry === current}
          api={api}
        />
      ))}
      <div className="ui-touch-visually-hidden" role="status" aria-live="polite">
        {state.announcement}
      </div>
    </div>
  )
}

interface StackPageProps {
  ref: Ref<HTMLElement>
  entry: Entry
  slot: 'top' | 'below'
  active: boolean
  api: StackApi
}

/** One screen. Memoised: a navigation elsewhere in the stack does not re-render it. */
const StackPage = memo(function StackPage({ ref, entry, slot, active, api }: StackPageProps) {
  const { depth, screen } = entry
  const nav = useMemo<StackNavigation>(
    () => ({ push: api.push, pop: api.pop, depth, canGoBack: depth > 1 }),
    [api, depth],
  )
  return (
    <section
      ref={ref}
      className="ui-touch-stack-page"
      data-slot={slot}
      aria-label={screen.title}
      aria-hidden={active ? undefined : true}
      inert={!active}
    >
      <div className="ui-touch-stack-shadow" aria-hidden="true" />
      <div className="ui-touch-stack-content">
        <StackContext value={nav}>
          <ScreenBody screen={screen} nav={nav} />
        </StackContext>
      </div>
      <div className="ui-touch-stack-dim" aria-hidden="true" />
    </section>
  )
})

/** Calls `render` as its own component so screens may use hooks. */
function ScreenBody({ screen, nav }: { screen: StackScreen; nav: StackNavigation }) {
  return <>{screen.render(nav)}</>
}
