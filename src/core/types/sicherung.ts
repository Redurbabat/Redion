/* ============================================================================
 * src/core/types/sicherung.ts — was in einer Sicherung steht
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
 * ==========================================================================*/

import type { FileId, ISODateTime } from './basis.js';
import type { Block, Fassung } from './block.js';
import type { Ansicht, Sammlung } from './datenbank.js';
import type { Datei } from './datei.js';

/** Die Fächer, die eine Sicherung tragen kann. */
export type Fach =
  | 'blocks'
  | 'collections'
  | 'views'
  | 'meta'
  | 'versions'
  | 'dateien'
  | 'stuecke';

/** Ein Eintrag aus dem Fach `meta`: Schlüssel und Wert. */
export interface MetaSatz {
  k: string;
  v: unknown;
}

/**
 * Der Kopf jeder Sicherung — das, was ein Einleser **nachsehen** kann,
 * statt zu raten.
 */
export interface Sicherungskopf {
  /** Die Fassung des Formats, nicht die der App. */
  version: number;
  exportiert: ISODateTime;
  /** Welche Fächer wirklich drin sind. */
  enthaelt: Fach[];
  /** Welche Fächer fehlen. Leer heisst vollständig. */
  fehlt: Fach[];
  /** Ein Satz im Klartext für den Menschen, der die Datei ansieht. */
  hinweis: string;
}

/**
 * Eine JSON-Sicherung.
 *
 * Anhänge fehlen hier immer, wenn `fehlt` sie nennt — die Blöcke, die auf
 * sie zeigen, sind trotzdem enthalten. Beim Einspielen darf das kein
 * stiller Verlust werden: `hinweis` gehört dem Nutzer gezeigt.
 */
export interface Sicherung extends Sicherungskopf {
  blocks: Block[];
  collections: Sammlung[];
  views: Ansicht[];
  meta: MetaSatz[];
  versions: Fassung[];
}

/**
 * Was beim Einspielen mit vorhandenen Daten geschieht.
 *
 * `'vergleichen'` ist die Vorgabe und die einzige Wahl, die ohne Rückfrage
 * getroffen werden darf: nichts überschreiben, ohne vorher zu vergleichen.
 * `'ersetzen'` wirft weg, was da ist — das verlangt eine ausdrückliche
 * Zustimmung, jedes Mal.
 */
export type Einspielart = 'vergleichen' | 'ergaenzen' | 'ersetzen';

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
export interface Dateienkarte {
  version: number;
  /** Die Kopfsätze aller Anhänge. Die Stücke stecken im Archiv, nicht hier. */
  saetze: Datei[];
  /** Archivname (`'dateien/foto-2.jpg'`) → Kennung der Datei. */
  zuordnung: Record<string, FileId>;
}

/**
 * Ein `.redion` — ein gewöhnliches ZIP mit fester Aufteilung.
 *
 * ```txt
 * daten.json      die vollständige Sicherung (siehe `Sicherung`)
 * dateien.json    die Zuordnung (siehe `Dateienkarte`)
 * dateien/…       die Anhänge, unter ihren echten Namen
 * ```
 *
 * Dieser Typ beschreibt das Paket, er hält es nicht: ein Archiv mit einem
 * 500-MB-Video kommt nie ganz in den Arbeitsspeicher. Gelesen und geschrieben
 * wird scheibchenweise.
 */
export interface RedionPaket {
  daten: Sicherung;
  dateien: Dateienkarte;
}

/** Was ein Einspielvorgang berichtet, bevor und nachdem er gelaufen ist. */
export interface Einspielbericht {
  neu: number;
  geaendert: number;
  unveraendert: number;
  /** Sätze, die nur lokal existieren und von der Sicherung nicht berührt werden. */
  nurHier: number;
  /** Fächer, die in der Sicherung fehlen und deshalb unangetastet bleiben. */
  ausgelassen: Fach[];
}
