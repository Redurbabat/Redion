"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/simulation.ts (npm run bauen:ts). */
const Stromfluss = (() => {
    const AUF_ZU = (a, b) => [
        { name: 'offen', zu: [] },
        { name: 'geschlossen', zu: [[a, b]] }
    ];
    const ZU_AUF = (a, b) => [
        { name: 'geschlossen', zu: [[a, b]] },
        { name: 'offen', zu: [] }
    ];
    const VERHALTEN = {
        batterie: { art: 'quelle', von: '+', nach: '−', wert: 12, einheit: 'V' },
        gleichspannung: { art: 'quelle', von: '+', nach: '−', wert: 24, einheit: 'V' },
        wechselspannung: { art: 'quelle', von: 'L', nach: 'N', wert: 230, einheit: 'V',
            annahme: 'Wechselspannung wird als Gleichspannung gleichen Effektivwerts gerechnet. Für ohmsche Lasten stimmt das Ergebnis.' },
        generator: { art: 'quelle', von: '1', nach: '2', wert: 230, einheit: 'V' },
        erde: { art: 'bezug', von: 'E' },
        masse: { art: 'bezug', von: 'M' },
        schutzleiter: { art: 'bezug', von: 'PE' },
        ausschalter: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        'taster-schliesser': { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        'taster-oeffner': { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        notaus: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        endschalter: { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        hauptschalter: { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] }
            ] },
        wechselschalter: { art: 'schalter', stellungen: [
                { name: 'L–1', zu: [['L', '1']] },
                { name: 'L–2', zu: [['L', '2']] }
            ] },
        serienschalter: { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'L–1', zu: [['L', '1']] },
                { name: 'L–2', zu: [['L', '2']] },
                { name: 'beide', zu: [['L', '1'], ['L', '2']] }
            ] },
        kreuzschalter: { art: 'schalter', stellungen: [
                { name: 'gerade', zu: [['1', '2'], ['3', '4']] },
                { name: 'gekreuzt', zu: [['1', '4'], ['3', '2']] }
            ] },
        'ch-schema0': { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        'ch-schema1': { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'nur 4', zu: [['3', '4']] },
                { name: 'nur 5', zu: [['3', '5']] },
                { name: 'beide', zu: [['3', '4'], ['3', '5']] }
            ] },
        'ch-schema2': { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'Gruppe 1', zu: [['3', '4']] },
                { name: 'Gruppe 1+2', zu: [['3', '4'], ['3', '5']] },
                { name: 'Gruppe 2', zu: [['3', '5']] }
            ] },
        'ch-schema3': { art: 'schalter', stellungen: [
                { name: '3–1', zu: [['3', '1']] },
                { name: '3–2', zu: [['3', '2']] }
            ] },
        'ch-schema6': { art: 'schalter', stellungen: [
                { name: 'gerade', zu: [['1', '2'], ['3', '4']] },
                { name: 'gekreuzt', zu: [['1', '4'], ['3', '2']] }
            ] },
        schliesser: { art: 'schalter', stellungen: AUF_ZU('3', '4'), folgtSpule: 'schliesser' },
        oeffner: { art: 'schalter', stellungen: ZU_AUF('1', '2'), folgtSpule: 'oeffner' },
        'schuetz-schliesser': { art: 'schalter', stellungen: AUF_ZU('13', '14'), folgtSpule: 'schliesser' },
        'schuetz-oeffner': { art: 'schalter', stellungen: ZU_AUF('21', '22'), folgtSpule: 'oeffner' },
        'schuetz-hauptkontakt': { art: 'schalter', stellungen: AUF_ZU('1', '2'), folgtSpule: 'schliesser' },
        spule: { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω' },
        'spule-anzugsverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: 'Die Verzögerung wird nicht gerechnet — die Simulation kennt keine Zeit. Der Kontakt folgt sofort.' },
        'spule-abfallverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: 'Die Verzögerung wird nicht gerechnet — die Simulation kennt keine Zeit. Der Kontakt folgt sofort.' },
        lampe: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 529, einheit: 'Ω',
            annahme: 'Eine 100-W-Lampe an 230 V. Der Kaltwiderstand einer Glühlampe ist deutlich kleiner; hier wird der Betriebswert gerechnet.' },
        signalleuchte: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 23000, einheit: 'Ω' },
        hupe: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        klingel: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        'ch-kontrolllampe': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 23000, einheit: 'Ω' },
        'ch-orientierungslampe': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 46000, einheit: 'Ω' },
        'bp-leuchte': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 529, einheit: 'Ω' },
        'bp-sonnerie': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        widerstand: { art: 'widerstand', von: '1', nach: '2', wert: 100, einheit: 'Ω' },
        potentiometer: { art: 'widerstand', von: '1', nach: '2', wert: 1000, einheit: 'Ω',
            annahme: 'Der Schleifer wird nicht mitgerechnet — nur der Widerstand zwischen 1 und 2.' },
        'motor-wechselstrom': { art: 'widerstand', von: 'U1', nach: 'U2', wert: 66, einheit: 'Ω',
            annahme: 'Der Motor wird als reiner Wirkwiderstand gerechnet. Anlaufstrom und Blindanteil fehlen.' },
        'motor-gleichstrom': { art: 'widerstand', von: 'A1', nach: 'A2', wert: 20, einheit: 'Ω',
            annahme: 'Ohne Gegenspannung gerechnet — der Wert gilt für den Stillstand, nicht für den Lauf.' },
        'spule-induktivitaet': { art: 'leiter', von: '1', nach: '2',
            annahme: 'Bei Gleichstrom ist eine Spule eine Verbindung. Ihre Wirkung zeigt sich erst im Wechselstrom.' },
        sicherung: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        leitungsschutzschalter: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        klemme: { art: 'leiter', von: '1', nach: '2' },
        steckverbindung: { art: 'leiter', von: '1', nach: '2' },
        'leiter-l1': { art: 'leiter', von: 'L1', nach: 'L1' },
        'leiter-n': { art: 'leiter', von: 'N', nach: 'N' },
        'leiter-pe': { art: 'leiter', von: 'PE', nach: 'PE' },
        'bp-minuterie': { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        kondensator: { art: 'offen', von: '1', nach: '2',
            annahme: 'Bei Gleichstrom sperrt ein geladener Kondensator. Der Ladevorgang wird nicht gerechnet.' },
        elko: { art: 'offen', von: '+', nach: '−',
            annahme: 'Bei Gleichstrom sperrt ein geladener Kondensator. Der Ladevorgang wird nicht gerechnet.' },
        diode: { art: 'diode', von: 'A', nach: 'K', wert: 0.7, einheit: 'V',
            annahme: 'Ideale Diode mit 0,7 V Durchlassspannung. Sperrstrom und Kennlinie fehlen.' },
        led: { art: 'diode', von: 'A', nach: 'K', wert: 2, einheit: 'V',
            annahme: 'Ideale Diode mit 2 V Durchlassspannung.' },
        zenerdiode: { art: 'diode', von: 'A', nach: 'K', wert: 0.7, einheit: 'V',
            annahme: 'Nur die Durchlassrichtung wird gerechnet — die Z-Wirkung in Sperrrichtung fehlt.' },
        voltmeter: { art: 'volt', von: '+', nach: '−',
            annahme: 'Innenwiderstand 10 MΩ, wie ein gutes Digitalmessgerät.' },
        amperemeter: { art: 'ampere', von: '+', nach: '−',
            annahme: 'Innenwiderstand 0 Ω. Ein echtes Messgerät hat einen kleinen Shunt.' },
        wattmeter: { art: 'ampere', von: '1', nach: '2' },
        zaehler: { art: 'ampere', von: '1', nach: '2' },
        ohmmeter: { art: 'volt', von: '1', nach: '2',
            annahme: 'Ein Ohmmeter misst nur im spannungsfreien Kreis. Hier wird es als hochohmig gerechnet.' },
        naeherungsschalter: { art: 'schalter', stellungen: AUF_ZU('1', '4') },
        temperaturfuehler: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        drucksensor: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        lichtschranke: { art: 'schalter', stellungen: ZU_AUF('1', '4') },
        bewegungsmelder: { art: 'schalter', stellungen: AUF_ZU('L', 'L′') },
        'bp-daemmerung': { art: 'schalter', stellungen: AUF_ZU('L', 'L′') }
    };
    const verhalten = (zeichenId) => VERHALTEN[zeichenId] || null;
    const stellungenVon = (zeichenId) => {
        const v = VERHALTEN[zeichenId];
        return (v && v.stellungen) ? v.stellungen : [];
    };
    const verband = () => {
        const vater = new Map();
        const finde = (a) => {
            if (!vater.has(a)) {
                vater.set(a, a);
                return a;
            }
            let w = a;
            while (vater.get(w) !== w)
                w = vater.get(w);
            let z = a;
            while (vater.get(z) !== w) {
                const n = vater.get(z);
                vater.set(z, w);
                z = n;
            }
            return w;
        };
        const eins = (a, b) => {
            const wa = finde(a), wb = finde(b);
            if (wa !== wb)
                vater.set(wa, wb);
        };
        return { finde, eins, alle: () => Array.from(vater.keys()) };
    };
    const NAH = 6;
    const nahBei = (ax, ay, bx, by) => Math.abs(ax - bx) <= NAH && Math.abs(ay - by) <= NAH;
    const aufStrecke = (px, py, ax, ay, bx, by) => {
        if (Math.abs(ay - by) <= 1 && Math.abs(py - ay) <= NAH)
            return px >= Math.min(ax, bx) - NAH && px <= Math.max(ax, bx) + NAH;
        if (Math.abs(ax - bx) <= 1 && Math.abs(px - ax) <= NAH)
            return py >= Math.min(ay, by) - NAH && py <= Math.max(ay, by) + NAH;
        return false;
    };
    const klemmen = (plan) => {
        const raus = [];
        (plan.teile || []).forEach((t) => {
            const liste = (typeof Schaltplan !== 'undefined')
                ? Schaltplan.anschluesseVon(t) : [];
            liste.forEach((a) => raus.push({
                teil: t.id, nr: a.nr, x: a.x, y: a.y, schluessel: `k:${t.id}:${a.nr}`
            }));
        });
        return raus;
    };
    const netze = (plan) => {
        const v = verband();
        const ks = klemmen(plan);
        ks.forEach(k => v.finde(k.schluessel));
        const ls = (plan.leitungen || []);
        ls.forEach(l => v.finde(`l:${l.id}`));
        ls.forEach(l => {
            const pk = `l:${l.id}`;
            if (l.vonTeil && l.vonNr)
                v.eins(pk, `k:${l.vonTeil}:${l.vonNr}`);
            if (l.nachTeil && l.nachNr)
                v.eins(pk, `k:${l.nachTeil}:${l.nachNr}`);
            const punkte = (l.punkte || []);
            punkte.forEach(p => ks.forEach(k => {
                if (nahBei(p.x, p.y, k.x, k.y))
                    v.eins(pk, k.schluessel);
            }));
            for (let i = 0; i + 1 < punkte.length; i++) {
                const a = punkte[i], b = punkte[i + 1];
                ks.forEach(k => { if (aufStrecke(k.x, k.y, a.x, a.y, b.x, b.y))
                    v.eins(pk, k.schluessel); });
            }
        });
        for (let i = 0; i < ls.length; i++) {
            for (let j = i + 1; j < ls.length; j++) {
                const a = ls[i], b = ls[j];
                const pa = (a.punkte || []);
                const pb = (b.punkte || []);
                let treffer = false;
                pa.forEach(p => {
                    if (treffer)
                        return;
                    for (let s = 0; s + 1 < pb.length; s++) {
                        if (aufStrecke(p.x, p.y, pb[s].x, pb[s].y, pb[s + 1].x, pb[s + 1].y)) {
                            treffer = true;
                            return;
                        }
                    }
                });
                pb.forEach(p => {
                    if (treffer)
                        return;
                    for (let s = 0; s + 1 < pa.length; s++) {
                        if (aufStrecke(p.x, p.y, pa[s].x, pa[s].y, pa[s + 1].x, pa[s + 1].y)) {
                            treffer = true;
                            return;
                        }
                    }
                });
                if (treffer)
                    v.eins(`l:${a.id}`, `l:${b.id}`);
            }
        }
        (plan.teile || []).forEach((t) => {
            if (t.zeichen !== 'verbindungspunkt' && t.zeichen !== 'abzweigdose'
                && t.zeichen !== 'bp-abzweigdose')
                return;
            const eigene = ks.filter(k => k.teil === t.id);
            for (let i = 1; i < eigene.length; i++)
                v.eins(eigene[0].schluessel, eigene[i].schluessel);
        });
        const nummer = new Map();
        const netzVon = new Map();
        ks.forEach(k => {
            const w = v.finde(k.schluessel);
            if (!nummer.has(w))
                nummer.set(w, nummer.size);
            netzVon.set(k.schluessel, nummer.get(w));
        });
        const leitungNetz = {};
        ls.forEach(l => {
            const w = v.finde(`l:${l.id}`);
            if (!nummer.has(w))
                nummer.set(w, nummer.size);
            leitungNetz[l.id] = nummer.get(w);
        });
        return { netzVon, anzahl: nummer.size, klemmen: ks, leitungNetz };
    };
    const loese = (A, z) => {
        const n = z.length;
        if (!n)
            return [];
        const M = A.map((r, i) => r.slice().concat([z[i]]));
        for (let s = 0; s < n; s++) {
            let best = s, betrag = Math.abs(M[s][s]);
            for (let r = s + 1; r < n; r++) {
                const b = Math.abs(M[r][s]);
                if (b > betrag) {
                    betrag = b;
                    best = r;
                }
            }
            if (betrag < 1e-12)
                return null;
            if (best !== s) {
                const h = M[s];
                M[s] = M[best];
                M[best] = h;
            }
            const p = M[s][s];
            for (let r = 0; r < n; r++) {
                if (r === s)
                    continue;
                const f = M[r][s] / p;
                if (!f)
                    continue;
                for (let c = s; c <= n; c++)
                    M[r][c] = M[r][c] - f * M[s][c];
            }
        }
        const x = [];
        for (let i = 0; i < n; i++) {
            const w = M[i][n] / M[i][i];
            x.push(Number.isFinite(w) ? w : 0);
        }
        return x;
    };
    const leer = (fehler, warnungen = []) => ({
        ok: false, fehler, spannung: [], werte: {}, stromNetze: [], netzStrom: [],
        spulen: {}, annahmen: [], warnungen, durchgaenge: 0, leitungNetz: {}, maxStrom: 0
    });
    const KONTAKT = 1e-3;
    const SCHWELLE = 1e-9;
    const widerstandVon = (t, v) => {
        const eigen = t && t.werte && typeof t.werte.R === 'number' ? t.werte.R : NaN;
        if (Number.isFinite(eigen) && eigen > 0)
            return eigen;
        return (typeof v.wert === 'number' && v.wert > 0) ? v.wert : 1000;
    };
    const spannungVon = (t, v) => {
        const eigen = t && t.werte && typeof t.werte.U === 'number' ? t.werte.U : NaN;
        if (Number.isFinite(eigen))
            return eigen;
        return typeof v.wert === 'number' ? v.wert : 230;
    };
    const einDurchgang = (plan, stellung, netzInfo) => {
        const { netzVon, anzahl } = netzInfo;
        if (!anzahl)
            return leer('Der Plan hat noch keine Bauteile.');
        const netzFuer = (teilId, nr) => {
            const n = netzVon.get(`k:${teilId}:${nr}`);
            return typeof n === 'number' ? n : -1;
        };
        let masse = -1;
        const teile = (plan.teile || []);
        teile.forEach(t => {
            if (masse >= 0)
                return;
            const v = verhalten(t.zeichen);
            if (v && v.art === 'bezug' && v.von) {
                const n = netzFuer(t.id, v.von);
                if (n >= 0)
                    masse = n;
            }
        });
        if (masse < 0) {
            teile.forEach(t => {
                if (masse >= 0)
                    return;
                const v = verhalten(t.zeichen);
                if (v && v.art === 'quelle' && v.nach) {
                    const n = netzFuer(t.id, v.nach);
                    if (n >= 0)
                        masse = n;
                }
            });
        }
        if (masse < 0)
            return leer('Der Plan hat keine Spannungsquelle. Ohne Quelle fliesst kein Strom.');
        const zeile = [];
        let n = 0;
        for (let i = 0; i < anzahl; i++)
            zeile.push(i === masse ? -1 : n++);
        const eintraege = [];
        const annahmen = new Set();
        const warnungen = [];
        const kurzschluss = [];
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (v.annahme)
                annahmen.add(v.annahme);
            const paar = (von, nach, art, wert) => {
                const a = netzFuer(t.id, von), b = netzFuer(t.id, nach);
                if (a < 0 || b < 0)
                    return;
                if (a === b) {
                    if (art === 'U' && wert !== 0)
                        kurzschluss.push(`${t.bmk || t.zeichen}: beide Anschlüsse hängen am selben Netz — die Quelle ist kurzgeschlossen.`);
                    return;
                }
                eintraege.push({ t, v, a, b, art, wert });
            };
            switch (v.art) {
                case 'quelle':
                    paar(v.von, v.nach, 'U', spannungVon(t, v));
                    break;
                case 'widerstand':
                case 'spule':
                    paar(v.von, v.nach, 'R', widerstandVon(t, v));
                    break;
                case 'leiter':
                    if (v.von !== v.nach)
                        paar(v.von, v.nach, 'R', KONTAKT);
                    break;
                case 'ampere':
                    paar(v.von, v.nach, 'U', 0);
                    break;
                case 'volt':
                    paar(v.von, v.nach, 'R', 1e7);
                    break;
                case 'diode': {
                    const sperrt = stellung[`d:${t.id}`] === 1;
                    paar(v.von, v.nach, 'R', sperrt ? 1e9 : 1);
                    break;
                }
                case 'schalter': {
                    const liste = v.stellungen || [];
                    const idx = Math.max(0, Math.min(liste.length - 1, stellung[t.id] ?? 0));
                    const s = liste[idx];
                    if (s)
                        s.zu.forEach(([von, nach]) => paar(von, nach, 'R', KONTAKT));
                    break;
                }
                default: break;
            }
        });
        if (kurzschluss.length)
            return leer(kurzschluss[0], kurzschluss);
        let m = 0;
        eintraege.forEach(e => { if (e.art === 'U')
            e.quelleNr = m++; });
        const gr = n + m;
        if (!gr)
            return leer('Es gibt nichts zu rechnen — alle Bauteile hängen am Bezugsnetz.', warnungen);
        const A = [];
        for (let i = 0; i < gr; i++)
            A.push(new Array(gr).fill(0));
        const z = new Array(gr).fill(0);
        for (let r = 0; r < n; r++)
            A[r][r] = A[r][r] + 1e-12;
        eintraege.forEach(e => {
            const ra = zeile[e.a], rb = zeile[e.b];
            if (e.art === 'R') {
                const g = 1 / e.wert;
                if (ra >= 0)
                    A[ra][ra] = A[ra][ra] + g;
                if (rb >= 0)
                    A[rb][rb] = A[rb][rb] + g;
                if (ra >= 0 && rb >= 0) {
                    A[ra][rb] = A[ra][rb] - g;
                    A[rb][ra] = A[rb][ra] - g;
                }
            }
            else {
                const q = n + e.quelleNr;
                if (ra >= 0) {
                    A[ra][q] = A[ra][q] + 1;
                    A[q][ra] = A[q][ra] + 1;
                }
                if (rb >= 0) {
                    A[rb][q] = A[rb][q] - 1;
                    A[q][rb] = A[q][rb] - 1;
                }
                z[q] = e.wert;
            }
        });
        const x = loese(A, z);
        if (!x)
            return leer('Die Schaltung hat keine eindeutige Lösung. Das passiert, wenn zwei ideale ' +
                'Quellen parallel liegen oder zwei Amperemeter denselben Zweig messen — ' +
                'dann ist nicht bestimmt, wie sich der Strom auf sie verteilt.', warnungen);
        const U = (netz) => {
            const r = zeile[netz];
            return (typeof r === 'number' && r >= 0) ? x[r] : 0;
        };
        const spannung = [];
        for (let i = 0; i < anzahl; i++)
            spannung.push(U(i));
        const werte = {};
        const netzStrom = new Array(anzahl).fill(0);
        eintraege.forEach(e => {
            const u = U(e.a) - U(e.b);
            const i = e.art === 'R' ? u / e.wert : x[n + e.quelleNr];
            const alt = werte[e.t.id];
            const strom = Math.abs(i);
            if (!alt || strom > Math.abs(alt.I)) {
                werte[e.t.id] = {
                    teil: e.t.id, zeichen: e.t.zeichen, bmk: e.t.bmk || '',
                    U: u, I: i, P: Math.abs(u * i), fliesst: strom > SCHWELLE
                };
            }
            else if (alt) {
                alt.fliesst = alt.fliesst || strom > SCHWELLE;
            }
            netzStrom[e.a] = Math.max(netzStrom[e.a], strom);
            netzStrom[e.b] = Math.max(netzStrom[e.b], strom);
        });
        teile.forEach(t => {
            const w = werte[t.id];
            if (!w)
                return;
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'widerstand')
                return;
            const rNenn = widerstandVon(t, v);
            const uNenn = (t.werte && typeof t.werte.Un === 'number') ? t.werte.Un : 230;
            const pNenn = (uNenn * uNenn) / rNenn;
            w.helligkeit = pNenn > 0 ? Math.max(0, Math.min(1, w.P / pNenn)) : 0;
        });
        const stromNetze = [];
        netzStrom.forEach((s, i) => { if (s > SCHWELLE)
            stromNetze.push(i); });
        const spulen = {};
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'spule')
                return;
            const w = werte[t.id];
            const an = !!w && Math.abs(w.U) > 0.5 * 230 * 0.5;
            if (t.bmk)
                spulen[t.bmk] = an;
            spulen[`#${t.id}`] = an;
        });
        let maxStrom = 0;
        for (let i = 0; i < netzStrom.length; i++) {
            if (netzStrom[i] <= SCHWELLE)
                netzStrom[i] = 0;
            else if (netzStrom[i] > maxStrom)
                maxStrom = netzStrom[i];
        }
        return {
            ok: true, fehler: '', spannung, werte, stromNetze, netzStrom, spulen,
            annahmen: Array.from(annahmen), warnungen, durchgaenge: 1,
            leitungNetz: netzInfo.leitungNetz, maxStrom
        };
    };
    const rechne = (plan, stellung = {}, vorher) => {
        if (!plan || !Array.isArray(plan.teile))
            return leer('Kein Plan.');
        const netzInfo = netze(plan);
        const teile = plan.teile;
        const folger = teile.filter(t => {
            const v = verhalten(t.zeichen);
            return !!(v && v.folgtSpule);
        });
        let stand = Object.assign({}, stellung);
        if (vorher)
            folger.forEach(t => {
                if (t.bmk && vorher[t.bmk])
                    stand[t.id] = 1;
            });
        let erg = einDurchgang(plan, stand, netzInfo);
        if (!erg.ok)
            return erg;
        const gesehen = new Set();
        let runde = 1;
        const MAX = 24;
        while (runde < MAX) {
            const naechster = Object.assign({}, stellung);
            folger.forEach(t => {
                const v = verhalten(t.zeichen);
                const an = t.bmk ? !!erg.spulen[t.bmk] : false;
                naechster[t.id] = an ? 1 : 0;
                if (v.folgtSpule === 'oeffner')
                    naechster[t.id] = an ? 1 : 0;
            });
            teile.forEach(t => {
                const v = verhalten(t.zeichen);
                if (!v || v.art !== 'diode')
                    return;
                const w = erg.werte[t.id];
                naechster[`d:${t.id}`] = (w && w.I < -SCHWELLE) ? 1 : 0;
            });
            const schluessel = JSON.stringify(naechster);
            if (schluessel === JSON.stringify(stand))
                break;
            if (gesehen.has(schluessel)) {
                erg.warnungen.push('Die Steuerung kommt nicht zur Ruhe — ein Kontakt schaltet die Spule ab, die ihn hält. In echt ist das ein Blinker.');
                break;
            }
            gesehen.add(schluessel);
            stand = naechster;
            const neu = einDurchgang(plan, stand, netzInfo);
            if (!neu.ok)
                return neu;
            neu.warnungen = erg.warnungen.concat(neu.warnungen);
            erg = neu;
            runde++;
        }
        erg.durchgaenge = runde;
        const gemeldet = new Set();
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (t.zeichen === 'verbindungspunkt' || t.zeichen === 'abzweigdose'
                || t.zeichen === 'bp-abzweigdose')
                return;
            const eigene = netzInfo.klemmen.filter(k => k.teil === t.id);
            for (let i = 0; i < eigene.length; i++) {
                for (let j = i + 1; j < eigene.length; j++) {
                    const a = eigene[i], b = eigene[j];
                    if (a.nr === b.nr)
                        continue;
                    if (netzInfo.netzVon.get(a.schluessel) !== netzInfo.netzVon.get(b.schluessel))
                        continue;
                    const schluessel = `${t.id}:${a.nr}:${b.nr}`;
                    if (gemeldet.has(schluessel))
                        continue;
                    gemeldet.add(schluessel);
                    erg.warnungen.push(`${t.bmk || t.zeichen}: die Anschlüsse ${a.nr} und ${b.nr} hängen am ` +
                        `selben Netz — das Bauteil ist überbrückt. Meist laufen zwei ` +
                        `Leitungen auf derselben Höhe übereinander.`);
                }
            }
        });
        const belegt = new Set();
        (plan.leitungen || []).forEach(() => { });
        netzInfo.klemmen.forEach(k => {
            const netz = netzInfo.netzVon.get(k.schluessel);
            if (typeof netz !== 'number')
                return;
            const wieViele = netzInfo.klemmen.filter(o => netzInfo.netzVon.get(o.schluessel) === netz).length;
            if (wieViele <= 1 && !belegt.has(netz)) {
                belegt.add(netz);
                const t = teile.find(x => x.id === k.teil);
                erg.warnungen.push(`${(t && t.bmk) || (t && t.zeichen) || 'Ein Bauteil'}: Anschluss ${k.nr} hängt an keiner Leitung.`);
            }
        });
        return erg;
    };
    const zeige = (wert, einheit, stellen = 2) => {
        if (!Number.isFinite(wert))
            return '—';
        const b = Math.abs(wert);
        if (b <= SCHWELLE)
            return `0 ${einheit}`;
        const stufen = [
            [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''],
            [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']
        ];
        for (const [f, v] of stufen) {
            if (b >= f) {
                const z = wert / f;
                let text = z.toFixed(Math.abs(z) >= 100 ? 0 : stellen);
                if (text.indexOf('.') >= 0)
                    text = text.replace(/0+$/, '').replace(/\.$/, '');
                return `${text} ${v}${einheit}`;
            }
        }
        return `${wert.toExponential(2)} ${einheit}`;
    };
    return {
        VERHALTEN, verhalten, stellungenVon, netze, rechne, zeige, loese,
        klemmen, aufStrecke
    };
})();
window.Stromfluss = Stromfluss;
