"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/baum.ts (npm run bauen:ts). */
const Baumansicht = (() => {
    const bauen = (auftrag) => {
        const wurzel = document.createElement('div');
        wurzel.className = 'ru-baum';
        wurzel.setAttribute('role', 'tree');
        wurzel.setAttribute('aria-label', auftrag.name);
        const offen = new Set(auftrag.offen || []);
        let gewaehlt = auftrag.gewaehlt || null;
        const alle = new Map();
        const eltern = new Map();
        const aufnehmen = (knoten, elternId) => {
            for (const k of knoten) {
                if (!k?.id)
                    continue;
                alle.set(k.id, k);
                eltern.set(k.id, elternId);
                aufnehmen(k.kinder || [], k.id);
            }
        };
        aufnehmen(auftrag.knoten || [], null);
        if (gewaehlt && !alle.has(gewaehlt))
            gewaehlt = null;
        const sichtbar = () => [...wurzel.querySelectorAll('[data-baum-id]')]
            .filter(el => !el.closest('[hidden]'));
        const fokus = (ziel) => {
            if (!ziel)
                return;
            sichtbar().forEach(el => { el.tabIndex = el === ziel ? 0 : -1; });
            ziel.focus();
        };
        const zeichne = () => {
            wurzel.replaceChildren();
            const gruppeBauen = (knoten, ebene) => {
                const gruppe = document.createElement('div');
                gruppe.setAttribute('role', 'group');
                for (const k of knoten) {
                    const hatKinder = !!k.kinder?.length;
                    const zeile = document.createElement('div');
                    zeile.className = 'ru-baum-zeile';
                    zeile.dataset['baumId'] = k.id;
                    zeile.setAttribute('role', 'treeitem');
                    zeile.setAttribute('aria-level', String(ebene));
                    zeile.setAttribute('aria-selected', String(gewaehlt === k.id));
                    if (hatKinder)
                        zeile.setAttribute('aria-expanded', String(offen.has(k.id)));
                    if (k.deaktiviert)
                        zeile.setAttribute('aria-disabled', 'true');
                    if (auftrag.aktionen)
                        zeile.setAttribute('aria-haspopup', 'menu');
                    zeile.tabIndex = gewaehlt === k.id ? 0 : -1;
                    zeile.style.setProperty('--baum-ebene', String(ebene - 1));
                    const farbe = typeof Farben !== 'undefined' && Farben.kennung ? Farben.kennung(k.farbe) : '';
                    if (farbe) {
                        zeile.dataset['farbe'] = farbe;
                        zeile.style.setProperty('--baum-farbe', 'var(--c-' + farbe + ')');
                    }
                    const knick = document.createElement('span');
                    knick.className = 'ru-baum-knick';
                    knick.setAttribute('aria-hidden', 'true');
                    knick.textContent = hatKinder ? (offen.has(k.id) ? '⌄' : '›') : '';
                    const inhalt = document.createElement('span');
                    inhalt.className = 'ru-baum-inhalt';
                    if (k.zeichen) {
                        const zeichen = document.createElement('span');
                        zeichen.className = 'ru-baum-zeichen';
                        zeichen.setAttribute('aria-hidden', 'true');
                        if (typeof Register !== 'undefined' && Register.symbole?.hat?.(k.zeichen)) {
                            zeichen.innerHTML = Register.symbole.alsSvg(k.zeichen);
                        }
                        else {
                            zeichen.textContent = k.zeichen;
                        }
                        inhalt.append(zeichen);
                    }
                    const name = document.createElement('span');
                    name.className = 'ru-baum-name';
                    name.textContent = k.name;
                    inhalt.append(name);
                    zeile.append(knick, inhalt);
                    gruppe.append(zeile);
                    if (hatKinder) {
                        const kinder = gruppeBauen(k.kinder || [], ebene + 1);
                        kinder.classList.add('ru-baum-kinder');
                        if (!offen.has(k.id))
                            kinder.hidden = true;
                        gruppe.append(kinder);
                    }
                }
                return gruppe;
            };
            wurzel.append(gruppeBauen(auftrag.knoten || [], 1));
            const zeilen = sichtbar();
            if (!zeilen.some(el => el.tabIndex === 0) && zeilen[0])
                zeilen[0].tabIndex = 0;
        };
        const waehlen = (id, melden) => {
            if (id && !alle.has(id))
                return;
            gewaehlt = id;
            for (const zeile of wurzel.querySelectorAll('[data-baum-id]')) {
                const an = zeile.dataset['baumId'] === id;
                zeile.setAttribute('aria-selected', String(an));
                zeile.tabIndex = an ? 0 : -1;
            }
            if (melden && id)
                auftrag.gewaehltGeaendert?.(id);
        };
        const klappen = (id, wert) => {
            const k = alle.get(id);
            if (!k?.kinder?.length)
                return;
            const soll = wert ?? !offen.has(id);
            if (soll)
                offen.add(id);
            else
                offen.delete(id);
            zeichne();
            if (soll) {
                wurzel.querySelector(`[data-baum-id="${CSS.escape(id)}"]`)
                    ?.nextElementSibling?.classList.add('ru-baum-auf');
            }
            auftrag.offenGeaendert?.([...offen]);
            fokus(wurzel.querySelector(`[data-baum-id="${CSS.escape(id)}"]`) || undefined);
        };
        wurzel.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target.closest('[data-baum-id]') : null;
            if (!ziel)
                return;
            const id = ziel.dataset['baumId'];
            if (!id || ziel.getAttribute('aria-disabled') === 'true')
                return;
            if (e.target instanceof Element && e.target.closest('.ru-baum-knick')) {
                klappen(id);
                return;
            }
            waehlen(id, true);
            fokus(ziel);
        });
        wurzel.addEventListener('keydown', e => {
            const aktiv = e.target instanceof Element ? e.target.closest('[data-baum-id]') : null;
            if (!aktiv)
                return;
            const id = aktiv.dataset['baumId'];
            if (!id)
                return;
            const zeilen = sichtbar();
            const pos = zeilen.indexOf(aktiv);
            const k = alle.get(id);
            const hatKinder = !!k?.kinder?.length;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const d = e.key === 'ArrowDown' ? 1 : -1;
                fokus(zeilen[Math.max(0, Math.min(zeilen.length - 1, pos + d))]);
                return;
            }
            if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                fokus(e.key === 'Home' ? zeilen[0] : zeilen[zeilen.length - 1]);
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (hatKinder && !offen.has(id)) {
                    klappen(id, true);
                    return;
                }
                if (hatKinder) {
                    const neu = sichtbar();
                    const p = neu.findIndex(el => el.dataset['baumId'] === id);
                    fokus(neu[p + 1]);
                }
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (hatKinder && offen.has(id)) {
                    klappen(id, false);
                    return;
                }
                const elternId = eltern.get(id);
                if (elternId) {
                    fokus(wurzel.querySelector(`[data-baum-id="${CSS.escape(elternId)}"]`) || undefined);
                }
                return;
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (aktiv.getAttribute('aria-disabled') !== 'true') {
                    waehlen(id, true);
                    fokus(aktiv);
                }
            }
        });
        zeichne();
        const { aktionen, entf } = auftrag;
        if (aktionen && typeof Menue !== 'undefined') {
            Menue.aktionenBinden(wurzel, {
                auswahl: '[data-baum-id]',
                oeffnen: (el, wo) => aktionen(el.dataset['baumId'] || '', { ...wo, anker: el }),
                ...(entf ? { entf: (el) => entf(el.dataset['baumId'] || '', el) } : {})
            });
        }
        return {
            element: wurzel,
            gewaehlt: () => gewaehlt,
            waehlen: (id) => waehlen(id, false),
            offene: () => [...offen],
            oeffnen: (ids) => {
                offen.clear();
                ids.filter(id => alle.has(id)).forEach(id => offen.add(id));
                zeichne();
            }
        };
    };
    return { bauen };
})();
window.Baumansicht = Baumansicht;
