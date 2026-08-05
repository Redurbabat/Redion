"use strict";
/* ============================================================================
 * schale/ueberlagerung/dialog.js — die Frage mit einem Eingabefeld
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/dialog.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/dialog.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Ersetzt `prompt()`. Nicht aus Schönheit: das eingebaute `prompt` hält den
 * ganzen Browser an, sieht in jedem System anders aus, lässt sich nicht mit
 * Esc abbrechen, ohne dass Text verlorengeht — und in mancher Umgebung ist es
 * abgeschaltet, dann steht die App ohne Erklärung.
 *
 * Gibt ein Versprechen zurück: der Text, oder null beim Abbrechen. Null und
 * leerer Text sind ausdrücklich verschieden — „nichts eingegeben" ist eine
 * andere Antwort als „abgebrochen".
 * ==========================================================================*/
const Dialog = (() => {
    const frage = (titel, vorgabe = '') => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">${titel}</div>` +
                `<div style="padding:16px 18px"><input id="fq" value="${String(vorgabe).replace(/"/g, '&quot;')}" ` +
                'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:8px; outline:none; font-size:15px"></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#fq');
        const fertig = (wert) => { o.remove(); ok(wert); };
        /* Ohne Eingabefeld gäbe es nichts zu fragen — dann lieber gleich
           abbrechen als eine Überlagerung stehenlassen, die nichts kann. */
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
    /**
     * Die Frage mit mehreren Antworten — für Entscheidungen, die niemand
     * stillschweigend treffen darf.
     *
     * WARUM ES DIESE FUNKTION GIBT. `CLAUDE.md` sagt: nichts löschen ohne
     * Rückfrage. Bis hierher gab es dafür kein Werkzeug ausser `confirm()` —
     * und das kennt nur ja und nein. Eine Entscheidung wie „ersetzen oder
     * dazulegen" ist aber keine Ja-Nein-Frage: beide Antworten sind richtig,
     * je nachdem was der Mensch vorhat, und die falsche kostet Daten.
     *
     * Deshalb bekommt jeder Knopf einen eigenen **Hinweis** darunter. Wer
     * „Ersetzen" liest, soll nicht raten müssen, was mit dem übrigen Bestand
     * geschieht — es steht daneben.
     *
     * Gibt die `id` des gewählten Knopfes zurück, `''` beim Abbruch — und
     * nicht `null`: eine Kennung ist immer eine Zeichenkette, und wer
     * `if (!wahl) return;` schreibt, deckt damit beide Fälle.
     */
    const wahl = ({ titel, text, knoepfe = [] }) => new Promise(ok => {
        const esc = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(540px,94vw)">' +
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
            /* Auf den Hintergrund klicken heisst abbrechen — nicht die erste
               Antwort wählen. Bei einer Frage, die Daten kostet, ist die
               versehentliche Wahl das, was es zu verhindern gilt. */
            if (e.target === o)
                fertig('');
        });
        document.addEventListener('keydown', beiTaste);
        o.querySelector('[data-w]')?.focus();
    });
    return { frage, wahl };
})();
window.Dialog = Dialog;
