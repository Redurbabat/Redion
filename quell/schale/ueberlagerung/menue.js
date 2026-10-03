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
    const menu = (html, x, y, opt = {}) => {
        document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
        const m = document.createElement('div');
        m.className = 'menu';
        m.innerHTML = html;
        let grund = null;
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
        };
        document.addEventListener('keydown', escape, true);
        const waechter = new MutationObserver(() => {
            if (m.isConnected)
                return;
            grund?.remove();
            document.removeEventListener('keydown', escape, true);
            waechter.disconnect();
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
                    (!(n instanceof HTMLElement) || !n.classList.contains('blatt-titel')))
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
            m.querySelectorAll('[data-a="del"], [data-a="purge"]').forEach(x => x.classList.add('rot'));
            zug.herein();
            return m;
        }
        document.body.appendChild(m);
        waechter.observe(document.body, { childList: true });
        const r = m.getBoundingClientRect();
        m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
        m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
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
            (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''), x, y, opt.titel === undefined ? {} : { titel: opt.titel });
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
            if (!b)
                return;
            b.classList.add('jetzt');
            b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
    return { menu, menuMitSuche, amTelefon };
})();
window.Menue = Menue;
