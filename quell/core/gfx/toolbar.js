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
        const menueZu = () => {
            wurzel.querySelector('.gfx-tb-menue')?.remove();
            wurzel.querySelectorAll('[data-menue]').forEach(b => b.setAttribute('aria-expanded', 'false'));
            offenesMenue = null;
        };
        const menueAuf = (id, ausloeser) => {
            const inhalt = o.menue?.(id);
            if (!inhalt)
                return;
            menueZu();
            const m = document.createElement('div');
            m.className = 'gfx-tb-menue';
            m.setAttribute('role', 'group');
            m.append(inhalt);
            wurzel.append(m);
            offenesMenue = id;
            ausloeser.setAttribute('aria-expanded', 'true');
            const wr = wurzel.getBoundingClientRect(), ar = ausloeser.getBoundingClientRect();
            const mb = m.getBoundingClientRect();
            const links = Math.max(0, Math.min(wr.width - mb.width, ar.left - wr.left + ar.width / 2 - mb.width / 2));
            m.style.left = Math.round(links) + 'px';
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
                    menueAuf(id, mn);
                return;
            }
            const wz = ziel.closest('[data-wz]');
            if (wz && wurzel.contains(wz)) {
                menueZu();
                const id = wz.dataset.wz ?? '';
                const teil = werkzeuge.find(w => w.id === id);
                if (teil?.haelt !== false)
                    setzeWerkzeug(id);
                o.aufWerkzeug?.(id);
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
                const ausloeser = wurzel.querySelector(`[data-menue="${CSS.escape(offenesMenue)}"]`);
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
            if (z && !wurzel.contains(z))
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
