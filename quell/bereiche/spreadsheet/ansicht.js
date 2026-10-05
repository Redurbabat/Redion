"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/spreadsheet/ansicht.ts (npm run bauen:ts). */
const SpreadsheetView = (() => {
    const kern = () => (typeof Spreadsheet !== 'undefined') ? Spreadsheet : null;
    const refs = () => (typeof CellRefs !== 'undefined') ? CellRefs : null;
    const ZH = 32;
    const ZH_HANDY = 44;
    const SB = 110;
    const SB_MIN = 48;
    const PUFFER = 6;
    const amTelefon = () => typeof window !== 'undefined' && typeof AppEinstellung !== 'undefined'
        ? AppEinstellung.amTelefon()
        : typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(max-width: 760px)').matches : false;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const zeigeWert = (wert, format) => {
        if (wert === null || wert === undefined || wert === '')
            return '';
        if (typeof wert === 'string' && wert.startsWith('#'))
            return wert;
        if (wert instanceof Date)
            return wert.toLocaleDateString('de-CH');
        if (typeof wert === 'boolean')
            return wert ? 'WAHR' : 'FALSCH';
        if (typeof wert === 'number') {
            if (!isFinite(wert))
                return '#ZAHL!';
            const art = format && format.art;
            const stellen = format && typeof format.stellen === 'number' ? format.stellen : undefined;
            if (art === 'prozent')
                return (wert * 100).toLocaleString('de-CH', {
                    minimumFractionDigits: stellen ?? 0, maximumFractionDigits: stellen ?? 1
                }) + ' %';
            if (art === 'waehrung')
                return wert.toLocaleString('de-CH', {
                    minimumFractionDigits: stellen ?? 2, maximumFractionDigits: stellen ?? 2
                }) +
                    ' ' + ((format && format.waehrung) || 'CHF');
            if (stellen !== undefined)
                return wert.toLocaleString('de-CH', {
                    minimumFractionDigits: stellen, maximumFractionDigits: stellen
                });
            return wert.toLocaleString('de-CH', { maximumFractionDigits: 10 });
        }
        return String(wert);
    };
    const istFehler = (wert) => typeof wert === 'string' && /^#[A-Z/0-9]+[!?]$/.test(wert);
    const FEHLER_TEXT = {
        '#NAME?': 'Diese Funktion kennt Redion nicht. Tippe = und die ersten Buchstaben — ' +
            'dann steht die richtige Schreibweise da.',
        '#BEZUG!': 'Ein Bezug zeigt ins Leere. Meist wurde die Zeile oder Spalte gelöscht, ' +
            'oder zwei Zellen lesen sich im Kreis.',
        '#WERT!': 'Die Formel liess sich nicht lesen. Meist fehlt eine Klammer oder ein ' +
            'Semikolon zwischen zwei Werten.',
        '#ZAHL!': 'Das Ergebnis ist keine Zahl mehr — zu gross, zu klein, oder die Wurzel ' +
            'aus einer negativen Zahl.',
        '#DIV/0!': 'Hier wird durch null geteilt. Meist ist die Zelle im Nenner noch leer — ' +
            'eine leere Zelle zählt als null.'
    };
    const erklaere = (wert) => (typeof wert === 'string' && FEHLER_TEXT[wert]) || '';
    const strichIcon = (art) => {
        const kurz = art === 'links' ? 'x="1"' : art === 'rechts' ? 'x="5"' : 'x="3"';
        return '<svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" fill="currentColor">' +
            '<rect x="1" y="1" width="12" height="1.6" rx=".8"/>' +
            '<rect ' + kurz + ' y="5.2" width="8" height="1.6" rx=".8"/>' +
            '<rect x="1" y="9.4" width="12" height="1.6" rx=".8"/></svg>';
    };
    const REGELFARBEN = {
        rot: 'red', orange: 'orange', gelb: 'yellow', gruen: 'green',
        blau: 'blue', lila: 'purple'
    };
    const REGELARTEN = [
        ['groesser', 'ist grösser als'],
        ['kleiner', 'ist kleiner als'],
        ['gleich', 'ist gleich'],
        ['zwischen', 'liegt zwischen'],
        ['enthaelt', 'enthält den Text'],
        ['leer', 'ist leer'],
        ['nichtLeer', 'ist nicht leer'],
        ['doppelt', 'kommt mehrfach vor'],
        ['ueberfaellig', 'ist ein Datum in der Vergangenheit'],
        ['faelligBald', 'wird fällig in den nächsten … Tagen'],
        ['skala', 'Farbverlauf klein → gross'],
        ['balken', 'Balken nach Wert'],
        ['symbol', 'Symbol nach Wert']
    ];
    const SYMBOLSAETZE = {
        ampel: ['🔴', '🟡', '🟢'],
        pfeile: ['▼', '▬', '▲'],
        formen: ['◆', '■', '●'],
        noten: ['✗', '~', '✓']
    };
    const alsDatum = (v) => {
        const t = String(v ?? '').trim();
        if (!t)
            return NaN;
        let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
        if (m)
            return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
        m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t);
        if (m)
            return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
        return NaN;
    };
    const heuteUm0 = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };
    const OHNE_WERT = ['leer', 'nichtLeer', 'doppelt', 'ueberfaellig', 'skala', 'balken'];
    const OHNE_FARBE = ['skala', 'balken', 'symbol'];
    const bereichLesen = (text, R, blatt) => {
        const ganz = { vonZ: 0, bisZ: (blatt.zeilen || 1) - 1,
            vonS: 0, bisS: (blatt.spalten || 1) - 1 };
        const t = String(text || '').trim().toUpperCase();
        if (!t || !R)
            return ganz;
        const teile = t.split(':');
        const a = R.lies(teile[0]);
        const b = teile[1] ? R.lies(teile[1]) : a;
        if (!a || !b)
            return ganz;
        return {
            vonZ: Math.min(a.zeile, b.zeile), bisZ: Math.max(a.zeile, b.zeile),
            vonS: Math.min(a.spalte, b.spalte), bisS: Math.max(a.spalte, b.spalte)
        };
    };
    const inBereich = (z, s, g) => z >= g.vonZ && z <= g.bisZ && s >= g.vonS && s <= g.bisS;
    const alsZahl = (v) => {
        if (typeof v === 'number')
            return v;
        const n = parseFloat(String(v ?? '').replace(',', '.'));
        return isFinite(n) ? n : NaN;
    };
    const bereichsWerte = (g, blatt, R) => {
        let min = Infinity, max = -Infinity;
        const wieOft = new Map();
        for (let z = g.vonZ; z <= g.bisZ; z++) {
            for (let s = g.vonS; s <= g.bisS; s++) {
                const zelle = blatt.zellen[R.schreibe(z, s)];
                const v = zelle ? zelle.wert : '';
                if (v === '' || v == null)
                    continue;
                const n = alsZahl(v);
                if (isFinite(n)) {
                    if (n < min)
                        min = n;
                    if (n > max)
                        max = n;
                }
                const k = String(v);
                wieOft.set(k, (wieOft.get(k) || 0) + 1);
            }
        }
        return { min, max, wieOft };
    };
    const regelTrifft = (regel, wert, hilf) => {
        const leer = wert === '' || wert == null;
        switch (regel.art) {
            case 'leer': return leer;
            case 'nichtLeer': return !leer;
            case 'doppelt': return !leer && (hilf.wieOft.get(String(wert)) || 0) > 1;
            case 'enthaelt': return !leer && String(wert).toLowerCase()
                .includes(String(regel.wert ?? '').toLowerCase());
            case 'gleich': {
                if (leer)
                    return false;
                const a = alsZahl(wert), b = alsZahl(regel.wert);
                if (isFinite(a) && isFinite(b))
                    return a === b;
                return String(wert).toLowerCase() === String(regel.wert ?? '').toLowerCase();
            }
            case 'groesser': {
                const a = alsZahl(wert);
                return isFinite(a) && a > alsZahl(regel.wert);
            }
            case 'kleiner': {
                const a = alsZahl(wert);
                return isFinite(a) && a < alsZahl(regel.wert);
            }
            case 'zwischen': {
                const a = alsZahl(wert);
                const u = alsZahl(regel.wert), o = alsZahl(regel.wert2);
                return isFinite(a) && isFinite(u) && isFinite(o) &&
                    a >= Math.min(u, o) && a <= Math.max(u, o);
            }
            case 'ueberfaellig': {
                const d = alsDatum(wert);
                return isFinite(d) && d < heuteUm0();
            }
            case 'faelligBald': {
                const d = alsDatum(wert);
                if (!isFinite(d))
                    return false;
                const tage = alsZahl(regel.wert);
                const spanne = isFinite(tage) && tage > 0 ? tage : 7;
                const heute = heuteUm0();
                return d >= heute && d <= heute + spanne * 86400000;
            }
            default: return false;
        }
    };
    const symbolStufe = (regel, wert, hilf) => {
        const n = alsZahl(wert);
        if (!isFinite(n))
            return -1;
        const u = alsZahl(regel.wert), o = alsZahl(regel.wert2);
        let stufe;
        if (isFinite(u) && isFinite(o)) {
            const klein = Math.min(u, o), gross = Math.max(u, o);
            stufe = n < klein ? 0 : n < gross ? 1 : 2;
        }
        else {
            if (!isFinite(hilf.min) || !isFinite(hilf.max))
                return -1;
            const spanne = hilf.max - hilf.min;
            const t = spanne === 0 ? 1 : (n - hilf.min) / spanne;
            stufe = t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2;
        }
        return regel.umgekehrt ? 2 - stufe : stufe;
    };
    const regelAussehen = (z, s, wert, vorbereitet) => {
        for (const v of vorbereitet) {
            if (!inBereich(z, s, v.g))
                continue;
            const leer = wert === '' || wert == null;
            if (v.regel.art === 'skala' || v.regel.art === 'balken') {
                if (leer)
                    continue;
                const n = alsZahl(wert);
                if (!isFinite(n) || !isFinite(v.hilf.min) || !isFinite(v.hilf.max))
                    continue;
                const unten = v.regel.art === 'balken' ? Math.min(0, v.hilf.min) : v.hilf.min;
                const oben = v.regel.art === 'balken' ? Math.max(0, v.hilf.max) : v.hilf.max;
                const spanne = oben - unten;
                const t = spanne === 0 ? 1 : (n - unten) / spanne;
                if (v.regel.art === 'skala') {
                    const ton = Math.round(t * 135);
                    return { klasse: ' regel-skala',
                        stil: `background:hsl(${ton} 62% 42% / .5)` };
                }
                const p = Math.round(Math.max(0, Math.min(1, t)) * 100);
                return { klasse: ' regel-balken',
                    stil: `--regel-balken:${p}%` };
            }
            if (v.regel.art === 'symbol') {
                if (leer)
                    continue;
                const stufe = symbolStufe(v.regel, wert, v.hilf);
                if (stufe < 0)
                    continue;
                const satz = SYMBOLSAETZE[v.regel.satz || 'ampel'] || SYMBOLSAETZE['ampel'];
                return { klasse: ' regel-symbol',
                    stil: `--regel-symbol:'${satz[stufe] ?? ''}'` };
            }
            if (regelTrifft(v.regel, wert, v.hilf)) {
                const marke = REGELFARBEN[v.regel.farbe || 'gelb'] || 'yellow';
                return { klasse: ' regel-farbe bg-' + marke };
            }
        }
        return null;
    };
    const kartenAnsicht = (w, block, blatt, K, R) => {
        w.className = 'tblk-karten';
        const rasterOeffnen = (zelle) => {
            Store.updateBlock(block.id, { telefonRaster: true, telefonZelle: zelle });
            App.zeichneSeite();
        };
        try {
            K.rechneMappe(block.mappe);
        }
        catch { }
        let hochZ = 0, hochS = 0;
        Object.keys(blatt.zellen || {}).forEach((a) => {
            const p = R.lies(a);
            if (p) {
                hochZ = Math.max(hochZ, p.zeile + 1);
                hochS = Math.max(hochS, p.spalte + 1);
            }
        });
        const kopf = document.createElement('div');
        kopf.className = 'tblk-kopf';
        const name = document.createElement('b');
        name.textContent = blatt.name || block.text || 'Tabelle';
        const zumRaster = document.createElement('button');
        zumRaster.type = 'button';
        zumRaster.textContent = '⊞ Raster';
        zumRaster.title = 'Als Raster öffnen';
        zumRaster.addEventListener('click', () => rasterOeffnen('A1'));
        kopf.appendChild(name);
        kopf.appendChild(zumRaster);
        w.appendChild(kopf);
        if (hochZ < 2) {
            const leer = document.createElement('div');
            leer.className = 'tblk-leer';
            leer.textContent = hochZ === 0
                ? 'Noch keine Zellen — zum Ausfüllen das Raster öffnen.'
                : 'Nur die Kopfzeile ist gefüllt — Zeilen kommen im Raster dazu.';
            w.appendChild(leer);
            return w;
        }
        const feldname = (s) => {
            const k = K.eingabe(blatt, R.schreibe(0, s));
            return k !== '' && k != null ? String(k) : R.spalteZuText(s);
        };
        for (let z = 1; z < hochZ; z++) {
            const karte = document.createElement('div');
            karte.className = 'tblk-karte';
            karte.tabIndex = 0;
            karte.setAttribute('role', 'button');
            karte.setAttribute('aria-label', 'Zeile ' + z + ' im Raster bearbeiten');
            let titelDa = false;
            for (let s = 0; s < hochS; s++) {
                const adr = R.schreibe(z, s);
                const zelle = blatt.zellen[adr];
                const anzeige = zeigeWert(K.wert(blatt, adr), zelle && zelle.stil && zelle.stil.format);
                if (anzeige === '')
                    continue;
                if (!titelDa) {
                    const t = document.createElement('div');
                    t.className = 'tblk-titel';
                    t.textContent = anzeige;
                    karte.appendChild(t);
                    titelDa = true;
                    continue;
                }
                const f = document.createElement('div');
                f.className = 'tblk-feld';
                f.innerHTML = '<span class="tblk-name">' + esc(feldname(s)) + '</span>' +
                    '<span class="tblk-wert">' + esc(anzeige) + '</span>';
                karte.appendChild(f);
            }
            if (!karte.childElementCount)
                continue;
            const oeffneZeile = () => rasterOeffnen(R.schreibe(z, 0));
            karte.addEventListener('click', oeffneZeile);
            karte.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ')
                    return;
                e.preventDefault();
                oeffneZeile();
            });
            w.appendChild(karte);
        }
        return w;
    };
    const zeichne = (block) => {
        const K = kern(), R = refs();
        const w = document.createElement('div');
        w.className = 'tbl';
        if (!K || !R) {
            w.textContent = 'Der Tabellenkern ist nicht geladen.';
            return w;
        }
        const hatteMappe = !!(block.mappe && block.mappe.blaetter && block.mappe.blaetter.length);
        if (!hatteMappe)
            block.mappe = K.neueMappe(block.text || 'Tabelle');
        let blatt = block.mappe.blaetter.find((b) => b.id === block.mappe.aktiv)
            || block.mappe.blaetter[0];
        block.mappe.aktiv = blatt.id;
        if (!blatt.breiten)
            blatt.breiten = {};
        if (amTelefon() && !block.telefonRaster)
            return kartenAnsicht(w, block, blatt, K, R);
        if (amTelefon()) {
            const zurueck = document.createElement('button');
            zurueck.type = 'button';
            zurueck.className = 'tblk-zurueck';
            zurueck.textContent = '☰ Karten';
            zurueck.title = 'Zurück zur Kartenansicht';
            zurueck.addEventListener('click', () => {
                Store.updateBlock(block.id, { telefonRaster: false });
                App.zeichneSeite();
            });
            w.appendChild(zurueck);
        }
        let gewaehlt = R.gueltig(block.telefonZelle) ? block.telefonZelle : 'A1';
        let anker = gewaehlt;
        let fuellZiel = null;
        let zirkel = [];
        const handy = amTelefon();
        const vorgabeBreite = handy ? 128 : SB;
        const minBreite = handy ? 112 : SB_MIN;
        const breiteVon = (s) => Math.max(minBreite, Number(blatt.breiten[s]) || vorgabeBreite);
        const zh = handy ? ZH_HANDY : ZH;
        const standVon = () => JSON.stringify(block.mappe.blaetter);
        let letzterStand = hatteMappe ? standVon() : '';
        const sichere = () => {
            const jetzt = standVon();
            if (jetzt === letzterStand)
                return false;
            letzterStand = jetzt;
            block.mappe.geaendert = new Date().toISOString();
            if (typeof Store !== 'undefined' && Store.updateBlock)
                Store.updateBlock(block.id, { mappe: block.mappe });
            return true;
        };
        const kopf = document.createElement('div');
        kopf.className = 'tbl-kopf';
        const adresse = document.createElement('div');
        adresse.className = 'tbl-adresse';
        const fx = document.createElement('div');
        fx.className = 'tbl-fx';
        fx.textContent = 'fx';
        fx.title = 'Tabellenformel — beginnt mit =, Zellen heissen A1, Bereiche A1:A9';
        const eingabe = document.createElement('input');
        eingabe.className = 'tbl-eingabe';
        eingabe.setAttribute('aria-label', 'Inhalt der ausgewählten Zelle');
        eingabe.placeholder = 'Wert oder =Formel';
        const werkzeuge = document.createElement('div');
        werkzeuge.className = 'tbl-werkzeuge';
        const AUSRICHTUNG = '<button data-a="links" title="Linksbündig" aria-label="Linksbündig">' + strichIcon('links') + '</button>' +
            '<button data-a="mitte" title="Zentriert" aria-label="Zentriert">' + strichIcon('mitte') + '</button>' +
            '<button data-a="rechts" title="Rechtsbündig" aria-label="Rechtsbündig">' + strichIcon('rechts') + '</button>';
        werkzeuge.innerHTML = handy
            ? '<button data-a="format" title="Format" aria-label="Format">Format</button>' +
                '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>'
            : '<button data-a="fett" title="Fett" aria-label="Fett"><b>F</b></button>' +
                '<button data-a="kursiv" title="Kursiv" aria-label="Kursiv"><i>K</i></button>' +
                AUSRICHTUNG +
                '<button data-a="waehrung" title="Währung" aria-label="Währung">CHF</button>' +
                '<button data-a="prozent" title="Prozent" aria-label="Prozent">%</button>' +
                '<button data-a="zeile" title="Zeile anhängen" aria-label="Zeile anhängen">+↓</button>' +
                '<button data-a="spalte" title="Spalte anhängen" aria-label="Spalte anhängen">+→</button>' +
                '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>';
        kopf.append(adresse, fx, eingabe, werkzeuge);
        const feld = document.createElement('div');
        feld.className = 'tbl-feld';
        feld.tabIndex = 0;
        feld.setAttribute('role', 'grid');
        feld.setAttribute('aria-label', 'Tabelle ' + (blatt.name || ''));
        const spaltenKopf = document.createElement('div');
        spaltenKopf.className = 'tbl-spalten';
        const koerper = document.createElement('div');
        koerper.className = 'tbl-koerper';
        feld.append(spaltenKopf, koerper);
        if (typeof Rollrand !== 'undefined')
            Rollrand.binde(feld);
        const fuss = document.createElement('div');
        fuss.className = 'tbl-fuss';
        const reiter = document.createElement('div');
        reiter.className = 'tbl-reiter';
        reiter.setAttribute('role', 'tablist');
        reiter.setAttribute('aria-label', 'Blätter');
        w.append(kopf, feld, reiter, fuss);
        const bereich = () => {
            const a = R.lies(anker), b = R.lies(gewaehlt);
            if (!a || !b)
                return null;
            return {
                vonZ: Math.min(a.zeile, b.zeile), bisZ: Math.max(a.zeile, b.zeile),
                vonS: Math.min(a.spalte, b.spalte), bisS: Math.max(a.spalte, b.spalte)
            };
        };
        const fuellBereich = () => {
            const b = bereich();
            if (!b || !fuellZiel)
                return null;
            if (fuellZiel.z > b.bisZ)
                return { vonZ: b.bisZ + 1, bisZ: fuellZiel.z, vonS: b.vonS, bisS: b.bisS };
            if (fuellZiel.s > b.bisS)
                return { vonZ: b.vonZ, bisZ: b.bisZ, vonS: b.bisS + 1, bisS: fuellZiel.s };
            return null;
        };
        const spaltenZeichnen = () => {
            const b = bereich();
            spaltenKopf.innerHTML = '';
            const ecke = document.createElement('div');
            ecke.className = 'tbl-ecke';
            ecke.title = 'Alles auswählen';
            spaltenKopf.appendChild(ecke);
            for (let s = 0; s < blatt.spalten; s++) {
                const d = document.createElement('div');
                d.className = 'tbl-sp' + (b && s >= b.vonS && s <= b.bisS ? ' aktiv' : '');
                d.style.flex = '0 0 ' + breiteVon(s) + 'px';
                d.dataset.s = String(s);
                d.textContent = R.spalteZuText(s);
                const griff = document.createElement('span');
                griff.className = 'tbl-griff';
                griff.dataset.griff = String(s);
                d.appendChild(griff);
                spaltenKopf.appendChild(d);
            }
        };
        const koerperZeichnen = () => {
            koerper.style.height = (blatt.zeilen * zh) + 'px';
            const oben = Math.max(0, Math.floor(feld.scrollTop / zh) - PUFFER);
            const sichtbar = Math.ceil(feld.clientHeight / zh) + PUFFER * 2;
            const unten = Math.min(blatt.zeilen, oben + sichtbar);
            const b = bereich();
            const fb = fuellBereich();
            const regeln = (blatt.regeln || []).filter((r) => r && r.an !== false);
            const vorbereitet = regeln.map((regel) => {
                const g = bereichLesen(regel.bereich, R, blatt);
                return { regel, g, hilf: bereichsWerte(g, blatt, R) };
            });
            koerper.innerHTML = '';
            for (let z = oben; z < unten; z++) {
                const zeile = document.createElement('div');
                zeile.className = 'tbl-zeile';
                zeile.style.top = (z * zh) + 'px';
                const nr = document.createElement('div');
                nr.className = 'tbl-zn' + (b && z >= b.vonZ && z <= b.bisZ ? ' aktiv' : '');
                nr.dataset.z = String(z);
                nr.textContent = String(z + 1);
                zeile.appendChild(nr);
                for (let s = 0; s < blatt.spalten; s++) {
                    const a = R.schreibe(z, s);
                    const zelle = blatt.zellen[a];
                    const wert = zelle ? zelle.wert : '';
                    const stil = (zelle && zelle.stil) || {};
                    const d = document.createElement('div');
                    const klassen = ['tbl-z'];
                    const imB = !!(b && z >= b.vonZ && z <= b.bisZ && s >= b.vonS && s <= b.bisS);
                    const istEcke = !!(b && z === b.bisZ && s === b.bisS);
                    if (a === gewaehlt)
                        klassen.push('gewaehlt');
                    else if (imB)
                        klassen.push('imBereich');
                    if (istEcke)
                        klassen.push('ecke');
                    if (fb && z >= fb.vonZ && z <= fb.bisZ && s >= fb.vonS && s <= fb.bisS)
                        klassen.push('fuellvorschau');
                    if (zelle && zelle.formel)
                        klassen.push('formel');
                    if (istFehler(wert))
                        klassen.push('fehler');
                    else if (typeof wert === 'number')
                        klassen.push('zahl');
                    if (stil.fett)
                        klassen.push('fett');
                    if (stil.kursiv)
                        klassen.push('kursiv');
                    if (stil.ausrichtung)
                        klassen.push(stil.ausrichtung);
                    d.className = klassen.join(' ');
                    d.style.flex = '0 0 ' + breiteVon(s) + 'px';
                    if (vorbereitet.length) {
                        const aus = regelAussehen(z, s, wert, vorbereitet);
                        if (aus) {
                            if (aus.klasse)
                                d.className += aus.klasse;
                            if (aus.stil)
                                d.style.cssText += ';' + aus.stil;
                        }
                    }
                    const voll = zeigeWert(wert, stil.format);
                    const passend = passendMachen(voll, wert, s, stil);
                    if (passend.klasse)
                        d.className += passend.klasse;
                    if (passend.titel)
                        d.title = passend.titel;
                    d.dataset.a = a;
                    d.setAttribute('role', 'gridcell');
                    d.setAttribute('aria-label', a + (wert === '' ? ' leer' : ': ' + voll));
                    d.textContent = passend.text;
                    zeile.appendChild(d);
                }
                koerper.appendChild(zeile);
            }
        };
        const STUFEN = [6, 4, 2, 1, 0];
        let messer = null;
        let schriftBasis = '14px sans-serif';
        const schriftFuer = (stil) => ((stil && stil.kursiv) ? 'italic ' : '') +
            ((stil && stil.fett) ? '700 ' : '') + schriftBasis;
        const breiteDesTextes = (text, stil) => {
            if (!messer) {
                const leinwand = document.createElement('canvas');
                messer = leinwand.getContext('2d');
            }
            if (!messer)
                return 0;
            messer.font = schriftFuer(stil);
            return messer.measureText(text).width;
        };
        const passendMachen = (text, wert, spalte, stil) => {
            const platz = breiteVon(spalte) - 15;
            if (typeof wert !== 'number' || breiteDesTextes(text, stil) <= platz + 2)
                return { text, klasse: '', titel: '' };
            const voll = text;
            if (!(stil && stil.format && stil.format.art)) {
                for (const stellen of STUFEN) {
                    const kurz = wert.toLocaleString('de-CH', {
                        minimumFractionDigits: 0, maximumFractionDigits: stellen
                    });
                    if (breiteDesTextes(kurz, stil) <= platz + 2)
                        return { text: kurz, klasse: ' gekuerzt', titel: voll };
                }
            }
            return { text: '###', klasse: ' zuEng',
                titel: voll + ' — die Spalte ist zu schmal. Ziehe sie breiter.' };
        };
        const fussZeichnen = () => {
            const b = bereich();
            let zahlen = 0, summe = 0, kleinste = Infinity, groesste = -Infinity;
            if (b) {
                for (let z = b.vonZ; z <= b.bisZ; z++)
                    for (let s = b.vonS; s <= b.bisS; s++) {
                        const zelle = blatt.zellen[R.schreibe(z, s)];
                        if (zelle && typeof zelle.wert === 'number' && isFinite(zelle.wert)) {
                            zahlen++;
                            summe += zelle.wert;
                            if (zelle.wert < kleinste)
                                kleinste = zelle.wert;
                            if (zelle.wert > groesste)
                                groesste = zelle.wert;
                        }
                    }
            }
            const gefuellt = Object.keys(blatt.zellen).length;
            fuss.innerHTML = '';
            const teil = (text, klasse = '') => {
                const s = document.createElement('span');
                if (klasse)
                    s.className = klasse;
                s.innerHTML = text;
                fuss.appendChild(s);
            };
            if (!gefuellt) {
                teil('Tippe einen Wert — oder <code>=SUMME(A1:A5)</code> für eine Formel.', 'tbl-tipp');
                return;
            }
            const feldNamen = b && (b.vonZ !== b.bisZ || b.vonS !== b.bisS)
                ? R.schreibe(b.vonZ, b.vonS) + ':' + R.schreibe(b.bisZ, b.bisS) : gewaehlt;
            teil('<b>' + esc(feldNamen) + '</b>');
            if (zahlen > 1) {
                teil('Summe <b>' + esc(zeigeWert(summe)) + '</b>');
                teil('Mittel <b>' + esc(zeigeWert(Math.round((summe / zahlen) * 1000) / 1000)) + '</b>');
                teil('Kleinste <b>' + esc(zeigeWert(kleinste)) + '</b>');
                teil('Grösste <b>' + esc(zeigeWert(groesste)) + '</b>');
                teil('Anzahl <b>' + zahlen + '</b>');
            }
            teil(gefuellt + ' gefüllt');
            const aktiv = blatt.zellen[gewaehlt];
            const erklaerung = erklaere(aktiv && aktiv.wert);
            if (erklaerung)
                teil('<b>' + esc(aktiv.wert) + '</b> ' + esc(erklaerung), 'tbl-erklaerung');
            if (zirkel.length)
                teil('Zirkelbezug: ' + esc(zirkel.slice(0, 6).join(', ')) +
                    (zirkel.length > 6 ? ' …' : ''), 'tbl-warnung');
        };
        const kopfZeichnen = () => {
            adresse.textContent = gewaehlt;
            if (document.activeElement !== eingabe)
                eingabe.value = K.eingabe(blatt, gewaehlt);
            const zelle = blatt.zellen[gewaehlt];
            const stil = (zelle && zelle.stil) || {};
            werkzeuge.querySelectorAll('button').forEach((b) => {
                const a = b.dataset.a || '';
                const an = (a === 'fett' && stil.fett) || (a === 'kursiv' && stil.kursiv) ||
                    (a === stil.ausrichtung) ||
                    (a === 'waehrung' && stil.format && stil.format.art === 'waehrung') ||
                    (a === 'prozent' && stil.format && stil.format.art === 'prozent');
                b.classList.toggle('on', !!an);
            });
        };
        const reiterZeichnen = () => {
            const viele = block.mappe.blaetter.length > 1;
            reiter.classList.toggle('einzeln', !viele);
            reiter.innerHTML = '';
            block.mappe.blaetter.forEach((b) => {
                const r = document.createElement('button');
                r.className = 'tbl-reiter-eins' + (b.id === blatt.id ? ' aktiv' : '');
                r.dataset.blatt = b.id;
                r.setAttribute('role', 'tab');
                r.setAttribute('aria-selected', b.id === blatt.id ? 'true' : 'false');
                r.textContent = b.name || 'Ohne Namen';
                r.title = viele ? b.name + ' — Doppelklick zum Umbenennen' : b.name;
                reiter.appendChild(r);
            });
            const plus = document.createElement('button');
            plus.className = 'tbl-reiter-plus';
            plus.dataset.a = 'neu';
            plus.textContent = '+';
            plus.title = 'Neues Blatt';
            plus.setAttribute('aria-label', 'Neues Blatt');
            reiter.appendChild(plus);
        };
        const zuBlatt = (id) => {
            const neu = block.mappe.blaetter.find((b) => b.id === id);
            if (!neu || neu.id === blatt.id)
                return;
            blatt = neu;
            if (!blatt.breiten)
                blatt.breiten = {};
            block.mappe.aktiv = blatt.id;
            gewaehlt = anker = 'A1';
            feld.scrollTop = 0;
            sichere();
            alles();
        };
        const alles = () => {
            spaltenZeichnen();
            koerperZeichnen();
            fussZeichnen();
            kopfZeichnen();
            reiterZeichnen();
        };
        const rechneUndZeichne = () => {
            const erg = K.rechneMappe(block.mappe);
            zirkel = erg.zirkel || [];
            sichere();
            alles();
        };
        const regelFenster = () => {
            const o = document.createElement('div');
            o.className = 'overlay';
            const b0 = bereich();
            const vorschlag = b0
                ? R.schreibe(b0.vonZ, b0.vonS) + ':' + R.schreibe(b0.bisZ, b0.bisS)
                : '';
            o.innerHTML = '<div class="finder" style="width:min(620px,94vw)">' +
                '<div class="fh">🎨 Bedingte Formatierung' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="dl-hinweis rg-hinweis">Die erste Regel, die zutrifft, färbt ' +
                'die Zelle. Die Werte selbst bleiben unverändert — eine Regel ist eine ' +
                'Sicht, keine Bearbeitung.</div>' +
                '<div class="rg-liste" id="rg-liste"></div>' +
                '<div class="rg-neu">' +
                `<input id="rg-bereich" placeholder="Bereich, z. B. B2:B40" value="${esc(vorschlag)}">` +
                '<select id="rg-art">' +
                REGELARTEN.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('') +
                '</select>' +
                '<input id="rg-wert" placeholder="Wert" style="max-width:110px">' +
                '<input id="rg-wert2" placeholder="bis" style="max-width:80px; display:none">' +
                '<select id="rg-satz" style="display:none">' +
                Object.entries(SYMBOLSAETZE).map(([id, z]) => `<option value="${id}">${z.join(' ')}</option>`).join('') +
                '</select>' +
                '<label id="rg-umlabel" style="display:none; align-items:center; gap:6px; ' +
                'font-size:13px; color:var(--text-dim)">' +
                '<input type="checkbox" id="rg-um" style="width:auto">klein ist gut</label>' +
                '<select id="rg-farbe">' +
                Object.keys(REGELFARBEN).map(f => `<option value="${f}">${f}</option>`).join('') +
                '</select>' +
                '<button data-a="add" class="prim">Hinzufügen</button>' +
                '</div>' +
                '<div class="fbtns"><button data-a="zu">Fertig</button></div></div>';
            document.body.appendChild(o);
            const satz = (r) => {
                const name = (REGELARTEN.find(x => x[0] === r.art) || ['', r.art])[1];
                const wert = r.art === 'zwischen' ? `${r.wert ?? ''} und ${r.wert2 ?? ''}`
                    : OHNE_WERT.includes(r.art)
                        ? '' : String(r.wert ?? '');
                const anhang = r.art === 'symbol'
                    ? ' ' + (SYMBOLSAETZE[r.satz || 'ampel'] || []).join('') : '';
                return `${r.bereich || 'ganzes Blatt'} ${name}${wert ? ' ' + wert : ''}${anhang}`;
            };
            const zeichneListe = () => {
                const k = o.querySelector('#rg-liste');
                if (!k)
                    return;
                const l = blatt.regeln || [];
                k.innerHTML = l.length
                    ? l.map((r, i) => '<div class="fr-zeile">' +
                        (r.art === 'symbol'
                            ? `<span class="fr-punkt fr-symbol">${esc((SYMBOLSAETZE[r.satz || 'ampel'] || [])[2] ?? '')}</span>`
                            : r.art === 'skala' || r.art === 'balken'
                                ? '<span class="fr-punkt fr-verlauf"></span>'
                                : `<span class="fr-punkt bg-${REGELFARBEN[r.farbe || 'gelb'] || 'yellow'}"></span>`) +
                        `<span class="fr-text">${esc(satz(r))}</span>` +
                        `<button data-an="${i}" title="An oder aus">${r.an === false ? '☐' : '☑'}</button>` +
                        `<button data-weg="${i}" title="Regel löschen">🗑</button></div>`).join('')
                    : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
                        'Noch keine Regel. Unten eine anlegen — der Bereich ist schon ' +
                        'ausgefüllt, wenn du vorher etwas markiert hast.</div>';
            };
            zeichneListe();
            const felderAnpassen = () => {
                const art = o.querySelector('#rg-art')?.value || '';
                const w1 = o.querySelector('#rg-wert');
                const w2 = o.querySelector('#rg-wert2');
                const fa = o.querySelector('#rg-farbe');
                const sa = o.querySelector('#rg-satz');
                const um = o.querySelector('#rg-umlabel');
                const w1f = o.querySelector('#rg-wert');
                if (w1)
                    w1.style.display = OHNE_WERT.includes(art) ? 'none' : '';
                if (w2)
                    w2.style.display = (art === 'zwischen' || art === 'symbol') ? '' : 'none';
                if (fa)
                    fa.style.display = OHNE_FARBE.includes(art) ? 'none' : '';
                if (sa)
                    sa.style.display = art === 'symbol' ? '' : 'none';
                if (um)
                    um.style.display = art === 'symbol' ? 'flex' : 'none';
                if (w1f)
                    w1f.placeholder = art === 'symbol' ? 'ab'
                        : art === 'faelligBald' ? 'Tage' : 'Wert';
            };
            felderAnpassen();
            o.querySelector('#rg-art')?.addEventListener('change', felderAnpassen);
            o.addEventListener('click', e => {
                const ziel = e.target instanceof Element ? e.target : null;
                if (e.target === o || ziel?.closest('[data-a="zu"]')) {
                    o.remove();
                    return;
                }
                const an = ziel?.closest('[data-an]');
                if (an) {
                    const l = blatt.regeln || [];
                    const i = Number(an.dataset['an']);
                    if (l[i])
                        l[i].an = l[i].an === false;
                    blatt.regeln = l;
                    sichere();
                    alles();
                    zeichneListe();
                    return;
                }
                const weg = ziel?.closest('[data-weg]');
                if (weg) {
                    const l = blatt.regeln || [];
                    l.splice(Number(weg.dataset['weg']), 1);
                    blatt.regeln = l;
                    sichere();
                    alles();
                    zeichneListe();
                    return;
                }
                if (!ziel?.closest('[data-a="add"]'))
                    return;
                const art = o.querySelector('#rg-art')?.value || 'groesser';
                const regel = {
                    bereich: (o.querySelector('#rg-bereich')?.value || '').trim(),
                    art, an: true
                };
                if (!OHNE_WERT.includes(art))
                    regel['wert'] = o.querySelector('#rg-wert')?.value ?? '';
                if (art === 'zwischen' || art === 'symbol')
                    regel['wert2'] = o.querySelector('#rg-wert2')?.value ?? '';
                if (!OHNE_FARBE.includes(art))
                    regel['farbe'] = o.querySelector('#rg-farbe')?.value || 'gelb';
                if (art === 'symbol') {
                    regel['satz'] = o.querySelector('#rg-satz')?.value || 'ampel';
                    regel['umgekehrt'] = o.querySelector('#rg-um')?.checked ?? false;
                }
                blatt.regeln = (blatt.regeln || []).concat([regel]);
                sichere();
                alles();
                zeichneListe();
            });
        };
        const waehle = (a, mitAnker = false) => {
            if (!R.gueltig(a))
                return;
            gewaehlt = a;
            if (!mitAnker)
                anker = a;
            alles();
            const l = R.lies(a);
            if (l) {
                const oben = l.zeile * zh, unten = oben + zh;
                if (oben < feld.scrollTop)
                    feld.scrollTop = oben;
                else if (unten > feld.scrollTop + feld.clientHeight)
                    feld.scrollTop = unten - feld.clientHeight;
            }
        };
        const waehleBereich = (vonZ, vonS, bisZ, bisS) => {
            anker = R.schreibe(vonZ, vonS);
            gewaehlt = R.schreibe(bisZ, bisS);
            alles();
        };
        const uebernimm = (text) => {
            K.setze(blatt, gewaehlt, text);
            rechneUndZeichne();
        };
        const bearbeite = (start) => {
            const d = koerper.querySelector('[data-a="' + gewaehlt + '"]');
            if (!d)
                return;
            const feldchen = document.createElement('input');
            feldchen.value = start !== undefined ? start : K.eingabe(blatt, gewaehlt);
            feldchen.setAttribute('aria-label', 'Zelle ' + gewaehlt);
            d.appendChild(feldchen);
            feldchen.focus();
            if (start === undefined)
                feldchen.select();
            if (handy && d.scrollIntoView)
                setTimeout(() => d.scrollIntoView({ block: 'center', inline: 'nearest' }), 50);
            let beendet = false;
            const schliesse = (nehmen, dann) => {
                if (beendet)
                    return;
                beendet = true;
                const wert = feldchen.value;
                feldchen.remove();
                if (nehmen)
                    uebernimm(wert);
                else
                    alles();
                feld.focus();
                if (dann)
                    dann();
            };
            feldchen.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    schliesse(true, () => waehle(R.versetzt(gewaehlt, 1, 0) || gewaehlt));
                }
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    schliesse(true, () => waehle(R.versetzt(gewaehlt, 0, 1) || gewaehlt));
                }
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    schliesse(false);
                }
            });
            feldchen.addEventListener('blur', () => schliesse(true));
        };
        const beimZiehen = (bewegen, fertig) => {
            const auf = (e) => { bewegen(e); };
            const ab = () => {
                document.removeEventListener('mousemove', auf);
                document.removeEventListener('mouseup', ab);
                fertig();
            };
            document.addEventListener('mousemove', auf);
            document.addEventListener('mouseup', ab);
        };
        const zelleUnter = (e) => {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const z = el && el.closest ? el.closest('.tbl-z') : null;
            if (!z || !z.dataset.a)
                return null;
            const l = R.lies(z.dataset.a);
            return l ? { z: l.zeile, s: l.spalte } : null;
        };
        koerper.addEventListener('mousedown', (e) => {
            const ziel = e.target;
            const z = ziel.closest('.tbl-z');
            if (z && z.classList.contains('ecke')) {
                const r = z.getBoundingClientRect();
                if (e.clientX > r.right - 10 && e.clientY > r.bottom - 10) {
                    e.preventDefault();
                    fuellZiel = null;
                    beimZiehen((ev) => { const p = zelleUnter(ev); if (p) {
                        fuellZiel = p;
                        koerperZeichnen();
                    } }, () => {
                        const b = bereich(), fz = fuellZiel;
                        fuellZiel = null;
                        if (b && fz && (fz.z > b.bisZ || fz.s > b.bisS)) {
                            K.fuelle(blatt, b, Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                            gewaehlt = R.schreibe(Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                            rechneUndZeichne();
                        }
                        else
                            alles();
                    });
                    return;
                }
            }
            if (!z || !z.dataset.a)
                return;
            waehle(z.dataset.a, e.shiftKey);
            feld.focus();
            beimZiehen((ev) => { const p = zelleUnter(ev); if (p)
                waehle(R.schreibe(p.z, p.s), true); }, () => { });
        });
        koerper.addEventListener('dblclick', (e) => {
            const z = e.target.closest('.tbl-z');
            if (z && z.dataset.a) {
                waehle(z.dataset.a);
                bearbeite();
            }
        });
        feld.addEventListener('scroll', () => koerperZeichnen());
        feld.addEventListener('focus', () => w.classList.add('imFokus'));
        feld.addEventListener('blur', () => w.classList.remove('imFokus'));
        koerper.addEventListener('click', (e) => {
            const nr = e.target.closest('.tbl-zn');
            if (!nr || nr.dataset.z === undefined)
                return;
            const z = Number(nr.dataset.z);
            waehleBereich(z, 0, z, blatt.spalten - 1);
            feld.focus();
        });
        spaltenKopf.addEventListener('mousedown', (e) => {
            const ziel = e.target;
            if (ziel.dataset && ziel.dataset.griff !== undefined) {
                e.preventDefault();
                const s = Number(ziel.dataset.griff);
                const startX = e.clientX;
                const startB = breiteVon(s);
                beimZiehen((ev) => {
                    blatt.breiten[s] = Math.max(SB_MIN, Math.round(startB + (ev.clientX - startX)));
                    spaltenZeichnen();
                    koerperZeichnen();
                }, () => { sichere(); });
                return;
            }
            const sp = ziel.closest('.tbl-sp');
            if (sp && sp.dataset.s !== undefined) {
                const s = Number(sp.dataset.s);
                waehleBereich(0, s, blatt.zeilen - 1, s);
                feld.focus();
                return;
            }
            if (ziel.closest('.tbl-ecke')) {
                waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
                feld.focus();
            }
        });
        const menuFuer = (art, index, x, y) => {
            if (typeof Menue === 'undefined')
                return;
            const was = art === 'zeile' ? 'Zeile' : 'Spalte';
            const name = art === 'zeile' ? String(index + 1) : R.spalteZuText(index);
            const html = `<button data-a="vor"><span class="mi">⬆</span>${was} davor einfügen</button>` +
                `<button data-a="nach"><span class="mi">⬇</span>${was} danach einfügen</button>` +
                '<hr>' +
                (art === 'spalte'
                    ? '<button data-a="auf"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
                        '<button data-a="abv"><span class="mi">↓</span>Absteigend sortieren</button><hr>'
                    : '') +
                `<button data-a="del"><span class="mi">🗑</span>${was} ${esc(name)} löschen</button>`;
            const m = Menue.menu(html, x, y, { titel: was + ' ' + name });
            m.addEventListener('click', (ev) => {
                const b = ev.target.closest('button');
                if (!b || !b.dataset.a)
                    return;
                const a = b.dataset.a;
                m.remove();
                document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                if (a === 'vor' || a === 'nach') {
                    const bei = a === 'vor' ? index : index + 1;
                    if (art === 'zeile')
                        K.zeileEinfuegen(blatt, bei);
                    else
                        K.spalteEinfuegen(blatt, bei);
                }
                else if (a === 'del') {
                    if (art === 'zeile') {
                        if (blatt.zeilen <= 1)
                            return;
                        K.zeileLoeschen(blatt, index);
                    }
                    else {
                        if (blatt.spalten <= 1)
                            return;
                        K.spalteLoeschen(blatt, index);
                        const neu = {};
                        Object.keys(blatt.breiten).forEach(k => {
                            const s = Number(k);
                            if (s < index)
                                neu[s] = blatt.breiten[k];
                            else if (s > index)
                                neu[s - 1] = blatt.breiten[k];
                        });
                        blatt.breiten = neu;
                    }
                }
                else if (a === 'auf' || a === 'abv') {
                    K.sortiere(blatt, index, 0, blatt.zeilen - 1, a === 'auf');
                }
                rechneUndZeichne();
            });
        };
        const aufKopfMenue = (e) => {
            const ziel = e.target;
            const nr = ziel.closest('.tbl-zn');
            const sp = ziel.closest('.tbl-sp');
            if (nr && nr.dataset.z !== undefined) {
                e.preventDefault();
                menuFuer('zeile', Number(nr.dataset.z), e.clientX, e.clientY);
            }
            else if (sp && sp.dataset.s !== undefined) {
                e.preventDefault();
                menuFuer('spalte', Number(sp.dataset.s), e.clientX, e.clientY);
            }
        };
        koerper.addEventListener('contextmenu', aufKopfMenue);
        spaltenKopf.addEventListener('contextmenu', aufKopfMenue);
        let druckUhr = 0;
        const langerDruck = (e) => {
            const t = e.touches[0];
            if (!t)
                return;
            const x = t.clientX, y = t.clientY;
            const ziel = e.target;
            druckUhr = window.setTimeout(() => {
                const nr = ziel.closest('.tbl-zn');
                const sp = ziel.closest('.tbl-sp');
                if (nr && nr.dataset.z !== undefined)
                    menuFuer('zeile', Number(nr.dataset.z), x, y);
                else if (sp && sp.dataset.s !== undefined)
                    menuFuer('spalte', Number(sp.dataset.s), x, y);
            }, 500);
        };
        const druckWeg = () => { if (druckUhr) {
            clearTimeout(druckUhr);
            druckUhr = 0;
        } };
        [koerper, spaltenKopf].forEach(el => {
            el.addEventListener('touchstart', langerDruck, { passive: true });
            el.addEventListener('touchend', druckWeg);
            el.addEventListener('touchmove', druckWeg, { passive: true });
        });
        feld.addEventListener('keydown', (e) => {
            const k = e.key;
            const mit = e.shiftKey;
            const strg = e.ctrlKey || e.metaKey;
            const springe = (dz, ds) => {
                const ziel = R.versetzt(gewaehlt, dz, ds);
                if (ziel) {
                    e.preventDefault();
                    waehle(ziel, mit);
                }
            };
            if (strg && (k === 'a' || k === 'A')) {
                e.preventDefault();
                return waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
            }
            if (k === 'ArrowUp')
                return springe(-1, 0);
            if (k === 'ArrowDown')
                return springe(1, 0);
            if (k === 'ArrowLeft')
                return springe(0, -1);
            if (k === 'ArrowRight')
                return springe(0, 1);
            if (k === 'PageDown') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(Math.min(blatt.zeilen - 1, (l ? l.zeile : 0) + 20), l ? l.spalte : 0), mit);
            }
            if (k === 'PageUp') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(Math.max(0, (l ? l.zeile : 0) - 20), l ? l.spalte : 0), mit);
            }
            if (k === 'Tab') {
                e.preventDefault();
                return waehle(R.versetzt(gewaehlt, 0, mit ? -1 : 1) || gewaehlt);
            }
            if (k === 'Enter') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'F2') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'Delete' || k === 'Backspace') {
                e.preventDefault();
                const b = bereich();
                if (b)
                    for (let z = b.vonZ; z <= b.bisZ; z++)
                        for (let s = b.vonS; s <= b.bisS; s++)
                            K.setze(blatt, R.schreibe(z, s), '');
                return rechneUndZeichne();
            }
            if (k === 'Home') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(strg ? 0 : (l ? l.zeile : 0), 0), mit);
            }
            if (k === 'End') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(strg ? blatt.zeilen - 1 : (l ? l.zeile : 0), blatt.spalten - 1), mit);
            }
            if (k.length === 1 && !strg && !e.altKey) {
                e.preventDefault();
                return bearbeite(k);
            }
        });
        feld.addEventListener('copy', (e) => {
            const b = bereich();
            if (!b || !e.clipboardData)
                return;
            const zeilen = [];
            for (let z = b.vonZ; z <= b.bisZ; z++) {
                const sp = [];
                for (let s = b.vonS; s <= b.bisS; s++)
                    sp.push(K.eingabe(blatt, R.schreibe(z, s)));
                zeilen.push(sp.join('\t'));
            }
            e.clipboardData.setData('text/plain', zeilen.join('\n'));
            e.preventDefault();
        });
        feld.addEventListener('paste', (e) => {
            if (!e.clipboardData)
                return;
            const text = e.clipboardData.getData('text/plain');
            if (!text)
                return;
            e.preventDefault();
            const start = R.lies(gewaehlt);
            if (!start)
                return;
            const zeilen = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
            zeilen.forEach((zeile, dz) => {
                zeile.split('\t').forEach((wert, ds) => {
                    if (start.zeile + dz + 1 > blatt.zeilen)
                        blatt.zeilen = start.zeile + dz + 1;
                    if (start.spalte + ds + 1 > blatt.spalten)
                        blatt.spalten = start.spalte + ds + 1;
                    K.setze(blatt, R.schreibe(start.zeile + dz, start.spalte + ds), wert);
                });
            });
            rechneUndZeichne();
        });
        eingabe.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                uebernimm(eingabe.value);
                feld.focus();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                kopfZeichnen();
                feld.focus();
            }
        });
        eingabe.addEventListener('blur', () => {
            if (eingabe.value !== K.eingabe(blatt, gewaehlt))
                uebernimm(eingabe.value);
        });
        const alsZeilenVon = (vonBlatt) => {
            const raus = [];
            let letzteVolle = 0;
            for (let z = 0; z < vonBlatt.zeilen; z++) {
                const eine = [];
                let etwasDrin = false;
                for (let s = 0; s < vonBlatt.spalten; s++) {
                    const zelle = vonBlatt.zellen[R.schreibe(z, s)];
                    const wert = zelle ? zelle.wert : '';
                    const t = zeigeWert(wert, zelle && zelle.stil && zelle.stil.format);
                    if (t !== '')
                        etwasDrin = true;
                    eine.push(t);
                }
                raus.push(eine);
                if (etwasDrin)
                    letzteVolle = raus.length;
            }
            return raus.slice(0, letzteVolle);
        };
        const alsZeilen = () => alsZeilenVon(blatt);
        const alsRohVon = (vonBlatt) => {
            const zeilen = [];
            const anzeigen = [];
            const stile = [];
            const formeln = [];
            let letzteVolle = 0;
            for (let z = 0; z < vonBlatt.zeilen; z++) {
                const eine = [];
                const anzeigeZeile = [];
                const stilZeile = [];
                const formelZeile = [];
                let etwasDrin = false;
                for (let s = 0; s < vonBlatt.spalten; s++) {
                    const zelle = vonBlatt.zellen[R.schreibe(z, s)];
                    const wert = zelle ? zelle.wert : '';
                    const text = zeigeWert(wert, zelle && zelle.stil && zelle.stil.format);
                    const roh = (typeof wert === 'number' && isFinite(wert)) ? wert : text;
                    if (roh !== '' || (zelle && zelle.formel))
                        etwasDrin = true;
                    eine.push(roh);
                    anzeigeZeile.push(text);
                    stilZeile.push((zelle && zelle.stil) || null);
                    formelZeile.push((zelle && zelle.formel) || null);
                }
                zeilen.push(eine);
                anzeigen.push(anzeigeZeile);
                stile.push(stilZeile);
                formeln.push(formelZeile);
                if (etwasDrin)
                    letzteVolle = zeilen.length;
            }
            return { zeilen: zeilen.slice(0, letzteVolle),
                anzeigen: anzeigen.slice(0, letzteVolle),
                stile: stile.slice(0, letzteVolle),
                formeln: formeln.slice(0, letzteVolle) };
        };
        const alsCsv = () => Csv.schreibe(alsZeilen(), ';');
        const gibAus = (art) => {
            const name = (blatt.name || block.mappe.name || 'Tabelle').replace(/[\\/:*?"<>|]/g, '-');
            if (art === 'xlsx') {
                if (typeof Austausch === 'undefined')
                    return;
                Austausch.alsExcel(block.mappe.blaetter.map((b, i) => ({ name: b.name || ('Blatt ' + (i + 1)), ...alsRohVon(b) })), name);
                return;
            }
            if (art === 'ods') {
                if (typeof Austausch === 'undefined')
                    return;
                Austausch.alsOds(block.mappe.blaetter.map((b, i) => ({ name: b.name || ('Blatt ' + (i + 1)), ...alsRohVon(b) })), name)
                    .catch((e) => {
                    if (typeof UI !== 'undefined' && UI.toast)
                        UI.toast('Die .ods kam nicht zustande: ' +
                            (e instanceof Error ? e.message : String(e)));
                });
                return;
            }
            const blob = new Blob([Csv.mitBom(alsCsv())], { type: 'text/csv;charset=utf-8' });
            if (typeof Austausch !== 'undefined' && Austausch.laden)
                Austausch.laden(blob, name + '.csv');
            else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = name + '.csv';
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }
        };
        const einlesen = () => {
            const eingang = document.createElement('input');
            eingang.type = 'file';
            eingang.accept = '.csv,.tsv,.txt,.xlsx,.xlsm,.ods';
            eingang.style.display = 'none';
            document.body.appendChild(eingang);
            eingang.addEventListener('change', async () => {
                const datei = eingang.files && eingang.files[0];
                eingang.remove();
                if (!datei)
                    return;
                let zeilen = [];
                let stilMatrix = null;
                let formelMatrix = null;
                let importBericht = null;
                const stilDazu = (ziel, z, sp, adr, matrix) => {
                    const st = matrix && matrix[z] && matrix[z][sp];
                    if (!st)
                        return;
                    const zelle = ziel.zellen[adr] || (ziel.zellen[adr] = { wert: '' });
                    zelle.stil = JSON.parse(JSON.stringify(st));
                };
                const setzeGelesen = (ziel, adr, wert, formel) => {
                    if (wert !== '')
                        K.setze(ziel, adr, wert);
                    if (formel)
                        K.setze(ziel, adr, formel);
                };
                let quelle = datei.name;
                try {
                    if (/\.(xlsx|xlsm|ods)$/i.test(datei.name)) {
                        if (typeof Einlesen === 'undefined')
                            throw new Error('Der Tabellen-Leser ist nicht geladen.');
                        const blaetter = /\.ods$/i.test(datei.name)
                            ? await Einlesen.odsLesen(await datei.arrayBuffer())
                            : await Einlesen.xlsxLesen(await datei.arrayBuffer());
                        if (!blaetter || !blaetter.length)
                            throw new Error('In dieser Datei steckt kein Tabellenblatt.');
                        importBericht = blaetter.bericht || null;
                        if (blaetter.length > 1) {
                            const belegt = new Set(block.mappe.blaetter.map((b) => String(b.name)));
                            const importName = (roh) => {
                                const basis = roh || 'Blatt';
                                let n = basis, i = 2;
                                while (belegt.has(n))
                                    n = basis + ' ' + i++;
                                belegt.add(n);
                                return n;
                            };
                            const vorbereitet = blaetter.map((gelesen) => {
                                const neu = K.neuesBlatt(importName(String(gelesen.name || 'Blatt')));
                                const zl = gelesen.zeilen || [];
                                neu.zeilen = Math.max(neu.zeilen, zl.length);
                                neu.spalten = Math.max(neu.spalten, zl.reduce((m, x) => Math.max(m, x.length), 1));
                                zl.forEach((zeileWerte, z) => zeileWerte.forEach((wert, s) => {
                                    const adr = R.schreibe(z, s);
                                    setzeGelesen(neu, adr, wert, gelesen.formeln && gelesen.formeln[z] && gelesen.formeln[z][s]);
                                    stilDazu(neu, z, s, adr, gelesen.stile || null);
                                }));
                                return neu;
                            });
                            const verlustText = Einlesen.tabellenBerichtText
                                ? Einlesen.tabellenBerichtText(importBericht) : '';
                            const blattText = blaetter.map((g) => {
                                const zl = g.zeilen || [];
                                return String(g.name || 'Blatt') + ': ' + zl.length + ' Zeilen × ' +
                                    zl.reduce((m, z) => Math.max(m, z.length), 0) + ' Spalten';
                            }).join('\n');
                            const antwortMehr = typeof Dialog !== 'undefined'
                                ? await Dialog.wahl({
                                    titel: 'Einlesen: ' + datei.name,
                                    text: blattText + (verlustText ? '\n\n' + verlustText : ''),
                                    knoepfe: [
                                        { id: 'rein', text: blaetter.length + ' Blätter anlegen',
                                            hinweis: 'Bestehende Blätter bleiben unverändert' },
                                        { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' }
                                    ]
                                })
                                : 'rein';
                            if (!antwortMehr)
                                return;
                            block.mappe.blaetter.push(...vorbereitet);
                            const letztes = block.mappe.blaetter[block.mappe.blaetter.length - 1];
                            zuBlatt(letztes.id);
                            rechneUndZeichne();
                            if (typeof UI !== 'undefined' && UI.toast)
                                UI.toast(blaetter.length + ' Blätter aus „' + datei.name + '" angelegt');
                            return;
                        }
                        zeilen = blaetter[0].zeilen || [];
                        stilMatrix = blaetter[0].stile || null;
                        formelMatrix = blaetter[0].formeln || null;
                        quelle = datei.name;
                    }
                    else {
                        zeilen = Csv.zerlege(await datei.text());
                    }
                }
                catch (e) {
                    if (typeof UI !== 'undefined' && UI.toast)
                        UI.toast('Die Datei liess sich nicht lesen: ' + (e && e.message ? e.message : e));
                    return;
                }
                if (!zeilen.length) {
                    if (typeof UI !== 'undefined' && UI.toast)
                        UI.toast('Die Datei ist leer.');
                    return;
                }
                const breite = zeilen.reduce((m, z) => Math.max(m, z.length), 0);
                const start = R.lies(gewaehlt) || { zeile: 0, spalte: 0 };
                const zaehleUeberschrieben = (vonZ, vonS) => {
                    let n = 0;
                    for (let z = 0; z < zeilen.length; z++)
                        for (let s = 0; s < zeilen[z].length; s++) {
                            const alt = blatt.zellen[R.schreibe(vonZ + z, vonS + s)];
                            if (alt && alt.wert !== '' && alt.wert !== undefined)
                                n++;
                        }
                    return n;
                };
                const gefuellt = Object.keys(blatt.zellen)
                    .filter(a => { const c = blatt.zellen[a]; return c && c.wert !== '' && c.wert !== undefined; }).length;
                const vorschau = zeilen.slice(0, 3)
                    .map(z => z.slice(0, 4).map(v => String(v).slice(0, 14)).join(' · ')).join('\n');
                const knoepfe = [
                    { id: 'a1', text: 'Ab A1 einlesen',
                        hinweis: gefuellt ? zaehleUeberschrieben(0, 0) + ' gefüllte Zellen werden überschrieben'
                            : 'Das Blatt ist leer — nichts geht verloren' }
                ];
                if (gewaehlt !== 'A1')
                    knoepfe.push({ id: 'hier', text: 'Ab ' + gewaehlt + ' einlesen',
                        hinweis: zaehleUeberschrieben(start.zeile, start.spalte) +
                            ' gefüllte Zellen werden überschrieben' });
                knoepfe.push({ id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' });
                const antwort = typeof Dialog !== 'undefined'
                    ? await Dialog.wahl({
                        titel: 'Einlesen: ' + quelle,
                        text: zeilen.length + ' Zeilen × ' + breite + ' Spalten\n\n' + vorschau +
                            (zeilen.length > 3 ? '\n…' : '') +
                            (importBericht && Einlesen.tabellenBerichtText
                                ? '\n\n' + Einlesen.tabellenBerichtText(importBericht) : ''),
                        knoepfe
                    })
                    : 'a1';
                if (!antwort)
                    return;
                const vonZ = antwort === 'hier' ? start.zeile : 0;
                const vonS = antwort === 'hier' ? start.spalte : 0;
                if (vonZ + zeilen.length > blatt.zeilen)
                    blatt.zeilen = vonZ + zeilen.length;
                if (vonS + breite > blatt.spalten)
                    blatt.spalten = vonS + breite;
                zeilen.forEach((zeile, z) => (zeile || []).forEach((wert, sp) => {
                    const adr = R.schreibe(vonZ + z, vonS + sp);
                    setzeGelesen(blatt, adr, wert, formelMatrix && formelMatrix[z] && formelMatrix[z][sp]);
                    stilDazu(blatt, z, sp, adr, stilMatrix);
                }));
                gewaehlt = anker = R.schreibe(vonZ, vonS);
                rechneUndZeichne();
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast(zeilen.length + ' Zeilen eingelesen');
            });
            eingang.click();
        };
        const stilSetzen = (a) => {
            const ber = bereich();
            if (!ber)
                return;
            if (a === 'fuellRunter' || a === 'fuellRechts') {
                const runter = a === 'fuellRunter';
                const bisZ = runter ? Math.min(blatt.zeilen - 1, ber.bisZ + 10) : ber.bisZ;
                const bisS = runter ? ber.bisS : Math.min(blatt.spalten - 1, ber.bisS + 5);
                K.fuelle(blatt, ber, bisZ, bisS);
                gewaehlt = R.schreibe(bisZ, bisS);
                return rechneUndZeichne();
            }
            for (let z = ber.vonZ; z <= ber.bisZ; z++)
                for (let s = ber.vonS; s <= ber.bisS; s++) {
                    const adr = R.schreibe(z, s);
                    const zelle = blatt.zellen[adr] || (blatt.zellen[adr] = { wert: '' });
                    zelle.stil = zelle.stil || {};
                    if (a === 'fett')
                        zelle.stil.fett = !zelle.stil.fett;
                    if (a === 'kursiv')
                        zelle.stil.kursiv = !zelle.stil.kursiv;
                    if (a === 'links' || a === 'mitte' || a === 'rechts')
                        zelle.stil.ausrichtung = zelle.stil.ausrichtung === a ? undefined : a;
                    if (a === 'waehrung')
                        zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'waehrung')
                            ? undefined : { art: 'waehrung', stellen: 2, waehrung: 'CHF' };
                    if (a === 'prozent')
                        zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'prozent')
                            ? undefined : { art: 'prozent', stellen: 1 };
                }
            rechneUndZeichne();
        };
        werkzeuge.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b || !b.dataset.a)
                return;
            const a = b.dataset.a;
            if (a === 'zeile') {
                blatt.zeilen += 1;
                rechneUndZeichne();
                return;
            }
            if (a === 'spalte') {
                blatt.spalten += 1;
                rechneUndZeichne();
                return;
            }
            if (a === 'format') {
                if (typeof Menue === 'undefined')
                    return;
                const zelle = blatt.zellen[gewaehlt];
                const stil = (zelle && zelle.stil) || {};
                const an = (bedingung) => bedingung ? ' ✓' : '';
                const m = Menue.menu('<button data-a="fett"><span class="mi"><b>F</b></span>Fett' + an(stil.fett) + '</button>' +
                    '<button data-a="kursiv"><span class="mi"><i>K</i></span>Kursiv' + an(stil.kursiv) + '</button><hr>' +
                    '<button data-a="links"><span class="mi">' + strichIcon('links') + '</span>Linksbündig' + an(stil.ausrichtung === 'links') + '</button>' +
                    '<button data-a="mitte"><span class="mi">' + strichIcon('mitte') + '</span>Zentriert' + an(stil.ausrichtung === 'mitte') + '</button>' +
                    '<button data-a="rechts"><span class="mi">' + strichIcon('rechts') + '</span>Rechtsbündig' + an(stil.ausrichtung === 'rechts') + '</button><hr>' +
                    '<button data-a="waehrung"><span class="mi">CHF</span>Währung' + an(stil.format && stil.format.art === 'waehrung') + '</button>' +
                    '<button data-a="prozent"><span class="mi">%</span>Prozent' + an(stil.format && stil.format.art === 'prozent') + '</button><hr>' +
                    '<button data-a="fuellRunter"><span class="mi">⬇</span>Nach unten ausfüllen</button>' +
                    '<button data-a="fuellRechts"><span class="mi">➡</span>Nach rechts ausfüllen</button>', 0, innerHeight, { titel: 'Format · ' + gewaehlt });
                m.addEventListener('click', (ev) => {
                    const t = ev.target.closest('button');
                    if (!t || !t.dataset.a)
                        return;
                    m.remove();
                    document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                    stilSetzen(t.dataset.a);
                });
                return;
            }
            if (a === 'mehr') {
                if (typeof Menue === 'undefined')
                    return;
                const r = b.getBoundingClientRect();
                const m = Menue.menu('<button data-a="oeffnen"><span class="mi">📂</span>Tabelle öffnen (Excel, CSV, ODS)</button><hr>' +
                    '<button data-a="xlsx"><span class="mi">📊</span>Als Excel speichern</button>' +
                    '<button data-a="csv"><span class="mi">📄</span>Als CSV speichern</button>' +
                    '<button data-a="ods"><span class="mi">📙</span>Als OpenDocument (.ods) speichern</button><hr>' +
                    '<button data-a="regeln"><span class="mi">🎨</span>Bedingte Formatierung' +
                    ((blatt.regeln || []).length
                        ? '<span class="ms">' + (blatt.regeln || []).length + '</span>' : '') +
                    '</button><hr>' +
                    '<button data-a="zeilen"><span class="mi">⬇</span>20 Zeilen anhängen</button>' +
                    '<button data-a="spalten"><span class="mi">➡</span>5 Spalten anhängen</button><hr>' +
                    '<button data-a="breiten"><span class="mi">↔</span>Spaltenbreiten zurücksetzen</button>', r.left, r.bottom + 4, { titel: 'Tabelle' });
                m.addEventListener('click', (ev) => {
                    const t = ev.target.closest('button');
                    if (!t || !t.dataset.a)
                        return;
                    m.remove();
                    document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                    if (t.dataset.a === 'oeffnen')
                        return einlesen();
                    if (t.dataset.a === 'xlsx')
                        return gibAus('xlsx');
                    if (t.dataset.a === 'csv')
                        return gibAus('csv');
                    if (t.dataset.a === 'ods')
                        return gibAus('ods');
                    if (t.dataset.a === 'regeln')
                        return regelFenster();
                    if (t.dataset.a === 'zeilen')
                        blatt.zeilen += 20;
                    if (t.dataset.a === 'spalten')
                        blatt.spalten += 5;
                    if (t.dataset.a === 'breiten')
                        blatt.breiten = {};
                    rechneUndZeichne();
                });
                return;
            }
            stilSetzen(a);
        });
        const blattMenue = (b, x, y) => {
            if (typeof Menue === 'undefined')
                return;
            const m = Menue.menu('<button data-a="um"><span class="mi">✏️</span>Umbenennen</button>' +
                '<button data-a="kopie"><span class="mi">⧉</span>Verdoppeln</button><hr>' +
                (block.mappe.blaetter.length > 1
                    ? '<button data-a="del"><span class="mi">🗑</span>Blatt „' + esc(b.name) + '" löschen</button>'
                    : '<button data-a="" disabled><span class="mi">🗑</span>Das letzte Blatt bleibt</button>'), x, y, { titel: b.name });
            m.addEventListener('click', async (ev) => {
                const t = ev.target.closest('button');
                if (!t || !t.dataset.a)
                    return;
                const a = t.dataset.a;
                m.remove();
                document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                if (a === 'um')
                    return umbenennen(b);
                if (a === 'kopie') {
                    const kopie = JSON.parse(JSON.stringify(b));
                    kopie.id = (typeof Ids !== 'undefined') ? Ids.short(8)
                        : 'x' + Math.random().toString(36).slice(2, 10);
                    kopie.name = freierName(b.name + ' Kopie');
                    block.mappe.blaetter.push(kopie);
                    zuBlatt(kopie.id);
                    return;
                }
                if (a === 'del') {
                    let betroffen = 0;
                    block.mappe.blaetter.forEach((andere) => {
                        if (andere.id === b.id)
                            return;
                        Object.keys(andere.zellen || {}).forEach(adr => {
                            const z = andere.zellen[adr];
                            if (z && z.formel && K.uebersetze(z.formel, andere.name).liest
                                .some((n) => K.trenneBlatt(n).blatt === b.name))
                                betroffen++;
                        });
                    });
                    const gefuellt = Object.keys(b.zellen || {}).length;
                    const antwort = typeof Dialog !== 'undefined'
                        ? await Dialog.wahl({
                            titel: 'Blatt „' + b.name + '" löschen?',
                            text: gefuellt + ' gefüllte Zellen' +
                                (betroffen ? '\n\n' + betroffen + ' Formeln auf anderen Blättern zeigen hierher. ' +
                                    'Sie zeigen danach ins Leere und stehen als #BEZUG! da.'
                                    : '\n\nKeine Formel auf einem anderen Blatt zeigt hierher.'),
                            knoepfe: [
                                { id: '', text: 'Behalten', hinweis: 'Es wird nichts verändert' },
                                { id: 'ja', text: 'Löschen', hinweis: gefuellt + ' Zellen gehen verloren' }
                            ]
                        })
                        : 'ja';
                    if (antwort !== 'ja')
                        return;
                    const i = block.mappe.blaetter.indexOf(b);
                    block.mappe.blaetter.splice(i, 1);
                    const naechstes = block.mappe.blaetter[Math.max(0, i - 1)];
                    blatt = naechstes;
                    block.mappe.aktiv = naechstes.id;
                    gewaehlt = anker = 'A1';
                    rechneUndZeichne();
                }
            });
        };
        const freierName = (wunsch) => {
            const belegt = new Set(block.mappe.blaetter.map((b) => b.name));
            if (!belegt.has(wunsch))
                return wunsch;
            for (let i = 2; i < 999; i++)
                if (!belegt.has(wunsch + ' ' + i))
                    return wunsch + ' ' + i;
            return wunsch + ' ' + Date.now();
        };
        const umbenennen = async (b) => {
            if (typeof Dialog === 'undefined')
                return;
            const neu = await Dialog.frage('Blatt umbenennen', b.name);
            if (!neu || neu === b.name)
                return;
            const sauber = String(neu).replace(/[!'"]/g, '').trim().slice(0, 40);
            if (!sauber)
                return;
            const alt = b.name;
            b.name = freierName(sauber);
            block.mappe.blaetter.forEach((andere) => {
                Object.keys(andere.zellen || {}).forEach(adr => {
                    const z = andere.zellen[adr];
                    if (z && z.formel)
                        z.formel = K.blattUmbenannt(z.formel, alt, b.name);
                });
            });
            rechneUndZeichne();
        };
        reiter.addEventListener('click', (e) => {
            const ziel = e.target;
            if (ziel.dataset && ziel.dataset.a === 'neu') {
                const neu = K.neuesBlatt(freierName('Tabelle ' + (block.mappe.blaetter.length + 1)));
                block.mappe.blaetter.push(neu);
                zuBlatt(neu.id);
                return;
            }
            const r = ziel.closest('.tbl-reiter-eins');
            if (r && r.dataset.blatt)
                zuBlatt(r.dataset.blatt);
        });
        reiter.addEventListener('dblclick', (e) => {
            const r = e.target.closest('.tbl-reiter-eins');
            if (!r || !r.dataset.blatt)
                return;
            const b = block.mappe.blaetter.find((x) => x.id === r.dataset.blatt);
            if (b)
                umbenennen(b);
        });
        reiter.addEventListener('contextmenu', (e) => {
            const r = e.target.closest('.tbl-reiter-eins');
            if (!r || !r.dataset.blatt)
                return;
            e.preventDefault();
            const b = block.mappe.blaetter.find((x) => x.id === r.dataset.blatt);
            if (b)
                blattMenue(b, e.clientX, e.clientY);
        });
        let reiterUhr = 0;
        reiter.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            const r = e.target.closest('.tbl-reiter-eins');
            if (!t || !r || !r.dataset.blatt)
                return;
            const x = t.clientX, y = t.clientY, id = r.dataset.blatt;
            reiterUhr = window.setTimeout(() => {
                const b = block.mappe.blaetter.find((z) => z.id === id);
                if (b)
                    blattMenue(b, x, y);
            }, 500);
        }, { passive: true });
        const reiterLos = () => { if (reiterUhr) {
            clearTimeout(reiterUhr);
            reiterUhr = 0;
        } };
        reiter.addEventListener('touchend', reiterLos);
        reiter.addEventListener('touchmove', reiterLos, { passive: true });
        rechneUndZeichne();
        setTimeout(() => {
            const eine = koerper.querySelector('.tbl-z');
            if (eine) {
                const g = getComputedStyle(eine);
                schriftBasis = g.fontSize + ' ' + g.fontFamily;
            }
            if (handy && block.telefonZelle) {
                const ziel = R.lies(gewaehlt);
                if (ziel)
                    feld.scrollTop = Math.max(0, ziel.zeile * zh - Math.max(0, feld.clientHeight - zh) / 2);
            }
            koerperZeichnen();
        }, 0);
        return w;
    };
    return { zeichne, zeigeWert, istFehler, REGELARTEN, SYMBOLSAETZE };
})();
window.SpreadsheetView = SpreadsheetView;
