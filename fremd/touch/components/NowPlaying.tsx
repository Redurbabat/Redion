import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { rubberband } from '../gesture/rubberband'
import { createVelocityTracker, type VelocityTracker } from '../gesture/velocity'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { useReducedMotion } from '../internal/useReducedMotion'
import { animateSpring, type SpringAnimation, type SpringAnimationOptions } from '../motion/animateSpring'
import { boxOf, correctedRadius, flipDelta, flipFrame, flipTransform, type FlipDelta } from '../motion/flip'
import { springPreset } from '../motion/presets'
import { Portal } from '../overlay/Portal'
import { useModal } from '../overlay/useModal'
import { IconButton } from './Button'
import { Cover } from './Cover'
import { ProgressBar } from './ProgressBar'
import { PlayPauseButton } from './SymbolSwap'
import './NowPlaying.css'

export interface NowPlayingTrack {
  title: string
  artist: string
  /** Image URL, or a CSS gradient / colour used as placeholder art. */
  artwork?: string | undefined
}

export interface NowPlayingLabels {
  /** Expand button of the mini player (the track is appended: "Player öffnen: Titel, Künstler"). */
  expand: string
  /** Grabber of the full player. */
  collapse: string
  play: string
  pause: string
  next: string
  previous: string
  /** Name of the playback position bar. */
  progress: string
  /** Prefix of the track-change announcement. */
  nowPlaying: string
}

export interface NowPlayingProps {
  track: NowPlayingTrack
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  /** Controlled full-screen state. */
  expanded?: boolean | undefined
  defaultExpanded?: boolean | undefined
  onExpandedChange?: ((expanded: boolean) => void) | undefined
  /** Without a handler the matching button is disabled. */
  onNext?: (() => void) | undefined
  onPrevious?: (() => void) | undefined
  /** Playback position 0…1 shown in the full player (placeholder bar). */
  progress?: number | undefined
  /** Portal target for the full player in contained layouts (e.g. a phone frame). Default document.body. */
  container?: HTMLElement | null | undefined
  labels?: Partial<NowPlayingLabels> | undefined
  /** Class of the mini player bar. */
  className?: string | undefined
}

const DEFAULT_LABELS: NowPlayingLabels = {
  expand: 'Player öffnen',
  collapse: 'Player schliessen',
  play: 'Abspielen',
  pause: 'Pausieren',
  next: 'Weiter',
  previous: 'Zurück',
  progress: 'Wiedergabeposition',
  nowPlaying: 'Jetzt läuft',
}

/** Visual corner radius of the artwork at both ends of the path (px). */
const MINI_RADIUS = 8
const FULL_RADIUS = 14
/** Release rule for the drag down (Vaul's close threshold, a firmer flick speed). */
const COLLAPSE_DISTANCE = 0.25
const COLLAPSE_VELOCITY = 800
/** Cross-fade length under reduced motion; matches NowPlaying.css. */
const FADE_MS = 200
/** Windows on the path (0 = mini, 1 = full screen). */
const PANEL_FADE_END = 0.35
const MINI_FADE_END = 0.3
const LATE_START = 0.6
/** How long after a drag a click still counts as the drag's own lift-off (ms). */
const CLICK_GUARD_MS = 400
/** Controls keep their own gestures; the grabber is the one button that also drags. */
const NO_DRAG =
  'button:not(.ui-touch-nowplaying-grabber), a[href], input, select, textarea, [role="slider"], [data-ui-touch-no-drag]'
