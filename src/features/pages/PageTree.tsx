/* src/features/pages/PageTree.tsx — der Seitenbaum, nur lesend (RM-5)
 * ----------------------------------------------------------------------------
 * Die Startliste zeigte nur die obersten Seiten; Unterseiten waren nur über
 * ihre Elternseite erreichbar. Der Baum macht die Hierarchie sichtbar —
 * aufklappbar je Ast, mit Merken im Sitzungsspeicher (sessionStorage ist
 * hier richtig: ein Aufklapp-Zustand ist Sitzungsmöblierung, kein Inhalt —
 * §9 gilt für Inhalte).
 *
 * 44-px-Zeilen (§37), aria-expanded am Pfeil (§38), und der Pfeil ist nur
 * da, wo es wirklich Unterseiten gibt — ein Pfeil, der nichts aufklappt,
 * ist Möblierungslüge.
 */
import { useState } from 'react';
import type { Block } from '../../domain/schema';

const MERKER = 'redion-neu:baum-offen';

const gemerkt = (): Set<string> => {
  try { return new Set(JSON.parse(sessionStorage.getItem(MERKER) ?? '[]')); }
  catch { return new Set(); }
};

export function PageTree({ seiten, kinderVon }:
    { seiten: Block[]; kinderVon: (id: string) => Block[] }) {
  const [offen, setOffen] = useState<Set<string>>(gemerkt);

  const kippen = (id: string) => {
    const neu = new Set(offen);
    if (neu.has(id)) neu.delete(id); else neu.add(id);
    setOffen(neu);
    try { sessionStorage.setItem(MERKER, JSON.stringify([...neu])); } catch { /* voll — dann eben nicht gemerkt */ }
  };

  const Ast = ({ seite, tiefe }: { seite: Block; tiefe: number }) => {
    const kinder = kinderVon(seite.id);
    const auf = offen.has(seite.id);
    return (
      <li>
        <div className="baum-zeile" style={{ paddingLeft: tiefe * 16 }}>
          {kinder.length > 0 ? (
            <button type="button" className="baum-pfeil" aria-expanded={auf}
                    aria-label={auf ? 'Unterseiten einklappen' : 'Unterseiten aufklappen'}
                    onClick={() => kippen(seite.id)}>
              {auf ? '▾' : '▸'}
            </button>
          ) : <span className="baum-platz" />}
          <a className="shell-seite" href={'#/seite/' + seite.id}>
            <span className="shell-icon">{seite.icon || '📄'}</span>
            {seite.text || 'Ohne Titel'}
          </a>
        </div>
        {auf && kinder.length > 0 && (
          <ul className="baum-kinder">
            {kinder.map((k) => <Ast key={k.id} seite={k} tiefe={tiefe + 1} />)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="baum">
      {seiten.map((s) => <Ast key={s.id} seite={s} tiefe={0} />)}
    </ul>
  );
}
