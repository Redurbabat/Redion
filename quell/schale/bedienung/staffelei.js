"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/staffelei.ts (npm run bauen:ts). */
const Staffelei = (() => {
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    const landschaft = (klasse) => {
        const s = el('div', klasse);
        el('i', 'ru-staff-himmel', s);
        el('i', 'ru-staff-gestirn', s);
        for (const nr of ['ru-staff-berg-1', 'ru-staff-berg-2', 'ru-staff-berg-3'])
            el('i', 'ru-staff-berg ' + nr, s);
        const wasser = el('i', 'ru-staff-wasser', s);
        for (const nr of ['ru-staff-welle-1', 'ru-staff-welle-2', 'ru-staff-welle-3'])
            el('i', 'ru-staff-welle ' + nr, wasser);
        return s;
    };
    const pinsel = () => {
        const p = el('div', 'ru-staff-pinsel');
        p.setAttribute('aria-hidden', 'true');
        el('i', 'ru-staff-stiel', p);
        el('i', 'ru-staff-zwinge', p);
        el('i', 'ru-staff-haare', p);
        return p;
    };
    const bauen = (auftrag) => {
        let hell = !!auftrag.hell;
        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.className = 'ru-staff';
        knopf.setAttribute('role', 'switch');
        const rahmen = el('div', 'ru-staff-rahmen', knopf);
        rahmen.setAttribute('aria-hidden', 'true');
        rahmen.append(landschaft('ru-staff-skizze'));
        const blende = el('div', 'ru-staff-blende', rahmen);
        blende.append(landschaft('ru-staff-bild'));
        rahmen.append(pinsel());
        const wort = el('span', 'ru-staff-wort', knopf);
        const stellen = () => {
            knopf.dataset['hell'] = hell ? 'ja' : 'nein';
            knopf.setAttribute('aria-checked', hell ? 'false' : 'true');
            knopf.setAttribute('aria-label', 'Dunkles Schema' + (hell ? ' einschalten' : ' ausschalten'));
            knopf.title = hell ? 'Zum dunklen Schema wechseln' : 'Zum hellen Schema wechseln';
            wort.textContent = hell ? 'Hell' : 'Dunkel';
        };
        knopf.addEventListener('click', () => {
            hell = !hell;
            stellen();
            auftrag.beiWechsel(hell);
        });
        const beobachter = new MutationObserver(() => {
            if (!knopf.isConnected) {
                beobachter.disconnect();
                return;
            }
            const jetztHell = document.documentElement.dataset['theme'] === 'light';
            if (jetztHell !== hell) {
                hell = jetztHell;
                stellen();
            }
        });
        beobachter.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        stellen();
        return {
            element: knopf,
            setzen: (neu) => { hell = !!neu; stellen(); },
            hell: () => hell
        };
    };
    return { bauen };
})();
window.Staffelei = Staffelei;
