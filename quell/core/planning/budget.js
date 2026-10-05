"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/planning/budget.ts (npm run bauen:ts). */
const Budget = (() => {
    const zahl = (w, ersatz = 0) => {
        const n = Number(w);
        return Number.isFinite(n) ? n : ersatz;
    };
    const lesen = (roh, vorgabeMinuten = 25) => {
        const f = roh?.frist;
        return {
            id: String(roh?.id ?? ''),
            titel: String(roh?.titel ?? roh?.text ?? 'Ohne Titel'),
            art: String(roh?.art ?? 'aufgabe'),
            minuten: Math.max(1, Math.round(zahl(roh?.minuten, vorgabeMinuten))),
            frist: (f === null || f === undefined || f === '') ? null : Math.round(zahl(f, 0)),
            teilbar: roh?.teilbar !== false,
            fest: roh?.fest === true,
            gewicht: zahl(roh?.gewicht, 0)
        };
    };
    const aufRaster = (m, r) => Math.ceil(m / r) * r;
    const abRaster = (m, r) => Math.floor(m / r) * r;
    const verteilen = (roh, budgetMin, opt = {}) => {
        const raster = Math.max(1, Math.round(zahl(opt?.raster, 5)));
        const mindest = Math.max(1, Math.round(zahl(opt?.mindestBlock, 10)));
        const posten = (Array.isArray(roh) ? roh : [])
            .map(p => lesen(p, Math.max(1, Math.round(zahl(opt?.vorgabeMinuten, 25)))));
        const zuteilung = [];
        const draussen = [];
        let rest = Math.max(0, Math.round(zahl(budgetMin, 0)));
        const feste = posten.filter(p => p.fest && p.frist === 0);
        let festMinuten = 0;
        for (const p of feste) {
            festMinuten += p.minuten;
            zuteilung.push({ posten: p, minuten: p.minuten, ganz: true, grund: 'fest' });
        }
        const ueberzogen = Math.max(0, festMinuten - rest);
        rest = Math.max(0, rest - festMinuten);
        const nimm = (p, will, grund) => {
            if (rest <= 0) {
                draussen.push({ posten: p, grund: 'kein Rest' });
                return;
            }
            if (will <= rest) {
                zuteilung.push({ posten: p, minuten: will, ganz: will >= p.minuten, grund });
                rest -= will;
                return;
            }
            if (!p.teilbar) {
                draussen.push({ posten: p, grund: 'am Stück' });
                return;
            }
            const stueck = abRaster(rest, raster);
            if (stueck < Math.min(mindest, p.minuten)) {
                draussen.push({ posten: p, grund: 'zu wenig Rest' });
                return;
            }
            zuteilung.push({ posten: p, minuten: stueck, ganz: false, grund });
            rest -= stueck;
        };
        const mitFrist = posten.filter(p => !p.fest && p.frist !== null)
            .sort((a, b) => a.frist - b.frist || a.minuten - b.minuten);
        for (const p of mitFrist) {
            const tage = Math.max(1, p.frist + 1);
            const rate = p.teilbar
                ? Math.min(p.minuten, aufRaster(Math.ceil(p.minuten / tage), raster))
                : p.minuten;
            nimm(p, rate, p.frist < 0 ? 'überfällig' : 'Frist');
        }
        const ohneFrist = posten.filter(p => !p.fest && p.frist === null)
            .sort((a, b) => b.gewicht - a.gewicht || a.minuten - b.minuten);
        for (const p of ohneFrist)
            nimm(p, p.minuten, 'wenn Zeit bleibt');
        const verplant = zuteilung.reduce((s, z) => s + z.minuten, 0);
        return { zuteilung, draussen, verplant, rest, festMinuten, ueberzogen };
    };
    const machbarkeit = (roh, tagesbudget, opt = {}) => {
        const budget = Math.max(0, Math.round(zahl(tagesbudget, 0)));
        const horizont = Math.max(0, Math.round(zahl(opt?.horizont, 30)));
        const posten = (Array.isArray(roh) ? roh : [])
            .map(p => lesen(p, Math.max(1, Math.round(zahl(opt?.vorgabeMinuten, 25)))));
        const festAmTag = new Map();
        for (const p of posten) {
            if (!p.fest || p.frist === null)
                continue;
            const t = Math.max(0, p.frist);
            if (t > horizont)
                continue;
            festAmTag.set(t, (festAmTag.get(t) || 0) + p.minuten);
        }
        const kapazitaetBis = (tag, b) => {
            let k = 0;
            for (let t = 0; t <= tag; t++)
                k += Math.max(0, b - (festAmTag.get(t) || 0));
            return k;
        };
        const arbeit = posten
            .filter(p => !p.fest && p.frist !== null && p.frist <= horizont)
            .map(p => ({ p, tag: Math.max(0, p.frist) }))
            .sort((a, b) => a.tag - b.tag || b.p.minuten - a.p.minuten);
        const engpaesseBei = (b) => {
            const raus = [];
            const titel = [];
            let bedarf = 0, i = 0;
            for (const tag of [...new Set(arbeit.map(a => a.tag))].sort((x, y) => x - y)) {
                while (i < arbeit.length && arbeit[i].tag <= tag) {
                    bedarf += arbeit[i].p.minuten;
                    titel.push(arbeit[i].p.titel);
                    i++;
                }
                const kap = kapazitaetBis(tag, b);
                if (bedarf > kap)
                    raus.push({ tag, bedarf, kapazitaet: kap, fehlt: bedarf - kap, posten: titel.slice() });
            }
            return raus;
        };
        const engpaesse = engpaesseBei(budget);
        const gesamt = arbeit.reduce((s, a) => s + a.p.minuten, 0);
        const festGesamt = [...festAmTag.values()].reduce((s, m) => s + m, 0);
        let tief = 0, hoch = gesamt + festGesamt;
        while (tief < hoch) {
            const mitte = Math.floor((tief + hoch) / 2);
            if (engpaesseBei(mitte).length)
                tief = mitte + 1;
            else
                hoch = mitte;
        }
        const spaet = posten.filter(p => !p.fest && p.frist !== null && p.frist < 0);
        return {
            machbar: engpaesse.length === 0,
            engpaesse,
            noetigProTag: tief,
            ueberfaellig: spaet.length,
            ueberfaelligMinuten: spaet.reduce((s, p) => s + p.minuten, 0)
        };
    };
    const tagWort = (tag) => tag <= 0 ? 'heute' : tag === 1 ? 'morgen' : tag === 2 ? 'übermorgen'
        : 'in ' + tag + ' Tagen';
    const dauerWort = (minuten) => {
        const m = Math.max(0, Math.round(zahl(minuten, 0)));
        if (m < 60)
            return m + ' Min.';
        const std = Math.floor(m / 60), rest = m % 60;
        return rest ? std + ' Std. ' + rest + ' Min.' : std + ' Std.';
    };
    const dauerKurz = (minuten) => {
        const m = Math.max(0, Math.round(zahl(minuten, 0)));
        if (m < 60)
            return m + ' Min.';
        const std = Math.floor(m / 60), rest = m % 60;
        return rest ? std + ' Std ' + rest : std + ' Std';
    };
    const engpassSatz = (e) => 'Bis ' + tagWort(e.tag) + ' fehlen ' + dauerWort(e.fehlt);
    const satz = (m) => {
        if (!m || m.machbar)
            return '';
        const erster = m.engpaesse[0];
        if (!erster)
            return '';
        return engpassSatz(erster) + ' Nötig wären ' + dauerWort(m.noetigProTag) + ' am Tag.';
    };
    return { verteilen, machbarkeit, lesen, satz, engpassSatz, tagWort, dauerWort,
        dauerKurz };
})();
window.Budget = Budget;
