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
        GfxShapes.pfeilMarke(tinteDefs, 'pfl' + String(p.id).slice(0, 6));
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
        const massstabZeigen = document.createElement('b');
        massstabZeigen.className = 'pg-fl-massstab';
        massstabZeigen.setAttribute('aria-live', 'polite');
        massstabZeigen.textContent = '100 %';
        const stellen = (merken = true) => {
            const z = sicht.z;
            ebene.style.transform = `translate(${sicht.x}px, ${sicht.y}px) scale(${z})`;
            flaeche.style.backgroundSize = `${RASTER * z}px ${RASTER * z}px`;
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
            const leisteHoch = 84;
            const nutzHoehe = Math.max(120, k.height - leisteHoch - rand);
            const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(1, (k.width - rand * 2) / w, (nutzHoehe - rand) / h)));
            sicht = {
                z,
                x: (k.width - w * z) / 2 - x0 * z,
                y: Math.max(rand, (nutzHoehe - h * z) / 2) - y0 * z
            };
            stellen();
        };
        const malen = () => {
            [...tinte.childNodes].forEach(k => { if (k !== tinteDefs)
                tinte.removeChild(k); });
            for (const form of formen)
                tinte.appendChild(GfxShapes.zeichne(form, { pfeilMarke: 'pfl' + String(p.id).slice(0, 6) }));
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
        const formAn = (fx, fy, radius) => {
            for (let i = formen.length - 1; i >= 0; i--) {
                const form = formen[i];
                if (form?.art === 'stift') {
                    const pts = Array.isArray(form.pts) ? form.pts : [];
                    const nah = (a, b) => {
                        const ax = Number(a?.[0]), ay = Number(a?.[1]), bx = Number(b?.[0]), by = Number(b?.[1]);
                        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
                        const t = l2 > 0 ? Math.max(0, Math.min(1, ((fx - ax) * dx + (fy - ay) * dy) / l2)) : 0;
                        return Math.hypot(ax + t * dx - fx, ay + t * dy - fy) <= radius;
                    };
                    if (pts.some((q, i) => nah(q, pts[i + 1] ?? q)))
                        return form;
                    continue;
                }
                const r = GfxShapes.rahmenVon(form);
                if (fx >= r.x - radius && fx <= r.x + r.w + radius &&
                    fy >= r.y - radius && fy <= r.y + r.h + radius)
                    return form;
            }
            return null;
        };
        const MALWERKZEUGE = ['stift', 'linie', 'pfeil', 'rechteck', 'ellipse'];
        const maltGerade = () => MALWERKZEUGE.includes(werkzeug) || werkzeug === 'radierer';
        malen();
        const leiste = GfxToolbar.erstelle({
            klasse: 'pg-fl-tools',
            beschriftung: 'Werkzeuge der Fläche',
            werkzeuge: Register.werkzeuge.auswahl(['zeiger', 'hand', 'stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'radierer']),
            aktiv: 'zeiger',
            aktionen: [
                { id: 'farbe', name: 'Farbe', titel: 'Farbe der Formen', sym: 'palette',
                    menue: true, kapsel: 'werkzeuge' },
                { id: 'zurueck', name: 'Rückgängig', titel: 'Rückgängig (Strg + Z)', sym: 'undo', gesperrt: true },
                { id: 'vor', name: 'Schritt vorwärts', titel: 'Schritt vorwärts (Strg + Umschalt + Z)',
                    sym: 'redo', gesperrt: true },
                { id: 'kleiner', name: 'Kleiner', titel: 'Kleiner (Strg + Rad)', sym: 'minus' },
                { id: 'groesser', name: 'Grösser', titel: 'Grösser (Strg + Rad)', sym: 'plus' },
                { id: 'passend', name: 'Ins Bild', titel: 'Alles ins Bild holen', sym: 'maximize' }
            ],
            zusatz: { groesser: massstabZeigen },
            menue: (id) => {
                if (id !== 'farbe')
                    return null;
                const kasten = document.createElement('div');
                kasten.className = 'gfx-tb-farben';
                for (const [wert, name] of GfxShapes.PALETTE) {
                    const k = document.createElement('button');
                    k.type = 'button';
                    k.dataset['c'] = wert;
                    k.title = name;
                    k.setAttribute('aria-label', name);
                    k.style.background = wert;
                    if (wert === farbe)
                        k.classList.add('an');
                    k.addEventListener('click', () => { farbe = wert; leiste.schliesse(); });
                    kasten.appendChild(k);
                }
                return kasten;
            },
            aufWerkzeug: (id) => {
                werkzeug = id;
                flaeche.dataset['wz'] = id;
            },
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
            }
        });
        flaeche.insertBefore(leiste.element, ebene);
        flaeche.dataset['wz'] = werkzeug;
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(leiste.element);
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
        const beginnt = (e) => {
            if (gastVon(e.target))
                return;
            finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                if (a && b)
                    kneifen = { abstand: Math.hypot(a.x - b.x, a.y - b.y), z: sicht.z };
                zug = null;
                return;
            }
            const ziel = e.target instanceof Element ? e.target : null;
            if (maltGerade() && !ziel?.closest('.gfx-tb-sockel') && !ziel?.closest('.pg-fl-notiz')) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                try {
                    flaeche.setPointerCapture(e.pointerId);
                }
                catch { }
                merken();
                if (werkzeug === 'radierer') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z);
                    if (treffer) {
                        formen = formen.filter(x => x !== treffer);
                        sichern();
                    }
                    else
                        verwerfen();
                    aktiv = { art: 'radieren' };
                    return;
                }
                aktiv = werkzeug === 'stift'
                    ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [[r2(punkt.x), r2(punkt.y)]], farbe }
                    : { id: Store.uid().slice(0, 8), art: werkzeug, x: punkt.x, y: punkt.y, w: 0, h: 0, farbe };
                stiftGlatt = werkzeug === 'stift' && typeof InkStroke !== 'undefined'
                    ? InkStroke.glaetter([r2(punkt.x), r2(punkt.y)]) : null;
                stiftZeit = Number(e.timeStamp) || 0;
                formen.push(aktiv);
                malen();
                return;
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
            if (finger.has(e.pointerId))
                finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (aktiv) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                if (aktiv.art === 'radieren') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z);
                    if (treffer) {
                        formen = formen.filter(x => x !== treffer);
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
            finger.delete(e.pointerId);
            if (finger.size < 2)
                kneifen = null;
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
            if (e.defaultPrevented)
                return;
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
            if (!(e.ctrlKey || e.metaKey))
                return;
            const taste = e.key.toLowerCase();
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
