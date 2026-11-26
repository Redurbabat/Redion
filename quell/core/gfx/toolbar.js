"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/toolbar.ts (npm run bauen:ts). */
const GfxToolbar = (() => {
    const esc = (wert) => String(wert ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const erstelle = (o) => {
        const werkzeuge = (o.werkzeuge || []).filter(w => w && w.id);
        const aktionen = (o.aktionen || []).filter(a => a && a.id);
        let aktiv = o.aktiv || werkzeuge[0]?.id || '';
        let offenesMenue = null;
        let menueAusloeser = null;
        const wurzel = document.createElement('div');
        wurzel.className = 'gfx-tb-sockel' + (o.klasse ? ' ' + o.klasse : '');
        const roller = document.createElement('div');
        roller.className = 'gfx-tb-roller';
        const leiste = document.createElement('div');
        leiste.className = 'gfx-tb gfx-tb-haupt';
        leiste.setAttribute('role', 'toolbar');
        leiste.setAttribute('aria-label', o.beschriftung || 'Werkzeuge');
        const neben = document.createElement('div');
        neben.className = 'gfx-tb gfx-tb-neben';
        const knopf = (teil, art, menue = false) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset[art === 'wz' ? 'wz' : 'a'] = teil.id;
            if (menue)
                b.dataset.menue = teil.id;
            if (menue || (art === 'wz' && o.galerie?.paletten?.includes(teil.id)))
                b.setAttribute('aria-expanded', 'false');
            b.title = teil.titel || teil.name;
            b.setAttribute('aria-label', teil.name);
            b.tabIndex = -1;
            b.innerHTML = teil.sym
                ? `<span class="zeichen" data-sym="${esc(teil.sym)}" aria-hidden="true"></span>`
                : `<span class="zeichen" aria-hidden="true">${esc(teil.zeichen ?? '')}</span>`;
            return b;
        };
        const quick = werkzeuge.filter(w => w.gruppe === 'quick');
        const senior = werkzeuge.filter(w => w.gruppe !== 'quick');
        const gruppe = (klasse) => {
            const g = document.createElement('div');
            g.className = 'gfx-tb-gruppe ' + klasse;
            return g;
        };
        const trenner = () => {
            const t = document.createElement('span');
            t.className = 'gfx-tb-trenn';
            t.setAttribute('aria-hidden', 'true');
            return t;
        };
        const gQuick = gruppe('gfx-tb-quick');
        for (const w of quick) {
            const b = knopf(w, 'wz');
            b.setAttribute('aria-pressed', String(w.id === aktiv));
            if (w.id === aktiv)
                b.classList.add('on');
            gQuick.append(b);
        }
        const gSenior = gruppe('gfx-tb-senior');
        for (const w of senior) {
            const b = knopf(w, 'wz');
            b.setAttribute('aria-pressed', String(w.id === aktiv));
            if (w.id === aktiv)
                b.classList.add('on');
            gSenior.append(b);
        }
        if (quick.length)
            leiste.append(gQuick);
        if (quick.length && senior.length)
            leiste.append(trenner());
        if (senior.length)
            leiste.append(gSenior);
        const inWerkzeuge = aktionen.filter(a => a.kapsel === 'werkzeuge');
        const inNeben = aktionen.filter(a => a.kapsel !== 'werkzeuge');
        const setzeAktionen = (liste, ziel) => {
            for (const a of liste) {
                const vor = o.zusatz?.[a.id];
                if (vor)
                    ziel.append(vor);
                const b = knopf(a, 'a', a.menue === true);
                if (a.gesperrt)
                    b.disabled = true;
                ziel.append(b);
            }
        };
        if (inWerkzeuge.length) {
            leiste.append(trenner());
            setzeAktionen(inWerkzeuge, leiste);
        }
        setzeAktionen(inNeben, neben);
        roller.append(leiste);
        if (neben.childNodes.length)
            roller.append(neben);
        wurzel.append(roller);
        const menueGruppen = new Map();
        const vorrat = document.createElement('div');
        vorrat.hidden = true;
        let galerieMessen;
        if (o.galerie) {
            wurzel.classList.add('gfx-tb-galerie', 'gfx-tb-edgeless');
            const knoepfe = new Map([...roller.querySelectorAll('button')].map(b => [b.dataset.wz || b.dataset.a, b]));
            const einhaengen = (el, ids) => {
                for (const id of ids) {
                    const b = knoepfe.get(id);
                    if (b) {
                        el.append(b);
                        knoepfe.delete(id);
                    }
                }
            };
            leiste.replaceChildren();
            const schnell = gruppe('gfx-tb-schnell');
            einhaengen(schnell, o.galerie.schnell);
            const zusatz = gruppe('gfx-tb gfx-tb-edgeless-zusatz');
            zusatz.setAttribute('role', 'group');
            zusatz.setAttribute('aria-label', 'Redion-Werkzeuge');
            einhaengen(zusatz, o.galerie.edgeless.zusatz);
            if (zusatz.childElementCount)
                roller.append(zusatz);
            const festerStreifen = document.createElement('div');
            festerStreifen.className = 'gfx-tb-kartenfenster';
            const karten = gruppe('gfx-tb-karten');
            for (const { id, knoepfe: ids } of o.galerie.karten) {
                const karte = gruppe('gfx-tb-karte');
                karte.dataset.karte = id;
                einhaengen(karte, ids);
                const vorschau = karte.querySelector('.zeichen');
                for (const b of karte.querySelectorAll('button')) {
                    if (!['notiz', 'formen'].includes(id) && !['stift', 'radierer'].includes(b.dataset.wz ?? ''))
                        b.classList.add('gfx-tb-symbol');
                }
                if (vorschau && (id === 'notiz' || id === 'formen')) {
                    delete vorschau.dataset.sym;
                    const teile = id === 'notiz' ? ['link', 'text', 'heading'] : ['rect', 'ellipse', 'triangle'];
                    for (const teil of teile) {
                        const grafik = document.createElement('span');
                        grafik.dataset.vorschau = teil;
                        vorschau.append(grafik);
                    }
                }
                if (karte.childElementCount)
                    karten.append(karte);
            }
            festerStreifen.append(karten);
            const galeriekarten = Array.from(karten.children);
            let kartenStart = 0;
            let kartenProSeite = 3;
            for (const [id, ids] of Object.entries(o.galerie.werkzeugMenues ?? {})) {
                const zeile = gruppe('gfx-tb-menuewerkzeuge');
                einhaengen(zeile, ids);
                menueGruppen.set(id, zeile);
                vorrat.append(zeile);
            }
            wurzel.append(vorrat);
            for (const b of knoepfe.values())
                if (!neben.contains(b))
                    neben.append(b);
            if (neben.childElementCount && !neben.parentElement)
                roller.append(neben);
            const blatt = (name, zeichen, richtung) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.tabIndex = -1;
                b.className = 'gfx-tb-blatt';
                b.dataset.richtung = richtung < 0 ? 'links' : 'rechts';
                b.title = name;
                b.setAttribute('aria-label', name);
                const symbol = document.createElement('span');
                symbol.textContent = zeichen;
                symbol.setAttribute('aria-hidden', 'true');
                b.append(symbol);
                b.addEventListener('click', () => {
                    if (b.getAttribute('aria-disabled') === 'true')
                        return;
                    menueZu();
                    kartenStart += kartenProSeite * richtung;
                    blattstand();
                    haltPruefen();
                });
                return b;
            };
            const zurueck = blatt('Vorherige Werkzeuge', '‹', -1);
            const weiter = blatt('Weitere Werkzeuge', '›', 1);
            const blattstand = () => {
                if (festerStreifen.clientWidth > 0) {
                    kartenProSeite = Math.max(1, Math.floor(festerStreifen.clientWidth / 96));
                }
                const letzterStart = Math.max(0, galeriekarten.length - kartenProSeite);
                kartenStart = Math.max(0, Math.min(kartenStart, letzterStart));
                for (const [index, karte] of galeriekarten.entries()) {
                    karte.hidden = index < kartenStart || index >= kartenStart + kartenProSeite;
                }
                zurueck.setAttribute('aria-disabled', String(kartenStart === 0));
                weiter.setAttribute('aria-disabled', String(kartenStart === letzterStart));
            };
            leiste.append(schnell, trenner(), zurueck, festerStreifen, weiter);
            galerieMessen = new ResizeObserver(() => {
                blattstand();
                haltPruefen();
            });
            galerieMessen.observe(festerStreifen);
            blattstand();
        }
        const menueZu = () => {
            const gruppe = offenesMenue ? menueGruppen.get(offenesMenue) : undefined;
            if (gruppe) {
                for (const knopf of gruppe.querySelectorAll('button'))
                    knopf.tabIndex = -1;
                vorrat.append(gruppe);
            }
            wurzel.querySelector('.gfx-tb-menue')?.remove();
            menueAusloeser?.setAttribute('aria-expanded', 'false');
            menueAusloeser = null;
            offenesMenue = null;
        };
        const menueAuf = (id, ausloeser, fokus = false) => {
            const inhalt = o.menue?.(id);
            const gruppe = menueGruppen.get(id);
            if (!inhalt && !gruppe)
                return;
            menueZu();
            const m = document.createElement('div');
            m.className = 'gfx-tb-menue';
            m.setAttribute('role', 'group');
            if (o.galerie?.paletten?.includes(id))
                m.classList.add('gfx-tb-palette');
            if (gruppe) {
                for (const knopf of gruppe.querySelectorAll('button'))
                    knopf.tabIndex = 0;
                m.append(gruppe);
            }
            if (inhalt)
                m.append(inhalt);
            wurzel.append(m);
            offenesMenue = id;
            menueAusloeser = ausloeser;
            ausloeser.setAttribute('aria-expanded', 'true');
            const wr = wurzel.getBoundingClientRect(), ar = ausloeser.getBoundingClientRect();
            const mb = m.getBoundingClientRect();
            const links = Math.max(0, Math.min(wr.width - mb.width, ar.left - wr.left + ar.width / 2 - mb.width / 2));
            m.style.left = Math.round(links) + 'px';
            if (fokus)
                m.querySelector('button:not(:disabled)')?.focus();
        };
        const beiKlick = (e) => {
            const ziel = e.target;
            if (!ziel)
                return;
            const mn = ziel.closest('[data-menue]');
            if (mn && wurzel.contains(mn)) {
                const id = mn.dataset.menue ?? '';
                if (offenesMenue === id)
                    menueZu();
                else
                    menueAuf(id, mn, e instanceof MouseEvent && e.detail === 0);
                return;
            }
            const wz = ziel.closest('[data-wz]');
            if (wz && wurzel.contains(wz)) {
                const ursprung = wz.closest('.gfx-tb-menue') ? offenesMenue : null;
                const id = wz.dataset.wz ?? '';
                const behalten = !!ursprung && o.galerie?.paletten?.includes(ursprung);
                const oeffnen = !ursprung && offenesMenue !== id && o.galerie?.paletten?.includes(id);
                const ausloeser = ursprung ? menueAusloeser : null;
                if (!behalten)
                    menueZu();
                const teil = werkzeuge.find(w => w.id === id);
                if (teil?.haelt !== false)
                    setzeWerkzeug(id);
                o.aufWerkzeug?.(id);
                if (oeffnen)
                    menueAuf(id, wz, e instanceof MouseEvent && e.detail === 0);
                if (!behalten)
                    ausloeser?.focus();
                return;
            }
            const ak = ziel.closest('[data-a]');
            if (ak && wurzel.contains(ak)) {
                const id = ak.dataset.a ?? '';
                if (ziel.closest('.gfx-tb-menue'))
                    menueZu();
                o.aufAktion?.(id);
            }
        };
        wurzel.addEventListener('click', beiKlick);
        const alleKnoepfe = () => [...wurzel.querySelectorAll('button')].filter(b => !b.closest('.gfx-tb-menue'));
        const knoepfe = () => alleKnoepfe().filter(b => !b.disabled && b.offsetParent !== null);
        const tabstoppSetzen = () => {
            const alle = alleKnoepfe();
            const gelegt = knoepfe();
            const liste = gelegt.length ? gelegt : alle.filter(b => !b.disabled);
            const gewaehlt = liste.find(b => b.dataset.wz === aktiv) ?? liste[0];
            for (const b of alle)
                b.tabIndex = b === gewaehlt ? 0 : -1;
        };
        const haltPruefen = () => {
            const liste = knoepfe();
            if (liste.length && !liste.some(b => b.tabIndex === 0))
                tabstoppSetzen();
        };
        const beiTaste = (e) => {
            if (e.key === 'Escape' && offenesMenue) {
                const imMenue = !!(document.activeElement && wurzel.querySelector('.gfx-tb-menue')?.contains(document.activeElement));
                const ausloeser = menueAusloeser;
                menueZu();
                e.stopPropagation();
                e.preventDefault();
                if (imMenue)
                    ausloeser?.focus();
                return;
            }
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End')
                return;
            const liste = knoepfe();
            const jetzt = liste.indexOf(document.activeElement);
            if (jetzt < 0)
                return;
            e.preventDefault();
            const naechster = e.key === 'Home' ? 0
                : e.key === 'End' ? liste.length - 1
                    : e.key === 'ArrowRight' ? (jetzt + 1) % liste.length
                        : (jetzt - 1 + liste.length) % liste.length;
            const b = liste[naechster];
            if (!b)
                return;
            for (const x of liste)
                x.tabIndex = x === b ? 0 : -1;
            b.focus();
        };
        wurzel.addEventListener('keydown', beiTaste);
        wurzel.addEventListener('focusin', haltPruefen);
        const beiAussen = (e) => {
            if (!offenesMenue)
                return;
            const z = e.target;
            if (z && !wurzel.contains(z) && !o.menueOffenHalten?.(offenesMenue, z))
                menueZu();
        };
        document.addEventListener('pointerdown', beiAussen, true);
        const setzeWerkzeug = (id) => {
            aktiv = id;
            wurzel.querySelectorAll('[data-wz]').forEach(b => {
                const an = b.dataset.wz === id;
                b.classList.toggle('on', an);
                b.setAttribute('aria-pressed', String(an));
            });
            for (const [menuId, group] of menueGruppen) {
                const trigger = wurzel.querySelector(`[data-menue="${CSS.escape(menuId)}"]`);
                trigger?.classList.toggle('on', !!group.querySelector(`[data-wz="${CSS.escape(id)}"]`));
            }
            tabstoppSetzen();
        };
        const setzeGesperrt = (id, ja) => {
            const b = wurzel.querySelector(`[data-a="${CSS.escape(id)}"]`);
            if (!b)
                return;
            b.disabled = ja;
            if (ja && b.tabIndex === 0)
                tabstoppSetzen();
        };
        const zerstoere = () => {
            galerieMessen?.disconnect();
            document.removeEventListener('pointerdown', beiAussen, true);
            wurzel.remove();
        };
        tabstoppSetzen();
        if (typeof requestAnimationFrame === 'function')
            requestAnimationFrame(haltPruefen);
        return {
            element: wurzel,
            setzeWerkzeug,
            setzeGesperrt,
            schliesse: menueZu,
            istOffen: () => offenesMenue,
            zerstoere
        };
    };
    return { erstelle };
})();
window.GfxToolbar = GfxToolbar;
