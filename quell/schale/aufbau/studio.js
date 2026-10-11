"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/studio.ts (npm run bauen:ts). */
const StudioSchale = (() => {
    let gestartet = false;
    const META = 'studio:navigation-kompakt';
    const BREITE = 'studio:navigation-breite';
    const bewegt = new Set();
    const ruhig = matchMedia('(prefers-reduced-motion: reduce)');
    ruhig.addEventListener('change', () => {
        if (ruhig.matches) {
            bewegt.forEach(a => a.cancel());
            bewegt.clear();
        }
    });
    const ankommen = (element, x = 0, y = 6, delay = 0) => {
        const still = ruhig.matches || (typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung());
        if (!element || still || document.hidden || typeof element.animate !== 'function')
            return;
        if (element.closest('#scroll.wisch-links, #scroll.wisch-rechts'))
            return;
        const tokens = getComputedStyle(document.documentElement);
        const zeit = tokens.getPropertyValue('--motion-normal').trim();
        const duration = parseFloat(zeit) * (zeit.endsWith('ms') ? 1 : 1000) || 200;
        const animation = element.animate([
            { opacity: .35, transform: `translate(${x}px,${y}px)` },
            { opacity: 1, transform: 'none' }
        ], { duration, delay, fill: 'backwards', easing: tokens.getPropertyValue('--ease-enter').trim() || 'ease-out' });
        bewegt.add(animation);
        animation.onfinish = animation.oncancel = () => { bewegt.delete(animation); };
    };
    const breiteSetzen = (wert) => {
        const breite = Math.max(148, Math.min(260, Math.round(wert)));
        document.body.style.setProperty('--studio-nav-expanded', breite + 'px');
        return breite;
    };
    const gezeichnet = () => Math.round(Kontextkante.wurzel()?.getBoundingClientRect().width || 0);
    const ariaNachziehen = () => {
        const divider = document.getElementById('studio-divider');
        const breite = gezeichnet();
        if (!divider || breite < 148 || breite > 260 || document.body.dataset.studioNav === 'kompakt' ||
            !matchMedia('(min-width: 761px)').matches)
            return;
        divider.setAttribute('aria-valuenow', String(breite));
        divider.setAttribute('aria-valuetext', breite + ' Pixel breit');
    };
    const breiteZuruecksetzen = () => {
        document.body.style.removeProperty('--studio-nav-expanded');
        Store.setMeta(BREITE, null);
        ariaNachziehen();
        Kontextkante.zeichne();
        UI.toast('Breite zurückgesetzt');
    };
    const themaKuerzel = () => (typeof Aussehen !== 'undefined' ? Aussehen.kuerzelVon('hell') : 'Ctrl+Shift+L');
    const themaMarkieren = () => {
        const hell = document.documentElement.dataset.theme === 'light';
        const b = document.getElementById('studio-theme');
        if (!b)
            return;
        b.setAttribute('aria-checked', String(!hell));
        const teile = themaKuerzel().split(/\+(?=.)/).filter(Boolean);
        if (teile.length)
            b.setAttribute('aria-keyshortcuts', teile.map(t => (t === 'Ctrl' ? 'Control' : t)).join('+'));
        else
            b.removeAttribute('aria-keyshortcuts');
        const zeigen = teile.map(t => (t === 'Ctrl' ? 'Strg' : t === 'Shift' ? '⇧' : t)).join(' ');
        b.title = (hell ? 'Zum dunklen Schema wechseln' : 'Zum hellen Schema wechseln') + (zeigen ? ' (' + zeigen + ')' : '');
    };
    const themaWechseln = () => {
        if (typeof Aussehen !== 'undefined')
            Aussehen.grundWechseln();
        else
            Einstellungen.S('theme', document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
        themaMarkieren();
    };
    const einstellen = (kompakt) => {
        document.body.dataset.studioNav = kompakt ? 'kompakt' : 'offen';
        const knopf = document.getElementById('studio-nav');
        knopf?.setAttribute('aria-pressed', String(kompakt));
        const name = kompakt ? 'Navigation mit Beschriftungen anzeigen' : 'Navigation kompakt anzeigen';
        knopf?.setAttribute('aria-label', name);
        if (knopf)
            knopf.title = name;
    };
    const start = () => {
        if (gestartet)
            return;
        gestartet = true;
        einstellen(Store.getMeta(META, false) === true);
        const gespeichert = Store.getMeta(BREITE, null);
        const zahl = typeof gespeichert === 'number' ? gespeichert
            : typeof gespeichert === 'string' && gespeichert.trim() ? Number(gespeichert) : NaN;
        if (Number.isFinite(zahl))
            breiteSetzen(zahl);
        const an = (id, tun) => {
            document.getElementById(id)?.addEventListener('click', tun);
        };
        an('studio-home', () => Bibliothek.oeffne());
        an('studio-search', () => App.suche());
        an('studio-create', () => App.erstellenBlatt(document.getElementById('studio-create')));
        an('studio-import', () => Bibliothek.pdfImportieren());
        an('studio-account', () => App.arbeitsbereich());
        an('studio-glocke', () => { try {
            Ansichten.posteingang();
        }
        catch { } });
        Hinweis.faecherBinden(document.getElementById('studio-glocke'));
        an('studio-auftraege', () => {
            if (typeof AuftragsAnzeige !== 'undefined')
                AuftragsAnzeige.oeffnen();
        });
        an('studio-tools', () => {
            if (document.body.dataset.studioTools === 'offen')
                Menueband.schliessen();
            else
                Menueband.aufklappen();
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || document.body.dataset.studioTools !== 'offen')
                return;
            if (document.querySelector('.overlay,.menu,[role="dialog"]'))
                return;
            Menueband.schliessen();
            document.getElementById('studio-tools')?.focus();
        });
        an('studio-theme', themaWechseln);
        new MutationObserver(themaMarkieren).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        const gestirn = document.getElementById('studio-theme');
        gestirn?.addEventListener('pointerenter', themaMarkieren);
        gestirn?.addEventListener('focus', themaMarkieren);
        themaMarkieren();
        const divider = document.getElementById('studio-divider');
        const kante = Kontextkante.wurzel();
        if (kante && typeof ResizeObserver !== 'undefined')
            new ResizeObserver(ariaNachziehen).observe(kante);
        ariaNachziehen();
        let zug = null;
        let bild = 0;
        const merken = () => { Store.setMeta(BREITE, gezeichnet()); Kontextkante.zeichne(); };
        const zugEnde = () => {
            cancelAnimationFrame(bild);
            bild = 0;
            zug = null;
            document.body.classList.remove('studio-resizing');
        };
        const zugZurueck = () => {
            if (!zug)
                return;
            if (zug.vorher)
                document.body.style.setProperty('--studio-nav-expanded', zug.vorher);
            else
                document.body.style.removeProperty('--studio-nav-expanded');
            zugEnde();
        };
        divider?.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0)
                return;
            zug = { id: event.pointerId, x: event.clientX, breite: gezeichnet(), letzteX: event.clientX,
                vorher: document.body.style.getPropertyValue('--studio-nav-expanded'), bewegt: false };
            divider.setPointerCapture(event.pointerId);
            event.preventDefault();
            document.body.classList.add('studio-resizing');
        });
        divider?.addEventListener('pointermove', event => {
            if (zug?.id !== event.pointerId)
                return;
            zug.letzteX = event.clientX;
            if (zug.letzteX !== zug.x)
                zug.bewegt = true;
            if (!bild)
                bild = requestAnimationFrame(() => {
                    bild = 0;
                    if (zug?.bewegt)
                        breiteSetzen(zug.breite + zug.letzteX - zug.x);
                });
        });
        divider?.addEventListener('pointerup', event => {
            if (zug?.id !== event.pointerId)
                return;
            const z = zug;
            if (event.clientX !== z.x) {
                z.letzteX = event.clientX;
                z.bewegt = true;
            }
            if (z.bewegt)
                breiteSetzen(z.breite + z.letzteX - z.x);
            zugEnde();
            if (z.bewegt && gezeichnet() !== z.breite)
                merken();
        });
        divider?.addEventListener('pointercancel', event => { if (zug?.id === event.pointerId)
            zugZurueck(); });
        divider?.addEventListener('lostpointercapture', event => { if (zug?.id === event.pointerId)
            zugZurueck(); });
        window.addEventListener('keydown', event => {
            if (!zug || event.key !== 'Escape')
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const id = zug.id;
            zugZurueck();
            if (divider?.hasPointerCapture(id))
                divider.releasePointerCapture(id);
        }, true);
        const SCHRITT = { ArrowLeft: -8, ArrowRight: 8, PageDown: -32, PageUp: 32 };
        divider?.addEventListener('keydown', event => {
            const jetzt = gezeichnet();
            const schritt = SCHRITT[event.key];
            let ziel;
            if (event.key === 'Home')
                ziel = 148;
            else if (event.key === 'End')
                ziel = 260;
            else if (schritt !== undefined)
                ziel = jetzt + schritt * (event.shiftKey && event.key.startsWith('Arrow') ? 4 : 1);
            else
                return;
            event.preventDefault();
            breiteSetzen(ziel);
            ariaNachziehen();
            if (gezeichnet() !== jetzt)
                merken();
        });
        divider?.addEventListener('dblclick', () => breiteZuruecksetzen());
        if (typeof Register !== 'undefined' && Register.befehle)
            Register.befehle.melde({
                gruppe: 'Ansicht', titel: 'Navigationsbreite zurücksetzen', tun: breiteZuruecksetzen,
                zeigen: () => matchMedia('(min-width: 761px)').matches && document.body.dataset.schale === 'premium' &&
                    document.body.dataset.studioNav !== 'kompakt' && document.body.dataset.dokument !== 'an' &&
                    !document.body.classList.contains('fokus')
            });
        an('studio-nav', () => {
            const kompakt = document.body.dataset.studioNav !== 'kompakt';
            einstellen(kompakt);
            Store.setMeta(META, kompakt);
            Kontextkante.zeichne();
        });
        const bar = document.getElementById('studio-bar');
        if (bar)
            Register.symbole.fuelle(bar);
        let letzterOrt = location.hash;
        let frame = 0;
        const ortBelebt = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (letzterOrt === location.hash)
                    return;
                letzterOrt = location.hash;
                bewegt.forEach(a => a.cancel());
                bewegt.clear();
                ankommen(document.querySelector('#page .bib-dkopf,#page .bib-titel,#page .aw-kopf'));
                document.querySelectorAll('#page .bib-gitter > :is(.bib-deckel, .bib-zelle):nth-child(-n+6)')
                    .forEach((karte, i) => ankommen(karte, 0, 8, i * 24));
            });
        };
        window.addEventListener('redion:schauplatz', ortBelebt);
        window.addEventListener('hashchange', ortBelebt);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                bewegt.forEach(a => a.cancel());
                bewegt.clear();
            }
        });
    };
    return { start, themaWechseln, breiteZuruecksetzen };
})();
