/* ============================================================================
 * src/core/types/spreadsheet.ts — der Tabellenkern
 * ----------------------------------------------------------------------------
 * SPRACHE. Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27.
 *
 * ─── WAS HIER ANDERS IST ALS IN DEN ÜBRIGEN TYPDATEIEN ──────────────────────
 *
 * `block.ts`, `database.ts` und `formula.ts` beschreiben Code, der läuft —
 * sie sind an ihm **gemessen**. Diese Datei beschreibt etwas, das es noch
 * nicht gibt: den Spreadsheet-Block. Sie ist damit die einzige im Ordner, die
 * eine Absicht festhält statt eines Zustands.
 *
 * Das ist heikel und deshalb ausdrücklich gesagt: **wer hier etwas ändert,
 * darf das ohne Messung — wer etwas in den anderen Dateien ändert, nicht.**
 * Sobald der Block gebaut ist, kehrt sich das um: dann gilt auch hier, was
 * für die anderen gilt.
 *
 * ─── WORAN SIE SICH TROTZDEM HÄLT ───────────────────────────────────────────
 *
 * Drei Dinge sind nicht frei erfunden, sondern aus dem Vorhandenen
 * übernommen:
 *
 *   1. Ein Tabellenblatt **ist ein Block** (`RedionBlock` mit `type:
 *      'spreadsheet'`). Kein zweites Ablagefach, kein neuer Store. Damit
 *      erben Tabellen Papierkorb, Versionen, Sicherung und Abgleich, ohne
 *      dass eines davon angefasst werden muss.
 *   2. Gerechnet wird mit der vorhandenen Formelmaschine. Was sie kann,
 *      steht in `formula.ts`; hier kommt nur der Zellbezug dazu.
 *   3. Die Feldnamen der Ablage werden nicht umbenannt. Was neu ist, heisst
 *      englisch; was an `RedionBlock` hängt, heisst wie dort.
 *
 * ─── DIE EINE ENTSCHEIDUNG, DIE HIER SICHTBAR WIRD ──────────────────────────
 *
 * `CellValue` schliesst `FormulaErrorCode` ein, `FormulaValue` nicht. Das ist
 * der ganze Unterschied zwischen den beiden Welten: eine Datenbankformel
 * rechnet abwehrend weiter (`1/0 → 0`), eine Tabellenzelle darf `#DIV/0!`
 * zeigen, weil ein Mensch aus Excel genau das erwartet.
 *
 * Beides nebeneinander ist möglich, weil die Fehlerwerte **nur hier** in den
 * Werttyp kommen. Stünden sie in `FormulaValue`, änderte sich das Ergebnis
 * jeder bestehenden Spalte — eine Änderung, die niemand beschlossen hat.
 * ==========================================================================*/

import type { BlockId, ID, ISODateTime } from './id.js';
import type { FormulaErrorCode, FormulaText, FormulaValue } from './formula.js';

/* ===========================================================================
 * 1 · KENNUNGEN UND ADRESSEN
 * ========================================================================= */

export type WorkbookId = ID;
export type SheetId = ID;

/**
 * Eine Zelladresse in A1-Schreibweise: `A1`, `B12`, `AA100`.
 *
 * WARUM A1 UND NICHT ZEILE/SPALTE ALS ZAHLEN. Weil der Mensch sie tippt. Ein
 * Bezug in einer Formel ist Text, den jemand liest und schreibt; ihn intern
 * anders zu führen als aussen hiesse, an jeder Grenze umzurechnen — und die
 * Umrechnung falsch herum ist ein Fehler, den man erst bei Spalte 27 (`AA`)
 * bemerkt.
 */
export type CellAddress = string;

/** Ein Bereich: `A1:C10`. Auch `A:A` und `1:1` sind gültig. */
export type RangeAddress = string;

/**
 * Zeile und Spalte als Zahlen, **null-basiert**.
 *
 * Das ist die interne Form für Rechnungen — Nachbarzelle, Bereich abfahren,
 * Abhängigkeiten. Sie ist bewusst null-basiert, während A1 bei eins anfängt:
 * `A1` ist `{ zeile: 0, spalte: 0 }`. Wer beides mischt, baut den
 * Standardfehler dieser Sorte Programm.
 */
export interface CellRef {
  zeile: number;
  spalte: number;
}

/* ===========================================================================
 * 2 · DER WERT EINER ZELLE
 * ========================================================================= */

/**
 * Was in einer Zelle stehen kann — nach dem Rechnen.
 *
 * Der Unterschied zu `FormulaValue` ist `FormulaErrorCode`: eine Zelle darf
 * `#DIV/0!` zeigen. Siehe Kopf dieser Datei.
 */
