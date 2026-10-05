import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { keepFocusInList } from '../internal/keepFocusInList'
import { usePress } from '../internal/usePress'
import { useReducedMotion } from '../internal/useReducedMotion'
import './DeleteButton.css'

export interface DeleteButtonProps {
  /** Runs once when the second step, the confirm pill, is pressed. */
  onDelete: () => void
  /** Name of the round button and text of the confirm pill (default "Löschen"). */
  label?: string | undefined
  /** Text of the cancel pill (default "Abbrechen"). */
  cancelLabel?: string | undefined
  /**
   * What is deleted, for screen readers: the round button, the pair and the
   * confirm pill are then announced as "<label>: <context>" (e.g. "Löschen:
   * Nachtfahrt") while the pill still shows "Löschen" — like SwipeActions.
   */
  context?: string | undefined
  /** Glyph of the round button (default `trash`). */
  icon?: GlyphName | undefined
  /**
   * Where the pair grows from the circle: towards the inline end (default),
   * or towards the start for a button at the end edge of a row. Follows the
   * writing direction (RTL flips both).
   */
  expand?: 'end' | 'start' | undefined
  disabled?: boolean | undefined
  /** Called whenever the pair opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined
  className?: string | undefined
}

/** Text inset of a pill (px) and its smallest width (two circles). */
const PILL_INSET = 20
const PILL_MIN = 88
/**
 * How long the pills take to flow into place. After a pointer opened the pair,
 * the confirm pill ignores clicks this long: it lies where the circle was, so
 * the second click of a double click would otherwise delete. Meanwhile the
 * pills show no hover tint and no focus ring (it would outline empty space).
 */
const SETTLE_IN_MS = 400
/** How long the host stays raised above its neighbours after closing (the pair flows back meanwhile). */
const SETTLE_OUT_MS = 450
/** Goo filter: blur radius and alpha threshold (alpha × GAIN − SHIFT) — fuses pieces closer than about 6 px. */
const GOO_BLUR = 4
const GOO_GAIN = 18
const GOO_SHIFT = 7

const pillWidth = (text: number) => Math.max(PILL_MIN, Math.ceil(text + 2 * PILL_INSET))

/**
 * Two-step delete. A round button with a trash glyph; pressing it lets the
 * circle flow like a liquid into two pills — "Löschen" grows out of the
 * circle (the glyph turns into the word), "Abbrechen" squeezes out beside it,
 * joined for a moment by a neck that stretches and snaps. Cancel flows the
 * pair back into the circle.
 *
 * - The pair is an overlay anchored at the circle: nothing around it moves.
 * - The blob is built from pieces that only translate and scale (end circles,
 *   middles stretched in X), fused by a static SVG goo filter; the words
 *   sharpen by cross-fading from a statically blurred copy (opacity only).
 *   Opening runs on the `bouncy` spring, closing on `snappy`.
 * - Keyboard and screen readers: the round button has `aria-expanded` and
 *   `aria-controls`; opening moves focus to "Abbrechen" (the safe choice);
 *   Tab moves between the pills; Escape closes and returns focus to the
 *   round button. Focus leaving the pair, a press outside or activating the
 *   round button again (screen readers; for a pointer the confirm pill lies
 *   over the circle) closes it. The confirm pill calls `onDelete` once and
 *   closes; when the app then removes the row, focus moves on to the next
 *   row (or the one above), as with SwipeActions.
 * - A double click on the circle does not delete: the confirm pill is armed
 *   only after the pair has opened.
 * - Reduced motion (system or `data-ui-motion="reduce"`): no morph, the pair
 *   fades in over the circle. Forced colours: plain outlined buttons.
 */
export function DeleteButton({
  onDelete,
  label = 'Löschen',
  cancelLabel = 'Abbrechen',
  context,
  icon = 'trash',
  expand = 'end',
  disabled = false,
  onOpenChange,
  className,
}: DeleteButtonProps) {
  const [open, setOpenState] = useState(false)
  // Set by the first open: only then may the one-shot blur flashes run (never on mount).
  const [played, setPlayed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [settling, setSettling] = useState(false)
  const [widths, setWidths] = useState({ a: PILL_MIN, b: PILL_MIN })
  const reduced = useReducedMotion()

  const hostRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pairRef = useRef<HTMLSpanElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmTextRef = useRef<HTMLSpanElement>(null)
  const cancelTextRef = useRef<HTMLSpanElement>(null)
  const openRef = useRef(false)
  const deleted = useRef(false)
  const armedUntil = useRef(0)
  const focusCancel = useRef(false)
  const onOpenChangeRef = useRef(onOpenChange)
  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  const uid = useId().replace(/[^\w-]/g, '')
  const pairId = `ui-touch-delete-pair-${uid}`
  const filterId = `ui-touch-delete-goo-${uid}`
  const name = context ? `${label}: ${context}` : label

  /** Pill widths from the rendered words (a web font may have arrived since the last measure). */
  const measure = () => {
    const a = pillWidth(confirmTextRef.current?.offsetWidth ?? 0)
    const b = pillWidth(cancelTextRef.current?.offsetWidth ?? 0)
    setWidths((w) => (w.a === a && w.b === b ? w : { a, b }))
  }
  useLayoutEffect(measure, [label, cancelLabel])

  const setOpen = (next: boolean) => {
    if (openRef.current === next) return
    openRef.current = next
    setOpenState(next)
    setPlayed(true)
    setClosing(!next)
    onOpenChangeRef.current?.(next)
  }

  const close = (returnFocus: boolean) => {
    if (!openRef.current) return
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }

  // Opening hands the focus to "Abbrechen" (the pair is no longer inert once this runs).
  useEffect(() => {
    if (!open || !focusCancel.current) return
    focusCancel.current = false
    cancelRef.current?.focus({ preventScroll: true })
  }, [open])

  // A press anywhere outside closes the pair.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!hostRef.current?.contains(event.target as Node)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Turned disabled while open: fold back.
  useEffect(() => {
    if (disabled) close(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  useEffect(() => {
    if (!settling) return
    const timer = setTimeout(() => setSettling(false), SETTLE_IN_MS)
    return () => clearTimeout(timer)
  }, [settling])

  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setClosing(false), SETTLE_OUT_MS)
    return () => clearTimeout(timer)
  }, [closing])

  const trigger = usePress<HTMLButtonElement>({}, disabled)
  const confirm = usePress<HTMLButtonElement>({})
  const cancel = usePress<HTMLButtonElement>({})

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (openRef.current) {
      close(false) // a second press on the circle folds the pair back
      return
    }
    measure()
    deleted.current = false
    // detail > 0: a real pointer click (a key press on a button reports 0).
    armedUntil.current = event.detail > 0 ? performance.now() + SETTLE_IN_MS : 0
    setSettling(true)
    focusCancel.current = true
    setOpen(true)
  }

  const onConfirm = () => {
    if (!openRef.current || deleted.current || performance.now() < armedUntil.current) return
    deleted.current = true
    keepFocusInList(hostRef.current)
    close(true)
    onDelete()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'Escape' || !openRef.current) return
    // Handled: a surrounding sheet or dialog leaves this Escape alone (useModal skips defaultPrevented).
    event.preventDefault()
    close(true)
  }

