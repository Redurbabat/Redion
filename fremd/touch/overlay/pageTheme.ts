/**
 * The theme for a kit layer that sits outside every `.ui-touch-root` (an
 * overlay portal in <body>, a toast region placed above the root): the theme
 * forced around the kit root (or layer) that has the focus — the one the layer
 * was most likely opened from — else around the page's first kit root; the
 * system theme when nothing is forced.
 */
export function pageTheme(): string {
  const root = document.activeElement?.closest('.ui-touch-root, .ui-touch-portal') ?? document.querySelector('.ui-touch-root')
  return root?.closest('[data-ui-theme]')?.getAttribute('data-ui-theme') || 'system'
}
