"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/simulation.ts (npm run bauen:ts). */
const Stromfluss = (() => {
    const ZEIT_ANNAHME = 'Die Verzögerung wird nicht gerechnet — die Simulation kennt keine Zeit. Der Kontakt folgt sofort.';
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
            wechselstrom: true, leiter: { L: 'L1', N: 'N' },
            annahme: 'Wechselspannung wird als Zeiger gerechnet: Betrag ist der Effektivwert, Winkel die Phasenlage. Für ohmsche Lasten ist das Ergebnis exakt.' },
        drehstromquelle: { art: 'mehrteilig', wert: 230, einheit: 'V',
            wechselstrom: true, leiter: { L1: 'L1', L2: 'L2', L3: 'L3', N: 'N', PE: 'PE' },
            glieder: [
                { art: 'quelle', von: 'L1', nach: 'N', wert: 230, phase: 0 },
                { art: 'quelle', von: 'L2', nach: 'N', wert: 230, phase: -120 },
                { art: 'quelle', von: 'L3', nach: 'N', wert: 230, phase: -240 },
                { art: 'leiter', von: 'N', nach: 'PE' }
            ],
            annahme: 'Drehstrom wird als Zeiger gerechnet: drei Quellen zu 230 V, um 120° versetzt. Zwischen zwei Aussenleitern ergeben sich daraus 400 V — gerechnet, nicht eingetragen.' },
        generator: { art: 'quelle', von: '1', nach: '2', wert: 230, einheit: 'V',
            wechselstrom: true },
        erde: { art: 'bezug', von: 'E', leiter: { E: 'PE' } },
        masse: { art: 'bezug', von: 'M' },
        schutzleiter: { art: 'bezug', von: 'PE', leiter: { PE: 'PE' } },
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
        wechsler: { art: 'schalter', folgtSpule: 'schliesser', stellungen: [
                { name: 'Ruhe (11–12)', zu: [['11', '12']] },
                { name: 'angezogen (11–14)', zu: [['11', '14']] }
            ] },
        schliesser: { art: 'schalter', stellungen: AUF_ZU('3', '4'), folgtSpule: 'schliesser' },
        oeffner: { art: 'schalter', stellungen: ZU_AUF('1', '2'), folgtSpule: 'oeffner' },
        'schuetz-schliesser': { art: 'schalter', stellungen: AUF_ZU('13', '14'), folgtSpule: 'schliesser' },
        'schuetz-oeffner': { art: 'schalter', stellungen: ZU_AUF('21', '22'), folgtSpule: 'oeffner' },
        'schuetz-hauptkontakt': { art: 'schalter', stellungen: AUF_ZU('1', '2'), folgtSpule: 'schliesser' },
        spule: { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω' },
        'spule-anzugsverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: ZEIT_ANNAHME },
        'spule-abfallverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: ZEIT_ANNAHME },
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
        'motor-drehstrom': { art: 'mehrteilig', wert: 60, einheit: 'Ω',
            schutzklasse: 1,
            glieder: [
                { art: 'widerstand', von: 'U1', nach: 'sternpunkt', wert: 60 },
                { art: 'widerstand', von: 'V1', nach: 'sternpunkt', wert: 60 },
                { art: 'widerstand', von: 'W1', nach: 'sternpunkt', wert: 60 }
            ],
            annahme: 'Der Motor ist mit drei Anschlüssen gezeichnet und wird deshalb als fertig in Stern geschaltet gerechnet — so, wie ein Motor mit dem Schild 3 × 400/230 V am 400-V-Netz betrieben wird. Wer die Brücken selbst setzen will, nimmt das Klemmenbrett. Die Wicklungen gelten als rein ohmsch: Blindanteil, Anlaufstrom und Schlupf fehlen.' },
        'motor-klemmenbrett': { art: 'mehrteilig', wert: 60, einheit: 'Ω',
            schutzklasse: 1, schutzklemme: 'PE',
            glieder: [
                { art: 'widerstand', von: 'U1', nach: 'U2', wert: 60 },
                { art: 'widerstand', von: 'V1', nach: 'V2', wert: 60 },
                { art: 'widerstand', von: 'W1', nach: 'W2', wert: 60 }
            ],
            stellungen: [
                { name: 'ohne Brücken', zu: [] },
                { name: 'Stern', zu: [['U2', 'V2'], ['V2', 'W2']], sternpunkt: ['U2', 'V2', 'W2'] },
                { name: 'Dreieck', zu: [['U1', 'W2'], ['V1', 'U2'], ['W1', 'V2']] }
            ],
            annahme: 'Die drei Wicklungen gelten als rein ohmsch. Das Verhältnis von Stern zu Dreieck stimmt trotzdem, weil es allein an der Spannung hängt und nicht an der Art der Last.' },
        transformator: { art: 'uebertrager', von: '1U', nach: '1V',
            von2: '2U', nach2: '2V', wert: 230 / 12, einheit: '',
            annahme: 'Der Übertrager wird als ideal gerechnet: keine Verluste, kein Streufluss, kein Leerlaufstrom. Spannung wird im Verhältnis geteilt, Strom im selben Verhältnis vervielfacht, die Leistung geht unverändert hindurch. Für einen Netztrafo stimmt das auf wenige Prozent.' },
        'spule-induktivitaet': { art: 'leiter', von: '1', nach: '2',
            annahme: 'Bei Gleichstrom ist eine Spule eine Verbindung. Ihre Wirkung zeigt sich erst im Wechselstrom.' },
        sicherung: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        leitungsschutzschalter: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        motorschutzschalter: { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] },
                { name: 'ausgelöst', zu: [] }
            ], annahme: 'Der Motorschutzschalter trennt alle drei Aussenleiter zugleich. Wann er auslöst, wird nicht gerechnet — dafür bräuchte es Zeit und Wärme.' },
        thermorelais: { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] },
                { name: 'ausgelöst', zu: [] }
            ], annahme: 'Das Bimetall wird nicht gerechnet. Die Stellung „ausgelöst" lässt sich von Hand wählen, um den Fall zu zeigen.' },
        'fi-schutzschalter': { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['N', 'N2']] },
                { name: 'ausgelöst', zu: [] }
            ], schutzklemme: 'N',
            annahme: 'Die Auslösung wird nicht selbst geschaltet — der Fehlerstrom wird aber gerechnet und gemeldet.' },
        ueberspannungsableiter: { art: 'offen', von: '1', nach: 'PE',
            annahme: 'Im Betrieb sperrt er. Er leitet erst bei einer Überspannung, und die kommt in dieser Rechnung nicht vor.' },
        klemme: { art: 'leiter', von: '1', nach: '2' },
        steckverbindung: { art: 'leiter', von: '1', nach: '2' },
        'leiter-l1': { art: 'leiter', von: 'L1', nach: 'L1', leiter: { L1: 'L1' } },
        'leiter-l2': { art: 'leiter', von: 'L2', nach: 'L2', leiter: { L2: 'L2' } },
        'leiter-l3': { art: 'leiter', von: 'L3', nach: 'L3', leiter: { L3: 'L3' } },
        'leiter-n': { art: 'leiter', von: 'N', nach: 'N', leiter: { N: 'N' } },
        'leiter-pe': { art: 'leiter', von: 'PE', nach: 'PE', leiter: { PE: 'PE' } },
        'bp-minuterie': { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        steckdose: { art: 'offen', von: 'L', nach: 'N',
            annahme: 'Was in der Steckdose steckt, wird nicht mitgerechnet. Ohne Gerät ist sie eine Unterbrechung.' },
        'steckdose-schuko': { art: 'offen', von: 'L', nach: 'N',
            leiter: {}, schutzklemme: 'PE',
            annahme: 'Was in der Steckdose steckt, wird nicht mitgerechnet. Der Schutzkontakt wird geprüft, nicht gerechnet.' },
        stecker: { art: 'offen', von: 'L', nach: 'N',
            annahme: 'Der Stecker allein führt nichts. Was daran hängt, steht nicht im Plan.' },
        ptc: { art: 'widerstand', von: '1', nach: '2', wert: 100, einheit: 'Ω',
            annahme: 'Der Kaltleiter wird mit seinem kalten Wert gerechnet. Die Temperatur kommt in dieser Rechnung nicht vor.' },
        ntc: { art: 'widerstand', von: '1', nach: '2', wert: 10000, einheit: 'Ω',
            annahme: 'Der Heissleiter wird mit seinem kalten Wert gerechnet. Die Temperatur kommt in dieser Rechnung nicht vor.' },
        vdr: { art: 'widerstand', von: '1', nach: '2', wert: 1e6, einheit: 'Ω',
            annahme: 'Der Varistor wird hochohmig gerechnet. Er leitet erst bei Überspannung, und die kommt hier nicht vor.' },
        ldr: { art: 'widerstand', von: '1', nach: '2', wert: 10000, einheit: 'Ω',
            annahme: 'Der Fotowiderstand wird mit einem mittleren Wert gerechnet. Die Helligkeit kommt in dieser Rechnung nicht vor.' },
        frequenzmesser: { art: 'volt', von: '1', nach: '2',
            annahme: 'Er wird wie ein Voltmeter hochohmig gerechnet. Die Frequenz selbst ist in dieser Rechnung fest — 50 Hz.' },
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
    const verhalten = (zeichenId) => Object.hasOwn(VERHALTEN, zeichenId) ? VERHALTEN[zeichenId] : null;
    const stellungenVon = (zeichenId) => {
        const v = VERHALTEN[zeichenId];
        return (v && v.stellungen) ? v.stellungen : [];
    };
    const stellungIn = (v, stellung, teilId) => {
        const liste = v.stellungen || [];
        return liste[Math.max(0, Math.min(liste.length - 1, stellung[teilId] ?? 0))];
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
    const NAH = (typeof Register !== 'undefined' && Register.fachzeichen
        && typeof Register.fachzeichen.NAH === 'number') ? Register.fachzeichen.NAH : 6;
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
            const v = verhalten(t.zeichen);
            if (!v || !v.glieder)
                return;
            const aussen = new Set(liste.map((a) => String(a.nr)));
            const innen = new Set();
            v.glieder.forEach(g => {
                [g.von, g.nach].forEach(nr => {
                    if (!aussen.has(nr) && !innen.has(nr))
                        innen.add(nr);
                });
            });
            innen.forEach(nr => raus.push({
                teil: t.id, nr, x: NaN, y: NaN, schluessel: `k:${t.id}:${nr}`, intern: true
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
        const teilNach = new Map();
        (plan.teile || []).forEach((t) => teilNach.set(String(t.id), t));
        const endeVon = (teil, nr, p) => {
            const t = teilNach.get(String(teil));
            const F = typeof Register !== 'undefined' ? Register.fachzeichen : null;
            if (!t || !F || typeof F.klemmeFuer !== 'function')
                return { nr, frueher: false };
            const r = F.klemmeFuer(t.zeichen, nr, p ? { x: p.x - t.x, y: p.y - t.y } : null, t.drehung, t.gespiegelt);
            return r || { nr, frueher: false };
        };
        ls.forEach(l => {
            const pk = `l:${l.id}`;
            const punkte = (l.punkte || []);
            const nicht = new Set();
            const binde = (teil, nr, p) => {
                const r = endeVon(teil, nr, p);
                v.eins(pk, `k:${teil}:${r.nr}`);
                if (r.frueher)
                    ks.forEach(k => {
                        if (k.teil === teil && k.nr !== r.nr)
                            nicht.add(k.schluessel);
                    });
            };
            if (l.vonTeil && l.vonNr)
                binde(l.vonTeil, l.vonNr, punkte[0]);
            if (l.nachTeil && l.nachNr)
                binde(l.nachTeil, l.nachNr, punkte[punkte.length - 1]);
            punkte.forEach(p => ks.forEach(k => {
                if (!nicht.has(k.schluessel) && nahBei(p.x, p.y, k.x, k.y))
                    v.eins(pk, k.schluessel);
            }));
            for (let i = 0; i + 1 < punkte.length; i++) {
                const a = punkte[i], b = punkte[i + 1];
                ks.forEach(k => {
                    if (!nicht.has(k.schluessel) && aufStrecke(k.x, k.y, a.x, a.y, b.x, b.y))
                        v.eins(pk, k.schluessel);
                });
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
    const PIVOT_MIN = 1e-14;
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
            if (betrag < PIVOT_MIN)
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
    const loeseKomplex = (Are, Aim, zre, zim) => {
        const n = zre.length;
        if (!n)
            return { re: [], im: [] };
        const G = [];
        for (let i = 0; i < 2 * n; i++)
            G.push(new Array(2 * n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                G[i][j] = Are[i][j];
                G[i][j + n] = -Aim[i][j];
                G[i + n][j] = Aim[i][j];
                G[i + n][j + n] = Are[i][j];
            }
        }
        const x = loese(G, zre.concat(zim));
        if (!x)
            return null;
        return { re: x.slice(0, n), im: x.slice(n) };
    };
    const bogen = (grad) => grad * Math.PI / 180;
    const leer = (fehler, warnungen = []) => ({
        ok: false, fehler, spannung: [], spannungWinkel: [], wechsel: false, komplex: false,
        werte: {}, teilwerte: {}, stromNetze: [], netzStrom: [],
        spulen: {}, annahmen: [], warnungen, durchgaenge: 0, leitungNetz: {}, maxStrom: 0,
        verbindungen: [], anschlussfehler: [], stellungen: {}
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
                if (v && v.art === 'mehrteilig') {
                    (v.glieder || []).forEach(g => {
                        if (masse >= 0 || g.art !== 'quelle')
                            return;
                        const n = netzFuer(t.id, g.nach);
                        if (n >= 0)
                            masse = n;
                    });
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
            const paar = (von, nach, art, wert, phase = 0) => {
                const a = netzFuer(t.id, von), b = netzFuer(t.id, nach);
                if (a < 0 || b < 0)
                    return;
                if (a === b) {
                    if (art === 'U' && wert !== 0)
                        kurzschluss.push(`${t.bmk || t.zeichen}: beide Anschlüsse hängen am selben Netz — die Quelle ist kurzgeschlossen.`);
                    return;
                }
                eintraege.push({ t, v, a, b, art, wert, phase, von, nach });
            };
            const vier = (v1, v2, s1, s2, ue) => {
                const a = netzFuer(t.id, v1), b = netzFuer(t.id, v2);
                const c = netzFuer(t.id, s1), d = netzFuer(t.id, s2);
                if (a < 0 || b < 0 || c < 0 || d < 0)
                    return;
                if (a === b || c === d) {
                    kurzschluss.push(`${t.bmk || t.zeichen}: eine Wicklung ist kurzgeschlossen — beide Enden liegen am selben Netz.`);
                    return;
                }
                eintraege.push({ t, v, a, b, c, d, art: 'T', wert: ue, phase: 0,
                    von: v1, nach: v2 });
            };
            switch (v.art) {
                case 'quelle':
                    paar(v.von, v.nach, 'U', spannungVon(t, v), v.phase ?? 0);
                    break;
                case 'mehrteilig': {
                    (v.glieder || []).forEach(g => {
                        if (g.art === 'quelle')
                            paar(g.von, g.nach, 'U', g.wert ?? 230, g.phase ?? 0);
                        else if (g.art === 'widerstand')
                            paar(g.von, g.nach, 'R', g.wert ?? 1000);
                        else
                            paar(g.von, g.nach, 'R', KONTAKT);
                    });
                    const st = stellungIn(v, stellung, t.id);
                    if (st)
                        st.zu.forEach(([von, nach]) => paar(von, nach, 'R', KONTAKT));
                    break;
                }
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
                case 'uebertrager': {
                    const eigen = t && t.werte && typeof t.werte.ue === 'number' ? t.werte.ue : NaN;
                    const ue = (Number.isFinite(eigen) && eigen > 0) ? eigen
                        : (typeof v.wert === 'number' && v.wert > 0 ? v.wert : 1);
                    vier(v.von, v.nach, v.von2, v.nach2, ue);
                    break;
                }
                case 'diode': {
                    const sperrt = stellung[`d:${t.id}`] === 1;
                    paar(v.von, v.nach, 'R', sperrt ? 1e9 : 1);
                    break;
                }
                case 'schalter': {
                    const s = stellungIn(v, stellung, t.id);
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
        eintraege.forEach(e => { if (e.art === 'U' || e.art === 'T')
            e.quelleNr = m++; });
        const gr = n + m;
        if (!gr)
            return leer('Es gibt nichts zu rechnen — alle Bauteile hängen am Bezugsnetz.', warnungen);
        const A = [];
        for (let i = 0; i < gr; i++)
            A.push(new Array(gr).fill(0));
        const z = new Array(gr).fill(0);
        const Aim = [];
        for (let i = 0; i < gr; i++)
            Aim.push(new Array(gr).fill(0));
        const zim = new Array(gr).fill(0);
        const GMIN = 1e-12;
        for (let r = 0; r < n; r++)
            A[r][r] = A[r][r] + GMIN;
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
            else if (e.art === 'T') {
                const rc = typeof e.c === 'number' ? zeile[e.c] : -1;
                const rd = typeof e.d === 'number' ? zeile[e.d] : -1;
                const q = n + e.quelleNr;
                const ue = e.wert;
                if (ra >= 0) {
                    A[ra][q] = A[ra][q] + 1;
                    A[q][ra] = A[q][ra] + 1;
                }
                if (rb >= 0) {
                    A[rb][q] = A[rb][q] - 1;
                    A[q][rb] = A[q][rb] - 1;
                }
                if (rc >= 0) {
                    A[rc][q] = A[rc][q] - ue;
                    A[q][rc] = A[q][rc] - ue;
                }
                if (rd >= 0) {
                    A[rd][q] = A[rd][q] + ue;
                    A[q][rd] = A[q][rd] + ue;
                }
                z[q] = 0;
                zim[q] = 0;
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
                z[q] = e.wert * Math.cos(bogen(e.phase));
                zim[q] = e.wert * Math.sin(bogen(e.phase));
            }
        });
        const komplex = eintraege.some(e => e.art === 'U' && (e.phase % 360) !== 0);
        const wechsel = teile.some(t => {
            const v = verhalten(t.zeichen);
            return !!(v && v.wechselstrom);
        });
        let xRe;
        let xIm;
        if (komplex) {
            const k = loeseKomplex(A, Aim, z, zim);
            xRe = k ? k.re : null;
            xIm = k ? k.im : [];
        }
        else {
            xRe = loese(A, z);
            xIm = new Array(gr).fill(0);
        }
        const x = xRe;
        if (!x)
            return leer('Die Schaltung hat keine eindeutige Lösung. Das passiert, wenn zwei ideale ' +
                'Quellen parallel liegen oder zwei Amperemeter denselben Zweig messen — ' +
                'dann ist nicht bestimmt, wie sich der Strom auf sie verteilt.', warnungen);
        const U = (netz) => {
            const r = zeile[netz];
            return (typeof r === 'number' && r >= 0) ? x[r] : 0;
        };
        const Uj = (netz) => {
            const r = zeile[netz];
            return (typeof r === 'number' && r >= 0) ? (xIm[r] ?? 0) : 0;
        };
        const winkel = (re, im) => {
            if (Math.abs(re) < 1e-12 && Math.abs(im) < 1e-12)
                return 0;
            return Math.atan2(im, re) * 180 / Math.PI;
        };
        const spannung = [];
        const spannungWinkel = [];
        for (let i = 0; i < anzahl; i++) {
            const re = U(i), im = Uj(i);
            spannung.push(wechsel ? Math.hypot(re, im) : re);
            spannungWinkel.push(wechsel ? winkel(re, im) : 0);
        }
        const werte = {};
        const teilwerte = {};
        const netzStrom = new Array(anzahl).fill(0);
        eintraege.forEach(e => {
            const ure = U(e.a) - U(e.b);
            const uim = Uj(e.a) - Uj(e.b);
            const ire = e.art === 'R' ? ure / e.wert : x[n + e.quelleNr];
            const iim = e.art === 'R' ? uim / e.wert : (xIm[n + e.quelleNr] ?? 0);
            if (e.art === 'T' && typeof e.c === 'number' && typeof e.d === 'number') {
                const s2re = U(e.c) - U(e.d), s2im = Uj(e.c) - Uj(e.d);
                const i2re = -ire * e.wert, i2im = -iim * e.wert;
                const fach2 = teilwerte[e.t.id] || (teilwerte[e.t.id] = {});
                const b2 = Math.hypot(s2re, s2im), j2 = Math.hypot(i2re, i2im);
                fach2[`${e.v.von2}–${e.v.nach2}`] = {
                    teil: e.t.id, zeichen: e.t.zeichen, bmk: e.t.bmk || '',
                    U: wechsel ? b2 : s2re, I: wechsel ? j2 : i2re,
                    P: Math.abs(s2re * i2re + s2im * i2im), fliesst: j2 > SCHWELLE,
                    Ubetrag: b2, Ibetrag: j2,
                    Uwinkel: wechsel ? winkel(s2re, s2im) : 0,
                    Iwinkel: wechsel ? winkel(i2re, i2im) : 0,
                    Ire: i2re, Iim: i2im, wechsel,
                    vonKlemme: e.v.von2 || '', nachKlemme: e.v.nach2 || '',
                    richtung: j2 <= SCHWELLE ? 'keine' : (wechsel ? 'wechselnd' : (i2re > 0 ? 'vor' : 'rueck')),
                    richtungstext: j2 <= SCHWELLE ? 'Es fliesst kein Strom.'
                        : 'Der Strom der Sekundärseite. Er ist um die Übersetzung grösser als der primäre.'
                };
            }
            const uBetrag = Math.hypot(ure, uim);
            const iBetrag = Math.hypot(ire, iim);
            const p = Math.abs(ure * ire + uim * iim);
            const alt = werte[e.t.id];
            const strom = iBetrag;
            const iWinkel = wechsel ? winkel(ire, iim) : 0;
            let richtung;
            let richtungJetzt;
            let richtungstext;
            const hin = `von ${e.von} nach ${e.nach}`;
            const her = `von ${e.nach} nach ${e.von}`;
            if (strom <= SCHWELLE) {
                richtung = 'keine';
                richtungstext = 'Es fliesst kein Strom.';
            }
            else if (!wechsel) {
                richtung = ire > 0 ? 'vor' : 'rueck';
                richtungstext = `Der Strom fliesst ${ire > 0 ? hin : her}.`;
            }
            else {
                richtung = 'wechselnd';
                const c = Math.cos(bogen(iWinkel));
                richtungJetzt = Math.abs(c) < 0.02 ? 'quer' : (c > 0 ? 'vor' : 'rueck');
                const augenblick = richtungJetzt === 'quer'
                    ? 'steht er gerade still — er ist um 90° versetzt und kehrt eben um'
                    : `fliesst er ${richtungJetzt === 'vor' ? hin : her}`;
                richtungstext =
                    'Wechselstrom bei 50 Hz: der Strom durchläuft 50 volle Perioden je '
                        + 'Sekunde und kehrt dabei hundertmal seine Richtung um. Der Pfeil '
                        + `zeigt die Zählrichtung (${hin}). Im Augenblick des Scheitels von L1 `
                        + `${augenblick}.`;
            }
            const mach = () => ({
                teil: e.t.id, zeichen: e.t.zeichen, bmk: e.t.bmk || '',
                U: wechsel ? uBetrag : ure, I: wechsel ? iBetrag : ire,
                P: p, fliesst: strom > SCHWELLE,
                Ubetrag: uBetrag, Ibetrag: iBetrag,
                Uwinkel: wechsel ? winkel(ure, uim) : 0,
                Iwinkel: iWinkel, Ire: ire, Iim: iim,
                wechsel, vonKlemme: e.von, nachKlemme: e.nach,
                richtung, richtungstext,
                ...(richtungJetzt ? { richtungJetzt } : {})
            });
            if (!alt || strom > Math.abs(alt.I)) {
                werte[e.t.id] = mach();
            }
            else if (alt) {
                alt.fliesst = alt.fliesst || strom > SCHWELLE;
            }
            const fach = teilwerte[e.t.id] || (teilwerte[e.t.id] = {});
            fach[`${e.von}–${e.nach}`] = mach();
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
            ok: true, fehler: '', spannung, spannungWinkel, wechsel, komplex,
            werte, teilwerte, stromNetze, netzStrom, spulen,
            annahmen: Array.from(annahmen), warnungen, durchgaenge: 1,
            leitungNetz: netzInfo.leitungNetz, maxStrom,
            verbindungen: eintraege
                .filter(e => !(e.art === 'U' && e.wert !== 0))
                .map(e => [e.a, e.b]),
            anschlussfehler: [],
            stellungen: Object.assign({}, stellung)
        };
    };
    const rechne = (plan, stellung = {}, vorher, zeitAusgaenge) => {
        if (!plan || !Array.isArray(plan.teile))
            return leer('Kein Plan.');
        const netzInfo = netze(plan);
        const teile = plan.teile;
        const folger = teile.filter(t => {
            const v = verhalten(t.zeichen);
            return !!(v && v.folgtSpule);
        });
        const zeitSpulen = new Set(zeitAusgaenge ? teile.filter(t => t.bmk &&
            (t.zeichen === 'spule-anzugsverzoegert' || t.zeichen === 'spule-abfallverzoegert'))
            .map(t => String(t.bmk)) : []);
        const folgtAn = (bmk, spulen) => zeitAusgaenge && zeitSpulen.has(bmk) ? !!zeitAusgaenge[bmk] : !!spulen[bmk];
        let stand = Object.assign({}, stellung);
        if (vorher)
            folger.forEach(t => {
                if (t.bmk && folgtAn(t.bmk, vorher))
                    stand[t.id] = 1;
            });
        const mitFehlern = (e) => {
            e.stellungen = Object.assign({}, stand);
            e.anschlussfehler = anschlussfehler(plan, netzInfo, e);
            e.anschlussfehler.forEach(f => e.warnungen.push(`${f.was} ${f.warum}`));
            return e;
        };
        let erg = einDurchgang(plan, stand, netzInfo);
        if (!erg.ok)
            return mitFehlern(erg);
        const gesehen = new Set();
        let runde = 1;
        let konvergiert = false;
        const MAX = 24;
        while (runde < MAX) {
            const naechster = Object.assign({}, stellung);
            folger.forEach(t => {
                const v = verhalten(t.zeichen);
                const an = t.bmk ? folgtAn(t.bmk, erg.spulen) : false;
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
            if (schluessel === JSON.stringify(stand)) {
                konvergiert = true;
                break;
            }
            if (gesehen.has(schluessel)) {
                erg.warnungen.push('Die Steuerung kommt nicht zur Ruhe — ein Kontakt schaltet die Spule ab, die ihn hält. In echt ist das ein Blinker.');
                break;
            }
            gesehen.add(schluessel);
            stand = naechster;
            const neu = einDurchgang(plan, stand, netzInfo);
            if (!neu.ok)
                return mitFehlern(neu);
            neu.warnungen = erg.warnungen.concat(neu.warnungen);
            erg = neu;
            runde++;
        }
        erg.durchgaenge = runde;
        erg.konvergiert = konvergiert;
        if (!konvergiert && runde === MAX)
            erg.warnungen.push('Die Steuerung hat innerhalb der Rechengrenze keinen stabilen Zustand erreicht.');
        if (zeitAusgaenge)
            erg.annahmen = erg.annahmen.filter(a => a !== ZEIT_ANNAHME);
        const gemeldet = new Set();
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (t.zeichen === 'verbindungspunkt' || t.zeichen === 'abzweigdose'
                || t.zeichen === 'bp-abzweigdose')
                return;
            const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
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
        const knoten = verband();
        const sternpunkt = new Set();
        const brueckenNetze = [];
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'mehrteilig')
                return;
            const st = stellungIn(v, stand, t.id);
            if (!st)
                return;
            (st.sternpunkt || []).forEach(nr => sternpunkt.add(`k:${t.id}:${nr}`));
            st.zu.forEach(([a, b]) => {
                const na = netzInfo.netzVon.get(`k:${t.id}:${a}`);
                const nb = netzInfo.netzVon.get(`k:${t.id}:${b}`);
                if (typeof na === 'number' && typeof nb === 'number') {
                    knoten.eins(`n:${na}`, `n:${nb}`);
                    brueckenNetze.push(na, nb);
                }
            });
        });
        const knotenVon = (netz) => knoten.finde(`n:${netz}`);
        const anBruecke = new Set(brueckenNetze.map(knotenVon));
        const imKnoten = new Map();
        netzInfo.klemmen.forEach(o => {
            const n = netzInfo.netzVon.get(o.schluessel);
            if (typeof n !== 'number')
                return;
            const w = knotenVon(n);
            const liste = imKnoten.get(w);
            if (liste)
                liste.push(o);
            else
                imKnoten.set(w, [o]);
        });
        const belegt = new Set();
        netzInfo.klemmen.forEach(k => {
            if (k.intern)
                return;
            const netz = netzInfo.netzVon.get(k.schluessel);
            if (typeof netz !== 'number')
                return;
            const hier = knotenVon(netz);
            if (belegt.has(hier))
                return;
            const darin = imKnoten.get(hier) || [];
            const allein = darin.length <= 1;
            const nurBruecke = anBruecke.has(hier)
                && darin.every(o => o.teil === k.teil)
                && !darin.every(o => o.intern || sternpunkt.has(o.schluessel));
            if (allein || nurBruecke) {
                belegt.add(hier);
                const t = teile.find(x => x.id === k.teil);
                erg.warnungen.push(`${(t && t.bmk) || (t && t.zeichen) || 'Ein Bauteil'}: Anschluss ${k.nr} hängt an keiner Leitung.`);
            }
        });
        return mitFehlern(erg);
    };
    const leiterName = (l) => l === 'PE' ? 'Schutzleiter' : l === 'N' ? 'Neutralleiter' : `Aussenleiter ${l}`;
    const istAussen = (l) => l === 'L1' || l === 'L2' || l === 'L3';
    const leiterrollen = (plan, netzInfo) => {
        const raus = new Map();
        const setze = (teilId, nr, rolle) => {
            const netz = netzInfo.netzVon.get(`k:${teilId}:${nr}`);
            if (typeof netz !== 'number')
                return;
            const fach = raus.get(netz) || new Set();
            fach.add(rolle);
            raus.set(netz, fach);
        };
        (plan.teile || []).forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (v.leiter)
                Object.keys(v.leiter).forEach(nr => setze(t.id, nr, v.leiter[nr]));
        });
        return raus;
    };
    const anschlussfehler = (plan, netzInfo, erg) => {
        const raus = [];
        const teile = (plan.teile || []);
        const rollen = leiterrollen(plan, netzInfo);
        const nameVon = (t) => t.bmk || t.zeichen;
        const teileAn = (netz) => netzInfo.klemmen
            .filter(k => !k.intern && netzInfo.netzVon.get(k.schluessel) === netz)
            .map(k => k.teil);
        rollen.forEach((satz, netz) => {
            if (satz.size < 2)
                return;
            const liste = Array.from(satz).sort();
            const betroffen = teileAn(netz);
            const hatPE = liste.includes('PE');
            const hatN = liste.includes('N');
            const aussen = liste.filter(istAussen);
            const namen = liste.map(leiterName).join(' und ');
            if (aussen.length && hatPE) {
                raus.push({
                    art: 'l-pe', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — ein Aussenleiter ist auf den Schutzleiter verdrahtet.`,
                    warum: 'Der Schutzleiter führt dann volle Spannung, und mit ihm jedes '
                        + 'Gehäuse, das daran hängt: Waschmaschine, Herd, Bohrmaschine. '
                        + 'Wer eines davon anfasst, steht unter 230 V. Ein '
                        + 'Fehlerstromschutzschalter löst sofort aus, wenn einer da ist — '
                        + 'ist keiner da, merkt man es erst beim Anfassen.',
                    norm: 'Der Schutzleiter führt nie Betriebsspannung.'
                });
            }
            else if (aussen.length && hatN) {
                raus.push({
                    art: 'l-n', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — Aussenleiter und Neutralleiter sind kurzgeschlossen.`,
                    warum: 'Ohne Verbraucher dazwischen begrenzt nur der Leitungswiderstand '
                        + 'den Strom; es fliessen einige hundert bis einige tausend Ampere. '
                        + 'Der Leitungsschutzschalter schaltet in Millisekunden ab. '
                        + 'Es knallt, der Kontakt kann verschweissen, und die Leitung wird '
                        + 'auf ihrer ganzen Länge heiss.'
                });
            }
            else if (aussen.length >= 2) {
                raus.push({
                    art: 'l-l', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — zwei Aussenleiter sind zusammengeschaltet.`,
                    warum: 'Zwischen zwei Aussenleitern liegen 400 V, nicht 230 V. Der '
                        + 'Kurzschlussstrom ist entsprechend grösser als bei L gegen N, '
                        + 'und der Lichtbogen beim Abschalten ebenfalls. Sitzen die beiden '
                        + 'auf derselben Klemme eines Verbrauchers, bekommt er statt '
                        + 'Spannung gar keine — die Differenz ist dann null.'
                });
            }
            else if (hatN && hatPE) {
                raus.push({
                    art: 'n-pe', schwere: 'gefahr', teile: betroffen,
                    was: 'Neutralleiter und Schutzleiter liegen am selben Punkt — sie sind vertauscht oder gebrückt.',
                    warum: 'Und jetzt kommt das Gefährliche: es FUNKTIONIERT. Die Lampe '
                        + 'brennt, der Motor läuft, kein Messgerät schlägt aus — am '
                        + 'Sternpunkt sind die beiden ja verbunden. Nur führt der '
                        + 'Schutzleiter jetzt den Betriebsstrom und ist nicht mehr '
                        + 'spannungsfrei. Bricht er irgendwo, stehen alle daran '
                        + 'angeschlossenen Gehäuse unter Spannung. Ein '
                        + 'Fehlerstromschutzschalter sieht die Unsymmetrie und löst aus — '
                        + 'oder er löst dauernd aus, und jemand baut ihn aus.',
                    norm: 'Im TN-S-System werden N und PE ab der Trennstelle nicht wieder verbunden.'
                });
            }
        });
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.schutzklasse !== 1)
                return;
            const peKlemme = v.schutzklemme;
            if (!peKlemme)
                return;
            const netz = netzInfo.netzVon.get(`k:${t.id}:${peKlemme}`);
            const dran = typeof netz === 'number'
                && (rollen.get(netz)?.has('PE') ?? false);
            if (dran)
                return;
            raus.push({
                art: 'pe-fehlt', schwere: 'gefahr', teile: [t.id],
                was: `${nameVon(t)} ist ein Gerät der Schutzklasse I, aber Klemme ${peKlemme} hängt an keinem Schutzleiter.`,
                warum: 'Schutzklasse I heisst: die Isolation allein genügt nicht, das '
                    + 'Gehäuse ist aus Metall und MUSS geerdet sein. Ohne Schutzleiter '
                    + 'läuft das Gerät völlig normal — bis eine Wicklung durchschlägt. '
                    + 'Dann steht das Gehäuse unter Spannung, es fliesst kein '
                    + 'Fehlerstrom, und keine Schutzeinrichtung schaltet ab. Der '
                    + 'Fehler wird sichtbar, wenn ihn jemand anfasst.',
                norm: 'NIN: Schutzklasse I braucht den Schutzleiter, nicht wahlweise.'
            });
        });
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'schalter')
                return;
            const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
            let amN = false, amL = false;
            eigene.forEach(k => {
                const netz = netzInfo.netzVon.get(k.schluessel);
                if (typeof netz !== 'number')
                    return;
                const satz = rollen.get(netz);
                if (!satz)
                    return;
                if (satz.has('N'))
                    amN = true;
                if (Array.from(satz).some(istAussen))
                    amL = true;
            });
            if (!amN || amL)
                return;
            raus.push({
                art: 'schalter-in-n', schwere: 'fehler', teile: [t.id],
                was: `${nameVon(t)} sitzt im Neutralleiter statt im Aussenleiter.`,
                warum: 'Ausgeschaltet ist die Lampe dann zwar dunkel, aber der '
                    + 'Aussenleiter liegt weiterhin bis zur Fassung an. Wer die '
                    + 'Birne wechselt und dabei den Sockel berührt, bekommt einen '
                    + 'Schlag — obwohl der Schalter aus ist und alles danach aussieht, '
                    + 'als wäre es spannungsfrei.',
                norm: 'NIN 4.6.1.2.3.2 — Schalter gehören in den Aussenleiter. Der '
                    + 'Neutralleiter darf nur geschaltet werden, wenn der zugehörige '
                    + 'Aussenleiter gleichzeitig mitgeschaltet wird.'
            });
        });
        const FI_SCHWELLE = 0.03;
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || t.zeichen !== 'fi-schutzschalter')
                return;
            const fach = erg.teilwerte[t.id];
            if (!fach)
                return;
            const pole = Object.keys(fach);
            let re = 0, im = 0;
            pole.forEach(k => { const w = fach[k]; re += w.Ire; im += w.Iim; });
            const fehlstrom = Math.hypot(re, im);
            if (fehlstrom <= FI_SCHWELLE)
                return;
            const nPol = fach['N–N2'];
            const aussenFuehrt = pole.some(k => k !== 'N–N2'
                && Math.hypot(fach[k].Ire, fach[k].Iim) > SCHWELLE);
            if (aussenFuehrt && nPol
                && Math.hypot(nPol.Ire, nPol.Iim) <= SCHWELLE) {
                raus.push({
                    art: 'fi-halbe-messung', schwere: 'fehler', teile: [t.id],
                    was: `${nameVon(t)}: der Neutralleiter läuft nicht durch den Schutzschalter.`,
                    warum: 'Ein Fehlerstromschutzschalter vergleicht Hin- und Rückstrom. '
                        + 'Sieht er nur den Aussenleiter, ist die Differenz immer der '
                        + 'ganze Betriebsstrom — er löst beim Einschalten aus, und zwar '
                        + 'ohne dass irgendetwas defekt wäre. Wer dann den Fehler beim '
                        + 'Gerät sucht, sucht am falschen Ort. Beide Leiter müssen durch '
                        + 'ihn hindurch.'
                });
                return;
            }
            raus.push({
                art: 'fi-loest-aus', schwere: 'gefahr', teile: [t.id],
                was: `${nameVon(t)} löst aus: es fehlen ${zeige(fehlstrom, 'A')} — `
                    + `so viel fliesst am Neutralleiter vorbei.`,
                warum: 'Was hinfliesst, kommt nicht zurück. Der Strom nimmt einen '
                    + 'anderen Weg: über den Schutzleiter, über ein feuchtes Gehäuse '
                    + 'oder über einen Menschen. Ab etwa 30 mA wird es für den '
                    + 'Menschen gefährlich, und genau darauf ist der Schalter '
                    + 'eingestellt. Dass er auslöst, ist hier die gute Nachricht — '
                    + 'die schlechte ist, dass es einen Fehlerstrom gibt.'
            });
        });
        const hatN = Array.from(rollen.values()).some(x => x.has('N'));
        if (hatN && erg.verbindungen.length) {
            const v = verband();
            erg.verbindungen.forEach(([a, b]) => v.eins(`n:${a}`, `n:${b}`));
            const nWurzeln = new Set();
            rollen.forEach((satz, netz) => { if (satz.has('N'))
                nWurzeln.add(v.finde(`n:${netz}`)); });
            teile.forEach(t => {
                const vh = verhalten(t.zeichen);
                if (!vh)
                    return;
                if (vh.art !== 'widerstand' && vh.art !== 'spule')
                    return;
                const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
                const netze_ = eigene
                    .map(k => netzInfo.netzVon.get(k.schluessel))
                    .filter((x) => typeof x === 'number');
                if (!netze_.length)
                    return;
                const anAussen = netze_.filter(nz => Array.from(rollen.get(nz) || []).some(istAussen));
                if (anAussen.length !== 1)
                    return;
                const zurueck = netze_.filter(nz => !anAussen.includes(nz));
                if (!zurueck.length)
                    return;
                const kommtAn = zurueck.some(nz => nWurzeln.has(v.finde(`n:${nz}`)));
                if (kommtAn)
                    return;
                raus.push({
                    art: 'n-offen', schwere: 'gefahr', teile: [t.id],
                    was: `${nameVon(t)} hängt am Aussenleiter, aber der Rückweg zum Neutralleiter ist offen.`,
                    warum: 'Es fliesst kein Strom, das Gerät bleibt also dunkel oder still — '
                        + 'und sieht damit aus wie ausgeschaltet. Es ist aber nicht '
                        + 'spannungsfrei: die volle Spannung steht bis zur Unterbrechung '
                        + 'an, und der ganze Leiter dahinter liegt über das Gerät am '
                        + 'Aussenleiter. Im Drehstromnetz ist ein unterbrochener '
                        + 'Neutralleiter noch schlimmer: die einphasigen Verbraucher '
                        + 'liegen dann in Reihe zwischen zwei Aussenleitern, und wer wenig '
                        + 'Leistung hat, bekommt weit mehr als seine 230 V.'
                });
            });
        }
        return raus;
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
    const pruefeSchalter = (plan, schalterIds, zielId, soll) => {
        if (!Array.isArray(plan?.teile) || !Array.isArray(plan?.leitungen) ||
            plan.teile.length > 120 || plan.leitungen.length > 200)
            throw new Error('Für den Prüflauf einen Teilplan mit höchstens 120 Bauteilen und 200 Leitungen wählen.');
        const bauteile = plan.teile;
        const teile = new Map();
        for (const teil of bauteile) {
            if (typeof teil?.id !== 'string' || !teil.id || teile.has(teil.id))
                throw new Error('Die Bauteilkennungen müssen eindeutig sein.');
            teile.set(teil.id, teil);
        }
        const nichtModelliert = bauteile.filter(teil => !verhalten(teil.zeichen))
            .map(teil => ({ id: teil.id, symbol: teil.zeichen }));
        if (nichtModelliert.length)
            return { status: 'nicht_modelliert', nichtModelliert, faelle: [] };
        if (!teile.has(zielId))
            throw new Error('Das zu prüfende Bauteil fehlt.');
        if (!schalterIds.length || schalterIds.length > 6 || new Set(schalterIds).size !== schalterIds.length)
            throw new Error('Ein bis sechs verschiedene Handschalter angeben.');
        const anzahlJeSchalter = schalterIds.map(id => {
            const modell = verhalten(teile.get(id)?.zeichen ?? '');
            if (!modell?.stellungen || modell.stellungen.length < 2 || modell.folgtSpule)
                throw new Error('Kein manuell umschaltbares Bauteil: ' + id);
            return modell.stellungen.length;
        });
        const anzahl = anzahlJeSchalter.reduce((produkt, n) => produkt * n, 1);
        if (anzahl > 32 || soll.length !== anzahl || Array.from(soll).some(wert => typeof wert !== 'boolean'))
            throw new Error('Genau einen booleschen Sollwert je Kombination angeben. Höchstens 32 Kombinationen je Prüfauftrag.');
        const faelle = Array.from({ length: anzahl }, (_wert, index) => {
            let rest = index;
            const stellung = Object.create(null);
            for (let spalte = schalterIds.length - 1; spalte >= 0; spalte--) {
                const basis = anzahlJeSchalter[spalte];
                stellung[schalterIds[spalte]] = rest % basis;
                rest = Math.floor(rest / basis);
            }
            const ergebnis = rechne(plan, stellung);
            const glieder = Object.values(ergebnis.teilwerte[zielId] ?? {});
            const messung = ergebnis.werte[zielId];
            const messbar = messung || glieder.length;
            const ist = ergebnis.ok && ergebnis.konvergiert && messbar
                ? (glieder.length ? glieder.some(wert => wert.fliesst) : messung.fliesst) : null;
            return { stellung, erwartet: soll[index], ist, bestanden: ist === soll[index],
                fehler: ergebnis.fehler, anschlussfehler: ergebnis.anschlussfehler,
                warnungen: ergebnis.warnungen, annahmen: ergebnis.annahmen };
        });
        return { status: faelle.every(fall => fall.bestanden) ? 'bestanden' : 'fehlgeschlagen',
            faelle, nichtModelliert };
    };
    return {
        VERHALTEN, verhalten, stellungenVon, netze, rechne, pruefeSchalter, zeige, loese,
        loeseKomplex, leiterrollen,
        klemmen, aufStrecke
    };
})();
window.Stromfluss = Stromfluss;
