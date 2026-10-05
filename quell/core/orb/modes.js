"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/orb/modes.ts (npm run bauen:ts). */
const OrbModes = (() => {
    const { fibDir, finalize, hash, lerp, makeProj, noise2, radiusScale } = OrbGeometry;
    const TAU = Math.PI * 2;
    const dot = (x, y, depth, basis) => ({ x, y, depth, r: basis * (0.5 + 0.8 * depth) });
    const masse = (size) => ({
        cx: size / 2,
        cy: size / 2,
        R: size * 0.36,
        basis: 1.55 * radiusScale(size),
    });
    const working = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const dots = [];
        const bahnen = 2, je = 17;
        const proj = makeProj(t * 0.32, 0.26, cx, cy, R);
        for (let o = 0; o < bahnen; o++) {
            const inkl = 0.15 + o * 1.18;
            const ci = Math.cos(inkl), si = Math.sin(inkl);
            const dreh = o * 1.35;
            const cp = Math.cos(dreh), sp = Math.sin(dreh);
            for (let i = 0; i < je; i++) {
                const a = (i / je) * TAU + t * (1.05 + o * 0.22);
                const rx = Math.cos(a), ry0 = Math.sin(a);
                const ry = ry0 * ci, rz0 = ry0 * si;
                const [x, y, d] = proj(rx * cp + rz0 * sp, ry, -rx * sp + rz0 * cp);
                dots.push(dot(x, y, d, basis));
            }
        }
        return finalize(dots, []);
    };
    const searching = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const n = Math.round(56 * Math.max(0.45, size / 64));
        const proj = makeProj(t * 0.16, 0.32, cx, cy, R);
        const strahl = (t * 1.05) % TAU;
        const dots = [];
        for (let i = 0; i < n; i++) {
            const [px, py, pz] = fibDir(i, n);
            const laenge = Math.atan2(pz, px);
            const nah = Math.max(0, Math.cos(laenge - strahl));
            const treffer = Math.pow(nah, 6);
            const [x, y, d] = proj(px, py, pz);
            dots.push({ x, y, depth: Math.min(1, d + treffer * 0.5),
                r: basis * (0.34 + 0.45 * d + treffer * 1.75) });
        }
        return finalize(dots, []);
    };
    const solving = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const n = Math.round(72 * Math.max(0.45, size / 64));
        const dots = [];
        const takt = t * 1.25;
        const schritt = Math.floor(takt);
        const roh = Math.min(1, (takt - schritt) * 2);
        const weich = roh * roh * (3 - 2 * roh);
        for (let i = 0; i < n; i++) {
            const [px, py, pz] = fibDir(i, n);
            if (Math.abs(Math.abs(py) - 0.34) < 0.105)
                continue;
            const band = py > 0.34 ? 0 : py < -0.34 ? 2 : 1;
            const vorher = (Math.PI / 2) * Math.floor(hash(band, schritt) * 4);
            const nachher = (Math.PI / 2) * Math.floor(hash(band, schritt + 1) * 4);
            const dreh = lerp(vorher, nachher, weich);
            const c = Math.cos(dreh), s = Math.sin(dreh);
            const proj = makeProj(0.5, 0.3, cx, cy, R);
            const [x, y, d] = proj(px * c + pz * s, py, -px * s + pz * c);
            dots.push(dot(x, y, d, basis));
        }
        return finalize(dots, []);
    };
    const listening = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const proj = makeProj(0.35, 0.28, cx, cy, R);
        const ringe = 5;
        const dots = [];
        for (let k = 0; k < ringe; k++) {
            const lat = (-0.62 + (k / (ringe - 1)) * 1.24);
            const ry = Math.sin(lat);
            const rr = Math.cos(lat);
            const je = Math.max(6, Math.round(16 * rr));
            for (let i = 0; i < je; i++) {
                const a = (i / je) * TAU;
                const w = Math.sin(a * 2 - t * 2.6 + k * 0.9);
                const aus = 1 + w * 0.17;
                const [x, y, d] = proj(Math.cos(a) * rr * aus, ry * aus, Math.sin(a) * rr * aus);
                dots.push({ x, y, depth: d, r: basis * (0.45 + 0.7 * d) * (0.75 + 0.35 * (w + 1) / 2) });
            }
        }
        return finalize(dots, []);
    };
    const connecting = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const n = 11;
        const proj = makeProj(t * 0.3, 0.3, cx, cy, R);
        const orte = [];
        for (let i = 0; i < n; i++) {
            const [px, py, pz] = fibDir(i, n);
            orte.push(proj(px, py, pz));
        }
        const dots = [];
        const lines = [];
        for (let i = 0; i < n; i++) {
            const a = orte[i];
            if (!a)
                continue;
            dots.push(dot(a[0], a[1], a[2], basis * 1.25));
            for (const sprung of [3, 5]) {
                const j = (i + sprung) % n;
                const b = orte[j];
                if (!b || j <= i)
                    continue;
                const weck = hash(i, j) * 3.2;
                const auf = Math.max(0, Math.min(1, (t % 4.4) - weck));
                if (auf <= 0)
                    continue;
                const tiefe = (a[2] + b[2]) / 2;
                lines.push({ x1: a[0], y1: a[1],
                    x2: lerp(a[0], b[0], auf), y2: lerp(a[1], b[1], auf),
                    w: 0.5 * radiusScale(size, 0.8), depth: tiefe });
                if (auf >= 1) {
                    const p = ((t * 0.55 + hash(j, i)) % 1);
                    dots.push(dot(lerp(a[0], b[0], p), lerp(a[1], b[1], p), tiefe, basis * 0.62));
                }
            }
        }
        return finalize(dots, lines);
    };
    const weaving = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const proj = makeProj(t * 0.35, 0.3, cx, cy, R);
        const dots = [];
        const je = 26;
        for (let s = 0; s < 3; s++) {
            const phase = (s / 3) * TAU;
            for (let i = 0; i < je; i++) {
                const u = i / je;
                const a = u * TAU;
                const hoehe = Math.sin(a * 2 + phase + t * 1.1) * 0.88;
                const rr = Math.sqrt(Math.max(0, 1 - hoehe * hoehe));
                const [x, y, d] = proj(Math.cos(a) * rr, hoehe, Math.sin(a) * rr);
                dots.push(dot(x, y, d, basis * 0.92));
            }
        }
        return finalize(dots, []);
    };
    const composing = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const proj = makeProj(t * 0.22, 0.26, cx, cy, R);
        const dots = [];
        const laengs = 34, quer = 4;
        for (let i = 0; i < laengs; i++) {
            const u = i / laengs;
            const a = u * TAU;
            const mitte = Math.sin(a * 2 + t * 1.05) * 0.34
                + (noise2(u * 3, t * 0.35) - 0.5) * 0.22;
            for (let k = 0; k < quer; k++) {
                const hoehe = mitte + (k - (quer - 1) / 2) * 0.13;
                if (Math.abs(hoehe) >= 1)
                    continue;
                const rr = Math.sqrt(1 - hoehe * hoehe);
                const [x, y, d] = proj(Math.cos(a) * rr, hoehe, Math.sin(a) * rr);
                const rand = Math.abs(k - (quer - 1) / 2) / ((quer - 1) / 2);
                dots.push({ x, y, depth: d, r: basis * (0.45 + 0.7 * d) * (1 - rand * 0.45) });
            }
        }
        return finalize(dots, []);
    };
    const breathing = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const n = 42;
        const dots = [];
        const atem = 0.84 + Math.sin(t * 0.85) * 0.12;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU;
            const oval = 1 + Math.cos(2 * (a - t * 0.28)) * 0.19;
            const unruhe = 1 + (noise2(Math.cos(a) * 1.6 + 4, Math.sin(a) * 1.6 + t * 0.4) - 0.5) * 0.14;
            const rr = R * atem * oval * unruhe;
            dots.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr,
                depth: 0.62 + Math.sin(a * 2 + t) * 0.12, r: basis * 1.0 });
        }
        return finalize(dots, []);
    };
    const ECKEN = [0, 3, 4];
    const umriss = (u, ecken) => {
        const a = u * TAU - Math.PI / 2;
        if (ecken < 3)
            return [Math.cos(a), Math.sin(a)];
        const k = u * ecken;
        const seite = Math.floor(k) % ecken;
        const f = k - Math.floor(k);
        const w0 = (seite / ecken) * TAU - Math.PI / 2;
        const w1 = ((seite + 1) / ecken) * TAU - Math.PI / 2;
        return [lerp(Math.cos(w0), Math.cos(w1), f), lerp(Math.sin(w0), Math.sin(w1), f)];
    };
    const shaping = (size, t) => {
        const { cx, cy, R, basis } = masse(size);
        const n = 40;
        const takt = t * 0.42;
        const schritt = Math.floor(takt);
        const roh = Math.max(0, Math.min(1, (takt - schritt - 0.35) / 0.65));
        const weich = roh * roh * (3 - 2 * roh);
        const von = ECKEN[schritt % ECKEN.length] ?? 0;
        const nach = ECKEN[(schritt + 1) % ECKEN.length] ?? 0;
        const dots = [];
        for (let i = 0; i < n; i++) {
            const u = i / n;
            const [ax, ay] = umriss(u, von);
            const [bx, by] = umriss(u, nach);
            const x = lerp(ax, bx, weich), y = lerp(ay, by, weich);
            dots.push({ x: cx + x * R, y: cy + y * R,
                depth: 0.55 + 0.35 * (1 - Math.abs(u * 2 - 1)),
                r: basis * 0.95 });
        }
        return finalize(dots, []);
    };
    const ORB_STATES = [
        'working', 'searching', 'solving', 'listening', 'connecting',
        'weaving', 'composing', 'breathing', 'shaping',
    ];
    const ORB_MODES = {
        working, searching, solving, listening, connecting,
        weaving, composing, breathing, shaping,
    };
    const ORB_TEXTE = {
        working: 'arbeitet',
        searching: 'sucht',
        solving: 'löst',
        listening: 'hört zu',
        connecting: 'verbindet',
        weaving: 'verknüpft',
        composing: 'schreibt',
        breathing: 'wartet',
        shaping: 'formt',
    };
    const orbFrame = (state, size, t) => {
        const m = ORB_MODES[state] ?? working;
        return m(size, t);
    };
    return { ORB_STATES, ORB_MODES, ORB_TEXTE, orbFrame };
})();
window.OrbModes = OrbModes;
