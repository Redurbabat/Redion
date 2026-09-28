import {
  isValidElement,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { prefersReducedMotion } from '../motion/reducedMotion'
import './Card.css'

export type CardVariant = 'plain' | 'feature'

/** Media on top of the card: any node, a CSS gradient (decorative) or an image (with alt text). */
export type CardMedia = ReactNode | { gradient: string } | { src: string; alt: string }

/** Largest pointer tilt in degrees. */
export const CARD_TILT_MAX = 4

export interface CardTilt {
  /** Degrees around the horizontal axis (− = top edge towards the viewer). */
  rotateX: number
  /** Degrees around the vertical axis (+ = left edge towards the viewer). */
  rotateY: number
}

/**
 * Tilt for a pointer at `point` over a card occupying `rect`: flat in the
 * centre, `max` degrees at the edges, the side under the pointer lifting
 * towards the viewer. (A side that dipped away would, under perspective,
 * slide out from under the pointer, end the hover and flicker at the
 * edges.) Clamped to the card and rounded to hundredths; an empty rect
 * gives a flat card.
 */
export function cardTilt(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  max = CARD_TILT_MAX,
): CardTilt {
  if (!(rect.width > 0 && rect.height > 0)) return { rotateX: 0, rotateY: 0 }
  const nx = clampUnit(((point.x - rect.left) / rect.width) * 2 - 1)
  const ny = clampUnit(((point.y - rect.top) / rect.height) * 2 - 1)
  return { rotateX: round2(ny * max), rotateY: round2(-nx * max) }
}

function clampUnit(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(-1, value)) : 0
}

/** Rounds to hundredths; `+ 0` turns -0 into 0 so styles never read "-0deg". */
function round2(value: number) {
  return Math.round(value * 100) / 100 + 0
}

