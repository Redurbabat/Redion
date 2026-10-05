import { useEffect, useRef, type RefObject } from 'react'
import { trapTab, tabbables } from './focus'
import { setInertOutside } from './inert'
import { lockScroll } from './scrollLock'

export interface ModalOptions {
  open: boolean
  /** Called for Escape (and by components for scrim taps / swipes). */
  onClose: () => void
  /** The dialog element (role="dialog", tabIndex -1). */
  containerRef: RefObject<HTMLElement | null>
  /** Default true — every overlay closes with Escape unless it must block. */
  closeOnEscape?: boolean | undefined
  /** Element to focus on open; default: first focusable, else the dialog. */
  initialFocusRef?: RefObject<HTMLElement | null> | undefined
  /** Return focus to the element that had it before opening. Default true. */
  restoreFocus?: boolean | undefined
  /** Make the rest of the page inert (modal). Default true. */
  inertOutside?: boolean | undefined
  /** Lock page scroll. Default true. */
  lockPageScroll?: boolean | undefined
  /** Element made "outside-proof" instead of the dialog (e.g. its portal root). */
  layerRef?: RefObject<HTMLElement | null> | undefined
}

interface StackEntry {
  close: () => void
  escape: () => boolean
}

// Open overlays, bottom → top. Only the top one reacts to Escape / Tab.
const stack: StackEntry[] = []

function onDocumentKeyDown(event: KeyboardEvent) {
  const top = stack[stack.length - 1]
  if (!top || event.key !== 'Escape' || event.defaultPrevented) return
  if (top.escape()) {
    event.preventDefault()
    event.stopPropagation()
    top.close()
  }
}

/**
 * Everything a modal overlay needs for accessibility: focus in on open,
 * Tab stays inside, Escape closes (top-most only), background inert, page
 * scroll locked, focus back to the trigger on close.
 */
export function useModal({
  open,
  onClose,
  containerRef,
  closeOnEscape = true,
  initialFocusRef,
  restoreFocus = true,
  inertOutside = true,
  lockPageScroll = true,
  layerRef,
}: ModalOptions) {
  // Latest callbacks without re-running the effect on every render.
  const latest = useRef({ onClose, closeOnEscape })
  latest.current = { onClose, closeOnEscape }

  useEffect(() => {
    if (!open) return
    const container = containerRef.current
    if (!container) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const entry: StackEntry = {
      close: () => latest.current.onClose(),
      escape: () => latest.current.closeOnEscape,
    }
    stack.push(entry)
    if (stack.length === 1) document.addEventListener('keydown', onDocumentKeyDown)

    const onTab = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] === entry) trapTab(event, container)
    }
    document.addEventListener('keydown', onTab)

    const releaseInert = inertOutside ? setInertOutside(layerRef?.current ?? container) : () => {}
    const releaseScroll = lockPageScroll ? lockScroll() : () => {}

    const target = initialFocusRef?.current ?? tabbables(container)[0] ?? container
    target.focus({ preventScroll: true })

    return () => {
      const index = stack.indexOf(entry)
      if (index !== -1) stack.splice(index, 1)
      if (stack.length === 0) document.removeEventListener('keydown', onDocumentKeyDown)
      document.removeEventListener('keydown', onTab)
      releaseInert()
      releaseScroll()
      if (restoreFocus && previous?.isConnected) previous.focus({ preventScroll: true })
    }
    // Options are read once per opening on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

/** Number of open modal overlays (for tests and nested-sheet logic). */
export function openModalCount() {
  return stack.length
}
