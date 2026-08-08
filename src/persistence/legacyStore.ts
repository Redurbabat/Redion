/* src/persistence/legacyStore.ts — Nur-Lese-Zugang zur Ablage des Bestands
 * ----------------------------------------------------------------------------
 * Die neue Schicht LIEST den Bestand, sie schreibt ihn nicht (E78, Regel 1:
 * eine Datenquelle, ein Schreiber). Deshalb rohes indexedDB.open OHNE
 * Versionsangabe — das öffnet, was da ist, und löst nie ein Upgrade aus.
 * Dexie kommt hier bewusst nicht vor: sein Öffnen würde das Schema anfassen.
 *
 * Wozu das gut ist: die React-Shell kann echte Daten zeigen, und RM-4 kann
 * alt ↔ neu Satz für Satz vergleichen — beides, ohne dass der Bestand je
 * einen fremden Schreiber bekommt.
 */

const DB_NAME = 'notizen';

/** Öffnet die Bestands-Ablage, ohne sie zu verändern. null, wenn es sie
 *  (noch) nicht gibt — ein frischer Browser ist kein Fehler. */
const open = (): Promise<IDBDatabase | null> =>
  new Promise((resolve, reject) => {
    /* Ohne Versionsnummer: nie ein upgradeneeded auf fremden Daten. */
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = () => {
      /* Hierher kommt man nur, wenn es die Ablage noch gar nicht gab —
         dann hat der Bestand sie nie angelegt, und diese Schicht darf es
         erst recht nicht. Abbrechen lässt die leere Hülle nicht zurück. */
      req.transaction?.abort();
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Die Ablage „notizen" ist nicht lesbar'));
    req.onblocked = () => reject(new Error('Die Ablage „notizen" ist gerade blockiert'));
  }).then(
    (db) => db as IDBDatabase,
    (err) => {
      /* Ein AbortError aus dem Zweig oben heisst: es gab nichts zu lesen. */
      if (err instanceof DOMException && err.name === 'AbortError') return null;
      throw err;
    }
  );

/** Alle Sätze eines Fachs — oder eine leere Liste, wenn es die Ablage oder
 *  das Fach nicht gibt. Ein LESEFEHLER dagegen lehnt ab (E71: „konnte nicht
 *  nachsehen" darf nie aussehen wie „da ist nichts"). */
export const readAll = async <T>(store: string): Promise<T[]> => {
  const db = await open();
  if (!db) return [];
  try {
    if (!db.objectStoreNames.contains(store)) return [];
    return await new Promise<T[]>((resolve, reject) => {
      const r = db.transaction([store], 'readonly').objectStore(store).getAll();
      r.onsuccess = () => resolve((r.result ?? []) as T[]);
      r.onerror = () => reject(r.error ?? new Error('Fach „' + store + '" nicht lesbar'));
    });
  } finally {
    db.close();
  }
};

/** Wie viele Sätze je Fach — für den Vergleichsblick der Shell. */
export const counts = async (stores: string[]): Promise<Record<string, number>> => {
  const out: Record<string, number> = {};
  for (const s of stores) out[s] = (await readAll(s)).length;
  return out;
};
