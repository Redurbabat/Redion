import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { Glyph } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './Stepper.css'

/** +1 = increment, -1 = decrement. */
export type StepDirection = 1 | -1

export interface StepOptions {
  /** Lower bound, also the anchor of the step grid (default: unbounded, grid anchored at 0). */
  min?: number | undefined
  /** Upper bound (default: unbounded). */
  max?: number | undefined
  /** Step size, must be > 0 (default 1). */
  step?: number | undefined
}

/** Decimals needed to write `n` exactly: 0.1 → 1, 2.25 → 2, 1e-7 → 7. */
function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0
  const [mantissa = '', exponent = '0'] = String(n).toLowerCase().split('e')
  const fraction = mantissa.split('.')[1]?.length ?? 0
  return Math.max(0, fraction - Number(exponent))
}

/** Precision a stepper with these options works in (the step's and min's decimals). */
function precisionOf(step: number, min: number) {
  return Math.max(decimalsOf(step), decimalsOf(Number.isFinite(min) ? min : 0))
}

/**
 * One step up or down, the way a stepper should count:
 * - float-safe: the result is rounded to the step's (and min's) decimals, so
 *   0.2 + 0.1 gives 0.3, not 0.30000000000000004;
 * - on a grid anchored at `min` (or 0): an off-grid value moves to the next
 *   grid value in that direction, like `<input type="number">`;
 * - clamped to `min` / `max` (the last step may be shorter to land on a bound).
 */
export function stepValue(value: number, direction: StepDirection, options: StepOptions = {}): number {
  const { min = -Infinity, step = 1 } = options
  // Like native inputs: a max below min collapses the range onto min.
  const max = Math.max(min, options.max ?? Infinity)
  const size = step > 0 && Number.isFinite(step) ? step : 1
  const base = Number.isFinite(min) ? min : 0
  const decimals = precisionOf(size, min)
  if (Number.isNaN(value)) return Math.min(max, Math.max(min, base))

  // Grid position; float noise like 2.9999999999999996 counts as on-grid.
  const position = (value - base) / size
  const nearest = Math.round(position)
  const onGrid = Math.abs(position - nearest) < 1e-9 * Math.max(1, Math.abs(position))
  const index = onGrid ? nearest + direction : direction > 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1
  const next = Number((base + index * size).toFixed(Math.min(decimals, 100)))
  // `|| 0` turns -0 into 0.
  return Math.min(max, Math.max(min, next)) || 0
}

/** Clamps into min..max; a max below min collapses onto min (as in stepValue). */
function clampTo(value: number, min: number, max: number) {
  return Math.min(Math.max(min, max), Math.max(min, value))
}

/** Hold-to-repeat timing (ms): first repeat after HOLD_DELAY, then 100 ms, 90, 80 … down to 50. */
const HOLD_DELAY = 400
const REPEAT_START = 100
const REPEAT_FLOOR = 50
const REPEAT_ACCELERATION = 10

function repeatInterval(repeatIndex: number) {
  return Math.max(REPEAT_FLOOR, REPEAT_START - repeatIndex * REPEAT_ACCELERATION)
}

export interface StepperProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'defaultValue' | 'children'> {
  /** Accessible name of the group (e.g. "Anzahl"). */
  label: string
  /** Controlled value. */
  value?: number | undefined
  /** Initial value when uncontrolled (default: `min`, or 0 when min is unbounded; clamped into range). */
  defaultValue?: number | undefined
  onChange?: ((value: number) => void) | undefined
  /** Default 0 (like a native iOS stepper). Pass -Infinity for no lower bound. */
  min?: number | undefined
  /** Default 100. Pass Infinity for no upper bound. */
  max?: number | undefined
  /** Default 1. */
  step?: number | undefined
  /** Text shown for a value (default: locale number with the step's decimals). */
  format?: ((value: number) => string) | undefined
  /** Accessible name of the minus button. */
  decrementLabel?: string | undefined
  /** Accessible name of the plus button. */
  incrementLabel?: string | undefined
  disabled?: boolean | undefined
  /** Adds a hidden input so the value submits with a form. */
  name?: string | undefined
}

