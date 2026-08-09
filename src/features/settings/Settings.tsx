/* src/features/settings/Settings.tsx — Einstellungen, nur lesend (RM-6)
 * ----------------------------------------------------------------------------
 * Zeigt, was der Bestand im Fach `meta` an Einstellungen hält — mit den
 * ECHTEN Schlüsseln, abgelesen aus bereiche/einstellungen/ansicht/seite.ts
 * (E21: nachsehen, nicht raten). Ändern kann nur der Bestand; die Karte
 * sagt es, statt tote Regler anzubieten.
 *
 * Geheimnisse (api:*-Schlüssel) werden hier bewusst NICHT gezeigt — eine
 * Nur-Lese-Ansicht ist kein Grund, Schlüsselwerte auf den Bildschirm zu
 * legen. Es steht nur DA, dass einer hinterlegt ist.
 */
import { useEffect, useState } from 'react';
import { readAll } from '../../persistence/legacyStore';

interface MetaRow { k: string; v: unknown }

/** Schlüssel → deutsches Etikett + Darstellung. Nur was hier steht, wird
 *  gezeigt; der Rest des Fachs ist Innereien, keine Einstellung. */
const BEKANNT: Array<{ k: string; name: string; zeig?: (v: unknown) => string }> = [
  { k: 'nutzer', name: 'Name' },
  { k: 'arbeitsName', name: 'Arbeitsbereich' },
  { k: 'arbeitsIcon', name: 'Symbol' },
  { k: 'dichte', name: 'Dichte' },
  { k: 'datumsformat', name: 'Datumsformat' },
  { k: 'autoVersionen', name: 'Automatische Fassungen',
    zeig: (v) => v === false ? 'aus' : 'an' },
  { k: 'sicherung:zuletzt', name: 'Zuletzt gesichert',
    zeig: (v) => v ? new Date(String(v)).toLocaleString('de-DE') : 'noch nie' },
  { k: 'sicherung:art', name: 'Sicherungsart',
    zeig: (v) => v ? '.' + String(v) : '—' }
];

export function Settings() {
  const [meta, setMeta] = useState<Map<string, unknown> | null>(null);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    let lebt = true;
    readAll<MetaRow>('meta').then(
      (zeilen) => { if (lebt) setMeta(new Map(zeilen.map((z) => [z.k, z.v]))); },
      (err) => { if (lebt) setFehler(err instanceof Error ? err.message : String(err)); });
    return () => { lebt = false; };
  }, []);

  if (fehler)
    return <p className="shell-fehler">Die Einstellungen liessen sich nicht lesen: {fehler}</p>;
  if (!meta) return <p className="shell-hinweis">Liest die Einstellungen …</p>;

  const schluesselDa = [...meta.keys()].some((k) => k.startsWith('api:') && meta.get(k));

  return (
    <section className="est">
      <h2>Einstellungen (nur lesend)</h2>
      <table className="shell-tabelle" data-einstellungen>
        <tbody>
          {BEKANNT.map(({ k, name, zeig }) => {
            const v = meta.get(k);
            const text = zeig ? zeig(v)
              : v == null || v === '' ? '—' : String(v);
            return (
              <tr key={k}>
                <td>{name}</td>
                <td>{text}</td>
              </tr>
            );
          })}
          <tr>
            <td>API-Schlüssel</td>
            <td>{schluesselDa
              ? 'hinterlegt — der Wert bleibt hier bewusst unsichtbar'
              : 'keiner hinterlegt'}</td>
          </tr>
        </tbody>
      </table>
      <p className="shell-hinweis">
        Ändern kann nur der Bestand — <a href="index.html">index.html</a>,
        Bereich Einstellungen. Diese Shell liest.
      </p>
    </section>
  );
}
