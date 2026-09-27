import type { ChangeEvent, ComponentPropsWithRef, KeyboardEvent, ReactNode } from 'react'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './Toggle.css'

type NativeInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'children' | 'size'
>

export interface ToggleBaseProps extends NativeInputProps {
  /** Controlled state. Leave undefined for an uncontrolled toggle. */
  checked?: boolean
  /** Initial state of an uncontrolled toggle. */
  defaultChecked?: boolean
  /** Called with the new state after the user flips the switch. */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void
  /** Where the visible text sits. `start` = settings-row style (text, then switch). */
  labelPosition?: 'start' | 'end'
  /** Stretch the label to the container width (switch at the far end with `labelPosition="start"`). */
  block?: boolean
}

/** A switch always needs an accessible name: visible text, `aria-label` or `aria-labelledby`. */
export type ToggleNameProps =
  | { label: Exclude<ReactNode, null | undefined | boolean> }
  | { label?: undefined; 'aria-label': string }
  | { label?: undefined; 'aria-labelledby': string }

export type ToggleProps = ToggleBaseProps & ToggleNameProps

/**
 * On/off switch. A real `<input type="checkbox" role="switch">` sits inside
 * the `<label>`, so Space, forms, `name`/`value` and screen readers work
 * natively; the track and knob only *draw* the input's `:checked`,
 * `:disabled` and `:focus-visible` state, never a React copy of it.
 *
 * Motion: the knob travels on the `snappy` spring and the track colour
 * cross-fades. While a finger (or Space / Enter) is down the knob stretches
 * towards the side it will travel to, like iOS. Under reduced motion it
 * does not stretch or travel: a still knob on each side cross-fades.
 *
 * `className` / `style` apply to the outer label; every other native prop
 * (and `ref`) goes to the input.
 */
export function Toggle({
  checked,
  defaultChecked,
  onChange,
  label,
  labelPosition = 'end',
  block = false,
  disabled,
  className,
  style,
  onKeyDown,
  ...rest
}: ToggleProps) {
  const { pressProps } = usePress<HTMLLabelElement>({}, disabled)

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    // Checkboxes only toggle with Space; the switch pattern also allows Enter.
    // Enter belongs to the switch entirely (a held key must not fall through to
    // an implicit form submit), but key repeat does not flip it again.
    if (event.defaultPrevented || event.key !== 'Enter') return
    event.preventDefault()
    if (!event.repeat) event.currentTarget.click()
  }

  return (
    <label
      {...pressProps}
      className={cx(
        'ui-touch-toggle',
        labelPosition === 'start' && 'ui-touch-toggle--label-start',
        block && 'ui-touch-toggle--block',
        className,
      )}
      style={style}
    >
      <input
        {...rest}
        className="ui-touch-toggle-input"
        type="checkbox"
        role="switch"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.checked, event)}
        onKeyDown={handleKeyDown}
      />
      <span className="ui-touch-toggle-track" aria-hidden="true">
        <span className="ui-touch-toggle-knob" />
      </span>
      {label != null && <span className="ui-touch-toggle-text">{label}</span>}
    </label>
  )
}
