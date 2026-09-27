import { useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../internal/cx'
import './Skeleton.css'

/** Most lines a SkeletonText draws — a placeholder never needs more, and a typo cannot flood the DOM. */
const MAX_LINES = 50
/** Delay between the shimmer of one text line and the next (a wave running down). */
const LINE_STAGGER_MS = 90

/**
 * Widths for `lines` placeholder lines: all full, the last one shorter like
 * the end of a paragraph. A single line stays full (nothing to be shorter
 * than). Counts are whole numbers from 1 to 50; anything else becomes 1.
 */
export function skeletonLineWidths(lines: number, lastLineWidth = '60%'): string[] {
  const count = Number.isFinite(lines) ? Math.min(MAX_LINES, Math.max(1, Math.trunc(lines))) : 1
  return Array.from({ length: count }, (_, i) => (count > 1 && i === count - 1 ? lastLineWidth : '100%'))
}

/** Numbers are px; strings are any CSS length ("60%", "2em"). */
function cssLength(value: number | string | undefined) {
  return typeof value === 'number' ? `${value}px` : value
}

export interface SkeletonProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Default 100 % of the container. */
  width?: number | string
  /** Default 1em (one line of the surrounding text). */
  height?: number | string
  /** Corner radius. Default 6 px; "50%" makes a circle (avatars). */
  radius?: number | string
}

/**
 * A placeholder block where content is still loading: a soft tint with a
 * light band sweeping across. Hidden from assistive technology — wrap the
 * placeholders in a `SkeletonGroup` that says what is loading.
 */
export function Skeleton({ width, height, radius, className, style, ...rest }: SkeletonProps) {
  const vars = {
    '--ui-touch-skeleton-width': cssLength(width),
    '--ui-touch-skeleton-height': cssLength(height),
    '--ui-touch-skeleton-radius': cssLength(radius),
    ...style,
  } as CSSProperties
  return <span aria-hidden="true" {...rest} className={cx('ui-touch-skeleton', className)} style={vars} />
}

export interface SkeletonTextProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Number of lines. Default 3. */
  lines?: number
  /** Width of the last line (when there is more than one). Default "60%". */
  lastLineWidth?: string
}

/**
 * Placeholder for a paragraph: `lines` bars sized to the surrounding font,
 * the last one shorter. The shimmer starts a little later on each line, so
 * it runs down the paragraph as a wave.
 */
export function SkeletonText({ lines = 3, lastLineWidth, className, ...rest }: SkeletonTextProps) {
  return (
    <span aria-hidden="true" {...rest} className={cx('ui-touch-skeleton-text', className)}>
      {skeletonLineWidths(lines, lastLineWidth).map((width, i) => (
        <span
          key={i}
          className="ui-touch-skeleton ui-touch-skeleton--line"
          style={
            {
              '--ui-touch-skeleton-width': width,
              '--ui-touch-skeleton-delay': `${i * LINE_STAGGER_MS}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

export interface SkeletonGroupProps extends ComponentPropsWithRef<'div'> {
  /** True while loading (default). Set false when the real content is in. */
  busy?: boolean
  /** What is loading, for screen readers. Default "Inhalt lädt". */
  busyLabel?: string
  children?: ReactNode
}

/**
 * Container for placeholders and, once loaded, the real content. While
 * `busy` it is `aria-busy="true"` and carries a visually hidden label that
 * says what is loading. Keep the same group mounted and flip `busy` to
 * false when the content arrives: `aria-busy` turns false, the label goes
 * away, and the new content fades up into place (`data-revealed`). Content
 * that was there from the first render does not animate. The group is not a
 * live region; if arriving content must be announced, add one around it.
 */
export function SkeletonGroup({ busy = true, busyLabel = 'Inhalt lädt', className, children, ...rest }: SkeletonGroupProps) {
  // "Adjust state while rendering": remember busy → idle transitions without an effect.
  const [seenBusy, setSeenBusy] = useState(busy)
  const [revealed, setRevealed] = useState(false)
  if (seenBusy !== busy) {
    setSeenBusy(busy)
    setRevealed(!busy)
  }

  return (
    <div
      {...rest}
      aria-busy={busy}
      data-revealed={revealed || undefined}
      className={cx('ui-touch-skeleton-group', className)}
    >
      {busy && <span className="ui-touch-visually-hidden">{busyLabel}</span>}
      {children}
    </div>
  )
}
