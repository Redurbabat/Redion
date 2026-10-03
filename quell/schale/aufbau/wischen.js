"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/wischen.ts (npm run bauen:ts). */
const Wischen = (() => {
    const WEG = 70;
    const FANG = 12;
    const RANDTABU = 24;
    const ZUG = 0.32, ZUG_MAX = 46;
    const ZUG_WAND = 0.10, ZUG_WAND_MAX = 16;
    const leiste = () => document.getElementById('handy-oben');
    const reiter = () => {
        const l = leiste();
        if (!l)
            return [];
        return Array.from(l.querySelectorAll('button[role="tab"]'));
    };
    const leisteDa = () => {
        const l = leiste();
        if (!l)
            return false;
        const r = l.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const jetzt = () => reiter().findIndex(b => b.classList.contains('an'));
    const nachbar = (schritt) => {
        const alle = reiter();
        const i = jetzt();
        if (i < 0)
            return null;
        return alle[i + schritt] ?? null;
    };
    const rolltWaagerecht = (start) => {
        let el = start;
        for (let tiefe = 0; el && tiefe < 24; tiefe++, el = el.parentElement) {
            if (!(el instanceof HTMLElement))
                continue;
            if (el.dataset.keinWisch !== undefined)
                return true;
            if (el.scrollWidth > el.clientWidth + 2) {
                const wie = getComputedStyle(el).overflowX;
                if (wie === 'auto' || wie === 'scroll')
                    return true;
            }
        }
        return false;
    };
    const etwasOffen = () => !!document.querySelector('.overlay, dialog[open], .finder, #r-blatt.auf');
    const darf = (ziel, x) => {
        if (!leisteDa())
            return false;
        const k = document.body.classList;
        if (k.contains('schreibt'))
            return false;
        if (document.body.dataset.dokument === 'an')
            return false;
        if (etwasOffen())
            return false;
        if (x < RANDTABU || x > innerWidth - RANDTABU)
            return false;
        const el = ziel instanceof Element ? ziel : null;
        if (el?.closest('#handy-oben'))
            return false;
        if (rolltWaagerecht(el))
            return false;
        return true;
    };
    let letzte = null;
    const SCHLUCK_AB = 40;
    let schlucken = false;
    addEventListener('dragstart', (e) => {
        if (zeiger !== -1)
            e.preventDefault();
    }, true);
    addEventListener('click', (e) => {
        if (!schlucken)
            return;
        const el = e.target instanceof Element ? e.target : null;
        if (el?.closest('#handy-oben'))
            return;
        e.stopPropagation();
        e.preventDefault();
    }, true);
    let zeiger = -1;
    let x0 = 0, y0 = 0, t0 = 0;
    let gefangen = false;
    const buehne = () => document.getElementById('scroll');
    const ruhig = () => {
        try {
            return AppEinstellung.wenigBewegung();
        }
        catch {
            return false;
        }
    };
    const schieben = (dx) => {
        const b = buehne();
        if (!b || ruhig())
            return;
        b.style.transition = 'none';
        const wand = !nachbar(dx < 0 ? 1 : -1);
        const f = wand ? ZUG_WAND : ZUG;
        const max = wand ? ZUG_WAND_MAX : ZUG_MAX;
        const weit = Math.max(-max, Math.min(max, dx * f));
        b.style.transform = `translateX(${weit.toFixed(1)}px)`;
    };
    const loslassen = () => {
        const b = buehne();
        if (b && b.style.transform) {
            b.style.transition = 'transform .22s var(--ease-standard, ease)';
            b.style.transform = '';
            setTimeout(() => { b.style.transition = ''; }, 260);
        }
        zeiger = -1;
        gefangen = false;
    };
    const einblenden = (nachLinks) => {
        const b = buehne();
        if (!b || ruhig())
            return;
        b.classList.remove('wisch-links', 'wisch-rechts');
        void b.offsetWidth;
        const klasse = nachLinks ? 'wisch-links' : 'wisch-rechts';
        b.classList.add(klasse);
        const fertig = (e) => {
            if (e && (e.target !== b || !/^wisch-rein/.test(e.animationName)))
                return;
            b.removeEventListener('animationend', fertig);
            b.removeEventListener('animationcancel', fertig);
            if (b.classList.contains(klasse))
                b.classList.remove('wisch-links', 'wisch-rechts');
        };
        b.addEventListener('animationend', fertig);
        b.addEventListener('animationcancel', fertig);
        setTimeout(() => fertig(), 1200);
    };
    const ankunft = (vonIndex, nachIndex) => {
        if (vonIndex < 0 || nachIndex < 0 || vonIndex === nachIndex)
            return;
        einblenden(nachIndex > vonIndex);
    };
    const starten = () => {
        if (!document.body)
            return;
        addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'pen')
                return;
            if (zeiger !== -1) {
                zeiger = -1;
                return;
            }
            if (!darf(e.target, e.clientX))
                return;
            zeiger = e.pointerId;
            x0 = e.clientX;
            y0 = e.clientY;
            t0 = e.timeStamp;
            gefangen = false;
        }, { passive: true });
        addEventListener('pointermove', (e) => {
            if (e.pointerId !== zeiger)
                return;
            const dx = e.clientX - x0, dy = e.clientY - y0;
            if (!gefangen) {
                if (Math.abs(dy) > Math.abs(dx)) {
                    zeiger = -1;
                    return;
                }
                if (Math.abs(dx) < FANG)
                    return;
                gefangen = true;
            }
            schieben(dx);
        }, { passive: true });
        const ende = (e) => {
            if (e.pointerId !== zeiger)
                return;
            const dx = e.clientX - x0, dy = e.clientY - y0;
            const dauer = e.timeStamp - t0;
            const war = gefangen;
            loslassen();
            if (war && Math.abs(dx) >= SCHLUCK_AB) {
                schlucken = true;
                setTimeout(() => { schlucken = false; }, 0);
            }
            const merke = (grund) => {
                letzte = { dx: Math.round(dx), dy: Math.round(dy), dauer: Math.round(dauer),
                    gefangen: war, grund };
            };
            if (!war) {
                merke('nicht waagerecht');
                return;
            }
            if (Math.abs(dx) < WEG) {
                merke('zu kurz');
                return;
            }
            if (Math.abs(dx) < Math.abs(dy) * 1.8) {
                merke('zu schräg');
                return;
            }
            if (dauer > 900) {
                merke('zu langsam');
                return;
            }
            const ziel = nachbar(dx < 0 ? 1 : -1);
            if (!ziel) {
                merke('kein Nachbar');
                return;
            }
            merke('gewechselt');
            ziel.click();
        };
        addEventListener('pointerup', ende, { passive: true });
        addEventListener('pointercancel', () => loslassen(), { passive: true });
    };
    return { starten, reiter, nachbar, darf, jetzt, einblenden, ankunft, letzte: () => letzte };
})();
window.Wischen = Wischen;
