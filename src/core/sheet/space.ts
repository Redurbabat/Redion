/* ============================================================================
 * core/sheet/space.ts — der Blattraum
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/sheet/space.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/sheet/space.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * EINE STELLE, DIE BILDSCHIRM IN BLATT ÜBERSETZT — und keine zweite.
 *
 * Die vorhandene Zeichenfläche rechnet in rohen Bildschirmpunkten:
 *
 *     const r = flaeche.getBoundingClientRect();
 *     return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
 *
 * Das geht gut, solange die Fläche immer gleich breit ist. Ist sie es
 * nicht — anderes Fenster, Seitenleiste zu, Telefon quer, Zoom —, dann
 * liegt jeder gespeicherte Strich woanders als beim Zeichnen. Und zwar
 * ohne Fehlermeldung: die Zeichnung sieht aus wie eine Zeichnung, nur
 * verrutscht. Das ist die Sorte Verlust, die niemand bemerkt.
 *
 * Ein Blatt hat deshalb feste Masse in PUNKTEN, und das SVG trägt eine
 * `viewBox`. Was gespeichert wird, sind Blattpunkte — dieselbe Zahl auf
 * jedem Bildschirm. Die Umrechnung macht der Browser selbst über die
 * Bildschirmmatrix des SVG; sie berücksichtigt Breite, Zoom, Rollstand
 * und jede CSS-Verwandlung darüber, was `getBoundingClientRect` nicht tut.
 *
 * `raumVersion` steht von der ersten Zeile an in den Daten. Ändert sich je
 * die Bedeutung der Zahlen, ist an ihr erkennbar, welche Deutung gilt —
 * die Zeichenfläche hat das nicht, und deshalb wäre dort jede Änderung
 * eine stille Verschiebung.
 * ==========================================================================*/

const SheetSpace = (() => {
  /* A4 in Punkten, 1 pt = 1/72 Zoll: 210 × 297 mm. Krumme Zahlen, aber die
     richtigen — 595/842 wären 0,05 mm daneben, und beim Drucken zählt das. */
  const A4_BREITE = 595.28;
  const A4_HOEHE  = 841.89;

  /* 20 mm Rand, wie auf einem Schulblatt. */
  const RAND = 56.69;

  const RAUM_VERSION = 1;

  /** Zwei Nachkommastellen genügen: 0,01 pt sind 3,5 Tausendstel Millimeter. */
  const rund = (n: number): number => Math.round(n * 100) / 100;

  /**
   * Ein Zeigerpunkt vom Bildschirm in Blattpunkte.
   *
   * Gibt `null` zurück, wenn das SVG (noch) keine Bildschirmmatrix hat —
   * das passiert bei einem Element, das nicht im Dokument hängt oder
   * `display: none` ist. Dann wird NICHT geraten.
   */
  const zuBlatt = (
    svg: SVGSVGElement | null,
    e: { clientX: number; clientY: number }
  ): [number, number] | null => {
    if (!svg || !svg.getScreenCTM) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const punkt = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    if (!isFinite(punkt.x) || !isFinite(punkt.y)) return null;
    return [rund(punkt.x), rund(punkt.y)];
  };

  /** Wie viele Blattseiten hoch ist dieses Blatt? Mindestens eine. */
  const seiten = (hoehe: unknown): number =>
    Math.max(1, Math.ceil((Number(hoehe) || A4_HOEHE) / A4_HOEHE));

  /* ══ DIE GEDREHTE SEITE (E467) ═══════════════════════════════════════════
     `gedreht` ist die Drehung, die ein MENSCH einer Seite gegeben hat — 0,
     90, 180 oder 270, im Uhrzeigersinn. Sie ist NICHT `dreh`: das ist der
     /Rotate-Eintrag der PDF, den `leser.ts` beim Einlesen liest und den
     das gerasterte Bild schon enthaelt (`bw`/`bh` sind dafuer getauscht).
     Beides zusammenzuwerfen hiesse, eine eingelesene Querseite beim ersten
     Oeffnen noch einmal zu drehen.

     Die Drehung ist eine Sache der ANSICHT: Marken, Bild und Text bleiben
     in Blattpunkten, wo sie sind, und drehen sich mit — wie in GoodNotes,
     wo ein gedrehtes Blatt seine Notizen mitnimmt. Der Zeiger findet
     trotzdem hin: `zuBlatt` rechnet ueber `getScreenCTM`, und die kennt
     jede CSS-Drehung der Vorfahren. Eine alte Seite ohne das Feld ist
     „nicht gedreht" (§53.3). */
  const gedrehtVon = (block: any): 0 | 90 | 180 | 270 => {
    const g = ((Math.round((Number(block?.gedreht) || 0) / 90) * 90) % 360 + 360) % 360;
    return g === 90 || g === 180 || g === 270 ? g : 0;
  };

  /** Breite und Hoehe, wie sie auf dem Bildschirm STEHEN — bei 90 und 270
      getauscht. Fuer Platzhalter und Miniaturen, nicht fuer Marken. */
  const masseVon = (block: any): { bw: number; bh: number } => {
    const bw = Number(block?.bw) || Number(block?.blattBreite) || A4_BREITE;
    const bh = Number(block?.bh) || Number(block?.blattHoehe) || A4_HOEHE;
    const g = gedrehtVon(block);
    return g === 90 || g === 270 ? { bw: bh, bh: bw } : { bw, bh };
  };

  /**
   * Die Huelle, die eine Seite dreht — oder die Seite selbst, wenn sie
   * nicht gedreht ist. Dann bleibt der Aufbau EXAKT, wie er war: fuenfzehn
   * Pruefläufe nehmen ihre Masse am Papier, und die Millionen ungedrehten
   * Seiten sollen keinen neuen Knoten bekommen (dieselbe Regel wie beim
   * Randstreifen, E301). Gedreht wird per CSS (`.blatt-dreh`): die Huelle
   * hat das Seitenverhaeltnis der GEDREHTEN Seite, das Papier darin liegt
   * absolut in der Mitte und dreht sich um sie.
   */
  const drehHuelle = (block: any, inhalt: HTMLElement): HTMLElement => {
    const g = gedrehtVon(block);
    if (!g) return inhalt;
    const bw = Number(block?.bw) || Number(block?.blattBreite) || A4_BREITE;
    const bh = Number(block?.bh) || Number(block?.blattHoehe) || A4_HOEHE;
    const huelle = document.createElement('div');
    huelle.className = 'blatt-dreh';
    huelle.dataset.gedreht = String(g);
    huelle.style.setProperty('--bw', String(bw));
    huelle.style.setProperty('--bh', String(bh));
    huelle.style.setProperty('--dreh', g + 'deg');
    huelle.appendChild(inhalt);
    return huelle;
  };

  return { A4_BREITE, A4_HOEHE, RAND, RAUM_VERSION, rund, zuBlatt, seiten, gedrehtVon, masseVon, drehHuelle };
})();

(window as any).SheetSpace = SheetSpace;
