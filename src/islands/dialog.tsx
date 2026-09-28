/* ============================================================================
 * src/islands/dialog.tsx — Redions Fragen als Dialog des Touch Kits (E710)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026, 21:49 UTC: „was du beim touckit gebaut hast ich
 * will alles so haben mit redion passende inhalten" — und 22:10 UTC: „…
 * bessere übergagnge besssere efeckten , bessere oberfläsche alles".
 *
 * WAS DIESE INSEL IST. Die Ansicht für `Dialog.frage`, `Dialog.wahl` und
 * `Dialog.mehrzeilig` (src/schale/ueberlagerung/dialog.ts). Die Schale ruft
 * wie immer — mit denselben Worten, derselben Antwort, am selben Auslöser
 * (E699 Regel 4) — und statt eines Kastens oben am Bildschirm steht jetzt:
 *
 *   frage, mehrzeilig   der Dialog des Kits in der Mitte: federt aus 1,08
 *                       herein, das Feld darin, „Abbrechen" und „Übernehmen"
 *                       nebeneinander, blendet beim Schliessen aus.
 *   wahl                derselbe Dialog; jede Antwort ein Knopf MIT ihrem
 *                       Hinweis darunter („Ersetzen" sagt, was mit dem Rest
 *                       geschieht). Am Telefon ab drei Antworten ein
 *                       Aktionsblatt von unten, dort, wo der Daumen ist.
 *
 * NUR ANSICHT (E699 Regel 5). Props hinein, EIN Rückruf hinaus:
 * `onAntwort(wert)` — der Text, `null` (abgebrochen) oder die Kennung der
 * Wahl, `''` beim Abbruch. Die Insel kennt weder `Store` noch einen Bereich;
 * was mit der Antwort geschieht, entscheidet wie bisher der Aufrufer.
 *
 * DIE HAKEN BLEIBEN. `#fq` am Eingabefeld, `data-w` an jedem Knopf der Wahl,
 * `data-a="ok"`/`data-a="zu"` an Übernehmen und Abbrechen — dieselben Namen
 * wie im bisherigen Kasten. Wer (Mensch oder Prüflauf) sie kennt, findet sie.
 *
 * ESCAPE UND FOKUS gehören dem Kit (`useModal`): eine Falle, ein Griff. Die
 * Schale lässt ein Fenster mit `data-insel-traeger` dafür in Ruhe (Fokus,
 * schale.ts — E710). Auf den Schleier tippen heisst abbrechen, wie bisher.
 * ==========================================================================*/
import { useRef, useState, type SyntheticEvent } from 'react'
import { ActionSheet, type ActionSheetAction } from '../../fremd/touch/components/ActionSheet'
import { Dialog, type DialogAction } from '../../fremd/touch/components/Dialog'

/** Ein Knopf der Wahl — dieselbe Form wie `DialogKnopf` in dialog.ts. */
export interface DialogChoice {
  id: string
  text: string
  hinweis?: string | undefined
  /** Rot: diese Antwort löscht oder verwirft etwas. */
  gefahr?: boolean | undefined
}

export interface RedionDialogProps {
  art: 'frage' | 'passwort' | 'mehrzeilig' | 'wahl'
  titel: string
  /** Wahl: der erklärende Text über den Knöpfen. */
  text?: string | undefined
  /** Frage, mehrzeilig: was im Feld schon steht. */
  vorgabe?: string | undefined
  knoepfe?: DialogChoice[] | undefined
  /** Am Telefon (≤ 760 px oder grober Zeiger): eine Wahl ab drei Antworten kommt als Aktionsblatt. */
  telefon?: boolean | undefined
  /** Die Antwort. Genau einmal. */
  onAntwort: (wert: string | null) => void
  /** Das Ausblenden ist vorbei — die Schale darf den Träger abräumen. */
  onWeg: () => void
  /**
   * Der Träger: das `.overlay`, das die Schale für dieses Fenster angelegt
   * hat. Das Kit zeichnet seine Ebene DARIN (`container`), nicht lose am
   * `<body>` — so gibt es für Fokus, Escape und `inert` genau eine oberste
   * Ebene, und beide Systeme sehen dieselbe (E710, der Stillstand aus der
   * Messung vom 27. September: beide Ebenen `inert`, nichts mehr bedienbar).
   */
  traeger?: HTMLElement | null | undefined
}

