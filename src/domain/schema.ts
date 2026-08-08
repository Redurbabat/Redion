/* src/domain/schema.ts — die Formen der Ablage, als Zod-Schemas (E78, RM-2)
 * ----------------------------------------------------------------------------
 * DIESE SCHEMAS BESCHREIBEN DEN IST-ZUSTAND. Die Feldnamen heissen so, wie
 * sie in der IndexedDB `notizen` gespeichert sind — `created`, `edited`,
 * `alive`, `erstelltVon`, `groesse`, `teile` … Ein „schönerer" Name wäre
 * keine Umbenennung, sondern eine Datenmigration, und die gehört nach RM-4,
 * nicht hierher (CLAUDE.md §53.3).
 *
 * Die Wahrheit über die Felder steht im Bestand: `addBlock` in
 * src/kern/ablage/indexdb.ts und die Formen in src/kern/ablage/formen.ts.
 * Wer hier ein Feld ergänzt, hat vorher DORT nachgesehen — nicht geraten
 * (ENTSCHEIDUNGEN.md E21).
 *
 * `.loose()` (statt des strikten Objekts) ist an jeder Stelle Absicht:
 * unbekannte Felder BLEIBEN ERHALTEN. Regel 1 aus formen.ts gilt auch hier —
 * ein Feld, das eine spätere Fassung eingeführt hat, darf eine ältere nicht
 * wegwerfen. Ein striktes Schema wäre die stille Fassung genau dieses
 * Fehlers.
 */
import { z } from 'zod';

/** Eine Kennung — heute ein String; die Länge prüft niemand nachträglich. */
export const IdSchema = z.string().min(1);

/** Ein Zeitpunkt, wie `now()` ihn schreibt: ISO-8601 als String. */
export const IsoDateTimeSchema = z.string().refine(
  (s) => !Number.isNaN(new Date(s).getTime()),
  { message: 'Kein lesbarer Zeitpunkt' }
);

/**
 * Ein Block — Absatz, Seite oder Datenbankzeile (eine Zeile IST eine Seite,
 * mit parentTable 'collection').
 */
export const BlockSchema = z.looseObject({
  id: IdSchema,
  type: z.string(),
  text: z.string(),
  /** Kennungen der Kinder — Kennungen, keine Objekte. */
  content: z.array(IdSchema),
  parentId: IdSchema.nullish(),
  parentTable: z.enum(['block', 'collection']),
  created: IsoDateTimeSchema,
  edited: IsoDateTimeSchema,
  /** false = im Papierkorb, nicht endgültig weg. */
  alive: z.boolean(),
  color: z.string().optional(),
  icon: z.string().optional(),
  /** deutsch, weil das Feld so gespeichert ist. */
  erstelltVon: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  collectionId: IdSchema.optional(),
  dateiId: z.string().optional()
});
export type Block = z.infer<typeof BlockSchema>;

/** Eine Spalte im Schema einer Datenbank. */
export const ColumnSchema = z.looseObject({
  name: z.string(),
  /** Bezeichner aus Register.eigenschaften — bewusst string, kein Enum:
      das Register ist zur Laufzeit erweiterbar (CLAUDE.md §52.9). */
  type: z.string(),
  options: z.array(z.looseObject({ name: z.string(), color: z.string().optional() })).optional(),
  formel: z.string().optional(),
  zielCollection: IdSchema.optional()
});

/** Eine Datenbank: hält die Spalten; die Zeilen liegen als Blöcke daneben. */
export const CollectionSchema = z.looseObject({
  id: IdSchema,
  name: z.string(),
  schema: z.record(z.string(), ColumnSchema),
  viewIds: z.array(IdSchema),
  icon: z.string().optional(),
  created: IsoDateTimeSchema.optional()
});
export type Collection = z.infer<typeof CollectionSchema>;

/** Eine Ansicht auf eine Datenbank. */
export const ViewSchema = z.looseObject({
  id: IdSchema,
  collectionId: IdSchema,
  layout: z.string(),
  name: z.string(),
  filters: z.unknown().optional(),
  sorts: z.array(z.unknown()).optional(),
  hidden: z.array(z.string()).optional()
});
export type View = z.infer<typeof ViewSchema>;

/** Ein Dateisatz — die Bytes liegen als Stücke daneben (Fach `stuecke`). */
export const FileRecordSchema = z.looseObject({
  id: IdSchema,
  name: z.string(),
  groesse: z.number(),
  typ: z.string(),
  blockId: IdSchema.nullable(),
  teile: z.number(),
  angekommen: z.number(),
  zustand: z.enum(['wartet', 'laeuft', 'fertig']),
  angelegt: IsoDateTimeSchema,
  fertigAm: IsoDateTimeSchema.nullable()
});
export type FileRecord = z.infer<typeof FileRecordSchema>;

/**
 * Eine gespeicherte Fassung einer Seite.
 *
 * Das Feld heisst `pageId` — der Index darauf heisst 'page', und genau
 * diese Verwechslung stand hier im ersten Wurf. Abgelesen aus
 * `versionSpeichern` (indexdb.ts): nachsehen, nicht raten (E21).
 */
export const VersionSchema = z.looseObject({
  id: IdSchema,
  pageId: IdSchema,
  zeit: IsoDateTimeSchema,
  anlass: z.string(),
  titel: z.string(),
  icon: z.string().optional(),
  daten: z.unknown()
});
export type Version = z.infer<typeof VersionSchema>;
