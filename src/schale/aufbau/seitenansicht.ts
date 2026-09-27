/* ============================================================================
 * schale/aufbau/seitenansicht.ts — der Umschalter über der Seite
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/seitenansicht.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/schale/aufbau/seitenansicht.js`; `test105` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * DREI BLICKE AUF EINE SEITE, nicht drei Seiten (E690). Der Katalog steht in
 * `register/seitenansichten.ts`; hier steht, wie man wechselt und was der
 * Wechsel am Block ändert.
 *
 * DREI DINGE, DIE DARAN LEICHT SCHIEFGEHEN
 *
 * 1. DAS FEHLENDE FELD IST DER NORMALFALL. Jede Seite, die es heute gibt,
 *    trägt kein `seitenAnsicht` — und muss weiter das zeigen, was sie immer
 *    gezeigt hat. `art()` fällt deshalb auf `Register.seitenansichten.VORGABE`
 *    ('redion') zurück, nicht auf den ersten Eintrag des Katalogs (das wäre
 *    'seite', und damit wären über Nacht alle Cover weg). §9.
 *
 * 2. DER UMSCHALTER GEHÖRT NICHT IN DIE KOPFZEILE. AFFiNE hat ihn dort, und
 *    der erste Entwurf wollte es nachbauen — `test40` hält aber fest, dass am
 *    Telefon in `#topbar` GENAU zwei Knöpfe sichtbar sind (Zurück und
 *    Seitenmenü), und `test573 §8` verlangt drei Umschaltknöpfe à 44 px auch
 *    am Telefon. Beides zugleich geht nicht. Er steht deshalb als erstes
 *    Element IN der Seite, also unter der Brotkrume — auf dem Bildschirm
 *    dieselbe Ecke wie bei AFFiNE, nur eine Zeile tiefer.
 *
 * 3. ER IST KEINE EIGENE KNOPFREIHE. `schale/bedienung/segment.ts` gibt es
 *    seit E441-Umfeld, es ist von `test425`, `test427` und `test429` bewacht
 *    (Radiogruppe, roving tabindex, sichtbarer Fokus, Markierung nicht nur
 *    über Farbe) — und es war bis heute an keiner einzigen Stelle benutzt.
 *    Eine zweite Knopfreihe daneben zu bauen wäre §8 in Reinform.
 *    Darum trägt der gewählte Knopf `aria-checked`, nicht `aria-pressed`:
 *    drei sich ausschliessende Möglichkeiten sind eine Radiogruppe, nicht
 *    drei Schalter.
 * ==========================================================================*/

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
