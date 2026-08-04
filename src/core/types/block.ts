/* ============================================================================
 * src/core/types/block.ts — Blöcke und Seiten
 * ----------------------------------------------------------------------------
 * Alles in Redion ist ein Block. Eine Seite ist ein Block mit `type: 'page'`,
 * eine Zeile in einer Datenbank ebenfalls — sie hängt nur an einer Sammlung
 * statt an einem Block. Das ist keine schöne Theorie, sondern die Form, die
 * `quell/kern/ablage/indexdb.js` tatsächlich schreibt (`addBlock`, Zeile 255).
 *
 * ABGESCHRIEBEN, NICHT ERFUNDEN. Diese Typen sind aus dem laufenden Code
 * gemessen, nicht aus dem Gedächtnis geschrieben (ENTSCHEIDUNGEN.md E21).
 * Wer hier etwas ändert, ändert eine Behauptung über Daten, die auf den
 * Geräten von Nutzern liegen — und die lässt sich nicht zurücknehmen.
 * ==========================================================================*/

import type { BlockId, CollectionId, ISODateTime, PageId } from './basis.js';

/**
 * Woran ein Block hängt.
 *
 * WARUM ZWEI TABELLEN. Ein gewöhnlicher Block hängt an seinem Elternblock.
 * Eine Datenbankzeile hängt an ihrer Sammlung — sie steht in keinem Baum.
 * Ohne dieses Feld müsste jeder Leser raten, in welchem Fach die Kennung
 * unter `parentId` nachzuschlagen ist.
 */
export type ElternTabelle = 'block' | 'collection';

/**
 * Ein Block, so wie er in der Ablage liegt.
 *
 * `alive` ist der Papierkorb: `false` heisst gelöscht, aber wiederherstellbar.
 * Erst `purge` entfernt den Satz wirklich (ENTSCHEIDUNGEN.md E19).
 */
export interface Block {
  id: BlockId;
  /** Der Bezeichner aus `Register.bloecke` — `'text'`, `'page'`, `'todo'`, … */
  type: string;
  text: string;
  /** Kennungen der Kindblöcke, in Reihenfolge. Keine Objekte, nur Kennungen. */
  content: BlockId[];
  parentId: BlockId | CollectionId | null;
  parentTable: ElternTabelle;
  color: string;
  created: ISODateTime;
  edited: ISODateTime;
  erstelltVon: string;
  alive: boolean;

  /* Felder, die nur manche Blockarten führen. Sie fehlen häufiger, als sie
   * da sind — deshalb optional und nicht mit Vorgabewert. */
  icon?: string;
  /** Bei Datenbankblöcken: welche Sammlung gezeigt wird. */
  collectionId?: CollectionId;
  /** Bei Datenbankblöcken: welche Ansicht zuletzt offen war. */
  aktiveView?: ViewIdBezug;
  /** Bei Anhangblöcken: die Datei in der Ablage. */
  dateiId?: string;
  /** Ab wann der Block im Papierkorb sichtbar ist — Grundlage der Schonfrist. */
  papierkorbSichtbarSeit?: ISODateTime;
}

/** Nur ein Alias, damit `block.ts` nicht auf `datenbank.ts` zeigen muss. */
type ViewIdBezug = string;

/**
 * Eine Datenbankzeile.
 *
 * Dieselbe Tabelle wie `Block`, dieselbe Ablage — aber `parentTable` ist
 * `'collection'`, und die Werte der Spalten stehen unter `props`.
 */
export interface Zeile extends Block {
  type: 'page';
  parentTable: 'collection';
  parentId: CollectionId;
  props: Eigenschaftswerte;
}

/**
 * Die Spaltenwerte einer Zeile: Spaltenschlüssel → Wert.
 *
 * WARUM `unknown` UND NICHT EINE UNION. Der Werttyp hängt vom Spaltentyp im
 * Schema ab, und der steht woanders. Eine Union aus `string | number |
 * boolean | string[]` sähe genauer aus, wäre aber gelogen: sie würde
 * behaupten, jeder Leser wisse, welcher Fall vorliegt. `unknown` zwingt zum
 * Nachsehen — und das Nachsehen ist hier die richtige Arbeit.
 */
export type Eigenschaftswerte = Record<string, unknown>;

/** Eine Seite — ein Block, der Kinder trägt und in der Seitenleiste steht. */
export interface Seite extends Block {
  type: 'page';
  id: PageId;
}

/** Ein Eintrag im Versionsverlauf einer Seite. */
export interface Fassung {
  id: string;
  pageId: PageId;
  zeit: ISODateTime;
  /** `'automatisch'`, `'manuell'`, … — der Anlass, aus dem gespeichert wurde. */
  anlass: string;
  titel: string;
  icon: string;
  /** Der vollständige Teilbaum zum Zeitpunkt der Aufnahme. */
  daten: Block[];
}
