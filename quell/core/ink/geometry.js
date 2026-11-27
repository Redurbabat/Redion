"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ink/geometry.ts (npm run bauen:ts). */
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
    const ECKE_COS = 0.55;
    const istEcke = (prev, p, next) => {
        const ax = p[0] - prev[0], ay = p[1] - prev[1];
        const bx = next[0] - p[0], by = next[1] - p[1];
        const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
        return la > 0.3 && lb > 0.3 && (ax * bx + ay * by) / (la * lb) < ECKE_COS;
    };
    const stueck = (prev, p, next) => {
        const mx = Math.round((p[0] + next[0]) * 50) / 100;
        const my = Math.round((p[1] + next[1]) * 50) / 100;
        if (prev && istEcke(prev, p, next))
            return ` L${p[0]} ${p[1]} L${mx} ${my}`;
        return ` Q${p[0]} ${p[1]} ${mx} ${my}`;
    };
    const seite = (input) => {
        if (input.length < 2)
            return '';
        if (input.length === 2)
            return ` L${input[1][0]} ${input[1][1]}`;
        let output = '';
        for (let i = 1; i < input.length - 1; i++)
            output += stueck(input[i - 1], input[i], input[i + 1]);
        const last = input[input.length - 1];
        return output + ` L${last[0]} ${last[1]}`;
    };
    const seiten = (raw, halfWidths) => {
        const input = points(raw);
        const n = input.length;
        if (n < 2)
            return null;
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
            links.push([r2(input[i][0] + ty * w), r2(input[i][1] - tx * w)]);
            rechts.push([r2(input[i][0] - ty * w), r2(input[i][1] + tx * w)]);
        }
        return { links, rechts, anfang: halb(0), ende: halb(n - 1) };
    };
    const spitzeFaktor = (weg, laenge, min) => {
        if (!(laenge > 0) || !(min < 1) || !(weg < laenge))
            return 1;
        const t = Math.max(0, weg / laenge);
        return min + (1 - min) * t * (2 - t);
    };
    const verjuengen = (raw, halfWidths, min, laenge) => {
        const input = points(raw);
        const n = input.length;
        const halb = (i) => {
            const w = Number(halfWidths[Math.min(i, halfWidths.length - 1)]);
            return Number.isFinite(w) ? w : 1;
        };
        const aus = Array.from({ length: n }, (_q, i) => halb(i));
        if (n < 3 || !(min < 1) || !(laenge > 0))
            return aus;
        const weg = [0];
        for (let i = 1; i < n; i++) {
            weg.push(weg[i - 1] + Math.hypot(input[i][0] - input[i - 1][0], input[i][1] - input[i - 1][1]));
        }
        const gesamt = weg[n - 1];
        const anteil = Math.min(1, gesamt / (2 * laenge));
        const stumpf = 1 - (1 - min) * anteil;
        const l = Math.min(laenge, gesamt * 0.4);
        return aus.map((h, i) => h * spitzeFaktor(weg[i], l, stumpf) * spitzeFaktor(gesamt - weg[i], l, stumpf));
    };
    const outlineLauf = (raw, halfWidths) => {
        const kanten = seiten(raw, halfWidths);
        if (!kanten)
            return '';
        const { links, rechts, anfang, ende } = kanten;
        const r2 = (v) => Math.round(v * 100) / 100;
        const rueck = [...rechts].reverse();
        return `M${links[0][0]} ${links[0][1]}` + seite(links) +
            ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rueck[0][0]} ${rueck[0][1]}` +
            seite(rueck) +
            ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0][0]} ${links[0][1]} Z`;
    };
    const gelenke = (raw) => {
        const input = points(raw);
        const aus = [];
        for (let i = 1; i < input.length - 1; i++)
            if (istEcke(input[i - 1], input[i], input[i + 1]))
                aus.push(i);
        return aus;
    };
    const halbeVon = (halfWidths, a, b) => Array.from({ length: Math.max(0, b - a) }, (_q, k) => halfWidths[Math.min(a + k, halfWidths.length - 1)]);
    const laeufe = (raw) => {
        const input = points(raw);
        if (input.length < 2)
            return [];
        const aus = [];
        let a = 0;
        for (const c of [...gelenke(input), input.length - 1]) {
            aus.push([a, c]);
            a = c;
        }
        return aus;
    };
    const outline = (raw, halfWidths) => {
        const input = points(raw);
        const teile = laeufe(input);
        if (teile.length <= 1)
            return outlineLauf(input, halfWidths);
        return teile.map(([a, c]) => outlineLauf(input.slice(a, c + 1), halbeVon(halfWidths, a, c + 1))).join(' ');
    };
    const outlinePunkte = (raw, halfWidths, kappen = 8) => {
        const kanten = seiten(raw, halfWidths);
        if (!kanten)
            return [];
        const { links, rechts, anfang, ende } = kanten;
        const r2 = (v) => Math.round(v * 100) / 100;
        const kappe = (mitte, von, nach) => {
            const a0 = Math.atan2(von[1] - mitte[1], von[0] - mitte[0]);
            const a1 = Math.atan2(nach[1] - mitte[1], nach[0] - mitte[0]);
            let d = a1 - a0;
            while (d <= 0)
                d += Math.PI * 2;
            const r = Math.hypot(von[0] - mitte[0], von[1] - mitte[1]);
            const raus = [];
            for (let i = 1; i < kappen; i++) {
                const a = a0 + d * (i / kappen);
                raus.push([r2(mitte[0] + Math.cos(a) * r), r2(mitte[1] + Math.sin(a) * r)]);
            }
            return raus;
        };
        const mitte = points(raw);
        const rueck = [...rechts].reverse();
        return [...links,
            ...kappe(mitte[mitte.length - 1], links[links.length - 1], rueck[0]),
            ...rueck,
            ...kappe(mitte[0], rueck[rueck.length - 1], links[0])]
            .filter(q => Number.isFinite(q[0]) && Number.isFinite(q[1]));
        void anfang;
        void ende;
    };
    const outlineTeile = (raw, halfWidths, kappen = 8) => {
        const input = points(raw);
        return laeufe(input)
            .map(([a, c]) => outlinePunkte(input.slice(a, c + 1), halbeVon(halfWidths, a, c + 1), kappen))
            .filter(teil => teil.length >= 3);
    };
    const dicht = (raw, schritt = 1) => {
        const input = points(raw);
        if (input.length < 2)
            return input.slice();
        const weite = Math.max(0.25, finite(schritt) || 1);
        const aus = [input[0]];
        const gerade = (a, b) => {
            const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / weite));
            for (let k = 1; k <= n; k++)
                aus.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
        };
        const bogen = (a, c, b) => {
            const l = Math.hypot(c[0] - a[0], c[1] - a[1]) + Math.hypot(b[0] - c[0], b[1] - c[1]);
            const n = Math.max(1, Math.ceil(l / weite));
            for (let k = 1; k <= n; k++) {
                const t = k / n, s = 1 - t;
                aus.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
            }
        };
        let von = input[0];
        for (let i = 1; i < input.length - 1; i++) {
            const p = input[i], next = input[i + 1];
            const mitte = [Math.round((p[0] + next[0]) * 50) / 100, Math.round((p[1] + next[1]) * 50) / 100];
            if (istEcke(input[i - 1], p, next)) {
                gerade(von, p);
                gerade(p, mitte);
            }
            else
                bogen(von, p, mitte);
            von = mitte;
        }
        gerade(von, input[input.length - 1]);
        return aus;
    };
    const flaecheMitSinn = (poly) => {
        let summe = 0;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
            summe += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
        return summe / 2;
    };
    const keil = (raw, hoehe, dicke, winkel = 78) => {
        const weg = dicht(raw, 1);
        if (!weg.length)
            return [];
        const r2 = (v) => Math.round(v * 100) / 100;
        const band = (vx, vy) => {
            const aus = [];
            let lauf = [weg[0]];
            let sinn = 0;
            const ablegen = () => {
                if (lauf.length < 2)
                    return;
                const hin = lauf.map(q => [r2(q[0] + vx), r2(q[1] + vy)]);
                const zurueck = lauf.map(q => [r2(q[0] - vx), r2(q[1] - vy)]).reverse();
                let poly = [...hin, ...zurueck];
                const a = flaecheMitSinn(poly);
                if (Math.abs(a) < 0.02)
                    return;
                if (a < 0)
                    poly = poly.reverse();
                aus.push(poly);
            };
            for (let i = 1; i < weg.length; i++) {
                const dx = weg[i][0] - weg[i - 1][0], dy = weg[i][1] - weg[i - 1][1];
                const kreuz = dx * vy - dy * vx;
                const s = Math.abs(kreuz) < 1e-9 ? sinn : Math.sign(kreuz);
                if (sinn && s !== sinn) {
                    ablegen();
                    lauf = [weg[i - 1]];
                }
                sinn = s;
                lauf.push(weg[i]);
            }
            ablegen();
            return aus;
        };
        const w = (finite(winkel) * Math.PI) / 180;
        const h = Math.max(0.5, finite(hoehe)) / 2, t = Math.max(0.2, finite(dicke)) / 2;
        const ux = Math.cos(w) * h, uy = Math.sin(w) * h, vx = -Math.sin(w) * t, vy = Math.cos(w) * t;
        const aus = [...band(ux, uy), ...band(vx, vy)];
        if (aus.length)
            return aus;
        const p = weg[0];
        const ecke = (a, b) => [r2(p[0] + a * ux + b * vx), r2(p[1] + a * uy + b * vy)];
        const abdruck = [ecke(1, 1), ecke(1, -1), ecke(-1, -1), ecke(-1, 1)];
        return [flaecheMitSinn(abdruck) < 0 ? abdruck.reverse() : abdruck];
    };
    const vieleckPfad = (polys) => polys.filter(p => p.length >= 3)
        .map(p => 'M' + p.map(q => q[0] + ' ' + q[1]).join(' L') + ' Z').join(' ');
    const path = (raw) => {
        const input = points(raw);
        if (!input.length)
            return '';
        if (input.length === 1)
            return `M${input[0][0]} ${input[0][1]}`;
        if (input.length === 2)
            return `M${input[0][0]} ${input[0][1]} L${input[1][0]} ${input[1][1]}`;
        let output = `M${input[0][0]} ${input[0][1]}`;
        for (let i = 1; i < input.length - 1; i++)
            output += stueck(input[i - 1], input[i], input[i + 1]);
        const last = input[input.length - 1];
        return output + ` L${last[0]} ${last[1]}`;
    };
    const rectangle = (start, end) => ({
        x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]),
        width: Math.abs(end[0] - start[0]), height: Math.abs(end[1] - start[1])
    });
    const SCHRIFTEN = [
        { id: 'standard', name: 'Standard', stapel: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
        { id: 'serif', name: 'Serifen', stapel: "Georgia, 'Times New Roman', serif" },
        { id: 'mono', name: 'Schreibmaschine', stapel: 'ui-monospace, Menlo, Consolas, monospace' },
        { id: 'hand', name: 'Handschrift', stapel: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" },
        { id: 'schmal', name: 'Schmal', stapel: "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', sans-serif" }
    ];
    const schriftStapel = (id) => (SCHRIFTEN.find(x => x.id === String(id)) || SCHRIFTEN[0]).stapel;
    const CHAR_EM = { standard: 0.55, serif: 0.52, mono: 0.6, hand: 0.58, schmal: 0.45 };
    const TEXT_ZEILE = 1.25;
    const charWidth = (ch, family, bold) => {
        const base = CHAR_EM[family] ?? 0.55;
        let f = 1;
        if (family !== 'mono') {
            if (" .,:;'|!ijltIfr".includes(ch))
                f = 0.55;
            else if ('mwMW'.includes(ch))
                f = 1.55;
            else if ((ch >= 'A' && ch <= 'Z') || 'ÄÖÜ'.includes(ch))
                f = 1.25;
        }
        return base * f * (bold ? 1.06 : 1);
    };
    let messBrett;
    const messCache = new Map();
    const CACHE_GRENZE = 20000;
    const brett = () => {
        if (messBrett !== undefined)
            return messBrett;
        try {
            messBrett = typeof document !== 'undefined' && typeof document.createElement === 'function'
                ? document.createElement('canvas').getContext('2d')
                : null;
            if (messBrett && typeof document !== 'undefined' && document.fonts?.ready) {
                document.fonts.ready.then(() => messCache.clear()).catch(() => { });
            }
        }
        catch {
            messBrett = null;
        }
        return messBrett;
    };
    const emGemessen = (text, family, bold) => {
        if (!text)
            return 0;
        const c = brett();
        if (!c)
            return null;
        const schluessel = family + '|' + (bold ? 'b' : 'n') + '|' + text;
        const da = messCache.get(schluessel);
        if (da !== undefined)
            return da;
        try {
            c.font = (bold ? '700 ' : '400 ') + '100px ' + schriftStapel(family);
            const em = c.measureText(text).width / 100;
            if (!Number.isFinite(em))
                return null;
            if (messCache.size >= CACHE_GRENZE)
                messCache.clear();
            messCache.set(schluessel, em);
            return em;
        }
        catch {
            return null;
        }
    };
    const gemessenAn = () => brett() ? 'gemessen' : 'geschaetzt';
    const textWidth = (text, fontSize, family = 'standard', bold = false) => {
        const roh = String(text ?? '');
        const em = emGemessen(roh, family, bold);
        if (em !== null)
            return em * fontSize;
        let w = 0;
        for (const ch of roh)
            w += charWidth(ch, family, bold);
        return w * fontSize;
    };
    const textLines = (text, width, fontSize, family = 'standard', bold = false) => {
        const lines = [];
        const max = Math.max(1, finite(width));
        const passt = (probe) => textWidth(probe, fontSize, family, bold) <= max;
        for (const raw of String(text ?? '').split(/\r?\n/)) {
            let line = '';
            for (const word of raw.split(' ')) {
                const probe = line ? line + ' ' + word : word;
                if (passt(probe)) {
                    line = probe;
                    continue;
                }
                if (line) {
                    lines.push(line);
                    line = '';
                }
                let part = '';
                for (const ch of word) {
                    if (part && !passt(part + ch)) {
                        lines.push(part);
                        part = '';
                    }
                    part += ch;
                }
                line = part;
            }
            lines.push(line);
        }
        return lines;
    };
    const laufSatz = (laeufe, max, family, grundGrad, grundFett) => {
        const teile = [];
        for (const lauf of laeufe) {
            const fontSize = Math.max(8, finite(lauf?.sz) || grundGrad);
            const bold = lauf?.fett === undefined ? grundFett : !!lauf.fett;
            const farbe = String(lauf?.farbe || '');
            for (const stueck of String(lauf?.text ?? '').split(/(\s+)/)) {
                if (!stueck)
                    continue;
                if (/\n/.test(stueck)) {
                    const vor = stueck.split('\n');
                    vor.forEach((rest, i) => {
                        if (i > 0)
                            teile.push({ text: '\n', leer: true, fontSize, bold, farbe });
                        if (rest)
                            teile.push({ text: rest, leer: true, fontSize, bold, farbe });
                    });
                    continue;
                }
                teile.push({ text: stueck, leer: /^\s+$/.test(stueck), fontSize, bold, farbe });
            }
        }
        const zeilen = [];
        let lauf = [];
        const abschliessen = () => {
            while (lauf.length && lauf[lauf.length - 1].leer)
                lauf.pop();
            const stuecke = [];
            let hoehe = 0;
            for (const t of lauf) {
                const letztes = stuecke[stuecke.length - 1];
                if (letztes && letztes.fontSize === t.fontSize && letztes.bold === t.bold
                    && letztes.farbe === t.farbe)
                    letztes.text += t.text;
                else
                    stuecke.push({ text: t.text, fontSize: t.fontSize,
                        bold: t.bold, farbe: t.farbe });
                if (t.fontSize > hoehe)
                    hoehe = t.fontSize;
            }
            if (!hoehe)
                hoehe = grundGrad;
            zeilen.push({ stuecke, hoehe: hoehe * TEXT_ZEILE, basis: hoehe * 0.85 });
            lauf = [];
        };
        let breiteJetzt = 0;
        for (const t of teile) {
            if (t.text === '\n') {
                abschliessen();
                breiteJetzt = 0;
                continue;
            }
            const breite = textWidth(t.text, t.fontSize, family, t.bold);
            if (t.leer && !lauf.length)
                continue;
            if (lauf.length && breiteJetzt + breite > max && !t.leer) {
                abschliessen();
                breiteJetzt = 0;
            }
            lauf.push(t);
            breiteJetzt += breite;
        }
        abschliessen();
        return zeilen;
    };
    const textLayout = (mark) => {
        const width = finite(mark?.breiteBox);
        if (!(width > 0))
            return null;
        const point = points([mark.point])[0] || [0, 0];
        const fontSize = Math.max(8, finite(mark.fontSize) || 18);
        const pad = Math.round(fontSize * 0.35);
        const family = String(mark.schrift || 'standard');
        const bold = !!mark.fett;
        const max = width - pad * 2;
        const laeufe = Array.isArray(mark.laeufe) ? mark.laeufe : null;
        const zeilen = laeufe && laeufe.length ? laufSatz(laeufe, max, family, fontSize, bold) : null;
        const lines = zeilen
            ? zeilen.map(z => z.stuecke.map(st => st.text).join(''))
            : textLines(String(mark.text || ''), max, fontSize, family, bold);
        const roh = String(mark.ausricht || 'links');
        const ausricht = (roh === 'mitte' || roh === 'rechts') ? roh : 'links';
        const hoehe = zeilen
            ? pad * 2 + zeilen.reduce((summe, z) => summe + z.hoehe, 0)
            : pad * 2 + lines.length * fontSize * TEXT_ZEILE;
        return { x: point[0], y: point[1], width, height: hoehe,
            pad, zeile: fontSize * TEXT_ZEILE, fontSize, family, bold, lines, ausricht,
            ...(zeilen ? { zeilen } : {}) };
    };
    const LINIEN = new Set(['stift', 'marker', 'line', 'arrow']);
    const drehePunkte = (pts, anker, grad) => {
        const rad = (grad * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        return pts.map(([x, y]) => [
            anker[0] + (x - anker[0]) * cos - (y - anker[1]) * sin,
            anker[1] + (x - anker[0]) * sin + (y - anker[1]) * cos
        ]);
    };
    const umschliessend = (pts) => {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return { x: x0, y: y0, width: Math.max(...xs) - x0, height: Math.max(...ys) - y0 };
    };
    const drehung = (mark) => LINIEN.has(String(mark?.art || '')) ? 0 : finite(mark?.dreh);
    const ecken = (mark) => {
        const b = boundsRoh(mark);
        const roh = [[b.x, b.y], [b.x + b.width, b.y],
            [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]];
        const grad = drehung(mark);
        return grad ? drehePunkte(roh, [b.x + b.width / 2, b.y + b.height / 2], grad) : roh;
    };
    const bounds = (mark) => {
        const roh = boundsRoh(mark);
        const grad = drehung(mark);
        if (!grad)
            return roh;
        return umschliessend(drehePunkte([[roh.x, roh.y], [roh.x + roh.width, roh.y],
            [roh.x, roh.y + roh.height], [roh.x + roh.width, roh.y + roh.height]], [roh.x + roh.width / 2, roh.y + roh.height / 2], grad));
    };
    const boundsRoh = (mark) => {
        if (mark?.art === 'text') {
            const layout = textLayout(mark);
            if (layout)
                return { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
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
    const rotate = (mark, pivot, degrees) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        const grad = finite(degrees);
        if (!grad)
            return mark;
        const r2 = (v) => Math.round(v * 100) / 100;
        const um = (p) => {
            const q = drehePunkte([p], pivot, grad)[0];
            return [r2(q[0]), r2(q[1])];
        };
        if (LINIEN.has(String(mark.art)) && Array.isArray(mark.pts)) {
            mark.pts = points(mark.pts).map(um);
            return mark;
        }
        const b = bounds(mark);
        const mitte = [b.x + b.width / 2, b.y + b.height / 2];
        const neu = um(mitte);
        move(mark, neu[0] - mitte[0], neu[1] - mitte[1]);
        let d = (finite(mark.dreh) + grad) % 360;
        if (d > 180)
            d -= 360;
        if (d <= -180)
            d += 360;
        if (Math.abs(d) < 0.01)
            delete mark.dreh;
        else
            mark.dreh = r2(d);
        return mark;
    };
    const overlapConvex = (a, b) => {
        for (const poly of [a, b]) {
            for (let i = 0; i < poly.length; i++) {
                const von = poly[i], bis = poly[(i + 1) % poly.length];
                const nx = -(bis[1] - von[1]), ny = bis[0] - von[0];
                if (!nx && !ny)
                    continue;
                let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
                for (const q of a) {
                    const v = q[0] * nx + q[1] * ny;
                    if (v < aMin)
                        aMin = v;
                    if (v > aMax)
                        aMax = v;
                }
                for (const q of b) {
                    const v = q[0] * nx + q[1] * ny;
                    if (v < bMin)
                        bMin = v;
                    if (v > bMax)
                        bMax = v;
                }
                if (aMax < bMin || bMax < aMin)
                    return false;
            }
        }
        return true;
    };
    const kastenEcken = (b) => [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]];
    const intersects = (left, right) => left.x <= right.x + right.width && left.x + left.width >= right.x &&
        left.y <= right.y + right.height && left.y + left.height >= right.y;
    const distanceToPolyline = (raw, point) => {
        const input = points(raw);
        if (!input.length)
            return Infinity;
        if (input.length === 1)
            return Math.hypot(point[0] - input[0][0], point[1] - input[0][1]);
        let best = Infinity;
        for (let i = 1; i < input.length; i++)
            best = Math.min(best, distanceToSegment(point, input[i - 1], input[i]));
        return best;
    };
    const DICHTER_GRENZE = 4000;
    const densify = (raw, schritt = 6) => {
        const input = points(raw);
        if (input.length < 2)
            return input;
        const weite = Math.max(0.5, finite(schritt) || 6);
        const out = [input[0]];
        for (let i = 1; i < input.length; i++) {
            const a = input[i - 1], b = input[i];
            const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const teile = Math.min(Math.ceil(d / weite), Math.max(1, DICHTER_GRENZE - out.length));
            for (let k = 1; k < teile; k++)
                out.push([a[0] + (b[0] - a[0]) * k / teile, a[1] + (b[1] - a[1]) * k / teile]);
            out.push(b);
            if (out.length >= DICHTER_GRENZE)
                break;
        }
        return out;
    };
    const touchesCircle = (mark, center, radius, halfWidth = 0) => {
        const reichweite = radius + Math.max(0, finite(halfWidth));
        const art = String(mark?.art || '');
        const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
        if (linie && Array.isArray(mark?.pts) && mark.pts.length) {
            const roh = mark.pts;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < roh.length; i++) {
                const q = roh[i];
                if (!Array.isArray(q) || q.length < 2)
                    continue;
                const x = finite(q[0]), y = finite(q[1]);
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
            if (minX === Infinity)
                return false;
            const bx = Math.max(minX - center[0], 0, center[0] - maxX);
            const by = Math.max(minY - center[1], 0, center[1] - maxY);
            if (bx * bx + by * by > reichweite * reichweite)
                return false;
            return distanceToPolyline(mark.pts, center) <= reichweite;
        }
        const box = boundsRoh(mark);
        if (!box.x && !box.y && !box.width && !box.height)
            return false;
        const grad = drehung(mark);
        const mitte = grad
            ? drehePunkte([center], [box.x + box.width / 2, box.y + box.height / 2], -grad)[0]
            : center;
        const dx = Math.max(box.x - mitte[0], 0, mitte[0] - (box.x + box.width));
        const dy = Math.max(box.y - mitte[1], 0, mitte[1] - (box.y + box.height));
        return dx * dx + dy * dy <= radius * radius;
    };
    const circleCuts = (a, b, center, radius) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const fx = a[0] - center[0], fy = a[1] - center[1];
        const qa = dx * dx + dy * dy;
        if (!qa)
            return null;
        const qb = 2 * (fx * dx + fy * dy);
        const qc = fx * fx + fy * fy - radius * radius;
        const disc = qb * qb - 4 * qa * qc;
        if (disc < 0)
            return null;
        const wurzel = Math.sqrt(disc);
        return [(-qb - wurzel) / (2 * qa), (-qb + wurzel) / (2 * qa)];
    };
    const splitByCircle = (raw, pressures, center, radius, kanaele = {}) => {
        const input = points(raw);
        const druck = Array.isArray(pressures) ? pressures.map(finite) : [];
        const druckBei = (i) => druck.length ? druck[Math.min(i, druck.length - 1)] : 0.5;
        const namen = Object.keys(kanaele).filter(name => Array.isArray(kanaele[name]) && kanaele[name].length);
        const werte = {};
        for (const name of namen)
            werte[name] = kanaele[name].map(finite);
        const kanalBei = (name, i) => {
            const liste = werte[name];
            return liste[Math.min(i, liste.length - 1)];
        };
        const r2 = (v) => Math.round(v * 100) / 100;
        const inside = (p) => Math.hypot(p[0] - center[0], p[1] - center[1]) <= radius;
        const zwischen = (a, b, t) => [r2(a[0] + (b[0] - a[0]) * t), r2(a[1] + (b[1] - a[1]) * t)];
        const leer = () => ({ pts: [], pressure: [],
            kanaele: Object.fromEntries(namen.map(name => [name, []])) });
        const stuecke = [];
        let aktuell = leer();
        const dazu = (p, i, j, t) => {
            aktuell.pts.push(p);
            aktuell.pressure.push(r2(druckBei(i) + (druckBei(j) - druckBei(i)) * t));
            for (const name of namen)
                aktuell.kanaele[name].push(r2(kanalBei(name, i) + (kanalBei(name, j) - kanalBei(name, i)) * t));
        };
        const ablegen = () => {
            if (aktuell.pts.length >= 2)
                stuecke.push(aktuell);
            aktuell = leer();
        };
        if (!input.length)
            return stuecke;
        if (!inside(input[0]))
            dazu(input[0], 0, 0, 0);
        for (let i = 1; i < input.length; i++) {
            const a = input[i - 1], b = input[i];
            const aDrin = inside(a), bDrin = inside(b);
            const cuts = circleCuts(a, b, center, radius);
            const klemm = (t) => Math.max(0, Math.min(1, t));
            if (aDrin && bDrin)
                continue;
            if (!aDrin && bDrin) {
                const t = klemm(cuts ? cuts[0] : 0);
                dazu(zwischen(a, b, t), i - 1, i, t);
                ablegen();
                continue;
            }
            if (aDrin && !bDrin) {
                const t = klemm(cuts ? cuts[1] : 1);
                aktuell = leer();
                dazu(zwischen(a, b, t), i - 1, i, t);
                dazu(b, i, i, 0);
                continue;
            }
            if (cuts && cuts[0] > 0 && cuts[0] < 1 && cuts[1] > 0 && cuts[1] < 1) {
                dazu(zwischen(a, b, cuts[0]), i - 1, i, cuts[0]);
                ablegen();
                dazu(zwischen(a, b, cuts[1]), i - 1, i, cuts[1]);
            }
            dazu(b, i, i, 0);
        }
        ablegen();
        return stuecke;
    };
    const insidePolygon = (point, polygon) => {
        const poly = points(polygon);
        const n = poly.length;
        if (n < 3)
            return false;
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const [xi, yi] = poly[i];
            const [xj, yj] = poly[j];
            const kreuzt = (yi > point[1]) !== (yj > point[1]) &&
                point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-9) + xi;
            if (kreuzt)
                inside = !inside;
        }
        return inside;
    };
    const polygonArea = (polygon) => {
        const poly = points(polygon);
        if (poly.length < 3)
            return 0;
        let summe = 0;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
            summe += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
        return Math.abs(summe) / 2;
    };
    const union = (boxes) => {
        if (!boxes.length)
            return { x: 0, y: 0, width: 0, height: 0 };
        const x0 = Math.min(...boxes.map(b => b.x));
        const y0 = Math.min(...boxes.map(b => b.y));
        const x1 = Math.max(...boxes.map(b => b.x + b.width));
        const y1 = Math.max(...boxes.map(b => b.y + b.height));
        return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    };
    const scale = (mark, anchor, sx, sy, achse = 0) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        const r2 = (v) => Math.round(v * 100) / 100;
        const fx = Number.isFinite(sx) ? sx : 1;
        const fy = Number.isFinite(sy) ? sy : 1;
        const ax = Number.isFinite(achse) ? Number(achse) : 0;
        const grad = drehung(mark);
        let lx = fx, ly = fy;
        let f = (p) => [r2(anchor[0] + (p[0] - anchor[0]) * fx), r2(anchor[1] + (p[1] - anchor[1]) * fy)];
        if (grad || ax) {
            const d = ((grad - ax) * Math.PI) / 180;
            const c2 = Math.cos(d) * Math.cos(d), s2 = Math.sin(d) * Math.sin(d);
            lx = fx * c2 + fy * s2;
            ly = fx * s2 + fy * c2;
            const roh = boundsRoh(mark);
            const mitte = [roh.x + roh.width / 2, roh.y + roh.height / 2];
            const inAchse = ax ? drehePunkte([mitte], anchor, -ax)[0] : mitte;
            const gestreckt = [anchor[0] + (inAchse[0] - anchor[0]) * fx,
                anchor[1] + (inAchse[1] - anchor[1]) * fy];
            const neu = ax ? drehePunkte([gestreckt], anchor, ax)[0] : gestreckt;
            const vx = neu[0] - mitte[0], vy = neu[1] - mitte[1];
            f = (p) => [
                r2(mitte[0] + (p[0] - mitte[0]) * lx + vx),
                r2(mitte[1] + (p[1] - mitte[1]) * ly + vy)
            ];
        }
        if (Array.isArray(mark.pts))
            mark.pts = points(mark.pts).map(f);
        if (Array.isArray(mark.point))
            mark.point = f(points([mark.point])[0] || [0, 0]);
        const mittel = Math.sqrt(Math.abs(lx * ly)) || 1;
        if (mark.breite !== undefined && Number.isFinite(Number(mark.breite)))
            mark.breite = Math.max(0.3, r2(Number(mark.breite) * mittel));
        if (mark.breiteFest !== undefined && Number.isFinite(Number(mark.breiteFest)))
            mark.breiteFest = Math.max(0.3, r2(Number(mark.breiteFest) * mittel));
        if (mark.fontSize !== undefined && Number.isFinite(Number(mark.fontSize)))
            mark.fontSize = Math.max(6, r2(Number(mark.fontSize) * mittel));
        if (mark.groesse !== undefined && Number.isFinite(Number(mark.groesse)))
            mark.groesse = Math.max(12, r2(Number(mark.groesse) * mittel));
        if (mark.breiteBox !== undefined && Number.isFinite(Number(mark.breiteBox)))
            mark.breiteBox = Math.max(24, r2(Number(mark.breiteBox) * Math.abs(lx)));
        return mark;
    };
    return { points, simplify, simplifyIndices, densify, outline, outlinePunkte, spitzeFaktor, verjuengen,
        stueck, ECKE_COS,
        istEcke, gelenke, laeufe, outlineLauf, outlineTeile, dicht, keil, vieleckPfad, flaecheMitSinn,
        path, rectangle, bounds, move, intersects,
        distanceToPolyline, touchesCircle, splitByCircle, insidePolygon, polygonArea, union, scale, rotate,
        textWidth, textLines, textLayout, LINIEN, SCHRIFTEN, schriftStapel, gemessenAn,
        boundsLokal: boundsRoh, ecken, drehung, drehePunkte, overlapConvex, kastenEcken };
})();
if (typeof window === 'undefined')
    module.exports = InkGeometry;
else
    window.InkGeometry = InkGeometry;
