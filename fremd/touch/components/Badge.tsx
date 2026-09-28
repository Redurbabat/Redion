import { useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../internal/cx'
import './Badge.css'

export type BadgeTone = 'danger' | 'accent' | 'neutral'

/**
 * Text for a numeric badge, or `null` when nothing should be shown.
 *
 * - Counts are whole numbers: fractions are cut off, negatives count as 0.
 * - 0 is hidden unless `showZero`; NaN is always hidden.
 * - Above `max` the badge reads "max+" (99 → "99+"). `max` is at least 1;
 *   `Infinity` means no cap.
 */
export function formatBadgeCount(count: number, max = 99, showZero = false): string | null {
  if (Number.isNaN(count)) return null
  const limit = Number.isNaN(max) ? 99 : Math.max(1, Math.trunc(max))
  const whole = Math.max(0, Math.trunc(count))
  if (whole === 0 && !showZero) return null
  return whole > limit ? `${limit}+` : String(whole)
}

type Pop = 'enter' | 'bump'

export interface BadgeProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Number to show. 0 hides the badge unless `showZero`. Takes precedence over `children`. */
  count?: number | undefined
  /** Highest number shown as is; above it the badge reads "max+". Default 99. */
  max?: number | undefined
  /** Show "0" instead of hiding the badge. */
  showZero?: boolean | undefined
  /** A small dot without text ("something new"). Takes precedence over `count` and `children`. */
  dot?: boolean | undefined
  /** danger (default, like unread counts), accent or neutral. */
  tone?: BadgeTone | undefined
  /**
   * Text for assistive technology, e.g. "3 ungelesene Nachrichten". The
   * visible number is then hidden from it. Without a label a count or dot
   * badge is treated as decoration (`aria-hidden`); put the information in
   * the name of the control it sits on instead. An explicit `aria-hidden`
   * prop always wins.
   */
  label?: string | undefined
  /** Short text, e.g. "Neu". */
  children?: ReactNode | undefined
}

/**
 * Small status capsule: unread count, "new" dot or a short word.
 *
 * Motion: whenever `count` changes the badge pops — it swells to 1.25 and
 * settles on the `bouncy` spring while a faint ring pings outwards. When it
 * appears after being hidden it grows in from nothing. Both are one-shot
 * keyframes on an inner element that React re-keys, so rapid changes restart
 * the pop instead of queueing. The first render never animates. Under
 * reduced motion the count just changes; an appearing badge fades in.
 */
export function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  tone = 'danger',
  label,
  className,
  children,
  ...rest
}: BadgeProps) {
  const text = dot ? null : count !== undefined ? formatBadgeCount(count, max, showZero) : children
  const visible = dot || (text !== null && text !== undefined && text !== false && text !== '')

  // Restart the pop whenever the count (or visibility) changes, using React's
  // "adjust state while rendering" pattern instead of an effect. Object.is,
  // not !==: NaN !== NaN would set state on every render and loop forever.
  const [seen, setSeen] = useState({ count, visible })
  const [pop, setPop] = useState<{ key: number; kind: Pop | null }>({ key: 0, kind: null })
  if (!Object.is(seen.count, count) || seen.visible !== visible) {
    setSeen({ count, visible })
    const kind: Pop | null = !visible ? null : !seen.visible ? 'enter' : 'bump'
    if (kind) setPop({ key: pop.key + 1, kind })
  }

  if (!visible) return null

  const hasLabel = label !== undefined && label !== ''
  const decorative = !hasLabel && (dot || count !== undefined)
  // An explicit aria-hidden from the caller wins over the automatic one.
  const ariaHidden = rest['aria-hidden'] ?? (decorative || undefined)

  return (
    <span
      {...rest}
      aria-hidden={ariaHidden}
      className={cx('ui-touch-badge', `ui-touch-badge--${tone}`, dot && 'ui-touch-badge--dot', className)}
    >
      <span
        key={pop.key}
        className="ui-touch-badge-face"
        data-pop={pop.kind ?? undefined}
        aria-hidden={hasLabel || undefined}
      >
        {text}
      </span>
      {hasLabel && <span className="ui-touch-visually-hidden">{label}</span>}
    </span>
  )
}

export interface BadgeAnchorProps extends ComponentPropsWithRef<'span'> {
  /** The badge to pin to the top-end corner, usually a `<Badge>`. */
  badge: ReactNode
  /**
   * Shape of the child. `circle` pulls the badge in onto the rim of a round
   * child (avatar, round icon button) instead of the empty box corner.
   */
  overlap?: 'rect' | 'circle' | undefined
}

/**
 * Pins a badge to the top-end corner of its child (icon, button, avatar).
 * The badge ignores pointer events, so it never steals the child's taps,
 * and it gets a thin ring in the surface colour to lift it off the child.
 */
export function BadgeAnchor({ badge, overlap = 'rect', className, children, ...rest }: BadgeAnchorProps) {
  return (
    <span
      {...rest}
      className={cx('ui-touch-badge-anchor', overlap === 'circle' && 'ui-touch-badge-anchor--circle', className)}
    >
      {children}
      <span className="ui-touch-badge-anchor-slot">{badge}</span>
    </span>
  )
}
