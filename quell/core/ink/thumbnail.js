"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ink/thumbnail.ts (npm run bauen:ts). */
const InkThumbnail = (() => {
    const MIN_BREITE = 0.6;
    const MAX_PUNKTE = 40;
    const MAX_MARKEN = 400;
    const farbeSicher = (roh, ersatz = '#1a1a1a') => {
        const s = String(roh ?? '').trim();
        if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s))
            return s;
        if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(s))
            return s;
        if (/^[a-z]{3,20}$/.test(s))
            return s;
        return ersatz;
    };
    const ausduennen = (pts, hoechstens) => {
        if (pts.length <= hoechstens)
            return pts;
        const schritt = pts.length / hoechstens;
        const raus = [];
        for (let i = 0; i < hoechstens - 1; i++) {
            const p = pts[Math.floor(i * schritt)];
            if (p)
                raus.push(p);
        }
        const letzter = pts[pts.length - 1];
        if (letzter)
            raus.push(letzter);
        return raus;
    };
    const deckel = (marken, quelle, ziel) => {
        const liste = Array.isArray(marken) ? marken : [];
        const qb = Math.max(1, Number(quelle?.breite) || 1);
        const qh = Math.max(1, Number(quelle?.hoehe) || 1);
        const zb = Math.max(1, Number(ziel?.breite) || 1);
        const zh = Math.max(1, Number(ziel?.hoehe) || 1);
        const faktor = Math.min(zb / qb, zh / qh);
        const dx = (zb - qb * faktor) / 2;
        const dy = (zh - qh * faktor) / 2;
        const zuege = [];
        let ausgelassen = 0;
        for (const roh of liste.slice(0, MAX_MARKEN)) {
            const m = (roh || {});
            const art = String(m['art'] || '');
            if (art !== 'stift' && art !== 'marker' && art !== 'linie' &&
                art !== 'rechteck' && art !== 'ellipse' && art !== 'pfeil') {
                ausgelassen++;
                continue;
            }
            const pts = Array.isArray(m['pts']) ? m['pts'] : [];
            if (pts.length < 2) {
                ausgelassen++;
                continue;
            }
            const nutz = ausduennen(pts.filter(p => Array.isArray(p) && p.length >= 2), MAX_PUNKTE);
            if (nutz.length < 2) {
                ausgelassen++;
                continue;
            }
            const runde = (w) => Math.round(w * 10) / 10;
            const teile = nutz.map((p, i) => (i === 0 ? 'M' : 'L') + runde((Number(p[0]) || 0) * faktor + dx) +
                ' ' + runde((Number(p[1]) || 0) * faktor + dy));
            zuege.push({
                d: teile.join(' '),
                farbe: farbeSicher(m['farbe']),
                breite: Math.max(MIN_BREITE, (Number(m['breite']) || 2) * faktor),
                deckkraft: art === 'marker' ? 0.4 : 1,
            });
        }
        return { zuege, marken: liste.length, ausgelassen: ausgelassen + Math.max(0, liste.length - MAX_MARKEN) };
    };
    const hatInhalt = (d) => !!d && d.zuege.length > 0;
    return { deckel, farbeSicher, ausduennen, hatInhalt,
        MIN_BREITE, MAX_PUNKTE, MAX_MARKEN };
})();
globalThis.InkThumbnail = InkThumbnail;
