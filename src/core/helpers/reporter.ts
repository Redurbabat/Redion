/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/reporter.ts (npm run bauen:ts). */
/* ============================================================================
 * core/helpers/reporter.ts — was schiefgeht, soll auffindbar sein
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/reporter.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/reporter.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * `console.log` ist bequem und genau einmal falsch: es ist weg, sobald das
 * Fenster zu ist. Wenn jemand sagt „gestern ging etwas nicht", steht nichts
 * mehr da.
 *
 * Deshalb sammelt der Melder alles im Speicher — und schreibt es nur dann in
 * die Konsole, wenn es wirklich zählt. Bei Bedarf lässt sich der Verlauf als
 * Datei ausgeben und einer Meldung beilegen.
 *
 * Vier Stufen. Der Unterschied ist nicht die Lautstärke, sondern die Frage,
 * ob jemand etwas tun muss:
 *
 *   spur     nur für die Fehlersuche, im Betrieb aus
 *   info     ist geschehen, niemand muss handeln
 *   warnung  ist schiefgegangen, die App hat sich selbst geholfen
 *   fehler   ist schiefgegangen, jemand muss hinsehen
 *
 * Bewusst kein Versand nach draussen. Ein Melder, der still Daten
 * verschickt, ist kein Melder, sondern eine Wanze.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Aus
 * `Melder` wurde `Reporter`. Gemessen siebzehn Aufrufe in zehn Dateien und
 * sechs in `test85.mjs` — mehr als bei `Kennungen` (fünfzehn), aber
 * derselben Grössenordnung und damit derselbe erlaubte Fall.
 *
 *   spur → trace        info → info          warnung → warn
 *   fehler → error      behuetet → guarded   misst → measure
 *   alles → all         zahlen → counts      alsText → toText
 *   leeren → clear      stufeSetzen → setLevel
 *   konsoleSetzen → setConsoleLevel
 *   stufe() → level()   konsole() → consoleLevel()
 *   STUFEN → LEVELS
 *
 * ─── ZWEI DINGE, DIE ABSICHTLICH DEUTSCH BLEIBEN ────────────────────────────
 *
 * **1 · Die Stufennamen selbst.** `'spur'`, `'info'`, `'warnung'`, `'fehler'`
 * sind keine Bezeichner, sondern Werte — `toText()` druckt sie, und was dort
 * herauskommt, liest ein Mensch. E27 stellt Namen um, nie Inhalte.
 *
 * **2 · Die Felder eines Eintrags** heissen weiter `stufe`, `wo`, `text`,
 * `daten`, `wann`. Sie sind die Form eines Datensatzes, den `all()` nach
 * aussen gibt; sie umzubenennen wäre eine Verhaltensänderung und keine
 * Namensfrage — genau die Grenze, die E27 als die wichtigere bezeichnet.
 * Wer den Verlauf später wirklich speichert, wird froh sein, dass die Form
 * beim Umzug nicht heimlich gewechselt hat.
 * ==========================================================================*/

/** Ein Eintrag im Verlauf. Deutsche Feldnamen mit Absicht — siehe oben. */
interface ReportEntry {
  stufe: string;
  wo: string;
  text: string;
  daten: unknown;
  wann: string;
}

const Reporter = (() => {

  const LEVELS = ['spur', 'info', 'warnung', 'fehler'];
  const MAX = 500;

  const history: ReportEntry[] = [];
  let level = 'info';           /* alles ab hier wird gesammelt */
  let consoleLevel = 'warnung'; /* alles ab hier steht auch in der Konsole */

  const rank = (s: string): number => LEVELS.indexOf(s);

  const stamp = (): string => new Date().toISOString();

  const write = (s: string, where: unknown, text: unknown, data?: unknown): ReportEntry | undefined => {
    if (rank(s) < rank(level)) return undefined;

    const entry: ReportEntry = { stufe: s, wo: String(where || ''), text: String(text || ''),
                                 daten: data, wann: stamp() };
    history.push(entry);
    if (history.length > MAX) history.shift();

    if (rank(s) >= rank(consoleLevel)) {
      const line = '[' + where + '] ' + text;
      if (s === 'fehler') console.error(line, data !== undefined ? data : '');
      else if (s === 'warnung') console.warn(line, data !== undefined ? data : '');
      else console.log(line, data !== undefined ? data : '');
    }

    /* Fehler wandern zusätzlich in die Fehlerliste der Bestandspflege —
       dort sucht ein Mensch, nicht in der Konsole. */
    if (s === 'fehler' && typeof Pflege !== 'undefined' && Pflege.fehlerMerken) {
      try { Pflege.fehlerMerken(new Error(String(text || '')), String(where || '')); } catch {}
    }
    return entry;
  };

  const trace = (where: unknown, text: unknown, data?: unknown) => write('spur', where, text, data);
  const info  = (where: unknown, text: unknown, data?: unknown) => write('info', where, text, data);
  const warn  = (where: unknown, text: unknown, data?: unknown) => write('warnung', where, text, data);
  const error = (where: unknown, text: unknown, data?: unknown) => write('fehler', where, text, data);

  /**
   * Eine Funktion einpacken: läuft sie auf einen Fehler, wird er gemeldet
   * statt geschluckt — und die App läuft weiter.
   */
  const guarded = (where: unknown, fn: (...a: any[]) => any, fallback: any = undefined) =>
    (...a: any[]): any => {
      try { return fn(...a); }
      catch (e: unknown) {
        const m = (e && typeof e === 'object' && 'message' in e) ? String((e as Error).message) : String(e);
        error(where, m, e);
        return fallback;
      }
    };

  /** Wie lange hat das gedauert? Wird als Spur gemeldet, nicht als Lärm. */
  const measure = (where: unknown, fn: () => any): any => {
    const t0 = performance.now();
    try { return fn(); }
    finally { trace(where, 'dauerte ' + Math.round(performance.now() - t0) + ' ms'); }
  };

  const all = (fromLevel?: string): ReportEntry[] => fromLevel
    ? history.filter(e => rank(e.stufe) >= rank(fromLevel))
    : history.slice();

  const counts = (): Record<string, number> => {
    const z: Record<string, number> = { spur: 0, info: 0, warnung: 0, fehler: 0 };
    history.forEach(e => { z[e.stufe] = (z[e.stufe] ?? 0) + 1; });
    return z;
  };

  const toText = (): string => history
    .map(e => e.wann + '  ' + e.stufe.padEnd(8) + '[' + e.wo + '] ' + e.text)
    .join('\n');

  const clear = (): void => { history.length = 0; };

  const setLevel = (s: string): string => { if (LEVELS.includes(s)) level = s; return level; };
  const setConsoleLevel = (s: string): string => {
    if (LEVELS.includes(s) || s === 'aus') consoleLevel = s; return consoleLevel; };

  return { LEVELS, trace, info, warn, error, guarded, measure,
           all, counts, toText, clear, setLevel, setConsoleLevel,
           level: () => level, consoleLevel: () => consoleLevel };
})();

(window as any).Reporter = Reporter;
