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

  /** Wie `simplify`, aber als Liste der INDIZES, die bleiben — damit ein
      zweiter Kanal (der Druck je Punkt) mitwandern kann, statt zum
      Durchschnitt zu werden (E351). */
  const simplifyIndices = (raw: unknown, tolerance = 0.8): number[] => {
    const input = points(raw);
    if (input.length <= 2) return input.map((_point, index) => index);
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
    const out: number[] = [];
    for (let i = 0; i < input.length; i++) if (keep[i]) out.push(i);
    return out;
  };

  /** Eine Seite des Umrisses als geglaettete Kurve (ohne das fuehrende M). */
  const seite = (input: InkPoint[]): string => {
    if (input.length < 2) return '';
    if (input.length === 2) return ` L${input[1]![0]} ${input[1]![1]}`;
    let output = '';
    for (let i = 1; i < input.length - 1; i++) {
      const middle: InkPoint = [
        Math.round((input[i]![0] + input[i + 1]![0]) * 50) / 100,
        Math.round((input[i]![1] + input[i + 1]![1]) * 50) / 100
      ];
      output += ` Q${input[i]![0]} ${input[i]![1]} ${middle[0]} ${middle[1]}`;
    }
    const last = input[input.length - 1]!;
    return output + ` L${last[0]} ${last[1]}`;
  };

  /**
   * DER UMRISS EINES STRICHS MIT VERAENDERLICHER BREITE (E351).
   * Je Punkt eine halbe Breite; links und rechts der Mittellinie entsteht
   * eine Kontur, vorn und hinten eine runde Kappe. Das Ergebnis ist eine
   * FLAECHE (fill), kein Strich (stroke) — so kann ein Fueller anschwellen
   * und auslaufen, wie es der Druck sagt. Die Punkte bleiben, was sie sind:
   * die Mittellinie, die auch der alte Zeichner kennt.
   */
  const outline = (raw: unknown, halfWidths: number[]): string => {
    const input = points(raw);
    const n = input.length;
    if (n < 2) return '';
    const links: InkPoint[] = [];
    const rechts: InkPoint[] = [];
    const halb = (i: number): number => {
      const w = Number(halfWidths[Math.min(i, halfWidths.length - 1)]);
      return Math.max(0.15, Number.isFinite(w) ? w : 1);
    };
    const r2 = (v: number): number => Math.round(v * 100) / 100;
    for (let i = 0; i < n; i++) {
      const prev = input[Math.max(0, i - 1)]!;
      const next = input[Math.min(n - 1, i + 1)]!;
      let tx = next[0] - prev[0];
      let ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      const w = halb(i);
      links.push([r2(input[i]![0] - ty * w), r2(input[i]![1] + tx * w)]);
      rechts.push([r2(input[i]![0] + ty * w), r2(input[i]![1] - tx * w)]);
    }
    const ende = halb(n - 1);
    const anfang = halb(0);
    const rueck = [...rechts].reverse();
    return `M${links[0]![0]} ${links[0]![1]}` + seite(links) +
      ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rueck[0]![0]} ${rueck[0]![1]}` +
      seite(rueck) +
      ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0]![0]} ${links[0]![1]} Z`;
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

  /* DER TEXTKASTEN (E360, L115 Punkt 6): ein Text mit `breiteBox` bricht
   * an dieser Breite um. Die Zeilen werden HIER gerechnet — deterministisch,
   * ohne DOM und ohne Schriftmessung: dieselbe Rechnung fuer Bildschirm,
   * Druck, Auswahlkasten und Treffer. Die Breite eines Zeichens ist eine
   * Schaetzung je Schriftart (in em); sie muss nicht stimmen, sie muss
   * ueberall dieselbe sein. Gebrochen wird an Leerzeichen, ein zu langes
   * Wort an der Breite. */
  const CHAR_EM: Record<string, number> = { standard: 0.55, serif: 0.52, mono: 0.6, hand: 0.58, schmal: 0.45 };
  const TEXT_ZEILE = 1.25;
  const charWidth = (ch: string, family: string, bold: boolean): number => {
    const base = CHAR_EM[family] ?? 0.55;
    let f = 1;
    if (family !== 'mono') {
      if (" .,:;'|!ijltIfr".includes(ch)) f = 0.55;
      else if ('mwMW'.includes(ch)) f = 1.55;
      else if ((ch >= 'A' && ch <= 'Z') || 'ÄÖÜ'.includes(ch)) f = 1.25;
    }
    return base * f * (bold ? 1.06 : 1);
  };
  const textWidth = (text: string, fontSize: number, family = 'standard', bold = false): number => {
    let w = 0;
    for (const ch of String(text ?? '')) w += charWidth(ch, family, bold);
    return w * fontSize;
  };
  const textLines = (text: string, width: number, fontSize: number, family = 'standard', bold = false): string[] => {
    const lines: string[] = [];
    const max = Math.max(1, finite(width));
    const passt = (probe: string): boolean => textWidth(probe, fontSize, family, bold) <= max;
    for (const raw of String(text ?? '').split(/\r?\n/)) {
      let line = '';
      for (const word of raw.split(' ')) {
        const probe = line ? line + ' ' + word : word;
        if (passt(probe)) { line = probe; continue; }
        if (line) { lines.push(line); line = ''; }
        /* Ein Wort, das allein nicht passt, bricht an der Breite. */
        let part = '';
        for (const ch of word) {
          if (part && !passt(part + ch)) { lines.push(part); part = ''; }
          part += ch;
        }
        line = part;
      }
      lines.push(line);
    }
    return lines;
  };
  type TextLayout = { x: number; y: number; width: number; height: number; pad: number; zeile: number;
    fontSize: number; family: string; bold: boolean; lines: string[] };
  /** Kasten, Zeilen und Masse eines Textkastens — oder null fuer eine alte, einzeilige Textmarke. */
  const textLayout = (mark: any): TextLayout | null => {
    const width = finite(mark?.breiteBox);
    if (!(width > 0)) return null;
    const point = points([mark.point])[0] || [0, 0];
    const fontSize = Math.max(8, finite(mark.fontSize) || 18);
    const pad = Math.round(fontSize * 0.35);
    const family = String(mark.schrift || 'standard');
    const bold = !!mark.fett;
    const lines = textLines(String(mark.text || ''), width - pad * 2, fontSize, family, bold);
    return { x: point[0], y: point[1], width, height: pad * 2 + lines.length * fontSize * TEXT_ZEILE,
      pad, zeile: fontSize * TEXT_ZEILE, fontSize, family, bold, lines };
  };

  const bounds = (mark: any): InkBounds => {
    if (mark?.art === 'text') {
      const layout = textLayout(mark);
      if (layout) return { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
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

  /** Der kleinste Abstand eines Punktes zu einem Linienzug (ein Punkt: zu ihm). */
  const distanceToPolyline = (raw: unknown, point: InkPoint): number => {
    const input = points(raw);
    if (!input.length) return Infinity;
    if (input.length === 1) return Math.hypot(point[0] - input[0]![0], point[1] - input[0]![1]);
    let best = Infinity;
    for (let i = 1; i < input.length; i++)
      best = Math.min(best, distanceToSegment(point, input[i - 1]!, input[i]!));
    return best;
  };

  /**
   * TRIFFT DER RADIERER DIESE MARKE? (E352)
   * Linienzuege (Stift, Marker, Linie, Pfeil) werden am Weg gemessen, die
   * halbe Strichbreite als Zugabe; alles andere (Rechteck, Ellipse, Band,
   * Zettel, Text, Zeichen) am Kasten, den `bounds` kennt.
   */
  const touchesCircle = (mark: any, center: InkPoint, radius: number, halfWidth = 0): boolean => {
    const art = String(mark?.art || '');
    const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
    if (linie && Array.isArray(mark?.pts) && mark.pts.length)
      return distanceToPolyline(mark.pts, center) <= radius + Math.max(0, finite(halfWidth));
    const box = bounds(mark);
    const dx = Math.max(box.x - center[0], 0, center[0] - (box.x + box.width));
    const dy = Math.max(box.y - center[1], 0, center[1] - (box.y + box.height));
    return dx * dx + dy * dy <= radius * radius;
  };

  /** Die Parameter t (aufsteigend), an denen die Strecke a→b den Kreis
      schneidet — oder null, wenn ihre Gerade den Kreis verfehlt. */
  const circleCuts = (a: InkPoint, b: InkPoint, center: InkPoint, radius: number): [number, number] | null => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const fx = a[0] - center[0], fy = a[1] - center[1];
    const qa = dx * dx + dy * dy;
    if (!qa) return null;
    const qb = 2 * (fx * dx + fy * dy);
    const qc = fx * fx + fy * fy - radius * radius;
    const disc = qb * qb - 4 * qa * qc;
    if (disc < 0) return null;
    const wurzel = Math.sqrt(disc);
    return [(-qb - wurzel) / (2 * qa), (-qb + wurzel) / (2 * qa)];
  };

  /**
   * TEIL-RADIEREN (E352): ein Linienzug minus ein Kreis. Uebrig bleiben
   * null, ein oder mehrere Stuecke — jedes mit seinen Druckwerten, an den
   * Schnittpunkten linear dazwischen gerechnet. Ein Stueck braucht zwei
   * Punkte; ein einzelner Rest faellt weg. Punkte, die der Kreis nicht
   * beruehrt, bleiben exakt, was sie waren.
   */
  const splitByCircle = (raw: unknown, pressures: unknown, center: InkPoint, radius: number):
      Array<{ pts: InkPoint[]; pressure: number[] }> => {
    const input = points(raw);
    const druck = Array.isArray(pressures) ? pressures.map(finite) : [];
    const druckBei = (i: number): number =>
      druck.length ? (druck[Math.min(i, druck.length - 1)] as number) : 0.5;
    const r2 = (v: number): number => Math.round(v * 100) / 100;
    const inside = (p: InkPoint): boolean => Math.hypot(p[0] - center[0], p[1] - center[1]) <= radius;
    const zwischen = (a: InkPoint, b: InkPoint, t: number): InkPoint =>
      [r2(a[0] + (b[0] - a[0]) * t), r2(a[1] + (b[1] - a[1]) * t)];
    const stuecke: Array<{ pts: InkPoint[]; pressure: number[] }> = [];
    let aktuell: { pts: InkPoint[]; pressure: number[] } = { pts: [], pressure: [] };
    const ablegen = (): void => {
      if (aktuell.pts.length >= 2) stuecke.push(aktuell);
      aktuell = { pts: [], pressure: [] };
    };
    if (!input.length) return stuecke;
    if (!inside(input[0]!)) { aktuell.pts.push(input[0]!); aktuell.pressure.push(r2(druckBei(0))); }
    for (let i = 1; i < input.length; i++) {
      const a = input[i - 1]!, b = input[i]!;
      const aDrin = inside(a), bDrin = inside(b);
      const da = druckBei(i - 1), db = druckBei(i);
      const cuts = circleCuts(a, b, center, radius);
      const klemm = (t: number): number => Math.max(0, Math.min(1, t));
      if (aDrin && bDrin) continue;
      if (!aDrin && bDrin) {
        /* hinein: das Stueck endet am Eintrittspunkt */
        const t = klemm(cuts ? cuts[0] : 0);
        aktuell.pts.push(zwischen(a, b, t)); aktuell.pressure.push(r2(da + (db - da) * t));
        ablegen();
        continue;
      }
      if (aDrin && !bDrin) {
        /* heraus: ein neues Stueck beginnt am Austrittspunkt */
        const t = klemm(cuts ? cuts[1] : 1);
        aktuell = { pts: [zwischen(a, b, t)], pressure: [r2(da + (db - da) * t)] };
        aktuell.pts.push(b); aktuell.pressure.push(r2(db));
        continue;
      }
      /* beide draussen: kreuzt die Strecke den Kreis mittendrin? */
      if (cuts && cuts[0] > 0 && cuts[0] < 1 && cuts[1] > 0 && cuts[1] < 1) {
        aktuell.pts.push(zwischen(a, b, cuts[0])); aktuell.pressure.push(r2(da + (db - da) * cuts[0]));
        ablegen();
        aktuell = { pts: [zwischen(a, b, cuts[1])], pressure: [r2(da + (db - da) * cuts[1])] };
      }
      aktuell.pts.push(b); aktuell.pressure.push(r2(db));
    }
    ablegen();
    return stuecke;
  };

  /** Liegt der Punkt in dem geschlossenen Linienzug? Strahl nach rechts,
      Kanten gezaehlt (E353, das Lasso). */
  const insidePolygon = (point: InkPoint, polygon: unknown): boolean => {
    const poly = points(polygon);
    const n = poly.length;
    if (n < 3) return false;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      const kreuzt = (yi > point[1]) !== (yj > point[1]) &&
        point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-9) + xi;
      if (kreuzt) inside = !inside;
    }
    return inside;
  };

  /** Die Flaeche eines geschlossenen Linienzugs (Schnuerband-Formel, ohne Vorzeichen). */
  const polygonArea = (polygon: unknown): number => {
    const poly = points(polygon);
    if (poly.length < 3) return 0;
    let summe = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
      summe += poly[j]![0] * poly[i]![1] - poly[i]![0] * poly[j]![1];
    return Math.abs(summe) / 2;
  };

  /** Der gemeinsame Kasten mehrerer Kaesten; ohne Kaesten ein leerer. */
  const union = (boxes: InkBounds[]): InkBounds => {
    if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
    const x0 = Math.min(...boxes.map(b => b.x));
    const y0 = Math.min(...boxes.map(b => b.y));
    const x1 = Math.max(...boxes.map(b => b.x + b.width));
    const y1 = Math.max(...boxes.map(b => b.y + b.height));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  /**
   * SKALIEREN UM EINEN ANKER (E353): Punkte und Textpunkt wandern vom
   * Anker weg oder zu ihm hin; Strichbreite und Schriftgroesse folgen mit
   * dem geometrischen Mittel beider Faktoren, damit ein dreimal so grosser
   * Schriftzug nicht mit haarduennem Strich dasteht. Aendert die Marke
   * selbst und gibt sie zurueck, wie `move`.
   */
  const scale = (mark: any, anchor: InkPoint, sx: number, sy: number): any => {
    if (!mark || typeof mark !== 'object') return mark;
    const r2 = (v: number): number => Math.round(v * 100) / 100;
    const fx = Number.isFinite(sx) ? sx : 1;
    const fy = Number.isFinite(sy) ? sy : 1;
    const f = (p: InkPoint): InkPoint =>
      [r2(anchor[0] + (p[0] - anchor[0]) * fx), r2(anchor[1] + (p[1] - anchor[1]) * fy)];
    if (Array.isArray(mark.pts)) mark.pts = points(mark.pts).map(f);
    if (Array.isArray(mark.point)) mark.point = f(points([mark.point])[0] || [0, 0]);
    const mittel = Math.sqrt(Math.abs(fx * fy)) || 1;
    if (mark.breite !== undefined && Number.isFinite(Number(mark.breite)))
      mark.breite = Math.max(0.3, r2(Number(mark.breite) * mittel));
    if (mark.fontSize !== undefined && Number.isFinite(Number(mark.fontSize)))
      mark.fontSize = Math.max(6, r2(Number(mark.fontSize) * mittel));
    if (mark.groesse !== undefined && Number.isFinite(Number(mark.groesse)))
      mark.groesse = Math.max(12, r2(Number(mark.groesse) * mittel));
    /* Der Textkasten (E360) waechst in der Breite mit — die Schrift mit dem Mittel. */
    if (mark.breiteBox !== undefined && Number.isFinite(Number(mark.breiteBox)))
      mark.breiteBox = Math.max(24, r2(Number(mark.breiteBox) * Math.abs(fx)));
    return mark;
  };

  return { points, simplify, simplifyIndices, outline, path, rectangle, bounds, move, intersects,
    distanceToPolyline, touchesCircle, splitByCircle, insidePolygon, polygonArea, union, scale,
    textWidth, textLines, textLayout };
})();

(window as any).InkGeometry = InkGeometry;
