/* ============================================================================
 * src/core/types/id.ts — die Kennungen und der Ergebnistyp
 * ----------------------------------------------------------------------------
 * Die kleinsten Bausteine. Alles Weitere hängt daran.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27.
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

/** Eine Kennung, wie `Ids.long()` sie erzeugt. */
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
 * `{ ok: false, error: 'Die Datei ist grösser als 4 GB.' }` als ein
 * geworfener Fehler, den niemand liest.
 *
 * Die **Meldung** in `error` ist deutsch — sie geht an einen Menschen.
 *
 * @example
 * const r = await writeBackup();
 * if (!r.ok) { UI.toast(r.error); return; }
 * load(r.value);
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code?: string };

/** Kurz für den häufigen Fall „hat geklappt, es gibt nichts zurückzugeben". */
export type Done = Result<void>;

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T>(error: string, code?: string): Result<T> =>
  code === undefined ? { ok: false, error } : { ok: false, error, code };
