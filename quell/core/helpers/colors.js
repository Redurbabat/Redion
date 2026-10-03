"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/colors.ts (npm run bauen:ts). */
const Farben = (() => {
    const NAMEN = {
        default: 'Standard',
        gray: 'Grau',
        brown: 'Braun',
        orange: 'Orange',
        yellow: 'Gelb',
        green: 'Grün',
        blue: 'Blau',
        purple: 'Violett',
        pink: 'Rosa',
        red: 'Rot',
    };
    const name = (id) => NAMEN[String(id || '')] || String(id || '');
    const alle = () => Object.keys(NAMEN);
    const HEX = {
        '#2eaadc': 'Blau', '#6c8cff': 'Indigo', '#5cbf8a': 'Grün',
        '#e0a33a': 'Gelb', '#e06a94': 'Rosa', '#9a6dd7': 'Violett',
        '#ff7369': 'Rot', '#8a8a8a': 'Grau',
        '#529cca': 'Blau', '#4dab9a': 'Türkis', '#ffa344': 'Orange',
        '#e255a1': 'Magenta', '#ffdc49': 'Gelb', '#9b9a97': 'Grau',
        '#7552dc': 'Violett', '#4364d6': 'Indigo', '#0071b2': 'Blau',
        '#00787e': 'Türkis', '#007d46': 'Grün', '#986000': 'Bernstein',
        '#c04020': 'Koralle', '#ba3c77': 'Rosa', '#686d73': 'Graphit',
    };
    const nachHex = (wert) => HEX[String(wert || '').toLowerCase()] || 'Eigene Farbe';
    const kennung = (wert) => {
        const t = String(wert || '');
        return t !== 'default' && Object.prototype.hasOwnProperty.call(NAMEN, t) ? t : '';
    };
    const marke = (wert, variable = '--deckel-farbe') => {
        const k = kennung(wert);
        return k ? ` data-farbe="${k}" style="${variable}:var(--c-${k})"` : '';
    };
    const parse = (wert) => {
        const t = String(wert ?? '').trim().toLowerCase();
        let m = /^#([0-9a-f]{3,8})$/.exec(t);
        if (m && m[1]) {
            let h = m[1];
            if (h.length === 3 || h.length === 4)
                h = h.split('').map(c => c + c).join('');
            if (h.length !== 6 && h.length !== 8)
                return null;
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }
        m = /^rgba?\(([^)]+)\)$/.exec(t);
        if (m && m[1]) {
            const z = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
            if (z.length < 3 || z.slice(0, 3).some(v => !Number.isFinite(v)))
                return null;
            return [z[0] ?? 0, z[1] ?? 0, z[2] ?? 0];
        }
        return null;
    };
    const toHex = (c) => '#' + [0, 1, 2].map(i => Math.round(Math.max(0, Math.min(255, c[i] ?? 0)))
        .toString(16).padStart(2, '0')).join('');
    const lin = (v) => {
        const x = v / 255;
        return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const unlin = (v) => {
        const x = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
        return Math.round(Math.max(0, Math.min(1, x)) * 255);
    };
    const luminance = (c) => 0.2126 * lin(c[0] ?? 0) + 0.7152 * lin(c[1] ?? 0) + 0.0722 * lin(c[2] ?? 0);
    const contrast = (a, b) => {
        const x = parse(a), y = parse(b);
        if (!x || !y)
            return 1;
        const la = luminance(x), lb = luminance(y);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    const toOklab = (c) => {
        const r = lin(c[0] ?? 0), g = lin(c[1] ?? 0), b = lin(c[2] ?? 0);
        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
    };
    const fromOklabLinear = (L, a, b) => {
        const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
        const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
        const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
        return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    };
    const oklch = (wert) => {
        const c = parse(wert);
        if (!c)
            return null;
        const [L, a, b] = toOklab(c);
        let h = Math.atan2(b, a) * 180 / Math.PI;
        if (h < 0)
            h += 360;
        return [L, Math.hypot(a, b), h];
    };
    const fromOklch = (L, C, h) => {
        const ll = Math.max(0, Math.min(1, L));
        const bei = (c) => fromOklabLinear(ll, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180));
        const drin = (v) => v.every(x => x >= -1e-4 && x <= 1 + 1e-4);
        let c = Math.max(0, C);
        if (!drin(bei(c))) {
            let lo = 0, hi = c;
            for (let i = 0; i < 28; i++) {
                const mid = (lo + hi) / 2;
                if (drin(bei(mid)))
                    lo = mid;
                else
                    hi = mid;
            }
            c = lo;
        }
        return toHex(bei(c).map(unlin));
    };
    const mix = (a, b, t) => {
        const x = parse(a), y = parse(b);
        if (!x || !y)
            return String(a ?? '');
        const A = toOklab(x), B = toOklab(y);
        const m = [0, 1, 2].map(i => (A[i] ?? 0) * t + (B[i] ?? 0) * (1 - t));
        return toHex(fromOklabLinear(m[0] ?? 0, m[1] ?? 0, m[2] ?? 0).map(unlin));
    };
    const stepUntil = (start, richtung, reicht) => {
        const lch = oklch(start);
        if (!lch)
            return start;
        const [L, C, h] = lch;
        let x = start;
        for (let i = 1; i <= 200 && !reicht(x); i++) {
            const l = L + richtung * i * 0.005;
            if (l < 0 || l > 1)
                break;
            x = fromOklch(l, C, h);
        }
        return x;
    };
    const accentSet = (accent, ground, bg, card) => {
        const a = parse(accent);
        if (!a || !parse(bg) || !parse(card))
            return null;
        const A = toHex(a);
        const lch = oklch(A);
        if (!lch)
            return null;
        const [L, C, h] = lch;
        const dunkel = ground !== 'light';
        let onAccent = '#ffffff';
        if (contrast(onAccent, A) < 4.5) {
            const fast = fromOklch(0.2, Math.min(C, 0.04), h);
            onAccent = contrast(fast, A) >= 4.5 ? fast
                : (contrast('#000000', A) >= contrast('#ffffff', A) ? '#000000' : '#ffffff');
        }
        const reicht = (x) => Math.min(contrast(x, bg), contrast(x, card)) >= 4.6;
        const ink = reicht(A) ? A : stepUntil(A, dunkel ? 1 : -1, reicht);
        let hover = fromOklch(L + (dunkel ? 0.03 : -0.04), C, h);
        if (contrast(onAccent, hover) < 4.5)
            hover = fromOklch(L + (dunkel ? -0.03 : 0.03), C, h);
        if (contrast(onAccent, hover) < 4.5)
            hover = A;
        const soft = `rgba(${a[0]},${a[1]},${a[2]},${dunkel ? '.16' : '.12'})`;
        return { onAccent, ink, hover, soft };
    };
    const ladder = (text, bg, card, hover, ground) => {
        if (!parse(text) || !parse(bg) || !parse(card))
            return null;
        const dunkel = ground !== 'light';
        const flaechen = [bg, card, hover].filter(x => !!parse(x));
        const genug = (x, grenze) => flaechen.every(f => contrast(x, f) >= grenze);
        const suche = (anteil, grenze) => {
            for (let t = anteil; t <= 1.0001; t += 0.01) {
                const x = mix(text, bg, t);
                if (genug(x, grenze))
                    return x;
            }
            return toHex(parse(text) ?? [0, 0, 0]);
        };
        return {
            dim: suche(dunkel ? 0.70 : 0.76, 4.5),
            faint: suche(dunkel ? 0.47 : 0.58, 3.0),
            press: mix(text, card, dunkel ? 0.11 : 0.09),
        };
    };
    const tintenSpeicher = new Map();
    const inkOnLight = (farbe) => {
        const c = parse(farbe);
        if (!c)
            return String(farbe ?? '');
        const hex = toHex(c);
        const alt = tintenSpeicher.get(hex);
        if (alt)
            return alt;
        const reicht = (x) => contrast(x, '#f3f2f8') >= 4.6;
        const tinte = reicht(hex) ? hex : stepUntil(hex, -1, reicht);
        if (tintenSpeicher.size < 512)
            tintenSpeicher.set(hex, tinte);
        return tinte;
    };
    const ACCENTS = [
        ['#7552dc', 'Violett'], ['#4364d6', 'Indigo'], ['#0071b2', 'Blau'],
        ['#00787e', 'Türkis'], ['#007d46', 'Grün'], ['#986000', 'Bernstein'],
        ['#c04020', 'Koralle'], ['#ba3c77', 'Rosa'], ['#686d73', 'Graphit'],
    ];
    return { name, alle, nachHex, kennung, marke,
        parse, toHex, contrast, oklch, fromOklch, mix,
        accentSet, ladder, inkOnLight, ACCENTS };
})();
window.Farben = Farben;
