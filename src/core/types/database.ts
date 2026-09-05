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
  /** Bei `formula`: der Ausdruck. Wird nie mit `eval` ausgewertet.
   *
   *  ES HEISST `formula`, NICHT `formel` — nachgesehen, nicht geraten (E412).
   *  Hier stand bis zum 5. September 2026 `formel`, und CLAUDE.md 52.8
   *  schrieb es ab. Gelesen und geschrieben wird aber `def.formula`
   *  (`datenbanken/dienst.ts` formelRechnen, `steuerung.ts:5603, 5765, 7048`).
   *  Wer nach dem Typ baute, bekam eine Formel, die nie rechnete — genau
   *  das ist beim Bau von E412 passiert.
   *
   *  Und `test294` schwieg dazu, obwohl er für solche Fälle gebaut wurde:
   *  er prüft, ob ein Feldname IRGENDWO im Bestand vorkommt, und `formel`
   *  kommt vor — im Formeldreieck der Elektrolehre, in den Knopfvariablen
   *  des Editors und in `Redion.formel()` der Erweiterungen. Drei Dinge,
   *  die mit einer Spalte nichts zu tun haben. */
  formula?: string;

  /* ── Verknüpfung ──────────────────────────────────────────────────────
     NACHGESEHEN, NICHT GERATEN (E298). Hier standen bis zum 1. September
     2026 `zielCollection`, `rollupRelation`, `rollupZiel` und `rollupArt`.
     Keines dieser vier Felder gibt es — nirgends im Bestand, in keiner
     gespeicherten Datenbank. Gemessen wurden die echten in
     `bereiche/datenbanken/steuerung.ts` (Zeilen 1355, 5362, 6021-6023).

     Das ist genau der Fehler, vor dem CLAUDE.md 52.8 warnt, und er stand
     in der Datei, die dafür die Wahrheit sein soll. Ein englischer Name
     ist eine Verbesserung; ein falscher Feldname ist eine falsche
     Behauptung über gespeicherte Daten. */

  /** Bei `relation`: die Datenbank am anderen Ende. */
  ziel?: CollectionId;
  /** Bei `relation`: der Schlüssel der Gegenspalte dort. */
  gegen?: string;
  /** Bei `relation`: wie viele Verknüpfungen erlaubt sind. `0` = beliebig. */
  limit?: number;

  /* ── Rollup ───────────────────────────────────────────────────────────
     Drei Felder, und alle drei heissen anders als bisher behauptet. */

  /** Bei `rollup`: über welche Verknüpfungsspalte gerechnet wird. */
  relation?: string;
  /** Bei `rollup`: welche Spalte der anderen Datenbank gelesen wird. */
  zielKey?: string;
  /** Bei `rollup`: wie zusammengefasst wird — ein Wort aus `ROLLUP_ARTEN`. */
  rollup?: string;

  /* ── Was eine Spalte sonst noch tragen kann ───────────────────────────
     Auch das gemessen: diese acht kommen im Bestand vor und fehlten hier
     vollständig. Eine unvollständige Wahrheit ist die leiser gefährliche:
     wer den Typ liest, hält sie für vollständig. */

  /** Ein Vorgabewert für neue Zeilen. */
  standard?: unknown;
  /** Ob die Spalte ausgefüllt sein muss. */
  pflicht?: boolean;
  /** Ob der Wert in dieser Datenbank nur einmal vorkommen darf. */
  eindeutig?: boolean;
  /** Ob die Spalte von Hand angelegt wurde (und nicht aus einem Import kam). */
  eigen?: boolean;
  /** Bei den KI-Typen: der Auftrag an die KI. */
  auftrag?: string;
  /** Bei `button`: die Beschriftung. */
  knopfText?: string;
  /** Bei `uid`: die Vorsilbe vor der laufenden Nummer. */
  praefix?: string;
  /** Bei `number`, `formula`, `rollup`: wie der Wert angezeigt wird. */
  anzeige?: string;

  /* ── Und dreizehn, die der Code liest und dieser Typ nicht kannte ──────
     Gemessen am 5. September 2026 (E412): jedes `def.X` unter
     `bereiche/datenbanken/` gegen die Felder hier. Dreizehn Treffer, und
     `formula` war der teuerste davon.

     Eine unvollständige Wahrheit ist die leiser gefährliche — wer den Typ
     liest, hält ihn für vollständig und legt das Feld neu an, unter einem
     zweiten Namen. `test294 §5` misst diese Richtung jetzt mit. */

  /** Bei `number`, `formula`, `rollup`: die Einheit hinter der Zahl (E412). */
  einheit?: string;
  /** Ein erklärender Satz unter dem Feld, vor allem im Formular. */
  beschreibung?: string;
  /** Bei `anzeige: 'bar'` und `'ring'`: der Wert, der 100 % entspricht. */
  max?: number;
  /** Prüfregel: ein regulärer Ausdruck, dem der Wert genügen muss. */
  muster?: string;
  /** Der Satz, der erscheint, wenn `muster` nicht zutrifft. */
  musterText?: string;
  /** Prüfregel als Formel — muss wahr ergeben. */
  regel?: string;
  /** Der Satz, der erscheint, wenn `regel` nicht zutrifft. */
  regelText?: string;
  /** Prüfregel bei `number` und `duration`: der kleinste erlaubte Wert. */
  regelMin?: number | string;
  /** Und der grösste. */
  regelMax?: number | string;
  /** Bei `status` und `select`: von welchem Wert zu welchem gesprungen
   *  werden darf. Ein leerer Eintrag heisst: alles ist erlaubt. */
  uebergaenge?: Record<string, string[]>;
  /** Bei `button`: welche Spalte der Knopf setzt. */
  setzeKey?: string;
  /** Bei `button`: auf welchen Wert. */
  setzeWert?: unknown;
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
