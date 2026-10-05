"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/dialog.ts (npm run bauen:ts). */
const Dialog = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const frage = (titel, vorgabe = '', art = 'text') => new Promise(ok => {
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
            if (e.key === 'Enter')
                fertig(inp.value);
            if (e.key === 'Escape')
                fertig(null);
        });
        inp.focus();
        inp.select();
    });
    const wahl = ({ titel, text, knoepfe = [] }) => new Promise(ok => {
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
    const mehrzeilig = (titel, vorgabe = '') => new Promise(ok => {
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
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                fertig(feld.value);
            if (e.key === 'Escape')
                fertig(null);
        });
        feld.focus();
        feld.select();
    });
    return { frage, wahl, mehrzeilig };
})();
window.Dialog = Dialog;
