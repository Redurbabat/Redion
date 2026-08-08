/* src/persistence/db.ts — die Dexie-Ablage der neuen Schicht (E78, RM-3)
 * ----------------------------------------------------------------------------
 * DIE EINE REGEL DIESER DATEI: Dexie öffnet NIEMALS die Ablage `notizen`.
 *
 * `notizen` ist die IndexedDB des Bestands — die einzige Wahrheit, mit
 * echten Nutzerdaten, gepflegt von src/kern/ablage/indexdb.ts. Ein
 * Dexie-`open` darauf wäre ein Schema-Upgrade auf echten Daten: die
 * Versionsnummer, die Indizes, alles würde Dexie nach SEINEM Bild
 * umbauen. Deshalb arbeitet diese Schicht gegen `redion-neu`, und der
 * Vergleich alt ↔ neu (RM-4) läuft über den Nur-Lese-Zugang in
 * legacyStore.ts.
 *
 * Die Fächer und ihre Feldnamen sind DIESELBEN wie im Bestand — `created`,
 * `alive`, `groesse` … (CLAUDE.md §53.3). Die Migration kopiert Sätze,
 * sie übersetzt keine Namen.
 */
import Dexie, { type Table } from 'dexie';
import type { Block, Collection, View, FileRecord, Version } from '../domain/schema';

/** Ein Eintrag im Fach `meta`: Schlüssel und Wert, mehr nicht. */
export interface MetaRecord { k: string; v: unknown }

/**
 * Ein Stück einer Datei — `nr` zählt ab 0, `dateiId` zeigt auf den Satz.
 *
 * `dateiId`, nicht `datei`: so heisst das FELD im Bestand
 * (anhaengeEinspielen, stueckSchicken). `datei` ist nur der Name des
 * Index darauf — der erste Wurf dieser Datei hatte beide verwechselt,
 * dieselbe Falle wie `page`/`pageId` (E21). Abgelesen, nicht geraten.
 */
export interface ChunkRecord { id: string; dateiId: string; nr: number; blob: Blob }

export class RedionDb extends Dexie {
  blocks!: Table<Block, string>;
  collections!: Table<Collection, string>;
  views!: Table<View, string>;
  meta!: Table<MetaRecord, string>;
  versions!: Table<Version, string>;
  dateien!: Table<FileRecord, string>;
  stuecke!: Table<ChunkRecord, string>;

  constructor(name = 'redion-neu') {
    if (name === 'notizen')
      throw new Error('Dexie darf die Ablage des Bestands nicht öffnen (E78, CLAUDE.md §56.3).');
    super(name);
    /* Die Indizes spiegeln, was der Bestand wirklich abfragt:
       Blöcke nach Eltern, Stücke nach Datei, Fassungen nach Seite. */
    this.version(1).stores({
      blocks: 'id, parentId, parentTable, alive',
      collections: 'id',
      views: 'id, collectionId',
      meta: 'k',
      versions: 'id, pageId',
      dateien: 'id, blockId',
      stuecke: 'id, dateiId, [dateiId+nr]'
    });
  }
}

/** Die eine Instanz — geöffnet wird erst beim ersten Zugriff, nicht beim Laden. */
export const db = new RedionDb();
