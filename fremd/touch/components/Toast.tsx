import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createVelocityTracker } from '../gesture/velocity'
import { rubberband } from '../gesture/rubberband'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { openModalCount } from '../overlay/useModal'
import './Toast.css'

export interface ToastOptions {
  title: string
  message?: string
  icon?: GlyphName
  tone?: 'neutral' | 'success' | 'danger'
  action?: { label: string; onSelect: () => void }
  /** Milliseconds before it leaves on its own; 0 keeps it until dismissed. Default 4000. */
  duration?: number
}

interface ToastEntry {
  id: number
  options: ToastOptions
  state: 'open' | 'closing'
}

interface ToastApi {
  show: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}

const MAX_VISIBLE = 3
const EXIT_MS = 220
/** Upward swipe (px) or speed (px/s) that dismisses. */
export const TOAST_SWIPE_DISTANCE = 32
export const TOAST_SWIPE_VELOCITY = 300

/** Decides on release whether an upward swipe dismisses the toast. */
export function shouldDismissToast(offset: number, velocity: number): boolean {
  return offset <= -TOAST_SWIPE_DISTANCE || velocity <= -TOAST_SWIPE_VELOCITY
}

export interface ToastProviderProps {
  children: ReactNode
  /** Accessible name of the live region. */
  label?: string
  dismissLabel?: string
  /** Contain toasts inside an element (demo phone frame) instead of the viewport. */
  contained?: boolean
}

/**
 * Hosts toasts. They drop in from the top on the bouncy spring, stack like
 * notifications (older ones sink back), pause while hovered or focused,
 * and leave after a few seconds, on an upward swipe, via their close
 * button or with Escape (newest first, only when no modal is open).
 */
export function ToastProvider({ children, label = 'Benachrichtigungen', dismissLabel = 'Schliessen', contained = false }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, state: 'closing' } : t)))
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    setToasts((list) => [{ id, options, state: 'open' as const }, ...list].slice(0, MAX_VISIBLE + 1))
    return id
  }, [])

  // Escape closes the newest toast — unless a modal overlay owns Escape right now.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || openModalCount() > 0) return
      const newest = toasts.find((t) => t.state === 'open')
      if (newest) dismiss(newest.id)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [toasts, dismiss])

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])
  const open = toasts.filter((t) => t.state === 'open')

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section
        className={cx('ui-touch-toast-region', contained && 'ui-touch-toast-region--contained')}
        aria-label={label}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => (
          <ToastView
            key={toast.id}
            entry={toast}
            depth={toast.state === 'open' ? open.indexOf(toast) : 0}
            dismissLabel={dismissLabel}
            onDismiss={() => dismiss(toast.id)}
            onGone={() => remove(toast.id)}
          />
        ))}
      </section>
    </ToastContext.Provider>
  )
}

function ToastView({
  entry,
  depth,
  dismissLabel,
  onDismiss,
  onGone,
}: {
  entry: ToastEntry
  depth: number
  dismissLabel: string
  onDismiss: () => void
  onGone: () => void
}) {
  const { options, state } = entry
  const { title, message, icon, tone = 'neutral', action, duration = 4000 } = options
  const [paused, setPaused] = useState(false)
  const [drag, setDrag] = useState<number | null>(null)
  const remaining = useRef(duration)
  const startedAt = useRef(0)
  const gesture = useRef<{ startY: number; tracker: ReturnType<typeof createVelocityTracker> } | null>(null)
  const hidden = depth >= MAX_VISIBLE

  // Auto-dismiss timer that pauses while hovered, focused or dragged, and for toasts buried in the stack.
  useEffect(() => {
    if (state !== 'open' || duration === 0 || paused || drag !== null || depth > 0) return
    startedAt.current = Date.now()
    const timer = window.setTimeout(onDismiss, remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
    }
  }, [state, duration, paused, drag, depth, onDismiss])

  // Leave the DOM after the exit animation (with a safety net if animationend never fires).
  useEffect(() => {
    if (state !== 'closing') return
    const timer = window.setTimeout(onGone, EXIT_MS + 80)
    return () => window.clearTimeout(timer)
  }, [state, onGone])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return
    gesture.current = { startY: event.clientY, tracker: createVelocityTracker() }
    gesture.current.tracker.add(0, event.timeStamp)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag(0)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const raw = event.clientY - g.startY
    const offset = raw < 0 ? raw : rubberband(raw, 200)
    g.tracker.add(offset, event.timeStamp)
    setDrag(offset)
  }
  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    const offset = drag ?? 0
    if (shouldDismissToast(offset, g.tracker.velocity(event.timeStamp))) onDismiss()
    setDrag(null)
  }

  return (
    <div
      className={cx('ui-touch-toast', `ui-touch-toast--${tone}`)}
      data-state={state}
      data-dragging={drag !== null || undefined}
      hidden={hidden}
      style={
        {
          '--ui-touch-toast-depth': depth,
          '--ui-touch-toast-drag': `${drag ?? 0}px`,
          zIndex: MAX_VISIBLE - depth,
        } as CSSProperties
      }
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div
        className="ui-touch-toast-body"
        role="status"
        onAnimationEnd={(e) => {
          if (state === 'closing' && e.target === e.currentTarget) onGone()
        }}
      >
        {icon && (
          <span className="ui-touch-toast-icon" aria-hidden="true">
            <Glyph name={icon} size={20} />
          </span>
        )}
        <div className="ui-touch-toast-text">
          <strong>{title}</strong>
          {message && <span>{message}</span>}
        </div>
        {action && (
          <button
            type="button"
            className="ui-touch-toast-action"
            onClick={() => {
              action.onSelect()
              onDismiss()
            }}
          >
            {action.label}
          </button>
        )}
        <button type="button" className="ui-touch-toast-close" aria-label={dismissLabel} onClick={onDismiss}>
          <Glyph name="close" size={16} />
        </button>
      </div>
    </div>
  )
}
