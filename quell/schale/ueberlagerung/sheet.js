"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/sheet.ts (npm run bauen:ts). */
const Sheet = (() => {
    const KOPF_FREI = 44;
    const ANTEIL_HALB = 0.58;
    const WISCH_PX = 70;
    const SCHWELLE_PX = 12;
    const WISCH_TEMPO = 0.55;
    const sichtbareHoehe = () => {
        const vv = window.visualViewport;
        return Math.round(vv?.height || window.innerHeight || 640);
    };
    const hoeheVon = (h) => {
        const ganz = sichtbareHoehe();
        return h === 'voll'
            ? Math.max(240, ganz - KOPF_FREI)
            : Math.max(200, Math.round(ganz * ANTEIL_HALB));
    };
    let offen = null;
    const oeffne = (opt) => {
        if (offen)
            offen.remove();
        const grund = document.createElement('div');
        grund.className = 'iblatt-grund';
        grund.setAttribute('aria-hidden', 'true');
        const el = document.createElement('div');
        el.className = 'iblatt';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        if (opt.titel)
            el.setAttribute('aria-label', opt.titel.slice(0, 80));
        let stufe = opt.hoehe || 'halb';
        const kopf = document.createElement('div');
        kopf.className = 'iblatt-kopf';
        const griffEl = document.createElement('div');
        griffEl.className = 'iblatt-griff';
        griffEl.setAttribute('aria-hidden', 'true');
        kopf.appendChild(griffEl);
        const zeile = document.createElement('div');
        zeile.className = 'iblatt-zeile';
        const titelEl = document.createElement('div');
        titelEl.className = 'iblatt-titel';
        titelEl.textContent = opt.titel || '';
        zeile.appendChild(titelEl);
        (opt.kopfKnoepfe || []).forEach(k => zeile.appendChild(k));
        const zu = document.createElement('button');
        zu.type = 'button';
        zu.className = 'iblatt-zu';
        zu.textContent = '✕';
        zu.setAttribute('aria-label', 'Vorschau schliessen');
        zeile.appendChild(zu);
        kopf.appendChild(zeile);
        el.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'iblatt-koerper';
        el.appendChild(koerper);
        let weg = false;
        const schliessen = () => {
            if (weg)
                return;
            weg = true;
            el.classList.remove('auf');
            el.style.height = '0px';
            document.body.classList.remove('iblatt-auf');
            document.removeEventListener('keydown', escape, true);
            window.removeEventListener('resize', beiGroesse);
            window.visualViewport?.removeEventListener('resize', beiGroesse);
            grund.remove();
            if (offen === el)
                offen = null;
            setTimeout(() => el.remove(), 230);
            opt.beimSchliessen?.();
        };
        const escape = (e) => {
            if (e.key !== 'Escape')
                return;
            if (document.querySelector('.menu'))
                return;
            e.stopPropagation();
            schliessen();
        };
        const setzeHoehe = (h) => {
            stufe = h;
            el.style.height = hoeheVon(h) + 'px';
            el.dataset.stufe = h;
        };
        const beiGroesse = () => { if (!weg)
            el.style.height = hoeheVon(stufe) + 'px'; };
        grund.addEventListener('click', schliessen);
        zu.addEventListener('click', schliessen);
        document.addEventListener('keydown', escape, true);
        window.addEventListener('resize', beiGroesse);
        window.visualViewport?.addEventListener('resize', beiGroesse);
        let zug = null;
        const uebernehmen = (zeigerId) => {
            if (!zug || zug.bereit)
                return;
            zug.bereit = true;
            el.classList.add('zieht');
            try {
                el.setPointerCapture(zeigerId);
            }
            catch { }
        };
        const darfZiehen = (ziel) => {
            const e = ziel instanceof Element ? ziel : null;
            if (!e)
                return null;
            if (e.closest('.iblatt-kopf'))
                return 'griff';
            if (e.closest('.iblatt-koerper'))
                return 'koerper';
            return null;
        };
        el.addEventListener('pointerdown', e => {
            if (e.button !== 0)
                return;
            const wo = darfZiehen(e.target);
            if (!wo)
                return;
            if (wo === 'koerper' && koerper.scrollTop > 0)
                return;
            const el2 = e.target instanceof Element ? e.target : null;
            if (el2?.closest('button, input, textarea, select'))
                return;
            zug = { y0: e.clientY, h0: el.getBoundingClientRect().height, t0: e.timeStamp,
                ausKoerper: wo === 'koerper', bereit: false };
            if (!zug.ausKoerper)
                uebernehmen(e.pointerId);
        });
        el.addEventListener('pointermove', e => {
            if (!zug)
                return;
            const d = e.clientY - zug.y0;
            if (zug.ausKoerper && d < 0) {
                if (!zug.bereit)
                    zug = null;
                return;
            }
            if (!zug.bereit) {
                if (d < SCHWELLE_PX)
                    return;
                uebernehmen(e.pointerId);
            }
            const ganz = sichtbareHoehe();
            const neu = Math.max(60, Math.min(ganz - KOPF_FREI, zug.h0 - d));
            el.style.height = neu + 'px';
        });
        el.addEventListener('touchmove', e => { if (zug?.bereit)
            e.preventDefault(); }, { passive: false });
        const losgelassen = (e) => {
            if (!zug)
                return;
            if (!zug.bereit) {
                zug = null;
                return;
            }
            const d = e.clientY - zug.y0;
            const ms = Math.max(1, e.timeStamp - zug.t0);
            const tempo = d / ms;
            const gezogen = zug;
            zug = null;
            el.classList.remove('zieht');
            try {
                el.releasePointerCapture(e.pointerId);
            }
            catch { }
            if (tempo > WISCH_TEMPO && d > 24) {
                schliessen();
                return;
            }
            if (tempo < -WISCH_TEMPO && d < -24) {
                setzeHoehe('voll');
                return;
            }
            const jetzt = el.getBoundingClientRect().height;
            if (gezogen.h0 - jetzt > WISCH_PX && stufe === 'halb') {
                schliessen();
                return;
            }
            const kandidaten = [['zu', 0], ['halb', hoeheVon('halb')], ['voll', hoeheVon('voll')]];
            let beste = kandidaten[0];
            kandidaten.forEach(k => { if (Math.abs(k[1] - jetzt) < Math.abs(beste[1] - jetzt))
                beste = k; });
            if (beste[0] === 'zu')
                schliessen();
            else
                setzeHoehe(beste[0]);
        };
        el.addEventListener('pointerup', losgelassen);
        el.addEventListener('pointercancel', e => {
            if (!zug)
                return;
            try {
                el.releasePointerCapture(e.pointerId);
            }
            catch { }
            zug = null;
            el.classList.remove('zieht');
            setzeHoehe(stufe);
        });
        document.body.classList.add('iblatt-auf');
        document.body.appendChild(grund);
        document.body.appendChild(el);
        offen = el;
        const griff = { setzeHoehe, schliessen };
        opt.aufbau(koerper, griff);
        setzeHoehe(stufe);
        requestAnimationFrame(() => el.classList.add('auf'));
        return griff;
    };
    const istOffen = () => !!offen;
    const schliesseAlle = () => { offen?.querySelector('.iblatt-zu')?.click(); };
    return { oeffne, istOffen, schliesseAlle, KOPF_FREI, ANTEIL_HALB };
})();
window.Sheet = Sheet;
