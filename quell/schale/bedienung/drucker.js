"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/drucker.ts (npm run bauen:ts). */
const Drucker = (() => {
    const SAETZE = {
        bereit: 'Bereit',
        vorbereiten: 'Seitenbilder sammeln …',
        rendern: 'Seiten setzen …',
        speichern: 'Drucken oder als PDF …',
        fertig: 'Fertig',
        fehler: 'Nicht gedruckt'
    };
    const ZEICHEN_ART = {
        bereit: 'bereit', vorbereiten: 'wartet', rendern: 'laeuft',
        speichern: 'laeuft', fertig: 'fertig', fehler: 'fehler'
    };
    const RUECKFALL = {
        bereit: '○', wartet: '…', laeuft: '◐', fertig: '✓', fehler: '!', abgebrochen: '✕'
    };
    const zeichenFuer = (zustand) => {
        const art = ZEICHEN_ART[zustand];
        return typeof Zustand !== 'undefined' && Zustand.zeichen ? Zustand.zeichen(art) : RUECKFALL[art];
    };
    const ist = (wert) => typeof wert === 'string' && Object.prototype.hasOwnProperty.call(SAETZE, wert);
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    const buehne = () => {
        const b = el('div', 'ru-drucker-buehne');
        b.setAttribute('aria-hidden', 'true');
        const gruppe = el('div', 'ru-drucker-blattgruppe', b);
        el('i', 'ru-drucker-blattschatten', gruppe);
        const blatt = el('div', 'ru-drucker-blatt', gruppe);
        for (let i = 0; i < 8; i++)
            el('i', 'ru-drucker-tinte', blatt).style.setProperty('--ru-schritt', String(i));
        const geraet = el('div', 'ru-drucker-geraet', b);
        el('i', 'ru-drucker-umschatten', geraet);
        el('i', 'ru-drucker-deckel-innen', el('div', 'ru-drucker-deckel', geraet));
        const koerper = el('div', 'ru-drucker-koerper', geraet);
        el('i', 'ru-drucker-schlitz', koerper);
        const feld = el('div', 'ru-drucker-feld', koerper);
        el('i', 'ru-drucker-feld-gross', feld);
        el('i', 'ru-drucker-feld-klein', feld);
        const knoepfe = el('div', 'ru-drucker-knoepfe', koerper);
        for (let i = 0; i < 3; i++)
            el('i', 'ru-drucker-knopf', knoepfe);
        const lampe = el('div', 'ru-drucker-lampe', koerper);
        el('i', 'ru-drucker-led', lampe);
        el('i', 'ru-drucker-schein', lampe);
        const lueftung = el('div', 'ru-drucker-lueftung', koerper);
        for (let i = 0; i < 4; i++)
            el('i', 'ru-drucker-lamelle', lueftung);
        el('i', 'ru-drucker-fach-innen', el('div', 'ru-drucker-fach', koerper));
        el('i', 'ru-drucker-marke', koerper);
        return b;
    };
    const bauen = () => {
        const karte = el('div', 'ru-drucker');
        karte.setAttribute('role', 'status');
        karte.append(buehne());
        const status = el('p', 'ru-drucker-status', karte);
        const zeichen = el('span', 'ru-drucker-zeichen', status);
        zeichen.setAttribute('aria-hidden', 'true');
        const text = el('span', 'ru-drucker-text', status);
        let jetzt = 'bereit';
        let wecker = 0;
        const setzen = (zustand, eigenerText) => {
            jetzt = ist(zustand) ? zustand : 'fehler';
            karte.dataset['zustand'] = jetzt;
            zeichen.textContent = zeichenFuer(jetzt);
            text.textContent = eigenerText ?? (ist(zustand) ? SAETZE[jetzt] : String(zustand));
        };
        const entfernen = (nachMs = 0) => {
            window.clearTimeout(wecker);
            if (nachMs > 0) {
                wecker = window.setTimeout(() => karte.remove(), nachMs);
                return;
            }
            karte.remove();
        };
        setzen('bereit');
        return { element: karte, setzen, zustand: () => jetzt, entfernen };
    };
    const zeigen = () => {
        document.querySelectorAll('.ru-drucker.ru-drucker-schwebt').forEach(alt => alt.remove());
        const griff = bauen();
        griff.element.classList.add('ru-drucker-schwebt');
        document.body.append(griff.element);
        return griff;
    };
    return { SAETZE, ist, bauen, zeigen };
})();
window.Drucker = Drucker;
