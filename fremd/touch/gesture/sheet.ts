/**
 * Bottom-sheet geometry: detents and the "page pushed back" effect.
 *
 * Detents: 'small' (25 %), 'medium' (50 %), 'large' (full height minus a
 * top gap so the page behind stays visible), a fraction 0…1 of the viewport
 * height, a number > 1 as pixels, or a '123px' string.
 */
export type Detent = 'small' | 'medium' | 'large' | number | `${number}px`

export function resolveDetents(
  detents: ReadonlyArray<Detent | string | number>,
  { viewportHeight, topGap }: { viewportHeight: number; topGap: number },
): number[] {
  const max = Math.max(0, viewportHeight - topGap)
  const heights = detents.map((d) => {
    if (d === 'large') return max
    if (d === 'medium') return viewportHeight * 0.5
    if (d === 'small') return viewportHeight * 0.25
    if (typeof d === 'string') return parseFloat(d)
    return d <= 1 ? d * viewportHeight : d
  })
  return [...new Set(heights.map((h) => Math.round(Math.min(Math.max(h, 0), max))))].sort((a, b) => a - b)
}

/**
 * 0 while the sheet is at or below the second-largest detent, rising to 1
 * at the largest one. Drives the scrim and the background push-back, which
 * iOS only shows for the full-height sheet.
 */
export function sheetProgress(height: number, detents: number[]): number {
  if (detents.length === 0) return 0
  const top = detents[detents.length - 1]
  const below = detents.length > 1 ? detents[detents.length - 2] : 0
  if (top <= below) return 1
  return Math.min(1, Math.max(0, (height - below) / (top - below)))
}

/** Page behind the sheet: scaled so 13 px show at each side, moved down, rounded (Vaul values, radius 12). */
export function backgroundTransform(progress: number, viewportWidth: number) {
  const p = Math.min(1, Math.max(0, progress))
  const fullScale = viewportWidth > 26 ? (viewportWidth - 26) / viewportWidth : 1
  return {
    scale: 1 - p * (1 - fullScale),
    translateY: p * 14,
    radius: p * 12,
  }
}
