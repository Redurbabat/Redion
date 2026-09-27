/* ============================================================================
 * src/islands/probe.tsx — die Probe-Insel (E699, Stufe 1a)
 * ----------------------------------------------------------------------------
 * NUR FÜR `test579`. Diese Insel ersetzt nichts und steht an keiner Stelle
 * der App: Stufe 1a legt die Grundlage, und eine Grundlage, die niemand
 * benutzt, muss trotzdem beweisen, dass sie trägt. Die Probe ist dieser
 * Beweis — ein Knopf und ein Schalter aus dem Touch Kit, eingehängt an
 * einem Element, das der Prüflauf selbst anlegt.
 *
 * Was sie vorführt, ist der Vertrag jeder späteren Insel:
 *
 *   PROPS HINEIN, RÜCKRUFE HINAUS. Der Schalter ist GESTEUERT: ein Tipp ruft
 *   `onToggle(true)`, aber er springt erst um, wenn Redion mit
 *   `RedionIslands.update(host, { checked: true })` antwortet. Die Insel hält
 *   keinen eigenen Zustand über Redions Daten und kennt weder `Store` noch
 *   IndexedDB (§9, §10; `test578` §6 prüft es im Quelltext).
 *
 *   FEHLER SIND LAUT. `throwOnRender` lässt sie beim Zeichnen werfen — damit
 *   `test579` sieht, dass die Fehlergrenze greift und der Fehler in Redions
 *   Fehlerliste ankommt (§7: „keine stillen Abstürze").
 *
 * Die Bauteile kommen einzeln aus ihren Dateien, nicht über `index.ts`: so
 * nimmt der Bündler nur ihr CSS mit (gemessen: 33 statt 128 KB, E699).
 * ==========================================================================*/
import { Button } from '../../fremd/touch/components/Button'
import { Toggle } from '../../fremd/touch/components/Toggle'

export interface ProbeProps {
  /** Beschriftung des Knopfes. */
  label?: string
  /** Beschriftung des Schalters (sichtbar, damit er einen Namen hat — §38). */
  toggleLabel?: string
  /** Stand des Schalters. Gesteuert: nur Redion ändert ihn. */
  checked?: boolean
  /** Der Knopf wurde gedrückt. */
  onPress?: () => void
  /** Der Schalter will umspringen — auf diesen Wert. */
  onToggle?: (checked: boolean) => void
  /** Nur für die Fehlergrenze in `test579`. */
  throwOnRender?: boolean
}

export function Probe({
  label = 'Probe',
  toggleLabel = 'Schalter',
  checked = false,
  onPress,
  onToggle,
  throwOnRender = false,
}: ProbeProps) {
  if (throwOnRender) throw new Error('Probe-Insel: absichtlicher Fehler beim Zeichnen (test579)')
  return (
    <div data-insel-probe="">
      <Button onClick={() => onPress?.()}>{label}</Button>
      <Toggle label={toggleLabel} checked={checked} onChange={(next) => onToggle?.(next)} />
    </div>
  )
}
