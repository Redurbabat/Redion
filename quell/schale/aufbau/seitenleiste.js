"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/seitenleiste.ts (npm run bauen:ts). */
const Seitenleiste = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let gebunden = {};
    const braucht = (name) => (...args) => {
        const fn = gebunden[name];
        if (typeof fn !== 'function') {
            throw new Error('Die Seitenleiste wurde ohne „' + name + '" gebunden. ' +
                'Seitenleiste.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
        }
        return fn(...args);
    };
    const binde = (teile) => { gebunden = Object.assign({}, gebunden, teile || {}); };
    const oeffne = braucht('oeffne');
    const aktuelleSeite = braucht('aktuelleSeite');
    const kuerzlich = braucht('kuerzlich');
    const kommendeTermine = braucht('kommendeTermine');
    const seitenMenue = braucht('seitenMenue');
    const suche = braucht('suche');
    const ABSCHNITTE = [
        ['werkzeuge', 'Werkzeuge'],
        ['agenten', 'Agenten'],
        ['bespr', 'Besprechungen'],
        ['kuerzlich', 'Kürzlich verwendet'],
        ['favoriten', 'Favoriten'],
        ['bereiche', 'Bereiche'],
        ['privat', 'Privat'],
        ['apps', 'Meine Apps']
    ];
    const APP_GRUPPEN = [
        ['planen', 'Planen', 'calendar'],
        ['daten', 'Daten', 'database'],
        ['einrichten', 'Einrichten', 'settings'],
        ['hilfe', 'Hilfe & Pflege', 'help']
    ];
    const VORGABE_AUS = ['werkzeuge', 'agenten', 'bespr', 'kuerzlich'];
    const VORGABE_AN = (id) => !VORGABE_AUS.includes(id);
    const abschnittAn = (id, vorgabe = true) => {
        const aus = Store.getMeta('sidebarAus', []) || [];
        if (aus.includes(id))
            return false;
        if (vorgabe)
            return true;
        return (Store.getMeta('sidebarAn', []) || []).includes(id);
    };
    const abschnitteGeordnet = () => {
        const folge = Store.getMeta('sidebarFolge', null);
        if (!Array.isArray(folge) || !folge.length)
            return ABSCHNITTE;
        const nach = [];
        folge.forEach(id => { const a = ABSCHNITTE.find(x => x[0] === id); if (a)
            nach.push(a); });
        ABSCHNITTE.forEach(a => { if (!nach.includes(a))
            nach.push(a); });
        return nach;
    };
    const abschnittSchieben = (id, richtung) => {
        const folge = abschnitteGeordnet().map(x => x[0]);
        const i = folge.indexOf(id);
        const j = i + richtung;
        if (i < 0 || j < 0 || j >= folge.length)
            return;
        [folge[i], folge[j]] = [folge[j], folge[i]];
        Store.setMeta('sidebarFolge', folge);
        zeichneBaum();
    };
    const abschnittSchalten = (id) => {
        const aus = Store.getMeta('sidebarAus', []) || [];
        const an = Store.getMeta('sidebarAn', []) || [];
        if (abschnittAn(id, VORGABE_AN(id))) {
            Store.setMeta('sidebarAn', an.filter(x => x !== id));
            if (!aus.includes(id))
                Store.setMeta('sidebarAus', [...aus, id]);
        }
        else {
            Store.setMeta('sidebarAus', aus.filter(x => x !== id));
            if (!an.includes(id))
                Store.setMeta('sidebarAn', [...an, id]);
        }
        zeichneBaum();
    };
    let anpassModus = false;
    const abschnitteAnpassen = () => {
        anpassModus = !anpassModus;
        zeichneBaum();
    };
    const tabNamen = () => Store.getMeta('tabNamen', true) !== false;
    const zeichneReiter = () => {
        const leiste = document.getElementById('side-reiter');
        if (!leiste)
            return;
        leiste.classList.toggle('ohne-namen', !tabNamen());
        const baumReiter = (reiter === 'chat' || reiter === 'bespr') ? reiter : 'start';
        leiste.querySelectorAll('.sr').forEach(b => {
            const hier = b.dataset.reiter === baumReiter;
            b.classList.toggle('on', hier);
            if (hier)
                b.setAttribute('aria-current', 'page');
            else
                b.removeAttribute('aria-current');
        });
        if (typeof handyLeiste === 'function')
            handyLeiste();
    };
    let reiter = 'start';
    let pilleGesetzt = false;
    const pilleSchieben = (l, aktiv) => {
        const pille = l.querySelector('#ho-pille');
        if (!pille)
            return;
        if (typeof Linse !== 'undefined')
            Linse.sicherstellen();
        if (typeof SelectionFlow !== 'undefined' && !l.dataset['ziehbar']) {
            SelectionFlow.ziehbar({
                reihe: l, flaeche: pille, hub: 1.1,
                optionen: () => Array.from(l.querySelectorAll(':scope > button[role="tab"]')),
                gewaehlt: () => l.querySelector(':scope > button[aria-selected="true"]'),
                zeichen: k => k.querySelector('.ho-z'),
                waehle: k => k.click(),
                zurueck: (k, f) => {
                    if (k)
                        SelectionFlow.folge(f, k.offsetLeft, true, false);
                    else
                        handyLeiste();
                }
            });
        }
        if (!aktiv) {
            pille.style.opacity = '0';
            return;
        }
        const x = aktiv.offsetLeft;
        const b = aktiv.offsetWidth;
        const y = aktiv.offsetTop;
        if (!b)
            return;
        if (!pilleGesetzt)
            pille.classList.add('stumm');
        const vorher = Number(pille.dataset['x'] ?? NaN);
        const wegJetzt = Number.isFinite(vorher) ? Math.abs(x - vorher) : 0;
        pille.dataset['x'] = String(x);
        const nachbar = wegJetzt > 1 && wegJetzt / Math.max(1, b) <= 1.35;
        pille.style.width = b + 'px';
        pille.style.top = y + 'px';
        pille.style.opacity = '1';
        if (typeof SelectionFlow === 'undefined') {
            pille.style.transform = `translateX(${x}px)`;
        }
        else {
            SelectionFlow.folge(pille, x, nachbar, !pilleGesetzt || pille.classList.contains('stumm'));
        }
        if (!pilleGesetzt) {
            pilleGesetzt = true;
            requestAnimationFrame(() => requestAnimationFrame(() => pille.classList.remove('stumm')));
        }
        const links = x - l.scrollLeft;
        if (links < 0 || links + b > l.clientWidth) {
            const ruhig = AppEinstellung.wenigBewegung();
            l.scrollTo({ left: Math.max(0, x - 16), behavior: ruhig ? 'auto' : 'smooth' });
        }
    };
    let schauplatzJetzt = 'leer';
    try {
        addEventListener('redion:schauplatz', (e) => {
            schauplatzJetzt = String(e?.detail || 'leer');
            handyLeiste();
        });
    }
    catch { }
    const ORT_ZU_KNOPF = {
        heute: 'hl-start', lernen: 'hl-lernen',
        bibliothek: 'hl-dok', notizhefte: 'hl-dok',
        kalender: 'hl-bespr', mehr: 'hl-mehr'
    };
    const ORTE_OHNE_KNOPF = ['posteingang', 'kompass', 'workspace',
        'aufgaben', 'papierkorb', 'elektro'];
    const handyLeiste = (vorauf) => {
        const l = document.getElementById('handy-oben');
        if (!l)
            return;
        const karte = {
            dokumente: 'hl-dok', bibliothek: 'hl-dok',
            start: 'hl-start', lernen: 'hl-lernen',
            bespr: 'hl-bespr', mehr: 'hl-mehr'
        };
        l.querySelectorAll('button[role="tab"]').forEach(b => {
            b.classList.remove('an');
            b.setAttribute('aria-selected', 'false');
        });
        const id = vorauf
            ?? ORT_ZU_KNOPF[schauplatzJetzt]
            ?? (ORTE_OHNE_KNOPF.includes(schauplatzJetzt) ? undefined : karte[reiter]);
        const aktiv = id ? document.getElementById(id) : null;
        if (aktiv) {
            aktiv.classList.add('an');
            aktiv.setAttribute('aria-selected', 'true');
        }
        pilleSchieben(l, aktiv);
        l.querySelectorAll('.hl-punkt').forEach(pt => {
            pt.setAttribute('aria-hidden', 'true');
            const knopf = pt.closest('button');
            let offen = 0;
            try {
                offen = (Werkzeuge.meldungen ? Werkzeuge.meldungen() : [])
                    .filter((m) => !m.gelesen).length;
            }
            catch { }
            pt.hidden = !offen;
            if (!knopf)
                return;
            const name = knopf.getAttribute('title') || '';
            if (offen)
                knopf.setAttribute('aria-label', `${name}, ${offen} ungelesen`);
            else
                knopf.removeAttribute('aria-label');
        });
    };
    const reiterWechseln = (id) => {
        reiter = id;
        zeichneReiter();
        if (id === 'suche') {
            suche();
            reiter = 'start';
            zeichneReiter();
            return;
        }
        if (id === 'inbox') {
            Ansichten.posteingang();
            reiter = 'start';
            zeichneReiter();
            zeichneBaum();
            return;
        }
        zeichneBaum();
    };
    const zeichneBaum = () => {
        const baum = document.getElementById('tree');
        if (!baum)
            return;
        const altAufraeumen = baum.__seitenFensterAufraeumen;
        if (typeof altAufraeumen === 'function')
            altAufraeumen();
        baum.innerHTML = '';
        zeichneReiter();
        if (reiter === 'chat') {
            KI.seitenleiste(baum);
            return;
        }
        if (reiter === 'bespr') {
            Meeting.seitenleiste(baum);
            return;
        }
        if (anpassModus) {
            const kopf = document.createElement('div');
            kopf.className = 'side-section';
            kopf.innerHTML = '<span>Abschnitte anpassen</span>';
            baum.appendChild(kopf);
            const geordnet = abschnitteGeordnet();
            geordnet.forEach(([id, name], nr) => {
                const z = document.createElement('button');
                z.className = 'side-item anpass' + (abschnittAn(id) ? '' : ' aus');
                z.innerHTML = `<span>${abschnittAn(id) ? '👁' : '🚫'}</span><span>${name}</span>` +
                    '<span class="anpass-pfeile">' +
                    (nr > 0 ? '<i data-hoch="1" title="nach oben">⌃</i>' : '') +
                    (nr < geordnet.length - 1 ? '<i data-runter="1" title="nach unten">⌄</i>' : '') +
                    '</span>';
                z.addEventListener('click', (ev) => {
                    const ziel = elVon(ev);
                    if (ziel?.closest('[data-hoch]')) {
                        ev.stopPropagation();
                        abschnittSchieben(id, -1);
                        return;
                    }
                    if (ziel?.closest('[data-runter]')) {
                        ev.stopPropagation();
                        abschnittSchieben(id, 1);
                        return;
                    }
                    abschnittSchalten(id);
                });
                baum.appendChild(z);
            });
            const zurueck = document.createElement('button');
            zurueck.className = 'side-item anpass';
            zurueck.innerHTML = '<span>↺</span><span>Reihenfolge zurücksetzen</span>';
            zurueck.addEventListener('click', () => {
                Store.setMeta('sidebarFolge', null);
                zeichneBaum();
                UI.toast('Reihenfolge zurückgesetzt');
            });
            baum.appendChild(zurueck);
            const nam = document.createElement('button');
            nam.className = 'side-item anpass';
            nam.innerHTML = `<span>🏷</span><span>Tab-Namen ${tabNamen() ? 'ausblenden' : 'einblenden'}</span>`;
            nam.addEventListener('click', () => {
                Store.setMeta('tabNamen', !tabNamen());
                zeichneBaum();
            });
            baum.appendChild(nam);
            const fertig = document.createElement('button');
            fertig.className = 'anpass-fertig';
            fertig.textContent = 'Erledigt';
            fertig.addEventListener('click', () => { anpassModus = false; zeichneBaum(); });
            baum.appendChild(fertig);
            return;
        }
        if (abschnittAn('werkzeuge', VORGABE_AN('werkzeuge'))) {
            const wz = document.createElement('div');
            wz.className = 'wz-block';
            wz.dataset['abschnitt'] = 'werkzeuge';
            const eintraege = (Register?.menueband?.inReiter?.('werkzeuge') || [])
                .flatMap((g) => g.eintraege || []);
            eintraege.forEach((e) => {
                const b = document.createElement('button');
                b.className = 'side-item';
                b.dataset['band'] = String(e.id);
                b.title = String(e.hinweis || e.name || '') + (e.kurz ? '  (' + e.kurz + ')' : '');
                const zeichen = document.createElement('span');
                zeichen.dataset['sym'] = String(e.zeichen || 'dots');
                const name = document.createElement('span');
                name.textContent = String(e.name || '');
                b.append(zeichen, name);
                if (e.id === 'w-lernen') {
                    const k = document.createElement('span');
                    k.className = 'k';
                    k.id = 'lz';
                    b.appendChild(k);
                }
                wz.appendChild(b);
            });
            wz.addEventListener('click', e => {
                const b = elVon(e)?.closest('[data-band]');
                if (!b)
                    return;
                const eintrag = Register?.menueband?.eines?.(b.dataset['band'] || '');
                if (eintrag)
                    eintrag.tun();
            });
            baum.appendChild(abschnitt('Werkzeuge'));
            baum.appendChild(wz);
            const faellig = Werkzeuge.faellig().length;
            const lz = wz.querySelector('#lz');
            if (lz && faellig)
                lz.textContent = String(faellig);
        }
        if (abschnittAn('agenten', VORGABE_AN('agenten'))) {
            const agenten = Agent.eigene();
            baum.appendChild(abschnitt('Agenten', () => Agent.eigenerDialog()));
            const ag = document.createElement('div');
            ag.className = 'wz-block';
            ag.innerHTML = agenten.slice(0, 6).map((a) => `<button class="side-item" data-agent="${esc(a.id)}"><span>${a.icon || '🤖'}</span>` +
                `<span>${esc(a.name)}</span></button>`).join('') +
                '<button class="side-item" data-agent="+"><span>＋</span><span>Neuer Agent</span></button>';
            ag.addEventListener('click', e => {
                const b = elVon(e)?.closest('[data-agent]');
                if (!b)
                    return;
                if (b.dataset.agent === '+')
                    Agent.eigenerDialog();
                else
                    Agent.panel('');
            });
            baum.appendChild(ag);
        }
        if (abschnittAn('bespr', VORGABE_AN('bespr'))) {
            const bes = document.createElement('div');
            bes.className = 'wz-block';
            const naechste = kommendeTermine(3);
            bes.innerHTML =
                (naechste.length
                    ? naechste.map((t) => `<button class="side-item" data-termin="${t.id}">` +
                        `<span>📌</span><span>${esc(t.text)}</span>` +
                        `<span class="k">${esc(t.wann)}</span></button>`).join('')
                    : '<div class="side-leer">Keine bevorstehenden Ereignisse</div>') +
                    '<button class="side-item" data-bes="neu"><span>🎙</span><span>Neue Besprechungsnotiz</span></button>';
            bes.addEventListener('click', e => {
                const t = elVon(e)?.closest('[data-termin]');
                if (t) {
                    oeffne(t.dataset.termin);
                    return;
                }
                if (elVon(e)?.closest('[data-bes="neu"]'))
                    Meeting.panel();
            });
            baum.appendChild(abschnitt('Besprechungen'));
            baum.appendChild(bes);
        }
        const letzte = abschnittAn('kuerzlich', VORGABE_AN('kuerzlich')) ? kuerzlich() : [];
        if (letzte.length) {
            baum.appendChild(abschnitt('Kürzlich verwendet'));
            const kv = document.createElement('div');
            kv.className = 'wz-block';
            kv.innerHTML = letzte.map((p2) => `<button class="side-item" data-kv="${p2.id}"><span>${p2.icon || '📄'}</span>` +
                `<span>${esc(p2.text || 'Ohne Titel')}</span></button>`).join('');
            kv.addEventListener('click', e => {
                const b = elVon(e)?.closest('[data-kv]');
                if (b)
                    oeffne(b.dataset.kv);
            });
            baum.appendChild(kv);
        }
        const favs = abschnittAn('favoriten') ? Store.favorites() : [];
        if (favs.length) {
            baum.appendChild(abschnitt('Favoriten'));
            favs.forEach((p) => baum.appendChild(zeile(p, 0)));
        }
        const bereiche = abschnittAn('bereiche') ? (Store.getMeta('bereiche', []) || []) : [];
        bereiche.forEach((b) => {
            const drin = Store.rootPages().filter((p) => p.bereich === b.id && !p.system && !p.archiviert);
            baum.appendChild(abschnitt(b.icon + ' ' + b.name, () => {
                const p = Store.addPage(null, { text: '', bereich: b.id });
                zeichneBaum();
                oeffne(p.id);
                setTimeout(() => document.getElementById('title')?.focus(), 60);
            }));
            if (!drin.length) {
                const leer = document.createElement('div');
                leer.style.cssText = 'padding:6px 14px; font-size:12.5px; color:var(--text-faint)';
                leer.textContent = 'Noch leer';
                baum.appendChild(leer);
            }
            seitenAnhaengen(baum, drin);
        });
        if (abschnittAn('privat')) {
            const kopf = abschnitt('Privat', () => {
                const p = Store.addPage(null, { text: '' });
                zeichneBaum();
                oeffne(p.id);
                setTimeout(() => document.getElementById('title')?.focus(), 60);
            });
            baum.appendChild(kopf);
            const seiten = Store.rootPages().filter((p) => !p.system && !p.bereich && !p.archiviert);
            if (!seiten.length) {
                const leer = document.createElement('div');
                leer.style.cssText = 'padding:8px 14px; font-size:13px; color:var(--text-faint)';
                leer.textContent = 'Noch keine Seiten';
                baum.appendChild(leer);
            }
            seitenAnhaengen(baum, seiten);
            const sys = Store.rootPages().filter((p) => p.system);
            if (sys.length) {
                baum.appendChild(abschnitt('Angelegt von den Werkzeugen'));
                seitenAnhaengen(baum, sys);
            }
        }
        if (!abschnittAn('apps'))
            return;
        const appKopf = abschnitt('Meine Apps', null, () => abschnitteAnpassen());
        appKopf.dataset['ruhig'] = 'chrome';
        baum.appendChild(appKopf);
        const apps = document.createElement('div');
        apps.className = 'wz-block apps-block';
        apps.dataset['ruhig'] = 'chrome';
        const appliste = (typeof Register !== 'undefined' && Register.navigation)
            ? Register.navigation.anPlatz('apps') : [];
        const offeneGruppen = () => {
            const g = Store.getMeta('appGruppenAuf', []);
            return Array.isArray(g) ? g : [];
        };
        const gruppeAuf = (id) => offeneGruppen().includes(id);
        const gruppeSchalten = (id) => {
            const auf = offeneGruppen();
            Store.setMeta('appGruppenAuf', auf.includes(id) ? auf.filter(x => x !== id) : [...auf, id]);
            zeichneBaum();
        };
        const inGruppe = (id) => appliste.filter((x) => id === 'sonstiges' ? !APP_GRUPPEN.some(([g]) => g === x.gruppe) : x.gruppe === id);
        const alleGruppen = [...APP_GRUPPEN, ['sonstiges', 'Sonstiges', 'dots']];
        apps.innerHTML = alleGruppen
            .map(([id, name, zeichen]) => {
            const drin = inGruppe(id);
            if (!drin.length)
                return '';
            const auf = gruppeAuf(id);
            return `<button class="side-item app-gruppe${auf ? ' auf' : ''}" data-app-gruppe="${esc(id)}"` +
                ` aria-expanded="${auf ? 'true' : 'false'}">` +
                `<span data-sym="${esc(zeichen)}" aria-hidden="true"></span>` +
                `<span>${esc(name)}</span>` +
                `<span class="k">${drin.length}</span>` +
                `<span class="app-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>` +
                `<div class="app-unter"${auf ? '' : ' hidden'}>` + drin.map((x) => `<button class="side-item" data-app="${esc(x.marke || x.id)}" title="${esc(x.hinweis || x.name)}">` +
                `<span>${esc(x.icon || '•')}</span><span>${esc(x.name)}</span></button>`).join('') + '</div>';
        }).join('');
        apps.addEventListener('click', e => {
            const g = elVon(e)?.closest('[data-app-gruppe]');
            if (g?.dataset.appGruppe) {
                gruppeSchalten(g.dataset.appGruppe);
                return;
            }
        });
        setTimeout(() => {
            let versteckt = false;
            [...baum.children].forEach(el => {
                if (el.classList.contains('side-section')) {
                    versteckt = abschnittZu(el.querySelector('span')?.firstChild?.textContent || '');
                    el.classList.toggle('zu', versteckt);
                    return;
                }
                if (el instanceof HTMLElement)
                    el.style.display = versteckt ? 'none' : '';
            });
        }, 0);
        apps.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-app]');
            if (!b)
                return;
            const eintrag = appliste.find((x) => (x.marke || x.id) === b.dataset.app);
            if (!eintrag?.tun)
                return;
            try {
                eintrag.tun();
            }
            catch (fehler) {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Seitenleiste', String(b.dataset.app) + ': ' +
                        (fehler instanceof Error ? fehler.message : String(fehler)), fehler);
            }
        });
        baum.appendChild(apps);
        if (typeof Register !== 'undefined' && Register.navigation) {
            const dazu = Register.navigation.anPlatz('unten').filter((x) => x.tun && x.vonAussen);
            if (dazu.length) {
                const kasten = document.createElement('div');
                dazu.forEach((x) => {
                    const z = document.createElement('button');
                    z.className = 'side-item';
                    z.innerHTML = `<span>${esc(x.icon || '•')}</span><span>${esc(x.name)}</span>`;
                    z.addEventListener('click', () => {
                        try {
                            x.tun();
                        }
                        catch (e) {
                            if (typeof Reporter !== 'undefined')
                                Reporter.error('Seitenleiste', e instanceof Error ? e.message : String(e), e);
                        }
                    });
                    kasten.appendChild(z);
                });
                baum.appendChild(kasten);
            }
        }
        abschnitteOrdnen(baum);
        if (typeof Erweiterung !== 'undefined' && Erweiterung.knoepfeAnhaengen)
            Erweiterung.knoepfeAnhaengen();
        if (typeof Register !== 'undefined' && Register.symbole) {
            Register.symbole.fuelle(baum);
        }
    };
    const abschnitteOrdnen = (baum) => {
        const folge = Store.getMeta('sidebarFolge', null);
        if (!Array.isArray(folge) || !folge.length)
            return;
        const nachName = {};
        ABSCHNITTE.forEach(([id, name]) => { if (name && id)
            nachName[name] = id; });
        const teile = [];
        let jetzt = { id: 'werkzeuge', nodes: [] };
        [...baum.children].forEach(el => {
            if (el.classList.contains('side-section')) {
                const name = (el.querySelector('span')?.firstChild?.textContent || '').trim();
                if (jetzt.nodes.length)
                    teile.push(jetzt);
                jetzt = { id: nachName[name] || ('x-' + name), nodes: [el] };
                return;
            }
            jetzt.nodes.push(el);
        });
        if (jetzt.nodes.length)
            teile.push(jetzt);
        if (teile.length < 2)
            return;
        const rang = (id) => {
            const i = folge.indexOf(id);
            return i < 0 ? 500 : i;
        };
        teile.sort((a, b) => rang(a.id) - rang(b.id));
        teile.forEach(t => t.nodes.forEach(n => baum.appendChild(n)));
    };
    const abschnittZu = (name) => (Store.getMeta('sidebarZu', []) || []).includes(name);
    const abschnittKlappen = (name) => {
        const zu = Store.getMeta('sidebarZu', []) || [];
        Store.setMeta('sidebarZu', zu.includes(name) ? zu.filter((x) => x !== name) : [...zu, name]);
        zeichneBaum();
    };
    const abschnittId = (name) => (ABSCHNITTE.find(([, n]) => n === name) || [])[0] || null;
    const abschnittMenue = (anker, name) => {
        document.querySelectorAll('.menu').forEach(m => m.remove());
        const id = abschnittId(name);
        const zu = abschnittZu(name);
        const folge = abschnitteGeordnet().map(x => x[0]);
        const i = id ? folge.indexOf(id) : -1;
        const r = anker.getBoundingClientRect();
        const m = Menue.menu(`<button data-a="klappen"><span class="mi">${zu ? '⌄' : '›'}</span>` +
            `${zu ? 'Aufklappen' : 'Zuklappen'}</button>` +
            '<button data-a="alleZu"><span class="mi">⌃</span>Alle Abschnitte zuklappen</button>' +
            '<button data-a="alleAuf"><span class="mi">⌄</span>Alle aufklappen</button>' +
            (id ? '<hr>' +
                `<button data-a="hoch"${i <= 0 ? ' disabled' : ''}><span class="mi">↑</span>Weiter nach oben</button>` +
                `<button data-a="runter"${i < 0 || i >= folge.length - 1 ? ' disabled' : ''}>` +
                '<span class="mi">↓</span>Weiter nach unten</button>' +
                '<button data-a="aus"><span class="mi">🚫</span>Diesen Abschnitt ausblenden</button>' : '') +
            '<hr>' +
            '<button data-a="anpassen"><span class="mi">⚙</span>Abschnitte anpassen</button>', Math.min(r.left, innerWidth - 230), r.bottom + 4, { titel: name });
        m.style.minWidth = '210px';
        m.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('[data-a]');
            if (!b || b.disabled)
                return;
            const a = b.dataset.a;
            document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
            if (a === 'klappen')
                abschnittKlappen(name);
            if (a === 'alleZu') {
                Store.setMeta('sidebarZu', ABSCHNITTE.map(x => x[1]));
                zeichneBaum();
            }
            if (a === 'alleAuf') {
                Store.setMeta('sidebarZu', []);
                zeichneBaum();
            }
            if (!id)
                return;
            if (a === 'hoch')
                abschnittSchieben(id, -1);
            if (a === 'runter')
                abschnittSchieben(id, 1);
            if (a === 'aus') {
                abschnittSchalten(id);
                UI.toast(name + ' ausgeblendet');
            }
            if (a === 'anpassen')
                abschnitteAnpassen();
        });
    };
    const abschnitt = (name, beiPlus, beiZahnrad) => {
        const d = document.createElement('div');
        d.className = 'side-section';
        d.innerHTML = `<span>${name}<i class="ss-pfeil">${abschnittZu(name) ? '›' : '⌄'}</i></span>`;
        d.querySelector('span')?.addEventListener('click', () => abschnittKlappen(name));
        if (beiZahnrad) {
            const z = document.createElement('button');
            z.textContent = '⚙';
            z.title = 'Abschnitte anpassen';
            z.addEventListener('click', beiZahnrad);
            d.appendChild(z);
        }
        if (beiPlus) {
            const b = document.createElement('button');
            b.textContent = '+';
            b.title = 'Neue Seite';
            b.addEventListener('click', beiPlus);
            d.appendChild(b);
        }
        const punkte = document.createElement('button');
        punkte.textContent = '⋯';
        punkte.title = 'Mehr zu diesem Abschnitt';
        punkte.addEventListener('click', (e) => {
            e.stopPropagation();
            abschnittMenue(punkte, name);
        });
        d.appendChild(punkte);
        return d;
    };
    let gemesseneZeilenHoehe = 30;
    const FENSTER_SCHWELLE = 240;
    const FENSTER_PUFFER = 12;
    const sichtbareSeiten = (wurzeln) => {
        const raus = [];
        const nimm = (p, tiefe) => {
            raus.push({ p, tiefe });
            if (!p.aufgeklappt)
                return;
            Store.childrenOf(p.id)
                .filter((k) => k.type === 'page' && !k.archiviert)
                .forEach((k) => nimm(k, tiefe + 1));
        };
        wurzeln.forEach(p => nimm(p, 0));
        return raus;
    };
    const seitenAnhaengen = (baum, wurzeln) => {
        const liste = sichtbareSeiten(wurzeln);
        if (liste.length <= FENSTER_SCHWELLE) {
            wurzeln.forEach(p => baum.appendChild(zeile(p, 0)));
            return;
        }
        const rahmen = document.createElement('div');
        rahmen.className = 'seiten-fenster';
        rahmen.setAttribute('role', 'list');
        rahmen.setAttribute('aria-label', `${liste.length} Seiten`);
        rahmen.style.cssText = `position:relative;height:${liste.length * gemesseneZeilenHoehe}px`;
        baum.appendChild(rahmen);
        let letzterVon = -1, letzterBis = -1;
        const zeichnen = (erzwingen = false) => {
            if (!rahmen.isConnected || rahmen.style.display === 'none')
                return;
            const relativ = baum.scrollTop - rahmen.offsetTop;
            const von = Math.max(0, Math.floor(relativ / gemesseneZeilenHoehe) - FENSTER_PUFFER);
            const bis = Math.min(liste.length, Math.max(von, Math.ceil((relativ + baum.clientHeight) / gemesseneZeilenHoehe) + FENSTER_PUFFER));
            if (!erzwingen && von === letzterVon && bis === letzterBis)
                return;
            letzterVon = von;
            letzterBis = bis;
            rahmen.replaceChildren();
            for (let i = von; i < bis; i++) {
                const x = liste[i];
                if (!x)
                    continue;
                const z = zeile(x.p, x.tiefe, true);
                z.setAttribute('role', 'listitem');
                z.setAttribute('aria-posinset', String(i + 1));
                z.setAttribute('aria-setsize', String(liste.length));
                z.style.cssText = `position:absolute;left:0;right:0;top:${i * gemesseneZeilenHoehe}px`;
                rahmen.appendChild(z);
            }
        };
        zeichnen(true);
        requestAnimationFrame(() => {
            if (!rahmen.isConnected)
                return;
            const h = rahmen.querySelector('.row')?.getBoundingClientRect().height || 0;
            if (h > 10 && Math.abs(h - gemesseneZeilenHoehe) > 0.25) {
                gemesseneZeilenHoehe = h;
                rahmen.style.height = liste.length * h + 'px';
                zeichnen(true);
            }
        });
        const beiScroll = () => zeichnen();
        baum.addEventListener('scroll', beiScroll, { passive: true });
        const bisher = baum.__seitenFensterAufraeumen;
        baum.__seitenFensterAufraeumen = () => {
            if (typeof bisher === 'function')
                bisher();
            baum.removeEventListener('scroll', beiScroll);
        };
    };
    const zeile = (p, tiefe, flach = false) => {
        const w = document.createElement('div');
        if (flach && tiefe)
            w.style.marginLeft = tiefe * 14 + 'px';
        const r = document.createElement('div');
        r.className = 'row' + (p.id === aktuelleSeite() ? ' on' : '');
        r.draggable = true;
        const zeilenFarbe = typeof Farben !== 'undefined' && Farben.kennung ? Farben.kennung(p.color) : '';
        if (zeilenFarbe) {
            r.dataset['farbe'] = zeilenFarbe;
            r.style.setProperty('--zeilen-farbe', 'var(--c-' + zeilenFarbe + ')');
        }
        const kinder = Store.childrenOf(p.id).filter((k) => k.type === 'page' && !k.archiviert);
        const offen = !!p.aufgeklappt;
        const tw = document.createElement('div');
        tw.className = 'tw';
        tw.textContent = kinder.length ? (offen ? '▾' : '▸') : '';
        tw.addEventListener('click', e => {
            e.stopPropagation();
            if (!kinder.length)
                return;
            Store.updateBlock(p.id, { aufgeklappt: !offen });
            zeichneBaum();
        });
        const ico = document.createElement('div');
        ico.className = 'ico';
        ico.textContent = p.icon || '📄';
        const nm = document.createElement('div');
        nm.className = 'nm';
        nm.textContent = p.text || 'Ohne Titel';
        if (p.locked)
            nm.textContent = '🔒 ' + nm.textContent;
        const act = document.createElement('div');
        act.className = 'act';
        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.title = 'Unterseite';
        plus.addEventListener('click', e => {
            e.stopPropagation();
            const k = Store.addPage(p.id, { text: '' });
            Store.updateBlock(p.id, { aufgeklappt: true });
            zeichneBaum();
            oeffne(k.id);
            setTimeout(() => document.getElementById('title')?.focus(), 60);
        });
        const mehr = document.createElement('button');
        mehr.textContent = '⋯';
        mehr.addEventListener('click', e => { e.stopPropagation(); seitenMenue(mehr, p); });
        act.appendChild(plus);
        act.appendChild(mehr);
        r.append(tw, ico, nm, act);
        r.addEventListener('click', () => oeffne(p.id));
        r.addEventListener('dragstart', e => { e.dataTransfer?.setData('text/seite', p.id); });
        r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('drop'); });
        r.addEventListener('dragleave', () => r.classList.remove('drop'));
        r.addEventListener('drop', e => {
            e.preventDefault();
            r.classList.remove('drop');
            const quelle = e.dataTransfer?.getData('text/seite') ?? '';
            if (quelle && quelle !== p.id) {
                const q = Store.getBlock(quelle);
                if (q)
                    Werkzeuge.verschiebe(q, p.id);
            }
        });
        w.appendChild(r);
        if (!flach && offen && kinder.length) {
            const k = document.createElement('div');
            k.className = 'kids';
            kinder.forEach((kid) => k.appendChild(zeile(kid, tiefe + 1)));
            w.appendChild(k);
        }
        return w;
    };
    return {
        binde,
        zeichne: zeichneBaum,
        zeichneReiter,
        handyLeiste,
        reiterWechseln,
        reiter: (id) => { if (id !== undefined)
            reiter = id; return reiter; },
        ABSCHNITTE,
        abschnittAn,
        abschnittSchalten,
        abschnitteAnpassen,
        abschnitteGeordnet,
        abschnittMenue
    };
})();
window.Seitenleiste = Seitenleiste;
