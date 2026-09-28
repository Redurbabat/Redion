import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { lockAxis, slopFor } from '../gesture/axisLock'
import { resolveSwipeRelease, revealProgress, swipeDistance } from '../gesture/swipeActions'
import { createVelocityTracker } from '../gesture/velocity'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { keepFocusInList } from '../internal/keepFocusInList'
import './SwipeActions.css'

export interface SwipeAction {
  label: string
  icon?: GlyphName | undefined
  tone?: 'danger' | 'accent' | 'warning' | 'neutral' | undefined
  onSelect: () => void
}

export interface SwipeActionsProps {
  /** Revealed by swiping left (listed from the row edge outwards: the first is outermost). */
  trailing?: SwipeAction[] | undefined
  /** Revealed by swiping right. */
  leading?: SwipeAction[] | undefined
  /** A long swipe runs the first action of that side directly (e.g. delete). */
  fullSwipe?: boolean | undefined
  /**
   * Names the row for assistive technology: every action is then announced
   * as "<label>: <context>" (e.g. "Löschen: Nachtfahrt") while its visible
   * label stays short, so twenty rows do not read as twenty identical
   * "Löschen" buttons. `ListRow` passes a string title automatically.
   */
  context?: string | undefined
  children: ReactNode
  className?: string | undefined
}

type Side = 'leading' | 'trailing'

// Only one row is open at a time (opening one closes the previous).
let closeOpenRow: (() => void) | null = null

/**
 * Wraps a list row so it can be swiped aside to reveal actions.
 * - Follows the finger 1:1 until the actions are revealed, then resists
 *   (rubber band) — or runs freely when a full swipe is allowed.
 * - The action buttons pop in one after another as they are uncovered.
 * - Release: a flick decides by direction, otherwise past half opens.
 * - Keyboard / screen readers: the actions are real buttons after the row
 *   (DOM order: row, leading, trailing); focusing one slides the row open so
 *   it is visible, and focus going back to the row or leaving it closes it again.
 *   When an action removes its row (delete), focus moves on to the next row
 *   that can take it, else the nearest one above; when no row is left, the
 *   app moves it (e.g. to its empty state).
 */