  const onPairBlur = (event: FocusEvent<HTMLSpanElement>) => {
    const to = event.relatedTarget as Node | null
    // Focus went to something outside the pair (the round button counts as outside). Null = the window
    // lost focus or a click on nothing focusable; a press outside is handled by the pointerdown listener.
    if (to && !pairRef.current?.contains(to)) close(false)
  }

  const confirmButton = (
    <button
      key="confirm"
      type="button"
      {...confirm.pressProps}
      className="ui-touch-delete-choice ui-touch-delete-choice--confirm"
      aria-label={context ? name : undefined}
      onClick={onConfirm}
    >
      <span className="ui-touch-delete-face">
        <span ref={confirmTextRef} className="ui-touch-delete-text">
          {label}
        </span>
        <span className="ui-touch-delete-smear" aria-hidden="true">
          {label}
        </span>
      </span>
    </button>
  )
  const cancelButton = (
    <button
      key="cancel"
      ref={cancelRef}
      type="button"
      {...cancel.pressProps}
      className="ui-touch-delete-choice ui-touch-delete-choice--cancel"
      onClick={() => close(true)}
    >
      <span className="ui-touch-delete-face">
        <span ref={cancelTextRef} className="ui-touch-delete-text">
          {cancelLabel}
        </span>
        <span className="ui-touch-delete-smear" aria-hidden="true">
          {cancelLabel}
        </span>
      </span>
    </button>
  )

