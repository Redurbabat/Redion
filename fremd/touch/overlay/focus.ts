const CANDIDATES = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',')

/** Keyboard-focusable elements inside `root`, in DOM (tab) order. */
export function tabbables(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES)).filter((el) => {
    if (el.getAttribute('tabindex') === '-1') return false
    if (el.closest('[hidden], [inert]')) return false
    // Real browsers: skip elements that are not rendered (display: none / visibility hidden).
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true } as never)) return false
    return true
  })
}

/** Handles Tab / Shift+Tab so focus cycles inside `container`. */
export function trapTab(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== 'Tab') return
  const items = tabbables(container)
  const first = items[0]
  const last = items.at(-1)
  if (!first || !last) {
    event.preventDefault()
    container.focus()
    return
  }
  const active = document.activeElement
  const inside = active instanceof Node && container.contains(active)
  if (event.shiftKey && (active === first || !inside || active === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !inside)) {
    event.preventDefault()
    first.focus()
  }
}
