import {
  useCallback,
  useEffect,
  useState,
  type AnimationEvent,
  type ComponentPropsWithRef,
  type MouseEvent,
} from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { Button, type ButtonProps } from './Button'
import './SymbolSwap.css'

/**
 * Longest a leaving glyph may linger when its `animationend` never arrives
 * (e.g. a user stylesheet that forces `animation: none`). Longer than the
 * snappy exit spring, so it never cuts a running exit short.
 */
const EXIT_SAFETY_MS = 1200

interface Layer {
  symbol: GlyphName
  /** The fill it is shown with; a leaving glyph keeps the fill it had. */
  filled: boolean
  /** Unique per layer and increasing: 0 = the first symbol (rendered at rest). */
  id: number
}

interface SwapState {
  current: Layer
  leaving: Layer[]
  /** id of the current layer while its entrance plays, else null (settled glyphs carry no animation). */
  entering: number | null
}

export interface SymbolSwapProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The glyph to show. Changing it plays the swap. */
  symbol: GlyphName
  /** Filled rendering (heart, star …). Changing only this does not swap. */
  filled?: boolean
  /** Glyph size in px (default 24). */
  size?: number
}

interface LeavingGlyphProps {
  layer: Layer
  size: number
  onDone: (id: number) => void
}

/** A glyph on its way out: removes itself when its own exit animation ends (or after the safety timeout). */
function LeavingGlyph({ layer, size, onDone }: LeavingGlyphProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(layer.id), EXIT_SAFETY_MS)
    return () => clearTimeout(timer)
  }, [layer.id, onDone])

  return (
    <Glyph
      name={layer.symbol}
      filled={layer.filled}
      size={size}
      data-symbol={layer.symbol}
      className="ui-touch-symbol-glyph ui-touch-symbol-glyph--out"
      onAnimationEnd={(event: AnimationEvent<SVGSVGElement>) => {
        if (event.target === event.currentTarget) onDone(layer.id)
      }}
    />
  )
}

/**
 * One glyph that turns into another, like a system symbol replacing itself:
 * the old glyph rotates away (−90°, half size, fading) while the new one
 * rotates in from +90° on the `bouncy` spring. Both are layered in the same
 * box, so the surrounding layout never moves.
 *
 * The previous glyph stays mounted until its own exit animation ends, so
 * quick successive changes each finish cleanly. The first render shows the
 * glyph at rest. Under reduced motion the glyphs only cross-fade.
 *
 * Glyphs are decorative (`aria-hidden`); the control around them carries the
 * name. For a standalone meaningful symbol pass `role="img"` + `aria-label`.
 */
export function SymbolSwap({ symbol, filled = false, size = 24, className, ...rest }: SymbolSwapProps) {
  const [swap, setSwap] = useState<SwapState>(() => ({ current: { symbol, filled, id: 0 }, leaving: [], entering: null }))

  // Derived during render (no effect, so no frame with the wrong glyph): the
  // moment `symbol` changes, the current glyph starts leaving — with the fill
  // it was shown with, which is why a fill-only change is recorded too.
  if (swap.current.symbol !== symbol) {
    const id = swap.current.id + 1
    setSwap({ current: { symbol, filled, id }, leaving: [...swap.leaving, swap.current], entering: id })
  } else if (swap.current.filled !== filled) {
    setSwap({ ...swap, current: { ...swap.current, filled } })
  }

  const finish = useCallback((id: number) => {
    setSwap((s) => (s.leaving.some((l) => l.id === id) ? { ...s, leaving: s.leaving.filter((l) => l.id !== id) } : s))
  }, [])

  const { current } = swap
  // Once settled the glyph drops its entrance class: an ancestor toggling
  // display:none → shown would otherwise replay the entrance.
  const settle = (event: AnimationEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return
    const id = current.id
    setSwap((s) => (s.entering === id ? { ...s, entering: null } : s))
  }

  return (
    <span {...rest} className={cx('ui-touch-symbol', className)}>
      {swap.leaving.map((layer) => (
        <LeavingGlyph key={layer.id} layer={layer} size={size} onDone={finish} />
      ))}
      <Glyph
        key={current.id}
        name={current.symbol}
        filled={filled}
        size={size}
        data-symbol={current.symbol}
        className={cx('ui-touch-symbol-glyph', swap.entering === current.id && 'ui-touch-symbol-glyph--in')}
        onAnimationEnd={settle}
      />
    </span>
  )
}

export interface PlayPauseButtonProps
  extends Omit<ButtonProps, 'children' | 'icon' | 'shape' | 'block' | 'aria-label' | 'aria-pressed'> {
  /** Controlled state. Leave undefined for an uncontrolled button. */
  playing?: boolean
  /** Initial state when uncontrolled (default: paused). */
  defaultPlaying?: boolean
  /** Called with the new state after a click (skipped when `onClick` calls preventDefault()). */
  onPlayingChange?: (playing: boolean, event: MouseEvent<HTMLButtonElement>) => void
  /** Accessible name while paused — the action the button performs (default "Abspielen"). */
  playLabel?: string
  /** Accessible name while playing (default "Pausieren"). */
  pauseLabel?: string
}

const PLAY_PAUSE_GLYPH_SIZE = { large: 26, medium: 20, small: 16 } as const

/**
 * Round play / pause button. The name always says what a press will do
 * ("Abspielen" ↔ "Pausieren"), so it needs no `aria-pressed` on top. The
 * glyph turns over with SymbolSwap; the button itself has the kit's press
 * spring.
 */
export function PlayPauseButton({
  playing,
  defaultPlaying = false,
  onPlayingChange,
  playLabel = 'Abspielen',
  pauseLabel = 'Pausieren',
  variant = 'filled',
  size = 'medium',
  disabled,
  onClick,
  ...rest
}: PlayPauseButtonProps) {
  const controlled = playing !== undefined
  const [uncontrolledPlaying, setUncontrolledPlaying] = useState(defaultPlaying)
  const isPlaying = controlled ? playing : uncontrolledPlaying

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    const next = !isPlaying
    if (!controlled) setUncontrolledPlaying(next)
    onPlayingChange?.(next, event)
  }

  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      shape="circle"
      disabled={disabled}
      aria-label={isPlaying ? pauseLabel : playLabel}
      onClick={handleClick}
    >
      <SymbolSwap symbol={isPlaying ? 'pause' : 'play'} size={PLAY_PAUSE_GLYPH_SIZE[size]} />
    </Button>
  )
}
