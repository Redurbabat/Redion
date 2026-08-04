/* ============================================================================
 * src/core/types/index.ts — eine Tür für alle Typen
 * ----------------------------------------------------------------------------
 * Wer Typen braucht, holt sie hier: `import type { Block } from
 * '../types/index.js'`. Das hält die Importzeilen im übrigen Code kurz und
 * sorgt dafür, dass ein umbenannter Dateiname nicht durch das halbe Projekt
 * wandert.
 *
 * NUR TYPEN UND KLEINE HELFER. Hier steht keine Logik. Was zur Laufzeit
 * etwas tut, gehört in ein Modul — nicht in die Typendatei, die jeder
 * importiert.
 * ==========================================================================*/

export type {
  ID,
  ISODateTime,
  BlockId,
  PageId,
  CollectionId,
  ViewId,
  FileId,
  Ergebnis,
  Erledigt
} from './basis.js';
export { gelungen, gescheitert } from './basis.js';

export type {
  Block,
  Zeile,
  Seite,
  Fassung,
  ElternTabelle,
  Eigenschaftswerte
} from './block.js';

export type {
  Sammlung,
  Schema,
  Spalte,
  Ansicht,
  Ansichtsart,
  Filterregel,
  Filtergruppe,
  Sortierung
} from './datenbank.js';
export { istGruppe } from './datenbank.js';

export type { Datei, Stueck, Uploadzustand } from './datei.js';

export type {
  Sicherung,
  Sicherungskopf,
  Fach,
  MetaSatz,
  Dateienkarte,
  RedionPaket,
  Einspielart,
  Einspielbericht
} from './sicherung.js';

export type { FachName, Speicherort, Speicherlage } from './ablage.js';
export { FAECHER } from './ablage.js';
