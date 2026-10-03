"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/seitenansicht.ts (npm run bauen:ts). */
const Seitenansicht = (() => {
    const katalog = () => (typeof Register !== 'undefined' ? Register.seitenansichten : null) ?? null;
    const art = (p) => {
        const k = katalog();
        if (!k)
            return 'redion';
        return k.holen(p?.seitenAnsicht)?.id ?? k.VORGABE;
    };
    const setze = (p, id) => {
        const k = katalog();
        if (!p?.id || !k?.holen(id))
            return;
        if (art(p) === id)
            return;
        Store.updateBlock(p.id, { seitenAnsicht: id });
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    const schalter = (wrap, p) => {
        const k = katalog();
        if (!k || typeof Segment === 'undefined')
            return;
        const halter = document.createElement('div');
        halter.className = 'pg-ansichten';
        const griff = Segment.bauen({
            name: 'Ansicht dieser Seite',
            wahlen: k.ARTEN.map((a) => ({ id: a.id, name: a.name, zeichen: a.zeichen })),
            gewaehlt: art(p),
            gewechselt: (id) => setze(p, id)
        });
        for (const a of k.ARTEN) {
            const b = griff.element.querySelector(`[data-seg-wahl="${a.id}"]`);
            if (b)
                b.title = a.titel;
        }
        halter.appendChild(griff.element);
        wrap.appendChild(halter);
    };
    return { art, setze, schalter };
})();
window.Seitenansicht = Seitenansicht;
