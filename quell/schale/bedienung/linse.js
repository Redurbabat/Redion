"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/linse.ts (npm run bauen:ts). */
const Linse = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const HALTER = 'ru-linse-halter';
    const FAHRT = 'ru-linse-fahrt';
    const KARTE = 'data:image/svg+xml;utf8,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='52'><defs>" +
        "<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>" +
        "<stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient>" +
        "<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>" +
        "<stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient>" +
        "</defs><rect width='120' height='52' fill='#808080'/>" +
        "<rect width='120' height='52' fill='url(#x)' style='mix-blend-mode:screen'/>" +
        "<rect width='120' height='52' fill='url(#y)' style='mix-blend-mode:screen'/></svg>");
    const el = (name, werte) => {
        const k = document.createElementNS(NS, name);
        for (const [n, w] of Object.entries(werte))
            k.setAttribute(n, w);
        return k;
    };
    const glas = (id, weich, verschub, saum) => {
        const f = el('filter', {
            id, x: '0%', y: '0%', width: '100%', height: '100%',
            'color-interpolation-filters': 'sRGB'
        });
        f.append(el('feImage', { href: KARTE, x: '0%', y: '0%', width: '100%', height: '100%',
            preserveAspectRatio: 'none', result: 'k' }), el('feGaussianBlur', { in: 'k', stdDeviation: weich, result: 'kw' }), el('feDisplacementMap', { in: 'SourceGraphic', in2: 'kw', scale: verschub,
            xChannelSelector: 'R', yChannelSelector: 'G', result: 'g' }), el('feOffset', { in: 'g', dx: saum, result: 'vr' }), el('feOffset', { in: 'g', dx: '-' + saum, result: 'vb' }), el('feColorMatrix', { in: 'vr', type: 'matrix', result: 'kr',
            values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' }), el('feColorMatrix', { in: 'g', type: 'matrix', result: 'kg',
            values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' }), el('feColorMatrix', { in: 'vb', type: 'matrix', result: 'kb',
            values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' }), el('feBlend', { in: 'kr', in2: 'kg', mode: 'screen', result: 'krg' }), el('feBlend', { in: 'krg', in2: 'kb', mode: 'screen' }));
        return f;
    };
    const sicherstellen = () => {
        if (document.getElementById(HALTER))
            return;
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('id', HALTER);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        const defs = document.createElementNS(NS, 'defs');
        defs.append(glas(FAHRT, '9', '12', '0.3'));
        svg.append(defs);
        const huelle = document.createElement('div');
        huelle.setAttribute('aria-hidden', 'true');
        huelle.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        huelle.inert = true;
        huelle.append(svg);
        document.body.append(huelle);
    };
    return { HALTER, FAHRT, sicherstellen };
})();
window.Linse = Linse;
