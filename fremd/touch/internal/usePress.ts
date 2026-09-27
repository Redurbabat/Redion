import { useState, type KeyboardEvent, type PointerEvent } from 'react'

export interface PressHandlers<E extends Element> {
  onPointerDown?: (event: PointerEvent<E>) => void
  onPointerUp?: (event: PointerEvent<E>) => void
  onPointerCancel?: (event: PointerEvent<E>) => void
  onPointerLeave?: (event: PointerEvent<E>) => void
  onKeyDown?: (event: KeyboardEvent<E>) => void
  onKeyUp?: (event: KeyboardEvent<E>) => void
  onBlur?: (event: React.FocusEvent<E>) => void
}

/**
 * Tracks "finger is down" for press feedback and exposes it as
 * `data-pressed`, so CSS can run the press spring. Unlike `:active` this
 * works the same on iOS Safari, with a mouse and with the keyboard
 * (Space / Enter), and it clears when a scroll steals the pointer.
 *
 * The caller's own handlers are preserved and called first.
 */
export function usePress<E extends Element>(handlers: PressHandlers<E> = {}, disabled = false) {
  const [pressed, setPressed] = useState(false)
  const press = (value: boolean) => {
    if (disabled && value) return
    setPressed(value)
  }

  return {
    pressed: pressed && !disabled,
    pressProps: {
      'data-pressed': (pressed && !disabled) || undefined,
      onPointerDown(event: PointerEvent<E>) {
        handlers.onPointerDown?.(event)
        if (event.button === 0) press(true)
      },
      onPointerUp(event: PointerEvent<E>) {
        handlers.onPointerUp?.(event)
        press(false)
      },
      onPointerCancel(event: PointerEvent<E>) {
        handlers.onPointerCancel?.(event)
        press(false)
      },
      onPointerLeave(event: PointerEvent<E>) {
        handlers.onPointerLeave?.(event)
        press(false)
      },
      onKeyDown(event: KeyboardEvent<E>) {
        handlers.onKeyDown?.(event)
        if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) press(true)
      },
      onKeyUp(event: KeyboardEvent<E>) {
        handlers.onKeyUp?.(event)
        if (event.key === ' ' || event.key === 'Enter') press(false)
      },
      onBlur(event: React.FocusEvent<E>) {
        handlers.onBlur?.(event)
        press(false)
      },
    },
  }
}
