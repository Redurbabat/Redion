import { useEffect, useState, type ComponentPropsWithRef } from 'react'
import { cx } from '../internal/cx'
import './ActivityIndicator.css'

export type ActivityIndicatorSize = 'small' | 'large'

export interface ActivityIndicatorProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** small = 20 px (inline, in buttons and rows), large = 36 px (whole screen or card is loading). */
  size?: ActivityIndicatorSize | undefined
  /** What screen readers announce. Default "Lädt". */
  label?: string | undefined
  /**
   * 0…1: instead of spinning, the spokes appear one after another, clockwise
   * from the top, each fading up to its place in the spinning gradient — e.g.
   * while a pull-to-refresh is being pulled. Leave undefined to spin.
   */
  progress?: number | undefined
}

const PIXELS: Record<ActivityIndicatorSize, number> = { small: 20, large: 36 }

/*
 * Geometry on a 24×24 grid: eight rounded bars from radius 5.4 to 11 around
 * the centre, 45° apart. Opacity by position in the trail (0 = head): the
 * glyph turns clockwise, so the trail runs counter-clockwise behind the head
 * and eases off towards a still-visible tail.
 */
const SPOKES = 8
const TRAIL_OPACITY = [1, 0.85, 0.7, 0.57, 0.46, 0.37, 0.3, 0.25] as const
const SPOKE = { x: 10.8, y: 1, width: 2.4, height: 5.6, rx: 1.2 } as const

const spokes = Array.from({ length: SPOKES }, (_, i) => {
  const angle = i * (360 / SPOKES)
  // Spoke i sits i steps clockwise from the head = (8 - i) steps back in the trail.
  const trail = (SPOKES - i) % SPOKES
  return { angle, opacity: TRAIL_OPACITY[trail] ?? 0 }
})

/** Opacity of spoke `index` for a reveal `progress` (0…1): its resting opacity, faded in during its eighth. */
export function spokeReveal(progress: number, index: number, resting: number): number {
  const own = Math.min(1, Math.max(0, progress * SPOKES - index))
  return Math.round(resting * own * 1000) / 1000
}

/**
 * The eight-spoke "busy" spinner. The glyph never animates per spoke: it
 * jumps 45° every 125 ms (steps(8)), so the fixed opacity gradient seems to
 * travel around. It is a `role="status"` region with visually hidden text.
 * The region mounts empty and the text follows right after, because screen
 * readers skip a live region that arrives with its text already inside; a
 * later label change is announced too. Under reduced motion the spokes stand
 * still; the text is still announced.
 */
export function ActivityIndicator({ size = 'small', label = 'Lädt', progress, className, ...rest }: ActivityIndicatorProps) {
  const px = PIXELS[size]
  const revealing = progress !== undefined
  // Fill the live region only once it is in the document (after the first commit).
  const [regionReady, setRegionReady] = useState(false)
  useEffect(() => {
    setRegionReady(true)
  }, [])
  return (
    <span
      role="status"
      {...rest}
      className={cx('ui-touch-activity', `ui-touch-activity--${size}`, revealing && 'ui-touch-activity--static', className)}
    >
      <svg
        className="ui-touch-activity-glyph"
        viewBox="0 0 24 24"
        width={px}
        height={px}
        aria-hidden="true"
        focusable="false"
      >
        {spokes.map(({ angle, opacity }, i) => (
          <rect
            key={angle}
            {...SPOKE}
            opacity={revealing ? spokeReveal(progress, i, opacity) : opacity}
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </svg>
      <span className="ui-touch-visually-hidden">{regionReady ? label : ''}</span>
    </span>
  )
}
