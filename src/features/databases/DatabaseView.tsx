/* src/features/databases/DatabaseView.tsx — eine Datenbank, nur lesend (RM-6)
 * ----------------------------------------------------------------------------
 * Die erste Bereichs-Scheibe der React-Migration: der Block `database`
 * in einer Seite zeigt seine Tabelle — Spalten aus dem Schema der
 * Sammlung, Zeilen aus den Blöcken mit `parentTable: 'collection'`.
 *
 * NUR die Rohwerte: keine Formeln, keine Rollups, keine Filter — die
 * rechnet der Bestand, und die Formelmaschine wird nicht nachgebaut
 * (E73-Lehre: eine Abschrift prüft sich selbst). Was hier nicht gerechnet
 * werden kann, sagt das ehrlich, statt eine falsche Zahl zu zeigen.
 */
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { CollectionSchema, BlockSchema, type Collection, type Block }
  from '../../domain/schema';
import { readAll } from '../../persistence/legacyStore';

type Stand =
  | { art: 'laedt' }
  | { art: 'fehler'; text: string }
  | { art: 'weg' }
  | { art: 'da'; sammlung: Collection; zeilen: Block[] };

/** Spaltentypen, deren Wert erst eine RECHNUNG ergibt — der Bestand kann
 *  sie, diese Ansicht noch nicht. Ehrlich sagen statt 0 zeigen. */
const GERECHNET = new Set(['formula', 'rollup', 'ki']);

const anzeige = (zeile: Block, key: string, spalte: { type: string }): string => {
  if (spalte.type === 'title')   return zeile.text || 'Ohne Titel';
  if (spalte.type === 'created') return zeile.created;
  if (spalte.type === 'edited')  return zeile.edited;
  if (GERECHNET.has(spalte.type)) return '(rechnet der Bestand)';
  const wert = (zeile.props ?? {})[key];
  if (wert == null || wert === '') return '';
  if (Array.isArray(wert))
    return wert.map((x) => (x && typeof x === 'object' && 'name' in (x as object))
      ? String((x as { name: unknown }).name) : String(x)).join(', ');
  if (typeof wert === 'object') return JSON.stringify(wert);
  return String(wert);
};

export function DatabaseView({ collectionId }: { collectionId: string }) {
  const [stand, setStand] = useState<Stand>({ art: 'laedt' });

  useEffect(() => {
    let lebt = true;
    (async (): Promise<Stand> => {
      const rohSammlungen = await readAll<unknown>('collections');
      const sammlung = rohSammlungen
        .map((r) => CollectionSchema.safeParse(r))
        .filter((p): p is { success: true; data: Collection } => p.success)
        .map((p) => p.data)
        .find((c) => c.id === collectionId);
      if (!sammlung) return { art: 'weg' };
      const zeilen = (await readAll<unknown>('blocks'))
        .map((r) => BlockSchema.safeParse(r))
        .filter((p): p is z.ZodSafeParseSuccess<Block> => p.success)
        .map((p) => p.data)
        .filter((b) => b.parentTable === 'collection' &&
                       b.parentId === collectionId && b.alive)
        .sort((a, b) => a.created.localeCompare(b.created));
      return { art: 'da', sammlung, zeilen };
    })().then(
      (s) => { if (lebt) setStand(s); },
      (err) => { if (lebt) setStand({ art: 'fehler',
        text: err instanceof Error ? err.message : String(err) }); });
    return () => { lebt = false; };
  }, [collectionId]);

  if (stand.art === 'laedt') return <p className="shell-hinweis">Liest die Datenbank …</p>;
  if (stand.art === 'fehler')
    return <p className="shell-fehler">Die Datenbank liess sich nicht lesen: {stand.text}</p>;
  if (stand.art === 'weg')
    return <p className="shell-hinweis">Diese Datenbank gibt es nicht mehr.</p>;

  const spalten = Object.entries(stand.sammlung.schema);
  return (
    <div className="dbv">
      <p className="dbv-name">{stand.sammlung.icon || '🗂️'} {stand.sammlung.name}
        <span className="dbv-zahl"> · {stand.zeilen.length} Zeile(n)</span></p>
      <div className="dbv-rollbox">
        <table className="dbv-tabelle">
          <thead>
            <tr>{spalten.map(([key, sp]) => <th key={key}>{sp.name}</th>)}</tr>
          </thead>
          <tbody>
            {stand.zeilen.map((z) => (
              <tr key={z.id}>
                {spalten.map(([key, sp]) => (
                  <td key={key} className={GERECHNET.has(sp.type) ? 'dbv-gerechnet' : ''}>
                    {anzeige(z, key, sp)}
                  </td>
                ))}
              </tr>
            ))}
            {stand.zeilen.length === 0 && (
              <tr><td colSpan={spalten.length} className="shell-hinweis">
                Keine Zeilen.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
