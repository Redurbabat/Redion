"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/planflaeche.ts (npm run bauen:ts). */
const Planflaeche = (() => {
    const esc = Schaltplan.esc;
    const FAVORITEN = 'elektro:favoriten';
    const favoriten = () => {
        const roh = (typeof Store !== 'undefined') ? Store.getMeta(FAVORITEN, []) : [];
        return Array.isArray(roh) ? roh.map(String) : [];
    };
    const favoritUmschalten = (id) => {
        const liste = favoriten();
        const i = liste.indexOf(id);
        if (i >= 0)
            liste.splice(i, 1);
        else
            liste.push(id);
        if (typeof Store !== 'undefined')
            Store.setMeta(FAVORITEN, liste);
        return i < 0;
    };
    const paletteHtml = (planArt, suche = '') => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return '';
        const art = Schaltplan.artVon(planArt);
        const alleGruppen = Register.fachzeichen.gruppen();
        const sortiert = [
            ...art.gruppen.map(g => alleGruppen.find(x => x[0] === g)).filter(Boolean),
            ...alleGruppen.filter(x => !art.gruppen.includes(x[0]))
        ];
        const q = suche.trim().toLowerCase();
        const passt = (z) => !q ||
            z.name.toLowerCase().includes(q) || z.id.includes(q) ||
            z.erklaerung.toLowerCase().includes(q);
        const knopf = (z, favorit) => `<button class="sp-sym${favorit ? ' sp-fav' : ''}" data-sym="${esc(z.id)}" ` +
            `title="${esc(z.name)} — ${esc(z.erklaerung)}" aria-label="${esc(z.name)}">` +
            `<span class="sp-sym-bild">${Register.fachzeichen.alsSvg(z.id, { strich: 2 })}</span>` +
            `<span class="sp-sym-name">${esc(z.name)}</span></button>`;
        const fav = favoriten();
        const favZeichen = fav.map(id => Register.fachzeichen.holen(id)).filter(Boolean).filter(passt);
        return (favZeichen.length
            ? `<div class="sp-grp">★ Favoriten</div><div class="sp-syms">` +
                favZeichen.map((z) => knopf(z, true)).join('') + '</div>'
            : '') +
            sortiert.map(g => {
                const zeichen = Register.fachzeichen.inGruppe(g[0]).filter(passt);
                if (!zeichen.length)
                    return '';
                return `<div class="sp-grp">${esc(g[2])} ${esc(g[1])}</div><div class="sp-syms">` +
                    zeichen.map(z => knopf(z, fav.includes(z.id))).join('') + '</div>';
            }).join('');
    };
    const ortAus = (svg, e, plan, ohneRaster = false) => {
        const m = svg.getScreenCTM();
        let x, y;
        if (m) {
            const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
            x = q.x;
            y = q.y;
        }
        else {
            const r = svg.getBoundingClientRect();
            x = (e.clientX - r.left) * plan.breite / (r.width || 1);
            y = (e.clientY - r.top) * plan.hoehe / (r.height || 1);
        }
        return ohneRaster ? { x, y } : { x: Schaltplan.rasten(x), y: Schaltplan.rasten(y) };
    };
    const RADIERER = 'elektro:radierer';
    const RADIER_GROESSEN = [[8, 'klein'], [16, 'mittel'], [28, 'gross']];
    const radiererLesen = () => {
        const roh = (typeof Store !== 'undefined') ? Store.getMeta(RADIERER, null) : null;
        const modus = roh && roh.modus === 'leiter' ? 'leiter' : 'alles';
        const g = roh ? Number(roh.groesse) : 16;
        return { modus, groesse: RADIER_GROESSEN.some(x => x[0] === g) ? g : 16 };
    };
    const zeichne = (block) => {
        const wurzel = document.createElement('div');
        wurzel.className = 'sp-wrap';
        let batterieOffen = !!(block && block.plan && block.plan.batterieUebung);
        let batterie = null;
        const z = {
            block,
            plan: Schaltplan.lesen(block),
            werkzeug: 'zeigen',
            auswahl: new Set(),
            gewaehltesZeichen: '',
            zieht: null,
            verlauf: GfxHistory.erstelle(60),
            zeigeAnschluesse: true,
            zeigeNummern: false,
            zeigeRaster: true,
            ansicht: { zoom: 1, x: 0, y: 0 },
            voll: false,
            radierModus: radiererLesen().modus,
            radierGroesse: radiererLesen().groesse,
            schieneArt: 'L1',
            leertaste: false,
            simulation: false,
            stellungen: {},
            spulenStand: {},
            ergebnis: null
        };
        const abzug = () => JSON.stringify(z.plan);
        const aendere = (was, merken = true, vorherAbzug) => {
            if (z.zieht)
                return;
            const vorher = merken ? (vorherAbzug ?? abzug()) : '';
            was();
            const kopie = JSON.parse(abzug());
            if (typeof Store !== 'undefined' && block && block.id)
                Store.updateBlock(block.id, { plan: kopie });
            else if (block)
                block.plan = kopie;
            if (merken)
                z.verlauf.merken(vorher);
            male();
        };
        const zurueck = () => {
            if (z.zieht)
                return;
            const vorher = z.verlauf.zurueck(abzug());
            if (vorher === null)
                return;
            z.plan = JSON.parse(vorher);
            aendere(() => { }, false);
        };
        const vorwaerts = () => {
            if (z.zieht)
                return;
            const naechster = z.verlauf.vor(abzug());
            if (naechster === null)
                return;
            z.plan = JSON.parse(naechster);
            aendere(() => { }, false);
        };
        const kopf = document.createElement('div');
        kopf.className = 'sp-kopf';
        const batteriePanel = document.createElement('section');
        batteriePanel.className = 'sp-batterie-fach';
        batteriePanel.setAttribute('aria-label', 'Batterieanlagen und Übungen');
        batteriePanel.hidden = !batterieOffen;
        const palette = document.createElement('div');
        palette.className = 'sp-palette';
        const buehne = document.createElement('div');
        buehne.className = 'sp-buehne';
        const fuss = document.createElement('div');
        fuss.className = 'sp-fuss';
        const leinwand = document.createElement('div');
        leinwand.className = 'sp-leinwand';
        buehne.appendChild(leinwand);
        const zoomleiste = document.createElement('div');
        zoomleiste.className = 'sp-zoom';
        zoomleiste.setAttribute('role', 'group');
        zoomleiste.setAttribute('aria-label', 'Zoom');
        zoomleiste.innerHTML =
            `<button type="button" data-a="zoom-minus" title="Verkleinern (−)" aria-label="Verkleinern">−</button>` +
                `<span class="sp-zoomwert" aria-live="polite">100 %</span>` +
                `<button type="button" data-a="zoom-plus" title="Vergrössern (+)" aria-label="Vergrössern">+</button>` +
                `<button type="button" data-a="zoom-alles" title="Alles zeigen (0)" aria-label="Alles zeigen">⤢</button>`;
        const koerper = document.createElement('div');
        koerper.className = 'sp-koerper';
        koerper.appendChild(palette);
        koerper.appendChild(buehne);
        const fussInhalt = document.createElement('div');
        fussInhalt.className = 'sp-fuss-inhalt';
        fuss.appendChild(fussInhalt);
        fuss.appendChild(zoomleiste);
        wurzel.appendChild(kopf);
        wurzel.appendChild(batteriePanel);
        wurzel.appendChild(koerper);
        wurzel.appendChild(fuss);
        const kopfMalen = () => {
            const art = Schaltplan.artVon(z.plan.art);
            kopf.innerHTML =
                `<select class="sp-art" aria-label="Planart">` +
                    Schaltplan.ARTEN.map(a => `<option value="${esc(a.id)}"${a.id === z.plan.art ? ' selected' : ''}>` +
                        `${esc(a.name)}</option>`).join('') + '</select>' +
                    `<span class="sp-arterkl">${esc(art.erklaerung)}</span>` +
                    `<span class="sp-werkzeuge">` +
                    [['zeigen', '↖', 'Auswählen und verschieben'],
                        ['leitung', '⌐', 'Leitung ziehen'],
                        ['text', 'T', 'Beschriftung setzen'],
                        ['schiene', '☰', 'Schiene zeichnen — L1, L2, L3, N, PE'],
                        ['radieren', '⌫', 'Radieren — über die Fläche wischen']].map(([id, ic, t]) => `<button class="sp-wz${z.werkzeug === id ? ' an' : ''}" data-wz="${id}" ` +
                        `title="${esc(t)}" aria-label="${esc(t)}">${ic}</button>`).join('') +
                    `</span>` +
                    `<span class="sp-rechts">` +
                    (z.plan.art.startsWith('stromlauf')
                        ? `<button class="sp-netz" data-a="netz" ` +
                            `title="Netz (L1 und N mit Quelle) oder eine fertige Beispielschaltung einfügen — bereit zum Simulieren" ` +
                            `aria-label="Netz oder Beispielschaltung einfügen">⚡ Schaltung</button>`
                        : '') +
                    `<button class="sp-netz${batterieOffen ? ' an' : ''}" data-a="batterie-labor" title="Batteriezellen direkt im Schaltplan platzieren, verbinden und messen" aria-pressed="${batterieOffen}" aria-label="Batterieübungen in diesem Schaltplan">🔋 Batterien</button>` +
                    `<button class="sp-start${z.simulation ? ' an' : ''}" data-a="simulation" ${z.plan.batterieUebung ? 'disabled' : ''} ` +
                    `title="${z.plan.batterieUebung ? 'Batterieanlage im Batterie-Fach messen' : z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}" ` +
                    `aria-pressed="${z.simulation}" ` +
                    `aria-label="${z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}">` +
                    `${z.simulation ? '◼' : '▶'} Strom</button>` +
                    `<button class="sp-heft${heftOffen() ? ' an' : ''}" data-a="heft" ` +
                    `title="Formelheft — beim Zeichnen nachschlagen und rechnen" ` +
                    `aria-pressed="${heftOffen()}" aria-label="Formelheft">📐</button>` +
                    `<button data-a="zurueck" title="Rückgängig" aria-label="Rückgängig"${z.verlauf.kannZurueck() ? '' : ' disabled'}>↶</button>` +
                    `<button data-a="vorwaerts" title="Wiederholen" aria-label="Wiederholen"${z.verlauf.kannVor() ? '' : ' disabled'}>↷</button>` +
                    `<button data-a="mehr" title="Mehr" aria-label="Mehr">…</button>` +
                    (z.voll
                        ? `<button class="sp-vollzu" data-a="vollbild-zu" title="Vollbild beenden (Esc)" aria-label="Vollbild beenden">✕</button>`
                        : `<button data-a="vollbild" title="Vollbild (F)" aria-label="Vollbild">⛶</button>`) +
                    `</span>`;
        };
        const meldungHtml = () => {
            const e = z.ergebnis;
            if (!e)
                return '';
            if (!e.ok)
                return `<span class="sp-meldung fehler">⚠ ${esc(e.fehler)}</span>`;
            const teile = [];
            (e.warnungen || []).slice(0, 3).forEach((x) => teile.push(`<span class="sp-meldung warnung">⚠ ${esc(x)}</span>`));
            if ((e.warnungen || []).length > 3)
                teile.push(`<span class="sp-meldung warnung">… und ${e.warnungen.length - 3} weitere</span>`);
            if (!teile.length && (e.annahmen || []).length)
                teile.push(`<span class="sp-meldung annahme" title="${esc(e.annahmen.join(' '))}">` +
                    `ⓘ ${e.annahmen.length} Annahme${e.annahmen.length === 1 ? '' : 'n'} — antippen für den Wortlaut</span>`);
            if (!teile.length)
                teile.push(`<span class="sp-meldung gut">✓ Die Schaltung rechnet.</span>`);
            return teile.join('');
        };
        const fussMalen = () => {
            if (z.simulation) {
                const e = z.ergebnis;
                const leuchtet = e && e.ok
                    ? Object.keys(e.werte).filter(k => (e.werte[k].helligkeit || 0) > 0.01).length : 0;
                fussInhalt.innerHTML =
                    `<span class="sp-simzahlen">` +
                        (e && e.ok
                            ? `${leuchtet} ${leuchtet === 1 ? 'leuchtet' : 'leuchten'} · ` +
                                `grösster Strom ${esc(Stromfluss.zeige(e.maxStrom, 'A'))}` +
                                (e.durchgaenge > 1 ? ` · ${e.durchgaenge} Durchgänge` : '')
                            : 'nichts gerechnet') + `</span>` +
                        meldungHtml() +
                        `<span class="sp-simhinweis">Auf einen Schalter tippen zum Schalten` +
                        `<button data-a="ruhelage" title="Alle Schalter in die Ruhelage">Ruhelage</button></span>`;
                return;
            }
            const gewaehlt = z.auswahl.size;
            const knopfAn = (an) => ` aria-pressed="${an}"${an ? ' class="an"' : ''}`;
            const werkzeugWahl = z.werkzeug === 'radieren'
                ? `<span class="sp-wahl" role="group" aria-label="Radierer">` +
                    `<button type="button" data-radiermodus="alles"${knopfAn(z.radierModus === 'alles')} title="Radiert, was der Kreis berührt: Leitungen, Teile, Texte">Alles</button>` +
                    `<button type="button" data-radiermodus="leiter"${knopfAn(z.radierModus === 'leiter')} title="Radiert nur Leitungen — kein Teil">Nur Leiter</button>` +
                    RADIER_GROESSEN.map(([g, name]) => `<button type="button" class="sp-radiergroesse" data-radiergroesse="${g}"${knopfAn(z.radierGroesse === g)} ` +
                        `title="Radierer ${name}" aria-label="Radierer ${name}" style="--kreis:${Math.round(g * 0.7 + 4)}px"><i aria-hidden="true"></i></button>`).join('') +
                    `</span><span class="sp-hinweis">Über die Fläche wischen — mit Maus, Finger oder Stift. Ein Tipp radiert eine Leitung.</span>`
                : z.werkzeug === 'schiene'
                    ? `<span class="sp-wahl" role="group" aria-label="Schiene">` +
                        Schaltplan.SCHIENEN.map(k => `<button type="button" data-schiene="${k}"${knopfAn(z.schieneArt === k)}>${k}</button>`).join('') +
                        `</span><span class="sp-hinweis">Ziehen, um ${esc(z.schieneArt)} als gerade Schiene zu zeichnen — Teile hängen daran wie am Netz.</span>`
                    : '';
            fussInhalt.innerHTML = werkzeugWahl ? werkzeugWahl +
                `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>` :
                `<span class="sp-ebenen">` + z.plan.ebenen.map(e => `<button class="sp-ebene${e.sichtbar ? ' an' : ''}" data-ebene="${esc(e.id)}" ` +
                    `title="${e.sichtbar ? 'Ausblenden' : 'Einblenden'}: ${esc(e.name)}">` +
                    `<i style="background:${esc(e.farbe)}"></i>${esc(e.name)}</button>`).join('') + '</span>' +
                    (gewaehlt
                        ? `<span class="sp-auswahl">${gewaehlt} gewählt` +
                            `<button data-a="drehen" title="Drehen (R)">↻</button>` +
                            `<button data-a="spiegeln" title="Spiegeln (H)">⇄</button>` +
                            `<button data-a="doppeln" title="Duplizieren (Strg D)">⧉</button>` +
                            `<button data-a="gruppieren" title="Gruppieren (Strg G)">⬚</button>` +
                            `<button data-a="loeschen" title="Löschen (Entf)">✕</button></span>`
                        : `<span class="sp-hinweis">${esc(z.gewaehltesZeichen
                            ? 'Auf die Fläche tippen, um „' +
                                (Register.fachzeichen.holen(z.gewaehltesZeichen) || { name: '?' }).name + '" zu setzen'
                            : 'Links ein Symbol wählen, dann auf die Fläche tippen')}</span>`) +
                    `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>`;
        };
        const paletteMalen = (suche = '') => {
            palette.innerHTML =
                `<div class="sp-suche"><input type="search" placeholder="Symbol suchen …" ` +
                    `value="${esc(suche)}" aria-label="Symbol suchen"></div>` +
                    `<div class="sp-liste">${paletteHtml(z.plan.art, suche)}</div>`;
            palette.querySelectorAll('[data-sym]').forEach(b => {
                if (b.dataset.sym === z.gewaehltesZeichen)
                    b.classList.add('an');
            });
        };
        const rechnen = () => {
            if (!z.simulation || typeof Stromfluss === 'undefined') {
                z.ergebnis = null;
                return;
            }
            z.ergebnis = Stromfluss.rechne(z.plan, z.stellungen, z.spulenStand);
            if (z.ergebnis && z.ergebnis.ok)
                z.spulenStand = z.ergebnis.spulen;
        };
        const buehneMalen = () => {
            const e = z.ergebnis;
            const opt = {
                raster: z.zeigeRaster,
                anschluesse: z.simulation ? false : z.zeigeAnschluesse,
                nummern: z.zeigeNummern,
                auswahl: z.simulation ? new Set() : z.auswahl
            };
            if (e && e.ok)
                opt.strom = {
                    netzStrom: e.netzStrom, leitungNetz: e.leitungNetz,
                    werte: e.werte, teilwerte: e.teilwerte, maxStrom: e.maxStrom
                };
            leinwand.innerHTML = Schaltplan.alsSvg(z.plan, opt);
            ansichtAnwenden();
            buehne.classList.toggle('sp-laeuft', z.simulation);
            if (!z.simulation)
                return;
            z.plan.teile.forEach(t => {
                const st = Stromfluss.stellungenVon(t.zeichen);
                if (st.length < 2)
                    return;
                const vh = Stromfluss.verhalten(t.zeichen);
                if (vh && vh.folgtSpule)
                    return;
                const g = buehne.querySelector(`[data-id="${CSS.escape(t.id)}"]`);
                if (!g)
                    return;
                g.classList.add('sp-schaltbar');
                const jetzt = st[Math.max(0, Math.min(st.length - 1, z.stellungen[t.id] || 0))];
                const titel = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                titel.textContent = `${t.bmk || ''} ${jetzt ? jetzt.name : ''} — tippen zum Schalten`.trim();
                g.appendChild(titel);
            });
        };
        const male = () => { rechnen(); kopfMalen(); buehneMalen(); fussMalen(); if (batterie)
            batterie.aktualisiere(); };
        const ZOOM_MIN = 0.25, ZOOM_MAX = 8;
        const svgJetzt = () => leinwand.querySelector('svg.sp-flaeche');
        const ansichtAnwenden = () => {
            const svg = svgJetzt();
            const { zoom, x, y } = z.ansicht;
            const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
            if (svg)
                svg.setAttribute('viewBox', (zoom === 1 && x === 0 && y === 0)
                    ? `0 0 ${B} ${H}`
                    : `${+x.toFixed(3)} ${+y.toFixed(3)} ${+(B / zoom).toFixed(3)} ${+(H / zoom).toFixed(3)}`);
            const wert = zoomleiste.querySelector('.sp-zoomwert');
            if (wert)
                wert.textContent = Math.round(zoom * 100) + ' %';
        };
        const schirm = () => {
            const svg = svgJetzt();
            const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
            if (!svg)
                return { s1: 1, cx: 0, cy: 0 };
            const r = svg.getBoundingClientRect();
            const s1 = Math.min(r.width / B, r.height / H) || 1;
            return { s1, cx: r.left + (r.width - B * s1) / 2, cy: r.top + (r.height - H * s1) / 2 };
        };
        const planAm = (sx, sy) => {
            const g = schirm(), k = g.s1 * z.ansicht.zoom;
            return { x: z.ansicht.x + (sx - g.cx) / k, y: z.ansicht.y + (sy - g.cy) / k };
        };
        const zoomSetzen = (zoom, P, sx, sy) => {
            const zz = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) * 1000) / 1000;
            const g = schirm(), k = g.s1 * zz;
            z.ansicht = { zoom: zz, x: P.x - (sx - g.cx) / k, y: P.y - (sy - g.cy) / k };
            if (zz === 1 && Math.abs(z.ansicht.x) < 0.5 && Math.abs(z.ansicht.y) < 0.5)
                z.ansicht = { zoom: 1, x: 0, y: 0 };
            ansichtAnwenden();
        };
        const zoomUm = (faktor, sx, sy) => {
            const svg = svgJetzt();
            if (!svg)
                return;
            if (sx === undefined || sy === undefined) {
                const r = svg.getBoundingClientRect();
                sx = r.left + r.width / 2;
                sy = r.top + r.height / 2;
            }
            zoomSetzen(z.ansicht.zoom * faktor, planAm(sx, sy), sx, sy);
        };
        const allesZeigen = () => { z.ansicht = { zoom: 1, x: 0, y: 0 }; ansichtAnwenden(); };
        const schwenken = (dx, dy) => {
            const g = schirm(), k = g.s1 * z.ansicht.zoom;
            z.ansicht = { zoom: z.ansicht.zoom, x: z.ansicht.x - dx / k, y: z.ansicht.y - dy / k };
            ansichtAnwenden();
        };
        zoomleiste.addEventListener('click', e => {
            const b = e.target.closest('[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'zoom-plus')
                zoomUm(1.25);
            else if (b.dataset.a === 'zoom-minus')
                zoomUm(0.8);
            else if (b.dataset.a === 'zoom-alles')
                allesZeigen();
        });
        const teilweiseMalen = (teilIds) => {
            const svg = svgJetzt();
            if (!svg)
                return;
            for (const id of teilIds) {
                const t = teilVon(id);
                const g = svg.querySelector(`.sp-teil[data-id="${CSS.escape(id)}"]`);
                if (t && g)
                    g.setAttribute('transform', `translate(${t.x} ${t.y})`);
            }
            const luecken = Schaltplan.kreuzungen(z.plan);
            const nachId = new Map(z.plan.leitungen.map(l => [l.id, l]));
            svg.querySelectorAll('path.sp-leitung').forEach(el => {
                const l = nachId.get(el.dataset.id || '');
                if (!l)
                    return;
                const d = Schaltplan.leitungPfad(l, luecken);
                if (el.getAttribute('d') !== d)
                    el.setAttribute('d', d);
            });
            svg.querySelectorAll('.sp-knoten').forEach(c => c.remove());
            const knoten = Schaltplan.verbindungspunkte(z.plan).map(q => `<circle class="sp-knoten" cx="${q.x}" cy="${q.y}" r="4" fill="currentColor"/>`).join('');
            const vor = svg.querySelector('.sp-teil, .sp-text, .sp-vorschau');
            if (knoten) {
                if (vor)
                    vor.insertAdjacentHTML('beforebegin', knoten);
                else
                    svg.insertAdjacentHTML('beforeend', knoten);
            }
        };
        const vorschau = (html) => {
            const svg = svgJetzt();
            if (!svg)
                return;
            let g = svg.querySelector('g.sp-vorschau');
            if (!g) {
                svg.insertAdjacentHTML('beforeend', '<g class="sp-vorschau"></g>');
                g = svg.querySelector('g.sp-vorschau');
            }
            if (g)
                g.innerHTML = html;
        };
        const setzeSymbol = (id, x, y) => {
            if (!id)
                return;
            aendere(() => {
                z.plan.teile.push({
                    id: Schaltplan.uid(), zeichen: id,
                    x: Schaltplan.rasten(x), y: Schaltplan.rasten(y),
                    drehung: 0, gespiegelt: false,
                    bmk: Schaltplan.naechstesBmk(z.plan, id),
                    nummern: {}, gruppe: '',
                    ebene: aktiveEbene()
                });
            });
        };
        const netzSchonDa = () => z.plan.texte.some(t => t && t.t === 'L1') ||
            z.plan.teile.some(t => t && t.zeichen === 'wechselspannung');
        const schaltungEinfuegen = (id) => {
            if (netzSchonDa()) {
                UI.toast('Das Netz steht schon — für ein neues Beispiel zuerst „… → Plan leeren".');
                return;
            }
            if (id === 'netz') {
                aendere(() => { Schaltplan.netzBauen(z.plan, aktiveEbene()); });
                return;
            }
            const beispiel = Schaltplan.BEISPIELE.find(x => x.id === id);
            aendere(() => { Schaltplan.beispielBauen(z.plan, id, aktiveEbene()); });
            if (beispiel && !z.zieht)
                UI.toast(beispiel.hinweis);
        };
        const vorlageEinsetzen = (v) => {
            aendere(() => {
                const neuId = new Map();
                (v.teile || []).forEach(t => {
                    const id = Schaltplan.uid();
                    neuId.set(t.id, id);
                    z.plan.teile.push({ ...t, id, x: t.x + 120, y: t.y + 80,
                        bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen) });
                });
                (v.leitungen || []).forEach(l => {
                    const neu = { ...l, id: Schaltplan.uid(),
                        punkte: (l.punkte || []).map(p => ({ x: p.x + 120, y: p.y + 80 })) };
                    if (l.vonTeil)
                        neu.vonTeil = neuId.get(l.vonTeil) || l.vonTeil;
                    if (l.nachTeil)
                        neu.nachTeil = neuId.get(l.nachTeil) || l.nachTeil;
                    z.plan.leitungen.push(neu);
                });
            });
        };
        const schaltungMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const eigene = (Store.getMeta(VORLAGEN, []) || [])
                .filter(v => !v.art || v.art === z.plan.art);
            const m = UI.menu('<button data-s="netz">Netz — L1 und N mit Quelle</button>' +
                '<hr>' +
                Schaltplan.BEISPIELE.map(b => `<button data-s="${esc(b.id)}">${esc(b.name)}</button>`).join('') +
                (eigene.length
                    ? '<hr>' + eigene.map((v, i) => `<button data-v="${i}">Vorlage: ${esc(v.name)}</button>`).join('')
                    : ''), r.left - 120, r.bottom + 6);
            m.addEventListener('click', e => {
                const b = e.target.closest('[data-s],[data-v]');
                if (!b)
                    return;
                m.remove();
                if (b.dataset.s)
                    return schaltungEinfuegen(b.dataset.s);
                const v = eigene[Number(b.dataset.v)];
                if (v)
                    vorlageEinsetzen(v);
            });
        };
        const aktiveEbene = () => {
            const e = z.plan.ebenen.filter(x => x.sichtbar);
            const nurAufgabe = e.length === 1 && e[0].id !== 'plan';
            return nurAufgabe ? e[0].id : 'plan';
        };
        const inRahmen = (a, b) => {
            const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
            const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
            const raus = [];
            z.plan.teile.forEach(t => {
                const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
                if (t.x >= x1 && t.y >= y1 && t.x + m.w <= x2 && t.y + m.h <= y2)
                    raus.push(t.id);
            });
            z.plan.leitungen.forEach(l => {
                if (l.punkte.every((p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2))
                    raus.push(l.id);
            });
            z.plan.texte.forEach(t => {
                if (t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2)
                    raus.push(t.id);
            });
            return raus;
        };
        const teilVon = (id) => z.plan.teile.find(t => t.id === id);
        const bmk = (tid) => {
            const t = teilVon(tid);
            return String((t && t.bmk) || tid);
        };
        const klemmeName = (k) => {
            const i = k.lastIndexOf(':');
            return i < 0 ? k : bmk(k.slice(0, i)) + k.slice(i);
        };
        const leitungName = (lid, vorher) => {
            const l = z.plan.leitungen.find(x => x.id === lid);
            if (!l)
                return 'eine Leitung';
            const k = vorher.klemmen.get(lid);
            const a = l.vonTeil ? bmk(l.vonTeil) + ':' + (k?.von ?? l.vonNr) : '';
            const b = l.nachTeil ? bmk(l.nachTeil) + ':' + (k?.nach ?? l.nachNr) : '';
            return a && b ? `die Leitung ${a}–${b}` : (a || b) ? `die Leitung an ${a || b}` : 'eine freie Leitung';
        };
        const melde = (was, bericht, aenderungen, vorher) => {
            if (typeof UI === 'undefined')
                return;
            const stufe = !!bericht && bericht.some(b => b.stufe >= 2);
            const liste = aenderungen || [];
            if (!stufe && !liste.length)
                return;
            const saetze = vorher ? liste.map(a => {
                if (a.art === 'klemme')
                    return a.jetzt
                        ? `${klemmeName(a.klemme)} berührt jetzt ${leitungName(a.leitung, vorher)}`
                        : `${klemmeName(a.klemme)} berührt ${leitungName(a.leitung, vorher)} nicht mehr`;
                if (a.art === 'leitung')
                    return a.jetzt
                        ? `${leitungName(a.leitung, vorher)} berührt jetzt ${leitungName(a.andere, vorher)}`
                        : `${leitungName(a.leitung, vorher)} berührt ${leitungName(a.andere, vorher)} nicht mehr`;
                return a.jetzt
                    ? `${klemmeName(a.klemme)} liegt jetzt auf ${klemmeName(a.andere)} (ohne Leitung nicht verbunden)`
                    : `${klemmeName(a.klemme)} liegt nicht mehr auf ${klemmeName(a.andere)}`;
            }) : [];
            const was3 = saetze.slice(0, 3).join('; ') + (saetze.length > 3 ? ` und ${saetze.length - 3} weitere` : '');
            const verbunden = liste.some(a => a.art !== 'aufeinander');
            UI.toast(stufe
                ? 'Eine Leitung liess sich nicht so nachziehen, dass sie genau dasselbe berührt wie vorher — bitte die Verbindungen prüfen' + (was3 ? ': ' + was3 + '.' : '.')
                : `Nach dem ${was}: ${was3} — ` + (verbunden ? 'die Verbindungen haben sich geändert, bitte prüfen.' : 'bitte prüfen.'), 6000);
        };
        const auswahlTeile = () => [...z.auswahl].map(teilVon).filter(Boolean);
        const verschiebe = (dx, dy) => {
            const vorher = Schaltplan.vorherMerken(z.plan);
            const teile = [];
            const eigene = new Set();
            z.auswahl.forEach(id => {
                const t = teilVon(id);
                if (t) {
                    t.x = Schaltplan.rasten(t.x + dx);
                    t.y = Schaltplan.rasten(t.y + dy);
                    teile.push(id);
                    return;
                }
                const l = z.plan.leitungen.find(x => x.id === id);
                if (l) {
                    l.punkte = l.punkte.map((p) => ({ x: Schaltplan.rasten(p.x + dx), y: Schaltplan.rasten(p.y + dy) }));
                    eigene.add(id);
                }
            });
            z.plan.leitungen.forEach(l => {
                if (!eigene.has(l.id))
                    return;
                const ziel = vorher.klemmen.get(l.id);
                if (l.vonTeil && z.auswahl.has(l.vonTeil)) {
                    const t = teilVon(l.vonTeil);
                    const o = t && Schaltplan.anschlussOrt(t, ziel?.von ?? l.vonNr);
                    if (o && l.punkte[0])
                        l.punkte[0] = o;
                }
                if (l.nachTeil && z.auswahl.has(l.nachTeil)) {
                    const t = teilVon(l.nachTeil);
                    const o = t && Schaltplan.anschlussOrt(t, ziel?.nach ?? l.nachNr);
                    if (o && l.punkte.length)
                        l.punkte[l.punkte.length - 1] = o;
                }
            });
            const bericht = Schaltplan.nachziehen(z.plan, vorher, teile, { ohne: eigene });
            return { bericht, aenderungen: Schaltplan.veraendert(z.plan, vorher), vorher };
        };
        const leitungVon = (id) => z.plan.leitungen.find(l => l.id === id);
        const textVon = (id) => z.plan.texte.find(x => x.id === id);
        const alsGruppe = () => {
            const ids = [...z.auswahl].filter(id => teilVon(id) || leitungVon(id) || textVon(id));
            return ids.length > 1 || (ids.length === 1 && !teilVon(ids[0]));
        };
        const gruppeUmformen = (art) => aendere(() => {
            const r = Schaltplan.gruppeUmformen(z.plan, z.auswahl, art);
            melde(art === 'drehen' ? 'Drehen' : 'Spiegeln', r.bericht, Schaltplan.veraendert(z.plan, r.vorher), r.vorher);
        });
        const planDrehen = () => aendere(() => {
            const r = Schaltplan.planDrehen(z.plan);
            z.ansicht = { zoom: 1, x: 0, y: 0 };
            melde('Drehen', r.bericht, Schaltplan.veraendert(z.plan, r.vorher), r.vorher);
        });
        const drehen = () => alsGruppe() ? gruppeUmformen('drehen') : aendere(() => {
            const vorher = Schaltplan.vorherMerken(z.plan);
            const teile = auswahlTeile();
            teile.forEach(t => { t.drehung = ((t.drehung || 0) + 90) % 360; });
            if (teile.length) {
                const bericht = Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true });
                melde('Drehen', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
            }
        });
        const spiegeln = () => alsGruppe() ? gruppeUmformen('spiegeln') : aendere(() => {
            const vorher = Schaltplan.vorherMerken(z.plan);
            const teile = auswahlTeile();
            teile.forEach(t => { t.gespiegelt = !t.gespiegelt; });
            if (teile.length) {
                const bericht = Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true });
                melde('Spiegeln', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
            }
        });
        const doppeln = () => aendere(() => {
            const neu = [];
            const versatz = Register.fachzeichen.RASTER * 2;
            z.auswahl.forEach(id => {
                const t = teilVon(id);
                if (!t)
                    return;
                const k = { ...t, id: Schaltplan.uid(), x: t.x + versatz, y: t.y + versatz,
                    nummern: { ...t.nummern },
                    bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen) };
                z.plan.teile.push(k);
                neu.push(k.id);
            });
            z.auswahl = new Set(neu);
        });
        const gruppieren = () => aendere(() => {
            const teile = [...z.auswahl].map(teilVon).filter(Boolean);
            if (teile.length < 2)
                return;
            const erste = teile[0].gruppe;
            const zusammen = erste && teile.every((t) => t.gruppe === erste);
            const g = zusammen ? '' : Schaltplan.uid();
            teile.forEach((t) => { t.gruppe = g; });
        });
        const loeschen = () => aendere(() => {
            z.plan.teile = z.plan.teile.filter(t => !z.auswahl.has(t.id));
            z.plan.leitungen = z.plan.leitungen.filter(l => !z.auswahl.has(l.id));
            z.plan.texte = z.plan.texte.filter(x => !z.auswahl.has(x.id));
            z.auswahl.clear();
        });
        const mitGruppe = (id) => {
            const t = teilVon(id);
            if (!t || !t.gruppe)
                return [id];
            return z.plan.teile.filter(x => x.gruppe === t.gruppe).map(x => x.id);
        };
        const schalte = (teilId) => {
            if (typeof Stromfluss === 'undefined')
                return false;
            const t = teilVon(teilId);
            if (!t)
                return false;
            const st = Stromfluss.stellungenVon(t.zeichen);
            if (st.length < 2)
                return false;
            const vh = Stromfluss.verhalten(t.zeichen);
            if (vh && vh.folgtSpule) {
                UI.toast(`${t.bmk || 'Dieser Kontakt'} wird von der Spule geschaltet, nicht von Hand.`);
                return true;
            }
            const jetzt = z.stellungen[teilId] || 0;
            z.stellungen[teilId] = (jetzt + 1) % st.length;
            male();
            return true;
        };
        const teilAm = (ziel) => ziel.closest('svg [data-id]');
        let letzterTipp = { id: '', zeit: 0 };
        const zugBeginnen = (zug) => {
            z.zieht = zug;
            document.addEventListener('pointerdown', zugUnterbrechen, true);
            document.addEventListener('pointerup', zugEnde, true);
            document.addEventListener('pointercancel', zugEnde, true);
            document.addEventListener('keydown', zugTaste, true);
        };
        const zugLoesen = () => {
            z.zieht = null;
            document.removeEventListener('pointerdown', zugUnterbrechen, true);
            document.removeEventListener('pointerup', zugEnde, true);
            document.removeEventListener('pointercancel', zugEnde, true);
            document.removeEventListener('keydown', zugTaste, true);
        };
        const OFFENES_FENSTER = '.menu, .overlay, dialog[open], .iblatt, #r-blatt.auf';
        const zugTaste = (e) => {
            if (!z.zieht)
                return;
            if (e.key === 'Escape') {
                if (document.querySelector(OFFENES_FENSTER))
                    return;
                e.preventDefault();
                e.stopPropagation();
                zugAbbrechen();
                return;
            }
            const k = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && (k === 'z' || (k === 'y' && !e.shiftKey))) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        const teilzugSichern = (zug) => {
            const bewegt = zug.ausgang.size &&
                [...zug.ausgang].some(([id, a]) => {
                    const t = teilVon(id);
                    return t && (t.x !== a.x || t.y !== a.y);
                });
            if (!bewegt) {
                male();
                return;
            }
            const vorher = zug.vorher ?? Schaltplan.vorherMerken(z.plan);
            const bericht = Schaltplan.nachziehen(z.plan, vorher, [...zug.ausgang.keys()], { heilen: true, vonVorn: true });
            aendere(() => { });
            melde('Ziehen', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
        };
        const zugUnterbrechen = () => {
            const zug = z.zieht;
            if (!zug)
                return;
            zugLoesen();
            if (!wurzel.isConnected)
                return;
            if (zug.art === 'teil')
                teilzugSichern(zug);
            else if (zug.art === 'strecke')
                streckeSichern(zug);
            else if (zug.art === 'radieren')
                radierenSichern(zug, false);
            else
                male();
        };
        const zugAbbrechen = () => {
            const zug = z.zieht;
            if (!zug)
                return;
            zugLoesen();
            if (zug.art === 'teil' || zug.art === 'strecke') {
                zug.ausgang.forEach((a, id) => {
                    const t = teilVon(id);
                    if (t) {
                        t.x = a.x;
                        t.y = a.y;
                    }
                });
                const punkte = zug.vorher ? zug.vorher.punkte : null;
                if (punkte)
                    z.plan.leitungen.forEach(l => {
                        const alt = punkte.get(l.id);
                        if (alt)
                            l.punkte = alt.map(q => ({ x: q.x, y: q.y }));
                    });
            }
            if (zug.art === 'schwenk')
                return;
            male();
        };
        const streckeSichern = (zug) => {
            if (zug.abzugStart === undefined || zug.abzugStart === abzug()) {
                male();
                return;
            }
            aendere(() => { }, true, zug.abzugStart);
        };
        const radius = () => {
            const g = schirm();
            return z.radierGroesse / ((g.s1 || 1) * z.ansicht.zoom);
        };
        const abstandZuStrecke = (q, a, b) => {
            const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
            const t = L ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L)) : 0;
            return Math.hypot(q.x - (a.x + t * dx), q.y - (a.y + t * dy));
        };
        const abstandZuKasten = (q, k) => Math.hypot(Math.max(k.x1 - q.x, 0, q.x - k.x2), Math.max(k.y1 - q.y, 0, q.y - k.y2));
        const teilKasten = (t) => {
            const zc = Register.fachzeichen.holen(t.zeichen);
            const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
            const cx = t.x + (zc ? zc.w : 0) / 2, cy = t.y + (zc ? zc.h : 0) / 2;
            return { x1: cx - m.w / 2, y1: cy - m.h / 2, x2: cx + m.w / 2, y2: cy + m.h / 2 };
        };
        const sichtbarAuf = (ebene) => {
            const e = z.plan.ebenen.find(x => x.id === ebene);
            return !e || e.sichtbar;
        };
        const radierTreffer = (q, r) => {
            const raus = [];
            z.plan.leitungen.forEach(l => {
                if (!sichtbarAuf(l.ebene))
                    return;
                let d = Infinity;
                for (let i = 0; i + 1 < l.punkte.length; i++)
                    d = Math.min(d, abstandZuStrecke(q, l.punkte[i], l.punkte[i + 1]));
                if (d <= r)
                    raus.push({ id: l.id, d, art: 'leitung' });
            });
            if (z.radierModus === 'leiter')
                return raus;
            z.plan.teile.forEach(t => {
                if (!sichtbarAuf(t.ebene))
                    return;
                const d = abstandZuKasten(q, teilKasten(t));
                if (d <= r)
                    raus.push({ id: t.id, d, art: 'teil' });
            });
            z.plan.texte.forEach(x => {
                if (!sichtbarAuf(x.ebene))
                    return;
                const d = abstandZuKasten(q, { x1: x.x - 2, y1: x.y - 12, x2: x.x + String(x.t).length * 7.5, y2: x.y + 3 });
                if (d <= r)
                    raus.push({ id: x.id, d, art: 'text' });
            });
            return raus;
        };
        const radierMarken = (zug) => {
            const svg = svgJetzt();
            if (!svg || !zug.weg)
                return;
            zug.weg.forEach(id => svg.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach(el => el.classList.add('sp-weg')));
        };
        const radierWisch = (zug, von, bis) => {
            const r = radius();
            const n = Math.max(1, Math.ceil(Math.hypot(bis.x - von.x, bis.y - von.y) / Math.max(1, r / 2)));
            for (let k = 0; k <= n; k++) {
                const q = { x: von.x + (bis.x - von.x) * k / n, y: von.y + (bis.y - von.y) * k / n };
                radierTreffer(q, r).forEach(h => zug.weg.add(h.id));
            }
            radierMarken(zug);
            vorschau(`<circle class="sp-radierkreis" cx="${+bis.x.toFixed(1)}" cy="${+bis.y.toFixed(1)}" r="${+r.toFixed(1)}"/>`);
        };
        const radierenSichern = (zug, tipp) => {
            let weg = [...(zug.weg || [])];
            if (tipp && zug.letzter) {
                const h = radierTreffer(zug.letzter, radius());
                const teil = h.filter(x => x.art === 'teil' && x.d === 0)[0];
                const naechste = (art) => h.filter(x => x.art === art).sort((a, b) => a.d - b.d)[0];
                const eins = teil || naechste('leitung') || naechste('text');
                weg = eins ? [eins.id] : [];
            }
            if (!weg.length) {
                male();
                return;
            }
            const raus = new Set(weg);
            aendere(() => {
                z.plan.teile = z.plan.teile.filter(t => !raus.has(t.id));
                z.plan.leitungen = z.plan.leitungen.filter(l => !raus.has(l.id));
                z.plan.texte = z.plan.texte.filter(x => !raus.has(x.id));
                raus.forEach(id => z.auswahl.delete(id));
            }, true, zug.abzugStart);
        };
        const finger = new Map();
        let geste = null;
        const fingerMitte = () => {
            const ps = [...finger.values()];
            return { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
        };
        const fingerAbstand = () => {
            const ps = [...finger.values()];
            return Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        };
        const fingerBewegt = (e) => {
            if (!finger.has(e.pointerId))
                return;
            finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (!geste || finger.size < 2)
                return;
            const m = fingerMitte();
            zoomSetzen(geste.zoom0 * fingerAbstand() / (geste.d0 || 1), geste.P0, m.x, m.y);
        };
        const fingerWeg = (e) => {
            if (!finger.delete(e.pointerId))
                return;
            if (finger.size)
                return;
            geste = null;
            document.removeEventListener('pointermove', fingerBewegt, true);
            document.removeEventListener('pointerup', fingerWeg, true);
            document.removeEventListener('pointercancel', fingerWeg, true);
        };
        buehne.addEventListener('pointerdown', e => {
            const svg = svgJetzt();
            if (!svg)
                return;
            if (e.pointerType === 'touch') {
                if (!finger.size) {
                    document.addEventListener('pointermove', fingerBewegt, true);
                    document.addEventListener('pointerup', fingerWeg, true);
                    document.addEventListener('pointercancel', fingerWeg, true);
                }
                finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (finger.size === 2) {
                    const m = fingerMitte();
                    geste = { d0: fingerAbstand(), P0: planAm(m.x, m.y), zoom0: z.ansicht.zoom };
                    return;
                }
            }
            if (geste || finger.size > 2)
                return;
            const ziel = e.target;
            const roh = ortAus(svg, e, z.plan, true);
            const p = ortAus(svg, e, z.plan);
            if (e.button === 1 || (z.leertaste && e.button === 0)) {
                e.preventDefault();
                zugBeginnen({ art: 'schwenk', zeiger: e.pointerId, startX: 0, startY: 0, ausgang: new Map(),
                    schirm: { x: e.clientX, y: e.clientY } });
                svg.setPointerCapture(e.pointerId);
                return;
            }
            const stiftRadiert = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32) !== 0);
            if (e.button !== 0 && !stiftRadiert)
                return;
            if (z.simulation) {
                const g = teilAm(ziel);
                if (g && g.dataset.id)
                    schalte(g.dataset.id);
                return;
            }
            if (z.werkzeug === 'radieren' || stiftRadiert) {
                const zug = { art: 'radieren', zeiger: e.pointerId, startX: e.clientX, startY: e.clientY,
                    ausgang: new Map(), abzugStart: abzug(), weg: new Set(), letzter: roh, gewandert: false };
                zugBeginnen(zug);
                svg.setPointerCapture(e.pointerId);
                radierWisch(zug, roh, roh);
                return;
            }
            if (z.werkzeug === 'text') {
                void (async () => {
                    const t = await UI.frage('Beschriftung', '');
                    if (t)
                        aendere(() => z.plan.texte.push({
                            id: Schaltplan.uid(), x: p.x, y: p.y, t, ebene: aktiveEbene()
                        }));
                })();
                return;
            }
            if (z.werkzeug === 'schiene') {
                zugBeginnen({ art: 'schiene', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map() });
                svg.setPointerCapture(e.pointerId);
                return;
            }
            if (z.werkzeug === 'leitung') {
                const fang = Schaltplan.fangeAnschluss(z.plan, roh);
                zugBeginnen({ art: 'leitung', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map(),
                    von: fang ? { x: fang.x, y: fang.y, teil: fang.teil, nr: fang.nr }
                        : { x: p.x, y: p.y } });
                svg.setPointerCapture(e.pointerId);
                return;
            }
            const g = teilAm(ziel);
            if (!g || !g.dataset.id) {
                if (z.gewaehltesZeichen) {
                    setzeSymbol(z.gewaehltesZeichen, p.x, p.y);
                    return;
                }
                if (!e.shiftKey)
                    z.auswahl.clear();
                zugBeginnen({ art: 'rahmen', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map() });
                svg.setPointerCapture(e.pointerId);
                male();
                return;
            }
            const id = g.dataset.id;
            const leitung = g.classList.contains('sp-leitung') ? leitungVon(id) : null;
            if (leitung) {
                if (e.shiftKey) {
                    if (z.auswahl.has(id))
                        z.auswahl.delete(id);
                    else
                        z.auswahl.add(id);
                }
                else if (!z.auswahl.has(id))
                    z.auswahl = new Set([id]);
                let i = 0, best = Infinity;
                for (let k = 0; k + 1 < leitung.punkte.length; k++) {
                    const d = abstandZuStrecke(roh, leitung.punkte[k], leitung.punkte[k + 1]);
                    if (d < best) {
                        best = d;
                        i = k;
                    }
                }
                const a = leitung.punkte[i], b = leitung.punkte[i + 1];
                if (a && b && (a.x === b.x || a.y === b.y)) {
                    zugBeginnen({ art: 'strecke', zeiger: e.pointerId, startX: roh.x, startY: roh.y, ausgang: new Map(),
                        vorher: Schaltplan.vorherMerken(z.plan), abzugStart: abzug(),
                        strecke: { lid: id, i, waag: a.y === b.y, d: 0 } });
                    svg.setPointerCapture(e.pointerId);
                }
                male();
                return;
            }
            const jetztMs = Date.now();
            if (letzterTipp.id === id && jetztMs - letzterTipp.zeit < 400) {
                letzterTipp = { id: '', zeit: 0 };
                const t = teilVon(id);
                if (t) {
                    teilDialog(t);
                    return;
                }
            }
            letzterTipp = { id, zeit: jetztMs };
            const gruppe = mitGruppe(id);
            if (e.shiftKey)
                gruppe.forEach(x => z.auswahl.has(x) ? z.auswahl.delete(x) : z.auswahl.add(x));
            else if (!z.auswahl.has(id))
                z.auswahl = new Set(gruppe);
            const ausgang = new Map();
            z.auswahl.forEach(x => {
                const t = teilVon(x);
                if (t)
                    ausgang.set(x, { x: t.x, y: t.y });
            });
            zugBeginnen({ art: 'teil', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang,
                vorher: Schaltplan.vorherMerken(z.plan),
                lage: [...ausgang.values()].map(a => a.x + ',' + a.y).join(';') });
            svg.setPointerCapture(e.pointerId);
            male();
        });
        buehne.addEventListener('pointermove', e => {
            if (!z.zieht || e.pointerId !== z.zieht.zeiger)
                return;
            const svg = svgJetzt();
            if (!svg)
                return;
            const zug = z.zieht;
            if (zug.art === 'schwenk') {
                const s0 = zug.schirm || { x: e.clientX, y: e.clientY };
                schwenken(e.clientX - s0.x, e.clientY - s0.y);
                zug.schirm = { x: e.clientX, y: e.clientY };
                return;
            }
            if (zug.art === 'radieren') {
                const roh = ortAus(svg, e, z.plan, true);
                if (Math.hypot(e.clientX - zug.startX, e.clientY - zug.startY) > 4)
                    zug.gewandert = true;
                radierWisch(zug, zug.letzter || roh, roh);
                zug.letzter = roh;
                return;
            }
            if (zug.art === 'strecke' && zug.strecke && zug.vorher) {
                const roh = ortAus(svg, e, z.plan, true);
                const st = zug.strecke;
                const d = Schaltplan.rasten(st.waag ? roh.y - zug.startY : roh.x - zug.startX);
                if (d === st.d)
                    return;
                const neu = Schaltplan.streckeSchieben(z.plan, zug.vorher, st.lid, st.i, d);
                if (!neu)
                    return;
                const l = leitungVon(st.lid);
                if (l)
                    l.punkte = neu;
                st.d = d;
                teilweiseMalen([]);
                return;
            }
            const p = ortAus(svg, e, z.plan);
            if (zug.art === 'teil') {
                const dx = p.x - zug.startX, dy = p.y - zug.startY;
                zug.ausgang.forEach((a, id) => {
                    const t = teilVon(id);
                    if (t) {
                        t.x = Schaltplan.rasten(a.x + dx);
                        t.y = Schaltplan.rasten(a.y + dy);
                    }
                });
                const lage = [...zug.ausgang.keys()].map(id => {
                    const t = teilVon(id);
                    return t ? t.x + ',' + t.y : '';
                }).join(';');
                if (lage === zug.lage)
                    return;
                zug.lage = lage;
                const gewandert = [...zug.ausgang].some(([id, a]) => {
                    const t = teilVon(id);
                    return t && (t.x !== a.x || t.y !== a.y);
                });
                const vorher = zug.vorher ?? (zug.vorher = Schaltplan.vorherMerken(z.plan));
                Schaltplan.nachziehen(z.plan, vorher, gewandert ? [...zug.ausgang.keys()] : [], { heilen: gewandert, vonVorn: true, schnell: true });
                teilweiseMalen(zug.ausgang.keys());
                return;
            }
            if (zug.art === 'leitung' && zug.von) {
                const fang = Schaltplan.fangeAnschluss(z.plan, p);
                const bis = fang ? { x: fang.x, y: fang.y } : p;
                const schluessel = bis.x + ',' + bis.y;
                if (schluessel === zug.vorschauEnde)
                    return;
                zug.vorschauEnde = schluessel;
                const punkte = Schaltplan.leitungFuehren(z.plan, zug.von, bis, zug.von.teil ? { teil: zug.von.teil, nr: zug.von.nr ?? '' } : null, fang ? { teil: fang.teil, nr: fang.nr } : null, { schnell: true });
                const d = punkte.map((q, i) => (i ? 'L' : 'M') + q.x + ',' + q.y).join(' ');
                vorschau(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" ` +
                    `stroke-dasharray="4 3" opacity=".7"/>` +
                    (fang ? `<circle cx="${fang.x}" cy="${fang.y}" r="7" fill="none" ` +
                        `stroke="currentColor" stroke-width="2" opacity=".8"/>` : ''));
                return;
            }
            if (zug.art === 'schiene') {
                const b = schieneEnde({ x: zug.startX, y: zug.startY }, p);
                vorschau(`<path d="M${zug.startX},${zug.startY} L${b.x},${b.y}" fill="none" stroke="currentColor" ` +
                    `stroke-width="3.5" stroke-dasharray="6 4" opacity=".75"/>` +
                    `<text x="${zug.startX + 6}" y="${zug.startY - 8}" font-size="13" fill="currentColor" stroke="none">${esc(z.schieneArt)}</text>`);
                return;
            }
            if (zug.art === 'rahmen') {
                const x = Math.min(zug.startX, p.x), y = Math.min(zug.startY, p.y);
                vorschau(`<rect x="${x}" y="${y}" width="${Math.abs(p.x - zug.startX)}" ` +
                    `height="${Math.abs(p.y - zug.startY)}" fill="currentColor" ` +
                    `fill-opacity=".07" stroke="currentColor" stroke-dasharray="4 3"/>`);
            }
        });
        const schieneEnde = (a, p) => Math.abs(p.x - a.x) >= Math.abs(p.y - a.y) ? { x: p.x, y: a.y } : { x: a.x, y: p.y };
        const zugEnde = (e) => {
            if (!z.zieht || e.pointerId !== z.zieht.zeiger)
                return;
            const zug = z.zieht;
            zugLoesen();
            if (!wurzel.isConnected)
                return;
            const svg = svgJetzt();
            const p = svg ? ortAus(svg, e, z.plan) : { x: 0, y: 0 };
            if (zug.art === 'schwenk')
                return;
            if (zug.art === 'teil') {
                teilzugSichern(zug);
                return;
            }
            if (zug.art === 'strecke') {
                streckeSichern(zug);
                return;
            }
            if (zug.art === 'radieren') {
                radierenSichern(zug, !zug.gewandert);
                return;
            }
            const unter = document.elementFromPoint(e.clientX, e.clientY);
            if (!unter || !buehne.contains(unter)) {
                male();
                return;
            }
            if (zug.art === 'rahmen') {
                inRahmen({ x: zug.startX, y: zug.startY }, p).forEach(id => z.auswahl.add(id));
                male();
                return;
            }
            if (zug.art === 'schiene') {
                const a = { x: zug.startX, y: zug.startY };
                const b = schieneEnde(a, p);
                if (a.x === b.x && a.y === b.y) {
                    male();
                    return;
                }
                const art = z.schieneArt;
                aendere(() => {
                    const ebene = aktiveEbene();
                    z.plan.leitungen.push({ id: Schaltplan.uid(), punkte: [a, b], ebene, schiene: art });
                    const waag = a.y === b.y;
                    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
                    const R = Register.fachzeichen.RASTER;
                    const ort = waag
                        ? (x0 - 3 * R >= 0 ? { x: x0 - 3 * R, y: a.y } : { x: x0, y: a.y - R })
                        : { x: a.x + R, y: y0 + R };
                    z.plan.texte.push({ id: Schaltplan.uid(), x: ort.x, y: ort.y, t: art, ebene });
                });
                return;
            }
            if (zug.art === 'leitung' && zug.von) {
                const fang = Schaltplan.fangeAnschluss(z.plan, p);
                const bis = fang ? { x: fang.x, y: fang.y } : p;
                if (bis.x === zug.von.x && bis.y === zug.von.y) {
                    male();
                    return;
                }
                const punkte = Schaltplan.leitungFuehren(z.plan, { x: zug.von.x, y: zug.von.y }, bis, zug.von.teil ? { teil: zug.von.teil, nr: zug.von.nr ?? '' } : null, fang ? { teil: fang.teil, nr: fang.nr } : null);
                aendere(() => z.plan.leitungen.push({
                    id: Schaltplan.uid(),
                    punkte,
                    ebene: aktiveEbene(),
                    vonTeil: zug.von.teil, vonNr: zug.von.nr,
                    nachTeil: fang ? fang.teil : undefined, nachNr: fang ? fang.nr : undefined
                }));
            }
        };
        const radGesehen = new WeakSet();
        const rad = (e) => {
            if (radGesehen.has(e) || !buehne.contains(e.target))
                return;
            radGesehen.add(e);
            if (!svgJetzt())
                return;
            const schritt = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                zoomUm(Math.exp(-e.deltaY * schritt * 0.0015), e.clientX, e.clientY);
                return;
            }
            const a = z.ansicht;
            if (!z.voll && a.zoom === 1 && !a.x && !a.y)
                return;
            e.preventDefault();
            const quer = e.shiftKey && !e.deltaX;
            schwenken(-(quer ? e.deltaY : e.deltaX) * schritt, -(quer ? 0 : e.deltaY) * schritt);
        };
        buehne.addEventListener('wheel', rad, { passive: false });
        const vollRad = (e) => rad(e);
        const leerRad = () => { };
        const radNeuAnmelden = () => {
            buehne.removeEventListener('wheel', rad);
            buehne.addEventListener('wheel', rad, { passive: false });
            if (!z.voll)
                return;
            document.removeEventListener('wheel', vollRad, { capture: true });
            document.addEventListener('wheel', vollRad, { passive: false, capture: true });
            document.removeEventListener('wheel', leerRad, { capture: true });
            document.addEventListener('wheel', leerRad, { passive: true, capture: true });
        };
        buehne.addEventListener('mousedown', e => { if (e.button === 1)
            e.preventDefault(); });
        let vollPerApi = false;
        let platzhalter = null;
        const vollGeaendert = () => {
            if (!document.fullscreenElement && vollPerApi) {
                vollPerApi = false;
                vollAus();
            }
        };
        const vollAn = () => {
            if (z.voll)
                return;
            z.voll = true;
            if (wurzel.parentNode && wurzel.parentNode !== document.body) {
                platzhalter = document.createComment('Schaltplan im Vollbild');
                wurzel.parentNode.insertBefore(platzhalter, wurzel);
                document.body.appendChild(wurzel);
            }
            document.addEventListener('wheel', vollRad, { passive: false, capture: true });
            wurzel.classList.add('sp-voll');
            const d = document.documentElement;
            if (!document.fullscreenElement && typeof d.requestFullscreen === 'function') {
                try {
                    Promise.resolve(d.requestFullscreen({ navigationUI: 'hide' })).then(() => {
                        if (!z.voll) {
                            if (document.fullscreenElement)
                                void document.exitFullscreen().catch(() => { });
                            return;
                        }
                        vollPerApi = true;
                        document.addEventListener('fullscreenchange', vollGeaendert);
                        radNeuAnmelden();
                        for (const ms of [250, 800])
                            setTimeout(radNeuAnmelden, ms);
                    }).catch(() => { });
                }
                catch { }
            }
            kopfMalen();
            ansichtAnwenden();
            wurzel.focus({ preventScroll: true });
        };
        const vollAus = () => {
            if (!z.voll)
                return;
            z.voll = false;
            wurzel.classList.remove('sp-voll');
            if (platzhalter) {
                if (platzhalter.isConnected && platzhalter.parentNode)
                    platzhalter.parentNode.replaceChild(wurzel, platzhalter);
                else
                    wurzel.remove();
                platzhalter = null;
            }
            document.removeEventListener('fullscreenchange', vollGeaendert);
            document.removeEventListener('wheel', vollRad, { capture: true });
            document.removeEventListener('wheel', leerRad, { capture: true });
            if (vollPerApi && document.fullscreenElement) {
                void document.exitFullscreen().then(() => radNeuAnmelden()).catch(() => { });
            }
            vollPerApi = false;
            kopfMalen();
            ansichtAnwenden();
            if (wurzel.isConnected)
                wurzel.focus({ preventScroll: true });
        };
        const teilDialog = (t) => {
            const zeichen = Register.fachzeichen.holen(t.zeichen);
            if (!zeichen)
                return;
            const o = document.createElement('div');
            o.className = 'overlay';
            o.innerHTML =
                '<div class="finder" style="width:min(460px,94vw)">' +
                    `<div class="fh">${esc(zeichen.name)}<button class="icon-btn" data-a="zu">✕</button></div>` +
                    `<div class="sp-dialog">` +
                    `<p class="sp-erkl">${esc(zeichen.erklaerung)}</p>` +
                    `<label>Betriebsmittel<input id="sp-bmk" value="${esc(t.bmk)}" ` +
                    `placeholder="${esc(zeichen.kennbuchstabe || 'K')}1"></label>` +
                    `<div class="sp-nrs"><span>Anschlussnummern</span>` +
                    zeichen.anschluesse.map((a) => `<label class="sp-nr"><i>${esc(a.nr)}</i>` +
                        `<input data-nr="${esc(a.nr)}" value="${esc(t.nummern[a.nr] ?? a.nr)}"></label>`).join('') +
                    `</div></div>` +
                    '<div class="fbtns"><button data-a="zu">Abbrechen</button>' +
                    '<button class="prim" data-a="ok">Übernehmen</button></div></div>';
            document.body.appendChild(o);
            const zu = () => o.remove();
            o.addEventListener('click', e => {
                const b = e.target.closest('[data-a]');
                if (e.target === o || (b && b.dataset.a === 'zu')) {
                    zu();
                    return;
                }
                if (!b || b.dataset.a !== 'ok')
                    return;
                const bmk = o.querySelector('#sp-bmk').value.trim();
                const nummern = {};
                o.querySelectorAll('[data-nr]').forEach(f => {
                    const vorgabe = f.dataset.nr || '';
                    const wert = f.value.trim();
                    if (wert && wert !== vorgabe)
                        nummern[vorgabe] = wert;
                });
                zu();
                aendere(() => { t.bmk = bmk; t.nummern = nummern; });
            });
            o.querySelector('#sp-bmk')?.focus();
        };
        const heftOffen = () => typeof Formelheft !== 'undefined' && Formelheft.offen();
        const heftUmschalten = () => {
            if (typeof Formelheft === 'undefined') {
                UI.toast('Das Formelheft ist nicht geladen.');
                return;
            }
            Formelheft.umschalten(kapitelZumPlan());
            kopfMalen();
        };
        const KAPITEL_ZU_ZEICHEN = [
            ['dreh', ['motor-drehstrom', 'motorschutzschalter', 'thermorelais']],
            ['motor', ['motor-wechselstrom', 'motor-gleichstrom']],
            ['trafo', ['transformator']],
            ['konden', ['kondensator', 'elko']],
            ['leistung', ['lampe', 'signalleuchte', 'hupe', 'klingel', 'ch-kontrolllampe']],
            ['licht', ['bp-leuchte', 'bp-einbauleuchte', 'bp-leuchtstelle']],
            ['quelle', ['batterie', 'gleichspannung', 'generator']],
            ['wechsel', ['spule-induktivitaet', 'wechselspannung']],
            ['leiter', ['leitungsschutzschalter', 'sicherung', 'widerstand']]
        ];
        const kapitelZumPlan = () => {
            const zeichen = new Set(z.plan.teile.map(t => t.zeichen));
            for (const [kapitel, ausloeser] of KAPITEL_ZU_ZEICHEN)
                if (ausloeser.some(x => zeichen.has(x)))
                    return kapitel;
            return undefined;
        };
        const simulationUmschalten = () => {
            if (z.plan.batterieUebung) {
                batterieOffen = true;
                batteriePanel.hidden = false;
                kopfMalen();
                if (batterie)
                    batterie.aktualisiere();
                UI.toast('Batterieanlagen im Fach „Batterien“ messen: ideale Parallelquellen werden hier nicht simuliert.');
                return;
            }
            z.simulation = !z.simulation;
            z.auswahl.clear();
            if (z.simulation) {
                z.werkzeug = 'zeigen';
                z.gewaehltesZeichen = '';
            }
            else {
                z.stellungen = {};
                z.spulenStand = {};
                z.ergebnis = null;
            }
            male();
            paletteMalen();
        };
        kopf.addEventListener('change', e => {
            const s = e.target.closest('.sp-art');
            if (!s)
                return;
            aendere(() => { z.plan.art = s.value; });
            paletteMalen();
        });
        kopf.addEventListener('click', e => {
            const b = e.target.closest('[data-wz],[data-a]');
            if (!b)
                return;
            if (b.dataset.wz) {
                z.werkzeug = b.dataset.wz;
                z.auswahl.clear();
                male();
                return;
            }
            if (b.dataset.a === 'netz')
                return schaltungMenue(b);
            if (b.dataset.a === 'batterie-labor') {
                batterieOffen = !batterieOffen;
                batteriePanel.hidden = !batterieOffen;
                kopfMalen();
                if (batterie)
                    batterie.aktualisiere();
                return;
            }
            if (b.dataset.a === 'heft')
                return heftUmschalten();
            if (b.dataset.a === 'simulation')
                return simulationUmschalten();
            if (b.dataset.a === 'zurueck')
                return zurueck();
            if (b.dataset.a === 'vorwaerts')
                return vorwaerts();
            if (b.dataset.a === 'mehr')
                return mehrMenue(b);
            if (b.dataset.a === 'vollbild')
                return vollAn();
            if (b.dataset.a === 'vollbild-zu')
                return vollAus();
        });
        fuss.addEventListener('click', e => {
            const b = e.target.closest('[data-ebene],[data-a],[data-radiermodus],[data-radiergroesse],[data-schiene]');
            if (!b)
                return;
            if (b.dataset.radiermodus || b.dataset.radiergroesse) {
                if (b.dataset.radiermodus)
                    z.radierModus = b.dataset.radiermodus === 'leiter' ? 'leiter' : 'alles';
                if (b.dataset.radiergroesse)
                    z.radierGroesse = Number(b.dataset.radiergroesse) || 16;
                if (typeof Store !== 'undefined')
                    Store.setMeta(RADIERER, { modus: z.radierModus, groesse: z.radierGroesse });
                fussMalen();
                return;
            }
            if (b.dataset.schiene) {
                z.schieneArt = b.dataset.schiene;
                fussMalen();
                return;
            }
            if (b.dataset.ebene) {
                aendere(() => {
                    const ebene = z.plan.ebenen.find(x => x.id === b.dataset.ebene);
                    if (ebene)
                        ebene.sichtbar = !ebene.sichtbar;
                });
                return;
            }
            if (b.dataset.a === 'ruhelage') {
                z.stellungen = {};
                z.spulenStand = {};
                male();
                return;
            }
            if (b.classList.contains('annahme')) {
                const e = z.ergebnis;
                if (e && (e.annahmen || []).length)
                    UI.banner('Wie gerechnet wird: ' +
                        e.annahmen.join(' · '), 'info');
                return;
            }
            ({ drehen, spiegeln, doppeln, gruppieren, loeschen }[b.dataset.a || '']?.());
        });
        palette.addEventListener('click', e => {
            const b = e.target.closest('[data-sym]');
            if (!b || !b.dataset.sym)
                return;
            if (e.altKey) {
                favoritUmschalten(b.dataset.sym);
                paletteMalen(palette.querySelector('input')?.value || '');
                return;
            }
            z.gewaehltesZeichen = z.gewaehltesZeichen === b.dataset.sym ? '' : b.dataset.sym;
            palette.querySelectorAll('.sp-sym').forEach(x => x.classList.remove('an'));
            if (z.gewaehltesZeichen)
                b.classList.add('an');
            fussMalen();
        });
        palette.addEventListener('input', e => {
            const f = e.target;
            if (f.type !== 'search')
                return;
            const liste = palette.querySelector('.sp-liste');
            if (liste)
                liste.innerHTML = paletteHtml(z.plan.art, f.value);
        });
        wurzel.tabIndex = 0;
        wurzel.addEventListener('pointerup', () => {
            const a = document.activeElement;
            if ((!a || a === document.body) && wurzel.isConnected) {
                wurzel.dataset.zeigerfokus = '';
                wurzel.focus({ preventScroll: true });
            }
        });
        wurzel.addEventListener('focusout', e => {
            if (e.target === wurzel)
                delete wurzel.dataset.zeigerfokus;
            if (z.leertaste) {
                z.leertaste = false;
                buehne.classList.remove('sp-greifen');
            }
        });
        wurzel.addEventListener('keyup', e => {
            if (e.key === ' ') {
                z.leertaste = false;
                buehne.classList.remove('sp-greifen');
            }
        });
        wurzel.addEventListener('keydown', e => {
            const inFeld = e.target.tagName === 'INPUT';
            if (inFeld)
                return;
            if (e.key === 'Escape' && z.zieht)
                return;
            if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (!z.leertaste) {
                    z.leertaste = true;
                    buehne.classList.add('sp-greifen');
                }
                return;
            }
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                if (e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    return z.voll ? vollAus() : vollAn();
                }
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    return zoomUm(1.25);
                }
                if (e.key === '-') {
                    e.preventDefault();
                    return zoomUm(0.8);
                }
                if (e.key === '0') {
                    e.preventDefault();
                    return allesZeigen();
                }
            }
            const schritt = e.shiftKey ? Register.fachzeichen.RASTER * 5 : Register.fachzeichen.RASTER;
            const pfeile = {
                ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0],
                ArrowUp: [0, -schritt], ArrowDown: [0, schritt]
            };
            if (pfeile[e.key] && z.auswahl.size) {
                e.preventDefault();
                const [dx, dy] = pfeile[e.key];
                let folge;
                aendere(() => { folge = verschiebe(dx, dy); });
                if (folge)
                    melde('Schieben', folge.bericht, folge.aenderungen, folge.vorher);
                return;
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                return loeschen();
            }
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                return drehen();
            }
            if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                return spiegeln();
            }
            if (e.key === 'Escape') {
                if (z.voll && !z.auswahl.size && !z.gewaehltesZeichen) {
                    e.preventDefault();
                    vollAus();
                    return;
                }
                z.auswahl.clear();
                z.gewaehltesZeichen = '';
                male();
                paletteMalen();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                return doppeln();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                return gruppieren();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                z.auswahl = new Set([...z.plan.teile.map(t => t.id),
                    ...z.plan.leitungen.map(l => l.id),
                    ...z.plan.texte.map(x => x.id)]);
                male();
                return;
            }
            const k = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && k === 'z') {
                e.preventDefault();
                return e.shiftKey ? vorwaerts() : zurueck();
            }
            if ((e.ctrlKey || e.metaKey) && k === 'y' && !e.shiftKey) {
                e.preventDefault();
                return vorwaerts();
            }
        });
        const mehrMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const m = UI.menu(`<button data-m="raster">${z.zeigeRaster ? '✓ ' : ''}Raster zeigen</button>` +
                `<button data-m="anschluesse">${z.zeigeAnschluesse ? '✓ ' : ''}Anschlusspunkte zeigen</button>` +
                `<button data-m="nummern">${z.zeigeNummern ? '✓ ' : ''}Anschlussnummern zeigen</button>` +
                '<hr>' +
                '<button data-m="schienen">Stromschienen einzeichnen</button>' +
                '<button data-m="nummerieren">Alle neu durchnummerieren</button>' +
                '<button data-m="plandrehen">Ganzen Plan drehen (90°)</button>' +
                '<hr>' +
                '<button data-m="vorlage">Als Vorlage speichern</button>' +
                '<button data-m="svg">Als Bild speichern (SVG)</button>' +
                '<button data-m="leeren" data-gefahr>Plan leeren</button>', r.left - 180, r.bottom + 6);
            m.addEventListener('click', e => {
                const b = e.target.closest('[data-m]');
                if (!b)
                    return;
                m.remove();
                const was = b.dataset.m;
                if (was === 'raster') {
                    z.zeigeRaster = !z.zeigeRaster;
                    return male();
                }
                if (was === 'anschluesse') {
                    z.zeigeAnschluesse = !z.zeigeAnschluesse;
                    return male();
                }
                if (was === 'nummern') {
                    z.zeigeNummern = !z.zeigeNummern;
                    return male();
                }
                if (was === 'schienen')
                    return aendere(() => Schaltplan.schienenBauen(z.plan));
                if (was === 'plandrehen')
                    return planDrehen();
                if (was === 'nummerieren')
                    return aendere(() => {
                        z.plan.teile.forEach(t => { t.bmk = ''; });
                        z.plan.teile.forEach(t => { t.bmk = Schaltplan.naechstesBmk(z.plan, t.zeichen); });
                    });
                if (was === 'leeren')
                    return aendere(() => {
                        z.plan.teile = [];
                        z.plan.leitungen = [];
                        z.plan.texte = [];
                        z.auswahl.clear();
                    });
                if (was === 'vorlage')
                    return vorlageSpeichern();
                if (was === 'svg')
                    return alsBildSpeichern();
            });
        };
        const VORLAGEN = 'elektro:planvorlagen';
        const vorlageSpeichern = () => {
            if (z.zieht) {
                UI.toast('Erst loslassen — während eines Zugs wird keine Vorlage gespeichert.');
                return;
            }
            void (async () => {
                const name = await UI.frage('Name der Vorlage', '');
                if (!name)
                    return;
                const teile = z.auswahl.size
                    ? z.plan.teile.filter(t => z.auswahl.has(t.id))
                    : z.plan.teile;
                if (!teile.length) {
                    UI.toast('Nichts zu speichern');
                    return;
                }
                const x0 = Math.min(...teile.map((t) => t.x));
                const y0 = Math.min(...teile.map((t) => t.y));
                const liste = Store.getMeta(VORLAGEN, []) || [];
                liste.push({
                    id: Schaltplan.uid(), name, art: z.plan.art,
                    teile: teile.map((t) => ({ ...t, x: t.x - x0, y: t.y - y0 })),
                    leitungen: z.plan.leitungen
                        .filter(l => !z.auswahl.size || z.auswahl.has(l.id))
                        .map(l => ({ ...l, punkte: l.punkte.map((p) => ({ x: p.x - x0, y: p.y - y0 })) }))
                });
                Store.setMeta(VORLAGEN, liste);
                UI.toast('✅ Vorlage „' + name + '" gespeichert');
            })();
        };
        const alsBildSpeichern = () => {
            if (z.zieht) {
                UI.toast('Erst loslassen — während eines Zugs wird kein Bild gespeichert.');
                return;
            }
            const svg = Schaltplan.alsSvg(z.plan, { raster: false, anschluesse: false });
            const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>' +
                    svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')], { type: 'image/svg+xml' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (Schaltplan.artVon(z.plan.art).name || 'Schaltplan') + '.svg';
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        };
        batterie = window.BatterieAufgaben ? window.BatterieAufgaben.erstelle({
            element: batteriePanel,
            holePlan: () => z.plan,
            holeAuswahl: () => [...z.auswahl],
            aendere: (was) => aendere(was),
            setzePlan: (plan) => {
                z.plan = plan;
                z.auswahl.clear();
                z.werkzeug = 'leitung';
                z.gewaehltesZeichen = '';
                z.simulation = false;
                batterieOffen = true;
                batteriePanel.hidden = false;
            },
            nachPlanwechsel: () => paletteMalen()
        }) : null;
        paletteMalen();
        male();
        return wurzel;
    };
    return { zeichne, paletteHtml, favoriten, favoritUmschalten, ortAus };
})();
window.Planflaeche = Planflaeche;
