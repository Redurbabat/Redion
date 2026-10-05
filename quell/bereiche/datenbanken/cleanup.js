"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/cleanup.ts (npm run bauen:ts). */
const Aufraeumen = (() => {
    const UNSICHTBAR = /[\u00a0\u2007\u202f\u200b\u200c\u200d\ufeff]/g;
    const GRIFFE = [
        { id: 'rand', name: 'Leerzeichen am Rand entfernen',
            was: 'vorn und hinten',
            tu: (w) => w.replace(/^\s+|\s+$/g, '') },
        { id: 'innen', name: 'Doppelte Leerzeichen zusammenziehen',
            was: 'zwei oder mehr werden eines',
            tu: (w) => w.replace(/[ \t]{2,}/g, ' ') },
        { id: 'unsichtbar', name: 'Unsichtbare Zeichen entfernen',
            was: 'geschütztes Leerzeichen, Nullbreite, BOM',
            tu: (w) => w.replace(UNSICHTBAR, ' ') },
        { id: 'gross', name: 'Erster Buchstabe gross',
            was: 'nur der erste, der Rest bleibt',
            tu: (w) => w ? w.charAt(0).toLocaleUpperCase('de-DE') + w.slice(1) : w }
    ];
    const plan = (coll, key, wahl = {}) => {
        const def = coll && coll.schema ? coll.schema[key] : null;
        const spalte = def ? String(def.name || key) : String(key);
        const griffe = GRIFFE.filter(g => (wahl.griffe || []).includes(g.id));
        const suche = String(wahl.ersetze ?? '');
        const durch = String(wahl.durch ?? '');
        const zeilen = [];
        const alle = Store.rowsOf(coll.id);
        for (const row of alle) {
            const roh = (row.props || {})[key];
            if (typeof roh !== 'string')
                continue;
            let neu = roh;
            for (const g of griffe)
                neu = g.tu(neu);
            if (suche) {
                neu = wahl.nurGanz
                    ? (neu === suche ? durch : neu)
                    : neu.split(suche).join(durch);
            }
            if (neu !== roh)
                zeilen.push({ id: row.id, vorher: roh, nachher: neu });
        }
        return { key, spalte, zeilen, betroffen: zeilen.length, gesamt: alle.length };
    };
    const wende = (vorschau) => {
        let geaendert = 0, ausgelassen = 0;
        for (const z of vorschau.zeilen) {
            const row = Store.getBlock(z.id);
            if (!row || (row.props || {})[vorschau.key] !== z.vorher) {
                ausgelassen++;
                continue;
            }
            Store.setProp(z.id, vorschau.key, z.nachher);
            geaendert++;
        }
        return { geaendert, ausgelassen };
    };
    const spalten = (coll) => Object.keys((coll && coll.schema) || {}).filter(k => {
        const t = coll.schema[k].type;
        return t === 'text' || t === 'title' || t === 'url' ||
            t === 'email' || t === 'phone';
    });
    return { GRIFFE, plan, wende, spalten };
})();
window.Aufraeumen = Aufraeumen;
