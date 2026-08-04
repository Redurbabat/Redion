/* ============================================================================
 * src/core/types/backup.ts — was in einer Sicherung steht
 * ----------------------------------------------------------------------------
 * Die wichtigste Datei dieses Ordners. Alles andere beschreibt Daten im
 * Betrieb; hier steht, was übrig bleibt, wenn das Gerät nicht mehr da ist.
 *
 * DIE FELDER `enthaelt`, `fehlt` UND `hinweis` SIND KEIN BEIWERK.
 * Eine Sicherung, die nicht sagt, was sie auslässt, ist die gefährlichste
 * Sorte — man merkt es erst, wenn man sie braucht. Eine JSON-Sicherung kann
 * keine Anhänge tragen: Blobs passen nicht in JSON. Sie ist deshalb nicht
 * kaputt, aber sie ist unvollständig, und das muss sie selbst sagen.
 * Vollständig wird sie erst als `.redion` (ein ZIP mit JSON und Anhängen).
 *
 * SPRACHE. Typnamen englisch (E27). Die Feldnamen stehen wörtlich so in
 * jeder bereits geschriebenen Sicherungsdatei — `enthaelt`, `fehlt`,
 * `hinweis`, `exportiert`, `zuordnung`, `saetze`. Sie umzubenennen würde
 * jede vorhandene Sicherung unlesbar machen. Sie bleiben deutsch.
 * ==========================================================================*/

import type { FileId, ISODateTime } from './id.js';
import type { RedionBlock, RedionVersion } from './block.js';
import type { RedionDatabase, RedionView } from './database.js';
import type { RedionFile } from './file.js';

/** Die Fächer, die eine Sicherung tragen kann. */
export type StoreName =
  | 'blocks'
  | 'collections'
  | 'views'
  | 'meta'
  | 'versions'
  | 'dateien'
  | 'stuecke';

/** Ein Eintrag aus dem Fach `meta`: Schlüssel und Wert. */
export interface MetaEntry {
  k: string;
  v: unknown;
}

/**
 * Der Kopf jeder Sicherung — das, was ein Einleser **nachsehen** kann,
 * statt zu raten.
 */
export interface RedionPackageManifest {
  /** Die Fassung des Formats, nicht die der App. */
  version: number;
  exportiert: ISODateTime;
  /** Welche Fächer wirklich drin sind. */
  enthaelt: StoreName[];
  /** Welche Fächer fehlen. Leer heisst vollständig. */
  fehlt: StoreName[];
  /** Ein Satz im Klartext für den Menschen, der die Datei ansieht. */
  hinweis: string;
}

/**
 * Eine vollständige Sicherung — der Inhalt von `daten.json`.
 *
 * Anhänge fehlen hier immer, wenn `fehlt` sie nennt — die Blöcke, die auf
 * sie zeigen, sind trotzdem enthalten. Beim Einspielen darf das kein
 * stiller Verlust werden: `hinweis` gehört dem Nutzer gezeigt.
 */
export interface RedionPackageData extends RedionPackageManifest {
  blocks: RedionBlock[];
  collections: RedionDatabase[];
  views: RedionView[];
  meta: MetaEntry[];
  versions: RedionVersion[];
}

/* ---------------------------------------------------------------------------
 * Das `.redion`-Paket
 * -------------------------------------------------------------------------*/

/**
 * `dateien.json` im `.redion` — die Zuordnung Archivname → Datei-Kennung.
 *
 * WARUM DIESE KARTE ÜBERHAUPT DA IST. Die Anhänge liegen im Archiv unter
 * ihren **echten** Namen, damit sie in zehn Jahren mit irgendeinem
 * Packprogramm zu öffnen sind, ganz ohne Redion. Der Preis dafür: zwei Bilder
 * dürfen „foto.jpg" heissen, im ZIP aber nicht — eins wird umbenannt. Ohne
 * diese Karte wüsste beim Einspielen niemand mehr, welcher Block welches Bild
 * meint.
 */
export interface RedionFileMap {
  version: number;
  /** Die Kopfsätze aller Anhänge. Die Stücke stecken im Archiv, nicht hier. */
  saetze: RedionFile[];
  /** Archivname (`'dateien/foto-2.jpg'`) → Kennung der Datei. */
  zuordnung: Record<string, FileId>;
}

/**
 * Ein `.redion` — ein gewöhnliches ZIP mit fester Aufteilung.
 *
 * ```txt
 * daten.json      die vollständige Sicherung
 * dateien.json    die Zuordnung
 * dateien/…       die Anhänge, unter ihren echten Namen
 * ```
 *
 * Dieser Typ beschreibt das Paket, er hält es nicht: ein Archiv mit einem
 * 500-MB-Video kommt nie ganz in den Arbeitsspeicher. Gelesen und geschrieben
 * wird scheibchenweise.
 */
export interface RedionPackage {
  daten: RedionPackageData;
  dateien: RedionFileMap;
}

/**
 * Was beim Einspielen mit vorhandenen Daten geschieht. Genau zwei Werte —
 * abgelesen aus `importAll` in `quell/kern/ablage/indexdb.js:1115`.
 *
 * `'ersetzen'` wirft weg, was nicht in der Sicherung steht.
 * `'zusammenfuehren'` löscht nichts; bei gleicher Kennung gewinnt die
 * Sicherung.
 *
 * **Es gibt bewusst keine Vorgabe.** `importAll` lehnt jeden anderen Wert ab,
 * auch einen leeren — ohne Angabe geschieht nichts. Das ist die Regel „nichts
 * löschen ohne Rückfrage" an der Stelle, an der sie am meisten zählt: eine
 * Vorgabe würde irgendwann durchrutschen, und beim Einspielen einer Sicherung
 * ist „irgendwann" einmal zu viel.
 *
 * Die Werte sind deutsch, weil `importAll` sie so entgegennimmt.
 */
export type ImportMode = 'ersetzen' | 'zusammenfuehren';

/**
 * Was `importAll` zurückgibt — abgelesen aus
 * `quell/kern/ablage/indexdb.js:1173`.
 *
 * `bloecke` ist die Zahl **nach** dem Einspielen, nicht die Zahl der
 * eingespielten. Bei `'zusammenfuehren'` steht dort also die Summe aus altem
 * und neuem Bestand. Das ist nicht schön, aber es ist die Zahl, die der
 * Nutzer danach in der Seitenleiste zählen kann — und eine Meldung, die sich
 * nicht nachzählen lässt, ist schlimmer als eine unschöne.
 */
export interface ImportReport {
  bloecke: number;
  versionen: number;
  /** Was die Sicherung selbst als fehlend angibt — meist die Anhänge. */
  fehlt: StoreName[];
}
