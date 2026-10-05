"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/inseln/laden.ts (npm run bauen:ts). */
const Inseln = (() => {
    const REACT = 'quell/fremd/react/react.js';
    const INSELN = 'quell/islands/islands.js';
    const STIL = 'quell/islands/islands.css';
    const BEHAELTER = {
        react: 'inseln-react',
        inseln: 'inseln-js',
        stil: 'inseln-stil'
    };
    let versprechen = null;
    const unterDienst = typeof navigator !== 'undefined' &&
        !!navigator.serviceWorker?.controller;
    const behaelter = (id) => {
        const el = document.getElementById(id);
        return el && el.getAttribute('type') === 'text/plain' ? el.textContent : null;
    };
    const inEinzeldatei = () => behaelter(BEHAELTER.react) !== null;
    const skript = (src, was) => new Promise((ja, nein) => {
        const s = document.createElement('script');
        s.src = src;
        s.dataset['inselDatei'] = was;
        s.addEventListener('load', () => ja());
        s.addEventListener('error', () => {
            s.remove();
            nein(new Error('Die Inseln fehlen — ' + was + ' liess sich nicht laden.'));
        });
        document.head.appendChild(s);
    });
    const skriptAusBehaelter = async (id, was) => {
        const text = behaelter(id);
        if (text === null)
            throw new Error('Die Inseln fehlen — der Behälter ' + id + ' ist leer.');
        const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
        try {
            await skript(url, was);
        }
        finally {
            URL.revokeObjectURL(url);
        }
    };
    let angenommen = null;
    const stilblatt = () => {
        const text = behaelter(BEHAELTER.stil);
        if (text !== null && angenommen)
            return Promise.resolve();
        if (text !== null && 'adoptedStyleSheets' in document) {
            const blatt = new CSSStyleSheet();
            blatt.replaceSync(text);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, blatt];
            angenommen = blatt;
            return Promise.resolve();
        }
        if (document.querySelector('link[data-insel-datei="stil"]'))
            return Promise.resolve();
        return new Promise((ja, nein) => {
            const l = document.createElement('link');
            const blob = text !== null ? URL.createObjectURL(new Blob([text], { type: 'text/css' })) : null;
            l.rel = 'stylesheet';
            l.href = blob ?? STIL;
            l.dataset['inselDatei'] = 'stil';
            l.addEventListener('load', () => ja());
            l.addEventListener('error', () => {
                l.remove();
                if (blob)
                    URL.revokeObjectURL(blob);
                nein(new Error('Die Inseln fehlen — ' + STIL + ' liess sich nicht laden.'));
            });
            document.head.appendChild(l);
        });
    };
    const geladen = () => typeof window.RedionIslands !== 'undefined';
    const bereit = () => {
        if (versprechen)
            return versprechen;
        versprechen = (async () => {
            const einzel = inEinzeldatei();
            await stilblatt();
            if (typeof window.RedionReact === 'undefined') {
                if (einzel)
                    await skriptAusBehaelter(BEHAELTER.react, REACT);
                else
                    await skript(REACT, REACT);
            }
            if (typeof window.RedionReact === 'undefined')
                throw new Error('Die Inseln fehlen — ' + REACT + ' wurde geladen, ist aber leer.');
            if (!geladen()) {
                if (einzel)
                    await skriptAusBehaelter(BEHAELTER.inseln, INSELN);
                else
                    await skript(INSELN, INSELN);
            }
            const api = window.RedionIslands;
            if (!api)
                throw new Error('Die Inseln fehlen — ' + INSELN + ' wurde geladen, ist aber leer.');
            return api;
        })();
        versprechen.catch(() => { versprechen = null; });
        return versprechen;
    };
    const darfVorwaermen = () => location.protocol === 'file:' || inEinzeldatei() || unterDienst;
    const vorwaermen = () => {
        if (geladen() || !darfVorwaermen())
            return;
        bereit().catch((e) => {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Inseln', 'Vorwärmen gescheitert: ' + (e instanceof Error ? e.message : String(e)));
        });
    };
    const fehlerAnnehmen = (e) => {
        const d = e.detail;
        const f = d?.fehler;
        if (typeof Reporter === 'undefined')
            return;
        e.preventDefault();
        Reporter.error('Insel ' + String(d?.insel ?? '?'), f instanceof Error ? f.message : String(f), f);
    };
    if (typeof window !== 'undefined')
        window.addEventListener('redion-insel-fehler', fehlerAnnehmen);
    const beimErstenGebrauch = () => {
        removeEventListener('pointerdown', beimErstenGebrauch, true);
        removeEventListener('keydown', beimErstenGebrauch, true);
        if (geladen())
            return;
        const holen = () => {
            if (geladen())
                return;
            bereit().catch((e) => {
                if (typeof Reporter !== 'undefined')
                    Reporter.warn('Inseln', 'Vorwärmen beim ersten Tipp gescheitert: ' + (e instanceof Error ? e.message : String(e)));
            });
        };
        if (typeof requestIdleCallback === 'function')
            requestIdleCallback(holen, { timeout: 2000 });
        else
            setTimeout(holen, 400);
    };
    if (typeof window !== 'undefined') {
        addEventListener('pointerdown', beimErstenGebrauch, { capture: true, passive: true });
        addEventListener('keydown', beimErstenGebrauch, { capture: true, passive: true });
    }
    const imLeerlauf = () => {
        if (typeof requestIdleCallback === 'function')
            requestIdleCallback(vorwaermen, { timeout: 4000 });
        else
            setTimeout(vorwaermen, 1500);
    };
    if (typeof window !== 'undefined') {
        if (document.readyState === 'complete')
            imLeerlauf();
        else
            window.addEventListener('load', imLeerlauf, { once: true });
    }
    return { bereit, geladen, vorwaermen, darfVorwaermen };
})();
Object.assign(window, { Inseln });
