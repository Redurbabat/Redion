/* src/features/pages/PageView.tsx — eine Seite, nur lesend (RM-5, E78)
 * ----------------------------------------------------------------------------
 * Zeigt eine echte Seite des Bestands: Titel, dann die Blöcke in der
 * Reihenfolge aus `content`. Kein innerHTML, nirgends — React escapet
 * Text von Haus aus, und genau so bleibt §19 hier ohne eine einzige
 * eigene esc()-Zeile erfüllt.
 *
 * Unbekannte Blockarten werden GEZEIGT, nicht verschluckt (§18: unbekannte
 * Blocktypen nicht löschen — und auch nicht verstecken): ein grauer Kasten
 * mit der Artangabe ist ehrlicher als eine Lücke, über die niemand stolpert.
 */
import { useEffect, useState } from 'react';
import { BlockSchema, type Block } from '../../domain/schema';
import { readAll } from '../../persistence/legacyStore';
import { navigate } from '../../app/router';
import { DatabaseView } from '../databases/DatabaseView';

type Stand =
  | { art: 'laedt' }
  | { art: 'fehler'; text: string }
  | { art: 'weg' }
  | { art: 'da'; seite: Block; kinder: Map<string, Block> };

const holen = async (id: string): Promise<Stand> => {
  const alle = await readAll<unknown>('blocks');
  const karte = new Map<string, Block>();
  for (const roh of alle) {
    const p = BlockSchema.safeParse(roh);
    if (p.success) karte.set(p.data.id, p.data);
  }
  const seite = karte.get(id);
  if (!seite || !seite.alive) return { art: 'weg' };
  return { art: 'da', seite, kinder: karte };
};

function BlockZeile({ block, karte, tiefe }:
    { block: Block; karte: Map<string, Block>; tiefe: number }) {
  const kinder = (block.content ?? [])
    .map((k) => karte.get(k))
    .filter((b): b is Block => !!b && b.alive);

  const inhalt = (() => {
    switch (block.type) {
      case 'h1': return <h2 className="pv-h1">{block.text}</h2>;
      case 'h2': return <h3 className="pv-h2">{block.text}</h3>;
      case 'h3': return <h4 className="pv-h3">{block.text}</h4>;
      case 'text': return <p className="pv-text">{block.text}</p>;
      case 'quote': return <blockquote className="pv-zitat">{block.text}</blockquote>;
      case 'code': return <pre className="pv-code"><code>{block.text}</code></pre>;
      case 'bullet': return <p className="pv-punkt">• {block.text}</p>;
      case 'number': return <p className="pv-punkt">1. {block.text}</p>;
      case 'todo': return (
        <p className="pv-todo">
          <input type="checkbox" readOnly
                 checked={!!(block as Record<string, unknown>)['checked']} /> {block.text}
        </p>);
      case 'divider': return <hr />;
      case 'database': {
        const collId = (block as Record<string, unknown>)['collectionId'];
        return typeof collId === 'string'
          ? <DatabaseView collectionId={collId} />
          : <p className="pv-unbekannt">Ein Datenbankblock ohne Sammlung —
              das ist ein Befund, kein Inhalt.</p>;
      }
      case 'page': return (
        <p className="pv-unterseite">
          <a href={'#/seite/' + block.id}>{block.icon || '📄'} {block.text || 'Ohne Titel'}</a>
        </p>);
      default: return (
        <p className="pv-unbekannt">
          {block.text || '(ohne Text)'}
          <span className="pv-art">{block.type} — diese Blockart zeigt die neue
            Shell noch nicht; im Bestand ist sie vollständig</span>
        </p>);
    }
  })();

  return (
    <div className="pv-block" style={{ marginLeft: tiefe * 18 }}>
      {inhalt}
      {kinder.map((k) => (
        <BlockZeile key={k.id} block={k} karte={karte} tiefe={tiefe + 1} />
      ))}
    </div>
  );
}

export function PageView({ id }: { id: string }) {
  const [stand, setStand] = useState<Stand>({ art: 'laedt' });

  useEffect(() => {
    let lebt = true;
    setStand({ art: 'laedt' });
    holen(id).then(
      (s) => { if (lebt) setStand(s); },
      (err) => { if (lebt) setStand({ art: 'fehler',
        text: err instanceof Error ? err.message : String(err) }); });
    return () => { lebt = false; };
  }, [id]);

  return (
    <div className="pv">
      <nav className="pv-weg">
        <button type="button" onClick={() => navigate({ name: 'start' })}>
          ← Alle Seiten
        </button>
      </nav>
      {stand.art === 'laedt' && <p className="shell-hinweis">Liest die Seite …</p>}
      {stand.art === 'fehler' && (
        <p className="shell-fehler">Die Seite liess sich nicht lesen: {stand.text}</p>)}
      {stand.art === 'weg' && (
        <p className="shell-hinweis">Diese Seite gibt es nicht — oder sie liegt im Papierkorb.</p>)}
      {stand.art === 'da' && (
        <article>
          <h1 className="pv-titel">
            {stand.seite.icon || '📄'} {stand.seite.text || 'Ohne Titel'}
          </h1>
          {(stand.seite.content ?? []).length === 0 && (
            <p className="shell-hinweis">Diese Seite ist leer.</p>)}
          {(stand.seite.content ?? [])
            .map((k) => stand.kinder.get(k))
            .filter((b): b is Block => !!b && b.alive)
            .map((b) => (
              <BlockZeile key={b.id} block={b} karte={stand.kinder} tiefe={0} />
            ))}
        </article>
      )}
    </div>
  );
}
