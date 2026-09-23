/* E572: kleine Werkzeugfelder im obersten Browser-Layer. Kein Dokumentinhalt.
 * Die native Klappe übernimmt Escape und Aussenklick, auch im Vollbild.
 *
 * ══ E575: EIN FELD, DAS AUFGEHT, MUSS AUCH WIEDER ZUGEHEN ══════════════════
 * Der erste Stand kannte nur EINEN Weg nach draussen: den Helfer selbst.
 * Gemessen am 14. September, Fenster 1440 × 960: nach `App.oeffne()` einer
 * gewöhnlichen Textseite stand das Laserfeld immer noch offen — 380 × 54
 * Pixel bei 520/159, schwebend über fremdem Text, während
 * `.document-workspace` längst weg war. Der `resize`-Horcher lief weiter,
 * denn abgemeldet wird er nur im `toggle`-Ereignis, und das kommt nie, wenn
 * niemand schliesst.
 *
 * Der Grund ist einfach und deshalb leicht zu übersehen: das Panel hängt an
 * `document.body`, nicht am Studio. Wer die Fläche darunter wegräumt, räumt
 * das Panel nicht mit.
 *
 * Drei Dinge halten es jetzt:
 *   · Es beobachtet seinen ANKER. Verlässt der den Baum, geht das Feld zu —
 *     ganz gleich, wer ihn weggeräumt hat und ob dieser Weg daran gedacht hat.
 *   · `closeAll()` ist der ausdrückliche Weg für alle, die es wissen.
 *   · Aufräumen ist idempotent. `hidePopover()` löst `toggle` aus, das
 *     wieder aufräumen will — zweimal aufräumen darf nichts kosten.
 */
const InkMenu = (() => {
  /** Warum das Feld zugeht. Entscheidet, wer danach den Fokus hat. */
  type Grund = 'knopf' | 'escape' | 'aussen' | 'weg';
  let offen: { ende: (grund: Grund) => void } | null = null;

  /** Schliesst ein offenes Feld. `weg` heisst: die Umgebung ist fort. */
  const closeAll = (grund: Grund = 'weg'): void => {
    offen?.ende(grund);
    /* Nachzügler aus früheren Fassungen oder aus einem Baum, der unter einem
       Panel weggezogen wurde: sie tragen keine Rückmeldung mehr, also hart weg. */
    document.querySelectorAll<HTMLElement>('.blatt-popover').forEach(node => {
      try { node.hidePopover?.(); } catch { /* war nie offen */ }
      node.remove();
    });
  };

  const open = (anchor: HTMLElement, title: string, build: (body: HTMLElement, close: () => void) => void,
    onClose?: (reason: Grund) => void): void => {
    closeAll('weg');
    const panel = document.createElement('div');
    panel.className = 'blatt-popover';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', title);
    const heading = document.createElement('header');
    const label = document.createElement('strong'); label.textContent = title;
    const exit = document.createElement('button'); exit.type = 'button';
    exit.textContent = '×'; exit.setAttribute('aria-label', title + ' schließen');
    heading.append(label, exit); panel.append(heading);
    const body = document.createElement('div'); body.className = 'blatt-popover-body'; panel.append(body);

    /* ══ DIE NATIVE KLAPPE, WENN ES SIE GIBT ════════════════════════════════
       `popover` bringt die oberste Ebene, Escape und den Aussenklick mit —
       auch im Vollbild, wo ein selbstgebauter Kasten schlicht unsichtbar
       wäre. Wo es sie nicht gibt, baut der Zweig darunter dasselbe von Hand
       nach; er ist nicht Zierde, sondern wird in `test524` wirklich
       durchlaufen (die Prüfung nimmt `showPopover` weg). */
    const nativ = typeof panel.showPopover === 'function' && typeof panel.hidePopover === 'function';
    if (nativ) panel.setAttribute('popover', 'auto');
    else panel.classList.add('blatt-popover-ersatz');

    let fertig = false;
    let grund: Grund = 'aussen';
    const close = () => { grund = 'knopf'; ende('knopf'); };
    exit.onclick = close;
    build(body, close);

    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(380, window.innerWidth - 24);
      panel.style.width = width + 'px';
      panel.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2)) + 'px';
      const above = rect.top > window.innerHeight / 2;
      panel.style.top = above ? 'auto' : Math.max(12, Math.min(rect.bottom + 12, window.innerHeight - 150)) + 'px';
      panel.style.bottom = above ? Math.max(12, window.innerHeight - rect.top + 12) + 'px' : 'auto';
      panel.style.maxHeight = Math.max(100, (above ? rect.top : window.innerHeight - rect.bottom) - 24) + 'px';
    };

    /* Der Anker ist der Faden zum Studio. Reisst er, geht das Feld zu. */
    const wache = new MutationObserver(() => { if (!anchor.isConnected) ende('weg'); });

    const draussen = (event: Event) => {
      if (!panel.contains(event.target as Node) && event.target !== anchor) ende('aussen');
    };
    const taste = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); ende('escape');
    };
    /* Auch bei der nativen Klappe brauchen wir die Taste — nicht zum
       Schliessen (das kann sie selbst), sondern um den GRUND zu kennen. */
    const merkeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') grund = 'escape'; };

    function ende(warum: Grund): void {
      if (fertig) return;
      fertig = true;
      grund = warum;
      wache.disconnect();
      window.removeEventListener('resize', position);
      document.removeEventListener('keydown', taste, true);
      document.removeEventListener('pointerdown', draussen, true);
      panel.removeEventListener('keydown', merkeEscape);
      if (nativ) { try { panel.hidePopover(); } catch { /* war schon zu */ } }
      panel.remove();
      offen = null;
      if (anchor.isConnected) {
        anchor.setAttribute('aria-expanded', 'false');
        /* ══ ESCAPE GIBT DEN FOKUS ZURÜCK, EIN AUSSENKLICK NICHT ════════════
           Wer mit Escape oder „×" schliesst, will dort weitermachen, wo er
           war. Wer daneben tippt, wollte DORTHIN — ihn zurückzuziehen wäre
           der Fokusdiebstahl, den der Plan ausschliesst. `weg` gibt gar
           nichts zurück: die Umgebung ist fort, da gibt es kein Zurück. */
        if (warum === 'escape' || warum === 'knopf') anchor.focus({ preventScroll: true });
      }
      onClose?.(warum);
    }

    document.body.append(panel); position();
    anchor.setAttribute('aria-expanded', 'true');
    offen = { ende };
    if (nativ) {
      panel.addEventListener('keydown', merkeEscape);
      panel.addEventListener('toggle', event => {
        if ((event as ToggleEvent).newState !== 'closed') return;
        ende(grund);
      });
    } else {
      document.addEventListener('keydown', taste, true);
      /* Erst im nächsten Zug horchen: sonst schliesst der Klick, der das
         Feld geöffnet hat, es gleich wieder. */
      setTimeout(() => { if (!fertig) document.addEventListener('pointerdown', draussen, true); }, 0);
    }
    window.addEventListener('resize', position);
    wache.observe(document.body, { childList: true, subtree: true });
    if (nativ) panel.showPopover();
    exit.focus({ preventScroll: true });
  };
  return { open, closeAll };
})();
