/* ============================================================================
 * register/werkzeuge.ts — der EINE Katalog der Zeichenwerkzeuge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/werkzeuge.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/werkzeuge.js`; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Redur, 25. September 2026, mit einem Bild von AFFiNEs Edgeless-Leiste:
 * „ich will so was haben wie die affine" — und gleich danach: „integriere
 * alles zusammen". Nicht eine Leiste fürs Whiteboard, sondern EINE für alle
 * Flächen.
 *
 * WARUM DAS HIER ANFÄNGT UND NICHT BEI DER LEISTE. Vor diesem Bogen gab es
 * vier Werkzeuglisten und keinen Katalog (gemessen, `doku/karte/thema-
 * werkzeugleisten.md`): `Marken.WERKZEUGE` im Studio (14 Werkzeuge), eine
 * zweite, kürzere in `register/menueband.ts` (13, ohne textfix, elemente,
 * bild, laser — genau der Fall, vor dem §8 warnt), ein HTML-String im
 * Whiteboard (12) und vier Kennungen in der Planfläche. Eine Leiste, die alle
 * vier bedienen soll, braucht zuerst eine Liste, aus der alle vier lesen
 * können — sonst wäre sie die fünfte.
 *
 * DIE KENNUNG IST EIN DATENWORT, KEIN NAME (§53.3). `stift`, `abdeck`,
 * `zettel` stehen so in `meta` unter `zeichnen:werkzeugwerte` und
 * `zeichnen:ordnung` an jedem Gerät, das Redion je benutzt hat. Sie zu
 * übersetzen wäre keine Umbenennung, sondern eine Datenmigration. Also
 * bleiben sie, auch wo sie hier deutsch aussehen.
 *
 * VIER KENNUNGEN GEHÖREN BEIDEN — `stift`, `text`, `bild`, `radierer`. Das
 * ist kein Zufall und kein Fehler: es ist dasselbe Werkzeug auf einer anderen
 * Fläche. Sie stehen deshalb EINMAL hier, mit dem Namen, den das Studio heute
 * auf dem Bildschirm zeigt (E614: das Wort unter dem Zeichen) — 12 + 14 − 4
 * = 22 Einträge.
 *
 * WAS HIER NICHT STEHT: was ein Werkzeug TUT. Ein Register beschreibt, es
 * zeichnet nicht (`register/formeln.ts`, Z.17). Die Handgriffe bleiben bei
 * der Fläche, die sie ausführt; hier steht nur, dass es das Werkzeug gibt,
 * wie es heisst und wie es aussieht.
 * ==========================================================================*/

/** Zwei Gruppen, wie in AFFiNEs Edgeless-Leiste — mit einer Regel statt einer Liste:
 *  `quick` sind die Werkzeuge, die mit dem UMGEHEN, was schon da ist
 *  (auswählen, schieben, verbinden, radieren, zeigen); `senior` die, die etwas
 *  NEUES auf die Fläche setzen. Deshalb steht der Verbinder bei den schnellen,
 *  obwohl er etwas erzeugt: er braucht zwei vorhandene Formen. */
type GfxWerkzeugGruppe = 'quick' | 'senior';

interface GfxWerkzeug {
  /** Kennung — Datenwort, steht so in `meta` (§53.3). */
  id: string;
  /** Der Name, den ein Mensch liest (E614: das Wort unter dem Zeichen). */
  name: string;
  /** Der ganze Satz für Titel und Vorleser (§38). */
  titel: string;
  /** Name eines Strichzeichens aus `Register.symbole`. */
  sym: string;
  /** Textrückfall — für Listen, Meldungen und alles, wo ein SVG keine Antwort ist. */
  zeichen: string;
  gruppe: GfxWerkzeugGruppe;
  /** Die Taste, die das Werkzeug wählt — nur wo sie WIRKLICH gebunden ist.
   *  Die vierzehn des Studios sind es (`marken.ts`, TASTEN); die der Flächen
   *  folgen in Bogen 5e. Ein Hinweis auf eine Taste, die nichts tut, wäre ein
   *  falsches Versprechen (§32). */
  kuerzel?: string;
  /** `false` = ein Weg, kein Zustand: der Knopf öffnet etwas und bleibt nicht
   *  gedrückt (Bild einfügen). Vorgabe ist `true`. */
  haelt?: boolean;
}

