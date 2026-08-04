/* ============================================================================
 * src/core/types/basis.ts — die Kennungen und der Ergebnistyp
 * ----------------------------------------------------------------------------
 * Die kleinsten Bausteine. Alles Weitere hängt daran.
 *
 * WARUM EIGENE NAMEN FÜR ZEICHENKETTEN. `BlockId` und `FileId` sind beide
 * `string` — der Unterschied kostet zur Laufzeit nichts und beim Lesen
 * alles. Eine Datei-Kennung dort einzusetzen, wo eine Block-Kennung
 * hingehört, ist genau der Fehler, der in dieser App am schwersten zu finden
 * war: die Bilder waren da, und kein Block fand sie.
 *
 * Sie sind bewusst **nicht** als „branded types" gebaut. Das wäre strenger,
 * verlangt aber an jeder Grenze eine Umwandlung — und der bestehende Code
 * unter `quell/` reicht rohe Zeichenketten herein. Ein Typ, den man ständig
 * umgehen muss, wird umgangen.
 * ==========================================================================*/

/** Eine Kennung, wie `Kennungen.lang()` sie erzeugt. */
export type ID = string;

/** Ein Zeitpunkt als ISO-Zeichenkette, so wie `Store.now()` ihn schreibt. */
export type ISODateTime = string;

export type BlockId = ID;
export type PageId = ID;
export type CollectionId = ID;
export type ViewId = ID;
export type FileId = ID;

/**
 * Ein Ergebnis, das auch scheitern darf — ohne zu werfen.
 *
 * WOFÜR ES DA IST. Eine Ausnahme ist richtig, wenn etwas passiert, mit dem
 * niemand gerechnet hat. Für alles, womit man rechnet — die Datei ist zu
 * gross, das Archiv ist keins, das Passwort stimmt nicht —, ist sie das
 * falsche Werkzeug: sie zwingt jeden Aufrufer zu `try`, und wer es vergisst,
 * merkt es erst im Betrieb.
 *
 * `CLAUDE.md` §52.12 nennt genau das: lieber
 * `{ ok: false, fehler: 'Die Datei ist grösser als 4 GB.' }` als ein
 * geworfener Fehler, den niemand liest.
 *
 * @example
 * const e = await sicherungSchreiben();
 * if (!e.ok) { UI.toast(e.fehler); return; }
 * laden(e.wert);
 */
export type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string; code?: string };

/** Kurz für den häufigen Fall „hat geklappt, es gibt nichts zurückzugeben". */
export type Erledigt = Ergebnis<void>;

export const gelungen = <T>(wert: T): Ergebnis<T> => ({ ok: true, wert });

export const gescheitert = <T>(fehler: string, code?: string): Ergebnis<T> =>
  code === undefined ? { ok: false, fehler } : { ok: false, fehler, code };
