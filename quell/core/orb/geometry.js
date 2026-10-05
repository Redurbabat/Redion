"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/orb/geometry.ts (npm run bauen:ts). */
const OrbGeometry = (() => {
    const lerp = (a, b, f) => a + (b - a) * f;
    const hash = (a, b) => {
        const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
        return s - Math.floor(s);
    };
    const noise2 = (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi), b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
        return lerp(lerp(a, b, u), lerp(c, d, u), v);
    };
    const fibDir = (i, n) => {
        const y = 1 - (i / Math.max(n - 1, 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const phi = i * 2.399963229728653;
        return [Math.cos(phi) * r, y, Math.sin(phi) * r];
    };
    const makeProj = (yaw, tilt, cx, cy, scale) => {
        const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw);
        const ct = Math.cos(tilt), st = Math.sin(tilt);
        return (x, y, z) => {
            const x1 = x * cy1 + z * sy1;
            const z1 = -x * sy1 + z * cy1;
            const y2 = y * ct - z1 * st;
            const z2 = y * st + z1 * ct;
            return [cx + x1 * scale, cy + y2 * scale, (z2 + 1) / 2];
        };
    };
    const radiusScale = (size, pow = 0.6) => Math.pow(size / 64, pow);
    const finalize = (dots, lines, rMin = 0.35) => {
        const sichtbar = dots.filter(d => d.r > 0.01)
            .map(d => (d.r < rMin ? { ...d, r: rMin } : d));
        sichtbar.sort((a, b) => a.depth - b.depth);
        return { dots: sichtbar, lines };
    };
    return { lerp, hash, noise2, fibDir, makeProj, radiusScale, finalize };
})();
window.OrbGeometry = OrbGeometry;
