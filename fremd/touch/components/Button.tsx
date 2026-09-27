import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './Button.css'

export type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'glass'
export type ButtonSize = 'large' | 'medium' | 'small'
export type ButtonShape = 'rounded' | 'capsule' | 'circle'

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** filled = main action, tinted/gray = secondary, plain = text only, glass = over imagery. */
  variant?: ButtonVariant
  /** large 50 px, medium 44 px, small 32 px (small keeps a 44 px hit area). */
  size?: ButtonSize
  shape?: ButtonShape
  /** Destructive action (delete, sign out): uses the danger colour. */
  destructive?: boolean
  /** Stretch to the container width. */
  block?: boolean
  /** Glyph before the label. */
  icon?: GlyphName
  children?: ReactNode
}

/**
 * Push button with a physical press: it sinks immediately when touched and
 * springs back (with a hint of overshoot) on release. Keyboard presses show
 * the same feedback. Under reduced motion it dims instead of moving.
 */
export function Button({
  variant = 'filled',
  size = 'medium',
  shape = 'rounded',
  destructive = false,
  block = false,
  icon,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const { pressProps } = usePress<HTMLButtonElement>(rest, disabled)
  return (
    <button
      {...rest}
      {...pressProps}
      type={type}
      disabled={disabled}
      className={cx(
        'ui-touch-button',
        `ui-touch-button--${variant}`,
        `ui-touch-button--${size}`,
        `ui-touch-button--${shape}`,
        destructive && 'ui-touch-button--destructive',
        block && 'ui-touch-button--block',
        className,
      )}
    >
      {icon && <Glyph name={icon} size={size === 'small' ? 16 : 20} />}
      {children}
    </button>
  )
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'shape' | 'block' | 'aria-label'> {
  icon: GlyphName
  /** Accessible name — required, because the button shows no text. */
  label: string
  /** Makes it a toggle button (aria-pressed), e.g. favourite on/off. */
  selected?: boolean
  /** Render the glyph filled (e.g. a filled heart when selected). */
  filled?: boolean
}

/** Round button with only a glyph. Always has an accessible name. */
export function IconButton({ icon, label, selected, filled, variant = 'gray', size = 'medium', ...rest }: IconButtonProps) {
  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      shape="circle"
      aria-label={label}
      aria-pressed={selected === undefined ? undefined : selected}
      data-selected={selected || undefined}
    >
      <Glyph name={icon} filled={filled ?? selected} size={size === 'large' ? 26 : size === 'small' ? 16 : 20} />
    </Button>
  )
}
