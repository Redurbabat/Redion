/* ============================================================================
 * bereiche/pdf/marken.ts — eine Ink-Schicht fuer A4-Blatt und PDF-Seite
 * ----------------------------------------------------------------------------
 * Ein Dokumentraum, ein SVG-Knoten je Marke, keine Ablageschreibvorgaenge
 * waehrend pointermove. Alte `stift`-Marken mit `pts: [[x,y], ...]` bleiben
 * lesbar; neue Druckwerte liegen getrennt unter `pressure` (E125).
 * ==========================================================================*/

const Marken = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'] as const;
  const BREITEN = [1.2, 2.4, 5] as const;
  const MARKER_FARBE = '#e0a419';
  const HISTORY_LIMIT = 100;

  const svg = (name: string, attributes: Record<string, unknown> = {}): SVGElement => {
    const element = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const idOf = (mark: any): string => String(mark?.id || '');
  const strokeWidth = (mark: any): number => {
    const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
    const values = Array.isArray(mark?.pressure)
      ? mark.pressure.map(Number).filter((value: number) => Number.isFinite(value)) : [];
    const average = values.length ? values.reduce((sum: number, value: number) => sum + value, 0) / values.length : 0.5;
    const pressureFactor = Math.max(0.55, Math.min(1.55, 0.65 + average * 0.7));
    return base * pressureFactor * (mark?.art === 'marker' ? 4 : 1);
  };

  const arrowPath = (start: InkPoint, end: InkPoint): string => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const angle = Math.atan2(dy, dx);
    const head = Math.max(10, Math.min(24, Math.hypot(dx, dy) * 0.22));
    const left = [end[0] - head * Math.cos(angle - Math.PI / 6),
                  end[1] - head * Math.sin(angle - Math.PI / 6)];
    const right = [end[0] - head * Math.cos(angle + Math.PI / 6),
                   end[1] - head * Math.sin(angle + Math.PI / 6)];
    return `M${start[0]} ${start[1]} L${end[0]} ${end[1]} ` +
      `M${left[0]} ${left[1]} L${end[0]} ${end[1]} L${right[0]} ${right[1]}`;
  };

  /** Bildschirm, Druck und Praesentation rufen denselben Zeichner auf. */
  const zeichneMarke = (mark: any): SVGElement | null => {
    if (!mark || typeof mark !== 'object') return null;
    const art = String(mark.art || 'stift');
    const color = String(mark.farbe || FARBEN[0]);
    const width = strokeWidth(mark);
    const points = InkGeometry.points(mark.pts);
    let element: SVGElement | null = null;

    /* --- Ein Fachzeichen auf der Seite (Punkt 42) -------------------------
     * Das Symbol wird NICHT hier gezeichnet, sondern aus `register/fachzeichen`
     * geholt — derselben Quelle, aus der die Palette im Schaltplan schöpft.
     * Eine zweite Symbolliste für das PDF wäre L34: sie liefe auseinander,
     * und niemand merkte es, bis ein Zeichen auf dem Plan anders aussieht als
     * dasselbe Zeichen auf der PDF-Seite daneben.
     * -------------------------------------------------------------------- */
    if (art === 'zeichen') {
      const point = InkGeometry.points([mark.point])[0];
      const fz = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen : null;
      if (!point || !fz) return null;
      const roh = fz.alsSvg(String(mark.zeichenId || ''), {
        farbe: color, drehung: Number(mark.drehung) || 0,
        gespiegelt: !!mark.gespiegelt });
      if (!roh) return null;
      const mass = fz.masse(String(mark.zeichenId || ''), Number(mark.drehung) || 0);
      const wunsch = Math.max(12, Number(mark.groesse) || 64);
      const faktor = wunsch / Math.max(mass.w || 1, mass.h || 1);
      const gruppe = svg('g', {
        /* Der gesetzte Punkt ist die MITTE des Zeichens und nicht seine linke
           obere Ecke: man tippt dorthin, wo das Symbol sitzen soll. */
        transform: `translate(${point[0] - (mass.w * faktor) / 2} ` +
          `${point[1] - (mass.h * faktor) / 2}) scale(${faktor.toFixed(4)})`,
        fill: 'none', stroke: color,
        'stroke-width': (2 / faktor).toFixed(3),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      /* `alsSvg` liefert ein vollständiges <svg>; hier wird nur sein Inhalt
         gebraucht, damit das Zeichen im Blattraum sitzt und mitskaliert. */
      gruppe.innerHTML = roh.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      /* Eine unsichtbare Fläche, damit das Zeichen auch in seinen Lücken
         greifbar ist — ein Kontakt besteht fast nur aus Linien. */
      const griff = svg('rect', { x: 0, y: 0, width: mass.w, height: mass.h,
        fill: 'transparent', stroke: 'none' });
      gruppe.insertBefore(griff, gruppe.firstChild);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    }

    if (art === 'text') {
      const point = InkGeometry.points([mark.point])[0];
      if (!point) return null;
      element = svg('text', {
        x: point[0], y: point[1], fill: color,
        'font-size': Math.max(8, Number(mark.fontSize) || 18),
        'font-family': 'system-ui, sans-serif', 'dominant-baseline': 'alphabetic'
      });
      element.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
    } else if (art === 'line' && points.length >= 2) {
      element = svg('line', { x1: points[0]![0], y1: points[0]![1],
        x2: points[1]![0], y2: points[1]![1] });
    } else if (art === 'arrow' && points.length >= 2) {
      element = svg('path', { d: arrowPath(points[0]!, points[1]!) });
    } else if (art === 'rectangle' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height });
    } else if (art === 'abdeck' && points.length >= 2) {
      /* DAS ABDECKBAND (E266): eine DECKENDE Fläche über dem, was man
         gleich abfragen will — Formel zudecken, selbst antworten,
         antippen, nachsehen. Gezeichnet wird es wie ein Rechteck; die
         Füllung ist der Sinn der Sache und steht deshalb HIER, vor dem
         Strich-Block unten, der jede Form auf fill:none stellt.
         GESPEICHERT IST IMMER „ZUGEDECKT": das Aufdecken lebt nur im
         Sichtbaren (data-auf, siehe schicht) und schreibt nie in die
         Ablage — Lernen darf den Speicher nicht anfassen. Druck und
         Folien rufen denselben Zeichner und zeigen darum zu. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, rx: 4, fill: color, 'pointer-events': 'all' });
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      return element;
    } else if (art === 'ellipse' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('ellipse', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
        rx: box.width / 2, ry: box.height / 2 });
    } else if (points.length >= 2) {
      element = svg('path', { d: InkGeometry.path(points) });
    }
    if (!element) return null;

    if (art !== 'text') {
      element.setAttribute('fill', 'none');
      element.setAttribute('stroke', color);
      element.setAttribute('stroke-width', String(width));
      element.setAttribute('stroke-linecap', 'round');
      element.setAttribute('stroke-linejoin', 'round');
      if (art === 'marker') {
        element.setAttribute('opacity', '0.32');
        element.setAttribute('style', 'mix-blend-mode:multiply');
      }
      /* Geschlossene Formen lassen sich auch in ihrer Flaeche greifen. Die
         Flaeche bleibt optisch leer; `pointer-events` aendert nur den Treffer. */
      if (art === 'rectangle' || art === 'ellipse') element.setAttribute('pointer-events', 'all');
    }
    element.setAttribute('data-sid', idOf(mark));
    element.setAttribute('data-ink-art', art);
    return element;
  };

  const updateNode = (node: SVGElement | null, mark: any): SVGElement | null => {
    const fresh = zeichneMarke(mark);
    if (!fresh) return null;
    /* Ein Knoten MIT Kindern wird ersetzt und nicht geflickt: unten werden
       nur Attribute und `textContent` übertragen, und ein <g> voller Pfade
       behielte damit seine alten Kinder. Beim Fachzeichen hiesse das: die
       Kennung ändert sich, das Bild nicht. */
    if (fresh.firstElementChild || node?.firstElementChild) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    if (!node || node.tagName !== fresh.tagName) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
    [...fresh.attributes].forEach(attribute => node.setAttribute(attribute.name, attribute.value));
    node.textContent = fresh.textContent;
    return node;
  };

  /* Eine globale Lebenswache statt eines pagehide-Zuhoerers je Neuzeichnung
     (E115). Sie schliesst einen laufenden Strich, bevor seine SVG verschwindet. */
  type LiveLayer = { flaeche: SVGSVGElement; abschliessen: () => boolean };
  const lebende = new Set<LiveLayer>();
  let observer: MutationObserver | null = null;
  let inspectionQueued = false;
  const inspectLayers = (): void => {
    inspectionQueued = false;
    let saved = false;
    for (const layer of [...lebende]) {
      if (layer.flaeche.isConnected) continue;
      if (layer.abschliessen()) saved = true;
      lebende.delete(layer);
    }
    if (!lebende.size && observer) { observer.disconnect(); observer = null; }
    if (saved && typeof App !== 'undefined' && App.zeichneSeite) App.zeichneSeite();
  };
  const registerLayer = (layer: LiveLayer): void => {
    lebende.add(layer);
    if (typeof MutationObserver === 'undefined') return;
    if (!observer) observer = new MutationObserver(() => {
      if (inspectionQueued) return;
      inspectionQueued = true;
      queueMicrotask(inspectLayers);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (typeof addEventListener === 'function') {
    addEventListener('pagehide', () => { for (const layer of lebende) layer.abschliessen(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden')
        for (const layer of lebende) layer.abschliessen();
    });
  }

  const schicht = (block: any, breite: number, hoehe: number, umbruch = 0) => {
    const R = SheetSpace;
    const marks: any[] = Array.isArray(block.marken) ? clone(block.marken) : [];
    let tool = 'schreiben';
    let color: string = FARBEN[0];
    let width: number = BREITEN[1];
    let running: any = null;
    let runningNode: SVGElement | null = null;
    let beforeRunning: any[] | null = null;
    let selection = new Set<string>();
    let selectDrag: any = null;
    const historyUndo: any[][] = [];
    const historyRedo: any[][] = [];
    const stateListeners = new Set<(state: any) => void>();

    const flaeche = svg('svg', { class: 'blatt-marken', viewBox: `0 0 ${breite} ${hoehe}`,
      preserveAspectRatio: 'none', 'data-tool': tool }) as SVGSVGElement;
    for (let page = 1; umbruch > 0 && page * umbruch < hoehe; page++) {
      flaeche.appendChild(svg('line', { x1: 0, x2: breite, y1: page * umbruch, y2: page * umbruch,
        stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-dasharray': '6 6',
        opacity: 0.35, class: 'blatt-umbruch' }));
    }
    marks.forEach(mark => { const node = zeichneMarke(mark); if (node) flaeche.appendChild(node); });

    /* Welche Abdeckbänder GERADE aufgedeckt sind — nur Laufzeit, nie
       Ablage: nach Neuladen oder Neuzeichnen von aussen ist wieder alles
       zu, und genau das ist die ehrliche Vorgabe beim Lernen (E266). */
    const aufgedeckt = new Set<string>();
    const abdeckAnwenden = (): void => {
      flaeche.querySelectorAll<SVGElement>('[data-ink-art="abdeck"]').forEach(node => {
        const id = node.getAttribute('data-sid') || '';
        if (aufgedeckt.has(id)) node.setAttribute('data-auf', '1');
        else node.removeAttribute('data-auf');
      });
    };

    const snapshot = (): any[] => clone(marks);
    const state = () => ({ undo: historyUndo.length > 0, redo: historyRedo.length > 0,
      selected: selection.size });
    const notifyState = (): void => stateListeners.forEach(listener => listener(state()));
    const save = (): void => Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION });
    const commit = (before: any[]): void => {
      if (JSON.stringify(before) === JSON.stringify(marks)) return;
      historyUndo.push(before);
      if (historyUndo.length > HISTORY_LIMIT) historyUndo.shift();
      historyRedo.length = 0;
      save(); notifyState();
    };
    const nodeFor = (id: string): SVGElement | null =>
      [...flaeche.querySelectorAll<SVGElement>('[data-sid]')]
        .find(node => node.getAttribute('data-sid') === id) || null;
    const redraw = (): void => {
      flaeche.querySelectorAll('[data-sid],[data-ink-ui]').forEach(node => node.remove());
      marks.forEach(mark => { const node = zeichneMarke(mark); if (node) flaeche.appendChild(node); });
      abdeckAnwenden();
      renderSelection();
    };
    const restore = (next: any[]): void => {
      marks.splice(0, marks.length, ...clone(next));
      selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
      save(); redraw(); notifyState();
    };
    const undo = (): void => {
      const previous = historyUndo.pop();
      if (!previous) return;
      historyRedo.push(snapshot()); restore(previous);
    };
    const redo = (): void => {
      const next = historyRedo.pop();
      if (!next) return;
      historyUndo.push(snapshot()); restore(next);
    };
    function renderSelection(): void {
      flaeche.querySelectorAll('[data-ink-ui="selection"]').forEach(node => node.remove());
      for (const id of selection) {
        const mark = marks.find(item => idOf(item) === id);
        if (!mark) continue;
        const box = InkGeometry.bounds(mark);
        flaeche.appendChild(svg('rect', { x: box.x - 3, y: box.y - 3,
          width: box.width + 6, height: box.height + 6,
          class: 'blatt-auswahlrahmen', 'data-ink-ui': 'selection' }));
      }
      notifyState();
    }
    const deleteSelection = (): void => {
      if (!selection.size) return;
      const before = snapshot();
      for (let index = marks.length - 1; index >= 0; index--)
        if (selection.has(idOf(marks[index]))) marks.splice(index, 1);
      selection.clear(); redraw(); commit(before);
    };

    const pressureOf = (event: PointerEvent): number => {
      const pressure = Number(event.pressure);
      return pressure > 0 ? Math.max(0.05, Math.min(1, pressure)) : 0.5;
    };
    const addSample = (event: PointerEvent): void => {
      if (!running) return;
      const point = R.zuBlatt(flaeche, event);
      if (!point) return;
      const last = running.pts[running.pts.length - 1];
      if (last && Math.abs(last[0] - point[0]) < 0.6 && Math.abs(last[1] - point[1]) < 0.6) return;
      running.pts.push(point);
      running.pressure.push(pressureOf(event));
    };
    const finish = (): boolean => {
      if (selectDrag) {
        const drag = selectDrag;
        selectDrag = null;
        flaeche.querySelectorAll('[data-ink-ui="box"]').forEach(node => node.remove());
        if (drag.mode === 'move' && drag.moved) { commit(drag.before); return true; }
        if (drag.mode === 'box') {
          const box = InkGeometry.rectangle(drag.start, drag.end || drag.start);
          if (!drag.add) selection.clear();
          marks.forEach(mark => { if (InkGeometry.intersects(box, InkGeometry.bounds(mark))) selection.add(idOf(mark)); });
          renderSelection();
        }
        return false;
      }
      if (!running) return false;
      const mark = running;
      const node = runningNode;
      const before = beforeRunning || snapshot();
      running = null; runningNode = null; beforeRunning = null;
      if (mark.art === 'stift' || mark.art === 'marker') {
        if (mark.pts.length < 2) { node?.remove(); return false; }
        const original = mark.pts;
        const simplified = InkGeometry.simplify(original, Math.max(0.55, Number(mark.breite) * 0.28));
        /* Ein langer, beim Neuzeichnen geschlossener Strich darf nicht wie
           eine bloss konstruierte Zweipunktlinie aussehen (E115). Acht
           Stuetzpunkte halten Verlauf und Druck, auch wenn er fast gerade war. */
        mark.pts = original.length >= 8 && simplified.length < 8
          ? Array.from({ length: 8 }, (_value, index) =>
              original[Math.round(index * (original.length - 1) / 7)])
          : simplified;
        if (Array.isArray(mark.pressure) && mark.pressure.length !== mark.pts.length) {
          const average = mark.pressure.reduce((sum: number, value: number) => sum + value, 0) / mark.pressure.length;
          mark.pressure = mark.pts.map(() => Math.round(average * 100) / 100);
        }
      } else if (mark.pts.length < 2 ||
                 Math.hypot(mark.pts[1][0] - mark.pts[0][0], mark.pts[1][1] - mark.pts[0][1]) < 1) {
        node?.remove(); return false;
      }
      marks.push(mark);
      runningNode = updateNode(node, mark);
      commit(before);
      runningNode = null;
      return true;
    };

    const editText = async (point: number[], targetId = ''): Promise<void> => {
      const current = targetId ? marks.find(mark => idOf(mark) === targetId && mark.art === 'text') : null;
      const answer = await Dialog.frage(current ? 'Textanmerkung bearbeiten' : 'Textanmerkung',
        current ? String(current.text || '') : '');
      if (answer === null || (!current && !answer.trim())) return;
      const before = snapshot();
      if (current) current.text = answer;
      else marks.push({ id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
        art: 'text', point, text: answer, farbe: color, fontSize: Math.max(14, width * 7) });
      redraw(); commit(before);
    };

    /**
     * Ein Fachzeichen setzen (Punkt 42).
     *
     * Die Palette kommt aus `Planflaeche.paletteHtml` — genau die, die auch
     * im Schaltplan-Editor steht. Sie mitzubenutzen ist nicht Sparsamkeit,
     * sondern die einzige Art, zwei Auswahllisten zu vermeiden, die
     * auseinanderlaufen.
     *
     * Die zuletzt gewählte Kennung und die Grösse bleiben gemerkt: wer zehn
     * Schalter auf einen Grundriss setzt, will die Palette nicht zehnmal
     * durchsuchen.
     */
    const setzeZeichen = async (point: number[], targetId = ''): Promise<void> => {
      /* Ein vorhandenes Zeichen antippen dreht es weiter — dieselbe Bewegung
         wie im Planeditor, wo R dreht. Ohne das müsste man löschen und neu
         setzen, nur um einen Schalter aufrecht zu stellen. */
      const vorhanden = targetId
        ? marks.find(mark => idOf(mark) === targetId && mark.art === 'zeichen') : null;
      if (vorhanden) {
        const before = snapshot();
        vorhanden.drehung = ((Number(vorhanden.drehung) || 0) + 90) % 360;
        redraw(); commit(before);
        return;
      }
      const gewaehlt = await zeichenWaehlen();
      if (!gewaehlt) return;
      const before = snapshot();
      marks.push({
        id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
        art: 'zeichen', zeichenId: gewaehlt, point,
        groesse: letzteGroesse, drehung: 0, gespiegelt: false, farbe: color
      });
      redraw(); commit(before);
    };

    let letztesZeichen = '';
    let letzteGroesse = 64;

    const zeichenWaehlen = (): Promise<string> => new Promise(fertig => {
      if (typeof Planflaeche === 'undefined' || typeof Register === 'undefined'
        || !Register.fachzeichen) { fertig(''); return; }
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Fachzeichen setzen' +
        '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
        '<div class="mz-suche"><input type="search" placeholder="Symbol suchen …" ' +
        'aria-label="Symbol suchen"></div>' +
        '<div class="mz-groesse"><label>Grösse' +
        `<input type="range" min="24" max="180" step="4" value="${letzteGroesse}" ` +
        'aria-label="Grösse des Zeichens"></label>' +
        `<b>${letzteGroesse} px</b></div>` +
        /* Das zuletzt gesetzte Zeichen steht oben und ist einen Klick weit
           weg. Wer zehn Schalter auf einen Grundriss setzt, sucht sonst
           zehnmal dasselbe. */
        (letztesZeichen
          ? '<div class="mz-zuletzt"><span>Zuletzt</span>' +
            `<button data-sym="${letztesZeichen}">` +
            Register.fachzeichen.alsSvg(letztesZeichen, { farbe: 'currentColor' }) +
            `<i>${(Register.fachzeichen.holen(letztesZeichen) || { name: '' }).name}</i>` +
            '</button></div>'
          : '') +
        '<div class="mz-liste">' + Planflaeche.paletteHtml('installationsplan', '') + '</div>' +
        '</div>';
      document.body.appendChild(o);
      const zu = (wert: string) => { o.remove(); fertig(wert); };
      o.addEventListener('input', e => {
        const f = e.target as HTMLInputElement;
        if (f.type === 'search') {
          const liste = o.querySelector('.mz-liste');
          if (liste) liste.innerHTML = Planflaeche.paletteHtml('installationsplan', f.value);
          return;
        }
        if (f.type === 'range') {
          letzteGroesse = Number(f.value) || 64;
          const marke = o.querySelector('.mz-groesse b');
          if (marke) marke.textContent = letzteGroesse + ' px';
        }
      });
      o.addEventListener('click', e => {
        const sym = (e.target as Element).closest<HTMLElement>('[data-sym]');
        if (sym && sym.dataset.sym) { letztesZeichen = sym.dataset.sym; zu(sym.dataset.sym); return; }
        const b = (e.target as Element).closest<HTMLElement>('[data-a]');
        if (e.target === o || (b && b.dataset.a === 'zu')) zu('');
      });
      const feld = o.querySelector('input[type=search]') as HTMLInputElement | null;
      feld?.focus();
    });

    flaeche.addEventListener('pointerdown', (event: PointerEvent) => {
      const e = event;
      /* Wer hier zeichnet, meint DIESE Fläche — und zwar auch dann, wenn er
         gleich wieder abbricht. Das steht vor dem `return` unten, weil auch
         ein Griff im Modus „Schreiben" eine Berührung ist. */
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(steuerung); } catch { /* egal */ }
      }
      if (tool === 'schreiben' || !e.isPrimary || e.button !== 0) return;
      const point = R.zuBlatt(flaeche, e);
      if (!point) return;
      event.preventDefault();
      flaeche.focus({ preventScroll: true });
      const target = (event.target as Element)?.closest?.('[data-sid]') as SVGElement | null;
      const targetId = target?.getAttribute('data-sid') || '';

      if (tool === 'radierer') {
        const index = marks.findIndex(mark => idOf(mark) === targetId);
        if (index < 0) return;
        const before = snapshot();
        marks.splice(index, 1); target?.remove(); selection.delete(targetId); commit(before);
        return;
      }
      if (tool === 'text') { void editText(point, targetId); return; }
      if (tool === 'zeichen') { void setzeZeichen(point, targetId); return; }
      if (tool === 'select') {
        if (targetId) {
          if (event.shiftKey) selection.has(targetId) ? selection.delete(targetId) : selection.add(targetId);
          else if (!selection.has(targetId)) selection = new Set([targetId]);
          renderSelection();
          if (!selection.has(targetId)) return;
          selectDrag = { mode: 'move', start: point, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
        } else {
          if (!event.shiftKey) { selection.clear(); renderSelection(); }
          selectDrag = { mode: 'box', start: point, end: point, add: event.shiftKey };
          const box = svg('rect', { x: point[0], y: point[1], width: 0, height: 0,
            class: 'blatt-auswahlfeld', 'data-ink-ui': 'box' });
          flaeche.appendChild(box);
        }
        try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
        return;
      }

      beforeRunning = snapshot();
      const id = typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1);
      if (tool === 'stift' || tool === 'marker') {
        running = { id, art: tool, farbe: tool === 'marker' && color === FARBEN[0] ? MARKER_FARBE : color,
          breite: width, pts: [point], pressure: [pressureOf(event)] };
        runningNode = zeichneMarke({ ...running, pts: [point, point], pressure: [pressureOf(event), pressureOf(event)] });
      } else {
        running = { id, art: tool, farbe: color, breite: width, pts: [point, point] };
        runningNode = zeichneMarke(running);
      }
      if (runningNode) flaeche.appendChild(runningNode);
      try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
    });

    flaeche.addEventListener('pointermove', (event: PointerEvent) => {
      if (!event.isPrimary) return;
      const point = R.zuBlatt(flaeche, event);
      if (!point) return;
      if (selectDrag) {
        selectDrag.end = point;
        if (selectDrag.mode === 'move') {
          const dx = point[0] - selectDrag.start[0];
          const dy = point[1] - selectDrag.start[1];
          selectDrag.moved = selectDrag.moved || Math.hypot(dx, dy) > 0.5;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original) continue;
            marks[index] = InkGeometry.move(clone(original), dx, dy);
            updateNode(nodeFor(id), marks[index]);
          }
          renderSelection();
        } else {
          const box = InkGeometry.rectangle(selectDrag.start, point);
          const node = flaeche.querySelector<SVGRectElement>('[data-ink-ui="box"]');
          if (node) Object.entries(box).forEach(([key, value]) => node.setAttribute(key, String(value)));
        }
        return;
      }
      if (!running) return;
      if (running.art === 'stift' || running.art === 'marker') {
        const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
        (coalesced.length ? coalesced : [event]).forEach(addSample);
      } else running.pts[1] = point;
      runningNode = updateNode(runningNode, running.art === 'stift' || running.art === 'marker'
        ? { ...running, pts: running.pts.length > 1 ? running.pts : [running.pts[0], running.pts[0]] }
        : running);
    });
    flaeche.addEventListener('pointerup', finish);
    flaeche.addEventListener('pointercancel', finish);
    flaeche.addEventListener('pointerleave', finish);
    /* Aufdecken per Tipp — NUR im Schreiben-Modus. Die Fläche selbst ist
       dort durchlässig (pointer-events:none), das Band bleibt greifbar,
       weil sein Knoten `pointer-events:all` trägt. In jedem Werkzeug-
       Modus gilt der Tipp dem Werkzeug (zeichnen, radieren, wählen). */
    flaeche.addEventListener('click', (event: MouseEvent) => {
      if (tool !== 'schreiben') return;
      const ziel = (event.target as Element)?.closest?.('[data-ink-art="abdeck"]') as SVGElement | null;
      if (!ziel) return;
      event.preventDefault();
      event.stopPropagation();
      const id = ziel.getAttribute('data-sid') || '';
      if (aufgedeckt.has(id)) aufgedeckt.delete(id);
      else aufgedeckt.add(id);
      abdeckAnwenden();
    });
    flaeche.addEventListener('keydown', (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection.size) {
        event.preventDefault(); deleteSelection();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); event.shiftKey ? redo() : undo();
      }
    });
    registerLayer({ flaeche, abschliessen: finish });

    flaeche.style.pointerEvents = 'none';
    flaeche.setAttribute('tabindex', '-1');
    const setzeWerkzeug = (next: string): void => {
      finish(); tool = next;
      if (tool !== 'select') { selection.clear(); renderSelection(); }
      flaeche.style.pointerEvents = tool === 'schreiben' ? 'none' : 'auto';
      flaeche.setAttribute('data-tool', tool);
      flaeche.setAttribute('tabindex', tool === 'schreiben' ? '-1' : '0');
    };
    const setzeFarbe = (next: string): void => { color = next; };
    const setzeStrich = (next: number): void => { width = next; };
    const beiAenderung = (listener: (next: any) => void): (() => void) => {
      stateListeners.add(listener); listener(state()); return () => stateListeners.delete(listener);
    };

    /* DAS RÜCKGABEOBJEKT BEKOMMT EINEN NAMEN.
       Es stand als Literal im `return` am Ende — und der Lauscher weiter
       oben braucht genau dieses Objekt, um sich beim Kern zu melden. Zwei
       verschiedene Objekte für dieselbe Fläche wären der sichere Weg zu
       einem Knopf, der auf nichts wirkt. */
    const steuerung = { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, marken: marks,
      undo, redo, deleteSelection, beiAenderung, state };
    return steuerung;
  };

  const leiste = (controls: any, extra = ''): HTMLElement => {
    /* DIE FLÄCHE MELDET SICH IM KERN AN (E212).

       Bis hierher wusste nur diese Leiste, welche Fläche sie steuert. Der
       Reiter „Zeichnen" im Menüband konnte deshalb nichts — er hätte nicht
       gewusst, worauf er wirkt (L64).

       `Zeichenziel` im Kern hält jetzt den Zeiger. Diese Datei gibt ihn
       ab und behält alles andere: kein Strich, keine Farbe, keine Marke
       wandert dorthin. Wo die Zeichenlogik an zwei Stellen stünde, liefe
       die zweite irgendwann von der ersten weg. */
    if (typeof Zeichenziel !== 'undefined') {
      try {
        Zeichenziel.melde(controls, 'Zeichenfläche');
        /* WELCHE FARBE UND WELCHE STÄRKE STEHEN GERADE AN.
           Die Leiste malt sie sich gleich selbst mit `.on` an (siehe
           `index === 0` bzw. `index === 1` unten). Sagt sie es dem Kern
           nicht, zeigt das Menüband fünf Farbknöpfe und markiert keinen —
           obwohl hier einer markiert ist. Zwei Anzeigen, ein Zustand. */
        Zeichenziel.uebernehmeFarbe(controls, FARBEN[0]);
        Zeichenziel.uebernehmeStrich(controls, BREITEN[1]);
      } catch { /* ohne Kern geht es wie bisher */ }
    }

    const row = document.createElement('div');
    row.className = 'blatt-reihe';
    const tools = document.createElement('div');
    tools.className = 'blatt-werk';
    const button = (tool: string, icon: string, word: string, title: string) =>
      `<button data-wz="${tool}"${tool === 'schreiben' ? ' class="on"' : ''} title="${title}">` +
      `<span class="zeichen">${icon}</span><span class="wort">${word}</span></button>`;
    tools.innerHTML =
      button('schreiben', '✎', 'Schreiben', 'Schreiben — die Zeichenschicht ist durchlässig') +
      button('select', '⌖', 'Auswahl', 'Marken auswählen, gemeinsam bewegen oder löschen') +
      button('stift', '🖍', 'Stift', 'Freihand mit geglätteter Linie') +
      button('marker', '▰', 'Marker', 'Transparenter Marker') +
      button('line', '╱', 'Linie', 'Gerade Linie') +
      button('arrow', '→', 'Pfeil', 'Pfeil') +
      button('rectangle', '□', 'Rechteck', 'Rechteck') +
      button('ellipse', '○', 'Ellipse', 'Ellipse') +
      button('abdeck', '▬', 'Abdecken',
        'Abdeckband über Lösungen ziehen — Antippen im Schreiben-Modus deckt auf') +
      button('text', 'T', 'Text', 'Textanmerkung') +
      button('zeichen', '⚡', 'Fachzeichen', 'Ein elektrotechnisches Symbol auf die Seite setzen') +
      button('radierer', '⌫', 'Radieren', 'Eine Marke entfernen') +
      '<span class="blatt-trenn"></span>' +
      '<button data-act="undo" title="Rückgängig" disabled><span class="zeichen">↶</span><span class="wort">Zurück</span></button>' +
      '<button data-act="redo" title="Wiederholen" disabled><span class="zeichen">↷</span><span class="wort">Vor</span></button>' +
      '<button data-act="delete" title="Auswahl löschen" disabled><span class="zeichen">🗑</span><span class="wort">Löschen</span></button>' +
      '<span class="blatt-trenn"></span>' +
      FARBEN.map((value, index) => `<button class="blatt-farbe${index === 0 ? ' on' : ''}" ` +
        `data-c="${value}" style="background:${value}" title="Farbe"></button>`).join('') +
      '<span class="blatt-trenn"></span>' +
      /* Doppelter Massstab wie im Menüband: mit der wahren Stärke sahen
         „dünn" (1,2 px) und „mittel" (2,4 px) gleich aus, weil der Boden
         von 2 px den ersten hochzog. Das Verhältnis 1 : 2 : 4 bleibt. */
      BREITEN.map((value, index) => `<button class="blatt-strich${index === 1 ? ' on' : ''}" ` +
        `data-b="${value}" title="Strichbreite ${String(value).replace('.', ',')}">` +
        `<i style="height:${Math.max(2, value * 2)}px"></i></button>`).join('');

    /* SICHTBAR MACHEN, DASS DIE LEISTE ROLLT (E140, §55.1).
       Bei 390 px ist die Leiste 310 px breit und ihr Inhalt 1059 — von 21
       Knöpfen stehen 15 draussen, alle rechts. Gerollt werden kann sie
       längst; nur zeigt das nichts an, und eine abgeschnittene Leiste sieht
       aus wie eine vollständige. Genau dieser Befund steht in §55.1 über die
       Tabellenleiste, und er gilt hier noch einmal.

       `.blatt-fest` hat seinen Schatten für die Seite LINKS. Nach rechts gab
       es nichts — dabei ist beim Öffnen alles Verdeckte rechts.

       Kein Dauerverlauf: der würde am Ende der Leiste eine Andeutung zeigen,
       wo nichts mehr kommt. Die zwei Kennzeichen stehen nur, solange es
       wirklich etwas zu holen gibt.
       Die Rechnung selbst steht in `kern/helfer/rollrand.ts` (E159). Hier
       ist nur zu merken, dass GEROLLT wird `tools`, gezeichnet aber an
       `row` — deshalb `an: row`. */
    Rollrand.binde(tools, { art: 'mehr', an: row });

    const updateState = (next: any): void => {
      const undo = tools.querySelector<HTMLButtonElement>('[data-act="undo"]');
      const redo = tools.querySelector<HTMLButtonElement>('[data-act="redo"]');
      const remove = tools.querySelector<HTMLButtonElement>('[data-act="delete"]');
      if (undo) undo.disabled = !next.undo;
      if (redo) redo.disabled = !next.redo;
      if (remove) remove.disabled = !next.selected;
    };
    controls.beiAenderung?.(updateState);

    /* ZWEI ANSICHTEN DESSELBEN ZUSTANDS (E212, §55.1).

       Diese Leiste markiert ihr Werkzeug selbst, wenn man sie drückt. Wird
       das Werkzeug oben im Menüband gewählt, passiert hier nichts — auf dem
       Bildschirmfoto stand die Fläche längst auf `data-tool="stift"`, das
       Band zeigte „Stift" markiert, und diese Leiste zeigte „Schreiben".
       Gemessen: `[data-wz].on` = schreiben, `.mb-knopf.ist-an` = Stift.

       Wer zwei Anzeigen für einen Zustand baut, muss beide an denselben
       Zustand hängen. Sonst läuft die eine der anderen hinterher, und der
       Nutzer glaubt der falschen.

       `werkzeugVon(controls)` und nicht `jetzt()`: gemeint ist DIESE
       Fläche. Bei zwei Blättern auf einer Seite zeigte `jetzt()` beiden
       Leisten das Werkzeug des zuletzt berührten. */
    const markiere = (): void => {
      if (!tools.isConnected) { Zeichenziel.vergiss(markiere); return; }
      const wz = Zeichenziel.werkzeugVon(controls);
      if (wz) tools.querySelectorAll<HTMLElement>('[data-wz]').forEach(node => {
        node.classList.toggle('on', node.dataset.wz === wz);
      });
      const farbe = Zeichenziel.farbeVon(controls);
      if (farbe) tools.querySelectorAll<HTMLElement>('.blatt-farbe').forEach(node => {
        node.classList.toggle('on', node.dataset.c === farbe);
      });
      const dicke = Zeichenziel.dickeVon(controls);
      if (dicke) tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach(node => {
        node.classList.toggle('on', Number(node.dataset.b) === dicke);
      });
    };
    if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
      try { Zeichenziel.horche(markiere); } catch { /* dann eben nur die Leiste */ }
    }

    /* Ein Klick auf die Leiste heisst: DIESE Fläche ist gemeint. Bei einer
       einzigen ist das gleichgültig, bei drei Blättern auf einer Seite ist
       es die ganze Frage. */
    tools.addEventListener('pointerdown', () => {
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(controls); } catch { /* egal */ }
      }
    }, true);

    tools.addEventListener('click', event => {
      const target = (event.target as HTMLElement)?.closest?.('button') as HTMLButtonElement | null;
      if (!target || target.disabled) return;
      if (target.dataset.wz) {
        controls.setzeWerkzeug(target.dataset.wz);
        /* Auch der Kern muss es wissen — sonst zeigt das Menüband weiter
           das alte Werkzeug an. Derselbe Fehler wie oben, nur andersherum. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(controls, target.dataset.wz); }
          catch { /* egal */ }
        }
        tools.querySelectorAll('[data-wz]').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
        return;
      }
      if (target.dataset.act) {
        if (target.dataset.act === 'undo') controls.undo();
        if (target.dataset.act === 'redo') controls.redo();
        if (target.dataset.act === 'delete') controls.deleteSelection();
        return;
      }
      if (target.dataset.c) {
        controls.setzeFarbe(target.dataset.c);
        /* Dieselbe Gegenrichtung wie beim Werkzeug: sonst stünde oben eine
           Farbe markiert, die niemand mehr benutzt. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehmeFarbe(controls, target.dataset.c); } catch { /* egal */ }
        }
        tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
        return;
      }
      if (target.dataset.b) {
        controls.setzeStrich(Number(target.dataset.b));
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehmeStrich(controls, Number(target.dataset.b)); } catch { /* egal */ }
        }
        tools.querySelectorAll('.blatt-strich').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
      }
    });
    row.appendChild(tools);
    if (extra) {
      const fixed = document.createElement('div');
      fixed.className = 'blatt-fest'; fixed.innerHTML = extra; row.appendChild(fixed);
    }
    return row;
  };

  return { schicht, leiste, zeichneMarke, FARBEN, BREITEN };
})();

(window as any).Marken = Marken;
