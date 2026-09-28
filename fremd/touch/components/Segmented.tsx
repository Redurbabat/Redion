import { useRef, useState, type ComponentPropsWithRef, type CSSProperties, type KeyboardEvent, type Ref } from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './Segmented.css'

export interface SegmentedOption<V extends string = string> {
  value: V
  /** Visible text; also the segment's accessible name. */
  label: string
  /** Optional glyph before the text. */
  icon?: GlyphName | undefined
  disabled?: boolean | undefined
}

export interface SegmentedProps<V extends string = string>
  extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'defaultValue' | 'children' | 'role' | 'aria-label'> {
  options: ReadonlyArray<SegmentedOption<V>>
  /** Controlled selection. Leave undefined for an uncontrolled control. */
  value?: V | undefined
  /** Initial selection when uncontrolled (defaults to the first enabled option). */
  defaultValue?: V | undefined
  /** Called with the newly selected value (not when the selection is re-clicked). */
  onChange?: ((value: V) => void) | undefined
  /** Accessible name of the group, e.g. "Zeitraum". Required: the group has no visible title. */
  label: string
  disabled?: boolean | undefined
  /** Stretch to the container width. */
  block?: boolean | undefined
  /** Adds a hidden input so the selection is submitted with a form. */
  name?: string | undefined
}

type Direction = 1 | -1

/** Next enabled index from `from` in `direction`, wrapping; -1 when nothing is enabled. */
function stepIndex<V extends string>(options: ReadonlyArray<SegmentedOption<V>>, from: number, direction: Direction) {
  const count = options.length
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (((from + direction * offset) % count) + count) % count
    const option = options[index]
    if (option && !option.disabled) return index
  }
  return -1
}

/**
 * iOS segmented control: a small set of mutually exclusive views.
 *
 * Semantics are a radio group (`role="radiogroup"` + buttons with
 * `role="radio"`), with a roving tab stop. Arrow keys (wrapping), Home and
 * End move focus *and* selection, like native radios.
 *
 * One thumb slides behind the segments. Its size and position are pure CSS
 * (`--ui-touch-segmented-count` / `-index`), so nothing is measured. On
 * every change the thumb also stretches briefly, as if the material were
 * pulled along; that animation lives on an inner element that React
 * re-keys, which restarts it without touching the slide transition.
 */
export function Segmented<V extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  label,
  disabled = false,
  block = false,
  name,
  className,
  style,
  onKeyDown,
  ...rest
}: SegmentedProps<V>) {
  const controlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState<V | undefined>(
    () => defaultValue ?? options[stepIndex(options, -1, 1)]?.value,
  )
  const current = controlled ? value : uncontrolledValue
  const selectedIndex = options.findIndex((option) => option.value === current)

  // Restart the stretch whenever the selected index changes (from any source),
  // using React's "adjust state while rendering" pattern instead of an effect.
  const [shownIndex, setShownIndex] = useState(selectedIndex)
  const [stretchKey, setStretchKey] = useState(0)
  if (selectedIndex !== shownIndex) {
    setShownIndex(selectedIndex)
    if (selectedIndex >= 0 && shownIndex >= 0) setStretchKey(stretchKey + 1)
  }

  const segments = useRef<Array<HTMLButtonElement | null>>([])

  const select = (index: number) => {
    const option = options[index]
    if (!option || option.disabled || disabled || option.value === current) return
    if (!controlled) setUncontrolledValue(option.value)
    onChange?.(option.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || disabled) return
    const from = segments.current.indexOf(event.target as HTMLButtonElement)
    if (from === -1) return
    let next: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = stepIndex(options, from, 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = stepIndex(options, from, -1)
        break
      case 'Home':
        next = stepIndex(options, -1, 1)
        break
      case 'End':
        next = stepIndex(options, options.length, -1)
        break
      default:
        return
    }
    event.preventDefault()
    if (next === -1) return
    segments.current[next]?.focus()
    select(next)
  }

  const selectedOption = options[selectedIndex]
  const selectable = selectedOption !== undefined && !selectedOption.disabled
  const tabStop = selectable ? selectedIndex : stepIndex(options, -1, 1)

  const cssVars = {
    '--ui-touch-segmented-count': Math.max(options.length, 1),
    '--ui-touch-segmented-index': Math.max(selectedIndex, 0),
  } as CSSProperties

  return (
    <div
      {...rest}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx('ui-touch-segmented', block && 'ui-touch-segmented--block', className)}
      style={{ ...cssVars, ...style }}
      onKeyDown={handleKeyDown}
    >
      <span className="ui-touch-segmented-thumb" aria-hidden="true">
        <span key={stretchKey} className="ui-touch-segmented-thumb-fill" data-stretch={stretchKey > 0 || undefined} />
      </span>
      {options.map((option, index) => (
        <SegmentedItem
          key={option.value}
          option={option}
          checked={index === selectedIndex}
          tabStop={index === tabStop}
          disabled={Boolean(disabled || option.disabled)}
          onSelect={() => select(index)}
          buttonRef={(node) => {
            segments.current[index] = node
          }}
        />
      ))}
      {name !== undefined && <input type="hidden" name={name} value={current ?? ''} />}
    </div>
  )
}

interface SegmentedItemProps<V extends string> {
  option: SegmentedOption<V>
  checked: boolean
  tabStop: boolean
  disabled?: boolean
  onSelect: () => void
  buttonRef: Ref<HTMLButtonElement>
}

function SegmentedItem<V extends string>({ option, checked, tabStop, disabled, onSelect, buttonRef }: SegmentedItemProps<V>) {
  const { pressProps } = usePress<HTMLButtonElement>({}, disabled)
  return (
    <button
      {...pressProps}
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabStop ? 0 : -1}
      disabled={disabled}
      className="ui-touch-segmented-segment"
      onClick={onSelect}
    >
      <span className="ui-touch-segmented-content">
        {option.icon && <Glyph name={option.icon} size={16} />}
        <span className="ui-touch-segmented-label">
          <span className="ui-touch-segmented-text">{option.label}</span>
          {/* Invisible bold copy: reserves the selected width so nothing shifts. */}
          <span className="ui-touch-segmented-reserve" aria-hidden="true">
            {option.label}
          </span>
        </span>
      </span>
    </button>
  )
}
