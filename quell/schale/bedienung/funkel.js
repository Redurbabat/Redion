"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/funkel.ts (npm run bauen:ts). */
const Funkel = (() => {
    const anlegen = (knopf) => {
        if (knopf.classList.contains('ru-funkel'))
            return;
        knopf.classList.add('ru-funkel');
        let nr = 0;
        const texte = Array.from(knopf.childNodes).filter(k => k.nodeType === Node.TEXT_NODE);
        for (const t of texte) {
            const stueck = document.createDocumentFragment();
            for (const zeichen of Array.from(t.textContent || '')) {
                if (/\s/.test(zeichen)) {
                    stueck.append(zeichen);
                    continue;
                }
                const s = document.createElement('span');
                s.className = 'ru-funkel-b';
                s.textContent = zeichen;
                s.style.setProperty('--ru-schritt', String(nr++));
                stueck.append(s);
            }
            t.replaceWith(stueck);
        }
    };
    const alle = (wurzel, selektor) => {
        let n = 0;
        wurzel.querySelectorAll(selektor).forEach(k => { anlegen(k); n++; });
        return n;
    };
    return { anlegen, alle };
})();
window.Funkel = Funkel;
