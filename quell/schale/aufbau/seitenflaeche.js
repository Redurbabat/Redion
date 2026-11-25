"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/seitenflaeche.ts (npm run bauen:ts). */
const Seitenflaeche = (() => {
    const ZOOM_MIN = 0.1;
    const ZOOM_MAX = 6.0;
    const RASTER = 20;
    const RAUM_VERSION = 1;
    const vorgabeBreite = () => Math.min(760, Math.max(280, (window.innerWidth || 760) - 40));
    let vorschlag = null;
    const zahl = (roh, ersatz) => {
        const n = Number(roh);
        return Number.isFinite(n) ? n : ersatz;
    };
    const sichtSchluessel = (id) => 'flaeche:' + id;
    const sichtLesen = (id) => {
        const roh = Store.getMeta(sichtSchluessel(id), null);
        if (!roh || typeof roh !== 'object')
            return null;
        const s = roh;
        if (!Number.isFinite(Number(s['z'])))
            return null;
        return { x: zahl(s['x'], 0), y: zahl(s['y'], 0), z: zahl(s['z'], 1) };
    };
    const sichtSchreiben = (id, s) => {
        Store.setMeta(sichtSchluessel(id), { x: s.x, y: s.y, z: s.z });
    };
    const notizLesen = (p) => {
        const roh = p?.flaecheNotiz;
        if (!roh || typeof roh !== 'object')
            return { x: 0, y: 0, w: vorgabeBreite() };
        return {
            x: zahl(roh.x, 0), y: zahl(roh.y, 0),
            w: Math.max(240, zahl(roh.w, vorgabeBreite()))
        };
    };
    const notizSchreiben = (p, ort) => {
        Store.updateBlock(p.id, {
            flaecheNotiz: { x: Math.round(ort.x), y: Math.round(ort.y), w: Math.round(ort.w), raumVersion: RAUM_VERSION }
        });
    };
    const BLOCK_BREITE = 380;
    const ortLesbar = (roh) => (typeof Register !== 'undefined' && Register.seitenansichten)
        ? Register.seitenansichten.ortLesbar(roh)
        : !!roh;
    const blockOrt = (b) => {
        const roh = b?.flaecheOrt;
        if (!ortLesbar(roh))
            return { x: 0, y: 0, w: BLOCK_BREITE };
        return {
            x: zahl(roh.x, 0), y: zahl(roh.y, 0),
            w: Math.max(160, zahl(roh.w, BLOCK_BREITE))
        };
    };
    const blockOrtSchreiben = (b, ort) => {
        Store.updateBlock(b.id, {
            flaecheOrt: {
                x: Math.round(ort.x), y: Math.round(ort.y), w: Math.round(ort.w),
                raumVersion: RAUM_VERSION
            }
        });
    };
    const eigeneKaesten = (p) => {
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn : () => true;
        const raus = [];
        for (const b of Store.childrenOf(p.id)) {
            if (!b || !b.flaecheOrt || !zeigtIn(b, 'flaeche'))
                continue;
            if (!ortLesbar(b.flaecheOrt)) {
                console.warn('Redion: Block „' + String(b.id) +
                    '" hat einen unlesbaren `flaecheOrt` und bleibt im Text.', b.flaecheOrt);
                continue;
            }
            raus.push(b);
        }
        return raus;
    };
    const formenLesen = (p) => Array.isArray(p?.shapes) ? p.shapes : [];
    const formenSchreiben = (p, formen) => {
        if (!formen.length) {
            Store.feldWeg(p.id, 'shapes', 'raumVersion');
            return;
        }
        Store.updateBlock(p.id, { shapes: formen, raumVersion: RAUM_VERSION });
    };
    const aufFlaeche = (b, ort) => {
        if (!b?.id)
            return;
        const seite = Store.getBlock(b.parentId);
        if (!seite)
            return;
        let stelle = ort;
        if (!stelle && vorschlag)
            stelle = vorschlag();
        if (!stelle) {
            const sk = notizLesen(seite);
            const schon = eigeneKaesten(seite).length;
            const eng = (window.innerWidth || 1200) < 900;
            stelle = eng
                ? { x: sk.x, y: sk.y + 420 + schon * 150 }
                : { x: sk.x + sk.w + 60, y: sk.y + schon * 150 };
        }
        blockOrtSchreiben(b, { x: stelle.x, y: stelle.y, w: blockOrt(b).w });
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    const zurueckInText = (b) => {
        if (!b?.id)
            return;
        if (String(b.sichtbarIn) === 'flaeche')
            Store.updateBlock(b.id, { sichtbarIn: 'beides' });
        Store.feldWeg(b.id, 'flaecheOrt');
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    const setzeZeigen = (b, wert) => {
        const kat = (typeof Register !== 'undefined') ? Register.seitenansichten : null;
        if (!b?.id || !kat || !kat.ZEIGEN.includes(wert))
            return;
        if (wert === kat.ZEIGEN_VORGABE)
            Store.feldWeg(b.id, 'sichtbarIn');
        else
            Store.updateBlock(b.id, { sichtbarIn: wert });
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    const zeichne = (wrap, p) => {
        vorschlag = null;
        const flaeche = document.createElement('div');
        flaeche.className = 'pg-flaeche';
        flaeche.setAttribute('role', 'application');
        flaeche.setAttribute('aria-label', 'Fläche der Seite ' + (p.text || 'Ohne Titel'));
        const ebene = document.createElement('div');
        ebene.className = 'pg-fl-sicht';
        flaeche.appendChild(ebene);
        const tinte = GfxShapes.sv('svg', { width: 1, height: 1, class: 'pg-fl-tinte' });
        const tinteDefs = GfxShapes.sv('defs');
        const pfeil = 'pfl' + String(p.id).slice(0, 6);
        GfxShapes.pfeilMarke(tinteDefs, pfeil);
        tinte.appendChild(tinteDefs);
        ebene.appendChild(tinte);
        const kaesten = [];
        const kastenBauen = (plan) => {
            const b = plan.block;
            const kasten = document.createElement('div');
            kasten.className = 'pg-fl-notiz';
            if (plan.art === 'seite')
                kasten.dataset['flSeite'] = '1';
            else
                kasten.dataset['flBlock'] = String(b.id);
            kasten.style.left = plan.ort.x + 'px';
            kasten.style.top = plan.ort.y + 'px';
            kasten.style.width = plan.ort.w + 'px';
            const kopf = document.createElement('div');
            kopf.className = 'pg-fl-kopf';
            if (plan.art === 'seite') {
                const symAlt = wrap.querySelector('.pg-icon');
                const titelAlt = wrap.querySelector('#title');
                if (symAlt)
                    kopf.appendChild(symAlt);
                if (titelAlt)
                    kopf.appendChild(titelAlt);
                if (!symAlt) {
                    const sym = document.createElement('span');
                    sym.className = 'pg-icon';
                    sym.setAttribute('aria-hidden', 'true');
                    sym.textContent = b.icon || '📄';
                    kopf.appendChild(sym);
                }
                if (!titelAlt) {
                    const name = document.createElement('div');
                    name.className = 'pg-fl-name';
                    name.textContent = b.text || 'Ohne Titel';
                    kopf.appendChild(name);
                }
            }
            else {
                const typ = (typeof Register !== 'undefined' && Register.bloecke?.eines)
                    ? Register.bloecke.eines(b.type) : null;
                const sym = document.createElement('span');
                sym.className = 'pg-icon';
                sym.setAttribute('aria-hidden', 'true');
                sym.textContent = b.icon || typ?.icon || '¶';
                const name = document.createElement('div');
                name.className = 'pg-fl-name';
                name.textContent = typ?.name || 'Block';
                kopf.append(sym, name);
                if (String(b.sichtbarIn) === 'flaeche') {
                    const hin = document.createElement('span');
                    hin.className = 'pg-fl-versteckt';
                    hin.textContent = 'nicht auf der Seite';
                    kopf.appendChild(hin);
                }
            }
            const menue = document.createElement('button');
            menue.type = 'button';
            menue.className = 'pg-fl-menue';
            menue.dataset['a'] = 'menu';
            menue.title = 'Was mit diesem Kasten geschehen soll';
            menue.setAttribute('aria-label', plan.art === 'seite' ? 'Menü des Seitenkastens' : 'Menü dieses Kastens');
            menue.textContent = '⋯';
            kopf.appendChild(menue);
            menue.addEventListener('click', (e) => { e.stopPropagation(); kastenMenue(menue, plan); });
            kasten.appendChild(kopf);
            const koerper = document.createElement('div');
            koerper.className = 'pg-fl-koerper';
            kasten.appendChild(koerper);
            if (plan.art === 'seite') {
                Inhaltsflaeche.zeichne(koerper, b, 'flaeche');
                if (!koerper.querySelector('.blk')) {
                    const leer = document.createElement('div');
                    leer.className = 'pg-fl-leer';
                    leer.textContent = 'Alles liegt auf der Fläche. Einen Kasten hierher ziehen bringt ihn zurück in den Text.';
                    koerper.appendChild(leer);
                }
            }
            else {
                koerper.appendChild(Blocks.render(b));
            }
            kaesten.push({ el: kasten, plan });
            ebene.appendChild(kasten);
            return kasten;
        };
        const kastenMenue = (anker, plan) => {
            const r = anker.getBoundingClientRect();
            const b = plan.block;
            const nurFlaeche = String(b.sichtbarIn) === 'flaeche';
            const html = plan.art === 'seite'
                ? '<button data-a="fl-passend"><span class="mi">⛶</span>Alles ins Bild holen</button>'
                : '<button data-a="fl-zurueck"><span class="mi">▤</span>Zurück in den Text</button>' +
                    (nurFlaeche
                        ? '<button data-a="fl-zeigen"><span class="mi">👁</span>Auf der Seite wieder zeigen</button>'
                        : '<button data-a="fl-verstecken"><span class="mi">🚫</span>Auf der Seite ausblenden</button>');
            const menu = UI.menu(html, Math.min(r.left, innerWidth - 260), r.bottom + 4);
            menu.addEventListener('click', (e) => {
                const btn = e.target instanceof Element
                    ? e.target.closest('button[data-a]') : null;
                if (!btn)
                    return;
                menu.remove();
                if (btn.dataset['a'] === 'fl-passend')
                    passend();
                if (btn.dataset['a'] === 'fl-zurueck')
                    zurueckInText(b);
                if (btn.dataset['a'] === 'fl-verstecken')
                    setzeZeigen(b, 'flaeche');
                if (btn.dataset['a'] === 'fl-zeigen')
                    setzeZeigen(b, 'beides');
            });
        };
        const ort = notizLesen(p);
        const kasten = kastenBauen({
            art: 'seite', block: p, ort,
            merken: (neu) => { ort.x = neu.x; ort.y = neu.y; notizSchreiben(p, neu); }
        });
        for (const b of eigeneKaesten(p)) {
            const bo = blockOrt(b);
            kastenBauen({
                art: 'block', block: b, ort: bo,
                merken: (neu) => { bo.x = neu.x; bo.y = neu.y; blockOrtSchreiben(b, neu); }
            });
        }
        wrap.appendChild(flaeche);
        let sicht = sichtLesen(p.id) ?? { x: 0, y: 0, z: 1 };
        let werkzeug = 'zeiger';
        let letzterZeigermodus = 'zeiger';
        const massstabZeigen = document.createElement('b');
        massstabZeigen.className = 'pg-fl-massstab';
        massstabZeigen.setAttribute('aria-live', 'polite');
        massstabZeigen.textContent = '100 %';
        const stellen = (merken = true) => {
            const z = sicht.z;
            ebene.style.transform = `translate(${sicht.x}px, ${sicht.y}px) scale(${z})`;
            let raster = RASTER * z;
            while (raster < 16)
                raster *= 2;
            flaeche.style.backgroundSize = `${raster}px ${raster}px`;
            flaeche.style.backgroundPosition = `${sicht.x}px ${sicht.y}px`;
            massstabZeigen.textContent = Math.round(z * 100) + ' %';
            if (merken)
                sichtSchreiben(p.id, sicht);
        };
        const inFlaeche = (sx, sy) => {
            const k = flaeche.getBoundingClientRect();
            return { x: (sx - k.left - sicht.x) / sicht.z, y: (sy - k.top - sicht.y) / sicht.z };
        };
        vorschlag = () => {
            const k = flaeche.getBoundingClientRect();
            const mitte = inFlaeche(k.left + k.width / 2, k.top + k.height / 3);
            return { x: Math.round(mitte.x - BLOCK_BREITE / 2), y: Math.round(mitte.y) };
        };
        let formen = formenLesen(p).slice();
        let farbe = GfxShapes.PALETTE[0]?.[0] ?? '#529cca';
        const GESCHLOSSENE_FORMEN = ['rechteck', 'ellipse', 'dreieck', 'raute'];
        let formFarbe = '#ffdc49';
        let gefuellt = true;
        let stiftBreite = 2.5;
        let markerBreite = 12;
        let marker = false;
        let aktiv = null;
        const massstab = (neu, haltX, haltY) => {
            const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, neu));
            const k = flaeche.getBoundingClientRect();
            const sx = haltX === undefined ? k.width / 2 : haltX - k.left;
            const sy = haltY === undefined ? k.height / 2 : haltY - k.top;
            const fx = (sx - sicht.x) / sicht.z;
            const fy = (sy - sicht.y) / sicht.z;
            sicht = { x: sx - fx * z, y: sy - fy * z, z };
            stellen();
            if (auswahl.size && !skalierZug)
                auswahlZeigen();
        };
        const passend = () => {
            const k = flaeche.getBoundingClientRect();
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const { el, plan } of kaesten) {
                const bw = el.offsetWidth || plan.ort.w || vorgabeBreite();
                const bh = el.offsetHeight || 200;
                x0 = Math.min(x0, plan.ort.x);
                y0 = Math.min(y0, plan.ort.y);
                x1 = Math.max(x1, plan.ort.x + bw);
                y1 = Math.max(y1, plan.ort.y + bh);
            }
            for (const form of formen) {
                const r = GfxShapes.rahmenVon(form);
                if (!Number.isFinite(r.x) || !Number.isFinite(r.y))
                    continue;
                x0 = Math.min(x0, r.x);
                y0 = Math.min(y0, r.y);
                x1 = Math.max(x1, r.x + r.w);
                y1 = Math.max(y1, r.y + r.h);
            }
            if (!Number.isFinite(x0)) {
                x0 = ort.x;
                y0 = ort.y;
                x1 = x0 + vorgabeBreite();
                y1 = y0 + 400;
            }
            const w = Math.max(1, x1 - x0);
            const h = Math.max(1, y1 - y0);
            if (!k.width || !k.height)
                return;
            const rand = 24;
            const leisteHoch = 116;
            const nutzHoehe = Math.max(120, k.height - leisteHoch - rand);
            const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(1, (k.width - rand * 2) / w, (nutzHoehe - rand) / h)));
            sicht = {
                z,
                x: (k.width - w * z) / 2 - x0 * z,
                y: Math.max(rand, (nutzHoehe - h * z) / 2) - y0 * z
            };
            stellen();
        };
        const ECKEN = {
            'oben-links': [-1, -1], 'oben-rechts': [1, -1],
            'unten-links': [-1, 1], 'unten-rechts': [1, 1]
        };
        let skalierZug = null;
        const auswahl = new Set();
        const formKnoten = new Map();
        const linien = [];
        let verbindeVon = '';
        const auswahlRahmen = GfxShapes.sv('g', { class: 'pg-fl-formauswahl', 'aria-hidden': 'true' });
        const ansage = document.createElement('span');
        ansage.className = 'nur-vorlesen';
        ansage.setAttribute('role', 'status');
        flaeche.appendChild(ansage);
        const formId = (form) => typeof form?.id === 'string' ? form.id : '';
        const beweglich = (form) => !!formId(form) && (form.art === 'stift'
            ? Array.isArray(form.pts) && form.pts.length > 0
            : Number.isFinite(form.x) && Number.isFinite(form.y));
        const beschriftbareForm = () => auswahl.size === 1 && formen.find(form => auswahl.has(formId(form)) && [...GESCHLOSSENE_FORMEN, 'notiz', 'text'].includes(form.art));
        const gruppenRahmen = () => {
            if (werkzeug !== 'zeiger' || !auswahl.size)
                return null;
            const ausgewaehlt = formen.filter(form => auswahl.has(formId(form)));
            if (ausgewaehlt.length !== auswahl.size || ausgewaehlt.some(form => ![...GESCHLOSSENE_FORMEN, 'notiz', 'linie', 'pfeil', 'stift'].includes(form.art) ||
                (form.art !== 'stift' && (!Number.isFinite(form.w) || !Number.isFinite(form.h)))))
                return null;
            const boxen = ausgewaehlt.map(GfxShapes.rahmenVon);
            const x = Math.min(...boxen.map(b => b.x)), y = Math.min(...boxen.map(b => b.y));
            const w = Math.max(...boxen.map(b => b.x + b.w)) - x;
            const h = Math.max(...boxen.map(b => b.y + b.h)) - y;
            return w > 0.1 && h > 0.1 ? { x, y, w, h } : null;
        };
        const griffeZeigen = (r) => {
            const fingerziel = matchMedia('(pointer: coarse)').matches ? 42 : 20;
            const ecken = r.w * sicht.z < fingerziel || r.h * sicht.z < fingerziel
                ? ['unten-rechts'] : Object.keys(ECKEN);
            for (const ecke of ecken) {
                const [horizontal, vertikal] = ECKEN[ecke];
                const cx = r.x + (horizontal > 0 ? r.w : 0);
                const cy = r.y + (vertikal > 0 ? r.h : 0);
                const griff = GfxShapes.sv('g', { 'data-skaliergriff': ecke,
                    'data-diagonal': horizontal === vertikal ? 'gleich' : 'kreuz' });
                const attrs = { cx, cy, r: 5 / sicht.z, 'vector-effect': 'non-scaling-stroke' };
                griff.append(GfxShapes.sv('circle', { ...attrs, class: 'pg-fl-griff-treffer' }), GfxShapes.sv('circle', { ...attrs, class: 'pg-fl-griff-sichtbar' }));
                auswahlRahmen.append(griff);
            }
        };
        const auswahlZeigen = () => {
            auswahlRahmen.replaceChildren();
            for (const form of formen) {
                if (!auswahl.has(formId(form)))
                    continue;
                const r = GfxShapes.rahmenVon(form);
                auswahlRahmen.appendChild(GfxShapes.sv('rect', {
                    x: r.x - 4, y: r.y - 4, width: r.w + 8, height: r.h + 8, rx: 3,
                    'vector-effect': 'non-scaling-stroke'
                }));
            }
            const rahmen = gruppenRahmen();
            if (rahmen)
                griffeZeigen(rahmen);
            leiste.setzeGesperrt('skalieren', !rahmen);
            const text = auswahl.size === 1 ? 'Eine Form ausgewählt' : auswahl.size + ' Formen ausgewählt';
            if (ansage.textContent !== text)
                ansage.textContent = text;
            leiste.setzeGesperrt('loeschen', !auswahl.size || werkzeug === 'verbindung');
            leiste.setzeGesperrt('beschriften', !beschriftbareForm() || werkzeug === 'verbindung');
            leiste.setzeGesperrt('alleFormen', !formen.some(beweglich));
        };
        const auswahlSetzen = (ids) => {
            auswahl.clear();
            ids.forEach(id => auswahl.add(id));
            auswahlZeigen();
        };
        const werkzeugWechseln = (id) => {
            werkzeug = id;
            flaeche.dataset['wz'] = id;
            if (id === 'zeiger' || id === 'hand') {
                letzterZeigermodus = id;
                const symbol = leiste.element.querySelector('[data-a="modus"] [data-sym]');
                if (symbol) {
                    symbol.dataset.sym = id === 'hand' ? 'inkHand' : 'inkPointer';
                    Register.symbole.fuelle(symbol.parentElement);
                }
            }
            verbindeVon = '';
            if (id !== 'zeiger')
                auswahlSetzen([]);
        };
        const alleFormenWaehlen = () => {
            werkzeugWechseln('zeiger');
            leiste.setzeWerkzeug('zeiger');
            auswahlSetzen(formen.filter(beweglich).map(formId));
        };
        const malen = () => {
            [...tinte.childNodes].forEach(k => { if (k !== tinteDefs)
                tinte.removeChild(k); });
            formKnoten.clear();
            linien.length = 0;
            const nachId = new Map(formen.map(form => [formId(form), form]));
            for (const form of formen) {
                if (form.art !== 'verbindung')
                    continue;
                const von = nachId.get(form.von), nach = nachId.get(form.nach);
                if (!von || !nach)
                    continue;
                const pfad = GfxShapes.verbindungZeichne(form, GfxShapes.rahmenVon(von), GfxShapes.rahmenVon(nach), pfeil);
                linien.push({ form, von, nach, pfad });
                tinte.appendChild(pfad);
            }
            for (const form of formen) {
                if (form.art === 'verbindung')
                    continue;
                const el = GfxShapes.zeichne(form, { pfeilMarke: pfeil });
                if (beweglich(form))
                    formKnoten.set(formId(form), el);
                tinte.appendChild(el);
            }
            for (const id of auswahl)
                if (!formKnoten.has(id))
                    auswahl.delete(id);
            tinte.appendChild(auswahlRahmen);
            auswahlZeigen();
        };
        const verlauf = GfxHistory.erstelle();
        const abbild = () => JSON.stringify(formen);
        const standZeigen = () => {
            leiste.setzeGesperrt('zurueck', !verlauf.kannZurueck());
            leiste.setzeGesperrt('vor', !verlauf.kannVor());
        };
        const merken = () => { verlauf.merken(abbild()); standZeigen(); };
        const verwerfen = () => { verlauf.letztenVerwerfen(); standZeigen(); };
        const sichern = () => { formenSchreiben(p, formen); malen(); };
        const skalierung = (von, nach) => {
            const sx = nach.w / von.w, sy = nach.h / von.h;
            const x = (wert) => nach.x + (wert - von.x) * sx;
            const y = (wert) => nach.y + (wert - von.y) * sy;
            return { sx, sy, x, y };
        };
        const skalierungSpeichern = (von, nach) => {
            if (Math.abs(nach.w - von.w) < 0.01 && Math.abs(nach.h - von.h) < 0.01)
                return;
            const { x, y, sx, sy } = skalierung(von, nach);
            merken();
            formen = formen.map(form => {
                if (!auswahl.has(formId(form)))
                    return form;
                if (form.art === 'stift')
                    return { ...form, pts: form.pts.map(([px, py, ...rest]) => [r2(x(px)), r2(y(py)), ...rest]) };
                return { ...form, x: r2(x(form.x)), y: r2(y(form.y)),
                    w: r2(form.w * sx), h: r2(form.h * sy) };
            });
            sichern();
        };
        const groesseEingeben = async () => {
            const von = gruppenRahmen();
            if (!von || skalierZug)
                return;
            const auswahlVorher = [...auswahl].join(',');
            const wert = await UI.frage('Grösse ändern · Breite × Höhe', r2(von.w) + ' × ' + r2(von.h));
            if (wert === null || !flaeche.isConnected || [...auswahl].join(',') !== auswahlVorher)
                return;
            const teile = /^\s*(\d+(?:[.,]\d+)?)\s*[×xX]\s*(\d+(?:[.,]\d+)?)\s*$/.exec(wert);
            const w = Number(teile?.[1]?.replace(',', '.')), h = Number(teile?.[2]?.replace(',', '.'));
            if (!(w >= 1 && h >= 1 && w <= 100000 && h <= 100000)) {
                UI.toast('Gib Breite und Höhe in Flächeneinheiten ein, zum Beispiel 160 × 90.');
                return;
            }
            const aktuell = gruppenRahmen();
            if (aktuell)
                skalierungSpeichern(aktuell, { ...aktuell, w, h });
        };
        const schrittZurueck = () => {
            const vorher = verlauf.zurueck(abbild());
            if (vorher === null)
                return;
            formen = JSON.parse(vorher);
            sichern();
            standZeigen();
        };
        const schrittVor = () => {
            const nachher = verlauf.vor(abbild());
            if (nachher === null)
                return;
            formen = JSON.parse(nachher);
            sichern();
            standZeigen();
        };
        let beschriftet = false;
        const textBearbeiten = async (form, punkt) => {
            if (beschriftet || formenZug)
                return;
            beschriftet = true;
            let text;
            try {
                text = await UI.frage(punkt ? 'Haftnotiz' : 'Beschriftung', String(form?.text || ''));
            }
            finally {
                beschriftet = false;
            }
            if (text === null || !flaeche.isConnected)
                return;
            if (punkt) {
                if (!text.trim())
                    return;
                const id = Store.uid().slice(0, 8);
                merken();
                formen.push({ id, art: 'notiz', x: r2(punkt.x), y: r2(punkt.y), w: 170, h: 110, farbe, text });
                werkzeugWechseln('zeiger');
                leiste.setzeWerkzeug('zeiger');
                auswahlSetzen([id]);
            }
            else {
                const aktuell = formen.find(x => formId(x) === formId(form));
                if (!aktuell || text === String(aktuell.text || ''))
                    return;
                merken();
                formen = formen.map(x => x === aktuell ? { ...x, text } : x);
            }
            sichern();
        };
        const formenEntfernen = (ids) => {
            formen = formen.filter(form => !ids.has(formId(form)) &&
                (form.art !== 'verbindung' || (!ids.has(form.von) && !ids.has(form.nach))));
        };
        const auswahlLoeschen = () => {
            if (!auswahl.size || formenZug || werkzeug === 'verbindung')
                return;
            merken();
            formenEntfernen(auswahl);
            sichern();
        };
        const auswahlVerschieben = (dx, dy) => {
            if ((!dx && !dy) || !auswahl.size)
                return;
            merken();
            formen = formen.map(form => {
                if (!auswahl.has(formId(form)))
                    return form;
                if (form.art === 'stift')
                    return { ...form, pts: form.pts.map(([x, y, ...rest]) => [r2(x + dx), r2(y + dy), ...rest]) };
                return { ...form, x: r2(form.x + dx), y: r2(form.y + dy) };
            });
            sichern();
        };
        const formAn = (fx, fy, radius, mitVerbindungen = false) => {
            const nah = (a, b) => {
                const ax = Number(a?.[0]), ay = Number(a?.[1]), bx = Number(b?.[0]), by = Number(b?.[1]);
                const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
                const t = l2 > 0 ? Math.max(0, Math.min(1, ((fx - ax) * dx + (fy - ay) * dy) / l2)) : 0;
                return Math.hypot(ax + t * dx - fx, ay + t * dy - fy) <= radius;
            };
            for (let i = formen.length - 1; i >= 0; i--) {
                const form = formen[i];
                if (!beweglich(form))
                    continue;
                if (form.art === 'stift') {
                    const pts = form.pts;
                    if (pts.some((q, j) => nah(q, pts[j + 1] ?? q)))
                        return form;
                }
                else if (form.art === 'linie' || form.art === 'pfeil') {
                    if (nah([form.x, form.y], [form.x + form.w, form.y + form.h]))
                        return form;
                }
                else {
                    const r = GfxShapes.rahmenVon(form);
                    if (fx >= r.x - radius && fx <= r.x + r.w + radius &&
                        fy >= r.y - radius && fy <= r.y + r.h + radius)
                        return form;
                }
            }
            if (mitVerbindungen) {
                for (let i = linien.length - 1; i >= 0; i--) {
                    const link = linien[i];
                    if (!link)
                        continue;
                    const [a, b] = GfxShapes.verbindungsStrecke(GfxShapes.rahmenVon(link.von), GfxShapes.rahmenVon(link.nach));
                    if (nah(a, b))
                        return link.form;
                }
            }
            return null;
        };
        const MALWERKZEUGE = ['stift', 'linie', 'pfeil', ...GESCHLOSSENE_FORMEN];
        const formStilAnwenden = (stil) => {
            const zuAendern = (form) => auswahl.has(formId(form)) &&
                GESCHLOSSENE_FORMEN.includes(form.art) &&
                ((stil.farbe !== undefined && form.farbe !== stil.farbe) ||
                    (stil.gefuellt !== undefined && (form.gefuellt === true) !== stil.gefuellt));
            if (!formen.some(zuAendern))
                return;
            merken();
            formen = formen.map(form => zuAendern(form) ? { ...form, ...stil } : form);
            sichern();
        };
        const formenStil = (art) => GESCHLOSSENE_FORMEN.includes(art) ? { farbe: formFarbe, gefuellt } : { farbe };
        const maltGerade = () => MALWERKZEUGE.includes(werkzeug) || werkzeug === 'radierer';
        const blockEinsetzen = (art, felder = {}, ort) => {
            const block = Store.addBlock(p.id, art, { text: '', ...felder });
            aufFlaeche(block, ort);
        };
        const menueEintrag = (liste, name, zeichen, ausfuehren) => {
            const b = document.createElement('button');
            b.type = 'button';
            const symbol = document.createElement('span');
            symbol.dataset.sym = zeichen;
            symbol.setAttribute('aria-hidden', 'true');
            b.append(symbol, document.createTextNode(name));
            b.addEventListener('click', () => {
                leiste.schliesse();
                ausfuehren();
            });
            liste.append(b);
        };
        const linkEinsetzen = async () => {
            const eingabe = await UI.frage('Weblink auf der Fläche einfügen', '');
            if (!eingabe?.trim() || !flaeche.isConnected)
                return;
            let url;
            try {
                url = new URL(eingabe.trim());
                if (url.protocol !== 'https:' && url.protocol !== 'http:')
                    throw new Error();
            }
            catch {
                UI.toast('Gib einen vollständigen Weblink mit https:// oder http:// ein.');
                return;
            }
            aufFlaeche(Store.addBlock(p.id, 'bookmark', { src: url.href, text: url.hostname }));
        };
        const rahmenEintraege = (liste) => {
            menueEintrag(liste, 'Rechteckrahmen zeichnen', 'formRect', () => {
                leiste.setzeWerkzeug('rechteck');
                werkzeugWechseln('rechteck');
            });
            menueEintrag(liste, 'Whiteboard einfügen', 'grid', () => blockEinsetzen('whiteboard'));
        };
        const linkEintraege = (liste) => {
            menueEintrag(liste, 'Weblink einfügen', 'bookmark', () => { void linkEinsetzen(); });
            menueEintrag(liste, 'Seitenlink kopieren', 'link', () => Register.aktionen.tun('link', p, { kontext: 'seite' }));
        };
        const VORLAGEN = {
            'karte-beidseitig': { name: 'Gedankenkarte · beidseitig', w: BLOCK_BREITE, h: 240 },
            'karte-rechts': { name: 'Gedankenkarte · nach rechts', w: BLOCK_BREITE, h: 240 },
            ablauf: { name: 'Ablaufdiagramm', w: 400, h: 66 },
            entscheidung: { name: 'Entscheidungsbaum', w: 400, h: 250 }
        };
        const gedankenkarteEinsetzen = (art, ort) => {
            const karte = Gedankenkarte.neueKarte();
            karte.knoten.push(...['Erster Ast', 'Zweiter Ast', 'Dritter Ast'].map((text, i) => ({
                id: Store.uid().slice(0, 8), eltern: 'w', text,
                seite: art === 'beidseitig' && i % 2 !== 0 ? 'links' : 'rechts',
                farbe: Gedankenkarte.farbeVon(i),
                form: art === 'rechts' ? 'kasten' : 'rund'
            })));
            blockEinsetzen('mindmap', { karte }, ort);
        };
        const diagrammPlan = (entscheidung, mitte) => {
            const w = 116, h = 58;
            const abstand = 142;
            const x = r2(mitte.x - w / 2), y = r2(mitte.y - h / 2);
            const knoten = [
                { x: entscheidung ? x : x - abstand, y: entscheidung ? y - 92 : y,
                    art: 'ellipse', text: 'Start', farbe: '#4dab9a' },
                { x, y, art: entscheidung ? 'raute' : 'rechteck',
                    text: entscheidung ? 'Prüfen' : 'Arbeitsschritt', farbe: '#ffdc49' },
                { x: x + abstand, y: entscheidung ? y + 92 : y, art: 'rechteck',
                    text: entscheidung ? 'Ja' : 'Fertig', farbe: '#529cca' },
                ...(entscheidung ? [{ x: x - abstand, y: y + 92, art: 'rechteck',
                        text: 'Nein', farbe: '#ff7369' }] : [])
            ].map(form => ({ ...form, w, h, gefuellt: true }));
            const kanten = entscheidung
                ? [[0, 1], [1, 2], [1, 3]] : [[0, 1], [1, 2]];
            return { knoten, kanten };
        };
        const vorlageEinsetzen = (id, ort) => {
            if (id === 'karte-beidseitig' || id === 'karte-rechts') {
                gedankenkarteEinsetzen(id === 'karte-beidseitig' ? 'beidseitig' : 'rechts', ort);
                return;
            }
            const rect = flaeche.getBoundingClientRect();
            const { w, h } = VORLAGEN[id];
            const mitte = ort ? { x: ort.x + w / 2, y: ort.y + h / 2 }
                : inFlaeche(rect.left + rect.width / 2, rect.top + rect.height * 0.45);
            const plan = diagrammPlan(id === 'entscheidung', mitte);
            const knoten = plan.knoten.map(form => ({ ...form, id: Store.uid().slice(0, 8) }));
            const kanten = plan.kanten.flatMap(([von, nach]) => {
                const a = knoten[von], b = knoten[nach];
                return a && b ? [{ id: Store.uid().slice(0, 8), art: 'verbindung', von: a.id, nach: b.id, farbe }] : [];
            });
            merken();
            formen.push(...knoten, ...kanten);
            werkzeugWechseln('zeiger');
            leiste.setzeWerkzeug('zeiger');
            auswahlSetzen(knoten.map(formId));
            sichern();
        };
        const vorlagenGrafik = (id) => {
            const grafik = GfxShapes.sv('g');
            const { w, h } = VORLAGEN[id];
            if (id === 'entscheidung' || id === 'ablauf') {
                const plan = diagrammPlan(id === 'entscheidung', { x: w / 2, y: h / 2 });
                for (const [von, nach] of plan.kanten) {
                    const a = plan.knoten[von], b = plan.knoten[nach];
                    if (a && b)
                        grafik.append(GfxShapes.verbindungZeichne({ id: '', art: 'verbindung', farbe }, GfxShapes.rahmenVon(a), GfxShapes.rahmenVon(b), pfeil));
                }
                for (const form of plan.knoten)
                    grafik.append(GfxShapes.zeichne(form));
                return grafik;
            }
            const rechts = id === 'karte-rechts';
            const wurzelX = rechts ? 38 : 144;
            const wurzelY = 102;
            [34, 102, 170].forEach((y, i) => {
                const x = !rechts && i === 1 ? 14 : 258;
                const sx = x < wurzelX ? wurzelX : wurzelX + 91;
                const ex = x < wurzelX ? x + 82 : x;
                grafik.append(GfxShapes.sv('path', {
                    d: `M${sx} 120 C${(sx + ex) / 2} 120 ${(sx + ex) / 2} ${y + 18} ${ex} ${y + 18}`,
                    fill: 'none', stroke: Gedankenkarte.farbeVon(i), 'stroke-width': 3
                }), GfxShapes.sv('rect', { x, y, width: 82, height: 36, rx: rechts ? 3 : 9,
                    fill: Gedankenkarte.farbeVon(i) }));
            });
            grafik.append(GfxShapes.sv('rect', { x: wurzelX, y: wurzelY, width: 91, height: 36, rx: 8, fill: '#ffdc49' }));
            return grafik;
        };
        const vorlagenKarte = (liste, id) => {
            const b = document.createElement('button');
            const { name, w, h } = VORLAGEN[id];
            b.type = 'button';
            b.dataset.flaechenVorlage = id;
            b.className = 'pg-fl-vorlagenkarte';
            const vorschau = GfxShapes.sv('svg', { viewBox: `-6 -6 ${w + 12} ${h + 12}`, 'aria-hidden': 'true' });
            vorschau.append(vorlagenGrafik(id));
            b.append(vorschau, document.createTextNode(name));
            b.addEventListener('click', () => { leiste.schliesse(); vorlageEinsetzen(id); });
            liste.append(b);
        };
        const aufsatzMenue = (id) => {
            if (id === 'elektro')
                return Elektrostart.werkzeugmenue(() => leiste.schliesse(), () => blockEinsetzen('schaltplan'));
            const liste = document.createElement('div');
            liste.className = 'gfx-tb-liste gfx-tb-befehlsliste';
            if (id === 'rahmen' || id === 'schnellmehr')
                rahmenEintraege(liste);
            if (id === 'seitenlink' || id === 'schnellmehr')
                linkEintraege(liste);
            if (id === 'diagramme') {
                vorlagenKarte(liste, 'karte-beidseitig');
                vorlagenKarte(liste, 'karte-rechts');
                menueEintrag(liste, 'Leere Gedankenkarte', 'plus', () => blockEinsetzen('mindmap'));
            }
            if (id === 'vorlagen') {
                vorlagenKarte(liste, 'ablauf');
                vorlagenKarte(liste, 'entscheidung');
                menueEintrag(liste, 'Textblock', 'inkText', () => blockEinsetzen('text'));
                menueEintrag(liste, 'Gedankenkarte', 'sparkle', () => blockEinsetzen('mindmap'));
                menueEintrag(liste, 'Whiteboard', 'formRect', () => blockEinsetzen('whiteboard'));
            }
            if (!liste.childElementCount)
                return null;
            Register.symbole.fuelle(liste);
            return liste;
        };
        const palettenKnopf = (name, gewaehlt, zeichen, aktion) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.title = name;
            b.setAttribute('aria-label', name);
            b.setAttribute('aria-pressed', String(gewaehlt));
            zeichen.setAttribute('aria-hidden', 'true');
            b.append(zeichen);
            b.addEventListener('click', aktion);
            return b;
        };
        const werkzeugPalette = (id) => {
            const stift = id === 'stift';
            const kasten = document.createElement('div');
            kasten.className = 'pg-fl-werkzeugpalette';
            const optionen = document.createElement('div');
            optionen.className = 'pg-fl-palettenoptionen';
            const typen = document.createElement('div');
            typen.className = 'pg-fl-palettengruppe';
            typen.setAttribute('role', 'group');
            typen.setAttribute('aria-label', stift ? 'Strichart' : 'Formfüllung');
            const breiten = document.createElement('div');
            breiten.className = 'pg-fl-palettengruppe';
            breiten.setAttribute('role', 'group');
            breiten.setAttribute('aria-label', 'Strichbreite');
            const breitenZeigen = () => {
                const dicke = marker ? markerBreite : stiftBreite;
                for (const b of breiten.querySelectorAll('button')) {
                    b.setAttribute('aria-pressed', String(Number(b.dataset.breite) === dicke));
                }
            };
            const fuellbareAuswahl = formen.filter(form => auswahl.has(formId(form)) &&
                GESCHLOSSENE_FORMEN.includes(form.art));
            const fuellung = fuellbareAuswahl.length
                ? fuellbareAuswahl.every(form => form.gefuellt === true) : gefuellt;
            const modi = stift ? [
                { name: 'Freihandstift', sym: 'inkPen', wert: false },
                { name: 'Textmarker', sym: 'inkMarker', wert: true }
            ] : [
                { name: 'Kontur', sym: 'formRect', wert: false },
                { name: 'Gefüllt', sym: 'formRect', wert: true }
            ];
            for (const { name, sym, wert } of modi) {
                const icon = document.createElement('span');
                icon.dataset.sym = sym;
                icon.classList.toggle('pg-fl-gefuellt', !stift && wert);
                const b = palettenKnopf(name, (stift ? marker : fuellung) === wert, icon, () => {
                    if (stift) {
                        marker = wert;
                        breitenZeigen();
                    }
                    else {
                        gefuellt = wert;
                        formStilAnwenden({ gefuellt: wert });
                    }
                    typen.querySelectorAll('button').forEach(knopf => knopf.setAttribute('aria-pressed', String(knopf === b)));
                });
                typen.append(b);
            }
            optionen.append(typen);
            if (stift) {
                for (const dicke of [2.5, 4, 7, 12]) {
                    const strich = document.createElement('span');
                    strich.className = 'pg-fl-breitenpunkt';
                    strich.style.setProperty('--strich', Math.max(4, dicke) + 'px');
                    const b = palettenKnopf(dicke + ' pt', false, strich, () => {
                        if (marker)
                            markerBreite = dicke;
                        else
                            stiftBreite = dicke;
                        breitenZeigen();
                    });
                    b.dataset.breite = String(dicke);
                    breiten.append(b);
                }
                breitenZeigen();
                optionen.append(breiten);
            }
            const farben = document.createElement('div');
            farben.className = 'pg-fl-palettengruppe pg-fl-palettenfarben';
            farben.setAttribute('role', 'group');
            farben.setAttribute('aria-label', stift ? 'Stiftfarbe' : 'Formfarbe');
            const aktivFarbe = stift ? farbe : fuellbareAuswahl[0]?.farbe ?? formFarbe;
            for (const [wert, name] of GfxShapes.PALETTE) {
                const punkt = document.createElement('span');
                punkt.className = 'pg-fl-farbpunkt';
                punkt.style.backgroundColor = wert;
                const b = palettenKnopf(name === 'Gruen' ? 'Grün' : name, wert === aktivFarbe, punkt, () => {
                    if (stift || id === 'farbe')
                        farbe = wert;
                    if (!stift) {
                        formFarbe = wert;
                        formStilAnwenden({ farbe: wert });
                    }
                    farben.querySelectorAll('button').forEach(knopf => knopf.setAttribute('aria-pressed', String(knopf === b)));
                });
                b.dataset.c = wert;
                farben.append(b);
            }
            kasten.append(optionen, farben);
            Register.symbole.fuelle(kasten);
            return kasten;
        };
        const leiste = GfxToolbar.erstelle({
            klasse: 'pg-fl-tools',
            beschriftung: 'Werkzeuge der Fläche',
            werkzeuge: Register.werkzeuge.auswahl(['zeiger', 'hand', 'rahmenwahl', 'verbindung', ...MALWERKZEUGE, 'notiz', 'radierer']),
            aktiv: 'zeiger',
            galerie: {
                schnell: ['modus', 'rahmen', 'verbindung', 'seitenlink', 'schnellmehr'],
                edgeless: { zusatz: ['elektro', 'farbe'] },
                karten: [
                    { id: 'notiz', knoepfe: ['notiz'] },
                    { id: 'stifte', knoepfe: ['stift', 'radierer'] },
                    { id: 'formen', knoepfe: ['formen'] },
                    { id: 'diagramme', knoepfe: ['diagramme'] },
                    { id: 'vorlagen', knoepfe: ['vorlagen'] }
                ],
                paletten: ['stift', 'formen', 'farbe', 'diagramme', 'vorlagen'],
                werkzeugMenues: {
                    modus: ['zeiger', 'hand', 'rahmenwahl'],
                    formen: [...GESCHLOSSENE_FORMEN, 'linie', 'pfeil']
                }
            },
            aktionen: [
                { id: 'elektro', name: 'Elektro', sym: 'bolt', menue: true, kapsel: 'werkzeuge' },
                { id: 'formen', name: 'Formen', sym: 'formRect', menue: true, kapsel: 'werkzeuge' },
                { id: 'diagramme', name: 'Gedankenkarte einfügen', sym: 'sparkle', menue: true, kapsel: 'werkzeuge' },
                { id: 'vorlagen', name: 'Blockvorlagen', sym: 'table', menue: true, kapsel: 'werkzeuge' },
                { id: 'modus', name: 'Zeiger und Hand', sym: 'inkPointer', menue: true, kapsel: 'werkzeuge' },
                { id: 'rahmen', name: 'Rahmen', sym: 'grid', menue: true, kapsel: 'werkzeuge' },
                { id: 'seitenlink', name: 'Link', sym: 'link', menue: true, kapsel: 'werkzeuge' },
                { id: 'schnellmehr', name: 'Weitere Schnellwerkzeuge', sym: 'dots', menue: true, kapsel: 'werkzeuge' },
                { id: 'farbe', name: 'Farbe', titel: 'Farbe der Formen', sym: 'palette',
                    menue: true, kapsel: 'werkzeuge' },
                { id: 'zurueck', name: 'Rückgängig', titel: 'Rückgängig (Strg + Z)', sym: 'undo', gesperrt: true },
                { id: 'vor', name: 'Schritt vorwärts', titel: 'Schritt vorwärts (Strg + Umschalt + Z)',
                    sym: 'redo', gesperrt: true },
                { id: 'kleiner', name: 'Kleiner', titel: 'Kleiner (Strg + Rad)', sym: 'minus' },
                { id: 'groesser', name: 'Grösser', titel: 'Grösser (Strg + Rad)', sym: 'plus' },
                { id: 'passend', name: 'Ins Bild', titel: 'Alles ins Bild holen', sym: 'maximize' },
                { id: 'alleFormen', name: 'Alle Formen', titel: 'Alle Formen auswählen (Strg + A)', sym: 'formRect', gesperrt: true },
                { id: 'skalieren', name: 'Grösse ändern', titel: 'Breite und Höhe der Auswahl eingeben', sym: 'inkRuler', gesperrt: true },
                { id: 'beschriften', name: 'Beschriften', titel: 'Ausgewählte Form beschriften', sym: 'inkText', gesperrt: true },
                { id: 'loeschen', name: 'Löschen', titel: 'Ausgewählte Formen löschen', sym: 'trash', gesperrt: true }
            ],
            zusatz: { groesser: massstabZeigen },
            menue: id => ['stift', 'formen', 'farbe'].includes(id) ? werkzeugPalette(id) : aufsatzMenue(id),
            menueOffenHalten: (id, ziel) => ziel instanceof Element && flaeche.contains(ziel) &&
                !ziel.closest('.pg-fl-notiz') && ((id === 'stift' && werkzeug === 'stift') ||
                (id === 'formen' && werkzeug !== 'stift' && MALWERKZEUGE.includes(werkzeug))),
            aufWerkzeug: werkzeugWechseln,
            aufAktion: (id) => {
                if (id === 'zurueck')
                    schrittZurueck();
                if (id === 'vor')
                    schrittVor();
                if (id === 'kleiner')
                    massstab(sicht.z / 1.25);
                if (id === 'groesser')
                    massstab(sicht.z * 1.25);
                if (id === 'passend')
                    passend();
                if (id === 'alleFormen' && !formenZug)
                    alleFormenWaehlen();
                if (id === 'loeschen')
                    auswahlLoeschen();
                if (id === 'skalieren')
                    void groesseEingeben();
                if (id === 'beschriften') {
                    const form = beschriftbareForm();
                    if (form)
                        void textBearbeiten(form);
                }
            }
        });
        leiste.element.querySelector('[data-a="modus"]')?.addEventListener('click', (e) => {
            if (!(e instanceof MouseEvent) || e.detail === 0)
                return;
            e.stopPropagation();
            leiste.schliesse();
            const id = werkzeug === 'zeiger' ? 'hand' : werkzeug === 'hand' ? 'zeiger' : letzterZeigermodus;
            leiste.setzeWerkzeug(id);
            werkzeugWechseln(id);
        });
        flaeche.insertBefore(leiste.element, ebene);
        flaeche.dataset['wz'] = werkzeug;
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(leiste.element);
        malen();
        const gaeste = new Map();
        let imSchacht = leiste.element;
        let gastFlaeche = null;
        const schildSetzen = (bar, text) => {
            const roller = bar.querySelector('.gfx-tb-roller');
            if (!roller)
                return;
            let schild = roller.querySelector(':scope > .pg-fl-kontext');
            if (!schild) {
                schild = document.createElement('span');
                schild.className = 'pg-fl-kontext';
                schild.setAttribute('aria-hidden', 'true');
                roller.prepend(schild);
            }
            const teile = /^(.+?)(fläche)$/i.exec(text);
            if (teile?.[1] && teile[2]) {
                const vorn = document.createElement('span');
                const hinten = document.createElement('span');
                vorn.textContent = teile[1];
                hinten.textContent = teile[2];
                schild.replaceChildren(vorn, hinten);
            }
            else
                schild.textContent = text;
        };
        schildSetzen(leiste.element, 'Fläche');
        const aufnehmen = () => {
            for (const bar of [...ebene.querySelectorAll('.pg-fl-koerper .gfx-tb-sockel')]) {
                const ober = bar.parentElement;
                if (!ober)
                    continue;
                bar.remove();
                gaeste.set(ober, bar);
                const name = bar.querySelector('[role="toolbar"]')?.getAttribute('aria-label') ?? '';
                schildSetzen(bar, name.replace(/^Werkzeuge (der|des) /, '').replace(/\s*„.*“$/, '') || 'Block');
            }
            for (const ober of [...gaeste.keys()]) {
                if (flaeche.contains(ober))
                    continue;
                gaeste.delete(ober);
                if (ober === gastFlaeche)
                    schachtSetzen(null);
            }
        };
        const schachtSetzen = (ober) => {
            const neu = ober ? gaeste.get(ober) ?? null : leiste.element;
            if (!neu || neu === imSchacht)
                return;
            const alt = imSchacht;
            const fokusDrin = !!document.activeElement && alt.contains(document.activeElement);
            if (alt.querySelector('.gfx-tb-menue'))
                alt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
            if (alt.parentElement === flaeche)
                flaeche.replaceChild(neu, alt);
            else
                flaeche.insertBefore(neu, ebene);
            imSchacht = neu;
            gastFlaeche?.classList.remove('pg-fl-aktiv');
            gastFlaeche = ober;
            gastFlaeche?.classList.add('pg-fl-aktiv');
            if (fokusDrin)
                neu.querySelector('button[tabindex="0"]')?.focus({ preventScroll: true });
            const roller = neu.querySelector('.gfx-tb-roller');
            const an = roller?.querySelector('[data-wz].on');
            if (roller && an) {
                const schild = roller.querySelector(':scope > .pg-fl-kontext');
                const breit = schild ? schild.getBoundingClientRect().width : 0;
                roller.style.scrollPaddingInlineStart = breit ? `${Math.ceil(breit)}px` : '';
                const r = roller.getBoundingClientRect(), b = an.getBoundingClientRect();
                const links = r.left + breit;
                if (b.right > r.right)
                    roller.scrollLeft += b.right - r.right;
                else if (b.left < links)
                    roller.scrollLeft -= links - b.left;
            }
        };
        const HALTE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
        const naechsteHalte = function* (ober) {
            for (const el of document.querySelectorAll(HALTE)) {
                if (!(ober.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))
                    continue;
                if (ober.contains(el) || imSchacht.contains(el))
                    continue;
                const ausdruecklich = el.getAttribute('tabindex');
                const halt = ausdruecklich !== null ? el.tabIndex >= 0 : (el.tabIndex >= 0 || el.isContentEditable);
                if (!halt || el.disabled)
                    continue;
                if (el.isContentEditable && el.parentElement?.isContentEditable)
                    continue;
                if (el.closest('[inert], [hidden], [aria-hidden="true"]') || !el.getClientRects().length)
                    continue;
                yield el;
            }
        };
        const gastVon = (ziel) => {
            if (!(ziel instanceof Node))
                return null;
            for (const ober of gaeste.keys())
                if (ober.contains(ziel))
                    return ober;
            return null;
        };
        const kontextNach = (ziel) => {
            if (!(ziel instanceof Node) || imSchacht.contains(ziel))
                return;
            schachtSetzen(gastVon(ziel));
        };
        flaeche.addEventListener('pointerdown', (e) => kontextNach(e.target), true);
        flaeche.addEventListener('focusin', (e) => kontextNach(e.target));
        aufnehmen();
        if (typeof MutationObserver === 'function') {
            new MutationObserver((liste) => {
                const betrifft = liste.some(m => [...m.addedNodes].some(n => n instanceof Element &&
                    (n.matches('.gfx-tb-sockel') || !!n.querySelector('.gfx-tb-sockel'))) ||
                    [...m.removedNodes].some(n => n instanceof Element && [...gaeste.keys()].some(o => n === o || n.contains(o))));
                if (betrifft)
                    aufnehmen();
            }).observe(ebene, { childList: true, subtree: true });
        }
        let zug = null;
        const finger = new Map();
        let kneifen = null;
        let formenZug = null;
        let formenBild = 0;
        const formVorschau = () => {
            formenBild = 0;
            if (!formenZug)
                return;
            const transform = `translate(${formenZug.dx} ${formenZug.dy})`;
            auswahlRahmen.setAttribute('transform', transform);
            for (const id of auswahl)
                formKnoten.get(id)?.setAttribute('transform', transform);
            verbindungenNachziehen(formenZug.dx, formenZug.dy);
        };
        const verbindungenAnpassen = (anpassen) => {
            const rahmen = (form) => {
                const r = GfxShapes.rahmenVon(form);
                return auswahl.has(formId(form)) ? anpassen(r) : r;
            };
            for (const { von, nach, pfad } of linien) {
                if (!auswahl.has(formId(von)) && !auswahl.has(formId(nach)))
                    continue;
                pfad.setAttribute('d', GfxShapes.verbindungsPfad(rahmen(von), rahmen(nach)));
            }
        };
        const verbindungenNachziehen = (dx, dy) => verbindungenAnpassen(r => ({ ...r, x: r.x + dx, y: r.y + dy }));
        let skalierBild = 0;
        const skalierVorschau = () => {
            skalierBild = 0;
            const zug = skalierZug;
            if (!zug)
                return;
            const { vorher: a, nachher: b } = zug;
            const { x, y, sx, sy } = skalierung(a, b);
            const transform = `translate(${b.x} ${b.y}) scale(${sx} ${sy}) translate(${-a.x} ${-a.y})`;
            auswahlRahmen.setAttribute('transform', transform);
            for (const id of auswahl)
                formKnoten.get(id)?.setAttribute('transform', transform);
            verbindungenAnpassen(r => ({ x: x(r.x), y: y(r.y), w: r.w * sx, h: r.h * sy }));
        };
        const skalierZiel = (e, zug) => {
            const a = zug.vorher;
            const [horizontal, vertikal] = ECKEN[zug.ecke];
            const dx = e.clientX - zug.sx, dy = e.clientY - zug.sy;
            if (Math.hypot(dx, dy) < 3)
                return a;
            const dw = dx * horizontal / sicht.z, dh = dy * vertikal / sicht.z;
            const minW = Math.min(a.w, 12), minH = Math.min(a.h, 12);
            let w = Math.max(minW, a.w + dw), h = Math.max(minH, a.h + dh);
            if (e.shiftKey) {
                const faktor = Math.abs(dw / a.w) >= Math.abs(dh / a.h) ? w / a.w : h / a.h;
                const f = Math.max(faktor, minW / a.w, minH / a.h);
                w = a.w * f;
                h = a.h * f;
            }
            return { x: horizontal < 0 ? a.x + a.w - w : a.x,
                y: vertikal < 0 ? a.y + a.h - h : a.y, w, h };
        };
        const skalierZugStart = (e, ecke) => {
            const rahmen = gruppenRahmen();
            if (!rahmen)
                return;
            skalierZug = { pointer: e.pointerId, sx: e.clientX, sy: e.clientY,
                ecke, vorher: rahmen, nachher: rahmen };
            e.preventDefault();
            flaeche.focus({ preventScroll: true });
            try {
                flaeche.setPointerCapture(e.pointerId);
            }
            catch { }
        };
        const skalierZugEnde = (e) => {
            const zug = skalierZug;
            if (!zug || (e && zug.pointer !== e.pointerId))
                return;
            skalierZug = null;
            if (skalierBild)
                cancelAnimationFrame(skalierBild);
            skalierBild = 0;
            auswahlRahmen.removeAttribute('transform');
            for (const id of auswahl)
                formKnoten.get(id)?.removeAttribute('transform');
            verbindungenNachziehen(0, 0);
            if (e?.type === 'pointerup')
                skalierungSpeichern(zug.vorher, skalierZiel(e, zug));
        };
        const formZugEnde = () => {
            formenZug = null;
            if (formenBild)
                cancelAnimationFrame(formenBild);
            formenBild = 0;
            auswahlRahmen.removeAttribute('transform');
            for (const id of auswahl)
                formKnoten.get(id)?.removeAttribute('transform');
            verbindungenNachziehen(0, 0);
        };
        const formVersatz = (e, start) => {
            const dx = e.clientX - start.sx, dy = e.clientY - start.sy;
            return Math.hypot(dx, dy) < 3 ? { dx: 0, dy: 0 } : { dx: dx / sicht.z, dy: dy / sicht.z };
        };
        let stiftGlatt = null;
        let stiftZeit = 0;
        let stiftBildGeplant = false;
        const r2 = (v) => Math.round(v * 100) / 100;
        const stiftNachziehen = () => {
            stiftBildGeplant = false;
            if (!aktiv || aktiv.art !== 'stift')
                return;
            const pfade = [...tinte.querySelectorAll('path')]
                .filter((pfad) => pfad.dataset.sid === String(aktiv.id));
            if (!pfade.length) {
                malen();
                return;
            }
            const d = GfxShapes.zeichne({ ...aktiv }).querySelector('path')?.getAttribute('d') || '';
            pfade.forEach((pfad) => pfad.setAttribute('d', d));
        };
        const dockArten = { rect: 'rechteck', ellipse: 'ellipse', triangle: 'dreieck' };
        let dockZug = null;
        let dockKlickUnterdrueckt = null;
        const dockZugStart = (e, ziel) => {
            if (dockZug || e.button !== 0 || !e.isPrimary || aktiv || formenZug)
                return;
            const knopf = ziel.closest('button');
            if (!knopf || knopf.disabled)
                return;
            const zeichen = ziel.closest('[data-vorschau]')?.dataset.vorschau;
            const id = knopf.dataset.flaechenVorlage;
            const vorlage = id && Object.hasOwn(VORLAGEN, id) ? id : undefined;
            const art = knopf.dataset.wz === 'notiz' ? 'notiz'
                : dockArten[zeichen];
            if (!art && !vorlage)
                return;
            const masse = vorlage ? VORLAGEN[vorlage] : art === 'notiz' ? { w: 170, h: 110 } : { w: 120, h: 90 };
            dockZug = { pointer: e.pointerId, knopf, sx: e.clientX, sy: e.clientY, art: art ?? '',
                w: masse.w, h: masse.h, vorlage, vorschau: null };
            try {
                knopf.setPointerCapture(e.pointerId);
            }
            catch { }
        };
        const dockZugOrt = (e, zustand) => {
            const p = inFlaeche(e.clientX, e.clientY);
            return { x: r2(p.x - zustand.w / 2), y: r2(p.y - zustand.h / 2) };
        };
        const dockZugZeigen = (e) => {
            const d = dockZug;
            if (!d || d.pointer !== e.pointerId)
                return;
            if (!d.vorschau) {
                if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6)
                    return;
                const vorschau = d.vorlage ? vorlagenGrafik(d.vorlage)
                    : GfxShapes.zeichne({ id: '', art: d.art, x: 0, y: 0, w: d.w, h: d.h, ...formenStil(d.art) });
                vorschau.classList.add('pg-fl-dock-vorschau');
                d.vorschau = vorschau;
                if (!d.vorlage)
                    leiste.schliesse();
                tinte.append(vorschau);
            }
            const { x, y } = dockZugOrt(e, d);
            d.vorschau?.setAttribute('transform', `translate(${x} ${y})`);
        };
        const dockZugEnde = (e) => {
            const d = dockZug;
            if (!d || (e && d.pointer !== e.pointerId))
                return;
            dockZug = null;
            if (!d.vorschau)
                return;
            d.vorschau.remove();
            dockKlickUnterdrueckt = d.knopf;
            if (e?.type !== 'pointerup')
                return;
            const ziel = document.elementFromPoint(e.clientX, e.clientY);
            if (!ziel || !flaeche.contains(ziel) || ziel.closest('.gfx-tb-sockel, .pg-fl-notiz'))
                return;
            const ort = dockZugOrt(e, d);
            flaeche.focus({ preventScroll: true });
            if (d.vorlage) {
                leiste.schliesse();
                vorlageEinsetzen(d.vorlage, ort);
                return;
            }
            if (d.art === 'notiz') {
                void textBearbeiten(null, ort);
                return;
            }
            const id = Store.uid().slice(0, 8);
            merken();
            formen.push({ id, art: d.art, ...ort, w: d.w, h: d.h, ...formenStil(d.art) });
            werkzeugWechseln('zeiger');
            leiste.setzeWerkzeug('zeiger');
            auswahlSetzen([id]);
            sichern();
        };
        leiste.element.addEventListener('click', (e) => {
            if (!e.detail || !dockKlickUnterdrueckt || !(e.target instanceof Element) ||
                e.target.closest('button') !== dockKlickUnterdrueckt)
                return;
            dockKlickUnterdrueckt = null;
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);
        let rahmenZug = null;
        const rahmenZugStart = (e) => {
            const ort = inFlaeche(e.clientX, e.clientY);
            const element = GfxShapes.sv('rect', { class: 'pg-fl-rahmenwahl', x: ort.x, y: ort.y,
                width: 0, height: 0, 'vector-effect': 'non-scaling-stroke', 'aria-hidden': 'true' });
            rahmenZug = { pointer: e.pointerId, ...ort, sx: e.clientX, sy: e.clientY, element,
                vorhandene: e.shiftKey ? [...auswahl] : [] };
            tinte.append(element);
            e.preventDefault();
            flaeche.focus({ preventScroll: true });
            try {
                flaeche.setPointerCapture(e.pointerId);
            }
            catch { }
        };
        const auswahlRechteck = (e, start) => {
            const ort = inFlaeche(e.clientX, e.clientY);
            return { x: Math.min(ort.x, start.x), y: Math.min(ort.y, start.y),
                w: Math.abs(ort.x - start.x), h: Math.abs(ort.y - start.y) };
        };
        const rahmenZugEnde = (e) => {
            const r = rahmenZug;
            if (!r || (e && r.pointer !== e.pointerId))
                return;
            rahmenZug = null;
            r.element.remove();
            if (e?.type !== 'pointerup' || Math.hypot(e.clientX - r.sx, e.clientY - r.sy) < 4)
                return;
            const box = auswahlRechteck(e, r);
            const darin = formen.filter(form => {
                if (!beweglich(form))
                    return false;
                const f = GfxShapes.rahmenVon(form);
                return f.x >= box.x && f.y >= box.y && f.x + f.w <= box.x + box.w && f.y + f.h <= box.y + box.h;
            });
            werkzeugWechseln('zeiger');
            leiste.setzeWerkzeug('zeiger');
            auswahlSetzen([...r.vorhandene, ...darin.map(formId)]);
        };
        const beginnt = (e) => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (ziel && leiste.element.contains(ziel)) {
                dockKlickUnterdrueckt = null;
                dockZugStart(e, ziel);
                return;
            }
            if (gastVon(e.target))
                return;
            finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                if (a && b)
                    kneifen = { abstand: Math.hypot(a.x - b.x, a.y - b.y), z: sicht.z };
                zug = null;
                if (formenZug)
                    formZugEnde();
                if (rahmenZug)
                    rahmenZugEnde();
                if (skalierZug)
                    skalierZugEnde();
                return;
            }
            const griffElement = ziel?.closest('[data-skaliergriff]');
            const griff = griffElement?.getAttribute('data-skaliergriff');
            if (griff && auswahlRahmen.contains(griffElement ?? null) && Object.hasOwn(ECKEN, griff) && e.button === 0) {
                skalierZugStart(e, griff);
                return;
            }
            if (werkzeug === 'rahmenwahl' && e.button === 0 && !ziel?.closest('.pg-fl-notiz, .gfx-tb-sockel')) {
                rahmenZugStart(e);
                return;
            }
            if (maltGerade() && !ziel?.closest('.gfx-tb-sockel') && !ziel?.closest('.pg-fl-notiz')) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                try {
                    flaeche.setPointerCapture(e.pointerId);
                }
                catch { }
                merken();
                if (werkzeug === 'radierer') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z, true);
                    if (treffer) {
                        formenEntfernen(new Set([formId(treffer)]));
                        sichern();
                    }
                    else
                        verwerfen();
                    aktiv = { art: 'radieren' };
                    return;
                }
                aktiv = werkzeug === 'stift'
                    ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [[r2(punkt.x), r2(punkt.y)]], farbe,
                        strichBreite: marker ? markerBreite : stiftBreite, marker }
                    : { id: Store.uid().slice(0, 8), art: werkzeug, x: punkt.x, y: punkt.y, w: 0, h: 0,
                        ...formenStil(werkzeug) };
                stiftGlatt = werkzeug === 'stift' && typeof InkStroke !== 'undefined'
                    ? InkStroke.glaetter([r2(punkt.x), r2(punkt.y)]) : null;
                stiftZeit = Number(e.timeStamp) || 0;
                formen.push(aktiv);
                malen();
                return;
            }
            if (e.button === 0 && !ziel?.closest('.pg-fl-notiz, .gfx-tb-sockel')) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                if (werkzeug === 'notiz') {
                    finger.delete(e.pointerId);
                    e.preventDefault();
                    void textBearbeiten(null, punkt);
                    return;
                }
                if (werkzeug === 'verbindung') {
                    const id = formId(formAn(punkt.x, punkt.y, 8 / sicht.z));
                    if (!id || id === verbindeVon) {
                        verbindeVon = '';
                        auswahlSetzen([]);
                    }
                    else if (!verbindeVon) {
                        verbindeVon = id;
                        auswahlSetzen([id]);
                        UI.toast('Zweite Form auswählen');
                    }
                    else {
                        if (!formen.some(form => form.art === 'verbindung' && form.von === verbindeVon && form.nach === id)) {
                            merken();
                            formen.push({ id: Store.uid().slice(0, 8), art: 'verbindung', von: verbindeVon, nach: id, farbe });
                            sichern();
                        }
                        verbindeVon = '';
                        auswahlSetzen([]);
                    }
                    return;
                }
            }
            if (werkzeug === 'zeiger' && e.button === 0 &&
                !ziel?.closest('.pg-fl-notiz, .gfx-tb-sockel')) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                const treffer = formAn(punkt.x, punkt.y, (e.pointerType === 'touch' ? 12 : 5) / sicht.z);
                if (beweglich(treffer)) {
                    const id = formId(treffer);
                    e.preventDefault();
                    flaeche.focus({ preventScroll: true });
                    if (e.shiftKey) {
                        auswahlSetzen(auswahl.has(id) ? [...auswahl].filter(x => x !== id) : [...auswahl, id]);
                        return;
                    }
                    if (!auswahl.has(id))
                        auswahlSetzen([id]);
                    formenZug = { pointer: e.pointerId, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 };
                    try {
                        flaeche.setPointerCapture(e.pointerId);
                    }
                    catch { }
                    return;
                }
                if (e.shiftKey) {
                    rahmenZugStart(e);
                    return;
                }
                if (auswahl.size)
                    auswahlSetzen([]);
            }
            if (ziel?.closest('.pg-fl-menue')) {
                return;
            }
            else if (ziel?.closest('.pg-fl-kopf') && werkzeug === 'zeiger') {
                const el = ziel.closest('.pg-fl-notiz');
                const eintrag = kaesten.find(k => k.el === el);
                if (el && eintrag) {
                    zug = {
                        art: 'kasten', sx: e.clientX, sy: e.clientY,
                        ax: eintrag.plan.ort.x, ay: eintrag.plan.ort.y, el, plan: eintrag.plan
                    };
                }
            }
            else if (ziel?.closest('.gfx-tb-sockel')) {
                return;
            }
            else if (werkzeug === 'hand' || e.button === 1 || !ziel?.closest('.pg-fl-notiz')) {
                zug = { art: 'flaeche', sx: e.clientX, sy: e.clientY, ax: sicht.x, ay: sicht.y };
            }
            if (zug)
                flaeche.setPointerCapture(e.pointerId);
        };
        const bewegt = (e) => {
            if (dockZug) {
                dockZugZeigen(e);
                return;
            }
            if (finger.has(e.pointerId))
                finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (skalierZug) {
                if (skalierZug.pointer !== e.pointerId)
                    return;
                skalierZug.nachher = skalierZiel(e, skalierZug);
                if (!skalierBild)
                    skalierBild = requestAnimationFrame(skalierVorschau);
                return;
            }
            if (rahmenZug?.pointer === e.pointerId) {
                const box = auswahlRechteck(e, rahmenZug);
                const rect = rahmenZug.element;
                rect.setAttribute('x', String(box.x));
                rect.setAttribute('y', String(box.y));
                rect.setAttribute('width', String(box.w));
                rect.setAttribute('height', String(box.h));
                return;
            }
            if (formenZug) {
                if (formenZug.pointer !== e.pointerId)
                    return;
                Object.assign(formenZug, formVersatz(e, formenZug));
                if (!formenBild)
                    formenBild = requestAnimationFrame(formVorschau);
                return;
            }
            if (aktiv) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                if (aktiv.art === 'radieren') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z, true);
                    if (treffer) {
                        formenEntfernen(new Set([formId(treffer)]));
                        sichern();
                    }
                    return;
                }
                if (aktiv.art === 'stift') {
                    const gesammelt = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
                    for (const ereignis of (gesammelt.length ? gesammelt : [e])) {
                        const roh = inFlaeche(ereignis.clientX, ereignis.clientY);
                        const jetzt = Number(ereignis.timeStamp) || stiftZeit + 16;
                        const dt = Math.max(1, jetzt - stiftZeit);
                        stiftZeit = jetzt;
                        const q = stiftGlatt ? stiftGlatt([roh.x, roh.y], dt) : [roh.x, roh.y];
                        const letzter = aktiv.pts[aktiv.pts.length - 1];
                        if (letzter && Math.hypot(q[0] - letzter[0], q[1] - letzter[1]) < 0.6 / Math.max(0.1, sicht.z))
                            continue;
                        aktiv.pts.push([r2(q[0]), r2(q[1])]);
                    }
                    if (!stiftBildGeplant) {
                        stiftBildGeplant = true;
                        requestAnimationFrame(stiftNachziehen);
                    }
                    return;
                }
                aktiv.w = punkt.x - aktiv.x;
                aktiv.h = punkt.y - aktiv.y;
                malen();
                return;
            }
            if (kneifen && finger.size === 2) {
                const [a, b] = [...finger.values()];
                if (!a || !b)
                    return;
                const jetzt = Math.hypot(a.x - b.x, a.y - b.y);
                if (kneifen.abstand > 0)
                    massstab(kneifen.z * (jetzt / kneifen.abstand), (a.x + b.x) / 2, (a.y + b.y) / 2);
                return;
            }
            if (!zug)
                return;
            const dx = e.clientX - zug.sx;
            const dy = e.clientY - zug.sy;
            if (zug.art === 'flaeche') {
                sicht = { x: zug.ax + dx, y: zug.ay + dy, z: sicht.z };
                stellen(false);
            }
            else if (zug.el && zug.plan) {
                zug.plan.ort.x = zug.ax + dx / sicht.z;
                zug.plan.ort.y = zug.ay + dy / sicht.z;
                zug.el.style.left = zug.plan.ort.x + 'px';
                zug.el.style.top = zug.plan.ort.y + 'px';
                if (zug.plan.art === 'block') {
                    const drueber = ueberSeitenkasten(e.clientX, e.clientY);
                    kasten.classList.toggle('pg-fl-ziel', drueber);
                    zug.el.classList.toggle('pg-fl-zurueck', drueber);
                }
            }
        };
        const ueberSeitenkasten = (sx, sy) => {
            const r = kasten.getBoundingClientRect();
            return sx >= r.left && sx <= r.right && sy >= r.top && sy <= r.bottom;
        };
        const endet = (e) => {
            if (dockZug?.pointer === e.pointerId) {
                dockZugEnde(e);
                return;
            }
            finger.delete(e.pointerId);
            if (finger.size < 2)
                kneifen = null;
            if (skalierZug?.pointer === e.pointerId) {
                skalierZugEnde(e);
                return;
            }
            if (rahmenZug?.pointer === e.pointerId) {
                rahmenZugEnde(e);
                return;
            }
            if (formenZug?.pointer === e.pointerId) {
                const { dx, dy } = formVersatz(e, formenZug);
                formZugEnde();
                if (e.type === 'pointerup')
                    auswahlVerschieben(dx, dy);
                return;
            }
            if (aktiv) {
                const fertig = aktiv;
                aktiv = null;
                if (fertig.art === 'radieren')
                    return;
                if (fertig.art === 'stift' && fertig.pts.length >= 2) {
                    if (e.type === 'pointerup') {
                        const roh = inFlaeche(e.clientX, e.clientY);
                        const letzter = fertig.pts[fertig.pts.length - 1];
                        if (Math.hypot(roh.x - letzter[0], roh.y - letzter[1]) >= 0.3)
                            fertig.pts.push([r2(roh.x), r2(roh.y)]);
                    }
                    if (typeof InkGeometry !== 'undefined' && fertig.pts.length > 3) {
                        fertig.pts = InkGeometry.simplify(fertig.pts, 0.5 / Math.max(0.1, sicht.z))
                            .map((q) => [r2(Number(q[0])), r2(Number(q[1]))]);
                    }
                }
                stiftGlatt = null;
                const klein = fertig.art === 'stift'
                    ? fertig.pts.length < 2
                    : Math.abs(fertig.w) < 4 && Math.abs(fertig.h) < 4;
                if (klein) {
                    formen = formen.filter(x => x !== fertig);
                    verwerfen();
                }
                sichern();
                return;
            }
            if (!zug)
                return;
            const jetzt = zug;
            zug = null;
            if (jetzt.art === 'flaeche') {
                sichtSchreiben(p.id, sicht);
                return;
            }
            if (!jetzt.plan)
                return;
            kasten.classList.remove('pg-fl-ziel');
            jetzt.el?.classList.remove('pg-fl-zurueck');
            if (jetzt.plan.art === 'block' && ueberSeitenkasten(e.clientX, e.clientY)) {
                zurueckInText(jetzt.plan.block);
                return;
            }
            jetzt.plan.merken(jetzt.plan.ort);
        };
        flaeche.tabIndex = 0;
        flaeche.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dockZug) {
                e.preventDefault();
                dockZugEnde();
                return;
            }
            if (e.key === 'Escape' && rahmenZug) {
                e.preventDefault();
                rahmenZugEnde();
                return;
            }
            if (skalierZug && (e.key === 'Escape' || e.key === 'Delete' || e.key.startsWith('Arrow') || e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (e.key === 'Escape')
                    skalierZugEnde();
                return;
            }
            if (e.defaultPrevented)
                return;
            if (e.key === 'Escape' && leiste.istOffen()) {
                leiste.schliesse();
                e.preventDefault();
                return;
            }
            const ziel = e.target;
            if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.isContentEditable))
                return;
            if (e.key === 'Tab' && gastFlaeche && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const halt = imSchacht.querySelector('button[tabindex="0"]');
                if (!e.shiftKey && ziel === gastFlaeche && halt) {
                    e.preventDefault();
                    halt.focus();
                    return;
                }
                if (e.shiftKey && ziel === halt) {
                    e.preventDefault();
                    gastFlaeche.focus();
                    return;
                }
                if (!e.shiftKey && ziel && imSchacht.contains(ziel)) {
                    for (const nach of naechsteHalte(gastFlaeche)) {
                        nach.focus();
                        if (document.activeElement === nach) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
            }
            if (ziel === flaeche) {
                if (e.key === 'Escape' && auswahl.size) {
                    e.preventDefault();
                    if (formenZug)
                        formZugEnde();
                    verbindeVon = '';
                    auswahlSetzen([]);
                    return;
                }
                if (e.key === 'Delete' && auswahl.size) {
                    e.preventDefault();
                    auswahlLoeschen();
                    return;
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !formenZug) {
                    e.preventDefault();
                    alleFormenWaehlen();
                    return;
                }
                const richtung = {
                    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
                }[e.key];
                if (richtung && auswahl.size && werkzeug === 'zeiger' && !formenZug && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    const schritt = e.shiftKey ? 10 : 1;
                    auswahlVerschieben(richtung[0] * schritt, richtung[1] * schritt);
                    return;
                }
            }
            if (!(e.ctrlKey || e.metaKey))
                return;
            const taste = e.key.toLowerCase();
            if (formenZug && (taste === 'z' || taste === 'y')) {
                e.preventDefault();
                return;
            }
            if (gastFlaeche && ziel && imSchacht.contains(ziel) &&
                (taste === 'z' || (taste === 'y' && !e.shiftKey))) {
                const weiter = new KeyboardEvent('keydown', {
                    key: e.key, code: e.code, ctrlKey: e.ctrlKey, metaKey: e.metaKey,
                    shiftKey: e.shiftKey, bubbles: true, cancelable: true
                });
                gastFlaeche.dispatchEvent(weiter);
                e.preventDefault();
                return;
            }
            if (taste === 'z' && !e.shiftKey) {
                e.preventDefault();
                schrittZurueck();
            }
            else if ((taste === 'z' && e.shiftKey) || (taste === 'y' && !e.shiftKey)) {
                e.preventDefault();
                schrittVor();
            }
        });
        flaeche.addEventListener('pointerdown', beginnt);
        flaeche.addEventListener('pointermove', bewegt);
        flaeche.addEventListener('pointerup', endet);
        flaeche.addEventListener('pointercancel', endet);
        flaeche.addEventListener('lostpointercapture', (e) => {
            if (formenZug?.pointer === e.pointerId || dockZug?.pointer === e.pointerId ||
                rahmenZug?.pointer === e.pointerId || skalierZug?.pointer === e.pointerId)
                endet(e);
        });
        const istBlockZug = (e) => !!e.dataTransfer && [...e.dataTransfer.types].includes('application/x-redion-block');
        flaeche.addEventListener('dragover', (e) => {
            if (!istBlockZug(e))
                return;
            e.preventDefault();
            if (e.dataTransfer)
                e.dataTransfer.dropEffect = 'move';
            const ueberKasten = e.target instanceof Element && !!e.target.closest('.pg-fl-notiz');
            flaeche.classList.toggle('pg-fl-nimmt', !ueberKasten);
        });
        flaeche.addEventListener('dragleave', (e) => {
            if (e.target === flaeche)
                flaeche.classList.remove('pg-fl-nimmt');
        });
        flaeche.addEventListener('drop', (e) => {
            flaeche.classList.remove('pg-fl-nimmt');
            if (!istBlockZug(e))
                return;
            const id = e.dataTransfer?.getData('application/x-redion-block') ?? '';
            const b = id ? Store.getBlock(id) : null;
            if (!b)
                return;
            if (e.target instanceof Element && e.target.closest('.pg-fl-notiz'))
                return;
            e.preventDefault();
            e.stopPropagation();
            const fp = inFlaeche(e.clientX, e.clientY);
            aufFlaeche(b, { x: Math.round(fp.x), y: Math.round(fp.y) });
        });
        const radWeg = (e) => e.shiftKey && e.deltaX === 0 ? { dx: e.deltaY, dy: 0 } : { dx: e.deltaX, dy: e.deltaY };
        const rolltSelbst = (e) => {
            const { dx, dy } = radWeg(e);
            const quer = Math.abs(dx) > Math.abs(dy);
            const weg = quer ? dx : dy;
            if (!weg)
                return false;
            for (let el = e.target instanceof Element ? e.target : null; el && el !== ebene && el !== flaeche; el = el.parentElement) {
                const st = getComputedStyle(el);
                const art = quer ? st.overflowX : st.overflowY;
                if (art !== 'auto' && art !== 'scroll')
                    continue;
                const max = quer ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
                if (max <= 1)
                    continue;
                const stand = quer ? el.scrollLeft : el.scrollTop;
                if (weg < 0 ? stand > 0.5 : stand < max - 0.5)
                    return true;
            }
            return false;
        };
        flaeche.addEventListener('wheel', (e) => {
            if (e.defaultPrevented)
                return;
            if (!(e.ctrlKey || e.metaKey) && rolltSelbst(e))
                return;
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                massstab(sicht.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
                return;
            }
            const { dx, dy } = radWeg(e);
            sicht = { x: sicht.x - dx, y: sicht.y - dy, z: sicht.z };
            stellen();
        }, { passive: false });
        if (sichtLesen(p.id))
            stellen(false);
        else
            requestAnimationFrame(() => passend());
        stellen(false);
    };
    return { zeichne, aufFlaeche, zurueckInText, setzeZeigen };
})();
window.Seitenflaeche = Seitenflaeche;
