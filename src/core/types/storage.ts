/* ============================================================================
 * src/core/types/storage.ts — die Fächer der Ablage und die drei Speicherorte
 * ----------------------------------------------------------------------------
 * Neun Fächer in IndexedDB, abgelesen aus `quell/kern/ablage/indexdb.js`
 * (Zeilen 71–109). Die Liste ist vollständig und muss es bleiben: jede
 * Stelle, die über alle Fächer läuft — Sicherung, `wipe()`, das Aufräumen
 * des Papierkorbs —, ist genau so lange richtig, wie sie alle neun kennt.
 *
 * Das war schon zweimal der Fehler: `wipe()` leerte fünf von neun Fächern,
 * und die Papierkorb-Reinigung lief an zwei Stellen unterschiedlich. Der
 * wiederkehrende Befund dieses Projekts ist nicht „etwas vergessen", sondern
 * „an einer Stelle getan und an der Nachbarstelle nicht".
 *
 * SPRACHE. Typnamen englisch (E27). Die **Werte** sind die echten Fachnamen
 * aus IndexedDB — `dateien`, `stuecke`, `vorrat` heissen dort so. Sie zu
 * übersetzen hiesse, die Ablage umzubauen.
 * ==========================================================================*/

/** Alle neun Fächer der Ablage. Wer über Fächer läuft, läuft über diese Liste. */
export const STORES = [
  'blocks',
  'collections',
  'views',
  'meta',
  'versions',
  'dateien',
  'stuecke',
  'basis',
  'vorrat'
] as const;

export type StoreKey = (typeof STORES)[number];

/**
 * Wo die Daten liegen.
 *
 * `'browser'` ist die Vorgabe und läuft ohne alles. `'ordner'` legt sie über
 * die File System Access API in einen echten Ordner — sichtbar, sicherbar,
 * aber nicht in jedem Browser vorhanden. `'server'` gleicht zusätzlich ab.
 *
 * WARUM DREI UND NICHT EINER. Ein Nutzer, der seine Daten nicht sehen kann,
 * glaubt irgendwann, sie seien weg — und ein Nutzer, der einen Server braucht,
 * um seine Notizen zu öffnen, hat keine lokale App. Beide Sorgen sind
 * berechtigt, und keine lässt sich mit einem einzigen Modus bedienen.
 */
export type StorageLocation = 'browser' | 'ordner' | 'server';

/** Was der Nutzer über seinen Speicher wissen muss, ohne nachzufragen. */
export interface StorageInfo {
  ort: StorageLocation;
  /** Belegt in Bytes, soweit der Browser es sagt. `null`, wenn er schweigt. */
  belegt: number | null;
  /** Zugeteilt in Bytes. `null`, wenn unbekannt. */
  zugeteilt: number | null;
  /**
   * Ob der Browser zugesagt hat, die Daten nicht von selbst zu räumen.
   * `false` heisst nicht „geht kaputt", sondern „ist nicht zugesichert" —
   * und der Unterschied gehört dem Nutzer gesagt, nicht verschwiegen.
   */
  dauerhaft: boolean;
}
