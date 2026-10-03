"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/aufgaben.ts (npm run bauen:ts). */
const Elektroaufgaben = (() => {
    const wuerfel = (saat) => {
        let a = saat >>> 0;
        const naechste = () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        return {
            bis: (n) => Math.floor(naechste() * n),
            aus: (liste) => liste[Math.floor(naechste() * liste.length)],
            misch: (liste) => {
                const k = liste.slice();
                for (let i = k.length - 1; i > 0; i--) {
                    const j = Math.floor(naechste() * (i + 1));
                    const h = k[i];
                    k[i] = k[j];
                    k[j] = h;
                }
                return k;
            },
            wert: (von, bis) => {
                const stufen = [1, 1.2, 1.5, 1.8, 2, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
                const kandidaten = [];
                for (let e = -3; e <= 6; e++)
                    for (const s of stufen) {
                        const w = s * Math.pow(10, e);
                        if (w >= von && w <= bis)
                            kandidaten.push(Number(w.toPrecision(3)));
                    }
                if (!kandidaten.length)
                    return Number(((von + bis) / 2).toPrecision(3));
                return kandidaten[Math.floor(naechste() * kandidaten.length)];
            }
        };
    };
    const FZ = () => (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen : null;
    const FORMELN = () => (typeof Register !== 'undefined' && Register.elektroformeln)
        ? Register.elektroformeln : null;
    const zeichenName = (w, saat) => {
        const fz = FZ();
        if (!fz)
            return null;
        const alle = fz.alle();
        if (alle.length < 4)
            return null;
        const richtig = w.aus(alle);
        const nachbarn = fz.inGruppe(richtig.gruppe).filter((x) => x.id !== richtig.id);
        const fremde = alle.filter((x) => x.gruppe !== richtig.gruppe);
        const ablenker = w.misch(nachbarn).slice(0, 3);
        while (ablenker.length < 3 && fremde.length) {
            const k = w.aus(fremde);
            if (!ablenker.some((x) => x.id === k.id))
                ablenker.push(k);
        }
        const auswahl = w.misch([richtig, ...ablenker]);
        return {
            art: 'zeichen-name', antwortart: 'wahl',
            frage: 'Wie heisst dieses Fachzeichen?',
            zeichen: richtig.id,
            optionen: auswahl.map((x) => x.name),
            loesung: richtig.name,
            erklaerung: richtig.erklaerung,
            stufe: nachbarn.length >= 3 ? 2 : 1, saat
        };
    };
    const nameZeichen = (w, saat) => {
        const fz = FZ();
        if (!fz)
            return null;
        const alle = fz.alle();
        if (alle.length < 4)
            return null;
        const richtig = w.aus(alle);
        const nachbarn = fz.inGruppe(richtig.gruppe).filter((x) => x.id !== richtig.id);
        const ablenker = w.misch(nachbarn).slice(0, 3);
        while (ablenker.length < 3) {
            const k = w.aus(alle);
            if (k.id !== richtig.id && !ablenker.some((x) => x.id === k.id))
                ablenker.push(k);
        }
        const auswahl = w.misch([richtig, ...ablenker]);
        return {
            art: 'name-zeichen', antwortart: 'wahl',
            frage: `Welches Zeichen ist „${richtig.name}"?`,
            optionen: auswahl.map((x) => x.name),
            optionZeichen: auswahl.map((x) => x.id),
            loesung: richtig.name,
            erklaerung: richtig.erklaerung,
            stufe: 2, saat
        };
    };
    const zeichenGruppe = (w, saat) => {
        const fz = FZ();
        if (!fz)
            return null;
        const gruppen = fz.gruppen();
        if (gruppen.length < 4)
            return null;
        const richtig = w.aus(fz.alle());
        const andere = gruppen.filter((g) => g[0] !== richtig.gruppe);
        const auswahl = w.misch([richtig.gruppe, ...w.misch(andere).slice(0, 3).map((g) => g[0])]);
        return {
            art: 'zeichen-gruppe', antwortart: 'wahl',
            frage: `Zu welcher Gruppe gehört „${richtig.name}"?`,
            zeichen: richtig.id,
            optionen: auswahl.map((g) => fz.gruppenName(g)),
            loesung: fz.gruppenName(richtig.gruppe),
            erklaerung: `${richtig.name} steht bei „${fz.gruppenName(richtig.gruppe)}". ${richtig.erklaerung}`,
            stufe: 1, saat
        };
    };
    const anschluesse = (w, saat) => {
        const fz = FZ();
        if (!fz)
            return null;
        const taugt = fz.alle().filter((x) => (x.anschluesse || []).length >= 2 &&
            (x.anschluesse || []).some((a) => a.nr && !/^[12]$/.test(a.nr)));
        if (taugt.length < 4)
            return null;
        const richtig = w.aus(taugt);
        const nummern = richtig.anschluesse.map(a => a.nr).join(', ');
        const ablenker = [];
        for (const x of w.misch(taugt.filter(y => y.id !== richtig.id))) {
            const kandidat = x.anschluesse.map(a => a.nr).join(', ');
            if (kandidat !== nummern && !ablenker.includes(kandidat))
                ablenker.push(kandidat);
            if (ablenker.length === 3)
                break;
        }
        if (ablenker.length < 3)
            return null;
        const auswahl = w.misch([nummern, ...ablenker]);
        return {
            art: 'anschluesse', antwortart: 'wahl',
            frage: `Welche Anschlussnummern hat „${richtig.name}"?`,
            zeichen: richtig.id,
            optionen: auswahl,
            loesung: nummern,
            erklaerung: `${richtig.name} hat die Anschlüsse ${nummern}. ${richtig.erklaerung}`,
            stufe: 3, saat
        };
    };
    const kennbuchstabe = (w, saat) => {
        const fz = FZ();
        if (!fz)
            return null;
        const mitBuchstabe = fz.alle().filter((x) => x.kennbuchstabe);
        if (mitBuchstabe.length < 4)
            return null;
        const richtig = w.aus(mitBuchstabe);
        const buchstaben = [...new Set(mitBuchstabe.map((x) => x.kennbuchstabe))];
        if (buchstaben.length < 4)
            return null;
        const auswahl = w.misch([richtig.kennbuchstabe,
            ...w.misch(buchstaben.filter(b => b !== richtig.kennbuchstabe)).slice(0, 3)]);
        return {
            art: 'kennbuchstabe', antwortart: 'wahl',
            frage: `Welchen Kennbuchstaben trägt „${richtig.name}" im Betriebsmittelkennzeichen?`,
            zeichen: richtig.id,
            optionen: auswahl,
            loesung: richtig.kennbuchstabe,
            erklaerung: `${richtig.name} bekommt den Kennbuchstaben ${richtig.kennbuchstabe} — ` +
                `also ${richtig.kennbuchstabe}1, ${richtig.kennbuchstabe}2 und so weiter.`,
            stufe: 2, saat
        };
    };
    const BEREICHE = {
        U: [1, 400], I: [0.01, 63], R: [1, 100000], P: [1, 10000],
        t: [0.1, 24], W: [1, 100], l: [1, 200], A: [0.75, 35],
        n: [1, 20], f: [16, 400], C: [1e-6, 1e-3], L: [0.001, 1]
    };
    const BEREICH_EINHEIT = {
        V: [0.1, 1000], A: [1e-4, 100], Ω: [0.1, 1e6], W: [0.1, 20000],
        Hz: [1, 1000], s: [1e-3, 100000], F: [1e-9, 0.01], H: [1e-4, 10],
        'kWh': [0.01, 5000], 'mm²': [0.5, 240], m: [0.5, 1000], 'V/A': [0.1, 1e6]
    };
    const rechnen = (w, saat) => {
        const R = FORMELN();
        if (!R)
            return null;
        const alle = R.alle().filter((f) => Object.keys(f.loese || {}).length);
        if (!alle.length)
            return null;
        for (let versuch = 0; versuch < 30; versuch++) {
            const f = w.aus(alle);
            const loesbar = R.loesbarNach(f.id);
            if (!loesbar.length)
                continue;
            const gesucht = w.aus(loesbar);
            const einheitVon = (z) => (f.groessen.find(g => g.zeichen === z) || { einheit: '' }).einheit || '';
            const werte = {};
            f.groessen.forEach(g => {
                if (g.zeichen === gesucht)
                    return;
                const b = BEREICHE[g.zeichen] || [1, 100];
                werte[g.zeichen] = w.wert(b[0], b[1]);
            });
            const erg = R.rechne(f.id, gesucht, werte);
            if (!erg || !erg.ok)
                continue;
            const wert = erg.wert;
            if (!Number.isFinite(wert))
                continue;
            if (wert <= 0)
                continue;
            const nachZeichen = BEREICHE[gesucht];
            const nachEinheit = BEREICH_EINHEIT[einheitVon(gesucht)];
            if (nachZeichen) {
                if (wert < nachZeichen[0] / 3 || wert > nachZeichen[1] * 3)
                    continue;
            }
            else if (nachEinheit) {
                if (wert < nachEinheit[0] || wert > nachEinheit[1])
                    continue;
            }
            else if (wert < 1e-6 || wert > 1e7)
                continue;
            const gegeben = f.groessen
                .filter(g => g.zeichen !== gesucht)
                .map(g => `${g.zeichen} = ${werte[g.zeichen]} ${g.einheit}`.trim())
                .join(', ');
            const aufgabe = {
                art: 'rechnen', antwortart: 'zahl',
                frage: `${f.schreibweise}\nGegeben: ${gegeben}\nGesucht: ${gesucht}`,
                loesung: String(Number(wert.toPrecision(6))),
                toleranz: 1,
                einheit: einheitVon(gesucht),
                erklaerung: f.erklaerung,
                stufe: f.groessen.length > 3 ? 3 : 2, saat
            };
            if (erg.weg && erg.weg.length)
                aufgabe.weg = erg.weg;
            return aufgabe;
        }
        return null;
    };
    const VORSAETZE = [
        ['p', 1e-12], ['n', 1e-9], ['µ', 1e-6], ['m', 1e-3], ['', 1],
        ['k', 1e3], ['M', 1e6], ['G', 1e9]
    ];
    const GROESSEN = [
        ['A', 'Strom', ['µ', 'm', '', 'k']],
        ['V', 'Spannung', ['m', '', 'k']],
        ['Ω', 'Widerstand', ['m', '', 'k', 'M']],
        ['W', 'Leistung', ['m', '', 'k', 'M']],
        ['F', 'Kapazität', ['p', 'n', 'µ', 'm']],
        ['H', 'Induktivität', ['µ', 'm', '']],
        ['Hz', 'Frequenz', ['', 'k', 'M']],
        ['s', 'Zeit', ['n', 'µ', 'm', '']]
    ];
    const faktor = (vorsatz) => (VORSAETZE.find(v => v[0] === vorsatz) || ['', 1])[1];
    const sauber = (x) => Number(x.toPrecision(12));
    const umrechnen = (w, saat) => {
        const [einheit, name, erlaubt] = w.aus(GROESSEN);
        const von = w.aus(erlaubt);
        const abstand = (a, b) => Math.abs(Math.log10(faktor(a) / faktor(b)));
        const nah = erlaubt.filter(x => x !== von && abstand(x, von) <= 6.5);
        if (!nah.length)
            return null;
        const nach = w.aus(nah);
        const zahl = w.wert(1, 1000);
        const wert = sauber(zahl * faktor(von) / faktor(nach));
        if (!Number.isFinite(wert) || wert === 0)
            return null;
        return {
            art: 'umrechnen', antwortart: 'zahl',
            frage: `${name}: ${zahl} ${von}${einheit} sind wie viel ${nach}${einheit}?`,
            loesung: String(wert),
            toleranz: 0.01,
            einheit: nach + einheit,
            erklaerung: `${von || 'Ohne Vorsatz'}${einheit} ist ${faktor(von)} ${einheit}, ` +
                `${nach || 'ohne Vorsatz'}${einheit} ist ${faktor(nach)} ${einheit}. ` +
                `Also mal ${sauber(faktor(von) / faktor(nach))}.`,
            weg: (nach === '')
                ? [`${zahl} ${von}${einheit}`,
                    `= ${zahl} · ${faktor(von)} ${einheit}`,
                    `= ${wert} ${einheit}`]
                : [`${zahl} ${von}${einheit}`,
                    `= ${zahl} · ${faktor(von)} ${einheit} = ${sauber(zahl * faktor(von))} ${einheit}`,
                    `= ${wert} ${nach}${einheit}`],
            stufe: Math.abs(Math.log10(faktor(von) / faktor(nach))) > 3 ? 3 : 2, saat
        };
    };
    const planBauen = (teile, draehte) => {
        const SP = (typeof Schaltplan !== 'undefined') ? Schaltplan : null;
        if (!SP)
            return null;
        const plan = SP.neuerPlan('stromlauf-aufgeloest');
        plan.teile = [];
        plan.leitungen = [];
        plan.texte = [];
        const REIHE_Y = 260;
        const ABSTAND = 200;
        teile.forEach(([zeichen, bmk], i) => {
            plan.teile.push({
                id: 't' + (i + 1), zeichen, bmk,
                x: 60 + i * ABSTAND, y: REIHE_Y,
                drehung: 0, gespiegelt: false, nummern: {}, gruppe: '', ebene: 'plan'
            });
        });
        let maxH = 60;
        plan.teile.forEach(t => {
            const m = (typeof Register !== 'undefined' && Register.fachzeichen)
                ? Register.fachzeichen.masse(t.zeichen, 0) : { w: 60, h: 60 };
            if (m.h > maxH)
                maxH = m.h;
        });
        const UNTEN_Y = REIHE_Y + maxH;
        const rechts = 60 + teile.length * ABSTAND + 40;
        const ort = (i, nr) => {
            const t = plan.teile[i];
            if (!t)
                return { x: 0, y: 0, obenDran: true };
            const a = SP.anschluesseVon(t).find(x => x.nr === nr);
            if (!a)
                return { x: t.x, y: t.y, obenDran: true };
            return { x: a.x, y: a.y, obenDran: (a.y - t.y) < maxH / 2 };
        };
        draehte.forEach(([a, an, b, bn], i) => {
            const A = ort(a, an), B = ort(b, bn);
            const ta = plan.teile[a], tb = plan.teile[b];
            if (!ta || !tb)
                return;
            const obenBahn = REIHE_Y - 40 - i * 16;
            const untenBahn = UNTEN_Y + 40 + i * 16;
            let punkte;
            if (A.x === B.x && A.obenDran === B.obenDran) {
                punkte = [{ x: A.x, y: A.y }, { x: B.x, y: B.y }];
            }
            else if (A.obenDran && B.obenDran) {
                punkte = [{ x: A.x, y: A.y }, { x: A.x, y: obenBahn },
                    { x: B.x, y: obenBahn }, { x: B.x, y: B.y }];
            }
            else if (!A.obenDran && !B.obenDran) {
                punkte = [{ x: A.x, y: A.y }, { x: A.x, y: untenBahn },
                    { x: B.x, y: untenBahn }, { x: B.x, y: B.y }];
            }
            else {
                const oben = A.obenDran ? A : B;
                const unten = A.obenDran ? B : A;
                const spalte = rechts + i * 16;
                punkte = [
                    { x: oben.x, y: oben.y }, { x: oben.x, y: obenBahn },
                    { x: spalte, y: obenBahn }, { x: spalte, y: untenBahn },
                    { x: unten.x, y: untenBahn }, { x: unten.x, y: unten.y }
                ];
            }
            plan.leitungen.push({
                id: 'l' + (i + 1), ebene: 'plan', punkte,
                vonTeil: ta.id, vonNr: an, nachTeil: tb.id, nachNr: bn
            });
        });
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        const dazu = (x, y) => {
            if (x < x1)
                x1 = x;
            if (x > x2)
                x2 = x;
            if (y < y1)
                y1 = y;
            if (y > y2)
                y2 = y;
        };
        plan.teile.forEach(t => {
            const m = (typeof Register !== 'undefined' && Register.fachzeichen)
                ? Register.fachzeichen.masse(t.zeichen, t.drehung) : { w: 60, h: 60 };
            dazu(t.x, t.y);
            dazu(t.x + m.w + 34, t.y + m.h + 4);
        });
        plan.leitungen.forEach(l => l.punkte.forEach(pt => dazu(pt.x, pt.y)));
        if (Number.isFinite(x1)) {
            const rand = 24;
            const dx = x1 - rand, dy = y1 - rand;
            plan.teile.forEach(t => { t.x -= dx; t.y -= dy; });
            plan.leitungen.forEach(l => l.punkte.forEach(pt => { pt.x -= dx; pt.y -= dy; }));
            plan.breite = Math.max(120, Math.round(x2 - x1 + rand * 2));
            plan.hoehe = Math.max(120, Math.round(y2 - y1 + rand * 2));
        }
        return plan;
    };
    const bruecke = (plan, teil, vonNr, nachNr, id) => {
        if (typeof Schaltplan === 'undefined')
            return false;
        const kl = Schaltplan.anschluesseVon(teil);
        const a = kl.find(k => String(k.nr) === vonNr);
        const b = kl.find(k => String(k.nr) === nachNr);
        if (!a || !b)
            return false;
        let tiefste = 0;
        plan.leitungen.forEach(l => l.punkte.forEach(pt => { if (pt.y > tiefste)
            tiefste = pt.y; }));
        const bahn = Math.max(tiefste, a.y, b.y) + 26;
        plan.leitungen.push({ id, ebene: 'plan',
            punkte: [{ x: a.x, y: a.y }, { x: a.x, y: bahn },
                { x: b.x, y: bahn }, { x: b.x, y: b.y }],
            vonTeil: teil.id, vonNr, nachTeil: teil.id, nachNr });
        plan.hoehe = Math.max(Number(plan.hoehe) || 0, Math.round(bahn + 24));
        return true;
    };
    const anschreiben = (plan, teil, text, id) => {
        if (!Array.isArray(plan.texte))
            plan.texte = [];
        plan.texte.push({ id, ebene: 'plan', x: teil.x, y: teil.y - 10, t: text });
    };
    const SCHALTUNGEN = [
        { name: 'Ausschaltung', wozu: 'Eine Leuchte von einer Stelle schalten.', stufe: 1,
            teile: [['wechselspannung', 'G1'], ['ch-schema0', 'S1'], ['lampe', 'E1']],
            draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N']] },
        { name: 'Serienschaltung zweier Leuchten',
            wozu: 'Zwei Leuchten in Reihe — beide bekommen die halbe Spannung.', stufe: 2,
            teile: [['wechselspannung', 'G1'], ['lampe', 'E1'], ['lampe', 'E2']],
            draehte: [[0, 'L', 1, 'X1'], [1, 'X2', 2, 'X1'], [2, 'X2', 0, 'N']] },
        { name: 'Parallelschaltung zweier Leuchten',
            wozu: 'Zwei Leuchten parallel — jede bekommt die volle Spannung.', stufe: 2,
            teile: [['wechselspannung', 'G1'], ['lampe', 'E1'], ['lampe', 'E2']],
            draehte: [[0, 'L', 1, 'X1'], [0, 'L', 2, 'X1'], [1, 'X2', 0, 'N'], [2, 'X2', 0, 'N']] },
        { name: 'Zwei Leuchten, je ein eigener Schalter',
            wozu: 'Zwei Zweige nebeneinander — jeder Schalter bedient nur seinen.',
            stufe: 2,
            teile: [['wechselspannung', 'G1'], ['ch-schema0', 'S1'], ['lampe', 'E1'],
                ['ch-schema0', 'S2'], ['lampe', 'E2']],
            draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N'],
                [0, 'L', 3, '3'], [3, '4', 4, 'X1'], [4, 'X2', 0, 'N']] },
        { name: 'Wechselschaltung (Schema 3)',
            wozu: 'Eine Leuchte von zwei Stellen schalten.', stufe: 2,
            teile: [['wechselspannung', 'G1'], ['ch-schema3', 'S1'], ['ch-schema3', 'S2'],
                ['lampe', 'E1']],
            draehte: [[0, 'L', 1, '3'], [1, '1', 2, '1'], [1, '2', 2, '2'],
                [2, '3', 3, 'X1'], [3, 'X2', 0, 'N']] },
        { name: 'Selbsthaltung', wozu: 'Start drücken, loslassen, das Schütz hält sich.', stufe: 3,
            teile: [['wechselspannung', 'G1'], ['taster-oeffner', 'S0'], ['taster-schliesser', 'S1'],
                ['schuetz-schliesser', 'K1'], ['spule', 'K1']],
            draehte: [[0, 'L', 1, '1'], [1, '2', 2, '3'], [1, '2', 3, '13'],
                [2, '4', 4, 'A1'], [3, '14', 4, 'A1'], [4, 'A2', 0, 'N']] },
        { name: 'Motor mit Schütz und Überlastrelais',
            wozu: 'Ein Motor wird nicht von Hand geschaltet, sondern über ein Schütz.', stufe: 3,
            teile: [['wechselspannung', 'G1'], ['leitungsschutzschalter', 'F1'],
                ['schuetz-hauptkontakt', 'K1'], ['motor-wechselstrom', 'M1']],
            draehte: [[0, 'L', 1, '1'], [1, '2', 2, '1'], [2, '2', 3, 'U1'],
                [3, 'U2', 0, 'N']] },
        { name: 'UND-Verknüpfung',
            wozu: 'Zwei Kontakte HINTEREINANDER: die Spule zieht nur an, wenn beide zu sind.',
            stufe: 2,
            teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
                ['taster-schliesser', 'S2'], ['spule', 'K1'], ['signalleuchte', 'H1']],
            draehte: [[0, 'L', 1, '3'], [1, '4', 2, '3'], [2, '4', 3, 'A1'],
                [3, 'A2', 0, 'N'], [2, '4', 4, 'X1'], [4, 'X2', 0, 'N']] },
        { name: 'ODER-Verknüpfung',
            wozu: 'Zwei Kontakte NEBENEINANDER: einer genügt, damit die Spule anzieht.',
            stufe: 2,
            teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
                ['taster-schliesser', 'S2'], ['spule', 'K1'], ['signalleuchte', 'H1']],
            draehte: [[0, 'L', 1, '3'], [0, 'L', 2, '3'], [1, '4', 3, 'A1'],
                [2, '4', 3, 'A1'], [3, 'A2', 0, 'N'], [3, 'A1', 4, 'X1'],
                [4, 'X2', 0, 'N']] },
        { name: 'Zeitrelais, anzugsverzögert',
            wozu: 'Nach dem Einschalten vergeht Zeit, bevor der Kontakt schliesst.',
            stufe: 3,
            teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
                ['spule-anzugsverzoegert', 'K1'], ['schuetz-schliesser', 'K1'],
                ['signalleuchte', 'H1']],
            draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'A1'], [2, 'A2', 0, 'N'],
                [0, 'L', 3, '13'], [3, '14', 4, 'X1'], [4, 'X2', 0, 'N']] },
        { name: 'Schützschaltung mit Meldeleuchte',
            wozu: 'Die Leuchte zeigt an, dass das Schütz angezogen hat.', stufe: 3,
            teile: [['wechselspannung', 'G1'], ['taster-oeffner', 'S0'],
                ['taster-schliesser', 'S1'], ['spule', 'K1'],
                ['schuetz-schliesser', 'K1'], ['signalleuchte', 'H1']],
            draehte: [[0, 'L', 1, '1'], [1, '2', 2, '3'], [2, '4', 3, 'A1'],
                [3, 'A2', 0, 'N'], [0, 'L', 4, '13'], [4, '14', 5, 'X1'],
                [5, 'X2', 0, 'N']] },
        { name: 'Treppenhausautomat',
            wozu: 'Von mehreren Stellen drücken, das Licht geht nach einer Zeit von selbst aus.',
            stufe: 2,
            teile: [['wechselspannung', 'G1'], ['bp-minuterie', 'K1'],
                ['taster-schliesser', 'S1'], ['taster-schliesser', 'S2'],
                ['lampe', 'E1']],
            draehte: [[0, 'L', 2, '3'], [0, 'L', 3, '3'],
                [2, '4', 1, '1'], [3, '4', 1, '1'],
                [1, '2', 4, 'X1'], [4, 'X2', 0, 'N']] },
        { name: 'Sonnerie mit Drucktaster',
            wozu: 'Die Türklingel — der einfachste Kreis, den es im Haus gibt.', stufe: 1,
            teile: [['wechselspannung', 'G1'], ['taster-schliesser', 'S1'],
                ['bp-sonnerie', 'H1']],
            draehte: [[0, 'L', 1, '3'], [1, '4', 2, 'X1'], [2, 'X2', 0, 'N']] }
    ];
    const planLuecke = (w, saat) => {
        const fz = FZ();
        if (!fz || typeof Schaltplan === 'undefined')
            return null;
        const v = w.aus(SCHALTUNGEN);
        const plan = planBauen(v.teile, v.draehte);
        if (!plan)
            return null;
        const wahl = plan.teile
            .map((t, i) => ({ t, i }))
            .filter(x => x.t.zeichen !== 'wechselspannung');
        if (!wahl.length)
            return null;
        const raus = w.aus(wahl);
        const fehlt = fz.holen(raus.t.zeichen);
        if (!fehlt)
            return null;
        plan.teile.splice(raus.i, 1);
        plan.leitungen = plan.leitungen.filter((l) => l.vonTeil !== raus.t.id && l.nachTeil !== raus.t.id);
        const anschliessbar = (x) => (x.anschluesse || []).length >= 2;
        const gleicheGruppe = fz.inGruppe(fehlt.gruppe)
            .filter(x => x.id !== fehlt.id && anschliessbar(x));
        const ablenker = w.misch(gleicheGruppe).slice(0, 3);
        const rest = w.misch(fz.alle().filter(anschliessbar));
        for (const k of rest) {
            if (ablenker.length >= 3)
                break;
            if (k.id !== fehlt.id && !ablenker.some(x => x.id === k.id))
                ablenker.push(k);
        }
        if (ablenker.length < 3)
            return null;
        const auswahl = w.misch([fehlt, ...ablenker]);
        return {
            art: 'plan-luecke', antwortart: 'wahl',
            frage: `${v.name}: ${v.wozu}\nWelches Bauteil fehlt in diesem Plan (${raus.t.bmk})?`,
            plan,
            optionen: auswahl.map((x) => x.name),
            optionZeichen: auswahl.map((x) => x.id),
            loesung: fehlt.name,
            erklaerung: `${raus.t.bmk} ist ein ${fehlt.name}. ${fehlt.erklaerung}`,
            stufe: v.stufe, saat
        };
    };
    const planFunktion = (w, saat) => {
        if (typeof Schaltplan === 'undefined')
            return null;
        const v = w.aus(SCHALTUNGEN);
        const plan = planBauen(v.teile, v.draehte);
        if (!plan)
            return null;
        const andere = w.misch(SCHALTUNGEN.filter(x => x.name !== v.name)).slice(0, 3);
        const auswahl = w.misch([v, ...andere]);
        return {
            art: 'plan-funktion', antwortart: 'wahl',
            frage: 'Was ist das für eine Schaltung?',
            plan,
            optionen: auswahl.map(x => x.name),
            loesung: v.name,
            erklaerung: v.wozu,
            stufe: v.stufe, saat
        };
    };
    const bmkBenennen = (w, saat) => {
        const fz = FZ();
        if (!fz || typeof Schaltplan === 'undefined')
            return null;
        const v = w.aus(SCHALTUNGEN);
        const plan = planBauen(v.teile, v.draehte);
        if (!plan)
            return null;
        const t = w.aus(plan.teile);
        const zeichen = fz.holen(t.zeichen);
        if (!zeichen)
            return null;
        const alleBmk = [...new Set(plan.teile.map(x => x.bmk))];
        if (alleBmk.length < 4)
            return null;
        return {
            art: 'bmk-benennen', antwortart: 'wahl',
            frage: `${v.name}: Welches Betriebsmittel ist der/die/das „${zeichen.name}"?`,
            plan,
            optionen: w.misch([t.bmk, ...w.misch(alleBmk.filter(b => b !== t.bmk)).slice(0, 3)]),
            loesung: t.bmk,
            erklaerung: `${t.bmk} ist ${zeichen.name}. Der Kennbuchstabe ` +
                `${zeichen.kennbuchstabe} sagt schon, um welche Art Bauteil es geht.`,
            stufe: 2, saat
        };
    };
    const messenWo = (w, saat) => {
        const geraet = w.aus(['Amperemeter', 'Voltmeter']);
        const strom = geraet === 'Amperemeter';
        const optionen = w.misch([
            'in Reihe mit dem Verbraucher',
            'parallel zum Verbraucher',
            'zwischen L und PE',
            'parallel zur Quelle und in Reihe zum Verbraucher zugleich'
        ]);
        return {
            art: 'messen-wo', antwortart: 'wahl',
            frage: `Wie wird ein ${geraet} angeschlossen?`,
            optionen,
            loesung: strom ? 'in Reihe mit dem Verbraucher' : 'parallel zum Verbraucher',
            erklaerung: strom
                ? 'Ein Amperemeter misst den Strom, der DURCH es hindurchfliesst — es muss ' +
                    'also im Stromweg liegen. Sein Innenwiderstand ist fast null; parallel ' +
                    'geschaltet wäre es ein Kurzschluss.'
                : 'Ein Voltmeter misst den Unterschied ZWISCHEN zwei Punkten — es liegt ' +
                    'also daneben. Sein Innenwiderstand ist sehr hoch; in Reihe geschaltet ' +
                    'würde es den Stromkreis unterbrechen.',
            stufe: 2, saat
        };
    };
    const SF = () => (typeof Stromfluss !== 'undefined') ? Stromfluss : null;
    const besteStellung = (plan) => {
        const sf = SF();
        const stand = {};
        if (!sf)
            return stand;
        const schalter = plan.teile.filter(t => sf.stellungenVon(t.zeichen).length > 1);
        const hellMit = (s) => {
            const e = leuchtet(plan, s);
            if (!e.ok)
                return -1;
            return e.hell + Math.min(1, e.strom * 10);
        };
        for (let runde = 0; runde < 2; runde++) {
            schalter.forEach(t => {
                const st = sf.stellungenVon(t.zeichen);
                let beste = stand[t.id] ?? 0;
                let bestHell = hellMit(Object.assign({}, stand, { [t.id]: beste }));
                for (let i = 0; i < st.length; i++) {
                    const h = hellMit(Object.assign({}, stand, { [t.id]: i }));
                    if (h > bestHell) {
                        bestHell = h;
                        beste = i;
                    }
                }
                stand[t.id] = beste;
            });
        }
        return stand;
    };
    const leuchtet = (plan, stellung) => {
        const sf = SF();
        if (!sf)
            return { ok: false, hell: 0, strom: 0, quellStrom: 0, wirkt: false, warnungen: 0, texte: [] };
        const e = sf.rechne(plan, stellung);
        if (!e || !e.ok)
            return { ok: false, hell: 0, strom: 0, quellStrom: 0, wirkt: false,
                warnungen: 1, texte: [String((e && e.fehler) || '')] };
        let hell = 0, strom = 0, quellStrom = 0;
        plan.teile.forEach(t => {
            const vh = sf.verhalten(t.zeichen);
            if (!vh || vh.art !== 'quelle')
                return;
            const w3 = e.werte[t.id];
            if (w3)
                quellStrom = Math.max(quellStrom, Math.abs(w3.I));
        });
        plan.teile.forEach(t => {
            const vh = sf.verhalten(t.zeichen);
            if (!vh || (vh.art !== 'widerstand' && vh.art !== 'spule'))
                return;
            const w2 = e.werte[t.id];
            if (!w2)
                return;
            if (typeof w2.helligkeit === 'number' && w2.helligkeit > hell)
                hell = w2.helligkeit;
            const i = Math.abs(w2.I);
            if (i > strom)
                strom = i;
        });
        return { ok: true, hell, strom, quellStrom,
            wirkt: hell > 0.02 || strom > 1e-4,
            warnungen: (e.warnungen || []).length,
            texte: (e.warnungen || []).slice() };
    };
    const muster = (plan) => {
        const sf = SF();
        if (!sf)
            return '';
        const schalter = plan.teile.filter(t => {
            const vh = sf.verhalten(t.zeichen);
            return vh && vh.art === 'schalter' && !vh.folgtSpule;
        });
        let liste = [{}];
        for (const t of schalter) {
            const st = sf.stellungenVon(t.zeichen);
            const neu = [];
            for (const bisher of liste)
                for (let i = 0; i < st.length; i++)
                    neu.push({ ...bisher, [t.id]: i });
            liste = neu;
            if (liste.length > 64)
                break;
        }
        return liste.map(st => {
            const e = leuchtet(plan, st);
            return !e.ok ? 'x' : e.hell > 0.8 ? 'H' : e.hell > 0.02 ? 'h'
                : e.strom > 1e-4 ? 's' : '.';
        }).join('');
    };
    const planLeitung = (w, saat) => {
        if (typeof Schaltplan === 'undefined' || !SF())
            return null;
        for (let versuch = 0; versuch < 14; versuch++) {
            const v = w.aus(SCHALTUNGEN);
            const ganz = planBauen(v.teile, v.draehte);
            if (!ganz || ganz.leitungen.length < 3)
                continue;
            const alleZu = besteStellung(ganz);
            const vorher = leuchtet(ganz, alleZu);
            if (!vorher.ok || !vorher.wirkt)
                continue;
            const raus = w.aus(ganz.leitungen);
            if (!raus.vonTeil || !raus.nachTeil)
                continue;
            const kaputt = planBauen(v.teile, v.draehte);
            kaputt.leitungen = kaputt.leitungen.filter((l) => l.id !== raus.id);
            const sollMuster = muster(ganz);
            const kaputtMuster = muster(kaputt);
            if (kaputtMuster === sollMuster)
                continue;
            const name = (id) => (kaputt.teile.concat(ganz.teile)
                .find((t) => t.id === id) || { bmk: id }).bmk;
            const richtig = `${name(raus.vonTeil)}:${raus.vonNr} — ${name(raus.nachTeil)}:${raus.nachNr}`;
            const klemmen = [];
            ganz.teile.forEach(t => {
                const liste = Schaltplan.anschluesseVon(t);
                liste.forEach(a => klemmen.push(`${t.bmk}:${a.nr}`));
            });
            const schluessel = (x, y) => [x, y].slice().sort().join(' ');
            const paare = new Map();
            paare.set(schluessel(`${name(raus.vonTeil)}:${raus.vonNr}`, `${name(raus.nachTeil)}:${raus.nachNr}`), richtig);
            const klemmeFinden = (text) => {
                const bmk = text.split(':')[0];
                const nr = text.split(':').slice(1).join(':');
                const gleiche = kaputt.teile.filter(t => String(t.bmk) === bmk);
                const passt = gleiche.find(t => Schaltplan.anschluesseVon(t).some(a => String(a.nr) === nr));
                return passt ? { teil: passt, nr } : null;
            };
            const stelltWiederHer = (text) => {
                const [a, b] = text.split(' — ');
                if (!a || !b)
                    return false;
                const ka = klemmeFinden(a), kb = klemmeFinden(b);
                if (!ka || !kb)
                    return false;
                const probe = JSON.parse(JSON.stringify(kaputt));
                probe.leitungen.push({ id: 'probe', ebene: 'plan',
                    punkte: [{ x: -2000, y: -2000 }, { x: -1980, y: -2000 }],
                    vonTeil: ka.teil.id, vonNr: ka.nr, nachTeil: kb.teil.id, nachNr: kb.nr });
                return muster(probe) === sollMuster;
            };
            for (const a of w.misch(klemmen)) {
                if (paare.size >= 4)
                    break;
                for (const b of w.misch(klemmen)) {
                    if (paare.size >= 4)
                        break;
                    if (a === b || a.split(':')[0] === b.split(':')[0])
                        continue;
                    const s = schluessel(a, b);
                    if (paare.has(s))
                        continue;
                    if (stelltWiederHer(`${a} — ${b}`))
                        continue;
                    paare.set(s, `${a} — ${b}`);
                }
            }
            if (paare.size < 4)
                continue;
            const auswahl = w.misch([...paare.values()]);
            return {
                art: 'plan-leitung', antwortart: 'wahl',
                frage: `${v.name}: ${v.wozu}\nEine Leitung fehlt. Welche?`,
                plan: kaputt, stellungen: alleZu,
                optionen: auswahl.includes(richtig)
                    ? auswahl
                    : [richtig, ...auswahl.filter(x => x !== richtig).slice(0, 3)],
                loesung: richtig,
                erklaerung: (() => {
                    const geht = (m) => [...m].filter(c => c !== '.' && c !== 'x').length;
                    const a = geht(sollMuster), b = geht(kaputtMuster);
                    if (b === 0)
                        return `Ohne die Verbindung ${richtig} ist der Stromkreis offen — ` +
                            `nachgerechnet: mit ihr leuchtet es, ohne sie nicht.`;
                    return `Ohne die Verbindung ${richtig} arbeitet die Schaltung nicht ` +
                        `mehr vollständig: nachgerechnet führen statt ${a} nur noch ` +
                        `${b} von ${sollMuster.length} Schalterstellungen zum Ziel. ` +
                        `Dass es überhaupt noch leuchtet, heisst nicht, dass alles ` +
                        `stimmt.`;
                })(),
                stufe: 3, saat
            };
        }
        return null;
    };
    const planFehler = (w, saat) => {
        if (typeof Schaltplan === 'undefined' || !SF())
            return null;
        for (let versuch = 0; versuch < 14; versuch++) {
            const v = w.aus(SCHALTUNGEN);
            const heil = planBauen(v.teile, v.draehte);
            if (!heil)
                continue;
            const alleZu = besteStellung(heil);
            const vorher = leuchtet(heil, alleZu);
            if (!vorher.ok || !vorher.wirkt)
                continue;
            const bmkVon = (plan, id) => {
                const t = plan.teile.find(x => x.id === id);
                return t ? String(t.bmk || t.zeichen) : '?';
            };
            const schaeden = [
                { name: 'Eine Leitung ist unterbrochen.', tun: plan => {
                        const l = plan.leitungen;
                        if (l.length < 2)
                            return null;
                        const weg = l.splice(Math.floor(l.length / 2), 1)[0];
                        return `zwischen ${bmkVon(plan, weg.vonTeil)}:${weg.vonNr} und ` +
                            `${bmkVon(plan, weg.nachTeil)}:${weg.nachNr} fehlt die Leitung`;
                    } },
                { name: 'Der Verbraucher ist überbrückt.', tun: plan => {
                        const last = plan.teile.find(t => {
                            const vh = SF().verhalten(t.zeichen);
                            return vh && vh.art === 'widerstand';
                        });
                        if (!last)
                            return null;
                        const vh = SF().verhalten(last.zeichen);
                        if (!bruecke(plan, last, String(vh.von), String(vh.nach), 'kurz'))
                            return null;
                        return `über ${last.bmk} liegt eine Leitung von ${vh.von} nach ${vh.nach}`;
                    } },
                { name: 'Der Schalter ist überbrückt und schaltet nichts mehr.', tun: plan => {
                        const sch = plan.teile.find(t => {
                            const vh = SF().verhalten(t.zeichen);
                            return vh && vh.art === 'schalter' && !vh.folgtSpule;
                        });
                        if (!sch)
                            return null;
                        const st = SF().stellungenVon(sch.zeichen);
                        const paar = st.find(x => x.zu.length)?.zu[0];
                        if (!paar)
                            return null;
                        if (!bruecke(plan, sch, String(paar[0]), String(paar[1]), 'kurz'))
                            return null;
                        return `über ${sch.bmk} liegt eine Leitung von ${paar[0]} nach ${paar[1]}`;
                    } },
                { name: 'Die Quelle liefert zu wenig Spannung.', tun: plan => {
                        const q = plan.teile.find(t => {
                            const vh = SF().verhalten(t.zeichen);
                            return vh && vh.art === 'quelle';
                        });
                        if (!q)
                            return null;
                        const vh = SF().verhalten(q.zeichen);
                        const soll = typeof vh.wert === 'number' ? vh.wert : 230;
                        const ist = Math.round(soll * 0.4);
                        q.werte = { ...(q.werte || {}), U: ist };
                        anschreiben(plan, q, `${ist} V (Soll ${soll} V)`, 'spannung');
                        return `${q.bmk} führt statt ${soll} V nur ${ist} V`;
                    } }
            ];
            const schaden = w.aus(schaeden);
            const kaputt = planBauen(v.teile, v.draehte);
            const ort = schaden.tun(kaputt);
            if (!ort)
                continue;
            const nachher = leuchtet(kaputt, alleZu);
            const wirklichKaputt = !nachher.ok
                || !nachher.wirkt
                || nachher.hell < vorher.hell * 0.5
                || nachher.strom < vorher.strom * 0.5
                || nachher.warnungen > vorher.warnungen;
            if (!wirklichKaputt)
                continue;
            const auswahl = schaeden.map(x => x.name);
            const neu = nachher.texte.filter(t => !vorher.texte.includes(t));
            const folge = !nachher.ok
                ? 'der Plan lässt sich gar nicht mehr durchrechnen'
                : neu.some(t => /überbrückt/.test(t))
                    ? 'der Strom findet einen Weg an der Last vorbei'
                    : neu.some(t => /an keiner Leitung/.test(t))
                        ? 'ein Anschluss hängt jetzt frei und der Kreis ist offen'
                        : nachher.hell < 0.02
                            ? 'es fliesst kein Strom mehr durch die Leuchte'
                            : `die Leuchte bekommt noch ${Math.round(nachher.hell * 100)} % ` +
                                `statt ${Math.round(vorher.hell * 100)} % der Nennleistung`;
            return {
                art: 'plan-fehler', antwortart: 'wahl',
                frage: `${v.name}: ${v.wozu}\nDiese Schaltung tut nicht, was sie soll. Woran liegt es?`,
                plan: kaputt, stellungen: alleZu,
                optionen: w.misch(auswahl),
                loesung: schaden.name,
                erklaerung: `Sieh hin: ${ort}. Nachgerechnet heisst das — ${folge}.`,
                stufe: 3, saat
            };
        }
        return null;
    };
    const planLeuchtet = (w, saat) => {
        if (typeof Schaltplan === 'undefined' || !SF())
            return null;
        for (let versuch = 0; versuch < 14; versuch++) {
            const v = w.aus(SCHALTUNGEN);
            const plan = planBauen(v.teile, v.draehte);
            if (!plan)
                continue;
            const schalter = plan.teile.filter(t => {
                const vh = SF().verhalten(t.zeichen);
                return vh && vh.art === 'schalter' && !vh.folgtSpule;
            });
            if (!schalter.length)
                continue;
            const stellung = {};
            const beschreibung = [];
            schalter.forEach(t => {
                const st = SF().stellungenVon(t.zeichen);
                const nr = w.bis(st.length);
                stellung[t.id] = nr;
                beschreibung.push(`${t.bmk}: ${st[nr].name}`);
                anschreiben(plan, t, st[nr].name, `st-${t.id}`);
            });
            let kurz = false;
            if (w.bis(4) === 0) {
                const last = plan.teile.find(t => {
                    const vh = SF().verhalten(t.zeichen);
                    return vh && vh.art === 'widerstand' && /X1/.test(String(vh.von || ''));
                });
                const vh = last ? SF().verhalten(last.zeichen) : null;
                if (last && vh)
                    kurz = bruecke(plan, last, String(vh.von), String(vh.nach), 'kurz');
            }
            let schwach = false;
            if (!kurz && w.bis(5) === 0) {
                const q = plan.teile.find(t => {
                    const vh = SF().verhalten(t.zeichen);
                    return vh && vh.art === 'quelle';
                });
                const vh = q ? SF().verhalten(q.zeichen) : null;
                if (q && vh) {
                    const soll = typeof vh.wert === 'number' ? vh.wert : 230;
                    const teil = 0.40 + w.bis(6) * 0.05;
                    q.werte = { ...(q.werte || {}), U: Math.round(soll * teil) };
                    q.spannungSoll = soll;
                    anschreiben(plan, q, `${Math.round(soll * teil)} V (Soll ${soll} V)`, 'spannung');
                    schwach = true;
                }
            }
            const e = leuchtet(plan, stellung);
            if (kurz) {
                if (!e.ok || e.quellStrom < 16)
                    continue;
                return {
                    art: 'plan-leuchtet', antwortart: 'wahl',
                    frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}\n` +
                        `Leuchtet die Leuchte?`,
                    plan, stellungen: stellung,
                    optionen: w.misch(['Ja, mit voller Helligkeit.', 'Ja, aber schwächer als normal.',
                        'Nein, es bleibt dunkel.', 'Die Sicherung löst aus.']),
                    loesung: 'Die Sicherung löst aus.',
                    erklaerung: 'Die Leuchte ist überbrückt — der Strom nimmt den Weg ' +
                        'daran vorbei und findet keinen Widerstand mehr vor. Begrenzt ' +
                        'wird er dann nur noch vom Leitungswiderstand, und er steigt ' +
                        'weit über jeden Nennstrom. Abschalten kann das nur die ' +
                        'Sicherung.',
                    stufe: 3, saat
                };
            }
            if (!e.ok)
                continue;
            const hatLeuchte = plan.teile.some(t => {
                const vh = SF().verhalten(t.zeichen);
                return vh && vh.art === 'widerstand' && /X1/.test(String(vh.von || ''));
            });
            if (!hatLeuchte)
                continue;
            const antwort = e.hell > 0.8 ? 'Ja, mit voller Helligkeit.'
                : e.hell > 0.02 ? 'Ja, aber schwächer als normal.'
                    : 'Nein, es bleibt dunkel.';
            if (schwach && antwort !== 'Ja, aber schwächer als normal.')
                continue;
            const q = plan.teile.find(t => t.spannungSoll);
            return {
                art: 'plan-leuchtet', antwortart: 'wahl',
                frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}` +
                    (schwach && q ? `\nDie Quelle führt nur ${q.werte.U} V statt ${q.spannungSoll} V.` : '') +
                    `\nLeuchtet die Leuchte?`,
                plan, stellungen: stellung,
                optionen: w.misch(['Ja, mit voller Helligkeit.', 'Ja, aber schwächer als normal.',
                    'Nein, es bleibt dunkel.', 'Die Sicherung löst aus.']),
                loesung: antwort,
                erklaerung: `${v.wozu} Nachgerechnet ergibt sich ` +
                    (e.hell > 0.02 ? `${Math.round(e.hell * 100)} % der Nennleistung.`
                        : 'kein Strom durch die Leuchte.') +
                    (schwach ? ' Die Leistung geht mit dem QUADRAT der Spannung: halbe ' +
                        'Spannung heisst ein Viertel Licht, nicht die Hälfte.' : ''),
                stufe: schalter.length > 1 ? 3 : 2, saat
            };
        }
        return null;
    };
    const planStromweg = (w, saat) => {
        if (typeof Schaltplan === 'undefined' || !SF())
            return null;
        for (let versuch = 0; versuch < 14; versuch++) {
            const v = w.aus(SCHALTUNGEN);
            const plan = planBauen(v.teile, v.draehte);
            if (!plan)
                continue;
            const alle = plan.leitungen.map(l => String(l.id));
            if (alle.length < 3 || alle.length > 10)
                continue;
            const schalter = plan.teile.filter(t => {
                const vh = SF().verhalten(t.zeichen);
                return vh && vh.art === 'schalter' && !vh.folgtSpule;
            });
            const stellung = {};
            const beschreibung = [];
            schalter.forEach(t => {
                const st = SF().stellungenVon(t.zeichen);
                const nr = w.bis(st.length);
                stellung[t.id] = nr;
                beschreibung.push(`${t.bmk}: ${st[nr].name}`);
                anschreiben(plan, t, st[nr].name, `st-${t.id}`);
            });
            const wirkung = (p) => {
                const e = SF().rechne(p, stellung);
                if (!e || !e.ok)
                    return 'x';
                const SCHWELLE = 1e-9;
                return p.teile.map(t => {
                    const x = e.werte[t.id];
                    if (!x)
                        return '-';
                    const i = Math.abs(x.I);
                    return i < SCHWELLE ? '0' : i.toPrecision(4);
                }).join('|');
            };
            const heil = wirkung(plan);
            if (heil === 'x')
                continue;
            const aufDemWeg = alle.filter(id => {
                const ohne = { ...plan,
                    leitungen: plan.leitungen.filter(l => String(l.id) !== id) };
                return wirkung(ohne) !== heil;
            });
            const daneben = alle.length - aufDemWeg.length;
            if (aufDemWeg.length < 2 || daneben < 2)
                continue;
            plan.breite = (Number(plan.breite) || 0) + 70;
            plan.hoehe = (Number(plan.hoehe) || 0) + 70;
            plan.teile.forEach(t => { t.x += 35; t.y += 35; });
            plan.leitungen.forEach(l => l.punkte.forEach(pt => { pt.x += 35; pt.y += 35; }));
            return {
                art: 'plan-stromweg', antwortart: 'wege',
                frage: `${v.name}\nStellungen: ${beschreibung.join(', ')}\n` +
                    `Tippe die Leitungen an, die am Stromweg beteiligt sind.`,
                plan, stellungen: stellung,
                loesung: aufDemWeg.slice().sort().join(','),
                erklaerung: `${v.wozu} Von ${alle.length} Leitungen liegen ` +
                    `${aufDemWeg.length} auf dem Weg: schneidet man eine davon durch, ` +
                    `ändert sich etwas. Die übrigen hängen an einem offenen Kontakt ` +
                    `oder in einem Zweig, der nirgends hinführt — Spannung kann dort ` +
                    `anliegen, für die Wirkung der Schaltung zählen sie nicht.`,
                stufe: schalter.length > 1 ? 3 : 2, saat
            };
        }
        return null;
    };
    const kreisZuordnen = (w, saat) => {
        if (!SF())
            return null;
        const STEUER = ['spule', 'schalter'];
        for (let versuch = 0; versuch < 14; versuch++) {
            const v = w.aus(SCHALTUNGEN);
            const plan = planBauen(v.teile, v.draehte);
            if (!plan)
                continue;
            const teile = plan.teile.filter(t => {
                const vh = SF().verhalten(t.zeichen);
                return vh && vh.art !== 'quelle';
            });
            if (teile.length < 2)
                continue;
            const t = w.aus(teile);
            const vh = SF().verhalten(t.zeichen);
            const z = Register.fachzeichen.holen(t.zeichen);
            const steuert = STEUER.includes(String(vh.art));
            const antwort = steuert ? 'Steuerstromkreis' : 'Hauptstromkreis';
            return {
                art: 'kreis-zuordnen', antwortart: 'wahl',
                frage: `${v.name}\nWohin gehört ${t.bmk}` +
                    (z ? ` (${z.name})` : '') + `?`,
                plan, stellungen: {},
                optionen: w.misch(['Steuerstromkreis', 'Hauptstromkreis']),
                loesung: antwort,
                erklaerung: steuert
                    ? `${t.bmk} schaltet oder hält — es entscheidet, WANN etwas ` +
                        `passiert, und trägt selbst keine Arbeitsleistung. Solche ` +
                        `Betriebsmittel stehen im Steuerstromkreis.`
                    : `${t.bmk} setzt Leistung um — hier fliesst der Strom, der die ` +
                        `Arbeit macht. Das ist der Hauptstromkreis; die Steuerung ` +
                        `entscheidet nur, ob er fliessen darf.`,
                stufe: 2, saat
            };
        }
        return null;
    };
    const ARTEN = [
        { id: 'zeichen-name', name: 'Zeichen benennen', gruppe: 'Fachzeichen', mach: zeichenName },
        { id: 'name-zeichen', name: 'Zeichen erkennen', gruppe: 'Fachzeichen', mach: nameZeichen },
        { id: 'zeichen-gruppe', name: 'Gruppe zuordnen', gruppe: 'Fachzeichen', mach: zeichenGruppe },
        { id: 'anschluesse', name: 'Anschlüsse kennen', gruppe: 'Fachzeichen', mach: anschluesse },
        { id: 'kennbuchstabe', name: 'Kennbuchstaben', gruppe: 'Fachzeichen', mach: kennbuchstabe },
        { id: 'rechnen', name: 'Rechnen', gruppe: 'Rechnen', mach: rechnen },
        { id: 'umrechnen', name: 'Einheiten umrechnen', gruppe: 'Rechnen', mach: umrechnen },
        { id: 'plan-luecke', name: 'Fehlendes Bauteil', gruppe: 'Schaltungen', mach: planLuecke },
        { id: 'plan-funktion', name: 'Schaltung erkennen', gruppe: 'Schaltungen', mach: planFunktion },
        { id: 'bmk-benennen', name: 'Betriebsmittel finden', gruppe: 'Schaltungen', mach: bmkBenennen },
        { id: 'plan-leitung', name: 'Fehlende Leitung', gruppe: 'Schaltungen', mach: planLeitung },
        { id: 'plan-fehler', name: 'Fehler suchen', gruppe: 'Schaltungen', mach: planFehler },
        { id: 'plan-leuchtet', name: 'Leuchtet es?', gruppe: 'Schaltungen', mach: planLeuchtet },
        { id: 'plan-stromweg', name: 'Stromweg markieren', gruppe: 'Schaltungen', mach: planStromweg },
        { id: 'kreis-zuordnen', name: 'Steuern oder arbeiten', gruppe: 'Schaltungen', mach: kreisZuordnen },
        { id: 'messen-wo', name: 'Richtig messen', gruppe: 'Messen', mach: messenWo }
    ];
    const artVon = (id) => ARTEN.find(a => a.id === id) || null;
    const gruppen = () => [...new Set(ARTEN.map(a => a.gruppe))];
    const erzeuge = (artId, saat) => {
        const s = (typeof saat === 'number') ? saat : Math.floor(Math.random() * 2147483647);
        const w = wuerfel(s);
        const art = artId ? artVon(artId) : null;
        if (artId && !art)
            return null;
        if (art) {
            for (let i = 0; i < 40; i++) {
                const versuchSaat = s + i * 7919;
                const a = art.mach(wuerfel(versuchSaat), versuchSaat);
                if (a)
                    return a;
            }
            return null;
        }
        for (const k of w.misch(ARTEN)) {
            for (let i = 0; i < 8; i++) {
                const versuchSaat = s + i * 7919;
                const a = k.mach(wuerfel(versuchSaat), versuchSaat);
                if (a)
                    return a;
            }
        }
        return null;
    };
    const reihe = (anzahl, opt = {}) => {
        const s0 = (typeof opt.saat === 'number') ? opt.saat
            : Math.floor(Math.random() * 2147483647);
        const w = wuerfel(s0);
        const erlaubt = (opt.arten && opt.arten.length)
            ? ARTEN.filter(a => opt.arten.includes(a.id))
            : ARTEN;
        if (!erlaubt.length)
            return [];
        const reihenfolge = w.misch(erlaubt);
        const raus = [];
        let versuche = 0;
        while (raus.length < anzahl && versuche < anzahl * 12) {
            const art = reihenfolge[raus.length % reihenfolge.length];
            const a = art.mach(wuerfel(s0 + versuche * 7919), s0 + versuche * 7919);
            versuche++;
            if (!a)
                continue;
            if (opt.stufe && a.stufe !== opt.stufe)
                continue;
            if (raus.some(x => x.frage === a.frage))
                continue;
            raus.push(a);
        }
        return raus;
    };
    const pruefe = (aufgabe, antwort) => {
        if (!aufgabe)
            return { richtig: false, hinweis: 'Keine Aufgabe.' };
        const roh = String(antwort ?? '').trim();
        if (!roh)
            return { richtig: false, hinweis: 'Da steht noch nichts.' };
        if (aufgabe.antwortart === 'wege') {
            const menge = (x) => new Set(x.split(',').map(y => y.trim()).filter(Boolean));
            const soll = menge(String(aufgabe.loesung));
            const ist = menge(roh);
            const fehlen = [...soll].filter(x => !ist.has(x)).length;
            const zuviel = [...ist].filter(x => !soll.has(x)).length;
            if (!fehlen && !zuviel)
                return { richtig: true, hinweis: 'Richtig.' };
            const teile = [];
            if (fehlen)
                teile.push(`${fehlen} ${fehlen === 1 ? 'Leitung fehlt' : 'Leitungen fehlen'}`);
            if (zuviel)
                teile.push(`${zuviel} zu viel`);
            return { richtig: false, hinweis: teile.join(', ') + '.' };
        }
        if (aufgabe.antwortart === 'zahl') {
            const zahl = Number(roh.replace(',', '.').replace(/\s/g, ''));
            if (!Number.isFinite(zahl))
                return { richtig: false, hinweis: 'Das ist keine Zahl.' };
            const soll = Number(aufgabe.loesung);
            const tol = (aufgabe.toleranz ?? 1) / 100;
            const richtig = Math.abs(zahl - soll) <= Math.abs(soll) * tol + 1e-12;
            if (richtig)
                return { richtig: true, hinweis: 'Richtig.' };
            const verhaeltnis = soll !== 0 ? zahl / soll : 0;
            for (const [name, f] of [['tausendmal zu gross', 1000], ['tausendmal zu klein', 0.001],
                ['hundertmal zu gross', 100], ['hundertmal zu klein', 0.01],
                ['zehnmal zu gross', 10], ['zehnmal zu klein', 0.1]]) {
                if (Math.abs(verhaeltnis - f) <= f * 0.02)
                    return { richtig: false,
                        hinweis: `Fast — der Wert ist ${name}. Sieh dir die Einheit an.` };
            }
            return { richtig: false, hinweis: `Richtig wäre ${aufgabe.loesung} ${aufgabe.einheit || ''}`.trim() };
        }
        const gleich = roh.toLowerCase() === String(aufgabe.loesung).toLowerCase();
        return gleich
            ? { richtig: true, hinweis: 'Richtig.' }
            : { richtig: false, hinweis: `Richtig wäre „${aufgabe.loesung}".` };
    };
    return { ARTEN, artVon, gruppen, erzeuge, reihe, pruefe,
        SCHALTUNGEN, planBauen, wuerfel };
})();
window.Elektroaufgaben = Elektroaufgaben;