export type CellValue = FormulaValue | FormulaErrorCode;

/**
 * Wie eine Zahl angezeigt wird. Der Wert bleibt davon unberührt.
 *
 * Das ist die Trennung, an der Tabellenprogramme scheitern, wenn sie sie
 * nicht machen: `1,5` mit null Nachkommastellen zeigt `2`, ist aber weiter
 * `1,5`. Wer das Format in den Wert schreibt, verliert beim ersten
 * Weiterrechnen Genauigkeit — und niemand sieht, wo.
 */
export interface NumberFormat {
  art: 'standard' | 'zahl' | 'waehrung' | 'prozent' | 'datum' | 'zeit' | 'text';
  /** Nachkommastellen. */
  stellen?: number;
  /** Tausendertrennzeichen zeigen. */
  tausender?: boolean;
  /** Bei `waehrung`: `CHF`, `EUR`, … */
  waehrung?: string;
  /** Bei `datum`/`zeit`: `DD.MM.YYYY`, `HH:mm`. */
  muster?: string;
}

/** Aussehen einer Zelle. Alles freiwillig — eine leere Zelle hat nichts davon. */
export interface CellStyle {
  fett?: boolean;
  kursiv?: boolean;
  unterstrichen?: boolean;
  durchgestrichen?: boolean;
  /** Farbnamen aus `Register`, nicht rohe Hexwerte — sonst bricht der Themawechsel. */
  farbe?: string;
  hintergrund?: string;
  ausrichtung?: 'links' | 'mitte' | 'rechts';
  vertikal?: 'oben' | 'mitte' | 'unten';
  umbruch?: boolean;
  format?: NumberFormat;
}

/**
 * Eine Zelle.
 *
 * `formel` und `wert` stehen **beide** da, und das ist Absicht: `wert` ist
 * das zuletzt gerechnete Ergebnis. Ohne es müsste beim Öffnen einer Tabelle
 * alles neu gerechnet werden, bevor irgendetwas zu sehen ist — und beim
 * Einlesen einer fremden Datei stünde nichts da, solange eine Funktion fehlt.
 *
 * Dieselbe Überlegung wie bei den vorberechneten Werten in den Datenbanken:
 * gespeichert wird, was zu sehen war; gerechnet wird, sobald es geht.
 */
export interface Cell {
  /** Was der Mensch getippt hat, wenn es eine Formel war: `=SUMME(A1:A3)`. */
  formel?: FormulaText;
  /** Das Ergebnis — oder der eingegebene Wert, wenn es keine Formel gab. */
  wert: CellValue;
  stil?: CellStyle;
  /** Ein Kommentar am Rand, wie in Excel. */
  notiz?: string;
}

/* ===========================================================================
 * 3 · BLATT UND MAPPE
 * ========================================================================= */

/**
 * Ein Tabellenblatt.
 *
 * WARUM DIE ZELLEN IN EINEM OBJEKT LIEGEN UND NICHT IN EINEM RASTER. Ein
 * Raster mit 1000 × 26 Feldern kostet 26 000 Einträge, auch wenn drei davon
 * gefüllt sind — und es landet in dieser Grösse in der Sicherung, im
 * Abgleich und im Arbeitsspeicher jedes Geräts. Ein Objekt nach Adresse
 * kostet, was wirklich dasteht.
 */
export interface Sheet {
  id: SheetId;
  name: string;
  /** Nach Adresse: `{ 'A1': { wert: 5 }, 'B1': { formel: '=A1*2', wert: 10 } }`. */
  zellen: Record<CellAddress, Cell>;
  /** Sichtbare Grösse. Wächst mit dem Inhalt, ist keine harte Grenze. */
  zeilen: number;
  spalten: number;
  /** Abweichende Spaltenbreiten und Zeilenhöhen — nur wo abweichend. */
  spaltenBreite?: Record<string, number>;
  zeilenHoehe?: Record<string, number>;
  /** Wie viele Zeilen/Spalten beim Scrollen stehen bleiben. */
  fixierteZeilen?: number;
  fixierteSpalten?: number;
  versteckt?: boolean;
  /** Bedingte Formatierung — siehe `FormatRule`. */
  regeln?: FormatRule[];
}

