import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { bakeGlassField } from './field'
import { filterPadding, glassFilterMarkup } from './filter'
import { supportsRefraction } from './support'

export interface GlassOptions {
  /** Displacement strength in px (0 turns refraction off). Default 44. */
  refraction?: number
  /** Saturated rim glow 0…1. Default 0.35. */
  rim?: number
  /** Width of the refracting edge in px. Default 16. */
  bevel?: number
  /** Set false to force the plain frosted look (e.g. while something animates underneath). */
  refract?: boolean
}

const TRANSPARENCY = '(prefers-reduced-transparency: reduce)'
function subscribeTransparency(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(TRANSPARENCY)
  media.addEventListener?.('change', onChange)
  return () => media.removeEventListener?.('change', onChange)
}
const reducedTransparency = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(TRANSPARENCY).matches

/** Live `prefers-reduced-transparency: reduce`. */
export function useReducedTransparency() {
  return useSyncExternalStore(subscribeTransparency, reducedTransparency, () => false)
}

// ── shared <svg><defs> that holds one <filter> per glass element ─────────
let defs: SVGDefsElement | null = null
function filterHost(): SVGDefsElement {
  if (defs?.isConnected) return defs
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('class', 'ui-touch-glass-defs')
  defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  svg.appendChild(defs)
  document.body.appendChild(svg)
  return defs
}

const filterNode = (id: string) => (defs?.isConnected ? defs.querySelector(`[id="${id}"]`) : null)

function upsertFilter(id: string, markup: string) {
  const host = filterHost()
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml')
  const next = doc.documentElement.firstElementChild
  if (!next) return
  const node = document.importNode(next, true)
  const existing = host.querySelector(`[id="${id}"]`)
  if (existing) existing.replaceWith(node)
  else host.appendChild(node)
}

// ── baked maps are cached per shape (only the shape matters) ─────────────
const mapCache = new Map<string, string>()
const PIXEL_BUDGET = 900_000

function mapFor(width: number, height: number, radius: number, bevel: number, inset: number, exponent: number): string | null {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const scale = Math.min(dpr, Math.sqrt(PIXEL_BUDGET / Math.max(1, width * height)))
  // floor, not round: rounding both sides up can overshoot the budget.
  const w = Math.max(4, Math.floor(width * scale))
  const h = Math.max(4, Math.floor(height * scale))
  const key = `${w}x${h}r${Math.round(radius * scale)}b${Math.round(bevel * scale)}i${Math.round(inset * scale)}n${exponent}`
  const cached = mapCache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const context = canvas.getContext('2d')
  if (!context || typeof context.putImageData !== 'function') return null
  const pixels = bakeGlassField({ width: w, height: h, radius: radius * scale, bevel: bevel * scale, inset: inset * scale, exponent })
  context.putImageData(new ImageData(pixels, w, h), 0, 0)
  const url = canvas.toDataURL('image/png')
  if (mapCache.size > 60) mapCache.clear()
  mapCache.set(key, url)
  return url
}

/** Corner exponent of the glass: `corner-shape: squircle` is the superellipse n = 4. */
function cornerExponent(style: CSSStyleDeclaration): number {
  const shape = style.getPropertyValue('corner-shape').trim()
  if (shape === 'squircle') return 4
  const k = /^superellipse\(\s*([\d.]+)\s*\)$/.exec(shape)?.[1]
  return k && Number(k) > 0 ? 2 ** Number(k) : 2
}

let serial = 0
const BLUR = 1.5 // px, matches the blur() in front of the lens in Glass.css
const RESIZE_SETTLE_MS = 140

/**
 * Gives a glass element real refraction where the browser can do it
 * (Chromium). The lens runs on a glass-sized "optics" layer whose own
 * border-radius (and corner-shape) clips it; its SVG filter region starts
 * `pad` px outside the glass, and that margin is what the rim pulls in.
 * (A larger layer clipped back with clip-path shows its square bounding box
 * inside any overflow-clipping ancestor in Chromium — measured.)
 * Exposes `data-refracting` on the glass; elsewhere, with reduced
 * transparency or `refract: false`, the CSS frosted look stays.
 *
 * Cost: a map is baked only once the glass comes near the screen; while a
 * glass resizes, its lens is stretched at once (no frame with a gap) and
 * baked again when the size settles.
 */
export function useGlassRefraction(
  glassRef: RefObject<HTMLElement | null>,
  opticsRef: RefObject<HTMLElement | null>,
  options: GlassOptions = {},
) {
  const { refraction = 44, rim = 0.35, bevel = 16, refract = true } = options
  const reduced = useReducedTransparency()
  // A module counter, not useId: ids from separately hydrated roots can repeat, and filters live in one shared <defs>.
  const [id] = useState(() => `ui-touch-glass-${(serial += 1).toString(36)}`)

  useEffect(() => {
    const glass = glassRef.current
    const optics = opticsRef.current
    if (!glass || !optics || !refract || reduced || refraction <= 0 || !supportsRefraction()) return
    const pad = filterPadding(refraction, BLUR)
    let visible = typeof IntersectionObserver !== 'function'
    let bakedSize = '' // "w×h" of the last bake; '' = never baked
    let frame = 0
    let timer = 0

    /** The glass box, its corner and the lens region around it (glass + pad on every side). */
    const geometry = () => {
      const width = glass.offsetWidth
      const height = glass.offsetHeight
      if (!width || !height) return null
      const style = getComputedStyle(glass)
      const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, width / 2, height / 2)
      const exponent = cornerExponent(style)
      return { width, height, radius, exponent, layer: { width: width + 2 * pad, height: height + 2 * pad } }
    }

    const bake = () => {
      const g = geometry()
      if (!g) return
      const map = mapFor(g.layer.width, g.layer.height, g.radius, bevel, pad, g.exponent)
      if (!map) return
      upsertFilter(id, glassFilterMarkup({ id, map, width: g.layer.width, height: g.layer.height, margin: pad, refraction, rim, blur: BLUR }))
      glass.style.setProperty('--ui-touch-glass-filter', `url(#${id})`)
      glass.setAttribute('data-refracting', '')
      bakedSize = `${g.width}x${g.height}`
    }

    const bakeIfNeeded = () => {
      if (visible && bakedSize !== `${glass.offsetWidth}x${glass.offsetHeight}`) bake()
    }

    /** Resized: stretch the current lens to the new box now, bake the real one when the size settles. */
    const onResize = () => {
      if (bakedSize === `${glass.offsetWidth}x${glass.offsetHeight}`) return
      const filter = filterNode(id)
      const g = filter ? geometry() : null
      if (filter && g) {
        for (const node of [filter, filter.querySelector('feImage, feimage')]) {
          node?.setAttribute('width', String(g.layer.width))
          node?.setAttribute('height', String(g.layer.height))
        }
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(bakeIfNeeded, RESIZE_SETTLE_MS)
    }

    const intersection =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[entries.length - 1]?.isIntersecting ?? visible
              bakeIfNeeded()
            },
            { rootMargin: '200px' },
          )
        : null
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null
    if (intersection) intersection.observe(glass)
    else frame = requestAnimationFrame(bakeIfNeeded)
    resize?.observe(glass)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      intersection?.disconnect()
      resize?.disconnect()
      glass.style.removeProperty('--ui-touch-glass-filter')
      glass.removeAttribute('data-refracting')
      filterNode(id)?.remove()
    }
  }, [glassRef, opticsRef, id, refract, reduced, refraction, rim, bevel])
}
