"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ink/shapes.ts (npm run bauen:ts). */
const InkShapes = (() => {
    const points = (raw) => !Array.isArray(raw) ? [] : raw
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map((point) => [Number(point[0]) || 0, Number(point[1]) || 0]);
    const distanceToSegment = (point, start, end) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (!dx && !dy)
            return Math.hypot(point[0] - start[0], point[1] - start[1]);
        const amount = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy));
    };
    const pathLength = (input) => {
        let sum = 0;
        for (let i = 1; i < input.length; i++)
            sum += Math.hypot(input[i][0] - input[i - 1][0], input[i][1] - input[i - 1][1]);
        return sum;
    };
    const r2 = (value) => Math.round(value * 100) / 100;
    const recognize = (raw) => {
        const input = points(raw);
        const n = input.length;
        if (n < 8)
            return null;
        const xs = input.map(p => p[0]);
        const ys = input.map(p => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        const w = x1 - x0, h = y1 - y0;
        const diag = Math.hypot(w, h);
        if (diag < 12)
            return null;
        const first = input[0];
        const last = input[n - 1];
        const chord = Math.hypot(last[0] - first[0], last[1] - first[1]);
        const length = pathLength(input);
        if (length <= 0)
            return null;
        if (chord >= 0.9 * length) {
            let worst = 0;
            for (const p of input)
                worst = Math.max(worst, distanceToSegment(p, first, last));
            if (worst <= Math.max(3, 0.05 * length))
                return { art: 'line', pts: [[r2(first[0]), r2(first[1])], [r2(last[0]), r2(last[1])]] };
            return null;
        }
        const closed = chord <= 0.2 * diag && length >= 1.5 * diag;
        if (!closed)
            return null;
        const nah = 0.06 * diag;
        const anKante = input.filter(p => Math.min(Math.abs(p[0] - x0), Math.abs(p[0] - x1), Math.abs(p[1] - y0), Math.abs(p[1] - y1)) <= nah).length;
        const ecken = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
        const eckenBesucht = ecken.every(e => input.some(p => Math.hypot(p[0] - e[0], p[1] - e[1]) <= 0.08 * diag));
        if (anKante >= 0.85 * n && eckenBesucht)
            return { art: 'rectangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
        const eckA = first;
        let eckB = first, weit = 0;
        for (const p of input) {
            const d = Math.hypot(p[0] - eckA[0], p[1] - eckA[1]);
            if (d > weit) {
                weit = d;
                eckB = p;
            }
        }
        let eckC = first, weitC = 0;
        for (const p of input) {
            const d = distanceToSegment(p, eckA, eckB);
            if (d > weitC) {
                weitC = d;
                eckC = p;
            }
        }
        if (weitC > 0.12 * diag) {
            const kanten = [[eckA, eckB], [eckB, eckC], [eckC, eckA]];
            const nahKante = 0.09 * diag;
            const anDreieck = input.filter(p => Math.min(...kanten.map(k => distanceToSegment(p, k[0], k[1]))) <= nahKante).length;
            const flaeche = Math.abs((eckB[0] - eckA[0]) * (eckC[1] - eckA[1])
                - (eckC[0] - eckA[0]) * (eckB[1] - eckA[1])) / 2;
            const kasten = Math.max(1, w * h);
            const drei = [eckA, eckB, eckC].sort((p, q) => p[1] - q[1]);
            const spitze = drei[0], unten1 = drei[1], unten2 = drei[2];
            const aufrecht = spitze[1] <= y0 + 0.25 * h
                && unten1[1] >= y0 + 0.7 * h && unten2[1] >= y0 + 0.7 * h
                && Math.abs(spitze[0] - (x0 + w / 2)) <= 0.28 * w;
            const istDreieck = anDreieck >= 0.82 * n && flaeche <= 0.62 * kasten;
            const gedrehtesDreieck = () => {
                if (!istDreieck)
                    return null;
                const seite = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
                const ecken = [eckA, eckB, eckC];
                const lagen = [];
                for (let i = 0; i < 3; i++) {
                    const S = ecken[i], B1 = ecken[(i + 1) % 3], B2 = ecken[(i + 2) % 3];
                    const l1 = seite(S, B1), l2 = seite(S, B2);
                    const fehler = Math.abs(l1 - l2) / Math.max(1, Math.max(l1, l2));
                    const M = [(B1[0] + B2[0]) / 2, (B1[1] + B2[1]) / 2];
                    const breite = seite(B1, B2);
                    const laenge = seite(S, M);
                    const hoehe = distanceToSegment(S, B1, B2) || laenge;
                    if (!(breite > 1) || !(hoehe > 1) || !(laenge > 0))
                        continue;
                    const ux = (S[0] - M[0]) / laenge, uy = (S[1] - M[1]) / laenge;
                    let grad = Math.atan2(ux, -uy) * 180 / Math.PI;
                    if (grad > 180)
                        grad -= 360;
                    if (grad <= -180)
                        grad += 360;
                    lagen.push({ fehler, grad, breite, hoehe,
                        cx: M[0] + ux * hoehe / 2, cy: M[1] + uy * hoehe / 2 });
                }
                if (!lagen.length)
                    return null;
                const besterFehler = Math.min(...lagen.map(l => l.fehler));
                const w = lagen.filter(l => l.fehler <= besterFehler + 0.06)
                    .sort((a, b) => Math.abs(a.grad) - Math.abs(b.grad))[0];
                const { grad, breite, hoehe, cx, cy } = w;
                if (Math.abs(grad) < 4)
                    return { art: 'triangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
                return { art: 'triangle', dreh: r2(grad),
                    pts: [[r2(cx - breite / 2), r2(cy - hoehe / 2)], [r2(cx + breite / 2), r2(cy + hoehe / 2)]] };
            };
            const schief = gedrehtesDreieck();
            if (schief)
                return schief;
            if (istDreieck && aufrecht)
                return { art: 'triangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
        }
        const cx = x0 + w / 2, cy = y0 + h / 2;
        const rx = Math.max(1, w / 2), ry = Math.max(1, h / 2);
        let abweichung = 0;
        for (const p of input)
            abweichung += Math.abs(Math.hypot((p[0] - cx) / rx, (p[1] - cy) / ry) - 1);
        abweichung /= n;
        if (abweichung <= 0.12) {
            if (Math.abs(w - h) <= 0.12 * Math.max(w, h)) {
                const r = (w + h) / 4;
                return { art: 'ellipse', pts: [[r2(cx - r), r2(cy - r)], [r2(cx + r), r2(cy + r)]] };
            }
            return { art: 'ellipse', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
        }
        return null;
    };
    return { recognize };
})();
window.InkShapes = InkShapes;
