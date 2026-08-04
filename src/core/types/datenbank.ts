/* ============================================================================
 * src/core/types/datenbank.ts — Sammlungen, Schemata, Ansichten
 * ----------------------------------------------------------------------------
 * Eine Sammlung hält die Spalten (`schema`) und weiss, welche Ansichten es
 * auf sie gibt. Die Zeilen stehen nicht darin — sie liegen als Blöcke im
 * Fach `blocks` und zeigen über `parentId` hierher zurück. Das ist der
 * Grund, warum eine Sammlung zu löschen und ihre Zeilen stehen zu lassen
 * technisch möglich ist und fachlich ein Datenverlust wäre.
 *
 * Die zwölf Ansichtsarten stammen aus `quell/register/ansichten.js` und sind
 * dort **nachgesehen**, nicht geraten (ENTSCHEIDUNGEN.md E21).
 * ==========================================================================*/

import type { CollectionId, ISODateTime, ViewId } from './basis.js';

/**
 * Eine Spalte im Schema.
 *
 * `type` ist ein Bezeichner aus `Register.eigenschaften` — 35 Stück zur Zeit.
 * Bewusst als `string` und nicht als Aufzählung: das Register lässt sich zur
 * Laufzeit erweitern (`Register.eigenschaften.melde`), und ein Typ, der das
 * verbietet, wäre falsch statt streng.
 */
export interface Spalte {
  name: string;
  type: string;
  /** Bei `select` und `status`: die erlaubten Werte samt Farbe. */
  options?: Array<{ name: string; color?: string }>;
  /** Bei `formula`: der Ausdruck. Wird nie mit `eval` ausgewertet. */
  formel?: string;
  /** Bei `relation`: die Sammlung am anderen Ende. */
  zielCollection?: CollectionId;
  /** Bei `rollup`: worüber gerechnet wird. */
  rollupRelation?: string;
  rollupZiel?: string;
  rollupArt?: string;
}

/** Das Schema einer Sammlung: Spaltenschlüssel → Spalte. */
export type Schema = Record<string, Spalte>;

/** Eine Datenbank. */
export interface Sammlung {
  id: CollectionId;
  name: string;
  icon: string;
  schema: Schema;
  viewIds: ViewId[];
  created: ISODateTime;
}

/** Die zwölf Ansichtsarten aus `Register.ansichten`. */
export type Ansichtsart =
  | 'table'
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
export interface Filterregel {
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
export interface Filtergruppe {
  operator: 'and' | 'or';
  rules: Array<Filterregel | Filtergruppe>;
}

/** Unterscheidet Regel und Gruppe, ohne zu raten. */
export const istGruppe = (r: Filterregel | Filtergruppe): r is Filtergruppe =>
  typeof (r as Filtergruppe).operator === 'string' &&
  Array.isArray((r as Filtergruppe).rules);

/** Eine Sortierung — entweder nach Spalte oder nach freier Formel. */
export interface Sortierung {
  key?: string;
  formel?: string;
  richtung: 'auf' | 'ab';
}

/** Eine Ansicht auf eine Sammlung. */
export interface Ansicht {
  id: ViewId;
  collectionId: CollectionId;
  name: string;
  layout: Ansichtsart;
  filters: Filtergruppe;
  sorts: Sortierung[];
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
