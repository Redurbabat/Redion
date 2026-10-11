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
        const r = svg.getBoundingClientRect();
        const sx = plan.breite / (r.width || 1);
        const sy = plan.hoehe / (r.height || 1);
        const x = (e.clientX - r.left) * sx;
        const y = (e.clientY - r.top) * sy;
        return ohneRaster ? { x, y } : { x: Schaltplan.rasten(x), y: Schaltplan.rasten(y) };
    };
    const zeichne = (block) => {
        const wurzel = document.createElement('div');
        wurzel.className = 'sp-wrap';
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
            simulation: false,
            stellungen: {},
            spulenStand: {},
            ergebnis: null
        };
        const abzug = () => JSON.stringify(z.plan);
        const aendere = (was, merken = true) => {
            const vorher = merken ? abzug() : '';
            was();
            if (typeof Store !== 'undefined' && block && block.id)
                Store.updateBlock(block.id, { plan: z.plan });
            else if (block)
                block.plan = z.plan;
            if (merken)
                z.verlauf.merken(vorher);
            male();
        };
        const zurueck = () => {
            const vorher = z.verlauf.zurueck(abzug());
            if (vorher === null)
                return;
            z.plan = JSON.parse(vorher);
            aendere(() => { }, false);
        };
        const vorwaerts = () => {
            const naechster = z.verlauf.vor(abzug());
            if (naechster === null)
                return;
            z.plan = JSON.parse(naechster);
            aendere(() => { }, false);
        };
        const kopf = document.createElement('div');
        kopf.className = 'sp-kopf';
        const palette = document.createElement('div');
        palette.className = 'sp-palette';
        const buehne = document.createElement('div');
        buehne.className = 'sp-buehne';
        const fuss = document.createElement('div');
        fuss.className = 'sp-fuss';
        const koerper = document.createElement('div');
        koerper.className = 'sp-koerper';
        koerper.appendChild(palette);
        koerper.appendChild(buehne);
        wurzel.appendChild(kopf);
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
                        ['radieren', '⌫', 'Löschen']].map(([id, ic, t]) => `<button class="sp-wz${z.werkzeug === id ? ' an' : ''}" data-wz="${id}" ` +
                        `title="${esc(t)}" aria-label="${esc(t)}">${ic}</button>`).join('') +
                    `</span>` +
                    `<span class="sp-rechts">` +
                    (z.plan.art.startsWith('stromlauf')
                        ? `<button class="sp-netz" data-a="netz" ` +
                            `title="Netz (L1 und N mit Quelle) oder eine fertige Beispielschaltung einfügen — bereit zum Simulieren" ` +
                            `aria-label="Netz oder Beispielschaltung einfügen">⚡ Schaltung</button>`
                        : '') +
                    `<button class="sp-start${z.simulation ? ' an' : ''}" data-a="simulation" ` +
                    `title="${z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}" ` +
                    `aria-pressed="${z.simulation}" ` +
                    `aria-label="${z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}">` +
                    `${z.simulation ? '◼' : '▶'} Strom</button>` +
                    `<button class="sp-heft${heftOffen() ? ' an' : ''}" data-a="heft" ` +
                    `title="Formelheft — beim Zeichnen nachschlagen und rechnen" ` +
                    `aria-pressed="${heftOffen()}" aria-label="Formelheft">📐</button>` +
                    `<button data-a="zurueck" title="Rückgängig" aria-label="Rückgängig"${z.verlauf.kannZurueck() ? '' : ' disabled'}>↶</button>` +
                    `<button data-a="vorwaerts" title="Wiederholen" aria-label="Wiederholen"${z.verlauf.kannVor() ? '' : ' disabled'}>↷</button>` +
                    `<button data-a="mehr" title="Mehr" aria-label="Mehr">…</button></span>`;
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
                fuss.innerHTML =
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
            fuss.innerHTML =
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
            buehne.innerHTML = Schaltplan.alsSvg(z.plan, opt);
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
        const male = () => { rechnen(); kopfMalen(); buehneMalen(); fussMalen(); };
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
            if (beispiel)
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
            return raus;
        };
        const teilVon = (id) => z.plan.teile.find(t => t.id === id);
        const melde = (bericht) => {
            if (!bericht || !bericht.some(b => b.stufe >= 2) || typeof UI === 'undefined')
                return;
            UI.toast('Eine Leitung liess sich nicht so nachziehen, dass sie genau dasselbe berührt wie vorher — bitte die Verbindungen prüfen.');
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
            return Schaltplan.nachziehen(z.plan, vorher, teile, { ohne: eigene });
        };
        const drehen = () => aendere(() => {
            const vorher = Schaltplan.vorherMerken(z.plan);
            const teile = auswahlTeile();
            teile.forEach(t => { t.drehung = ((t.drehung || 0) + 90) % 360; });
            if (teile.length)
                melde(Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true }));
        });
        const spiegeln = () => aendere(() => {
            const vorher = Schaltplan.vorherMerken(z.plan);
            const teile = auswahlTeile();
            teile.forEach(t => { t.gespiegelt = !t.gespiegelt; });
            if (teile.length)
                melde(Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true }));
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
        buehne.addEventListener('pointerdown', e => {
            const svg = buehne.querySelector('svg');
            if (!svg)
                return;
            const ziel = e.target;
            const roh = ortAus(svg, e, z.plan, true);
            const p = ortAus(svg, e, z.plan);
            if (z.simulation) {
                const g = teilAm(ziel);
                if (g && g.dataset.id)
                    schalte(g.dataset.id);
                return;
            }
            if (z.werkzeug === 'radieren') {
                const g = teilAm(ziel);
                if (g && g.dataset.id) {
                    z.auswahl = new Set([g.dataset.id]);
                    loeschen();
                }
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
            if (z.werkzeug === 'leitung') {
                const fang = Schaltplan.fangeAnschluss(z.plan, roh);
                z.zieht = { art: 'leitung', startX: p.x, startY: p.y, ausgang: new Map(),
                    von: fang ? { x: fang.x, y: fang.y, teil: fang.teil, nr: fang.nr }
                        : { x: p.x, y: p.y } };
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
                z.zieht = { art: 'rahmen', startX: p.x, startY: p.y, ausgang: new Map() };
                svg.setPointerCapture(e.pointerId);
                male();
                return;
            }
            const id = g.dataset.id;
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
            z.zieht = { art: 'teil', startX: p.x, startY: p.y, ausgang, vorher: Schaltplan.vorherMerken(z.plan) };
            svg.setPointerCapture(e.pointerId);
            male();
        });
        buehne.addEventListener('pointermove', e => {
            if (!z.zieht)
                return;
            const svg = buehne.querySelector('svg');
            if (!svg)
                return;
            const p = ortAus(svg, e, z.plan);
            if (z.zieht.art === 'teil') {
                const dx = p.x - z.zieht.startX, dy = p.y - z.zieht.startY;
                z.zieht.ausgang.forEach((a, id) => {
                    const t = teilVon(id);
                    if (t) {
                        t.x = Schaltplan.rasten(a.x + dx);
                        t.y = Schaltplan.rasten(a.y + dy);
                    }
                });
                const gewandert = [...z.zieht.ausgang].some(([id, a]) => {
                    const t = teilVon(id);
                    return t && (t.x !== a.x || t.y !== a.y);
                });
                const vorher = z.zieht.vorher ?? (z.zieht.vorher = Schaltplan.vorherMerken(z.plan));
                z.zieht.bericht = Schaltplan.nachziehen(z.plan, vorher, gewandert ? [...z.zieht.ausgang.keys()] : [], { heilen: gewandert, vonVorn: true });
                buehneMalen();
                return;
            }
            buehneMalen();
            const svg2 = buehne.querySelector('svg');
            if (!svg2)
                return;
            if (z.zieht.art === 'leitung' && z.zieht.von) {
                const punkte = Schaltplan.rechtwinklig(z.zieht.von, p);
                const d = punkte.map((q, i) => (i ? 'L' : 'M') + q.x + ',' + q.y).join(' ');
                svg2.insertAdjacentHTML('beforeend', `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" ` +
                    `stroke-dasharray="4 3" opacity=".7"/>`);
                const fang = Schaltplan.fangeAnschluss(z.plan, p);
                if (fang)
                    svg2.insertAdjacentHTML('beforeend', `<circle cx="${fang.x}" cy="${fang.y}" r="7" fill="none" ` +
                        `stroke="currentColor" stroke-width="2" opacity=".8"/>`);
            }
            if (z.zieht.art === 'rahmen') {
                const x = Math.min(z.zieht.startX, p.x), y = Math.min(z.zieht.startY, p.y);
                svg2.insertAdjacentHTML('beforeend', `<rect x="${x}" y="${y}" width="${Math.abs(p.x - z.zieht.startX)}" ` +
                    `height="${Math.abs(p.y - z.zieht.startY)}" fill="currentColor" ` +
                    `fill-opacity=".07" stroke="currentColor" stroke-dasharray="4 3"/>`);
            }
        });
        const zugEnde = (e) => {
            if (!z.zieht)
                return;
            const svg = buehne.querySelector('svg');
            const p = svg ? ortAus(svg, e, z.plan) : { x: 0, y: 0 };
            const zug = z.zieht;
            z.zieht = null;
            if (zug.art === 'teil') {
                const bewegt = zug.ausgang.size &&
                    [...zug.ausgang].some(([id, a]) => {
                        const t = teilVon(id);
                        return t && (t.x !== a.x || t.y !== a.y);
                    });
                if (bewegt) {
                    aendere(() => { });
                    melde(zug.bericht);
                }
                else
                    male();
                return;
            }
            if (zug.art === 'rahmen') {
                inRahmen({ x: zug.startX, y: zug.startY }, p).forEach(id => z.auswahl.add(id));
                male();
                return;
            }
            if (zug.art === 'leitung' && zug.von) {
                const fang = Schaltplan.fangeAnschluss(z.plan, p);
                const bis = fang ? { x: fang.x, y: fang.y } : p;
                if (bis.x === zug.von.x && bis.y === zug.von.y) {
                    male();
                    return;
                }
                aendere(() => z.plan.leitungen.push({
                    id: Schaltplan.uid(),
                    punkte: Schaltplan.rechtwinklig({ x: zug.von.x, y: zug.von.y }, bis),
                    ebene: aktiveEbene(),
                    vonTeil: zug.von.teil, vonNr: zug.von.nr,
                    nachTeil: fang ? fang.teil : undefined, nachNr: fang ? fang.nr : undefined
                }));
            }
        };
        buehne.addEventListener('pointerup', zugEnde);
        buehne.addEventListener('pointercancel', zugEnde);
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
        });
        fuss.addEventListener('click', e => {
            const b = e.target.closest('[data-ebene],[data-a]');
            if (!b)
                return;
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
        wurzel.addEventListener('keydown', e => {
            const inFeld = e.target.tagName === 'INPUT';
            if (inFeld)
                return;
            const schritt = e.shiftKey ? Register.fachzeichen.RASTER * 5 : Register.fachzeichen.RASTER;
            const pfeile = {
                ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0],
                ArrowUp: [0, -schritt], ArrowDown: [0, schritt]
            };
            if (pfeile[e.key] && z.auswahl.size) {
                e.preventDefault();
                const [dx, dy] = pfeile[e.key];
                let bericht;
                aendere(() => { bericht = verschiebe(dx, dy); });
                melde(bericht);
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
                    ...z.plan.leitungen.map(l => l.id)]);
                male();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                return e.shiftKey ? vorwaerts() : zurueck();
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
            const svg = Schaltplan.alsSvg(z.plan, { raster: false, anschluesse: false });
            const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>' +
                    svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')], { type: 'image/svg+xml' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (Schaltplan.artVon(z.plan.art).name || 'Schaltplan') + '.svg';
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        };
        paletteMalen();
        male();
        return wurzel;
    };
    return { zeichne, paletteHtml, favoriten, favoritUmschalten, ortAus };
})();
window.Planflaeche = Planflaeche;
