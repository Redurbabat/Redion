/* ============================================================================
 * register/befehle.js — die Befehlspalette
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

window.Register = window.Register || {};

Register.befehle = (() => {

  /* Lieferanten: Funktionen, die eine Liste von Befehlen zurückgeben.
     Sie werden bei jedem Öffnen gefragt — die Palette hängt vom
     Augenblick ab: welche Seite offen ist, ob ein Konto da ist. */
  const lieferanten = [];
  const feste = [];

  /** Einen Lieferanten anmelden. Wird bei jedem Öffnen gefragt. */
  const meldeLieferant = (fn) => {
    if (typeof fn !== 'function' || lieferanten.includes(fn)) return false;
    lieferanten.push(fn);
    return true;
  };

  /** Einen einzelnen Befehl anmelden. */
  const melde = (befehl) => {
    if (!befehl || !befehl.titel || typeof befehl.tun !== 'function') return false;
    feste.push(befehl);
    return true;
  };

  const nimmZurueck = (titel) => {
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
  const alle = () => {
    const raus = [...feste];
    lieferanten.forEach(fn => {
      try {
        const teil = fn();
        if (Array.isArray(teil)) raus.push(...teil);
      } catch (e) {
        if (typeof Melder !== 'undefined')
          Melder.warnung('Register/befehle', 'Ein Lieferant hat versagt: ' + e.message, e);
      }
    });
    return raus.filter(b => !b.zeigen || (() => {
      try { return !!b.zeigen(); } catch { return false; } })());
  };

  const gruppen = () => [...new Set(alle().map(b => b.gruppe || 'Weiteres'))];

  const suche = (text) => {
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
