"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/schaltplan-pruefung.ts (npm run bauen:ts). */
const Planpruefung = (() => {
    const feld = (v) => Array.isArray(v) ? v : [];
    const pos = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const key = (p) => `${p.x}:${p.y}`;
    const gleich = (a, b) => a.x === b.x && a.y === b.y;
    const aufStrecke = (p, a, b) => {
        if (!pos(p) || !pos(a) || !pos(b))
            return false;
        const kreuz = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
        if (Math.abs(kreuz) > 0.00001)
            return false;
        return p.x >= Math.min(a.x, b.x) - 0.00001 && p.x <= Math.max(a.x, b.x) + 0.00001 &&
            p.y >= Math.min(a.y, b.y) - 0.00001 && p.y <= Math.max(a.y, b.y) + 0.00001;
    };
    const zwischen = (a, p, b) => aufStrecke(p, a, b) && !gleich(a, p) && !gleich(p, b);
    const ort = (p) => `${Math.round(p.x)}, ${Math.round(p.y)}`;
    const schutzpunkte = (plan, anschluesseVon) => {
        const schuetzen = new Set();
        feld(plan.teile).forEach(t => {
            try {
                feld(anschluesseVon(t)).forEach(p => { if (pos(p))
                    schuetzen.add(key(p)); });
            }
            catch { }
        });
        const leitungen = feld(plan.leitungen);
        for (const l of leitungen) {
            const ps = feld(l.punkte);
            for (let i = 1; i + 1 < ps.length; i++) {
                const p = ps[i];
                if (!pos(p))
                    continue;
                for (const andere of leitungen) {
                    if (andere === l)
                        continue;
                    const weg = feld(andere.punkte);
                    if (weg.some(q => pos(q) && gleich(q, p)) ||
                        weg.some((a, j) => j + 1 < weg.length && aufStrecke(p, a, weg[j + 1]))) {
                        schuetzen.add(key(p));
                        break;
                    }
                }
            }
        }
        return schuetzen;
    };
    const vereinfachen = (plan, anschluesseVon) => {
        const schuetzen = schutzpunkte(plan, anschluesseVon || (() => []));
        let entfernt = 0, geaendert = 0;
        feld(plan.leitungen).forEach(l => {
            const alt = feld(l.punkte);
            if (alt.length < 3 || !alt.every(pos))
                return;
            const neu = alt.map(p => ({ ...p }));
            for (let i = neu.length - 2; i >= 1; i--) {
                const p = neu[i], a = neu[i - 1], b = neu[i + 1];
                if (!p || !a || !b || schuetzen.has(key(p)))
                    continue;
                if (gleich(a, p) || gleich(p, b) || zwischen(a, p, b)) {
                    neu.splice(i, 1);
                    entfernt++;
                }
            }
            if (neu.length >= 2 && neu.length !== alt.length) {
                l.punkte = neu;
                geaendert++;
            }
        });
        return { geaendert, entfernt };
    };
    const analysieren = (plan, hilfen = {}) => {
        const teile = feld(plan?.teile), leitungen = feld(plan?.leitungen), texte = feld(plan?.texte);
        const anschluesseVon = hilfen.anschluesseVon || (() => []);
        const holeSymbol = hilfen.holeSymbol || (() => null);
        const punkte = [];
        const melden = (stufe, art, text, id, o) => {
            punkte.push({ stufe, art, text, id: String(id || ''),
                x: pos(o) ? o.x : null, y: pos(o) ? o.y : null });
        };
        const ids = new Set();
        for (const t of [...teile, ...leitungen, ...texte]) {
            if (!t || !t.id)
                continue;
            if (ids.has(t.id))
                melden('fehler', 'doppelte-id', `Kennung ${String(t.id)} ist mehrfach vorhanden.`, t.id, t);
            ids.add(t.id);
        }
        const teileAnOrt = new Map();
        for (const t of teile) {
            if (!t || !pos(t)) {
                melden('warnung', 'koordinate', 'Bauteil ohne gültige Koordinaten.', t?.id);
                continue;
            }
            const k = key(t), vorher = teileAnOrt.get(k);
            if (vorher)
                melden('warnung', 'ueberlagerung', `${t.bmk || t.zeichen || 'Bauteil'} liegt genau auf ${vorher.bmk || vorher.zeichen || 'einem weiteren Bauteil'}.`, t.id, t);
            else
                teileAnOrt.set(k, t);
            if (!holeSymbol(t.zeichen))
                melden('warnung', 'symbol', `Unbekanntes Fachzeichen: ${String(t.zeichen || 'ohne Kennung')}.`, t.id, t);
            if (t.x < 0 || t.y < 0 || t.x > Number(plan.breite) || t.y > Number(plan.hoehe))
                melden('hinweis', 'ausserhalb', `${t.bmk || t.zeichen || 'Bauteil'} liegt ausserhalb des Planblatts.`, t.id, t);
        }
        const schuetzen = schutzpunkte(plan, anschluesseVon);
        const verbindungAmEnde = (l, p) => {
            for (const t of teile) {
                try {
                    if (feld(anschluesseVon(t)).some(a => pos(a) && gleich(a, p)))
                        return true;
                }
                catch { }
            }
            for (const andere of leitungen)
                if (andere !== l) {
                    const ps = feld(andere.punkte);
                    for (let i = 0; i < ps.length - 1; i++)
                        if (aufStrecke(p, ps[i], ps[i + 1]))
                            return true;
                }
            return false;
        };
        for (const l of leitungen) {
            const ps = feld(l?.punkte);
            if (ps.length < 2 || !ps.every(pos)) {
                melden('fehler', 'leitung-ungueltig', 'Leitung hat weniger als zwei gültige Punkte.', l?.id);
                continue;
            }
            for (let i = 0; i < ps.length - 1; i++) {
                const a = ps[i], b = ps[i + 1];
                if (gleich(a, b))
                    melden('warnung', 'nullsegment', `Null-Länge bei ${ort(a)}.`, l.id, a);
                else if (a.x !== b.x && a.y !== b.y)
                    melden('warnung', 'diagonal', `Schräges Leitungsstück bei ${ort(a)} – ${ort(b)}.`, l.id, a);
            }
            for (let i = 1; i < ps.length - 1; i++) {
                if (!schuetzen.has(key(ps[i])) && zwischen(ps[i - 1], ps[i], ps[i + 1])) {
                    melden('hinweis', 'redundant', 'Gerades Leitungsstück enthält einen entfernbaren Zwischenpunkt.', l.id, ps[i]);
                    break;
                }
            }
            const erster = ps[0], letzter = ps[ps.length - 1];
            for (const p of [erster, letzter]) {
                if (!verbindungAmEnde(l, p) && !(l.vonTeil && gleich(p, erster)) && !(l.nachTeil && gleich(p, letzter)))
                    melden('hinweis', 'offenes-ende', `Offenes Leitungsende bei ${ort(p)} (gegebenenfalls beabsichtigt).`, l.id, p);
            }
        }
        if (typeof hilfen.offeneKlemmen === 'function') {
            try {
                hilfen.offeneKlemmen(plan).forEach(satz => {
                    const bmk = satz.split(':')[0] || '';
                    const t = teile.find(x => x && (x.bmk === bmk || x.zeichen === bmk));
                    melden('warnung', 'offene-klemme', satz, t?.id, t);
                });
            }
            catch {
                melden('hinweis', 'netzliste', 'Offene Klemmen konnten für diesen Plan nicht bestimmt werden.');
            }
        }
        let netzListe = [];
        if (typeof hilfen.netze === 'function') {
            try {
                const n = hilfen.netze(plan);
                const gruppen = new Map();
                const gruppe = (nr) => {
                    let g = gruppen.get(nr);
                    if (!g) {
                        g = { nummer: nr, klemmen: [], leitungen: [] };
                        gruppen.set(nr, g);
                    }
                    return g;
                };
                for (const k of feld(n.klemmen)) {
                    const nr = n.netzVon.get(k.schluessel);
                    if (typeof nr === 'number')
                        gruppe(nr).klemmen.push({ teil: String(k.teil), nr: String(k.nr) });
                }
                for (const l of leitungen) {
                    const nr = n.leitungNetz[l.id];
                    if (typeof nr === 'number')
                        gruppe(nr).leitungen.push(String(l.id));
                }
                netzListe = [...gruppen.values()].sort((a, b) => a.nummer - b.nummer);
            }
            catch {
                melden('hinweis', 'netzliste', 'Netzliste konnte für diesen Plan nicht berechnet werden.');
            }
        }
        const bestand = new Map();
        teile.forEach(t => {
            const typ = String(t?.zeichen || 'unbekannt');
            let b = bestand.get(typ);
            if (!b) {
                b = { zeichen: typ, name: holeSymbol(typ)?.name || typ, anzahl: 0, kennzeichen: [] };
                bestand.set(typ, b);
            }
            b.anzahl++;
            if (t?.bmk)
                b.kennzeichen.push(String(t.bmk));
        });
        const bauteile = [...bestand.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
        const zaehler = { fehler: 0, warnung: 0, hinweis: 0 };
        punkte.forEach(p => { zaehler[p.stufe]++; });
        return { zaehler, punkte, bauteile, netze: netzListe,
            statistik: { teile: teile.length, leitungen: leitungen.length, texte: texte.length, netze: netzListe.length } };
    };
    const csvFeld = (v) => {
        let s = String(v ?? '');
        if (/^[\s]*[=+@\-\t\r]/.test(s))
            s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = (zeilen) => '﻿' + zeilen.map(z => z.map(csvFeld).join(';')).join('\r\n') + '\r\n';
    const bauteileCsv = (r) => csv([
        ['Fachzeichen', 'Name', 'Anzahl', 'Betriebsmittelkennzeichen'],
        ...r.bauteile.map(b => [b.zeichen, b.name, b.anzahl, b.kennzeichen.join(', ')])
    ]);
    const netzeCsv = (r) => csv([
        ['Netz', 'Bauteilklemmen', 'Leitungskennungen'],
        ...r.netze.map(n => [n.nummer, n.klemmen.map(k => `${k.teil}:${k.nr}`).join(', '), n.leitungen.join(', ')])
    ]);
    const STUFE = { fehler: 'FEHLER', warnung: 'WARNUNG', hinweis: 'HINWEIS' };
    const berichtText = (r) => [
        'Redion · Schaltplan-Prüfbericht',
        `Bauteile: ${r.statistik.teile} | Leitungen: ${r.statistik.leitungen} | Netze: ${r.statistik.netze}`,
        `Fehler: ${r.zaehler.fehler} | Warnungen: ${r.zaehler.warnung} | Hinweise: ${r.zaehler.hinweis}`,
        'Hinweise zur Zeichnung — keine elektrische Sicherheitsabnahme.',
        '',
        ...r.punkte.map(p => `[${STUFE[p.stufe]}] ${p.text}${p.id ? ` (${p.id})` : ''}`)
    ].join('\n') + '\n';
    return { analysieren, vereinfachen, bauteileCsv, netzeCsv, berichtText };
})();
window.Planpruefung = Planpruefung;
