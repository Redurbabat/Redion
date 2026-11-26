/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/seitenansicht.ts (npm run bauen:ts). */
/* Dieselbe Seite lässt sich als Redion-Dokument oder als Fläche öffnen.
   Der Umschalter liest den Katalog. Alte schlanke Ansichten fallen auf
   Redion zurück, ohne gespeicherte Dokumente umzuschreiben. */

const Seitenansicht = (() => {

  /* BEIDE NAMEN SIND GLOBALE `const`, NICHT FELDER VON `window` — und das ist
     die Falle, in die dieser Bogen gelaufen ist (siehe die Chronik zum 26. September). `Register` wird
     ausdrücklich an `window` gehängt, `App` nicht: `const App = (() => …)()`
     in einem gewöhnlichen `<script>` legt eine globale LEXIKALISCHE Bindung
     an, und die steht nicht unter `window`. `(window as any).App?.zeichneSeite?.()`
     war deshalb still wirkungslos — das Feld wurde geschrieben, der Bildschirm
     blieb stehen, und kein Fehler kam. Deshalb hier der bare Name mit
     `typeof`-Prüfung, genau wie `document-mode.ts:626` es tut. */
  const katalog = () =>
    (typeof Register !== 'undefined' ? (Register as any).seitenansichten : null) ?? null;

  /** Welche Ansicht gilt — mit der gutmütigen Vorgabe aus Punkt 1. */
  const art = (p: any): string => {
    const k = katalog();
    if (!k) return 'redion';
    return k.holen(p?.seitenAnsicht)?.id ?? k.VORGABE;
  };

  /** Setzen und neu zeichnen. Ein Griff, wie `volleBreite` (E283, test277). */
  const setze = (p: any, id: string): void => {
    const k = katalog();
    if (!p?.id || !k?.holen(id)) return;
    if (art(p) === id) return;
    Store.updateBlock(p.id, { seitenAnsicht: id });
    if (typeof App !== 'undefined') App.zeichneSeite();
  };

  /**
   * Der Umschalter, als erstes Element der Seite.
   *
   * Er wird bei JEDER Seitenzeichnung neu gebaut — wie der ganze Seitenkopf.
   * Ein Umschalter, der stehen bleibt und seinen Zustand nachträgt, wäre ein
   * zweiter Zustand neben dem Block, und der ginge irgendwann auseinander.
   */
  const schalter = (wrap: HTMLElement, p: any): void => {
    const k = katalog();
    if (!k || typeof Segment === 'undefined') return;
    const halter = document.createElement('div');
    halter.className = 'pg-ansichten';
    const griff = Segment.bauen({
      name: 'Ansicht dieser Seite',
      wahlen: k.ARTEN.map((a: any) => ({ id: a.id, name: a.name, zeichen: a.zeichen })),
      gewaehlt: art(p),
      gewechselt: (id: string) => setze(p, id)
    });
    /* Der Titel steht am KNOPF, nicht an der Gruppe: er erklärt eine Wahl,
       und `Segment` kennt nur Namen und Kurzform. */
    for (const a of k.ARTEN) {
      const b = griff.element.querySelector<HTMLElement>(`[data-seg-wahl="${a.id}"]`);
      if (b) b.title = a.titel;
    }
    halter.appendChild(griff.element);
    wrap.appendChild(halter);
  };

  return { art, setze, schalter };
})();

(window as any).Seitenansicht = Seitenansicht;