  const style = {
    '--ui-touch-delete-a': `${widths.a}px`,
    '--ui-touch-delete-b': `${widths.b}px`,
    '--ui-touch-delete-filter': `url(#${filterId})`,
  } as CSSProperties

  return (
    <span
      ref={hostRef}
      className={cx('ui-touch-delete', className)}
      data-expand={expand}
      data-open={open || undefined}
      data-closing={(closing && !open) || undefined}
      data-played={played || undefined}
      data-settling={(settling && open) || undefined}
      data-reduced={reduced || undefined}
      data-disabled={disabled || undefined}
      style={style}
      onKeyDown={onKeyDown}
    >
      <svg className="ui-touch-delete-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id={filterId} x="-10%" y="-25%" width="120%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_GAIN} -${GOO_SHIFT}`}
            result="goo"
          />
          <feDropShadow className="ui-touch-delete-edge" in="goo" dx="0" dy="0" stdDeviation="0.5" result="edged" />
          <feDropShadow className="ui-touch-delete-shadow" in="edged" dx="0" dy="2" stdDeviation="3" />
        </filter>
      </svg>
      <button
        ref={triggerRef}
        type="button"
        {...trigger.pressProps}
        className="ui-touch-delete-trigger"
        aria-label={name}
        aria-expanded={open}
        aria-controls={pairId}
        disabled={disabled}
        onClick={onTriggerClick}
      >
        <span className="ui-touch-delete-icon">
          <Glyph name={icon} size={20} className="ui-touch-delete-glyph" />
          {/* The blurred copy is filled: blurred, a line glyph would thin out to a pale haze. */}
          <Glyph name={icon} size={20} filled className="ui-touch-delete-glyph ui-touch-delete-glyph--smear" />
        </span>
      </button>
      {/* DOM (and Tab) order follows the visual order: the confirm pill sits where the circle was. */}
      <span
        ref={pairRef}
        id={pairId}
        role="group"
        aria-label={name}
        className="ui-touch-delete-pair"
        inert={!open}
        onBlur={onPairBlur}
      >
        {expand === 'start' ? [cancelButton, confirmButton] : [confirmButton, cancelButton]}
      </span>
      {/* The liquid: pieces that only move and scale, fused by the goo filter. */}
      <span className="ui-touch-delete-goo" aria-hidden="true">
        <span className="ui-touch-delete-press">
          <span className="ui-touch-delete-blob ui-touch-delete-blob--a">
            <span className="ui-touch-delete-piece" />
            <span className="ui-touch-delete-piece ui-touch-delete-piece--mid" />
            <span className="ui-touch-delete-piece ui-touch-delete-piece--end" />
          </span>
          <span className="ui-touch-delete-blob ui-touch-delete-blob--b">
            <span className="ui-touch-delete-piece" />
            <span className="ui-touch-delete-piece ui-touch-delete-piece--mid" />
            <span className="ui-touch-delete-piece ui-touch-delete-piece--end" />
          </span>
        </span>
      </span>
    </span>
  )
}