const GRADIENT_OR_COLOUR =
  /^(?:(?:repeating-)?(?:linear|radial|conic)-gradient\(|#|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color-mix\(|color\(|var\()/i

const IDENTITY: FlipDelta = { x: 0, y: 0, scaleX: 1, scaleY: 1 }
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
/** Vertical shift, or no transform at all when there is nothing to shift (no layer kept at rest). */
const shiftY = (y: number) => (Math.abs(y) < 0.01 ? '' : `translate3d(0, ${y}px, 0)`)

/**
 * Release decision for dragging the full player down: collapse when pulled
 * further than a quarter of its height or flicked down faster than 800 px/s;
 * a clear flick back up always cancels.
 */
export function shouldCollapsePlayer({ distance, velocity, height }: { distance: number; velocity: number; height: number }): boolean {
  if (distance <= 0 || velocity <= -COLLAPSE_VELOCITY) return false
  if (velocity > COLLAPSE_VELOCITY) return true
  return distance > height * COLLAPSE_DISTANCE
}

function artworkProps(artwork: string | undefined): { src?: string; gradient?: string } {
  if (!artwork) return {}
  return GRADIENT_OR_COLOUR.test(artwork.trim()) ? { gradient: artwork } : { src: artwork }
}

/**
 * Replaces the spring in `slot` and keeps the new one there while it runs.
 * A spring that finishes synchronously (reduced motion) never lands in the
 * slot, so a finished animation is never mistaken for a running one.
 */
function startSpring(slot: { current: SpringAnimation | null }, options: SpringAnimationOptions) {
  slot.current?.stop()
  slot.current = null
  const handle: { anim: SpringAnimation | null; done: boolean } = { anim: null, done: false }
  handle.anim = animateSpring({
    ...options,
    onComplete: () => {
      handle.done = true
      if (slot.current === handle.anim) slot.current = null
      options.onComplete?.()
    },
  })
  if (!handle.done) slot.current = handle.anim
}

type Phase = 'closed' | 'expanding' | 'open' | 'collapsing'

interface Drag {
  pointerId: number
  startX: number
  startY: number
  origin: number
  state: 'pending' | 'dragging'
  tracker: VelocityTracker
}

/**
 * Mini player that grows into a full-screen player along one continuous
 * path — the shared-element (FLIP) journey of a music app.
 *
 * - The artwork is one visual object: the big cover starts exactly on the
 *   mini artwork (measured on both ends) and a single `gentle` spring moves
 *   it along; its corner radius is counter-scaled every frame so it stays
 *   8 px → 14 px on screen. The panel slides up out of the bar and fades
 *   in; grabber, texts and controls ride on it and fade in late. Collapse
 *   re-measures and runs the path back. Mounted open, it simply is open.
 * - While paused the big cover rests at 82 % (Cover); the path aims at that
 *   shrunken box so the landing is seamless.
 * - Drag the full player down (anywhere but on controls): it follows 1:1,
 *   rubber-bands upwards, and on release collapses when pulled past 25 % of
 *   its height or flicked faster than 800 px/s — the finger's speed is
 *   handed to the path spring. Otherwise it springs back with that speed.
 * - A11y: the bar's expand control is its own button (no nested controls);
 *   the full player is a modal dialog (focus in and back, Escape, inert
 *   page); track changes are announced politely.
 * - Reduced motion: a cross-fade between bar and player, no travel; the
 *   paused cover dims instead of shrinking.
 */
export function NowPlaying({
  track,
  playing,
  onPlayingChange,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onNext,
  onPrevious,
  progress: position = 0,
  container,
  labels,
  className,
}: NowPlayingProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const reduced = useReducedMotion()
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  // Mounted expanded, the player is simply open: nothing plays on the first render.
  const [phase, setPhase] = useState<Phase>(isExpanded ? 'open' : 'closed')
  const titleId = useId()
  const artistId = useId()

  // Track changes are announced (not the first track) once, by the view the
  // listener is in: the other live region stays empty, so closing or opening
  // the player never repeats old news.
  const trackKey = `${track.title}\u0000${track.artist}`
  const surface = isExpanded ? 'full' : 'mini'
  const [announced, setAnnounced] = useState({ key: trackKey, text: '', surface })
  if (announced.key !== trackKey) {
    setAnnounced({ key: trackKey, text: `${l.nowPlaying}: ${track.title}, ${track.artist}`, surface })
  }

  if (isExpanded && (phase === 'closed' || phase === 'collapsing')) setPhase('expanding')
  if (!isExpanded && (phase === 'open' || phase === 'expanding')) setPhase('collapsing')
  const mounted = phase !== 'closed'

  // ── elements ─────────────────────────────────────────────────────────
  const miniRef = useRef<HTMLDivElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const miniArtRef = useRef<HTMLDivElement>(null)
  const miniTextRef = useRef<HTMLSpanElement>(null)
  const miniControlsRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const grabberRef = useRef<HTMLButtonElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef<HTMLDivElement>(null)
  const transportRef = useRef<HTMLDivElement>(null)

  // Path state lives in refs: per-frame work never re-renders React.
  const geo = useRef({ delta: IDENTITY, coverScale: 1, travel: 0, height: 0 })
  const progress = useRef(0) // 0 = mini, 1 = full screen
  const offset = useRef(0) // finger offset of the full player (px, carried along the path)
  const fadeMode = useRef(false)
  const pathAnim = useRef<SpringAnimation | null>(null)
  const offsetAnim = useRef<SpringAnimation | null>(null)
  const drag = useRef<Drag | null>(null)
  /** Until when (performance.now) a click is the lift-off of a drag and is swallowed. */
  const suppressClickUntil = useRef(0)
  const firstRun = useRef(true)
  const latest = useRef({ onExpandedChange, controlled: expanded !== undefined, reduced, phase })
  useLayoutEffect(() => {
    latest.current = { onExpandedChange, controlled: expanded !== undefined, reduced, phase }
  })

  const requestExpanded = useCallback((next: boolean) => {
    if (!latest.current.controlled) setInternalExpanded(next)
    latest.current.onExpandedChange?.(next)
  }, [])

  const { pressed, pressProps } = usePress<HTMLButtonElement>()

  // ── geometry ─────────────────────────────────────────────────────────
  const panelHeight = () =>
    dialogRef.current?.getBoundingClientRect().height || container?.clientHeight || window.innerHeight

  /** First/Last boxes, measured without our transforms. False when there is no path to travel. */
  const measure = (): boolean => {
    const dialog = dialogRef.current
    const art = artRef.current
    const cover = coverRef.current
    if (!dialog || !art || !cover) return false
    art.style.transform = ''
    if (bodyRef.current) bodyRef.current.style.transform = ''
    if (backdropRef.current) backdropRef.current.style.transform = ''
    const panel = boxOf(dialog)
    const slot = boxOf(art)
    // The cover's own box includes its pause shrink, so the path lands on what is visible.
    const target = boxOf(cover)
    const miniArt = miniArtRef.current ? boxOf(miniArtRef.current) : null
    const bar = miniRef.current ? boxOf(miniRef.current) : null
    const height = panel.height || container?.clientHeight || window.innerHeight
    // A zero-size box (hidden bar, unmounted) cannot be a path end: cross-fade instead.
    const valid = Boolean(miniArt && bar && miniArt.width > 0 && miniArt.height > 0 && target.width > 0 && target.height > 0)
    geo.current = {
      delta: valid && miniArt ? flipDelta(miniArt, target) : IDENTITY,
      coverScale: slot.width > 0 && target.width > 0 ? target.width / slot.width : 1,
      travel: valid && bar ? bar.top - panel.top : height,
      height,
    }
    return valid
  }

  // ── painting one frame ───────────────────────────────────────────────
  const paint = () => {
    const p = progress.current
    const lift = offset.current * p
    const { delta, coverScale, travel, height } = geo.current
    const frame = flipFrame(delta, p)
    const identity = frame.x === 0 && frame.y === 0 && frame.scaleX === 1 && frame.scaleY === 1

    const art = artRef.current
    if (art) art.style.transform = identity ? '' : flipTransform(frame)
    const cover = coverRef.current
    if (cover) {
      if (identity) cover.style.removeProperty('--ui-touch-cover-radius')
      else {
        const visual = MINI_RADIUS + (FULL_RADIUS * coverScale - MINI_RADIUS) * clamp01(p)
        cover.style.setProperty(
          '--ui-touch-cover-radius',
          correctedRadius(visual, frame.scaleX * coverScale, frame.scaleY * coverScale),
        )
      }
    }
    // Where the panel is on its way up (0 = at rest), without the finger's share.
    const ride = travel * (1 - p)
    if (bodyRef.current) bodyRef.current.style.transform = shiftY(lift)
    const backdrop = backdropRef.current
    if (backdrop) {
      backdrop.style.transform = shiftY(ride + lift)
      backdrop.style.opacity = String(clamp01(p / PANEL_FADE_END))
    }
    if (scrimRef.current) {
      scrimRef.current.style.opacity = String(clamp01(p) * (1 - clamp01(lift / (height || 1))))
    }
    // Grabber, texts and controls ride on the panel (the grabber stays on its top
    // edge) and fade in late, once the artwork has most of its way behind it.
    const late = clamp01((p - LATE_START) / (1 - LATE_START))
    for (const el of [grabberRef.current, metaRef.current, positionRef.current, transportRef.current]) {
      if (!el) continue
      el.style.opacity = String(late)
      el.style.transform = shiftY(ride)
    }
    if (fadeMode.current) return
    // One artwork on screen: the mini one hides while the big one travels.
    if (miniArtRef.current) miniArtRef.current.style.opacity = '0'
    const miniFade = String(1 - clamp01(p / MINI_FADE_END))
    if (miniTextRef.current) miniTextRef.current.style.opacity = miniFade
    if (miniControlsRef.current) miniControlsRef.current.style.opacity = miniFade
  }

  const clearMini = () => {
    for (const el of [miniArtRef.current, miniTextRef.current, miniControlsRef.current]) el?.style.removeProperty('opacity')
  }

  const setWillChange = (on: boolean) => {
    for (const el of [artRef.current, backdropRef.current, bodyRef.current]) {
      if (el) el.style.willChange = on ? 'transform' : ''
    }
  }

  // ── springs ──────────────────────────────────────────────────────────
  const runPath = (to: number, velocity: number, onDone?: () => void) => {
    setWillChange(true)
    startSpring(pathAnim, {
      from: progress.current,
      to,
      velocity,
      params: springPreset('gentle'),
      restDelta: 0.001,
      restSpeed: 0.02,
      reducedMotion: latest.current.reduced,
      onUpdate: (value) => {
        progress.current = value
        paint()
      },
      onComplete: () => {
        setWillChange(false)
        onDone?.()
      },
    })
  }

  const runOffset = (to: number, velocity: number) => {
    startSpring(offsetAnim, {
      from: offset.current,
      to,
      velocity,
      params: springPreset('smooth'),
      restDelta: 0.5,
      restSpeed: 10,
      reducedMotion: latest.current.reduced,
      onUpdate: (value) => {
        offset.current = value
        paint()
      },
      onComplete: () => {
        if (!pathAnim.current) setWillChange(false)
      },
    })
  }

  const finishCollapse = () => {
    progress.current = 0
    offset.current = 0
    clearMini()
    setPhase('closed')
  }

  // ── the path: expand / collapse ──────────────────────────────────────
  useLayoutEffect(() => {
    const first = firstRun.current
    firstRun.current = false
    if (phase === 'open' && first) {
      // Mounted open: the full player is just there (no path, no fade).
      fadeMode.current = latest.current.reduced || !measure()
      progress.current = 1
      paint()
      return
    }
    if (phase === 'expanding') {
      // Interrupting a collapse keeps its speed (the path simply turns around).
      const velocity = pathAnim.current?.stop().velocity ?? 0
      pathAnim.current = null
      offsetAnim.current?.stop()
      offsetAnim.current = null
      const fade = latest.current.reduced || !measure()
      fadeMode.current = fade
      layerRef.current?.toggleAttribute('data-fade', fade)
      if (fade) {
        progress.current = 1
        offset.current = 0
        paint()
        clearMini()
        setPhase('open')
        return
      }
      paint() // frame 0 before the first paint: the big artwork sits on the mini one
      if (offset.current !== 0) runOffset(0, 0)
      runPath(1, velocity, () => setPhase('open'))
      return
    }
    if (phase === 'collapsing') {
      // A drag release already started the way home with the finger's speed.
      if (pathAnim.current && pathAnim.current.target === 0) return
      const velocity = pathAnim.current?.stop().velocity ?? 0
      pathAnim.current = null
      offsetAnim.current?.stop()
      offsetAnim.current = null
      const fade = latest.current.reduced || !measure()
      fadeMode.current = fade
      layerRef.current?.toggleAttribute('data-fade', fade)
      if (fade) {
        clearMini()
        paint()
        // The fade-out is a CSS transition on [data-fade][data-phase="collapsing"].
        const timer = window.setTimeout(finishCollapse, FADE_MS + 20)
        return () => window.clearTimeout(timer)
      }
      paint()
      runPath(0, velocity, finishCollapse)
    }
    return undefined
    // Runs once per phase change; the helpers only read refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(
    () => () => {
      pathAnim.current?.stop()
      offsetAnim.current?.stop()
    },
    [],
  )

  useModal({
    open: mounted && phase !== 'collapsing',
    onClose: () => requestExpanded(false),
    containerRef: dialogRef,
    layerRef,
    initialFocusRef: dialogRef,
  })

  // useModal gives focus back to where it was before opening. A tap does not
  // focus a button in Safari, so that can be nothing: then the mini player
  // takes it (runs after useModal's cleanup — cleanups run before effects).
  useEffect(() => {
    if (phase !== 'collapsing') return
    const active = document.activeElement
    if (!active || active === document.body || layerRef.current?.contains(active)) {
      openRef.current?.focus({ preventScroll: true })
    }
  }, [phase])

  // ── drag down to collapse ────────────────────────────────────────────
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A second finger neither takes over a running drag nor ends it.
    if (drag.current?.state === 'dragging') return
    suppressClickUntil.current = 0
    if (event.button !== 0 || latest.current.phase !== 'open') return
    if ((event.target as Element).closest(NO_DRAG)) return
    // Grab a returning player where it is (interruptible).
    offsetAnim.current?.stop()
    offsetAnim.current = null
    const tracker = createVelocityTracker()
    tracker.add(offset.current, event.timeStamp)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset.current,
      state: 'pending',
      tracker,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    if (latest.current.phase !== 'open') {
      // Closed meanwhile (Escape): the path took over from where the finger was.
      drag.current = null
      event.currentTarget.removeAttribute('data-dragging')
      return
    }
    if (d.state === 'pending') {
      const axis = lockAxis(event.clientX - d.startX, event.clientY - d.startY, slopFor(event.pointerType))
      if (axis === null) return
      if (axis === 'x') {
        drag.current = null // sideways belongs to future scrubbers / carousels
        return
      }
      d.state = 'dragging'
      d.startY = event.clientY // start here, so the slop does not make the player jump
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer is already gone; the drag still works without capture.
      }
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
      event.currentTarget.setAttribute('data-dragging', '')
      geo.current.height = panelHeight()
      setWillChange(true)
    }
    const raw = d.origin + (event.clientY - d.startY)
    offset.current = raw < 0 ? -rubberband(-raw, geo.current.height) : raw
    paint()
    d.tracker.add(offset.current, event.timeStamp)
  }

  /** pointerup decides; pointercancel and a lost capture spring back. */
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    drag.current = null
    if (d.state !== 'dragging') return
    event.currentTarget.removeAttribute('data-dragging')
    // The lift at the end of a drag is not a tap (only right after it: a later click is real).
    suppressClickUntil.current = performance.now() + CLICK_GUARD_MS
    const velocity = d.tracker.velocity(event.timeStamp)
    const collapse =
      event.type === 'pointerup' &&
      shouldCollapsePlayer({ distance: offset.current, velocity, height: geo.current.height })
    if (!collapse) {
      runOffset(0, velocity)
      return
    }
    if (!latest.current.reduced && measure()) {
      fadeMode.current = false
      layerRef.current?.removeAttribute('data-fade')
      paint()
      // Hand the finger's speed to the path: the panel covers `travel - offset` px until p = 0.
      const span = Math.max(geo.current.travel - offset.current, 120)
      runPath(0, -Math.min(Math.max(velocity, 0) / span, 6), finishCollapse)
    }
    requestExpanded(false)
  }

  const artwork = artworkProps(track.artwork)
  const ambient = artwork.gradient ?? (artwork.src ? `url(${JSON.stringify(artwork.src)})` : undefined)

  return (
    <>
      <div
        ref={miniRef}
        className={cx('ui-touch-nowplaying-mini', className)}
        data-pressed={pressed || undefined}
      >
        <Cover ref={miniArtRef} className="ui-touch-nowplaying-mini-art" playing size={48} {...artwork} />
        <button
          {...pressProps}
          ref={openRef}
          type="button"
          className="ui-touch-nowplaying-open"
          aria-label={`${l.expand}: ${track.title}, ${track.artist}`}
          aria-haspopup="dialog"
          aria-expanded={isExpanded}
          onClick={() => requestExpanded(true)}
        >
          <span ref={miniTextRef} className="ui-touch-nowplaying-mini-text">
            <span className="ui-touch-nowplaying-mini-title">{track.title}</span>
            <span className="ui-touch-nowplaying-mini-artist">{track.artist}</span>
          </span>
        </button>
        <div ref={miniControlsRef} className="ui-touch-nowplaying-mini-controls">
          <PlayPauseButton
            playing={playing}
            onPlayingChange={(next) => onPlayingChange(next)}
            playLabel={l.play}
            pauseLabel={l.pause}
            variant="plain"
          />
          <IconButton icon="skip-forward" label={l.next} variant="plain" disabled={!onNext} onClick={() => onNext?.()} />
        </div>
        <span className="ui-touch-visually-hidden" aria-live="polite">
          {announced.surface === 'mini' ? announced.text : ''}
        </span>
      </div>

      {mounted && (
        <Portal container={container}>
          <div
            ref={layerRef}
            className={cx('ui-touch-nowplaying-layer', container && 'ui-touch-nowplaying-layer--contained')}
            data-phase={phase}
            inert={phase === 'collapsing' || undefined}
          >
            <div ref={scrimRef} className="ui-touch-nowplaying-scrim" aria-hidden="true" onClick={() => requestExpanded(false)} />
            <div
              ref={dialogRef}
              className="ui-touch-nowplaying-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={artistId}
              tabIndex={-1}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={(event) => {
                // Only the player's own capture: a touch starts captured by the pressed
                // element, and taking it over fires this there (it bubbles up here).
                if (event.target === event.currentTarget) endDrag(event)
              }}
              onKeyDownCapture={() => {
                suppressClickUntil.current = 0
              }}
              onClickCapture={(event) => {
                if (performance.now() > suppressClickUntil.current) return
                suppressClickUntil.current = 0
                event.preventDefault()
                event.stopPropagation()
              }}
            >
              <div
                ref={backdropRef}
                className="ui-touch-nowplaying-backdrop"
                aria-hidden="true"
                style={ambient ? ({ '--ui-touch-nowplaying-ambient': ambient } as CSSProperties) : undefined}
              >
                <div className="ui-touch-nowplaying-ambient" />
              </div>
              <div ref={bodyRef} className="ui-touch-nowplaying-body">
                <button
                  ref={grabberRef}
                  type="button"
                  className="ui-touch-nowplaying-grabber"
                  aria-label={l.collapse}
                  onClick={() => requestExpanded(false)}
                >
                  <span aria-hidden="true" />
                </button>
                <div className="ui-touch-nowplaying-stage">
                  <div ref={artRef} className="ui-touch-nowplaying-art">
                    <Cover ref={coverRef} className="ui-touch-nowplaying-cover" playing={playing} size="fill" {...artwork} />
                  </div>
                </div>
                <div ref={metaRef} className="ui-touch-nowplaying-meta">
                  <h2 id={titleId} className="ui-touch-nowplaying-title">
                    {track.title}
                  </h2>
                  <p id={artistId} className="ui-touch-nowplaying-artist">
                    {track.artist}
                  </p>
                </div>
                <div ref={positionRef} className="ui-touch-nowplaying-position">
                  <ProgressBar value={position} label={l.progress} />
                </div>
                <div ref={transportRef} className="ui-touch-nowplaying-transport">
                  <IconButton
                    icon="skip-back"
                    label={l.previous}
                    variant="plain"
                    size="large"
                    disabled={!onPrevious}
                    onClick={() => onPrevious?.()}
                  />
                  <PlayPauseButton
                    playing={playing}
                    onPlayingChange={(next) => onPlayingChange(next)}
                    playLabel={l.play}
                    pauseLabel={l.pause}
                    size="large"
                  />
                  <IconButton
                    icon="skip-forward"
                    label={l.next}
                    variant="plain"
                    size="large"
                    disabled={!onNext}
                    onClick={() => onNext?.()}
                  />
                </div>
                <span className="ui-touch-visually-hidden" aria-live="polite">
                  {announced.surface === 'full' ? announced.text : ''}
                </span>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
