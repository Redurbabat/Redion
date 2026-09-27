/**
 * Stops the page behind an overlay from scrolling. Reference-counted, and
 * it pads for the vanished scrollbar so the page does not jump sideways.
 */
let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

export function lockScroll(): () => void {
  const root = document.documentElement
  if (locks === 0) {
    saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    const scrollbar = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
  }
  locks += 1
  let released = false
  return () => {
    if (released) return
    released = true
    locks -= 1
    if (locks === 0 && saved) {
      root.style.overflow = saved.overflow
      root.style.paddingRight = saved.paddingRight
      saved = null
    }
  }
}
