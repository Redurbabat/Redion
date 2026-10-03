"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/textur.ts (npm run bauen:ts). */
const Textur = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const HALTER = 'ru-textur-halter';
    const FEIN = 'ru-textur-fein';
    const GROB = 'ru-textur-grob';
    const rauschen = (id, dichte, lagen, saat) => {
        const f = document.createElementNS(NS, 'filter');
        f.setAttribute('id', id);
        f.setAttribute('x', '0');
        f.setAttribute('y', '0');
        f.setAttribute('width', '100%');
        f.setAttribute('height', '100%');
        const t = document.createElementNS(NS, 'feTurbulence');
        t.setAttribute('type', 'fractalNoise');
        t.setAttribute('baseFrequency', dichte);
        t.setAttribute('numOctaves', lagen);
        t.setAttribute('seed', saat);
        t.setAttribute('stitchTiles', 'stitch');
        f.append(t);
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
        defs.append(rauschen(FEIN, '0.85', '3', '7'), rauschen(GROB, '0.24', '2', '19'));
        svg.append(defs);
        const huelle = document.createElement('div');
        huelle.setAttribute('aria-hidden', 'true');
        huelle.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        huelle.inert = true;
        huelle.append(svg);
        document.body.append(huelle);
    };
    const legen = (wirt) => {
        sicherstellen();
        if (wirt.querySelector(':scope > .ru-textur'))
            return;
        wirt.classList.add('ru-textur-wirt');
        for (const lage of ['ru-textur ru-textur-fein', 'ru-textur ru-textur-grob']) {
            const i = document.createElement('i');
            i.className = lage;
            i.setAttribute('aria-hidden', 'true');
            wirt.prepend(i);
        }
    };
    return { HALTER, FEIN, GROB, sicherstellen, legen };
})();
window.Textur = Textur;
