const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function siblings(el: Element, step: 'nextElementSibling' | 'previousElementSibling') {
  const found: Element[] = []
  for (let s = el[step]; s; s = s[step]) found.push(s)
  return found
}

/** The first control in `row` that can take focus now (a closed, `inert` part of a row does not count). */
function firstFocusable(row: Element): HTMLElement | undefined {
  return Array.from(row.querySelectorAll<HTMLElement>(FOCUSABLE)).find((el) => el.closest('[inert]') === null)
}

/**
 * Call right before an action that may remove its own row (delete).
 *
 * The focused button would disappear with the row and focus would fall back
 * to <body>. This watches the row (its `<li>`, else `root` itself) for a
 * short while: if it leaves the document and nothing else took the focus,
 * focus moves to the next row that can take it (static rows are skipped),
 * else to the nearest one above. With no such row left, the app decides.
 * Used by SwipeActions and DeleteButton.
 */
export function keepFocusInList(root: HTMLElement | null) {
  const row = root?.closest('li') ?? root
  const parent = row?.parentElement
  if (!row || !parent || typeof MutationObserver !== 'function') return
  // Taken now: once the row is gone it has no siblings to ask.
  const candidates = [...siblings(row, 'nextElementSibling'), ...siblings(row, 'previousElementSibling')]
  const observer = new MutationObserver(() => {
    if (row.isConnected) return
    stop()
    const active = document.activeElement
    if (active && active !== document.body && active.isConnected) return // focus already went somewhere on purpose
    const target = candidates
      .filter((el) => el.isConnected)
      .map(firstFocusable)
      .find((el) => el !== undefined)
    target?.focus()
  })
  const timer = setTimeout(() => stop(), 1000)
  const stop = () => {
    observer.disconnect()
    clearTimeout(timer)
  }
  observer.observe(parent, { childList: true })
}
