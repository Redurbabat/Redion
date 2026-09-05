/* ============================================================================
 * schale/ueberlagerung/orb.js — die Denkkugel auf einem Canvas
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/orb.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/orb.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Rechnung steht in `core/orb/`. Hier steht nur, wie daraus Farbe wird —
 * und drei Dinge, die eine Animation in einer echten App braucht und die in
 * keiner Vorführung vorkommen:
 *
 *   · Sie hört auf, wenn niemand hinsieht (Tab weg, Element aus dem Bild).
 *     Eine Denkkugel, die im Hintergrund weiterrechnet, kostet Akku für
 *     nichts — §36.
 *   · Sie steht still, wenn der Nutzer `prefers-reduced-motion` gesetzt hat.
 *     Dann ist sie ein Standbild, nicht nichts: der Zustand bleibt lesbar.
 *   · Sie trägt ihren Zustand als Text, nicht nur als Bewegung — §38 sagt
 *     „keine Information nur über Farbe", und Bewegung ist nicht besser.
 *
 * Die Tinte ist die geerbte Textfarbe des Ortes, an dem die Kugel hängt.
 * Damit stimmt sie in Hell und Dunkel von selbst, ohne ein einziges neues
 * Token — §39 warnt ausdrücklich vor erfundenen Tokens, und dreimal ist es
 * hier schon passiert.
 * ==========================================================================*/

/** Ein laufender Orb. Wer ihn anlegt, muss ihn auch wieder anhalten. */
interface OrbGriff {
  /** Den Zustand wechseln, ohne das Canvas neu zu bauen. */
  zustand(neu: string): void;
  /** Anhalten und aufräumen. Zweimal aufrufen ist erlaubt. */
  stopp(): void;
}

const Orb = (() => {

  const { orbFrame, ORB_TEXTE } = OrbModes;

  /** Wie eine `rgb(...)`-Zeichenkette in drei Zahlen zerfällt. */
  const zuRgb = (farbe: string): [number, number, number] => {
    const m = farbe.match(/-?\d+(\.\d+)?/g);
    if (!m || m.length < 3) return [60, 60, 60];
    return [Number(m[0]) || 0, Number(m[1]) || 0, Number(m[2]) || 0];
  };

  /**
   * Einen fertigen Augenblick zeichnen. Linien zuerst, damit die Knoten
   * darauf sitzen und nicht darunter verschwinden.
   */
  const malen = (
    ctx: CanvasRenderingContext2D, bild: OrbFrame,
    size: number, tinte: [number, number, number],
  ): void => {
    ctx.clearRect(0, 0, size, size);
    const [r, g, b] = tinte;
    for (const l of bild.lines) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${(0.12 + 0.3 * l.depth).toFixed(3)})`;
      ctx.lineWidth = l.w;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
    for (const d of bild.dots) {
      ctx.fillStyle = `rgba(${r},${g},${b},${(0.16 + 0.74 * d.depth).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /**
   * Eine Denkkugel in ein Element hängen.
   *
   * `groesse` ist in CSS-Pixeln. Zwei Werte sind abgestimmt: 64 für ein
   * Fenster, 20 für eine Zeile. Dazwischen geht auch, sieht aber nach
   * nichts Bestimmtem aus.
   */
  const setzen = (wirt: HTMLElement, start = 'working', groesse = 64): OrbGriff => {
    let art = start;
    let laeuft = true;
    let bild = 0;
    let sichtbar = true;

    const c = document.createElement('canvas');
    c.className = 'orb';
    c.setAttribute('role', 'img');
    c.style.width = groesse + 'px';
    c.style.height = groesse + 'px';
    wirt.appendChild(c);

    const beschriften = (): void => {
      const wort = ORB_TEXTE[art as keyof typeof ORB_TEXTE] || 'arbeitet';
      c.setAttribute('aria-label', 'Redion ' + wort + ' …');
      c.title = 'Redion ' + wort + ' …';
    };
    beschriften();

    const ctx = c.getContext('2d');
    if (!ctx) {
      /* Ohne 2D-Canvas bleibt der Platz leer statt kaputt. Ein Punkt
         genügt, damit die Zeile nicht in sich zusammenfällt. */
      c.remove();
      return { zustand: (n) => { art = n; }, stopp: () => {} };
    }

    const ruhe = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;

    const zeichnen = (jetzt: number): void => {
      if (!laeuft) return;
      const dpr = Math.min(2, (window.devicePixelRatio || 1));
      const px = Math.round(groesse * dpr);
      if (c.width !== px) { c.width = px; c.height = px; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Bei Bewegung-aus ein festes Standbild: t = 2.4 zeigt bei allen
         neun Arten einen Zustand, in dem etwas zu erkennen ist — bei t = 0
         sitzen mehrere Arten noch in ihrer Ausgangslage. */
      const t = ruhe ? 2.4 : jetzt / 1000;
      const tinte = zuRgb(getComputedStyle(c).color);
      malen(ctx, orbFrame(art, groesse, t), groesse, tinte);
      if (ruhe) return;                       /* einmal malen genügt */
      if (sichtbar && !document.hidden) bild = requestAnimationFrame(zeichnen);
    };
    bild = requestAnimationFrame(zeichnen);

    /* Aus dem Bild gescrollt heisst: nicht mehr rechnen. */
    let beobachter: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'function') {
      beobachter = new IntersectionObserver((eintraege) => {
        const e = eintraege[0];
        if (!e) return;
        sichtbar = e.isIntersecting;
        if (sichtbar && laeuft && !ruhe && !bild) bild = requestAnimationFrame(zeichnen);
      });
      beobachter.observe(c);
    }

    const beiSicht = (): void => {
      if (!document.hidden && laeuft && !ruhe && sichtbar) {
        bild = requestAnimationFrame(zeichnen);
      }
    };
    document.addEventListener('visibilitychange', beiSicht);

    return {
      zustand(neu: string) {
        if (neu === art) return;
        art = neu;
        beschriften();
      },
      stopp() {
        laeuft = false;
        if (bild) cancelAnimationFrame(bild);
        bild = 0;
        beobachter?.disconnect();
        document.removeEventListener('visibilitychange', beiSicht);
        c.remove();
      },
    };
  };

  return { setzen, malen };
})();

(window as any).Orb = Orb;
