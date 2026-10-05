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
let motionObserver: MutationObserver | null = null

/** Redions Grundton als Wert, den das Kit versteht. Alles, was nicht hell ist, ist dunkel — wie in `dunkel.css`. */
function redionTheme(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function copyTheme(): void {
  const html = document.documentElement
  const theme = redionTheme()
  if (html.getAttribute('data-ui-theme') !== theme) html.setAttribute('data-ui-theme', theme)
}

/* ============================================================================
 * „RUHIGE DARSTELLUNG" AUCH FÜR DIE FEDERN DES KITS (E710, L222 Punkt 2)
 * ----------------------------------------------------------------------------
 * Redions Schalter steht am `<body>`: `data-bewegung="ruhig"`. Das Kit fragt
 * seit UI-Kit 13e7844 `data-ui-motion="reduce"` am `<html>` — für seine
 * Federn in JavaScript (Blatt, Material, Tab-Leiste) UND für sein CSS
 * (base.css: Dauer 1 ms, auch `::before`/`::after`). Ohne diesen Spiegel
 * hielt Redions CSS-Regel zwar jede CSS-Bewegung an, aber jede JS-Feder des
 * Kits lief weiter (Liquid-Karte, „must-fix 1").
 *
 * Dasselbe Muster wie der Farbspiegel darüber: erst mit der ersten Insel an,
 * mit der letzten wieder aus — und dann ist auch das Attribut weg.
 * ==========================================================================*/
function copyMotion(): void {
  const html = document.documentElement
  const ruhig = document.body?.getAttribute('data-bewegung') === 'ruhig'
  if (ruhig && html.getAttribute('data-ui-motion') !== 'reduce') html.setAttribute('data-ui-motion', 'reduce')
  if (!ruhig && html.hasAttribute('data-ui-motion')) html.removeAttribute('data-ui-motion')
}

/** Spiegel einschalten. Zweimal ist einmal. */
export function startThemeMirror(): void {
  if (observer) return
  copyTheme()
  observer = new MutationObserver(copyTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  copyMotion()
  if (document.body) {
    motionObserver = new MutationObserver(copyMotion)
    motionObserver.observe(document.body, { attributes: true, attributeFilter: ['data-bewegung'] })
  }
}

/**
 * Spiegel aus — die Seite steht dann da wie vor der ersten Insel: ohne
 * `data-ui-theme`, und `data-ui-motion` so, wie „Ruhige Darstellung" es
 * sagt. Das zweite Etikett gehört nicht der Brücke allein: E702 setzt es
 * schon beim Anwenden der Einstellungen (seite.ts), auch ohne Insel. Hier
 * nahm die letzte Insel es bis zur Durchsicht (5. Oktober) mit — „ruhig"
 * galt, das Etikett war weg.
 */
export function stopThemeMirror(): void {
  observer?.disconnect()
  observer = null
  motionObserver?.disconnect()
  motionObserver = null
  document.documentElement.removeAttribute('data-ui-theme')
  copyMotion()
}
