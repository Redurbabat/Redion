"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/knowledge/rank.ts (npm run bauen:ts). */
const KnowledgeRank = (() => {
    const VORGABE_GEWICHT = {
        link: 1.0, relation: 0.8, tree: 0.5, tag: 0.3
    };
    const rank = (nodes, edges, opt = {}) => {
        const gerichtet = new Set(opt.gerichtet || ['link']);
        const gewicht = opt.gewicht || VORGABE_GEWICHT;
        const d = typeof opt.daempfung === 'number' ? opt.daempfung : 0.85;
        const maxRunden = opt.runden || 100;
        const toleranz = typeof opt.toleranz === 'number' ? opt.toleranz : 1e-8;
        const ohne = new Set(opt.ohne || []);
        const ids = [];
        const index = new Map();
        for (const n of nodes) {
            if (!n || !n.id)
                continue;
            if (n.kind && ohne.has(n.kind))
                continue;
            if (index.has(n.id))
                continue;
            index.set(n.id, ids.length);
            ids.push(n.id);
        }
        const N = ids.length;
        if (!N) {
            return { liste: [], nachId: Object.create(null), runden: 0,
                rest: 0, summe: 0, sackgassen: 0 };
        }
        const vonListe = new Array(N);
        const gewListe = new Array(N);
        for (let i = 0; i < N; i++) {
            vonListe[i] = [];
            gewListe[i] = [];
        }
        const lege = (a, b, w) => {
            vonListe[a].push(b);
            gewListe[a].push(w);
        };
        for (const e of edges) {
            if (!e)
                continue;
            const a = index.get(e.source);
            const b = index.get(e.target);
            if (a === undefined || b === undefined || a === b)
                continue;
            const art = e.kind || '';
            const w = typeof gewicht[art] === 'number' ? gewicht[art] : 1;
            if (w <= 0)
                continue;
            lege(a, b, w);
            if (!gerichtet.has(art))
                lege(b, a, w);
        }
        const ausSumme = new Float64Array(N);
        let sackgassen = 0;
        for (let i = 0; i < N; i++) {
            let s = 0;
            const g = gewListe[i];
            for (let k = 0; k < g.length; k++)
                s += g[k];
            ausSumme[i] = s;
            if (s === 0)
                sackgassen++;
        }
        let r = new Float64Array(N);
        let neu = new Float64Array(N);
        r.fill(1 / N);
        let runden = 0;
        let rest = 0;
        for (; runden < maxRunden; runden++) {
            let hAngig = 0;
            for (let i = 0; i < N; i++)
                if (ausSumme[i] === 0)
                    hAngig += r[i];
            const grund = (1 - d) / N + (d * hAngig) / N;
            neu.fill(grund);
            for (let i = 0; i < N; i++) {
                const s = ausSumme[i];
                if (s === 0)
                    continue;
                const anteil = (d * r[i]) / s;
                const ziel = vonListe[i];
                const g = gewListe[i];
                for (let k = 0; k < ziel.length; k++) {
                    const j = ziel[k];
                    neu[j] = neu[j] + anteil * g[k];
                }
            }
            rest = 0;
            for (let i = 0; i < N; i++)
                rest += Math.abs(neu[i] - r[i]);
            const tausch = r;
            r = neu;
            neu = tausch;
            if (rest < toleranz) {
                runden++;
                break;
            }
        }
        let summe = 0;
        for (let i = 0; i < N; i++)
            summe += r[i];
        const liste = new Array(N);
        for (let i = 0; i < N; i++)
            liste[i] = { id: ids[i], rang: r[i], platz: 0 };
        liste.sort((a, b) => b.rang - a.rang || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const nachId = Object.create(null);
        for (let i = 0; i < liste.length; i++) {
            liste[i].platz = i + 1;
            nachId[liste[i].id] = liste[i].rang;
        }
        return { liste, nachId, runden, rest, summe, sackgassen };
    };
    const punkte = (erg, nodes, opt = {}) => {
        const frischeStaerke = typeof opt.frische === 'number' ? opt.frische : 0.25;
        const frischeTage = opt.frischeTage || 180;
        const sternStaerke = typeof opt.stern === 'number' ? opt.stern : 0.15;
        const artGewicht = opt.artGewicht || {};
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const info = new Map();
        for (const n of nodes)
            if (n && n.id)
                info.set(n.id, n);
        const roh = [];
        for (const r of erg.liste) {
            const n = info.get(r.id);
            let wert = Math.sqrt(Math.max(0, r.rang));
            if (n) {
                if (frischeStaerke > 0 && n.edited) {
                    const t = Date.parse(n.edited);
                    if (Number.isFinite(t)) {
                        const tage = (jetzt - t) / 86400000;
                        const frisch = Math.max(0, 1 - Math.max(0, tage) / frischeTage);
                        wert *= (1 + frischeStaerke * frisch);
                    }
                }
                if (sternStaerke > 0 && n.favorite)
                    wert *= (1 + sternStaerke);
                if (n.kind && typeof artGewicht[n.kind] === 'number') {
                    wert *= artGewicht[n.kind];
                }
            }
            roh.push({ id: r.id, wert, rang: r.rang });
        }
        const hoechst = roh.reduce((m, x) => Math.max(m, x.wert), 0);
        roh.sort((a, b) => b.wert - a.wert || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        return roh.map((x, i) => ({
            id: x.id,
            punkte: hoechst > 0 ? Math.round((x.wert / hoechst) * 100) : 0,
            platz: i + 1,
            rang: x.rang
        }));
    };
    return { rank, punkte, VORGABE_GEWICHT };
})();
window.KnowledgeRank = KnowledgeRank;
