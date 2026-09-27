import { useId, useRef } from 'react'
import { Glyph, type GlyphName } from '../icons/Glyph'
import { cx } from '../internal/cx'
import { usePress } from '../internal/usePress'
import { Portal } from '../overlay/Portal'
import { useModal } from '../overlay/useModal'
import { usePresence } from '../overlay/usePresence'
import './ActionSheet.css'

export interface ActionSheetAction {
  label: string
  icon?: GlyphName
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export interface ActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional heading; the sheet is always labelled (falls back to the cancel label). */
  title?: string
  message?: string
  actions: ActionSheetAction[]
  /** Label of the separate cancel button. Escape and scrim taps also cancel. */
  cancelLabel?: string
  container?: HTMLElement | null
}

const EXIT_MS = 240

function ActionButton({
  label,
  icon,
  destructive,
  disabled,
  bold,
  onClick,
}: ActionSheetAction & { bold?: boolean; onClick: () => void }) {
  const { pressProps } = usePress<HTMLButtonElement>({}, disabled)
  return (
    <button
      type="button"
      {...pressProps}
      className={cx(
        'ui-touch-action-sheet-button',
        destructive && 'ui-touch-action-sheet-button--destructive',
        bold && 'ui-touch-action-sheet-button--cancel',
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <Glyph name={icon} size={20} />}
      {label}
    </button>
  )
}

/**
 * Choice of actions sliding up from the bottom edge, with a separate
 * cancel button (thumb-reachable). Slides in on the smooth spring, leaves
 * the way it came. Escape and tapping outside cancel.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  message,
  actions,
  cancelLabel = 'Abbrechen',
  container,
}: ActionSheetProps) {
  const { state, mounted, onExitEnd } = usePresence(open, EXIT_MS)
  const panelRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const messageId = useId()
  const close = () => onOpenChange(false)

  useModal({ open: mounted && state === 'open', onClose: close, containerRef: panelRef, layerRef })

  if (!mounted) return null
  return (
    <Portal container={container}>
      <div
        ref={layerRef}
        className={cx('ui-touch-action-sheet-layer', container && 'ui-touch-action-sheet-layer--contained')}
        data-state={state}
      >
        <div className="ui-touch-action-sheet-scrim" aria-hidden="true" onClick={close} />
        <div
          ref={panelRef}
          className="ui-touch-action-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : cancelLabel}
          aria-describedby={message ? messageId : undefined}
          tabIndex={-1}
          onAnimationEnd={onExitEnd}
        >
          <div className="ui-touch-action-sheet-group">
            {(title || message) && (
              <div className="ui-touch-action-sheet-head">
                {title && (
                  <h2 id={titleId} className="ui-touch-action-sheet-title">
                    {title}
                  </h2>
                )}
                {message && (
                  <p id={messageId} className="ui-touch-action-sheet-message">
                    {message}
                  </p>
                )}
              </div>
            )}
            {actions.map((action) => (
              <ActionButton
                key={action.label}
                {...action}
                onClick={() => {
                  action.onSelect?.()
                  close()
                }}
              />
            ))}
          </div>
          <div className="ui-touch-action-sheet-group">
            <ActionButton label={cancelLabel} bold onClick={close} />
          </div>
        </div>
      </div>
    </Portal>
  )
}