/**
 * Ein Haken als Attribut am Knopf (`data-w`, `data-a`). Das Kit nimmt über
 * `buttonProps` jedes Attribut eines `<button>` an; `data-*` kennt der Typ
 * eines Objekts nur nicht beim Namen — in JSX schon. Darum hier einmal die
 * Umwandlung, statt an jeder Stelle.
 */
const haken = (attribute: Record<`data-${string}`, string>): DialogAction['buttonProps'] =>
  attribute as unknown as DialogAction['buttonProps']

/** So lange darf das Ausblenden höchstens dauern (Kit: 160 bzw. 240 ms, +80 Sicherheit). */
const WEG_SPAETESTENS_MS = 400

export function RedionDialog(props: RedionDialogProps) {
  const { art, titel, text, vorgabe = '', knoepfe = [], telefon = false, onAntwort, onWeg, traeger } = props
  const [open, setOpen] = useState(true)
  const [wert, setWert] = useState(vorgabe)
  const beantwortet = useRef(false)
  const weg = useRef(false)
  const ersterFokus = useRef(true)

  const fertig = () => {
    if (weg.current) return
    weg.current = true
    onWeg()
  }

  /** Antworten und schliessen — genau einmal, egal wie oft gedrückt wird. */
  const antworten = (antwort: string | null) => {
    if (beantwortet.current) return
    beantwortet.current = true
    onAntwort(antwort)
    setOpen(false)
    /* Sicherheitsnetz: das Kit meldet das Ende seiner Ausblendung über
       `animationend` (unten). Ohne Bewegung (Ruhige Darstellung setzt
       `animation:none`) kommt keins — dann nach dieser Frist. */
    window.setTimeout(fertig, WEG_SPAETESTENS_MS)
  }

  const abbruch = art === 'wahl' ? '' : null

  /* Das Ende der Ausblendung des Kits — `animationend` steigt durch das
     Portal zu dieser Insel auf (React reicht Ereignisse aus Portalen an ihre
     Eltern weiter). Nur nach der Antwort zählt es. */
  const beiAnimationsende = (e: SyntheticEvent) => {
    if (!beantwortet.current) return
    const name = (e.nativeEvent as AnimationEvent).animationName ?? ''
    if (/-out$|fade-out$/.test(name)) fertig()
  }

  /* Auf den Schleier tippen heisst abbrechen (wie der bisherige Kasten: „Bei
     einer Frage, die Daten kostet, ist die versehentliche Wahl das, was es
     zu verhindern gilt"). Das Aktionsblatt kann das schon selbst. */
  const beiKlick = (e: SyntheticEvent) => {
    const ziel = e.target instanceof Element ? e.target : null
    if (ziel?.classList.contains('ui-touch-dialog-scrim')) antworten(abbruch)
  }

  const onOpenChange = (next: boolean) => {
    if (!next) antworten(abbruch)
  }

  /* ---- Wahl ------------------------------------------------------------ */
  if (art === 'wahl') {
    /* Hat der Aufrufer selbst einen Abbruch-Knopf (Kennung ''), ist ER das
       Abbrechen. Sonst kommt einer dazu: am Telefon gibt es kein Escape. */
    const eigenerAbbruch = knoepfe.find((k) => k.id === '')
    const auswahl = knoepfe.filter((k) => k.id !== '')

    /* Das Aktionsblatt hat seinen EIGENEN Abbruch-Knopf, und der nimmt
       keinen Haken an. Bringt der Aufrufer einen mit (`data-w=""`, Prüfläufe
       tippen ihn), bleibt es beim Dialog in der Mitte — der trägt ihn. */
    if (telefon && auswahl.length >= 3 && !eigenerAbbruch) {
      const aktionen: ActionSheetAction[] = auswahl.map((k) => ({
        label: k.text,
        hint: k.hinweis || undefined,
        destructive: k.gefahr || undefined,
        onSelect: () => antworten(k.id),
        buttonProps: haken({ 'data-w': k.id }),
      }))
      return (
        <div data-insel-dialog="blatt" onAnimationEnd={beiAnimationsende}>
          <ActionSheet
            open={open}
            onOpenChange={onOpenChange}
            title={titel}
            message={text || undefined}
            actions={aktionen}
            cancelLabel="Abbrechen"
            container={traeger}
          />
        </div>
      )
    }

    const aktionen: DialogAction[] = auswahl.map((k) => ({
      label: k.text,
      hint: k.hinweis || undefined,
      role: k.gefahr ? 'destructive' : 'default',
      onSelect: () => antworten(k.id),
      buttonProps: haken({ 'data-w': k.id }),
    }))
    const abbrechen: DialogAction = {
      label: eigenerAbbruch?.text || 'Abbrechen',
      hint: eigenerAbbruch?.hinweis || undefined,
      role: 'cancel',
      onSelect: () => antworten(''),
      buttonProps: haken(eigenerAbbruch ? { 'data-w': '' } : { 'data-a': 'zu' }),
    }
    /* EINE Antwort, und sie löscht etwas (`Dialog.bestaetigen` mit
       `gefahr`): „Abbrechen" steht links und hat den Fokus — wie jede
       Ja/Nein-Frage am iPhone, und ein Enter aus Versehen löscht nichts.
       Sonst bleibt die Folge, wie sie war: die Antworten zuerst, der Fokus
       auf der ersten (wie im bisherigen Fenster). */
    if (auswahl.length === 1 && auswahl[0]?.gefahr) aktionen.unshift(abbrechen)
    else aktionen.push(abbrechen)
    return (
      <div data-insel-dialog="wahl" onAnimationEnd={beiAnimationsende} onClick={beiKlick}>
        <Dialog open={open} onOpenChange={onOpenChange} title={titel} message={text || undefined} actions={aktionen}
          container={traeger} />
      </div>
    )
  }

  /* ---- Frage, Passwort, mehrzeilig --------------------------------------- */
  const mehrzeilig = art === 'mehrzeilig'
  const aktionen: DialogAction[] = [
    { label: 'Abbrechen', role: 'cancel', onSelect: () => antworten(null),
      buttonProps: haken({ 'data-a': 'zu' }) },
    /* „Strg + Enter" nur, wo es eine Tastatur gibt — am Telefon ist der
       Hinweis leer, und die beiden Knöpfe stehen auf einer Linie. */
    { label: 'Übernehmen', hint: mehrzeilig && !telefon ? 'Strg + Enter' : undefined, onSelect: () => antworten(wert),
      buttonProps: haken({ 'data-a': 'ok' }) },
  ]
  /* Beim ersten Fokus alles markieren — wie bisher: wer tippt, ersetzt. */
  const markieren = (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
    if (!ersterFokus.current) return
    ersterFokus.current = false
    e.currentTarget.select()
  }
  return (
    <div data-insel-dialog={art} onAnimationEnd={beiAnimationsende} onClick={beiKlick}>
      <Dialog open={open} onOpenChange={onOpenChange} title={titel} actions={aktionen} container={traeger}>
        {mehrzeilig ? (
          <textarea
            id="fq"
            data-dialog-feld="mehrzeilig"
            rows={4}
            aria-label={titel}
            value={wert}
            onChange={(e) => setWert(e.currentTarget.value)}
            onFocus={markieren}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                antworten(e.currentTarget.value)
              }
            }}
          />
        ) : (
          <input
            id="fq"
            data-dialog-feld={art}
            aria-label={titel}
            value={wert}
            {...(art === 'passwort' ? { type: 'password', autoComplete: 'off', spellCheck: false } : { type: 'text' })}
            onChange={(e) => setWert(e.currentTarget.value)}
            onFocus={markieren}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                antworten(e.currentTarget.value)
              }
            }}
          />
        )}
      </Dialog>
    </div>
  )
}
