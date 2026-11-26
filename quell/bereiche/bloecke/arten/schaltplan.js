"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/schaltplan.ts (npm run bauen:ts). */
const Schaltplan = ((Register) => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const tief = (wert) => esc(wert).replace(/_([\p{L}\p{N}%]+)/gu, '<tspan baseline-shift="sub" font-size="0.72em">$1</tspan>');
    const R = () => (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen.RASTER : 10;
    const rasten = (v) => Math.round(v / R()) * R();
    const zeigeZahl = (wert, einheit) => (typeof Stromfluss !== 'undefined' && Stromfluss.zeige)
        ? Stromfluss.zeige(wert, einheit)
        : `${wert} ${einheit}`;
    const ARTEN = [
        { id: 'stromlauf-aufgeloest', name: 'Stromlaufplan, aufgelöst',
            erklaerung: 'Jeder Stromkreis für sich, von oben nach unten. Kontakte stehen dort, wo sie wirken — nicht beim Gerät.',
            gruppen: ['kontakte', 'schalter', 'relais', 'schutz', 'melder'], schienen: 'steuer' },
        { id: 'stromlauf-zusammenhaengend', name: 'Stromlaufplan, zusammenhängend',
            erklaerung: 'Alle Teile eines Geräts stehen beieinander. Übersichtlich bei kleinen Schaltungen.',
            gruppen: ['relais', 'kontakte', 'schalter', 'motoren'], schienen: 'steuer' },
        { id: 'hauptstromkreis', name: 'Hauptstromkreis',
            erklaerung: 'Der Leistungsteil: Zuleitung, Schutz, Schütz, Motor. Drei Aussenleiter.',
            gruppen: ['schutz', 'relais', 'motoren', 'leitungen'], schienen: 'haupt' },
        { id: 'installationsplan', name: 'Installationsplan',
            erklaerung: 'Was wo im Raum sitzt — Leuchten, Schalter, Steckdosen im Grundriss.',
            gruppen: ['schalter', 'melder', 'stecker'], schienen: 'keine', quer: true },
        { id: 'uebersichtsplan', name: 'Übersichtsplan',
            erklaerung: 'Die Anlage grob, einpolig gezeichnet. Für den ersten Blick.',
            gruppen: ['schutz', 'motoren', 'quellen'], schienen: 'keine' },
        { id: 'klemmenplan', name: 'Klemmenplan',
            erklaerung: 'Welche Ader auf welche Klemme. Die Trennstelle zwischen Schrank und Anlage.',
            gruppen: ['stecker', 'leitungen'], schienen: 'keine' },
        { id: 'verdrahtungsplan', name: 'Verdrahtungsplan',
            erklaerung: 'Wie im Schrank wirklich verdrahtet wird — Ader für Ader.',
            gruppen: ['stecker', 'relais', 'schutz'], schienen: 'keine' },
        { id: 'anschlussplan', name: 'Anschlussplan',
            erklaerung: 'Die äusseren Anschlüsse eines Geräts, ohne sein Innenleben.',
            gruppen: ['motoren', 'stecker', 'leitungen'], schienen: 'keine' },
        { id: 'blockschaltbild', name: 'Blockschaltbild',
            erklaerung: 'Baugruppen als Kästen mit Pfeilen dazwischen. Wirkung statt Verdrahtung.',
            gruppen: ['quellen', 'motoren', 'messen'], schienen: 'keine', quer: true },
        { id: 'funktionsplan', name: 'Funktionsplan',
            erklaerung: 'Was die Steuerung tun soll, als Ablauf — noch ohne Bauteile.',
            gruppen: ['kontakte', 'relais'], schienen: 'keine', quer: true },
        { id: 'aufbauplan', name: 'Schaltschrank-Aufbau',
            erklaerung: 'Wo im Schrank welches Gerät sitzt. Massstäblich auf der Hutschiene.',
            gruppen: ['schutz', 'relais', 'stecker'], schienen: 'keine', quer: true }
    ];
    const artVon = (id) => ARTEN.find(a => a.id === id) || ARTEN[0];
    const SCHIENEN = ['L1', 'L2', 'L3', 'N', 'PE'];
    const EBENEN_VORGABE = [
        { id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true },
        { id: 'aufgabe', name: 'Aufgabe', farbe: '#c2410c', sichtbar: true },
        { id: 'loesung', name: 'Lösung', farbe: '#15803d', sichtbar: true }
    ];
    const uid = () => (typeof Ids !== 'undefined' && Ids.short)
        ? 'sp' + Ids.short()
        : 'sp' + Math.floor(performance.now() * 1000).toString(36);
    const neuerPlan = (art = 'stromlauf-aufgeloest') => {
        const a = artVon(art);
        return {
            art: a.id,
            breite: a.quer ? 1000 : 800,
            hoehe: a.quer ? 600 : 700,
            teile: [], leitungen: [], texte: [],
            ebenen: EBENEN_VORGABE.map(e => ({ ...e }))
        };
    };
    const relaisLegacyLesen = (r) => {
        if (!r || typeof r !== 'object')
            return null;
        const o = r;
        if (typeof o.roh !== 'string' || o.roh.length !== 5760 || !Array.isArray(o.texte))
            return null;
        return { relaisLegacy: {
                name: String(o.name || '').slice(0, 150),
                format: 'Relais-Schaltplan 9×30',
                roh: o.roh,
                txtRoh: typeof o.txtRoh === 'string' && o.txtRoh.length <= 22000 ? o.txtRoh : '',
                texte: o.texte.slice(0, 30).map(v => String(v).slice(0, 200)),
                verifiziert: o.verifiziert === true,
                bearbeitet: o.bearbeitet === true,
                texteBearbeitet: o.texteBearbeitet === true,
                nichtVerifiziert: Array.isArray(o.nichtVerifiziert)
                    ? o.nichtVerifiziert.slice(0, 8).map(v => String(v).slice(0, 240)) : []
            } };
    };
    const lesen = (block) => {
        const roh = (block && block.plan) || {};
        const a = artVon(String(roh.art || ''));
        return {
            art: a.id,
            breite: Number(roh.breite) || (a.quer ? 1000 : 800),
            hoehe: Number(roh.hoehe) || (a.quer ? 600 : 700),
            ...(Array.isArray(roh.ink) ? { ink: roh.ink.map(InkStroke.readAnnotation)
                    .filter((m) => m !== null) } : {}),
            teile: (Array.isArray(roh.teile) ? roh.teile : []).map((t) => ({
                id: String(t.id || uid()),
                zeichen: String(t.zeichen || ''),
                x: rasten(Number(t.x) || 0), y: rasten(Number(t.y) || 0),
                drehung: Number(t.drehung) || 0,
                gespiegelt: !!t.gespiegelt,
                bmk: String(t.bmk || ''),
                nummern: (t.nummern && typeof t.nummern === 'object') ? t.nummern : {},
                gruppe: String(t.gruppe || ''),
                ebene: String(t.ebene || 'plan'),
                ...(typeof t.beschriftung === 'string' && t.beschriftung.trim()
                    ? { beschriftung: t.beschriftung.trim().slice(0, 120) } : {}),
                ...(Number.isInteger(t.legacySpalte) && t.legacySpalte >= 0 && t.legacySpalte < 30
                    ? { legacySpalte: t.legacySpalte } : {}),
                ...(t.werte && typeof t.werte === 'object' && !Array.isArray(t.werte)
                    ? { werte: Object.fromEntries(Object.entries(t.werte).filter(([, v]) => typeof v === 'number' && Number.isFinite(v))) } : {})
            })).filter((t) => t.zeichen),
            leitungen: (Array.isArray(roh.leitungen) ? roh.leitungen : []).map((l) => ({
                id: String(l.id || uid()),
                punkte: (Array.isArray(l.punkte) ? l.punkte : [])
                    .map((p) => ({ x: rasten(Number(p.x) || 0), y: rasten(Number(p.y) || 0) })),
                ebene: String(l.ebene || 'plan'),
                vonTeil: l.vonTeil ? String(l.vonTeil) : undefined,
                vonNr: l.vonNr ? String(l.vonNr) : undefined,
                nachTeil: l.nachTeil ? String(l.nachTeil) : undefined,
                nachNr: l.nachNr ? String(l.nachNr) : undefined,
                ...(SCHIENEN.includes(String(l.schiene)) ? { schiene: String(l.schiene) } : {})
            })).filter((l) => l.punkte.length >= 2),
            texte: (Array.isArray(roh.texte) ? roh.texte : []).map((x) => ({
                id: String(x.id || uid()),
                x: rasten(Number(x.x) || 0), y: rasten(Number(x.y) || 0),
                t: String(x.t || ''), ebene: String(x.ebene || 'plan')
            })).filter((x) => x.t),
            ebenen: (Array.isArray(roh.ebenen) && roh.ebenen.length
                ? roh.ebenen.map((e) => ({
                    id: String(e.id || 'plan'), name: String(e.name || 'Plan'),
                    farbe: String(e.farbe || 'var(--text)'), sichtbar: e.sichtbar !== false
                }))
                : EBENEN_VORGABE.map(e => ({ ...e }))),
            ...(relaisLegacyLesen(roh.relaisLegacy) ?? {}),
            ...(roh.batterieUebung && typeof roh.batterieUebung === 'object' &&
                Array.isArray(roh.batterieUebung.teile)
                ? { batterieUebung: {
                        id: String(roh.batterieUebung.id || ''),
                        plus: String(roh.batterieUebung.plus || ''),
                        minus: String(roh.batterieUebung.minus || ''),
                        teile: roh.batterieUebung.teile.map(String).slice(0, 64),
                        ...(Array.isArray(roh.batterieUebung.ausgaenge) ? {
                            ausgaenge: roh.batterieUebung.ausgaenge.slice(0, 8).map((x) => ({
                                id: String(x.id || ''), name: String(x.name || ''),
                                zielU: Number(x.zielU) || 0, zielI: Number(x.zielI) || 0
                            }))
                        } : {})
                    } } : {})
        };
    };
    const naechstesBmk = (plan, zeichenId) => {
        const z = (typeof Register !== 'undefined' && Register.fachzeichen)
            ? Register.fachzeichen.holen(zeichenId) : null;
        const buchstabe = (z && z.kennbuchstabe) || '';
        if (!buchstabe)
            return '';
        const belegt = new Set();
        plan.teile.forEach(t => {
            const m = /^([A-Za-z]+)(\d+)$/.exec(t.bmk || '');
            if (m && m[1] === buchstabe)
                belegt.add(Number(m[2]));
        });
        let n = 1;
        while (belegt.has(n))
            n++;
        return buchstabe + n;
    };
    const anschlussOrt = (t, nr) => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return null;
        const lage = Register.fachzeichen.anschlussLage(t.zeichen, nr, t.drehung, t.gespiegelt);
        if (!lage)
            return null;
        return { x: t.x + lage.x, y: t.y + lage.y };
    };
    const klemmeFuer = (t, nr, punkt) => {
        if (!t || !nr || typeof Register === 'undefined' || !Register.fachzeichen
            || typeof Register.fachzeichen.klemmeFuer !== 'function')
            return nr;
        const r = Register.fachzeichen.klemmeFuer(t.zeichen, nr, punkt ? { x: punkt.x - t.x, y: punkt.y - t.y } : null, t.drehung, t.gespiegelt);
        return r ? r.nr : nr;
    };
    const anschluesseVon = (t) => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return [];
        const z = Register.fachzeichen.holen(t.zeichen);
        if (!z)
            return [];
        return z.anschluesse.map((a) => {
            const o = anschlussOrt(t, a.nr);
            return { nr: a.nr, anzeige: t.nummern[a.nr] ?? a.nr, x: o ? o.x : t.x, y: o ? o.y : t.y };
        });
    };
    const FANG = 14;
    const fangeAnschluss = (plan, p, radius = FANG) => {
        let beste = null;
        let weite = Math.max(0, radius) ** 2;
        const versteckt = new Set(plan.ebenen.filter(e => e.sichtbar === false).map(e => e.id));
        plan.teile.forEach(t => {
            if (versteckt.has(t.ebene))
                return;
            anschluesseVon(t).forEach(a => {
                const d = (a.x - p.x) * (a.x - p.x) + (a.y - p.y) * (a.y - p.y);
                if (d <= weite) {
                    weite = d;
                    beste = { teil: t.id, nr: a.nr, x: a.x, y: a.y };
                }
            });
        });
        return beste;
    };
    const rechtwinklig = (a, b) => {
        if (a.x === b.x || a.y === b.y)
            return [a, b];
        const waagrechtZuerst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
        const ecke = waagrechtZuerst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
        return [a, ecke, b];
    };
    const NAH = () => (typeof Register !== 'undefined' && Register.fachzeichen
        && typeof Register.fachzeichen.NAH === 'number') ? Register.fachzeichen.NAH : 6;
    const nahAnStrecke = (p, a, b) => {
        const nah = NAH();
        if (Math.abs(a.y - b.y) <= 1 && Math.abs(p.y - a.y) <= nah)
            return p.x >= Math.min(a.x, b.x) - nah && p.x <= Math.max(a.x, b.x) + nah;
        if (Math.abs(a.x - b.x) <= 1 && Math.abs(p.x - a.x) <= nah)
            return p.y >= Math.min(a.y, b.y) - nah && p.y <= Math.max(a.y, b.y) + nah;
        return false;
    };
    const klemmorte = (plan) => {
        const raus = [];
        plan.teile.forEach(t => anschluesseVon(t).forEach(a => raus.push({ teil: String(t.id), nr: a.nr, x: a.x, y: a.y, name: String(t.id) + ':' + a.nr })));
        return raus;
    };
    const endeGenau = (plan, teil, nr, p) => {
        const t = plan.teile.find(x => String(x.id) === teil);
        const F = (typeof Register !== 'undefined') ? Register.fachzeichen : null;
        if (!t || !F || typeof F.klemmeFuer !== 'function')
            return { nr, frueher: false };
        const r = F.klemmeFuer(t.zeichen, nr, p ? { x: p.x - t.x, y: p.y - t.y } : null, t.drehung, t.gespiegelt);
        return r || { nr, frueher: false };
    };
    const leitungenBeruehren = (pa, pb) => {
        for (const p of pa)
            for (let s = 0; s + 1 < pb.length; s++)
                if (nahAnStrecke(p, pb[s], pb[s + 1]))
                    return true;
        for (const p of pb)
            for (let s = 0; s + 1 < pa.length; s++)
                if (nahAnStrecke(p, pa[s], pa[s + 1]))
                    return true;
        return false;
    };
    const pruefeBeruehrung = (plan, l, punkte, orte, andere, erlaubt) => {
        const nah = NAH();
        const klemmen = new Set();
        const nicht = new Set();
        const enden = [
            [l.vonTeil, l.vonNr, punkte[0]], [l.nachTeil, l.nachNr, punkte[punkte.length - 1]]
        ];
        for (const [tid, nr, p] of enden) {
            if (!tid || !nr)
                continue;
            const teil = String(tid);
            const r = endeGenau(plan, teil, nr, p);
            const name = teil + ':' + r.nr;
            if (erlaubt && !erlaubt.klemmen.has(name))
                return null;
            klemmen.add(name);
            if (r.frueher)
                orte.forEach(k => { if (k.teil === teil && k.nr !== r.nr)
                    nicht.add(k.name); });
        }
        for (const k of orte) {
            if (nicht.has(k.name) || klemmen.has(k.name))
                continue;
            let trifft = punkte.some(p => Math.abs(p.x - k.x) <= nah && Math.abs(p.y - k.y) <= nah);
            for (let i = 0; !trifft && i + 1 < punkte.length; i++)
                trifft = nahAnStrecke(k, punkte[i], punkte[i + 1]);
            if (!trifft)
                continue;
            if (erlaubt && !erlaubt.klemmen.has(k.name))
                return null;
            klemmen.add(k.name);
        }
        const leitungen = [];
        for (const m of andere) {
            if (m.id === l.id || !leitungenBeruehren(punkte, m.punkte))
                continue;
            if (erlaubt && !erlaubt.leitungen.has(m.id))
                return null;
            leitungen.push(m.id);
        }
        return { klemmen: [...klemmen].sort(), leitungen: leitungen.sort() };
    };
    const beruehrung = (plan, l, punkte, orte, andere) => pruefeBeruehrung(plan, l, punkte, orte, andere) ?? { klemmen: [], leitungen: [] };
    const kontakte = (plan, l) => beruehrung(plan, l, l.punkte, klemmorte(plan), plan.leitungen);
    const klemmenAufeinander = (orte) => {
        const nah = NAH();
        const raus = new Set();
        for (let i = 0; i < orte.length; i++)
            for (let j = i + 1; j < orte.length; j++) {
                const a = orte[i], b = orte[j];
                if (a.teil === b.teil || Math.abs(a.x - b.x) > nah || Math.abs(a.y - b.y) > nah)
                    continue;
                raus.add(a.name < b.name ? a.name + '|' + b.name : b.name + '|' + a.name);
            }
        return raus;
    };
    const vorherMerken = (plan) => {
        const orte = klemmorte(plan);
        const teil = (id) => id === undefined ? undefined : plan.teile.find(t => String(t.id) === String(id));
        const klemmen = new Map();
        const punkte = new Map();
        const beruehrt = new Map();
        plan.leitungen.forEach(l => {
            const n = l.punkte.length;
            klemmen.set(l.id, {
                von: l.vonTeil ? klemmeFuer(teil(l.vonTeil), l.vonNr, l.punkte[0]) : undefined,
                nach: l.nachTeil ? klemmeFuer(teil(l.nachTeil), l.nachNr, l.punkte[n - 1]) : undefined
            });
            punkte.set(l.id, l.punkte.map(p => ({ x: p.x, y: p.y })));
            beruehrt.set(l.id, beruehrung(plan, l, l.punkte, orte, plan.leitungen));
        });
        return { klemmen, punkte, beruehrt, aufeinander: klemmenAufeinander(orte) };
    };
    const veraendert = (plan, vorher) => {
        const orte = klemmorte(plan);
        const raus = [];
        plan.leitungen.forEach(l => {
            const vor = vorher.beruehrt.get(l.id);
            if (!vor)
                return;
            const jetzt = beruehrung(plan, l, l.punkte, orte, plan.leitungen);
            jetzt.klemmen.forEach(k => { if (!vor.klemmen.includes(k))
                raus.push({ art: 'klemme', leitung: l.id, klemme: k, jetzt: true }); });
            vor.klemmen.forEach(k => { if (!jetzt.klemmen.includes(k))
                raus.push({ art: 'klemme', leitung: l.id, klemme: k, jetzt: false }); });
            jetzt.leitungen.forEach(m => { if (l.id < m && !vor.leitungen.includes(m))
                raus.push({ art: 'leitung', leitung: l.id, andere: m, jetzt: true }); });
            vor.leitungen.forEach(m => {
                if (l.id < m && !jetzt.leitungen.includes(m)
                    && plan.leitungen.some(x => x.id === m))
                    raus.push({ art: 'leitung', leitung: l.id, andere: m, jetzt: false });
            });
        });
        const auf = klemmenAufeinander(orte);
        const paar = (s, jetzt) => {
            const [a, b] = s.split('|');
            return { art: 'aufeinander', klemme: a ?? '', andere: b ?? '', jetzt };
        };
        auf.forEach(s => { if (!vorher.aufeinander.has(s))
            raus.push(paar(s, true)); });
        vorher.aufeinander.forEach(s => { if (!auf.has(s))
            raus.push(paar(s, false)); });
        return raus;
    };
    const gleicherPunkt = (a, b) => a.x === b.x && a.y === b.y;
    const ohneDoppel = (ps) => ps.filter((p, i) => i === 0 || !gleicherPunkt(p, ps[i - 1]));
    const allesRechtwinklig = (ps) => ps.every((p, i) => i === 0 || p.x === ps[i - 1].x || p.y === ps[i - 1].y);
    const gleitend = (alt, a, b) => {
        const n = alt.length;
        if (n < 2)
            return null;
        if (n === 2)
            return (a.x === b.x || a.y === b.y) ? [a, b] : null;
        const q = alt.map(p => ({ x: p.x, y: p.y }));
        const ruecke = (ende, nachbar, ziel) => {
            const e = alt[ende], m = alt[nachbar];
            if (gleicherPunkt(e, ziel))
                return true;
            if (e.y === m.y && e.x !== m.x)
                q[nachbar].y = ziel.y;
            else if (e.x === m.x && e.y !== m.y)
                q[nachbar].x = ziel.x;
            else
                return false;
            q[ende] = { x: ziel.x, y: ziel.y };
            return true;
        };
        if (!ruecke(0, 1, a) || !ruecke(n - 1, n - 2, b))
            return null;
        const r = ohneDoppel(q);
        return r.length >= 2 && allesRechtwinklig(r) ? r : null;
    };
    const andererWinkel = (a, b) => {
        if (a.x === b.x || a.y === b.y)
            return null;
        const ecke = rechtwinklig(a, b)[1];
        return [a, ecke.x === b.x ? { x: a.x, y: b.y } : { x: b.x, y: a.y }, b];
    };
    const zWege = (a, b, breite, hoehe) => {
        const r = R();
        const liste = [];
        const mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
        if (a.y !== b.y)
            for (let mx = 0; mx <= breite; mx += r) {
                if (mx === a.x || mx === b.x)
                    continue;
                liste.push({ weg: [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b],
                    laenge: Math.abs(mx - a.x) + Math.abs(b.y - a.y) + Math.abs(b.x - mx),
                    abstand: Math.abs(mx - mx0), art: 0, m: mx });
            }
        if (a.x !== b.x)
            for (let my = 0; my <= hoehe; my += r) {
                if (my === a.y || my === b.y)
                    continue;
                liste.push({ weg: [a, { x: a.x, y: my }, { x: b.x, y: my }, b],
                    laenge: Math.abs(my - a.y) + Math.abs(b.x - a.x) + Math.abs(b.y - my),
                    abstand: Math.abs(my - my0), art: 1, m: my });
            }
        liste.sort((p, q) => p.laenge - q.laenge || p.abstand - q.abstand || p.art - q.art || p.m - q.m);
        return liste.map(e => e.weg);
    };
    const hakenWege = (a, b, breite, hoehe) => {
        const r = R();
        const rand = 10 * r;
        const werte = (u, v, max) => {
            const raus = [];
            const lo = Math.max(0, Math.ceil((Math.min(u, v) - rand) / r) * r);
            const hi = Math.min(max, Math.max(u, v) + rand);
            for (let w = lo; w <= hi; w += r)
                raus.push(w);
            return raus;
        };
        const xs = werte(a.x, b.x, breite), ys = werte(a.y, b.y, hoehe);
        const mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
        const liste = [];
        for (const x1 of xs) {
            if (x1 === a.x || x1 === b.x)
                continue;
            for (const y1 of ys) {
                if (y1 === a.y || y1 === b.y)
                    continue;
                const laenge = Math.abs(x1 - a.x) + Math.abs(y1 - a.y) + Math.abs(b.x - x1) + Math.abs(b.y - y1);
                const abstand = Math.abs(x1 - mx0) + Math.abs(y1 - my0);
                liste.push({ weg: [a, { x: x1, y: a.y }, { x: x1, y: y1 }, { x: b.x, y: y1 }, b],
                    laenge, abstand, art: 0, x: x1, y: y1 });
                liste.push({ weg: [a, { x: a.x, y: y1 }, { x: x1, y: y1 }, { x: x1, y: b.y }, b],
                    laenge, abstand, art: 1, x: x1, y: y1 });
            }
        }
        liste.sort((p, q) => p.laenge - q.laenge || p.abstand - q.abstand || p.art - q.art
            || p.x - q.x || p.y - q.y);
        return liste.map(e => e.weg);
    };
    const kaesten = (plan) => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return [];
        const raus = [];
        plan.teile.forEach(t => {
            const z = Register.fachzeichen.holen(t.zeichen);
            if (!z)
                return;
            const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
            const cx = t.x + z.w / 2, cy = t.y + z.h / 2;
            raus.push({ x1: cx - m.w / 2 + 1, y1: cy - m.h / 2 + 1, x2: cx + m.w / 2 - 1, y2: cy + m.h / 2 - 1 });
        });
        return raus;
    };
    const durchZeichen = (w, ks) => {
        for (let i = 0; i + 1 < w.length; i++) {
            const a = w[i], b = w[i + 1];
            const xa = Math.min(a.x, b.x), xb = Math.max(a.x, b.x);
            const ya = Math.min(a.y, b.y), yb = Math.max(a.y, b.y);
            for (const k of ks) {
                if (a.y === b.y ? (a.y > k.y1 && a.y < k.y2 && Math.max(xa, k.x1) < Math.min(xb, k.x2))
                    : (a.x > k.x1 && a.x < k.x2 && Math.max(ya, k.y1) < Math.min(yb, k.y2)))
                    return true;
            }
        }
        return false;
    };
    const nachziehen = (plan, vorher, teile, wie = {}) => {
        if (wie.vonVorn)
            plan.leitungen.forEach(l => {
                const p = vorher.punkte.get(l.id);
                if (p)
                    l.punkte = p.map(q => ({ x: q.x, y: q.y }));
            });
        const bewegt = new Set([...teile].map(String));
        const heilen = !!wie.heilen;
        const teil = (id) => id === undefined ? undefined : plan.teile.find(t => String(t.id) === String(id));
        const auftrag = [];
        plan.leitungen.forEach(l => {
            if (wie.ohne && wie.ohne.has(l.id))
                return;
            const alt = l.punkte;
            if (alt.length < 2)
                return;
            const k = vorher.klemmen.get(l.id);
            const vonBewegt = !!l.vonTeil && bewegt.has(String(l.vonTeil));
            const nachBewegt = !!l.nachTeil && bewegt.has(String(l.nachTeil));
            const ort = (tid, nr, rueck, mit) => {
                if (!tid || !mit)
                    return rueck;
                const t = teil(tid);
                const o = t ? anschlussOrt(t, nr ?? '') : null;
                return o || rueck;
            };
            const a = ort(l.vonTeil, k?.von ?? l.vonNr, alt[0], vonBewegt || heilen);
            const b = ort(l.nachTeil, k?.nach ?? l.nachNr, alt[alt.length - 1], nachBewegt || heilen);
            const geblieben = gleicherPunkt(a, alt[0]) && gleicherPunkt(b, alt[alt.length - 1]);
            if (!vonBewegt && !nachBewegt && geblieben)
                return;
            auftrag.push({ l, a, b });
        });
        const orte = klemmorte(plan);
        const ks = kaesten(plan);
        const offen = new Set(auftrag.map(x => x.l.id));
        const breite = Number(plan.breite) || 1000, hoehe = Number(plan.hoehe) || 700;
        const bericht = [];
        auftrag.forEach(({ l, a, b }) => {
            const alt = l.punkte;
            const vor = vorher.beruehrt.get(l.id) || { klemmen: [], leitungen: [] };
            const vorK = new Set(vor.klemmen), vorL = new Set(vor.leitungen);
            const fertig = plan.leitungen.filter(m => m.id !== l.id && !offen.has(m.id));
            const wahl = { zweit: null, dritt: null };
            const passt = (w) => {
                const k = beruehrung(plan, l, w, orte, fertig);
                const kSet = new Set(k.klemmen), lSet = new Set(k.leitungen);
                const neuK = k.klemmen.filter(x => !vorK.has(x)).length;
                const wegK = vor.klemmen.filter(x => !kSet.has(x)).length;
                let neuL = 0, wegL = 0;
                fertig.forEach(m => {
                    const jetzt = lSet.has(m.id), frueher = vorL.has(m.id);
                    if (jetzt && !frueher)
                        neuL++;
                    if (!jetzt && frueher)
                        wegL++;
                });
                if (!neuK && !wegK && !neuL && !wegL)
                    return true;
                if (!neuK && !neuL && !wahl.zweit)
                    wahl.zweit = w;
                if (!wahl.dritt || neuK + neuL < wahl.dritt.neu)
                    wahl.dritt = { weg: w, neu: neuK + neuL };
                return false;
            };
            const probiert = new Set();
            const neu = (w) => {
                if (!w || w.length < 2)
                    return false;
                const s = JSON.stringify(w);
                if (probiert.has(s))
                    return false;
                probiert.add(s);
                return true;
            };
            let gewaehlt = null;
            let notfalls = null;
            const nimm = (w) => {
                if (!durchZeichen(w, ks) && !ueberlappt(w, plan.leitungen, l.id)) {
                    gewaehlt = w;
                    return true;
                }
                if (!notfalls)
                    notfalls = w;
                return false;
            };
            const unveraendert = gleicherPunkt(a, alt[0]) && gleicherPunkt(b, alt[alt.length - 1]);
            if (unveraendert && neu(alt) && passt(alt))
                gewaehlt = alt;
            const zuerst = [
                gleitend(alt, a, b), ohneDoppel(rechtwinklig(a, b)), andererWinkel(a, b)
            ];
            if (!gewaehlt)
                for (const w of zuerst)
                    if (neu(w) && passt(w) && nimm(w))
                        break;
            if (!gewaehlt && !wie.schnell)
                for (const w of zWege(a, b, breite, hoehe))
                    if (neu(w) && passt(w) && nimm(w))
                        break;
            if (!gewaehlt && !wie.schnell) {
                const erlaubt = { klemmen: vorK, leitungen: vorL };
                for (const w of hakenWege(a, b, breite, hoehe)) {
                    if (!neu(w))
                        continue;
                    const k = pruefeBeruehrung(plan, l, w, orte, fertig, erlaubt);
                    if (!k)
                        continue;
                    const fehlt = vor.klemmen.some(x => !k.klemmen.includes(x))
                        || fertig.some(m => vorL.has(m.id) && !k.leitungen.includes(m.id));
                    if (!fehlt) {
                        if (nimm(w))
                            break;
                        continue;
                    }
                    if (!wahl.zweit)
                        wahl.zweit = w;
                }
            }
            if (!gewaehlt && notfalls)
                gewaehlt = notfalls;
            let stufe = 1;
            if (!gewaehlt) {
                stufe = wahl.zweit ? 2 : 3;
                gewaehlt = wahl.zweit || (wahl.dritt ? wahl.dritt.weg : null) || alt;
            }
            l.punkte = gewaehlt.map(p => ({ x: p.x, y: p.y }));
            offen.delete(l.id);
            bericht.push({ id: l.id, stufe });
        });
        return bericht;
    };
    const streckenAufeinander = (a, b, c, d) => {
        if (a.y === b.y && c.y === d.y && a.y === c.y)
            return Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) > 0;
        if (a.x === b.x && c.x === d.x && a.x === c.x)
            return Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) > 0;
        return false;
    };
    const ueberlappt = (w, andere, ohne) => {
        for (const m of andere) {
            if (m.id === ohne)
                continue;
            for (let i = 0; i + 1 < w.length; i++)
                for (let k = 0; k + 1 < m.punkte.length; k++)
                    if (streckenAufeinander(w[i], w[i + 1], m.punkte[k], m.punkte[k + 1]))
                        return true;
        }
        return false;
    };
    const ueberlappungen = (plan) => {
        let n = 0;
        plan.leitungen.forEach((l, i) => plan.leitungen.slice(i + 1).forEach(m => {
            for (let a = 0; a + 1 < l.punkte.length; a++)
                for (let b = 0; b + 1 < m.punkte.length; b++)
                    if (streckenAufeinander(l.punkte[a], l.punkte[a + 1], m.punkte[b], m.punkte[b + 1]))
                        n++;
        }));
        return n;
    };
    const leitungFuehren = (plan, a, b, vonFang, nachFang, wie = {}) => {
        const erster = ohneDoppel(rechtwinklig(a, b));
        if (gleicherPunkt(a, b))
            return erster;
        const l = { id: '\u0000neu', punkte: [], ebene: 'plan' };
        if (vonFang) {
            l.vonTeil = vonFang.teil;
            l.vonNr = vonFang.nr;
        }
        if (nachFang) {
            l.nachTeil = nachFang.teil;
            l.nachNr = nachFang.nr;
        }
        const klemmen = new Set();
        if (vonFang)
            klemmen.add(vonFang.teil + ':' + endeGenau(plan, vonFang.teil, vonFang.nr, a).nr);
        if (nachFang)
            klemmen.add(nachFang.teil + ':' + endeGenau(plan, nachFang.teil, nachFang.nr, b).nr);
        const leitungen = new Set();
        plan.leitungen.forEach(m => {
            for (let i = 0; i + 1 < m.punkte.length; i++)
                if (nahAnStrecke(a, m.punkte[i], m.punkte[i + 1]) || nahAnStrecke(b, m.punkte[i], m.punkte[i + 1])) {
                    leitungen.add(m.id);
                    return;
                }
        });
        const orte = klemmorte(plan);
        const ks = kaesten(plan);
        const erlaubt = { klemmen, leitungen };
        const breite = Number(plan.breite) || 1000, hoehe = Number(plan.hoehe) || 700;
        let ohneFremdes = null;
        const probiert = new Set();
        const pruefe = (w) => {
            if (!w || w.length < 2)
                return false;
            const sch = JSON.stringify(w);
            if (probiert.has(sch))
                return false;
            probiert.add(sch);
            if (!pruefeBeruehrung(plan, l, w, orte, plan.leitungen, erlaubt))
                return false;
            if (ueberlappt(w, plan.leitungen))
                return false;
            if (!ohneFremdes)
                ohneFremdes = w;
            return !durchZeichen(w, ks);
        };
        for (const w of [erster, andererWinkel(a, b)])
            if (pruefe(w))
                return w;
        const zw = zWege(a, b, breite, hoehe);
        for (const w of (wie.schnell ? zw.slice(0, 40) : zw))
            if (pruefe(w))
                return w;
        if (!wie.schnell)
            for (const w of hakenWege(a, b, breite, hoehe))
                if (pruefe(w))
                    return w;
        return ohneFremdes || erster;
    };
    const vereinfachen = (ps) => {
        const q = ohneDoppel(ps);
        const raus = [];
        q.forEach((p, i) => {
            if (i === 0 || i === q.length - 1) {
                raus.push(p);
                return;
            }
            const a = raus[raus.length - 1], b = q[i + 1];
            if ((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y))
                return;
            raus.push(p);
        });
        return raus;
    };
    const streckeSchieben = (plan, vorher, lid, i, d) => {
        const l = plan.leitungen.find(x => x.id === lid);
        const alt = vorher.punkte.get(lid);
        if (!l || !alt || i < 0 || i + 1 >= alt.length)
            return null;
        const waag = alt[i].y === alt[i + 1].y;
        if (!waag && alt[i].x !== alt[i + 1].x)
            return null;
        const q = alt.map(p => ({ x: p.x, y: p.y }));
        let a = i, b = i + 1;
        if (a === 0) {
            q.unshift({ ...q[0] });
            a++;
            b++;
        }
        if (b === q.length - 1)
            q.push({ ...q[q.length - 1] });
        if (waag) {
            q[a].y += d;
            q[b].y += d;
        }
        else {
            q[a].x += d;
            q[b].x += d;
        }
        const neu = vereinfachen(q);
        if (!d)
            return alt.map(p => ({ x: p.x, y: p.y }));
        const vor = vorher.beruehrt.get(lid) || { klemmen: [], leitungen: [] };
        const andere = plan.leitungen.filter(x => x.id !== lid);
        const k = pruefeBeruehrung(plan, l, neu, klemmorte(plan), andere, { klemmen: new Set(vor.klemmen), leitungen: new Set(vor.leitungen) });
        if (!k)
            return null;
        if (vor.klemmen.some(x => !k.klemmen.includes(x)) || vor.leitungen.some(x => !k.leitungen.includes(x)))
            return null;
        return neu;
    };
    const gruppeUmformen = (plan, ids, art, T) => {
        const vorher = vorherMerken(plan);
        const F = (typeof Register !== 'undefined') ? Register.fachzeichen : null;
        const teile = plan.teile.filter(t => ids.has(t.id));
        const leitungen = plan.leitungen.filter(l => ids.has(l.id));
        const texte = plan.texte.filter(x => ids.has(x.id));
        const ink = (plan.ink || []).filter(m => ids.has(m.id));
        let abb = T;
        if (!abb) {
            const xs = [], ys = [];
            teile.forEach(t => {
                const z = F ? F.holen(t.zeichen) : null;
                const m = F ? F.masse(t.zeichen, t.drehung) : { w: 0, h: 0 };
                const cx = t.x + (z ? z.w : 0) / 2, cy = t.y + (z ? z.h : 0) / 2;
                xs.push(cx - m.w / 2, cx + m.w / 2);
                ys.push(cy - m.h / 2, cy + m.h / 2);
            });
            leitungen.forEach(l => l.punkte.forEach(p => { xs.push(p.x); ys.push(p.y); }));
            texte.forEach(x => { xs.push(x.x); ys.push(x.y); });
            ink.forEach(m => m.pts.forEach(p => { xs.push(p[0]); ys.push(p[1]); }));
            if (!xs.length)
                return { teile: [], bericht: [], vorher };
            const g = { x: rasten((Math.min(...xs) + Math.max(...xs)) / 2), y: rasten((Math.min(...ys) + Math.max(...ys)) / 2) };
            abb = art === 'drehen'
                ? (p) => ({ x: g.x - (p.y - g.y), y: g.y + (p.x - g.x) })
                : (p) => ({ x: 2 * g.x - p.x, y: p.y });
        }
        teile.forEach(t => {
            const z = F ? F.holen(t.zeichen) : null;
            const w = z ? z.w : 0, h = z ? z.h : 0;
            const c = abb({ x: t.x + w / 2, y: t.y + h / 2 });
            const d = ((Number(t.drehung) || 0) % 360 + 360) % 360;
            if (art === 'drehen')
                t.drehung = (d + 90) % 360;
            else {
                t.drehung = (360 - d) % 360;
                t.gespiegelt = !t.gespiegelt;
            }
            t.x = rasten(c.x - w / 2);
            t.y = rasten(c.y - h / 2);
        });
        leitungen.forEach(l => { l.punkte = l.punkte.map(p => { const q = abb(p); return { x: rasten(q.x), y: rasten(q.y) }; }); });
        texte.forEach(x => { const q = abb(x); x.x = rasten(q.x); x.y = rasten(q.y); });
        ink.forEach(m => { m.pts = m.pts.map(p => { const q = abb({ x: p[0], y: p[1] }); return [+q.x.toFixed(2), +q.y.toFixed(2)]; }); });
        const ids2 = teile.map(t => t.id);
        const bericht = ids2.length ? nachziehen(plan, vorher, ids2, { heilen: true }) : [];
        return { teile: ids2, bericht, vorher };
    };
    const planDrehen = (plan) => {
        const H = Number(plan.hoehe) || 700, W = Number(plan.breite) || 800;
        const alle = new Set([...plan.teile.map(t => t.id), ...plan.leitungen.map(l => l.id), ...plan.texte.map(x => x.id), ...(plan.ink || []).map(m => m.id)]);
        const r = gruppeUmformen(plan, alle, 'drehen', p => ({ x: H - p.y, y: p.x }));
        plan.breite = H;
        plan.hoehe = W;
        return { bericht: r.bericht, vorher: r.vorher };
    };
    const aufStrecke = (p, a, b) => {
        if (a.x === b.x)
            return p.x === a.x && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y);
        if (a.y === b.y)
            return p.y === a.y && p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x);
        return false;
    };
    const verbindungspunkte = (plan) => {
        const raus = [];
        const schon = new Set();
        const merke = (p) => {
            const k = p.x + ':' + p.y;
            if (!schon.has(k)) {
                schon.add(k);
                raus.push(p);
            }
        };
        plan.leitungen.forEach(l => {
            l.punkte.forEach((p, i) => {
                const istEnde = i === 0 || i === l.punkte.length - 1;
                const istKnick = !istEnde;
                if (!istEnde && !istKnick)
                    return;
                plan.leitungen.forEach(andere => {
                    if (andere.id === l.id)
                        return;
                    for (let k = 0; k + 1 < andere.punkte.length; k++) {
                        if (aufStrecke(p, andere.punkte[k], andere.punkte[k + 1])) {
                            merke(p);
                            return;
                        }
                    }
                });
            });
        });
        const zaehler = new Map();
        plan.leitungen.forEach(l => [l.punkte[0], l.punkte[l.punkte.length - 1]].forEach(p => {
            if (!p)
                return;
            const k = p.x + ':' + p.y;
            zaehler.set(k, (zaehler.get(k) || 0) + 1);
        }));
        zaehler.forEach((n, k) => {
            if (n < 3)
                return;
            const [x, y] = k.split(':').map(Number);
            merke({ x: x, y: y });
        });
        return raus;
    };
    const kreuzungen = (plan) => {
        const punkte = new Set(verbindungspunkte(plan).map(p => p.x + ':' + p.y));
        const raus = [];
        const strecken = [];
        plan.leitungen.forEach(l => {
            for (let i = 0; i + 1 < l.punkte.length; i++)
                strecken.push({ a: l.punkte[i], b: l.punkte[i + 1], id: l.id });
        });
        strecken.forEach(s1 => {
            if (s1.a.y !== s1.b.y)
                return;
            strecken.forEach(s2 => {
                if (s2.id === s1.id || s2.a.x !== s2.b.x)
                    return;
                const x = s2.a.x, y = s1.a.y;
                const imX = x > Math.min(s1.a.x, s1.b.x) && x < Math.max(s1.a.x, s1.b.x);
                const imY = y > Math.min(s2.a.y, s2.b.y) && y < Math.max(s2.a.y, s2.b.y);
                if (imX && imY && !punkte.has(x + ':' + y))
                    raus.push({ x, y });
            });
        });
        return raus;
    };
    const leitungPfad = (l, luecken) => {
        const teile = [];
        for (let i = 0; i + 1 < l.punkte.length; i++) {
            const a = l.punkte[i], b = l.punkte[i + 1];
            if (a.y !== b.y) {
                teile.push(`M${a.x},${a.y} L${b.x},${b.y}`);
                continue;
            }
            const drin = luecken.filter(p => p.y === a.y &&
                p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x))
                .map(p => p.x).sort((x, y) => (a.x < b.x ? x - y : y - x));
            let von = a.x;
            const schritt = a.x < b.x ? 1 : -1;
            drin.forEach(x => {
                teile.push(`M${von},${a.y} L${x - 5 * schritt},${a.y}`);
                von = x + 5 * schritt;
            });
            teile.push(`M${von},${a.y} L${b.x},${b.y}`);
        }
        return teile.join(' ');
    };
    const UNBEKANNT_MASS = { w: 40, h: 40 };
    const unbekanntesZeichen = (zeichen, farbe) => {
        const name = zeichen.length > 14 ? zeichen.slice(0, 13) + '…' : zeichen;
        return `<title>Unbekanntes Bauteil „${esc(zeichen)}" — diese Redion-Fassung kennt das Zeichen nicht. ` +
            `Das Teil bleibt mit allen Angaben im Plan erhalten.</title>` +
            `<rect class="sp-unbekannt-kasten" x="0" y="0" width="${UNBEKANNT_MASS.w}" height="${UNBEKANNT_MASS.h}" ` +
            `rx="6" stroke-dasharray="4 3" stroke-width="1.5"/>` +
            `<text x="${UNBEKANNT_MASS.w / 2}" y="27" text-anchor="middle" font-size="20" font-weight="700" ` +
            `fill="${farbe}" stroke="none">?</text>` +
            `<text class="sp-unbekannt-name" x="${UNBEKANNT_MASS.w / 2}" y="${UNBEKANNT_MASS.h + 12}" text-anchor="middle" ` +
            `font-size="9" fill="${farbe}" stroke="none" opacity=".75">${esc(name)}</text>`;
    };
    const teilMasse = (t) => (typeof Register !== 'undefined' && Register.fachzeichen && Register.fachzeichen.holen(t.zeichen))
        ? Register.fachzeichen.masse(t.zeichen, t.drehung) : { ...UNBEKANNT_MASS };
    const teilRahmen = (t, dx = 0, dy = 0) => {
        const m = teilMasse(t), zc = Register?.fachzeichen.holen(t.zeichen);
        const cx = Number(t.x) + dx + (zc ? zc.w : UNBEKANNT_MASS.w) / 2;
        const cy = Number(t.y) + dy + (zc ? zc.h : UNBEKANNT_MASS.h) / 2;
        return { l: cx - m.w / 2, o: cy - m.h / 2, r: cx + m.w / 2, u: cy + m.h / 2 };
    };
    const inkBounds = (mark) => {
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const p of mark.pts) {
            x1 = Math.min(x1, p[0]);
            y1 = Math.min(y1, p[1]);
            x2 = Math.max(x2, p[0]);
            y2 = Math.max(y2, p[1]);
        }
        const r = mark.breite * (mark.kontur === 'weich' ? .75 : .5);
        return { x1: x1 - r, y1: y1 - r, x2: x2 + r, y2: y2 + r };
    };
    const inkSvg = (mark, selected = false) => {
        const halves = mark.pts.map((_p, i) => InkStroke.inkHalfWidth(mark, mark.pressure?.[i]));
        const p = mark.pts[0];
        if (!p)
            return '';
        const weich = InkStroke.weichUmriss(mark);
        const shape = mark.pts.length === 1
            ? `<circle cx="${p[0]}" cy="${p[1]}" r="${halves[0]}"/>`
            : `<path d="${InkGeometry.vieleckPfad([weich]) || InkGeometry.outline(mark.pts, halves)}"/>`;
        const b = selected ? inkBounds(mark) : null;
        return `<g class="sp-ink" data-id="${esc(mark.id)}" data-ink="${esc(mark.id)}" fill="${InkStroke.inkColor(mark.farbe)}">` + shape +
            (b ? `<rect class="sp-ink-auswahl" x="${b.x1 - 3}" y="${b.y1 - 3}" width="${b.x2 - b.x1 + 6}" height="${b.y2 - b.y1 + 6}" fill="none" stroke="currentColor" stroke-dasharray="4 3"/>` : '') + '</g>';
    };
    const alsSvg = (plan, opt = {}) => {
        const sichtbar = (ebene) => {
            if (opt.nurEbenen)
                return opt.nurEbenen.includes(ebene);
            const e = plan.ebenen.find(x => x.id === ebene);
            return !e || e.sichtbar;
        };
        const farbeVon = (ebene) => (plan.ebenen.find(x => x.id === ebene) || { farbe: 'var(--text)' }).farbe;
        const teile = [];
        if (opt.raster !== false) {
            teile.push(`<defs><pattern id="sp-raster" width="${R()}" height="${R()}" patternUnits="userSpaceOnUse">` +
                `<circle cx="0.5" cy="0.5" r="0.7" fill="currentColor" opacity=".22"/></pattern></defs>` +
                `<rect width="${plan.breite}" height="${plan.hoehe}" fill="url(#sp-raster)"/>`);
        }
        if (opt.strom)
            teile.push(`<defs><radialGradient id="sp-schein">` +
                `<stop offset="0%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".85"/>` +
                `<stop offset="60%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".25"/>` +
                `<stop offset="100%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity="0"/>` +
                `</radialGradient></defs>`);
        const luecken = kreuzungen(plan);
        const tempo = (strom, max) => {
            if (!(strom > 0) || !(max > 0))
                return 0;
            const anteil = Math.log10(1 + strom * 1000) / Math.log10(1 + max * 1000);
            return 1.6 - 1.25 * Math.max(0, Math.min(1, anteil));
        };
        plan.leitungen.forEach(l => {
            if (!sichtbar(l.ebene))
                return;
            const d = leitungPfad(l, luecken);
            if (!d)
                return;
            const gewaehlt = opt.auswahl && opt.auswahl.has(l.id);
            teile.push(`<path class="sp-leitung${l.schiene ? ' sp-schiene' : ''}${gewaehlt ? ' sp-gewaehlt' : ''}" data-id="${esc(l.id)}" ` +
                `d="${d}" fill="none" stroke="${farbeVon(l.ebene)}" stroke-width="${l.schiene ? 3.5 : 2}" ` +
                `stroke-linecap="round"/>`);
            if (!opt.strom)
                return;
            const netz = opt.strom.leitungNetz[l.id];
            if (typeof netz !== 'number')
                return;
            const i = opt.strom.netzStrom[netz] || 0;
            if (!(i > 1e-9))
                return;
            const s = tempo(i, opt.strom.maxStrom);
            teile.push(`<path class="sp-fluss" data-id="${esc(l.id)}" d="${d}" fill="none" ` +
                `stroke-width="3" stroke-linecap="butt" ` +
                `style="animation-duration:${s.toFixed(2)}s"><title>${zeigeZahl(i, 'A')}</title></path>`);
        });
        verbindungspunkte(plan).forEach(p => teile.push(`<circle class="sp-knoten" cx="${p.x}" cy="${p.y}" r="4" fill="currentColor"/>`));
        if (opt.tippbar) {
            const gesetzt = [];
            plan.leitungen.forEach(l => {
                if (!sichtbar(l.ebene))
                    return;
                const pkte = l.punkte || [];
                if (pkte.length < 2)
                    return;
                let best = 0, laenge = -1;
                for (let i = 0; i + 1 < pkte.length; i++) {
                    const a = pkte[i], b = pkte[i + 1];
                    const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
                    if (d2 > laenge) {
                        laenge = d2;
                        best = i;
                    }
                }
                const a = pkte[best], b = pkte[best + 1];
                let wahlX = (a.x + b.x) / 2, wahlY = (a.y + b.y) / 2, weiteste = -1;
                for (let k = 0; k <= 10; k++) {
                    const t = 0.12 + k * 0.076;
                    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
                    let naechster = Infinity;
                    gesetzt.forEach(g => {
                        const d = Math.hypot(g.x - x, g.y - y);
                        if (d < naechster)
                            naechster = d;
                    });
                    if (naechster > weiteste) {
                        weiteste = naechster;
                        wahlX = x;
                        wahlY = y;
                    }
                }
                gesetzt.push({ x: wahlX, y: wahlY });
                const gewaehlt = opt.auswahl && opt.auswahl.has(l.id);
                teile.push(`<circle class="sp-griff${gewaehlt ? ' sp-gewaehlt' : ''}" ` +
                    `data-id="${esc(l.id)}" cx="${Math.round(wahlX)}" cy="${Math.round(wahlY)}" ` +
                    `r="9"><title>Leitung antippen</title></circle>`);
            });
        }
        plan.teile.forEach(t => {
            if (!sichtbar(t.ebene))
                return;
            const farbe = farbeVon(t.ebene);
            const mitStellung = !!opt.stellungen && typeof Register !== 'undefined' && Register.fachzeichen
                && typeof Register.fachzeichen.hatStellungsbild === 'function'
                && Register.fachzeichen.hatStellungsbild(t.zeichen);
            const stellungNr = mitStellung ? Number(opt.stellungen[t.id]) || 0 : 0;
            const svg = (typeof Register !== 'undefined' && Register.fachzeichen)
                ? Register.fachzeichen.alsSvg(t.zeichen, mitStellung
                    ? { farbe, drehung: t.drehung, gespiegelt: t.gespiegelt, stellung: stellungNr }
                    : { farbe, drehung: t.drehung, gespiegelt: t.gespiegelt })
                : '';
            const unbekannt = !svg;
            const innen = unbekannt ? unbekanntesZeichen(t.zeichen, farbe)
                : svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
            const gewaehlt = opt.auswahl && opt.auswahl.has(t.id);
            const mass = unbekannt || !Register ? { ...UNBEKANNT_MASS } : Register.fachzeichen.masse(t.zeichen, 0);
            const w = opt.strom ? opt.strom.werte[t.id] : undefined;
            const vh = (typeof Stromfluss !== 'undefined' && Stromfluss.verhalten)
                ? Stromfluss.verhalten(t.zeichen) : null;
            let schein = '';
            if (w && typeof w.helligkeit === 'number' && w.helligkeit > 0.01) {
                const h = Math.min(1, w.helligkeit);
                schein = `<circle class="sp-leuchtet" cx="${mass.w / 2}" cy="${mass.h / 2}" ` +
                    `r="${Math.max(mass.w, mass.h) * 0.75}" fill="url(#sp-schein)" ` +
                    `stroke="none" opacity="${(0.25 + 0.65 * h).toFixed(2)}"/>`;
            }
            let anzeige = '';
            if (w && opt.messwerte !== false && opt.strom) {
                const art = vh ? vh.art : '';
                const glieder = opt.strom.teilwerte?.[t.id];
                let stark = w;
                let summeP = 0;
                if (glieder) {
                    Object.keys(glieder).forEach(k => {
                        const g = glieder[k];
                        summeP += g.P;
                        if (g.P > stark.P)
                            stark = g;
                    });
                }
                if (art === 'uebertrager')
                    summeP = Math.max(w.P, stark.P);
                const zeilen = art === 'volt' ? [zeigeZahl(Math.abs(w.U), 'V')]
                    : art === 'ampere' ? [zeigeZahl(Math.abs(w.I), 'A')]
                        : art === 'quelle' ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A')]
                            : (art === 'widerstand' || art === 'spule')
                                ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A'),
                                    zeigeZahl(w.P, 'W')]
                                : (art === 'mehrteilig' || art === 'uebertrager')
                                    ? [zeigeZahl(Math.abs(stark.U), 'V'), zeigeZahl(Math.abs(stark.I), 'A'),
                                        zeigeZahl(summeP, 'W')]
                                    : [];
                anzeige = zeilen.map((s, i) => `<text class="sp-messwert" x="${mass.w / 2}" y="${mass.h + 14 + i * 12}" ` +
                    `text-anchor="middle" font-size="10" stroke="none">${esc(s)}</text>`).join('');
            }
            let pfeil = '';
            if (w && w.fliesst && w.richtung && w.richtung !== 'keine'
                && w.vonKlemme && w.nachKlemme) {
                const kl = anschluesseVon(t);
                const va = kl.find(k => k.nr === w.vonKlemme);
                const nb = kl.find(k => k.nr === w.nachKlemme);
                if (va && nb) {
                    const ax = va.x - t.x, ay = va.y - t.y;
                    const bx = nb.x - t.x, by = nb.y - t.y;
                    const rueck = w.richtung === 'rueck';
                    const dx = rueck ? ax - bx : bx - ax;
                    const dy = rueck ? ay - by : by - ay;
                    const laenge = Math.hypot(dx, dy);
                    if (laenge > 1) {
                        const ux = dx / laenge, uy = dy / laenge;
                        const weg = Math.abs(uy) * mass.w / 2 + Math.abs(ux) * mass.h / 2 + 12;
                        const mx = (ax + bx) / 2 + uy * weg;
                        const my = (ay + by) / 2 - ux * weg;
                        const grad = Math.atan2(dy, dx) * 180 / Math.PI;
                        const d = w.richtung === 'wechselnd'
                            ? 'M-13,0 H13 M13,0 L6,-5 M13,0 L6,5 M-13,0 L-6,-5 M-13,0 L-6,5'
                            : 'M-12,0 H7 M7,0 L0,-5 M7,0 L0,5';
                        pfeil = `<g class="sp-richtung" transform="translate(${mx.toFixed(1)} ` +
                            `${my.toFixed(1)}) rotate(${grad.toFixed(1)})">` +
                            `<path d="${d}" fill="none"/>` +
                            (w.richtungstext ? `<title>${esc(w.richtungstext)}</title>` : '') +
                            `</g>`;
                    }
                }
            }
            let stellungText = '';
            const stellungName = mitStellung && opt.stellungsnamen ? opt.stellungsnamen[t.id] || '' : '';
            if (stellungName)
                stellungText = `<text class="sp-stellung" x="${mass.w / 2}" y="${mass.h + 14}" ` +
                    `text-anchor="middle" font-size="10" stroke="none" fill="${farbe}">${esc(stellungName)}</text>`;
            teile.push(`<g class="sp-teil${unbekannt ? ' sp-unbekannt' : ''}${gewaehlt ? ' sp-gewaehlt' : ''}` +
                `${mitStellung ? ' sp-stellbar' : ''}${opt.umgelegt && opt.umgelegt.has(t.id) ? ' sp-umgelegt' : ''}` +
                `${w && w.fliesst ? ' sp-fuehrt' : ''}` +
                `${opt.hervor === t.id ? ' sp-gesucht' : ''}" data-id="${esc(t.id)}" ` +
                (mitStellung ? `data-stellung="${stellungNr}" ` : '') +
                `transform="translate(${t.x} ${t.y})" fill="none" stroke="${farbe}" ` +
                `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
                `<rect x="-4" y="-4" width="${mass.w + 8}" height="${mass.h + 8}" ` +
                `fill="transparent" stroke="none"/>` + schein + innen + anzeige + stellungText + pfeil +
                (opt.anschluesse ? anschluesseVon(t).map(a => `<circle class="sp-punkt" data-teil="${esc(t.id)}" data-nr="${esc(a.nr)}" ` +
                    `cx="${a.x - t.x}" cy="${a.y - t.y}" r="4" fill="${farbe}" stroke="none" opacity=".5"/>`).join('') : '') +
                (opt.nummern ? anschluesseVon(t).map(a => `<text x="${a.x - t.x + 6}" y="${a.y - t.y - 4}" font-size="9" fill="${farbe}" ` +
                    `stroke="none" opacity=".8">${esc(a.anzeige)}</text>`).join('') : '') +
                (opt.bmk !== false && t.bmk
                    ? `<text x="${mass.w + 6}" y="12" font-size="12" fill="${farbe}" stroke="none" ` +
                        `font-weight="600">${esc(t.bmk)}</text>` : '') +
                (t.beschriftung
                    ? `<text class="sp-teil-beschriftung" x="${mass.w + 6}" y="27" font-size="11" ` +
                        `fill="${farbe}" stroke="none" opacity=".84">${esc(t.beschriftung.length > 38 ? t.beschriftung.slice(0, 37) + '…' : t.beschriftung)}` +
                        `<title>${esc(t.beschriftung)}</title></text>` : '') +
                `</g>`);
        });
        plan.texte.forEach(x => {
            if (!sichtbar(x.ebene))
                return;
            const gewaehlt = !!(opt.auswahl && opt.auswahl.has(x.id));
            teile.push(`<text class="sp-text${gewaehlt ? ' sp-gewaehlt' : ''}" data-id="${esc(x.id)}" x="${x.x}" y="${x.y}" ` +
                `font-size="13" fill="${farbeVon(x.ebene)}" stroke="none">${tief(x.t)}</text>`);
        });
        for (const mark of plan.ink || [])
            if (sichtbar(mark.ebene))
                teile.push(inkSvg(mark, opt.auswahl?.has(mark.id)));
        return `<svg class="sp-flaeche" viewBox="0 0 ${plan.breite} ${plan.hoehe}" ` +
            `width="${plan.breite}" height="${plan.hoehe}">` + teile.join('') + '</svg>';
    };
    const schienenBauen = (plan) => {
        const a = artVon(plan.art);
        if (!a.schienen || a.schienen === 'keine')
            return;
        const rand = 40;
        const mach = (y, beschriftung) => {
            plan.leitungen.push({
                id: uid(), ebene: 'plan',
                punkte: [{ x: rand, y }, { x: plan.breite - rand, y }]
            });
            plan.texte.push({ id: uid(), x: rand - 26, y: y + 4, t: beschriftung, ebene: 'plan' });
        };
        if (a.schienen === 'steuer') {
            mach(40, 'L1');
            mach(plan.hoehe - 40, 'N');
        }
        else {
            mach(40, 'L1');
            mach(60, 'L2');
            mach(80, 'L3');
            mach(plan.hoehe - 40, 'PE');
        }
    };
    const netzBauen = (plan, ebene = 'plan', volt) => {
        const oben = rasten(40);
        const unten = rasten(plan.hoehe - 40);
        const gy = rasten((oben + unten) / 2 - 30);
        const rechts = rasten(plan.breite - 20);
        const quelle = {
            id: uid(), zeichen: 'wechselspannung', x: 20, y: gy,
            drehung: 0, gespiegelt: false,
            bmk: naechstesBmk(plan, 'wechselspannung'),
            nummern: {}, gruppe: '', ebene
        };
        if (typeof volt === 'number')
            quelle.werte = { U: volt };
        plan.teile.push(quelle);
        const kx = quelle.x + 30;
        plan.leitungen.push({ id: uid(), ebene, vonTeil: quelle.id, vonNr: 'L',
            punkte: [{ x: kx, y: gy }, { x: kx, y: oben }, { x: rechts, y: oben }] }, { id: uid(), ebene, vonTeil: quelle.id, vonNr: 'N',
            punkte: [{ x: kx, y: gy + 60 }, { x: kx, y: unten }, { x: rechts, y: unten }] });
        plan.texte.push({ id: uid(), x: kx + 14, y: oben - 8, t: 'L1', ebene }, { id: uid(), x: kx + 14, y: unten - 8, t: 'N', ebene });
        return { oben, unten, quelle };
    };
    const BEISPIELE = [
        { id: 'ausschaltung', name: 'Ausschaltung — eine Lampe, ein Schalter',
            hinweis: 'Strom drücken, dann auf S1 tippen: E1 leuchtet.' },
        { id: 'wechselschaltung', name: 'Wechselschaltung — Treppenhaus',
            hinweis: 'Strom drücken — JEDER der beiden Schalter schaltet die Lampe.' },
        { id: 'tuerklingel', name: 'Türklingel — Taster und Klingel (12 V)',
            hinweis: 'Strom drücken, S1 gedrückt halten: die Klingel bekommt 12 V.' }
    ];
    const beispielBauen = (plan, id, ebene = 'plan') => {
        const teil = (zeichen, x, y, drehung = 0) => {
            const t = { id: uid(), zeichen, x: rasten(x), y: rasten(y), drehung,
                gespiegelt: false, bmk: naechstesBmk(plan, zeichen),
                nummern: {}, gruppe: '', ebene };
            plan.teile.push(t);
            return t;
        };
        const draht = (punkte, von, vonNr, nach, nachNr) => {
            const l = { id: uid(), ebene, punkte: punkte.map(p => ({ x: rasten(p.x), y: rasten(p.y) })) };
            if (von) {
                l.vonTeil = von.id;
                l.vonNr = vonNr;
            }
            if (nach) {
                l.nachTeil = nach.id;
                l.nachNr = nachNr;
            }
            plan.leitungen.push(l);
        };
        if (id === 'ausschaltung') {
            const n = netzBauen(plan, ebene);
            const s = teil('ch-schema0', 380, 140);
            const h = teil('lampe', 370, 320);
            draht([{ x: 400, y: n.oben }, { x: 400, y: 140 }], undefined, undefined, s, '3');
            draht([{ x: 400, y: 200 }, { x: 400, y: 320 }], s, '4', h, 'X1');
            draht([{ x: 400, y: 380 }, { x: 400, y: n.unten }], h, 'X2');
            return true;
        }
        if (id === 'wechselschaltung') {
            const n = netzBauen(plan, ebene);
            const s1 = teil('ch-schema3', 350, 120, 180);
            const s2 = teil('ch-schema3', 350, 300);
            const h = teil('lampe', 350, 440);
            draht([{ x: 380, y: n.oben }, { x: 380, y: 120 }], undefined, undefined, s1, '3');
            draht([{ x: 400, y: 180 }, { x: 400, y: 300 }], s1, '1', s2, '2');
            draht([{ x: 360, y: 180 }, { x: 360, y: 300 }], s1, '2', s2, '1');
            draht([{ x: 380, y: 360 }, { x: 380, y: 440 }], s2, '3', h, 'X1');
            draht([{ x: 380, y: 500 }, { x: 380, y: n.unten }], h, 'X2');
            return true;
        }
        if (id === 'tuerklingel') {
            const n = netzBauen(plan, ebene, 12);
            const s = teil('taster-schliesser', 380, 140);
            const p = teil('klingel', 370, 320);
            draht([{ x: 400, y: n.oben }, { x: 400, y: 140 }], undefined, undefined, s, '3');
            draht([{ x: 400, y: 200 }, { x: 400, y: 320 }], s, '4', p, 'X1');
            draht([{ x: 400, y: 380 }, { x: 400, y: n.unten }], p, 'X2');
            return true;
        }
        return false;
    };
    return {
        ARTEN, artVon, EBENEN_VORGABE, neuerPlan, lesen, alsSvg, inkSvg, inkBounds, teilMasse, teilRahmen, rasten,
        naechstesBmk, anschlussOrt, anschluesseVon, klemmeFuer, fangeAnschluss, rechtwinklig,
        kontakte, vorherMerken, nachziehen, veraendert, verbindungspunkte, kreuzungen, leitungPfad, schienenBauen,
        netzBauen, BEISPIELE, beispielBauen, uid, esc,
        SCHIENEN, leitungFuehren, ueberlappt, ueberlappungen, streckeSchieben, gruppeUmformen, planDrehen
    };
})(typeof window === 'undefined'
    ? { fachzeichen: require('../../../register/fachzeichen.js') }
    : typeof Register === 'undefined' ? undefined : Register);
if (typeof window === 'undefined')
    module.exports = Schaltplan;
else
    window.Schaltplan = Schaltplan;
