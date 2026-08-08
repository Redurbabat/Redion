/* ============================================================================
 * src/core/types/database.ts — Datenbanken, Schemata, Ansichten
 * ----------------------------------------------------------------------------
 * Eine Datenbank hält die Spalten (`schema`) und weiss, welche Ansichten es
 * auf sie gibt. Die Zeilen stehen nicht darin — sie liegen als Blöcke im
 * Fach `blocks` und zeigen über `parentId` hierher zurück. Das ist der
 * Grund, warum eine Datenbank zu löschen und ihre Zeilen stehen zu lassen
 * technisch möglich ist und fachlich ein Datenverlust wäre.
 *
 * Die zwölf Ansichtsarten stammen aus `quell/register/ansichten.js` und sind
 * dort **nachgesehen**, nicht geraten (ENTSCHEIDUNGEN.md E21).
 *
 * SPRACHE. Typnamen englisch (E27); Feldnamen so, wie sie in der Ablage
 * stehen — `groupBy` und `hidden` sind dort schon englisch, `pivotZeile` und
 * `richtung` sind deutsch. Beides bleibt, wie es gespeichert ist.
 * ==========================================================================*/

import type { CollectionId, ISODateTime, ViewId } from './id.js';

/**
 * Eine Spalte im Schema.
 *
 * `type` ist ein Bezeichner aus `Register.eigenschaften` — 35 Stück zur Zeit.
 * Bewusst als `string` und nicht als Aufzählung: das Register lässt sich zur
 * Laufzeit erweitern (`Register.eigenschaften.melde`), und ein Typ, der das
 * verbietet, wäre falsch statt streng.
 */
export interface Column {
  name: string;
  type: string;
  /** Bei `select` und `status`: die erlaubten Werte samt Farbe. */
  options?: Array<{ name: string; color?: string }>;
  /** Bei `formula`: der Ausdruck. Wird nie mit `eval` ausgewertet. */
  formel?: string;
  /** Bei `relation`: die Datenbank am anderen Ende. */
  zielCollection?: CollectionId;
  /** Bei `rollup`: worüber gerechnet wird. */
  rollupRelation?: string;
  rollupZiel?: string;
  rollupArt?: string;
}

/** Das Schema einer Datenbank: Spaltenschlüssel → Spalte. */
export type Schema = Record<string, Column>;

/** Eine Datenbank. */
export interface RedionDatabase {
  id: CollectionId;
  name: string;
  icon: string;
  schema: Schema;
  viewIds: ViewId[];
  created: ISODateTime;
}

/** Die zwölf Ansichtsarten aus `Register.ansichten`. */
export type ViewLayout =
  | 'table'
  /* `raster` stand hier nicht, obwohl das Register es seit jeher führt —
     die Tabellenbedienung mit Pfeiltasten und Bereichsauswahl. Ein Typ,
     der eine gebaute Ansicht nicht kennt, weist gültigen Code ab.
     `test139` vergleicht diese Liste jetzt mit `Register.ansichten`. */
  | 'raster'
  | 'board'
  | 'timeline'
  | 'calendar'
  | 'list'
  | 'gallery'
  | 'chart'
  | 'feed'
  | 'map'
  | 'dashboard'
  | 'pivot'
  | 'form';

/** Eine einzelne Filterbedingung. */
export interface FilterRule {
  key: string;
  /** Der Vergleich — `'ist'`, `'enthaelt'`, `'leer'`, … */
  op: string;
  wert: unknown;
}

/**
 * Eine Filtergruppe. Gruppen dürfen Gruppen enthalten.
 *
 * WARUM VERSCHACHTELT. Ohne Verschachtelung liesse sich
 * „A und (B oder C)" nicht ausdrücken — und genau das ist der Filter, den
 * Nutzer als Erstes bauen wollen.
 */
export interface FilterGroup {
  operator: 'and' | 'or';
  rules: Array<FilterRule | FilterGroup>;
}

/** Unterscheidet Regel und Gruppe, ohne zu raten. */
export const isFilterGroup = (r: FilterRule | FilterGroup): r is FilterGroup =>
  typeof (r as FilterGroup).operator === 'string' &&
  Array.isArray((r as FilterGroup).rules);

/** Eine Sortierung — entweder nach Spalte oder nach freier Formel. */
export interface SortRule {
  key?: string;
  formel?: string;
  richtung: 'auf' | 'ab';
}

/** Eine Ansicht auf eine Datenbank. */
export interface RedionView {
  id: ViewId;
  collectionId: CollectionId;
  name: string;
  layout: ViewLayout;
  filters: FilterGroup;
  sorts: SortRule[];
  /** Spaltenschlüssel, nach dem gruppiert wird. Leer heisst: nicht gruppiert. */
  groupBy: string;
  /** Spaltenschlüssel, die ausgeblendet sind. */
  hidden: string[];
  /** Spaltenschlüssel → Rechenart in der Fusszeile (`'summe'`, `'anzahl'`, …). */
  calc: Record<string, string>;
  created: ISODateTime;

  /* Nur bei `pivot` gesetzt. */
  pivotZeile?: string;
  pivotSpalte?: string;
  pivotWert?: string;
}
