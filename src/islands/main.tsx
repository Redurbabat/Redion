/* ============================================================================
 * src/islands/main.tsx — die Inseln: React an einer Stelle der Schale (E699)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026: „du kannst react nutzen keien problem" — und
 * im Fragebogen: „Mit React (E80 aufheben)".
 *
 * WAS EINE INSEL IST. Ein Stück Oberfläche aus dem Touch Kit, das an GENAU
 * EINER Stelle der bestehenden Schale steht — dort, wo vorher ein Element von
 * Hand gebaut wurde, mit demselben Auslöser und denselben Daten. Keine
 * zweite Seite, kein Router, keine eigene Schale (E80 bleibt in der Sache
 * bestehen; E699 macht aus seinem Einwand prüfbare Regeln).
 *
 * WAS DIESE DATEI NACH AUSSEN GIBT — und nur das:
 *
 *     RedionIslands.version                 Stand dieser Schnittstelle
 *     RedionIslands.mount(host, name, props)  eine Insel an `host` hängen
 *     RedionIslands.update(host, props)       neue Props, dieselbe Insel
 *     RedionIslands.unmount(host)             wieder weg, restlos
 *
 * `bauen-inseln.mts` macht daraus ein klassisches Skript mit dem EINEN
 * globalen Namen `RedionIslands`. React kommt nicht mit hinein, sondern aus
 * `RedionReact` (`quell/fremd/react/react.js`).
 *
 * DIE VIER ZUSAGEN (geprüft in `test578` und `test579`):
 *
 *   1. BEIM AUSWERTEN GESCHIEHT NICHTS. Kein Wurzelelement, kein Beobachter,
 *      kein Attribut, kein Zeitgeber. Wer die Datei nur lädt (Vorwärmen),
 *      sieht keine Veränderung. Alles beginnt mit dem ersten `mount`.
 *   2. EINE WURZEL JE ELEMENT, und jeder Aufruf ist wiederholbar: `mount`
 *      zweimal ist `mount` einmal mit den neuen Props; `unmount` ohne Insel
 *      tut nichts.
 *   3. NUR ANSICHT. Props hinein, Rückrufe hinaus. Keine Insel liest oder
 *      schreibt `Store`, IndexedDB, `localStorage` oder einen Bereich (§9,
 *      §10, §5) — `test578` §6 liest den Quelltext darauf.
 *   4. KEINE STILLEN ABSTÜRZE (§7). Jede Insel steht hinter einer
 *      Fehlergrenze. Was dort ankommt, geht als Ereignis an den Lader
 *      (`laden.ts`) und von dort an `Reporter.error` — Redions Weg für
 *      Fehler: `Pflege` sammelt ihn in der Fehlerliste („Erste Hilfe →
 *      Fehler ansehen"). An der Stelle der Insel steht dann ein Satz.
 *
 * UND WENN DIE SCHALE DAS ELEMENT SELBST ENTFERNT (`innerHTML = …`,
 * `.remove()`), räumt ein Wächter die Wurzel ab — dasselbe Muster wie der
 * Wächter in `menue.ts`, der den Telefongrund mitnimmt, wenn ein Aufrufer
 * sein Menü selbst entfernt.
 * ==========================================================================*/
import '../../fremd/touch/touch.css'
import { Component, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Probe, type ProbeProps } from './probe'
import { RedionDialog, type RedionDialogProps } from './dialog'
import { startThemeMirror, stopThemeMirror } from './bridge'
import './bridge.css'

/** Stand dieser Schnittstelle. Steigt, wenn sich `mount`/`update`/`unmount` ändern. */
export const version = '1'

type Props = Record<string, unknown>

/**
 * DER KATALOG. Stufe 1a hatte genau eine Insel, die Probe für `test579`.
 * Jede weitere kommt mit ihrem eigenen Bogen hinzu — und ersetzt dabei
 * etwas, statt daneben zu stehen:
 *
 *   dialog   Stufe 1b (E710): die Fragen der Schale — `Dialog.frage`,
 *            `Dialog.wahl`, `Dialog.mehrzeilig` —, eingehängt von
 *            `src/schale/ueberlagerung/dialog.ts` an derselben Stelle.
 */
const catalog: Record<string, (props: Props) => ReactNode> = {
  probe: (props) => <Probe {...(props as ProbeProps)} />,
  dialog: (props) => <RedionDialog {...(props as unknown as RedionDialogProps)} />,
}

interface Mounted {
  root: Root
  name: string
}

const mounted = new Map<Element, Mounted>()

