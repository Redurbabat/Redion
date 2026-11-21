"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/zeichenflaeche.ts (npm run bauen:ts). */
const Zusatz = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const NS = 'http://www.w3.org/2000/svg';
    const sv = (name, attrs = {}) => {
        const e = document.createElementNS(NS, name);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
        return e;
    };
    const PALETTE = GfxShapes.PALETTE;
    const farbeVon = (i) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#529cca';
    const DIAGRAMM = {
        light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
        dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
    };
    const reihenModus = () => document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark';
    const reihenFarbe = (i, modus = reihenModus()) => {
        const liste = DIAGRAMM[modus];
        return liste[((i % liste.length) + liste.length) % liste.length] ?? '#2a78d6';
    };
    let reihenWache = null;
    const reihenWachen = () => {
        if (reihenWache || typeof MutationObserver !== 'function')
            return;
        reihenWache = new MutationObserver(() => {
            const m = reihenModus();
            document.querySelectorAll('.chart [data-reihe]').forEach(el => {
                const c = reihenFarbe(Number(el.getAttribute('data-reihe')) || 0, m);
                if (el instanceof HTMLElement)
                    el.style.background = c;
                else if (el.hasAttribute('data-reihe-strich'))
                    el.setAttribute('stroke', c);
                else
                    el.setAttribute('fill', c);
            });
        });
        reihenWache.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    };
    const whiteboard = (block) => {
        const daten = Array.isArray(block.shapes)
            ? JSON.parse(JSON.stringify(block.shapes)).filter((s) => s && typeof s === 'object' && !Array.isArray(s))
            : [];
        const RAUM_VERSION = 1;
        let werkzeug = 'stift';
        let farbe = PALETTE[0]?.[0] ?? '#529cca';
        const hoehe = block.hoehe || 380;
        const zahl = (wert, ersatz) => typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;
        const gespeichert = block.sicht && typeof block.sicht === 'object' ? block.sicht : {};
        const KLEINSTER = .1, GROESSTER = 4;
        const sicht = { x: zahl(gespeichert.x, 0), y: zahl(gespeichert.y, 0),
            z: Math.min(GROESSTER, Math.max(KLEINSTER, zahl(gespeichert.z, 1))) };
        let verbindeVon = null;
        const w = document.createElement('div');
        w.className = 'wb';
        const massstabZeigen = document.createElement('b');
        massstabZeigen.className = 'wb-massstab';
        massstabZeigen.setAttribute('aria-live', 'polite');
        massstabZeigen.textContent = '100 %';
        const WERKZEUG_IDS = ['zeiger', 'hand', 'verbindung', 'radierer',
            'stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'notiz', 'text', 'bild'];
        const farbMenue = () => {
            const kasten = document.createElement('div');
            kasten.className = 'gfx-tb-farben';
            for (const [c, n] of PALETTE) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'wb-farbe' + (c === farbe ? ' on' : '');
                b.dataset.c = c;
                b.style.background = c;
                b.title = n;
                b.setAttribute('aria-label', 'Farbe ' + n);
                kasten.append(b);
            }
            return kasten;
        };
        const mehrMenue = () => {
            const kasten = document.createElement('div');
            kasten.className = 'gfx-tb-liste';
            for (const [id, name] of [['leeren', 'Alles löschen'], ['png', 'Als Bild speichern']]) {
                const b = document.createElement('button');
                b.type = 'button';
                b.dataset.a = id;
                b.textContent = name;
                kasten.append(b);
            }
            return kasten;
        };
        const leiste = GfxToolbar.erstelle({
            werkzeuge: Register.werkzeuge.auswahl(WERKZEUG_IDS),
            aktionen: [
                { id: 'farbe', name: 'Farbe', titel: 'Farbe wählen', sym: 'palette', menue: true, kapsel: 'werkzeuge' },
                { id: 'kleiner', name: 'Verkleinern', sym: 'minus' },
                { id: 'groesser', name: 'Vergrössern', sym: 'plus' },
                { id: 'passend', name: 'Alles ins Bild', titel: 'Alles ins Bild holen', sym: 'maximize' },
                { id: 'zurueck', name: 'Schritt zurück', sym: 'undo', gesperrt: true },
                { id: 'vor', name: 'Schritt vorwärts', sym: 'redo', gesperrt: true },
                { id: 'mehr', name: 'Mehr', titel: 'Alles löschen, als Bild speichern', sym: 'dots', menue: true }
            ],
            zusatz: { groesser: massstabZeigen },
            aktiv: werkzeug,
            klasse: 'wb-tools',
            beschriftung: 'Werkzeuge der Zeichenfläche' +
                (String(block.text ?? '').trim() ? ` „${String(block.text).trim()}“` : ''),
            menue: (id) => id === 'farbe' ? farbMenue() : id === 'mehr' ? mehrMenue() : null,
            aufWerkzeug: (id) => {
                werkzeug = id;
                verbindeVon = null;
                if (werkzeug !== 'zeiger')
                    gewaehlt = null;
                w.classList.toggle('wb-schiebt', werkzeug === 'hand');
                male();
            },
            aufAktion: (id) => {
                if (id === 'zurueck')
                    schrittZurueck();
                if (id === 'vor')
                    schrittVor();
                if (id === 'leeren') {
                    if (!daten.length || confirm('Die ganze Zeichenfläche leeren?')) {
                        merken();
                        daten.length = 0;
                        male();
                        sichern();
                    }
                }
                if (id === 'kleiner')
                    massstab(sicht.z / 1.25);
                if (id === 'groesser')
                    massstab(sicht.z * 1.25);
                if (id === 'passend')
                    insBild();
                if (id === 'png')
                    alsBild(flaeche, hoehe);
            }
        });
        const flaeche = sv('svg', { class: 'wb-flaeche', width: '100%', height: hoehe });
        flaeche.style.height = hoehe + 'px';
        w.appendChild(flaeche);
        w.appendChild(leiste.element);
        leiste.element.style.setProperty('--wb-farbe', farbe);
        Register.symbole.fuelle(leiste.element);
        leiste.element.addEventListener('click', (e) => {
            const c = e.target?.closest('[data-c]');
            if (!c || !leiste.element.contains(c))
                return;
            farbe = c.dataset.c ?? farbe;
            leiste.element.style.setProperty('--wb-farbe', farbe);
            leiste.element.querySelectorAll('.wb-farbe').forEach(b => b.classList.toggle('on', b === c));
            leiste.schliesse();
        });
        const griff = document.createElement('div');
        griff.className = 'wb-griff';
        griff.title = 'Höhe ziehen';
        w.appendChild(griff);
        const SCHRITTE = 40;
        const verlauf = GfxHistory.erstelle(SCHRITTE);
        const abbild = () => JSON.stringify(daten);
        const merken = () => {
            verlauf.merken(abbild());
            standZeigen();
        };
        const einsetzen = (roh) => {
            daten.length = 0;
            JSON.parse(roh).forEach((form) => daten.push(form));
        };
        const schrittZurueck = () => {
            const vorher = verlauf.zurueck(abbild());
            if (vorher === null)
                return;
            einsetzen(vorher);
            standZeigen();
            male();
            sichern();
        };
        const schrittVor = () => {
            const naechster = verlauf.vor(abbild());
            if (naechster === null)
                return;
            einsetzen(naechster);
            standZeigen();
            male();
            sichern();
        };
        const standZeigen = () => {
            leiste.setzeGesperrt('zurueck', !verlauf.kannZurueck());
            leiste.setzeGesperrt('vor', !verlauf.kannVor());
        };
        const sichern = () => Store.updateBlock(block.id, { shapes: daten, raumVersion: RAUM_VERSION });
        const ausschnitt = () => {
            const r = flaeche.getBoundingClientRect();
            const breite = r.width > 4 ? r.width : 900;
            const hoch = r.height > 4 ? r.height : hoehe;
            return { x: sicht.x, y: sicht.y, w: breite / sicht.z, h: hoch / sicht.z };
        };
        const rahmenVon = (s) => GfxShapes.rahmenVon(s);
        const randPunkt = (rahmen, zielX, zielY) => {
            const mx = rahmen.x + rahmen.w / 2, my = rahmen.y + rahmen.h / 2;
            const dx = zielX - mx, dy = zielY - my;
            if (!dx && !dy)
                return [mx, my];
            const halbW = Math.max(1, rahmen.w / 2), halbH = Math.max(1, rahmen.h / 2);
            const anteil = Math.min(halbW / Math.abs(dx || .0001), halbH / Math.abs(dy || .0001));
            return [mx + dx * anteil, my + dy * anteil];
        };
        const male = () => {
            flaeche.innerHTML = '';
            const feld = ausschnitt();
            flaeche.setAttribute('viewBox', `${feld.x} ${feld.y} ${feld.w} ${feld.h}`);
            const raster = sv('pattern', { id: 'r' + block.id.slice(0, 6), width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
            raster.appendChild(sv('circle', { cx: 1, cy: 1, r: 1, fill: 'currentColor', opacity: .18 }));
            const defs = sv('defs');
            defs.appendChild(raster);
            GfxShapes.pfeilMarke(defs, 'p' + block.id.slice(0, 6));
            flaeche.appendChild(defs);
            flaeche.appendChild(sv('rect', { x: feld.x, y: feld.y, width: feld.w, height: feld.h,
                fill: `url(#r${block.id.slice(0, 6)})` }));
            daten.filter((s) => s.art === 'verbindung')
                .forEach((s) => { const linie = verbindungZeichnen(s); if (linie)
                flaeche.appendChild(linie); });
            daten.filter((s) => s.art !== 'verbindung')
                .forEach((s) => flaeche.appendChild(formZeichnen(s)));
            if (werkzeug === 'zeiger' && gewaehlt) {
                const s = daten.find((q) => q.id === gewaehlt);
                if (s && groessenFaehig(s)) {
                    const rahmen = rahmenVon(s);
                    const kante = GRIFF / sicht.z;
                    flaeche.appendChild(sv('rect', {
                        x: rahmen.x + rahmen.w - kante / 2, y: rahmen.y + rahmen.h - kante / 2,
                        width: kante, height: kante, rx: kante / 4,
                        fill: 'var(--accent)', stroke: 'var(--bg-card)',
                        'stroke-width': 1 / sicht.z, class: 'wb-griffpunkt'
                    }));
                }
            }
            massstabZeigen.textContent = Math.round(sicht.z * 100) + ' %';
        };
        const bildAdressen = new Map();
        const bildHolen = (dateiId) => {
            const ablage = globalThis.Dateien;
            if (!ablage?.adresse) {
                bildAdressen.set(dateiId, null);
                return;
            }
            bildAdressen.set(dateiId, null);
            Promise.resolve(ablage.adresse(dateiId)).then((url) => {
                bildAdressen.set(dateiId, url || null);
                if (url)
                    male();
            }).catch(() => { bildAdressen.set(dateiId, null); });
        };
        const bildWaehlen = (x, y) => {
            const ablage = globalThis.Dateien;
            if (!ablage?.ablegen) {
                UI.toast('Die Dateiablage ist noch nicht geladen');
                return;
            }
            const feld = document.createElement('input');
            feld.type = 'file';
            feld.accept = 'image/*';
            feld.addEventListener('change', async () => {
                const datei = feld.files?.[0];
                if (!datei)
                    return;
                try {
                    const satz = await ablage.ablegen(datei, { blockId: block.id });
                    const masse = await new Promise(fertig => {
                        const probe = new Image();
                        probe.onload = () => fertig({ w: probe.naturalWidth || 320, h: probe.naturalHeight || 240 });
                        probe.onerror = () => fertig({ w: 320, h: 240 });
                        probe.src = URL.createObjectURL(datei);
                    });
                    const breite = Math.min(360, masse.w);
                    merken();
                    daten.push({ id: Store.uid().slice(0, 8), art: 'bild', x, y,
                        w: Math.round(breite), h: Math.round(breite * masse.h / (masse.w || 1)),
                        farbe, dateiId: String(satz.id) });
                    male();
                    sichern();
                }
                catch (fehler) {
                    UI.toast(fehler instanceof Error ? fehler.message : 'Das Bild liess sich nicht ablegen');
                }
            });
            feld.click();
        };
        const textErfassen = (x, y, breite, hoehe, vorgabe) => new Promise(fertig => {
            const r = flaeche.getBoundingClientRect();
            const wRect = w.getBoundingClientRect();
            const feld = document.createElement('textarea');
            feld.className = 'wb-eingabe';
            feld.value = vorgabe;
            feld.style.left = Math.round((x - sicht.x) * sicht.z + (r.left - wRect.left)) + 'px';
            feld.style.top = Math.round((y - sicht.y) * sicht.z + (r.top - wRect.top)) + 'px';
            feld.style.width = Math.round(breite * sicht.z) + 'px';
            feld.style.height = Math.round(hoehe * sicht.z) + 'px';
            feld.style.color = farbe;
            w.appendChild(feld);
            let erledigt = false;
            const schliessen = (wert) => {
                if (erledigt)
                    return;
                erledigt = true;
                feld.remove();
                fertig(wert);
            };
            feld.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    schliessen(null);
                    return;
                }
                if (e.key === 'Enter' && (hoehe < 40 || e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    schliessen(feld.value);
                }
            });
            feld.addEventListener('blur', () => schliessen(feld.value));
            setTimeout(() => { feld.focus(); feld.select(); }, 0);
        });
        const groessenFaehig = (s) => s && s.art !== 'stift' && s.art !== 'verbindung' && s.art !== 'text';
        const verbindungZeichnen = (s) => {
            const a = daten.find((q) => q.id === s.von);
            const b = daten.find((q) => q.id === s.nach);
            if (!a || !b)
                return null;
            const ra = rahmenVon(a), rb = rahmenVon(b);
            const [x1, y1] = randPunkt(ra, rb.x + rb.w / 2, rb.y + rb.h / 2);
            const [x2, y2] = randPunkt(rb, ra.x + ra.w / 2, ra.y + ra.h / 2);
            const p = sv('path', {
                d: `M${x1} ${y1} L${x2} ${y2}`, stroke: s.farbe, 'stroke-width': 2,
                fill: 'none', 'stroke-dasharray': '6 4', 'marker-end': `url(#p${block.id.slice(0, 6)})`
            });
            p.dataset.sid = s.id;
            return p;
        };
        const formZeichnen = (s) => GfxShapes.zeichne(s, {
            pfeilMarke: 'p' + block.id.slice(0, 6),
            bildAdresse: (id) => bildAdressen.get(id),
            bildHolen: (id) => bildHolen(id)
        });
        const punkt = (e) => {
            const ueberMatrix = (typeof SheetSpace !== 'undefined' && SheetSpace.umrechner)
                ? SheetSpace.umrechner(flaeche)(e) : null;
            if (ueberMatrix)
                return [Math.round(ueberMatrix[0]), Math.round(ueberMatrix[1])];
            const r = flaeche.getBoundingClientRect();
            return [Math.round(sicht.x + (e.clientX - r.left) / sicht.z),
                Math.round(sicht.y + (e.clientY - r.top) / sicht.z)];
        };
        const punktFein = (e, convert) => {
            const ueberMatrix = convert ? convert(e) : (typeof SheetSpace !== 'undefined' && SheetSpace.umrechner)
                ? SheetSpace.umrechner(flaeche)(e) : null;
            const r2 = (v) => Math.round(v * 100) / 100;
            if (ueberMatrix)
                return [r2(ueberMatrix[0]), r2(ueberMatrix[1])];
            const r = flaeche.getBoundingClientRect();
            return [r2(sicht.x + (e.clientX - r.left) / sicht.z), r2(sicht.y + (e.clientY - r.top) / sicht.z)];
        };
        let stiftGlatt = null;
        let stiftDruck = null;
        let stiftZeit = 0;
        let stiftBildGeplant = false;
        let stiftZeiger = null;
        let stiftArt = '';
        const stiftNachziehen = () => {
            stiftBildGeplant = false;
            if (!aktiv || aktiv.art !== 'stift')
                return;
            const pfade = flaeche.querySelectorAll(`path[data-sid="${aktiv.id}"]`);
            if (!pfade.length) {
                male();
                return;
            }
            const neu = GfxShapes.zeichne({ ...aktiv }).querySelectorAll('path');
            pfade.forEach((pfad, i) => {
                const vorlage = neu[i];
                if (!vorlage)
                    return;
                for (const name of ['d', 'fill', 'stroke', 'stroke-width']) {
                    const wert = vorlage.getAttribute(name);
                    if (wert === null)
                        pfad.removeAttribute(name);
                    else
                        pfad.setAttribute(name, wert);
                }
                const tinte = vorlage.getAttribute('data-tinte');
                if (tinte)
                    pfad.setAttribute('data-tinte', tinte);
            });
        };
        const sichtSichern = () => Store.updateBlock(block.id, {
            sicht: { x: Math.round(sicht.x), y: Math.round(sicht.y),
                z: Math.round(sicht.z * 100) / 100 },
            raumVersion: RAUM_VERSION
        });
        const massstab = (neuZ, haltX, haltY) => {
            const r = flaeche.getBoundingClientRect();
            const z = Math.min(GROESSTER, Math.max(KLEINSTER, neuZ));
            const mx = haltX ?? sicht.x + (r.width || 900) / sicht.z / 2;
            const my = haltY ?? sicht.y + (r.height || hoehe) / sicht.z / 2;
            sicht.x = mx - (mx - sicht.x) * (sicht.z / z);
            sicht.y = my - (my - sicht.y) * (sicht.z / z);
            sicht.z = z;
            male();
            sichtSichern();
        };
        const insBild = () => {
            const formen = daten.filter((s) => s.art !== 'verbindung');
            if (!formen.length) {
                sicht.x = 0;
                sicht.y = 0;
                sicht.z = 1;
                male();
                sichtSichern();
                return;
            }
            const rahmen = formen.map(rahmenVon);
            const x1 = Math.min(...rahmen.map(r => r.x)) - 30;
            const y1 = Math.min(...rahmen.map(r => r.y)) - 30;
            const x2 = Math.max(...rahmen.map(r => r.x + r.w)) + 30;
            const y2 = Math.max(...rahmen.map(r => r.y + r.h)) + 30;
            const r = flaeche.getBoundingClientRect();
            const breite = r.width > 4 ? r.width : 900, hoch = r.height > 4 ? r.height : hoehe;
            sicht.z = Math.min(GROESSTER, Math.max(KLEINSTER, Math.min(breite / Math.max(1, x2 - x1), hoch / Math.max(1, y2 - y1))));
            sicht.x = x1 - (breite / sicht.z - (x2 - x1)) / 2;
            sicht.y = y1 - (hoch / sicht.z - (y2 - y1)) / 2;
            male();
            sichtSichern();
        };
        let gewaehlt = null;
        const GRIFF = 9;
        let aktiv = null, verschiebt = null, schiebt = null, groesst = null;
        const finger = new Map();
        let kneifen = null;
        w.tabIndex = 0;
        w.addEventListener('keydown', (e) => {
            const ziel = e.target;
            if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.isContentEditable))
                return;
            const strg = e.ctrlKey || e.metaKey;
            if (!strg)
                return;
            const taste = e.key.toLowerCase();
            if (taste === 'z' && !e.shiftKey) {
                e.preventDefault();
                schrittZurueck();
            }
            else if ((taste === 'z' && e.shiftKey) || (taste === 'y' && !e.shiftKey)) {
                e.preventDefault();
                schrittVor();
            }
        });
        flaeche.addEventListener('pointerdown', (e) => {
            if (stiftZeiger !== null) {
                if (stiftArt === 'pen' && e.pointerType === 'touch') {
                    e.preventDefault();
                    return;
                }
                fertig();
            }
            w.focus({ preventScroll: true });
            flaeche.setPointerCapture(e.pointerId);
            finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (finger.size === 2) {
                if (aktiv) {
                    daten.pop();
                    aktiv = null;
                    male();
                }
                const zwei = [...finger.values()];
                const dx = zwei[0].x - zwei[1].x, dy = zwei[0].y - zwei[1].y;
                kneifen = { abstand: Math.hypot(dx, dy) || 1, z: sicht.z };
                return;
            }
            const [x, y] = punkt(e);
            const maus = e.pointerType === 'mouse';
            if (werkzeug === 'hand' || (maus && e.button === 1)) {
                schiebt = { x: e.clientX, y: e.clientY, sx: sicht.x, sy: sicht.y };
                return;
            }
            if (maus && e.button !== 0)
                return;
            if (werkzeug === 'verbindung') {
                const sid = e.target.dataset?.sid;
                const s = daten.find((q) => q.id === sid && q.art !== 'verbindung');
                if (!s) {
                    UI.toast('Tippe zuerst auf die Form, von der die Verbindung ausgeht');
                    return;
                }
                if (!verbindeVon) {
                    verbindeVon = s.id;
                    UI.toast('Und jetzt auf die zweite Form');
                    return;
                }
                if (verbindeVon === s.id) {
                    verbindeVon = null;
                    return;
                }
                merken();
                daten.push({ id: Store.uid().slice(0, 8), art: 'verbindung', von: verbindeVon, nach: s.id, farbe });
                verbindeVon = null;
                male();
                sichern();
                return;
            }
            if (werkzeug === 'radierer') {
                const sid = e.target.dataset?.sid;
                if (sid) {
                    const i = daten.findIndex((s) => s.id === sid);
                    if (i >= 0) {
                        merken();
                        daten.splice(i, 1);
                        for (let j = daten.length - 1; j >= 0; j--)
                            if (daten[j].art === 'verbindung' && (daten[j].von === sid || daten[j].nach === sid))
                                daten.splice(j, 1);
                        male();
                        sichern();
                    }
                }
                return;
            }
            if (werkzeug === 'zeiger') {
                const gewaehlteForm = daten.find((q) => q.id === gewaehlt);
                if (gewaehlteForm && groessenFaehig(gewaehlteForm)) {
                    const rahmen = rahmenVon(gewaehlteForm);
                    const nah = GRIFF / sicht.z + 3;
                    if (Math.abs(x - (rahmen.x + rahmen.w)) <= nah &&
                        Math.abs(y - (rahmen.y + rahmen.h)) <= nah) {
                        merken();
                        groesst = { s: gewaehlteForm, x, y };
                        return;
                    }
                }
                const sid = e.target.dataset?.sid;
                const s = daten.find((q) => q.id === sid);
                gewaehlt = s ? String(s.id) : null;
                if (s) {
                    merken();
                    verschiebt = { s, x, y };
                }
                return;
            }
            if (werkzeug === 'bild') {
                bildWaehlen(x, y);
                return;
            }
            if (werkzeug === 'text' || werkzeug === 'notiz') {
                const art = werkzeug;
                void textErfassen(x, y, art === 'notiz' ? 170 : 220, art === 'notiz' ? 110 : 28, '')
                    .then(text => {
                    if (text === null || !text.trim())
                        return;
                    merken();
                    daten.push(art === 'notiz'
                        ? { id: Store.uid().slice(0, 8), art: 'notiz', x, y, w: 170, h: 110, farbe, text }
                        : { id: Store.uid().slice(0, 8), art: 'text', x, y, farbe, text });
                    male();
                    sichern();
                });
                return;
            }
            merken();
            const fein = werkzeug === 'stift' ? punktFein(e) : [x, y];
            aktiv = werkzeug === 'stift'
                ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [fein], farbe }
                : { id: Store.uid().slice(0, 8), art: werkzeug, x, y, w: 0, h: 0, farbe };
            stiftGlatt = werkzeug === 'stift' && typeof InkStroke !== 'undefined'
                ? InkStroke.glaetter(fein) : null;
            stiftDruck = null;
            if (werkzeug === 'stift' && e.pointerType === 'pen' && e.pressure > 0 && typeof InkStroke !== 'undefined') {
                stiftDruck = InkStroke.druckGlaetter(e.pressure);
                aktiv.pressure = [Math.round(e.pressure * 1000) / 1000];
            }
            stiftZeit = Number(e.timeStamp) || 0;
            if (werkzeug === 'stift') {
                stiftZeiger = e.pointerId;
                stiftArt = e.pointerType;
                window.addEventListener('pointerup', fertig, true);
                window.addEventListener('pointercancel', fertig, true);
                window.addEventListener('blur', stiftAbsetzen);
            }
            daten.push(aktiv);
        });
        flaeche.addEventListener('pointermove', (e) => {
            if (stiftZeiger !== null && e.pointerId !== stiftZeiger)
                return;
            if (finger.has(e.pointerId))
                finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (kneifen && finger.size >= 2) {
                const zwei = [...finger.values()];
                const dx = zwei[0].x - zwei[1].x, dy = zwei[0].y - zwei[1].y;
                const r = flaeche.getBoundingClientRect();
                const mitteX = sicht.x + ((zwei[0].x + zwei[1].x) / 2 - r.left) / sicht.z;
                const mitteY = sicht.y + ((zwei[0].y + zwei[1].y) / 2 - r.top) / sicht.z;
                massstab(kneifen.z * (Math.hypot(dx, dy) / kneifen.abstand), mitteX, mitteY);
                return;
            }
            if (schiebt) {
                sicht.x = schiebt.sx - (e.clientX - schiebt.x) / sicht.z;
                sicht.y = schiebt.sy - (e.clientY - schiebt.y) / sicht.z;
                male();
                return;
            }
            const [x, y] = punkt(e);
            if (groesst) {
                const s = groesst.s;
                const links = Math.min(s.x, s.x + s.w), oben = Math.min(s.y, s.y + s.h);
                s.x = links;
                s.y = oben;
                s.w = Math.max(8, Math.round(x - links));
                s.h = Math.max(8, Math.round(y - oben));
                male();
                return;
            }
            if (verschiebt) {
                const dx = x - verschiebt.x, dy = y - verschiebt.y;
                const s = verschiebt.s;
                if (s.art === 'stift')
                    s.pts = s.pts.map((p) => [p[0] + dx, p[1] + dy]);
                else {
                    s.x += dx;
                    s.y += dy;
                }
                verschiebt.x = x;
                verschiebt.y = y;
                male();
                return;
            }
            if (!aktiv)
                return;
            if (aktiv.art === 'stift') {
                const convert = SheetSpace.umrechner(flaeche);
                for (const ereignis of InkStroke.samples(e)) {
                    const roh = punktFein(ereignis, convert);
                    const jetzt = Number(ereignis.timeStamp) || stiftZeit + 16;
                    const dt = Math.max(1, jetzt - stiftZeit);
                    stiftZeit = jetzt;
                    const q = stiftGlatt ? stiftGlatt(roh, dt) : roh;
                    const letzter = aktiv.pts[aktiv.pts.length - 1];
                    if (letzter && Math.hypot(q[0] - letzter[0], q[1] - letzter[1]) < 0.6 / Math.max(0.1, sicht.z))
                        continue;
                    aktiv.pts.push([Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]);
                    if (aktiv.pressure)
                        aktiv.pressure.push(stiftDruck && ereignis.pressure > 0
                            ? stiftDruck(ereignis.pressure) : aktiv.pressure[aktiv.pressure.length - 1]);
                }
                if (!stiftBildGeplant) {
                    stiftBildGeplant = true;
                    requestAnimationFrame(stiftNachziehen);
                }
                return;
            }
            aktiv.w = x - aktiv.x;
            aktiv.h = y - aktiv.y;
            male();
        });
        const fertig = (e) => {
            if (stiftZeiger !== null && typeof e?.pointerId === 'number' && e.pointerId !== stiftZeiger)
                return;
            stiftZeiger = null;
            stiftArt = '';
            window.removeEventListener('pointerup', fertig, true);
            window.removeEventListener('pointercancel', fertig, true);
            window.removeEventListener('blur', stiftAbsetzen);
            if (e && typeof e.pointerId === 'number')
                finger.delete(e.pointerId);
            if (finger.size < 2)
                kneifen = null;
            if (schiebt) {
                schiebt = null;
                sichtSichern();
            }
            if (aktiv) {
                if (aktiv.art === 'stift' && aktiv.pts.length >= 2) {
                    if (e && typeof e.clientX === 'number' && e.type === 'pointerup') {
                        const roh = punktFein(e);
                        const letzter = aktiv.pts[aktiv.pts.length - 1];
                        if (Math.hypot(roh[0] - letzter[0], roh[1] - letzter[1]) >= 0.3) {
                            aktiv.pts.push(roh);
                            if (aktiv.pressure)
                                aktiv.pressure.push(aktiv.pressure[aktiv.pressure.length - 1]);
                        }
                    }
                    if (typeof InkGeometry !== 'undefined' && aktiv.pts.length > 3) {
                        const behalten = InkGeometry.simplifyIndices(aktiv.pts, 0.5 / Math.max(0.1, sicht.z));
                        const alt = aktiv;
                        aktiv.pts = behalten.map(i => [Math.round(Number(alt.pts[i][0]) * 100) / 100, Math.round(Number(alt.pts[i][1]) * 100) / 100]);
                        if (alt.pressure)
                            aktiv.pressure = behalten.map(i => alt.pressure[i]);
                    }
                }
                stiftGlatt = null;
                stiftDruck = null;
                const klein = aktiv.art === 'stift' ? aktiv.pts.length < 2 : Math.abs(aktiv.w) < 4 && Math.abs(aktiv.h) < 4;
                if (klein) {
                    daten.pop();
                    verlauf.letztenVerwerfen();
                    standZeigen();
                }
                aktiv = null;
                sichern();
                male();
            }
            if (verschiebt) {
                verschiebt = null;
                sichern();
                male();
            }
            if (groesst) {
                groesst = null;
                sichern();
                male();
            }
        };
        flaeche.addEventListener('pointerup', fertig);
        flaeche.addEventListener('pointercancel', fertig);
        const stiftAbsetzen = () => { if (stiftZeiger !== null)
            fertig(); };
        flaeche.addEventListener('lostpointercapture', stiftAbsetzen);
        flaeche.addEventListener('pointerleave', e => { if (!flaeche.hasPointerCapture(e.pointerId))
            fertig(e); });
        flaeche.addEventListener('dblclick', (e) => {
            const sid = e.target?.dataset?.sid;
            const s = daten.find((q) => q.id === sid);
            if (!s || (s.art !== 'notiz' && s.art !== 'text'))
                return;
            e.preventDefault();
            const rahmen = rahmenVon(s);
            void textErfassen(rahmen.x, rahmen.y, Math.max(120, rahmen.w), s.art === 'notiz' ? Math.max(60, rahmen.h) : 28, String(s.text || ''))
                .then(text => {
                if (text === null || text === s.text)
                    return;
                merken();
                s.text = text;
                male();
                sichern();
            });
        });
        flaeche.addEventListener('wheel', (e) => {
            e.preventDefault();
            const r = flaeche.getBoundingClientRect();
            massstab(sicht.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), sicht.x + (e.clientX - r.left) / sicht.z, sicht.y + (e.clientY - r.top) / sicht.z);
        }, { passive: false });
        griff.addEventListener('pointerdown', e => {
            e.preventDefault();
            const start = e.clientY, h0 = flaeche.getBoundingClientRect().height;
            const zug = (ev) => {
                const h = Math.max(180, Math.min(1200, h0 + ev.clientY - start));
                flaeche.style.height = h + 'px';
                flaeche.setAttribute('height', String(h));
            };
            const stop = () => {
                removeEventListener('pointermove', zug);
                removeEventListener('pointerup', stop);
                Store.updateBlock(block.id, { hoehe: Math.round(flaeche.getBoundingClientRect().height) });
            };
            addEventListener('pointermove', zug);
            addEventListener('pointerup', stop);
        });
        if (typeof ResizeObserver === 'function') {
            let letzte = '';
            new ResizeObserver(() => {
                const kasten = flaeche.getBoundingClientRect();
                const masse = Math.round(kasten.width) + '×' + Math.round(kasten.height);
                if (masse === letzte)
                    return;
                letzte = masse;
                male();
            }).observe(w);
        }
        male();
        return w;
    };
    const alsBild = (svgEl, hoehe) => {
        const kopie = svgEl.cloneNode(true);
        const breite = Math.round(svgEl.getBoundingClientRect().width);
        kopie.setAttribute('width', breite);
        kopie.setAttribute('height', hoehe);
        kopie.setAttribute('xmlns', NS);
        const quelle = new XMLSerializer().serializeToString(kopie);
        const bild = new Image();
        bild.onload = () => {
            const c = document.createElement('canvas');
            c.width = breite * 2;
            c.height = hoehe * 2;
            const g = c.getContext('2d');
            if (!g)
                return;
            g.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || '#fff';
            g.fillRect(0, 0, c.width, c.height);
            g.scale(2, 2);
            g.drawImage(bild, 0, 0);
            const a = document.createElement('a');
            a.href = c.toDataURL('image/png');
            a.download = 'whiteboard.png';
            a.click();
            UI.toast('Als PNG gespeichert');
        };
        bild.onerror = () => UI.toast('Das Bild liess sich nicht erzeugen');
        bild.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(quelle)));
    };
    const CHART_TYPEN = [['bar', 'Balken'], ['column', 'Säulen'], ['line', 'Linie'], ['donut', 'Ring'],
        ['area', 'Fläche'], ['kpi', 'Kennzahl']];
    const diagramm = (block) => {
        const w = document.createElement('div');
        w.className = 'chart';
        const typ = block.chartTyp || 'bar';
        const werte = chartDaten(block);
        reihenWachen();
        w.innerHTML =
            '<div class="chart-head">' +
                `<input class="chart-titel" value="${esc(block.text || '')}" placeholder="Titel des Diagramms">` +
                '<div class="chart-typen">' +
                CHART_TYPEN.map(([id, n]) => `<button data-ct="${id}"${id === typ ? ' class="on"' : ''}>${n}</button>`).join('') +
                '</div>' +
                '<button class="chart-daten" title="Daten bearbeiten">✎ Daten</button>' +
                '</div>';
        const flaeche = document.createElement('div');
        flaeche.className = 'chart-flaeche';
        w.appendChild(flaeche);
        if (!werte.length) {
            flaeche.innerHTML = '<div class="chart-leer">Noch keine Daten. Klicke auf <b>✎ Daten</b> ' +
                'und schreibe Zeilen wie <code>Montag: 12</code> — oder wähle dort ' +
                'eine Datenbank als Quelle.</div>';
        }
        else {
            flaeche.appendChild(chartSvg(typ, werte));
            const legende = document.createElement('div');
            legende.className = 'chart-legende';
            legende.innerHTML = werte.map((v, i) => `<span><i data-reihe="${i}" style="background:${reihenFarbe(i)}"></i>${esc(v.name)} ` +
                `<b>${Formula.anzeige(v.wert)}</b></span>`).join('');
            w.appendChild(legende);
        }
        w.querySelector('.chart-titel')?.addEventListener('input', e => {
            const feld = e.target;
            if (feld instanceof HTMLInputElement)
                Store.updateBlock(block.id, { text: feld.value });
        });
        w.querySelector('.chart-head')?.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-ct]');
            if (t) {
                Store.updateBlock(block.id, { chartTyp: t.dataset.ct });
                App.zeichneSeite();
                return;
            }
            if (elVon(e)?.closest('.chart-daten'))
                datenEditor(block);
        });
        return w;
    };
    const chartDaten = (block) => {
        if (block.quelleDb) {
            const c = Store.getCollection(block.quelleDb);
            if (c) {
                const gruppe = block.gruppeNach, mess = block.messen;
                const zeilen = Store.rowsOf(c.id);
                if (gruppe) {
                    const map = new Map();
                    zeilen.forEach((r) => {
                        const k = Formula.anzeige(Datenbank.wert(r, gruppe, c)) || '(leer)';
                        const v = mess ? Formula.zahl(Datenbank.wert(r, mess, c)) : 1;
                        map.set(k, (map.get(k) || 0) + v);
                    });
                    return [...map.entries()].map(([name, wert]) => ({ name, wert }));
                }
            }
        }
        return String(block.daten || '').split('\n')
            .map(z => z.trim()).filter(Boolean)
            .map(z => {
            const m = z.match(/^(.*?)[:;,\t]\s*(-?[\d.,]+)\s*$/);
            return m ? { name: (m[1] ?? '').trim(),
                wert: parseFloat((m[2] ?? '0').replace(',', '.')) || 0 } : null;
        })
            .filter(Boolean);
    };
    const chartSvg = (typ, werte) => {
        const B = 640, H = 260, pad = 34;
        if (typ === 'kpi') {
            const summe = werte.reduce((a, v) => a + v.wert, 0);
            const letzter = werte[werte.length - 1]?.wert ?? 0;
            const vorletzter = werte[werte.length - 2]?.wert ?? 0;
            const diff = vorletzter ? Math.round((letzter - vorletzter) / Math.abs(vorletzter) * 100) : 0;
            const s2 = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg' });
            const t1 = sv('text', { x: B / 2, y: 118, 'text-anchor': 'middle', 'font-size': 64,
                'font-weight': 700, fill: 'currentColor' });
            t1.textContent = Formula.anzeige(summe);
            s2.appendChild(t1);
            const t2 = sv('text', { x: B / 2, y: 152, 'text-anchor': 'middle', 'font-size': 15,
                fill: 'currentColor', opacity: .6 });
            t2.textContent = 'Summe aus ' + werte.length + (werte.length === 1 ? ' Wert' : ' Werten');
            s2.appendChild(t2);
            if (werte.length > 1) {
                const t3 = sv('text', { x: B / 2, y: 186, 'text-anchor': 'middle', 'font-size': 16,
                    style: diff >= 0 ? 'fill:var(--erfolg)' : 'fill:var(--gefahr)' });
                t3.textContent = (diff >= 0 ? '▲ +' : '▼ ') + diff + ' % gegenüber davor';
                s2.appendChild(t3);
            }
            return s2;
        }
        const max = Math.max(...werte.map((v) => v.wert), 1);
        const s = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg', preserveAspectRatio: 'xMidYMid meet' });
        if (typ === 'donut') {
            const summe = werte.reduce((a, v) => a + v.wert, 0) || 1;
            let winkel = -Math.PI / 2;
            const cx = B / 2, cy = H / 2, ra = 100, ri = 58;
            werte.forEach((v, i) => {
                const teil = v.wert / summe * Math.PI * 2;
                const gross = teil > Math.PI ? 1 : 0;
                const x1 = cx + Math.cos(winkel) * ra, y1 = cy + Math.sin(winkel) * ra;
                const x2 = cx + Math.cos(winkel + teil) * ra, y2 = cy + Math.sin(winkel + teil) * ra;
                const x3 = cx + Math.cos(winkel + teil) * ri, y3 = cy + Math.sin(winkel + teil) * ri;
                const x4 = cx + Math.cos(winkel) * ri, y4 = cy + Math.sin(winkel) * ri;
                const st = sv('path', {
                    d: `M${x1} ${y1} A${ra} ${ra} 0 ${gross} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${gross} 0 ${x4} ${y4} Z`,
                    fill: reihenFarbe(i), class: 'ch-teil', 'data-reihe': i
                });
                st.dataset.i = i;
                st.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
                s.appendChild(st);
                winkel += teil;
            });
            const t = sv('text', { x: cx, y: cy + 6, 'text-anchor': 'middle', 'font-size': 20, fill: 'currentColor' });
            t.textContent = Formula.anzeige(werte.reduce((a, v) => a + v.wert, 0));
            s.appendChild(t);
            return s;
        }
        const ganz = Number.isInteger(max) && max <= 8 && max >= 1;
        const stufen = ganz ? max : 4;
        for (let i = 0; i <= stufen; i++) {
            const y = pad + (H - pad * 2) * i / stufen;
            s.appendChild(sv('line', { x1: pad, y1: y, x2: B - 8, y2: y, stroke: 'currentColor', opacity: .13 }));
            const t = sv('text', { x: pad - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 10, fill: 'currentColor', opacity: .55 });
            const wert = max * (1 - i / stufen);
            t.textContent = ganz || Number.isInteger(wert)
                ? String(Math.round(wert))
                : String(Math.round(wert * 10) / 10);
            s.appendChild(t);
        }
        const n = werte.length;
        const feld = (B - pad - 12) / n;
        if (typ === 'line' || typ === 'area') {
            const punkte = werte.map((v, i) => [
                pad + feld * (i + 0.5),
                pad + (H - pad * 2) * (1 - v.wert / max)
            ]);
            if (typ === 'area') {
                s.appendChild(sv('path', {
                    d: `M${punkte[0][0]} ${H - pad} L` + punkte.map((p) => p.join(' ')).join(' L') +
                        ` L${punkte[n - 1][0]} ${H - pad} Z`,
                    fill: reihenFarbe(0), opacity: .22, 'data-reihe': 0
                }));
            }
            s.appendChild(sv('path', {
                d: 'M' + punkte.map((p) => p.join(' ')).join(' L'),
                stroke: reihenFarbe(0), 'stroke-width': 2.5, fill: 'none', 'stroke-linejoin': 'round',
                'data-reihe': 0, 'data-reihe-strich': ''
            }));
            punkte.forEach((p, i) => {
                const c = sv('circle', { cx: p[0], cy: p[1], r: 4, fill: reihenFarbe(0), class: 'ch-teil', 'data-reihe': 0 });
                c.dataset.i = i;
                c.appendChild(sv('title')).textContent = werte[i].name + ': ' + Formula.anzeige(werte[i].wert);
                s.appendChild(c);
            });
        }
        else {
            werte.forEach((v, i) => {
                const h = (H - pad * 2) * (v.wert / max);
                if (typ === 'bar' || typ === 'column') {
                    const rc = sv('rect', {
                        x: pad + feld * i + feld * 0.16, y: H - pad - h,
                        width: feld * 0.68, height: Math.max(1, h),
                        fill: reihenFarbe(i), rx: 3, class: 'ch-teil', 'data-reihe': i
                    });
                    rc.dataset.i = i;
                    rc.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
                    s.appendChild(rc);
                    const wt = sv('text', { x: pad + feld * i + feld * 0.5, y: Math.max(12, H - pad - h - 5),
                        'text-anchor': 'middle', 'font-size': 10.5,
                        fill: 'currentColor', opacity: .75 });
                    wt.textContent = Formula.anzeige(v.wert);
                    s.appendChild(wt);
                }
            });
        }
        werte.forEach((v, i) => {
            const t = sv('text', {
                x: pad + feld * (i + 0.5), y: H - pad + 15, 'text-anchor': 'middle',
                'font-size': 10.5, fill: 'currentColor', opacity: .7
            });
            t.textContent = String(v.name).slice(0, 12);
            s.appendChild(t);
        });
        return s;
    };
    const datenEditor = (block) => {
        const sammlungen = Object.values(Store.cache.collections)
            .filter(c => c && c.name)
            .sort((a, b) => String(a.name).localeCompare(String(b.name), 'de-CH'));
        const feldStil = 'width:100%; background:var(--bg-input); border:1px solid var(--line);' +
            'border-radius:8px; padding:8px 10px; outline:none; font-size:13.5px';
        const spaltenWahl = (c, gewaehlt, nurZahlen) => {
            const schema = c?.schema || {};
            const passend = Object.keys(schema).filter(key => !nurZahlen || schema[key]?.type === 'number' || schema[key]?.type === 'formula');
            return (nurZahlen ? '<option value="">Zeilen zählen</option>' : '') +
                passend.map(key => `<option value="${esc(key)}"${key === gewaehlt ? ' selected' : ''}>` +
                    esc(schema[key]?.name || key) + '</option>').join('');
        };
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(560px,94vw)">' +
                '<div class="fh">Daten des Diagramms</div>' +
                '<div style="padding:14px 18px; display:flex; flex-direction:column; gap:10px">' +
                '<label style="font-size:12.5px; color:var(--text-dim)">Quelle' +
                `<select id="cq" style="${feldStil}; margin-top:4px">` +
                '<option value="">Handdaten — Zeilen unten</option>' +
                sammlungen.map(c => `<option value="${esc(c.id)}"${c.id === block.quelleDb ? ' selected' : ''}>` +
                    'Datenbank: ' + esc(c.name) + '</option>').join('') +
                '</select></label>' +
                '<div id="cq-felder" style="display:flex; gap:10px"' + (block.quelleDb ? '' : ' hidden') + '>' +
                '<label style="flex:1; font-size:12.5px; color:var(--text-dim)">Gruppieren nach' +
                `<select id="cg" style="${feldStil}; margin-top:4px"></select></label>` +
                '<label style="flex:1; font-size:12.5px; color:var(--text-dim)">Messen' +
                `<select id="cm" style="${feldStil}; margin-top:4px"></select></label>` +
                '</div>' +
                '<div id="cq-hand"' + (block.quelleDb ? ' hidden' : '') + '>' +
                '<textarea id="cd" rows="10" style="' + feldStil + '; font:13.5px var(--mono); resize:vertical">' +
                esc(block.daten || 'Montag: 12\nDienstag: 18\nMittwoch: 9') + '</textarea>' +
                '<div style="margin-top:8px; font-size:12.5px; color:var(--text-dim)">' +
                'Eine Zeile je Wert: <code>Name: Zahl</code></div>' +
                '</div>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const ta = o.querySelector('#cd');
        const quelle = o.querySelector('#cq');
        const gruppe = o.querySelector('#cg');
        const mess = o.querySelector('#cm');
        const felder = o.querySelector('#cq-felder');
        const hand = o.querySelector('#cq-hand');
        const spaltenFuellen = () => {
            const c = quelle?.value ? Store.getCollection(quelle.value) : null;
            if (gruppe)
                gruppe.innerHTML = c ? spaltenWahl(c, block.gruppeNach || '', false) : '';
            if (mess)
                mess.innerHTML = c ? spaltenWahl(c, block.messen || '', true) : '';
            if (felder)
                felder.hidden = !c;
            if (hand)
                hand.hidden = !!c;
        };
        spaltenFuellen();
        quelle?.addEventListener('change', spaltenFuellen);
        (quelle?.value ? quelle : ta)?.focus();
        o.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="ok"]')) {
                if (quelle?.value) {
                    Store.updateBlock(block.id, { quelleDb: quelle.value,
                        gruppeNach: gruppe?.value || '', messen: mess?.value || '' });
                }
                else {
                    Store.updateBlock(block.id, { quelleDb: '', gruppeNach: '', messen: '',
                        daten: ta ? ta.value : block.daten });
                }
                o.remove();
                App.zeichneSeite();
            }
            else if (elVon(e)?.closest('[data-a="zu"]') || e.target === o)
                o.remove();
        });
    };
    const tabelle = (block) => {
        const rows = block.rows && block.rows.length ? block.rows : [['', '', ''], ['', '', ''], ['', '', '']];
        const kopf = block.kopfZeile !== false;
        const kopfSpalte = !!block.kopfSpalte;
        const w = document.createElement('div');
        w.className = 'stab-wrap';
        const t = document.createElement('table');
        t.className = 'stab' + (kopf ? ' kopf' : '') + (kopfSpalte ? ' kopfspalte' : '');
        rows.forEach((zeile, y) => {
            const tr = document.createElement('tr');
            zeile.forEach((zelle, x) => {
                const td = document.createElement(kopf && y === 0 ? 'th' : 'td');
                td.contentEditable = 'true';
                td.spellcheck = false;
                td.innerHTML = Blocks.inline(zelle || '');
                td.dataset.x = x;
                td.dataset.y = y;
                td.addEventListener('input', () => {
                    rows[y][x] = td.textContent;
                    Store.updateBlock(block.id, { rows });
                });
                td.addEventListener('keydown', e => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const naechste = t.querySelectorAll('td,th');
                        const i = [...naechste].indexOf(td);
                        const z = naechste[i + (e.shiftKey ? -1 : 1)];
                        if (z) {
                            z.focus();
                            document.execCommand?.('selectAll', false);
                        }
                    }
                });
                tr.appendChild(td);
            });
            t.appendChild(tr);
        });
        w.appendChild(t);
        const gX = document.createElement('div');
        gX.className = 'stab-griff x';
        const gY = document.createElement('div');
        gY.className = 'stab-griff y';
        w.append(gX, gY);
        let aktivX = 0, aktivY = 0;
        t.addEventListener('mouseover', (e) => {
            const zelle = elVon(e)?.closest('td,th');
            if (!zelle)
                return;
            aktivX = Number(zelle.dataset.x);
            aktivY = Number(zelle.dataset.y);
            const rz = zelle.getBoundingClientRect();
            const rw = w.getBoundingClientRect();
            gX.style.left = (rz.left - rw.left) + 'px';
            gX.style.width = rz.width + 'px';
            gX.style.top = '2px';
            gY.style.top = (rz.top - rw.top) + 'px';
            gY.style.height = rz.height + 'px';
            gY.style.left = '2px';
            gX.classList.add('da');
            gY.classList.add('da');
        });
        w.addEventListener('mouseleave', () => { gX.classList.remove('da'); gY.classList.remove('da'); });
        const sichern = () => { Store.updateBlock(block.id, { rows }); App.zeichneSeite(); };
        gX.addEventListener('click', () => {
            const r = gX.getBoundingClientRect();
            const m = UI.menu(`<div class="grp">Spalte ${aktivX + 1}</div>` +
                '<button data-a="links"><span class="mi">←</span>Spalte links einfügen</button>' +
                '<button data-a="rechts"><span class="mi">→</span>Spalte rechts einfügen</button>' +
                '<button data-a="vor"><span class="mi">⇤</span>Nach links schieben</button>' +
                '<button data-a="zurueck"><span class="mi">⇥</span>Nach rechts schieben</button>' +
                `<button data-a="kopfsp"><span class="mi">▤</span>Als Kopfspalte<span class="ms">${kopfSpalte ? 'an' : 'aus'}</span></button>` +
                '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
                '<hr><button data-a="weg" data-gefahr><span class="mi">🗑</span>Spalte löschen</button>', r.left, r.bottom + 6);
            m.addEventListener('click', e => {
                const b = elVon(e)?.closest('button[data-a]');
                if (!b)
                    return;
                const a = b.dataset.a;
                m.remove();
                if (a === 'links')
                    rows.forEach((z) => z.splice(aktivX, 0, ''));
                if (a === 'rechts')
                    rows.forEach((z) => z.splice(aktivX + 1, 0, ''));
                if (a === 'weg' && rows[0].length > 1)
                    rows.forEach((z) => z.splice(aktivX, 1));
                if (a === 'leeren')
                    rows.forEach((z) => z[aktivX] = '');
                if (a === 'vor' && aktivX > 0)
                    rows.forEach((z) => z.splice(aktivX - 1, 0, z.splice(aktivX, 1)[0]));
                if (a === 'zurueck' && aktivX < rows[0].length - 1)
                    rows.forEach((z) => z.splice(aktivX + 1, 0, z.splice(aktivX, 1)[0]));
                if (a === 'kopfsp') {
                    Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte });
                    App.zeichneSeite();
                    return;
                }
                sichern();
            });
        });
        gY.addEventListener('click', () => {
            const r = gY.getBoundingClientRect();
            const m = UI.menu(`<div class="grp">Zeile ${aktivY + 1}</div>` +
                '<button data-a="oben"><span class="mi">↑</span>Zeile darüber einfügen</button>' +
                '<button data-a="unten"><span class="mi">↓</span>Zeile darunter einfügen</button>' +
                '<button data-a="hoch"><span class="mi">⇧</span>Nach oben schieben</button>' +
                '<button data-a="runter"><span class="mi">⇩</span>Nach unten schieben</button>' +
                `<button data-a="kopf"><span class="mi">▥</span>Als Kopfzeile<span class="ms">${kopf ? 'an' : 'aus'}</span></button>` +
                '<button data-a="dup"><span class="mi">⧉</span>Zeile duplizieren</button>' +
                '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
                '<hr><button data-a="weg" data-gefahr><span class="mi">🗑</span>Zeile löschen</button>', r.right + 6, r.top);
            m.addEventListener('click', e => {
                const b = elVon(e)?.closest('button[data-a]');
                if (!b)
                    return;
                const a = b.dataset.a;
                m.remove();
                const leer = () => new Array(rows[0].length).fill('');
                if (a === 'oben')
                    rows.splice(aktivY, 0, leer());
                if (a === 'unten')
                    rows.splice(aktivY + 1, 0, leer());
                if (a === 'weg' && rows.length > 1)
                    rows.splice(aktivY, 1);
                if (a === 'dup')
                    rows.splice(aktivY + 1, 0, rows[aktivY].slice());
                if (a === 'leeren')
                    rows[aktivY] = leer();
                if (a === 'hoch' && aktivY > 0)
                    rows.splice(aktivY - 1, 0, rows.splice(aktivY, 1)[0]);
                if (a === 'runter' && aktivY < rows.length - 1)
                    rows.splice(aktivY + 1, 0, rows.splice(aktivY, 1)[0]);
                if (a === 'kopf') {
                    Store.updateBlock(block.id, { kopfZeile: !kopf });
                    App.zeichneSeite();
                    return;
                }
                sichern();
            });
        });
        t.addEventListener('contextmenu', (e) => {
            const zelle = elVon(e)?.closest('td,th');
            if (!zelle)
                return;
            e.preventDefault();
            aktivX = Number(zelle.dataset.x);
            aktivY = Number(zelle.dataset.y);
            gY.click();
        });
        const werkzeuge = document.createElement('div');
        werkzeuge.className = 'stab-tools';
        werkzeuge.innerHTML =
            '<button data-a="sp+">Spalte +</button><button data-a="sp-">Spalte −</button>' +
                '<button data-a="ze+">Zeile +</button><button data-a="ze-">Zeile −</button>' +
                `<button data-a="kopf" class="${kopf ? 'on' : ''}">Kopfzeile</button>` +
                `<button data-a="kopfsp" class="${kopfSpalte ? 'on' : ''}">Kopfspalte</button>` +
                '<button data-a="csv">Als CSV</button>';
        werkzeuge.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            if (a === 'sp+')
                rows.forEach((z) => z.push(''));
            if (a === 'sp-' && rows[0].length > 1)
                rows.forEach((z) => z.pop());
            if (a === 'ze+')
                rows.push(new Array(rows[0].length).fill(''));
            if (a === 'ze-' && rows.length > 1)
                rows.pop();
            if (a === 'kopf') {
                Store.updateBlock(block.id, { kopfZeile: !kopf });
                App.zeichneSeite();
                return;
            }
            if (a === 'kopfsp') {
                Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte });
                App.zeichneSeite();
                return;
            }
            if (a === 'csv') {
                const csv = rows.map((z) => z.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
                const l = document.createElement('a');
                l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                l.download = 'tabelle.csv';
                l.click();
                UI.toast('Tabelle als CSV gespeichert');
                return;
            }
            Store.updateBlock(block.id, { rows });
            App.zeichneSeite();
        });
        w.appendChild(werkzeuge);
        return w;
    };
    const GRIECHISCH = {
        alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
        iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ',
        tau: 'τ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
        Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
    };
    const ZEICHEN = {
        times: '×', div: '÷', pm: '±', mp: '∓', cdot: '·', leq: '≤', geq: '≥', neq: '≠', approx: '≈',
        equiv: '≡', propto: '∝', infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃',
        in: '∈', notin: '∉', subset: '⊂', supset: '⊃', cup: '∪', cap: '∩', emptyset: '∅',
        rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', leftrightarrow: '↔',
        sum: '∑', prod: '∏', int: '∫', iint: '∬', oint: '∮', sqrt: '√', angle: '∠', deg: '°',
        ldots: '…', cdots: '⋯', therefore: '∴', because: '∵', ne: '≠', le: '≤', ge: '≥'
    };
    const mathe = (roh) => {
        let s = esc(roh || '');
        for (let i = 0; i < 4; i++) {
            s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="mfrac"><span class="mz">$1</span><span class="mn">$2</span></span>');
        }
        s = s.replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, '<sup class="mw">$1</sup>√<span class="munter">$2</span>');
        s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="munter">$1</span>');
        s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '<span class="mtext">$1</span>');
        s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^(\w)/g, '<sup>$1</sup>');
        s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/_(\w)/g, '<sub>$1</sub>');
        s = s.replace(/\\([A-Za-z]+)/g, (_, name) => GRIECHISCH[name] ||
            ZEICHEN[name] ||
            ('<span class="mop">' + name + '</span>'));
        s = s.replace(/[{}]/g, '');
        return '<span class="mathe">' + s + '</span>';
    };
    const formelBlock = (block) => {
        const w = document.createElement('div');
        w.className = 'eq';
        const anzeige = document.createElement('div');
        anzeige.className = 'eq-out';
        anzeige.innerHTML = block.text ? mathe(block.text)
            : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen — z. B. E = mc^2 oder \\frac{a}{b}</span>';
        const quelle = document.createElement('textarea');
        quelle.className = 'eq-src';
        quelle.value = block.text || '';
        quelle.rows = 2;
        quelle.spellcheck = false;
        quelle.style.display = 'none';
        quelle.placeholder = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
        anzeige.addEventListener('click', () => {
            anzeige.style.display = 'none';
            quelle.style.display = '';
            quelle.focus();
        });
        const zurueck = () => {
            Store.updateBlock(block.id, { text: quelle.value });
            anzeige.innerHTML = quelle.value ? mathe(quelle.value)
                : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen …</span>';
            quelle.style.display = 'none';
            anzeige.style.display = '';
        };
        quelle.addEventListener('blur', zurueck);
        quelle.addEventListener('input', () => Store.updateBlock(block.id, { text: quelle.value }));
        quelle.addEventListener('keydown', e => { if (e.key === 'Escape')
            zurueck(); });
        w.appendChild(anzeige);
        w.appendChild(quelle);
        return w;
    };
    const SCHLUESSEL = {
        javascript: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof await async try catch finally throw import export default null undefined true false',
        typescript: 'const let var function return if else for while interface type enum implements public private readonly await async class extends import export null undefined true false',
        python: 'def class return if elif else for while in not and or is None True False import from as with try except finally raise lambda yield global pass break continue',
        java: 'public private protected class interface extends implements return if else for while new static final void int double String boolean true false null import package try catch',
        'c++': 'int double float char void class struct public private return if else for while new delete const static template typename namespace using include true false nullptr',
        'c#': 'public private class interface var return if else foreach for while new static void string int bool true false null using namespace try catch',
        go: 'func package import return if else for range var const type struct interface go defer chan map nil true false',
        rust: 'fn let mut struct enum impl trait pub use mod match if else for while loop return Some None Ok Err true false',
        php: 'function class return if else foreach for while new public private echo print require include namespace use true false null',
        ruby: 'def class module return if elsif else unless while do end require attr_accessor true false nil yield',
        sql: 'select from where group by order having join left right inner outer on as insert into values update set delete create table alter drop index and or not null distinct limit',
        html: '',
        css: '',
        json: 'true false null',
        bash: 'if then else fi for while do done case esac function return export echo cd ls sudo apt npm git',
        yaml: 'true false null',
        markdown: ''
    };
    const einfaerben = (code, sprache) => {
        const lang = String(sprache || '').toLowerCase().replace('plain text', '');
        const roh = esc(code);
        if (!lang || lang === 'markdown')
            return roh;
        if (lang === 'html' || lang === 'xml') {
            return roh
                .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="c-kom">$1</span>')
                .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="c-schl">$2</span>')
                .replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;|"[^"]*")/g, '<span class="c-attr">$1</span>=<span class="c-txt">$2</span>');
        }
        if (lang === 'css' || lang === 'scss' || lang === 'less') {
            return roh
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="c-kom">$1</span>')
                .replace(/^([^{}\n]+)(\{)/gm, '<span class="c-schl">$1</span>$2')
                .replace(/([a-z-]+)(\s*:\s*)([^;\n]+)(;)/g, '<span class="c-attr">$1</span>$2<span class="c-txt">$3</span>$4');
        }
        const woerter = (SCHLUESSEL[lang] || SCHLUESSEL.javascript)
            .split(' ').filter(Boolean);
        let out = roh;
        const sicher = [];
        const parke = (treffer, klasse) => {
            sicher.push('<span class="' + klasse + '">' + treffer + '</span>');
            return '\u0002' + String.fromCharCode(0xE000 + sicher.length - 1) + '\u0002';
        };
        out = out
            .replace(/(&quot;[^&]*?&quot;|'[^'\n]*'|`[^`]*`|"[^"\n]*")/g, m => parke(m, 'c-txt'))
            .replace(/(\/\/[^\n]*|#[^\n]*|--[^\n]*)/g, m => parke(m, 'c-kom'))
            .replace(/(\/\*[\s\S]*?\*\/|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, m => parke(m, 'c-kom'));
        if (woerter.length) {
            const re = new RegExp('\\b(' + woerter.join('|') + ')\\b', 'g');
            out = out.replace(re, '<span class="c-schl">$1</span>');
        }
        out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="c-zahl">$1</span>');
        out = out.replace(/([a-zA-Z_][\w]*)(\()/g, '<span class="c-fkt">$1</span>$2');
        return out.replace(/\u0002([\uE000-\uF8FF])\u0002/g, (_, z) => sicher[z.charCodeAt(0) - 0xE000]);
    };
    return { whiteboard, diagramm, tabelle, mathe, formelBlock, chartSvg, chartDaten,
        einfaerben, SCHLUESSEL, PALETTE, farbeVon, DIAGRAMM, reihenFarbe };
})();
window.Zusatz = Zusatz;
