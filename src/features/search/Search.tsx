/* src/features/search/Search.tsx — Suche über den Bestand, nur lesend (RM-6)
 * ----------------------------------------------------------------------------
 * Titel UND Inhalt, wie die Schnellsuche des Bestands: getippt wird sofort
 * gefiltert, ein Treffer im Inhalt zeigt seine Seite als Ziel. Gelöschtes
 * (alive: false) taucht nicht auf — der Papierkorb ist kein Suchraum.
 *
 * Die Treffermenge ist gedeckelt und SAGT es („… und N weitere") — eine
 * stillschweigend gekappte Liste sähe aus wie eine vollständige (§13-Geist).
 */
import { useEffect, useMemo, useState } from 'react';
import { BlockSchema, type Block } from '../../domain/schema';
import { readAll } from '../../persistence/legacyStore';

const DECKEL = 30;

interface Treffer { seite: Block; wo: 'titel' | 'inhalt'; auszug: string }

export function Search() {
  const [alle, setAlle] = useState<Map<string, Block> | null>(null);
  const [frage, setFrage] = useState('');

  useEffect(() => {
    let lebt = true;
    readAll<unknown>('blocks').then((roh) => {
      if (!lebt) return;
      const karte = new Map<string, Block>();
      for (const r of roh) {
        const p = BlockSchema.safeParse(r);
        if (p.success && p.data.alive) karte.set(p.data.id, p.data);
      }
      setAlle(karte);
    }, () => { if (lebt) setAlle(new Map()); });
    return () => { lebt = false; };
  }, []);

  const treffer = useMemo((): { liste: Treffer[]; mehr: number } => {
    const q = frage.trim().toLowerCase();
    if (!q || !alle) return { liste: [], mehr: 0 };
    /* Die Seite eines Blocks: über parentId hochlaufen, bis eine Seite
       kommt. Zeilen (parentTable 'collection') zählen selbst als Seite. */
    const seiteVon = (b: Block): Block | null => {
      let lauf: Block | undefined = b;
      for (let i = 0; i < 50 && lauf; i++) {
        if (lauf.type === 'page' || lauf.parentTable === 'collection') return lauf;
        lauf = lauf.parentId ? alle.get(lauf.parentId) : undefined;
      }
      return null;
    };
    const raus: Treffer[] = [];
    const gesehen = new Set<string>();
    for (const b of alle.values()) {
      const text = (b.text || '').toLowerCase();
      if (!text.includes(q)) continue;
      const seite = b.type === 'page' ? b : seiteVon(b);
      if (!seite) continue;
      const schluessel = seite.id + '|' + (b.type === 'page' ? 'titel' : b.id);
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      const i = text.indexOf(q);
      raus.push({
        seite,
        wo: b.type === 'page' ? 'titel' : 'inhalt',
        auszug: b.type === 'page' ? '' :
          (b.text || '').slice(Math.max(0, i - 30), i + q.length + 40)
      });
    }
    raus.sort((a, b) => a.wo === b.wo ? 0 : a.wo === 'titel' ? -1 : 1);
    return { liste: raus.slice(0, DECKEL), mehr: Math.max(0, raus.length - DECKEL) };
  }, [frage, alle]);

  return (
    <section className="suche">
      <h2>Suche</h2>
      <input type="search" className="suche-feld" value={frage}
             placeholder="Titel und Inhalt durchsuchen …"
             onChange={(e) => setFrage(e.target.value)} />
      {frage.trim() && alle && treffer.liste.length === 0 && (
        <p className="shell-hinweis">Nichts gefunden zu „{frage.trim()}".</p>
      )}
      <ul className="suche-treffer">
        {treffer.liste.map((t, i) => (
          <li key={i}>
            <a className="shell-seite" href={'#/seite/' + t.seite.id}>
              <span className="shell-icon">{t.seite.icon || '📄'}</span>
              <span className="suche-text">
                {t.seite.text || 'Ohne Titel'}
                {t.wo === 'inhalt' && (
                  <span className="suche-auszug">… {t.auszug} …</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {treffer.mehr > 0 && (
        <p className="shell-hinweis">… und {treffer.mehr} weitere Treffer —
          enger fassen statt endlos rollen.</p>
      )}
    </section>
  );
}
