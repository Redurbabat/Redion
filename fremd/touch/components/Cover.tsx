import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import './Cover.css'

export type CoverSize = 'small' | 'medium' | 'large' | 'fill'

export interface CoverProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Playing: full size, floating. Paused: shrunk, resting close to the surface. */
  playing: boolean
  /** Artwork image. Without it the cover shows `glyph` on `gradient`. */
  src?: string
  /**
   * Describes the artwork ("Albumcover: Nachtfahrt"). Leave empty when the
   * title is already written next to the cover — the cover is then decorative.
   */
  alt?: string
  /** CSS background for the placeholder (and behind a loading image). */
  gradient?: string
  /** Placeholder glyph (default `note`). */
  glyph?: GlyphName
  /** small 64 px (mini player) · medium 160 px · large 264 px · fill = container width · or a px number. */
  size?: CoverSize | number
}

/** A usable px size, or undefined for anything that cannot size a box (0, negative, NaN, Infinity). */
function pixelSize(size: CoverSize | number): string | undefined {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return undefined
  return `${Math.round(size)}px`
}

/**
 * Album-art cover in the manner of a music player's "now playing" screen.
 *
 * Paused, the art shrinks to 82 % and rests with a small shadow; playing, it
 * grows back to full size and floats on a deep shadow. Growing uses the
 * `gentle` spring (it swells into place), shrinking the `snappy` spring (it
 * settles at once). Both shadows are separate layers that cross-fade by
 * opacity — no box-shadow is animated. The layout box never changes size,
 * so nothing around the cover moves.
 *
 * Under reduced motion the cover keeps its size; paused art is dimmed and
 * the deep shadow is hidden, so the state still reads.
 *
 * Layout note: the floating shadow reaches well below the cover (up to
 * ~110 px for `large`/`fill`), and a transformed element paints above
 * later non-positioned content. Give text placed right below or beside the
 * cover `position: relative`, so it paints above the shadow instead of being
 * dimmed by it.
 */
export function Cover({
  playing,
  src,
  alt,
  gradient,
  glyph = 'note',
  size = 'medium',
  className,
  style,
  ...rest
}: CoverProps) {
  const px = pixelSize(size)
  const named = px ? undefined : typeof size === 'string' ? size : 'medium'

  const vars: Record<string, string> = {}
  if (px) vars['--ui-touch-cover-size'] = px
  if (gradient) vars['--ui-touch-cover-bg'] = gradient

  // The image names itself with alt. A placeholder is one image when it has alt, otherwise pure decoration.
  const a11y = src
    ? {}
    : alt
      ? { role: 'img' as const, 'aria-label': alt }
      : { 'aria-hidden': true as const }

  return (
    <div
      {...a11y}
      {...rest}
      className={cx('ui-touch-cover', named && `ui-touch-cover--${named}`, className)}
      style={{ ...vars, ...style } as CSSProperties}
      data-playing={playing || undefined}
    >
      <div className="ui-touch-cover-art">
        {src ? (
          <img className="ui-touch-cover-image" src={src} alt={alt ?? ''} draggable={false} decoding="async" />
        ) : (
          <Glyph name={glyph} className="ui-touch-cover-glyph" />
        )}
      </div>
    </div>
  )
}
