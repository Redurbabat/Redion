/* ============================================================================
 * lesefrage.ts — dieselbe Rechtefrage, einmal beantwortet (L50)
 * ----------------------------------------------------------------------------
 * `Arbeitswelt` und `Lebensbereiche` fragen beide dasselbe: darf ich diese
 * Seite lesen, darf ich sie ändern. Beide hatten dafür eine eigene Funktion,
 * beide hiessen `erlaubt` — und sie antworteten VERSCHIEDEN:
 *
 *     arbeitswelt     pageId ? Konten.darf(a, pageId) : Konten.darf(a)
 *     lebensbereiche  !!pageId && Konten.darf(a, pageId)
 *
 * Bei einer LEEREN Seitenkennung sagte die eine „frag den Arbeitsbereich" und
 * die andere „nein". Derselbe Block war in der einen Ansicht sichtbar und in
 * der anderen nicht — genau die Sorte Abweichung, die E169 gekostet hat, nur
 * eine Ebene höher. L34 nennt sie beim Namen: ein Wert steht an zwei Stellen,
 * nichts erzwingt Gleichheit, und die Abweichung sieht man erst spät.
 *
 * DIE REGEL, EINMAL AUSGESCHRIEBEN:
 *
 *   Rechte aus            → alles erlaubt. Ohne Konten gibt es keine Rechte,
 *                           und Redion ohne Server hat keine Konten.
 *   Seitenkennung da      → die Seitenfrage: darf ich DIESE Seite.
 *   Seitenkennung leer    → NEIN. Ein Block ohne Seite gehört zu keiner, und
 *                           eine fremde Seite darf nicht für ihn antworten.
 *   Kennung weggelassen   → die Werkstattfrage: darf ich hier überhaupt
 *                           etwas ändern. `Konten.darf` fällt dafür auf die
 *                           offene Seite zurück; das ist lose, aber es ist
 *                           genau die Frage, die „Neue Seite anlegen" stellt.
 *
 * Der Unterschied zwischen „leer" und „weggelassen" ist Absicht: er ist der
 * Grund, warum beide alten Fassungen zusammenfallen konnten, ohne dass sich
 * für einen einzigen Aufrufer etwas ändert.
 *
 * WARUM NICHT `rechte.ts`: den Namen gibt es schon — dort wohnen die
 * FELDrechte (Rechte je Spalte). Beim Schreiben dieser Datei wurde er beim
 * ersten Versuch überschrieben; `npm run typecheck` hat es gemeldet, weil
 * `Feldrechte` plötzlich unbekannt war.
 * ==========================================================================*/

const Lesefrage = (() => {

  type Aktion = 'lesen' | 'kommentieren' | 'bearbeiten' | 'teilen' | 'loeschen' | 'rechte';

  /** Gibt es überhaupt Konten? Ohne sie gibt es keine Rechte. */
  const aktiv = (): boolean =>
    typeof Konten !== 'undefined' && typeof Konten.darf === 'function';

  /**
   * Darf ich das?
   *
   * @param aktion  lesen, bearbeiten, …
   * @param pageId  die Seite. WEGLASSEN heisst „im Arbeitsbereich überhaupt",
   *                ein LEERER Text heisst „zu keiner Seite" und damit nein.
   */
  const erlaubt = (aktion: Aktion, pageId?: string): boolean => {
    if (!aktiv()) return true;
    if (pageId === undefined) return Konten.darf(aktion);
    return !!pageId && Konten.darf(aktion, pageId);
  };

  return { aktiv, erlaubt };
})();

(window as any).Lesefrage = Lesefrage;
