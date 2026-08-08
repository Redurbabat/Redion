/* src/ui/Sheet.tsx — Überlagerungen: Dialog am Rechner, Blatt am Telefon
 * ----------------------------------------------------------------------------
 * DER Baustein, dessen Fehlen den Bestand teuer zu stehen kam: dort sind
 * Overlay-Stapel, Fokus-Rückgabe und Escape-Verhalten über dutzende
 * Stellen von Hand verteilt — und genau dort lagen die Fehler dieser
 * Woche. Hier steht es EINMAL.
 *
 * Was der Baustein zusichert (CLAUDE.md §37/§38):
 *   · <dialog> als Grundlage: der Browser hält den Fokus im Dialog,
 *     Escape schliesst, ::backdrop gehört dazu — nichts davon von Hand
 *   · der Fokus kehrt beim Schliessen dorthin zurück, wo er herkam
 *     (macht <dialog> selbst — deshalb <dialog> und kein div)
 *   · am Telefon liegt er als Blatt unten an, mit sicherem Rand
 *   · Schliessen-Knopf mit 44-px-Fläche und aria-label
 */
import { useEffect, useRef, type ReactNode } from 'react';
import './sheet.css';

export interface SheetProps {
  titel: string;
  offen: boolean;
  beimSchliessen: () => void;
  children: ReactNode;
}

export function Sheet({ titel, offen, beimSchliessen, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  /* `cancel` ist Escape; `close` deckt auch Formular-Schliessen ab. Beide
     melden nach oben, statt still zuzugehen — sonst hielte der Zustand
     draussen den Dialog für offen und zeichnete ihn gleich wieder. */
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const zu = () => { if (offen) beimSchliessen(); };
    d.addEventListener('close', zu);
    return () => d.removeEventListener('close', zu);
  }, [offen, beimSchliessen]);

  return (
    <dialog ref={ref} className="ui-sheet" aria-label={titel}>
      <header className="ui-sheet-kopf">
        <h2>{titel}</h2>
        <button type="button" className="ui-sheet-zu" aria-label="Schliessen"
                onClick={beimSchliessen}>✕</button>
      </header>
      <div className="ui-sheet-inhalt">{children}</div>
    </dialog>
  );
}
