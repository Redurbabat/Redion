"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/merkzeichen.ts (npm run bauen:ts). */
const Merkzeichen = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const BAND = 'M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5v16.2a.8.8 0 0 1-1.2.7L12 17.9l-5.8 3.5a.8.8 0 0 1-1.2-.7V4.5A1.5 1.5 0 0 1 6.5 3Z';
    const band = (an) => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('ru-merk-band');
        const pfad = document.createElementNS(NS, 'path');
        pfad.setAttribute('d', BAND);
        pfad.setAttribute('fill', an ? 'currentColor' : 'none');
        pfad.setAttribute('stroke', 'currentColor');
        pfad.setAttribute('stroke-width', '1.7');
        pfad.setAttribute('stroke-linejoin', 'round');
        svg.append(pfad);
        return svg;
    };
    const satz = (an, name) => (an ? 'Aus Favoriten' : 'Zu Favoriten') + (name ? ': ' + name : '');
    const inneres = (auftrag) => {
        const teil = document.createDocumentFragment();
        teil.append(band(auftrag.an));
        for (const klasse of ['ru-merk-kreis', 'ru-merk-funken', 'ru-merk-punkt']) {
            const i = document.createElement('i');
            i.className = klasse;
            i.setAttribute('aria-hidden', 'true');
            teil.append(i);
        }
        return teil;
    };
    const markieren = (knopf, auftrag) => {
        const vorher = knopf.getAttribute('aria-pressed');
        const an = !!auftrag.an;
        knopf.classList.add('ru-merk');
        knopf.classList.toggle('ist-an', an);
        knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
        knopf.setAttribute('aria-label', satz(an, auftrag.name));
        knopf.title = satz(an, auftrag.name);
        knopf.replaceChildren(inneres({ an, ...(auftrag.name ? { name: auftrag.name } : {}) }));
        knopf.classList.remove('platzt');
        if (an && vorher === 'false') {
            void knopf.offsetWidth;
            knopf.classList.add('platzt');
            knopf.addEventListener('animationend', () => knopf.classList.remove('platzt'), { once: true });
        }
    };
    const bauen = (auftrag) => {
        const knopf = document.createElement('button');
        knopf.type = 'button';
        let an = !!auftrag.an;
        knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
        markieren(knopf, auftrag);
        knopf.addEventListener('click', () => {
            an = !an;
            markieren(knopf, { an, ...(auftrag.name ? { name: auftrag.name } : {}) });
            auftrag.beiWechsel(an);
        });
        return knopf;
    };
    const html = (auftrag) => {
        const an = !!auftrag.an;
        const beschriftung = satz(an, auftrag.name);
        const sicher = String(beschriftung)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return '<button type="button" class="ru-merk' + (an ? ' ist-an' : '') +
            (auftrag.klasse ? ' ' + auftrag.klasse : '') + '" ' +
            'aria-pressed="' + (an ? 'true' : 'false') + '" ' +
            'title="' + sicher + '" aria-label="' + sicher + '" ' + (auftrag.zusatz || '') + '>' +
            '<svg class="ru-merk-band" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="' + BAND + '" fill="' + (an ? 'currentColor' : 'none') +
            '" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>' +
            '<i class="ru-merk-kreis" aria-hidden="true"></i>' +
            '<i class="ru-merk-funken" aria-hidden="true"></i>' +
            '<i class="ru-merk-punkt" aria-hidden="true"></i>' +
            '</button>';
    };
    return { BAND, satz, markieren, bauen, html };
})();
window.Merkzeichen = Merkzeichen;
