"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/linse.ts (npm run bauen:ts). */
const Linse = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const HALTER = 'ru-linse-halter';
    const FAHRT = 'ru-linse-fahrt';
    const TROPFEN = 'ru-linse-tropfen';
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
    const tropfen = () => {
        const f = el('filter', {
            id: TROPFEN, x: '-20%', y: '-20%', width: '140%', height: '140%',
            'color-interpolation-filters': 'sRGB'
        });
        f.append(el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '7', result: 'weich' }), el('feColorMatrix', { in: 'weich', type: 'matrix', result: 'zaeh',
            values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10' }), el('feComposite', { in: 'SourceGraphic', in2: 'zaeh', operator: 'atop' }));
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
    let tropfenNutzer = 0;
    const tropfenLeihen = () => {
        sicherstellen();
        const defs = document.querySelector(`#${HALTER} defs`);
        if (defs && !document.getElementById(TROPFEN))
            defs.append(tropfen());
        tropfenNutzer++;
        let zurueck = false;
        return () => {
            if (zurueck)
                return;
            zurueck = true;
            tropfenNutzer = Math.max(0, tropfenNutzer - 1);
            if (!tropfenNutzer)
                document.getElementById(TROPFEN)?.remove();
        };
    };
    const SATZ_GESAMT = 1650;
    let satzBeginn = 0;
    let satzBeobachter = null;
    let beobachtet = null;
    const beobachten = (satz) => {
        if (beobachtet === satz || typeof ResizeObserver === 'undefined')
            return;
        satzBeobachter?.disconnect();
        beobachtet = satz;
        let mass = '';
        satzBeobachter = new ResizeObserver(() => {
            if (!satz.isConnected) {
                satzBeobachter?.disconnect();
                satzBeobachter = null;
                beobachtet = null;
                return;
            }
            const r = satz.getBoundingClientRect();
            const neu = Math.round(r.width) + '×' + Math.round(r.height) + ' ' + getComputedStyle(satz).fontSize;
            if (!mass || neu === mass) {
                mass = neu;
                return;
            }
            mass = neu;
            ueberSatz(satz, false);
        });
        satzBeobachter.observe(satz);
    };
    const ueberSatz = (satz, gleiten) => {
        const traeger = satz.parentElement;
        if (!traeger)
            return;
        traeger.querySelector(':scope > .ru-held-linse')?.remove();
        const zeilen = [...satz.querySelectorAll('.ru-held-zeile')];
        const z1 = zeilen[0], z2 = zeilen[zeilen.length - 1];
        if (!z1 || !z2)
            return;
        sicherstellen();
        beobachten(satz);
        const still = typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
        const jetzt = performance.now();
        const versatz = still ? SATZ_GESAMT
            : gleiten ? 0 : (satzBeginn && jetzt - satzBeginn < SATZ_GESAMT ? jetzt - satzBeginn : SATZ_GESAMT);
        if (gleiten && !still)
            satzBeginn = jetzt;
        const kasten = traeger.getBoundingClientRect();
        const lage = (z) => {
            const r = z.getBoundingClientRect();
            return { x: r.left - kasten.left, y: r.top - kasten.top, b: r.width, h: r.height };
        };
        const a = lage(z1), e = lage(z2);
        const stil = getComputedStyle(satz);
        const fs = parseFloat(stil.fontSize) || 40;
        const D = Math.round(Math.max(48, Math.min(84, fs * 1.7)));
        const S = 1.2;
        const P0 = { x: a.x + fs * 0.4, y: a.y + a.h / 2 };
        const P1 = { x: a.x + a.b - fs * 0.8, y: a.y + a.h / 2 };
        const P2 = { x: e.x + e.b - fs * 0.8, y: e.y + e.h / 2 };
        const linse = document.createElement('div');
        linse.className = 'ru-held-linse';
        linse.setAttribute('aria-hidden', 'true');
        linse.style.width = linse.style.height = D + 'px';
        const abschrift = (klasse) => {
            const huelle = document.createElement('div');
            huelle.className = klasse;
            const bild = document.createElement('div');
            bild.className = 'ru-held-linse-bild';
            zeilen.forEach((z, i) => {
                if (i)
                    bild.append(document.createElement('br'));
                bild.append(document.createTextNode(z.textContent || ''));
            });
            bild.style.font = stil.font;
            bild.style.letterSpacing = stil.letterSpacing;
            bild.style.width = satz.clientWidth + 'px';
            huelle.append(bild);
            return { huelle, bild };
        };
        const glasTeil = abschrift('ru-held-linse-glas');
        const frostTeil = abschrift('ru-held-linse-frost');
        linse.append(frostTeil.huelle, glasTeil.huelle);
        traeger.append(linse);
        const hr = satz.getBoundingClientRect();
        const H = { x: hr.left - kasten.left, y: hr.top - kasten.top };
        const lagenText = (c, sx = 1, sy = 1) => [
            `translate(${(c.x - D / 2).toFixed(2)}px,${(c.y - D / 2).toFixed(2)}px) scale(${sx.toFixed(3)},${sy.toFixed(3)})`,
            `translate(${(D / 2 - S * (c.x - H.x)).toFixed(2)}px,${(D / 2 - S * (c.y - H.y)).toFixed(2)}px) scale(${S})`
        ];
        if (still || versatz >= SATZ_GESAMT) {
            const [l, b] = lagenText(P2);
            linse.style.transform = l;
            glasTeil.bild.style.transform = frostTeil.bild.style.transform = b;
            frostTeil.huelle.style.opacity = '0';
            return;
        }
        const feder = RedionSpring.sample(RedionSpring.preset('snappy'), 0, 1, 0, 16);
        const T1 = 260, T2 = 900;
        const bilder = [{ t: 0, c: P0, sx: 1, sy: 1 }, { t: T1, c: P0, sx: 1, sy: 1 }];
        const strecke = (von, nach, ab) => {
            let vorher = von, tv = ab;
            feder.values.forEach((v, i) => {
                const t = ab + Math.min(i * 16, feder.duration);
                const c = { x: von.x + (nach.x - von.x) * v, y: von.y + (nach.y - von.y) * v };
                const dt = Math.max(1, t - tv);
                const tempo = Math.hypot(c.x - vorher.x, c.y - vorher.y) / dt;
                const sx = 1 + Math.min(0.4, tempo * 0.16), sy = 1 - 0.5 * (sx - 1);
                bilder.push({ t, c, sx, sy });
                vorher = c;
                tv = t;
            });
            return ab + feder.duration;
        };
        const ende1 = strecke(P0, P1, T1);
        bilder.push({ t: Math.max(ende1, T2 - 1), c: P1, sx: 1, sy: 1 });
        const ende2 = strecke(P1, P2, Math.max(T2, ende1 + 20));
        const T = Math.max(SATZ_GESAMT, ende2);
        bilder.push({ t: T, c: P2, sx: 1, sy: 1 });
        const lauf = [];
        const los = (el, kf) => {
            const an = el.animate(kf, { duration: T, easing: 'linear', fill: 'both' });
            an.currentTime = versatz;
            lauf.push(an);
        };
        los(linse, bilder.map(b => ({ offset: b.t / T, transform: lagenText(b.c, b.sx, b.sy)[0] })));
        const innen = bilder.map(b => ({ offset: b.t / T, transform: lagenText(b.c)[1] }));
        los(glasTeil.bild, innen);
        los(frostTeil.bild, innen);
        const blende = (t) => t / T;
        const scharf = [
            { offset: 0, opacity: 1 }, { offset: blende(T1), opacity: 1 }, { offset: blende(T1 + 70), opacity: 0 },
            { offset: blende(ende1 - 140), opacity: 0 }, { offset: blende(ende1 - 60), opacity: 1 },
            { offset: blende(Math.max(T2, ende1 + 20)), opacity: 1 }, { offset: blende(Math.max(T2, ende1 + 20) + 70), opacity: 0 },
            { offset: blende(ende2 - 140), opacity: 0 }, { offset: blende(ende2 - 60), opacity: 1 }, { offset: 1, opacity: 1 }
        ].sort((x, y) => x.offset - y.offset);
        los(glasTeil.huelle, scharf);
        los(frostTeil.huelle, scharf.map(k => ({ offset: k.offset, opacity: 1 - k.opacity })));
        const pop = RedionSpring.token('bouncy');
        const auf = linse.animate([{ scale: '0.4', opacity: 0 }, { scale: '1', opacity: 1 }], { duration: pop.duration, easing: pop.easing, fill: 'both' });
        auf.currentTime = Math.min(versatz, pop.duration);
        lauf.push(auf);
        if (versatz < 900) {
            satz.style.setProperty('--ru-held-versatz', (-versatz) + 'ms');
            satz.classList.add('ru-held-kommt');
            const fertig = () => { satz.classList.remove('ru-held-kommt'); satz.style.removeProperty('--ru-held-versatz'); };
            z2.addEventListener('animationend', ev => { if (ev.target === z2)
                fertig(); }, { once: true });
            setTimeout(fertig, 2400);
        }
        Promise.all(lauf.map(x => x.finished)).then(() => {
            const [l, b] = lagenText(P2);
            linse.style.transform = l;
            glasTeil.bild.style.transform = frostTeil.bild.style.transform = b;
            frostTeil.huelle.style.opacity = '0';
            lauf.forEach(x => x.cancel());
        }).catch(() => { });
    };
    return { HALTER, FAHRT, TROPFEN, sicherstellen, tropfenLeihen, ueberSatz };
})();
window.Linse = Linse;
