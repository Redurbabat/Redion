import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  use,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { SwipeActions, type SwipeActionsProps } from './SwipeActions'
import './List.css'

export type ListVariant = 'inset' | 'plain'

/** Kit colours for a leading icon tile; any other string is used as a CSS colour. */
export type ListTileTint = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'gray'

/** A rounded-square colour tile with a glyph, like the icons of a settings screen. */
export interface ListRowTile {
  glyph: GlyphName
  /** Named kit tint (default `accent`) or any CSS colour, e.g. `#f08a24`. */
  tint?: ListTileTint | (string & {}) | undefined
  /** Glyph colour. Named tints pick a readable one; custom tints default to white. */
  ink?: string | undefined
}

export interface ListProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  /** `inset` = rounded card with side margins (settings screen), `plain` = full-bleed. */
  variant?: ListVariant | undefined
  /** Short text above the list. It also becomes the list's accessible name. */
  header?: ReactNode | undefined
  /** Note below the list. It also becomes the list's accessible description. */
  footer?: ReactNode | undefined
  /** Rows rise into place one after another when the list mounts (35 ms apart, at most 350 ms). */
  appear?: boolean | undefined
  /** `ListRow`s. Arrays, fragments and conditional `{cond && …}` rows are fine: each row counts on its own. */
  children?: ReactNode | undefined
}

export interface ListRowProps extends Omit<ComponentPropsWithRef<'li'>, 'title' | 'onClick' | 'children'> {
  title: ReactNode
  /** Second line under the title (the row grows to at least 52 px). */
  subtitle?: ReactNode | undefined
  /** Secondary text on the trailing side, e.g. the current value. */
  detail?: ReactNode | undefined
  /** A `{ glyph, tint }` icon tile, or any node (avatar, image). */
  leading?: ReactNode | ListRowTile | undefined
  /**
   * Custom node at the end, e.g. a Badge or a Toggle. Inside a row with
   * `href` / `onClick` it must not be interactive itself (no control inside a
   * link or button) — give a Toggle row no action instead.
   */
  trailing?: ReactNode | undefined
  /** Disclosure chevron. Default: shown when the row has `href` or `onClick`; a choice row (`selected`) shows its check instead. */
  chevron?: boolean | undefined
  /** Makes the whole row a link. */
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  /** Makes the whole row a button (unless `href` is set, then it is the link's click handler). */
  onClick?: ((event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void) | undefined
  disabled?: boolean | undefined
  /** Destructive action (sign out, delete): the title uses the danger colour. */
  destructive?: boolean | undefined
  /**
   * Makes a button row (`onClick`, no `href`) a choice in a picker, single or
   * multiple choice: `true` shows an accent check mark at the end, `false`
   * keeps its place empty so the text never jumps; it replaces the chevron.
   * The row's button gets `aria-pressed`, so a screen reader reads the title
   * (subtitle, detail) and then "toggle button, pressed" / "not pressed"
   * (wording varies by reader); the mark itself stays silent. Chosen because
   * `aria-selected` / `aria-checked` are ignored on a button and radio roles
   * would need a radiogroup with arrow-key focus. The pressed state does not
   * say the choices exclude each other: name a single choice in the `List`
   * header (e.g. "Sortieren nach"). Controlled: set it from your state in
   * `onClick`. Links and static rows cannot carry the state and show no mark.
   */
  selected?: boolean | undefined
  /** Position for the staggered entrance. Set automatically inside `List`. */
  index?: number | undefined
  /** Hairline under the row. Default: every row of a `List` except the last one. */
  divider?: boolean | undefined
  /**
   * Swipe actions (e.g. `{ trailing: [{ label: 'Löschen', tone: 'danger', onSelect }] }`):
   * the row content slides aside to reveal them. They are also real buttons
   * after the row for keyboard and screen readers, named after a string
   * `title` ("Löschen: Nachtfahrt"); set `context` for another name (`''`: none).
   */
  swipe?: Omit<SwipeActionsProps, 'children' | 'className'> | undefined
}

interface RowPosition {
  index: number
  last: boolean
}

/** Where a row sits in its List: drives the stagger delay and the last-row divider. */
const ListRowPosition = createContext<RowPosition | null>(null)

const TILE_TINTS: ReadonlySet<string> = new Set<ListTileTint>(['accent', 'info', 'success', 'warning', 'danger', 'gray'])

const hasContent = (node: unknown) => node != null && node !== false && node !== ''

interface RowItem {
  key: string
  node: ReactNode
}

/**
 * The rows in render order: null/false dropped, arrays and fragments
 * flattened, so `{cond && <>…</>}` groups get their own index and divider.
 * Keys come from `Children.toArray` (stable when conditional rows come and
 * go, so existing rows are not remounted and do not replay their entrance),
 * prefixed with the fragment's key so rows of two fragments never collide.
 */
function flattenRows(children: ReactNode, prefix = ''): RowItem[] {
  return Children.toArray(children).flatMap((child, position) => {
    const key = `${prefix}${isValidElement(child) && child.key != null ? child.key : position}`
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return flattenRows(child.props.children, `${key}/`)
    }
    return [{ key, node: child }]
  })
}

/**
 * Grouped list like a settings screen: optional header text, a rounded card
 * of rows (`inset`) or full-bleed rows (`plain`), optional footer note.
 *
 * Motion: with `appear`, rows rise 12 px and fade in on the `smooth` spring,
 * staggered by 35 ms (capped at 350 ms). Under reduced motion they only fade,
 * all at once.
 */
