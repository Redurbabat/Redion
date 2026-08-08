/* src/persistence/migration.ts — RM-4: kopieren und NACHRECHNEN (E78)
 * ----------------------------------------------------------------------------
 * Zwei Schritte, und der zweite ist der wichtige:
 *
 *   1. `copyFromLegacy` liest alle neun Fächer aus `notizen` (nur lesend,
 *      über legacyStore) und legt sie unverändert in `redion-neu` ab —
 *      gleiche Feldnamen, gleiche Kennungen, gleiche Bytes.
 *   2. `compare` liest BEIDE Seiten noch einmal und rechnet nach, Satz für
 *      Satz und bei den Stücken Byte für Byte. Eine Migration, die sich
 *      nicht nachrechnet, ist ein Umzug mit verbundenen Augen — genau das
 *      verbietet E78 („Datenmigration mit Vergleich alt ↔ neu").
 *
 * Was hier NICHT passiert: `notizen` wird nie beschrieben, nie geändert,
 * nie geschlossen gehalten. `redion-neu` ist bis zum bestandenen Vergleich
 * eine ABSCHRIFT — die Wahrheit bleibt beim Bestand (CLAUDE.md §56.3).
 */
import { RedionDb } from './db';
import { readAll } from './legacyStore';

export const STORES = ['blocks', 'collections', 'views', 'meta', 'versions',
                       'dateien', 'stuecke', 'basis', 'vorrat'] as const;
export type StoreName = (typeof STORES)[number];

/** Der Schlüssel eines Satzes — `meta` trägt `k`, alle anderen `id`. */
const keyOf = (store: StoreName, satz: Record<string, unknown>): string =>
  String(store === 'meta' ? satz['k'] : satz['id']);

export interface CopyReport {
  kopiert: Record<string, number>;
  dauerMs: number;
}

export interface Mismatch {
  fach: string;
  schluessel: string;
  was: 'fehlt-neu' | 'fehlt-alt' | 'ungleich' | 'blob-ungleich';
}

export interface CompareReport {
  gleich: boolean;
  faecher: Record<string, { alt: number; neu: number }>;
  abweichungen: Mismatch[];
  geprueft: number;
  blobsGeprueft: number;
  dauerMs: number;
}

/**
 * Für den Vergleich muss ein Satz zu einem stabilen Text werden. Blobs
 * können das nicht über JSON — sie werden herausgelöst und getrennt
 * verglichen. Die Feldreihenfolge wird sortiert, damit zwei gleiche
 * Sätze nicht an der Reihenfolge scheitern.
 */
const stabil = (wert: unknown): string =>
  JSON.stringify(wert, (_, v) => {
    if (v instanceof Blob) return '[blob:' + v.size + ']';
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const raus: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) raus[k] = (v as Record<string, unknown>)[k];
      return raus;
    }
    return v;
  });

const bytesGleich = async (a: Blob, b: Blob): Promise<boolean> => {
  if (a.size !== b.size) return false;
  /* Stückweise, nie beide ganz in den Speicher — §14 gilt auch beim Prüfen. */
  const SCHRITT = 4 * 1024 * 1024;
  for (let von = 0; von < a.size; von += SCHRITT) {
    const bis = Math.min(von + SCHRITT, a.size);
    const [x, y] = await Promise.all([
      a.slice(von, bis).arrayBuffer(), b.slice(von, bis).arrayBuffer()]);
    const xu = new Uint8Array(x), yu = new Uint8Array(y);
    for (let i = 0; i < xu.length; i++) if (xu[i] !== yu[i]) return false;
  }
  return true;
};

/** Alles aus `notizen` nach `redion-neu` — unverändert. */
export const copyFromLegacy = async (db: RedionDb): Promise<CopyReport> => {
  const t0 = Date.now();
  const kopiert: Record<string, number> = {};
  for (const store of STORES) {
    const saetze = await readAll<Record<string, unknown>>(store);
    /* bulkPut in Scheiben: ein 2-GB-Fach soll den Speicher nicht auf
       einmal halten müssen. */
    const SCHEIBE = 500;
    const tabelle = (db as unknown as Record<string, { bulkPut(x: unknown[]): Promise<unknown> }>)[store];
    if (!tabelle) throw new Error('Die neue Ablage kennt das Fach „' + store + '" nicht');
    for (let von = 0; von < saetze.length; von += SCHEIBE)
      await tabelle.bulkPut(saetze.slice(von, von + SCHEIBE));
    kopiert[store] = saetze.length;
  }
  return { kopiert, dauerMs: Date.now() - t0 };
};

/** Beide Seiten noch einmal lesen und nachrechnen. */
export const compare = async (db: RedionDb): Promise<CompareReport> => {
  const t0 = Date.now();
  const faecher: CompareReport['faecher'] = {};
  const abweichungen: Mismatch[] = [];
  let geprueft = 0, blobsGeprueft = 0;

  for (const store of STORES) {
    const alt = await readAll<Record<string, unknown>>(store);
    const tabelle = (db as unknown as Record<string, { toArray(): Promise<Record<string, unknown>[]> }>)[store];
    if (!tabelle) throw new Error('Die neue Ablage kennt das Fach „' + store + '" nicht');
    const neu = await tabelle.toArray();
    faecher[store] = { alt: alt.length, neu: neu.length };

    const neuNachKey = new Map(neu.map((s) => [keyOf(store, s), s]));
    for (const satzAlt of alt) {
      geprueft++;
      const k = keyOf(store, satzAlt);
      const satzNeu = neuNachKey.get(k);
      if (!satzNeu) { abweichungen.push({ fach: store, schluessel: k, was: 'fehlt-neu' }); continue; }
      neuNachKey.delete(k);
      if (stabil(satzAlt) !== stabil(satzNeu)) {
        abweichungen.push({ fach: store, schluessel: k, was: 'ungleich' });
        continue;
      }
      /* Blobs trägt nur `stuecke` — und dort zählen die Bytes, nicht die
         Grössenangabe im JSON-Ersatz. */
      const blobAlt = (satzAlt as { blob?: unknown }).blob;
      const blobNeu = (satzNeu as { blob?: unknown }).blob;
      if (blobAlt instanceof Blob || blobNeu instanceof Blob) {
        blobsGeprueft++;
        if (!(blobAlt instanceof Blob) || !(blobNeu instanceof Blob) ||
            !(await bytesGleich(blobAlt, blobNeu)))
          abweichungen.push({ fach: store, schluessel: k, was: 'blob-ungleich' });
      }
    }
    /* Was übrig ist, gibt es nur in der Abschrift — auch das ist falsch:
       eine Abschrift mit Erfindungen ist keine. */
    for (const k of neuNachKey.keys())
      abweichungen.push({ fach: store, schluessel: k, was: 'fehlt-alt' });
  }

  return { gleich: abweichungen.length === 0, faecher, abweichungen,
           geprueft, blobsGeprueft, dauerMs: Date.now() - t0 };
};

/** Der ganze RM-4-Schritt: kopieren, dann nachrechnen. */
export const migrateAndVerify = async (db: RedionDb):
    Promise<{ kopie: CopyReport; vergleich: CompareReport }> => {
  const kopie = await copyFromLegacy(db);
  const vergleich = await compare(db);
  return { kopie, vergleich };
};
