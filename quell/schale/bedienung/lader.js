"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/lader.ts (npm run bauen:ts). */
const Lader = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let zaehler = 0;
    const SAETZE = {
        fluss: 'Wird geladen …',
        sterne: 'Läuft …',
        wort: 'Läuft …',
        presse: 'Seiten werden gerechnet …'
    };
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    const svgEl = (tag, eltern) => {
        const e = document.createElementNS(NS, tag);
        if (eltern)
            eltern.append(e);
        return e;
    };
    const flussBild = (id) => {
        const svg = svgEl('svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('ru-lader-bild');
        const defs = svgEl('defs', svg);
        const maske = svgEl('mask', defs);
        maske.setAttribute('id', id);
        const gruppe = svgEl('g', maske);
        gruppe.setAttribute('class', 'ru-lader-klumpen');
        const flaeche = svgEl('rect', gruppe);
        flaeche.setAttribute('class', 'ru-lader-spiegel');
        flaeche.setAttribute('x', '0');
        flaeche.setAttribute('width', '100');
        flaeche.setAttribute('fill', '#fff');
        for (let i = 0; i < 3; i++) {
            const welle = svgEl('ellipse', gruppe);
            welle.setAttribute('class', 'ru-lader-welle');
            welle.setAttribute('rx', String(30 - i * 6));
            welle.setAttribute('ry', String(11 - i * 2));
            welle.setAttribute('fill', '#fff');
            welle.style.setProperty('--ru-schritt', String(i));
        }
        const glas = svgEl('circle', svg);
        glas.setAttribute('class', 'ru-lader-glas');
        glas.setAttribute('cx', '50');
        glas.setAttribute('cy', '50');
        glas.setAttribute('r', '47');
        const topf = svgEl('g', svg);
        topf.setAttribute('mask', 'url(#' + id + ')');
        const saft = svgEl('circle', topf);
        saft.setAttribute('class', 'ru-lader-saft');
        saft.setAttribute('cx', '50');
        saft.setAttribute('cy', '50');
        saft.setAttribute('r', '47');
        return svg;
    };
    const sterneBild = () => {
        const b = el('div', 'ru-lader-bild ru-lader-sterne');
        b.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 5; i++)
            el('i', 'ru-lader-stern', b).style.setProperty('--ru-schritt', String(i));
        return b;
    };
    const wortBild = (wort) => {
        const b = el('div', 'ru-lader-bild ru-lader-wort');
        b.setAttribute('aria-hidden', 'true');
        el('i', 'ru-lader-ring', b);
        const zeile = el('span', 'ru-lader-buchstaben', b);
        Array.from(wort).forEach((zeichen, i) => {
            const s = el('span', 'ru-lader-buchstabe', zeile);
            s.textContent = zeichen;
            s.style.setProperty('--ru-schritt', String(i));
        });
        return b;
    };
    const presseBild = () => {
        const b = el('div', 'ru-lader-bild ru-lader-presse');
        b.setAttribute('aria-hidden', 'true');
        const raum = el('div', 'ru-lader-raum', b);
        for (let i = 0; i < 3; i++)
            el('i', 'ru-lader-walze', raum).style.setProperty('--ru-schritt', String(i));
        for (let i = 0; i < 3; i++)
            el('i', 'ru-lader-bogen', raum).style.setProperty('--ru-schritt', String(i));
        return b;
    };
    const bauen = (auftrag) => {
        const wurzel = el('div', 'ru-lader');
        wurzel.dataset['art'] = auftrag.art;
        wurzel.dataset['zustand'] = 'laeuft';
        wurzel.setAttribute('role', 'status');
        let anteil = null;
        let spiegel = null;
        let wellen = [];
        let zahl = null;
        if (auftrag.art === 'fluss') {
            const id = 'ru-lader-maske-' + (++zaehler);
            const bild = flussBild(id);
            wurzel.append(bild);
            spiegel = bild.querySelector('.ru-lader-spiegel');
            wellen = Array.from(bild.querySelectorAll('.ru-lader-welle'));
            zahl = el('b', 'ru-lader-zahl', wurzel);
        }
        else if (auftrag.art === 'sterne') {
            wurzel.append(sterneBild());
        }
        else if (auftrag.art === 'wort') {
            wurzel.append(wortBild(auftrag.wort || 'Abgleich'));
        }
        else {
            wurzel.append(presseBild());
        }
        const satz = el('span', 'ru-lader-text', wurzel);
        satz.textContent = auftrag.text ?? SAETZE[auftrag.art];
        const stellen = (wert) => {
            anteil = wert;
            wurzel.dataset['zustand'] = wert !== null && wert >= 1 ? 'fertig' : 'laeuft';
            if (!spiegel)
                return;
            const hoch = wert === null ? 0 : Math.max(0, Math.min(1, wert));
            const kante = 100 - hoch * 100;
            spiegel.setAttribute('y', String(kante));
            spiegel.setAttribute('height', String(hoch * 100));
            wellen.forEach((w, i) => {
                w.setAttribute('cx', String(30 + i * 20));
                w.setAttribute('cy', String(kante));
            });
            if (zahl) {
                zahl.textContent = wert === null ? '' : Math.round(hoch * 100) + ' %';
            }
            wurzel.dataset['anteil'] = wert === null ? 'unbekannt' : 'bekannt';
        };
        stellen(typeof auftrag.anteil === 'number' ? auftrag.anteil : null);
        const setzen = (neu) => {
            if (typeof neu.anteil === 'number')
                stellen(neu.anteil);
            if (typeof neu.text === 'string')
                satz.textContent = neu.text;
        };
        return { element: wurzel, setzen, anteil: () => anteil,
            entfernen: () => wurzel.remove() };
    };
    const schweben = (auftrag) => {
        const griff = bauen(auftrag);
        const karte = el('div', 'ru-lader-karte ru-lader-schwebt');
        karte.append(griff.element);
        document.body.append(karte);
        return { element: karte, setzen: griff.setzen, anteil: griff.anteil,
            entfernen: () => karte.remove() };
    };
    return { SAETZE, bauen, schweben };
})();
window.Lader = Lader;
