/* ============================================================================
 * kern/helfer/bremse.js — nicht bei jedem Tastendruck alles neu machen
 * ----------------------------------------------------------------------------
 * Vier Bremsen, und der Unterschied zwischen ihnen ist der Punkt. Wer die
 * falsche nimmt, bekommt entweder eine hakende Oberfläche oder verlorene
 * Eingaben:
 *
 *   nachlauf(fn, ms)   wartet, bis Ruhe ist. Beim Tippen speichern.
 *   takt(fn, ms)       lässt höchstens alle ms durch. Beim Scrollen zeichnen.
 *   naechstesBild(fn)  einmal pro Bild. Beim Ziehen mit der Maus.
 *   einmal(fn)         genau einmal, danach das gemerkte Ergebnis.
 *
 * Jede Bremse hier hat ein `sofort()` — und das ist kein Beiwerk. Eine
 * Bremse ohne Notausgang verliert die letzte Eingabe, wenn das Fenster
 * geschlossen wird, und genau die ist die wichtigste.
 * ==========================================================================*/

const Bremse = (() => {

  /**
   * Wartet, bis `ms` lang nichts mehr kam. Klassisch fürs Speichern
   * während des Tippens: nicht bei jedem Buchstaben, aber sicher am Ende.
   *
   * @returns {Function} mit .sofort() und .abbrechen()
   */
  const nachlauf = (fn, ms = 300) => {
    let uhr = null, letzte = null;
    const g = (...a) => { letzte = a; clearTimeout(uhr);
      uhr = setTimeout(() => { uhr = null; const x = letzte; letzte = null; fn(...x); }, ms); };
    g.sofort = () => { if (!uhr) return; clearTimeout(uhr); uhr = null;
      const x = letzte; letzte = null; if (x) fn(...x); };
    g.abbrechen = () => { clearTimeout(uhr); uhr = null; letzte = null; };
    g.wartet = () => uhr !== null;
    return g;
  };

  /**
   * Lässt höchstens alle `ms` einen Aufruf durch — den ersten sofort, und
   * am Ende noch den letzten. Ohne den letzten fehlt beim Scrollen genau
   * das Bild, das man sehen will: das nach dem Loslassen.
   */
  const takt = (fn, ms = 100) => {
    let zuletzt = 0, uhr = null, letzte = null;
    const g = (...a) => {
      const jetzt = Date.now();
      letzte = a;
      if (jetzt - zuletzt >= ms) { zuletzt = jetzt; fn(...a); letzte = null; return; }
      if (uhr) return;
      uhr = setTimeout(() => { uhr = null; zuletzt = Date.now();
        if (letzte) { fn(...letzte); letzte = null; } }, ms - (jetzt - zuletzt));
    };
    g.abbrechen = () => { clearTimeout(uhr); uhr = null; letzte = null; };
    return g;
  };

  /** Höchstens einmal je Bild — für alles, was während einer Mausbewegung zeichnet. */
  const naechstesBild = (fn) => {
    let angemeldet = false, letzte = null;
    const g = (...a) => {
      letzte = a;
      if (angemeldet) return;
      angemeldet = true;
      requestAnimationFrame(() => { angemeldet = false; fn(...letzte); });
    };
    return g;
  };

  /** Genau einmal ausführen, danach immer dasselbe Ergebnis zurückgeben. */
  const einmal = (fn) => {
    let gelaufen = false, wert;
    return (...a) => { if (!gelaufen) { gelaufen = true; wert = fn(...a); } return wert; };
  };

  /**
   * Gleiche Eingabe, gleiches Ergebnis — ohne zweimal zu rechnen.
   * Mit Grenze, sonst wächst der Speicher, bis der Tab steht.
   */
  const gemerkt = (fn, grenze = 500) => {
    const karte = new Map();
    const g = (...a) => {
      const k = JSON.stringify(a);
      if (karte.has(k)) return karte.get(k);
      const w = fn(...a);
      if (karte.size >= grenze) karte.delete(karte.keys().next().value);
      karte.set(k, w);
      return w;
    };
    g.leeren = () => karte.clear();
    g.groesse = () => karte.size;
    return g;
  };

  /** Erst nach `ms` ausführen, aber nur wenn niemand vorher abbricht. */
  const spaeter = (fn, ms) => {
    const uhr = setTimeout(fn, ms);
    return () => clearTimeout(uhr);
  };

  return { nachlauf, takt, naechstesBild, einmal, gemerkt, spaeter };
})();

window.Bremse = Bremse;
