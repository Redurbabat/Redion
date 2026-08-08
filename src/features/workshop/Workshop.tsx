/* src/features/workshop/Workshop.tsx — die Editor-Werkstatt (RM-7)
 * ----------------------------------------------------------------------------
 * Hier läuft ProseMirror an einem ECHTEN Textblock des Bestands — und die
 * Seite sagt gross und ehrlich, was sie ist: eine Übungsfläche. Sie
 * speichert nichts (E78, Regel 1: die neue Schicht schreibt den Bestand
 * nicht), aber sie zeigt live, was gespeichert WÜRDE — Konjunktiv mit
 * Absicht: so lässt sich der textToDoc/docToText-Kreis mit Augen und
 * Prüflauf kontrollieren, bevor je ein Byte zurückfliesst.
 */
import { useEffect, useState } from 'react';
import { BlockSchema, type Block } from '../../domain/schema';
import { readAll } from '../../persistence/legacyStore';
import { navigate } from '../../app/router';
import { TextBlockEditor } from '../../editor/TextBlockEditor';

type Stand =
  | { art: 'laedt' }
  | { art: 'weg' }
  | { art: 'fehler'; text: string }
  | { art: 'da'; block: Block };

export function Workshop({ id }: { id: string }) {
  const [stand, setStand] = useState<Stand>({ art: 'laedt' });
  const [wuerde, setWuerde] = useState<string | null>(null);

  useEffect(() => {
    let lebt = true;
    (async (): Promise<Stand> => {
      const alle = await readAll<unknown>('blocks');
      for (const roh of alle) {
        const p = BlockSchema.safeParse(roh);
        if (p.success && p.data.id === id)
          return p.data.alive ? { art: 'da', block: p.data } : { art: 'weg' };
      }
      return { art: 'weg' };
    })().then(
      (s) => { if (lebt) setStand(s); },
      (err) => { if (lebt) setStand({ art: 'fehler',
        text: err instanceof Error ? err.message : String(err) }); });
    return () => { lebt = false; };
  }, [id]);

  return (
    <div className="ws">
      <nav className="pv-weg">
        <button type="button" onClick={() => navigate({ name: 'start' })}>
          ← Alle Seiten
        </button>
      </nav>
      <h1>Editor-Werkstatt</h1>
      <p className="ws-banner">
        Übungsfläche: ProseMirror an einem echten Block — <b>speichert
        nicht</b>. Strg B fett · Strg I kursiv · Strg Z zurück.
      </p>
      {stand.art === 'laedt' && <p className="shell-hinweis">Liest den Block …</p>}
      {stand.art === 'weg' && <p className="shell-hinweis">Diesen Block gibt es nicht.</p>}
      {stand.art === 'fehler' && <p className="shell-fehler">{stand.text}</p>}
      {stand.art === 'da' && (
        <div>
          <TextBlockEditor text={stand.block.text}
                           beiAenderung={(t) => setWuerde(t)} />
          <h2 className="ws-klein">So würde gespeichert</h2>
          <pre className="ws-vorschau" data-vorschau>
            {wuerde ?? stand.block.text}
          </pre>
        </div>
      )}
    </div>
  );
}
