/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/ink-ruler.ts (npm run bauen:ts). */
/* E572: ein sichtbares Lineal im Dokumentraum (72 pt = 1 Zoll).
 * Nur Bedienoberfläche: keine Marke, kein Verlauf, kein Export.
 * Zeichnen nahe einer Kante bindet genau diesen Zug an die Kante.
 */
const InkRuler = (() => {
  const create = (surface: SVGSVGElement, width: number, height: number) => {
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.classList.add('blatt-ruler'); group.dataset.inkUi = 'ruler';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Lineal: ziehen zum Verschieben. Pfeiltasten verschieben, Umschalt und Pfeiltasten drehen.');
    group.setAttribute('tabindex', '0');
    /* ══ DAS LINEAL IST FÜR ZEIGER DURCHLÄSSIG (E573) ══════════════════════
       Der Zwischenstand hängte das ganze `<g>` in die Zeichenfläche und rief
       in seinem `pointerdown` als ERSTE Zeile `stopPropagation()` — vor jeder
       Prüfung, wem der Zeiger gilt. Zwei Dinge gingen dabei kaputt, beide
       gemessen:

         · `test267 §6` wurde rot: „frei 50.2°, gerastet 50.2°". Der Zug
           erreichte die Zeichenmaschine nie, also entstand die zweite Linie
           gar nicht, und die Prüfung fand wieder die erste.
         · Die Kantenführung selbst war unerreichbar. Sie beginnt innerhalb
           von 14 Einheiten um eine Kante — also AUF dem Glas. Was das Glas
           schluckt, kann nie geführt werden.

       Jetzt trägt das `<g>` `pointer-events="none"` als Präsentationsattribut
       (nicht nur im Stilblatt: ein Lineal, das ohne CSS die ganze Seite
       blockiert, ist die schlimmere Störung). Einen Zeiger nehmen nur der
       Griff in der Mitte und der Drehknopf an — und die rufen
       `stopPropagation()` erst, wenn der Zug ihnen wirklich gilt. */
    group.setAttribute('pointer-events', 'none');
    let active = false, x = width / 2, y = Math.min(height * .4, width * .65), angle = 0;
    let edge: number | null = null;
    /* NEUNZIG PROZENT DER BLATTBREITE, NICHT HUNDERTDREISSIG. `width * .65`
       ergab ein Band von 1,3 Blattbreiten — es stand links und rechts über
       das Papier hinaus und war damit auch nicht mehr zu greifen. */
    const half = width * .45, depth = 64;
    const make = (tag: string, attrs: Record<string, string | number>) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
      group.append(node); return node;
    };
    make('rect', { x: -half, y: 0, width: half * 2, height: depth, rx: 3, class: 'blatt-ruler-glass' });
    const mm = 72 / 25.4;
    let ticks = '';
    for (let i = -Math.floor(half / mm); i <= half / mm; i++) {
      const length = i % 10 === 0 ? 15 : i % 5 === 0 ? 10 : 6;
      ticks += `M${i * mm} 0v${length}M${i * mm} ${depth}v${-length}`;
      if (i % 10 === 0) {
        const label = make('text', { x: i * mm, y: 26, 'text-anchor': 'middle', 'font-size': 9 });
        label.textContent = String(Math.abs(i / 10));
      }
    }
    make('path', { d: ticks, class: 'blatt-ruler-ticks' });
    const caption = make('text', { x: 0, y: 44, 'text-anchor': 'middle', 'font-size': 8 });
    const render = () => {
      group.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
      caption.textContent = `cm · ${angle}° · ziehen / drehen`;
    };
    const rotate = make('g', { role: 'button', tabindex: '0', 'aria-label': 'Lineal um 15 Grad drehen', class: 'blatt-ruler-rotate' });
    rotate.setAttribute('pointer-events', 'auto');
    /* DIE GRIFFE HÄNGEN UNTER DEM GLAS, NICHT DARIN (E573, nachgemessen).
       Erster Versuch: ein Griffstreifen in der Mitte des Glases. `test267 §6`
       blieb rot — der Prüfzug beginnt bei 55 % der Blattbreite und 40 % der
       Höhe, und das ist genau dort. Ein Griff IM Glas nimmt immer irgendeinem
       Zug den Anfang weg, und welchem, hängt vom Zufall ab.
       Unter dem Glas nimmt er keinem etwas: die zwei Führungsbänder liegen
       um die Kanten (v um 0 und um `depth`), das Glas dazwischen bleibt frei,
       und wer den Griff trifft, wollte ihn treffen. */
    const griffY = depth + 12;
    const turn = document.createElementNS(ns, 'circle'); turn.setAttribute('cx', String(Math.min(half - 30, width * .33))); turn.setAttribute('cy', String(griffY + 16)); turn.setAttribute('r', '20'); rotate.append(turn);
    const arrow = document.createElementNS(ns, 'text'); arrow.setAttribute('x', turn.getAttribute('cx')!); arrow.setAttribute('y', String(griffY + 22)); arrow.setAttribute('text-anchor', 'middle'); arrow.textContent = '↻'; rotate.append(arrow);
    rotate.addEventListener('click', event => { event.stopPropagation(); angle = (angle + 15) % 180; render(); });
    rotate.addEventListener('keydown', event => { const key = (event as KeyboardEvent).key; if (key === 'Enter' || key === ' ') { event.preventDefault(); event.stopPropagation(); angle = (angle + 15) % 180; render(); } });

    /* ══ DER GRIFF (E573) ═══════════════════════════════════════════════════
       Ein echtes Lineal fasst man überall an. Hier absichtlich nicht: was das
       ganze Band annimmt, kann nicht mehr überzeichnet werden — daran ist der
       Zwischenstand gescheitert. Der Griff ist deshalb ein Streifen in der
       MITTE, breit genug für eine Hand und schmal genug, dass links und
       rechts von ihm gezeichnet wird. Er sitzt am Ankerpunkt: solange der
       auf dem Blatt geklemmt ist, ist auch der Griff erreichbar. */
    const grip = make('g', { class: 'blatt-ruler-grip', role: 'button', tabindex: '0',
      'aria-label': 'Lineal verschieben. Pfeiltasten verschieben, Umschalt und Pfeiltasten drehen.' });
    grip.setAttribute('pointer-events', 'auto');
    const gripBody = document.createElementNS(ns, 'rect');
    for (const [key, value] of Object.entries({ x: -56, y: griffY, width: 112, height: 32, rx: 9 })) gripBody.setAttribute(key, String(value));
    grip.append(gripBody);
    const gripLines = document.createElementNS(ns, 'path');
    gripLines.setAttribute('class', 'blatt-ruler-grip-lines');
    gripLines.setAttribute('d', `M-16 ${griffY + 9}v14M0 ${griffY + 9}v14M16 ${griffY + 9}v14`);
    grip.append(gripLines);

    const local = (event: PointerEvent): [number, number] | null => {
      const matrix = surface.getScreenCTM(); if (!matrix) return null;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      return [point.x, point.y];
    };
    let drag: { id: number; x: number; y: number; start: [number, number] } | null = null;
    /* `stopPropagation()` steht NACH der Entscheidung, nicht davor: nur ein
       Zug, der wirklich dem Griff gilt, wird der Zeichenmaschine entzogen. */
    grip.addEventListener('pointerdown', event => {
      const e = event as PointerEvent;
      if (e.button !== 0) return;
      const point = local(e); if (!point) return;
      event.stopPropagation(); event.preventDefault(); grip.focus();
      drag = { id: e.pointerId, x, y, start: point }; grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener('pointermove', event => {
      const e = event as PointerEvent;
      if (!drag || drag.id !== e.pointerId) return;
      event.stopPropagation();
      const point = local(e); if (!point) return;
      x = Math.max(0, Math.min(width, drag.x + point[0] - drag.start[0]));
      y = Math.max(0, Math.min(height - depth - 46, drag.y + point[1] - drag.start[1])); render();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      grip.addEventListener(name, event => { if (drag) event.stopPropagation(); drag = null; });
    }
    grip.addEventListener('click', event => event.stopPropagation());
    grip.addEventListener('keydown', event => {
      const e = event as KeyboardEvent;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      event.preventDefault(); event.stopPropagation();
      const sign = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
      if (e.shiftKey) angle = (angle + sign * 15 + 360) % 360;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') x = Math.max(0, Math.min(width, x + sign * 5));
      else y = Math.max(0, Math.min(height - depth - 46, y + sign * 5));
      render();
    });
    const coordinates = (point: number[]) => {
      const a = angle * Math.PI / 180, dx = point[0]! - x, dy = point[1]! - y;
      return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
    };
    const project = (point: number[]): [number, number] => {
      if (edge === null) return [point[0]!, point[1]!];
      const u = coordinates(point)[0]!, a = angle * Math.PI / 180;
      return [x + u * Math.cos(a) - edge * Math.sin(a), y + u * Math.sin(a) + edge * Math.cos(a)];
    };
    /* ══ DAS LINEAL GEHÖRT DORTHIN, WO MAN HINSIEHT (E591) ══════════════════
       Die Anfangslage war `y = min(height * .4, width * .65)` — vier Zehntel
       der BLATThöhe. Solange das ganze Blatt ins Fenster passt, ist das die
       Mitte des Blicks. Beim Zoom ist es das nicht mehr:

         1440 × 960, Lineal an, dann gezoomt — sichtbarer Anteil des Lineals
            60 %  → 100 %      140 %  →   1 %     Griff unerreichbar
           100 %  → 100 %      180 %  →   0 %     Griff unerreichbar

       Ein Lineal, dessen Griff man nicht erreicht, ist kein Werkzeug.

       `sichtbareMitte()` rechnet den Ausschnitt, den man WIRKLICH sieht, in
       Blattmasse um: den Schnitt aus der Fläche und ihrem Rollkasten. Es
       fragt dabei nichts über das Studio ab — es liest nur seine eigene
       Fläche und deren rollenden Vorfahren, und funktioniert damit auch auf
       einem Blatt in der Seitenspalte. */
    const rollkasten = (): Element | null => {
      let e: Element | null = surface.parentElement;
      while (e && e !== document.documentElement) {
        const st = getComputedStyle(e);
        if (/(auto|scroll)/.test(st.overflowY + ' ' + st.overflowX)) return e;
        e = e.parentElement;
      }
      return null;
    };
    const sichtbareMitte = (): [number, number] | null => {
      const sr = surface.getBoundingClientRect();
      if (!sr.width || !sr.height) return null;
      const k = rollkasten()?.getBoundingClientRect();
      const links  = Math.max(sr.left,   k ? k.left   : 0);
      const rechts = Math.min(sr.right,  k ? k.right  : window.innerWidth);
      const oben   = Math.max(sr.top,    k ? k.top    : 0);
      const unten  = Math.min(sr.bottom, k ? k.bottom : window.innerHeight);
      /* Weniger als eine Linealtiefe sichtbar heisst: es gibt keine
         vernünftige Stelle, und dann bleibt die alte besser stehen. */
      if (rechts - links < 80 || unten - oben < 80) return null;
      return [((links + rechts) / 2 - sr.left) / sr.width * width,
              ((oben + unten) / 2 - sr.top) / sr.height * height];
    };
    /* NUR WENN ES NÖTIG IST. Wer das Lineal an eine Stelle gelegt hat, soll
       es dort wiederfinden — verschoben wird erst, wenn es aus dem Bild
       gelaufen ist. Und NIE mitten in einem Zug: das wäre der Sprung, den
       niemand versteht (derselbe Satz wie bei `remount`, E573). */
    const insBild = (): void => {
      if (drag) return;
      const k = rollkasten()?.getBoundingClientRect();
      const links  = k ? k.left   : 0;
      const rechts = k ? k.right  : window.innerWidth;
      const oben   = k ? k.top    : 0;
      const unten  = k ? k.bottom : window.innerHeight;
      /* GEMESSEN WIRD DER DREHGRIFF, nicht die Mitte des Glases. Er ist der
         Teil, den man treffen muss, und er sitzt seitlich versetzt — bei
         180 % lag das Glas zu vier Fünfteln im Bild und der Griff trotzdem
         dreissig Pixel daneben. Eine Prüfung auf die Mitte hätte das für
         gelöst gehalten. */
      const gr = turn.getBoundingClientRect();
      if (gr.width && gr.left >= links && gr.right <= rechts
          && gr.top >= oben && gr.bottom <= unten) return;
      const ziel = sichtbareMitte();
      if (!ziel) return;
      x = Math.max(0, Math.min(width, ziel[0]));
      y = Math.max(0, Math.min(height - depth - 46, ziel[1] - depth / 2));
      render();
    };
    /* EINE STELLE, DIE NICHT VERGESSEN WERDEN KANN: der Zoom ändert die
       Grösse der Fläche, und genau daran hängt dieser Beobachter. Er muss
       nicht wissen, dass es einen Zoomregler gibt — und er greift auch,
       wenn das Fenster schmaler wird oder die Seitenspalte aufgeht. */
    try {
      new ResizeObserver(() => { if (active) insBild(); }).observe(surface);
    } catch { /* ohne Beobachter bleibt die Anfangslage */ }

    return {
      setActive(value: boolean) { active = value; edge = null;
        /* Erst zeichnen, dann messen: `insBild` liest den Griff aus dem
           Baum, und vor dem ersten `render()` steht dort die alte Lage. */
        if (active) { surface.append(group); render(); insBild(); } else group.remove(); },
      /* ══ NACH EINEM NEUZEICHNEN WIEDER ANHÄNGEN (E573) ═══════════════════
         `redraw()` in `marken.ts` räumt jedes `[data-ink-ui]` aus der Fläche —
         und niemand hängte das Lineal zurück. Gemessen: nach einem einzigen
         „Zurück" null Lineale in der Fläche, `linealAn()` weiterhin `true`.
         Der Schalter stand an, das Werkzeug war weg.
         Anders als `setActive` vergisst dieser Weg die Kante NICHT: er kann
         mitten in einem geführten Zug laufen, und dann wäre ein Rücksetzen
         auf `edge = null` genau der Sprung, den niemand versteht. */
      remount() { if (active && group.parentNode !== surface) { surface.append(group); render(); } },
      active: () => active,
      begin(point: number[], allowed: boolean) {
        edge = null;
        if (active && allowed) { const [u, v] = coordinates(point); if (Math.abs(u!) < half + 12) { if (Math.abs(v!) < 14) edge = 0; else if (Math.abs(v! - depth) < 14) edge = depth; } }
        return project(point);
      },
      project,
      end() { edge = null; },
      constrained: () => edge !== null
    };
  };
  return { create };
})();
