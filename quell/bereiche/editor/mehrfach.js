"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/editor/mehrfach.ts (npm run bauen:ts). */
const Mehrfach = (() => {
    let gewaehlt = new Set();
    const alleKennungen = () => [...document.querySelectorAll('.blk')]
        .map(e => e.dataset['bid'])
        .filter((x) => !!x);
    const zeichne = () => {
        document.querySelectorAll('.blk').forEach(el => el.classList.toggle('sel', !!el.dataset['bid'] && gewaehlt.has(el.dataset['bid'])));
    };
    const leeren = () => { gewaehlt.clear(); zeichne(); };
    const hat = () => gewaehlt.size > 0;
    const ids = () => [...gewaehlt];
    const schmal = () => window.matchMedia('(max-width:' +
        ((typeof KONSTANTEN !== 'undefined' && KONSTANTEN.TELEFON_BREITE) || 760) +
        'px)').matches;
    const waehle = (id, dazu = false) => {
        if (!id)
            return;
        if (schmal() && dazu)
            return;
        if (!dazu)
            gewaehlt.clear();
        gewaehlt.add(id);
        zeichne();
    };
    const bereich = (vonId, bisId) => {
        if (schmal() || !vonId || !bisId)
            return;
        const alle = alleKennungen();
        const a = alle.indexOf(vonId), b = alle.indexOf(bisId);
        if (a < 0 || b < 0)
            return;
        gewaehlt.clear();
        alle.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => gewaehlt.add(x));
        zeichne();
    };
    const start = () => {
        document.addEventListener('keydown', e => {
            const imFokus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const imText = !!imFokus?.classList.contains('ct');
            if (e.key === 'Escape' && imFokus && imText && !document.querySelector('.menu, .overlay')) {
                const blk = imFokus.closest('.blk');
                if (blk) {
                    imFokus.blur();
                    waehle(blk.dataset['bid']);
                    e.preventDefault();
                }
                return;
            }
            if (!hat())
                return;
            if (e.key === 'Escape') {
                leeren();
                return;
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                Verlauf.merke(true);
                const liste = ids();
                if (liste.length === 1)
                    App.inPapierkorb(Store.getBlock(liste[0]));
                else {
                    const n = liste.filter(id => App.inPapierkorb(Store.getBlock(id), { ruhig: true })).length;
                    if (n)
                        UI.toast(n + (n === 1 ? ' Block liegt' : ' Blöcke liegen') + ' im Papierkorb');
                }
                leeren();
                App.zeichneSeite();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                Verlauf.merke(true);
                ids().forEach(id => {
                    const b = Store.getBlock(id);
                    if (!b)
                        return;
                    const daten = Store.baum(id);
                    Store.baumEinfuegen(daten, b.parentId);
                });
                leeren();
                App.zeichneSeite();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                const p = Store.getBlock(App.aktuelleSeite());
                if (!p)
                    return;
                const alle = new Set(p.content || []);
                const erster = (p.content || [])[0];
                if (gewaehlt.size === 0) {
                    if (!erster)
                        return;
                    gewaehlt = new Set([erster]);
                }
                else if (gewaehlt.size < alle.size) {
                    gewaehlt = alle;
                }
                else {
                    gewaehlt = alle;
                    UI.toast('Alle Blöcke dieser Seite ausgewählt');
                }
                zeichne();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const alle = alleKennungen();
                const jetzt = ids()[ids().length - 1];
                if (!jetzt)
                    return;
                const i = alle.indexOf(jetzt) + (e.key === 'ArrowDown' ? 1 : -1);
                const ziel = alle[i];
                if (ziel) {
                    e.preventDefault();
                    e.shiftKey ? bereich(ids()[0], ziel) : waehle(ziel);
                }
                return;
            }
            if (e.key === 'Enter') {
                const id = ids()[0];
                leeren();
                const ct = document.querySelector(`[data-bid="${id}"] .ct`);
                if (ct) {
                    e.preventDefault();
                    Blocks.cursorAnsEnde(ct);
                }
                return;
            }
        });
        document.getElementById('page')?.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            if (ziel.closest('.ct, button, input, a')) {
                if (!e.shiftKey)
                    leeren();
                return;
            }
            const blk = ziel.closest('.blk');
            if (!blk) {
                leeren();
                return;
            }
            if (e.shiftKey && hat())
                bereich(ids()[0], blk.dataset['bid']);
        });
    };
    return { start, waehle, leeren, hat, ids, bereich, schmal };
})();
window.Mehrfach = Mehrfach;
