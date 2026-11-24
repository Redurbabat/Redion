"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/shapes.ts (npm run bauen:ts). */
const GfxShapes = (() => {
    const PALETTE = [
        ['#529cca', 'Blau'], ['#4dab9a', 'Gruen'], ['#ffa344', 'Orange'],
        ['#ff7369', 'Rot'], ['#9a6dd7', 'Violett'], ['#e255a1', 'Rosa'],
        ['#ffdc49', 'Gelb'], ['#9b9a97', 'Grau'],
    ];
    const NS = 'http://www.w3.org/2000/svg';
    const sv = (name, attrs = {}) => {
        const el = document.createElementNS(NS, name);
        for (const [k, v] of Object.entries(attrs))
            el.setAttribute(k, String(v));
        return el;
    };
    const tinte = (el, rolle, farbe) => {
        if (typeof Farben === 'undefined' || !Farben.parse(farbe))
            return;
        const hell = Farben.inkOnLight(farbe);
        if (!hell || hell === Farben.toHex(Farben.parse(farbe) ?? [0, 0, 0]))
            return;
        el.setAttribute('data-tinte', rolle);
        el.style.setProperty('--tinte-hell', hell);
    };
    const zahl = (roh, ersatz = 0) => {
        const n = Number(roh);
        return Number.isFinite(n) ? n : ersatz;
    };
    const rahmenVon = (s) => {
        if (s?.art === 'stift') {
            const pts = Array.isArray(s.pts) ? s.pts : [];
            if (!pts.length)
                return { x: 0, y: 0, w: 0, h: 0 };
            const xs = pts.map((q) => zahl(q?.[0])), ys = pts.map((q) => zahl(q?.[1]));
            const x = Math.min(...xs), y = Math.min(...ys);
            return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
        }
        if (s?.art === 'text')
            return { x: zahl(s.x), y: zahl(s.y) - 14,
                w: Math.max(20, String(s.text || '').length * 8), h: 20 };
        const x = zahl(s?.x), y = zahl(s?.y), w = zahl(s?.w), h = zahl(s?.h);
        return { x: Math.min(x, x + w), y: Math.min(y, y + h), w: Math.abs(w), h: Math.abs(h) };
    };
    const randPunkt = (rahmen, zielX, zielY) => {
        const mx = rahmen.x + rahmen.w / 2, my = rahmen.y + rahmen.h / 2;
        const dx = zielX - mx, dy = zielY - my;
        if (!dx && !dy)
            return [mx, my];
        const halbW = Math.max(1, rahmen.w / 2), halbH = Math.max(1, rahmen.h / 2);
        const anteil = Math.min(halbW / Math.abs(dx || .0001), halbH / Math.abs(dy || .0001));
        return [mx + dx * anteil, my + dy * anteil];
    };
    const verbindungsStrecke = (a, b) => [
        randPunkt(a, b.x + b.w / 2, b.y + b.h / 2),
        randPunkt(b, a.x + a.w / 2, a.y + a.h / 2)
    ];
    const verbindungsPfad = (a, b) => {
        const [[x1, y1], [x2, y2]] = verbindungsStrecke(a, b);
        return `M${x1} ${y1} L${x2} ${y2}`;
    };
    const verbindungZeichne = (form, a, b, marke) => {
        const pfad = sv('path', {
            d: verbindungsPfad(a, b), stroke: form.farbe || 'currentColor', 'stroke-width': 2,
            fill: 'none', 'stroke-dasharray': '6 4', 'marker-end': `url(#${marke})`
        });
        pfad.dataset.sid = form.id;
        return pfad;
    };
    const zeilenUmbruch = (text, breite) => {
        const proZeile = Math.max(6, Math.floor(breite / 7.4));
        const worte = String(text).split(/\s+/);
        const out = [];
        let zeile = '';
        worte.forEach(x => {
            if ((zeile + ' ' + x).trim().length > proZeile) {
                out.push(zeile.trim());
                zeile = x;
            }
            else
                zeile += ' ' + x;
        });
        if (zeile.trim())
            out.push(zeile.trim());
        return out.slice(0, 8);
    };
    const pfeilMarke = (defs, kennung, farbe = 'context-stroke') => {
        const m = sv('marker', {
            id: kennung, markerWidth: 9, markerHeight: 9,
            refX: 8, refY: 3, orient: 'auto'
        });
        m.appendChild(sv('path', { d: 'M0,0 L9,3 L0,6 z', fill: farbe }));
        defs.appendChild(m);
        return m;
    };
    const zeichne = (s, o = {}) => {
        if (!s || typeof s !== 'object')
            return sv('g');
        const strich = o.strich ?? 2.5;
        const farbe = String(s.farbe || 'currentColor');
        if (s.art === 'stift' || s.art === 'linie' || s.art === 'pfeil') {
            const pts = Array.isArray(s.pts) ? s.pts : [];
            const kern = globalThis.InkGeometry;
            const d = s.art === 'stift'
                ? (!pts.length ? ''
                    : kern && typeof kern.path === 'function' && pts.length >= 3
                        ? String(kern.path(pts.map((q) => [zahl(q?.[0]), zahl(q?.[1])])))
                        : 'M' + pts.map((q) => zahl(q?.[0]) + ' ' + zahl(q?.[1])).join(' L'))
                : `M${zahl(s.x)} ${zahl(s.y)} L${zahl(s.x) + zahl(s.w)} ${zahl(s.y) + zahl(s.h)}`;
            const druck = s.pressure;
            const mitDruck = s.art === 'stift' && Array.isArray(druck) && druck.length === pts.length &&
                pts.length >= 3 && typeof kern?.outline === 'function' && typeof kern?.verjuengen === 'function';
            const umriss = mitDruck ? (() => {
                const punkte = pts.map((q) => [zahl(q?.[0]), zahl(q?.[1])]);
                const halb = druck.map(w => strich / 2 * (0.5 + Math.max(0.05, Math.min(1, zahl(w, 0.5)))));
                return String(kern.outline(punkte, kern.verjuengen(punkte, halb, 0.35, Math.max(3, Math.min(12, strich * 2.2)))));
            })() : '';
            const p = umriss
                ? sv('path', { d: umriss, fill: farbe, stroke: 'none' })
                : sv('path', {
                    d, stroke: farbe, 'stroke-width': strich, fill: 'none',
                    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
                });
            if (s.art === 'pfeil' && o.pfeilMarke)
                p.setAttribute('marker-end', `url(#${o.pfeilMarke})`);
            p.dataset.sid = s.id;
            tinte(p, umriss ? 'schrift' : 'strich', farbe);
            const fang = sv('path', {
                d, stroke: 'transparent', 'stroke-width': 16,
                fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            });
            fang.dataset.sid = s.id;
            const gruppe = sv('g');
            gruppe.appendChild(fang);
            gruppe.appendChild(p);
            return gruppe;
        }
        if (s.art === 'rechteck' || s.art === 'notiz') {
            const g = sv('g');
            const x = Math.min(zahl(s.x), zahl(s.x) + zahl(s.w));
            const y = Math.min(zahl(s.y), zahl(s.y) + zahl(s.h));
            const r = sv('rect', {
                x, y, width: Math.abs(zahl(s.w)), height: Math.abs(zahl(s.h)),
                rx: s.art === 'notiz' ? 3 : 5,
                fill: s.art === 'notiz' ? farbe : 'none', stroke: farbe, 'stroke-width': 2,
                'fill-opacity': s.art === 'notiz' ? .85 : 1,
                'pointer-events': 'all'
            });
            r.dataset.sid = s.id;
            if (s.art === 'rechteck')
                tinte(r, 'strich', farbe);
            g.appendChild(r);
            if (s.text) {
                const t = sv('text', {
                    x: x + 10, y: y + 22,
                    fill: s.art === 'notiz' ? '#1c1c1c' : farbe, 'font-size': 14
                });
                if (s.art !== 'notiz')
                    tinte(t, 'schrift', farbe);
                zeilenUmbruch(String(s.text), Math.abs(zahl(s.w)) - 18).forEach((z, i) => {
                    const ts = sv('tspan', { x: x + 10, dy: i ? 18 : 0 });
                    ts.textContent = z;
                    t.appendChild(ts);
                });
                g.appendChild(t);
            }
            return g;
        }
        if (s.art === 'bild') {
            const dateiId = String(s.dateiId || '');
            const bekannt = o.bildAdresse ? o.bildAdresse(dateiId) : null;
            if (bekannt === undefined && dateiId)
                o.bildHolen?.(dateiId);
            const rahmen = {
                x: Math.min(zahl(s.x), zahl(s.x) + zahl(s.w)),
                y: Math.min(zahl(s.y), zahl(s.y) + zahl(s.h)),
                w: Math.abs(zahl(s.w)) || 160, h: Math.abs(zahl(s.h)) || 120
            };
            if (!bekannt) {
                const platz = sv('g');
                platz.appendChild(sv('rect', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                    rx: 5, fill: 'none', stroke: farbe, 'stroke-width': 2,
                    'stroke-dasharray': '5 4' }));
                const wort = sv('text', { x: rahmen.x + rahmen.w / 2, y: rahmen.y + rahmen.h / 2,
                    fill: farbe, 'font-size': 13, 'text-anchor': 'middle' });
                wort.textContent = bekannt === null ? 'Bild fehlt' : 'Bild lädt …';
                platz.appendChild(wort);
                platz.dataset.sid = s.id;
                return platz;
            }
            const bild = sv('image', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                preserveAspectRatio: 'xMidYMid meet' });
            bild.setAttribute('href', bekannt);
            bild.dataset.sid = s.id;
            return bild;
        }
        if (s.art === 'ellipse') {
            const e = sv('ellipse', {
                cx: zahl(s.x) + zahl(s.w) / 2, cy: zahl(s.y) + zahl(s.h) / 2,
                rx: Math.abs(zahl(s.w) / 2), ry: Math.abs(zahl(s.h) / 2),
                fill: 'none', stroke: farbe, 'stroke-width': 2,
                'pointer-events': 'all'
            });
            e.dataset.sid = s.id;
            tinte(e, 'strich', farbe);
            return e;
        }
        if (s.art === 'text') {
            const t = sv('text', { x: zahl(s.x), y: zahl(s.y), fill: farbe,
                'font-size': 17, 'font-weight': 500 });
            t.textContent = String(s.text || '');
            t.dataset.sid = s.id;
            tinte(t, 'schrift', farbe);
            return t;
        }
        const leer = sv('g');
        leer.dataset.sid = s.id;
        return leer;
    };
    return { zeichne, rahmenVon, zeilenUmbruch, pfeilMarke, verbindungsStrecke, verbindungsPfad, verbindungZeichne, sv, PALETTE };
})();
window.GfxShapes = GfxShapes;
