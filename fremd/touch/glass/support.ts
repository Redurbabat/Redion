/**
 * Can this browser refract the backdrop with an SVG filter?
 * Only Blink (Chromium) renders `backdrop-filter: url(#filter)`. Safari and
 * Firefox accept the value when parsing but do not render it, so a parse
 * check alone lies — the engine has to be checked as well (see HERKUNFT.md).
 * On iPhone and iPad every browser, Chrome and Edge included, is WebKit
 * underneath, so a positive Blink token is required and iOS is excluded.
 */
export function supportsRefraction(
  env: { CSS?: { supports(property: string, value: string): boolean }; userAgent: string } | undefined = typeof window === 'undefined'
    ? undefined
    : { CSS: window.CSS, userAgent: navigator.userAgent },
): boolean {
  if (!env?.CSS || typeof env.CSS.supports !== 'function') return false
  const parses = env.CSS.supports('backdrop-filter', 'url(#a)') || env.CSS.supports('-webkit-backdrop-filter', 'url(#a)')
  if (!parses) return false
  const ua = env.userAgent
  const isBlink = /Chrom(?:e|ium)\//.test(ua)
  const isAppleWebKit = /\b(?:iPhone|iPad|iPod)\b|CriOS|EdgiOS|FxiOS|OPT\//.test(ua)
  return isBlink && !isAppleWebKit
}
