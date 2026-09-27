import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import './Slider.css'

/**
 * Where `value` sits between `min` and `max`, as 0..1 — clamped, and 0 for an
 * empty or inverted range (min >= max) or NaN, so it never divides by zero.
 */
export function valueToProgress(value: number, min: number, max: number): number {
  if (!(max > min)) return 0
  // `|| 0` catches NaN (NaN value or infinite bounds).
  return Math.min(1, Math.max(0, (value - min) / (max - min))) || 0
}

/** The value a range input starts at without one: the midpoint (HTML spec). */
function nativeDefault(min: number, max: number) {
  return max < min ? min : min + (max - min) / 2
}

export interface SliderProps
  extends Omit<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step' | 'children'> {
  /** Accessible name; shown above the track when `showLabel` is set, otherwise used as aria-label. */
  label: string
  showLabel?: boolean
  /** Controlled value. */
  value?: number
  /** Initial value when uncontrolled (default: midpoint, like a native range). */
  defaultValue?: number
  /** Called with the new number on every movement (native `input` event). */
  onChange?: (value: number) => void
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** Default 1. */
  step?: number | 'any'
  /** Decorative glyph at the start of the track (e.g. "moon" for dim). */
  minGlyph?: GlyphName
  /** Decorative glyph at the end of the track (e.g. "sun" for bright). */
  maxGlyph?: GlyphName
  /** Spoken value (aria-valuetext), e.g. `(n) => `${n} Prozent``. */
  valueText?: (value: number) => string
}

/**
 * A native `<input type="range">`, fully restyled: 6 px track, accent fill up
 * to the thumb, 28 px white thumb that grows under the finger (:active) and
 * springs back on release. Keyboard, screen readers and forms work natively.
 *
 * `ref`, `id`, `name`, `disabled` and other input props go to the input;
 * `className` and `style` go to the wrapper. The fill is the CSS variable
 * `--ui-touch-slider-progress` (0..1) on the wrapper, updated from the
 * input's real value on every input event.
 */
export function Slider({
  label,
  showLabel = false,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minGlyph,
  maxGlyph,
  valueText,
  className,
  style,
  id,
  ...rest
}: SliderProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const rootRef = useRef<HTMLDivElement>(null)
  const controlled = value !== undefined
  const initial = defaultValue ?? nativeDefault(min, max)
  // Uncontrolled: a mirror of what the DOM input holds (it owns the value).
  const [domValue, setDomValue] = useState(initial)
  const current = controlled ? value : domValue

  const readDom = () => {
    const input = rootRef.current?.querySelector<HTMLInputElement>('.ui-touch-slider-input')
    const next = input ? Number(input.value) : Number.NaN
    if (!Number.isNaN(next)) setDomValue(next)
  }

  // The browser clamps and snaps the default (e.g. to the step): mirror the result.
  useLayoutEffect(() => {
    if (!controlled) readDom()
  })

  // A form reset changes the value without an input event.
  // Subscribed once per mode, not per render: a re-render during the `reset`
  // event (an onReset state update) must not cancel the pending read.
  useEffect(() => {
    const input = rootRef.current?.querySelector<HTMLInputElement>('.ui-touch-slider-input')
    const form = input?.form
    if (controlled || !input || !form) return
    let pending: ReturnType<typeof setTimeout> | undefined
    // `reset` fires before the controls are reset: read them a tick later.
    const onReset = () => {
      pending = setTimeout(() => {
        const next = Number(input.value)
        if (!Number.isNaN(next)) setDomValue(next)
      }, 0)
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      clearTimeout(pending)
    }
  }, [controlled])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.currentTarget.value)
    if (!controlled) setDomValue(next)
    onChange?.(next)
  }

  const progress = valueToProgress(current, min, max)
  const rootStyle = { ...style, '--ui-touch-slider-progress': progress } as CSSProperties

  return (
    <div ref={rootRef} className={cx('ui-touch-slider', className)} style={rootStyle}>
      {showLabel && (
        <label className="ui-touch-slider-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="ui-touch-slider-row">
        {minGlyph && <Glyph name={minGlyph} size={20} className="ui-touch-slider-glyph ui-touch-slider-glyph--min" />}
        <input
          {...rest}
          {...(controlled ? { value } : { defaultValue: initial })}
          id={inputId}
          type="range"
          className="ui-touch-slider-input"
          min={min}
          max={max}
          step={step}
          aria-label={showLabel ? undefined : label}
          aria-valuetext={valueText?.(current)}
          onChange={handleChange}
        />
        {maxGlyph && <Glyph name={maxGlyph} size={20} className="ui-touch-slider-glyph ui-touch-slider-glyph--max" />}
      </div>
    </div>
  )
}
