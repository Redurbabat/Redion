import { useId, useState, type ComponentPropsWithRef, type CSSProperties } from 'react'
import { cx } from '../internal/cx'
import './ProgressBar.css'

/** Progress as 0..1: values outside are clamped, NaN counts as 0 (nothing done yet). */
export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/**
 * Whole percent for display and `aria-valuenow`. Rounds halves up, but only
 * says 100 when the work is really complete — 99.6 % reads "99", so nobody
 * is told "done" while the bar still has a sliver to go.
 */
export function progressPercent(value: number): number {
  const progress = clampProgress(value)
  if (progress >= 1) return 100
  // Strip binary noise first: 0.145 * 100 is 14.499999999999998, which would round down.
  const percent = Math.round(progress * 1e6) / 1e4
  return Math.min(99, Math.round(percent))
}

export interface ProgressBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Progress 0..1 (clamped). Ignored while `indeterminate`. */
  value?: number | undefined
  /** Accessible name, e.g. "Hochladen". Shown above the bar with `showLabel`, otherwise aria-label. */
  label: string
  /** Show the label and the percent above the bar. */
  showLabel?: boolean | undefined
  /** Unknown duration: a segment sweeps across instead of a fill; no value is announced. */
  indeterminate?: boolean | undefined
  /** Spoken value (aria-valuetext), e.g. `(p) => `${p} Prozent, 10 von 40 MB``. */
  valueText?: ((percent: number) => string) | undefined
}

/**
 * Thin capsule progress bar (6 px). The fill is a full-width bar slid in with
 * `translateX`, clipped by the track, so its rounded end stays round at any
 * value; each new value is reached with the snappy spring. Reaching 100 %
 * while on screen plays one sheen (`data-just-completed`); a bar that mounts
 * complete stays still. Indeterminate mode sweeps a stretching segment
 * across; under reduced motion it rests as a still segment in the middle.
 *
 * `ref`, `id` and aria props go to the `role="progressbar"` element;
 * `className` and `style` go to the wrapper.
 */
export function ProgressBar({
  value = 0,
  label,
  showLabel = false,
  indeterminate = false,
  valueText,
  className,
  style,
  ...rest
}: ProgressBarProps) {
  const labelId = useId()
  const progress = clampProgress(value)
  const percent = progressPercent(value)
  const complete = !indeterminate && percent === 100
  // "Adjust state while rendering": the sheen marks reaching 100 % on screen, not mounting at 100 %.
  const [seenComplete, setSeenComplete] = useState(complete)
  const [justCompleted, setJustCompleted] = useState(false)
  if (seenComplete !== complete) {
    setSeenComplete(complete)
    setJustCompleted(complete)
  }
  const rootStyle = { ...style, '--ui-touch-progress-value': progress } as CSSProperties

  return (
    <div
      className={cx('ui-touch-progress', className)}
      style={rootStyle}
      data-indeterminate={indeterminate || undefined}
      data-complete={complete || undefined}
      data-just-completed={justCompleted || undefined}
    >
      {showLabel && (
        <div className="ui-touch-progress-caption">
          <span id={labelId} className="ui-touch-progress-label">
            {label}
          </span>
          {!indeterminate && (
            <span className="ui-touch-progress-percent" aria-hidden="true">
              {percent}&nbsp;%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : percent}
        aria-valuetext={indeterminate ? undefined : valueText?.(percent)}
        {...rest}
        className="ui-touch-progress-track"
      >
        {indeterminate ? (
          <span className="ui-touch-progress-segment" />
        ) : (
          <span className="ui-touch-progress-fill" />
        )}
      </div>
    </div>
  )
}
