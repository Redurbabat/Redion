"use strict";
/* ============================================================================
 * core/ink/shapes.ts — Formerkennung fuer Freihandstriche (E355)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/shapes.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/ink/shapes.js`.
 * ----------------------------------------------------------------------------
 * Wer in GoodNotes einen Kreis zieht und am Ende kurz haelt, bekommt einen
 * Kreis. Diese Datei beantwortet nur die geometrische Frage: Ist dieser
 * Linienzug eine LINIE, eine ELLIPSE (ein Kreis), ein RECHTECK oder ein
 * DREIECK (E471) — und wenn ja, mit welchen zwei Punkten? Ob gehalten wurde, ob der Schalter an ist,
 * welches Werkzeug fuehrte: das entscheidet die Zeichenschicht. Diese Datei
 * kennt weder Store noch DOM noch Zeit (E125, wie geometry.ts).
 *
 * Die Schwellen sind Erfahrungswerte, keine Masse. Sie sind so gewaehlt, dass
 * eine mit der Hand gezogene Form erkannt wird und ein Gekritzel nicht — die
 * Prueflaeufe in test347 halten beide Seiten fest.
 * ==========================================================================*/
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
    /**
     * ERKENNEN. Gibt die Form mit ihren zwei Punkten zurueck — Linie: Anfang
     * und Ende; Ellipse und Rechteck: die zwei Ecken ihres Kastens — oder
     * null, wenn der Zug keine der drei Formen ist.
     *
     *   Linie:    die Sehne ist fast der ganze Weg, und kein Punkt liegt weit
     *             neben ihr.
     *   Rechteck: der Zug ist geschlossen, fast alle Punkte liegen nahe an den
     *             vier Kanten des Kastens, und jede Ecke ist besucht.
     *   Ellipse:  der Zug ist geschlossen, und die Punkte halten ihren Abstand
     *             zur Mitte (auf die Halbachsen bezogen). Ist der Kasten fast
     *             quadratisch, wird ein Kreis daraus — der Kasten wird zum
     *             Quadrat um dieselbe Mitte.
     */
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
        /* LINIE */
        if (chord >= 0.9 * length) {
            let worst = 0;
            for (const p of input)
                worst = Math.max(worst, distanceToSegment(p, first, last));
            if (worst <= Math.max(3, 0.05 * length))
                return { art: 'line', pts: [[r2(first[0]), r2(first[1])], [r2(last[0]), r2(last[1])]] };
            return null;
        }
        /* GESCHLOSSEN? Anfang und Ende nahe beieinander, und der Weg ist
           laenger als der Umfang eines Halbbogens — sonst ist es ein Haken. */
        const closed = chord <= 0.2 * diag && length >= 1.5 * diag;
        if (!closed)
            return null;
        /* RECHTECK: fast alle Punkte nahe an den Kanten, und jede Ecke wirklich
           besucht. Die Ecke ist das Mass: ein Kreis kommt seinen Kastenecken nie
           naeher als 0,41 mal seinen Radius — bei 0,08 der Diagonale bleibt er
           draussen (der erste Entwurf liess ihn mit 0,18 hinein, und test347 §1
           sah einen Kreis als Rechteck). */
        const nah = 0.06 * diag;
        const anKante = input.filter(p => Math.min(Math.abs(p[0] - x0), Math.abs(p[0] - x1), Math.abs(p[1] - y0), Math.abs(p[1] - y1)) <= nah).length;
        const ecken = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
        const eckenBesucht = ecken.every(e => input.some(p => Math.hypot(p[0] - e[0], p[1] - e[1]) <= 0.08 * diag));
        if (anKante >= 0.85 * n && eckenBesucht)
            return { art: 'rectangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
        /* ══ DREIECK (E471) ═══════════════════════════════════════════════════
           Vor der Ellipse, weil ein Dreieck seinen Abstand zur Mitte NICHT
           haelt und sonst als Ellipse durchginge, wenn die Schwelle je
           weicher wird. Drei Ecken werden so gesucht, wie man es von Hand
           taete: der Punkt am weitesten vom Anfang (B), dann der Punkt am
           weitesten von der Strecke A–B (C). Bei einem Dreieck sind das seine
           Ecken; bei allem anderen liegen die uebrigen Punkte nicht auf den
           drei Kanten.
    
           NUR AUFRECHTE DREIECKE. Redions `triangle`-Marke ist gleichschenklig
           mit der Spitze oben in der Mitte (E465) — sie kann gar keine andere
           Lage beschreiben. Ein auf den Kopf gezogenes Dreieck bekaeme also
           eine Spitze, die es nicht gezogen hat; darum bleibt es ein Strich.
           Was fehlt, steht in L133. */
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
            /* Die Flaeche sagt, dass es KEIN Rechteck ist: ein Dreieck deckt
               hoechstens die halbe Kastenflaeche, ein Rechteck fast die ganze. */
            const flaeche = Math.abs((eckB[0] - eckA[0]) * (eckC[1] - eckA[1])
                - (eckC[0] - eckA[0]) * (eckB[1] - eckA[1])) / 2;
            const kasten = Math.max(1, w * h);
            const drei = [eckA, eckB, eckC].sort((p, q) => p[1] - q[1]);
            const spitze = drei[0], unten1 = drei[1], unten2 = drei[2];
            const aufrecht = spitze[1] <= y0 + 0.25 * h
                && unten1[1] >= y0 + 0.7 * h && unten2[1] >= y0 + 0.7 * h
                && Math.abs(spitze[0] - (x0 + w / 2)) <= 0.28 * w;
            if (anDreieck >= 0.82 * n && flaeche <= 0.62 * kasten && aufrecht)
                return { art: 'triangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
        }
        /* ELLIPSE: die Punkte halten ihren Abstand zur Mitte. */
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