/* ---------------------------------------------------------------------------
 * BEDINGTE FORMATIERUNG
 * ---------------------------------------------------------------------------
 * Eine Regel gehört dem BLATT, nicht der Zelle. Der Unterschied ist nicht
 * kosmetisch: eine Farbe an der Zelle müsste bei jeder Änderung mitgeführt,
 * beim Einfügen einer Zeile verschoben und beim Löschen aufgeräumt werden.
 * Eine Regel am Blatt beschreibt stattdessen, WANN gefärbt wird, und
 * überlebt jede Umstellung der Daten darunter.
 *
 * Und sie ändert die Daten nicht. Was `wert` sagt, bleibt, was es war —
 * eine bedingte Farbe ist eine Sicht darauf, keine Bearbeitung. Deshalb
 * kann man sie auch abschalten, ohne etwas zurückzunehmen.
 * ------------------------------------------------------------------------*/

/** Was eine Regel prüft. */
export type FormatRuleKind =
  | 'groesser' | 'kleiner' | 'gleich' | 'zwischen'
  | 'enthaelt' | 'leer' | 'nichtLeer'
  | 'doppelt'          /* derselbe Wert kommt im Bereich mehrfach vor */
  | 'skala'            /* Farbverlauf zwischen kleinstem und grösstem Wert */
  | 'balken';          /* Balken im Hintergrund, Länge nach Wert */

export interface FormatRule {
  /** Wo sie gilt: `A1:C20`. Leer heisst: das ganze Blatt. */
  bereich: string;
  art: FormatRuleKind;
  /** Vergleichswert. Bei `zwischen` die untere Grenze. */
  wert?: string | number;
  /** Nur bei `zwischen`: die obere Grenze. */
  wert2?: string | number;
  /** Farbmarke — `rot`, `gruen`, `gelb`, `blau`, `orange`. Nicht bei skala/balken. */
  farbe?: string;
  /** Abgeschaltet, ohne sie zu löschen. */
  an?: boolean;
}

/** Eine Mappe: mehrere Blätter, wie eine Excel-Datei. */
export interface Workbook {
  id: WorkbookId;
  name: string;
  blaetter: Sheet[];
  /** Welches Blatt zuletzt offen war. */
  aktiv?: SheetId;
  erstellt: ISODateTime;
  geaendert: ISODateTime;
}

/* ===========================================================================
 * 4 · DER BLOCK
 * ---------------------------------------------------------------------------
 * Was unter `RedionBlock.data` liegt, wenn `type === 'spreadsheet'`.
 * ========================================================================= */

export interface SpreadsheetBlockData {
  mappe: Workbook;
  /** Höhe im Editor, in Pixeln. */
  hoehe?: number;
  /** Zeilen- und Spaltenköpfe zeigen. */
  koepfe?: boolean;
  /** Gitternetz zeigen. */
  gitter?: boolean;
}

/** Wie eine Datenbank als Tabelle bedient wird — die zweite Bauform. */
export interface SpreadsheetViewConfig {
  /** Kopieren und Einfügen über mehrere Zellen. */
  massenbearbeitung: boolean;
  /** Tab und Enter wandern wie in Excel. */
  tastaturNavigation: boolean;
  /** Wie viele Spalten links stehen bleiben. */
  fixierteSpalten: number;
  /** Formeln statt Ergebnisse zeigen. */
  formelnZeigen: boolean;
}

/* ===========================================================================
 * 5 · RECHNEN
 * ---------------------------------------------------------------------------
 * Der Abhängigkeitsgraph ist der Kern eines Tabellenprogramms, und der
 * Zirkelbezug ist sein Grenzfall. Beides gehört in die Typen, damit es beim
 * Bauen nicht vergessen wird: eine Tabelle, die bei `A1 → B1 → A1` hängt,
 * friert den ganzen Tab ein.
 * ========================================================================= */

/** Welche Zelle hängt von welcher ab. */
export interface DependencyGraph {
  /** Adresse → Adressen, die sie liest. */
  liest: Record<CellAddress, CellAddress[]>;
  /** Adresse → Adressen, die sie lesen. Die Gegenrichtung, fürs Neurechnen. */
  gelesenVon: Record<CellAddress, CellAddress[]>;
}

/** Was beim Neurechnen herauskam. */
export interface RecalculationResult {
  /** Adressen, deren Wert sich geändert hat. */
  geaendert: CellAddress[];
  /**
   * Zellen in einem Zirkelbezug.
   *
   * Sie bekommen `#BEZUG!` und werden nicht weiter gerechnet. Wichtig ist
   * die Liste selbst: sie sagt dem Menschen, **welche** Zellen im Kreis
   * liegen — „irgendwo ist ein Zirkelbezug" ist keine Hilfe.
   */
  zirkel: CellAddress[];
  /** Wie lange es gedauert hat, in Millisekunden. */
  dauer: number;
}

/** Ein Verweis auf eine Zelle in einem anderen Block — für später. */
export interface CrossBlockRef {
  block: BlockId;
  blatt: SheetId;
  zelle: CellAddress;
}
