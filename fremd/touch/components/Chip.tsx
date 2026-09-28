import { useState, type ComponentPropsWithRef, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './Chip.css'

export interface FilterChipProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
  /** Controlled state. Leave undefined for an uncontrolled chip. */
  selected?: boolean | undefined
  /** Initial state of an uncontrolled chip. */
  defaultSelected?: boolean | undefined
  /** Called with the new state after a click (skipped when `onClick` calls preventDefault()). */
  onSelectedChange?: ((selected: boolean, event: MouseEvent<HTMLButtonElement>) => void) | undefined
  /** Glyph before the label; it hands its slot to the check mark while selected. */
  icon?: GlyphName | undefined
  /** Visible text — also the accessible name. */
  children?: ReactNode | undefined
}

/**
 * Filter chip: a small capsule that switches one filter on or off.
 *
 * It is a native `<button aria-pressed>`, so Space / Enter, forms and screen
 * readers ("Vegan, toggle button, pressed") work without extra code. The
 * look is drawn from the `aria-pressed` attribute in the DOM, never from a
 * mirrored class.
 *
 * Motion: when selected, a check mark grows in on the `bouncy` spring while
 * the label slides aside on `snappy`. The check's slot is always reserved
 * and the unselected label is centred by shifting the row back half a slot,
 * so the chip never changes width — everything moves with transform. With a
 * leading glyph the glyph shrinks away and the check takes its place.
 */
export function FilterChip({
  selected,
  defaultSelected = false,
  onSelectedChange,
  icon,
  className,
  type = 'button',
  disabled,
  onClick,
  children,
  ...rest
}: FilterChipProps) {
  const controlled = selected !== undefined
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultSelected)
  const isSelected = controlled ? selected : uncontrolledSelected
  const { pressProps } = usePress<HTMLButtonElement>(rest, disabled)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    const next = !isSelected
    if (!controlled) setUncontrolledSelected(next)
    onSelectedChange?.(next, event)
  }

  return (
    <button
      {...rest}
      {...pressProps}
      type={type}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cx('ui-touch-chip', 'ui-touch-chip--filter', icon && 'ui-touch-chip--with-icon', className)}
      onClick={handleClick}
    >
      <span className="ui-touch-chip-content">
        <span className="ui-touch-chip-lead" aria-hidden="true">
          {icon && <Glyph name={icon} size={16} className="ui-touch-chip-icon" />}
          <Glyph name="check" size={16} strokeWidth={2.6} className="ui-touch-chip-check" />
        </span>
        <span className="ui-touch-chip-label">{children}</span>
      </span>
    </button>
  )
}

export interface RemovableChipProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Called when the remove button is activated (click, Space, Enter, Backspace or Delete). */
  onRemove: (event: SyntheticEvent<HTMLButtonElement>) => void
  /**
   * Accessible name of the remove button. Defaults to "<label> entfernen"
   * when the label is plain text (strings / numbers), otherwise to
   * "Entfernen" — pass a specific name then.
   */
  removeLabel?: string | undefined
  /** Glyph before the label. */
  icon?: GlyphName | undefined
  /** Disables the remove button and dims the chip. */
  disabled?: boolean | undefined
  /** Visible text of the chip. */
  children?: ReactNode | undefined
}

const REMOVE_KEYS = new Set(['Backspace', 'Delete'])

/**
 * Plain text of children made only of strings / numbers (JSX such as
 * `{city} ({count})` yields an array), or null when an element is inside.
 */
function plainText(children: ReactNode): string | null {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (!Array.isArray(children)) return null
  let text = ''
  for (const child of children as ReactNode[]) {
    const part = plainText(child)
    if (part === null) return null
    text += part
  }
  return text
}

/**
 * Removable ("input") chip: a token such as a recipient or a chosen city.
 *
 * The chip itself is a plain `<span>` — only the remove button is
 * interactive, and it always has a specific name ("Berlin entfernen").
 * Besides click / Space / Enter, Backspace and Delete remove it too, as in
 * token fields. The consumer unmounts the chip in `onRemove` and should move
 * focus to a sensible neighbour, because the focused button disappears.
 *
 * Motion: pressing the remove button sinks its disc and the whole chip a
 * little (press spring); both spring back on release.
 */
export function RemovableChip({
  onRemove,
  removeLabel,
  icon,
  disabled = false,
  className,
  children,
  ...rest
}: RemovableChipProps) {
  const { pressProps } = usePress<HTMLButtonElement>({}, disabled)
  const text = plainText(children)?.trim()
  // An empty aria-label would leave the button nameless: fall back instead.
  const name = removeLabel?.trim() ? removeLabel : text ? `${text} entfernen` : 'Entfernen'

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    pressProps.onKeyDown(event)
    if (disabled || event.repeat || !REMOVE_KEYS.has(event.key)) return
    event.preventDefault()
    onRemove(event)
  }

  return (
    <span
      {...rest}
      className={cx('ui-touch-chip', 'ui-touch-chip--removable', icon && 'ui-touch-chip--with-icon', className)}
    >
      {icon && <Glyph name={icon} size={16} className="ui-touch-chip-icon" />}
      <span className="ui-touch-chip-label">{children}</span>
      <button
        {...pressProps}
        type="button"
        className="ui-touch-chip-remove"
        aria-label={name}
        disabled={disabled}
        onClick={(event) => {
          if (!disabled) onRemove(event)
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="ui-touch-chip-remove-disc" aria-hidden="true">
          <Glyph name="close" size={10} strokeWidth={3.4} />
        </span>
      </button>
    </span>
  )
}
