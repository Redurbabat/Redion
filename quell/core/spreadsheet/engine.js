"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/spreadsheet/engine.ts (npm run bauen:ts). */
const Spreadsheet = (() => {
    const maschine = () => (typeof Formula !== 'undefined') ? Formula : null;
    const adressen = () => (typeof CellRefs !== 'undefined') ? CellRefs : null;
    const ADRESSE = '\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7}';
    const NICHT_DAVOR = '(?<![A-Za-z0-9_$.])';
    const BLATT = '(?:\'[^\']+\'|[A-Za-z_\\u00C0-\\u024F][A-Za-z0-9_\\u00C0-\\u024F]*)!';
    const TEILE = new RegExp([
        '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'(?!\\s*!\\s*\\$?[A-Za-z]))',
        '(' + NICHT_DAVOR + '(?:' + BLATT + ')?' + ADRESSE + ':(?:' + BLATT + ')?' + ADRESSE + ')',
        '(' + NICHT_DAVOR + '(?:' + BLATT + ')?' + ADRESSE + '\\b(?!\\s*\\())'
    ].join('|'), 'g');
    const trenneBlatt = (stueck) => {
        const i = stueck.lastIndexOf('!');
        if (i < 0)
            return { blatt: '', adresse: stueck };
        let name = stueck.slice(0, i);
        if (name.startsWith('\'') && name.endsWith('\''))
            name = name.slice(1, -1);
        return { blatt: name, adresse: stueck.slice(i + 1) };
    };
    const schluessel = (blatt, adresse) => blatt ? blatt + '!' + adresse : adresse;
    const mitBlatt = (blatt, adresse) => {
        if (!blatt)
            return adresse;
        return (/^[A-Za-z_\u00C0-\u024F][A-Za-z0-9_\u00C0-\u024F]*$/.test(blatt)
            ? blatt : '\'' + blatt + '\'') + '!' + adresse;
    };
    const ohneDollar = (s) => s.replace(/\$/g, '').toUpperCase();
    const uebersetze = (formel, eigenesBlatt = '') => {
        const roh = String(formel ?? '').trim().replace(/^=/, '');
        if (!roh)
            return { quelle: '', liest: [], fehler: null };
        const A = adressen();
        if (!A)
            return { quelle: '', liest: [], fehler: 'CellRefs fehlt' };
        const liest = [];
        let fehler = null;
        const voll = (blatt, adresse) => schluessel(blatt || eigenesBlatt, adresse);
        const quelle = roh.replace(TEILE, (ganz, text, bereich, zelle) => {
            if (text !== undefined)
                return text;
            if (bereich !== undefined) {
                const [links, rechts] = bereich.split(/:(?![^']*')/).length === 2
                    ? bereich.split(/:(?![^']*')/) : [bereich, ''];
                const a = trenneBlatt(String(links));
                const b = trenneBlatt(String(rechts));
                if (b.blatt && a.blatt && b.blatt !== a.blatt) {
                    fehler = 'Ein Bereich kann nicht über zwei Blätter gehen';
                    return ganz;
                }
                const wo = a.blatt || b.blatt;
                const sauber = ohneDollar(a.adresse) + ':' + ohneDollar(b.adresse);
                const erg = A.zellenIn(sauber);
                if (erg.zuGross) {
                    fehler = 'Der Bereich ' + sauber + ' ist zu gross';
                    return ganz;
                }
                if (!erg.adressen.length) {
                    fehler = 'Der Bereich ' + sauber + ' ergibt keine Zellen';
                    return ganz;
                }
                erg.adressen.forEach((x) => liest.push(voll(wo, x)));
                return erg.adressen.map((x) => 'prop("' + voll(wo, x) + '")').join(', ');
            }
            const t = trenneBlatt(zelle);
            const sauber = ohneDollar(t.adresse);
            if (!A.gueltig(sauber))
                return ganz;
            const name = voll(t.blatt, sauber);
            liest.push(name);
            return 'prop("' + name + '")';
        });
        return { quelle, liest: [...new Set(liest)], fehler };
    };
    const graphVon = (zellen, blattName = '') => {
        const liest = {};
        const gelesenVon = {};
        for (const adresse of Object.keys(zellen || {})) {
            const zelle = zellen[adresse];
            if (!zelle || !zelle.formel)
                continue;
            const { liest: quellen } = uebersetze(zelle.formel, blattName);
            const ich = schluessel(blattName, adresse);
            liest[ich] = quellen;
            for (const q of quellen)
                (gelesenVon[q] = gelesenVon[q] || []).push(ich);
        }
        return { liest, gelesenVon };
    };
    const zirkel = (liest) => {
        const grau = new Set();
        const schwarz = new Set();
        const gefunden = new Set();
        const weg = [];
        const geh = (adresse) => {
            if (schwarz.has(adresse))
                return;
            if (grau.has(adresse)) {
                const ab = weg.indexOf(adresse);
                if (ab >= 0)
                    weg.slice(ab).forEach(a => gefunden.add(a));
                return;
            }
            grau.add(adresse);
            weg.push(adresse);
            for (const naechste of liest[adresse] || [])
                geh(naechste);
            weg.pop();
            grau.delete(adresse);
            schwarz.add(adresse);
        };
        for (const adresse of Object.keys(liest))
            geh(adresse);
        return [...gefunden].sort();
    };
    const reihenfolge = (liest, imKreis) => {
        const fertig = new Set();
        const raus = [];
        const geh = (adresse) => {
            if (fertig.has(adresse) || imKreis.has(adresse))
                return;
            fertig.add(adresse);
            for (const naechste of liest[adresse] || [])
                geh(naechste);
            if (liest[adresse])
                raus.push(adresse);
        };
        for (const adresse of Object.keys(liest))
            geh(adresse);
        return raus;
    };
    const alsFehlerwert = (satz) => {
        const s = String(satz ?? '');
        if (/^#[A-Z/0-9]+[!?]$/.test(s.trim()))
            return s.trim();
        if (/Unbekannte Funktion/i.test(s))
            return '#NAME?';
        return '#WERT!';
    };
    const rechneMappe = (mappe) => {
        const t0 = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : 0;
        const F = maschine();
        if (!F)
            return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Formula fehlt' };
        const blaetter = (mappe && mappe.blaetter) || [];
        if (!blaetter.length)
            return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Keine Blätter' };
        const einzeln = blaetter.length === 1;
        const nameVon = (b, i) => einzeln ? '' : String(b.name || ('Blatt ' + (i + 1)));
        const wo = {};
        blaetter.forEach((b, i) => { wo[nameVon(b, i)] = (b && b.zellen) || {}; });
        let liest = {};
        blaetter.forEach((b, i) => {
            const teil = graphVon((b && b.zellen) || {}, nameVon(b, i));
            liest = Object.assign(liest, teil.liest);
        });
        const imKreis = zirkel(liest);
        const kreisMenge = new Set(imKreis);
        const geaendert = [];
        const zelleZu = (voll) => {
            const t = trenneBlatt(voll);
            const tafel = wo[t.blatt] || (einzeln ? wo[''] : null);
            return tafel ? tafel[String(t.adresse).toUpperCase()] : null;
        };
        for (const name of imKreis) {
            const zelle = zelleZu(name);
            if (!zelle)
                continue;
            if (zelle.wert !== '#BEZUG!') {
                zelle.wert = '#BEZUG!';
                geaendert.push(name);
            }
        }
        let blattFehlt = false;
        const hole = (name) => {
            const t = trenneBlatt(String(name));
            if (t.blatt && !(t.blatt in wo)) {
                blattFehlt = true;
                return 0;
            }
            const zelle = zelleZu(String(name));
            if (!zelle)
                return 0;
            return zelle.wert === undefined || zelle.wert === null ? 0 : zelle.wert;
        };
        for (const name of reihenfolge(liest, kreisMenge)) {
            const zelle = zelleZu(name);
            if (!zelle || !zelle.formel)
                continue;
            const eigenes = trenneBlatt(name).blatt;
            const { quelle, fehler } = uebersetze(zelle.formel, eigenes);
            let neu;
            if (fehler)
                neu = '#BEZUG!';
            else {
                blattFehlt = false;
                const e = F.run(quelle, hole, null, { streng: true });
                neu = blattFehlt ? '#BEZUG!' : (e.ok ? e.wert : alsFehlerwert(e.fehler));
            }
            if (zelle.wert !== neu) {
                zelle.wert = neu;
                geaendert.push(name);
            }
        }
        const dauer = ((typeof performance !== 'undefined' && performance.now)
            ? performance.now() : 0) - t0;
        return { geaendert, zirkel: imKreis, dauer: Math.round(dauer), fehler: null };
    };
    const rechne = (blatt) => {
        if (!blatt || !blatt.zellen)
            return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Kein Blatt' };
        return rechneMappe({ blaetter: [blatt] });
    };
    const kennung = () => (typeof Ids !== 'undefined') ? Ids.short(8)
        : 'x' + Math.random().toString(36).slice(2, 10);
    const neuesBlatt = (name = 'Tabelle 1', zeilen = 50, spalten = 20) => ({
        id: kennung(), name: String(name), zellen: {},
        zeilen: Math.max(1, zeilen), spalten: Math.max(1, spalten)
    });
    const neueMappe = (name = 'Neue Tabelle') => {
        const blatt = neuesBlatt();
        return { id: kennung(), name: String(name), blaetter: [blatt], aktiv: blatt.id,
            erstellt: new Date().toISOString(), geaendert: new Date().toISOString() };
    };
    const setze = (blatt, adresse, eingabe) => {
        const A = adressen();
        if (!blatt || !A)
            return null;
        const a = String(adresse ?? '').toUpperCase();
        if (!A.gueltig(a))
            return null;
        const roh = eingabe === null || eingabe === undefined ? '' : String(eingabe);
        const vorher = blatt.zellen[a] || {};
        if (roh === '') {
            const stil = vorher.stil;
            if (stil && Object.keys(stil).length) {
                blatt.zellen[a] = { wert: '', stil };
                return blatt.zellen[a];
            }
            delete blatt.zellen[a];
            return null;
        }
        if (roh.startsWith('=')) {
            blatt.zellen[a] = { ...vorher, formel: roh, wert: vorher.wert ?? '' };
            return blatt.zellen[a];
        }
        const neu = { ...vorher };
        delete neu.formel;
        if (roh.startsWith("'")) {
            neu.wert = roh.slice(1);
            neu.text = true;
        }
        else {
            delete neu.text;
            const oben = roh.trim().toUpperCase();
            if (oben === 'WAHR' || oben === 'TRUE')
                neu.wert = true;
            else if (oben === 'FALSCH' || oben === 'FALSE')
                neu.wert = false;
            else {
                const alsZahl = roh.trim().replace(',', '.');
                const zahl = /^-?\d+(\.\d+)?$/.test(alsZahl) ? Number(alsZahl) : null;
                neu.wert = zahl === null ? roh : zahl;
            }
        }
        blatt.zellen[a] = neu;
        return blatt.zellen[a];
    };
    const teileAdresse = (roh) => {
        const m = String(roh).match(/^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})$/);
        if (!m)
            return null;
        return { absS: m[1] === '$', spalte: String(m[2]).toUpperCase(),
            absZ: m[3] === '$', zeile: Number(m[4]) };
    };
    const KAPUTT = '#BEZUG!';
    const bezuegeUm = (formel, wandle) => {
        const roh = String(formel ?? '');
        if (!roh.startsWith('='))
            return roh;
        let kaputt = false;
        const eine = (stueck) => {
            const t = teileAdresse(stueck);
            if (!t)
                return stueck;
            const raus = wandle(t);
            if (raus === null) {
                kaputt = true;
                return KAPUTT;
            }
            return raus;
        };
        const neu = roh.slice(1).replace(TEILE, (_ganz, text, bereich, zelle) => {
            if (text !== undefined)
                return text;
            if (bereich !== undefined)
                return bereich.split(':').map(eine).join(':');
            return eine(zelle);
        });
        return kaputt ? '=' + KAPUTT : '=' + neu;
    };
    const verschiebe = (formel, dz, ds) => bezuegeUm(formel, (t) => {
        const A = adressen();
        if (!A)
            return null;
        const spalte = t.absS ? A.textZuSpalte(t.spalte) : A.textZuSpalte(t.spalte) + ds;
        const zeile = t.absZ ? t.zeile - 1 : t.zeile - 1 + dz;
        if (spalte < 0 || zeile < 0)
            return null;
        const txt = A.spalteZuText(spalte);
        if (!txt)
            return null;
        return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });
    const bezuegeNachEingriff = (formel, art, bei, anzahl) => bezuegeUm(formel, (t) => {
        const A = adressen();
        if (!A)
            return null;
        let spalte = A.textZuSpalte(t.spalte);
        let zeile = t.zeile - 1;
        if (spalte < 0 || zeile < 0)
            return null;
        const wert = art === 'zeile' ? zeile : spalte;
        let neu = wert;
        if (anzahl > 0) {
            if (wert >= bei)
                neu = wert + anzahl;
        }
        else {
            const weg = -anzahl;
            if (wert >= bei && wert < bei + weg)
                return null;
            if (wert >= bei + weg)
                neu = wert - weg;
        }
        if (art === 'zeile')
            zeile = neu;
        else
            spalte = neu;
        const txt = A.spalteZuText(spalte);
        if (!txt || zeile < 0)
            return null;
        return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });
    const blattUmbenannt = (formel, alt, neu) => {
        const roh = String(formel ?? '');
        if (!roh.startsWith('=') || !alt || alt === neu)
            return roh;
        const raus = roh.slice(1).replace(TEILE, (_ganz, text, bereich, zelle) => {
            if (text !== undefined)
                return text;
            const stueck = bereich !== undefined ? bereich : zelle;
            const teile = String(stueck).split(/:(?![^']*')/);
            const neuTeile = teile.map((t) => {
                const g = trenneBlatt(t);
                if (g.blatt !== alt)
                    return t;
                return mitBlatt(neu, g.adresse);
            });
            return neuTeile.join(':');
        });
        return '=' + raus;
    };
    const eingriff = (blatt, art, bei, anzahl) => {
        const A = adressen();
        if (!blatt || !blatt.zellen || !A || !anzahl)
            return false;
        const weg = anzahl < 0 ? -anzahl : 0;
        const alt = blatt.zellen;
        const neu = {};
        for (const adresse of Object.keys(alt)) {
            const l = A.lies(adresse);
            if (!l)
                continue;
            let z = l.zeile, s = l.spalte;
            const wert = art === 'zeile' ? z : s;
            if (weg) {
                if (wert >= bei && wert < bei + weg)
                    continue;
                if (wert >= bei + weg) {
                    if (art === 'zeile')
                        z -= weg;
                    else
                        s -= weg;
                }
            }
            else if (wert >= bei) {
                if (art === 'zeile')
                    z += anzahl;
                else
                    s += anzahl;
            }
            const zelle = alt[adresse];
            if (zelle && zelle.formel)
                zelle.formel = bezuegeNachEingriff(zelle.formel, art, bei, anzahl);
            neu[A.schreibe(z, s)] = zelle;
        }
        blatt.zellen = neu;
        if (art === 'zeile')
            blatt.zeilen = Math.max(1, (blatt.zeilen || 0) + anzahl);
        else
            blatt.spalten = Math.max(1, (blatt.spalten || 0) + anzahl);
        return true;
    };
    const zeileEinfuegen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'zeile', bei, Math.max(1, anzahl));
    const zeileLoeschen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'zeile', bei, -Math.max(1, anzahl));
    const spalteEinfuegen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'spalte', bei, Math.max(1, anzahl));
    const spalteLoeschen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'spalte', bei, -Math.max(1, anzahl));
    const fuelle = (blatt, von, bisZeile, bisSpalte) => {
        const A = adressen();
        if (!blatt || !A)
            return 0;
        const runter = bisZeile > von.bisZ;
        const rechts = bisSpalte > von.bisS;
        if (!runter && !rechts)
            return 0;
        const quelle = [];
        let gefuellt = 0;
        const eineReihe = (fest, laenge, alsZeile, vonI, bisI, zielBis) => {
            quelle.length = 0;
            for (let i = vonI; i <= bisI; i++)
                quelle.push(alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i));
            const zahlen = quelle.map(a => {
                const zelle = blatt.zellen[a];
                return zelle && typeof zelle.wert === 'number' && !zelle.formel ? zelle.wert : null;
            });
            const alleZahlen = zahlen.length > 1 && zahlen.every(z => z !== null);
            const schritt = alleZahlen
                ? zahlen[zahlen.length - 1] - zahlen[zahlen.length - 2] : 0;
            for (let i = bisI + 1; i <= zielBis; i++) {
                const ziel = alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i);
                const abstand = i - bisI;
                const vorbild = quelle[(abstand - 1) % laenge] || '';
                const zelleV = blatt.zellen[vorbild];
                if (alleZahlen) {
                    blatt.zellen[ziel] = { ...(zelleV || {}),
                        wert: zahlen[zahlen.length - 1] + schritt * abstand };
                    delete blatt.zellen[ziel].formel;
                }
                else if (zelleV && zelleV.formel) {
                    const dz = alsZeile ? i - A.lies(vorbild).zeile : 0;
                    const ds = alsZeile ? 0 : i - A.lies(vorbild).spalte;
                    blatt.zellen[ziel] = { ...zelleV, formel: verschiebe(zelleV.formel, dz, ds) };
                }
                else if (zelleV) {
                    blatt.zellen[ziel] = { ...zelleV };
                }
                else {
                    delete blatt.zellen[ziel];
                }
                gefuellt++;
            }
        };
        if (runter) {
            const laenge = von.bisZ - von.vonZ + 1;
            for (let s = von.vonS; s <= von.bisS; s++)
                eineReihe(s, laenge, true, von.vonZ, von.bisZ, bisZeile);
            if (bisZeile + 1 > (blatt.zeilen || 0))
                blatt.zeilen = bisZeile + 1;
        }
        if (rechts) {
            const laenge = von.bisS - von.vonS + 1;
            for (let z = von.vonZ; z <= von.bisZ; z++)
                eineReihe(z, laenge, false, von.vonS, von.bisS, bisSpalte);
            if (bisSpalte + 1 > (blatt.spalten || 0))
                blatt.spalten = bisSpalte + 1;
        }
        return gefuellt;
    };
    const sortiere = (blatt, spalte, vonZ, bisZ, ab = true) => {
        const A = adressen();
        if (!blatt || !A || bisZ <= vonZ)
            return false;
        const breite = blatt.spalten || 0;
        const zeilen = [];
        for (let z = vonZ; z <= bisZ; z++) {
            const eine = [];
            for (let s = 0; s < breite; s++)
                eine.push(blatt.zellen[A.schreibe(z, s)] || null);
            zeilen.push(eine);
        }
        const schluessel = (r) => (r[spalte] ? r[spalte].wert : '');
        zeilen.sort((x, y) => {
            const a = schluessel(x), b = schluessel(y);
            const leerA = a === '' || a === null || a === undefined;
            const leerB = b === '' || b === null || b === undefined;
            if (leerA && leerB)
                return 0;
            if (leerA)
                return 1;
            if (leerB)
                return -1;
            if (typeof a === 'number' && typeof b === 'number')
                return ab ? a - b : b - a;
            const va = String(a), vb = String(b);
            return ab ? va.localeCompare(vb, 'de') : vb.localeCompare(va, 'de');
        });
        zeilen.forEach((eine, i) => {
            const z = vonZ + i;
            for (let s = 0; s < breite; s++) {
                const ziel = A.schreibe(z, s);
                if (eine[s])
                    blatt.zellen[ziel] = eine[s];
                else
                    delete blatt.zellen[ziel];
            }
        });
        return true;
    };
    const wert = (blatt, adresse) => {
        const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
        return zelle ? zelle.wert : '';
    };
    const eingabe = (blatt, adresse) => {
        const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
        if (!zelle)
            return '';
        if (zelle.formel)
            return String(zelle.formel);
        return zelle.wert === undefined || zelle.wert === null ? '' : String(zelle.wert);
    };
    return { uebersetze, graphVon, zirkel, reihenfolge, rechne, rechneMappe,
        trenneBlatt, mitBlatt, schluessel, blattUmbenannt,
        neuesBlatt, neueMappe, setze, wert, eingabe, alsFehlerwert,
        verschiebe, bezuegeNachEingriff,
        zeileEinfuegen, zeileLoeschen, spalteEinfuegen, spalteLoeschen,
        fuelle, sortiere };
})();
window.Spreadsheet = Spreadsheet;