export function SwipeActions({ trailing = [], leading = [], fullSwipe = false, context, children, className }: SwipeActionsProps) {
  const [open, setOpen] = useState<Side | null>(null)
  const [offset, setOffset] = useState(0) // px, negative = trailing revealed
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<Record<Side, HTMLDivElement | null>>({ leading: null, trailing: null })
  const gesture = useRef<{
    pointerId: number
    x: number
    y: number
    base: number
    axis: 'x' | 'y' | null
    tracker: ReturnType<typeof createVelocityTracker>
  } | null>(null)
  const suppressClick = useRef(false)

  const widthOf = (side: Side) => actionsRef.current[side]?.offsetWidth ?? 0
  const rowWidth = () => rootRef.current?.offsetWidth ?? 0

  const settle = (side: Side | null) => {
    setOpen(side)
    setOffset(side === 'trailing' ? -widthOf('trailing') : side === 'leading' ? widthOf('leading') : 0)
  }

  // Keep the "only one open row" rule.
  useEffect(() => {
    if (!open) return
    const close = () => settle(null)
    if (closeOpenRow && closeOpenRow !== close) closeOpenRow()
    closeOpenRow = close
    return () => {
      if (closeOpenRow === close) closeOpenRow = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // A second finger neither takes over nor restarts a swipe in progress
    // (the same pointer pressing again means its end was missed: start anew).
    const g = gesture.current
    if (g?.axis === 'x' && g.pointerId !== event.pointerId) return
    // A moved touch fires no click, so a swipe's pending suppression ends when the next press starts.
    suppressClick.current = false
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      base: offset,
      axis: null,
      tracker: createVelocityTracker(),
    }
    gesture.current.tracker.add(offset, event.timeStamp)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointerId) return
    const dx = event.clientX - g.x
    if (g.axis === null) {
      g.axis = lockAxis(dx, event.clientY - g.y, slopFor(event.pointerType))
      if (g.axis === 'y') {
        gesture.current = null // a vertical scroll: not ours
        return
      }
      if (g.axis === null) return
      g.x = event.clientX // start from here so the slop does not jump
      event.currentTarget.setPointerCapture?.(event.pointerId)
      window.getSelection()?.removeAllRanges() // a mouse drag must not leave text selected
      setDragging(true)
    }
    const raw = g.base + (event.clientX - g.x)
    const side: Side | null = raw < 0 && trailing.length ? 'trailing' : raw > 0 && leading.length ? 'leading' : null
    const next = side
      ? Math.sign(raw) * swipeDistance(Math.abs(raw), { actionsWidth: widthOf(side), rowWidth: rowWidth(), fullSwipe })
      : 0
    g.tracker.add(next, event.timeStamp)
    setOffset(next)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointerId) return
    gesture.current = null
    if (g.axis !== 'x') return
    setDragging(false)
    suppressClick.current = true
    const side: Side | null = offset < 0 ? 'trailing' : offset > 0 ? 'leading' : null
    if (!side) return settle(null)
    const direction = side === 'trailing' ? -1 : 1
    const decision = resolveSwipeRelease({
      distance: Math.abs(offset),
      velocity: g.tracker.velocity(event.timeStamp) * direction,
      actionsWidth: widthOf(side),
      rowWidth: rowWidth(),
      fullSwipe,
    })
    if (decision === 'full') {
      const action = (side === 'trailing' ? trailing : leading)[0]
      settle(null)
      action?.onSelect()
      return
    }
    settle(decision === 'open' ? side : null)
  }

  /**
   * The system took the pointer (a scroll, a call, a palm): the row goes back
   * to where the gesture started. A cancelled swipe never runs an action.
   */
  const cancelGesture = (pointerId: number) => {
    const g = gesture.current
    if (!g || pointerId !== g.pointerId) return
    gesture.current = null
    if (g.axis !== 'x') return
    setDragging(false)
    suppressClick.current = true
    settle(g.base < 0 ? 'trailing' : g.base > 0 ? 'leading' : null)
  }

  const renderActions = (side: Side, actions: SwipeAction[]) => {
    if (!actions.length) return null
    const revealed = side === 'trailing' ? Math.max(0, -offset) : Math.max(0, offset)
    const widths = actions.map(() => widthOf(side) / actions.length)
    const full = fullSwipe && revealed >= rowWidth() * 0.6
    return (
      <div
        ref={(el) => {
          actionsRef.current[side] = el
        }}
        className={cx('ui-touch-swipe-actions', `ui-touch-swipe-actions--${side}`)}
        data-full={full || undefined}
      >
        {actions.map((action, i) => (
          <button
            key={action.label}
            type="button"
            className={cx('ui-touch-swipe-action', `ui-touch-swipe-action--${action.tone ?? 'neutral'}`)}
            // Starts with the visible label (label-in-name), then says which row it acts on.
            aria-label={context ? `${action.label}: ${context}` : undefined}
            style={{ '--ui-touch-swipe-reveal': revealProgress(revealed, widths, i) } as CSSProperties}
            onFocus={() => settle(side)}
            onClick={() => {
              keepFocusInList(rootRef.current)
              settle(null)
              action.onSelect()
            }}
          >
            <span className="ui-touch-swipe-action-bubble" aria-hidden="true">
              {action.icon && <Glyph name={action.icon} size={20} />}
            </span>
            <span className="ui-touch-swipe-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cx('ui-touch-swipe', className)}
      data-open={open ?? undefined}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) settle(null)
      }}
    >
      <div
        className="ui-touch-swipe-content"
        data-dragging={dragging || undefined}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onFocus={(e) => {
          // Back from one of its actions (Shift+Tab): close, so the whole row shows and Enter activates it.
          const from = e.relatedTarget as Node | null
          if (open && !e.currentTarget.contains(from) && rootRef.current?.contains(from)) settle(null)
        }}
        onPointerCancel={(e) => cancelGesture(e.pointerId)}
        onLostPointerCapture={(e) => {
          // Only our own capture: a child's implicit capture ending bubbles up here too.
          if (e.target === e.currentTarget) cancelGesture(e.pointerId)
        }}
        onClickCapture={(e) => {
          // A swipe (or a tap that closes an open row) is not a click on the row.
          if (suppressClick.current || open) {
            e.preventDefault()
            e.stopPropagation()
            if (open && !suppressClick.current) settle(null)
          }
          suppressClick.current = false
        }}
      >
        {children}
      </div>
      {/* After the row, so reading and Tab order is row → its actions; CSS keeps the row on top. */}
      {renderActions('leading', leading)}
      {renderActions('trailing', trailing)}
    </div>
  )
}
