/* src/files/blobStore.ts — Bytes unter ihrer Inhaltsadresse (RM-8, E78)
 * ----------------------------------------------------------------------------
 * Der Speicher für Dateibytes der neuen Schicht: OPFS, wenn der Browser es
 * kann, sonst IndexedDB (`redion-neu`, Fach `stuecke`-artig? — nein: ein
 * EIGENES Fach `blobs`, adressiert über den Hash). Die Wahl trifft der
 * Browser, nicht der Code des Aufrufers: beide Wege haben dieselben vier
 * Verben.
 *
 *   put(blob)      → Adresse (rechnet den Hash; gleiche Bytes, gleiche
 *                    Adresse, einmal gespeichert — Dedup ist kein Feature,
 *                    sondern die Folge der Adressierung)
 *   get(adresse)   → Blob oder null
 *   has(adresse)   → boolean (für den Sync: „kennt der Server den Hash?")
 *   remove(adresse)→ void
 *
 * WICHTIG: dieser Speicher gehört zur NEUEN Schicht. Der Bestand behält
 * seine Stücke in `notizen` — bis RM-10 ihn ablöst, sind das zwei
 * getrennte Welten, und nur die Migration (RM-4/RM-8) trägt von der einen
 * in die andere.
 */
import Dexie from 'dexie';
import { contentAddress, addressPath } from './hashing';

interface BlobRow { adresse: string; blob: Blob }

/** Das IndexedDB-Rückfallfach — eigene kleine Dexie-Ablage, damit der
 *  Blob-Speicher die Datenablage (`redion-neu`) nicht aufbläht. */
class BlobDb extends Dexie {
  blobs!: Dexie.Table<BlobRow, string>;
  constructor(name = 'redion-neu-blobs') {
    super(name);
    this.version(1).stores({ blobs: 'adresse' });
  }
}

const opfsWurzel = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    if (!navigator.storage?.getDirectory) return null;
    const wurzel = await navigator.storage.getDirectory();
    return await wurzel.getDirectoryHandle('redion-blobs', { create: true });
  } catch { return null; }
};

const opfsOrdner = async (adresse: string, anlegen: boolean):
    Promise<{ ordner: FileSystemDirectoryHandle; name: string } | null> => {
  const wurzel = await opfsWurzel();
  if (!wurzel) return null;
  const pfad = addressPath(adresse);
  const teile = pfad.split('/');
  const fach = teile[0] ?? '';
  const name = teile[1] ?? '';
  try {
    const ordner = await wurzel.getDirectoryHandle(fach, { create: anlegen });
    return { ordner, name };
  } catch { return null; }
};

export class BlobStore {
  private db: BlobDb;
  /** Nur für Prüfläufe sichtbar: welcher Weg zuletzt trug. */
  public zuletzt: 'opfs' | 'indexeddb' | null = null;

  constructor(dbName?: string) { this.db = new BlobDb(dbName); }

  async put(blob: Blob): Promise<string> {
    const adresse = await contentAddress(blob);
    if (await this.has(adresse)) return adresse;   /* Dedup: schon da */
    const ziel = await opfsOrdner(adresse, true);
    if (ziel) {
      try {
        const datei = await ziel.ordner.getFileHandle(ziel.name, { create: true });
        const strom = await datei.createWritable();
        /* Stückweise in den Strom — nie den ganzen Blob als Bytes im Heap. */
        await blob.stream().pipeTo(strom);
        this.zuletzt = 'opfs';
        return adresse;
      } catch { /* dann eben IndexedDB */ }
    }
    await this.db.blobs.put({ adresse, blob });
    this.zuletzt = 'indexeddb';
    return adresse;
  }

  async get(adresse: string): Promise<Blob | null> {
    const ziel = await opfsOrdner(adresse, false);
    if (ziel) {
      try {
        const datei = await ziel.ordner.getFileHandle(ziel.name);
        this.zuletzt = 'opfs';
        return await datei.getFile();
      } catch { /* nicht in OPFS — Rückfall prüfen */ }
    }
    const zeile = await this.db.blobs.get(adresse);
    if (zeile) { this.zuletzt = 'indexeddb'; return zeile.blob; }
    return null;
  }

  async has(adresse: string): Promise<boolean> {
    const ziel = await opfsOrdner(adresse, false);
    if (ziel) {
      try { await ziel.ordner.getFileHandle(ziel.name); return true; }
      catch { /* weiter */ }
    }
    return (await this.db.blobs.get(adresse)) !== undefined;
  }

  async remove(adresse: string): Promise<void> {
    const ziel = await opfsOrdner(adresse, false);
    if (ziel) { try { await ziel.ordner.removeEntry(ziel.name); } catch { /* war nicht dort */ } }
    await this.db.blobs.delete(adresse);
  }
}
