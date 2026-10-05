"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/zeitmesser.ts (npm run bauen:ts). */
const Zeitmesser = (() => {
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const MERKGRENZE = 50;
    let lauf = null;
    let ticker = null;
    const SCHLAF_GRENZE_MS = 30 * 1000;
    const SICHERN_ALLE_MS = 5 * 1000;
    const LAUFEND = 'zeit:laufend';
    const laufendSichern = () => {
        if (typeof Store === 'undefined')
            return;
        Store.setMeta(LAUFEND, lauf ? { ...lauf } : null);
        if (lauf)
            lauf.gesichert = Date.now();
    };
    const sitzungen = () => {
        const roh = Store.getMeta('zeit:sitzungen', []);
        return Array.isArray(roh) ? roh : [];
    };
    const uhrText = (sek) => {
        const s = Math.max(0, Math.round(sek));
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const mm = String(m % 60).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
    };
    const restSek = () => !lauf ? 0
        : lauf.art === 'timer' ? Math.max(0, lauf.sollSek - lauf.vergangenSek)
            : lauf.vergangenSek;
    const seiteJetzt = () => {
        const id = (typeof App !== 'undefined' && App.aktuelleSeite && App.aktuelleSeite()) || '';
        const p = id ? Store.getBlock(id) : null;
        return { id: String(id || ''), name: String(p?.text || '').trim() || 'Ohne Seite' };
    };
    const merken = () => {
        if (!lauf || lauf.vergangenSek < 5)
            return;
        const liste = sitzungen();
        liste.unshift({
            art: lauf.art, beginn: lauf.beginn,
            dauerSek: Math.round(lauf.vergangenSek),
            sollSek: lauf.sollSek || 0,
            seiteId: lauf.seiteId, seitenName: lauf.seitenName
        });
        Store.setMeta('zeit:sitzungen', liste.slice(0, MERKGRENZE));
    };
    const tick = () => {
        if (!lauf)
            return;
        const jetzt = Date.now();
        const delta = jetzt - lauf.zuletzt;
        lauf.zuletzt = jetzt;
        const sichtbar = typeof document === 'undefined' || document.visibilityState !== 'hidden';
        if (!lauf.pausiert) {
            if (delta > 0 && delta <= SCHLAF_GRENZE_MS && sichtbar)
                lauf.vergangenSek += delta / 1000;
            else if (delta > 0)
                lauf.uebersprungenSek += delta / 1000;
        }
        if (lauf.art === 'timer' && lauf.sollSek - lauf.vergangenSek <= 0) {
            const name = lauf.seitenName;
            const minuten = Math.round(lauf.sollSek / 60);
            merken();
            lauf = null;
            laufendSichern();
            UI.toast(`⏰ Zeit um — ${minuten} Min an „${name}".`);
        }
        else if (jetzt - lauf.gesichert >= SICHERN_ALLE_MS)
            laufendSichern();
        zeichneStand();
        if (!lauf && ticker !== null) {
            clearInterval(ticker);
            ticker = null;
        }
    };
    const start = (art = 'stoppuhr', sollSek = 0) => {
        if (lauf)
            merken();
        const wo = seiteJetzt();
        lauf = { art, beginn: Date.now(), sollSek: art === 'timer' ? Math.max(1, sollSek) : 0,
            vergangenSek: 0, uebersprungenSek: 0, zuletzt: Date.now(), gesichert: 0, pausiert: false,
            seiteId: wo.id, seitenName: wo.name };
        if (ticker === null)
            ticker = window.setInterval(tick, 500);
        laufendSichern();
        zeichneStand();
    };
    const pause = () => {
        if (!lauf)
            return;
        lauf.pausiert = !lauf.pausiert;
        lauf.zuletzt = Date.now();
        laufendSichern();
        zeichneStand();
    };
    const stopp = () => {
        if (!lauf)
            return;
        merken();
        lauf = null;
        laufendSichern();
        if (ticker !== null) {
            clearInterval(ticker);
            ticker = null;
        }
        zeichneStand();
    };
    const wiederaufnehmen = () => {
        if (lauf || typeof Store === 'undefined')
            return;
        const roh = Store.getMeta(LAUFEND);
        if (!roh || typeof roh !== 'object' || (roh.art !== 'stoppuhr' && roh.art !== 'timer'))
            return;
        lauf = { art: roh.art, beginn: Number(roh.beginn) || Date.now(), sollSek: Number(roh.sollSek) || 0,
            vergangenSek: Math.max(0, Number(roh.vergangenSek) || 0),
            uebersprungenSek: Math.max(0, Number(roh.uebersprungenSek) || 0),
            zuletzt: Date.now(), gesichert: Date.now(), pausiert: !!roh.pausiert,
            seiteId: String(roh.seiteId || ''), seitenName: String(roh.seitenName || 'Ohne Seite') };
        if (ticker === null)
            ticker = window.setInterval(tick, 500);
        zeichneStand();
    };
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' && ARTEN.ablageGeladen) {
        try {
            Ereignisse.horche(ARTEN.ablageGeladen, wiederaufnehmen, { nachreichen: true });
        }
        catch { }
    }
    const stand = () => ({
        laeuft: !!lauf, pausiert: !!lauf?.pausiert,
        art: lauf?.art || '', sekunden: lauf ? Math.round(restSek()) : 0,
        uebersprungenSek: lauf ? Math.round(lauf.uebersprungenSek) : 0,
        seite: lauf?.seitenName || ''
    });
    const ruhig = () => {
        try {
            if (typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung)
                return AppEinstellung.wenigBewegung();
        }
        catch { }
        return document.body?.dataset['bewegung'] === 'ruhig' ||
            !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };
    const zustandVon = (s) => s.laeuft ? (s.pausiert ? 'pausiert' : 'laeuft') : 'bereit';
    const artText = (s) => (s.art === 'timer' ? 'Timer' : 'Stoppuhr') + (s.pausiert ? ' · pausiert' : '') +
        (s.uebersprungenSek >= 60 ? ' · ' + uhrText(s.uebersprungenSek) + ' Schlaf nicht gezählt' : '');
    const fortschritt = () => lauf && lauf.art === 'timer' && lauf.sollSek > 0
        ? { soll: Math.round(lauf.sollSek), vergangen: Math.min(Math.round(lauf.sollSek), Math.round(lauf.vergangenSek)) }
        : null;
    const fortschrittText = (f) => Math.floor(f.vergangen / 60) + ' von ' + Math.round(f.soll / 60) + ' Minuten';
    const feldHtml = () => {
        const s = stand();
        const f = fortschritt();
        const liste = sitzungen().slice(0, 3).map(z => `<li>${esc(uhrText(z.dauerSek))} · ${esc(z.seitenName || 'Ohne Seite')}` +
            `${z.art === 'timer' ? ' <i>(Timer)</i>' : ''}</li>`).join('');
        return `<div class="zm-kopf"><b>Zeitmesser</b>` +
            `<button class="rb zeichen" data-zm="zu" data-esc-knopf aria-label="Schliessen">✕</button></div>` +
            `<p class="zm-wo">${s.laeuft
                ? `<b class="zm-titel">${esc(s.seite)}</b><span class="zm-art">${esc(artText(s))}</span>`
                : 'Misst die Zeit an der offenen Seite.'}</p>` +
            `<div class="zm-uhr" aria-live="off">${uhrText(s.sekunden)}</div>` +
            (f ? `<div class="zm-fortschritt" role="progressbar" aria-label="Fortschritt des Timers" aria-valuemin="0"` +
                ` aria-valuemax="${f.soll}" aria-valuenow="${f.vergangen}" aria-valuetext="${esc(fortschrittText(f))}"><i></i></div>` : '') +
            `<div class="zm-reihe">` +
            `<button class="rb" data-zm="stoppuhr">Stoppuhr</button>` +
            `<button class="rb" data-zm="t5">5 Min</button>` +
            `<button class="rb" data-zm="t25">25 Min</button>` +
            `</div>` +
            `<div class="zm-reihe rmo-transport" role="group" aria-label="Zeit steuern" data-zustand="${zustandVon(s)}">` +
            `<button class="rb haupt" data-rmo-taste="start" data-zm="stoppuhr" ${s.laeuft ? 'disabled' : ''}>Start</button>` +
            `<button class="rb" data-rmo-taste="pause" data-zm="pause" ${s.laeuft ? '' : 'disabled'}><span class="zm-wort">${s.pausiert ? 'Weiter' : 'Pause'}</span></button>` +
            `<button class="rb" data-rmo-taste="stopp" data-zm="stopp" ${s.laeuft ? '' : 'disabled'}>Beenden</button>` +
            `</div>` +
            (liste ? `<div class="zm-sitzungen"><span>Zuletzt</span><ul>${liste}</ul></div>` : '');
    };
    const fortschrittSetzen = (wurzel) => {
        const f = fortschritt();
        const fuellung = wurzel.querySelector('.zm-fortschritt i');
        if (f && fuellung)
            fuellung.style.setProperty('--zm-anteil', String(f.soll ? f.vergangen / f.soll : 0));
    };
    const zeichneStand = () => {
        document.dispatchEvent(new CustomEvent('redion:zeitmesser'));
        pilleStand();
        const feld = document.querySelector('.zm-feld');
        const inhalt = feld?.querySelector('.zm-inhalt');
        if (!feld || !inhalt)
            return;
        const next = document.createElement('div');
        next.innerHTML = feldHtml();
        const currentState = inhalt.querySelector('.rmo-transport')?.getAttribute('data-zustand');
        const nextState = next.querySelector('.rmo-transport')?.getAttribute('data-zustand');
        const laufend = (z) => z === 'laeuft' || z === 'pausiert';
        const gleicheGestalt = (currentState === nextState || (laufend(currentState) && laufend(nextState))) &&
            !!inhalt.querySelector('.zm-fortschritt') === !!next.querySelector('.zm-fortschritt') &&
            !!inhalt.querySelector('.zm-titel') === !!next.querySelector('.zm-titel');
        if (gleicheGestalt) {
            const texte = next.querySelector('.zm-titel') ? ['.zm-uhr', '.zm-titel', '.zm-art', '.zm-wort'] : ['.zm-uhr', '.zm-wo', '.zm-wort'];
            for (const selector of texte) {
                const target = inhalt.querySelector(selector);
                const text = next.querySelector(selector)?.textContent || '';
                if (target && target.textContent !== text)
                    target.textContent = text;
            }
            const leiste = inhalt.querySelector('.zm-fortschritt');
            const neueLeiste = next.querySelector('.zm-fortschritt');
            if (leiste && neueLeiste)
                for (const name of ['aria-valuenow', 'aria-valuetext', 'aria-valuemax']) {
                    const wert = neueLeiste.getAttribute(name) || '';
                    if (leiste.getAttribute(name) !== wert)
                        leiste.setAttribute(name, wert);
                }
            fortschrittSetzen(inhalt);
            const transport = inhalt.querySelector('.rmo-transport');
            if (transport && nextState && transport.getAttribute('data-zustand') !== nextState)
                transport.setAttribute('data-zustand', nextState);
            return;
        }
        const focused = feld.contains(document.activeElement)
            ? document.activeElement.dataset.zm : undefined;
        inhalt.replaceChildren(...Array.from(next.childNodes));
        fortschrittSetzen(inhalt);
        if (focused)
            inhalt.querySelector(`[data-zm="${focused}"]:not(:disabled)`)?.focus();
    };
    let fahrt = null;
    const pilleBauen = () => {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = 'zm-pille';
        b.className = 'zm-pille';
        b.innerHTML = '<span class="zm-pille-lampe" aria-hidden="true"></span>' +
            '<span class="zm-pille-zeichen" data-sym="clock" data-sym-groesse="16" aria-hidden="true">⏱</span>' +
            '<b class="zm-pille-uhr"></b><span class="zm-pille-trenner" aria-hidden="true">·</span>' +
            '<span class="zm-pille-seite"></span>';
        try {
            globalThis.Register?.symbole?.fuelle?.(b);
        }
        catch { }
        b.addEventListener('click', () => oeffnen(true));
        return b;
    };
    const pilleStand = () => {
        let pille = document.getElementById('zm-pille');
        if (!lauf) {
            if (pille && !fahrt)
                pille.remove();
            return;
        }
        const feld = document.querySelector('.zm-feld');
        let neu = false;
        if (!pille) {
            if (feld)
                return;
            pille = pilleBauen();
            document.body.appendChild(pille);
            neu = true;
        }
        if (!fahrt)
            pille.hidden = !!feld;
        const s = stand();
        const uhr = uhrText(s.sekunden);
        const setze = (wahl, text) => {
            const e = pille.querySelector(wahl);
            if (e && e.textContent !== text)
                e.textContent = text;
        };
        setze('.zm-pille-uhr', uhr);
        setze('.zm-pille-seite', s.seite);
        const zustand = zustandVon(s);
        if (pille.dataset['zustand'] !== zustand)
            pille.dataset['zustand'] = zustand;
        const minuten = s.art === 'timer' ? 'noch ' + Math.ceil(s.sekunden / 60) + ' Min'
            : s.sekunden < 60 ? 'unter 1 Min gemessen' : Math.floor(s.sekunden / 60) + ' Min gemessen';
        const name = 'Zeitmesser: ' + minuten + ' an „' + s.seite + '"' + (s.pausiert ? ', pausiert' : '') + ' — öffnen';
        if (pille.getAttribute('aria-label') !== name)
            pille.setAttribute('aria-label', name);
        if (neu && !pille.hidden && !ruhig()) {
            const feder = typeof RedionSpring !== 'undefined' ? RedionSpring.token('smooth') : null;
            if (feder && feder.duration > 1)
                pille.animate([{ opacity: 0, transform: 'translateY(8px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: feder.duration, easing: feder.easing });
        }
    };
    const kasten = (e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    const bahn = (box, von, nach) => {
        const feder = RedionSpring.preset('snappy');
        const weit = Math.max(1, Math.abs(nach.left - von.left), Math.abs(nach.top - von.top), Math.abs(nach.width - von.width), Math.abs(nach.height - von.height));
        const roh = RedionSpring.sample(feder, 0, weit, 0, 8);
        const lauf01 = { values: roh.values.map(v => v / weit), duration: roh.duration };
        const bilder = lauf01.values.map(p => {
            const l = von.left + (nach.left - von.left) * p;
            const t = von.top + (nach.top - von.top) * p;
            const b = von.width + (nach.width - von.width) * p;
            const h = von.height + (nach.height - von.height) * p;
            return { transform: 'translate(' + (l - box.left).toFixed(2) + 'px,' + (t - box.top).toFixed(2) + 'px) scale(' +
                    (b / box.width).toFixed(4) + ',' + (h / box.height).toFixed(4) + ')' };
        });
        return { bilder, dauer: lauf01.duration };
    };
    const blende = (e, punkte, dauer) => e.animate(punkte.map(([offset, opacity]) => ({ offset, opacity })), { duration: dauer, easing: 'linear', fill: 'both' });
    const fahrtBeenden = () => { const f = fahrt; fahrt = null; f?.ende(); };
    const nachDerFahrt = (laeufe, ende) => {
        Promise.all(laeufe.map(a => a.finished))
            .then(() => { if (fahrt?.ende === ende)
            fahrtBeenden(); })
            .catch(() => { });
    };
    const aufgehen = (feld, pille, von) => {
        const inhalt = feld.querySelector('.zm-inhalt');
        const nach = kasten(feld);
        if (!inhalt || !nach.width || !von.width) {
            pille.hidden = true;
            return;
        }
        const karte = bahn(nach, von, nach);
        const tropfen = bahn(von, von, nach);
        const d = karte.dauer;
        const geist = inhalt.cloneNode(true);
        geist.className = 'zm-inhalt zm-geist';
        geist.setAttribute('aria-hidden', 'true');
        geist.inert = true;
        geist.querySelectorAll('[data-zm], [role], [data-rmo-taste], [data-esc-knopf]').forEach(x => {
            x.removeAttribute('data-zm');
            x.removeAttribute('role');
            x.removeAttribute('data-rmo-taste');
            x.removeAttribute('data-esc-knopf');
        });
        geist.querySelectorAll('.rmo-transport').forEach(x => x.classList.remove('rmo-transport'));
        feld.appendChild(geist);
        feld.style.transformOrigin = '0 0';
        pille.style.transformOrigin = '0 0';
        pille.classList.add('zm-fliegt');
        const laeufe = [
            feld.animate(karte.bilder, { duration: d, easing: 'linear', fill: 'both' }),
            blende(feld, [[0, 0], [0.08, 0], [0.4, 1], [1, 1]], d),
            blende(inhalt, [[0, 0], [0.3, 0], [0.72, 1], [1, 1]], d),
            blende(geist, [[0, 0], [0.12, 0], [0.35, 1], [0.72, 0], [1, 0]], d),
            pille.animate(tropfen.bilder, { duration: d, easing: 'linear', fill: 'both' }),
            blende(pille, [[0, 1], [0.15, 1], [0.5, 0], [1, 0]], d)
        ];
        const ende = () => {
            laeufe.forEach(a => a.cancel());
            geist.remove();
            feld.style.removeProperty('transform-origin');
            pille.style.removeProperty('transform-origin');
            pille.classList.remove('zm-fliegt');
            if (lauf)
                pille.hidden = true;
            else
                pille.remove();
            if (fahrt?.ende === ende)
                fahrt = null;
        };
        fahrt = { ende };
        nachDerFahrt(laeufe, ende);
    };
    const zusammenziehen = (feld, pille) => {
        const von = kasten(feld);
        pille.hidden = false;
        const nach = kasten(pille);
        const inhalt = feld.querySelector('.zm-inhalt');
        if (!nach.width || !von.width) {
            feld.remove();
            return;
        }
        const karte = bahn(von, von, nach);
        const tropfen = bahn(nach, von, nach);
        const d = karte.dauer;
        feld.style.transformOrigin = '0 0';
        pille.style.transformOrigin = '0 0';
        pille.classList.add('zm-fliegt');
        const laeufe = [
            feld.animate(karte.bilder, { duration: d, easing: 'linear', fill: 'both' }),
            blende(feld, [[0, 1], [0.18, 1], [0.5, 0], [1, 0]], d),
            pille.animate(tropfen.bilder, { duration: d, easing: 'linear', fill: 'both' }),
            blende(pille, [[0, 0], [0.12, 0], [0.45, 1], [1, 1]], d)
        ];
        if (inhalt)
            laeufe.push(blende(inhalt, [[0, 1], [0.2, 0], [1, 0]], d));
        for (const kind of Array.from(pille.children))
            laeufe.push(blende(kind, [[0, 0], [0.55, 0], [0.85, 1], [1, 1]], d));
        const ende = () => {
            laeufe.forEach(a => a.cancel());
            feld.remove();
            pille.style.removeProperty('transform-origin');
            pille.classList.remove('zm-fliegt');
            if (fahrt?.ende === ende)
                fahrt = null;
            pilleStand();
        };
        fahrt = { ende };
        nachDerFahrt(laeufe, ende);
    };
    let vorherFokus = null;
    const feldBauen = () => {
        const feld = document.createElement('div');
        feld.className = 'zm-feld zm-karte';
        feld.setAttribute('role', 'dialog');
        feld.setAttribute('aria-label', 'Zeitmesser');
        const inhalt = document.createElement('div');
        inhalt.className = 'zm-inhalt';
        inhalt.innerHTML = feldHtml();
        feld.appendChild(inhalt);
        feld.addEventListener('click', e => {
            const b = e.target.closest('[data-zm]');
            if (!b || !inhalt.contains(b))
                return;
            const was = b.dataset['zm'];
            if (was === 'zu') {
                schliessen();
                return;
            }
            if (was === 'stoppuhr')
                return start('stoppuhr');
            if (was === 't5')
                return start('timer', 5 * 60);
            if (was === 't25')
                return start('timer', 25 * 60);
            if (was === 'pause')
                return pause();
            if (was === 'stopp')
                return stopp();
        });
        document.body.appendChild(feld);
        fortschrittSetzen(inhalt);
        return feld;
    };
    const oeffnen = (ausPille) => {
        fahrtBeenden();
        document.querySelectorAll('.zm-karte.zm-geht').forEach(x => x.remove());
        if (document.querySelector('.zm-feld'))
            return;
        const aktiv = document.activeElement;
        vorherFokus = aktiv instanceof HTMLElement && aktiv !== document.body && aktiv.id !== 'zm-pille' ? aktiv : null;
        const pille = document.getElementById('zm-pille');
        const von = pille && !pille.hidden ? kasten(pille) : null;
        const feld = feldBauen();
        if (pille && von && !ruhig() && typeof RedionSpring !== 'undefined')
            aufgehen(feld, pille, von);
        else {
            if (pille)
                pille.hidden = true;
            if (!pille && !ruhig() && typeof RedionSpring !== 'undefined') {
                const feder = RedionSpring.token('snappy');
                if (feder.duration > 1)
                    feld.animate([{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: feder.duration, easing: feder.easing });
            }
        }
        if (ausPille) {
            const ziel = feld.querySelector('[data-zm="pause"]:not(:disabled)') ||
                feld.querySelector('[data-zm="zu"]');
            ziel?.focus({ preventScroll: true });
        }
    };
    const schliessen = () => {
        fahrtBeenden();
        const feld = document.querySelector('.zm-feld');
        if (!feld)
            return;
        const fokusDrin = feld.contains(document.activeElement) || document.activeElement === document.body;
        feld.classList.remove('zm-feld');
        feld.classList.add('zm-geht');
        feld.removeAttribute('role');
        feld.setAttribute('aria-hidden', 'true');
        feld.inert = true;
        if (!lauf) {
            feld.remove();
            pilleStand();
            if (fokusDrin && vorherFokus?.isConnected)
                vorherFokus.focus({ preventScroll: true });
            return;
        }
        pilleStand();
        const pille = document.getElementById('zm-pille');
        if (!pille) {
            feld.remove();
            return;
        }
        if (ruhig() || typeof RedionSpring === 'undefined') {
            feld.remove();
            pille.hidden = false;
        }
        else
            zusammenziehen(feld, pille);
        if (fokusDrin)
            pille.focus({ preventScroll: true });
    };
    const panel = () => {
        if (document.querySelector('.zm-feld')) {
            schliessen();
            return;
        }
        oeffnen(false);
    };
    return { panel, start, pause, stopp, stand, wiederaufnehmen };
})();
window.Zeitmesser = Zeitmesser;
