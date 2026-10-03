"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/fokus.ts (npm run bauen:ts). */
const Fokus = (() => {
    const GREIFBAR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const DIALOGE = '.overlay, .menu.blatt, .peek.peek-mobil';
    const herkunft = new WeakMap();
    let letzterAussen = null;
    const stillgelegt = new Set();
    const sichtbar = (el) => {
        const r = el.getBoundingClientRect();
        return !!(r.width || r.height);
    };
    const greifbareIn = (d) => [...d.querySelectorAll(GREIFBAR)].filter(sichtbar);
    const oberste = () => {
        const alle = [...document.querySelectorAll(DIALOGE)];
        return alle.length ? alle[alle.length - 1] : null;
    };
    const inertAktualisieren = () => {
        stillgelegt.forEach(el => { if (el.isConnected)
            el.inert = false; });
        stillgelegt.clear();
        const d = oberste();
        if (!d || !document.body)
            return;
        let traeger = d;
        while (traeger.parentElement && traeger.parentElement !== document.body)
            traeger = traeger.parentElement;
        [...document.body.children].forEach(kind => {
            if (!(kind instanceof HTMLElement))
                return;
            if (kind === traeger || kind.matches('.menu-grund'))
                return;
            if (kind.inert)
                return;
            kind.inert = true;
            stillgelegt.add(kind);
        });
    };
    const anmelden = (d) => {
        if (d.dataset.fokusFertig)
            return;
        d.dataset.fokusFertig = 'ja';
        if (!d.getAttribute('role'))
            d.setAttribute('role', 'dialog');
        if (!d.hasAttribute('aria-modal'))
            d.setAttribute('aria-modal', 'true');
        if (!d.getAttribute('aria-label') && !d.getAttribute('aria-labelledby')) {
            const kopf = d.querySelector('.fh, .mt-titel, .blatt-titel, .peek-pfad, h2, h3');
            const name = (kopf?.textContent || '').trim() ||
                (d.querySelector('input[placeholder]')?.placeholder || '').trim();
            if (name)
                d.setAttribute('aria-label', name.slice(0, 80));
        }
        const jetzt = document.activeElement;
        const vorher = (jetzt && !d.contains(jetzt)) ? jetzt : letzterAussen;
        if (vorher && vorher !== document.body && document.contains(vorher))
            herkunft.set(d, vorher);
        setTimeout(() => {
            if (!d.isConnected)
                return;
            if (d.contains(document.activeElement))
                return;
            const erstes = greifbareIn(d)[0];
            if (erstes) {
                erstes.focus();
                return;
            }
            d.tabIndex = -1;
            d.focus();
        }, 0);
    };
    const tasten = (e) => {
        if (e.key !== 'Tab')
            return;
        const d = oberste();
        if (!d || !d.isConnected)
            return;
        const liste = greifbareIn(d);
        if (!liste.length) {
            e.preventDefault();
            return;
        }
        const erstes = liste[0];
        const letztes = liste[liste.length - 1];
        const a = document.activeElement;
        if (!d.contains(a)) {
            e.preventDefault();
            (e.shiftKey ? letztes : erstes).focus();
            return;
        }
        if (!e.shiftKey && a === letztes) {
            e.preventDefault();
            erstes.focus();
        }
        else if (e.shiftKey && a === erstes) {
            e.preventDefault();
            letztes.focus();
        }
    };
    const gegangen = (weg) => {
        const dialoge = [];
        for (const n of weg) {
            if (!(n instanceof HTMLElement))
                continue;
            if (n.matches(DIALOGE))
                dialoge.push(n);
            dialoge.push(...n.querySelectorAll(DIALOGE));
        }
        for (const n of dialoge) {
            const ziel = herkunft.get(n);
            herkunft.delete(n);
            const a = document.activeElement;
            if (a && a !== document.body && a !== document.documentElement)
                continue;
            if (document.querySelector(DIALOGE))
                continue;
            if (ziel && document.contains(ziel))
                ziel.focus?.();
            const jetztA = document.activeElement;
            if (!jetztA || jetztA === document.body || jetztA === document.documentElement) {
                const inhalt = document.getElementById('page') || document.getElementById('main');
                inhalt?.focus?.();
            }
        }
    };
    let laeuft = false;
    const start = () => {
        if (laeuft)
            return;
        laeuft = true;
        document.querySelectorAll(DIALOGE).forEach(anmelden);
        inertAktualisieren();
        new MutationObserver(aend => {
            const entfernt = [];
            for (const a of aend) {
                a.addedNodes.forEach(n => {
                    if (!(n instanceof HTMLElement))
                        return;
                    if (n.matches(DIALOGE))
                        anmelden(n);
                    else
                        n.querySelectorAll(DIALOGE).forEach(anmelden);
                });
                if (a.removedNodes.length)
                    entfernt.push(...a.removedNodes);
            }
            inertAktualisieren();
            if (entfernt.length)
                gegangen(entfernt);
        }).observe(document.body, { childList: true, subtree: true });
        document.addEventListener('keydown', tasten, true);
        document.addEventListener('focusin', e => {
            const z = e.target;
            if (!(z instanceof HTMLElement))
                return;
            if (z.closest(DIALOGE))
                return;
            letzterAussen = z;
        }, true);
    };
    return { start, anmelden, greifbareIn, oberste, inertAktualisieren };
})();
if (typeof window !== 'undefined') {
    if (document.body)
        Fokus.start();
    else
        document.addEventListener('DOMContentLoaded', () => Fokus.start());
}
