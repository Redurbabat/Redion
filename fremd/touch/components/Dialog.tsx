import { useId, useRef, type ReactNode } from 'react'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { Portal } from '../overlay/Portal'
import { useModal } from '../overlay/useModal'
import { usePresence } from '../overlay/usePresence'
import './Dialog.css'

export interface DialogAction {
  label: string
  /** 'cancel' is bold and answers Escape; 'destructive' is red. */
  role?: 'default' | 'cancel' | 'destructive'
  onSelect?: () => void
  disabled?: boolean
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message?: ReactNode
  /** Buttons; two sit side by side, three or more stack. */
  actions: DialogAction[]
  /** Extra content between message and buttons (e.g. a text field). */
  children?: ReactNode
  container?: HTMLElement | null
}

const EXIT_MS = 160

function DialogButton({ action, onChoose }: { action: DialogAction; onChoose: (a: DialogAction) => void }) {
  const { pressProps } = usePress<HTMLButtonElement>({}, action.disabled)
  return (
    <button
      type="button"
      {...pressProps}
      className={cx('ui-touch-dialog-button', action.role && `ui-touch-dialog-button--${action.role}`)}
      disabled={action.disabled}
      onClick={() => onChoose(action)}
    >
      {action.label}
    </button>
  )
}

/**
 * Centered alert. Appears by settling from a slightly larger scale (spring),
 * leaves with a quick fade. Escape runs the cancel action if there is one;
 * without a cancel action the alert must be answered (Escape does nothing).
 */
export function Dialog({ open, onOpenChange, title, message, actions, children, container }: DialogProps) {
  const { state, mounted, onExitEnd } = usePresence(open, EXIT_MS)
  const panelRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const messageId = useId()
  const cancel = actions.find((a) => a.role === 'cancel')

  const choose = (action: DialogAction) => {
    action.onSelect?.()
    onOpenChange(false)
  }

  useModal({
    open: mounted && state === 'open',
    onClose: () => cancel && choose(cancel),
    containerRef: panelRef,
    layerRef,
    closeOnEscape: Boolean(cancel),
  })

  if (!mounted) return null
  return (
    <Portal container={container}>
      <div ref={layerRef} className={cx('ui-touch-dialog-layer', container && 'ui-touch-dialog-layer--contained')} data-state={state}>
        <div className="ui-touch-dialog-scrim" aria-hidden="true" />
        <div
          ref={panelRef}
          className="ui-touch-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={message ? messageId : undefined}
          tabIndex={-1}
          onAnimationEnd={onExitEnd}
        >
          <div className="ui-touch-dialog-body">
            <h2 id={titleId} className="ui-touch-dialog-title">
              {title}
            </h2>
            {message && (
              <p id={messageId} className="ui-touch-dialog-message">
                {message}
              </p>
            )}
            {children}
          </div>
          <div className={cx('ui-touch-dialog-buttons', actions.length > 2 && 'ui-touch-dialog-buttons--stacked')}>
            {actions.map((action) => (
              <DialogButton key={action.label} action={action} onChoose={choose} />
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}
