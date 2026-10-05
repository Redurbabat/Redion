import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type DOMAttributes,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Button, type ButtonProps } from '../components/Button'
import { cx } from '../internal/cx'
import { useMergedRef } from '../internal/useMergedRef'
import { useGlassRefraction, type GlassOptions } from './useGlassRefraction'
import './Glass.css'

/** The two pointer handlers the glare wraps — the caller's own ones are React props, so each may be undefined. */
type GlareHandlers<E extends HTMLElement> = Pick<DOMAttributes<E>, 'onPointerMove' | 'onPointerLeave'>

/**
 * Glare that follows the pointer (mouse / pen / finger), throttled to one
 * write per frame. The caller's own pointer handlers run first — a glass
 * that is also dragged keeps its drag.
 */
function useGlare<E extends HTMLElement>(enabled: boolean, own: GlareHandlers<E>): GlareHandlers<E> {
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  return {
    onPointerMove(event: ReactPointerEvent<E>) {
      own.onPointerMove?.(event)
      if (!enabled) return
      const el = event.currentTarget
      const { clientX, clientY } = event
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        el.style.setProperty('--ui-touch-glass-gx', `${((clientX - r.left) / r.width) * 100}%`)
        el.style.setProperty('--ui-touch-glass-gy', `${((clientY - r.top) / r.height) * 100}%`)
      })
    },
    onPointerLeave(event: ReactPointerEvent<E>) {
      own.onPointerLeave?.(event)
      if (!enabled) return
      cancelAnimationFrame(frame.current)
      event.currentTarget.style.removeProperty('--ui-touch-glass-gx')
      event.currentTarget.style.removeProperty('--ui-touch-glass-gy')
    },
  }
}

export interface GlassSurfaceProps extends ComponentPropsWithRef<'div'>, GlassOptions {
  /** Specular glare follows the pointer. */
  glare?: boolean | undefined
  /** 'regular' is clear; 'tinted' is milkier for text-heavy panels. */
  tone?: 'regular' | 'tinted' | undefined
}

/**
 * GlasFläche — a panel of liquid glass. The backdrop is blurred lightly,
 * saturated and, where supported, refracted by the rim like a lens; a
 * bright top edge and a soft glare catch the light. Falls back to frosted
 * glass (Safari, Firefox), and to a solid surface with reduced transparency.
 * Use sparingly: every piece costs rendering time on phones.
 */
export function GlassSurface({
  refraction,
  rim,
  bevel,
  refract,
  glare = false,
  tone = 'regular',
  className,
  ref,
  onPointerMove,
  onPointerLeave,
  children,
  ...rest
}: GlassSurfaceProps) {
  const own = useRef<HTMLDivElement>(null)
  const optics = useRef<HTMLSpanElement>(null)
  useGlassRefraction(own, optics, { refraction, rim, bevel, refract })
  const glareProps = useGlare(glare, { onPointerMove, onPointerLeave })
  const mergedRef = useMergedRef(own, ref)
  return (
    <div
      {...rest}
      {...glareProps}
      ref={mergedRef}
      className={cx('ui-touch-glass', tone === 'tinted' && 'ui-touch-glass--tinted', className)}
    >
      <span ref={optics} className="ui-touch-glass-optics" aria-hidden="true" />
      {children}
    </div>
  )
}

export type GlassButtonProps = Omit<ButtonProps, 'variant'> & GlassOptions & { glare?: boolean | undefined }

/**
 * GlasKnopf — the kit Button in glass, with the same press spring.
 * Disabled, it is dimmed (opacity), and a dimmed element cannot show the
 * lens behind it — so it stays frosted then.
 */
export function GlassButton({
  refraction = 28,
  rim = 0.45,
  bevel = 12,
  refract = true,
  glare = true,
  ref,
  className,
  disabled,
  onPointerMove,
  onPointerLeave,
  children,
  ...rest
}: GlassButtonProps) {
  const own = useRef<HTMLButtonElement>(null)
  const optics = useRef<HTMLSpanElement>(null)
  useGlassRefraction(own, optics, { refraction, rim, bevel, refract: refract && !disabled })
  const glareProps = useGlare(glare, { onPointerMove, onPointerLeave })
  const mergedRef = useMergedRef(own, ref)
  return (
    <Button
      {...rest}
      {...glareProps}
      disabled={disabled}
      variant="glass"
      ref={mergedRef}
      className={cx('ui-touch-glass-button', className)}
    >
      <span ref={optics} className="ui-touch-glass-optics" aria-hidden="true" />
      {children}
    </Button>
  )
}

export interface GlassBarProps extends GlassSurfaceProps {
  /** Accessible name of the toolbar. */
  label: string
}

const toolbarItems = (bar: HTMLElement | null) =>
  bar ? Array.from(bar.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')) : []

/**
 * GlasLeiste — a floating capsule toolbar of glass. Arrow keys (Home / End)
 * move between its controls; Tab enters and leaves it as one stop, landing
 * on the control used last (roving tabindex, WAI-ARIA toolbar pattern).
 */
export function GlassBar({ label, className, onKeyDown, onFocus, ref, children, ...rest }: GlassBarProps) {
  const bar = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(bar, ref)
  const active = useRef(0)

  const rove = (items: HTMLElement[], index: number) => {
    active.current = index
    items.forEach((item, i) => {
      item.tabIndex = i === index ? 0 : -1
    })
  }

  // After every render (items can change): exactly one enabled control is a tab stop.
  useLayoutEffect(() => {
    const items = toolbarItems(bar.current)
    if (items.length) rove(items, Math.min(active.current, items.length - 1))
    // Disabled controls are skipped by the arrows; keep them out of the tab order too.
    bar.current?.querySelectorAll<HTMLElement>('button[disabled]').forEach((item) => {
      item.tabIndex = -1
    })
  })

  const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    onFocus?.(event)
    const items = toolbarItems(event.currentTarget)
    const index = items.findIndex((item) => item.contains(event.target))
    if (index !== -1) rove(items, index)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const items = toolbarItems(event.currentTarget)
    const current = items.findIndex((item) => item.contains(event.target as Node))
    if (current === -1) return
    event.preventDefault()
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const forward = (event.key === 'ArrowRight') !== rtl
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (current + (forward ? 1 : -1) + items.length) % items.length
    rove(items, next)
    items[next]?.focus()
  }

  return (
    <GlassSurface
      {...rest}
      // After the spread: an explicit refraction={undefined} still means the bar's default.
      refraction={rest.refraction ?? 36}
      ref={mergedRef}
      role="toolbar"
      aria-label={label}
      aria-orientation="horizontal"
      className={cx('ui-touch-glass-bar', className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {children}
    </GlassSurface>
  )
}
