/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/befehle.ts (npm run bauen:ts). */
/* ============================================================================
 * register/befehle.js — die Befehlspalette
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/befehle.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/befehle.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Palette ist die Stelle, an der alles zu finden sein muss. Genau deshalb
 * darf sie nicht an einer Stelle gebaut werden, die jeder anfassen muss —
 * sonst wächst dort eine Datei, in der jeder Bereich ein bisschen mitschreibt.
 *
 * Hier fragt das Register: jeder, der Befehle beisteuern will, meldet einen
 * Lieferanten an. Die Palette ruft sie alle und legt zusammen, was kommt.
 *
 * Ein Befehl:
 *
 *     gruppe    'Seite' | 'Daten' | 'Ansicht' | 'Navigation' | …
 *     titel     was dasteht
 *     kurz      Tastenkürzel, falls es eines gibt
 *     tun()     was geschieht
 *     zeigen()  false = kommt gar nicht erst in die Liste
 *
 * `zeigen` verhindert die häufigste Enttäuschung überhaupt: ein Befehl, der
 * dasteht und dann sagt, dass er hier nicht geht.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.befehle = (() => {

  /**
   * Ein Befehl in der Palette.
   *
   * Pflicht sind `titel` und `tun` — `melde` weist alles ab, dem eines
   * fehlt. Alles andere ist freiwillig, und `[k: string]: any` ist die
   * Grenze zum alten Code (CLAUDE.md §52): Bereiche hängen eigene Felder an,
   * und was sie damit tun, wissen sie selbst.
   */
  type Befehl = {
    titel: string;
    tun: () => void;
    gruppe?: string;
    zeigen?: () => boolean;
    [k: string]: any;
  };
  type Lieferant = () => Befehl[];

  /* Lieferanten: Funktionen, die eine Liste von Befehlen zurückgeben.
     Sie werden bei jedem Öffnen gefragt — die Palette hängt vom
     Augenblick ab: welche Seite offen ist, ob ein Konto da ist. */
  const lieferanten: Lieferant[] = [];
  const feste: Befehl[] = [];

  /** Einen Lieferanten anmelden. Wird bei jedem Öffnen gefragt. */
  const meldeLieferant = (fn: unknown): boolean => {
    if (typeof fn !== 'function' || lieferanten.includes(fn as Lieferant)) return false;
    lieferanten.push(fn as Lieferant);
    return true;
  };

  /** Einen einzelnen Befehl anmelden. */
  const melde = (befehl: unknown): boolean => {
    const b = befehl as Befehl | null;
    if (!b || !b.titel || typeof b.tun !== 'function') return false;
    feste.push(b);
    return true;
  };

  const nimmZurueck = (titel: unknown): boolean => {
    const i = feste.findIndex(x => x.titel === titel);
    if (i < 0) return false;
    feste.splice(i, 1);
    return true;
  };

  /**
   * Alle Befehle für diesen Augenblick.
   * Ein Lieferant, der einen Fehler wirft, fällt weg — die Palette bleibt
   * offen. Eine Palette, die sich wegen eines Bereichs gar nicht öffnet,
   * nimmt einem den einzigen Weg, den Bereich abzuschalten.
   */
  const alle = (): Befehl[] => {
    const raus: Befehl[] = [...feste];
    lieferanten.forEach(fn => {
      try {
        const teil = fn();
        if (Array.isArray(teil)) raus.push(...teil);
      } catch (e) {
        const grund = e instanceof Error ? e.message : String(e);
        if (typeof Reporter !== 'undefined')
          Reporter.warn('Register/befehle', 'Ein Lieferant hat versagt: ' + grund, e);
      }
    });
    return raus.filter(b => !b.zeigen || (() => {
      try { return !!b.zeigen(); } catch { return false; } })());
  };

  const gruppen = (): string[] => [...new Set(alle().map(b => b.gruppe || 'Weiteres'))];

  const suche = (text: unknown): Befehl[] => {
    const t = String(text || '').toLowerCase().trim();
    const liste = alle();
    if (!t) return liste;
    /* Erst was vorne passt, dann was irgendwo passt — die beste Antwort
       soll oben stehen und nicht in der Mitte. */
    const vorn = liste.filter(b => (b.titel || '').toLowerCase().startsWith(t));
    const drin = liste.filter(b => !vorn.includes(b) &&
      ((b.titel || '').toLowerCase().includes(t) ||
       (b.gruppe || '').toLowerCase().includes(t)));
    return [...vorn, ...drin];
  };

  return { alle, gruppen, suche, melde, meldeLieferant, nimmZurueck,
           anzahl: () => alle().length,
           lieferanten: () => lieferanten.length };
})();
