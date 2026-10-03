"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/zustandsknopf.ts (npm run bauen:ts). */
const Zustandsknopf = (() => {
    const ZEICHEN_LADEN = '↓';
    const ZEICHEN_OEFFNEN = '↗';
    const kurz = (fehler) => {
        const m = fehler instanceof Error ? fehler.message : String(fehler ?? '');
        const eine = m.split('\n')[0]?.trim() ?? '';
        if (!eine)
            return Zustand.text('fehler');
        return eine.length > 60 ? eine.slice(0, 57) + ' …' : eine;
    };
    const bauen = (auftrag) => {
        const art = auftrag.art || 'weiter';
        const fertigNach = auftrag.fertigNach ?? (auftrag.oeffnen ? 0 : 2500);
        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.className = 'ru-zk' + (auftrag.klasse ? ' ' + auftrag.klasse : '');
        knopf.dataset['art'] = art;
        const zeichen = document.createElement('span');
        zeichen.className = 'ru-zk-zeichen';
        zeichen.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.className = 'ru-zk-text';
        text.setAttribute('aria-live', 'polite');
        const balken = document.createElement('span');
        balken.className = 'ru-zk-balken';
        balken.setAttribute('aria-hidden', 'true');
        balken.append(document.createElement('i'));
        knopf.append(zeichen, text, balken);
        let jetzt = 'bereit';
        let aufforderung = false;
        let zeitgeber = null;
        const bereitZeichen = () => {
            if (art === 'laden')
                return ZEICHEN_LADEN;
            if (auftrag.zeichen && typeof Register !== 'undefined' && Register.symbole?.hat?.(auftrag.zeichen))
                return Register.symbole.alsSvg(auftrag.zeichen, 16);
            return '';
        };
        const stellen = (z, satz, anteil) => {
            if (zeitgeber) {
                clearTimeout(zeitgeber);
                zeitgeber = null;
            }
            jetzt = z;
            knopf.dataset['zustand'] = z;
            knopf.setAttribute('aria-busy', z === 'arbeitet' ? 'true' : 'false');
            knopf.classList.toggle('ru-zk-aufforderung', aufforderung);
            if (z === 'bereit') {
                zeichen.innerHTML = bereitZeichen();
            }
            else if (aufforderung) {
                zeichen.textContent = ZEICHEN_OEFFNEN;
            }
            else if (z === 'arbeitet') {
                zeichen.replaceChildren(Zustand.aktivitaet(art === 'erzeugen' ? 'ki' : 'neutral'));
            }
            else {
                zeichen.textContent = Zustand.zeichen(z === 'fertig' ? 'fertig' : 'fehler');
            }
            zeichen.hidden = zeichen.innerHTML === '';
            text.textContent = satz;
            if (typeof anteil === 'number' && Number.isFinite(anteil)) {
                const a = Math.max(0, Math.min(1, anteil));
                balken.classList.add('bestimmt');
                balken.style.setProperty('--ru-zk-anteil', (a * 100).toFixed(1) + '%');
            }
            else {
                balken.classList.remove('bestimmt');
                balken.style.removeProperty('--ru-zk-anteil');
            }
        };
        const bereit = () => { aufforderung = false; stellen('bereit', auftrag.texte.bereit); };
        const fertig = () => {
            if (auftrag.oeffnen) {
                const zurAufforderung = () => {
                    aufforderung = true;
                    stellen('fertig', auftrag.texte.fertig ?? 'Öffnen');
                };
                if (auftrag.texte.geschafft) {
                    aufforderung = false;
                    stellen('fertig', auftrag.texte.geschafft);
                    zeitgeber = setTimeout(zurAufforderung, 1200);
                }
                else
                    zurAufforderung();
                return;
            }
            aufforderung = false;
            stellen('fertig', auftrag.texte.fertig ?? Zustand.text('fertig'));
            if (fertigNach > 0)
                zeitgeber = setTimeout(bereit, fertigNach);
        };
        const starten = () => {
            aufforderung = false;
            stellen('arbeitet', auftrag.texte.arbeitet);
            let zusage;
            try {
                zusage = Promise.resolve(auftrag.aktion());
            }
            catch (fehler) {
                zusage = Promise.reject(fehler);
            }
            zusage.then(ergebnis => {
                if (jetzt !== 'arbeitet')
                    return;
                if (ergebnis === false)
                    stellen('fehler', auftrag.texte.fehler ?? Zustand.text('fehler'));
                else
                    fertig();
            }, fehler => {
                if (jetzt !== 'arbeitet')
                    return;
                stellen('fehler', auftrag.texte.fehler ?? kurz(fehler));
            });
        };
        knopf.addEventListener('click', () => {
            if (jetzt === 'arbeitet')
                return;
            if (jetzt === 'fertig' && aufforderung && auftrag.oeffnen) {
                auftrag.oeffnen();
                bereit();
                return;
            }
            starten();
        });
        bereit();
        return {
            element: knopf,
            zustand: () => jetzt,
            setzen: (z, satz, anteil) => {
                if (z === 'bereit') {
                    bereit();
                    return;
                }
                if (z === 'fertig' && satz === undefined) {
                    fertig();
                    return;
                }
                aufforderung = false;
                const standard = z === 'arbeitet' ? auftrag.texte.arbeitet
                    : z === 'fertig' ? (auftrag.texte.fertig ?? Zustand.text('fertig'))
                        : (auftrag.texte.fehler ?? Zustand.text('fehler'));
                stellen(z, satz ?? standard, anteil);
            }
        };
    };
    return { bauen };
})();
window.Zustandsknopf = Zustandsknopf;