(window as any).Register = (window as any).Register || {};

Register.werkzeuge = (() => {

  /* ------------------------------------------------------------------------
   * DIE WERKZEUGE DER FLÄCHEN (Whiteboard heute; Gedankenkarte und
   * Planfläche kommen in 5c/5d dazu)
   * ----------------------------------------------------------------------*/
  const FLAECHE: GfxWerkzeug[] = [
    { id: 'zeiger', name: 'Auswählen', titel: 'Auswählen und verschieben',
      sym: 'inkPointer', zeichen: '⭠', gruppe: 'quick' },
    { id: 'hand', name: 'Hand', titel: 'Die Fläche schieben',
      sym: 'inkHand', zeichen: '✋', gruppe: 'quick' },
    { id: 'verbindung', name: 'Verbinden', titel: 'Zwei Formen verbinden — erst die eine antippen, dann die andere',
      sym: 'inkConnector', zeichen: '⇢', gruppe: 'quick' },
    { id: 'linie', name: 'Linie', titel: 'Eine gerade Linie ziehen',
      sym: 'formLine', zeichen: '╱', gruppe: 'senior' },
    { id: 'pfeil', name: 'Pfeil', titel: 'Einen Pfeil ziehen',
      sym: 'formArrow', zeichen: '→', gruppe: 'senior' },
    { id: 'rechteck', name: 'Rechteck', titel: 'Ein Rechteck aufziehen',
      sym: 'formRect', zeichen: '▭', gruppe: 'senior' },
    { id: 'ellipse', name: 'Ellipse', titel: 'Eine Ellipse aufziehen',
      sym: 'formEllipse', zeichen: '◯', gruppe: 'senior' },
    { id: 'notiz', name: 'Haftnotiz', titel: 'Eine Haftnotiz setzen und beschriften',
      sym: 'inkNote', zeichen: '🗒', gruppe: 'senior' }
  ];

  /* ------------------------------------------------------------------------
   * DIE WERKZEUGE DES STUDIOS
   * ------------------------------------------------------------------------
   * Wortgleich aus `marken.ts` (die Liste, die die Studioleiste baut). Sie
   * liest noch aus ihrer eigenen Fassung — der Umzug ist Bogen 5b, und bis
   * dahin hält `test572 §3` die beiden im Gleichlauf: jede Kennung dort steht
   * mit DEMSELBEN Namen hier. Genau das hat `test266` einmal gefunden, als
   * „Abdecken" im Studio still zu „Abdeckband" wurde und im Menüband nicht.
   * ----------------------------------------------------------------------*/
  const STUDIO: GfxWerkzeug[] = [
    { id: 'schreiben', name: 'Schreiben', titel: 'Schreiben — die Zeichenschicht ist durchlässig',
      sym: 'inkHand', zeichen: '✎', gruppe: 'quick' },
    { id: 'select', name: 'Auswahl', titel: 'Marken auswählen, gemeinsam bewegen oder löschen',
      sym: 'inkLasso', zeichen: '⌖', gruppe: 'quick', kuerzel: 'V' },
    { id: 'stift', name: 'Stift', titel: 'Freihand mit geglätteter Linie',
      sym: 'inkPen', zeichen: '🖍', gruppe: 'senior', kuerzel: 'P' },
    { id: 'marker', name: 'Marker', titel: 'Transparenter Marker',
      sym: 'inkMarker', zeichen: '▰', gruppe: 'senior', kuerzel: 'H' },
    { id: 'formen', name: 'Form', titel: 'Formen — welche, steht darunter',
      sym: 'inkShapes', zeichen: '□', gruppe: 'senior', kuerzel: 'S' },
    { id: 'abdeck', name: 'Abdecken',
      titel: 'Abdeckband über Lösungen ziehen — Antippen im Schreiben-Modus deckt auf',
      sym: 'inkCover', zeichen: '▬', gruppe: 'senior', kuerzel: 'A' },
    { id: 'zettel', name: 'Haftnotiz',
      titel: 'Einen Zettel aufziehen und beschriften; Antippen mit dem Werkzeug bearbeitet ihn',
      sym: 'inkNote', zeichen: '🗒', gruppe: 'senior', kuerzel: 'N' },
    { id: 'text', name: 'Text', titel: 'Textanmerkung',
      sym: 'inkText', zeichen: 'T', gruppe: 'senior', kuerzel: 'T' },
    { id: 'textfix', name: 'Text ändern',
      titel: 'Ein Wort der PDF antippen und überschreiben — die alte Stelle wird zugedeckt, das Original bleibt unberührt',
      sym: 'inkTextFix', zeichen: '✏', gruppe: 'senior' },
    { id: 'zeichen', name: 'Fachzeichen', titel: 'Ein elektrotechnisches Symbol auf die Seite setzen',
      sym: 'inkSymbol', zeichen: '⚡', gruppe: 'senior', kuerzel: 'M' },
    { id: 'elemente', name: 'Elemente',
      titel: 'Ein gesichertes Element setzen — sichern über die Auswahl («Als Element»)',
      sym: 'inkStamp', zeichen: '⭐', gruppe: 'senior' },
    { id: 'bild', name: 'Bild',
      titel: 'Ein Foto, ein GIF oder eine Seite aus einer PDF auf das Blatt legen — danach verschieben, ziehen und drehen wie jede Marke',
      sym: 'inkImage', zeichen: '🖼', gruppe: 'senior', kuerzel: 'I', haelt: false },
    { id: 'radierer', name: 'Radieren',
      titel: 'Radieren — über Marken streichen; der Knopf daneben wählt Ganz, Teil oder Marker',
      sym: 'inkEraser', zeichen: '⌫', gruppe: 'quick', kuerzel: 'E' },
    { id: 'laser', name: 'Laserpointer',
      titel: 'Zeigen, nicht schreiben — der Strahl verblasst von selbst und wird nie gespeichert',
      sym: 'inkLaser', zeichen: '⦿', gruppe: 'quick' }
  ];

  const EINGEBAUT: GfxWerkzeug[] = [...FLAECHE, ...STUDIO];
  const LISTE: GfxWerkzeug[] = EINGEBAUT.slice();

  /** Ein neues Werkzeug anmelden. Eine doppelte Kennung wird ABGEWIESEN, nicht
   *  überschrieben — ein Register, das still überschreibt, macht aus einem
   *  Tippfehler einen Datenverlust (`register/bloecke.ts`, Z.269). */
  const melde = (werkzeug: GfxWerkzeug): boolean => {
    if (!werkzeug || !werkzeug.id || LISTE.some(w => w.id === werkzeug.id)) return false;
    LISTE.push(werkzeug);
    return true;
  };

  const holen = (id: string): GfxWerkzeug | undefined => LISTE.find(w => w.id === id);
  const alle = (): GfxWerkzeug[] => LISTE.slice();
  const ids = (): string[] => LISTE.map(w => w.id);

  /** Die Werkzeuge einer Fläche, in der Reihenfolge, in der sie bestellt wurden.
   *
   *  Eine unbekannte Kennung wird AUSGELASSEN und gemeldet — nicht als
   *  `undefined` eingereiht. Sonst stünde in der Leiste ein leerer Knopf, und
   *  der Fehler zeigte sich erst beim Klicken (§7: keine stillen Abstürze). */
  const auswahl = (bestellung: string[]): GfxWerkzeug[] => {
    const raus: GfxWerkzeug[] = [];
    for (const id of bestellung) {
      const w = holen(id);
      if (w) raus.push(w);
      else console.warn(`Register.werkzeuge: „${id}" gibt es nicht — ausgelassen.`);
    }
    return raus;
  };

  return { melde, holen, alle, ids, auswahl };
})();
