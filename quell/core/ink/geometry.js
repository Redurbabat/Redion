"use strict";
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
const InkGeometry = (() => {
    const finite = (value) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    };
    const points = (raw) => !Array.isArray(raw) ? [] : raw
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map((point) => [finite(point[0]), finite(point[1])]);
    const distanceToSegment = (point, start, end) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (!dx && !dy)
            return Math.hypot(point[0] - start[0], point[1] - start[1]);
        const amount = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy));
    };
    /** Ramer-Douglas-Peucker: weniger Punkte, gleiche sichtbare Linie. */
    const simplify = (raw, tolerance = 0.8) => {
        const input = points(raw);
        if (input.length <= 2)
            return input;
        const keep = new Uint8Array(input.length);
        keep[0] = 1;
        keep[input.length - 1] = 1;
        const stack = [[0, input.length - 1]];
        while (stack.length) {
            const [first, last] = stack.pop();
            let farthest = -1;
            let index = -1;
            for (let i = first + 1; i < last; i++) {
                const distance = distanceToSegment(input[i], input[first], input[last]);
                if (distance > farthest) {
                    farthest = distance;
                    index = i;
                }
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
    const simplifyIndices = (raw, tolerance = 0.8) => {
        const input = points(raw);
        if (input.length <= 2)
            return input.map((_point, index) => index);
        const keep = new Uint8Array(input.length);
        keep[0] = 1;
        keep[input.length - 1] = 1;
        const stack = [[0, input.length - 1]];
        while (stack.length) {
            const [first, last] = stack.pop();
            let farthest = -1;
            let index = -1;
            for (let i = first + 1; i < last; i++) {
                const distance = distanceToSegment(input[i], input[first], input[last]);
                if (distance > farthest) {
                    farthest = distance;
                    index = i;
                }
            }
            if (index > first && farthest > Math.max(0.05, tolerance)) {
                keep[index] = 1;
                stack.push([first, index], [index, last]);
            }
        }
        const out = [];
        for (let i = 0; i < input.length; i++)
            if (keep[i])
                out.push(i);
        return out;
    };
    /** Eine Seite des Umrisses als geglaettete Kurve (ohne das fuehrende M). */
    const seite = (input) => {
        if (input.length < 2)
            return '';
        if (input.length === 2)
            return ` L${input[1][0]} ${input[1][1]}`;
        let output = '';
        for (let i = 1; i < input.length - 1; i++) {
            const middle = [
                Math.round((input[i][0] + input[i + 1][0]) * 50) / 100,
                Math.round((input[i][1] + input[i + 1][1]) * 50) / 100
            ];
            output += ` Q${input[i][0]} ${input[i][1]} ${middle[0]} ${middle[1]}`;
        }
        const last = input[input.length - 1];
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
    const outline = (raw, halfWidths) => {
        const input = points(raw);
        const n = input.length;
        if (n < 2)
            return '';
        const links = [];
        const rechts = [];
        const halb = (i) => {
            const w = Number(halfWidths[Math.min(i, halfWidths.length - 1)]);
            return Math.max(0.15, Number.isFinite(w) ? w : 1);
        };
        const r2 = (v) => Math.round(v * 100) / 100;
        for (let i = 0; i < n; i++) {
            const prev = input[Math.max(0, i - 1)];
            const next = input[Math.min(n - 1, i + 1)];
            let tx = next[0] - prev[0];
            let ty = next[1] - prev[1];
            const len = Math.hypot(tx, ty) || 1;
            tx /= len;
            ty /= len;
            const w = halb(i);
            links.push([r2(input[i][0] - ty * w), r2(input[i][1] + tx * w)]);
            rechts.push([r2(input[i][0] + ty * w), r2(input[i][1] - tx * w)]);
        }
        const ende = halb(n - 1);
        const anfang = halb(0);
        const rueck = [...rechts].reverse();
        return `M${links[0][0]} ${links[0][1]}` + seite(links) +
            ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rueck[0][0]} ${rueck[0][1]}` +
            seite(rueck) +
            ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0][0]} ${links[0][1]} Z`;
    };
    /** Ein geglaetteter SVG-Pfad; zwei Punkte bleiben absichtlich eine Linie. */
    const path = (raw) => {
        const input = points(raw);
        if (!input.length)
            return '';
        if (input.length === 1)
            return `M${input[0][0]} ${input[0][1]}`;
        if (input.length === 2)
            return `M${input[0][0]} ${input[0][1]} L${input[1][0]} ${input[1][1]}`;
        let output = `M${input[0][0]} ${input[0][1]}`;
        for (let i = 1; i < input.length - 1; i++) {
            const middle = [
                Math.round((input[i][0] + input[i + 1][0]) * 50) / 100,
                Math.round((input[i][1] + input[i + 1][1]) * 50) / 100
            ];
            output += ` Q${input[i][0]} ${input[i][1]} ${middle[0]} ${middle[1]}`;
        }
        const last = input[input.length - 1];
        return output + ` L${last[0]} ${last[1]}`;
    };
    const rectangle = (start, end) => ({
        x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]),
        width: Math.abs(end[0] - start[0]), height: Math.abs(end[1] - start[1])
    });
    const bounds = (mark) => {
        if (mark?.art === 'text') {
            const point = points([mark.point])[0] || [0, 0];
            const fontSize = Math.max(8, finite(mark.fontSize) || 18);
            const width = Math.max(fontSize, String(mark.text || '').length * fontSize * 0.58);
            return { x: point[0], y: point[1] - fontSize, width, height: fontSize * 1.25 };
        }
        const input = points(mark?.pts);
        if (!input.length)
            return { x: 0, y: 0, width: 0, height: 0 };
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
    const move = (mark, dx, dy) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        if (Array.isArray(mark.pts))
            mark.pts = points(mark.pts)
                .map(point => [point[0] + finite(dx), point[1] + finite(dy)]);
        if (Array.isArray(mark.point)) {
            const point = points([mark.point])[0] || [0, 0];
            mark.point = [point[0] + finite(dx), point[1] + finite(dy)];
        }
        return mark;
    };
    const intersects = (left, right) => left.x <= right.x + right.width && left.x + left.width >= right.x &&
        left.y <= right.y + right.height && left.y + left.height >= right.y;
    return { points, simplify, simplifyIndices, outline, path, rectangle, bounds, move, intersects };
})();
window.InkGeometry = InkGeometry;
