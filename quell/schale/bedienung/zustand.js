"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/zustand.ts (npm run bauen:ts). */
const Zustand = (() => {
    const ARTEN = {
        bereit: { zeichen: '○', text: 'Bereit' },
        wartet: { zeichen: '…', text: 'Wartet' },
        laeuft: { zeichen: '◐', text: 'Läuft …' },
        fertig: { zeichen: '✓', text: 'Fertig' },
        fehler: { zeichen: '!', text: 'Fehler' },
        abgebrochen: { zeichen: '✕', text: 'Abgebrochen' }
    };
    const ist = (wert) => typeof wert === 'string' && Object.prototype.hasOwnProperty.call(ARTEN, wert);
    const zeichen = (art) => ARTEN[art].zeichen;
    const text = (art) => ARTEN[art].text;
    const aktivitaet = (art = 'neutral') => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('ru-aktivitaet');
        svg.dataset.art = art;
        if (art === 'neutral') {
            for (let i = 0; i < 10; i++) {
                const segment = document.createElementNS(ns, 'rect');
                segment.setAttribute('x', '11');
                segment.setAttribute('y', '2');
                segment.setAttribute('width', '2');
                segment.setAttribute('height', '5');
                segment.setAttribute('rx', '1');
                segment.setAttribute('transform', `rotate(${i * 36} 12 12)`);
                segment.style.setProperty('--ru-schritt', String(i));
                svg.append(segment);
            }
        }
        else {
            ['translate(1 7) scale(1.2)', 'translate(14 1) scale(.8)', 'translate(15 15) scale(.65)']
                .forEach((transform, i) => {
                const gruppe = document.createElementNS(ns, 'g');
                gruppe.setAttribute('transform', transform);
                const funke = document.createElementNS(ns, 'path');
                funke.setAttribute('d', 'M5 0Q5 5 10 5Q5 5 5 10Q5 5 0 5Q5 5 5 0Z');
                funke.style.setProperty('--ru-schritt', String(i));
                gruppe.append(funke);
                svg.append(gruppe);
            });
        }
        return svg;
    };
    const setzen = (element, art, eigenerText) => {
        const sicher = ist(art) ? art : 'fehler';
        element.dataset['zustand'] = sicher;
        const z = element.querySelector('.ru-zustand-zeichen');
        const t = element.querySelector('.ru-zustand-text');
        if (z) {
            if (sicher === 'laeuft')
                z.replaceChildren(aktivitaet());
            else
                z.textContent = ARTEN[sicher].zeichen;
        }
        if (t)
            t.textContent = eigenerText ?? (ist(art) ? ARTEN[sicher].text : String(art));
    };
    const pille = (auftrag) => {
        const el = document.createElement('span');
        el.className = 'ru-zustand';
        el.setAttribute('role', 'status');
        const z = document.createElement('span');
        z.className = 'ru-zustand-zeichen';
        z.setAttribute('aria-hidden', 'true');
        const t = document.createElement('span');
        t.className = 'ru-zustand-text';
        el.append(z, t);
        setzen(el, auftrag.art, auftrag.text);
        return el;
    };
    return { ARTEN, ist, zeichen, text, aktivitaet, pille, setzen };
})();
window.Zustand = Zustand;
