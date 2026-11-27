"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/sheet/space.ts (npm run bauen:ts). */
const SheetSpace = (() => {
    const A4_BREITE = 595.28;
    const A4_HOEHE = 841.89;
    const RAND = 56.69;
    const RAUM_VERSION = 1;
    const rund = (n) => Math.round(n * 100) / 100;
    const zuBlatt = (svg, e) => umrechner(svg)(e);
    const umrechner = (svg) => {
        const matrix = svg && svg.getScreenCTM ? svg.getScreenCTM() : null;
        if (!matrix)
            return () => null;
        const invers = matrix.inverse();
        return (e) => {
            const punkt = new DOMPoint(e.clientX, e.clientY).matrixTransform(invers);
            if (!isFinite(punkt.x) || !isFinite(punkt.y))
                return null;
            return [rund(punkt.x), rund(punkt.y)];
        };
    };
    const seitenHoehe = (block) => block?.blattAusrichtung === 'quer' ? A4_BREITE : A4_HOEHE;
    const seiten = (hoehe, seitenmass = A4_HOEHE) => Math.max(1, Math.ceil(Math.round((Number(hoehe) || seitenmass) * 100) / Math.round(seitenmass * 100)));
    const gedrehtVon = (block) => {
        const g = ((Math.round((Number(block?.gedreht) || 0) / 90) * 90) % 360 + 360) % 360;
        return g === 90 || g === 180 || g === 270 ? g : 0;
    };
    const masseVon = (block) => {
        const bw = Number(block?.bw) || Number(block?.blattBreite) || A4_BREITE;
        const bh = Number(block?.bh) || Number(block?.blattHoehe) || A4_HOEHE;
        const g = gedrehtVon(block);
        return g === 90 || g === 270 ? { bw: bh, bh: bw } : { bw, bh };
    };
    const drehHuelle = (block, inhalt) => {
        const g = gedrehtVon(block);
        if (!g)
            return inhalt;
        const bw = Number(block?.bw) || Number(block?.blattBreite) || A4_BREITE;
        const bh = Number(block?.bh) || Number(block?.blattHoehe) || A4_HOEHE;
        const huelle = document.createElement('div');
        huelle.className = 'blatt-dreh';
        huelle.dataset.gedreht = String(g);
        huelle.style.setProperty('--bw', String(bw));
        huelle.style.setProperty('--bh', String(bh));
        huelle.style.setProperty('--dreh', g + 'deg');
        huelle.appendChild(inhalt);
        return huelle;
    };
    return { A4_BREITE, A4_HOEHE, RAND, RAUM_VERSION, rund, zuBlatt, umrechner, seiten, seitenHoehe, gedrehtVon, masseVon, drehHuelle };
})();
window.SheetSpace = SheetSpace;