export function List({ variant = 'inset', header, footer, appear = false, className, children, ...rest }: ListProps) {
  const id = useId()
  const headerId = hasContent(header) ? `${id}-header` : undefined
  const footerId = hasContent(footer) ? `${id}-footer` : undefined
  const items = flattenRows(children)

  return (
    <section {...rest} className={cx('ui-touch-list-section', `ui-touch-list-section--${variant}`, className)}>
      {headerId && (
        <div id={headerId} className="ui-touch-list-header">
          {header}
        </div>
      )}
      <ul
        className={cx('ui-touch-list', `ui-touch-list--${variant}`, appear && 'ui-touch-list--appear')}
        aria-labelledby={headerId}
        aria-describedby={footerId}
      >
        {items.map((item, index) => (
          <ListRowPosition key={item.key} value={{ index, last: index === items.length - 1 }}>
            {item.node}
          </ListRowPosition>
        ))}
      </ul>
      {footerId && (
        <div id={footerId} className="ui-touch-list-footer">
          {footer}
        </div>
      )}
    </section>
  )
}

function isTile(value: unknown): value is ListRowTile {
  return typeof value === 'object' && value !== null && !isValidElement(value) && 'glyph' in value
}

function ListTile({ glyph, tint = 'accent', ink }: ListRowTile) {
  const named = TILE_TINTS.has(tint)
  const style = {
    '--ui-touch-list-tile-bg': named ? undefined : tint,
    '--ui-touch-list-tile-ink': ink,
  } as CSSProperties
  return (
    <span className={cx('ui-touch-list-tile', named && `ui-touch-list-tile--${tint}`)} style={style} aria-hidden="true">
      <Glyph name={glyph} size={18} />
    </span>
  )
}

/**
 * One row. With `href` it is an `<a>`, with `onClick` a `<button>`, filling
 * the whole row so the entire row is the target; otherwise a plain `<div>`.
 *
 * Press: like iOS rows it does not move — a highlight appears instantly and
 * fades out over 300 ms on release; the row's own divider (and the one above
 * it) hides while pressed. The disclosure chevron nudges forward on the
 * `press` spring.
 *
 * Choice (`selected`): the accent check grows in from nothing on the
 * `bouncy` spring and fades out when deselected; under reduced motion it
 * only fades.
 *
 * Everything visible lives in `.ui-touch-list-row-content`; with `swipe`,
 * a SwipeActions layer wraps exactly that element, so the row and its
 * hairline slide while the `<li>` stays in place.
 */
export function ListRow({
  title,
  subtitle,
  detail,
  leading,
  trailing,
  chevron,
  href,
  target,
  rel,
  onClick,
  disabled = false,
  destructive = false,
  selected,
  index,
  divider,
  swipe,
  className,
  style,
  ...rest
}: ListRowProps) {
  const position = use(ListRowPosition)
  const order = index ?? position?.index
  const showDivider = divider ?? !position?.last
  const action = href !== undefined ? 'link' : onClick !== undefined ? 'button' : null
  // Only a button can carry the pressed state, so only a button row is a choice.
  const selectable = action === 'button' && typeof selected === 'boolean'
  const showChevron = chevron ?? (action !== null && !selectable)
  const { pressProps } = usePress<HTMLElement>({}, disabled || action === null)
  // Space scrolls the page and never follows a link, so a link row shows the press for Enter only.
  const linkPressProps = {
    ...pressProps,
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key !== ' ') pressProps.onKeyDown(event)
    },
  }

  const inner = (
    <>
      {hasContent(leading) && (
        <span className="ui-touch-list-row-leading">{isTile(leading) ? <ListTile {...leading} /> : (leading as ReactNode)}</span>
      )}
      <span className="ui-touch-list-row-body">
        <span className="ui-touch-list-row-text">
          <span className="ui-touch-list-row-title">{title}</span>
          {hasContent(subtitle) && <span className="ui-touch-list-row-subtitle">{subtitle}</span>}
        </span>
        {hasContent(detail) && <span className="ui-touch-list-row-detail">{detail}</span>}
        {hasContent(trailing) && <span className="ui-touch-list-row-trailing">{trailing}</span>}
        {/* Always there on a choice row (hidden while unselected), so the text keeps its place. */}
        {selectable && <Glyph name="check" size={20} className="ui-touch-list-row-check" />}
        {showChevron && <Glyph name="chevron-right" size={18} className="ui-touch-list-row-chevron" />}
      </span>
    </>
  )

  const contentClass = cx('ui-touch-list-row-content', action && 'ui-touch-list-row-content--action')
  let content: ReactNode
  if (action === 'link') {
    content = (
      <a
        {...linkPressProps}
        className={contentClass}
        // A disabled link has no href (not focusable, not followable) but keeps its link role.
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        role={disabled ? 'link' : undefined}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
      >
        {inner}
      </a>
    )
  } else if (action === 'button') {
    content = (
      <button
        {...pressProps}
        type="button"
        className={contentClass}
        disabled={disabled}
        aria-pressed={selectable ? selected : undefined}
        onClick={onClick}
      >
        {inner}
      </button>
    )
  } else {
    content = <div className={contentClass}>{inner}</div>
  }

  return (
    <li
      {...rest}
      className={cx(
        'ui-touch-list-row',
        showDivider && 'ui-touch-list-row--divider',
        hasContent(subtitle) && 'ui-touch-list-row--subtitle',
        destructive && 'ui-touch-list-row--destructive',
        className,
      )}
      style={order === undefined ? style : ({ ...style, '--ui-touch-list-index': String(order) } as CSSProperties)}
    >
      {swipe ? (
        <SwipeActions {...swipe} context={swipe.context ?? (typeof title === 'string' ? title : undefined)}>
          {content}
        </SwipeActions>
      ) : (
        content
      )}
    </li>
  )
}
