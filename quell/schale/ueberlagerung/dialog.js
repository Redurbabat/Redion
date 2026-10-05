"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/dialog.ts (npm run bauen:ts). */
const Dialog = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const frageAlt = (titel, vorgabe = '', art = 'text') => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const feldArt = art === 'passwort'
            ? 'type="password" autocomplete="off" spellcheck="false"' : '';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                `<div style="padding:16px 18px"><input id="fq" ${feldArt} ` +
                `value="${esc(vorgabe)}" ` +
                'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:8px; outline:none; font-size:15px"></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#fq');
        const fertig = (wert) => { o.remove(); ok(wert); };
        if (!inp) {
            fertig(null);
            return;
        }
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (ziel?.closest('[data-a="ok"]'))
                fertig(inp.value);
            else if (ziel?.closest('[data-a="zu"]') || e.target === o)
                fertig(null);
        });
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fertig(inp.value);
            }
            if (e.key === 'Escape')
                fertig(null);
        });
        inp.focus();
        inp.select();
    });
    const wahlAlt = ({ titel, text, knoepfe = [] }) => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder wahl" style="width:min(540px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                '<div style="padding:16px 18px; font-size:14px; line-height:1.6; white-space:pre-wrap">' +
                esc(text) + '</div>' +
                '<div class="wahl-knoepfe">' +
                knoepfe.map((k, i) => `<button data-w="${esc(k.id)}"${i === 0 ? ' class="prim"' : ''}>` +
                    `<b>${esc(k.text)}</b>` +
                    (k.hinweis ? `<span>${esc(k.hinweis)}</span>` : '') +
                    '</button>').join('') +
                '</div></div>';
        document.body.appendChild(o);
        const fertig = (wert) => { o.remove(); document.removeEventListener('keydown', beiTaste); ok(wert); };
        const beiTaste = (e) => { if (e.key === 'Escape')
            fertig(''); };
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const k = ziel?.closest('[data-w]');
            if (k) {
                fertig(k.dataset['w'] ?? '');
                return;
            }
            if (e.target === o)
                fertig('');
        });
        document.addEventListener('keydown', beiTaste);
        o.querySelector('[data-w]')?.focus();
    });
    const mehrzeiligAlt = (titel, vorgabe = '') => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                '<div style="padding:16px 18px"><textarea id="fq" rows="4" ' +
                'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:8px; outline:none; font-size:15px; font-family:inherit; resize:vertical">' +
                `${esc(vorgabe)}</textarea>` +
                '<p style="margin:6px 0 0; font-size:11.5px; color:var(--text-faint)">' +
                'Übernehmen mit Strg + Enter</p></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);
        const feld = o.querySelector('#fq');
        const fertig = (wert) => { o.remove(); ok(wert); };
        if (!feld) {
            fertig(null);
            return;
        }
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (ziel?.closest('[data-a="ok"]'))
                fertig(feld.value);
            else if (ziel?.closest('[data-a="zu"]') || e.target === o)
                fertig(null);
        });
        feld.addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                fertig(feld.value);
            }
            if (e.key === 'Escape')
                fertig(null);
        });
        feld.focus();
        feld.select();
    });
    const WARTEN_MS = 1500;
    const inselnHolen = () => {
        if (typeof Inseln === 'undefined')
            return Promise.resolve(null);
        if (Inseln.geladen() && window.RedionIslands)
            return Promise.resolve(window.RedionIslands);
        return new Promise(ok => {
            let entschieden = false;
            const zeit = setTimeout(() => { if (!entschieden) {
                entschieden = true;
                ok(null);
            } }, WARTEN_MS);
            Inseln.bereit().then(api => { if (!entschieden) {
                entschieden = true;
                clearTimeout(zeit);
                ok(api);
            } }, (e) => {
                if (typeof Reporter !== 'undefined')
                    Reporter.warn('Dialog', 'Die Inseln kamen nicht — die Frage kommt im bisherigen Fenster: ' +
                        (e instanceof Error ? e.message : String(e)));
                if (!entschieden) {
                    entschieden = true;
                    clearTimeout(zeit);
                    ok(null);
                }
            });
        });
    };
    const amTelefon = () => typeof Menue !== 'undefined' && Menue.amTelefon();
    const imKit = (api, daten, abbruch) => new Promise((ok, fehler) => {
        const vorher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const o = document.createElement('div');
        o.className = 'overlay';
        o.setAttribute('data-insel-traeger', 'offen');
        document.body.appendChild(o);
        let beantwortet = false;
        const waechter = new MutationObserver(() => { if (!o.isConnected)
            antwort(abbruch); });
        const beiInselFehler = (e) => {
            if (beantwortet || e.detail?.insel !== 'dialog')
                return;
            setTimeout(() => {
                if (beantwortet || !o.querySelector('[data-insel-fehler]'))
                    return;
                beantwortet = true;
                waechter.disconnect();
                removeEventListener('redion-insel-fehler', beiInselFehler);
                weg();
                if (typeof Fokus !== 'undefined')
                    Fokus.inertAktualisieren();
                if (vorher?.isConnected)
                    vorher.focus({ preventScroll: true });
                fehler(new Error('Das Fenster des Kits stolperte beim Zeichnen.'));
            }, 0);
        };
        addEventListener('redion-insel-fehler', beiInselFehler);
        const antwort = (wert) => {
            if (beantwortet)
                return;
            beantwortet = true;
            waechter.disconnect();
            removeEventListener('redion-insel-fehler', beiInselFehler);
            o.classList.remove('overlay');
            o.setAttribute('data-insel-traeger', 'geht');
            if (typeof Fokus !== 'undefined')
                Fokus.inertAktualisieren();
            const a = document.activeElement;
            if ((!a || a === document.body || o.contains(a)) && vorher?.isConnected)
                vorher.focus({ preventScroll: true });
            ok(wert);
        };
        const weg = () => {
            try {
                api.unmount(o);
            }
            catch { }
            o.remove();
        };
        try {
            api.mount(o, 'dialog', {
                ...daten,
                telefon: amTelefon(),
                traeger: o,
                onAntwort: (wert) => antwort((wert === null ? abbruch : wert)),
                onWeg: weg
            });
        }
        catch (e) {
            beantwortet = true;
            removeEventListener('redion-insel-fehler', beiInselFehler);
            o.remove();
            fehler(e);
            return;
        }
        waechter.observe(document.body, { childList: true });
    });
    const kitOderAlt = (daten, abbruch, alt) => inselnHolen().then(api => {
        if (!api)
            return alt();
        return imKit(api, daten, abbruch).catch((e) => {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Dialog', 'Das Fenster des Kits liess sich nicht öffnen — das bisherige springt ein: ' +
                    (e instanceof Error ? e.message : String(e)));
            return alt();
        });
    });
    const frage = (titel, vorgabe = '', art = 'text') => kitOderAlt({ art: art === 'passwort' ? 'passwort' : 'frage', titel: String(titel ?? ''), vorgabe: String(vorgabe ?? '') }, null, () => frageAlt(titel, vorgabe, art));
    const wahl = ({ titel, text, knoepfe = [] }) => kitOderAlt({ art: 'wahl', titel: String(titel ?? ''), text: String(text ?? ''),
        knoepfe: knoepfe.map(k => ({ ...k })) }, '', () => wahlAlt({ titel, text, knoepfe }));
    const mehrzeilig = (titel, vorgabe = '') => kitOderAlt({ art: 'mehrzeilig', titel: String(titel ?? ''), vorgabe: String(vorgabe ?? '') }, null, () => mehrzeiligAlt(titel, vorgabe));
    const bestaetigen = ({ titel, text = '', ja = 'OK', gefahr = false }) => {
        const knopf = { id: 'ja', text: ja, gefahr };
        const abbruch = { id: '', text: 'Abbrechen' };
        return kitOderAlt({ art: 'wahl', titel: String(titel ?? ''), text: String(text ?? ''), knoepfe: [{ ...knopf }] }, '', () => wahlAlt({ titel, text, knoepfe: gefahr ? [abbruch, knopf] : [knopf, abbruch] }))
            .then(w => w === 'ja');
    };
    const melden = ({ titel, text = '' }) => wahl({ titel, text, knoepfe: [{ id: '', text: 'OK' }] }).then(() => undefined);
    return { frage, wahl, mehrzeilig, bestaetigen, melden };
})();
window.Dialog = Dialog;
