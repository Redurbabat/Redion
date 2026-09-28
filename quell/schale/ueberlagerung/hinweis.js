"use strict";
/* ============================================================================
 * schale/ueberlagerung/hinweis.js — Toast und Banner
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/hinweis.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/hinweis.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Arten, etwas zu sagen, und sie werden gern verwechselt:
 *
 *   **Toast** — verschwindet von selbst. Für Bestätigungen: „Gespeichert",
 *   „3 Zeilen gelöscht". Wer ihn verpasst, hat nichts verpasst.
 *
 *   **Banner** — bleibt, bis jemand ihn wegklickt. Für Dinge, die man wissen
 *   muss: „Der Speicher ist hier gesperrt", „Der Schlüssel passt nicht".
 *
 * Ein Toast für etwas Wichtiges ist der häufigste Fehler in Oberflächen: die
 * Meldung erscheint, während man woanders hinsieht, und ist weg, bevor man
 * sie liest.
 * ==========================================================================*/
const Hinweis = (() => {
    let toastTimer;
    let aeltere = [];
    let zaehler = 0;
    /** Wem `#toast` gerade gehört (die Nummer des Aufrufs) und bis wann. */
    let eigner = 0;
    let toastBis = 0;
    const HOECHSTENS = 2; /* neben der neuesten: drei im Ganzen */
    const LUECKE = 8;
    const ruhig = () => typeof SelectionFlow !== 'undefined' ? SelectionFlow.ruhig()
        : matchMedia('(prefers-reduced-motion: reduce)').matches;
    /** Nutzertext nie roh ins HTML (§19). */
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
    /** Über (oder unter) `#toast`, aus seinem LAYOUT — er fährt vielleicht noch. */
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
    /** Was in `#toast` steht und einem ANDEREN Aufruf gehört, rückt zur Seite;
     *  ein Fortschritt (E116) stapelt sich nicht selbst. */
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
        /* 2,2 s lesbar, höchstens 6 s. */
        const bleibt = Math.min(6000, Math.max(2200, toastBis - Date.now()));
        eintrag.uhr = setTimeout(() => gehen(eintrag), bleibt);
        requestAnimationFrame(ordnen);
        ordnen();
    };
    /** Escape ohne Fenster (E302): alles abräumen. */
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
    /* WISCHEN: ein waagerechter Zug über 12 px, der auf einer Karte begann,
       gehört ihr (`wischen.ts` hört ihn dann nicht); über 40 % oder schnell: weg. */
    let zug = null;
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
    addEventListener('pointerdown', (e) => {
        zug = null;
        if (e.pointerType !== 'touch')
            return;
        const z = trifft(e.clientX, e.clientY);
        if (z)
            zug = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, ...z, gefangen: false };
    }, { capture: true, passive: true });
    addEventListener('pointermove', (e) => {
        if (!zug || e.pointerId !== zug.id)
            return;
        const dx = e.clientX - zug.x0, dy = e.clientY - zug.y0;
        if (!zug.gefangen) {
            if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 12) {
                if (Math.abs(dy) > 12)
                    zug = null;
                return;
            }
            zug.gefangen = true;
        }
        e.stopPropagation();
        zug.el.style.translate = dx.toFixed(1) + 'px 0';
        zug.el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 260));
    }, { capture: true, passive: true });
    const zugEnde = (e) => {
        if (!zug || e.pointerId !== zug.id)
            return;
        const z = zug;
        zug = null;
        if (!z.gefangen)
            return;
        e.stopPropagation();
        const dx = e.clientX - z.x0;
        const schnell = Math.abs(dx) / Math.max(1, e.timeStamp - z.t0) > 0.6;
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
    addEventListener('pointerup', zugEnde, { capture: true });
    addEventListener('pointercancel', zugEnde, { capture: true });
    /* ------------------------------------------------------------------------
     * EIN FUND DES UMZUGS. Hier stand `document.getElementById('toast')` und
     * danach sofort `t.textContent = text` — ohne nachzusehen, ob es das
     * Element gibt.
     *
     * Meistens gibt es das. Aber `UI.toast` wird aus dreihundert Stellen
     * gerufen, auch aus welchen, die vor dem Aufbau der Schale laufen oder
     * wenn sie gar nicht da ist. Dort wirft die Zeile — und der Aufrufer
     * bricht mitten in seiner Arbeit ab, obwohl er nur etwas SAGEN wollte.
     *
     * Eine Meldung darf niemals das kaputtmachen, worüber sie berichtet.
     * Fehlt das Element, geht die Meldung in die Konsole und der Griff, den
     * `toast` zurückgibt, tut nichts — statt beim ersten Anfassen zu werfen.
     * ----------------------------------------------------------------------*/
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
            /* JEDE MELDUNG HÄLT SICH SELBST AM LEBEN (E116).
               Vorher stand hier `if (t.classList.contains('show'))` — geschrieben
               wurde also nur, solange der Balken ohnehin noch stand. Das ist genau
               andersherum gedacht als der Zweck: `dauer` ist bei einem Fortschritt
               120 000 ms, aber JEDE fremde Meldung dazwischen setzt `toastTimer`
               neu und nimmt die 120 Sekunden mit. Danach war der Fortschritt für
               den Rest des Laufs stumm — im langen Lauf, für den er da ist.
               Jetzt setzt jede Fortschreibung Text, Sichtbarkeit UND Uhr neu. Eine
               fremde Meldung dazwischen ist damit kurz zu sehen und wird von der
               nächsten Fortschreibung abgelöst, statt sie zu töten. */
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
                /* Nur die eigene Meldung nehmen, eine fremde bleibt stehen. */
                aeltere.filter(a => a.id === id).forEach(gehen);
                if (eigner !== id && eigner !== 0)
                    return;
                clearTimeout(toastTimer);
                t.classList.remove('show');
            }
        };
    };
    /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
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
    /* ==========================================================================
     * DER LEERE ZUSTAND
     * --------------------------------------------------------------------------
     * Ein Bereich ohne Inhalt darf nicht einfach leer sein. Leer heisst für den,
     * der davorsitzt: „hier ist nichts" — und er weiss nicht, ob das an ihm
     * liegt, an der App oder daran, dass er noch nichts angelegt hat.
     *
     * Drei Sätze beantworten das:
     *   ÜBERSCHRIFT   was hier steht, wenn etwas hier steht
     *   TEXT          warum gerade nichts da ist
     *   HANDLUNG      was man jetzt tun kann — als Verweis, nicht als Knopf
     *
     * Die Handlung ist absichtlich ein blauer Verweis und kein voller Knopf:
     * ein leerer Bereich ist keine Aufforderung, sondern ein Angebot. Ein
     * grosser bunter Knopf mitten auf einem leeren Bildschirm drängt.
     *
     * Diese Form stand schon im Posteingang, dort abgeschrieben. Jetzt steht
     * sie einmal hier — die Fassungen liefen sonst auseinander, und drei
     * verschiedene leere Zustände sind schlimmer als einer, der überall gleich
     * aussieht.
     * ========================================================================*/
    const leer = (o) => '<div class="pe-leer">' +
        `<div class="pe-ico">${o.zeichen}</div>` +
        `<div class="pe-gross">${o.gross}</div>` +
        `<div class="pe-klein">${o.klein}</div>` +
        (o.handlung
            ? `<button class="pe-link"${o.daten ? ' ' + o.daten : ''}>${o.handlung}</button>`
            : '') +
        '</div>';
    /* DER FÄCHER AN DER GLOCKE (E711, Szene 08). Der Klick bleibt der
       Posteingang (§43); DAZU fächern beim Zeigen, langen Drücken oder ↓ die
       letzten drei Meldungen auf, mit „Alle gelesen" (E276: gelesen, nicht
       leeren) und „Posteingang öffnen". */
    let faecher = null;
    let faecherGlocke = null;
    let faecherUhr;
    let faecherZu;
    const faecherOffen = () => !!faecher && !faecher.hidden;
    const faecherSchliessen = (sofort = false) => {
        clearTimeout(faecherUhr);
        clearTimeout(faecherZu);
        const f = faecher;
        if (!f || f.hidden)
            return;
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
        catch { /* ohne Posteingang bleibt es beim Fächer */ }
    };
    /** „Alle gelesen": die Karten fliessen zäh in die Glocke (EIN Goo-Filter, nur jetzt). */
    const allesGelesen = () => {
        const f = faecher, g = faecherGlocke;
        const ziel = g && g.offsetParent !== null ? g.getBoundingClientRect() : null;
        let wie = 0;
        try {
            wie = Werkzeuge.meldungenAlleGelesen() || 0;
        }
        catch { /* ohne Werkzeuge bleibt der Stand */ }
        /* Wie der Knopf im Posteingang — vorgelesen; das Fliessen ist nur Bild. */
        if (wie)
            toast(wie === 1 ? '1 Meldung als gelesen markiert' : wie + ' Meldungen als gelesen markiert');
        if (!f || !ziel || ruhig()) {
            faecherSchliessen(true);
            return;
        }
        const ebene = f.querySelector('.ru-faecher-karten');
        const karten = [...f.querySelectorAll('.ru-meldung')];
        if (!ebene || !karten.length) {
            faecherSchliessen(true);
            return;
        }
        f.classList.add('fliesst');
        SelectionFlow.goo(ebene, true);
        const mx = ziel.left + ziel.width / 2, my = ziel.top + ziel.height / 2;
        const bahnen = karten.map((k, n) => {
            const r = k.getBoundingClientRect();
            const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
            const s = Math.max(0.08, Math.min(ziel.width / r.width, 0.5));
            return k.animate([
                { transform: 'none' },
                { transform: 'translate(' + (dx * 0.35).toFixed(1) + 'px,' + (dy * 0.55).toFixed(1) + 'px) scale(.9,.8)', offset: 0.45 },
                { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')', opacity: 0.4 }
            ], { duration: 460 + n * 30, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
        });
        f.querySelector('.ru-faecher-fuss')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
        const ende = () => {
            SelectionFlow.goo(ebene, false);
            f.classList.remove('fliesst');
            bahnen.forEach(b => b.cancel());
            faecherSchliessen(true);
            g?.animate([{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 320, easing: RedionSpring.token('press').easing });
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
            catch { /* bleibt ungelesen */ }
            faecherSchliessen(true);
            if (m?.seite)
                App.oeffne(m.seite);
            else
                zuDenMeldungen();
        });
        f.addEventListener('keydown', (e) => {
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
    const faecherOeffnen = (glocke, fokus = false) => {
        clearTimeout(faecherUhr);
        clearTimeout(faecherZu);
        if (typeof Werkzeuge === 'undefined' || glocke.hidden || glocke.offsetParent === null)
            return;
        const liste = Werkzeuge.meldungen().slice(0, 3);
        if (!liste.length)
            return;
        const f = faecherBauen();
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
        f.hidden = false;
        const g = glocke.getBoundingClientRect();
        const breite = Math.min(340, innerWidth - 16);
        f.style.width = breite + 'px';
        f.style.left = Math.max(8, Math.min(g.right - breite, innerWidth - breite - 8)) + 'px';
        f.style.top = (g.bottom + 8) + 'px';
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
        if (fokus)
            f.querySelector('button')?.focus();
    };
    /** Eine Glocke bekommt den Fächer — einmal, der Klick bleibt ihrer. */
    const faecherBinden = (glocke) => {
        if (!glocke || glocke.dataset['faecher'] === 'an')
            return;
        glocke.dataset['faecher'] = 'an';
        glocke.setAttribute('aria-haspopup', 'true');
        let lang;
        let schlucken = false;
        let x0 = 0, y0 = 0;
        glocke.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse')
                return;
            clearTimeout(faecherZu);
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
        /* Nach langem Drücken ist der Klick keiner (sonst öffnete er auch den Posteingang). */
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
    /** Escape ohne Fenster (E302): erst der Fächer, dann der Stapel. */
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
