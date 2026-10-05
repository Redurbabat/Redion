"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/hinweis.ts (npm run bauen:ts). */
const Hinweis = (() => {
    let toastTimer;
    let aeltere = [];
    let zaehler = 0;
    let eigner = 0;
    let toastBis = 0;
    const HOECHSTENS = 2;
    const LUECKE = 8;
    const ruhig = () => typeof SelectionFlow !== 'undefined' ? SelectionFlow.ruhig()
        : matchMedia('(prefers-reduced-motion: reduce)').matches;
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
    const stapel = () => {
        let s = document.getElementById('ru-toast-stapel');
        if (!s) {
            s = document.createElement('div');
            s.id = 'ru-toast-stapel';
            s.setAttribute('aria-hidden', 'true');
            document.body.appendChild(s);
        }
        return s;
    };
    const ordnen = () => {
        const t = document.getElementById('toast');
        if (!t)
            return;
        const oben = t.offsetTop, hoehe = t.offsetHeight;
        const nachOben = oben + hoehe / 2 > innerHeight / 2;
        let rand = nachOben ? oben - LUECKE : oben + hoehe + LUECKE;
        const feder = typeof RedionSpring !== 'undefined' ? RedionSpring.token('snappy') : null;
        for (const a of aeltere) {
            const h = a.el.offsetHeight;
            const top = nachOben ? rand - h : rand;
            rand = nachOben ? top - LUECKE : top + h + LUECKE;
            a.el.style.top = top + 'px';
            const von = a.oben ?? oben;
            a.oben = top;
            if (Math.abs(von - top) > 0.5 && feder && feder.duration > 2 && !ruhig()) {
                a.el.animate([{ transform: 'translateY(' + (von - top).toFixed(1) + 'px)' }, { transform: 'none' }], { duration: feder.duration, easing: feder.easing });
            }
        }
    };
    const gehen = (a) => {
        if (!aeltere.includes(a))
            return;
        aeltere = aeltere.filter(x => x !== a);
        clearTimeout(a.uhr);
        a.el.classList.add('geht');
        const weg = () => { a.el.remove(); };
        if (ruhig())
            weg();
        else {
            const anim = a.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
            anim.finished.then(weg).catch(weg);
        }
        ordnen();
    };
    const uebernehmen = (t, id, neu) => {
        const alt = t.textContent || '';
        const altId = eigner;
        eigner = id;
        aeltere.filter(a => a.id === id || a.el.textContent === neu).forEach(gehen);
        if (!t.classList.contains('show') || !alt || altId === id || alt === neu)
            return;
        aeltere.filter(a => a.el.textContent === alt).forEach(gehen);
        const el = document.createElement('div');
        el.className = 'ru-toast-alt';
        el.textContent = alt;
        stapel().prepend(el);
        const eintrag = { id: altId, el };
        aeltere.unshift(eintrag);
        while (aeltere.length > HOECHSTENS) {
            const letzte = aeltere[aeltere.length - 1];
            if (letzte)
                gehen(letzte);
        }
        const bleibt = Math.min(6000, Math.max(2200, toastBis - Date.now()));
        eintrag.uhr = setTimeout(() => gehen(eintrag), bleibt);
        requestAnimationFrame(ordnen);
        ordnen();
    };
    const stapelLeeren = () => {
        const t = document.getElementById('toast');
        const da = !!t?.classList.contains('show') || aeltere.length > 0;
        [...aeltere].forEach(gehen);
        if (t?.classList.contains('show')) {
            clearTimeout(toastTimer);
            t.classList.remove('show');
        }
        return da;
    };
    let zug = null;
    const HALTEN_MS = 300;
    const gehalten = (z) => z.ab !== null && z.ab - z.t0 > HALTEN_MS;
    const trifft = (x, y) => {
        for (const a of aeltere) {
            const r = a.el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
                return { el: a.el, wer: a };
        }
        const t = document.getElementById('toast');
        if (t?.classList.contains('show')) {
            const r = t.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
                return { el: t, wer: null };
        }
        return null;
    };
    const nimmtSelbst = (ziel) => {
        for (let el = ziel instanceof Element ? ziel : null; el && el !== document.body; el = el.parentElement) {
            if (el instanceof HTMLElement && el.dataset['keinWisch'] !== undefined)
                return true;
            if (el instanceof HTMLInputElement && el.type === 'range')
                return true;
            const s = getComputedStyle(el);
            const ta = s.touchAction;
            if (ta && ta !== 'auto' && ta !== 'manipulation' && !/pan-x|pan-left|pan-right/.test(ta))
                return true;
            if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(s.overflowX))
                return true;
        }
        return false;
    };
    addEventListener('pointerdown', (e) => {
        zug = null;
        if (e.pointerType !== 'touch')
            return;
        const z = trifft(e.clientX, e.clientY);
        if (z && !nimmtSelbst(e.target))
            zug = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, ...z,
                gefangen: false, x: e.clientX, y: e.clientY, t: e.timeStamp, ab: null };
    }, { capture: true, passive: true });
    addEventListener('pointermove', (e) => {
        if (!zug || e.pointerId !== zug.id)
            return;
        zug.x = e.clientX;
        zug.y = e.clientY;
        zug.t = e.timeStamp;
        const dx = e.clientX - zug.x0, dy = e.clientY - zug.y0;
        if (zug.ab === null && Math.abs(dx) + Math.abs(dy) > 4)
            zug.ab = e.timeStamp;
        if (!zug.gefangen) {
            if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 12) {
                if (Math.abs(dy) > 12)
                    zug = null;
                return;
            }
            if (gehalten(zug)) {
                zug = null;
                return;
            }
            zug.gefangen = true;
        }
        e.stopPropagation();
        zug.el.style.translate = dx.toFixed(1) + 'px 0';
        zug.el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 260));
    }, { capture: true, passive: true });
    const loslassen = (z, x, t) => {
        const dx = x - z.x0;
        const schnell = Math.abs(dx) / Math.max(1, t - z.t0) > 0.6;
        const weit = Math.abs(dx) > z.el.getBoundingClientRect().width * 0.4;
        z.el.style.removeProperty('translate');
        z.el.style.removeProperty('opacity');
        if (!(schnell || weit))
            return;
        if (z.wer)
            gehen(z.wer);
        else {
            clearTimeout(toastTimer);
            document.getElementById('toast')?.classList.remove('show');
        }
    };
    addEventListener('pointerup', (e) => {
        if (!zug || e.pointerId !== zug.id)
            return;
        const z = zug;
        zug = null;
        if (!z.gefangen)
            return;
        e.stopPropagation();
        loslassen(z, e.clientX, e.timeStamp);
    }, { capture: true });
    addEventListener('pointercancel', (e) => {
        if (!zug || e.pointerId !== zug.id)
            return;
        const z = zug;
        zug = null;
        const dx = z.x - z.x0, dy = z.y - z.y0;
        if (z.gefangen || (Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy) && !gehalten(z)))
            loslassen(z, z.x, z.t);
        else {
            z.el.style.removeProperty('translate');
            z.el.style.removeProperty('opacity');
        }
    }, { capture: true });
    const toast = (text, dauer) => {
        const t = document.getElementById('toast');
        if (!t) {
            console.info('[Hinweis]', String(text));
            return { textContent: String(text ?? ''), remove() { } };
        }
        const id = ++zaehler;
        uebernehmen(t, id, String(text ?? ''));
        t.textContent = String(text ?? '');
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastBis = Date.now() + (dauer || 2600);
        toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
        return {
            set textContent(v) {
                uebernehmen(t, id, v);
                t.textContent = v;
                t.classList.add('show');
                clearTimeout(toastTimer);
                toastBis = Date.now() + (dauer || 2600);
                toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
            },
            get textContent() { return t.textContent || ''; },
            remove() {
                aeltere.filter(a => a.id === id).forEach(gehen);
                if (eigner !== id && eigner !== 0)
                    return;
                clearTimeout(toastTimer);
                t.classList.remove('show');
            }
        };
    };
    const banner = (text, art = 'warn') => {
        document.getElementById('banner')?.remove();
        const d = document.createElement('div');
        d.id = 'banner';
        d.className = 'banner ' + art;
        d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
        d.querySelector('button')?.addEventListener('click', () => d.remove());
        document.body.appendChild(d);
        return d;
    };
    const leer = (o) => '<div class="pe-leer">' +
        `<div class="pe-ico">${o.zeichen}</div>` +
        `<div class="pe-gross">${o.gross}</div>` +
        `<div class="pe-klein">${o.klein}</div>` +
        (o.handlung
            ? `<button class="pe-link"${o.daten ? ' ' + o.daten : ''}>${o.handlung}</button>`
            : '') +
        '</div>';
    let faecher = null;
    let faecherGlocke = null;
    let faecherUhr;
    let faecherZu;
    const faecherOffen = () => !!faecher && !faecher.hidden;
    const fokusImKopf = (g) => {
        if (!g.isConnected)
            return;
        if (!g.hidden && g.offsetParent !== null) {
            g.focus();
            return;
        }
        const reihe = [...(g.parentElement?.querySelectorAll('button, a[href], [tabindex="0"]') ?? [])]
            .filter(e => e === g || (!e.hidden && e.offsetParent !== null && !e.matches(':disabled')));
        const k = reihe.indexOf(g);
        (reihe[k + 1] ?? reihe[k - 1])?.focus();
    };
    const faecherSchliessen = (sofort = false) => {
        clearTimeout(faecherUhr);
        clearTimeout(faecherZu);
        const f = faecher;
        if (!f || f.hidden)
            return;
        const g = faecherGlocke;
        g?.setAttribute('aria-expanded', 'false');
        if (g && f.contains(document.activeElement))
            fokusImKopf(g);
        const fertig = () => { f.hidden = true; f.classList.remove('geht'); };
        if (sofort || ruhig()) {
            fertig();
            return;
        }
        f.classList.add('geht');
        const anim = f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out' });
        anim.finished.then(fertig).catch(fertig);
    };
    const zuDenMeldungen = () => {
        faecherSchliessen(true);
        try {
            Ansichten.posteingang();
        }
        catch { }
    };
    const allesGelesen = () => {
        const f = faecher, g = faecherGlocke;
        const ziel = g && g.offsetParent !== null ? g.getBoundingClientRect() : null;
        let wie = 0;
        try {
            wie = Werkzeuge.meldungenAlleGelesen() || 0;
        }
        catch { }
        if (wie)
            toast(wie === 1 ? '1 Meldung als gelesen markiert' : wie + ' Meldungen als gelesen markiert');
        if (!f || !ziel || ruhig()) {
            faecherSchliessen(true);
            return;
        }
        const ebene = f.querySelector('.ru-faecher-karten');
        const karten = [...f.querySelectorAll('.ru-meldung')];
        if (!ebene || !karten.length || !g) {
            faecherSchliessen(true);
            return;
        }
        const hielt = g.hidden;
        g.hidden = false;
        f.classList.add('fliesst');
        SelectionFlow.goo(ebene, true);
        const mx = ziel.left + ziel.width / 2, my = ziel.top + ziel.height / 2;
        const feder = RedionSpring.token('snappy');
        const bahnen = karten.map((k, n) => {
            const r = k.getBoundingClientRect();
            const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
            const s = Math.max(0.08, Math.min(ziel.width / r.width, 0.5));
            return k.animate([
                { transform: 'none' },
                { transform: 'translate(' + (dx * 0.35).toFixed(1) + 'px,' + (dy * 0.55).toFixed(1) + 'px) scale(.9,.8)', offset: 0.45 },
                { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')', opacity: 0.4 }
            ], { duration: feder.duration + n * 30, easing: feder.easing, fill: 'forwards' });
        });
        f.querySelector('.ru-faecher-fuss')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
        const ende = () => {
            SelectionFlow.goo(ebene, false);
            f.classList.remove('fliesst');
            bahnen.forEach(b => b.cancel());
            faecherSchliessen(true);
            const weg = () => {
                let offen = false;
                try {
                    offen = Werkzeuge.meldungen().some(m => !m.gelesen);
                }
                catch { }
                if (!hielt || offen || g.hidden)
                    return;
                const hatte = document.activeElement === g;
                g.hidden = true;
                if (hatte)
                    fokusImKopf(g);
            };
            const puls = g.animate([{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 320, easing: RedionSpring.token('press').easing });
            puls.finished.then(weg).catch(weg);
        };
        Promise.all(bahnen.map(b => b.finished)).then(ende).catch(ende);
    };
    const faecherBauen = () => {
        if (faecher)
            return faecher;
        const f = document.createElement('div');
        f.id = 'ru-glocken-faecher';
        f.setAttribute('role', 'group');
        f.setAttribute('aria-label', 'Letzte Meldungen');
        f.hidden = true;
        f.addEventListener('pointerenter', () => clearTimeout(faecherZu));
        f.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse')
                faecherZu = setTimeout(() => faecherSchliessen(), 280);
        });
        f.addEventListener('click', (e) => {
            const el = e.target instanceof Element ? e.target : null;
            const knopf = el?.closest('button');
            if (!knopf)
                return;
            if (knopf.dataset['faecher'] === 'gelesen') {
                allesGelesen();
                return;
            }
            if (knopf.dataset['faecher'] === 'posteingang') {
                zuDenMeldungen();
                return;
            }
            const id = knopf.dataset['meld'] || '';
            const m = Werkzeuge.meldungen().find(x => x.id === id);
            try {
                if (id)
                    Werkzeuge.meldungGelesen(id);
            }
            catch { }
            faecherSchliessen(true);
            if (m?.seite)
                App.oeffne(m.seite);
            else
                zuDenMeldungen();
        });
        f.addEventListener('focusout', (e) => {
            const nach = e.relatedTarget instanceof Node ? e.relatedTarget : null;
            if (!nach || f.contains(nach) || faecherGlocke?.contains(nach))
                return;
            faecherSchliessen();
        });
        f.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const alle = [...f.querySelectorAll('button')];
                const k = alle.indexOf(document.activeElement);
                const g = faecherGlocke;
                if (!g || (e.shiftKey ? k > 0 : k < alle.length - 1))
                    return;
                e.preventDefault();
                faecherSchliessen(true);
                const reihe = [...(g.parentElement?.querySelectorAll('button, a[href], [tabindex="0"]') ?? [])]
                    .filter(x => !x.hidden && x.offsetParent !== null && !x.matches(':disabled'));
                const i = reihe.indexOf(g);
                if (i >= 0)
                    (e.shiftKey ? reihe[i] : reihe[i + 1] ?? reihe[i])?.focus();
                return;
            }
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')
                return;
            const alle = [...f.querySelectorAll('button')];
            const k = alle.indexOf(document.activeElement);
            const n = alle[(k + (e.key === 'ArrowDown' ? 1 : alle.length - 1)) % alle.length];
            if (n) {
                e.preventDefault();
                n.focus();
            }
        });
        document.body.appendChild(f);
        faecher = f;
        return f;
    };
    const REIHE = 72;
    const unterDerReihe = (g, links, breite) => {
        let unten = g.bottom;
        for (let y = g.bottom + 4; y <= g.bottom + REIHE; y += 12) {
            for (let x = links + 4; x <= links + breite - 4; x += 16) {
                const ziel = document.elementFromPoint(x, y)
                    ?.closest('button, a[href], input, select, textarea, [role="button"]');
                if (!ziel || ziel.closest('#ru-glocken-faecher'))
                    continue;
                const r = ziel.getBoundingClientRect();
                if (r.top >= g.bottom - 2 && r.bottom <= g.bottom + REIHE + 24)
                    unten = Math.max(unten, r.bottom);
            }
        }
        return unten;
    };
    const faecherOeffnen = (glocke, fokus = false) => {
        clearTimeout(faecherUhr);
        clearTimeout(faecherZu);
        if (typeof Werkzeuge === 'undefined' || glocke.hidden || glocke.offsetParent === null)
            return;
        const liste = Werkzeuge.meldungen().slice(0, 3);
        if (!liste.length)
            return;
        const f = faecherBauen();
        if (faecherGlocke && faecherGlocke !== glocke)
            faecherGlocke.setAttribute('aria-expanded', 'false');
        faecherGlocke = glocke;
        const zeit = (w) => { try {
            return Werkzeuge.zeitKurz(w);
        }
        catch {
            return '';
        } };
        f.innerHTML =
            '<div class="ru-faecher-karten">' +
                liste.map(m => `<button type="button" class="ru-meldung${m.gelesen ? '' : ' neu'}" data-meld="${esc(m.id)}">` +
                    (m.quelle ? `<span class="ru-meldung-quelle">${esc(m.quelle)}</span>` : '') +
                    `<span class="ru-meldung-text">${esc(m.text || 'Meldung')}</span>` +
                    `<span class="ru-meldung-zeit">${esc(zeit(m.wann))}</span></button>`).join('') +
                '</div>' +
                '<div class="ru-faecher-fuss">' +
                '<button type="button" data-faecher="gelesen">Alle gelesen</button>' +
                '<button type="button" data-faecher="posteingang">Posteingang öffnen</button>' +
                '</div>';
        f.classList.remove('geht', 'fliesst');
        const g = glocke.getBoundingClientRect();
        const breite = Math.min(340, innerWidth - 16);
        const links = Math.max(8, Math.min(g.right - breite, innerWidth - breite - 8));
        f.hidden = true;
        const oben = unterDerReihe(g, links, breite);
        f.hidden = false;
        f.style.width = breite + 'px';
        f.style.left = links + 'px';
        f.style.top = (oben > g.bottom ? oben + 16 : g.bottom + 8) + 'px';
        if (!ruhig()) {
            const feder = RedionSpring.token('snappy');
            const mx = g.left + g.width / 2, my = g.top + g.height / 2;
            [...f.querySelectorAll('.ru-meldung')].forEach((k, n) => {
                const r = k.getBoundingClientRect();
                k.animate([
                    { transform: 'translate(' + (mx - r.left - r.width / 2).toFixed(1) + 'px,' +
                            (my - r.top - r.height / 2).toFixed(1) + 'px) scale(.12)', opacity: 0 },
                    { transform: 'none', opacity: 1 }
                ], { duration: feder.duration, easing: feder.easing, delay: n * 40, fill: 'backwards' });
            });
            f.querySelector('.ru-faecher-fuss')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: 120, fill: 'backwards' });
        }
        glocke.setAttribute('aria-controls', f.id);
        glocke.setAttribute('aria-expanded', 'true');
        if (fokus)
            f.querySelector('button')?.focus();
    };
    addEventListener('pointerdown', (e) => {
        if (!faecherOffen())
            return;
        const ziel = e.target instanceof Node ? e.target : null;
        if (ziel && (faecher?.contains(ziel) || faecherGlocke?.contains(ziel)))
            return;
        faecherSchliessen();
    }, { capture: true, passive: true });
    const faecherBinden = (glocke) => {
        if (!glocke || glocke.dataset['faecher'] === 'an')
            return;
        glocke.dataset['faecher'] = 'an';
        glocke.setAttribute('aria-haspopup', 'true');
        glocke.setAttribute('aria-expanded', 'false');
        let lang;
        let schlucken = false;
        let x0 = 0, y0 = 0;
        glocke.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse')
                return;
            clearTimeout(faecherZu);
            if (faecherOffen() && faecherGlocke === glocke && !faecher?.classList.contains('geht'))
                return;
            faecherUhr = setTimeout(() => faecherOeffnen(glocke), 220);
        });
        glocke.addEventListener('pointerleave', (e) => {
            if (e.pointerType !== 'mouse')
                return;
            clearTimeout(faecherUhr);
            faecherZu = setTimeout(() => faecherSchliessen(), 280);
        });
        glocke.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse')
                return;
            schlucken = false;
            x0 = e.clientX;
            y0 = e.clientY;
            clearTimeout(lang);
            lang = setTimeout(() => { schlucken = true; faecherOeffnen(glocke); }, 480);
        });
        glocke.addEventListener('pointermove', (e) => {
            if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10)
                clearTimeout(lang);
        });
        const loslassen = () => clearTimeout(lang);
        glocke.addEventListener('pointerup', loslassen);
        glocke.addEventListener('pointercancel', loslassen);
        glocke.addEventListener('contextmenu', (e) => { if (schlucken || faecherOffen())
            e.preventDefault(); });
        glocke.addEventListener('click', (e) => {
            if (!schlucken) {
                faecherSchliessen(true);
                return;
            }
            schlucken = false;
            e.preventDefault();
            e.stopImmediatePropagation();
        }, true);
        glocke.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                faecherOeffnen(glocke, true);
            }
        });
    };
    const escape = () => {
        if (faecherOffen()) {
            const g = faecherGlocke;
            faecherSchliessen();
            if (g && faecher?.contains(document.activeElement))
                g.focus();
            return true;
        }
        return stapelLeeren();
    };
    return { toast, banner, leer, faecherBinden, escape };
})();
window.Hinweis = Hinweis;
