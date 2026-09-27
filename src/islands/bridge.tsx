/* ============================================================================
 * src/islands/bridge.tsx — Redions Hell/Dunkel für das Touch Kit (E699)
 * ----------------------------------------------------------------------------
 * Das Kit fragt `data-ui-theme` (light | dark), Redion setzt `data-theme` —
 * beide am Wurzelelement. Diese Datei spiegelt das eine ins andere, sobald die
 * erste Insel steht, und hört wieder auf, wenn die letzte geht.
 *
 * NICHT BEIM LADEN. `quell/islands/islands.js` darf beim Auswerten nichts tun
 * (§7, `test578` §5): der Spiegel startet erst in `mount`. Wer die Inseln
 * nur vorwärmt, verändert die Seite damit um kein Attribut.
 *
 * DASSELBE MUSTER WIE DIE STAFFELEI (`staffelei.ts`): ein Beobachter auf
 * genau dieses eine Attribut. Wer den Grundton wechselt — Schema-Karte,
 * Studio-Kopf, Strg+Umschalt+L, ein zweiter Tab —, schreibt `data-theme`, und
 * das Kit folgt im selben Zug.
 *
 * Die Farben selbst kommen NICHT von hier, sondern aus `bridge.css`: dort
 * zeigen die Kit-Marken auf Redions Marken (`--ui-color-accent` →
 * `--accent` …). Ein Farbschema aus „Aussehen" erreicht damit jede Insel,
 * ohne dass hier eine Zeile davon weiss.
 * ==========================================================================*/

let observer: MutationObserver | null = null

/** Redions Grundton als Wert, den das Kit versteht. Alles, was nicht hell ist, ist dunkel — wie in `dunkel.css`. */
function redionTheme(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function copyTheme(): void {
  const html = document.documentElement
  const theme = redionTheme()
  if (html.getAttribute('data-ui-theme') !== theme) html.setAttribute('data-ui-theme', theme)
}

/** Spiegel einschalten. Zweimal ist einmal. */
export function startThemeMirror(): void {
  if (observer) return
  copyTheme()
  observer = new MutationObserver(copyTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

/** Spiegel aus und das Attribut wieder weg — die Seite steht dann da wie vor der ersten Insel. */
export function stopThemeMirror(): void {
  observer?.disconnect()
  observer = null
  document.documentElement.removeAttribute('data-ui-theme')
}
