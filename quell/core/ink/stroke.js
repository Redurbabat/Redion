"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ink/stroke.ts (npm run bauen:ts). */
const InkStroke = (() => {
    const r2 = (v) => Math.round(v * 100) / 100;
    const endlich = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };
    const qStueck = (vorher, a, b) => globalThis.InkGeometry.stueck(vorher ?? null, a, b);
    class Lauf {
        pts = [];
        halb = [];
        links = [];
        rechts = [];
        linksFest = [];
        rechtsFest = [];
        fest = 0;
        nassPts = [];
        nassHalb = [];
        laenge() { return this.pts.length; }
        punkte() { return this.pts.map(p => [p[0], p[1]]); }
        breiten() { return this.halb.slice(); }
        punkt(p, halb) {
            this.pts.push([endlich(p[0]), endlich(p[1])]);
            this.halb.push(Math.max(0.15, Number.isFinite(halb) ? halb : 1));
            this.nassPts.length = 0;
            this.nassHalb.length = 0;
            this.nachziehen();
        }
        nass(pts, halb) {
            this.nassPts = pts.map(p => [endlich(p[0]), endlich(p[1])]);
            this.nassHalb = this.nassPts.map((_p, i) => Math.max(0.15, Number.isFinite(halb[i]) ? Number(halb[i]) : (this.halb[this.halb.length - 1] ?? 1)));
        }
        d() {
            const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
            const halb = this.nassHalb.length ? this.halb.concat(this.nassHalb) : this.halb;
            const n = pts.length;
            if (n < 2)
                return '';
            const links = this.links.slice(0, Math.max(0, n - 2));
            const rechts = this.rechts.slice(0, Math.max(0, n - 2));
            for (let i = links.length; i < n; i++) {
                const paar = versatz(pts, halb, i, n);
                links.push(paar[0]);
                rechts.push(paar[1]);
            }
            const grenze = Math.min(this.fest, Math.max(0, n - 2));
            let linksTeil = this.linksFest.slice(0, grenze).join('');
            for (let i = Math.max(1, grenze); i <= n - 2; i++)
                linksTeil += qStueck(links[i - 1], links[i], links[i + 1]);
            if (n === 2)
                linksTeil = ` L${links[1][0]} ${links[1][1]}`;
            else
                linksTeil += ` L${links[n - 1][0]} ${links[n - 1][1]}`;
            let rechtsTeil = '';
            if (n === 2) {
                rechtsTeil = ` L${rechts[0][0]} ${rechts[0][1]}`;
            }
            else {
                const spaet = [];
                for (let j = n - 2; j >= Math.max(1, grenze); j--)
                    spaet.push(qStueck(rechts[j + 1], rechts[j], rechts[j - 1]));
                rechtsTeil = spaet.join('') + this.rechtsFest.slice(1, Math.max(1, grenze)).reverse().join('') +
                    ` L${rechts[0][0]} ${rechts[0][1]}`;
            }
            const anfang = halbAn(halb, 0);
            const ende = halbAn(halb, n - 1);
            return `M${links[0][0]} ${links[0][1]}` + linksTeil +
                ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rechts[n - 1][0]} ${rechts[n - 1][1]}` +
                rechtsTeil +
                ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0][0]} ${links[0][1]} Z`;
        }
        nachziehen() {
            const n = this.pts.length;
            for (let i = this.links.length; i <= n - 2; i++) {
                const paar = versatz(this.pts, this.halb, i, n);
                this.links[i] = paar[0];
                this.rechts[i] = paar[1];
            }
            for (let i = Math.max(1, this.fest); i <= n - 3; i++) {
                this.linksFest[i] = qStueck(this.links[i - 1], this.links[i], this.links[i + 1]);
                this.rechtsFest[i] = qStueck(this.rechts[i + 1], this.rechts[i], this.rechts[i - 1]);
            }
            this.fest = Math.max(this.fest, Math.max(0, n - 2));
        }
    }
    const halbAn = (halb, i) => {
        const w = Number(halb[Math.min(i, halb.length - 1)]);
        return Math.max(0.15, Number.isFinite(w) ? w : 1);
    };
    const versatz = (pts, halb, i, n) => {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(n - 1, i + 1)];
        let tx = next[0] - prev[0];
        let ty = next[1] - prev[1];
        const len = Math.hypot(tx, ty) || 1;
        tx /= len;
        ty /= len;
        const w = halbAn(halb, i);
        return [
            [r2(pts[i][0] + ty * w), r2(pts[i][1] - tx * w)],
            [r2(pts[i][0] - ty * w), r2(pts[i][1] + tx * w)]
        ];
    };
    class Feder {
        pts = [];
        halb = [];
        fertig = '';
        lauf = new Lauf();
        nassPts = [];
        linieFest = [];
        laenge() { return this.pts.length; }
        punkte() { return this.pts.map(p => [p[0], p[1]]); }
        breiten() { return this.halb.slice(); }
        punkteMitNass() { return this.pts.concat(this.nassPts).map(p => [p[0], p[1]]); }
        laeufe() { return (this.fertig.match(/ Z /g) || []).length + (this.pts.length >= 2 ? 1 : 0); }
        punkt(p, halb) {
            const q = [endlich(p[0]), endlich(p[1])];
            const h = Math.max(0.15, Number.isFinite(halb) ? halb : 1);
            const n = this.pts.length;
            if (n >= 2 && globalThis.InkGeometry.istEcke(this.pts[n - 2], this.pts[n - 1], q)) {
                this.lauf.nass([], []);
                this.fertig += this.lauf.d() + ' ';
                this.lauf = new Lauf();
                this.lauf.punkt(this.pts[n - 1], this.halb[n - 1]);
            }
            this.pts.push(q);
            this.halb.push(h);
            this.lauf.punkt(q, h);
            this.nassPts.length = 0;
            this.linieNachziehen();
        }
        nass(pts, halb) {
            this.lauf.nass(pts, halb);
            this.nassPts = pts.map(p => [endlich(p[0]), endlich(p[1])]);
        }
        d() { return this.fertig + this.lauf.d(); }
        linie() {
            const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
            const n = pts.length;
            if (!n)
                return '';
            if (n === 1)
                return `M${pts[0][0]} ${pts[0][1]}`;
            if (n === 2)
                return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
            const grenze = Math.min(this.linieFest.length, Math.max(0, n - 2));
            let aus = `M${pts[0][0]} ${pts[0][1]}` + this.linieFest.slice(0, grenze).join('');
            for (let i = Math.max(1, grenze); i < n - 1; i++)
                aus += qStueck(pts[i - 1], pts[i], pts[i + 1]);
            return aus + ` L${pts[n - 1][0]} ${pts[n - 1][1]}`;
        }
        linieNachziehen() {
            const n = this.pts.length;
            for (let i = Math.max(1, this.linieFest.length); i <= n - 3; i++) {
                this.linieFest[i] = qStueck(this.pts[i - 1], this.pts[i], this.pts[i + 1]);
            }
            if (this.linieFest.length < Math.max(0, n - 2))
                this.linieFest.length = Math.max(0, n - 2);
        }
    }
    const ALPHA_LANGSAM = 0.28;
    const ALPHA_SCHNELL = 0.92;
    const TEMPO_VOLL = 1.1;
    const MESS_MS = 16;
    const ECKE_SCHRITT = 2.5;
    const glaetter = (start, keepCorners = true) => {
        let x = endlich(start[0]);
        let y = endlich(start[1]);
        let vx = endlich(start[0]);
        let vy = endlich(start[1]);
        let ax = vx, ay = vy;
        let rx = 0, ry = 0;
        let seitAnker = [];
        return (p, dt) => {
            const px = endlich(p[0]), py = endlich(p[1]);
            const ms = Math.max(1, Number.isFinite(dt) ? dt : 16);
            const tempo = Math.hypot(px - vx, py - vy) / ms;
            vx = px;
            vy = py;
            seitAnker.push([px, py]);
            if (seitAnker.length > 64)
                seitAnker.shift();
            const sx = px - ax, sy = py - ay;
            const sl = Math.hypot(sx, sy);
            if (keepCorners && sl >= ECKE_SCHRITT) {
                const nx = sx / sl, ny = sy / sl;
                if ((rx !== 0 || ry !== 0) && nx * rx + ny * ry < KEHRE) {
                    let ecke = seitAnker[0], weit = -Infinity;
                    for (const q of seitAnker) {
                        const v = (q[0] - ax) * rx + (q[1] - ay) * ry;
                        if (v > weit) {
                            weit = v;
                            ecke = q;
                        }
                    }
                    x = ecke[0];
                    y = ecke[1];
                    rx = nx;
                    ry = ny;
                    ax = px;
                    ay = py;
                    seitAnker = [[px, py]];
                    return [x, y];
                }
                rx = nx;
                ry = ny;
                ax = px;
                ay = py;
                seitAnker = [[px, py]];
            }
            const teil = Math.min(1, tempo / TEMPO_VOLL);
            const gemessen = ALPHA_LANGSAM + (ALPHA_SCHNELL - ALPHA_LANGSAM) * teil;
            const tau = MESS_MS * (1 - gemessen) / gemessen;
            const alpha = ms / (ms + tau);
            x += (px - x) * alpha;
            y += (py - y) * alpha;
            return [x, y];
        };
    };
    const druckGlaetter = (start) => {
        const drei = [Number.isFinite(start) ? start : 0.5];
        return (p) => {
            drei.push(Number.isFinite(p) ? p : drei[drei.length - 1]);
            if (drei.length > 3)
                drei.shift();
            if (drei.length < 3)
                return Math.round(drei[drei.length - 1] * 1000) / 1000;
            const sortiert = drei.slice().sort((a, b) => a - b);
            return Math.round(sortiert[1] * 1000) / 1000;
        };
    };
    const VORHER_MS = 14;
    const VORHER_PX = 26;
    const KEHRE = 0.55;
    const vorhersage = (pts, ms = VORHER_MS, abstand = 8, bremse = 1) => {
        const n = Array.isArray(pts) ? pts.length : 0;
        if (n < 3)
            return [];
        const a = pts[n - 3], b = pts[n - 2], c = pts[n - 1];
        const v1x = b[0] - a[0], v1y = b[1] - a[1];
        const v2x = c[0] - b[0], v2y = c[1] - b[1];
        const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
        if (l2 < 0.3)
            return [];
        if (l1 > 0.3 && (v1x * v2x + v1y * v2y) / (l1 * l2) < KEHRE)
            return [];
        const dt = Math.max(1, Number.isFinite(abstand) ? abstand : 8);
        const weit = Math.min(VORHER_PX, l2 / dt * Math.max(0, ms))
            * Math.max(0, Math.min(1, Number.isFinite(bremse) ? bremse : 1));
        if (weit < 0.4)
            return [];
        const ux = v2x / l2, uy = v2y / l2;
        return [
            [r2(c[0] + ux * weit * 0.6), r2(c[1] + uy * weit * 0.6)],
            [r2(c[0] + ux * weit), r2(c[1] + uy * weit)]
        ];
    };
    const deckeln = (roh, vorher, abstand = 8, bremse = 1) => {
        const n = Array.isArray(roh) ? roh.length : 0;
        if (n < 2 || !Array.isArray(vorher) || !vorher.length)
            return [];
        const b = roh[n - 2], c = roh[n - 1];
        const vx = c[0] - b[0], vy = c[1] - b[1];
        const l = Math.hypot(vx, vy);
        if (l < 0.3)
            return [];
        const dt = Math.max(1, Number.isFinite(abstand) ? abstand : 8);
        const grenze = Math.min(VORHER_PX, l / dt * VORHER_MS)
            * Math.max(0, Math.min(1, Number.isFinite(bremse) ? bremse : 1));
        if (grenze < 0.4)
            return [];
        const aus = [];
        let weg = 0;
        let von = c;
        for (const q of vorher) {
            const qx = endlich(q[0]), qy = endlich(q[1]);
            const dx = qx - von[0], dy = qy - von[1];
            const s = Math.hypot(dx, dy);
            if (s < 1e-6)
                continue;
            if ((dx * vx + dy * vy) / (s * l) < KEHRE)
                break;
            if (weg + s >= grenze) {
                const t = (grenze - weg) / s;
                aus.push([r2(von[0] + dx * t), r2(von[1] + dy * t)]);
                break;
            }
            weg += s;
            von = [qx, qy];
            aus.push([r2(qx), r2(qy)]);
        }
        return aus;
    };
    const bremse = (roh, zeiten, drucke = []) => {
        const d = Array.isArray(drucke) ? drucke.filter(v => Number.isFinite(v)) : [];
        if (d.length >= 3) {
            const [x, y, z] = d.slice(-3);
            const hoch = Math.max(...d.slice(-8));
            if (x > y && y > z && z < 0.6 * hoch)
                return 0;
        }
        const n = Array.isArray(roh) ? roh.length : 0;
        if (n < 3 || !Array.isArray(zeiten) || zeiten.length < 2)
            return 1;
        const a = roh[n - 3], b = roh[n - 2], c = roh[n - 1];
        const t1 = Math.max(1, endlich(zeiten[zeiten.length - 2])), t2 = Math.max(1, endlich(zeiten[zeiten.length - 1]));
        const v1 = Math.hypot(b[0] - a[0], b[1] - a[1]) / t1;
        const v2 = Math.hypot(c[0] - b[0], c[1] - b[1]) / t2;
        if (!(v1 > 0))
            return 1;
        const verhaeltnis = v2 / v1;
        return verhaeltnis < 0.7 ? Math.max(0, verhaeltnis) : 1;
    };
    const TEMPO_AB = 0.25;
    const TEMPO_BIS = 1.8;
    const TEMPO_FENSTER = 32;
    const tempoFaktor = (v, staerke) => {
        if (!(staerke > 0) || !Number.isFinite(v))
            return 1;
        const t = Math.max(0, Math.min(1, (v - TEMPO_AB) / (TEMPO_BIS - TEMPO_AB)));
        return 1 - Math.min(0.9, staerke) * t * t * (3 - 2 * t);
    };
    const tempoMesser = () => {
        const stuecke = [];
        let letzter = null;
        return (p, dt) => {
            const q = [endlich(p[0]), endlich(p[1])];
            if (letzter)
                stuecke.push({ weg: Math.hypot(q[0] - letzter[0], q[1] - letzter[1]),
                    zeit: Math.max(1, Number.isFinite(dt) ? dt : 16) });
            letzter = q;
            let weg = 0, zeit = 0, noetig = 0;
            for (let i = stuecke.length - 1; i >= 0; i--) {
                weg += stuecke[i].weg;
                zeit += stuecke[i].zeit;
                noetig++;
                if (zeit >= TEMPO_FENSTER)
                    break;
            }
            if (stuecke.length > noetig + 4)
                stuecke.splice(0, stuecke.length - noetig - 4);
            return zeit ? r2(weg / zeit) : 0;
        };
    };
    const samples = (event) => {
        const list = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
        const last = list[list.length - 1];
        return !last || last.clientX !== event.clientX || last.clientY !== event.clientY ||
            last.timeStamp !== event.timeStamp || last.pressure !== event.pressure ? [...list, event] : list;
    };
    const inkColor = (value) => typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : '#529cca';
    const tiltOf = (event) => {
        if (event.pointerType !== 'pen')
            return -1;
        const tx = Number(event.tiltX) || 0, ty = Number(event.tiltY) || 0;
        if (!tx && !ty)
            return -1;
        const radians = Math.PI / 180;
        const angle = Math.atan(Math.hypot(Math.tan(tx * radians), Math.tan(ty * radians))) / radians;
        return Math.round(Math.max(0, Math.min(1, angle / 90)) * 100) / 100;
    };
    const readAnnotation = (raw) => {
        if (!raw || typeof raw !== 'object')
            return null;
        const r = raw;
        if (typeof r.id !== 'string' || !r.id || !Array.isArray(r.pts) || !r.pts.length ||
            r.pts.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(v => typeof v === 'number' && Number.isFinite(v))))
            return null;
        const pts = r.pts.map(p => [p[0], p[1]]);
        const mark = { id: r.id, art: 'stift', pts, farbe: inkColor(r.farbe),
            breite: typeof r.breite === 'number' && Number.isFinite(r.breite) ? Math.max(.3, Math.min(24, r.breite)) : 2.4,
            ebene: typeof r.ebene === 'string' ? r.ebene : 'plan' };
        if (r.kontur === 'weich')
            mark.kontur = 'weich';
        for (const key of ['pressure', 'neigung']) {
            const values = r[key];
            if (Array.isArray(values) && values.length === pts.length && values.every(v => typeof v === 'number' && Number.isFinite(v)))
                mark[key] = values.map(v => key === 'pressure' ? Math.max(0, Math.min(1, v)) : v);
        }
        return mark;
    };
    const inkHalfWidth = (mark, pressure = .5) => Math.max(.15, mark.breite * (.35 + Math.max(0, Math.min(1, pressure)) * .9) / 2);
    const weichUmriss = (mark) => {
        if (mark.kontur !== 'weich' || mark.pts.length < 2 || mark.pts.length > 12_000 ||
            typeof RedionPerfectFreehand === 'undefined')
            return [];
        const eingabe = mark.pts.map(([x, y], i) => [x, y, mark.pressure?.[i] ?? .5]);
        return RedionPerfectFreehand.getStroke(eingabe, {
            size: mark.breite, thinning: .45, smoothing: .5, streamline: .12,
            simulatePressure: false, last: true
        }).map(([x, y]) => [Number(x.toFixed(3)), Number(y.toFixed(3))]);
    };
    return { samples, tiltOf, inkColor, readAnnotation, inkHalfWidth, weichUmriss,
        Feder, glaetter, druckGlaetter, vorhersage, deckeln, bremse, tempoFaktor, tempoMesser,
        ALPHA_LANGSAM, ALPHA_SCHNELL, TEMPO_VOLL,
        VORHER_MS, VORHER_PX, KEHRE, TEMPO_AB, TEMPO_BIS, TEMPO_FENSTER };
})();
globalThis.InkStroke = InkStroke;
