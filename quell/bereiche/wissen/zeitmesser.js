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
    const feldHtml = () => {
        const s = stand();
        const liste = sitzungen().slice(0, 3).map(z => `<li>${esc(uhrText(z.dauerSek))} · ${esc(z.seitenName || 'Ohne Seite')}` +
            `${z.art === 'timer' ? ' <i>(Timer)</i>' : ''}</li>`).join('');
        return `<div class="zm-kopf"><b>Zeitmesser</b>` +
            `<button class="rb zeichen" data-zm="zu" aria-label="Schliessen">✕</button></div>` +
            `<div class="zm-uhr" aria-live="off">${uhrText(s.sekunden)}</div>` +
            `<p class="zm-wo">${s.laeuft
                ? (s.art === 'timer' ? 'Timer' : 'Stoppuhr') + ' · ' + esc(s.seite) +
                    (s.pausiert ? ' · pausiert' : '') +
                    (s.uebersprungenSek >= 60 ? ' · ' + esc(uhrText(s.uebersprungenSek)) + ' Schlaf nicht gezählt' : '')
                : 'Misst die Zeit an der offenen Seite.'}</p>` +
            `<div class="zm-reihe">` +
            `<button class="rb" data-zm="stoppuhr">Stoppuhr</button>` +
            `<button class="rb" data-zm="t5">5 Min</button>` +
            `<button class="rb" data-zm="t25">25 Min</button>` +
            `</div>` +
            `<div class="zm-reihe rmo-transport" role="group" aria-label="Zeit steuern" data-zustand="${s.laeuft ? (s.pausiert ? 'pausiert' : 'laeuft') : 'bereit'}">` +
            `<button class="rb haupt" data-rmo-taste="start" data-zm="stoppuhr" ${s.laeuft ? 'disabled' : ''}>Start</button>` +
            `<button class="rb" data-rmo-taste="pause" data-zm="pause" ${s.laeuft ? '' : 'disabled'}>${s.pausiert ? 'Weiter' : 'Pause'}</button>` +
            `<button class="rb" data-rmo-taste="stopp" data-zm="stopp" ${s.laeuft ? '' : 'disabled'}>Beenden</button>` +
            `</div>` +
            (liste ? `<div class="zm-sitzungen"><span>Zuletzt</span><ul>${liste}</ul></div>` : '');
    };
    const zeichneStand = () => {
        const feld = document.querySelector('.zm-feld');
        if (!feld)
            return;
        const next = document.createElement('div');
        next.innerHTML = feldHtml();
        const currentState = feld.querySelector('.rmo-transport')?.getAttribute('data-zustand');
        const nextState = next.querySelector('.rmo-transport')?.getAttribute('data-zustand');
        if (currentState === nextState) {
            for (const selector of ['.zm-uhr', '.zm-wo']) {
                const target = feld.querySelector(selector);
                const text = next.querySelector(selector)?.textContent || '';
                if (target && target.textContent !== text)
                    target.textContent = text;
            }
            return;
        }
        const focused = feld.contains(document.activeElement)
            ? document.activeElement.dataset.zm : undefined;
        feld.replaceChildren(...Array.from(next.childNodes));
        if (focused)
            feld.querySelector(`.rmo-transport [data-zm="${focused}"]:not(:disabled)`)?.focus();
    };
    const panel = () => {
        const offen = document.querySelector('.zm-feld');
        if (offen) {
            offen.remove();
            return;
        }
        const feld = document.createElement('div');
        feld.className = 'zm-feld';
        feld.setAttribute('role', 'dialog');
        feld.setAttribute('aria-label', 'Zeitmesser');
        feld.innerHTML = feldHtml();
        feld.addEventListener('click', e => {
            const b = e.target.closest('[data-zm]');
            if (!b)
                return;
            const was = b.dataset['zm'];
            if (was === 'zu') {
                feld.remove();
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
    };
    return { panel, start, pause, stopp, stand, wiederaufnehmen };
})();
window.Zeitmesser = Zeitmesser;
