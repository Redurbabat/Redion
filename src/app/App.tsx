/* src/app/App.tsx — die erste React-Shell (E78, RM-5 begonnen)
 * ----------------------------------------------------------------------------
 * Was sie kann, ist bewusst wenig — aber es ist ECHT: sie liest die Seiten
 * aus der Bestands-Ablage `notizen` (nur lesend, legacyStore.ts), prüft
 * jeden Satz gegen das Zod-Schema und zeigt beides — die Seiten UND das
 * Prüfergebnis. Damit ist der Strangler-Schnitt von Anfang an richtig:
 * React ist Darstellung, die Wahrheit liegt in der Ablage, und die neue
 * Schicht beweist an echten Daten, dass ihre Schemas stimmen.
 *
 * Drei Zustände, alle ehrlich: Laden, Fehler (mit Text), leer (mit
 * Erklärung). Kein Zustand sieht aus wie ein anderer (E71 lässt grüssen).
 */
import { useEffect, useState } from 'react';
import { BlockSchema, type Block } from '../domain/schema';
import { readAll, counts } from '../persistence/legacyStore';

const STORES = ['blocks', 'collections', 'views', 'meta', 'versions',
                'dateien', 'stuecke', 'basis', 'vorrat'];

type Stand =
  | { art: 'laedt' }
  | { art: 'fehler'; text: string }
  | { art: 'da'; seiten: Block[]; unlesbar: number; faecher: Record<string, number> };

export function App() {
  const [stand, setStand] = useState<Stand>({ art: 'laedt' });

  useEffect(() => {
    let lebt = true;
    (async () => {
      try {
        const alle = await readAll<unknown>('blocks');
        const seiten: Block[] = [];
        let unlesbar = 0;
        for (const roh of alle) {
          const p = BlockSchema.safeParse(roh);
          if (!p.success) { unlesbar++; continue; }
          if (p.data.type === 'page' && p.data.alive && p.data.parentId == null)
            seiten.push(p.data);
        }
        seiten.sort((a, b) => a.created.localeCompare(b.created));
        const faecher = await counts(STORES);
        if (lebt) setStand({ art: 'da', seiten, unlesbar, faecher });
      } catch (err) {
        if (lebt) setStand({ art: 'fehler',
          text: err instanceof Error ? err.message : String(err) });
      }
    })();
    return () => { lebt = false; };
  }, []);

  return (
    <div className="shell">
      <header className="shell-kopf">
        <h1>Redion</h1>
        <span className="shell-marke">neue Shell · liest den Bestand, schreibt nichts</span>
      </header>

      {stand.art === 'laedt' && <p className="shell-hinweis">Liest die Ablage …</p>}

      {stand.art === 'fehler' && (
        <p className="shell-fehler">
          Die Ablage liess sich nicht lesen: {stand.text}
        </p>
      )}

      {stand.art === 'da' && (
        <main className="shell-inhalt">
          <section>
            <h2>Seiten ({stand.seiten.length})</h2>
            {stand.seiten.length === 0 && (
              <p className="shell-hinweis">
                Keine Seiten gefunden. Entweder ist diese Ablage frisch — oder
                der Bestand läuft unter index.html und hat hier noch nie
                gespeichert.
              </p>
            )}
            <ul className="shell-seiten">
              {stand.seiten.map((s) => (
                <li key={s.id}>
                  <span className="shell-icon">{s.icon || '📄'}</span>
                  {s.text || 'Ohne Titel'}
                </li>
              ))}
            </ul>
            {stand.unlesbar > 0 && (
              <p className="shell-fehler">
                {stand.unlesbar} Satz/Sätze entsprachen dem Schema nicht —
                das ist ein Befund für RM-2, kein Grund zum Verstecken.
              </p>
            )}
          </section>
          <section>
            <h2>Die Fächer des Bestands</h2>
            <table className="shell-tabelle">
              <tbody>
                {STORES.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td>{stand.faecher[f] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}
    </div>
  );
}
