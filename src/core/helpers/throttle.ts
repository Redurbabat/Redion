/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/throttle.ts (npm run bauen:ts). */
/* ============================================================================
 * core/helpers/throttle.ts — nicht bei jedem Tastendruck alles neu machen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/throttle.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/throttle.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Vier Bremsen, und der Unterschied zwischen ihnen ist der Punkt. Wer die
 * falsche nimmt, bekommt entweder eine hakende Oberfläche oder verlorene
 * Eingaben:
 *
 *   debounce(fn, ms)   wartet, bis Ruhe ist. Beim Tippen speichern.
 *   throttle(fn, ms)   lässt höchstens alle ms durch. Beim Scrollen zeichnen.
 *   nextFrame(fn)      einmal pro Bild. Beim Ziehen mit der Maus.
 *   once(fn)           genau einmal, danach das gemerkte Ergebnis.
 *
 * Jede Bremse hier hat ein `flush()` — und das ist kein Beiwerk. Eine
 * Bremse ohne Notausgang verliert die letzte Eingabe, wenn das Fenster
 * geschlossen wird, und genau die ist die wichtigste.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Aus
 * `Bremse` wurde `Throttle`. Gemessen **null** Aufrufe in `quell/` und fünf
 * in `test85.mjs`: der billigste Umzug der ganzen Phase.
 *
 *   nachlauf → debounce      takt → throttle      naechstesBild → nextFrame
 *   einmal → once            gemerkt → memoize    spaeter → later
 *   .sofort() → .flush()     .abbrechen() → .cancel()
 *   .wartet() → .pending()   .leeren() → .clear()   .groesse() → .size()
 *
 * `Throttle.throttle()` liest sich doppelt, und das ist Absicht. Der
 * Dateiname und der globale Name gehören zusammen — wer `Throttle` sucht,
 * findet `throttle.ts`, so wie `Ids` in `ids.ts` steht. Ein schöner
 * Modulname, der zu keiner Datei passt, kostet bei jedem Suchen mehr, als
 * die Wiederholung an dieser einen Stelle stört.
 * ==========================================================================*/

/** Eine gebremste Funktion. Was sie zusätzlich kann, steht je Bremse dabei. */
type Braked = ((...a: any[]) => void) & {
  flush?: () => void;
  cancel?: () => void;
  pending?: () => boolean;
};

const Throttle = (() => {

  /**
   * Wartet, bis `ms` lang nichts mehr kam. Klassisch fürs Speichern
   * während des Tippens: nicht bei jedem Buchstaben, aber sicher am Ende.
   *
   * `flush()` führt einen wartenden Aufruf sofort aus — der Notausgang beim
   * Schliessen des Fensters. `cancel()` wirft ihn weg.
   */
  const debounce = (fn: (...a: any[]) => any, ms = 300): Braked => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let last: any[] | null = null;
    const g: Braked = (...a: any[]) => { last = a; if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; const x = last; last = null; fn(...(x as any[])); }, ms); };
    g.flush = () => { if (!timer) return; clearTimeout(timer); timer = null;
      const x = last; last = null; if (x) fn(...x); };
    g.cancel = () => { if (timer) clearTimeout(timer); timer = null; last = null; };
    g.pending = () => timer !== null;
    return g;
  };

  /**
   * Lässt höchstens alle `ms` einen Aufruf durch — den ersten sofort, und
   * am Ende noch den letzten. Ohne den letzten fehlt beim Scrollen genau
   * das Bild, das man sehen will: das nach dem Loslassen.
   */
  const throttle = (fn: (...a: any[]) => any, ms = 100): Braked => {
    let lastRun = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let last: any[] | null = null;
    const g: Braked = (...a: any[]) => {
      const now = Date.now();
      last = a;
      if (now - lastRun >= ms) { lastRun = now; fn(...a); last = null; return; }
      if (timer) return;
      timer = setTimeout(() => { timer = null; lastRun = Date.now();
        if (last) { fn(...last); last = null; } }, ms - (now - lastRun));
    };
    g.cancel = () => { if (timer) clearTimeout(timer); timer = null; last = null; };
    return g;
  };

  /** Höchstens einmal je Bild — für alles, was während einer Mausbewegung zeichnet. */
  const nextFrame = (fn: (...a: any[]) => any): Braked => {
    let queued = false;
    let last: any[] = [];
    const g: Braked = (...a: any[]) => {
      last = a;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; fn(...last); });
    };
    return g;
  };

  /** Genau einmal ausführen, danach immer dasselbe Ergebnis zurückgeben. */
  const once = (fn: (...a: any[]) => any) => {
    let ran = false;
    let value: any;
    return (...a: any[]): any => { if (!ran) { ran = true; value = fn(...a); } return value; };
  };

  /**
   * Gleiche Eingabe, gleiches Ergebnis — ohne zweimal zu rechnen.
   * Mit Grenze, sonst wächst der Speicher, bis der Tab steht.
   */
  const memoize = (fn: (...a: any[]) => any, limit = 500) => {
    const map = new Map<string, any>();
    const g = (...a: any[]): any => {
      const k = JSON.stringify(a);
      if (map.has(k)) return map.get(k);
      const w = fn(...a);
      if (map.size >= limit) map.delete(map.keys().next().value as string);
      map.set(k, w);
      return w;
    };
    g.clear = () => map.clear();
    g.size = () => map.size;
    return g;
  };

  /** Erst nach `ms` ausführen, aber nur wenn niemand vorher abbricht. */
  const later = (fn: () => void, ms: number): (() => void) => {
    const timer = setTimeout(fn, ms);
    return () => clearTimeout(timer);
  };

  return { debounce, throttle, nextFrame, once, memoize, later };
})();

(window as any).Throttle = Throttle;
