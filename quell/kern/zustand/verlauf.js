"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/zustand/verlauf.ts (npm run bauen:ts). */
const Verlauf = (() => {
    const zurueckStapel = [];
    const vorStapel = [];
    const MAX = 60;
    let letzte = 0;
    let sperre = false;
    const momentaufnahme = () => {
        const id = App.aktuelleSeite();
        if (!id)
            return null;
        const p = Store.getBlock(id);
        if (!p || p.locked)
            return null;
        return { pageId: id, daten: Store.baum(id) };
    };
    const merke = (erzwingen = false) => {
        if (sperre)
            return;
        const jetzt = Date.now();
        if (!erzwingen && jetzt - letzte < 700)
            return;
        const m = momentaufnahme();
        if (!m)
            return;
        letzte = jetzt;
        zurueckStapel.push(m);
        if (zurueckStapel.length > MAX)
            zurueckStapel.shift();
        vorStapel.length = 0;
    };
    const anwenden = (m) => {
        sperre = true;
        const p = Store.getBlock(m.pageId);
        if (!p) {
            sperre = false;
            return;
        }
        if (p.locked) {
            sperre = false;
            return;
        }
        Store.baumAbgleichen(m.pageId, m.daten);
        Store.updateBlock(m.pageId, { text: m.daten.text, icon: m.daten.icon });
        if (App.aktuelleSeite() !== m.pageId)
            App.oeffne(m.pageId);
        else {
            App.zeichneSeite();
            App.zeichneBaum();
        }
        sperre = false;
    };
    const zurueck = () => {
        const m = zurueckStapel.pop();
        if (!m) {
            UI.toast('Nichts mehr rückgängig zu machen');
            return;
        }
        const jetzt = momentaufnahme();
        if (jetzt)
            vorStapel.push(jetzt);
        anwenden(m);
        UI.toast('Rückgängig');
    };
    const vor = () => {
        const m = vorStapel.pop();
        if (!m) {
            UI.toast('Nichts zu wiederholen');
            return;
        }
        const jetzt = momentaufnahme();
        if (jetzt)
            zurueckStapel.push(jetzt);
        anwenden(m);
        UI.toast('Wiederholt');
    };
    const start = () => {
        ['updateBlock', 'addBlock', 'trashBlock', 'purgeBlock', 'setProp', 'addDatabase', 'addRow']
            .forEach(name => {
            const original = Store[name];
            Store[name] = function (...args) {
                merke(false);
                return original.apply(Store, args);
            };
        });
    };
    return {
        start, merke, zurueck, vor,
        status: () => ({ undoPageId: zurueckStapel.at(-1)?.pageId || null,
            redoPageId: vorStapel.at(-1)?.pageId || null }),
        leeren: () => { zurueckStapel.length = 0; vorStapel.length = 0; }
    };
})();
window.Verlauf = Verlauf;
