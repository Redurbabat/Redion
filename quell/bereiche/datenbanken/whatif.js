"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/whatif.ts (npm run bauen:ts). */
const WhatIf = (() => {
    const GENAU = 1e-7;
    const SCHRITTE = 60;
    const zahl = (x) => {
        if (typeof x === 'number')
            return x;
        const n = Number(String(x ?? '').replace(',', '.'));
        return Number.isFinite(n) ? n : NaN;
    };
    const probiere = (coll, row, stellKey, zielKey, wert) => {
        const probe = { ...row, props: { ...(row.props || {}), [stellKey]: wert } };
        return zahl(Datenbank.wertFrisch(probe, zielKey, coll));
    };
    const stellbar = (coll, key) => {
        const def = coll && coll.schema ? coll.schema[key] : null;
        return !!def && (def.type === 'number' || def.type === 'prozent');
    };
    const zielbar = (coll, key) => {
        const def = coll && coll.schema ? coll.schema[key] : null;
        return !!def && (def.type === 'formula' || def.type === 'rollup');
    };
    const zielwert = (coll, row, stellKey, zielKey, wunsch) => {
        const ziel = zahl(wunsch);
        if (!Number.isFinite(ziel))
            return { ok: false, grund: 'Der Zielwert ist keine Zahl.', schritte: 0 };
        if (!coll || !row)
            return { ok: false, grund: 'Zeile oder Tabelle fehlen.', schritte: 0 };
        if (!stellbar(coll, stellKey))
            return { ok: false, grund: 'Die Stellschraube muss eine Zahlenspalte sein.', schritte: 0 };
        if (!zielbar(coll, zielKey))
            return { ok: false, grund: 'Das Ziel muss eine gerechnete Spalte sein — ' +
                    'eine Zahl, die man einfach hinschreibt, ist schon da.',
                schritte: 0 };
        let schritte = 0;
        const f = (x) => { schritte++; return probiere(coll, row, stellKey, zielKey, x) - ziel; };
        const start = zahl((row.props || {})[stellKey]);
        const x0 = Number.isFinite(start) ? start : 0;
        const f0 = f(x0);
        if (!Number.isFinite(f0))
            return { ok: false, grund: 'Die Zielspalte rechnet gerade nicht — ' +
                    'sie gibt keine Zahl zurück.', schritte };
        if (Math.abs(f0) <= Math.max(GENAU, Math.abs(ziel) * GENAU))
            return { ok: true, wert: x0, erreicht: f0 + ziel, schritte };
        let weite = Math.max(1, Math.abs(x0)) / 2;
        let a = x0, fa = f0, b = x0;
        let gefunden = false;
        for (let i = 0; i < 60 && !gefunden; i++) {
            weite *= 2;
            const links = x0 - weite, rechts = x0 + weite;
            const fl = f(links);
            if (Number.isFinite(fl) && fl * f0 <= 0) {
                a = links;
                fa = fl;
                b = x0;
                gefunden = true;
                break;
            }
            const fr = f(rechts);
            if (Number.isFinite(fr) && fr * f0 <= 0) {
                a = x0;
                fa = f0;
                b = rechts;
                gefunden = true;
                break;
            }
            if (weite > 1e12)
                break;
        }
        if (!gefunden)
            return { ok: false, grund: 'Kein Wert der Stellschraube führt zu diesem Ziel — ' +
                    'auch nicht sehr grosse oder sehr kleine.', schritte };
        for (let i = 0; i < SCHRITTE; i++) {
            const m = (a + b) / 2;
            const fm = f(m);
            if (!Number.isFinite(fm))
                return { ok: false, grund: 'Die Zielspalte rechnet bei diesem Wert nicht mehr.', schritte };
            if (fm === 0)
                return { ok: true, wert: m, erreicht: ziel, schritte };
            if (Math.abs(b - a) <= 1e-12 * Math.max(1, Math.abs(m)))
                break;
            if (fa * fm <= 0)
                b = m;
            else {
                a = m;
                fa = fm;
            }
        }
        const m = (a + b) / 2;
        return { ok: true, wert: m, erreicht: probiere(coll, row, stellKey, zielKey, m), schritte };
    };
    const GOLD = (Math.sqrt(5) - 1) / 2;
    const optimum = (coll, row, stellKey, zielKey, richtung, von, bis) => {
        const u = zahl(von), o = zahl(bis);
        if (!Number.isFinite(u) || !Number.isFinite(o) || u >= o)
            return { ok: false, grund: 'Die Grenzen müssen zwei Zahlen sein, ' +
                    'die untere kleiner als die obere.', schritte: 0 };
        if (!stellbar(coll, stellKey))
            return { ok: false, grund: 'Die Stellschraube muss eine Zahlenspalte sein.', schritte: 0 };
        if (!zielbar(coll, zielKey))
            return { ok: false, grund: 'Das Ziel muss eine gerechnete Spalte sein.', schritte: 0 };
        let schritte = 0;
        const vz = richtung === 'min' ? -1 : 1;
        const f = (x) => { schritte++; return vz * probiere(coll, row, stellKey, zielKey, x); };
        let a = u, b = o;
        let c = b - GOLD * (b - a), d = a + GOLD * (b - a);
        let fc = f(c), fd = f(d);
        if (!Number.isFinite(fc) || !Number.isFinite(fd))
            return { ok: false, grund: 'Die Zielspalte rechnet in diesem Bereich nicht.', schritte };
        for (let i = 0; i < SCHRITTE && Math.abs(b - a) > 1e-9 * Math.max(1, Math.abs(a)); i++) {
            if (fc > fd) {
                b = d;
                d = c;
                fd = fc;
                c = b - GOLD * (b - a);
                fc = f(c);
            }
            else {
                a = c;
                c = d;
                fc = fd;
                d = a + GOLD * (b - a);
                fd = f(d);
            }
        }
        const x = (a + b) / 2;
        return { ok: true, wert: x, erreicht: probiere(coll, row, stellKey, zielKey, x), schritte };
    };
    const szenarien = (coll) => Array.isArray(coll && coll.szenarien) ? coll.szenarien : [];
    const merke = (coll, name, werte) => {
        const sauber = {};
        Object.keys(werte || {}).forEach(k => {
            const n = zahl(werte[k]);
            if (stellbar(coll, k) && Number.isFinite(n))
                sauber[k] = n;
        });
        const ohne = szenarien(coll).filter(s => s.name !== name);
        const liste = [...ohne, { name: String(name || 'Ohne Namen'), werte: sauber }];
        Store.updateCollection(coll.id, { szenarien: liste });
        return liste;
    };
    const vergiss = (coll, name) => {
        const liste = szenarien(coll).filter(s => s.name !== name);
        Store.updateCollection(coll.id, { szenarien: liste });
        return liste;
    };
    const zeige = (coll, row, name) => {
        const s = szenarien(coll).find(x => x.name === name);
        if (!s || !row)
            return null;
        const probe = { ...row, props: { ...(row.props || {}), ...s.werte } };
        const aus = {};
        Object.keys(coll.schema || {}).forEach(k => {
            if (zielbar(coll, k))
                aus[k] = Datenbank.wertFrisch(probe, k, coll);
        });
        return aus;
    };
    const uebernimm = (coll, row, name) => {
        const s = szenarien(coll).find(x => x.name === name);
        if (!s || !row)
            return false;
        Object.keys(s.werte).forEach(k => Store.setProp(row.id, k, s.werte[k]));
        return true;
    };
    return { zielwert, optimum, probiere, stellbar, zielbar,
        szenarien, merke, vergiss, zeige, uebernimm, GENAU, SCHRITTE };
})();
window.WhatIf = WhatIf;