interface Roll {
  value: number
  previous?: number
  direction: 'up' | 'down'
  /** Increments per change: new keys restart the roll animation. */
  seq: number
}

/**
 * Minus / value / plus in one capsule.
 *
 * Motion: the number rolls like a counter drum (old value leaves upwards on
 * increment, downwards on decrement), the capsule rocks towards the pressed
 * side and each button has the press spring. Holding a button repeats:
 * after 400 ms, then faster and faster (100 → 50 ms).
 *
 * A button at a bound is `aria-disabled` rather than `disabled`, so keyboard
 * focus is not dropped when the value reaches the end. The value window is as
 * wide as the widest finite bound, so the buttons never shift mid-hold, and
 * the live value is `aria-busy` while a hold repeats.
 */
export function Stepper({
  label,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
  decrementLabel = 'Weniger',
  incrementLabel = 'Mehr',
  disabled = false,
  name,
  className,
  onKeyDown,
  ...rest
}: StepperProps) {
  const controlled = value !== undefined
  const [inner, setInner] = useState(() => clampTo(defaultValue ?? (Number.isFinite(min) ? min : 0), min, max))
  const current = controlled ? value : inner
  const outputId = useId()

  // The latest known value, updated optimistically while a hold repeats
  // (several ticks can run before React re-renders).
  const latest = useRef(current)
  useLayoutEffect(() => {
    latest.current = current
  }, [current])

  const commit = (next: number) => {
    if (Object.is(next, latest.current)) return false
    latest.current = next
    if (!controlled) setInner(next)
    onChange?.(next)
    return true
  }
  const stepBy = (direction: StepDirection) => commit(stepValue(latest.current, direction, { min, max, step }))

  // Timers call the newest stepBy (fresh props), not the one from when the hold began.
  const stepRef = useRef(stepBy)
  useLayoutEffect(() => {
    stepRef.current = stepBy
  })

  // ── Hold to repeat ──
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** A hold produced steps: swallow the click that ends it. */
  const heldSteps = useRef(false)
  const [repeating, setRepeating] = useState(false)

  const clearTimer = () => {
    clearTimeout(timer.current)
    timer.current = undefined
  }
  const stopHold = () => {
    clearTimer()
    setRepeating(false)
  }
  useEffect(() => clearTimer, [])

  const startHold = (direction: StepDirection, button: HTMLButtonElement) => {
    clearTimer()
    heldSteps.current = false
    latest.current = current
    const schedule = (delay: number, repeatIndex: number) => {
      timer.current = setTimeout(() => {
        // Disabled mid-hold (prop or a disabled <fieldset>): stop like a native control.
        if (button.matches(':disabled') || !stepRef.current(direction)) {
          stopHold()
          return
        }
        heldSteps.current = true
        setRepeating(true)
        schedule(repeatInterval(repeatIndex), repeatIndex + 1)
      }, delay)
    }
    schedule(HOLD_DELAY, 0)
  }

  const activate = (direction: StepDirection, event: MouseEvent<HTMLButtonElement>) => {
    // Pointer clicks have detail >= 1; keyboard / assistive-tech clicks have 0 and always count.
    if (heldSteps.current && event.detail !== 0) {
      heldSteps.current = false
      return
    }
    heldSteps.current = false
    latest.current = current
    stepBy(direction)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (disabled || event.defaultPrevented) return
    latest.current = current
    if (event.key === 'ArrowUp') stepBy(1)
    else if (event.key === 'ArrowDown') stepBy(-1)
    else if (event.key === 'Home' && Number.isFinite(min)) commit(min)
    else if (event.key === 'End' && Number.isFinite(max)) commit(max)
    else return
    event.preventDefault()
  }

  // ── Rolling number: remember the previous value and the direction of each change ──
  const [roll, setRoll] = useState<Roll>({ value: current, direction: 'up', seq: 0 })
  if (!Object.is(roll.value, current)) {
    setRoll({ value: current, previous: roll.value, direction: current > roll.value ? 'up' : 'down', seq: roll.seq + 1 })
  }
  // Settled: the same roll without a leaving value.
  const settleRoll = (seq: number) =>
    setRoll((r) => (r.seq === seq ? { value: r.value, direction: r.direction, seq: r.seq } : r))

  const decimals = precisionOf(step > 0 ? step : 1, min)
  const show =
    format ?? ((n: number) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
  // Invisible copies of the finite bounds hold the value window at its widest,
  // so the buttons do not move under the finger when the digit count changes.
  const reserved = [min, max].filter(Number.isFinite).map(show)

  const buttonFor = (direction: StepDirection) => {
    const atBound = direction > 0 ? current >= max : current <= min
    return (
      <StepperButton
        direction={direction}
        label={direction > 0 ? incrementLabel : decrementLabel}
        atBound={atBound}
        disabled={disabled}
        controls={outputId}
        onPointerDown={(event) => {
          const button = event.currentTarget
          if (event.button === 0 && !atBound && !disabled && !button.matches(':disabled')) startHold(direction, button)
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onBlur={stopHold}
        onClick={(event) => activate(direction, event)}
        onContextMenu={(event) => {
          // Long-press on touch opens a context menu / callout; the hold owns that gesture.
          if (timer.current !== undefined || heldSteps.current) event.preventDefault()
        }}
      />
    )
  }

  return (
    <div
      {...rest}
      role="group"
      aria-label={label}
      className={cx('ui-touch-stepper', className)}
      data-disabled={disabled || undefined}
      data-repeating={repeating || undefined}
      onKeyDown={handleKeyDown}
    >
      {buttonFor(-1)}
      <output
        id={outputId}
        className="ui-touch-stepper-value"
        aria-live="polite"
        aria-atomic="true"
        // While a hold repeats, screen readers wait and announce where it stops.
        aria-busy={repeating || undefined}
        data-direction={roll.direction}
      >
        {reserved.map((text, index) => (
          <span key={index} className="ui-touch-stepper-sizer" aria-hidden="true">
            {text}
          </span>
        ))}
        {roll.previous !== undefined && (
          <span
            key={`out-${roll.seq}-${roll.previous}`}
            className="ui-touch-stepper-digit ui-touch-stepper-digit--out"
            aria-hidden="true"
            onAnimationEnd={() => settleRoll(roll.seq)}
          >
            {show(roll.previous)}
          </span>
        )}
        <span
          key={`in-${roll.seq}-${current}`}
          className={cx('ui-touch-stepper-digit', roll.seq > 0 && 'ui-touch-stepper-digit--in')}
        >
          {show(current)}
        </span>
      </output>
      {buttonFor(1)}
      {name !== undefined && <input type="hidden" name={name} value={current} disabled={disabled} />}
    </div>
  )
}

interface StepperButtonProps {
  direction: StepDirection
  label: string
  atBound: boolean
  disabled: boolean
  controls: string
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
  onBlur: () => void
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  onContextMenu: (event: MouseEvent<HTMLButtonElement>) => void
}

function StepperButton({
  direction,
  label,
  atBound,
  disabled,
  controls,
  onClick,
  onContextMenu,
  ...handlers
}: StepperButtonProps) {
  const { pressProps } = usePress<HTMLButtonElement>(handlers, disabled || atBound)
  return (
    <button
      {...pressProps}
      type="button"
      className={cx(
        'ui-touch-stepper-button',
        direction > 0 ? 'ui-touch-stepper-button--increment' : 'ui-touch-stepper-button--decrement',
      )}
      aria-label={label}
      aria-controls={controls}
      aria-disabled={atBound && !disabled ? true : undefined}
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <Glyph name={direction > 0 ? 'plus' : 'minus'} size={18} />
    </button>
  )
}