export interface CardProps extends Omit<ComponentPropsWithRef<'article'>, 'title' | 'onClick' | 'children'> {
  /** Card title — rendered as the heading (not the HTML tooltip attribute). */
  title: ReactNode
  /** Small uppercase line above the title ("HEUTE", "APP DES TAGES"). */
  eyebrow?: ReactNode | undefined
  /** One line below the title. */
  subtitle?: ReactNode | undefined
  media?: CardMedia | undefined
  /** `plain` = media on top, text below. `feature` = large media with the title on a scrim at its bottom. */
  variant?: CardVariant | undefined
  /** Heading level of the title (default 3). */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  /** Makes the whole card a link. */
  href?: string | undefined
  /** Makes the whole card a button (or, together with `href`, a link with a click handler). */
  onClick?: ((event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void) | undefined
  /** Gentle tilt towards a mouse pointer (never for touch or reduced motion). Default: on for interactive cards. */
  tilt?: boolean | undefined
  /** Body below the title (or below the media for `feature`). Controls in here stay clickable on their own. */
  children?: ReactNode | undefined
}

/**
 * Things inside a card that are their own target, so pressing them must not press the card.
 * Card.css lets exactly these catch the pointer in the body — keep both lists in sync.
 */
const NESTED_CONTROL = 'a[href], button, input, select, textarea, label, summary, [tabindex]'

/**
 * Surface card with an optional media area, eyebrow, title and subtitle.
 *
 * With `href` or `onClick` the whole card is pressable, but the markup stays
 * a readable article: the title contains the real `<a>` / `<button>`, and
 * its stretched `::after` covers the card (one tab stop, a short accessible
 * name, eyebrow + subtitle as its description, headings stay navigable).
 * Controls in the body are lifted above that layer and keep working alone.
 *
 * Motion: pressed, the card sinks to 97 % at once and its raised shadow
 * fades away (an opacity layer, not an animated box-shadow), then springs
 * back on the `press` spring. With a mouse the edge under the pointer
 * lifts up to 4° towards the viewer. Under reduced motion it only dims and loses its shadow.
 */
export function Card({
  title,
  eyebrow,
  subtitle,
  media,
  variant = 'plain',
  headingLevel = 3,
  href,
  onClick,
  tilt,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onPointerMove,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...rest
}: CardProps) {
  const id = useId()
  const actionRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const { pressProps } = usePress<HTMLElement>()
  const isLink = href !== undefined
  const interactive = isLink || onClick !== undefined
  const tiltEnabled = interactive && tilt !== false

  const Heading = `h${headingLevel}` as const
  const eyebrowId = eyebrow != null ? `${id}-eyebrow` : undefined
  const subtitleId = subtitle != null ? `${id}-subtitle` : undefined
  const describedBy = [eyebrowId, subtitleId].filter(Boolean).join(' ') || undefined

  /**
   * True when the event starts on the card itself (its stretched action), not on a nested
   * control — and not in a portal (an overlay opened from the body), whose events React
   * bubbles through the component tree although they happen outside the card.
   */
  const startsOnCard = (event: PointerEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    const card = event.currentTarget
    const target = event.target as Element
    if (!card.contains(target)) return false
    const hit = target.closest?.(NESTED_CONTROL)
    // A match outside the card is an ancestor of it (e.g. a [tabindex] container), not a nested control.
    return !hit || hit === actionRef.current || !card.contains(hit)
  }

  const settleTilt = (element: HTMLElement) => {
    element.style.removeProperty('--ui-touch-card-tilt-x')
    element.style.removeProperty('--ui-touch-card-tilt-y')
    element.removeAttribute('data-tilting')
  }

  const interaction = interactive
    ? {
        'data-pressed': pressProps['data-pressed'],
        onPointerDown(event: PointerEvent<HTMLElement>) {
          onPointerDown?.(event)
          if (startsOnCard(event)) pressProps.onPointerDown(event)
        },
        onPointerUp(event: PointerEvent<HTMLElement>) {
          onPointerUp?.(event)
          pressProps.onPointerUp(event)
        },
        onPointerCancel(event: PointerEvent<HTMLElement>) {
          onPointerCancel?.(event)
          pressProps.onPointerCancel(event)
        },
        onPointerLeave(event: PointerEvent<HTMLElement>) {
          onPointerLeave?.(event)
          pressProps.onPointerLeave(event)
          settleTilt(event.currentTarget)
        },
        onPointerMove(event: PointerEvent<HTMLElement>) {
          onPointerMove?.(event)
          if (!tiltEnabled || event.pointerType !== 'mouse' || prefersReducedMotion()) return
          // Written straight to the element: a pointer move must not re-render React.
          const element = event.currentTarget
          // Over a portal (overlay from the body) the pointer is elsewhere on screen: lie flat.
          if (!element.contains(event.target as Node)) {
            settleTilt(element)
            return
          }
          const { rotateX, rotateY } = cardTilt({ x: event.clientX, y: event.clientY }, element.getBoundingClientRect())
          element.style.setProperty('--ui-touch-card-tilt-x', `${rotateX}deg`)
          element.style.setProperty('--ui-touch-card-tilt-y', `${rotateY}deg`)
          element.setAttribute('data-tilting', '')
        },
        onKeyDown(event: KeyboardEvent<HTMLElement>) {
          onKeyDown?.(event)
          // Links follow on Enter only; Space scrolls the page, so it must not look like a press.
          if (isLink && event.key === ' ') return
          if (startsOnCard(event)) pressProps.onKeyDown(event)
        },
        onKeyUp(event: KeyboardEvent<HTMLElement>) {
          onKeyUp?.(event)
          pressProps.onKeyUp(event)
        },
        onBlur(event: FocusEvent<HTMLElement>) {
          onBlur?.(event)
          pressProps.onBlur(event)
        },
      }
    : { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, onPointerMove, onKeyDown, onKeyUp, onBlur }

  const actionProps = {
    className: 'ui-touch-card-action',
    'aria-describedby': describedBy,
    onClick,
  }

  const mediaNode = renderMedia(media, variant)

  return (
    <article
      {...rest}
      {...interaction}
      className={cx(
        'ui-touch-card',
        `ui-touch-card--${variant}`,
        interactive && 'ui-touch-card--interactive',
        tiltEnabled && 'ui-touch-card--tilt',
        className,
      )}
    >
      <div className="ui-touch-card-surface">
        {mediaNode}
        <hgroup className="ui-touch-card-heading">
          {eyebrow != null && (
            <p className="ui-touch-card-eyebrow" id={eyebrowId}>
              {eyebrow}
            </p>
          )}
          <Heading className="ui-touch-card-title">
            {isLink ? (
              <a {...actionProps} ref={actionRef} href={href}>
                {title}
              </a>
            ) : onClick ? (
              <button {...actionProps} ref={actionRef} type="button">
                {title}
              </button>
            ) : (
              title
            )}
          </Heading>
          {subtitle != null && (
            <p className="ui-touch-card-subtitle" id={subtitleId}>
              {subtitle}
            </p>
          )}
        </hgroup>
        {children != null && children !== false && <div className="ui-touch-card-body">{children}</div>}
      </div>
    </article>
  )
}

function isGradient(media: CardMedia): media is { gradient: string } {
  return typeof media === 'object' && media !== null && !isValidElement(media) && 'gradient' in media
}

function isImage(media: CardMedia): media is { src: string; alt: string } {
  return typeof media === 'object' && media !== null && !isValidElement(media) && 'src' in media
}

function renderMedia(media: CardMedia, variant: CardVariant) {
  if (isImage(media)) {
    return (
      <div className="ui-touch-card-media">
        <img className="ui-touch-card-image" src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      </div>
    )
  }
  if (isGradient(media)) {
    const style: CSSProperties = { background: media.gradient }
    return <div className="ui-touch-card-media" aria-hidden="true" style={style} />
  }
  if (media != null && media !== false && media !== '') {
    return <div className="ui-touch-card-media">{media as ReactNode}</div>
  }
  // A feature card's white title needs a dark-enough layer beneath it even without media.
  return variant === 'feature' ? (
    <div className="ui-touch-card-media ui-touch-card-media--fallback" aria-hidden="true" />
  ) : null
}
