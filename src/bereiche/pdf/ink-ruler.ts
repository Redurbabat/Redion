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
    let active = false, x = width / 2, y = Math.min(height * .4, width * .65), angle = 0;
    let edge: number | null = null;
    const half = width * .65, depth = 64;
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
    const turn = document.createElementNS(ns, 'circle'); turn.setAttribute('cx', String(Math.min(half - 30, width * .33))); turn.setAttribute('cy', '36'); turn.setAttribute('r', '22'); rotate.append(turn);
    const arrow = document.createElementNS(ns, 'text'); arrow.setAttribute('x', turn.getAttribute('cx')!); arrow.setAttribute('y', '41'); arrow.setAttribute('text-anchor', 'middle'); arrow.textContent = '↻'; rotate.append(arrow);
    rotate.addEventListener('click', event => { event.stopPropagation(); angle = (angle + 15) % 180; render(); });
    rotate.addEventListener('keydown', event => { const key = (event as KeyboardEvent).key; if (key === 'Enter' || key === ' ') { event.preventDefault(); event.stopPropagation(); angle = (angle + 15) % 180; render(); } });
    const local = (event: PointerEvent): [number, number] | null => {
      const matrix = surface.getScreenCTM(); if (!matrix) return null;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      return [point.x, point.y];
    };
    let drag: { id: number; x: number; y: number; start: [number, number] } | null = null;
    group.addEventListener('pointerdown', event => {
      const e = event as PointerEvent;
      event.stopPropagation();
      if (e.button !== 0 || (e.target as Element).closest('.blatt-ruler-rotate')) return;
      const point = local(e); if (!point) return;
      event.preventDefault(); group.focus();
      drag = { id: e.pointerId, x, y, start: point }; group.setPointerCapture(e.pointerId);
    });
    group.addEventListener('pointermove', event => {
      event.stopPropagation(); const e = event as PointerEvent;
      if (!drag || drag.id !== e.pointerId) return;
      const point = local(e); if (!point) return;
      x = Math.max(0, Math.min(width, drag.x + point[0] - drag.start[0]));
      y = Math.max(0, Math.min(height - depth, drag.y + point[1] - drag.start[1])); render();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) group.addEventListener(name, event => { event.stopPropagation(); drag = null; });
    group.addEventListener('click', event => event.stopPropagation());
    group.addEventListener('keydown', event => {
      const e = event as KeyboardEvent;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      event.preventDefault(); event.stopPropagation();
      const sign = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
      if (e.shiftKey) angle = (angle + sign * 15 + 360) % 360;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') x = Math.max(0, Math.min(width, x + sign * 5));
      else y = Math.max(0, Math.min(height - depth, y + sign * 5));
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
    return {
      setActive(value: boolean) { active = value; edge = null; if (active) { surface.append(group); render(); } else group.remove(); },
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
