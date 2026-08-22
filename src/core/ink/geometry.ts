/* ============================================================================
 * core/ink/geometry.ts — neutrale Geometrie fuer Freihand und Formen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/geometry.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/ink/geometry.js`.
 * ----------------------------------------------------------------------------
 * Diese Datei kennt weder PDF noch Whiteboard noch Store. Sie rechnet nur mit
 * Punkten im jeweiligen Dokumentraum. Dadurch koennen Blatt, PDF-Seite und ein
 * spaeteres Whiteboard dieselben Regeln verwenden, ohne Daten zu importieren
 * oder eine zweite Zeichenmaschine aufzubauen (E125).
 * ==========================================================================*/

type InkPoint = [number, number];
type InkBounds = { x: number; y: number; width: number; height: number };

const InkGeometry = (() => {
  const finite = (value: unknown): number => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const points = (raw: unknown): InkPoint[] => !Array.isArray(raw) ? [] : raw
    .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
    .map((point: any[]) => [finite(point[0]), finite(point[1])] as InkPoint);

  const distanceToSegment = (point: InkPoint, start: InkPoint, end: InkPoint): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
    const amount = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point[0] - (start[0] + amount * dx),
                      point[1] - (start[1] + amount * dy));
  };

  /** Ramer-Douglas-Peucker: weniger Punkte, gleiche sichtbare Linie. */
  const simplify = (raw: unknown, tolerance = 0.8): InkPoint[] => {
    const input = points(raw);
    if (input.length <= 2) return input;
    const keep = new Uint8Array(input.length);
    keep[0] = 1; keep[input.length - 1] = 1;
    const stack: Array<[number, number]> = [[0, input.length - 1]];
    while (stack.length) {
      const [first, last] = stack.pop() as [number, number];
      let farthest = -1;
      let index = -1;
      for (let i = first + 1; i < last; i++) {
        const distance = distanceToSegment(input[i]!, input[first]!, input[last]!);
        if (distance > farthest) { farthest = distance; index = i; }
      }
      if (index > first && farthest > Math.max(0.05, tolerance)) {
        keep[index] = 1;
        stack.push([first, index], [index, last]);
      }
    }
    return input.filter((_point, index) => !!keep[index]);
  };

  /** Ein geglaetteter SVG-Pfad; zwei Punkte bleiben absichtlich eine Linie. */
  const path = (raw: unknown): string => {
    const input = points(raw);
    if (!input.length) return '';
    if (input.length === 1) return `M${input[0]![0]} ${input[0]![1]}`;
    if (input.length === 2)
      return `M${input[0]![0]} ${input[0]![1]} L${input[1]![0]} ${input[1]![1]}`;
    let output = `M${input[0]![0]} ${input[0]![1]}`;
    for (let i = 1; i < input.length - 1; i++) {
      const middle: InkPoint = [
        Math.round((input[i]![0] + input[i + 1]![0]) * 50) / 100,
        Math.round((input[i]![1] + input[i + 1]![1]) * 50) / 100
      ];
      output += ` Q${input[i]![0]} ${input[i]![1]} ${middle[0]} ${middle[1]}`;
    }
    const last = input[input.length - 1];
    return output + ` L${last![0]} ${last![1]}`;
  };

  const rectangle = (start: InkPoint, end: InkPoint): InkBounds => ({
    x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]),
    width: Math.abs(end[0] - start[0]), height: Math.abs(end[1] - start[1])
  });

  const bounds = (mark: any): InkBounds => {
    if (mark?.art === 'text') {
      const point = points([mark.point])[0] || [0, 0];
      const fontSize = Math.max(8, finite(mark.fontSize) || 18);
      const width = Math.max(fontSize, String(mark.text || '').length * fontSize * 0.58);
      return { x: point[0], y: point[1] - fontSize, width, height: fontSize * 1.25 };
    }
    const input = points(mark?.pts);
    if (!input.length) return { x: 0, y: 0, width: 0, height: 0 };
    const xs = input.map(point => point[0]);
    const ys = input.map(point => point[1]);
    const padding = Math.max(2, (finite(mark?.breite) || 2.4) / 2);
    const x = Math.min(...xs) - padding;
    const y = Math.min(...ys) - padding;
    return {
      x, y,
      width: Math.max(padding * 2, Math.max(...xs) - Math.min(...xs) + padding * 2),
      height: Math.max(padding * 2, Math.max(...ys) - Math.min(...ys) + padding * 2)
    };
  };

  const move = (mark: any, dx: number, dy: number): any => {
    if (!mark || typeof mark !== 'object') return mark;
    if (Array.isArray(mark.pts)) mark.pts = points(mark.pts)
      .map(point => [point[0] + finite(dx), point[1] + finite(dy)] as InkPoint);
    if (Array.isArray(mark.point)) {
      const point = points([mark.point])[0] || [0, 0];
      mark.point = [point[0] + finite(dx), point[1] + finite(dy)];
    }
    return mark;
  };

  const intersects = (left: InkBounds, right: InkBounds): boolean =>
    left.x <= right.x + right.width && left.x + left.width >= right.x &&
    left.y <= right.y + right.height && left.y + left.height >= right.y;

  return { points, simplify, path, rectangle, bounds, move, intersects };
})();

(window as any).InkGeometry = InkGeometry;
