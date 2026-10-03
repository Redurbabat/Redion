"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/ueberlagerung/hinweis.ts (npm run bauen:ts). */
const Hinweis = (() => {
    let toastTimer;
    const toast = (text, dauer) => {
        const t = document.getElementById('toast');
        if (!t) {
            console.info('[Hinweis]', String(text));
            return { textContent: String(text ?? ''), remove() { } };
        }
        t.textContent = String(text ?? '');
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
        return {
            set textContent(v) {
                t.textContent = v;
                t.classList.add('show');
                clearTimeout(toastTimer);
                toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
            },
            get textContent() { return t.textContent || ''; },
            remove() { clearTimeout(toastTimer); t.classList.remove('show'); }
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
    return { toast, banner, leer };
})();
window.Hinweis = Hinweis;
