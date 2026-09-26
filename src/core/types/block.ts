/* ============================================================================
 * src/core/types/block.ts — Blöcke und Seiten
 * ----------------------------------------------------------------------------
 * Alles in Redion ist ein Block. Eine Seite ist ein Block mit `type: 'page'`,
 * eine Zeile in einer Datenbank ebenfalls — sie hängt nur an einer Sammlung
 * statt an einem Block. Das ist keine schöne Theorie, sondern die Form, die
 * `quell/kern/ablage/indexdb.js` tatsächlich schreibt (`addBlock`, Zeile 255).
 *
 * ─── TYPNAMEN ENGLISCH, FELDNAMEN NICHT ─────────────────────────────────────
 *
 * Das ist die wichtigste Regel dieser Datei. `ENTSCHEIDUNGEN.md` E27 macht
 * neue Typnamen englisch — `RedionBlock` statt `Block`. Die **Feldnamen**
 * bleiben, wie sie in der Ablage stehen: `created`, `edited`, `erstelltVon`,
 * `alive`, `parentTable`.
 *
 * Warum: diese Felder beschreiben Bytes, die auf den Geräten von Nutzern
 * liegen. Ein Feldname im Typ, der nicht dem gespeicherten Feld entspricht,
 * ist keine Übersetzung, sondern eine **falsche Behauptung** — und sie
 * umzubenennen wäre eine Datenmigration, keine Namensfrage.
 *
 * `CLAUDE.md` §52.8 zeigte hier einmal `createdAt`, `updatedAt`, `properties`
 * und `deleted` — Felder, die es nicht gibt. Dieses Beispiel war nie gegen die
 * Ablage geprüft. Deshalb steht in diesem Ordner nur, was `addBlock`
 * wirklich schreibt (ENTSCHEIDUNGEN.md E21: nachsehen statt raten).
 * ==========================================================================*/

import type { BlockId, CollectionId, ISODateTime, PageId } from './id.js';

/**
 * Woran ein Block hängt.
 *
 * WARUM ZWEI TABELLEN. Ein gewöhnlicher Block hängt an seinem Elternblock.
 * Eine Datenbankzeile hängt an ihrer Sammlung — sie steht in keinem Baum.
 * Ohne dieses Feld müsste jeder Leser raten, in welchem Fach die Kennung
 * unter `parentId` nachzuschlagen ist.
 */
export type ParentTable = 'block' | 'collection';

/**
 * Ein Block, so wie er in der Ablage liegt.
 *
 * `alive` ist der Papierkorb: `false` heisst gelöscht, aber wiederherstellbar.
 * Erst `purge` entfernt den Satz wirklich (ENTSCHEIDUNGEN.md E19).
 */
export interface RedionBlock {
  id: BlockId;
  /** Der Bezeichner aus `Register.bloecke` — `'text'`, `'page'`, `'todo'`, … */
  type: string;
  text: string;
  /** Kennungen der Kindblöcke, in Reihenfolge. Keine Objekte, nur Kennungen. */
  content: BlockId[];
  parentId: BlockId | CollectionId | null;
  parentTable: ParentTable;
  color: string;
  created: ISODateTime;
  edited: ISODateTime;
  /** Deutsch, weil das Feld in der Ablage so heisst. Siehe Kopf dieser Datei. */
  erstelltVon: string;
  alive: boolean;

  /* Felder, die nur manche Blockarten führen. Sie fehlen häufiger, als sie
   * da sind — deshalb optional und nicht mit Vorgabewert. */
  icon?: string;
  /** Bei Datenbankblöcken: welche Sammlung gezeigt wird. */
  collectionId?: CollectionId;
  /** Bei Datenbankblöcken: welche Ansicht zuletzt offen war. */
  aktiveView?: string;
  /** Bei Anhangblöcken: die Datei in der Ablage. */
  dateiId?: string;
  /** Ab wann der Block im Papierkorb sichtbar ist — Grundlage der Schonfrist. */
  papierkorbSichtbarSeit?: ISODateTime;

  /* Die räumlichen Blockarten (E681 hat gezählt, dass keine davon einen Typ
   * hatte). Feldnamen wie gespeichert; die Formen selbst bleiben `unknown`,
   * bis ihr Format in doku/REDION-FORMAT.md steht und ein Wächter es hält. */
  /** Whiteboard: die Formen (art stift|linie|pfeil|rechteck|ellipse|notiz|text|bild|verbindung). */
  shapes?: unknown[];
  /** Whiteboard: Ausschnitt in Flächenpunkten und Massstab (E138). */
  sicht?: { x: number; y: number; z: number };
  /** Whiteboard, Gedankenkarte: Höhe des Kastens in CSS-Pixeln. */
  hoehe?: number;
  /** Deutung der räumlichen Zahlen. Blatt/PDF-Seite: SheetSpace.RAUM_VERSION;
   *  Whiteboard: 1 = CSS-Pixel bei Massstab 1 (E686). Fehlt = 1. */
  raumVersion?: number;
  /** Gedankenkarte (E607): Knoten und Ausschnitt. */
  karte?: unknown;
  /** Schaltplan (E?): Plan mit teile/leitungen/texte/ebenen. */
  plan?: unknown;
  /** Blatt und PDF-Seite: die Marken der Zeichenschicht (E125). */
  marken?: unknown[];

  /* Die drei Ansichten einer Seite (E690). Nur an Seitenblöcken.
   * FEHLT HÄUFIGER, ALS ES DA IST — und genau das ist die Vorgabe: kein Feld
   * heisst 'redion', also das, was Redion immer gezeigt hat (§9). Wer hier
   * einen Vorgabewert hinschreibt, behauptet etwas über Millionen Blöcke,
   * die ihn nicht tragen. */
  /** Welcher der drei Blicke gilt: 'seite' | 'flaeche' | 'redion'. */
  seitenAnsicht?: string;
  /** Wo der Kasten mit dem Seitentext auf der Fläche liegt, in
   *  Flächeneinheiten bei Massstab 1 (`raumVersion` nach dem Muster aus E686).
   *  Der AUSSCHNITT gehört nicht hierher — er steht in `meta` unter
   *  `flaeche:<seite>`, weil ein Blick am Telefon die Fläche am Rechner nicht
   *  verschieben darf. */
  flaecheNotiz?: { x: number; y: number; w: number; raumVersion?: number };
}

/**
 * Eine Datenbankzeile.
 *
 * Dieselbe Tabelle wie `RedionBlock`, dieselbe Ablage — aber `parentTable`
 * ist `'collection'`, und die Werte der Spalten stehen unter `props`.
 */
export interface RedionRow extends RedionBlock {
  type: 'page';
  parentTable: 'collection';
  parentId: CollectionId;
  props: PropertyValues;
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
export type PropertyValues = Record<string, unknown>;

/** Eine Seite — ein Block, der Kinder trägt und in der Seitenleiste steht. */
export interface RedionPage extends RedionBlock {
  type: 'page';
  id: PageId;
}

/** Ein Eintrag im Versionsverlauf einer Seite. */
export interface RedionVersion {
  id: string;
  pageId: PageId;
  zeit: ISODateTime;
  /** `'automatisch'`, `'manuell'`, … — der Anlass, aus dem gespeichert wurde. */
  anlass: string;
  titel: string;
  icon: string;
  /** Der vollständige Teilbaum zum Zeitpunkt der Aufnahme. */
  daten: RedionBlock[];
}
