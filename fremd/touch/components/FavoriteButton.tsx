import { useCallback, useEffect, useState, type AnimationEvent, type CSSProperties, type MouseEvent } from 'react'
import { Glyph } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { useReducedMotion } from '../internal/useReducedMotion'
import { Button, type ButtonProps, type ButtonVariant } from './Button'
import './FavoriteButton.css'

export type FavoriteSymbol = 'heart' | 'star'

export interface FavoriteButtonProps
  extends Omit<ButtonProps, 'children' | 'icon' | 'shape' | 'block' | 'destructive' | 'aria-label' | 'aria-pressed' | 'variant'> {
  /** Look of the round button (default `plain`). No `filled`: the red / amber glyph would vanish on the accent fill. */
  variant?: Exclude<ButtonVariant, 'filled'> | undefined
  /** heart = "Gefällt mir" (danger colour), star = "Favorit" (warning colour). */
  symbol?: FavoriteSymbol | undefined
  /** Accessible name — required, because the button shows only a glyph (e.g. "Merken"). */
  label: string
  /** Controlled state. Leave undefined for an uncontrolled button. */
  selected?: boolean | undefined
  /** Initial state of an uncontrolled button. */
  defaultSelected?: boolean | undefined
  /** Called with the new state after a click (skipped when `onClick` calls preventDefault()). */
  onSelectedChange?: ((selected: boolean, event: MouseEvent<HTMLButtonElement>) => void) | undefined
}

/** Longest a burst may stay mounted if its animationend never arrives (animations forced off). */
const BURST_SAFETY_MS = 1000

/**
 * Burst particles: 8 directions (0° = straight up, clockwise), mirror-symmetric
 * around the vertical axis (i and 8 − i are twins). Every other one is a
 * smaller "near" spark, so the burst reads as organic rather than as a
 * mechanical star.
 */
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({ angle: i * 45, near: i % 2 === 1 }))

const GLYPH_SIZE = { large: 26, medium: 22, small: 18 } as const

interface MotionState {
  /** The selection the last animation was started for. */
  selected: boolean
  /** Increments per change; 0 = never changed. */
  seq: number
  /**
   * The glyph animation now playing, or null at rest. Switching between
   * 'select' and 'deselect' changes the animation name, which restarts it on
   * the same element (so colour and fill keep cross-fading).
   */
  anim: 'select' | 'deselect' | null
  /** seq of the select whose burst is still flying, or null. */
  burst: number | null
}

function FavoriteBurst({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), BURST_SAFETY_MS)
    return () => clearTimeout(timer)
  }, [id, onDone])

  return (
    <span
      className="ui-touch-favorite-burst"
      aria-hidden="true"
      onAnimationEnd={(event: AnimationEvent<HTMLSpanElement>) => {
        // The container's own (longest) animation marks the end; ring and particles bubble up earlier.
        if (event.target === event.currentTarget) onDone(id)
      }}
    >
      <span className="ui-touch-favorite-ring" />
      {PARTICLES.map(({ angle, near }) => (
        <span
          key={angle}
          className={cx('ui-touch-favorite-particle', near && 'ui-touch-favorite-particle--near')}
          style={{ '--ui-touch-favorite-angle': `${angle}deg` } as CSSProperties}
        />
      ))}
    </span>
  )
}

/**
 * Favourite / like toggle: a native `<button aria-pressed>` with a heart or
 * star. Its look (colour and fill) is drawn from `aria-pressed` in the DOM.
 *
 * Motion — select: the glyph springs up (1 → 1.35 → 1 on the `bouncy`
 * spring) while it fills with colour, and a burst fires behind it: a ring
 * expands and fades, and small sparks fly outward (~0.5 s). The burst exists
 * only while it plays. Deselect: a small dip (→ 0.85) that springs back
 * while the colour drains. The first render never animates; controlled
 * changes animate like clicks. The button keeps the kit's press spring and a
 * 44 px target (the small size extends its hit area).
 *
 * Reduced motion: no scaling and no burst — only colour and fill change.
 */
export function FavoriteButton({
  symbol = 'heart',
  label,
  selected,
  defaultSelected = false,
  onSelectedChange,
  variant = 'plain',
  size = 'medium',
  disabled,
  onClick,
  className,
  ...rest
}: FavoriteButtonProps) {
  const controlled = selected !== undefined
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultSelected)
  const isSelected = controlled ? selected : uncontrolledSelected
  const reducedMotion = useReducedMotion()

  const [motion, setMotion] = useState<MotionState>({ selected: isSelected, seq: 0, anim: null, burst: null })
  // Derived during render, so user clicks and controlled prop changes animate alike.
  if (motion.selected !== isSelected) {
    const seq = motion.seq + 1
    setMotion({
      selected: isSelected,
      seq,
      // Reduced motion: no pop and no dip — colour and fill still cross-fade.
      anim: reducedMotion ? null : isSelected ? 'select' : 'deselect',
      burst: isSelected && !reducedMotion ? seq : motion.burst,
    })
  }

  const endBurst = useCallback((id: number) => {
    setMotion((m) => (m.burst === id ? { ...m, burst: null } : m))
  }, [])

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    const next = !isSelected
    if (!controlled) setUncontrolledSelected(next)
    onSelectedChange?.(next, event)
  }

  // The pop ends: drop the marker, so re-showing the button (display:none → shown) does not replay it.
  // The short lead-in (the swell) ends first and must not cut the spring short.
  const endAnim = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget || event.animationName?.includes('-lead')) return
    setMotion((m) => (m.anim === null ? m : { ...m, anim: null }))
  }

  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      shape="circle"
      disabled={disabled}
      aria-label={label}
      aria-pressed={isSelected}
      onClick={handleClick}
      className={cx('ui-touch-favorite', `ui-touch-favorite--${symbol}`, `ui-touch-favorite--${size}`, className)}
    >
      {motion.burst !== null && <FavoriteBurst key={`burst-${motion.burst}`} id={motion.burst} onDone={endBurst} />}
      <span className="ui-touch-favorite-icon" data-anim={motion.anim ?? undefined} onAnimationEnd={endAnim}>
        <Glyph name={symbol} size={GLYPH_SIZE[size]} className="ui-touch-favorite-glyph" />
      </span>
    </Button>
  )
}
