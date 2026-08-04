/* ============================================================================
 * src/core/types/excel.ts — was aus Excel kommt und was dorthin geht
 * ----------------------------------------------------------------------------
 * SPRACHE. Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27.
 *
 * ─── WAS DIESE DATEI IST UND WAS NICHT ──────────────────────────────────────
 *
 * Sie beschreibt die **Berührungsflächen** zu Excel: die deutschen
 * Funktionsnamen, die Fehlerwerte, die Ein- und Ausgabearten. Sie enthält
 * bewusst **keine Liste aller Funktionen**. Die lebt in
 * `quell/bereiche/datenbanken/formeln/laufzeit.js` und wird von
 * `quell/register/formeln.js` beschrieben; eine dritte Fassung hier wäre die
 * dritte Stelle, an der dasselbe steht — und die erste, die veraltet.
 *
 * Gemessen: **57 Zweitnamen** in der Aliastabelle, 262 Einträge im Register.
 *
 * ─── DIE LEHRE, DIE IN DIESER DATEI STECKT ──────────────────────────────────
 *
 * Die deutschen Namen wurden gebaut, das deutsche **Trennzeichen** nicht. Die
 * Signaturen versprachen `SUMME(a; b; …)`, der Zerleger kannte das Semikolon
 * gar nicht. Von 41 Beispielen im Formeleditor liefen 30 nicht.
 *
 * „Excel-kompatibel" ist deshalb kein Zustand, sondern eine Liste von
 * Einzelheiten: Name, Trennzeichen, Dezimalzeichen, Fehlerwert, Rundungsart,
 * Datumsnullpunkt. Jede davon kann für sich falsch sein, während alles
 * andere stimmt — und jede fühlt sich für den Menschen wie „geht nicht" an.
 * ==========================================================================*/

import type { FormulaName, FormulaErrorCode } from './formula.js';

/* ===========================================================================
 * 1 · NAMEN
 * ========================================================================= */

/** Ein Funktionsname in deutscher Excel-Schreibweise: `SUMME`, `SVERWEIS`. */
export type GermanExcelFunctionName = FormulaName;

/** Derselbe in englischer Schreibweise: `SUM`, `VLOOKUP`. */
export type EnglishExcelFunctionName = FormulaName;

/** Beides zusammen — was ein Mensch tippen darf. */
export type ExcelFunctionName = GermanExcelFunctionName | EnglishExcelFunctionName;

/**
 * Die Zuordnung deutscher Name → interner Name.
 *
 * Kleingeschrieben, weil vor dem Nachschlagen kleingeschrieben wird:
 * `SUMME`, `Summe` und `summe` treffen dieselbe Funktion.
 */
export type ExcelAliasMap = Record<GermanExcelFunctionName, FormulaName>;

/* ===========================================================================
 * 2 · SCHREIBWEISE
 * ---------------------------------------------------------------------------
 * Die drei Zeichen, an denen sich entscheidet, ob eine getippte Formel läuft.
 * Sie hängen in Excel an der Ländereinstellung; hier stehen sie beieinander,
 * damit niemand wieder nur eines davon baut.
 * ========================================================================= */

export interface ExcelSyntax {
  /**
   * Was Argumente trennt.
   *
   * Beides gilt: deutsches Excel schreibt `;`, englisches `,`. Redion nimmt
   * seit dem Fund **beide** — das Semikolon wird beim Zerlegen zum Komma.
   */
  argumentSeparator: ';' | ',';
  /** Was die Nachkommastellen abtrennt. `Formula.zahl` nimmt beide. */
  decimalSeparator: ',' | '.';
  /** Was Zeilen eines Bereichs trennt: `{1,2;3,4}`. */
  rowSeparator: ';' | '\\';
}

/** Was Redion versteht — gemessen, nicht gewünscht. */
export const EXCEL_SYNTAX_ACCEPTED = {
  argumentSeparator: [';', ','],
  decimalSeparator: [',', '.']
} as const;

/* ===========================================================================
 * 3 · FEHLERWERTE
 * ---------------------------------------------------------------------------
 * Sie stehen in `formula.ts`, weil sie dort hingehören — hier nur der
 * Durchgriff, damit ein Import aus `excel.ts` genügt, wenn man an einer
 * Excel-Stelle arbeitet.
 *
 * NOCH NICHT IN GEBRAUCH. Redions Laufzeit rechnet abwehrend (`1/0 → 0`).
 * Der Spreadsheet-Block darf später Excel-Fehlerwerte führen; die
 * Datenbankformeln nicht, sonst ändert jede bestehende Spalte ihr Ergebnis.
 * ========================================================================= */

export type ExcelErrorCode = FormulaErrorCode;

/* ===========================================================================
 * 4 · EIN- UND AUSGABE
 * ========================================================================= */

/**
 * Wie eine eingelesene Tabelle in Redion landet.
 *
 *   'datenbank'    als Datenbank mit Spalten und Typen — der Regelfall
 *   'spreadsheet'  als Tabellenblock, Zelle für Zelle, mit Formeln
 *   'vorschau'     gar nicht: erst zeigen, was käme
 *
 * Die Vorschau ist kein Komfort. Ein Import ohne sie ist ein Schreibvorgang
 * ohne Rückfrage, und das ist in diesem Projekt die eine Sache, die nicht
 * passieren darf.
 */
export type ExcelImportMode = 'datenbank' | 'spreadsheet' | 'vorschau';

/** Was beim Ausgeben mitgeht. */
export interface ExcelExportOptions {
  /** Formeln als Formeln schreiben — oder nur ihr letztes Ergebnis. */
  formeln: boolean;
  /** Zahlenformate, Farben, Rahmen. */
  formate: boolean;
  /** Mehrere Blätter statt eines. */
  blaetter: boolean;
}

export type ExcelFileFormat = 'xlsx' | 'csv' | 'tsv' | 'ods';

/**
 * Was beim Lesen einer CSV erst erraten werden muss.
 *
 * Alles davon kann danebengehen, und jedes Danebengehen sieht anders aus:
 * ein falsches Trennzeichen gibt eine Spalte, eine falsche Kopfzeile
 * verschiebt alles um eins, eine falsche Zeichenkodierung macht aus `ä` ein
 * `Ã¤`. Deshalb gehört jede dieser Vermutungen in die Vorschau, wo ein
 * Mensch sie widerrufen kann.
 */
export interface CsvDialect {
  trenner: ',' | ';' | '\t' | '|';
  anfuehrung: '"' | "'";
  kopfzeile: boolean;
  kodierung: 'utf-8' | 'utf-8-bom' | 'windows-1252' | 'iso-8859-1';
  zeilenende: '\n' | '\r\n';
}
