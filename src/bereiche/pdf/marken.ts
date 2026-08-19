/* ============================================================================
 * bereiche/pdf/marken.ts — die Zeichenschicht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/marken.ts`.
 * ----------------------------------------------------------------------------
 * EINE Zeichenschicht für zwei Untergründe: das leere A4-Blatt (E100) und die
 * PDF-Seite (E103). Sie lag zuerst im Blatt; als die PDF-Seite dieselbe
 * brauchte, wurde sie herausgelöst statt abgeschrieben. Zwei Kopien laufen
 * auseinander, und die vergessene ist die, auf der der Nutzer gerade malt
 * (§34).
 *
 * Was sie kann und was sie bewusst nicht kann, steht in E100. Kurz:
 * Blattkoordinaten über `SheetSpace`, ein DOM-Knoten je Strich,
 * `pointercancel` schliesst ab, nur der Hauptzeiger malt.
 * ==========================================================================*/

const Marken = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (name: string, attr: Record<string, unknown> = {}): SVGElement => {
    const el = document.createElementNS(NS, name);
    Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  };

  const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'];
  const BREITEN = [1.2, 2.4, 5];

  const zeichneMarke = (m: any): SVGElement | null => {
    if (!m || !Array.isArray(m.pts) || m.pts.length < 2) return null;
    const d = 'M' + m.pts.map((q: number[]) => q[0] + ' ' + q[1]).join(' L');
    const pfad = sv('path', {
      d, fill: 'none', stroke: m.farbe || FARBEN[0],
      'stroke-width': m.breite || BREITEN[1],
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    /* An JEDEM Knoten, nicht nur am ersten — der Radierer trifft sonst
       Teile, die zu niemandem gehören. */
    pfad.setAttribute('data-sid', String(m.id));
    return pfad;
  };

  /**
   * Eine Zeichenschicht über einem Untergrund.
   *
   * @param block   der Block, in dem die Marken liegen
   * @param breite  Blattbreite in Punkten
   * @param hoehe   Blatthöhe in Punkten
   * @param umbruch alle wie viel Punkte eine gestrichelte Linie? 0 = keine
   */
  const schicht = (block: any, breite: number, hoehe: number, umbruch = 0) => {
    const R = SheetSpace;
    const marken: any[] = Array.isArray(block.marken)
      ? JSON.parse(JSON.stringify(block.marken)) : [];
    let werkzeug: 'schreiben' | 'stift' | 'radierer' = 'schreiben';
    let farbe = FARBEN[0] as string;
    let strich = BREITEN[1] as number;

    const flaeche = sv('svg', {
      class: 'blatt-marken', viewBox: `0 0 ${breite} ${hoehe}`,
      preserveAspectRatio: 'none'
    }) as SVGSVGElement;

    for (let s = 1; umbruch > 0 && s * umbruch < hoehe; s++) {
      flaeche.appendChild(sv('line', {
        x1: 0, x2: breite, y1: s * umbruch, y2: s * umbruch,
        stroke: 'currentColor', 'stroke-width': 0.5,
        'stroke-dasharray': '6 6', opacity: 0.35, class: 'blatt-umbruch'
      }));
    }
    marken.forEach(m => { const k = zeichneMarke(m); if (k) flaeche.appendChild(k); });

    const sichern = () => Store.updateBlock(block.id, {
      marken, raumVersion: R.RAUM_VERSION
    });

    let laufend: any = null;
    let laufKnoten: SVGElement | null = null;

    const abschliessen = (): void => {
      if (!laufend) return;
      /* Ein Punkt ist kein Strich. */
      if (laufend.pts.length >= 2) { marken.push(laufend); sichern(); }
      else if (laufKnoten && laufKnoten.parentNode) laufKnoten.remove();
      laufend = null; laufKnoten = null;
    };

    flaeche.addEventListener('pointerdown', (e: PointerEvent) => {
      if (werkzeug === 'schreiben' || !e.isPrimary) return;
      const punkt = R.zuBlatt(flaeche, e);
      if (!punkt) return;
      e.preventDefault();

      if (werkzeug === 'radierer') {
        const ziel = (e.target as Element)?.closest?.('[data-sid]') as HTMLElement | null;
        const sid = ziel?.dataset?.sid;
        if (!sid) return;
        const i = marken.findIndex((m: any) => m.id === sid);
        if (i < 0) return;
        marken.splice(i, 1);
        ziel.remove();
        sichern();
        return;
      }

      laufend = {
        id: (typeof Ids !== 'undefined' ? Ids.short(8) : String(marken.length + 1)),
        art: 'stift', farbe, breite: strich, pts: [punkt]
      };
      laufKnoten = zeichneMarke({ ...laufend, pts: [punkt, punkt] });
      if (laufKnoten) flaeche.appendChild(laufKnoten);
      try { flaeche.setPointerCapture(e.pointerId); } catch { /* egal */ }
    });

    flaeche.addEventListener('pointermove', (e: PointerEvent) => {
      if (!laufend || !e.isPrimary) return;
      const punkt = R.zuBlatt(flaeche, e);
      if (!punkt) return;
      const letzt = laufend.pts[laufend.pts.length - 1];
      /* Punkte dichter als ein halber Millimeter bringen nur Datenmenge. */
      if (letzt && Math.abs(letzt[0] - punkt[0]) < 1 && Math.abs(letzt[1] - punkt[1]) < 1) return;
      laufend.pts.push(punkt);
      /* NUR den einen Pfad neu setzen — nicht die ganze Fläche. */
      if (laufKnoten)
        laufKnoten.setAttribute('d', 'M' + laufend.pts.map((q: number[]) => q[0] + ' ' + q[1]).join(' L'));
    });

    flaeche.addEventListener('pointerup', abschliessen);
    flaeche.addEventListener('pointercancel', abschliessen);
    flaeche.addEventListener('pointerleave', abschliessen);
    addEventListener('pagehide', abschliessen);

    /* Zu Beginn wird geschrieben, nicht gemalt — die Schicht ist durchlässig. */
    flaeche.style.pointerEvents = 'none';

    const setzeWerkzeug = (w: string): void => {
      werkzeug = w as any;
      flaeche.style.pointerEvents = werkzeug === 'schreiben' ? 'none' : 'auto';
    };
    const setzeFarbe = (c: string): void => { farbe = c; };
    const setzeStrich = (b: number): void => { strich = b; };

    return { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, marken };
  };

  /**
   * Die Werkzeugleiste — auch sie eine Stelle für beide Untergründe.
   *
   * ZWEI KÄSTEN, NICHT EINER. Links die Werkzeuge, die am Telefon seitlich
   * rollen (665 px Inhalt in 334 px Kasten, gemessen); rechts daneben ein
   * FESTER Teil, der nicht mitrollt. Dort steht die Seitenzahl.
   *
   * Der erste Versuch liess den festen Teil im Rollkasten und hielt ihn mit
   * `position: sticky` an der rechten Kante. Er blieb auch stehen — aber die
   * Farbknöpfe schienen durch den Text hindurch. Zwei Kästen haben diese
   * Frage gar nicht: was nicht im Rollbereich liegt, kann nichts überdecken.
   */
  const leiste = (schalter: {
    setzeWerkzeug: (w: string) => void;
    setzeFarbe: (c: string) => void;
    setzeStrich: (b: number) => void;
  }, extra = ''): HTMLElement => {
    const reihe = document.createElement('div');
    reihe.className = 'blatt-reihe';
    const werk = document.createElement('div');
    werk.className = 'blatt-werk';
    /* Zeichen und Wort getrennt: am Telefon bleibt nur das Zeichen stehen.
       Mit Wörtern brauchte die Leiste bei 390 px DREI Zeilen (E100). */
    const knopf = (wz: string, zeichen: string, wort: string, titel: string) =>
      `<button data-wz="${wz}"${wz === 'schreiben' ? ' class="on"' : ''} title="${titel}">` +
      `<span class="zeichen">${zeichen}</span><span class="wort">${wort}</span></button>`;
    werk.innerHTML =
      knopf('schreiben', '✎', 'Schreiben', 'Schreiben — der Zeiger geht an der Zeichenschicht vorbei') +
      knopf('stift', '🖍', 'Malen', 'Mit dem Stift malen') +
      knopf('radierer', '⌫', 'Radieren', 'Striche entfernen') +
      '<span class="blatt-trenn"></span>' +
      FARBEN.map((c, i) =>
        `<button class="blatt-farbe${i === 0 ? ' on' : ''}" data-c="${c}" style="background:${c}" title="Farbe"></button>`).join('') +
      '<span class="blatt-trenn"></span>' +
      BREITEN.map((b, i) =>
        `<button class="blatt-strich${i === 1 ? ' on' : ''}" data-b="${b}" title="Strichbreite">` +
        `<i style="height:${Math.max(2, b)}px"></i></button>`).join('') +
      '';

    werk.addEventListener('click', e => {
      const b = (e.target as HTMLElement)?.closest?.('button') as HTMLElement | null;
      if (!b) return;
      if (b.dataset.wz) {
        schalter.setzeWerkzeug(b.dataset.wz);
        werk.querySelectorAll('[data-wz]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        return;
      }
      if (b.dataset.c) {
        schalter.setzeFarbe(b.dataset.c);
        werk.querySelectorAll('.blatt-farbe').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        return;
      }
      if (b.dataset.b) {
        schalter.setzeStrich(Number(b.dataset.b));
        werk.querySelectorAll('.blatt-strich').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      }
    });

    reihe.appendChild(werk);
    if (extra) {
      const fest = document.createElement('div');
      fest.className = 'blatt-fest';
      fest.innerHTML = extra;
      reihe.appendChild(fest);
    }
    return reihe;
  };

  return { schicht, leiste, zeichneMarke, FARBEN, BREITEN };
})();

(window as any).Marken = Marken;
