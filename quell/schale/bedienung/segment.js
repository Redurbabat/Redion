"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/segment.ts (npm run bauen:ts). */
const Segment = (() => {
    const bauen = (auftrag) => {
        const wahlen = auftrag.wahlen.filter(w => w && w.id);
        if (!wahlen.length)
            throw new Error('Ein Umschalter ohne Wahl ist keiner.');
        const gruppe = document.createElement('div');
        gruppe.className = 'ru-seg';
        gruppe.setAttribute('role', 'radiogroup');
        gruppe.setAttribute('aria-label', auftrag.name);
        gruppe.dataset['material'] = 'segment';
        let jetzt = wahlen.some(w => w.id === auftrag.gewaehlt)
            ? String(auftrag.gewaehlt) : String(wahlen[0]?.id);
        const knoepfe = wahlen.map(wahl => {
            const k = document.createElement('button');
            k.type = 'button';
            k.className = 'ru-seg-wahl';
            k.setAttribute('role', 'radio');
            k.dataset['segWahl'] = wahl.id;
            if (wahl.zeichen && typeof Register !== 'undefined' && Register.symbole?.hat?.(wahl.zeichen)) {
                const zeichen = document.createElement('span');
                zeichen.className = 'ru-seg-zeichen';
                zeichen.setAttribute('aria-hidden', 'true');
                zeichen.innerHTML = Register.symbole.alsSvg(wahl.zeichen);
                k.append(zeichen);
            }
            const text = document.createElement('span');
            text.className = 'ru-seg-name';
            text.textContent = wahl.name;
            k.append(text);
            if (wahl.kurz) {
                const kurz = document.createElement('span');
                kurz.className = 'ru-seg-kurz';
                kurz.textContent = wahl.kurz;
                k.append(kurz);
            }
            gruppe.append(k);
            return k;
        });
        const stellen = () => {
            knoepfe.forEach((k, i) => {
                const an = wahlen[i]?.id === jetzt;
                k.setAttribute('aria-checked', String(an));
                k.tabIndex = an ? 0 : -1;
            });
        };
        const waehlen = (id, melden) => {
            if (!wahlen.some(w => w.id === id) || id === jetzt)
                return;
            jetzt = id;
            stellen();
            if (melden)
                auftrag.gewechselt?.(jetzt);
        };
        const springen = (schritt, fokus) => {
            const von = wahlen.findIndex(w => w.id === jetzt);
            const nach = (von + schritt + wahlen.length) % wahlen.length;
            const ziel = wahlen[nach];
            if (!ziel)
                return;
            waehlen(ziel.id, true);
            if (fokus)
                knoepfe[nach]?.focus();
        };
        gruppe.addEventListener('click', ereignis => {
            const ziel = ereignis.target instanceof Element
                ? ereignis.target.closest('[data-seg-wahl]') : null;
            if (ziel?.dataset['segWahl'])
                waehlen(ziel.dataset['segWahl'], true);
        });
        gruppe.addEventListener('keydown', ereignis => {
            const taste = ereignis.key;
            if (taste === 'ArrowRight' || taste === 'ArrowDown') {
                ereignis.preventDefault();
                springen(1, true);
                return;
            }
            if (taste === 'ArrowLeft' || taste === 'ArrowUp') {
                ereignis.preventDefault();
                springen(-1, true);
                return;
            }
            if (taste === 'Home') {
                ereignis.preventDefault();
                const erste = wahlen[0];
                if (erste) {
                    waehlen(erste.id, true);
                    knoepfe[0]?.focus();
                }
                return;
            }
            if (taste === 'End') {
                ereignis.preventDefault();
                const letzte = wahlen[wahlen.length - 1];
                if (letzte) {
                    waehlen(letzte.id, true);
                    knoepfe[knoepfe.length - 1]?.focus();
                }
            }
        });
        stellen();
        return {
            element: gruppe,
            wert: () => jetzt,
            setzen: (id) => waehlen(id, false)
        };
    };
    return { bauen };
})();
window.Segment = Segment;