/**
 * Einen Fehler an Redion geben — als Ereignis, nicht als Griff in Redions
 * Namen (Zusage 3: die Inseln kennen `Reporter` und `Pflege` nicht).
 *
 * `laden.ts` hört auf `redion-insel-fehler` und reicht den Fehler an
 * `Reporter.error` weiter, und der legt ihn in die Fehlerliste von `Pflege`
 * (§7). WARUM NICHT EINFACH `reportError`: per Doppelklick (file://) ist
 * jede Datei ihr eigener Ursprung, und der Browser schwärzt die Meldung für
 * `window.onerror` zu „Script error." — gemessen in test579 §8. Ein
 * Ereignis mit dem Fehler darin kommt ungeschwärzt an.
 *
 * Hört niemand zu (`preventDefault` fehlt), bleibt `reportError` der
 * Rückweg — still wird es nie.
 */
function report(name: string, error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error))
  err.message = 'Insel „' + name + '": ' + err.message
  const event = new CustomEvent('redion-insel-fehler', { detail: { insel: name, fehler: err }, cancelable: true })
  if (!window.dispatchEvent(event)) return
  if (typeof reportError === 'function') reportError(err)
  else setTimeout(() => { throw err })
}

interface BoundaryProps {
  name: string
  children: ReactNode
}

/* Die Grenze fängt und zeigt; GEMELDET wird über `onCaughtError` der Wurzel
   (unten in `mount`). Beides an einer Stelle hiesse: jeder Fehler zweimal
   in der Liste. */
class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override render(): ReactNode {
    if (this.state.failed)
      return (
        <p data-insel-fehler="" role="alert">
          Dieser Teil liess sich nicht zeichnen. Der Fehler steht unter „Erste Hilfe → Fehler ansehen“.
        </p>
      )
    return this.props.children
  }
}

function render(entry: Mounted, props: Props): void {
  const island = catalog[entry.name]
  if (!island) throw new Error('Unbekannte Insel „' + entry.name + '"')
  entry.root.render(
    <div className="ui-touch-root" data-insel-wurzel="">
      {/* `key` = Name: eine andere Insel am selben Element fängt frisch an,
          samt neuer Fehlergrenze, statt den Zustand der alten zu erben. */}
      <Boundary key={entry.name} name={entry.name}>
        {island(props)}
      </Boundary>
    </div>,
  )
}

/* ---- Der Wächter: die Schale entfernt ein Element, die Wurzel geht mit ---- */
let guard: MutationObserver | null = null

function sweep(): void {
  for (const host of [...mounted.keys()]) if (!host.isConnected) unmount(host)
}

function startGuard(): void {
  if (guard) return
  guard = new MutationObserver(sweep)
  guard.observe(document, { childList: true, subtree: true })
}

function stopGuardIfIdle(): void {
  if (mounted.size > 0) return
  guard?.disconnect()
  guard = null
  stopThemeMirror()
}

/** Eine Insel an `host` hängen. Steht dort schon eine, bekommt sie die neuen Props. */
export function mount(host: Element, name: string, props: Props = {}): void {
  if (!(host instanceof Element)) throw new TypeError('RedionIslands.mount: host ist kein Element')
  if (!catalog[name]) throw new Error('RedionIslands.mount: unbekannte Insel „' + name + '"')
  if (!host.isConnected) throw new Error('RedionIslands.mount: das Element hängt nicht im Dokument')
  startThemeMirror()
  startGuard()
  let entry = mounted.get(host)
  if (!entry) {
    const created: Mounted = {
      name,
      root: createRoot(host, {
        onCaughtError: (error) => report(created.name, error),
        onUncaughtError: (error) => report(created.name, error),
      }),
    }
    entry = created
    mounted.set(host, entry)
  }
  entry.name = name
  host.setAttribute('data-insel', name)
  render(entry, props)
}

/** Dieselbe Insel, neue Props. Ohne Insel an `host` ist das ein Fehler, keine Stille. */
export function update(host: Element, props: Props = {}): void {
  const entry = mounted.get(host)
  if (!entry) throw new Error('RedionIslands.update: an diesem Element steht keine Insel')
  render(entry, props)
}

/** Die Insel wieder weg — restlos: Wurzel, Attribut und, wenn es die letzte war, Wächter und Spiegel. */
export function unmount(host: Element): void {
  const entry = mounted.get(host)
  if (!entry) return
  mounted.delete(host)
  entry.root.unmount()
  host.removeAttribute('data-insel')
  stopGuardIfIdle()
}
