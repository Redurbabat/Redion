"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/ordnerkarte.ts (npm run bauen:ts). */
const Ordnerkarte = (() => {
    const FAECHER = 5;
    let jeGeoeffnet = false;
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    const RUECKEN = 'M4 14a8 8 0 0 1 8-8h44l12 12h90a8 8 0 0 1 8 8v66a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8Z';
    const KLAPPE = 'M4 8a8 8 0 0 1 8-8h146a8 8 0 0 1 8 8v17a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8Z';
    const papier = (vorn = false) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', vorn ? '0 0 170 33' : '0 0 170 100');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const pfad = document.createElementNS(ns, 'path');
        pfad.setAttribute('d', vorn ? KLAPPE : RUECKEN);
        svg.append(pfad);
        return svg;
    };
    const zeichen = (klasse, box, teile) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', klasse);
        svg.setAttribute('viewBox', box);
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.7');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        for (const teil of teile) {
            const knoten = document.createElementNS(ns, teil.tag);
            for (const name of Object.keys(teil.attribute)) {
                knoten.setAttribute(name, teil.attribute[name] ?? '');
            }
            svg.append(knoten);
        }
        return svg;
    };
    const lupe = () => zeichen('ru-fach-lupe', '0 0 16 16', [
        { tag: 'circle', attribute: { cx: '7', cy: '7', r: '4.6' } },
        { tag: 'path', attribute: { d: 'M10.5 10.5 14.2 14.2' } },
    ]);
    const blattzeichen = () => zeichen('ru-fach-zeichen', '0 0 16 16', [
        { tag: 'path', attribute: { d: 'M9.2 1.8H4.4a1.6 1.6 0 0 0-1.6 1.6v9.2a1.6 1.6 0 0 0 1.6 1.6h7.2a1.6 1.6 0 0 0 1.6-1.6V5.8Z' } },
        { tag: 'path', attribute: { d: 'M9.2 1.8v4h4' } },
    ]);
    const hinweispfeil = () => zeichen('ru-fach-hinweis-pfeil', '0 0 24 24', [
        { tag: 'path', attribute: { d: 'M19.5 3.5c1.3 7.6-2.2 13.4-8.4 15.8' } },
        { tag: 'path', attribute: { d: 'M11.1 19.3 15.4 17' } },
        { tag: 'path', attribute: { d: 'M11.1 19.3 13 14.8' } },
    ]);
    const bauen = (auftrag) => {
        const karte = el('div', 'ru-fach');
        const tiefe = auftrag.tiefe && auftrag.tiefe.length ? auftrag.tiefe : auftrag.kinder;
        let offen = false;
        let suchwort = '';
        let hinweis = null;
        if (!jeGeoeffnet) {
            hinweis = el('div', 'ru-fach-hinweis', karte);
            hinweis.setAttribute('aria-hidden', 'true');
            const ruf = el('span', 'ru-fach-hinweis-text', hinweis);
            ruf.textContent = 'Aufklappen';
            hinweis.append(hinweispfeil());
        }
        const kopf = el('div', 'ru-fach-kopf', karte);
        const name = el('p', 'ru-fach-name', kopf);
        name.textContent = auftrag.name;
        const zaehler = el('p', 'ru-fach-zaehler', kopf);
        zaehler.setAttribute('role', 'status');
        const punkt = el('i', 'ru-fach-punkt', zaehler);
        punkt.setAttribute('aria-hidden', 'true');
        const zahl = el('b', 'ru-fach-zahl', zaehler);
        const wort = el('span', 'ru-fach-wort', zaehler);
        const feld = document.createElement('label');
        feld.className = 'ru-fach-suche';
        const sr = el('span', 'ru-fach-sr', feld);
        sr.textContent = 'In „' + auftrag.name + '" suchen, auch in den Unterordnern';
        feld.append(lupe());
        const eingabe = document.createElement('input');
        eingabe.type = 'search';
        eingabe.className = 'ru-fach-eingabe';
        eingabe.placeholder = 'Hier suchen …';
        feld.append(eingabe);
        karte.append(feld);
        const buehne = el('div', 'ru-fach-buehne', karte);
        const ruecken = el('div', 'ru-fach-ruecken', buehne);
        ruecken.append(papier());
        const blaetter = el('div', 'ru-fach-blaetter', buehne);
        const klappe = el('div', 'ru-fach-klappe', buehne);
        klappe.append(papier(true));
        el('i', 'ru-fach-marke', klappe).setAttribute('aria-hidden', 'true');
        const griff = document.createElement('button');
        griff.type = 'button';
        griff.className = 'ru-fach-griff';
        griff.setAttribute('aria-expanded', 'false');
        buehne.append(griff);
        const mehr = el('p', 'ru-fach-rest', karte);
        const passend = () => {
            const s = suchwort.trim().toLowerCase();
            if (!s)
                return auftrag.kinder;
            return tiefe.filter(k => k.name.toLowerCase().includes(s));
        };
        const blattBauen = (stueck, nr) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ru-fach-blatt';
            b.dataset['nr'] = String(nr);
            b.dataset['fachId'] = stueck.id;
            const glanz = el('i', 'ru-fach-glanz', b);
            glanz.setAttribute('aria-hidden', 'true');
            b.append(blattzeichen());
            const zeile = el('span', 'ru-fach-zeile', b);
            const text = el('span', 'ru-fach-text', zeile);
            text.textContent = stueck.name;
            b.title = stueck.name + ' — ' + stueck.art + (stueck.weg ? ' (' + stueck.weg + ')' : '');
            b.setAttribute('aria-label', (stueck.ordner ? 'Ordner öffnen: ' : 'Öffnen: ') + b.title);
            const marke = el('span', 'ru-fach-art', zeile);
            marke.textContent = stueck.art;
            if (stueck.weg) {
                const weg = el('span', 'ru-fach-weg', text);
                weg.textContent = ' \u00b7 ' + stueck.weg;
            }
            b.addEventListener('click', ereignis => {
                ereignis.stopPropagation();
                auftrag.beiWahl(stueck);
            });
            return b;
        };
        const zeichnen = () => {
            const liste = passend();
            const gezeigt = liste.slice(0, FAECHER);
            blaetter.replaceChildren(...(offen ? gezeigt.map(blattBauen) : []));
            const sucht = !!suchwort.trim();
            zahl.textContent = String(liste.length);
            wort.textContent = sucht
                ? (liste.length === 1 ? 'Treffer' : 'Treffer') + ' von ' + tiefe.length
                : (liste.length === 1 ? 'Sache' : 'Sachen');
            zaehler.title = sucht
                ? liste.length + ' von ' + tiefe.length + ' Sachen passen zu „' + suchwort.trim() + '"'
                : 'So viele Sachen liegen in „' + auftrag.name + '"';
            karte.dataset['sucht'] = sucht ? 'ja' : 'nein';
            karte.dataset['leer'] = liste.length ? 'nein' : 'ja';
            const rest = liste.length - gezeigt.length;
            mehr.textContent = liste.length === 0
                ? (sucht ? 'Kein Treffer in diesem Ordner.' : 'Dieser Ordner ist leer.')
                : (rest > 0 ? 'und ' + rest + ' weitere — such danach, um sie zu sehen' : '');
            mehr.hidden = !mehr.textContent;
        };
        const klappen = (auf) => {
            offen = auf === undefined ? !offen : auf;
            karte.dataset['offen'] = offen ? 'ja' : 'nein';
            griff.setAttribute('aria-expanded', offen ? 'true' : 'false');
            griff.setAttribute('aria-label', offen
                ? 'Ordner „' + auftrag.name + '" zuklappen'
                : 'In den Ordner „' + auftrag.name + '" hineinsehen');
            if (offen) {
                zeichnen();
                jeGeoeffnet = true;
                if (hinweis) {
                    const weg = hinweis;
                    hinweis = null;
                    window.setTimeout(() => weg.remove(), 400);
                }
            }
        };
        griff.addEventListener('click', () => klappen());
        eingabe.addEventListener('input', () => { suchwort = eingabe.value; zeichnen(); });
        eingabe.addEventListener('keydown', ereignis => {
            if (ereignis.key === 'Enter')
                ereignis.preventDefault();
        });
        if (auftrag.beiOrdner) {
            const gehen = document.createElement('button');
            gehen.type = 'button';
            gehen.className = 'ru-fach-gehen btn weiter';
            gehen.textContent = 'Ordner öffnen';
            gehen.addEventListener('click', () => auftrag.beiOrdner?.());
            karte.append(gehen);
        }
        klappen(false);
        zeichnen();
        return { element: karte, klappen, offen: () => offen, entfernen: () => karte.remove() };
    };
    return { FAECHER, bauen };
})();
window.Ordnerkarte = Ordnerkarte;
