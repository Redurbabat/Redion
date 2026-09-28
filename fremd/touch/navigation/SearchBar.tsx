import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Glyph } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import './SearchBar.css'

export interface SearchBarProps {
  /** Accessible name of the field. Default "Suchen". */
  label?: string | undefined
  placeholder?: string | undefined
  /** Controlled text. */
  value?: string | undefined
  /** Initial text when uncontrolled. */
  defaultValue?: string | undefined
  onChange?: ((value: string) => void) | undefined
  /** Return / the keyboard's search key. */
  onSubmit?: ((value: string) => void) | undefined
  /** The cancel button (or Escape on an empty field) left the search. */
  onCancel?: (() => void) | undefined
  cancelLabel?: string | undefined
  clearLabel?: string | undefined
  /** Hide the on-screen keyboard after submitting so results are visible. Default true. */
  blurOnSubmit?: boolean | undefined
  className?: string | undefined
}

/** Keeps focus where it is when a button inside the bar is pressed with a mouse or finger. */
const keepFocus = (event: ReactMouseEvent) => event.preventDefault()

/** Jumps the element's running CSS transitions / animations to their end state. */
function settle(el: Element | null) {
  if (!el || typeof el.getAnimations !== 'function') return
  for (const animation of el.getAnimations()) animation.finish()
}

/**
 * iOS search field.
 *
 * - Focus (or text) makes it active: "Abbrechen" slides in from the right
 *   while the field's background shrinks with `scaleX` from its left edge —
 *   the layout never changes, the input only gets more right padding.
 *   The corner radius is counter-scaled so rounded ends stay round at rest.
 * - Clear button while there is text; it keeps the keyboard up.
 * - Escape clears the text; on an empty field it leaves the search (blur),
 *   like Cancel. A handled Escape is marked `defaultPrevented`, so an
 *   enclosing sheet or dialog stays open.
 * - Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *   A field that is already filled on the first render appears settled
 *   (shrunk, clear button shown) without playing its entrance motion.
 */
export function SearchBar({
  label = 'Suchen',
  placeholder = 'Suchen',
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  onCancel,
  cancelLabel = 'Abbrechen',
  clearLabel = 'Eingabe löschen',
  blurOnSubmit = true,
  className,
}: SearchBarProps) {
  const [inner, setInner] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const text = value ?? inner
  const filled = text !== ''
  const active = focused || filled

  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLSpanElement>(null)
  const cancelBoxRef = useRef<HTMLSpanElement>(null)
  const clearDiscRef = useRef<HTMLSpanElement>(null)
  const { pressProps } = usePress<HTMLButtonElement>()

  const setText = (next: string) => {
    if (value === undefined) setInner(next)
    onChange?.(next)
  }

  // ── geometry: how far the background shrinks to make room for Cancel ──
  const measure = useCallback(() => {
    const form = formRef.current
    const bg = bgRef.current
    const box = cancelBoxRef.current
    if (!form || !bg || !box) return
    // Layout widths: offsetWidth ignores the scale transform currently applied.
    const width = bg.offsetWidth
    const cancelWidth = box.offsetWidth
    const shrink = String(Math.round((width > 0 ? Math.max(0, (width - cancelWidth) / width) : 1) * 10000) / 10000)
    const cancel = `${cancelWidth}px`
    if (
      form.style.getPropertyValue('--ui-touch-search-shrink') === shrink &&
      form.style.getPropertyValue('--ui-touch-search-cancel-width') === cancel
    ) {
      return
    }
    form.style.setProperty('--ui-touch-search-shrink', shrink)
    form.style.setProperty('--ui-touch-search-cancel-width', cancel)
    // New geometry (first layout, a resize, another label) applies at once:
    // only focusing / leaving the search animates the background.
    settle(bg)
  }, [])

  useLayoutEffect(measure, [active, cancelLabel, measure])

  // A field that is already filled on the first render shows its clear button without the pop-in.
  useLayoutEffect(() => settle(clearDiscRef.current), [])

  useEffect(() => {
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(() => measure())
    if (bgRef.current) observer.observe(bgRef.current)
    if (cancelBoxRef.current) observer.observe(cancelBoxRef.current)
    return () => observer.disconnect()
  }, [measure])

  // ── actions ──────────────────────────────────────────────────────────
  const leave = () => {
    const form = formRef.current
    const focusedEl = document.activeElement
    if (form && focusedEl instanceof HTMLElement && form.contains(focusedEl)) focusedEl.blur()
    setFocused(false)
  }

  const cancel = () => {
    if (filled) setText('')
    leave()
    onCancel?.()
  }

  const clear = () => {
    setText('')
    inputRef.current?.focus()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    // An Escape that closes an IME composition belongs to the input method.
    if (event.key !== 'Escape' || event.nativeEvent.isComposing || !active) return
    event.preventDefault()
    if (filled) clear()
    else cancel()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.(text)
    if (blurOnSubmit) inputRef.current?.blur()
  }

  const onBlur = (event: ReactFocusEvent<HTMLFormElement>) => {
    // Focus moving between the field and its own buttons keeps the search active.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  return (
    <form
      ref={formRef}
      role="search"
      className={cx('ui-touch-search', className)}
      data-active={active || undefined}
      data-filled={filled || undefined}
      onSubmit={submit}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <input
        ref={inputRef}
        className="ui-touch-search-input"
        type="search"
        aria-label={label}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <span ref={bgRef} className="ui-touch-search-bg" aria-hidden="true" />
      <Glyph name="search" size={17} strokeWidth={2.2} className="ui-touch-search-icon" />
      {filled && (
        <button
          type="button"
          className="ui-touch-search-clear"
          aria-label={clearLabel}
          onMouseDown={keepFocus}
          onClick={clear}
        >
          <span ref={clearDiscRef} className="ui-touch-search-clear-disc" aria-hidden="true">
            <Glyph name="close" size={10} strokeWidth={3.2} />
          </span>
        </button>
      )}
      <span ref={cancelBoxRef} className="ui-touch-search-cancel-clip">
        <button
          {...pressProps}
          type="button"
          className="ui-touch-search-cancel"
          tabIndex={active ? 0 : -1}
          onMouseDown={keepFocus}
          onClick={cancel}
        >
          {cancelLabel}
        </button>
      </span>
    </form>
  )
}
