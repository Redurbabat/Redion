"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/rollrand.ts (npm run bauen:ts). */
const Rollrand = (() => {
    const SPIEL = 2;
    const WORTE = {
        quer: ['links', 'rechts'],
        hoch: ['oben', 'unten']
    };
    const schreibe = (ziel, art, achse, davor, danach) => {
        const [a, b] = WORTE[achse];
        if (art === 'mehr') {
            const wert = davor && danach ? 'beides' : danach ? b : davor ? a : 'nein';
            if (ziel.dataset['mehr'] !== wert)
                ziel.dataset['mehr'] = wert;
            return;
        }
        const wert = [davor ? a : '', danach ? b : ''].filter(Boolean).join(' ');
        if (wert) {
            if (ziel.dataset['rand'] !== wert)
                ziel.dataset['rand'] = wert;
        }
        else if (ziel.dataset['rand'] !== undefined)
            delete ziel.dataset['rand'];
    };
    const pruefe = (feld, wahl = {}) => {
        const achse = wahl.achse || 'quer';
        const hoch = achse === 'hoch';
        const stand = hoch ? feld.scrollTop : feld.scrollLeft;
        const sicht = hoch ? feld.clientHeight : feld.clientWidth;
        const ganz = hoch ? feld.scrollHeight : feld.scrollWidth;
        schreibe(wahl.an || feld, wahl.art || 'rand', achse, stand > SPIEL, stand + sicht < ganz - SPIEL);
    };
    const binde = (feld, wahl = {}) => {
        if (!feld)
            return () => { };
        const nachsehen = () => pruefe(feld, wahl);
        feld.addEventListener('scroll', nachsehen, { passive: true });
        let beobachter = null;
        if (typeof ResizeObserver !== 'undefined') {
            beobachter = new ResizeObserver(nachsehen);
            beobachter.observe(feld);
            const inhalt = feld.firstElementChild;
            if (inhalt)
                beobachter.observe(inhalt);
        }
        nachsehen();
        requestAnimationFrame(nachsehen);
        return () => {
            feld.removeEventListener('scroll', nachsehen);
            beobachter?.disconnect();
        };
    };
    const zeige = (feld, stueck, wahl = {}) => {
        if (!feld || !stueck)
            return;
        const hoch = (wahl.achse || 'quer') === 'hoch';
        const rand = wahl.rand ?? 12;
        const f = feld.getBoundingClientRect();
        const s = stueck.getBoundingClientRect();
        const anfangF = hoch ? f.top : f.left;
        const endeF = hoch ? f.bottom : f.right;
        const anfangS = hoch ? s.top : s.left;
        const endeS = hoch ? s.bottom : s.right;
        let schub = 0;
        if (endeS - anfangS > endeF - anfangF)
            schub = anfangS - anfangF - rand;
        else if (anfangS < anfangF + rand)
            schub = anfangS - anfangF - rand;
        else if (endeS > endeF - rand)
            schub = endeS - endeF + rand;
        if (!schub)
            return;
        if (hoch)
            feld.scrollTop += schub;
        else
            feld.scrollLeft += schub;
        pruefe(feld, wahl);
    };
    return { binde, pruefe, zeige, SPIEL };
})();
window.Rollrand = Rollrand;
