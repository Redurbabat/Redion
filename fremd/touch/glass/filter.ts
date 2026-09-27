/**
 * SVG filter graph for liquid glass. Adapted from ALEXalesha/LiquidGlass
 * (index.html: `filterPad`, `filterMarkup`), Copyright (c) 2026 ALEXalesha,
 * MIT License — full text in HERKUNFT.md. Changed: single pass only, the
 * region reaches a margin beyond the glass, rim glow masked by the map's blue ring.
 *
 *   feImage(map) → feDisplacementMap(SourceGraphic, map, scale = -refraction)
 *
 * The NEGATIVE scale makes the rim act like a lens that pulls in what lies
 * just outside the glass. With rim, a saturated copy is added where the
 * map's blue ring is bright.
 *
 * Deliberately NOT here: splitting red / green / blue into three passes for
 * colour fringes. Measured in Chromium 141: inside backdrop-filter the
 * channel-isolating colour matrices come out dark, so the fringe is drawn
 * with CSS instead (Glass.css).
 */
export function filterPadding(refraction: number, blur: number): number {
  return Math.ceil(Math.abs(refraction) * 0.6 + blur * 3 + 8)
}

const RING = '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0'

export interface GlassFilterOptions {
  id: string
  /** Displacement map (data URL). */
  map: string
  /** Size of the lens region: the glass plus `margin` on every side. */
  width: number
  height: number
  /**
   * How far the region (and the map) starts outside the glass. Chromium hands
   * a backdrop filter the backdrop of its whole filter region, so this margin
   * is what the rim can pull in — while the element itself stays glass-sized
   * and its own border-radius clips the result cleanly.
   */
  margin?: number
  refraction: number
  /** 0…1 — strength of the saturated rim glow. */
  rim: number
  /** Backdrop blur applied before the filter (for the padding only). */
  blur?: number
}

const n = (v: number) => String(Math.round(v * 100) / 100)

export function glassFilterMarkup({ id, map, width, height, margin = 0, refraction, rim, blur = 1 }: GlassFilterOptions): string {
  const s = -Math.abs(refraction)
  const o = n(-margin)
  const sel = 'xChannelSelector="R" yChannelSelector="G"'
  let body = `<feImage href="${map}" x="${o}" y="${o}" width="${width}" height="${height}" preserveAspectRatio="none" result="map"/>`
  body += `<feDisplacementMap in="SourceGraphic" in2="map" scale="${n(s)}" ${sel} result="refracted"/>`
  if (rim > 0) {
    body +=
      `<feColorMatrix in="map" type="matrix" values="${RING}" result="ring"/>` +
      `<feColorMatrix in="refracted" type="saturate" values="${n(1 + rim * 2.4)}" result="vivid"/>` +
      `<feComposite in="vivid" in2="ring" operator="in" result="glow"/>` +
      `<feComposite in="glow" in2="refracted" operator="arithmetic" k1="0" k2="${n(rim * 0.7)}" k3="1" k4="0" result="lit"/>`
  }
  // The map covers the whole region, so no pixel of it is left without a map
  // (uncovered pixels read as a strong displacement).
  void blur
  return (
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="${o}" y="${o}" width="${width}" ` +
    `height="${height}" color-interpolation-filters="sRGB">${body}</filter>`
  )
}
