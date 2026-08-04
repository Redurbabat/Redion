/* ============================================================================
 * src/core/types/datei.ts — Anhänge und ihre Stücke
 * ----------------------------------------------------------------------------
 * Eine Datei liegt nicht am Stück in der Ablage. Sie wird in Stücke zerlegt
 * (`quell/bereiche/dateien/ablage.js`), weil ein einzelner grosser Blob drei
 * Nachteile hat: der Upload beginnt von vorn, wenn er abbricht; der Fortschritt
 * ist nicht anzeigbar; und der Speicher muss die ganze Datei auf einmal
 * fassen.
 *
 * WARUM DAS HIER STEHT. Anhänge sind der Teil von Redion, bei dem ein Fehler
 * am unauffälligsten ist: die Blöcke sind alle da, die Sicherung sieht
 * vollständig aus — und die Bilder fehlen. Genau dafür trägt die Sicherung
 * das Feld `fehlt` (siehe `sicherung.ts`).
 * ==========================================================================*/

import type { BlockId, FileId, ISODateTime } from './basis.js';

/**
 * Wie weit ein Upload ist.
 *
 * `'wartet'` heisst: angelegt, noch kein Stück da. `'laeuft'` heisst:
 * mindestens ein Stück angekommen, aber nicht alle. `'fertig'` heisst: alle
 * Stücke liegen in der Ablage — und erst dann darf die Datei als Anhang
 * gelten.
 */
export type Uploadzustand = 'wartet' | 'laeuft' | 'fertig';

/** Der Kopfsatz einer Datei. Die Nutzdaten stehen in den Stücken. */
export interface Datei {
  id: FileId;
  name: string;
  /** Grösse in Bytes, wie sie der Browser gemeldet hat. */
  groesse: number;
  /** Der MIME-Typ, etwa `'image/png'`. Leer, wenn der Browser keinen kennt. */
  typ: string;
  /** Der Block, der diese Datei zeigt. `null`, solange keiner sie führt. */
  blockId: BlockId | null;
  /** In wie viele Stücke die Datei zerlegt wurde. Immer mindestens 1. */
  teile: number;
  /** Wie viele Stücke angekommen sind. Fertig ist erst `angekommen === teile`. */
  angekommen: number;
  zustand: Uploadzustand;
  angelegt: ISODateTime;
  /** Wann der Upload abgeschlossen wurde. `null`, solange er läuft. */
  fertigAm: ISODateTime | null;
}

/**
 * Ein Stück einer Datei.
 *
 * Die Kennung ist zusammengesetzt: `dateiId + ':' + nr`. Das ist kein
 * Schönheitsfehler, sondern Absicht — so lassen sich alle Stücke einer Datei
 * über einen Schlüsselbereich finden, ohne einen zweiten Index zu führen.
 */
export interface Stueck {
  /** `${dateiId}:${nr}` */
  id: string;
  dateiId: FileId;
  /** Die laufende Nummer, bei 0 beginnend. */
  nr: number;
  blob: Blob;
}
