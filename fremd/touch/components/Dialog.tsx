import { useId, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { Portal } from '../overlay/Portal'
import { useModal } from '../overlay/useModal'
import { usePresence } from '../overlay/usePresence'
import './Dialog.css'

export interface DialogAction {
  label: string
  /** Short second line under the label (what the choice will do). Screen readers hear it as the button's description, not its name. */
  hint?: ReactNode | undefined
  /** 'cancel' is bold and answers Escape; 'destructive' is red. */
  role?: 'default' | 'cancel' | 'destructive' | undefined
  onSelect?: (() => void) | undefined
  disabled?: boolean | undefined
  /** Extra attributes for the button, e.g. an id or data-* hooks. Type, click and disabled stay the dialog's. */
  buttonProps?: Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'onClick' | 'disabled' | 'children'> | undefined
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message?: ReactNode | undefined
  /** Buttons; two sit side by side, three or more stack. */
  actions: DialogAction[]
  /** Extra content between message and buttons (e.g. a text field). */
  children?: ReactNode | undefined
  container?: HTMLElement | null | undefined
}

const EXIT_MS = 160

function DialogButton({ action, onChoose }: { action: DialogAction; onChoose: (a: DialogAction) => void }) {
  const { pressProps } = usePress<HTMLButtonElement>({}, action.disabled)
  const hintId = useId()
  const own = action.buttonProps
  return (
    <button
      {...own}
      type="button"
      {...pressProps}
      className={cx('ui-touch-dialog-button', action.role && `ui-touch-dialog-button--${action.role}`, own?.className)}
      aria-describedby={action.hint ? hintId : own?.['aria-describedby']}
      disabled={action.disabled}
      onClick={() => onChoose(action)}
    >
      <span className="ui-touch-dialog-button-label">{action.label}</span>
      {action.hint && (
        <span id={hintId} className="ui-touch-dialog-button-hint">
          {action.hint}
        </span>
      )}
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
