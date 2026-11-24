"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/marken.ts (npm run bauen:ts). */
const Marken = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'];
    const BREITEN = [1.2, 2.4, 5];
    const MM_JE_PT = 25.4 / 72;
    const alsMm = (pt) => (Math.round(pt * MM_JE_PT * 10) / 10).toFixed(1).replace('.', ',') + ' mm';
    const BREITEN_NAMEN = ['Fein', 'Mittel', 'Markant'];
    const MARKER_FARBE = '#e0a419';
    const TEXTMARKER_FARBE = '#ffcf33';
    const MARKER_SPITZEN = [
        { id: 'keil', name: 'Keil', titel: 'Keilspitze — wie ein echter Textmarker: gerade Enden, dünn im Senkrechten' },
        { id: 'rund', name: 'Rund', titel: 'Runde Spitze — der Marker, wie er bis E704 war' }
    ];
    const MARKER_SPITZE_VORGABE = 'keil';
    const M_MARKER_SPITZE = 'zeichnen:markerspitze';
    const markerSpitzeLesen = () => {
        const wert = typeof Store !== 'undefined' ? String(Store.getMeta(M_MARKER_SPITZE) || '') : '';
        return MARKER_SPITZEN.some(sp => sp.id === wert) ? wert : MARKER_SPITZE_VORGABE;
    };
    const KEIL_DICKE = 0.22;
    const KEIL_WINKEL = 78;
    const HISTORY_LIMIT = 100;
    let zwischenablage = [];
    const RADIERER = [
        { id: 'ganz', name: 'Ganz', zeichen: '●', sym: 'eraseAll', titel: 'Radierer: ganze Marken', nur: '' },
        { id: 'teil', name: 'Teil', zeichen: '½', sym: 'eraseHalf', titel: 'Radierer: nur den berührten Teil eines Strichs', nur: '' },
        { id: 'stift', name: 'Stift', zeichen: '✎', sym: 'penFountain', titel: 'Radierer: nur Stiftstriche — Marker, Band und Formen bleiben', nur: 'stift' },
        { id: 'marker', name: 'Marker', zeichen: '▰', sym: 'eraseMarker', titel: 'Radierer: nur Marker', nur: 'marker' },
        { id: 'band', name: 'Band', zeichen: '▭', titel: 'Radierer: nur Abdeckband', nur: 'abdeck' }
    ];
    const RADIER_NUR = (id) => RADIERER.find(r => r.id === id)?.nur || '';
    const RADIER_VORGABE = 'ganz';
    const FORMEN = [
        { id: 'line', name: 'Linie', zeichen: '╱', sym: 'formLine', titel: 'Gerade Linie' },
        { id: 'arrow', name: 'Pfeil', zeichen: '→', sym: 'formArrow', titel: 'Pfeil' },
        { id: 'rectangle', name: 'Rechteck', zeichen: '□', sym: 'formRect', titel: 'Rechteck' },
        { id: 'ellipse', name: 'Ellipse', zeichen: '○', sym: 'formEllipse', titel: 'Ellipse' },
        { id: 'triangle', name: 'Dreieck', zeichen: '△', sym: 'formTriangle', titel: 'Dreieck' },
        { id: 'roundrect', name: 'Rund', zeichen: '▢', sym: 'formRoundrect', titel: 'Rechteck mit runden Ecken' },
        { id: 'curve', name: 'Kurve', zeichen: '⌒', sym: 'formCurve', titel: 'Kurve — nach dem Ziehen biegt der Griff in der Mitte sie' }
    ];
    const FORM_VORGABE = 'line';
    const formArtLesen = () => {
        const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:form') || '') : '';
        return FORMEN.some(f => f.id === wert) ? wert : FORM_VORGABE;
    };
    const istForm = (was) => FORMEN.some(f => f.id === was);
    const radierModusLesen = () => {
        const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:radierer') || '') : '';
        return RADIERER.some(r => r.id === wert) ? wert : RADIER_VORGABE;
    };
    const RADIER_GROESSEN = [5, 14, 28];
    const M_RADIER_AUTO = 'zeichnen:radiererauto';
    const radierAutoLesen = () => typeof Store !== 'undefined' && String(Store.getMeta(M_RADIER_AUTO, '')) === 'ja';
    const radierGroesseLesen = () => {
        const wert = typeof Store !== 'undefined' ? Number(Store.getMeta('zeichnen:radierergroesse')) : NaN;
        return RADIER_GROESSEN.includes(wert) ? wert : RADIER_GROESSEN[0];
    };
    const STIFTE = [
        { id: 'fueller', name: 'Füller', zeichen: '🖋', sym: 'penFountain', spitze: 0.25, eile: 0.35 },
        { id: 'kugel', name: 'Kugelschreiber', zeichen: '🖊', sym: 'penBall' },
        { id: 'pinsel', name: 'Pinsel', zeichen: '🖌', sym: 'penBrush', spitze: 0.12, eile: 0.5 },
        { id: 'bleistift', name: 'Bleistift', zeichen: '✏', sym: 'penPencil' },
        { id: 'schutzleiter', name: 'Schutzleiter', zeichen: '⏚', sym: 'penEarth' },
        { id: 'leiter', name: 'Leiter', zeichen: '⌁', sym: 'penWire' }
    ];
    const PE_GRUEN = '#158a3a';
    const PE_GELB = '#f2d200';
    const PE_MUSTER = [3.5, 4, 0.1, 4];
    const N_MUSTER = [2.6, 3.2];
    const LEITER = [
        { id: 'pe', kurz: 'PE', name: 'Schutzleiter', farbe: PE_GRUEN, stil: 'schutzleiter' },
        { id: 'n', kurz: 'N', name: 'Neutralleiter', farbe: '#1f6fd0', stil: 'neutralleiter' },
        { id: 'l1', kurz: 'L1', name: 'Aussenleiter L1', farbe: '#7a4a21', stil: 'kugel' },
        { id: 'l2', kurz: 'L2', name: 'Aussenleiter L2', farbe: '#111111', stil: 'kugel' },
        { id: 'l3', kurz: 'L3', name: 'Aussenleiter L3', farbe: '#9a9a9a', stil: 'kugel' },
        { id: 's', kurz: 'S', name: 'Lampendraht', farbe: '#e2761b', stil: 'kugel' },
        { id: 'k1', kurz: '1', name: 'Korrespondierende 1', farbe: '#c2185b', stil: 'kugel' },
        { id: 'k2', kurz: '2', name: 'Korrespondierende 2', farbe: '#7c3aed', stil: 'kugel' },
        { id: 'k3', kurz: '3', name: 'Korrespondierende 3', farbe: '#0d9488', stil: 'kugel' },
        { id: 'k4', kurz: '4', name: 'Korrespondierende 4', farbe: '#4d7c0f', stil: 'kugel' }
    ];
    const M_LEITER = 'zeichnen:leiter';
    const leiterJetzt = () => (typeof Store !== 'undefined' ? String(Store.getMeta(M_LEITER, 'pe')) : 'pe');
    const leiterMerken = (id) => {
        if (typeof Store !== 'undefined')
            Store.setMeta(M_LEITER, id);
    };
    const leiterVon = (id) => LEITER.find(l => l.id === String(id || ''));
    const TINTEN = [
        ['#2346b5', 'Königsblau'], ['#1b2552', 'Nachtblau'], ['#b12f4f', 'Karmin'],
        ['#1d6024', 'Tannengrün'], ['#0c6d7f', 'Petrol'], ['#5f3295', 'Aubergine'],
        ['#662f05', 'Sepia'], ['#3c3c3c', 'Graphit']
    ];
    const LEUCHTFARBEN = [
        ['#ffcf33', 'Sonnengelb'], ['#3ee06a', 'Leuchtgrün'], ['#2ec5ff', 'Leuchtblau'],
        ['#ff5cb8', 'Pink'], ['#ff9a2e', 'Orange'], ['#a879ff', 'Lila']
    ];
    const MARKER_PASTELLE = [
        ['#ffcf33', 'Sonnengelb'], ['#79cf8b', 'Mintgrün'], ['#65c9ed', 'Himmelblau'],
        ['#ed91be', 'Rosé'], ['#b39aef', 'Lavendel'], ['#f3aa66', 'Apricot']
    ];
    const PAPIERWEISS = '#f5f5f0';
    const FARBNAMEN = {
        '#111111': 'Schwarz', '#d64545': 'Rot', '#2f7ed8': 'Blau',
        '#3aa757': 'Grün', '#e0a419': 'Gelb',
        ...Object.fromEntries([...TINTEN, ...LEUCHTFARBEN, ...MARKER_PASTELLE]),
        [PAPIERWEISS]: 'Weiss'
    };
    const WERKZEUGE = Register.werkzeuge.auswahl([
        'schreiben', 'select', 'stift', 'marker', 'formen', 'abdeck', 'zettel',
        'text', 'textfix', 'zeichen', 'elemente', 'bild', 'radierer', 'laser'
    ]);
    const LASER = [
        { id: 'punkt', zeichen: '•', name: 'Punkt', titel: 'Ein Punkt, der dem Zeiger folgt' },
        { id: 'linie', zeichen: '⌇', name: 'Linie', titel: 'Eine Spur, die hinter dem Zeiger herläuft und verblasst' }
    ];
    const LAGEN = [
        { id: 'oben', zeichen: '⤒', sym: 'dockTop', name: 'oben', nurZiehen: false },
        { id: 'links', zeichen: '⇤', sym: 'dockLeft', name: 'links', nurZiehen: false },
        { id: 'rechts', zeichen: '⇥', sym: 'dockRight', name: 'rechts', nurZiehen: false },
        { id: 'unten', zeichen: '⤓', sym: 'dockBottom', name: 'unten in der Mitte', nurZiehen: false },
        { id: 'frei', zeichen: '✥', sym: 'dockFree', name: 'frei stehend', nurZiehen: true }
    ];
    const naechsteLage = (von) => {
        for (let s = 1; s <= LAGEN.length; s++) {
            const l = LAGEN[(von + s + LAGEN.length) % LAGEN.length];
            if (!l.nurZiehen)
                return l;
        }
        return LAGEN[0];
    };
    const GRUPPEN = [
        { id: 'stil', name: 'Stifte' },
        { id: 'form', name: 'Formenwahl: Linie, Pfeil, Rechteck …' },
        { id: 'laser', name: 'Laser: Punkt oder Spur' },
        { id: 'radierer', name: 'Radierer: Ganz, Teil, Stift …' },
        { id: 'schrift', name: 'Schrift' },
        { id: 'auswahl', name: 'Auswahl: Kopieren, Löschen, Sperren …' },
        { id: 'elemente', name: 'Elemente' },
        { id: 'farbe', name: 'Farben' },
        { id: 'breite', name: 'Strichbreite' },
        { id: 'formen', name: 'Schalter: Formen erkennen, Kritzeln löscht' },
        { id: 'lineal', name: 'Lineal' },
        { id: 'verlauf', name: 'Zurück, Vor, Platz, Einrichten' }
    ];
    const M_ORDNUNG = 'zeichnen:ordnung';
    const ordnungAbgleichen = (gemerkt, katalog) => {
        const liste = Array.isArray(gemerkt) ? gemerkt.map(String) : [];
        const rein = liste.filter((id, i) => katalog.includes(id) && liste.indexOf(id) === i);
        for (const id of katalog)
            if (!rein.includes(id))
                rein.push(id);
        return rein;
    };
    const ordnungLesen = () => {
        const roh = typeof Store !== 'undefined' ? Store.getMeta(M_ORDNUNG) : null;
        const o = roh && typeof roh === 'object' ? roh : {};
        return {
            werkzeuge: ordnungAbgleichen(o['werkzeuge'], WERKZEUGE.map(w => w.id)),
            gruppen: ordnungAbgleichen(o['gruppen'], GRUPPEN.map(g => g.id))
        };
    };
    const ordnungMerken = (o) => {
        if (typeof Store === 'undefined')
            return;
        try {
            Store.setMeta(M_ORDNUNG, { werkzeuge: o.werkzeuge, gruppen: o.gruppen });
        }
        catch { }
    };
    const ordnungVergessen = () => {
        if (typeof Store === 'undefined')
            return;
        try {
            Store.setMeta(M_ORDNUNG, null);
        }
        catch { }
    };
    const flaeche = (tools) => tools.querySelector(':scope > .blatt-tafel') ?? tools;
    const ordnungAnwenden = (tools) => {
        const o = ordnungLesen();
        const f = flaeche(tools);
        const bruch = tools.querySelector(':scope > .blatt-zeilenbruch');
        if (!bruch)
            return;
        for (const id of o.werkzeuge) {
            const knopf = tools.querySelector(`:scope > [data-wz="${id}"]`);
            if (knopf)
                tools.insertBefore(knopf, bruch);
        }
        for (const id of o.gruppen) {
            f.querySelectorAll(`:scope > [data-gruppe="${id}"]`)
                .forEach(knoten => f.appendChild(knoten));
        }
        ordnungZahlen(tools, o);
        platzSetzen(tools);
    };
    const ordnungZahlen = (tools, o) => {
        const f = flaeche(tools);
        o.werkzeuge.forEach((id, i) => {
            tools.querySelector(`:scope > [data-wz="${id}"]`)
                ?.style.setProperty('--ordnung', String((i + 1) * 100));
        });
        o.gruppen.forEach((id, i) => {
            f.querySelectorAll(`:scope > [data-gruppe="${id}"]`)
                .forEach(k => k.style.setProperty('--g-ordnung', String(i + 1)));
        });
    };
    const platzSetzen = (tools) => {
        const o = ordnungLesen();
        const jetzt = String(tools.dataset.tool || '');
        const id = o.werkzeuge.includes(jetzt) ? jetzt : (istForm(jetzt) ? 'formen' : '');
        const i = o.werkzeuge.indexOf(id);
        tools.style.setProperty('--platz', String(i >= 0 ? (i + 1) * 100 : 0));
    };
    const M_LAGE = 'zeichnen:leistenlage';
    const spaltePlatz = (r) => {
        if (r.dataset['lage'] !== 'links' && r.dataset['lage'] !== 'rechts') {
            r.style.removeProperty('--reihe-platz');
            return;
        }
        const h = r.parentElement;
        if (!h)
            return;
        const oben = Math.max(0, h.getBoundingClientRect().top);
        r.style.setProperty('--reihe-platz', Math.max(220, Math.round(window.innerHeight - oben - 12)) + 'px');
    };
    const sichtFeld = () => {
        const b = document.querySelector('#scroll')?.getBoundingClientRect();
        if (b && b.width > 0 && b.height > 0)
            return { links: b.left, oben: b.top, rechts: b.right, unten: b.bottom };
        return { links: 0, oben: 0, rechts: window.innerWidth, unten: window.innerHeight };
    };
    const fensterMitte = (mx, my, breit, hoch) => {
        const f = sichtFeld();
        const klemm = (wert, halb, von, bis) => 2 * halb >= bis - von ? (von + bis) / 2 : Math.min(bis - halb, Math.max(von + halb, wert));
        return { x: klemm(mx, breit / 2, f.links, f.rechts), y: klemm(my, hoch / 2, f.oben, f.unten) };
    };
    const merkeFrei = (r) => {
        if (typeof Store === 'undefined')
            return;
        try {
            Store.setMeta(M_FREI, r.style.getPropertyValue('--leiste-x').trim()
                + ' ' + r.style.getPropertyValue('--leiste-y').trim());
        }
        catch { }
    };
    const freiImFenster = (r) => {
        if (r.dataset['lage'] !== 'frei')
            return;
        const h = r.parentElement;
        if (!h)
            return;
        const k = h.getBoundingClientRect();
        const box = r.getBoundingClientRect();
        if (!k.width || !k.height || !box.width || !box.height)
            return;
        const mitte = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        const ziel = fensterMitte(mitte.x, mitte.y, box.width, box.height);
        if (Math.abs(ziel.x - mitte.x) < 0.5 && Math.abs(ziel.y - mitte.y) < 0.5)
            return;
        r.style.setProperty('--leiste-x', ((ziel.x - k.left) / k.width * 100).toFixed(2) + '%');
        r.style.setProperty('--leiste-y', ((ziel.y - k.top) / k.height * 100).toFixed(2) + '%');
        merkeFrei(r);
    };
    let spalteBild = 0;
    const spaltenNachFenster = () => {
        if (spalteBild)
            return;
        spalteBild = requestAnimationFrame(() => {
            spalteBild = 0;
            document.querySelectorAll('.blatt-reihe').forEach(r => {
                spaltePlatz(r);
                freiImFenster(r);
            });
        });
    };
    const M_FREI = 'zeichnen:leistenfrei';
    const lageJetzt = () => {
        const id = typeof Store !== 'undefined' ? String(Store.getMeta(M_LAGE, 'oben')) : 'oben';
        return LAGEN.some(l => l.id === id) ? id : 'oben';
    };
    const freiJetzt = () => {
        const roh = typeof Store !== 'undefined' ? String(Store.getMeta(M_FREI, '')) : '';
        const teile = roh.trim().split(/\s+/);
        const gut = (w) => !!w && /^-?\d+(\.\d+)?%$/.test(w);
        return gut(teile[0]) && gut(teile[1])
            ? { x: teile[0], y: teile[1] }
            : { x: '50%', y: '50%' };
    };
    const M_LASER = 'zeichnen:laser';
    const laserArt = () => (typeof Store !== 'undefined' ? String(Store.getMeta(M_LASER, 'punkt')) : 'punkt');
    const LASER_MS = 700;
    const artWort = (art) => {
        const id = String(art ?? '');
        return FORMEN.find(f => f.id === id)?.name
            ?? WERKZEUGE.find(w => w.id === id)?.name
            ?? (id || 'Marke');
    };
    const artZeichen = (art) => {
        const id = String(art ?? '');
        return FORMEN.find(f => f.id === id)?.zeichen
            ?? WERKZEUGE.find(w => w.id === id)?.zeichen
            ?? '•';
    };
    const STIL_VORGABE = 'fueller';
    const HOECHSTENS_EIGENE_FARBEN = 4;
    const HOECHSTENS_FARBSAETZE = 8;
    const HOECHSTENS_ELEMENTE = 60;
    const HOECHSTENS_ELEMENT_BYTES = 200 * 1024;
    const SCHRIFTEN = InkGeometry.SCHRIFTEN;
    const SCHRIFT_STUFEN = [11, 13, 16, 20, 26, 34];
    const SCHRIFT_VORGABE = { familie: 'standard', groesse: 16, fett: false,
        rahmen: false, ausricht: 'links' };
    const AUSRICHTUNGEN = [
        { id: 'links', zeichen: '⭰', sym: 'alignLeft', name: 'Links' },
        { id: 'mitte', zeichen: '⭤', sym: 'alignCenter', name: 'Mitte' },
        { id: 'rechts', zeichen: '⭲', sym: 'alignRight', name: 'Rechts' }
    ];
    const schriftStapel = (id) => InkGeometry.schriftStapel(id);
    const schriftLesen = () => {
        const roh = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:schrift') : null;
        const s = roh && typeof roh === 'object' ? roh : {};
        return {
            familie: SCHRIFTEN.some(x => x.id === s.familie) ? String(s.familie) : SCHRIFT_VORGABE.familie,
            groesse: SCHRIFT_STUFEN.includes(Number(s.groesse)) ? Number(s.groesse) : SCHRIFT_VORGABE.groesse,
            fett: !!s.fett, rahmen: !!s.rahmen,
            ausricht: AUSRICHTUNGEN.some(x => x.id === s.ausricht) ? String(s.ausricht) : 'links'
        };
    };
    const naechsteStufe = (jetzt, richtung) => {
        if (richtung > 0)
            return SCHRIFT_STUFEN.find(v => v > jetzt) ?? SCHRIFT_STUFEN[SCHRIFT_STUFEN.length - 1];
        return [...SCHRIFT_STUFEN].reverse().find(v => v < jetzt) ?? SCHRIFT_STUFEN[0];
    };
    const druckFaktor = (stil, p, neig = 0) => {
        const d = Math.max(0.05, Math.min(1, Number.isFinite(p) ? p : 0.5));
        const n = Math.max(0, Math.min(1, Number.isFinite(neig) ? neig : 0));
        if (stil === 'pinsel')
            return 0.3 + d * 1.7;
        if (stil === 'bleistift')
            return (0.35 + d * 0.6) * (1 + n * 1.3);
        if (stil === 'schutzleiter')
            return 1;
        return 0.5 + d * 1.0;
    };
    const deckungVon = (art, stil, neigung) => {
        if (art === 'marker')
            return stil === 'keil' ? 0.4 : 0.32;
        if (stil === 'pinsel')
            return 0.92;
        if (stil === 'bleistift') {
            const n = Array.isArray(neigung)
                ? (neigung.length ? neigung.reduce((a, b) => a + (Number(b) || 0), 0) / neigung.length : 0)
                : (Number(neigung) || 0);
            return Math.round((0.72 - n * 0.22) * 100) / 100;
        }
        return 1;
    };
    const FLAECHEN_STIFTE = new Set(['fueller', 'pinsel', 'bleistift']);
    const spitzeVon = (stil) => {
        const s = STIFTE.find(x => x.id === stil);
        const v = Number(s?.spitze);
        return Number.isFinite(v) && v > 0 && v < 1 ? v : 1;
    };
    const spitzeLaenge = (base) => Math.max(3, Math.min(12, base * 2.2));
    const eileVon = (stil) => {
        const s = STIFTE.find(x => x.id === stil);
        const v = Number(s?.eile);
        return Number.isFinite(v) && v > 0 && v < 1 ? v : 0;
    };
    const halbeBreiten = (mark, points) => {
        const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
        const stil = String(mark?.stil || '');
        const druck = Array.isArray(mark?.pressure) ? mark.pressure.map(Number) : [];
        const neig = Array.isArray(mark?.neigung) ? mark.neigung.map(Number) : [];
        const tempo = Array.isArray(mark?.tempo) ? mark.tempo.map(Number) : [];
        const eile = tempo.length ? eileVon(stil) : 0;
        const halb = points.map((_p, i) => base / 2 * druckFaktor(stil, druck[i] ?? druck[druck.length - 1] ?? 0.5, neig[i] ?? neig[neig.length - 1] ?? 0)
            * (eile ? InkStroke.tempoFaktor(tempo[i] ?? tempo[tempo.length - 1] ?? 0, eile) : 1));
        return InkGeometry.verjuengen(points, halb, spitzeVon(stil), spitzeLaenge(base));
    };
    const svg = (name, attributes = {}) => {
        const element = document.createElementNS(NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
        return element;
    };
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const idOf = (mark) => String(mark?.id || '');
    const strokeWidth = (mark) => {
        const fest = Number(mark?.breiteFest);
        if (Number.isFinite(fest) && fest > 0)
            return fest;
        const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
        const values = Array.isArray(mark?.pressure)
            ? mark.pressure.map(Number).filter((value) => Number.isFinite(value)) : [];
        const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.5;
        const pressureFactor = Math.max(0.55, Math.min(1.55, 0.65 + average * 0.7));
        return base * pressureFactor * (mark?.art === 'marker' ? 4 : 1);
    };
    const keilVielecke = (mark, punkte) => {
        const h = strokeWidth(mark);
        return InkGeometry.keil(punkte, h, h * KEIL_DICKE, KEIL_WINKEL);
    };
    const GRAPHIT_KACHEL = 3.2;
    const graphitStufe = (mark) => {
        const d = Array.isArray(mark?.pressure) ? mark.pressure.map(Number).filter(Number.isFinite) : [];
        const mittel = d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0.5;
        return mittel < 0.35 ? 1 : mittel < 0.65 ? 2 : 3;
    };
    const graphitFuellung = (farbe, stufe) => {
        const hex = /^#[0-9a-f]{6}$/i.test(farbe) ? farbe.toLowerCase() : '#111111';
        const id = 'redion-graphit-' + hex.slice(1) + '-' + stufe;
        if (typeof document === 'undefined' || !document.body)
            return hex;
        if (!document.getElementById(id)) {
            let halter = document.getElementById('redion-graphit');
            if (!halter) {
                halter = svg('svg', { id: 'redion-graphit', width: 0, height: 0, 'aria-hidden': 'true',
                    focusable: 'false' });
                halter.style.position = 'absolute';
                halter.appendChild(svg('defs'));
                document.body.appendChild(halter);
            }
            const k = GRAPHIT_KACHEL;
            const muster = svg('pattern', { id, width: k, height: k, patternUnits: 'userSpaceOnUse' });
            let saat = 7 + stufe * 101;
            const zufall = () => { saat = (saat * 16807) % 2147483647; return saat / 2147483647; };
            const r2 = (v) => Math.round(v * 100) / 100;
            muster.appendChild(svg('rect', { width: k, height: k, fill: hex, opacity: [0, 0.42, 0.55, 0.68][stufe] }));
            const koerner = [0, 20, 26, 32][stufe] ?? 26;
            for (let i = 0; i < koerner; i++) {
                muster.appendChild(svg('rect', { x: r2(zufall() * k), y: r2(zufall() * k),
                    width: r2(0.25 + zufall() * 0.45), height: r2(0.2 + zufall() * 0.35),
                    fill: hex, opacity: r2(0.35 + zufall() * 0.65) }));
            }
            for (let i = 0; i < 8; i++) {
                muster.appendChild(svg('rect', { x: r2(zufall() * k), y: r2(zufall() * k),
                    width: r2(0.3 + zufall() * 0.3), height: 0.25, fill: '#fff', opacity: r2(0.25 + zufall() * 0.35) }));
            }
            halter.querySelector('defs')?.appendChild(muster);
        }
        return `url(#${id}) ${hex}`;
    };
    const markerSpitzeMerken = (id) => {
        if (typeof Store === 'undefined' || !MARKER_SPITZEN.some(sp => sp.id === id))
            return;
        try {
            Store.setMeta(M_MARKER_SPITZE, id);
        }
        catch { }
    };
    const alsRgb = (farbe) => {
        const t = String(farbe || '').trim().toLowerCase();
        const kurz = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(t);
        const lang = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(t);
        if (lang)
            return [parseInt(lang[1], 16), parseInt(lang[2], 16), parseInt(lang[3], 16)];
        if (kurz)
            return [parseInt(kurz[1] + kurz[1], 16), parseInt(kurz[2] + kurz[2], 16), parseInt(kurz[3] + kurz[3], 16)];
        const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t);
        if (rgb)
            return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
        return [255, 255, 255];
    };
    const relativeHelligkeit = (farbe) => {
        const [r, g, b] = alsRgb(farbe).map(v => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const kontrastZu = (a, b) => {
        const x = relativeHelligkeit(a), y = relativeHelligkeit(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    const papierfarbeVon = (el) => {
        if (!el || typeof getComputedStyle !== 'function')
            return '#ffffff';
        const roh = getComputedStyle(el).getPropertyValue('--paper').trim();
        if (!roh)
            return '#ffffff';
        if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(roh))
            return roh.toLowerCase();
        const probe = document.createElement('span');
        probe.style.color = roh;
        document.body.appendChild(probe);
        const wert = getComputedStyle(probe).color;
        probe.remove();
        return wert || '#ffffff';
    };
    const strichprobeMarke = (art, stil, farbe, breite) => {
        const n = 24;
        const pts = [];
        const pressure = [];
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const x = art === 'marker' ? 5 + t * 120 : 6 + t * 188;
            const y = art === 'marker' ? 7 - Math.sin(t * Math.PI) * 0.8 : 13 + Math.sin(t * Math.PI * 2.1) * 5 * (1 - 0.35 * t);
            pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
            pressure.push(Math.round((t < 0.5 ? 0.3 + t * 1 : 0.8 - (t - 0.5) * 0.9) * 100) / 100);
        }
        const mark = { id: 'strichprobe', art, farbe, breite: Math.max(0.5, Math.min(art === 'marker' ? 3.2 : 4, breite)), pts, pressure };
        if (stil)
            mark.stil = stil;
        return mark;
    };
    const strichprobeBild = (mark) => {
        const bild = svg('svg', { viewBox: mark?.art === 'marker' ? '0 0 130 14' : '0 0 200 26', preserveAspectRatio: 'xMidYMid meet',
            'aria-hidden': 'true', focusable: 'false' });
        const node = zeichneMarke(mark);
        if (node) {
            node.removeAttribute('opacity');
            node.style.removeProperty('mix-blend-mode');
            node.removeAttribute('data-sid');
            bild.appendChild(node);
        }
        return bild;
    };
    const annotierbar = (mark) => !!mark && (mark.art === 'stift' || mark.art === 'marker')
        && InkGeometry.points(mark.pts).length >= 2;
    const farbeRgb = (wert) => {
        const t = String(wert || '').trim();
        const kurz = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(t);
        const lang = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(t);
        const teile = lang ? [lang[1], lang[2], lang[3]]
            : kurz ? [kurz[1] + kurz[1], kurz[2] + kurz[2], kurz[3] + kurz[3]] : null;
        if (!teile)
            return [0, 0, 0];
        return teile.map(h => Math.round(parseInt(h, 16) / 255 * 1000) / 1000);
    };
    const alsAnnotation = (mark) => {
        if (!annotierbar(mark))
            return null;
        const punkte = InkGeometry.points(mark.pts);
        const base = Math.max(0.5, Number(mark.breite) || BREITEN[1]);
        const flaeche = mark.art === 'stift' && FLAECHEN_STIFTE.has(String(mark.stil));
        const neig = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
        const teile = flaeche && punkte.length >= 3
            ? InkGeometry.outlineTeile(punkte, halbeBreiten(mark, punkte))
            : [];
        const keil = mark.art === 'marker' && mark.stil === 'keil'
            ? keilVielecke(mark, punkte) : [];
        const kontur = keil.length ? keil : teile;
        return {
            striche: [punkte.map(q => [q[0], q[1]])],
            kontur: [kontur.length === 1 ? kontur[0].map(q => [q[0], q[1]])
                    : kontur.length > 1 ? kontur.map(t => t.map(q => [q[0], q[1]])) : null],
            farbe: farbeRgb(mark.farbe),
            breite: Number(mark.breiteFest) > 0 ? Number(mark.breiteFest)
                : mark.art === 'marker' ? base * 4 : base,
            deckkraft: deckungVon(String(mark.art), String(mark.stil), neig),
            name: mark.art === 'marker' ? 'Marker' : 'Handschrift'
        };
    };
    const arrowPath = (start, end) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const angle = Math.atan2(dy, dx);
        const head = Math.max(10, Math.min(24, Math.hypot(dx, dy) * 0.22));
        const left = [end[0] - head * Math.cos(angle - Math.PI / 6),
            end[1] - head * Math.sin(angle - Math.PI / 6)];
        const right = [end[0] - head * Math.cos(angle + Math.PI / 6),
            end[1] - head * Math.sin(angle + Math.PI / 6)];
        return `M${start[0]} ${start[1]} L${end[0]} ${end[1]} ` +
            `M${left[0]} ${left[1]} L${end[0]} ${end[1]} L${right[0]} ${right[1]}`;
    };
    const BILD_FEHLT = 'Bild fehlt';
    const bildPlatzhalter = (box, wort = '') => {
        const rahmen = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height,
            rx: 2, class: 'blatt-bild-fehlt' });
        if (!wort)
            return [rahmen];
        const groesse = Math.max(7, Math.min(14, box.height / 6, box.width / 8));
        const text = svg('text', { x: box.x + box.width / 2, y: box.y + box.height / 2,
            'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': groesse,
            'font-family': 'system-ui, sans-serif', class: 'blatt-bild-fehlt-wort' });
        text.textContent = wort;
        return [rahmen, text];
    };
    const bildNachladen = (dateiId, gruppe) => {
        if (typeof Dateien === 'undefined' || typeof Dateien.adresse !== 'function')
            return;
        Promise.resolve(Dateien.adresse(dateiId)).then((url) => {
            const rahmen = gruppe.querySelector('.blatt-bild-fehlt');
            if (!rahmen)
                return;
            const box = { x: Number(rahmen.getAttribute('x')), y: Number(rahmen.getAttribute('y')),
                width: Number(rahmen.getAttribute('width')), height: Number(rahmen.getAttribute('height')) };
            gruppe.querySelectorAll('.blatt-bild-fehlt, .blatt-bild-fehlt-wort').forEach(node => node.remove());
            if (url) {
                gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
                    href: url, preserveAspectRatio: 'none' }));
            }
            else {
                bildPlatzhalter(box, BILD_FEHLT).forEach(node => gruppe.appendChild(node));
            }
        }).catch(() => { });
    };
    const rund2 = (wert) => Math.round(wert * 100) / 100;
    const verlaufId = (mark) => 'rv-' + String(idOf(mark) || '').replace(/[^A-Za-z0-9_-]/g, '_');
    const verlaufVon = (mark) => {
        const v = mark?.verlauf;
        if (!v || !Array.isArray(v.stopps) || v.stopps.length < 2)
            return null;
        const stopps = v.stopps
            .filter((s) => s && typeof s.farbe === 'string' && Number.isFinite(Number(s.pos)))
            .map((s) => ({ pos: Math.min(1, Math.max(0, Number(s.pos))), farbe: String(s.farbe) }));
        return stopps.length >= 2 ? { stopps, winkel: Number(v.winkel) || 0 } : null;
    };
    const verlaufDefs = (liste) => {
        const mit = (Array.isArray(liste) ? liste : [])
            .filter(m => m && m.art === 'abdeck' && verlaufVon(m));
        if (!mit.length)
            return null;
        const defs = svg('defs', { 'data-ink-defs': '1' });
        for (const mark of mit) {
            const v = verlaufVon(mark);
            const bogen = ((Number(v.winkel) || 0) / 60000) * Math.PI / 180;
            const dx = Math.cos(bogen) / 2, dy = Math.sin(bogen) / 2;
            const g = svg('linearGradient', {
                id: verlaufId(mark), gradientUnits: 'objectBoundingBox',
                x1: (0.5 - dx).toFixed(4), y1: (0.5 - dy).toFixed(4),
                x2: (0.5 + dx).toFixed(4), y2: (0.5 + dy).toFixed(4)
            });
            for (const stopp of v.stopps)
                g.appendChild(svg('stop', { offset: stopp.pos.toFixed(4), 'stop-color': stopp.farbe }));
            defs.appendChild(g);
        }
        return defs;
    };
    const zeichneMarke = (mark) => {
        const node = zeichneMarkeRoh(mark);
        const grad = Number(mark?.dreh);
        if (node && Number.isFinite(grad) && grad !== 0 && !InkGeometry.LINIEN.has(String(mark?.art || ''))) {
            const b = InkGeometry.bounds(mark);
            node.setAttribute('transform', `rotate(${grad} ${Math.round((b.x + b.width / 2) * 100) / 100} ${Math.round((b.y + b.height / 2) * 100) / 100})`);
        }
        if (node && mark && (mark.href || mark.zielSeite)) {
            node.setAttribute('data-verweis', mark.href ? 'aussen' : 'seite');
            node.setAttribute('pointer-events', 'all');
            const hinweis = svg('title');
            hinweis.textContent = mark.href ? String(mark.href)
                : 'Zur Seite „' + String(Store.getBlock(String(mark.zielSeite))?.text || 'Ohne Titel') + '"';
            node.appendChild(hinweis);
            const art = String(mark.art || '');
            if (InkGeometry.LINIEN.has(art) && node.tagName.toLowerCase() === 'path') {
                const gruppe = svg('g');
                const feld = node.cloneNode(false);
                feld.removeAttribute('data-sid');
                feld.removeAttribute('data-ink-art');
                feld.removeAttribute('data-verweis');
                feld.setAttribute('fill', 'none');
                feld.setAttribute('stroke', 'transparent');
                feld.setAttribute('stroke-width', String(Math.max(24, strokeWidth(mark))));
                feld.setAttribute('stroke-linecap', 'round');
                feld.setAttribute('stroke-linejoin', 'round');
                feld.setAttribute('opacity', '1');
                feld.removeAttribute('style');
                feld.setAttribute('class', 'blatt-verweisfeld');
                gruppe.setAttribute('data-sid', String(node.getAttribute('data-sid') || ''));
                gruppe.setAttribute('data-ink-art', art);
                gruppe.setAttribute('data-verweis', String(node.getAttribute('data-verweis') || ''));
                gruppe.setAttribute('pointer-events', 'all');
                node.removeAttribute('data-sid');
                gruppe.append(feld, node);
                return gruppe;
            }
        }
        return node;
    };
    const zeichneMarkeRoh = (mark) => {
        if (!mark || typeof mark !== 'object')
            return null;
        const art = String(mark.art || 'stift');
        const color = String(mark.farbe || FARBEN[0]);
        const width = strokeWidth(mark);
        const points = InkGeometry.points(mark.pts);
        let element = null;
        if (art === 'zeichen') {
            const point = InkGeometry.points([mark.point])[0];
            const fz = (typeof Register !== 'undefined' && Register.fachzeichen)
                ? Register.fachzeichen : null;
            if (!point || !fz)
                return null;
            const roh = fz.alsSvg(String(mark.zeichenId || ''), {
                farbe: color, drehung: Number(mark.drehung) || 0,
                gespiegelt: !!mark.gespiegelt
            });
            if (!roh)
                return null;
            const mass = fz.masse(String(mark.zeichenId || ''), Number(mark.drehung) || 0);
            const wunsch = Math.max(12, Number(mark.groesse) || 64);
            const faktor = wunsch / Math.max(mass.w || 1, mass.h || 1);
            const gruppe = svg('g', {
                transform: `translate(${point[0] - (mass.w * faktor) / 2} ` +
                    `${point[1] - (mass.h * faktor) / 2}) scale(${faktor.toFixed(4)})`,
                fill: 'none', stroke: color,
                'stroke-width': (2 / faktor).toFixed(3),
                'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            });
            gruppe.innerHTML = roh.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
            const griff = svg('rect', { x: 0, y: 0, width: mass.w, height: mass.h,
                fill: 'transparent', stroke: 'none' });
            gruppe.insertBefore(griff, gruppe.firstChild);
            gruppe.setAttribute('data-sid', idOf(mark));
            gruppe.setAttribute('data-ink-art', art);
            return gruppe;
        }
        if (art === 'text') {
            const layout = InkGeometry.textLayout(mark);
            if (layout) {
                const gruppe = svg('g', { 'pointer-events': 'all' });
                gruppe.appendChild(mark.rahmen
                    ? svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height, rx: 3,
                        fill: 'none', stroke: color, 'stroke-width': Math.max(0.6, layout.fontSize / 16).toFixed(2),
                        class: 'blatt-textrahmen' })
                    : svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height,
                        fill: 'transparent', stroke: 'none' }));
                const anker = layout.ausricht === 'mitte' ? 'middle'
                    : layout.ausricht === 'rechts' ? 'end' : 'start';
                const zeilenX = layout.ausricht === 'mitte' ? layout.x + layout.width / 2
                    : layout.ausricht === 'rechts' ? layout.x + layout.width - layout.pad
                        : layout.x + layout.pad;
                const textKnoten = svg('text', {
                    x: zeilenX, y: layout.y + layout.pad + layout.fontSize * 0.85, fill: color,
                    'font-size': layout.fontSize, 'font-family': schriftStapel(layout.family),
                    'font-weight': layout.bold ? 700 : 400,
                    ...(anker === 'start' ? {} : { 'text-anchor': anker })
                });
                if (layout.zeilen) {
                    textKnoten.setAttribute('xml:space', 'preserve');
                    let oben = layout.y + layout.pad;
                    for (const zeile of layout.zeilen) {
                        zeile.stuecke.forEach((st, i) => {
                            const teil = svg('tspan', {
                                ...(i === 0 ? { x: zeilenX, y: oben + zeile.basis } : {}),
                                'font-size': st.fontSize, 'font-weight': st.bold ? 700 : 400,
                                ...(st.farbe ? { fill: st.farbe } : {})
                            });
                            teil.textContent = st.text || ' ';
                            textKnoten.appendChild(teil);
                        });
                        oben += zeile.hoehe;
                    }
                }
                else
                    layout.lines.forEach((zeile, index) => {
                        const stueck = svg('tspan', { x: zeilenX, dy: index === 0 ? 0 : layout.zeile });
                        stueck.textContent = zeile || ' ';
                        textKnoten.appendChild(stueck);
                    });
                gruppe.appendChild(textKnoten);
                gruppe.setAttribute('data-sid', idOf(mark));
                gruppe.setAttribute('data-ink-art', art);
                gruppe.setAttribute('data-kasten', '1');
                return gruppe;
            }
            const point = InkGeometry.points([mark.point])[0];
            if (!point)
                return null;
            element = svg('text', {
                x: point[0], y: point[1], fill: color,
                'font-size': Math.max(8, Number(mark.fontSize) || 18),
                'font-family': schriftStapel(mark.schrift), 'font-weight': mark.fett ? 700 : 400,
                'dominant-baseline': 'alphabetic'
            });
            element.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
        }
        else if (art === 'textfix') {
            const box = InkGeometry.rectangle([Number(mark.kasten?.x) || 0, Number(mark.kasten?.y) || 0], [(Number(mark.kasten?.x) || 0) + (Number(mark.kasten?.w) || 0),
                (Number(mark.kasten?.y) || 0) + (Number(mark.kasten?.h) || 0)]);
            const gruppe = svg('g', {});
            const luft = Math.max(0.6, box.height * 0.12);
            gruppe.appendChild(svg('rect', {
                x: box.x - luft, y: box.y - luft,
                width: box.width + luft * 2, height: box.height + luft * 2,
                fill: String(mark.grund || '#ffffff'), stroke: 'none'
            }));
            const hoehe = Math.max(4, box.height);
            const wort = svg('text', {
                x: box.x, y: box.y + hoehe, fill: color,
                'font-size': hoehe,
                'font-family': schriftStapel(mark.schrift), 'font-weight': mark.fett ? 700 : 400,
                'dominant-baseline': 'alphabetic'
            });
            wort.setAttribute('xml:space', 'preserve');
            wort.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
            gruppe.appendChild(wort);
            gruppe.setAttribute('data-sid', idOf(mark));
            gruppe.setAttribute('data-ink-art', art);
            gruppe.setAttribute('data-kasten', '1');
            return gruppe;
        }
        else if (art === 'line' && points.length >= 2) {
            element = svg('line', { x1: points[0][0], y1: points[0][1],
                x2: points[1][0], y2: points[1][1] });
        }
        else if (art === 'arrow' && points.length >= 2) {
            element = svg('path', { d: arrowPath(points[0], points[1]) });
        }
        else if (art === 'rectangle' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height });
        }
        else if (art === 'abdeck' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('rect', { x: box.x, y: box.y, width: box.width,
                height: box.height, rx: 4,
                fill: verlaufVon(mark) ? `url(#${verlaufId(mark)}) ${color}` : color,
                'pointer-events': 'all' });
            element.setAttribute('data-sid', idOf(mark));
            element.setAttribute('data-ink-art', art);
            if (Number(mark.schritt) > 0)
                element.setAttribute('data-schritt', String(Number(mark.schritt)));
            return element;
        }
        else if (art === 'zettel' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            const gruppe = svg('g', { 'pointer-events': 'all' });
            const wert = /^#([0-9a-f]{6})$/i.exec(color)?.[1] || 'e0a419';
            const hell = (parseInt(wert.slice(0, 2), 16) * 299 +
                parseInt(wert.slice(2, 4), 16) * 587 +
                parseInt(wert.slice(4, 6), 16) * 114) / 255000;
            const tinte = hell < 0.55 ? '#f5f5f2' : '#1c1c1c';
            gruppe.appendChild(svg('rect', { x: box.x, y: box.y, width: box.width,
                height: box.height, rx: 3, fill: color, 'fill-opacity': 0.92,
                stroke: 'rgba(0,0,0,.2)', 'stroke-width': 0.6 }));
            const groesse = Math.max(9, Number(mark.fontSize) || 13);
            const pad = Math.max(4, groesse * 0.5);
            const textKnoten = svg('text', {
                x: box.x + pad, y: box.y + pad + groesse * 0.8, fill: tinte,
                'font-size': groesse, 'font-family': 'system-ui, sans-serif'
            });
            const proZeile = Math.max(4, Math.floor((box.width - pad * 2) / (groesse * 0.52)));
            const zeilen = [];
            for (const roh of String(mark.text || '').split(/\r?\n/)) {
                let rest = roh;
                if (!rest) {
                    zeilen.push('');
                    continue;
                }
                while (rest.length > proZeile) {
                    let schnitt = rest.lastIndexOf(' ', proZeile);
                    if (schnitt < proZeile * 0.5)
                        schnitt = proZeile;
                    zeilen.push(rest.slice(0, schnitt));
                    rest = rest.slice(schnitt).replace(/^ /, '');
                }
                zeilen.push(rest);
            }
            const maxZeilen = Math.max(1, Math.floor((box.height - pad) / (groesse * 1.25)));
            zeilen.slice(0, maxZeilen).forEach((zeile, index) => {
                const stueck = svg('tspan', { x: box.x + pad,
                    dy: index === 0 ? 0 : groesse * 1.25 });
                stueck.textContent = zeile || ' ';
                textKnoten.appendChild(stueck);
            });
            gruppe.appendChild(textKnoten);
            gruppe.setAttribute('data-sid', idOf(mark));
            gruppe.setAttribute('data-ink-art', art);
            return gruppe;
        }
        else if (art === 'bild' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            const gruppe = svg('g', { 'pointer-events': 'all' });
            const dateiId = String(mark.dateiId || '');
            const url = dateiId && typeof Dateien !== 'undefined' && typeof Dateien.adresseBekannt === 'function'
                ? Dateien.adresseBekannt(dateiId) : null;
            if (url) {
                gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
                    href: url, preserveAspectRatio: 'none' }));
            }
            else {
                bildPlatzhalter(box, dateiId ? '' : BILD_FEHLT).forEach(node => gruppe.appendChild(node));
                if (dateiId)
                    bildNachladen(dateiId, gruppe);
            }
            gruppe.setAttribute('data-sid', idOf(mark));
            gruppe.setAttribute('data-ink-art', art);
            return gruppe;
        }
        else if (art === 'ellipse' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('ellipse', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
                rx: box.width / 2, ry: box.height / 2 });
        }
        else if (art === 'triangle' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            element = svg('polygon', { points: `${box.x + box.width / 2},${box.y} ${box.x},${box.y + box.height} ${box.x + box.width},${box.y + box.height}` });
        }
        else if (art === 'curve' && points.length >= 2) {
            const a = points[0], z = points[1];
            const g = points[2] || [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2];
            element = svg('path', { d: `M${a[0]} ${a[1]} Q${g[0]} ${g[1]} ${z[0]} ${z[1]}`, fill: 'none' });
        }
        else if (art === 'roundrect' && points.length >= 2) {
            const box = InkGeometry.rectangle(points[0], points[1]);
            const rund = Math.max(2, Math.min(box.width, box.height) / 6);
            element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height, rx: rund, ry: rund });
        }
        else if (art === 'stift' && FLAECHEN_STIFTE.has(String(mark.stil)) && points.length >= 3) {
            const neig = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
            const halb = halbeBreiten(mark, points);
            element = svg('path', { d: InkGeometry.outline(points, halb), fill: color, stroke: color,
                'stroke-width': 0.25, 'stroke-linejoin': 'round' });
            if (mark.stil === 'pinsel')
                element.setAttribute('opacity', String(deckungVon(art, 'pinsel')));
            if (mark.stil === 'bleistift') {
                element.setAttribute('opacity', String(deckungVon(art, 'bleistift', neig)));
                const korn = graphitFuellung(color, graphitStufe(mark));
                element.setAttribute('fill', korn);
                element.setAttribute('stroke', korn);
                element.setAttribute('stroke-width', '0.25');
                element.setAttribute('data-ink-korn', String(graphitStufe(mark)));
            }
            element.setAttribute('data-sid', idOf(mark));
            element.setAttribute('data-ink-art', art);
            element.setAttribute('data-ink-stil', String(mark.stil));
            return element;
        }
        else if (art === 'marker' && mark.stil === 'keil' && points.length >= 1) {
            element = svg('path', { d: InkGeometry.vieleckPfad(keilVielecke(mark, points)),
                fill: color, 'fill-rule': 'nonzero', stroke: 'none',
                opacity: deckungVon('marker', 'keil'), style: 'mix-blend-mode:multiply' });
            element.setAttribute('data-sid', idOf(mark));
            element.setAttribute('data-ink-art', art);
            element.setAttribute('data-ink-stil', 'keil');
            return element;
        }
        else if (points.length >= 2) {
            element = svg('path', { d: InkGeometry.path(points) });
        }
        if (!element)
            return null;
        if (art !== 'text') {
            const fuellung = String(mark.fuellung || '');
            element.setAttribute('fill', /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(fuellung) ? fuellung : 'none');
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', String(width));
            element.setAttribute('stroke-linecap', 'round');
            element.setAttribute('stroke-linejoin', 'round');
            if (mark.randlos) {
                element.setAttribute('stroke', 'none');
                element.setAttribute('stroke-width', '0');
            }
            if (art === 'marker') {
                element.setAttribute('opacity', String(deckungVon('marker', '')));
                element.setAttribute('style', 'mix-blend-mode:multiply');
            }
            if (art === 'rectangle' || art === 'ellipse' || art === 'triangle' || art === 'roundrect')
                element.setAttribute('pointer-events', 'all');
        }
        if (String(mark.stil) === 'neutralleiter' && art !== 'text' && art !== 'zettel'
            && art !== 'abdeck' && art !== 'bild' && art !== 'zeichen') {
            element.setAttribute('stroke-dasharray', N_MUSTER.map(v => Math.max(0.2, v * width)).join(' '));
            element.setAttribute('data-sid', idOf(mark));
            element.setAttribute('data-ink-art', art);
            element.setAttribute('data-ink-stil', 'neutralleiter');
            return element;
        }
        if (String(mark.stil) === 'schutzleiter' && art !== 'text' && art !== 'zettel'
            && art !== 'abdeck' && art !== 'bild' && art !== 'zeichen') {
            const gruppe = svg('g');
            element.setAttribute('stroke', PE_GRUEN);
            const oben = element.cloneNode(false);
            oben.setAttribute('stroke', PE_GELB);
            oben.setAttribute('stroke-dasharray', PE_MUSTER.map(v => Math.max(0.2, v * width)).join(' '));
            oben.setAttribute('pointer-events', 'none');
            gruppe.append(element, oben);
            gruppe.setAttribute('data-sid', idOf(mark));
            gruppe.setAttribute('data-ink-art', art);
            gruppe.setAttribute('data-ink-stil', 'schutzleiter');
            return gruppe;
        }
        element.setAttribute('data-sid', idOf(mark));
        element.setAttribute('data-ink-art', art);
        return element;
    };
    const updateNode = (node, mark) => {
        const fresh = zeichneMarke(mark);
        if (!fresh)
            return null;
        if (node && node.getAttribute('data-ink-art') === 'bild' && fresh.getAttribute('data-ink-art') === 'bild' &&
            node.childElementCount === fresh.childElementCount &&
            [...node.children].every((kind, n) => kind.tagName === fresh.children[n]?.tagName)) {
            [...fresh.children].forEach((neu, n) => {
                const alt = node.children[n];
                if (!alt)
                    return;
                for (const name of ['x', 'y', 'width', 'height', 'font-size']) {
                    const wert = neu.getAttribute(name);
                    if (wert !== null)
                        alt.setAttribute(name, wert);
                }
            });
            node.setAttribute('data-sid', fresh.getAttribute('data-sid') || '');
            const drehung = fresh.getAttribute('transform');
            if (drehung)
                node.setAttribute('transform', drehung);
            else
                node.removeAttribute('transform');
            return node;
        }
        if (fresh.firstElementChild || node?.firstElementChild) {
            if (node?.parentNode)
                node.replaceWith(fresh);
            return fresh;
        }
        if (!node || node.tagName !== fresh.tagName) {
            if (node?.parentNode)
                node.replaceWith(fresh);
            return fresh;
        }
        [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
        [...fresh.attributes].forEach(attribute => node.setAttribute(attribute.name, attribute.value));
        node.textContent = fresh.textContent;
        return node;
    };
    const lebende = new Set();
    let observer = null;
    let inspectionQueued = false;
    const inspectLayers = () => {
        inspectionQueued = false;
        let saved = false;
        for (const layer of [...lebende]) {
            if (layer.flaeche.isConnected)
                continue;
            if (layer.abschliessen())
                saved = true;
            lebende.delete(layer);
        }
        if (!lebende.size && observer) {
            observer.disconnect();
            observer = null;
        }
        if (saved && typeof App !== 'undefined' && App.zeichneSeite)
            App.zeichneSeite();
    };
    const registerLayer = (layer) => {
        lebende.add(layer);
        if (typeof MutationObserver === 'undefined')
            return;
        if (!observer)
            observer = new MutationObserver(() => {
                if (inspectionQueued)
                    return;
                inspectionQueued = true;
                queueMicrotask(inspectLayers);
            });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (typeof addEventListener === 'function') {
        addEventListener('pagehide', () => { for (const layer of lebende)
            layer.abschliessen(); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden')
                for (const layer of lebende)
                    layer.abschliessen();
        });
    }
    const schicht = (block, breite, hoehe, umbruch = 0, rand = 0) => {
        const R = SheetSpace;
        const marks = Array.isArray(block.marken) ? clone(block.marken) : [];
        let tool = 'schreiben';
        let color = FARBEN[0];
        let width = BREITEN[1];
        const WERKZEUGWERTE = 'zeichnen:werkzeugwerte';
        const OHNE_TINTE = new Set(['schreiben', 'select', 'radierer', 'laser', 'bild']);
        const werkzeugGruppe = (wz) => istForm(wz) ? 'formen' : OHNE_TINTE.has(String(wz)) ? '' : String(wz || '');
        let letzteGruppe = '';
        const werkzeugwerteLesen = () => {
            const aus = {};
            if (typeof Store === 'undefined')
                return aus;
            const roh = Store.getMeta(WERKZEUGWERTE);
            if (!roh || typeof roh !== 'object')
                return aus;
            for (const [k, v] of Object.entries(roh)) {
                if (!/^[a-z]+$/.test(k) || !v || typeof v !== 'object')
                    continue;
                const e = {};
                const f = String(v.farbe || '').toLowerCase();
                if (/^#[0-9a-f]{6}$/.test(f))
                    e.farbe = f;
                const b = Number(v.breite);
                if (Number.isFinite(b) && b >= 0.5 && b <= 12)
                    e.breite = b;
                if (e.farbe !== undefined || e.breite !== undefined)
                    aus[k] = e;
            }
            return aus;
        };
        const werkzeugwertMerken = () => {
            const g = werkzeugGruppe(tool) || letzteGruppe;
            if (!g || typeof Store === 'undefined')
                return;
            const alle = werkzeugwerteLesen();
            alle[g] = { farbe: color, breite: width };
            try {
                Store.setMeta(WERKZEUGWERTE, alle);
            }
            catch { }
        };
        let radierModus = radierModusLesen();
        const STIFT_SPERRE_MS = 4000;
        const HALTEN_MS = 450;
        const RUHE_RADIUS = 3;
        let formen = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:formen') !== false : true;
        let kritzel = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:kritzel') !== false : true;
        let stiftZuletzt = 0;
        let stiftTimer = null;
        let aktiverZeiger = null;
        let zeigerZuletzt = 0;
        let laserZug = null;
        const VERWAIST_MS = 500;
        let fingerPan = null;
        let radierStrich = null;
        let stil = (typeof Store !== 'undefined' && STIFTE.some(st => st.id === Store.getMeta('zeichnen:stift')))
            ? String(Store.getMeta('zeichnen:stift')) : STIL_VORGABE;
        let schrift = schriftLesen();
        let running = null;
        let runningNode = null;
        let beforeRunning = null;
        let feder = null;
        let glatt = null;
        let handSmoother = null;
        let handRestFrom = 0;
        let druckGlatt = null;
        let letzteZeit = 0;
        let dtLetzt = 16;
        let rohLetzter = null;
        let rohDrei = [];
        let sensorZuletzt = null;
        let nassFlaeche = false;
        let bildWunsch = 0;
        let wegNass = 0;
        let rohZeiten = [];
        let sensorVerlauf = [];
        let tempoMessen = null;
        let tempoJetzt = 0;
        let selection = new Set();
        let selectDrag = null;
        const historyUndo = [];
        const historyRedo = [];
        const stateListeners = new Set();
        const randBreit = Math.max(0, Number(rand) || 0);
        const flaeche = svg('svg', { class: 'blatt-marken',
            viewBox: `0 0 ${breite + randBreit} ${hoehe}`,
            preserveAspectRatio: 'none', 'data-tool': tool });
        if (randBreit > 0)
            flaeche.appendChild(svg('line', { x1: breite, x2: breite, y1: 0, y2: hoehe,
                stroke: 'currentColor', 'stroke-width': 0.7, 'stroke-dasharray': '4 5',
                opacity: 0.3, class: 'blatt-randkante' }));
        for (let page = 1; umbruch > 0 && page * umbruch < hoehe; page++) {
            flaeche.appendChild(svg('line', { x1: 0, x2: breite, y1: page * umbruch, y2: page * umbruch,
                stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-dasharray': '6 6',
                opacity: 0.35, class: 'blatt-umbruch' }));
        }
        const gezeichnet = new Map();
        const fassung = (mark) => JSON.stringify(mark);
        const merke = (mark) => { gezeichnet.set(idOf(mark), mark); };
        const defsAuffrischen = () => {
            flaeche.querySelector('[data-ink-defs]')?.remove();
            const defs = verlaufDefs(marks);
            if (defs)
                flaeche.insertBefore(defs, flaeche.firstChild);
        };
        marks.forEach(mark => {
            const node = zeichneMarke(mark);
            if (node) {
                flaeche.appendChild(node);
                merke(mark);
            }
        });
        defsAuffrischen();
        const aufgedeckt = new Set();
        const abdeckAnwenden = () => {
            flaeche.querySelectorAll('[data-ink-art="abdeck"]').forEach(node => {
                const id = node.getAttribute('data-sid') || '';
                if (aufgedeckt.has(id))
                    node.setAttribute('data-auf', '1');
                else
                    node.removeAttribute('data-auf');
            });
        };
        let lineal = false;
        const ruler = InkRuler.create(flaeche, breite, hoehe);
        let eraserSize = null;
        const rasten = (anfang, ende) => {
            const dx = ende[0] - anfang[0];
            const dy = ende[1] - anfang[1];
            const radius = Math.hypot(dx, dy);
            if (radius < 0.001)
                return ende;
            const schritt = Math.PI / 12;
            const winkel = Math.round(Math.atan2(dy, dx) / schritt) * schritt;
            return [anfang[0] + radius * Math.cos(winkel),
                anfang[1] + radius * Math.sin(winkel)];
        };
        const snapshot = () => {
            const liste = marks.slice();
            for (const mark of liste) {
                if (Array.isArray(mark?.pts))
                    Object.freeze(mark.pts);
                if (Array.isArray(mark?.pressure))
                    Object.freeze(mark.pressure);
                Object.freeze(mark);
            }
            return liste;
        };
        const platzVon = (id) => marks.findIndex(mark => idOf(mark) === id);
        const ersetze = (index, neu) => {
            if (index < 0 || index >= marks.length)
                return null;
            marks[index] = neu;
            return neu;
        };
        const state = () => ({ undo: historyUndo.length > 0, redo: historyRedo.length > 0,
            selected: selection.size, clipboard: zwischenablage.length > 0, gesperrt: gesperrtGewaehlt(),
            element: letztesElement });
        const notifyState = () => stateListeners.forEach(listener => listener(state()));
        const save = () => Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION });
        const listenGleich = (a, b) => {
            if (a === b)
                return true;
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] === b[i])
                    continue;
                if (fassung(a[i]) !== fassung(b[i]))
                    return false;
            }
            return true;
        };
        const commit = (before) => {
            if (listenGleich(before, marks))
                return;
            historyUndo.push(before);
            if (historyUndo.length > HISTORY_LIMIT)
                historyUndo.shift();
            historyRedo.length = 0;
            save();
            notifyState();
        };
        const nodeFor = (id) => id ? flaeche.querySelector(`[data-sid="${CSS.escape(id)}"]`) : null;
        const redraw = () => {
            flaeche.querySelectorAll('[data-ink-ui]').forEach(node => node.remove());
            const knoten = new Map();
            flaeche.querySelectorAll('[data-sid]').forEach(node => {
                const id = node.getAttribute('data-sid') || '';
                if (knoten.has(id))
                    node.remove();
                else
                    knoten.set(id, node);
            });
            const bleibt = new Set();
            let vorheriger = null;
            for (const mark of marks) {
                const id = idOf(mark);
                if (!id || bleibt.has(id))
                    continue;
                let node = knoten.get(id) || null;
                if (!node)
                    node = zeichneMarke(mark);
                else if (gezeichnet.get(id) !== mark)
                    node = updateNode(node, mark);
                if (!node) {
                    gezeichnet.delete(id);
                    continue;
                }
                bleibt.add(id);
                gezeichnet.set(id, mark);
                const platz = vorheriger ? vorheriger.nextSibling : flaeche.querySelector('[data-sid]');
                if (node.parentNode !== flaeche || node !== platz)
                    flaeche.insertBefore(node, platz);
                vorheriger = node;
            }
            knoten.forEach((node, id) => { if (!bleibt.has(id)) {
                node.remove();
                gezeichnet.delete(id);
            } });
            defsAuffrischen();
            abdeckAnwenden();
            renderSelection();
            ruler.remount();
        };
        const restore = (next) => {
            marks.splice(0, marks.length, ...next);
            selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
            save();
            redraw();
            notifyState();
        };
        const undo = () => {
            const previous = historyUndo.pop();
            if (!previous)
                return;
            historyRedo.push(snapshot());
            restore(previous);
        };
        const redo = () => {
            const next = historyRedo.pop();
            if (!next)
                return;
            historyUndo.push(snapshot());
            restore(next);
        };
        const auswahlAchse = () => {
            if (selection.size !== 1)
                return 0;
            const mark = marks.find(item => idOf(item) === [...selection][0]);
            return mark ? InkGeometry.drehung(mark) : 0;
        };
        const auswahlKasten = () => {
            if (auswahlAchse()) {
                const mark = marks.find(item => idOf(item) === [...selection][0]);
                const b = InkGeometry.boundsLokal(mark);
                return { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 };
            }
            const boxes = [...selection]
                .map(id => marks.find(item => idOf(item) === id))
                .filter(Boolean)
                .map(mark => InkGeometry.bounds(mark));
            const box = InkGeometry.union(boxes);
            return { x: box.x - 3, y: box.y - 3, width: box.width + 6, height: box.height + 6 };
        };
        function renderSelection() {
            flaeche.querySelectorAll('[data-ink-ui="selection"],[data-ink-ui="griffe"]').forEach(node => node.remove());
            for (const id of selection) {
                const mark = marks.find(item => idOf(item) === id);
                if (!mark)
                    continue;
                const grad = InkGeometry.drehung(mark);
                const box = grad ? InkGeometry.boundsLokal(mark) : InkGeometry.bounds(mark);
                const ziel = grad
                    ? flaeche.appendChild(svg('g', { 'data-ink-ui': 'selection',
                        transform: `rotate(${grad} ${rund2(box.x + box.width / 2)} ${rund2(box.y + box.height / 2)})` }))
                    : flaeche;
                ziel.appendChild(svg('rect', { x: box.x - 3, y: box.y - 3,
                    width: box.width + 6, height: box.height + 6,
                    class: 'blatt-auswahlrahmen' + (mark.gesperrt ? ' blatt-auswahlrahmen-gesperrt' : ''),
                    'data-ink-ui': 'selection' }));
                if (mark.gesperrt) {
                    const aussen = InkGeometry.bounds(mark);
                    const schloss = svg('text', { x: aussen.x - 3, y: aussen.y - 6, class: 'blatt-schloss', 'data-ink-ui': 'selection' });
                    schloss.textContent = '🔒';
                    flaeche.appendChild(schloss);
                }
            }
            if (selection.size) {
                const k = auswahlKasten();
                const achse = auswahlAchse();
                const g = svg('g', achse
                    ? { 'data-ink-ui': 'griffe',
                        transform: `rotate(${achse} ${rund2(k.x + k.width / 2)} ${rund2(k.y + k.height / 2)})` }
                    : { 'data-ink-ui': 'griffe' });
                g.appendChild(svg('rect', { x: k.x, y: k.y, width: k.width, height: k.height,
                    class: 'blatt-auswahlkasten' }));
                const ecken = [
                    ['nw', k.x, k.y], ['ne', k.x + k.width, k.y],
                    ['sw', k.x, k.y + k.height], ['se', k.x + k.width, k.y + k.height]
                ];
                for (const [name, x, y] of ecken) {
                    g.appendChild(svg('circle', { cx: x, cy: y, r: 22, class: 'blatt-griff-feld', 'data-griff': name }));
                    g.appendChild(svg('circle', { cx: x, cy: y, r: 5, class: 'blatt-griff' }));
                }
                if (selection.size === 1) {
                    const nur = marks.find(item => idOf(item) === [...selection][0]);
                    const cp = nur && nur.art === 'curve' ? InkGeometry.points(nur.pts)[2] : null;
                    if (cp) {
                        g.appendChild(svg('circle', { cx: cp[0], cy: cp[1], r: 22, class: 'blatt-griff-feld', 'data-griff': 'kurve' }));
                        g.appendChild(svg('circle', { cx: cp[0], cy: cp[1], r: 5, class: 'blatt-griff blatt-griff-kurve' }));
                    }
                }
                const ox = k.x + k.width / 2;
                const oy = k.y < 40 ? k.y + k.height + 28 : k.y - 28;
                g.appendChild(svg('line', { x1: ox, y1: k.y < 40 ? k.y + k.height : k.y, x2: ox, y2: oy, class: 'blatt-auswahlkasten' }));
                g.appendChild(svg('circle', { cx: ox, cy: oy, r: 22, class: 'blatt-griff-feld blatt-griff-dreh', 'data-griff': 'dreh' }));
                g.appendChild(svg('circle', { cx: ox, cy: oy, r: 5, class: 'blatt-griff blatt-griff-dreh-punkt' }));
                flaeche.appendChild(g);
            }
            notifyState();
        }
        const imLasso = (mark, schlinge) => {
            const art = String(mark?.art || '');
            const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
            if (linie && Array.isArray(mark.pts) && mark.pts.length) {
                const drin = mark.pts.filter(p => InkGeometry.insidePolygon([p[0] ?? 0, p[1] ?? 0], schlinge)).length;
                return drin * 2 >= mark.pts.length;
            }
            const box = InkGeometry.bounds(mark);
            return InkGeometry.insidePolygon([box.x + box.width / 2, box.y + box.height / 2], schlinge);
        };
        const deleteSelection = () => {
            if (!selection.size)
                return;
            const before = snapshot();
            for (let index = marks.length - 1; index >= 0; index--)
                if (selection.has(idOf(marks[index])) && !marks[index].gesperrt)
                    marks.splice(index, 1);
            selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
            redraw();
            commit(before);
        };
        const cutSelection = () => {
            const n = copySelection();
            if (n)
                deleteSelection();
            return n;
        };
        const nachVorn = () => {
            if (!selection.size)
                return;
            const before = snapshot();
            const drin = marks.filter(mark => selection.has(idOf(mark)) && !mark.gesperrt);
            const rest = marks.filter(mark => !selection.has(idOf(mark)) || mark.gesperrt);
            marks.splice(0, marks.length, ...rest, ...drin);
            redraw();
            commit(before);
        };
        const nachHinten = () => {
            if (!selection.size)
                return;
            const before = snapshot();
            const drin = marks.filter(mark => selection.has(idOf(mark)) && !mark.gesperrt);
            const rest = marks.filter(mark => !selection.has(idOf(mark)) || mark.gesperrt);
            marks.splice(0, marks.length, ...drin, ...rest);
            redraw();
            commit(before);
        };
        const verweisSetzen = async () => {
            if (!selection.size)
                return;
            const erste = marks.find(m => selection.has(idOf(m)));
            const vorgabe = erste?.href ? String(erste.href)
                : erste?.zielSeite ? '[[' + String(Store.getBlock(String(erste.zielSeite))?.text || '') + ']]' : '';
            const antwort = await Dialog.frage('Verweis: eine Adresse (https://…) oder eine Seite ([[Name]])', vorgabe);
            if (antwort === null)
                return;
            const wert = antwort.trim();
            const setze = (patch, weg) => {
                for (let i = 0; i < marks.length; i++) {
                    if (!selection.has(idOf(marks[i])) || marks[i].gesperrt)
                        continue;
                    const neu = { ...marks[i], ...patch };
                    for (const f of weg)
                        delete neu[f];
                    marks[i] = neu;
                }
            };
            const before = snapshot();
            if (!wert) {
                setze({}, ['href', 'zielSeite']);
                redraw();
                commit(before);
                UI.toast('Verweis entfernt');
                return;
            }
            const seitenName = wert.match(/^\[\[(.+?)\]\]$/)?.[1];
            if (seitenName || !/^[a-z][a-z0-9+.-]*:/i.test(wert)) {
                const name = String(seitenName || wert).trim();
                const ziel = (typeof Links !== 'undefined' && typeof Links.loeseSeitenverweis === 'function')
                    ? Links.loeseSeitenverweis(name).page : null;
                if (!ziel) {
                    UI.toast('Keine Seite „' + name + '" gefunden.');
                    return;
                }
                setze({ zielSeite: ziel.id }, ['href']);
            }
            else {
                const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(wert) : '';
                if (!sicher || !/^(https?:|mailto:)/i.test(sicher)) {
                    UI.toast('Diese Adresse nimmt Redion nicht: nur http, https oder mailto (§19).');
                    return;
                }
                setze({ href: sicher }, ['zielSeite']);
            }
            redraw();
            commit(before);
            UI.toast('🔗 Verweis gesetzt — im Lesemodus antippen');
        };
        const verweisFolgen = (mark) => {
            if (mark.href) {
                const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(mark.href) : '';
                if (sicher && /^(https?:|mailto:)/i.test(sicher))
                    window.open(sicher, '_blank', 'noopener');
                return;
            }
            if (mark.zielSeite) {
                const ziel = Store.getBlock(String(mark.zielSeite));
                if (ziel && ziel.alive !== false)
                    App.oeffne(ziel.id);
                else
                    UI.toast('Die Zielseite gibt es nicht mehr.');
            }
        };
        const gesperrtGewaehlt = () => selection.size > 0 && [...selection].every(id => !!marks.find(mark => idOf(mark) === id)?.gesperrt);
        const sperren = (an) => {
            if (!selection.size)
                return;
            const before = snapshot();
            const ziel = typeof an === 'boolean' ? an : !gesperrtGewaehlt();
            for (let i = 0; i < marks.length; i++) {
                if (!selection.has(idOf(marks[i])))
                    continue;
                const neu = { ...marks[i] };
                if (ziel)
                    neu.gesperrt = true;
                else
                    delete neu.gesperrt;
                marks[i] = neu;
                merke(neu);
            }
            renderSelection();
            commit(before);
        };
        const copySelection = () => {
            const kopie = marks.filter(mark => selection.has(idOf(mark))).map(mark => clone(mark));
            if (kopie.length) {
                zwischenablage = kopie;
                notifyState();
            }
            return kopie.length;
        };
        const paste = () => {
            if (!zwischenablage.length)
                return 0;
            if (tool !== 'select') {
                setzeWerkzeug('select');
                if (typeof Zeichenziel !== 'undefined') {
                    try {
                        Zeichenziel.uebernehme(steuerung, 'select');
                    }
                    catch { }
                }
            }
            const before = snapshot();
            const neue = zwischenablage.map(mark => InkGeometry.move({ ...clone(mark), id: frischeId() }, 16, 16));
            marks.push(...neue);
            neue.forEach(mark => { const node = zeichneMarke(mark); if (node) {
                flaeche.appendChild(node);
                merke(mark);
            } });
            selection = new Set(neue.map(mark => idOf(mark)));
            zwischenablage = neue.map(mark => clone(mark));
            renderSelection();
            commit(before);
            return neue.length;
        };
        const radierRadius = () => eraserSize ?? Math.max(5, width * 3);
        const frischeId = () => typeof Ids !== 'undefined' ? Ids.short(8) : 'm' + Math.random().toString(36).slice(2, 10);
        const radiereEine = (index, center, r) => {
            const mark = marks[index];
            if (!mark)
                return false;
            const nur = RADIER_NUR(radierModus);
            if (nur && mark.art !== nur)
                return false;
            if (mark.art === 'bild')
                return false;
            if (mark.gesperrt)
                return false;
            const id = idOf(mark);
            const teilbar = radierModus === 'teil' && (mark.art === 'stift' || mark.art === 'marker');
            const stuecke = teilbar
                ? InkGeometry.splitByCircle(mark.pts, mark.pressure, center, r, { neigung: mark.neigung, tempo: mark.tempo }) : [];
            if (teilbar && stuecke.length === 1 && JSON.stringify(stuecke[0].pts) === JSON.stringify(mark.pts))
                return false;
            nodeFor(id)?.remove();
            gezeichnet.delete(id);
            selection.delete(id);
            const ersatz = stuecke.map((stueck, n) => {
                const neu = { ...clone(mark), id: n === 0 ? id : frischeId(), pts: stueck.pts, pressure: stueck.pressure };
                for (const kanal of ['neigung', 'tempo']) {
                    if (stueck.kanaele?.[kanal])
                        neu[kanal] = stueck.kanaele[kanal];
                    else
                        delete neu[kanal];
                }
                return neu;
            });
            marks.splice(index, 1, ...ersatz);
            ersatz.forEach(neu => { const node = zeichneMarke(neu); if (node) {
                flaeche.appendChild(node);
                merke(neu);
            } });
            return true;
        };
        const radiereBei = (roh) => {
            const center = [roh[0] ?? 0, roh[1] ?? 0];
            const r = radierRadius();
            let getroffen = false;
            for (let index = marks.length - 1; index >= 0; index--) {
                const mark = marks[index];
                if (radierModus === 'marker' && mark.art !== 'marker')
                    continue;
                if (!InkGeometry.touchesCircle(mark, center, r, strokeWidth(mark) / 2))
                    continue;
                if (radiereEine(index, center, r))
                    getroffen = true;
            }
            return getroffen;
        };
        const radiereMarke = (id, roh) => {
            const index = marks.findIndex(mark => idOf(mark) === id);
            if (index < 0)
                return false;
            return radiereEine(index, [roh[0] ?? 0, roh[1] ?? 0], radierRadius());
        };
        const neigungAus = (event) => {
            if (event.pointerType !== 'pen')
                return -1;
            const { tiltX, tiltY, pointerType } = event;
            return InkStroke.tiltOf({ tiltX, tiltY, pointerType });
        };
        const pressureOf = (event) => {
            const pressure = Number(event.pressure);
            return pressure > 0 ? Math.max(0.05, Math.min(1, pressure)) : 0.5;
        };
        const druckAus = (event, point) => {
            const stift = event.pointerType === 'pen';
            if (stift && Number(event.pressure) > 0) {
                sensorZuletzt = pressureOf(event);
                return sensorZuletzt;
            }
            if (stift && sensorZuletzt !== null)
                return sensorZuletzt;
            if (!running)
                return pressureOf(event);
            const jetzt = Number(event.timeStamp) || 0;
            const z = running.zuletzt;
            let druck = 0.6;
            if (z && z.p) {
                const dt = Math.max(1, jetzt - z.t);
                const v = Math.hypot((point[0] ?? 0) - (z.p[0] ?? 0), (point[1] ?? 0) - (z.p[1] ?? 0)) / dt;
                druck = Math.max(0.28, Math.min(0.85, 0.85 - v * 0.4));
                druck = z.d * 0.6 + druck * 0.4;
            }
            running.zuletzt = { t: jetzt, p: point, d: druck };
            return Math.round(druck * 100) / 100;
        };
        const stiftGesehen = () => {
            stiftZuletzt = Date.now();
            flaeche.setAttribute('data-stift', 'an');
            const dokument = flaeche.closest('.document-workspace');
            if (dokument)
                dokument.dataset.documentPen = 'seen';
            if (stiftTimer)
                clearTimeout(stiftTimer);
            stiftTimer = setTimeout(() => {
                if (!flaeche.closest('.document-workspace'))
                    flaeche.removeAttribute('data-stift');
                stiftTimer = null;
            }, STIFT_SPERRE_MS);
        };
        const fingerGesperrt = (event) => event.pointerType === 'touch' &&
            (flaeche.closest('.document-workspace')?.dataset.documentPen === 'seen' ||
                Date.now() - stiftZuletzt < STIFT_SPERRE_MS || (running !== null && running.zeigerArt === 'pen'));
        const verwerfen = () => {
            bildAbsagen();
            laserAus(true);
            if (running) {
                runningNode?.remove();
                running = null;
                runningNode = null;
                beforeRunning = null;
            }
            feder = null;
            glatt = null;
            handSmoother = null;
            handRestFrom = 0;
            druckGlatt = null;
            letzteZeit = 0;
            nassFlaeche = false;
            rohLetzter = null;
            rohDrei = [];
            rohZeiten = [];
            sensorVerlauf = [];
            tempoMessen = null;
            tempoJetzt = 0;
            aktiverZeiger = null;
        };
        const laserAn = (punkt) => {
            laserAus(true);
            const art = laserArt();
            const knoten = svg('g', { 'data-ink-ui': 'laser', class: 'blatt-laser' });
            const spur = svg('path', { class: 'blatt-laser-spur', d: '' });
            const kopf = svg('circle', { class: 'blatt-laser-kopf', r: '4.5',
                cx: String(punkt[0]), cy: String(punkt[1]) });
            if (art === 'linie')
                knoten.appendChild(spur);
            knoten.appendChild(kopf);
            flaeche.appendChild(knoten);
            laserZug = { pts: [[punkt[0] ?? 0, punkt[1] ?? 0]], knoten };
        };
        const laserZeigen = (punkt) => {
            if (!laserZug)
                return;
            const pts = laserZug.pts;
            const letzt = pts[pts.length - 1];
            if (Math.hypot((punkt[0] ?? 0) - letzt[0], (punkt[1] ?? 0) - letzt[1]) < 0.8)
                return;
            pts.push([punkt[0] ?? 0, punkt[1] ?? 0]);
            if (pts.length > 40)
                pts.splice(0, pts.length - 40);
            const kopf = laserZug.knoten.querySelector('.blatt-laser-kopf');
            kopf?.setAttribute('cx', String(punkt[0]));
            kopf?.setAttribute('cy', String(punkt[1]));
            const spur = laserZug.knoten.querySelector('.blatt-laser-spur');
            if (spur)
                spur.setAttribute('d', InkGeometry.path(pts));
        };
        const laserAus = (sofort = false) => {
            const zug = laserZug;
            laserZug = null;
            if (!zug)
                return;
            if (sofort) {
                zug.knoten.remove();
                return;
            }
            zug.knoten.classList.add('blatt-laser-weg');
            setTimeout(() => zug.knoten.remove(), LASER_MS + 120);
        };
        const addSample = (event, um) => {
            if (!running)
                return;
            const sample = um ? um(event) : R.zuBlatt(flaeche, event);
            const roh = sample ? ruler.project(sample) : null;
            if (!roh)
                return;
            const drucken = druckAus(event, roh);
            const jetzt = Number(event.timeStamp) || letzteZeit;
            const dt = letzteZeit ? Math.max(1, jetzt - letzteZeit) : 16;
            letzteZeit = jetzt;
            dtLetzt = dt;
            const point = glatt ? glatt(roh, dt) : roh;
            const hand = handSmoother ? handSmoother(roh, dt) : point;
            rohLetzter = roh;
            rohDrei.push(roh);
            if (rohDrei.length > 3)
                rohDrei.shift();
            rohZeiten.push(dt);
            if (rohZeiten.length > 3)
                rohZeiten.shift();
            if (sensorZuletzt !== null && event.pointerType === 'pen') {
                sensorVerlauf.push(sensorZuletzt);
                if (sensorVerlauf.length > 8)
                    sensorVerlauf.shift();
            }
            if (tempoMessen)
                tempoJetzt = tempoMessen(roh, dt);
            const druck = druckGlatt ? druckGlatt(drucken) : drucken;
            const last = running.pts[running.pts.length - 1];
            if (last && Math.abs(last[0] - point[0]) < 0.6 && Math.abs(last[1] - point[1]) < 0.6)
                return;
            if (last)
                wegNass += Math.hypot(point[0] - last[0], point[1] - last[1]);
            running.pts.push(point);
            running.pressure.push(druck);
            if (running.neigung)
                running.neigung.push(neigungAus(event));
            if (running.tempo)
                running.tempo.push(tempoJetzt);
            breiteFestlegen(jetzt);
            const ruhe = running.ruhePunkt;
            if (!ruhe || Math.hypot(hand[0] - ruhe[0], hand[1] - ruhe[1]) > RUHE_RADIUS) {
                running.ruhePunkt = [hand[0], hand[1]];
                running.bewegtUm = Date.now();
                handRestFrom = running.pts.length;
            }
            feder?.punkt(point, halbeBreite(running, druck) * nassSpitze());
        };
        const halbeBreite = (mark, druck) => {
            const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
            const neig = Array.isArray(mark?.neigung) ? mark.neigung : [];
            const n = Number(neig[neig.length - 1]);
            const eile = Array.isArray(mark?.tempo) && sensorZuletzt !== null ? eileVon(String(mark?.stil || '')) : 0;
            return base / 2 * druckFaktor(String(mark?.stil || ''), druck, Number.isFinite(n) && n > 0 ? n : 0) * (eile ? InkStroke.tempoFaktor(tempoJetzt, eile) : 1);
        };
        let breiteAb = 0;
        const breiteFestlegen = (jetzt = 0) => {
            if (!running || Number(running.breiteFest) > 0)
                return;
            const linie = running.art === 'marker'
                || (running.art === 'stift' && !FLAECHEN_STIFTE.has(String(running.stil || '')));
            if (!linie)
                return;
            const base = Math.max(0.5, Number(running.breite) || BREITEN[1]);
            const mal = running.art === 'marker' ? 4 : 1;
            if (running.zeigerArt !== 'pen') {
                running.breiteFest = Math.round(base * mal * 100) / 100;
                return;
            }
            if (!breiteAb)
                breiteAb = jetzt;
            if (running.pressure.length < 3 || jetzt - breiteAb < 50)
                return;
            const werte = running.pressure.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
            const mitte = sensorZuletzt !== null ? (werte[Math.floor(werte.length / 2)] ?? 0.5) : 0.5;
            const faktor = Math.max(0.55, Math.min(1.55, 0.65 + mitte * 0.7));
            running.breiteFest = Math.round(base * faktor * mal * 100) / 100;
        };
        const nassSpitze = () => {
            if (!running)
                return 1;
            const base = Math.max(0.5, Number(running.breite) || BREITEN[1]);
            return InkGeometry.spitzeFaktor(wegNass, spitzeLaenge(base), spitzeVon(String(running.stil || '')));
        };
        const nassZeichnen = () => {
            if (!running || !feder || !runningNode)
                return;
            const alsFlaeche = running.art === 'stift' &&
                FLAECHEN_STIFTE.has(String(running.stil)) && feder.laenge() >= 3;
            if (alsFlaeche !== nassFlaeche) {
                nassFlaeche = alsFlaeche;
                runningNode = updateNode(runningNode, nasseMarke());
                return;
            }
            if (running.art === 'marker' && running.stil === 'keil') {
                runningNode.setAttribute('d', InkGeometry.vieleckPfad(keilVielecke(running, feder.punkteMitNass())));
                return;
            }
            const d = alsFlaeche ? feder.d() : feder.linie();
            if (d)
                runningNode.setAttribute('d', d);
            if (!alsFlaeche)
                runningNode.setAttribute('stroke-width', String(strokeWidth(running)));
        };
        const nasseMarke = () => ({ ...running,
            pts: running.pts.length > 1 ? running.pts : [running.pts[0], running.pts[0]] });
        const nassenSchwanz = (event, um) => {
            if (!feder || !running || ruler.constrained())
                return;
            const druck = running.pressure[running.pressure.length - 1] ?? 0.5;
            const halb = halbeBreite(running, druck) * nassSpitze();
            let pts = [];
            const halt = InkStroke.bremse(rohDrei, rohZeiten, sensorVerlauf);
            const vom = typeof event.getPredictedEvents === 'function'
                ? event.getPredictedEvents() : [];
            if (vom.length) {
                const roh = [];
                for (const p of vom.slice(0, 3)) {
                    const q = um ? um(p) : R.zuBlatt(flaeche, p);
                    if (q)
                        roh.push(q);
                }
                pts = InkStroke.deckeln(rohDrei, roh, dtLetzt, halt);
            }
            if (!vom.length) {
                pts = InkStroke.vorhersage(rohDrei, InkStroke.VORHER_MS, dtLetzt, halt);
            }
            const spitze = rohLetzter;
            if (spitze) {
                const letzterFest = running.pts[running.pts.length - 1];
                const weg = letzterFest
                    ? Math.hypot(spitze[0] - letzterFest[0], spitze[1] - letzterFest[1]) : 0;
                if (weg > 0.2)
                    pts = [[spitze[0], spitze[1]], ...pts];
            }
            feder.nass(pts, pts.map(() => halb));
        };
        const bildAnfordern = () => {
            if (bildWunsch)
                return;
            if (typeof requestAnimationFrame !== 'function') {
                nassZeichnen();
                return;
            }
            bildWunsch = requestAnimationFrame(() => { bildWunsch = 0; nassZeichnen(); });
        };
        const bildAbsagen = () => {
            if (bildWunsch && typeof cancelAnimationFrame === 'function')
                cancelAnimationFrame(bildWunsch);
            bildWunsch = 0;
        };
        const bildMass = (datei) => new Promise(fertig => {
            const url = URL.createObjectURL(datei);
            const bild = new Image();
            bild.onload = () => { fertig({ w: bild.naturalWidth, h: bild.naturalHeight }); URL.revokeObjectURL(url); };
            bild.onerror = () => { fertig(null); URL.revokeObjectURL(url); };
            bild.src = url;
        });
        const bildAblegen = async (datei, mitte) => {
            if (!datei || typeof Dateien === 'undefined' || typeof Dateien.ablegen !== 'function')
                return false;
            const mass = await bildMass(datei);
            const satz = await Dateien.ablegen(datei, { blockId: block.id, name: datei.name });
            const dateiId = String(satz?.id || '');
            if (!dateiId)
                return false;
            const seite = umbruch > 0 ? Math.min(umbruch, hoehe) : hoehe;
            const verhaeltnis = mass && mass.w > 0 && mass.h > 0 ? mass.h / mass.w : 3 / 4;
            let w = breite / 2;
            let h = w * verhaeltnis;
            if (h > seite * 0.9) {
                h = seite * 0.9;
                w = h / verhaeltnis;
            }
            const klemme = (wert, von, bis) => Math.max(von, Math.min(bis, wert));
            const cx = mitte ? klemme(mitte[0] ?? 0, w / 2, breite - w / 2) : breite / 2;
            const cy = mitte ? klemme(mitte[1] ?? 0, h / 2, hoehe - h / 2) : seite / 2;
            const r2 = (wert) => Math.round(wert * 100) / 100;
            const mark = { id: frischeId(), art: 'bild', dateiId,
                pts: [[r2(cx - w / 2), r2(cy - h / 2)], [r2(cx + w / 2), r2(cy + h / 2)]] };
            try {
                await Dateien.adresse(dateiId);
            }
            catch { }
            const before = snapshot();
            marks.push(mark);
            const node = zeichneMarke(mark);
            if (node) {
                flaeche.appendChild(node);
                merke(mark);
            }
            if (tool !== 'select') {
                setzeWerkzeug('select');
                if (typeof Zeichenziel !== 'undefined') {
                    try {
                        Zeichenziel.uebernehme(steuerung, 'select');
                    }
                    catch { }
                }
            }
            selection = new Set([idOf(mark)]);
            renderSelection();
            commit(before);
            return true;
        };
        const pdfAlsBildmarke = async (datei, mitte) => {
            if (typeof PdfLeser === 'undefined') {
                UI.toast('Der PDF-Leser ist gerade nicht da.');
                return false;
            }
            let leser = null;
            try {
                leser = await PdfLeser.oeffne(new Uint8Array(await datei.arrayBuffer()));
                let nr = 1;
                if (leser.seiten > 1) {
                    if (typeof Dialog === 'undefined')
                        return false;
                    const antwort = await Dialog.frage('Welche Seite aus „' + datei.name + '"? (1 bis ' + leser.seiten + ')', '1');
                    if (antwort === null)
                        return false;
                    const gewaehlt = Math.round(Number(String(antwort).replace(',', '.')));
                    if (!Number.isFinite(gewaehlt) || gewaehlt < 1 || gewaehlt > leser.seiten) {
                        UI.toast('Diese PDF hat die Seiten 1 bis ' + leser.seiten + '.');
                        return false;
                    }
                    nr = gewaehlt;
                }
                const blob = await leser.alsBild(nr);
                const name = datei.name.replace(/\.pdf$/i, '') + ' — Seite ' + nr + '.webp';
                return await bildAblegen(new File([blob], name, { type: blob.type || 'image/webp' }), mitte);
            }
            catch (e) {
                UI.toast('Diese PDF liess sich nicht einfügen: ' + (e instanceof Error ? e.message : String(e)));
                return false;
            }
            finally {
                try {
                    leser?.schliessen?.();
                }
                catch { }
            }
        };
        const bildEinfuegen = (mitte) => new Promise(fertig => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,image/gif,application/pdf,.pdf';
            input.style.display = 'none';
            document.body.appendChild(input);
            let entschieden = false;
            const auf = () => {
                if (entschieden)
                    return;
                entschieden = true;
                const datei = input.files?.[0];
                input.remove();
                if (!datei) {
                    fertig(false);
                    return;
                }
                const istPdf = datei.type === 'application/pdf' || /\.pdf$/i.test(datei.name);
                const weg = istPdf ? pdfAlsBildmarke(datei, mitte) : bildAblegen(datei, mitte);
                weg.then(fertig, () => {
                    if (typeof UI !== 'undefined' && UI.toast)
                        UI.toast('Das Bild liess sich nicht ablegen.');
                    fertig(false);
                });
            };
            input.addEventListener('change', auf);
            input.addEventListener('cancel', auf);
            input.click();
        });
        const istKritzel = (roh) => {
            const pts = InkGeometry.points(roh);
            if (pts.length < 10)
                return false;
            const b = InkGeometry.bounds({ pts, breite: 0 });
            const breit = b.width >= b.height;
            let wechsel = 0, letzt = 0, laenge = 0;
            for (let i = 1; i < pts.length; i++) {
                const p = pts[i], q = pts[i - 1];
                const d = breit ? p[0] - q[0] : p[1] - q[1];
                laenge += Math.hypot(p[0] - q[0], p[1] - q[1]);
                const s = d > 0.4 ? 1 : d < -0.4 ? -1 : 0;
                if (s && letzt && s !== letzt)
                    wechsel++;
                if (s)
                    letzt = s;
            }
            return wechsel >= 4 && laenge >= 2.2 * Math.hypot(b.width, b.height);
        };
        const KRITZEL_NAH = 6;
        const kritzelTrifft = (roh) => {
            const zug = InkGeometry.points(roh);
            const k = InkGeometry.bounds({ pts: roh, breite: KRITZEL_NAH });
            const weg = new Set();
            if (!zug.length)
                return weg;
            for (const m of marks) {
                if (m.art === 'bild' || m.gesperrt)
                    continue;
                if (!InkGeometry.intersects(k, InkGeometry.bounds(m)))
                    continue;
                if (InkGeometry.LINIEN.has(String(m.art)) && Array.isArray(m.pts) && m.pts.length) {
                    const punkte = InkGeometry.densify(m.pts, KRITZEL_NAH);
                    const n = punkte.filter(q => InkGeometry.distanceToPolyline(zug, q) <= KRITZEL_NAH).length;
                    if (n * 2 >= punkte.length)
                        weg.add(idOf(m));
                }
                else {
                    const b = InkGeometry.bounds(m);
                    const mitte = [b.x + b.width / 2, b.y + b.height / 2];
                    const ecken = InkGeometry.ecken(m);
                    if (InkGeometry.distanceToPolyline(zug, mitte) <= KRITZEL_NAH
                        || zug.some(q => InkGeometry.insidePolygon(q, ecken)))
                        weg.add(idOf(m));
                }
            }
            return weg;
        };
        const istSchlinge = (roh) => {
            const pts = InkGeometry.points(roh);
            if (pts.length < 8)
                return false;
            const b = InkGeometry.bounds({ pts, breite: 0 });
            const diag = Math.hypot(b.width, b.height);
            if (diag < 12)
                return false;
            const a = pts[0], z = pts[pts.length - 1];
            let laenge = 0;
            for (let i = 1; i < pts.length; i++)
                laenge += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
            return Math.hypot(z[0] - a[0], z[1] - a[1]) <= 0.2 * diag && laenge >= 1.5 * diag;
        };
        const finish = () => {
            aktiverZeiger = null;
            if (radierStrich) {
                const strich = radierStrich;
                radierStrich = null;
                strich.kreis?.remove();
                if (!strich.geaendert)
                    return false;
                renderSelection();
                commit(strich.before);
                return true;
            }
            if (selectDrag) {
                const drag = selectDrag;
                selectDrag = null;
                flaeche.querySelectorAll('[data-ink-ui="box"]').forEach(node => node.remove());
                if ((drag.mode === 'move' || drag.mode === 'scale' || drag.mode === 'rotate' || drag.mode === 'kurve') && drag.moved) {
                    commit(drag.before);
                    return true;
                }
                if (drag.mode === 'lasso') {
                    const pts = drag.pts;
                    if (!drag.add)
                        selection.clear();
                    const huelle = InkGeometry.union(pts.map(q => ({ x: q[0] ?? 0, y: q[1] ?? 0, width: 0, height: 0 })));
                    const flaeche = InkGeometry.polygonArea(pts);
                    if (pts.length >= 3 && flaeche > 4 && flaeche >= 0.15 * huelle.width * huelle.height) {
                        marks.forEach(mark => { if (imLasso(mark, pts))
                            selection.add(idOf(mark)); });
                    }
                    else if (pts.length >= 2) {
                        const a = pts[0], z = pts[pts.length - 1];
                        const box = InkGeometry.rectangle([a[0] ?? 0, a[1] ?? 0], [z[0] ?? 0, z[1] ?? 0]);
                        marks.forEach(mark => {
                            if (!InkGeometry.intersects(box, InkGeometry.bounds(mark)))
                                return;
                            if (InkGeometry.drehung(mark) && !InkGeometry.overlapConvex(InkGeometry.kastenEcken(box), InkGeometry.ecken(mark)))
                                return;
                            selection.add(idOf(mark));
                        });
                    }
                    renderSelection();
                    const istTipp = pts.length < 2 || pts.every(q => Math.abs((q[0] ?? 0) - (pts[0][0] ?? 0)) <= 4
                        && Math.abs((q[1] ?? 0) - (pts[0][1] ?? 0)) <= 4);
                    if (istTipp && drag.warLeer && !drag.add && !selection.size) {
                        schreiberOeffnen(pts[0] ?? [0, 0], '');
                        return false;
                    }
                }
                return false;
            }
            if (!running)
                return false;
            const mark = running;
            const node = runningNode;
            const before = beforeRunning || snapshot();
            bildAbsagen();
            const letzterRoh = rohLetzter;
            const restFrom = handRestFrom;
            feder = null;
            glatt = null;
            handSmoother = null;
            handRestFrom = 0;
            druckGlatt = null;
            letzteZeit = 0;
            nassFlaeche = false;
            rohLetzter = null;
            rohDrei = [];
            running = null;
            runningNode = null;
            beforeRunning = null;
            if (mark.art === 'stift' || mark.art === 'marker')
                mark.druckArt = mark.zeigerArt === 'pen' && sensorZuletzt !== null ? 'stift' : 'tempo';
            if (mark.druckArt !== 'stift' || !Array.isArray(mark.tempo))
                delete mark.tempo;
            tempoMessen = null;
            rohZeiten = [];
            sensorVerlauf = [];
            delete mark.zeigerArt;
            if (Array.isArray(mark.neigung)) {
                const echt = mark.neigung.map((v) => Number(v));
                if (echt.some((v) => v >= 0))
                    mark.neigung = echt.map((v) => v < 0 ? 0 : v);
                else
                    delete mark.neigung;
            }
            const gehalten = Date.now() - (Number(mark.bewegtUm) || 0) >= HALTEN_MS;
            delete mark.bewegtUm;
            delete mark.ruhePunkt;
            if (mark.art === 'curve' && Array.isArray(mark.pts) && mark.pts.length === 2) {
                const a = InkGeometry.points(mark.pts)[0], z = InkGeometry.points(mark.pts)[1];
                mark.pts = [mark.pts[0], mark.pts[1],
                    [Math.round((a[0] + z[0]) / 2 * 100) / 100, Math.round((a[1] + z[1]) / 2 * 100) / 100]];
            }
            if (mark.art === 'stift' && kritzel && istKritzel(mark.pts)) {
                const weg = kritzelTrifft(mark.pts);
                if (weg.size) {
                    node?.remove();
                    for (let i = marks.length - 1; i >= 0; i--)
                        if (weg.has(idOf(marks[i])))
                            marks.splice(i, 1);
                    selection = new Set([...selection].filter(id => !weg.has(id)));
                    redraw();
                    commit(before);
                    return true;
                }
            }
            if (mark.art === 'stift' && gehalten && istSchlinge(mark.pts)) {
                const drin = marks.filter(m => imLasso(m, mark.pts)).map(m => idOf(m));
                if (drin.length) {
                    node?.remove();
                    setzeWerkzeug('select');
                    if (typeof Zeichenziel !== 'undefined') {
                        try {
                            Zeichenziel.uebernehme(steuerung, 'select');
                        }
                        catch { }
                    }
                    selection = new Set(drin);
                    renderSelection();
                    return false;
                }
            }
            if (mark.art === 'stift' && formen && gehalten && typeof InkShapes !== 'undefined') {
                const shapePts = letzterRoh && restFrom > 0 && restFrom <= mark.pts.length
                    ? [...mark.pts.slice(0, restFrom), letzterRoh] : mark.pts;
                const form = InkShapes.recognize(shapePts)
                    ?? (shapePts !== mark.pts ? InkShapes.recognize(mark.pts) : null);
                if (form) {
                    mark.art = form.art;
                    mark.pts = form.pts;
                    if (form.dreh)
                        mark.dreh = form.dreh;
                    else
                        delete mark.dreh;
                    delete mark.pressure;
                    delete mark.tempo;
                    delete mark.breiteFest;
                    if (mark.stil !== 'schutzleiter')
                        delete mark.stil;
                    delete mark.zuletzt;
                }
            }
            if (mark.art === 'stift' || mark.art === 'marker') {
                if (mark.pts.length === 1) {
                    mark.pts.push([...mark.pts[0]]);
                    mark.pressure.push(mark.pressure[0] ?? 0.5);
                }
                delete mark.zuletzt;
                if (letzterRoh)
                    mark.pts[mark.pts.length - 1] = letzterRoh;
                const original = mark.pts;
                const druckRoh = Array.isArray(mark.pressure) ? mark.pressure.map(Number) : [];
                const mittel = druckRoh.length
                    ? druckRoh.reduce((sum, value) => sum + value, 0) / druckRoh.length : 0.5;
                if (mark.art === 'marker' && lineal) {
                    mark.pts = [original[0], original[original.length - 1]];
                    mark.pressure = [mittel, mittel].map(v => Math.round(v * 100) / 100);
                }
                else {
                    let indizes = InkGeometry.simplifyIndices(original, Math.max(0.55, Number(mark.breite) * 0.28));
                    if (original.length >= 8 && indizes.length < 8) {
                        const gleichmaessig = Array.from({ length: 8 }, (_value, index) => Math.round(index * (original.length - 1) / 7));
                        indizes = Array.from(new Set([...indizes, ...gleichmaessig])).sort((a, b) => a - b);
                    }
                    const neigRoh = Array.isArray(mark.neigung) ? mark.neigung.map(Number) : [];
                    const tempoRoh = Array.isArray(mark.tempo) ? mark.tempo.map(Number) : [];
                    mark.pts = indizes.map(i => original[i]);
                    mark.pressure = indizes.map(i => {
                        const v = druckRoh[i];
                        return Math.round((Number.isFinite(v) ? v : mittel) * 100) / 100;
                    });
                    if (neigRoh.length)
                        mark.neigung = indizes.map(i => {
                            const v = neigRoh[i];
                            return Number.isFinite(v) ? v : 0;
                        });
                    if (tempoRoh.length)
                        mark.tempo = indizes.map(i => {
                            const v = tempoRoh[i] ?? tempoRoh[tempoRoh.length - 1];
                            return Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;
                        });
                }
            }
            else if (mark.pts.length < 2 ||
                Math.hypot(mark.pts[1][0] - mark.pts[0][0], mark.pts[1][1] - mark.pts[0][1]) < 1) {
                node?.remove();
                return false;
            }
            marks.push(mark);
            runningNode = updateNode(node, mark);
            merke(mark);
            commit(before);
            runningNode = null;
            if (mark.art === 'zettel' && !String(mark.text || '').trim())
                void zettelText(idOf(mark), true);
            return true;
        };
        const zettelText = async (targetId, frisch = false) => {
            const zettel = marks.find(mark => idOf(mark) === targetId && mark.art === 'zettel');
            if (!zettel)
                return;
            if (zettel.gesperrt) {
                UI.toast('Diese Haftnotiz ist gesperrt — erst entsperren.');
                return;
            }
            const antwort = await Dialog.mehrzeilig('Haftnotiz', String(zettel.text || ''));
            const before = snapshot();
            if (antwort === null || !antwort.trim()) {
                if (frisch || (antwort !== null && !antwort.trim())) {
                    const index = marks.findIndex(mark => idOf(mark) === targetId);
                    if (index >= 0) {
                        marks.splice(index, 1);
                        redraw();
                        commit(before);
                    }
                }
                return;
            }
            ersetze(platzVon(targetId), { ...zettel, text: antwort });
            redraw();
            commit(before);
        };
        const farbeGueltig = (wert) => {
            const w = String(wert || '').trim();
            return /^#[0-9a-fA-F]{3,8}$/.test(w) || /^rgba?\([\d\s.,%]+\)$/.test(w) ? w : '';
        };
        const laeufeVon = (mark) => Array.isArray(mark?.laeufe) && mark.laeufe.length ? mark.laeufe : null;
        const feldFuellen = (feld, mark) => {
            feld.textContent = '';
            const laeufe = laeufeVon(mark);
            if (!laeufe) {
                feld.append(document.createTextNode(textVon(mark)));
                return;
            }
            for (const l of laeufe) {
                const stueck = document.createElement('span');
                stueck.dataset.lauf = '1';
                const sz = Number(l?.sz) || 0;
                if (sz > 0)
                    stueck.dataset.sz = String(sz);
                if (l?.fett) {
                    stueck.dataset.fett = '1';
                    stueck.style.fontWeight = '700';
                }
                const farbe = farbeGueltig(l?.farbe);
                if (farbe) {
                    stueck.dataset.farbe = farbe;
                    stueck.style.color = farbe;
                }
                if (l?.schrift)
                    stueck.dataset.schrift = String(l.schrift);
                stueck.textContent = String(l?.text ?? '');
                feld.appendChild(stueck);
            }
        };
        const feldLesen = (feld) => {
            const laeufe = [];
            let text = '';
            const anhaengen = (stueck, form) => {
                if (!stueck)
                    return;
                text += stueck;
                const letzter = laeufe[laeufe.length - 1];
                if (letzter && letzter.sz === form.sz && letzter.fett === form.fett
                    && letzter.farbe === form.farbe && letzter.schrift === form.schrift) {
                    letzter.text += stueck;
                    return;
                }
                laeufe.push({ text: stueck, ...form });
            };
            const gehe = (knoten, form) => {
                for (const kind of Array.from(knoten.childNodes)) {
                    if (kind.nodeType === 3) {
                        anhaengen(kind.nodeValue || '', form);
                        continue;
                    }
                    const el = kind;
                    if (!el.tagName)
                        continue;
                    if (el.tagName === 'BR') {
                        anhaengen('\n', form);
                        continue;
                    }
                    if ((el.tagName === 'DIV' || el.tagName === 'P') && text && !text.endsWith('\n'))
                        anhaengen('\n', form);
                    gehe(el, {
                        sz: Number(el.dataset?.sz) || form.sz,
                        fett: el.dataset?.fett === '1' ? true : form.fett,
                        farbe: farbeGueltig(el.dataset?.farbe) || form.farbe,
                        schrift: el.dataset?.schrift || form.schrift
                    });
                }
            };
            gehe(feld, { sz: 0, fett: false, farbe: '', schrift: '' });
            return { text, laeufe };
        };
        let schreiber = null;
        let writerRange = null;
        let writerFrame = 0;
        const resumeWriting = () => {
            if (!schreiber?.feld.isConnected)
                return;
            schreiber.feld.focus({ preventScroll: true });
            if (writerRange && schreiber.feld.contains(writerRange.commonAncestorContainer)) {
                const selection = getSelection();
                selection?.removeAllRanges();
                selection?.addRange(writerRange);
            }
        };
        const scheduleWriterLayout = () => {
            if (writerFrame)
                return;
            writerFrame = requestAnimationFrame(() => { writerFrame = 0; schreiberLegen(); });
        };
        const textVon = (mark) => {
            const laeufe = Array.isArray(mark?.laeufe) ? mark.laeufe : null;
            if (laeufe && laeufe.length)
                return laeufe.map((l) => String(l?.text ?? '')).join('');
            return String(mark?.text || '');
        };
        const schreiberMarke = () => {
            if (!schreiber)
                return null;
            const platz = schreiber.ziel ? platzVon(schreiber.ziel) : -1;
            return platz >= 0 ? marks[platz] : schreiber.entwurf;
        };
        const schreiberLegen = () => {
            if (!schreiber)
                return;
            const marke = schreiberMarke();
            const layout = marke ? InkGeometry.textLayout(marke) : null;
            const kasten = flaeche.getBoundingClientRect();
            if (!layout || !kasten.width || !kasten.height)
                return;
            const sx = kasten.width / (breite + randBreit);
            const sy = kasten.height / hoehe;
            const feld = schreiber.feld;
            const sollPx = layout.fontSize * sy;
            const basisPx = Math.max(16, sollPx);
            const zoom = sollPx / basisPx;
            feld.style.left = (layout.x * sx).toFixed(2) + 'px';
            feld.style.top = (layout.y * sy).toFixed(2) + 'px';
            feld.style.width = ((layout.width * sx) / zoom).toFixed(2) + 'px';
            feld.style.padding = ((layout.pad * sy) / zoom).toFixed(2) + 'px '
                + ((layout.pad * sx) / zoom).toFixed(2) + 'px';
            feld.style.setProperty('font-size', basisPx.toFixed(2) + 'px', 'important');
            feld.style.lineHeight = ((layout.zeile * sy) / zoom).toFixed(2) + 'px';
            feld.style.transformOrigin = 'top left';
            feld.style.transform = zoom === 1 ? 'none' : 'scale(' + zoom.toFixed(4) + ')';
            feld.style.fontFamily = schriftStapel(layout.family);
            feld.style.fontWeight = layout.bold ? '700' : '400';
            feld.style.textAlign = layout.ausricht === 'mitte' ? 'center'
                : layout.ausricht === 'rechts' ? 'right' : 'left';
            feld.style.color = String(marke.farbe || color);
            feld.style.minHeight = ((layout.height * sy) / zoom).toFixed(2) + 'px';
            feld.querySelectorAll('[data-sz]').forEach(stueck => {
                const sz = Number(stueck.dataset.sz) || 0;
                if (sz > 0)
                    stueck.style.fontSize = ((sz * sy) / zoom).toFixed(2) + 'px';
            });
        };
        const schreiberSchliessen = () => {
            const offen = schreiber;
            if (!offen)
                return;
            schreiber = null;
            cancelAnimationFrame(writerFrame);
            writerFrame = 0;
            writerRange = null;
            offen.beobachter?.disconnect();
            const gelesen = feldLesen(offen.feld);
            const text = gelesen.text;
            const neueLaeufe = gelesen.laeufe.some((l) => l.sz || l.fett || l.farbe || l.schrift)
                ? gelesen.laeufe : null;
            const node = offen.ziel ? nodeFor(offen.ziel) : null;
            node?.removeAttribute('data-schreibt');
            offen.feld.remove();
            const platz = offen.ziel ? platzVon(offen.ziel) : -1;
            if (platz >= 0) {
                const alt = marks[platz];
                if (!text.trim())
                    marks.splice(platz, 1);
                else if (String(alt.text || '') !== text
                    || JSON.stringify(alt.laeufe ?? null) !== JSON.stringify(neueLaeufe)) {
                    const neu = { ...alt, text };
                    if (neueLaeufe)
                        neu.laeufe = neueLaeufe;
                    else
                        delete neu.laeufe;
                    ersetze(platz, neu);
                }
                else {
                    redraw();
                    return;
                }
            }
            else {
                if (!text.trim()) {
                    redraw();
                    return;
                }
                marks.push({ ...offen.entwurf, text, ...(neueLaeufe ? { laeufe: neueLaeufe } : {}) });
            }
            redraw();
            commit(offen.before);
        };
        const schreiberUmformen = (felder) => {
            if (!schreiber)
                return false;
            const platz = schreiber.ziel ? platzVon(schreiber.ziel) : -1;
            if (platz >= 0) {
                const alt = marks[platz];
                if (alt?.gesperrt)
                    return false;
                ersetze(platz, { ...alt, ...felder });
            }
            else
                schreiber.entwurf = { ...schreiber.entwurf, ...felder };
            schreiberLegen();
            return true;
        };
        const schreiberOeffnen = (point, targetId = '') => {
            schreiberSchliessen();
            const raum = flaeche.parentElement;
            if (!raum) {
                void editText(point, targetId);
                return;
            }
            const platz = targetId ? platzVon(targetId) : -1;
            const vorhanden = platz >= 0 && marks[platz]?.art === 'text' ? marks[platz] : null;
            if (vorhanden?.gesperrt) {
                UI.toast('Diese Marke ist gesperrt — erst entsperren.');
                return;
            }
            const before = snapshot();
            let entwurf = vorhanden;
            if (!vorhanden) {
                const x = Math.round(Math.max(0, Math.min(point[0] ?? 0, breite - 120)) * 100) / 100;
                const y = Math.round(Math.max(0, Math.min(point[1] ?? 0, hoehe - 40)) * 100) / 100;
                const breiteBox = Math.max(120, Math.min(Math.round(breite * 0.4), Math.round(breite - x - 8)));
                entwurf = { id: frischeId(), art: 'text', point: [x, y], text: '', farbe: color,
                    fontSize: schrift.groesse, breiteBox, schrift: schrift.familie, fett: schrift.fett,
                    rahmen: schrift.rahmen,
                    ...(schrift.ausricht !== 'links' ? { ausricht: schrift.ausricht } : {}) };
            }
            const feld = document.createElement('div');
            feld.className = 'blatt-schreiber';
            feld.contentEditable = 'true';
            feld.setAttribute('role', 'textbox');
            feld.setAttribute('aria-multiline', 'true');
            feld.setAttribute('aria-label', vorhanden ? 'Text bearbeiten' : 'Text schreiben');
            feld.spellcheck = false;
            if (vorhanden)
                feldFuellen(feld, vorhanden);
            raum.appendChild(feld);
            if (vorhanden)
                nodeFor(idOf(vorhanden))?.setAttribute('data-schreibt', '1');
            let beobachter = null;
            try {
                beobachter = new ResizeObserver(() => schreiberLegen());
                beobachter.observe(flaeche);
            }
            catch {
                beobachter = null;
            }
            schreiber = { feld, ziel: vorhanden ? idOf(vorhanden) : '', before, entwurf, beobachter };
            schreiberLegen();
            feld.addEventListener('input', scheduleWriterLayout);
            feld.addEventListener('paste', event => {
                event.preventDefault();
                const roh = event.clipboardData?.getData('text/plain') || '';
                if (roh)
                    document.execCommand('insertText', false, roh);
            });
            feld.addEventListener('drop', event => event.preventDefault());
            const LEISTEN = '.blatt-werk, .document-drawingbar, .document-dock, .document-stage,'
                + ' [data-act], [data-wz], [data-document-action], [data-document-tool]';
            feld.addEventListener('blur', event => {
                const ziel = event.relatedTarget;
                const selection = getSelection();
                writerRange = selection?.rangeCount && feld.contains(selection.getRangeAt(0).commonAncestorContainer)
                    ? selection.getRangeAt(0).cloneRange() : null;
                if (ziel?.closest('.blatt-color-panel, .blatt-popover:has(.blatt-color-panel)'))
                    return;
                if (ziel && typeof ziel.closest === 'function' && ziel.closest(LEISTEN)) {
                    setTimeout(() => {
                        if (schreiber && schreiber.feld === feld && feld.isConnected
                            && !document.querySelector('.blatt-color-panel'))
                            resumeWriting();
                    }, 0);
                    return;
                }
                schreiberSchliessen();
            });
            feld.addEventListener('keydown', event => {
                if (event.isComposing) {
                    event.stopPropagation();
                    return;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    schreiberSchliessen();
                    return;
                }
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    schreiberSchliessen();
                    return;
                }
                event.stopPropagation();
            });
            feld.focus({ preventScroll: true });
            try {
                const bereich = document.createRange();
                bereich.selectNodeContents(feld);
                bereich.collapse(false);
                const wahl = getSelection();
                wahl?.removeAllRanges();
                wahl?.addRange(bereich);
            }
            catch { }
        };
        const editText = async (point, targetId = '') => {
            const current = targetId ? marks.find(mark => idOf(mark) === targetId && mark.art === 'text') : null;
            if (current?.gesperrt) {
                UI.toast('Diese Marke ist gesperrt — erst entsperren.');
                return;
            }
            const answer = await Dialog.mehrzeilig(current ? 'Text bearbeiten' : 'Text', current ? String(current.text || '') : '');
            if (answer === null || (!current && !answer.trim()))
                return;
            const before = snapshot();
            if (current) {
                if (!answer.trim())
                    marks.splice(marks.indexOf(current), 1);
                else
                    ersetze(marks.indexOf(current), { ...current, text: answer });
            }
            else {
                const x = Math.round(Math.max(0, Math.min(point[0] ?? 0, breite - 120)) * 100) / 100;
                const y = Math.round(Math.max(0, Math.min(point[1] ?? 0, hoehe - 40)) * 100) / 100;
                const breiteBox = Math.max(120, Math.min(Math.round(breite * 0.4), Math.round(breite - x - 8)));
                marks.push({ id: frischeId(), art: 'text', point: [x, y], text: answer, farbe: color,
                    fontSize: schrift.groesse, breiteBox, schrift: schrift.familie, fett: schrift.fett,
                    rahmen: schrift.rahmen,
                    ...(schrift.ausricht !== 'links' ? { ausricht: schrift.ausricht } : {}) });
            }
            redraw();
            commit(before);
        };
        const grundFarbeBei = (x, y) => {
            try {
                const raum = flaeche.parentElement;
                const bild = raum?.querySelector('img.pdfs-bild');
                if (!bild || !bild.naturalWidth || !bild.naturalHeight)
                    return '#ffffff';
                const px = Math.round((x / breite) * bild.naturalWidth);
                const py = Math.round((Math.max(0, y - 2) / hoehe) * bild.naturalHeight);
                const leinwand = document.createElement('canvas');
                leinwand.width = 1;
                leinwand.height = 1;
                const stift = leinwand.getContext('2d', { willReadFrequently: true });
                if (!stift)
                    return '#ffffff';
                stift.drawImage(bild, px, py, 1, 1, 0, 0, 1, 1);
                const d = stift.getImageData(0, 0, 1, 1).data;
                const hex = (n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
                return '#' + hex(d[0] ?? 255) + hex(d[1] ?? 255) + hex(d[2] ?? 255);
            }
            catch {
                return '#ffffff';
            }
        };
        const textAendern = async (point, targetId = '') => {
            const platz = targetId
                ? marks.findIndex(mark => idOf(mark) === targetId && mark.art === 'textfix') : -1;
            const vorhanden = platz >= 0 ? marks[platz] : null;
            if (vorhanden?.gesperrt) {
                UI.toast('Diese Änderung ist gesperrt — erst entsperren.');
                return;
            }
            if (vorhanden) {
                const neu = await Dialog.mehrzeilig('Geänderte Stelle — im Original stand „' + String(vorhanden.alt || '') + '"', String(vorhanden.text || ''));
                if (neu === null)
                    return;
                const before = snapshot();
                ersetze(platz, { ...vorhanden, text: neu });
                redraw();
                commit(before);
                return;
            }
            if (block?.type !== 'pdfseite' || !block?.quelleId) {
                UI.toast('Das geht nur auf einer PDF-Seite — ein leeres Blatt hat keinen Text zum Ändern.');
                return;
            }
            if (typeof PdfLeser === 'undefined' || typeof PdfLeser.stueckBei !== 'function') {
                UI.toast('Der PDF-Leser fehlt — ohne ihn gibt es keine Textebene.');
                return;
            }
            const st = await PdfLeser.stueckBei(block, point[0] ?? 0, point[1] ?? 0, 3);
            if (!st) {
                UI.toast('An dieser Stelle findet sich kein PDF-Text. '
                    + 'Bei einem Scan ohne Texterkennung gibt es keinen.');
                return;
            }
            const neu = await Dialog.mehrzeilig('Diese Stelle ändern', String(st.s || ''));
            if (neu === null)
                return;
            if (neu === String(st.s || ''))
                return;
            const before = snapshot();
            marks.push({
                id: frischeId(), art: 'textfix',
                kasten: { x: st.x, y: st.y, w: st.w, h: st.h },
                alt: String(st.s || ''), text: neu,
                farbe: '#000000',
                grund: grundFarbeBei(st.x, st.y),
                schrift: schrift.familie, fett: schrift.fett
            });
            redraw();
            commit(before);
        };
        const setzeZeichen = async (point, targetId = '') => {
            const vorhanden = targetId
                ? marks.find(mark => idOf(mark) === targetId && mark.art === 'zeichen') : null;
            if (vorhanden?.gesperrt) {
                UI.toast('Dieses Zeichen ist gesperrt — erst entsperren.');
                return;
            }
            if (vorhanden) {
                const before = snapshot();
                ersetze(marks.indexOf(vorhanden), { ...vorhanden, drehung: ((Number(vorhanden.drehung) || 0) + 90) % 360 });
                redraw();
                commit(before);
                return;
            }
            const gewaehlt = await zeichenWaehlen();
            if (!gewaehlt)
                return;
            const before = snapshot();
            marks.push({
                id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
                art: 'zeichen', zeichenId: gewaehlt, point,
                groesse: letzteGroesse, drehung: 0, gespiegelt: false, farbe: color
            });
            redraw();
            commit(before);
        };
        const setzeElement = async (point) => {
            if (!letztesElement || !elementHolen(letztesElement)) {
                const gewaehlt = await elementWaehlen();
                if (!gewaehlt)
                    return;
                letztesElement = gewaehlt;
                notifyState();
            }
            const neue = elementMarken(letztesElement, point[0] ?? 0, point[1] ?? 0);
            if (!neue.length) {
                letztesElement = '';
                notifyState();
                UI.toast('Dieses Element gibt es nicht mehr.');
                return;
            }
            const before = snapshot();
            marks.push(...neue);
            neue.forEach(mark => {
                const node = zeichneMarke(mark);
                if (node) {
                    flaeche.appendChild(node);
                    merke(mark);
                }
            });
            commit(before);
        };
        const elementAusAuswahl = (name) => elementSichern(name, marks.filter(mark => selection.has(idOf(mark))));
        let letztesZeichen = '';
        let letzteGroesse = 64;
        const zeichenWaehlen = () => new Promise(fertig => {
            if (typeof Planflaeche === 'undefined' || typeof Register === 'undefined'
                || !Register.fachzeichen) {
                fertig('');
                return;
            }
            const o = document.createElement('div');
            o.className = 'overlay';
            o.innerHTML = '<div class="finder" style="width:min(560px,94vw)">' +
                '<div class="fh">Fachzeichen setzen' +
                '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
                '<div class="mz-suche"><input type="search" placeholder="Symbol suchen …" ' +
                'aria-label="Symbol suchen"></div>' +
                '<div class="mz-groesse"><label>Grösse' +
                `<input type="range" min="24" max="180" step="4" value="${letzteGroesse}" ` +
                'aria-label="Grösse des Zeichens"></label>' +
                `<b>${letzteGroesse} px</b></div>` +
                (letztesZeichen
                    ? '<div class="mz-zuletzt"><span>Zuletzt</span>' +
                        `<button data-sym="${letztesZeichen}">` +
                        Register.fachzeichen.alsSvg(letztesZeichen, { farbe: 'currentColor' }) +
                        `<i>${(Register.fachzeichen.holen(letztesZeichen) || { name: '' }).name}</i>` +
                        '</button></div>'
                    : '') +
                '<div class="mz-liste">' + Planflaeche.paletteHtml('installationsplan', '') + '</div>' +
                '</div>';
            document.body.appendChild(o);
            const zu = (wert) => { o.remove(); fertig(wert); };
            o.addEventListener('input', e => {
                const f = e.target;
                if (f.type === 'search') {
                    const liste = o.querySelector('.mz-liste');
                    if (liste)
                        liste.innerHTML = Planflaeche.paletteHtml('installationsplan', f.value);
                    return;
                }
                if (f.type === 'range') {
                    letzteGroesse = Number(f.value) || 64;
                    const marke = o.querySelector('.mz-groesse b');
                    if (marke)
                        marke.textContent = letzteGroesse + ' px';
                }
            });
            o.addEventListener('click', e => {
                const sym = e.target.closest('[data-sym]');
                if (sym && sym.dataset.sym) {
                    letztesZeichen = sym.dataset.sym;
                    zu(sym.dataset.sym);
                    return;
                }
                const b = e.target.closest('[data-a]');
                if (e.target === o || (b && b.dataset.a === 'zu'))
                    zu('');
            });
            const feld = o.querySelector('input[type=search]');
            feld?.focus();
        });
        flaeche.addEventListener('dblclick', (event) => {
            if (tool === 'schreiben' || tool === 'radierer')
                return;
            const ziel = event.target?.closest?.('[data-sid]');
            let id = ziel?.getAttribute('data-sid') || '';
            if (!id && selection.size === 1)
                id = [...selection][0] || '';
            if (!id) {
                if (tool !== 'select')
                    return;
                const punkt = R.zuBlatt(flaeche, event);
                if (!punkt)
                    return;
                event.preventDefault();
                schreiberOeffnen(punkt, '');
                return;
            }
            const platz = platzVon(id);
            if (platz < 0 || marks[platz]?.art !== 'text')
                return;
            event.preventDefault();
            schreiberOeffnen([0, 0], id);
        });
        flaeche.addEventListener('pointerdown', (event) => {
            const e = event;
            if (schreiber)
                schreiberSchliessen();
            if (typeof Zeichenziel !== 'undefined') {
                try {
                    Zeichenziel.beruehrt(steuerung);
                }
                catch { }
            }
            if (e.pointerType === 'pen')
                stiftGesehen();
            if (tool === 'schreiben')
                return;
            if (e.pointerType === 'touch' && !e.isPrimary) {
                if (running && running.zeigerArt === 'touch')
                    verwerfen();
                return;
            }
            if (!e.isPrimary)
                return;
            if (fingerGesperrt(e)) {
                const center = flaeche.closest('.document-center');
                if (center && !running && aktiverZeiger === null) {
                    fingerPan = { id: e.pointerId, x: e.clientX, y: e.clientY, left: center.scrollLeft, top: center.scrollTop, center };
                    event.preventDefault();
                    try {
                        flaeche.setPointerCapture(e.pointerId);
                    }
                    catch { }
                }
                return;
            }
            if (e.pointerType === 'pen' && running && running.zeigerArt === 'touch')
                verwerfen();
            if (e.pointerType === 'pen')
                fingerPan = null;
            if (aktiverZeiger !== null && aktiverZeiger !== e.pointerId) {
                if (Date.now() - zeigerZuletzt < VERWAIST_MS)
                    return;
                finish();
                renderSelection();
            }
            const stiftRadiert = e.pointerType === 'pen' &&
                (e.button === 5 || e.button === 2 || (e.buttons & 32) !== 0);
            if (e.button !== 0 && !stiftRadiert)
                return;
            const rawPoint = R.zuBlatt(flaeche, e);
            if (!rawPoint)
                return;
            const point = ruler.begin(rawPoint, !stiftRadiert && ['stift', 'marker', 'line', 'arrow'].includes(tool));
            event.preventDefault();
            aktiverZeiger = e.pointerId;
            zeigerZuletzt = Date.now();
            flaeche.focus({ preventScroll: true });
            const target = event.target?.closest?.('[data-sid]');
            const targetId = target?.getAttribute('data-sid') || '';
            if (tool === 'laser' && !stiftRadiert) {
                laserAn(point);
                return;
            }
            if (tool === 'radierer' || stiftRadiert) {
                radierStrich = { before: snapshot(), geaendert: false, letzter: point, kreis: null };
                const kreis = svg('circle', { cx: point[0], cy: point[1], r: radierRadius(),
                    class: 'blatt-radierkreis', 'data-ink-ui': 'radierer' });
                flaeche.appendChild(kreis);
                radierStrich.kreis = kreis;
                const getroffen = (targetId && radiereMarke(targetId, point)) || radiereBei(point);
                if (getroffen)
                    radierStrich.geaendert = true;
                try {
                    flaeche.setPointerCapture(event.pointerId);
                }
                catch { }
                return;
            }
            if (tool === 'text') {
                schreiberOeffnen(point, targetId);
                return;
            }
            if (tool === 'zettel' && targetId &&
                marks.some(mark => idOf(mark) === targetId && mark.art === 'zettel')) {
                void zettelText(targetId);
                return;
            }
            if (tool === 'textfix') {
                void textAendern(point, targetId);
                return;
            }
            if (tool === 'zeichen') {
                void setzeZeichen(point, targetId);
                return;
            }
            if (tool === 'elemente') {
                void setzeElement(point);
                return;
            }
            if (tool === 'bild') {
                void bildEinfuegen(point);
                return;
            }
            if (tool === 'select') {
                const griff = event.target?.closest?.('[data-griff]');
                if (griff && selection.size && griff.getAttribute('data-griff') === 'dreh') {
                    const kasten = auswahlKasten();
                    const mitte = [kasten.x + kasten.width / 2, kasten.y + kasten.height / 2];
                    selectDrag = { mode: 'rotate', start: point, mitte, before: snapshot(), moved: false,
                        winkel0: Math.atan2(point[1] - mitte[1], point[0] - mitte[0]),
                        originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
                    try {
                        flaeche.setPointerCapture(event.pointerId);
                    }
                    catch { }
                    return;
                }
                if (griff && selection.size === 1 && griff.getAttribute('data-griff') === 'kurve') {
                    selectDrag = { mode: 'kurve', start: point, before: snapshot(), moved: false,
                        originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
                    try {
                        flaeche.setPointerCapture(event.pointerId);
                    }
                    catch { }
                    return;
                }
                if (griff && selection.size) {
                    const kasten = auswahlKasten();
                    const achse = auswahlAchse();
                    const ecke = String(griff.getAttribute('data-griff') || 'se');
                    const eckeIm = [
                        ecke.includes('e') ? kasten.x : kasten.x + kasten.width,
                        ecke.includes('s') ? kasten.y : kasten.y + kasten.height
                    ];
                    const mitteIm = [kasten.x + kasten.width / 2, kasten.y + kasten.height / 2];
                    const anker = achse ? InkGeometry.drehePunkte([eckeIm], mitteIm, achse)[0] : eckeIm;
                    selectDrag = { mode: 'scale', start: point, anker, achse, before: snapshot(), moved: false,
                        originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
                    try {
                        flaeche.setPointerCapture(event.pointerId);
                    }
                    catch { }
                    return;
                }
                if (targetId) {
                    if (event.shiftKey)
                        selection.has(targetId) ? selection.delete(targetId) : selection.add(targetId);
                    else if (!selection.has(targetId))
                        selection = new Set([targetId]);
                    renderSelection();
                    if (!selection.has(targetId))
                        return;
                    selectDrag = { mode: 'move', start: point, before: snapshot(), moved: false,
                        originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
                }
                else {
                    const warLeer = !selection.size;
                    if (!event.shiftKey) {
                        selection.clear();
                        renderSelection();
                    }
                    selectDrag = { mode: 'lasso', pts: [point], add: event.shiftKey, warLeer };
                    const schlinge = svg('path', { d: `M${point[0]} ${point[1]}`,
                        class: 'blatt-auswahlfeld', 'data-ink-ui': 'box' });
                    flaeche.appendChild(schlinge);
                }
                try {
                    flaeche.setPointerCapture(event.pointerId);
                }
                catch { }
                return;
            }
            beforeRunning = snapshot();
            const id = typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1);
            if (tool === 'stift' || tool === 'marker') {
                running = { id, art: tool, farbe: tool === 'marker' && color === FARBEN[0] ? TEXTMARKER_FARBE : color,
                    breite: width, pts: [point], pressure: [], zeigerArt: e.pointerType };
                if (tool === 'stift' && stil !== 'kugel')
                    running.stil = stil;
                if (tool === 'marker' && markerSpitzeLesen() === 'keil')
                    running.stil = 'keil';
                rohZeiten = [];
                sensorVerlauf = [];
                tempoJetzt = 0;
                tempoMessen = tool === 'stift' && eileVon(String(running.stil || '')) > 0 ? InkStroke.tempoMesser() : null;
                if (tempoMessen) {
                    tempoMessen(point, 16);
                    running.tempo = [0];
                }
                if (tool === 'stift' && stil === 'leiter') {
                    const ader = leiterVon(leiterJetzt()) || LEITER[0];
                    running.stil = ader.stil;
                    running.leiter = ader.id;
                }
                running.neigung = [neigungAus(e)];
                sensorZuletzt = null;
                running.pressure.push(druckAus(event, point));
                if (sensorZuletzt !== null)
                    sensorVerlauf.push(sensorZuletzt);
                breiteAb = 0;
                breiteFestlegen(Number(e.timeStamp) || 0);
                const p0 = running.pressure[0];
                glatt = InkStroke.glaetter(point);
                handSmoother = InkStroke.glaetter(point, false);
                handRestFrom = 0;
                rohLetzter = null;
                rohDrei = [point];
                druckGlatt = InkStroke.druckGlaetter(p0);
                letzteZeit = Number(event.timeStamp) || 0;
                feder = new InkStroke.Feder();
                wegNass = 0;
                feder.punkt(point, halbeBreite(running, p0) * nassSpitze());
                nassFlaeche = false;
                runningNode = zeichneMarke({ ...running, pts: [point, point], pressure: [p0, p0],
                    ...(running.tempo ? { tempo: [0, 0] } : {}) });
            }
            else {
                const flaechenFarbe = tool === 'zettel' && color === FARBEN[0]
                    ? MARKER_FARBE : color;
                running = { id, art: tool, farbe: flaechenFarbe, breite: width, pts: [point, point], zeigerArt: e.pointerType };
                runningNode = zeichneMarke(running);
            }
            if (runningNode)
                flaeche.appendChild(runningNode);
            try {
                flaeche.setPointerCapture(event.pointerId);
            }
            catch { }
        });
        const eraseTo = (point) => {
            if (!radierStrich)
                return;
            const vx = radierStrich.letzter[0] ?? 0, vy = radierStrich.letzter[1] ?? 0;
            const px = point[0] ?? 0, py = point[1] ?? 0;
            const abstand = Math.hypot(px - vx, py - vy);
            if (abstand < 0.001)
                return;
            const n = Math.max(1, Math.ceil(abstand / Math.max(1, radierRadius() / 2)));
            for (let i = 1; i <= n; i++) {
                const zw = [vx + (px - vx) * i / n, vy + (py - vy) * i / n];
                if (radiereBei(zw))
                    radierStrich.geaendert = true;
            }
            radierStrich.letzter = point;
            radierStrich.kreis?.setAttribute('cx', String(point[0]));
            radierStrich.kreis?.setAttribute('cy', String(point[1]));
        };
        const eraseSamples = (event) => {
            const convert = R.umrechner(flaeche);
            const samples = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
            for (const sample of samples) {
                const point = convert(sample);
                if (point)
                    eraseTo(point);
            }
            const last = samples[samples.length - 1];
            if (!last || last.clientX !== event.clientX || last.clientY !== event.clientY) {
                const point = convert(event);
                if (point)
                    eraseTo(point);
            }
        };
        flaeche.addEventListener('pointermove', (event) => {
            if (fingerPan && fingerPan.id === event.pointerId) {
                event.preventDefault();
                fingerPan.center.scrollLeft = fingerPan.left + fingerPan.x - event.clientX;
                fingerPan.center.scrollTop = fingerPan.top + fingerPan.y - event.clientY;
                return;
            }
            if (!event.isPrimary)
                return;
            if (event.pointerType === 'pen')
                stiftGesehen();
            if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger)
                return;
            zeigerZuletzt = Date.now();
            if (laserZug) {
                const q = R.zuBlatt(flaeche, event);
                if (q)
                    laserZeigen(q);
                return;
            }
            if (!radierStrich && !selectDrag && running
                && (running.art === 'stift' || running.art === 'marker')) {
                const um = R.umrechner(flaeche);
                InkStroke.samples(event).forEach(e => addSample(e, um));
                nassenSchwanz(event, um);
                bildAnfordern();
                return;
            }
            if (radierStrich) {
                eraseSamples(event);
                return;
            }
            const point = R.zuBlatt(flaeche, event);
            if (!point)
                return;
            if (selectDrag) {
                selectDrag.end = point;
                if (selectDrag.mode === 'move') {
                    const dx = point[0] - selectDrag.start[0];
                    const dy = point[1] - selectDrag.start[1];
                    selectDrag.moved = selectDrag.moved || Math.hypot(dx, dy) > 0.5;
                    for (const id of selection) {
                        const index = marks.findIndex(mark => idOf(mark) === id);
                        const original = selectDrag.originals.get(id);
                        if (index < 0 || !original || original.gesperrt)
                            continue;
                        marks[index] = InkGeometry.move(clone(original), dx, dy);
                        updateNode(nodeFor(id), marks[index]);
                        merke(marks[index]);
                    }
                    renderSelection();
                }
                else if (selectDrag.mode === 'scale') {
                    const [ax, ay] = selectDrag.anker;
                    const achse = Number(selectDrag.achse) || 0;
                    const imKasten = (q) => achse
                        ? InkGeometry.drehePunkte([[q[0] ?? 0, q[1] ?? 0]], [ax, ay], -achse)[0]
                        : [q[0] ?? 0, q[1] ?? 0];
                    const von = imKasten(selectDrag.start), nach = imKasten(point);
                    const dx0 = von[0] - ax, dy0 = von[1] - ay;
                    let sx = Math.abs(dx0) < 1 ? 1 : (nach[0] - ax) / dx0;
                    let sy = Math.abs(dy0) < 1 ? 1 : (nach[1] - ay) / dy0;
                    const bildDabei = [...selection].some(id => marks.find(mark => idOf(mark) === id)?.art === 'bild');
                    if (event.shiftKey !== bildDabei) {
                        const s = (Math.abs(sx) + Math.abs(sy)) / 2;
                        sx = s;
                        sy = s;
                    }
                    sx = Math.max(0.05, Math.min(50, sx));
                    sy = Math.max(0.05, Math.min(50, sy));
                    selectDrag.moved = selectDrag.moved || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
                    for (const id of selection) {
                        const index = marks.findIndex(mark => idOf(mark) === id);
                        const original = selectDrag.originals.get(id);
                        if (index < 0 || !original || original.gesperrt)
                            continue;
                        marks[index] = InkGeometry.scale(clone(original), [ax, ay], sx, sy, achse);
                        updateNode(nodeFor(id), marks[index]);
                        merke(marks[index]);
                    }
                    renderSelection();
                }
                else if (selectDrag.mode === 'kurve') {
                    const id = String([...selection][0] ?? '');
                    const index = marks.findIndex(mark => idOf(mark) === id);
                    const original = selectDrag.originals.get(id);
                    if (index >= 0 && original && !original.gesperrt) {
                        const grad = InkGeometry.drehung(original);
                        const b = InkGeometry.boundsLokal(original);
                        const mitte = [b.x + b.width / 2, b.y + b.height / 2];
                        const lokal = grad ? InkGeometry.drehePunkte([[point[0], point[1]]], mitte, -grad)[0] : point;
                        const neu = clone(original);
                        const pts = InkGeometry.points(neu.pts);
                        neu.pts = [pts[0], pts[1], [Math.round(lokal[0] * 100) / 100, Math.round(lokal[1] * 100) / 100]];
                        marks[index] = neu;
                        selectDrag.moved = true;
                        updateNode(nodeFor(id), neu);
                        merke(neu);
                        renderSelection();
                    }
                }
                else if (selectDrag.mode === 'rotate') {
                    const [mx, my] = selectDrag.mitte;
                    let grad = (Math.atan2(point[1] - my, point[0] - mx) - selectDrag.winkel0) * 180 / Math.PI;
                    if (lineal || event.shiftKey)
                        grad = Math.round(grad / 15) * 15;
                    selectDrag.moved = selectDrag.moved || Math.abs(grad) > 0.5;
                    for (const id of selection) {
                        const index = marks.findIndex(mark => idOf(mark) === id);
                        const original = selectDrag.originals.get(id);
                        if (index < 0 || !original || original.gesperrt)
                            continue;
                        marks[index] = InkGeometry.rotate(clone(original), [mx, my], grad);
                        updateNode(nodeFor(id), marks[index]);
                        merke(marks[index]);
                    }
                    renderSelection();
                }
                else {
                    const pts = selectDrag.pts;
                    const last = pts[pts.length - 1];
                    if (Math.hypot(point[0] - (last[0] ?? 0), point[1] - (last[1] ?? 0)) >= 1)
                        pts.push(point);
                    const node = flaeche.querySelector('[data-ink-ui="box"]');
                    if (node)
                        node.setAttribute('d', pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ') + ' Z');
                }
                return;
            }
            if (!running)
                return;
            running.pts[1] = ruler.constrained() ? ruler.project(point) : lineal && (running.art === 'line' || running.art === 'arrow')
                ? rasten(running.pts[0], point) : point;
            runningNode = updateNode(runningNode, running);
        });
        const beiEnde = (event) => {
            if (fingerPan?.id === event.pointerId) {
                fingerPan = null;
                return;
            }
            if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger)
                return;
            if (laserZug) {
                laserAus();
                aktiverZeiger = null;
                return;
            }
            if (event.type === 'pointerup' && radierStrich)
                eraseSamples(event);
            if (event.type === 'pointerup' && running && (running.art === 'stift' || running.art === 'marker')) {
                const rawEnd = R.zuBlatt(flaeche, event);
                const end = rawEnd ? ruler.project(rawEnd) : null;
                if (end) {
                    const last = running.pts[running.pts.length - 1];
                    if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.01) {
                        running.pts.push(end);
                        running.pressure.push(running.pressure[running.pressure.length - 1] ?? 0.5);
                    }
                    rohLetzter = end;
                }
            }
            finish();
        };
        const beiAbbruch = (event) => {
            if (fingerPan?.id === event.pointerId) {
                fingerPan = null;
                return;
            }
            if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger)
                return;
            if (radierStrich) {
                const before = radierStrich.before;
                radierStrich.kreis?.remove();
                radierStrich = null;
                aktiverZeiger = null;
                marks.splice(0, marks.length, ...before);
                redraw();
                notifyState();
                return;
            }
            if (running && running.zeigerArt !== 'pen') {
                verwerfen();
                return;
            }
            beiEnde(event);
        };
        flaeche.addEventListener('pointerup', beiEnde);
        flaeche.addEventListener('pointercancel', beiAbbruch);
        const beiEndeGlobal = (event) => {
            if (aktiverZeiger === null || event.pointerId !== aktiverZeiger)
                return;
            if (event.target instanceof Node && flaeche.contains(event.target))
                return;
            if (event.type === 'pointercancel')
                beiAbbruch(event);
            else
                beiEnde(event);
        };
        if (typeof addEventListener === 'function') {
            addEventListener('pointerup', beiEndeGlobal, true);
            addEventListener('pointercancel', beiEndeGlobal, true);
        }
        flaeche.addEventListener('pointerleave', (event) => {
            if (!flaeche.hasPointerCapture(event.pointerId))
                beiEnde(event);
        });
        flaeche.addEventListener('contextmenu', event => { if (tool !== 'schreiben')
            event.preventDefault(); });
        flaeche.addEventListener('click', (event) => {
            if (tool !== 'schreiben')
                return;
            const verweis = event.target?.closest?.('[data-verweis]');
            if (verweis) {
                event.preventDefault();
                event.stopPropagation();
                const mark = marks.find(m => idOf(m) === verweis.getAttribute('data-sid'));
                if (mark)
                    verweisFolgen(mark);
                return;
            }
            const ziel = event.target?.closest?.('[data-ink-art="abdeck"]');
            if (!ziel)
                return;
            event.preventDefault();
            event.stopPropagation();
            const id = ziel.getAttribute('data-sid') || '';
            if (aufgedeckt.has(id))
                aufgedeckt.delete(id);
            else
                aufgedeckt.add(id);
            abdeckAnwenden();
        });
        flaeche.addEventListener('keydown', (event) => {
            const strg = event.ctrlKey || event.metaKey;
            const taste = event.key.toLowerCase();
            if ((event.key === 'Delete' || event.key === 'Backspace') && selection.size) {
                event.preventDefault();
                deleteSelection();
            }
            else if (strg && taste === 'z') {
                event.preventDefault();
                event.shiftKey ? redo() : undo();
            }
            else if (strg && taste === 'x' && selection.size) {
                event.preventDefault();
                cutSelection();
            }
            else if (strg && taste === 'c' && selection.size) {
                event.preventDefault();
                copySelection();
            }
            else if (strg && taste === 'v' && zwischenablage.length) {
                event.preventDefault();
                paste();
            }
            else if (event.key === 'Escape' && selection.size) {
                selection.clear();
                renderSelection();
            }
        });
        registerLayer({ flaeche, abschliessen: () => {
                const offen = !!schreiber;
                if (offen)
                    schreiberSchliessen();
                return finish() || offen;
            } });
        flaeche.style.pointerEvents = 'none';
        flaeche.setAttribute('tabindex', '-1');
        const setzeWerkzeug = (next) => {
            if (schreiber)
                schreiberSchliessen();
            finish();
            const vorher = werkzeugGruppe(tool);
            werkzeugwertMerken();
            tool = next;
            const nachher = werkzeugGruppe(next);
            if (nachher && nachher !== vorher) {
                letzteGruppe = nachher;
                const w = werkzeugwerteLesen()[nachher];
                if (w) {
                    if (w.farbe !== undefined)
                        color = w.farbe;
                    if (w.breite !== undefined)
                        width = w.breite;
                    if (typeof Zeichenziel !== 'undefined') {
                        try {
                            Zeichenziel.uebernehme(steuerung, next);
                            Zeichenziel.uebernehmeFarbe(steuerung, color);
                            Zeichenziel.uebernehmeStrich(steuerung, width);
                        }
                        catch { }
                    }
                }
            }
            if (tool !== 'select') {
                selection.clear();
                renderSelection();
            }
            flaeche.style.pointerEvents = tool === 'schreiben' ? 'none' : 'auto';
            flaeche.setAttribute('data-tool', tool);
            flaeche.setAttribute('tabindex', tool === 'schreiben' ? '-1' : '0');
        };
        const setzeFarbe = (next) => {
            color = next;
            werkzeugwertMerken();
            if (schreiber && schreiberUmformen({ farbe: next }))
                return;
            if (!selection.size)
                return;
            const before = snapshot();
            for (let i = 0; i < marks.length; i++) {
                const alt = marks[i];
                if (!selection.has(idOf(alt)) || alt.art === 'bild')
                    continue;
                const neu = { ...alt, farbe: next };
                marks[i] = neu;
                updateNode(nodeFor(idOf(neu)), neu);
                merke(neu);
            }
            commit(before);
        };
        const setzeStrich = (next) => {
            width = next;
            werkzeugwertMerken();
            if (!selection.size)
                return;
            const before = snapshot();
            for (let i = 0; i < marks.length; i++) {
                const alt = marks[i];
                if (!selection.has(idOf(alt)) || alt.breite === undefined || alt.gesperrt)
                    continue;
                const neu = { ...alt, breite: next };
                if (Number(alt.breiteFest) > 0 && Number(alt.breite) > 0)
                    neu.breiteFest = Math.round(Number(alt.breiteFest) * next / Number(alt.breite) * 100) / 100;
                marks[i] = neu;
                updateNode(nodeFor(idOf(neu)), neu);
                merke(neu);
            }
            renderSelection();
            commit(before);
        };
        const setzeStil = (next) => {
            if (!STIFTE.some(st => st.id === next))
                return;
            stil = next;
            if (typeof Store !== 'undefined')
                Store.setMeta('zeichnen:stift', next);
        };
        const stilVon = () => stil;
        const setzeSchrift = (aenderung) => {
            const schritt = Number(aenderung.schritt) || 0;
            schrift = {
                familie: aenderung.familie !== undefined && SCHRIFTEN.some(x => x.id === aenderung.familie)
                    ? String(aenderung.familie) : schrift.familie,
                groesse: schritt ? naechsteStufe(schrift.groesse, schritt)
                    : (aenderung.groesse !== undefined ? Math.max(8, Number(aenderung.groesse) || schrift.groesse) : schrift.groesse),
                fett: aenderung.fett !== undefined ? !!aenderung.fett : schrift.fett,
                rahmen: aenderung.rahmen !== undefined ? !!aenderung.rahmen : schrift.rahmen,
                ausricht: aenderung.ausricht !== undefined
                    && AUSRICHTUNGEN.some(x => x.id === aenderung.ausricht)
                    ? String(aenderung.ausricht) : schrift.ausricht
            };
            if (typeof Store !== 'undefined')
                Store.setMeta('zeichnen:schrift', schrift);
            if (schreiber) {
                const marke = schreiberMarke();
                const felder = {};
                if (schritt)
                    felder.fontSize = naechsteStufe(Math.max(8, Number(marke?.fontSize) || 18), schritt);
                else if (aenderung.groesse !== undefined)
                    felder.fontSize = schrift.groesse;
                if (aenderung.familie !== undefined)
                    felder.schrift = schrift.familie;
                if (aenderung.fett !== undefined)
                    felder.fett = schrift.fett;
                if (aenderung.rahmen !== undefined)
                    felder.rahmen = schrift.rahmen;
                if (aenderung.ausricht !== undefined)
                    felder.ausricht = schrift.ausricht;
                if (Object.keys(felder).length && schreiberUmformen(felder))
                    return;
            }
            if (!selection.size)
                return;
            const before = snapshot();
            let geaendert = false;
            for (let i = 0; i < marks.length; i++) {
                const alt = marks[i];
                if (!selection.has(idOf(alt)) || alt.art !== 'text' || alt.gesperrt)
                    continue;
                const neu = { ...alt };
                if (schritt)
                    neu.fontSize = naechsteStufe(Math.max(8, Number(alt.fontSize) || 18), schritt);
                else if (aenderung.groesse !== undefined)
                    neu.fontSize = schrift.groesse;
                if (aenderung.familie !== undefined)
                    neu.schrift = schrift.familie;
                if (aenderung.fett !== undefined)
                    neu.fett = schrift.fett;
                if (aenderung.rahmen !== undefined)
                    neu.rahmen = schrift.rahmen;
                if (aenderung.ausricht !== undefined)
                    neu.ausricht = schrift.ausricht;
                marks[i] = neu;
                updateNode(nodeFor(idOf(neu)), neu);
                geaendert = true;
            }
            if (geaendert) {
                renderSelection();
                commit(before);
            }
        };
        const schriftVon = () => ({ ...schrift });
        const setzeRadierModus = (next) => {
            if (!RADIERER.some(r => r.id === next))
                return;
            radierModus = next;
            if (typeof Store !== 'undefined')
                Store.setMeta('zeichnen:radierer', next);
        };
        const radierModusVon = () => radierModus;
        const beiAenderung = (listener) => {
            stateListeners.add(listener);
            listener(state());
            return () => stateListeners.delete(listener);
        };
        const setzeLineal = (an) => { lineal = !!an; ruler.setActive(lineal); };
        const linealAn = () => lineal;
        const setzeFormen = (an) => {
            formen = !!an;
            if (typeof Store !== 'undefined')
                Store.setMeta('zeichnen:formen', formen);
        };
        const formenAn = () => formen;
        const steuerung = { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, setzeStil, stilVon, setzeRadierModus, radierModusVon, copySelection, paste, marken: marks,
            undo, redo, deleteSelection, beiAenderung, state, setzeLineal, linealAn, setzeFormen, formenAn, bildEinfuegen,
            setzeSchrift, schriftVon, resumeWriting, finishWriting: schreiberSchliessen,
            cutSelection, nachVorn, nachHinten, sperren, gesperrtGewaehlt,
            verweisSetzen,
            elementAusAuswahl,
            elementGewaehlt: () => letztesElement,
            selectElement: (id) => { if (elementHolen(id)) {
                letztesElement = id;
                notifyState();
            } },
            setEraserSize: (radius) => {
                if (radius === 0) {
                    eraserSize = null;
                    return;
                }
                if (RADIER_GROESSEN.includes(radius))
                    eraserSize = radius;
            },
            eraserSize: () => radierRadius(),
            elementWaehlen: async () => {
                const gewaehlt = await elementWaehlen();
                if (gewaehlt) {
                    letztesElement = gewaehlt;
                    notifyState();
                }
                return gewaehlt;
            },
            setzeKritzel: (an) => {
                kritzel = !!an;
                if (typeof Store !== 'undefined') {
                    try {
                        Store.setMeta('zeichnen:kritzel', kritzel);
                    }
                    catch { }
                }
            },
            kritzelAn: () => kritzel };
        return steuerung;
    };
    const farbenRein = (roh) => {
        if (!Array.isArray(roh))
            return [];
        const rein = [];
        for (const eintrag of roh) {
            const wert = String(eintrag ?? '').toLowerCase();
            if (!/^#[0-9a-f]{6}$/.test(wert))
                continue;
            if (FARBEN.includes(wert))
                continue;
            if (rein.includes(wert))
                continue;
            rein.push(wert);
            if (rein.length >= HOECHSTENS_EIGENE_FARBEN)
                break;
        }
        return rein;
    };
    const farbenSetzen = (roh) => {
        const rein = farbenRein(roh);
        if (typeof Store !== 'undefined') {
            try {
                Store.setMeta('zeichnen:farben', rein);
            }
            catch { }
        }
        return rein;
    };
    const eigeneFarben = () => farbenRein(typeof Store === 'undefined' ? [] : Store.getMeta('zeichnen:farben'));
    const eigeneFarbeMerken = (wert) => farbenSetzen([wert, ...eigeneFarben()]);
    const satzName = (roh) => String(roh ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
    const farbsaetze = () => {
        if (typeof Store === 'undefined')
            return [];
        const roh = Store.getMeta('zeichnen:farbsaetze');
        if (!Array.isArray(roh))
            return [];
        const raus = [];
        for (const eintrag of roh) {
            const name = satzName(eintrag?.name);
            if (!name)
                continue;
            if (raus.some(s => s.name.toLowerCase() === name.toLowerCase()))
                continue;
            const satz = { name, farben: farbenRein(eintrag?.farben) };
            const stil = String(eintrag?.stil || '');
            if (STIFTE.some(st => st.id === stil))
                satz.stil = stil;
            const breite = Number(eintrag?.breite);
            if (Number.isFinite(breite) && breite > 0)
                satz.breite = breite;
            raus.push(satz);
            if (raus.length >= HOECHSTENS_FARBSAETZE)
                break;
        }
        return raus;
    };
    const farbsaetzeSchreiben = (liste) => {
        const rein = liste.slice(0, HOECHSTENS_FARBSAETZE);
        if (typeof Store !== 'undefined') {
            try {
                Store.setMeta('zeichnen:farbsaetze', rein);
            }
            catch { }
        }
        return rein;
    };
    const farbsatzSichern = (roh, farben = eigeneFarben(), stift) => {
        const name = satzName(roh);
        if (!name)
            return null;
        const liste = farbsaetze();
        const stelle = liste.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
        const satz = { name, farben: farbenRein(farben.slice()) };
        const stil = String(stift?.stil || '');
        if (STIFTE.some(st => st.id === stil))
            satz.stil = stil;
        const breite = Number(stift?.breite);
        if (Number.isFinite(breite) && breite > 0)
            satz.breite = breite;
        if (stelle >= 0) {
            liste[stelle] = satz;
            return farbsaetzeSchreiben(liste);
        }
        if (liste.length >= HOECHSTENS_FARBSAETZE)
            return null;
        return farbsaetzeSchreiben([...liste, satz]);
    };
    const farbsatzLoeschen = (roh) => {
        const name = satzName(roh).toLowerCase();
        return farbsaetzeSchreiben(farbsaetze().filter(s => s.name.toLowerCase() !== name));
    };
    const farbsatzLaden = (roh) => {
        const name = satzName(roh).toLowerCase();
        const satz = farbsaetze().find(s => s.name.toLowerCase() === name);
        if (!satz)
            return null;
        return { ...satz, farben: farbenSetzen(satz.farben) };
    };
    const farbenZuruecksetzen = () => farbenSetzen([]);
    const kurzeId = () => typeof Ids !== 'undefined' ? Ids.short(8) : 'e' + Math.random().toString(36).slice(2, 10);
    const elementName = (roh) => satzName(roh);
    const elemente = () => {
        if (typeof Store === 'undefined')
            return [];
        const roh = Store.getMeta('zeichnen:elemente');
        if (!Array.isArray(roh))
            return [];
        const raus = [];
        for (const eintrag of roh) {
            const name = elementName(eintrag?.name);
            const marken = eintrag?.marken;
            if (!name || !Array.isArray(marken) || !marken.length)
                continue;
            raus.push({
                id: String(eintrag?.id || kurzeId()),
                name,
                marken: marken.map(m => clone(m)),
                breite: Math.max(1, Number(eintrag?.breite) || 1),
                hoehe: Math.max(1, Number(eintrag?.hoehe) || 1)
            });
            if (raus.length >= HOECHSTENS_ELEMENTE)
                break;
        }
        return raus;
    };
    const elementeSchreiben = (liste) => {
        const rein = liste.slice(0, HOECHSTENS_ELEMENTE);
        if (typeof Store !== 'undefined') {
            try {
                Store.setMeta('zeichnen:elemente', rein);
            }
            catch { }
        }
        return rein;
    };
    const elementNormieren = (roh) => {
        const marken = (roh || []).filter(m => m && typeof m === 'object').map(m => clone(m));
        if (!marken.length)
            return null;
        const kasten = InkGeometry.union(marken.map(m => InkGeometry.bounds(m)));
        const verschoben = marken.map(m => {
            const kopie = InkGeometry.move(m, -kasten.x, -kasten.y);
            delete kopie.gesperrt;
            delete kopie.id;
            return kopie;
        });
        return { marken: verschoben, breite: Math.max(1, kasten.width), hoehe: Math.max(1, kasten.height) };
    };
    const elementSichern = (roh, marken) => {
        const name = elementName(roh);
        if (!name)
            return { ok: false, grund: 'Ein Element braucht einen Namen.' };
        const teil = elementNormieren(marken);
        if (!teil)
            return { ok: false, grund: 'Es ist nichts ausgewählt, das ein Element werden könnte.' };
        let gross = 0;
        try {
            gross = JSON.stringify(teil.marken).length;
        }
        catch {
            gross = HOECHSTENS_ELEMENT_BYTES + 1;
        }
        if (gross > HOECHSTENS_ELEMENT_BYTES) {
            return { ok: false, grund: 'Dieses Element ist zu gross (' + Math.round(gross / 1024) + ' KB von höchstens '
                    + Math.round(HOECHSTENS_ELEMENT_BYTES / 1024) + '). Elemente liegen bei den Einstellungen und reisen mit jeder Sicherung — wähle weniger Striche.' };
        }
        const liste = elemente();
        const element = { id: kurzeId(), name, ...teil };
        const stelle = liste.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
        if (stelle >= 0) {
            element.id = liste[stelle].id;
            liste[stelle] = element;
            return { ok: true, liste: elementeSchreiben(liste), element };
        }
        if (liste.length >= HOECHSTENS_ELEMENTE) {
            return { ok: false, grund: 'Es passen höchstens ' + HOECHSTENS_ELEMENTE + ' Elemente — lösche zuerst eines.' };
        }
        return { ok: true, liste: elementeSchreiben([...liste, element]), element };
    };
    const elementLoeschen = (id) => elementeSchreiben(elemente().filter(e => e.id !== String(id ?? '')));
    const elementHolen = (id) => elemente().find(e => e.id === String(id ?? '')) || null;
    const elementMarken = (id, x, y) => {
        const element = elementHolen(id);
        if (!element)
            return [];
        return element.marken.map(m => InkGeometry.move({ ...clone(m), id: kurzeId() }, x - element.breite / 2, y - element.hoehe / 2));
    };
    let letztesElement = '';
    const elementBild = (element, kante = 74) => {
        const box = document.createElementNS(NS, 'svg');
        const rand = 4;
        box.setAttribute('viewBox', `${-rand} ${-rand} ${element.breite + rand * 2} ${element.hoehe + rand * 2}`);
        box.setAttribute('width', String(kante));
        box.setAttribute('height', String(kante));
        box.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        box.setAttribute('aria-hidden', 'true');
        for (const mark of element.marken) {
            const node = zeichneMarke({ ...mark, id: kurzeId() });
            if (node)
                box.appendChild(node);
        }
        return box;
    };
    const elementWaehlen = () => new Promise(fertig => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const finder = document.createElement('div');
        finder.className = 'finder';
        finder.style.width = 'min(680px,94vw)';
        const kopf = document.createElement('div');
        kopf.className = 'fh';
        kopf.textContent = 'Elemente';
        const zu = document.createElement('button');
        zu.className = 'icon-btn';
        zu.dataset.a = 'zu';
        zu.setAttribute('aria-label', 'Schliessen');
        zu.textContent = '✕';
        kopf.appendChild(zu);
        finder.appendChild(kopf);
        const liste = document.createElement('div');
        liste.className = 'mz-liste elemente-liste';
        finder.appendChild(liste);
        o.appendChild(finder);
        const schliessen = (wert) => {
            o.remove();
            document.removeEventListener('keydown', beiTaste);
            fertig(wert);
        };
        const beiTaste = (e) => { if (e.key === 'Escape')
            schliessen(''); };
        const malen = () => {
            liste.textContent = '';
            const alle = elemente();
            if (!alle.length) {
                const leer = document.createElement('p');
                leer.className = 'elemente-leer';
                leer.textContent = 'Noch kein Element. Wähle auf dem Blatt etwas aus '
                    + '(Werkzeug «Auswahl») und tippe dort auf «Als Element».';
                liste.appendChild(leer);
                return;
            }
            for (const element of alle) {
                const fach = document.createElement('div');
                fach.className = 'elemente-fach';
                const kachel = document.createElement('button');
                kachel.className = 'elemente-kachel';
                kachel.dataset.el = element.id;
                kachel.title = element.name + ' setzen';
                kachel.appendChild(elementBild(element));
                const wort = document.createElement('i');
                wort.textContent = element.name;
                kachel.appendChild(wort);
                const weg = document.createElement('button');
                weg.className = 'elemente-weg';
                weg.dataset.weg = element.id;
                weg.setAttribute('aria-label', 'Element „' + element.name + '" löschen');
                weg.title = 'Element „' + element.name + '" löschen';
                weg.dataset.loeschknopf = '';
                weg.textContent = '🗑';
                fach.append(kachel, weg);
                liste.appendChild(fach);
            }
        };
        malen();
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel || ziel === o || ziel.closest('[data-a="zu"]')) {
                schliessen('');
                return;
            }
            const weg = ziel.closest('[data-weg]');
            if (weg) {
                elementLoeschen(weg.dataset.weg);
                if (letztesElement === weg.dataset.weg)
                    letztesElement = '';
                malen();
                return;
            }
            const kachel = ziel.closest('[data-el]');
            if (kachel)
                schliessen(String(kachel.dataset.el || ''));
        });
        document.addEventListener('keydown', beiTaste);
        document.body.appendChild(o);
        zu.focus();
    });
    const leisteEinrichten = () => new Promise(fertig => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const finder = document.createElement('div');
        finder.className = 'finder blatt-ordnen-feld';
        finder.style.width = 'min(560px,94vw)';
        const kopf = document.createElement('div');
        kopf.className = 'fh';
        kopf.textContent = 'Leiste einrichten';
        const zu = document.createElement('button');
        zu.className = 'icon-btn';
        zu.dataset.a = 'zu';
        zu.setAttribute('aria-label', 'Schliessen');
        zu.textContent = '✕';
        kopf.appendChild(zu);
        finder.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'blatt-ordnen-koerper';
        finder.appendChild(koerper);
        const sagen = document.createElement('p');
        sagen.className = 'blatt-ordnen-sagt';
        sagen.setAttribute('aria-live', 'polite');
        finder.appendChild(sagen);
        const fuss = document.createElement('div');
        fuss.className = 'blatt-ordnen-fuss';
        const zurueck = document.createElement('button');
        zurueck.className = 'blatt-ordnen-zurueck';
        zurueck.type = 'button';
        zurueck.textContent = 'Zurücksetzen';
        zurueck.title = 'Die ursprüngliche Reihenfolge wiederherstellen';
        const okay = document.createElement('button');
        okay.className = 'blatt-ordnen-fertig';
        okay.type = 'button';
        okay.textContent = 'Fertig';
        fuss.append(zurueck, okay);
        finder.appendChild(fuss);
        o.appendChild(finder);
        let jetzt = ordnungLesen();
        const anwenden = () => {
            ordnungMerken(jetzt);
            document.querySelectorAll('.blatt-werk').forEach(ordnungAnwenden);
        };
        const namen = (art, id) => art === 'werkzeuge'
            ? (WERKZEUGE.find(w => w.id === id)?.name || id)
            : (GRUPPEN.find(g => g.id === id)?.name || id);
        const ruecken = (art, id, schritt) => {
            const liste = jetzt[art];
            const i = liste.indexOf(id);
            const ziel = i + schritt;
            if (i < 0 || ziel < 0 || ziel >= liste.length)
                return;
            liste.splice(i, 1);
            liste.splice(ziel, 0, id);
            anwenden();
            malen();
            sagen.textContent = namen(art, id) + ' steht jetzt an Stelle ' + (ziel + 1)
                + ' von ' + liste.length + '.';
            koerper.querySelector(`[data-art="${art}"][data-id="${id}"] [data-ruecken="${schritt > 0 ? 'runter' : 'hoch'}"]`)?.focus();
        };
        let zieht = null;
        const beiZug = (e) => {
            if (!zieht)
                return;
            const unter = document.elementFromPoint(e.clientX, e.clientY);
            const zeile = unter instanceof Element ? unter.closest('.blatt-ordnen-zeile') : null;
            if (!zeile || zeile.dataset.art !== zieht.art)
                return;
            const ueber = String(zeile.dataset.id || '');
            if (!ueber || ueber === zieht.id)
                return;
            const liste = jetzt[zieht.art];
            const von = liste.indexOf(zieht.id);
            const nach = liste.indexOf(ueber);
            if (von < 0 || nach < 0)
                return;
            liste.splice(von, 1);
            liste.splice(nach, 0, zieht.id);
            anwenden();
            malen();
        };
        const zugEnde = () => {
            if (!zieht)
                return;
            sagen.textContent = namen(zieht.art, zieht.id) + ' abgelegt.';
            zieht = null;
            koerper.querySelectorAll('.blatt-ordnen-zeile.zieht').forEach(z => z.classList.remove('zieht'));
            window.removeEventListener('pointermove', beiZug);
            window.removeEventListener('pointerup', zugEnde);
            window.removeEventListener('pointercancel', zugEnde);
        };
        const malen = () => {
            koerper.textContent = '';
            const bloecke = [
                ['werkzeuge', 'Werkzeuge', 'Die Reihe oben in der Leiste.'],
                ['gruppen', 'Zubehör', 'Was unter dem gewählten Werkzeug steht — je Gruppe, nicht je Knopf.']
            ];
            for (const [art, titel, hinweis] of bloecke) {
                const block = document.createElement('section');
                block.className = 'blatt-ordnen-block';
                const h = document.createElement('h3');
                h.textContent = titel;
                const p = document.createElement('p');
                p.textContent = hinweis;
                block.append(h, p);
                const liste = document.createElement('ul');
                liste.className = 'blatt-ordnen-liste';
                jetzt[art].forEach((id, i, alle) => {
                    const zeile = document.createElement('li');
                    zeile.className = 'blatt-ordnen-zeile';
                    zeile.dataset.art = art;
                    zeile.dataset.id = id;
                    const nr = document.createElement('i');
                    nr.className = 'blatt-ordnen-nr';
                    nr.textContent = String(i + 1);
                    const wort = document.createElement('b');
                    wort.textContent = namen(art, id);
                    const hoch = document.createElement('button');
                    hoch.type = 'button';
                    hoch.className = 'blatt-ordnen-pfeil';
                    hoch.dataset.ruecken = 'hoch';
                    hoch.textContent = '↑';
                    hoch.disabled = i === 0;
                    hoch.setAttribute('aria-label', namen(art, id) + ' nach vorn');
                    const runter = document.createElement('button');
                    runter.type = 'button';
                    runter.className = 'blatt-ordnen-pfeil';
                    runter.dataset.ruecken = 'runter';
                    runter.textContent = '↓';
                    runter.disabled = i === alle.length - 1;
                    runter.setAttribute('aria-label', namen(art, id) + ' nach hinten');
                    zeile.append(nr, wort, hoch, runter);
                    liste.appendChild(zeile);
                });
                block.appendChild(liste);
                koerper.appendChild(block);
            }
        };
        malen();
        koerper.addEventListener('pointerdown', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel || ziel.closest('.blatt-ordnen-pfeil'))
                return;
            const zeile = ziel.closest('.blatt-ordnen-zeile');
            if (!zeile)
                return;
            zieht = { art: zeile.dataset.art, id: String(zeile.dataset.id || '') };
            zeile.classList.add('zieht');
            window.addEventListener('pointermove', beiZug);
            window.addEventListener('pointerup', zugEnde);
            window.addEventListener('pointercancel', zugEnde);
        });
        koerper.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const pfeil = ziel?.closest('.blatt-ordnen-pfeil');
            if (!pfeil)
                return;
            const zeile = pfeil.closest('.blatt-ordnen-zeile');
            if (!zeile)
                return;
            ruecken(zeile.dataset.art, String(zeile.dataset.id || ''), pfeil.dataset.ruecken === 'runter' ? 1 : -1);
        });
        zurueck.addEventListener('click', () => {
            ordnungVergessen();
            jetzt = ordnungLesen();
            document.querySelectorAll('.blatt-werk').forEach(ordnungAnwenden);
            malen();
            sagen.textContent = 'Die ursprüngliche Reihenfolge steht wieder.';
        });
        const schliessen = () => {
            zugEnde();
            o.remove();
            document.removeEventListener('keydown', beiTaste);
            fertig();
        };
        const beiTaste = (e) => { if (e.key === 'Escape')
            schliessen(); };
        okay.addEventListener('click', schliessen);
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel || ziel === o || ziel.closest('[data-a="zu"]'))
                schliessen();
        });
        document.addEventListener('keydown', beiTaste);
        document.body.appendChild(o);
        okay.focus();
    });
    const leiste = (controls, extra = '') => {
        let formArt = formArtLesen();
        if (typeof Zeichenziel !== 'undefined') {
            try {
                Zeichenziel.melde(controls, 'Zeichenfläche');
                Zeichenziel.uebernehmeFarbe(controls, FARBEN[0]);
                Zeichenziel.uebernehmeStrich(controls, BREITEN[1]);
            }
            catch { }
        }
        const row = document.createElement('div');
        row.className = 'blatt-reihe';
        row.dataset.lage = lageJetzt();
        if (row.dataset.lage === 'frei') {
            const punkt = freiJetzt();
            row.style.setProperty('--leiste-x', punkt.x);
            row.style.setProperty('--leiste-y', punkt.y);
        }
        queueMicrotask(() => { try {
            leisteEinordnen(row);
        }
        catch { } });
        const tools = document.createElement('div');
        tools.className = 'blatt-werk';
        tools.dataset.tool = 'schreiben';
        const zumWerkzeugRollen = (wz) => {
            if (!window.matchMedia || !window.matchMedia('(max-width:760px)').matches)
                return;
            const knopf = tools.querySelector(`[data-wz="${wz}"]`);
            if (knopf)
                tools.scrollLeft = Math.max(0, knopf.offsetLeft - 6);
        };
        const button = (tool) => {
            const w = WERKZEUGE.find(x => x.id === tool);
            const sym = w.sym;
            const bild = sym
                ? `<span class="zeichen" data-sym="${sym}" aria-hidden="true"></span>`
                : `<span class="zeichen" aria-hidden="true">${w.zeichen}</span>`;
            return `<button data-wz="${w.id}"${w.id === 'schreiben' ? ' class="on"' : ''} ` +
                `aria-pressed="${w.id === 'schreiben' ? 'true' : 'false'}" title="${w.titel}">` +
                bild + `<span class="wort">${w.name}</span></button>`;
        };
        const tafel = document.createElement('div');
        tafel.className = 'blatt-tafel';
        tafel.dataset['material'] = 'stift-zubehoer';
        tafel.dataset['materialJe'] = 'gruppe';
        tools.appendChild(tafel);
        tafel.innerHTML =
            button('schreiben') +
                button('select') +
                button('stift') +
                button('marker') +
                (() => {
                    const jetzt = FORMEN.find(f => f.id === formArt) || FORMEN[0];
                    return `<button data-wz="formen" data-form="${jetzt.id}" ` +
                        `title="${jetzt.titel} — die Form wählst du darunter">` +
                        `<span class="zeichen" data-sym="${jetzt.sym || 'inkShapes'}" aria-hidden="true"></span>` +
                        '<span class="wort">Form</span></button>';
                })() +
                button('abdeck') +
                button('zettel') +
                button('text') +
                button('textfix') +
                button('zeichen') +
                button('elemente') +
                button('bild') +
                button('radierer') +
                button('laser') +
                '<span class="blatt-zeilenbruch" aria-hidden="true"></span>' +
                (() => {
                    const jetzt = RADIERER.find(r => r.id === (controls.radierModusVon ? controls.radierModusVon() : RADIER_VORGABE)) || RADIERER[0];
                    return `<button data-act="radiermodus" data-gruppe="radierer" data-modus="${jetzt.id}" title="${jetzt.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}">` +
                        `<span class="zeichen" data-sym="${jetzt.sym}" aria-hidden="true"></span>` +
                        `<span class="wort">${jetzt.name}</span></button>`;
                })() +
                (() => {
                    const gemerkt = radierGroesseLesen();
                    const auto = radierAutoLesen();
                    const namen = ['klein', 'mittel', 'groß'];
                    const kreise = [14, 22, 30];
                    return RADIER_GROESSEN.map((radius, i) => `<button type="button" class="blatt-eraser-size" data-gruppe="radierer" ` +
                        `data-eraser-size="${radius}" style="--eraser-preview:${kreise[i]}px" ` +
                        `aria-pressed="${!auto && radius === gemerkt ? 'true' : 'false'}" ` +
                        `title="Radierer ${namen[i]}" aria-label="Radierer ${namen[i]}">` +
                        `<i aria-hidden="true"></i></button>`).join('') +
                        `<button type="button" data-act="radierauto" data-gruppe="radierer" ` +
                        `aria-pressed="${auto ? 'true' : 'false'}"${auto ? ' class="on"' : ''} ` +
                        `title="Automatisch an den Strich anpassen — der Radierer nimmt die Breite des Strichs, den er trifft" ` +
                        `aria-label="Radierergrösse automatisch an den Strich anpassen">` +
                        `<span class="zeichen" data-sym="eraserAuto" aria-hidden="true"></span>` +
                        `<span class="wort">Automatisch</span></button>`;
                })() +
                '<span class="blatt-trenn" data-gruppe="verlauf"></span>' +
                '<button data-act="undo" data-gruppe="verlauf" title="Rückgängig" disabled><span class="zeichen" data-sym="undo" aria-hidden="true"></span><span class="wort">Zurück</span></button>' +
                '<button data-act="redo" data-gruppe="verlauf" title="Wiederholen" disabled><span class="zeichen" data-sym="redo" aria-hidden="true"></span><span class="wort">Vor</span></button>' +
                (() => {
                    const jetzt = LAGEN.find(l => l.id === lageJetzt()) || LAGEN[0];
                    const naechst = LAGEN[(LAGEN.findIndex(l => l.id === jetzt.id) + 1) % LAGEN.length];
                    return `<button data-act="lage" data-gruppe="verlauf" data-lage="${jetzt.id}" ` +
                        `title="Leiste verschieben — jetzt ${jetzt.name}, als Nächstes ${naechst.name}" ` +
                        `aria-label="Leiste verschieben, jetzt ${jetzt.name}">` +
                        `<span class="zeichen" data-sym="${jetzt.sym}" aria-hidden="true"></span>` +
                        `<span class="wort">Platz</span></button>`;
                })() +
                '<span class="blatt-trenn" data-gruppe="auswahl"></span>' +
                '<button data-act="einrichten" data-gruppe="verlauf" ' +
                'title="Leiste einrichten — die Reihenfolge der Werkzeuge und ihres Zubehörs selbst bestimmen">' +
                '<span class="zeichen" data-sym="ordnen" aria-hidden="true"></span>' +
                '<span class="wort">Einrichten</span></button>' +
                '<button data-act="delete" data-gruppe="auswahl" title="Auswahl löschen" disabled><span class="zeichen" data-sym="trash" aria-hidden="true"></span><span class="wort">Löschen</span></button>' +
                '<button data-act="copy" data-gruppe="auswahl" title="Auswahl kopieren (Strg+C)" disabled><span class="zeichen" data-sym="copy" aria-hidden="true"></span><span class="wort">Kopieren</span></button>' +
                '<button data-act="paste" data-gruppe="auswahl" title="Kopiertes einsetzen (Strg+V)" disabled><span class="zeichen" data-sym="clipboard" aria-hidden="true"></span><span class="wort">Einsetzen</span></button>' +
                '<button data-act="cut" data-gruppe="auswahl" title="Auswahl ausschneiden (Strg+X)" disabled><span class="zeichen" data-sym="scissors" aria-hidden="true"></span><span class="wort">Ausschneiden</span></button>' +
                '<button data-act="vor" data-gruppe="auswahl" title="Auswahl nach vorn — über alles andere" disabled><span class="zeichen" data-sym="layerUp" aria-hidden="true"></span><span class="wort">Nach vorn</span></button>' +
                '<button data-act="hinten" data-gruppe="auswahl" title="Auswahl nach hinten — unter alles andere" disabled><span class="zeichen" data-sym="layerDown" aria-hidden="true"></span><span class="wort">Nach hinten</span></button>' +
                '<button data-act="sperren" data-gruppe="auswahl" aria-pressed="false" title="Auswahl sperren: nicht mehr schieben, ziehen, drehen, löschen oder radieren" disabled><span class="zeichen" data-sym="lock" aria-hidden="true"></span><span class="wort">Sperren</span></button>' +
                '<button data-act="verweis" data-gruppe="auswahl" title="Der Auswahl einen Verweis geben: eine Adresse (https://…) oder eine Seite ([[Name]]) — im Lesemodus antippen" disabled><span class="zeichen" data-sym="link" aria-hidden="true"></span><span class="wort">Verweis</span></button>' +
                '<button data-act="element-sichern" data-gruppe="auswahl" title="Die Auswahl als Element sichern — danach mit dem Werkzeug «Elemente» auf jede Seite setzen" disabled><span class="zeichen" data-sym="star" aria-hidden="true"></span><span class="wort">Als Element</span></button>' +
                '<button data-act="elemente" data-gruppe="elemente" title="Elemente-Bibliothek öffnen und wählen, was der nächste Tipp setzt"><span class="zeichen" data-sym="star" aria-hidden="true"></span><span class="wort">Elemente</span></button>' +
                '<span class="blatt-trenn" data-gruppe="lineal"></span>' +
                '<button data-act="lineal" data-gruppe="lineal" aria-pressed="false" ' +
                'title="Lineal: Linie und Pfeil rasten auf 15°-Schritte">' +
                '<span class="zeichen" data-sym="inkRuler" aria-hidden="true"></span><span class="wort">Lineal</span></button>' +
                '<span class="blatt-trenn" data-gruppe="formen"></span>' +
                `<button data-act="formen" data-gruppe="formen" aria-pressed="${controls.formenAn ? (controls.formenAn() ? 'true' : 'false') : 'true'}"` +
                `${controls.formenAn && controls.formenAn() ? ' class="on"' : ''} ` +
                'title="Formen erkennen: einen Kreis, ein Rechteck oder eine Linie ziehen und am Ende kurz halten">' +
                '<span class="zeichen" data-sym="shapeSnap" aria-hidden="true"></span><span class="wort">Formen</span></button>' +
                `<button data-act="kritzel" data-gruppe="formen" aria-pressed="${controls.kritzelAn ? (controls.kritzelAn() ? 'true' : 'false') : 'true'}"` +
                `${controls.kritzelAn && controls.kritzelAn() ? ' class="on"' : ''} ` +
                'title="Kritzeln löscht: dicht über einen Strich hin und her fahren, und er ist weg">' +
                '<span class="zeichen" data-sym="scribble" aria-hidden="true"></span><span class="wort">Kritzeln</span></button>' +
                '<span class="blatt-trenn" data-gruppe="schrift"></span>' +
                (() => {
                    const s = (controls.schriftVon ? controls.schriftVon() : SCHRIFT_VORGABE);
                    const fam = SCHRIFTEN.find(x => x.id === s.familie) || SCHRIFTEN[0];
                    return `<button data-act="schriftart" data-gruppe="schrift" data-schrift="${fam.id}" ` +
                        `title="Schriftart: ${fam.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}">` +
                        `<span class="zeichen" aria-hidden="true" style="font-family:${fam.stapel}">Aa</span><span class="wort">${fam.name}</span></button>` +
                        '<button data-act="kleiner" data-gruppe="schrift" title="Schrift kleiner">' +
                        '<span class="zeichen" aria-hidden="true">A−</span><span class="wort">Kleiner</span></button>' +
                        `<button data-act="groesser" data-gruppe="schrift" title="Schrift grösser (jetzt ${s.groesse} px)">` +
                        '<span class="zeichen" aria-hidden="true">A+</span><span class="wort">Grösser</span></button>' +
                        `<button data-act="fett" data-gruppe="schrift" aria-pressed="${s.fett ? 'true' : 'false'}"${s.fett ? ' class="on"' : ''} title="Fett">` +
                        '<span class="zeichen" aria-hidden="true">F</span><span class="wort">Fett</span></button>' +
                        `<button data-act="rahmen" data-gruppe="schrift" aria-pressed="${s.rahmen ? 'true' : 'false'}"${s.rahmen ? ' class="on"' : ''} title="Rahmen um den Text">` +
                        '<span class="zeichen" aria-hidden="true">▭</span><span class="wort">Rahmen</span></button>' +
                        (() => {
                            const a2 = AUSRICHTUNGEN.find(x => x.id === s.ausricht) || AUSRICHTUNGEN[0];
                            return `<button data-act="ausricht" data-gruppe="schrift" data-ausricht="${a2.id}" ` +
                                `title="Ausrichtung: ${a2.name} — antippen wechselt: ${AUSRICHTUNGEN.map(x => x.name).join(' → ')}">` +
                                `<span class="zeichen" data-sym="${a2.sym}" aria-hidden="true"></span>` +
                                `<span class="wort">${a2.name}</span></button>`;
                        })();
                })() +
                '<span class="blatt-trenn" data-gruppe="stil"></span>' +
                (() => {
                    const jetzt = (controls.stilVon ? controls.stilVon() : STIL_VORGABE);
                    return STIFTE.map(st => `<button data-act="stilwahl" data-gruppe="stil" data-stil="${st.id}"` +
                        (st.id === jetzt ? ' class="on"' : '') +
                        ` aria-pressed="${st.id === jetzt ? 'true' : 'false'}"` +
                        ` title="${st.name}" aria-label="Stift ${st.name}">` +
                        `<span class="zeichen" data-sym="${st.sym}" aria-hidden="true"></span>` +
                        `<span class="wort">${st.name}</span></button>`).join('');
                })() +
                '<span class="blatt-trenn" data-gruppe="form"></span>' +
                FORMEN.map(f => `<button data-act="formart" data-gruppe="form" data-form="${f.id}"` +
                    (f.id === formArt ? ' class="on"' : '') + ` aria-pressed="${f.id === formArt ? 'true' : 'false'}"` +
                    ` title="${f.titel}"><span class="zeichen" data-sym="${f.sym || 'inkShapes'}" aria-hidden="true"></span>` +
                    `<span class="wort">${f.name}</span></button>`).join('') +
                '<span class="blatt-trenn" data-gruppe="laser"></span>' +
                LASER.map(l => `<button data-act="laserart" data-gruppe="laser" data-laser="${l.id}"` +
                    (l.id === laserArt() ? ' class="on"' : '') +
                    ` aria-pressed="${l.id === laserArt() ? 'true' : 'false'}" title="${l.titel}">` +
                    `<span class="zeichen" aria-hidden="true">${l.zeichen}</span>` +
                    `<span class="wort">${l.name}</span></button>`).join('') +
                '<span class="blatt-trenn" data-gruppe="farbe"></span>' +
                FARBEN.map((value, index) => `<button class="blatt-farbe${index === 0 ? ' on' : ''}" data-gruppe="farbe" ` +
                    `data-c="${value}" style="background:${value}" ` +
                    `title="${FARBNAMEN[value] || value}" aria-label="Farbe ${FARBNAMEN[value] || value}"></button>`).join('') +
                eigeneFarben().map(value => `<button class="blatt-farbe blatt-farbe-eigen" data-gruppe="farbe" ` +
                    `data-c="${value}" style="background:${value}" title="Eigene Farbe ${value}"></button>`).join('') +
                '<button class="blatt-farbe-neu" data-act="farbe" data-gruppe="farbe" ' +
                'title="Farben — eine eigene wählen oder Farbsätze sichern, laden, zurücksetzen" ' +
                'aria-label="Farben: eigene Farbe wählen oder Farbsätze">+</button>' +
                '<span class="blatt-trenn" data-gruppe="breite"></span>' +
                BREITEN.map((value, index) => `<button class="blatt-strich${index === 1 ? ' on' : ''}" data-gruppe="breite" ` +
                    `data-b="${value}" title="${BREITEN_NAMEN[index] ?? 'Strich'} · ${alsMm(value)} — die gewählte nochmal antippen: Stärke frei wählen" ` +
                    `aria-label="Strichstärke ${BREITEN_NAMEN[index] ?? 'Strich'}, ${alsMm(value)}">` +
                    `<i style="height:${Math.max(2, value * 2)}px"></i>` +
                    '<span class="wort"></span></button>').join('') +
                '<label class="blatt-staerke" data-gruppe="breite" title="Strichstärke frei wählen">' +
                '<input type="range" min="0.5" max="12" step="0.1" value="' + BREITEN[1] + '" aria-label="Strichstärke">' +
                '<output aria-hidden="true">' + alsMm(BREITEN[1]) + '</output></label>';
        tafel.querySelectorAll(':scope > [data-wz]')
            .forEach(knopf => tools.insertBefore(knopf, tafel));
        const bruchRaus = tafel.querySelector(':scope > .blatt-zeilenbruch');
        if (bruchRaus)
            tools.insertBefore(bruchRaus, tafel);
        ordnungAnwenden(tools);
        try {
            new MutationObserver(() => {
                platzSetzen(tools);
                try {
                    staerkenBeschriften();
                }
                catch { }
            }).observe(tools, { attributes: true, attributeFilter: ['data-tool'] });
        }
        catch { }
        let ordnenAn = false;
        let zug = null;
        const teilUnter = (x, y) => {
            const knoten = document.elementFromPoint(x, y);
            const el = knoten instanceof Element
                ? knoten.closest('[data-wz],[data-gruppe]') : null;
            if (!el || !tools.contains(el))
                return null;
            if (el.dataset.wz)
                return { art: 'werkzeuge', id: el.dataset.wz };
            if (el.dataset.gruppe)
                return { art: 'gruppen', id: el.dataset.gruppe };
            return null;
        };
        const setzeAn = (art, id, zielId) => {
            const o = ordnungLesen();
            const liste = o[art];
            const von = liste.indexOf(id), nach = liste.indexOf(zielId);
            if (von < 0 || nach < 0 || von === nach)
                return false;
            liste.splice(von, 1);
            liste.splice(nach, 0, id);
            ordnungMerken(o);
            document.querySelectorAll('.blatt-werk').forEach(ordnungAnwenden);
            return true;
        };
        const rueckeUm = (el, schritt) => {
            const art = el.dataset.wz ? 'werkzeuge' : 'gruppen';
            const id = String(el.dataset.wz || el.dataset.gruppe || '');
            const liste = ordnungLesen()[art];
            const i = liste.indexOf(id);
            const ziel = liste[i + schritt];
            if (!ziel || !setzeAn(art, id, ziel))
                return;
            (art === 'werkzeuge' ? tools : flaeche(tools)).querySelector(art === 'werkzeuge' ? `:scope > [data-wz="${id}"]` : `:scope > [data-gruppe="${id}"]`)?.focus();
        };
        const bandZeigen = (an) => {
            const reihe = tools.closest('.blatt-reihe');
            if (!reihe)
                return;
            reihe.querySelector('.blatt-ordnen-band')?.remove();
            if (!an)
                return;
            const band = document.createElement('div');
            band.className = 'blatt-ordnen-band';
            const wort = document.createElement('span');
            wort.textContent = 'Ziehen zum Ordnen';
            const liste = document.createElement('button');
            liste.type = 'button';
            liste.dataset.ob = 'liste';
            liste.textContent = 'Als Liste';
            liste.title = 'Alles ordnen — auch das Zubehör, das gerade nicht zu sehen ist';
            const zurueck = document.createElement('button');
            zurueck.type = 'button';
            zurueck.dataset.ob = 'zurueck';
            zurueck.textContent = 'Zurücksetzen';
            const fertig = document.createElement('button');
            fertig.type = 'button';
            fertig.dataset.ob = 'fertig';
            fertig.textContent = 'Fertig';
            fertig.className = 'ist-fertig';
            band.append(wort, liste, zurueck, fertig);
            reihe.appendChild(band);
            fertig.focus();
        };
        const ordnenSetzen = (an) => {
            ordnenAn = an;
            if (an)
                tools.dataset.ordnen = 'an';
            else
                delete tools.dataset.ordnen;
            bandZeigen(an);
            if (!an && zug) {
                zug = null;
                tools.querySelectorAll('.zieht').forEach(z => z.classList.remove('zieht'));
            }
        };
        tools.addEventListener('click', event => {
            if (!ordnenAn)
                return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
        tools.addEventListener('pointerdown', event => {
            if (!ordnenAn)
                return;
            const el = event.target?.closest('[data-wz],[data-gruppe]');
            if (!el || !tools.contains(el))
                return;
            event.preventDefault();
            zug = el.dataset.wz
                ? { art: 'werkzeuge', id: String(el.dataset.wz) }
                : { art: 'gruppen', id: String(el.dataset.gruppe) };
            el.classList.add('zieht');
            const beiZug = (e) => {
                if (!zug)
                    return;
                const ziel = teilUnter(e.clientX, e.clientY);
                if (!ziel || ziel.art !== zug.art || ziel.id === zug.id)
                    return;
                setzeAn(zug.art, zug.id, ziel.id);
            };
            const ende = () => {
                zug = null;
                tools.querySelectorAll('.zieht').forEach(z => z.classList.remove('zieht'));
                window.removeEventListener('pointermove', beiZug);
                window.removeEventListener('pointerup', ende);
                window.removeEventListener('pointercancel', ende);
            };
            window.addEventListener('pointermove', beiZug);
            window.addEventListener('pointerup', ende);
            window.addEventListener('pointercancel', ende);
        }, true);
        tools.addEventListener('keydown', event => {
            if (!ordnenAn)
                return;
            if (event.key === 'Escape') {
                ordnenSetzen(false);
                return;
            }
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                return;
            const el = event.target?.closest('[data-wz],[data-gruppe]');
            if (!el || !tools.contains(el))
                return;
            event.preventDefault();
            rueckeUm(el, event.key === 'ArrowRight' ? 1 : -1);
        }, true);
        const reiheFuerBand = row;
        reiheFuerBand.addEventListener('click', event => {
            const knopf = event.target?.closest('[data-ob]');
            if (!knopf)
                return;
            event.preventDefault();
            event.stopPropagation();
            const was = String(knopf.dataset.ob || '');
            if (was === 'fertig') {
                ordnenSetzen(false);
                return;
            }
            if (was === 'liste') {
                void leisteEinrichten();
                return;
            }
            if (was === 'zurueck') {
                ordnungVergessen();
                document.querySelectorAll('.blatt-werk').forEach(ordnungAnwenden);
            }
        });
        controls.ordnenUmschalten = () => ordnenSetzen(!ordnenAn);
        tools.setAttribute('role', 'toolbar');
        tools.setAttribute('aria-label', 'Zeichenwerkzeuge');
        const sichtbareKnoepfe = () => {
            const alle = [...tools.querySelectorAll('button')];
            const sichtbar = alle.filter(k => k.getClientRects().length > 0 && !k.hasAttribute('disabled'));
            return sichtbar.length ? sichtbar : alle;
        };
        const fokusFuehrung = (bevorzugt) => {
            const liste = sichtbareKnoepfe();
            if (!liste.length)
                return;
            const jetzt = liste.find(k => k.tabIndex === 0);
            const eins = (bevorzugt && liste.includes(bevorzugt)) ? bevorzugt : (jetzt ?? liste[0]);
            tools.querySelectorAll('button').forEach(k => { k.tabIndex = -1; });
            eins.tabIndex = 0;
        };
        fokusFuehrung();
        tools.addEventListener('click', event => {
            const k = event.target?.closest('button');
            fokusFuehrung(k && tools.contains(k) ? k : undefined);
        });
        tools.addEventListener('focusin', event => {
            const k = event.target?.closest('button');
            if (k && tools.contains(k))
                fokusFuehrung(k);
        });
        tools.addEventListener('keydown', event => {
            if (ordnenAn)
                return;
            const schritt = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
            if (!schritt && event.key !== 'Home' && event.key !== 'End')
                return;
            const liste = sichtbareKnoepfe();
            if (liste.length < 2)
                return;
            const hier = event.target?.closest('button');
            const i = hier ? liste.indexOf(hier) : -1;
            const ziel = event.key === 'Home' ? liste[0]
                : event.key === 'End' ? liste[liste.length - 1]
                    : liste[((i < 0 ? 0 : i) + schritt + liste.length) % liste.length];
            event.preventDefault();
            fokusFuehrung(ziel);
            ziel.focus();
        });
        const leisteEinordnen = (r) => {
            const h = r.parentElement;
            if (!h || !h.classList.contains('blatt-huelle'))
                return;
            if (r.dataset.lage === 'unten') {
                if (h.lastElementChild !== r)
                    h.appendChild(r);
            }
            else if (h.firstElementChild !== r)
                h.insertBefore(r, h.firstElementChild);
            spaltePlatz(r);
            freiImFenster(r);
            window.addEventListener('resize', spaltenNachFenster, { passive: true });
        };
        const lageAnwenden = (id, merken = true) => {
            const eintrag = LAGEN.find(l => l.id === id) ?? LAGEN[0];
            if (merken && typeof Store !== 'undefined') {
                try {
                    Store.setMeta(M_LAGE, eintrag.id);
                }
                catch { }
            }
            const i = LAGEN.findIndex(l => l.id === eintrag.id);
            const naechst = naechsteLage(i);
            document.querySelectorAll('.blatt-reihe').forEach(r => {
                r.dataset.lage = eintrag.id;
                leisteEinordnen(r);
            });
            document.querySelectorAll('[data-act="lage"]').forEach(k => {
                k.dataset.lage = eintrag.id;
                k.title = 'Leiste verschieben — jetzt ' + eintrag.name + ', als Nächstes ' + naechst.name
                    + ' (ziehen geht auch)';
                k.setAttribute('aria-label', 'Leiste verschieben, jetzt ' + eintrag.name);
                const z = k.querySelector('.zeichen');
                if (z) {
                    z.dataset.sym = eintrag.sym;
                    z.textContent = '';
                }
                try {
                    Register.symbole.fuelle(k);
                }
                catch { }
            });
        };
        const ZUG_AB = 6;
        const FANG = 64;
        tools.addEventListener('pointerdown', event => {
            if (ordnenAn)
                return;
            const griff = event.target?.closest('[data-act="lage"]');
            if (!griff || !tools.contains(griff))
                return;
            if (window.matchMedia && window.matchMedia('(max-width:760px)').matches)
                return;
            const huelle = row.parentElement;
            if (!huelle)
                return;
            const startX = event.clientX, startY = event.clientY;
            let zieht = false;
            const bewegen = (e) => {
                if (!zieht && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) < ZUG_AB)
                    return;
                if (!zieht) {
                    zieht = true;
                    row.dataset.zug = 'an';
                    griff.setPointerCapture?.(e.pointerId);
                }
                const k = huelle.getBoundingClientRect();
                if (!k.width || !k.height)
                    return;
                const m = fensterMitte(e.clientX, e.clientY, row.offsetWidth, row.offsetHeight);
                const x = ((m.x - k.x) / k.width) * 100;
                const y = ((m.y - k.y) / k.height) * 100;
                row.dataset.lage = 'frei';
                row.style.setProperty('--leiste-x', x.toFixed(2) + '%');
                row.style.setProperty('--leiste-y', y.toFixed(2) + '%');
            };
            const beenden = (e) => {
                window.removeEventListener('pointermove', bewegen);
                window.removeEventListener('pointerup', beenden);
                window.removeEventListener('pointercancel', beenden);
                if (!zieht)
                    return;
                delete row.dataset.zug;
                const schlucken = (c) => { c.preventDefault(); c.stopPropagation(); };
                window.addEventListener('click', schlucken, true);
                setTimeout(() => window.removeEventListener('click', schlucken, true), 0);
                const k = huelle.getBoundingClientRect();
                const nah = {
                    links: e.clientX - k.x, rechts: k.right - e.clientX,
                    oben: e.clientY - k.y, unten: k.bottom - e.clientY
                };
                const rand = Object.keys(nah)
                    .sort((a, b) => nah[a] - nah[b])[0];
                if (nah[rand] <= FANG) {
                    row.style.removeProperty('--leiste-x');
                    row.style.removeProperty('--leiste-y');
                    lageAnwenden(rand);
                    return;
                }
                lageAnwenden('frei');
                merkeFrei(row);
            };
            window.addEventListener('pointermove', bewegen);
            window.addEventListener('pointerup', beenden);
            window.addEventListener('pointercancel', beenden);
        });
        Rollrand.binde(tools, { art: 'mehr', an: row });
        const tupferZeigen = (liste, aktiv) => {
            tools.querySelectorAll('.blatt-farbe-eigen').forEach(node => node.remove());
            const neuKnopf = tools.querySelector('.blatt-farbe-neu');
            liste.forEach(farbe => {
                const k = document.createElement('button');
                k.className = 'blatt-farbe blatt-farbe-eigen';
                k.dataset.gruppe = 'farbe';
                k.dataset.c = farbe;
                k.style.background = farbe;
                k.title = 'Eigene Farbe ' + farbe;
                neuKnopf?.before(k);
            });
            if (aktiv)
                tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.toggle('on', node.dataset.c === aktiv));
        };
        const farbwaehlerOeffnen = () => {
            const feld = document.createElement('input');
            feld.type = 'color';
            feld.value = Zeichenziel.farbeVon?.(controls) || FARBEN[0];
            feld.style.position = 'fixed';
            feld.style.opacity = '0';
            feld.style.pointerEvents = 'none';
            document.body.appendChild(feld);
            const uebernehmen = () => {
                const wert = String(feld.value || '').toLowerCase();
                feld.remove();
                if (!/^#[0-9a-f]{6}$/.test(wert))
                    return;
                const liste = eigeneFarbeMerken(wert);
                controls.setzeFarbe(wert);
                try {
                    Zeichenziel.uebernehmeFarbe(controls, wert);
                }
                catch { }
                tupferZeigen(liste, wert);
            };
            feld.addEventListener('change', uebernehmen, { once: true });
            feld.addEventListener('cancel', () => feld.remove(), { once: true });
            feld.click();
        };
        const openColorPanel = (anchor) => {
            const tool = String(Zeichenziel.werkzeugVon(controls) || 'stift');
            const marker = tool === 'marker';
            const papier = papierfarbeVon(controls.flaeche);
            const dunkel = relativeHelligkeit(papier) < 0.2;
            const zuerst = marker ? LEUCHTFARBEN
                : dunkel ? [[PAPIERWEISS, 'Weiss'], ...TINTEN] : TINTEN;
            const weitere = (marker ? MARKER_PASTELLE : FARBEN.map(value => [value, FARBNAMEN[value] || value]))
                .filter(([value]) => !zuerst.some(([c]) => c === value));
            const palette = [...zuerst, ...weitere].map(([value, name]) => [value, name]);
            InkMenu.open(anchor, marker ? 'Markerfarben' : 'Stift- & Textfarben', (body, close) => {
                body.classList.add('blatt-color-panel');
                body.dataset.colorTool = tool;
                let selected = String(Zeichenziel.farbeVon(controls) || FARBEN[0]).toLowerCase();
                if (marker && selected === FARBEN[0])
                    selected = TEXTMARKER_FARBE;
                const preview = document.createElement('div');
                preview.className = 'blatt-color-preview';
                preview.style.setProperty('--probe-papier', papier);
                preview.dataset.papier = dunkel ? 'dunkel' : 'hell';
                const sample = document.createElement('span');
                sample.textContent = marker ? 'Text bleibt lesbar' : 'Meine Notiz';
                const ink = document.createElement('i');
                ink.setAttribute('aria-hidden', 'true');
                preview.append(sample, ink);
                const caption = document.createElement('p');
                caption.className = 'blatt-color-caption';
                const hinweis = document.createElement('p');
                hinweis.className = 'blatt-color-warnung';
                hinweis.setAttribute('role', 'status');
                const probeZeichnen = () => {
                    const spitze = markerSpitzeLesen();
                    const stil = marker ? (spitze === 'keil' ? 'keil' : '') : (stiftJetzt() || 'fueller');
                    const probe = strichprobeMarke(marker ? 'marker' : 'stift', stil, selected, Number(Zeichenziel.dickeVon?.(controls)) || BREITEN[1]);
                    ink.style.opacity = String(deckungVon(tool, stil));
                    ink.dataset.stil = stil || (marker ? 'rund' : 'kugel');
                    ink.replaceChildren(strichprobeBild(probe));
                    caption.textContent = marker
                        ? `Markieren · ${spitze === 'keil' ? 'Keilspitze' : 'runde Spitze'} · transparente Tinte auf Papier`
                        : 'Schreiben & Zeichnen';
                    const k = kontrastZu(selected, papier);
                    hinweis.textContent = !marker && k < 3
                        ? `Kaum sichtbar auf diesem Papier (${String(Math.round(k * 10) / 10).replace('.', ',')} : 1)` : '';
                };
                body.append(preview, caption, hinweis);
                if (marker) {
                    const spitzen = document.createElement('div');
                    spitzen.className = 'blatt-color-spitzen';
                    spitzen.setAttribute('role', 'group');
                    spitzen.setAttribute('aria-label', 'Spitze des Markers');
                    for (const sp of MARKER_SPITZEN) {
                        const knopf = document.createElement('button');
                        knopf.type = 'button';
                        knopf.dataset.markerSpitze = sp.id;
                        knopf.title = sp.titel;
                        knopf.textContent = sp.name;
                        knopf.setAttribute('aria-pressed', String(markerSpitzeLesen() === sp.id));
                        knopf.onclick = () => {
                            markerSpitzeMerken(sp.id);
                            staerkenBeschriften();
                            spitzen.querySelectorAll('[data-marker-spitze]').forEach(k => k.setAttribute('aria-pressed', String(k.dataset.markerSpitze === sp.id)));
                            probeZeichnen();
                        };
                        spitzen.append(knopf);
                    }
                    body.append(spitzen);
                }
                const apply = (value) => {
                    if (!/^#[0-9a-f]{6}$/.test(value))
                        return;
                    const recent = eigeneFarbeMerken(value);
                    tupferZeigen(recent, value);
                    tools.querySelector(`.blatt-farbe[data-c="${value}"]`)?.click();
                    markiere();
                    close();
                };
                const addSwatches = (colors, label, klein = false) => {
                    const grid = document.createElement('div');
                    grid.className = 'blatt-color-grid' + (klein ? ' blatt-color-grid-klein' : '');
                    grid.setAttribute('role', 'group');
                    grid.setAttribute('aria-label', label);
                    for (const [value, name] of colors) {
                        if (!value)
                            continue;
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.dataset.inkColor = value;
                        button.setAttribute('aria-label', `${name} ${value}`);
                        button.title = name || value;
                        button.setAttribute('aria-pressed', String(value === selected));
                        const swatch = document.createElement('i');
                        swatch.style.background = value;
                        swatch.setAttribute('aria-hidden', 'true');
                        const text = document.createElement('span');
                        text.textContent = name || value;
                        button.append(swatch, text);
                        button.onclick = () => apply(value);
                        grid.append(button);
                    }
                    body.append(grid);
                };
                const ueberschrift = (wort) => {
                    const label = document.createElement('p');
                    label.className = 'blatt-color-caption';
                    label.textContent = wort;
                    body.append(label);
                };
                ueberschrift(marker ? 'Leuchtfarben' : dunkel ? 'Tinten · für dunkles Papier zuerst Weiss' : 'Tinten');
                addSwatches(zuerst.map(([v, n]) => [v, n]), marker ? 'Markerpalette' : 'Tinten');
                if (weitere.length) {
                    ueberschrift('Weitere Farben');
                    addSwatches(weitere.map(([v, n]) => [v, n]), marker ? 'Weitere Markerfarben' : 'Weitere Farben', true);
                }
                const recent = eigeneFarben().filter(value => !palette.some(([color]) => color === value));
                if (recent.length) {
                    ueberschrift('Zuletzt verwendet');
                    addSwatches(recent.map(value => [value, value]), 'Zuletzt verwendete Farben', true);
                }
                const form = document.createElement('form');
                form.className = 'blatt-color-custom';
                const label = document.createElement('label');
                label.textContent = 'Hex-Farbe';
                const hex = document.createElement('input');
                hex.type = 'text';
                hex.value = selected;
                hex.setAttribute('aria-label', 'Hex-Farbe');
                hex.autocomplete = 'off';
                hex.spellcheck = false;
                hex.maxLength = 7;
                label.append(hex);
                const picker = document.createElement('input');
                picker.type = 'color';
                picker.value = selected;
                picker.setAttribute('aria-label', 'Systemfarbwähler');
                const error = document.createElement('span');
                error.className = 'blatt-color-error';
                error.setAttribute('role', 'status');
                const submit = document.createElement('button');
                submit.type = 'submit';
                submit.textContent = 'Farbe übernehmen';
                const update = () => {
                    const value = hex.value.trim().toLowerCase();
                    const valid = /^#[0-9a-f]{6}$/.test(value);
                    hex.setAttribute('aria-invalid', String(!valid));
                    submit.disabled = !valid;
                    error.textContent = valid ? '' : 'Bitte # und sechs Hex-Zeichen eingeben.';
                    if (valid) {
                        selected = value;
                        picker.value = value;
                        probeZeichnen();
                    }
                };
                hex.addEventListener('input', update);
                picker.addEventListener('input', () => { hex.value = picker.value; update(); });
                let pickerOpenedWith = picker.value;
                picker.addEventListener('click', () => { pickerOpenedWith = picker.value; });
                picker.addEventListener('change', () => {
                    if (picker.value.toLowerCase() === pickerOpenedWith.toLowerCase())
                        return;
                    hex.value = picker.value;
                    update();
                    if (!submit.disabled)
                        apply(selected);
                });
                form.addEventListener('submit', event => { event.preventDefault(); if (!submit.disabled)
                    apply(selected); });
                form.append(label, picker, error, submit);
                body.append(form);
                update();
                const manage = document.createElement('button');
                manage.type = 'button';
                manage.dataset.colorSets = 'true';
                manage.textContent = 'Farbsätze & Stifteinstellungen …';
                manage.onclick = () => { close(); controls.finishWriting?.(); void farbenDialog(); };
                body.append(manage);
            }, reason => {
                if (reason === 'knopf' || reason === 'escape')
                    controls.resumeWriting?.();
                else if (reason === 'aussen')
                    controls.finishWriting?.();
            });
        };
        const elementSichernDialog = async () => {
            if (typeof Dialog === 'undefined')
                return;
            const name = await Dialog.frage('Als Element sichern — unter welchem Namen?', '');
            if (name === null)
                return;
            if (!satzName(name)) {
                UI.toast('Ein Element braucht einen Namen.');
                return;
            }
            const schon = elemente().some(e => e.name.toLowerCase() === satzName(name).toLowerCase());
            if (schon) {
                const ersetzen = await Dialog.wahl({
                    titel: 'Das Element ersetzen?',
                    text: 'Es gibt schon ein Element „' + satzName(name) + '".',
                    knoepfe: [
                        { id: 'ja', text: 'Ersetzen', hinweis: 'Die bisherige Zeichnung dieses Elements geht weg' },
                        { id: 'nein', text: 'Abbrechen', hinweis: 'Nichts ändert sich' }
                    ]
                });
                if (ersetzen !== 'ja')
                    return;
            }
            const ergebnis = controls.elementAusAuswahl(name);
            if (!ergebnis.ok) {
                UI.toast(ergebnis.grund);
                return;
            }
            UI.toast('Element „' + ergebnis.element.name + '" gesichert — Werkzeug «Elemente» setzt es');
        };
        const farbenDialog = async () => {
            if (typeof Dialog === 'undefined') {
                farbwaehlerOeffnen();
                return;
            }
            const jetzt = eigeneFarben();
            const saetze = farbsaetze();
            const farbeJetzt = () => {
                try {
                    return String(Zeichenziel.farbeVon?.(controls) || FARBEN[0]);
                }
                catch {
                    return FARBEN[0];
                }
            };
            const zeigen = (liste) => liste.length ? liste.join(', ') : 'ohne eigene Farben';
            const wahl = await Dialog.wahl({
                titel: 'Farben',
                text: 'Die fünf festen Farben stehen immer in der Leiste. Daneben stehen bis zu vier '
                    + 'eigene — und ein Farbsatz ist eine benannte Abschrift genau dieser vier.\n\n'
                    + 'Eigene Farben gerade: ' + zeigen(jetzt),
                knoepfe: [
                    { id: 'waehlen', text: 'Andere Farbe wählen',
                        hinweis: 'Der Farbwähler des Systems — die gewählte Farbe kommt danach als Tupfer dazu' },
                    ...saetze.map(satz => ({ id: 'laden:' + satz.name, text: satz.name,
                        hinweis: zeigen(satz.farben)
                            + (satz.stil ? ' · ' + (STIFTE.find(st => st.id === satz.stil)?.name || satz.stil) : '')
                            + (satz.breite ? ' · ' + String(Math.round(satz.breite * 10) / 10).replace('.', ',') + ' px' : '') })),
                    { id: 'sichern', text: 'Diese Einstellung sichern',
                        hinweis: 'Farben, Stift und Strichstärke — zusammen unter einem Namen'
                            + (jetzt.length ? ' (' + jetzt.length + ' eigene Farben)' : '') },
                    ...(saetze.length ? [{ id: 'entfernen', text: 'Einen Satz löschen',
                            hinweis: 'Die Farben selbst bleiben, nur der Name geht weg' }] : []),
                    { id: 'zuruecksetzen', text: 'Eigene Farben zurücksetzen',
                        hinweis: 'Leert die Tupfer. Die fünf festen Farben und alle gesicherten Sätze bleiben.' }
                ]
            });
            if (!wahl)
                return;
            if (wahl === 'waehlen') {
                farbwaehlerOeffnen();
                return;
            }
            if (wahl.startsWith('laden:')) {
                const satz = farbsatzLaden(wahl.slice(6));
                if (!satz)
                    return;
                tupferZeigen(satz.farben, farbeJetzt());
                if (satz.stil && controls.setzeStil) {
                    controls.setzeStil(satz.stil);
                    stiftZeigen(satz.stil);
                }
                if (satz.breite)
                    strichSetzen(satz.breite);
                markiere();
                UI.toast('„' + satz.name + '" geladen'
                    + (satz.stil || satz.breite ? ' — mit Stift und Strichstärke' : ''));
                return;
            }
            if (wahl === 'sichern') {
                const name = await Dialog.frage('Farbsatz sichern — unter welchem Namen?', '');
                if (name === null)
                    return;
                if (!satzName(name)) {
                    UI.toast('Ein Farbsatz braucht einen Namen.');
                    return;
                }
                const schon = farbsaetze().some(s => s.name.toLowerCase() === satzName(name).toLowerCase());
                if (schon) {
                    const ersetzen = await Dialog.wahl({
                        titel: 'Den Satz ersetzen?',
                        text: 'Es gibt schon einen Farbsatz „' + satzName(name) + '".',
                        knoepfe: [
                            { id: 'ja', text: 'Ersetzen', hinweis: 'Die bisherigen Farben dieses Satzes gehen weg' },
                            { id: 'nein', text: 'Abbrechen', hinweis: 'Nichts ändert sich' }
                        ]
                    });
                    if (ersetzen !== 'ja')
                        return;
                }
                const stift = { stil: controls.stilVon ? controls.stilVon() : '',
                    breite: Zeichenziel.dickeVon(controls) };
                if (!farbsatzSichern(name, eigeneFarben(), stift)) {
                    UI.toast('Es passen höchstens ' + HOECHSTENS_FARBSAETZE + ' Voreinstellungen — lösche zuerst eine.');
                    return;
                }
                UI.toast('„' + satzName(name) + '" gesichert — Farben, Stift und Strichstärke');
                return;
            }
            if (wahl === 'entfernen') {
                const welcher = await Dialog.wahl({
                    titel: 'Welchen Satz löschen?',
                    text: 'Die Farben bleiben in der Leiste stehen — nur der gesicherte Name geht weg.',
                    knoepfe: saetze.map(satz => ({ id: 'weg:' + satz.name, text: satz.name, hinweis: zeigen(satz.farben) }))
                });
                if (!welcher.startsWith('weg:'))
                    return;
                farbsatzLoeschen(welcher.slice(4));
                UI.toast('Farbsatz „' + satzName(welcher.slice(4)) + '" gelöscht');
                return;
            }
            if (wahl === 'zuruecksetzen') {
                const vorher = farbeJetzt();
                tupferZeigen(farbenZuruecksetzen(), vorher);
                if (!FARBEN.includes(vorher.toLowerCase())) {
                    UI.toast('Eigene Farben zurückgesetzt — gezeichnet wird weiter in ' + vorher);
                }
            }
        };
        const updateState = (next) => {
            const undo = tools.querySelector('[data-act="undo"]');
            const redo = tools.querySelector('[data-act="redo"]');
            const remove = tools.querySelector('[data-act="delete"]');
            if (undo)
                undo.disabled = !next.undo;
            if (redo)
                redo.disabled = !next.redo;
            if (remove)
                remove.disabled = !next.selected;
            const copy = tools.querySelector('[data-act="copy"]');
            const paste = tools.querySelector('[data-act="paste"]');
            if (copy)
                copy.disabled = !next.selected;
            if (paste)
                paste.disabled = !next.clipboard;
            for (const act of ['cut', 'vor', 'hinten', 'sperren', 'verweis', 'element-sichern']) {
                const k = tools.querySelector(`[data-act="${act}"]`);
                if (k)
                    k.disabled = !next.selected;
            }
            const schloss = tools.querySelector('[data-act="sperren"]');
            if (schloss) {
                schloss.setAttribute('aria-pressed', next.gesperrt ? 'true' : 'false');
                schloss.classList.toggle('on', !!next.gesperrt);
            }
            elementKnopfMalen(next.element);
        };
        const elementKnopfMalen = (id) => {
            const knopf = tools.querySelector('[data-act="elemente"]');
            if (!knopf)
                return;
            const gewaehlt = id ? elementHolen(id) : null;
            const wort = knopf.querySelector('.wort');
            if (wort)
                wort.textContent = gewaehlt ? gewaehlt.name : 'Elemente';
            knopf.title = gewaehlt
                ? 'Der nächste Tipp setzt „' + gewaehlt.name + '" — antippen wählt ein anderes'
                : 'Elemente-Bibliothek öffnen und wählen, was der nächste Tipp setzt';
            knopf.classList.toggle('on', !!gewaehlt);
        };
        controls.beiAenderung?.(updateState);
        const stiftZeigen = (id) => {
            const stift = STIFTE.find(st => st.id === id);
            if (!stift)
                return;
            tools.querySelectorAll('[data-act="stilwahl"]').forEach(node => {
                const an = node.dataset.stil === stift.id;
                node.classList.toggle('on', an);
                node.setAttribute('aria-pressed', an ? 'true' : 'false');
            });
            leiterReihe(stift.id === 'leiter');
            try {
                staerkenBeschriften();
            }
            catch { }
        };
        const leiterReihe = (an) => {
            tools.querySelectorAll('.blatt-farbe-leiter').forEach(node => node.remove());
            tools.querySelectorAll('.blatt-farbe:not(.blatt-note-color), .blatt-farbe-neu')
                .forEach(node => node.classList.toggle('blatt-farbe-weg', an));
            if (!an)
                return;
            const neuKnopf = tools.querySelector('.blatt-farbe-neu');
            const jetzt = leiterJetzt();
            LEITER.forEach(ader => {
                const k = document.createElement('button');
                k.className = 'blatt-farbe blatt-farbe-leiter' + (ader.id === jetzt ? ' on' : '');
                k.style.setProperty('--tupfer-n', String(LEITER.indexOf(ader)));
                k.dataset.gruppe = 'farbe';
                k.dataset.c = ader.farbe;
                k.dataset.leiter = ader.id;
                k.style.background = ader.farbe;
                k.title = ader.kurz + ' — ' + ader.name;
                k.setAttribute('aria-label', 'Ader ' + ader.kurz + ': ' + ader.name);
                const wort = document.createElement('span');
                wort.className = 'blatt-farbe-kurz';
                wort.setAttribute('aria-hidden', 'true');
                wort.textContent = ader.kurz;
                k.append(wort);
                neuKnopf?.before(k);
            });
        };
        const markiere = () => {
            if (!tools.isConnected) {
                Zeichenziel.vergiss(markiere);
                return;
            }
            const wz = Zeichenziel.werkzeugVon(controls);
            if (wz) {
                const fuehrend = istForm(wz) ? 'formen' : wz;
                tools.querySelectorAll('[data-wz]').forEach(node => {
                    node.classList.toggle('on', node.dataset.wz === fuehrend);
                    node.setAttribute('aria-pressed', node.dataset.wz === fuehrend ? 'true' : 'false');
                });
                if (tools.dataset.tool !== wz) {
                    tools.dataset.tool = wz;
                    zumWerkzeugRollen(wz);
                }
            }
            const farbe = Zeichenziel.farbeVon(controls);
            const ader = leiterJetzt();
            if (farbe)
                tools.querySelectorAll('.blatt-farbe').forEach(node => {
                    node.classList.toggle('on', node.dataset.leiter
                        ? node.dataset.leiter === ader
                        : node.dataset.c === farbe);
                });
            const dicke = Zeichenziel.dickeVon(controls);
            if (dicke)
                tools.querySelectorAll('.blatt-strich').forEach(node => {
                    node.classList.toggle('on', Number(node.dataset.b) === dicke);
                });
            if (dicke)
                staerkeZeigen(dicke);
        };
        const staerkeOffen = () => !!tools.querySelector('.blatt-staerke.auf');
        const staerkeAuf = (auf) => {
            const label = tools.querySelector('.blatt-staerke');
            if (!label)
                return;
            if (auf) {
                const stufe = tools.querySelector('.blatt-strich.on') || tools.querySelector('.blatt-strich');
                if (stufe)
                    label.style.setProperty('--staerke-x', `${stufe.offsetLeft}px`);
                label.classList.add('auf');
                const feld = label.querySelector('input');
                try {
                    feld?.focus({ preventScroll: true });
                }
                catch { }
                try {
                    label.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
                catch { }
            }
            else {
                label.classList.remove('auf');
            }
        };
        const staerkeFaktor = () => tools.dataset['tool'] === 'marker' ? 4 : 1;
        const farbeJetzt = () => tools.querySelector('.blatt-farbe.on')?.dataset['c']
            || tools.querySelector('.blatt-farbe')?.dataset['c']
            || 'currentColor';
        const stiftJetzt = () => tools.querySelector('[data-act="stilwahl"].on')?.dataset['stil'] || '';
        const staerkenBeschriften = () => {
            const f = staerkeFaktor();
            tools.querySelectorAll('.blatt-strich').forEach((knopf, i) => {
                const pt = Number(knopf.dataset['b']) || BREITEN[1];
                const wort = `${BREITEN_NAMEN[i] ?? 'Strich'} · ${alsMm(pt * f)}`;
                knopf.title = `${wort} — die gewählte nochmal antippen: Stärke frei wählen`;
                knopf.setAttribute('aria-label', `Strichstärke ${wort}`);
                const zettel = knopf.querySelector('.wort');
                if (zettel) {
                    let oben = zettel.querySelector('.strich-name');
                    let unten = zettel.querySelector('.strich-mm');
                    if (!oben || !unten) {
                        zettel.textContent = '';
                        oben = document.createElement('span');
                        oben.className = 'strich-name';
                        unten = document.createElement('span');
                        unten.className = 'strich-mm';
                        zettel.append(oben, unten);
                    }
                    oben.textContent = BREITEN_NAMEN[i] ?? 'Strich';
                    unten.textContent = alsMm(pt * f);
                }
                const balken = knopf.querySelector('i');
                if (balken) {
                    balken.style.background = farbeJetzt();
                    const werkzeug = String(tools.dataset.tool || '');
                    const deck = deckungVon(werkzeug, werkzeug === 'marker'
                        ? (markerSpitzeLesen() === 'keil' ? 'keil' : '') : stiftJetzt());
                    balken.style.opacity = String(deck);
                }
            });
            const feld = tools.querySelector('.blatt-staerke input');
            const zahl = tools.querySelector('.blatt-staerke output');
            const wert = Number(feld?.value) || BREITEN[1];
            if (feld)
                feld.setAttribute('aria-label', `Strichstärke frei wählen, ${alsMm(wert * f)}`);
            if (zahl)
                zahl.textContent = alsMm(wert * f);
        };
        staerkenBeschriften();
        const staerkeZeigen = (wert) => {
            const feld = tools.querySelector('.blatt-staerke input');
            const zahl = tools.querySelector('.blatt-staerke output');
            if (feld && Number(feld.value) !== wert)
                feld.value = String(wert);
            if (zahl)
                zahl.textContent = alsMm(wert * staerkeFaktor());
            if (feld)
                feld.setAttribute('aria-label', `Strichstärke frei wählen, ${alsMm(wert * staerkeFaktor())}`);
        };
        const strichSetzen = (wert) => {
            controls.setzeStrich(wert);
            if (typeof Zeichenziel !== 'undefined') {
                try {
                    Zeichenziel.uebernehmeStrich(controls, wert);
                }
                catch { }
            }
            tools.querySelectorAll('.blatt-strich').forEach(node => node.classList.toggle('on', Number(node.dataset.b) === wert));
            staerkeZeigen(wert);
        };
        tools.addEventListener('input', event => {
            const feld = event.target;
            if (!feld || !feld.matches('.blatt-staerke input'))
                return;
            strichSetzen(Math.max(0.5, Math.min(12, Number(feld.value) || BREITEN[1])));
        });
        tools.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !staerkeOffen())
                return;
            staerkeAuf(false);
            event.stopPropagation();
        });
        tools.addEventListener('focusout', event => {
            const label = tools.querySelector('.blatt-staerke.auf');
            if (!label)
                return;
            const zu = event.relatedTarget;
            if (zu && (label.contains(zu) || zu.matches?.('.blatt-strich')))
                return;
            staerkeAuf(false);
        });
        leiterReihe((controls.stilVon ? controls.stilVon() : STIL_VORGABE) === 'leiter');
        if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
            try {
                Zeichenziel.horche(markiere);
            }
            catch { }
        }
        tools.addEventListener('pointerdown', () => {
            if (typeof Zeichenziel !== 'undefined') {
                try {
                    Zeichenziel.beruehrt(controls);
                }
                catch { }
            }
        }, true);
        tools.addEventListener('click', event => {
            const target = event.target?.closest?.('button');
            if (!target || target.disabled)
                return;
            if (target.dataset.wz && !target.matches('.blatt-strich'))
                staerkeAuf(false);
            if (target.dataset.wz === 'bild') {
                if (controls.bildEinfuegen)
                    void controls.bildEinfuegen();
                return;
            }
            if (target.dataset.wz === 'formen') {
                const wahl = formArt;
                controls.setzeWerkzeug(wahl);
                if (typeof Zeichenziel !== 'undefined') {
                    try {
                        Zeichenziel.uebernehme(controls, wahl);
                    }
                    catch { }
                }
                tools.querySelectorAll('[data-wz]').forEach(node => {
                    node.classList.remove('on');
                    node.setAttribute('aria-pressed', 'false');
                });
                target.classList.add('on');
                target.setAttribute('aria-pressed', 'true');
                tools.dataset.tool = wahl;
                zumWerkzeugRollen('formen');
                return;
            }
            if (target.dataset.wz) {
                controls.setzeWerkzeug(target.dataset.wz);
                if (typeof Zeichenziel !== 'undefined') {
                    try {
                        Zeichenziel.uebernehme(controls, target.dataset.wz);
                    }
                    catch { }
                }
                tools.querySelectorAll('[data-wz]').forEach(node => {
                    node.classList.remove('on');
                    node.setAttribute('aria-pressed', 'false');
                });
                target.classList.add('on');
                target.setAttribute('aria-pressed', 'true');
                tools.dataset.tool = target.dataset.wz;
                zumWerkzeugRollen(target.dataset.wz);
                return;
            }
            if (target.dataset.eraserSize) {
                const radius = Number(target.dataset.eraserSize);
                if (!RADIER_GROESSEN.includes(radius))
                    return;
                controls.setEraserSize(radius);
                if (typeof Store !== 'undefined') {
                    try {
                        Store.setMeta('zeichnen:radierergroesse', radius);
                        Store.setMeta(M_RADIER_AUTO, 'nein');
                    }
                    catch { }
                }
                document.querySelectorAll('[data-eraser-size]').forEach(node => node.setAttribute('aria-pressed', String(Number(node.dataset.eraserSize) === radius)));
                document.querySelectorAll('[data-act="radierauto"]').forEach(haken => {
                    haken.setAttribute('aria-pressed', 'false');
                    haken.classList.remove('on');
                });
                return;
            }
            if (target.dataset.act) {
                if (target.dataset.act === 'undo')
                    controls.undo();
                if (target.dataset.act === 'redo')
                    controls.redo();
                if (target.dataset.act === 'delete')
                    controls.deleteSelection();
                if (target.dataset.act === 'copy' && controls.copySelection)
                    controls.copySelection();
                if (target.dataset.act === 'paste' && controls.paste)
                    controls.paste();
                if (target.dataset.act === 'cut' && controls.cutSelection)
                    controls.cutSelection();
                if (target.dataset.act === 'vor' && controls.nachVorn)
                    controls.nachVorn();
                if (target.dataset.act === 'hinten' && controls.nachHinten)
                    controls.nachHinten();
                if (target.dataset.act === 'sperren' && controls.sperren) {
                    controls.sperren();
                    return;
                }
                if (target.dataset.act === 'verweis' && controls.verweisSetzen) {
                    void controls.verweisSetzen();
                    return;
                }
                if (target.dataset.act === 'elemente' && controls.elementWaehlen) {
                    void controls.elementWaehlen().then(() => elementKnopfMalen(controls.elementGewaehlt?.()));
                    return;
                }
                if (target.dataset.act === 'element-sichern' && controls.elementAusAuswahl) {
                    void elementSichernDialog();
                    return;
                }
                if (target.dataset.act === 'kritzel' && controls.setzeKritzel) {
                    const an = !controls.kritzelAn?.();
                    controls.setzeKritzel(an);
                    target.setAttribute('aria-pressed', an ? 'true' : 'false');
                    target.classList.toggle('on', an);
                    return;
                }
                if (target.dataset.act === 'einrichten') {
                    if (controls.ordnenUmschalten)
                        controls.ordnenUmschalten();
                    return;
                }
                if (target.dataset.act === 'radierauto') {
                    const an = target.getAttribute('aria-pressed') !== 'true';
                    controls.setEraserSize(an ? 0 : radierGroesseLesen());
                    if (typeof Store !== 'undefined') {
                        try {
                            Store.setMeta(M_RADIER_AUTO, an ? 'ja' : 'nein');
                        }
                        catch { }
                    }
                    document.querySelectorAll('[data-act="radierauto"]').forEach(haken => {
                        haken.setAttribute('aria-pressed', an ? 'true' : 'false');
                        haken.classList.toggle('on', an);
                    });
                    const gemerkt = radierGroesseLesen();
                    document.querySelectorAll('[data-eraser-size]').forEach(node => node.setAttribute('aria-pressed', String(!an && Number(node.dataset.eraserSize) === gemerkt)));
                    return;
                }
                if (target.dataset.act === 'lage') {
                    lageAnwenden(naechsteLage(LAGEN.findIndex(l => l.id === lageJetzt())).id);
                    return;
                }
                if (target.dataset.act === 'laserart') {
                    const id = String(target.dataset.laser || 'punkt');
                    if (typeof Store !== 'undefined') {
                        try {
                            Store.setMeta(M_LASER, id);
                        }
                        catch { }
                    }
                    tools.querySelectorAll('[data-act="laserart"]').forEach(node => {
                        const an = node.dataset.laser === id;
                        node.classList.toggle('on', an);
                        node.setAttribute('aria-pressed', an ? 'true' : 'false');
                    });
                    return;
                }
                if (target.dataset.act === 'stilwahl' && controls.setzeStil) {
                    const gewaehlt = STIFTE.find(st => st.id === target.dataset.stil) || STIFTE[0];
                    controls.setzeStil(gewaehlt.id);
                    stiftZeigen(gewaehlt.id);
                    if (Zeichenziel.werkzeugVon?.(controls) !== 'stift') {
                        controls.setzeWerkzeug('stift');
                        try {
                            Zeichenziel.uebernehme(controls, 'stift');
                        }
                        catch { }
                        tools.querySelectorAll('[data-wz]').forEach(node => {
                            const an = node.dataset.wz === 'stift';
                            node.classList.toggle('on', an);
                            node.setAttribute('aria-pressed', an ? 'true' : 'false');
                        });
                        tools.dataset.tool = 'stift';
                    }
                    return;
                }
                if (target.dataset.act === 'formart' && target.dataset.form) {
                    const wahl = String(target.dataset.form);
                    if (!istForm(wahl))
                        return;
                    formArt = wahl;
                    if (typeof Store !== 'undefined') {
                        try {
                            Store.setMeta('zeichnen:form', wahl);
                        }
                        catch { }
                    }
                    tools.querySelectorAll('[data-act="formart"]').forEach(node => {
                        const an = node.dataset.form === wahl;
                        node.classList.toggle('on', an);
                        node.setAttribute('aria-pressed', an ? 'true' : 'false');
                    });
                    const kopf = tools.querySelector('[data-wz="formen"]');
                    const f = FORMEN.find(x => x.id === wahl);
                    if (kopf && f) {
                        kopf.dataset.form = wahl;
                        kopf.title = f.titel + ' — die Form wählst du darunter';
                        kopf.innerHTML = `<span class="zeichen" data-sym="${f.sym || 'inkShapes'}" aria-hidden="true"></span>` +
                            '<span class="wort">Form</span>';
                        try {
                            Register.symbole.fuelle(kopf);
                        }
                        catch { }
                        tools.querySelectorAll('[data-wz]').forEach(node => node.classList.remove('on'));
                        kopf.classList.add('on');
                    }
                    controls.setzeWerkzeug(wahl);
                    if (typeof Zeichenziel !== 'undefined') {
                        try {
                            Zeichenziel.uebernehme(controls, wahl);
                        }
                        catch { }
                    }
                    tools.dataset.tool = wahl;
                    return;
                }
                if (target.dataset.act === 'radiermodus' && controls.setzeRadierModus) {
                    const jetzt = RADIERER.findIndex(r => r.id === target.dataset.modus);
                    const naechster = RADIERER[(jetzt + 1) % RADIERER.length];
                    controls.setzeRadierModus(naechster.id);
                    target.dataset.modus = naechster.id;
                    target.title = `${naechster.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}`;
                    target.innerHTML = `<span class="zeichen" data-sym="${naechster.sym}" aria-hidden="true"></span>` +
                        `<span class="wort">${naechster.name}</span>`;
                    try {
                        Register.symbole.fuelle(target);
                    }
                    catch { }
                    if (Zeichenziel.werkzeugVon?.(controls) !== 'radierer') {
                        controls.setzeWerkzeug('radierer');
                        try {
                            Zeichenziel.uebernehme(controls, 'radierer');
                        }
                        catch { }
                        tools.querySelectorAll('[data-wz]').forEach(node => node.classList.toggle('on', node.dataset.wz === 'radierer'));
                        tools.dataset.tool = 'radierer';
                    }
                    return;
                }
                if (target.dataset.act === 'farbe') {
                    openColorPanel(target);
                    return;
                }
                if (target.dataset.act === 'schriftart' && controls.setzeSchrift) {
                    const jetzt = SCHRIFTEN.findIndex(x => x.id === target.dataset.schrift);
                    const naechste = SCHRIFTEN[(jetzt + 1) % SCHRIFTEN.length];
                    controls.setzeSchrift({ familie: naechste.id });
                    target.dataset.schrift = naechste.id;
                    target.title = `Schriftart: ${naechste.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}`;
                    target.innerHTML = `<span class="zeichen" aria-hidden="true" style="font-family:${naechste.stapel}">Aa</span><span class="wort">${naechste.name}</span>`;
                    return;
                }
                if ((target.dataset.act === 'groesser' || target.dataset.act === 'kleiner') && controls.setzeSchrift) {
                    controls.setzeSchrift({ schritt: target.dataset.act === 'groesser' ? 1 : -1 });
                    const groesser = tools.querySelector('[data-act="groesser"]');
                    if (groesser && controls.schriftVon)
                        groesser.title = `Schrift grösser (jetzt ${controls.schriftVon().groesse} px)`;
                    return;
                }
                if (target.dataset.act === 'ausricht' && controls.setzeSchrift) {
                    const jetzt = AUSRICHTUNGEN.findIndex(x => x.id === target.dataset.ausricht);
                    const naechste = AUSRICHTUNGEN[(jetzt + 1) % AUSRICHTUNGEN.length];
                    controls.setzeSchrift({ ausricht: naechste.id });
                    target.dataset.ausricht = naechste.id;
                    target.title = `Ausrichtung: ${naechste.name} — antippen wechselt: ` +
                        AUSRICHTUNGEN.map(x => x.name).join(' → ');
                    target.innerHTML = `<span class="zeichen" aria-hidden="true">${naechste.zeichen}</span>` +
                        `<span class="wort">${naechste.name}</span>`;
                    return;
                }
                if ((target.dataset.act === 'fett' || target.dataset.act === 'rahmen') && controls.setzeSchrift) {
                    const an = target.getAttribute('aria-pressed') !== 'true';
                    controls.setzeSchrift(target.dataset.act === 'fett' ? { fett: an } : { rahmen: an });
                    target.setAttribute('aria-pressed', an ? 'true' : 'false');
                    target.classList.toggle('on', an);
                    return;
                }
                if (target.dataset.act === 'lineal' && controls.setzeLineal) {
                    const an = !controls.linealAn?.();
                    controls.setzeLineal(an);
                    target.setAttribute('aria-pressed', an ? 'true' : 'false');
                    target.classList.toggle('on', an);
                }
                if (target.dataset.act === 'formen' && controls.setzeFormen) {
                    const an = !controls.formenAn?.();
                    controls.setzeFormen(an);
                    target.setAttribute('aria-pressed', an ? 'true' : 'false');
                    target.classList.toggle('on', an);
                }
                return;
            }
            if (target.dataset.c) {
                if (target.dataset.leiter)
                    leiterMerken(target.dataset.leiter);
                target.classList.add('blatt-farbe-tipp');
                target.addEventListener('animationend', () => target.classList.remove('blatt-farbe-tipp'), { once: true });
                controls.setzeFarbe(target.dataset.c);
                if (typeof Zeichenziel !== 'undefined') {
                    try {
                        Zeichenziel.uebernehmeFarbe(controls, target.dataset.c);
                    }
                    catch { }
                }
                tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.remove('on'));
                target.classList.add('on');
                try {
                    staerkenBeschriften();
                }
                catch { }
                return;
            }
            if (target.dataset.b) {
                if (target.classList.contains('on')) {
                    staerkeAuf(!staerkeOffen());
                    return;
                }
                strichSetzen(Number(target.dataset.b));
            }
        });
        try {
            Register.symbole.fuelle(tools);
        }
        catch { }
        row.appendChild(tools);
        let wahlVorher = tools.querySelector('button[data-wz].on');
        let flugJetzt = null;
        const wahlFliegen = () => {
            const neu = tools.querySelector('button[data-wz].on');
            const alt = wahlVorher;
            if (neu === alt)
                return;
            wahlVorher = neu;
            if (!alt || !neu)
                return;
            if (AppEinstellung.wenigBewegung())
                return;
            const laeuft = flugJetzt?.getBoundingClientRect();
            if (flugJetzt) {
                flugJetzt.remove();
                flugJetzt = null;
            }
            const von = laeuft && laeuft.width ? laeuft : alt.getBoundingClientRect();
            const nach = neu.getBoundingClientRect();
            if (!von.width || !nach.width)
                return;
            if (Math.abs(von.left - nach.left) < 1 && Math.abs(von.top - nach.top) < 1)
                return;
            if (Math.abs(von.top - nach.top) > von.height * 1.5)
                return;
            const flug = document.createElement('i');
            flug.className = 'bw-flug';
            flug.setAttribute('aria-hidden', 'true');
            document.body.append(flug);
            flugJetzt = flug;
            tools.querySelectorAll('.bw-wartet').forEach(k => k.classList.remove('bw-wartet'));
            neu.classList.add('bw-wartet');
            const fertig = () => {
                flug.remove();
                if (flugJetzt === flug)
                    flugJetzt = null;
                neu.classList.remove('bw-wartet');
            };
            const bahn = typeof SelectionFlow === 'undefined'
                ? null : SelectionFlow.fliege(flug, von, nach);
            if (!bahn) {
                fertig();
                return;
            }
            bahn.finished.then(fertig).catch(() => { });
            setTimeout(fertig, SelectionFlow.DAUER + 250);
        };
        try {
            new MutationObserver(wahlFliegen).observe(tools, {
                attributes: true, attributeFilter: ['class'], subtree: true
            });
        }
        catch {
        }
        if (extra) {
            const fixed = document.createElement('div');
            fixed.className = 'blatt-fest';
            fixed.innerHTML = extra;
            row.appendChild(fixed);
        }
        const noteColors = [
            ['#ffb2bd', 'Rosa'], ['#ffd09e', 'Apricot'], ['#ffe780', 'Gelb'],
            ['#b9efa0', 'Grün'], ['#a9e9e4', 'Türkis'], ['#c5dfff', 'Blau'],
            ['#e7d4fb', 'Flieder'], ['#f6c8e8', 'Pink'], ['#e6e3dd', 'Grau']
        ];
        tools.addEventListener('ink-studio-ready', () => {
            if (tools.dataset.referenceUi)
                return;
            tools.dataset.referenceUi = 'ready';
            const cycle = tools.querySelector('[data-act="radiermodus"]');
            const choose = document.createElement('button');
            choose.dataset.gruppe = 'radierer';
            choose.dataset.act = 'eraser-menu';
            choose.className = 'blatt-eraser-menu';
            choose.type = 'button';
            choose.setAttribute('aria-haspopup', 'dialog');
            const syncEraser = () => {
                choose.textContent = (RADIERER.find(mode => mode.id === cycle.dataset.modus)?.name || 'Ganz') + ' ⌄';
                choose.setAttribute('aria-label', 'Radiermodus wählen: ' + choose.textContent);
            };
            syncEraser();
            cycle.after(choose);
            new MutationObserver(syncEraser).observe(cycle, { attributes: true, attributeFilter: ['data-modus'] });
            choose.addEventListener('click', () => InkMenu.open(choose, 'Radierer', (body, close) => {
                for (const mode of RADIERER) {
                    const option = document.createElement('button');
                    option.type = 'button';
                    option.textContent = mode.name;
                    option.title = mode.titel;
                    option.setAttribute('aria-pressed', String(mode.id === cycle.dataset.modus));
                    option.addEventListener('click', () => {
                        for (let i = 0; i < RADIERER.length && cycle.dataset.modus !== mode.id; i++)
                            cycle.click();
                        close();
                    });
                    body.append(option);
                }
            }));
            tools.querySelectorAll('[data-eraser-size]')
                .forEach(node => choose.before(node));
            controls.setEraserSize(radierAutoLesen() ? 0 : radierGroesseLesen());
            for (const [color, name] of noteColors) {
                const swatch = document.createElement('button');
                swatch.type = 'button';
                swatch.className = 'blatt-farbe blatt-note-color';
                swatch.dataset.c = color;
                swatch.dataset.gruppe = 'notizfarbe';
                swatch.style.backgroundColor = color;
                swatch.setAttribute('aria-label', 'Haftnotiz ' + name);
                swatch.title = name;
                tools.querySelector('.blatt-farbe-neu')?.before(swatch);
            }
            ordnungAnwenden(tools);
        });
        tools.addEventListener('ink-panel', event => {
            const { kind, anchor } = event.detail;
            if (kind === 'laser')
                InkMenu.open(anchor, 'Laserpointer', (body, close) => {
                    body.classList.add('blatt-laser-options');
                    for (const mode of LASER) {
                        const option = document.createElement('button');
                        option.type = 'button';
                        option.dataset.laserOption = mode.id;
                        option.setAttribute('aria-pressed', String(mode.id === laserArt()));
                        option.innerHTML = '<i aria-hidden="true"></i><span>' + mode.name + '</span>';
                        option.onclick = () => { tools.querySelector(`[data-laser="${mode.id}"]`)?.click(); close(); };
                        body.append(option);
                    }
                });
            if (kind === 'elemente')
                InkMenu.open(anchor, 'Elemente & Haftnotizen', (body, close) => {
                    const tabs = document.createElement('div');
                    tabs.className = 'blatt-gallery-tabs';
                    const grid = document.createElement('div');
                    grid.className = 'blatt-gallery-grid';
                    for (const kind of ['Elemente', 'Haftnotizen']) {
                        const tab = document.createElement('button');
                        tab.type = 'button';
                        tab.textContent = kind;
                        const show = () => {
                            tabs.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === tab)));
                            grid.replaceChildren();
                            if (kind === 'Haftnotizen') {
                                for (const [color, name] of noteColors) {
                                    const card = document.createElement('button');
                                    card.type = 'button';
                                    card.className = 'blatt-note-preview';
                                    card.style.setProperty('--note-color', color);
                                    card.textContent = name;
                                    card.onclick = () => {
                                        tools.querySelector('[data-wz="zettel"]')?.click();
                                        tools.querySelector(`.blatt-note-color[data-c="${color}"]`)?.click();
                                        close();
                                    };
                                    grid.append(card);
                                }
                            }
                            else {
                                const all = elemente();
                                if (!all.length) {
                                    const empty = document.createElement('p');
                                    empty.className = 'blatt-gallery-empty';
                                    empty.textContent = 'Deine eigenen Sticker: mit dem Lasso etwas auswählen und „Als Element“ sichern. Oder eine Haftnotiz wählen und auf dem Papier aufziehen.';
                                    grid.append(empty);
                                }
                                for (const item of all) {
                                    const card = document.createElement('button');
                                    card.type = 'button';
                                    card.className = 'blatt-element-preview';
                                    const name = document.createElement('span');
                                    name.textContent = item.name;
                                    card.append(elementBild(item), name);
                                    card.onclick = () => { controls.selectElement(item.id); close(); };
                                    grid.append(card);
                                }
                            }
                        };
                        tab.onclick = show;
                        tabs.append(tab);
                        if (kind === 'Elemente')
                            show();
                    }
                    body.append(tabs, grid);
                    const manage = document.createElement('button');
                    manage.type = 'button';
                    manage.textContent = 'Bibliothek verwalten …';
                    manage.onclick = () => { close(); tools.querySelector('[data-act="elemente"]')?.click(); };
                    body.append(manage);
                });
        });
        return row;
    };
    const TASTEN = {
        p: 'stift', '2': 'bleistift', h: 'marker', e: 'radierer', s: 'formen', v: 'select',
        t: 'text', a: 'abdeck', n: 'zettel', m: 'zeichen', r: 'lineal', i: 'bild'
    };
    const tippt = () => {
        const a = document.activeElement;
        if (!a)
            return false;
        const tag = a.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable;
    };
    const aktiveLeiste = () => {
        const s = typeof Zeichenziel !== 'undefined' ? Zeichenziel.aktive() : null;
        const flaeche = s && s.flaeche;
        const huelle = flaeche?.closest('.blatt-huelle, .document-stage, .blatt, .pdfs, .page') || document;
        return huelle.querySelector('.blatt-werk') || document.querySelector('.blatt-werk');
    };
    const greifbar = (knopf) => !!knopf && !knopf.disabled && knopf.getClientRects().length > 0;
    const druecke = (knopf) => {
        if (!greifbar(knopf))
            return false;
        knopf.click();
        return true;
    };
    const kuerzel = (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat)
            return;
        if (tippt())
            return;
        if (typeof Zeichenziel === 'undefined' || !Zeichenziel.da())
            return;
        const ziel = TASTEN[event.key.toLowerCase()];
        if (!ziel)
            return;
        const leiste = aktiveLeiste();
        if (!leiste)
            return;
        const oben = document.querySelector('.document-drawingbar');
        const werkzeug = (id) => druecke(leiste.querySelector(`[data-wz="${id}"]`))
            || druecke(oben?.querySelector(`[data-document-tool="${id}"]`));
        if (ziel === 'bleistift') {
            if (druecke(leiste.querySelector('[data-act="stilwahl"][data-stil="bleistift"]')))
                event.preventDefault();
            if (Zeichenziel.jetzt() !== 'stift' && werkzeug('stift'))
                event.preventDefault();
            return;
        }
        if (ziel === 'stift' && Zeichenziel.jetzt() === 'stift') {
            const jetzt = leiste.querySelector('[data-act="stilwahl"].on');
            const i = STIFTE.findIndex(st => st.id === jetzt?.dataset.stil);
            const naechster = STIFTE[(i + 1) % STIFTE.length];
            if (druecke(leiste.querySelector(`[data-act="stilwahl"][data-stil="${naechster.id}"]`)))
                event.preventDefault();
            return;
        }
        if (ziel === 'lineal') {
            if (druecke(leiste.querySelector('[data-act="lineal"]'))
                || druecke(oben?.querySelector('[data-document-action="ink-ruler"]')))
                event.preventDefault();
            return;
        }
        if (werkzeug(ziel))
            event.preventDefault();
    };
    if (typeof document !== 'undefined')
        document.addEventListener('keydown', kuerzel);
    return { schicht, leiste, zeichneMarke, verlaufDefs, annotierbar, alsAnnotation,
        FARBEN, BREITEN, STIFTE, LEITER, LASER, FORMEN, WERKZEUGE, artWort, artZeichen,
        druckFaktor, RADIERER, TASTEN,
        TINTEN, LEUCHTFARBEN, MARKER_PASTELLE, TEXTMARKER_FARBE, PAPIERWEISS, MARKER_SPITZEN,
        deckungVon, strokeWidth, halbeBreiten, kontrastZu, relativeHelligkeit, papierfarbeVon,
        strichprobeMarke, markerSpitzeLesen,
        HOECHSTENS_EIGENE_FARBEN, HOECHSTENS_FARBSAETZE,
        eigeneFarben, farbenSetzen, farbenZuruecksetzen,
        farbsaetze, farbsatzSichern, farbsatzLaden, farbsatzLoeschen,
        HOECHSTENS_ELEMENTE, HOECHSTENS_ELEMENT_BYTES,
        elemente, elementSichern, elementLoeschen, elementHolen, elementMarken,
        zwischenablage: () => zwischenablage.map(mark => clone(mark)) };
})();
window.Marken = Marken;
