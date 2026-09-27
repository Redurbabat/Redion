import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { Portal } from '../overlay/Portal'
import { placePopover, type Placement } from '../overlay/position'
import { useModal } from '../overlay/useModal'
import { usePresence } from '../overlay/usePresence'
import './Popover.css'

export interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The element the popover points at (usually the trigger button). */
  anchorRef: RefObject<HTMLElement | null>
  /** Accessible name of the popover. */
  label: string
  prefer?: 'top' | 'bottom'
  children: ReactNode
  className?: string
  /** 'dialog' for free content, 'menu' when children are menu items. */
  role?: 'dialog' | 'menu'
  width?: number
}

const EXIT_MS = 150

/**
 * Floating panel that grows out of its anchor (transform-origin at the
 * anchor, snappy spring) and shrinks back into it. Escape and a tap
 * outside close it; focus moves in and returns to the trigger. Unlike a
 * sheet it does not lock scrolling or dim the page.
 */
export function Popover({
  open,
  onOpenChange,
  anchorRef,
  label,
  prefer,
  children,
  className,
  role = 'dialog',
  width = 250,
}: PopoverProps) {
  const { state, mounted, onExitEnd } = usePresence(open, EXIT_MS)
  const panelRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const pointerDownOutside = useRef(false)

  useLayoutEffect(() => {
    if (!mounted || state !== 'open') return
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const measure = () => {
      const r = anchor.getBoundingClientRect()
      setPlacement(
        placePopover(
          { top: r.top, left: r.left, width: r.width, height: r.height },
          { width, height: panel.scrollHeight },
          { width: window.innerWidth, height: window.innerHeight },
          { prefer },
        ),
      )
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [mounted, state, anchorRef, prefer, width])

  useModal({
    open: mounted && state === 'open',
    onClose: () => onOpenChange(false),
    containerRef: panelRef,
    layerRef,
    inertOutside: false,
    lockPageScroll: false,
  })

  if (!mounted) return null

  const style = placement
    ? ({
        top: placement.top,
        left: placement.left,
        width,
        maxHeight: placement.maxHeight,
        transformOrigin: `${placement.originX}px ${placement.originY}px`,
      } as CSSProperties)
    : ({ visibility: 'hidden', width } as CSSProperties)

  return (
    <Portal>
      <div
        ref={layerRef}
        className="ui-touch-popover-layer"
        data-state={state}
        // Close only when the press both starts and ends outside (a drag that
        // began inside and ended outside must not close it — F7 pitfall).
        onPointerDown={(e) => {
          pointerDownOutside.current = !panelRef.current?.contains(e.target as Node)
        }}
        onClick={(e) => {
          if (pointerDownOutside.current && !panelRef.current?.contains(e.target as Node)) onOpenChange(false)
        }}
      >
        <div
          ref={panelRef}
          className={cx('ui-touch-popover', className)}
          data-side={placement?.side}
          data-placed={placement ? '' : undefined}
          role={role}
          aria-label={label}
          tabIndex={-1}
          style={style}
          onAnimationEnd={onExitEnd}
        >
          {children}
        </div>
      </div>
    </Portal>
  )
}

export interface MenuItem {
  label: string
  icon?: GlyphName
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

function MenuItemButton({ item, onChoose }: { item: MenuItem; onChoose: () => void }) {
  const { pressProps } = usePress<HTMLButtonElement>({}, item.disabled)
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      {...pressProps}
      className={cx('ui-touch-menu-item', item.destructive && 'ui-touch-menu-item--destructive')}
      disabled={item.disabled}
      onClick={onChoose}
    >
      <span>{item.label}</span>
      {item.icon && <Glyph name={item.icon} size={20} />}
    </button>
  )
}

/** Arrow keys, Home and End move between the enabled items of a menu. */
export function moveMenuFocus(items: HTMLElement[], current: number, key: string): number {
  const enabled = items.map((el, i) => (el.hasAttribute('disabled') ? -1 : i)).filter((i) => i >= 0)
  if (enabled.length === 0) return -1
  const position = enabled.indexOf(current)
  if (key === 'Home') return enabled[0]
  if (key === 'End') return enabled[enabled.length - 1]
  if (key === 'ArrowDown') return enabled[(position + 1 + enabled.length) % enabled.length]
  if (key === 'ArrowUp') return enabled[(position - 1 + enabled.length * 2) % enabled.length]
  return current
}

export interface MenuProps extends Omit<PopoverProps, 'children' | 'role'> {
  items: MenuItem[]
}

/** A popover with menu semantics (role=menu / menuitem, arrow-key navigation). */
export function Menu({ items, onOpenChange, ...rest }: MenuProps) {
  const listRef = useRef<HTMLDivElement>(null)
  // Menus start with the first enabled item focused (the popover focused its panel before this runs).
  useEffect(() => {
    if (!rest.open) return
    listRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
  }, [rest.open])
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const current = buttons.indexOf(document.activeElement as HTMLElement)
    const next = moveMenuFocus(buttons, current, event.key)
    buttons[next]?.focus()
  }
  return (
    <Popover {...rest} onOpenChange={onOpenChange} role="menu">
      <div ref={listRef} className="ui-touch-menu" onKeyDown={onKeyDown}>
        {items.map((item) => (
          <MenuItemButton
            key={item.label}
            item={item}
            onChoose={() => {
              item.onSelect?.()
              onOpenChange(false)
            }}
          />
        ))}
      </div>
    </Popover>
  )
}

export interface ContextMenuProps {
  items: MenuItem[]
  /** Accessible name of the menu. */
  label: string
  /** The element that can be long-pressed / right-clicked. Must be focusable for keyboard users. */
  children: ReactNode
  /** Hold duration for touch (ms). */
  holdMs?: number
  className?: string
}

/**
 * Long-press (touch), right-click (mouse) or the context-menu key / Shift+F10
 * (keyboard) opens a menu. While pressed, the element "lifts" towards the
 * finger (scale up with a deeper shadow) — the iOS context-menu preview.
 */
export function ContextMenu({ items, label, children, holdMs = 450, className }: ContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const start = useRef({ x: 0, y: 0 })
  const menuId = useId()

  const cancelHold = () => {
    window.clearTimeout(timer.current)
    if (!open) setLifted(false)
  }
  const openMenu = () => {
    setLifted(true)
    setOpen(true)
  }

  return (
    <>
      <div
        ref={anchorRef}
        className={cx('ui-touch-context-target', className)}
        data-lifted={lifted || undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onContextMenu={(e) => {
          e.preventDefault()
          openMenu()
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return
          start.current = { x: e.clientX, y: e.clientY }
          setLifted(true)
          timer.current = window.setTimeout(openMenu, holdMs)
        }}
        onPointerMove={(e) => {
          if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) cancelHold()
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => {
          if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
            e.preventDefault()
            openMenu()
          }
        }}
      >
        {children}
      </div>
      <Menu
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setLifted(false)
        }}
        anchorRef={anchorRef}
        label={label}
        items={items}
      />
    </>
  )
}
