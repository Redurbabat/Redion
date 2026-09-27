/**
 * Displacement field for liquid glass.
 *
 * Adapted from ALEXalesha/LiquidGlass (index.html: `corner`, `sdf`,
 * `bakeFields`), Copyright (c) 2026 ALEXalesha, MIT License — full text in
 * HERKUNFT.md. Changed: typed, one map instead of four, neutral margin for
 * the lens region beyond the glass, Fresnel ring in the blue channel.
 *
 * The glass is a rounded rectangle whose edge is a bevel with a circular
 * arc profile: steep at the contour, flat after `bevel` px. Its slope says
 * where light bends, so it is encoded as a displacement map for
 * feDisplacementMap: R = horizontal, G = vertical (128 = none, soft-clipped
 * with tanh), B = a Fresnel ring (bright at the rim) used for the rim glow.
 * Everything else is neutral, so the middle of the glass stays calm.
 */

/** Corner blend: n = 2 is a circle, n = 4 a squircle-like continuous corner. */
function corner(a: number, b: number, n: number) {
  if (a <= 0) return b <= 0 ? 0 : b
  if (b <= 0) return a
  return n === 2 ? Math.hypot(a, b) : (a ** n + b ** n) ** (1 / n)
}

/** Signed distance from (x, y) — relative to the centre — to a rounded rect (negative inside). */
export function roundedRectDistance(x: number, y: number, halfWidth: number, halfHeight: number, radius: number, exponent = 2): number {
  const r = Math.min(radius, halfWidth, halfHeight)
  const qx = Math.abs(x) - (halfWidth - r)
  const qy = Math.abs(y) - (halfHeight - r)
  return corner(qx, qy, exponent) + Math.min(Math.max(qx, qy), 0) - r
}

const SLOPE = 0.34 // soft-clip of the slope before encoding
const NORMAL_STRENGTH = 1.35

export interface GlassFieldOptions {
  /** Size in (device) pixels of the map to bake. */
  width: number
  height: number
  radius: number
  /** Width of the refracting rim in pixels. */
  bevel: number
  exponent?: number
  /** Neutral margin around the shape (the lens region reaches beyond the glass). */
  inset?: number
}

/** RGBA pixels (width × height × 4) of the displacement + rim map. */
export function bakeGlassField({ width, height, radius, bevel, exponent = 2, inset = 0 }: GlassFieldOptions): Uint8ClampedArray<ArrayBuffer> {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const cx = w / 2
  const cy = h / 2
  const hw = Math.max(1, w / 2 - inset)
  const hh = Math.max(1, h / 2 - inset)
  const bv = Math.max(1, Math.min(bevel, Math.min(hw, hh) / 1.1))
  const out = new Uint8ClampedArray(w * h * 4)
  const heightField = new Float32Array(w * h)
  const inside = new Float32Array(w * h)

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const d = roundedRectDistance(x + 0.5 - cx, y + 0.5 - cy, hw, hh, radius, exponent)
      const t = Math.min(1, Math.max(0, -d / bv))
      const i = y * w + x
      heightField[i] = t >= 1 ? 1 : t <= 0 ? 0 : Math.sqrt(2 * t - t * t) // circular arc
      inside[i] = Math.min(1, Math.max(0, -d + 0.5))
    }
  }

  const at = (x: number, y: number) => heightField[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      const o = i * 4
      out[o + 3] = 255
      if (inside[i] <= 0 || heightField[i] >= 1) {
        out[o] = 128
        out[o + 1] = 128
        out[o + 2] = 0
        continue
      }
      const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5 * bv
      const gy = (at(x, y + 1) - at(x, y - 1)) * 0.5 * bv
      out[o] = Math.round(128 + 127 * Math.tanh(gx * SLOPE))
      out[o + 1] = Math.round(128 + 127 * Math.tanh(gy * SLOPE))
      const nx = -gx * NORMAL_STRENGTH
      const ny = -gy * NORMAL_STRENGTH
      const nz = 1 / Math.sqrt(nx * nx + ny * ny + 1)
      const fresnel = Math.min(1, (1 - nz) ** 2.6 * 1.7)
      out[o + 2] = Math.round(fresnel * inside[i] * 255)
    }
  }
  return out
}
