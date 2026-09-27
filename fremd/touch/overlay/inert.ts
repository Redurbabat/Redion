/**
 * Makes everything outside `layer` inert (not focusable, not clickable,
 * hidden from assistive tech) — the modern replacement for aria-hidden +
 * pointer-events hacks. Reference-counted so stacked overlays restore
 * correctly; elements that were already inert are left alone.
 */
const counts = new WeakMap<Element, number>()

const isInert = (el: Element) => el.hasAttribute('inert')

export function setInertOutside(layer: Element): () => void {
  const touched: Element[] = []
  const lifted: Element[] = []
  let node: Element | null = layer
  while (node && node.parentElement && node !== document.body) {
    // The new top layer (or its ancestors) may have been made inert by a lower overlay.
    if ((counts.get(node) ?? 0) > 0) {
      node.removeAttribute('inert')
      lifted.push(node)
    }
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue
      const count = counts.get(sibling) ?? 0
      if (count === 0 && isInert(sibling)) continue // inert before we came: not ours
      if (count === 0) sibling.setAttribute('inert', '')
      counts.set(sibling, count + 1)
      touched.push(sibling)
    }
    node = node.parentElement
  }

  let released = false
  return () => {
    if (released) return
    released = true
    for (const el of touched) {
      const count = (counts.get(el) ?? 1) - 1
      if (count <= 0) {
        counts.delete(el)
        el.removeAttribute('inert')
      } else counts.set(el, count)
    }
    for (const el of lifted) {
      if ((counts.get(el) ?? 0) > 0) el.setAttribute('inert', '')
    }
  }
}
