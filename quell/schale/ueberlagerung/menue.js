"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/menue.ts (npm run bauen:ts). */
const Menue = (() => {
    const amTelefon = () => typeof AppEinstellung !== 'undefined'
        ? AppEinstellung.amTelefon()
        : innerWidth <= 760 ||
            ((window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) &&
                innerHeight <= 500);
    const blattBewegung = (m, grund, liste, schliessen) => {
        const ruhig = () => typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
        const feder = (name) => typeof RedionSpring !== 'undefined' ? RedionSpring.token(name) : { easing: 'ease-out', duration: 320 };
        const dauer = (marke, sonst) => {
            const roh = getComputedStyle(document.documentElement).getPropertyValue(marke).trim();
            const n = parseFloat(roh);
            return Number.isFinite(n) ? (/ms$/.test(roh) ? n : n * 1000) : sonst;
        };
        const kurve = (marke, sonst) => getComputedStyle(document.documentElement).getPropertyValue(marke).trim() || sonst;
        const jetzt = () => {
            const t = getComputedStyle(m).transform;
            return t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
        };
        const deckung = () => {
            const o = parseFloat(getComputedStyle(grund).opacity);
            return Number.isFinite(o) ? o : 1;
        };
        let lauf = [];
        const halt = () => { lauf.forEach(a => a.cancel()); lauf = []; };
        let weg = false;
        const herein = () => {
            if (ruhig())
                return;
            const f = feder('smooth');
            lauf = [
                m.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: f.duration, easing: f.easing }),
                grund.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dauer('--motion-slow', 320), easing: kurve('--ease', 'ease-out') })
            ];
        };
        const geht = () => {
            if (weg || !m.isConnected)
                return;
            if (ruhig()) {
                schliessen();
                return;
            }
            weg = true;
            m.dataset['abgang'] = '1';
            const von = jetzt(), grundVon = deckung();
            halt();
            m.style.transform = '';
            grund.style.opacity = '';
            const d = dauer('--motion-normal', 200), e = kurve('--ease-exit', 'ease-in');
            lauf = [
                m.animate([{ transform: `translateY(${von}px)` }, { transform: 'translateY(100%)' }], { duration: d, easing: e, fill: 'forwards' }),
                grund.animate([{ opacity: grundVon }, { opacity: 0 }], { duration: d, easing: e, fill: 'forwards' })
            ];
            let fertig = false;
            const ende = () => { if (fertig)
                return; fertig = true; schliessen(); };
            lauf[0]?.addEventListener('finish', ende);
            setTimeout(ende, d + 120);
        };
        const zurueck = (von) => {
            const grundVon = deckung();
            m.style.transform = '';
            grund.style.opacity = '';
            if (ruhig())
                return;
            const f = feder('snappy');
            lauf = [
                m.animate([{ transform: `translateY(${von}px)` }, { transform: 'translateY(0)' }], { duration: f.duration, easing: f.easing }),
                grund.animate([{ opacity: grundVon }, { opacity: 1 }], { duration: dauer('--motion-normal', 200), easing: kurve('--ease', 'ease-out') })
            ];
        };
        let start = null, basis = 0, hoehe = 1, dy = 0, bild = 0;
        const tempo = typeof RedionSpring !== 'undefined' ? RedionSpring.velocityTracker() : null;
        const malen = () => {
            bild = 0;
            m.style.transform = `translateY(${dy.toFixed(1)}px)`;
            grund.style.opacity = String(Math.max(0, Math.min(1, 1 - Math.max(0, dy) / hoehe)));
        };
        m.addEventListener('touchstart', ev => {
            const f = ev.touches[0];
            const ziel = ev.target instanceof Element ? ev.target : null;
            if (!f || weg || !ziel?.closest('.blatt-griff, .blatt-titel')) {
                start = null;
                return;
            }
            basis = ruhig() ? 0 : jetzt();
            halt();
            hoehe = Math.max(1, m.offsetHeight);
            start = f.clientY;
            dy = basis;
            tempo?.reset();
            tempo?.add(f.clientY, ev.timeStamp);
            if (basis)
                malen();
        }, { passive: true });
        m.addEventListener('touchmove', ev => {
            const f = ev.touches[0];
            if (!f || start === null)
                return;
            ev.preventDefault();
            tempo?.add(f.clientY, ev.timeStamp);
            const roh = basis + f.clientY - start;
            dy = roh >= 0 ? roh
                : -(typeof RedionSpring !== 'undefined' ? RedionSpring.rubberband(-roh, Math.min(hoehe, 240)) : -roh * 0.3);
            if (ruhig())
                return;
            if (!bild)
                bild = requestAnimationFrame(malen);
        }, { passive: false });
        const los = (ev) => {
            if (start === null)
                return;
            start = null;
            if (bild) {
                cancelAnimationFrame(bild);
                bild = 0;
            }
            const v = tempo ? tempo.velocity(ev.timeStamp) : 0;
            if ((dy > 90 || (v > 500 && dy > 8)) && (liste?.scrollTop || 0) <= 0)
                geht();
            else
                zurueck(dy);
        };
        m.addEventListener('touchend', los);
        m.addEventListener('touchcancel', los);
        return { herein, geht };
    };
    const zeichenSvg = (k, an) => {
        if (k.kippen && typeof Merkzeichen !== 'undefined') {
            return '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true" focusable="false">' +
                `<path d="${Merkzeichen.BAND}" fill="${an ? 'currentColor' : 'none'}" stroke="currentColor" ` +
                'stroke-width="1.7" stroke-linejoin="round"></path></svg>';
        }
        try {
            return Register.symbole.alsSvg(k.zeichen, 20);
        }
        catch {
            return '';
        }
    };
    const tropfenKopf = (knoepfe) => {
        const kopf = document.createElement('div');
        kopf.className = 'ru-tropfen-kopf';
        for (const k of knoepfe) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ru-tropfen-knopf';
            b.dataset['tropfen'] = k.id;
            b.setAttribute('aria-label', k.name);
            b.title = k.name;
            if (k.kippen)
                b.setAttribute('aria-pressed', k.an ? 'true' : 'false');
            const rund = document.createElement('span');
            rund.className = 'ru-tropfen-rund';
            rund.setAttribute('aria-hidden', 'true');
            rund.innerHTML = zeichenSvg(k, !!k.an);
            const name = document.createElement('span');
            name.className = 'ru-tropfen-name';
            name.setAttribute('aria-hidden', 'true');
            name.textContent = k.name;
            b.append(rund, name);
            kopf.append(b);
        }
        return kopf;
    };
    const tropfenBinden = (m, kopf, knoepfe) => {
        kopf.addEventListener('click', ev => {
            const b = ev.target instanceof Element ? ev.target.closest('.ru-tropfen-knopf') : null;
            const k = b ? knoepfe.find(x => x.id === b.dataset['tropfen']) : undefined;
            if (!b || !k)
                return;
            ev.stopPropagation();
            if (k.kippen) {
                const an = k.kippen();
                b.setAttribute('aria-pressed', an ? 'true' : 'false');
                const rund = b.querySelector('.ru-tropfen-rund');
                if (rund) {
                    rund.innerHTML = zeichenSvg(k, an);
                    const svg = rund.querySelector('svg');
                    if (an && svg && !(typeof Tropfen !== 'undefined' && Tropfen.still())) {
                        const f = typeof RedionSpring !== 'undefined' ? RedionSpring.token('bouncy') : { easing: 'ease-out', duration: 400 };
                        svg.animate([{ scale: '0.7' }, { scale: '1.25', offset: 0.35 }, { scale: '1' }], { duration: f.duration, easing: 'ease-out' });
                    }
                }
                return;
            }
            const eintrag = k.ziel ? m.querySelector(`.menu-liste ${k.ziel}, :scope > ${k.ziel}`) : null;
            if (eintrag) {
                eintrag.click();
                return;
            }
            if (k.tun) {
                m.remove();
                k.tun();
            }
        });
    };
    const amAnker = (m, anker) => {
        const a = anker.getBoundingClientRect();
        const r = m.getBoundingClientRect();
        const LUFT = 6;
        let left = (a.left + a.width / 2 > innerWidth / 2) ? a.right - r.width : a.left;
        let top = a.bottom + LUFT;
        if (top + r.height > innerHeight - 8 && a.top - LUFT - r.height >= 8)
            top = a.top - LUFT - r.height;
        left = Math.max(8, Math.min(left, innerWidth - r.width - 8));
        top = Math.max(8, Math.min(top, innerHeight - r.height - 8));
        m.style.left = left + 'px';
        m.style.top = top + 'px';
    };
    const rechteck = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    const versatzY = (el) => {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none' || typeof DOMMatrixReadOnly === 'undefined')
            return 0;
        try {
            return new DOMMatrixReadOnly(t).m42;
        }
        catch {
            return 0;
        }
    };
    const tropfenAuf = (m, kopf, anker, blatt) => {
        if (typeof Tropfen === 'undefined' || Tropfen.still() || !anker.isConnected)
            return;
        const knoepfe = [...kopf.querySelectorAll('.ru-tropfen-rund')];
        const unten = blatt ? versatzY(m) : 0;
        const ziele = knoepfe.map(rechteck).map(r => ({ ...r, top: r.top - unten }));
        const a = rechteck(anker);
        if (!blatt)
            Tropfen.wachsen(m, a);
        const ankunft = Tropfen.teilen(a, ziele, blatt ? 300 : 40);
        if (!ankunft)
            return;
        const kurve = typeof RedionSpring !== 'undefined' ? RedionSpring.token('press') : { easing: 'ease-out', duration: 320 };
        [...kopf.querySelectorAll('.ru-tropfen-knopf')].forEach((b, i) => {
            b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: ankunft, easing: 'linear', fill: 'backwards' });
            const svg = b.querySelector('.ru-tropfen-rund > svg');
            svg?.animate([{ scale: '0.2' }, { scale: '1' }], { duration: kurve.duration, delay: ankunft + i * 40, easing: kurve.easing, fill: 'backwards' });
        });
    };
    const menu = (html, x, y, opt = {}) => {
        document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
        const m = document.createElement('div');
        m.className = 'menu';
        m.innerHTML = html;
        const kopf = opt.tropfen?.length ? tropfenKopf(opt.tropfen) : null;
        if (kopf && opt.tropfen) {
            m.classList.add('ru-tropfen-menue');
            m.prepend(kopf);
            tropfenBinden(m, kopf, opt.tropfen);
        }
        const anker = opt.anker && opt.anker.isConnected ? opt.anker : null;
        let zuletzt = null;
        const messen = () => {
            if (!kopf || !m.isConnected || m.getAnimations().some(a => a.playState === 'running'))
                return;
            zuletzt = { flaeche: rechteck(m),
                kreise: [...kopf.querySelectorAll('.ru-tropfen-rund')].map(rechteck) };
        };
        let nachmessen = null;
        let grund = null;
        const vorher = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement : null;
        const rueckZiel = opt.rolle === 'menu'
            ? (opt.rueckfokus || anker || vorher) : null;
        const rueck = () => {
            if (rueckZiel && rueckZiel.isConnected)
                rueckZiel.focus({ preventScroll: true });
        };
        const schliessen = () => {
            m.remove();
            grund?.remove();
        };
        const escape = (e) => {
            if (e.key !== 'Escape' || !m.isConnected)
                return;
            e.preventDefault();
            e.stopPropagation();
            schliessen();
            rueck();
        };
        document.addEventListener('keydown', escape, true);
        const waechter = new MutationObserver(() => {
            if (m.isConnected)
                return;
            grund?.remove();
            document.removeEventListener('keydown', escape, true);
            waechter.disconnect();
            nachmessen?.disconnect();
            if (zuletzt && anker && anker.isConnected && typeof Tropfen !== 'undefined' && !m.dataset['abgang']) {
                const z = zuletzt;
                Tropfen.vereinen(z.kreise, rechteck(anker), m.classList.contains('blatt') ? null : z.flaeche);
            }
        });
        if (amTelefon()) {
            m.classList.add('blatt');
            m.setAttribute('aria-label', (opt.titel || 'Menü').slice(0, 80));
            const griff = document.createElement('div');
            griff.className = 'blatt-griff';
            griff.setAttribute('aria-hidden', 'true');
            m.prepend(griff);
            if (opt.titel) {
                const titel = document.createElement('div');
                titel.className = 'blatt-titel';
                titel.textContent = opt.titel;
                griff.after(titel);
            }
            let liste = m.querySelector(':scope > .menu-liste');
            if (!liste) {
                liste = document.createElement('div');
                liste.className = 'menu-liste menu-liste-ohne-suche';
                [...m.childNodes].filter(n => n !== griff &&
                    (!(n instanceof HTMLElement) ||
                        (!n.classList.contains('blatt-titel') && !n.classList.contains('ru-tropfen-kopf'))))
                    .forEach(n => liste.appendChild(n));
                m.appendChild(liste);
            }
            grund = document.createElement('div');
            grund.className = 'menu-grund';
            grund.setAttribute('aria-hidden', 'true');
            document.body.appendChild(grund);
            m.classList.add('auf');
            document.body.appendChild(m);
            const zug = blattBewegung(m, grund, liste, schliessen);
            grund.addEventListener('click', zug.geht);
            waechter.observe(document.body, { childList: true });
            const ziel = liste;
            const kinder = [...ziel.children];
            let karte = null;
            kinder.forEach(el => {
                if (el.tagName === 'HR') {
                    karte = null;
                    el.remove();
                    return;
                }
                if (el.classList.contains('grp') || el.classList.contains('menu-fuss') ||
                    el.classList.contains('menu-suche') || el.classList.contains('av-karte') ||
                    el.classList.contains('av-besch') || el.classList.contains('sp-kopf')) {
                    karte = null;
                    return;
                }
                if (!karte) {
                    karte = document.createElement('div');
                    karte.className = 'blatt-karte';
                    ziel.insertBefore(karte, el);
                }
                karte.appendChild(el);
            });
            m.querySelectorAll('[data-a="del"], [data-a="purge"], [data-gefahr]').forEach(x => x.classList.add('rot'));
            zug.herein();
            if (kopf && anker) {
                tropfenAuf(m, kopf, anker, true);
                const f = typeof RedionSpring !== 'undefined' ? RedionSpring.token('smooth').duration : 320;
                setTimeout(messen, f + 40);
            }
            return m;
        }
        document.body.appendChild(m);
        waechter.observe(document.body, { childList: true });
        if (kopf)
            m.style.setProperty('--ru-tropfen-kopf', kopf.offsetHeight + 'px');
        if (anker)
            amAnker(m, anker);
        else {
            const r = m.getBoundingClientRect();
            m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
            m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
        }
        if (kopf && anker) {
            messen();
            tropfenAuf(m, kopf, anker, false);
            if (typeof ResizeObserver !== 'undefined') {
                nachmessen = new ResizeObserver(messen);
                nachmessen.observe(m);
            }
        }
        if (opt.rolle === 'menu')
            menueRolle(m, opt, rueck);
        setTimeout(() => {
            const zu = (e) => {
                const ziel = e.target instanceof Node ? e.target : null;
                if (!ziel || !m.contains(ziel)) {
                    m.remove();
                    document.removeEventListener('mousedown', zu);
                }
            };
            document.addEventListener('mousedown', zu);
        }, 0);
        return m;
    };
    const menuMitSuche = (html, x, y, opt = {}) => {
        const m = menu((opt.kopf || '') +
            `<div class="menu-suche"><input placeholder="${opt.platzhalter || 'Filtern …'}" ` +
            'autocomplete="off" spellcheck="false"></div>' +
            '<div class="menu-liste">' + html + '</div>' +
            (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''), x, y, {
            ...(opt.titel === undefined ? {} : { titel: opt.titel }),
            ...(opt.anker ? { anker: opt.anker } : {}),
            ...(opt.tropfen ? { tropfen: opt.tropfen } : {})
        });
        if (opt.breite && !m.classList.contains('blatt'))
            m.style.width = String(opt.breite);
        const feld = m.querySelector('.menu-suche input');
        const liste = m.querySelector('.menu-liste');
        if (!feld || !liste)
            return m;
        const sichtbare = () => [...liste.querySelectorAll('button')]
            .filter(b => b.offsetParent !== null || b.style.display !== 'none')
            .filter(b => b.style.display !== 'none' &&
            (!(b.parentElement instanceof HTMLElement) ||
                !b.parentElement.style.display ||
                b.parentElement.style.display !== 'none'));
        const markiere = (b) => {
            liste.querySelectorAll('button.jetzt').forEach(x2 => x2.classList.remove('jetzt'));
            if (!b) {
                SelectionFlow.highlight(liste, null, { still: true });
                return;
            }
            b.classList.add('jetzt');
            b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            SelectionFlow.highlight(liste, b, { still: true });
        };
        const filtern = () => {
            const q = feld.value.trim().toLowerCase();
            let gruppe = null, inGruppe = 0;
            const abschliessen = () => {
                if (gruppe && !inGruppe)
                    gruppe.style.display = 'none';
            };
            [...liste.children].forEach(kind => {
                if (!(kind instanceof HTMLElement))
                    return;
                const el = kind;
                if (el.classList.contains('grp')) {
                    abschliessen();
                    gruppe = el;
                    inGruppe = 0;
                    el.style.display = '';
                    return;
                }
                if (el.tagName === 'HR') {
                    el.style.display = q ? 'none' : '';
                    return;
                }
                const knoepfe = el.tagName === 'BUTTON'
                    ? [el] : [...el.querySelectorAll('button')];
                if (!knoepfe.length)
                    return;
                let sichtbar = 0;
                knoepfe.forEach(b => {
                    const treffer = !q || (b.textContent || '').toLowerCase().includes(q);
                    b.style.display = treffer ? '' : 'none';
                    if (treffer)
                        sichtbar++;
                });
                if (el.tagName !== 'BUTTON')
                    el.style.display = sichtbar ? '' : 'none';
                inGruppe += sichtbar;
            });
            abschliessen();
            markiere(sichtbare()[0]);
        };
        feld.addEventListener('input', filtern);
        feld.addEventListener('keydown', e => {
            const alle = sichtbare();
            const i = alle.findIndex(b => b.classList.contains('jetzt'));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                markiere(alle[Math.min(i + 1, alle.length - 1)]);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                markiere(alle[Math.max(i - 1, 0)]);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                (alle[i] || alle[0])?.click();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                m.remove();
            }
        });
        liste.addEventListener('mousemove', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const b = ziel?.closest('button');
            if (b && !b.classList.contains('jetzt'))
                markiere(b);
        });
        markiere(sichtbare()[0]);
        setTimeout(() => feld.focus(), 30);
        return m;
    };
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const zeichenVon = (name) => {
        if (!name || typeof Register === 'undefined' || !Register.symbole)
            return '';
        try {
            return Register.symbole.hat?.(name) === false ? '' : Register.symbole.alsSvg(name, 16);
        }
        catch {
            return '';
        }
    };
    const eintraege = (m) => [...m.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')]
        .filter(b => !b.disabled && b.getClientRects().length > 0);
    const menueRolle = (m, opt, rueck) => {
        m.setAttribute('role', 'menu');
        if (opt.beschriftung)
            m.setAttribute('aria-label', opt.beschriftung.slice(0, 120));
        m.querySelectorAll('button').forEach(b => {
            if (b.closest('.ru-tropfen-kopf')) {
                b.tabIndex = -1;
                return;
            }
            if (!b.getAttribute('role'))
                b.setAttribute('role', 'menuitem');
            b.tabIndex = -1;
        });
        m.querySelectorAll('hr, .sep').forEach(x => x.setAttribute('role', 'separator'));
        m.querySelectorAll('.grp').forEach(x => x.setAttribute('role', 'presentation'));
        m.addEventListener('keydown', e => {
            const liste = eintraege(m);
            if (!liste.length)
                return;
            const i = liste.indexOf(document.activeElement);
            let ziel;
            if (e.key === 'ArrowDown')
                ziel = liste[(i + 1) % liste.length];
            else if (e.key === 'ArrowUp')
                ziel = liste[(i - 1 + liste.length) % liste.length];
            else if (e.key === 'Home')
                ziel = liste[0];
            else if (e.key === 'End')
                ziel = liste[liste.length - 1];
            if (ziel) {
                e.preventDefault();
                e.stopPropagation();
                ziel.focus({ preventScroll: false });
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                m.remove();
                rueck();
            }
        });
        if (opt.fokus) {
            const liste = eintraege(m);
            const aktiv = opt.fokus === 'aktiv'
                ? liste.find(b => b.getAttribute('aria-current') === 'true') : undefined;
            (aktiv || liste[0])?.focus({ preventScroll: true });
        }
    };
    const aktionen = (ding, ort, wo = {}) => {
        const R = typeof Register !== 'undefined' ? Register.aktionen : null;
        if (!R || !ding)
            return null;
        const zeilen = R.fuer(ding, ort);
        if (!zeilen.length)
            return null;
        let html = '', gruppe = '';
        for (const z of zeilen) {
            if (gruppe && z.gruppe !== gruppe)
                html += '<hr>';
            gruppe = z.gruppe;
            html += `<button type="button" data-a="${esc(z.id)}"${z.gefahr ? ' data-gefahr' : ''}>` +
                `<span class="mi">${zeichenVon(z.zeichen)}</span>${esc(z.name)}` +
                (z.taste ? `<span class="ms">${esc(z.taste)}</span>` : '') + '</button>';
        }
        const name = String(ding.text || '').trim() || 'Ohne Titel';
        const anker = ort.anker && ort.anker.isConnected ? ort.anker : null;
        const amZeiger = typeof wo.x === 'number' && typeof wo.y === 'number';
        let x = wo.x ?? 0, y = wo.y ?? 0;
        if (!amZeiger && anker) {
            const r = anker.getBoundingClientRect();
            x = r.left;
            y = r.bottom + 4;
        }
        const m = menu(html, x, y, {
            titel: name, rolle: 'menu', beschriftung: 'Aktionen für „' + name + '“', fokus: 'erster',
            rueckfokus: wo.rueckfokus ?? anker,
            ...(amZeiger || !anker ? {} : { anker })
        });
        m.addEventListener('click', e => {
            const b = e.target instanceof Element ? e.target.closest('button[data-a]') : null;
            if (!b || !m.contains(b))
                return;
            const id = b.dataset['a'] || '';
            m.remove();
            const frisch = (typeof Store !== 'undefined' && Store.getBlock(ding.id)) || ding;
            Register.aktionen.tun(id, frisch, ort);
        });
        return m;
    };
    let schluckerWeg = null;
    const nachzuegler = () => {
        const schlucken = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        const arten = ['mousedown', 'mouseup', 'click'];
        arten.forEach(t => document.addEventListener(t, schlucken, { capture: true, once: true }));
        const weg = () => {
            arten.forEach(t => document.removeEventListener(t, schlucken, { capture: true }));
            if (schluckerWeg === weg)
                schluckerWeg = null;
        };
        schluckerWeg = weg;
        setTimeout(weg, 800);
    };
    const nachzueglerWeg = () => { if (schluckerWeg)
        schluckerWeg(); };
    const HALTEN_MS = 500;
    const WEG_PX = 10;
    const gebunden = new WeakMap();
    const aktionenBinden = (wurzel, auftrag) => {
        if (gebunden.has(wurzel)) {
            gebunden.set(wurzel, auftrag);
            return;
        }
        gebunden.set(wurzel, auftrag);
        const a = () => gebunden.get(wurzel) || auftrag;
        const dingVon = (t) => {
            const el = t instanceof Element ? t.closest(a().auswahl) : null;
            return el && wurzel.contains(el) ? el : null;
        };
        let finger = false;
        let zuletztHalt = 0, zuletztTaste = 0;
        let halt = null;
        const abbrechen = () => {
            if (!halt)
                return;
            clearTimeout(halt.uhr);
            delete halt.el.dataset['gehoben'];
            halt = null;
        };
        wurzel.addEventListener('contextmenu', e => {
            const el = dingVon(e.target);
            if (!el)
                return;
            if (finger || Date.now() - zuletztHalt < 900 || (Date.now() - zuletztTaste < 400 && e.button !== 2)) {
                e.preventDefault();
                return;
            }
            if (e.shiftKey && e.button === 2)
                return;
            if (a().oeffnen(el, { x: e.clientX, y: e.clientY, tastatur: false }) !== false)
                e.preventDefault();
        });
        wurzel.addEventListener('keydown', e => {
            const el = dingVon(e.target);
            if (!el || e.target !== el)
                return;
            if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                e.preventDefault();
                e.stopPropagation();
                zuletztTaste = Date.now();
                a().oeffnen(el, { tastatur: true });
                return;
            }
            const entf = a().entf;
            if (e.key === 'Delete' && entf && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                if (entf(el) !== false) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });
        wurzel.addEventListener('touchstart', e => {
            finger = true;
            nachzueglerWeg();
            abbrechen();
            const h = a().halten;
            if (h === false || e.touches.length !== 1)
                return;
            const el = dingVon(e.target);
            const t = e.touches[0];
            if (!el || !t || (typeof h === 'string' && !el.matches(h)))
                return;
            const neu = { el, x: t.clientX, y: t.clientY, gehoben: false, uhr: 0 };
            neu.uhr = window.setTimeout(() => {
                if (halt !== neu || !el.isConnected)
                    return;
                neu.gehoben = true;
                el.dataset['gehoben'] = '';
                if (navigator.vibrate)
                    navigator.vibrate(12);
            }, HALTEN_MS);
            halt = neu;
        }, { passive: true });
        wurzel.addEventListener('touchmove', e => {
            const t = e.touches[0];
            if (!halt || !t)
                return;
            if (Math.abs(t.clientX - halt.x) > WEG_PX || Math.abs(t.clientY - halt.y) > WEG_PX)
                abbrechen();
        }, { passive: true });
        wurzel.addEventListener('touchend', e => {
            if (e.touches.length)
                return;
            finger = false;
            if (!halt)
                return;
            const { el, gehoben } = halt;
            abbrechen();
            if (!gehoben || !el.isConnected)
                return;
            zuletztHalt = Date.now();
            nachzuegler();
            a().oeffnen(el, { tastatur: true });
        });
        wurzel.addEventListener('touchcancel', () => { finger = false; abbrechen(); });
    };
    const wahl = (w) => {
        const html = w.gruppen.map(g => (g.name ? `<div class="grp">${esc(g.name)}</div>` : '') +
            g.optionen.map(o => `<button type="button" role="menuitemradio" data-wahl="${esc(o.id)}" ` +
                `aria-checked="${o.aktiv ? 'true' : 'false'}"${o.aktiv ? ' aria-current="true"' : ''}>` +
                `<span class="mi">${o.zeichen ? zeichenVon(o.zeichen) : ''}</span>${esc(o.name)}` +
                `<span class="ms wahl-haken" aria-hidden="true">${o.aktiv ? '✓' : ''}</span></button>`).join('')).join('<hr>');
        const r = w.anker.getBoundingClientRect();
        w.anker.setAttribute('aria-haspopup', 'menu');
        w.anker.setAttribute('aria-expanded', 'true');
        const m = menu(html, r.left, r.bottom + 4, {
            titel: w.titel, rolle: 'menu', beschriftung: w.titel, fokus: 'aktiv',
            rueckfokus: w.anker, anker: w.anker
        });
        const zu = () => { w.anker.setAttribute('aria-expanded', 'false'); };
        const wache = new MutationObserver(() => { if (!m.isConnected) {
            zu();
            wache.disconnect();
        } });
        wache.observe(document.body, { childList: true });
        m.addEventListener('click', e => {
            const b = e.target instanceof Element ? e.target.closest('[data-wahl]') : null;
            if (!b || !m.contains(b))
                return;
            m.remove();
            zu();
            if (w.anker.isConnected)
                w.anker.focus({ preventScroll: true });
            w.beiWahl(b.dataset['wahl'] || '');
        });
        return m;
    };
    return { menu, menuMitSuche, amTelefon, aktionen, aktionenBinden, wahl,
        nachzuegler, nachzueglerWeg, HALTEN_MS };
})();
window.Menue = Menue;
