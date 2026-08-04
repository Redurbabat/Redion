/* ============================================================================
 * src/core/types/index.ts — eine Tür für alle Typen
 * ----------------------------------------------------------------------------
 * Wer Typen braucht, holt sie hier: `import type { RedionBlock } from
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
  Result,
  Done
} from './id.js';
export { ok, err } from './id.js';

export type {
  RedionBlock,
  RedionRow,
  RedionPage,
  RedionVersion,
  ParentTable,
  PropertyValues
} from './block.js';

export type {
  RedionDatabase,
  RedionView,
  Schema,
  Column,
  ViewLayout,
  FilterRule,
  FilterGroup,
  SortRule
} from './database.js';
export { isFilterGroup } from './database.js';

export type { RedionFile, FileChunk, UploadState } from './file.js';

export type {
  RedionPackageData,
  RedionPackageManifest,
  RedionPackage,
  RedionFileMap,
  StoreName,
  MetaEntry,
  ImportMode,
  ImportReport
} from './backup.js';

export type { StoreKey, StorageLocation, StorageInfo } from './storage.js';
export { STORES } from './storage.js';
