"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/planflaeche.ts (npm run bauen:ts). */
const Planflaeche = (() => {
    const esc = Schaltplan.esc;
    const Labor = {
        TEMPI: [0.25, 0.5, 1, 2, 4],
        tempo(wert) {
            const v = Number(wert);
            return Labor.TEMPI.includes(v) ? v : 1;
        },
        zeitAnzeigen(plan, relais, spulen) {
            const teile = Array.isArray(plan?.teile) ? plan.teile : [];
            return teile.filter(t => t && (t.zeichen === 'spule-anzugsverzoegert' || t.zeichen === 'spule-abfallverzoegert'))
                .map(t => {
                const s = (t.bmk && relais[t.bmk]) || {};
                const T = Number.isFinite(t.werte?.T) ? Math.max(0, Math.min(3600, Number(t.werte.T))) : 3;
                const gesamt = T * 1000;
                const laufend = !!spulen[t.bmk];
                const istEin = t.zeichen === 'spule-anzugsverzoegert';
                const zeit = Number.isFinite(s.zeit) ? Math.max(0, Math.min(gesamt, Number(s.zeit))) : 0;
                const aktiv = !!s.ausgang;
                const rest = istEin ? (laufend ? gesamt - zeit : gesamt) : (!laufend && aktiv ? zeit : 0);
                const fortschritt = gesamt > 0
                    ? Math.max(0, Math.min(1, istEin ? zeit / gesamt : (laufend ? 1 : (aktiv ? zeit / gesamt : 0))))
                    : (aktiv ? 1 : 0);
                const phase = istEin ? (laufend ? (aktiv ? 'Geschaltet' : 'Einschaltverzögerung') : 'Ruhelage')
                    : (laufend ? 'Spule aktiv' : (aktiv ? 'Ausschaltverzögerung' : 'Ruhelage'));
                return { id: String(t.id || ''), bmk: String(t.bmk || 'K?'), art: istEin ? 'EIN' : 'AUS',
                    gesamt, rest, fortschritt, aktiv, phase };
            });
        },
        statistik(plan, r, spulen) {
            const teile = Array.isArray(plan?.teile) ? plan.teile : [];
            if (!r || !r.ok)
                return { gueltig: false, lampen: 0, relais: 0, leitungen: 0, strom: 0 };
            const werte = r.werte || {};
            const lampen = teile.filter(t => /^(lampe|signalleuchte|ch-kontrolllampe)$/.test(t.zeichen) &&
                werte[t.id] && Number(werte[t.id].helligkeit) > 0.01).length;
            const aktive = new Set(teile.filter(t => /^(spule|spule-anzugsverzoegert|spule-abfallverzoegert)$/.test(t.zeichen) &&
                t.bmk && spulen[t.bmk]).map(t => t.bmk));
            const netzStrom = r.netzStrom || {};
            const leitungen = Object.values(r.leitungNetz || {}).filter(n => typeof n === 'number' && Number(netzStrom[n]) > 1e-9).length;
            return { gueltig: true, lampen, relais: aktive.size, leitungen,
                strom: Number.isFinite(r.maxStrom) ? Math.max(0, r.maxStrom) : 0 };
        }
    };
    const schaltart = (zeichen) => ({ st: Stromfluss.stellungenVon(zeichen), vh: Stromfluss.verhalten(zeichen) });
    const stromRechnung = (plan, stellungen, spulen, zeit) => Stromfluss.rechne(plan, stellungen, spulen, zeit);
    const stromText = (wert) => Stromfluss.zeige(wert, 'A');
    const StudioHilfe = {
        text: (v) => String(v ?? '').toLocaleLowerCase('de').normalize('NFKD').replace(/[̀-ͯ]/g, ''),
        leseLetzte(roh) {
            return Array.isArray(roh)
                ? [...new Set(roh.filter((x) => typeof x === 'string' && x.length < 90))].slice(0, 8) : [];
        },
        merkeLetzte(roh, id) {
            return id && id.length < 90 ? [id, ...StudioHilfe.leseLetzte(roh).filter(x => x !== id)].slice(0, 8)
                : StudioHilfe.leseLetzte(roh);
        },
        suche(liste, wort = '', gruppe = 'alle', limit = 36) {
            if (!Array.isArray(liste))
                return [];
            const frage = StudioHilfe.text(wort).trim().slice(0, 90);
            const grenze = Number.isInteger(limit) && limit >= 0 ? Math.min(limit, 120) : 36;
            return liste.filter(s => s && typeof s.id === 'string' && typeof s.name === 'string' &&
                (gruppe === 'alle' || s.gruppe === gruppe)).map((s, i) => {
                const name = StudioHilfe.text(s.name), id = StudioHilfe.text(s.id), erkl = StudioHilfe.text(s.erklaerung);
                const rang = !frage ? 0 : id === frage || name === frage ? 0 : name.startsWith(frage) ? 1 :
                    id.startsWith(frage) ? 2 : name.includes(frage) ? 3 : id.includes(frage) ? 4 : erkl.includes(frage) ? 5 : 99;
                return { s, i, rang };
            }).filter(x => x.rang < 99).sort((a, b) => a.rang - b.rang || a.i - b.i).slice(0, grenze).map(x => x.s);
        },
        ueberblick(plan, holeSymbol) {
            const teile = Array.isArray(plan?.teile) ? plan.teile : [];
            const gruppen = new Map(), bmk = new Map();
            for (const t of teile) {
                const g = String(holeSymbol(t?.zeichen)?.gruppe || t?.zeichen || 'Unbekannt').split('-')[0] || 'Unbekannt';
                gruppen.set(g, (gruppen.get(g) || 0) + 1);
                const k = String(t?.bmk || '').trim();
                if (k)
                    bmk.set(k, (bmk.get(k) || 0) + 1);
            }
            return { teile: teile.length,
                leitungen: Array.isArray(plan?.leitungen) ? plan.leitungen.length : 0,
                texte: Array.isArray(plan?.texte) ? plan.texte.length : 0,
                gruppen: [...gruppen].map(([gruppe, anzahl]) => ({ gruppe, anzahl }))
                    .sort((a, b) => b.anzahl - a.anzahl || a.gruppe.localeCompare(b.gruppe)),
                doppelteKennzeichen: [...bmk].filter(([, n]) => n > 1).map(([k]) => k) };
        }
    };
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
    const paletteHtml = (planArt, suche = '', filter = 'alle', aktiv = '') => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return '';
        const art = Schaltplan.artVon(planArt);
        const alleGruppen = Register.fachzeichen.gruppen();
        const sortiert = [
            ...art.gruppen.map(g => alleGruppen.find(x => x[0] === g)).filter(Boolean),
            ...alleGruppen.filter(x => !art.gruppen.includes(x[0]))
        ];
        const q = suche.trim().toLocaleLowerCase('de');
        const passt = (z) => !q || [z.name, z.id, z.erklaerung, z.kennbuchstabe]
            .some(w => String(w || '').toLocaleLowerCase('de').includes(q));
        const fav = favoriten();
        const letzte = ((typeof Store !== 'undefined')
            ? Store.getMeta('redion:elektro:letzte:v1', []) : []);
        const zuletzt = Array.isArray(letzte) ? letzte.filter((id) => typeof id === 'string').slice(0, 8) : [];
        const schon = new Set();
        const karte = (z) => {
            schon.add(z.id);
            const favorit = fav.includes(z.id);
            return `<div class="sp-zeichenkarte${z.id === aktiv ? ' ist-gewaehlt' : ''}">` +
                `<button type="button" class="sp-sym${favorit ? ' sp-fav' : ''}${z.id === aktiv ? ' an' : ''}" data-sym="${esc(z.id)}" ` +
                `title="${esc(z.name)} — ${esc(z.erklaerung)}" aria-label="${esc(z.name)} platzieren" aria-pressed="${z.id === aktiv}">` +
                `<span class="sp-sym-bild" aria-hidden="true">${Register.fachzeichen.alsSvg(z.id, { strich: 2 })}</span>` +
                `<span class="sp-sym-name">${esc(z.name)}</span>` +
                `<span class="sp-sym-code">${esc(z.kennbuchstabe || z.id)}</span></button>` +
                `<button type="button" class="sp-favorit${favorit ? ' an' : ''}" data-p-fav="${esc(z.id)}" ` +
                `aria-label="${favorit ? 'Favorit entfernen:' : 'Zu Favoriten hinzufügen:'} ${esc(z.name)}" ` +
                `aria-pressed="${favorit}" title="${favorit ? 'Aus Favoriten entfernen' : 'Als Favorit speichern'}">${favorit ? '★' : '☆'}</button></div>`;
        };
        const abschnitt = (name, zeichen) => zeichen.length ?
            `<section class="sp-zeichenabschnitt"><h4 class="sp-grp">${esc(name)}<span>${zeichen.length}</span></h4>` +
                `<div class="sp-syms">${zeichen.map(karte).join('')}</div></section>` : '';
        const hole = (ids) => ids.map(id => Register.fachzeichen.holen(id)).filter(Boolean).filter(passt);
        const teile = [];
        if (filter === 'favoriten') {
            teile.push(abschnitt('★ Meine Favoriten', hole(fav)));
        }
        else if (filter === 'zuletzt') {
            teile.push(abschnitt('Zuletzt verwendet', hole(zuletzt)));
        }
        else if (filter !== 'alle') {
            const g = alleGruppen.find(x => x[0] === filter);
            if (g)
                teile.push(abschnitt(g[2] + ' ' + g[1], Register.fachzeichen.inGruppe(g[0]).filter(passt)));
        }
        else {
            const favorisiert = hole(fav);
            if (!q && favorisiert.length)
                teile.push(abschnitt('★ Favoriten', favorisiert));
            const neu = hole(zuletzt).filter(z => !schon.has(z.id));
            if (!q && neu.length)
                teile.push(abschnitt('Zuletzt verwendet', neu));
            sortiert.forEach(g => {
                const zeichen = Register.fachzeichen.inGruppe(g[0]).filter(passt)
                    .filter(z => !schon.has(z.id));
                if (zeichen.length)
                    teile.push(abschnitt(g[2] + ' ' + g[1], zeichen));
            });
        }
        return teile.filter(Boolean).join('') ||
            '<div class="sp-pal-leer"><strong>Keine Schaltzeichen gefunden</strong><p>Suche ändern oder eine andere Kategorie wählen.</p></div>';
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
    const anschlussFangRadius = (svg, pointerType) => {
        const matrix = svg.getScreenCTM();
        if (!matrix)
            return 14;
        const scale = Math.hypot(matrix.a, matrix.b);
        if (!Number.isFinite(scale) || scale <= 0)
            return 14;
        const pixel = pointerType === 'touch' ? 24 : 12;
        return Math.min(42, Math.max(3, pixel / scale));
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
        let relaisOffen = !!(block && block.plan && block.plan.relaisLegacy);
        let relais = null;
        let batterie = null;
        let studioOffen = false;
        let paletteOffen = false;
        let paletteGruppe = 'alle';
        let paletteSuche = '';
        let paletteKompakt = window.matchMedia('(max-width: 850px)').matches;
        let merkwahl = null;
        let planFokus = false;
        let studioTab = 'eigenschaften';
        let studioSuchtext = '';
        let studioGruppe = 'alle';
        let studioLetzte = [];
        let pruefungOffen = false;
        let pruefAnsicht = 'diagnose';
        let pruefSuche = '';
        let laborTempo = 1;
        let karteId = '';
        let teilKlickStart = null;
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
            if (z.plan.relaisLegacy && vorher &&
                JSON.stringify({ teile: z.plan.teile, leitungen: z.plan.leitungen, texte: z.plan.texte }) !==
                    JSON.stringify((() => {
                        const p = JSON.parse(vorher);
                        return {
                            teile: p.teile, leitungen: p.leitungen, texte: p.texte
                        };
                    })()))
                z.plan.relaisLegacy.bearbeitet = true;
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
        const labor = document.createElement('section');
        labor.className = 'sp-live-labor';
        labor.setAttribute('aria-label', 'Live-Stromlabor – Strom, Relais und Zeit');
        labor.hidden = true;
        const batteriePanel = document.createElement('section');
        batteriePanel.className = 'sp-batterie-fach';
        batteriePanel.setAttribute('aria-label', 'Batterieanlagen und Übungen');
        batteriePanel.hidden = !batterieOffen;
        const relaisPanel = document.createElement('section');
        relaisPanel.className = 'sp-batterie-fach sp-relais-fach';
        relaisPanel.setAttribute('aria-label', 'Relais-Werkstatt und Import');
        relaisPanel.hidden = !relaisOffen;
        const pruefPanel = document.createElement('section');
        pruefPanel.className = 'sp-pruef-fach sp-batterie-fach';
        pruefPanel.setAttribute('aria-label', 'Schaltplan-Prüfzentrum und Stückliste');
        pruefPanel.hidden = true;
        const studioPanel = document.createElement('aside');
        studioPanel.className = 'sp-studio';
        studioPanel.setAttribute('aria-label', 'Elektro Studio – Bauteile, Eigenschaften und Übersicht');
        studioPanel.hidden = !studioOffen;
        const palette = document.createElement('div');
        palette.className = 'sp-palette';
        const buehne = document.createElement('div');
        buehne.className = 'sp-buehne';
        const fuss = document.createElement('div');
        fuss.className = 'sp-fuss';
        const leinwand = document.createElement('div');
        leinwand.className = 'sp-leinwand';
        buehne.appendChild(leinwand);
        const schnellkarte = document.createElement('aside');
        schnellkarte.className = 'sp-schnellkarte';
        schnellkarte.setAttribute('aria-label', 'Bauteil direkt bearbeiten');
        schnellkarte.hidden = true;
        buehne.appendChild(schnellkarte);
        const einstieg = document.createElement('div');
        einstieg.className = 'sp-einstieg';
        einstieg.hidden = true;
        buehne.appendChild(einstieg);
        const einstiegMalen = () => {
            const leer = !z.plan.teile.length && !z.plan.leitungen.length && !z.plan.texte.length;
            const zeigen = leer && !z.simulation && !paletteOffen && !studioOffen && !z.gewaehltesZeichen && z.werkzeug === 'zeigen';
            if (einstieg.hidden === !zeigen && (!zeigen || einstieg.dataset.art === z.plan.art))
                return;
            einstieg.hidden = !zeigen;
            if (!zeigen)
                return;
            einstieg.dataset.art = z.plan.art;
            einstieg.innerHTML =
                `<div class="sp-einstieg-karte" role="group" aria-label="Leerer Schaltplan">` +
                    `<span class="sp-einstieg-zeichen" aria-hidden="true">${symbol('bolt', 26)}</span>` +
                    `<strong>Ein leerer Schaltplan</strong>` +
                    `<p>Zieh Bauteile aus der Palette auf die Fläche${z.plan.art.startsWith('stromlauf') ? ' oder beginne mit einer fertigen Schaltung' : ''}.</p>` +
                    `<div class="sp-einstieg-knoepfe">` +
                    `<button type="button" class="sp-einstieg-haupt" data-einstieg="palette">${symbol('plus', 18)} Bauteil hinzufügen</button>` +
                    (z.plan.art.startsWith('stromlauf')
                        ? `<button type="button" data-einstieg="schaltung">⚡ Beispielschaltung</button>` : '') +
                    `</div></div>`;
        };
        einstieg.addEventListener('click', e => {
            const b = e.target.closest('[data-einstieg]');
            if (!b)
                return;
            if (b.dataset.einstieg === 'schaltung')
                return schaltungMenue(b);
            if (!paletteOffen)
                dock.querySelector('[data-a="palette-toggle"]')?.click();
            palette.querySelector('.sp-suche input')?.focus({ preventScroll: true });
        });
        const kontextleiste = document.createElement('div');
        kontextleiste.className = 'sp-kontextleiste';
        kontextleiste.setAttribute('role', 'toolbar');
        kontextleiste.setAttribute('aria-label', 'Ausgewählte Bauteile bearbeiten');
        kontextleiste.hidden = true;
        buehne.appendChild(kontextleiste);
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
        koerper.appendChild(studioPanel);
        const fussInhalt = document.createElement('div');
        fussInhalt.className = 'sp-fuss-inhalt';
        fuss.appendChild(fussInhalt);
        fuss.appendChild(zoomleiste);
        wurzel.appendChild(kopf);
        wurzel.appendChild(labor);
        wurzel.appendChild(koerper);
        wurzel.appendChild(fuss);
        wurzel.appendChild(batteriePanel);
        wurzel.appendChild(relaisPanel);
        wurzel.appendChild(pruefPanel);
        const fachSchliessen = document.createElement('button');
        fachSchliessen.type = 'button';
        fachSchliessen.className = 'sp-fach-schliessen';
        fachSchliessen.textContent = '✕ Schliessen';
        fachSchliessen.setAttribute('aria-label', 'Elektro-Zusatzfach schliessen');
        fachSchliessen.hidden = true;
        wurzel.appendChild(fachSchliessen);
        fachSchliessen.addEventListener('click', () => {
            batterieOffen = false;
            relaisOffen = false;
            pruefungOffen = false;
            batteriePanel.hidden = true;
            relaisPanel.hidden = true;
            pruefPanel.hidden = true;
            kopfMalen();
            wurzel.querySelector('.sp-buehne')?.focus({ preventScroll: true });
        });
        const fachStatus = () => {
            fachSchliessen.hidden = !(batterieOffen || relaisOffen || pruefungOffen);
            wurzel.classList.toggle('sp-fach-offen', !fachSchliessen.hidden);
        };
        const WERKZEUGE = [
            { id: 'zeigen', name: 'Auswahl', sym: 'inkPointer', taste: '1', titel: 'Auswählen und verschieben' },
            { id: 'leitung', name: 'Leitung', sym: 'inkConnector', taste: '2', titel: 'Leitung ziehen' },
            { id: 'text', name: 'Text', sym: 'inkText', taste: '3', titel: 'Beschriftung setzen' },
            { id: 'schiene', name: 'Schiene', sym: 'busbar', taste: '4', titel: 'Schiene zeichnen — L1, L2, L3, N, PE' },
            { id: 'radieren', name: 'Radierer', sym: 'inkEraser', taste: '5', titel: 'Radieren — über die Fläche wischen' }
        ];
        const symbol = (id, gr = 20) => (typeof Register !== 'undefined' && Register.symbole) ? Register.symbole.alsSvg(id, gr) : '';
        const kopfLinks = document.createElement('span');
        kopfLinks.className = 'sp-links';
        const dock = document.createElement('span');
        dock.className = 'sp-werkzeuge sp-mit-marke';
        dock.setAttribute('role', 'toolbar');
        dock.setAttribute('aria-label', 'Zeichenwerkzeuge');
        dock.innerHTML =
            `<span class="sp-wz-marke" aria-hidden="true"></span>` +
                WERKZEUGE.map(w => `<button type="button" class="sp-wz" data-wz="${w.id}" title="${esc(w.titel)} (${w.taste})" ` +
                    `aria-label="${esc(w.titel)}" aria-keyshortcuts="${w.taste}" aria-pressed="false">` +
                    `<span class="sp-wz-zeichen" aria-hidden="true">${symbol(w.sym)}</span>` +
                    `<span class="sp-wz-name" aria-hidden="true">${esc(w.name)}</span></button>`).join('') +
                `<span class="sp-dock-trenner" aria-hidden="true"></span>` +
                `<button type="button" class="sp-palette-knopf" data-a="palette-toggle" aria-label="Bauteilpalette öffnen oder schliessen" ` +
                `aria-keyshortcuts="B" aria-expanded="false" title="Bauteile ausklappen und direkt auf die Zeichnung ziehen (B)">` +
                `<span class="sp-wz-zeichen" aria-hidden="true">${symbol('plus')}</span><span class="sp-wz-name">Bauteile</span></button>` +
                `<button type="button" class="sp-dock-fit" data-a="zoom-alles" title="Einpassen: den ganzen Schaltplan zeigen (0)" ` +
                `aria-label="Einpassen — den ganzen Schaltplan zeigen" aria-keyshortcuts="0">` +
                `<span class="sp-wz-zeichen" aria-hidden="true">${symbol('maximize')}</span><span class="sp-wz-name" aria-hidden="true">Einpassen</span></button>`;
        const kopfRechts = document.createElement('span');
        kopfRechts.className = 'sp-rechts';
        kopf.append(kopfLinks, dock, kopfRechts);
        let markeGesetzt = false;
        const markeSetzen = () => {
            const marke = dock.querySelector('.sp-wz-marke');
            const an = dock.querySelector('.sp-wz.an');
            if (!marke)
                return;
            if (!an || !an.offsetWidth) {
                marke.style.opacity = '0';
                return;
            }
            const x = an.offsetLeft, y = an.offsetTop;
            marke.style.width = an.offsetWidth + 'px';
            marke.style.height = an.offsetHeight + 'px';
            if (!markeGesetzt)
                marke.style.transition = 'none';
            marke.style.transform = `translate(${x}px, ${y}px)`;
            marke.style.opacity = '1';
            if (!markeGesetzt) {
                void marke.offsetWidth;
                marke.style.transition = '';
                markeGesetzt = true;
            }
        };
        const dockAktualisieren = () => {
            dock.querySelectorAll('.sp-wz').forEach(b => {
                const an = b.dataset.wz === z.werkzeug;
                b.classList.toggle('an', an);
                b.setAttribute('aria-pressed', String(an));
            });
            const pk = dock.querySelector('.sp-palette-knopf');
            if (pk) {
                pk.classList.toggle('an', paletteOffen);
                pk.setAttribute('aria-expanded', String(paletteOffen));
            }
            markeSetzen();
        };
        if (typeof ResizeObserver === 'function')
            new ResizeObserver(() => {
                if (!wurzel.isConnected)
                    return;
                markeSetzen();
            }).observe(dock);
        const kopfMalen = () => {
            fachStatus();
            dockAktualisieren();
            einstiegMalen();
            const stromAn = !!(z.simulation || (z.plan.batterieUebung && batterie?.stromAn()));
            kopfLinks.innerHTML =
                `<button type="button" class="sp-start${stromAn ? ' an' : ''}${z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert ? ' sp-strom-ungeprueft' : ''}" ` +
                    `data-a="simulation" aria-keyshortcuts="P" ` +
                    `title="${z.plan.batterieUebung ? (batterie?.stromAn() ? 'Batteriestrom ausschalten' : 'Batterieschaltung einschalten und U, R, I messen') :
                        z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert ?
                            'Original-Verdrahtung ungeprüft: in der Relais-Werkstatt zuerst prüfen und freigeben.' :
                            z.simulation ? 'Simulation anhalten (P)' : 'Strom fliessen lassen (P)'}" ` +
                    `aria-pressed="${stromAn}" ` +
                    `aria-label="${stromAn ? 'Strom ausschalten' : 'Strom einschalten'}">` +
                    `${stromAn ? '◼' : '▶'} Strom</button>` +
                    (z.plan.art.startsWith('stromlauf')
                        ? `<button type="button" class="sp-netz" data-a="netz" ` +
                            `title="Netz (L1 und N mit Quelle) oder eine fertige Beispielschaltung einfügen — bereit zum Simulieren" ` +
                            `aria-label="Netz oder Beispielschaltung einfügen">⚡ Schaltung</button>`
                        : '');
            kopfRechts.innerHTML =
                `<select class="sp-art" aria-label="Planart" title="Planart: ${esc(Schaltplan.artVon(z.plan.art).name)}">` +
                    Schaltplan.ARTEN.map(a => `<option value="${esc(a.id)}"${a.id === z.plan.art ? ' selected' : ''}>` +
                        `${esc(a.name)}</option>`).join('') + '</select>' +
                    `<button type="button" class="sp-kopf-knopf" data-a="zurueck" title="Rückgängig (Strg+Z)" aria-label="Rückgängig"${z.verlauf.kannZurueck() ? '' : ' disabled'}>${symbol('undo', 18)}</button>` +
                    `<button type="button" class="sp-kopf-knopf" data-a="vorwaerts" title="Wiederholen (Strg+Y)" aria-label="Wiederholen"${z.verlauf.kannVor() ? '' : ' disabled'}>${symbol('redo', 18)}</button>` +
                    `<button type="button" class="sp-netz sp-bereiche" data-a="bereiche" title="Relais, Batterien, Prüfzentrum, Studio, Formelheft und Vorlagen öffnen" ` +
                    `aria-label="Bereiche" aria-haspopup="menu">✦<span class="sp-bereiche-wort"> Bereiche</span><span class="sp-bereiche-pfeil"> ▾</span></button>` +
                    `<button type="button" class="sp-kopf-knopf" data-a="mehr" title="Mehr: Planart, Ansicht, Ausgabe" aria-label="Mehr" aria-haspopup="menu">${symbol('dots', 18)}</button>` +
                    (z.voll
                        ? `<button type="button" class="sp-vollzu" data-a="vollbild-zu" title="Vollbild beenden (Esc)" aria-label="Vollbild beenden">✕</button>`
                        : `<button type="button" class="sp-kopf-knopf" data-a="vollbild" title="Vollbild (F)" aria-label="Vollbild" aria-keyshortcuts="F">⛶</button>`);
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
        const laborZeit = () => zeitspulen().length
            ? (zeitStand.laufzeit / 1000).toFixed(1) + ' s' : '—';
        const laborAktualisieren = () => {
            if (!z.simulation)
                return;
            const daten = Labor.statistik(z.plan, z.ergebnis, z.spulenStand);
            const anzeige = labor.querySelector('[data-labor-status]');
            if (anzeige)
                anzeige.textContent = daten.gueltig
                    ? `${daten.lampen} Lampen · ${daten.relais} Relais · ${daten.leitungen} durchflossene Leitungen`
                    : 'Noch kein gültiger Stromkreis';
            const strom = labor.querySelector('[data-labor-strom]');
            if (strom)
                strom.textContent = daten.gueltig ? stromText(daten.strom) : '—';
            const uhr = labor.querySelector('[data-labor-uhr]');
            if (uhr)
                uhr.textContent = laborZeit();
            const zeiten = Labor.zeitAnzeigen(z.plan, zeitStand.relais, z.spulenStand);
            zeiten.slice(0, 8).forEach(zeit => {
                const element = labor.querySelector(`[data-labor-zeitid="${CSS.escape(zeit.id)}"]`);
                if (!element)
                    return;
                const bar = element.querySelector('[data-labor-balken]');
                if (bar)
                    bar.style.width = Math.round(zeit.fortschritt * 100) + '%';
                const phase = element.querySelector('[data-labor-phase]');
                if (phase)
                    phase.textContent = `${zeit.phase} · ${Math.max(0, zeit.rest / 1000).toFixed(1)} s`;
                element.classList.toggle('sp-labor-zeitaktiv', zeit.aktiv);
            });
        };
        const laborMalen = () => {
            labor.hidden = !z.simulation;
            wurzel.classList.toggle('sp-labor-pause', !!(z.simulation && zeitStand.pause));
            wurzel.style.setProperty('--sp-labor-tempo', String(laborTempo));
            if (!z.simulation) {
                labor.replaceChildren();
                return;
            }
            const pausiert = zeitStand.pause;
            const zeiten = Labor.zeitAnzeigen(z.plan, zeitStand.relais, z.spulenStand);
            labor.innerHTML = `<div class="sp-labor-kopf">` +
                `<span class="sp-labor-zeichen" aria-hidden="true">⚡</span>` +
                `<strong>Live-Stromlabor</strong>` +
                `<span class="sp-labor-lauf"${pausiert ? ' data-pause="true"' : ''}>${pausiert ? '⏸ Pausiert' : '● Aktiv'}</span>` +
                `<span class="sp-labor-mess" data-labor-status></span>` +
                `<span class="sp-labor-mess">I<sub>max</sub> <b data-labor-strom>—</b></span>` +
                `<span class="sp-labor-uhr" title="Simulationszeit — sie läuft, sobald der Plan ein Zeitrelais hat" data-labor-uhr>—</span>` +
                `<label class="sp-labor-tempo">Tempo <select data-labor-tempo aria-label="Simulationsgeschwindigkeit">` +
                [0.25, 0.5, 1, 2, 4].map(t => `<option value="${t}"${t === laborTempo ? ' selected' : ''}>${t}×</option>`).join('') +
                `</select></label>` +
                `<button type="button" class="sp-labor-aktion" data-labor-aktion="pause" aria-pressed="${pausiert}" title="Simulation pausieren oder fortsetzen">${pausiert ? '▶ Weiter' : '⏸ Pause'}</button>` +
                `<button type="button" class="sp-labor-aktion" data-labor-aktion="reset" title="Simulationsuhr, Schalter und Relais zurücksetzen">↺ Reset</button>` +
                `</div>` +
                (zeiten.length ? `<div class="sp-labor-zeitliste" aria-label="Zeitrelais-Fortschritt">` +
                    zeiten.slice(0, 8).map(u => `<div class="sp-labor-zeit" data-labor-zeitid="${esc(u.id)}">` +
                        `<strong>${esc(u.bmk)}</strong><small>${esc(u.art)} · ${Math.round(u.gesamt) / 1000} s</small>` +
                        `<span class="sp-labor-balken"><i data-labor-balken></i></span>` +
                        `<span data-labor-phase></span></div>`).join('') +
                    (zeiten.length > 8 ? `<small>+${zeiten.length - 8} weitere Zeitrelais</small>` : '') +
                    `</div>` : '');
            laborAktualisieren();
        };
        labor.addEventListener('change', event => {
            const ziel = event.target;
            if (!ziel.matches('[data-labor-tempo]'))
                return;
            laborTempo = Labor.tempo(ziel.value);
            zeitLetzter = performance.now();
            wurzel.style.setProperty('--sp-labor-tempo', String(laborTempo));
        });
        labor.addEventListener('click', event => {
            const knopf = event.target.closest('[data-labor-aktion]');
            if (!knopf || !z.simulation)
                return;
            if (knopf.dataset.laborAktion === 'pause') {
                zeitStand.pause = !zeitStand.pause;
                zeitLetzter = performance.now();
            }
            else if (knopf.dataset.laborAktion === 'reset') {
                z.stellungen = {};
                z.spulenStand = {};
                zeitStarten();
                male();
                return;
            }
            laborMalen();
        });
        const fussMalen = () => {
            if (z.simulation) {
                const e = z.ergebnis;
                const leuchtet = e && e.ok
                    ? Object.keys(e.werte).filter(k => (e.werte[k].helligkeit || 0) > 0.01).length : 0;
                fussInhalt.innerHTML =
                    `<span class="sp-simzahlen">` +
                        (e && e.ok
                            ? `${leuchtet} ${leuchtet === 1 ? 'leuchtet' : 'leuchten'} · ` +
                                `grösster Strom ${esc(stromText(e.maxStrom))}` +
                                (e.durchgaenge > 1 ? ` · ${e.durchgaenge} Durchgänge` : '')
                            : 'Noch kein gültiger Stromkreis') + `</span>` +
                        `<span class="sp-sim-status ${e && e.ok && e.maxStrom > 0.000001 ? 'fliesst' : 'offen'}" role="status">` +
                        (e && e.ok && e.maxStrom > 0.000001 ? '● Strom fließt' : '○ Kein Stromfluss – Quelle, Leitungen und Schalter prüfen') + `</span>` +
                        `<button type="button" class="sp-sim-back" data-a="zurueck-zeichnen" title="Simulation stoppen und zum Zeichnen zurückkehren">✎ Weiterzeichnen</button>` +
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
                            : 'Bauteil mit Maus, Finger oder Stift direkt aus der Palette ziehen')}</span>`) +
                    `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>` +
                    `<span class="sp-quick-help">B: Palette · /: Suche · P: Stromtest · 1–5: Werkzeuge</span>`;
        };
        const paletteInfokarte = (id = z.gewaehltesZeichen) => {
            const kasten = palette.querySelector('.sp-pal-inspektor');
            if (!kasten)
                return;
            const sym = id ? Register.fachzeichen.holen(id) : null;
            if (!sym) {
                kasten.innerHTML = '<span class="sp-pal-info-icon" aria-hidden="true">⌁</span>' +
                    '<div><strong>Ein Zeichen auswählen</strong><small>Antippen zum Platzieren oder auf den Plan ziehen.</small></div>';
                return;
            }
            const pins = (sym.anschluesse || []).map((a) => a.nr).join(' · ');
            kasten.innerHTML = `<span class="sp-pal-info-icon" aria-hidden="true">${Register.fachzeichen.alsSvg(sym.id, { strich: 2 })}</span>` +
                `<div><strong>${esc(sym.name)}</strong><small>${esc(sym.erklaerung)}</small>` +
                (pins ? `<span class="sp-pal-klemmen">Anschlüsse: ${esc(pins)}</span>` : '') + '</div>';
        };
        const paletteTrefferMalen = () => {
            const liste = palette.querySelector('.sp-liste');
            if (!liste)
                return;
            liste.innerHTML = paletteHtml(z.plan.art, paletteSuche, paletteGruppe, z.gewaehltesZeichen);
            const n = liste.querySelectorAll('[data-sym]').length;
            const counter = palette.querySelector('.sp-pal-count');
            if (counter)
                counter.textContent = `${n} Schaltzeichen`;
            paletteInfokarte();
        };
        const paletteMalen = (suche = paletteSuche) => {
            paletteSuche = suche;
            const gruppen = Register.fachzeichen.gruppen();
            const filter = [['alle', 'Alle', ''], ['favoriten', 'Favoriten', '★'], ['zuletzt', 'Zuletzt', '◷']]
                .concat(gruppen.map(g => [g[0], g[1], g[2]]));
            palette.innerHTML =
                '<div class="sp-pal-kopf"><div><span class="sp-pal-eyebrow">ELEKTRO • BIBLIOTHEK</span>' +
                    '<h3>Schaltzeichen <span class="sp-pal-kopf-punkt" aria-hidden="true">✦</span></h3>' +
                    '<p>Finden. Anfassen. Platzieren.</p></div>' +
                    '<div class="sp-pal-header-actions"><button type="button" data-p-compact aria-pressed="' + String(paletteKompakt) + '" aria-label="Kompakte Schaltzeichenpalette umschalten" title="Kompakte Ansicht umschalten">' + (paletteKompakt ? '▣ Groß' : '▤ Klein') + '</button>' +
                    '<button type="button" data-p-close class="sp-pal-schliessen" aria-label="Schaltzeichen-Bibliothek schliessen" title="Schliessen">×</button></div></div>' +
                    `<label class="sp-suche"><span class="sp-suche-titel">Symbol finden</span>` +
                    `<input type="search" placeholder="z. B. Schliesser, Relais, Lampe …" ` +
                    `value="${esc(suche)}" aria-label="Schaltzeichen suchen" autocomplete="off" spellcheck="false"></label>` +
                    `<div class="sp-pal-filter" role="group" aria-label="Schaltzeichen-Kategorien">` +
                    filter.map(([id, name, icon]) => `<button type="button" data-p-filter="${esc(id)}" ` +
                        `class="sp-pal-chip${paletteGruppe === id ? ' an' : ''}" aria-pressed="${paletteGruppe === id}" ` +
                        `title="${esc(name)}">${icon ? `<span aria-hidden="true">${esc(icon)}</span>` : ''}${esc(name)}</button>`).join('') +
                    `</div><div class="sp-pal-ergebnis"><span class="sp-pal-count" role="status" aria-live="polite"></span>` +
                    '<span>★ Favorit speichern</span></div>' +
                    '<div class="sp-liste" aria-label="Schaltzeichen und Gruppen"></div>' +
                    '<div class="sp-pal-inspektor" aria-label="Information zum Schaltzeichen"></div>';
            palette.classList.toggle('sp-pal-kompakt', paletteKompakt);
            paletteTrefferMalen();
        };
        const ZEITSPULEN = new Set(['spule-anzugsverzoegert', 'spule-abfallverzoegert']);
        const zeitspulen = () => z.plan.teile.filter(t => ZEITSPULEN.has(t.zeichen) && t.bmk);
        let zeitStand = { relais: {}, ausgaenge: {}, laufzeit: 0, pause: false };
        let zeitTakt = null;
        let zeitLetzter = 0;
        const zeitSchritt = (spulen, deltaMs) => {
            let anders = false;
            zeitspulen().forEach(t => {
                const T = Number.isFinite(t.werte?.T) ? Number(t.werte.T) : 3;
                const dauer = Math.max(0, Math.min(3600, T)) * 1000;
                const an = !!spulen[t.bmk];
                const r = zeitStand.relais[t.bmk] ?? { zeit: 0, ausgang: false };
                if (t.zeichen === 'spule-anzugsverzoegert') {
                    r.zeit = an ? Math.min(dauer, r.zeit + deltaMs) : 0;
                    r.ausgang = an && r.zeit >= dauer;
                }
                else if (an) {
                    r.zeit = dauer;
                    r.ausgang = true;
                }
                else {
                    r.zeit = Math.max(0, r.zeit - deltaMs);
                    r.ausgang = r.zeit > 0;
                }
                zeitStand.relais[t.bmk] = r;
                if (zeitStand.ausgaenge[t.bmk] !== r.ausgang)
                    anders = true;
                zeitStand.ausgaenge[t.bmk] = r.ausgang;
            });
            return anders;
        };
        const zeitAnhalten = () => { if (zeitTakt)
            clearInterval(zeitTakt); zeitTakt = null; };
        const zeitTick = () => {
            if (!wurzel.isConnected || !z.simulation) {
                zeitAnhalten();
                return;
            }
            const jetzt = performance.now();
            const delta = Math.max(0, Math.min(250, jetzt - zeitLetzter)) * laborTempo;
            zeitLetzter = jetzt;
            if (zeitStand.pause)
                return;
            zeitStand.laufzeit += delta;
            if (z.ergebnis && z.ergebnis.ok && zeitSchritt(z.ergebnis.spulen, delta)) {
                rechnen();
                buehneMalen();
                fussMalen();
            }
            laborAktualisieren();
        };
        const zeitStarten = () => {
            zeitAnhalten();
            zeitStand = { relais: {}, ausgaenge: {}, laufzeit: 0, pause: false };
            if (!z.simulation || !zeitspulen().length)
                return;
            zeitLetzter = performance.now();
            zeitTakt = setInterval(zeitTick, 100);
        };
        const rechnen = () => {
            if (!z.simulation || typeof Stromfluss === 'undefined') {
                z.ergebnis = null;
                return;
            }
            const mitZeit = zeitspulen().length > 0;
            for (let runde = 0; runde < 3; runde++) {
                z.ergebnis = stromRechnung(z.plan, z.stellungen, z.spulenStand, mitZeit ? zeitStand.ausgaenge : undefined);
                if (z.ergebnis && z.ergebnis.ok)
                    z.spulenStand = z.ergebnis.spulen;
                if (!mitZeit || !z.ergebnis?.ok || !zeitSchritt(z.ergebnis.spulen, 0))
                    break;
            }
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
            tischLegen();
            ansichtAnwenden();
            buehne.classList.toggle('sp-laeuft', z.simulation);
            if (!z.simulation)
                return;
            if (e && e.ok)
                z.plan.teile.forEach(t => {
                    const grp = buehne.querySelector(`g[data-id="${CSS.escape(t.id)}"]`);
                    if (!grp)
                        return;
                    const spule = /^(spule|spule-anzugsverzoegert|spule-abfallverzoegert)$/.test(t.zeichen);
                    const kontakt = /^(schuetz-schliesser|schuetz-oeffner)$/.test(t.zeichen);
                    const lampe = /^(lampe|signalleuchte|ch-kontrolllampe)$/.test(t.zeichen);
                    if (spule || kontakt) {
                        const aktiv = !!z.spulenStand[t.bmk] || !!zeitStand.ausgaenge[t.bmk];
                        grp.classList.toggle('sp-labor-relais-an', aktiv);
                        grp.classList.toggle('sp-labor-relais-aus', !aktiv);
                        grp.setAttribute('data-labor-zustand', aktiv ? 'angezogen' : 'ruhelage');
                    }
                    if (lampe) {
                        const hell = Number(e.werte?.[t.id]?.helligkeit) || 0;
                        grp.classList.toggle('sp-labor-lampe-an', hell > 0.01);
                        grp.style.setProperty('--sp-labor-hell', String(Math.max(0, Math.min(1, hell))));
                    }
                });
            z.plan.teile.forEach(t => {
                const { st, vh } = schaltart(t.zeichen);
                if (st.length < 2)
                    return;
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
        const kontextMalen = () => {
            if (karteId && !z.auswahl.has(karteId))
                karteSchliessen();
            const ausgewaehlt = [...z.auswahl].filter(id => z.plan.teile.some(t => t.id === id) ||
                z.plan.leitungen.some(l => l.id === id));
            kontextleiste.hidden = !!z.simulation || !ausgewaehlt.length;
            if (kontextleiste.hidden) {
                kontextleiste.replaceChildren();
                return;
            }
            const teil = z.plan.teile.find(t => t.id === ausgewaehlt[0]);
            const titel = ausgewaehlt.length > 1 ? `${ausgewaehlt.length} ausgewählt` :
                String(teil?.beschriftung || teil?.bmk ||
                    (teil ? Register.fachzeichen.holen(teil.zeichen)?.name : 'Leitung') || 'Auswahl');
            kontextleiste.innerHTML =
                `<span class="sp-kontext-titel" title="${esc(titel)}">${esc(titel)}</span>` +
                    `<button type="button" data-kontext="eigenschaften" title="Eigenschaften bearbeiten" aria-label="Eigenschaften der Auswahl öffnen">✎ <span>Bearbeiten</span></button>` +
                    `<button type="button" data-kontext="drehen" title="Drehen (R)" aria-label="Drehen">↻</button>` +
                    `<button type="button" data-kontext="spiegeln" title="Spiegeln (H)" aria-label="Spiegeln">⇄</button>` +
                    `<button type="button" data-kontext="doppeln" title="Duplizieren (Strg+D)" aria-label="Duplizieren">⧉</button>` +
                    `<button type="button" data-kontext="loeschen" title="Löschen (Entf)" aria-label="Löschen">✕</button>` +
                    `<button type="button" data-kontext="abwahl" title="Auswahl aufheben" aria-label="Auswahl aufheben">×</button>`;
        };
        const male = () => {
            if (z.simulation && karteId)
                karteSchliessen();
            rechnen();
            kopfMalen();
            buehneMalen();
            fussMalen();
            laborMalen();
            kontextMalen();
            if (batterie && !batteriePanel.hidden)
                batterie.aktualisiere();
            if (relais && !relaisPanel.hidden)
                relais.aktualisiere();
            if (pruefungOffen)
                pruefMalen();
            if (studioOffen)
                studioMalen();
        };
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
            tischZiehen();
        };
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const tischLegen = () => {
            const svg = svgJetzt();
            if (!svg)
                return;
            const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
            const blattRaster = svg.querySelector('rect[fill="url(#sp-raster)"]');
            const rand = document.createElementNS(SVG_NS, 'rect');
            rand.setAttribute('class', 'sp-blattrand');
            rand.setAttribute('x', '0');
            rand.setAttribute('y', '0');
            rand.setAttribute('width', String(B));
            rand.setAttribute('height', String(H));
            rand.setAttribute('fill', 'none');
            rand.setAttribute('pointer-events', 'none');
            if (blattRaster) {
                const tisch = document.createElementNS(SVG_NS, 'rect');
                tisch.setAttribute('class', 'sp-tisch');
                tisch.setAttribute('fill', 'url(#sp-raster)');
                tisch.setAttribute('pointer-events', 'none');
                blattRaster.before(tisch);
                blattRaster.after(rand);
            }
            else {
                const defs = svg.querySelector(':scope > defs:last-of-type');
                if (defs)
                    defs.after(rand);
                else
                    svg.prepend(rand);
            }
        };
        const tischZiehen = () => {
            const svg = svgJetzt();
            const tisch = svg?.querySelector('.sp-tisch');
            if (!svg || !tisch)
                return;
            const r = svg.getBoundingClientRect();
            if (r.width < 1 || r.height < 1)
                return;
            const a = planAm(r.left, r.top), b = planAm(r.right, r.bottom);
            const R = Register.fachzeichen.RASTER || 10;
            const x = Math.floor(a.x / R) * R - R, y = Math.floor(a.y / R) * R - R;
            tisch.setAttribute('x', String(x));
            tisch.setAttribute('y', String(y));
            tisch.setAttribute('width', String(Math.ceil((b.x - x) / R) * R + R));
            tisch.setAttribute('height', String(Math.ceil((b.y - y) / R) * R + R));
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
            ansichtVomNutzer = true;
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
        let ansichtVomNutzer = false;
        const EINPASSEN_MAX = 1.75;
        const belegt = () => {
            let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
            const nimm = (ax, ay, bx, by) => {
                if (![ax, ay, bx, by].every(Number.isFinite))
                    return;
                x1 = Math.min(x1, ax);
                y1 = Math.min(y1, ay);
                x2 = Math.max(x2, bx);
                y2 = Math.max(y2, by);
            };
            z.plan.teile.forEach(t => {
                const m = Schaltplan.teilMasse(t);
                const text = Math.max(String(t.bmk || '').length * 7.5, Math.min(38, String(t.beschriftung || '').length) * 6.5);
                nimm(t.x - 4, t.y - 4, t.x + m.w + (text ? 8 + text : 4), t.y + Math.max(m.h, t.beschriftung ? 30 : 0) + 4);
            });
            z.plan.leitungen.forEach(l => (l.punkte || []).forEach((q) => nimm(q.x, q.y, q.x, q.y)));
            z.plan.texte.forEach(x => nimm(x.x, x.y - 13, x.x + String(x.t || '').length * 7.5, x.y + 4));
            return Number.isFinite(x1) ? { x1, y1, x2, y2 } : null;
        };
        const einpassen = () => {
            ansichtVomNutzer = false;
            const svg = svgJetzt();
            const r = svg ? svg.getBoundingClientRect() : null;
            const kasten = belegt();
            if (!svg || !r || r.width < 40 || r.height < 40 || !kasten) {
                z.ansicht = { zoom: 1, x: 0, y: 0 };
                ansichtAnwenden();
                return;
            }
            const g = schirm();
            const oben = r.height > 300 ? 64 : 0;
            const r0 = r;
            const r1 = { left: r0.left, top: r0.top + oben, width: r0.width, height: r0.height - oben };
            const rand = Math.max(24, 0.04 * Math.max(kasten.x2 - kasten.x1, kasten.y2 - kasten.y1));
            const bw = kasten.x2 - kasten.x1 + 2 * rand, bh = kasten.y2 - kasten.y1 + 2 * rand;
            const k = Math.min(r1.width / bw, r1.height / bh, EINPASSEN_MAX);
            const zoom = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, k / g.s1)) * 1000) / 1000;
            const kk = g.s1 * zoom;
            const mx = (kasten.x1 + kasten.x2) / 2, my = (kasten.y1 + kasten.y2) / 2;
            const ansicht = { zoom, x: mx - (r1.left + r1.width / 2 - g.cx) / kk, y: my - (r1.top + r1.height / 2 - g.cy) / kk };
            const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
            z.ansicht = (Math.abs(zoom - 1) < 0.03 && Math.abs(ansicht.x) < 0.03 * B && Math.abs(ansicht.y) < 0.03 * H)
                ? { zoom: 1, x: 0, y: 0 } : ansicht;
            ansichtAnwenden();
        };
        const ruhig = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.dataset.bewegung === 'ruhig';
        const gleitend = (setzen) => {
            const svg = svgJetzt();
            const vor = svg && !ruhig() ? svg.getScreenCTM() : null;
            setzen();
            const nach = vor ? svgJetzt()?.getScreenCTM() : null;
            if (!vor || !nach || !nach.a || typeof leinwand.animate !== 'function')
                return;
            const r = vor.a / nach.a;
            if (Math.abs(r - 1) < 0.002 && Math.abs(vor.e - nach.e) < 0.5 && Math.abs(vor.f - nach.f) < 0.5)
                return;
            const L = leinwand.getBoundingClientRect();
            const tx = vor.e - L.left - r * (nach.e - L.left), ty = vor.f - L.top - r * (nach.f - L.top);
            const kurve = getComputedStyle(document.documentElement).getPropertyValue('--ease-enter').trim() || 'ease-out';
            buehne.classList.add('sp-gleitet');
            const a = leinwand.animate([{ transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${r})` },
                { transformOrigin: '0 0', transform: 'none' }], { duration: 200, easing: kurve });
            const fertig = () => buehne.classList.remove('sp-gleitet');
            a.onfinish = fertig;
            a.oncancel = fertig;
        };
        const allesZeigen = () => gleitend(einpassen);
        const schwenken = (dx, dy) => {
            ansichtVomNutzer = true;
            const g = schirm(), k = g.s1 * z.ansicht.zoom;
            z.ansicht = { zoom: z.ansicht.zoom, x: z.ansicht.x - dx / k, y: z.ansicht.y - dy / k };
            ansichtAnwenden();
        };
        let buehnenMass = '';
        const buehnenBeobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
            const r = buehne.getBoundingClientRect();
            if (!wurzel.isConnected || r.width < 1 || r.height < 1) {
                if (!wurzel.isConnected && !platzhalter)
                    buehnenBeobachter?.disconnect();
                return;
            }
            const mass = `${Math.round(r.width)}×${Math.round(r.height)}`;
            if (mass === buehnenMass)
                return;
            buehnenMass = mass;
            if (ansichtVomNutzer)
                ansichtAnwenden();
            else
                einpassen();
        }) : null;
        buehnenBeobachter?.observe(buehne);
        zoomleiste.addEventListener('click', e => {
            const b = e.target.closest('[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'zoom-plus')
                gleitend(() => zoomUm(1.25));
            else if (b.dataset.a === 'zoom-minus')
                gleitend(() => zoomUm(0.8));
            else if (b.dataset.a === 'zoom-alles')
                allesZeigen();
        });
        const pruefLaden = () => {
            const w = window;
            if (w.Planpruefung)
                return Promise.resolve();
            if (w.__pruefLaden)
                return w.__pruefLaden;
            const v = new Promise((ja, nein) => {
                const s = document.createElement('script');
                s.src = 'quell/bereiche/bloecke/arten/schaltplan-pruefung.js';
                s.addEventListener('load', () => ja());
                s.addEventListener('error', () => nein(new Error('Das Prüfzentrum liess sich nicht laden.')));
                document.head.appendChild(s);
            });
            w.__pruefLaden = v;
            v.catch(() => { w.__pruefLaden = null; });
            return v;
        };
        const pruefDaten = () => window.Planpruefung.analysieren(z.plan, {
            anschluesseVon: (t) => Schaltplan.anschluesseVon(t),
            holeSymbol: (id) => Register.fachzeichen.holen(id),
            netze: (plan) => Stromfluss.netze(plan),
            offeneKlemmen: (plan) => {
                const r = stromRechnung(plan, {}, {});
                return ((r && r.warnungen) || []).filter((w) => / hängt an keiner Leitung\.$/.test(w));
            }
        });
        const pruefMalen = () => {
            if (!pruefungOffen)
                return;
            if (!window.Planpruefung) {
                pruefPanel.innerHTML = '<p class="sp-bat-hinweis" role="status">Das Prüfzentrum wird geladen …</p>';
                pruefLaden().then(() => { if (pruefungOffen && wurzel.isConnected)
                    pruefMalen(); })
                    .catch((err) => { pruefPanel.innerHTML = '<p class="sp-bat-hinweis" role="alert">' + esc(err.message) + '</p>'; });
                return;
            }
            const r = pruefDaten();
            const tasten = ['diagnose', 'bauteile', 'netze'].map((id, i) => `<button type="button" data-p-tab="${id}" aria-pressed="${pruefAnsicht === id}"` +
                ` class="${pruefAnsicht === id ? 'an' : ''}">${['Prüfpunkte', 'Stückliste', 'Netze'][i]}</button>`).join('');
            const kopf = `<div class="sp-pruef-titel"><div><strong>Schaltplan-Prüfzentrum</strong>` +
                `<p>Hinweise zur Zeichnung – keine elektrische Sicherheitsabnahme.</p></div>` +
                `<button type="button" data-p-a="schliessen" aria-label="Prüfzentrum schliessen">✕</button></div>` +
                `<div class="sp-pruef-kennzahlen" aria-live="polite">` +
                `<span>${r.statistik.teile} Bauteile</span><span>${r.statistik.leitungen} Leitungen</span>` +
                `<span>${r.statistik.netze} Netze</span><span>${r.zaehler.fehler} Fehler</span>` +
                `<span>${r.zaehler.warnung} Warnungen</span><span>${r.zaehler.hinweis} Hinweise</span></div>` +
                `<div class="sp-pruef-tabs" role="group" aria-label="Prüfzentrum Ansichten">${tasten}</div>`;
            let liste = '';
            if (pruefAnsicht === 'diagnose') {
                liste = r.punkte.length ? r.punkte.slice(0, 250).map((eintrag, i) => `<button type="button" class="sp-pruef-zeile" data-p-id="${esc(eintrag.id)}" data-p-index="${i}"` +
                    ` data-suche="${esc((eintrag.text + ' ' + eintrag.id).toLocaleLowerCase('de'))}"` +
                    ` title="Im Schaltplan auswählen"><span class="sp-pruef-stufe ${esc(eintrag.stufe)}">${esc(eintrag.stufe)}</span>` +
                    `<span>${esc(eintrag.text)}</span></button>`).join('') :
                    '<p class="sp-pruef-leer">Keine Auffälligkeiten in den geprüften Strukturregeln.</p>';
                if (r.punkte.length > 250)
                    liste += `<p>${r.punkte.length - 250} weitere Hinweise im Textbericht.</p>`;
            }
            else if (pruefAnsicht === 'bauteile') {
                liste = r.bauteile.map((b) => `<button type="button" title="Bauteile dieses Typs auswählen" class="sp-pruef-bestand" data-p-typ="${esc(b.zeichen)}"` +
                    ` data-suche="${esc((b.name + ' ' + b.zeichen + ' ' + b.kennzeichen.join(' ')).toLocaleLowerCase('de'))}">` +
                    `<b>${esc(b.name)}</b><span>${b.anzahl} ×</span><small>${esc(b.kennzeichen.join(', ') || b.zeichen)}</small></button>`).join('') ||
                    '<p class="sp-pruef-leer">Noch keine Bauteile im Plan.</p>';
            }
            else {
                liste = r.netze.map((n) => `<button type="button" title="Netz im Plan auswählen" class="sp-pruef-bestand" data-p-netz="${n.nummer}"` +
                    ` data-suche="${esc(('N' + n.nummer + ' ' + n.klemmen.map((k) => k.teil + ' ' + k.nr).join(' ')).toLocaleLowerCase('de'))}">` +
                    `<b>Netz ${n.nummer + 1}</b><span>${n.leitungen.length} Leiter</span>` +
                    `<small>${esc(n.klemmen.map((k) => `${k.teil}:${k.nr}`).join(', ') || 'Keine Bauteilklemme')}</small></button>`).join('') ||
                    '<p class="sp-pruef-leer">Keine elektrischen Netze vorhanden.</p>';
            }
            pruefPanel.innerHTML = kopf + `<div class="sp-pruef-werkzeuge">` +
                `<label>Filtern<input type="search" class="sp-pruef-suche" value="${esc(pruefSuche)}" placeholder="Kennzeichen, Typ, Fundstelle …" /></label>` +
                `<button type="button" data-p-a="export">${pruefAnsicht === 'diagnose' ? 'Bericht TXT' : 'Export CSV'}</button>` +
                `<button type="button" data-p-a="aufraeumen" title="Redundante Zwischenpunkte entfernen – Anschlusspunkte bleiben erhalten">Leitungen aufräumen</button>` +
                `</div><div class="sp-pruef-liste">${liste}</div>`;
            pruefFiltern();
        };
        const pruefFiltern = () => {
            const wort = pruefSuche.trim().toLocaleLowerCase('de');
            pruefPanel.querySelectorAll('[data-suche]').forEach(el => {
                el.hidden = !!wort && !(el.dataset.suche || '').includes(wort);
            });
        };
        const pruefFokussieren = (eintrag) => {
            if (z.zieht || !eintrag?.id)
                return;
            const teil = z.plan.teile.find(t => t.id === eintrag.id);
            const leitung = z.plan.leitungen.find(l => l.id === eintrag.id);
            const t = z.plan.texte.find(t => t.id === eintrag.id);
            const p = Number.isFinite(eintrag.x) && Number.isFinite(eintrag.y)
                ? { x: eintrag.x, y: eintrag.y }
                : teil || t || (leitung && leitung.punkte?.[0]);
            if (!p)
                return;
            z.auswahl.clear();
            z.auswahl.add(eintrag.id);
            z.werkzeug = 'zeigen';
            z.gewaehltesZeichen = '';
            const zoom = Math.max(1.5, z.ansicht.zoom);
            ansichtVomNutzer = true;
            z.ansicht = { zoom: Math.min(3, zoom),
                x: p.x - z.plan.breite / (2 * Math.min(3, zoom)),
                y: p.y - z.plan.hoehe / (2 * Math.min(3, zoom)) };
            male();
            wurzel.focus({ preventScroll: true });
        };
        const pruefMehrfach = (ids) => {
            if (z.zieht || !ids.length)
                return;
            z.auswahl = new Set(ids);
            z.werkzeug = 'zeigen';
            z.gewaehltesZeichen = '';
            const punkte = [];
            z.plan.teile.forEach(t => { if (z.auswahl.has(t.id))
                punkte.push({ x: t.x, y: t.y }); });
            z.plan.leitungen.forEach(l => { if (z.auswahl.has(l.id))
                punkte.push(...l.punkte); });
            if (punkte.length) {
                const links = Math.min(...punkte.map(p => p.x)), rechts = Math.max(...punkte.map(p => p.x));
                const oben = Math.min(...punkte.map(p => p.y)), unten = Math.max(...punkte.map(p => p.y));
                const zoom = Math.max(.25, Math.min(3, z.plan.breite / (rechts - links + 120), z.plan.hoehe / (unten - oben + 120)));
                ansichtVomNutzer = true;
                z.ansicht = { zoom, x: (links + rechts) / 2 - z.plan.breite / (2 * zoom),
                    y: (oben + unten) / 2 - z.plan.hoehe / (2 * zoom) };
            }
            male();
            wurzel.focus({ preventScroll: true });
        };
        const pruefHerunterladen = (text, datei, mime) => {
            if (z.zieht) {
                UI.toast('Erst den laufenden Zug beenden.');
                return;
            }
            const blob = new Blob([text], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = datei;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        };
        pruefPanel.addEventListener('input', e => {
            const el = e.target;
            if (!el.classList.contains('sp-pruef-suche'))
                return;
            pruefSuche = el.value;
            pruefFiltern();
        });
        pruefPanel.addEventListener('click', e => {
            const b = e.target.closest('[data-p-tab],[data-p-a],[data-p-id],[data-p-typ],[data-p-netz]');
            if (!b)
                return;
            if (b.dataset.pTab) {
                pruefAnsicht = b.dataset.pTab;
                pruefMalen();
                return;
            }
            if (b.dataset.pTyp) {
                const ids = z.plan.teile.filter(t => t.zeichen === b.dataset.pTyp).map(t => t.id);
                pruefMehrfach(ids);
                return;
            }
            if (b.dataset.pNetz !== undefined) {
                const n = pruefDaten().netze.find((n) => String(n.nummer) === b.dataset.pNetz);
                if (n)
                    pruefMehrfach([...new Set([...n.leitungen, ...n.klemmen.map((k) => k.teil)])]);
                return;
            }
            if (b.dataset.pId) {
                const r = pruefDaten();
                const eintrag = r.punkte[Number(b.dataset.pIndex)];
                if (eintrag?.id === b.dataset.pId)
                    pruefFokussieren(eintrag);
                return;
            }
            if (b.dataset.pA === 'schliessen') {
                pruefungOffen = false;
                pruefPanel.hidden = true;
                kopfMalen();
                return;
            }
            if (b.dataset.pA === 'export') {
                const r = pruefDaten(), P = window.Planpruefung;
                const daten = pruefAnsicht === 'diagnose' ? P.berichtText(r) :
                    pruefAnsicht === 'bauteile' ? P.bauteileCsv(r) : P.netzeCsv(r);
                pruefHerunterladen(daten, pruefAnsicht === 'diagnose' ? 'Redion-Schaltplan-Pruefbericht.txt' :
                    pruefAnsicht === 'bauteile' ? 'Redion-Stueckliste.csv' : 'Redion-Netzliste.csv', pruefAnsicht === 'diagnose' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8');
                return;
            }
            if (b.dataset.pA === 'aufraeumen') {
                if (z.zieht)
                    return;
                const P = window.Planpruefung;
                const kopie = JSON.parse(JSON.stringify(z.plan));
                const ergebnis = P.vereinfachen(kopie, (t) => Schaltplan.anschluesseVon(t));
                if (!ergebnis.entfernt) {
                    UI.toast('Keine sicher entfernbaren Zwischenpunkte gefunden.');
                    return;
                }
                aendere(() => { z.plan.leitungen = kopie.leitungen; });
                UI.toast(`${ergebnis.entfernt} überflüssige Zwischenpunkte entfernt – mit Rückgängig umkehrbar.`);
            }
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
            if (!id || z.simulation || z.zieht || !Register.fachzeichen.holen(id))
                return null;
            const neu = Schaltplan.uid();
            aendere(() => {
                z.plan.teile.push({
                    id: neu, zeichen: id,
                    x: Schaltplan.rasten(x), y: Schaltplan.rasten(y),
                    drehung: 0, gespiegelt: false,
                    bmk: Schaltplan.naechstesBmk(z.plan, id),
                    nummern: {}, gruppe: '',
                    ebene: aktiveEbene()
                });
            });
            const g = svgJetzt()?.querySelector(`.sp-teil[data-id="${CSS.escape(neu)}"]`);
            if (g)
                g.classList.add('sp-frisch-eingesetzt');
            return neu;
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
            if (z.zieht)
                return;
            const teile = (Array.isArray(v?.teile) ? v.teile : []);
            const leitungen = (Array.isArray(v?.leitungen) ? v.leitungen : []);
            if (!teile.length) {
                UI.toast('Diese Vorlage enthaelt keine Bauteile.');
                return;
            }
            if (teile.some(t => !t || typeof t.zeichen !== 'string' ||
                !Register.fachzeichen.holen(t.zeichen))) {
                UI.toast('Vorlage enthaelt nicht verfuegbare Schaltzeichen.');
                return;
            }
            const vorlagenIds = teile.map(t => t.id);
            if (vorlagenIds.some(id => typeof id !== 'string' || !id.trim()) ||
                new Set(vorlagenIds).size !== vorlagenIds.length) {
                UI.toast('Vorlage enthaelt fehlende oder doppelte Bauteil-IDs.');
                return;
            }
            if (leitungen.some(l => !l || !Array.isArray(l.punkte) ||
                l.punkte.length < 2 || l.punkte.some((p) => !p || p.x == null || p.y == null ||
                !Number.isFinite(Number(p.x)) || !Number.isFinite(Number(p.y))))) {
                UI.toast('Vorlage enthaelt ungueltige Leitungen.');
                return;
            }
            const r = Register.fachzeichen.RASTER;
            const rand = r;
            const rahmen = (t, dx = 0, dy = 0) => {
                const m = Register.fachzeichen.masse(t.zeichen, Number(t.drehung) || 0);
                const zc = Register.fachzeichen.holen(t.zeichen);
                const cx = Number(t.x) + dx + (zc ? zc.w : 0) / 2;
                const cy = Number(t.y) + dy + (zc ? zc.h : 0) / 2;
                return { l: cx - m.w / 2, o: cy - m.h / 2,
                    r: cx + m.w / 2, u: cy + m.h / 2 };
            };
            const vorlagenRahmen = teile.map(t => rahmen(t));
            const internUeberlappt = vorlagenRahmen.some((a, i) => vorlagenRahmen.some((b, j) => j > i &&
                a.l < b.r && b.l < a.r && a.o < b.u && b.o < a.u));
            if (internUeberlappt) {
                UI.toast('Vorlage enthaelt ueberlappende Bauteile.');
                return;
            }
            const versteckt = new Set(z.plan.ebenen
                .filter(e => e.sichtbar === false).map(e => e.id));
            const belegt = z.plan.teile
                .filter(t => !versteckt.has(t.ebene)).map(t => rahmen(t));
            const vorhandeneLeitungen = z.plan.leitungen
                .filter(l => !versteckt.has(l.ebene ?? ''));
            const abstand = Math.min(6, rand);
            const streckeTrifft = (a, b, f) => {
                const dx = b.x - a.x, dy = b.y - a.y;
                const p = [-dx, dx, -dy, dy];
                const q = [a.x - f.l, f.r - a.x, a.y - f.o, f.u - a.y];
                let ein = 0, aus = 1;
                for (let i = 0; i < 4; i++) {
                    const pi = p[i], qi = q[i];
                    if (pi === 0) {
                        if (qi < 0)
                            return false;
                        continue;
                    }
                    const t = qi / pi;
                    if (pi < 0)
                        ein = Math.max(ein, t);
                    else
                        aus = Math.min(aus, t);
                    if (ein > aus)
                        return false;
                }
                return true;
            };
            const passt = (dx, dy) => {
                const teilePassen = teile.every(t => {
                    const a = rahmen(t, dx, dy);
                    return Number.isFinite(a.l) && Number.isFinite(a.o) &&
                        Number.isFinite(a.r) && Number.isFinite(a.u) &&
                        a.l >= rand && a.o >= rand &&
                        a.r <= z.plan.breite - rand && a.u <= z.plan.hoehe - rand &&
                        belegt.every(b => a.r + rand <= b.l || b.r + rand <= a.l ||
                            a.u + rand <= b.o || b.u + rand <= a.o) &&
                        vorhandeneLeitungen.every(l => {
                            const feld = { l: a.l - abstand, o: a.o - abstand,
                                r: a.r + abstand, u: a.u + abstand };
                            const pkt = l.punkte || [];
                            return pkt.every((p, i) => i === 0 || !streckeTrifft(pkt[i - 1], p, feld));
                        });
                });
                return teilePassen && leitungen.every(l => {
                    const punkte = (Array.isArray(l.punkte) ? l.punkte : [])
                        .map((p) => ({ x: Number(p.x) + dx, y: Number(p.y) + dy }));
                    if (!punkte.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) &&
                        p.x >= rand && p.y >= rand &&
                        p.x <= z.plan.breite - rand && p.y <= z.plan.hoehe - rand))
                        return false;
                    for (let i = 1; i < punkte.length; i++)
                        for (const b of belegt) {
                            const feld = { l: b.l - abstand, o: b.o - abstand,
                                r: b.r + abstand, u: b.u + abstand };
                            if (streckeTrifft(punkte[i - 1], punkte[i], feld))
                                return false;
                        }
                    if (punkte.length >= 2 && Schaltplan.ueberlappt(punkte, vorhandeneLeitungen))
                        return false;
                    return true;
                });
            };
            const schritt = Math.max(r * 4, 40);
            let versatz = null;
            if (passt(120, 80))
                versatz = { x: 120, y: 80 };
            for (let y = r * 2; !versatz && y < z.plan.hoehe; y += schritt)
                for (let x = r * 2; !versatz && x < z.plan.breite; x += schritt)
                    if (passt(x, y))
                        versatz = { x, y };
            for (let y = r; !versatz && y < z.plan.hoehe; y += r)
                for (let x = r; !versatz && x < z.plan.breite; x += r)
                    if (passt(x, y))
                        versatz = { x, y };
            if (!versatz) {
                UI.toast('Kein freier Platz fuer diese Vorlage. Bitte erst Platz schaffen.');
                return;
            }
            const { x: dx, y: dy } = versatz;
            const ebene = aktiveEbene();
            aendere(() => {
                const neuId = new Map();
                const gruppen = new Map();
                teile.forEach(t => {
                    const id = Schaltplan.uid();
                    neuId.set(String(t.id), id);
                    const gruppe = String(t.gruppe || '');
                    if (gruppe && !gruppen.has(gruppe))
                        gruppen.set(gruppe, Schaltplan.uid());
                    z.plan.teile.push({ ...t, id, x: Number(t.x) + dx, y: Number(t.y) + dy,
                        bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen),
                        gruppe: gruppe ? gruppen.get(gruppe) : '', ebene,
                        nummern: { ...(t.nummern || {}) } });
                });
                leitungen.forEach(l => {
                    const neu = { ...l, id: Schaltplan.uid(), ebene,
                        punkte: (Array.isArray(l.punkte) ? l.punkte : [])
                            .map((p) => ({ x: Number(p.x) + dx, y: Number(p.y) + dy })) };
                    delete neu.vonTeil;
                    delete neu.vonNr;
                    delete neu.nachTeil;
                    delete neu.nachNr;
                    const von = neuId.get(String(l.vonTeil));
                    const nach = neuId.get(String(l.nachTeil));
                    if (von) {
                        neu.vonTeil = von;
                        neu.vonNr = l.vonNr;
                    }
                    if (nach) {
                        neu.nachTeil = nach;
                        neu.nachNr = l.nachNr;
                    }
                    if (neu.punkte.length >= 2)
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
        const planDrehen = () => {
            aendere(() => {
                const r = Schaltplan.planDrehen(z.plan);
                z.ansicht = { zoom: 1, x: 0, y: 0 };
                melde('Drehen', r.bericht, Schaltplan.veraendert(z.plan, r.vorher), r.vorher);
            });
            if (!z.zieht)
                einpassen();
        };
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
            const { st, vh } = schaltart(t.zeichen);
            if (st.length < 2)
                return false;
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
                const tip = teilKlickStart;
                teilKlickStart = null;
                male();
                if (tip && !tip.schicht)
                    karteOeffnen(tip.id);
                return;
            }
            teilKlickStart = null;
            karteSchliessen();
            const vorher = zug.vorher ?? Schaltplan.vorherMerken(z.plan);
            const bericht = Schaltplan.nachziehen(z.plan, vorher, [...zug.ausgang.keys()], { heilen: true, vonVorn: true });
            aendere(() => { });
            melde('Ziehen', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
        };
        const zugUnterbrechen = (e) => {
            const zug = z.zieht;
            if (!zug)
                return;
            if (e.pointerType === 'touch' && e.pointerId !== zug.zeiger) {
                zugAbbrechen();
                return;
            }
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
            teilKlickStart = null;
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
        let platzZug = null;
        let platzGeist = null;
        let platzGeistId = '';
        let platzBildFrame = 0;
        let platzKlickBlockBis = 0;
        let platzLetzteBild = null;
        const geistEntfernen = () => {
            if (platzBildFrame)
                cancelAnimationFrame(platzBildFrame);
            platzBildFrame = 0;
            platzLetzteBild = null;
            platzGeist?.remove();
            platzGeist = null;
            platzGeistId = '';
        };
        const platzOrt = (clientX, clientY) => {
            const svg = svgJetzt();
            if (!svg || !wurzel.isConnected)
                return null;
            const unter = document.elementFromPoint(clientX, clientY);
            if (!unter || !leinwand.contains(unter))
                return null;
            const roh = ortAus(svg, { clientX, clientY }, z.plan, true);
            if (roh.x < 0 || roh.y < 0 || roh.x > z.plan.breite || roh.y > z.plan.hoehe)
                return null;
            const p = ortAus(svg, { clientX, clientY }, z.plan);
            const m = svg.getScreenCTM();
            const bild = m ? new DOMPoint(p.x, p.y).matrixTransform(m) : null;
            return { x: p.x, y: p.y, sx: bild?.x ?? clientX, sy: bild?.y ?? clientY };
        };
        const platzGeistZeigen = (id, clientX, clientY) => {
            const ort = platzOrt(clientX, clientY);
            if (!platzGeist || platzGeistId !== id) {
                geistEntfernen();
                platzGeist = document.createElement('div');
                platzGeist.className = 'sp-platziergeist';
                platzGeist.setAttribute('aria-hidden', 'true');
                const bild = document.createElement('div');
                bild.className = 'sp-platziergeist-bild';
                bild.innerHTML = Register.fachzeichen.alsSvg(id, { strich: 2 });
                const name = document.createElement('span');
                name.textContent = Register.fachzeichen.holen(id)?.name || id;
                platzGeist.append(bild, name);
                document.body.appendChild(platzGeist);
                platzGeistId = id;
            }
            platzLetzteBild = { x: ort?.sx ?? clientX, y: ort?.sy ?? clientY, ok: !!ort };
            if (!platzBildFrame)
                platzBildFrame = requestAnimationFrame(() => {
                    platzBildFrame = 0;
                    const el = platzGeist, pos = platzLetzteBild;
                    if (!el || !pos || !wurzel.isConnected) {
                        geistEntfernen();
                        return;
                    }
                    el.style.left = `${pos.x}px`;
                    el.style.top = `${pos.y}px`;
                    el.classList.toggle('sp-platziergeist-gueltig', pos.ok);
                });
            return ort;
        };
        const platzZugAbbrechen = () => {
            platzZug = null;
            document.removeEventListener('pointermove', platzZugBewegen, true);
            document.removeEventListener('pointerup', platzZugEnde, true);
            document.removeEventListener('pointercancel', platzZugCancel, true);
            document.removeEventListener('pointerdown', platzZugZweiterFinger, true);
            document.removeEventListener('keydown', platzZugEscape, true);
            geistEntfernen();
        };
        const platzZugZweiterFinger = (e) => {
            if (platzZug && e.pointerId !== platzZug.pointerId)
                platzZugAbbrechen();
        };
        const platzZugEscape = (e) => {
            if (e.key !== 'Escape')
                return;
            e.preventDefault();
            e.stopPropagation();
            platzZugAbbrechen();
        };
        const platzZugBewegen = (e) => {
            const zug = platzZug;
            if (!zug || e.pointerId !== zug.pointerId)
                return;
            if (!wurzel.isConnected) {
                platzZugAbbrechen();
                return;
            }
            const strecke = Math.hypot(e.clientX - zug.startX, e.clientY - zug.startY);
            if (!zug.bewegt && strecke < (zug.art === 'touch' ? 10 : 6))
                return;
            zug.bewegt = true;
            e.preventDefault();
            platzGeistZeigen(zug.id, e.clientX, e.clientY);
        };
        const platzZugCancel = (e) => {
            if (platzZug && e.pointerId === platzZug.pointerId)
                platzZugAbbrechen();
        };
        const platzZugEnde = (e) => {
            const zug = platzZug;
            if (!zug || zug.pointerId !== e.pointerId)
                return;
            const ort = zug.bewegt && !z.simulation && !z.zieht
                ? platzOrt(e.clientX, e.clientY) : null;
            platzZugAbbrechen();
            if (!zug.bewegt)
                return;
            platzKlickBlockBis = Date.now() + 380;
            if (!ort || !wurzel.isConnected)
                return;
            studioZeichenWahl(zug.id, false);
            const neu = setzeSymbol(zug.id, ort.x, ort.y);
            paletteMalen(palette.querySelector('input')?.value || '');
            if (neu) {
                const puls = document.createElement('div');
                puls.className = 'sp-platzierpuls';
                puls.setAttribute('aria-hidden', 'true');
                puls.style.left = `${ort.sx}px`;
                puls.style.top = `${ort.sy}px`;
                document.body.appendChild(puls);
                puls.addEventListener('animationend', () => puls.remove(), { once: true });
                setTimeout(() => puls.remove(), 800);
            }
        };
        const platzQuelle = (e) => {
            const ziel = e.target;
            const b = ziel.closest('[data-st-symbol], [data-sym]');
            const id = b?.dataset.stSymbol || b?.dataset.sym;
            if (!id || e.button !== 0 || e.altKey || z.simulation || z.zieht || platzZug ||
                !Register.fachzeichen.holen(id))
                return;
            platzZug = { id, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
                bewegt: false, art: e.pointerType };
            document.addEventListener('pointermove', platzZugBewegen, { capture: true, passive: false });
            document.addEventListener('pointerup', platzZugEnde, true);
            document.addEventListener('pointercancel', platzZugCancel, true);
            document.addEventListener('pointerdown', platzZugZweiterFinger, true);
            document.addEventListener('keydown', platzZugEscape, true);
            if (e.pointerType !== 'mouse')
                e.preventDefault();
        };
        palette.addEventListener('pointerdown', platzQuelle);
        studioPanel.addEventListener('pointerdown', platzQuelle);
        const karteSchliessen = () => {
            karteId = '';
            schnellkarte.hidden = true;
            schnellkarte.replaceChildren();
        };
        const istZeitspule = (t) => t.zeichen === 'spule-anzugsverzoegert' || t.zeichen === 'spule-abfallverzoegert';
        const spalteVon = (t) => window.RelaisKern?.spaltenTitel?.(z.plan, t) || '';
        const karteMalen = () => {
            const t = karteId && teilVon(karteId);
            if (!t || z.simulation) {
                karteSchliessen();
                return;
            }
            const sym = Register.fachzeichen.holen(t.zeichen);
            const original = spalteVon(t);
            const zeit = istZeitspule(t);
            schnellkarte.hidden = false;
            schnellkarte.innerHTML =
                `<div class="sp-schnellkarte-kopf"><div><b>${esc(sym?.name || t.zeichen)}</b>` +
                    `<small>Bauteil · ${esc(t.bmk || 'ohne Kennzeichen')}</small></div>` +
                    `<button type="button" data-sk="zu" aria-label="Eigenschaftenkarte schliessen">✕</button></div>` +
                    `<form data-sk-form><label>Beschriftung` +
                    `<input name="beschriftung" maxlength="120" autocomplete="off" placeholder="z. B. Hauptschütz, Alarm, Motor rechts" value="${esc(t.beschriftung || '')}"></label>` +
                    `<label>Betriebsmittelkennzeichen` +
                    `<input name="bmk" maxlength="40" autocomplete="off" value="${esc(t.bmk || '')}"></label>` +
                    (zeit ? `<label>Verzögerung in Sekunden` +
                        `<input type="number" min="0" max="3600" step="0.1" name="verzoegerung" value="${Number.isFinite(t.werte?.T) ? t.werte.T : 3}"></label>` : '') +
                    (original ? `<div class="sp-schnellkarte-original"><small>Original-Spaltenüberschrift (${Number(t.legacySpalte) + 1}):</small>` +
                        `<span>${esc(original)}</span><button type="button" data-sk="spalte">Als Beschriftung übernehmen</button>` +
                        `<small>Die Zuordnung ist eine manuelle Entscheidung, keine bestätigte Originalverbindung.</small></div>` : '') +
                    `<div class="sp-schnellkarte-aktionen"><button class="prim" type="submit">Speichern</button>` +
                    `<button type="button" data-sk="details">Anschlüsse</button></div></form>` +
                    `<p class="sp-schnellkarte-hilfe">Einmal antippen zum Bearbeiten · Zum Verschieben ziehen</p>`;
        };
        const karteOeffnen = (id) => {
            if (!teilVon(id) || z.simulation)
                return;
            karteId = id;
            studioTab = 'eigenschaften';
            if (studioOffen)
                studioMalen();
            karteMalen();
        };
        schnellkarte.addEventListener('pointerdown', e => e.stopPropagation());
        schnellkarte.addEventListener('click', e => {
            const b = e.target.closest('[data-sk]');
            if (!b)
                return;
            const t = teilVon(karteId);
            if (b.dataset.sk === 'zu') {
                karteSchliessen();
                return;
            }
            if (!t || z.simulation)
                return;
            if (b.dataset.sk === 'spalte') {
                const feld = schnellkarte.querySelector('[name="beschriftung"]');
                if (feld) {
                    feld.value = spalteVon(t);
                    feld.focus();
                }
                return;
            }
            if (b.dataset.sk === 'details') {
                karteSchliessen();
                teilDialog(t);
            }
        });
        schnellkarte.addEventListener('submit', e => {
            const form = e.target.closest('[data-sk-form]');
            if (!form)
                return;
            e.preventDefault();
            const t = teilVon(karteId);
            if (!t || z.simulation || z.zieht)
                return;
            const bmk = form.elements.namedItem('bmk').value.trim().slice(0, 40);
            const beschriftung = form.elements.namedItem('beschriftung').value.trim().slice(0, 120);
            const zeitFeld = form.elements.namedItem('verzoegerung');
            const sekunden = zeitFeld ? Number(zeitFeld.value) : null;
            if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden < 0 || sekunden > 3600)) {
                zeitFeld.setCustomValidity('Bitte 0 bis 3600 Sekunden eingeben.');
                zeitFeld.reportValidity();
                return;
            }
            if (t.bmk !== bmk || (t.beschriftung || '') !== beschriftung ||
                (zeitFeld && (Number.isFinite(t.werte?.T) ? t.werte.T : 3) !== sekunden)) {
                aendere(() => {
                    t.bmk = bmk;
                    if (beschriftung)
                        t.beschriftung = beschriftung;
                    else
                        delete t.beschriftung;
                    if (zeitFeld)
                        t.werte = { ...(t.werte || {}), T: sekunden };
                });
            }
            karteMalen();
        });
        kontextleiste.addEventListener('pointerdown', e => e.stopPropagation());
        kontextleiste.addEventListener('click', e => {
            const knop = e.target.closest('[data-kontext]');
            if (!knop || z.simulation || z.zieht)
                return;
            const aktion = knop.dataset.kontext;
            if (aktion === 'abwahl') {
                z.auswahl.clear();
                karteSchliessen();
                male();
                return;
            }
            if (aktion === 'eigenschaften') {
                studioOffen = true;
                studioTab = 'eigenschaften';
                studioPanel.hidden = false;
                paletteOffen = false;
                palette.hidden = true;
                wurzel.classList.remove('sp-palette-offen');
                studioMalen();
                kopfMalen();
                return;
            }
            ({ drehen, spiegeln, doppeln, loeschen }[aktion || '']?.());
        });
        buehne.addEventListener('pointerdown', e => {
            if (e.target.closest('.sp-schnellkarte,.sp-kontextleiste'))
                return;
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
                if (!g || !g.dataset.id)
                    return;
                const teil = z.plan.teile.find(t => t.id === g.dataset.id);
                if (teil && (teil.zeichen === 'taster-schliesser' || teil.zeichen === 'taster-oeffner')) {
                    const id = String(teil.id);
                    const los = () => {
                        document.removeEventListener('pointerup', los, true);
                        document.removeEventListener('pointercancel', los, true);
                        if (z.simulation) {
                            z.stellungen[id] = 0;
                            male();
                        }
                    };
                    document.addEventListener('pointerup', los, true);
                    document.addEventListener('pointercancel', los, true);
                    z.stellungen[id] = 1;
                    male();
                    return;
                }
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
                const fang = Schaltplan.fangeAnschluss(z.plan, roh, anschlussFangRadius(svg, e.pointerType));
                zugBeginnen({ art: 'leitung', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map(),
                    von: fang ? { x: fang.x, y: fang.y, teil: fang.teil, nr: fang.nr }
                        : { x: p.x, y: p.y } });
                svg.setPointerCapture(e.pointerId);
                return;
            }
            const g = teilAm(ziel);
            if (!g || !g.dataset.id) {
                if (z.gewaehltesZeichen) {
                    geistEntfernen();
                    setzeSymbol(z.gewaehltesZeichen, p.x, p.y);
                    return;
                }
                if (!e.shiftKey) {
                    z.auswahl.clear();
                    karteSchliessen();
                }
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
                    karteSchliessen();
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
            teilKlickStart = { id, x: e.clientX, y: e.clientY, schicht: e.shiftKey };
            zugBeginnen({ art: 'teil', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang,
                vorher: Schaltplan.vorherMerken(z.plan),
                lage: [...ausgang.values()].map(a => a.x + ',' + a.y).join(';') });
            svg.setPointerCapture(e.pointerId);
            male();
        });
        buehne.addEventListener('pointermove', e => {
            if (!z.zieht) {
                if (!platzZug && e.pointerType !== 'touch' && !e.buttons &&
                    !z.simulation && z.werkzeug === 'zeigen' && z.gewaehltesZeichen)
                    platzGeistZeigen(z.gewaehltesZeichen, e.clientX, e.clientY);
                else if (!platzZug)
                    geistEntfernen();
                return;
            }
            if (e.pointerId !== z.zieht.zeiger)
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
                const fang = Schaltplan.fangeAnschluss(z.plan, ortAus(svg, e, z.plan, true), anschlussFangRadius(svg, e.pointerType));
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
        buehne.addEventListener('pointerleave', () => { if (!platzZug)
            geistEntfernen(); });
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
                if (teilKlickStart && Math.hypot(e.clientX - teilKlickStart.x, e.clientY - teilKlickStart.y) > 9)
                    teilKlickStart = null;
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
                if (!svg) {
                    male();
                    return;
                }
                const fang = Schaltplan.fangeAnschluss(z.plan, ortAus(svg, e, z.plan, true), anschlussFangRadius(svg, e.pointerType));
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
            if (!z.voll && !ansichtVomNutzer)
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
        const studioHelfer = () => StudioHilfe;
        const studioLetzteLaden = () => {
            const roh = typeof Store !== 'undefined' ? Store.getMeta('redion:elektro:letzte:v1', []) : [];
            return studioHelfer()?.leseLetzte(roh) || [];
        };
        studioLetzte = studioLetzteLaden();
        const studioZeichenWahl = (id, neuZeichnen = true) => {
            if (z.simulation || z.zieht || !Register.fachzeichen.holen(id))
                return;
            z.werkzeug = 'zeigen';
            z.gewaehltesZeichen = id;
            z.auswahl.clear();
            studioLetzte = studioHelfer()?.merkeLetzte(studioLetzte, id) || [id];
            if (typeof Store !== 'undefined')
                Store.setMeta('redion:elektro:letzte:v1', studioLetzte);
            if (neuZeichnen) {
                paletteMalen(palette.querySelector('input')?.value || '');
                male();
            }
        };
        const studioMalen = () => {
            if (!studioOffen || studioPanel.hidden)
                return;
            const helper = studioHelfer();
            const symbols = Register.fachzeichen.alle();
            const gewaehlt = [...z.auswahl].map(id => z.plan.teile.find(t => t.id === id)).filter(Boolean);
            const tabs = [['einsetzen', 'Einfügen'], ['eigenschaften', 'Eigenschaften'], ['status', 'Übersicht']]
                .map(([id, name]) => `<button type="button" data-st-tab="${id}" aria-pressed="${studioTab === id}" class="${studioTab === id ? 'an' : ''}">${name}</button>`).join('');
            let inhalt = '';
            if (studioTab === 'einsetzen') {
                const gefunden = helper?.suche(symbols, studioSuchtext, studioGruppe, 36) || [];
                const letzte = studioSuchtext || studioGruppe !== 'alle' ? [] : studioLetzte
                    .map(id => Register.fachzeichen.holen(id)).filter(Boolean).slice(0, 8);
                const symbolKarte = (teil, art) => `<button type="button" class="sp-studio-symbol${z.gewaehltesZeichen === teil.id ? ' an' : ''}" data-st-symbol="${esc(teil.id)}" ` +
                    `title="${esc(teil.name + ' – ' + (teil.erklaerung || ''))}" ${z.simulation ? 'disabled' : ''}>` +
                    `<span class="sp-studio-bild" aria-hidden="true">${Register.fachzeichen.alsSvg(teil.id, { strich: 2 })}</span>` +
                    `<span>${esc(teil.name)}</span>${art === 'neu' ? '<small>Zuletzt</small>' : ''}</button>`;
                const gruppen = Register.fachzeichen.gruppen();
                inhalt = `<label class="sp-studio-suchfeld">Symbol suchen ` +
                    `<input type="search" data-st-suche placeholder="z. B. Schliesser, Lampe …" value="${esc(studioSuchtext)}" autocomplete="off" ${z.simulation ? 'disabled' : ''}></label>` +
                    `<label class="sp-studio-suchfeld">Kategorie <select data-st-gruppe ${z.simulation ? 'disabled' : ''}>` +
                    `<option value="alle">Alle Bauteile</option>` +
                    gruppen.map(g => `<option value="${esc(g[0])}"${studioGruppe === g[0] ? ' selected' : ''}>${esc(g[1])}</option>`).join('') +
                    `</select></label>` +
                    (letzte.length ? `<div class="sp-studio-letzte"><div class="sp-studio-untertitel">Zuletzt benutzt</div><div class="sp-studio-raster">${letzte.map((x) => symbolKarte(x, 'neu')).join('')}</div></div>` : '') +
                    `<div class="sp-studio-untertitel sp-studio-treffer-zahl">${gefunden.length} Treffer${studioSuchtext ? ' für „' + esc(studioSuchtext) + '“' : ''}</div>` +
                    `<div class="sp-studio-raster sp-studio-treffer">${gefunden.map((x) => symbolKarte(x, 'normal')).join('') || '<p>Kein Bauteil gefunden.</p>'}</div>` +
                    `<p class="sp-studio-hilfe">Mit Maus, Finger oder Stift ein Bauteil anfassen und direkt auf den Plan ziehen. Oder antippen und anschliessend auf der Fläche platzieren. Alt + Klick links fügt ein Symbol zu Favoriten hinzu.</p>`;
            }
            else if (studioTab === 'eigenschaften') {
                if (z.simulation)
                    inhalt = '<p class="sp-studio-hilfe">Simulation anhalten, um Bauteile zu bearbeiten.</p>';
                else if (gewaehlt.length === 1 && z.auswahl.size === 1) {
                    const t = gewaehlt[0];
                    const symbol = Register.fachzeichen.holen(t.zeichen);
                    const infos = helper?.ueberblick(z.plan, (id) => Register.fachzeichen.holen(id)) || {};
                    inhalt = `<div class="sp-studio-auswahl"><div class="sp-studio-bild">${Register.fachzeichen.alsSvg(t.zeichen, { strich: 2 })}</div><div><strong>${esc(symbol?.name || t.zeichen)}</strong><small>${esc(t.id)}</small></div></div>` +
                        `<form data-st-form><input type="hidden" name="teil" value="${esc(t.id)}">` +
                        `<label>Betriebsmittelkennzeichen<input name="bmk" maxlength="40" value="${esc(t.bmk || '')}" placeholder="z. B. K1"></label>` +
                        `<label>Beschriftung<input name="beschriftung" maxlength="120" value="${esc(t.beschriftung || '')}" placeholder="z. B. Hauptschütz"></label>` +
                        (istZeitspule(t) ? `<label>Zeitrelais-Verzögerung (s)<input name="verzoegerung" type="number" step="0.1" min="0" max="3600" value="${Number.isFinite(t.werte?.T) ? t.werte.T : 3}"></label>` : '') +
                        (spalteVon(t) ? `<p class="sp-studio-hilfe">Original-Spaltenüberschrift: <b>${esc(spalteVon(t))}</b> (nicht automatisch ein Bauteilname).</p>` : '') +
                        `<p class="sp-studio-hilfe">Rasterposition: ${Number(t.x)} / ${Number(t.y)} · Drehung: ${Number(t.drehung) || 0}°</p>` +
                        `<div class="sp-studio-actions"><button type="submit" class="prim">Eigenschaften speichern</button>` +
                        `<button type="button" data-st-a="details">Anschlüsse …</button></div></form>` +
                        `<div class="sp-studio-actions"><button type="button" data-st-a="drehen">↻ Drehen</button>` +
                        `<button type="button" data-st-a="spiegeln">⇋ Spiegeln</button>` +
                        `<button type="button" data-st-a="doppeln">⊕ Duplizieren</button></div>` +
                        (infos.doppelteKennzeichen?.includes(String(t.bmk || '').trim()) ? '<p class="sp-studio-warn">Dieses Kennzeichen kommt mehrfach vor. Das kann für Relaiskontakte beabsichtigt sein – Zuordnung prüfen.</p>' : '');
                }
                else if (gewaehlt.length) {
                    inhalt = `<p><b>${gewaehlt.length} Bauteile</b> ausgewählt</p>` +
                        `<p class="sp-studio-hilfe">Gruppenweise drehen, spiegeln und duplizieren geht über die vorhandenen Werkzeuge.</p>` +
                        `<div class="sp-studio-actions"><button data-st-a="drehen">↻ Drehen</button><button data-st-a="spiegeln">⇋ Spiegeln</button><button data-st-a="doppeln">⊕ Duplizieren</button></div>`;
                }
                else {
                    inhalt = '<p class="sp-studio-hilfe">Ein Bauteil im Schaltplan auswählen. Hier kannst du es direkt beschriften, drehen und bearbeiten.</p>';
                }
            }
            else {
                const u = helper?.ueberblick(z.plan, (id) => Register.fachzeichen.holen(id)) || { teile: 0, leitungen: 0, texte: 0, gruppen: [], doppelteKennzeichen: [] };
                inhalt = `<div class="sp-studio-kennzahlen"><div><strong>${u.teile}</strong><small>Bauteile</small></div>` +
                    `<div><strong>${u.leitungen}</strong><small>Leitungen</small></div>` +
                    `<div><strong>${u.texte}</strong><small>Texte</small></div></div>` +
                    `<div class="sp-studio-untertitel">Verwendete Symbolgruppen</div>` +
                    `<div class="sp-studio-gruppen">${u.gruppen.map((g) => `<span>${esc(g.gruppe)} <b>${g.anzahl}</b></span>`).join('') || 'Noch keine Bauteile'}</div>` +
                    `<p class="sp-studio-hilfe">${u.doppelteKennzeichen.length ? `${u.doppelteKennzeichen.length} mehrfach verwendete Kennzeichen. Bei Spulen und Kontakten kann das richtig sein.` : 'Keine mehrfach verwendeten Betriebsmittelkennzeichen.'}</p>` +
                    `<div class="sp-studio-actions"><button type="button" data-st-a="pruefen">✓ Prüfzentrum</button>` +
                    `<button type="button" data-st-a="zoom">⤢ Plan zeigen</button></div>`;
            }
            studioPanel.innerHTML = `<div class="sp-studio-kopf"><div><b>Elektro Studio</b><small>Bauteile · Bearbeiten · Prüfen</small></div>` +
                `<button type="button" data-st-a="schliessen" aria-label="Elektro Studio schliessen">✕</button></div>` +
                `<div class="sp-studio-tabs" role="group" aria-label="Elektro Studio Bereiche">${tabs}</div>` +
                `<div class="sp-studio-inhalt">${inhalt}</div>`;
        };
        studioPanel.addEventListener('input', e => {
            const f = e.target;
            if (!f.matches('[data-st-suche]'))
                return;
            studioSuchtext = f.value.slice(0, 90);
            const letzteElemente = studioPanel.querySelector('.sp-studio-letzte');
            if (letzteElemente)
                letzteElemente.hidden = !!studioSuchtext;
            const gefunden = studioHelfer()?.suche(Register.fachzeichen.alle(), studioSuchtext, studioGruppe, 36) || [];
            const raster = studioPanel.querySelector('.sp-studio-treffer');
            if (raster)
                raster.replaceChildren(...gefunden.map((x) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'sp-studio-symbol' + (z.gewaehltesZeichen === x.id ? ' an' : '');
                    b.dataset.stSymbol = x.id;
                    b.title = x.name;
                    const img = document.createElement('span');
                    img.className = 'sp-studio-bild';
                    img.innerHTML = Register.fachzeichen.alsSvg(x.id, { strich: 2 });
                    const t = document.createElement('span');
                    t.textContent = x.name;
                    b.append(img, t);
                    return b;
                }));
            const count = studioPanel.querySelector('.sp-studio-treffer-zahl');
            if (count)
                count.textContent = `${gefunden.length} Treffer`;
        });
        studioPanel.addEventListener('change', e => {
            const f = e.target;
            if (!f.matches('[data-st-gruppe]'))
                return;
            studioGruppe = f.value;
            studioMalen();
        });
        studioPanel.addEventListener('submit', e => {
            const form = e.target.closest('[data-st-form]');
            if (!form)
                return;
            e.preventDefault();
            if (z.simulation || z.zieht)
                return;
            const id = form.querySelector('[name="teil"]')?.value;
            const bmk = form.querySelector('[name="bmk"]')?.value.trim().slice(0, 40) || '';
            const beschriftung = form.querySelector('[name="beschriftung"]')?.value.trim().slice(0, 120) || '';
            const zeitFeld = form.querySelector('[name="verzoegerung"]');
            const sekunden = zeitFeld ? Number(zeitFeld.value) : null;
            if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden < 0 || sekunden > 3600)) {
                zeitFeld.setCustomValidity('Bitte 0 bis 3600 Sekunden eingeben.');
                zeitFeld.reportValidity();
                return;
            }
            const teil = z.plan.teile.find(t => t.id === id);
            if (!teil || (teil.bmk === bmk && (teil.beschriftung || '') === beschriftung &&
                (!zeitFeld || (Number.isFinite(teil.werte?.T) ? teil.werte.T : 3) === sekunden)))
                return;
            aendere(() => {
                teil.bmk = bmk;
                if (beschriftung)
                    teil.beschriftung = beschriftung;
                else
                    delete teil.beschriftung;
                if (zeitFeld)
                    teil.werte = { ...(teil.werte || {}), T: sekunden };
            });
            if (karteId === teil.id)
                karteMalen();
        });
        studioPanel.addEventListener('click', e => {
            if (Date.now() < platzKlickBlockBis)
                return;
            const b = e.target.closest('[data-st-tab],[data-st-a],[data-st-symbol]');
            if (!b)
                return;
            if (b.dataset.stTab) {
                studioTab = b.dataset.stTab;
                studioMalen();
                return;
            }
            if (b.dataset.stSymbol) {
                studioZeichenWahl(b.dataset.stSymbol);
                return;
            }
            const a = b.dataset.stA;
            if (a === 'schliessen') {
                studioOffen = false;
                studioPanel.hidden = true;
                kopfMalen();
                return;
            }
            if (z.zieht)
                return;
            if (a === 'pruefen') {
                pruefungOffen = true;
                pruefPanel.hidden = false;
                kopfMalen();
                pruefMalen();
                return;
            }
            if (a === 'zoom') {
                allesZeigen();
                return;
            }
            if (z.simulation)
                return;
            if (a === 'details') {
                const t = z.plan.teile.find(t => z.auswahl.has(t.id));
                if (t)
                    teilDialog(t);
            }
            if (a === 'drehen')
                drehen();
            if (a === 'spiegeln')
                spiegeln();
            if (a === 'doppeln')
                doppeln();
        });
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
                    `<label>Beschriftung<input id="sp-beschriftung" maxlength="120" value="${esc(t.beschriftung || '')}" ` +
                    `placeholder="z. B. Hauptschütz"></label>` +
                    (ZEITSPULEN.has(t.zeichen)
                        ? `<label>Verzögerung T in Sekunden<input id="sp-zeit" type="number" min="0" max="3600" step="0.1" ` +
                            `value="${Number.isFinite(t.werte?.T) ? Number(t.werte.T) : 3}"></label>` : '') +
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
                const beschriftung = o.querySelector('#sp-beschriftung').value.trim().slice(0, 120);
                const zeitFeld = o.querySelector('#sp-zeit');
                const sekunden = zeitFeld ? Number(zeitFeld.value) : 0;
                if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden < 0 || sekunden > 3600)) {
                    zeitFeld.setCustomValidity('0 bis 3600 Sekunden eingeben.');
                    zeitFeld.reportValidity();
                    return;
                }
                const nummern = {};
                o.querySelectorAll('[data-nr]').forEach(f => {
                    const vorgabe = f.dataset.nr || '';
                    const wert = f.value.trim();
                    if (wert && wert !== vorgabe)
                        nummern[vorgabe] = wert;
                });
                zu();
                aendere(() => {
                    t.bmk = bmk;
                    t.nummern = nummern;
                    if (beschriftung)
                        t.beschriftung = beschriftung;
                    else
                        delete t.beschriftung;
                    if (zeitFeld)
                        t.werte = { ...(t.werte || {}), T: sekunden };
                });
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
        const relaisLaden = () => {
            const w = window;
            if (w.RelaisWerkstatt && w.RelaisKern && w.RelaisVorlagen)
                return Promise.resolve();
            if (w.__relaisLaden)
                return w.__relaisLaden;
            const eins = (datei) => new Promise((ja, nein) => {
                const s = document.createElement('script');
                s.src = 'quell/bereiche/bloecke/arten/' + datei;
                s.addEventListener('load', () => ja());
                s.addEventListener('error', () => nein(new Error(datei + ' liess sich nicht laden.')));
                document.head.appendChild(s);
            });
            const v = eins('relais-kern.js').then(() => eins('relais-vorlagen.js'))
                .then(() => eins('relais-werkstatt.js'));
            w.__relaisLaden = v;
            v.catch(() => { w.__relaisLaden = null; });
            return v;
        };
        const relaisZeigen = () => {
            relaisPanel.hidden = !relaisOffen;
            if (!relaisOffen)
                return;
            if (relais) {
                relais.aktualisiere();
                return;
            }
            relaisPanel.innerHTML = '<p class="sp-bat-hinweis" role="status">Die Relais-Werkstatt wird geladen …</p>';
            relaisLaden().then(() => {
                if (relais || !wurzel.isConnected)
                    return;
                relais = window.RelaisWerkstatt.erstelle({
                    element: relaisPanel,
                    holePlan: () => z.plan,
                    aendere: (was) => aendere(was),
                    setzePlan: (plan) => {
                        z.plan = Schaltplan.lesen({ plan });
                        z.auswahl.clear();
                        z.simulation = false;
                        z.stellungen = {};
                        z.spulenStand = {};
                        z.ergebnis = null;
                        zeitAnhalten();
                    }
                });
            }).catch((err) => {
                relaisPanel.innerHTML = '<p class="sp-bat-hinweis" role="alert">' + esc(err.message) + '</p>';
            });
        };
        const simulationUmschalten = () => {
            if (!z.simulation && z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert) {
                relaisOffen = true;
                relaisZeigen();
                kopfMalen();
                UI.toast('Die Verdrahtung dieser alten Relais-Datei ist nicht geprüft. Prüfe die Leitungen und gib sie in der Relais-Werkstatt frei.');
                return;
            }
            if (!z.plan.batterieUebung && z.plan.teile.some((t) => t.zeichen === 'batterie')) {
                if (!batterie?.ausZeichnung())
                    return;
            }
            if (z.plan.batterieUebung) {
                batterieOffen = true;
                batteriePanel.hidden = false;
                if (batterie)
                    batterie.stromSetzen(!batterie.stromAn());
                kopfMalen();
                return;
            }
            if (!z.simulation)
                merkwahl = { werkzeug: z.werkzeug, zeichen: z.gewaehltesZeichen };
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
                if (merkwahl) {
                    z.werkzeug = merkwahl.werkzeug;
                    z.gewaehltesZeichen = merkwahl.zeichen;
                    merkwahl = null;
                }
            }
            zeitStarten();
            male();
            paletteMalen();
        };
        const artSetzen = (art) => {
            if (!Schaltplan.ARTEN.some(a => a.id === art) || art === z.plan.art)
                return;
            aendere(() => { z.plan.art = art; });
            paletteMalen();
        };
        kopf.addEventListener('change', e => {
            const s = e.target.closest('.sp-art');
            if (!s)
                return;
            artSetzen(s.value);
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
            if (b.dataset.a === 'palette-toggle') {
                paletteOffen = !paletteOffen;
                if (paletteOffen && studioOffen) {
                    studioOffen = false;
                    studioPanel.hidden = true;
                }
                wurzel.classList.toggle('sp-palette-offen', paletteOffen);
                palette.hidden = !paletteOffen;
                kopfMalen();
                return;
            }
            if (b.dataset.a === 'zoom-alles')
                return allesZeigen();
            if (b.dataset.a === 'bereiche')
                return bereicheMenue(b);
            if (b.dataset.a === 'plan-fokus') {
                planFokus = !planFokus;
                wurzel.classList.toggle('sp-plan-fokus', planFokus);
                geistEntfernen();
                kopfMalen();
                ansichtAnwenden();
                return;
            }
            if (b.dataset.a === 'elektro-studio') {
                studioOffen = !studioOffen;
                studioPanel.hidden = !studioOffen;
                if (studioOffen) {
                    paletteOffen = false;
                    palette.hidden = true;
                    wurzel.classList.remove('sp-palette-offen');
                    studioTab = 'eigenschaften';
                }
                kopfMalen();
                if (studioOffen)
                    studioMalen();
                return;
            }
            if (b.dataset.a === 'pruefzentrum') {
                pruefungOffen = !pruefungOffen;
                pruefPanel.hidden = !pruefungOffen;
                kopfMalen();
                if (pruefungOffen)
                    pruefMalen();
                return;
            }
            if (b.dataset.a === 'relais-werkstatt') {
                relaisOffen = !relaisOffen;
                relaisZeigen();
                kopfMalen();
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
            if (b.dataset.a === 'simulation') {
                const hadFocus = document.activeElement === b;
                simulationUmschalten();
                if (hadFocus)
                    kopf.querySelector('[data-a="simulation"]')?.focus();
                return;
            }
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
            if (b.dataset.a === 'zurueck-zeichnen') {
                simulationUmschalten();
                return;
            }
            if (b.dataset.a === 'ruhelage') {
                z.stellungen = {};
                z.spulenStand = {};
                zeitStarten();
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
            if (Date.now() < platzKlickBlockBis)
                return;
            const ziel = e.target;
            const schliessen = ziel.closest('[data-p-close]');
            if (schliessen) {
                paletteOffen = false;
                palette.hidden = true;
                wurzel.classList.remove('sp-palette-offen');
                kopfMalen();
                kopf.querySelector('[data-a="palette-toggle"]')?.focus({ preventScroll: true });
                return;
            }
            const kompakt = ziel.closest('[data-p-compact]');
            if (kompakt) {
                paletteKompakt = !paletteKompakt;
                palette.classList.toggle('sp-pal-kompakt', paletteKompakt);
                kompakt.setAttribute('aria-pressed', String(paletteKompakt));
                kompakt.textContent = paletteKompakt ? '▣ Groß' : '▤ Klein';
                kompakt.title = paletteKompakt ? 'Große Palette zeigen' : 'Kompakte Palette zeigen';
                return;
            }
            const filter = ziel.closest('[data-p-filter]');
            if (filter?.dataset.pFilter) {
                paletteGruppe = filter.dataset.pFilter;
                palette.querySelectorAll('[data-p-filter]').forEach(b => {
                    const aktiv = b.dataset.pFilter === paletteGruppe;
                    b.classList.toggle('an', aktiv);
                    b.setAttribute('aria-pressed', String(aktiv));
                });
                paletteTrefferMalen();
                palette.querySelector('.sp-liste')?.scrollTo({ top: 0 });
                return;
            }
            const favorit = ziel.closest('[data-p-fav]');
            if (favorit?.dataset.pFav) {
                favoritUmschalten(favorit.dataset.pFav);
                paletteTrefferMalen();
                return;
            }
            const b = ziel.closest('[data-sym]');
            if (!b || !b.dataset.sym)
                return;
            if (e.altKey) {
                favoritUmschalten(b.dataset.sym);
                paletteTrefferMalen();
                return;
            }
            z.gewaehltesZeichen = z.gewaehltesZeichen === b.dataset.sym ? '' : b.dataset.sym;
            if (z.gewaehltesZeichen) {
                studioLetzte = studioHelfer()?.merkeLetzte(studioLetzte, z.gewaehltesZeichen) || studioLetzte;
                if (typeof Store !== 'undefined')
                    Store.setMeta('redion:elektro:letzte:v1', studioLetzte);
            }
            palette.querySelectorAll('.sp-sym').forEach(x => {
                const an = x.dataset.sym === z.gewaehltesZeichen;
                x.classList.toggle('an', an);
                x.setAttribute('aria-pressed', String(an));
                x.closest('.sp-zeichenkarte')?.classList.toggle('ist-gewaehlt', an);
            });
            paletteInfokarte();
            fussMalen();
            if (studioOffen)
                studioMalen();
        });
        palette.addEventListener('input', e => {
            const f = e.target;
            if (!f.matches('.sp-suche input[type="search"]'))
                return;
            paletteSuche = f.value;
            paletteTrefferMalen();
        });
        palette.addEventListener('pointerover', e => {
            const b = e.target.closest('[data-sym]');
            if (b?.dataset.sym)
                paletteInfokarte(b.dataset.sym);
        });
        palette.addEventListener('focusin', e => {
            const b = e.target.closest('[data-sym]');
            if (b?.dataset.sym)
                paletteInfokarte(b.dataset.sym);
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
            const inFeld = e.target.matches('input,textarea,select,[contenteditable], [contenteditable] *');
            if (inFeld)
                return;
            if (e.key === 'Escape' && z.zieht)
                return;
            if (!e.ctrlKey && !e.metaKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                studioOffen = !studioOffen;
                studioPanel.hidden = !studioOffen;
                if (studioOffen) {
                    paletteOffen = false;
                    palette.hidden = true;
                    wurzel.classList.remove('sp-palette-offen');
                    studioTab = 'eigenschaften';
                }
                kopfMalen();
                if (studioOffen)
                    studioMalen();
                return;
            }
            if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (!z.leertaste) {
                    z.leertaste = true;
                    buehne.classList.add('sp-greifen');
                }
                return;
            }
            if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && e.key === '/' && !studioOffen) {
                e.preventDefault();
                if (!paletteOffen) {
                    paletteOffen = true;
                    palette.hidden = false;
                    wurzel.classList.add('sp-palette-offen');
                    kopfMalen();
                }
                palette.querySelector('.sp-suche input')?.focus();
                return;
            }
            if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && e.key === '/' && studioOffen) {
                e.preventDefault();
                studioTab = 'einsetzen';
                studioMalen();
                studioPanel.querySelector('[data-st-suche]')?.focus();
                return;
            }
            if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && /^[1-5]$/.test(e.key)) {
                e.preventDefault();
                z.werkzeug = { '1': 'zeigen', '2': 'leitung', '3': 'text', '4': 'schiene', '5': 'radieren' }[e.key];
                z.gewaehltesZeichen = '';
                z.auswahl.clear();
                paletteMalen(palette.querySelector('input')?.value || '');
                male();
                return;
            }
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                if (e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    simulationUmschalten();
                    return;
                }
                if (e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    if (z.simulation) {
                        simulationUmschalten();
                        return;
                    }
                    if (!paletteOffen) {
                        paletteOffen = true;
                        palette.hidden = false;
                        wurzel.classList.add('sp-palette-offen');
                        kopfMalen();
                    }
                    else {
                        paletteOffen = false;
                        palette.hidden = true;
                        wurzel.classList.remove('sp-palette-offen');
                        kopfMalen();
                    }
                    return;
                }
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
            if (!e.ctrlKey && !e.metaKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                pruefungOffen = !pruefungOffen;
                pruefPanel.hidden = !pruefungOffen;
                kopfMalen();
                if (pruefungOffen)
                    pruefMalen();
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
        const bereicheMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const m = UI.menu(`<button data-bereich="palette">${paletteOffen ? '✓ ' : ''}Bauteile &amp; Suche</button>` +
                `<button data-bereich="studio">${studioOffen ? '✓ ' : ''}Eigenschaften &amp; Studio</button>` +
                `<hr>` +
                `<button data-bereich="relais">${relaisOffen ? '✓ ' : ''}Relais &amp; alte .sch-Schaltungen</button>` +
                `<button data-bereich="batterien">${batterieOffen ? '✓ ' : ''}Batterielabor</button>` +
                `<button data-bereich="pruefung">${pruefungOffen ? '✓ ' : ''}Prüfzentrum &amp; Netzliste</button>` +
                `<button data-bereich="heft">${heftOffen() ? '✓ ' : ''}Formelheft</button>` +
                `<hr>` +
                `<button data-bereich="fokus">${planFokus ? '✓ ' : ''}Nur die Zeichenfläche</button>` +
                `<button data-bereich="voll">Grossansicht (F)</button>`, Math.max(8, r.left - 120), r.bottom + 8);
            m.addEventListener('click', e => {
                const b = e.target.closest('[data-bereich]');
                if (!b)
                    return;
                m.remove();
                const was = b.dataset.bereich;
                if (was === 'palette')
                    return kopf.querySelector('[data-a="palette-toggle"]')?.click();
                if (was === 'studio')
                    return (() => {
                        studioOffen = !studioOffen;
                        studioPanel.hidden = !studioOffen;
                        if (studioOffen) {
                            paletteOffen = false;
                            palette.hidden = true;
                            wurzel.classList.remove('sp-palette-offen');
                            studioTab = 'eigenschaften';
                            studioMalen();
                        }
                        kopfMalen();
                    })();
                if (was === 'fokus') {
                    planFokus = !planFokus;
                    wurzel.classList.toggle('sp-plan-fokus', planFokus);
                    kopfMalen();
                    ansichtAnwenden();
                    return;
                }
                if (was === 'voll')
                    return vollAn();
                if (was === 'heft')
                    return heftUmschalten();
                if (was === 'relais') {
                    relaisOffen = !relaisOffen;
                    if (relaisOffen) {
                        pruefungOffen = false;
                        batterieOffen = false;
                    }
                }
                else if (was === 'batterien') {
                    batterieOffen = !batterieOffen;
                    if (batterieOffen) {
                        pruefungOffen = false;
                        relaisOffen = false;
                    }
                }
                else if (was === 'pruefung') {
                    pruefungOffen = !pruefungOffen;
                    if (pruefungOffen) {
                        relaisOffen = false;
                        batterieOffen = false;
                    }
                }
                relaisZeigen();
                batteriePanel.hidden = !batterieOffen;
                pruefPanel.hidden = !pruefungOffen;
                if (batterieOffen)
                    batterie?.aktualisiere();
                if (pruefungOffen)
                    pruefMalen();
                kopfMalen();
            });
        };
        const mehrMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const m = UI.menu(`<div class="grp">Planart</div>` +
                Schaltplan.ARTEN.map(a => `<button data-m="art" data-art="${esc(a.id)}" role="menuitemradio" aria-checked="${a.id === z.plan.art}">` +
                    `${a.id === z.plan.art ? '✓ ' : ''}${esc(a.name)}</button>`).join('') +
                '<hr>' +
                (z.plan.art.startsWith('stromlauf')
                    ? '<button data-m="schaltung">⚡ Netz oder Beispielschaltung einfügen</button><hr>' : '') +
                (z.verlauf.kannVor() ? '<button data-m="vor">↷ Wiederholen</button>' : '') +
                '<button data-m="blatt">Ganzes Blatt zeigen</button>' +
                `<button data-m="raster">${z.zeigeRaster ? '✓ ' : ''}Raster zeigen</button>` +
                `<button data-m="anschluesse">${z.zeigeAnschluesse ? '✓ ' : ''}Anschlusspunkte zeigen</button>` +
                `<button data-m="nummern">${z.zeigeNummern ? '✓ ' : ''}Anschlussnummern zeigen</button>` +
                '<hr>' +
                '<button data-m="schienen">Stromschienen einzeichnen</button>' +
                '<button data-m="nummerieren">Alle neu durchnummerieren</button>' +
                '<button data-m="plandrehen">Ganzen Plan drehen (90°)</button>' +
                '<hr>' +
                '<button data-m="pruefzentrum">Prüfzentrum / Stückliste (Alt+Umschalt+P)</button>' +
                '<button data-m="vorlage">Als Vorlage speichern</button>' +
                '<button data-m="svg">Als Bild speichern (SVG)</button>' +
                '<button data-m="leeren" data-gefahr>Plan leeren</button>', r.left - 180, r.bottom + 6);
            m.addEventListener('click', e => {
                const b = e.target.closest('[data-m]');
                if (!b)
                    return;
                m.remove();
                const was = b.dataset.m;
                if (was === 'art')
                    return artSetzen(b.dataset.art || '');
                if (was === 'vor')
                    return vorwaerts();
                if (was === 'blatt')
                    return gleitend(() => { z.ansicht = { zoom: 1, x: 0, y: 0 }; ansichtVomNutzer = true; ansichtAnwenden(); });
                if (was === 'schaltung')
                    return schaltungMenue(anker);
                if (was === 'pruefzentrum') {
                    pruefungOffen = true;
                    pruefPanel.hidden = false;
                    kopfMalen();
                    pruefMalen();
                    return;
                }
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
            nachStromwechsel: () => kopfMalen(),
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
        palette.hidden = !paletteOffen;
        paletteMalen();
        male();
        if (relaisOffen)
            relaisZeigen();
        return wurzel;
    };
    return { zeichne, paletteHtml, favoriten, favoritUmschalten, ortAus };
})();
window.Planflaeche = Planflaeche;
