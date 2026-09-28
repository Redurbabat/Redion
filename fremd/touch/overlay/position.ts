export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface Placement {
  top: number
  left: number
  side: 'top' | 'bottom'
  /** Transform origin inside the popover box, pointing at the anchor centre (scale-in from the anchor). */
  originX: number
  originY: number
  /** Available height on the chosen side; the popover scrolls beyond it. */
  maxHeight: number
}

/**
 * Places a popover next to its anchor: below if it fits (or the preferred
 * side if that fits), otherwise the side with more room; horizontally centred
 * on the anchor but kept `margin` px inside the viewport. The transform
 * origin points back at the anchor so the popover grows out of it
 * (Framework7 popover idea, see HERKUNFT.md).
 */
export function placePopover(
  anchor: Rect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  {
    prefer = 'bottom',
    gap = 8,
    margin = 12,
  }: { prefer?: 'top' | 'bottom' | undefined; gap?: number | undefined; margin?: number | undefined } = {},
): Placement {
  const spaceBelow = viewport.height - (anchor.top + anchor.height) - gap - margin
  const spaceAbove = anchor.top - gap - margin
  const preferredFits = (prefer === 'bottom' ? spaceBelow : spaceAbove) >= size.height
  // Otherwise the roomier side (which is also the only one that can fit).
  const side: 'top' | 'bottom' = preferredFits ? prefer : spaceBelow >= spaceAbove ? 'bottom' : 'top'
  const maxHeight = Math.max(0, side === 'bottom' ? spaceBelow : spaceAbove)
  const height = Math.min(size.height, maxHeight)

  const centre = anchor.left + anchor.width / 2
  const left = Math.min(Math.max(centre - size.width / 2, margin), Math.max(margin, viewport.width - margin - size.width))
  const top = side === 'bottom' ? anchor.top + anchor.height + gap : anchor.top - gap - height

  return {
    top,
    left,
    side,
    originX: centre - left,
    originY: side === 'bottom' ? 0 : height,
    maxHeight,
  }
}
