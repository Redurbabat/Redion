"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/orb.ts (npm run bauen:ts). */
const Orb = (() => {
    const { orbFrame, ORB_TEXTE } = OrbModes;
    const zuRgb = (farbe) => {
        const m = farbe.match(/-?\d+(\.\d+)?/g);
        if (!m || m.length < 3)
            return [60, 60, 60];
        return [Number(m[0]) || 0, Number(m[1]) || 0, Number(m[2]) || 0];
    };
    const malen = (ctx, bild, size, tinte) => {
        ctx.clearRect(0, 0, size, size);
        const [r, g, b] = tinte;
        for (const l of bild.lines) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(0.12 + 0.3 * l.depth).toFixed(3)})`;
            ctx.lineWidth = l.w;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
        }
        for (const d of bild.dots) {
            ctx.fillStyle = `rgba(${r},${g},${b},${(0.16 + 0.74 * d.depth).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    const setzen = (wirt, start = 'working', groesse = 64) => {
        let art = start;
        let laeuft = true;
        let bild = 0;
        let sichtbar = true;
        const c = document.createElement('canvas');
        c.className = 'orb';
        c.setAttribute('role', 'img');
        c.style.width = groesse + 'px';
        c.style.height = groesse + 'px';
        wirt.appendChild(c);
        const beschriften = () => {
            const wort = ORB_TEXTE[art] || 'arbeitet';
            c.setAttribute('aria-label', 'Redion ' + wort + ' …');
            c.title = 'Redion ' + wort + ' …';
        };
        beschriften();
        const ctx = c.getContext('2d');
        if (!ctx) {
            c.remove();
            return { zustand: (n) => { art = n; }, stopp: () => { } };
        }
        const ruhe = AppEinstellung.wenigBewegung();
        const zeichnen = (jetzt) => {
            if (!laeuft)
                return;
            const dpr = Math.min(2, (window.devicePixelRatio || 1));
            const px = Math.round(groesse * dpr);
            if (c.width !== px) {
                c.width = px;
                c.height = px;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const t = ruhe ? 2.4 : jetzt / 1000;
            const tinte = zuRgb(getComputedStyle(c).color);
            malen(ctx, orbFrame(art, groesse, t), groesse, tinte);
            if (ruhe)
                return;
            if (sichtbar && !document.hidden)
                bild = requestAnimationFrame(zeichnen);
        };
        bild = requestAnimationFrame(zeichnen);
        let beobachter;
        if (typeof IntersectionObserver === 'function') {
            beobachter = new IntersectionObserver((eintraege) => {
                const e = eintraege[0];
                if (!e)
                    return;
                sichtbar = e.isIntersecting;
                if (sichtbar && laeuft && !ruhe && !bild)
                    bild = requestAnimationFrame(zeichnen);
            });
            beobachter.observe(c);
        }
        const beiSicht = () => {
            if (!document.hidden && laeuft && !ruhe && sichtbar) {
                bild = requestAnimationFrame(zeichnen);
            }
        };
        document.addEventListener('visibilitychange', beiSicht);
        return {
            zustand(neu) {
                if (neu === art)
                    return;
                art = neu;
                beschriften();
            },
            stopp() {
                laeuft = false;
                if (bild)
                    cancelAnimationFrame(bild);
                bild = 0;
                beobachter?.disconnect();
                document.removeEventListener('visibilitychange', beiSicht);
                c.remove();
            },
        };
    };
    return { setzen, malen };
})();
window.Orb = Orb;
